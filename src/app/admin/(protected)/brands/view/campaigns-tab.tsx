"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Eye, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import AdminTable, { type AdminTableColumn } from "../../../components/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast, ToastStyles } from "@/components/ui/toast";
import type { Campaign } from "./types";
import { formatDate } from "./utils";
import { SectionCard, StatusPill } from "./shared";

type CampaignTypeFilter = "all" | "standard_campaign" | "fully_managed";
type DateRangeFilter =
  | "all_time"
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_15_days"
  | "last_30_days"
  | "this_month";

type CampaignCreatedBy = {
  role?: string;
  userId?: string;
  userModel?: string;
  email?: string;
  name?: string;
  adminRole?: string;
};

type CampaignWithApiFields = Campaign & {
  _id?: string;
  campaignId?: string;
  campaignsId?: string;

  campaignTitle?: string;
  campaignType?: string;
  campaignCategory?: string;
  campaignSubcategory?: string;

  startAt?: string;
  endAt?: string;
  createdAt?: string;
  updatedAt?: string;

  budget?: number;
  campaignBudget?: number;

  status?: string;
  publishStatus?: string;

  brandName?: string;
  createdBy?: CampaignCreatedBy;
  createdByAdmin?: CampaignCreatedBy | null;
};

const dateRangeOptions: Array<{ label: string; value: DateRangeFilter }> = [
  { label: "All Time", value: "all_time" },
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 Days", value: "last_7_days" },
  { label: "Last 15 Days", value: "last_15_days" },
  { label: "Last 30 Days", value: "last_30_days" },
  { label: "This Month", value: "this_month" },
];

const campaignTypeFilterOptions: CampaignTypeFilter[] = [
  "all",
  "standard_campaign",
  "fully_managed",
];

const validStatusFilters = [0, 1, 2] as const;

function normalize(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function getCampaignId(campaign: CampaignWithApiFields) {
  return campaign.campaignId || campaign.campaignsId || campaign._id || "";
}

function getCampaignName(campaign: CampaignWithApiFields) {
  return campaign.campaignTitle || campaign.productOrServiceName || "—";
}

function getCampaignType(campaign: CampaignWithApiFields) {
  return campaign.campaignType || campaign.goal || "—";
}

function getCampaignCategory(campaign: CampaignWithApiFields) {
  return campaign.campaignCategory || "—";
}

function getCampaignSubcategory(campaign: CampaignWithApiFields) {
  return campaign.campaignSubcategory || "";
}

function getStartDate(campaign: CampaignWithApiFields) {
  return campaign.timeline?.startDate || campaign.startAt || "";
}

function getEndDate(campaign: CampaignWithApiFields) {
  return campaign.timeline?.endDate || campaign.endAt || "";
}

function isCampaignTypeFilter(value: string): value is CampaignTypeFilter {
  return campaignTypeFilterOptions.includes(value as CampaignTypeFilter);
}

function isDateRangeFilter(value: string): value is DateRangeFilter {
  return dateRangeOptions.some((option) => option.value === value);
}

function isStatusFilter(value: number): value is 0 | 1 | 2 {
  return validStatusFilters.some((status) => status === value);
}

function getBackendErrorMessage(
  error: unknown,
  fallback = "Something went wrong."
): string {
  if (!error) return fallback;

  if (typeof error === "string") {
    const message = error.trim();

    if (!message) return fallback;

    try {
      const parsed = JSON.parse(message);
      return getBackendErrorMessage(parsed, fallback);
    } catch {
      return message;
    }
  }

  if (Array.isArray(error)) {
    const messages = error
      .map((item) => getBackendErrorMessage(item, ""))
      .filter(Boolean);

    return messages.join(", ") || fallback;
  }

  if (typeof error === "object") {
    const objectError = error as Record<string, unknown>;

    const directMessage =
      objectError.message ||
      objectError.error ||
      objectError.detail ||
      objectError.msg;

    if (directMessage) {
      return getBackendErrorMessage(directMessage, fallback);
    }

    if (objectError.errors) {
      return getBackendErrorMessage(objectError.errors, fallback);
    }

    const nestedMessages = Object.values(objectError)
      .map((item) => getBackendErrorMessage(item, ""))
      .filter(Boolean);

    return nestedMessages.join(", ") || fallback;
  }

  return String(error);
}

function isFullyManagedCampaign(campaign: CampaignWithApiFields) {
  const createdBy = campaign.createdBy || campaign.createdByAdmin || undefined;

  return (
    normalize(createdBy?.role) === "admin" ||
    normalize(createdBy?.userModel) === "master" ||
    Boolean(createdBy?.adminRole)
  );
}

function isActiveCampaign(campaign: CampaignWithApiFields) {
  return campaign.isActive === 1 || normalize(campaign.status) === "active";
}

function getStatusFilterMatch(
  campaign: CampaignWithApiFields,
  statusFilter: 0 | 1 | 2
) {
  if (statusFilter === 0) return true;
  if (statusFilter === 1) return isActiveCampaign(campaign);
  return !isActiveCampaign(campaign);
}

function isWithinDateRange(
  campaign: CampaignWithApiFields,
  range: DateRangeFilter
) {
  if (range === "all_time") return true;

  const rawDate = getStartDate(campaign) || campaign.createdAt || campaign.updatedAt;
  if (!rawDate) return false;

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfCampaignDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  if (range === "today") {
    return startOfCampaignDate.getTime() === startOfToday.getTime();
  }

  if (range === "yesterday") {
    const yesterday = new Date(startOfToday);
    yesterday.setDate(yesterday.getDate() - 1);
    return startOfCampaignDate.getTime() === yesterday.getTime();
  }

  if (range === "this_month") {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }

  const rangeDaysMap: Record<
    Exclude<DateRangeFilter, "all_time" | "today" | "yesterday" | "this_month">,
    number
  > = {
    last_7_days: 7,
    last_15_days: 15,
    last_30_days: 30,
  };

  const days = rangeDaysMap[range];
  const from = new Date(startOfToday);
  from.setDate(from.getDate() - days + 1);

  return date >= from && date <= now;
}

function formatMoney(value?: number) {
  const amount = Number(value || 0);
  if (!amount) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function FullyManagedBadge() {
  return (
    <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full border border-[#f4b400] bg-[#fff8e7] px-3 py-1 text-xs font-extrabold text-[#a35f00] shadow-sm">
      <Sparkles className="h-3.5 w-3.5 fill-[#f4b400] text-[#f4b400]" />
      Fully Managed
    </span>
  );
}

function CampaignTypeButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 rounded-lg border px-5 text-sm font-semibold transition ${
        active
          ? "border-black bg-black text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

export function BrandCampaignsTab({
  brandId,
  campaigns,
  loadingCampaigns,
  errorCampaigns,
  campaignsPage,
  campaignsTotalPages,
  setCampaignsPage,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  sortBy,
  sortAsc,
  toggleSort,
}: {
  brandId: string;
  campaigns: Campaign[];
  loadingCampaigns: boolean;
  errorCampaigns: string | null;
  campaignsPage: number;
  campaignsTotalPages: number;
  setCampaignsPage: React.Dispatch<React.SetStateAction<number>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  statusFilter: 0 | 1 | 2;
  setStatusFilter: React.Dispatch<React.SetStateAction<0 | 1 | 2>>;
  sortBy: keyof Campaign | "startDate" | "endDate" | "status";
  sortAsc: boolean;
  toggleSort: (key: keyof Campaign | "startDate" | "endDate" | "status") => void;
}) {
  const router = useRouter();

  const lastBackendErrorRef = useRef("");
  const brandIdErrorShownRef = useRef(false);

  const [campaignTypeFilter, setCampaignTypeFilter] =
    useState<CampaignTypeFilter>("all");
  const [dateRangeFilter, setDateRangeFilter] =
    useState<DateRangeFilter>("all_time");

  const campaignList = useMemo(
    () => campaigns as CampaignWithApiFields[],
    [campaigns]
  );

  const showErrorToast = useCallback((title: string, text?: string) => {
    toast({
      icon: "error",
      title,
      text,
      timer: 4500,
    });
  }, []);

  useEffect(() => {
    const backendMessage = getBackendErrorMessage(errorCampaigns, "");

    if (!backendMessage) return;
    if (lastBackendErrorRef.current === backendMessage) return;

    lastBackendErrorRef.current = backendMessage;

    toast({
      icon: "error",
      title: "Campaign Error",
      text: backendMessage,
      timer: 5000,
    });
  }, [errorCampaigns]);

  useEffect(() => {
    if (brandId?.trim()) {
      brandIdErrorShownRef.current = false;
      return;
    }

    if (brandIdErrorShownRef.current) return;

    brandIdErrorShownRef.current = true;

    showErrorToast(
      "Brand ID Missing",
      "Unable to identify this brand. Please refresh the page or open the brand again."
    );
  }, [brandId, showErrorToast]);

  const filteredCampaigns = useMemo(() => {
    const query = normalize(searchTerm);

    return campaignList.filter((campaign) => {
      const fullyManaged = isFullyManagedCampaign(campaign);

      const matchesType =
        campaignTypeFilter === "all" ||
        (campaignTypeFilter === "fully_managed" && fullyManaged) ||
        (campaignTypeFilter === "standard_campaign" && !fullyManaged);

      const matchesSearch =
        !query ||
        [
          getCampaignName(campaign),
          getCampaignType(campaign),
          getCampaignCategory(campaign),
          getCampaignSubcategory(campaign),
          campaign.brandName,
          campaign.status,
          campaign.publishStatus,
          campaign.createdBy?.name,
          campaign.createdBy?.email,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      return (
        matchesType &&
        matchesSearch &&
        getStatusFilterMatch(campaign, statusFilter) &&
        isWithinDateRange(campaign, dateRangeFilter)
      );
    });
  }, [campaignList, campaignTypeFilter, dateRangeFilter, searchTerm, statusFilter]);

  const resetFilters = () => {
    setSearchTerm("");
    setCampaignTypeFilter("all");
    setDateRangeFilter("all_time");
    setStatusFilter(0);
    setCampaignsPage(1);
  };

  const handleCampaignTypeFilterChange = (value: string) => {
    if (!isCampaignTypeFilter(value)) {
      showErrorToast(
        "Invalid Campaign Type",
        "Please select a valid campaign type filter."
      );
      return;
    }

    setCampaignTypeFilter(value);
    setCampaignsPage(1);
  };

  const handleDateRangeChange = (value: string) => {
    if (!isDateRangeFilter(value)) {
      showErrorToast(
        "Invalid Date Range",
        "Please select a valid date range filter."
      );
      return;
    }

    setDateRangeFilter(value);
    setCampaignsPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    const nextStatus = Number(value);

    if (!Number.isFinite(nextStatus) || !isStatusFilter(nextStatus)) {
      showErrorToast("Invalid Status", "Please select a valid status filter.");
      return;
    }

    setStatusFilter(nextStatus);
    setCampaignsPage(1);
  };

  const handleSearchChange = (value: string) => {
    if (typeof value !== "string") {
      showErrorToast("Invalid Search", "Search value must be valid text.");
      return;
    }

    setSearchTerm(value);
    setCampaignsPage(1);
  };

  const handleSort = (field: string) => {
    const allowedSortFields = [
      "productOrServiceName",
      "goal",
      "startDate",
      "endDate",
      "applicantCount",
      "status",
    ] as Array<keyof Campaign | "startDate" | "endDate" | "status">;

    if (!allowedSortFields.includes(field as any)) {
      showErrorToast(
        "Invalid Sort Field",
        "This column cannot be sorted right now."
      );
      return;
    }

    toggleSort(field as keyof Campaign | "startDate" | "endDate" | "status");
  };

  const handlePageChange = (page: number) => {
    const totalPages = Math.max(campaignsTotalPages || 1, 1);

    if (!Number.isFinite(page) || page < 1 || page > totalPages) {
      showErrorToast(
        "Invalid Page",
        `Please choose a page between 1 and ${totalPages}.`
      );
      return;
    }

    setCampaignsPage(page);
  };

  const handleOpenCampaign = (campaign: CampaignWithApiFields) => {
    const campaignId = getCampaignId(campaign).trim();

    if (!campaignId) {
      showErrorToast(
        "Campaign ID Missing",
        "This campaign cannot be opened because the backend did not return a valid campaign ID."
      );
      return;
    }

    router.push(`/admin/campaigns/view?id=${encodeURIComponent(campaignId)}`);
  };

  const columns = useMemo<AdminTableColumn<CampaignWithApiFields>[]>(
    () => [
      {
        id: "campaign",
        header: "Campaign",
        sortable: true,
        sortField: "productOrServiceName",
        widthClassName: "min-w-[280px]",
        render: (campaign) => (
          <div className="min-w-0">
            <p
              className="truncate text-sm font-black text-[#1a1a1a]"
              title={getCampaignName(campaign)}
            >
              {getCampaignName(campaign)}
            </p>

            {isFullyManagedCampaign(campaign) ? <FullyManagedBadge /> : null}
          </div>
        ),
      },
      {
        id: "type",
        header: "Type",
        sortable: true,
        sortField: "goal",
        widthClassName: "min-w-[170px]",
        render: (campaign) => (
          <span className="text-sm font-semibold text-black/65">
            {getCampaignType(campaign)}
          </span>
        ),
      },
      {
        id: "category",
        header: "Category",
        widthClassName: "min-w-[220px]",
        render: (campaign) => (
          <div>
            <p className="text-sm font-semibold text-black/65">
              {getCampaignCategory(campaign)}
            </p>

            {getCampaignSubcategory(campaign) ? (
              <p className="mt-1 text-xs font-semibold text-black/40">
                {getCampaignSubcategory(campaign)}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        id: "startDate",
        header: "Start",
        sortable: true,
        sortField: "startDate",
        align: "center",
        widthClassName: "min-w-[130px]",
        render: (campaign) => (
          <span className="text-sm font-semibold text-black/60">
            {formatDate(getStartDate(campaign))}
          </span>
        ),
      },
      {
        id: "endDate",
        header: "End",
        sortable: true,
        sortField: "endDate",
        align: "center",
        widthClassName: "min-w-[130px]",
        render: (campaign) => (
          <span className="text-sm font-semibold text-black/60">
            {formatDate(getEndDate(campaign))}
          </span>
        ),
      },
      {
        id: "budget",
        header: "Budget",
        align: "right",
        widthClassName: "min-w-[130px]",
        render: (campaign) => (
          <span className="text-sm font-black text-[#1a1a1a]">
            {formatMoney(campaign.campaignBudget || campaign.budget)}
          </span>
        ),
      },
      {
        id: "applicants",
        header: "Applicants",
        sortable: true,
        sortField: "applicantCount",
        align: "center",
        widthClassName: "min-w-[120px]",
        render: (campaign) => (
          <span className="inline-flex min-w-[40px] items-center justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">
            {campaign.applicantCount ?? 0}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        sortable: true,
        sortField: "status",
        align: "center",
        widthClassName: "min-w-[130px]",
        render: (campaign) =>
          isActiveCampaign(campaign) ? (
            <StatusPill label="Active" tone="success" />
          ) : (
            <StatusPill label="Inactive" tone="warning" />
          ),
      },
    ],
    []
  );

  return (
    <>
      <ToastStyles />

      <SectionCard
        title="Campaigns"
        description="Manage campaigns created for this brand."
      >
        <div className="space-y-5 p-5">
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-5">
              <h3 className="text-2xl font-black tracking-[-0.03em] text-slate-900">
                Filters
              </h3>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Affects the campaign table below only
              </p>
            </div>

            <div className="grid gap-4 px-5 py-6 xl:grid-cols-[1.2fr_1.7fr_0.7fr_0.7fr_auto] xl:items-end">
              <div>
                <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Search
                </p>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search .."
                    value={searchTerm}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    className="h-11 rounded-lg border-slate-200 bg-white pl-11 text-sm font-semibold text-slate-700 shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>

              <div>
                <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Campaign Type
                </p>
                <div className="flex flex-wrap gap-2">
                  <CampaignTypeButton
                    active={campaignTypeFilter === "all"}
                    onClick={() => handleCampaignTypeFilterChange("all")}
                  >
                    All
                  </CampaignTypeButton>

                  <CampaignTypeButton
                    active={campaignTypeFilter === "standard_campaign"}
                    onClick={() =>
                      handleCampaignTypeFilterChange("standard_campaign")
                    }
                  >
                    Standard Campaign
                  </CampaignTypeButton>

                  <CampaignTypeButton
                    active={campaignTypeFilter === "fully_managed"}
                    onClick={() =>
                      handleCampaignTypeFilterChange("fully_managed")
                    }
                  >
                    Fully Managed Campaign
                  </CampaignTypeButton>
                </div>
              </div>

              <div>
                <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Date Range
                </p>
                <Select
                  value={dateRangeFilter}
                  onValueChange={handleDateRangeChange}
                >
                  <SelectTrigger className="h-11 rounded-lg border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-none focus:ring-0">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {dateRangeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Status
                </p>
                <Select
                  value={statusFilter.toString()}
                  onValueChange={handleStatusFilterChange}
                >
                  <SelectTrigger className="h-11 rounded-lg border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-none focus:ring-0">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="0">All Status</SelectItem>
                    <SelectItem value="1">Active</SelectItem>
                    <SelectItem value="2">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetFilters}
                  className="h-11 rounded-lg border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-l border border-black/10 bg-white">
            <AdminTable<CampaignWithApiFields>
              data={filteredCampaigns}
              columns={columns}
              rowKey={(campaign, index) =>
                getCampaignId(campaign) || `${getCampaignName(campaign)}-${index}`
              }
              loading={loadingCampaigns}
              loadingRows={6}
              error={null}
              emptyTitle={
                errorCampaigns ? "Unable to load campaigns" : "No campaigns found"
              }
              emptyDescription={
                errorCampaigns
                  ? "Backend error is shown in the toast. Please try again."
                  : "Try adjusting the filters or create a new campaign for this brand."
              }
              sortBy={String(sortBy)}
              sortOrder={sortAsc ? "asc" : "desc"}
              onSort={handleSort}
              tableClassName="bg-white"
              actions={{
                header: "Open",
                align: "right",
                cellClassName: "min-w-[110px]",
                render: (campaign) => (
                  <Button
                    size="sm"
                    disabled={loadingCampaigns}
                    className="rounded-full bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => handleOpenCampaign(campaign)}
                  >
                    <Eye className="h-4 w-3" />
                    View
                  </Button>
                ),
              }}
              pagination={
                campaignsTotalPages > 1
                  ? {
                      page: campaignsPage,
                      totalPages: campaignsTotalPages,
                      totalItems:
                        campaignsTotalPages * Math.max(campaignList.length, 1),
                      limit: Math.max(campaignList.length, 10),
                      onPageChange: handlePageChange,
                      loading: loadingCampaigns,
                      showRowsSelector: false,
                      showSummary: false,
                    }
                  : undefined
              }
            />
          </div>
        </div>
      </SectionCard>
    </>
  );
}