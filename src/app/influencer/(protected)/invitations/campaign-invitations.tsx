"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Search } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import CampaignCard, {
  type InfluencerDiscoverCardProps,
} from "@/components/ui/influencer/card";
import {
  apiGetAllInvitationsByInfluencer,
  getApiErrorMessage,
} from "@/app/influencer/services/influencerApi";
import SidebarCampaign from "./sidebarCampaign";
import InvitationFilter, {
  EMPTY_INVITATION_FILTERS,
  type InvitationFilterState,
} from "./invitationFilter";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type ApiInviteStatus = "sent" | "accepted" | "reject";

type AppliedStatus =
  | "New"
  | "Viewed"
  | "Accepted"
  | "Shortlisted"
  | "Expired"
  | "Rejected";

type CampaignInvite = {
  id: string;
  campaignId?: string;
  brandId?: string;
  brandName: string;
  brandLogo?: string;
  title: string;
  description: string;
  category: string;
  categoryId: string;
  campaignType: string;
  platform: string;
  platforms: string[];
  countries: string[];
  ageLabel: string;
  gender: string;
  budgetMin: number;
  budgetMax: number;
  invitedAt: string;
  invitedAtRaw: string;
  respondBy: string;
  respondByRaw: string;
  acceptedAtRaw: string;
  status: ApiInviteStatus;
  appliedStatus: AppliedStatus;
  matchScore: number;
  brandRating: number;
  image?: string;
  images: string[];
  campaignGoal: string;
  raw: any;
};

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

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
    image?.secureUrl ||
    ""
  );
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

function isMongoIdLike(value: string) {
  return /^[a-f0-9]{24}$/i.test(value.trim());
}

function getCleanText(value: unknown) {
  if (typeof value !== "string") return "";

  const text = value.trim();

  if (!text || isMongoIdLike(text)) return "";

  return text;
}

function getMappedTextList(items: any, keys: string[]) {
  if (!Array.isArray(items)) return [];

  const values = items
    .map((item) => {
      const directValue = getCleanText(item);
      if (directValue) return directValue;

      if (item && typeof item === "object") {
        for (const key of keys) {
          const value = getCleanText(item?.[key]);
          if (value) return value;
        }
      }

      return "";
    })
    .filter(Boolean);

  return Array.from(new Set(values));
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

function parseDate(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function formatDate(value?: string) {
  const date = parseDate(value);
  if (!date) return "-";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function isSameDay(a: Date | null, b: Date) {
  if (!a) return false;

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isWithinLastHours(date: Date | null, hours: number) {
  if (!date) return false;

  const diff = Date.now() - date.getTime();
  return diff >= 0 && diff <= hours * 60 * 60 * 1000;
}

function isWithinLastDays(date: Date | null, days: number) {
  return isWithinLastHours(date, days * 24);
}

function normalizeForCompare(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function normalizePlatformLabel(value?: string) {
  const valueText = String(value || "").trim();
  const v = valueText.toLowerCase();

  if (!v) return "Unknown";
  if (v.includes("instagram") || v === "insta") return "Instagram";
  if (v.includes("youtube") || v === "yt") return "YouTube";
  if (v.includes("tiktok") || v === "tt") return "TikTok";

  return valueText || "Unknown";
}

function normalizeStatus(value: unknown): ApiInviteStatus {
  const status = normalizeForCompare(value);

  if (status === "accepted") return "accepted";

  if (status === "reject" || status === "rejected" || status === "declined") {
    return "reject";
  }

  return "sent";
}

function isExpired(dateValue?: string) {
  const date = parseDate(dateValue);
  if (!date) return false;

  return date.getTime() < Date.now();
}

function getAppliedStatus(
  inv: any,
  status: ApiInviteStatus,
  respondByRaw: string
): AppliedStatus {
  if (status === "accepted") return "Accepted";
  if (status === "reject") return "Rejected";

  if (isExpired(respondByRaw)) return "Expired";

  if (Boolean(inv?.shortlisted ?? inv?.isShortlisted ?? inv?.is_shortlisted)) {
    return "Shortlisted";
  }

  if (Boolean(inv?.viewed ?? inv?.isViewed ?? inv?.seen ?? inv?.isSeen)) {
    return "Viewed";
  }

  return "New";
}

function getBrandLogoUrl(invite: any) {
  const logo =
    invite?.brandLogo ||
    invite?.brandLogoUrl ||
    invite?.brandProfilePic ||
    invite?.brandprofilepic ||
    invite?.brand_profile_pic ||
    invite?.brand?.logo ||
    invite?.brand?.logoUrl ||
    invite?.brand?.profilePic ||
    invite?.brand?.profileImage ||
    invite?.brand?.brandprofilepic ||
    invite?.brand?.brandProfilePic ||
    invite?.campaign?.brandLogo ||
    invite?.campaign?.brandLogoUrl ||
    invite?.campaign?.brandprofilepic ||
    "";

  return getImageUrl(logo);
}

function getCampaignImages(invite: any) {
  const campaign = invite?.campaign || invite?.campaignData || invite;

  const possibleLists = [
    campaign?.productImages,
    campaign?.images,
    campaign?.imageUrls,
    campaign?.campaignImages,
    invite?.productImages,
  ];

  const list = possibleLists.find((items) => Array.isArray(items)) || [];
  const images = list.map(getImageUrl).filter(Boolean);

  const directImage =
    getImageUrl(campaign?.imageUrl) ||
    getImageUrl(campaign?.image) ||
    getImageUrl(campaign?.thumbnail) ||
    getImageUrl(invite?.imageUrl) ||
    getImageUrl(invite?.image);

  return Array.from(new Set([directImage, ...images].filter(Boolean)));
}

function getBudget(invite: any) {
  const singleBudget =
    Number(
      invite?.campaignBudget ??
        invite?.budget ??
        invite?.budgetMax ??
        invite?.budgetMin ??
        invite?.campaign?.campaignBudget ??
        invite?.campaign?.budget ??
        0
    ) || 0;

  const budgetMin =
    Number(
      invite?.budgetMin ??
        invite?.campaignBudgetMin ??
        invite?.minBudget ??
        invite?.campaign?.budgetMin ??
        invite?.campaign?.minBudget ??
        singleBudget
    ) || 0;

  const budgetMax =
    Number(
      invite?.budgetMax ??
        invite?.campaignBudgetMax ??
        invite?.maxBudget ??
        invite?.campaign?.budgetMax ??
        invite?.campaign?.maxBudget ??
        singleBudget
    ) || 0;

  return { budgetMin, budgetMax };
}

function mapApiInviteToUi(inv: any): CampaignInvite {
  const campaign = inv?.campaign || inv?.campaignData || inv;
  const brand = inv?.brand || campaign?.brand || {};
  const { budgetMin, budgetMax } = getBudget(inv);

  const invitationId = String(inv?.invitationId ?? inv?._id ?? inv?.id ?? "");

  const campaignId = String(
    inv?.campaignId ??
      campaign?.campaignId ??
      campaign?._id ??
      campaign?.id ??
      ""
  );

  const status = normalizeStatus(inv?.status);

  const invitedAtRaw = String(
    inv?.sentAt ?? inv?.createdAt ?? inv?.invitedAt ?? ""
  );

  const respondByRaw = String(
    inv?.respondBy ??
      inv?.responseDeadline ??
      campaign?.responseDeadline ??
      campaign?.endAt ??
      inv?.endAt ??
      inv?.updatedAt ??
      ""
  );

  const acceptedAtRaw = String(
    inv?.acceptedAt ||
      inv?.appliedAt ||
      inv?.respondedAt ||
      inv?.updatedAt ||
      inv?.createdAt ||
      ""
  );

  const images = getCampaignImages(inv);

  const platforms = Array.isArray(campaign?.platformSelection)
    ? campaign.platformSelection.map(normalizePlatformLabel).filter(Boolean)
    : Array.isArray(inv?.platforms)
      ? inv.platforms.map(normalizePlatformLabel).filter(Boolean)
      : [normalizePlatformLabel(inv?.platform ?? campaign?.platform)].filter(
          Boolean
        );

  const category = String(
    inv?.category?.name ??
      inv?.categoryName ??
      inv?.category ??
      campaign?.category?.name ??
      campaign?.campaignCategory ??
      campaign?.categories?.[0]?.categoryName ??
      "General"
  );

  const categoryId = String(
    inv?.category?._id ??
      inv?.category?.id ??
      inv?.categoryId ??
      campaign?.category?._id ??
      campaign?.category?.id ??
      campaign?.categoryId ??
      ""
  );

  const countries = [
    getCleanText(campaign?.targetCountry),
    getCleanText(inv?.targetCountry),
    ...getMappedTextList(campaign?.targetCountries, [
      "countryName",
      "name",
      "label",
      "title",
    ]),
    ...getMappedTextList(campaign?.targetCountryDetails, [
      "countryName",
      "name",
      "label",
      "title",
    ]),
    ...getMappedTextList(campaign?.targetCountryIds, [
      "countryName",
      "name",
      "label",
      "title",
    ]),
  ];

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

  const campaignGoals = [
    ...getMappedTextList(campaign?.campaignGoalValues, [
      "goal",
      "name",
      "label",
      "title",
    ]),
    ...getMappedTextList(campaign?.campaignGoals, [
      "goal",
      "name",
      "label",
      "title",
    ]),
  ];

  const campaignType =
    getFirstTextValue(inv, [
      "campaignType",
      "type",
      "paymentType",
      "collaborationType",
    ]) ||
    getFirstTextValue(campaign, [
      "campaignType",
      "type",
      "paymentType",
      "collaborationType",
    ]) ||
    "Paid";

  return {
    id: invitationId,
    brandId: brand?.brandId
      ? String(brand.brandId)
      : inv?.brandId
        ? String(inv.brandId)
        : brand?._id
          ? String(brand._id)
          : brand?.id
            ? String(brand.id)
            : undefined,
    campaignId: campaignId || undefined,
    brandName: String(
      inv?.brandName ??
        brand?.brandName ??
        brand?.name ??
        campaign?.brandName ??
        campaign?.brand?.brandName ??
        campaign?.brand?.name ??
        "Brand"
    ),
    brandLogo: getBrandLogoUrl(inv),
    title: String(
      inv?.campaignTitle ??
        campaign?.campaignTitle ??
        campaign?.campaignName ??
        campaign?.title ??
        "Untitled Campaign"
    ),
    description: String(
      inv?.description ?? campaign?.description ?? "No description available."
    ),
    category,
    categoryId,
    campaignType,
    platform: platforms.length > 1 ? "Multiple" : platforms[0] || "Unknown",
    platforms: Array.from(new Set(platforms.length ? platforms : ["Unknown"])),
    countries: Array.from(new Set(countries)).filter(Boolean),
    ageLabel: compactAgeLabel(ageRanges),
    gender: String(
      campaign?.gender ?? campaign?.targetGender ?? campaign?.audienceGender ?? ""
    ),
    budgetMin,
    budgetMax,
    invitedAt: formatDate(invitedAtRaw),
    invitedAtRaw,
    respondBy: formatDate(respondByRaw),
    respondByRaw,
    acceptedAtRaw,
    status,
    appliedStatus: getAppliedStatus(inv, status, respondByRaw),
    matchScore: Number(inv?.matchScore ?? campaign?.matchScore ?? 0),
    brandRating: Number(
      inv?.brandRating ?? inv?.brand?.rating ?? campaign?.brandRating ?? 0
    ),
    image: images[0] || "",
    images,
    campaignGoal: campaignGoals[0] || platforms[0] || "",
    raw: inv,
  };
}

function matchesSearch(invite: CampaignInvite, query: string) {
  const q = normalizeForCompare(query);
  if (!q) return true;

  const searchableText = [
    invite.title,
    invite.description,
    invite.brandName,
    invite.category,
    invite.campaignType,
    invite.appliedStatus,
    invite.platform,
    ...invite.platforms,
    ...invite.countries,
  ]
    .filter(Boolean)
    .join(" ");

  return normalizeForCompare(searchableText).includes(q);
}

function matchesSingle(value: string, selected: string) {
  if (!selected || selected === "All") return true;

  return normalizeForCompare(value).includes(normalizeForCompare(selected));
}

function matchesCategory(invite: CampaignInvite, selected: string[]) {
  if (!selected.length || selected.includes("All")) return true;

  const normalized = selected.map(normalizeForCompare);

  return (
    normalized.includes(normalizeForCompare(invite.categoryId)) ||
    normalized.includes(normalizeForCompare(invite.category))
  );
}

function matchesPlatforms(invite: CampaignInvite, selected: string[]) {
  if (!selected.length || selected.includes("All")) return true;

  const selectedPlatforms = selected
    .map(normalizePlatformLabel)
    .map(normalizeForCompare);

  const invitePlatforms = invite.platforms
    .map(normalizePlatformLabel)
    .map(normalizeForCompare);

  return selectedPlatforms.some((platform) =>
    invitePlatforms.includes(platform)
  );
}

function matchesBudget(invite: CampaignInvite, selected: string) {
  if (!selected || selected === "All") return true;

  const budget = Number(invite.budgetMax || invite.budgetMin || 0);

  switch (selected) {
    case "Under $100":
      return budget < 100;
    case "$100 - $500":
      return budget >= 100 && budget <= 500;
    case "$500 - $1000":
      return budget > 500 && budget <= 1000;
    case "$1,000 - $5,000":
      return budget > 1000 && budget <= 5000;
    case "$5000+":
      return budget > 5000;
    default:
      return true;
  }
}

function matchesDateOption(value: string, selected: string) {
  if (!selected || selected === "All") return true;

  const date = parseDate(value);
  const now = new Date();

  switch (selected) {
    case "Today":
      return isSameDay(date, now);
    case "Last 24 Hours":
      return isWithinLastHours(date, 24);
    case "Last 7 Days":
      return isWithinLastDays(date, 7);
    case "Last 30 Days":
      return isWithinLastDays(date, 30);
    default:
      return true;
  }
}

/* -------------------------------------------------------------------------- */
/* PAGE                                                                       */
/* -------------------------------------------------------------------------- */

export default function InvitesPage() {
  const [filters, setFilters] = useState<InvitationFilterState>(
    EMPTY_INVITATION_FILTERS
  );
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortValue, setSortValue] = useState("Newest Invitation");

  const [invites, setInvites] = useState<CampaignInvite[]>([]);
  const [selectedInviteId, setSelectedInviteId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search]);

  const fetchInvites = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { influencerId, token } = getInfluencerAuth();

      if (!influencerId) {
        setInvites([]);
        setError("Influencer ID not found. Please log in again.");
        return;
      }

      const res = await apiGetAllInvitationsByInfluencer(
        {
          influencerId,
          status: undefined,
        },
        token || undefined
      );

      const items = Array.isArray((res as any)?.invitations)
        ? (res as any).invitations
        : Array.isArray((res as any)?.data?.invitations)
          ? (res as any).data.invitations
          : Array.isArray((res as any)?.data)
            ? (res as any).data
            : [];

      const mapped = items
        .map(mapApiInviteToUi)
        .filter((item: CampaignInvite) => item.id);

      setInvites(mapped);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load campaign invitations."));
      setInvites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites, refreshKey]);

  const filteredInvites = useMemo(() => {
    const filtered = invites.filter((invite) => {
      return (
        matchesSearch(invite, debouncedSearch) &&
        matchesSingle(invite.campaignType, filters["Campaign Type"]) &&
        matchesCategory(invite, filters.Category) &&
        matchesDateOption(invite.invitedAtRaw, filters["Invitation Date"]) &&
        matchesBudget(invite, filters.Budget) &&
        matchesSingle(invite.appliedStatus, filters["Applied Status"]) &&
        matchesDateOption(
          invite.respondByRaw || invite.invitedAtRaw,
          filters.Date
        ) &&
        matchesPlatforms(invite, filters.Platform)
      );
    });

    switch (sortValue) {
      case "Highest Budget":
        filtered.sort((a, b) => b.budgetMax - a.budgetMax);
        break;
      case "Highest Match Score":
        filtered.sort((a, b) => b.matchScore - a.matchScore);
        break;
      case "Response Deadline":
        filtered.sort((a, b) => {
          const aTime =
            parseDate(a.respondByRaw)?.getTime() ?? Number.POSITIVE_INFINITY;
          const bTime =
            parseDate(b.respondByRaw)?.getTime() ?? Number.POSITIVE_INFINITY;

          return aTime - bTime;
        });
        break;
      case "Highest Brand Rating":
        filtered.sort((a, b) => b.brandRating - a.brandRating);
        break;
      case "Newest Invitation":
      default:
        filtered.sort((a, b) => {
          const aTime = parseDate(a.invitedAtRaw)?.getTime() ?? 0;
          const bTime = parseDate(b.invitedAtRaw)?.getTime() ?? 0;

          return bTime - aTime;
        });
        break;
    }

    return filtered;
  }, [invites, debouncedSearch, filters, sortValue]);

  const selectedInvite = useMemo(() => {
    if (!filteredInvites.length) return null;

    return (
      filteredInvites.find((invite) => invite.id === selectedInviteId) ||
      filteredInvites[0]
    );
  }, [filteredInvites, selectedInviteId]);

  useEffect(() => {
    if (!filteredInvites.length) {
      setSelectedInviteId("");
      return;
    }

    if (!selectedInviteId) {
      setSelectedInviteId(filteredInvites[0].id);
      return;
    }

    const stillExists = filteredInvites.some(
      (invite) => invite.id === selectedInviteId
    );

    if (!stillExists) {
      setSelectedInviteId(filteredInvites[0].id);
    }
  }, [filteredInvites, selectedInviteId]);

  const openCampaign = (invite: CampaignInvite) => {
    setSelectedInviteId(invite.id);
  };

  const markAccepted = (inviteId?: string) => {
    if (!inviteId) return;

    const now = new Date().toISOString();

    setInvites((prev) =>
      prev.map((invite) =>
        invite.id === inviteId
          ? {
              ...invite,
              status: "accepted",
              appliedStatus: "Accepted",
              acceptedAtRaw: now,
            }
          : invite
      )
    );
  };

  const getCardProps = (
    invite: CampaignInvite
  ): InfluencerDiscoverCardProps => ({
    title: invite.title,
    description: invite.description,
    imageUrl: invite.image,
    imageUrls: invite.images,
    brandName: invite.brandName,
    brandLogoUrl: invite.brandLogo,
    campaignGoal: invite.campaignGoal,
    category: invite.category,
    ageLabel: invite.ageLabel,
    gender: invite.gender,
    countries: invite.countries,
    budget: invite.budgetMax || invite.budgetMin,
    viewedCount: invite.matchScore,
    applicantAvatars: [],
    onCardClick: () => openCampaign(invite),
    onSave: () => {
      // discard invitation API can be added here
    },
    onMore: () => openCampaign(invite),
    isInvitationCard: true,
    invitationStatus: invite.status,
    hasApplied: invite.status === "accepted",
    receivedDate: invite.invitedAtRaw,
    brandActiveText: "",
    className:
      selectedInvite?.id === invite.id
        ? "ring-1 ring-[#1A1A1A]/10"
        : undefined,
  });

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-white">
        <InvitationFilter
          filters={filters}
          setFilters={setFilters}
          search={search}
          setSearch={setSearch}
          sortValue={sortValue}
          setSortValue={setSortValue}
        />

        <main className="mx-auto max-w-full px-6 pb-0 pt-8">
          {loading ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,22.0625rem),22.0625rem))] justify-start gap-[1.5rem]">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[31.5rem] w-full max-w-[22.0625rem] animate-pulse rounded-[1.5rem] border border-[#E6E6E6] bg-[#F7F7F7]"
                />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-red-200 bg-red-50 px-6 py-16 text-center">
              <AlertCircle className="h-8 w-8 text-red-500" />

              <h2 className="mt-4 text-base font-semibold text-red-700">
                Unable to load invitations
              </h2>

              <p className="mt-1 max-w-md text-sm text-red-600/80">
                {error}
              </p>

              <button
                type="button"
                onClick={() => setRefreshKey((value) => value + 1)}
                className="mt-5 rounded-[0.75rem] bg-[#1A1A1A] px-4 py-2 text-sm font-semibold text-white"
              >
                Retry
              </button>
            </div>
          ) : filteredInvites.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-[#E6E6E6] bg-white px-6 py-16 text-center">
              <Search className="h-8 w-8 text-[#969696]" />

              <h2 className="mt-4 text-base font-semibold text-[#1A1A1A]">
                No invitations found
              </h2>

              <p className="mt-1 max-w-md text-sm text-[#969696]">
                Try changing the search, status, budget, date, or platform
                filters.
              </p>
            </div>
          ) : (
            <div className="flex h-[calc(100dvh-10rem)] min-h-[40rem] w-full items-stretch overflow-hidden">
              <section className="w-[22.0625rem] shrink-0 overflow-y-auto pr-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex flex-col gap-[1.5rem] pb-8">
                  {filteredInvites.map((invite) => (
                    <CampaignCard key={invite.id} {...getCardProps(invite)} />
                  ))}
                </div>
              </section>

              <div
                className={[
                  "flex w-[0.625rem] shrink-0 items-start justify-center",
                  "gap-[0.5rem] self-stretch",
                  "px-[0.0625rem] pb-[0.0625rem] pt-[2rem]",
                ].join(" ")}
              >
                <div className="h-full w-[0.25rem] rounded-[var(--Sizes-Border-Radius-Pill,6.25rem)] bg-[#E6E6E6]" />
              </div>

              <section className="min-w-0 flex-1 overflow-hidden">
                {selectedInvite?.campaignId ? (
                  <SidebarCampaign
                    campaignId={selectedInvite.campaignId}
                    invitationId={selectedInvite.id}
                    invitationStatus={selectedInvite.status}
                    invitationBrandLogo={selectedInvite.brandLogo}
                    invitationAppliedAt={
                      selectedInvite.acceptedAtRaw ||
                      selectedInvite.raw?.acceptedAt ||
                      selectedInvite.raw?.appliedAt ||
                      selectedInvite.raw?.respondedAt ||
                      selectedInvite.raw?.updatedAt ||
                      selectedInvite.invitedAtRaw
                    }
                    onInvitationAccepted={markAccepted}
                    embedded
                  />
                ) : (
                  <div className="flex h-full items-center justify-center rounded-[1.5rem] border border-[#E6E6E6] bg-white text-sm text-[#969696]">
                    Select an invitation to view campaign details.
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>
    </TooltipProvider>
  );
}