"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { get, postFormData } from "@/lib/api";
import {
  ArrowLeft,
  Paperclip,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Clock,
  CheckCircle2,
  Circle,
  Send,
  MoreHorizontal,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Attachment = {
  url: string;
  originalName?: string | null;
  mimeType?: string | null;
  size?: number | null;
};

type Comment = {
  commentId: string;
  authorRole: "Admin" | "Brand" | "Influencer";
  authorId: string;
  text: string;
  createdAt: string;
  attachments?: Attachment[];
};

type DisputeStatus = "open" | "in_review" | "awaiting_user" | "resolved" | "rejected";

type DisputeParty = {
  role: "Brand" | "Influencer";
  id: string;
  name?: string | null;
  handle?: string | null;
  provider?: string | null;
};

type Dispute = {
  disputeId: string;
  subject: string;
  description: string;
  status: DisputeStatus;
  priority?: string;
  campaignId?: string | null;
  campaignName?: string | null;
  brandId: string;
  influencerId: string;
  assignedTo?: { adminId?: string | null; name?: string | null } | null;
  comments: Comment[];
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
  raisedByRole?: string | null;
  raisedById?: string | null;
  raisedBy?: DisputeParty | null;
  raisedAgainst?: DisputeParty | null;
  viewerIsRaiser?: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function timeAgo(dateStr: string): string {
  const days = daysSince(dateStr);
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}
function formatHandle(handle?: string | null): string | null {
  if (!handle) return null;
  return handle.startsWith("@") ? handle : `@${handle}`;
}
function isImage(a: Attachment): boolean {
  if (a.mimeType?.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|svg|avif)$/i.test((a.url || "").split("?")[0]);
}

const STATUS_STEPS = [
  { key: "open", label: "Dispute Submitted" },
  { key: "in_review", label: "Response & Evidence" },
  { key: "awaiting_user", label: "Under Review" },
  { key: "resolved", label: "Resolved" },
];

const STATUS_STEP_INDEX: Record<string, number> = {
  open: 0,
  in_review: 1,
  awaiting_user: 2,
  resolved: 3,
  rejected: 3,
};

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  in_review: "In Progress",
  awaiting_user: "Awaiting You",
  resolved: "Resolved",
  rejected: "Rejected",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

// Image lightbox
function LightboxModal({
  images,
  index,
  onClose,
}: {
  images: Attachment[];
  index: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(index);
  const current = images[idx];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % images.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length, onClose]);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative max-w-5xl w-full px-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3 text-xs text-gray-300">
          <span className="truncate max-w-xs">{current.originalName || "Image"}</span>
          <div className="flex items-center gap-3">
            <span>{idx + 1} / {images.length}</span>
            <button onClick={onClose} className="size-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center">
              <X className="size-4 text-white" />
            </button>
          </div>
        </div>
        <div className="relative flex items-center justify-center rounded-lg overflow-hidden bg-black/30 min-h-[300px] max-h-[80vh]">
          {images.length > 1 && (
            <button
              onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
              className="absolute left-3 size-9 rounded-lg bg-black/50 hover:bg-black/70 flex items-center justify-center"
            >
              <ChevronLeft className="size-5 text-white" />
            </button>
          )}
          <img src={current.url} alt={current.originalName || ""} className="max-h-[80vh] max-w-full object-contain" />
          {images.length > 1 && (
            <button
              onClick={() => setIdx((i) => (i + 1) % images.length)}
              className="absolute right-3 size-9 rounded-lg bg-black/50 hover:bg-black/70 flex items-center justify-center"
            >
              <ChevronRight className="size-5 text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Accordion
function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[#e8e8e8] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-[#fafafa] transition-colors"
      >
        <span className="text-sm font-medium text-[#1a1a1a]">{title}</span>
        <ChevronDown
          className="size-4 text-[#888] transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 pt-1 bg-white text-sm text-[#555] border-t border-[#f0f0f0]">
          {children}
        </div>
      )}
    </div>
  );
}

// Avatar initials
function Avatar({ name, role, size = "sm" }: { name?: string | null; role?: string; size?: "sm" | "md" }) {
  const initials = (name || role || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const colors: Record<string, string> = {
    Brand: "bg-orange-100 text-orange-700",
    Influencer: "bg-blue-100 text-blue-700",
    Admin: "bg-purple-100 text-purple-700",
  };

  const color = colors[role || ""] || "bg-gray-100 text-gray-600";
  const sz = size === "md" ? "size-9 text-sm" : "size-7 text-xs";

  return (
    <div className={`${sz} ${color} rounded-lg flex items-center justify-center font-semibold shrink-0`}>
      {initials}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BrandDisputeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [brandId, setBrandId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [d, setD] = useState<Dispute | null>(null);

  // Comment state
  const [comment, setComment] = useState("");
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  // Lightbox
  const [lightbox, setLightbox] = useState<{ images: Attachment[]; index: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("brandId");
    setBrandId(stored);
    if (!stored) setError("Not logged in as brand.");
  }, []);

  const load = useCallback(async () => {
    if (!id || !brandId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await get<{ dispute: Dispute }>(`/dispute/brand/${id}`, { brandId });
      setD(data.dispute);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load dispute.");
    } finally {
      setLoading(false);
    }
  }, [id, brandId]);

  useEffect(() => {
    if (id && brandId) load();
  }, [load, id, brandId]);

  const postComment = async () => {
    if (!id || !brandId || (!comment.trim() && !commentFiles.length)) return;
    setPosting(true);
    setPostError(null);
    try {
      const form = new FormData();
      form.append("brandId", brandId);
      form.append("text", comment.trim() || " ");
      commentFiles.forEach((f) => form.append("attachments", f));
      await postFormData(`/dispute/brand/${id}/comment`, form);
      setComment("");
      setCommentFiles([]);
      await load();
    } catch (e: any) {
      setPostError(e?.response?.data?.message || e?.message || "Failed to post comment.");
    } finally {
      setPosting(false);
    }
  };

  // ── Loading / error skeletons ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] p-6">
        <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 w-48 rounded-lg bg-gray-200" />
          <div className="h-16 rounded-lg bg-gray-200" />
          <div className="h-32 rounded-lg bg-gray-200" />
          <div className="h-48 rounded-lg bg-gray-200" />
        </div>
      </div>
    );
  }

  if (error || !d) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-[#888]">{error || "Dispute not found."}</p>
          <button onClick={() => router.back()} className="text-sm underline text-[#1a1a1a]">
            Go back
          </button>
        </div>
      </div>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────

  const age = daysSince(d.createdAt);
  const stepIdx = STATUS_STEP_INDEX[d.status] ?? 0;
  const isFinalized = d.status === "resolved" || d.status === "rejected";
  const imgAttachments = (d.attachments || []).filter(isImage);
  const nonImgAttachments = (d.attachments || []).filter((a) => !isImage(a));

  const whoIsDispute = d.viewerIsRaiser
    ? `You raised this dispute against ${d.raisedAgainst?.name || "the influencer"}`
    : `${d.raisedBy?.name || "The influencer"} raised this dispute against you`;

  return (
    <>
      <div className="min-h-screen" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');`}</style>

        <div className="max-w-7xl mx-auto px-[1.875rem] py-[1.875rem] space-y-4">

          {/* ── Back ───────────────────────────────────────────────────────── */}

          {/* ── Hero Header ────────────────────────────────────────────────── */}
          <div className="bg-white rounded-lg border border-[#e8e8e8] px-6 py-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              {/* Left: title + meta */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-semibold text-[#1a1a1a] leading-tight truncate">
                  {d.subject}
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-[#999]">ID: {d.disputeId}</span>
                  {d.priority && (
                    <span className="text-xs px-2 py-0.5 rounded-lg bg-[#f5f5f5] text-[#666] capitalize">
                      {d.priority} priority
                    </span>
                  )}
                </div>
              </div>

              {/* Right: age + status + action */}
              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-[#666]">
                  <Clock className="size-3.5" />
                  <span>{age} day{age !== 1 ? "s" : ""} left</span>
                </div>

                {/* Status pill */}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium ${d.status === "resolved" ? "bg-emerald-50 text-emerald-700" :
                  d.status === "rejected" ? "bg-red-50 text-red-600" :
                    d.status === "in_review" ? "bg-blue-50 text-blue-700" :
                      "bg-[#f0faf0] text-[#2d7a3a]"
                  }`}>
                  <span className={`size-1.5 rounded-lg ${d.status === "resolved" ? "bg-emerald-500" :
                    d.status === "rejected" ? "bg-red-500" :
                      "bg-[#2d7a3a]"
                    }`} />
                  {STATUS_LABEL[d.status] ?? d.status}
                </span>

                {/* Revoke / action button — only if open */}
                {!isFinalized && (
                  <button className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#e2e2e2] text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors">
                    <RotateCcw className="size-3.5" />
                    Revoke Dispute
                  </button>
                )}
              </div>
            </div>

            {/* ── Meta row ─────────────────────────────────────────────────── */}
            <div className="mt-5 pt-5 border-t border-[#f0f0f0] grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { label: "Dispute By", value: d.viewerIsRaiser ? "You" : (d.raisedBy?.name || "—") },
                {
                  label: "Dispute Against",
                  value: d.raisedAgainst?.name || "—",
                  sub: formatHandle(d.raisedAgainst?.handle) || undefined,
                },
                { label: "Dispute Type", value: d.subject, truncate: true },
                { label: "Dispute ID", value: d.disputeId },
                { label: "Dispute age", value: `${age} day${age !== 1 ? "s" : ""} left` },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[11px] text-[#999] mb-0.5">{item.label}</p>
                  <p className={`text-sm font-medium text-[#1a1a1a] ${item.truncate ? "truncate" : ""}`}>
                    {item.value}
                  </p>
                  {item.sub && <p className="text-xs text-[#888]">{item.sub}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* ── Dispute Summary ────────────────────────────────────────────── */}
          <div className="bg-white rounded-lg border border-[#e8e8e8] px-6 py-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="size-5 rounded bg-[#f0f0f0] flex items-center justify-center">
                <span className="text-[10px]">📋</span>
              </div>
              <h2 className="text-sm font-semibold text-[#1a1a1a]">Dispute Summary</h2>
            </div>
            <p className="text-sm text-[#555] leading-relaxed whitespace-pre-wrap">
              {d.description || "No description provided."}
            </p>
            {d.campaignName && (
              <p className="text-xs text-[#888] mt-3">
                Campaign: <span className="font-medium text-[#555]">{d.campaignName}</span>
              </p>
            )}
          </div>

          {/* ── Image / Reference ──────────────────────────────────────────── */}
          {(imgAttachments.length > 0 || nonImgAttachments.length > 0) && (
            <div className="bg-white rounded-lg border border-[#e8e8e8] px-6 py-5">
              <h2 className="text-sm font-semibold text-[#1a1a1a] mb-4">Image / Reference</h2>

              {imgAttachments.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-3">
                  {imgAttachments.map((a, i) => (
                    <button
                      key={i}
                      onClick={() => setLightbox({ images: imgAttachments, index: i })}
                      className="relative group w-32 h-24 rounded-lg overflow-hidden border border-[#e8e8e8] bg-[#f5f5f5] hover:border-[#ccc] transition-colors"
                    >
                      <img
                        src={a.url}
                        alt={a.originalName || `Image ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              {nonImgAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {nonImgAttachments.map((a, i) => (
                    <a
                      key={i}
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#e8e8e8] bg-[#fafafa] hover:bg-[#f5f5f5] text-xs text-[#555] transition-colors"
                    >
                      <Paperclip className="size-3.5 shrink-0 text-[#aaa]" />
                      <span className="truncate max-w-[160px]">{a.originalName || "File"}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Progress tracker ───────────────────────────────────────────── */}
          <div className="bg-white rounded-lg border border-[#e8e8e8] px-6 py-5">
            {/* Verification banner */}
            <div className="flex items-center gap-2 mb-5">
              <div className="size-5 rounded-lg bg-[#e8f5e9] flex items-center justify-center shrink-0">
                <span className="text-[10px]">✓</span>
              </div>
              <p className="text-sm text-[#444] font-medium">
                We're verifying the dispute, thanks for your Patience
              </p>
            </div>

            {/* Step track */}
            <div className="relative flex items-center">
              {STATUS_STEPS.map((step, i) => {
                const done = i < stepIdx;
                const active = i === stepIdx;
                const isLast = i === STATUS_STEPS.length - 1;

                return (
                  <React.Fragment key={step.key}>
                    <div className="flex flex-col items-center gap-1.5 z-10">
                      <div className={`size-4 rounded-lg border-2 flex items-center justify-center transition-colors ${done ? "border-[#2d7a3a] bg-[#2d7a3a]" :
                        active ? "border-[#2d7a3a] bg-white" :
                          "border-[#ddd] bg-white"
                        }`}>
                        {done && <CheckCircle2 className="size-3 text-white" strokeWidth={3} />}
                        {active && <span className="size-1.5 rounded-lg bg-[#2d7a3a]" />}
                      </div>
                      <span className={`text-[10px] whitespace-nowrap font-medium ${done || active ? "text-[#1a1a1a]" : "text-[#bbb]"
                        }`}>
                        {step.label}
                      </span>
                    </div>

                    {!isLast && (
                      <div className="flex-1 h-0.5 mx-1 mb-4 relative overflow-hidden rounded-lg bg-[#e8e8e8]">
                        <div
                          className="h-full bg-[#2d7a3a] transition-all duration-500"
                          style={{ width: done ? "100%" : active ? "50%" : "0%" }}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* ── FAQs / Accordions ──────────────────────────────────────────── */}
          <Accordion title="What's happening now?">
            <p>Our team has received your dispute and is currently reviewing the details. This typically takes 2–5 business days. You'll be notified of any updates.</p>
          </Accordion>
          <Accordion title="What's next?">
            <p>Once the initial review is complete, both parties may be asked to provide evidence or respond to questions. Keep an eye on your email and notifications for further instructions.</p>
          </Accordion>

          {/* ── Activity + Comment split ───────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Left — activity feed */}
            <div className="bg-white rounded-lg border border-[#e8e8e8] p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <div className="size-5 rounded bg-[#f0f0f0] flex items-center justify-center text-[10px]">💬</div>
                <h2 className="text-sm font-semibold text-[#1a1a1a]">
                  We're verifying the dispute, thanks for your Patience
                </h2>
              </div>

              {d.comments.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-10 text-[#bbb] text-xs">
                  No activity yet
                </div>
              ) : (
                <div className="flex flex-col gap-3 overflow-y-auto max-h-[400px] pr-1">
                  {/* Synthetic "dispute raised" event */}
                  <div className="flex items-start gap-3">
                    <Avatar name={d.raisedBy?.name} role={d.raisedBy?.role} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#1a1a1a]">
                          {d.viewerIsRaiser ? "You" : (d.raisedBy?.name || d.raisedBy?.role)}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-[#bbb]">{timeAgo(d.createdAt)}</span>
                          <button className="text-[#ccc] hover:text-[#888]">
                            <MoreHorizontal className="size-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-[#555] mt-0.5">
                        {whoIsDispute}
                        {d.raisedAgainst?.handle && (
                          <span className="font-medium text-[#1a1a1a]"> {formatHandle(d.raisedAgainst.handle)}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Comments */}
                  {d.comments.map((c) => (
                    <div key={c.commentId} className="flex items-start gap-3">
                      <Avatar role={c.authorRole} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-[#1a1a1a] capitalize">
                            {c.authorRole === "Brand" && d.viewerIsRaiser ? "You" : c.authorRole}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-[#bbb]">{timeAgo(c.createdAt)}</span>
                            <button className="text-[#ccc] hover:text-[#888]">
                              <MoreHorizontal className="size-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-[#555] mt-0.5 whitespace-pre-wrap">{c.text}</p>
                        {c.attachments && c.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {c.attachments.filter(isImage).map((a, ai) => (
                              <button
                                key={ai}
                                onClick={() => setLightbox({ images: c.attachments!.filter(isImage), index: ai })}
                                className="w-14 h-10 rounded-lg overflow-hidden border border-[#e8e8e8] bg-[#f5f5f5]"
                              >
                                <img src={a.url} alt="" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* System event */}
              <div className="mt-4 pt-4 border-t border-[#f0f0f0] flex items-start gap-3">
                <div className="size-7 rounded-lg bg-[#f5f5f5] border border-[#e8e8e8] flex items-center justify-center text-[10px] shrink-0">
                  ⚙
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#1a1a1a]">System</span>
                    <span className="text-[10px] text-[#bbb]">{timeAgo(d.createdAt)}</span>
                  </div>
                  <p className="text-xs text-[#888] mt-0.5">Raised a dispute</p>
                </div>
              </div>
            </div>

            {/* Right — comment input */}
            <div className="bg-white rounded-lg border border-[#e8e8e8] p-5 flex flex-col">
              {/* Placeholder commenter */}
              <div className="flex items-center gap-2 mb-4">
                <Avatar name={d.raisedAgainst?.name} role={d.raisedAgainst?.role} size="md" />
                <div>
                  <p className="text-sm font-medium text-[#1a1a1a]">
                    {d.raisedAgainst?.name || "Other Party"}
                  </p>
                  {d.raisedAgainst?.handle && (
                    <p className="text-xs text-[#888]">
                      {formatHandle(d.raisedAgainst.handle)}
                    </p>
                  )}
                  <p className="text-[10px] text-[#bbb]">10 days ago</p>
                </div>
                <button className="ml-auto text-[#ccc] hover:text-[#888]">
                  <MoreHorizontal className="size-4" />
                </button>
              </div>

              {isFinalized ? (
                <div className="flex-1 flex items-center justify-center text-xs text-[#bbb] py-6">
                  This dispute is finalized and cannot receive further comments.
                </div>
              ) : (
                <div className="flex flex-col flex-1 gap-3">
                  {/* Textarea */}
                  <textarea
                    rows={6}
                    placeholder="Add a comment…"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full flex-1 resize-none rounded-lg border border-[#e8e8e8] bg-[#fafafa] px-4 py-3 text-sm text-[#1a1a1a] placeholder:text-[#ccc] outline-none focus:border-[#1a1a1a] focus:bg-white focus:ring-1 focus:ring-[#1a1a1a]/10 transition-all"
                  />

                  {/* Attached files preview */}
                  {commentFiles.length > 0 && (
                    <ul className="space-y-1">
                      {commentFiles.map((f, i) => (
                        <li key={i} className="flex items-center justify-between text-[11px] border border-[#e8e8e8] rounded-lg px-3 py-1.5 text-[#555]">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Paperclip className="size-3 shrink-0 text-[#aaa]" />
                            <span className="truncate">{f.name}</span>
                          </div>
                          <button
                            onClick={() => setCommentFiles((p) => p.filter((_, j) => j !== i))}
                            className="text-[#ccc] hover:text-red-500 ml-2 shrink-0"
                          >
                            <X className="size-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {postError && (
                    <p className="text-xs text-red-500">{postError}</p>
                  )}

                  {/* Footer actions */}
                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 text-xs text-[#888] hover:text-[#1a1a1a] transition-colors px-2 py-1.5 rounded-lg hover:bg-[#f5f5f5]"
                    >
                      <Paperclip className="size-3.5" />
                      Attach
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setCommentFiles((p) => [...p, ...files]);
                        e.target.value = "";
                      }}
                    />

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setComment(""); setCommentFiles([]); setPostError(null); }}
                        disabled={posting || (!comment.trim() && !commentFiles.length)}
                        className="text-sm text-[#888] hover:text-[#1a1a1a] px-3 py-1.5 rounded-lg hover:bg-[#f5f5f5] transition-colors disabled:opacity-40"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={postComment}
                        disabled={posting || (!comment.trim() && !commentFiles.length)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-[#1a1a1a] hover:bg-[#333] px-4 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                      >
                        {posting ? (
                          <span className="text-xs">Posting…</span>
                        ) : (
                          <>
                            <Send className="size-3.5" />
                            Submit
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <LightboxModal
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}