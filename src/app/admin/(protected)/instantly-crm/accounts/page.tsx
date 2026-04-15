"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

type OAuthSessionState = {
  provider: OAuthProvider;
  sessionId: string;
  authUrl: string;
  expiresAt: string;
  status: "idle" | "pending" | "success" | "error" | "expired";
  email?: string;
  error?: string;
} | null;

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const TARGET_EMAIL = "devanshdubey@collabglam.com";

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
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

function getOAuthStatusClasses(status?: OAuthSessionState["status"]) {
  if (status === "success") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "pending") return "border-sky-200 bg-sky-50 text-sky-700";
  if (status === "error") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "expired") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

function getOAuthStatusText(status?: OAuthSessionState["status"]) {
  if (status === "success") return "Connected";
  if (status === "pending") return "Waiting for Login";
  if (status === "error") return "Failed";
  if (status === "expired") return "Expired";
  return "Idle";
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function InstantlyAccountsPage() {
  const [accounts, setAccounts] = useState<InstantlyAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState<string>("");
  const [oauthLoading, setOauthLoading] = useState<"" | OAuthProvider>("");
  const [message, setMessage] = useState<ApiState>(null);
  const [oauthSession, setOauthSession] = useState<OAuthSessionState>(null);
  const [copied, setCopied] = useState(false);
  const [statusChecking, setStatusChecking] = useState(false);
  const [autoPolling, setAutoPolling] = useState(false);
  const pollRef = useRef<number | null>(null);

  const targetAccount = useMemo(
    () =>
      accounts.find(
        (account) =>
          String(account.email || "").trim().toLowerCase() === TARGET_EMAIL
      ) || null,
    [accounts]
  );

  const stats = useMemo(() => {
    const connected = accounts.length;
    const active = accounts.filter((item) => item.status === 1).length;
    const warmupOn = accounts.filter((item) => item.warmup_status === 1).length;
    const healthy = accounts.filter(
      (item) => Number(item.stat_warmup_score || 0) >= 80
    ).length;

    return { connected, active, warmupOn, healthy };
  }, [accounts]);

  async function fetchAccounts(showLoader = false) {
    try {
      if (showLoader) setLoading(true);

      const res = await fetch(`${API_BASE}/instantly/accounts`, {
        method: "GET",
        cache: "no-store",
      });

      const payload = await res.json();

      if (!res.ok || payload?.success === false) {
        throw new Error(payload?.message || "Failed to load accounts");
      }

      const items = Array.isArray(payload?.data?.items)
        ? payload.data.items
        : Array.isArray(payload?.items)
          ? payload.items
          : [];

      setAccounts(items);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to load accounts",
      });
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  function clearPolling() {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setAutoPolling(false);
  }

  useEffect(() => {
    fetchAccounts(true);

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

      const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
      });

      const payload = await res.json();

      if (!res.ok || payload?.success === false) {
        throw new Error(payload?.message || "Request failed");
      }

      setMessage({
        type: "success",
        text: successText,
      });

      if (refreshDelay > 0) {
        window.setTimeout(() => {
          fetchAccounts();
        }, refreshDelay);
      } else {
        fetchAccounts();
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Action failed",
      });
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
        text: `Generating ${provider} authentication link…`,
      });

      const res = await fetch(`${API_BASE}/instantly/oauth/${provider}/init`, {
        method: "POST",
      });

      const payload = await res.json();

      if (!res.ok || payload?.success === false) {
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
        text: "Authentication link generated. Copy it and open it in the browser where you want to complete login.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "OAuth init failed",
      });
    } finally {
      setOauthLoading("");
    }
  }

  async function checkOAuthStatus(sessionOverride?: OAuthSessionState | null) {
    const activeSession = sessionOverride || oauthSession;

    if (!activeSession?.sessionId) return;

    try {
      setStatusChecking(true);

      const statusRes = await fetch(
        `${API_BASE}/instantly/oauth/session-status/${activeSession.sessionId}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const statusPayload = await statusRes.json();

      if (!statusRes.ok || statusPayload?.success === false) {
        throw new Error(statusPayload?.message || "Failed to check OAuth status");
      }

      const data = statusPayload?.data || {};
      const status = String(data?.status || "").toLowerCase() as
        | "pending"
        | "success"
        | "error"
        | "expired";

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

        await fetchAccounts();
        return;
      }

      if (status === "expired") {
        clearPolling();

        setOauthSession((prev) =>
          prev
            ? {
                ...prev,
                status: "expired",
                error: "OAuth session expired. Generate a new authentication link.",
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

    try {
      await navigator.clipboard.writeText(oauthSession.authUrl);
      setCopied(true);
      setMessage({
        type: "success",
        text: "Authentication link copied. Paste it in the browser where you want to log in.",
      });

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setMessage({
        type: "error",
        text: "Could not copy the link automatically. Please copy it manually from the field.",
      });
    }
  }

  function resetOAuthFlow() {
    clearPolling();
    setCopied(false);
    setOauthSession(null);
    setMessage(null);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <div className="rounded-[24px] border border-black/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
          <p className="text-sm font-medium text-black/55">Connected Accounts</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight text-black">
            {stats.connected}
          </h3>
          <p className="mt-2 text-sm text-black/50">
            Accounts available in this Instantly workspace
          </p>
        </div>

        <div className="rounded-[24px] border border-black/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
          <p className="text-sm font-medium text-black/55">Active Accounts</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight text-black">
            {stats.active}
          </h3>
          <p className="mt-2 text-sm text-black/50">
            Ready for sending and campaign usage
          </p>
        </div>

        <div className="rounded-[24px] border border-black/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
          <p className="text-sm font-medium text-black/55">Warmup Enabled</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight text-black">
            {stats.warmupOn}
          </h3>
          <p className="mt-2 text-sm text-black/50">
            Accounts currently warming reputation
          </p>
        </div>

        <div className="rounded-[24px] border border-black/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
          <p className="text-sm font-medium text-black/55">Healthy Senders</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight text-black">
            {stats.healthy}
          </h3>
          <p className="mt-2 text-sm text-black/50">
            Warmup score 80+ based on current account data
          </p>
        </div>
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

      {!targetAccount && (
        <section className="rounded-[24px] border border-black/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-black">
                  Connect {TARGET_EMAIL}
                </h3>
                <p className="mt-1 text-sm text-black/55">
                  Generate an authentication link here, then copy and paste it into the browser or profile where you want to complete the login.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleOAuthConnect("google")}
                  disabled={oauthLoading !== ""}
                  className="rounded-2xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {oauthLoading === "google" ? "Generating Google Link…" : "Generate Google Link"}
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuthConnect("microsoft")}
                  disabled={oauthLoading !== ""}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {oauthLoading === "microsoft"
                    ? "Generating Microsoft Link…"
                    : "Generate Microsoft Link"}
                </button>
              </div>
            </div>

            <div className="rounded-[22px] border border-black/10 bg-[#fcfcfc] p-4">
              <h4 className="text-sm font-semibold text-black">
                How this authentication works
              </h4>

              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-black/10 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/40">
                    Step 1
                  </p>
                  <p className="mt-2 text-sm text-black/70">
                    Generate the authentication link for Google or Microsoft.
                  </p>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/40">
                    Step 2
                  </p>
                  <p className="mt-2 text-sm text-black/70">
                    Copy the link and paste it into the browser where you want to log in.
                  </p>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/40">
                    Step 3
                  </p>
                  <p className="mt-2 text-sm text-black/70">
                    Complete authentication there with the correct email account.
                  </p>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/40">
                    Step 4
                  </p>
                  <p className="mt-2 text-sm text-black/70">
                    Come back here and check the connection status until it turns connected.
                  </p> 
                </div>
              </div>
            </div>

            {oauthSession && (
              <div className="rounded-[22px] border border-black/10 bg-[#fcfcfc] p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
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
                      <span className="inline-flex rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-black/70">
                        {oauthSession.provider === "google" ? "Google" : "Microsoft"}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-2xl border border-black/10 bg-white px-3 py-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-black/40">
                          Session ID
                        </p>
                        <p className="mt-2 break-all text-sm font-medium text-black">
                          {oauthSession.sessionId}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-black/10 bg-white px-3 py-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-black/40">
                          Expires At
                        </p>
                        <p className="mt-2 text-sm font-medium text-black">
                          {formatDate(oauthSession.expiresAt)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-black/10 bg-white px-3 py-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-black/40">
                          Connected Email
                        </p>
                        <p className="mt-2 text-sm font-medium text-black">
                          {oauthSession.email || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="mb-2 block text-sm font-medium text-black">
                        Authentication Link
                      </label>
                      <textarea
                        readOnly
                        value={oauthSession.authUrl}
                        className="min-h-[110px] w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none"
                      />
                      <p className="mt-2 text-xs text-black/50">
                        Copy this link and paste it in the browser where you want to complete the account authentication.
                      </p>
                    </div>

                    {oauthSession.error && (
                      <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {oauthSession.error}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 lg:w-[260px] lg:flex-col">
                    <button
                      type="button"
                      onClick={copyAuthLink}
                      className="rounded-2xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black/90"
                    >
                      {copied ? "Copied" : "Copy Link"}
                    </button>

                    <button
                      type="button"
                      onClick={() => window.open(oauthSession.authUrl, "_blank", "noopener,noreferrer")}
                      className="rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-black/5"
                    >
                      Open Here Anyway
                    </button>

                    <button
                      type="button"
                      onClick={() => checkOAuthStatus()}
                      disabled={statusChecking}
                      className="rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {statusChecking ? "Checking..." : "I Completed Login, Check Status"}
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
              </div>
            )}
          </div>
        </section>
      )}

      <section className="rounded-[24px] border border-black/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-black">Sender Accounts</h3>
            <p className="mt-1 text-sm text-black/55">
              View connected Instantly senders, pause or resume them, and toggle warmup jobs.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => fetchAccounts(true)}
              className="rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-black/5"
            >
              Refresh
            </button>

            <button
              type="button"
              onClick={() => handleOAuthConnect("google")}
              disabled={oauthLoading !== ""}
              className="rounded-2xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {oauthLoading === "google" ? "Generating Link…" : "Generate New Connection Link"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-5 rounded-[20px] border border-dashed border-black/15 bg-[#fcfcfc] px-6 py-8 text-center text-sm text-black/55">
            Loading accounts...
          </div>
        ) : accounts.length === 0 ? (
          <div className="mt-5 rounded-[20px] border border-dashed border-black/15 bg-[#fcfcfc] px-6 py-8 text-center text-sm text-black/55">
            No sender accounts found in this Instantly workspace.
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {accounts.map((account) => {
              const statusActionKey = `${account.email}-status`;
              const warmupActionKey = `${account.email}-warmup`;

              return (
                <div
                  key={account.email}
                  className="rounded-[22px] border border-black/10 bg-[#fcfcfc] p-4"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="truncate text-base font-semibold text-black">
                          {account.email}
                        </h4>

                        <span
                          className={cx(
                            "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                            getStatusPillClasses(account.status)
                          )}
                        >
                          {getStatusText(account.status)}
                        </span>

                        <span
                          className={cx(
                            "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                            getWarmupPillClasses(account.warmup_status)
                          )}
                        >
                          {getWarmupText(account.warmup_status)}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-black/60">
                        {[account.first_name, account.last_name].filter(Boolean).join(" ") || "No display name"}
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-black/10 bg-white px-3 py-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-black/40">
                            Daily Limit
                          </p>
                          <p className="mt-2 text-sm font-semibold text-black">
                            {account.daily_limit ?? "-"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-black/10 bg-white px-3 py-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-black/40">
                            Warmup Score
                          </p>
                          <p className="mt-2 text-sm font-semibold text-black">
                            {account.stat_warmup_score ?? "-"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-black/10 bg-white px-3 py-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-black/40">
                            Warmup Limit
                          </p>
                          <p className="mt-2 text-sm font-semibold text-black">
                            {account.warmup?.limit ?? "-"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-black/10 bg-white px-3 py-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-black/40">
                            Sending Gap
                          </p>
                          <p className="mt-2 text-sm font-semibold text-black">
                            {account.sending_gap ?? "-"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 text-xs text-black/55 sm:grid-cols-2">
                        <p>Created: {formatDate(account.timestamp_created)}</p>
                        <p>Updated: {formatDate(account.timestamp_updated)}</p>
                        <p>Setup Pending: {account.setup_pending ? "Yes" : "No"}</p>
                        <p>Managed Account: {account.is_managed_account ? "Yes" : "No"}</p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handlePauseResume(account)}
                        disabled={actionKey !== ""}
                        className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60"
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
                        className="rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actionKey === warmupActionKey
                          ? "Please wait..."
                          : account.warmup_status === 1
                            ? "Disable Warmup"
                            : "Enable Warmup"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}