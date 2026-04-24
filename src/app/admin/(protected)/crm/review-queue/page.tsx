"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { adminGet, adminPost } from "@/lib/api";

// --- Types ---
type ApiState = { type: "success" | "error" | "info"; text: string } | null;

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
    primaryContact?: { name?: string; email?: string };
    reply?: { snippet?: string; subject?: string };
    stage?: string;
  } | null;
  sdrId?: { _id?: string; name?: string; email?: string } | null;
  RHId?: { _id?: string; name?: string; email?: string } | null;
  assignedBmeId?: { _id?: string; name?: string; email?: string } | null;
  latestReplySnippet?: string;
  latestReplySubject?: string;
  reviewStatus?: string;
  disposition?: string;
  reviewerNotes?: string;
  createdAt?: string;
};

type ThreadRow = {
  _id: string;
  prospectId?: { _id?: string } | null;
};

// --- Utilities ---
function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatShortDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
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
  if (value.includes("unqualified")) return "bg-red-50 text-red-700 border-red-200";
  if (value.includes("qualified")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
}

// --- Parsers ---
function parseAdminRows(payload: any): AdminOption[] {
  const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
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
    prospectId: item?.prospectId ? { _id: String(item.prospectId?._id || "") } : null,
  }));
}

// --- Components ---
function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col justify-center rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

// --- Main Page ---
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
      ].filter(Boolean).join(" ").toLowerCase();

      return haystack.includes(query);
    });
  }, [pendingReplies, search]);

  const selectedReview = useMemo(
    () => filteredReplies.find((item) => item._id === selectedReviewId) || pendingReplies.find((item) => item._id === selectedReviewId) || null,
    [filteredReplies, pendingReplies, selectedReviewId]
  );

  const selectedThreadId = useMemo(() => {
    const prospectId = String(selectedReview?.prospectId?._id || "");
    if (!prospectId) return "";
    const match = threads.find((item) => String(item?.prospectId?._id || "") === prospectId);
    return match?._id || "";
  }, [selectedReview, threads]);

  const repliedCount = useMemo(() => pendingReplies.filter((item) => String(item?.prospectId?.stage || "").toLowerCase().includes("reply")).length, [pendingReplies]);

  async function loadBmeOptions(review: ReviewRow | null, currentActorRole: string) {
    try {
      const params: Record<string, string> = { role: "bme" };
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
        const match = nextReplies.find((item) => String(item?.prospectId?._id || "") === prospectIdFromQuery);
        if (match?._id) nextSelectedId = match._id;
      }
      if (!nextSelectedId && selectedReviewId && nextReplies.some((item) => item._id === selectedReviewId)) {
        nextSelectedId = selectedReviewId;
      }
      if (!nextSelectedId) nextSelectedId = nextReplies[0]?._id || "";

      setSelectedReviewId(nextSelectedId);
      const selected = nextReplies.find((item) => item._id === nextSelectedId) || null;
      await loadBmeOptions(selected, nextActorRole);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to load review queue" });
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  useEffect(() => { loadPage(true); }, []);

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
    if (!selectedReview || !actorRole) return;
    loadBmeOptions(selectedReview, actorRole);
  }, [selectedReviewId, actorRole]);

  async function handleAssignToBme() {
    try {
      if (!selectedReview?._id) throw new Error("Select a review first");
      if (!selectedBmeId) throw new Error("Select a BME");

      setSubmittingKey("assign");
      setMessage(null);

      const payload: any = await adminPost(`/outreach/replies/${selectedReview._id}/assign-bme`, {
        assignedBmeId: selectedBmeId,
        reviewerNotes: reviewerNotes.trim(),
      });

      if (payload?.success === false) throw new Error(payload?.message || "Failed to assign BME");

      setMessage({ type: "success", text: payload?.message || "Reply assigned to BME successfully" });
      setSelectedBmeId("");
      setReviewerNotes("");
      await loadPage(false);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to assign BME" });
    } finally {
      setSubmittingKey("");
    }
  }

  async function handleReject() {
    try {
      if (!selectedReview?._id) throw new Error("Select a review first");

      setSubmittingKey("reject");
      setMessage(null);

      const payload: any = await adminPost(`/outreach/replies/${selectedReview._id}/reject`, {
        disposition: "not_relevant",
        reviewerNotes: reviewerNotes.trim(),
      });

      if (payload?.success === false) throw new Error(payload?.message || "Failed to reject reply");

      setMessage({ type: "success", text: payload?.message || "Reply marked unqualified" });
      setReviewerNotes("");
      await loadPage(false);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to reject reply" });
    } finally {
      setSubmittingKey("");
    }
  }

  const canAssign = Boolean(selectedReview && selectedBmeId && submittingKey === "");
  const canReject = Boolean(selectedReview && submittingKey === "");

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col space-y-4 font-sans">
      {message && (
        <div
          className={cx(
            "rounded-md border px-4 py-3 text-sm font-medium",
            message.type === "success" && "border-green-200 bg-green-50 text-green-800",
            message.type === "error" && "border-red-200 bg-red-50 text-red-800",
            message.type === "info" && "border-blue-200 bg-blue-50 text-blue-800"
          )}
        >
          {message.text}
        </div>
      )}

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Pending Reviews" value={pendingReplies.length} />
        <MetricCard label="Replied Leads" value={repliedCount} />
        <MetricCard label="BME Options" value={bmeOptions.length} />
      </div>

      {/* Unified Split Container */}
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        
        {/* Left Pane: Queue List */}
        <aside className="flex w-full flex-col border-r border-gray-200 bg-gray-50/30 xl:w-[400px]">
          <div className="border-b border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900">Review Queue</h2>
            <div className="mt-3 relative">
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search brand, contact, subject..."
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-gray-500">Loading queue...</div>
            ) : filteredReplies.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">Queue is empty.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {filteredReplies.map((item) => {
                  const active = item._id === selectedReviewId;
                  const companyName = item.prospectId?.companyName || "Unknown Company";
                  const contactName = item.prospectId?.primaryContact?.name || "Unknown Contact";

                  return (
                    <li key={item._id}>
                      <button
                        onClick={() => setSelectedReviewId(item._id)}
                        className={cx(
                          "w-full text-left p-4 transition-colors hover:bg-gray-100/50",
                          active ? "bg-gray-100 relative" : "bg-white"
                        )}
                      >
                        {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1a1a1a]" />}
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-[#1a1a1a]">
                            {getInitials(companyName)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-start mb-0.5">
                              <p className="truncate text-sm font-semibold text-gray-900">{companyName}</p>
                              <span className="shrink-0 text-xs text-gray-500 ml-2">{formatShortDate(item.createdAt)}</span>
                            </div>
                            <p className="truncate text-xs text-gray-600">{contactName}</p>
                            <p className="mt-1.5 truncate text-sm font-medium text-gray-800">
                              {item.latestReplySubject || item.prospectId?.reply?.subject || "(No subject)"}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              {item.latestReplySnippet || item.prospectId?.reply?.snippet || "—"}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* Right Pane: Review & Action */}
        <main className="flex min-w-0 flex-1 flex-col bg-white">
          {!selectedReview ? (
            <div className="flex h-full items-center justify-center p-8 text-gray-400 text-sm">
              <p>Select an item from the queue to review</p>
            </div>
          ) : (
            <>
              {/* Review Header */}
              <div className="flex shrink-0 items-start justify-between border-b border-gray-200 px-6 py-4 bg-white">
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedReview.prospectId?.companyName || "Unknown Company"}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                    <span>{selectedReview.prospectId?.primaryContact?.name || "—"}</span>
                    <span>&bull;</span>
                    <a href={`mailto:${selectedReview.prospectId?.primaryContact?.email}`} className="text-[#1a1a1a] font-medium hover:underline">
                      {selectedReview.prospectId?.primaryContact?.email || "—"}
                    </a>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={cx("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium", getStagePillClasses(selectedReview.prospectId?.stage))}>
                    {selectedReview.prospectId?.stage?.replace(/_/g, ' ') || "No Stage"}
                  </span>
                  <button
                    onClick={() => router.push(selectedThreadId ? `/admin/instantly-crm/replies?threadId=${selectedThreadId}` : `/admin/instantly-crm/replies?prospectId=${selectedReview.prospectId?._id || ""}`)}
                    className="text-xs font-medium text-gray-500 hover:text-[#1a1a1a] underline underline-offset-2 flex items-center gap-1"
                  >
                    Open Full Thread
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* scrollable Body: Metadata & Email Snapshot */}
              <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 space-y-6">
                
                {/* Meta Grid */}
                <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
                  <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">SDR Handler</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{getAdminLabel(selectedReview.sdrId)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Revenue Head</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{getAdminLabel(selectedReview.RHId)}</p>
                  </div>
                </div>

                {/* Email Snapshot */}
                <div className="max-w-4xl mx-auto overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">Latest Lead Reply</p>
                      <span className="text-xs text-gray-500">{formatDateTime(selectedReview.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-900">
                      <span className="font-medium text-gray-500 mr-2">Subject:</span>
                      {selectedReview.latestReplySubject || selectedReview.prospectId?.reply?.subject || "(No subject)"}
                    </p>
                  </div>
                  <div className="px-5 py-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {selectedReview.latestReplySnippet || selectedReview.prospectId?.reply?.snippet || "—"}
                  </div>
                </div>

              </div>

              {/* Action Form Footer */}
              <div className="shrink-0 border-t border-gray-200 bg-white p-6">
                <div className="max-w-4xl mx-auto">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Decision & Assignment</h4>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* BME Selection */}
                    <div className="w-full sm:w-1/3">
                      <label className="mb-1.5 block text-xs font-medium text-gray-700">Assign to BME</label>
                      <select
                        value={selectedBmeId}
                        onChange={(e) => setSelectedBmeId(e.target.value)}
                        disabled={bmeOptions.length === 0}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a] disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        <option value="">{bmeOptions.length === 0 ? "No BME available" : "Select BME..."}</option>
                        {bmeOptions.map((admin) => (
                          <option key={admin._id} value={admin._id}>{getAdminLabel(admin)}</option>
                        ))}
                      </select>
                      {bmeOptions.length === 0 && <p className="mt-1 text-[11px] text-red-600">No executives found.</p>}
                    </div>

                    {/* Notes */}
                    <div className="w-full flex-1">
                      <label className="mb-1.5 block text-xs font-medium text-gray-700">Reviewer Notes (Internal)</label>
                      <textarea
                        value={reviewerNotes}
                        onChange={(e) => setReviewerNotes(e.target.value)}
                        rows={2}
                        placeholder="Add context for the handoff..."
                        className="w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={!canReject}
                      className="inline-flex items-center justify-center rounded-md border border-[#1a1a1a] bg-white px-4 py-2 text-sm font-medium text-[#1a1a1a] shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                    >
                      {submittingKey === "reject" ? "Rejecting..." : "Mark Unqualified"}
                    </button>
                    <button
                      type="button"
                      onClick={handleAssignToBme}
                      disabled={!canAssign}
                      className="inline-flex items-center justify-center rounded-md bg-[#1a1a1a] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                    >
                      {submittingKey === "assign" ? "Assigning..." : "Assign to BME"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}