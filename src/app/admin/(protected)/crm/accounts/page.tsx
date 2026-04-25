"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { adminGet, adminPost } from "@/lib/api";
import AdminTable, { type AdminTableColumn } from "../../../components/table";

// --- Types ---
type InstantlyAccount = {
  email: string;
  first_name?: string;
  last_name?: string;
  timestamp_created?: string;
  timestamp_updated?: string;
  warmup_status?: number;
  provider_code?: number;
  setup_pending?: boolean;
  is_managed_account?: boolean;
  daily_limit?: number;
  status?: number;
  stat_warmup_score?: number;
  sending_gap?: number;
  warmup?: {
    limit?: number;
    increment?: string;
    reply_rate?: number;
    advanced?: {
      warm_ctd?: boolean;
      open_rate?: number;
      important_rate?: number;
      read_emulation?: boolean;
      spam_save_rate?: number;
      weekday_only?: boolean;
    };
  };
};

type ApiState = { type: "success" | "error" | "info"; text: string } | null;

type OAuthProvider = "google" | "microsoft";
type OAuthSessionStatus = "idle" | "pending" | "success" | "error" | "expired";

type OAuthSessionState = {
  provider: OAuthProvider;
  sessionId: string;
  authUrl: string;
  expiresAt: string;
  status: OAuthSessionStatus;
  email?: string;
  error?: string;
} | null;

type MailboxRole = "sdr" | "revenue_head" | "bme" | "ime";

type MailboxAssignment = {
  _id: string;
  email: string;
  role: MailboxRole;
  adminId: string | { _id: string; name?: string; email?: string; role?: string };
  provider?: "google" | "microsoft" | "unknown";
  isActive: boolean;
  isPrimary: boolean;
  assignedAt?: string;
  updatedAt?: string;
};

type AssignmentForm = {
  role: MailboxRole;
  adminId: string;
  isPrimary: boolean;
};

type AdminOption = {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  revenueHeadName?: string;
  parentAdminName?: string;
  parentAdmin?: string | { _id?: string; name?: string; email?: string; role?: string };
};

type AdminDirectory = Record<MailboxRole, AdminOption[]>;

type StatusFilter = "all" | "active" | "paused" | "other";
type WarmupFilter = "all" | "on" | "off" | "issue" | "unknown";
type RoleFilter = "all" | "unassigned" | MailboxRole;

const roleOptions: Array<{ value: MailboxRole; label: string }> = [
  { value: "sdr", label: "SDR" },
  { value: "revenue_head", label: "Revenue Head" },
  { value: "bme", label: "BME" },
  { value: "ime", label: "IME" },
];

const emptyAdminDirectory: AdminDirectory = {
  sdr: [],
  revenue_head: [],
  bme: [],
  ime: [],
};

// --- Utilities ---
function normalizeEmail(value?: string) {
  return String(value || "").trim().toLowerCase();
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getWarmupText(warmupStatus?: number) {
  if (warmupStatus === 1) return "On";
  if (warmupStatus === 0) return "Off";
  if (typeof warmupStatus === "number" && warmupStatus < 0) return "Issue";
  return "Unknown";
}

function getStatusText(status?: number) {
  if (status === 1) return "Active";
  if (status === 2) return "Paused";
  return typeof status === "number" ? `Status ${status}` : "Unknown";
}

function getOAuthStatusClasses(status?: OAuthSessionStatus) {
  if (status === "success") return "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20";
  if (status === "pending") return "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20";
  if (status === "error") return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20";
  if (status === "expired") return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20";
  return "bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/20";
}

function getOAuthStatusText(status?: OAuthSessionStatus) {
  if (status === "success") return "Connected";
  if (status === "pending") return "Pending Login";
  if (status === "error") return "Failed";
  if (status === "expired") return "Expired";
  return "Idle";
}

function getRoleLabel(role?: string) {
  if (role === "sdr") return "SDR";
  if (role === "revenue_head") return "Revenue Head";
  if (role === "bme") return "BME";
  if (role === "ime") return "IME";
  return "Unassigned";
}

function getAssignmentAdminId(assignment?: MailboxAssignment | null) {
  if (!assignment) return "";
  return typeof assignment.adminId === "string" ? assignment.adminId : assignment.adminId?._id || "";
}

function getAssignmentAdminLabel(assignment?: MailboxAssignment | null) {
  if (!assignment) return "—";
  if (typeof assignment.adminId === "string") return assignment.adminId;
  return assignment.adminId?.name || assignment.adminId?.email || assignment.adminId?._id || "—";
}

function getNestedName(value: any) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value?.name || value?.fullName || value?.email || "";
}

function getRevenueHeadName(item: any) {
  return (
    item?.revenueHeadName ||
    item?.revenue_head_name ||
    item?.rmName ||
    item?.rm_name ||
    getNestedName(item?.revenueHead) ||
    getNestedName(item?.revenue_head) ||
    getNestedName(item?.rm) ||
    getNestedName(item?.reportingManager) ||
    getNestedName(item?.reporting_manager) ||
    ""
  );
}

function getAdminDisplayName(admin?: AdminOption | null) {
  if (!admin) return "";
  return admin.name || admin.email || admin._id;
}

function getAdminOptionLabel(admin?: AdminOption | null, role?: MailboxRole) {
  if (!admin) return "";

  const name = admin.name || admin.email || admin._id;

  if (role === "revenue_head" || admin.role === "revenue_head") {
    return name;
  }

  const revenueHeadName =
    admin.revenueHeadName ||
    admin.parentAdminName ||
    (typeof admin.parentAdmin === "object" ? admin.parentAdmin?.name : "");

  return revenueHeadName ? `${name} (${revenueHeadName})` : name;
}

function getAssignmentAdminLabelFromDirectory(assignment: MailboxAssignment | null, directory: AdminDirectory) {
  if (!assignment) return "—";
  if (typeof assignment.adminId !== "string") return getAssignmentAdminLabel(assignment);
  const matchedAdmin = (directory[assignment.role] || []).find((admin) => admin._id === assignment.adminId);
  return getAdminOptionLabel(matchedAdmin, assignment.role) || assignment.adminId;
}

function parseAdminRows(payload: any): AdminOption[] {
  const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];

  return rows
    .filter(Boolean)
    .map((item: any) => {
      const revenueHeadName =
        item?.revenueHeadName ||
        item?.parentAdminName ||
        item?.parentAdmin?.name ||
        item?.parentAdmin?.email ||
        "";

      return {
        _id: String(item?._id || ""),
        name: item?.name || "",
        email: item?.email || "",
        role: item?.role || "",
        status: item?.status || "",
        revenueHeadName,
        parentAdminName: revenueHeadName,
        parentAdmin: item?.parentAdmin || "",
      };
    })
    .filter((item: AdminOption) => item._id);
}

// --- Components ---
function ToolbarSelect({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
    >
      {children}
    </select>
  );
}

function ToggleSwitch({ checked, onChange, disabled, onLabel = "On", offLabel = "Off" }: { checked: boolean; onChange: () => void; disabled?: boolean; onLabel?: string; offLabel?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={cx(
        "inline-flex w-[78px] items-center rounded-full border p-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "border-green-200 bg-green-50 text-green-700" : "border-gray-200 bg-gray-50 text-gray-600"
      )}
    >
      <span
        className={cx(
          "flex h-6 w-8 items-center justify-center rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-8" : "translate-x-0"
        )}
      >
        {checked ? onLabel : offLabel}
      </span>
    </button>
  );
}

// --- Main Page ---
export default function InstantlyAccountsPage() {
  const [accounts, setAccounts] = useState<InstantlyAccount[]>([]);
  const [assignments, setAssignments] = useState<MailboxAssignment[]>([]);
  const [adminDirectory, setAdminDirectory] = useState<AdminDirectory>(emptyAdminDirectory);
  const [assignmentForms, setAssignmentForms] = useState<Record<string, AssignmentForm>>({});
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState<string>("");
  const [oauthLoading, setOauthLoading] = useState<"" | OAuthProvider>("");
  const [message, setMessage] = useState<ApiState>(null);
  const [oauthSession, setOauthSession] = useState<OAuthSessionState>(null);
  const [copied, setCopied] = useState(false);
  const [statusChecking, setStatusChecking] = useState(false);
  const [autoPolling, setAutoPolling] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [warmupFilter, setWarmupFilter] = useState<WarmupFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

  const pollRef = useRef<number | null>(null);
  const authUrlRef = useRef<HTMLInputElement | null>(null);

  const activeAssignmentMap = useMemo(() => {
    const map = new Map<string, MailboxAssignment>();
    assignments
      .filter((item) => item.isActive)
      .forEach((item) => {
        map.set(normalizeEmail(item.email), item);
      });
    return map;
  }, [assignments]);

  const filteredAccounts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return accounts.filter((account) => {
      const emailKey = normalizeEmail(account.email);
      const assignment = activeAssignmentMap.get(emailKey) || null;

      if (query) {
        const haystack = [
          emailKey,
          account.first_name,
          account.last_name,
          getAssignmentAdminLabelFromDirectory(assignment, adminDirectory),
          assignment?.role,
          getStatusText(account.status),
          getWarmupText(account.warmup_status),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      if (statusFilter === "active" && account.status !== 1) return false;
      if (statusFilter === "paused" && account.status !== 2) return false;
      if (statusFilter === "other" && (account.status === 1 || account.status === 2)) return false;
      if (warmupFilter === "on" && account.warmup_status !== 1) return false;
      if (warmupFilter === "off" && account.warmup_status !== 0) return false;
      if (warmupFilter === "issue" && !(typeof account.warmup_status === "number" && account.warmup_status < 0)) return false;
      if (roleFilter === "unassigned" && assignment) return false;
      if (roleFilter !== "all" && roleFilter !== "unassigned" && assignment?.role !== roleFilter) return false;

      return true;
    });
  }, [accounts, activeAssignmentMap, adminDirectory, roleFilter, search, statusFilter, warmupFilter]);

  function clearPolling() {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setAutoPolling(false);
  }

  function syncAssignmentForms(rows: MailboxAssignment[]) {
    setAssignmentForms((prev) => {
      const next = { ...prev };
      rows.forEach((row) => {
        const email = normalizeEmail(row.email);
        next[email] = {
          role: row.role,
          adminId: getAssignmentAdminId(row),
          isPrimary: Boolean(row.isPrimary),
        };
      });
      return next;
    });
  }

  async function fetchAccounts() {
    const payload: any = await adminGet("/instantly/accounts");
    if (payload?.success === false) throw new Error(payload?.message || "Failed to load accounts");
    const items = Array.isArray(payload?.data?.items) ? payload.data.items : Array.isArray(payload?.items) ? payload.items : [];
    setAccounts(items);
  }

  async function fetchAssignments() {
    const payload: any = await adminGet("/outreach/mailboxes", { activeOnly: false });
    if (payload?.success === false) throw new Error(payload?.message || "Failed to load assignments");
    const rows = Array.isArray(payload?.data) ? payload.data : [];
    setAssignments(rows);
    syncAssignmentForms(rows);
  }

  async function fetchAdminDirectory() {
    const [rmPayload, sdrPayload, bmePayload, imePayload] = await Promise.all([
      adminGet("/admins/get-rm-list"),
      adminGet("/admins/get-executive-list", { role: "sdr" }),
      adminGet("/admins/get-executive-list", { role: "bme" }),
      adminGet("/admins/get-executive-list", { role: "ime" }),
    ]);

    setAdminDirectory({
      revenue_head: parseAdminRows(rmPayload),
      sdr: parseAdminRows(sdrPayload),
      bme: parseAdminRows(bmePayload),
      ime: parseAdminRows(imePayload),
    });
  }

  async function loadPage(showLoader = true) {
    try {
      if (showLoader) setLoading(true);
      setMessage(null);
      await Promise.all([fetchAccounts(), fetchAssignments(), fetchAdminDirectory()]);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to load data" });
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  useEffect(() => {
    loadPage(true);
    return () => clearPolling();
  }, []);

  async function runAccountAction(path: string, successText: string, refreshDelay = 0) {
    try {
      setMessage(null);
      const payload: any = await adminPost(path);
      if (payload?.success === false) throw new Error(payload?.message || "Request failed");
      setMessage({ type: "success", text: successText });
      if (refreshDelay > 0) window.setTimeout(() => loadPage(false), refreshDelay);
      else loadPage(false);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Action failed" });
    }
  }

  function handleAssignmentFormChange(email: string, patch: Partial<AssignmentForm>) {
    const key = normalizeEmail(email);
    setAssignmentForms((prev) => {
      const existing = prev[key] || { role: "sdr" as MailboxRole, adminId: "", isPrimary: false };
      const nextRole = (patch.role || existing.role) as MailboxRole;
      const shouldResetAdmin = patch.role !== undefined && patch.role !== existing.role;
      return {
        ...prev,
        [key]: {
          ...existing,
          ...patch,
          role: nextRole,
          adminId: shouldResetAdmin ? "" : patch.adminId ?? existing.adminId,
          isPrimary: nextRole === "sdr" ? patch.isPrimary ?? existing.isPrimary : false,
        },
      };
    });
  }

  async function handleAssignMailbox(email: string) {
    const key = normalizeEmail(email);
    const form = assignmentForms[key];

    if (!form?.adminId?.trim()) {
      setMessage({ type: "error", text: "Select an admin to assign." });
      return;
    }

    try {
      setActionKey(`${key}-assign`);
      setMessage(null);
      const payload: any = await adminPost("/outreach/mailboxes/assign", {
        email: key,
        role: form.role,
        adminId: form.adminId.trim(),
        isPrimary: form.role === "sdr" ? form.isPrimary : false,
      });
      if (payload?.success === false) throw new Error(payload?.message || "Failed to assign");
      setMessage({ type: "success", text: payload?.message || "Assigned successfully" });
      await Promise.all([fetchAssignments(), fetchAdminDirectory()]);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to assign" });
    } finally {
      setActionKey("");
    }
  }

  async function handleUnassignMailbox(email: string) {
    const key = normalizeEmail(email);
    try {
      setActionKey(`${key}-unassign`);
      setMessage(null);
      const payload: any = await adminPost(`/outreach/mailboxes/${encodeURIComponent(key)}/unassign`);
      if (payload?.success === false) throw new Error(payload?.message || "Failed to unassign");
      setMessage({ type: "success", text: payload?.message || "Unassigned successfully" });
      await fetchAssignments();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to unassign" });
    } finally {
      setActionKey("");
    }
  }

  async function handlePauseResume(account: InstantlyAccount) {
    const email = encodeURIComponent(account.email);
    const isActive = account.status === 1;
    setActionKey(`${account.email}-status`);
    await runAccountAction(
      isActive ? `/instantly/accounts/${email}/pause` : `/instantly/accounts/${email}/resume`,
      isActive ? "Account paused" : "Account resumed"
    );
    setActionKey("");
  }

  async function handleWarmupToggle(account: InstantlyAccount) {
    const email = encodeURIComponent(account.email);
    const warmupEnabled = account.warmup_status === 1;
    setActionKey(`${account.email}-warmup`);
    await runAccountAction(
      warmupEnabled ? `/instantly/accounts/${email}/warmup/disable` : `/instantly/accounts/${email}/warmup/enable`,
      warmupEnabled ? "Warmup turned off" : "Warmup turned on",
      2000
    );
    setActionKey("");
  }

  async function handleOAuthConnect(provider: OAuthProvider) {
    try {
      clearPolling();
      setCopied(false);
      setOauthLoading(provider);
      setMessage({ type: "info", text: "Generating link..." });
      const payload: any = await adminPost(`/instantly/oauth/${provider}/init`);
      if (payload?.success === false) throw new Error(payload?.message || "Failed to start OAuth");

      const authUrl = payload?.authUrl || payload?.data?.auth_url || "";
      const sessionId = payload?.sessionId || payload?.data?.session_id || "";
      if (!authUrl || !sessionId) throw new Error("Invalid OAuth response");

      setOauthSession({ provider, sessionId, authUrl, expiresAt: payload?.expiresAt || "", status: "pending" });
      setMessage({ type: "success", text: "Link generated. Connect in the correct browser profile." });
      window.setTimeout(() => {
        authUrlRef.current?.focus();
        authUrlRef.current?.select();
      }, 50);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "OAuth init failed" });
    } finally {
      setOauthLoading("");
    }
  }

  async function checkOAuthStatus(sessionOverride?: OAuthSessionState) {
    const activeSession = sessionOverride || oauthSession;
    if (!activeSession?.sessionId) return;

    try {
      setStatusChecking(true);
      const statusPayload: any = await adminGet(`/instantly/oauth/session-status/${activeSession.sessionId}`);
      if (statusPayload?.success === false) throw new Error(statusPayload?.message || "Failed to check status");

      const data = statusPayload?.data || {};
      const status = String(data?.status || "").toLowerCase() as OAuthSessionStatus;

      if (status === "pending") {
        setOauthSession((prev) => (prev ? { ...prev, status: "pending" } : prev));
        if (!autoPolling) setMessage({ type: "info", text: "Still pending." });
        return;
      }
      if (status === "success") {
        clearPolling();
        setOauthSession((prev) => (prev ? { ...prev, status: "success", email: data?.email || "" } : prev));
        setMessage({ type: "success", text: `Connected ${data?.email || "account"}.` });
        await loadPage(false);
        return;
      }
      if (status === "expired") {
        clearPolling();
        setOauthSession((prev) => (prev ? { ...prev, status: "expired", error: "Session expired." } : prev));
        setMessage({ type: "error", text: "Link expired." });
        return;
      }

      clearPolling();
      const errorText = data?.error_description || data?.error || "Connection failed";
      setOauthSession((prev) => (prev ? { ...prev, status: "error", error: errorText } : prev));
      setMessage({ type: "error", text: errorText });
    } catch (error) {
      clearPolling();
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to check status" });
    } finally {
      setStatusChecking(false);
    }
  }

  function startAutoPolling() {
    if (!oauthSession?.sessionId) return;
    clearPolling();
    setAutoPolling(true);
    pollRef.current = window.setInterval(() => checkOAuthStatus(), 3000);
  }

  async function copyAuthLink() {
    if (!oauthSession?.authUrl) return;
    try {
      if (navigator?.clipboard?.writeText) await navigator.clipboard.writeText(oauthSession.authUrl);
      else throw new Error("Clipboard API unavailable");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      authUrlRef.current?.focus();
      authUrlRef.current?.select();
      document.execCommand("copy");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  }

  function toggleExpanded(email: string) {
    setExpandedEmail((prev) => (prev === email ? null : email));
  }

  function getAdminDirectoryOptions(role: MailboxRole) {
    return adminDirectory[role] || [];
  }

  function renderExpandedRow(account: InstantlyAccount) {
    const emailKey = normalizeEmail(account.email);
    const activeAssignment = activeAssignmentMap.get(emailKey) || null;

    const form = assignmentForms[emailKey] || {
      role: activeAssignment?.role || "sdr",
      adminId: getAssignmentAdminId(activeAssignment),
      isPrimary: Boolean(activeAssignment?.isPrimary),
    };

    const adminOptions = getAdminDirectoryOptions(form.role);
    const assignActionKey = `${emailKey}-assign`;
    const unassignActionKey = `${emailKey}-unassign`;

    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm max-w-4xl">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Mailbox Assignment</h4>

        {activeAssignment ? (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Already assigned</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">{getRoleLabel(activeAssignment.role)}</span>
              {activeAssignment.isPrimary && <span className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">Primary</span>}
            </div>
            <p className="mt-1 text-sm text-gray-700">{getAssignmentAdminLabelFromDirectory(activeAssignment, adminDirectory)}</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => handleAssignmentFormChange(emailKey, { role: e.target.value as MailboxRole })}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Assignee</label>
                <select
                  value={form.adminId}
                  onChange={(e) => handleAssignmentFormChange(emailKey, { adminId: e.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
                >
                  <option value="">Select {getRoleLabel(form.role)}...</option>
                  {adminOptions.map((admin) => (
                    <option key={admin._id} value={admin._id}>
                      {getAdminOptionLabel(admin, form.role)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center h-9">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isPrimary}
                    disabled={form.role !== "sdr"}
                    onChange={(e) => handleAssignmentFormChange(emailKey, { isPrimary: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-[#1a1a1a] focus:ring-[#1a1a1a] disabled:opacity-50"
                  />
                  <span className="text-sm font-medium text-gray-700">Primary Sender</span>
                </label>
              </div>
            </div>

            <div className="mt-5 flex gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => handleAssignMailbox(account.email)}
                disabled={actionKey !== "" || !form.adminId.trim()}
                className="inline-flex justify-center rounded-md bg-[#1a1a1a] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {actionKey === assignActionKey ? "Saving..." : "Assign"}
              </button>
            </div>
          </>
        )}

        {activeAssignment && (
          <div className="mt-5 flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => handleUnassignMailbox(account.email)}
              disabled={actionKey !== ""}
              className="inline-flex justify-center rounded-md border border-[#1a1a1a] bg-white px-4 py-2 text-sm font-medium text-[#1a1a1a] shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {actionKey === unassignActionKey ? "Removing..." : "Unassign"}
            </button>
          </div>
        )}
      </div>
    );
  }

  const columns = useMemo<AdminTableColumn<InstantlyAccount>[]>(() => [
    {
      id: "account",
      header: "Account",
      cellClassName: "align-top",
      render: (account) => {
        const provider = account.provider_code === 1 ? "Google" : account.provider_code === 2 ? "Microsoft" : "Unknown";
        return (
          <div className="min-w-[200px]">
            <p className="text-sm font-semibold text-gray-900">{account.email}</p>
            <p className="text-xs text-gray-500 mt-0.5">{provider}</p>
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Active",
      cellClassName: "align-top",
      render: (account) => {
        const isActive = account.status === 1;
        return (
          <div className="space-y-1">
            <ToggleSwitch checked={isActive} onChange={() => handlePauseResume(account)} disabled={actionKey !== ""} />
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">{isActive ? "Active" : getStatusText(account.status)}</p>
          </div>
        );
      },
    },
    {
      id: "warmup",
      header: "Warmup",
      cellClassName: "align-top",
      render: (account) => {
        const warmupEnabled = account.warmup_status === 1;
        return (
          <div className="space-y-1">
            <ToggleSwitch checked={warmupEnabled} onChange={() => handleWarmupToggle(account)} disabled={actionKey !== ""} />
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Score: {account.stat_warmup_score || "-"}</p>
          </div>
        );
      },
    },
    {
      id: "mapping",
      header: "Assignment",
      cellClassName: "align-top",
      render: (account) => {
        const activeAssignment = activeAssignmentMap.get(normalizeEmail(account.email)) || null;
        return (
          <div className="min-w-[180px]">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-semibold text-gray-700">{activeAssignment ? getRoleLabel(activeAssignment.role) : "Unassigned"}</span>
              {activeAssignment?.isPrimary && <span className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">Primary</span>}
            </div>
            <p className="text-xs text-gray-500">{getAssignmentAdminLabelFromDirectory(activeAssignment, adminDirectory)}</p>
          </div>
        );
      },
    },
  ], [activeAssignmentMap, actionKey, adminDirectory]);

  return (
    <div className="flex flex-col space-y-6 font-sans">
      {message && (
        <div className={cx("rounded-md border p-4 text-sm font-medium", message.type === "success" && "border-green-200 bg-green-50 text-green-800", message.type === "error" && "border-red-200 bg-red-50 text-red-800", message.type === "info" && "border-blue-200 bg-blue-50 text-blue-800")}>
          {message.text}
        </div>
      )}

      {/* OAuth Section */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Connect Mailbox via OAuth</h3>
            <p className="text-sm text-gray-500 mt-1">Generate a link to authenticate new sender accounts.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleOAuthConnect("google")}
              disabled={oauthLoading !== ""}
              className="inline-flex justify-center rounded-md bg-[#1a1a1a] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {oauthLoading === "google" ? "..." : "Connect Google"}
            </button>
            <button
              onClick={() => handleOAuthConnect("microsoft")}
              disabled={oauthLoading !== ""}
              className="inline-flex justify-center rounded-md border border-[#1a1a1a] bg-white px-4 py-2 text-sm font-medium text-[#1a1a1a] shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {oauthLoading === "microsoft" ? "..." : "Connect Microsoft"}
            </button>
          </div>
        </div>

        {oauthSession && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className={cx("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium", getOAuthStatusClasses(oauthSession.status))}>
                {getOAuthStatusText(oauthSession.status)}
              </span>
            </div>
            <div className="flex gap-2">
              <input
                ref={authUrlRef}
                readOnly
                value={oauthSession.authUrl}
                className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 shadow-sm focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                onClick={(e) => e.currentTarget.select()}
              />
              <button onClick={copyAuthLink} className="inline-flex items-center justify-center rounded-md bg-[#1a1a1a] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black transition-colors">
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={() => checkOAuthStatus()}
                disabled={statusChecking}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {statusChecking ? "..." : "Check"}
              </button>
              {!autoPolling && oauthSession.status === "pending" && (
                <button onClick={startAutoPolling} className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
                  Auto-Check
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Directory Section */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Mailbox Directory</h3>
          <div className="flex flex-wrap gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a] w-48"
            />
            <ToolbarSelect value={statusFilter} onChange={(v) => setStatusFilter(v as StatusFilter)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </ToolbarSelect>
            <ToolbarSelect value={warmupFilter} onChange={(v) => setWarmupFilter(v as WarmupFilter)}>
              <option value="all">All Warmup</option>
              <option value="on">Warmup On</option>
              <option value="off">Warmup Off</option>
              <option value="issue">Warmup Issue</option>
            </ToolbarSelect>
            <ToolbarSelect value={roleFilter} onChange={(v) => setRoleFilter(v as RoleFilter)}>
              <option value="all">All Roles</option>
              <option value="unassigned">Unassigned</option>
              <option value="sdr">SDR</option>
              <option value="revenue_head">Revenue Head</option>
              <option value="bme">BME</option>
              <option value="ime">IME</option>
            </ToolbarSelect>
          </div>
        </div>

        <AdminTable<InstantlyAccount>
          data={filteredAccounts}
          columns={columns}
          rowKey={(row) => row.email}
          loading={loading}
          loadingRows={5}
          emptyTitle="No accounts found"
          emptyDescription="Adjust your search or filters."
          headerRowClassName="border-gray-200 bg-gray-50"
          rowClassName={(_, __, isExpanded) => cx("border-gray-100 transition-colors", isExpanded ? "bg-gray-50" : "hover:bg-gray-50/50")}
          expandable={{
            expandedRowId: expandedEmail,
            onToggle: toggleExpanded,
            renderExpandedRow: renderExpandedRow,
            expandedRowClassName: "bg-gray-50/50 border-b border-gray-200",
            expandedCellClassName: "p-6",
          }}
          actions={{
            align: "right",
            header: "",
            render: (account) => {
              const activeAssignment = activeAssignmentMap.get(normalizeEmail(account.email)) || null;
              return (
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => toggleExpanded(account.email)}
                    className="inline-flex items-center justify-center rounded-md bg-[#1a1a1a] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-black focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:ring-offset-2 transition-colors"
                  >
                    {expandedEmail === account.email ? "Close" : activeAssignment ? "View" : "Assign"}
                  </button>
                </div>
              );
            },
          }}
        />
      </section>
    </div>
  );
}
