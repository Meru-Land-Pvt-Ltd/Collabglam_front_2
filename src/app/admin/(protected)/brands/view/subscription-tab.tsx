"use client";

import React, { useMemo } from "react";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  History,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  onUpdatePlan: () => void;
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

function normalizeFeatureKey(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function toFeatureArray(source: unknown) {
  if (Array.isArray(source)) return source;

  if (source && typeof source === "object") {
    return Object.entries(source as Record<string, unknown>).map(([key, value]) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return {
          key,
          ...(value as Record<string, unknown>),
        };
      }

      return {
        key,
        limit: value,
      };
    });
  }

  return [];
}

function getFirstDefined(...values: unknown[]) {
  return values.find(
    (value) => value !== undefined && value !== null && value !== ""
  );
}

function findFeatureUsage(featureKey: string, sources: unknown[]) {
  const normalizedFeatureKey = normalizeFeatureKey(featureKey);

  for (const source of sources) {
    if (!source) continue;

    if (Array.isArray(source)) {
      const match = source.find((item: any) => {
        const itemKey = normalizeFeatureKey(
          item?.key ||
          item?.featureKey ||
          item?.feature_key ||
          item?.name ||
          item?.label
        );

        return itemKey === normalizedFeatureKey;
      });

      if (match) return match;
      continue;
    }

    if (typeof source === "object") {
      const sourceRecord = source as Record<string, any>;

      const directValue = sourceRecord[featureKey];

      if (directValue !== undefined) {
        return directValue && typeof directValue === "object"
          ? { key: featureKey, ...directValue }
          : { key: featureKey, used: directValue };
      }

      const matchingEntry = Object.entries(sourceRecord).find(
        ([key]) => normalizeFeatureKey(key) === normalizedFeatureKey
      );

      if (matchingEntry) {
        const [key, value] = matchingEntry;

        return value && typeof value === "object"
          ? { key, ...(value as Record<string, unknown>) }
          : { key, used: value };
      }
    }
  }

  return null;
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

function DetailTile({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: React.ReactNode;
  tone?: ColorTone;
}) {
  const color = toneClasses[tone];

  return (
    <div
      className={`group rounded-[22px] border bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${color.border}`}
    >
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${color.dot}`} />
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/40">
          {label}
        </p>
      </div>

      <div className="mt-3 text-sm font-black text-[#1a1a1a]">{value}</div>
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

function SubscriptionSnapshotCard({
  snapshot,
  empty = false,
  tone = "emerald",
}: {
  snapshot: SubscriptionSnapshot | null;
  empty?: boolean;
  tone?: ColorTone;
}) {
  const color = toneClasses[tone];

  if (!snapshot || empty) {
    return (
      <div className="min-h-[260px] rounded-[30px] border border-dashed border-violet-200 bg-gradient-to-br from-violet-50 via-white to-white p-6 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
          <History className="h-5 w-5" />
        </div>

        <p className="mt-5 text-[11px] font-black uppercase tracking-[0.18em] text-violet-700">
          Previous Subscription
        </p>
        <h3 className="mt-2 text-xl font-black text-[#1a1a1a]">
          No Previous Plan
        </h3>
        <p className="mt-3 text-sm font-semibold leading-6 text-black/45">
          Previous subscription data is not available for this brand yet.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-[30px] border p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl ${color.card}`}
    >
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl ${color.glow}`}
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${color.text}`}>
              {snapshot.label}
            </p>
            <h3 className="mt-2 text-2xl font-black text-[#1a1a1a]">
              {snapshot.planName}
            </h3>
          </div>

          <StatusPill label={snapshot.status || "—"} tone={getStatusTone(snapshot.status)} />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <DetailTile label="Billing Cycle" value={snapshot.billingCycle || "—"} tone={tone} />
          <DetailTile
            label="Auto Renew"
            tone={tone}
            value={
              typeof snapshot.autoRenew === "boolean"
                ? snapshot.autoRenew
                  ? "Yes"
                  : "No"
                : "—"
            }
          />
          <DetailTile
            label="Monthly Cost"
            tone={tone}
            value={
              typeof snapshot.monthlyCost === "number"
                ? formatCurrency(snapshot.monthlyCost)
                : "—"
            }
          />
          <DetailTile
            label="Annual Cost"
            tone={tone}
            value={
              typeof snapshot.annualCost === "number"
                ? formatCurrency(snapshot.annualCost)
                : "—"
            }
          />
          <DetailTile label="Started At" value={formatDate(snapshot.startedAt)} tone={tone} />
          <DetailTile label="Expire At" value={formatDate(snapshot.expiresAt)} tone={tone} />
        </div>
      </div>
    </div>
  );
}

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

  const previousSubscription = useMemo(
    () => getPreviousSubscriptionSnapshot(brand, currentSubscription),
    [brand, currentSubscription]
  );

  const usageFeatures = useMemo(() => buildUsageFeatures(brand), [brand]);
  const statusColorTone = getColorToneFromStatus(currentSubscription.status);

  return (
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
          {planError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {planError}
            </div>
          ) : null}

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
              onClick={onUpdatePlan}
              disabled={!selectedPlanId || assigning}
              className="h-11 rounded-[10px] bg-black px-6 text-sm font-extrabold text-white shadow-sm hover:bg-black/90"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {assigning ? "Updating..." : "Update Plan"}
            </Button>
          </div>

          {assignMsg ? (
            <div className="rounded-[18px] border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-sm">
              {assignMsg}
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        title="Subscription History"
        description="Quick comparison between the previous subscription and the current subscription."
      >
        <div className="grid gap-5 bg-gradient-to-br p-5 xl:items-center">
          <SubscriptionSnapshotCard
            snapshot={previousSubscription}
            empty={!previousSubscription}
            tone="violet"
          />

        </div>
      </SectionCard>
    </div>
  );
}