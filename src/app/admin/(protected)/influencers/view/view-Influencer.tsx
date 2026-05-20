"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { get, post } from "@/lib/api";
import {
  ArrowUpRight, BarChart3, BriefcaseBusiness, Building2, Calendar,
  CheckCircle2, ChevronLeft, CreditCard, ExternalLink, Globe, Hash,
  Heart, Info, Mail, MapPin, MessageCircle, Sparkles, Tag, TrendingUp,
  Users, Wallet, Eye, PlayCircle, Star, Layers3, ChevronUp, ChevronDown,
  Activity, Zap, Shield, ArrowRight, X, MessageSquareText,
} from "lucide-react";

import AdminTable, { type AdminTableColumn } from "../../../components/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */
interface NamedItem { _id?: string | null; name?: string | null }
interface PostSponsor { name?: string; logo_url?: string; domain?: string }
interface PostItem {
  id?: string; title?: string; text?: string; url?: string; created?: string;
  type?: string; likes?: number; comments?: number; views?: number; plays?: number;
  image?: string; thumbnail?: string; video?: string;
  mentions?: string[]; hashtags?: string[]; sponsors?: PostSponsor[];
}
interface StatWithCompared { value?: number; compared?: number }
interface StatsBlock {
  avgLikes?: StatWithCompared; avgShares?: StatWithCompared;
  avgComments?: StatWithCompared; followers?: StatWithCompared;
  paidPostPerformance?: number;
}
interface HistoryPoint {
  month?: string; avg_likes?: number; avg_engagements?: number;
  avg_comments?: number; avg_views?: number; avg_shares?: number;
}
interface StatsByContentTypeEntry {
  engagements?: number; engagementRate?: number; avgLikes?: number;
  avgComments?: number; avgShares?: number; avgViews?: number;
  avgReelsPlays?: number; avgPosts4weeks?: number; statHistory?: HistoryPoint[];
}
interface AudienceWeightItem { code?: string; name?: string; weight?: number }
interface AudienceGenderPerAge { code?: string; male?: number; female?: number }
interface AudienceGeoCity { name?: string; weight?: number; country?: string; state?: string }
interface AudienceUser {
  userId?: string; username?: string; fullname?: string; url?: string;
  picture?: string; followers?: number; engagements?: number;
}
interface AudienceData {
  languages?: AudienceWeightItem[]; ethnicities?: AudienceWeightItem[];
  genders?: AudienceWeightItem[]; geoCountries?: AudienceWeightItem[];
  geoStates?: AudienceWeightItem[]; ages?: AudienceWeightItem[];
  interests?: AudienceWeightItem[]; brandAffinity?: AudienceWeightItem[];
  gendersPerAge?: AudienceGenderPerAge[]; geoCities?: AudienceGeoCity[];
  notableUsers?: AudienceUser[]; credibility?: number; notable?: number;
}
interface ModashCategory {
  categoryId?: string | number | null; categoryName?: string | null;
  subcategoryId?: string | number | null; subcategoryName?: string | null;
}
interface TagWeight { tag?: string; weight?: number }
interface BrandAffinityItem { id?: number | string; name?: string }
interface Page1ProfileData {
  profile?: {
    userId?: string; username?: string; fullname?: string; handle?: string;
    url?: string; picture?: string; followers?: number; engagements?: number; engagementRate?: number;
  };
  isPrivate?: boolean; isVerified?: boolean; accountType?: string;
  secUid?: string | null; city?: string | null; state?: string | null;
  country?: string | null; ageGroup?: string | null; gender?: string | null;
  language?: string | { code?: string; name?: string } | null;
  statsByContentType?: {
    all?: StatsByContentTypeEntry; reels?: StatsByContentTypeEntry;
    posts?: StatsByContentTypeEntry; videos?: StatsByContentTypeEntry;
    [key: string]: StatsByContentTypeEntry | undefined;
  };
  stats?: StatsBlock; recentPosts?: PostItem[]; popularPosts?: PostItem[];
  sponsoredPosts?: PostItem[]; postsCount?: number; avgLikes?: number;
  avgComments?: number; avgReelsPlays?: number; bio?: string;
  categories?: ModashCategory[]; hashtags?: TagWeight[]; mentions?: TagWeight[];
  brandAffinity?: BrandAffinityItem[]; audience?: AudienceData;
}
interface Page1Item { platform?: string; handle?: string; username?: string; data?: Page1ProfileData }
interface InfluencerDoc {
  _id?: string; influencerId?: string; email?: string; name?: string;
  countryId?: string; countryName?: string; languages?: NamedItem[];
  categories?: NamedItem[]; page1?: Page1Item[]; createdAt?: string; updatedAt?: string;
}
interface InfluencerResponse { influencer?: InfluencerDoc }
interface PaypalDetails { email?: string; username?: string }
interface BankDetails {
  accountHolder?: string; accountNumber?: string; ifsc?: string; swift?: string;
  bankName?: string; branch?: string; countryId?: string; countryName?: string;
}
interface PaymentDetailItem {
  _id?: string; influencerId?: string; label?: string; type?: number;
  isDefault?: boolean; paypal?: PaypalDetails; bank?: BankDetails;
  createdAt?: string; updatedAt?: string;
}
interface PaymentDetailsResponse { success?: boolean; count?: number; data?: PaymentDetailItem[] }
interface CampaignItem {
  _id?: string; id?: string; campaignId?: string; title?: string; name?: string;
  campaignName?: string; briefTitle?: string; brandName?: string; companyName?: string;
  clientName?: string; status?: string | number; platform?: string | string[];
  platforms?: string[]; socialPlatform?: string | string[];
  budget?: number; amount?: number; payout?: number; totalBudget?: number;
  createdAt?: string; startDate?: string; endDate?: string;
  description?: string; brief?: string; objective?: string;
  goals?: string[]; deliverables?: Array<Record<string, unknown>>;
  brand?: { name?: string };
}
interface GetCampaignsResponse {
  success?: boolean;
  data?: CampaignItem[] | {
    data?: CampaignItem[]; items?: CampaignItem[]; docs?: CampaignItem[];
    total?: number; totalItems?: number; totalCount?: number; count?: number;
    page?: number; totalPages?: number; pages?: number; limit?: number;
  };
  campaigns?: CampaignItem[]; items?: CampaignItem[]; docs?: CampaignItem[];
  results?: CampaignItem[]; total?: number; totalItems?: number; totalCount?: number;
  count?: number; page?: number; totalPages?: number; pages?: number; limit?: number;
}
interface CampaignMeta { page: number; totalPages: number; totalItems: number; limit: number }
interface NormalizedSocialProfile {
  provider: string; username?: string; fullname?: string; handle?: string;
  url?: string; picture?: string; followers?: number; engagements?: number;
  engagementRate?: number; isPrivate?: boolean; isVerified?: boolean;
  accountType?: string; city?: string | null; state?: string | null;
  country?: string | null; ageGroup?: string | null; gender?: string | null;
  language?: string; stats?: StatsBlock;
  statsByContentType?: Page1ProfileData["statsByContentType"];
  recentPosts?: PostItem[]; popularPosts?: PostItem[]; sponsoredPosts?: PostItem[];
  postsCount?: number; avgLikes?: number; avgComments?: number; avgReelsPlays?: number;
  bio?: string; categories?: ModashCategory[]; hashtags?: TagWeight[];
  mentions?: TagWeight[]; brandAffinity?: BrandAffinityItem[]; audience?: AudienceData;
}


/* -------------------------------------------------------------------------- */
/*                              Ratings Types                                 */
/* -------------------------------------------------------------------------- */
type RatingReviewType =
  | "brand_to_influencer"
  | "influencer_to_brand"
  | "brand_to_platform"
  | "influencer_to_platform";

type RatingReviewStatus = "pending" | "submitted" | "skipped" | "expired" | "revoked";
type RatingReviewRole = "brand" | "influencer" | "platform" | "admin";
type InfluencerRatingScope = "all" | "submitted_by_influencer" | "given_to_influencer" | "platform";

type RatingMiniEntity = {
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

type RatingReviewMetrics = {
  workQuality?: number;
  communication?: number;
  timeliness?: number;
  professionalism?: number;
  valueForMoney?: number;
  platformExperience?: number;
  supportExperience?: number;
  wouldRecommend?: number;
};

type RatingReviewAnswer = {
  questionKey?: string;
  questionLabel?: string;
  answerType?: string;
  value?: unknown;
  displayValue?: unknown;
  score?: number | null;
};

type RatingReviewSnapshot = {
  role?: RatingReviewRole;
  entityId?: string;
  name?: string;
  email?: string;
  handle?: string;
  image?: string;
};

type RatingReviewItem = {
  _id: string;
  reviewType: RatingReviewType;
  reviewerRole?: RatingReviewRole;
  revieweeRole?: RatingReviewRole;
  status: RatingReviewStatus;
  submittedVia?: string;
  rating?: number | null;
  noteStarRating?: number | null;
  reviewTitle?: string;
  reviewText?: string;
  privateFeedback?: string;
  tags?: string[];
  metrics?: RatingReviewMetrics;
  ratings?: RatingReviewMetrics;
  responses?: RatingReviewAnswer[];
  responseMap?: Record<string, RatingReviewAnswer>;
  firstSubmittedAt?: string;
  submittedAt?: string;
  createdAt?: string;
  campaign?: RatingMiniEntity | null;
  brand?: RatingMiniEntity | null;
  influencer?: RatingMiniEntity | null;
  platform?: RatingMiniEntity | null;
  reviewer?: RatingReviewSnapshot | null;
  reviewee?: RatingReviewSnapshot | null;
  campaignId?: RatingMiniEntity | string | null;
};

type RatingListResponse = {
  success?: boolean;
  data?: RatingReviewItem[];
  total?: number;
  page?: number;
  limit?: number;
  message?: string;
};

type RatingSubmittedAnswer = { question: string; answer: string; score?: number | null };

const RATING_REVIEW_TYPE_LABEL: Record<RatingReviewType, string> = {
  brand_to_influencer: "Brand → Influencer",
  influencer_to_brand: "Influencer → Brand",
  brand_to_platform: "Brand → Platform",
  influencer_to_platform: "Influencer → Platform",
};

const RATING_METRIC_LABELS: Array<[keyof RatingReviewMetrics, string]> = [
  ["workQuality", "Work Quality"],
  ["communication", "Communication"],
  ["timeliness", "Timeliness"],
  ["professionalism", "Professionalism"],
  ["valueForMoney", "Value for Money"],
  ["platformExperience", "Platform Experience"],
  ["supportExperience", "Support Experience"],
  ["wouldRecommend", "Would Recommend"],
];

const INFLUENCER_RATING_SCOPE_ITEMS: Array<{
  id: InfluencerRatingScope;
  label: string;
  hint: string;
  icon: typeof MessageSquareText;
}> = [
  {
    id: "all",
    label: "All",
    hint: "Every submitted rating",
    icon: MessageSquareText,
  },
  {
    id: "submitted_by_influencer",
    label: "Influencer to Brand",
    hint: "Ratings submitted by influencer",
    icon: Users,
  },
  {
    id: "given_to_influencer",
    label: "Brand to Influencer",
    hint: "Ratings given to influencer",
    icon: Building2,
  },
  {
    id: "platform",
    label: "Platform Feedback",
    hint: "Influencer feedback for CollabGlam",
    icon: Globe,
  },
];

function rrSafeNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function rrRound1(value: unknown): string {
  return rrSafeNumber(value).toFixed(1);
}

function rrNormalizeText(value = ""): string {
  return String(value).split("_").join(" ");
}

function rrFormatDate(value?: string | null): string {
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

function rrStringifyAnswer(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (Array.isArray(value)) {
    return value.map((item: unknown): string => rrStringifyAnswer(item)).join(", ");
  }
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function rrBuildQuery(params: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      q.set(key, String(value).trim());
    }
  });

  return q.toString();
}

function rrGetEntityName(value?: RatingMiniEntity | RatingReviewSnapshot | string | null, fallback = "—"): string {
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

function rrGetEntityImage(value?: RatingMiniEntity | RatingReviewSnapshot | null): string {
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

function rrGetInitials(name = "?"): string {
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

function rrGetReviewTypeLabel(type?: RatingReviewType | string): string {
  return RATING_REVIEW_TYPE_LABEL[type as RatingReviewType] || "Review";
}

function rrGetReviewer(review: RatingReviewItem): RatingMiniEntity | RatingReviewSnapshot | null {
  if (review.reviewer) return review.reviewer;
  if (review.reviewerRole === "brand") return review.brand || null;
  if (review.reviewerRole === "influencer") return review.influencer || null;
  return review.platform || null;
}

function rrGetReviewee(review: RatingReviewItem): RatingMiniEntity | RatingReviewSnapshot | null {
  if (review.reviewee) return review.reviewee;
  if (review.revieweeRole === "brand") return review.brand || null;
  if (review.revieweeRole === "influencer") return review.influencer || null;
  return review.platform || { name: "CollabGlam" };
}

function rrGetCampaignEntity(review: RatingReviewItem): RatingMiniEntity | null {
  return review.campaign || (typeof review.campaignId === "object" ? review.campaignId : null);
}

function rrGetCampaignName(review: RatingReviewItem): string {
  return rrGetEntityName(rrGetCampaignEntity(review), "Platform / No campaign");
}

function rrGetSubmittedAt(review: RatingReviewItem): string | undefined {
  return review.submittedAt || review.firstSubmittedAt || review.createdAt;
}

function rrGetSubmittedAnswers(review: RatingReviewItem): RatingSubmittedAnswer[] {
  const answers: RatingSubmittedAnswer[] = [];
  const seen = new Set<string>();

  const pushAnswer = (question: string, answer: unknown, score?: number | null) => {
    const label = question || "Question";
    const value = rrStringifyAnswer(answer);
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
        item.questionLabel || item.questionKey || rrNormalizeText(key),
        item.displayValue ?? item.value,
        item.score
      );
    });
  }

  if (!answers.length) {
    pushAnswer("Overall rating", review.rating || review.noteStarRating);
    pushAnswer("Review text", review.reviewText);
    pushAnswer("Private feedback", review.privateFeedback);
    pushAnswer("Tags submitted", review.tags?.length ? review.tags.map(rrNormalizeText).join(", ") : "");

    const metrics = review.metrics || review.ratings || {};
    RATING_METRIC_LABELS.forEach(([key, label]) => {
      if (rrSafeNumber(metrics[key]) > 0) {
        pushAnswer(label, `${rrSafeNumber(metrics[key]).toFixed(1)} / 5`);
      }
    });
  }

  return answers;
}

function rrAverageByType(rows: RatingReviewItem[], reviewType: RatingReviewType): string {
  const values = rows
    .filter((item) => item.reviewType === reviewType)
    .map((item) => rrSafeNumber(item.rating || item.noteStarRating))
    .filter((value) => value > 0);

  if (!values.length) return "—";

  return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
}

function rrGetScopeQuery(scope: InfluencerRatingScope): Record<string, string> {
  if (scope === "submitted_by_influencer") {
    return {
      reviewerRole: "influencer",
      reviewType: "influencer_to_brand",
    };
  }

  if (scope === "given_to_influencer") {
    return {
      revieweeRole: "influencer",
      reviewType: "brand_to_influencer",
    };
  }

  if (scope === "platform") {
    return {
      reviewerRole: "influencer",
      revieweeRole: "platform",
      reviewType: "influencer_to_platform",
    };
  }

  return {};
}

function RatingAvatar({ entity, role }: { entity?: RatingMiniEntity | RatingReviewSnapshot | null; role?: string }) {
  const name = rrGetEntityName(entity, "User");
  const image = rrGetEntityImage(entity);
  const Icon = role === "brand" ? Building2 : role === "influencer" ? Users : Globe;

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-black/[0.04] text-sm font-black text-[#1a1a1a]">
      {image ? (
        <img src={image} alt={name} className="h-full w-full object-cover" />
      ) : name && name !== "—" ? (
        rrGetInitials(name)
      ) : (
        <Icon size={18} />
      )}
    </div>
  );
}

function RatingEntitySmall({ entity, role }: { entity?: RatingMiniEntity | RatingReviewSnapshot | null; role?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <RatingAvatar entity={entity} role={role} />
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-[#1a1a1a]">{rrGetEntityName(entity, "—")}</p>
        <p className="mt-0.5 text-xs font-semibold capitalize text-black/45">{role || "—"}</p>
      </div>
    </div>
  );
}

function RatingCampaignCell({ review }: { review: RatingReviewItem }) {
  const campaign = rrGetCampaignEntity(review);
  const isPlatform = review.reviewType.includes("platform");

  return (
    <div className="min-w-[210px]">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-black/[0.04] text-black/45">
          {isPlatform ? <Globe size={16} /> : <Calendar size={16} />}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-[#1a1a1a]">
            {isPlatform ? "Platform Feedback" : rrGetEntityName(campaign, "No campaign")}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-black/45">
            {isPlatform ? "CollabGlam platform" : "Campaign review"}
          </p>
        </div>
      </div>
    </div>
  );
}

function RatingStars({ rating = 0 }: { rating?: number | null }) {
  const value = Math.max(0, Math.min(5, Math.round(rrSafeNumber(rating))));

  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={13}
          className={index < value ? "fill-amber-400 text-amber-400" : "text-black/20"}
        />
      ))}
    </span>
  );
}

function RatingPillMini({ rating }: { rating?: number | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-black text-amber-700">
      <RatingStars rating={rating} />
      {rrRound1(rating)}
    </span>
  );
}

function RatingBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "purple";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${toneClass}`}>
      {children}
    </span>
  );
}

function RatingStatusBadge({ status }: { status?: RatingReviewStatus | string }) {
  if (status === "submitted") {
    return (
      <RatingBadge tone="success">
        <CheckCircle2 size={12} /> Submitted
      </RatingBadge>
    );
  }

  return <RatingBadge>{status || "—"}</RatingBadge>;
}

function RatingTypeBadge({ type }: { type?: RatingReviewType | string }) {
  return <RatingBadge>{rrGetReviewTypeLabel(type)}</RatingBadge>;
}

function RatingAnswerPreview({ review }: { review: RatingReviewItem }) {
  const answers = rrGetSubmittedAnswers(review);
  const firstAnswer = answers[0];

  return (
    <div className="max-w-[440px]">
      <strong className="text-sm font-black text-[#1a1a1a]">
        {answers.length} answer{answers.length === 1 ? "" : "s"}
      </strong>
      {firstAnswer ? (
        <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-black/50">
          {firstAnswer.question}: {firstAnswer.answer}
        </p>
      ) : (
        <p className="mt-1 text-xs font-medium text-black/45">No answer preview available.</p>
      )}
    </div>
  );
}


/* -------------------------------------------------------------------------- */
/*                              Platform Theming                              */
/* -------------------------------------------------------------------------- */
interface PlatformTheme {
  label: string; gradient: string; accent: string;
  chipCls: string; softBg: string; softText: string; softBorder: string;
}

function getPlatformTheme(platform?: string): PlatformTheme {
  const k = String(platform || "").trim().toLowerCase();
  if (k === "instagram") return {
    label: "Instagram", accent: "#C13584",
    gradient: "linear-gradient(135deg,#F58529 0%,#DD2A7B 50%,#8134AF 100%)",
    chipCls: "bg-gradient-to-r from-orange-500 via-pink-600 to-purple-600 text-white",
    softBg: "bg-pink-50", softText: "text-pink-700", softBorder: "border-pink-200",
  };
  if (k === "youtube") return {
    label: "YouTube", accent: "#FF0000",
    gradient: "linear-gradient(135deg,#FF0000 0%,#CC0000 100%)",
    chipCls: "bg-red-600 text-white",
    softBg: "bg-red-50", softText: "text-red-700", softBorder: "border-red-200",
  };
  if (k === "tiktok") return {
    label: "TikTok", accent: "#EE1D52",
    gradient: "linear-gradient(135deg,#010101 0%,#69C9D0 50%,#EE1D52 100%)",
    chipCls: "bg-gradient-to-r from-slate-900 via-cyan-400 to-rose-500 text-white",
    softBg: "bg-rose-50", softText: "text-rose-700", softBorder: "border-rose-200",
  };
  return {
    label: k ? k[0].toUpperCase() + k.slice(1) : "Unknown", accent: "#6366F1",
    gradient: "linear-gradient(135deg,#6366F1 0%,#8B5CF6 100%)",
    chipCls: "bg-indigo-600 text-white",
    softBg: "bg-indigo-50", softText: "text-indigo-700", softBorder: "border-indigo-200",
  };
}

/* -------------------------------------------------------------------------- */
/*                                 Utilities                                  */
/* -------------------------------------------------------------------------- */
const CAMPAIGN_LIMIT = 10;
const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";
const fmtDateTime = (iso?: string | null) => iso ? new Date(iso).toLocaleString() : "—";
const fmtNum = (n?: number | null) => {
  if (n == null || Number.isNaN(n)) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${n}`;
};
const fmtCurrency = (n?: number | null) => {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
};
const fmtPercent = (n?: number | null) => {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(n * 100).toFixed(2)}%`;
};
const fmtWt = (v?: number) => {
  if (v == null || Number.isNaN(v)) return "—";
  const p = v <= 1 ? v * 100 : v;
  return `${p.toFixed(1)}%`;
};
const pctVal = (v?: number) => v == null ? 0 : (v <= 1 ? v * 100 : v);

function cx(...cls: Array<string | false | null | undefined>) { return cls.filter(Boolean).join(" ") }
function getInitials(n?: string | null) {
  return (n || "IN").split(" ").filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join("") || "IN";
}
function normPlatform(p?: string | null) { return String(p || "").trim().toLowerCase() }
function getLangLabel(v?: string | { code?: string; name?: string } | null) {
  if (!v) return "—";
  if (typeof v === "string") return v;
  return v.name || v.code || "—";
}
function getStatVal(d?: number, s?: StatWithCompared, f?: number) { return d ?? s?.value ?? f }
function getPostViews(p: PostItem) { return p.views ?? p.plays }
function truncate(v?: string, max = 120) {
  if (!v) return "—";
  return v.length <= max ? v : `${v.slice(0, max).trim()}…`;
}
function compactList(arr: Array<string | undefined | null>) { return arr.filter(Boolean).join(", ") || "—" }
function maskAcct(v?: string) {
  if (!v) return "—";
  if (v.length <= 4) return v;
  return `${"•".repeat(v.length - 4)}${v.slice(-4)}`;
}
function normalizeProfiles(page1?: Page1Item[]): NormalizedSocialProfile[] {
  return (page1 || []).map(item => {
    const d = item.data || {}, pr = d.profile || {};
    const all = d.statsByContentType?.all, reels = d.statsByContentType?.reels;
    return {
      provider: item.platform || "unknown",
      username: pr.username || item.username,
      fullname: pr.fullname,
      handle: pr.handle || item.handle,
      url: pr.url,
      picture: pr.picture,
      followers: getStatVal(undefined, d.stats?.followers, pr.followers),
      engagements: pr.engagements || all?.engagements,
      engagementRate: pr.engagementRate ?? all?.engagementRate ?? reels?.engagementRate,
      isPrivate: d.isPrivate,
      isVerified: d.isVerified,
      accountType: d.accountType,
      city: d.city,
      state: d.state,
      country: d.country,
      ageGroup: d.ageGroup,
      gender: d.gender,
      language: getLangLabel(d.language),
      stats: d.stats,
      statsByContentType: d.statsByContentType,
      recentPosts: d.recentPosts || [],
      popularPosts: d.popularPosts || [],
      sponsoredPosts: d.sponsoredPosts || [],
      postsCount: d.postsCount,
      avgLikes: getStatVal(d.avgLikes, d.stats?.avgLikes, all?.avgLikes),
      avgComments: getStatVal(d.avgComments, d.stats?.avgComments, all?.avgComments),
      avgReelsPlays: d.avgReelsPlays ?? reels?.avgReelsPlays,
      bio: d.bio,
      categories: d.categories || [],
      hashtags: d.hashtags || [],
      mentions: d.mentions || [],
      brandAffinity: d.brandAffinity || [],
      audience: d.audience,
    };
  });
}
function fmtDelta(v?: number) {
  if (!v || Number.isNaN(v) || v === 0) return null;
  return `${v > 0 ? "+" : ""}${(v * 100).toFixed(1)}%`;
}
function deltaTone(v?: number) {
  return !v || Number.isNaN(v) ? "text-slate-400" : v > 0 ? "text-emerald-500" : "text-rose-500";
}

function extractItems(r: GetCampaignsResponse | undefined | null): CampaignItem[] {
  if (!r) return [];
  const c = (() => {
    const d = r.data;
    return d && !Array.isArray(d) && typeof d === "object" ? d : r;
  })();
  for (const k of [c, (c as any).data, (c as any).campaigns, (c as any).items, (c as any).docs, (c as any).results]) {
    if (Array.isArray(k)) return k as CampaignItem[];
  }
  return [];
}
function extractMeta(r: GetCampaignsResponse | undefined | null, page: number, limit: number, len: number): CampaignMeta {
  const c = (() => {
    const d = r?.data;
    return d && !Array.isArray(d) && typeof d === "object" ? d : r;
  })() as Record<string, unknown> | null;

  const ti = Number(c?.totalItems ?? c?.totalCount ?? c?.total ?? c?.count ?? len);
  const tp = Number(c?.totalPages ?? c?.pages ?? Math.max(1, Math.ceil(ti / limit)));
  return {
    page: Number.isFinite(Number(c?.page)) && Number(c?.page) > 0 ? Number(c?.page) : page,
    totalPages: Number.isFinite(tp) && tp > 0 ? tp : 1,
    totalItems: Number.isFinite(ti) && ti >= 0 ? ti : len,
    limit: Number.isFinite(Number(c?.limit)) && Number(c?.limit) > 0 ? Number(c?.limit) : limit,
  };
}

const getCId = (c: CampaignItem, i: number) => c._id || c.id || c.campaignId || `c-${i}`;
const getCTitle = (c: CampaignItem) => c.title || c.campaignName || c.name || c.briefTitle || "Untitled";
const getCBrand = (c: CampaignItem) => c.brandName || c.companyName || c.clientName || c.brand?.name || "—";
const getCBudget = (c: CampaignItem) => c.budget ?? c.amount ?? c.payout ?? c.totalBudget;
function getCPlats(c: CampaignItem): string[] {
  const r = c.platform ?? c.platforms ?? c.socialPlatform;
  if (Array.isArray(r)) return r.filter(Boolean).map(String);
  if (typeof r === "string" && r.trim()) return r.split(",").map(s => s.trim()).filter(Boolean);
  return [];
}
const getCTimeline = (c: CampaignItem) =>
  (c.startDate || c.endDate) ? compactList([fmtDate(c.startDate), fmtDate(c.endDate)]) : fmtDate(c.createdAt);

const getStatusLabel = (s?: string | number) => {
  if (s == null || s === "") return "Unknown";
  if (typeof s === "number") return `${s}`;
  return s.replace(/[_-]+/g, " ").replace(/\b\w/g, l => l.toUpperCase());
};
function statusStyle(s?: string | number) {
  const n = String(s ?? "").toLowerCase();
  if (["active", "live", "approved", "completed"].includes(n)) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (["pending", "draft", "review", "in progress"].includes(n)) return "bg-amber-50 text-amber-700 border-amber-200";
  if (["cancelled", "rejected", "paused", "failed"].includes(n)) return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-50 text-slate-500 border-slate-200";
}

/* -------------------------------------------------------------------------- */
/*                              UI Primitives                                 */
/* -------------------------------------------------------------------------- */

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div
    className={cx(
      "rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-sm shadow-[0_10px_30px_rgba(15,23,42,0.04)]",
      className
    )}
  >
    {children}
  </div>
);

const Sect: React.FC<{
  title?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, children, className }) => (
  <Card className={cx("p-5 sm:p-6", className)}>
    {(title || action) && (
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          {title && <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-800">{title}</div>}
          {subtitle && <p className="mt-0.5 text-[11px] text-slate-400">{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    {children}
  </Card>
);

const KV: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-start gap-3 border-b border-slate-100 py-2.5 last:border-0">
    <span className="w-28 shrink-0 text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
    <span className="text-[13px] text-slate-700">{value ?? <span className="text-slate-300">—</span>}</span>
  </div>
);

const Chip: React.FC<{ platform?: string; size?: "xs" | "sm" }> = ({ platform, size = "sm" }) => {
  const t = getPlatformTheme(platform);
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full font-semibold",
        size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-[11px]",
        t.chipCls
      )}
    >
      {t.label}
    </span>
  );
};

const Copy: React.FC<{ value?: string | null }> = ({ value }) => {
  const [ok, setOk] = useState(false);
  if (!value) return <span className="text-slate-300">—</span>;

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value);
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
      className="group inline-flex items-center gap-1.5 text-[13px] text-indigo-600 hover:text-indigo-800"
    >
      <span className="border-b border-dashed border-indigo-200 group-hover:border-indigo-500">{value}</span>
      <span className={cx("text-[10px] font-bold", ok ? "text-emerald-500" : "text-slate-300 group-hover:text-indigo-400 cursor-pointer")}>
        {ok ? "✓" : "copy"}
      </span>
    </button>
  );
};

const Stat: React.FC<{
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  delta?: number;
  color: string;
  icon?: React.ReactNode;
}> = ({ label, value, sub, delta, color, icon }) => (
  <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/75 p-5 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-slate-300">
    <div className="absolute left-0 top-0 h-[3px] w-full rounded-t-2xl" style={{ background: color }} />
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
        <p className="mt-2 font-['Syne',sans-serif] text-[26px] font-bold leading-none tracking-tight text-slate-800">{value}</p>
        {sub && <p className="mt-1.5 text-[11px] text-slate-400">{sub}</p>}
        {(() => {
          const d = fmtDelta(delta);
          return d ? (
            <span className={cx("mt-1.5 flex items-center gap-0.5 text-[11px] font-semibold", deltaTone(delta))}>
              {(delta ?? 0) > 0 ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {d} vs prev
            </span>
          ) : null;
        })()}
      </div>
      {icon && <div className="shrink-0 rounded-xl p-2.5" style={{ background: `${color}15`, color }}>{icon}</div>}
    </div>
  </div>
);

const ABar: React.FC<{ label: string; pct: number; color: string }> = ({ label, pct, color }) => (
  <div className="flex items-center gap-3">
    <span className="w-24 shrink-0 truncate text-[12px] text-slate-600">{label}</span>
    <div className="flex-1 overflow-hidden rounded-full bg-slate-100" style={{ height: 5 }}>
      <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
    </div>
    <span className="w-10 text-right text-[11px] font-semibold text-slate-500">{pct.toFixed(1)}%</span>
  </div>
);

const PostCard: React.FC<{ post: PostItem; color: string }> = ({ post, color }) => {
  const media = post.image || post.thumbnail;
  return (
    <div className="flex overflow-hidden rounded-xl border border-slate-200/80 bg-white/70 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-slate-300">
      <div className="w-20 shrink-0 sm:w-24" style={{ background: `${color}12` }}>
        {media ? (
          <img src={media} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full min-h-[88px] items-center justify-center">
            <Globe className="h-5 w-5 text-slate-200" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
            {post.type || "post"}
          </span>
          <span className="text-[10px] text-slate-400">{fmtDate(post.created)}</span>
        </div>
        <p className="mt-1.5 text-[12px] font-medium leading-4 text-slate-700">{truncate(post.title || post.text, 90)}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1"><Heart className="h-3 w-3 text-rose-400" />{fmtNum(post.likes)}</span>
          <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3 text-violet-400" />{fmtNum(post.comments)}</span>
          <span className="flex items-center gap-1"><Eye className="h-3 w-3 text-sky-400" />{fmtNum(getPostViews(post))}</span>
          {post.url && (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-0.5 text-[11px] font-semibold"
              style={{ color }}
            >
              View <ArrowUpRight className="h-3 w-3" />
            </a>
          )}
        </div>
        {(post.hashtags?.length ?? 0) > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {post.hashtags!.slice(0, 3).map(h => (
              <span key={h} className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: `${color}15`, color }}>
                # {h}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Empty: React.FC<{ label: string; desc?: string }> = ({ label, desc }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/55 py-12 text-center">
    <p className="text-sm font-semibold text-slate-500">{label}</p>
    {desc && <p className="mt-1 text-xs text-slate-400">{desc}</p>}
  </div>
);

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */
export default function AdminInfluencerView() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("influencerId");

  const [data, setData] = useState<InfluencerDoc | null>(null);
  const [profiles, setProfiles] = useState<NormalizedSocialProfile[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetailItem[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [campaignMeta, setCampaignMeta] = useState<CampaignMeta>({ page: 1, totalPages: 1, totalItems: 0, limit: CAMPAIGN_LIMIT });
  const [campaignPage, setCampaignPage] = useState(1);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);

  const [ratingScope, setRatingScope] = useState<InfluencerRatingScope>("all");
  const [ratingPage, setRatingPage] = useState(1);
  const [ratingLimit, setRatingLimit] = useState(20);
  const [ratingRows, setRatingRows] = useState<RatingReviewItem[]>([]);
  const [ratingTotal, setRatingTotal] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [ratingStatsRows, setRatingStatsRows] = useState<RatingReviewItem[]>([]);
  const [ratingStatsTotal, setRatingStatsTotal] = useState(0);
  const [ratingStatsLoading, setRatingStatsLoading] = useState(false);
  const [selectedRatingReview, setSelectedRatingReview] = useState<RatingReviewItem | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Missing influencer id.");
      setLoading(false);
      return;
    }

    setLoading(true);
    get("/admin/influencer/getById", { id })
      .then((res: InfluencerResponse | InfluencerDoc) => {
        const doc = (res as InfluencerResponse)?.influencer ?? (res as InfluencerDoc);
        const np = normalizeProfiles(doc.page1);
        setData(doc);
        setProfiles(np);
        setSelectedPlatform(np[0]?.provider || "");
        setError(null);
      })
      .catch((e: any) => setError(e?.message ?? "Failed to load influencer."))
      .finally(() => setLoading(false));
  }, [id]);

  const influencerId = data?.influencerId || data?._id;

  useEffect(() => {
    if (!influencerId) return;
    setPaymentLoading(true);
    (post as any)("/payment-details/get-payment-details", { influencerId })
      .then((r: PaymentDetailsResponse) => setPaymentDetails(r?.data || []))
      .catch(() => setPaymentDetails([]))
      .finally(() => setPaymentLoading(false));
  }, [influencerId]);

  useEffect(() => {
    if (!influencerId) return;
    setCampaignLoading(true);
    setCampaignError(null);

    (post as any)("/admin/campaign/getByInfluencerId", {
      influencerId,
      page: campaignPage,
      limit: CAMPAIGN_LIMIT,
      search: "",
      sortBy: "createdAt",
      sortOrder: "desc",
      status: "all",
    })
      .then((res: GetCampaignsResponse) => {
        const items = extractItems(res);
        setCampaigns(items);
        setCampaignMeta(extractMeta(res, campaignPage, CAMPAIGN_LIMIT, items.length));
      })
      .catch((e: any) => {
        setCampaigns([]);
        setCampaignError(e?.message ?? "Failed to load campaigns.");
      })
      .finally(() => setCampaignLoading(false));
  }, [campaignPage, influencerId]);

  const loadRatings = useCallback(async () => {
    if (!influencerId) return;

    try {
      setRatingLoading(true);
      setRatingError(null);

      const query = rrBuildQuery({
        page: ratingPage,
        limit: ratingLimit,
        influencerId,
        status: "submitted",
        ...rrGetScopeQuery(ratingScope),
      });

      const payload = await get<RatingListResponse>(`/campaign-reviews/admin?${query}`);

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to load submitted ratings.");
      }

      const rows = Array.isArray(payload?.data) ? payload.data : [];
      setRatingRows(rows);
      setRatingTotal(payload?.total ?? rows.length);
    } catch (err: any) {
      setRatingError(err?.response?.data?.message || err?.message || "Failed to load submitted ratings.");
      setRatingRows([]);
      setRatingTotal(0);
    } finally {
      setRatingLoading(false);
    }
  }, [influencerId, ratingLimit, ratingPage, ratingScope]);

  const loadRatingStats = useCallback(async () => {
    if (!influencerId) return;

    try {
      setRatingStatsLoading(true);

      const query = rrBuildQuery({
        page: 1,
        limit: 500,
        influencerId,
        status: "submitted",
      });

      const payload = await get<RatingListResponse>(`/campaign-reviews/admin?${query}`);
      const rows = Array.isArray(payload?.data) ? payload.data : [];

      setRatingStatsRows(rows);
      setRatingStatsTotal(payload?.total ?? rows.length);
    } catch {
      setRatingStatsRows([]);
      setRatingStatsTotal(0);
    } finally {
      setRatingStatsLoading(false);
    }
  }, [influencerId]);

  useEffect(() => {
    void loadRatings();
  }, [loadRatings]);

  useEffect(() => {
    void loadRatingStats();
  }, [loadRatingStats]);


  const platformOptions = useMemo(() => {
    const seen = new Set<string>();
    return profiles.filter(p => {
      const k = normPlatform(p.provider);
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [profiles]);

  const selectedProfile = useMemo(
    () => profiles.find(p => normPlatform(p.provider) === normPlatform(selectedPlatform)) || profiles[0] || null,
    [profiles, selectedPlatform]
  );

  useEffect(() => {
    if (!selectedPlatform && platformOptions[0]?.provider) {
      setSelectedPlatform(platformOptions[0].provider);
      return;
    }
    if (!platformOptions.some(p => normPlatform(p.provider) === normPlatform(selectedPlatform)) && platformOptions[0]) {
      setSelectedPlatform(platformOptions[0].provider);
    }
  }, [platformOptions, selectedPlatform]);

  const theme = useMemo(() => getPlatformTheme(selectedProfile?.provider), [selectedProfile?.provider]);

  const campaignColumns = useMemo<AdminTableColumn<CampaignItem>[]>(() => [
    {
      id: "campaign",
      header: "Campaign",
      widthClassName: "min-w-[200px]",
      render: row => (
        <div>
          <p className="text-[13px] font-semibold text-slate-800">{getCTitle(row)}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">{getCBrand(row)}</p>
        </div>
      ),
    },
    {
      id: "platform",
      header: "Platform",
      widthClassName: "min-w-[120px]",
      render: row => {
        const ps = getCPlats(row);
        return ps.length ? (
          <div className="flex flex-wrap gap-1">{ps.map(p => <Chip key={p} platform={p} size="xs" />)}</div>
        ) : (
          <span className="text-[13px] text-slate-300">—</span>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      widthClassName: "min-w-[100px]",
      render: row => (
        <span className={cx("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", statusStyle(row.status))}>
          {getStatusLabel(row.status)}
        </span>
      ),
    },
    {
      id: "timeline",
      header: "Timeline",
      widthClassName: "min-w-[140px]",
      render: row => (
        <div>
          <p className="text-[12px] text-slate-600">{getCTimeline(row)}</p>
          <p className="text-[10px] text-slate-400">Created {fmtDate(row.createdAt)}</p>
        </div>
      ),
    },
    {
      id: "budget",
      header: "Budget",
      align: "right",
      widthClassName: "min-w-[100px]",
      render: row => (
        <span className="font-['Syne',sans-serif] text-[14px] font-bold text-slate-800">
          {fmtCurrency(getCBudget(row))}
        </span>
      ),
    },
  ], []);


  const ratingTotalPages = Math.max(1, Math.ceil(Math.max(ratingTotal, ratingRows.length) / ratingLimit));
  const influencerToBrandAverage = rrAverageByType(ratingStatsRows, "influencer_to_brand");
  const brandToInfluencerAverage = rrAverageByType(ratingStatsRows, "brand_to_influencer");
  const influencerToBrandCount = ratingStatsRows.filter((item) => item.reviewType === "influencer_to_brand").length;
  const brandToInfluencerCount = ratingStatsRows.filter((item) => item.reviewType === "brand_to_influencer").length;
  const influencerPlatformCount = ratingStatsRows.filter((item) => item.reviewType === "influencer_to_platform").length;
  const activeRatingScope = INFLUENCER_RATING_SCOPE_ITEMS.find((item) => item.id === ratingScope) || INFLUENCER_RATING_SCOPE_ITEMS[0];

  const ratingScopeCounts: Record<InfluencerRatingScope, number> = {
    all: ratingStatsTotal || ratingStatsRows.length,
    submitted_by_influencer: influencerToBrandCount,
    given_to_influencer: brandToInfluencerCount,
    platform: influencerPlatformCount,
  };

  const latestRatingSubmittedAt =
    ratingStatsRows
      .map((item) => rrGetSubmittedAt(item))
      .filter((value): value is string => Boolean(value))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || null;

  const ratingColumns = useMemo<AdminTableColumn<RatingReviewItem>[]>(() => [
    {
      id: "campaign",
      header: "Campaign",
      widthClassName: "min-w-[210px]",
      render: row => <RatingCampaignCell review={row} />,
    },
    {
      id: "reviewer",
      header: "Submitted By",
      widthClassName: "min-w-[190px]",
      render: row => <RatingEntitySmall entity={rrGetReviewer(row)} role={row.reviewerRole} />,
    },
    {
      id: "reviewee",
      header: "Submitted For",
      widthClassName: "min-w-[190px]",
      render: row => <RatingEntitySmall entity={rrGetReviewee(row)} role={row.revieweeRole} />,
    },
    {
      id: "type",
      header: "Type",
      widthClassName: "min-w-[160px]",
      render: row => <RatingTypeBadge type={row.reviewType} />,
    },
    {
      id: "rating",
      header: "Rating",
      align: "center",
      widthClassName: "min-w-[120px]",
      render: row => <RatingPillMini rating={row.rating || row.noteStarRating} />,
    },
    {
      id: "answers",
      header: "Answers",
      widthClassName: "min-w-[300px]",
      render: row => <RatingAnswerPreview review={row} />,
    },
    {
      id: "submitted",
      header: "Submitted",
      widthClassName: "min-w-[150px]",
      render: row => (
        <span className="text-[13px] font-semibold text-slate-500">
          {rrFormatDate(rrGetSubmittedAt(row))}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      widthClassName: "min-w-[120px]",
      render: row => <RatingStatusBadge status={row.status} />,
    },
  ], []);

  const fontImport = (
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Outfit:wght@400;500;600&display=swap');*{font-family:'Outfit',sans-serif}.syne{font-family:'Syne',sans-serif}`}</style>
  );

  const pageBg = "linear-gradient(180deg,#F8FAFC 0%,#F4F7FB 52%,#EEF2FF 100%)";

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: pageBg, fontFamily: "'Outfit',sans-serif" }}>
        {fontImport}
        <div className="w-full max-w-full space-y-4 px-4 py-8 sm:px-6">
          <Skeleton className="h-7 w-32 rounded-xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: pageBg, fontFamily: "'Outfit',sans-serif" }}>
        {fontImport}
        <div className="w-full max-w-full px-4 py-8 sm:px-6">
          <button onClick={() => router.back()} className="mb-5 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <div className="rounded-2xl border border-rose-200 bg-white/80 p-5 text-rose-600 shadow-sm backdrop-blur-sm">{error}</div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Outfit',sans-serif" }}>
      {fontImport}

      <Tabs defaultValue="overview" className="space-y-0">
        <div className="z-40">
          <div
            className="relative overflow-hidden border-b border-white/10"
            style={{ background: "linear-gradient(145deg,#0B1220 0%,#111827 45%,#172554 100%)" }}
          >
            <div
              className="pointer-events-none absolute inset-0 transition-all duration-700 ease-in-out"
              style={{ background: `radial-gradient(ellipse 55% 90% at 90% -10%, ${theme.accent}25 0%, transparent 65%)` }}
            />
            <div
              className="pointer-events-none absolute inset-0 transition-all duration-700 ease-in-out"
              style={{ background: `radial-gradient(ellipse 35% 50% at -5% 100%, ${theme.accent}14 0%, transparent 60%)` }}
            />

            <div className="relative mx-auto max-w-full px-4 py-5 sm:px-6 sm:py-6">
              <button
                onClick={() => router.back()}
                className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] font-medium text-white/60 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white/90"
              >
                <ChevronLeft className="h-4 w-4" /> Back to Influencers
              </button>

              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="relative shrink-0 self-start">
                    {selectedProfile?.picture ? (
                      <img
                        src={selectedProfile.picture}
                        alt={data.name || "Influencer"}
                        className="h-[72px] w-[72px] rounded-2xl object-cover shadow-lg sm:h-20 sm:w-20"
                        style={{ boxShadow: `0 0 0 3px ${theme.accent}35` }}
                      />
                    ) : (
                      <div
                        className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl text-xl font-black text-white shadow-lg sm:h-20 sm:w-20"
                        style={{ background: theme.gradient }}
                      >
                        {getInitials(data.name || data.email)}
                      </div>
                    )}
                    {selectedProfile?.isVerified && (
                      <div className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full shadow-md" style={{ background: theme.accent }}>
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="syne text-2xl font-bold text-white sm:text-3xl">{data.name || "Unnamed Influencer"}</h1>
                      {selectedProfile?.isVerified && (
                        <span className="rounded-full border border-white/15 bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold text-white/65">
                          ✓ Verified
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {platformOptions.map((p, i) => {
                        const pt = getPlatformTheme(p.provider);
                        const isActive = normPlatform(p.provider) === normPlatform(selectedPlatform);
                        const isPrimary = (p as any)?.isPrimary || i === 0;

                        return (
                          <button
                            key={`${p.provider}-${i}`}
                            onClick={() => setSelectedPlatform(p.provider)}
                            className={cx(
                              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold transition-all duration-200",
                              isActive
                                ? `${pt.chipCls} shadow-sm`
                                : "border border-white/15 bg-white/[0.03] text-white/55 hover:border-white/30 hover:bg-white/[0.06] hover:text-white/85"
                            )}
                          >
                            <span>
                              {pt.label}
                              {p.username ? ` · ${p.username}` : p.handle ? ` · ${p.handle}` : ""}
                            </span>

                            {isPrimary && (
                              <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                                Primary
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                      {[
                        { icon: <Mail className="h-3 w-3" />, val: data.email },
                        { icon: <MapPin className="h-3 w-3" />, val: data.countryName },
                        { icon: <Calendar className="h-3 w-3" />, val: `Joined ${fmtDate(data.createdAt)}` },
                      ].map(({ icon, val }) => val ? (
                        <span key={String(val)} className="flex items-center gap-1.5 text-[11px] text-white/45">
                          {icon}{val}
                        </span>
                      ) : null)}
                    </div>

                    {selectedProfile?.bio && (
                      <p className="mt-3 max-w-xl text-[12px] leading-5 text-white/45">{truncate(selectedProfile.bio, 160)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200/60 bg-white/78 backdrop-blur-xl">
            <div className="mx-auto max-w-full px-4 py-2 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
                <TabsList className="flex h-auto flex-wrap gap-1 bg-transparent p-0">
                  {["overview", "demographics", "ratings", "campaigns", "payment details"].map(v => (
                    <TabsTrigger
                      key={v}
                      value={v}
                      className="rounded-lg px-3 py-1.5 text-[16px] font-medium capitalize text-slate-400 transition data-[state=active]:bg-slate-900 data-[state=active]:text-white cursor-pointer"
                    >
                      {v}
                    </TabsTrigger>
                  ))}

                </TabsList>

                <div className="flex items-center gap-2">
                  {selectedProfile?.url ? (
                    <a
                      href={selectedProfile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 flex items-right gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-blue-700 transition hover:text-slate-700"
                    >
                      Open <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                  <div
                    className="h-2 w-2 rounded-full shadow-sm transition-all duration-500"
                    style={{ background: theme.accent }}
                  />
                  <span className="text-[15px] font-medium text-slate-400">
                    {theme.label}{selectedProfile?.username ? ` · ${selectedProfile.username}` : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-0 w-full max-w-full px-4 pb-8 pt-6 sm:px-6">
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat
                label="Followers"
                value={fmtNum(selectedProfile?.followers)}
                delta={selectedProfile?.stats?.followers?.compared}
                color={theme.accent}
                icon={<Users className="h-4 w-4" />}
              />
              <Stat
                label="Engagement Rate"
                value={fmtPercent(selectedProfile?.engagementRate)}
                sub={theme.label}
                color={theme.accent}
                icon={<TrendingUp className="h-4 w-4" />}
              />
              <Stat
                label="Campaigns"
                value={fmtNum(campaignMeta.totalItems)}
                sub="All time"
                color={theme.accent}
                icon={<BriefcaseBusiness className="h-4 w-4" />}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Sect title={<><Info className="h-4 w-4" style={{ color: theme.accent }} />Influencer Onboarding Info</>}>
                <KV label="Name" value={data.name || "—"} />
                <KV label="Email" value={<Copy value={data.email} />} />
                <KV label="Country" value={data.countryName || "—"} />
                <KV label="Languages" value={compactList(data.languages?.map(l => l.name || "") || [])} />
                <KV label="Categories" value={compactList(data.categories?.map(c => c.name || "") || [])} />
                <KV label="Created" value={fmtDateTime(data.createdAt)} />
              </Sect>

              <Sect title={<><Sparkles className="h-4 w-4" style={{ color: theme.accent }} />{theme.label} Snapshot</>}>
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <Stat label="Posts" value={fmtNum(selectedProfile?.postsCount)} color={theme.accent} icon={<Hash className="h-4 w-4" />} />
                  <Stat label="Avg Plays" value={fmtNum(selectedProfile?.avgReelsPlays)} color={theme.accent} icon={<PlayCircle className="h-4 w-4" />} />
                </div>
                <KV label="Handle" value={selectedProfile?.username ? `${selectedProfile.username}` : selectedProfile?.handle || "—"} />
                <KV label="Account Type" value={selectedProfile?.accountType || "—"} />
                <KV label="Location" value={compactList([selectedProfile?.city, selectedProfile?.state, selectedProfile?.country])} />
                <KV label="Avg Comments" value={fmtNum(selectedProfile?.avgComments)} />
                <KV label="Paid Post Perf." value={fmtWt(selectedProfile?.stats?.paidPostPerformance)} />
              </Sect>
            </div>
          </TabsContent>

          <TabsContent value="demographics" className="space-y-4">
            {selectedProfile ? (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat
                    label="Followers"
                    value={fmtNum(selectedProfile.followers)}
                    delta={selectedProfile.stats?.followers?.compared}
                    color={theme.accent}
                    icon={<Users className="h-4 w-4" />}
                  />
                  <Stat
                    label="Avg. Like"
                    value={fmtNum(selectedProfile.engagements)}
                    color={theme.accent}
                    icon={<Zap className="h-4 w-4" />}
                  />
                  <Stat
                    label="Avg Comments"
                    value={fmtNum(selectedProfile.avgComments)}
                    delta={selectedProfile.stats?.avgComments?.compared}
                    color={theme.accent}
                    icon={<MessageCircle className="h-4 w-4" />}
                  />
                  <Stat
                    label="Paid Perf."
                    value={fmtWt(selectedProfile.stats?.paidPostPerformance)}
                    color={theme.accent}
                    icon={<BarChart3 className="h-4 w-4" />}
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-1">
                  <Sect
                    title={<><Globe className="h-4 w-4" style={{ color: theme.accent }} />{theme.label} Profile</>}
                    action={selectedProfile.url ? (
                      <a
                        href={selectedProfile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[12px] font-semibold"
                        style={{ color: theme.accent }}
                      >
                        Open <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  >
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <KV label="Username" value={selectedProfile.username ? `@${selectedProfile.username}` : "—"} />
                        <KV label="Full Name" value={selectedProfile.fullname || "—"} />
                        <KV label="Handle" value={selectedProfile.handle || "—"} />
                        <KV label="Language" value={selectedProfile.language || "—"} />
                        <KV label="Gender" value={selectedProfile.gender || "—"} />
                        <KV label="Age Group" value={selectedProfile.ageGroup || "—"} />
                      </div>

                      <div>
                        <KV label="Location" value={compactList([selectedProfile.city, selectedProfile.state, selectedProfile.country])} />
                        <KV label="Acct Type" value={selectedProfile.accountType || "—"} />
                        <KV label="Private" value={selectedProfile.isPrivate ? "Yes" : "No"} />
                        <KV label="Verified" value={selectedProfile.isVerified ? "Yes" : "No"} />
                        <KV label="Posts" value={fmtNum(selectedProfile.postsCount)} />
                        <KV label="Avg Plays" value={fmtNum(selectedProfile.avgReelsPlays)} />
                      </div>
                    </div>
                  </Sect>
                </div>

                {selectedProfile.audience && (
                  <>
                    <Sect title={<><Users className="h-4 w-4" style={{ color: theme.accent }} />Audience Overview</>}>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <Stat
                          label="Credibility"
                          value={fmtWt(selectedProfile.audience.credibility)}
                          sub="Real audience est."
                          color={theme.accent}
                          icon={<Shield className="h-4 w-4" />}
                        />
                        <Stat
                          label="Notable"
                          value={fmtWt(selectedProfile.audience.notable)}
                          sub="Known accounts"
                          color={theme.accent}
                          icon={<Star className="h-4 w-4" />}
                        />
                        <Stat
                          label="Top Country"
                          value={selectedProfile.audience.geoCountries?.[0]?.name || "—"}
                          sub={fmtWt(selectedProfile.audience.geoCountries?.[0]?.weight)}
                          color={theme.accent}
                          icon={<Globe className="h-4 w-4" />}
                        />
                        <Stat
                          label="Top Age"
                          value={selectedProfile.audience.ages?.[0]?.code || "—"}
                          sub={fmtWt(selectedProfile.audience.ages?.[0]?.weight)}
                          color={theme.accent}
                          icon={<Users className="h-4 w-4" />}
                        />
                      </div>
                    </Sect>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        {
                          title: "Age Distribution",
                          items: selectedProfile.audience.ages,
                          getLabel: (item: AudienceWeightItem) => item.code || "—",
                        },
                        {
                          title: "Gender Split",
                          items: selectedProfile.audience.genders,
                          getLabel: (item: AudienceWeightItem) => item.name || item.code || "—",
                        },
                        {
                          title: "Languages",
                          items: selectedProfile.audience.languages,
                          getLabel: (item: AudienceWeightItem) => item.name || item.code || "—",
                        },
                        {
                          title: "Countries",
                          items: selectedProfile.audience.geoCountries,
                          getLabel: (item: AudienceWeightItem) => item.name || item.code || "—",
                        },
                        {
                          title: "Interests",
                          items: selectedProfile.audience.interests,
                          getLabel: (item: AudienceWeightItem) => item.name || item.code || "—",
                        },
                        {
                          title: "States",
                          items: selectedProfile.audience.geoStates,
                          getLabel: (item: AudienceWeightItem) => item.name || item.code || "—",
                        },
                      ].map(({ title, items, getLabel }) => (
                        <Sect key={title} title={title}>
                          {items?.length ? (
                            <div className="space-y-2.5">
                              {items.slice(0, 8).map((item, i) => (
                                <ABar
                                  key={`${title}-${item.code || item.name || i}`}
                                  label={getLabel(item)}
                                  pct={pctVal(item.weight)}
                                  color={theme.accent}
                                />
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400">No data available.</p>
                          )}
                        </Sect>
                      ))}
                    </div>
                  </>
                )}

                {Object.keys(selectedProfile.statsByContentType || {}).length > 0 && (
                  <Sect title={<><Layers3 className="h-4 w-4" style={{ color: theme.accent }} />Content Performance by Type</>}>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {Object.entries(selectedProfile.statsByContentType || {}).filter(([, v]) => !!v).map(([key, value]) => (
                        <div key={key} className="rounded-xl border border-slate-200/80 bg-white/70 p-4">
                          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: theme.accent }}>{key}</p>
                          {[
                            { l: "Eng. Rate", v: fmtPercent(value?.engagementRate) },
                            { l: "Avg Likes", v: fmtNum(value?.avgLikes) },
                            { l: "Avg Comments", v: fmtNum(value?.avgComments) },
                            { l: "Avg Shares", v: fmtNum(value?.avgShares) },
                            { l: "Plays/Views", v: fmtNum(value?.avgReelsPlays ?? value?.avgViews) },
                          ].map(row => (
                            <div key={row.l} className="flex items-center justify-between border-b border-slate-100 py-1.5 text-[12px] last:border-0">
                              <span className="text-slate-400">{row.l}</span>
                              <span className="font-semibold text-slate-700">{row.v}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </Sect>
                )}

                <Sect title={<><Tag className="h-4 w-4" style={{ color: theme.accent }} />Topics & Affinity</>}>
                  <div className="space-y-4">
                    {[
                      {
                        l: "Categories",
                        items: selectedProfile.categories?.slice(0, 10).map((c, i) => ({
                          k: i,
                          t: [c.categoryName, c.subcategoryName].filter(Boolean).join(" · "),
                        })),
                      },
                      {
                        l: "Hashtags",
                        items: selectedProfile.hashtags?.slice(0, 14).map((h, i) => ({ k: i, t: `#${h.tag}` })),
                      },
                      {
                        l: "Mentions",
                        items: selectedProfile.mentions?.slice(0, 10).map((m, i) => ({ k: i, t: `@${m.tag}` })),
                      },
                      {
                        l: "Brand Affinity",
                        items: selectedProfile.brandAffinity?.slice(0, 10).map((b, i) => ({ k: i, t: b.name || "" })),
                      },
                    ].map(({ l, items }, gi) => (
                      <div key={l}>
                        {gi > 0 && <Separator className="mb-4 bg-slate-100" />}
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">{l}</p>
                        {items?.length ? (
                          <div className="flex flex-wrap gap-1.5">
                            {items.map(item => (
                              <span
                                key={item.k}
                                className="rounded-full border px-2.5 py-0.5 text-[11px] text-slate-600"
                                style={{ borderColor: `${theme.accent}25`, background: `${theme.accent}08` }}
                              >
                                {item.t}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">None</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Sect>

                {[
                  { key: "recent", label: "Recent Posts", posts: selectedProfile.recentPosts, lim: 4 },
                  { key: "popular", label: "Top Posts", posts: selectedProfile.popularPosts, lim: 4 },
                  { key: "sponsored", label: "Sponsored Posts", posts: selectedProfile.sponsoredPosts, lim: 4 },
                ].map(({ key, label, posts, lim }) => (
                  <Sect key={key} title={<><Hash className="h-4 w-4" style={{ color: theme.accent }} />{theme.label} — {label}</>}>
                    {posts?.length ? (
                      <div className="space-y-2">
                        {posts.slice(0, lim).map((p, i) => (
                          <div key={`${p.id || i}-${key}`} className="rounded-xl [&_*]:leading-tight">
                            <PostCard post={p} color={theme.accent} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Empty label={`No ${label.toLowerCase()}`} desc="Not available for this platform." />
                    )}
                  </Sect>
                ))}
              </>
            ) : (
              <Empty label="No platform profile" desc="Select a connected platform above." />
            )}
          </TabsContent>


          <TabsContent value="ratings" className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ background: `${theme.accent}12`, color: theme.accent }}
                    >
                      <Star className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        Ratings
                      </p>
                      <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900">
                        All Submitted Ratings
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="grid min-w-[280px] gap-2 sm:grid-cols-2">
                  {[
                    {
                      label: "Avg. Influencer → Brand",
                      value: ratingStatsLoading ? "…" : influencerToBrandAverage,
                      hint: `${influencerToBrandCount} rows`,
                      icon: Users,
                    },
                    {
                      label: "Avg. Brand → Influencer",
                      value: ratingStatsLoading ? "…" : brandToInfluencerAverage,
                      hint: `${brandToInfluencerCount} rows`,
                      icon: Building2,
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

            {ratingError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {ratingError}
              </div>
            ) : null}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[15px] font-bold text-slate-900">{activeRatingScope.label}</h3>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <RatingBadge>{ratingTotal || ratingRows.length} rows</RatingBadge>

                  <div className="relative">
                    <select
                      value={ratingScope}
                      onChange={(event) => {
                        setRatingScope(event.target.value as InfluencerRatingScope);
                        setRatingPage(1);
                      }}
                      className="h-10 min-w-[230px] appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-[13px] font-bold text-slate-700 outline-none transition hover:bg-slate-50"
                    >
                      {INFLUENCER_RATING_SCOPE_ITEMS.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label} ({ratingStatsLoading ? "…" : ratingScopeCounts[item.id]})
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

              <AdminTable<RatingReviewItem>
                data={ratingRows}
                columns={ratingColumns}
                rowKey={(row) => row._id}
                loading={ratingLoading}
                loadingRows={8}
                emptyTitle="No submitted ratings found"
                emptyDescription="Submitted ratings connected to this influencer will appear here."
                onRowClick={(row) => setSelectedRatingReview(row)}
                actions={{
                  header: "Action",
                  render: (row) => (
                    <button
                      type="button"
                      onClick={() => setSelectedRatingReview(row)}
                      className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Eye size={14} />
                      View
                    </button>
                  ),
                }}
                pagination={{
                  page: ratingPage,
                  totalPages: ratingTotalPages,
                  totalItems: ratingTotal || ratingRows.length,
                  limit: ratingLimit,
                  onPageChange: setRatingPage,
                  onLimitChange: (value) => {
                    setRatingLimit(value);
                    setRatingPage(1);
                  },
                  rowOptions: [10, 20, 50, 100],
                  loading: ratingLoading,
                }}
                containerClassName="rounded-none border-0 shadow-none"
              />
            </section>

            {selectedRatingReview ? createPortal(
              <div
                className="fixed inset-0 flex justify-end bg-slate-950/30 backdrop-blur-[2px]"
                style={{
                  zIndex: 2147483647,
                  position: "fixed",
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                  width: "100vw",
                  height: "100dvh",
                }}
                onClick={() => setSelectedRatingReview(null)}
              >
                <aside
                  className="relative flex h-full w-full max-w-[800px] flex-col overflow-hidden bg-white shadow-2xl"
                  style={{ zIndex: 2147483647, height: "100dvh" }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="border-b border-slate-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="mb-3 text-xl font-bold text-slate-900">
                          {selectedRatingReview.reviewTitle || rrGetReviewTypeLabel(selectedRatingReview.reviewType)}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <RatingPillMini rating={selectedRatingReview.rating || selectedRatingReview.noteStarRating} />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedRatingReview(null)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto bg-slate-50/70 p-5">
                    <div className="grid gap-4">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <RatingEntitySmall entity={rrGetReviewer(selectedRatingReview)} role={selectedRatingReview.reviewerRole} />
                          <span
                            className="flex h-9 w-9 items-center justify-center rounded-full"
                            style={{ background: `${theme.accent}12`, color: theme.accent }}
                          >
                            <ArrowRight size={17} />
                          </span>
                          <RatingEntitySmall entity={rrGetReviewee(selectedRatingReview)} role={selectedRatingReview.revieweeRole} />
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-sm font-bold text-slate-900">Campaign</p>
                          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{rrGetCampaignName(selectedRatingReview)}</p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-sm font-bold text-slate-900">Submitted</p>
                          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                            {rrFormatDate(rrGetSubmittedAt(selectedRatingReview))}
                          </p>
                        </div>
                      </div>

                      {selectedRatingReview.reviewText ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-sm font-bold text-slate-900">Review Note</p>
                          <p className="mt-2 whitespace-pre-wrap break-words text-sm font-medium leading-6 text-slate-500">
                            {selectedRatingReview.reviewText}
                          </p>
                        </div>
                      ) : null}

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-base font-bold text-slate-900">Submitted Questions & Answers</h4>
                          <RatingBadge>{rrGetSubmittedAnswers(selectedRatingReview).length} answers</RatingBadge>
                        </div>

                        <div className="mt-4 grid gap-3">
                          {rrGetSubmittedAnswers(selectedRatingReview).length ? (
                            rrGetSubmittedAnswers(selectedRatingReview).map((item, index) => (
                              <div key={`${item.question}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                <div className="flex items-start gap-3">
                                  <span
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                                    style={{ background: `${theme.accent}12`, color: theme.accent }}
                                  >
                                    {index + 1}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-slate-900">{item.question}</p>
                                    <p className="mt-2 whitespace-pre-wrap break-words text-sm font-medium leading-6 text-slate-500">
                                      {item.answer}
                                    </p>
                                    {item.score ? (
                                      <div className="mt-3">
                                        <RatingBadge>Score: {item.score}/5</RatingBadge>
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

                      {Array.isArray(selectedRatingReview.tags) && selectedRatingReview.tags.length ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-sm font-bold text-slate-900">Tags</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {selectedRatingReview.tags.map((tag) => (
                              <RatingBadge key={tag}>{rrNormalizeText(tag)}</RatingBadge>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </aside>
              </div>,
              document.body
            ) : null}
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            <Sect title={<><BriefcaseBusiness className="h-4 w-4" style={{ color: theme.accent }} />Campaign History</>}>
              {campaignLoading ? (
                <div className="rounded-xl border border-slate-200/80 bg-white/70 p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </div>
                </div>
              ) : campaignError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-6 py-10 text-center">
                  <p className="text-sm font-semibold text-rose-600">{campaignError}</p>
                </div>
              ) : campaigns.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/70">
                  <AdminTable<CampaignItem>
                    data={campaigns}
                    columns={campaignColumns}
                    rowKey={getCId}
                    loading={campaignLoading}
                    error={campaignError}
                    emptyTitle="No campaigns"
                    emptyDescription="No campaigns found for this influencer."
                    expandable={{
                      expandedRowId: expandedCampaignId,
                      onToggle: rowId => setExpandedCampaignId(cur => cur === rowId ? null : rowId),
                      canExpand: row => Boolean(row.description || row.brief || row.objective || row.goals?.length || row.deliverables?.length),
                      renderExpandedRow: row => (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border border-slate-200/80 bg-white/70 p-4">
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Overview</p>
                            <p className="text-[12px] text-slate-600"><strong className="text-slate-700">Objective:</strong> {row.objective || "—"}</p>
                            <p className="mt-1.5 text-[12px] text-slate-600"><strong className="text-slate-700">Description:</strong> {row.description || row.brief || "—"}</p>
                          </div>
                          <div className="rounded-xl border border-slate-200/80 bg-white/70 p-4">
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Deliverables</p>
                            <p className="text-[12px] text-slate-600"><strong className="text-slate-700">Goals:</strong> {row.goals?.length ? row.goals.join(", ") : "—"}</p>
                            <p className="mt-1.5 text-[12px] text-slate-600"><strong className="text-slate-700">Deliverables:</strong> {row.deliverables?.length ? `${row.deliverables.length} item(s)` : "—"}</p>
                          </div>
                        </div>
                      ),
                    }}
                    pagination={{
                      page: campaignMeta.page,
                      totalPages: campaignMeta.totalPages,
                      totalItems: campaignMeta.totalItems,
                      limit: campaignMeta.limit,
                      onPageChange: p => setCampaignPage(p),
                      showRowsSelector: false,
                      showSummary: true,
                      loading: campaignLoading,
                    }}
                  />
                </div>
              ) : (
                <Empty label="No Campaign Found" desc="No campaigns found for this influencer." />
              )}
            </Sect>
          </TabsContent>

          <TabsContent value="payment details" className="space-y-4">
            <Sect title={<><CreditCard className="h-4 w-4" style={{ color: theme.accent }} />Payment Methods</>}>
              {paymentLoading ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {[0, 1].map(i => <Skeleton key={i} className="h-44 rounded-xl" />)}
                </div>
              ) : paymentDetails.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {paymentDetails.map((pm, i) => (
                    <div key={pm._id || i} className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white/75 p-4 backdrop-blur-sm">
                      <div className="absolute left-0 top-0 h-[3px] w-full" style={{ background: theme.gradient }} />
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="text-[13px] font-semibold text-slate-700">{pm.label || (pm.type === 0 ? "PayPal" : "Bank Account")}</p>
                          <p className="text-[11px] text-slate-400">{pm.type === 0 ? "PayPal" : "Bank Transfer"}</p>
                        </div>
                        {pm.isDefault && (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                            Default
                          </span>
                        )}
                      </div>
                      <Separator className="mb-3 bg-slate-100" />
                      {pm.type === 0 ? (
                        <>
                          <KV label="Email" value={pm.paypal?.email || "—"} />
                          <KV label="Username" value={pm.paypal?.username || "—"} />
                          <KV label="Updated" value={fmtDateTime(pm.updatedAt)} />
                        </>
                      ) : (
                        <>
                          <KV label="Holder" value={pm.bank?.accountHolder || "—"} />
                          <KV
                            label="Account No."
                            value={<code className="font-mono text-[12px]">{pm.bank?.accountNumber || "—"}</code>}
                          />
                          <KV label="Bank" value={pm.bank?.bankName || "—"} />
                          <KV label="IFSC" value={<code className="font-mono text-[12px]">{pm.bank?.ifsc || "—"}</code>} />
                          <KV label="SWIFT" value={<code className="font-mono text-[12px]">{pm.bank?.swift || "—"}</code>} />
                          <KV label="Country" value={pm.bank?.countryName || "—"} />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Empty label="No payment methods" desc="No saved payment details found." />
              )}
            </Sect>
          </TabsContent>
          {/* <TabsContent value="subscription" className="space-y-4">
            <Sect title={<><CreditCard className="h-4 w-4" style={{ color: theme.accent }} />Subscription</>}>
              <Empty label="API NOT connected" desc="Subscription details are not available right now." />
            </Sect>
          </TabsContent>
          <TabsContent value="activity log" className="space-y-4">
            <Sect title={<><Activity className="h-4 w-4" style={{ color: theme.accent }} />Activity Logs</>}>
              <Empty label="API NOT connected" desc="Activity logs are not available right now." />
            </Sect>
          </TabsContent> */}
        </div>
      </Tabs>
    </div>
  );
}