"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Eye,
  Globe2,
  Star,
  UserRound,
  X,
} from "lucide-react";
import { get } from "@/lib/api";
import AdminTable, { type AdminTableColumn } from "../../../components/table";

type ReviewType =
  | "brand_to_influencer"
  | "influencer_to_brand"
  | "brand_to_platform"
  | "influencer_to_platform";

type ReviewStatus = "pending" | "submitted" | "skipped" | "expired" | "revoked";
type ReviewRole = "brand" | "influencer" | "platform" | "admin";
type RatingTypeFilter = "all" | "brand_to_influencer" | "influencer_to_brand" | "platform";

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
  reviewType: ReviewType;
  reviewerRole?: ReviewRole;
  revieweeRole?: ReviewRole;
  status: ReviewStatus;
  submittedVia?: string;
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
  createdAt?: string;
  campaign?: MiniEntity | null;
  brand?: MiniEntity | null;
  influencer?: MiniEntity | null;
  platform?: MiniEntity | null;
  reviewer?: ReviewSnapshot | null;
  reviewee?: ReviewSnapshot | null;
  campaignId?: MiniEntity | string | null;
};

type AdminListResponse = {
  success?: boolean;
  data?: AdminReview[];
  total?: number;
  page?: number;
  limit?: number;
  message?: string;
};

type SubmittedAnswer = { question: string; answer: string; score?: number | null };

const REVIEW_TYPE_LABEL: Record<ReviewType, string> = {
  brand_to_influencer: "Brand → Influencer",
  influencer_to_brand: "Influencer → Brand",
  brand_to_platform: "Brand → Platform",
  influencer_to_platform: "Influencer → Platform",
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

const TYPE_FILTERS: Array<{
  id: RatingTypeFilter;
  label: string;
  description: string;
}> = [
  {
    id: "all",
    label: "All",
    description: "Every submitted rating",
  },
  {
    id: "brand_to_influencer",
    label: "Brand to Influencer",
    description: "Ratings submitted by brand",
  },
  {
    id: "influencer_to_brand",
    label: "Influencer to Brand",
    description: "Ratings given to brand",
  },
  {
    id: "platform",
    label: "Platform Feedback",
    description: "Brand feedback for CollabGlam",
  },
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

function getReviewTypeForFilter(filter: RatingTypeFilter): ReviewType | "" {
  if (filter === "brand_to_influencer") return "brand_to_influencer";
  if (filter === "influencer_to_brand") return "influencer_to_brand";
  if (filter === "platform") return "brand_to_platform";
  return "";
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
  const parts = String(name || "?")
    .replace(/[@._-]/g, " ")
    .split(" ")
    .filter(Boolean);

  return (
    parts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "?"
  );
}

function getReviewTypeLabel(type?: ReviewType | string): string {
  return REVIEW_TYPE_LABEL[type as ReviewType] || "Review";
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
  if (review.reviewType.includes("platform")) return "Platform Feedback";
  return getEntityName(getCampaignEntity(review), "No campaign");
}

function getSubmittedAt(review: AdminReview): string | undefined {
  return review.submittedAt || review.firstSubmittedAt || review.createdAt;
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

function averageByType(rows: AdminReview[], reviewType: ReviewType): string {
  const values = rows
    .filter((item) => item.reviewType === reviewType)
    .map((item) => safeNumber(item.rating || item.noteStarRating))
    .filter((value) => value > 0);

  if (!values.length) return "—";

  return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
}

function Avatar({ entity, role }: { entity?: MiniEntity | ReviewSnapshot | null; role?: string }) {
  const name = getEntityName(entity, "User");
  const image = getEntityImage(entity);
  const Icon = role === "brand" ? Building2 : role === "influencer" ? UserRound : Globe2;

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-sm font-black text-slate-700">
      {image ? (
        <img src={image} alt={name} className="h-full w-full object-cover" />
      ) : name && name !== "—" ? (
        getInitials(name)
      ) : (
        <Icon size={18} />
      )}
    </div>
  );
}

function EntitySmall({ entity, role }: { entity?: MiniEntity | ReviewSnapshot | null; role?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar entity={entity} role={role} />
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-slate-900">{getEntityName(entity, "—")}</p>
        <p className="mt-0.5 text-xs font-semibold capitalize text-slate-400">{role || "—"}</p>
      </div>
    </div>
  );
}

function CampaignCell({ review }: { review: AdminReview }) {
  const campaign = getCampaignEntity(review);
  const isPlatform = review.reviewType.includes("platform");

  return (
    <div className="min-w-[210px]">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
          {isPlatform ? <Globe2 size={16} /> : <CalendarDays size={16} />}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-900">
            {isPlatform ? "Platform Feedback" : getEntityName(campaign, "No campaign")}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-slate-400">
            {isPlatform ? "CollabGlam platform" : "Campaign rating"}
          </p>
        </div>
      </div>
    </div>
  );
}

function Stars({ rating = 0 }: { rating?: number | null }) {
  const value = Math.max(0, Math.min(5, Math.round(safeNumber(rating))));

  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={13}
          className={index < value ? "fill-amber-400 text-amber-400" : "text-slate-200"}
        />
      ))}
    </span>
  );
}

function RatingPill({ rating }: { rating?: number | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-black text-amber-700">
      <Stars rating={rating} />
      {round1(rating)}
    </span>
  );
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${toneClass}`}>
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status?: ReviewStatus | string }) {
  if (status === "submitted") {
    return (
      <Badge tone="success">
        <CheckCircle2 size={12} /> Submitted
      </Badge>
    );
  }

  return <Badge>{status || "—"}</Badge>;
}

function TypeBadge({ type }: { type?: ReviewType | string }) {
  return <Badge>{getReviewTypeLabel(type)}</Badge>;
}

function AnswerPreview({ review }: { review: AdminReview }) {
  const answers = getSubmittedAnswers(review);
  const firstAnswer = answers[0];

  return (
    <div className="max-w-[440px]">
      <strong className="text-sm font-black text-slate-900">
        {answers.length} answer{answers.length === 1 ? "" : "s"}
      </strong>
      {firstAnswer ? (
        <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-slate-500">
          {firstAnswer.question}: {firstAnswer.answer}
        </p>
      ) : (
        <p className="mt-1 text-xs font-medium text-slate-400">No answer preview available.</p>
      )}
    </div>
  );
}

function ReviewDrawer({
  review,
  onClose,
}: {
  review: AdminReview | null;
  onClose: () => void;
}) {
  if (!review) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex justify-end bg-slate-950/35 backdrop-blur-[2px]"
      style={{ zIndex: 2147483647 }}
      onClick={onClose}
    >
      <aside
        className="flex h-full w-full max-w-[760px] flex-col overflow-hidden bg-white shadow-2xl"
        style={{ height: "100dvh" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-5">
          <div>
            <h3 className="mb-3 text-xl font-black text-slate-900">
              {review.reviewTitle || getReviewTypeLabel(review.reviewType)}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <RatingPill rating={review.rating || review.noteStarRating} />
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid flex-1 gap-4 overflow-y-auto bg-slate-50/70 p-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-3">
              <EntitySmall entity={getReviewer(review)} role={review.reviewerRole} />
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-300">
                <ArrowRight size={17} />
              </span>
              <EntitySmall entity={getReviewee(review)} role={review.revieweeRole} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-black text-slate-900">Campaign</p>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{getCampaignName(review)}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-black text-slate-900">Submitted</p>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{formatDate(getSubmittedAt(review))}</p>
            </div>
          </div>

          {review.reviewText ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-black text-slate-900">Review Note</p>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm font-medium leading-6 text-slate-500">
                {review.reviewText}
              </p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-base font-black text-slate-900">Submitted Questions & Answers</h4>
              <Badge>{getSubmittedAnswers(review).length} answers</Badge>
            </div>

            <div className="mt-4 grid gap-3">
              {getSubmittedAnswers(review).length ? (
                getSubmittedAnswers(review).map((item, index) => (
                  <div key={`${item.question}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-black text-slate-700">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-slate-900">{item.question}</p>
                        <p className="mt-2 whitespace-pre-wrap break-words text-sm font-medium leading-6 text-slate-500">
                          {item.answer}
                        </p>
                        {item.score ? (
                          <div className="mt-3">
                            <Badge tone="warning">Score: {item.score}/5</Badge>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-medium text-slate-500">
                  This review does not include question-answer data.
                </div>
              )}
            </div>
          </div>

          {Array.isArray(review.tags) && review.tags.length ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-black text-slate-900">Tags</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {review.tags.map((tag) => (
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

export function BrandRatingsTab({ brandId, brandName }: { brandId: string; brandName?: string }) {
  const [filter, setFilter] = useState<RatingTypeFilter>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [statsRows, setStatsRows] = useState<AdminReview[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);

  const selectedFilterMeta = TYPE_FILTERS.find((item) => item.id === filter) || TYPE_FILTERS[0];

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const query = buildQuery({
        page,
        limit,
        brandId,
        status: "submitted",
        reviewType: getReviewTypeForFilter(filter),
      });

      const payload = await get<AdminListResponse>(`/campaign-reviews/admin?${query}`);

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to load submitted ratings.");
      }

      const rows = Array.isArray(payload?.data) ? payload.data : [];
      setReviews(rows);
      setTotal(payload?.total ?? rows.length);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load submitted ratings.");
      setReviews([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [brandId, filter, limit, page]);

  const loadStats = useCallback(async () => {
    try {
      setLoadingStats(true);

      const query = buildQuery({
        page: 1,
        limit: 500,
        brandId,
        status: "submitted",
      });

      const payload = await get<AdminListResponse>(`/campaign-reviews/admin?${query}`);
      const rows = Array.isArray(payload?.data) ? payload.data : [];

      setStatsRows(rows);
    } catch {
      setStatsRows([]);
    } finally {
      setLoadingStats(false);
    }
  }, [brandId]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  function changeFilter(nextFilter: RatingTypeFilter) {
    setFilter(nextFilter);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(Math.max(total, reviews.length) / limit));

  const brandToInfluencerAverage = averageByType(statsRows, "brand_to_influencer");
  const influencerToBrandAverage = averageByType(statsRows, "influencer_to_brand");
  const brandToInfluencerCount = statsRows.filter((item) => item.reviewType === "brand_to_influencer").length;
  const influencerToBrandCount = statsRows.filter((item) => item.reviewType === "influencer_to_brand").length;
  const platformFeedbackCount = statsRows.filter((item) => item.reviewType === "brand_to_platform").length;

  const filterCounts: Record<RatingTypeFilter, number> = {
    all: statsRows.length,
    brand_to_influencer: brandToInfluencerCount,
    influencer_to_brand: influencerToBrandCount,
    platform: platformFeedbackCount,
  };

  const tableColumns = useMemo<AdminTableColumn<AdminReview>[]>(
    () => [
      {
        id: "campaign",
        header: "Campaign",
        render: (row) => <CampaignCell review={row} />,
      },
      {
        id: "reviewer",
        header: "Submitted By",
        render: (row) => <EntitySmall entity={getReviewer(row)} role={row.reviewerRole} />,
      },
      {
        id: "reviewee",
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
          <span className="text-sm font-semibold text-slate-500">
            {formatDate(getSubmittedAt(row))}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        render: (row) => <StatusBadge status={row.status} />,
      },
    ],
    []
  );

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Ratings
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-900 md:text-3xl">
              All Submitted Ratings
            </h2>
          </div>

          <div className="grid min-w-[280px] gap-2 sm:grid-cols-2">
            {[
              {
                label: "Avg. Brand → Influencer",
                value: loadingStats ? "…" : brandToInfluencerAverage,
                hint: `${brandToInfluencerCount} rows`,
                icon: Building2,
              },
              {
                label: "Avg. Influencer → Brand",
                value: loadingStats ? "…" : influencerToBrandAverage,
                hint: `${influencerToBrandCount} rows`,
                icon: UserRound,
              },
            ].map((card) => {
              const Icon = card.icon;

              return (
                <div key={card.label} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-black text-slate-400">{card.label}</p>
                    <Icon size={14} className="text-slate-400" />
                  </div>
                  <div className="mt-1 flex items-end justify-between gap-2">
                    <p className="text-lg font-black text-slate-900">{card.value}</p>
                    <p className="text-[11px] font-semibold text-slate-400">{card.hint}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black text-slate-900">{selectedFilterMeta.label}</h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge>{total || reviews.length} rows</Badge>

            <div className="relative">
              <select
                value={filter}
                onChange={(event) => changeFilter(event.target.value as RatingTypeFilter)}
                className="h-10 min-w-[210px] appearance-none rounded-2xl border border-slate-200 bg-white pl-4 pr-10 text-sm font-black text-slate-700 outline-none transition hover:bg-slate-50"
              >
                {TYPE_FILTERS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label} ({loadingStats ? "…" : filterCounts[item.id]})
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>
        </div>

        <AdminTable<AdminReview>
          data={reviews}
          columns={tableColumns}
          rowKey={(row) => row._id}
          loading={loading}
          loadingRows={8}
          emptyTitle="No submitted ratings found"
          emptyDescription="Submitted ratings connected to this brand will appear here."
          onRowClick={(row) => setSelectedReview(row)}
          actions={{
            header: "Action",
            render: (row) => (
              <button
                type="button"
                onClick={() => setSelectedReview(row)}
                className="inline-flex h-9 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50"
              >
                <Eye size={14} />
                View
              </button>
            ),
          }}
          pagination={{
            page,
            totalPages,
            totalItems: total || reviews.length,
            limit,
            onPageChange: setPage,
            onLimitChange: (value) => {
              setLimit(value);
              setPage(1);
            },
            rowOptions: [10, 20, 50, 100],
            loading,
          }}
          containerClassName="rounded-none border-0 shadow-none"
        />
      </section>

      <ReviewDrawer review={selectedReview} onClose={() => setSelectedReview(null)} />
    </div>
  );
}