"use client";

import * as React from "react";
import {
  CaretDownIcon,
  CopyIcon,
  DotsThreeIcon,
  EyeIcon,
  FileTextIcon,
  FolderSimpleIcon,
  PaperPlaneTiltIcon,
  TrashIcon,
  UserIcon,
} from "@phosphor-icons/react";
import EmailEditor, {
  type EmailEditorPayload,
} from "@/components/ui/EmailEditor";
import { toast } from "@/components/ui/toast";
import api from "@/lib/api";
import {
  apiBrandFolderCreate,
  apiBrandFolderList,
  apiGetCategories,
  apiGetNonFullManagedCampaigns,
  apiNewInvitationCreate,
  apiNewInvitationFollowUp,
  apiNewInvitationsList,
  getApiErrorMessage,
} from "@/app/brand/services/brandApi";
import { DetailPanel } from "@/app/brand/(protected)/browse-influencer/DetailPanel";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreatorHubFilters } from "./CreatorHubFilter";

type RelatedCampaign = {
  campaignId?: string | { _id?: string; id?: string; campaignsId?: string };
  campaignsId?: string;
  campaignTitle?: string;
  productOrServiceName?: string;
  brandId?: string;
  brandName?: string;
  assignedAt?: string;
  folderId?: string;
  folderTitle?: string;
  folderSlug?: string;
};

type RelatedFolder = {
  _id?: string;
  title?: string;
  slug?: string;
  description?: string;
  assignedCampaign?: RelatedCampaign & {
    assignedByAdminId?: string;
  };
};

type CampaignOption = {
  id: string;
  label: string;
  folderId?: string;
  queryCampaignId?: string;
  type?: string;
  isFullyManaged?: boolean;
  goodFitCount?: number;
  raw?: any;
};

type CategoryOption = {
  id: string;
  label: string;
};

type ModashProfileData = {
  _id?: string;
  influencerId?: string;
  provider?: string;
  userId?: string;
  username?: string;
  fullname?: string;
  handle?: string;
  url?: string;
  picture?: string;
  followers?: number | null;
  engagements?: number | null;
  engagementRate?: number | null;
  averageViews?: number | null;
  isVerified?: boolean | null;
  isPrivate?: boolean | null;
  city?: string;
  state?: string;
  subdivision?: string;
  country?: string;
  ageGroup?: string;
  gender?: string;
  language?: string;
  categories?: string[];
  categoryObjects?: any[];
  audience?: any;
  audienceCommenters?: any;
  audienceExtra?: any;
  stats?: any;
  statsByContentType?: any;
  postsCount?: number | null;
  avgLikes?: number | null;
  avgComments?: number | null;
  avgViews?: number | null;
  avgReelsPlays?: number | null;
  totalLikes?: number | null;
  totalViews?: number | null;
  paidPostPerformance?: number | null;
  paidPostPerformanceViews?: number | null;
  sponsoredPostsMedianViews?: number | null;
  sponsoredPostsMedianLikes?: number | null;
  nonSponsoredPostsMedianViews?: number | null;
  nonSponsoredPostsMedianLikes?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type GoodFitInfluencer = {
  influencerId?: string;
  creatorId?: string;
  userId?: string;
  modashId?: string;
  profileKey?: string;
  _id?: string;

  invitationId?: string | null;
  invitation?: Invitation | null;
  campaign?: Invitation["campaign"] | null;

  provider?: string;
  platform?: string;

  name?: string;
  fullname?: string;
  fullName?: string;
  username?: string;
  creatorTitle?: string;

  handle?: string;
  followers?: number | string;
  primaryLink?: string;
  links?: string[];
  niche?: string[] | string;
  email?: string;
  country?: string;
  location?: string;
  language?: string;
  status?: string;

  selectionReason?: string;
  goodFit?: boolean;
  influencerRateCard?: string;
  platformRateCard?: string;
  rateCardCurrency?: string;
  shippingAddress?: string;
  comments?: string;

  modash?: ModashProfileData | null;
  modashProfile?: ModashProfileData | null;

  filterData?: {
    followers?: number | null;
    engagements?: number | null;
    engagementRate?: number | null;
    averageViews?: number | null;
    isVerified?: boolean | null;
    isPrivate?: boolean | null;
    provider?: string;
    country?: string;
    city?: string;
    state?: string;
    ageGroup?: string;
    gender?: string;
    language?: string;
    categories?: string[];
  };

  picture?: string;
  avatarUrl?: string;
  relatedCampaigns?: RelatedCampaign[];
  relatedCampaignCount?: number;
  relatedFolders?: RelatedFolder[];
  relatedFolderCount?: number;
  mediaKitAccess?: {
    hasAdded?: boolean;
    allowed?: boolean;
    availableOnRequest?: boolean;
    requestStatus?: string;
    requestedAt?: string | null;
    buttonLabel?: string;
    url?: string;
  };
  folder?: RelatedFolder;
};

type InvitationStatus = "invited" | "available" | string;

type PendingInvitationMode = "invite" | "followup";

type PendingInvitationContext = {
  row: InfluencerRow;
  campaignId: string;
  campaignTitle: string;
  selectedCampaign?: any;
  handle: string;
  platform: string;
  brandId: string;
  mode: PendingInvitationMode;
  invitationId?: string;
};

type InvitationCampaignLock = {
  invitationId?: string;
  campaignId: string;
  campaignTitle: string;
  createdAt: string;
  expiresAt?: string;
  status?: string;
  isPermanent?: boolean;
  followUpSentAt?: string;
};

type Invitation = {
  _id?: string;
  invitationId?: string | null;

  brandId: string;
  brandName?: string;
  brandEmail?: string;
  brandIndustry?: string;
  brandCompanySize?: string;

  handle: string;
  platform: string;
  userId?: string | null;
  modashUserId?: string | null;

  status: InvitationStatus;

  aiScore?: number | null;
  rawAiScore?: number | null;
  recommendationReason?: string;

  campaignId?: string | null;
  campaignName?: string | null;
  emailTo?: string | null;
  emailFrom?: string | null;
  emailSubject?: string | null;
  emailMessageId?: string | null;
  emailSentAt?: string | null;

  followUpEmailTo?: string | null;
  followUpEmailFrom?: string | null;
  followUpSubject?: string | null;
  followUpMessageId?: string | null;
  followUpSentAt?: string | null;
  permanentCampaignLock?: boolean;
  campaign?: {
    _id?: string;
    brandId?: string;
    brandName?: string;
    campaignTitle?: string;
    description?: string;
    campaignType?: string;
    campaignCategory?: string;
    campaignSubcategory?: string;
    campaignBudget?: number | null;
    budget?: number | null;
    influencerBudget?: number | null;
    paymentType?: string;
    platformSelection?: string[];
    numberOfInfluencers?: number | null;
    influencerTier?: string;
    minFollowers?: number | null;
    maxFollowers?: number | null;
    creatorContentLanguage?: string;
    audienceContentLanguage?: string;
    targetCountry?: string;
    additionalNotes?: string;
    hashtags?: string[];
    timeline?: {
      startDate?: string;
      endDate?: string;
    } | null;
    startAt?: string | null;
    endAt?: string | null;
    status?: string;
    publishStatus?: string;
    approvalMode?: string;
    isFullyManaged?: boolean;
    managementType?: string;
    isActive?: number | boolean | null;
    createdAt?: string;
    updatedAt?: string;
  } | null;

  missingEmailId?: string | null;
  email?: string | null;
  missingEmail?: any;
  creatorTitle?: string;

  country?: string;
  countryName?: string;
  countryCode?: string;
  location?: string;
  language?: string;
  languageCode?: string;
  languages?: any[];

  createdAt: string;
  updatedAt: string;
};

type CreateInvitationResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  status?: "saved" | "exists" | "error" | string;
  data?: any;
};

type BrandFolderItem = {
  _id?: string;
  id?: string;
  profileKey?: string;
  influencerId?: string;
  creatorId?: string;
  userId?: string;
  modashId?: string;
  name?: string;
  fullname?: string;
  username?: string;
  handle?: string;
  email?: string;
  provider?: string;
  platform?: string;
  country?: string;
  language?: string;
  location?: string;
  categories?: string[];
  niche?: string[];
  followers?: number | string | null;
  engagements?: number | null;
  engagementRate?: number | null;
  averageViews?: number | null;
  primaryLink?: string;
  profileUrl?: string;
  url?: string;
  links?: string[];
  picture?: string;
  avatarUrl?: string;
  profileImage?: string;
  status?: string;
  source?: {
    source?: string;
    pitchFolderId?: string;
    pitchFolderTitle?: string;
    pitchItemId?: string;
    campaignId?: string;
    campaignsId?: string;
    campaignTitle?: string;
    importedAt?: string;
  };
  raw?: any;
  addedAt?: string;
  updatedAt?: string;
};

type BrandFolder = {
  _id?: string;
  id?: string;
  brandId?: string;
  brandName?: string;
  title?: string;
  name?: string;
  slug?: string;
  description?: string;
  type?: "folder" | "bookmark" | "good_fit" | string;
  creatorTier?: string;
  linkedCampaign?: RelatedCampaign | null;
  assignedCampaign?: RelatedCampaign | null;
  items?: BrandFolderItem[];
  itemCount?: number;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string | null;
};

type InfluencerStatus =
  | "Sent"
  | "Pending"
  | "Invited"
  | "Available"
  | "Rejected"
  | "Good Fit"
  | "Media Kit"
  | "Bookmarked";

type InfluencerRow = {
  id: string;
  profile: string;
  username: string;
  handle: string;
  avatarUrl: string;
  status: InfluencerStatus;
  category: string;
  folder: string;
  campaignName: string;
  country: string;
  language: string;
  invitationDate: string;
  profileUrl: string;
  relatedCampaigns: RelatedCampaign[];
  relatedFolders: RelatedFolder[];
  raw: GoodFitInfluencer;
};

const statusStyles: Record<InfluencerStatus, string> = {
  Sent: "bg-[#F7F7F7] text-[#777777] before:bg-[#21B15A]",
  Pending: "bg-[#F7F7F7] text-[#777777] before:bg-[#FF8A3D]",
  Invited: "bg-[#F7F7F7] text-[#777777] before:bg-[#3D7CFF]",
  Available: "bg-[#F7F7F7] text-[#777777] before:bg-[#21B15A]",
  Rejected: "bg-[#F7F7F7] text-[#777777] before:bg-[#EF4C3C]",
  "Good Fit": "bg-[#F7F7F7] text-[#777777] before:bg-[#21B15A]",
  "Media Kit": "bg-[#F7F7F7] text-[#777777] before:bg-[#3D7CFF]",
  Bookmarked: "bg-[#F7F7F7] text-[#777777] before:bg-[#8C4B30]",
};

const CREATOR_TIER_OPTIONS = ["Nano", "Micro", "Macro", "Mega"];
const NO_CAMPAIGN_VALUE = "__no_campaign__";

type MoreFiltersState = {
  search?: {
    mode?: string;
  };
  influencer?: {
    tier?: string;
    isVerified?: boolean;
    ageMin?: number;
    ageMax?: number;
    gender?: string;
  };
  platform?: Record<
    string,
    {
      followersMin?: number;
      followersMax?: number;
    }
  >;
  audience?: {
    country?: string;
  };
};

const TIER_RANGES: Record<string, { min: number; max?: number }> = {
  nano: { min: 1000, max: 10000 },
  micro: { min: 10000, max: 100000 },
  mid: { min: 100000, max: 500000 },
  macro: { min: 500000, max: 1000000 },
  mega: { min: 1000000 },
};

function getItemModash(item?: GoodFitInfluencer | null): ModashProfileData | null {
  const source: any = item || {};

  return (
    source.modash ||
    source.modashProfile ||
    source.raw?.modash ||
    source.raw?.modashProfile ||
    source.raw?.profile?.modash ||
    source.raw?.creator?.modash ||
    source.profile?.modash ||
    source.creator?.modash ||
    source.profile ||
    source.creator ||
    null
  );
}

function extractCategoryList(payload: any): CategoryOption[] {
  const rows =
    Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.data?.data)
          ? payload.data.data
          : Array.isArray(payload?.categories)
            ? payload.categories
            : Array.isArray(payload?.data?.categories)
              ? payload.data.categories
              : [];

  const map = new Map<string, CategoryOption>();

  rows.forEach((category: any) => {
    const id = String(
      category?._id ||
      category?.id ||
      category?.categoryId ||
      category?.value ||
      ""
    ).trim();

    const label = String(
      category?.name ||
      category?.categoryName ||
      category?.label ||
      category?.title ||
      ""
    ).trim();

    if (!id || !label) return;

    if (!map.has(id)) {
      map.set(id, {
        id,
        label,
      });
    }
  });

  return Array.from(map.values()).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
}

function normalizeCategoryFilterText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function rowMatchesCategoryFilter(
  row: InfluencerRow,
  selectedCategoryLabel: string
) {
  const selected = normalizeCategoryFilterText(selectedCategoryLabel);

  if (!selected) return true;

  const rowCategory = normalizeCategoryFilterText(row.category);
  const rawCategories = normalizeCategoryFilterText(
    getCategoryListFromValues(
      row.raw?.niche,
      (row.raw as any)?.categories,
      row.raw?.filterData?.categories,
      getModashCategories(row.raw)
    ).join(" ")
  );

  const combined = `${rowCategory} ${rawCategories}`.trim();

  return combined.includes(selected);
}

function numberFromUnknown(value: unknown) {
  const n = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function getFilterFollowerCount(item?: GoodFitInfluencer | null) {
  return (
    numberFromUnknown(item?.filterData?.followers) ??
    numberFromUnknown(getItemModash(item)?.followers) ??
    numberFromUnknown(item?.followers)
  );
}

function normalizeFilterText(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeGender(value: unknown) {
  const clean = normalizeFilterText(value);
  if (!clean) return "";
  if (clean.startsWith("m")) return "male";
  if (clean.startsWith("f")) return "female";
  return clean;
}

function parseAgeRange(value: unknown) {
  const clean = String(value ?? "").trim();
  if (!clean) return null;

  const rangeMatch = clean.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})/);
  if (rangeMatch) {
    return {
      min: Number(rangeMatch[1]),
      max: Number(rangeMatch[2]),
    };
  }

  const plusMatch = clean.match(/(\d{1,2})\s*\+/);
  if (plusMatch) {
    return {
      min: Number(plusMatch[1]),
      max: 200,
    };
  }

  const single = Number(clean);
  if (Number.isFinite(single)) {
    return {
      min: single,
      max: single,
    };
  }

  return null;
}

function rangesOverlap(
  left: { min?: number; max?: number } | null,
  right: { min?: number; max?: number } | null
) {
  if (!left || !right) return false;

  const leftMin = left.min ?? Number.NEGATIVE_INFINITY;
  const leftMax = left.max ?? Number.POSITIVE_INFINITY;
  const rightMin = right.min ?? Number.NEGATIVE_INFINITY;
  const rightMax = right.max ?? Number.POSITIVE_INFINITY;

  return leftMin <= rightMax && rightMin <= leftMax;
}

function rowMatchesMoreFilters(row: InfluencerRow, filters: MoreFiltersState) {
  if (!filters) return true;

  const item = row.raw;
  const modash = getItemModash(item);
  const filterData = item?.filterData || {};
  const influencerFilters = filters.influencer || {};
  const audienceFilters = filters.audience || {};
  const provider = normalizeFilterText(
    filterData.provider || modash?.provider || item?.provider || item?.provider
  );

  if (
    typeof influencerFilters.isVerified === "boolean" &&
    Boolean(filterData.isVerified ?? modash?.isVerified) !==
    influencerFilters.isVerified
  ) {
    return false;
  }

  const selectedTier = normalizeFilterText(influencerFilters.tier);
  if (selectedTier && TIER_RANGES[selectedTier]) {
    const followers = getFilterFollowerCount(item);
    const range = TIER_RANGES[selectedTier];

    if (
      followers === null ||
      followers < range.min ||
      (range.max !== undefined && followers > range.max)
    ) {
      return false;
    }
  }

  if (provider && filters.platform?.[provider]) {
    const range = filters.platform[provider];
    const followers = getFilterFollowerCount(item);

    if (
      followers === null ||
      (range.followersMin !== undefined && followers < range.followersMin) ||
      (range.followersMax !== undefined && followers > range.followersMax)
    ) {
      return false;
    }
  }

  const wantedGender = normalizeGender(influencerFilters.gender);
  if (wantedGender) {
    const rowGender = normalizeGender(filterData.gender || modash?.gender);
    if (!rowGender || rowGender !== wantedGender) return false;
  }

  if (
    influencerFilters.ageMin !== undefined ||
    influencerFilters.ageMax !== undefined
  ) {
    const wantedRange = {
      min: influencerFilters.ageMin,
      max: influencerFilters.ageMax,
    };
    const rowRange = parseAgeRange(filterData.ageGroup || modash?.ageGroup);

    if (!rangesOverlap(rowRange, wantedRange)) return false;
  }

  const wantedCountry = normalizeFilterText(audienceFilters.country);
  if (wantedCountry) {
    const rowCountry = normalizeFilterText(
      filterData.country || getModashCountryText(item) || row.country
    );

    if (
      !rowCountry ||
      (!wantedCountry.includes(rowCountry) && !rowCountry.includes(wantedCountry))
    ) {
      return false;
    }
  }

  return true;
}

function getModashCategories(item: GoodFitInfluencer) {
  const modash = getItemModash(item);

  return Array.isArray(item?.filterData?.categories) && item.filterData.categories.length
    ? item.filterData.categories
    : Array.isArray(modash?.categories)
      ? modash.categories
      : Array.isArray((modash as any)?.profile?.categories)
        ? (modash as any).profile.categories
        : [];
}

type CreatorHubTab = "hub" | "invited";

type DateFilterValue =
  | "all"
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_30_days"
  | "this_month"
  | "last_month";

function getTabFromSearchParam(): CreatorHubTab {
  if (typeof window === "undefined") return "hub";

  const tab = new URLSearchParams(window.location.search)
    .get("tab")
    ?.trim()
    .toLowerCase();

  if (tab === "invited" || tab === "invited-influencers") return "invited";

  return "hub";
}

function writeTabToSearchParam(tab: CreatorHubTab) {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  params.set("tab", tab === "invited" ? "invited" : "influencer-hub");

  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;

  window.history.replaceState(null, "", nextUrl);
}

function getStoredBrandId() {
  if (typeof window === "undefined") return "";

  const directKeys = [
    "brandId",
    "brand_id",
    "brandID",
    "currentBrandId",
    "selectedBrandId",
  ];

  for (const key of directKeys) {
    const value = String(window.localStorage.getItem(key) || "").trim();
    if (value && value !== "undefined" && value !== "null") {
      return value;
    }
  }

  const jsonKeys = ["brand", "user", "authUser", "userData", "brandData"];

  for (const key of jsonKeys) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);

      const value = String(
        parsed?.brandId ||
        parsed?.brand_id ||
        parsed?.brand?._id ||
        parsed?.brand?.id ||
        parsed?._id ||
        parsed?.id ||
        ""
      ).trim();

      if (value && value !== "undefined" && value !== "null") {
        return value;
      }
    } catch {
      // Ignore invalid localStorage JSON
    }
  }

  return "";
}

function displayText(value?: string | number | null) {
  const text = String(value ?? "").trim();
  return text || "—";
}

function getDisplayLanguage(value?: string | number | null) {
  const text = normalizeLanguageText(value);
  return text || "—";
}

const LANGUAGE_CODE_LABELS: Record<string, string> = {
  en: "English",
  eng: "English",
  hi: "Hindi",
  hin: "Hindi",
  es: "Spanish",
  spa: "Spanish",
  fr: "French",
  fra: "French",
  de: "German",
  deu: "German",
  it: "Italian",
  ita: "Italian",
  pt: "Portuguese",
  por: "Portuguese",
  ru: "Russian",
  rus: "Russian",
  ar: "Arabic",
  ara: "Arabic",
  ja: "Japanese",
  jpn: "Japanese",
  ko: "Korean",
  kor: "Korean",
  zh: "Chinese",
  zho: "Chinese",
  bn: "Bengali",
  ur: "Urdu",
  tr: "Turkish",
  nl: "Dutch",
  pl: "Polish",
  sv: "Swedish",
  no: "Norwegian",
  da: "Danish",
  fi: "Finnish",
  id: "Indonesian",
  ms: "Malay",
  th: "Thai",
  vi: "Vietnamese",
};

const ISO3_TO_ISO2: Record<string, string> = {
  AFG: "AF",
  ALB: "AL",
  DZA: "DZ",
  ARG: "AR",
  AUS: "AU",
  AUT: "AT",
  BGD: "BD",
  BEL: "BE",
  BRA: "BR",
  CAN: "CA",
  CHL: "CL",
  CHN: "CN",
  COL: "CO",
  DNK: "DK",
  EGY: "EG",
  FRA: "FR",
  DEU: "DE",
  GBR: "GB",
  IND: "IN",
  IDN: "ID",
  IRL: "IE",
  ITA: "IT",
  JPN: "JP",
  KOR: "KR",
  KWT: "KW",
  MEX: "MX",
  NLD: "NL",
  NZL: "NZ",
  PAK: "PK",
  PHL: "PH",
  POL: "PL",
  PRT: "PT",
  RUS: "RU",
  SAU: "SA",
  SGP: "SG",
  ZAF: "ZA",
  ESP: "ES",
  SWE: "SE",
  CHE: "CH",
  THA: "TH",
  TUR: "TR",
  ARE: "AE",
  USA: "US",
  VNM: "VN",
};

const COUNTRY_NAME_TO_ISO2: Record<string, string> = {
  america: "US",
  usa: "US",
  us: "US",
  "u.s.": "US",
  "u.s.a.": "US",
  "united states": "US",
  "united states of america": "US",
  uk: "GB",
  "u.k.": "GB",
  britain: "GB",
  "great britain": "GB",
  "united kingdom": "GB",
  england: "GB",
  russia: "RU",
  "russian federation": "RU",
  kuwait: "KW",
  ireland: "IE",
  india: "IN",
  france: "FR",
  germany: "DE",
  italy: "IT",
  spain: "ES",
  portugal: "PT",
  brazil: "BR",
  canada: "CA",
  australia: "AU",
  "new zealand": "NZ",
  pakistan: "PK",
  bangladesh: "BD",
  "united arab emirates": "AE",
  uae: "AE",
  singapore: "SG",
  indonesia: "ID",
  malaysia: "MY",
  philippines: "PH",
  thailand: "TH",
  vietnam: "VN",
  japan: "JP",
  "south korea": "KR",
  korea: "KR",
  china: "CN",
  mexico: "MX",
  argentina: "AR",
  colombia: "CO",
  chile: "CL",
  egypt: "EG",
  "saudi arabia": "SA",
  "south africa": "ZA",
};

function uniqueNonEmpty(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )
  );
}

function normalizeLanguageText(value?: string | number | null) {
  const text = String(value ?? "").trim();

  if (!text) return "";

  const clean = text.replace(/_/g, "-").toLowerCase();
  const baseCode = clean.split("-")[0];

  return LANGUAGE_CODE_LABELS[clean] || LANGUAGE_CODE_LABELS[baseCode] || text;
}

function normalizeCountryCode(value?: string | number | null) {
  const text = String(value ?? "").trim();

  if (!text) return "";

  const clean = text.toUpperCase();

  if (/^[A-Z]{2}$/.test(clean)) return clean;
  if (ISO3_TO_ISO2[clean]) return ISO3_TO_ISO2[clean];

  const lower = text.toLowerCase();
  if (COUNTRY_NAME_TO_ISO2[lower]) return COUNTRY_NAME_TO_ISO2[lower];

  const lastCommaPart = text.split(",").pop()?.trim().toLowerCase() || "";
  if (COUNTRY_NAME_TO_ISO2[lastCommaPart]) return COUNTRY_NAME_TO_ISO2[lastCommaPart];

  return "";
}

function countryCodeToFlag(countryCode?: string) {
  const code = String(countryCode || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "";

  return code
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

function countryCodeToName(countryCode?: string) {
  const code = String(countryCode || "").trim().toUpperCase();
  if (!code) return "";

  try {
    const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
    return displayNames.of(code) || code;
  } catch {
    return code;
  }
}

function normalizeCountryText(value?: string | number | null) {
  const text = String(value ?? "").trim();
  if (!text) return "";

  const code = normalizeCountryCode(text);
  if (code) return countryCodeToName(code);

  const lastCommaPart = text.split(",").pop()?.trim() || "";
  const lastCommaCode = normalizeCountryCode(lastCommaPart);
  if (lastCommaCode) return countryCodeToName(lastCommaCode);

  return text;
}

function getDisplayCountry(value?: string | number | null) {
  const text = normalizeCountryText(value);
  return text || "—";
}

function getCountryDisplay(value?: string | number | null) {
  const name = normalizeCountryText(value);
  const code = normalizeCountryCode(value) || normalizeCountryCode(name);

  return {
    name: name || "—",
    flag: countryCodeToFlag(code),
  };
}

function readableTextFromUnknown(value: unknown): string {
  if (value === null || value === undefined) return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const text = readableTextFromUnknown(item);
      if (text) return text;
    }

    return "";
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    for (const key of [
      "name",
      "title",
      "label",
      "category",
      "categoryName",
      "niche",
      "language",
      "languageName",
      "country",
      "countryName",
      "value",
      "code",
      "languageCode",
      "countryCode",
      "id",
    ]) {
      const text = readableTextFromUnknown(record[key]);
      if (text) return text;
    }
  }

  return "";
}

function readableListFromUnknown(value: unknown): string[] {
  if (value === null || value === undefined) return [];

  if (typeof value === "string" || typeof value === "number") {
    const text = String(value).trim();
    return text ? [text] : [];
  }

  if (Array.isArray(value)) {
    return uniqueNonEmpty(value.flatMap((item) => readableListFromUnknown(item)));
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    for (const key of [
      "name",
      "title",
      "label",
      "category",
      "categoryName",
      "niche",
      "language",
      "languageName",
      "country",
      "countryName",
      "value",
      "code",
      "languageCode",
      "countryCode",
      "id",
    ]) {
      const values = readableListFromUnknown(record[key]);
      if (values.length) return values;
    }
  }

  return [];
}

function readPathValue(source: any, path: string) {
  return path.split(".").reduce((cursor, key) => {
    if (cursor === null || cursor === undefined) return undefined;
    return cursor?.[key];
  }, source);
}

function readFirstTextFromPaths(source: any, paths: string[]) {
  for (const path of paths) {
    const text = readableTextFromUnknown(readPathValue(source, path));
    if (text) return text;
  }

  return "";
}

function readFirstListFromPaths(source: any, paths: string[]) {
  for (const path of paths) {
    const values = readableListFromUnknown(readPathValue(source, path));
    if (values.length) return values;
  }

  return [];
}

function findTextByKey(source: unknown, matcher: (key: string) => boolean, depth = 0): string {
  if (!source || depth > 4 || typeof source !== "object") return "";

  if (Array.isArray(source)) {
    for (const item of source) {
      const text = findTextByKey(item, matcher, depth + 1);
      if (text) return text;
    }

    return "";
  }

  const record = source as Record<string, unknown>;

  for (const [key, value] of Object.entries(record)) {
    if (matcher(key)) {
      const text = readableTextFromUnknown(value);
      if (text) return text;
    }
  }

  for (const [key, value] of Object.entries(record)) {
    if (
      key.toLowerCase().includes("email") ||
      key.toLowerCase().includes("token") ||
      key.toLowerCase().includes("password")
    ) {
      continue;
    }

    const text = findTextByKey(value, matcher, depth + 1);
    if (text) return text;
  }

  return "";
}

function getModashLanguageText(item?: GoodFitInfluencer | BrandFolderItem | null) {
  const source: any = item || {};
  const raw = source.raw && typeof source.raw === "object" ? source.raw : {};
  const modash: any = getItemModash(source as GoodFitInfluencer) || {};
  const languagePaths = [
    "language",
    "languages",
    "languageName",
    "languageCode",
    "filterData.language",
    "filterData.languages",
    "modash.language",
    "modash.languages",
    "modashProfile.language",
    "modashProfile.languages",
    "profile.language",
    "profile.languages",
    "creator.language",
    "creator.languages",
    "audience.language",
    "audience.languages",
    "audience.topLanguages",
    "audienceExtra.language",
    "audienceExtra.languages",
    "audienceCommenters.language",
    "audienceCommenters.languages",
  ];

  const sourceLanguages = readFirstListFromPaths(source, languagePaths);
  const rawLanguages = sourceLanguages.length
    ? sourceLanguages
    : readFirstListFromPaths(raw, languagePaths);
  const modashLanguages = rawLanguages.length
    ? rawLanguages
    : readFirstListFromPaths(modash, languagePaths);
  const fallback = modashLanguages.length
    ? modashLanguages
    : [findTextByKey(modash, (key) => key.toLowerCase().includes("language"))];

  return uniqueNonEmpty(fallback.map((value) => normalizeLanguageText(value))).join(", ");
}

function getModashCountryText(item?: GoodFitInfluencer | BrandFolderItem | null) {
  const source: any = item || {};
  const raw = source.raw && typeof source.raw === "object" ? source.raw : {};
  const modash: any = getItemModash(source as GoodFitInfluencer) || {};
  const countryPaths = [
    "country",
    "countryName",
    "countryCode",
    "location",
    "filterData.country",
    "filterData.countryName",
    "filterData.countryCode",
    "filterData.location",
    "modash.country",
    "modash.countryName",
    "modash.countryCode",
    "modash.location",
    "modashProfile.country",
    "modashProfile.countryName",
    "modashProfile.countryCode",
    "modashProfile.location",
    "profile.country",
    "profile.countryName",
    "profile.countryCode",
    "profile.location",
    "creator.country",
    "creator.countryName",
    "creator.countryCode",
    "creator.location",
    "audience.country",
    "audience.countries",
    "audience.topCountries",
    "audienceExtra.country",
    "audienceExtra.countries",
  ];

  const text =
    readFirstTextFromPaths(source, countryPaths) ||
    readFirstTextFromPaths(raw, countryPaths) ||
    readFirstTextFromPaths(modash, countryPaths) ||
    findTextByKey(modash, (key) => {
      const lowerKey = key.toLowerCase();
      return lowerKey.includes("country") || lowerKey === "location";
    });

  return normalizeCountryText(text);
}

function getProfileImageUrl(item?: GoodFitInfluencer | BrandFolderItem | null) {
  const source: any = item || {};
  const raw = source.raw && typeof source.raw === "object" ? source.raw : {};
  const modash: any = getItemModash(source as GoodFitInfluencer) || {};
  const url = String(
    source.picture ||
    source.avatarUrl ||
    source.profileImage ||
    raw.picture ||
    raw.avatarUrl ||
    raw.profileImage ||
    raw.profile?.picture ||
    raw.profile?.avatarUrl ||
    raw.creator?.picture ||
    raw.creator?.avatarUrl ||
    modash.picture ||
    modash.avatarUrl ||
    modash.profileImage ||
    modash.profile?.picture ||
    modash.creator?.picture ||
    ""
  ).trim();

  return /^https?:\/\//i.test(url) ? url : "";
}

function isUrlLikeLabel(value?: string | number | null) {
  const text = String(value ?? "").trim();

  if (!text) return false;

  return (
    /^https?:\/\//i.test(text) ||
    /^www\./i.test(text) ||
    text.includes("localhost:") ||
    text.includes("/brand/") ||
    text.includes("/campaign/")
  );
}

function getSafeDisplayLabel(
  candidates: Array<string | number | null | undefined>,
  fallback: string
) {
  for (const candidate of candidates) {
    const text = String(candidate ?? "").trim();

    if (!text) continue;
    if (text.toLowerCase() === "undefined" || text.toLowerCase() === "null") {
      continue;
    }

    return text;
  }

  return fallback;
}

function getShortIdLabel(prefix: string, id: string) {
  const clean = String(id || "").trim();
  return clean ? `${prefix} ${clean.slice(-6)}` : prefix;
}

function getIdString(value: RelatedCampaign["campaignId"] | string | number | null | undefined) {
  if (value === null || value === undefined) return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }

  return String(value._id || value.id || value.campaignsId || "").trim();
}

function displayCategory(value?: unknown) {
  const values = uniqueNonEmpty(readableListFromUnknown(value));
  return values.length ? values.join(", ") : "—";
}

function getCategoryListFromValues(...values: unknown[]) {
  return uniqueNonEmpty(values.flatMap((value) => readableListFromUnknown(value)));
}

function normalizeHandle(value?: string) {
  const text = String(value || "").trim();
  if (!text) return "—";
  return text.startsWith("@") ? text : `@${text}`;
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${mm}/${dd}`;
}

function getDateFromUnknown(value?: unknown) {
  const text = String(value || "").trim();
  if (!text) return null;

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getInvitationDateRangeText(
  row: InfluencerRow,
  locks: InvitationCampaignLock[] = [],
  tab: CreatorHubTab
) {
  if (tab === "invited") {
    return row.invitationDate || "-";
  }

  const dateValues = [
    ...locks.map((lock) => lock.createdAt),
    ...row.relatedCampaigns.map((campaign) => campaign.assignedAt),
    (row.raw as any)?.invitedAt,
    (row.raw as any)?.invitationDate,
    (row.raw as any)?.invitationCreatedAt,
    (row.raw as any)?.invitation?.createdAt,
  ];

  const dates = dateValues
    .map(getDateFromUnknown)
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => a.getTime() - b.getTime());

  if (!dates.length) {
    return row.invitationDate || "-";
  }

  const firstDate = formatDate(dates[0].toISOString());
  const lastDate = formatDate(dates[dates.length - 1].toISOString());

  return firstDate === lastDate ? firstDate : `${firstDate} - ${lastDate}`;
}

function getStatus(item: GoodFitInfluencer): InfluencerStatus {
  const normalizedStatus = String((item as any).status || (item as any).raw?.status || "")
    .trim()
    .toLowerCase();

  if (item.mediaKitAccess?.hasAdded || item.mediaKitAccess?.allowed) {
    return "Sent";
  }

  if (normalizedStatus.includes("bookmark")) return "Bookmarked";
  if (normalizedStatus.includes("good_fit") || normalizedStatus.includes("good fit")) {
    return "Good Fit";
  }
  if (normalizedStatus === "sent" || normalizedStatus === "available") return "Sent";
  if (normalizedStatus === "rejected" || normalizedStatus === "blocked") return "Rejected";

  if (item.goodFit) return "Good Fit";

  return "Pending";
}

function getInvitationStatus(status?: InvitationStatus): InfluencerStatus {
  const normalized = String(status || "").trim().toLowerCase();

  if (normalized === "invited" || normalized === "sent") return "Sent";
  if (normalized === "available") return "Available";
  if (normalized === "rejected" || normalized === "blocked") return "Rejected";

  return "Pending";
}

function getInvitationProfileUrl(invitation: Invitation) {
  const handle = String(invitation.handle || "")
    .trim()
    .replace(/^@+/, "");

  if (!handle) return "";

  const platform = String(invitation.platform || "").trim().toLowerCase();

  if (platform.includes("youtube")) return `https://www.youtube.com/@${handle}`;
  if (platform.includes("tiktok")) return `https://www.tiktok.com/@${handle}`;
  if (platform.includes("instagram")) return `https://www.instagram.com/${handle}`;

  return "";
}

function normalizeRelatedCampaigns(item: GoodFitInfluencer) {
  const fromItem = Array.isArray(item.relatedCampaigns)
    ? item.relatedCampaigns
    : [];

  const fallbackCampaign = item.folder?.assignedCampaign
    ? [item.folder.assignedCampaign]
    : [];

  const map = new Map<string, RelatedCampaign>();

  [...fromItem, ...fallbackCampaign].forEach((campaign, index) => {
    if (!campaign) return;

    const key =
      getIdString(campaign.campaignId) ||
      campaign.campaignsId ||
      `${campaign.campaignTitle || "campaign"}-${campaign.folderId || index}`;

    if (!map.has(key)) {
      map.set(key, campaign);
    }
  });

  return Array.from(map.values());
}

function normalizeRelatedFolders(item: GoodFitInfluencer) {
  const fromItem = Array.isArray(item.relatedFolders) ? item.relatedFolders : [];
  const fallbackFolder = item.folder ? [item.folder] : [];
  const map = new Map<string, RelatedFolder>();

  [...fromItem, ...fallbackFolder].forEach((folder, index) => {
    if (!folder) return;

    const key = folder._id || folder.slug || `${folder.title || "folder"}-${index}`;

    if (!map.has(key)) {
      map.set(key, folder);
    }
  });

  return Array.from(map.values());
}

function getFoldersText(folders: RelatedFolder[], fallbackFolder?: string) {
  const labels = folders
    .map((folder) => folder.title || folder.slug || folder._id || "")
    .filter(Boolean);

  if (labels.length) return labels.join(", ");
  return fallbackFolder || "Influencer_1";
}

function getCampaignName(campaign?: RelatedCampaign | null) {
  if (!campaign) return "—";

  for (const value of [
    campaign.campaignTitle,
    campaign.productOrServiceName,
    campaign.campaignsId,
    getIdString(campaign.campaignId),
  ]) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }

  return "—";
}

function getInfluencerMergeKey(item: GoodFitInfluencer) {
  const id = String(item._id || "").trim();
  if (id) return `id:${id}`;

  const handle = String(item.handle || "").trim().toLowerCase().replace(/^@+/, "");
  const provider = String(item.provider || "").trim().toLowerCase();
  if (handle) return `handle:${provider}:${handle}`;

  const link = String(item.primaryLink || item.links?.[0] || "")
    .trim()
    .toLowerCase()
    .replace(/\/+$/, "");
  if (link) return `link:${link}`;

  const name = String(item.name || "").trim().toLowerCase();
  return name ? `name:${provider}:${name}` : "";
}

function mergeGoodFitItems(items: GoodFitInfluencer[]) {
  const map = new Map<string, GoodFitInfluencer>();

  items.forEach((item, index) => {
    const key = getInfluencerMergeKey(item) || `index:${index}`;

    if (!map.has(key)) {
      map.set(key, item);
      return;
    }

    const existing = map.get(key)!;

    map.set(key, {
      ...existing,
      ...item,
      relatedCampaigns: [
        ...(Array.isArray(existing.relatedCampaigns) ? existing.relatedCampaigns : []),
        ...(Array.isArray(item.relatedCampaigns) ? item.relatedCampaigns : []),
      ],
      relatedFolders: [
        ...(Array.isArray(existing.relatedFolders) ? existing.relatedFolders : []),
        ...(Array.isArray(item.relatedFolders) ? item.relatedFolders : []),
      ],
    });
  });

  return Array.from(map.values());
}

function mapGoodFitItem(item: GoodFitInfluencer, index: number): InfluencerRow {
  const relatedCampaigns = normalizeRelatedCampaigns(item);
  const relatedFolders = normalizeRelatedFolders(item);
  const firstCampaign = relatedCampaigns[0];
  const firstFolder = relatedFolders[0] || item.folder;
  const modash = getItemModash(item);
  const modashCategories = getModashCategories(item);

  const name = displayText(item.name || modash?.fullname || modash?.username);
  const handle = normalizeHandle(item.handle || modash?.handle || modash?.username);
  const cleanUsername = handle !== "—" ? handle.replace("@", "") : "username";
  const category = displayCategory(
    getCategoryListFromValues(item.niche, (item as any).categories, modashCategories)
  );
  const avatarUrl = getProfileImageUrl(item);

  return {
    id: String(item._id || `${item.handle || item.name || "good-fit"}-${index}`),
    profile: name === "—" ? "Label" : name,
    username: cleanUsername,
    handle,
    avatarUrl,
    status: getStatus(item),
    category,
    folder: getFoldersText(relatedFolders, firstFolder?.title),
    campaignName: getCampaignName(firstCampaign || item.folder?.assignedCampaign),
    country: getDisplayCountry(getModashCountryText(item)),
    language: getDisplayLanguage(getModashLanguageText(item)),
    invitationDate: formatDate(
      (item as any).invitedAt ||
      (item as any).invitationDate ||
      (item as any).invitationCreatedAt ||
      (item as any).invitation?.createdAt
    ),
    profileUrl: String(item.primaryLink || item.links?.[0] || modash?.url || "").trim(),
    relatedCampaigns,
    relatedFolders,
    raw: item,
  };
}

function mapInvitationToRow(invitation: Invitation, index: number): InfluencerRow {
  const handle = normalizeHandle(invitation.handle);
  const cleanUsername = handle !== "—" ? handle.replace("@", "") : "username";

  const campaign = invitation.campaign || null;

  const campaignId = String(
    invitation.campaignId ||
    campaign?._id ||
    ""
  ).trim();

  const campaignName = displayText(
    invitation.campaignName ||
    campaign?.campaignTitle ||
    campaign?.campaignType ||
    "—"
  );

  const category = displayCategory(
    getCategoryListFromValues(
      campaign?.campaignCategory,
      campaign?.campaignSubcategory
    )
  );

  const country = getDisplayCountry(
    invitation.country ||
    invitation.countryName ||
    invitation.countryCode ||
    invitation.location ||
    campaign?.targetCountry ||
    ""
  );

  const language = getDisplayLanguage(
    invitation.language ||
    invitation.languageCode ||
    invitation.languages?.[0] ||
    campaign?.creatorContentLanguage ||
    campaign?.audienceContentLanguage ||
    ""
  );

  const profileUrl = getInvitationProfileUrl(invitation);

  const rowId = String(
    invitation._id ||
    invitation.invitationId ||
    `${invitation.handle || "invited"}-${campaignId || index}`
  );

  return {
    id: rowId,
    profile:
      invitation.creatorTitle && invitation.creatorTitle !== handle
        ? invitation.creatorTitle
        : cleanUsername === "username"
          ? "Label"
          : cleanUsername,
    username: cleanUsername,
    handle,
    avatarUrl: getProfileImageUrl(invitation as any),
    status: getInvitationStatus(invitation.status),

    category,
    folder: campaignName,
    campaignName,

    country,
    language,

    invitationDate: formatDate(invitation.createdAt),
    profileUrl,

    relatedCampaigns: campaignId
      ? [
        {
          campaignId,
          campaignTitle: campaignName,
          assignedAt: invitation.createdAt,
        },
      ]
      : [],

    relatedFolders: [],

    raw: {
      _id: rowId,
      invitationId: invitation.invitationId || null,

      userId: invitation.userId || invitation.modashUserId || "",
      influencerId: invitation.userId || invitation.modashUserId || "",
      creatorId: invitation.userId || invitation.modashUserId || "",
      modashId: invitation.modashUserId || invitation.userId || "",

      provider: invitation.platform,
      platform: invitation.platform,

      name:
        invitation.creatorTitle ||
        cleanUsername ||
        handle ||
        "Label",
      fullname:
        invitation.creatorTitle ||
        cleanUsername ||
        handle ||
        "Label",
      username: cleanUsername,
      handle,

      primaryLink: profileUrl,
      links: profileUrl ? [profileUrl] : [],

      country,
      location: country,
      language,

      goodFit: false,
      status: invitation.status,

      invitation,
      campaign,

      relatedCampaigns: campaignId
        ? [
          {
            campaignId,
            campaignTitle: campaignName,
            assignedAt: invitation.createdAt,
          },
        ]
        : [],
    },
  };
}
function extractBrandFolderList(payload: any): BrandFolder[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data?.folders)) return payload.data.folders;
  if (Array.isArray(payload?.data?.data?.folders)) return payload.data.data.folders;
  if (Array.isArray(payload?.folders)) return payload.folders;

  const groupedFolders = [
    ...(Array.isArray(payload?.data?.groups?.folders)
      ? payload.data.groups.folders
      : []),
    ...(Array.isArray(payload?.data?.groups?.bookmarks)
      ? payload.data.groups.bookmarks
      : []),
    ...(Array.isArray(payload?.data?.groups?.goodFit)
      ? payload.data.groups.goodFit
      : []),
  ];

  if (groupedFolders.length) return groupedFolders;

  return [];
}

function getBrandFolderItems(folder?: BrandFolder | null): BrandFolderItem[] {
  return Array.isArray(folder?.items) ? folder.items : [];
}

function getBrandFolderId(folder?: BrandFolder | null) {
  return String(folder?._id || folder?.id || "").trim();
}

function getBrandFolderTitle(folder?: BrandFolder | null) {
  return getSafeDisplayLabel(
    [folder?.title, folder?.name, folder?.slug, getBrandFolderId(folder)],
    "Folder"
  );
}

function mapBrandFolderItemToGoodFit(
  folder: BrandFolder,
  item: BrandFolderItem,
  index: number
): GoodFitInfluencer {
  const folderId = getBrandFolderId(folder);
  const folderTitle = getBrandFolderTitle(folder);
  const linkedCampaign = folder.linkedCampaign || folder.assignedCampaign || null;
  const raw = item.raw && typeof item.raw === "object" ? item.raw : item;
  const modash =
    raw?.modash ||
    raw?.modashProfile ||
    raw?.profile?.modash ||
    raw?.creator?.modash ||
    null;
  const countryText = getModashCountryText({
    ...item,
    raw,
    modash,
    modashProfile: raw?.modashProfile
  } as any);
  const languageText = getModashLanguageText({
    ...item,
    raw,
    modash,
    modashProfile: raw?.modashProfile
  } as any);
  const categories = getCategoryListFromValues(
    item.categories,
    item.niche,
    raw?.categories,
    raw?.niche,
    raw?.categoryObjects,
    modash?.categories,
    modash?.categoryObjects
  );

  const handle = String(item.handle || item.username || raw?.handle || raw?.username || "").trim();
  const name = String(
    item.name ||
    item.fullname ||
    item.username ||
    raw?.name ||
    raw?.fullname ||
    raw?.username ||
    handle ||
    "Label"
  ).trim();

  const primaryLink = String(
    item.primaryLink ||
    item.profileUrl ||
    item.url ||
    item.links?.[0] ||
    raw?.primaryLink ||
    raw?.profileUrl ||
    raw?.url ||
    raw?.links?.[0] ||
    modash?.url ||
    ""
  ).trim();

  const folderPayload: RelatedFolder = {
    _id: folderId,
    title: folderTitle,
    slug: folder.slug,
    description: folder.description,
    assignedCampaign: linkedCampaign || undefined,
  };

  const reportUserId = String(
    item.userId ||
    raw?.userId ||
    raw?.profile?.userId ||
    raw?.creator?.userId ||
    raw?.modash?.userId ||
    raw?.modashProfile?.userId ||
    modash?.userId ||
    item.influencerId ||
    raw?.influencerId ||
    raw?.profile?.influencerId ||
    raw?.creator?.influencerId ||
    raw?.modash?.influencerId ||
    raw?.modashProfile?.influencerId ||
    modash?.influencerId ||
    item.creatorId ||
    raw?.creatorId ||
    raw?.profile?.creatorId ||
    raw?.creator?.creatorId ||
    item.modashId ||
    raw?.modashId ||
    raw?.profile?.modashId ||
    raw?.creator?.modashId ||
    raw?.modash?.modashId ||
    raw?.modashProfile?.modashId ||
    modash?.modashId ||
    item.profileKey ||
    raw?.profileKey ||
    raw?.profile?.profileKey ||
    raw?.creator?.profileKey ||
    raw?.modash?._id ||
    raw?.modashProfile?._id ||
    modash?._id ||
    ""
  ).trim();

  return {
    _id: String(item._id || item.id || item.profileKey || reportUserId || `${folderId}-${index}`),
    userId: reportUserId,
    influencerId: String(item.influencerId || raw?.influencerId || reportUserId || "").trim(),
    creatorId: String(item.creatorId || raw?.creatorId || reportUserId || "").trim(),
    modashId: String(item.modashId || raw?.modashId || modash?._id || reportUserId || "").trim(),
    profileKey: String(item.profileKey || raw?.profileKey || reportUserId || "").trim(),
    provider: item.provider || item.platform || raw?.provider || raw?.platform,
    name,
    handle,
    followers: item.followers ?? raw?.followers ?? modash?.followers,
    primaryLink,
    links: Array.isArray(item.links) && item.links.length
      ? item.links
      : primaryLink
        ? [primaryLink]
        : [],
    niche: categories,
    email: item.email || raw?.email,
    country: countryText,
    location: item.location || raw?.location || countryText,
    language: languageText,
    goodFit: folder.type === "good_fit" || item.status === "good_fit",
    modash,
    modashProfile: raw?.modashProfile || null,
    filterData: {
      followers:
        numberFromUnknown(item.followers) ??
        numberFromUnknown(raw?.followers) ??
        numberFromUnknown(modash?.followers),
      engagements:
        numberFromUnknown(item.engagements) ??
        numberFromUnknown(raw?.engagements) ??
        numberFromUnknown(modash?.engagements),
      engagementRate:
        numberFromUnknown(item.engagementRate) ??
        numberFromUnknown(raw?.engagementRate) ??
        numberFromUnknown(modash?.engagementRate),
      averageViews:
        numberFromUnknown(item.averageViews) ??
        numberFromUnknown(raw?.averageViews) ??
        numberFromUnknown(raw?.avgViews) ??
        numberFromUnknown(modash?.averageViews),
      isVerified: Boolean(raw?.isVerified ?? modash?.isVerified ?? false),
      isPrivate: Boolean(raw?.isPrivate ?? modash?.isPrivate ?? false),
      provider: item.provider || item.platform || raw?.provider || raw?.platform,
      country: countryText,
      language: languageText,
      categories,
    },
    picture: item.picture || item.avatarUrl || item.profileImage || raw?.picture || raw?.avatarUrl,
    avatarUrl: item.avatarUrl || item.picture || raw?.avatarUrl || raw?.picture,
    relatedCampaigns: linkedCampaign ? [linkedCampaign] : [],
    relatedCampaignCount: linkedCampaign ? 1 : 0,
    relatedFolders: [folderPayload],
    relatedFolderCount: 1,
    folder: folderPayload,
  };
}

function brandFoldersToGoodFitItems(folders: BrandFolder[]) {
  return folders.flatMap((folder) =>
    getBrandFolderItems(folder).map((item, index) =>
      mapBrandFolderItemToGoodFit(folder, item, index)
    )
  );
}

function rowMatchesSearch(row: InfluencerRow, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return [
    row.profile,
    row.username,
    row.handle,
    row.status,
    row.category,
    row.folder,
    row.campaignName,
    row.country,
    row.language,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(q);
}

function extractNonFullManagedCampaignList(payload: any): any[] {
  if (Array.isArray(payload?.data?.campaigns)) return payload.data.campaigns;
  if (Array.isArray(payload?.data?.data?.campaigns)) {
    return payload.data.data.campaigns;
  }
  if (Array.isArray(payload?.campaigns)) return payload.campaigns;
  if (Array.isArray(payload?.data)) return payload.data;

  return [];
}

function getFolderAssignedCampaign(folder: any): RelatedCampaign | null {
  const campaign = folder?.linkedCampaign || folder?.assignedCampaign || null;
  if (!campaign) return null;

  const campaignId = String(
    getIdString(campaign?.campaignId) ||
    campaign?.campaignsId ||
    ""
  ).trim();

  const hasLabel = Boolean(
    campaign?.campaignTitle ||
    campaign?.productOrServiceName ||
    campaign?.campaignsId ||
    campaignId
  );

  if (!campaignId && !hasLabel) return null;

  return campaign;
}

function mapFolderToCampaignOption(folder: any): CampaignOption | null {
  const folderId = String(folder?._id || folder?.id || "").trim();
  if (!folderId) return null;

  const campaign = getFolderAssignedCampaign(folder);
  const queryCampaignId = String(
    getIdString(campaign?.campaignId) ||
    campaign?.campaignsId ||
    ""
  ).trim();

  const fallbackFolderLabel = getShortIdLabel("Folder", folderId);
  const folderTitle = getSafeDisplayLabel(
    [folder?.title, folder?.name, folder?.slug],
    fallbackFolderLabel
  );

  return {
    id: folderId,
    label: folderTitle || fallbackFolderLabel,
    folderId,
    queryCampaignId,
    type: String(folder?.type || folder?.folderType || "folder"),
    isFullyManaged: false,
    goodFitCount: Number(folder?.itemCount || folder?.items?.length || 0),
    raw: campaign || folder,
  };
}

function looksLikeMongoId(value: unknown) {
  return /^[a-f0-9]{24}$/i.test(String(value ?? "").trim());
}

function isBadCampaignLabel(value: unknown) {
  const text = String(value ?? "").trim();

  if (!text) return true;
  if (text.toLowerCase() === "undefined" || text.toLowerCase() === "null") {
    return true;
  }

  if (looksLikeMongoId(text)) return true;
  if (isUrlLikeLabel(text)) return true;
  if (/^campaign\s+[a-f0-9]{4,}$/i.test(text)) return true;

  return false;
}

function pickCampaignTextFromKeys(value: any, keys: string[]) {
  if (!value || typeof value !== "object") return "";

  for (const key of keys) {
    const text = String(value?.[key] ?? "").trim();
    if (!isBadCampaignLabel(text)) return text;
  }

  return "";
}

function findCampaignTitleDeep(value: any, depth = 0): string {
  if (!value || depth > 4) return "";

  if (typeof value === "string" || typeof value === "number") {
    const text = String(value).trim();
    return isBadCampaignLabel(text) ? "" : text;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findCampaignTitleDeep(item, depth + 1);
      if (found) return found;
    }

    return "";
  }

  if (typeof value !== "object") return "";

  const displayName = pickCampaignTextFromKeys(value, [
    "campaignName",
    "campaign_name",
    "name",
    "title",
    "label",
    "productOrServiceName",
    "product_or_service_name",
    "projectName",
    "project_name",
  ]);

  if (displayName) return displayName;

  const nestedName =
    pickCampaignTextFromKeys(value?.details, ["name", "campaignName", "title"]) ||
    pickCampaignTextFromKeys(value?.campaign, ["campaignName", "name", "title"]) ||
    pickCampaignTextFromKeys(value?.campaignData, ["campaignName", "name", "title"]) ||
    pickCampaignTextFromKeys(value?.campaignDetails, ["campaignName", "name", "title"]) ||
    pickCampaignTextFromKeys(value?.brief, ["campaignName", "name", "title"]) ||
    pickCampaignTextFromKeys(value?.category, ["name", "title"]);

  if (nestedName) return nestedName;

  const campaignTitle = pickCampaignTextFromKeys(value, [
    "campaignTitle",
    "campaign_title",
  ]);

  if (campaignTitle) return campaignTitle;

  const nestedKeys = [
    "campaign",
    "campaignData",
    "campaignDetails",
    "campaignInfo",
    "details",
    "basicInfo",
    "brief",
    "product",
    "productOrService",
    "category",
  ];

  for (const key of nestedKeys) {
    const found = findCampaignTitleDeep(value?.[key], depth + 1);
    if (found) return found;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const lowerKey = key.toLowerCase();

    if (
      lowerKey.includes("id") ||
      lowerKey.includes("url") ||
      lowerKey.includes("image") ||
      lowerKey.includes("token") ||
      lowerKey.includes("password")
    ) {
      continue;
    }

    if (
      lowerKey.includes("name") ||
      lowerKey.includes("title") ||
      lowerKey.includes("campaign") ||
      lowerKey.includes("product") ||
      lowerKey.includes("category")
    ) {
      const found = findCampaignTitleDeep(nestedValue, depth + 1);
      if (found) return found;
    }
  }

  return "";
}

function getCampaignOptionDisplayName(campaign: any, id: string) {
  const label = String(
    campaign?.label ||
    campaign?.campaignTitle ||
    campaign?.campaign_title ||
    campaign?.campaignName ||
    campaign?.campaign_name ||
    campaign?.productOrServiceName ||
    campaign?.product_or_service_name ||
    campaign?.campaign?.campaignTitle ||
    campaign?.campaignData?.campaignTitle ||
    campaign?.campaignDetails?.campaignTitle ||
    campaign?.details?.campaignTitle ||
    ""
  ).trim();

  if (!label || isBadCampaignLabel(label)) {
    return getShortIdLabel("Campaign", id);
  }

  return label;
}

function mapRawCampaignToCampaignOption(campaign: any): CampaignOption | null {
  const id = String(
    getIdString(campaign?.campaignId) ||
    getIdString(campaign?._id) ||
    campaign?.campaignsId ||
    campaign?.id ||
    ""
  ).trim();

  if (!id) return null;

  const label = getCampaignOptionDisplayName(campaign, id);

  return {
    id,
    label,
    type: "campaign",
    isFullyManaged: Boolean(campaign?.isFullyManaged),
    raw: campaign,
  };
}

function buildCampaignOptionsFromGoodFitFolders(folders: any[]): CampaignOption[] {
  const map = new Map<string, CampaignOption>();

  folders.forEach((folder) => {
    const option = mapFolderToCampaignOption(folder);
    if (!option || map.has(option.id)) return;

    map.set(option.id, option);
  });

  return Array.from(map.values()).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
}

function buildCreateCampaignOptions(campaigns: any[]): CampaignOption[] {
  const map = new Map<string, CampaignOption>();

  campaigns.forEach((campaign) => {
    const option = mapRawCampaignToCampaignOption(campaign);

    if (!option || map.has(option.id)) return;

    map.set(option.id, option);
  });

  return Array.from(map.values()).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
}

function getRowCampaignId(row: InfluencerRow) {
  const campaign = row.relatedCampaigns.find((item) => {
    const id = getIdString(item.campaignId) || item.campaignsId;
    return Boolean(id);
  });

  return String(
    getIdString(campaign?.campaignId) ||
    campaign?.campaignsId ||
    ""
  ).trim();
}

function getRowCampaignName(row: InfluencerRow) {
  const campaign = row.relatedCampaigns[0];

  return String(
    campaign?.campaignTitle ||
    row.raw?.relatedCampaigns?.[0]?.campaignTitle ||
    row.campaignName ||
    "—"
  ).trim();
}

function getCampaignDisplayName(campaign?: RelatedCampaign | null) {
  return String(
    campaign?.campaignTitle ||
    campaign?.productOrServiceName ||
    campaign?.campaignsId ||
    getIdString(campaign?.campaignId) ||
    ""
  ).trim();
}

function getCampaignKeyFromCampaign(campaign?: RelatedCampaign | null, fallback = "") {
  return String(
    getIdString(campaign?.campaignId) ||
    campaign?.campaignsId ||
    campaign?.campaignTitle ||
    campaign?.productOrServiceName ||
    fallback
  ).trim();
}

function getRowInvitedCampaignNames(
  row: InfluencerRow,
  locks: InvitationCampaignLock[] = []
) {
  const map = new Map<string, string>();

  locks.forEach((lock, index) => {
    const key = String(lock.campaignId || `lock-${index}`).trim();
    const label = String(lock.campaignTitle || getShortIdLabel("Campaign", key)).trim();

    if (!key || !label || label === "—") return;

    map.set(key, label);
  });

  if (!map.size) {
    row.relatedCampaigns.forEach((campaign, index) => {
      const key = getCampaignKeyFromCampaign(campaign, `campaign-${index}`);
      const label = getCampaignDisplayName(campaign);

      if (!key || !label || label === "—") return;

      map.set(key, label);
    });
  }

  if (!map.size && row.campaignName && row.campaignName !== "—") {
    map.set(row.campaignName, row.campaignName);
  }

  return Array.from(map.values());
}

function CampaignNamesCell({
  row,
  locks = [],
  singleOnly = false,
}: {
  row: InfluencerRow;
  locks?: InvitationCampaignLock[];
  singleOnly?: boolean;
}) {
  if (singleOnly) {
    const campaignName = getRowCampaignName(row);

    if (!campaignName || campaignName === "—") {
      return <span className="text-[#777777]">—</span>;
    }

    return (
      <span
        className="block max-w-[145px] truncate"
        title={campaignName}
      >
        {campaignName}
      </span>
    );
  }

  const campaignNames = getRowInvitedCampaignNames(row, locks);
  const [firstCampaignName] = campaignNames;
  const remainingCount = Math.max(0, campaignNames.length - 1);
  const title = campaignNames.length ? campaignNames.join("\n") : "—";

  if (!firstCampaignName) {
    return <span className="text-[#777777]">—</span>;
  }

  return (
    <div
      className="flex max-w-[145px] items-center gap-1.5"
      title={title}
    >
      <span className="min-w-0 flex-1 truncate">
        {firstCampaignName}
      </span>

      {remainingCount > 0 ? (
        <span className="shrink-0 rounded-full bg-[#F3F3F3] px-1.5 py-0.5 text-[10px] font-semibold text-[#555555]">
          +{remainingCount}
        </span>
      ) : null}
    </div>
  );
}


function getDisplayRowStatus(
  row: InfluencerRow,
  locks: InvitationCampaignLock[] = []
): InfluencerStatus {
  if (locks.length > 0) return "Sent";

  const rawStatus = String(
    row.raw?.status ||
    row.raw?.invitation?.status ||
    row.status ||
    ""
  )
    .trim()
    .toLowerCase();

  if (
    rawStatus === "sent" ||
    rawStatus === "invited" ||
    rawStatus === "followup_sent" ||
    rawStatus === "follow_up_sent"
  ) {
    return "Sent";
  }

  return row.status;
}

function getRowPlatform(row: InfluencerRow) {
  return String(
    row.raw?.provider ||
    row.raw?.filterData?.provider ||
    getItemModash(row.raw)?.provider ||
    "youtube"
  )
    .trim()
    .toLowerCase();
}

function getInvitationHandle(row: InfluencerRow) {
  const handle = String(row.handle || row.raw?.handle || row.username || "")
    .trim();

  if (!handle || handle === "—") return "";

  return handle.startsWith("@") ? handle : `@${handle}`;
}

function getInvitationCreatedAtFromResponse(payload: any) {
  return String(
    payload?.data?.createdAt ||
    payload?.data?.invitation?.createdAt ||
    payload?.data?.data?.createdAt ||
    payload?.data?.data?.invitation?.createdAt ||
    payload?.createdAt ||
    ""
  ).trim();
}

function getInvitationIdFromResponse(payload: any) {
  return String(
    payload?.data?._id ||
    payload?.data?.invitationId ||
    payload?.data?.invitation?._id ||
    payload?.data?.invitation?.invitationId ||
    payload?.data?.data?._id ||
    payload?.data?.data?.invitationId ||
    payload?.data?.data?.invitation?._id ||
    payload?.data?.data?.invitation?.invitationId ||
    payload?._id ||
    payload?.invitationId ||
    ""
  ).trim();
}
function getInvitationMessage(payload: any) {
  return String(
    payload?.message ||
    payload?.data?.message ||
    payload?.data?.data?.message ||
    payload?.result?.message ||
    payload?.response?.data?.message ||
    payload?.error ||
    payload?.data?.error ||
    ""
  ).trim();
}

function isInvitationSuccessResponse(payload: any) {
  const status = String(payload?.status || payload?.data?.status || "")
    .trim()
    .toLowerCase();
  const message = getInvitationMessage(payload).toLowerCase();

  return (
    payload?.success === true ||
    status === "saved" ||
    status === "exists" ||
    status === "created" ||
    status === "success" ||
    status === "sent" ||
    message.includes("invitation created successfully") ||
    message.includes("created successfully") ||
    message.includes("sent successfully")
  );
}

function extractInvitationList(payload: any): Invitation[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.invitations)) return payload.invitations;
  if (Array.isArray(payload?.data?.invitations)) return payload.data.invitations;
  if (Array.isArray(payload?.data?.data?.invitations)) return payload.data.data.invitations;
  return [];
}

function getInvitationCampaignId(invitation: any) {
  return String(
    invitation?.campaignId ||
    invitation?.campaign?._id ||
    invitation?.campaign?.id ||
    invitation?.campaign?.campaignId ||
    ""
  ).trim();
}

function getInvitationUserId(invitation: any) {
  return String(
    invitation?.userId ||
    invitation?.modashUserId ||
    invitation?.influencerId ||
    invitation?.creatorId ||
    invitation?.raw?.userId ||
    invitation?.raw?.modashUserId ||
    ""
  ).trim();
}

function getInvitationIdentityKeyFromValues(userId?: string, handle?: string, platform?: string) {
  const cleanUserId = String(userId || "").trim();

  if (cleanUserId && cleanUserId !== "undefined" && cleanUserId !== "null") {
    return `user:${cleanUserId}`;
  }

  const cleanHandle = String(handle || "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();
  const cleanPlatform = String(platform || "").trim().toLowerCase();

  return cleanHandle ? `handle:${cleanPlatform}:${cleanHandle}` : "";
}

function getInvitationIdentityKeyFromInvitation(invitation: any) {
  return getInvitationIdentityKeyFromValues(
    getInvitationUserId(invitation),
    invitation?.handle,
    invitation?.platform
  );
}

function getInvitationLockFromInvitation(invitation: any): InvitationCampaignLock | null {
  const campaignId = getInvitationCampaignId(invitation);
  if (!campaignId) return null;

  const statusText = String(
    invitation?.status ||
    invitation?.followUpStatus ||
    invitation?.followupStatus ||
    ""
  ).toLowerCase();

  const followUpSentAt = String(
    invitation?.followUpSentAt ||
    invitation?.followupSentAt ||
    invitation?.lastFollowUpAt ||
    invitation?.lastFollowupAt ||
    ""
  ).trim();

  const isPermanent = Boolean(
    invitation?.isPermanent ||
    invitation?.permanentLock ||
    invitation?.permanentCampaignLock ||
    invitation?.lockPermanently ||
    invitation?.followUpSentAt ||
    invitation?.isFollowUp ||
    invitation?.followUp ||
    invitation?.followup ||
    followUpSentAt ||
    statusText.includes("follow") ||
    statusText.includes("permanent")
  );

  const createdAt = String(
    followUpSentAt ||
    invitation?.createdAt ||
    invitation?.updatedAt ||
    new Date().toISOString()
  ).trim();
  const createdTime = new Date(createdAt).getTime();
  const safeCreatedTime = Number.isNaN(createdTime) ? Date.now() : createdTime;
  const expiresAt = isPermanent
    ? undefined
    : new Date(safeCreatedTime + 24 * 60 * 60 * 1000).toISOString();

  return {
    invitationId: String(invitation?._id || invitation?.invitationId || "").trim(),
    campaignId,
    campaignTitle: String(
      invitation?.campaignName ||
      invitation?.campaignTitle ||
      invitation?.campaign?.campaignTitle ||
      invitation?.campaign?.campaignName ||
      invitation?.campaign?.name ||
      invitation?.campaign?.title ||
      getShortIdLabel("Campaign", campaignId)
    ).trim(),
    createdAt: new Date(safeCreatedTime).toISOString(),
    expiresAt,
    status: invitation?.status,
    isPermanent,
    followUpSentAt:
      followUpSentAt || String(invitation?.followUpSentAt || "").trim() || undefined,
  };
}

function isCampaignLockPermanent(lock: InvitationCampaignLock | null | undefined) {
  return Boolean(lock?.isPermanent);
}

function getLockRemainingMs(lock: InvitationCampaignLock | null | undefined, now = Date.now()) {
  if (isCampaignLockPermanent(lock)) return Number.POSITIVE_INFINITY;
  if (!lock?.expiresAt) return 0;
  const expiresAt = new Date(lock.expiresAt).getTime();
  if (Number.isNaN(expiresAt)) return 0;
  return Math.max(0, expiresAt - now);
}

function isCampaignLockActive(lock: InvitationCampaignLock | null | undefined, now = Date.now()) {
  return isCampaignLockPermanent(lock) || getLockRemainingMs(lock, now) > 0;
}

function formatLockRemaining(ms: number) {
  if (!Number.isFinite(ms)) return "Permanent";
  if (ms <= 0) return "00:00";

  const totalMinutes = Math.ceil(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function getCampaignLockLabel(lock: InvitationCampaignLock | null | undefined, now = Date.now()) {
  if (isCampaignLockPermanent(lock)) return "Locked permanently";

  const remaining = getLockRemainingMs(lock, now);
  return remaining > 0 ? `Locked ${formatLockRemaining(remaining)}` : "Follow up";
}

function showToastMessage(
  type: "success" | "error" | "info" | "warning",
  title: string,
  description?: string
) {
  toast({
    icon: type,
    title,
    text: description,
  });
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getRowDateValue(row: InfluencerRow) {
  const raw: any = row.raw || {};

  const value = String(
    raw.createdAt ||
    raw.updatedAt ||
    raw.addedAt ||
    raw.invitedAt ||
    raw.invitationDate ||
    raw.invitationCreatedAt ||
    raw.invitation?.createdAt ||
    raw.source?.importedAt ||
    ""
  ).trim();

  if (!value && row.invitationDate && row.invitationDate !== "-") {
    const currentYear = new Date().getFullYear();
    const date = new Date(`${row.invitationDate}/${currentYear}`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function rowMatchesDateFilter(row: InfluencerRow, filter: DateFilterValue) {
  if (filter === "all") return true;

  const rowDate = getRowDateValue(row);
  if (!rowDate) return false;

  const today = startOfDay(new Date());
  const rowDay = startOfDay(rowDate);

  if (filter === "today") {
    return rowDay.getTime() === today.getTime();
  }

  if (filter === "yesterday") {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return rowDay.getTime() === yesterday.getTime();
  }

  if (filter === "last_7_days") {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return rowDay >= start && rowDay <= today;
  }

  if (filter === "last_30_days") {
    const start = new Date(today);
    start.setDate(start.getDate() - 29);
    return rowDay >= start && rowDay <= today;
  }

  if (filter === "this_month") {
    return (
      rowDay.getFullYear() === today.getFullYear() &&
      rowDay.getMonth() === today.getMonth()
    );
  }

  if (filter === "last_month") {
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    return (
      rowDay.getFullYear() === lastMonth.getFullYear() &&
      rowDay.getMonth() === lastMonth.getMonth()
    );
  }

  return true;
}

function isDuplicateInvitationError(error: any) {
  const message = String(
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    ""
  ).toLowerCase();

  return (
    message.includes("duplicate") ||
    message.includes("dup key") ||
    message.includes("already invited") ||
    message.includes("already exists")
  );
}

function isSupportedInvitationPlatform(platform: string) {
  return ["youtube", "instagram", "tiktok"].includes(platform);
}

function getCampaignOptionById(
  campaignOptions: CampaignOption[],
  campaignId?: string | null
) {
  const id = String(campaignId || "").trim();

  if (!id) return null;

  return (
    campaignOptions.find((campaign) => campaign.id === id) ||
    campaignOptions.find((campaign) => campaign.queryCampaignId === id) ||
    null
  );
}

function getCampaignLabelById(
  campaignOptions: CampaignOption[],
  campaignId?: string | null
) {
  return getCampaignOptionById(campaignOptions, campaignId)?.label || "";
}

function Avatar({ index, name, src }: { index: number; name: string; src?: string }) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const safeSrc = String(src || "").trim();
  const colors = [
    "bg-[#E7C0B1] text-[#9B634F]",
    "bg-[#8C4B30] text-white",
    "bg-[#F3E0D8] text-[#9B7B6E]",
    "bg-[#D4A47D] text-white",
    "bg-[#F0C8B3] text-[#8D5D4F]",
    "bg-[#B8C5BF] text-white",
    "bg-[#C5D0CB] text-[#607068]",
    "bg-[#161616] text-white",
    "bg-[#4B4B4B] text-white",
  ];

  const initials =
    name && name !== "—"
      ? name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
      : "";

  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full ${colors[index % colors.length]
        }`}
    >
      {safeSrc && !imageFailed ? (
        <img
          src={safeSrc}
          alt={name && name !== "—" ? `${name} profile picture` : "Profile picture"}
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
      ) : initials ? (
        <span className="text-xs font-semibold">{initials}</span>
      ) : (
        <UserIcon size={15} weight="fill" />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: InfluencerStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium before:h-1.5 before:w-1.5 before:rounded-full ${statusStyles[status] || statusStyles.Pending}`}
    >
      {status}
    </span>
  );
}

function CountryCell({ country }: { country: string }) {
  const { name, flag } = getCountryDisplay(country);

  if (!name || name === "—") {
    return <span className="text-[#777777]">—</span>;
  }

  return (
    <div className="flex max-w-[190px] items-center gap-2 truncate" title={name}>
      <span className="text-base leading-none">{flag || "🌐"}</span>
      <span className="truncate">{name}</span>
    </div>
  );
}

function getRowEmail(row: InfluencerRow | null) {
  if (!row) return "";

  const raw: any = row.raw || {};
  const rawRaw: any = raw.raw || {};

  return String(
    raw.email ||
    rawRaw.email ||
    raw.profile?.email ||
    raw.creator?.email ||
    ""
  ).trim();
}

// function getEmailEditorSubject(context: PendingInvitationContext | null) {
//   if (!context) return "";

//   return context.campaignTitle && context.campaignTitle !== "—"
//     ? `Collaboration invitation for ${context.campaignTitle}`
//     : "Collaboration invitation";
// }

function escapeTemplateHtml(value: string) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getBrandDisplayName() {
  if (typeof window === "undefined") return "CollabGlam";

  return (
    localStorage.getItem("brandName") ||
    localStorage.getItem("brand_name") ||
    "CollabGlam"
  );
}

function getCampaignValue(campaign: any, paths: string[]) {
  for (const path of paths) {
    const value = readPathValue(campaign, path);
    const text = readableTextFromUnknown(value);

    if (text && text !== "—") return text;
  }

  return "";
}

function getCampaignListValue(campaign: any, paths: string[]) {
  for (const path of paths) {
    const value = readPathValue(campaign, path);
    const list = readableListFromUnknown(value);

    if (list.length) return list.join(", ");
  }

  return "";
}

function formatDateForEmail(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return "";

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getCampaignTimelineValue(campaign: any) {
  const directTimeline = getCampaignValue(campaign, [
    "timeline",
    "campaignTimeline",
    "campaign_timeline",
    "duration",
    "schedule",
    "brief.timeline",
    "details.timeline",
  ]);

  if (directTimeline) return directTimeline;

  const start =
    formatDateForEmail(
      campaign?.startAt ||
      campaign?.startDate ||
      campaign?.campaignStartDate ||
      campaign?.timeline?.startAt ||
      campaign?.timeline?.startDate
    ) || "";

  const end =
    formatDateForEmail(
      campaign?.endAt ||
      campaign?.endDate ||
      campaign?.campaignEndDate ||
      campaign?.timeline?.endAt ||
      campaign?.timeline?.endDate
    ) || "";

  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  if (end) return end;

  return "";
}

function getCampaignDetailsForEmail(context: PendingInvitationContext | null) {
  const selectedCampaign = context?.selectedCampaign || {};
  const campaignName = context?.campaignTitle || "";

  const campaignTitle =
    selectedCampaign?.campaignTitle ||
    selectedCampaign?.campaign_name ||
    selectedCampaign?.campaignName ||
    selectedCampaign?.title ||
    selectedCampaign?.name ||
    selectedCampaign?.productOrServiceName ||
    campaignName ||
    "your campaign";

  const objective = getCampaignValue(selectedCampaign, [
    "objective",
    "campaignObjective",
    "campaign_objective",
    "goal",
    "goals",
    "description",
    "brief.objective",
    "brief.description",
    "details.objective",
    "details.description",
  ]);

  const deliverables =
    getCampaignListValue(selectedCampaign, [
      "deliverables",
      "deliverablesRequired",
      "campaignDeliverables",
      "contentDeliverables",
      "contentRequirements",
      "requirements",
      "brief.deliverables",
      "brief.contentRequirements",
      "details.deliverables",
    ]) ||
    getCampaignValue(selectedCampaign, [
      "deliverables",
      "deliverablesRequired",
      "campaignDeliverables",
      "contentDeliverables",
      "contentRequirements",
      "requirements",
      "brief.deliverables",
      "details.deliverables",
    ]);

  const compensation = getCampaignValue(selectedCampaign, [
    "compensation",
    "campaignBudget",
    "budget",
    "campaign_budget",
    "rate",
    "price",
    "pricing",
    "payout",
    "payment",
    "brief.compensation",
    "brief.budget",
    "details.compensation",
    "details.budget",
  ]);

  const timeline = getCampaignTimelineValue(selectedCampaign);

  return {
    selectedCampaign,
    campaignTitle,
    objective,
    deliverables,
    compensation,
    timeline,
  };
}

function getEmailEditorSubject(context: PendingInvitationContext | null) {
  const brandName = getBrandDisplayName();

  return context?.mode === "followup"
    ? `Follow-up: Invitation to Collaborate - ${brandName}`
    : `Invitation to Collaborate - ${brandName}`;
}


function getEmailEditorHtmlBody(context: PendingInvitationContext | null) {
  if (!context) return "";

  const brandName = getBrandDisplayName();

  const displayName =
    context.row.profile &&
      context.row.profile !== "—" &&
      context.row.profile !== "Label"
      ? context.row.profile
      : "";

  const displayHandle = context.handle || context.row.handle || "";
  const creatorName = escapeTemplateHtml(displayName || displayHandle || "Creator");

  const {
    campaignTitle,
    objective,
    deliverables,
    compensation,
    timeline,
  } = getCampaignDetailsForEmail(context);

  const detailRows = [
    ["Campaign", campaignTitle],
    ["Brand", brandName],
    ["Objective", objective],
    ["Deliverables", deliverables],
    ["Compensation", compensation],
    ["Timeline", timeline],
  ]
    .filter(([, value]) => String(value || "").trim())
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eeeeee;color:#777777;font-size:13px;width:130px;">${escapeTemplateHtml(label)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eeeeee;color:#171717;font-size:13px;font-weight:600;">${escapeTemplateHtml(String(value))}</td>
        </tr>
      `
    )
    .join("");

  if (context.mode === "followup") {
    return `
      <div style="font-family:Inter, Arial, sans-serif;color:#171717;line-height:1.65;">
        <p>Hi ${creatorName},</p>
        <p>
          Just following up on our collaboration invitation for
          <strong> ${escapeTemplateHtml(campaignTitle)}</strong>. Your content style still feels like a
          strong match for <strong>${escapeTemplateHtml(brandName)}</strong>, and we would be excited to explore
          this campaign with you.
        </p>

        <div style="margin:18px 0;padding:18px;border:1px solid #eadfd9;border-radius:14px;background:#fffaf7;">
          <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#8c4b30;">Quick campaign recap</p>
          <table style="width:100%;border-collapse:collapse;background:#ffffff;border:1px solid #eeeeee;border-radius:10px;overflow:hidden;">
            <tbody>
              ${detailRows}
            </tbody>
          </table>
        </div>

        <p>
          If you are interested, please reply to this email and we can share the next steps, brief details,
          and any clarification you need before moving forward.
        </p>
        <p>
          We would love to hear your thoughts and hopefully build something meaningful together.
        </p>
        <p>Warm regards,<br /><strong>Team CollabGlam</strong></p>
      </div>
    `;
  }

  return `
    <p>Dear ${creatorName},</p>
    <p>I hope you are doing well.</p>
    <p>
      We are reaching out to formally invite you to collaborate with <strong>${escapeTemplateHtml(brandName)}</strong>
      for our upcoming campaign, <strong>"${escapeTemplateHtml(campaignTitle)}"</strong>. Based on your creative work and
      audience alignment, we believe you would be an excellent fit for this project.
    </p>
    <h3>Campaign Details</h3>
    <p><strong>Campaign Name:</strong> ${escapeTemplateHtml(campaignTitle)}</p>
    <p><strong>Brand:</strong> ${escapeTemplateHtml(brandName)}</p>
    <p><strong>Objective:</strong>${objective ? ` ${escapeTemplateHtml(objective)}` : ""}</p>
    <p><strong>Deliverables Required:</strong>${deliverables ? ` ${escapeTemplateHtml(deliverables)}` : ""}</p>
    <p><strong>Compensation:</strong>${compensation ? ` ${escapeTemplateHtml(compensation)}` : ""}</p>
    <p><strong>Campaign Timeline:</strong>${timeline ? ` ${escapeTemplateHtml(timeline)}` : ""}</p>
    <p>To proceed, please review the full brief using the button below.</p>
    <p>
      If you have any questions or need further clarification, feel free to contact the brand
      or reach out to CollabGlam Support.
    </p>
    <p>
      We look forward to the opportunity of working together and hope to have you onboard for this campaign.
    </p>
    <p>Warm regards,<br /><strong>Team CollabGlam</strong></p>
  `;
}


export default function CreatorHubPage() {
  const [activeTab, setActiveTab] = React.useState<CreatorHubTab>("hub");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState("");
  const [hubRows, setHubRows] = React.useState<InfluencerRow[]>([]);
  const [invitedRows, setInvitedRows] = React.useState<InfluencerRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [brandFolders, setBrandFolders] = React.useState<BrandFolder[]>([]);
  const [campaignOptions, setCampaignOptions] = React.useState<CampaignOption[]>([]);
  const [createCampaignOptions, setCreateCampaignOptions] = React.useState<CampaignOption[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = React.useState("all");
  const [selectedCategoryId, setSelectedCategoryId] = React.useState("all");
  const [selectedDateFilter, setSelectedDateFilter] =
    React.useState<DateFilterValue>("all");
  const [categoryOptions, setCategoryOptions] = React.useState<CategoryOption[]>([]);
  const [categoryLoading, setCategoryLoading] = React.useState(false);
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [profilePanelOpen, setProfilePanelOpen] = React.useState(false);
  const [profilePanelRow, setProfilePanelRow] = React.useState<InfluencerRow | null>(null);
  const [emailEditorOpen, setEmailEditorOpen] = React.useState(false);
  const [pendingInvitation, setPendingInvitation] =
    React.useState<PendingInvitationContext | null>(null);
  const [invitedRefreshKey, setInvitedRefreshKey] = React.useState(0);
  const [invitationLocks, setInvitationLocks] = React.useState<
    Record<string, Record<string, InvitationCampaignLock>>
  >({});
  const [lockNow, setLockNow] = React.useState(() => Date.now());
  const [moreFilters, setMoreFilters] = React.useState<MoreFiltersState>({
    search: { mode: "combined" },
    influencer: {},
    platform: {
      youtube: {},
      instagram: {},
      tiktok: {},
    },
    audience: {},
  });
  const [createFolderOpen, setCreateFolderOpen] = React.useState(false);
  const [createFolderName, setCreateFolderName] = React.useState("");
  const [createFolderTier, setCreateFolderTier] = React.useState("");
  const [createFolderCampaign, setCreateFolderCampaign] = React.useState("");
  const [createFolderSubmitting, setCreateFolderSubmitting] = React.useState(false);
  const [createFolderError, setCreateFolderError] = React.useState("");
  const [refreshFolderListKey, setRefreshFolderListKey] = React.useState(0);
  const [creatorTierComboboxOpen, setCreatorTierComboboxOpen] = React.useState(false);
  const [linkCampaignComboboxOpen, setLinkCampaignComboboxOpen] = React.useState(false);
  const [activeActionComboboxId, setActiveActionComboboxId] = React.useState<string | null>(null);
  const [activeInviteCampaignPickerId, setActiveInviteCampaignPickerId] = React.useState<string | null>(null);
  const [sendingInvitationId, setSendingInvitationId] = React.useState<string | null>(null);
  const [profilePanelLoading, setProfilePanelLoading] = React.useState(false);
  const [profilePanelError, setProfilePanelError] = React.useState<string | null>(null);
  const [profilePanelReport, setProfilePanelReport] = React.useState<any | null>(null);
  const [profilePanelLastFetchedAt, setProfilePanelLastFetchedAt] = React.useState<string | null>(null);
  const [profilePanelCalc, setProfilePanelCalc] = React.useState<"median" | "average">("median");

  React.useEffect(() => {
    const initialTab = getTabFromSearchParam();

    setActiveTab(initialTab);
    writeTabToSearchParam(initialTab);

    const handlePopState = () => {
      setActiveTab(getTabFromSearchParam());
      setSelectedIds([]);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setLockNow(Date.now());
    }, 60 * 1000);

    return () => window.clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search]);

  const handleTabChange = (tab: CreatorHubTab) => {
    setActiveTab(tab);
    setSelectedIds([]);
    writeTabToSearchParam(tab);
  };

  const updateMoreFilter = React.useCallback((path: string, value: any) => {
    setMoreFilters((prev) => {
      const next: any = {
        ...prev,
        search: { ...prev.search },
        influencer: { ...prev.influencer },
        platform: {
          ...prev.platform,
          youtube: { ...(prev.platform as any).youtube },
          instagram: { ...(prev.platform as any).instagram },
          tiktok: { ...(prev.platform as any).tiktok },
        },
        audience: { ...prev.audience },
      };

      const keys = path.split(".").filter(Boolean);
      if (!keys.length) return next;

      let cursor = next;

      for (let index = 0; index < keys.length - 1; index += 1) {
        const key = keys[index];
        cursor[key] = { ...(cursor[key] || {}) };
        cursor = cursor[key];
      }

      const finalKey = keys[keys.length - 1];

      if (value === undefined || value === null || value === "") {
        delete cursor[finalKey];
      } else {
        cursor[finalKey] = value;
      }

      return next;
    });
  }, []);

  const resetMoreFilters = React.useCallback(() => {
    setMoreFilters({
      search: { mode: "combined" },
      influencer: {},
      platform: {
        youtube: {},
        instagram: {},
        tiktok: {},
      },
      audience: {},
    });
  }, []);


  const resetCreateFolderForm = React.useCallback(() => {
    setCreateFolderName("");
    setCreateFolderTier("");
    setCreateFolderCampaign("");
    setCreateFolderError("");
    setCreatorTierComboboxOpen(false);
    setLinkCampaignComboboxOpen(false);
  }, []);

  const handleCreateFolder = React.useCallback(async () => {
    const title = createFolderName.trim();

    if (!title) {
      setCreateFolderError("Folder name is required.");
      return;
    }

    try {
      setCreateFolderSubmitting(true);
      setCreateFolderError("");

      const payload: Record<string, any> = {
        title,
        name: title,
        description: "",
        type: "folder",
        folderType: "folder",
        kind: "folder",
      };

      if (createFolderCampaign && createFolderCampaign !== NO_CAMPAIGN_VALUE) {
        payload.campaignId = createFolderCampaign;
        payload.linkedCampaignId = createFolderCampaign;
      }

      if (createFolderTier) {
        payload.creatorTier = createFolderTier;
        payload.tier = createFolderTier;
      }

      const response = await apiBrandFolderCreate(payload as any);

      const createdFolderId = String(
        (response as any)?.data?._id ||
        (response as any)?.data?.id ||
        (response as any)?._id ||
        (response as any)?.id ||
        ""
      );

      resetCreateFolderForm();
      setCreateFolderOpen(false);
      setRefreshFolderListKey((prev) => prev + 1);
      showToastMessage("success", "Folder created successfully.");

      if (createdFolderId) {
        setSelectedCampaignId(createdFolderId);
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create folder.";

      setCreateFolderError(message);
      showToastMessage("error", message);
    } finally {
      setCreateFolderSubmitting(false);
    }
  }, [
    createFolderCampaign,
    createFolderName,
    createFolderTier,
    resetCreateFolderForm,
  ]);

  const getRowInvitationIdentityKey = React.useCallback((row: InfluencerRow) => {
    const userId = getRowUserId(row);
    const handle = getInvitationHandle(row);
    const platform = getRowPlatform(row);

    return getInvitationIdentityKeyFromValues(userId, handle, platform);
  }, []);

  const mergeInvitationLocks = React.useCallback((items: Invitation[]) => {
    setInvitationLocks((prev) => {
      const next: Record<string, Record<string, InvitationCampaignLock>> = {
        ...prev,
      };

      items.forEach((item) => {
        const identityKey = getInvitationIdentityKeyFromInvitation(item);
        const lock = getInvitationLockFromInvitation(item);

        if (!identityKey || !lock) return;

        const currentLock = next[identityKey]?.[lock.campaignId];
        const finalLock = isCampaignLockPermanent(currentLock)
          ? { ...lock, ...currentLock }
          : lock;

        next[identityKey] = {
          ...(next[identityKey] || {}),
          [lock.campaignId]: finalLock,
        };
      });

      return next;
    });
  }, []);

  const loadInvitationLocksForRow = React.useCallback(
    async (row: InfluencerRow) => {
      const brandId = getStoredBrandId();
      const handle = getInvitationHandle(row);
      const platform = getRowPlatform(row);
      const userId = getRowUserId(row);

      if (!brandId) return [];

      try {
        const response = await apiNewInvitationsList({
          brandId,
          userId,
          modashUserId: userId,
          handle,
          platform,
          page: 1,
          limit: 100,
          status: "all",
        } as any);

        const items = extractInvitationList(response);
        mergeInvitationLocks(items);

        return items;
      } catch (err) {
        console.error("Failed to check invitation locks", err);
        return [];
      }
    },
    [mergeInvitationLocks]
  );

  const getCampaignLockForRow = React.useCallback(
    (row: InfluencerRow, campaignId: string) => {
      const identityKey = getRowInvitationIdentityKey(row);
      if (!identityKey) return null;

      return invitationLocks[identityKey]?.[campaignId] || null;
    },
    [getRowInvitationIdentityKey, invitationLocks]
  );

  const getCampaignLocksForRow = React.useCallback(
    (row: InfluencerRow) => {
      const identityKey = getRowInvitationIdentityKey(row);
      if (!identityKey) return [];

      return Object.values(invitationLocks[identityKey] || {});
    },
    [getRowInvitationIdentityKey, invitationLocks]
  );

  const openEmailEditorForCampaign = React.useCallback(
    (
      row: InfluencerRow,
      campaignId: string,
      mode: PendingInvitationMode = "invite",
      lock?: InvitationCampaignLock | null
    ) => {
      const handle = getInvitationHandle(row);

      if (!handle) {
        setError("Invalid or missing handle to send invitation.");
        showToastMessage("error", "Invalid or missing handle to send invitation.");
        return;
      }

      const brandId = getStoredBrandId();

      if (!brandId) {
        setError("Missing brandId in localStorage.");
        showToastMessage("error", "Missing brandId in localStorage.");
        return;
      }

      const platform = getRowPlatform(row);

      if (!isSupportedInvitationPlatform(platform)) {
        setError("Unsupported or missing platform.");
        showToastMessage("error", "Unsupported or missing platform.");
        return;
      }

      if (!/^[A-Za-z0-9._-]+$/.test(handle.replace(/^@/, ""))) {
        setError("Invalid or missing handle to send invitation.");
        showToastMessage("error", "Invalid or missing handle to send invitation.");
        return;
      }

      const selectedCampaignOption =
        getCampaignOptionById(createCampaignOptions, campaignId) ||
        getCampaignOptionById(campaignOptions, campaignId);

      const selectedCampaign = selectedCampaignOption?.raw || null;

      const selectedCampaignTitle =
        selectedCampaign?.campaignTitle ||
        selectedCampaign?.campaignName ||
        selectedCampaign?.title ||
        selectedCampaign?.name ||
        selectedCampaign?.productOrServiceName ||
        selectedCampaignOption?.label ||
        getRowCampaignName(row);

      setError("");
      setActiveInviteCampaignPickerId(null);

      setPendingInvitation({
        row,
        campaignId,
        campaignTitle: selectedCampaignTitle,
        selectedCampaign,
        handle,
        platform,
        brandId,
        mode,
        invitationId: lock?.invitationId,
      });

      setEmailEditorOpen(true);
    },
    [campaignOptions, createCampaignOptions]
  );

  const handleSendInvitation = React.useCallback(
    async (row: InfluencerRow, campaignIdOverride?: string) => {
      const campaignId = String(
        campaignIdOverride || getRowCampaignId(row) || ""
      ).trim();

      if (!campaignId) {
        setActiveInviteCampaignPickerId(row.id);
        void loadInvitationLocksForRow(row);
        return;
      }

      const freshInvitations = await loadInvitationLocksForRow(row);
      const freshLock =
        freshInvitations
          .map(getInvitationLockFromInvitation)
          .find((lock) => lock?.campaignId === campaignId) || null;

      const existingLock = freshLock || getCampaignLockForRow(row, campaignId);

      if (isCampaignLockPermanent(existingLock)) {
        showToastMessage(
          "info",
          "Campaign permanently locked",
          "A follow-up has already been sent for this campaign, so it cannot be invited again."
        );
        return;
      }

      if (isCampaignLockActive(existingLock, Date.now())) {
        const remaining = formatLockRemaining(getLockRemainingMs(existingLock, Date.now()));
        showToastMessage(
          "info",
          "Invitation already sent",
          `This campaign is locked for ${remaining}. You can send a follow-up after 24 hours.`
        );
        return;
      }

      openEmailEditorForCampaign(row, campaignId, existingLock ? "followup" : "invite", existingLock);
    },
    [getCampaignLockForRow, loadInvitationLocksForRow, openEmailEditorForCampaign]
  );

  const handleFollowUpInvitation = React.useCallback(
    (row: InfluencerRow, campaignId: string) => {
      const lock = getCampaignLockForRow(row, campaignId);

      if (isCampaignLockPermanent(lock)) {
        showToastMessage(
          "info",
          "Campaign permanently locked",
          "A follow-up has already been sent for this campaign."
        );
        return;
      }

      openEmailEditorForCampaign(row, campaignId, "followup", lock);
    },
    [getCampaignLockForRow, openEmailEditorForCampaign]
  );

  const handleEmailEditorSend = React.useCallback(
    async (emailPayload: EmailEditorPayload) => {
      if (!pendingInvitation) return;

      const {
        row,
        campaignId,
        campaignTitle,
        handle,
        platform,
        brandId,
        mode,
        invitationId,
      } = pendingInvitation;

      let backendToastMessage = "";

      try {
        setSendingInvitationId(row.id);
        setError("");

        const invitationPayload: {
          handle: string;
          platform: string;
          brandId: string;
          status: "invited" | "available";
          campaignId?: string;
          campaignTitle?: string;
          userId?: string;
          emailSubject?: string;
          emailBody?: string;
          emailHtmlBody?: string;
          emailTo?: string;
          emailAttachments?: EmailEditorPayload["attachments"];
          email?: EmailEditorPayload;
          isFollowUp?: boolean;
          followUp?: boolean;
          lockPermanently?: boolean;
          permanentCampaignLock?: boolean;
          followUpSentAt?: string;
          invitationId?: string;
          emailTemplate?: {
            subject?: string;
            textBody?: string;
            htmlBody?: string;
            attachments?: EmailEditorPayload["attachments"];
          };
        } = {
          handle,
          platform,
          brandId,
          status: "invited",
          campaignId,
          campaignTitle,
          userId: getRowUserId(row),
          emailSubject: emailPayload.subject,
          emailBody: emailPayload.body,
          emailHtmlBody: emailPayload.htmlBody,
          emailTo: emailPayload.to,
          emailAttachments: emailPayload.attachments,
          email: emailPayload,
          isFollowUp: mode === "followup",
          followUp: mode === "followup",
          lockPermanently: mode === "followup",
          permanentCampaignLock: mode === "followup",
          followUpSentAt: mode === "followup" ? new Date().toISOString() : undefined,
          invitationId,
          emailTemplate: {
            subject: emailPayload.subject,
            textBody: emailPayload.body,
            htmlBody: emailPayload.htmlBody,
            attachments: emailPayload.attachments,
          },
        };

        let invitationCreatedAt = "";
        let createdInvitationId = "";

        try {
          const resp =
            mode === "followup"
              ? await apiNewInvitationFollowUp(invitationPayload)
              : await apiNewInvitationCreate(invitationPayload);

          backendToastMessage =
            getInvitationMessage(resp) ||
            (mode === "followup"
              ? "Follow-up sent successfully."
              : "Invitation created successfully.");

          if (!isInvitationSuccessResponse(resp)) {
            throw new Error(
              backendToastMessage ||
              "We couldn’t send the invitation. Please try again in a moment."
            );
          }

          invitationCreatedAt = getInvitationCreatedAtFromResponse(resp);
          createdInvitationId = getInvitationIdFromResponse(resp);
        } catch (invitationError: any) {
          const duplicateMessage =
            invitationError?.response?.data?.message ||
            invitationError?.response?.data?.error ||
            invitationError?.message ||
            "";

          if (mode !== "followup" && isDuplicateInvitationError(invitationError)) {
            console.error("Invitation/create duplicate", invitationError);
            backendToastMessage = duplicateMessage || "Invitation already exists.";
            invitationCreatedAt = new Date().toISOString();
          } else {
            throw invitationError;
          }
        }

        const sentAt = invitationCreatedAt || new Date().toISOString();
        const sentDate = new Date(sentAt);
        const safeSentTime = Number.isNaN(sentDate.getTime())
          ? Date.now()
          : sentDate.getTime();

        const expiresAt = mode === "followup"
          ? undefined
          : new Date(safeSentTime + 24 * 60 * 60 * 1000).toISOString();

        const identityKey = getRowInvitationIdentityKey(row);

        if (identityKey) {
          setInvitationLocks((prev) => ({
            ...prev,
            [identityKey]: {
              ...(prev[identityKey] || {}),
              [campaignId]: {
                invitationId: createdInvitationId || invitationId,
                campaignId,
                campaignTitle,
                createdAt: new Date(safeSentTime).toISOString(),
                expiresAt,
                status: mode === "followup" ? "followup_sent" : "sent",
                isPermanent: mode === "followup",
                followUpSentAt: mode === "followup" ? sentAt : undefined,
              },
            },
          }));
        }

        setHubRows((prev) =>
          prev.map((item) => {
            if (item.id !== row.id) return item;

            const campaignPayload: RelatedCampaign = {
              campaignId,
              campaignTitle: campaignTitle || undefined,
              assignedAt: sentAt,
            };

            const alreadyHasCampaign = item.relatedCampaigns.some((campaign) => {
              const existingId =
                getIdString(campaign.campaignId) || campaign.campaignsId;

              return existingId === campaignId;
            });

            return {
              ...item,
              status: "Sent",
              campaignName: campaignTitle || item.campaignName,
              invitationDate: formatDate(sentAt),
              relatedCampaigns: alreadyHasCampaign
                ? item.relatedCampaigns.map((campaign) => {
                  const existingId =
                    getIdString(campaign.campaignId) || campaign.campaignsId;

                  return existingId === campaignId
                    ? {
                      ...campaign,
                      campaignTitle:
                        campaign.campaignTitle ||
                        campaignTitle ||
                        undefined,
                      assignedAt: campaign.assignedAt || sentAt,
                    }
                    : campaign;
                })
                : [...item.relatedCampaigns, campaignPayload],
            };
          })
        );

        showToastMessage(
          "success",
          backendToastMessage ||
          (mode === "followup"
            ? "Follow-up sent successfully."
            : "Invitation sent successfully.")
        );

        setInvitedRefreshKey((prev) => prev + 1);
        handleTabChange("invited");
      } catch (err: any) {
        const backendErrorMessage =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to send invitation.";

        showToastMessage("error", backendErrorMessage);
      } finally {
        setSendingInvitationId(null);
        setEmailEditorOpen(false);
        setPendingInvitation(null);
        setActiveInviteCampaignPickerId(null);

        // Refresh visible data whether invite API succeeds or fails.
        setInvitedRefreshKey((prev) => prev + 1);
        setRefreshFolderListKey((prev) => prev + 1);
      }
    },
    [getRowInvitationIdentityKey, handleTabChange, pendingInvitation]
  );


  const getCampaignOptionLabel = React.useCallback(
    (value: string) => {
      if (value === "all") return "All";
      if (value === NO_CAMPAIGN_VALUE) return "No campaign";

      return (
        campaignOptions.find((campaign) => campaign.id === value)?.label ||
        createCampaignOptions.find((campaign) => campaign.id === value)?.label ||
        ""
      );
    },
    [campaignOptions, createCampaignOptions]
  );

  const campaignComboboxItems = React.useMemo(
    () => [NO_CAMPAIGN_VALUE, ...createCampaignOptions.map((campaign) => campaign.id)],
    [createCampaignOptions]
  );

  const selectedCategoryLabel = React.useMemo(() => {
    if (selectedCategoryId === "all") return "";

    return (
      categoryOptions.find((category) => category.id === selectedCategoryId)
        ?.label || ""
    );
  }, [categoryOptions, selectedCategoryId]);


  React.useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      try {
        setCategoryLoading(true);

        const response = await apiGetCategories();

        if (!mounted) return;

        setCategoryOptions(extractCategoryList(response));
      } catch (err: any) {
        if (!mounted) return;

        setCategoryOptions([]);

        setError(
          getApiErrorMessage(err) ||
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load categories."
        );
      } finally {
        if (mounted) setCategoryLoading(false);
      }
    }

    loadCategories();

    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    let mounted = true;

    async function loadBrandFolders() {
      try {
        setLoading(true);
        setError("");

        const brandId = getStoredBrandId();

        if (!brandId) {
          setBrandFolders([]);
          setHubRows([]);
          setCampaignOptions([]);
          setCreateCampaignOptions([]);
          setSelectedCampaignId("all");
          setSelectedIds([]);
          setError("Missing brandId in localStorage.");
          return;
        }

        const cacheBust = `${Date.now()}-${refreshFolderListKey}`;

        const [folderResponse, brandCreatedCampaignResponse, brandInvitationResponse] = await Promise.all([
          apiBrandFolderList({
            type: "all",
            includeItems: true,
            _t: cacheBust,
          } as any),

          apiGetNonFullManagedCampaigns({
            brandId,
            page: 1,
            limit: 500,
            _t: cacheBust,
          } as any).catch(() => null),

          apiNewInvitationsList({
            brandId,
            page: 1,
            limit: 1000,
            status: "all",
            _t: cacheBust,
          } as any).catch(() => null),
        ]);

        const folders = extractBrandFolderList(folderResponse);

        const options = buildCampaignOptionsFromGoodFitFolders(folders);

        const createOptions = buildCreateCampaignOptions(
          extractNonFullManagedCampaignList(brandCreatedCampaignResponse)
        );

        const invitationItems = extractInvitationList(brandInvitationResponse);

        if (!mounted) return;

        if (invitationItems.length) {
          mergeInvitationLocks(invitationItems);
        }

        setBrandFolders(folders);
        setCampaignOptions(options);
        setCreateCampaignOptions(createOptions);

        setSelectedCampaignId((current) => {
          if (current === "all") return "all";

          return options.some((option) => option.id === current)
            ? current
            : "all";
        });

        setSelectedIds([]);
      } catch (err: any) {
        if (!mounted) return;

        setError(
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load brand folders."
        );

        setBrandFolders([]);
        setHubRows([]);
        setCampaignOptions([]);
        setCreateCampaignOptions([]);
        setSelectedCampaignId("all");
        setSelectedIds([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadBrandFolders();

    return () => {
      mounted = false;
    };
  }, [refreshFolderListKey, mergeInvitationLocks]);

  React.useEffect(() => {
    const selectedFolders =
      selectedCampaignId === "all"
        ? brandFolders
        : brandFolders.filter((folder) => getBrandFolderId(folder) === selectedCampaignId);

    const items = mergeGoodFitItems(brandFoldersToGoodFitItems(selectedFolders));

    const rows = items
      .map((item, index) => {
        const row = mapGoodFitItem(item, index);
        const identityKey = getInvitationIdentityKeyFromValues(
          getRowUserId(row),
          getInvitationHandle(row),
          getRowPlatform(row)
        );

        const rowLocks = identityKey
          ? Object.values(invitationLocks[identityKey] || {})
          : [];

        return {
          ...row,
          status: rowLocks.length > 0 ? "Sent" : row.status,
        };
      })
      .filter((row) => rowMatchesSearch(row, debouncedSearch))
      .filter((row) => rowMatchesCategoryFilter(row, selectedCategoryLabel))
      .filter((row) => rowMatchesDateFilter(row, selectedDateFilter))
      .filter((row) => rowMatchesMoreFilters(row, moreFilters));

    setHubRows(rows);
    setSelectedIds([]);
  }, [
    selectedCampaignId,
    brandFolders,
    debouncedSearch,
    moreFilters,
    selectedCategoryLabel,
    selectedDateFilter,
    invitationLocks,
  ]);

  React.useEffect(() => {
    let mounted = true;

    async function loadInvitedInfluencers() {
      if (activeTab !== "invited") return;

      const brandId = getStoredBrandId();

      if (!brandId) {
        setInvitedRows([]);
        setError("Missing brandId in localStorage.");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await apiNewInvitationsList({
          brandId,
          page: 1,
          limit: 100,
          status: "all",
        });

        const items = extractInvitationList(response);

        if (!mounted) return;

        mergeInvitationLocks(items);

        setInvitedRows(items.map((item: Invitation, index: number) =>
          mapInvitationToRow(item, index)
        ));
        setSelectedIds([]);
      } catch (err: any) {
        if (!mounted) return;

        setError(
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load invited influencers."
        );

        setInvitedRows([]);
        setSelectedIds([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadInvitedInfluencers();

    return () => {
      mounted = false;
    };
  }, [activeTab, invitedRefreshKey, mergeInvitationLocks]);

  const displayRows = activeTab === "invited" ? invitedRows : hubRows;

  const filteredRows = React.useMemo(() => {
    return displayRows;
  }, [displayRows]);

  const allVisibleSelected =
    filteredRows.length > 0 &&
    filteredRows.every((row) => selectedIds.includes(row.id));

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !filteredRows.some((row) => row.id === id))
      );
      return;
    }

    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredRows.forEach((row) => next.add(row.id));
      return Array.from(next);
    });
  };

  const toggleRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  function getRowUserId(row: InfluencerRow | null) {
    if (!row) return "";

    const raw: any = row.raw || {};
    const rawRaw: any = raw.raw || {};
    const modash: any = getItemModash(raw) || {};

    const candidates = [
      raw.userId,
      rawRaw.userId,
      modash.userId,

      raw.influencerId,
      rawRaw.influencerId,
      modash.influencerId,

      raw.creatorId,
      rawRaw.creatorId,
      modash.creatorId,

      raw.modashId,
      rawRaw.modashId,
      modash.modashId,

      raw.profileKey,
      rawRaw.profileKey,
      modash.profileKey,

      raw.modash?._id,
      raw.modashProfile?._id,
      rawRaw.modash?._id,
      rawRaw.modashProfile?._id,
      modash._id,
    ];

    for (const value of candidates) {
      const id = String(value || "").trim();

      if (
        id &&
        id !== "undefined" &&
        id !== "null" &&
        id !== "—"
      ) {
        return id;
      }
    }

    return "";
  }

  function getPanelFallbackRaw(row: InfluencerRow | null) {
    if (!row) return null;

    const raw: any = row.raw || {};
    const modash: any = getItemModash(raw) || {};
    const userId = getRowUserId(row);
    const platform = getRowPlatform(row);
    const cleanHandle = String(
      modash.handle || raw.handle || raw.raw?.handle || row.handle || row.username || ""
    )
      .replace(/^@/, "")
      .trim();

    return {
      ...raw,
      ...modash,
      userId,
      influencerId: raw.influencerId || userId,
      creatorId: raw.creatorId || userId,
      modashId: raw.modashId || modash.modashId || userId,
      provider: raw.provider || raw.platform || raw.filterData?.provider || modash.provider || platform,
      platform,
      username: modash.username || raw.username || cleanHandle || row.username,
      handle: cleanHandle ? `@${cleanHandle}` : row.handle,
      fullname: modash.fullname || raw.fullname || raw.name || row.profile,
      name: raw.name || modash.fullname || row.profile,
      picture: getProfileImageUrl(raw) || modash.picture || row.avatarUrl,
      url: row.profileUrl || modash.url || raw.primaryLink || raw.profileUrl || raw.url || raw.links?.[0] || "",
      profile: {
        ...modash,
        userId,
        influencerId: raw.influencerId || userId,
        provider: raw.provider || raw.platform || modash.provider || platform,
        username: modash.username || raw.username || cleanHandle || row.username,
        handle: cleanHandle ? `@${cleanHandle}` : row.handle,
        fullname: modash.fullname || raw.fullname || raw.name || row.profile,
        picture: getProfileImageUrl(raw) || modash.picture || row.avatarUrl,
        url: row.profileUrl || modash.url || raw.primaryLink || raw.profileUrl || raw.url || raw.links?.[0] || "",
      },
    };
  }

  function extractReportPayload(response: any) {
    return (
      response?.data?.report ||
      response?.data?.profile ||
      response?.data ||
      response?.report ||
      response?.profile ||
      response ||
      null
    );
  }

  const fetchProfileReport = React.useCallback(
    async (row: InfluencerRow, calc: "median" | "average" = profilePanelCalc) => {
      const userId = getRowUserId(row);
      const platform = getRowPlatform(row);
      const fallbackRaw = getPanelFallbackRaw(row);

      setProfilePanelReport(fallbackRaw);
      setProfilePanelError(null);
      setProfilePanelLastFetchedAt(null);

      if (!userId) {
        setProfilePanelError(null);
        setProfilePanelLoading(false);
        return;
      }

      try {
        setProfilePanelLoading(true);

        const brandId = getStoredBrandId();

        const response = await api.get<any>("/modash/report", {
          params: {
            userId,
            platform,
            calc,
            brandId,
          },
        });

        const report = extractReportPayload(response);

        setProfilePanelReport(report || fallbackRaw);
        setProfilePanelLastFetchedAt(new Date().toISOString());
      } catch (err: any) {
        setProfilePanelReport(fallbackRaw);
        setProfilePanelError(
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to fetch creator report."
        );
      } finally {
        setProfilePanelLoading(false);
      }
    },
    [profilePanelCalc]
  );

  const openProfile = (row: InfluencerRow) => {
    setProfilePanelRow(row);
    setProfilePanelOpen(true);
    void fetchProfileReport(row);
  };

  const handlePanelCalcChange = React.useCallback(
    (calc: "median" | "average") => {
      setProfilePanelCalc(calc);

      if (profilePanelRow) {
        void fetchProfileReport(profilePanelRow, calc);
      }
    },
    [fetchProfileReport, profilePanelRow]
  );

  const profilePanelRaw = React.useMemo(() => {
    return profilePanelReport || getPanelFallbackRaw(profilePanelRow);
  }, [profilePanelReport, profilePanelRow]);

  const profilePanelHandle = React.useMemo(() => {
    if (!profilePanelRow) return null;

    const handle = String(
      profilePanelRaw?.handle ||
      profilePanelRaw?.username ||
      profilePanelRow.handle ||
      profilePanelRow.username ||
      ""
    )
      .replace(/^@/, "")
      .trim();

    return handle && handle !== "—" ? handle : null;
  }, [profilePanelRaw, profilePanelRow]);

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <div className="border-b border-[#E9E9E9] px-8">
        <div className="flex h-[58px] items-end gap-8">
          <button
            type="button"
            onClick={() => handleTabChange("hub")}
            className={`relative h-full pt-5 text-[12px] font-medium ${activeTab === "hub" ? "text-black" : "text-[#A0A0A0]"
              }`}
          >
            Influencer Hub
            {activeTab === "hub" ? (
              <span className="absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-black" />
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("invited")}
            className={`relative h-full pt-5 text-[12px] font-medium ${activeTab === "invited" ? "text-black" : "text-[#A0A0A0]"
              }`}
          >
            Invited Influencers
            {activeTab === "invited" ? (
              <span className="absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-black" />
            ) : null}
          </button>
        </div>
      </div>

      <main className="px-8 py-8 pb-20">
        <CreatorHubFilters
          selectedCampaignId={selectedCampaignId}
          setSelectedCampaignId={setSelectedCampaignId}
          selectedCategoryId={selectedCategoryId}
          setSelectedCategoryId={setSelectedCategoryId}
          categoryOptions={categoryOptions}
          categoryLoading={categoryLoading}
          search={search}
          setSearch={setSearch}
          setDebouncedSearch={setDebouncedSearch}
          moreFilters={moreFilters}
          updateMoreFilter={updateMoreFilter}
          resetMoreFilters={resetMoreFilters}
          loading={loading}
          campaignOptions={campaignOptions}
          getCampaignOptionLabel={getCampaignOptionLabel}
          selectedDateFilter={selectedDateFilter}
          setSelectedDateFilter={setSelectedDateFilter}
          onCreateFolderClick={() => {
            setCreateFolderError("");
            setCreateFolderOpen(true);
          }}
        />

        <div className="overflow-hidden rounded-lg border border-[#DCDCDC] bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-[1120px] w-full border-collapse text-left text-[12px]">
              <thead>
                <tr className="h-10 border-b border-[#DCDCDC] bg-white text-xs font-semibold text-[#171717]">
                  <th className="w-12 border-r border-[#E5E5E5] px-4">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      disabled={!filteredRows.length}
                      className="h-4 w-4 rounded border-[#CFCFCF] accent-black disabled:opacity-40"
                    />
                  </th>

                  <th className="w-[180px] border-r border-[#E5E5E5] px-4">
                    Profile
                  </th>

                  <th className="w-[110px] border-r border-[#E5E5E5] px-4">
                    Status
                  </th>

                  <th className="w-[130px] border-r border-[#E5E5E5] px-4">
                    Category
                  </th>

                  <th className="w-[130px] border-r border-[#E5E5E5] px-4">
                    Folder
                  </th>

                  <th className="w-[130px] border-r border-[#E5E5E5] px-4">
                    Campaign
                  </th>

                  <th className="w-[190px] border-r border-[#E5E5E5] px-4">
                    Country
                  </th>

                  <th className="w-[130px] border-r border-[#E5E5E5] px-4">
                    Language
                  </th>

                  <th className="w-[110px] border-r border-[#E5E5E5] px-4">
                    Invitation Date
                  </th>

                  <th className="w-[170px] px-4">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="h-40 text-center text-sm text-[#666666]">
                      {activeTab === "invited" ? "Loading invited influencers..." : "Loading influencers..."}
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={10} className="h-40 text-center text-sm text-red-600">
                      {error}
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="h-40 text-center text-sm text-[#666666]">
                      {activeTab === "invited" ? "No invited influencers found." : "No influencers found."}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, index) => {
                    const checked = selectedIds.includes(row.id);
                    const rowCampaignLocks = getCampaignLocksForRow(row);

                    return (
                      <tr
                        key={row.id}
                        className="h-[52px] border-b border-[#E9E9E9] last:border-b-0 hover:bg-[#FAFAFA]"
                      >
                        <td className="border-r border-[#E5E5E5] px-4">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleRow(row.id)}
                            className="h-4 w-4 rounded border-[#CFCFCF] accent-black"
                          />
                        </td>

                        <td className="border-r border-[#E5E5E5] px-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar index={index} name={row.profile} src={row.avatarUrl} />

                            <button
                              type="button"
                              onClick={() => openProfile(row)}
                              className="min-w-0 text-left disabled:cursor-default"
                            >
                              <span
                                className="block max-w-[115px] truncate text-[12px] font-medium text-[#222222]"
                                title={row.profile}
                              >
                                {row.profile}
                              </span>
                              <span
                                className="block max-w-[140px] truncate text-[10px] leading-3 text-[#A3A3A3]"
                                title={row.handle}
                              >
                                {row.handle}
                              </span>
                            </button>
                          </div>
                        </td>

                        <td className="border-r border-[#E5E5E5] px-4">
                          <StatusBadge status={getDisplayRowStatus(row, rowCampaignLocks)} />
                        </td>

                        <td className="border-r border-[#E5E5E5] px-4 text-[#222222]">
                          <span className="block max-w-[165px] truncate" title={row.category}>
                            {row.category}
                          </span>
                        </td>

                        <td className="border-r border-[#E5E5E5] px-4 text-[#222222]">
                          <span
                            className="block max-w-[115px] truncate"
                            title={row.folder}
                          >
                            {row.folder}
                          </span>
                        </td>

                        <td className="border-r border-[#E5E5E5] px-4 text-[#222222]">
                          <CampaignNamesCell
                            row={row}
                            locks={activeTab === "hub" ? rowCampaignLocks : []}
                            singleOnly={activeTab === "invited"}
                          />
                        </td>

                        <td className="border-r border-[#E5E5E5] px-4 text-[#222222]">
                          <CountryCell country={row.country} />
                        </td>

                        <td className="border-r border-[#E5E5E5] px-4 text-[#222222]">
                          <span className="block max-w-[115px] truncate capitalize" title={row.language}>
                            {row.language}
                          </span>
                        </td>

                        <td className="border-r border-[#E5E5E5] px-4 text-[#222222]">
                          <span
                            className="block max-w-[120px] truncate"
                            title={getInvitationDateRangeText(row, rowCampaignLocks, activeTab)}
                          >
                            {getInvitationDateRangeText(row, rowCampaignLocks, activeTab)}
                          </span>
                        </td>

                        <td className="px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex overflow-visible rounded-md bg-[#171717]">
                              <button
                                type="button"
                                disabled={sendingInvitationId === row.id}
                                onClick={() => handleSendInvitation(row)}
                                className="inline-flex h-7 min-w-[112px] items-center justify-center whitespace-nowrap rounded-l-md bg-[#171717] px-3 text-[11px] font-medium leading-none text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {sendingInvitationId === row.id ? "Sending..." : "Send Invitation"}
                              </button>

                              <Combobox
                                items={createCampaignOptions.map((campaign) => campaign.id)}
                                value=""
                                open={activeInviteCampaignPickerId === row.id}
                                onOpenChange={(open) => {
                                  setActiveInviteCampaignPickerId(open ? row.id : null);
                                  if (open) {
                                    void loadInvitationLocksForRow(row);
                                  }
                                }}
                                onValueChange={() => {
                                  // Selection is handled inside each campaign row so locked campaigns
                                  // can show a timer and expired campaigns can open Follow Up.
                                }}
                              >
                                <ComboboxTrigger
                                  hideIcon
                                  className="flex h-7 w-8 items-center justify-center rounded-r-md border-l border-white/20 bg-[#171717] text-white hover:bg-black"
                                  title={
                                    getRowCampaignId(row)
                                      ? `Campaign: ${getRowCampaignName(row)}`
                                      : "Choose campaign"
                                  }
                                >
                                  <CaretDownIcon size={12} weight="bold" />
                                </ComboboxTrigger>

                                <ComboboxContent
                                  align="end"
                                  className="z-[70] w-[230px] px-2 py-2"
                                  showSearch
                                  searchPlaceholder="Search campaign..."
                                >
                                  <ComboboxEmpty>No campaigns found.</ComboboxEmpty>
                                  <ComboboxList className="max-h-[220px] px-0">
                                    {(campaignId) => {
                                      const selectedCampaignId = String(campaignId || "");
                                      const lock = getCampaignLockForRow(row, selectedCampaignId);
                                      const remainingMs = getLockRemainingMs(lock, lockNow);
                                      const permanentlyLocked = isCampaignLockPermanent(lock);
                                      const locked = permanentlyLocked || remainingMs > 0;
                                      const canFollowUp = Boolean(lock && !locked);

                                      return (
                                        <ComboboxItem
                                          key={campaignId}
                                          value={campaignId}
                                          showIndicator={false}
                                          className={locked ? "cursor-not-allowed opacity-70" : ""}
                                          onClick={(event) => {
                                            if (locked) {
                                              event.preventDefault();
                                              event.stopPropagation();
                                              showToastMessage(
                                                "info",
                                                permanentlyLocked ? "Campaign permanently locked" : "Invitation already sent",
                                                permanentlyLocked
                                                  ? "A follow-up has already been sent for this campaign."
                                                  : `This campaign is locked for ${formatLockRemaining(remainingMs)}.`
                                              );
                                              return;
                                            }

                                            setActiveInviteCampaignPickerId(null);

                                            if (selectedCampaignId) {
                                              if (canFollowUp) {
                                                handleFollowUpInvitation(row, selectedCampaignId);
                                              } else {
                                                handleSendInvitation(row, selectedCampaignId);
                                              }
                                            }
                                          }}
                                        >
                                          <div className="flex w-full min-w-0 items-center justify-between gap-2">
                                            <span className="min-w-0 flex-1 truncate">
                                              {getCampaignOptionLabel(selectedCampaignId)}
                                            </span>

                                            {locked ? (
                                              <span className="shrink-0 rounded-full bg-[#FFF3D6] px-2 py-0.5 text-[10px] font-medium text-[#8A5A00]">
                                                {getCampaignLockLabel(lock, lockNow)}
                                              </span>
                                            ) : canFollowUp ? (
                                              <button
                                                type="button"
                                                onMouseDown={(event) => {
                                                  event.preventDefault();
                                                  event.stopPropagation();
                                                }}
                                                onClick={(event) => {
                                                  event.preventDefault();
                                                  event.stopPropagation();
                                                  setActiveInviteCampaignPickerId(null);
                                                  handleFollowUpInvitation(row, selectedCampaignId);
                                                }}
                                                className="shrink-0 rounded-full bg-[#171717] px-2 py-0.5 text-[10px] font-medium text-white hover:bg-black"
                                              >
                                                Follow up
                                              </button>
                                            ) : null}
                                          </div>
                                        </ComboboxItem>
                                      );
                                    }}
                                  </ComboboxList>
                                </ComboboxContent>
                              </Combobox>
                            </div>

                            <Combobox
                              open={activeActionComboboxId === row.id}
                              onOpenChange={(open) =>
                                setActiveActionComboboxId(open ? row.id : null)
                              }
                            >
                              <ComboboxTrigger
                                hideIcon
                                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#DDDDDD] bg-white text-[#333333] hover:bg-[#F7F7F7]"
                              >
                                <DotsThreeIcon size={18} weight="bold" />
                              </ComboboxTrigger>

                              <ComboboxContent
                                align="end"
                                className="w-[180px] px-1 py-1"
                              >
                                <ComboboxList className="px-0">
                                  <ComboboxItem
                                    value="view-profile"
                                    showIndicator={false}
                                    onClick={() => {
                                      openProfile(row);
                                      setActiveActionComboboxId(null);
                                    }}
                                  >
                                    <EyeIcon size={14} />
                                    View profile
                                  </ComboboxItem>

                                  <ComboboxItem value="move-folder" showIndicator={false}>
                                    <FolderSimpleIcon size={14} />
                                    Move to folder
                                  </ComboboxItem>

                                  {/* <ComboboxItem value="view-rate-card" showIndicator={false}>
                                    <FileTextIcon size={14} />
                                    View rate card
                                  </ComboboxItem> */}

                                  {/* <ComboboxItem
                                    value="copy-profile-link"
                                    showIndicator={false}
                                    onClick={async () => {
                                      try {
                                        if (row.profileUrl && navigator.clipboard) {
                                          await navigator.clipboard.writeText(row.profileUrl);
                                        }
                                      } catch (_error) { }
                                      setActiveActionComboboxId(null);
                                    }}
                                  >
                                    <CopyIcon size={14} />
                                    Copy profile link
                                  </ComboboxItem> */}

                                  <ComboboxItem
                                    value="delete"
                                    showIndicator={false}
                                    className="text-[#EF4C3C] data-[highlighted]:bg-[#FFF5F3] data-[highlighted]:text-[#EF4C3C]"
                                  >
                                    <TrashIcon size={14} />
                                    Delete
                                  </ComboboxItem>
                                </ComboboxList>
                              </ComboboxContent>
                            </Combobox>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Dialog
        open={createFolderOpen}
        modal={false}
        onOpenChange={(open) => {
          setCreateFolderOpen(open);
          if (!open) {
            resetCreateFolderForm();
          }
        }}
      >
        <DialogContent
          className="w-full max-w-[520px] rounded-xl bg-white p-6"
          showCloseButton
          onInteractOutside={(event) => {
            const target = event.target as HTMLElement | null;

            if (target?.closest('[data-slot="combobox-content"]')) {
              event.preventDefault();
            }
          }}
        >
          <DialogHeader className="gap-1 text-left">
            <DialogTitle className="text-[18px] font-semibold text-[#111111]">
              Create New folder
            </DialogTitle>
            <DialogDescription className="max-w-[360px] text-[11px] leading-5 text-[#A1A1A1]">
              Provide folder details so we can organize creators and tailor recommendations accordingly.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_150px]">
            <div>
              <label className="mb-1 block text-[11px] text-[#7E7E7E]">
                Folder Name <span className="text-[#EF4C3C]">*</span>
              </label>
              <input
                value={createFolderName}
                onChange={(event) => {
                  setCreateFolderName(event.target.value);
                  setCreateFolderError("");
                }}
                placeholder="Folder Name"
                disabled={createFolderSubmitting}
                className="h-11 w-full rounded-lg border border-[#E2E2E2] bg-white px-3 text-sm outline-none placeholder:text-[#B1B1B1] focus:border-black disabled:cursor-not-allowed disabled:bg-[#F7F7F7]"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-[#7E7E7E]">
                Creator Tier
              </label>
              <Combobox
                items={CREATOR_TIER_OPTIONS}
                value={createFolderTier}
                onValueChange={(value) => {
                  setCreateFolderTier(String(value || ""));
                  setCreatorTierComboboxOpen(false);
                }}
                open={creatorTierComboboxOpen}
                onOpenChange={(open) => {
                  if (createFolderSubmitting) return;
                  setCreatorTierComboboxOpen(open);
                  if (open) setLinkCampaignComboboxOpen(false);
                }}
              >
                <ComboboxTrigger className="inline-flex h-11 w-full items-center justify-between rounded-lg border border-[#E2E2E2] bg-white px-3 text-sm text-[#111111]">
                  <span>{createFolderTier || "Creator Tier"}</span>
                </ComboboxTrigger>
                <ComboboxContent className="z-[60] w-[150px] px-1 py-1">
                  <ComboboxList className="px-0">
                    {(tier) => (
                      <ComboboxItem
                        key={tier}
                        value={tier}
                        showIndicator={false}
                        onClick={() => {
                          setCreateFolderTier(String(tier || ""));
                          setCreatorTierComboboxOpen(false);
                        }}
                      >
                        {tier}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          </div>

          <div className="mt-3">
            <label className="mb-1 block text-[11px] text-[#7E7E7E]">
              Link Campaign
            </label>

            <Combobox
              items={campaignComboboxItems}
              value={createFolderCampaign}
              onValueChange={(value) => {
                const nextValue = String(value || "");
                setCreateFolderCampaign(
                  nextValue === NO_CAMPAIGN_VALUE ? "" : nextValue
                );
                setLinkCampaignComboboxOpen(false);
              }}
              open={linkCampaignComboboxOpen}
              onOpenChange={(open) => {
                if (createFolderSubmitting) return;
                setLinkCampaignComboboxOpen(open);
                if (open) setCreatorTierComboboxOpen(false);
              }}
            >
              <ComboboxTrigger className="inline-flex h-11 w-full items-center justify-between rounded-lg border border-[#E2E2E2] bg-white px-3 text-sm text-[#111111]">
                <span className="truncate">
                  {createCampaignOptions.find(
                    (campaign) => campaign.id === createFolderCampaign
                  )?.label || "Link Campaign"}
                </span>
              </ComboboxTrigger>

              <ComboboxContent
                className="z-[60] w-[var(--anchor-width)] px-1 py-1"
                showSearch
                searchPlaceholder="Search campaign..."
              >
                <ComboboxEmpty>No non fully managed campaigns found.</ComboboxEmpty>
                <ComboboxList className="px-0">
                  {(campaignId) => (
                    <ComboboxItem
                      key={campaignId}
                      value={campaignId}
                      showIndicator={false}
                      onClick={() => {
                        const nextValue = String(campaignId || "");
                        setCreateFolderCampaign(
                          nextValue === NO_CAMPAIGN_VALUE ? "" : nextValue
                        );
                        setLinkCampaignComboboxOpen(false);
                      }}
                    >
                      <span className="truncate">
                        {getCampaignOptionLabel(String(campaignId))}
                      </span>
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          {createFolderError ? (
            <p className="mt-3 rounded-md bg-[#FFF5F3] px-3 py-2 text-xs font-medium text-[#D93025]">
              {createFolderError}
            </p>
          ) : null}

          <DialogFooter className="mt-3">
            <button
              type="button"
              onClick={() => setCreateFolderOpen(false)}
              disabled={createFolderSubmitting}
              className="inline-flex h-10 items-center rounded-md px-4 text-sm font-medium text-[#333333] hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleCreateFolder}
              disabled={createFolderSubmitting}
              className="inline-flex h-10 items-center rounded-md bg-[#171717] px-4 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createFolderSubmitting ? "Creating..." : "Create Folder"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DetailPanel
        open={profilePanelOpen}
        onClose={() => setProfilePanelOpen(false)}
        loading={profilePanelLoading}
        error={profilePanelError}
        data={profilePanelRaw ? ({ profile: profilePanelRaw } as any) : null}
        raw={profilePanelRaw || {}}
        platform={profilePanelRow ? (getRowPlatform(profilePanelRow) as any) : null}
        emailExists={Boolean(profilePanelRow?.raw?.email)}
        onChangeCalc={handlePanelCalcChange}
        brandId={getStoredBrandId()}
        campaignId={profilePanelRow ? getRowCampaignId(profilePanelRow) || null : null}
        handle={profilePanelHandle}
        lastFetchedAt={
          profilePanelLastFetchedAt ||
          String(
            profilePanelRaw?.updatedAt ||
            profilePanelRaw?.createdAt ||
            profilePanelRow?.raw?.modash?.updatedAt ||
            profilePanelRow?.raw?.modashProfile?.updatedAt ||
            ""
          ) ||
          null
        }
        onRefreshReport={() => {
          if (!profilePanelRow) return;
          return fetchProfileReport(profilePanelRow, profilePanelCalc);
        }}
      />
      <EmailEditor
        open={emailEditorOpen}
        onClose={() => {
          if (sendingInvitationId) return;
          setEmailEditorOpen(false);
          setPendingInvitation(null);
        }}
        fromName={getBrandDisplayName()}
        toName={pendingInvitation?.row.profile || ""}
        toEmail={getRowEmail(pendingInvitation?.row || null)}
        toLabel={
          getRowEmail(pendingInvitation?.row || null) ||
          pendingInvitation?.handle ||
          ""
        }
        toAvatar={pendingInvitation?.row.avatarUrl || null}
        subject={getEmailEditorSubject(pendingInvitation)}
        initialHtmlBody={getEmailEditorHtmlBody(pendingInvitation)}
        startExpanded={false}
        sending={Boolean(
          pendingInvitation && sendingInvitationId === pendingInvitation.row.id
        )}
        onSend={handleEmailEditorSend}
      />

      {selectedIds.length > 0 ? (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#E7E7E7] bg-white px-8 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-black">
              {selectedIds.length} Items Selected
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-[#FFF0EE] px-4 text-[12px] font-medium text-[#EF4C3C] hover:bg-[#FFE4E0]"
              >
                <TrashIcon size={15} weight="regular" />
                Remove all
              </button>

              <div className="flex overflow-hidden rounded-md">
                <button
                  type="button"
                  className="inline-flex h-9 items-center gap-2 bg-[#171717] px-4 text-[12px] font-medium text-white hover:bg-black"
                >
                  <PaperPlaneTiltIcon size={15} weight="fill" />
                  Invite all
                </button>

                <button
                  type="button"
                  className="flex h-9 items-center justify-center border-l border-white/20 bg-[#171717] px-3 text-white hover:bg-black"
                >
                  <CaretDownIcon size={12} weight="bold" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
