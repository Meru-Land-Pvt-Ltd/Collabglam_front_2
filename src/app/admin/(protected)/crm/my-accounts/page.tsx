"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminGet, adminPatch, adminPost, getApiErrorMessage } from "@/lib/api";

// --- Types ---
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

// --- Utilities ---
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
  if (normalized === "active") return "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20";
  if (normalized === "paused") return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20";
  return "bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/20";
}

function getCampaignStatusChip(status?: string) {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "launched") return "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20";
  if (normalized === "ready") return "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20";
  if (normalized === "paused") return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20";
  if (normalized === "completed") return "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20";
  return "bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/20";
}

// --- Components ---
function MetricCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <div className="flex flex-col justify-center rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-2 truncate text-2xl font-semibold text-gray-900">{value}</p>
      {subtext && <p className="mt-1 text-xs text-gray-500">{subtext}</p>}
    </div>
  );
}

// --- Main Page ---
export default function MyAccountsPage() {
  const router = useRouter();

  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submittingEmail, setSubmittingEmail] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [payload, setPayload] = useState<MyAccountsListPayload["data"] | null>(null);
  const [detail, setDetail] = useState<AccountDetailPayload["data"] | null>(null);

  const [selectedEmail, setSelectedEmail] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("warmup");

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

      const response = await adminGet<MyAccountsListPayload>("/outreach/mailboxes/my-accounts");

      if (!response?.success) {
        throw new Error(response?.message || "Failed to load accounts");
      }

      const nextPayload = response.data || null;
      setPayload(nextPayload);

      const defaultEmail = nextPayload?.primaryEmail || nextPayload?.accounts?.[0]?.email || "";
      setSelectedEmail((prev) => prev || defaultEmail);
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
        tags: Array.isArray(nextDetail?.settings?.tags) ? nextDetail.settings.tags.join(", ") : "",
        dailyLimit: Number(nextDetail?.settings?.dailyLimit || 0),
        minimumWaitTime: Number(nextDetail?.settings?.minimumWaitTime || 1),
        campaignSlowRamp: Boolean(nextDetail?.settings?.campaignSlowRamp),
        replyToAddress: nextDetail?.settings?.replyToAddress || "",
        dailyInboxPlacementTestLimit: Number(nextDetail?.settings?.dailyInboxPlacementTestLimit || 10),
        customTrackingDomain: nextDetail?.settings?.customTrackingDomain || "",
        enableCustomTrackingDomain: Boolean(nextDetail?.settings?.enableCustomTrackingDomain),
        warmupFilterTag: nextDetail?.settings?.warmupFilterTag || "",
        increasePerDay: Number(nextDetail?.settings?.increasePerDay || 1),
        dailyWarmupLimit: Number(nextDetail?.settings?.dailyWarmupLimit || 10),
        disableSlowWarmup: Boolean(nextDetail?.settings?.disableSlowWarmup),
        replyRate: Number(nextDetail?.settings?.replyRate || 30),
      });
    } catch (err) {
      const message = await getApiErrorMessage(err, "Failed to load account details");
      setError(message);
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);
  useEffect(() => { if (selectedEmail) loadDetails(selectedEmail); }, [selectedEmail, loadDetails]);

  const handleSetPrimary = useCallback(async (email: string) => {
    try {
      setSubmittingEmail(email);
      setError("");
      setSuccess("");

      const response = await adminPost<MyAccountsListPayload>("/outreach/mailboxes/my-accounts/primary", { email });

      if (!response?.success) throw new Error(response?.message || "Failed to update primary mailbox");

      setSuccess("Primary mailbox updated successfully.");
      await loadAccounts();
      await loadDetails(email);
    } catch (err) {
      const message = await getApiErrorMessage(err, "Failed to update primary mailbox");
      setError(message);
    } finally {
      setSubmittingEmail("");
    }
  }, [loadAccounts, loadDetails]);

  const handlePauseResume = useCallback(async () => {
    if (!detail?.account?.email) return;

    try {
      setSubmittingEmail(detail.account.email);
      setError("");
      setSuccess("");

      const endpoint = detail.account.isPaused
        ? `/outreach/mailboxes/my-accounts/${encodeURIComponent(detail.account.email)}/resume`
        : `/outreach/mailboxes/my-accounts/${encodeURIComponent(detail.account.email)}/pause`;

      const response = await adminPost(endpoint, {});

      if (!response?.success) throw new Error(response?.message || "Failed to update account status");

      setSuccess(detail.account.isPaused ? "Mailbox resumed successfully." : "Mailbox paused successfully.");
      await loadAccounts();
      await loadDetails(detail.account.email);
    } catch (err) {
      const message = await getApiErrorMessage(err, "Failed to update account status");
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
        ? `/outreach/mailboxes/my-accounts/${encodeURIComponent(detail.account.email)}/warmup/disable`
        : `/outreach/mailboxes/my-accounts/${encodeURIComponent(detail.account.email)}/warmup/enable`;

      const response = await adminPost(endpoint, {});

      if (!response?.success) throw new Error(response?.message || "Failed to update warmup");

      setSuccess(detail.warmup.enabled ? "Warmup disabled successfully." : "Warmup enabled successfully.");
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

      const response = await adminPatch(`/outreach/mailboxes/my-accounts/${encodeURIComponent(detail.account.email)}/settings`, settingsForm);

      if (!response?.success) throw new Error(response?.message || "Failed to save settings");

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
  const role = payload?.role || "";
  const canSelectPrimary = Boolean(payload?.canSelectPrimary);

  const filteredAccounts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return accounts;
    return accounts.filter((item) => {
      const haystack = [item.email, item.provider].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [accounts, search]);

  const primaryAccount = useMemo(() => accounts.find((item) => item.isPrimary) || accounts[0] || null, [accounts]);

  const chartMax = useMemo(() => {
    const values = detail?.warmup?.chart?.flatMap((item) => [item.sent, item.received]) || [1];
    return Math.max(...values, 1);
  }, [detail]);

  return (
    <div className="flex flex-col space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Accounts</h1>
          <p className="mt-1 text-sm text-gray-500">Manage settings, warmup status, and campaigns for your mailboxes.</p>
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">{error}</div>}
      {success && <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">{success}</div>}

      {/* Top Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Total Accounts" value={loadingList ? "—" : payload?.totalAccounts ?? 0} />
        <MetricCard label="Primary Mailbox" value={loadingList ? "Loading..." : primaryAccount?.email || "None"} />
        <MetricCard 
          label="Primary Selection" 
          value={canSelectPrimary ? "Enabled" : "Locked"} 
          subtext={canSelectPrimary ? "Available for SDR and IME" : "Single active mailbox for this role"} 
        />
      </div>

      {/* Main Split Layout */}
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)] items-start">
        
        {/* Left Pane: Account List */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm h-[600px]">
          <div className="border-b border-gray-200 px-5 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Assigned Mailboxes</h2>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">{filteredAccounts.length}</span>
            </div>
            <div className="relative">
              <svg className="absolute left-3 top-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search emails..."
                className="w-full rounded-md border border-gray-300 bg-white py-1.5 pl-9 pr-3 text-sm text-gray-900 shadow-sm focus:border-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">Email</th>
                  <th scope="col" className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">Sent Today</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loadingList ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-5 py-4"><div className="h-4 w-32 animate-pulse rounded bg-gray-200" /></td>
                      <td className="px-5 py-4 text-right"><div className="h-4 w-12 animate-pulse rounded bg-gray-200 ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-5 py-10 text-center text-sm text-gray-500">No accounts found</td>
                  </tr>
                ) : (
                  filteredAccounts.map((account) => {
                    const active = selectedEmail === account.email;
                    const sentToday = Number(account.emailsSentToday || 0);
                    const dailyLimit = Number(account.instantlyMeta?.dailyLimit || 0);

                    return (
                      <tr
  key={account.email}
  onClick={() => setSelectedEmail(account.email)}
  className={cx(
    "cursor-pointer transition-colors",
    active ? "bg-gray-50" : "hover:bg-gray-50/50" // Removed 'relative' from here
  )}
>
  {/* Apply relative here, and change the indicator from <td> to <div> */}
  <td className="px-5 py-4 whitespace-nowrap relative">
    {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1a1a1a]" />}
    
    <div className="flex items-center gap-2">
      <p className={cx("truncate text-sm font-semibold", active ? "text-gray-900" : "text-gray-700")}>
        {account.email}
      </p>
      {account.isPrimary && (
        <span className="rounded-md bg-[#1a1a1a] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
          Primary
        </span>
      )}
    </div>
    <p className="mt-0.5 text-[11px] text-gray-500">{getProviderLabel(account.provider)}</p>
  </td>
  <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
    {dailyLimit > 0 ? `${sentToday} / ${dailyLimit}` : formatValue(sentToday)}
  </td>
</tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Pane: Detail View */}
        <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm min-h-[600px]">
          {!selectedEmail || !detail ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-gray-500">
              {loadingDetail ? "Loading account details..." : "Select an account to view details"}
            </div>
          ) : (
            <>
              {/* Detail Header */}
              <div className="border-b border-gray-200 px-6 pt-5 pb-0">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="truncate text-xl font-bold text-gray-900">{detail.account.email}</h2>
                      <span className={cx("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", getStatusChip(detail.account.statusLabel))}>
                        {detail.account.statusLabel}
                      </span>
                      {detail.account.isPrimary && (
                        <span className="inline-flex items-center rounded-md bg-[#1a1a1a] px-2 py-0.5 text-xs font-bold text-white uppercase tracking-wider">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {getProviderLabel(detail.account.provider)} &bull; Assigned {formatDate(detail.account.assignedAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {canSelectPrimary && !detail.account.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(detail.account.email)}
                        disabled={submittingEmail === detail.account.email}
                        className="inline-flex items-center justify-center rounded-md border border-[#1a1a1a] bg-white px-3 py-1.5 text-sm font-medium text-[#1a1a1a] shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:ring-offset-2 disabled:opacity-50 transition-colors"
                      >
                        {submittingEmail === detail.account.email ? "Updating..." : "Set as Primary"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handlePauseResume}
                      disabled={submittingEmail === detail.account.email}
                      className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:ring-offset-2 disabled:opacity-50 transition-colors"
                    >
                      {submittingEmail === detail.account.email ? "..." : detail.account.isPaused ? "Resume Mailbox" : "Pause Mailbox"}
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 -mb-px">
                  {(["warmup", "settings", "campaigns"] as TabKey[]).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={cx(
                        "whitespace-nowrap border-b-2 py-3 text-sm font-semibold capitalize transition-colors focus:outline-none",
                        activeTab === tab
                          ? "border-[#1a1a1a] text-[#1a1a1a]"
                          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
                {activeTab === "warmup" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">Warmup Status</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Started on <span className="font-semibold text-gray-700">{formatDate(detail.warmup.startedOn)}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleWarmupToggle}
                        disabled={submittingEmail === detail.account.email}
                        className={cx(
                          "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors",
                          detail.warmup.enabled
                            ? "bg-white border border-red-200 text-red-600 hover:bg-red-50 focus:ring-red-500"
                            : "bg-[#1a1a1a] text-white hover:bg-black focus:ring-[#1a1a1a]"
                        )}
                      >
                        {submittingEmail === detail.account.email ? "Updating..." : detail.warmup.enabled ? "Disable Warmup" : "Enable Warmup"}
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <MetricCard label="Received" value={detail.warmup.summary.received} />
                      <MetricCard label="Sent" value={detail.warmup.summary.sent} />
                      <MetricCard label="Saved from Spam" value={detail.warmup.summary.savedFromSpam} />
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-sm font-bold text-gray-900">Warmup Performance</h3>
                          <p className="text-xs text-gray-500">Past 7 daily data points</p>
                        </div>
                        <span className={cx("inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", detail.warmup.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800")}>
                          {detail.warmup.enabled ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div className="grid grid-cols-7 gap-2 items-end h-[200px] mt-4">
                        {(detail.warmup.chart || []).map((item, index) => {
                          const sentHeight = `${Math.max((item.sent / chartMax) * 160, 8)}px`;
                          return (
                            <div key={`${item.label}-${index}`} className="flex flex-col items-center justify-end h-full gap-2">
                              <div className="w-8 rounded-t bg-green-500 transition-all hover:bg-green-400" style={{ height: sentHeight }} title={`Sent: ${item.sent}`} />
                              <span className="text-[10px] font-medium text-gray-500">{item.label || "—"}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "settings" && (
                  <div className="space-y-8 max-w-3xl">
                    
                    <section>
                      <h3 className="text-sm font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Sender Details</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                          <input
                            value={settingsForm.firstName}
                            onChange={(e) => setSettingsForm((prev) => ({ ...prev, firstName: e.target.value }))}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                          <input
                            value={settingsForm.lastName}
                            onChange={(e) => setSettingsForm((prev) => ({ ...prev, lastName: e.target.value }))}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Signature</label>
                          <textarea
                            value={settingsForm.signature}
                            onChange={(e) => setSettingsForm((prev) => ({ ...prev, signature: e.target.value }))}
                            rows={4}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a] resize-y"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Tags (Comma separated)</label>
                          <input
                            value={settingsForm.tags}
                            onChange={(e) => setSettingsForm((prev) => ({ ...prev, tags: e.target.value }))}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
                            placeholder="sales, primary, outbound"
                          />
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-sm font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Campaign Settings</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Daily Campaign Limit</label>
                          <input
                            type="number"
                            value={settingsForm.dailyLimit}
                            onChange={(e) => setSettingsForm((prev) => ({ ...prev, dailyLimit: Number(e.target.value || 0) }))}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Min. Wait Time (mins)</label>
                          <input
                            type="number"
                            value={settingsForm.minimumWaitTime}
                            onChange={(e) => setSettingsForm((prev) => ({ ...prev, minimumWaitTime: Number(e.target.value || 0) }))}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Custom Tracking Domain</label>
                          <input
                            value={settingsForm.customTrackingDomain}
                            onChange={(e) => setSettingsForm((prev) => ({ ...prev, customTrackingDomain: e.target.value }))}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
                            placeholder="track.yourdomain.com"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-3">
                        <label className="flex items-center gap-3 bg-white p-3 border border-gray-200 rounded-md shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
                          <input
                            type="checkbox"
                            checked={settingsForm.campaignSlowRamp}
                            onChange={(e) => setSettingsForm((prev) => ({ ...prev, campaignSlowRamp: e.target.checked }))}
                            className="h-4 w-4 rounded border-gray-300 text-[#1a1a1a] focus:ring-[#1a1a1a]"
                          />
                          <span className="text-sm font-medium text-gray-900">Enable Campaign Slow Ramp</span>
                        </label>
                        <label className="flex items-center gap-3 bg-white p-3 border border-gray-200 rounded-md shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
                          <input
                            type="checkbox"
                            checked={settingsForm.enableCustomTrackingDomain}
                            onChange={(e) => setSettingsForm((prev) => ({ ...prev, enableCustomTrackingDomain: e.target.checked }))}
                            className="h-4 w-4 rounded border-gray-300 text-[#1a1a1a] focus:ring-[#1a1a1a]"
                          />
                          <span className="text-sm font-medium text-gray-900">Use Custom Tracking Domain</span>
                        </label>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-sm font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Warmup Config</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Daily Limit</label>
                          <input
                            type="number"
                            value={settingsForm.dailyWarmupLimit}
                            onChange={(e) => setSettingsForm((prev) => ({ ...prev, dailyWarmupLimit: Number(e.target.value || 0) }))}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Increase Per Day</label>
                          <input
                            type="number"
                            value={settingsForm.increasePerDay}
                            onChange={(e) => setSettingsForm((prev) => ({ ...prev, increasePerDay: Number(e.target.value || 0) }))}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Target Reply Rate (%)</label>
                          <input
                            type="number"
                            value={settingsForm.replyRate}
                            onChange={(e) => setSettingsForm((prev) => ({ ...prev, replyRate: Number(e.target.value || 0) }))}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="flex items-center gap-3 bg-white p-3 border border-gray-200 rounded-md shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
                          <input
                            type="checkbox"
                            checked={settingsForm.disableSlowWarmup}
                            onChange={(e) => setSettingsForm((prev) => ({ ...prev, disableSlowWarmup: e.target.checked }))}
                            className="h-4 w-4 rounded border-gray-300 text-[#1a1a1a] focus:ring-[#1a1a1a]"
                          />
                          <span className="text-sm font-medium text-gray-900">Disable Slow Warmup Phase</span>
                        </label>
                      </div>
                    </section>

                    <div className="pt-4 flex justify-end border-t border-gray-200">
                      <button
                        type="button"
                        onClick={handleSaveSettings}
                        disabled={savingSettings}
                        className="inline-flex items-center justify-center rounded-md bg-[#1a1a1a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-black focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:ring-offset-2 disabled:opacity-50 transition-colors"
                      >
                        {savingSettings ? "Saving..." : "Save Settings"}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "campaigns" && (
                  <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">Campaign Details</th>
                          <th scope="col" className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">Status</th>
                          <th scope="col" className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">Created</th>
                          <th scope="col" className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {(detail.campaigns || []).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-5 py-12 text-center text-sm text-gray-500">
                              No campaigns linked to this mailbox.
                            </td>
                          </tr>
                        ) : (
                          detail.campaigns.map((campaign) => (
                            <tr key={campaign._id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-4">
                                <p className="text-sm font-semibold text-gray-900">{campaign.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{campaign.flowType}</p>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <span className={cx("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", getCampaignStatusChip(campaign.status))}>
                                  {campaign.statusLabel}
                                </span>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                                {formatDate(campaign.createdAt)}
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  type="button"
                                  onClick={() => router.push(`/admin/crm/campaigns/${campaign._id}`)}
                                  className="text-[#1a1a1a] hover:underline hover:text-black font-semibold"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}