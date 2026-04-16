"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { post } from "@/lib/api";
import AdminTable, { type AdminTableColumn } from "../../components/table";
import {
  CheckCircle2,
  Clock3,
  Link2,
  MoreHorizontal,
  RefreshCw,
  Search,
  Sparkles,
  UserCog,
  XCircle,
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type StatusFilter = 0 | 1 | 2;
type QuickFilter = "all" | "ai" | "admin" | "fully_managed";
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

interface CreatedByAdmin {
  userId: string;
  name: string;
  email: string;
  adminRole?: string;
  label: string;
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
const PAGE_LIMIT = 10;

const statusOptions = [
  { label: "All Status", value: 0 },
  { label: "Active", value: 1 },
  { label: "Inactive", value: 2 },
];

const quickFilterOptions: Array<{ label: string; value: QuickFilter }> = [
  { label: "All", value: "all" },
  { label: "By AI", value: "ai" },
  { label: "By Admin", value: "admin" },
  { label: "Fully Managed", value: "fully_managed" },
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
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPlanLabel(plan?: string) {
  if (!plan) return "Free";
  return plan
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isFullyManagedCampaign(campaign: Campaign) {
  return String(campaign.brandPlanName || "").toLowerCase() === "fully_managed";
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
  if (campaign.createdByAdmin) {
    return {
      title: campaign.byAi === 1 ? "Created by Admin via AI" : "Created by Admin",
      subtitle:
        campaign.createdByAdmin.name ||
        campaign.createdByAdmin.email ||
        campaign.createdByAdmin.label ||
        "Admin",
      email: campaign.createdByAdmin.email || "",
      role: campaign.createdByAdmin.adminRole || "",
    };
  }

  if (campaign.byAi === 1) {
    return {
      title: "AI Generated",
      subtitle: "Admin details unavailable",
      email: "",
      role: "",
    };
  }

  return {
    title: "Standard Campaign",
    subtitle: "",
    email: "",
    role: "",
  };
}

function isCampaignInDatePreset(
  campaignDateValue: string | null | undefined,
  preset: DatePreset
) {
  if (preset === "all_time") return true;
  if (!campaignDateValue) return false;

  const campaignDate = new Date(campaignDateValue);
  if (Number.isNaN(campaignDate.getTime())) return false;

  const now = new Date();

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const yesterdayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1
  );
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const campaignTime = campaignDate.getTime();

  if (preset === "today") {
    return campaignTime >= todayStart.getTime() && campaignTime < todayEnd.getTime();
  }

  if (preset === "yesterday") {
    return (
      campaignTime >= yesterdayStart.getTime() &&
      campaignTime < todayStart.getTime()
    );
  }

  if (preset === "last_7_days") {
    const start = new Date(todayStart);
    start.setDate(start.getDate() - 6);
    return campaignTime >= start.getTime() && campaignTime < todayEnd.getTime();
  }

  if (preset === "last_15_days") {
    const start = new Date(todayStart);
    start.setDate(start.getDate() - 14);
    return campaignTime >= start.getTime() && campaignTime < todayEnd.getTime();
  }

  if (preset === "last_30_days") {
    const start = new Date(todayStart);
    start.setDate(start.getDate() - 29);
    return campaignTime >= start.getTime() && campaignTime < todayEnd.getTime();
  }

  if (preset === "this_month") {
    return campaignTime >= thisMonthStart.getTime() && campaignTime < todayEnd.getTime();
  }

  return true;
}

export default function AdminCampaignsPage() {
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

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(0);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all_time");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);

    try {
      const payload = {
        page,
        limit: PAGE_LIMIT,
        search,
        sortBy: sortKey,
        sortOrder: sortAsc ? "asc" : "desc",
        type: statusFilter,
        byAi: quickFilter === "ai" ? 1 : undefined,
        byAdmin: quickFilter === "admin" ? 1 : undefined,
        brandPlanName: quickFilter === "fully_managed" ? "fully_managed" : undefined,
        dateFilter: datePreset !== "all_time" ? datePreset : undefined,
      };

      const data = await post<ListResponse>("/admin/campaign/lite", payload);

      setCampaigns(data?.campaigns || []);
      setTotal(data?.total || 0);
      setTotalPages(data?.totalPages || 1);
      setPage(data?.page || 1);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load campaigns.");
    } finally {
      setLoading(false);
    }
  }, [page, search, sortKey, sortAsc, statusFilter, quickFilter, datePreset]);

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

      const [allCampaignsRes, thisMonthRes, fullyManagedRes] = await Promise.allSettled([
        post<ListResponse>("/admin/campaign/lite", basePayload),
        post<ListResponse>("/admin/campaign/lite", {
          ...basePayload,
          dateFilter: "this_month",
        }),
        post<ListResponse>("/admin/campaign/lite", {
          ...basePayload,
          brandPlanName: "fully_managed",
        }),
      ]);

      setSummaryStats({
        totalCampaigns:
          allCampaignsRes.status === "fulfilled" ? allCampaignsRes.value?.total || 0 : 0,
        totalThisMonth:
          thisMonthRes.status === "fulfilled" ? thisMonthRes.value?.total || 0 : 0,
        totalFullyManaged:
          fullyManagedRes.status === "fulfilled"
            ? fullyManagedRes.value?.total || 0
            : 0,
      });
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    fetchSummaryStats();
  }, [fetchSummaryStats]);

  const handleOpenPublicLink = async (campaign: Campaign) => {
    try {
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

      window.open(shareUrl, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      window.alert(err?.message || "Failed to open public link");
    }
  };

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

  const hasExtraFilters = quickFilter !== "all" || datePreset !== "all_time";

  const visibleCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      if (quickFilter === "ai" && campaign.byAi !== 1) return false;
      if (quickFilter === "admin" && !campaign.createdByAdmin) return false;
      if (quickFilter === "fully_managed" && !isFullyManagedCampaign(campaign)) {
        return false;
      }

      if (!isCampaignInDatePreset(campaign.startDate, datePreset)) {
        return false;
      }

      return true;
    });
  }, [campaigns, quickFilter, datePreset]);

  const clearExtraFilters = () => {
    setQuickFilter("all");
    setDatePreset("all_time");
    setPage(1);
  };

  const forcedControlClass =
    "border-slate-200 bg-white text-slate-700 hover:!bg-[#EDEDED] hover:!text-slate-900 active:!bg-[#EDEDED] data-[state=open]:!bg-[#EDEDED] focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!border-slate-300";

  const inputControlClass =
    "border-slate-200 bg-white text-slate-700 focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!border-slate-300";

  const summaryCards = useMemo(
    () => [
      {
        id: "total",
        title: "Total Campaigns",
        value: summaryStats.totalCampaigns,
        subtitle: "All campaigns across the platform",
        icon: CheckCircle2,
        cardClassName:
          "border border-slate-200 bg-white shadow-sm",
        iconWrapClassName:
          "bg-slate-100 text-slate-700",
        valueClassName: "text-slate-900",
      },
      {
        id: "month",
        title: "This Month",
        value: summaryStats.totalThisMonth,
        subtitle: "Campaigns created for this month",
        icon: Clock3,
        cardClassName:
          "border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-white shadow-sm",
        iconWrapClassName:
          "bg-sky-100 text-sky-700",
        valueClassName: "text-slate-900",
      },
      {
        id: "fully_managed",
        title: "Fully Managed",
        value: summaryStats.totalFullyManaged,
        subtitle: "Highlighted premium campaigns",
        icon: Sparkles,
        cardClassName:
          "border border-amber-300 bg-gradient-to-br from-amber-50 via-yellow-50 to-white shadow-sm ring-1 ring-amber-200/70",
        iconWrapClassName:
          "bg-amber-100 text-amber-700",
        valueClassName: "text-amber-700",
      },
    ],
    [summaryStats]
  );

  const columns = useMemo<AdminTableColumn<Campaign>[]>(
    () => [
      {
        id: "campaign",
        header: "Campaign",
        sortable: true,
        sortField: "name",
        widthClassName: "min-w-[280px]",
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

              {campaign.createdByAdmin ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                  <UserCog className="h-3.5 w-3.5" />
                  By Admin
                </span>
              ) : null}

              {isFullyManagedCampaign(campaign) ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-gradient-to-r from-yellow-100 via-amber-100 to-yellow-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  Fully Managed
                </span>
              ) : null}

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
        id: "brand",
        header: "Brand",
        widthClassName: "min-w-[210px]",
        render: (campaign) => {
          const fullyManaged = isFullyManagedCampaign(campaign);

          return (
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {campaign.brandName || "—"}
              </p>

              <span
                className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${
                  fullyManaged
                    ? "border border-amber-300 bg-gradient-to-r from-yellow-100 via-amber-100 to-yellow-50 text-amber-800 shadow-sm"
                    : "border border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                {formatPlanLabel(campaign.brandPlanName)}
              </span>
            </div>
          );
        },
      },
      {
        id: "createdBy",
        header: "Created By",
        widthClassName: "min-w-[250px]",
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

              {creatorMeta.email ? (
                <p className="mt-1 break-all text-xs text-slate-500">
                  {creatorMeta.email}
                </p>
              ) : null}

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
        id: "startDate",
        header: "Start",
        sortable: true,
        sortField: "startDate",
        widthClassName: "min-w-[120px]",
        render: (campaign) => (
          <span className="text-sm text-slate-700">{formatDate(campaign.startDate)}</span>
        ),
      },
      {
        id: "endDate",
        header: "End",
        sortable: true,
        sortField: "endDate",
        widthClassName: "min-w-[120px]",
        render: (campaign) => (
          <span className="text-sm text-slate-700">{formatDate(campaign.endDate)}</span>
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
    []
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 lg:px-8">
        <div className="mb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-900">
              Admin Campaign Management
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Review campaigns, filter by AI, Admin, fully managed access, and
              recent date range, then open each campaign to manage it.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                      <div className={`mt-3 text-3xl font-bold ${card.valueClassName}`}>
                        {summaryLoading ? "—" : card.value}
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{card.subtitle}</p>
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

        <div className="mb-4 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="px-4 py-4 md:px-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Campaign Filters</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Filters are separated from the table for a cleaner management view.
                  </p>
                </div>

                {hasExtraFilters && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearExtraFilters}
                    className={`h-9 rounded-xl px-3 ${forcedControlClass}`}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
                  <div className="relative w-full max-w-[240px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search campaign..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      className={`h-10 rounded-xl pl-9 ${inputControlClass}`}
                    />
                  </div>

                  <Select
                    value={statusFilter.toString()}
                    onValueChange={(val) => {
                      setStatusFilter(Number(val) as StatusFilter);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger
                      className={`h-10 w-full rounded-xl sm:w-[170px] ${forcedControlClass}`}
                    >
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {statusOptions.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value.toString()}
                          className="data-[highlighted]:!bg-[#EDEDED] data-[highlighted]:!text-slate-900 focus:!bg-[#EDEDED]"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={datePreset}
                    onValueChange={(val) => {
                      setDatePreset(val as DatePreset);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger
                      className={`h-10 w-full rounded-xl sm:w-[170px] ${forcedControlClass}`}
                    >
                      <SelectValue placeholder="Date Filter" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {datePresetOptions.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="data-[highlighted]:!bg-[#EDEDED] data-[highlighted]:!text-slate-900 focus:!bg-[#EDEDED]"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {quickFilterOptions.map((option) => {
                  const active = quickFilter === option.value;
                  const fullyManagedActive =
                    active && option.value === "fully_managed";

                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setQuickFilter(option.value);
                        setPage(1);
                      }}
                      className={`h-9 rounded-xl px-3 focus-visible:!ring-0 focus-visible:!ring-offset-0 ${
                        fullyManagedActive
                          ? "border-amber-300 bg-gradient-to-r from-yellow-100 via-amber-100 to-yellow-50 text-amber-800 hover:!bg-yellow-100"
                          : active
                          ? "border-slate-300 bg-[#EDEDED] text-slate-900 hover:!bg-[#EDEDED]"
                          : forcedControlClass
                      }`}
                    >
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4 md:px-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Campaign Table</p>
                <p className="mt-1 text-xs text-slate-500">
                  Browse, sort, and manage campaigns without filter controls attached to
                  the table.
                </p>
              </div>

              <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600">
                Showing:
                <span className="ml-2 font-semibold text-slate-900">
                  {hasExtraFilters ? visibleCampaigns.length : total}
                </span>
              </div>
            </div>
          </div>

          <div className="px-2 pb-2 md:px-3 md:pb-3">
            <AdminTable<Campaign>
              data={visibleCampaigns}
              columns={columns}
              rowKey={(row, index) => row.campaignId || row._id || String(index)}
              loading={loading}
              loadingRows={PAGE_LIMIT}
              error={error}
              emptyTitle="No campaigns found"
              emptyDescription="Try adjusting your filters or search."
              sortBy={sortKey}
              sortOrder={sortAsc ? "asc" : "desc"}
              onSort={handleSort}
              actions={{
                header: "Actions",
                align: "right",
                cellClassName: "min-w-[310px]",
                render: (campaign) => (
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      asChild
                      type="button"
                      variant="outline"
                      className={`h-9 rounded-xl px-3 ${forcedControlClass}`}
                    >
                      <Link
                        href={`/admin/campaigns/view?id=${campaign.campaignId}`}
                        aria-label="Manage Campaign"
                      >
                        Manage Campaign
                      </Link>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOpenPublicLink(campaign)}
                      className={`h-9 rounded-xl px-3 ${forcedControlClass}`}
                    >
                      <Link2 className="mr-2 h-4 w-4" />
                      Public Link
                    </Button>

                    {campaign.createdByAdmin ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label="More Actions"
                            className={`h-9 w-9 rounded-xl ${forcedControlClass}`}
                          >
                            <MoreHorizontal className="h-4.5 w-4.5" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-48 bg-white">
                          <DropdownMenuItem
                            asChild
                            className="cursor-pointer data-[highlighted]:!bg-[#EDEDED] data-[highlighted]:!text-slate-900 focus:!bg-[#EDEDED]"
                          >
                            <Link href={`/admin/youtube?id=${campaign.campaignId}`}>
                              Youtube Data
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </div>
                ),
              }}
              pagination={
                hasExtraFilters
                  ? undefined
                  : {
                      page,
                      totalPages,
                      totalItems: total,
                      limit: PAGE_LIMIT,
                      onPageChange: setPage,
                      loading,
                      showRowsSelector: false,
                      showSummary: true,
                    }
              }
              className="py-2"
              tableClassName="min-w-[1500px]"
              headerRowClassName="bg-slate-50/80"
            />
          </div>
        </div>
      </div>
    </div>
  );
}