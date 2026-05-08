"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Download,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminPost, adminDownloadBlob } from "@/lib/api";
import { toast, ToastStyles } from "@/components/ui/toast";
import AdminTable, { type AdminTableColumn } from "../../../components/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  BrandDetail,
  PlanChangeCheckResponse,
  PlanListItem,
} from "./types";
import { formatCurrency, formatDate } from "./utils";
import { SectionCard, StatusPill } from "./shared";

type MaybePromise<T = void> = T | Promise<T>;

type SubscriptionTabProps = {
  brand: BrandDetail;
  loadingPlans: boolean;
  planError: string | null;
  plans: PlanListItem[];
  selectedPlanId: string;
  setSelectedPlanId: (value: string) => void;
  billingCycle: "monthly" | "annual";
  setBillingCycle: (value: "monthly" | "annual") => void;
  validityMode: "plan_default" | "custom_days" | "exact_date";
  setValidityMode: (value: "plan_default" | "custom_days" | "exact_date") => void;
  customDays: string;
  setCustomDays: (value: string) => void;
  customExpiryDate: string;
  setCustomExpiryDate: (value: string) => void;
  applyFrom: "now" | "current_expiry";
  setApplyFrom: (value: "now" | "current_expiry") => void;
  checking: boolean;
  checkInfo: PlanChangeCheckResponse | null;
  forceAssign: boolean;
  setForceAssign: (value: boolean) => void;
  assigning: boolean;
  assignMsg: string | null;
  selectedPlan: PlanListItem | null;
  expiryPreview: Date | null;
  onUpdatePlan: () => MaybePromise<void>;
};

type ColorTone =
  | "indigo"
  | "emerald"
  | "amber"
  | "rose"
  | "sky"
  | "violet"
  | "slate";

type SubscriptionSnapshot = {
  id: string;
  label: string;
  planName: string;
  billingCycle: string;
  monthlyCost?: number;
  annualCost?: number;
  status: string;
  startedAt?: string;
  expiresAt?: string;
  autoRenew?: boolean;
};

type ApiFeature = {
  key: string;
  value?: unknown;
  limit: number;
  used: number;
  note?: string | null;
  resetsEvery?: string | null;
  resetsAt?: string | null;
};

type PaymentHistoryItem = {
  paymentType: "plan" | "milestone";
  orderId?: string;
  paymentId?: string;
  userId?: string;
  role?: string;
  planId?: string;
  planName?: string;
  amount?: number;
  currency?: string;
  status?: string;
  receipt?: string;
  invoiceNumber?: string;
  invoiceIssuedAt?: string | null;
  invoiceFilePath?: string;
  paidAt?: string | null;
  createdAt?: string | null;
  subtotalCents?: number;
  discountCents?: number;
  taxCents?: number;
  totalCents?: number;
};

type PaymentHistoryResponse = {
  success: boolean;
  message?: string;
  userId?: string;
  role?: string;
  counts?: {
    plans: number;
    milestones: number;
    total: number;
  };
  history?: PaymentHistoryItem[];
};

type AdminAssignedPlanHistoryItem = {
  _id?: string;
  brandId?: string;
  planId?: string;
  oldPlanName?: string;
  newPlanName?: string;
  billingCycle?: string;
  startedAt?: string | null;
  expiresAt?: string | null;
  durationDays?: number | null;
  assignedByAdminId?:
    | string
    | {
        _id?: string;
        name?: string;
        email?: string;
        role?: string;
      }
    | null;
  assignedByAdminEmail?: string;
  source?: string;
  status?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type AdminAssignedPlanHistoryResponse = {
  success: boolean;
  message?: string;
  histories?: AdminAssignedPlanHistoryItem[];
  history?: AdminAssignedPlanHistoryItem[];
  data?: AdminAssignedPlanHistoryItem[];
  total?: number;
  totalPages?: number;
};

type ApiErrorLike = {
  message?: unknown;
  error?: unknown;
  errors?: unknown;
  detail?: unknown;
  data?: unknown;
  statusText?: unknown;
  response?: {
    data?: unknown;
    statusText?: unknown;
  };
};

const SUBSCRIPTION_DETAIL_FEATURE_KEYS = [
  "influencer_search_per_month",
  "influencer_profile_views_per_month",
  "invites_per_month",
  "active_campaigns",
];

const FEATURE_LABELS: Record<string, string> = {
  influencer_search_per_month: "Influencer Search / Month",
  influencer_profile_views_per_month: "Influencer Profile Views / Month",
  invites_per_month: "Invites / Month",
  active_campaigns: "Active Campaigns",
};

const toneClasses: Record<
  ColorTone,
  {
    card: string;
    icon: string;
    iconHover: string;
    badge: string;
    soft: string;
    border: string;
    text: string;
    dot: string;
    glow: string;
  }
> = {
  indigo: {
    card: "border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-white",
    icon: "border-indigo-100 bg-indigo-100 text-indigo-700",
    iconHover: "group-hover:bg-indigo-600 group-hover:text-white",
    badge: "border-indigo-200 bg-indigo-600 text-white",
    soft: "bg-indigo-50 text-indigo-700",
    border: "border-indigo-100",
    text: "text-indigo-700",
    dot: "bg-indigo-500",
    glow: "bg-indigo-200/40",
  },
  emerald: {
    card: "border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white",
    icon: "border-emerald-100 bg-emerald-100 text-emerald-700",
    iconHover: "group-hover:bg-emerald-600 group-hover:text-white",
    badge: "border-emerald-200 bg-emerald-600 text-white",
    soft: "bg-emerald-50 text-emerald-700",
    border: "border-emerald-100",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    glow: "bg-emerald-200/40",
  },
  amber: {
    card: "border-amber-100 bg-gradient-to-br from-amber-50 via-white to-white",
    icon: "border-amber-100 bg-amber-100 text-amber-700",
    iconHover: "group-hover:bg-amber-500 group-hover:text-white",
    badge: "border-amber-200 bg-amber-500 text-white",
    soft: "bg-amber-50 text-amber-700",
    border: "border-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
    glow: "bg-amber-200/40",
  },
  rose: {
    card: "border-rose-100 bg-gradient-to-br from-rose-50 via-white to-white",
    icon: "border-rose-100 bg-rose-100 text-rose-700",
    iconHover: "group-hover:bg-rose-600 group-hover:text-white",
    badge: "border-rose-200 bg-rose-600 text-white",
    soft: "bg-rose-50 text-rose-700",
    border: "border-rose-100",
    text: "text-rose-700",
    dot: "bg-rose-500",
    glow: "bg-rose-200/40",
  },
  sky: {
    card: "border-sky-100 bg-gradient-to-br from-sky-50 via-white to-white",
    icon: "border-sky-100 bg-sky-100 text-sky-700",
    iconHover: "group-hover:bg-sky-600 group-hover:text-white",
    badge: "border-sky-200 bg-sky-600 text-white",
    soft: "bg-sky-50 text-sky-700",
    border: "border-sky-100",
    text: "text-sky-700",
    dot: "bg-sky-500",
    glow: "bg-sky-200/40",
  },
  violet: {
    card: "border-violet-100 bg-gradient-to-br from-violet-50 via-white to-white",
    icon: "border-violet-100 bg-violet-100 text-violet-700",
    iconHover: "group-hover:bg-violet-600 group-hover:text-white",
    badge: "border-violet-200 bg-violet-600 text-white",
    soft: "bg-violet-50 text-violet-700",
    border: "border-violet-100",
    text: "text-violet-700",
    dot: "bg-violet-500",
    glow: "bg-violet-200/40",
  },
  slate: {
    card: "border-slate-200 bg-gradient-to-br from-slate-50 via-white to-white",
    icon: "border-slate-200 bg-slate-100 text-slate-700",
    iconHover: "group-hover:bg-slate-900 group-hover:text-white",
    badge: "border-slate-200 bg-slate-900 text-white",
    soft: "bg-slate-50 text-slate-700",
    border: "border-slate-200",
    text: "text-slate-700",
    dot: "bg-slate-500",
    glow: "bg-slate-200/40",
  },
};

function normalizeErrorValue(value: unknown): string {
  if (!value) return "";

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeErrorValue(item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;

    const directMessage =
      normalizeErrorValue(objectValue.message) ||
      normalizeErrorValue(objectValue.error) ||
      normalizeErrorValue(objectValue.detail) ||
      normalizeErrorValue(objectValue.msg);

    if (directMessage) return directMessage;

    return Object.entries(objectValue)
      .map(([key, item]) => {
        const itemMessage = normalizeErrorValue(item);
        return itemMessage ? `${key}: ${itemMessage}` : "";
      })
      .filter(Boolean)
      .join(", ");
  }

  return "";
}

function getErrorMessage(error: unknown, fallback: string) {
  const err = error as ApiErrorLike | undefined;

  const candidates = [
    err?.response?.data,
    err?.data,
    err?.errors,
    err?.error,
    err?.detail,
    err?.message,
    err?.response?.statusText,
    err?.statusText,
    error,
  ];

  for (const candidate of candidates) {
    const message = normalizeErrorValue(candidate);
    if (message) return message;
  }

  return fallback;
}

function showErrorToast(title: string, error: unknown, fallback: string) {
  toast({
    icon: "error",
    title,
    text: getErrorMessage(error, fallback),
    timer: 4000,
  });
}

function showValidationToast(title: string, message: string) {
  toast({
    icon: "error",
    title,
    text: message,
    timer: 4000,
  });
}

function showSuccessToast(title: string, message?: string) {
  toast({
    icon: "success",
    title,
    text: message,
    timer: 2500,
  });
}

function formatPlanName(value?: string | null) {
  const raw = String(value || "").trim();

  if (!raw || raw === "—") return "—";

  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatBillingCycle(value?: string | null) {
  const label = formatPlanName(value);
  return label === "—" ? label : label;
}

function getStatusTone(status?: string) {
  const normalized = String(status || "").toLowerCase();

  if (normalized.includes("active") || normalized.includes("current")) {
    return "success" as const;
  }

  if (normalized.includes("expired") || normalized.includes("archived")) {
    return "danger" as const;
  }

  if (normalized.includes("pending")) {
    return "warning" as const;
  }

  return "neutral" as const;
}

function getColorToneFromStatus(status?: string): ColorTone {
  const normalized = String(status || "").toLowerCase();

  if (normalized.includes("expired") || normalized.includes("archived")) {
    return "rose";
  }

  if (normalized.includes("pending")) {
    return "amber";
  }

  if (normalized.includes("active") || normalized.includes("current")) {
    return "emerald";
  }

  return "slate";
}

function getNumberValue(...values: unknown[]) {
  const found = values.find((value) => typeof value === "number");

  return typeof found === "number" ? found : undefined;
}

function normalizeSubscriptionSnapshot(
  source: any,
  label: string,
  fallbackId: string
): SubscriptionSnapshot {
  const planName =
    source?.planName ||
    source?.plan_name ||
    source?.displayName ||
    source?.display_name ||
    source?.name ||
    source?.plan?.displayName ||
    source?.plan?.name;

  return {
    id: String(source?._id || source?.id || source?.planId || fallbackId),
    label,
    planName: formatPlanName(planName),
    billingCycle: formatBillingCycle(
      source?.billingCycle || source?.billing_cycle || source?.cycle
    ),
    monthlyCost: getNumberValue(
      source?.monthlyCost,
      source?.monthly_cost,
      source?.plan?.monthlyCost,
      source?.plan?.monthly_cost
    ),
    annualCost: getNumberValue(
      source?.annualCost,
      source?.annual_cost,
      source?.plan?.annualCost,
      source?.plan?.annual_cost
    ),
    status: formatPlanName(source?.status || source?.subscriptionStatus || source?.state),
    startedAt:
      source?.startedAt ||
      source?.startDate ||
      source?.start_date ||
      source?.createdAt ||
      source?.assignedAt,
    expiresAt:
      source?.expiresAt ||
      source?.expiryDate ||
      source?.expiry_date ||
      source?.endDate ||
      source?.endedAt,
    autoRenew: typeof source?.autoRenew === "boolean" ? source.autoRenew : undefined,
  };
}

function getCurrentSubscriptionSnapshot(brand: BrandDetail): SubscriptionSnapshot {
  return {
    id: "current-subscription",
    label: "Current Subscription",
    planName: formatPlanName(brand.subscription?.planName || brand.planName),
    billingCycle: formatBillingCycle(brand.subscription?.billingCycle),
    monthlyCost: brand.subscription?.monthlyCost,
    annualCost: brand.subscription?.annualCost,
    status: formatPlanName(
      brand.subscriptionExpired ? "Expired" : brand.subscription?.status || "Active"
    ),
    startedAt: brand.subscription?.startedAt ?? undefined,
    expiresAt: brand.subscription?.expiresAt ?? brand.expiresAt ?? undefined,
    autoRenew: brand.subscription?.autoRenew,
  };
}

function getSubscriptionHistoryItems(brand: BrandDetail) {
  const brandAny = brand as any;
  const sources = [
    brandAny.subscriptionHistory,
    brandAny.subscriptionHistories,
    brandAny.subscription_history,
    brandAny.planHistory,
    brandAny.plan_history,
    brandAny.subscription?.history,
    brandAny.subscription?.subscriptionHistory,
    brandAny.subscription?.previousSubscriptions,
  ];

  const history = sources.find((source) => Array.isArray(source));
  return Array.isArray(history) ? history : [];
}

function getPreviousSubscriptionSnapshot(
  brand: BrandDetail,
  currentSubscription: SubscriptionSnapshot
) {
  const history = getSubscriptionHistoryItems(brand);

  if (!history.length) return null;

  const snapshots = history
    .map((item, index) =>
      normalizeSubscriptionSnapshot(item, "Previous Subscription", `previous-${index}`)
    )
    .filter((item) => item.planName !== "—" || item.startedAt || item.expiresAt);

  if (!snapshots.length) return null;

  const withoutCurrent = snapshots.filter((item) => {
    const samePlan = item.planName === currentSubscription.planName;
    const sameExpiry =
      (item.expiresAt || "") === (currentSubscription.expiresAt || "");
    const sameStart =
      (item.startedAt || "") === (currentSubscription.startedAt || "");

    return !(samePlan && sameExpiry && sameStart);
  });

  return withoutCurrent[withoutCurrent.length - 1] || snapshots[snapshots.length - 2] || null;
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function buildUsageFeatures(brand: BrandDetail): ApiFeature[] {
  const subscriptionAny = brand.subscription as any;
  const features = Array.isArray(subscriptionAny?.features)
    ? subscriptionAny.features
    : [];

  return SUBSCRIPTION_DETAIL_FEATURE_KEYS.map((featureKey) => {
    const feature = features.find((item: any) => item?.key === featureKey);

    if (!feature) return null;

    return {
      key: feature.key,
      value: feature.value,
      limit: toNumber(feature.limit),
      used: toNumber(feature.used),
      note: feature.note ?? null,
      resetsEvery: feature.resetsEvery ?? null,
      resetsAt: feature.resetsAt ?? null,
    };
  }).filter(Boolean) as ApiFeature[];
}

function getBrandPaymentHistoryUserId(brand: BrandDetail) {
  const brandAny = brand as any;

  return String(
    brandAny?._id ||
      brandAny?.id ||
      brandAny?.userId ||
      brandAny?.brandId ||
      brandAny?.brand?._id ||
      brandAny?.brand?.id ||
      ""
  );
}

function getPaymentHistoryDate(item: PaymentHistoryItem, index?: number) {
  return item.invoiceIssuedAt || item.paidAt || item.createdAt || "";
}

function getPaymentHistoryAmount(item: PaymentHistoryItem) {
  return Number(item.totalCents ?? item.amount ?? item.subtotalCents ?? 0);
}

function formatPaymentHistoryAmount(item: PaymentHistoryItem) {
  const cents = getPaymentHistoryAmount(item);

  if (!Number.isFinite(cents) || cents <= 0) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: item.currency || "USD",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function getPaymentStatusTone(status?: string) {
  const normalized = String(status || "").toLowerCase();

  if (
    normalized === "paid" ||
    normalized === "success" ||
    normalized === "completed"
  ) {
    return "success" as const;
  }

  if (normalized === "failed") {
    return "danger" as const;
  }

  if (
    normalized === "created" ||
    normalized === "pending" ||
    normalized === "processing"
  ) {
    return "warning" as const;
  }

  return "neutral" as const;
}

function getAdminAssignedHistoryDate(item: AdminAssignedPlanHistoryItem) {
  return item.createdAt || item.startedAt || item.expiresAt || "";
}

function getAdminAssignedAdminLabel(item: AdminAssignedPlanHistoryItem) {
  const admin = item.assignedByAdminId;

  if (admin && typeof admin === "object") {
    return admin.name || admin.email || item.assignedByAdminEmail || "—";
  }

  return item.assignedByAdminEmail || "—";
}

function getAdminAssignedStatusTone(status?: string) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "assigned") {
    return "success" as const;
  }

  if (normalized === "expired" || normalized === "cancelled") {
    return "danger" as const;
  }

  if (normalized === "pending") {
    return "warning" as const;
  }

  return "neutral" as const;
}

function getTodayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function isPastDateInputValue(dateValue: string) {
  if (!dateValue) return false;

  const selected = new Date(`${dateValue}T00:00:00`);
  const today = new Date();

  selected.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return selected.getTime() < today.getTime();
}

function isPositiveIntegerString(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;

  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed > 0;
}

function OverviewMetric({
  title,
  value,
  hint,
  icon: Icon,
  tone = "indigo",
}: {
  title: string;
  value: React.ReactNode;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: ColorTone;
}) {
  const color = toneClasses[tone];

  return (
    <div
      className={`group relative overflow-hidden rounded-[28px] border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${color.card}`}
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl ${color.glow}`}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${color.text}`}>
            {title}
          </p>
          <div className="mt-3 text-[24px] font-black leading-none text-[#1a1a1a]">
            {value}
          </div>
          <p className="mt-2 text-xs font-semibold text-black/45">{hint}</p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition ${color.icon} ${color.iconHover}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

const FeatureUsage = React.memo(function FeatureUsage({
  feature,
}: {
  feature: ApiFeature;
}) {
  const isUnlimited =
    feature.limit === -1 ||
    Boolean(
      feature.value &&
        typeof feature.value === "object" &&
        (feature.value as any).unlimited
    );

  const isManagedCapacity = feature.limit === 0;

  const percent =
    isUnlimited || isManagedCapacity
      ? 100
      : Math.min(100, Math.round((feature.used / feature.limit) * 100));

  const tone =
    isUnlimited || isManagedCapacity
      ? "bg-emerald-500"
      : percent >= 90
        ? "bg-rose-500"
        : percent >= 70
          ? "bg-amber-500"
          : "bg-emerald-500";

  const limitLabel = isUnlimited
    ? "Unlimited"
    : isManagedCapacity
      ? feature.note || "As needed"
      : feature.limit;

  return (
    <div className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold text-slate-600">
          {FEATURE_LABELS[feature.key] || feature.key.replace(/_/g, " ")}
        </p>

        <p className="text-[11px] font-extrabold text-slate-900">
          {feature.used}/{limitLabel}
        </p>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${tone}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {feature.note ? (
        <p className="text-[10px] font-semibold text-slate-500">
          {feature.note}
        </p>
      ) : null}
    </div>
  );
});

export function BrandSubscriptionTab(props: SubscriptionTabProps) {
  const {
    brand,
    loadingPlans,
    planError,
    plans,
    selectedPlanId,
    setSelectedPlanId,
    billingCycle,
    setBillingCycle,
    validityMode,
    setValidityMode,
    customDays,
    setCustomDays,
    customExpiryDate,
    setCustomExpiryDate,
    applyFrom,
    setApplyFrom,
    checking,
    checkInfo,
    forceAssign,
    setForceAssign,
    assigning,
    assignMsg,
    onUpdatePlan,
  } = props;

  const currentSubscription = useMemo(
    () => getCurrentSubscriptionSnapshot(brand),
    [brand]
  );

  const usageFeatures = useMemo(() => buildUsageFeatures(brand), [brand]);
  const statusColorTone = getColorToneFromStatus(currentSubscription.status);

  const [adminAssignedHistory, setAdminAssignedHistory] = useState<
    AdminAssignedPlanHistoryItem[]
  >([]);
  const [adminAssignedHistoryLoading, setAdminAssignedHistoryLoading] =
    useState(false);

  const [adminAssignedSortBy, setAdminAssignedSortBy] = useState("createdAt");
  const [adminAssignedSortAsc, setAdminAssignedSortAsc] = useState(false);

  const [adminAssignedPage, setAdminAssignedPage] = useState(1);
  const [adminAssignedLimit, setAdminAssignedLimit] = useState(5);

  const [subscriptionHistory, setSubscriptionHistory] = useState<PaymentHistoryItem[]>([]);
  const [subscriptionHistoryLoading, setSubscriptionHistoryLoading] = useState(false);
  const [downloadingInvoiceNumber, setDownloadingInvoiceNumber] = useState<string | null>(null);

  const [subscriptionSortBy, setSubscriptionSortBy] = useState("date");
  const [subscriptionSortAsc, setSubscriptionSortAsc] = useState(false);

  const [subscriptionPage, setSubscriptionPage] = useState(1);
  const [subscriptionLimit, setSubscriptionLimit] = useState(5);

  useEffect(() => {
    if (!planError) return;

    showErrorToast(
      "Plans loading failed",
      planError,
      "Failed to load subscription plans."
    );
  }, [planError]);

  useEffect(() => {
    if (!assignMsg) return;

    const normalized = assignMsg.toLowerCase();
    const isError =
      normalized.includes("fail") ||
      normalized.includes("error") ||
      normalized.includes("invalid") ||
      normalized.includes("not found") ||
      normalized.includes("unable");

    toast({
      icon: isError ? "error" : "success",
      title: isError ? "Plan update failed" : "Plan updated",
      text: assignMsg,
      timer: isError ? 4000 : 2500,
    });
  }, [assignMsg]);

  const fetchAdminAssignedHistory = useCallback(async () => {
    const brandId = getBrandPaymentHistoryUserId(brand);

    if (!brandId) {
      setAdminAssignedHistory([]);

      showValidationToast(
        "Brand ID missing",
        "Brand id not found. Please refresh the page and try again."
      );
      return;
    }

    setAdminAssignedHistoryLoading(true);

    try {
      const response = await adminPost<AdminAssignedPlanHistoryResponse>(
        "/admin/assigned-plan-history",
        {
          brandId,
          page: 1,
          limit: 100,
          sortBy: "createdAt",
          sortOrder: "desc",
        }
      );

      const histories = Array.isArray(response.histories)
        ? response.histories
        : Array.isArray(response.history)
          ? response.history
          : Array.isArray(response.data)
            ? response.data
            : [];

      setAdminAssignedHistory(histories);
      setAdminAssignedPage(1);
    } catch (error) {
      setAdminAssignedHistory([]);

      showErrorToast(
        "Admin assigned history failed",
        error,
        "Failed to load admin assigned history."
      );
    } finally {
      setAdminAssignedHistoryLoading(false);
    }
  }, [brand]);

  const fetchSubscriptionHistory = useCallback(async () => {
    const userId = getBrandPaymentHistoryUserId(brand);

    if (!userId) {
      setSubscriptionHistory([]);

      showValidationToast(
        "Brand user ID missing",
        "Brand user id not found. Please refresh the page and try again."
      );
      return;
    }

    setSubscriptionHistoryLoading(true);

    try {
      const response = await adminPost<PaymentHistoryResponse>("/payment/history", {
        userId,
        role: "Brand",
      });

      const onlyPlanHistory = (response.history || []).filter(
        (item) => item.paymentType === "plan"
      );

      setSubscriptionHistory(onlyPlanHistory);
      setSubscriptionPage(1);
    } catch (error) {
      setSubscriptionHistory([]);

      showErrorToast(
        "Subscription history failed",
        error,
        "Failed to load subscription history."
      );
    } finally {
      setSubscriptionHistoryLoading(false);
    }
  }, [brand]);

  useEffect(() => {
    fetchAdminAssignedHistory();
  }, [fetchAdminAssignedHistory]);

  useEffect(() => {
    fetchSubscriptionHistory();
  }, [fetchSubscriptionHistory]);

  const handleAdminAssignedSort = useCallback(
    (field: string) => {
      setAdminAssignedPage(1);

      if (adminAssignedSortBy === field) {
        setAdminAssignedSortAsc((prev) => !prev);
      } else {
        setAdminAssignedSortBy(field);
        setAdminAssignedSortAsc(
          !["createdAt", "startedAt", "expiresAt", "durationDays"].includes(field)
        );
      }
    },
    [adminAssignedSortBy]
  );

  const sortedAdminAssignedHistory = useMemo(() => {
    return [...adminAssignedHistory].sort((a, b) => {
      const direction = adminAssignedSortAsc ? 1 : -1;

      const valueA =
        adminAssignedSortBy === "durationDays"
          ? Number(a.durationDays || 0)
          : adminAssignedSortBy === "oldPlanName"
            ? String(a.oldPlanName || "").toLowerCase()
            : adminAssignedSortBy === "newPlanName"
              ? String(a.newPlanName || "").toLowerCase()
              : adminAssignedSortBy === "billingCycle"
                ? String(a.billingCycle || "").toLowerCase()
                : adminAssignedSortBy === "assignedBy"
                  ? getAdminAssignedAdminLabel(a).toLowerCase()
                  : adminAssignedSortBy === "status"
                    ? String(a.status || "").toLowerCase()
                    : adminAssignedSortBy === "startedAt"
                      ? new Date(a.startedAt || 0).getTime()
                      : adminAssignedSortBy === "expiresAt"
                        ? new Date(a.expiresAt || 0).getTime()
                        : new Date(getAdminAssignedHistoryDate(a) || 0).getTime();

      const valueB =
        adminAssignedSortBy === "durationDays"
          ? Number(b.durationDays || 0)
          : adminAssignedSortBy === "oldPlanName"
            ? String(b.oldPlanName || "").toLowerCase()
            : adminAssignedSortBy === "newPlanName"
              ? String(b.newPlanName || "").toLowerCase()
              : adminAssignedSortBy === "billingCycle"
                ? String(b.billingCycle || "").toLowerCase()
                : adminAssignedSortBy === "assignedBy"
                  ? getAdminAssignedAdminLabel(b).toLowerCase()
                  : adminAssignedSortBy === "status"
                    ? String(b.status || "").toLowerCase()
                    : adminAssignedSortBy === "startedAt"
                      ? new Date(b.startedAt || 0).getTime()
                      : adminAssignedSortBy === "expiresAt"
                        ? new Date(b.expiresAt || 0).getTime()
                        : new Date(getAdminAssignedHistoryDate(b) || 0).getTime();

      if (valueA > valueB) return direction;
      if (valueA < valueB) return -direction;
      return 0;
    });
  }, [adminAssignedHistory, adminAssignedSortAsc, adminAssignedSortBy]);

  const adminAssignedTotalPages = Math.max(
    1,
    Math.ceil(sortedAdminAssignedHistory.length / adminAssignedLimit)
  );

  const paginatedAdminAssignedHistory = useMemo(() => {
    const start = (adminAssignedPage - 1) * adminAssignedLimit;
    return sortedAdminAssignedHistory.slice(start, start + adminAssignedLimit);
  }, [sortedAdminAssignedHistory, adminAssignedLimit, adminAssignedPage]);

  const handleSubscriptionSort = useCallback(
    (field: string) => {
      setSubscriptionPage(1);

      if (subscriptionSortBy === field) {
        setSubscriptionSortAsc((prev) => !prev);
      } else {
        setSubscriptionSortBy(field);
        setSubscriptionSortAsc(field !== "date");
      }
    },
    [subscriptionSortBy]
  );

  const sortedSubscriptionHistory = useMemo(() => {
    return [...subscriptionHistory].sort((a, b) => {
      const direction = subscriptionSortAsc ? 1 : -1;

      const valueA =
        subscriptionSortBy === "amount"
          ? getPaymentHistoryAmount(a)
          : subscriptionSortBy === "status"
            ? String(a.status || "").toLowerCase()
            : subscriptionSortBy === "planName"
              ? String(a.planName || "").toLowerCase()
              : subscriptionSortBy === "invoiceNumber"
                ? String(a.invoiceNumber || "").toLowerCase()
                : new Date(getPaymentHistoryDate(a) || 0).getTime();

      const valueB =
        subscriptionSortBy === "amount"
          ? getPaymentHistoryAmount(b)
          : subscriptionSortBy === "status"
            ? String(b.status || "").toLowerCase()
            : subscriptionSortBy === "planName"
              ? String(b.planName || "").toLowerCase()
              : subscriptionSortBy === "invoiceNumber"
                ? String(b.invoiceNumber || "").toLowerCase()
                : new Date(getPaymentHistoryDate(b) || 0).getTime();

      if (valueA > valueB) return direction;
      if (valueA < valueB) return -direction;
      return 0;
    });
  }, [subscriptionHistory, subscriptionSortAsc, subscriptionSortBy]);

  const subscriptionTotalPages = Math.max(
    1,
    Math.ceil(sortedSubscriptionHistory.length / subscriptionLimit)
  );

  const paginatedSubscriptionHistory = useMemo(() => {
    const start = (subscriptionPage - 1) * subscriptionLimit;
    return sortedSubscriptionHistory.slice(start, start + subscriptionLimit);
  }, [sortedSubscriptionHistory, subscriptionLimit, subscriptionPage]);

  const handleDownloadInvoice = useCallback(async (invoiceNumber?: string) => {
    if (!invoiceNumber) {
      showValidationToast(
        "Invoice unavailable",
        "Invoice number is not available for this payment."
      );
      return;
    }

    setDownloadingInvoiceNumber(invoiceNumber);

    try {
      const blob = await adminDownloadBlob("/payment/generate-invoice", {
        invoiceNumber,
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      showSuccessToast(
        "Invoice downloaded",
        "The invoice PDF has been downloaded successfully."
      );
    } catch (error) {
      showErrorToast(
        "Invoice download failed",
        error,
        "Failed to download invoice."
      );
    } finally {
      setDownloadingInvoiceNumber(null);
    }
  }, []);

  const validatePlanUpdate = useCallback(() => {
    if (loadingPlans) {
      showValidationToast(
        "Plans are loading",
        "Please wait until subscription plans are loaded."
      );
      return false;
    }

    if (!plans.length) {
      showValidationToast(
        "No plans found",
        "No subscription plans are available. Please refresh and try again."
      );
      return false;
    }

    if (!selectedPlanId) {
      showValidationToast(
        "Plan required",
        "Please select a plan before updating."
      );
      return false;
    }

    if (validityMode === "custom_days" && !isPositiveIntegerString(customDays)) {
      showValidationToast(
        "Invalid validity days",
        "Please enter valid custom days greater than 0."
      );
      return false;
    }

    if (validityMode === "exact_date") {
      if (!customExpiryDate) {
        showValidationToast(
          "Expiry date required",
          "Please select an exact expiry date."
        );
        return false;
      }

      if (isPastDateInputValue(customExpiryDate)) {
        showValidationToast(
          "Invalid expiry date",
          "Exact expiry date cannot be in the past."
        );
        return false;
      }
    }

    return true;
  }, [
    customDays,
    customExpiryDate,
    loadingPlans,
    plans.length,
    selectedPlanId,
    validityMode,
  ]);

  const handleUpdatePlan = useCallback(async () => {
    if (!validatePlanUpdate()) return;

    try {
      await onUpdatePlan();
    } catch (error) {
      showErrorToast(
        "Plan update failed",
        error,
        "Failed to update subscription plan."
      );
    }
  }, [onUpdatePlan, validatePlanUpdate]);

  const adminAssignedHistoryColumns = useMemo<
    AdminTableColumn<AdminAssignedPlanHistoryItem>[]
  >(
    () => [
      {
        id: "oldPlanName",
        header: "Old Plan",
        sortable: true,
        sortField: "oldPlanName",
        widthClassName: "min-w-[180px]",
        render: (item) => (
          <p className="text-sm font-black text-slate-900">
            {formatPlanName(item.oldPlanName || "Free")}
          </p>
        ),
      },
      {
        id: "newPlanName",
        header: "New Plan",
        sortable: true,
        sortField: "newPlanName",
        widthClassName: "min-w-[180px]",
        render: (item) => (
          <p className="text-sm font-black text-slate-900">
            {formatPlanName(item.newPlanName || "—")}
          </p>
        ),
      },
      {
        id: "billingCycle",
        header: "Billing Cycle",
        sortable: true,
        sortField: "billingCycle",
        align: "center",
        widthClassName: "min-w-[140px]",
        render: (item) => (
          <span className="text-sm font-semibold text-slate-600">
            {formatBillingCycle(item.billingCycle || "monthly")}
          </span>
        ),
      },
      {
        id: "startedAt",
        header: "Started At",
        sortable: true,
        sortField: "startedAt",
        align: "center",
        widthClassName: "min-w-[140px]",
        render: (item) => (
          <span className="text-sm font-semibold text-slate-600">
            {formatDate(item.startedAt)}
          </span>
        ),
      },
      {
        id: "expiresAt",
        header: "Expires At",
        sortable: true,
        sortField: "expiresAt",
        align: "center",
        widthClassName: "min-w-[140px]",
        render: (item) => (
          <span className="text-sm font-semibold text-slate-600">
            {formatDate(item.expiresAt)}
          </span>
        ),
      },
      {
        id: "durationDays",
        header: "Days",
        sortable: true,
        sortField: "durationDays",
        align: "center",
        widthClassName: "min-w-[100px]",
        render: (item) => (
          <span className="text-sm font-black text-slate-900">
            {item.durationDays ?? "—"}
          </span>
        ),
      },
      {
        id: "assignedBy",
        header: "Assigned By",
        sortable: true,
        sortField: "assignedBy",
        widthClassName: "min-w-[220px]",
        render: (item) => (
          <div>
            <p className="text-sm font-black text-slate-900">
              {getAdminAssignedAdminLabel(item)}
            </p>
            {item.assignedByAdminEmail ? (
              <p className="text-xs font-semibold text-slate-500">
                {item.assignedByAdminEmail}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        sortable: true,
        sortField: "status",
        align: "center",
        widthClassName: "min-w-[130px]",
        render: (item) => (
          <StatusPill
            label={formatPlanName(item.status || "Assigned")}
            tone={getAdminAssignedStatusTone(item.status)}
          />
        ),
      },
    ],
    []
  );

  const subscriptionHistoryColumns = useMemo<AdminTableColumn<PaymentHistoryItem>[]>(
    () => [
      {
        id: "planName",
        header: "Plan",
        sortable: true,
        sortField: "planName",
        widthClassName: "min-w-[220px]",
        render: (item) => (
          <p className="text-sm font-black text-slate-900">
            {formatPlanName(item.planName || "Subscription Plan")}
          </p>
        ),
      },
      {
        id: "date",
        header: "Date",
        sortable: true,
        sortField: "date",
        align: "center",
        widthClassName: "min-w-[140px]",
        render: (item) => (
          <span className="text-sm font-semibold text-slate-600">
            {formatDate(getPaymentHistoryDate(item))}
          </span>
        ),
      },
      {
        id: "amount",
        header: "Amount",
        sortable: true,
        sortField: "amount",
        align: "right",
        widthClassName: "min-w-[140px]",
        render: (item) => (
          <span className="text-sm font-black text-slate-900">
            {formatPaymentHistoryAmount(item)}
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
        render: (item) => (
          <StatusPill
            label={formatPlanName(item.status || "Created")}
            tone={getPaymentStatusTone(item.status)}
          />
        ),
      },
      {
        id: "action",
        header: "Action",
        align: "right",
        widthClassName: "min-w-[150px]",
        render: (item) => {
          const isDownloading = downloadingInvoiceNumber === item.invoiceNumber;

          return (
            <Button
              type="button"
              size="sm"
              disabled={!item.invoiceNumber || isDownloading}
              onClick={() => handleDownloadInvoice(item.invoiceNumber)}
              className="rounded-full bg-black px-4 text-xs font-extrabold text-white hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="mr-2 h-4 w-4" />
              {isDownloading ? "Downloading..." : "Download"}
            </Button>
          );
        },
      },
    ],
    [downloadingInvoiceNumber, handleDownloadInvoice]
  );

  return (
    <>
      <ToastStyles />

      <div className="space-y-6">
        <div className="rounded-[32px] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-emerald-50/50 p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <OverviewMetric
              title="Billing Cycle"
              value={currentSubscription.billingCycle || "—"}
              hint="Current billing frequency"
              icon={RefreshCw}
              tone="sky"
            />

            <OverviewMetric
              title="Expiry Date"
              value={formatDate(currentSubscription.expiresAt)}
              hint="Current subscription validity"
              icon={CalendarClock}
              tone="amber"
            />

            <OverviewMetric
              title="Plan Status"
              value={
                <StatusPill
                  label={currentSubscription.status}
                  tone={getStatusTone(currentSubscription.status)}
                />
              }
              hint="Live subscription status"
              icon={ShieldCheck}
              tone={statusColorTone}
            />
          </div>
        </div>

        <SectionCard
          title="Subscription Usage"
          description="Current subscription metered usage summary."
        >
          <div className="p-4">
            {usageFeatures.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {usageFeatures.map((feature) => (
                  <FeatureUsage key={feature.key} feature={feature} />
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium text-slate-500">
                No metered features found.
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Update Plan"
          description="Choose a new plan, billing cycle, and validity handling."
          action={
            checking ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                Checking...
              </span>
            ) : checkInfo ? (
              <StatusPill
                label={checkInfo.message}
                tone={checkInfo.canProceed ? "success" : "danger"}
              />
            ) : null
          }
        >
          <div className="space-y-5 p-5">
            <div className="rounded-[28px] border border-violet-100 bg-white/90 p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#1a1a1a]">
                    Plan Configuration
                  </h3>
                  <p className="text-xs font-semibold text-black/45">
                    Select plan, billing cycle, and validity rules.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">
                    New Plan
                  </label>
                  <Select
                    value={selectedPlanId}
                    onValueChange={setSelectedPlanId}
                    disabled={loadingPlans}
                  >
                    <SelectTrigger className="h-11 rounded-2xl border-indigo-100 bg-indigo-50/40 text-sm font-semibold shadow-sm">
                      <SelectValue placeholder={loadingPlans ? "Loading..." : "Select plan"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {plans.map((plan) => (
                        <SelectItem key={plan.planId} value={plan.planId}>
                          {formatPlanName(plan.displayName || plan.name)}{" "}
                          {plan.monthlyCost > 0
                            ? `- ${formatCurrency(plan.monthlyCost)}/mo`
                            : "- Free"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">
                    Billing Cycle
                  </label>
                  <Select
                    value={billingCycle}
                    onValueChange={(value) => setBillingCycle(value as "monthly" | "annual")}
                  >
                    <SelectTrigger className="h-11 rounded-2xl border-sky-100 bg-sky-50/50 text-sm font-semibold shadow-sm">
                      <SelectValue placeholder="Select cycle" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
                    Start Counting From
                  </label>
                  <Select
                    value={applyFrom}
                    onValueChange={(value) =>
                      setApplyFrom(value as "now" | "current_expiry")
                    }
                  >
                    <SelectTrigger className="h-11 rounded-2xl border-emerald-100 bg-emerald-50/50 text-sm font-semibold shadow-sm">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="now">Now</SelectItem>
                      <SelectItem value="current_expiry">Current expiry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">
                    Validity
                  </label>
                  <Select
                    value={validityMode}
                    onValueChange={(value) =>
                      setValidityMode(
                        value as "plan_default" | "custom_days" | "exact_date"
                      )
                    }
                  >
                    <SelectTrigger className="h-11 rounded-2xl border-amber-100 bg-amber-50/50 text-sm font-semibold shadow-sm">
                      <SelectValue placeholder="Select validity" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="plan_default">Use plan default</SelectItem>
                      <SelectItem value="custom_days">Custom days</SelectItem>
                      <SelectItem value="exact_date">Exact expiry date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-[0.14em] text-rose-700">
                    Days
                  </label>
                  <Input
                    placeholder="e.g. 30"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    disabled={validityMode !== "custom_days"}
                    className="h-11 rounded-2xl border-rose-100 bg-rose-50/40 text-sm font-semibold shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-[0.14em] text-violet-700">
                    Exact Expiry Date
                  </label>
                  <Input
                    type="date"
                    value={customExpiryDate}
                    min={getTodayDateInputValue()}
                    onChange={(e) => setCustomExpiryDate(e.target.value)}
                    disabled={validityMode !== "exact_date"}
                    className="h-11 rounded-2xl border-violet-100 bg-violet-50/40 text-sm font-semibold shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/60 p-4">
              <label className="inline-flex items-center gap-3 text-sm font-bold text-emerald-800">
                <input
                  type="checkbox"
                  checked={forceAssign}
                  onChange={(e) => setForceAssign(e.target.checked)}
                  className="h-4 w-4 accent-emerald-600"
                />
                Force assign this plan
              </label>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleUpdatePlan}
                disabled={!selectedPlanId || assigning}
                className="h-11 rounded-[10px] bg-black px-6 text-sm font-extrabold text-white shadow-sm hover:bg-black/90"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {assigning ? "Updating..." : "Update Plan"}
              </Button>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Admin Assigned History"
          description="Plan assignment history manually updated by admins."
          action={
            <Button
              type="button"
              onClick={fetchAdminAssignedHistory}
              disabled={adminAssignedHistoryLoading}
              className="h-10 rounded-[10px] bg-black px-4 text-xs font-extrabold text-white shadow-sm hover:bg-black/90 disabled:opacity-60"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${
                  adminAssignedHistoryLoading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </Button>
          }
        >
          <div className="p-5">
            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <AdminTable<AdminAssignedPlanHistoryItem>
                data={paginatedAdminAssignedHistory}
                columns={adminAssignedHistoryColumns}
                rowKey={(item, index) =>
                  `${item._id || item.planId || "admin-assigned"}-${adminAssignedPage}-${index}`
                }
                loading={adminAssignedHistoryLoading}
                loadingRows={5}
                emptyTitle="No admin assigned history found"
                emptyDescription="No manually assigned plan history found for this brand."
                sortBy={adminAssignedSortBy}
                sortOrder={adminAssignedSortAsc ? "asc" : "desc"}
                onSort={handleAdminAssignedSort}
                tableClassName="min-w-[1240px] bg-white"
                headerRowClassName="bg-slate-50/90"
                pagination={{
                  page: adminAssignedPage,
                  totalPages: adminAssignedTotalPages,
                  totalItems: sortedAdminAssignedHistory.length,
                  limit: adminAssignedLimit,
                  onPageChange: setAdminAssignedPage,
                  onLimitChange: (nextLimit) => {
                    setAdminAssignedLimit(nextLimit);
                    setAdminAssignedPage(1);
                  },
                  rowOptions: [5, 10, 20, 50],
                  loading: adminAssignedHistoryLoading,
                  showRowsSelector: true,
                  showSummary: true,
                }}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Subscription History"
          description="Only plan subscription history fetched from payment history."
          action={
            <Button
              type="button"
              onClick={fetchSubscriptionHistory}
              disabled={subscriptionHistoryLoading}
              className="h-10 rounded-[10px] bg-black px-4 text-xs font-extrabold text-white shadow-sm hover:bg-black/90 disabled:opacity-60"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${
                  subscriptionHistoryLoading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </Button>
          }
        >
          <div className="p-5">
            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <AdminTable<PaymentHistoryItem>
                data={paginatedSubscriptionHistory}
                columns={subscriptionHistoryColumns}
                rowKey={(item, index) =>
                  `${getPaymentHistoryDate(item, index)}-${subscriptionPage}-${index}`
                }
                loading={subscriptionHistoryLoading}
                loadingRows={5}
                emptyTitle="No subscription history found"
                emptyDescription="No plan payment history found for this brand."
                sortBy={subscriptionSortBy}
                sortOrder={subscriptionSortAsc ? "asc" : "desc"}
                onSort={handleSubscriptionSort}
                tableClassName="min-w-[980px] bg-white"
                headerRowClassName="bg-slate-50/90"
                pagination={{
                  page: subscriptionPage,
                  totalPages: subscriptionTotalPages,
                  totalItems: sortedSubscriptionHistory.length,
                  limit: subscriptionLimit,
                  onPageChange: setSubscriptionPage,
                  onLimitChange: (nextLimit) => {
                    setSubscriptionLimit(nextLimit);
                    setSubscriptionPage(1);
                  },
                  rowOptions: [5, 10, 20, 50],
                  loading: subscriptionHistoryLoading,
                  showRowsSelector: true,
                  showSummary: true,
                }}
              />
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  );
}