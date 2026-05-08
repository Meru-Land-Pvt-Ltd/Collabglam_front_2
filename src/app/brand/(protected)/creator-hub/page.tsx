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

type CreateFolderResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  data?: {
    _id?: string;
    title?: string;
    name?: string;
    assignedCampaign?: RelatedCampaign;
    [key: string]: any;
  };
};

const GOOD_FIT_FOLDER_LIST_ENDPOINT =
  "/pitch-folders/folder/list?type=all&includeCreateCampaigns=true";

const NEW_INVITATIONS_LIST_ENDPOINT = "/newinvitations/list";
const PITCH_FOLDER_CREATE_ENDPOINT = "/pitch-folders/folder/create";
const NON_FULL_MANAGED_CAMPAIGNS_ENDPOINT = "/campaign/getNonFullManagedCampaigns";

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
  return item?.modash || item?.modashProfile || null;
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
      filterData.country || modash?.country || item?.country || row.country
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

function displayText(value?: string | number | null) {
  const text = String(value ?? "").trim();
  return text || "—";
}

function getDisplayLanguage(value?: string | number | null) {
  const text = String(value ?? "").trim();
  return text || "—";
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
    if (isUrlLikeLabel(text)) continue;

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
  if (!value) return "10/25";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "10/25";

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
    country: displayText(item.country || item.filterData?.country || modash?.country),
    language: getDisplayLanguage(item.filterData?.language || modash?.language),
    invitationDate: formatDate(firstCampaign?.assignedAt || item.folder?.assignedCampaign?.assignedAt),
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
    country: "—",
    language: getDisplayLanguage((invitation as any).language),
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

function extractGoodFitFolderList(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data?.folders)) return payload.data.folders;
  if (Array.isArray(payload?.data?.data?.folders)) return payload.data.data.folders;
  if (Array.isArray(payload?.folders)) return payload.folders;
  if (Array.isArray(payload?.data?.groups?.fullyManagedCampaigns)) {
    return payload.data.groups.fullyManagedCampaigns;
  }
  if (Array.isArray(payload?.data?.groups?.pitchSheets)) {
    return payload.data.groups.pitchSheets;
  }
  if (Array.isArray(payload?.data?.data?.groups?.fullyManagedCampaigns)) {
    return payload.data.data.groups.fullyManagedCampaigns;
  }

  return [];
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
  const campaign = folder?.assignedCampaign || null;
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

  const isFullyManaged = Boolean(folder?.isFullyManaged);
  const fallbackFolderLabel = getShortIdLabel("Folder", folderId);
  const folderTitle = getSafeDisplayLabel(
    [folder?.title, folder?.name, folder?.slug],
    fallbackFolderLabel
  );
  const campaignTitle = getSafeDisplayLabel(
    [
      campaign?.campaignTitle,
      campaign?.productOrServiceName,
      campaign?.title,
      campaign?.name,
      campaign?.campaignsId,
      queryCampaignId,
    ],
    ""
  );

  return {
    id: folderId,
    label: isFullyManaged
      ? campaignTitle || folderTitle || fallbackFolderLabel
      : folderTitle || fallbackFolderLabel,
    folderId,
    queryCampaignId,
    type: String(folder?.type || folder?.folderType || ""),
    isFullyManaged,
    goodFitCount: Number(folder?.goodFitCount || 0),
  };
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

  const label = getSafeDisplayLabel(
    [
      campaign?.label,
      campaign?.campaignTitle,
      campaign?.productOrServiceName,
      campaign?.title,
      campaign?.name,
      campaign?.campaignsId,
    ],
    getShortIdLabel("Campaign", id)
  );

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
        type: "pitch_sheet",
        folderType: "pitch_sheet",
        kind: "pitch_sheet",
        showFullListToBrand: true,
      };

      if (createFolderCampaign) {
        payload.campaignId = createFolderCampaign;
        payload.linkedCampaignId = createFolderCampaign;
      }

      if (createFolderTier) {
        payload.creatorTier = createFolderTier;
        payload.tier = createFolderTier;
      }

      const response = await api.post<CreateFolderResponse>(
        PITCH_FOLDER_CREATE_ENDPOINT,
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

      return (
        campaignOptions.find((campaign) => campaign.id === value)?.label ||
        createCampaignOptions.find((campaign) => campaign.id === value)?.label ||
        value
      );
    },
    [campaignOptions, createCampaignOptions]
  );

  const campaignComboboxItems = React.useMemo(
    () => createCampaignOptions.map((campaign) => campaign.id),
    [createCampaignOptions]
  );

  const goodFitApiParams = React.useMemo(
    () => buildGoodFitApiParams(moreFilters, debouncedSearch),
    [moreFilters, debouncedSearch]
  );

  React.useEffect(() => {
    let mounted = true;

    async function loadCampaigns() {
      try {
        setLoading(true);
        setError("");

        const [folderResponse, nonFullManagedCampaignResponse] = await Promise.all([
          api.get<CampaignListResponse>(GOOD_FIT_FOLDER_LIST_ENDPOINT),
          api.get<NonFullManagedCampaignListResponse>(
            NON_FULL_MANAGED_CAMPAIGNS_ENDPOINT,
            {
              params: {
                page: 1,
                limit: 500,
              },
            }
          ),
        ]);

        const folders = extractGoodFitFolderList(folderResponse.data);
        const options = buildCampaignOptionsFromGoodFitFolders(folders);
        const createOptions = buildCreateCampaignOptions(
          extractNonFullManagedCampaignList(nonFullManagedCampaignResponse.data)
        );

        if (!mounted) return;

        setCampaignOptions(options);
        setCreateCampaignOptions(createOptions);
        setSelectedCampaignId((current) => {
          if (current === "all") return "all";
          return options.some((option) => option.id === current) ? current : "all";
        });
        setSelectedIds([]);

        if (!options.length) {
          setHubRows([]);
          setError("No campaign folders found.");
        }
      } catch (err: any) {
        if (!mounted) return;

        setError(
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            "Failed to load campaign folders."
        );

        setHubRows([]);
        setCampaignOptions([]);
        setCreateCampaignOptions([]);
        setSelectedCampaignId("all");
        setSelectedIds([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCampaigns();

    return () => {
      mounted = false;
    };
  }, [refreshFolderListKey]);

  React.useEffect(() => {
    let mounted = true;

    async function loadGoodFitInfluencersByCampaign() {
      if (!selectedCampaignId) {
        setHubRows([]);
        return;
      }

      if (selectedCampaignId === "all" && !campaignOptions.length) {
        setHubRows([]);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const selectedFolderOptions =
          selectedCampaignId === "all"
            ? campaignOptions
            : campaignOptions.filter((folder) => folder.id === selectedCampaignId);

        const folderIdsToKeep = new Set(
          selectedCampaignId === "all"
            ? []
            : selectedFolderOptions.map((folder) => folder.folderId || folder.id)
        );

        const queryCampaignIds = Array.from(
          new Set(
            selectedFolderOptions
              .map((folder) => folder.queryCampaignId)
              .filter(Boolean) as string[]
          )
        );

        if (!queryCampaignIds.length) {
          if (!mounted) return;
          setHubRows([]);
          setSelectedIds([]);
          return;
        }

        const responses = await Promise.all(
          queryCampaignIds.map((campaignId) =>
            api
              .get<GoodFitApiResponse>(
                `/pitch-folders/campaign/${encodeURIComponent(campaignId)}/good-fit`,
                {
                  params: goodFitApiParams,
                }
              )
              .then((response) => response.data)
              .catch((error) => {
                console.error("Failed to load good fit campaign:", campaignId, error);
                return null;
              })
          )
        );

        const allItems = responses.flatMap((payload) => {
          return Array.isArray(payload?.data?.items) ? payload.data.items : [];
        });

        const folderScopedItems =
          selectedCampaignId === "all"
            ? allItems
            : allItems.filter((item: any) => {
                const folderId = String(
                  item?.folder?._id ||
                    item?.folder?.id ||
                    item?.relatedFolders?.[0]?._id ||
                    item?.relatedFolders?.[0]?.id ||
                    ""
                );

                return folderId && folderIdsToKeep.has(folderId);
              });

        const items = mergeGoodFitItems(folderScopedItems);

        if (!mounted) return;

        setHubRows(items.map(mapGoodFitItem));
        setSelectedIds([]);
      } catch (err: any) {
        if (!mounted) return;

        setError(
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            "Failed to load invited influencers."
        );

        setHubRows([]);
        setSelectedIds([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadGoodFitInfluencersByCampaign();

    return () => {
      mounted = false;
    };
  }, [selectedCampaignId, campaignOptions, goodFitApiParams]);

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
            <table className="min-w-[980px] w-full border-collapse text-left text-[12px]">
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
                            title={selectedCampaignId === "all" ? row.campaignName : row.folder}
                          >
                            {selectedCampaignId === "all" ? row.campaignName : row.folder}
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
                            <button
                              type="button"
                              className="inline-flex h-7 min-w-[112px] items-center justify-center whitespace-nowrap rounded-md bg-[#171717] px-3 text-[11px] font-medium leading-none text-white hover:bg-black"
                            >
                              Send Invitation
                            </button>

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
                setCreateFolderCampaign(String(value || ""));
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
                        setCreateFolderCampaign(String(campaignId || ""));
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