"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { get, post, postFormData } from "@/lib/api";
import { toast, ToastStyles } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  User,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  X,
  Mail,
  Shield,
  Upload,
  Flag,
  DollarSign,
  BarChart2,
  AlertTriangle,
  Tag,
  Hash,
  ArrowUpRight,
  Layers,
  Activity,
} from "lucide-react";

type DisputeStatus =
  | "open"
  | "in_review"
  | "awaiting_user"
  | "evidence_submitted"
  | "in_negotiation"
  | "resolution_proposed"
  | "resolved"
  | "rejected";

type DisputePriority = "low" | "medium" | "high" | "critical";

type ApiErrorLike = {
  message?: unknown;
  error?: unknown;
  errors?: unknown;
  detail?: unknown;
  data?: unknown;
  statusText?: unknown;
  response?: {
    data?: unknown;
    statusText?: unknown;
  };
};

type Attachment = {
  url: string;
  originalName?: string | null;
  mimeType?: string | null;
  size?: number | null;
  evidenceName?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  uploaderRole?: "Admin" | "Brand" | "Influencer" | string | null;
  uploaderName?: string | null;
  uploadedBy?: {
    role?: "Admin" | "Brand" | "Influencer" | string | null;
    name?: string | null;
    id?: string | null;
  } | null;
};

type Comment = {
  commentId: string;
  authorRole: "Admin" | "Brand" | "Influencer";
  authorId: string;
  text: string;
  createdAt: string;
  attachments?: Attachment[];
  isSystemGenerated?: boolean;
  parentCommentId?: string | null;
  threadRootCommentId?: string | null;
};

type EvidenceEntry = {
  evidenceId?: string;
  evidenceName: string;
  notes?: string | null;
  attachments?: Attachment[];
  createdAt?: string;
  createdBy?: {
    role?: "Admin" | "Brand" | "Influencer" | string;
    id?: string | null;
    name?: string | null;
  } | null;
};

type Party = {
  role: string;
  id: string;
  name?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  since?: string | null;
};

type Dispute = {
  disputeId: string;
  subject: string;
  description?: string;
  otherIssueDescription?: string | null;
  issueType?: string[];
  status: DisputeStatus;
  priority?: DisputePriority;
  campaignId?: string | null;
  campaignName?: string | null;
  brandId: string;
  influencerId: string;
  brandName?: string | null;
  influencerName?: string | null;
  brandLogoUrl?: string | null;
  influencerProfileImage?: string | null;
  brandSince?: string | null;
  influencerSince?: string | null;
  brandDisputesFiledCount?: number | null;
  brandDisputesAgainstCount?: number | null;
  influencerDisputesFiledCount?: number | null;
  influencerDisputesAgainstCount?: number | null;
  brandEmail?: string | null;
  influencerEmail?: string | null;
  createdBy?: { id?: string; role?: "Brand" | "Influencer" };
  raisedBy?: Party;
  raisedAgainst?: Party;
  raisedByRole?: string;
  raisedById?: string;
  assignedTo?: { adminId?: string | null; name?: string | null } | null;
  comments?: Comment[];
  attachments?: Attachment[];
  evidence?: EvidenceEntry[];
  createdAt: string;
  updatedAt: string;
};

const normalizeErrorValue = (value: unknown): string => {
  if (!value) return "";

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeErrorValue(item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;

    const directMessage =
      normalizeErrorValue(objectValue.message) ||
      normalizeErrorValue(objectValue.error) ||
      normalizeErrorValue(objectValue.detail) ||
      normalizeErrorValue(objectValue.msg);

    if (directMessage) return directMessage;

    return Object.entries(objectValue)
      .map(([key, item]) => {
        const itemMessage = normalizeErrorValue(item);
        return itemMessage ? `${key}: ${itemMessage}` : "";
      })
      .filter(Boolean)
      .join(", ");
  }

  return "";
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const err = error as ApiErrorLike | undefined;

  const candidates = [
    err?.response?.data,
    err?.data,
    err?.errors,
    err?.error,
    err?.detail,
    err?.message,
    err?.response?.statusText,
    err?.statusText,
    error,
  ];

  for (const candidate of candidates) {
    const message = normalizeErrorValue(candidate);
    if (message) return message;
  }

  return fallback;
};

const showErrorToast = (title: string, error: unknown, fallback: string) => {
  toast({
    icon: "error",
    title,
    text: getErrorMessage(error, fallback),
    timer: 4000,
  });
};

const showValidationToast = (title: string, message: string) => {
  toast({
    icon: "error",
    title,
    text: message,
    timer: 4000,
  });
};

const showSuccessToast = (title: string, message?: string) => {
  toast({
    icon: "success",
    title,
    text: message,
    timer: 2500,
  });
};

const showWarningToast = (title: string, message?: string) => {
  toast({
    icon: "warning",
    title,
    text: message,
    timer: 3500,
  });
};

const isImageAttachment = (a: Attachment): boolean => {
  if (a.mimeType?.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|svg)$/i.test((a.url || "").split("?")[0]);
};

type ImagePreviewState = { images: Attachment[]; index: number } | null;

const ImagePreviewModal: React.FC<{
  state: ImagePreviewState;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}> = ({ state, onClose, onPrev, onNext }) => {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };

    window.addEventListener("keydown", h);

    return () => window.removeEventListener("keydown", h);
  }, [onClose, onPrev, onNext]);

  if (!state?.images.length) return null;

  const cur = state.images[state.index];
  if (!cur) return null;

  const label =
    cur.originalName || cur.url.split("?")[0].split("/").pop() || "Image";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative z-10 max-w-5xl w-full px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3 text-xs text-white/70">
          <span className="truncate max-w-xs">{label}</span>
          <div className="flex items-center gap-4">
            <span>
              {state.index + 1} / {state.images.length}
            </span>
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        <div className="relative flex items-center justify-center rounded-lg overflow-hidden bg-black/30 min-h-[300px] max-h-[80vh]">
          {state.images.length > 1 && (
            <button
              onClick={onPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>
          )}

          <img
            src={cur.url}
            alt={label}
            className="max-h-[80vh] max-w-full object-contain"
          />

          {state.images.length > 1 && (
            <button
              onClick={onNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70"
            >
              <ChevronRight className="h-5 w-5 text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const AttachmentPillList: React.FC<{
  attachments?: Attachment[];
  onImageClick?: (images: Attachment[], index: number) => void;
}> = ({ attachments, onImageClick }) => {
  if (!attachments?.length) return null;

  const imgs = attachments.filter(isImageAttachment);

  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map((a, idx) => {
        const isImg = isImageAttachment(a);
        const label =
          a.originalName ||
          a.url.split("?")[0].split("/").pop() ||
          `File ${idx + 1}`;

        if (isImg) {
          return (
            <button
              key={a.url || idx}
              type="button"
              onClick={() => {
                const i = imgs.findIndex((x) => x.url === a.url);
                if (onImageClick && i !== -1) onImageClick(imgs, i);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-black/5 px-2.5 py-1.5 text-[11px] text-gray-700 bg-white hover:bg-black/5 transition"
            >
              <span className="h-5 w-5 overflow-hidden rounded-lg bg-white flex-shrink-0">
                <img src={a.url} alt={label} className="h-full w-full object-cover" />
              </span>
              <span className="truncate max-w-[130px]">{label}</span>
            </button>
          );
        }

        return (
          <a
            key={a.url || idx}
            href={a.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-black/5 px-2.5 py-1.5 text-[11px] text-gray-700 bg-white hover:bg-black/5 transition"
          >
            <Paperclip className="h-3 w-3 flex-shrink-0 text-gray-400" />
            <span className="truncate max-w-[130px]">{label}</span>
          </a>
        );
      })}
    </div>
  );
};

const STATUS_MAP: Record<
  DisputeStatus,
  { label: string; bg: string; text: string; ring: string; dot: string }
> = {
  open: {
    label: "Open",
    bg: "bg-white",
    text: "text-gray-700",
    ring: "ring-black/10",
    dot: "bg-green-600",
  },
  in_review: {
    label: "Under Review",
    bg: "bg-white",
    text: "text-gray-700",
    ring: "ring-black/10",
    dot: "bg-green-600",
  },
  awaiting_user: {
    label: "Awaiting Response",
    bg: "bg-white",
    text: "text-gray-700",
    ring: "ring-black/10",
    dot: "bg-green-600",
  },
  evidence_submitted: {
    label: "Evidence Submitted",
    bg: "bg-white",
    text: "text-gray-700",
    ring: "ring-black/10",
    dot: "bg-green-600",
  },
  in_negotiation: {
    label: "In Negotiation",
    bg: "bg-white",
    text: "text-gray-700",
    ring: "ring-black/10",
    dot: "bg-green-600",
  },
  resolution_proposed: {
    label: "Resolution Proposed",
    bg: "bg-white",
    text: "text-gray-700",
    ring: "ring-black/10",
    dot: "bg-green-600",
  },
  resolved: {
    label: "Completed",
    bg: "bg-white",
    text: "text-gray-700",
    ring: "ring-black/10",
    dot: "bg-blue-500",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-white",
    text: "text-gray-700",
    ring: "ring-black/10",
    dot: "bg-red-500",
  },
};

const PRIORITY_MAP: Record<string, { label: string; bg: string; text: string }> = {
  low: { label: "Low", bg: "bg-white", text: "text-gray-900" },
  medium: { label: "Medium", bg: "bg-white", text: "text-gray-900" },
  high: { label: "High", bg: "bg-white", text: "text-gray-900" },
  critical: { label: "Critical", bg: "bg-white", text: "text-gray-900" },
};

const ISSUE_TYPE_MAP: Record<string, string> = {
  content_not_as_expected: "Content Not as Expected",
  delay_or_missed_deadline: "Delay / Missed Deadline",
  payment_issue: "Payment Issue",
  revision_issue: "Revision Issue",
  agreement_issue: "Agreement Issue",
  scope_change: "Scope Change",
  no_response: "No Response",
  other: "Other",
};

const statusOptions: Array<{
  value: string;
  label: string;
  disabled?: boolean;
  dot: string;
}> = [
  { value: "open", label: "Open", dot: "bg-green-600" },
  { value: "in_review", label: "Under Review", dot: "bg-green-600" },
  { value: "awaiting_user", label: "Awaiting Response", dot: "bg-green-600" },
  { value: "evidence_submitted", label: "Evidence Submitted", dot: "bg-green-600" },
  { value: "in_negotiation", label: "In Negotiation", dot: "bg-green-600" },
  { value: "resolution_proposed", label: "Resolution Proposed", dot: "bg-green-600" },
  { value: "resolved", label: "Resolve", dot: "bg-blue-500" },
  { value: "rejected", label: "Reject", dot: "bg-red-500" },
];

const STATUS_FLOW_ORDER: DisputeStatus[] = [
  "open",
  "in_review",
  "awaiting_user",
  "evidence_submitted",
  "in_negotiation",
  "resolution_proposed",
  "resolved",
  "rejected",
];

const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div
    className={`bg-white rounded-lg border border-black/5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${className}`}
    {...props}
  >
    {children}
  </div>
);

const CardHeader: React.FC<{ title: string; extra?: React.ReactNode }> = ({
  title,
  extra,
}) => (
  <div className="flex items-center justify-between px-5 py-3.5 border-b border-black/5">
    <h2 className="text-[13px] font-semibold text-gray-900 tracking-tight">
      {title}
    </h2>
    {extra}
  </div>
);

const MetaChip: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}> = ({ icon, label, value, valueClass = "text-gray-800" }) => (
  <div className="flex items-start gap-2 min-w-0">
    <span className="mt-0.5 text-gray-400 flex-shrink-0">{icon}</span>
    <div className="min-w-0">
      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
        {label}
      </p>
      <div className={`text-[13px] font-semibold leading-snug ${valueClass}`}>
        {value}
      </div>
    </div>
  </div>
);

const getIssueTypeLabel = (issueType: string) =>
  ISSUE_TYPE_MAP[issueType] || issueType;

const isSystemGeneratedBrandComment = (comment: Comment): boolean => {
  if (comment.authorRole !== "Brand") return false;
  if (comment.isSystemGenerated) return true;

  const text = (comment.text || "").trim();
  if (!text) return false;

  return (
    /^dispute updated by brand\b/i.test(text) ||
    /^dispute\s+(updated|created|opened|closed|reopened|resolved|rejected)\b/i.test(text) ||
    /^system\s*:/i.test(text)
  );
};

const isEvidenceAuditComment = (comment: Comment): boolean => {
  if (comment.authorRole !== "Admin") return false;
  return /^Evidence added by Admin:/i.test((comment.text || "").trim());
};

const getEvidenceFilesCount = (evidence?: EvidenceEntry[]) =>
  (evidence || []).reduce(
    (total, item) =>
      total + (Array.isArray(item.attachments) ? item.attachments.length : 0),
    0
  );

const AttachmentUploaderBadge: React.FC<{ role?: string | null }> = ({ role }) => {
  const normalized = (role || "Unknown").toLowerCase();

  const styles =
    normalized === "brand"
      ? "border-black/10 bg-black text-white"
      : normalized === "influencer"
        ? "border-black/10 bg-white text-gray-900"
        : normalized === "admin"
          ? "border-black/10 bg-black text-white"
          : "border-black/10 bg-white text-gray-500";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${styles}`}
    >
      {role || "Unknown"}
    </span>
  );
};

const IssueTypeSummary: React.FC<{
  issueTypes?: string[];
  otherIssueDescription?: string | null;
  compact?: boolean;
}> = ({ issueTypes, otherIssueDescription, compact = false }) => {
  if (!issueTypes?.length) return <span className="text-gray-400">—</span>;

  const firstType = issueTypes[0];
  const firstLabel = getIssueTypeLabel(firstType);
  const restTypes = issueTypes.slice(1);
  const restLabels = restTypes.map(getIssueTypeLabel);
  const hasOther = issueTypes.includes("other");
  const otherReason = String(otherIssueDescription || "").trim();

  const chipClass = compact
    ? "inline-flex items-center rounded-full border border-black/5 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-700"
    : "inline-flex items-center rounded-full border border-black/5 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-700";

  const OtherIssueReasonTooltip = () => (
    <div className="mt-3 rounded-lg border border-black/5 bg-[#fafafa] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        Other Issue Reason
      </p>

      <p className="mt-1 text-[12px] leading-relaxed text-gray-700 whitespace-pre-wrap">
        {otherReason || "No other issue reason provided."}
      </p>
    </div>
  );

  return (
    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
      {firstType === "other" && restTypes.length === 0 ? (
        <div className="relative group inline-flex">
          <span className={`${chipClass} gap-1.5 cursor-default`}>
            <span>{firstLabel}</span>
            <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-black/10 bg-white text-[9px] font-bold leading-none text-gray-500">
              i
            </span>
          </span>

          <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden min-w-[260px] rounded-lg border border-black/10 bg-white p-3 shadow-[0_12px_32px_rgba(0,0,0,0.08)] group-hover:block">
            <OtherIssueReasonTooltip />
          </div>
        </div>
      ) : (
        <span className={chipClass}>{firstLabel}</span>
      )}

      {restTypes.length > 0 && (
        <div className="relative group">
          <span
            className="inline-flex cursor-default items-center rounded-full border border-black/10 bg-black px-2 py-0.5 text-[11px] font-semibold text-white"
            aria-label={`${restTypes.length} more issue types`}
          >
            +{restTypes.length}
          </span>

          <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden min-w-[260px] rounded-lg border border-black/10 bg-white p-3 shadow-[0_12px_32px_rgba(0,0,0,0.08)] group-hover:block">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Other Issue Types
            </p>

            <div className="flex flex-wrap gap-1.5">
              {restLabels.map((label, index) => (
                <span key={`${label}-${index}`} className={chipClass}>
                  {label}
                </span>
              ))}
            </div>

            {hasOther ? <OtherIssueReasonTooltip /> : null}
          </div>
        </div>
      )}
    </div>
  );
};

const getInitials = (value?: string | null, fallback = "?") => {
  const parts = (value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return fallback;

  return parts.map((part) => part[0]?.toUpperCase() || "").join("") || fallback;
};

const getBrandLogoUrl = (dispute?: Dispute | null) => {
  return (
    dispute?.brandLogoUrl ||
    (dispute?.raisedBy?.role === "Brand" ? dispute.raisedBy.logoUrl : null) ||
    (dispute?.raisedAgainst?.role === "Brand"
      ? dispute.raisedAgainst.logoUrl
      : null) ||
    null
  );
};

const ProfileAvatar: React.FC<{
  name?: string | null;
  imageUrl?: string | null;
  fallbackClassName?: string;
}> = ({ name, imageUrl, fallbackClassName = "bg-black text-white" }) => {
  const initials = getInitials(name, "?");

  return (
    <div
      className={`h-10 w-10 overflow-hidden rounded-full border border-black/10 flex items-center justify-center flex-shrink-0 text-[11px] font-semibold ${fallbackClassName}`}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={name || "Profile"} className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
};

const TimelineAvatar: React.FC<{
  role: string;
  label: string;
  avatarSrc?: string | null;
}> = ({ role, label, avatarSrc }) => {
  const initials =
    role === "System"
      ? "S"
      : role === "Admin"
        ? "A"
        : getInitials(label, role[0]?.toUpperCase() || "?");

  const baseClass =
    role === "System"
      ? "border-black/10 bg-white text-gray-500"
      : role === "Brand"
        ? "border-black bg-black text-white"
        : role === "Influencer"
          ? "border-black/10 bg-white text-gray-900"
          : "border-black bg-black text-white";

  return (
    <span
      className={`flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border text-[10px] font-semibold ${baseClass}`}
    >
      {role === "Brand" && avatarSrc ? (
        <img src={avatarSrc} alt={label} className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
};

const StatBox: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="bg-white rounded-lg border border-black/5 p-3 text-center">
    <p className="text-xl font-bold text-gray-900">{value}</p>
    <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{label}</p>
  </div>
);

const StatusBadge: React.FC<{
  label: string;
  dotClass: string;
  className?: string;
}> = ({ label, dotClass, className = "" }) => (
  <span
    className={`inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-600 ${className}`}
  >
    <span className={`h-3 w-3 rounded-full ${dotClass}`} />
    {label}
  </span>
);

function TimelineItem({
  role,
  label,
  action,
  time,
  text,
  attachments,
  onImageClick,
  showReply = false,
  onReply,
  avatarSrc,
  children,
}: {
  role: string;
  label: string;
  action: string;
  time: string;
  text: string | null;
  attachments?: Attachment[];
  onImageClick?: (images: Attachment[], index: number) => void;
  showReply?: boolean;
  onReply?: () => void;
  avatarSrc?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative pb-5 pl-8">
      <div className="absolute -left-[14px] top-0.5 z-10">
        <TimelineAvatar role={role} label={label} avatarSrc={avatarSrc} />
      </div>

      <p className="text-[12px] text-gray-500 leading-snug">
        <span className="font-semibold text-gray-900">{label}</span>{" "}
        <span>{action}</span>
        <span className="mx-1.5 text-gray-300">·</span>
        <span className="text-gray-400">
          {new Date(time).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      </p>

      {text && (
        <div className="mt-1.5 bg-white rounded-lg border border-black/5 px-3.5 py-2.5">
          <p className="text-[13px] text-gray-700 whitespace-pre-wrap leading-relaxed">
            {text}
          </p>
        </div>
      )}

      {attachments && attachments.length > 0 && (
        <div className="mt-2">
          <AttachmentPillList attachments={attachments} onImageClick={onImageClick} />
        </div>
      )}

      {showReply && onReply && (
        <div className="mt-2">
          <button
            type="button"
            onClick={onReply}
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700 transition hover:bg-black/5"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Reply
          </button>
        </div>
      )}

      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

export default function AdminDisputeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [d, setD] = useState<Dispute | null>(null);
  const [comment, setComment] = useState("");
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [posting, setPosting] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<DisputeStatus | "">("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [updating, setUpdating] = useState(false);
  const [quickAction, setQuickAction] = useState<"accept" | "not_interested" | null>(null);
  const [riskTab, setRiskTab] = useState<"brand" | "influencer">("influencer");
  const [previewState, setPreviewState] = useState<ImagePreviewState>(null);
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(null);
  const [isEvidenceDialogOpen, setIsEvidenceDialogOpen] = useState(false);
  const [evidenceName, setEvidenceName] = useState("");
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [submittingEvidence, setSubmittingEvidence] = useState(false);
  const replyTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const load = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await get<{ dispute: Dispute }>(`/dispute/admin/${id}`);
      setD(data.dispute);
    } catch (e) {
      const message = getErrorMessage(e, "Failed to load dispute.");
      setError(message);
      setD(null);

      showErrorToast("Dispute loading failed", e, "Failed to load dispute.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const getValidFiles = useCallback((files: File[]) => {
    const max = 10 * 1024 * 1024;
    const oversized = files.filter((f) => f.size > max);

    if (oversized.length) {
      showValidationToast(
        "File too large",
        `"${oversized[0].name}" exceeds 10 MB.`
      );
    }

    return files.filter((f) => f.size <= max);
  }, []);

  const handleCommentFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = getValidFiles(Array.from(e.target.files || []));
      setCommentFiles((p) => [...p, ...files]);
      e.target.value = "";
    },
    [getValidFiles]
  );

  const handleEvidenceFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = getValidFiles(Array.from(e.target.files || []));
      setEvidenceFiles((p) => [...p, ...files]);
      e.target.value = "";
    },
    [getValidFiles]
  );

  const resetEvidenceDialog = useCallback(() => {
    setEvidenceName("");
    setEvidenceNotes("");
    setEvidenceFiles([]);
  }, []);

  const closeEvidenceDialog = useCallback(() => {
    if (submittingEvidence) return;
    setIsEvidenceDialogOpen(false);
    resetEvidenceDialog();
  }, [resetEvidenceDialog, submittingEvidence]);

  const getAdminId = () => {
    if (typeof window === "undefined") return "";

    return String(
      localStorage.getItem("adminId") ||
        localStorage.getItem("admin_id") ||
        localStorage.getItem("userId") ||
        localStorage.getItem("user_id") ||
        ""
    ).trim();
  };

  const openPreview = useCallback(
    (imgs: Attachment[], i: number) => setPreviewState({ images: imgs, index: i }),
    []
  );

  const closePreview = useCallback(() => setPreviewState(null), []);

  const prevImg = useCallback(
    () =>
      setPreviewState((p) =>
        p && p.images.length > 1
          ? { ...p, index: (p.index - 1 + p.images.length) % p.images.length }
          : p
      ),
    []
  );

  const nextImg = useCallback(
    () =>
      setPreviewState((p) =>
        p && p.images.length > 1
          ? { ...p, index: (p.index + 1) % p.images.length }
          : p
      ),
    []
  );

  if (loading) {
    return (
      <>
        <ToastStyles />

        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="h-10 w-10 rounded-full border-2 border-black/5 border-t-black/70 animate-spin mx-auto" />
            <p className="mt-4 text-sm text-gray-500">Loading dispute…</p>
          </div>
        </div>
      </>
    );
  }

  if (error && !d) {
    return (
      <>
        <ToastStyles />

        <div className="min-h-screen bg-white flex items-center justify-center p-6">
          <div className="bg-white rounded-lg border border-black/5 p-8 max-w-md w-full text-center">
            <XCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <Button variant="outline" onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </>
    );
  }

  if (!d) return null;

  const st = STATUS_MAP[d.status] ?? STATUS_MAP.open;
  const pri = PRIORITY_MAP[d.priority ?? "medium"] ?? PRIORITY_MAP.medium;
  const isFinalized = d.status === "resolved" || d.status === "rejected";
  const currentStatusOption =
    statusOptions.find((option) => option.value === d.status) || {
      value: d.status,
      label: st.label,
      dot: st.dot,
    };
  const currentStatusIndex = Math.max(0, STATUS_FLOW_ORDER.indexOf(d.status));
  const hasAdminAccepted = d.status !== "open" && !isFinalized;
  const canAdminModify = hasAdminAccepted && !isFinalized;
  const modificationLockMessage = "Accept the dispute first to unlock admin actions.";

  const submitEvidence = async () => {
    if (!id || !d) {
      showValidationToast("Dispute missing", "Unable to identify this dispute.");
      return;
    }

    if (!canAdminModify) {
      showWarningToast("Action locked", modificationLockMessage);
      return;
    }

    if (!evidenceName.trim()) {
      showValidationToast("Evidence name required", "Evidence name is required.");
      return;
    }

    if (!evidenceFiles.length) {
      showValidationToast(
        "Evidence attachment required",
        "Please attach at least one evidence file."
      );
      return;
    }

    setSubmittingEvidence(true);

    try {
      const form = new FormData();
      form.append("evidenceName", evidenceName.trim());

      if (evidenceNotes.trim()) {
        form.append("notes", evidenceNotes.trim());
      }

      evidenceFiles.forEach((file) => form.append("attachments", file));

      await postFormData(`/dispute/admin/${id}/evidence`, form);

      setIsEvidenceDialogOpen(false);
      resetEvidenceDialog();

      showSuccessToast("Evidence added", "Evidence has been added successfully.");

      await load();
    } catch (e) {
      showErrorToast("Add evidence failed", e, "Failed to add evidence.");
    } finally {
      setSubmittingEvidence(false);
    }
  };

  const postComment = async () => {
    if (!id || !d) {
      showValidationToast("Dispute missing", "Unable to identify this dispute.");
      return;
    }

    if (!canAdminModify) {
      showWarningToast("Action locked", modificationLockMessage);
      return;
    }

    if (!comment.trim() && !commentFiles.length) {
      showValidationToast(
        "Reply required",
        "Write a reply or attach at least one file before posting."
      );
      return;
    }

    setPosting(true);

    try {
      const form = new FormData();
      form.append("text", comment.trim());

      if (activeReplyCommentId) {
        form.append("parentCommentId", activeReplyCommentId);
      }

      commentFiles.forEach((f) => form.append("attachments", f));

      await postFormData(`/dispute/admin/${id}/comment`, form);

      setComment("");
      setCommentFiles([]);
      setActiveReplyCommentId(null);

      showSuccessToast("Reply posted", "Your reply has been added to the dispute.");

      await load();
    } catch (e) {
      showErrorToast("Post reply failed", e, "Failed to post reply.");
    } finally {
      setPosting(false);
    }
  };

  const updateStatus = async () => {
    if (!id || !d) {
      showValidationToast("Dispute missing", "Unable to identify this dispute.");
      return;
    }

    if (!canAdminModify) {
      showWarningToast("Action locked", modificationLockMessage);
      return;
    }

    if (!pendingStatus) {
      showValidationToast("Status required", "Please select a new status.");
      return;
    }

    setUpdating(true);

    try {
      await post("/dispute/admin/update-status", {
        disputeId: id,
        status: pendingStatus,
        resolution: resolutionNote || undefined,
      });

      setResolutionNote("");
      setPendingStatus("");

      showSuccessToast("Status updated", "Dispute status has been updated.");

      await load();
    } catch (e) {
      showErrorToast("Status update failed", e, "Failed to update dispute status.");
    } finally {
      setUpdating(false);
    }
  };

  const handleAcceptDispute = async () => {
    if (!id || !d) {
      showValidationToast("Dispute missing", "Unable to identify this dispute.");
      return;
    }

    if (d.status !== "open") {
      showWarningToast("Already accepted", "This dispute is already accepted or finalized.");
      return;
    }

    setQuickAction("accept");

    try {
      await post("/dispute/admin/update-status", {
        disputeId: id,
        status: "in_review",
        resolution: resolutionNote || undefined,
      });

      setPendingStatus("");

      showSuccessToast("Dispute accepted", "The dispute is now under review.");

      await load();
    } catch (e) {
      showErrorToast("Accept dispute failed", e, "Failed to accept dispute.");
    } finally {
      setQuickAction(null);
    }
  };

  const handleNotInterested = async () => {
    if (!id || !d) {
      showValidationToast("Dispute missing", "Unable to identify this dispute.");
      return;
    }

    if (isFinalized) {
      showWarningToast(
        "Action unavailable",
        "This dispute is already finalized."
      );
      return;
    }

    const adminId = getAdminId();

    if (!adminId) {
      showValidationToast("Admin ID missing", "Missing admin ID. Please log in again.");
      return;
    }

    setQuickAction("not_interested");

    try {
      await post("/dispute/admin/not-interested", {
        disputeId: id,
        adminId,
      });

      showSuccessToast(
        "Dispute removed",
        "The dispute has been marked as not interested."
      );

      router.push("/admin/disputes");
    } catch (e) {
      showErrorToast(
        "Not interested failed",
        e,
        "Failed to mark dispute as not interested."
      );
    } finally {
      setQuickAction(null);
    }
  };

  const handleReplyToBrandComment = (replyToComment: Comment) => {
    const brandDisplayName = d?.brandName || "Brand";
    setActiveReplyCommentId(replyToComment.commentId);
    setComment((prev) => (prev.trim() ? prev : `@${brandDisplayName} `));

    requestAnimationFrame(() => {
      replyTextareaRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      replyTextareaRef.current?.focus();
    });
  };

  const cancelInlineReply = () => {
    setActiveReplyCommentId(null);
    setComment("");
    setCommentFiles([]);
  };

  const raisedByName =
    d.raisedBy?.name ||
    (d.raisedByRole === "Brand" ? d.brandName : d.influencerName) ||
    d.raisedBy?.id?.slice(-6) ||
    "—";
  const raisedAgainstName =
    d.raisedAgainst?.name ||
    (d.raisedAgainst?.role === "Brand" ? d.brandName : d.influencerName) ||
    d.raisedAgainst?.id?.slice(-6) ||
    "—";
  const brandEmail = d.brandEmail || d.raisedBy?.email || null;
  const influencerEmail = d.influencerEmail || d.raisedAgainst?.email || null;
  const brandLogoUrl = getBrandLogoUrl(d);
  const influencerProfileImage =
    d.influencerProfileImage ||
    (d.raisedBy?.role === "Influencer"
      ? d.raisedBy.logoUrl
      : d.raisedAgainst?.role === "Influencer"
        ? d.raisedAgainst.logoUrl
        : null) ||
    null;

  const brandSince =
    d.brandSince ||
    (d.raisedBy?.role === "Brand"
      ? d.raisedBy.since
      : d.raisedAgainst?.role === "Brand"
        ? d.raisedAgainst.since
        : null) ||
    "—";

  const influencerSince =
    d.influencerSince ||
    (d.raisedBy?.role === "Influencer"
      ? d.raisedBy.since
      : d.raisedAgainst?.role === "Influencer"
        ? d.raisedAgainst.since
        : null) ||
    "—";

  const brandDisputesFiledCount =
    d.brandDisputesFiledCount ?? (d.raisedByRole === "Brand" ? 1 : 0);
  const brandDisputesAgainstCount =
    d.brandDisputesAgainstCount ?? (d.raisedByRole === "Influencer" ? 1 : 0);
  const influencerDisputesFiledCount =
    d.influencerDisputesFiledCount ?? (d.raisedByRole === "Influencer" ? 1 : 0);
  const influencerDisputesAgainstCount =
    d.influencerDisputesAgainstCount ?? (d.raisedByRole === "Brand" ? 1 : 0);

  const brandRoleInDispute = d.raisedByRole === "Brand" ? "Filed" : "Against";
  const influencerRoleInDispute =
    d.raisedByRole === "Influencer" ? "Filed" : "Against";

  const evidenceItems = Array.isArray(d.evidence) ? d.evidence : [];
  const evidenceFilesCount = getEvidenceFilesCount(evidenceItems);

  const influencerSignals = [
    {
      key: "influencer-dispute-frequency",
      title: "Influencer Dispute Frequency",
      description: "Involved in 3 disputes in the last 6 months. Platform avg: 0.5.",
      icon: "clock",
    },
  ];

  const brandSignals = [
    {
      key: "brand-first-time-dispute",
      title: "First-time Brand Dispute",
      description: "Brand has a clean record — 42 successful campaigns.",
      icon: "check",
    },
  ];

  const visibleComments = (d.comments ?? []).filter((c) => !isEvidenceAuditComment(c));
  const rootComments = visibleComments.filter((c) => !c.parentCommentId);

  const repliesByParent = visibleComments.reduce<Record<string, Comment[]>>(
    (acc, item) => {
      if (item.parentCommentId) {
        if (!acc[item.parentCommentId]) acc[item.parentCommentId] = [];
        acc[item.parentCommentId].push(item);
      }

      return acc;
    },
    {}
  );

  return (
    <>
      <ToastStyles />

      <header className="top-0 z-30 bg-white">
        <div className="h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push("/admin/disputes")}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-black/5 hover:bg-black/5 text-gray-700 transition flex-shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="h-5 w-px bg-black/10 flex-shrink-0" />
            <Shield className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[15px] font-bold text-gray-900 truncate max-w-[220px]">
                  {d.subject || "Untitled Dispute"}
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ring-1 ${st.bg} ${st.text} ${st.ring}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                  {st.label.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            {d.status === "open" && !isFinalized && (
              <>
                <button
                  onClick={handleAcceptDispute}
                  disabled={quickAction !== null || updating}
                  className="inline-flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium rounded-lg text-white bg-black hover:bg-black/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {quickAction === "accept" ? "Accepting..." : "Accept"}
                </button>

                <button
                  onClick={handleNotInterested}
                  disabled={quickAction !== null || updating}
                  className="inline-flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium rounded-lg border border-black/10 bg-white text-gray-900 hover:bg-black/5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  {quickAction === "not_interested" ? "Removing..." : "Not Interested"}
                </button>
              </>
            )}

            {hasAdminAccepted && !isFinalized && (
              <button
                disabled
                className="inline-flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium rounded-lg text-white bg-black disabled:opacity-100 disabled:cursor-default"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Accepted
              </button>
            )}
          </div>
        </div>

        <div className="max-w-[1440px] mx-auto px-6 pb-2.5 flex items-center gap-5 flex-wrap">
          <span className="flex items-center gap-1.5 text-[12px] text-gray-500">
            <Hash className="h-3.5 w-3.5 text-gray-300" />
            <span className="font-mono text-gray-700 font-medium">{d.disputeId}</span>
          </span>
          <span className="flex items-center gap-1.5 text-[12px] text-gray-500">
            <Calendar className="h-3.5 w-3.5 text-gray-300" />
            Created{" "}
            {new Date(d.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1.5 text-[12px] text-gray-500">
            <Activity className="h-3.5 w-3.5 text-gray-300" />
            Updated{" "}
            {new Date(d.updatedAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
          {d.assignedTo?.name && (
            <span className="flex items-center gap-1.5 text-[12px] text-gray-500">
              <User className="h-3.5 w-3.5 text-gray-300" />
              Admin:
              <span className="font-medium text-gray-800 ml-1">
                {d.assignedTo.name}
              </span>
            </span>
          )}
        </div>
      </header>

      <div className="min-h-screen bg-white">
        <div className="py-6">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_308px] gap-5">
            <div className="space-y-5">
              <Card>
                <CardHeader title="Dispute Overview" />
                <div className="p-5">
                  {!canAdminModify && !isFinalized && (
                    <div className="mb-3 rounded-lg border border-dashed border-black/10 bg-white px-3 py-2 text-[11px] text-gray-500">
                      {modificationLockMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 mb-4 border-b border-black/5">
                    <MetaChip
                      icon={<Layers className="h-3.5 w-3.5" />}
                      label="Campaign"
                      value={d.campaignName || (d.campaignId ? "View Campaign" : "—")}
                      valueClass={
                        d.campaignId
                          ? "text-gray-900 cursor-pointer hover:underline"
                          : "text-gray-400"
                      }
                    />
                    <MetaChip
                      icon={<Tag className="h-3.5 w-3.5" />}
                      label="Issue Types"
                      value={
                        <IssueTypeSummary
                          issueTypes={d.issueType}
                          otherIssueDescription={d.otherIssueDescription}
                          compact
                        />
                      }
                    />
                    <MetaChip
                      icon={<Shield className="h-3.5 w-3.5" />}
                      label="Raised By"
                      value={`${d.raisedBy?.role || d.createdBy?.role || "—"} · ${raisedByName}`}
                    />
                    <MetaChip
                      icon={<AlertCircle className="h-3.5 w-3.5" />}
                      label="Against"
                      value={`${d.raisedAgainst?.role || "—"} · ${raisedAgainstName}`}
                    />
                  </div>

                  {d.description ? (
                    <div className="bg-white rounded-lg border border-black/5 px-4 py-3 mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                        Dispute Description
                      </p>
                      <p className="text-[13px] text-gray-700 leading-relaxed">
                        {d.description}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg border border-dashed border-black/5 px-4 py-3 mb-4">
                      <p className="text-[12px] text-gray-400 italic">
                        No description provided.
                      </p>
                    </div>
                  )}

                  {d.attachments && d.attachments.length > 0 && (
                    <AttachmentPillList attachments={d.attachments} onImageClick={openPreview} />
                  )}
                </div>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card
                  className="cursor-pointer hover:shadow-md transition"
                  onClick={() => router.push(`/admin/brands/view?brandId=${d.brandId}`)}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Brand Details
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-gray-600 font-semibold border border-black/5">
                        Client
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 mb-4">
                      <ProfileAvatar name={d.brandName || "Unknown Brand"} imageUrl={brandLogoUrl} />
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-gray-900 truncate">
                          {d.brandName || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-3 text-[12px]">
                      {[
                        ["In This Dispute", brandRoleInDispute],
                        ["Since", brandSince],
                        ["Disputes Filed", String(brandDisputesFiledCount)],
                        ["Disputes Against", String(brandDisputesAgainstCount)],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide">{k}</p>
                          <p className="font-semibold text-gray-800">{v}</p>
                        </div>
                      ))}
                    </div>

                    {brandEmail && (
                      <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Contact
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `mailto:${brandEmail}`;
                            }}
                            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-black text-white text-[10px] font-medium hover:bg-black/80 flex-shrink-0"
                          >
                            <Mail className="h-3 w-3" />
                            Email
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                <Card
                  className="cursor-pointer hover:shadow-md transition"
                  onClick={() =>
                    router.push(`/admin/influencers/view?influencerId=${d.influencerId}`)
                  }
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Influencer Details
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-gray-600 font-semibold border border-black/5">
                        Creator
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 mb-4">
                      <ProfileAvatar
                        name={d.influencerName || "Unknown Influencer"}
                        imageUrl={influencerProfileImage}
                        fallbackClassName="bg-white text-gray-900"
                      />
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-gray-900 truncate">
                          {d.influencerName || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-3 text-[12px]">
                      {[
                        ["In This Dispute", influencerRoleInDispute],
                        ["Since", influencerSince],
                        ["Disputes Filed", String(influencerDisputesFiledCount)],
                        ["Disputes Against", String(influencerDisputesAgainstCount)],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide">{k}</p>
                          <p className="font-semibold text-gray-800">{v}</p>
                        </div>
                      ))}
                    </div>

                    {influencerEmail && (
                      <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Contact
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `mailto:${influencerEmail}`;
                            }}
                            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-black text-white text-[10px] font-medium hover:bg-black/80 flex-shrink-0"
                          >
                            <Mail className="h-3 w-3" />
                            Email
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                <Card>
                  <div className="p-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                      Campaign Status
                    </p>

                    {d.campaignId ? (
                      <button
                        onClick={() => router.push(`/admin/campaigns/view?id=${d.campaignId}`)}
                        className="w-full flex items-center justify-between border border-black/5 rounded-lg px-3 py-2.5 hover:bg-black/5 transition mb-3 group bg-white"
                      >
                        <div className="text-left min-w-0">
                          <p className="text-[12px] font-semibold text-gray-800 truncate">
                            {d.campaignName || "-"}
                          </p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-gray-700 transition flex-shrink-0" />
                      </button>
                    ) : (
                      <div className="border border-dashed border-black/5 rounded-lg px-3 py-2.5 mb-3">
                        <p className="text-[12px] text-gray-400 italic">
                          No campaign linked
                        </p>
                      </div>
                    )}

                    <div className="space-y-2.5 text-[12px]">
                      {[
                        ["Dispute Status", <span key="s" className={`font-semibold ${st.text}`}>{st.label}</span>],
                        ["Priority", <span key="p" className={`inline-flex items-center rounded-lg border border-black/5 px-2 py-0.5 font-semibold ${pri.text}`}>{pri.label}</span>],
                        ["Assigned Admin", <span key="a" className="font-semibold text-gray-800">{d.assignedTo?.name || "Unassigned"}</span>],
                        ["Attachments", <span key="at" className="font-semibold text-gray-800">{d.attachments?.length ?? 0} files</span>],
                        ["Comments", <span key="c" className="font-semibold text-gray-800">{d.comments?.length ?? 0}</span>],
                      ].map(([k, v]) => (
                        <div key={String(k)} className="flex items-center justify-between">
                          <span className="text-gray-500">{k}</span>
                          {v}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              <Card>
                <CardHeader
                  title="Evidence Room"
                  extra={
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400">
                        {evidenceItems.length} evidence · {evidenceFilesCount} files
                      </span>
                      {!isFinalized && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!canAdminModify) {
                              showWarningToast("Action locked", modificationLockMessage);
                              return;
                            }

                            setIsEvidenceDialogOpen(true);
                          }}
                          disabled={!canAdminModify}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-black/80 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          Add Evidence
                        </button>
                      )}
                    </div>
                  }
                />

                <div className="p-5">
                  {evidenceItems.length > 0 ? (
                    <div className="space-y-3">
                      {evidenceItems.map((item, idx) => {
                        const files = Array.isArray(item.attachments)
                          ? item.attachments
                          : [];
                        const createdAtLabel = item.createdAt
                          ? new Date(item.createdAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })
                          : null;

                        return (
                          <div
                            key={item.evidenceId || `${item.evidenceName}-${idx}`}
                            className="rounded-lg border border-black/5 bg-white p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-[13px] font-semibold text-gray-900 truncate">
                                  {item.evidenceName || `Evidence ${idx + 1}`}
                                </p>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
                                  <AttachmentUploaderBadge role={item.createdBy?.role || "Admin"} />
                                  <span className="text-gray-500">
                                    {item.createdBy?.name || "Admin"}
                                  </span>
                                  {createdAtLabel && (
                                    <>
                                      <span className="text-gray-300">•</span>
                                      <span>{createdAtLabel}</span>
                                    </>
                                  )}
                                  <span className="text-gray-300">•</span>
                                  <span>
                                    {files.length} file{files.length !== 1 ? "s" : ""}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {item.notes ? (
                              <p className="mt-3 text-[12px] leading-relaxed text-gray-600">
                                {item.notes}
                              </p>
                            ) : null}

                            {files.length > 0 ? (
                              <div className="mt-3">
                                <AttachmentPillList attachments={files} onImageClick={openPreview} />
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-black/5 px-4 py-10 text-center">
                      <p className="text-[13px] font-medium text-gray-700">No evidence</p>
                      <p className="mt-1 text-[11px] text-gray-400">
                        No evidence has been added for this dispute yet.
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              <Card>
                <CardHeader
                  title="Audit Timeline"
                  extra={
                    <span className="text-[11px] text-gray-400">
                      {((d.comments ?? []).filter((c) => !isEvidenceAuditComment(c)).length) + 1} events
                    </span>
                  }
                />
                <div className="p-5">
                  <div className="relative border-l border-black/5 ml-3.5">
                    <TimelineItem
                      role="System"
                      label="System"
                      action="Dispute opened"
                      time={d.createdAt}
                      text={null}
                    />
                    {rootComments.map((c) => {
                      const canReplyToBrand =
                        canAdminModify &&
                        c.authorRole === "Brand" &&
                        !isSystemGeneratedBrandComment(c);
                      const authorLabel =
                        c.authorRole === "Brand"
                          ? d.brandName || "Brand"
                          : c.authorRole === "Influencer"
                            ? d.influencerName || "Influencer"
                            : "Admin";

                      return (
                        <TimelineItem
                          key={c.commentId}
                          role={c.authorRole}
                          label={authorLabel}
                          action={c.authorRole === "Admin" ? "added a note" : "sent a message"}
                          time={c.createdAt}
                          text={c.text || null}
                          attachments={c.attachments}
                          onImageClick={openPreview}
                          showReply={canReplyToBrand}
                          onReply={canReplyToBrand ? () => handleReplyToBrandComment(c) : undefined}
                          avatarSrc={c.authorRole === "Brand" ? brandLogoUrl : null}
                        >
                          {activeReplyCommentId === c.commentId && !isFinalized && (
                            <div className="rounded-lg border border-black/5 bg-white p-3">
                              <div className="mb-3 flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-[12px] font-semibold text-gray-900">
                                    Reply to {d.brandName || "Brand"}
                                  </p>
                                  <p className="text-[11px] text-gray-400">
                                    Your reply will be added directly in this timeline.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={cancelInlineReply}
                                  className="text-[11px] font-medium text-gray-500 transition hover:text-gray-900"
                                >
                                  Cancel
                                </button>
                              </div>

                              <Textarea
                                ref={replyTextareaRef}
                                rows={3}
                                placeholder={`Reply to ${d.brandName || "Brand"}...`}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="resize-none text-[13px] rounded-lg border-black/5 bg-white focus:border-black focus:ring-0"
                              />

                              <div className="mt-3 flex items-center gap-2 flex-wrap">
                                <label className="inline-flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium text-gray-900 bg-white border border-black/5 rounded-lg cursor-pointer hover:bg-black/5 transition">
                                  <Paperclip className="h-3.5 w-3.5" />
                                  Attach files
                                  <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={handleCommentFileChange}
                                  />
                                </label>
                                {commentFiles.length > 0 && (
                                  <>
                                    <span className="text-[11px] text-gray-500">
                                      {commentFiles.length} file{commentFiles.length > 1 ? "s" : ""}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setCommentFiles([])}
                                      className="text-[11px] text-red-400 hover:text-red-600"
                                    >
                                      Remove all
                                    </button>
                                  </>
                                )}
                              </div>

                              <div className="mt-3 flex items-center justify-between gap-3">
                                <span className="text-[11px] text-gray-400">
                                  Admin timeline reply
                                </span>
                                <button
                                  type="button"
                                  onClick={postComment}
                                  disabled={posting || (!comment.trim() && !commentFiles.length)}
                                  className="inline-flex items-center gap-1.5 h-8 px-4 text-[12px] font-semibold text-white bg-black rounded-lg hover:bg-black/80 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                >
                                  {posting ? "Posting..." : "Post Reply"}
                                </button>
                              </div>
                            </div>
                          )}

                          {(repliesByParent[c.commentId] ?? []).length > 0 && (
                            <div className="mt-3 ml-4 rounded-lg border border-black/5 bg-[#fafafa] p-3">
                              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                Thread
                              </p>

                              <div className="space-y-3">
                                {(repliesByParent[c.commentId] ?? []).map((reply) => {
                                  const replyAuthorLabel =
                                    reply.authorRole === "Brand"
                                      ? d.brandName || "Brand"
                                      : reply.authorRole === "Influencer"
                                        ? d.influencerName || "Influencer"
                                        : "Admin";

                                  return (
                                    <div
                                      key={reply.commentId}
                                      className="rounded-lg border border-black/5 bg-white p-3"
                                    >
                                      <div className="flex items-center gap-2">
                                        <TimelineAvatar
                                          role={reply.authorRole}
                                          label={replyAuthorLabel}
                                          avatarSrc={reply.authorRole === "Brand" ? brandLogoUrl : null}
                                        />
                                        <p className="text-[12px] text-gray-500">
                                          <span className="font-semibold text-gray-900">
                                            {replyAuthorLabel}
                                          </span>
                                          <span className="mx-1.5 text-gray-300">·</span>
                                          <span className="text-gray-400">
                                            {new Date(reply.createdAt).toLocaleString("en-US", {
                                              month: "short",
                                              day: "numeric",
                                              year: "numeric",
                                              hour: "numeric",
                                              minute: "2-digit",
                                            })}
                                          </span>
                                        </p>
                                      </div>

                                      {reply.text ? (
                                        <div className="mt-2 rounded-lg border border-black/5 px-3 py-2.5 bg-white">
                                          <p className="text-[13px] leading-relaxed text-gray-700 whitespace-pre-wrap">
                                            {reply.text}
                                          </p>
                                        </div>
                                      ) : null}

                                      {reply.attachments?.length ? (
                                        <div className="mt-2">
                                          <AttachmentPillList
                                            attachments={reply.attachments}
                                            onImageClick={openPreview}
                                          />
                                        </div>
                                      ) : null}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </TimelineItem>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader title="Resolution Control" />
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                      Current Status
                    </label>
                    <StatusBadge label={currentStatusOption.label} dotClass={currentStatusOption.dot} />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                      Update Status
                    </label>
                    <Select
                      value={pendingStatus}
                      onValueChange={(v) => setPendingStatus(v as DisputeStatus)}
                      disabled={!canAdminModify}
                    >
                      <SelectTrigger className="w-full text-[13px] h-9 rounded-lg border-black/5 bg-white disabled:opacity-50">
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-black/5 shadow-xl rounded-lg [&_[data-highlighted]]:!bg-black [&_[data-highlighted]]:!text-white [&_[data-highlighted]_*]:!text-white">
                        {statusOptions.map((o) => {
                          const optionIndex = STATUS_FLOW_ORDER.indexOf(o.value as DisputeStatus);
                          const isBackwardMove =
                            optionIndex !== -1 && optionIndex < currentStatusIndex;

                          return (
                            <SelectItem
                              key={o.value}
                              value={o.value}
                              disabled={Boolean(o.disabled) || isBackwardMove}
                              className="cursor-pointer data-[highlighted]:!bg-black data-[highlighted]:!text-white data-[highlighted]:outline-none focus:!bg-black focus:!text-white"
                            >
                              <div className="inline-flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${o.dot}`} />
                                <span>{o.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                      Resolution Notes (Audit Trail)
                    </label>
                    <Textarea
                      rows={3}
                      placeholder="Summarise the decision or current status update..."
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      disabled={!canAdminModify}
                      className="resize-none text-[13px] rounded-lg border-black/5 bg-white focus:border-black focus:ring-0 disabled:opacity-50"
                    />
                  </div>

                  {!canAdminModify && !isFinalized && (
                    <div className="rounded-lg border border-dashed border-black/10 bg-white px-3 py-2 text-[11px] text-gray-500">
                      {modificationLockMessage}
                    </div>
                  )}

                  <button
                    onClick={updateStatus}
                    disabled={updating || !pendingStatus || !canAdminModify}
                    className="w-full h-9 text-[13px] font-semibold text-white bg-black rounded-lg hover:bg-black/80 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    {updating ? "Updating..." : "Update Record"}
                  </button>
                </div>
              </Card>

              <Card>
                <CardHeader
                  title="Risk & Signals"
                  extra={<AlertTriangle className="h-4 w-4 text-gray-700" />}
                />
                <div className="p-4">
                  <Tabs
                    value={riskTab}
                    onValueChange={(value) => setRiskTab(value as "brand" | "influencer")}
                    className="w-full"
                  >
                    <TabsList className="mb-3 grid w-full grid-cols-2 rounded-lg bg-white p-0 border border-black/10">
                      <TabsTrigger
                        value="brand"
                        className="inline-flex items-center justify-between rounded-lg px-3 py-2 text-[12px] font-medium data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-none"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5" />
                          Brand
                        </span>
                        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-black px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {brandSignals.length}
                        </span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="influencer"
                        className="inline-flex items-center justify-between rounded-lg px-3 py-2 text-[12px] font-medium data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-none"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          Influencer
                        </span>
                        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-black px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {influencerSignals.length}
                        </span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="brand" className="mt-0 space-y-2.5">
                      {brandSignals.length > 0 ? (
                        brandSignals.map((signal) => (
                          <div key={signal.key} className="rounded-lg bg-white border border-black/5 p-3">
                            <div className="flex items-start gap-2">
                              {signal.icon === "clock" ? (
                                <Clock className="h-4 w-4 text-gray-700 mt-0.5 flex-shrink-0" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 text-gray-700 mt-0.5 flex-shrink-0" />
                              )}
                              <div>
                                <p className="text-[12px] font-semibold text-gray-900">{signal.title}</p>
                                <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
                                  {signal.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-lg border border-dashed border-black/10 px-3 py-6 text-center">
                          <p className="text-[12px] font-medium text-gray-700">No signals</p>
                          <p className="mt-1 text-[11px] text-gray-400">
                            No risk signals available for the brand yet.
                          </p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="influencer" className="mt-0 space-y-2.5">
                      {influencerSignals.length > 0 ? (
                        influencerSignals.map((signal) => (
                          <div key={signal.key} className="rounded-lg bg-white border border-black/5 p-3">
                            <div className="flex items-start gap-2">
                              {signal.icon === "clock" ? (
                                <Clock className="h-4 w-4 text-gray-700 mt-0.5 flex-shrink-0" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 text-gray-700 mt-0.5 flex-shrink-0" />
                              )}
                              <div>
                                <p className="text-[12px] font-semibold text-gray-900">{signal.title}</p>
                                <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
                                  {signal.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-lg border border-dashed border-black/10 px-3 py-6 text-center">
                          <p className="text-[12px] font-medium text-gray-700">No signals</p>
                          <p className="mt-1 text-[11px] text-gray-400">
                            No risk signals available for the influencer yet.
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </Card>

              <div className="grid grid-cols-3 gap-2.5">
                <StatBox value="12" label="Open Disputes" />
                <StatBox value="45" label="Resolved / Mo" />
                <StatBox value="8%" label="Escalation" />
              </div>

              <div className="space-y-2">
                <button
                  disabled={!canAdminModify}
                  onClick={() => showWarningToast("Coming soon", "Release payment action is not connected yet.")}
                  className="w-full flex items-center gap-2.5 h-10 px-4 text-[12px] font-medium text-gray-900 bg-white border border-black/5 rounded-lg hover:bg-black/5 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  Release Payment to Escrow
                </button>
                <button
                  disabled={!canAdminModify}
                  onClick={() => showWarningToast("Coming soon", "Partial refund action is not connected yet.")}
                  className="w-full flex items-center gap-2.5 h-10 px-4 text-[12px] font-medium text-gray-900 bg-white border border-black/5 rounded-lg hover:bg-black/5 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <BarChart2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  Issue Partial Refund…
                </button>
                <button
                  disabled={!canAdminModify}
                  onClick={() => showWarningToast("Coming soon", "Legal review action is not connected yet.")}
                  className="w-full flex items-center gap-2.5 h-10 px-4 text-[12px] font-medium text-gray-900 bg-white border border-black/5 rounded-lg hover:bg-black/5 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Flag className="h-4 w-4 text-red-400 flex-shrink-0" />
                  Flag for Legal Review
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEvidenceDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]"
          onClick={closeEvidenceDialog}
        >
          <div
            className="w-full max-w-xl rounded-lg border border-black/10 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-black/5 px-5 py-4">
              <div>
                <h3 className="text-[15px] font-semibold text-gray-900">Add Evidence</h3>
                <p className="mt-1 text-[12px] text-gray-400">
                  Add evidence name, notes, and supporting attachments.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEvidenceDialog}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/5 text-gray-500 transition hover:bg-black/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Evidence Name
                </label>
                <input
                  type="text"
                  value={evidenceName}
                  onChange={(e) => setEvidenceName(e.target.value)}
                  placeholder="Enter evidence name"
                  className="h-10 w-full rounded-lg border border-black/5 bg-white px-3 text-[13px] text-gray-900 outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Notes
                </label>
                <Textarea
                  rows={4}
                  value={evidenceNotes}
                  onChange={(e) => setEvidenceNotes(e.target.value)}
                  placeholder="Add supporting notes for this evidence..."
                  className="resize-none text-[13px] rounded-lg border-black/5 bg-white focus:border-black focus:ring-0"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Attachments
                </label>
                <div className="rounded-lg border border-dashed border-black/10 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[12px] font-medium text-gray-700">Upload files</p>
                      <p className="text-[11px] text-gray-400">
                        PDF, JPG, PNG, MP4 · max 10 MB each
                      </p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-2 text-[12px] font-medium text-gray-700 transition hover:bg-black/5">
                      <Paperclip className="h-3.5 w-3.5" />
                      Choose files
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleEvidenceFileChange}
                      />
                    </label>
                  </div>

                  {evidenceFiles.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-black/5 pt-3">
                      {evidenceFiles.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-black/5 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-medium text-gray-800">
                              {file.name}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {(file.size / 1024).toFixed(0)} KB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setEvidenceFiles((prev) =>
                                prev.filter((_, fileIndex) => fileIndex !== index)
                              )
                            }
                            className="text-[11px] font-medium text-red-500 transition hover:text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-black/5 px-5 py-4">
              <p className="text-[11px] text-gray-400">
                This will add a new evidence entry to the dispute.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeEvidenceDialog}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-black/10 bg-white px-4 text-[12px] font-medium text-gray-700 transition hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitEvidence}
                  disabled={submittingEvidence}
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-black px-4 text-[12px] font-semibold text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingEvidence ? "Saving..." : "Save Evidence"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ImagePreviewModal
        state={previewState}
        onClose={closePreview}
        onPrev={prevImg}
        onNext={nextImg}
      />
    </>
  );
}