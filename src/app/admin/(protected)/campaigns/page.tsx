"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { post } from "@/lib/api";
import AdminTable, { type AdminTableColumn } from "../../components/table";
import {
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  RefreshCw,
  Search,
  Sparkles,
  XCircle,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type StatusFilter = 0 | 1 | 2;
type QuickFilter = "all" | "standard_campaign" | "fully_managed";
type DatePreset =
  | "all_time"
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_15_days"
  | "last_30_days"
  | "this_month";

type SortKey =
  | "name"
  | "startDate"
  | "endDate"
  | "budget"
  | "isActive"
  | "createdAt";

type AssignmentBadgeVariant = "rh" | "bme" | "ime";

interface CreatedByAdmin {
  userId: string;
  name: string;
  email: string;
  adminRole?: string;
  label: string;
}

interface ParentAdminMini {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface Employee {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  parentAdmin?: string | ParentAdminMini | null;
}

interface EmployeeListResponse {
  success: boolean;
  data: Employee[];
  count?: number;
  message?: string;
}

interface AdminMeResponse {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
}

interface Campaign {
  _id: string;
  brandId: string;
  brandName: string;
  brandPlanName: string;
  campaignId: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  budget?: number;
  goal?: string;
  applicantCount?: number;
  isActive: number;
  isDraft?: number;
  campaignStatus?: string;
  byAi?: number;
  createdByAdmin?: CreatedByAdmin | null;

  assignedRh?: string;
  assignedBme?: string;
  assignedIme?: string;
  RHId?: string | null;
  bdmId?: string | null;
  idmId?: string | null;
  assignmentId?: string | null;
  assignmentStatus?: string | null;
}

interface ListResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  status: number;
  sortBy?: string;
  sortOrder?: string;
  campaigns: Campaign[];
}

interface SummaryStats {
  totalCampaigns: number;
  totalThisMonth: number;
  totalFullyManaged: number;
}

const MAX_NAME_LENGTH = 72;
const DEFAULT_PAGE_LIMIT = 10;
const ROW_OPTIONS = [10, 20, 50, 100] as const;
const FILTER_FETCH_LIMIT = 500;

const MAIN_ADMIN_USER_ID = "69b007bb8e53408b168a8371";
const MAIN_ADMIN_EMAIL = "admincollabglam@gmail.com";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/";

const statusOptions = [
  { label: "All Status", value: 0 },
  { label: "Active", value: 1 },
  { label: "Inactive", value: 2 },
];

const quickFilterOptions: Array<{ label: string; value: QuickFilter }> = [
  { label: "All", value: "all" },
  { label: "Standard Campaign", value: "standard_campaign" },
  { label: "Fully Managed Campaign", value: "fully_managed" },
];

const datePresetOptions: Array<{ label: string; value: DatePreset }> = [
  { label: "All Time", value: "all_time" },
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 Days", value: "last_7_days" },
  { label: "Last 15 Days", value: "last_15_days" },
  { label: "Last 30 Days", value: "last_30_days" },
  { label: "This Month", value: "this_month" },
];

function toApiUrl(path: string) {
  const base = API_BASE.endsWith("/") ? API_BASE : `${API_BASE}/`;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${base}${cleanPath}`;
}

function getAuthHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(toApiUrl(path), {
    method: "GET",
    credentials: "include",
    headers: getAuthHeaders(),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data as T;
}

function formatName(name?: string) {
  if (!name) return "—";
  const trimmed = name.trim();
  if (trimmed.length <= MAX_NAME_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_NAME_LENGTH)}…`;
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(value?: number) {
  const amount = Number(value || 0);
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));

  return amount < 0 ? `-$${formatted}` : `$${formatted}`;
}

function normalizePlan(value?: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function isFullyManagedCampaign(campaign: Campaign) {
  const admin = campaign.createdByAdmin;
  const planName = normalizePlan(campaign.brandPlanName);

  return (
    planName === "fully_managed" ||
    admin?.userId === MAIN_ADMIN_USER_ID ||
    admin?.email?.toLowerCase() === MAIN_ADMIN_EMAIL.toLowerCase()
  );
}

function isStandardCampaign(campaign: Campaign) {
  return !isFullyManagedCampaign(campaign);
}

function getQuickFilterFromQuery(value?: string | null): QuickFilter {
  if (value === "fully_managed") return "fully_managed";
  if (value === "standard_campaign") return "standard_campaign";
  return "all";
}

function getStatusMeta(campaign: Campaign) {
  if (campaign.isDraft === 1) {
    return {
      label: "Draft",
      icon: RefreshCw,
      className: "border border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (campaign.isActive === 1) {
    return {
      label: "Active",
      icon: CheckCircle2,
      className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  return {
    label: "Inactive",
    icon: XCircle,
    className: "border border-rose-200 bg-rose-50 text-rose-700",
  };
}

function getCreatorMeta(campaign: Campaign) {
  if (isFullyManagedCampaign(campaign)) {
    return {
      title:
        campaign.byAi === 1 ? "Fully Managed • AI Assisted" : "Fully Managed",
      subtitle:
        campaign.createdByAdmin?.name ||
        campaign.createdByAdmin?.label ||
        campaign.createdByAdmin?.email ||
        "Main Admin",
      role: campaign.createdByAdmin?.adminRole || "",
    };
  }

  return {
    title: "Standard Campaign",
    subtitle: campaign.brandName || "—",
    role: "",
  };
}

function getParentAdminId(employee: Employee) {
  const parent = employee.parentAdmin;

  if (!parent) return "";
  if (typeof parent === "string") return parent;

  return String(parent._id || "");
}

function getEmployeeLabel(employee: Employee) {
  return employee.name || employee.email || "Unnamed IME";
}

function getEmployeeSubLabel(employee: Employee) {
  const email = String(employee.email || "").trim();
  const role = String(employee.role || "ime").toUpperCase();

  return email ? `${role} · ${email}` : role;
}

function getInitials(value?: string) {
  const base = String(value || "IME").trim();
  const parts = base.split(/\s+/).filter(Boolean);

  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function getAssignedImeLabel(campaign: Campaign, imeOptions: Employee[]) {
  if (campaign.idmId) {
    const found = imeOptions.find((item) => item._id === campaign.idmId);
    if (found) return getEmployeeLabel(found);
  }

  return campaign.assignedIme || "";
}

function getAssignedRhLabel(campaign: Campaign) {
  return campaign.assignedRh || (campaign.RHId ? "RH assigned" : "");
}

function getAssignedBmeLabel(campaign: Campaign) {
  return campaign.assignedBme || (campaign.bdmId ? "BME assigned" : "");
}

function getAssignmentBadgeClass(
  variant: AssignmentBadgeVariant,
  hasValue: boolean
) {
  if (!hasValue) {
    return "border-slate-200 bg-slate-50 text-slate-500";
  }

  if (variant === "rh") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (variant === "bme") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function AssignmentBadge({
  label,
  value,
  emptyText = "Not assigned",
  variant,
}: {
  label: string;
  value?: string | null;
  emptyText?: string;
  variant: AssignmentBadgeVariant;
}) {
  const cleanValue = String(value || "").trim();
  const hasValue = cleanValue.length > 0;

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getAssignmentBadgeClass(
        variant,
        hasValue
      )}`}
      title={hasValue ? cleanValue : emptyText}
    >
      <span className="shrink-0 uppercase tracking-[0.08em]">{label}</span>
      <span className="max-w-[130px] truncate">
        {hasValue ? cleanValue : emptyText}
      </span>
    </span>
  );
}

function getCampaignAssignmentStatus(
  campaign: Campaign,
  imeOptions: Employee[]
) {
  const assignedIme = getAssignedImeLabel(campaign, imeOptions);

  if (!campaign.RHId) {
    return {
      label: "RH Required",
      icon: UserPlus,
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (!assignedIme) {
    return {
      label: "IME Pending",
      icon: Clock3,
      className: "border-orange-200 bg-orange-50 text-orange-700",
    };
  }

  return {
    label: "Assigned",
    icon: UserCheck,
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

async function copyTextToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export default function AdminCampaignsPage() {
  const searchParams = useSearchParams();
  const quickFilterParam = searchParams.get("quickFilter");

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalCampaigns: 0,
    totalThisMonth: 0,
    totalFullyManaged: 0,
  });

  const [copiedCampaignId, setCopiedCampaignId] = useState<string | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<AdminMeResponse | null>(null);

  const [imeOptions, setImeOptions] = useState<Employee[]>([]);
  const [imeLoading, setImeLoading] = useState(false);
  const [assigningCampaignId, setAssigningCampaignId] = useState<string | null>(
    null
  );
  const [assignmentMsg, setAssignmentMsg] = useState<string | null>(null);
  const [assignmentErr, setAssignmentErr] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(0);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(() =>
    getQuickFilterFromQuery(quickFilterParam)
  );
  const [datePreset, setDatePreset] = useState<DatePreset>("all_time");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_LIMIT);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);

  const currentRole = String(currentAdmin?.role || "").toLowerCase();
  const canAssignIme =
    currentRole === "super_admin" || currentRole === "revenue_head";

  const apiPage = quickFilter === "all" ? page : 1;
  const apiLimit = quickFilter === "all" ? rowsPerPage : FILTER_FETCH_LIMIT;

  const forcedControlClass =
    "border-slate-200 bg-white text-slate-700 hover:!bg-slate-50 hover:!text-slate-900 active:!bg-slate-50 data-[state=open]:!bg-slate-50 focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!border-slate-300";

  const inputControlClass =
    "border-slate-200 bg-white text-slate-700 focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!border-slate-300";

  const filterLabelClass =
    "text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400";

  const filterButtonBaseClass =
    "h-11 rounded-[10px] border px-4 text-sm font-medium shadow-sm transition focus-visible:!ring-0 focus-visible:!ring-offset-0";

  const filterButtonActiveClass =
    "border-black bg-black text-white hover:!bg-black/90 hover:!text-white";

  const filterButtonInactiveClass =
    "border-slate-300 bg-white text-slate-700 hover:!bg-slate-50 hover:!text-slate-900";

  const tableButtonBaseClass =
    "h-9 rounded-[10px] border px-3 text-sm font-medium shadow-sm transition focus-visible:!ring-0 focus-visible:!ring-offset-0";

  const manageButtonClass =
    "border-black bg-black text-white hover:!bg-black/90 hover:!text-white";

  const fetchCurrentAdmin = useCallback(async () => {
    try {
      const response = await getJson<any>("/admins/me");
      setCurrentAdmin(response?.data || response || null);
    } catch {
      setCurrentAdmin(null);
    }
  }, []);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);

    try {
      const payload = {
        page: apiPage,
        limit: apiLimit,
        search,
        sortBy: sortKey,
        sortOrder: sortAsc ? "asc" : "desc",
        type: statusFilter,
        dateFilter: datePreset !== "all_time" ? datePreset : undefined,
      };

      const data = await post<ListResponse>("/admin/campaign/lite", payload);

      setCampaigns(data?.campaigns || []);
      setTotal(data?.total || 0);
      setTotalPages(data?.totalPages || 1);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load campaigns.");
    } finally {
      setLoading(false);
    }
  }, [apiPage, apiLimit, search, sortKey, sortAsc, statusFilter, datePreset]);

  const fetchImeOptions = useCallback(async () => {
    if (!canAssignIme) return;

    setImeLoading(true);

    try {
      const response = await getJson<EmployeeListResponse>(
        "/admins/get-executive-list?role=ime"
      );

      setImeOptions(Array.isArray(response?.data) ? response.data : []);
    } catch (err: any) {
      setAssignmentErr(err?.message || "Failed to load IME list.");
    } finally {
      setImeLoading(false);
    }
  }, [canAssignIme]);

  const fetchSummaryStats = useCallback(async () => {
    setSummaryLoading(true);

    try {
      const basePayload = {
        page: 1,
        limit: 1,
        search: "",
        sortBy: "createdAt",
        sortOrder: "desc",
        type: 0,
      };

      const [allCampaignsRes, thisMonthRes, fullListRes] =
        await Promise.allSettled([
          post<ListResponse>("/admin/campaign/lite", basePayload),
          post<ListResponse>("/admin/campaign/lite", {
            ...basePayload,
            dateFilter: "this_month",
          }),
          post<ListResponse>("/admin/campaign/lite", {
            ...basePayload,
            page: 1,
            limit: FILTER_FETCH_LIMIT,
          }),
        ]);

      const fullyManagedCount =
        fullListRes.status === "fulfilled"
          ? (fullListRes.value?.campaigns || []).filter(isFullyManagedCampaign)
              .length
          : 0;

      setSummaryStats({
        totalCampaigns:
          allCampaignsRes.status === "fulfilled"
            ? allCampaignsRes.value?.total || 0
            : 0,
        totalThisMonth:
          thisMonthRes.status === "fulfilled"
            ? thisMonthRes.value?.total || 0
            : 0,
        totalFullyManaged: fullyManagedCount,
      });
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    const nextFilter = getQuickFilterFromQuery(quickFilterParam);

    setQuickFilter((current) => (current === nextFilter ? current : nextFilter));
    setPage(1);
  }, [quickFilterParam]);

  useEffect(() => {
    fetchCurrentAdmin();
  }, [fetchCurrentAdmin]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    fetchSummaryStats();
  }, [fetchSummaryStats]);

  useEffect(() => {
    fetchImeOptions();
  }, [fetchImeOptions]);

  const getPublicShareUrl = useCallback(async (campaign: Campaign) => {
    const response = await post<any>("/admin/campaign/share/enable", {
      campaignId: campaign.campaignId,
      brandId: campaign.brandId,
    });

    const shareUrl =
      response?.shareUrl ||
      response?.data?.shareUrl ||
      response?.result?.shareUrl ||
      "";

    if (!shareUrl) {
      throw new Error("Public link not received");
    }

    return shareUrl;
  }, []);

  const handleCopyPublicLink = async (campaign: Campaign) => {
    try {
      const shareUrl = await getPublicShareUrl(campaign);
      await copyTextToClipboard(shareUrl);
      setCopiedCampaignId(campaign.campaignId);

      window.setTimeout(() => {
        setCopiedCampaignId((prev) =>
          prev === campaign.campaignId ? null : prev
        );
      }, 1800);
    } catch (err: any) {
      window.alert(err?.message || "Failed to copy public link");
    }
  };

  const getImeOptionsForCampaign = useCallback(
    (campaign: Campaign) => {
      if (!canAssignIme || !campaign.RHId) return [];

      const campaignRhId = String(campaign.RHId);

      return imeOptions.filter(
        (employee) => getParentAdminId(employee) === campaignRhId
      );
    },
    [canAssignIme, imeOptions]
  );

  const handleAssignIme = useCallback(
    async (campaign: Campaign, idmId: string) => {
      if (!canAssignIme) {
        setAssignmentErr(
          "Only Super Admin or Revenue Head can assign IME to campaigns."
        );
        return;
      }

      if (!isFullyManagedCampaign(campaign)) {
        setAssignmentErr(
          "IME assignment is available only for Fully Managed campaigns."
        );
        return;
      }

      if (!campaign.RHId) {
        setAssignmentErr(
          "Assign RH to this brand before assigning IME to its campaign."
        );
        return;
      }

      if (!idmId) {
        setAssignmentErr("Please select an IME first.");
        return;
      }

      const campaignMongoId = String(campaign._id || "").trim();

      if (!campaignMongoId) {
        setAssignmentErr("Campaign Mongo ID is missing.");
        return;
      }

      const selectedIme = imeOptions.find((item) => item._id === idmId);
      const selectedImeName = selectedIme ? getEmployeeLabel(selectedIme) : idmId;

      try {
        setAssigningCampaignId(campaignMongoId);
        setAssignmentErr(null);
        setAssignmentMsg(null);

        await post<any>("/admins/assign-campaign-ime", {
          campaignId: campaignMongoId,
          idmId,
        });

        setCampaigns((prev) =>
          prev.map((item) =>
            item._id === campaignMongoId
              ? {
                  ...item,
                  idmId,
                  assignedIme: selectedImeName,
                  assignmentStatus: "active",
                }
              : item
          )
        );

        setAssignmentMsg("Campaign IME assignment saved successfully.");
        window.setTimeout(() => setAssignmentMsg(null), 2500);

        await fetchCampaigns();
      } catch (err: any) {
        setAssignmentErr(err?.message || "Failed to assign IME to campaign.");
      } finally {
        setAssigningCampaignId(null);
      }
    },
    [canAssignIme, fetchCampaigns, imeOptions]
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }

    setPage(1);
  };

  const handleSort = (field: string) => {
    const allowedFields: SortKey[] = [
      "name",
      "startDate",
      "endDate",
      "budget",
      "isActive",
      "createdAt",
    ];

    if (allowedFields.includes(field as SortKey)) {
      toggleSort(field as SortKey);
    }
  };

  const handleRowsPerPageChange = (limit: number) => {
    setRowsPerPage(limit);
    setPage(1);
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== 0 ||
    quickFilter !== "all" ||
    datePreset !== "all_time";

  const resetFilters = () => {
    setSearch("");
    setStatusFilter(0);
    setQuickFilter("all");
    setDatePreset("all_time");
    setPage(1);
  };

  const filteredCampaigns = useMemo(() => {
    if (quickFilter === "fully_managed") {
      return campaigns.filter(isFullyManagedCampaign);
    }

    if (quickFilter === "standard_campaign") {
      return campaigns.filter(isStandardCampaign);
    }

    return campaigns;
  }, [campaigns, quickFilter]);

  const totalVisibleItems =
    quickFilter === "all" ? total : filteredCampaigns.length;

  const tableTotalPages =
    quickFilter === "all"
      ? Math.max(1, totalPages)
      : Math.max(1, Math.ceil(filteredCampaigns.length / rowsPerPage));

  const tableCampaigns = useMemo(() => {
    if (quickFilter === "all") {
      return filteredCampaigns;
    }

    const startIndex = (page - 1) * rowsPerPage;
    return filteredCampaigns.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredCampaigns, page, quickFilter, rowsPerPage]);

  useEffect(() => {
    if (page > tableTotalPages) {
      setPage(tableTotalPages);
    }
  }, [page, tableTotalPages]);

  const assignedImeCount = useMemo(
    () =>
      campaigns.filter(
        (item) =>
          isFullyManagedCampaign(item) && Boolean(item.assignedIme || item.idmId)
      ).length,
    [campaigns]
  );

  const summaryCards = useMemo(
    () => [
      {
        id: "total",
        title: "Total Campaigns",
        value: summaryStats.totalCampaigns,
        subtitle: "All campaigns visible to your role",
        icon: CheckCircle2,
        cardClassName: "border border-slate-200 bg-white shadow-sm",
        iconWrapClassName: "bg-slate-100 text-slate-700",
        valueClassName: "text-slate-900",
      },
      {
        id: "month",
        title: "This Month",
        value: `+${summaryStats.totalThisMonth}`,
        subtitle: "Campaigns created in this month",
        icon: Clock3,
        cardClassName:
          "border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-white shadow-sm",
        iconWrapClassName: "bg-sky-100 text-sky-700",
        valueClassName: "text-slate-900",
      },
      {
        id: "fully_managed",
        title: "Fully Managed",
        value: `+${summaryStats.totalFullyManaged}`,
        subtitle: "Only these campaigns need IME assignment",
        icon: Sparkles,
        cardClassName:
          "border border-amber-300 bg-gradient-to-br from-amber-50 via-yellow-50 to-white shadow-sm ring-1 ring-amber-200/70",
        iconWrapClassName: "bg-amber-100 text-amber-700",
        valueClassName: "text-amber-700",
      },
      {
        id: "ime_assigned",
        title: "IME Assigned",
        value: assignedImeCount,
        subtitle: "Fully Managed campaigns with IME mapped",
        icon: UserCheck,
        cardClassName: "border border-emerald-200 bg-white shadow-sm",
        iconWrapClassName: "bg-emerald-100 text-emerald-700",
        valueClassName: "text-emerald-700",
      },
    ],
    [assignedImeCount, summaryStats]
  );

  const columns = useMemo<AdminTableColumn<Campaign>[]>(
    () => [
      {
        id: "campaign",
        header: "Campaign",
        sortable: true,
        sortField: "name",
        widthClassName: "min-w-[300px]",
        render: (campaign) => (
          <div className="min-w-0">
            <div
              className="truncate text-sm font-semibold text-slate-900"
              title={campaign.name}
            >
              {formatName(campaign.name)}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {campaign.byAi === 1 ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  By AI
                </span>
              ) : null}

              {isFullyManagedCampaign(campaign) ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-gradient-to-r from-yellow-100 via-amber-100 to-yellow-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  Fully Managed
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  Standard
                </span>
              )}

              {campaign.isDraft === 1 ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                  <Clock3 className="h-3.5 w-3.5" />
                  Draft
                </span>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        id: "createdBy",
        header: "Managed By",
        widthClassName: "min-w-[240px]",
        render: (campaign) => {
          const creatorMeta = getCreatorMeta(campaign);

          return (
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {creatorMeta.title}
              </p>

              <p className="mt-1 text-sm text-slate-600">
                {creatorMeta.subtitle || "—"}
              </p>

              {creatorMeta.role ? (
                <span className="mt-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                  {creatorMeta.role.replace(/_/g, " ")}
                </span>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "assignment",
        header: "Campaign Assignment",
        widthClassName: "min-w-[310px]",
        render: (campaign) => {
          const assignedIme = getAssignedImeLabel(campaign, imeOptions);
          const status = getCampaignAssignmentStatus(campaign, imeOptions);
          const StatusIcon = status.icon;

          return (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                <AssignmentBadge
                  label="RH"
                  value={getAssignedRhLabel(campaign)}
                  emptyText="RH required"
                  variant="rh"
                />

                <AssignmentBadge
                  label="BME"
                  value={getAssignedBmeLabel(campaign)}
                  emptyText="No BME"
                  variant="bme"
                />

                <AssignmentBadge
                  label="IME"
                  value={assignedIme}
                  emptyText="IME pending"
                  variant="ime"
                />
              </div>

              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${status.className}`}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {status.label}
              </span>
            </div>
          );
        },
      },
      {
        id: "startDate",
        header: "Start Date",
        sortable: true,
        sortField: "startDate",
        widthClassName: "min-w-[120px]",
        render: (campaign) => (
          <span className="text-sm text-slate-700">
            {formatDate(campaign.startDate)}
          </span>
        ),
      },
      {
        id: "endDate",
        header: "End Date",
        sortable: true,
        sortField: "endDate",
        widthClassName: "min-w-[120px]",
        render: (campaign) => (
          <span className="text-sm text-slate-700">
            {formatDate(campaign.endDate)}
          </span>
        ),
      },
      {
        id: "budget",
        header: "Budget",
        sortable: true,
        sortField: "budget",
        align: "right",
        widthClassName: "min-w-[120px]",
        render: (campaign) => (
          <span className="text-sm font-semibold text-slate-900">
            {formatCurrency(campaign.budget)}
          </span>
        ),
      },
      {
        id: "applicants",
        header: "Applicants",
        align: "center",
        widthClassName: "min-w-[110px]",
        render: (campaign) => (
          <span className="inline-flex min-w-[40px] items-center justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {campaign.applicantCount ?? 0}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        sortable: true,
        sortField: "isActive",
        widthClassName: "min-w-[130px]",
        render: (campaign) => {
          const statusMeta = getStatusMeta(campaign);
          const StatusIcon = statusMeta.icon;

          return (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.className}`}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {statusMeta.label}
            </span>
          );
        },
      },
    ],
    [imeOptions]
  );

  const renderImeAction = useCallback(
    (campaign: Campaign) => {
      const fullyManaged = isFullyManagedCampaign(campaign);

      if (!fullyManaged) {
        return null;
      }

      if (!canAssignIme) {
        return null;
      }

      const scopedOptions = getImeOptionsForCampaign(campaign);
      const assignedLabel = getAssignedImeLabel(campaign, imeOptions);
      const currentId = String(campaign.idmId || "");
      const isSaving = assigningCampaignId === campaign._id;

      const hasCurrentOutsideOptions =
        currentId && !scopedOptions.some((item) => item._id === currentId);

      const displayOptions = hasCurrentOutsideOptions
        ? [
            {
              _id: currentId,
              name: assignedLabel || "Current IME",
              email: "",
              role: "ime",
              status: "active",
            },
            ...scopedOptions,
          ]
        : scopedOptions;

      const disabled =
        !campaign.RHId ||
        imeLoading ||
        isSaving ||
        displayOptions.length === 0;

      const status = getCampaignAssignmentStatus(campaign, imeOptions);
      const StatusIcon = status.icon;

      const placeholder = isSaving
        ? "Saving..."
        : imeLoading
          ? "Loading IMEs..."
          : !campaign.RHId
            ? "Assign RH first"
            : displayOptions.length === 0
              ? "No IME found"
              : assignedLabel || "Assign Campaign";

      return (
        <div className="min-w-[300px] rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white p-3 text-left shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-amber-700">
              <UserPlus className="h-3.5 w-3.5" />
              Assign Campaign
            </span>

            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${status.className}`}
            >
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </span>
          </div>

          <Select
            value={currentId}
            disabled={disabled}
            onValueChange={(value) => handleAssignIme(campaign, value)}
          >
            <SelectTrigger className="h-10 w-full rounded-xl border-amber-200 bg-white text-slate-800 shadow-sm focus:ring-0 focus:ring-offset-0 disabled:bg-slate-100 disabled:text-slate-400">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>

            <SelectContent className="bg-white">
              {displayOptions.map((employee) => (
                <SelectItem
                  key={employee._id}
                  value={employee._id}
                  className="data-[highlighted]:!bg-slate-50 data-[highlighted]:!text-slate-900 focus:!bg-slate-50"
                >
                  {getEmployeeLabel(employee)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <AssignmentBadge
              label="RH"
              value={getAssignedRhLabel(campaign)}
              emptyText="RH required"
              variant="rh"
            />

            <AssignmentBadge
              label="IME"
              value={assignedLabel}
              emptyText="Pending"
              variant="ime"
            />
          </div>

          {!campaign.RHId ? (
            <p className="mt-2 text-[11px] font-medium text-amber-700">
              Assign RH to this brand before assigning campaign IME.
            </p>
          ) : null}

          {campaign.RHId && !imeLoading && displayOptions.length === 0 ? (
            <p className="mt-2 text-[11px] font-medium text-orange-700">
              No active IME found under {campaign.assignedRh || "this RH"}.
            </p>
          ) : null}
        </div>
      );
    },
    [
      assigningCampaignId,
      canAssignIme,
      getImeOptionsForCampaign,
      handleAssignIme,
      imeLoading,
      imeOptions,
    ]
  );

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 lg:px-8">
        <div className="mb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-900">
              Admin Campaign Management
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Review campaigns and assign campaign IME only for Fully Managed
              campaigns from the Actions column.
            </p>

            {currentRole ? (
              <div className="mt-3 inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                Logged in as {currentRole.replace(/_/g, " ").toUpperCase()}
                {canAssignIme
                  ? " · Fully Managed campaign assignment enabled"
                  : ""}
              </div>
            ) : null}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.id}
                  className={`relative overflow-hidden rounded-[24px] p-5 ${card.cardClassName}`}
                >
                  {card.id === "fully_managed" ? (
                    <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-amber-200/30 blur-2xl" />
                  ) : null}

                  <div className="relative flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {card.title}
                      </p>

                      <div
                        className={`mt-3 text-3xl font-bold ${card.valueClassName}`}
                      >
                        {summaryLoading && card.id !== "ime_assigned"
                          ? "—"
                          : card.value}
                      </div>

                      <p className="mt-2 text-sm text-slate-600">
                        {card.subtitle}
                      </p>
                    </div>

                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.iconWrapClassName}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {assignmentErr ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {assignmentErr}
          </div>
        ) : null}

        {assignmentMsg ? (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {assignmentMsg}
          </div>
        ) : null}

        <div className="mb-4 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-5">
            <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-slate-900">
              Filters
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Affects the campaign table below only
            </p>
          </div>

          <div className="px-5 py-6">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(320px,1.5fr)_520px_220px_220px_auto] xl:items-end">
              <div className="space-y-2">
                <p className={filterLabelClass}>Search</p>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    placeholder="Search .."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className={`h-11 rounded-[10px] pl-9 ${inputControlClass}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className={filterLabelClass}>Campaign Type</p>

                <div className="flex flex-wrap gap-2">
                  {quickFilterOptions.map((option) => {
                    const active = quickFilter === option.value;

                    return (
                      <Button
                        key={option.value}
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setQuickFilter(option.value);
                          setPage(1);
                        }}
                        className={`${filterButtonBaseClass} ${
                          active
                            ? filterButtonActiveClass
                            : filterButtonInactiveClass
                        }`}
                      >
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <p className={filterLabelClass}>Date Range</p>

                <Select
                  value={datePreset}
                  onValueChange={(val) => {
                    setDatePreset(val as DatePreset);
                    setPage(1);
                  }}
                >
                  <SelectTrigger
                    className={`h-11 w-full rounded-[10px] ${forcedControlClass}`}
                  >
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>

                  <SelectContent className="bg-white">
                    {datePresetOptions.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="data-[highlighted]:!bg-slate-50 data-[highlighted]:!text-slate-900 focus:!bg-slate-50"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className={filterLabelClass}>Status</p>

                <Select
                  value={statusFilter.toString()}
                  onValueChange={(val) => {
                    setStatusFilter(Number(val) as StatusFilter);
                    setPage(1);
                  }}
                >
                  <SelectTrigger
                    className={`h-11 w-full rounded-[10px] ${forcedControlClass}`}
                  >
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>

                  <SelectContent className="bg-white">
                    {statusOptions.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value.toString()}
                        className="data-[highlighted]:!bg-slate-50 data-[highlighted]:!text-slate-900 focus:!bg-slate-50"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex xl:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetFilters}
                  disabled={!hasActiveFilters}
                  className={`${filterButtonBaseClass} ${filterButtonInactiveClass} disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none`}
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4 md:px-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Campaign Table
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Assignment badges show RH, BME, and IME mapping. Campaign IME
                  can be assigned from the Actions column.
                </p>
              </div>

              <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600">
                Showing:
                <span className="ml-2 font-semibold text-slate-900">
                  {totalVisibleItems}
                </span>
              </div>
            </div>
          </div>

          <div className="px-2 pb-2 md:px-3 md:pb-3">
            <AdminTable<Campaign>
              data={tableCampaigns}
              columns={columns}
              rowKey={(row, index) => row.campaignId || row._id || String(index)}
              loading={loading}
              loadingRows={rowsPerPage}
              error={error}
              emptyTitle="No campaigns found"
              emptyDescription="Try adjusting your filters or search."
              sortBy={sortKey}
              sortOrder={sortAsc ? "asc" : "desc"}
              onSort={handleSort}
              actions={{
                header: "Actions",
                align: "right",
                cellClassName: "min-w-[460px]",
                render: (campaign) => (
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {renderImeAction(campaign)}

                    <div className="flex items-center gap-2">
                      <Button
                        asChild
                        type="button"
                        className={`${tableButtonBaseClass} ${manageButtonClass}`}
                      >
                        <Link
                          href={`/admin/campaigns/view?id=${campaign.campaignId}`}
                          aria-label="Manage Campaign"
                        >
                          Manage
                        </Link>
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleCopyPublicLink(campaign)}
                        aria-label="Copy Public Link"
                        title="Copy Public Link"
                        className={`h-9 rounded-[10px] px-2 shadow-none focus-visible:!ring-0 focus-visible:!ring-offset-0 ${
                          copiedCampaignId === campaign.campaignId
                            ? "border-0 bg-transparent text-emerald-600 hover:!bg-transparent hover:!text-emerald-700"
                            : "border-0 bg-transparent text-blue-600 hover:!bg-transparent hover:!text-blue-700"
                        }`}
                      >
                        {copiedCampaignId === campaign.campaignId ? (
                          <>
                            <Check className="mr-2 h-4.5 w-4.5" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4.5 w-4.5" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ),
              }}
              pagination={{
                page,
                totalPages: tableTotalPages,
                totalItems: totalVisibleItems,
                limit: rowsPerPage,
                onPageChange: setPage,
                onLimitChange: handleRowsPerPageChange,
                rowOptions: ROW_OPTIONS,
                loading,
                showRowsSelector: true,
                showSummary: true,
              }}
              className="py-2"
              tableClassName="min-w-[1900px]"
              headerRowClassName="bg-slate-50/80"
            />
          </div>
        </div>
      </div>
    </div>
  );
}