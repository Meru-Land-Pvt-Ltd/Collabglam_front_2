"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Eye,
  Globe2,
  MessageSquareText,
  RefreshCw,
  Search,
  Star,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { get } from "@/lib/api";
import AdminTable, { type AdminTableColumn } from "../../components/table";

type ReviewType =
  | "brand_to_influencer"
  | "influencer_to_brand"
  | "brand_to_platform"
  | "influencer_to_platform";

type ReviewStatus = "pending" | "submitted" | "skipped" | "expired" | "revoked";
type ReviewRole = "brand" | "influencer" | "platform" | "admin";
type RatingScope = "all" | "normal" | "platform";
type RatingDirectionFilter =
  | "all"
  | "campaign"
  | "platform"
  | "brand_to_influencer"
  | "influencer_to_brand"
  | "brand_feedback"
  | "influencer_feedback";
type RatingScoreFilter = "all" | "5" | "4_plus" | "3_plus" | "below_3";

type MiniEntity = {
  _id?: string;
  key?: string;
  name?: string;
  title?: string;
  campaignTitle?: string;
  productOrServiceName?: string;
  brandName?: string;
  companyName?: string;
  influencerName?: string;
  fullName?: string;
  username?: string;
  handle?: string;
  email?: string;
  image?: string;
  avatar?: string;
  profilePic?: string;
  profileImage?: string;
  profilePicture?: string;
  logo?: string;
  brandLogo?: string;
  picture?: string;
};

type ReviewMetrics = {
  workQuality?: number;
  communication?: number;
  timeliness?: number;
  professionalism?: number;
  valueForMoney?: number;
  platformExperience?: number;
  supportExperience?: number;
  wouldRecommend?: number;
};

type ReviewAnswer = {
  questionKey?: string;
  questionLabel?: string;
  answerType?: string;
  value?: unknown;
  displayValue?: unknown;
  score?: number | null;
};

type ReviewSnapshot = {
  role?: ReviewRole;
  entityId?: string;
  name?: string;
  email?: string;
  handle?: string;
  image?: string;
};

type AdminReview = {
  _id: string;
  reviewRequestId?: string;
  reviewType: ReviewType;
  reviewerRole?: ReviewRole;
  revieweeRole?: ReviewRole;
  status: ReviewStatus;
  submittedVia?: string;
  sourceEntityType?: string;
  sourceEntityId?: string;
  rating?: number | null;
  noteStarRating?: number | null;
  reviewTitle?: string;
  reviewText?: string;
  privateFeedback?: string;
  tags?: string[];
  metrics?: ReviewMetrics;
  ratings?: ReviewMetrics;
  responses?: ReviewAnswer[];
  responseMap?: Record<string, ReviewAnswer>;
  firstSubmittedAt?: string;
  submittedAt?: string;
  reviewUpdatedAt?: string;
  reviewUpdateCount?: number;
  skippedAt?: string;
  skippedVia?: string;
  skipReason?: string;
  tokenExpiresAt?: string;
  publicUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  campaign?: MiniEntity | null;
  brand?: MiniEntity | null;
  influencer?: MiniEntity | null;
  platform?: MiniEntity | null;
  reviewer?: ReviewSnapshot | null;
  reviewee?: ReviewSnapshot | null;
  campaignId?: MiniEntity | string | null;
  brandId?: MiniEntity | string | null;
  influencerId?: MiniEntity | string | null;
};

type AdminListResponse = {
  success?: boolean;
  data?: AdminReview[];
  total?: number;
  page?: number;
  limit?: number;
  message?: string;
};

type ToastState = { message: string; type: "success" | "error" };
type SubmittedAnswer = { question: string; answer: string; score?: number | null };

const FETCH_LIMIT = 1000;

const REVIEW_TYPE_LABEL: Record<ReviewType, string> = {
  brand_to_influencer: "Brand → Influencer",
  influencer_to_brand: "Influencer → Brand",
  brand_to_platform: "Platform Feedback from Brand",
  influencer_to_platform: "Platform Feedback from Influencer",
};

const METRIC_LABELS: Array<[keyof ReviewMetrics, string]> = [
  ["workQuality", "Work Quality"],
  ["communication", "Communication"],
  ["timeliness", "Timeliness"],
  ["professionalism", "Professionalism"],
  ["valueForMoney", "Value for Money"],
  ["platformExperience", "Platform Experience"],
  ["supportExperience", "Support Experience"],
  ["wouldRecommend", "Would Recommend"],
];

const SCOPE_ITEMS: Array<{
  key: RatingScope;
  label: string;
  helper: string;
  icon: typeof MessageSquareText;
}> = [
  {
    key: "all",
    label: "All",
    helper: "Everything submitted",
    icon: MessageSquareText,
  },
  {
    key: "normal",
    label: "Campaign Rating",
    helper: "Brand and influencer campaign reviews",
    icon: Star,
  },
  {
    key: "platform",
    label: "Platform Rating",
    helper: "Feedback about CollabGlam",
    icon: Globe2,
  },
];

const REVIEW_TYPE_FILTERS: Array<{
  key: RatingDirectionFilter;
  label: string;
  helper: string;
  scopes: RatingScope[];
}> = [
  {
    key: "all",
    label: "All Types",
    helper: "Everything in this tab",
    scopes: ["all", "normal", "platform"],
  },
  {
    key: "campaign",
    label: "Campaign Ratings",
    helper: "Brand and influencer campaign reviews",
    scopes: ["all"],
  },
  {
    key: "platform",
    label: "Platform Feedback",
    helper: "Feedback about CollabGlam",
    scopes: ["all"],
  },
  {
    key: "brand_to_influencer",
    label: "Brand Rated Influencer",
    helper: "Campaign ratings submitted by brands",
    scopes: ["all", "normal"],
  },
  {
    key: "influencer_to_brand",
    label: "Influencer Rated Brand",
    helper: "Campaign ratings submitted by influencers",
    scopes: ["all", "normal"],
  },
  {
    key: "brand_feedback",
    label: "Platform Feedback from Brands",
    helper: "Brand feedback about CollabGlam",
    scopes: ["all", "platform"],
  },
  {
    key: "influencer_feedback",
    label: "Platform Feedback from Influencers",
    helper: "Influencer feedback about CollabGlam",
    scopes: ["all", "platform"],
  },
];

const SCORE_FILTERS: Array<{
  key: RatingScoreFilter;
  label: string;
  helper: string;
}> = [
  { key: "all", label: "All Ratings", helper: "Any score" },
  { key: "5", label: "5 Star", helper: "Perfect ratings" },
  { key: "4_plus", label: "4+ Star", helper: "Strong ratings" },
  { key: "3_plus", label: "3+ Star", helper: "Average and above" },
  { key: "below_3", label: "Below 3", helper: "Needs attention" },
];


function safeNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function round1(value: unknown): string {
  return safeNumber(value).toFixed(1);
}

function normalizeText(value = ""): string {
  return String(value).split("_").join(" ");
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);

  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function formatCompactDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);

  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function stringifyAnswer(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (Array.isArray(value)) {
    return value.map((item: unknown): string => stringifyAnswer(item)).join(", ");
  }
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      q.set(key, String(value).trim());
    }
  });

  return q.toString();
}

function isPlatformReview(type?: string): boolean {
  return type === "brand_to_platform" || type === "influencer_to_platform";
}

function isNormalReview(type?: string): boolean {
  return type === "brand_to_influencer" || type === "influencer_to_brand";
}

function getReviewTypeLabel(type?: ReviewType | string): string {
  return REVIEW_TYPE_LABEL[type as ReviewType] || "Review";
}

function getReviewCategoryLabel(type?: ReviewType | string): string {
  return isPlatformReview(type) ? "Platform Feedback" : "Campaign Rating";
}

function getEntityName(value?: MiniEntity | ReviewSnapshot | string | null, fallback = "—"): string {
  if (!value) return fallback;
  if (typeof value === "string") return value;

  return (
    value.name ||
    ("campaignTitle" in value ? value.campaignTitle : "") ||
    ("productOrServiceName" in value ? value.productOrServiceName : "") ||
    ("title" in value ? value.title : "") ||
    ("brandName" in value ? value.brandName : "") ||
    ("companyName" in value ? value.companyName : "") ||
    ("influencerName" in value ? value.influencerName : "") ||
    ("fullName" in value ? value.fullName : "") ||
    ("username" in value ? value.username : "") ||
    value.email ||
    ("key" in value ? value.key : "") ||
    fallback
  );
}

function getEntityImage(value?: MiniEntity | ReviewSnapshot | null): string {
  if (!value) return "";

  return (
    value.image ||
    ("avatar" in value ? value.avatar : "") ||
    ("profilePic" in value ? value.profilePic : "") ||
    ("profileImage" in value ? value.profileImage : "") ||
    ("profilePicture" in value ? value.profilePicture : "") ||
    ("logo" in value ? value.logo : "") ||
    ("brandLogo" in value ? value.brandLogo : "") ||
    ("picture" in value ? value.picture : "") ||
    ""
  );
}

function getInitials(name = "?"): string {
  const cleaned = String(name || "?")
    .replace(/[@._-]/g, " ")
    .split(" ")
    .filter(Boolean);

  return (
    cleaned
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "?"
  );
}

function getReviewer(review: AdminReview): MiniEntity | ReviewSnapshot | null {
  if (review.reviewer) return review.reviewer;
  if (review.reviewerRole === "brand") return review.brand || null;
  if (review.reviewerRole === "influencer") return review.influencer || null;
  return review.platform || null;
}

function getReviewee(review: AdminReview): MiniEntity | ReviewSnapshot | null {
  if (review.reviewee) return review.reviewee;
  if (review.revieweeRole === "brand") return review.brand || null;
  if (review.revieweeRole === "influencer") return review.influencer || null;
  return review.platform || { name: "CollabGlam" };
}

function getCampaignEntity(review: AdminReview): MiniEntity | null {
  return review.campaign || (typeof review.campaignId === "object" ? review.campaignId : null);
}

function getCampaignName(review: AdminReview): string {
  if (isPlatformReview(review.reviewType)) return "Platform Feedback";
  return getEntityName(getCampaignEntity(review), "No campaign");
}

function getSubmittedAt(review: AdminReview): string | undefined {
  return review.submittedAt || review.firstSubmittedAt || review.createdAt;
}

function getReviewRating(review: AdminReview): number {
  return safeNumber(review.rating || review.noteStarRating);
}

function getAverageRating(rows: AdminReview[]): string {
  const ratings = rows
    .map((row) => getReviewRating(row))
    .filter((value) => value > 0);

  if (!ratings.length) return "—";

  return (ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1);
}

function matchesReviewTypeFilter(review: AdminReview, filter: RatingDirectionFilter): boolean {
  if (filter === "all") return true;
  if (filter === "campaign") return isNormalReview(review.reviewType);
  if (filter === "platform") return isPlatformReview(review.reviewType);
  if (filter === "brand_feedback") return review.reviewType === "brand_to_platform";
  if (filter === "influencer_feedback") return review.reviewType === "influencer_to_platform";
  return review.reviewType === filter;
}

function matchesScoreFilter(review: AdminReview, filter: RatingScoreFilter): boolean {
  if (filter === "all") return true;

  const rating = getReviewRating(review);

  if (filter === "5") return rating >= 5;
  if (filter === "4_plus") return rating >= 4;
  if (filter === "3_plus") return rating >= 3;
  if (filter === "below_3") return rating > 0 && rating < 3;

  return true;
}

function getScopeRows(scope: RatingScope, rows: AdminReview[]): AdminReview[] {
  if (scope === "normal") return rows.filter((item) => isNormalReview(item.reviewType));
  if (scope === "platform") return rows.filter((item) => isPlatformReview(item.reviewType));
  return rows;
}

function getCountLabel(value: number): string {
  return `${value} ${value === 1 ? "row" : "rows"}`;
}

function getSubmittedAnswers(review: AdminReview): SubmittedAnswer[] {
  const answers: SubmittedAnswer[] = [];
  const seen = new Set<string>();

  const pushAnswer = (question: string, answer: unknown, score?: number | null) => {
    const label = question || "Question";
    const value = stringifyAnswer(answer);
    const key = `${label}:${value}`;

    if (value === "—" || seen.has(key)) return;

    seen.add(key);
    answers.push({ question: label, answer: value, score });
  };

  if (Array.isArray(review.responses)) {
    review.responses.forEach((item) => {
      pushAnswer(
        item.questionLabel || item.questionKey || "Question",
        item.displayValue ?? item.value,
        item.score
      );
    });
  }

  if (review.responseMap && typeof review.responseMap === "object") {
    Object.entries(review.responseMap).forEach(([key, item]) => {
      pushAnswer(
        item.questionLabel || item.questionKey || normalizeText(key),
        item.displayValue ?? item.value,
        item.score
      );
    });
  }

  if (!answers.length) {
    pushAnswer("Overall rating", review.rating || review.noteStarRating);
    pushAnswer("Review text", review.reviewText);
    pushAnswer("Private feedback", review.privateFeedback);
    pushAnswer("Tags submitted", review.tags?.length ? review.tags.map(normalizeText).join(", ") : "");

    const metrics = review.metrics || review.ratings || {};
    METRIC_LABELS.forEach(([key, label]) => {
      if (safeNumber(metrics[key]) > 0) {
        pushAnswer(label, `${safeNumber(metrics[key]).toFixed(1)} / 5`);
      }
    });
  }

  return answers;
}

function Badge({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: "gray" | "green" | "yellow";
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        borderRadius: 999,
        padding: "5px 9px",
        fontSize: 11,
        fontWeight: 800,
        whiteSpace: "nowrap",
        background: tone === "green" ? "#ecfdf5" : tone === "yellow" ? "#fffbeb" : "#f8fafc",
        color: tone === "green" ? "#047857" : tone === "yellow" ? "#92400e" : "#475569",
        border:
          tone === "green"
            ? "1px solid #bbf7d0"
            : tone === "yellow"
              ? "1px solid #fde68a"
              : "1px solid #e2e8f0",
      }}
    >
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status?: ReviewStatus | string }) {
  if (status === "submitted") {
    return (
      <Badge tone="green">
        <CheckCircle2 size={12} /> Submitted
      </Badge>
    );
  }

  return <Badge>{normalizeText(status || "—")}</Badge>;
}

function TypeBadge({ type }: { type?: ReviewType | string }) {
  return <Badge>{getReviewTypeLabel(type)}</Badge>;
}

function CategoryBadge({ type }: { type?: ReviewType | string }) {
  return <Badge>{getReviewCategoryLabel(type)}</Badge>;
}

function Avatar({
  entity,
  role,
}: {
  entity?: MiniEntity | ReviewSnapshot | null;
  role?: ReviewRole | string;
}) {
  const name = getEntityName(entity, "User");
  const image = getEntityImage(entity);
  const Icon = role === "brand" ? Building2 : role === "influencer" ? UserRound : Globe2;

  return (
    <div
      style={{
        width: 42,
        height: 42,
        borderRadius: 14,
        background: "#f1f5f9",
        color: "#475569",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 900,
        fontSize: 13,
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {image ? (
        <img src={image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : name && name !== "—" ? (
        getInitials(name)
      ) : (
        <Icon size={18} />
      )}
    </div>
  );
}

function EntitySmall({
  entity,
  role,
}: {
  entity?: MiniEntity | ReviewSnapshot | null;
  role?: ReviewRole | string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      <Avatar entity={entity} role={role} />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            margin: 0,
            fontSize: 14,
            color: "#111827",
            fontWeight: 900,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {getEntityName(entity, "—")}
        </div>
        <div
          style={{
            margin: "3px 0 0",
            fontSize: 12,
            color: "#64748b",
            lineHeight: 1.4,
            textTransform: "capitalize",
          }}
        >
          {role || "—"}
        </div>
      </div>
    </div>
  );
}

function CampaignCell({ review }: { review: AdminReview }) {
  const isPlatform = isPlatformReview(review.reviewType);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 190 }}>
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748b",
          flexShrink: 0,
        }}
      >
        {isPlatform ? <Globe2 size={15} /> : <CalendarDays size={15} />}
      </span>
      <span style={{ minWidth: 0 }}>
        <span
          style={{
            display: "block",
            color: "#111827",
            fontSize: 14,
            fontWeight: 850,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {getCampaignName(review)}
        </span>
        <span style={{ display: "block", marginTop: 3, color: "#64748b", fontSize: 12, fontWeight: 600 }}>
          {isPlatform ? "CollabGlam platform" : "Campaign rating"}
        </span>
      </span>
    </div>
  );
}

function Stars({ rating = 0 }: { rating?: number | null }) {
  const value = Math.max(0, Math.min(5, Math.round(safeNumber(rating))));

  return (
    <span style={{ display: "inline-flex", gap: 1, alignItems: "center" }}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={13}
          style={{
            color: index < value ? "#f59e0b" : "#cbd5e1",
            fill: index < value ? "#f59e0b" : "none",
          }}
        />
      ))}
    </span>
  );
}

function RatingPill({ rating }: { rating?: number | null }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        border: "1px solid #fde68a",
        background: "#fffbeb",
        color: "#92400e",
        borderRadius: 999,
        padding: "6px 9px",
        fontSize: 12,
        fontWeight: 900,
        whiteSpace: "nowrap",
      }}
    >
      <Stars rating={rating} />
      {round1(rating)}
    </span>
  );
}

function AnswerPreview({ review }: { review: AdminReview }) {
  const answers = getSubmittedAnswers(review);
  const firstAnswer = answers[0];

  return (
    <div style={{ maxWidth: 430 }}>
      <strong style={{ fontSize: 14, fontWeight: 900, color: "#111827" }}>
        {answers.length} answer{answers.length === 1 ? "" : "s"}
      </strong>
      {firstAnswer ? (
        <p
          style={{
            margin: "4px 0 0",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            fontSize: 12,
            fontWeight: 500,
            lineHeight: 1.6,
            color: "#64748b",
          }}
        >
          {firstAnswer.question}: {firstAnswer.answer}
        </p>
      ) : (
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>
          No answer preview available.
        </p>
      )}
    </div>
  );
}

function EmptyState({
  title = "No submitted ratings found",
  copy = "Submitted ratings will appear here.",
}: {
  title?: string;
  copy?: string;
}) {
  return (
    <div style={{ padding: 36, textAlign: "center", color: "#64748b" }}>
      <MessageSquareText size={28} color="#94a3b8" />
      <h3 style={{ margin: "10px 0 4px", fontSize: 16, fontWeight: 900, color: "#111827" }}>{title}</h3>
      <p style={{ margin: 0, lineHeight: 1.6 }}>{copy}</p>
    </div>
  );
}

function Toast({ toast }: { toast: ToastState }) {
  return (
    <div
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 2147483647,
        borderRadius: 12,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
        fontWeight: 850,
        boxShadow: "0 18px 45px rgba(15, 23, 42, 0.18)",
        background: toast.type === "success" ? "#111827" : "#fff1f2",
        color: toast.type === "success" ? "#fff" : "#be123c",
        border: toast.type === "success" ? "1px solid #111827" : "1px solid #fecdd3",
      }}
    >
      {toast.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      {toast.message}
    </div>
  );
}

function ReviewInfoModal({
  review,
  mounted,
  onClose,
}: {
  review: AdminReview | null;
  mounted: boolean;
  onClose: () => void;
}) {
  if (!mounted || !review) return null;

  const reviewer = getReviewer(review);
  const reviewee = getReviewee(review);
  const answers = getSubmittedAnswers(review);
  const tags = Array.isArray(review.tags) ? review.tags : [];

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        background: "rgba(15, 23, 42, 0.34)",
        display: "flex",
        justifyContent: "flex-end",
        backdropFilter: "blur(2px)",
      }}
      onClick={onClose}
    >
      <aside
        style={{
          width: "min(760px, 100%)",
          height: "100dvh",
          background: "#fff",
          boxShadow: "-18px 0 50px rgba(15, 23, 42, 0.18)",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          style={{
            padding: 18,
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            background: "#fff",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 950, color: "#111827" }}>
              {review.reviewTitle || getReviewTypeLabel(review.reviewType)}
            </h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              <RatingPill rating={review.rating || review.noteStarRating} />
            </div>
          </div>

          <button
            type="button"
            style={{
              width: 40,
              height: 40,
              border: "1px solid #d9dee8",
              borderRadius: 12,
              background: "#fff",
              color: "#111827",
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 18, overflowY: "auto", display: "grid", gap: 14, background: "#f8fafc" }}>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 16, background: "#fff", padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <EntitySmall entity={reviewer} role={review.reviewerRole} />
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  color: "#94a3b8",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowRight size={16} />
              </span>
              <EntitySmall entity={reviewee} role={review.revieweeRole} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 16, background: "#fff", padding: 14 }}>
              <p style={{ margin: "0 0 8px", color: "#111827", fontSize: 13, fontWeight: 900 }}>Campaign</p>
              <p style={{ margin: 0, color: "#475569", fontSize: 13, lineHeight: 1.65, wordBreak: "break-word" }}>
                {getCampaignName(review)}
              </p>
            </div>

            <div style={{ border: "1px solid #e2e8f0", borderRadius: 16, background: "#fff", padding: 14 }}>
              <p style={{ margin: "0 0 8px", color: "#111827", fontSize: 13, fontWeight: 900 }}>Submitted</p>
              <p style={{ margin: 0, color: "#475569", fontSize: 13, lineHeight: 1.65 }}>
                {formatDate(getSubmittedAt(review))}
              </p>
            </div>
          </div>

          {review.reviewText ? (
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 16, background: "#fff", padding: 14 }}>
              <p style={{ margin: "0 0 8px", color: "#111827", fontSize: 13, fontWeight: 900 }}>Review Note</p>
              <p
                style={{
                  margin: 0,
                  color: "#475569",
                  fontSize: 13,
                  lineHeight: 1.75,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {review.reviewText}
              </p>
            </div>
          ) : null}

          <div style={{ border: "1px solid #e2e8f0", borderRadius: 16, background: "#fff", padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <h3 style={{ fontSize: 17, fontWeight: 950, margin: 0 }}>Submitted Questions & Answers</h3>
              <Badge>{answers.length} answer{answers.length === 1 ? "" : "s"}</Badge>
            </div>

            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              {answers.length ? (
                answers.map((item, index) => (
                  <div
                    key={`${item.question}-${index}`}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 14,
                      padding: 12,
                      background: "#f8fafc",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                    }}
                  >
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 999,
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        color: "#111827",
                        fontSize: 12,
                        fontWeight: 900,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ margin: "0 0 8px", color: "#111827", fontSize: 13, fontWeight: 900, lineHeight: 1.45 }}>
                        {item.question}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          color: "#475569",
                          fontSize: 13,
                          lineHeight: 1.65,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {item.answer}
                      </p>
                      {item.score ? (
                        <div style={{ marginTop: 8 }}>
                          <Badge tone="yellow">Score: {item.score}/5</Badge>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState title="No submitted answers" copy="This review does not include question-answer data." />
              )}
            </div>
          </div>

          {tags.length ? (
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 16, background: "#fff", padding: 14 }}>
              <p style={{ margin: "0 0 8px", color: "#111827", fontSize: 13, fontWeight: 900 }}>Submitted Tags</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {tags.map((tag) => (
                  <Badge key={tag}>{normalizeText(tag)}</Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </aside>
    </div>,
    document.body
  );
}

export default function RatingReviewsOverviewPage() {
  const [mounted, setMounted] = useState(false);
  const [activeScope, setActiveScope] = useState<RatingScope>("all");
  const [directionFilter, setDirectionFilter] = useState<RatingDirectionFilter>("all");
  const [scoreFilter, setScoreFilter] = useState<RatingScoreFilter>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(FETCH_LIMIT);
  const [search, setSearch] = useState("");
  const [allReviews, setAllReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "error") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);

      const query = buildQuery({
        page: 1,
        limit: FETCH_LIMIT,
        search,
        status: "submitted",
      });

      const payload = await get<AdminListResponse>(`/campaign-reviews/admin?${query}`);

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to load submitted ratings.");
      }

      const data = Array.isArray(payload?.data) ? payload.data : [];
      setAllReviews(data.filter((item) => item.status === "submitted"));
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || "Failed to load submitted ratings.");
      setAllReviews([]);
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const normalReviews = useMemo(
    () => allReviews.filter((item) => isNormalReview(item.reviewType)),
    [allReviews]
  );

  const platformReviews = useMemo(
    () => allReviews.filter((item) => isPlatformReview(item.reviewType)),
    [allReviews]
  );

  const scopedReviews = useMemo(
    () => getScopeRows(activeScope, allReviews),
    [activeScope, allReviews]
  );

  const reviewTypeCounts = useMemo(() => {
    const counts: Record<RatingDirectionFilter, number> = {
      all: scopedReviews.length,
      campaign: scopedReviews.filter((item) => isNormalReview(item.reviewType)).length,
      platform: scopedReviews.filter((item) => isPlatformReview(item.reviewType)).length,
      brand_to_influencer: scopedReviews.filter((item) => item.reviewType === "brand_to_influencer").length,
      influencer_to_brand: scopedReviews.filter((item) => item.reviewType === "influencer_to_brand").length,
      brand_feedback: scopedReviews.filter((item) => item.reviewType === "brand_to_platform").length,
      influencer_feedback: scopedReviews.filter((item) => item.reviewType === "influencer_to_platform").length,
    };

    return counts;
  }, [scopedReviews]);

  const typeFilterOptions = useMemo(
    () => REVIEW_TYPE_FILTERS.filter((item) => item.scopes.includes(activeScope)),
    [activeScope]
  );

  useEffect(() => {
    if (!typeFilterOptions.some((item) => item.key === directionFilter)) {
      setDirectionFilter("all");
    }
  }, [directionFilter, typeFilterOptions]);

  const filteredReviews = useMemo(
    () =>
      scopedReviews.filter(
        (item) =>
          matchesReviewTypeFilter(item, directionFilter) &&
          matchesScoreFilter(item, scoreFilter)
      ),
    [directionFilter, scoreFilter, scopedReviews]
  );

  const totalItems = filteredReviews.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const safePage = Math.min(page, totalPages);

  const paginatedReviews = useMemo(() => {
    const start = (safePage - 1) * limit;
    return filteredReviews.slice(start, start + limit);
  }, [filteredReviews, safePage, limit]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  function changeScope(scope: RatingScope) {
    setActiveScope(scope);
    setDirectionFilter("all");
    setScoreFilter("all");
    setPage(1);
  }

  const scopeCounts: Record<RatingScope, number> = {
    all: allReviews.length,
    normal: normalReviews.length,
    platform: platformReviews.length,
  };

  const activeScopeMeta = SCOPE_ITEMS.find((item) => item.key === activeScope) || SCOPE_ITEMS[0];
  const activeDirectionMeta =
    REVIEW_TYPE_FILTERS.find((item) => item.key === directionFilter) || REVIEW_TYPE_FILTERS[0];
  const activeScoreMeta = SCORE_FILTERS.find((item) => item.key === scoreFilter) || SCORE_FILTERS[0];
  const currentAverage = getAverageRating(filteredReviews);
  const normalAverage = getAverageRating(normalReviews);
  const platformAverage = getAverageRating(platformReviews);
  const brandToInfluencerAverage = getAverageRating(
    allReviews.filter((item) => item.reviewType === "brand_to_influencer")
  );
  const influencerToBrandAverage = getAverageRating(
    allReviews.filter((item) => item.reviewType === "influencer_to_brand")
  );
  const brandToPlatformAverage = getAverageRating(
    allReviews.filter((item) => item.reviewType === "brand_to_platform")
  );
  const influencerToPlatformAverage = getAverageRating(
    allReviews.filter((item) => item.reviewType === "influencer_to_platform")
  );
  const latestSubmittedAt =
    [...allReviews]
      .map((item) => getSubmittedAt(item))
      .filter((value): value is string => Boolean(value))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || null;

  const lowRatingCount = filteredReviews.filter((item) => {
    const rating = getReviewRating(item);
    return rating > 0 && rating < 3;
  }).length;

  const cardItems = useMemo(() => {
    if (activeScope === "normal") {
      return [
        {
          label: "Campaign Ratings",
          value: normalReviews.length,
          helper: `Avg ${normalAverage}`,
          icon: <Star size={18} />,
          accent: "#111827",
        },
        {
          label: "Brand Rated Influencers",
          value: allReviews.filter((item) => item.reviewType === "brand_to_influencer").length,
          helper: `Avg ${brandToInfluencerAverage}`,
          icon: <Building2 size={18} />,
          accent: "#334155",
        },
        {
          label: "Influencers Rated Brands",
          value: allReviews.filter((item) => item.reviewType === "influencer_to_brand").length,
          helper: `Avg ${influencerToBrandAverage}`,
          icon: <UserRound size={18} />,
          accent: "#475569",
        },
        {
          label: "Needs Attention",
          value: lowRatingCount,
          helper: "Below 3 star in current view",
          icon: <CheckCircle2 size={18} />,
          accent: "#64748b",
        },
      ];
    }

    if (activeScope === "platform") {
      return [
        {
          label: "Platform Feedback",
          value: platformReviews.length,
          helper: `Avg ${platformAverage}`,
          icon: <Globe2 size={18} />,
          accent: "#111827",
        },
        {
          label: "Platform Feedback from Brands",
          value: allReviews.filter((item) => item.reviewType === "brand_to_platform").length,
          helper: `Avg ${brandToPlatformAverage}`,
          icon: <Building2 size={18} />,
          accent: "#334155",
        },
        {
          label: "Platform Feedback from Influencers",
          value: allReviews.filter((item) => item.reviewType === "influencer_to_platform").length,
          helper: `Avg ${influencerToPlatformAverage}`,
          icon: <UserRound size={18} />,
          accent: "#475569",
        },
        {
          label: "Needs Attention",
          value: lowRatingCount,
          helper: "Below 3 star in current view",
          icon: <CheckCircle2 size={18} />,
          accent: "#64748b",
        },
      ];
    }

    return [
      {
        label: "All Submitted",
        value: allReviews.length,
        helper: `Avg ${getAverageRating(allReviews)}`,
        icon: <MessageSquareText size={18} />,
        accent: "#111827",
      },
      {
        label: "Campaign Ratings",
        value: normalReviews.length,
        helper: `Avg ${normalAverage}`,
        icon: <Star size={18} />,
        accent: "#334155",
      },
      {
        label: "Platform Feedback",
        value: platformReviews.length,
        helper: `Avg ${platformAverage}`,
        icon: <Globe2 size={18} />,
        accent: "#475569",
      },
      {
        label: "Needs Attention",
        value: lowRatingCount,
        helper: "Below 3 star in current view",
        icon: <CheckCircle2 size={18} />,
        accent: "#64748b",
      },
    ];
  }, [
    activeScope,
    allReviews,
    brandToInfluencerAverage,
    brandToPlatformAverage,
    influencerToBrandAverage,
    influencerToPlatformAverage,
    lowRatingCount,
    normalAverage,
    normalReviews.length,
    platformAverage,
    platformReviews.length,
  ]);

  const tableColumns = useMemo<AdminTableColumn<AdminReview>[]>(
    () => [
      {
        id: "campaign",
        header: "Campaign",
        render: (row) => <CampaignCell review={row} />,
      },
      {
        id: "submittedBy",
        header: "Submitted By",
        render: (row) => <EntitySmall entity={getReviewer(row)} role={row.reviewerRole} />,
      },
      {
        id: "submittedFor",
        header: "Submitted For",
        render: (row) => <EntitySmall entity={getReviewee(row)} role={row.revieweeRole} />,
      },
      {
        id: "type",
        header: "Type",
        render: (row) => <TypeBadge type={row.reviewType} />,
      },
      {
        id: "rating",
        header: "Rating",
        align: "center",
        render: (row) => <RatingPill rating={row.rating || row.noteStarRating} />,
      },
      {
        id: "answers",
        header: "Answers",
        render: (row) => <AnswerPreview review={row} />,
      },
      {
        id: "submitted",
        header: "Submitted",
        render: (row) => (
          <span style={{ fontWeight: 700, color: "#64748b", fontSize: 13 }}>
            {formatDate(getSubmittedAt(row))}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        color: "#111827",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: "100%", margin: 0 }}>
        <section
          style={{
            border: "1px solid #e2e8f0",
            background: "#fff",
            borderRadius: 22,
            padding: 20,
            marginBottom: 14,
            boxShadow: "0 12px 32px rgba(15, 23, 42, 0.04)",
          }}
        >
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "#64748b",
                  fontWeight: 850,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                Rating Center
              </p>
              <h1
                style={{
                  margin: "6px 0 0",
                  fontSize: 30,
                  fontWeight: 950,
                  letterSpacing: -0.65,
                  color: "#111827",
                }}
              >
                Ratings & Reviews
              </h1>
            </div>

            <button
              type="button"
              style={{
                height: 40,
                border: "1px solid #d9dee8",
                borderRadius: 12,
                background: "#fff",
                color: "#111827",
                padding: "0 14px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: 13,
                fontWeight: 850,
                cursor: "pointer",
                whiteSpace: "nowrap",
                opacity: loading ? 0.65 : 1,
              }}
              disabled={loading}
              onClick={() => void loadReviews()}
            >
              <RefreshCw size={15} /> Refresh
            </button>
          </header>

          <div
            role="tablist"
            aria-label="Rating scopes"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(160px, 1fr))",
              gap: 8,
              padding: 8,
              marginTop: 18,
              border: "1px solid #e2e8f0",
              borderRadius: 18,
              background: "#f8fafc",
            }}
          >
            {SCOPE_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeScope === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => changeScope(item.key)}
                  style={{
                    border: active ? "1px solid #d9dee8" : "1px solid transparent",
                    borderRadius: 14,
                    background: active ? "#fff" : "transparent",
                    minHeight: 72,
                    padding: "12px 14px",
                    textAlign: "left",
                    cursor: "pointer",
                    color: "#111827",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    boxShadow: active ? "0 10px 24px rgba(15, 23, 42, 0.06)" : "none",
                  }}
                >
                  <span
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: active ? "#111827" : "#fff",
                      color: active ? "#fff" : "#64748b",
                      border: active ? "1px solid #111827" : "1px solid #e2e8f0",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} />
                  </span>

                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 950, color: "inherit" }}>{item.label}</span>
                      <span
                        style={{
                          border: "1px solid #e2e8f0",
                          background: "#f8fafc",
                          color: "#475569",
                          borderRadius: 999,
                          padding: "3px 8px",
                          fontSize: 11,
                          fontWeight: 900,
                        }}
                      >
                        {scopeCounts[item.key]}
                      </span>
                    </span>
                    <span
                      style={{
                        display: "block",
                        fontSize: 12,
                        color: "#64748b",
                        marginTop: 4,
                        lineHeight: 1.35,
                      }}
                    >
                      {item.helper}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(170px, 1fr))",
            gap: 12,
            marginBottom: 14,
          }}
        >
          {cardItems.map((card) => (
            <div
              key={card.label}
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderLeft: `4px solid ${card.accent}`,
                borderRadius: 18,
                padding: 16,
                boxShadow: "0 10px 28px rgba(15, 23, 42, 0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <p style={{ fontSize: 12, color: "#64748b", fontWeight: 850, margin: 0 }}>{card.label}</p>
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: card.accent,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {card.icon}
                </span>
              </div>
              <p style={{ fontSize: 27, fontWeight: 950, margin: "10px 0 0", letterSpacing: -0.4 }}>
                {card.value}
              </p>
              <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 12, fontWeight: 700 }}>
                {card.helper}
              </p>
            </div>
          ))}
        </section>

        <section
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: "0 10px 28px rgba(15, 23, 42, 0.04)",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              padding: 16,
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 950 }}>{activeScopeMeta.label} list</h2>
            </div>
          </div>

          <div
            style={{
              padding: 16,
              borderBottom: "1px solid #e2e8f0",
              display: "grid",
              gridTemplateColumns: "minmax(260px, 1.4fr) minmax(220px, 0.7fr) minmax(190px, 0.6fr)",
              gap: 12,
              alignItems: "end",
            }}
          >
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 11, fontWeight: 850, letterSpacing: "0.12em", textTransform: "uppercase", color: "#94a3b8" }}>
                Search
              </label>
              <div style={{ position: "relative" }}>
                <Search
                  size={15}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 12,
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                />
                <input
                  style={{
                    width: "100%",
                    height: 42,
                    border: "1px solid #d9dee8",
                    borderRadius: 12,
                    background: "#fff",
                    outline: "none",
                    padding: "0 12px 0 38px",
                    fontSize: 13,
                    color: "#111827",
                    fontWeight: 650,
                  }}
                  value={search}
                  placeholder={`Search ${activeScopeMeta.label.toLowerCase()} ratings...`}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 11, fontWeight: 850, letterSpacing: "0.12em", textTransform: "uppercase", color: "#94a3b8" }}>
                Review Filter
              </label>
              <div style={{ position: "relative" }}>
                <select
                  value={directionFilter}
                  onChange={(event) => {
                    setDirectionFilter(event.target.value as RatingDirectionFilter);
                    setPage(1);
                  }}
                  style={{
                    width: "100%",
                    height: 42,
                    border: "1px solid #d9dee8",
                    borderRadius: 12,
                    background: "#fff",
                    outline: "none",
                    padding: "0 38px 0 12px",
                    fontSize: 13,
                    color: "#111827",
                    fontWeight: 800,
                    appearance: "none",
                    cursor: "pointer",
                  }}
                >
                  {typeFilterOptions.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label} ({reviewTypeCounts[item.key]})
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 11, fontWeight: 850, letterSpacing: "0.12em", textTransform: "uppercase", color: "#94a3b8" }}>
                Rating
              </label>
              <div style={{ position: "relative" }}>
                <select
                  value={scoreFilter}
                  onChange={(event) => {
                    setScoreFilter(event.target.value as RatingScoreFilter);
                    setPage(1);
                  }}
                  style={{
                    width: "100%",
                    height: 42,
                    border: "1px solid #d9dee8",
                    borderRadius: 12,
                    background: "#fff",
                    outline: "none",
                    padding: "0 38px 0 12px",
                    fontSize: 13,
                    color: "#111827",
                    fontWeight: 800,
                    appearance: "none",
                    cursor: "pointer",
                  }}
                >
                  {SCORE_FILTERS.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>
          </div>

          <AdminTable<AdminReview>
            data={paginatedReviews}
            columns={tableColumns}
            rowKey={(row) => row._id}
            loading={loading}
            loadingRows={8}
            emptyTitle="No submitted ratings found"
            emptyDescription="No submitted ratings match this selection."
            onRowClick={(row) => setSelectedReview(row)}
            actions={{
              header: "Action",
              render: (row) => (
                <button
                  type="button"
                  style={{
                    height: 38,
                    border: "1px solid #d9dee8",
                    borderRadius: 12,
                    background: "#fff",
                    color: "#111827",
                    padding: "0 12px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    fontSize: 13,
                    fontWeight: 850,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                  onClick={() => setSelectedReview(row)}
                >
                  <Eye size={14} /> View
                </button>
              ),
            }}
            pagination={{
              page: safePage,
              totalPages,
              totalItems,
              limit,
              onPageChange: setPage,
              onLimitChange: (value) => {
                setLimit(value);
                setPage(1);
              },
              rowOptions: [25, 50, 100, 250, FETCH_LIMIT],
              loading,
            }}
          />
        </section>
      </div>

      <ReviewInfoModal review={selectedReview} mounted={mounted} onClose={() => setSelectedReview(null)} />
      {toast ? <Toast toast={toast} /> : null}
    </main>
  );
}
