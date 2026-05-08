"use client";

import * as React from "react";
import {
  BriefcaseIcon,
  CaretDownIcon,
  CaretRightIcon,
  CopyIcon,
  DotsThreeIcon,
  EyeIcon,
  FileTextIcon,
  FolderSimpleIcon,
  FunnelSimpleIcon,
  MagnifyingGlassIcon,
  PaperPlaneTiltIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
  XIcon,
} from "@phosphor-icons/react";
import api from "@/lib/api";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxSeparator,
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
import { MoreFiltersDropdown } from "../browse-influencer/MoreFiltersDropdown";

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
  _id?: string;
  provider?: string;
  name?: string;
  handle?: string;
  followers?: number | string;
  primaryLink?: string;
  links?: string[];
  niche?: string[] | string;
  email?: string;
  country?: string;
  location?: string;
  language?: string;
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

type GoodFitApiResponse = {
  success?: boolean;
  message?: string;
  data?: {
    campaign?: RelatedCampaign;
    totalFolderCount?: number;
    totalCampaignCount?: number;
    totalGoodFitCount?: number;
    campaigns?: RelatedCampaign[];
    items?: GoodFitInfluencer[];
  };
};

type CampaignListResponse = {
  success?: boolean;
  data?: any;
  campaigns?: any[];
  items?: any[];
};

type InvitationStatus = "invited" | "available" | string;

type Invitation = {
  invitationId: string;
  brandId: string;
  handle: string;
  platform: string;
  status: InvitationStatus;
  campaignId?: string | null;
  campaignName?: string | null;
  missingEmailId?: string | null;
  createdAt: string;
  updatedAt: string;
};

type InvitationListResponse = {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  data: Invitation[];
};

type NonFullManagedCampaignListResponse = {
  success?: boolean;
  message?: string;
  data?: any;
  campaigns?: any[];
  items?: any[];
};

type CreateInvitationResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  status?: "saved" | "exists" | "error" | string;
  data?: any;
};

type CreateMissingResp = {
  success?: boolean;
  message?: string;
  error?: string;
  data?: any;
};

type CreateFolderResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  data?: {
    _id?: string;
    title?: string;
    name?: string;
    linkedCampaign?: RelatedCampaign;
    [key: string]: any;
  };
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

type BrandFolderListResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  data?: {
    totalCount?: number;
    folderCount?: number;
    bookmarkCount?: number;
    goodFitCount?: number;
    folders?: BrandFolder[];
    groups?: {
      folders?: BrandFolder[];
      bookmarks?: BrandFolder[];
      goodFit?: BrandFolder[];
    };
  };
};

const BRAND_FOLDER_LIST_ENDPOINT = "/brand/folder/list";
const BRAND_FOLDER_CREATE_ENDPOINT = "/brand/folder/create";
const NEW_INVITATIONS_LIST_ENDPOINT = "/newinvitations/list";
const NEW_INVITATIONS_CREATE_ENDPOINT = "/newinvitations/create";
const MISSING_EMAIL_CREATE_ENDPOINT = "/missing/create";
const NON_FULL_MANAGED_CAMPAIGNS_ENDPOINT = "/campaign/getNonFullManagedCampaigns";
const SHAREMITRA_API_BASE =
  process.env.NEXT_PUBLIC_SHAREMITRA_API_BASE_URL || "https://api.sharemitra.com";

type InfluencerStatus = "Sent" | "Pending" | "Rejected" | "Good Fit" | "Media Kit";

type InfluencerRow = {
  id: string;
  profile: string;
  username: string;
  handle: string;
  status: InfluencerStatus;
  category: string;
  folder: string;
  campaignName: string;
  workspace: string;
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
  Rejected: "bg-[#F7F7F7] text-[#777777] before:bg-[#EF4C3C]",
  "Good Fit": "bg-[#F7F7F7] text-[#777777] before:bg-[#21B15A]",
  "Media Kit": "bg-[#F7F7F7] text-[#777777] before:bg-[#3D7CFF]",
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

function buildGoodFitApiParams(
  filters: MoreFiltersState,
  searchText: string
) {
  const params: Record<string, string | number | boolean> = {};
  const q = searchText.trim();

  if (q) params.q = q;

  const searchMode = String(filters.search?.mode || "").trim();
  if (searchMode) params.searchMode = searchMode;

  const tier = String(filters.influencer?.tier || "").trim();
  if (tier) params.tier = tier;

  if (typeof filters.influencer?.isVerified === "boolean") {
    params.isVerified = filters.influencer.isVerified;
  }

  const gender = String(filters.influencer?.gender || "")
    .trim()
    .toLowerCase();

  if (gender && gender !== "all") {
    params.gender =
      gender === "male" || gender === "female"
        ? gender
        : gender.replace(/^@+/, "");
  }

  if (typeof filters.influencer?.ageMin === "number") {
    params.ageMin = filters.influencer.ageMin;
  }

  if (typeof filters.influencer?.ageMax === "number") {
    params.ageMax = filters.influencer.ageMax;
  }

  const country = String(filters.audience?.country || "").trim();
  if (country) params.country = country;

  const platformRanges = Object.values(filters.platform || {}).filter(
    (range) =>
      typeof range?.followersMin === "number" ||
      typeof range?.followersMax === "number"
  );

  if (platformRanges.length) {
    const firstRange = platformRanges[0];

    if (
      typeof firstRange.followersMin === "number" &&
      params.followersMin === undefined
    ) {
      params.followersMin = firstRange.followersMin;
    }

    if (
      typeof firstRange.followersMax === "number" &&
      params.followersMax === undefined
    ) {
      params.followersMax = firstRange.followersMax;
    }
  }

  return params;
}


type CreatorHubTab = "hub" | "invited";

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

  return String(window.localStorage.getItem("brandId") || "").trim();
}


function getStoredAuthToken() {
  if (typeof window === "undefined") return "";

  const token =
    window.localStorage.getItem("brand_token") ||
    window.localStorage.getItem("brandToken") ||
    window.localStorage.getItem("token") ||
    window.localStorage.getItem("authToken") ||
    "";

  return String(token || "").trim();
}

function getAuthHeaders() {
  const token = getStoredAuthToken();

  if (!token) return {};

  return {
    Authorization: token.toLowerCase().startsWith("bearer ")
      ? token
      : `Bearer ${token}`,
  };
}

async function post<T>(url: string, payload: unknown): Promise<T> {
  const response = await api.post<T>(url, payload);

  return response.data;
}

async function post2<T>(url: string, payload: unknown): Promise<T> {
  const fullUrl = `${SHAREMITRA_API_BASE}${url.startsWith("/") ? url : `/${url}`}`;

  const response = await fetch(fullUrl, {
    method: "POST",
    // headers: {
    //   "Content-Type": "application/json",
    //   ...getAuthHeaders(),
    // },
    body: JSON.stringify(payload),
  });

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(
      data?.message || data?.error || `Request failed with ${response.status}`
    ) as Error & { response?: { data?: any; status?: number } };

    error.response = {
      data,
      status: response.status,
    };

    throw error;
  }

  return data as T;
}


function displayText(value?: string | number | null) {
  const text = String(value ?? "").trim();
  return text || "—";
}

function getDisplayLanguage(value?: string | number | null) {
  const text = String(value ?? "").trim();
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
};

function normalizeLanguageText(value?: string | number | null) {
  const text = String(value ?? "").trim();

  if (!text) return "";

  const clean = text.toLowerCase();

  return LANGUAGE_CODE_LABELS[clean] || text;
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

  const text =
    readFirstTextFromPaths(source, [
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
      "audience.language",
      "audience.languages",
      "audience.topLanguages",
      "audienceExtra.language",
      "audienceExtra.languages",
    ]) ||
    readFirstTextFromPaths(raw, [
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
    ]) ||
    readFirstTextFromPaths(modash, [
      "language",
      "languages",
      "languageName",
      "languageCode",
      "audience.language",
      "audience.languages",
      "audience.topLanguages",
      "audienceExtra.language",
      "audienceExtra.languages",
      "audienceCommenters.language",
      "audienceCommenters.languages",
    ]) ||
    findTextByKey(modash, (key) => key.toLowerCase().includes("language"));

  return normalizeLanguageText(text);
}

function getModashCountryText(item?: GoodFitInfluencer | BrandFolderItem | null) {
  const source: any = item || {};
  const raw = source.raw && typeof source.raw === "object" ? source.raw : {};
  const modash: any = getItemModash(source as GoodFitInfluencer) || {};

  return (
    readFirstTextFromPaths(source, [
      "country",
      "location",
      "countryName",
      "countryCode",
      "filterData.country",
      "filterData.location",
      "modash.country",
      "modash.location",
      "modashProfile.country",
      "modashProfile.location",
      "audience.country",
      "audience.countries",
      "audience.topCountries",
    ]) ||
    readFirstTextFromPaths(raw, [
      "country",
      "location",
      "countryName",
      "countryCode",
      "filterData.country",
      "filterData.location",
      "modash.country",
      "modash.location",
      "modashProfile.country",
      "modashProfile.location",
      "profile.country",
      "profile.location",
      "creator.country",
      "creator.location",
      "audience.country",
      "audience.countries",
      "audience.topCountries",
    ]) ||
    readFirstTextFromPaths(modash, [
      "country",
      "location",
      "city",
      "countryName",
      "countryCode",
      "audience.country",
      "audience.countries",
      "audience.topCountries",
      "audienceExtra.country",
      "audienceExtra.countries",
    ]) ||
    findTextByKey(modash, (key) => {
      const lowerKey = key.toLowerCase();
      return lowerKey.includes("country") || lowerKey === "location";
    })
  );
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

function displayCategory(value?: string[] | string) {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  return displayText(value);
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

function getStatus(item: GoodFitInfluencer): InfluencerStatus {
  if (item.mediaKitAccess?.hasAdded || item.mediaKitAccess?.allowed) {
    return "Sent";
  }

  if (item.goodFit) return "Sent";

  return "Pending";
}

function getInvitationStatus(status?: InvitationStatus): InfluencerStatus {
  const normalized = String(status || "").trim().toLowerCase();

  if (normalized === "available" || normalized === "sent") return "Sent";
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

  return (
    displayText(campaign.campaignTitle) ||
    displayText(campaign.productOrServiceName) ||
    displayText(campaign.campaignsId) ||
    displayText(getIdString(campaign.campaignId)) ||
    "—"
  );
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

function getWorkspace(item: GoodFitInfluencer, campaigns: RelatedCampaign[]) {
  return (
    campaigns.find((campaign) => campaign.brandName)?.brandName ||
    item.folder?.assignedCampaign?.brandName ||
    "B Creators"
  );
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
  const categoryFromPitch = displayCategory(item.niche);
  const category =
    categoryFromPitch !== "—"
      ? categoryFromPitch
      : modashCategories.length
        ? modashCategories.join(", ")
        : "—";

  return {
    id: String(item._id || `${item.handle || item.name || "good-fit"}-${index}`),
    profile: name === "—" ? "Label" : name,
    username: cleanUsername,
    handle,
    status: getStatus(item),
    category,
    folder: getFoldersText(relatedFolders, firstFolder?.title),
    campaignName: getCampaignName(firstCampaign || item.folder?.assignedCampaign),
    workspace: getWorkspace(item, relatedCampaigns),
    country: displayText(getModashCountryText(item)),
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
  const campaignName = displayText(invitation.campaignName) || "—";

  return {
    id: String(invitation.invitationId || `${invitation.handle || "invited"}-${index}`),
    profile: cleanUsername === "username" ? "Label" : cleanUsername,
    username: cleanUsername,
    handle,
    status: getInvitationStatus(invitation.status),
    category: "—",
    folder: campaignName,
    campaignName,
    workspace: "—",
    country: displayText(
      (invitation as any).country ||
        (invitation as any).location ||
        (invitation as any).modash?.country
    ),
    language: getDisplayLanguage(getModashLanguageText(invitation as any)),
    invitationDate: formatDate(invitation.createdAt),
    profileUrl: getInvitationProfileUrl(invitation),
    relatedCampaigns: invitation.campaignId
      ? [
          {
            campaignId: invitation.campaignId,
            campaignTitle: invitation.campaignName || undefined,
            assignedAt: invitation.createdAt,
          },
        ]
      : [],
    relatedFolders: [],
    raw: {
      _id: invitation.invitationId,
      provider: invitation.platform,
      name: cleanUsername,
      handle,
      primaryLink: getInvitationProfileUrl(invitation),
      country: "",
      goodFit: false,
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
  const categories = Array.isArray(item.categories) && item.categories.length
    ? item.categories
    : Array.isArray(item.niche)
      ? item.niche
      : Array.isArray(raw?.categories)
        ? raw.categories
        : Array.isArray(raw?.niche)
          ? raw.niche
          : [];

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

  return {
    _id: String(item._id || item.id || item.profileKey || `${folderId}-${index}`),
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
    row.workspace,
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

  // Backend currently sends campaignTitle as a URL in some records.
  // Prefer real display-name fields first.
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

  // Use campaignTitle only after safer fields, and only if it is not a URL/id.
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
    "workspaceCampaign",
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
  return String(
    campaign?.campaignTitle ||
      campaign?.campaign_title ||
      campaign?.campaign?.campaignTitle ||
      campaign?.campaignData?.campaignTitle ||
      campaign?.campaignDetails?.campaignTitle ||
      campaign?.details?.campaignTitle ||
      ""
  ).trim();
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
    if (!option || option.isFullyManaged || map.has(option.id)) return;
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
      ""
  ).trim();
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

function getInvitationCreateStatus(payload: any): "saved" | "exists" | "error" {
  const status = String(
    payload?.status ||
      payload?.data?.status ||
      payload?.data?.data?.status ||
      ""
  )
    .trim()
    .toLowerCase();

  if (status === "saved" || status === "exists") return status;

  if (payload?.success === true || payload?.data?.success === true) {
    return "saved";
  }

  return "error";
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


function Avatar({ index, name }: { index: number; name: string }) {
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
      className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md ${
        colors[index % colors.length]
      }`}
    >
      {initials ? (
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
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium before:h-1.5 before:w-1.5 before:rounded-full ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

function FilterSelect({
  label,
  value,
  children,
  onChange,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="inline-flex h-8 items-center gap-2 text-xs text-[#111111]">
      <span>{label}</span>

      <span className="relative inline-flex items-center rounded-md bg-[#EFEFEF]">
        <select
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          className="h-7 min-w-[58px] max-w-[170px] cursor-pointer appearance-none rounded-md bg-transparent py-1 pl-2 pr-6 text-xs font-medium text-[#111111] outline-none"
        >
          {children}
        </select>

        <CaretDownIcon
          size={10}
          weight="bold"
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#222]"
        />
      </span>
    </label>
  );
}

function CountryCell({ country }: { country: string }) {
  const flagMap: Record<string, string> = {
    Kuwait: "🇰🇼",
    "Russian Federation": "🇷🇺",
    Russia: "🇷🇺",
    "United Kingdom": "🇬🇧",
    "United States": "🇺🇸",
    Ireland: "🇮🇪",
  };

  return (
    <div className="flex max-w-[170px] items-center gap-2 truncate">
      <span className="text-base">{flagMap[country] || "🌐"}</span>
      <span className="truncate">{country}</span>
    </div>
  );
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
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
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
  const [folderComboboxOpen, setFolderComboboxOpen] = React.useState(false);
  const [folderMenuSearch, setFolderMenuSearch] = React.useState("");
  const [createFolderOpen, setCreateFolderOpen] = React.useState(false);
  const [createFolderName, setCreateFolderName] = React.useState("");
  const [createFolderTier, setCreateFolderTier] = React.useState("");
  const [createFolderCampaign, setCreateFolderCampaign] = React.useState("");
  const [createFolderSubmitting, setCreateFolderSubmitting] = React.useState(false);
  const [createFolderError, setCreateFolderError] = React.useState("");
  const [refreshFolderListKey, setRefreshFolderListKey] = React.useState(0);
  const [creatorTierComboboxOpen, setCreatorTierComboboxOpen] = React.useState(false);
  const [linkCampaignComboboxOpen, setLinkCampaignComboboxOpen] = React.useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = React.useState(false);
  const filterAnchorRef = React.useRef<HTMLDivElement | null>(null);
  const [activeActionComboboxId, setActiveActionComboboxId] = React.useState<string | null>(null);
  const [activeInviteCampaignPickerId, setActiveInviteCampaignPickerId] = React.useState<string | null>(null);
  const [sendingInvitationId, setSendingInvitationId] = React.useState<string | null>(null);

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

  const applyMoreFilters = React.useCallback(() => {
    setFilterDropdownOpen(false);
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

      const response = await api.post<CreateFolderResponse>(
        BRAND_FOLDER_CREATE_ENDPOINT,
        payload
      );

      const createdFolderId = String(
        response?.data?.data?._id ||
          response?.data?.data?.id ||
          ""
      );

      resetCreateFolderForm();
      setCreateFolderOpen(false);
      setRefreshFolderListKey((prev) => prev + 1);

      if (createdFolderId) {
        setSelectedCampaignId(createdFolderId);
      }
    } catch (err: any) {
      setCreateFolderError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Failed to create folder."
      );
    } finally {
      setCreateFolderSubmitting(false);
    }
  }, [
    createFolderCampaign,
    createFolderName,
    createFolderTier,
    resetCreateFolderForm,
  ]);

  const handleSendInvitation = React.useCallback(
    async (row: InfluencerRow, campaignIdOverride?: string) => {
      const handle = getInvitationHandle(row);

      if (!handle) {
        setError("Invalid or missing handle to send invitation.");
        return;
      }

      const brandId = getStoredBrandId();

      if (!brandId) {
        setError("Missing brandId in localStorage.");
        return;
      }

      const platform = getRowPlatform(row);

      if (!isSupportedInvitationPlatform(platform)) {
        setError("Unsupported or missing platform.");
        return;
      }

      if (!/^[A-Za-z0-9._-]+$/.test(handle.replace(/^@/, ""))) {
        setError("Invalid or missing handle to send invitation.");
        return;
      }

      const campaignId = String(
        campaignIdOverride || getRowCampaignId(row) || ""
      ).trim();

      if (!campaignId) {
        setActiveInviteCampaignPickerId(row.id);
        return;
      }

      const selectedCampaignTitle =
        getCampaignLabelById(createCampaignOptions, campaignId) ||
        getCampaignLabelById(campaignOptions, campaignId) ||
        getRowCampaignName(row);

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
        } = {
          handle,
          platform,
          brandId,
          status: "invited",
        };

        if (campaignId) {
          invitationPayload.campaignId = campaignId;
        }

        if (selectedCampaignTitle) {
          invitationPayload.campaignTitle = selectedCampaignTitle;
        }

        const [missingResult, invitationResult] = await Promise.allSettled([
          post2<CreateMissingResp>(MISSING_EMAIL_CREATE_ENDPOINT, {
            handle,
            platform,
            brandId,
          }),
          post<CreateInvitationResponse>(
            NEW_INVITATIONS_CREATE_ENDPOINT,
            invitationPayload
          ),
        ]);

        if (missingResult.status === "fulfilled") {
          console.log("Missing/create result", missingResult.value);
        } else {
          console.error("Missing/create failed", missingResult.reason);
        }

        let invitationStatus: CreateInvitationResponse["status"] | "error" =
          "error";
        let invitationCreatedAt = "";

        if (invitationResult.status === "fulfilled") {
          const resp = invitationResult.value;

          if (resp?.status === "saved" || resp?.status === "exists") {
            invitationStatus = resp.status;
          } else if (resp?.success === true) {
            invitationStatus = "saved";
          } else {
            invitationStatus = "error";
          }

          invitationCreatedAt = getInvitationCreatedAtFromResponse(resp);
        } else if (isDuplicateInvitationError(invitationResult.reason)) {
          console.error("Invitation/create duplicate", invitationResult.reason);
          invitationStatus = "exists";
        } else {
          console.error("Invitation/create failed", invitationResult.reason);
          invitationStatus = "error";
        }

        if (invitationStatus === "error") {
          setError(
            "We couldn’t send the invitation. Please try again in a moment."
          );
          return;
        }

        const sentAt = invitationCreatedAt || new Date().toISOString();

        setHubRows((prev) =>
          prev.map((item) => {
            if (item.id !== row.id) return item;

            const campaignPayload: RelatedCampaign = {
              campaignId,
              campaignTitle: selectedCampaignTitle || undefined,
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
              campaignName: selectedCampaignTitle || item.campaignName,
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
                            selectedCampaignTitle ||
                            undefined,
                          assignedAt: campaign.assignedAt || sentAt,
                        }
                      : campaign;
                  })
                : [...item.relatedCampaigns, campaignPayload],
            };
          })
        );

        setActiveInviteCampaignPickerId(null);
      } catch (err: any) {
        setError(
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            "Failed to send invitation."
        );
      } finally {
        setSendingInvitationId(null);
      }
    },
    [campaignOptions, createCampaignOptions]
  );

  const filteredCampaignOptions = React.useMemo(() => {
    const q = folderMenuSearch.trim().toLowerCase();
    if (!q) return campaignOptions;
    return campaignOptions.filter((campaign) =>
      campaign.label.toLowerCase().includes(q)
    );
  }, [campaignOptions, folderMenuSearch]);

  const selectedCampaignLabel = React.useMemo(() => {
    if (selectedCampaignId === "all") return "All";
    return (
      campaignOptions.find((campaign) => campaign.id === selectedCampaignId)?.label ||
      "All"
    );
  }, [campaignOptions, selectedCampaignId]);

  const folderComboboxItems = React.useMemo(
    () => ["all", ...filteredCampaignOptions.map((campaign) => campaign.id)],
    [filteredCampaignOptions]
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

  React.useEffect(() => {
    let mounted = true;

    async function loadBrandFolders() {
      try {
        setLoading(true);
        setError("");

        const cacheBust = `${Date.now()}-${refreshFolderListKey}`;

        const [folderResponse, nonFullManagedCampaignResponse] = await Promise.all([
          api.get<BrandFolderListResponse>(BRAND_FOLDER_LIST_ENDPOINT, {
            params: {
              type: "all",
              includeItems: true,
              _t: cacheBust,
            },
          }),
          api
            .get<NonFullManagedCampaignListResponse>(
              NON_FULL_MANAGED_CAMPAIGNS_ENDPOINT,
              {
                params: {
                  page: 1,
                  limit: 500,
                  _t: cacheBust,
                },
              }
            )
            .catch(() => null),
        ]);

        const folders = extractBrandFolderList(folderResponse.data);
        const options = buildCampaignOptionsFromGoodFitFolders(folders);
        const createOptions = buildCreateCampaignOptions(
          extractNonFullManagedCampaignList(nonFullManagedCampaignResponse?.data)
        );

        if (!mounted) return;

        setBrandFolders(folders);
        setCampaignOptions(options);
        setCreateCampaignOptions(createOptions);
        setSelectedCampaignId((current) => {
          if (current === "all") return "all";
          return options.some((option) => option.id === current) ? current : "all";
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
  }, [refreshFolderListKey]);

  React.useEffect(() => {
    const selectedFolders =
      selectedCampaignId === "all"
        ? brandFolders
        : brandFolders.filter((folder) => getBrandFolderId(folder) === selectedCampaignId);

    const items = mergeGoodFitItems(brandFoldersToGoodFitItems(selectedFolders));

    const rows = items
      .map(mapGoodFitItem)
      .filter((row) => rowMatchesSearch(row, debouncedSearch))
      .filter((row) => rowMatchesMoreFilters(row, moreFilters));

    setHubRows(rows);
    setSelectedIds([]);
  }, [selectedCampaignId, brandFolders, debouncedSearch, moreFilters]);

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

        const response = await api.post<InvitationListResponse>(
          NEW_INVITATIONS_LIST_ENDPOINT,
          {
            brandId,
            page: 1,
            limit: 100,
            status: "all",
          }
        );

        const items = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        if (!mounted) return;

        setInvitedRows(items.map(mapInvitationToRow));
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
  }, [activeTab]);

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

  const openProfile = (url: string) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <div className="border-b border-[#E9E9E9] px-8">
        <div className="flex h-[58px] items-end gap-8">
          <button
            type="button"
            onClick={() => handleTabChange("hub")}
            className={`relative h-full pt-5 text-[12px] font-medium ${
              activeTab === "hub" ? "text-black" : "text-[#A0A0A0]"
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
            className={`relative h-full pt-5 text-[12px] font-medium ${
              activeTab === "invited" ? "text-black" : "text-[#A0A0A0]"
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
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-5">
            <label className="inline-flex h-8 items-center gap-2 text-xs text-[#111111]">
              <span>Folder</span>

              <Combobox
                items={folderComboboxItems}
                value={selectedCampaignId}
                onValueChange={(value) => {
                  setSelectedCampaignId(String(value || "all"));
                  setFolderComboboxOpen(false);
                }}
                open={folderComboboxOpen}
                onOpenChange={setFolderComboboxOpen}
              >
                <ComboboxTrigger
                  className="inline-flex h-7 min-w-[120px] items-center justify-between gap-3 rounded-md bg-[#EFEFEF] px-3 text-xs font-medium text-[#111111]"
                >
                  <span className="max-w-[140px] truncate">{selectedCampaignLabel}</span>
                </ComboboxTrigger>

                <ComboboxContent
                  className="w-[190px] px-2 py-2"
                  showSearch
                  searchPlaceholder="Search..."
                  searchInputProps={{
                    value: folderMenuSearch,
                    onChange: (event) =>
                      setFolderMenuSearch(
                        (event.target as HTMLInputElement).value
                      ),
                  }}
                >
                  <ComboboxEmpty>No folders found.</ComboboxEmpty>

                  <ComboboxList className="max-h-[210px] px-0">
                    {(item) => (
                      <ComboboxItem
                        key={item}
                        value={item}
                        showIndicator={false}
                        className={
                          selectedCampaignId === item ? "bg-[#d9d9d9]" : ""
                        }
                      >
                        <span className="truncate">
                          {getCampaignOptionLabel(String(item))}
                        </span>
                      </ComboboxItem>
                    )}
                  </ComboboxList>

                  <ComboboxSeparator />

                  <button
                    type="button"
                    onClick={() => {
                      setFolderComboboxOpen(false);
                      setCreateFolderError("");
                      setCreateFolderOpen(true);
                    }}
                    className="flex h-8 w-full items-center rounded-lg bg-[#EFEFEF] px-2 text-left text-sm font-medium text-[#111111] hover:bg-[#E4E4E4]"
                  >
                    + Add folder
                  </button>
                </ComboboxContent>
              </Combobox>
            </label>

            <FilterSelect label="Category" value="all">
              <option value="all">All</option>
            </FilterSelect>

            <FilterSelect label="Date" value="all">
              <option value="all">All</option>
            </FilterSelect>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setDebouncedSearch("");
                setSelectedCampaignId("all");
                setFolderMenuSearch("");
                resetMoreFilters();
              }}
              className="inline-flex h-8 items-center gap-1 rounded-md bg-[#EDEDED] px-3 text-xs font-medium text-[#333333] hover:bg-[#E3E3E3]"
            >
              Clear
              <XIcon size={12} weight="bold" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
                className="h-9 w-[230px] rounded-md border border-[#DCDCDC] bg-white px-3 pr-9 text-sm outline-none placeholder:text-[#777777] focus:border-black"
              />

              <MagnifyingGlassIcon
                size={16}
                weight="regular"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C5C5C]"
              />
            </div>

            <div ref={filterAnchorRef} className="relative">
              <button
                type="button"
                onClick={() => setFilterDropdownOpen((prev) => !prev)}
                className="inline-flex h-9 min-w-[110px] items-center justify-between rounded-md border border-[#DCDCDC] bg-white px-3 text-sm text-[#111111] hover:bg-[#F7F7F7]"
              >
                <span className="inline-flex items-center gap-2">
                  <FunnelSimpleIcon size={16} weight="regular" />
                  Filters
                </span>
                <CaretDownIcon size={12} weight="bold" />
              </button>

              <MoreFiltersDropdown
                open={filterDropdownOpen}
                onClose={() => setFilterDropdownOpen(false)}
                anchorRef={filterAnchorRef}
                filters={moreFilters as any}
                updateFilter={updateMoreFilter}
                onReset={resetMoreFilters}
                onApply={applyMoreFilters}
                loading={loading}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setCreateFolderError("");
                setCreateFolderOpen(true);
              }}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-[#171717] px-4 text-[12px] font-medium text-white shadow-sm hover:bg-black"
            >
              <PlusIcon size={16} weight="bold" />
              Create folder
            </button>
          </div>
        </div>

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

                  <th className="w-[130px] border-r border-[#E5E5E5] px-4">
                    Workspace
                  </th>

                  <th className="w-[145px] border-r border-[#E5E5E5] px-4">
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
                    <td colSpan={11} className="h-40 text-center text-sm text-[#666666]">
                      {activeTab === "invited" ? "Loading invited influencers..." : "Loading influencers..."}
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={11} className="h-40 text-center text-sm text-red-600">
                      {error}
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="h-40 text-center text-sm text-[#666666]">
                      {activeTab === "invited" ? "No invited influencers found." : "No influencers found."}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, index) => {
                    const checked = selectedIds.includes(row.id);

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
                            <Avatar index={index} name={row.profile} />

                            <button
                              type="button"
                              onClick={() => openProfile(row.profileUrl)}
                              disabled={!row.profileUrl}
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
                          <StatusBadge status={row.status} />
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
                          <span
                            className="block max-w-[115px] truncate"
                            title={getRowCampaignName(row)}
                          >
                            {getRowCampaignName(row)}
                          </span>
                        </td>

                        <td className="border-r border-[#E5E5E5] px-4 text-[#222222]">
                          <span className="block max-w-[115px] truncate" title={row.workspace}>
                            {row.workspace}
                          </span>
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
                          {row.invitationDate}
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
                                onOpenChange={(open) =>
                                  setActiveInviteCampaignPickerId(open ? row.id : null)
                                }
                                onValueChange={(campaignId) => {
                                  const selectedCampaignId = String(campaignId || "");
                                  setActiveInviteCampaignPickerId(null);
                                  if (selectedCampaignId) {
                                    handleSendInvitation(row, selectedCampaignId);
                                  }
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
                                  <ComboboxEmpty>No non fully managed campaigns found.</ComboboxEmpty>
                                  <ComboboxList className="max-h-[220px] px-0">
                                    {(campaignId) => (
                                      <ComboboxItem
                                        key={campaignId}
                                        value={campaignId}
                                        showIndicator={false}
                                        onClick={() => {
                                          const selectedCampaignId = String(campaignId || "");
                                          setActiveInviteCampaignPickerId(null);
                                          if (selectedCampaignId) {
                                            handleSendInvitation(row, selectedCampaignId);
                                          }
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
                                      openProfile(row.profileUrl);
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

                                  <ComboboxItem value="view-rate-card" showIndicator={false}>
                                    <FileTextIcon size={14} />
                                    View rate card
                                  </ComboboxItem>

                                  <ComboboxItem
                                    value="copy-profile-link"
                                    showIndicator={false}
                                    onClick={async () => {
                                      try {
                                        if (row.profileUrl && navigator.clipboard) {
                                          await navigator.clipboard.writeText(row.profileUrl);
                                        }
                                      } catch (_error) {}
                                      setActiveActionComboboxId(null);
                                    }}
                                  >
                                    <CopyIcon size={14} />
                                    Copy profile link
                                  </ComboboxItem>

                                  <ComboboxItem value="move-workspace" showIndicator={false}>
                                    <span className="flex flex-1 items-center gap-2">
                                      <BriefcaseIcon size={14} />
                                      Move to workspace
                                    </span>
                                    <CaretRightIcon size={12} />
                                  </ComboboxItem>

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
              Provide your basic business information so we can set up your workspace
              and tailor recommendations accordingly.
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