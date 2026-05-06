"use client";

import * as React from "react";
import {
  CaretDownIcon,
  DotsThreeIcon,
  FunnelSimpleIcon,
  MagnifyingGlassIcon,
  PaperPlaneTiltIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
  XIcon,
} from "@phosphor-icons/react";
import api from "@/lib/api";

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

const GOOD_FIT_FOLDER_LIST_ENDPOINT =
  "/pitch-folders/folder/list?type=fully_managed&hasGoodFit=true";

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

function displayText(value?: string | number | null) {
  const text = String(value ?? "").trim();
  return text || "—";
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

  const name = displayText(item.name);
  const handle = normalizeHandle(item.handle);
  const cleanUsername = handle !== "—" ? handle.replace("@", "") : "username";

  return {
    id: String(item._id || `${item.handle || item.name || "good-fit"}-${index}`),
    profile: name === "—" ? "Label" : name,
    username: cleanUsername,
    handle,
    status: getStatus(item),
    category: displayCategory(item.niche),
    folder: getFoldersText(relatedFolders, firstFolder?.title),
    campaignName: getCampaignName(firstCampaign || item.folder?.assignedCampaign),
    workspace: getWorkspace(item, relatedCampaigns),
    country: displayText(item.country),
    language: displayText(item.provider),
    invitationDate: formatDate(firstCampaign?.assignedAt || item.folder?.assignedCampaign?.assignedAt),
    profileUrl: String(item.primaryLink || item.links?.[0] || "").trim(),
    relatedCampaigns,
    relatedFolders,
    raw: item,
  };
}

function extractGoodFitFolderList(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data?.groups?.fullyManagedCampaigns)) {
    return payload.data.groups.fullyManagedCampaigns;
  }
  if (Array.isArray(payload?.data?.folders)) return payload.data.folders;
  if (Array.isArray(payload?.data?.data?.groups?.fullyManagedCampaigns)) {
    return payload.data.data.groups.fullyManagedCampaigns;
  }
  if (Array.isArray(payload?.data?.data?.folders)) return payload.data.data.folders;
  if (Array.isArray(payload?.folders)) return payload.folders;

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
  const campaign = getFolderAssignedCampaign(folder);
  if (!campaign) return null;

  const id = String(
    getIdString(campaign?.campaignId) ||
      campaign?.campaignsId ||
      ""
  ).trim();

  if (!id) return null;

  const label = String(
    campaign?.campaignTitle ||
      campaign?.productOrServiceName ||
      campaign?.campaignsId ||
      folder?.title ||
      folder?.name ||
      id
  ).trim();

  return {
    id,
    label: label || id,
  };
}

function buildCampaignOptionsFromGoodFitFolders(folders: any[]): CampaignOption[] {
  const map = new Map<string, CampaignOption>();

  folders.forEach((folder) => {
    const goodFitCount = Number(folder?.goodFitCount || 0);
    if (goodFitCount <= 0) return;

    const option = mapFolderToCampaignOption(folder);
    if (!option || map.has(option.id)) return;

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
  const [activeTab, setActiveTab] = React.useState<"hub" | "goodFit">("hub");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState("");
  const [rows, setRows] = React.useState<InfluencerRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [campaignOptions, setCampaignOptions] = React.useState<CampaignOption[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = React.useState("all");

  React.useEffect(() => {
    let mounted = true;

    async function loadCampaigns() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get<CampaignListResponse>(
          GOOD_FIT_FOLDER_LIST_ENDPOINT
        );

        const folders = extractGoodFitFolderList(response.data);
        const options = buildCampaignOptionsFromGoodFitFolders(folders);

        if (!mounted) return;

        setCampaignOptions(options);
        setSelectedCampaignId("all");
        setSelectedIds([]);

        if (!options.length) {
          setRows([]);
          setError("No fully managed campaign folders with good fit influencers found.");
        }
      } catch (err: any) {
        if (!mounted) return;

        setError(
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            "Failed to load campaign folders."
        );

        setRows([]);
        setCampaignOptions([]);
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
  }, []);

  React.useEffect(() => {
    let mounted = true;

    async function loadGoodFitInfluencersByCampaign() {
      if (!selectedCampaignId) {
        setRows([]);
        return;
      }

      if (selectedCampaignId === "all" && !campaignOptions.length) {
        setRows([]);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const selectedCampaignIds =
          selectedCampaignId === "all"
            ? campaignOptions.map((campaign) => campaign.id)
            : [selectedCampaignId];

        const responses = await Promise.all(
          selectedCampaignIds.map((campaignId) =>
            api
              .get<GoodFitApiResponse>(
                `/pitch-folders/campaign/${encodeURIComponent(campaignId)}/good-fit`
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

        const items = mergeGoodFitItems(allItems);

        if (!mounted) return;

        setRows(items.map(mapGoodFitItem));
        setSelectedIds([]);
      } catch (err: any) {
        if (!mounted) return;

        setError(
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            "Failed to load good fit influencers."
        );

        setRows([]);
        setSelectedIds([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadGoodFitInfluencersByCampaign();

    return () => {
      mounted = false;
    };
  }, [selectedCampaignId, campaignOptions]);

  const filteredRows = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return rows;

    return rows.filter((row) => {
      return (
        row.profile.toLowerCase().includes(q) ||
        row.username.toLowerCase().includes(q) ||
        row.handle.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q) ||
        row.folder.toLowerCase().includes(q) ||
        row.campaignName.toLowerCase().includes(q) ||
        row.workspace.toLowerCase().includes(q) ||
        row.country.toLowerCase().includes(q) ||
        row.language.toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

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
            onClick={() => setActiveTab("hub")}
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
            onClick={() => setActiveTab("goodFit")}
            className={`relative h-full pt-5 text-[12px] font-medium ${
              activeTab === "goodFit" ? "text-black" : "text-[#A0A0A0]"
            }`}
          >
            Good Fit Influencers
            {activeTab === "goodFit" ? (
              <span className="absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-black" />
            ) : null}
          </button>
        </div>
      </div>

      <main className="px-8 py-8 pb-20">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-5">
            <FilterSelect
              label="Folder"
              value={selectedCampaignId}
              onChange={setSelectedCampaignId}
            >
              <option value="all">All</option>

              {campaignOptions.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.label}
                </option>
              ))}
            </FilterSelect>

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
                setSelectedCampaignId("all");
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

            <button
              type="button"
              className="inline-flex h-9 min-w-[110px] items-center justify-between rounded-md border border-[#DCDCDC] bg-white px-3 text-sm text-[#111111] hover:bg-[#F7F7F7]"
            >
              <span className="inline-flex items-center gap-2">
                <FunnelSimpleIcon size={16} weight="regular" />
                Filters
              </span>
              <CaretDownIcon size={12} weight="bold" />
            </button>

            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-[#171717] px-4 text-[12px] font-medium text-white shadow-sm hover:bg-black"
            >
              <PlusIcon size={16} weight="bold" />
              Create
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-[#DCDCDC] bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-[1040px] w-full border-collapse text-left text-[12px]">
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

                  <th className="w-[145px] border-r border-[#E5E5E5] px-4">
                    Profile
                  </th>

                  <th className="w-[135px] border-r border-[#E5E5E5] px-4">
                    Handle
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

                  <th className="w-[125px] border-r border-[#E5E5E5] px-4">
                    —
                  </th>

                  <th className="w-14 px-4">—</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={12} className="h-40 text-center text-sm text-[#666666]">
                      Loading influencers...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={12} className="h-40 text-center text-sm text-red-600">
                      {error}
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="h-40 text-center text-sm text-[#666666]">
                      No influencers found.
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
                                className="block max-w-[115px] truncate text-[10px] leading-3 text-[#A3A3A3]"
                                title={row.username}
                              >
                                @{row.username}
                              </span>
                            </button>
                          </div>
                        </td>

                        <td className="border-r border-[#E5E5E5] px-4 text-[#242424]">
                          <button
                            type="button"
                            onClick={() => openProfile(row.profileUrl)}
                            disabled={!row.profileUrl}
                            className="block max-w-[120px] truncate text-left hover:underline disabled:cursor-default disabled:no-underline"
                            title={row.profileUrl || row.handle}
                          >
                            {row.handle}
                          </button>
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

                        <td className="border-r border-[#E5E5E5] px-4">
                          <button
                            type="button"
                            className="inline-flex h-7 items-center rounded-md bg-[#171717] px-3 text-[11px] font-medium text-white hover:bg-black"
                          >
                            Send Invitation
                          </button>
                        </td>

                        <td className="px-4">
                          <button
                            type="button"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#DDDDDD] bg-white text-[#333333] hover:bg-[#F7F7F7]"
                          >
                            <DotsThreeIcon size={18} weight="bold" />
                          </button>
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