"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminGet, adminPatch, adminPost, getApiErrorMessage } from "@/lib/api";
import {
  Activity,
  BarChart3,
  ChevronRight,
  Flame,
  Inbox,
  Loader2,
  Mail,
  PauseCircle,
  PlayCircle,
  Save,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";

type Role = "sdr" | "bme" | "revenue_head" | "ime" | "super_admin";

type MailboxAccount = {
  _id: string | null;
  email: string;
  role: Role | string;
  provider: string;
  isActive: boolean;
  isPrimary: boolean;
  assignedAt: string | null;
  unassignedAt: string | null;
  adminId: string | null;
  emailsSentToday?: number;
  instantlyMeta: {
    status: number | null;
    warmupStatus: number | null;
    dailyLimit: number | null;
    warmupScore: number | null;
  };
};

type MyAccountsListPayload = {
  success?: boolean;
  message?: string;
  data?: {
    role: Role | string;
    canSelectPrimary: boolean;
    allowsMultiple: boolean;
    totalAccounts: number;
    primaryEmail: string;
    accounts: MailboxAccount[];
  };
};

type AccountDetailPayload = {
  success?: boolean;
  message?: string;
  data?: {
    role: Role | string;
    canSelectPrimary: boolean;
    account: {
      email: string;
      provider: string;
      isActive: boolean;
      isPrimary: boolean;
      isPaused: boolean;
      statusLabel: string;
      assignedAt: string | null;
      emailsSentToday: number;
      instantlyMeta: {
        status: number | null;
        warmupStatus: number | null;
        dailyLimit: number | null;
        warmupScore: number | null;
      };
    };
    warmup: {
      enabled: boolean;
      startedOn: string | null;
      summary: {
        sent: number;
        received: number;
        savedFromSpam: number;
      };
      chart: Array<{
        label: string;
        sent: number;
        received: number;
        savedFromSpam: number;
      }>;
    };
    settings: {
      firstName: string;
      lastName: string;
      signature: string;
      tags: string[];
      dailyLimit: number;
      minimumWaitTime: number;
      campaignSlowRamp: boolean;
      replyToAddress: string;
      dailyInboxPlacementTestLimit: number;
      customTrackingDomain: string;
      enableCustomTrackingDomain: boolean;
      warmupFilterTag: string;
      increasePerDay: number;
      dailyWarmupLimit: number;
      disableSlowWarmup: boolean;
      replyRate: number;
    };
    campaigns: Array<{
      _id: string;
      name: string;
      status: string;
      statusLabel: string;
      flowType: string;
      senderAccountEmail: string;
      createdAt: string;
      launchedAt: string;
    }>;
  };
};

type TabKey = "warmup" | "settings" | "campaigns";
type WarmupRangeKey = "daily" | "weekly";

type WarmupChartPoint = {
  label: string;
  sent: number;
  received: number;
  savedFromSpam: number;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getProviderLabel(provider?: string) {
  const normalized = String(provider || "").trim().toLowerCase();

  if (normalized === "google") return "Google Workspace";
  if (normalized === "microsoft") return "Microsoft 365";
  if (!normalized) return "Unknown Provider";

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatValue(value?: number | string | null) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function getStatusChip(status?: string) {
  const normalized = String(status || "").trim().toLowerCase();

  if (normalized === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (normalized === "paused") return "border-amber-200 bg-amber-50 text-amber-700";

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function getCampaignStatusChip(status?: string) {
  const normalized = String(status || "").trim().toLowerCase();

  if (normalized === "launched") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (normalized === "ready") return "border-blue-200 bg-blue-50 text-blue-700";
  if (normalized === "paused") return "border-amber-200 bg-amber-50 text-amber-700";
  if (normalized === "completed") return "border-violet-200 bg-violet-50 text-violet-700";

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function getFlowLabel(flowType?: string) {
  if (flowType === "ime_influencer") return "IME Influencer";
  if (flowType === "standard_brand") return "Standard Brand";
  return flowType || "Campaign";
}

function getInitial(email?: string) {
  return String(email || "M").trim().charAt(0).toUpperCase() || "M";
}

function MetricCard({
  label,
  value,
  subtext,
  icon,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  tone?: "slate" | "blue" | "green" | "violet" | "amber";
}) {
  const toneClasses = {
    slate: "bg-slate-950 text-white",
    blue: "bg-blue-600 text-white",
    green: "bg-emerald-600 text-white",
    violet: "bg-violet-600 text-white",
    amber: "bg-amber-500 text-white",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-slate-100" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>

          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>

          {subtext ? (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
              {subtext}
            </p>
          ) : null}
        </div>

        {icon ? (
          <div
            className={cx(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm",
              toneClasses[tone]
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
      <div>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
          <Inbox className="h-5 w-5" />
        </div>

        <h3 className="mt-4 text-base font-bold text-slate-950">{title}</h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
    />
  );
}

function ToggleRow({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:bg-slate-50">
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        ) : null}
      </div>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 shrink-0 rounded border-slate-300 text-slate-950 focus:ring-slate-900"
      />
    </label>
  );
}

function getWeekStartLabel(value = "") {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value || "Unknown";

  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const start = monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const end = sunday.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return `${start} - ${end}`;
}

function groupWarmupChartByWeek(data: WarmupChartPoint[]) {
  const groups = new Map<string, WarmupChartPoint>();

  data.forEach((item) => {
    const label = getWeekStartLabel(item.label);
    const existing = groups.get(label) || { label, sent: 0, received: 0, savedFromSpam: 0 };

    existing.sent += Number(item.sent || 0);
    existing.received += Number(item.received || 0);
    existing.savedFromSpam += Number(item.savedFromSpam || 0);

    groups.set(label, existing);
  });

  return Array.from(groups.values());
}

function WarmupChart({
  data,
  enabled,
  range,
  onRangeChange,
}: {
  data: WarmupChartPoint[];
  enabled: boolean;
  range: WarmupRangeKey;
  onRangeChange: (range: WarmupRangeKey) => void;
}) {
  const safeData = data.length
    ? data
    : [{ label: "No Data", sent: 0, received: 0, savedFromSpam: 0 }];

  const [activeIndex, setActiveIndex] = useState(0);
  const activePoint = safeData[activeIndex] || safeData[0];

  const maxValue = useMemo(() => {
    const values = safeData.flatMap((item) => [
      Number(item.sent || 0),
      Number(item.received || 0),
      Number(item.savedFromSpam || 0),
    ]);

    return Math.max(...values, 1);
  }, [safeData]);

  const totals = useMemo(() => {
    return safeData.reduce(
      (acc, item) => {
        acc.sent += Number(item.sent || 0);
        acc.received += Number(item.received || 0);
        acc.savedFromSpam += Number(item.savedFromSpam || 0);
        return acc;
      },
      { sent: 0, received: 0, savedFromSpam: 0 }
    );
  }, [safeData]);

  function getHeight(value: number) {
    if (!value) return "8px";
    return `${Math.max((value / maxValue) * 150, 14)}px`;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
            <BarChart3 className="h-4 w-4" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-950">
              Warmup Performance
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Hover or tap a bar to view exact warmup values.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Sent
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Received
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
            <span className="h-2 w-2 rounded-full bg-violet-500" />
            Saved
          </span>

          <div className="inline-flex overflow-hidden rounded-full border border-slate-200 bg-white p-0.5">
            {[
              { value: "daily" as WarmupRangeKey, label: "Day Wise" },
              { value: "weekly" as WarmupRangeKey, label: "Week Wise" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => onRangeChange(item.value)}
                className={cx(
                  "rounded-full px-3 py-1 text-[11px] font-bold transition",
                  range === item.value
                    ? "bg-slate-950 text-white"
                    : "text-slate-500 hover:bg-slate-50"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <span
            className={cx(
              "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold",
              enabled
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            )}
          >
            {enabled ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Total Sent
            </p>
            <p className="mt-1 text-xl font-bold text-blue-600">
              {totals.sent}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Received
            </p>
            <p className="mt-1 text-xl font-bold text-emerald-600">
              {totals.received}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Saved
            </p>
            <p className="mt-1 text-xl font-bold text-violet-600">
              {totals.savedFromSpam}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Selected Period
          </p>
          <p className="mt-1 truncate text-sm font-bold text-slate-950">
            {activePoint.label || "—"}
          </p>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-blue-50 px-2 py-2">
              <p className="text-[10px] font-semibold text-blue-600">Sent</p>
              <p className="text-sm font-bold text-blue-700">
                {activePoint.sent}
              </p>
            </div>

            <div className="rounded-lg bg-emerald-50 px-2 py-2">
              <p className="text-[10px] font-semibold text-emerald-600">
                Received
              </p>
              <p className="text-sm font-bold text-emerald-700">
                {activePoint.received}
              </p>
            </div>

            <div className="rounded-lg bg-violet-50 px-2 py-2">
              <p className="text-[10px] font-semibold text-violet-600">
                Saved
              </p>
              <p className="text-sm font-bold text-violet-700">
                {activePoint.savedFromSpam}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-slate-50 p-4">
        <div className="flex min-w-[560px] items-end gap-4">
          {safeData.map((item, index) => {
            const sent = Number(item.sent || 0);
            const received = Number(item.received || 0);
            const savedFromSpam = Number(item.savedFromSpam || 0);
            const isActive = index === activeIndex;

            return (
              <button
                key={`${item.label}-${index}`}
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onClick={() => setActiveIndex(index)}
                className={cx(
                  "flex min-w-[70px] flex-1 flex-col items-center rounded-xl px-2 py-3 outline-none transition",
                  isActive ? "bg-white shadow-sm ring-1 ring-slate-200" : ""
                )}
              >
                <div className="flex h-[170px] items-end justify-center gap-1.5">
                  <span
                    className="w-3 rounded-t-full bg-blue-500 transition-all"
                    style={{ height: getHeight(sent) }}
                  />
                  <span
                    className="w-3 rounded-t-full bg-emerald-500 transition-all"
                    style={{ height: getHeight(received) }}
                  />
                  <span
                    className="w-3 rounded-t-full bg-violet-500 transition-all"
                    style={{ height: getHeight(savedFromSpam) }}
                  />
                </div>

                <span
                  className={cx(
                    "mt-3 max-w-[90px] truncate text-center text-[11px] font-bold",
                    isActive ? "text-slate-950" : "text-slate-500"
                  )}
                >
                  {item.label || "—"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function MyAccountsPage() {
  const router = useRouter();

  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submittingEmail, setSubmittingEmail] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [payload, setPayload] =
    useState<MyAccountsListPayload["data"] | null>(null);
  const [detail, setDetail] =
    useState<AccountDetailPayload["data"] | null>(null);

  const [selectedEmail, setSelectedEmail] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("warmup");
  const [warmupRange, setWarmupRange] = useState<WarmupRangeKey>("daily");
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);

  const [settingsForm, setSettingsForm] = useState({
    firstName: "",
    lastName: "",
    signature: "",
    tags: "",
    dailyLimit: 0,
    minimumWaitTime: 1,
    campaignSlowRamp: false,
    replyToAddress: "",
    dailyInboxPlacementTestLimit: 10,
    customTrackingDomain: "",
    enableCustomTrackingDomain: false,
    warmupFilterTag: "",
    increasePerDay: 1,
    dailyWarmupLimit: 10,
    disableSlowWarmup: false,
    replyRate: 30,
  });

  const loadAccounts = useCallback(async () => {
    try {
      setLoadingList(true);
      setError("");

      const response =
        await adminGet<MyAccountsListPayload>("/outreach/mailboxes/my-accounts");

      if (!response?.success) {
        throw new Error(response?.message || "Failed to load accounts");
      }

      const nextPayload = response.data || null;
      setPayload(nextPayload);
    } catch (err) {
      const message = await getApiErrorMessage(err, "Failed to load accounts");
      setError(message);
      setPayload(null);
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadDetails = useCallback(async (email: string) => {
    if (!email) {
      setDetail(null);
      return;
    }

    try {
      setLoadingDetail(true);
      setError("");

      const response = await adminGet<AccountDetailPayload>(
        `/outreach/mailboxes/my-accounts/${encodeURIComponent(email)}`
      );

      if (!response?.success) {
        throw new Error(response?.message || "Failed to load account details");
      }

      const nextDetail = response.data || null;
      setDetail(nextDetail);

      setSettingsForm({
        firstName: nextDetail?.settings?.firstName || "",
        lastName: nextDetail?.settings?.lastName || "",
        signature: nextDetail?.settings?.signature || "",
        tags: Array.isArray(nextDetail?.settings?.tags)
          ? nextDetail.settings.tags.join(", ")
          : "",
        dailyLimit: Number(nextDetail?.settings?.dailyLimit || 0),
        minimumWaitTime: Number(nextDetail?.settings?.minimumWaitTime || 1),
        campaignSlowRamp: Boolean(nextDetail?.settings?.campaignSlowRamp),
        replyToAddress: nextDetail?.settings?.replyToAddress || "",
        dailyInboxPlacementTestLimit: Number(
          nextDetail?.settings?.dailyInboxPlacementTestLimit || 10
        ),
        customTrackingDomain:
          nextDetail?.settings?.customTrackingDomain || "",
        enableCustomTrackingDomain: Boolean(
          nextDetail?.settings?.enableCustomTrackingDomain
        ),
        warmupFilterTag: nextDetail?.settings?.warmupFilterTag || "",
        increasePerDay: Number(nextDetail?.settings?.increasePerDay || 1),
        dailyWarmupLimit: Number(
          nextDetail?.settings?.dailyWarmupLimit || 10
        ),
        disableSlowWarmup: Boolean(nextDetail?.settings?.disableSlowWarmup),
        replyRate: Number(nextDetail?.settings?.replyRate || 30),
      });
    } catch (err) {
      const message = await getApiErrorMessage(
        err,
        "Failed to load account details"
      );
      setError(message);
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    if (isAccountDrawerOpen && selectedEmail) {
      void loadDetails(selectedEmail);
    }
  }, [isAccountDrawerOpen, selectedEmail, loadDetails]);

  function openAccountDrawer(email: string) {
    setSelectedEmail(email);
    setActiveTab("warmup");
    setWarmupRange("daily");
    setDetail(null);
    setIsAccountDrawerOpen(true);
  }

  function closeAccountDrawer() {
    setIsAccountDrawerOpen(false);
  }

  const handleSetPrimary = useCallback(
    async (email: string) => {
      try {
        setSubmittingEmail(email);
        setError("");
        setSuccess("");

        const response = await adminPost<MyAccountsListPayload>(
          "/outreach/mailboxes/my-accounts/primary",
          { email }
        );

        if (!response?.success) {
          throw new Error(
            response?.message || "Failed to update primary mailbox"
          );
        }

        setSuccess("Primary mailbox updated successfully.");
        await loadAccounts();
        await loadDetails(email);
      } catch (err) {
        const message = await getApiErrorMessage(
          err,
          "Failed to update primary mailbox"
        );
        setError(message);
      } finally {
        setSubmittingEmail("");
      }
    },
    [loadAccounts, loadDetails]
  );

  const handlePauseResume = useCallback(async () => {
    if (!detail?.account?.email) return;

    try {
      setSubmittingEmail(detail.account.email);
      setError("");
      setSuccess("");

      const endpoint = detail.account.isPaused
        ? `/outreach/mailboxes/my-accounts/${encodeURIComponent(
            detail.account.email
          )}/resume`
        : `/outreach/mailboxes/my-accounts/${encodeURIComponent(
            detail.account.email
          )}/pause`;

      const response: any = await adminPost(endpoint, {});

      if (!response?.success) {
        throw new Error(response?.message || "Failed to update account status");
      }

      setSuccess(
        detail.account.isPaused
          ? "Mailbox resumed successfully."
          : "Mailbox paused successfully."
      );

      await loadAccounts();
      await loadDetails(detail.account.email);
    } catch (err) {
      const message = await getApiErrorMessage(
        err,
        "Failed to update account status"
      );
      setError(message);
    } finally {
      setSubmittingEmail("");
    }
  }, [detail, loadAccounts, loadDetails]);

  const handleWarmupToggle = useCallback(async () => {
    if (!detail?.account?.email) return;

    try {
      setSubmittingEmail(detail.account.email);
      setError("");
      setSuccess("");

      const endpoint = detail.warmup.enabled
        ? `/outreach/mailboxes/my-accounts/${encodeURIComponent(
            detail.account.email
          )}/warmup/disable`
        : `/outreach/mailboxes/my-accounts/${encodeURIComponent(
            detail.account.email
          )}/warmup/enable`;

      const response: any = await adminPost(endpoint, {});

      if (!response?.success) {
        throw new Error(response?.message || "Failed to update warmup");
      }

      setSuccess(
        detail.warmup.enabled
          ? "Warmup disabled successfully."
          : "Warmup enabled successfully."
      );

      await loadAccounts();
      await loadDetails(detail.account.email);
    } catch (err) {
      const message = await getApiErrorMessage(err, "Failed to update warmup");
      setError(message);
    } finally {
      setSubmittingEmail("");
    }
  }, [detail, loadAccounts, loadDetails]);

  const handleSaveSettings = useCallback(async () => {
    if (!detail?.account?.email) return;

    try {
      setSavingSettings(true);
      setError("");
      setSuccess("");

      const response: any = await adminPatch(
        `/outreach/mailboxes/my-accounts/${encodeURIComponent(
          detail.account.email
        )}/settings`,
        settingsForm
      );

      if (!response?.success) {
        throw new Error(response?.message || "Failed to save settings");
      }

      setSuccess("Mailbox settings updated successfully.");
      await loadAccounts();
      await loadDetails(detail.account.email);
    } catch (err) {
      const message = await getApiErrorMessage(err, "Failed to save settings");
      setError(message);
    } finally {
      setSavingSettings(false);
    }
  }, [detail, settingsForm, loadAccounts, loadDetails]);

  const accounts = payload?.accounts || [];
  const canSelectPrimary = Boolean(payload?.canSelectPrimary);

  const filteredAccounts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return accounts;

    return accounts.filter((item) => {
      const haystack = [item.email, item.provider, item.role]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [accounts, search]);

  const primaryAccount = useMemo(
    () => accounts.find((item) => item.isPrimary) || accounts[0] || null,
    [accounts]
  );

  const totalSentToday = useMemo(
    () =>
      accounts.reduce(
        (sum, item) => sum + Number(item.emailsSentToday || 0),
        0
      ),
    [accounts]
  );

  const visibleWarmupChart = useMemo(() => {
    const chart = detail?.warmup?.chart || [];

    if (warmupRange === "weekly") {
      return groupWarmupChartByWeek(chart);
    }

    return chart;
  }, [detail?.warmup?.chart, warmupRange]);

  return (
    <div className="h-[100dvh] overflow-hidden bg-slate-50 p-3 font-sans sm:p-4">
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <header className="shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Email Accounts
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage mailbox settings, warmup, sending limits, and linked campaigns.
              </p>
            </div>
          </div>
        </header>

        {(error || success) && (
          <div className="mt-3 shrink-0 space-y-2">
            {error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {success}
              </div>
            ) : null}
          </div>
        )}

        <div className="mt-3 grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            label="Total Accounts"
            value={loadingList ? "—" : payload?.totalAccounts ?? 0}
            subtext="Assigned sender mailboxes"
            icon={<Mail className="h-5 w-5" />}
          />

          <MetricCard
            label="Primary Mailbox"
            value={loadingList ? "Loading..." : primaryAccount?.email || "None"}
            subtext="Default sender account"
            icon={<ShieldCheck className="h-5 w-5" />}
            tone="blue"
          />

          <MetricCard
            label="Sent Today"
            value={loadingList ? "—" : totalSentToday}
            subtext="Across all assigned accounts"
            icon={<Send className="h-5 w-5" />}
            tone="green"
          />
        </div>

        <main className="mt-4 min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex h-full min-h-0 flex-col">
            <div className="shrink-0 border-b border-slate-200 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-950">
                    Assigned Mailboxes
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Click any mailbox to open full account details in a side panel.
                  </p>
                </div>

                <div className="relative w-full lg:w-[360px]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search emails..."
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-100"
                  />
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
              {loadingList ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 9 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-36 animate-pulse rounded-2xl bg-slate-100"
                    />
                  ))}
                </div>
              ) : filteredAccounts.length === 0 ? (
                <EmptyState
                  title="No accounts found"
                  description="Try another email or provider search term."
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {filteredAccounts.map((account) => {
                    const sentToday = Number(account.emailsSentToday || 0);
                    const dailyLimit = Number(account.instantlyMeta?.dailyLimit || 0);

                    return (
                      <button
                        key={account.email}
                        type="button"
                        onClick={() => openAccountDrawer(account.email)}
                        className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                              {getInitial(account.email)}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-bold text-slate-950">
                                  {account.email}
                                </p>

                                {account.isPrimary ? (
                                  <span className="shrink-0 rounded-full bg-slate-950 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                                    Primary
                                  </span>
                                ) : null}
                              </div>

                              <p className="mt-1 text-xs text-slate-500">
                                {getProviderLabel(account.provider)}
                              </p>
                            </div>
                          </div>

                          <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700" />
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <div className="rounded-xl bg-slate-50 px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                              Sent Today
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-950">
                              {dailyLimit > 0
                                ? `${sentToday} / ${dailyLimit}`
                                : formatValue(sentToday)}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                              Role
                            </p>
                            <p className="mt-1 text-sm font-bold capitalize text-slate-950">
                              {String(account.role || "—").replace(/_/g, " ").toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {isAccountDrawerOpen ? (
        <div className="fixed inset-0 z-[100] overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
            onClick={closeAccountDrawer}
          />

          <section className="absolute bottom-0 right-0 top-0 flex w-full max-w-[980px] flex-col overflow-hidden border-l border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.35)]">
            <div className="shrink-0 border-b border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Mailbox Details
                  </p>

                  <h2 className="mt-2 truncate text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                    {selectedEmail || "Mailbox"}
                  </h2>

                  {detail?.account ? (
                    <p className="mt-1 text-sm text-slate-500">
                      {getProviderLabel(detail.account.provider)} • Assigned{" "}
                      {formatDate(detail.account.assignedAt)}
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={closeAccountDrawer}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {detail?.account ? (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span
                    className={cx(
                      "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                      getStatusChip(detail.account.statusLabel)
                    )}
                  >
                    {detail.account.statusLabel}
                  </span>

                  {detail.account.isPrimary ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
                      <Star className="h-3.5 w-3.5" />
                      Primary
                    </span>
                  ) : null}

                  {detail.warmup.enabled ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      <Flame className="h-3.5 w-3.5" />
                      Warmup On
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                      Warmup Off
                    </span>
                  )}
                </div>
              ) : null}

              {detail?.account ? (
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex">
                  {canSelectPrimary && !detail.account.isPrimary ? (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(detail.account.email)}
                      disabled={submittingEmail === detail.account.email}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-950 bg-white px-4 text-sm font-bold text-slate-950 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      {submittingEmail === detail.account.email
                        ? "Updating..."
                        : "Set Primary"}
                    </button>
                  ) : null}

                </div>
              ) : null}

              <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1">
                {[
                  {
                    key: "warmup" as TabKey,
                    label: "Warmup",
                    icon: <Activity className="h-4 w-4" />,
                  },
                  {
                    key: "settings" as TabKey,
                    label: "Settings",
                    icon: <Settings className="h-4 w-4" />,
                  },
                  {
                    key: "campaigns" as TabKey,
                    label: "Campaigns",
                    icon: <BarChart3 className="h-4 w-4" />,
                  },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={cx(
                      "inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-bold transition sm:px-4 sm:text-sm",
                      activeTab === tab.key
                        ? "bg-slate-950 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-950"
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50/70 p-3 sm:p-4 lg:p-5">
              {loadingDetail ? (
                <div className="flex min-h-[520px] items-center justify-center p-8 text-center">
                  <div>
                    <Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-400" />
                    <p className="mt-3 text-sm font-semibold text-slate-600">
                      Loading account details...
                    </p>
                  </div>
                </div>
              ) : !detail ? (
                <EmptyState
                  title="Unable to load account"
                  description="Close this panel and try opening the mailbox again."
                />
              ) : (
                <>
                  {activeTab === "warmup" && (
                    <div className="space-y-5 pb-6">
                      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <h3 className="text-base font-bold text-slate-950">
                            Warmup Status
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Started on{" "}
                            <span className="font-bold text-slate-700">
                              {formatDate(detail.warmup.startedOn)}
                            </span>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleWarmupToggle}
                          disabled={submittingEmail === detail.account.email}
                          className={cx(
                            "inline-flex h-11 w-full items-center justify-center rounded-xl px-5 text-sm font-bold transition disabled:opacity-50 sm:w-auto",
                            detail.warmup.enabled
                              ? "border border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
                              : "bg-slate-950 text-white hover:bg-black"
                          )}
                        >
                          {submittingEmail === detail.account.email
                            ? "Updating..."
                            : detail.warmup.enabled
                              ? "Disable Warmup"
                              : "Enable Warmup"}
                        </button>
                      </div>

                      <WarmupChart
                        data={visibleWarmupChart}
                        enabled={detail.warmup.enabled}
                        range={warmupRange}
                        onRangeChange={setWarmupRange}
                      />
                    </div>
                  )}

                  {activeTab === "settings" && (
                    <div className="mx-auto max-w-5xl space-y-5 pb-24">
                      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                        <div className="mb-5 flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
                            <Mail className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-950">
                              Sender Details
                            </h3>
                            <p className="text-sm text-slate-500">
                              Basic identity and reply settings.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <FieldLabel>First Name</FieldLabel>
                            <TextInput
                              value={settingsForm.firstName}
                              onChange={(value) =>
                                setSettingsForm((prev) => ({
                                  ...prev,
                                  firstName: value,
                                }))
                              }
                            />
                          </div>

                          <div>
                            <FieldLabel>Last Name</FieldLabel>
                            <TextInput
                              value={settingsForm.lastName}
                              onChange={(value) =>
                                setSettingsForm((prev) => ({
                                  ...prev,
                                  lastName: value,
                                }))
                              }
                            />
                          </div>

                          <div>
                            <FieldLabel>Tags</FieldLabel>
                            <TextInput
                              value={settingsForm.tags}
                              onChange={(value) =>
                                setSettingsForm((prev) => ({
                                  ...prev,
                                  tags: value,
                                }))
                              }
                              placeholder="sales, primary, outbound"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <FieldLabel>Signature</FieldLabel>
                            <textarea
                              value={settingsForm.signature}
                              onChange={(event) =>
                                setSettingsForm((prev) => ({
                                  ...prev,
                                  signature: event.target.value,
                                }))
                              }
                              rows={5}
                              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                            />
                          </div>
                        </div>
                      </section>

                      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                        <div className="mb-5 flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                            <Send className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-950">
                              Campaign Settings
                            </h3>
                            <p className="text-sm text-slate-500">
                              Configure sending behavior and tracking.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <FieldLabel>Daily Campaign Limit</FieldLabel>
                            <TextInput
                              type="number"
                              value={settingsForm.dailyLimit}
                              onChange={(value) =>
                                setSettingsForm((prev) => ({
                                  ...prev,
                                  dailyLimit: Number(value || 0),
                                }))
                              }
                            />
                          </div>

                          <div>
                            <FieldLabel>Min. Wait Time</FieldLabel>
                            <TextInput
                              type="number"
                              value={settingsForm.minimumWaitTime}
                              onChange={(value) =>
                                setSettingsForm((prev) => ({
                                  ...prev,
                                  minimumWaitTime: Number(value || 0),
                                }))
                              }
                            />
                          </div>

                          <div>
                            <FieldLabel>Inbox Placement Test Limit</FieldLabel>
                            <TextInput
                              type="number"
                              value={settingsForm.dailyInboxPlacementTestLimit}
                              onChange={(value) =>
                                setSettingsForm((prev) => ({
                                  ...prev,
                                  dailyInboxPlacementTestLimit: Number(value || 0),
                                }))
                              }
                            />
                          </div>

                          <div>
                            <FieldLabel>Custom Tracking Domain</FieldLabel>
                            <TextInput
                              value={settingsForm.customTrackingDomain}
                              onChange={(value) =>
                                setSettingsForm((prev) => ({
                                  ...prev,
                                  customTrackingDomain: value,
                                }))
                              }
                              placeholder="track.yourdomain.com"
                            />
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <ToggleRow
                            checked={settingsForm.campaignSlowRamp}
                            onChange={(checked) =>
                              setSettingsForm((prev) => ({
                                ...prev,
                                campaignSlowRamp: checked,
                              }))
                            }
                            title="Enable Campaign Slow Ramp"
                            description="Gradually increase sending volume."
                          />

                          <ToggleRow
                            checked={settingsForm.enableCustomTrackingDomain}
                            onChange={(checked) =>
                              setSettingsForm((prev) => ({
                                ...prev,
                                enableCustomTrackingDomain: checked,
                              }))
                            }
                            title="Use Custom Tracking Domain"
                            description="Track clicks with your own domain."
                          />
                        </div>
                      </section>

                      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                        <div className="mb-5 flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                            <Flame className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-950">
                              Warmup Config
                            </h3>
                            <p className="text-sm text-slate-500">
                              Control warmup pace and reply target.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <FieldLabel>Daily Warmup Limit</FieldLabel>
                            <TextInput
                              type="number"
                              value={settingsForm.dailyWarmupLimit}
                              onChange={(value) =>
                                setSettingsForm((prev) => ({
                                  ...prev,
                                  dailyWarmupLimit: Number(value || 0),
                                }))
                              }
                            />
                          </div>

                          <div>
                            <FieldLabel>Increase Per Day</FieldLabel>
                            <TextInput
                              type="number"
                              value={settingsForm.increasePerDay}
                              onChange={(value) =>
                                setSettingsForm((prev) => ({
                                  ...prev,
                                  increasePerDay: Number(value || 0),
                                }))
                              }
                            />
                          </div>

                          <div>
                            <FieldLabel>Target Reply Rate %</FieldLabel>
                            <TextInput
                              type="number"
                              value={settingsForm.replyRate}
                              onChange={(value) =>
                                setSettingsForm((prev) => ({
                                  ...prev,
                                  replyRate: Number(value || 0),
                                }))
                              }
                            />
                          </div>

                          <div>
                            <FieldLabel>Warmup Filter Tag</FieldLabel>
                            <TextInput
                              value={settingsForm.warmupFilterTag}
                              onChange={(value) =>
                                setSettingsForm((prev) => ({
                                  ...prev,
                                  warmupFilterTag: value,
                                }))
                              }
                              placeholder="warmup"
                            />
                          </div>
                        </div>

                        <div className="mt-5">
                          <ToggleRow
                            checked={settingsForm.disableSlowWarmup}
                            onChange={(checked) =>
                              setSettingsForm((prev) => ({
                                ...prev,
                                disableSlowWarmup: checked,
                              }))
                            }
                            title="Disable Slow Warmup Phase"
                            description="Use direct warmup settings without gradual ramp."
                          />
                        </div>
                      </section>

                      <div className="sticky bottom-0 z-10 -mx-3 border-t border-slate-200 bg-slate-50/95 px-3 py-3 backdrop-blur sm:-mx-4 sm:px-4 lg:-mx-5 lg:px-5">
                        <div className="mx-auto flex max-w-5xl justify-stretch sm:justify-end">
                          <button
                            type="button"
                            onClick={handleSaveSettings}
                            disabled={savingSettings}
                            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-sm font-bold text-white shadow-xl shadow-slate-300 transition hover:bg-black disabled:opacity-60 sm:w-auto"
                          >
                            {savingSettings ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            {savingSettings ? "Saving..." : "Save Settings"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "campaigns" && (
                    <div className="space-y-4 pb-6">
                      {(detail.campaigns || []).length === 0 ? (
                        <EmptyState
                          title="No linked campaigns"
                          description="This mailbox is not connected to any campaign yet."
                        />
                      ) : (
                        <>
                          <div className="grid gap-3 lg:hidden">
                            {detail.campaigns.map((campaign) => (
                              <div
                                key={campaign._id}
                                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <h3 className="truncate text-sm font-bold text-slate-950">
                                      {campaign.name}
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500">
                                      {getFlowLabel(campaign.flowType)}
                                    </p>
                                  </div>

                                  <span
                                    className={cx(
                                      "shrink-0 rounded-full border px-3 py-1 text-xs font-bold",
                                      getCampaignStatusChip(campaign.status)
                                    )}
                                  >
                                    {campaign.statusLabel}
                                  </span>
                                </div>

                                <div className="mt-4 flex items-center justify-between gap-3">
                                  <p className="text-xs text-slate-500">
                                    Created{" "}
                                    <span className="font-semibold text-slate-700">
                                      {formatDate(campaign.createdAt)}
                                    </span>
                                  </p>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      router.push(
                                        `/admin/crm/campaigns/${campaign._id}`
                                      )
                                    }
                                    className="text-sm font-bold text-slate-950 hover:underline"
                                  >
                                    View
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                  <tr>
                                    <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                                      Campaign
                                    </th>
                                    <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                                      Status
                                    </th>
                                    <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                                      Created
                                    </th>
                                    <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                                      Action
                                    </th>
                                  </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 bg-white">
                                  {detail.campaigns.map((campaign) => (
                                    <tr
                                      key={campaign._id}
                                      className="transition hover:bg-slate-50"
                                    >
                                      <td className="px-5 py-4">
                                        <p className="text-sm font-bold text-slate-950">
                                          {campaign.name}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                          {getFlowLabel(campaign.flowType)}
                                        </p>
                                      </td>

                                      <td className="whitespace-nowrap px-5 py-4">
                                        <span
                                          className={cx(
                                            "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                                            getCampaignStatusChip(campaign.status)
                                          )}
                                        >
                                          {campaign.statusLabel}
                                        </span>
                                      </td>

                                      <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-600">
                                        {formatDate(campaign.createdAt)}
                                      </td>

                                      <td className="whitespace-nowrap px-5 py-4 text-right">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            router.push(
                                              `/admin/crm/campaigns/${campaign._id}`
                                            )
                                          }
                                          className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-black"
                                        >
                                          View
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}