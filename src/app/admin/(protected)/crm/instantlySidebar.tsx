"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { adminGet, getApiErrorMessage } from "@/lib/api";

type SidebarItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

type ConnectionStatus = "connected" | "disconnected" | "warning";

type SidebarConnection = {
  label?: string;
  description?: string;
  status?: ConnectionStatus;
};

type SenderAccount = {
  email?: string;
  provider?: string;
  isPrimary?: boolean;
  isActive?: boolean;
  assignedAt?: string | null;
  warmupScore?: number | string | null;
  dailyLimit?: number | string | null;
  warmupStatus?: number | null;
  accountStatus?: number | null;
};

type SidebarData = {
  workspaceName?: string;
  workspaceSubtitle?: string;
  workspaceInitials?: string;
  role?: string;
  connection?: SidebarConnection;
  activeSender?: SenderAccount;
  senderAccounts?: SenderAccount[];
  mailboxSummary?: {
    total?: number;
    hasMultipleSenders?: boolean;
    primaryEmail?: string;
  };
  campaignSummary?: {
    total?: number;
    byStatus?: {
      draft?: number;
      ready?: number;
      launched?: number;
      paused?: number;
      completed?: number;
      error?: number;
    };
  };
  conversationSummary?: {
    total?: number;
    unread?: number;
  };
  workflowRule?: {
    title?: string;
    description?: string;
  };
};

type SidebarApiResponse = {
  success?: boolean;
  message?: string;
  data?: SidebarData;
};

const sidebarItems: SidebarItem[] = [
  {
    label: "My Accounts",
    href: "/admin/crm/my-accounts",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 21a7 7 0 0 1 14 0" />
      </svg>
    ),
  },
  {
    label: "Sender Accounts",
    href: "/admin/crm/accounts",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m5 7 7 5 7-5" />
      </svg>
    ),
  },
  {
    label: "Campaigns",
    href: "/admin/crm/campaigns",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V8m0 0 8-4 8 4M4 8l8 4m8-4-8 4m0 0v7" />
      </svg>
    ),
  },
  {
    label: "Replies",
    href: "/admin/crm/replies",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 9 5 4m0 0v12m0-12h12" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H9a4 4 0 0 1-4-4v-1" />
      </svg>
    ),
  },
  {
    label: "Review Queue",
    href: "/admin/crm/review-queue",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 11 12 14 22 4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h11" />
      </svg>
    ),
  },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isActivePath(pathname: string, href: string) {
  if (href === "/admin/instantly-crm") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getStatusStyles(status?: ConnectionStatus) {
  switch (status) {
    case "connected":
      return {
        chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
        dot: "bg-emerald-500",
      };
    case "warning":
      return {
        chip: "border-amber-200 bg-amber-50 text-amber-700",
        dot: "bg-amber-500",
      };
    case "disconnected":
      return {
        chip: "border-rose-200 bg-rose-50 text-rose-700",
        dot: "bg-rose-500",
      };
    default:
      return {
        chip: "border-slate-200 bg-slate-50 text-slate-600",
        dot: "bg-slate-400",
      };
  }
}

function getProviderLabel(provider?: string) {
  const normalized = String(provider || "").trim().toLowerCase();

  if (normalized === "google") return "Google Workspace";
  if (normalized === "microsoft") return "Microsoft 365";
  if (!normalized) return "Unknown";

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatValue(value: number | string | null | undefined, fallback = "--") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function getRoleLabel(role?: string) {
  const normalized = String(role || "").trim().toLowerCase();

  if (normalized === "sdr") return "SDR";
  if (normalized === "bme") return "BME";
  if (normalized === "ime") return "IME";
  if (normalized === "revenue_head") return "Revenue Head";
  if (normalized === "super_admin") return "Admin";

  return "Member";
}

function getVisibleSidebarItems(
  role: string,
  items: SidebarItem[],
  loading: boolean
) {
  if (loading) return [];

  const normalizedRole = String(role || "").trim().toLowerCase();

  if (normalizedRole === "sdr") {
    return items.filter(
      (item) => item.label === "Campaigns" || item.label === "My Accounts"
    );
  }

  if (normalizedRole === "bme") {
    return items.filter(
      (item) => item.label === "Replies" || item.label === "My Accounts"
    );
  }

  if (normalizedRole === "ime") {
    return items.filter(
      (item) =>
        item.label === "My Accounts" ||
        item.label === "Campaigns" ||
        item.label === "Replies"
    );
  }

  if (normalizedRole === "revenue_head" || normalizedRole === "rh") {
    return items.filter(
      (item) =>
        item.label === "Review Queue" ||
        item.label === "Replies" ||
        item.label === "Campaigns" ||
        item.label === "My Accounts"
    );
  }

  if (normalizedRole === "super_admin" || normalizedRole === "admin") {
    return items.filter((item) => item.label !== "My Accounts");
  }

  return [];
}

function SidebarSkeleton() {
  return (
    <div className="space-y-2 px-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="h-11 animate-pulse rounded-2xl bg-slate-100"
        />
      ))}
    </div>
  );
}

export default function InstantlySidebar() {
  const pathname = usePathname();

  const [sidebarData, setSidebarData] = useState<SidebarData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchSidebarData = async () => {
      try {
        setLoading(true);

        const payload = await adminGet<SidebarApiResponse>("/outreach/sidebar");

        if (!payload?.success) {
          throw new Error(payload?.message || "Failed to fetch sidebar data");
        }

        if (isMounted) {
          setSidebarData(payload.data || null);
        }
      } catch (error) {
        const message = await getApiErrorMessage(error, "Failed to fetch sidebar data");
        console.error("Sidebar API error:", message, error);

        if (isMounted) {
          setSidebarData(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSidebarData();

    return () => {
      isMounted = false;
    };
  }, []);

  const workspaceName = sidebarData?.workspaceName || "Instantly CRM";
  const workspaceSubtitle = sidebarData?.workspaceSubtitle || "Unified outreach workspace";
  const workspaceInitials = sidebarData?.workspaceInitials || "IA";
  const role = sidebarData?.role || "";

  const connection: SidebarConnection = useMemo(
    () => ({
      label: sidebarData?.connection?.label || (loading ? "Checking..." : "Unavailable"),
      description:
        sidebarData?.connection?.description ||
        (loading ? "Loading connection state" : "Connection details unavailable"),
      status: sidebarData?.connection?.status,
    }),
    [sidebarData, loading]
  );

  const senderAccounts = useMemo(
    () => sidebarData?.senderAccounts || [],
    [sidebarData]
  );

  const activeSender = useMemo(() => {
    const sender =
      sidebarData?.activeSender ||
      senderAccounts.find((item) => item?.isPrimary) ||
      senderAccounts[0] ||
      null;

    return {
      email: sender?.email || (loading ? "Loading..." : "No active sender"),
      provider: sender?.provider || "unknown",
      isPrimary: Boolean(sender?.isPrimary),
      warmupScore: formatValue(sender?.warmupScore),
      dailyLimit: formatValue(sender?.dailyLimit),
    };
  }, [sidebarData, senderAccounts, loading]);

  const additionalAccounts = useMemo(() => {
    const primaryEmail = String(sidebarData?.activeSender?.email || "").toLowerCase();

    return senderAccounts.filter((item) => {
      const email = String(item?.email || "").toLowerCase();
      if (!email) return false;
      if (primaryEmail) return email !== primaryEmail;
      return !item?.isPrimary;
    });
  }, [senderAccounts, sidebarData]);

  const mailboxSummary = useMemo(
    () => ({
      total:
        sidebarData?.mailboxSummary?.total !== undefined
          ? sidebarData.mailboxSummary.total
          : senderAccounts.length,
    }),
    [sidebarData, senderAccounts]
  );

  const campaignSummary = useMemo(
    () => ({
      total: sidebarData?.campaignSummary?.total ?? 0,
      launched: sidebarData?.campaignSummary?.byStatus?.launched ?? 0,
      ready: sidebarData?.campaignSummary?.byStatus?.ready ?? 0,
      paused: sidebarData?.campaignSummary?.byStatus?.paused ?? 0,
    }),
    [sidebarData]
  );

  const conversationSummary = useMemo(
    () => ({
      total: sidebarData?.conversationSummary?.total ?? 0,
      unread: sidebarData?.conversationSummary?.unread ?? 0,
    }),
    [sidebarData]
  );

  const workflowRule = useMemo(
    () => ({
      title: sidebarData?.workflowRule?.title || "Workflow Status",
      description:
        sidebarData?.workflowRule?.description ||
        (loading ? "Loading..." : "Standard routing applied."),
    }),
    [sidebarData, loading]
  );

  const visibleSidebarItems = useMemo(
    () => getVisibleSidebarItems(role, sidebarItems, loading),
    [role, loading]
  );

  return (
    <aside className="hidden h-[calc(100vh-2rem)] w-[248px] shrink-0 border border-slate-200 bg-[#fbfcfe] xl:flex xl:flex-col">
      <div className="flex-1 overflow-y-auto py-5">
        <div className="px-4">
          <div className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Navigation
          </div>

          {loading ? (
            <SidebarSkeleton />
          ) : (
            <nav className="space-y-1">
              {visibleSidebarItems.map((item) => {
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cx(
                      "group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-[13px] font-medium transition-all",
                      active
                        ? "bg-slate-900 text-white shadow-[0_10px_24px_rgba(15,23,42,0.14)]"
                        : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm"
                    )}
                  >
                    <span
                      className={cx(
                        "transition-colors",
                        active ? "text-white" : "text-slate-400 group-hover:text-slate-700"
                      )}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </div>
    </aside>
  );
}