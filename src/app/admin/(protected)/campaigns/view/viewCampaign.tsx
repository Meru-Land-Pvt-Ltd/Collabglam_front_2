"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import swal from "sweetalert";
import { useRouter, useSearchParams } from "next/navigation";
import { get, post } from "@/lib/api";
import { resolveFileList } from "@/lib/files";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminTable, { type AdminTableColumn } from "../../../components/table";
import AddMilestoneCard from "@/components/ui/brand/AddMilestoneCard";
import {
  AlignLeft,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Copy,
  Download,
  Eye,
  FileText,
  Heart,
  Image as ImageIcon,
  Layers3,
  Link2,
  Loader2,
  Mail,
  MessageSquareText,
  Pencil,
  Plus,
  Search,
  Star,
  Target,
  Users2,
  Wallet,
  X,
} from "lucide-react";
import { HiOutlineRefresh } from "react-icons/hi";

/* ========================= Types ========================= */

type TabKey = "details" | "applicants" | "ratings" | "deliverables" | "pitchFolder";
type ReviewStatus = "pending" | "submitted" | "approved" | "revision";

interface ProductImage {
  name?: string;
  type?: string;
  size?: number;
  dataUrl?: string;
  url?: string;
}

interface CampaignCategory {
  categoryName?: string;
  subcategoryName?: string;
}

interface GoalDetail {
  goal?: string;
}

interface InfluencerTierDetail {
  category?: string;
  value?: string;
}

interface ContentFormatDetail {
  format?: string;
}

interface ContentLanguageDetail {
  name?: string;
}

interface PreferredHashtagDetail {
  tag?: string;
}

interface TargetCountryDetail {
  countryName?: string;
  flag?: string;
}

interface TargetAgeRangeDetail {
  range?: string;
}

interface CreatedBy {
  name?: string;
  email?: string;
  role?: string;
  adminRole?: string;
  userId?: string;
  userModel?: string;
}

interface CampaignData {
  _id?: string;
  campaignId?: string;
  brandId?: string;
  brandName?: string;
  campaignTitle?: string;
  name?: string;
  description?: string;
  campaignType?: string;
  campaignCategory?: string;
  campaignSubcategory?: string;
  productImages?: ProductImage[];
  images?: string[];
  productLink?: string;
  videoLink?: string;
  productServiceInfo?: string[];
  numberOfInfluencers?: number;
  minFollowers?: number;
  maxFollowers?: number;
  campaignBudget?: number;
  budget?: number;
  influencerBudget?: number;
  paymentType?: string;
  platformSelection?: string[];
  additionalNotes?: string;
  hashtags?: string[];
  campaignTimezone?: string;
  scheduledAt?: string | null;
  startAt?: string;
  endAt?: string;
  publishedAt?: string;
  endedAt?: string | null;
  categories?: CampaignCategory[];
  status?: string;
  publishStatus?: string;
  approvalMode?: string;
  isActive?: number;
  isDraft?: number;
  applicantCount?: number;
  hasApplied?: number;
  byAi?: number;
  createdBy?: CreatedBy;
  createdAt?: string;
  updatedAt?: string;
  subcategoryDetails?: { name?: string; categoryName?: string }[];
  campaignGoalDetails?: GoalDetail[];
  influencerTierDetails?: InfluencerTierDetail[];
  contentFormatDetails?: ContentFormatDetail[];
  contentLanguageDetails?: ContentLanguageDetail[];
  preferredHashtagDetails?: PreferredHashtagDetail[];
  targetCountryDetails?: TargetCountryDetail[];
  targetAgeRangeDetails?: TargetAgeRangeDetail[];
}

interface ApiResponse {
  message?: string;
  data?: CampaignData;
}

type AddFundsResponse = {
  brandId: string;
  campaignId: string;
  campaignMongoId?: string;
  addedAmount: number;
  currency: string;
  wallet: {
    walletBalance: number;
    frozenBalance: number;
    usableBalance: number;
  };
  campaignFreeze: {
    brandId: string;
    campaignId: string;
    totalFrozenAmount: number;
    currentFrozenAmount: number;
    totalAllocatedAmount: number;
    totalReleasedAmount: number;
    availableToAllocate: number;
    influencerAllocations: Array<{
      influencerId: string;
      amount: number;
      releasedAmount: number;
    }>;
  };
};

type Meta = {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

type BreakdownItem = {
  code?: string;
  name?: string;
  weight?: number;
};

interface InfluencerApplicant {
  influencerId?: string;
  influencerName?: string;
  name?: string;
  email?: string;
  influencerEmail?: string;
  primaryPlatform?: string;
  platform?: string;
  handle?: string;
  category?: string;
  categoryIds?: string[];
  audienceSize?: number;
  engagementRate?: number;
  influencerTierResolved?: string;
  createdAt?: string;
  appliedAt?: string;

  invitationId?: string;
  invitationStatus?: string;
  brandId?: string;
  brandName?: string;
  campaignId?: string;
  campaignTitle?: string;
  createdByAdminId?: string;

  isShortlisted?: number;
  isUndicided?: number;
  isUndecided?: number;
  isRejected?: number;
  statusBrand?: string;
  statusInfluencer?: string;
  brandStatus?: string;
  influencerStatus?: string;
  isInvited?: number;
  isActive?: number;
  isCompleted?: number;
  lifecycleStatus?: string | null;
  lifecycleStatusRaw?: string | null;
  isFinalUpdate?: boolean;
  contractId?: string;
  modashProfile?: {
    provider?: string;
    picture?: string;
    fullname?: string;
    username?: string;
    audience?: {
      notable?: number;
      genders?: BreakdownItem[];
      geoCountries?: BreakdownItem[];
      ages?: BreakdownItem[];
      languages?: BreakdownItem[];
    };
  };
}

type ReviewType = "brand_to_influencer" | "influencer_to_brand";

type GeneratedReviewLink = {
  _id: string;
  reviewRequestId?: string;
  reviewType: ReviewType;
  reviewerRole?: string;
  revieweeRole?: string;
  publicUrl: string;
  expiresAt?: string;

  isExistingLink?: boolean;
  regenerated?: boolean;
  isUpdateLink?: boolean;
  isSkippedLink?: boolean;
  wasExpired?: boolean;
};

type GenerateReviewResponse = {
  success?: boolean;
  message?: string;
  data?: GeneratedReviewLink[];
};

type GeneratedReviewGroup = {
  influencerId: string;
  influencerName: string;
  createdAt: string;
  links: GeneratedReviewLink[];
};

type ExistingReviewLinksResponse = {
  success?: boolean;
  message?: string;
  data?: GeneratedReviewGroup[];
};

type CampaignRatingScope = "all" | "submitted_by_brand" | "given_to_brand";

type CampaignRatingStatus =
  | "pending"
  | "submitted"
  | "skipped"
  | "expired"
  | "revoked";

type CampaignRatingRole = "brand" | "influencer" | "platform" | "admin";

type CampaignRatingMiniEntity = {
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

type CampaignRatingMetrics = {
  workQuality?: number;
  communication?: number;
  timeliness?: number;
  professionalism?: number;
  valueForMoney?: number;
  platformExperience?: number;
  supportExperience?: number;
  wouldRecommend?: number;
};

type CampaignRatingAnswer = {
  questionKey?: string;
  questionLabel?: string;
  answerType?: string;
  value?: unknown;
  displayValue?: unknown;
  score?: number | null;
};

type CampaignRatingSnapshot = {
  role?: CampaignRatingRole;
  entityId?: string;
  name?: string;
  email?: string;
  handle?: string;
  image?: string;
};

type CampaignRatingItem = {
  _id: string;
  reviewType: ReviewType;
  reviewerRole?: CampaignRatingRole;
  revieweeRole?: CampaignRatingRole;
  status: CampaignRatingStatus;
  submittedVia?: string;
  rating?: number | null;
  noteStarRating?: number | null;
  reviewTitle?: string;
  reviewText?: string;
  privateFeedback?: string;
  tags?: string[];
  metrics?: CampaignRatingMetrics;
  ratings?: CampaignRatingMetrics;
  responses?: CampaignRatingAnswer[];
  responseMap?: Record<string, CampaignRatingAnswer>;
  firstSubmittedAt?: string;
  submittedAt?: string;
  createdAt?: string;
  campaign?: CampaignRatingMiniEntity | null;
  brand?: CampaignRatingMiniEntity | null;
  influencer?: CampaignRatingMiniEntity | null;
  platform?: CampaignRatingMiniEntity | null;
  reviewer?: CampaignRatingSnapshot | null;
  reviewee?: CampaignRatingSnapshot | null;
  campaignId?: CampaignRatingMiniEntity | string | null;
};

type CampaignRatingListResponse = {
  success?: boolean;
  data?: CampaignRatingItem[];
  total?: number;
  page?: number;
  limit?: number;
  message?: string;
};

type CampaignRatingAnswerRow = {
  question: string;
  answer: string;
  score?: number | null;
};

type ApplicantStatusCounts = {
  total?: number;
  applied?: number;
  active?: number;
  shortlisted?: number;
  undecided?: number;
  rejected?: number;
  invited?: number;
  completed?: number;
};

type ApplyListResponse = {
  meta?: Meta;
  influencers?: InfluencerApplicant[];
  applicantCount?: number;
  statusCounts?: ApplicantStatusCounts;
  appliedFilters?: { sortField?: string; sortOrder?: number };
  isContracted?: number;
  contractId?: string;
};

type UrlItem = {
  label?: string;
  url?: string;
};

type DeliverableApi = {
  _id?: string;
  id?: string;
  delieverableApprovalId?: string;
  deliverableApprovalId?: string;
  campaignId?: string;
  influencerId?: string;
  influencerHandle?: string;
  username?: string;
  influencerName?: string;
  milestoneTitle?: string;
  influencer?: {
    influencerId?: string;
    name?: string;
    username?: string;
    fullName?: string;
  };
  title?: string;
  description?: string;
  url?: UrlItem[];
  status?: string;
  comments?: string;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
};

type DeliverableRow = {
  rowKey: string;
  deliverableId: string;
  influencerName: string;
  title: string;
  description: string;
  milestoneTitle: string;
  draftLabel: string;
  linkUrl: string;
  status: ReviewStatus;
  reason: string;
  submittedAt: string;
  updatedAt?: string;
};

type MilestoneDeliverableLink = {
  label?: string;
  url?: string;
};

type MilestoneDeliverable = {
  _id?: string;
  deliverableId?: string;
  deliverableName?: string;
  title?: string;
  deliveries?: string[];
  aspectRatio?: string;
  platforms?: string[];
  quantity?: number;
  deliverableLinks?: MilestoneDeliverableLink[];
  submittedAt?: string | null;
  status?: string;
  comments?: string;
  createdAt?: string;
  updatedAt?: string;
};

type MilestoneRow = {
  milestoneHistoryId?: string;
  milestoneId?: string;
  brandId?: string;
  campaignId?: string;
  influencerId?: string;
  influencerName?: string;
  milestoneTitle?: string;
  title?: string;
  name?: string;
  description?: string;
  milestoneDescription?: string;
  amount?: number;
  released?: boolean;
  payoutStatus?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  releasedAt?: string;
  paidAt?: string;
  deliverables?: MilestoneDeliverable[];
  [key: string]: any;
};

type MilestonesByInfluencerResponse = {
  message?: string;
  milestones?: MilestoneRow[];
};

type DeliverableSubmitTarget = {
  applicant: InfluencerApplicant;
  milestone: MilestoneRow;
  deliverable: MilestoneDeliverable;
};

type PitchFolderMediaKit = {
  s3Key?: string;
  fileName?: string;
  mimeType?: string;
  size?: number | null;
  uploadedAt?: string | null;
  showToBrand?: boolean;
  requestStatus?: "none" | "requested" | "approved" | "rejected";
  requestedAt?: string | null;
  reviewedAt?: string | null;
};

type PitchFolderMediaKitLink = {
  url?: string;
  generatedAt?: string | null;
  showToBrand?: boolean;
  requestStatus?: "none" | "requested" | "approved" | "rejected";
  requestedAt?: string | null;
  reviewedAt?: string | null;
};

type PitchFolderMediaKitAccess = {
  hasAdded?: boolean;
  allowed?: boolean;
  visibleSource?: "pdf" | "link" | null;
  requestStatus?: "none" | "requested" | "approved" | "rejected";
  requestedAt?: string | null;
  availableOnRequest?: boolean;
  buttonLabel?: string;
  url?: string;
};

type PitchFolderCampaignActivation = {
  active?: boolean;
  campaignId?: string;
  campaignsId?: string;
  influencerId?: string | null;
  activeAt?: string | null;
};

type PitchFolderCampaignInvitation = {
  invitationId?: string | null;
  campaignId?: string | null;
  status?: string | null;
  sentAt?: string | null;
  updatedAt?: string | null;
};

type PitchFolderRateCardHistoryEntry = {
  _id?: string;
  field?: "influencerRateCard" | "platformRateCard" | string;
  previousValue?: string;
  newValue?: string;
  changedAt?: string | null;
  changedByAdminId?: string | null;
};

type PitchFolderItem = {
  _id: string;
  provider?: string;
  name?: string;
  handle?: string;
  followers?: number | null;
  primaryLink?: string;
  links?: string[];
  niche?: string[];
  email?: string;
  country?: string;
  selectionReason?: string;
  goodFit?: boolean | null;
  influencerRateCard?: string;
  platformRateCard?: string;
  rateCardCurrency?: string;
  rateCardHistory?: PitchFolderRateCardHistoryEntry[];
  shippingAddress?: string;
  comments?: string;
  mediaKit?: PitchFolderMediaKit | null;
  mediaKitLink?: PitchFolderMediaKitLink | null;
  mediaKitAccess?: PitchFolderMediaKitAccess | null;
  createdInfluencerId?: string | null;
  influencerCreatedAt?: string | null;
  linkedInfluencer?: { influencerId?: string | null } | null;
  campaignActivation?: PitchFolderCampaignActivation | null;
  campaignInvitation?: PitchFolderCampaignInvitation | null;
};

type AssignedPitchFolder = {
  _id: string;
  title?: string;
  description?: string;
  assignedCampaign?: {
    campaignId?: string;
    campaignsId?: string;
    campaignTitle?: string;
    brandId?: string | null;
    brandName?: string;
    assignedAt?: string | null;
  } | null;
  items?: PitchFolderItem[];
};

type AssignedPitchFolderResponse = {
  success?: boolean;
  data?: AssignedPitchFolder | null;
  message?: string;
};

/* ========================= Utils ========================= */

const DARK_GRADIENT =
  "bg-[linear-gradient(90deg,#0f1012_0%,#17181a_36%,#252629_100%)]";

const PRIMARY_BUTTON =
  "border border-[#161719] bg-[linear-gradient(90deg,#111214_0%,#17181a_35%,#232427_100%)] text-white hover:opacity-95";

const SECONDARY_BUTTON =
  "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50";

const DASH = "—";
const DELIVERABLES_PER_PAGE = 10;
const CAMPAIGN_RATINGS_PER_PAGE = 10;

function showErr(message: string) {
  return swal({
    title: "Error",
    text: message || "Something went wrong.",
    icon: "error",
  });
}

function showSuccess(message: string) {
  return swal({
    title: "Success",
    text: message,
    icon: "success",
  });
}

const formatDate = (iso?: string | null) => {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DASH;
  return d.toLocaleString("en-IN", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateShort = (iso?: string | null) => {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DASH;
  return d.toLocaleString("en-IN", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (iso?: string | null) => {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DASH;

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

const formatMoney = (v?: number | string | null) => {
  const a = Number(v ?? 0);
  if (!Number.isFinite(a)) return "0";
  return a.toLocaleString("en-US", { maximumFractionDigits: 2 });
};

const formatNumber = (v?: number | string | null) => {
  const a = Number(v ?? 0);
  if (v === null || v === undefined || !Number.isFinite(a)) return DASH;
  return new Intl.NumberFormat("en-IN").format(a);
};

const formatCompactNumber = (v?: number | string | null) => {
  const a = Number(v ?? 0);
  if (!Number.isFinite(a)) return "—";
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(a);
};

const prettify = (v?: string | null) => {
  if (!v) return "—";
  return v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

function formatReviewType(value?: string) {
  if (value === "brand_to_influencer") return "Brand → Influencer";
  if (value === "influencer_to_brand") return "Influencer → Brand";
  return "Review Link";
}

const CAMPAIGN_RATING_SCOPES: Array<{
  id: CampaignRatingScope;
  label: string;
  hint: string;
  icon: typeof MessageSquareText;
}> = [
    {
      id: "all",
      label: "All Submitted",
      hint: "Both review directions for this campaign",
      icon: MessageSquareText,
    },
    {
      id: "submitted_by_brand",
      label: "Submitted by Brand",
      hint: "Brand → Influencer ratings",
      icon: Building2,
    },
    {
      id: "given_to_brand",
      label: "Ratings Given to Brand",
      hint: "Influencer → Brand ratings",
      icon: Users2,
    },
  ];

const CAMPAIGN_RATING_METRIC_LABELS: Array<[keyof CampaignRatingMetrics, string]> = [
  ["workQuality", "Work Quality"],
  ["communication", "Communication"],
  ["timeliness", "Timeliness"],
  ["professionalism", "Professionalism"],
  ["valueForMoney", "Value for Money"],
  ["platformExperience", "Platform Experience"],
  ["supportExperience", "Support Experience"],
  ["wouldRecommend", "Would Recommend"],
];

function campaignRatingSafeNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function campaignRatingRound1(value: unknown) {
  return campaignRatingSafeNumber(value).toFixed(1);
}

function campaignRatingTypeLabel(value?: string) {
  return formatReviewType(value);
}

function campaignRatingNormalizeText(value = "") {
  return String(value).split("_").join(" ");
}

function campaignRatingStringifyAnswer(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (Array.isArray(value)) {
    return value.map((item: unknown): string => campaignRatingStringifyAnswer(item)).join(", ");
  }
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function campaignRatingBuildQuery(params: Record<string, string | number | undefined | null>) {
  const q = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      q.set(key, String(value).trim());
    }
  });

  return q.toString();
}

function campaignRatingScopeQuery(scope: CampaignRatingScope): Record<string, string> {
  if (scope === "submitted_by_brand") {
    return {
      reviewType: "brand_to_influencer",
      reviewerRole: "brand",
    };
  }

  if (scope === "given_to_brand") {
    return {
      reviewType: "influencer_to_brand",
      revieweeRole: "brand",
    };
  }

  return {};
}

function campaignRatingEntityName(
  value?: CampaignRatingMiniEntity | CampaignRatingSnapshot | string | null,
  fallback = "—"
) {
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

function campaignRatingEntityImage(value?: CampaignRatingMiniEntity | CampaignRatingSnapshot | null) {
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

function campaignRatingInitials(name = "?") {
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

function campaignRatingReviewer(review: CampaignRatingItem) {
  if (review.reviewer) return review.reviewer;
  if (review.reviewerRole === "brand") return review.brand || null;
  if (review.reviewerRole === "influencer") return review.influencer || null;
  return review.platform || null;
}

function campaignRatingReviewee(review: CampaignRatingItem) {
  if (review.reviewee) return review.reviewee;
  if (review.revieweeRole === "brand") return review.brand || null;
  if (review.revieweeRole === "influencer") return review.influencer || null;
  return review.platform || null;
}

function campaignRatingSubmittedAt(review: CampaignRatingItem) {
  return review.submittedAt || review.firstSubmittedAt || review.createdAt;
}

function campaignRatingAnswers(review: CampaignRatingItem): CampaignRatingAnswerRow[] {
  const answers: CampaignRatingAnswerRow[] = [];
  const seen = new Set<string>();

  const pushAnswer = (question: string, answer: unknown, score?: number | null) => {
    const label = question || "Question";
    const value = campaignRatingStringifyAnswer(answer);
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
        item.questionLabel || item.questionKey || campaignRatingNormalizeText(key),
        item.displayValue ?? item.value,
        item.score
      );
    });
  }

  if (!answers.length) {
    pushAnswer("Overall rating", review.rating || review.noteStarRating);
    pushAnswer("Review text", review.reviewText);
    pushAnswer("Private feedback", review.privateFeedback);
    pushAnswer(
      "Tags submitted",
      review.tags?.length ? review.tags.map(campaignRatingNormalizeText).join(", ") : ""
    );

    const metrics = review.metrics || review.ratings || {};
    CAMPAIGN_RATING_METRIC_LABELS.forEach(([key, label]) => {
      if (campaignRatingSafeNumber(metrics[key]) > 0) {
        pushAnswer(label, `${campaignRatingSafeNumber(metrics[key]).toFixed(1)} / 5`);
      }
    });
  }

  return answers;
}

function campaignRatingAverageByType(rows: CampaignRatingItem[], reviewType: ReviewType) {
  const values = rows
    .filter((item) => item.reviewType === reviewType)
    .map((item) => campaignRatingSafeNumber(item.rating || item.noteStarRating))
    .filter((value) => value > 0);

  if (!values.length) return "—";

  return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
}

function getReviewTypeMeta(value?: string) {
  if (value === "brand_to_influencer") {
    return {
      label: "Brand feedback",
      helper: "Brand rates the influencer",
      accent: "from-stone-500 to-stone-700",
      pill: "bg-stone-100 text-stone-700 ring-stone-200",
    };
  }

  if (value === "influencer_to_brand") {
    return {
      label: "Influencer feedback",
      helper: "Influencer rates the brand",
      accent: "from-stone-500 to-stone-700",
      pill: "bg-stone-100 text-stone-700 ring-stone-200",
    };
  }

  return {
    label: "Review feedback",
    helper: "Shareable review link",
    accent: "from-stone-700 to-stone-950",
    pill: "bg-stone-100 text-stone-700 ring-stone-200",
  };
}

const normalizeUrl = (v?: string | null) => {
  const s = String(v || "").trim();
  if (!s) return "";
  return s.startsWith("http") ? s : `https://${s}`;
};

const toPercentNumber = (v?: number | null) => {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return 0;
  return n <= 1 ? n * 100 : n;
};

const formatPercent = (v?: number | null) => `${toPercentNumber(v).toFixed(2)}%`;

const toReviewStatus = (v: any): ReviewStatus => {
  const s = String(v || "pending").toLowerCase();

  if (s === "approved") return "approved";
  if (s === "submitted") return "submitted";
  if (["revision", "changes", "changes_needed", "changes needed"].includes(s)) {
    return "revision";
  }

  return "pending";
};

function normalizePlatform(p?: string | null) {
  const n = String(p || "").trim().toLowerCase();
  if (!n) return "";
  if (n.includes("insta")) return "instagram";
  if (n.includes("you")) return "youtube";
  if (n.includes("tik")) return "tiktok";
  return n;
}

function normalizeAdminRoleForUi(value?: unknown) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  if (!normalized) return "";
  if (["superadmin", "super"].includes(normalized)) return "superadmin";
  if (["revenuehead", "rh"].includes(normalized)) return "rh";
  if (normalized === "bme") return "bme";
  if (normalized === "ime") return "ime";

  return normalized;
}

function getStoredAdminRoleForUi(storedAdmin: any) {
  return normalizeAdminRoleForUi(
    storedAdmin?.role ||
    storedAdmin?.adminRole ||
    storedAdmin?.admin?.role ||
    storedAdmin?.admin?.adminRole ||
    storedAdmin?.data?.role ||
    storedAdmin?.data?.adminRole
  );
}

function getPlatformIcon(p?: string | null) {
  const n = normalizePlatform(p);
  return n === "instagram"
    ? "/skill-icons_instagram.svg"
    : n === "youtube"
      ? "/logos_youtube-icon.svg"
      : n === "tiktok"
        ? "/ic_baseline-tiktok.svg"
        : null;
}

function getInitials(name?: string | null) {
  return (
    String(name || "—")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "—"
  );
}

function getApplicantAvatarUrl(inf: InfluencerApplicant) {
  return inf.modashProfile?.picture || null;
}

function getVisiblePageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 3) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 2) {
    return [1, 2, 3];
  }

  if (currentPage >= totalPages - 1) {
    return [totalPages - 2, totalPages - 1, totalPages].filter(
      (page) => page > 0
    );
  }

  return [currentPage - 1, currentPage, currentPage + 1];
}

function PaginationBar({
  currentPage,
  totalPages,
  onPageChange,
  showingFrom,
  showingTo,
  totalItems,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showingFrom: number;
  showingTo: number;
  totalItems: number;
}) {
  if (totalItems <= 0) return null;

  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);
  const pages = getVisiblePageNumbers(safeCurrentPage, safeTotalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-stone-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-slate-600">
        Showing {showingFrom}-{showingTo} of {totalItems}
      </p>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          disabled={safeCurrentPage <= 1}
          className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-stone-200 bg-white text-stone-500 shadow-sm transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((page) => {
          const isActive = page === safeCurrentPage;

          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`inline-flex h-9 w-9 items-center justify-center text-sm font-semibold shadow-sm transition ${isActive
                ? "rounded-full bg-[#0f172a] text-white"
                : "rounded-full border border-stone-200 bg-white text-stone-500 hover:bg-stone-50"
                }`}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() =>
            onPageChange(Math.min(safeTotalPages, safeCurrentPage + 1))
          }
          disabled={safeCurrentPage >= safeTotalPages}
          className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-stone-200 bg-white text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4 rotate-180" />
        </button>
      </div>
    </div>
  );
}

function getApplicantStatusMeta(inf: InfluencerApplicant) {
  const status = String(
    inf.invitationStatus ||
    inf.lifecycleStatus ||
    inf.lifecycleStatusRaw ||
    inf.statusBrand ||
    inf.statusInfluencer ||
    ""
  ).toLowerCase();

  if (inf.isCompleted === 1 || status === "completed") {
    return {
      label: "Completed",
      pill: "bg-emerald-600 text-white ring-emerald-600",
    };
  }

  if (status === "accepted" || inf.isActive === 1) {
    return {
      label: status === "accepted" ? "Accepted" : "Active",
      pill: "bg-emerald-600 text-white ring-emerald-600",
    };
  }

  if (inf.isShortlisted === 1 || status === "shortlisted") {
    return {
      label: "Shortlisted",
      pill: "bg-amber-500 text-white ring-amber-500",
    };
  }

  if (inf.isRejected === 1 || ["rejected", "declined"].includes(status)) {
    return {
      label: status === "declined" ? "Declined" : "Rejected",
      pill: "bg-rose-600 text-white ring-rose-600",
    };
  }

  if (inf.isInvited === 1 || ["invited", "pending", "sent"].includes(status)) {
    return {
      label: status ? prettify(status) : "Invited",
      pill: "bg-violet-600 text-white ring-violet-600",
    };
  }

  if (inf.isUndecided === 1 || inf.isUndicided === 1 || status === "undecided") {
    return {
      label: "Undecided",
      pill: "bg-stone-600 text-white ring-stone-600",
    };
  }

  return {
    label: status ? prettify(status) : "Applied",
    pill: "bg-stone-500 text-white ring-stone-500",
  };
}

function reviewBadge(status: ReviewStatus) {
  if (status === "approved") return "bg-emerald-600 text-white ring-emerald-600";
  if (status === "revision") return "bg-amber-500 text-white ring-amber-500";
  if (status === "submitted") return "bg-sky-600 text-white ring-sky-600";
  return "bg-stone-700 text-white ring-stone-700";
}

function reviewLabel(status: ReviewStatus) {
  return status === "approved"
    ? "Approved"
    : status === "revision"
      ? "Revision"
      : status === "submitted"
        ? "Submitted"
        : "Pending";
}

function mapDeliverables(items: DeliverableApi[]): DeliverableRow[] {
  const output: DeliverableRow[] = [];

  for (const item of items || []) {
    const deliverableId = String(
      item.delieverableApprovalId ||
      item.deliverableApprovalId ||
      item._id ||
      item.id ||
      ""
    );

    if (!deliverableId) continue;

    const influencerName = String(
      item.influencerName ||
      item.influencer?.fullName ||
      item.influencer?.name ||
      item.username ||
      item.influencerHandle ||
      "—"
    );

    const urls = Array.isArray(item.url) ? item.url : [];
    const base = {
      deliverableId,
      influencerName,
      title: item.title || "Untitled",
      description: item.description || "",
      milestoneTitle: item.milestoneTitle || "—",
      status: toReviewStatus(item.status),
      reason: item.comments || item.reason || "",
      submittedAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt,
    };

    if (!urls.length) {
      output.push({
        ...base,
        rowKey: `${deliverableId}_0`,
        draftLabel: "Draft",
        linkUrl: "",
      });
      continue;
    }

    urls.forEach((u, i) =>
      output.push({
        ...base,
        rowKey: `${deliverableId}_${i}`,
        draftLabel: u.label || `Draft ${i + 1}`,
        linkUrl: u.url || "",
      })
    );
  }

  return output;
}

function getMilestoneDisplayTitle(item: MilestoneRow) {
  return item.milestoneTitle || item.title || item.name || "Untitled Milestone";
}

function getMilestoneDisplayDescription(item: MilestoneRow) {
  return item.milestoneDescription || item.description || "";
}

function getMilestoneStatusPill(item: MilestoneRow) {
  const payout = String(item.payoutStatus || "").toLowerCase();

  if (payout === "paid") {
    return {
      label: "Paid",
      className: "bg-emerald-600 text-white ring-emerald-600",
    };
  }

  if (payout === "initiated") {
    return {
      label: "Initiated",
      className: "bg-stone-900 text-white ring-stone-900",
    };
  }

  if (item.released) {
    return {
      label: "Released",
      className: "bg-amber-500 text-white ring-amber-500",
    };
  }

  return {
    label: "Pending",
    className: "bg-stone-600 text-white ring-stone-600",
  };
}

function isMilestoneReleased(item: MilestoneRow) {
  const payout = String(item.payoutStatus || "").toLowerCase();

  return (
    Boolean(item.released) ||
    Boolean(item.releasedAt) ||
    payout === "initiated" ||
    payout === "paid"
  );
}

function areAllMilestoneDeliverablesApproved(item: MilestoneRow) {
  const deliverables = Array.isArray(item.deliverables) ? item.deliverables : [];

  if (!deliverables.length) return false;

  return deliverables.every(
    (deliverable) => toReviewStatus(deliverable.status) === "approved"
  );
}

function getDeliverableTitle(item: MilestoneDeliverable) {
  return item.deliverableName || item.title || "Untitled Deliverable";
}

function getDeliverableId(item: MilestoneDeliverable) {
  return String(item.deliverableId || item._id || "");
}

function formatDeliverableList(value?: string[]) {
  const list = Array.isArray(value) ? value.filter(Boolean) : [];

  if (!list.length) return DASH;

  return list.map(prettify).join(", ");
}

function formatPlatformList(value?: string[]) {
  const list = Array.isArray(value) ? value.filter(Boolean) : [];

  if (!list.length) return DASH;

  return list.map(prettify).join(", ");
}

function getSubmittedLinkCount(item: MilestoneDeliverable) {
  return Array.isArray(item.deliverableLinks)
    ? item.deliverableLinks.filter((link) => String(link?.url || "").trim())
      .length
    : 0;
}

function getRequiredDeliverableLinks(item: MilestoneDeliverable) {
  const qty = Number(item.quantity || 1);

  return Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 1;
}

function buildDeliverableLinkInputs(item?: MilestoneDeliverable) {
  const required = item ? getRequiredDeliverableLinks(item) : 1;
  const existingLinks = Array.isArray(item?.deliverableLinks)
    ? item.deliverableLinks.filter((link) => String(link?.url || "").trim())
    : [];

  const inputCount = Math.max(required, existingLinks.length, 1);

  return Array.from({ length: inputCount }, (_, index) => ({
    label: existingLinks[index]?.label || `Deliverable Link ${index + 1}`,
    url: existingLinks[index]?.url || "",
  }));
}

function isApplicantActive(inf: InfluencerApplicant) {
  if (inf.isActive === 1) return true;

  const tokens = [
    inf.lifecycleStatus,
    inf.lifecycleStatusRaw,
    inf.statusBrand,
    inf.statusInfluencer,
    inf.brandStatus,
    inf.influencerStatus,
  ]
    .filter(Boolean)
    .map((v) => String(v).toLowerCase());

  return tokens.includes("active");
}

function getApplicantRowKey(
  applicant: InfluencerApplicant,
  fallback = "row"
) {
  return String(
    applicant.influencerId || applicant.handle || applicant.name || fallback
  ).trim();
}

function getApplicantStatusValue(inf: InfluencerApplicant) {
  if (inf.isCompleted === 1) return "completed";
  if (inf.isActive === 1) return "active";
  if (inf.isShortlisted === 1) return "shortlisted";
  if (inf.isRejected === 1) return "rejected";
  if (inf.isInvited === 1) return "invited";
  if (inf.isUndecided === 1 || inf.isUndicided === 1) return "undecided";
  return "applied";
}

function matchesApplicantStatusFilter(
  inf: InfluencerApplicant,
  filterStatus: string
) {
  const filter = String(filterStatus || "all").toLowerCase();

  if (filter === "all") return true;
  if (filter === "active") return isApplicantActive(inf);
  if (filter === "applied") return getApplicantStatusValue(inf) === "applied";
  if (filter === "shortlisted") return inf.isShortlisted === 1;
  if (filter === "invited") return inf.isInvited === 1;
  if (filter === "completed") return inf.isCompleted === 1;
  if (filter === "rejected") return inf.isRejected === 1;
  if (filter === "undecided") {
    return inf.isUndecided === 1 || inf.isUndicided === 1;
  }

  return true;
}

function buildApplicantSearchText(inf: InfluencerApplicant) {
  return [
    inf.name,
    inf.influencerName,
    inf.email,
    inf.influencerEmail,
    inf.handle,
    inf.primaryPlatform,
    inf.platform,
    inf.category,
    inf.influencerTierResolved,
    inf.lifecycleStatus,
    inf.lifecycleStatusRaw,
    inf.brandStatus,
    inf.statusBrand,
    inf.statusInfluencer,
    inf.influencerStatus,
    inf.invitationStatus,
    inf.brandName,
    inf.campaignTitle,
    inf.invitationId,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function buildPitchFolderItemSearchText(item: PitchFolderItem) {
  return [
    item.name,
    item.handle,
    item.provider,
    item.email,
    item.country,
    Array.isArray(item.niche) ? item.niche.join(" ") : "",
    item.selectionReason,
    item.shippingAddress,
    item.comments,
    item.mediaKitLink?.url,
    item.mediaKit?.fileName,
    item.mediaKitAccess?.requestStatus,
    item.mediaKitAccess?.visibleSource,
    item.influencerRateCard,
    item.platformRateCard,
    Array.isArray(item.rateCardHistory)
      ? item.rateCardHistory
        .map((entry) => [entry.field, entry.newValue, entry.previousValue].filter(Boolean).join(" "))
        .join(" ")
      : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getPitchFolderItemActive(item: PitchFolderItem) {
  return !!item.campaignActivation?.active || !!item.campaignActivation?.activeAt;
}

function getPitchFolderItemProfileUrl(item: PitchFolderItem) {
  const direct = normalizeUrl(item.primaryLink);
  if (direct) return direct;

  const firstLink = Array.isArray(item.links) && item.links.length
    ? normalizeUrl(item.links[0])
    : "";
  if (firstLink) return firstLink;

  const username = String(item.handle || "").trim().replace(/^@+/, "");
  if (!username) return "";

  const platform = normalizePlatform(item.provider);
  if (platform === "youtube") return "https://www.youtube.com/@" + username;
  if (platform === "instagram") return "https://www.instagram.com/" + username + "/";
  if (platform === "tiktok") return "https://www.tiktok.com/@" + username;

  return "";
}

function getPitchFolderShippingAddress(item: PitchFolderItem) {
  return String(item.shippingAddress || item.comments || "").trim();
}

function getLatestPitchFolderRateCard(item: PitchFolderItem) {
  const history = Array.isArray(item.rateCardHistory)
    ? [...item.rateCardHistory].sort((a, b) => {
      const aTime = a.changedAt ? new Date(a.changedAt).getTime() : 0;
      const bTime = b.changedAt ? new Date(b.changedAt).getTime() : 0;
      return bTime - aTime;
    })
    : [];

  const latest = history.find((entry) => String(entry.newValue || "").trim());

  if (latest) {
    return {
      label:
        latest.field === "influencerRateCard"
          ? "Influencer Rate Card"
          : latest.field === "platformRateCard"
            ? "Platform Rate Card"
            : prettify(latest.field || "Rate Card"),
      value: String(latest.newValue || "").trim(),
      changedAt: latest.changedAt || null,
      currency: item.rateCardCurrency || "USD",
    };
  }

  const platformRateCard = String(item.platformRateCard || "").trim();
  if (platformRateCard) {
    return {
      label: "Platform Rate Card",
      value: platformRateCard,
      changedAt: null,
      currency: item.rateCardCurrency || "USD",
    };
  }

  const influencerRateCard = String(item.influencerRateCard || "").trim();
  if (influencerRateCard) {
    return {
      label: "Influencer Rate Card",
      value: influencerRateCard,
      changedAt: null,
      currency: item.rateCardCurrency || "USD",
    };
  }

  return null;
}

function sortApplicantsClient(
  list: InfluencerApplicant[],
  sortField: string,
  sortOrder: -1 | 1
) {
  const sorted = [...list];

  sorted.sort((a, b) => {
    let aValue: any = "";
    let bValue: any = "";

    if (sortField === "audienceSize") {
      aValue = Number(a.audienceSize || 0);
      bValue = Number(b.audienceSize || 0);
    } else if (sortField === "engagementRate") {
      aValue = Number(a.engagementRate || 0);
      bValue = Number(b.engagementRate || 0);
    } else if (sortField === "name") {
      aValue = String(a.name || "").toLowerCase();
      bValue = String(b.name || "").toLowerCase();
    } else {
      aValue = new Date(a.appliedAt || a.createdAt || 0).getTime();
      bValue = new Date(b.appliedAt || b.createdAt || 0).getTime();
    }

    if (aValue < bValue) return sortOrder === 1 ? -1 : 1;
    if (aValue > bValue) return sortOrder === 1 ? 1 : -1;
    return 0;
  });

  return sorted;
}

function getApplicantCounts(list: InfluencerApplicant[]): ApplicantStatusCounts {
  return {
    total: list.length,
    applied: list.filter((i) => getApplicantStatusValue(i) === "applied").length,
    active: list.filter((i) => isApplicantActive(i)).length,
    shortlisted: list.filter((i) => i.isShortlisted === 1).length,
    undecided: list.filter((i) => i.isUndecided === 1 || i.isUndicided === 1).length,
    rejected: list.filter((i) => i.isRejected === 1).length,
    invited: list.filter((i) => i.isInvited === 1).length,
    completed: list.filter((i) => i.isCompleted === 1).length,
  };
}

function extractArrayFromInvitationResponse(payload: any): any[] {
  return (
    (Array.isArray(payload) && payload) ||
    (Array.isArray(payload?.data) && payload.data) ||
    (Array.isArray(payload?.data?.influencers) && payload.data.influencers) ||
    (Array.isArray(payload?.data?.items) && payload.data.items) ||
    (Array.isArray(payload?.data?.invitations) && payload.data.invitations) ||
    (Array.isArray(payload?.influencers) && payload.influencers) ||
    (Array.isArray(payload?.items) && payload.items) ||
    (Array.isArray(payload?.invitations) && payload.invitations) ||
    (Array.isArray(payload?.results) && payload.results) ||
    []
  );
}

function normalizeInvitationInfluencer(item: any): InfluencerApplicant {
  const influencer =
    item?.influencer ||
    item?.influencerDetails ||
    item?.user ||
    item?.profile ||
    {};

  const rawStatus = String(
    item?.status ||
    item?.invitationStatus ||
    item?.lifecycleStatus ||
    item?.state ||
    ""
  )
    .trim()
    .toLowerCase();

  const isAccepted = ["accepted", "active", "approved", "contracted"].includes(
    rawStatus
  );

  const isRejected = ["rejected", "declined"].includes(rawStatus);
  const isCompleted = ["completed"].includes(rawStatus);
  const isShortlisted = ["shortlisted"].includes(rawStatus);
  const isUndecided = ["undecided"].includes(rawStatus);

  const influencerName =
    item?.influencerName ||
    item?.name ||
    influencer?.name ||
    influencer?.fullName ||
    influencer?.fullname ||
    influencer?.username ||
    item?.handle ||
    "—";

  const influencerEmail =
    item?.influencerEmail ||
    item?.email ||
    influencer?.email ||
    "";

  const platform =
    item?.platform ||
    item?.primaryPlatform ||
    influencer?.primaryPlatform ||
    influencer?.platform ||
    "";

  const handle =
    item?.handle ||
    item?.username ||
    influencer?.handle ||
    influencer?.username ||
    "";

  return {
    invitationId: String(item?.invitationId || item?._id || item?.id || ""),

    brandId: String(item?.brandId || influencer?.brandId || ""),
    brandName: item?.brandName || "",

    campaignId: String(item?.campaignId || ""),
    campaignTitle: item?.campaignTitle || "",

    influencerId: String(
      item?.influencerId ||
      influencer?._id ||
      influencer?.influencerId ||
      influencer?.id ||
      ""
    ),

    name: influencerName,
    email: influencerEmail,

    handle,
    primaryPlatform: platform,
    platform,

    category: item?.category || influencer?.category || influencer?.niche || "",
    categoryIds: item?.categoryIds || influencer?.categoryIds || [],

    audienceSize: Number(
      item?.audienceSize ??
      item?.followers ??
      influencer?.audienceSize ??
      influencer?.followers ??
      0
    ),

    engagementRate: Number(
      item?.engagementRate ??
      item?.er ??
      influencer?.engagementRate ??
      influencer?.er ??
      0
    ),

    influencerTierResolved:
      item?.influencerTierResolved ||
      influencer?.influencerTierResolved ||
      item?.tier ||
      influencer?.tier ||
      "",

    createdAt:
      item?.createdAt ||
      item?.invitedAt ||
      influencer?.createdAt ||
      item?.updatedAt,

    appliedAt:
      item?.updatedAt ||
      item?.acceptedAt ||
      item?.invitedAt ||
      item?.createdAt ||
      influencer?.createdAt,

    createdByAdminId: String(item?.createdByAdminId || ""),
    invitationStatus: rawStatus,

    isShortlisted:
      Number(item?.isShortlisted ?? influencer?.isShortlisted ?? (isShortlisted ? 1 : 0)) || 0,

    isUndicided:
      Number(item?.isUndicided ?? influencer?.isUndicided ?? 0) || 0,

    isUndecided:
      Number(item?.isUndecided ?? influencer?.isUndecided ?? (isUndecided ? 1 : 0)) || 0,

    isRejected:
      Number(item?.isRejected ?? influencer?.isRejected ?? (isRejected ? 1 : 0)) || 0,

    statusBrand: item?.statusBrand || rawStatus || "",
    statusInfluencer: item?.statusInfluencer || rawStatus || "",
    brandStatus: item?.brandStatus || rawStatus || "",
    influencerStatus: item?.influencerStatus || rawStatus || "",

    isInvited:
      Number(
        item?.isInvited ??
        influencer?.isInvited ??
        (["invited", "pending", "sent"].includes(rawStatus) ? 1 : 0)
      ) || 0,

    isActive:
      Number(item?.isActive ?? influencer?.isActive ?? (isAccepted ? 1 : 0)) || 0,

    isCompleted:
      Number(item?.isCompleted ?? influencer?.isCompleted ?? (isCompleted ? 1 : 0)) || 0,

    lifecycleStatus: item?.lifecycleStatus || rawStatus || "",
    lifecycleStatusRaw: item?.lifecycleStatusRaw || rawStatus || "",

    isFinalUpdate: Boolean(item?.isFinalUpdate ?? influencer?.isFinalUpdate),
    contractId: item?.contractId || influencer?.contractId || "",

    modashProfile: {
      ...(item?.modashProfile || influencer?.modashProfile || {}),
      username:
        item?.modashProfile?.username ||
        influencer?.modashProfile?.username ||
        handle,
      fullname:
        item?.modashProfile?.fullname ||
        influencer?.modashProfile?.fullname ||
        influencerName,
    },
  };
}

/* ========================= Shared UI ========================= */

const Tab = ({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      "relative flex items-center gap-1.5 px-1 pb-3 pt-2 text-sm font-medium transition-colors after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:transition-all",
      active
        ? "text-stone-950 after:bg-stone-950"
        : "text-stone-500 hover:text-stone-800 after:bg-transparent",
    ].join(" ")}
  >
    {label}
    {count !== undefined && (
      <span
        className={`rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums ${active ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-500"
          }`}
      >
        {count}
      </span>
    )}
  </button>
);

const Panel = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-center gap-2.5">
      {icon ? <span className="text-stone-400">{icon}</span> : null}
      <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
    </div>
    {children}
  </div>
);

const Def = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 border-b border-stone-100 py-2.5 last:border-0">
    <dt className="shrink-0 pt-px text-xs font-semibold uppercase tracking-[0.1em] text-stone-500">
      {label}
    </dt>
    <dd className="text-right text-sm font-medium leading-relaxed text-stone-700">
      {value || "—"}
    </dd>
  </div>
);

const Pill = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${className || "bg-stone-100 text-stone-600 ring-stone-200"
      }`}
  >
    {children}
  </span>
);

const MediaAssetPill = ({ label, ok }: { label: string; ok: boolean }) => (
  <Pill
    className={
      ok
        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
        : "bg-rose-50 text-rose-700 ring-rose-200"
    }
  >
    {ok ? (
      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
    ) : (
      <X className="mr-1 h-3.5 w-3.5" />
    )}
    {label}
  </Pill>
);

const MediaAccessBadge = ({
  access,
}: {
  access?: PitchFolderMediaKitAccess | null;
}) => {
  if (!access?.hasAdded) {
    return <Pill className="bg-stone-100 text-stone-700 ring-stone-200">Not Added</Pill>;
  }

  if (access.allowed) {
    return <Pill className="bg-emerald-50 text-emerald-700 ring-emerald-200">Allowed</Pill>;
  }

  if (access.requestStatus === "requested") {
    return <Pill className="bg-amber-50 text-amber-700 ring-amber-200">Requested</Pill>;
  }

  if (access.requestStatus === "rejected") {
    return <Pill className="bg-rose-50 text-rose-700 ring-rose-200">Rejected</Pill>;
  }

  return <Pill className="bg-sky-50 text-sky-700 ring-sky-200">Available on Request</Pill>;
};

const MediaRequestStatusBadge = ({
  value,
}: {
  value?: "none" | "requested" | "approved" | "rejected";
}) => {
  if (value === "approved") {
    return <Pill className="bg-emerald-50 text-emerald-700 ring-emerald-200">Approved</Pill>;
  }

  if (value === "requested") {
    return <Pill className="bg-amber-50 text-amber-700 ring-amber-200">Requested</Pill>;
  }

  if (value === "rejected") {
    return <Pill className="bg-rose-50 text-rose-700 ring-rose-200">Rejected</Pill>;
  }

  return <Pill className="bg-stone-100 text-stone-700 ring-stone-200">No Request</Pill>;
};

const TagCloud = ({ items }: { items: string[] }) => {
  if (!items.length) {
    return <p className="text-xs text-stone-400">None specified.</p>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <Pill
          key={`${item}-${i}`}
          className="bg-stone-50 text-stone-600 ring-stone-200"
        >
          {item}
        </Pill>
      ))}
    </div>
  );
};

const ApplicantAvatar = ({
  applicant,
  size = "h-9 w-9",
  ring = "ring-2 ring-white",
}: {
  applicant: InfluencerApplicant;
  size?: string;
  ring?: string;
}) => {
  const src = getApplicantAvatarUrl(applicant);
  const alt = applicant.name || applicant.handle || "Applicant";

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${size} rounded-full bg-stone-100 object-cover ${ring}`}
      />
    );
  }

  return (
    <div
      className={`${size} ${ring} flex items-center justify-center rounded-full bg-stone-200 text-[11px] font-semibold text-stone-700`}
      aria-label={alt}
      title={alt}
    >
      {getInitials(applicant.name || applicant.handle)}
    </div>
  );
};


const CampaignRatingAvatar = ({
  entity,
  role,
}: {
  entity?: CampaignRatingMiniEntity | CampaignRatingSnapshot | null;
  role?: string;
}) => {
  const name = campaignRatingEntityName(entity, "User");
  const image = campaignRatingEntityImage(entity);
  const Icon = role === "brand" ? Building2 : role === "influencer" ? Users2 : MessageSquareText;

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-stone-100 text-xs font-bold text-stone-800">
      {image ? (
        <img src={image} alt={name} className="h-full w-full object-cover" />
      ) : name && name !== "—" ? (
        campaignRatingInitials(name)
      ) : (
        <Icon className="h-4 w-4 text-stone-400" />
      )}
    </div>
  );
};

const CampaignRatingEntity = ({
  entity,
  role,
}: {
  entity?: CampaignRatingMiniEntity | CampaignRatingSnapshot | null;
  role?: string;
}) => (
  <div className="flex min-w-0 items-center gap-3">
    <CampaignRatingAvatar entity={entity} role={role} />
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-stone-950">
        {campaignRatingEntityName(entity, "—")}
      </p>
      <p className="mt-0.5 text-xs font-medium capitalize text-stone-400">{role || "—"}</p>
    </div>
  </div>
);

const CampaignRatingBadge = ({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success";
}) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-stone-200 bg-stone-50 text-stone-600"
      }`}
  >
    {children}
  </span>
);

const CampaignRatingStars = ({ rating = 0 }: { rating?: number | null }) => {
  const value = Math.max(0, Math.min(5, Math.round(campaignRatingSafeNumber(rating))));

  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-3.5 w-3.5 ${index < value ? "fill-amber-400 text-amber-400" : "text-stone-200"}`}
        />
      ))}
    </span>
  );
};

const CampaignRatingPill = ({ rating }: { rating?: number | null }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-700">
    <CampaignRatingStars rating={rating} />
    {campaignRatingRound1(rating)}
  </span>
);

const CampaignRatingTypeBadge = ({ type }: { type?: string }) => (
  <CampaignRatingBadge>{campaignRatingTypeLabel(type)}</CampaignRatingBadge>
);

const CampaignRatingAnswerPreview = ({ review }: { review: CampaignRatingItem }) => {
  const answers = campaignRatingAnswers(review);
  const firstAnswer = answers[0];

  return (
    <div className="max-w-[430px]">
      <p className="text-sm font-semibold text-stone-950">
        {answers.length} answer{answers.length === 1 ? "" : "s"}
      </p>
      {firstAnswer ? (
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-500">
          {firstAnswer.question}: {firstAnswer.answer}
        </p>
      ) : (
        <p className="mt-1 text-xs text-stone-400">No answer preview available.</p>
      )}
    </div>
  );
};

const ReviewLinkTypeBadge = ({ type }: { type?: string }) => {
  const meta = getReviewTypeMeta(type);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${meta.pill}`}
    >
      {formatReviewType(type)}
    </span>
  );
};

const REVIEW_LINK_ORDER: ReviewType[] = [
  "brand_to_influencer",
  "influencer_to_brand",
];

const ReviewLinksExpandableRow = ({
  group,
  applicant,
  onCopy,
  onRegenerate,
  regeneratingKey,
}: {
  group: GeneratedReviewGroup;
  applicant: InfluencerApplicant;
  onCopy: (url?: string) => void | Promise<void>;
  onRegenerate: (
    group: GeneratedReviewGroup,
    link: GeneratedReviewLink
  ) => void | Promise<void>;
  regeneratingKey?: string;
}) => {
  const linkMap = new Map<ReviewType, GeneratedReviewLink>();

  for (const link of group.links || []) {
    linkMap.set(link.reviewType, link);
  }

  const readyLinks = REVIEW_LINK_ORDER.filter((type) => linkMap.get(type)?.publicUrl).length;

  return (
    <div className="overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-100 bg-[linear-gradient(180deg,#ffffff_0%,#fafaf9_100%)] px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-700 shadow-sm">
              <Link2 className="h-4 w-4" />
            </span>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-stone-950">
                  Review links ready
                </p>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  {readyLinks}/{REVIEW_LINK_ORDER.length} available
                </span>
              </div>

              <p className="mt-1 text-[11px] font-medium text-stone-400">
                Last generated: {formatDateTime(group.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-4 xl:grid-cols-2">
        {REVIEW_LINK_ORDER.map((reviewType) => {
          const link = linkMap.get(reviewType);
          const meta = getReviewTypeMeta(reviewType);
          const key = `${group.influencerId}:${reviewType}`;
          const isRegenerating = regeneratingKey === key;
          const isReady = Boolean(link?.publicUrl);

          return (
            <div
              key={`${group.influencerId}-${reviewType}`}
              className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700">
                    {reviewType === "brand_to_influencer" ? (
                      <Building2 className="h-4 w-4" />
                    ) : (
                      <Users2 className="h-4 w-4" />
                    )}
                  </span>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-950">{meta.label}</p>
                    <p className="mt-1 text-xs leading-5 text-stone-500">{meta.helper}</p>
                  </div>
                </div>

                <span
                  className={`inline-flex w-fit items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${isReady
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-stone-200 bg-white text-stone-400"
                    }`}
                >
                  {isReady ? <CheckCircle2 className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {isReady ? "Ready" : "Missing"}
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-stone-200 bg-white px-3 py-3">
                {isReady ? (
                  <div className="flex flex-col gap-3">
                    <div className="grid gap-2 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => onCopy(link?.publicUrl)}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </button>

                      <a
                        href={link?.publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-stone-900 bg-stone-900 px-3 text-xs font-semibold text-white transition hover:bg-stone-800"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open
                      </a>

                      <button
                        type="button"
                        onClick={() => link && onRegenerate(group, link)}
                        disabled={isRegenerating}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isRegenerating ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <HiOutlineRefresh className="h-3.5 w-3.5" />
                        )}
                        {isRegenerating ? "Updating" : "Regenerate"}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
                      {link?.expiresAt ? (
                        <span className="inline-flex rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-500 ring-1 ring-stone-200">
                          Expires {formatDateTime(link.expiresAt)}
                        </span>
                      ) : null}

                      {link?.isExistingLink ? (
                        <span className="inline-flex rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-500 ring-1 ring-stone-200">
                          Existing
                        </span>
                      ) : null}

                      {link?.regenerated ? (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                          Regenerated
                        </span>
                      ) : null}

                      {link?.wasExpired ? (
                        <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-100">
                          {link.regenerated ? "Expired link refreshed" : "Expired - regenerate"}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 rounded-lg border border-dashed border-stone-200 bg-stone-50 px-3 py-4 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
                    <span>This review link is not generated yet.</span>
                    <span className="font-semibold text-stone-700">Use Generate Missing Links</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


const ApplicantMilestonesPanel = ({
  applicant,
  rowKey,
  loading,
  error,
  items,
  canAddDeliverable = true,
  onAddDeliverable,
  onRaiseRevision,
  onApproveDeliverable,
  onReleaseMilestone,
  updatingDeliverableActionKey = "",
  releasingMilestoneKey = "",
}: {
  applicant: InfluencerApplicant;
  rowKey: string;
  loading: boolean;
  error?: string;
  items: MilestoneRow[];
  canAddDeliverable?: boolean;
  onAddDeliverable: (
    applicant: InfluencerApplicant,
    milestone: MilestoneRow,
    deliverable: MilestoneDeliverable
  ) => void;
  onRaiseRevision: (
    applicant: InfluencerApplicant,
    milestone: MilestoneRow,
    deliverable: MilestoneDeliverable
  ) => void | Promise<void>;
  onApproveDeliverable: (
    applicant: InfluencerApplicant,
    milestone: MilestoneRow,
    deliverable: MilestoneDeliverable
  ) => void | Promise<void>;
  onReleaseMilestone: (
    applicant: InfluencerApplicant,
    milestone: MilestoneRow
  ) => void | Promise<void>;
  updatingDeliverableActionKey?: string;
  releasingMilestoneKey?: string;
}) => {
  const [expandedMilestoneId, setExpandedMilestoneId] = useState<string | null>(
    null
  );

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-stone-900">Milestones</p>
          <p className="text-xs text-stone-400">
            For {applicant.name || applicant.handle || "this influencer"} in this
            campaign
          </p>
        </div>
      </div>

      {loading ? (
        <p className="py-4 text-xs text-stone-400">Loading milestones...</p>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
          {error}
        </div>
      ) : items.length === 0 ? (
        <p className="py-4 text-xs text-stone-400">
          No milestones found for this campaign and influencer.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item, itemIndex) => {
            const milestoneStatus = getMilestoneStatusPill(item);
            const milestoneKey = String(
              item.milestoneHistoryId || item._id || item.milestoneId || itemIndex
            );
            const isExpanded = expandedMilestoneId === milestoneKey;
            const deliverables = Array.isArray(item.deliverables)
              ? item.deliverables
              : [];

            return (
              <div
                key={`${rowKey}-${milestoneKey}`}
                className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50"
              >
                <div className="flex w-full items-start justify-between gap-3 px-4 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedMilestoneId((prev) =>
                        prev === milestoneKey ? null : milestoneKey
                      )
                    }
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-stone-900">
                        {getMilestoneDisplayTitle(item)}
                      </p>

                      <Pill className={milestoneStatus.className}>
                        {milestoneStatus.label}
                      </Pill>

                      <Pill className="bg-stone-900 text-white ring-stone-900">
                        ${formatMoney(item.amount)}
                      </Pill>

                      <Pill className="bg-white text-stone-600 ring-stone-200">
                        {deliverables.length} Deliverable
                        {deliverables.length === 1 ? "" : "s"}
                      </Pill>
                    </div>

                    {getMilestoneDisplayDescription(item) ? (
                      <p className="mt-1 text-xs leading-relaxed text-stone-500">
                        {getMilestoneDisplayDescription(item)}
                      </p>
                    ) : null}

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-stone-400">
                      <span>Created: {formatDateShort(item.createdAt)}</span>
                      <span>Released: {formatDateShort(item.releasedAt)}</span>
                      <span>Updated: {formatDateShort(item.updatedAt)}</span>
                    </div>
                  </button>

                  <div className="mt-1 flex shrink-0 flex-col items-end gap-2">
                    {(() => {
                      const allApproved = areAllMilestoneDeliverablesApproved(item);
                      const milestoneReleased = isMilestoneReleased(item);
                      const milestoneHistoryId = String(item.milestoneHistoryId || item._id || "");
                      const releaseActionKey = milestoneHistoryId || milestoneKey;
                      const isReleasing = releasingMilestoneKey === releaseActionKey;
                      const showReleaseButton = allApproved || milestoneReleased;

                      if (!showReleaseButton) return null;

                      return (
                        <button
                          type="button"
                          disabled={milestoneReleased || isReleasing}
                          onClick={() => onReleaseMilestone(applicant, item)}
                          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-emerald-600 bg-emerald-600 px-3 text-[11px] font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400"
                        >
                          {isReleasing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Wallet className="h-3.5 w-3.5" />
                          )}

                          {isReleasing
                            ? "Releasing..."
                            : milestoneReleased
                              ? "Released"
                              : "Release"}
                        </button>
                      );
                    })()}

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedMilestoneId((prev) =>
                          prev === milestoneKey ? null : milestoneKey
                        )
                      }
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 transition hover:bg-stone-50"
                      aria-label={isExpanded ? "Collapse milestone" : "Expand milestone"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="border-t border-stone-200 bg-white px-4 py-3">
                    {deliverables.length === 0 ? (
                      <p className="text-xs text-stone-400">
                        No deliverables added under this milestone.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {deliverables.map((deliverable, index) => {
                          const submitted = getSubmittedLinkCount(deliverable);
                          const required = getRequiredDeliverableLinks(deliverable);
                          const status = toReviewStatus(deliverable.status);
                          const deliverableId = getDeliverableId(deliverable);
                          const milestoneHistoryId = String(
                            item.milestoneHistoryId || item._id || ""
                          );
                          const hasActionIds =
                            Boolean(item.milestoneId) &&
                            Boolean(milestoneHistoryId) &&
                            Boolean(deliverableId);
                          const actionKey = `${milestoneKey}-${deliverableId}`;
                          const isUpdatingAction =
                            updatingDeliverableActionKey === actionKey;
                          const canOpenAddDeliverable =
                            canAddDeliverable &&
                            status !== "approved" &&
                            (status === "revision" || submitted < required) &&
                            hasActionIds;
                          const canReviewSubmitted = status === "submitted" && hasActionIds;

                          return (
                            <div
                              key={`${milestoneKey}-${getDeliverableId(deliverable) || index}`}
                              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3"
                            >
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-xs font-semibold text-stone-900">
                                      {getDeliverableTitle(deliverable)}
                                    </p>

                                    <Pill className={reviewBadge(status)}>
                                      {reviewLabel(status)}
                                    </Pill>
                                  </div>

                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <Pill className="bg-white text-stone-600 ring-stone-200">
                                      {formatDeliverableList(deliverable.deliveries)}
                                    </Pill>

                                    <Pill className="bg-white text-stone-600 ring-stone-200">
                                      {deliverable.aspectRatio || DASH}
                                    </Pill>

                                    <Pill className="bg-white text-stone-600 ring-stone-200">
                                      {formatPlatformList(deliverable.platforms)}
                                    </Pill>

                                    <Pill className="bg-white text-stone-600 ring-stone-200">
                                      Links {submitted}/{required}
                                    </Pill>
                                  </div>
                                </div>

                                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                                  {canOpenAddDeliverable ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onAddDeliverable(applicant, item, deliverable)
                                      }
                                      disabled={isUpdatingAction}
                                      className="inline-flex items-center gap-1.5 rounded-full border border-black bg-black px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                      Add Deliverable
                                    </button>
                                  ) : null}

                                  {canReviewSubmitted ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onRaiseRevision(applicant, item, deliverable)
                                        }
                                        disabled={isUpdatingAction}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {isUpdatingAction ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <HiOutlineRefresh className="h-3.5 w-3.5" />
                                        )}
                                        Raise Revision
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          onApproveDeliverable(applicant, item, deliverable)
                                        }
                                        disabled={isUpdatingAction}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {isUpdatingAction ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <CheckCircle2 className="h-3.5 w-3.5" />
                                        )}
                                        Approve
                                      </button>
                                    </>
                                  ) : !canOpenAddDeliverable ? (
                                    <span className="inline-flex items-center rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-stone-400">
                                      {status === "approved" ? "Approved" : "Waiting for submission"}
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              {Array.isArray(deliverable.deliverableLinks) &&
                                deliverable.deliverableLinks.length > 0 ? (
                                <div className="mt-3 space-y-1 border-t border-stone-200 pt-2">
                                  {deliverable.deliverableLinks.map((link, linkIndex) =>
                                    link?.url ? (
                                      <a
                                        key={`${link.url}-${linkIndex}`}
                                        href={normalizeUrl(link.url)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block truncate text-xs font-medium text-stone-700 underline"
                                      >
                                        {link.label || `Deliverable Link ${linkIndex + 1}`}
                                      </a>
                                    ) : null
                                  )}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ========================= Main Page ========================= */

export default function ViewCampaignPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canEditCampaigns, setCanEditCampaigns] = useState(false);
  const [currentAdminRole, setCurrentAdminRole] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [isFundsModalOpen, setIsFundsModalOpen] = useState(false);

  const [fundAmount, setFundAmount] = useState("");
  const [fundNote, setFundNote] = useState("");
  const [addingFunds, setAddingFunds] = useState(false);
  const [fundingSummary, setFundingSummary] = useState<AddFundsResponse | null>(null);

  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [applicantError, setApplicantError] = useState<string | null>(null);
  const [applicantMeta, setApplicantMeta] = useState<Meta | null>(null);
  const [applicantCount, setApplicantCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState<ApplicantStatusCounts>({});
  const [platformFilter, setPlatformFilter] = useState("all");
  const [audienceRangeFilter, setAudienceRangeFilter] = useState("all");

  const [isContracted, setIsContracted] = useState(0);
  const [topLevelContractId, setTopLevelContractId] = useState("");
  const [applicants, setApplicants] = useState<InfluencerApplicant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [applicantPage, setApplicantPage] = useState(1);
  const [applicantLimit, setApplicantLimit] = useState(10);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<-1 | 1>(-1);
  const [applicantStatusFilter, setApplicantStatusFilter] = useState("active");

  const [deliverablesLoading, setDeliverablesLoading] = useState(false);
  const [deliverablesError, setDeliverablesError] = useState<string | null>(null);
  const [deliverables, setDeliverables] = useState<DeliverableRow[]>([]);
  const [deliverableSearch, setDeliverableSearch] = useState("");
  const [deliverableStatusFilter, setDeliverableStatusFilter] = useState<"all" | ReviewStatus>("all");
  const [deliverableInfluencerFilter, setDeliverableInfluencerFilter] = useState("all");
  const [deliverablePage, setDeliverablePage] = useState(1);

  const [openMilestoneKey, setOpenMilestoneKey] = useState<string | null>(null);
  const [milestoneLoadingKey, setMilestoneLoadingKey] = useState<string | null>(null);
  const [milestoneByApplicant, setMilestoneByApplicant] = useState<Record<string, MilestoneRow[]>>({});
  const [milestoneErrorByApplicant, setMilestoneErrorByApplicant] = useState<Record<string, string>>({});

  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [selectedInf, setSelectedInf] = useState<InfluencerApplicant | null>(null);

  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const [selectedDeliverableInf, setSelectedDeliverableInf] =
    useState<InfluencerApplicant | null>(null);
  const [selectedDeliverableTarget, setSelectedDeliverableTarget] =
    useState<DeliverableSubmitTarget | null>(null);

  const [isSavingDeliverable, setIsSavingDeliverable] = useState(false);
  const [updatingDeliverableActionKey, setUpdatingDeliverableActionKey] = useState("");
  const [releasingMilestoneKey, setReleasingMilestoneKey] = useState("");

  const [deliverableForm, setDeliverableForm] = useState({
    milestoneId: "",
    milestoneHistoryId: "",
    deliverableId: "",
    title: "",
    description: "",
    deliverableLinks: [{ label: "Deliverable Link 1", url: "" }],
  });

  const [pitchFolderLoading, setPitchFolderLoading] = useState(false);
  const [pitchFolderError, setPitchFolderError] = useState<string | null>(null);
  const [assignedPitchFolder, setAssignedPitchFolder] = useState<AssignedPitchFolder | null>(null);
  const [pitchFolderSearch, setPitchFolderSearch] = useState("");

  const [reviewGeneratingKey, setReviewGeneratingKey] = useState("");
  const [reviewRegeneratingKey, setReviewRegeneratingKey] = useState("");
  const [reviewBulkGenerating, setReviewBulkGenerating] = useState(false);
  const [reviewLinksLoading, setReviewLinksLoading] = useState(false);
  const [generatedReviewGroups, setGeneratedReviewGroups] = useState<
    GeneratedReviewGroup[]
  >([]);
  const [expandedApplicantRowId, setExpandedApplicantRowId] = useState<string | null>(null);

  const [campaignRatingScope, setCampaignRatingScope] =
    useState<CampaignRatingScope>("all");
  const [campaignRatings, setCampaignRatings] = useState<CampaignRatingItem[]>([]);
  const [campaignRatingsTotal, setCampaignRatingsTotal] = useState(0);
  const [campaignRatingsPage, setCampaignRatingsPage] = useState(1);
  const [campaignRatingsLoading, setCampaignRatingsLoading] = useState(false);
  const [campaignRatingsError, setCampaignRatingsError] = useState<string | null>(null);
  const [campaignRatingStatsRows, setCampaignRatingStatsRows] = useState<CampaignRatingItem[]>([]);
  const [campaignRatingStatsTotal, setCampaignRatingStatsTotal] = useState(0);
  const [campaignRatingStatsLoading, setCampaignRatingStatsLoading] = useState(false);
  const [selectedCampaignRating, setSelectedCampaignRating] =
    useState<CampaignRatingItem | null>(null);

  useEffect(() => {
    try {
      const storedAdmin = JSON.parse(localStorage.getItem("admin") || "{}");
      const permissions = storedAdmin?.permissions ?? storedAdmin?.access ?? [];

      setCurrentAdminRole(getStoredAdminRoleForUi(storedAdmin));
      setCanEditCampaigns(
        Array.isArray(permissions)
          ? permissions.some(
            (item: any) =>
              String(item?.key || "")
                .toLowerCase()
                .replace(/[\s_-]+/g, "") === "campaigns" &&
              item?.isEdit === true
          )
          : false
      );
    } catch {
      setCurrentAdminRole("");
      setCanEditCampaigns(false);
    }
  }, []);

  useEffect(() => {
    if (!isFundsModalOpen && !showMilestoneModal && !showDeliverableModal) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isFundsModalOpen, showMilestoneModal, showDeliverableModal]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setApplicantPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setApplicantPage(1);
  }, [applicantStatusFilter, platformFilter, audienceRangeFilter]);

  useEffect(() => {
    setDeliverablePage(1);
  }, [deliverableSearch, deliverableStatusFilter, deliverableInfluencerFilter]);

  const loadCampaign = useCallback(async () => {
    if (!id) {
      setError("No campaign ID provided.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await get<ApiResponse | CampaignData>(
        `/admin/campaign/getById?id=${id}`
      );
      setCampaign((response as ApiResponse)?.data ?? (response as CampaignData));
    } catch {
      setError("Failed to load campaign details.");
      setCampaign(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCampaign();
  }, [loadCampaign]);

  const effectiveCampaignId = campaign?.campaignId || campaign?._id || id || "";
  const campaignId = effectiveCampaignId;
  const brandId = campaign?.brandId || "";
  const canManageFunds = Boolean(campaign?.brandId && effectiveCampaignId);
  const isAdminCreatedCampaign =
    String(campaign?.createdBy?.role || "").toLowerCase() === "admin";
  const isBudgetLocked = false;
  const canShowAddMilestone = currentAdminRole !== "ime";
  const canShowAddDeliverable = currentAdminRole !== "bme";

  const milestoneCampaignName =
    campaign?.campaignTitle ||
    campaign?.name ||
    campaign?.brandName ||
    "Campaign";

  const reviewCampaignId = String(campaign?._id || id || "").trim();

  const loadCampaignRatings = useCallback(async () => {
    if (!reviewCampaignId) return;

    setCampaignRatingsLoading(true);
    setCampaignRatingsError(null);

    try {
      const query = campaignRatingBuildQuery({
        page: campaignRatingsPage,
        limit: CAMPAIGN_RATINGS_PER_PAGE,
        campaignId: reviewCampaignId,
        status: "submitted",
        ...campaignRatingScopeQuery(campaignRatingScope),
      });

      const payload = await get<CampaignRatingListResponse>(
        `/campaign-reviews/admin?${query}`
      );

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to load submitted ratings.");
      }

      const rows = Array.isArray(payload?.data) ? payload.data : [];
      setCampaignRatings(rows);
      setCampaignRatingsTotal(payload?.total ?? rows.length);
    } catch (err: any) {
      setCampaignRatings([]);
      setCampaignRatingsTotal(0);
      setCampaignRatingsError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load submitted ratings."
      );
    } finally {
      setCampaignRatingsLoading(false);
    }
  }, [campaignRatingScope, campaignRatingsPage, reviewCampaignId]);

  const loadCampaignRatingStats = useCallback(async () => {
    if (!reviewCampaignId) return;

    setCampaignRatingStatsLoading(true);

    try {
      const query = campaignRatingBuildQuery({
        page: 1,
        limit: 500,
        campaignId: reviewCampaignId,
        status: "submitted",
      });

      const payload = await get<CampaignRatingListResponse>(
        `/campaign-reviews/admin?${query}`
      );

      const rows = Array.isArray(payload?.data) ? payload.data : [];
      setCampaignRatingStatsRows(rows);
      setCampaignRatingStatsTotal(payload?.total ?? rows.length);
    } catch {
      setCampaignRatingStatsRows([]);
      setCampaignRatingStatsTotal(0);
    } finally {
      setCampaignRatingStatsLoading(false);
    }
  }, [reviewCampaignId]);

  const fetchAdminCreatedCampaignApplicants = useCallback(async () => {
    const response: any = await post("/campaign-invitation/get-by-campaign", {
      campaignId: effectiveCampaignId,
    });

    const rawList = extractArrayFromInvitationResponse(response);

    const normalized = rawList
      .map(normalizeInvitationInfluencer)
      .filter((item) => item.influencerId || item.name || item.handle);

    let filtered = [...normalized];

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      filtered = filtered.filter((item) =>
        buildApplicantSearchText(item).includes(q)
      );
    }

    filtered = filtered.filter((item) =>
      matchesApplicantStatusFilter(item, applicantStatusFilter)
    );

    filtered = sortApplicantsClient(filtered, sortField, sortOrder);

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / applicantLimit));
    const safePage = Math.min(applicantPage, totalPages);
    const start = (safePage - 1) * applicantLimit;
    const paginated = filtered.slice(start, start + applicantLimit);

    if (safePage !== applicantPage) {
      setApplicantPage(safePage);
    }

    setApplicants(paginated);
    setApplicantMeta({
      total,
      page: safePage,
      limit: applicantLimit,
      totalPages,
    });
    setApplicantCount(normalized.length);
    setStatusCounts(getApplicantCounts(normalized));
    setIsContracted(0);
    setTopLevelContractId("");
  }, [
    effectiveCampaignId,
    debouncedSearch,
    applicantStatusFilter,
    sortField,
    sortOrder,
    applicantLimit,
    applicantPage,
  ]);

  const fetchApplicants = useCallback(async () => {
    if (!effectiveCampaignId) return;

    setApplicantsLoading(true);
    setApplicantError(null);

    try {
      const applyResponse = await post<ApplyListResponse>("apply/list", {
        campaignId: effectiveCampaignId,
        page: applicantPage,
        limit: applicantLimit,
        search: debouncedSearch,
        sortField,
        sortOrder,
        filterStatus: applicantStatusFilter === "all" ? "" : applicantStatusFilter,
        forceActiveForManaged: true,
      });

      const list = Array.isArray(applyResponse?.influencers)
        ? applyResponse.influencers
        : [];
      const counts = applyResponse?.statusCounts || {};
      const applyTotal = Number(
        applyResponse?.applicantCount || counts.total || list.length || 0
      );

      if (applyTotal > 0 || list.length > 0 || !isAdminCreatedCampaign) {
        setApplicantMeta(applyResponse?.meta || null);
        setApplicants(list);
        setApplicantCount(applyTotal);
        setStatusCounts(counts);
        setIsContracted(Number(applyResponse?.isContracted || 0));
        setTopLevelContractId(String(applyResponse?.contractId || ""));
        return;
      }

      await fetchAdminCreatedCampaignApplicants();
    } catch (err: any) {
      setApplicantError(err?.message || "Failed to load applicants.");
      setApplicants([]);
      setApplicantMeta(null);
      setStatusCounts({});
      setApplicantCount(0);
      setIsContracted(0);
      setTopLevelContractId("");
    } finally {
      setApplicantsLoading(false);
    }
  }, [
    effectiveCampaignId,
    applicantPage,
    applicantLimit,
    debouncedSearch,
    sortField,
    sortOrder,
    applicantStatusFilter,
    isAdminCreatedCampaign,
    fetchAdminCreatedCampaignApplicants,
  ]);

  const fetchDeliverables = useCallback(async () => {
    if (!effectiveCampaignId) return;

    setDeliverablesLoading(true);
    setDeliverablesError(null);

    try {
      const res: any = await get(`/deliverable/campaign/${effectiveCampaignId}`);
      const arr =
        (Array.isArray(res) && res) ||
        (Array.isArray(res?.data) && res.data) ||
        (Array.isArray(res?.deliverables) && res.deliverables) ||
        (Array.isArray(res?.items) && res.items) ||
        [];

      setDeliverables(mapDeliverables(arr));
    } catch (err: any) {
      setDeliverables([]);
      setDeliverablesError(err?.message || "Failed to load deliverables.");
    } finally {
      setDeliverablesLoading(false);
    }
  }, [effectiveCampaignId]);


  const fetchAssignedPitchFolder = useCallback(async () => {
    if (!effectiveCampaignId) return;

    setPitchFolderLoading(true);
    setPitchFolderError(null);

    try {
      const response = await get<AssignedPitchFolderResponse | AssignedPitchFolder>(
        `/pitch-folders/campaign/${effectiveCampaignId}`
      );

      const data = (response as AssignedPitchFolderResponse)?.data ??
        (response as AssignedPitchFolder);

      setAssignedPitchFolder(data?._id ? data : null);
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || "Failed to load assigned pitch folder.";
      setAssignedPitchFolder(null);
      setPitchFolderError(message);
    } finally {
      setPitchFolderLoading(false);
    }
  }, [effectiveCampaignId]);

  useEffect(() => {
    if (activeTab === "applicants") fetchApplicants();
  }, [activeTab, fetchApplicants]);

  useEffect(() => {
    if (activeTab === "deliverables") fetchDeliverables();
  }, [activeTab, fetchDeliverables]);


  useEffect(() => {
    if (activeTab === "pitchFolder") fetchAssignedPitchFolder();
  }, [activeTab, fetchAssignedPitchFolder]);

  useEffect(() => {
    if (activeTab === "ratings") {
      loadCampaignRatings();
      loadCampaignRatingStats();
    }
  }, [activeTab, loadCampaignRatings, loadCampaignRatingStats]);

  const handleDownloadContract = async (contractId?: string) => {
    if (!contractId) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "";
      const res = await fetch(`${baseUrl}/contract/viewPdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId }),
      });

      if (!res.ok) throw new Error("Could not download contract.");

      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = "contract.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (err: any) {
      await showErr(err?.message || "Failed to download contract.");
    }
  };

  const handleAddFunds = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    if (!campaign?.brandId || !effectiveCampaignId) {
      await showErr("Campaign details are incomplete.");
      return;
    }

    const amount = Number(fundAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      await showErr("Please enter a valid amount greater than 0.");
      return;
    }

    setAddingFunds(true);

    try {
      const response = await post<AddFundsResponse>("/admin/campaign/add-funds", {
        brandId: campaign.brandId,
        campaignId: effectiveCampaignId,
        amount,
        currency: "usd",
        note: fundNote || "Admin added campaign funds manually",
      });

      setFundingSummary(response);
      setFundAmount("");
      setFundNote("");
      setIsFundsModalOpen(false);
      await loadCampaign();
      await showSuccess("Funds added successfully.");
    } catch (err: any) {
      await showErr(err?.message || "Failed to add campaign funds.");
    } finally {
      setAddingFunds(false);
    }
  };

  const fetchMilestonesForApplicant = useCallback(
    async (
      applicant: InfluencerApplicant,
      options?: { force?: boolean; keepOpen?: boolean }
    ) => {
      const influencerId = String(applicant.influencerId || "").trim();
      const rowKey = getApplicantRowKey(applicant);

      if (!influencerId || !rowKey || !effectiveCampaignId) {
        return;
      }

      if (milestoneByApplicant[rowKey] && !options?.force) {
        setOpenMilestoneKey((prev) => {
          const next = prev === rowKey ? null : rowKey;
          setExpandedApplicantRowId(next);
          return next;
        });
        return;
      }

      if (options?.keepOpen !== false) {
        setOpenMilestoneKey(rowKey);
        setExpandedApplicantRowId(rowKey);
      }

      setMilestoneLoadingKey(rowKey);
      setMilestoneErrorByApplicant((prev) => ({ ...prev, [rowKey]: "" }));

      try {
        const response = await post<MilestonesByInfluencerResponse>(
          "/milestone/byInfluencer",
          { influencerId }
        );

        const filtered = (response?.milestones || []).filter(
          (item) => String(item.campaignId || "") === String(effectiveCampaignId)
        );

        setMilestoneByApplicant((prev) => ({
          ...prev,
          [rowKey]: filtered,
        }));
      } catch (err: any) {
        setMilestoneErrorByApplicant((prev) => ({
          ...prev,
          [rowKey]: err?.message || "Failed to load milestones.",
        }));
      } finally {
        setMilestoneLoadingKey(null);
      }
    },
    [effectiveCampaignId, milestoneByApplicant]
  );

  const handleOpenMilestoneModal = (inf: InfluencerApplicant) => {
    if (!brandId) {
      showErr("Brand ID missing for this campaign.");
      return;
    }

    if (!campaignId) {
      showErr("Campaign ID missing.");
      return;
    }

    if (!inf?.influencerId) {
      showErr("Influencer ID missing.");
      return;
    }

    if (!adminId) {
      showErr("Admin ID missing. Please login again.");
      return;
    }

    setSelectedInf(inf);
    setShowMilestoneModal(true);
  };

  const handleCloseMilestoneModal = () => {
    setShowMilestoneModal(false);
    setSelectedInf(null);
  };

  const handleOpenDeliverableModal = (
    inf: InfluencerApplicant,
    milestone?: MilestoneRow,
    deliverable?: MilestoneDeliverable
  ) => {
    if (!inf.influencerId) {
      void showErr("Influencer not found.");
      return;
    }

    if (!campaignId || !brandId) {
      void showErr("Campaign or brand information is missing.");
      return;
    }

    if (!milestone || !deliverable) {
      void showErr("Please open a milestone and select a deliverable first.");
      return;
    }

    const milestoneId = String(milestone.milestoneId || "");
    const milestoneHistoryId = String(
      milestone.milestoneHistoryId || milestone._id || ""
    );
    const deliverableId = getDeliverableId(deliverable);

    if (!milestoneId || !milestoneHistoryId || !deliverableId) {
      void showErr("Milestone or deliverable information is missing.");
      return;
    }

    setSelectedDeliverableInf(inf);
    setSelectedDeliverableTarget({
      applicant: inf,
      milestone,
      deliverable,
    });
    setDeliverableForm({
      milestoneId,
      milestoneHistoryId,
      deliverableId,
      title: getDeliverableTitle(deliverable),
      description: deliverable.comments || "",
      deliverableLinks: buildDeliverableLinkInputs(deliverable),
    });
    setShowDeliverableModal(true);
  };

  const handleCloseDeliverableModal = () => {
    if (isSavingDeliverable) return;

    setShowDeliverableModal(false);
    setSelectedDeliverableInf(null);
    setSelectedDeliverableTarget(null);
    setDeliverableForm({
      milestoneId: "",
      milestoneHistoryId: "",
      deliverableId: "",
      title: "",
      description: "",
      deliverableLinks: [{ label: "Deliverable Link 1", url: "" }],
    });
  };

  const handleSaveAdminDeliverable = async () => {
    if (!selectedDeliverableInf?.influencerId) {
      await showErr("Influencer not found.");
      return;
    }

    if (!campaignId || !brandId) {
      await showErr("Campaign or brand information is missing.");
      return;
    }

    const milestoneId = deliverableForm.milestoneId.trim();
    const milestoneHistoryId = deliverableForm.milestoneHistoryId.trim();
    const deliverableId = deliverableForm.deliverableId.trim();
    const requiredLinks = selectedDeliverableTarget?.deliverable
      ? getRequiredDeliverableLinks(selectedDeliverableTarget.deliverable)
      : 1;

    const deliverableLinks = deliverableForm.deliverableLinks
      .map((item, index) => ({
        label: String(item.label || `Deliverable Link ${index + 1}`).trim(),
        url: String(item.url || "").trim(),
      }))
      .filter((item) => item.url);

    if (!milestoneId) {
      await showErr("Milestone ID is missing.");
      return;
    }

    if (!milestoneHistoryId) {
      await showErr("Milestone history ID is missing.");
      return;
    }

    if (!deliverableId) {
      await showErr("Deliverable ID is missing.");
      return;
    }

    if (deliverableLinks.length < requiredLinks) {
      await showErr(
        `Please enter ${requiredLinks} deliverable link${requiredLinks === 1 ? "" : "s"}.`
      );
      return;
    }

    try {
      setIsSavingDeliverable(true);

      await post("/milestone/submitDeliverable", {
        influencerId: selectedDeliverableInf.influencerId,
        milestoneId,
        milestoneHistoryId,
        deliverableId,
        deliverableLinks,
      });

      const savedApplicant = selectedDeliverableInf;
      const rowKey = getApplicantRowKey(savedApplicant);

      setShowDeliverableModal(false);
      setSelectedDeliverableInf(null);
      setSelectedDeliverableTarget(null);
      setDeliverableForm({
        milestoneId: "",
        milestoneHistoryId: "",
        deliverableId: "",
        title: "",
        description: "",
        deliverableLinks: [{ label: "Deliverable Link 1", url: "" }],
      });

      setMilestoneByApplicant((prev) => {
        const next = { ...prev };
        delete next[rowKey];
        return next;
      });

      await fetchDeliverables();
      await fetchMilestonesForApplicant(savedApplicant, {
        force: true,
        keepOpen: true,
      });

      await showSuccess("Deliverable submitted successfully.");
    } catch (err: any) {
      console.error(err);
      await showErr(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to submit deliverable."
      );
    } finally {
      setIsSavingDeliverable(false);
    }
  };

  const refreshMilestoneAfterDeliverableAction = async (
    applicant: InfluencerApplicant
  ) => {
    const rowKey = getApplicantRowKey(applicant);

    setMilestoneByApplicant((prev) => {
      const next = { ...prev };
      delete next[rowKey];
      return next;
    });

    await fetchDeliverables();
    await fetchMilestonesForApplicant(applicant, {
      force: true,
      keepOpen: true,
    });
  };

  const handleRaiseRevisionFromMilestone = async (
    applicant: InfluencerApplicant,
    milestone: MilestoneRow,
    deliverable: MilestoneDeliverable
  ) => {
    const deliverableId = getDeliverableId(deliverable);
    const milestoneId = String(milestone.milestoneId || "");
    const milestoneHistoryId = String(milestone.milestoneHistoryId || milestone._id || "");
    const actionKey = `${String(
      milestone.milestoneHistoryId || milestone._id || milestone.milestoneId || ""
    )}-${deliverableId}`;

    if (!deliverableId) {
      await showErr("Deliverable ID is missing.");
      return;
    }

    if (!milestoneId || !milestoneHistoryId) {
      await showErr("Milestone information is missing.");
      return;
    }

    if (toReviewStatus(deliverable.status) !== "submitted") {
      await showErr("Revision can be raised only after deliverable submission.");
      return;
    }

    const confirm = await swal({
      title: "Raise revision?",
      text: "This will move the submitted deliverable to revision status.",
      icon: "warning",
      buttons: ["Cancel", "Raise Revision"],
      dangerMode: true,
    });

    if (!confirm) return;

    try {
      setUpdatingDeliverableActionKey(actionKey);

      await post("/milestone/updateDeliverableStatus", {
        milestoneId,
        milestoneHistoryId,
        deliverableId,
        status: "revision",
      });

      await refreshMilestoneAfterDeliverableAction(applicant);
      await showSuccess("Revision raised successfully.");
    } catch (err: any) {
      await showErr(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to raise revision."
      );
    } finally {
      setUpdatingDeliverableActionKey("");
    }
  };

  const handleApproveDeliverableFromMilestone = async (
    applicant: InfluencerApplicant,
    milestone: MilestoneRow,
    deliverable: MilestoneDeliverable
  ) => {
    const deliverableId = getDeliverableId(deliverable);
    const milestoneId = String(milestone.milestoneId || "");
    const milestoneHistoryId = String(milestone.milestoneHistoryId || milestone._id || "");
    const actionKey = `${String(
      milestone.milestoneHistoryId || milestone._id || milestone.milestoneId || ""
    )}-${deliverableId}`;

    if (!deliverableId) {
      await showErr("Deliverable ID is missing.");
      return;
    }

    if (!milestoneId || !milestoneHistoryId) {
      await showErr("Milestone information is missing.");
      return;
    }

    if (toReviewStatus(deliverable.status) !== "submitted") {
      await showErr("Deliverable can be approved only after submission.");
      return;
    }

    const confirm = await swal({
      title: "Approve deliverable?",
      text: "This will approve this submitted deliverable.",
      icon: "warning",
      buttons: ["Cancel", "Approve"],
    });

    if (!confirm) return;

    try {
      setUpdatingDeliverableActionKey(actionKey);

      await post("/milestone/approveDeliverable", {
        milestoneId,
        milestoneHistoryId,
        deliverableId,
        approvedRole: "Admin",
        approvalId: adminId || "",
      });

      await refreshMilestoneAfterDeliverableAction(applicant);
      await showSuccess("Deliverable approved successfully.");
    } catch (err: any) {
      await showErr(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to approve deliverable."
      );
    } finally {
      setUpdatingDeliverableActionKey("");
    }
  };

  const handleReleaseMilestoneFromApplicant = async (
    applicant: InfluencerApplicant,
    milestone: MilestoneRow
  ) => {
    const milestoneId = String(milestone.milestoneId || "");
    const milestoneHistoryId = String(milestone.milestoneHistoryId || milestone._id || "");
    const actionKey = milestoneHistoryId || milestoneId;

    if (!milestoneId || !milestoneHistoryId) {
      await showErr("Milestone ID or milestone history ID is missing.");
      return;
    }

    if (isMilestoneReleased(milestone)) {
      await showErr("This milestone is already released.");
      return;
    }

    if (!areAllMilestoneDeliverablesApproved(milestone)) {
      await showErr("You can release only after all deliverables are approved.");
      return;
    }

    const confirm = await swal({
      title: "Release milestone?",
      text: "This will release the milestone payout.",
      icon: "warning",
      buttons: ["Cancel", "Release"],
      dangerMode: true,
    });

    if (!confirm) return;

    try {
      setReleasingMilestoneKey(actionKey);

      await post("/milestone/release", {
        milestoneId,
        milestoneHistoryId,
      });

      await refreshMilestoneAfterDeliverableAction(applicant);

      await showSuccess("Milestone released successfully.");
    } catch (err: any) {
      await showErr(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to release milestone."
      );
    } finally {
      setReleasingMilestoneKey("");
    }
  };

  const imageUrls = useMemo(() => {
    const productImages =
      (campaign?.productImages ?? [])
        .map((img) => img.dataUrl || img.url)
        .filter(Boolean) as string[];

    if (productImages.length) return productImages;
    return resolveFileList(campaign?.images ?? []);
  }, [campaign?.productImages, campaign?.images]);

  const categoryNames = useMemo(() => {
    if (campaign?.subcategoryDetails?.length) {
      return campaign.subcategoryDetails
        .map((i) => [i.categoryName, i.name].filter(Boolean).join(" › "))
        .filter(Boolean) as string[];
    }

    return (campaign?.categories ?? [])
      .map((i) => [i.categoryName, i.subcategoryName].filter(Boolean).join(" › "))
      .filter(Boolean) as string[];
  }, [campaign?.subcategoryDetails, campaign?.categories]);

  const campaignGoals = useMemo(
    () =>
      (campaign?.campaignGoalDetails ?? [])
        .map((i) => i.goal)
        .filter(Boolean) as string[],
    [campaign?.campaignGoalDetails]
  );

  const influencerTiers = useMemo(
    () =>
      (campaign?.influencerTierDetails ?? [])
        .map((i) => [i.category, i.value].filter(Boolean).join(" · "))
        .filter(Boolean) as string[],
    [campaign?.influencerTierDetails]
  );

  const contentFormats = useMemo(
    () =>
      (campaign?.contentFormatDetails ?? [])
        .map((i) => i.format)
        .filter(Boolean) as string[],
    [campaign?.contentFormatDetails]
  );

  const contentLanguages = useMemo(
    () =>
      (campaign?.contentLanguageDetails ?? [])
        .map((i) => i.name)
        .filter(Boolean) as string[],
    [campaign?.contentLanguageDetails]
  );

  const hashtags = useMemo(
    () =>
      (campaign?.preferredHashtagDetails ?? [])
        .map((i) => i.tag)
        .filter(Boolean) as string[],
    [campaign?.preferredHashtagDetails]
  );

  const countries = useMemo(
    () =>
      (campaign?.targetCountryDetails ?? [])
        .map((i) => [i.flag, i.countryName].filter(Boolean).join(" "))
        .filter(Boolean) as string[],
    [campaign?.targetCountryDetails]
  );

  const ageRanges = useMemo(
    () =>
      (campaign?.targetAgeRangeDetails ?? [])
        .map((i) => i.range)
        .filter(Boolean) as string[],
    [campaign?.targetAgeRangeDetails]
  );

  const deliverableInfluencers = useMemo(
    () =>
      Array.from(
        new Set(deliverables.map((d) => d.influencerName).filter(Boolean))
      ).sort(),
    [deliverables]
  );


  const pitchFolderItems = useMemo(
    () => Array.isArray(assignedPitchFolder?.items) ? assignedPitchFolder.items : [],
    [assignedPitchFolder?.items]
  );

  const filteredPitchFolderItems = useMemo(() => {
    const q = pitchFolderSearch.trim().toLowerCase();
    if (!q) return pitchFolderItems;

    return pitchFolderItems.filter((item) =>
      buildPitchFolderItemSearchText(item).includes(q)
    );
  }, [pitchFolderItems, pitchFolderSearch]);

  const pitchFolderActiveCount = useMemo(
    () => pitchFolderItems.filter(getPitchFolderItemActive).length,
    [pitchFolderItems]
  );

  const filteredDeliverables = useMemo(() => {
    let list = [...deliverables];

    if (deliverableStatusFilter !== "all") {
      list = list.filter((i) => i.status === deliverableStatusFilter);
    }

    if (deliverableInfluencerFilter !== "all") {
      list = list.filter((i) => i.influencerName === deliverableInfluencerFilter);
    }

    const q = deliverableSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((i) =>
        [
          i.title,
          i.description,
          i.influencerName,
          i.milestoneTitle,
          i.status,
          i.draftLabel,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    return list.sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }, [
    deliverables,
    deliverableStatusFilter,
    deliverableInfluencerFilter,
    deliverableSearch,
  ]);

  const adminId = useMemo(() => {
    const campaignCreatedByUserId = String(campaign?.createdBy?.userId || "").trim();

    if (campaignCreatedByUserId) {
      return campaignCreatedByUserId;
    }

    if (typeof window === "undefined") return "";

    try {
      const storedAdmin = JSON.parse(localStorage.getItem("admin") || "{}");

      return String(
        storedAdmin?._id ||
        storedAdmin?.adminId ||
        storedAdmin?.id ||
        storedAdmin?.userId ||
        storedAdmin?.admin?._id ||
        storedAdmin?.admin?.adminId ||
        storedAdmin?.admin?.userId ||
        storedAdmin?.data?._id ||
        storedAdmin?.data?.adminId ||
        storedAdmin?.data?.userId ||
        ""
      );
    } catch {
      return "";
    }
  }, [campaign?.createdBy?.userId]);

  const deliverableTotalItems = filteredDeliverables.length;
  const deliverableTotalPages = Math.max(
    1,
    Math.ceil(deliverableTotalItems / DELIVERABLES_PER_PAGE)
  );
  const safeDeliverablePage = Math.min(deliverablePage, deliverableTotalPages);

  useEffect(() => {
    if (deliverablePage !== safeDeliverablePage) {
      setDeliverablePage(safeDeliverablePage);
    }
  }, [deliverablePage, safeDeliverablePage]);

  const paginatedDeliverables = useMemo(() => {
    const start = (safeDeliverablePage - 1) * DELIVERABLES_PER_PAGE;
    return filteredDeliverables.slice(start, start + DELIVERABLES_PER_PAGE);
  }, [filteredDeliverables, safeDeliverablePage]);

  const deliverableShowingFrom =
    deliverableTotalItems === 0
      ? 0
      : (safeDeliverablePage - 1) * DELIVERABLES_PER_PAGE + 1;

  const deliverableShowingTo =
    deliverableTotalItems === 0
      ? 0
      : Math.min(safeDeliverablePage * DELIVERABLES_PER_PAGE, deliverableTotalItems);

  const baseApplicants = useMemo(() => {
    return applicants.filter(isApplicantActive);
  }, [applicants]);

  const visibleApplicants = useMemo(() => {
    return baseApplicants.filter((inf) => {
      const audience = Number(inf.audienceSize || 0);
      const platformValue = normalizePlatform(inf.primaryPlatform || inf.platform || "");

      const matchesPlatform =
        platformFilter === "all" || platformValue === platformFilter;

      const matchesAudience =
        audienceRangeFilter === "all" ||
        (audienceRangeFilter === "0_10k" && audience < 10000) ||
        (audienceRangeFilter === "10k_50k" &&
          audience >= 10000 &&
          audience < 50000) ||
        (audienceRangeFilter === "50k_100k" &&
          audience >= 50000 &&
          audience < 100000) ||
        (audienceRangeFilter === "100k_500k" &&
          audience >= 100000 &&
          audience < 500000) ||
        (audienceRangeFilter === "500k_plus" && audience >= 500000);

      return matchesPlatform && matchesAudience;
    });
  }, [baseApplicants, platformFilter, audienceRangeFilter]);

  const applicantPlatformOptions = useMemo(() => {
    return Array.from(
      new Set(
        baseApplicants
          .map((inf) => normalizePlatform(inf.primaryPlatform || inf.platform || ""))
          .filter(Boolean)
      )
    ).sort();
  }, [baseApplicants]);

  const applicantTotalItems = Number(applicantMeta?.total ?? visibleApplicants.length ?? 0);
  const applicantCurrentPage = Number(applicantMeta?.page || applicantPage || 1);
  const applicantTotalPages = Number(applicantMeta?.totalPages || 1);
  const applicantPageSize = Number(applicantMeta?.limit || applicantLimit || 10);

  const applicantShowingFrom =
    applicantTotalItems === 0 ? 0 : (applicantCurrentPage - 1) * applicantPageSize + 1;

  const applicantShowingTo =
    applicantTotalItems === 0
      ? 0
      : Math.min(applicantCurrentPage * applicantPageSize, applicantTotalItems);

  const durationDays = useMemo(() => {
    if (!campaign?.startAt || !campaign?.endAt) return null;
    const start = new Date(campaign.startAt).getTime();
    const end = new Date(campaign.endAt).getTime();

    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
    return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  }, [campaign?.startAt, campaign?.endAt]);

  const canGenerateReviewLinkForApplicant = useCallback(
    (inf: InfluencerApplicant) => {
      if (!inf.influencerId) return false;
      if (!brandId) return false;
      if (!reviewCampaignId) return false;

      return isApplicantActive(inf) || inf.isCompleted === 1;
    },
    [brandId, reviewCampaignId]
  );

  const campaignRatingBrandToInfluencerCount = campaignRatingStatsRows.filter(
    (item) => item.reviewType === "brand_to_influencer"
  ).length;
  const campaignRatingInfluencerToBrandCount = campaignRatingStatsRows.filter(
    (item) => item.reviewType === "influencer_to_brand"
  ).length;
  const campaignRatingBrandToInfluencerAverage = campaignRatingAverageByType(
    campaignRatingStatsRows,
    "brand_to_influencer"
  );
  const campaignRatingInfluencerToBrandAverage = campaignRatingAverageByType(
    campaignRatingStatsRows,
    "influencer_to_brand"
  );
  const campaignRatingTotalSubmitted =
    campaignRatingStatsTotal || campaignRatingStatsRows.length;
  const campaignRatingScopeCounts: Record<CampaignRatingScope, number> = {
    all: campaignRatingTotalSubmitted,
    submitted_by_brand: campaignRatingBrandToInfluencerCount,
    given_to_brand: campaignRatingInfluencerToBrandCount,
  };
  const campaignRatingActiveScope =
    CAMPAIGN_RATING_SCOPES.find((item) => item.id === campaignRatingScope) ||
    CAMPAIGN_RATING_SCOPES[0];
  const campaignRatingTotalPages = Math.max(
    1,
    Math.ceil(
      Math.max(campaignRatingsTotal, campaignRatings.length) /
      CAMPAIGN_RATINGS_PER_PAGE
    )
  );
  const campaignRatingShowingFrom =
    campaignRatingsTotal === 0
      ? 0
      : (campaignRatingsPage - 1) * CAMPAIGN_RATINGS_PER_PAGE + 1;
  const campaignRatingShowingTo =
    campaignRatingsTotal === 0
      ? 0
      : Math.min(campaignRatingsPage * CAMPAIGN_RATINGS_PER_PAGE, campaignRatingsTotal);
  const latestCampaignRatingSubmittedAt =
    campaignRatingStatsRows
      .map((item) => campaignRatingSubmittedAt(item))
      .filter((value): value is string => Boolean(value))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ||
    null;

  const copyReviewLink = useCallback(async (url?: string) => {
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      await showSuccess("Review link copied.");
    } catch {
      await showErr("Unable to copy review link.");
    }
  }, []);

  const toggleReviewLinksForApplicant = useCallback((inf: InfluencerApplicant) => {
    const rowKey = getApplicantRowKey(inf);

    if (!rowKey) return;

    setExpandedApplicantRowId((prev) => (prev === rowKey ? null : rowKey));
  }, []);

  const openReviewLinksForApplicant = useCallback((inf: InfluencerApplicant) => {
    const rowKey = getApplicantRowKey(inf);

    if (!rowKey) return;

    setExpandedApplicantRowId(rowKey);
  }, []);

  const openReviewLinksForApplicants = useCallback((items: InfluencerApplicant[]) => {
    const firstKey = items
      .map((item) => getApplicantRowKey(item))
      .find(Boolean);

    if (!firstKey) return;

    setExpandedApplicantRowId(firstKey);
  }, []);

  const addGeneratedReviewGroup = useCallback((group: GeneratedReviewGroup) => {
    setGeneratedReviewGroups((prev) => {
      const existing = prev.find(
        (item) => item.influencerId === group.influencerId
      );

      const withoutExisting = prev.filter(
        (item) => item.influencerId !== group.influencerId
      );

      if (!existing) {
        return [group, ...prev];
      }

      const linkMap = new Map<ReviewType, GeneratedReviewLink>();

      for (const link of existing.links) {
        linkMap.set(link.reviewType, link);
      }

      for (const link of group.links) {
        linkMap.set(link.reviewType, link);
      }

      return [
        {
          ...existing,
          influencerName: group.influencerName || existing.influencerName,
          createdAt: group.createdAt || existing.createdAt,
          links: Array.from(linkMap.values()),
        },
        ...withoutExisting,
      ];
    });
  }, []);

  const getReviewGroupForApplicant = useCallback(
    (inf: InfluencerApplicant) =>
      generatedReviewGroups.find(
        (item) => item.influencerId === String(inf.influencerId || "")
      ) || null,
    [generatedReviewGroups]
  );

  const loadExistingReviewLinks = useCallback(async () => {
    if (!reviewCampaignId || !brandId) return;

    try {
      setReviewLinksLoading(true);

      const query = new URLSearchParams({
        campaignId: reviewCampaignId,
        brandId,
      });

      const payload = await get<ExistingReviewLinksResponse>(
        `/campaign-reviews/admin/links?${query.toString()}`
      );

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to load existing review links.");
      }

      const groups = Array.isArray(payload?.data) ? payload.data : [];

      setGeneratedReviewGroups((prev) => {
        const map = new Map<string, GeneratedReviewGroup>();

        for (const group of prev) {
          if (group.influencerId) map.set(group.influencerId, group);
        }

        for (const group of groups) {
          const existing = map.get(group.influencerId);

          if (!existing) {
            map.set(group.influencerId, group);
            continue;
          }

          const linkMap = new Map<ReviewType, GeneratedReviewLink>();

          for (const link of existing.links || []) {
            linkMap.set(link.reviewType, link);
          }

          for (const link of group.links || []) {
            linkMap.set(link.reviewType, link);
          }

          map.set(group.influencerId, {
            ...existing,
            influencerName: group.influencerName || existing.influencerName,
            createdAt: group.createdAt || existing.createdAt,
            links: Array.from(linkMap.values()),
          });
        }

        return Array.from(map.values());
      });
    } catch (err) {
      console.error("Failed to load existing review links:", err);
    } finally {
      setReviewLinksLoading(false);
    }
  }, [brandId, reviewCampaignId]);

  useEffect(() => {
    void loadExistingReviewLinks();
  }, [loadExistingReviewLinks]);

  const generateReviewLinksForApplicant = useCallback(
    async (
      inf: InfluencerApplicant,
      options?: {
        regenerate?: boolean;
        reviewTypes?: ReviewType[];
      }
    ) => {
      const influencerId = String(inf.influencerId || "").trim();

      if (!reviewCampaignId) {
        throw new Error("Campaign ID is missing.");
      }

      if (!brandId) {
        throw new Error("Brand ID is missing.");
      }

      if (!influencerId) {
        throw new Error("Influencer ID is missing.");
      }

      const payload = await post<GenerateReviewResponse>(
        "/campaign-reviews/admin/generate-links",
        {
          campaignId: reviewCampaignId,
          brandId,
          influencerId,
          reviewTypes: options?.reviewTypes || [
            "brand_to_influencer",
            "influencer_to_brand",
          ],
          expiresInDays: 30,
          regenerate: Boolean(options?.regenerate),
        }
      );

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to get review links.");
      }

      const links = Array.isArray(payload?.data) ? payload.data : [];

      if (!links.length) {
        throw new Error("No review links returned from server.");
      }

      const group: GeneratedReviewGroup = {
        influencerId,
        influencerName: inf.name || inf.handle || "Influencer",
        createdAt: new Date().toISOString(),
        links,
      };

      addGeneratedReviewGroup(group);
      return group;
    },
    [reviewCampaignId, brandId, addGeneratedReviewGroup]
  );

  const handleGenerateReviewLinks = useCallback(
    async (inf: InfluencerApplicant) => {
      const existingGroup = getReviewGroupForApplicant(inf);

      if (existingGroup) {
        openReviewLinksForApplicant(inf);
        return;
      }

      const key = String(inf.influencerId || inf.handle || inf.name || "review");

      try {
        setReviewGeneratingKey(key);

        const group = await generateReviewLinksForApplicant(inf, {
          regenerate: false,
        });

        openReviewLinksForApplicant(inf);

        const existingCount = group.links.filter(
          (item) => item.isExistingLink
        ).length;
        const newCount = group.links.length - existingCount;

        await showSuccess(
          existingCount > 0 && newCount === 0
            ? `Existing review link${group.links.length === 1 ? "" : "s"} ready for ${group.influencerName}. You can copy them now.`
            : `Review link${group.links.length === 1 ? "" : "s"} ready for ${group.influencerName}. You can copy them now.`
        );
      } catch (err: any) {
        await showErr(
          err?.response?.data?.message ||
          err?.message ||
          "Failed to get review links."
        );
      } finally {
        setReviewGeneratingKey("");
      }
    },
    [
      generateReviewLinksForApplicant,
      getReviewGroupForApplicant,
      openReviewLinksForApplicant,
    ]
  );

  const handleRegenerateReviewLink = useCallback(
    async (group: GeneratedReviewGroup, link: GeneratedReviewLink) => {
      const key = `${group.influencerId}:${link.reviewType}`;

      try {
        setReviewRegeneratingKey(key);

        await generateReviewLinksForApplicant(
          {
            influencerId: group.influencerId,
            name: group.influencerName,
          },
          {
            regenerate: true,
            reviewTypes: [link.reviewType],
          }
        );

        openReviewLinksForApplicant({
          influencerId: group.influencerId,
          name: group.influencerName,
        });

        await showSuccess("New review link regenerated. Old link is no longer valid.");
      } catch (err: any) {
        await showErr(
          err?.response?.data?.message ||
          err?.message ||
          "Failed to regenerate review link."
        );
      } finally {
        setReviewRegeneratingKey("");
      }
    },
    [generateReviewLinksForApplicant, openReviewLinksForApplicant]
  );

  const handleGenerateReviewLinksForAllVisible = useCallback(async () => {
    const reviewableApplicants = visibleApplicants.filter(
      canGenerateReviewLinkForApplicant
    );

    if (!reviewableApplicants.length) {
      await showErr("No active influencers available for review link generation.");
      return;
    }

    const missingApplicants = reviewableApplicants.filter(
      (inf) => !getReviewGroupForApplicant(inf)
    );

    if (!missingApplicants.length) {
      openReviewLinksForApplicants(reviewableApplicants);
      await showSuccess("Review links already exist for all visible influencers. Expand any row to copy or regenerate them.");
      return;
    }

    try {
      setReviewBulkGenerating(true);

      let successCount = 0;
      let failedCount = 0;
      const openedApplicants: InfluencerApplicant[] = [];

      for (const inf of missingApplicants) {
        try {
          await generateReviewLinksForApplicant(inf, {
            regenerate: false,
          });
          openedApplicants.push(inf);
          successCount += 1;
        } catch (err) {
          console.error("Failed to get review links:", err);
          failedCount += 1;
        }
      }

      if (openedApplicants.length) {
        openReviewLinksForApplicants(openedApplicants);
      }

      if (successCount > 0) {
        await showSuccess(
          `Review links ready for ${successCount} influencer${successCount === 1 ? "" : "s"}${failedCount ? `. ${failedCount} failed.` : "."} Rows with generated links can be expanded anytime to copy or regenerate them.`
        );
      } else {
        await showErr("Failed to get review links.");
      }
    } finally {
      setReviewBulkGenerating(false);
    }
  }, [
    visibleApplicants,
    canGenerateReviewLinkForApplicant,
    generateReviewLinksForApplicant,
    getReviewGroupForApplicant,
    openReviewLinksForApplicants,
  ]);

  const applicantColumns = useMemo<AdminTableColumn<InfluencerApplicant>[]>(
    () => [
      {
        id: "influencer",
        header: "Influencer",
        widthClassName: "min-w-[220px]",
        render: (inf) => (
          <div className="flex items-center gap-3">
            <ApplicantAvatar applicant={inf} />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-stone-900">
                {inf.name || inf.influencerName || "—"}
              </p>

              <p className="truncate text-[11px] text-stone-400">
                {inf.email || inf.handle || "—"}
              </p>

              {inf.email && inf.handle ? (
                <p className="truncate text-[10px] text-stone-400">
                  {inf.handle}
                </p>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        id: "platform",
        header: "Platform",
        align: "center",
        widthClassName: "min-w-[90px]",
        render: (inf) => {
          const platformIcon = getPlatformIcon(inf.primaryPlatform || inf.platform);

          return (
            <div className="flex items-center justify-center">
              {platformIcon ? (
                <img
                  src={platformIcon}
                  alt={prettify(inf.primaryPlatform || inf.platform)}
                  title={prettify(inf.primaryPlatform || inf.platform)}
                  className="h-4 w-4 object-contain"
                />
              ) : (
                <span className="text-xs text-stone-300">—</span>
              )}
            </div>
          );
        },
      },
      {
        id: "category",
        header: "Category",
        widthClassName: "min-w-[150px]",
        render: (inf) => (
          <span className="text-xs text-stone-600">{inf.category || "—"}</span>
        ),
      },
      {
        id: "audience",
        header: "Audience",
        widthClassName: "min-w-[110px]",
        render: (inf) => (
          <span className="text-xs font-semibold tabular-nums text-stone-800">
            {formatCompactNumber(inf.audienceSize)}
          </span>
        ),
      },
      {
        id: "engagement",
        header: "Eng.",
        widthClassName: "min-w-[90px]",
        render: (inf) => (
          <span className="text-xs tabular-nums text-stone-600">
            {formatPercent(inf.engagementRate)}
          </span>
        ),
      },
      {
        id: "tier",
        header: "Tier",
        widthClassName: "min-w-[120px]",
        render: (inf) => (
          <span className="text-xs text-stone-600">
            {prettify(inf.influencerTierResolved)}
          </span>
        ),
      },
      {
        id: "applied",
        header: "Applied",
        widthClassName: "min-w-[120px]",
        render: (inf) => (
          <span className="text-[11px] text-stone-500">
            {formatDateShort(inf.appliedAt || inf.createdAt)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        widthClassName: "min-w-[130px]",
        render: (inf) => {
          const status = getApplicantStatusMeta(inf);
          return <Pill className={status.pill}>{status.label}</Pill>;
        },
      },
    ],
    []
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 p-4">
        <div className="w-full space-y-4">
          <Skeleton className="h-5 w-32 rounded-lg" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-10 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="max-w-sm rounded-2xl border border-rose-200 bg-rose-50 px-8 py-6 text-center">
          <X className="mx-auto mb-3 h-5 w-5 text-rose-500" />
          <p className="text-sm font-semibold text-rose-700">
            {error || "Campaign not found."}
          </p>
        </div>
      </div>
    );
  }

  const c = campaign;
  const primaryTitle = c.campaignTitle || c.name || "Untitled Campaign";
  const isDraft = c.isDraft === 1;
  const editHref =
    canEditCampaigns && c.brandId && effectiveCampaignId
      ? `/admin/brands/create-campaign?brandId=${encodeURIComponent(
        c.brandId
      )}&campaignId=${encodeURIComponent(effectiveCampaignId)}`
      : null;
  const heroImage = imageUrls[0] || "";
  const heroTags = Array.from(
    new Set(
      [
        c.paymentType ? prettify(c.paymentType) : "",
        c.campaignType ? prettify(c.campaignType) : "",
        ...(c.platformSelection ?? []).slice(0, 2).map((item) => String(item || "").trim()),
      ].filter(Boolean)
    )
  );

  return (
    <div className="min-h-screen pb-16">
      <div className="w-full px-2 pt-4 sm:px-4 lg:px-5">
        <div
          className={`z-20 w-full overflow-hidden rounded-[1rem] border border-[#202124] shadow-lg ${DARK_GRADIENT}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
            <div className="flex items-center gap-2 text-white/85">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-white/85 hover:bg-white/10 hover:text-white"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back
              </button>
              <span className="select-none text-white/30">/</span>
              <span className="max-w-[220px] truncate text-sm text-white/70">
                {primaryTitle}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canManageFunds && (
                <button
                  type="button"
                  onClick={() => setIsFundsModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold text-stone-900 transition-colors hover:border-stone-600 hover:bg-stone-600 hover:text-white"
                >
                  <Wallet className="h-3.5 w-3.5" />
                  Add Funds
                </button>
              )}

              {editHref && (
                <Link
                  href={editHref}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold text-stone-900 transition-colors hover:border-stone-600 hover:bg-stone-600 hover:text-white"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Link>
              )}
            </div>
          </div>

          <div className="px-5 pb-4 pt-4">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <div className="h-[96px] w-[96px] shrink-0 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/8 shadow-md">
                  {heroImage ? (
                    <img
                      src={heroImage}
                      alt={primaryTitle}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-white/5">
                      <ImageIcon className="h-8 w-8 text-white/35" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 pt-1">
                  <div className="mb-2">
                    <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-medium text-white/90 shadow-sm">
                      {c.brandName || "—"}
                    </span>
                  </div>

                  <h1 className="max-w-4xl truncate text-[1.45rem] font-bold tracking-tight text-white sm:text-[1.7rem]">
                    {primaryTitle}
                  </h1>

                  {c.description && (
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/75">
                      {c.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-3">
                {[
                  {
                    label: "Budget",
                    value: `$${formatMoney(c.campaignBudget ?? c.budget)}`,
                  },
                  {
                    label: "Influencers",
                    value: c.numberOfInfluencers ?? 0,
                  },
                  {
                    label: "Duration",
                    value: durationDays ? `${durationDays}d` : "—",
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-[0.95rem] border border-white/10 bg-white/6 px-4 py-3"
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
                      {m.label}
                    </div>
                    <div className="mt-1 text-base font-bold text-white">
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex w-full items-center gap-4 overflow-x-auto rounded-[0.85rem] border border-white/30 bg-white px-3">
              <Tab
                label="Details"
                active={activeTab === "details"}
                onClick={() => setActiveTab("details")}
              />
              <Tab
                label="Applicants"
                active={activeTab === "applicants"}
                onClick={() => setActiveTab("applicants")}
                count={statusCounts.active || statusCounts.total || undefined}
              />
              <Tab
                label="Ratings"
                active={activeTab === "ratings"}
                onClick={() => setActiveTab("ratings")}
                count={campaignRatingTotalSubmitted || undefined}
              />
              <Tab
                label="Deliverables"
                active={activeTab === "deliverables"}
                onClick={() => setActiveTab("deliverables")}
                count={deliverables.length || undefined}
              />
              <Tab
                label="Pitch Folder"
                active={activeTab === "pitchFolder"}
                onClick={() => setActiveTab("pitchFolder")}
                count={pitchFolderItems.length || undefined}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-5">
          {activeTab === "details" && (
            <div className="space-y-3">
              <Panel title="Campaign Overview" icon={<AlignLeft className="h-3.5 w-3.5" />}>
                <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
                  <dl>
                    <Def label="Type" value={prettify(c.campaignType)} />
                    <Def label="Payment" value={prettify(c.paymentType)} />
                    <Def label="Timezone" value={c.campaignTimezone || "—"} />
                    <Def label="Start" value={formatDateShort(c.startAt)} />
                    <Def label="End" value={formatDateShort(c.endAt)} />
                  </dl>

                  <dl>
                    <Def
                      label="Budget"
                      value={`$${formatMoney(c.campaignBudget ?? c.budget)}`}
                    />
                    <Def
                      label="Follower Range"
                      value={`${formatCompactNumber(c.minFollowers)} – ${formatCompactNumber(c.maxFollowers)}`}
                    />
                    <Def label="Status" value={isDraft ? "Draft" : prettify(c.status)} />
                    <Def label="Scheduled At" value={formatDateShort(c.scheduledAt)} />
                    <Def label="Published At" value={formatDateShort(c.publishedAt)} />
                  </dl>
                </div>
              </Panel>

              <Panel title="Links & Platforms" icon={<Link2 className="h-3.5 w-3.5" />}>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    {c.productLink ? (
                      <a
                        href={normalizeUrl(c.productLink)}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
                      >
                        <span>Product Link</span>
                        <ArrowUpRight className="h-3.5 w-3.5 text-stone-400 transition-colors group-hover:text-stone-900" />
                      </a>
                    ) : null}

                    {c.videoLink ? (
                      <a
                        href={normalizeUrl(c.videoLink)}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
                      >
                        <span>Video Link</span>
                        <ArrowUpRight className="h-3.5 w-3.5 text-stone-400 transition-colors group-hover:text-stone-900" />
                      </a>
                    ) : null}

                    {!c.productLink && !c.videoLink ? (
                      <p className="text-xs text-stone-400">No external links.</p>
                    ) : null}
                  </div>

                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                      Platforms
                    </p>
                    <TagCloud items={(c.platformSelection ?? []).map(prettify)} />
                  </div>
                </div>
              </Panel>

              <Panel title="Campaign Targets" icon={<Target className="h-3.5 w-3.5" />}>
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                      Categories
                    </p>
                    <TagCloud items={categoryNames} />
                  </div>

                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                      Goals
                    </p>
                    <TagCloud items={campaignGoals} />
                  </div>

                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                      Influencer Tiers
                    </p>
                    <TagCloud items={influencerTiers} />
                  </div>
                </div>
              </Panel>

              <Panel title="Content Plan" icon={<Layers3 className="h-3.5 w-3.5" />}>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                      Formats
                    </p>
                    <TagCloud items={contentFormats} />
                  </div>

                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                      Product / Service Info
                    </p>
                    <TagCloud items={c.productServiceInfo ?? []} />
                  </div>

                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                      Extra Hashtags
                    </p>
                    <TagCloud items={c.hashtags ?? []} />
                  </div>
                </div>
              </Panel>

              <Panel title="Targeting Details" icon={<Target className="h-3.5 w-3.5" />}>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                      Content Languages
                    </p>
                    <TagCloud items={contentLanguages} />
                  </div>

                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                      Target Countries
                    </p>
                    <TagCloud items={countries} />
                  </div>

                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                      Target Age Ranges
                    </p>
                    <TagCloud items={ageRanges} />
                  </div>

                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                      Preferred Hashtags
                    </p>
                    <TagCloud items={hashtags} />
                  </div>
                </div>
              </Panel>

              <Panel title="Admin Details" icon={<Users2 className="h-3.5 w-3.5" />}>
                <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
                  <dl>
                    <Def label="Created By" value={c.createdBy?.name || "—"} />
                    <Def label="Email" value={c.createdBy?.email || "—"} />
                    <Def label="Role" value={prettify(c.createdBy?.role)} />
                    <Def label="Admin Role" value={prettify(c.createdBy?.adminRole)} />
                  </dl>

                  <dl>
                    <Def label="Created" value={formatDateShort(c.createdAt)} />
                    <Def label="Updated" value={formatDateShort(c.updatedAt)} />
                    <Def label="Ended At" value={formatDateShort(c.endedAt)} />
                    <Def label="Has Applied" value={c.hasApplied ?? 0} />
                  </dl>
                </div>

                {c.additionalNotes ? (
                  <div className="mt-4 border-t border-stone-100 pt-4">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                      Additional Notes
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-600">
                      {c.additionalNotes}
                    </p>
                  </div>
                ) : null}
              </Panel>

              {imageUrls.length > 0 && (
                <Panel title="Campaign Creatives" icon={<ImageIcon className="h-3.5 w-3.5" />}>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                    {imageUrls.map((url, i) => (
                      <div
                        key={`${url}-${i}`}
                        className="aspect-video overflow-hidden rounded-xl border border-stone-200 bg-stone-100"
                      >
                        <img
                          src={url}
                          alt={`Creative ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </Panel>
              )}
            </div>
          )}

          {activeTab === "applicants" && (
            <div className="space-y-3">
              <div className="rounded-2xl">
                <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
                  <div className="border-b border-stone-200 px-5 py-5">
                    <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-stone-900">
                      Filters
                    </h2>
                    <p className="mt-1 text-sm text-stone-500">
                      Affects the campaign table below only
                    </p>
                  </div>

                  <div className="px-5 py-6">
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(280px,1.4fr)_220px_220px_220px_auto] xl:items-end">
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                          Search
                        </p>
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                          <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search .."
                            className="h-11 rounded-[10px] border-stone-200 pl-9 text-sm text-stone-700"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                          Platform
                        </p>
                        <select
                          value={platformFilter}
                          onChange={(e) => setPlatformFilter(e.target.value)}
                          className="h-11 w-full rounded-[10px] border border-stone-200 bg-white px-3 text-sm text-stone-700 outline-none focus:ring-1 focus:ring-[#1a1a1a]/20"
                        >
                          <option value="all">All Platforms</option>
                          {applicantPlatformOptions.map((platform) => (
                            <option key={platform} value={platform}>
                              {prettify(platform)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                          Audience Range
                        </p>
                        <select
                          value={audienceRangeFilter}
                          onChange={(e) => setAudienceRangeFilter(e.target.value)}
                          className="h-11 w-full rounded-[10px] border border-stone-200 bg-white px-3 text-sm text-stone-700 outline-none focus:ring-1 focus:ring-[#1a1a1a]/20"
                        >
                          <option value="all">All Range</option>
                          <option value="0_10k">Below 10K</option>
                          <option value="10k_50k">10K - 50K</option>
                          <option value="50k_100k">50K - 100K</option>
                          <option value="100k_500k">100K - 500K</option>
                          <option value="500k_plus">500K+</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                          Sort By
                        </p>
                        <select
                          value={sortField}
                          onChange={(e) => setSortField(e.target.value)}
                          className="h-11 w-full rounded-[10px] border border-stone-200 bg-white px-3 text-sm text-stone-700 outline-none focus:ring-1 focus:ring-[#1a1a1a]/20"
                        >
                          <option value="createdAt">Date Applied</option>
                          <option value="audienceSize">Audience</option>
                          <option value="engagementRate">Engagement</option>
                          <option value="name">Name</option>
                        </select>
                      </div>

                      <div className="flex xl:justify-end">
                        <button
                          type="button"
                          onClick={fetchApplicants}
                          disabled={applicantsLoading}
                          className="inline-flex h-11 items-center justify-center rounded-[10px] border border-[#161719] bg-[linear-gradient(90deg,#111214_0%,#17181a_35%,#232427_100%)] px-4 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <HiOutlineRefresh
                            className={`mr-2 h-4 w-4 ${applicantsLoading ? "animate-spin" : ""}`}
                          />
                          Refresh
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-stone-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-stone-900">
                      Active Influencers
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      Showing {visibleApplicants.length} result
                      {visibleApplicants.length === 1 ? "" : "s"} on this page
                      {statusCounts.active !== undefined
                        ? ` • ${statusCounts.active} active total`
                        : statusCounts.total !== undefined
                          ? ` • ${statusCounts.total} total`
                          : ""}
                      . Existing generated links load automatically. Expand any row with links to copy, open, or regenerate without showing the raw URL.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateReviewLinksForAllVisible}
                    disabled={
                      reviewBulkGenerating ||
                      reviewLinksLoading ||
                      !visibleApplicants.some(canGenerateReviewLinkForApplicant)
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-900 bg-stone-900 px-4 text-xs font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-200 disabled:text-stone-500"
                  >
                    {reviewBulkGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Link2 className="h-4 w-4" />
                    )}
                    {reviewBulkGenerating
                      ? "Generating..."
                      : `Generate Missing Links (${visibleApplicants.filter((item) => canGenerateReviewLinkForApplicant(item) && !getReviewGroupForApplicant(item)).length})`}
                  </button>

                  {reviewLinksLoading ? (
                    <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 text-xs font-semibold text-stone-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Checking existing links
                    </span>
                  ) : null}
                </div>

                {applicantError ? (
                  <div className="mx-5 mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
                    {applicantError}
                  </div>
                ) : null}

                <AdminTable<InfluencerApplicant>
                  data={visibleApplicants}
                  columns={applicantColumns}
                  rowKey={(inf, index) => getApplicantRowKey(inf, `row-${index}`)}
                  loading={applicantsLoading}
                  loadingRows={8}
                  emptyTitle="No influencers found"
                  emptyDescription="No influencers found for this campaign yet."
                  containerClassName="rounded-none border-0 shadow-none"
                  tableClassName="min-w-[1180px]"
                  expandable={{
                    expandedRowId: expandedApplicantRowId,
                    onToggle: (rowId) => {
                      setExpandedApplicantRowId((prev) => {
                        const next = prev === rowId ? null : rowId;
                        if (!next) {
                          setOpenMilestoneKey((current) => (current === rowId ? null : current));
                        }
                        return next;
                      });
                    },
                    canExpand: (inf) => {
                      const rowKey = getApplicantRowKey(inf);
                      return Boolean(
                        getReviewGroupForApplicant(inf) ||
                        openMilestoneKey === rowKey ||
                        milestoneByApplicant[rowKey]?.length ||
                        milestoneErrorByApplicant[rowKey] ||
                        milestoneLoadingKey === rowKey
                      );
                    },
                    expandedRowClassName: "bg-stone-50/45",
                    expandedCellClassName: "px-4 py-4",
                    renderExpandedRow: (inf) => {
                      const rowKey = getApplicantRowKey(inf);
                      const reviewGroup = getReviewGroupForApplicant(inf);
                      const milestoneItems = milestoneByApplicant[rowKey] || [];
                      const milestoneError = milestoneErrorByApplicant[rowKey];
                      const shouldShowMilestones =
                        openMilestoneKey === rowKey ||
                        milestoneLoadingKey === rowKey ||
                        Boolean(milestoneError) ||
                        milestoneItems.length > 0;

                      return (
                        <div className="space-y-4">
                          {reviewGroup ? (
                            <ReviewLinksExpandableRow
                              group={reviewGroup}
                              applicant={inf}
                              onCopy={copyReviewLink}
                              onRegenerate={handleRegenerateReviewLink}
                              regeneratingKey={reviewRegeneratingKey}
                            />
                          ) : null}

                          {shouldShowMilestones ? (
                            <ApplicantMilestonesPanel
                              applicant={inf}
                              rowKey={rowKey}
                              loading={milestoneLoadingKey === rowKey}
                              error={milestoneError}
                              items={milestoneItems}
                              canAddDeliverable={canShowAddDeliverable}
                              onAddDeliverable={handleOpenDeliverableModal}
                              onRaiseRevision={handleRaiseRevisionFromMilestone}
                              onApproveDeliverable={handleApproveDeliverableFromMilestone}
                              onReleaseMilestone={handleReleaseMilestoneFromApplicant}
                              updatingDeliverableActionKey={updatingDeliverableActionKey}
                              releasingMilestoneKey={releasingMilestoneKey}
                            />
                          ) : null}

                          {!reviewGroup && !shouldShowMilestones ? (
                            <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-4 py-5 text-xs text-stone-400">
                              No expandable details found yet. Generate review links or view milestones first.
                            </div>
                          ) : null}
                        </div>
                      );
                    },
                  }}
                  actions={{
                    header: "Actions",
                    cellClassName: "min-w-[420px]",
                    render: (inf, index) => {
                      const rowKey = getApplicantRowKey(inf, `row-${index}`);
                      const isMilestoneOpen = openMilestoneKey === rowKey;
                      const rowContractId =
                        inf.contractId ||
                        (visibleApplicants.length === 1 ? topLevelContractId : "");
                      const reviewGenerateKey = String(
                        inf.influencerId || inf.handle || inf.name || "review"
                      );
                      const reviewGroup = getReviewGroupForApplicant(inf);
                      const isReviewLinksOpen = expandedApplicantRowId === rowKey && Boolean(reviewGroup);
                      const canGenerateLinks = canGenerateReviewLinkForApplicant(inf);
                      const isGeneratingLinks = reviewGeneratingKey === reviewGenerateKey;

                      return (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {isAdminCreatedCampaign ? (
                            <>
                              {canShowAddMilestone ? (
                                <button
                                  type="button"
                                  className="rounded-full border-black bg-white px-4 text-black hover:bg-gray-100 disabled:opacity-50 border text-[11px] font-semibold py-1.5"
                                  onClick={() => handleOpenMilestoneModal(inf)}
                                  disabled={!inf.influencerId || isBudgetLocked || !brandId}
                                >
                                  Add Milestone
                                </button>
                              ) : null}

                            </>
                          ) : rowContractId ? (
                            <button
                              type="button"
                              onClick={() => handleDownloadContract(rowContractId)}
                              className={`inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[11px] font-semibold ${PRIMARY_BUTTON}`}
                            >
                              <Download className="h-3.5 w-3.5" />
                              Contract
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => fetchMilestonesForApplicant(inf)}
                            className={`inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[11px] font-semibold ${isMilestoneOpen ? PRIMARY_BUTTON : SECONDARY_BUTTON
                              }`}
                          >
                            View Milestones
                            {isMilestoneOpen ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>

                          {canGenerateLinks ? (
                            <button
                              type="button"
                              onClick={() =>
                                reviewGroup
                                  ? toggleReviewLinksForApplicant(inf)
                                  : handleGenerateReviewLinks(inf)
                              }
                              disabled={isGeneratingLinks || (reviewLinksLoading && !reviewGroup)}
                              className={`inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${isReviewLinksOpen
                                ? PRIMARY_BUTTON
                                : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                                }`}
                            >
                              {isGeneratingLinks ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Link2 className="h-3.5 w-3.5" />
                              )}
                              {isGeneratingLinks
                                ? "Generating..."
                                : reviewLinksLoading && !reviewGroup
                                  ? "Checking..."
                                  : reviewGroup
                                    ? isReviewLinksOpen
                                      ? "Hide Review Links"
                                      : "Manage Review Links"
                                    : "Generate Links"}
                              {reviewGroup ? (
                                isReviewLinksOpen ? (
                                  <ChevronUp className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                )
                              ) : null}
                            </button>
                          ) : null}
                        </div>
                      );
                    },
                  }}
                  pagination={{
                    page: applicantCurrentPage,
                    totalPages: applicantTotalPages,
                    totalItems: applicantTotalItems,
                    limit: applicantPageSize,
                    onPageChange: setApplicantPage,
                    onLimitChange: (nextLimit) => {
                      setApplicantLimit(nextLimit);
                      setApplicantPage(1);
                    },
                    rowOptions: [10, 20, 50, 100],
                    loading: applicantsLoading,
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === "ratings" && (
            <div className="space-y-4">
              <div className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
                        <Star className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400">
                          Campaign Ratings
                        </p>
                        <h2 className="mt-0.5 text-xl font-semibold tracking-[-0.03em] text-stone-950">
                          All Submitted Ratings
                        </h2>
                      </div>
                    </div>
                  </div>

                  <div className="grid min-w-[280px] gap-2 sm:grid-cols-2">
                    {[
                      {
                        label: "Avg. Brand → Influencer",
                        value: campaignRatingStatsLoading ? "..." : campaignRatingBrandToInfluencerAverage,
                        sub: `${campaignRatingBrandToInfluencerCount} rows`,
                        icon: <Building2 className="h-3.5 w-3.5" />,
                      },
                      {
                        label: "Avg. Influencer → Brand",
                        value: campaignRatingStatsLoading ? "..." : campaignRatingInfluencerToBrandAverage,
                        sub: `${campaignRatingInfluencerToBrandCount} rows`,
                        icon: <Users2 className="h-3.5 w-3.5" />,
                      },
                    ].map((card) => (
                      <div key={card.label} className="rounded-2xl border border-stone-200 bg-stone-50/70 px-3 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] font-bold text-stone-400">{card.label}</p>
                          <span className="text-stone-400">{card.icon}</span>
                        </div>
                        <div className="mt-1 flex items-end justify-between gap-2">
                          <p className="text-lg font-semibold tracking-[-0.03em] text-stone-950">{card.value}</p>
                          <p className="text-[11px] font-medium text-stone-400">{card.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-stone-200 bg-white p-2 shadow-sm">
                <div className="grid gap-2 lg:grid-cols-3">
                  {CAMPAIGN_RATING_SCOPES.map((item) => {
                    const Icon = item.icon;
                    const active = campaignRatingScope === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setCampaignRatingScope(item.id);
                          setCampaignRatingsPage(1);
                        }}
                        className={`rounded-2xl border px-4 py-3 text-left transition ${active
                          ? "border-stone-300 bg-stone-50"
                          : "border-transparent bg-white hover:border-stone-200 hover:bg-stone-50"
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-500">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-2">
                              <span className="block text-sm font-semibold text-stone-950">{item.label}</span>
                              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${active
                                ? "border-stone-300 bg-white text-stone-900"
                                : "border-stone-200 bg-white text-stone-500"
                                }`}>
                                {campaignRatingStatsLoading ? "..." : campaignRatingScopeCounts[item.id]}
                              </span>
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-stone-400">
                              {item.hint}
                            </span>
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {campaignRatingsError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {campaignRatingsError}
                </div>
              ) : null}

              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-stone-950">
                        {campaignRatingActiveScope.label}
                      </p>
                      <CampaignRatingBadge>
                        {campaignRatingStatsLoading ? "..." : `${campaignRatingScopeCounts[campaignRatingScope]} rows`}
                      </CampaignRatingBadge>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table className="min-w-[1120px]">
                    <TableHeader>
                      <TableRow className="border-stone-100 bg-stone-50/70 hover:bg-stone-50">
                        {[
                          "Submitted By",
                          "Submitted For",
                          "Type",
                          "Rating",
                          "Answers",
                          "Submitted",
                          "Action",
                        ].map((header) => (
                          <TableHead
                            key={header}
                            className="h-9 px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400"
                          >
                            {header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {campaignRatingsLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-14 text-center text-xs text-stone-400">
                            Loading submitted ratings…
                          </TableCell>
                        </TableRow>
                      ) : campaignRatings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-14 text-center text-xs text-stone-400">
                            No submitted ratings found for this campaign.
                          </TableCell>
                        </TableRow>
                      ) : (
                        campaignRatings.map((review) => (
                          <TableRow
                            key={review._id}
                            onClick={() => setSelectedCampaignRating(review)}
                            className="cursor-pointer border-stone-100 hover:bg-stone-50/70"
                          >
                            <TableCell className="px-4 py-3">
                              <CampaignRatingEntity
                                entity={campaignRatingReviewer(review)}
                                role={review.reviewerRole}
                              />
                            </TableCell>

                            <TableCell className="px-4 py-3">
                              <CampaignRatingEntity
                                entity={campaignRatingReviewee(review)}
                                role={review.revieweeRole}
                              />
                            </TableCell>

                            <TableCell className="px-4 py-3">
                              <CampaignRatingTypeBadge type={review.reviewType} />
                            </TableCell>

                            <TableCell className="px-4 py-3">
                              <CampaignRatingPill rating={review.rating || review.noteStarRating} />
                            </TableCell>

                            <TableCell className="px-4 py-3">
                              <CampaignRatingAnswerPreview review={review} />
                            </TableCell>

                            <TableCell className="px-4 py-3 text-xs font-medium text-stone-500">
                              {formatDateTime(campaignRatingSubmittedAt(review))}
                            </TableCell>

                            <TableCell className="px-4 py-3">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedCampaignRating(review);
                                }}
                                className="inline-flex h-9 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View
                              </button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <PaginationBar
                  currentPage={campaignRatingsPage}
                  totalPages={campaignRatingTotalPages}
                  onPageChange={setCampaignRatingsPage}
                  showingFrom={campaignRatingShowingFrom}
                  showingTo={campaignRatingShowingTo}
                  totalItems={campaignRatingsTotal}
                />
              </div>

              {selectedCampaignRating
                ? createPortal(
                  <div
                    className="fixed inset-0 flex justify-end bg-stone-950/35 backdrop-blur-[2px]"
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
                    onClick={() => setSelectedCampaignRating(null)}
                  >
                    <aside
                      className="relative flex h-full w-full max-w-[780px] flex-col overflow-hidden bg-white shadow-2xl"
                      style={{ zIndex: 2147483647, height: "100dvh" }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="border-b border-stone-200 bg-white p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                            </div>
                            <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-stone-950">
                              {selectedCampaignRating.reviewTitle ||
                                campaignRatingTypeLabel(selectedCampaignRating.reviewType)}
                            </h3>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedCampaignRating(null)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 transition hover:bg-stone-50"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto bg-stone-50/70 p-5">
                        <div className="grid gap-4">
                          <div className="rounded-2xl border border-stone-200 bg-white p-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <CampaignRatingEntity
                                entity={campaignRatingReviewer(selectedCampaignRating)}
                                role={selectedCampaignRating.reviewerRole}
                              />
                              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-400">
                                <ArrowRight className="h-4 w-4" />
                              </span>
                              <CampaignRatingEntity
                                entity={campaignRatingReviewee(selectedCampaignRating)}
                                role={selectedCampaignRating.revieweeRole}
                              />
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <CampaignRatingPill
                                rating={
                                  selectedCampaignRating.rating ||
                                  selectedCampaignRating.noteStarRating
                                }
                              />
                            </div>
                          </div>

                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-2xl border border-stone-200 bg-white p-4">
                              <p className="text-sm font-semibold text-stone-950">Campaign</p>
                              <p className="mt-2 text-sm leading-6 text-stone-500">{primaryTitle}</p>
                            </div>

                            <div className="rounded-2xl border border-stone-200 bg-white p-4">
                              <p className="text-sm font-semibold text-stone-950">Submitted</p>
                              <p className="mt-2 text-sm leading-6 text-stone-500">
                                {formatDateTime(campaignRatingSubmittedAt(selectedCampaignRating))}
                              </p>
                            </div>
                          </div>

                          {selectedCampaignRating.reviewText ? (
                            <div className="rounded-2xl border border-stone-200 bg-white p-4">
                              <p className="text-sm font-semibold text-stone-950">Review Note</p>
                              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-stone-500">
                                {selectedCampaignRating.reviewText}
                              </p>
                            </div>
                          ) : null}

                          <div className="rounded-2xl border border-stone-200 bg-white p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h4 className="text-base font-semibold text-stone-950">
                                Submitted Questions & Answers
                              </h4>
                              <CampaignRatingBadge>
                                {campaignRatingAnswers(selectedCampaignRating).length} answers
                              </CampaignRatingBadge>
                            </div>

                            <div className="mt-4 grid gap-3">
                              {campaignRatingAnswers(selectedCampaignRating).length ? (
                                campaignRatingAnswers(selectedCampaignRating).map((item, index) => (
                                  <div
                                    key={`${item.question}-${index}`}
                                    className="rounded-xl border border-stone-100 bg-stone-50 p-4"
                                  >
                                    <div className="flex items-start gap-3">
                                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-stone-500 ring-1 ring-stone-200">
                                        {index + 1}
                                      </span>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-stone-950">
                                          {item.question}
                                        </p>
                                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-stone-500">
                                          {item.answer}
                                        </p>
                                        {item.score ? (
                                          <div className="mt-3">
                                            <CampaignRatingBadge>
                                              Score: {item.score}/5
                                            </CampaignRatingBadge>
                                          </div>
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 p-5 text-sm text-stone-500">
                                  This review does not include question-answer data.
                                </div>
                              )}
                            </div>
                          </div>

                          {Array.isArray(selectedCampaignRating.tags) &&
                            selectedCampaignRating.tags.length ? (
                            <div className="rounded-2xl border border-stone-200 bg-white p-4">
                              <p className="text-sm font-semibold text-stone-950">Tags</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {selectedCampaignRating.tags.map((tag) => (
                                  <CampaignRatingBadge key={tag}>
                                    {campaignRatingNormalizeText(tag)}
                                  </CampaignRatingBadge>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </aside>
                  </div>,
                  document.body
                )
                : null}
            </div>
          )}

          {activeTab === "pitchFolder" && (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-stone-200 px-5 py-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-stone-900">
                      Assigned Pitch Folder
                    </h2>
                    <p className="mt-1 text-sm text-stone-500">
                      All influencers from the pitch folder assigned to this campaign are visible here for every admin.
                    </p>
                    {assignedPitchFolder ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Pill className="bg-stone-900 text-white ring-stone-900">
                          {assignedPitchFolder.title || "Pitch Folder"}
                        </Pill>
                        <Pill className="bg-emerald-600 text-white ring-emerald-600">
                          {pitchFolderActiveCount} Active
                        </Pill>
                        <Pill className="bg-stone-100 text-stone-700 ring-stone-200">
                          {pitchFolderItems.length} Total
                        </Pill>
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={fetchAssignedPitchFolder}
                    disabled={pitchFolderLoading}
                    className="inline-flex h-11 items-center justify-center rounded-[10px] border border-[#161719] bg-[linear-gradient(90deg,#111214_0%,#17181a_35%,#232427_100%)] px-4 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <HiOutlineRefresh
                      className={`mr-2 h-4 w-4 ${pitchFolderLoading ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </button>
                </div>

                <div className="px-5 py-6">
                  <div className="relative max-w-xl">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <Input
                      value={pitchFolderSearch}
                      onChange={(e) => setPitchFolderSearch(e.target.value)}
                      placeholder="Search pitch folder influencers..."
                      className="h-11 rounded-[10px] border-stone-200 pl-9 text-sm text-stone-700"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-stone-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-stone-800">
                      Pitch Folder Influencers
                    </p>
                    <p className="text-xs text-stone-400">
                      Showing {filteredPitchFolderItems.length} of {pitchFolderItems.length} pitch folder influencer
                      {pitchFolderItems.length === 1 ? "" : "s"}.
                    </p>
                  </div>
                </div>

                {pitchFolderError ? (
                  <div className="mx-5 mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
                    {pitchFolderError}
                  </div>
                ) : null}

                <div className="overflow-x-auto">
                  <Table className="min-w-[1760px]">
                    <TableHeader>
                      <TableRow className="border-stone-100 bg-stone-50/70 hover:bg-stone-50">
                        <TableHead className="px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
                          Influencer
                        </TableHead>
                        <TableHead className="px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
                          Profile
                        </TableHead>
                        <TableHead className="px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
                          Niche
                        </TableHead>
                        <TableHead className="px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
                          Country
                        </TableHead>
                        <TableHead className="px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
                          Selection Reason
                        </TableHead>
                        <TableHead className="px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
                          Shipping Address
                        </TableHead>
                        <TableHead className="px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
                          Followers
                        </TableHead>
                        <TableHead className="px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
                          Rate Cards
                        </TableHead>
                        <TableHead className="px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
                          Media Kit Access
                        </TableHead>
                        <TableHead className="px-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
                          Fit
                        </TableHead>
                        <TableHead className="px-4 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {pitchFolderLoading ? (
                        <TableRow>
                          <TableCell colSpan={11} className="py-14 text-center text-xs text-stone-400">
                            Loading pitch folder influencers…
                          </TableCell>
                        </TableRow>
                      ) : !assignedPitchFolder ? (
                        <TableRow>
                          <TableCell colSpan={11} className="py-14 text-center text-xs text-stone-400">
                            No pitch folder is assigned to this campaign yet.
                          </TableCell>
                        </TableRow>
                      ) : filteredPitchFolderItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={11} className="py-14 text-center text-xs text-stone-400">
                            No pitch folder influencers match the current search.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPitchFolderItems.map((item) => {
                          const profileUrl = getPitchFolderItemProfileUrl(item);
                          const isActive = getPitchFolderItemActive(item);
                          const shippingAddress = getPitchFolderShippingAddress(item);
                          const latestRateCard = getLatestPitchFolderRateCard(item);
                          const hasLink = !!normalizeUrl(item.mediaKitLink?.url);
                          const hasPdf = !!String(item.mediaKit?.s3Key || '').trim();
                          const visibleSource =
                            item.mediaKitAccess?.visibleSource === "pdf"
                              ? "PDF"
                              : item.mediaKitAccess?.visibleSource === "link"
                                ? "Link"
                                : DASH;
                          const influencerLinked = Boolean(
                            item.createdInfluencerId || item.linkedInfluencer?.influencerId
                          );
                          const invitationStatus = String(item.campaignInvitation?.status || '').toLowerCase();

                          return (
                            <TableRow key={item._id} className="border-stone-100 hover:bg-stone-50/60">
                              <TableCell className="align-top px-4 py-3">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-stone-950">{item.name || DASH}</p>
                                    <Pill className="bg-stone-100 text-stone-700 ring-stone-200">
                                      {prettify(item.provider)}
                                    </Pill>
                                  </div>
                                  <p className="text-sm text-stone-500">{item.handle || DASH}</p>
                                  <div className="inline-flex items-center gap-2 text-xs text-stone-500">
                                    <Mail className="h-3.5 w-3.5" />
                                    <span>{item.email || DASH}</span>
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell className="align-top px-4 py-3">
                                {profileUrl ? (
                                  <a
                                    href={profileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    title={profileUrl}
                                    className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 hover:text-black"
                                  >
                                    <ExternalLink className="h-4 w-4 shrink-0" />
                                    <span>Profile Link</span>
                                  </a>
                                ) : (
                                  <span className="text-sm text-stone-400">{DASH}</span>
                                )}
                              </TableCell>

                              <TableCell className="align-top px-4 py-3 text-sm text-stone-700">
                                <div className="max-w-[220px] whitespace-pre-wrap break-words">
                                  {Array.isArray(item.niche) && item.niche.length
                                    ? item.niche.join(', ')
                                    : DASH}
                                </div>
                              </TableCell>

                              <TableCell className="align-top px-4 py-3 text-sm text-stone-700">
                                {item.country || DASH}
                              </TableCell>

                              <TableCell className="align-top px-4 py-3 text-sm text-stone-700">
                                <div className="max-w-[300px] whitespace-pre-wrap break-words leading-6">
                                  {item.selectionReason || DASH}
                                </div>
                              </TableCell>

                              <TableCell className="align-top px-4 py-3 text-sm text-stone-700">
                                <div className="max-w-[260px] whitespace-pre-wrap break-words leading-6">
                                  {shippingAddress || DASH}
                                </div>
                              </TableCell>

                              <TableCell className="align-top px-4 py-3 text-sm font-medium text-stone-800">
                                {formatNumber(item.followers)}
                              </TableCell>

                              <TableCell className="align-top px-4 py-3">
                                {latestRateCard ? (
                                  <div className="max-w-[280px] space-y-2">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <Pill className="bg-stone-900 text-white ring-stone-900">
                                        <FileText className="mr-1 h-3.5 w-3.5" />
                                        {latestRateCard.label}
                                      </Pill>
                                      <Pill className="bg-stone-100 text-stone-600 ring-stone-200">
                                        {latestRateCard.currency}
                                      </Pill>
                                    </div>
                                    <p className="line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-stone-600">
                                      {latestRateCard.value}
                                    </p>
                                    {latestRateCard.changedAt ? (
                                      <p className="text-[10px] font-medium text-stone-400">
                                        Latest change: {formatDateShort(latestRateCard.changedAt)}
                                      </p>
                                    ) : null}
                                  </div>
                                ) : (
                                  <span className="text-sm text-stone-400">{DASH}</span>
                                )}
                              </TableCell>

                              <TableCell className="align-top px-4 py-3">
                                <div className="min-w-[320px] rounded-2xl border border-stone-200 bg-stone-50 p-3">
                                  <div className="mb-3 flex items-start justify-between gap-2">
                                    <div>
                                      <p className="text-sm font-semibold text-stone-950">Media Kit Access</p>
                                      <p className="mt-1 text-[11px] text-stone-500">Source: {visibleSource}</p>
                                    </div>
                                    <MediaAccessBadge access={item.mediaKitAccess} />
                                  </div>

                                  <div className="mb-3 grid gap-2 rounded-xl bg-white p-3 text-xs text-stone-600">
                                    <div className="flex items-center justify-between gap-3">
                                      <span>Requested At</span>
                                      <span className="font-medium text-stone-900">
                                        {formatDateTime(item.mediaKitAccess?.requestedAt)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                      <span>Request Status</span>
                                      <MediaRequestStatusBadge value={item.mediaKitAccess?.requestStatus} />
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    <MediaAssetPill label="Link" ok={hasLink} />
                                    <MediaAssetPill label="PDF" ok={hasPdf} />
                                  </div>

                                  {hasLink ? (
                                    <a
                                      href={normalizeUrl(item.mediaKitLink?.url)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-stone-700 underline underline-offset-2 hover:text-black"
                                    >
                                      Open Media Kit Link
                                      <ArrowUpRight className="h-2.5 w-2.5" />
                                    </a>
                                  ) : null}
                                </div>
                              </TableCell>

                              <TableCell className="align-top px-4 py-3 text-center">
                                <div className="flex justify-center">
                                  <div
                                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border ${item.goodFit
                                      ? "border-rose-200 bg-rose-50"
                                      : "border-stone-200 bg-stone-50"
                                      }`}
                                    title={item.goodFit ? "Good Fit" : "Not Marked"}
                                  >
                                    <Heart
                                      className={`h-5 w-5 ${item.goodFit
                                        ? "fill-rose-500 text-rose-500"
                                        : "text-stone-300"
                                        }`}
                                    />
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell className="align-top px-4 py-3 text-right">
                                <div className="flex flex-col items-end gap-2">
                                  {influencerLinked ? (
                                    <Pill className="bg-emerald-50 text-emerald-700 ring-emerald-200">
                                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                      Already Created
                                    </Pill>
                                  ) : (
                                    <Pill className="bg-stone-100 text-stone-700 ring-stone-200">
                                      Not Created
                                    </Pill>
                                  )}

                                  {isActive ? (
                                    <Pill className="bg-stone-900 text-white ring-stone-900">
                                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                      Already Active
                                    </Pill>
                                  ) : invitationStatus ? (
                                    <Pill className="bg-blue-50 text-blue-700 ring-blue-200">
                                      <Mail className="mr-1.5 h-3.5 w-3.5" />
                                      {invitationStatus === "accepted"
                                        ? "Invitation Accepted"
                                        : invitationStatus === "reject"
                                          ? "Invitation Rejected"
                                          : invitationStatus === "failed"
                                            ? "Invitation Failed"
                                            : "Invitation Sent"}
                                    </Pill>
                                  ) : (
                                    <Pill className="bg-stone-100 text-stone-700 ring-stone-200">
                                      Not Active
                                    </Pill>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "deliverables" && (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
                <div className="border-b border-stone-200 px-5 py-5">
                  <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-stone-900">
                    Filters
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Affects the deliverables table below only
                  </p>
                </div>

                <div className="px-5 py-6">
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(280px,1.4fr)_220px_240px_auto] xl:items-end">
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                        Search
                      </p>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <Input
                          value={deliverableSearch}
                          onChange={(e) => setDeliverableSearch(e.target.value)}
                          placeholder="Search .."
                          className="h-11 rounded-[10px] border-stone-200 pl-9 text-sm text-stone-700"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                        Status
                      </p>
                      <select
                        value={deliverableStatusFilter}
                        onChange={(e) =>
                          setDeliverableStatusFilter(e.target.value as "all" | ReviewStatus)
                        }
                        className="h-11 w-full rounded-[10px] border border-stone-200 bg-white px-3 text-sm text-stone-700 outline-none focus:ring-1 focus:ring-[#1a1a1a]/20"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="submitted">Submitted</option>
                        <option value="approved">Approved</option>
                        <option value="revision">Revision</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                        Influencer
                      </p>
                      <select
                        value={deliverableInfluencerFilter}
                        onChange={(e) => setDeliverableInfluencerFilter(e.target.value)}
                        className="h-11 w-full rounded-[10px] border border-stone-200 bg-white px-3 text-sm text-stone-700 outline-none focus:ring-1 focus:ring-[#1a1a1a]/20"
                      >
                        <option value="all">All Influencers</option>
                        {deliverableInfluencers.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex xl:justify-end">
                      <button
                        type="button"
                        onClick={fetchDeliverables}
                        disabled={deliverablesLoading}
                        className="inline-flex h-11 items-center justify-center rounded-[10px] border border-[#161719] bg-[linear-gradient(90deg,#111214_0%,#17181a_35%,#232427_100%)] px-4 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <HiOutlineRefresh
                          className={`mr-2 h-4 w-4 ${deliverablesLoading ? "animate-spin" : ""}`}
                        />
                        Refresh
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-stone-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-stone-800">
                      Submitted Deliverables
                    </p>
                    <p className="text-xs text-stone-400">
                      Showing {filteredDeliverables.length} result
                      {filteredDeliverables.length === 1 ? "" : "s"} based on the current filters.
                    </p>
                  </div>
                </div>

                {deliverablesError ? (
                  <div className="mx-5 mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
                    {deliverablesError}
                  </div>
                ) : null}

                <div className="overflow-x-auto">
                  <Table className="min-w-[780px]">
                    <TableHeader>
                      <TableRow className="border-stone-100 bg-stone-50/70 hover:bg-stone-50">
                        {[
                          "Deliverable",
                          "Milestone",
                          "Influencer",
                          "Draft",
                          "Status",
                          "Submitted",
                          "Updated",
                        ].map((h) => (
                          <TableHead
                            key={h}
                            className="h-9 px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400"
                          >
                            {h}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {deliverablesLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-14 text-center text-xs text-stone-400">
                            Loading deliverables…
                          </TableCell>
                        </TableRow>
                      ) : filteredDeliverables.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-14 text-center text-xs text-stone-400">
                            No deliverables match the current filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedDeliverables.map((row) => (
                          <TableRow
                            key={row.rowKey}
                            className="border-stone-100 hover:bg-stone-50/60"
                          >
                            <TableCell className="max-w-[220px] px-4 py-2.5">
                              <p className="truncate text-xs font-semibold text-stone-900">
                                {row.title}
                              </p>
                              {row.description ? (
                                <p className="mt-0.5 line-clamp-1 text-[11px] text-stone-400">
                                  {row.description}
                                </p>
                              ) : null}
                            </TableCell>

                            <TableCell className="px-4 py-2.5 text-xs text-stone-600">
                              {row.milestoneTitle}
                            </TableCell>

                            <TableCell className="px-4 py-2.5 text-xs text-stone-600">
                              {row.influencerName}
                            </TableCell>

                            <TableCell className="px-4 py-2.5">
                              {row.linkUrl ? (
                                <a
                                  href={normalizeUrl(row.linkUrl)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-700 underline underline-offset-2 transition-colors hover:text-black"
                                >
                                  {row.draftLabel}
                                  <ArrowUpRight className="h-2.5 w-2.5" />
                                </a>
                              ) : (
                                <span className="text-xs text-stone-300">—</span>
                              )}
                            </TableCell>

                            <TableCell className="px-4 py-2.5">
                              <Pill className={reviewBadge(row.status)}>
                                {reviewLabel(row.status)}
                              </Pill>
                            </TableCell>

                            <TableCell className="px-4 py-2.5 text-[11px] text-stone-500">
                              {formatDateShort(row.submittedAt)}
                            </TableCell>

                            <TableCell className="px-4 py-2.5 text-[11px] text-stone-500">
                              {formatDateShort(row.updatedAt)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <PaginationBar
                  currentPage={safeDeliverablePage}
                  totalPages={deliverableTotalPages}
                  onPageChange={setDeliverablePage}
                  showingFrom={deliverableShowingFrom}
                  showingTo={deliverableShowingTo}
                  totalItems={deliverableTotalItems}
                />
              </div>
            </div>
          )}

          <AddMilestoneCard
            open={showMilestoneModal && Boolean(selectedInf)}
            onClose={handleCloseMilestoneModal}
            brandId={brandId || ""}
            campaignId={campaignId || ""}
            campaignName={milestoneCampaignName}
            influencerId={selectedInf?.influencerId || ""}
            influencerName={selectedInf?.name || selectedInf?.handle || "Influencer"}
            contractId=""
            adminId={adminId}
            source="admin"
            mode="create"
            influencerBudget={0}
            usedMilestoneBudget={0}
            onSubmit={async () => {
              const savedApplicant = selectedInf;

              handleCloseMilestoneModal();
              await loadCampaign();
              await fetchApplicants();

              if (savedApplicant) {
                const rowKey = getApplicantRowKey(savedApplicant, "row");

                setMilestoneByApplicant((prev) => {
                  const next = { ...prev };
                  delete next[rowKey];
                  return next;
                });

                setOpenMilestoneKey(rowKey);
                setExpandedApplicantRowId(rowKey);

                await fetchMilestonesForApplicant(savedApplicant, {
                  force: true,
                  keepOpen: true,
                });
              }
            }}
          />

          {isFundsModalOpen ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 px-4 py-6"
              onClick={() => setIsFundsModalOpen(false)}
            >
              <div
                className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[1rem] bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white px-5 py-4">
                  <div>
                    <p className="text-base font-semibold text-stone-900">
                      Add Campaign Funds
                    </p>
                    <p className="text-xs text-stone-400">
                      Add funds without leaving the campaign page.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsFundsModalOpen(false)}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${SECONDARY_BUTTON}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-5">
                  <div className="xl:col-span-3">
                    <Panel title="Add Campaign Funds" icon={<Plus className="h-3.5 w-3.5" />}>
                      <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {[
                          { label: "Campaign", value: primaryTitle },
                          { label: "Brand", value: c.brandName || "—" },
                          {
                            label: "Campaign Budget",
                            value: `$${formatMoney(c.campaignBudget ?? c.budget)}`,
                          },
                          {
                            label: "Influencer Budget",
                            value: `$${formatMoney(c.influencerBudget)}`,
                          },
                        ].map((i) => (
                          <div
                            key={i.label}
                            className="rounded-xl border border-stone-100 bg-stone-50 px-3 py-2.5"
                          >
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                              {i.label}
                            </p>
                            <p className="mt-0.5 truncate text-xs font-semibold text-stone-800">
                              {i.value}
                            </p>
                          </div>
                        ))}
                      </div>

                      <form onSubmit={handleAddFunds} className="space-y-4">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                            Amount (USD)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-stone-400">
                              $
                            </span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={fundAmount}
                              onChange={(e) => setFundAmount(e.target.value)}
                              placeholder="0.00"
                              className="h-10 rounded-xl border-stone-200 bg-white pl-7 text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                            Internal Note
                          </label>
                          <textarea
                            value={fundNote}
                            onChange={(e) => setFundNote(e.target.value)}
                            rows={4}
                            placeholder="Reason or note for this fund addition."
                            className="w-full resize-none rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-300 focus:ring-1 focus:ring-[#1a1a1a]/15"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setIsFundsModalOpen(false)}
                            className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-semibold ${SECONDARY_BUTTON}`}
                          >
                            Cancel
                          </button>

                          <button
                            type="submit"
                            disabled={!canManageFunds || addingFunds}
                            className={`inline-flex h-10 items-center gap-2 rounded-xl px-5 text-xs font-semibold ${PRIMARY_BUTTON} disabled:cursor-not-allowed disabled:opacity-50`}
                          >
                            <Wallet className="h-3.5 w-3.5" />
                            {addingFunds ? "Adding funds…" : "Add Funds"}
                          </button>
                        </div>
                      </form>
                    </Panel>
                  </div>

                  <div className="space-y-3 xl:col-span-2">
                    <Panel title="Funding Overview" icon={<Wallet className="h-3.5 w-3.5" />}>
                      <dl>
                        <Def
                          label="Campaign Budget"
                          value={`$${formatMoney(c.campaignBudget ?? c.budget)}`}
                        />
                        <Def
                          label="Influencer Budget"
                          value={`$${formatMoney(c.influencerBudget)}`}
                        />
                        <Def
                          label="Required Influencers"
                          value={c.numberOfInfluencers ?? 0}
                        />
                        <Def
                          label="Total Applicants"
                          value={c.applicantCount ?? applicantCount ?? 0}
                        />
                      </dl>
                    </Panel>

                    {fundingSummary ? (
                      <Panel title="Latest Snapshot" icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
                        <dl>
                          <Def
                            label="Added"
                            value={
                              <span className="font-bold text-emerald-700">
                                ${formatMoney(fundingSummary.addedAmount)}
                              </span>
                            }
                          />
                          <Def
                            label="Wallet Balance"
                            value={`$${formatMoney(fundingSummary.wallet.walletBalance)}`}
                          />
                          <Def
                            label="Frozen Balance"
                            value={`$${formatMoney(fundingSummary.wallet.frozenBalance)}`}
                          />
                          <Def
                            label="Usable Balance"
                            value={`$${formatMoney(fundingSummary.wallet.usableBalance)}`}
                          />
                          <Def
                            label="Campaign Frozen"
                            value={`$${formatMoney(fundingSummary.campaignFreeze.currentFrozenAmount)}`}
                          />
                          <Def
                            label="Available to Allocate"
                            value={`$${formatMoney(fundingSummary.campaignFreeze.availableToAllocate)}`}
                          />
                        </dl>
                      </Panel>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-5 py-8 text-center">
                        <Wallet className="mx-auto mb-2 h-5 w-5 text-stone-300" />
                        <p className="text-xs text-stone-400">
                          Add funds to see wallet and freeze summary.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {showDeliverableModal && selectedDeliverableInf && selectedDeliverableTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-200 bg-gray-100 px-6 py-4">
              <div className="text-black">
                <p className="text-xs uppercase tracking-wide text-black/70">
                  Add deliverable links on behalf of influencer
                </p>
                <h2 className="mt-1 text-lg font-semibold text-black">
                  {selectedDeliverableInf.name || selectedDeliverableInf.handle || "Influencer"}
                </h2>
              </div>

              <button
                type="button"
                onClick={handleCloseDeliverableModal}
                className="ml-3 text-lg leading-none text-black/80 hover:text-black"
                aria-label="Close"
                disabled={isSavingDeliverable}
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                      Milestone
                    </p>
                    <p className="mt-1 text-sm font-semibold text-stone-900">
                      {getMilestoneDisplayTitle(selectedDeliverableTarget.milestone)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                      Deliverable
                    </p>
                    <p className="mt-1 text-sm font-semibold text-stone-900">
                      {getDeliverableTitle(selectedDeliverableTarget.deliverable)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill className="bg-white text-stone-600 ring-stone-200">
                    {formatDeliverableList(selectedDeliverableTarget.deliverable.deliveries)}
                  </Pill>

                  <Pill className="bg-white text-stone-600 ring-stone-200">
                    {selectedDeliverableTarget.deliverable.aspectRatio || DASH}
                  </Pill>

                  <Pill className="bg-white text-stone-600 ring-stone-200">
                    {formatPlatformList(selectedDeliverableTarget.deliverable.platforms)}
                  </Pill>

                  <Pill className="bg-white text-stone-600 ring-stone-200">
                    Required Links: {getRequiredDeliverableLinks(selectedDeliverableTarget.deliverable)}
                  </Pill>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-stone-900">
                    Submission Links
                  </p>
                  <p className="mt-1 text-xs text-stone-400">
                    Enter one link for each required deliverable quantity.
                  </p>
                </div>

                {deliverableForm.deliverableLinks.map((link, index) => (
                  <div
                    key={`deliverable-link-input-${index}`}
                    className="grid gap-3 md:grid-cols-[160px_1fr]"
                  >
                    <div className="space-y-1">
                      <label
                        htmlFor={`deliverableLinkLabel-${index}`}
                        className="text-sm font-medium text-stone-700"
                      >
                        Link Label
                      </label>

                      <Input
                        id={`deliverableLinkLabel-${index}`}
                        value={link.label}
                        onChange={(e) =>
                          setDeliverableForm((prev) => {
                            const nextLinks = [...prev.deliverableLinks];
                            nextLinks[index] = {
                              ...nextLinks[index],
                              label: e.target.value,
                            };

                            return {
                              ...prev,
                              deliverableLinks: nextLinks,
                            };
                          })
                        }
                        placeholder={`Deliverable Link ${index + 1}`}
                      />
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor={`deliverableLinkUrl-${index}`}
                        className="text-sm font-medium text-stone-700"
                      >
                        Deliverable URL <span className="text-rose-500">*</span>
                      </label>

                      <Input
                        id={`deliverableLinkUrl-${index}`}
                        value={link.url}
                        onChange={(e) =>
                          setDeliverableForm((prev) => {
                            const nextLinks = [...prev.deliverableLinks];
                            nextLinks[index] = {
                              ...nextLinks[index],
                              url: e.target.value,
                            };

                            return {
                              ...prev,
                              deliverableLinks: nextLinks,
                            };
                          })
                        }
                        placeholder="https://drive.google.com/..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t bg-gray-50 px-6 py-3">
              <button
                type="button"
                onClick={handleCloseDeliverableModal}
                className="border-gray-300 text-black hover:bg-white border rounded-md px-4 py-2 text-sm"
                disabled={isSavingDeliverable}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveAdminDeliverable}
                disabled={!selectedDeliverableInf?.influencerId || isSavingDeliverable}
                className="bg-black text-white hover:bg-gray-800 disabled:opacity-60 rounded-md px-4 py-2 text-sm"
              >
                {isSavingDeliverable ? "Submitting..." : "Submit Deliverable"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}