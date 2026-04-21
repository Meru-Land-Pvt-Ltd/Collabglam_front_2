"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { adminGet, adminPost } from "@/lib/api";

type ApiState =
  | {
      type: "success" | "error" | "info";
      text: string;
    }
  | null;

type ThreadRow = {
  _id: string;
  ownerRole?: string;
  ownerId?: string;
  subject?: string;
  status?: string;
  brandEmail?: string;
  brandName?: string;
  instantlyThreadId?: string;
  prospectId?: {
    _id?: string;
    companyName?: string;
    primaryContact?: {
      name?: string;
      email?: string;
    };
    stage?: string;
  } | null;
  updatedAt?: string;
  lastMessageAt?: string;
};

type ThreadMessage = {
  _id: string;
  direction: "inbound" | "outbound";
  from?: string;
  to?: string[];
  subject?: string;
  bodyText?: string;
  sentAt?: string;
  receivedAt?: string;
  createdAt?: string;
};

type ThreadDetailResponse = {
  thread: ThreadRow | null;
  messages: ThreadMessage[];
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

function formatShortDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
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

function getStatusPillClasses(status?: string) {
  const value = String(status || "").toLowerCase();

  if (value === "waiting_on_us") return "bg-amber-50 text-amber-700 border-amber-200";
  if (value === "waiting_on_brand") return "bg-blue-50 text-blue-700 border-blue-200";
  if (value === "closed") return "bg-slate-100 text-slate-600 border-slate-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

function getDirectionClasses(direction?: string) {
  if (direction === "inbound") {
    return "ml-0 mr-10 border-blue-200 bg-blue-50";
  }
  return "ml-10 mr-0 border-slate-200 bg-white";
}

function getOwnerLabel(role?: string) {
  const value = String(role || "").toLowerCase();
  if (value === "revenue_head") return "RH";
  if (value === "bme") return "BME";
  if (value === "ime") return "IME";
  if (value === "sdr") return "SDR";
  return "—";
}

function parseThreads(payload: any): ThreadRow[] {
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows.map((item: any) => ({
    _id: String(item?._id || ""),
    ownerRole: item?.ownerRole || "",
    ownerId: item?.ownerId || "",
    subject: item?.subject || "",
    status: item?.status || "",
    brandEmail: item?.brandEmail || "",
    brandName: item?.brandName || "",
    instantlyThreadId: item?.instantlyThreadId || "",
    prospectId: item?.prospectId
      ? {
          _id: String(item.prospectId?._id || ""),
          companyName: item.prospectId?.companyName || "",
          primaryContact: item.prospectId?.primaryContact || {},
          stage: item.prospectId?.stage || "",
        }
      : null,
    updatedAt: item?.updatedAt || "",
    lastMessageAt: item?.lastMessageAt || "",
  }));
}

function parseThreadDetail(payload: any): ThreadDetailResponse {
  return {
    thread: payload?.thread
      ? {
          _id: String(payload.thread?._id || ""),
          ownerRole: payload.thread?.ownerRole || "",
          ownerId: payload.thread?.ownerId || "",
          subject: payload.thread?.subject || "",
          status: payload.thread?.status || "",
          brandEmail: payload.thread?.brandEmail || "",
          brandName: payload.thread?.brandName || "",
          instantlyThreadId: payload.thread?.instantlyThreadId || "",
          prospectId: payload.thread?.prospectId
            ? {
                _id: String(payload.thread.prospectId?._id || ""),
                companyName: payload.thread.prospectId?.companyName || "",
                primaryContact: payload.thread.prospectId?.primaryContact || {},
                stage: payload.thread.prospectId?.stage || "",
              }
            : null,
          updatedAt: payload.thread?.updatedAt || "",
          lastMessageAt: payload.thread?.lastMessageAt || "",
        }
      : null,
    messages: Array.isArray(payload?.messages)
      ? payload.messages.map((item: any) => ({
          _id: String(item?._id || ""),
          direction: item?.direction || "inbound",
          from: item?.from || "",
          to: Array.isArray(item?.to) ? item.to : [],
          subject: item?.subject || "",
          bodyText: item?.bodyText || "",
          sentAt: item?.sentAt || "",
          receivedAt: item?.receivedAt || "",
          createdAt: item?.createdAt || "",
        }))
      : [],
  };
}

function MetricCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  tone?: "slate" | "blue" | "amber" | "violet";
}) {
  const tones = {
    slate: "bg-slate-50 border-slate-200 text-slate-900",
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    violet: "bg-violet-50 border-violet-200 text-violet-900",
  };

  return (
    <div className={cx("rounded-2xl border p-4", tones[tone])}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

export default function RepliesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<ApiState>(null);
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadDetail, setThreadDetail] = useState<ThreadDetailResponse>({
    thread: null,
    messages: [],
  });

  const [search, setSearch] = useState("");
  const [composerSubject, setComposerSubject] = useState("");
  const [composerBody, setComposerBody] = useState("");
  const [submittingKey, setSubmittingKey] = useState("");

  const filteredThreads = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return threads;

    return threads.filter((item) => {
      const haystack = [
        item.subject,
        item.brandName,
        item.brandEmail,
        item.prospectId?.companyName,
        item.prospectId?.primaryContact?.name,
        item.prospectId?.primaryContact?.email,
        item.ownerRole,
        item.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [threads, search]);

  const selectedThread = useMemo(
    () =>
      filteredThreads.find((item) => item._id === selectedThreadId) ||
      threads.find((item) => item._id === selectedThreadId) ||
      null,
    [filteredThreads, threads, selectedThreadId]
  );

  const waitingOnUsCount = useMemo(
    () => threads.filter((item) => item.status === "waiting_on_us").length,
    [threads]
  );

  const waitingOnBrandCount = useMemo(
    () => threads.filter((item) => item.status === "waiting_on_brand").length,
    [threads]
  );

  const replyBlocked = false;

  async function loadPage(showLoader = true) {
    try {
      if (showLoader) setLoading(true);
      setMessage(null);

      const threadsPayload: any = await adminGet("/outreach/threads");
      const nextThreads = parseThreads(threadsPayload);
      setThreads(nextThreads);

      const threadIdFromQuery = String(searchParams.get("threadId") || "");
      const prospectIdFromQuery = String(searchParams.get("prospectId") || "");

      setSelectedThreadId((prev) => {
        if (threadIdFromQuery && nextThreads.some((t) => t._id === threadIdFromQuery)) {
          return threadIdFromQuery;
        }

        if (prospectIdFromQuery) {
          const match = nextThreads.find(
            (item) => String(item?.prospectId?._id || "") === prospectIdFromQuery
          );
          if (match?._id) return match._id;
        }

        if (prev && nextThreads.some((item) => item._id === prev)) return prev;
        return nextThreads[0]?._id || "";
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to load replies",
      });
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  async function loadSelectedThread() {
    try {
      if (!selectedThreadId) {
        setThreadDetail({ thread: null, messages: [] });
        return;
      }

      setThreadLoading(true);
      const payload: any = await adminGet(`/outreach/threads/${selectedThreadId}`);
      const parsed = parseThreadDetail(payload);

      setThreadDetail(parsed);
      setComposerSubject(parsed.thread?.subject || "");
    } catch (error) {
      setThreadDetail({ thread: null, messages: [] });
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to load conversation",
      });
    } finally {
      setThreadLoading(false);
    }
  }

  useEffect(() => {
    loadPage(true);
  }, []);

  useEffect(() => {
    loadSelectedThread();
  }, [selectedThreadId]);

  async function handleReply() {
    try {
      if (!selectedThreadId) {
        throw new Error("Select a conversation first");
      }

      if (!composerBody.trim()) {
        throw new Error("Reply body is required");
      }

      setSubmittingKey("reply");
      setMessage(null);

      const payload: any = await adminPost(`/outreach/threads/${selectedThreadId}/reply`, {
        subject: composerSubject.trim(),
        bodyText: composerBody.trim(),
      });

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to send reply");
      }

      setComposerBody("");
      setMessage({
        type: "success",
        text: payload?.message || "Reply sent successfully",
      });

      await loadSelectedThread();
      await loadPage(false);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to send reply",
      });
    } finally {
      setSubmittingKey("");
    }
  }

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
              Conversation Workspace
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Replies</h2>
            <p className="mt-1 text-sm text-slate-500">
              View and reply inside active conversation threads only.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MetricCard label="Total Threads" value={threads.length} tone="slate" />
            <MetricCard label="Waiting on Us" value={waitingOnUsCount} tone="amber" />
            <MetricCard label="Waiting on Brand" value={waitingOnBrandCount} tone="blue" />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Threads</p>
                <p className="mt-1 text-xs text-slate-500">All reply conversations</p>
              </div>
              <div className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {filteredThreads.length}
              </div>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company, contact, subject..."
              className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
            />
          </div>

          <div className="max-h-[760px] overflow-y-auto p-4">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                Loading conversations...
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                No conversation found.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredThreads.map((thread) => {
                  const active = thread._id === selectedThreadId;

                  return (
                    <button
                      key={thread._id}
                      type="button"
                      onClick={() => setSelectedThreadId(thread._id)}
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
                            {thread.prospectId?.companyName || thread.brandName || "—"}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {thread.prospectId?.primaryContact?.name || "—"} · {thread.prospectId?.primaryContact?.email || thread.brandEmail || "—"}
                          </p>
                        </div>

                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                          {getOwnerLabel(thread.ownerRole)}
                        </span>
                      </div>

                      <p className="mt-3 truncate text-sm text-slate-700">
                        {thread.subject || "No subject"}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                          className={cx(
                            "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                            getStagePillClasses(thread.prospectId?.stage)
                          )}
                        >
                          {thread.prospectId?.stage || "—"}
                        </span>

                        <span
                          className={cx(
                            "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                            getStatusPillClasses(thread.status)
                          )}
                        >
                          {thread.status || "—"}
                        </span>
                      </div>

                      <p className="mt-3 text-[11px] text-slate-400">
                        Last activity: {formatShortDateTime(thread.lastMessageAt || thread.updatedAt)}
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
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Selected Conversation
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-slate-900">
                    {selectedThread?.prospectId?.companyName || selectedThread?.brandName || "Select a thread"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedThread?.prospectId?.primaryContact?.name || "—"} · {selectedThread?.prospectId?.primaryContact?.email || selectedThread?.brandEmail || "—"}
                  </p>
                </div>

                {selectedThread && (
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={cx(
                        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                        getStagePillClasses(selectedThread?.prospectId?.stage)
                      )}
                    >
                      {selectedThread?.prospectId?.stage || "—"}
                    </span>
                    <span
                      className={cx(
                        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                        getStatusPillClasses(selectedThread?.status)
                      )}
                    >
                      {selectedThread?.status || "—"}
                    </span>
                  </div>
                )}
              </div>

              {selectedThread && (
                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Owner</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{getOwnerLabel(selectedThread.ownerRole)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Last Activity</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {formatDateTime(selectedThread.lastMessageAt || selectedThread.updatedAt)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Instantly Thread</p>
                    <p className="mt-2 break-all text-sm font-semibold text-slate-900">
                      {threadDetail.thread?.instantlyThreadId || "Missing"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Review</p>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          selectedThread?.prospectId?._id
                            ? `/admin/instantly-crm/review-queue?prospectId=${selectedThread.prospectId._id}`
                            : "/admin/instantly-crm/review-queue"
                        )
                      }
                      className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Open Review Queue
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="max-h-[520px] overflow-y-auto p-6">
              {!selectedThread ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-sm text-slate-500">
                  Select a thread from the left to view messages.
                </div>
              ) : threadLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center text-sm text-slate-500">
                  Loading conversation...
                </div>
              ) : threadDetail.messages.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center text-sm text-slate-500">
                  No messages available yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {threadDetail.messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={cx("rounded-2xl border p-4", getDirectionClasses(msg.direction))}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                            {msg.direction === "inbound" ? "Inbound" : "Outbound"}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {msg.subject || "No subject"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">From: {msg.from || "—"}</p>
                          {Array.isArray(msg.to) && msg.to.length > 0 && (
                            <p className="mt-1 text-xs text-slate-500">To: {msg.to.join(", ")}</p>
                          )}
                        </div>

                        <p className="text-xs text-slate-500">
                          {formatDateTime(msg.receivedAt || msg.sentAt || msg.createdAt)}
                        </p>
                      </div>

                      <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {msg.bodyText || "—"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedThread && (
            <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-6">
                <p className="text-sm font-semibold text-slate-900">Reply Composer</p>
                <p className="mt-1 text-xs text-slate-500">
                  Send a message inside the selected conversation thread.
                </p>
              </div>

              <div className="p-6">

                <div className="space-y-4">
                  <input
                    value={composerSubject}
                    onChange={(e) => setComposerSubject(e.target.value)}
                    placeholder="Subject"
                    disabled={false}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                  />

                  <textarea
                    value={composerBody}
                    onChange={(e) => setComposerBody(e.target.value)}
                    rows={7}
                    placeholder="Type your reply..."
                    disabled={false}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleReply}
                      disabled={submittingKey !== "" || false}
                      className="rounded-2xl bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                    >
                      {submittingKey === "reply" ? "Sending..." : "Send Reply"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}