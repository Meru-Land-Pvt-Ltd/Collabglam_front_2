"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, Loader2, Search } from "lucide-react";
import {
  InfluencerTable,
  type InfluencerRow,
  type PlatformType,
} from "@/components/ui/brand/Influencertable";
import { apiFetchCampaignPitchFolder } from "@/app/brand/services/brandApi";

type PitchFolderInfluencer = {
  _id?: string;
  influencerId?: string;
  creatorId?: string;
  name?: string;
  handle?: string;
  username?: string;
  email?: string;
  provider?: string;
  platform?: string;
  niche?: string | string[];
  country?: string;
  followers?: string | number;
  selectionReason?: string;
  shippingAddress?: string;
  comments?: string;
  influencerRateCard?: string | number;
  platformRateCard?: string | number;
  rateCard?: string | number;
  rate?: string | number;
  rateCardCurrency?: string;
  goodFit?: boolean;
  campaignActivation?: {
    status?: string;
  };
  profileUrl?: string;
  primaryLink?: string;
  url?: string;
  picture?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
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

type PitchSheetRow = InfluencerRow & {
  __raw?: PitchFolderInfluencer;
  __profileUrl?: string;
  __goodFit?: boolean;
};

function displayValue(value?: string | number | string[] | null) {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

function toHandle(value?: string) {
  const text = String(value || "").trim();
  if (!text) return "—";
  return text.startsWith("@") ? text : `@${text}`;
}

function parseNumber(value?: string | number) {
  if (value === undefined || value === null || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const raw = String(value).trim().toUpperCase().replace(/,/g, "");
  const num = Number(raw.replace(/[KM]/g, ""));

  if (!Number.isFinite(num)) return 0;
  if (raw.endsWith("M")) return num * 1_000_000;
  if (raw.endsWith("K")) return num * 1_000;

  return num;
}

function normalizePlatform(value?: string): PlatformType | null {
  const platform = String(value || "").trim().toLowerCase();

  if (platform.includes("instagram")) return "instagram";
  if (platform.includes("youtube")) return "youtube";
  if (platform.includes("tiktok") || platform.includes("tik tok")) {
    return "tiktok";
  }

  return null;
}

function normalizeRateCard(item: PitchFolderInfluencer) {
  const rate =
    item.influencerRateCard ||
    item.platformRateCard ||
    item.rateCard ||
    item.rate ||
    "";

  if (!rate) return "—";

  const currency = item.rateCardCurrency || "USD";

  return `${currency} ${rate}`;
}

function getPitchFolderItems(response: any): PitchFolderPayload {
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

  return {
    items: rawItems,
    meta: {
      title: pitchFolder?.title,
      description: pitchFolder?.description,
      brandVisibleItemCount: pitchFolder?.brandVisibleItemCount,
      showFullListToBrand: pitchFolder?.showFullListToBrand,
    },
    message: rawItems.length ? "" : "No pitch folder found for this campaign",
  };
}

function mapPitchFolderItemToRow(
  item: PitchFolderInfluencer,
  index: number
): PitchSheetRow {
  const platform = normalizePlatform(item.provider || item.platform);
  const followers = parseNumber(item.followers);
  const niche = displayValue(item.niche);
  const profileUrl = item.primaryLink || item.profileUrl || item.url || "";

  return {
    id:
      String(item.influencerId || item.creatorId || item._id || "").trim() ||
      `pitch-sheet-${index}`,
    profile: {
      name: String(item.name || "Influencer"),
      handle: toHandle(item.handle || item.username),
      avatarUrl: item.picture || item.avatarUrl,
    },
    category: niche,
    platforms: platform
      ? [
          {
            platform,
            followers,
          },
        ]
      : [],
    followers,
    appliedDate: item.createdAt || item.updatedAt || "—",
    status: item.goodFit ? "Good Fit" : "Not Marked",
    budget: normalizeRateCard(item),
    __raw: item,
    __profileUrl: profileUrl,
    __goodFit: Boolean(item.goodFit),
  };
}

export default function PitchSheetPage() {
  const searchParams = useSearchParams();

  const campaignId =
    searchParams.get("campaignId") || searchParams.get("id") || "";

  const [rows, setRows] = useState<PitchSheetRow[]>([]);
  const [meta, setMeta] = useState<PitchFolderMeta>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [emptyMessage, setEmptyMessage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!campaignId) {
      setLoading(false);
      setError("Campaign id is missing");
      return;
    }

    let mounted = true;

    const loadPitchSheet = async () => {
      try {
        setLoading(true);
        setError("");
        setEmptyMessage("");

        const response = await apiFetchCampaignPitchFolder(campaignId);
        const payload = getPitchFolderItems(response);

        if (!mounted) return;

        setRows(payload.items.map(mapPitchFolderItemToRow));
        setMeta(payload.meta);
        setEmptyMessage(payload.message || "");
      } catch (err: any) {
        if (!mounted) return;

        const backendMessage =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.response?.data?.details ||
          err?.message ||
          "No pitch folder found for this campaign";

        setRows([]);
        setMeta({});
        setError(backendMessage);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadPitchSheet();

    return () => {
      mounted = false;
    };
  }, [campaignId]);

  const filteredRows = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return rows;

    return rows.filter((row) => {
      const raw = row.__raw || {};

      return [
        row.profile.name,
        row.profile.handle,
        row.category,
        row.status,
        row.budget,
        raw.email,
        raw.country,
        raw.selectionReason,
        raw.shippingAddress,
        raw.comments,
        raw.provider,
        raw.platform,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [rows, search]);

  const openProfile = (url?: string) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const tableEmptyMessage =
    search.trim() && rows.length > 0
      ? "No matching influencers found."
      : emptyMessage || "No pitch folder found for this campaign";

  return (
    <div className="mt-[3.5rem] px-[2rem] pb-[2.5rem]">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
            Pitch Sheet
          </p>

          <h1 className="text-2xl font-bold leading-tight tracking-[-0.02em] text-gray-900">
            {meta.title || "Pitch Sheet"}
          </h1>

          {meta.description ? (
            <p className="mt-1 max-w-[500px] text-[13px] text-gray-500">
              {meta.description}
            </p>
          ) : null}
        </div>

        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-[13px] w-[13px] -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pitch sheet..."
            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-[13px] text-gray-900 outline-none transition focus:border-gray-400 focus:ring-4 focus:ring-gray-200/70"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-[0.75rem] bg-white">
        {loading ? (
          <div className="flex h-64 items-center justify-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading pitch sheet influencers...
          </div>
        ) : error ? (
          <div className="flex h-64 items-center justify-center p-6">
            <div className="max-w-[360px] text-center">
              <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-base text-red-500">
                ×
              </div>
              <p className="mb-1 text-sm font-semibold text-red-600">
                {error}
              </p>
              <p className="text-xs text-gray-500">
                Check whether a pitch folder is assigned to this campaign.
              </p>
            </div>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex h-64 items-center justify-center p-6">
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-800">
                {tableEmptyMessage}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Assigned pitch sheet influencers will appear here.
              </p>
            </div>
          </div>
        ) : (
          <InfluencerTable
            rows={filteredRows}
            variant="default"
            renderDefaultActions={(row) => {
              const currentRow = row as PitchSheetRow;
              const profileUrl = currentRow.__profileUrl;

              return profileUrl ? (
                <button
                  type="button"
                  onClick={() => openProfile(profileUrl)}
                  className="inline-flex h-8 items-center justify-center gap-1 rounded-[0.5rem] border border-[#E6E6E6] bg-white px-3 text-[12px] font-medium text-[#1A1A1A] hover:bg-[#F7F7F7]"
                >
                  Open
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <span className="text-xs text-gray-400">No profile</span>
              );
            }}
          />
        )}
      </div>

      {!loading && !error && filteredRows.length > 0 ? (
        <p className="mt-3.5 text-center text-[11px] text-gray-400">
          {filteredRows.length} influencer
          {filteredRows.length !== 1 ? "s" : ""} in pitch sheet
        </p>
      ) : null}
    </div>
  );
}