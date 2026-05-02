"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { get, postFormData } from "@/lib/api";
import api from "@/lib/api";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/buttonComp";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowUUpLeftIcon,
  ChatTeardropTextIcon,
  CheckIcon,
  DotsThreeIcon,
  FlagIcon,
  NoteIcon,
  NotePencilIcon,
  PencilSimpleLineIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import {
  apiEditDispute,
  apiGetBrandLite,
  apiRevokeDispute,
  type BrandLiteResponse,
} from "@/app/brand/services/brandApi";
import {
  DisputeFormDialog,
  type ExistingAttachment,
} from "@/components/common/disputes/DisputeFormDialog";
import { toast } from "@/components/ui/toast";
import Swal from "sweetalert2";
import ConfirmActionModal from "@/components/common/disputes/ConfirmActionModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

type AuthorRole = "Admin" | "Brand" | "Influencer";

type DisputeStatus =
  | "open"
  | "in_review"
  | "awaiting_user"
  | "evidence_submitted"
  | "in_negotiation"
  | "resolution_proposed"
  | "resolved"
  | "rejected"
  | "revoked";

interface Attachment {
  url: string;
  originalName?: string | null;
  mimeType?: string | null;
  size?: number | null;
}

interface Comment {
  commentId: string;
  authorRole: AuthorRole;
  authorId: string;
  text: string;
  createdAt: string;
  attachments?: Attachment[];
  parentCommentId?: string | null;
  threadRootCommentId?: string | null;
}

interface DisputeParty {
  role: "Brand" | "Influencer";
  id: string;
  name?: string | null;
  handle?: string | null;
  provider?: string | null;
  profilePic?: string | null;
  logoUrl?: string | null;
}

interface AssignedAdmin {
  adminId?: string | null;
  name?: string | null;
}

interface Dispute {
  disputeId: string;
  subject: string;
  description: string;
  status: DisputeStatus;
  priority?: string;
  campaignId?: string | null;
  campaignName?: string | null;
  brandId: string;
  influencerId: string;
  issueType?: string[];
  otherIssueDescription?: string | null;
  assignedTo?: AssignedAdmin | null;
  comments: Comment[];
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
  raisedByRole?: string | null;
  raisedById?: string | null;
  raisedBy?: DisputeParty | null;
  raisedAgainst?: DisputeParty | null;
  viewerIsRaiser?: boolean;
}

interface DisputeResponse {
  dispute: Dispute;
}

interface LightboxState {
  images: Attachment[];
  index: number;
}

interface MetaItem {
  label: string;
  value: string;
  sub?: string;
  tooltip?: string;
  issueTypes?: string[];
  otherIssueDescription?: string | null;
}

interface FaqItem {
  value: string;
  title: string;
  body: string;
}

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const PAGE_GUTTER = "px-[1.875rem] py-[1.875rem] lg:px-6";
/** Full border shorthand: `border border-[#e8e8e8]` */
const SURFACE_BORDER = "border border-[#e8e8e8]";
/** Border colour token only – use when the `border` utility is already applied. */
const SURFACE_BORDER_COLOR = "border-[#e8e8e8]";
const SUBTLE_BORDER = "border-[#f0f0f0]";
const MUTED_BG = "bg-[#F9F9F9]";

const STATUS_STEPS: Array<{ key: string; label: string }> = [
  { key: "submitted", label: "Dispute Submitted" },
  { key: "under_review", label: "Under Review" },
  { key: "response_evidence", label: "Response & Evidence" },
  { key: "resolved", label: "Resolved" },
];

const STATUS_STEP_INDEX: Record<DisputeStatus, number> = {
  open: 0,

  in_review: 1,
  in_negotiation: 1,
  resolution_proposed: 1,

  awaiting_user: 2,
  evidence_submitted: 2,

  resolved: 3,
  rejected: 3,
  revoked: 3,
};

const STATUS_LABELS: Record<DisputeStatus, string> = {
  open: "Open",
  in_review: "Under Review",
  awaiting_user: "Awaiting Response",
  evidence_submitted: "Evidence Submitted",
  in_negotiation: "In Negotiation",
  resolution_proposed: "Resolution Proposed",
  resolved: "Resolved",
  rejected: "Rejected",
  revoked: "Revoked",
};

const FAQ_ITEMS: FaqItem[] = [
  {
    value: "whats-happening-now",
    title: "What's happening now?",
    body: "Our team has received your dispute and is currently reviewing the details. This typically takes 2–5 business days. You'll be notified of any updates.",
  },
  {
    value: "whats-next",
    title: "What's next?",
    body: "Once the initial review is complete, both parties may be asked to provide evidence or respond to questions. Keep an eye on your email and notifications for further instructions.",
  },
];

const ROLE_AVATAR_STYLES: Record<AuthorRole, string> = {
  Admin: "bg-purple-100 text-purple-700",
  Brand: "bg-orange-100 text-orange-700",
  Influencer: "bg-blue-100 text-blue-700",
};

const ISSUE_TYPE_LABELS: Record<string, string> = {
  content_not_as_expected: "Content Not as Expected",
  delay_or_missed_deadline: "Delay or Missed Deadline",
  payment_issue: "Payment Issue",
  revision_issue: "Revision Issue",
  agreement_issue: "Agreement Issue",
  scope_change: "Scope Change",
  no_response: "No Response",
  other: "Other",
};

/* -------------------------------------------------------------------------- */
/*                                  Utilities                                 */
/* -------------------------------------------------------------------------- */

/**
 * Extracts a human-readable error message from an unknown thrown value.
 * Prefers `response.data.message`, then `message`, then the supplied fallback.
 */
function getErrorMessage(error: unknown, fallback: string): string {
  if (error == null || typeof error !== "object") return fallback;

  const maybeAxios = error as Record<string, unknown>;

  const serverMsg =
    (maybeAxios["response"] as Record<string, unknown> | undefined)?.["data"];
  if (
    serverMsg != null &&
    typeof serverMsg === "object" &&
    typeof (serverMsg as Record<string, unknown>)["message"] === "string"
  ) {
    return (serverMsg as Record<string, string>)["message"];
  }

  if (typeof maybeAxios["message"] === "string") return maybeAxios["message"];

  return fallback;
}

function formatIssueTypeLabel(value?: string | null): string {
  if (!value) return "—";
  return (
    ISSUE_TYPE_LABELS[value] ??
    value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}


function getIssueTypeMeta(dispute: Dispute): {
  value: string;
  sub?: string;
  tooltip?: string;
  issueTypes: string[];
  otherIssueDescription?: string | null;
} {
  const issueTypes = Array.isArray(dispute.issueType) ? dispute.issueType : [];

  const labels = issueTypes.length
    ? issueTypes.map(formatIssueTypeLabel).join(", ")
    : "—";

  const otherReason = String(dispute.otherIssueDescription || "").trim();

  return {
    value: labels,
    tooltip: issueTypes.includes("other")
      ? otherReason || "No other issue reason provided."
      : undefined,
    issueTypes,
    otherIssueDescription: dispute.otherIssueDescription ?? "",
  };
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function formatTimeAgo(dateStr: string): string {
  const days = daysSince(dateStr);
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function formatDaysLeft(days: number): string {
  return `${days} day${days !== 1 ? "s" : ""} left`;
}

function formatHandle(handle?: string | null): string | null {
  if (!handle) return null;
  return handle.startsWith("@") ? handle : `@${handle}`;
}

function getPartyImage(party?: DisputeParty | null): string | null {
  return party?.profilePic || party?.logoUrl || null;
}

function isImageAttachment(attachment: Attachment): boolean {
  if (attachment.mimeType?.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(
    attachment.url.split("?")[0] ?? ""
  );
}

function getImageAttachments(attachments?: Attachment[]): Attachment[] {
  return (attachments ?? []).filter(isImageAttachment);
}

function getFileAttachments(attachments?: Attachment[]): Attachment[] {
  return (attachments ?? []).filter((a) => !isImageAttachment(a));
}

function getInitials(name?: string | null, role?: string): string {
  return (name || role || "?")
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getStatusPillClasses(status: DisputeStatus): string {
  switch (status) {
    case "resolved":
      return "bg-emerald-50 text-emerald-700";
    case "rejected":
      return "bg-red-50 text-red-600";
    case "revoked":
      return "bg-gray-100 text-gray-700";
    case "in_review":
      return "bg-blue-50 text-blue-700";
    case "awaiting_user":
      return "bg-amber-50 text-amber-700";
    case "evidence_submitted":
      return "bg-slate-100 text-slate-700";
    case "in_negotiation":
      return "bg-orange-50 text-orange-700";
    case "resolution_proposed":
      return "bg-cyan-50 text-cyan-700";
    default:
      return "bg-[#f0faf0] text-[#2d7a3a]";
  }
}

function getStatusDotClasses(status: DisputeStatus): string {
  switch (status) {
    case "resolved":
      return "bg-emerald-500";
    case "rejected":
      return "bg-red-500";
    case "revoked":
      return "bg-gray-500";
    case "in_review":
      return "bg-blue-500";
    case "awaiting_user":
      return "bg-amber-500";
    case "evidence_submitted":
      return "bg-slate-500";
    case "in_negotiation":
      return "bg-orange-500";
    case "resolution_proposed":
      return "bg-cyan-500";
    default:
      return "bg-[#2d7a3a]";
  }
}

function getDisputeNarrative(dispute: Dispute): string {
  if (dispute.viewerIsRaiser) {
    return `You raised this dispute against ${dispute.raisedAgainst?.name ?? "the influencer"
      }`;
  }
  return `${dispute.raisedBy?.name ?? "The influencer"
    } raised this dispute against you`;
}

function sameId(a?: string | null, b?: string | null): boolean {
  return String(a || "").trim() === String(b || "").trim();
}

function getPartyForAuthor(
  dispute: Dispute,
  authorRole?: string | null,
  authorId?: string | null
): DisputeParty | null {
  const parties = [dispute.raisedBy, dispute.raisedAgainst].filter(
    Boolean
  ) as DisputeParty[];

  const exactMatch = parties.find(
    (party) =>
      String(party.role) === String(authorRole) &&
      sameId(party.id, authorId)
  );

  if (exactMatch) return exactMatch;

  return (
    parties.find((party) => String(party.role) === String(authorRole)) || null
  );
}

function getViewerParty(
  dispute: Dispute,
  viewerRole: "Brand" | "Influencer",
  viewerId?: string | null
): DisputeParty | null {
  const parties = [dispute.raisedBy, dispute.raisedAgainst].filter(
    Boolean
  ) as DisputeParty[];

  if (viewerId) {
    const exactMatch = parties.find(
      (party) => party.role === viewerRole && sameId(party.id, viewerId)
    );

    if (exactMatch) return exactMatch;
  }

  return parties.find((party) => party.role === viewerRole) || null;
}

function getCommentAuthorLabel(comment: Comment, dispute: Dispute): string {
  if (comment.authorRole === "Admin") return "Collabglam";

  const ownerRole = dispute.raisedByRole ?? dispute.raisedBy?.role ?? null;
  const ownerId = dispute.raisedById ?? dispute.raisedBy?.id ?? null;

  if (
    dispute.viewerIsRaiser &&
    comment.authorRole === "Brand" &&
    String(comment.authorRole) === String(ownerRole ?? "") &&
    sameId(comment.authorId, ownerId)
  ) {
    return "You";
  }

  const party = getPartyForAuthor(dispute, comment.authorRole, comment.authorId);

  return party?.name || (comment.authorRole === "Influencer" ? "Creator" : "Brand");
}

/** Returns true when the logged-in brand user authored this comment. */
function canManageComment(comment: Comment, dispute: Dispute): boolean {
  if (!dispute.viewerIsRaiser) return false;
  const ownerRole = dispute.raisedByRole ?? dispute.raisedBy?.role ?? null;
  const ownerId = dispute.raisedById ?? dispute.raisedBy?.id ?? null;
  return (
    String(comment.authorRole) === String(ownerRole ?? "") &&
    String(comment.authorId) === String(ownerId ?? "")
  );
}

/* -------------------------------------------------------------------------- */
/*                               UI Primitives                                */
/* -------------------------------------------------------------------------- */

function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`rounded-lg bg-white ${className}`}>{children}</div>;
}

function IconButton({
  children,
  className = "",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      variant="outline"
      className={`h-8 w-8 rounded-lg border-none bg-transparent p-0 shadow-none hover:bg-[#f5f5f5] ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
}

function StatusPill({ status }: { status: DisputeStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium ${getStatusPillClasses(
        status
      )}`}
    >
      <span className={`size-1.5 rounded-lg ${getStatusDotClasses(status)}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-[#f7f7f5] p-6">
      <div className="mx-auto max-w-4xl animate-pulse space-y-4">
        <div className="h-8 w-48 rounded-lg bg-gray-200" />
        <div className="h-16 rounded-lg bg-gray-200" />
        <div className="h-32 rounded-lg bg-gray-200" />
        <div className="h-48 rounded-lg bg-gray-200" />
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onBack,
}: {
  message: string;
  onBack: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
      <div className="space-y-4 text-center">
        <p className="text-[#888]">{message}</p>
        <Button
          type="button"
          onClick={onBack}
          className="text-sm text-[#1a1a1a] underline"
        >
          Go back
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Feature Components                             */
/* -------------------------------------------------------------------------- */

function LightboxModal({
  images,
  index,
  onClose,
}: {
  images: Attachment[];
  index: number;
  onClose: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(index);
  const currentImage = images[activeIndex];

  const prev = useCallback(
    () => setActiveIndex((i) => (i - 1 + images.length) % images.length),
    [images.length]
  );
  const next = useCallback(
    () => setActiveIndex((i) => (i + 1) % images.length),
    [images.length]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  if (!currentImage) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between text-xs text-gray-300">
          <span className="max-w-xs truncate">
            {currentImage.originalName ?? "Image"}
          </span>
          <div className="flex items-center gap-3">
            <span>
              {activeIndex + 1} / {images.length}
            </span>
            <Button
              type="button"
              onClick={onClose}
              className="flex size-7 items-center justify-center rounded-lg bg-white/10 p-0 hover:bg-white/20"
            >
              <X className="size-4 text-white" />
            </Button>
          </div>
        </div>

        <div className="relative h-[80vh] min-h-[300px] overflow-hidden rounded-lg bg-black/30">
          {images.length > 1 && (
            <Button
              type="button"
              onClick={prev}
              className="absolute left-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg bg-black/50 p-0 hover:bg-black/70"
            >
              <ChevronLeft className="size-5 text-white" />
            </Button>
          )}

          <Image
            src={currentImage.url}
            alt={currentImage.originalName ?? "Preview image"}
            fill
            unoptimized
            sizes="100vw"
            className="object-contain"
          />

          {images.length > 1 && (
            <Button
              type="button"
              onClick={next}
              className="absolute right-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg bg-black/50 p-0 hover:bg-black/70"
            >
              <ChevronRight className="size-5 text-white" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function IssueTypeChipSummary({
  issueTypes,
  otherIssueDescription,
}: {
  issueTypes?: string[];
  otherIssueDescription?: string | null;
}) {
  const safeIssueTypes = Array.isArray(issueTypes) ? issueTypes.filter(Boolean) : [];

  if (!safeIssueTypes.length) {
    return <span className="text-sm font-medium leading-5 text-[#999]">—</span>;
  }

  const labels = safeIssueTypes.map(formatIssueTypeLabel);
  const [firstLabel, ...restLabels] = labels;
  const hasOther = safeIssueTypes.includes("other");
  const otherReason = String(otherIssueDescription || "").trim();

  const chipClass =
    "inline-flex max-w-[170px] items-center rounded-full border border-[#e8e8e8] bg-white px-2.5 py-1 text-[11px] font-medium leading-none text-[#444]";

  if (safeIssueTypes.length === 1 && hasOther) {
    return (
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        <span className="group relative inline-flex shrink-0">
          <button
            type="button"
            aria-label="View other issue reason"
            className={`${chipClass} cursor-default gap-1.5 pr-2 outline-none`}
          >
            <span className="truncate">Other</span>
            <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-[#d9d9d9] bg-[#fafafa] text-[9px] font-semibold leading-none text-[#777]">
              i
            </span>
          </button>

          <div className="pointer-events-none absolute left-0 top-full z-50 mt-2 hidden min-w-[260px] max-w-[320px] rounded-lg border border-[#e8e8e8] bg-white p-3 text-xs leading-5 text-[#333] shadow-[0_12px_32px_rgba(0,0,0,0.10)] group-hover:block group-focus-within:block">
            <div className="rounded-lg border border-[#eeeeee] bg-[#fafafa] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999]">
                Other Issue Reason
              </p>

              <p className="mt-1 whitespace-pre-wrap break-words text-[12px] leading-5 text-[#333] [overflow-wrap:anywhere]">
                {otherReason || "No other issue reason provided."}
              </p>
            </div>
          </div>
        </span>
      </div>
    );
  }

  const tooltip = (
    <div className="pointer-events-none absolute left-0 top-full z-50 mt-2 hidden min-w-[260px] max-w-[320px] rounded-lg border border-[#e8e8e8] bg-white p-3 text-xs leading-5 text-[#333] shadow-[0_12px_32px_rgba(0,0,0,0.10)] group-hover:block group-focus-within:block">
      {restLabels.length > 0 ? (
        <>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#999]">
            Other Issue Types
          </p>

          <div className="flex flex-wrap gap-1.5">
            {restLabels.map((label, index) => (
              <span key={`${label}-${index}`} className={chipClass}>
                {label}
              </span>
            ))}
          </div>
        </>
      ) : null}

      {hasOther ? (
        <div className={restLabels.length > 0 ? "mt-3 rounded-lg border border-[#eeeeee] bg-[#fafafa] px-3 py-2" : "rounded-lg border border-[#eeeeee] bg-[#fafafa] px-3 py-2"}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999]">
            Other Issue Reason
          </p>

          <p className="mt-1 whitespace-pre-wrap break-words text-[12px] leading-5 text-[#333] [overflow-wrap:anywhere]">
            {otherReason || "No other issue reason provided."}
          </p>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      <span className={chipClass}>
        <span className="truncate">{firstLabel}</span>
      </span>

      {restLabels.length > 0 ? (
        <span className="group relative inline-flex shrink-0">
          <button
            type="button"
            aria-label={`${restLabels.length} more issue types`}
            className="inline-flex cursor-default items-center rounded-full border border-[#1a1a1a] bg-[#1a1a1a] px-2.5 py-1 text-[11px] font-semibold leading-none text-white outline-none"
          >
            +{restLabels.length}
          </button>
          {tooltip}
        </span>
      ) : null}
    </div>
  );
}

function MetaGrid({ items }: { items: MetaItem[] }) {
  return (
    <div className="mt-5 pt-5">
      <div
        className={`grid gap-3 rounded-[12px] px-4 py-5 ${MUTED_BG} [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))]`}
      >
        {items.map((item) => {
          const isDisputeType =
            item.label === "Dispute Type" && Array.isArray(item.issueTypes);

          return (
            <div key={item.label} className="relative min-w-0">
              <div className="mb-1 flex min-w-0 items-center gap-1.5">
                <p className="min-w-0 truncate text-[11px] leading-4 text-[#999]">
                  {item.label}
                </p>
              </div>

              <div className="min-w-0">
                {isDisputeType ? (
                  <IssueTypeChipSummary
                    issueTypes={item.issueTypes}
                    otherIssueDescription={item.otherIssueDescription}
                  />
                ) : (
                  <>
                    <p className="truncate text-sm font-medium leading-5 text-[#1a1a1a]">
                      {item.value}
                    </p>

                    {item.sub ? (
                      <p className="mt-0.5 max-w-[220px] truncate text-xs leading-4 text-[#777]">
                        {item.sub}
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AttachmentGallery({
  imageAttachments,
  fileAttachments,
  onOpenLightbox,
}: {
  imageAttachments: Attachment[];
  fileAttachments: Attachment[];
  onOpenLightbox: (images: Attachment[], index: number) => void;
}) {
  if (imageAttachments.length === 0 && fileAttachments.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold text-[#1a1a1a]">
        Image / Reference
      </h2>

      {imageAttachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-3">
          {imageAttachments.map((attachment, index) => (
            <Button
              key={`${attachment.url}-${index}`}
              type="button"
              onClick={() => onOpenLightbox(imageAttachments, index)}
              className={`group relative !h-[11.4375rem] !w-[13.75rem] shrink-0 overflow-hidden rounded-[1.1875rem] ${SURFACE_BORDER} bg-[#f5f5f5] !p-0 transition-colors hover:border-[#ccc]`}
            >
              <Image
                src={attachment.url}
                alt={attachment.originalName ?? `Image ${index + 1}`}
                fill
                unoptimized
                sizes="220px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
            </Button>
          ))}
        </div>
      )}

      {fileAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {fileAttachments.map((attachment, index) => (
            <a
              key={`${attachment.url}-${index}`}
              href={attachment.url}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-2 rounded-lg ${SURFACE_BORDER} bg-[#fafafa] px-3 py-1.5 text-xs text-[#555] transition-colors hover:bg-[#f5f5f5]`}
            >
              <Paperclip className="size-3.5 shrink-0 text-[#aaa]" />
              <span className="max-w-[160px] truncate">
                {attachment.originalName ?? "File"}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function ProgressTracker({
  status,
  title,
}: {
  status: DisputeStatus;
  title: string;
}) {
  const activeStepIndex = STATUS_STEP_INDEX[status] ?? 0;

  const isFinalStatus =
    status === "resolved" || status === "rejected" || status === "revoked";

  const finalStepLabel =
    status === "rejected"
      ? "Rejected"
      : status === "revoked"
        ? "Revoked"
        : "Resolved";

  const displaySteps = STATUS_STEPS.map((step, index) =>
    index === STATUS_STEPS.length - 1
      ? { ...step, label: finalStepLabel }
      : step
  );

  return (
    <div className={`border-y ${SURFACE_BORDER_COLOR} bg-white py-5`}>
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#e8f5e9] p-1">
          <CheckIcon color="#2d7a3a" />
        </div>

        <p className="text-sm font-medium text-[#444]">{title}</p>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-4 gap-3">
          {displaySteps.map((step, index) => {
            const isDone = isFinalStatus || index < activeStepIndex;
            const isActive = !isFinalStatus && index === activeStepIndex;

            return (
              <div
                key={step.key}
                className="h-1.5 overflow-hidden rounded-full bg-[#e8e8e8]"
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isDone || isActive ? "bg-[#2fb344]" : "bg-transparent"
                    }`}
                  style={{
                    width: isDone ? "100%" : isActive ? "50%" : "0%",
                  }}
                />
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-4 gap-3">
          {displaySteps.map((step, index) => {
            const isDone = isFinalStatus || index < activeStepIndex;
            const isActive = !isFinalStatus && index === activeStepIndex;
            const isPending = !isDone && !isActive;

            return (
              <div
                key={step.key}
                className="flex items-center gap-1.5 text-[10px] leading-none"
              >
                {isDone ? (
                  <CheckCircle2
                    className="size-3.5 shrink-0 text-[#2fb344]"
                    strokeWidth={2.5}
                  />
                ) : (
                  <span
                    className={`inline-block size-3 rounded-full border ${isActive ? "border-[#1a1a1a]" : "border-[#bdbdbd]"
                      }`}
                  />
                )}

                <span
                  className={`whitespace-nowrap font-medium ${isPending ? "text-[#9b9b9b]" : "text-[#1a1a1a]"
                    }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FaqSection() {
  return (
    <div className="space-y-2">
      {FAQ_ITEMS.map((item, index) => (
        <React.Fragment key={item.value}>
          <div className="overflow-hidden rounded-lg bg-[#F9F9F9] px-5">
            <Accordion type="single" collapsible>
              <AccordionItem value={item.value} className="border-b-0">
                <AccordionTrigger className="py-4 text-sm font-medium text-[#1a1a1a] hover:no-underline">
                  {item.title}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-[#555]">
                  <p>{item.body}</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          {index < FAQ_ITEMS.length - 1 && (
            <div className="my-2 border-t border-[#e8e8e8]" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/** Three-dot menu shown on the initial "dispute raised" system log entry — always disabled. */
function DisabledLogActionsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open log actions"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#666] transition hover:bg-[#f0f0f0] hover:text-[#1a1a1a]"
        >
          <DotsThreeIcon size={18} weight="bold" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[204px] rounded-[24px] border border-[#EAEAEA] bg-white p-3 shadow-[0_20px_50px_rgba(0,0,0,0.16)]"
      >
        <DropdownMenuItem
          disabled
          className="flex h-14 items-center gap-3 rounded-[16px] px-4 text-[18px] font-medium text-[#1a1a1a] data-[disabled]:pointer-events-none data-[disabled]:opacity-40"
        >
          <PencilSimpleLineIcon size={24} className="text-[#444]" />
          <span>Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled
          className="mt-1 flex h-14 items-center gap-3 rounded-[16px] px-4 text-[18px] font-medium text-[#1a1a1a] data-[disabled]:pointer-events-none data-[disabled]:opacity-40"
        >
          <TrashIcon size={24} className="text-[#444]" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Three-dot menu shown on the Collabglam system log entry. */
function SystemLogActionsMenu({ onRaiseFlag }: { onRaiseFlag?: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open system log actions"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#666] transition hover:bg-[#f0f0f0] hover:text-[#1a1a1a]"
        >
          <DotsThreeIcon size={18} weight="bold" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[180px] rounded-[20px] border border-[#EAEAEA] bg-white p-2 shadow-[0_20px_50px_rgba(0,0,0,0.16)]"
      >
        <DropdownMenuItem
          onClick={onRaiseFlag}
          className="flex h-11 cursor-pointer items-center gap-2 rounded-[14px] px-3 text-sm font-medium text-[#1a1a1a] outline-none focus:bg-[#f6f6f6]"
        >
          <FlagIcon color="#1A1A1A" />
          <span>Raise flag</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


function getCommentProfileImage({
  comment,
  dispute,
  currentUserImageUrl,
}: {
  comment: Comment;
  dispute: Dispute;
  currentUserImageUrl?: string | null;
}) {
  if (comment.authorRole === "Brand" && currentUserImageUrl) {
    return currentUserImageUrl;
  }

  if (
    dispute.raisedBy &&
    String(comment.authorRole) === String(dispute.raisedBy.role) &&
    String(comment.authorId) === String(dispute.raisedBy.id)
  ) {
    return getPartyImage(dispute.raisedBy);
  }

  if (
    dispute.raisedAgainst &&
    String(comment.authorRole) === String(dispute.raisedAgainst.role) &&
    String(comment.authorId) === String(dispute.raisedAgainst.id)
  ) {
    return getPartyImage(dispute.raisedAgainst);
  }

  return null;
}

function ProfileAvatar({
  name,
  role,
  imageUrl,
  size = "sm",
}: {
  name?: string | null;
  role?: AuthorRole | string;
  imageUrl?: string | null;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "md" ? "size-10" : "size-8";
  const fallbackTextClass = size === "md" ? "text-sm" : "text-xs";
  const colorClass =
    role && role in ROLE_AVATAR_STYLES
      ? ROLE_AVATAR_STYLES[role as AuthorRole]
      : "bg-gray-100 text-gray-600";

  if (imageUrl) {
    return (
      <div
        className={`${sizeClass} relative shrink-0 overflow-hidden rounded-full border border-[#f0f0f0] bg-white`}
      >
        <Image
          src={imageUrl}
          alt={name ?? "Profile"}
          fill
          unoptimized
          sizes={size === "md" ? "40px" : "32px"}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} ${colorClass} ${fallbackTextClass} flex shrink-0 items-center justify-center rounded-full font-semibold`}
    >
      {getInitials(name, role)}
    </div>
  );
}

function ActivityFeed({
  dispute,
  rootComments,
  repliesByParent,
  activeReplyCommentId,
  isFinalized,
  onStartReply,
  onOpenLightbox,
  brandLogoUrl,
  brandProfilePic,
  onEditComment,
  onDeleteComment,
  onRaiseSystemFlag,
}: {
  dispute: Dispute;
  rootComments: Comment[];
  repliesByParent: Record<string, Comment[]>;
  activeReplyCommentId: string | null;
  isFinalized: boolean;
  onStartReply: (comment: Comment) => void;
  onOpenLightbox: (images: Attachment[], index: number) => void;
  brandLogoUrl?: string | null;
  brandProfilePic?: string | null;
  onEditComment?: (comment: Comment) => void;
  onDeleteComment?: (comment: Comment) => void;
  onRaiseSystemFlag?: () => void;
}) {
  const raisedNarrative = getDisputeNarrative(dispute);

  return (
    <SectionCard className={`${SURFACE_BORDER} p-5`}>
      <div className="mb-4 flex items-center gap-2">
        <ChatTeardropTextIcon className="size-5 text-[#1a1a1a]" />
        <h2 className="text-sm font-semibold leading-5 text-[#1a1a1a]">
          We&apos;re verifying the dispute, thanks for your Patience
        </h2>
      </div>

      <div className="space-y-4">
        {/* Initial "dispute raised" entry */}
        <div className="rounded-lg bg-[#fafafa] px-4 py-3">
          <div className="flex items-start gap-3">
            <ProfileAvatar
              name={dispute.viewerIsRaiser ? "You" : dispute.raisedBy?.name}
              role={dispute.raisedBy?.role}
              imageUrl={
                dispute.viewerIsRaiser
                  ? brandProfilePic || getPartyImage(dispute.raisedBy)
                  : getPartyImage(dispute.raisedBy)
              }
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-medium text-[#1a1a1a]">
                    {dispute.viewerIsRaiser
                      ? "You"
                      : (dispute.raisedBy?.name ?? dispute.raisedBy?.role)}
                  </span>
                  <span className="text-xs text-[#999]">
                    {formatTimeAgo(dispute.createdAt)}
                  </span>
                </div>
                <DisabledLogActionsMenu />
              </div>

              <p className="mt-2 text-sm leading-6 text-[#666]">
                {raisedNarrative}
                {dispute.raisedAgainst?.handle && (
                  <span className="font-medium text-[#1a1a1a]">
                    {" "}
                    {formatHandle(dispute.raisedAgainst.handle)}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* User comments */}
        {rootComments.map((comment) => {
          const commentImages = getImageAttachments(comment.attachments);
          const commentName = getCommentAuthorLabel(comment, dispute);
          const showActions = canManageComment(comment, dispute);

          return (
            <div
              key={comment.commentId}
              className="rounded-lg bg-[#fafafa] px-4 py-3"
            >
              <div className="flex items-start gap-3">
                <ProfileAvatar
                  name={commentName}
                  role={comment.authorRole}
                  imageUrl={getCommentProfileImage({
                    comment,
                    dispute,
                    currentUserImageUrl: brandProfilePic,
                  })}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-medium text-[#1a1a1a]">
                        {commentName}
                      </span>
                      <span className="text-xs text-[#999]">
                        {formatTimeAgo(comment.createdAt)}
                      </span>
                    </div>

                    {showActions && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label="Open comment actions"
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#666] transition hover:bg-[#f0f0f0] hover:text-[#1a1a1a]"
                          >
                            <DotsThreeIcon size={18} weight="bold" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          sideOffset={8}
                          className="w-[204px] rounded-[24px] border border-[#EAEAEA] bg-white p-3 shadow-[0_20px_50px_rgba(0,0,0,0.16)]"
                        >
                          <DropdownMenuItem
                            onClick={() => onEditComment?.(comment)}
                            className="flex h-14 cursor-pointer items-center gap-3 rounded-[16px] px-4 text-[18px] font-medium text-[#1a1a1a] outline-none focus:bg-[#f6f6f6]"
                          >
                            <PencilSimpleLineIcon
                              size={24}
                              className="text-[#444]"
                            />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDeleteComment?.(comment)}
                            className="mt-1 flex h-14 cursor-pointer items-center gap-3 rounded-[16px] px-4 text-[18px] font-medium text-[#1a1a1a] outline-none focus:bg-[#f6f6f6]"
                          >
                            <TrashIcon size={24} className="text-[#444]" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#666]">
                    {comment.text}
                  </p>

                  {commentImages.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {commentImages.map((attachment, index) => (
                        <Button
                          key={`${attachment.url}-${index}`}
                          type="button"
                          onClick={() => onOpenLightbox(commentImages, index)}
                          className={`relative h-14 w-20 overflow-hidden rounded-xl ${SURFACE_BORDER} bg-[#f5f5f5] !p-0`}
                        >
                          <Image
                            src={attachment.url}
                            alt={
                              attachment.originalName ?? "Comment attachment"
                            }
                            fill
                            unoptimized
                            sizes="80px"
                            className="object-cover"
                          />
                        </Button>
                      ))}
                    </div>
                  )}

                  {comment.authorRole !== "Brand" && !isFinalized && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => onStartReply(comment)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e8e8] bg-white px-3 py-1.5 text-xs font-medium text-[#444] transition hover:bg-[#f7f7f7]"
                      >
                        <ArrowUUpLeftIcon size={14} />
                        {activeReplyCommentId === comment.commentId ? "Replying" : "Reply"}
                      </button>
                    </div>
                  )}

                  {(repliesByParent[comment.commentId] ?? []).length > 0 && (
                    <div className="mt-4 ml-4 rounded-xl border border-[#eeeeee] bg-white p-3">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#999]">
                        Thread
                      </p>

                      <div className="space-y-3">
                        {(repliesByParent[comment.commentId] ?? []).map((reply) => {
                          const replyImages = getImageAttachments(reply.attachments);
                          const replyName = getCommentAuthorLabel(reply, dispute);

                          return (
                            <div
                              key={reply.commentId}
                              className="rounded-lg border border-[#f0f0f0] bg-[#fafafa] px-4 py-3"
                            >
                              <div className="flex items-start gap-3">
                                <ProfileAvatar
                                  name={replyName}
                                  role={reply.authorRole}
                                  imageUrl={getCommentProfileImage({
                                    comment: reply,
                                    dispute,
                                    currentUserImageUrl: brandProfilePic,
                                  })}
                                  size="sm"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex min-w-0 items-center gap-2">
                                    <span className="truncate text-sm font-medium text-[#1a1a1a]">
                                      {replyName}
                                    </span>
                                    <span className="text-xs text-[#999]">
                                      {formatTimeAgo(reply.createdAt)}
                                    </span>
                                  </div>

                                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#666]">
                                    {reply.text}
                                  </p>

                                  {replyImages.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {replyImages.map((attachment, index) => (
                                        <Button
                                          key={`${attachment.url}-${index}`}
                                          type="button"
                                          onClick={() => onOpenLightbox(replyImages, index)}
                                          className={`relative h-14 w-20 overflow-hidden rounded-xl ${SURFACE_BORDER} bg-[#f5f5f5] !p-0`}
                                        >
                                          <Image
                                            src={attachment.url}
                                            alt={attachment.originalName ?? "Reply attachment"}
                                            fill
                                            unoptimized
                                            sizes="80px"
                                            className="object-cover"
                                          />
                                        </Button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Collabglam system log entry */}
        <div className="rounded-lg bg-[#fafafa] px-4 py-3">
          <div className="flex items-start gap-3">
            <ProfileAvatar name="Collabglam" imageUrl={brandLogoUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-sm font-medium text-[#1a1a1a]">
                    Collabglam
                  </span>
                  <span className="text-xs text-[#999]">
                    {formatTimeAgo(dispute.createdAt)}
                  </span>
                </div>
                <SystemLogActionsMenu onRaiseFlag={onRaiseSystemFlag} />
              </div>
              <p className="mt-2 text-sm leading-6 text-[#666]">
                Raised a dispute
              </p>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

/**
 * Comment composer — manages its own file-input ref internally so the
 * parent page doesn't need to hold an imperativeref to a DOM node it never
 * directly touches.
 */
function CommentComposer({
  currentUserName,
  currentUserImageUrl,
  isFinalized,
  comment,
  setComment,
  commentFiles,
  setCommentFiles,
  posting,
  postError,
  onSubmit,
}: {
  currentUserName?: string | null;
  currentUserImageUrl?: string | null;
  isFinalized: boolean;
  comment: string;
  setComment: React.Dispatch<React.SetStateAction<string>>;
  commentFiles: File[];
  setCommentFiles: React.Dispatch<React.SetStateAction<File[]>>;
  posting: boolean;
  postError: string | null;
  onSubmit: () => Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canSubmit = comment.trim().length > 0 || commentFiles.length > 0;

  const handleReset = () => {
    setComment("");
    setCommentFiles([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length === 0) return;
    setCommentFiles((prev) => [...prev, ...picked]);
    // Reset the input so the same file can be re-selected if removed.
    e.target.value = "";
  };

  return (
    <SectionCard
      className={`${SURFACE_BORDER} flex flex-col rounded-[20px] p-5`}
    >
      <div className="mb-4 flex items-center gap-2">
        <ProfileAvatar
          name={currentUserName ?? "Brand"}
          role="Brand"
          imageUrl={currentUserImageUrl}
          size="md"
        />
        <div>
          <p className="text-[14px] font-medium text-[#1a1a1a]">
            {currentUserName ?? "Brand"}
          </p>
          <p className="text-[10px] text-[#999]">Now</p>
        </div>
        <IconButton className="ml-auto text-[#888]">
          <DotsThreeIcon className="size-4" weight="bold" />
        </IconButton>
      </div>

      {isFinalized ? (
        <div className="flex flex-1 items-center justify-center py-6 text-xs text-[#bbb]">
          This dispute is finalized and cannot receive further comments.
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-3">
          <textarea
            rows={8}
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className={`w-full flex-1 resize-none rounded-[16px] ${SURFACE_BORDER} bg-[#fafafa] px-4 py-3 text-sm text-[#1a1a1a] outline-none transition-all placeholder:text-[#ccc] focus:border-[#1a1a1a] focus:bg-white focus:ring-1 focus:ring-[#1a1a1a]/10`}
          />

          {commentFiles.length > 0 && (
            <ul className="space-y-1">
              {commentFiles.map((file, index) => (
                <li
                  key={`${file.name}-${file.size}-${index}`}
                  className={`flex items-center justify-between rounded-lg ${SURFACE_BORDER} px-3 py-1.5 text-[11px] text-[#555]`}
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Paperclip className="size-3 shrink-0 text-[#aaa]" />
                    <span className="truncate">{file.name}</span>
                  </div>
                  <IconButton
                    onClick={() =>
                      setCommentFiles((prev) =>
                        prev.filter((_, i) => i !== index)
                      )
                    }
                    className="ml-2 text-red-500 hover:bg-red-50"
                  >
                    <X className="size-3" />
                  </IconButton>
                </li>
              ))}
            </ul>
          )}

          {postError && (
            <p className="text-xs text-red-500">{postError}</p>
          )}

          <div className="flex items-center justify-end gap-2">
            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            {/* <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={posting}
              className="inline-flex items-center gap-1.5 rounded-[12px] px-4 py-2 text-sm text-[#1a1a1a] transition-colors hover:bg-[#f5f5f5] disabled:opacity-40"
            >
              <Paperclip className="size-3.5" />
              Attach
            </Button> */}

            <Button
              type="button"
              onClick={handleReset}
              disabled={posting || !canSubmit}
              className="rounded-[12px] px-4 py-2 text-sm !text-[#1a1a1a] transition-colors !bg-white hover:!bg-white !shadow-none disabled:opacity-40"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={() => void onSubmit()}
              disabled={posting || !canSubmit}
              className="inline-flex items-center gap-1.5 rounded-[12px] bg-[#1a1a1a] px-5 py-2  text-sm font-medium text-white transition-colors hover:bg-[#333] disabled:opacity-40"
            >
              {posting ? (
                <span className="text-xs">Posting…</span>
              ) : (
                <>
                  <Send className="size-3.5 mr-2" />
                  Submit
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

/* -------------------------------------------------------------------------- */
/*                           Edit-Dispute Dialog                              */
/* -------------------------------------------------------------------------- */

interface EditableDisputeSeed {
  disputeId: string;
  campaignId?: string | null;
  influencerId: string;
  influencerName?: string | null;
  subject: string;
  description?: string | null;
  issueType?: string[];
  otherIssueDescription?: string | null;
  /** Server-persisted attachments to display inside the edit dialog. */
  existingAttachments?: ExistingAttachment[];
}

function EditDisputeDialog({
  open,
  onOpenChange,
  onSuccess,
  dispute,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void;
  dispute: EditableDisputeSeed;
}) {
  return (
    <DisputeFormDialog
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      title="Edit Dispute"
      submitLabel="Save Changes"
      disputeId={dispute.disputeId}
      lockedCampaignId={dispute.campaignId ?? undefined}
      disableInfluencer
      initialValues={{
        campaignId: dispute.campaignId ?? "",
        influencerId: dispute.influencerId,
        subject: dispute.subject,
        description: dispute.description ?? "",
        issueType: dispute.issueType?.length ? dispute.issueType : ["other"],
        otherIssueDescription: dispute.otherIssueDescription ?? "",
      }}
      influencerDisplayName={dispute.influencerName ?? undefined}
      existingAttachments={dispute.existingAttachments}
      onSubmit={async ({ brandId, values, removedExistingUrls }) => {
        if (!brandId) {
          throw new Error("Missing brand ID — please log in again.");
        }

        await apiEditDispute({
          disputeId: dispute.disputeId,
          brandId,
          subject: values.subject,
          description: values.description,
          issueType: values.issueType,
          otherIssueDescription: values.otherIssueDescription,
          attachments: values.attachments,
          removedAttachmentUrls: removedExistingUrls,
        });
      }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default function BrandDisputeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const disputeId = params?.id ?? "";

  // ── Auth ────────────────────────────────────────────────────────────────
  const [brandId, setBrandId] = useState<string | null>(null);
  const [authResolved, setAuthResolved] = useState(false);

  // ── Data ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [brandLite, setBrandLite] = useState<BrandLiteResponse | null>(null);

  // ── Comment composer ────────────────────────────────────────────────────
  const [comment, setComment] = useState("");
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(null);
  // ── Revoke modal ────────────────────────────────────────────────────────
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  // ── Lightbox ─────────────────────────────────────────────────────────────
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  // ── Edit dialog ──────────────────────────────────────────────────────────
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // ── Resolve brandId from localStorage ───────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("brandId");
    if (!stored) {
      setError("Not logged in as brand.");
      setLoading(false);
    } else {
      setBrandId(stored);
    }
    setAuthResolved(true);
  }, []);

  // ── Fetch brand lite profile ─────────────────────────────────────────────
  useEffect(() => {
    if (!brandId) return;
    let cancelled = false;

    apiGetBrandLite(brandId)
      .then((data) => {
        if (!cancelled) setBrandLite(data ?? null);
      })
      .catch(() => {
        if (!cancelled) setBrandLite(null);
      });

    return () => {
      cancelled = true;
    };
  }, [brandId]);

  // ── Load dispute ─────────────────────────────────────────────────────────
  const loadDispute = useCallback(async () => {
    if (!disputeId || !brandId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await get<DisputeResponse>(
        `/dispute/brand/${disputeId}`,
        { brandId }
      );
      setDispute(response.dispute);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load dispute."));
    } finally {
      setLoading(false);
    }
  }, [brandId, disputeId]);

  useEffect(() => {
    if (!authResolved || !brandId) return;
    void loadDispute();
  }, [authResolved, brandId, loadDispute]);

  // ── Lightbox helpers ─────────────────────────────────────────────────────
  const handleOpenLightbox = useCallback(
    (images: Attachment[], index: number) => setLightbox({ images, index }),
    []
  );
  const handleCloseLightbox = useCallback(() => setLightbox(null), []);

  // ── Revoke handlers ──────────────────────────────────────────────────────
  const handleRevokeDispute = useCallback(() => {
    setRevokeError(null);
    setIsRevokeModalOpen(true);
  }, []);

  const handleCloseRevokeModal = useCallback(() => {
    if (isRevoking) return;
    setIsRevokeModalOpen(false);
    setRevokeError(null);
  }, [isRevoking]);

  const handleConfirmRevoke = useCallback(async () => {
    if (!brandId || !disputeId || isRevoking) return;

    setIsRevoking(true);
    setRevokeError(null);

    try {
      await apiRevokeDispute({ disputeId, brandId });
      setIsRevokeModalOpen(false);
      void Swal.fire({
        icon: "success",
        title: "Dispute Withdrawn",
        text: "This dispute has been successfully withdrawn and marked as closed.",
        confirmButtonText: "OK",
        customClass: {
          popup: "swal2-border-radius",
          confirmButton: "swal2-confirm-button",
        },
      });
    } catch (err) {
      setRevokeError(getErrorMessage(err, "Failed to revoke dispute."));
    } finally {
      setIsRevoking(false);
    }
  }, [brandId, disputeId, isRevoking]);

  // ── Comment handlers ─────────────────────────────────────────────────────
  const handlePostComment = useCallback(async () => {
    if (!disputeId || !brandId) return;

    const trimmed = comment.trim();
    if (trimmed.length === 0 && commentFiles.length === 0) return;

    setPosting(true);
    setPostError(null);

    try {
      const formData = new FormData();
      formData.append("brandId", brandId);
      formData.append("text", trimmed || " ");

      if (activeReplyCommentId) {
        formData.append("parentCommentId", activeReplyCommentId);
      }

      commentFiles.forEach((file) => formData.append("attachments", file));

      await postFormData(`/dispute/brand/${disputeId}/comment`, formData);

      setComment("");
      setCommentFiles([]);
      setActiveReplyCommentId(null);
      await loadDispute();
    } catch (err) {
      setPostError(getErrorMessage(err, "Failed to post comment."));
    } finally {
      setPosting(false);
    }
  }, [brandId, comment, commentFiles, disputeId, loadDispute, activeReplyCommentId]);
  const handleEditComment = useCallback(
    async (target: Comment) => {
      if (!brandId) return;

      const result = await Swal.fire({
        title: "Edit comment",
        input: "textarea",
        inputValue: target.text,
        inputPlaceholder: "Update your comment",
        showCancelButton: true,
        confirmButtonText: "Save",
        cancelButtonText: "Cancel",
        customClass: {
          popup: "swal2-border-radius",
          confirmButton: "swal2-confirm-button",
        },
        inputValidator: (value) =>
          !String(value ?? "").trim() ? "Comment text is required" : null,
      });

      if (!result.isConfirmed) return;

      const nextText = String(result.value ?? "").trim();
      if (!nextText) return;

      try {
        const formData = new FormData();
        formData.append("brandId", brandId);
        formData.append("text", nextText);

        await api.patch(
          `/dispute/brand/comment/${target.commentId}`,
          formData
        );

        toast({ icon: "success", title: "Comment updated", text: "" });
        await loadDispute();
      } catch (err) {
        toast({
          icon: "error",
          title: "Failed to update comment",
          text: getErrorMessage(err, "Failed to update comment."),
        });
      }
    },
    [brandId, loadDispute]
  );

  const handleDeleteComment = useCallback(
    async (target: Comment) => {
      if (!brandId) return;

      const result = await Swal.fire({
        icon: "warning",
        title: "Delete comment?",
        text: "This action cannot be undone.",
        showCancelButton: true,
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
        customClass: {
          popup: "swal2-border-radius",
          confirmButton: "swal2-confirm-button",
        },
      });

      if (!result.isConfirmed) return;

      try {
        await api.delete(`/dispute/brand/comment/${target.commentId}`, {
          data: { brandId },
        });

        toast({ icon: "success", title: "Comment deleted", text: "" });
        await loadDispute();
      } catch (err) {
        toast({
          icon: "error",
          title: "Failed to delete comment",
          text: getErrorMessage(err, "Failed to delete comment."),
        });
      }
    },
    [brandId, loadDispute]
  );

  const handleRaiseSystemFlag = useCallback(() => {
    toast({
      icon: "success",
      title: "Flag raised",
      text: "The system log has been flagged for review.",
    });
  }, []);

  const visibleComments = useMemo(
    () => dispute?.comments ?? [],
    [dispute?.comments]
  );

  const rootComments = useMemo(
    () => visibleComments.filter((comment) => !comment.parentCommentId),
    [visibleComments]
  );

  const repliesByParent = useMemo(
    () =>
      visibleComments.reduce<Record<string, Comment[]>>((acc, currentComment) => {
        if (currentComment.parentCommentId) {
          if (!acc[currentComment.parentCommentId]) {
            acc[currentComment.parentCommentId] = [];
          }
          acc[currentComment.parentCommentId].push(currentComment);
        }
        return acc;
      }, {}),
    [visibleComments]
  );

  // ── Derived state ────────────────────────────────────────────────────────
  const derived = useMemo(() => {
    if (!dispute) {
      return {
        daysOpen: 0,
        daysLeftLabel: "",
        isFinalized: false,
        imageAttachments: [] as Attachment[],
        fileAttachments: [] as Attachment[],
        metaItems: [] as MetaItem[],
      };
    }
    const daysOpen = daysSince(dispute.createdAt);
    const imageAttachments = getImageAttachments(dispute.attachments);
    const fileAttachments = getFileAttachments(dispute.attachments);
    const issueTypeMeta = getIssueTypeMeta(dispute);

    const metaItems: MetaItem[] = [
      {
        label: "Dispute By",
        value: dispute.viewerIsRaiser
          ? "You"
          : (dispute.raisedBy?.name ?? "—"),
      },
      {
        label: "Dispute Against",
        value: dispute.raisedAgainst?.name ?? "—",
        ...(formatHandle(dispute.raisedAgainst?.handle) != null && {
          sub: formatHandle(dispute.raisedAgainst?.handle) as string,
        }),
      },
      {
        label: "Dispute Type",
        value: issueTypeMeta.value,
        sub: issueTypeMeta.sub,
        tooltip: issueTypeMeta.tooltip,
        issueTypes: issueTypeMeta.issueTypes,
        otherIssueDescription: issueTypeMeta.otherIssueDescription,
      },
      {
        label: "Dispute ID",
        value: dispute.disputeId,
      },
      {
        label: "Dispute age",
        value: formatDaysLeft(daysOpen),
      },
    ];

    const isFinalized =
      dispute.status === "resolved" ||
      dispute.status === "rejected" ||
      dispute.status === "revoked";

    return {
      daysOpen,
      daysLeftLabel: formatDaysLeft(daysOpen),
      isFinalized,
      imageAttachments,
      fileAttachments,
      metaItems,
    };
  }, [dispute]);

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) return <LoadingState />;

  if (error || !dispute) {
    return (
      <ErrorState
        message={error ?? "Dispute not found."}
        onBack={() => router.back()}
      />
    );
  }

  const currentBrandProfilePic =
    brandLite?.profilePic ||
    (dispute.raisedBy?.role === "Brand" &&
    String(dispute.raisedBy.id) === String(brandId)
      ? getPartyImage(dispute.raisedBy)
      : null) ||
    (dispute.raisedAgainst?.role === "Brand" &&
    String(dispute.raisedAgainst.id) === String(brandId)
      ? getPartyImage(dispute.raisedAgainst)
      : null);

  return (
    <>
      <div
        className="min-h-screen"
        style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');`}</style>

        <div className={`space-y-4 ${PAGE_GUTTER}`}>
          {/* Header card */}
          <SectionCard className="py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-xl font-semibold leading-tight text-[#1a1a1a]">
                  {dispute.subject}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[#999]">
                    ID: {dispute.disputeId}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-[#666]">
                  <Clock className="size-3.5" />
                  <span>{derived.daysLeftLabel}</span>
                </div>

                <StatusPill status={dispute.status} />

                {!derived.isFinalized && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(true)}
                      className="!h-[2.25rem] !max-w-[3.9375rem] !rounded-[0.5rem] !border !border-[#E6E6E6]"
                    >
                      <span className="flex items-center gap-2">
                        <NotePencilIcon className="size-4" />
                        Edit
                      </span>
                    </Button>

                    <Button
                      type="button"
                      onClick={handleRevokeDispute}
                      variant="outline"
                      className="inline-flex !h-[2.25rem] !max-w-[9.875rem] items-center gap-1.5 !rounded-[0.5rem] !border !border-[#E35141] px-3 py-1.5 text-xs font-medium !text-[#E35141] transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <ArrowUUpLeftIcon className="size-4" />
                        Withdraw Dispute
                      </span>
                    </Button>
                  </>
                )}
              </div>
            </div>

            <MetaGrid items={derived.metaItems} />
          </SectionCard>

          {/* Summary card */}
          <SectionCard className={`${SURFACE_BORDER} min-w-0 overflow-hidden px-6 py-5`}>
            <div
              className={`mb-3 flex min-w-0 items-center gap-1 border-b ${SUBTLE_BORDER} pb-3`}
            >
              <NoteIcon className="size-4 shrink-0" />
              <h2 className="min-w-0 truncate text-sm font-semibold text-[#1a1a1a]">
                Dispute Summary
              </h2>
            </div>

            <p
              title={dispute.description || "No description provided."}
              className="min-w-0 max-w-full whitespace-pre-wrap break-words text-sm leading-relaxed text-[#555] [overflow-wrap:anywhere]"
            >
              {dispute.description || "No description provided."}
            </p>
            {dispute.campaignName && (
              <p className="mt-3 min-w-0 text-xs text-[#888]">
                Campaign:{" "}
                <span
                  title={dispute.campaignName}
                  className="font-medium text-[#555] break-words [overflow-wrap:anywhere]"
                >
                  {dispute.campaignName}
                </span>
              </p>
            )}
          </SectionCard>

          <AttachmentGallery
            imageAttachments={derived.imageAttachments}
            fileAttachments={derived.fileAttachments}
            onOpenLightbox={handleOpenLightbox}
          />

          <ProgressTracker
            status={dispute.status}
            title="We're verifying the dispute, thanks for your Patience"
          />

          <FaqSection />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ActivityFeed
              dispute={dispute}
              rootComments={rootComments}
              repliesByParent={repliesByParent}
              activeReplyCommentId={activeReplyCommentId}
              isFinalized={derived.isFinalized}
              onStartReply={(comment) => {
                setActiveReplyCommentId(comment.commentId);
                setComment((prev) =>
                  prev.trim() ? prev : `@${getCommentAuthorLabel(comment, dispute)} `
                );
              }}
              onOpenLightbox={handleOpenLightbox}
              brandLogoUrl="/logo.png"
              brandProfilePic={currentBrandProfilePic}
              onEditComment={handleEditComment}
              onDeleteComment={handleDeleteComment}
              onRaiseSystemFlag={handleRaiseSystemFlag}
            />

            <div className="space-y-3">
              {activeReplyCommentId && (
                <div className="rounded-xl border border-[#e8e8e8] bg-white px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-[#555]">
                      Replying inside a thread. Your reply will be grouped under the selected comment.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveReplyCommentId(null);
                        setComment("");
                        setCommentFiles([]);
                      }}
                      className="text-xs font-medium text-[#888] hover:text-[#1a1a1a]"
                    >
                      Cancel reply
                    </button>
                  </div>
                </div>
              )}

              <CommentComposer
                currentUserName={brandLite?.name ?? getViewerParty(dispute, "Brand")?.name ?? "Brand"}
                currentUserImageUrl={currentBrandProfilePic}
                isFinalized={derived.isFinalized}
                comment={comment}
                setComment={setComment}
                commentFiles={commentFiles}
                setCommentFiles={setCommentFiles}
                posting={posting}
                postError={postError}
                onSubmit={handlePostComment}
              />
            </div>
          </div>
        </div>
      </div>

      <EditDisputeDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={() => void loadDispute()}
        dispute={{
          disputeId: dispute.disputeId,
          campaignId: dispute.campaignId,
          influencerId: dispute.influencerId,
          influencerName: dispute.raisedAgainst?.name ?? null,
          subject: dispute.subject,
          description: dispute.description,
          issueType: dispute.issueType,
          otherIssueDescription: dispute.otherIssueDescription ?? "",
          existingAttachments: dispute.attachments ?? [],
        }}
      />

      <ConfirmActionModal
        open={isRevokeModalOpen}
        onClose={handleCloseRevokeModal}
        onConfirm={handleConfirmRevoke}
        isSubmitting={isRevoking}
        error={revokeError}
        title="Withdraw Dispute"
        description={
          <>
            You are about to{" "}
            <span className="font-semibold text-[#1a1a1a]">
              withdraw this dispute
            </span>{" "}
            request. Once withdrawn, the dispute will be closed and cannot be
            reopened.
          </>
        }
        confirmLabel="Withdraw"
        confirmLoadingLabel="Withdrawing..."
        cancelLabel="Cancel"
      />

      {lightbox && (
        <LightboxModal
          images={lightbox.images}
          index={lightbox.index}
          onClose={handleCloseLightbox}
        />
      )}
    </>
  );
}