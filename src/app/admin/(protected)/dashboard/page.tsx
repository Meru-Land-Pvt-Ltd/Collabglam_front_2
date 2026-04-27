"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  Crown,
  ExternalLink,
  FolderKanban,
  LayoutDashboard,
  Loader2,
  Mail,
  RefreshCcw,
  Shield,
  TrendingUp,
  UserCircle2,
  Users,
} from "lucide-react";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";

type AdminRole = "super_admin" | "revenue_head" | "ime" | "bme";

type AdminMeResponse = {
  _id: string;
  email: string;
  name?: string;
  role: AdminRole;
  status: string;
  proxyEmail?: string;
  permissions?: Array<{
    key: string;
    name?: string;
    isEdit?: boolean;
    isDelete?: boolean;
    isManager?: boolean;
  }>;
  lastLoginAt?: string;
  createdAt?: string;
};

type ExecutiveAdmin = {
  _id: string;
  name?: string;
  email: string;
  role: AdminRole;
  status: string;
  proxyEmail?: string;
  parentAdmin?: {
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
  };
  createdAt?: string;
  lastLoginAt?: string;
};

type CampaignItem = {
  _id: string;
  brandName?: string;
  campaignTitle?: string;
  campaignType?: string;
  campaignCategory?: string;
  publishStatus?: string;
  status?: string;
  campaignBudget?: number;
  budget?: number;
  influencerBudget?: number;
  numberOfInfluencers?: number;
  startAt?: string;
  endAt?: string;
  createdAt?: string;
};

type BrandAllocation = {
  _id: string;
  brandId?: {
    _id?: string;
    brandName?: string;
    companyName?: string;
    website?: string;
  };
  RHId?: string;
  bdmId?: string;
  idmId?: string;
  status?: string;
  updatedAt?: string;
  createdAt?: string;
};

type ManagedBrand = {
  _id: string;
  brandName?: string;
  companyName?: string;
  website?: string;
  assignedRm?: string;
  assignedBm?: string;
  assignedIm?: string;
  subscription?: {
    status?: string;
  };
};

type DashboardState = {
  me: AdminMeResponse | null;
  campaigns: CampaignItem[];
  myAllocations: BrandAllocation[];
  bmeTeam: ExecutiveAdmin[];
  imeTeam: ExecutiveAdmin[];
  allRevenueHeads: ExecutiveAdmin[];
  managedBrands: ManagedBrand[];
};

type SectionErrorMap = {
  me?: string | null;
  campaigns?: string | null;
  allocations?: string | null;
  bmeTeam?: string | null;
  imeTeam?: string | null;
  revenueHeads?: string | null;
  managedBrands?: string | null;
};

type SafeResult<T> = {
  ok: boolean;
  data: T | null;
  error: string | null;
};

type ActionItem = {
  title: string;
  href: string;
  icon: React.ElementType;
  description: string;
  priority: number;
};

const API = {
  me: "/admins/me",
  campaigns: "/admins/campaign/list",
  executives: "/admins/get-executive-list",
  revenueHeads: "/admins/get-rm-list",
  allocatedBrands: "/admins/get-brand-list",
  managedBrands: "/admins/fully-managed-brand-list",
};

const VALID_ROLES: AdminRole[] = ["super_admin", "revenue_head", "ime", "bme"];

const CHART_COLORS = ["#020617", "#1e293b", "#334155", "#64748b", "#94a3b8"];

const chartSx = {
  "& .MuiChartsAxis-tickLabel": {
    fill: "#64748b",
    fontSize: 12,
    fontWeight: 500,
  },
  "& .MuiChartsAxis-line": {
    stroke: "#e2e8f0",
  },
  "& .MuiChartsAxis-tick": {
    stroke: "#e2e8f0",
  },
  "& .MuiChartsGrid-line": {
    stroke: "#e2e8f0",
    strokeDasharray: "4 4",
  },
  "& .MuiChartsLegend-root": {
    display: "none",
  },
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDate(value?: string) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function formatDateTime(value?: string) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function formatMoney(value?: number) {
  if (value == null || Number.isNaN(value)) return "-";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function titleCaseRole(role?: string) {
  if (!role) return "-";

  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function titleCaseText(value?: string) {
  if (!value) return "-";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function getDashboardTitle(role?: AdminRole) {
  if (role === "super_admin") return "Super Admin Dashboard";
  if (role === "revenue_head") return "Revenue Head Dashboard";
  if (role === "bme") return "BME Dashboard";
  return "IME Dashboard";
}

function getDashboardSubtitle(role?: AdminRole) {
  if (role === "super_admin") {
    return "Platform-wide visibility across brands, campaigns, teams, and leadership in a cleaner analytics layout.";
  }

  if (role === "revenue_head") {
    return "Track team visibility, campaign activity, and high-priority operational routes without extra clutter.";
  }

  if (role === "bme") {
    return "Review assigned brands, visible campaigns, and essential actions in a compact workspace.";
  }

  return "Follow influencer-side operations, campaigns, and access-aware insights in one focused dashboard.";
}

function getPublishSummary(campaigns: CampaignItem[]) {
  return campaigns.reduce((acc, item) => {
    const key = String(item.publishStatus || item.status || "draft").toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function extractArray<T = any>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

function extractObject<T = any>(payload: any): T | null {
  if (!payload) return null;

  if (
    payload?.data?.data &&
    typeof payload.data.data === "object" &&
    !Array.isArray(payload.data.data)
  ) {
    return payload.data.data as T;
  }

  if (
    payload?.data &&
    typeof payload.data === "object" &&
    !Array.isArray(payload.data)
  ) {
    return payload.data as T;
  }

  return null;
}

function getErrorMessage(error: any, fallback: string) {
  const status = error?.response?.status;
  const apiMessage = error?.response?.data?.message;
  const genericMessage = error?.message;

  if (status === 404) return `${fallback} endpoint not available yet`;
  if (status === 403) return `${fallback} access denied`;
  if (status === 401) return `${fallback} unauthorized`;

  return apiMessage || genericMessage || fallback;
}

async function safeGet<T = any>(
  url: string,
  config?: any,
  fallbackLabel = "Request"
): Promise<SafeResult<T>> {
  try {
    const response = await api.get(url, config);

    return {
      ok: true,
      data: response?.data as T,
      error: null,
    };
  } catch (error: any) {
    return {
      ok: false,
      data: null,
      error: getErrorMessage(error, fallbackLabel),
    };
  }
}

function getPriorityActions(role?: AdminRole): ActionItem[] {
  const common: ActionItem[] = [
    {
      title: "Open Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      description: "Go to the main admin overview",
      priority: 1,
    },
    {
      title: "Open Campaigns",
      href: "/admin/campaigns",
      icon: FolderKanban,
      description: "View and manage campaigns",
      priority: 2,
    },
    {
      title: "Open Messages",
      href: "/admin/messages",
      icon: Mail,
      description: "Check communication updates",
      priority: 7,
    },
  ];

  if (role === "super_admin") {
    return [
      ...common,
      {
        title: "Manage Brands",
        href: "/admin/brands",
        icon: Building2,
        description: "Review platform-wide brand records",
        priority: 3,
      },
      {
        title: "Manage Employees",
        href: "/admin/employees",
        icon: Shield,
        description: "Control access and employee accounts",
        priority: 4,
      },
      {
        title: "Manage Roles",
        href: "/admin/role",
        icon: Crown,
        description: "Update permissions and roles",
        priority: 5,
      },
      {
        title: "View Influencers",
        href: "/admin/influencers",
        icon: Users,
        description: "Open influencer operations",
        priority: 6,
      },
    ].sort((a, b) => a.priority - b.priority);
  }

  if (role === "revenue_head") {
    return [
      ...common,
      {
        title: "Manage Brands",
        href: "/admin/brands",
        icon: Building2,
        description: "See assigned brands and ownership",
        priority: 3,
      },
      {
        title: "Track Pipeline",
        href: "/admin/influencer-pipeline",
        icon: TrendingUp,
        description: "Follow team progress and movement",
        priority: 4,
      },
      {
        title: "Subscriptions",
        href: "/admin/subscriptions",
        icon: Briefcase,
        description: "Monitor plans and billing visibility",
        priority: 5,
      },
    ].sort((a, b) => a.priority - b.priority);
  }

  if (role === "bme") {
    return [
      ...common,
      {
        title: "Manage Brands",
        href: "/admin/brands",
        icon: Building2,
        description: "Open assigned brand records",
        priority: 3,
      },
      {
        title: "Inbound Emails",
        href: "/admin/inbound-emails",
        icon: Mail,
        description: "Follow lead communication",
        priority: 4,
      },
      {
        title: "Documents",
        href: "/admin/documents",
        icon: Shield,
        description: "Open guidelines and references",
        priority: 5,
      },
    ].sort((a, b) => a.priority - b.priority);
  }

  return [
    ...common,
    {
      title: "Influencers",
      href: "/admin/influencers",
      icon: Users,
      description: "Manage influencer records",
      priority: 3,
    },
    {
      title: "Influencer Data",
      href: "/admin/influencer-data",
      icon: BarChart3,
      description: "Open performance data",
      priority: 4,
    },
    {
      title: "Track Pipeline",
      href: "/admin/influencer-pipeline",
      icon: TrendingUp,
      description: "Monitor outreach flow",
      priority: 5,
    },
    {
      title: "Documents",
      href: "/admin/documents",
      icon: Shield,
      description: "Reference operational docs",
      priority: 6,
    },
  ].sort((a, b) => a.priority - b.priority);
}

function getStatusBadgeClass(value?: string) {
  const normalized = String(value || "").toLowerCase();

  if (
    normalized.includes("active") ||
    normalized.includes("paid") ||
    normalized.includes("published") ||
    normalized.includes("live") ||
    normalized.includes("approved")
  ) {
    return "border-slate-900 bg-slate-900 text-white";
  }

  if (
    normalized.includes("draft") ||
    normalized.includes("pending") ||
    normalized.includes("initiated") ||
    normalized.includes("review")
  ) {
    return "border-slate-300 bg-slate-100 text-slate-700";
  }

  if (
    normalized.includes("inactive") ||
    normalized.includes("failed") ||
    normalized.includes("rejected") ||
    normalized.includes("closed")
  ) {
    return "border-slate-200 bg-white text-slate-500";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);

  const [state, setState] = useState<DashboardState>({
    me: null,
    campaigns: [],
    myAllocations: [],
    bmeTeam: [],
    imeTeam: [],
    allRevenueHeads: [],
    managedBrands: [],
  });

  const [sectionErrors, setSectionErrors] = useState<SectionErrorMap>({});

  const role = state.me?.role;
  const actions = useMemo(() => getPriorityActions(role), [role]);
  const topActions = useMemo(() => actions.slice(0, 6), [actions]);
  const publishSummary = useMemo(
    () => getPublishSummary(state.campaigns),
    [state.campaigns]
  );

  const visibleErrorCount = useMemo(
    () => Object.values(sectionErrors).filter(Boolean).length,
    [sectionErrors]
  );

  const totalBudget = useMemo(() => {
    return state.campaigns.reduce((sum, item) => {
      return (
        sum +
        Number(item.campaignBudget || item.budget || item.influencerBudget || 0)
      );
    }, 0);
  }, [state.campaigns]);

  const campaignStatusChartData = useMemo(() => {
    return Object.entries(publishSummary)
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => ({
        label: titleCaseText(status),
        value: count,
      }));
  }, [publishSummary]);

  const budgetTrendData = useMemo(() => {
    const buckets = ["Week 1", "Week 2", "Week 3", "Week 4"];

    return buckets.map((label, index) => {
      const budget = state.campaigns
        .filter((_, campaignIndex) => campaignIndex % 4 === index)
        .reduce((sum, item) => {
          return (
            sum +
            Number(item.campaignBudget || item.budget || item.influencerBudget || 0)
          );
        }, 0);

      return {
        label,
        value: budget,
      };
    });
  }, [state.campaigns]);

  const liveCampaignCount = useMemo(() => {
    return state.campaigns.filter((item) => {
      const status = String(item.publishStatus || item.status || "").toLowerCase();

      return (
        status.includes("live") ||
        status.includes("publish") ||
        status.includes("active")
      );
    }).length;
  }, [state.campaigns]);

  const draftCampaignCount = useMemo(() => {
    return state.campaigns.filter((item) => {
      const status = String(item.publishStatus || item.status || "").toLowerCase();

      return (
        status.includes("draft") ||
        status.includes("pending") ||
        status.includes("review")
      );
    }).length;
  }, [state.campaigns]);

  const visibleBrandCount =
    role === "super_admin" ? state.managedBrands.length : state.myAllocations.length;

  const teamVisibleCount = useMemo(() => {
    if (role === "super_admin") {
      return (
        state.allRevenueHeads.length + state.bmeTeam.length + state.imeTeam.length
      );
    }

    if (role === "revenue_head") {
      return state.bmeTeam.length + state.imeTeam.length;
    }

    return state.me?.permissions?.length || 0;
  }, [role, state]);

  const teamDistributionData = useMemo(() => {
    if (role === "super_admin") {
      return [
        { label: "Revenue Heads", value: state.allRevenueHeads.length },
        { label: "BME", value: state.bmeTeam.length },
        { label: "IME", value: state.imeTeam.length },
      ];
    }

    if (role === "revenue_head") {
      return [
        { label: "BME", value: state.bmeTeam.length },
        { label: "IME", value: state.imeTeam.length },
      ];
    }

    return [
      { label: "Permissions", value: state.me?.permissions?.length || 0 },
      { label: "Campaigns", value: state.campaigns.length },
      { label: "Brands", value: state.myAllocations.length },
    ];
  }, [role, state]);

  const operationalMixData = useMemo(() => {
    if (role === "super_admin") {
      return [
        { label: "Managed Brands", value: state.managedBrands.length },
        { label: "Revenue Heads", value: state.allRevenueHeads.length },
        { label: "BME Team", value: state.bmeTeam.length },
        { label: "IME Team", value: state.imeTeam.length },
        { label: "Campaigns", value: state.campaigns.length },
      ];
    }

    return [
      { label: "Allocated Brands", value: state.myAllocations.length },
      { label: "Campaigns", value: state.campaigns.length },
      { label: "BME Team", value: state.bmeTeam.length },
      { label: "IME Team", value: state.imeTeam.length },
      { label: "Permissions", value: state.me?.permissions?.length || 0 },
    ];
  }, [role, state]);

  const dataHealth = useMemo(() => {
    const items = [
      {
        key: "campaigns",
        label: "Campaigns",
        count: state.campaigns.length,
        error: sectionErrors.campaigns,
      },
      {
        key: role === "super_admin" ? "managedBrands" : "allocations",
        label: role === "super_admin" ? "Brands" : "Allocations",
        count: visibleBrandCount,
        error:
          role === "super_admin"
            ? sectionErrors.managedBrands
            : sectionErrors.allocations,
      },
      {
        key: "bmeTeam",
        label: "BME Team",
        count: state.bmeTeam.length,
        error: sectionErrors.bmeTeam,
      },
      {
        key: "imeTeam",
        label: "IME Team",
        count: state.imeTeam.length,
        error: sectionErrors.imeTeam,
      },
      {
        key: "revenueHeads",
        label: "Revenue Heads",
        count: state.allRevenueHeads.length,
        error: sectionErrors.revenueHeads,
      },
    ];

    return items.filter((item) => {
      if (role === "super_admin") return true;

      if (role === "revenue_head") {
        return ["campaigns", "bmeTeam", "imeTeam"].includes(item.key);
      }

      if (role === "ime" || role === "bme") {
        return ["campaigns", "allocations"].includes(item.key);
      }

      return true;
    });
  }, [role, state, visibleBrandCount, sectionErrors]);

  const overviewMetrics = useMemo(() => {
    return [
      {
        label: role === "super_admin" ? "Visible Campaigns" : "Scoped Campaigns",
        value: String(state.campaigns.length),
        helper: sectionErrors.campaigns
          ? "Campaign data unavailable"
          : "Campaign records visible in your scope",
        icon: FolderKanban,
        emphasis: sectionErrors.campaigns ? "muted" : "default",
      },
      {
        label: "Visible Budget",
        value: formatMoney(totalBudget),
        helper: "Calculated from campaign budget fields",
        icon: TrendingUp,
        emphasis: "default",
      },
      {
        label: role === "super_admin" ? "Managed Brands" : "Allocated Brands",
        value: String(visibleBrandCount),
        helper:
          role === "super_admin"
            ? sectionErrors.managedBrands
              ? "Brand data unavailable"
              : "Platform-level brand visibility"
            : sectionErrors.allocations
              ? "Allocation data unavailable"
              : "Assigned within your access scope",
        icon: Building2,
        emphasis:
          role === "super_admin"
            ? sectionErrors.managedBrands
              ? "muted"
              : "default"
            : sectionErrors.allocations
              ? "muted"
              : "default",
      },
      {
        label:
          role === "super_admin"
            ? "Visible Team"
            : role === "revenue_head"
              ? "Team Size"
              : "Permissions",
        value: String(teamVisibleCount),
        helper:
          role === "super_admin"
            ? "Leadership and executive visibility"
            : role === "revenue_head"
              ? "BME and IME under your view"
              : "Granted permission items",
        icon: role === "super_admin" ? Crown : Users,
        emphasis: "default",
      },
    ];
  }, [
    role,
    state.campaigns.length,
    totalBudget,
    visibleBrandCount,
    teamVisibleCount,
    sectionErrors.campaigns,
    sectionErrors.managedBrands,
    sectionErrors.allocations,
  ]);

  const loadDashboard = async (mode: "initial" | "refresh" = "initial") => {
    try {
      if (mode === "initial") setLoading(true);
      if (mode === "refresh") setRefreshing(true);

      setFatalError(null);
      setSectionErrors({});

      const meResult = await safeGet<any>(API.me, undefined, "Profile");

      if (!meResult.ok || !meResult.data) {
        const message = meResult.error || "Unable to verify admin profile";
        setFatalError(message);

        if (
          String(message).toLowerCase().includes("unauthorized") ||
          String(message).toLowerCase().includes("access denied")
        ) {
          router.replace("/admin/login");
        }

        return;
      }

      const me =
        extractObject<AdminMeResponse>(meResult.data) ||
        (meResult.data as AdminMeResponse);

      if (!me?.role || !VALID_ROLES.includes(me.role)) {
        router.replace("/admin/login");
        return;
      }

      const nextState: DashboardState = {
        me,
        campaigns: [],
        myAllocations: [],
        bmeTeam: [],
        imeTeam: [],
        allRevenueHeads: [],
        managedBrands: [],
      };

      const nextErrors: SectionErrorMap = {
        me: null,
        campaigns: null,
        allocations: null,
        bmeTeam: null,
        imeTeam: null,
        revenueHeads: null,
        managedBrands: null,
      };

      const requestEntries: Array<{
        key: keyof SectionErrorMap;
        request: Promise<SafeResult<any>>;
      }> = [
        {
          key: "campaigns",
          request: safeGet<any>(API.campaigns, undefined, "Campaigns"),
        },
      ];

      if (me.role === "bme" || me.role === "ime") {
        requestEntries.push({
          key: "allocations",
          request: safeGet<any>(
            API.allocatedBrands,
            undefined,
            "Allocated brands"
          ),
        });
      }

      if (me.role === "revenue_head" || me.role === "super_admin") {
        requestEntries.push({
          key: "bmeTeam",
          request: safeGet<any>(
            API.executives,
            { params: { role: "bme" } },
            "BME team"
          ),
        });

        requestEntries.push({
          key: "imeTeam",
          request: safeGet<any>(
            API.executives,
            { params: { role: "ime" } },
            "IME team"
          ),
        });
      }

      if (me.role === "super_admin") {
        requestEntries.push({
          key: "revenueHeads",
          request: safeGet<any>(
            API.revenueHeads,
            undefined,
            "Revenue heads"
          ),
        });

        requestEntries.push({
          key: "managedBrands",
          request: safeGet<any>(
            API.managedBrands,
            undefined,
            "Managed brands"
          ),
        });
      }

      const resolved = await Promise.all(
        requestEntries.map((item) => item.request)
      );

      requestEntries.forEach((entry, index) => {
        const result = resolved[index];

        if (!result.ok) {
          nextErrors[entry.key] = result.error;
          return;
        }

        if (entry.key === "campaigns") {
          nextState.campaigns = extractArray<CampaignItem>(result.data);
        }

        if (entry.key === "allocations") {
          nextState.myAllocations = extractArray<BrandAllocation>(result.data);
        }

        if (entry.key === "bmeTeam") {
          nextState.bmeTeam = extractArray<ExecutiveAdmin>(result.data);
        }

        if (entry.key === "imeTeam") {
          nextState.imeTeam = extractArray<ExecutiveAdmin>(result.data);
        }

        if (entry.key === "revenueHeads") {
          nextState.allRevenueHeads = extractArray<ExecutiveAdmin>(result.data);
        }

        if (entry.key === "managedBrands") {
          nextState.managedBrands = extractArray<any>(result.data).map(
            (item: any) => ({
              _id: item._id,
              brandName: item.brandName,
              companyName: item.companyName,
              website: item.website,
              assignedRm: item.assignedRm,
              assignedBm: item.assignedBm,
              assignedIm: item.assignedIm,
              subscription: item.subscription,
            })
          );
        }
      });

      setState(nextState);
      setSectionErrors(nextErrors);
    } catch (error: any) {
      setFatalError(error?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadDashboard("initial");
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white  text-slate-700 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (fatalError) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <AlertTriangle className="h-5 w-5" />
                </div>

                <div>
                  <h1 className="text-xl font-semibold text-slate-950">
                    Unable to load dashboard
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    {fatalError}
                  </p>
                </div>
              </div>

              <button
                onClick={() => void loadDashboard("refresh")}
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                <RefreshCcw className="h-4 w-4" />
                Retry
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <SurfaceCard
              title="Quick routes"
              subtitle="Use a direct route while the dashboard refreshes."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {getPriorityActions("super_admin").slice(0, 4).map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="inline-flex rounded-2xl bg-white p-3">
                          <Icon className="h-5 w-5 text-slate-700" />
                        </div>

                        <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:text-slate-500" />
                      </div>

                      <div className="mt-4 text-sm font-semibold text-slate-900">
                        {item.title}
                      </div>

                      <div className="mt-1 text-sm text-slate-500">
                        {item.description}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </SurfaceCard>

            <SurfaceCard
              title="Why this happens"
              subtitle="Common dashboard failure reasons."
            >
              <div className="space-y-3">
                <NoteRow
                  label="Authentication"
                  value="Your session may have expired or current admin access could not be validated."
                />
                <NoteRow
                  label="API availability"
                  value="One or more dashboard endpoints may be unavailable or not yet implemented."
                />
                <NoteRow
                  label="Permissions"
                  value="The current role may not have access to one or more required sections."
                />
              </div>
            </SurfaceCard>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="border-b border-slate-200 p-6 sm:p-8 xl:border-b-0 xl:border-r">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                <Shield className="h-3.5 w-3.5" />
                Overview
              </div>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {getDashboardTitle(role)}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                {getDashboardSubtitle(role)}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-900">
                  {titleCaseRole(role)}
                </span>

                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  {state.me?.email || "-"}
                </span>

                {visibleErrorCount > 0 ? (
                  <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {visibleErrorCount} section
                    {visibleErrorCount > 1 ? "s" : ""} unavailable
                  </span>
                ) : (
                  <span className="rounded-full border border-slate-900 bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                    All visible sections loaded
                  </span>
                )}
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  onClick={() => void loadDashboard("refresh")}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  <RefreshCcw
                    className={cn("h-4 w-4", refreshing && "animate-spin")}
                  />
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>

                <Link
                  href={topActions[1]?.href || "/admin/campaigns"}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Priority action
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="bg-slate-950 p-6 text-white sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                    Account snapshot
                  </div>

                  <div className="mt-2 text-xl font-semibold">
                    {state.me?.name || "Admin User"}
                  </div>

                  <div className="mt-1 text-sm text-white/70">
                    {titleCaseRole(role)}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <UserCircle2 className="h-5 w-5 text-white/80" />
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                <DarkInfoRow label="Status" value={titleCaseText(state.me?.status)} />
                <DarkInfoRow
                  label="Last login"
                  value={formatDateTime(state.me?.lastLoginAt)}
                />
                <DarkInfoRow label="Joined" value={formatDate(state.me?.createdAt)} />
                <DarkInfoRow
                  label="Permissions"
                  value={String(state.me?.permissions?.length || 0)}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-t border-slate-200 p-4 sm:grid-cols-2 xl:grid-cols-4 sm:p-6">
            {overviewMetrics.map((item) => {
              const Icon = item.icon;

              return (
                <MetricCard
                  key={item.label}
                  icon={<Icon className="h-5 w-5" />}
                  label={item.label}
                  value={item.value}
                  helper={item.helper}
                  emphasis={item.emphasis as "default" | "muted"}
                />
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <SurfaceCard
            title="Priority actions"
            subtitle="Fast access to the most-used routes in a simpler layout."
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {topActions.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-3 text-slate-700">
                        <Icon className="h-5 w-5" />
                      </div>

                      <ExternalLink className="h-4 w-4 text-slate-300 transition group-hover:text-slate-500" />
                    </div>

                    <div className="mt-4 text-sm font-semibold text-slate-900">
                      {item.title}
                    </div>

                    <div className="mt-1 text-sm leading-6 text-slate-500">
                      {item.description}
                    </div>
                  </Link>
                );
              })}
            </div>
          </SurfaceCard>

          <SurfaceCard
            title="Data health"
            subtitle="Visible sections and their currently loaded counts."
          >
            <div className="space-y-3">
              {dataHealth.map((item) => (
                <HealthRow
                  key={item.key}
                  label={item.label}
                  count={item.count}
                  error={item.error}
                />
              ))}
            </div>
          </SurfaceCard>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <SurfaceCard
            title="Campaign demographics"
            subtitle="Status distribution of currently visible campaign records."
          >
            {sectionErrors.campaigns ? (
              <SectionWarning text={sectionErrors.campaigns} />
            ) : campaignStatusChartData.length ? (
              <MuiCampaignBarChart data={campaignStatusChartData} />
            ) : (
              <EmptyText text="No campaign demographic data available." />
            )}
          </SurfaceCard>

          <SurfaceCard
            title="Budget trend"
            subtitle="Estimated budget spread across campaign batches."
          >
            {sectionErrors.campaigns ? (
              <SectionWarning text={sectionErrors.campaigns} />
            ) : budgetTrendData.some((item) => item.value > 0) ? (
              <MuiBudgetLineChart data={budgetTrendData} />
            ) : (
              <EmptyText text="No budget trend available yet." />
            )}
          </SurfaceCard>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <SurfaceCard
            title="Team distribution"
            subtitle="Role-based demographic split using visible team data."
          >
            {teamDistributionData.some((item) => item.value > 0) ? (
              <MuiTeamPieChart data={teamDistributionData} />
            ) : (
              <EmptyText text="No team distribution available." />
            )}
          </SurfaceCard>

          <SurfaceCard
            title="Operational mix"
            subtitle="Brands, teams, campaigns, and access distribution."
          >
            {operationalMixData.some((item) => item.value > 0) ? (
              <MuiHorizontalMixChart data={operationalMixData} />
            ) : (
              <EmptyText text="No operational distribution available." />
            )}
          </SurfaceCard>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <SurfaceCard
            title="Campaign visibility"
            subtitle="A clean campaign summary using current status and publish data."
          >
            {sectionErrors.campaigns ? (
              <SectionWarning text={sectionErrors.campaigns} />
            ) : campaignStatusChartData.length ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <MiniMetric label="Total" value={String(state.campaigns.length)} />
                  <MiniMetric
                    label="Live / Published"
                    value={String(liveCampaignCount)}
                  />
                  <MiniMetric
                    label="Draft / Pending"
                    value={String(draftCampaignCount)}
                  />
                </div>

                <div className="space-y-3">
                  {campaignStatusChartData.map((item) => (
                    <ProgressRow
                      key={item.label}
                      label={item.label}
                      value={item.value}
                      total={state.campaigns.length || 1}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <EmptyText text="No campaign summary available." />
            )}
          </SurfaceCard>

          <SurfaceCard
            title="Admin profile"
            subtitle="Account details and access context, kept compact."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoTile
                icon={<UserCircle2 className="h-4 w-4" />}
                label="Name"
                value={state.me?.name || "Admin User"}
              />
              <InfoTile
                icon={<Shield className="h-4 w-4" />}
                label="Role"
                value={titleCaseRole(role)}
                badge
              />
              <InfoTile
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={state.me?.email || "-"}
              />
              <InfoTile
                icon={<LayoutDashboard className="h-4 w-4" />}
                label="Status"
                value={titleCaseText(state.me?.status)}
              />
              <InfoTile
                icon={<Briefcase className="h-4 w-4" />}
                label="Last login"
                value={formatDateTime(state.me?.lastLoginAt)}
              />
              <InfoTile
                icon={<Building2 className="h-4 w-4" />}
                label="Joined"
                value={formatDate(state.me?.createdAt)}
              />
              {state.me?.proxyEmail ? (
                <InfoTile
                  icon={<Mail className="h-4 w-4" />}
                  label="Proxy email"
                  value={state.me.proxyEmail}
                />
              ) : null}
              <InfoTile
                icon={<CheckCircle2 className="h-4 w-4" />}
                label="Permissions"
                value={String(state.me?.permissions?.length || 0)}
              />
            </div>
          </SurfaceCard>
        </section>

        {(role === "bme" || role === "ime") && (
          <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <SurfaceCard
              title="Assigned brands"
              subtitle="Directly assigned brand visibility for your role."
            >
              {sectionErrors.allocations ? (
                <SectionWarning text={sectionErrors.allocations} />
              ) : (
                <SimpleTable
                  columns={["Brand", "Status", "Updated"]}
                  rows={state.myAllocations.slice(0, 8).map((item) => [
                    item.brandId?.brandName || item.brandId?.companyName || "-",
                    <StatusChip
                      key={`${item._id}-status`}
                      value={titleCaseText(item.status)}
                    />,
                    formatDate(item.updatedAt || item.createdAt),
                  ])}
                  emptyText="No allocated brands found."
                />
              )}
            </SurfaceCard>

            <SurfaceCard
              title="Visible campaigns"
              subtitle="Campaigns available in your access scope."
            >
              {sectionErrors.campaigns ? (
                <SectionWarning text={sectionErrors.campaigns} />
              ) : (
                <SimpleTable
                  columns={["Campaign", "Brand", "Status", "Budget"]}
                  rows={state.campaigns.slice(0, 8).map((item) => [
                    item.campaignTitle || "-",
                    item.brandName || "-",
                    <StatusChip
                      key={`${item._id}-publish`}
                      value={titleCaseText(item.publishStatus || item.status)}
                    />,
                    formatMoney(
                      item.campaignBudget ||
                        item.budget ||
                        item.influencerBudget
                    ),
                  ])}
                  emptyText="No campaigns visible for your role."
                />
              )}
            </SurfaceCard>
          </section>
        )}

        {role === "revenue_head" && (
          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <SurfaceCard
              title="Team overview"
              subtitle="Compact visibility of your current operational hierarchy."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <MiniMetric label="BME" value={String(state.bmeTeam.length)} />
                <MiniMetric label="IME" value={String(state.imeTeam.length)} />
                <MiniMetric
                  label="Campaigns"
                  value={String(state.campaigns.length)}
                />
                <MiniMetric
                  label="Total team"
                  value={String(state.bmeTeam.length + state.imeTeam.length)}
                />
              </div>
            </SurfaceCard>

            <SurfaceCard
              title="Campaign view"
              subtitle="Highest priority campaign records for this hierarchy."
            >
              {sectionErrors.campaigns ? (
                <SectionWarning text={sectionErrors.campaigns} />
              ) : (
                <SimpleTable
                  columns={["Campaign", "Brand", "Status", "Budget"]}
                  rows={state.campaigns.slice(0, 8).map((item) => [
                    item.campaignTitle || "-",
                    item.brandName || "-",
                    <StatusChip
                      key={`${item._id}-publish`}
                      value={titleCaseText(item.publishStatus || item.status)}
                    />,
                    formatMoney(
                      item.campaignBudget ||
                        item.budget ||
                        item.influencerBudget
                    ),
                  ])}
                  emptyText="No campaigns visible for this revenue head."
                />
              )}
            </SurfaceCard>

            <SurfaceCard
              title="BME team"
              subtitle="Visible BME members under your hierarchy."
            >
              {sectionErrors.bmeTeam ? (
                <SectionWarning text={sectionErrors.bmeTeam} />
              ) : (
                <SimpleTable
                  columns={["Name", "Email", "Status", "Last login"]}
                  rows={state.bmeTeam.slice(0, 8).map((item) => [
                    item.name || "-",
                    item.email,
                    <StatusChip
                      key={`${item._id}-status`}
                      value={titleCaseText(item.status)}
                    />,
                    formatDate(item.lastLoginAt),
                  ])}
                  emptyText="No BME members found."
                />
              )}
            </SurfaceCard>

            <SurfaceCard
              title="IME team"
              subtitle="Visible IME members under your hierarchy."
            >
              {sectionErrors.imeTeam ? (
                <SectionWarning text={sectionErrors.imeTeam} />
              ) : (
                <SimpleTable
                  columns={["Name", "Email", "Status", "Last login"]}
                  rows={state.imeTeam.slice(0, 8).map((item) => [
                    item.name || "-",
                    item.email,
                    <StatusChip
                      key={`${item._id}-status`}
                      value={titleCaseText(item.status)}
                    />,
                    formatDate(item.lastLoginAt),
                  ])}
                  emptyText="No IME members found."
                />
              )}
            </SurfaceCard>
          </section>
        )}

        {role === "super_admin" && (
          <section className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
              <SurfaceCard
                title="Leadership snapshot"
                subtitle="High-level operational visibility across people and brands."
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <MiniMetric
                    label="Revenue heads"
                    value={String(state.allRevenueHeads.length)}
                  />
                  <MiniMetric label="BME" value={String(state.bmeTeam.length)} />
                  <MiniMetric label="IME" value={String(state.imeTeam.length)} />
                  <MiniMetric
                    label="Managed brands"
                    value={String(state.managedBrands.length)}
                  />
                </div>
              </SurfaceCard>

              <SurfaceCard
                title="Managed brands"
                subtitle="Primary managed brands and current ownership mapping."
              >
                {sectionErrors.managedBrands ? (
                  <SectionWarning text={sectionErrors.managedBrands} />
                ) : (
                  <SimpleTable
                    columns={["Brand", "Revenue Head", "BME", "IME"]}
                    rows={state.managedBrands.slice(0, 8).map((item) => [
                      item.brandName || item.companyName || "-",
                      item.assignedRm || "-",
                      item.assignedBm || "-",
                      item.assignedIm || "-",
                    ])}
                    emptyText="No managed brands found."
                  />
                )}
              </SurfaceCard>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <SurfaceCard
                title="Revenue heads"
                subtitle="Leadership visibility in a compact list."
              >
                {sectionErrors.revenueHeads ? (
                  <SectionWarning text={sectionErrors.revenueHeads} />
                ) : (
                  <SimpleTable
                    columns={["Name", "Email", "Status", "Joined"]}
                    rows={state.allRevenueHeads.slice(0, 8).map((item) => [
                      item.name || "-",
                      item.email,
                      <StatusChip
                        key={`${item._id}-status`}
                        value={titleCaseText(item.status)}
                      />,
                      formatDate(item.createdAt),
                    ])}
                    emptyText="No revenue heads found."
                  />
                )}
              </SurfaceCard>

              <SurfaceCard
                title="Platform campaign view"
                subtitle="Main campaign visibility without repeated extra sections."
              >
                {sectionErrors.campaigns ? (
                  <SectionWarning text={sectionErrors.campaigns} />
                ) : (
                  <SimpleTable
                    columns={["Campaign", "Brand", "Status", "Budget"]}
                    rows={state.campaigns.slice(0, 8).map((item) => [
                      item.campaignTitle || "-",
                      item.brandName || "-",
                      <StatusChip
                        key={`${item._id}-publish`}
                        value={titleCaseText(item.publishStatus || item.status)}
                      />,
                      formatMoney(
                        item.campaignBudget ||
                          item.budget ||
                          item.influencerBudget
                      ),
                    ])}
                    emptyText="No campaigns available."
                  />
                )}
              </SurfaceCard>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function ChartGradientDefs() {
  return (
    <svg width="0" height="0" className="absolute">
      <defs>
        <linearGradient id="cgBarGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#020617" stopOpacity="1" />
          <stop offset="55%" stopColor="#1e293b" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.82" />
        </linearGradient>

        <linearGradient id="cgAreaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#020617" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#334155" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#f8fafc" stopOpacity="0.02" />
        </linearGradient>

        <linearGradient id="cgHorizontalGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#020617" stopOpacity="1" />
          <stop offset="65%" stopColor="#334155" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.88" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function MuiCampaignBarChart({
  data,
}: {
  data: Array<{ label: string; value: number }>;
}) {
  return (
    <div className="relative h-[300px] w-full">
      <ChartGradientDefs />

      <BarChart
        height={300}
        xAxis={[
          {
            scaleType: "band",
            data: data.map((item) => item.label),
          },
        ]}
        yAxis={[
          {
            tickMinStep: 1,
          },
        ]}
        series={[
          {
            label: "Campaigns",
            data: data.map((item) => item.value),
            color: "url(#cgBarGradient)",
          },
        ]}
        grid={{ horizontal: true }}
        borderRadius={10}
        margin={{ top: 20, right: 20, bottom: 48, left: 42 }}
        sx={chartSx}
      />
    </div>
  );
}

function MuiBudgetLineChart({
  data,
}: {
  data: Array<{ label: string; value: number }>;
}) {
  return (
    <div className="relative h-[300px] w-full">
      <ChartGradientDefs />

      <LineChart
        height={300}
        xAxis={[
          {
            scaleType: "point",
            data: data.map((item) => item.label),
          },
        ]}
        yAxis={[
          {
            valueFormatter: (value:string | number) => `$${Math.round(Number(value) / 1000)}k`,
          },
        ]}
        series={[
          {
            label: "Budget",
            data: data.map((item) => item.value),
            area: true,
            showMark: false,
            color: "#020617",
            // valueFormatter: (value: string | number) => formatMoney(Number(value)),
          },
        ]}
        grid={{ horizontal: true }}
        margin={{ top: 20, right: 20, bottom: 42, left: 56 }}
        sx={{
          ...chartSx,
          "& .MuiAreaElement-root": {
            fill: "url(#cgAreaGradient)",
          },
          "& .MuiLineElement-root": {
            strokeWidth: 3,
          },
        }}
      />
    </div>
  );
}

function MuiTeamPieChart({
  data,
}: {
  data: Array<{ label: string; value: number }>;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const chartData = data.map((item, index) => ({
    id: item.label,
    value: item.value,
    label: item.label,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr] lg:items-center">
      <div className="relative h-[280px]">
        <PieChart
          height={280}
          series={[
            {
              data: chartData,
              innerRadius: 72,
              outerRadius: 110,
              paddingAngle: 3,
              cornerRadius: 6,
              cx: 135,
              cy: 135,
            },
          ]}
          slotProps={{
            // legend: {
            //   hidden: true,
            // },
          }}
          sx={{
            "& .MuiPieArc-root": {
              stroke: "#ffffff",
              strokeWidth: 3,
            },
          }}
        />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold tracking-tight text-slate-950">
              {total}
            </div>
            <div className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
              Team
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {data.map((item, index) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                }}
              />

              <span className="truncate text-sm font-medium text-slate-700">
                {item.label}
              </span>
            </div>

            <span className="text-sm font-semibold text-slate-950">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MuiHorizontalMixChart({
  data,
}: {
  data: Array<{ label: string; value: number }>;
}) {
  return (
    <div className="relative h-[320px] w-full">
      <ChartGradientDefs />

      <BarChart
        height={320}
        layout="horizontal"
        yAxis={[
          {
            scaleType: "band",
            data: data.map((item) => item.label),
          },
        ]}
        xAxis={[
          {
            tickMinStep: 1,
          },
        ]}
        series={[
          {
            label: "Records",
            data: data.map((item) => item.value),
            color: "url(#cgHorizontalGradient)",
          },
        ]}
        grid={{ vertical: true }}
        borderRadius={10}
        margin={{ top: 20, right: 24, bottom: 36, left: 132 }}
        sx={chartSx}
      />
    </div>
  );
}

function SurfaceCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold tracking-tight text-slate-950">
          {title}
        </h3>

        {subtitle ? (
          <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
        ) : null}
      </div>

      {children}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  helper,
  emphasis = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
  emphasis?: "default" | "muted";
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4">
      <div
        className={cn(
          "inline-flex rounded-2xl p-3",
          emphasis === "muted"
            ? "bg-slate-100 text-slate-500"
            : "bg-slate-950 text-white"
        )}
      >
        {icon}
      </div>

      <div className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>

      <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
        {value}
      </div>

      <div className="mt-2 text-sm leading-6 text-slate-500">{helper}</div>
    </div>
  );
}

function DarkInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="text-sm text-white/65">{label}</div>
      <div className="text-right text-sm font-medium text-white">{value}</div>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
  badge = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  badge?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <div className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600">
          {icon}
        </div>

        <div className="text-xs font-semibold uppercase tracking-[0.16em]">
          {label}
        </div>
      </div>

      {badge ? (
        <div className="mt-3 inline-flex rounded-full border border-slate-900 bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
          {value}
        </div>
      ) : (
        <div className="mt-3 break-words text-sm font-medium text-slate-900">
          {value}
        </div>
      )}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>

      <div className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
        {value}
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percentage = Math.min(100, Math.round((value / total) * 100));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm font-medium text-slate-700">{label}</div>
        <div className="text-sm text-slate-500">
          {value} · {percentage}%
        </div>
      </div>

      <div className="h-2 rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-slate-900"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function HealthRow({
  label,
  count,
  error,
}: {
  label: string;
  count: number;
  error?: string | null;
}) {
  const healthy = !error;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-2xl border px-4 py-3",
        healthy ? "border-slate-200 bg-slate-50" : "border-slate-300 bg-white"
      )}
    >
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-900">{label}</div>

        <div className="mt-1 text-sm text-slate-500">
          {healthy ? `${count} record${count === 1 ? "" : "s"} loaded` : error}
        </div>
      </div>

      <div
        className={cn(
          "whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold",
          healthy
            ? "border-slate-900 bg-slate-900 text-white"
            : "border-slate-300 bg-slate-100 text-slate-700"
        )}
      >
        {healthy ? "Loaded" : "Issue"}
      </div>
    </div>
  );
}

function NoteRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>

      <div className="mt-1 text-sm leading-6 text-slate-700">{value}</div>
    </div>
  );
}

function StatusChip({ value }: { value?: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
        getStatusBadgeClass(value)
      )}
    >
      {value || "-"}
    </span>
  );
}

function EmptyText({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

function SectionWarning({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-slate-300 bg-slate-100 px-4 py-4 text-sm text-slate-700">
      {text}
    </div>
  );
}

function SimpleTable({
  columns,
  rows,
  emptyText,
}: {
  columns: string[];
  rows: Array<Array<React.ReactNode>>;
  emptyText: string;
}) {
  if (!rows.length) {
    return <EmptyText text={emptyText} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 bg-white">
            {rows.map((row, index) => (
              <tr key={index} className="hover:bg-slate-50/80">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-4 py-3 align-middle text-slate-700"
                  >
                    {cell || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}