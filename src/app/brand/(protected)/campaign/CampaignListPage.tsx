"use client";

import React, { useEffect, useMemo, useState } from "react";

import BrandCampaignCard, {
  BrandCampaignCardSkeleton,
} from "@/components/ui/brand/card";
import { Button } from "@/components/ui/buttonComp";
import { PencilSimple } from "@phosphor-icons/react";

import type {
  CampaignStatus,
  CategoryDoc,
  EnrichedCampaignDoc,
} from "@/app/brand/services/brandApi";
import {
  apiCampaignGetByBrand,
  getApiErrorMessage,
  apiGetAllCategories,
} from "@/app/brand/services/brandApi";

import {
  scheduleOrExpiryText,
  statusLabel,
  statusToVariant,
} from "@/utils/campaignUi";
import ListCardView, {
  MetricIcons,
  type ListCardViewItem,
} from "@/components/ui/brand/list";

import CampaignFilter, {
  DEFAULT_DATE_FILTER,
  type DateFilterValue,
  type SelectOption,
} from "./CampaignFilter";
import CampaignCardMenu from "@/components/ui/brand/campaign-card-menu";

type Props = {
  title: string;
  fixedStatus?: CampaignStatus;
};

type ViewMode = "grid" | "list";
type DateField =
  | "createdAt"
  | "updatedAt"
  | "startAt"
  | "endAt"
  | "publishedAt";

const FULLY_MANAGED_PLAN_ID = "e5cb75da-6d0d-481b-b202-69b9cf864940";
const LOCK_TOOLTIP = "Upgrade plan to Fully Managed to access";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDDMMYYYY(d: Date) {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Accepts dd/mm/yyyy, yyyy-mm-dd, or iso datetime strings */
function parseLooseDate(s: string): Date | undefined {
  if (!s) return undefined;
  const cleaned = String(s).trim();
  if (!cleaned) return undefined;

  const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const m = Number(isoMatch[2]);
    const d = Number(isoMatch[3]);
    const out = new Date(y, m - 1, d);
    return isNaN(out.getTime()) ? undefined : out;
  }

  const parts = cleaned.split(/[\/-]/).map(Number);
  if (parts.length === 3) {
    const [a, b, c] = parts;
    const out = a > 31 ? new Date(a, b - 1, c) : new Date(c, b - 1, a);
    return isNaN(out.getTime()) ? undefined : out;
  }

  return undefined;
}

function firstImage(c: any): string | undefined {
  if (c?.productImage) return c.productImage;
  const arr = c?.productImages;
  if (!Array.isArray(arr) || !arr[0]) return undefined;
  const v = arr[0];
  if (typeof v === "string") return v;
  return (
    v?.url ??
    v?.src ??
    v?.image ??
    v?.dataUrl ??
    v?.dataurl ??
    v?.data?.url ??
    undefined
  );
}

function formatBudget(value: any): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("en-IN");
}

function normalizeMongoId(id: any): string {
  if (id == null) return "";
  if (typeof id === "string" || typeof id === "number") return String(id);
  if (typeof id === "object") {
    if (typeof (id as any).toHexString === "function") {
      return (id as any).toHexString();
    }
    if (typeof (id as any).$oid === "string") return (id as any).$oid;
    if (typeof (id as any).oid === "string") return (id as any).oid;
    if (typeof (id as any).id !== "undefined") return String((id as any).id);
    if (typeof (id as any).value !== "undefined") {
      return String((id as any).value);
    }
    if ((id as any)._id != null) return normalizeMongoId((id as any)._id);
    if (typeof (id as any).toString === "function") {
      const s = (id as any).toString();
      if (s && s !== "[object Object]") return s;
    }
  }
  return "";
}

function isAdminCreated(c: any): boolean {
  const role = String(c?.createdBy?.role ?? "").trim().toLowerCase();
  const userModel = String(c?.createdBy?.userModel ?? "")
    .trim()
    .toLowerCase();

  return (
    role === "admin" ||
    Boolean(c?.byAdmin) ||
    Boolean(c?.isAdminCampaign) ||
    Boolean(c?.createdBy?.isAdmin) ||
    (role === "brand" &&
      userModel === "brand" &&
      (Boolean(c?.isFullyManaged) || Boolean(c?.fullyManaged)))
  );
}

function isFullyManagedCampaign(c: any): boolean {
  const managementType = String(c?.managementType ?? "")
    .trim()
    .toLowerCase();

  return (
    isAdminCreated(c) ||
    Boolean(c?.isFullyManaged) ||
    Boolean(c?.fullyManaged) ||
    managementType === "fully_managed" ||
    managementType === "fully managed"
  );
}

function LockedShell({
  locked,
  children,
  radiusClass = "rounded-[1rem]",
}: {
  locked: boolean;
  children: React.ReactNode;
  radiusClass?: string;
}) {
  const [showTip, setShowTip] = React.useState(false);
  const hideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const showTooltip = () => {
    if (!locked) return;
    clearHideTimer();
    setShowTip(true);
  };

  const hideTooltip = () => {
    clearHideTimer();
    setShowTip(false);
  };

  const showTooltipOnClick = () => {
    if (!locked) return;
    clearHideTimer();
    setShowTip(true);

    hideTimerRef.current = setTimeout(() => {
      setShowTip(false);
    }, 1400);
  };

  React.useEffect(() => {
    return () => clearHideTimer();
  }, []);

  return (
    <div
      className={`relative h-full min-w-0 ${locked ? "cursor-pointer" : ""}`}
      aria-disabled={locked || undefined}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      onClick={showTooltipOnClick}
    >
      {locked ? (
        <div
          className={`pointer-events-none absolute left-1/2 top-2 z-30 -translate-x-1/2 transition-all duration-100 ${showTip
            ? "translate-y-0 opacity-100"
            : "-translate-y-1 opacity-0"
            }`}
        >
          <div className="rounded-full border border-white/20 bg-black/15 px-3 py-1.5 text-[15px] font-medium text-black shadow-lg whitespace-nowrap">
            {LOCK_TOOLTIP}
          </div>
        </div>
      ) : null}

      <div
        className={`relative h-full ${radiusClass} ${locked ? "overflow-hidden" : ""}`}
      >
        <div
          className={
            locked
              ? "pointer-events-none h-full select-none blur-[1.25px] opacity-75"
              : "h-full"
          }
        >
          {children}
        </div>

        {locked ? (
          <div
            className={`absolute inset-[1px] flex items-center justify-center ${radiusClass} bg-black/5 backdrop-blur-[1px]`}
          >
            <div className="pointer-events-none rounded-full border border-white/20 bg-black/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow">
              Locked
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Convert UI DateFilterValue into backend payload fields:
 * Supported backend presets:
 * today, last7days, last30days, thisweek, thismonth, launchingSoon
 */
function resolveDateParams(df: DateFilterValue): {
  datePreset?: string;
  dateField?: DateField;
  dateFrom?: string;
  dateTo?: string;
} {
  switch (df.quickFilter) {
    case "launching_soon":
      return { datePreset: "launchingSoon" };

    case "today":
      return { dateField: "createdAt", datePreset: "today" };

    case "this_week":
      return { dateField: "createdAt", datePreset: "thisweek" };

    case "this_month":
      return { dateField: "createdAt", datePreset: "thismonth" };

    case "recently_edited":
      return { dateField: "updatedAt", datePreset: "last7days" };

    default:
      break;
  }

  const presetMap: Record<string, string> = {
    last_7: "last7days",
    last_30: "last30days",
  };

  if (
    df.allDatesOption &&
    df.allDatesOption !== "all" &&
    presetMap[df.allDatesOption]
  ) {
    return {
      dateField: "updatedAt",
      datePreset: presetMap[df.allDatesOption],
    };
  }

  if (df.startDate || df.endDate) {
    const from = df.startDate ? parseLooseDate(df.startDate) : undefined;
    const to = df.endDate ? parseLooseDate(df.endDate) : undefined;

    return {
      dateField: "createdAt",
      dateFrom: from ? formatDDMMYYYY(from) : undefined,
      dateTo: to ? formatDDMMYYYY(to) : undefined,
    };
  }

  return {};
}

function canShowEditCampaign(c: any) {
  const status = String(c?.status ?? "").trim().toLowerCase();

  if (status === "draft") return true;

  if (status === "active" || status === "scheduled") {
    const startAtRaw = c?.startAt;
    if (!startAtRaw) return true;

    const startAt = new Date(startAtRaw);
    if (Number.isNaN(startAt.getTime())) return true;

    const now = new Date();
    return startAt.getTime() > now.getTime();
  }

  return false;
}

function campaignFooterText(c: any) {
  const status = String(c?.status ?? "").trim().toLowerCase();
  const scheduleIn = c?.scheduleIn;

  if (status === "completed" || status === "complete") {
    return "Campaign Completed";
  }

  if (status === "scheduled" && scheduleIn) {
    const unit = String(scheduleIn?.unit ?? "").toLowerCase();
    const value = Number(scheduleIn?.value ?? 0);
    const text = String(scheduleIn?.text ?? "").trim();

    if (text) {
      if (unit === "seconds") return text;
      if (unit === "minutes") return text;
      if (unit === "hours" && value < 24) return text;
      if (unit === "days") return text;
    }

    if (Number.isFinite(value)) {
      if (unit === "seconds") return `${value}s left`;
      if (unit === "minutes") return `${value}m left`;
      if (unit === "hours") {
        return value < 24 ? `${value}h left` : `${Math.ceil(value / 24)}d left`;
      }
      if (unit === "days") return `${value}d left`;
    }
  }

  return scheduleOrExpiryText(c?.status, c?.startAt ?? null, c?.endAt ?? null);
}

function allImages(c: any): string[] {
  const out: string[] = [];

  if (c?.productImage && typeof c.productImage === "string") {
    out.push(c.productImage);
  }

  const arr = c?.productImages;
  if (Array.isArray(arr)) {
    for (const v of arr) {
      if (typeof v === "string") {
        out.push(v);
        continue;
      }

      const src =
        v?.url ??
        v?.src ??
        v?.image ??
        v?.dataUrl ??
        v?.dataurl ??
        v?.data?.url ??
        undefined;

      if (src) out.push(src);
    }
  }

  return Array.from(new Set(out.filter(Boolean)));
}


function PlatformMiniIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <rect x="1.25" y="3" width="10.5" height="7" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5.25 5.1L8.15 6.5L5.25 7.9V5.1Z" fill="currentColor" />
    </svg>
  );
}

function ContractMiniIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M3.15 1.65H7.4L10.05 4.3V11.25H3.15V1.65Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M7.3 1.65V4.45H10.05" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M4.7 7.05H8.35M4.7 9H8.35" stroke="currentColor" strokeWidth="1.05" strokeLinecap="round" />
    </svg>
  );
}

function InfluencerMiniIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M5.1 6.55C6.35 6.55 7.35 5.55 7.35 4.3C7.35 3.05 6.35 2.05 5.1 2.05C3.85 2.05 2.85 3.05 2.85 4.3C2.85 5.55 3.85 6.55 5.1 6.55Z" stroke="currentColor" strokeWidth="1.15" />
      <path d="M1.9 11.6C2.25 9.65 3.45 8.55 5.1 8.55C6.75 8.55 7.95 9.65 8.3 11.6" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
      <path d="M9 6.45C10 6.35 10.75 5.52 10.75 4.5C10.75 3.67 10.25 2.95 9.55 2.65" stroke="currentColor" strokeWidth="1.05" strokeLinecap="round" />
      <path d="M9.3 8.75C10.72 9.05 11.65 10.05 11.95 11.55" stroke="currentColor" strokeWidth="1.05" strokeLinecap="round" />
    </svg>
  );
}

function WalletMiniIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M2.05 3.35H10.45C11.05 3.35 11.55 3.85 11.55 4.45V9.5C11.55 10.1 11.05 10.6 10.45 10.6H2.05C1.45 10.6 0.95 10.1 0.95 9.5V4.45C0.95 3.85 1.45 3.35 2.05 3.35Z" stroke="currentColor" strokeWidth="1.15" />
      <path d="M2.55 3.35L8.45 2.05" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
      <path d="M8.55 7H11.55" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
      <circle cx="8.55" cy="7" r="0.55" fill="currentColor" />
    </svg>
  );
}

function ChevronDownMiniIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <path d="M3 4.35L5.5 6.85L8 4.35" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const GRID_WRAP = "mx-auto w-full max-w-[100vw]";
const CARD_GRID =
  "grid w-full min-w-0 auto-rows-fr gap-[clamp(12px,2vw,24px)] " +
  "[grid-template-columns:repeat(auto-fit,minmax(min(100%,22rem),1fr))]";

export default function CampaignListPage({
  title,
  fixedStatus,
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [brandId, setBrandId] = useState<string>("");
  const [brandPlanId, setBrandPlanId] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id =
      window.localStorage.getItem("brandId") ||
      window.localStorage.getItem("brandID") ||
      window.localStorage.getItem("brand_id") ||
      "";
    setBrandId(id);
  }, []);

  const [campaignType, setCampaignType] = useState<string>("");
  const [creatorStatus, setCreatorStatus] = useState<string>("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [dateFilter, setDateFilter] =
    useState<DateFilterValue>(DEFAULT_DATE_FILTER);
  const [aiCreated, setAiCreated] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedFixedStatus = String(fixedStatus ?? "").trim().toLowerCase();
  const showCreatorStatusFilter =
    normalizedFixedStatus !== "draft" && normalizedFixedStatus !== "scheduled";

  const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([]);
  const [catLoading, setCatLoading] = useState(false);

  const [items, setItems] = useState<EnrichedCampaignDoc[]>([]);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errMsg, setErrMsg] = useState<string>("");
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const hasFullyManagedAccess = useMemo(() => {
    return brandPlanId === FULLY_MANAGED_PLAN_ID;
  }, [brandPlanId]);

  const isCampaignLocked = (c: any) => {
    return isFullyManagedCampaign(c) && !hasFullyManagedAccess;
  };

  const filteredItems = useMemo(() => {
    return items.filter((c: any) => {
      const applicantCount = Number(c.applicantCount ?? 0);
      const acceptedCount = Number(c.acceptedContracts ?? 0);

      if (creatorStatus === "applied") return applicantCount > 0;
      if (creatorStatus === "approved") return acceptedCount > 0;

      return true;
    });
  }, [items, creatorStatus]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncBrandPlanId = () => {
      setBrandPlanId(window.localStorage.getItem("brandPlanId") || "");
    };

    syncBrandPlanId();

    window.addEventListener("storage", syncBrandPlanId);
    window.addEventListener("focus", syncBrandPlanId);

    return () => {
      window.removeEventListener("storage", syncBrandPlanId);
      window.removeEventListener("focus", syncBrandPlanId);
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (
      !showCreatorStatusFilter &&
      creatorStatus !== "all" &&
      creatorStatus !== ""
    ) {
      setCreatorStatus("all");
    }
  }, [showCreatorStatusFilter, creatorStatus]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setCatLoading(true);
      try {
        const cats: CategoryDoc[] = await apiGetAllCategories();
        if (cancelled) return;

        const opts = (cats ?? [])
          .map((c) => {
            const rawId =
              (c as any)?._id ?? (c as any)?.id ?? (c as any)?.categoryId;
            const value = normalizeMongoId(rawId);
            return { value, label: String((c as any)?.name ?? "") };
          })
          .filter(
            (o) =>
              o.value &&
              o.value !== "[object Object]" &&
              o.value !== "undefined" &&
              o.value !== "null"
          );

        const deduped: SelectOption[] = [];
        const seen = new Set<string>();
        for (const o of opts) {
          if (seen.has(o.value)) continue;
          seen.add(o.value);
          deduped.push(o);
        }

        setCategoryOptions(deduped);
      } catch {
        if (!cancelled) setCategoryOptions([]);
      } finally {
        if (!cancelled) setCatLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  const dateFilterKey = [
    dateFilter.quickFilter,
    dateFilter.allDatesOption,
    dateFilter.startDate,
    dateFilter.endDate,
  ].join("|");

  useEffect(() => {
    setItems([]);
    setPage(1);
    setTotalPages(1);
    setHasMore(true);
    setErrMsg("");
    setHasLoadedOnce(false);
  }, [
    brandId,
    fixedStatus,
    searchQuery,
    campaignType,
    creatorStatus,
    aiCreated,
    categoryIds.join(","),
    dateFilterKey,
  ]);

  const dateParams = useMemo(() => resolveDateParams(dateFilter), [dateFilter]);

  const payload = useMemo(() => {
    const base: any = {
      brandId,
      page,
      limit,
      search: searchQuery || undefined,
      status: fixedStatus,
      byAi: aiCreated ? 1 : undefined,
    };

    if (dateParams.datePreset) base.datePreset = dateParams.datePreset;
    if (dateParams.dateField) base.dateField = dateParams.dateField;
    if (dateParams.dateFrom) base.dateFrom = dateParams.dateFrom;
    if (dateParams.dateTo) base.dateTo = dateParams.dateTo;

    if (campaignType && campaignType !== "all") {
      base.campaignType = campaignType;
    }
    if (creatorStatus && creatorStatus !== "all") {
      base.creatorStatus = creatorStatus;
    }
    if (categoryIds.length === 1) base.categoryId = categoryIds[0];
    if (categoryIds.length > 1) base.categoryIds = categoryIds;

    return base;
  }, [
    brandId,
    page,
    limit,
    searchQuery,
    fixedStatus,
    campaignType,
    creatorStatus,
    categoryIds,
    aiCreated,
    dateParams,
  ]);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      if (!brandId) {
        setErrMsg("Brand ID is required.");
        setHasLoadedOnce(true);
        setItems([]);
        setHasMore(false);
        return;
      }

      const isFirstPage = page === 1;
      if (isFirstPage) setLoading(true);
      else setLoadingMore(true);
      setErrMsg("");

      try {
        const res = await apiCampaignGetByBrand(payload);
        if (cancelled) return;

        setHasLoadedOnce(true);
        const nextItems = (res?.items ?? []) as EnrichedCampaignDoc[];
        const tp = res?.meta?.totalPages;

        if (typeof tp === "number" && tp > 0) {
          setTotalPages(tp);
          setHasMore(page < tp);
        } else {
          setHasMore(nextItems.length === limit);
        }

        setItems((prev) => {
          if (isFirstPage) return nextItems;
          const existing = new Set(
            prev.map((x: any) => normalizeMongoId(x.campaignId ?? x._id ?? x.id))
          );
          return [
            ...prev,
            ...nextItems.filter(
              (x: any) =>
                !existing.has(normalizeMongoId(x.campaignId ?? x._id ?? x.id))
            ),
          ];
        });
      } catch (e) {
        if (cancelled) return;
        setHasLoadedOnce(true);
        setErrMsg(getApiErrorMessage(e, "Failed to load campaigns"));
        if (page === 1) setItems([]);
      } finally {
        if (cancelled) return;
        if (page === 1) setLoading(false);
        else setLoadingMore(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [payload, brandId, page, limit]);

  const renderGridCard = (c: any) => {
    const footerText = campaignFooterText(c);
    const locked = isCampaignLocked(c);
    const fullyManaged = isFullyManagedCampaign(c);

    const campaignId = normalizeMongoId(c.campaignId ?? c._id ?? c.id);
    const campaignTitle = c.campaignTitle ?? "Untitled Campaign";
    const viewHref = `/brand/campaign/${encodeURIComponent(
      campaignTitle
    )}?id=${encodeURIComponent(campaignId)}`;
    const inviteHref = `/brand/browse-influencer`;
    const showEditButton = canShowEditCampaign(c);
    const applicantCount = c.applicantCount ?? 0;
    const acceptedCount = c.acceptedContracts ?? 0;
    const totalInfluencers = c.numberOfInfluencers ?? 0;
    const campaignBudget = c.campaignBudget ?? 0;
    const imageUrls = allImages(c);
    const platforms = ((c.platformSelection ?? []) as string[]);
    const platformCount = platforms.length;
    const platformDisplay = platformCount > 1 ? `+${platformCount}` : platformCount;

    const goToInfluencers = () => {
      if (locked) return;
      if (typeof window !== "undefined") {
        window.location.href = `/brand/influ/active?campaignId=${encodeURIComponent(
          campaignId
        )}`;
      }
    };

    const goToApplied = () => {
      if (locked) return;
      if (typeof window !== "undefined") {
        window.location.href = `/brand/influ/all?campaignId=${encodeURIComponent(
          campaignId
        )}`;
      }
    };

    const handleView = () => {
      if (locked) return;
      if (typeof window !== "undefined") {
        window.location.href = viewHref;
      }
    };

    const handleEdit = () => {
      if (locked) return;
      if (typeof window !== "undefined") {
        window.location.href = `/brand/create-campaign?campaignId=${encodeURIComponent(
          campaignId
        )}`;
      }
    };

    if (fullyManaged) {
      const metricLabelClass =
        "text-[14px] font-normal leading-none text-[#858585] max-[420px]:text-[12.5px]";
      const metricTextClass =
        "mt-[9px] inline-flex min-w-0 items-center gap-[4px] text-[15px] font-semibold leading-none text-[#151515] no-underline max-[420px]:text-[13px]";
      const metricIconClass = "shrink-0 text-[#9A9A9A]";
      const fullyManagedBudget = Number.isFinite(Number(campaignBudget))
        ? String(Number(campaignBudget))
        : String(campaignBudget ?? 0);

      return (
        <LockedShell
          key={campaignId}
          locked={locked}
          radiusClass="rounded-[17px]"
        >
          <article className="relative h-full min-h-[354px] w-full overflow-hidden rounded-[17px] border border-[#D9A342] bg-white shadow-none">
            <div
              className="absolute right-0 top-0 z-20 flex h-[30px] w-[116px] items-center justify-center rounded-tr-[17px] pl-[16px] text-[12px] font-medium leading-none text-white [clip-path:polygon(27px_0,100%_0,100%_100%,0_100%)]"
              style={{
                background:
                  "linear-gradient(94deg, rgba(244, 211, 115, 0.00) 0.49%, #F4D373 12.4%, #7A501A 87.66%)",
              }}
            >
              Fully Managed
            </div>

            <div className="relative px-[17px] pt-[21px] pb-[112px]">
              <div className="flex min-w-0 items-start gap-[12px] pr-[126px]">
                <div className="h-[44px] w-[44px] shrink-0 overflow-hidden rounded-[7px] bg-[#0B0B0B]">
                  {imageUrls[0] ? (
                    <img
                      src={imageUrls[0]}
                      alt="Product image"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[17px] font-bold uppercase text-white">
                      {String(campaignTitle).charAt(0) || "C"}
                    </div>
                  )}
                </div>

                <h3 className="min-w-0 text-[16px] font-semibold leading-[1.28] text-[#151515] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
                  {campaignTitle}
                </h3>
              </div>

              <div className="absolute right-[12px] top-[42px] z-30 flex items-center gap-[6px] text-[#8E8E8E]">
                <span className="h-[7px] w-[7px] rounded-full bg-[#21B44B]" />
                <span className="text-[15px] font-normal leading-none">
                  {statusLabel(c.status)}
                </span>
                <ChevronDownMiniIcon />
                {locked ? null : (
                  <div className="-ml-[1px] flex h-[21px] items-center">
                    <CampaignCardMenu viewHref={viewHref} inviteHref={inviteHref} />
                  </div>
                )}
              </div>

              <div className="mt-[26px]">
                <span className="inline-flex h-[25px] items-center rounded-full bg-[#F7F7F7] px-[10px] text-[12px] font-normal leading-none text-[#686868]">
                  {c.category?.name || "No Category"}
                </span>
              </div>

              <div className="mt-[29px] grid min-w-0 grid-cols-4 gap-x-[14px] max-[420px]:gap-x-[8px]">
                <div className="min-w-0 text-left">
                  <div className={metricLabelClass}>Platform</div>
                  <div className={metricTextClass}>
                    <span className={metricIconClass}>
                      <PlatformMiniIcon />
                    </span>
                    <span className="min-w-0 truncate">{platformDisplay}</span>
                  </div>
                </div>

                <div className="min-w-0 text-left">
                  <div className={metricLabelClass}>Applied</div>
                  <button
                    type="button"
                    onClick={goToApplied}
                    disabled={locked}
                    className={`${metricTextClass} ${locked ? "cursor-default" : "cursor-pointer hover:underline"}`}
                  >
                    <span className={metricIconClass}>
                      <ContractMiniIcon />
                    </span>
                    <span className="min-w-0 truncate">{applicantCount}</span>
                  </button>
                </div>

                <div className="min-w-0 text-left">
                  <div className={metricLabelClass}>Influencer</div>
                  <button
                    type="button"
                    onClick={goToInfluencers}
                    disabled={locked}
                    className={`${metricTextClass} ${locked ? "cursor-default" : "cursor-pointer hover:underline"}`}
                  >
                    <span className={metricIconClass}>
                      <InfluencerMiniIcon />
                    </span>
                    <span className="min-w-0 truncate">{acceptedCount}/{totalInfluencers}</span>
                  </button>
                </div>

                <div className="min-w-0 text-left">
                  <div className={metricLabelClass}>Budget</div>
                  <div className={metricTextClass}>
                    <span className={metricIconClass}>
                      <WalletMiniIcon />
                    </span>
                    <span className="min-w-0 truncate">${fullyManagedBudget}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 border-t border-[#EFEFEF] px-[29px] pb-[13px] pt-[15px]">
              <div className="flex w-full items-center gap-[8px]">
                <button
                  type="button"
                  className="h-[40px] min-w-0 flex-1 rounded-[7px] border border-[#E5E5E5] bg-white px-3 text-[13px] font-semibold text-[#202020] shadow-none transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleView}
                  disabled={locked}
                >
                  View Campaign
                </button>

                {showEditButton ? (
                  <button
                    type="button"
                    className="flex h-[40px] w-[42px] shrink-0 items-center justify-center rounded-[7px] border border-[#E5E5E5] bg-white text-[#191919] shadow-none transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleEdit}
                    aria-label="Edit campaign"
                    disabled={locked}
                  >
                    <PencilSimple size={17} weight="regular" />
                  </button>
                ) : null}
              </div>

              <div className="mt-[10px] text-center text-[11.5px] font-normal leading-none text-[#9A9A9A]">
                {locked ? LOCK_TOOLTIP : footerText}
              </div>
            </div>
          </article>
        </LockedShell>
      );
    }

    const edgeBadges = [
      ...(isAdminCreated(c)
        ? [
            {
              label: "By Admin",
              className: "border-[#D7E3FF] bg-[#EEF4FF] text-[#2F5BFF]",
            },
          ]
        : []),
    ];

    return (
      <LockedShell key={campaignId} locked={locked} radiusClass="rounded-[1rem]">
        <BrandCampaignCard
          className="h-full min-w-0"
          size="md"
          logoUrl={imageUrls[0] || ""}
          logoUrls={imageUrls}
          logoAriaLabel="Product image"
          name={c.campaignTitle}
          statusLabel={statusLabel(c.status)}
          statusVariant={statusToVariant(c.status)}
          edgeBadges={edgeBadges}
          headerRight={
            locked ? null : (
              <CampaignCardMenu viewHref={viewHref} inviteHref={inviteHref} />
            )
          }
          tags={[c.category?.name || "No Category"]}
          stats={[
            {
              label: "Platform",
              value: platformCount,
            },
            {
              label: "Budget",
              value: `$${formatBudget(campaignBudget)}`,
            },
            {
              label: "Applicants",
              value: (
                <button
                  type="button"
                  onClick={goToApplied}
                  className="cursor-pointer text-primary hover:underline"
                >
                  {applicantCount}
                </button>
              ),
            },
            {
              label: "Creators",
              value: (
                <button
                  type="button"
                  onClick={goToInfluencers}
                  className="cursor-pointer text-primary hover:underline"
                >
                  {acceptedCount}/{totalInfluencers}
                </button>
              ),
            },
          ]}
          footer={
            <>
              <div className="flex w-full items-center gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-[0.75rem] border-border shadow-none"
                  onClick={handleView}
                  disabled={locked}
                >
                  View Campaign
                </Button>

                {showEditButton ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-[2.85rem] w-[2.65rem] rounded-[0.75rem] border-border px-0 shadow-none"
                    onClick={handleEdit}
                    aria-label="Edit campaign"
                    disabled={locked}
                  >
                    <PencilSimple size={18} weight="regular" />
                  </Button>
                ) : null}
              </div>

              <div className="text-xs text-muted-foreground">
                {locked ? LOCK_TOOLTIP : footerText}
              </div>
            </>
          }
        />
      </LockedShell>
    );
  };

  const listItems: ListCardViewItem[] = useMemo(() => {
    return filteredItems.map((c: any) => {
      const locked = isCampaignLocked(c);
      const platforms = (c.platformSelection ?? []) as string[];
      const campaignId = normalizeMongoId(c.campaignId ?? c._id ?? c.id);
      const campaignTitle = c.campaignTitle ?? "Untitled Campaign";
      const viewHref = `/brand/campaign/${encodeURIComponent(
        campaignTitle
      )}?id=${encodeURIComponent(campaignId)}`;
      const inviteHref = `/brand/browse-influencer`;
      const showEditButton = canShowEditCampaign(c);
      const applicantCount = c.applicantCount ?? 0;
      const acceptedCount = c.acceptedContracts ?? 0;
      const totalInfluencers = c.numberOfInfluencers ?? 0;
      const campaignBudget = c.campaignBudget ?? 0;


      const handleView = () => {
        if (locked) return;
        if (typeof window !== "undefined") {
          window.location.href = viewHref;
        }
      };

      const handleEdit = () => {
        if (locked) return;
        if (typeof window !== "undefined") {
          window.location.href = `/brand/create-campaign?campaignId=${encodeURIComponent(
            campaignId
          )}`;
        }
      };

      return {
        key: campaignId,
        logoSrc: firstImage(c),
        logoImages: allImages(c),
        logoAlt: "Product image",
        name: c.campaignTitle,
        badges: [
          c.category?.name || "No Category",
          ...(isAdminCreated(c) ? ["By Admin"] : []),
          ...(isFullyManagedCampaign(c) ? ["Fully Managed"] : []),
        ],
        metrics: [
          {
            id: "platform",
            label: "Platform",
            value: platforms.length,
            icon: MetricIcons.Platform,
          },
          {
            id: "applied",
            label: "Applied",
            value: applicantCount,
            icon: MetricIcons.Contract,
          },
          {
            id: "influencer",
            label: "Influencer",
            value: `${acceptedCount}/${totalInfluencers}`,
            icon: MetricIcons.Influencer,
          },
          {
            id: "budget",
            label: "Budget",
            value: formatBudget(campaignBudget),
            icon: MetricIcons.Email,
          },
        ],
        statusLabel: statusLabel(c.status),
        statusVariant: (statusToVariant(c.status) as any) ?? "draft",
        showStatusChevron: true,
        actionSlot: (
          <Button
            variant="outline"
            className="min-w-0 w-full truncate whitespace-nowrap rounded-[0.5rem] border-border shadow-none
max-[520px]:h-9 max-[520px]:px-3 max-[520px]:text-[0.85rem]
min-[981px]:w-auto"
            onClick={handleView}
            disabled={locked}
          >
            View Campaign
          </Button>
        ),
        menuSlot: locked ? null : (
          <div className="flex items-center gap-2">
            {showEditButton ? (
              <Button
                type="button"
                variant="outline"
                className="h-[2.85rem] w-[2.78rem] !ml-0 rounded-[0.5rem] border-border p-0 shadow-none"
                onClick={handleEdit}
                aria-label="Edit campaign"
              >
                <PencilSimple size={18} weight="regular" />
              </Button>
            ) : null}

            <CampaignCardMenu viewHref={viewHref} inviteHref={inviteHref} />
          </div>
        ),
        showMoreButton: false,
        secondaryText: locked ? LOCK_TOOLTIP : campaignFooterText(c),

        // add these in ListCardViewItem type
        disabled: locked,
        disabledTitle: locked ? LOCK_TOOLTIP : undefined,
        overlayLabel: locked ? "Locked" : undefined,
      } as ListCardViewItem;
    });
  }, [filteredItems, isCampaignLocked]);

  const showInitialSkeleton = !hasLoadedOnce;
  const showEmptyState =
    hasLoadedOnce && !loading && filteredItems.length === 0 && !errMsg;

  return (
    <div className="w-full min-w-0 px-4 py-6 sm:px-6 md:px-10 lg:px-12">
      <CampaignFilter
        campaignType={campaignType}
        setCampaignType={setCampaignType}
        creatorStatus={creatorStatus}
        setCreatorStatus={setCreatorStatus}
        categoryIds={categoryIds}
        setCategoryIds={setCategoryIds}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        aiCreated={aiCreated}
        setAiCreated={setAiCreated}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        viewMode={viewMode}
        setViewMode={setViewMode}
        showCreatorStatus={showCreatorStatusFilter}
      />

      {errMsg && <div className="mt-4 text-sm text-red-600">{errMsg}</div>}

      <div className="mt-6">
        {showInitialSkeleton ? (
          viewMode === "list" ? (
            <div className="space-y-4" />
          ) : (
            <div className={GRID_WRAP}>
              <div className={CARD_GRID}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <BrandCampaignCardSkeleton key={i} />
                ))}
              </div>
            </div>
          )
        ) : showEmptyState ? (
          <div className="text-sm text-gray-500">No campaigns found.</div>
        ) : (
          <>
            {viewMode === "list" ? (
              <ListCardView items={listItems} />
            ) : (
              <div className={GRID_WRAP}>
                <div className={CARD_GRID}>
                  {filteredItems.map(renderGridCard)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <footer className="mt-auto flex justify-center pb-6 pt-6">
        {hasMore ? (
          <Button
            type="button"
            variant="outline"
            disabled={loading || loadingMore}
            onClick={() => setPage((p) => p + 1)}
          >
            {loadingMore ? "Loading..." : "Load more"}
          </Button>
        ) : hasLoadedOnce && filteredItems.length > 0 ? (
          <div
            className="text-center text-sm"
            style={{ color: "var(--Light-Text-Subtle, #8C8C8C)" }}
          >
            You've reached the end.
          </div>
        ) : null}
      </footer>
    </div>
  );
}