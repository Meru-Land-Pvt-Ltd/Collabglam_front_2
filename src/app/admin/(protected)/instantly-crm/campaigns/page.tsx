"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminDelete,
  adminGet,
  adminGetBlob,
  adminPatch,
  adminPost,
  getApiErrorMessage,
} from "@/lib/api";
import {
  ArrowUpDown,
  ChevronDown,
  CircleAlert,
  Copy,
  Download,
  Filter,
  MoreHorizontal,
  Pause,
  PencilLine,
  Play,
  Plus,
  Search,
  Share2,
  Trash2,
} from "lucide-react";

type CampaignFlowType = "standard_brand" | "ime_influencer";
type CampaignUiStatus =
  | "draft"
  | "ready"
  | "launched"
  | "paused"
  | "completed"
  | "error";

type AdminMe = {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
};

type AdminOption = {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
};

type CampaignScheduleWindow = {
  name?: string;
  from?: string;
  to?: string;
};

type CampaignSequenceStep = {
  stepOrder?: number;
  delay?: number;
  delayUnit?: string;
};

type CampaignRow = {
  _id: string;
  name: string;
  flowType: CampaignFlowType;
  status: CampaignUiStatus;
  sdrId:
  | string
  | {
    _id: string;
    name?: string;
    email?: string;
  }
  | null;
  RHId:
  | string
  | {
    _id: string;
    name?: string;
    email?: string;
  }
  | null;
  IMEId:
  | string
  | {
    _id: string;
    name?: string;
    email?: string;
  }
  | null;
  instantly?: {
    senderAccountEmail?: string;
    accountEmails?: string[];
    campaignId?: string;
    leadListId?: string;
    shareLink?: string;
  };
  teamMailboxes?: {
    RHEmail?: string;
    IMEEmail?: string;
  };
  configuration?: {
    schedule?: {
      timezone?: string;
      startDate?: string;
      endDate?: string;
      windows?: CampaignScheduleWindow[];
    };
    sequences?: CampaignSequenceStep[];
    lastSyncedAt?: string;
  };
  stats?: {
    totalProspects?: number;
    totalSent?: number;
    totalClicked?: number;
    totalReplies?: number;
    totalOpportunities?: number;
    totalQualified?: number;
    totalAssigned?: number;
    progressPercent?: number;
  };
  sync?: {
    providerStatus?: "idle" | "syncing" | "synced" | "error";
    lastErrorCode?: string;
    lastErrorMessage?: string;
    lastSyncedAt?: string;
    lastAnalyticsSyncedAt?: string;
  };
  createdAt?: string;
  launchedAt?: string;
};

type ApiState = {
  type: "success" | "error" | "info";
  text: string;
} | null;

type CreateForm = {
  name: string;
  flowType: CampaignFlowType;
  sdrId: string;
  imeId: string;
};

type SortOption = "newest" | "oldest" | "name_asc" | "name_desc";
type StatusFilter = "all" | CampaignUiStatus;

type OpenMenuState = {
  row: CampaignRow;
  top: number;
  left: number;
};

const OUTREACH_CAMPAIGNS_BASE = "/outreach/campaigns";
const CAMPAIGN_DETAIL_BASE = "/admin/instantly-crm/campaigns";

const STATUS_OPTIONS: Array<{ label: string; value: StatusFilter }> = [
  { label: "All statuses", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Ready", value: "ready" },
  { label: "Launched", value: "launched" },
  { label: "Paused", value: "paused" },
  { label: "Completed", value: "completed" },
  { label: "Error", value: "error" },
];

const SORT_OPTIONS: Array<{ label: string; value: SortOption }> = [
  { label: "Newest first", value: "newest" },
  { label: "Oldest first", value: "oldest" },
  { label: "Name A-Z", value: "name_asc" },
  { label: "Name Z-A", value: "name_desc" },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalizeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clampProgress(value: number) {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function parseCampaignRows(payload: any): CampaignRow[] {
  const rows = Array.isArray(payload?.data) ? payload.data : [];

  return rows.map((item: any) => ({
    _id: String(item?._id || ""),
    name: item?.name || "",
    flowType: item?.flowType === "ime_influencer" ? "ime_influencer" : "standard_brand",
    status: item?.status === "error" ? "error" : item?.status || "draft",
    sdrId: item?.sdrId || null,
    RHId: item?.RHId || null,
    IMEId: item?.IMEId || null,
    instantly: item?.instantly || {},
    teamMailboxes: item?.teamMailboxes || {},
    configuration: item?.configuration || {},
    stats: item?.stats || {},
    sync: item?.sync || {},
    createdAt: item?.createdAt || "",
    launchedAt: item?.launchedAt || "",
  }));
}

function parseAdminRows(payload: any): AdminOption[] {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];

  return rows
    .filter(Boolean)
    .map((item: any) => ({
      _id: String(item?._id || ""),
      name: item?.name || "",
      email: item?.email || "",
      role: item?.role || "",
    }))
    .filter((item: AdminOption) => item._id);
}

function getUiStatus(row: CampaignRow): CampaignUiStatus {
  if (row.status === "error") return "error";
  if (row.sync?.providerStatus === "error") return "error";
  if (row.sync?.lastErrorMessage) return "error";
  return row.status || "draft";
}

function getStatusPillClasses(status: CampaignUiStatus) {
  if (status === "ready") return "border-sky-200 bg-sky-50 text-sky-700";
  if (status === "launched") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "paused") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "completed") return "border-violet-200 bg-violet-50 text-violet-700";
  if (status === "error") return "border-red-200 bg-red-500 text-white";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getDateValue(value?: string) {
  const date = new Date(value || "");
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getProgress(row: CampaignRow) {
  const explicit = normalizeNumber(row.stats?.progressPercent);
  if (explicit > 0) return clampProgress(explicit);

  const totalProspects = normalizeNumber(row.stats?.totalProspects);
  const totalSent = normalizeNumber(row.stats?.totalSent);

  if (!totalProspects) return 0;
  return clampProgress(Math.round((totalSent / totalProspects) * 100));
}

function labelForAdmin(admin: AdminOption) {
  if (admin.name && admin.email) return `${admin.name} (${admin.email})`;
  return admin.name || admin.email || admin._id;
}

function buildCampaignApiUrl(id: string, suffix = "") {
  return `${OUTREACH_CAMPAIGNS_BASE}/${id}${suffix}`;
}

function buildCampaignDetailUrl(id: string) {
  return `${CAMPAIGN_DETAIL_BASE}/${id}`;
}

function downloadBrowserBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function ActionMenu({
  busy,
  onRename,
  onDelete,
  onDuplicate,
  onDownload,
  onShare,
}: {
  busy: boolean;
  onRename: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onDownload: () => void;
  onShare: () => void;
}) {
  return (
    <div className="w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-2xl">
      <button
        type="button"
        disabled={busy}
        onClick={onRename}
        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
      >
        <PencilLine className="h-4 w-4 text-slate-400" />
        Rename
      </button>

      <button
        type="button"
        disabled={busy}
        onClick={onDelete}
        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4 text-slate-400" />
        Delete
      </button>

      <button
        type="button"
        disabled={busy}
        onClick={onDuplicate}
        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
      >
        <Copy className="h-4 w-4 text-slate-400" />
        Duplicate campaign
      </button>

      <button
        type="button"
        disabled={busy}
        onClick={onDownload}
        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
      >
        <Download className="h-4 w-4 text-slate-400" />
        Download analytics CSV
      </button>

      <button
        type="button"
        disabled={busy}
        onClick={onShare}
        className="flex w-full items-center gap-3 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
      >
        <Share2 className="h-4 w-4 text-slate-400" />
        Share Campaign
      </button>
    </div>
  );
}

export default function InstantlyCampaignsPage() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<ApiState>(null);
  const [me, setMe] = useState<AdminMe | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [sdrOptions, setSdrOptions] = useState<AdminOption[]>([]);
  const [imeOptions, setImeOptions] = useState<AdminOption[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenu, setOpenMenu] = useState<OpenMenuState | null>(null);
  const [busyActionId, setBusyActionId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreateForm>({
    name: "",
    flowType: "standard_brand",
    sdrId: "",
    imeId: "",
  });

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameCampaign, setRenameCampaign] = useState<CampaignRow | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteCampaign, setDeleteCampaign] = useState<CampaignRow | null>(null);

  const canCreate = useMemo(() => {
    return me?.role === "sdr" || me?.role === "ime" || me?.role === "super_admin";
  }, [me]);

  const fixedFlowType = useMemo<CampaignFlowType>(() => {
    if (me?.role === "ime") return "ime_influencer";
    return "standard_brand";
  }, [me]);

  async function showApiError(error: unknown, fallback: string) {
    setMessage({
      type: "error",
      text: await getApiErrorMessage(error, fallback),
    });
  }

  async function loadPage(showLoader = true) {
    try {
      if (showLoader) setLoading(true);
      setMessage(null);

      const mePayload: any = await adminGet("/admins/me");
      const meData: AdminMe = {
        _id: String(mePayload?._id || ""),
        name: mePayload?.name || "",
        email: mePayload?.email || "",
        role: mePayload?.role || "",
      };
      setMe(meData);

      const requests: Promise<any>[] = [adminGet(OUTREACH_CAMPAIGNS_BASE)];

      if (meData.role === "super_admin") {
        requests.push(adminGet("/admins/get-executive-list", { role: "sdr" }));
        requests.push(adminGet("/admins/get-executive-list", { role: "ime" }));
      }

      const results = await Promise.all(requests);
      const campaignPayload = results[0];
      const sdrPayload = results[1];
      const imePayload = results[2];

      setCampaigns(parseCampaignRows(campaignPayload));

      if (meData.role === "super_admin") {
        setSdrOptions(parseAdminRows(sdrPayload));
        setImeOptions(parseAdminRows(imePayload));
      } else {
        setSdrOptions([]);
        setImeOptions([]);
      }

      setCreateForm((prev) => ({
        ...prev,
        flowType:
          meData.role === "ime"
            ? "ime_influencer"
            : meData.role === "sdr"
              ? "standard_brand"
              : prev.flowType,
        sdrId: meData.role === "sdr" ? meData._id : prev.sdrId,
        imeId: meData.role === "ime" ? meData._id : prev.imeId,
      }));
    } catch (error) {
      await showApiError(error, "Failed to load campaigns");
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  useEffect(() => {
    loadPage(true);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!openMenu) return;
      const target = event.target as Node;
      if (menuRef.current && menuRef.current.contains(target)) return;
      setOpenMenu(null);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
        setCreateOpen(false);
        setRenameOpen(false);
        setDeleteOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [openMenu]);

  async function handleCreateCampaign() {
    try {
      if (!createForm.name.trim()) {
        throw new Error("Campaign name is required");
      }

      const flowType =
        me?.role === "super_admin"
          ? createForm.flowType
          : me?.role === "ime"
            ? "ime_influencer"
            : "standard_brand";

      if (me?.role === "super_admin" && flowType === "standard_brand" && !createForm.sdrId) {
        throw new Error("Select an SDR owner");
      }

      if (me?.role === "super_admin" && flowType === "ime_influencer" && !createForm.imeId) {
        throw new Error("Select an IME owner");
      }

      setCreateLoading(true);
      setMessage(null);

      const payload: Record<string, any> = {
        name: createForm.name.trim(),
        flowType,
      };

      if (flowType === "standard_brand") {
        if (me?.role === "super_admin") {
          payload.sdrId = createForm.sdrId;
        }
      } else if (me?.role === "super_admin") {
        payload.imeId = createForm.imeId;
      }

      const response: any = await adminPost(OUTREACH_CAMPAIGNS_BASE, payload);

      if (response?.success === false) {
        throw new Error(response?.message || "Failed to create campaign");
      }

      const campaignId = response?.data?._id;
      if (!campaignId) {
        throw new Error("Campaign created but id is missing");
      }

      setCreateOpen(false);
      setRenameOpen(false);
      setCreateForm({
        name: "",
        flowType: me?.role === "ime" ? "ime_influencer" : "standard_brand",
        sdrId: me?.role === "sdr" ? me._id || "" : "",
        imeId: me?.role === "ime" ? me._id || "" : "",
      });

      router.push(buildCampaignDetailUrl(campaignId));
    } catch (error) {
      await showApiError(error, "Failed to create campaign");
    } finally {
      setCreateLoading(false);
    }
  }

  function openRenameCampaign(row: CampaignRow) {
    setRenameCampaign(row);
    setRenameValue(row.name || "");
    setRenameOpen(true);
    setOpenMenu(null);
  }

  async function handleRenameCampaign() {
    if (!renameCampaign) return;

    const nextName = renameValue.trim();
    if (!nextName || nextName === renameCampaign.name) {
      setRenameOpen(false);
      setRenameCampaign(null);
      setRenameValue("");
      return;
    }

    try {
      setRenameLoading(true);
      setBusyActionId(renameCampaign._id);

      await adminPatch(buildCampaignApiUrl(renameCampaign._id), { name: nextName });

      setCampaigns((prev) =>
        prev.map((item) =>
          item._id === renameCampaign._id ? { ...item, name: nextName } : item
        )
      );

      setMessage({
        type: "success",
        text: "Campaign renamed successfully",
      });

      setRenameOpen(false);
      setRenameCampaign(null);
      setRenameValue("");
    } catch (error) {
      await showApiError(error, "Failed to rename campaign");
    } finally {
      setRenameLoading(false);
      setBusyActionId(null);
    }
  }

  function openDeleteCampaign(row: CampaignRow) {
    setDeleteCampaign(row);
    setDeleteOpen(true);
    setOpenMenu(null);
  }

  async function handleDeleteCampaign() {
    if (!deleteCampaign) return;

    try {
      setDeleteLoading(true);
      setBusyActionId(deleteCampaign._id);

      await adminDelete(buildCampaignApiUrl(deleteCampaign._id));

      setCampaigns((prev) => prev.filter((item) => item._id !== deleteCampaign._id));
      setSelectedIds((prev) => prev.filter((id) => id !== deleteCampaign._id));

      setMessage({
        type: "success",
        text: "Campaign deleted successfully",
      });

      setDeleteOpen(false);
      setDeleteCampaign(null);
    } catch (error) {
      await showApiError(error, "Failed to delete campaign");
    } finally {
      setDeleteLoading(false);
      setBusyActionId(null);
    }
  }

  async function handleDuplicateCampaign(row: CampaignRow) {
    try {
      setBusyActionId(row._id);

      const response: any = await adminPost(buildCampaignApiUrl(row._id, "/duplicate"), {});
      const duplicatedId = response?.data?._id;

      await loadPage(false);

      setMessage({
        type: "success",
        text: "Campaign duplicated successfully",
      });

      if (duplicatedId) {
        router.push(buildCampaignDetailUrl(duplicatedId));
      }
    } catch (error) {
      await showApiError(error, "Failed to duplicate campaign");
    } finally {
      setBusyActionId(null);
      setOpenMenu(null);
    }
  }

  async function handleShareCampaign(row: CampaignRow) {
    try {
      setBusyActionId(row._id);

      const response: any = await adminPost(buildCampaignApiUrl(row._id, "/share"), {});

      const isHttpUrl = (value: unknown): value is string =>
        typeof value === "string" && /^https?:\/\//i.test(value.trim());

      const shareUrlCandidates = [
        response?.data?.shareLink,
        response?.data?.shareUrl,
        row.instantly?.shareLink,
      ];

      const shareUrl =
        shareUrlCandidates.find((value) => isHttpUrl(value))?.trim() || "";

      if (shareUrl) {
        if (navigator?.clipboard) {
          await navigator.clipboard.writeText(shareUrl);
        }

        setCampaigns((prev) =>
          prev.map((item) =>
            item._id === row._id
              ? {
                ...item,
                instantly: {
                  ...(item.instantly || {}),
                  shareLink: shareUrl,
                },
              }
              : item
          )
        );

        setMessage({
          type: "success",
          text: "Share link copied to clipboard",
        });
      } else {
        setMessage({
          type: "info",
          text: response?.message || "Campaign shared, but no share link was returned",
        });
      }
    } catch (error) {
      await showApiError(error, "Failed to share campaign");
    } finally {
      setBusyActionId(null);
      setOpenMenu(null);
    }
  }

  async function handleDownloadAnalytics(row: CampaignRow) {
    try {
      setBusyActionId(row._id);

      const blob = await adminGetBlob(buildCampaignApiUrl(row._id, "/analytics.csv"));
      downloadBrowserBlob(
        blob,
        `${row.name.replace(/\s+/g, "-").toLowerCase()}-analytics.csv`
      );
    } catch (error) {
      await showApiError(error, "Failed to download analytics CSV");
    } finally {
      setBusyActionId(null);
      setOpenMenu(null);
    }
  }

  async function handleToggleLaunch(row: CampaignRow) {
    try {
      setBusyActionId(row._id);

      const currentStatus = getUiStatus(row);
      const route = currentStatus === "launched" ? "/pause" : "/activate";

      await adminPost(buildCampaignApiUrl(row._id, route), {});
      await loadPage(false);

      setMessage({
        type: "success",
        text:
          currentStatus === "launched"
            ? "Campaign paused successfully"
            : "Campaign launched successfully",
      });
    } catch (error) {
      await showApiError(error, "Failed to update campaign state");
    } finally {
      setBusyActionId(null);
      setOpenMenu(null);
    }
  }

  function openActionMenu(
    event: React.MouseEvent<HTMLButtonElement>,
    row: CampaignRow
  ) {
    event.stopPropagation();

    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 224;
    const estimatedHeight = 252;
    const spacing = 8;

    const left = Math.max(
      12,
      Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 12)
    );

    const shouldOpenUp = window.innerHeight - rect.bottom < estimatedHeight;
    const top = shouldOpenUp
      ? Math.max(12, rect.top - estimatedHeight - spacing)
      : rect.bottom + spacing;

    setOpenMenu({
      row,
      top,
      left,
    });
  }

  const filteredCampaigns = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = campaigns.filter((row) => {
      const uiStatus = getUiStatus(row);

      const matchesStatus = statusFilter === "all" ? true : uiStatus === statusFilter;

      const haystack = [
        row.name,
        row.instantly?.senderAccountEmail || "",
        row.instantly?.campaignId || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !term || haystack.includes(term);

      return matchesStatus && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "oldest") {
        return getDateValue(a.createdAt) - getDateValue(b.createdAt);
      }

      if (sortBy === "name_asc") {
        return a.name.localeCompare(b.name);
      }

      if (sortBy === "name_desc") {
        return b.name.localeCompare(a.name);
      }

      return getDateValue(b.createdAt) - getDateValue(a.createdAt);
    });
  }, [campaigns, searchTerm, sortBy, statusFilter]);

  const allVisibleSelected =
    filteredCampaigns.length > 0 &&
    filteredCampaigns.every((row) => selectedIds.includes(row._id));

  return (
    <div className="space-y-6 pb-8">
      {message && (
        <div
          className={cx(
            "rounded-2xl border px-4 py-3 text-sm",
            message.type === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
            message.type === "error" && "border-rose-200 bg-rose-50 text-rose-700",
            message.type === "info" && "border-sky-200 bg-sky-50 text-sky-700"
          )}
        >
          {message.text}
        </div>
      )}

      <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full max-w-[385px]">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="h-12 w-full rounded-full border border-slate-200 bg-white pl-14 pr-5 text-sm text-slate-700 outline-none transition focus:border-slate-300"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="h-12 min-w-[164px] appearance-none rounded-full border border-slate-200 bg-white pl-11 pr-10 text-sm font-medium text-slate-700 outline-none"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="relative">
              <ArrowUpDown className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-12 min-w-[170px] appearance-none rounded-full border border-slate-200 bg-white pl-11 pr-10 text-sm font-medium text-slate-700 outline-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            {canCreate && (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-[#4E78F6] px-6 text-sm font-semibold text-white transition hover:bg-[#436be2]"
              >
                <Plus className="h-4 w-4" />
                Add New
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="overflow-visible rounded-[30px] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-4">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                <th className="w-[52px] px-2">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(filteredCampaigns.map((row) => row._id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                </th>
                <th className="min-w-[320px] px-4">Name</th>
                <th className="min-w-[130px] px-4">Status</th>
                <th className="min-w-[170px] px-4">Progress</th>
                <th className="min-w-[120px] px-4">Sent</th>
                <th className="min-w-[120px] px-4">Click</th>
                <th className="min-w-[120px] px-4">Replied</th>
                <th className="min-w-[150px] px-4">Opportunities</th>
                <th className="w-[120px] px-4 text-right">&nbsp;</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center text-sm text-slate-500">
                    Loading campaigns...
                  </td>
                </tr>
              ) : filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center">
                    <h3 className="text-base font-semibold text-slate-900">No campaigns found</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Try a different search or create a new campaign.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((row) => {
                  const uiStatus = getUiStatus(row);
                  const progress = getProgress(row);
                  const busy = busyActionId === row._id;
                  const errorMessage = row.sync?.lastErrorMessage || "";
                  const isLaunched = uiStatus === "launched";

                  return (
                    <tr key={row._id}>
                      <td colSpan={9} className="px-0">
                        <div className="grid grid-cols-[52px_minmax(320px,1.8fr)_130px_170px_120px_120px_120px_150px_120px] items-center rounded-[28px] border border-slate-200 bg-white px-2 py-1 transition hover:border-slate-300 hover:shadow-sm">
                          <div className="px-4 py-8">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(row._id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                setSelectedIds((prev) =>
                                  e.target.checked
                                    ? [...new Set([...prev, row._id])]
                                    : prev.filter((id) => id !== row._id)
                                );
                              }}
                              className="h-4 w-4 rounded border-slate-300"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => router.push(buildCampaignDetailUrl(row._id))}
                            className="px-4 py-8 text-left"
                          >
                            <p className="text-[1.05rem] font-semibold text-slate-900">{row.name}</p>
                          </button>

                          <div className="px-4 py-8">
                            <div className="flex items-center gap-2">
                              <span
                                className={cx(
                                  "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                                  getStatusPillClasses(uiStatus)
                                )}
                              >
                                {uiStatus.charAt(0).toUpperCase() + uiStatus.slice(1)}
                              </span>

                              {errorMessage ? (
                                <span title={errorMessage} className="text-slate-500">
                                  <CircleAlert className="h-4 w-4" />
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="px-4 py-8">
                            <p className="text-[1.05rem] font-semibold text-slate-900">{progress}%</p>
                            <div className="mt-3 h-1.5 w-[52px] overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-slate-400 transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          <div className="px-4 py-8 text-[1.05rem] font-medium text-slate-900">
                            {normalizeNumber(row.stats?.totalSent) > 0
                              ? normalizeNumber(row.stats?.totalSent)
                              : "-"}
                          </div>

                          <div className="px-4 py-8 text-[1.05rem] font-medium text-slate-900">
                            {normalizeNumber(row.stats?.totalClicked) > 0
                              ? normalizeNumber(row.stats?.totalClicked)
                              : "-"}
                          </div>

                          <div className="px-4 py-8 text-[1.05rem] font-medium text-slate-900">
                            {normalizeNumber(row.stats?.totalReplies) > 0
                              ? normalizeNumber(row.stats?.totalReplies)
                              : "-"}
                          </div>

                          <div className="px-4 py-8 text-[1.05rem] font-medium text-slate-900">
                            {normalizeNumber(row.stats?.totalOpportunities)}
                          </div>

                          <div className="flex items-center justify-end gap-2 px-4 py-8">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleLaunch(row);
                              }}
                              className={cx(
                                "inline-flex h-9 w-9 items-center justify-center rounded-full transition disabled:opacity-50",
                                isLaunched
                                  ? "text-amber-600 hover:bg-amber-50"
                                  : "text-emerald-600 hover:bg-emerald-50"
                              )}
                              title={isLaunched ? "Pause campaign" : "Launch campaign"}
                            >
                              {isLaunched ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </button>

                            <button
                              type="button"
                              disabled={busy}
                              onClick={(e) => openActionMenu(e, row)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                              title="Campaign actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {openMenu && (
        <div
          ref={menuRef}
          className="fixed z-[80]"
          style={{
            top: openMenu.top,
            left: openMenu.left,
          }}
        >
          <ActionMenu
            busy={busyActionId === openMenu.row._id}
            onRename={() => openRenameCampaign(openMenu.row)}
            onDelete={() => openDeleteCampaign(openMenu.row)}
            onDuplicate={() => handleDuplicateCampaign(openMenu.row)}
            onDownload={() => handleDownloadAnalytics(openMenu.row)}
            onShare={() => handleShareCampaign(openMenu.row)}
          />
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Quick Create
                </p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">Create Campaign</h3>
                <p className="mt-1 text-sm text-slate-500">
                  The detail page will let you edit sequence, leads, sender accounts, sync, and launch.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {me?.role === "super_admin" ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">
                    Campaign Flow
                  </label>
                  <select
                    value={createForm.flowType}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        flowType: e.target.value as CampaignFlowType,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  >
                    <option value="standard_brand">Standard Brand (SDR → RH → BME)</option>
                    <option value="ime_influencer">IME Influencer (IME direct)</option>
                  </select>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Campaign Flow
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {fixedFlowType === "ime_influencer" ? "IME Influencer" : "Standard Brand"}
                  </p>
                </div>
              )}

              {me?.role === "super_admin" && createForm.flowType === "standard_brand" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">
                    SDR Owner
                  </label>
                  <select
                    value={createForm.sdrId}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, sdrId: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  >
                    <option value="">Select SDR</option>
                    {sdrOptions.map((admin) => (
                      <option key={admin._id} value={admin._id}>
                        {labelForAdmin(admin)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {me?.role === "super_admin" && createForm.flowType === "ime_influencer" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">
                    IME Owner
                  </label>
                  <select
                    value={createForm.imeId}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, imeId: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  >
                    <option value="">Select IME</option>
                    {imeOptions.map((admin) => (
                      <option key={admin._id} value={admin._id}>
                        {labelForAdmin(admin)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">
                  Campaign Name
                </label>
                <input
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder={
                    createForm.flowType === "ime_influencer"
                      ? "Creator outreach campaign"
                      : "Spring brand outreach campaign"
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreateCampaign}
                disabled={createLoading}
                className="rounded-2xl bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {createLoading ? "Creating..." : "Create Campaign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {renameOpen && renameCampaign && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Campaign Action
                </p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">Rename Campaign</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Update the campaign name for this outreach workflow.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setRenameOpen(false);
                  setRenameCampaign(null);
                  setRenameValue("");
                }}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-slate-800">
                Campaign Name
              </label>
              <input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Enter campaign name"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                autoFocus
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setRenameOpen(false);
                  setRenameCampaign(null);
                  setRenameValue("");
                }}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRenameCampaign}
                disabled={renameLoading}
                className="rounded-2xl bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {renameLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteOpen && deleteCampaign && (
        <div className="fixed inset-0 z-[96] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Campaign Action
                </p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">Delete Campaign</h3>
                <p className="mt-1 text-sm text-slate-500">
                  This will permanently delete this campaign and cannot be undone.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDeleteOpen(false);
                  setDeleteCampaign(null);
                }}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4">
              <p className="text-sm font-medium text-slate-900">Campaign Name</p>
              <p className="mt-1 text-sm text-rose-700">{deleteCampaign.name}</p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteOpen(false);
                  setDeleteCampaign(null);
                }}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteCampaign}
                disabled={deleteLoading}
                className="rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {deleteLoading ? "Deleting..." : "Delete Campaign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}