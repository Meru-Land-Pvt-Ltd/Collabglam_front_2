"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { adminGet, adminPost } from "@/lib/api";

type ApiState =
  | {
      type: "success" | "error" | "info";
      text: string;
    }
  | null;

type AdminOption = {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
};

type ReviewRow = {
  _id: string;
  prospectId: {
    _id: string;
    companyName?: string;
    primaryContact?: {
      name?: string;
      email?: string;
    };
    reply?: {
      snippet?: string;
      subject?: string;
    };
    stage?: string;
  } | null;
  sdrId?: {
    _id?: string;
    name?: string;
    email?: string;
  } | null;
  RHId?: {
    _id?: string;
    name?: string;
    email?: string;
  } | null;
  assignedBmeId?: {
    _id?: string;
    name?: string;
    email?: string;
  } | null;
  latestReplySnippet?: string;
  latestReplySubject?: string;
  reviewStatus?: string;
  disposition?: string;
  reviewerNotes?: string;
  createdAt?: string;
};

type ThreadRow = {
  _id: string;
  prospectId?: {
    _id?: string;
  } | null;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getAdminLabel(admin: any) {
  if (!admin) return "—";
  if (typeof admin === "string") return admin;
  if (admin.name && admin.email) return `${admin.name} (${admin.email})`;
  return admin.name || admin.email || admin._id || "—";
}

function getStagePillClasses(stage?: string) {
  const value = String(stage || "").toLowerCase();

  if (value.includes("replied")) return "bg-blue-50 text-blue-700 border-blue-200";
  if (value.includes("assigned_to_bme")) return "bg-violet-50 text-violet-700 border-violet-200";
  if (value.includes("assigned_to_ime")) return "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200";
  if (value.includes("unqualified")) return "bg-rose-50 text-rose-700 border-rose-200";
  if (value.includes("qualified")) return "bg-emerald-50 text-emerald-700 border-emerald-200";

  return "bg-slate-100 text-slate-600 border-slate-200";
}

function parseAdminRows(payload: any): AdminOption[] {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];

  return rows
    .filter(Boolean)
    .map((item: any) => ({
      _id: String(item?._id || ""),
      name: item?.name || "",
      email: item?.email || "",
      role: item?.role || "",
    }))
    .filter((item: AdminOption) => item._id);
}

function parsePendingReplies(payload: any): ReviewRow[] {
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows.map((item: any) => ({
    _id: String(item?._id || ""),
    prospectId: item?.prospectId
      ? {
          _id: String(item.prospectId?._id || ""),
          companyName: item.prospectId?.companyName || "",
          primaryContact: item.prospectId?.primaryContact || {},
          reply: item.prospectId?.reply || {},
          stage: item.prospectId?.stage || "",
        }
      : null,
    sdrId: item?.sdrId || null,
    RHId: item?.RHId || null,
    assignedBmeId: item?.assignedBmeId || null,
    latestReplySnippet: item?.latestReplySnippet || "",
    latestReplySubject: item?.latestReplySubject || "",
    reviewStatus: item?.reviewStatus || "",
    disposition: item?.disposition || "",
    reviewerNotes: item?.reviewerNotes || "",
    createdAt: item?.createdAt || "",
  }));
}

function parseThreads(payload: any): ThreadRow[] {
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows.map((item: any) => ({
    _id: String(item?._id || ""),
    prospectId: item?.prospectId
      ? {
          _id: String(item.prospectId?._id || ""),
        }
      : null,
  }));
}

function MetricCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  tone?: "slate" | "blue" | "violet" | "rose";
}) {
  const tones = {
    slate: "bg-slate-50 border-slate-200 text-slate-900",
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    violet: "bg-violet-50 border-violet-200 text-violet-900",
    rose: "bg-rose-50 border-rose-200 text-rose-900",
  };

  return (
    <div className={cx("rounded-2xl border p-4", tones[tone])}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

export default function ReviewQueuePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<ApiState>(null);

  const [pendingReplies, setPendingReplies] = useState<ReviewRow[]>([]);
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [bmeOptions, setBmeOptions] = useState<AdminOption[]>([]);
  const [actorRole, setActorRole] = useState("");

  const [selectedReviewId, setSelectedReviewId] = useState("");
  const [selectedBmeId, setSelectedBmeId] = useState("");
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [submittingKey, setSubmittingKey] = useState("");
  const [search, setSearch] = useState("");

  const filteredReplies = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return pendingReplies;

    return pendingReplies.filter((item) => {
      const haystack = [
        item.prospectId?.companyName,
        item.prospectId?.primaryContact?.name,
        item.prospectId?.primaryContact?.email,
        item.latestReplySubject,
        item.latestReplySnippet,
        item.prospectId?.stage,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [pendingReplies, search]);

  const selectedReview = useMemo(
    () =>
      filteredReplies.find((item) => item._id === selectedReviewId) ||
      pendingReplies.find((item) => item._id === selectedReviewId) ||
      null,
    [filteredReplies, pendingReplies, selectedReviewId]
  );

  const selectedThreadId = useMemo(() => {
    const prospectId = String(selectedReview?.prospectId?._id || "");
    if (!prospectId) return "";

    const match = threads.find(
      (item) => String(item?.prospectId?._id || "") === prospectId
    );

    return match?._id || "";
  }, [selectedReview, threads]);

  const repliedCount = useMemo(
    () =>
      pendingReplies.filter((item) =>
        String(item?.prospectId?.stage || "").toLowerCase().includes("reply")
      ).length,
    [pendingReplies]
  );

  async function loadBmeOptions(review: ReviewRow | null, currentActorRole: string) {
    try {
      const params: Record<string, string> = { role: "bme" };

      // super admin => all BME
      // others => by Revenue Head ID
      if (currentActorRole !== "super_admin" && review?.RHId?._id) {
        params.RHId = String(review.RHId._id);
      }

      const payload: any = await adminGet("/admins/get-executive-list", params);
      setBmeOptions(parseAdminRows(payload));
    } catch (error) {
      setBmeOptions([]);
    }
  }

  async function loadPage(showLoader = true) {
    try {
      if (showLoader) setLoading(true);
      setMessage(null);

      const [repliesPayload, threadsPayload, mePayload] = await Promise.all([
        adminGet("/outreach/replies/pending"),
        adminGet("/outreach/threads"),
        adminGet("/admins/me"),
      ]);

      const nextReplies = parsePendingReplies(repliesPayload);
      setPendingReplies(nextReplies);
      setThreads(parseThreads(threadsPayload));

      const nextActorRole = String(mePayload?.role || "").toLowerCase();
      setActorRole(nextActorRole);

      const prospectIdFromQuery = String(searchParams.get("prospectId") || "");
      let nextSelectedId = "";

      if (prospectIdFromQuery) {
        const match = nextReplies.find(
          (item) => String(item?.prospectId?._id || "") === prospectIdFromQuery
        );
        if (match?._id) nextSelectedId = match._id;
      }

      if (!nextSelectedId && selectedReviewId && nextReplies.some((item) => item._id === selectedReviewId)) {
        nextSelectedId = selectedReviewId;
      }

      if (!nextSelectedId) {
        nextSelectedId = nextReplies[0]?._id || "";
      }

      setSelectedReviewId(nextSelectedId);

      const selected =
        nextReplies.find((item) => item._id === nextSelectedId) || null;

      await loadBmeOptions(selected, nextActorRole);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to load review queue",
      });
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  useEffect(() => {
    loadPage(true);
  }, []);

  useEffect(() => {
    if (selectedReview) {
      setReviewerNotes(selectedReview.reviewerNotes || "");
      setSelectedBmeId(selectedReview.assignedBmeId?._id || "");
    } else {
      setReviewerNotes("");
      setSelectedBmeId("");
    }
  }, [selectedReview]);

  useEffect(() => {
    if (!selectedReview) {
      setBmeOptions([]);
      return;
    }

    if (!actorRole) return;
    loadBmeOptions(selectedReview, actorRole);
  }, [selectedReviewId, actorRole]);

  async function handleAssignToBme() {
    try {
      if (!selectedReview?._id) {
        throw new Error("Select a review first");
      }

      if (!selectedBmeId) {
        throw new Error("Select a BME");
      }

      setSubmittingKey("assign");
      setMessage(null);

      const payload: any = await adminPost(
        `/outreach/replies/${selectedReview._id}/assign-bme`,
        {
          assignedBmeId: selectedBmeId,
          reviewerNotes: reviewerNotes.trim(),
        }
      );

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to assign BME");
      }

      setMessage({
        type: "success",
        text: payload?.message || "Reply assigned to BME successfully",
      });

      setSelectedBmeId("");
      setReviewerNotes("");
      await loadPage(false);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to assign BME",
      });
    } finally {
      setSubmittingKey("");
    }
  }

  async function handleReject() {
    try {
      if (!selectedReview?._id) {
        throw new Error("Select a review first");
      }

      setSubmittingKey("reject");
      setMessage(null);

      const payload: any = await adminPost(
        `/outreach/replies/${selectedReview._id}/reject`,
        {
          disposition: "not_relevant",
          reviewerNotes: reviewerNotes.trim(),
        }
      );

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to reject reply");
      }

      setMessage({
        type: "success",
        text: payload?.message || "Reply marked unqualified",
      });

      setReviewerNotes("");
      await loadPage(false);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to reject reply",
      });
    } finally {
      setSubmittingKey("");
    }
  }

  const canAssign = Boolean(selectedReview && selectedBmeId && submittingKey === "");
  const canReject = Boolean(selectedReview && submittingKey === "");

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={cx(
            "rounded-2xl border px-4 py-3 text-sm",
            message.type === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
            message.type === "error" && "border-rose-200 bg-rose-50 text-rose-700",
            message.type === "info" && "border-sky-200 bg-sky-50 text-sky-700"
          )}
        >
          {message.text}
        </div>
      )}

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Revenue Head Workspace
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Review Queue</h2>
            <p className="mt-1 text-sm text-slate-500">
              Review inbound replies, check summary, and assign qualified conversations to BME.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MetricCard label="Pending Reviews" value={pendingReplies.length} tone="slate" />
            <MetricCard label="Replied Leads" value={repliedCount} tone="blue" />
            <MetricCard label="BME Options" value={bmeOptions.length} tone="violet" />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Queue Items</p>
                <p className="mt-1 text-xs text-slate-500">Pending RH decisions</p>
              </div>
              <div className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {filteredReplies.length}
              </div>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brand, contact, subject..."
              className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
            />
          </div>

          <div className="max-h-[760px] overflow-y-auto p-4">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                Loading review queue...
              </div>
            ) : filteredReplies.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                No review item found.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReplies.map((item) => {
                  const active = item._id === selectedReviewId;

                  return (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => setSelectedReviewId(item._id)}
                      className={cx(
                        "w-full rounded-2xl border p-4 text-left transition",
                        active
                          ? "border-blue-300 bg-blue-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {item.prospectId?.companyName || "—"}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {item.prospectId?.primaryContact?.name || "—"} · {item.prospectId?.primaryContact?.email || "—"}
                          </p>
                        </div>

                        <span
                          className={cx(
                            "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                            getStagePillClasses(item.prospectId?.stage)
                          )}
                        >
                          {item.prospectId?.stage || "—"}
                        </span>
                      </div>

                      <p className="mt-3 truncate text-sm font-medium text-slate-800">
                        {item.latestReplySubject || item.prospectId?.reply?.subject || "No subject"}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {item.latestReplySnippet || item.prospectId?.reply?.snippet || "—"}
                      </p>

                      <p className="mt-3 text-[11px] text-slate-400">
                        Received: {formatDateTime(item.createdAt)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6">
              <p className="text-sm font-semibold text-slate-900">Selected Review</p>
              <p className="mt-1 text-xs text-slate-500">
                Pick a queue item from the left to review and assign.
              </p>
            </div>

            {selectedReview ? (
              <div className="p-6 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Brand
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {selectedReview.prospectId?.companyName || "—"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {selectedReview.prospectId?.primaryContact?.name || "—"} · {selectedReview.prospectId?.primaryContact?.email || "—"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Stage
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={cx(
                          "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                          getStagePillClasses(selectedReview.prospectId?.stage)
                        )}
                      >
                        {selectedReview.prospectId?.stage || "—"}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatShortDate(selectedReview.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      SDR
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {getAdminLabel(selectedReview.sdrId)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Revenue Head
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {getAdminLabel(selectedReview.RHId)}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Latest Reply
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    {selectedReview.latestReplySubject || selectedReview.prospectId?.reply?.subject || "No subject"}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {selectedReview.latestReplySnippet || selectedReview.prospectId?.reply?.snippet || "—"}
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        selectedThreadId
                          ? `/admin/instantly-crm/replies?threadId=${selectedThreadId}`
                          : `/admin/instantly-crm/replies?prospectId=${selectedReview.prospectId?._id || ""}`
                      )
                    }
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Open Conversation in Replies
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-10 text-center text-sm text-slate-500">
                Select a review item from the left.
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6">
              <p className="text-sm font-semibold text-slate-900">Assign BME</p>
              <p className="mt-1 text-xs text-slate-500">
                Revenue Head gets BMEs by RH. Superadmin sees all BMEs.
              </p>
            </div>

            <div className="p-6 space-y-4">
              {!selectedReview && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No review selected yet.
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">
                  BME
                </label>
                <select
                  value={selectedBmeId}
                  onChange={(e) => setSelectedBmeId(e.target.value)}
                  disabled={!selectedReview || bmeOptions.length === 0}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">
                    {bmeOptions.length === 0 ? "No BME available" : "Select BME"}
                  </option>
                  {bmeOptions.map((admin) => (
                    <option key={admin._id} value={admin._id}>
                      {getAdminLabel(admin)}
                    </option>
                  ))}
                </select>

                {bmeOptions.length === 0 && (
                  <p className="mt-2 text-xs text-rose-600">
                    No BME found for this review context.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">
                  Reviewer Notes
                </label>
                <textarea
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  rows={5}
                  placeholder="Add internal review notes for the handoff..."
                  disabled={!selectedReview}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Selected Brand
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedReview?.prospectId?.companyName || "—"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Selected BME
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedBmeId
                      ? getAdminLabel(bmeOptions.find((item) => item._id === selectedBmeId))
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={!canReject}
                  className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-medium text-rose-700 disabled:opacity-50"
                >
                  {submittingKey === "reject" ? "Rejecting..." : "Mark Unqualified"}
                </button>

                <button
                  type="button"
                  onClick={handleAssignToBme}
                  disabled={!canAssign}
                  className="rounded-2xl bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                >
                  {submittingKey === "assign" ? "Assigning..." : "Assign to BME"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}