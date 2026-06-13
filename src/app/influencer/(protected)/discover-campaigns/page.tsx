"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/buttonComp";
import { TooltipProvider } from "@/components/ui/tooltip";
import CampaignCard, {
  type InfluencerDiscoverCardProps,
} from "@/components/ui/influencer/card";

import {
  apiGetAllActiveCampaigns,
  getApiErrorMessage,
  type ActiveCampaignItem,
} from "@/services/influencerApi";

import { useRouter } from "next/navigation";

import DiscoverFilter, {
  EMPTY_DISCOVER_FILTERS,
  type DiscoverFilterState,
} from "./discoverfilter";

import DiscoverTopbarFilter, {
  EMPTY_DISCOVER_TOPBAR_FILTERS,
  type DiscoverTopbarFilterState,
} from "./discovertopbarfilter";
import SkeletonLoader, {
  SkeletonProvider,
  SkeletonCircle,
} from "@/components/common/SkeletonLoader";

import { apiApplyToCampaign } from "@/app/influencer/services/influencerApi";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type ApplicantAvatar = {
  profilePic?: string;
  profilepic?: string;
  profileImage?: string;
  profileimage?: string;
  profilePicture?: string;
  avatar?: string;
  image?: string;
  name?: string;
  fullName?: string;
  username?: string;
  influencerName?: string;
  displayName?: string;
};



type UICampaign = {
  id: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  daysLeft: number;
  match: number;
  category: string;
  platforms: string[];
  platformLabel: string;
  location: string;
  applications: number;
  applicantAvatars: ApplicantAvatar[];
  brand: string;
  brandLogo?: string;
  image?: string;
  images: string[];
  campaignGoals: string[];
  countries: string[];
  ageLabel: string;
  ageRanges: string[];
  gender: string;
  goalLabel: string;
  paymentType: string;
  minFollowers: number;
  maxFollowers: number;
  verified: boolean;
  createdAt: string;
  startAt: string;
  endAt: string;
  raw: ActiveCampaignItem | any;
};



/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

function normalizePlatformLabel(value?: string) {
  const v = String(value || "").trim().toLowerCase();

  if (!v) return "Unknown";
  if (v.includes("instagram") || v === "insta") return "Instagram";
  if (v.includes("youtube") || v === "yt") return "YouTube";
  if (v.includes("tiktok") || v === "tt") return "TikTok";

  return value || "Unknown";
}

function getDaysLeft(endAt?: string | null) {
  if (!endAt) return 0;

  const end = new Date(endAt);
  if (Number.isNaN(end.getTime())) return 0;

  const now = new Date();
  const diff = end.getTime() - now.getTime();

  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
}

function getStoredValue(keys: string[]) {
  if (typeof window === "undefined") return "";

  for (const key of keys) {
    const value = window.localStorage.getItem(key);
    if (value) return value;
  }

  return "";
}

function getInfluencerAuth() {
  const influencerId = getStoredValue([
    "influencerId",
    "currentInfluencerId",
    "influencer_id",
    "userId",
    "user_id",
    "_id",
  ]);

  const token = getStoredValue([
    "influencer_token",
    "influencerToken",
    "token",
    "authToken",
    "accessToken",
  ]);

  return { influencerId, token };
}

function getImageUrl(image: any) {
  if (!image) return "";
  if (typeof image === "string") return image;

  return (
    image?.dataUrl ||
    image?.url ||
    image?.path ||
    image?.src ||
    image?.imageUrl ||
    ""
  );
}

function getMappedTextList(items: any, keys: string[]) {
  if (!Array.isArray(items)) return [];

  const values = items
    .map((item) => {
      if (typeof item === "string") return item.trim();

      if (item && typeof item === "object") {
        for (const key of keys) {
          const value = item?.[key];

          if (typeof value === "string" && value.trim()) {
            return value.trim();
          }
        }
      }

      return "";
    })
    .filter(Boolean);

  return Array.from(new Set(values));
}

function getFirstTextValue(source: any, keys: string[]) {
  if (!source || typeof source !== "object") return "";

  for (const key of keys) {
    const value = source?.[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function getCampaignCreatedAt(campaign: any) {
  return getFirstTextValue(campaign, [
    "createdAt",
    "postedAt",
    "publishedAt",
    "created_at",
    "posted_at",
  ]);
}

function getCampaignStartAt(campaign: any) {
  return getFirstTextValue(campaign, [
    "startAt",
    "startDate",
    "campaignStartDate",
    "start_at",
  ]);
}

function getCampaignEndAt(campaign: any) {
  return getFirstTextValue(campaign, [
    "endAt",
    "endDate",
    "deadline",
    "campaignEndDate",
    "end_at",
  ]);
}

function parseDate(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function daysBetween(start?: string | null, end?: string | null) {
  const startDate = parseDate(start);
  const endDate = parseDate(end);

  if (!startDate || !endDate) return 0;

  const diff = endDate.getTime() - startDate.getTime();

  if (diff <= 0) return 0;

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isWithinLastDays(date: Date | null, days: number) {
  if (!date) return false;

  const now = new Date();
  const diff = now.getTime() - date.getTime();

  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

function isInDateRange(date: Date | null, start?: string, end?: string) {
  if (!date) return false;

  const startDate = start ? parseDate(start) : null;
  const endDate = end ? parseDate(end) : null;

  if (startDate) {
    startDate.setHours(0, 0, 0, 0);
    if (date < startDate) return false;
  }

  if (endDate) {
    endDate.setHours(23, 59, 59, 999);
    if (date > endDate) return false;
  }

  return true;
}

function normalizeForCompare(value: string) {
  return String(value || "").trim().toLowerCase();
}

function findScrollParent(element: HTMLElement | null) {
  if (typeof window === "undefined" || !element) return null;

  let parent = element.parentElement;

  while (parent) {
    const style = window.getComputedStyle(parent);
    const overflowY = style.overflowY;

    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      parent.scrollHeight > parent.clientHeight
    ) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return null;
}

function getApplicantName(source: any) {
  const name =
    getFirstTextValue(source, [
      "fullName",
      "name",
      "influencerName",
      "displayName",
      "username",
      "handle",
    ]) || "";

  if (name) return name;

  const firstName = getFirstTextValue(source, ["firstName", "first_name"]);
  const lastName = getFirstTextValue(source, ["lastName", "last_name"]);

  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

function getApplicantProfilePic(source: any) {
  const profilePic =
    source?.profileimage ||
    source?.profileImage ||
    source?.profilepic ||
    source?.profilePic ||
    source?.profilePicture ||
    source?.avatar ||
    source?.image ||
    source?.photo ||
    source?.user?.profileimage ||
    source?.user?.profileImage ||
    source?.user?.profilePic ||
    source?.influencer?.profileimage ||
    source?.influencer?.profileImage ||
    source?.influencer?.profilePic ||
    source?.profile?.profileimage ||
    source?.profile?.profileImage ||
    source?.profile?.profilePic ||
    "";

  return getImageUrl(profilePic);
}

function normalizeApplicantAvatar(item: any): ApplicantAvatar {
  const source =
    item?.influencer ||
    item?.influencerData ||
    item?.creator ||
    item?.creatorData ||
    item?.user ||
    item?.profile ||
    item;

  const name = getApplicantName(source);
  const profileimage = getApplicantProfilePic(source);

  return {
    profileimage,
    profileImage: profileimage,
    profilePic: profileimage,
    name,
    fullName: name,
    username: getFirstTextValue(source, ["username", "handle"]),
  };
}

function getApplicantAvatars(campaign: any): ApplicantAvatar[] {
  const possibleLists = [
    campaign?.appliedInfluencers,
    campaign?.applicants,
    campaign?.applicantProfiles,
    campaign?.applicantInfluencers,
    campaign?.applications,
    campaign?.appliedInfluencersData,
    campaign?.influencers,
    campaign?.creatorApplicants,
    campaign?.applicantDetails,
  ];

  const rawList = possibleLists.find((list) => Array.isArray(list)) || [];

  return rawList
    .map(normalizeApplicantAvatar)
    .filter((item: ApplicantAvatar) => {
      return (
        item.profileimage ||
        item.profileImage ||
        item.profilePic ||
        item.name ||
        item.fullName ||
        item.username
      );
    });
}

function mapApiCampaignToUi(campaign: ActiveCampaignItem | any): UICampaign {
  const budget = Number(campaign?.campaignBudget ?? campaign?.budget ?? 0);

  const platforms: string[] = Array.isArray(campaign?.platformSelection)
    ? campaign.platformSelection
      .filter((p: unknown): p is string => typeof p === "string")
      .map((p: string) => normalizePlatformLabel(p))
      .filter((p: any): p is string => Boolean(p))
    : [];

  const normalizedPlatforms: string[] = Array.from(new Set(platforms));

  const brandName =
    campaign?.brandName ||
    campaign?.brand?.name ||
    campaign?.companyName ||
    "Brand Campaign";

  const applications =
    Number(campaign?.appliedInfluencerCount) ||
    Number(campaign?.applicationsCount) ||
    Number(campaign?.contractsCount) ||
    Number(campaign?.emailsSent) ||
    Number(campaign?.applicantCount) ||
    0;

  const applicantAvatars = getApplicantAvatars(campaign);

  const id = String(campaign?.campaignId || campaign?._id || "");

  const category =
    campaign?.category?.name ||
    campaign?.campaignCategory ||
    campaign?.categories?.[0]?.categoryName ||
    "Uncategorized";

  const location =
    campaign?.targetCountryIds?.[0]?.countryName ||
    campaign?.targetCountries?.[0]?.name ||
    campaign?.targetCountry ||
    campaign?.createdLocation?.country ||
    "";

  const productImages = Array.isArray(campaign?.productImages)
    ? campaign.productImages
    : [];

  const imageUrls = productImages.map(getImageUrl).filter(Boolean);

  const firstImage = imageUrls[0] || "";

  const campaignGoals = getMappedTextList(campaign?.campaignGoals, [
    "goal",
    "name",
    "label",
    "title",
  ]);

  const countries = getMappedTextList(campaign?.targetCountryIds, [
    "countryName",
    "name",
    "label",
    "title",
  ]);

  const ageRanges = [
    ...getMappedTextList(campaign?.targetAgeRanges, [
      "range",
      "name",
      "label",
      "title",
    ]),
    ...getMappedTextList(campaign?.targetAgeRangesDetails, [
      "range",
      "name",
      "label",
      "title",
    ]),
  ];

  const goalLabel = campaignGoals[0] || "";
  const ageLabel = compactAgeLabel(ageRanges);

  const gender =
    campaign?.gender ||
    campaign?.targetGender ||
    campaign?.audienceGender ||
    campaign?.targetAudienceGender ||
    "";

  const createdAt = getCampaignCreatedAt(campaign);
  const startAt = getCampaignStartAt(campaign);
  const endAt = getCampaignEndAt(campaign);

  return {
    id,
    title: campaign?.campaignTitle || "Untitled Campaign",
    description: campaign?.description || "No description available.",
    budgetMin: budget,
    budgetMax: budget,
    daysLeft: getDaysLeft(endAt),
    match: Number(campaign?.matchScore ?? 0),
    category,
    platforms: normalizedPlatforms.length ? normalizedPlatforms : ["Unknown"],
    platformLabel:
      normalizedPlatforms.length > 1
        ? "Multiple"
        : normalizedPlatforms[0] ?? "Unknown",
    location,
    applications,
    applicantAvatars,
    brand: brandName,
    brandLogo: getBrandLogoUrl(campaign),
    image: firstImage,
    images: imageUrls,
    campaignGoals,
    countries,
    ageLabel,
    ageRanges,
    gender,
    goalLabel,
    paymentType: campaign?.paymentType || "",
    minFollowers: Number(campaign?.minFollowers ?? 0),
    maxFollowers: Number(campaign?.maxFollowers ?? 0),
    verified: Boolean(
      campaign?.isVerified ||
      campaign?.isFullyManaged ||
      campaign?.brandWasFullyManagedAtCreation ||
      campaign?.brandSubscriptionSnapshot?.status === "active"
    ),
    createdAt,
    startAt,
    endAt,
    raw: campaign,
  };
}

function matchesPostedBy(campaign: UICampaign, value: string) {
  if (!value || value === "All") return true;

  const createdDate = parseDate(campaign.createdAt);

  switch (value) {
    case "Past 24hrs":
      return isWithinLastDays(createdDate, 1);
    case "Past 2 days":
      return isWithinLastDays(createdDate, 2);
    case "Past Week":
      return isWithinLastDays(createdDate, 7);
    case "Past Month":
      return isWithinLastDays(createdDate, 30);
    default:
      return true;
  }
}

function matchesCampaignGoal(campaign: UICampaign, value: string) {
  if (!value || value === "All") return true;

  const selected = normalizeForCompare(value);

  return campaign.campaignGoals.some(
    (goal) => normalizeForCompare(goal) === selected
  );
}

function matchesCampaignDuration(campaign: UICampaign, value: string) {
  if (!value || value === "All") return true;

  const durationDays = daysBetween(campaign.startAt, campaign.endAt);

  if (!durationDays) return false;

  switch (value) {
    case "Less then 1 Week":
      return durationDays < 7;
    case "1 Week":
      return durationDays >= 7 && durationDays < 14;
    case "2–3 Week":
      return durationDays >= 14 && durationDays <= 21;
    case "3–6 Weeks":
      return durationDays > 21 && durationDays <= 42;
    case "7–12 weeks":
      return durationDays > 42 && durationDays <= 84;
    case "More then 12 weeks":
      return durationDays > 84;
    default:
      return true;
  }
}

function matchesBudget(campaign: UICampaign, value: string) {
  if (!value || value === "All") return true;

  const budget = Number(campaign.budgetMax || 0);

  switch (value) {
    case "Under $100":
      return budget < 100;
    case "$100 – $500":
      return budget >= 100 && budget <= 500;
    case "$500 – $1K":
      return budget > 500 && budget <= 1000;
    case "$1K – $5K":
      return budget > 1000 && budget <= 5000;
    case "$5K – $10K":
      return budget > 5000 && budget <= 10000;
    case "$10K – $25K":
      return budget > 10000 && budget <= 25000;
    case "$25K – $50K":
      return budget > 25000 && budget <= 50000;
    case "$50K+":
      return budget > 50000;
    default:
      return true;
  }
}

function matchesDate(campaign: UICampaign, filters: DiscoverFilterState) {
  const selectedDate = filters.Date;
  const createdDate = parseDate(campaign.createdAt);
  const deadlineDate = parseDate(campaign.endAt);

  if (selectedDate && selectedDate !== "Recently Received") {
    const now = new Date();

    if (selectedDate === "Today" && !isSameDay(createdDate || new Date(0), now)) {
      return false;
    }

    if (selectedDate === "This Week" && !isWithinLastDays(createdDate, 7)) {
      return false;
    }

    if (selectedDate === "This Month" && !isWithinLastDays(createdDate, 30)) {
      return false;
    }
  }

  if (!filters.StartDate && !filters.EndDate) {
    return true;
  }

  if (filters.DateRangeType === "Deadline") {
    return isInDateRange(deadlineDate, filters.StartDate, filters.EndDate);
  }

  return isInDateRange(createdDate, filters.StartDate, filters.EndDate);
}

function matchesLocation(campaign: UICampaign, value: string[]) {
  if (!value.length || value.includes("All")) return true;

  const selectedLocations = value.map(normalizeForCompare);

  return selectedLocations.includes(normalizeForCompare(campaign.location));
}

function matchesSearch(campaign: UICampaign, query: string) {
  const q = normalizeForCompare(query);

  if (!q) return true;

  const searchableText = [
    campaign.title,
    campaign.description,
    campaign.brand,
    campaign.category,
    campaign.location,
    campaign.paymentType,
    campaign.platformLabel,
    ...campaign.platforms,
    ...campaign.campaignGoals,
    ...campaign.countries,
    ...campaign.ageRanges,
  ]
    .filter(Boolean)
    .join(" ");

  return normalizeForCompare(searchableText).includes(q);
}

const TIER_RANGES = {
  Nano: [0, 10000],
  Micro: [10000, 100000],
  Mid: [100000, 250000],
  Macro: [250000, 1000000],
  Mega: [1000000, Number.POSITIVE_INFINITY],
} as const;

function rangeOverlaps(
  campaignMin: number,
  campaignMax: number,
  filterMin: number,
  filterMax: number
) {
  const min = Number.isFinite(campaignMin) ? campaignMin : 0;
  const max = Number.isFinite(campaignMax) && campaignMax > 0 ? campaignMax : min;

  return Math.max(min, filterMin) <= Math.min(max, filterMax);
}

function matchesTopbarFilters(
  campaign: UICampaign,
  topbarFilters: DiscoverTopbarFilterState
) {
  if (topbarFilters.verifiedOnly && !campaign.verified) {
    return false;
  }

  if (topbarFilters.platforms.length > 0) {
    const campaignPlatforms = campaign.platforms.map(normalizeForCompare);

    const selectedPlatforms = topbarFilters.platforms
      .map(normalizePlatformLabel)
      .map(normalizeForCompare);

    const hasPlatformMatch = selectedPlatforms.some((platform) =>
      campaignPlatforms.includes(platform)
    );

    if (!hasPlatformMatch) return false;
  }

  if (topbarFilters.paymentType) {
    if (
      normalizeForCompare(campaign.paymentType) !==
      normalizeForCompare(topbarFilters.paymentType)
    ) {
      return false;
    }
  }

  if (topbarFilters.age) {
    const selectedAge = normalizeForCompare(topbarFilters.age);

    const hasAgeMatch = campaign.ageRanges.some((range) => {
      const normalizedRange = normalizeForCompare(range);

      if (selectedAge === "45+") {
        const numbers = String(range)
          .match(/\d+/g)
          ?.map(Number)
          .filter((num) => Number.isFinite(num));

        return (
          normalizedRange.includes("45+") ||
          normalizedRange.includes("45-") ||
          Boolean(numbers?.some((num) => num >= 45))
        );
      }

      return normalizedRange === selectedAge;
    });

    if (!hasAgeMatch) return false;
  }

  if (topbarFilters.gender !== "All") {
    // If backend does not send gender, do not remove every campaign.
    if (
      campaign.gender &&
      normalizeForCompare(campaign.gender) !==
      normalizeForCompare(topbarFilters.gender)
    ) {
      return false;
    }
  }

  if (topbarFilters.influencerTier) {
    const [tierMin, tierMax] = TIER_RANGES[topbarFilters.influencerTier];

    if (
      !rangeOverlaps(
        campaign.minFollowers,
        campaign.maxFollowers,
        tierMin,
        tierMax
      )
    ) {
      return false;
    }
  }

  return true;
}


function compactAgeLabel(ranges: string[]) {
  const clean = ranges.filter(Boolean);

  if (clean.length === 0) return "";

  const numbers = clean
    .flatMap((range) => String(range).match(/\d+/g) || [])
    .map(Number)
    .filter((num) => Number.isFinite(num));

  if (numbers.length >= 2) {
    return `${Math.min(...numbers)}-${Math.max(...numbers)}`;
  }

  return clean[0] || "";
}

function getBrandLogoUrl(campaign: any) {
  const logo =
    campaign?.brandprofilepic ||
    campaign?.brandProfilePic ||
    campaign?.brand_profile_pic ||
    campaign?.brandLogo ||
    campaign?.brand?.brandprofilepic ||
    campaign?.brand?.brandProfilePic ||
    campaign?.brand?.logo ||
    campaign?.brand?.logoUrl ||
    campaign?.brand?.profileImage ||
    campaign?.brandImage ||
    "";

  if (!logo) return "";

  if (typeof logo === "string") return logo;

  return (
    logo?.dataUrl ||
    logo?.url ||
    logo?.path ||
    logo?.src ||
    logo?.imageUrl ||
    ""
  );
}
/* -------------------------------------------------------------------------- */
/*                                    PAGE                                    */
/* -------------------------------------------------------------------------- */

function DiscoverCampaignCardSkeleton() {
  return (
    <div className="relative flex h-[31.5rem] w-full min-w-0 max-w-none flex-col overflow-hidden rounded-[1.5rem] bg-white">
      <div className="relative h-[11rem] max-h-[11rem] w-full shrink-0 overflow-visible bg-[#F2F2F2]">
        <SkeletonLoader className="h-full w-full rounded-t-[1.5rem]" />

        <SkeletonLoader className="absolute right-[1rem] top-[1rem] h-[1.75rem] w-[5.5rem] rounded-[1rem]" />

        <div className="absolute bottom-[-2rem] left-[1.5rem] z-10">
          <SkeletonLoader className="h-[4rem] w-[4rem] rounded-[0.625rem]" />
        </div>
      </div>

      <div className="flex max-h-[20.5rem] flex-1 flex-col items-start justify-start gap-[0.75rem] self-stretch overflow-hidden px-[1.25rem] pb-[1.75rem] pt-[2.5rem]">
        <div className="flex w-full items-center justify-between gap-[0.75rem]">
          <div className="flex min-w-0 flex-wrap items-center gap-[0.5rem]">
            <SkeletonLoader className="h-[1.75rem] w-[5.25rem] rounded-[1rem]" />
            <SkeletonLoader className="h-[1.75rem] w-[4.25rem] rounded-[1rem]" />
            <SkeletonLoader className="h-[1.75rem] w-[4rem] rounded-[1rem]" />
          </div>

          <SkeletonLoader className="h-8 w-8 shrink-0 rounded-full" />
        </div>

        <div className="flex w-full flex-col items-start gap-[0.5rem]">
          <SkeletonLoader className="h-[1.5rem] w-[78%] rounded-md" />

          <div className="flex w-full flex-col gap-[0.375rem]">
            <SkeletonLoader className="h-[1rem] w-full rounded-md" />
            <SkeletonLoader className="h-[1rem] w-[72%] rounded-md" />
          </div>
        </div>

        <div className="flex w-full items-center py-[0.5rem]">
          <SkeletonLoader className="h-4 w-4 shrink-0 rounded-full" />
          <SkeletonLoader className="ml-[0.5rem] h-[1.25rem] w-[70%] rounded-md" />
        </div>

        <div className="flex w-full items-center gap-[1rem]">
          <div className="flex items-center">
            <SkeletonCircle className="h-[1.75rem] w-[1.75rem]" />
            <SkeletonCircle className="-ml-2 h-[1.75rem] w-[1.75rem]" />
            <SkeletonCircle className="-ml-2 h-[1.75rem] w-[1.75rem]" />
          </div>

          <SkeletonLoader className="h-[1rem] w-[3rem] rounded-md" />
        </div>

        <div className="mt-auto w-full shrink-0">
          <div className="h-px w-full bg-[#E6E6E6]" />

          <div className="flex w-full items-center pt-[0.75rem]">
            <SkeletonLoader className="h-[1.75rem] w-[5rem] rounded-md" />

            <div className="ml-auto flex items-center gap-[0.5rem]">
              <SkeletonLoader className="h-[2.5rem] w-[4.5rem] rounded-[0.75rem]" />
              <SkeletonLoader className="h-[2.5rem] w-[5.25rem] rounded-[0.75rem]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiscoverCampaignGridSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,22.0625rem),22.0625rem))] justify-start gap-[1.5rem]">
      {Array.from({ length: 8 }).map((_, index) => (
        <DiscoverCampaignCardSkeleton key={index} />
      ))}
    </div>
  );
}

export default function DiscoverCampaigns() {
  const router = useRouter();
  const pageRef = useRef<HTMLDivElement | null>(null);

  const [filters, setFilters] = useState<DiscoverFilterState>(
    EMPTY_DISCOVER_FILTERS
  );

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [sortValue, setSortValue] = useState("Most Relevant");

  const [topbarFilters, setTopbarFilters] =
    useState<DiscoverTopbarFilterState>(EMPTY_DISCOVER_TOPBAR_FILTERS);

  const [applyingCampaignIds, setApplyingCampaignIds] = useState<string[]>([]);
  const [appliedCampaignIds, setAppliedCampaignIds] = useState<string[]>([]);
  const [campaigns, setCampaigns] = useState<UICampaign[]>([]);
  const [serverTotal, setServerTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [topFilterCollapsed, setTopFilterCollapsed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const pageElement = pageRef.current;
    const scrollParent = findScrollParent(pageElement);

    const handleScroll = () => {
      const scrollTop = scrollParent ? scrollParent.scrollTop : window.scrollY;
      setTopFilterCollapsed(scrollTop > 24);
    };

    handleScroll();

    if (scrollParent) {
      scrollParent.addEventListener("scroll", handleScroll, { passive: true });

      return () => {
        scrollParent.removeEventListener("scroll", handleScroll);
      };
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        setError("");

        const { influencerId, token } = getInfluencerAuth();

        if (!influencerId) {
          throw new Error("Influencer ID not found. Please sign in again.");
        }

        const res = await apiGetAllActiveCampaigns(
          {
            influencerId,
            page: 1,
            limit: 100,
            search: "",
          },
          token
        );

        if (ignore) return;

        const items = Array.isArray((res as any)?.data?.items)
          ? (res as any).data.items
          : Array.isArray((res as any)?.items)
            ? (res as any).items
            : [];

        const mapped = items
          .filter((campaign: any) => {
            const role = campaign?.createdBy?.role;
            const adminRole = campaign?.createdBy?.adminRole;

            return role !== "admin" && adminRole !== "super_admin";
          })
          .map(mapApiCampaignToUi)
          .filter((item: UICampaign) => Boolean(item.id));

        setCampaigns(mapped);
        setServerTotal(
          Number(
            (res as any)?.data?.pagination?.total ??
            (res as any)?.meta?.total ??
            mapped.length
          )
        );
      } catch (err) {
        if (ignore) return;

        setCampaigns([]);
        setServerTotal(0);
        setError(getApiErrorMessage(err, "Failed to load campaigns."));
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchCampaigns();

    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  const filteredCampaigns = useMemo(() => {
    const filtered = campaigns.filter((campaign) => {
      return (
        matchesSearch(campaign, debouncedSearch) &&
        matchesTopbarFilters(campaign, topbarFilters) &&
        matchesPostedBy(campaign, filters["Posted By"]) &&
        matchesLocation(campaign, filters.Location) &&
        matchesCampaignGoal(campaign, filters["Campaign Goal"]) &&
        matchesCampaignDuration(campaign, filters["Campaign Duration"]) &&
        matchesBudget(campaign, filters.Budget) &&
        matchesDate(campaign, filters)
      );
    });

    switch (sortValue) {
      case "Highest Budget":
        filtered.sort((a, b) => b.budgetMax - a.budgetMax);
        break;

      case "Recently Published":
        filtered.sort((a, b) => {
          const aTime = parseDate(a.createdAt)?.getTime() ?? 0;
          const bTime = parseDate(b.createdAt)?.getTime() ?? 0;

          return bTime - aTime;
        });
        break;

      case "Closing Soon":
        filtered.sort((a, b) => a.daysLeft - b.daysLeft);
        break;

      case "Highest Match Score":
      case "Most Relevant":
      default:
        filtered.sort((a, b) => b.match - a.match);
        break;
    }

    return filtered;
  }, [campaigns, filters, sortValue, debouncedSearch, topbarFilters]);

  const getCampaignDetailsHref = (campaign: UICampaign) => {
    const campaignTitle = campaign.title || "Campaign Details";

    return `/influencer/discover-campaigns/${encodeURIComponent(
      campaign.id
    )}?title=${encodeURIComponent(campaignTitle)}`;
  };

  const handleApplyToCampaign = async (campaign: UICampaign) => {
    const { influencerId, token } = getInfluencerAuth();

    if (!influencerId) {
      alert("Influencer ID not found. Please sign in again.");
      return;
    }

    if (appliedCampaignIds.includes(campaign.id)) return;
    if (applyingCampaignIds.includes(campaign.id)) return;

    try {
      setApplyingCampaignIds((prev) => [...prev, campaign.id]);

      const res = await apiApplyToCampaign(
        {
          campaignId: campaign.id,
          influencerId,
        },
        token
      );

      setAppliedCampaignIds((prev) =>
        prev.includes(campaign.id) ? prev : [...prev, campaign.id]
      );

      setCampaigns((prev) =>
        prev.map((item) =>
          item.id === campaign.id
            ? {
              ...item,
              applications:
                Number((res as any)?.applicantCount) ||
                item.applications + 1,
            }
            : item
        )
      );

      alert((res as any)?.message || "Applied successfully.");
    } catch (err) {
      alert(getApiErrorMessage(err, "Failed to apply to campaign."));
    } finally {
      setApplyingCampaignIds((prev) =>
        prev.filter((id) => id !== campaign.id)
      );
    }
  };

  return (
    <SkeletonProvider>
      <TooltipProvider>
        <div ref={pageRef} className="min-h-screen bg-white">
          <DiscoverTopbarFilter
            search={search}
            setSearch={setSearch}
            collapsed={topFilterCollapsed}
            value={topbarFilters}
            onApply={setTopbarFilters}
            onClear={() => setTopbarFilters(EMPTY_DISCOVER_TOPBAR_FILTERS)}
          />

          <div className="mx-auto max-w-full bg-white">
            <DiscoverFilter
              filters={filters}
              setFilters={setFilters}
              sortValue={sortValue}
              setSortValue={setSortValue}
            />

            <div className="px-[1.5rem] pb-8 pt-8">
              {loading ? (
                <DiscoverCampaignGridSkeleton />
              ) : error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                  <p className="text-sm font-medium text-red-700">{error}</p>

                  <Button
                    className="mt-4"
                    onClick={() => setRefreshKey((value) => value + 1)}
                  >
                    Retry
                  </Button>
                </div>
              ) : filteredCampaigns.length === 0 ? (
                <div className="rounded-2xl border bg-white p-10 text-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    No campaigns found
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Try changing your search or filter selection.
                  </p>
                </div>
              ) : (
                <div className="grid w-full justify-items-stretch gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,22rem),1fr))]">
                  {filteredCampaigns.map((campaign) => (
                    <CampaignCard
                      key={campaign.id}
                      title={campaign.title}
                      description={campaign.description}
                      imageUrl={campaign.image}
                      imageUrls={campaign.images}
                      brandName={campaign.brand}
                      brandLogoUrl={campaign.brandLogo}
                      campaignGoal={campaign.goalLabel}
                      category={campaign.category}
                      ageLabel={campaign.ageLabel}
                      gender={campaign.gender}
                      countries={campaign.countries}
                      budget={campaign.budgetMax}
                      viewedCount={campaign.applications}
                      applicantAvatars={campaign.applicantAvatars}
                      isApplying={applyingCampaignIds.includes(campaign.id)}
                      hasApplied={appliedCampaignIds.includes(campaign.id)}
                      onCardClick={() =>
                        router.push(
                          `/influencer/discover-campaigns/${encodeURIComponent(
                            campaign.id
                          )}?title=${encodeURIComponent(campaign.title || "Campaign Details")}`
                        )
                      }
                      onApply={() => handleApplyToCampaign(campaign)}
                      onSave={() => {
                        // save API here when available
                      }}
                      onMore={() => {
                        // open more menu here when available
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </TooltipProvider>
    </SkeletonProvider>
  );
}