"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { adminGet, adminPost } from "@/lib/api";

// --- Types ---
type ApiState = { type: "success" | "error" | "info"; text: string } | null;

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
    primaryContact?: { name?: string; email?: string };
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

function formatShortDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getStagePillClasses(stage?: string) {
  const value = String(stage || "").toLowerCase();
  if (value.includes("replied")) return "bg-blue-50 text-blue-700 border-blue-200";
  if (value.includes("assigned_to_bme")) return "bg-violet-50 text-violet-700 border-violet-200";
  if (value.includes("assigned_to_ime")) return "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200";
  if (value.includes("unqualified")) return "bg-rose-50 text-rose-700 border-rose-200";
  if (value.includes("qualified")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
}

function getStatusPillClasses(status?: string) {
  const value = String(status || "").toLowerCase();
  if (value === "waiting_on_us") return "bg-amber-50 text-amber-700 border-amber-200";
  if (value === "waiting_on_brand") return "bg-blue-50 text-blue-700 border-blue-200";
  if (value === "closed") return "bg-gray-100 text-gray-600 border-gray-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
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
      ].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [threads, search]);

  const selectedThread = useMemo(
    () => filteredThreads.find((item) => item._id === selectedThreadId) || threads.find((item) => item._id === selectedThreadId) || null,
    [filteredThreads, threads, selectedThreadId]
  );

  const waitingOnUsCount = useMemo(() => threads.filter((item) => item.status === "waiting_on_us").length, [threads]);
  const waitingOnBrandCount = useMemo(() => threads.filter((item) => item.status === "waiting_on_brand").length, [threads]);

  async function loadPage(showLoader = true) {
    try {
      if (showLoader) setLoading(true);
      setMessage(null);

      const threadsPayload: any = await adminGet("/outreach/threads");
      const nextThreads = Array.isArray(threadsPayload?.data) ? threadsPayload.data : [];
      setThreads(nextThreads);

      const threadIdFromQuery = String(searchParams.get("threadId") || "");
      const prospectIdFromQuery = String(searchParams.get("prospectId") || "");

      setSelectedThreadId((prev) => {
        if (threadIdFromQuery && nextThreads.some((t: any) => t._id === threadIdFromQuery)) return threadIdFromQuery;
        if (prospectIdFromQuery) {
          const match = nextThreads.find((item: any) => String(item?.prospectId?._id || "") === prospectIdFromQuery);
          if (match?._id) return match._id;
        }
        if (prev && nextThreads.some((item: any) => item._id === prev)) return prev;
        return nextThreads[0]?._id || "";
      });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to load replies" });
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
      setThreadDetail({
        thread: payload?.thread || null,
        messages: Array.isArray(payload?.messages) ? payload.messages : [],
      });
      setComposerSubject(payload?.thread?.subject || "");
    } catch (error) {
      setThreadDetail({ thread: null, messages: [] });
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to load conversation" });
    } finally {
      setThreadLoading(false);
    }
  }

  useEffect(() => { loadPage(true); }, []);
  useEffect(() => { loadSelectedThread(); }, [selectedThreadId]);

  async function handleReply() {
    try {
      if (!selectedThreadId) throw new Error("Select a conversation first");
      if (!composerBody.trim()) throw new Error("Reply body is required");

      setSubmittingKey("reply");
      setMessage(null);

      const payload: any = await adminPost(`/outreach/threads/${selectedThreadId}/reply`, {
        subject: composerSubject.trim(),
        bodyText: composerBody.trim(),
      });

      if (payload?.success === false) throw new Error(payload?.message || "Failed to send reply");

      setComposerBody("");
      setMessage({ type: "success", text: payload?.message || "Reply sent successfully" });
      await loadSelectedThread();
      await loadPage(false);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to send reply" });
    } finally {
      setSubmittingKey("");
    }
  }

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
        <MetricCard label="Total Threads" value={threads.length} />
        <MetricCard label="Waiting on Us" value={waitingOnUsCount} />
        <MetricCard label="Waiting on Brand" value={waitingOnBrandCount} />
      </div>

      {/* Unified Inbox Container */}
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        
        {/* Left Pane: Thread List */}
        <aside className="flex w-full flex-col border-r border-gray-200 bg-gray-50/30 xl:w-[400px]">
          <div className="border-b border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900">Inbox</h2>
            <div className="mt-3 relative">
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search leads, companies..."
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-gray-500">Loading inbox...</div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">No conversations found.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {filteredThreads.map((thread) => {
                  const active = thread._id === selectedThreadId;
                  const contactName = thread.prospectId?.primaryContact?.name || thread.brandName || "Unknown Contact";
                  const companyName = thread.prospectId?.companyName || "No Company";

                  return (
                    <li key={thread._id}>
                      <button
                        onClick={() => setSelectedThreadId(thread._id)}
                        className={cx(
                          "w-full text-left p-4 transition-colors hover:bg-gray-100/50",
                          active ? "bg-gray-100 relative" : "bg-white"
                        )}
                      >
                        {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1a1a1a]" />}
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-[#1a1a1a]">
                            {getInitials(contactName)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-center mb-0.5">
                              <p className="truncate text-sm font-semibold text-gray-900">{contactName}</p>
                              <span className="shrink-0 text-xs text-gray-500">
                                {formatShortDateTime(thread.lastMessageAt || thread.updatedAt)}
                              </span>
                            </div>
                            <p className="truncate text-xs text-gray-600">{companyName}</p>
                            <p className="mt-1 truncate text-sm text-gray-500">{thread.subject || "(No subject)"}</p>
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

        {/* Right Pane: Thread Detail & Composer */}
        <main className="flex min-w-0 flex-1 flex-col bg-white">
          {!selectedThread ? (
            <div className="flex h-full items-center justify-center p-8 text-gray-400">
              <p>Select a conversation to view details</p>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedThread.prospectId?.companyName || selectedThread.brandName || "Unknown Company"}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                    <span>{selectedThread.prospectId?.primaryContact?.name || "—"}</span>
                    <span>&bull;</span>
                    <a href={`mailto:${selectedThread.prospectId?.primaryContact?.email || selectedThread.brandEmail}`} className="text-[#1a1a1a] font-medium hover:underline">
                      {selectedThread.prospectId?.primaryContact?.email || selectedThread.brandEmail || "—"}
                    </a>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={cx("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium", getStagePillClasses(selectedThread.prospectId?.stage))}>
                      {selectedThread.prospectId?.stage?.replace(/_/g, ' ') || "No Stage"}
                    </span>
                    <span className={cx("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium", getStatusPillClasses(selectedThread.status))}>
                      {selectedThread.status?.replace(/_/g, ' ') || "No Status"}
                    </span>
                  </div>
                  <button
                    onClick={() => router.push(selectedThread.prospectId?._id ? `/admin/instantly-crm/review-queue?prospectId=${selectedThread.prospectId._id}` : "/admin/instantly-crm/review-queue")}
                    className="text-xs font-medium text-gray-500 hover:text-[#1a1a1a] underline underline-offset-2"
                  >
                    Open CRM Profile &rarr;
                  </button>
                </div>
              </div>

              {/* Emails Scrollable Area */}
              <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
                {threadLoading ? (
                  <div className="text-center text-sm text-gray-500">Loading conversation...</div>
                ) : threadDetail.messages.length === 0 ? (
                  <div className="text-center text-sm text-gray-500">No messages in this thread yet.</div>
                ) : (
                  <div className="space-y-6 max-w-4xl mx-auto">
                    {threadDetail.messages.map((msg) => {
                      const isInbound = msg.direction === "inbound";
                      return (
                        <div key={msg._id} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                          <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{msg.from || "Unknown Sender"}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  To: {Array.isArray(msg.to) && msg.to.length > 0 ? msg.to.join(", ") : "—"}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={cx("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded", isInbound ? "bg-gray-200 text-[#1a1a1a]" : "bg-gray-100 text-gray-600")}>
                                  {isInbound ? "Lead" : "You"}
                                </span>
                                <span className="text-xs text-gray-500">{formatDateTime(msg.receivedAt || msg.sentAt || msg.createdAt)}</span>
                              </div>
                            </div>
                            <p className="mt-3 text-sm font-medium text-gray-900 border-t border-gray-100 pt-3">
                              Subject: <span className="font-normal text-gray-700">{msg.subject || "(No Subject)"}</span>
                            </p>
                          </div>
                          <div className="px-5 py-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                            {msg.bodyText || "—"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reply Composer */}
              <div className="shrink-0 border-t border-gray-200 bg-white p-6">
                <div className="max-w-4xl mx-auto rounded-lg border border-gray-200 bg-white shadow-sm focus-within:border-[#1a1a1a] focus-within:ring-1 focus-within:ring-[#1a1a1a] transition-all">
                  <div className="border-b border-gray-100 px-4 py-2 flex items-center">
                    <span className="text-xs font-medium text-gray-500 w-16">Subject:</span>
                    <input
                      value={composerSubject}
                      onChange={(e) => setComposerSubject(e.target.value)}
                      placeholder="Re: Subject"
                      className="flex-1 bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                    />
                  </div>
                  <textarea
                    value={composerBody}
                    onChange={(e) => setComposerBody(e.target.value)}
                    rows={5}
                    placeholder="Type your message here..."
                    className="w-full resize-y bg-transparent px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                  />
                  <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3 rounded-b-lg">
                    <div className="text-xs text-gray-500">
                      Replying to <span className="font-semibold text-gray-700">{selectedThread.prospectId?.primaryContact?.email || selectedThread.brandEmail || "lead"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleReply}
                      disabled={submittingKey !== "" || !composerBody.trim()}
                      className="inline-flex items-center justify-center rounded-md bg-[#1a1a1a] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingKey === "reply" ? "Sending..." : "Send Email"}
                      {!submittingKey && (
                        <svg className="ml-2 -mr-0.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
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