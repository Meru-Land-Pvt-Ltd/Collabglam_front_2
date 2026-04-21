"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { adminGet, adminPost } from "@/lib/api";
import AdminTable, { type AdminTableColumn } from "../../../components/table";

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

type ApiState = {
  type: "success" | "error" | "info";
  text: string;
} | null;

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
  adminId:
    | string
    | {
        _id: string;
        name?: string;
        email?: string;
        role?: string;
      };
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

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function normalizeEmail(value?: string) {
  return String(value || "").trim().toLowerCase();
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getWarmupText(warmupStatus?: number) {
  if (warmupStatus === 1) return "Warmup On";
  if (warmupStatus === 0) return "Warmup Off";
  if (typeof warmupStatus === "number" && warmupStatus < 0) return "Warmup Issue";
  return "Unknown";
}

function getWarmupPillClasses(warmupStatus?: number) {
  if (warmupStatus === 1) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (warmupStatus === 0) return "border-zinc-200 bg-zinc-50 text-zinc-700";
  if (typeof warmupStatus === "number" && warmupStatus < 0) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

function getStatusText(status?: number) {
  if (status === 1) return "Active";
  if (status === 2) return "Paused";
  if (typeof status === "number") return `Status ${status}`;
  return "Unknown";
}

function getStatusPillClasses(status?: number) {
  if (status === 1) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === 2) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

function getOAuthStatusClasses(status?: OAuthSessionStatus) {
  if (status === "success") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "pending") return "border-sky-200 bg-sky-50 text-sky-700";
  if (status === "error") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "expired") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

function getOAuthStatusText(status?: OAuthSessionStatus) {
  if (status === "success") return "Connected";
  if (status === "pending") return "Waiting for Login";
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

function getAssignmentAdminLabel(assignment?: MailboxAssignment | null) {
  if (!assignment) return "-";

  if (typeof assignment.adminId === "string") {
    return assignment.adminId;
  }

  return (
    assignment.adminId?.name ||
    assignment.adminId?.email ||
    assignment.adminId?._id ||
    "-"
  );
}

function getAdminLabel(admin?: AdminOption | null) {
  if (!admin) return "";
  if (admin.name && admin.email) return `${admin.name} (${admin.email})`;
  return admin.name || admin.email || admin._id;
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
      status: item?.status || "",
    }))
    .filter((item: AdminOption) => item._id);
}

function ProviderBadge({ provider }: { provider: OAuthProvider }) {
  return (
    <span className="inline-flex rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-black/70">
      {provider === "google" ? "Google" : "Microsoft"}
    </span>
  );
}

function StatCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: number | string;
  hint: string;
}) {
  return (
    <div className="rounded-[22px] border border-black/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
      <p className="text-sm font-medium text-black/55">{title}</p>
      <h3 className="mt-3 text-3xl font-semibold tracking-tight text-black">{value}</h3>
      <p className="mt-2 text-sm text-black/50">{hint}</p>
    </div>
  );
}

function ToolbarSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm text-black outline-none transition focus:border-black/25"
    >
      {children}
    </select>
  );
}

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
  const authUrlRef = useRef<HTMLTextAreaElement | null>(null);

  const activeAssignmentMap = useMemo(() => {
    const map = new Map<string, MailboxAssignment>();
    assignments
      .filter((item) => item.isActive)
      .forEach((item) => {
        map.set(normalizeEmail(item.email), item);
      });
    return map;
  }, [assignments]);

  const stats = useMemo(() => {
    const connected = accounts.length;
    const active = accounts.filter((item) => item.status === 1).length;
    const warmupOn = accounts.filter((item) => item.warmup_status === 1).length;
    const healthy = accounts.filter(
      (item) => Number(item.stat_warmup_score || 0) >= 80
    ).length;
    const assignedSdrSenders = assignments.filter(
      (item) => item.isActive && item.role === "sdr"
    ).length;
    const unassignedAccounts = accounts.filter(
      (account) => !activeAssignmentMap.has(normalizeEmail(account.email))
    ).length;

    return {
      connected,
      active,
      warmupOn,
      healthy,
      assignedSdrSenders,
      unassignedAccounts,
    };
  }, [accounts, assignments, activeAssignmentMap]);

  const filteredAccounts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return accounts.filter((account) => {
      const emailKey = normalizeEmail(account.email);
      const assignment = activeAssignmentMap.get(emailKey) || null;
      const name = [account.first_name, account.last_name].filter(Boolean).join(" ").toLowerCase();
      const owner = getAssignmentAdminLabel(assignment).toLowerCase();
      const role = assignment?.role || "";
      const statusText = getStatusText(account.status).toLowerCase();
      const warmupText = getWarmupText(account.warmup_status).toLowerCase();

      if (query) {
        const haystack = [emailKey, name, owner, role, statusText, warmupText].join(" ");
        if (!haystack.includes(query)) return false;
      }

      if (statusFilter === "active" && account.status !== 1) return false;
      if (statusFilter === "paused" && account.status !== 2) return false;
      if (
        statusFilter === "other" &&
        (account.status === 1 || account.status === 2 || typeof account.status !== "number")
      ) {
        return false;
      }

      if (warmupFilter === "on" && account.warmup_status !== 1) return false;
      if (warmupFilter === "off" && account.warmup_status !== 0) return false;
      if (
        warmupFilter === "issue" &&
        !(typeof account.warmup_status === "number" && account.warmup_status < 0)
      ) {
        return false;
      }
      if (
        warmupFilter === "unknown" &&
        (account.warmup_status === 1 ||
          account.warmup_status === 0 ||
          (typeof account.warmup_status === "number" && account.warmup_status < 0))
      ) {
        return false;
      }

      if (roleFilter === "unassigned" && assignment) return false;
      if (
        roleFilter !== "all" &&
        roleFilter !== "unassigned" &&
        assignment?.role !== roleFilter
      ) {
        return false;
      }

      return true;
    });
  }, [accounts, activeAssignmentMap, roleFilter, search, statusFilter, warmupFilter]);

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
          adminId:
            typeof row.adminId === "string"
              ? row.adminId
              : row.adminId?._id || "",
          isPrimary: Boolean(row.isPrimary),
        };
      });

      return next;
    });
  }

  async function fetchAccounts() {
    const payload: any = await adminGet("/instantly/accounts");

    if (payload?.success === false) {
      throw new Error(payload?.message || "Failed to load accounts");
    }

    const items = Array.isArray(payload?.data?.items)
      ? payload.data.items
      : Array.isArray(payload?.items)
        ? payload.items
        : [];

    setAccounts(items);
  }

  async function fetchAssignments() {
    const payload: any = await adminGet("/outreach/mailboxes", {
      activeOnly: false,
    });

    if (payload?.success === false) {
      throw new Error(payload?.message || "Failed to load mailbox assignments");
    }

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
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to load account data",
      });
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  useEffect(() => {
    loadPage(true);

    return () => {
      clearPolling();
    };
  }, []);

  async function runAccountAction(
    path: string,
    successText: string,
    refreshDelay = 0
  ) {
    try {
      setMessage(null);

      const payload: any = await adminPost(path);

      if (payload?.success === false) {
        throw new Error(payload?.message || "Request failed");
      }

      setMessage({
        type: "success",
        text: successText,
      });

      if (refreshDelay > 0) {
        window.setTimeout(() => {
          loadPage(false);
        }, refreshDelay);
      } else {
        loadPage(false);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Action failed",
      });
    }
  }

  function handleAssignmentFormChange(
    email: string,
    patch: Partial<AssignmentForm>
  ) {
    const key = normalizeEmail(email);

    setAssignmentForms((prev) => {
      const existing = prev[key] || {
        role: "sdr" as MailboxRole,
        adminId: "",
        isPrimary: false,
      };

      const nextRole = (patch.role || existing.role) as MailboxRole;
      const shouldResetAdmin =
        patch.role !== undefined && patch.role !== existing.role;

      return {
        ...prev,
        [key]: {
          ...existing,
          ...patch,
          role: nextRole,
          adminId: shouldResetAdmin ? "" : patch.adminId ?? existing.adminId,
          isPrimary:
            nextRole === "sdr"
              ? patch.isPrimary ?? existing.isPrimary
              : false,
        },
      };
    });
  }

  function getAdminOptionsByRole(role: MailboxRole) {
    return adminDirectory[role] || [];
  }

  async function handleAssignMailbox(email: string) {
    const key = normalizeEmail(email);
    const form = assignmentForms[key];

    if (!form?.adminId?.trim()) {
      setMessage({
        type: "error",
        text: "Please select an admin before assigning the mailbox",
      });
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

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to assign mailbox");
      }

      setMessage({
        type: "success",
        text: payload?.message || "Mailbox assigned successfully",
      });

      await Promise.all([fetchAssignments(), fetchAdminDirectory()]);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to assign mailbox",
      });
    } finally {
      setActionKey("");
    }
  }

  async function handleUnassignMailbox(email: string) {
    const key = normalizeEmail(email);

    try {
      setActionKey(`${key}-unassign`);
      setMessage(null);

      const payload: any = await adminPost(
        `/outreach/mailboxes/${encodeURIComponent(key)}/unassign`
      );

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to unassign mailbox");
      }

      setMessage({
        type: "success",
        text: payload?.message || "Mailbox unassigned successfully",
      });

      await fetchAssignments();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to unassign mailbox",
      });
    } finally {
      setActionKey("");
    }
  }

  async function handlePauseResume(account: InstantlyAccount) {
    const email = encodeURIComponent(account.email);
    const isActive = account.status === 1;
    const key = `${account.email}-status`;

    setActionKey(key);

    await runAccountAction(
      isActive
        ? `/instantly/accounts/${email}/pause`
        : `/instantly/accounts/${email}/resume`,
      isActive ? "Account paused successfully" : "Account resumed successfully"
    );

    setActionKey("");
  }

  async function handleWarmupToggle(account: InstantlyAccount) {
    const email = encodeURIComponent(account.email);
    const key = `${account.email}-warmup`;
    const warmupEnabled = account.warmup_status === 1;

    setActionKey(key);

    await runAccountAction(
      warmupEnabled
        ? `/instantly/accounts/${email}/warmup/disable`
        : `/instantly/accounts/${email}/warmup/enable`,
      warmupEnabled
        ? "Warmup disable job started"
        : "Warmup enable job started",
      4000
    );

    setActionKey("");
  }

  async function handleOAuthConnect(provider: OAuthProvider) {
    try {
      clearPolling();
      setCopied(false);
      setOauthLoading(provider);
      setMessage({
        type: "info",
        text: `Generating ${provider} authentication link...`,
      });

      const payload: any = await adminPost(`/instantly/oauth/${provider}/init`);

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to start OAuth");
      }

      const authUrl = payload?.authUrl || payload?.data?.auth_url || "";
      const sessionId = payload?.sessionId || payload?.data?.session_id || "";
      const expiresAt = payload?.expiresAt || payload?.data?.expires_at || "";

      if (!authUrl || !sessionId) {
        throw new Error("Invalid OAuth response");
      }

      setOauthSession({
        provider,
        sessionId,
        authUrl,
        expiresAt,
        status: "pending",
      });

      setMessage({
        type: "success",
        text: "Authentication link generated. Connect the mailbox in the correct browser profile, then assign that mailbox below.",
      });

      window.setTimeout(() => {
        authUrlRef.current?.focus();
        authUrlRef.current?.select();
      }, 50);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "OAuth init failed",
      });
    } finally {
      setOauthLoading("");
    }
  }

  async function checkOAuthStatus(sessionOverride?: OAuthSessionState) {
    const activeSession = sessionOverride || oauthSession;
    if (!activeSession?.sessionId) return;

    try {
      setStatusChecking(true);

      const statusPayload: any = await adminGet(
        `/instantly/oauth/session-status/${activeSession.sessionId}`
      );

      if (statusPayload?.success === false) {
        throw new Error(statusPayload?.message || "Failed to check OAuth status");
      }

      const data = statusPayload?.data || {};
      const status = String(data?.status || "").toLowerCase() as OAuthSessionStatus;

      if (status === "pending") {
        setOauthSession((prev) =>
          prev
            ? {
                ...prev,
                status: "pending",
              }
            : prev
        );

        if (!autoPolling) {
          setMessage({
            type: "info",
            text: "Authentication is still pending. Complete login in the other browser, then check again.",
          });
        }
        return;
      }

      if (status === "success") {
        clearPolling();

        setOauthSession((prev) =>
          prev
            ? {
                ...prev,
                status: "success",
                email: data?.email || "",
              }
            : prev
        );

        setMessage({
          type: "success",
          text: `Connected ${data?.email || "account"} successfully.`,
        });

        await loadPage(false);
        return;
      }

      if (status === "expired") {
        clearPolling();

        setOauthSession((prev) =>
          prev
            ? {
                ...prev,
                status: "expired",
                error: "Authentication session expired. Generate a new link.",
              }
            : prev
        );

        setMessage({
          type: "error",
          text: "Authentication link expired. Generate a new one.",
        });

        return;
      }

      clearPolling();

      const errorText =
        data?.error_description ||
        data?.error ||
        "OAuth connection failed";

      setOauthSession((prev) =>
        prev
          ? {
              ...prev,
              status: "error",
              error: errorText,
            }
          : prev
      );

      setMessage({
        type: "error",
        text: errorText,
      });
    } catch (error) {
      clearPolling();

      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to check OAuth status",
      });
    } finally {
      setStatusChecking(false);
    }
  }

  function startAutoPolling() {
    if (!oauthSession?.sessionId) return;

    clearPolling();
    setAutoPolling(true);

    pollRef.current = window.setInterval(() => {
      checkOAuthStatus();
    }, 3000);

    setMessage({
      type: "info",
      text: "Auto-check started. We’ll keep checking until login completes or the session expires.",
    });
  }

  async function copyAuthLink() {
    if (!oauthSession?.authUrl) return;

    const text = oauthSession.authUrl;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error("Clipboard API unavailable");
      }

      setCopied(true);
      setMessage({
        type: "success",
        text: "Authentication link copied. Paste it in the browser where you want to log in.",
      });

      window.setTimeout(() => setCopied(false), 1800);
      return;
    } catch {
      try {
        authUrlRef.current?.focus();
        authUrlRef.current?.select();
        const ok = document.execCommand("copy");

        if (!ok) {
          throw new Error("Manual copy fallback failed");
        }

        setCopied(true);
        setMessage({
          type: "success",
          text: "Authentication link copied. Paste it in the browser where you want to log in.",
        });

        window.setTimeout(() => setCopied(false), 1800);
      } catch {
        authUrlRef.current?.focus();
        authUrlRef.current?.select();

        setMessage({
          type: "info",
          text: "Auto copy is blocked in this browser. The link is selected now — press Ctrl/Cmd + C to copy it.",
        });
      }
    }
  }

  function selectAuthLink() {
    authUrlRef.current?.focus();
    authUrlRef.current?.select();
  }

  function resetOAuthFlow() {
    clearPolling();
    setCopied(false);
    setOauthSession(null);
    setMessage(null);
  }

  function toggleExpanded(email: string) {
    setExpandedEmail((prev) => (prev === email ? null : email));
  }

  function renderExpandedRow(account: InstantlyAccount) {
    const emailKey = normalizeEmail(account.email);
    const activeAssignment = activeAssignmentMap.get(emailKey) || null;

    const form =
      assignmentForms[emailKey] || {
        role: activeAssignment?.role || "sdr",
        adminId:
          activeAssignment
            ? typeof activeAssignment.adminId === "string"
              ? activeAssignment.adminId
              : activeAssignment.adminId?._id || ""
            : "",
        isPrimary: Boolean(activeAssignment?.isPrimary),
      };

    const adminOptions = getAdminOptionsByRole(form.role);
    const selectedAdmin =
      adminOptions.find((item) => item._id === form.adminId) || null;

    const assignActionKey = `${emailKey}-assign`;
    const unassignActionKey = `${emailKey}-unassign`;

    return (
      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="rounded-[20px] border border-black/10 bg-white p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/40">
                Mailbox Assignment
              </p>
              <h4 className="mt-1 text-base font-semibold text-black">
                Map this mailbox to an internal owner
              </h4>
            </div>

            {selectedAdmin ? (
              <span className="rounded-full border border-black/10 bg-[#fafafa] px-3 py-1 text-xs text-black/60">
                Selected: {getAdminLabel(selectedAdmin)}
              </span>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[180px_1fr_160px]">
            <select
              value={form.role}
              onChange={(e) =>
                handleAssignmentFormChange(emailKey, {
                  role: e.target.value as MailboxRole,
                })
              }
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={form.adminId}
              onChange={(e) =>
                handleAssignmentFormChange(emailKey, {
                  adminId: e.target.value,
                })
              }
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none"
            >
              <option value="">
                {form.role === "revenue_head"
                  ? "Select Revenue Head"
                  : form.role === "bme"
                    ? "Select BME"
                    : form.role === "ime"
                      ? "Select IME"
                      : "Select SDR"}
              </option>

              {adminOptions.map((admin) => (
                <option key={admin._id} value={admin._id}>
                  {getAdminLabel(admin)}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black">
              <input
                type="checkbox"
                checked={form.isPrimary}
                disabled={form.role !== "sdr"}
                onChange={(e) =>
                  handleAssignmentFormChange(emailKey, {
                    isPrimary: e.target.checked,
                  })
                }
              />
              Primary SDR sender
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleAssignMailbox(account.email)}
              disabled={actionKey !== "" || !form.adminId.trim()}
              className="rounded-2xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionKey === assignActionKey ? "Saving..." : "Assign Mailbox"}
            </button>

            <button
              type="button"
              onClick={() => handleUnassignMailbox(account.email)}
              disabled={actionKey !== "" || !activeAssignment}
              className="rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionKey === unassignActionKey ? "Removing..." : "Unassign"}
            </button>
          </div>

          <div className="mt-4 grid gap-2 rounded-2xl border border-black/10 bg-[#fafafa] p-4 text-xs text-black/55 md:grid-cols-2">
            <p>Available {getRoleLabel(form.role)}s: {adminOptions.length}</p>
            <p>Current Role: {activeAssignment ? getRoleLabel(activeAssignment.role) : "Unassigned"}</p>
            <p>Current Owner: {getAssignmentAdminLabel(activeAssignment)}</p>
            <p>Primary Sender: {activeAssignment?.isPrimary ? "Yes" : "No"}</p>
          </div>

          <p className="mt-4 text-xs leading-6 text-black/50">
            Rule: SDR can hold multiple sender emails. Revenue Head, BME, and IME can have only one active mailbox each. Reassigning RH, BME, or IME automatically replaces the older mailbox for that same admin.
          </p>
        </div>

        <div className="rounded-[20px] border border-black/10 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/40">
            Account Details
          </p>
          <h4 className="mt-1 text-base font-semibold text-black">
            Health & configuration snapshot
          </h4>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-black/10 bg-[#fafafa] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-black/40">
                Sending Gap
              </p>
              <p className="mt-2 text-sm font-semibold text-black">
                {account.sending_gap ?? "-"}
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-[#fafafa] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-black/40">
                Warmup Limit
              </p>
              <p className="mt-2 text-sm font-semibold text-black">
                {account.warmup?.limit ?? "-"}
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-[#fafafa] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-black/40">
                Reply Rate
              </p>
              <p className="mt-2 text-sm font-semibold text-black">
                {account.warmup?.reply_rate ?? "-"}
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-[#fafafa] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-black/40">
                Increment
              </p>
              <p className="mt-2 text-sm font-semibold text-black">
                {account.warmup?.increment ?? "-"}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-black/10 bg-[#fafafa] p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-black/40">
              Advanced Warmup
            </p>
            <div className="mt-3 grid gap-2 text-sm text-black/65 sm:grid-cols-2">
              <p>Open Rate: {account.warmup?.advanced?.open_rate ?? "-"}</p>
              <p>Important Rate: {account.warmup?.advanced?.important_rate ?? "-"}</p>
              <p>Spam Save Rate: {account.warmup?.advanced?.spam_save_rate ?? "-"}</p>
              <p>Weekday Only: {account.warmup?.advanced?.weekday_only ? "Yes" : "No"}</p>
              <p>Read Emulation: {account.warmup?.advanced?.read_emulation ? "Yes" : "No"}</p>
              <p>Warm CTD: {account.warmup?.advanced?.warm_ctd ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const columns = useMemo<AdminTableColumn<InstantlyAccount>[]>(
    () => [
      {
        id: "account",
        header: "Account",
        cellClassName: "align-top",
        widthClassName: "min-w-[260px]",
        render: (account) => (
          <div className="min-w-[220px]">
            <p className="text-sm font-semibold text-black">{account.email}</p>
            <p className="mt-1 text-sm text-black/55">
              {[account.first_name, account.last_name].filter(Boolean).join(" ") || "No display name"}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-black/45">
              <span>Created: {formatDate(account.timestamp_created)}</span>
              <span>•</span>
              <span>Updated: {formatDate(account.timestamp_updated)}</span>
            </div>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cellClassName: "align-top",
        widthClassName: "min-w-[150px]",
        render: (account) => (
          <div className="flex min-w-[130px] flex-col gap-2">
            <span
              className={cx(
                "inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold",
                getStatusPillClasses(account.status)
              )}
            >
              {getStatusText(account.status)}
            </span>

            <div className="text-xs text-black/50">
              Setup Pending: {account.setup_pending ? "Yes" : "No"}
            </div>
          </div>
        ),
      },
      {
        id: "warmup",
        header: "Warmup",
        cellClassName: "align-top",
        widthClassName: "min-w-[160px]",
        render: (account) => (
          <div className="flex min-w-[140px] flex-col gap-2">
            <span
              className={cx(
                "inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold",
                getWarmupPillClasses(account.warmup_status)
              )}
            >
              {getWarmupText(account.warmup_status)}
            </span>

            <div className="text-xs text-black/50">
              Managed: {account.is_managed_account ? "Yes" : "No"}
            </div>
          </div>
        ),
      },
      {
        id: "limits",
        header: "Limits & Score",
        cellClassName: "align-top",
        widthClassName: "min-w-[180px]",
        render: (account) => (
          <div className="min-w-[150px] space-y-2 text-sm">
            <div className="rounded-xl border border-black/10 bg-[#fafafa] px-3 py-2">
              <p className="text-xs uppercase tracking-[0.12em] text-black/40">
                Daily Limit
              </p>
              <p className="mt-1 font-semibold text-black">
                {account.daily_limit ?? "-"}
              </p>
            </div>

            <div className="rounded-xl border border-black/10 bg-[#fafafa] px-3 py-2">
              <p className="text-xs uppercase tracking-[0.12em] text-black/40">
                Warmup Score
              </p>
              <p className="mt-1 font-semibold text-black">
                {account.stat_warmup_score ?? "-"}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "mapping",
        header: "Role Mapping",
        cellClassName: "align-top",
        widthClassName: "min-w-[250px]",
        render: (account) => {
          const activeAssignment =
            activeAssignmentMap.get(normalizeEmail(account.email)) || null;

          return (
            <div className="min-w-[220px] space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-black/70">
                  {activeAssignment ? getRoleLabel(activeAssignment.role) : "Unassigned"}
                  {activeAssignment?.isPrimary ? " · Primary SDR" : ""}
                </span>
              </div>

              <div className="text-sm text-black/70">
                {getAssignmentAdminLabel(activeAssignment)}
              </div>

              <div className="text-xs text-black/45">
                {activeAssignment?.updatedAt
                  ? `Mapped: ${formatDate(activeAssignment.updatedAt)}`
                  : "No active owner mapped"}
              </div>
            </div>
          );
        },
      },
    ],
    [activeAssignmentMap]
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-5">
        <StatCard
          title="Connected Accounts"
          value={stats.connected}
          hint="Total mailboxes available in Instantly"
        />
        <StatCard
          title="Active Accounts"
          value={stats.active}
          hint="Currently active sender accounts"
        />
        <StatCard
          title="Warmup On"
          value={stats.warmupOn}
          hint="Mailboxes with warmup enabled"
        />
        <StatCard
          title="Healthy Accounts"
          value={stats.healthy}
          hint="Warmup score 80 or higher"
        />
        <StatCard
          title="Unassigned"
          value={stats.unassignedAccounts}
          hint="Connected but not mapped yet"
        />
      </div>

      {message && (
        <div
          className={cx(
            "rounded-[20px] border px-4 py-3 text-sm",
            message.type === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
            message.type === "error" && "border-rose-200 bg-rose-50 text-rose-700",
            message.type === "info" && "border-sky-200 bg-sky-50 text-sky-700"
          )}
        >
          {message.text}
        </div>
      )}

      <section className="rounded-[26px] border border-black/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/40">
                Connection Center
              </p>
              <h3 className="mt-2 text-xl font-semibold text-black">
                Connect sender accounts manually with a copy-paste authentication link
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-black/55">
                Generate a Google or Microsoft login link, connect the mailbox in the correct browser profile, then map it to SDR, Revenue Head, BME, or IME from the accounts table below.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleOAuthConnect("google")}
                disabled={oauthLoading !== ""}
                className="rounded-2xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {oauthLoading === "google" ? "Generating..." : "Generate Google Link"}
              </button>

              <button
                type="button"
                onClick={() => handleOAuthConnect("microsoft")}
                disabled={oauthLoading !== ""}
                className="rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {oauthLoading === "microsoft" ? "Generating..." : "Generate Microsoft Link"}
              </button>
            </div>
          </div>

          {oauthSession && (
            <div className="rounded-[22px] border border-black/10 bg-[#fcfcfc] p-4">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-semibold text-black">
                        Authentication Session
                      </h4>
                      <span
                        className={cx(
                          "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                          getOAuthStatusClasses(oauthSession.status)
                        )}
                      >
                        {getOAuthStatusText(oauthSession.status)}
                      </span>
                      <ProviderBadge provider={oauthSession.provider} />
                    </div>

                    <p className="mt-2 text-sm text-black/55">
                      After successful connection, the account will appear in the accounts table and can be assigned immediately.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={copyAuthLink}
                      className="rounded-2xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black/90"
                    >
                      {copied ? "Copied" : "Copy Link"}
                    </button>

                    <button
                      type="button"
                      onClick={selectAuthLink}
                      className="rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-black/5"
                    >
                      Select Link
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        window.open(oauthSession.authUrl, "_blank", "noopener,noreferrer")
                      }
                      className="rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-black/5"
                    >
                      Open Here
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white p-4">
                  <label className="mb-2 block text-sm font-medium text-black">
                    Authentication Link
                  </label>

                  <textarea
                    ref={authUrlRef}
                    readOnly
                    value={oauthSession.authUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    className="min-h-[120px] w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3 font-mono text-xs text-black outline-none"
                  />

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={copyAuthLink}
                      className="rounded-2xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black/90"
                    >
                      {copied ? "Copied" : "Copy Authentication Link"}
                    </button>

                    <button
                      type="button"
                      onClick={selectAuthLink}
                      className="rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-black/5"
                    >
                      Select for Manual Copy
                    </button>

                    <button
                      type="button"
                      onClick={() => checkOAuthStatus()}
                      disabled={statusChecking}
                      className="rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {statusChecking ? "Checking..." : "Check Status"}
                    </button>

                    {!autoPolling ? (
                      <button
                        type="button"
                        onClick={startAutoPolling}
                        disabled={oauthSession.status !== "pending"}
                        className="rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Auto Check Every 3s
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={clearPolling}
                        className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
                      >
                        Stop Auto Check
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={resetOAuthFlow}
                      className="rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-black/5"
                    >
                      Reset Session
                    </button>
                  </div>
                </div>

                {oauthSession.error && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {oauthSession.error}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[26px] border border-black/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-black">
                Connected Accounts & Role Mapping
              </h3>
              <p className="mt-1 text-sm text-black/55">
                Cleaner table view for account health, ownership, quick actions, and assignment management.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="relative min-w-[240px]">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search email, owner, role..."
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm text-black outline-none transition focus:border-black/25"
                />
              </div>

              <ToolbarSelect
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as StatusFilter)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="other">Other</option>
              </ToolbarSelect>

              <ToolbarSelect
                value={warmupFilter}
                onChange={(value) => setWarmupFilter(value as WarmupFilter)}
              >
                <option value="all">All Warmup</option>
                <option value="on">Warmup On</option>
                <option value="off">Warmup Off</option>
                <option value="issue">Warmup Issue</option>
                <option value="unknown">Unknown</option>
              </ToolbarSelect>

              <ToolbarSelect
                value={roleFilter}
                onChange={(value) => setRoleFilter(value as RoleFilter)}
              >
                <option value="all">All Roles</option>
                <option value="unassigned">Unassigned</option>
                <option value="sdr">SDR</option>
                <option value="revenue_head">Revenue Head</option>
                <option value="bme">BME</option>
                <option value="ime">IME</option>
              </ToolbarSelect>

              <button
                type="button"
                onClick={() => loadPage(true)}
                className="rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-black/5"
              >
                Refresh Accounts
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-black/55">
            <span className="rounded-full border border-black/10 bg-[#fafafa] px-3 py-1.5">
              Showing {filteredAccounts.length} of {accounts.length} accounts
            </span>
            <span className="rounded-full border border-black/10 bg-[#fafafa] px-3 py-1.5">
              SDR Senders: {stats.assignedSdrSenders}
            </span>
          </div>

          <AdminTable<InstantlyAccount>
            data={filteredAccounts}
            columns={columns}
            rowKey={(row) => row.email}
            loading={loading}
            loadingRows={6}
            emptyTitle="No matching accounts"
            emptyDescription="Try changing the search or filters."
            tableClassName="min-w-[1100px]"
            headerRowClassName="border-black/10"
            rowClassName={(_, __, isExpanded) =>
              cx(
                "border-black/10 align-top transition",
                isExpanded ? "bg-black/[0.02]" : "hover:bg-black/[0.02]"
              )
            }
            expandable={{
              expandedRowId: expandedEmail,
              onToggle: (rowId) => toggleExpanded(rowId),
              renderExpandedRow: renderExpandedRow,
              expandedRowClassName: "border-black/10 bg-[#fafafa]",
              expandedCellClassName: "px-4 py-5",
            }}
            actions={{
              align: "right",
              header: "Actions",
              cellClassName: "align-top",
              render: (account) => {
                const statusActionKey = `${account.email}-status`;
                const warmupActionKey = `${account.email}-warmup`;
                const isExpanded = expandedEmail === account.email;

                return (
                  <div className="flex min-w-[250px] flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handlePauseResume(account)}
                      disabled={actionKey !== ""}
                      className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-medium text-black transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {actionKey === statusActionKey
                        ? "Please wait..."
                        : account.status === 1
                          ? "Pause"
                          : "Resume"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleWarmupToggle(account)}
                      disabled={actionKey !== ""}
                      className="rounded-xl bg-black px-3 py-2 text-xs font-medium text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {actionKey === warmupActionKey
                        ? "Please wait..."
                        : account.warmup_status === 1
                          ? "Disable Warmup"
                          : "Enable Warmup"}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleExpanded(account.email)}
                      className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-medium text-black transition hover:bg-black/5"
                    >
                      {isExpanded ? "Hide Details" : "Manage"}
                    </button>
                  </div>
                );
              },
            }}
          />
        </div>
      </section>
    </div>
  );
}