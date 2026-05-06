"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  AlignLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Download,
  Image as ImageIcon,
  Layers3,
  Link2,
  Pencil,
  Plus,
  Search,
  Target,
  Users2,
  Wallet,
  X,
} from "lucide-react";
import { HiOutlineRefresh } from "react-icons/hi";

/* ========================= Types ========================= */

type TabKey = "details" | "applicants" | "deliverables" | "pitchFolder";
type ReviewStatus = "pending" | "approved" | "revision";

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
  name?: string;
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
  [key: string]: any;
};

type MilestonesByInfluencerResponse = {
  message?: string;
  milestones?: MilestoneRow[];
};

type PitchFolderCampaignActivation = {
  active?: boolean;
  campaignId?: string;
  campaignsId?: string;
  influencerId?: string | null;
  activeAt?: string | null;
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
  createdInfluencerId?: string | null;
  linkedInfluencer?: { influencerId?: string | null } | null;
  campaignActivation?: PitchFolderCampaignActivation | null;
};

type AssignedPitchFolder = {
  _id: string;
  title?: string;
  description?: string;
  assignedCampaign?: {
    campaignId?: string;
    campaignsId?: string;
    campaignTitle?: string;
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

const DELIVERABLES_PER_PAGE = 10;

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
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateShort = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const formatMoney = (v?: number | string | null) => {
  const a = Number(v ?? 0);
  if (!Number.isFinite(a)) return "0";
  return a.toLocaleString("en-US", { maximumFractionDigits: 2 });
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
  if (inf.isCompleted === 1) {
    return {
      label: "Completed",
      pill: "bg-emerald-600 text-white ring-emerald-600",
    };
  }
  if (inf.isActive === 1) {
    return {
      label: "Active",
      pill: "bg-stone-900 text-white ring-stone-900",
    };
  }
  if (inf.isShortlisted === 1) {
    return {
      label: "Shortlisted",
      pill: "bg-amber-500 text-white ring-amber-500",
    };
  }
  if (inf.isRejected === 1) {
    return {
      label: "Rejected",
      pill: "bg-rose-600 text-white ring-rose-600",
    };
  }
  if (inf.isInvited === 1) {
    return {
      label: "Invited",
      pill: "bg-violet-600 text-white ring-violet-600",
    };
  }
  if (inf.isUndecided === 1 || inf.isUndicided === 1) {
    return {
      label: "Undecided",
      pill: "bg-stone-600 text-white ring-stone-600",
    };
  }
  return {
    label: "Applied",
    pill: "bg-stone-500 text-white ring-stone-500",
  };
}

function reviewBadge(status: ReviewStatus) {
  if (status === "approved") return "bg-emerald-600 text-white ring-emerald-600";
  if (status === "revision") return "bg-amber-500 text-white ring-amber-500";
  return "bg-stone-700 text-white ring-stone-700";
}

function reviewLabel(status: ReviewStatus) {
  return status === "approved"
    ? "Approved"
    : status === "revision"
      ? "Revision"
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
    inf.handle,
    inf.primaryPlatform,
    inf.platform,
    inf.category,
    inf.influencerTierResolved,
    inf.lifecycleStatus,
    inf.lifecycleStatusRaw,
    inf.brandStatus,
    inf.statusBrand,
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
  const influencer = item?.influencer || item?.influencerDetails || item?.user || {};
  const rawStatus = String(
    item?.status ||
    item?.invitationStatus ||
    item?.lifecycleStatus ||
    item?.state ||
    ""
  ).toLowerCase();

  const defaultInvited =
    !rawStatus || ["invited", "pending", "sent"].includes(rawStatus) ? 1 : 0;

  const defaultActive = ["active", "accepted", "approved", "contracted"].includes(
    rawStatus
  )
    ? 1
    : 0;

  const defaultRejected = ["rejected", "declined"].includes(rawStatus) ? 1 : 0;
  const defaultCompleted = ["completed"].includes(rawStatus) ? 1 : 0;
  const defaultShortlisted = ["shortlisted"].includes(rawStatus) ? 1 : 0;
  const defaultUndecided = ["undecided"].includes(rawStatus) ? 1 : 0;

  return {
    influencerId: String(
      item?.influencerId ||
      influencer?._id ||
      influencer?.influencerId ||
      influencer?.id ||
      ""
    ),
    name:
      item?.name ||
      influencer?.name ||
      influencer?.fullName ||
      influencer?.fullname ||
      "—",
    handle:
      item?.handle ||
      item?.username ||
      influencer?.handle ||
      influencer?.username ||
      "",
    primaryPlatform:
      item?.primaryPlatform ||
      item?.platform ||
      influencer?.primaryPlatform ||
      influencer?.platform ||
      "",
    platform:
      item?.platform ||
      item?.primaryPlatform ||
      influencer?.platform ||
      influencer?.primaryPlatform ||
      "",
    category:
      item?.category ||
      influencer?.category ||
      influencer?.niche ||
      "",
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
      item?.invitedAt ||
      item?.createdAt ||
      influencer?.createdAt ||
      item?.updatedAt,
    isShortlisted:
      Number(item?.isShortlisted ?? influencer?.isShortlisted ?? defaultShortlisted) || 0,
    isUndicided:
      Number(item?.isUndicided ?? influencer?.isUndicided ?? 0) || 0,
    isUndecided:
      Number(item?.isUndecided ?? influencer?.isUndecided ?? defaultUndecided) || 0,
    isRejected:
      Number(item?.isRejected ?? influencer?.isRejected ?? defaultRejected) || 0,
    statusBrand: item?.statusBrand || rawStatus || "",
    statusInfluencer: item?.statusInfluencer || rawStatus || "",
    brandStatus: item?.brandStatus || rawStatus || "",
    influencerStatus: item?.influencerStatus || rawStatus || "",
    isInvited:
      Number(item?.isInvited ?? influencer?.isInvited ?? defaultInvited) || 0,
    isActive:
      Number(item?.isActive ?? influencer?.isActive ?? defaultActive) || 0,
    isCompleted:
      Number(item?.isCompleted ?? influencer?.isCompleted ?? defaultCompleted) || 0,
    lifecycleStatus: item?.lifecycleStatus || rawStatus || "",
    lifecycleStatusRaw: item?.lifecycleStatusRaw || rawStatus || "",
    isFinalUpdate: Boolean(item?.isFinalUpdate ?? influencer?.isFinalUpdate),
    contractId: item?.contractId || influencer?.contractId || "",
    modashProfile: item?.modashProfile || influencer?.modashProfile,
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

/* ========================= Main Page ========================= */

export default function ViewCampaignPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canEditCampaigns, setCanEditCampaigns] = useState(false);
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
  const [milestoneForm, setMilestoneForm] = useState({
    title: "",
    amount: "",
    description: "",
  });
  const [isSavingMilestone, setIsSavingMilestone] = useState(false);

  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const [selectedDeliverableInf, setSelectedDeliverableInf] =
    useState<InfluencerApplicant | null>(null);

  const [deliverableMilestones, setDeliverableMilestones] = useState<MilestoneRow[]>([]);
  const [deliverableMilestonesLoading, setDeliverableMilestonesLoading] = useState(false);
  const [isSavingDeliverable, setIsSavingDeliverable] = useState(false);

  const [deliverableForm, setDeliverableForm] = useState({
    milestoneHistoryId: "",
    title: "",
    description: "",
    draftLabel: "Draft",
    draftUrl: "",
  });

  const [pitchFolderLoading, setPitchFolderLoading] = useState(false);
  const [pitchFolderError, setPitchFolderError] = useState<string | null>(null);
  const [assignedPitchFolder, setAssignedPitchFolder] = useState<AssignedPitchFolder | null>(null);
  const [pitchFolderSearch, setPitchFolderSearch] = useState("");

  useEffect(() => {
    try {
      const storedAdmin = JSON.parse(localStorage.getItem("admin") || "{}");
      const permissions = storedAdmin?.permissions ?? storedAdmin?.access ?? [];
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
      setCanEditCampaigns(false);
    }
  }, []);

  useEffect(() => {
    if (!isFundsModalOpen && !showMilestoneModal) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isFundsModalOpen, showMilestoneModal]);

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
        // Pitch folder assignment is for fully-managed/admin campaigns, so
        // old ApplyCampaign rows without isActive flags must still display as Active.
        forceActiveForManaged: true,
      });

      const list = Array.isArray(applyResponse?.influencers)
        ? applyResponse.influencers
        : [];
      const counts = applyResponse?.statusCounts || {};
      const applyTotal = Number(
        applyResponse?.applicantCount || counts.total || list.length || 0
      );

      // Pitch-folder assignment stores influencers in ApplyCampaign, even for
      // admin-created / fully-managed campaigns. Only fall back to invitations
      // when there is no ApplyCampaign record for this campaign yet.
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
        setOpenMilestoneKey((prev) => (prev === rowKey ? null : rowKey));
        return;
      }

      if (options?.keepOpen !== false) {
        setOpenMilestoneKey(rowKey);
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

  const handleAddMilestone = (inf: InfluencerApplicant) => {
    setSelectedInf(inf);
    setMilestoneForm({
      title: "",
      amount: "",
      description: "",
    });
    setShowMilestoneModal(true);
  };

  const handleCloseMilestoneModal = () => {
    if (isSavingMilestone) return;
    setShowMilestoneModal(false);
    setSelectedInf(null);
    setMilestoneForm({
      title: "",
      amount: "",
      description: "",
    });
  };

  const handleSaveMilestone = async () => {
    if (!selectedInf?.influencerId) {
      await showErr("Influencer not found.");
      return;
    }

    if (!campaignId || !brandId) {
      await showErr("Campaign or brand information is missing.");
      return;
    }

    const title = milestoneForm.title.trim();
    const description = milestoneForm.description.trim();
    const amountNum = Number(milestoneForm.amount);

    if (!title) {
      await showErr("Please enter milestone title.");
      return;
    }

    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      await showErr("Please enter a valid amount.");
      return;
    }

    try {
      setIsSavingMilestone(true);

      await post("milestone/create", {
        influencerId: selectedInf.influencerId,
        campaignId,
        milestoneTitle: title,
        amount: amountNum,
        milestoneDescription: description,
        brandId,
        paymentProvider: "admin",
      });

      const savedApplicant = selectedInf;
      const rowKey = getApplicantRowKey(savedApplicant);

      setMilestoneByApplicant((prev) => {
        const next = { ...prev };
        delete next[rowKey];
        return next;
      });

      setShowMilestoneModal(false);
      setSelectedInf(null);
      setMilestoneForm({ title: "", amount: "", description: "" });
      setApplicantPage(1);

      await loadCampaign();
      await fetchApplicants();
      await fetchMilestonesForApplicant(savedApplicant, {
        force: true,
        keepOpen: true,
      });

      await showSuccess("Milestone added successfully.");
    } catch (err: any) {
      console.error(err);
      await showErr(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create milestone."
      );
    } finally {
      setIsSavingMilestone(false);
    }
  };

  const handleOpenDeliverableModal = async (inf: InfluencerApplicant) => {
    if (!inf.influencerId) {
      await showErr("Influencer not found.");
      return;
    }

    if (!campaignId || !brandId) {
      await showErr("Campaign or brand information is missing.");
      return;
    }

    setSelectedDeliverableInf(inf);
    setDeliverableForm({
      milestoneHistoryId: "",
      title: "",
      description: "",
      draftLabel: "Draft",
      draftUrl: "",
    });

    setDeliverableMilestones([]);
    setDeliverableMilestonesLoading(true);
    setShowDeliverableModal(true);

    try {
      const response = await post<MilestonesByInfluencerResponse>(
        "/milestone/byInfluencer",
        { influencerId: inf.influencerId }
      );

      const filtered = (response?.milestones || []).filter(
        (item) => String(item.campaignId || "") === String(effectiveCampaignId)
      );

      setDeliverableMilestones(filtered);

      if (filtered.length === 1) {
        const only = filtered[0];
        setDeliverableForm((prev) => ({
          ...prev,
          milestoneHistoryId: String(
            only.milestoneHistoryId || only._id || only.milestoneId || ""
          ),
          title: getMilestoneDisplayTitle(only),
        }));
      }
    } catch (err: any) {
      await showErr(err?.message || "Failed to load milestones.");
    } finally {
      setDeliverableMilestonesLoading(false);
    }
  };

  const handleCloseDeliverableModal = () => {
    if (isSavingDeliverable) return;

    setShowDeliverableModal(false);
    setSelectedDeliverableInf(null);
    setDeliverableMilestones([]);
    setDeliverableForm({
      milestoneHistoryId: "",
      title: "",
      description: "",
      draftLabel: "Draft",
      draftUrl: "",
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

    const milestoneHistoryId = deliverableForm.milestoneHistoryId.trim();
    const title = deliverableForm.title.trim();
    const description = deliverableForm.description.trim();
    const draftLabel = deliverableForm.draftLabel.trim() || "Draft";
    const draftUrl = deliverableForm.draftUrl.trim();

    if (!milestoneHistoryId) {
      await showErr("Please select milestone.");
      return;
    }

    if (!title) {
      await showErr("Please enter deliverable title.");
      return;
    }

    if (!draftUrl) {
      await showErr("Please enter deliverable URL.");
      return;
    }

    try {
      setIsSavingDeliverable(true);

      await post("/deliverable/admin/create", {
        brandId,
        campaignId,
        influencerId: selectedDeliverableInf.influencerId,
        milestoneHistoryId,
        title,
        description,
        url: [
          {
            label: draftLabel,
            url: draftUrl,
          },
        ],
      });

      const savedApplicant = selectedDeliverableInf;

      setShowDeliverableModal(false);
      setSelectedDeliverableInf(null);
      setDeliverableMilestones([]);
      setDeliverableForm({
        milestoneHistoryId: "",
        title: "",
        description: "",
        draftLabel: "Draft",
        draftUrl: "",
      });

      await fetchDeliverables();
      await fetchMilestonesForApplicant(savedApplicant, {
        force: true,
        keepOpen: true,
      });

      setActiveTab("deliverables");
      await showSuccess("Deliverable added on behalf of influencer.");
    } catch (err: any) {
      console.error(err);
      await showErr(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create deliverable."
      );
    } finally {
      setIsSavingDeliverable(false);
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
                <div className="flex flex-col gap-2 border-b border-stone-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-stone-800">
                      Active Influencers
                    </p>
                    <p className="text-xs text-stone-400">
                      Showing {visibleApplicants.length} result
                      {visibleApplicants.length === 1 ? "" : "s"} on this page
                      {statusCounts.active !== undefined
                        ? ` • ${statusCounts.active} active total`
                        : statusCounts.total !== undefined
                          ? ` • ${statusCounts.total} total`
                          : ""}
                      .
                    </p>
                  </div>
                </div>

                {applicantError ? (
                  <div className="mx-5 mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
                    {applicantError}
                  </div>
                ) : null}

                <div className="overflow-x-auto">
                  <Table className="min-w-[1180px]">
                    <TableHeader>
                      <TableRow className="border-stone-100 bg-stone-50/70 hover:bg-stone-50">
                        {[
                          "Influencer",
                          "Platform",
                          "Category",
                          "Audience",
                          "Eng.",
                          "Tier",
                          "Applied",
                          "Status",
                          "Actions",
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
                      {applicantsLoading ? (
                        <TableRow>
                          <TableCell colSpan={9} className="py-14 text-center text-xs text-stone-400">
                            Loading applicants…
                          </TableCell>
                        </TableRow>
                      ) : visibleApplicants.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="py-14 text-center text-xs text-stone-400">
                            No influencers found for this campaign yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        visibleApplicants.map((inf, index) => {
                          const status = getApplicantStatusMeta(inf);
                          const rowContractId =
                            inf.contractId ||
                            (visibleApplicants.length === 1 ? topLevelContractId : "");
                          const platformIcon = getPlatformIcon(
                            inf.primaryPlatform || inf.platform
                          );
                          const rowKey = getApplicantRowKey(
                            inf,
                            `row-${index}`
                          );
                          const isMilestoneOpen = openMilestoneKey === rowKey;
                          const milestoneItems = milestoneByApplicant[rowKey] || [];
                          const milestoneError = milestoneErrorByApplicant[rowKey];

                          return (
                            <React.Fragment key={`${rowKey}-${index}`}>
                              <TableRow className="border-stone-100 hover:bg-stone-50/60">
                                <TableCell className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <ApplicantAvatar applicant={inf} />
                                    <div className="min-w-0">
                                      <p className="truncate text-xs font-semibold text-stone-900">
                                        {inf.name || "—"}
                                      </p>
                                      <p className="truncate text-[11px] text-stone-400">
                                        {inf.handle || "—"}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>

                                <TableCell className="px-4 py-3">
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
                                </TableCell>

                                <TableCell className="px-4 py-3 text-xs text-stone-600">
                                  {inf.category || "—"}
                                </TableCell>

                                <TableCell className="px-4 py-3 text-xs font-semibold tabular-nums text-stone-800">
                                  {formatCompactNumber(inf.audienceSize)}
                                </TableCell>

                                <TableCell className="px-4 py-3 text-xs tabular-nums text-stone-600">
                                  {formatPercent(inf.engagementRate)}
                                </TableCell>

                                <TableCell className="px-4 py-3 text-xs text-stone-600">
                                  {prettify(inf.influencerTierResolved)}
                                </TableCell>

                                <TableCell className="px-4 py-3 text-[11px] text-stone-500">
                                  {formatDateShort(inf.appliedAt || inf.createdAt)}
                                </TableCell>

                                <TableCell className="px-4 py-3">
                                  <Pill className={status.pill}>{status.label}</Pill>
                                </TableCell>

                                <TableCell className="px-4 py-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {isAdminCreatedCampaign ? (
                                      <>
                                        <button
                                          type="button"
                                          className="rounded-full border-black bg-white px-4 text-black hover:bg-gray-100 disabled:opacity-50 border text-[11px] font-semibold py-1.5"
                                          onClick={() => handleAddMilestone(inf)}
                                          disabled={!inf.influencerId || isBudgetLocked || !brandId}
                                        >
                                          Add Milestone
                                        </button>
                                        <button
                                          type="button"
                                          className="rounded-full border-black bg-black px-4 text-white hover:bg-gray-800 disabled:opacity-50 border text-[11px] font-semibold py-1.5"
                                          onClick={() => handleOpenDeliverableModal(inf)}
                                          disabled={!inf.influencerId || !brandId || !campaignId}
                                        >
                                          Add Deliverable
                                        </button>
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
                                  </div>
                                </TableCell>
                              </TableRow>

                              {isMilestoneOpen ? (
                                <TableRow className="border-stone-100 bg-stone-50/45">
                                  <TableCell colSpan={9} className="px-4 py-4">
                                    <div className="rounded-2xl border border-stone-200 bg-white p-4">
                                      <div className="mb-3 flex items-center justify-between gap-3">
                                        <div>
                                          <p className="text-sm font-semibold text-stone-900">
                                            Milestones
                                          </p>
                                          <p className="text-xs text-stone-400">
                                            For {inf.name || inf.handle || "this influencer"} in this campaign
                                          </p>
                                        </div>
                                      </div>

                                      {milestoneLoadingKey === rowKey ? (
                                        <p className="py-4 text-xs text-stone-400">
                                          Loading milestones…
                                        </p>
                                      ) : milestoneError ? (
                                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
                                          {milestoneError}
                                        </div>
                                      ) : milestoneItems.length === 0 ? (
                                        <p className="py-4 text-xs text-stone-400">
                                          No milestones found for this campaign and influencer.
                                        </p>
                                      ) : (
                                        <div className="space-y-3">
                                          {milestoneItems.map((item, itemIndex) => {
                                            const milestoneStatus = getMilestoneStatusPill(item);

                                            return (
                                              <div
                                                key={`${rowKey}-${item.milestoneHistoryId || item.milestoneId || itemIndex}`}
                                                className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3"
                                              >
                                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                                  <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold text-stone-900">
                                                      {getMilestoneDisplayTitle(item)}
                                                    </p>

                                                    {getMilestoneDisplayDescription(item) ? (
                                                      <p className="mt-1 text-xs leading-relaxed text-stone-500">
                                                        {getMilestoneDisplayDescription(item)}
                                                      </p>
                                                    ) : null}

                                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                                      <Pill className={milestoneStatus.className}>
                                                        {milestoneStatus.label}
                                                      </Pill>

                                                      <Pill className="bg-stone-900 text-white ring-stone-900">
                                                        ${formatMoney(item.amount)}
                                                      </Pill>
                                                    </div>
                                                  </div>

                                                  <div className="grid min-w-[210px] grid-cols-1 gap-1 text-right">
                                                    <span className="text-[11px] text-stone-400">
                                                      Created: {formatDateShort(item.createdAt)}
                                                    </span>
                                                    <span className="text-[11px] text-stone-400">
                                                      Released: {formatDateShort(item.releasedAt)}
                                                    </span>
                                                    <span className="text-[11px] text-stone-400">
                                                      Updated: {formatDateShort(item.updatedAt)}
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ) : null}
                            </React.Fragment>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                <PaginationBar
                  currentPage={applicantCurrentPage}
                  totalPages={applicantTotalPages}
                  onPageChange={setApplicantPage}
                  showingFrom={applicantShowingFrom}
                  showingTo={applicantShowingTo}
                  totalItems={applicantTotalItems}
                />
              </div>
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
                  <Table className="min-w-[1500px]">
                    <TableHeader>
                      <TableRow className="border-stone-100 bg-stone-50/70 hover:bg-stone-50">
                        {[
                          "Influencer",
                          "Platform",
                          "Niche",
                          "Country",
                          "Followers",
                          "Selection Reason",
                          "Shipping Address",
                          "Rate Card",
                          "Fit",
                          "Campaign",
                          "Profile",
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
                          const platformIcon = getPlatformIcon(item.provider);
                          const isActive = getPitchFolderItemActive(item);
                          const shippingAddress = getPitchFolderShippingAddress(item);
                          const latestRateCard = getLatestPitchFolderRateCard(item);

                          return (
                            <TableRow key={item._id} className="border-stone-100 hover:bg-stone-50/60">
                              <TableCell className="px-4 py-3">
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold text-stone-900">
                                    {item.name || "—"}
                                  </p>
                                  <p className="truncate text-[11px] text-stone-400">
                                    {item.handle || "—"}
                                  </p>
                                  <p className="mt-1 truncate text-[11px] text-stone-400">
                                    {item.email || "—"}
                                  </p>
                                </div>
                              </TableCell>

                              <TableCell className="px-4 py-3">
                                <div className="flex items-center justify-center">
                                  {platformIcon ? (
                                    <img
                                      src={platformIcon}
                                      alt={prettify(item.provider)}
                                      title={prettify(item.provider)}
                                      className="h-4 w-4 object-contain"
                                    />
                                  ) : (
                                    <span className="text-xs text-stone-300">—</span>
                                  )}
                                </div>
                              </TableCell>

                              <TableCell className="max-w-[180px] px-4 py-3 text-xs text-stone-600">
                                <span className="line-clamp-2">
                                  {Array.isArray(item.niche) && item.niche.length ? item.niche.join(", ") : "—"}
                                </span>
                              </TableCell>

                              <TableCell className="px-4 py-3 text-xs text-stone-600">
                                {item.country || "—"}
                              </TableCell>

                              <TableCell className="px-4 py-3 text-xs font-semibold tabular-nums text-stone-800">
                                {formatCompactNumber(item.followers)}
                              </TableCell>

                              <TableCell className="max-w-[260px] px-4 py-3 text-xs text-stone-600">
                                <span className="line-clamp-2">
                                  {item.selectionReason || "—"}
                                </span>
                              </TableCell>

                              <TableCell className="max-w-[260px] px-4 py-3 text-xs text-stone-600">
                                <span className="line-clamp-3 whitespace-pre-wrap">
                                  {shippingAddress || "—"}
                                </span>
                              </TableCell>

                              <TableCell className="max-w-[300px] px-4 py-3 text-xs text-stone-600">
                                {latestRateCard ? (
                                  <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <Pill className="bg-stone-900 text-white ring-stone-900">
                                        {latestRateCard.label}
                                      </Pill>
                                      <Pill className="bg-stone-100 text-stone-600 ring-stone-200">
                                        {latestRateCard.currency}
                                      </Pill>
                                    </div>
                                    <p className="line-clamp-3 whitespace-pre-wrap leading-5 text-stone-600">
                                      {latestRateCard.value}
                                    </p>
                                    {latestRateCard.changedAt ? (
                                      <p className="text-[10px] font-medium text-stone-400">
                                        Latest change: {formatDateShort(latestRateCard.changedAt)}
                                      </p>
                                    ) : null}
                                  </div>
                                ) : (
                                  <span className="text-xs text-stone-300">—</span>
                                )}
                              </TableCell>

                              <TableCell className="px-4 py-3">
                                {item.goodFit ? (
                                  <Pill className="bg-rose-600 text-white ring-rose-600">Good Fit</Pill>
                                ) : (
                                  <Pill className="bg-stone-100 text-stone-600 ring-stone-200">Not Marked</Pill>
                                )}
                              </TableCell>

                              <TableCell className="px-4 py-3">
                                {isActive ? (
                                  <Pill className="bg-emerald-600 text-white ring-emerald-600">Already Active</Pill>
                                ) : (
                                  <Pill className="bg-stone-100 text-stone-600 ring-stone-200">Not Active</Pill>
                                )}
                              </TableCell>

                              <TableCell className="px-4 py-3">
                                {profileUrl ? (
                                  <a
                                    href={profileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-700 underline underline-offset-2 transition-colors hover:text-black"
                                  >
                                    Open
                                    <ArrowUpRight className="h-2.5 w-2.5" />
                                  </a>
                                ) : (
                                  <span className="text-xs text-stone-300">—</span>
                                )}
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

          {showMilestoneModal && selectedInf ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
              <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                <div className="flex items-start justify-between border-b border-gray-200 bg-gray-100 px-6 py-4">
                  <div className="text-black">
                    <p className="text-xs uppercase tracking-wide text-black/70">
                      Create milestone
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-black">
                      {selectedInf.name}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={handleCloseMilestoneModal}
                    className="ml-3 text-lg leading-none text-black/80 hover:text-black"
                    aria-label="Close"
                    disabled={isSavingMilestone}
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-5 px-6 py-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label
                        htmlFor="milestoneTitle"
                        className="text-sm font-medium text-stone-700"
                      >
                        Milestone Title
                      </label>
                      <Input
                        id="milestoneTitle"
                        value={milestoneForm.title}
                        onChange={(e) =>
                          setMilestoneForm((f) => ({
                            ...f,
                            title: e.target.value,
                          }))
                        }
                        placeholder="Enter milestone title"
                      />
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="milestoneAmount"
                        className="text-sm font-medium text-stone-700"
                      >
                        Amount
                      </label>
                      <Input
                        id="milestoneAmount"
                        value={milestoneForm.amount}
                        onChange={(e) =>
                          setMilestoneForm((f) => ({
                            ...f,
                            amount: e.target.value,
                          }))
                        }
                        type="number"
                        placeholder="Enter amount"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="milestoneDesc"
                      className="text-sm font-medium text-stone-700"
                    >
                      Milestone Description
                    </label>
                    <textarea
                      id="milestoneDesc"
                      value={milestoneForm.description}
                      onChange={(e) =>
                        setMilestoneForm((f) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Enter milestone description"
                      rows={4}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t bg-gray-50 px-6 py-3">
                  <button
                    onClick={handleCloseMilestoneModal}
                    className="border-gray-300 text-black hover:bg-white border rounded-md px-4 py-2 text-sm"
                    disabled={isSavingMilestone}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleSaveMilestone}
                    disabled={
                      !selectedInf?.influencerId ||
                      isSavingMilestone ||
                      isBudgetLocked
                    }
                    className="bg-black text-white hover:bg-gray-800 disabled:opacity-60 rounded-md px-4 py-2 text-sm"
                  >
                    {isSavingMilestone ? "Saving..." : "Add Milestone"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

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
      {showDeliverableModal && selectedDeliverableInf ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-200 bg-gray-100 px-6 py-4">
              <div className="text-black">
                <p className="text-xs uppercase tracking-wide text-black/70">
                  Add deliverable on behalf of influencer
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
              <div className="space-y-1">
                <label
                  htmlFor="deliverableMilestone"
                  className="text-sm font-medium text-stone-700"
                >
                  Milestone
                </label>

                <select
                  id="deliverableMilestone"
                  value={deliverableForm.milestoneHistoryId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const selectedMilestone = deliverableMilestones.find(
                      (item) =>
                        String(item.milestoneHistoryId || item._id || item.milestoneId || "") ===
                        selectedId
                    );

                    setDeliverableForm((prev) => ({
                      ...prev,
                      milestoneHistoryId: selectedId,
                      title: prev.title || (selectedMilestone ? getMilestoneDisplayTitle(selectedMilestone) : ""),
                    }));
                  }}
                  disabled={deliverableMilestonesLoading}
                  className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-black disabled:opacity-60"
                >
                  <option value="">
                    {deliverableMilestonesLoading ? "Loading milestones..." : "Select milestone"}
                  </option>

                  {deliverableMilestones.map((item, index) => {
                    const value = String(
                      item.milestoneHistoryId || item._id || item.milestoneId || ""
                    );

                    if (!value) return null;

                    return (
                      <option key={`${value}-${index}`} value={value}>
                        {getMilestoneDisplayTitle(item)} · ${formatMoney(item.amount)}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="deliverableTitle"
                  className="text-sm font-medium text-stone-700"
                >
                  Deliverable Title
                </label>

                <Input
                  id="deliverableTitle"
                  value={deliverableForm.title}
                  onChange={(e) =>
                    setDeliverableForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Enter deliverable title"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="deliverableDesc"
                  className="text-sm font-medium text-stone-700"
                >
                  Description
                </label>

                <textarea
                  id="deliverableDesc"
                  value={deliverableForm.description}
                  onChange={(e) =>
                    setDeliverableForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Enter deliverable description"
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                <div className="space-y-1">
                  <label
                    htmlFor="deliverableDraftLabel"
                    className="text-sm font-medium text-stone-700"
                  >
                    Draft Label
                  </label>

                  <Input
                    id="deliverableDraftLabel"
                    value={deliverableForm.draftLabel}
                    onChange={(e) =>
                      setDeliverableForm((prev) => ({
                        ...prev,
                        draftLabel: e.target.value,
                      }))
                    }
                    placeholder="Draft"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="deliverableDraftUrl"
                    className="text-sm font-medium text-stone-700"
                  >
                    Deliverable URL
                  </label>

                  <Input
                    id="deliverableDraftUrl"
                    value={deliverableForm.draftUrl}
                    onChange={(e) =>
                      setDeliverableForm((prev) => ({
                        ...prev,
                        draftUrl: e.target.value,
                      }))
                    }
                    placeholder="https://drive.google.com/..."
                  />
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                This deliverable will be submitted as pending review, on behalf of the selected influencer.
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t bg-gray-50 px-6 py-3">
              <button
                onClick={handleCloseDeliverableModal}
                className="border-gray-300 text-black hover:bg-white border rounded-md px-4 py-2 text-sm"
                disabled={isSavingDeliverable}
              >
                Cancel
              </button>

              <button
                onClick={handleSaveAdminDeliverable}
                disabled={
                  !selectedDeliverableInf?.influencerId ||
                  isSavingDeliverable ||
                  deliverableMilestonesLoading
                }
                className="bg-black text-white hover:bg-gray-800 disabled:opacity-60 rounded-md px-4 py-2 text-sm"
              >
                {isSavingDeliverable ? "Saving..." : "Add Deliverable"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}