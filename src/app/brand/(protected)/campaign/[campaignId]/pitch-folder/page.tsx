"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowUpRight, Loader2, Search } from "lucide-react";
import { apiFetchCampaignPitchFolder } from "@/app/brand/services/brandApi";

type PitchFolderInfluencer = {
  _id?: string;
  name?: string;
  handle?: string;
  username?: string;
  email?: string;
  platform?: string;
  niche?: string | string[];
  country?: string;
  followers?: string | number;
  selectionReason?: string;
  shippingAddress?: string;
  rateCard?: string | number;
  rateCardCurrency?: string;
  goodFit?: boolean;
  fit?: string;
  campaignStatus?: string;
  profileUrl?: string;
  primaryLink?: string;
  url?: string;
};

type PitchFolderMeta = {
  title?: string;
  description?: string;
  brandVisibleItemCount?: number;
  showFullListToBrand?: boolean;
};

type PitchFolderPayload = {
  items: PitchFolderInfluencer[];
  meta: PitchFolderMeta;
  message: string;
};

function formatFollowers(value?: string | number) {
  if (value === undefined || value === null || value === "") return "—";

  const num = Number(value);

  if (Number.isNaN(num)) return String(value);
  if (num >= 1_000_000) return `${Number((num / 1_000_000).toFixed(1))}M`;
  if (num >= 1_000) return `${Number((num / 1_000).toFixed(1))}K`;

  return num.toString();
}

function displayValue(value?: string | number | string[] | null) {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (value === undefined || value === null || value === "") return "—";
  return value;
}

function normalizeRateCard(item: any) {
  const rate =
    item?.influencerRateCard ||
    item?.platformRateCard ||
    item?.rateCard ||
    item?.rate ||
    "";

  if (!rate) return "";

  const currency = item?.rateCardCurrency || "USD";
  return `${currency} ${rate}`;
}

function normalizePitchFolderInfluencer(item: any): PitchFolderInfluencer {
  return {
    _id: item?._id,
    name: item?.name || "",
    handle: item?.handle || item?.username || "",
    username: item?.username || item?.handle || "",
    email: item?.email || "",
    platform: item?.provider || item?.platform || "",
    niche: item?.niche || "",
    country: item?.country || "",
    followers: item?.followers || "",
    selectionReason: item?.selectionReason || "",
    shippingAddress: item?.shippingAddress || item?.comments || "",
    rateCard: normalizeRateCard(item),
    rateCardCurrency: item?.rateCardCurrency || "USD",
    goodFit: Boolean(item?.goodFit),
    fit: item?.goodFit ? "Good Fit" : "Not Marked",
    campaignStatus: item?.campaignActivation
      ? item?.campaignActivation?.status || "Active"
      : "Not Active",
    profileUrl: item?.primaryLink || item?.profileUrl || item?.url || "",
    primaryLink: item?.primaryLink || "",
    url: item?.primaryLink || item?.url || "",
  };
}

function extractPitchFolderPayload(response: any): PitchFolderPayload {
  const payload = response?.data ?? response;

  if (payload?.success === false) {
    return {
      items: [],
      meta: {},
      message:
        payload?.error ||
        payload?.message ||
        "No pitch folder found for this campaign",
    };
  }

  const pitchFolder =
    payload?.data?.items || payload?.data?._id
      ? payload.data
      : payload?.items || payload?._id
        ? payload
        : payload?.pitchFolder ||
          payload?.data?.pitchFolder ||
          payload?.result ||
          {};

  const rawItems = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.data?.items)
        ? payload.data.items
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.pitchFolder?.items)
            ? payload.pitchFolder.items
            : [];

  const items = rawItems.map((item: any) =>
    normalizePitchFolderInfluencer(item)
  );

  const meta: PitchFolderMeta = {
    title: pitchFolder?.title,
    description: pitchFolder?.description,
    brandVisibleItemCount: pitchFolder?.brandVisibleItemCount,
    showFullListToBrand: pitchFolder?.showFullListToBrand,
  };

  return {
    items,
    meta,
    message: items.length ? "" : "No pitch folder found for this campaign",
  };
}

export default function PitchFolderPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const campaignName = decodeURIComponent((params?.campaignId as string) || "");
  const campaignMongoId = searchParams.get("id");

  const [influencers, setInfluencers] = useState<PitchFolderInfluencer[]>([]);
  const [pitchFolderMeta, setPitchFolderMeta] = useState<PitchFolderMeta>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [emptyMessage, setEmptyMessage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!campaignMongoId) {
      setLoading(false);
      setError("Campaign id is missing");
      return;
    }

    let mounted = true;

    const loadPitchFolderInfluencers = async () => {
      try {
        setLoading(true);
        setError("");
        setEmptyMessage("");

        const response = await apiFetchCampaignPitchFolder(campaignMongoId);
        const { items, meta, message } = extractPitchFolderPayload(response);

        if (!mounted) return;

        setInfluencers(items);
        setPitchFolderMeta(meta);
        setEmptyMessage(message || "");
      } catch (err: any) {
        if (!mounted) return;

        const backendMessage =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.response?.data?.details ||
          err?.message ||
          "No pitch folder found for this campaign";

        setInfluencers([]);
        setPitchFolderMeta({});
        setError(backendMessage);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadPitchFolderInfluencers();

    return () => {
      mounted = false;
    };
  }, [campaignMongoId]);

  const filteredInfluencers = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return influencers;

    return influencers.filter((item) =>
      [
        item.name,
        item.handle,
        item.username,
        item.email,
        item.platform,
        Array.isArray(item.niche) ? item.niche.join(" ") : item.niche,
        item.country,
        item.followers,
        item.selectionReason,
        item.shippingAddress,
        item.rateCard,
        item.fit,
        item.campaignStatus,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [influencers, search]);

  const tableEmptyMessage =
    search.trim() && influencers.length > 0
      ? "No matching influencers found."
      : emptyMessage || "No pitch folder found for this campaign";

  const openProfile = (url?: string) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const COLUMNS = [
    "Influencer",
    "Platform",
    "Niche",
    "Country",
    "Followers",
    "Selection reason",
    "Shipping address",
    "Rate card",
    "Fit",
    "Status",
    "Profile",
  ];

  return (
    <div className="min-h-screen px-7 py-9 font-sans">
      <div className="">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
              {campaignName || "Campaign"}
            </p>

            <h1 className="text-2xl font-bold leading-tight tracking-[-0.02em] text-gray-900">
              {pitchFolderMeta.title || "Pitch Folder"}
            </h1>

            {pitchFolderMeta.description ? (
              <p className="mt-1 max-w-[500px] text-[13px] text-gray-500">
                {pitchFolderMeta.description}
              </p>
            ) : null}
          </div>

          <div className="flex gap-2">
            <StatCard label="Total" value={loading ? "—" : influencers.length} />
            <StatCard
              label="Visible"
              value={
                loading
                  ? "—"
                  : pitchFolderMeta.brandVisibleItemCount ??
                    filteredInfluencers.length
              }
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-[18px] py-[13px]">
            <div className="flex items-baseline gap-2.5">
              <span className="text-[13px] font-semibold text-gray-900">
                Influencers
              </span>
              <span className="text-xs text-gray-400">
                {filteredInfluencers.length} of {influencers.length}
              </span>
            </div>

            <div className="relative w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-[13px] w-[13px] -translate-y-1/2 text-gray-300" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="h-[34px] w-full rounded-lg border border-gray-200 bg-gray-100 pl-8 pr-3 text-[13px] text-gray-900 outline-none transition focus:border-gray-400 focus:ring-4 focus:ring-gray-200/70"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex h-80 items-center justify-center gap-2 text-[13px] text-gray-500">
              <Loader2 className="h-[15px] w-[15px] animate-spin" />
              Loading influencers…
            </div>
          ) : error ? (
            <div className="flex h-80 items-center justify-center p-6">
              <div className="max-w-[360px] text-center">
                <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-base text-red-500">
                  ×
                </div>
                <p className="mb-1 text-[13px] font-semibold text-red-600">
                  {error}
                </p>
                <p className="text-xs text-gray-500">
                  Check whether a pitch folder is assigned to this campaign.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    {COLUMNS.map((col) => (
                      <th
                        key={col}
                        className="whitespace-nowrap bg-[#FAFAFA] px-[18px] py-[9px] text-left text-[10px] font-semibold uppercase tracking-[0.09em] text-gray-400"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredInfluencers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={COLUMNS.length}
                        className="h-[260px] text-center"
                      >
                        <p className="mb-1 text-[13px] font-semibold text-gray-700">
                          {tableEmptyMessage}
                        </p>
                        <p className="text-xs text-gray-400">
                          Assigned influencers will appear here.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredInfluencers.map((item, index) => {
                      const profileUrl =
                        item.profileUrl || item.primaryLink || item.url;

                      return (
                        <tr
                          key={item._id || index}
                          className="border-b border-gray-100 transition hover:bg-gray-50"
                        >
                          <td className="px-[18px] py-[13px] align-top">
                            <div className="max-w-[220px]">
                              <p className="mb-0.5 text-[13px] font-semibold leading-snug text-gray-900">
                                {displayValue(item.name)}
                              </p>
                              <p className="mb-px text-xs text-gray-500">
                                {displayValue(item.handle || item.username)}
                              </p>
                              <p className="max-w-[200px] truncate text-[11px] text-gray-300">
                                {displayValue(item.email)}
                              </p>
                            </div>
                          </td>

                          <td className="px-[18px] py-[13px] align-middle">
                            <PlatformBadge platform={item.platform} />
                          </td>

                          <td className="max-w-[170px] px-[18px] py-[13px] align-top text-gray-700">
                            <div className="max-w-[170px] truncate">
                              {displayValue(item.niche)}
                            </div>
                          </td>

                          <td className="px-[18px] py-[13px] align-top">
                            <span className="whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-700">
                              {displayValue(item.country)}
                            </span>
                          </td>

                          <td className="px-[18px] py-[13px] align-top font-semibold tracking-[-0.01em] text-gray-900">
                            {formatFollowers(item.followers)}
                          </td>

                          <td className="max-w-[180px] px-[18px] py-[13px] align-top text-gray-700">
                            <div className="line-clamp-2">
                              {displayValue(item.selectionReason)}
                            </div>
                          </td>

                          <td className="max-w-[200px] px-[18px] py-[13px] align-top text-gray-500">
                            <div className="line-clamp-3 text-xs leading-relaxed">
                              {displayValue(item.shippingAddress)}
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-[18px] py-[13px] align-top text-gray-700">
                            {displayValue(item.rateCard)}
                          </td>

                          <td className="px-[18px] py-[13px] align-top">
                            <FitBadge goodFit={item.goodFit} />
                          </td>

                          <td className="px-[18px] py-[13px] align-top">
                            <StatusBadge status={item.campaignStatus} />
                          </td>

                          <td className="px-[18px] py-[13px] align-top">
                            {profileUrl ? (
                              <button
                                onClick={() => openProfile(profileUrl)}
                                className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-gray-200 bg-transparent px-2.5 py-1.5 text-xs font-medium text-gray-900 transition hover:border-gray-900 hover:bg-gray-900 hover:text-white"
                              >
                                Open
                                <ArrowUpRight className="h-3 w-3" />
                              </button>
                            ) : (
                              <span className="text-[13px] text-gray-300">
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && !error && influencers.length > 0 ? (
          <p className="mt-3.5 text-center text-[11px] text-gray-300">
            {filteredInfluencers.length} influencer
            {filteredInfluencers.length !== 1 ? "s" : ""} · scroll right to see
            all columns
          </p>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-[90px] rounded-[10px] border border-gray-200 bg-white px-5 py-3 text-center">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400">
        {label}
      </p>
      <p className="text-[22px] font-bold tracking-[-0.03em] text-gray-900">
        {value}
      </p>
    </div>
  );
}

function PlatformBadge({ platform }: { platform?: string }) {
  if (!platform) return <span className="text-gray-300">—</span>;

  const p = platform.toLowerCase();
  const isYT = p.includes("youtube");
  const isIG = p.includes("instagram");
  const isTT = p.includes("tiktok");

  const label = isYT
    ? "YouTube"
    : isIG
      ? "Instagram"
      : isTT
        ? "TikTok"
        : platform;

  if (isYT) {
    return (
      <span className="inline-flex whitespace-nowrap rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-900">
        {label}
      </span>
    );
  }

  if (isIG) {
    return (
      <span className="inline-flex whitespace-nowrap rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-900">
        {label}
      </span>
    );
  }

  if (isTT) {
    return (
      <span className="inline-flex whitespace-nowrap rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-900">
        {label}
      </span>
    );
  }

  return (
    <span className="inline-flex whitespace-nowrap rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-700">
      {label}
    </span>
  );
}

function FitBadge({ goodFit }: { goodFit?: boolean }) {
  if (goodFit) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-900">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
        Good fit
      </span>
    );
  }

  return (
    <span className="whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-400">
      Not marked
    </span>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const s = (status || "").toLowerCase();
  const isActive = s === "active";
  const isNotActive = s === "not active" || s === "";

  if (isActive) {
    return (
      <span className="inline-block whitespace-nowrap rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-medium text-green-900">
        {displayValue(status)}
      </span>
    );
  }

  if (isNotActive) {
    return (
      <span className="inline-block whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-400">
        {displayValue(status)}
      </span>
    );
  }

  return (
    <span className="inline-block whitespace-nowrap rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-1 text-[11px] font-medium text-yellow-900">
      {displayValue(status)}
    </span>
  );
}