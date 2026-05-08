"use client";

import React from "react";
import Link from "next/link";
import { post } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast, ToastStyles } from "@/components/ui/toast";
import {
  HiOutlineRefresh,
  HiChevronUp,
  HiChevronDown,
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi";
import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  CircleHelp,
  Globe2,
  Layers3,
  Search,
  TrendingUp,
  Users,
  Plus,
  XCircle,
  Clock3,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

interface NamedEntity {
  _id?: string;
  name: string;
}

interface SocialProfile {
  provider?: string;
  handle?: string;
  username?: string;
  followers?: number;
  url?: string;
  picture?: string;
}

interface Onboarding {
  route?: string;
  page1Done?: boolean;
  page2Done?: boolean;
  page3Done?: boolean;
  ispage2Skip?: boolean;
  ispage3Skip?: boolean;
}

interface Influencer {
  _id: string;
  email: string;
  name: string;
  country?: NamedEntity | null;
  languages?: NamedEntity[];
  categories?: NamedEntity[];
  proxyEmail?: string;
  primaryPlatform?: string | null;
  socialProfiles?: SocialProfile[];
  onboarding?: Onboarding;
  createdAt?: string;
  updatedAt?: string;
  isAdminCreated?: boolean;
  signupCompleted?: boolean;
  createdByAdmin?: string | null;
  adminCreatedRole?: string;
  adminCreatedAt?: string | null;
  signupCompletedAt?: string | null;
  createdByAdminName?: string;
  createdByAdminEmail?: string;
  createdByLabel?: string;
  createdBySource?: "admin" | "influencer";
  currentStatus?: "pending_signup" | "active";
  currentStatusLabel?: string;
  currentStatusSubLabel?: string;
}

interface GetListResponse {
  page: number;
  limit: number;
  total: number;
  pages?: number;
  count?: number;
  influencers: Influencer[];
}

interface CreateInfluencerResponse {
  success: boolean;
  message: string;
  influencer?: Influencer;
}

type CreateInfluencerPlatform = "youtube" | "instagram" | "tiktok";

interface TrendPoint {
  label: string;
  shortLabel: string;
  value: number;
  byPlatform: {
    instagram: number;
    youtube: number;
    tiktok: number;
    other: number;
  };
}

type SortField = "name" | "email" | "primaryPlatform" | "createdAt" | "updatedAt";
type PlatformFilter = "all" | "instagram" | "youtube" | "tiktok";
type SignupRange = "all" | "thisMonth" | "last30" | "last90";
type OnboardingFilter = "all" | "completed" | "inProgress";
type PlatformKey = Exclude<PlatformFilter, "all">;

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

const API_ENDPOINT = "/admin/influencer/list";
const CREATE_INFLUENCER_ENDPOINT = "/admin/influencer/create";
const DEFAULT_LIMIT = 10;
const FETCH_LIMIT = 200;
const MAX_FETCH_PAGES = 20;
const ROW_OPTIONS = [10, 20, 50, 100] as const;

const HEADERS: {
  key:
    | SortField
    | "country"
    | "categories"
    | "onboarding"
    | "contact"
    | "createdBy"
    | "currentStatus";
  label: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
}[] = [
  { key: "name", label: "Influencer", sortable: true, align: "left" },
  { key: "contact", label: "Contact", align: "left" },
  { key: "primaryPlatform", label: "Platform", sortable: true, align: "center" },
  { key: "createdAt", label: "Created", sortable: true, align: "center" },
  { key: "createdBy", label: "Created By", align: "center" },
  { key: "currentStatus", label: "Current Status", align: "center" },
  { key: "onboarding", label: "Onboarding", align: "center" },
];

const PLATFORM_META: Record<
  PlatformKey,
  {
    icon: string;
    accent: string;
    accentLight: string;
    accentText: string;
    stackColor: string;
    barGradient: string;
  }
> = {
  instagram: {
    icon: "/skill-icons_instagram.svg",
    accent: "#e1306c",
    accentLight: "#fce4ef",
    accentText: "#9c1246",
    stackColor: "#e1306c",
    barGradient: "from-pink-500 to-rose-400",
  },
  youtube: {
    icon: "/logos_youtube-icon.svg",
    accent: "#f97316",
    accentLight: "#fff0e6",
    accentText: "#9a3412",
    stackColor: "#f97316",
    barGradient: "from-orange-500 to-amber-400",
  },
  tiktok: {
    icon: "/ic_baseline-tiktok.svg",
    accent: "#6366f1",
    accentLight: "#eeeffd",
    accentText: "#3730a3",
    stackColor: "#6366f1",
    barGradient: "from-indigo-500 to-violet-400",
  },
};

const STACK_ORDER: (PlatformKey | "other")[] = [
  "other",
  "tiktok",
  "youtube",
  "instagram",
];

const STACK_COLORS: Record<string, string> = {
  instagram: "#e1306c",
  youtube: "#f97316",
  tiktok: "#6366f1",
  other: "#e2e8f0",
};

const ALLOWED_SORT = new Set<SortField>([
  "name",
  "email",
  "primaryPlatform",
  "createdAt",
  "updatedAt",
]);

function normalizeErrorValue(value: unknown): string {
  if (!value) return "";

  if (typeof value === "string") return value.trim();

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

function showWarningToast(title: string, message?: string) {
  toast({
    icon: "warning",
    title,
    text: message,
    timer: 3500,
  });
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function safeDate(v?: string | null) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(v?: string | null) {
  const d = safeDate(v);
  if (!d) return "—";
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatCompactNumber(v: number) {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(v);
}

function formatSignedPercent(v: number) {
  const r = Math.abs(v) >= 10 ? Math.abs(v).toFixed(0) : Math.abs(v).toFixed(1);
  return v > 0 ? `+${r}%` : v < 0 ? `-${r}%` : "0%";
}

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1).padStart(2, "0"),
  label: new Date(2000, index, 1).toLocaleDateString("en-IN", {
    month: "long",
  }),
}));

function formatMonthYearLabel(monthValue?: string | null, yearValue?: string | null) {
  if (!monthValue || !yearValue) return "Select month and year";

  const month = Number(monthValue);
  const year = Number(yearValue);

  if (!month || !year) return "Select month and year";

  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function buildYearOptions(rows: Influencer[]) {
  const years = new Set<number>();

  rows.forEach((row) => {
    const createdAt = safeDate(row.createdAt);
    if (!createdAt) return;
    years.add(createdAt.getFullYear());
  });

  return Array.from(years)
    .sort((a, b) => b - a)
    .map((year) => ({
      value: String(year),
      label: String(year),
    }));
}

function getLatestAvailableMonthValue(rows: Influencer[], selectedYear?: string | null) {
  if (!selectedYear) return "";

  const year = Number(selectedYear);
  if (!year) return "";

  const months = rows
    .map((row) => safeDate(row.createdAt))
    .filter((date): date is Date => date !== null && date.getFullYear() === year)
    .sort((a, b) => b.getTime() - a.getTime());

  if (!months.length) return "";

  return String(months[0].getMonth() + 1).padStart(2, "0");
}

function getInitials(name?: string) {
  return (
    (name || "Influencer")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "IN"
  );
}

function normalizePlatform(p?: string | null): PlatformKey | null {
  const v = String(p || "").trim().toLowerCase();
  return v === "instagram" || v === "youtube" || v === "tiktok" ? v : null;
}

function getUniquePlatforms(inf: Influencer) {
  const primary = normalizePlatform(inf.primaryPlatform);
  const seen = new Set<string>();
  const ordered: string[] = [];

  if (primary) {
    seen.add(primary);
    ordered.push(primary);
  }

  inf.socialProfiles?.forEach((p) => {
    const pn = normalizePlatform(p.provider);
    if (pn && !seen.has(pn)) {
      seen.add(pn);
      ordered.push(pn);
    }
  });

  return ordered;
}

function getPlatformIcon(p?: string | null) {
  const n = normalizePlatform(p);

  return n === "instagram"
    ? "/skill-icons_instagram.svg"
    : n === "youtube"
      ? "/logos_youtube-icon.svg"
      : n === "tiktok"
        ? "/ic_baseline-tiktok.svg"
        : null;
}

function getPrimaryPlatform(inf: Influencer): PlatformKey | null {
  const p = normalizePlatform(inf.primaryPlatform);
  if (p) return p;

  return normalizePlatform(
    inf.socialProfiles?.find((p) => normalizePlatform(p.provider))?.provider
  );
}

function getCountryName(inf: Influencer) {
  return inf.country?.name || "—";
}

function getCategoryNames(inf: Influencer) {
  return inf.categories?.map((i) => i.name).filter(Boolean) || [];
}

function getLanguageNames(inf: Influencer) {
  return inf.languages?.map((i) => i.name).filter(Boolean) || [];
}

function getSocialProfileCount(inf: Influencer) {
  return inf.socialProfiles?.length || 0;
}

function getPrimaryUsername(inf: Influencer) {
  const primary = normalizePlatform(inf.primaryPlatform);
  const primaryProfile = inf.socialProfiles?.find(
    (profile) => normalizePlatform(profile.provider) === primary
  );
  const fallbackProfile = primaryProfile || inf.socialProfiles?.[0];

  return fallbackProfile?.handle || fallbackProfile?.username || "";
}

function formatRoleLabel(role?: string) {
  const r = String(role || "").trim().toLowerCase();

  if (r === "super_admin") return "Super Admin";
  if (r === "revenue_head") return "RH";
  if (r === "bme") return "BME";
  if (r === "ime") return "IME";
  if (r === "sdr") return "SDR";

  return r ? r.replace(/_/g, " ").toUpperCase() : "Admin";
}

function normalizeAdminRoleForCreateAccess(value?: unknown) {
  const role = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  if (role === "superadmin" || role === "super") return "super_admin";
  if (role === "revenuehead" || role === "rh") return "revenue_head";
  if (role === "bme") return "bme";
  if (role === "ime") return "ime";
  if (role === "sdr") return "sdr";

  return role;
}

function getCreatedByInfo(inf: Influencer) {
  const isAdmin = inf.createdBySource === "admin" || inf.isAdminCreated === true;
  const roleLabel = formatRoleLabel(inf.adminCreatedRole);
  const adminName =
    inf.createdByAdminName ||
    inf.createdByLabel ||
    inf.createdByAdminEmail ||
    "Admin";

  if (isAdmin) {
    return {
      label: adminName,
      subLabel: roleLabel,
      badge: "Admin",
      className: "border-indigo-200 bg-indigo-50 text-indigo-700",
    };
  }

  return {
    label: "Influencer",
    subLabel: "Self signup",
    badge: "Self",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

function getInfluencerCurrentStatus(inf: Influencer) {
  if (
    inf.currentStatus === "pending_signup" ||
    (inf.isAdminCreated === true && inf.signupCompleted === false)
  ) {
    return {
      label: inf.currentStatusLabel || "Pending Signup",
      subLabel: inf.currentStatusSubLabel || "Admin-created placeholder",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: inf.currentStatusLabel || "Active",
    subLabel: inf.currentStatusSubLabel || "Signup completed",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

function getCompletedPages(inf: Influencer) {
  const o = inf.onboarding;
  if (!o) return 0;

  return (
    (o.page1Done ? 1 : 0) +
    (o.page2Done || o.ispage2Skip ? 1 : 0) +
    (o.page3Done || o.ispage3Skip ? 1 : 0)
  );
}

function isFullyOnboarded(inf: Influencer) {
  return getCompletedPages(inf) === 3;
}

function getOnboardingTone(inf: Influencer) {
  const c = getCompletedPages(inf);

  return c === 3
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : c >= 1
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-slate-100 text-slate-500 border-slate-200";
}

function isCurrentMonth(d: Date | null) {
  if (!d) return false;

  const now = new Date();

  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function isPreviousMonth(d: Date | null) {
  if (!d) return false;

  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  return d.getMonth() === prev.getMonth() && d.getFullYear() === prev.getFullYear();
}

function matchesSignupRange(d: Date | null, range: SignupRange) {
  if (range === "all") return true;
  if (!d) return false;

  const now = new Date();

  if (range === "thisMonth") return isCurrentMonth(d);

  const cutoff =
    range === "last30"
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);

  return d >= cutoff;
}

function calculateGrowthRate(curr: number, prev: number) {
  if (!prev) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

function buildMonthlyTrendDetailed(rows: Influencer[], months = 6): TrendPoint[] {
  const now = new Date();

  return Array.from({ length: months }, (_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - (months - 1 - index),
      1
    );

    const monthRows = rows.filter((row) => {
      const c = safeDate(row.createdAt);
      return c && c.getMonth() === date.getMonth() && c.getFullYear() === date.getFullYear();
    });

    const byPlatform = {
      instagram: 0,
      youtube: 0,
      tiktok: 0,
      other: 0,
    };

    monthRows.forEach((row) => {
      const p = getPrimaryPlatform(row);

      if (p === "instagram" || p === "youtube" || p === "tiktok") {
        byPlatform[p]++;
      } else {
        byPlatform.other++;
      }
    });

    return {
      label: date.toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      }),
      shortLabel: date.toLocaleDateString("en-IN", {
        month: "short",
      }),
      value: monthRows.length,
      byPlatform,
    };
  });
}

function getSearchableText(inf: Influencer) {
  const createdBy = getCreatedByInfo(inf);
  const currentStatus = getInfluencerCurrentStatus(inf);

  return [
    inf.name,
    inf.email,
    inf.proxyEmail,
    getCountryName(inf),
    getPrimaryPlatform(inf),
    getCategoryNames(inf).join(" "),
    getLanguageNames(inf).join(" "),
    getPrimaryUsername(inf),
    createdBy.label,
    createdBy.badge,
    createdBy.subLabel,
    currentStatus.label,
    currentStatus.subLabel,
    inf.socialProfiles?.map((i) => i.handle || i.username || i.provider).join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getSortValue(inf: Influencer, field: SortField) {
  switch (field) {
    case "name":
      return inf.name || "";
    case "email":
      return inf.email || "";
    case "primaryPlatform":
      return getPrimaryPlatform(inf) || "";
    case "createdAt":
      return safeDate(inf.createdAt)?.getTime() || 0;
    case "updatedAt":
      return safeDate(inf.updatedAt)?.getTime() || 0;
    default:
      return "";
  }
}

function getRowsByPlatform(rows: Influencer[], platform: PlatformFilter) {
  return platform === "all"
    ? rows
    : rows.filter((i) => getPrimaryPlatform(i) === platform);
}

function PlatformIcons({ influencer }: { influencer: Influencer }) {
  const platforms = getUniquePlatforms(influencer);
  const primary = normalizePlatform(influencer.primaryPlatform);

  if (!platforms.length) {
    return (
      <span className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-400">
        —
      </span>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1">
      {platforms.map((platform) => {
        const icon = getPlatformIcon(platform);
        const isPrimary = platform === primary;

        return (
          <div
            key={platform}
            title={platform}
            className={cn(
              "relative flex h-8 w-8 items-center justify-center rounded-lg border bg-white",
              isPrimary
                ? "border-slate-300 shadow-[0_0_0_2px_#dcfce7]"
                : "border-slate-200 shadow-sm"
            )}
          >
            {isPrimary ? (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
            ) : null}

            {icon ? (
              <img src={icon} alt={platform} className="h-4 w-4 object-contain" />
            ) : (
              <span className="text-[10px] font-bold text-slate-400">—</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PlatformIconBadge({
  platform,
  size = "md",
}: {
  platform?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const n = normalizePlatform(platform);

  if (!n) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-xs font-bold text-slate-400">
        —
      </div>
    );
  }

  const meta = PLATFORM_META[n];
  const sizeClass =
    size === "sm"
      ? "h-6 w-6 rounded-md"
      : size === "lg"
        ? "h-10 w-10 rounded-xl"
        : "h-8 w-8 rounded-lg";

  const iconSize =
    size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <div
      title={n}
      className={cn("flex items-center justify-center border", sizeClass)}
      style={{
        background: meta.accentLight,
        borderColor: meta.accent + "33",
      }}
    >
      <img src={meta.icon} alt={n} className={cn("object-contain", iconSize)} />
    </div>
  );
}

function OnboardingBadge({ influencer }: { influencer: Influencer }) {
  const c = getCompletedPages(influencer);

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md px-2.5 py-0.5 text-xs font-semibold",
        getOnboardingTone(influencer)
      )}
    >
      {c === 3 ? "Complete" : `${c}/3 Steps`}
    </Badge>
  );
}

function MetricCard({
  title,
  tooltip,
  value,
  hint,
  icon: Icon,
  accentColor = "#0f172a",
  trend,
}: {
  title: string;
  tooltip: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor?: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="relative flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full"
        style={{ background: accentColor, opacity: 0.7 }}
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            {title}
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex h-4 w-4 items-center justify-center text-slate-300 hover:text-slate-500"
              >
                <CircleHelp className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px] text-xs">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </div>

        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: accentColor + "12", color: accentColor }}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div>
        <div className="text-[28px] font-black tracking-tight text-slate-900 leading-none">
          {value}
        </div>

        <div className="flex items-center gap-1.5">
          {trend === "up" ? (
            <span className="inline-flex items-center rounded-sm bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">
              Up
            </span>
          ) : null}

          {trend === "down" ? (
            <span className="inline-flex items-center rounded-sm bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-500">
              Down
            </span>
          ) : null}

          <span className="text-xs text-slate-400">{hint}</span>
        </div>
      </div>
    </div>
  );
}

function FilterField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <label className="flex min-w-[150px] flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-slate-400"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SectionShell({
  title,
  description,
  children,
  right,
}: {
  title: React.ReactNode;
  description: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900">
              {title}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">{description}</p>
          </div>
          {right}
        </div>
      </div>

      <div className="p-5">{children}</div>
    </Card>
  );
}

function SignupTrendChart({
  data,
  platformFilter,
}: {
  data: TrendPoint[];
  platformFilter: PlatformFilter;
}) {
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);

  const W = 500;
  const H = 210;
  const padL = 36;
  const padR = 14;
  const padT = 22;
  const padB = 30;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const yTicks = 4;
  const yStep = Math.ceil(maxValue / yTicks) || 1;
  const yMax = yStep * yTicks;

  const toX = (idx: number) =>
    data.length === 1
      ? padL + innerW / 2
      : padL + (idx / (data.length - 1)) * innerW;

  const toY = (val: number) =>
    padT + (1 - Math.min(val, yMax) / yMax) * innerH;

  const showStacked = platformFilter === "all";

  const stackedData = React.useMemo(
    () =>
      data.map((point) => {
        let cum = 0;
        const stacks = STACK_ORDER.map((platform) => {
          const val =
            point.byPlatform[platform as keyof typeof point.byPlatform] || 0;
          const bottom = cum;
          cum += val;
          return {
            platform,
            val,
            bottom,
            top: cum,
          };
        });

        return {
          ...point,
          stacks,
        };
      }),
    [data]
  );

  const getStackAreaPath = (platform: string): string => {
    if (data.length < 2) return "";

    const fwd = stackedData
      .map((d, i) => {
        const s = d.stacks.find((x) => x.platform === platform)!;
        return `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(s.top).toFixed(1)}`;
      })
      .join(" ");

    const bwd = [...stackedData]
      .reverse()
      .map((d, ri) => {
        const origIdx = stackedData.length - 1 - ri;
        const s = d.stacks.find((x) => x.platform === platform)!;
        return `L${toX(origIdx).toFixed(1)},${toY(s.bottom).toFixed(1)}`;
      })
      .join(" ");

    return `${fwd} ${bwd} Z`;
  };

  const getStackTopLine = (platform: string): string => {
    if (data.length < 2) return "";

    return stackedData
      .map((d, i) => {
        const s = d.stacks.find((x) => x.platform === platform)!;
        return `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(s.top).toFixed(1)}`;
      })
      .join(" ");
  };

  const singleColor =
    platformFilter !== "all"
      ? PLATFORM_META[platformFilter as PlatformKey]?.accent || "#0f172a"
      : "#0f172a";

  const singleLinePath = data
    .map(
      (d, i) =>
        `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(d.value).toFixed(1)}`
    )
    .join(" ");

  const singleAreaPath =
    data.length > 0
      ? `${singleLinePath} L${toX(data.length - 1).toFixed(1)},${toY(0).toFixed(
          1
        )} L${padL},${toY(0).toFixed(1)} Z`
      : "";

  const total = data.reduce((s, d) => s + d.value, 0);
  const avg = data.length ? total / data.length : 0;
  const peakIdx = data.reduce(
    (best, d, i) => (d.value > data[best].value ? i : best),
    0
  );

  const tooltipXPct = hoveredIdx !== null ? (toX(hoveredIdx) / W) * 100 : 0;
  const tooltipShiftX =
    tooltipXPct > 72 ? "-90%" : tooltipXPct < 28 ? "-10%" : "-50%";

  const hoveredPoint = hoveredIdx !== null ? data[hoveredIdx] : null;
  const tooltipPlatforms: PlatformKey[] = ["instagram", "youtube", "tiktok"];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3.5 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            6-Month Total
          </div>
          <div className="mt-1.5 text-xl font-black text-slate-900">
            {total}
          </div>
        </div>

        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3.5 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Monthly Avg
          </div>
          <div className="mt-1.5 text-xl font-black text-slate-900">
            {avg.toFixed(1)}
          </div>
        </div>

        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3.5 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Peak Month
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900">
              {data[peakIdx]?.value ?? 0}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {data[peakIdx]?.shortLabel}
            </span>
          </div>
        </div>
      </div>

      <div
        className="relative rounded-xl border border-slate-100 bg-slate-50 px-1 pt-1 pb-0"
        style={{ overflow: "visible" }}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {hoveredIdx !== null && hoveredPoint ? (
          <div
            className="pointer-events-none absolute top-1 z-30 w-52 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xl"
            style={{
              left: `${tooltipXPct}%`,
              transform: `translateX(${tooltipShiftX}) translateY(-100%) translateY(-12px)`,
            }}
          >
            <div className="mb-2.5 flex items-baseline justify-between">
              <span className="text-xs font-semibold text-slate-500">
                {hoveredPoint.label}
              </span>
              <span className="text-base font-black text-slate-900">
                {hoveredPoint.value} total
              </span>
            </div>

            <div className="mb-2.5 h-px bg-slate-100" />

            <div className="space-y-2">
              {tooltipPlatforms.map((platform) => {
                const count = hoveredPoint.byPlatform[platform] || 0;
                const meta = PLATFORM_META[platform];
                const pct =
                  hoveredPoint.value > 0
                    ? Math.round((count / hoveredPoint.value) * 100)
                    : 0;

                return (
                  <div key={platform} className="flex items-center gap-2">
                    <div
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                      style={{
                        background: meta.accentLight,
                        border: `1px solid ${meta.accent}33`,
                      }}
                    >
                      <img
                        src={meta.icon}
                        alt={platform}
                        className="h-3 w-3 object-contain"
                      />
                    </div>

                    <span className="flex-1 text-xs capitalize text-slate-600">
                      {platform}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {count}
                    </span>
                    <span className="w-8 text-right text-[10px] font-medium text-slate-400">
                      {pct}%
                    </span>
                  </div>
                );
              })}

              {hoveredPoint.byPlatform.other > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 shrink-0 rounded-md border border-slate-200 bg-slate-100" />
                  <span className="flex-1 text-xs text-slate-500">Other</span>
                  <span className="text-xs font-bold text-slate-900">
                    {hoveredPoint.byPlatform.other}
                  </span>
                  <span className="w-8 text-right text-[10px] text-slate-400">
                    {hoveredPoint.value > 0
                      ? Math.round(
                          (hoveredPoint.byPlatform.other / hoveredPoint.value) * 100
                        )
                      : 0}
                    %
                  </span>
                </div>
              ) : null}
            </div>

            <div className="mt-3 space-y-1.5">
              {tooltipPlatforms.map((platform) => {
                const count = hoveredPoint.byPlatform[platform] || 0;
                const pct =
                  hoveredPoint.value > 0 ? (count / hoveredPoint.value) * 100 : 0;
                const meta = PLATFORM_META[platform];

                return (
                  <div key={platform} className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: meta.stackColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: 230, display: "block" }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="singleFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={singleColor} stopOpacity="0.18" />
              <stop offset="100%" stopColor={singleColor} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {showStacked && data.length >= 2
            ? STACK_ORDER.map((platform) => (
                <path
                  key={`area-${platform}`}
                  d={getStackAreaPath(platform)}
                  fill={STACK_COLORS[platform]}
                  opacity={0.82}
                />
              ))
            : null}

          {!showStacked && data.length >= 2 ? (
            <path d={singleAreaPath} fill="url(#singleFill)" />
          ) : null}

          {Array.from({ length: yTicks + 1 }, (_, i) => {
            const val = yStep * (yTicks - i);
            const y = toY(val);

            return (
              <g key={i}>
                <line
                  x1={padL}
                  y1={y}
                  x2={W - padR}
                  y2={y}
                  stroke={i === yTicks ? "#cbd5e1" : "#e2e8f0"}
                  strokeWidth="0.8"
                  strokeDasharray={i === yTicks ? "0" : "4 3"}
                />
                <text
                  x={padL - 6}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="central"
                  fontSize="9"
                  fill="#94a3b8"
                  fontFamily="inherit"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {showStacked && data.length >= 2
            ? STACK_ORDER.filter((p) => p !== "other").map((platform) => (
                <path
                  key={`sep-${platform}`}
                  d={getStackTopLine(platform)}
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                  opacity="0.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))
            : null}

          {!showStacked && data.length >= 2 ? (
            <path
              d={singleLinePath}
              fill="none"
              stroke={singleColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {hoveredIdx !== null ? (
            <>
              <rect
                x={toX(hoveredIdx) - innerW / data.length / 2}
                y={padT}
                width={innerW / data.length}
                height={innerH}
                fill="white"
                opacity="0.12"
              />
              <line
                x1={toX(hoveredIdx)}
                y1={padT}
                x2={toX(hoveredIdx)}
                y2={padT + innerH}
                stroke="#64748b"
                strokeWidth="1"
                strokeDasharray="3 2"
                opacity="0.5"
              />
            </>
          ) : null}

          {data.map((pt, i) => {
            const isHov = hoveredIdx === i;

            return (
              <g key={`dp-${i}`}>
                <circle
                  cx={toX(i)}
                  cy={toY(pt.value)}
                  r={isHov ? 4.5 : 3}
                  fill="white"
                  stroke={showStacked ? "#475569" : singleColor}
                  strokeWidth={isHov ? 2 : 1.5}
                />
                <rect
                  x={toX(i) - innerW / data.length / 2}
                  y={padT}
                  width={innerW / data.length}
                  height={innerH}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIdx(i)}
                  style={{ cursor: "crosshair" }}
                />
              </g>
            );
          })}

          <line
            x1={padL}
            y1={padT + innerH}
            x2={W - padR}
            y2={padT + innerH}
            stroke="#cbd5e1"
            strokeWidth="1"
          />

          {data.map((pt, i) => (
            <text
              key={`xl-${i}`}
              x={toX(i)}
              y={padT + innerH + 18}
              textAnchor="middle"
              fontSize="9"
              fill={hoveredIdx === i ? "#334155" : "#94a3b8"}
              fontFamily="inherit"
              fontWeight={hoveredIdx === i ? "700" : "400"}
            >
              {pt.shortLabel}
            </text>
          ))}
        </svg>

        {showStacked ? (
          <div className="flex items-center gap-5 px-3 pb-3 pt-1">
            {(["instagram", "youtube", "tiktok"] as PlatformKey[]).map(
              (platform) => (
                <div key={platform} className="flex items-center gap-1.5">
                  <div
                    className="h-2 w-4 rounded-sm"
                    style={{ background: STACK_COLORS[platform] }}
                  />
                  <span className="text-[10px] capitalize text-slate-400">
                    {platform}
                  </span>
                </div>
              )
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PlatformMixMonthlyAnalytics({
  monthLabel,
  data,
  total,
  completedCount,
  avgProfiles,
}: {
  monthLabel: string;
  data: {
    platform: PlatformKey;
    count: number;
    percent: number;
    completionRate: number;
    avgProfiles: number;
  }[];
  total: number;
  completedCount: number;
  avgProfiles: number;
}) {
  const [hoveredPlatform, setHoveredPlatform] =
    React.useState<PlatformKey | null>(null);

  const topPlatform = data[0];
  const completionRate = total ? (completedCount / total) * 100 : 0;

  const SVG_SIZE = 240;
  const CX = SVG_SIZE / 2;
  const CY = SVG_SIZE / 2;
  const R_OUT = 92;
  const R_IN = 58;
  const GAP_DEG = 2;

  const polarToXY = (r: number, angleDeg: number) => {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return {
      x: CX + r * Math.cos(rad),
      y: CY + r * Math.sin(rad),
    };
  };

  const makeArc = (startDeg: number, endDeg: number): string => {
    if (endDeg - startDeg >= 359.9) {
      const mid = startDeg + 180;
      const a1o = polarToXY(R_OUT, startDeg);
      const a2o = polarToXY(R_OUT, mid);
      const a1i = polarToXY(R_IN, startDeg);
      const a2i = polarToXY(R_IN, mid);

      return `M${a1o.x},${a1o.y} A${R_OUT},${R_OUT} 0 0 1 ${a2o.x},${a2o.y} A${R_OUT},${R_OUT} 0 0 1 ${a1o.x},${a1o.y} L${a1i.x},${a1i.y} A${R_IN},${R_IN} 0 0 0 ${a2i.x},${a2i.y} A${R_IN},${R_IN} 0 0 0 ${a1i.x},${a1i.y} Z`;
    }

    const large = endDeg - startDeg > 180 ? 1 : 0;
    const s = polarToXY(R_OUT, startDeg);
    const e = polarToXY(R_OUT, endDeg);
    const si = polarToXY(R_IN, endDeg);
    const ei = polarToXY(R_IN, startDeg);

    return `M${s.x.toFixed(2)},${s.y.toFixed(2)} A${R_OUT},${R_OUT} 0 ${large} 1 ${e.x.toFixed(2)},${e.y.toFixed(2)} L${si.x.toFixed(2)},${si.y.toFixed(2)} A${R_IN},${R_IN} 0 ${large} 0 ${ei.x.toFixed(2)},${ei.y.toFixed(2)} Z`;
  };

  const activePlatforms = data.filter((item) => item.count > 0 && total > 0);
  let cumAngle = 0;

  const segments = activePlatforms.map((item) => {
    const angle = (item.count / total) * (360 - activePlatforms.length * GAP_DEG);
    const startAngle = cumAngle;
    const endAngle = cumAngle + angle;
    cumAngle = endAngle + GAP_DEG;

    return {
      ...item,
      startAngle,
      endAngle,
    };
  });

  const activeItem = hoveredPlatform
    ? data.find((item) => item.platform === hoveredPlatform) || null
    : null;

  if (!total) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
          <CalendarDays className="h-5 w-5 text-slate-400" />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-700">
          No signups found for {monthLabel}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Choose another month from the dropdown to view platform analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <div className="rounded-xl border border-slate-100 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Platform Share
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-500">
              {monthLabel}
            </div>
          </div>

          <div className="flex w-full items-center justify-center py-3">
            <div className="mx-auto flex w-full items-center justify-center">
              <svg
                width={SVG_SIZE}
                height={SVG_SIZE}
                viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
                className="h-[240px] w-[240px]"
              >
                <circle
                  cx={CX}
                  cy={CY}
                  r={(R_OUT + R_IN) / 2}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth={R_OUT - R_IN}
                />

                {segments.map((seg) => {
                  const isHovered = hoveredPlatform === seg.platform;
                  const isDimmed = hoveredPlatform !== null && !isHovered;

                  return (
                    <path
                      key={seg.platform}
                      d={makeArc(seg.startAngle, seg.endAngle)}
                      fill={PLATFORM_META[seg.platform].accent}
                      opacity={isDimmed ? 0.25 : 1}
                      style={{
                        cursor: "pointer",
                        transition: "opacity 0.15s, transform 0.15s",
                        transformOrigin: `${CX}px ${CY}px`,
                        transform: isHovered ? "scale(1.04)" : "scale(1)",
                      }}
                      onMouseEnter={() => setHoveredPlatform(seg.platform)}
                      onMouseLeave={() => setHoveredPlatform(null)}
                    />
                  );
                })}

                <text
                  x={CX}
                  y={CY - 10}
                  textAnchor="middle"
                  fontSize="30"
                  fontWeight="800"
                  fill="#0f172a"
                  fontFamily="inherit"
                >
                  {activeItem ? `${activeItem.percent.toFixed(0)}%` : `${total}`}
                </text>

                <text
                  x={CX}
                  y={CY + 16}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#94a3b8"
                  fontFamily="inherit"
                >
                  {activeItem ? `${activeItem.platform} share` : "total signups"}
                </text>

                {activeItem ? (
                  <text
                    x={CX}
                    y={CY + 32}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#94a3b8"
                    fontFamily="inherit"
                  >
                    {activeItem.count} creators
                  </text>
                ) : null}
              </svg>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Total Signups
              </div>
              <div className="mt-1.5 text-2xl font-black text-slate-900">
                {total}
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Top Platform
              </div>

              <div className="mt-1.5 flex items-center gap-2">
                {topPlatform ? (
                  <PlatformIconBadge platform={topPlatform.platform} size="sm" />
                ) : null}

                <div>
                  <div className="text-base font-black capitalize text-slate-900">
                    {topPlatform?.platform || "-"}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {topPlatform ? `${topPlatform.count} creators` : "No data"}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Onboarding Done
              </div>
              <div className="mt-1.5 text-2xl font-black text-slate-900">
                {completionRate.toFixed(0)}%
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                {completedCount} fully onboarded
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Avg Profiles
              </div>
              <div className="mt-1.5 text-2xl font-black text-slate-900">
                {avgProfiles.toFixed(1)}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                social profiles / creator
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white">
            <div className="grid grid-cols-[minmax(0,1.2fr)_90px_120px_110px] gap-3 border-b border-slate-100 px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              <span>Platform</span>
              <span className="text-right">Signups</span>
              <span className="text-right">Share of Month</span>
              <span className="text-right">Onboarding</span>
            </div>

            <div className="divide-y divide-slate-100">
              {data.map((item) => {
                const meta = PLATFORM_META[item.platform];

                return (
                  <div key={item.platform} className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
                          style={{
                            background: meta.accentLight,
                            borderColor: meta.accent + "33",
                          }}
                        >
                          <img
                            src={meta.icon}
                            alt={item.platform}
                            className="h-4 w-4 object-contain"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <span className="truncate text-sm font-semibold capitalize text-slate-800">
                              {item.platform}
                            </span>

                            <div className="grid grid-cols-[90px_120px_110px] items-center gap-3 text-right">
                              <span className="text-sm font-black text-slate-900">
                                {item.count}
                              </span>
                              <span className="text-sm font-semibold text-slate-600">
                                {item.percent.toFixed(0)}% of {total}
                              </span>
                              <span className="text-sm font-semibold text-emerald-600">
                                {item.completionRate.toFixed(0)}%
                              </span>
                            </div>
                          </div>

                          <div className="mt-2 h-2 rounded-full bg-slate-100">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${item.percent}%`,
                                background: meta.accent,
                              }}
                            />
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                            <span>
                              {item.count} creators added in {monthLabel}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: HEADERS.length + 1 }).map((_, i) => (
        <TableCell key={i}>
          <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
        </TableCell>
      ))}
    </TableRow>
  );
}

const AdminInfluencersPage = () => {
  const [allRows, setAllRows] = React.useState<Influencer[]>([]);
  const [apiTotal, setApiTotal] = React.useState<number>(0);
  const [partialData, setPartialData] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [refreshing, setRefreshing] = React.useState<boolean>(false);
  const [page, setPage] = React.useState<number>(1);
  const [limit, setLimit] = React.useState<number>(DEFAULT_LIMIT);
  const [tableSearch, setTableSearch] = React.useState<string>("");
  const [debouncedTableSearch, setDebouncedTableSearch] =
    React.useState<string>("");
  const [tablePlatformFilter, setTablePlatformFilter] =
    React.useState<PlatformFilter>("all");
  const [tableSignupRange, setTableSignupRange] =
    React.useState<SignupRange>("all");
  const [tableOnboardingFilter, setTableOnboardingFilter] =
    React.useState<OnboardingFilter>("all");
  const [graphPlatformFilter, setGraphPlatformFilter] =
    React.useState<PlatformFilter>("all");
  const [platformMixMonth, setPlatformMixMonth] = React.useState<string>("");
  const [platformMixYear, setPlatformMixYear] = React.useState<string>("");
  const [sortBy, setSortBy] = React.useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");

  const [adminRole, setAdminRole] = React.useState<string>("");
  const [createOpen, setCreateOpen] = React.useState<boolean>(false);
  const [createName, setCreateName] = React.useState<string>("");
  const [createEmail, setCreateEmail] = React.useState<string>("");
  const [createPlatform, setCreatePlatform] =
    React.useState<CreateInfluencerPlatform>("youtube");
  const [createUsername, setCreateUsername] = React.useState<string>("");
  const [creatingInfluencer, setCreatingInfluencer] =
    React.useState<boolean>(false);

  React.useEffect(() => {
    const t = window.setTimeout(
      () => setDebouncedTableSearch(tableSearch.trim().toLowerCase()),
      300
    );

    return () => window.clearTimeout(t);
  }, [tableSearch]);

  React.useEffect(() => {
    try {
      const storedAdmin = JSON.parse(localStorage.getItem("admin") || "{}");

      setAdminRole(
        normalizeAdminRoleForCreateAccess(
          storedAdmin?.role ||
            storedAdmin?.adminRole ||
            storedAdmin?.admin?.role ||
            storedAdmin?.admin?.adminRole ||
            storedAdmin?.data?.role ||
            storedAdmin?.data?.adminRole
        )
      );
    } catch {
      setAdminRole("");
    }
  }, []);

  const canCreateInfluencer = React.useMemo(
    () => adminRole === "super_admin",
    [adminRole]
  );

  const fetchAllData = React.useCallback(
    async (showInitialLoader = false, showSuccess = false) => {
      if (showInitialLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const first = await post<GetListResponse>(API_ENDPOINT, {
          page: 1,
          limit: FETCH_LIMIT,
          search: "",
          sortBy: "createdAt",
          sortOrder: "desc",
        });

        let combined = first.influencers || [];
        const totalPagesFromApi =
          first.pages || Math.max(1, Math.ceil((first.total || combined.length) / FETCH_LIMIT));

        const pagesToFetch = Math.min(totalPagesFromApi, MAX_FETCH_PAGES);

        if (pagesToFetch > 1) {
          const rest = await Promise.all(
            Array.from({ length: pagesToFetch - 1 }, (_, i) =>
              post<GetListResponse>(API_ENDPOINT, {
                page: i + 2,
                limit: FETCH_LIMIT,
                search: "",
                sortBy: "createdAt",
                sortOrder: "desc",
              })
            )
          );

          combined = [...combined, ...rest.flatMap((r) => r.influencers || [])];
        }

        const unique = Array.from(new Map(combined.map((i) => [i._id, i])).values());

        setAllRows(unique);
        setApiTotal(first.total || unique.length);
        setPartialData(totalPagesFromApi > MAX_FETCH_PAGES);

        if (showSuccess) {
          showSuccessToast(
            "Influencers refreshed",
            "Influencer data has been refreshed successfully."
          );
        }
      } catch (err) {
        showErrorToast(
          "Influencers loading failed",
          err,
          "Failed to load influencers."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  const resetCreateForm = React.useCallback(() => {
    setCreateName("");
    setCreateEmail("");
    setCreatePlatform("youtube");
    setCreateUsername("");
  }, []);

  const openCreateDialog = React.useCallback(() => {
    if (!canCreateInfluencer) {
      showValidationToast(
        "Permission denied",
        "Only Super Admin can create influencers."
      );
      return;
    }

    resetCreateForm();
    setCreateOpen(true);
  }, [canCreateInfluencer, resetCreateForm]);

  const closeCreateDialog = React.useCallback(() => {
    if (creatingInfluencer) return;

    setCreateOpen(false);
    resetCreateForm();
  }, [creatingInfluencer, resetCreateForm]);

  const handleCreateInfluencer = React.useCallback(async () => {
    const name = createName.trim();
    const email = createEmail.trim().toLowerCase();
    const platform = createPlatform;
    const username = createUsername.trim().replace(/^@+/, "");

    if (!canCreateInfluencer) {
      showValidationToast(
        "Permission denied",
        "Only Super Admin can create influencers."
      );
      return;
    }

    if (!name) {
      showValidationToast("Name required", "Influencer name is required.");
      return;
    }

    if (!email) {
      showValidationToast("Email required", "Influencer email is required.");
      return;
    }

    if (!isValidEmail(email)) {
      showValidationToast(
        "Invalid email",
        "Please enter a valid influencer email address."
      );
      return;
    }

    if (!platform) {
      showValidationToast("Platform required", "Platform is required.");
      return;
    }

    if (!username) {
      showValidationToast("Username required", "Username is required.");
      return;
    }

    try {
      setCreatingInfluencer(true);

      const response = await post<CreateInfluencerResponse>(
        CREATE_INFLUENCER_ENDPOINT,
        {
          name,
          email,
          platform,
          username,
        }
      );

      setCreateOpen(false);
      resetCreateForm();

      showSuccessToast(
        "Influencer created",
        response?.message || "Influencer has been created successfully."
      );

      await fetchAllData(false, false);
    } catch (err) {
      showErrorToast(
        "Create influencer failed",
        err,
        "Failed to create influencer."
      );
    } finally {
      setCreatingInfluencer(false);
    }
  }, [
    canCreateInfluencer,
    createName,
    createEmail,
    createPlatform,
    createUsername,
    fetchAllData,
    resetCreateForm,
  ]);

  React.useEffect(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  const toggleSort = (field: SortField, sortable?: boolean) => {
    if (!sortable || !ALLOWED_SORT.has(field)) return;

    if (sortBy === field) {
      setSortOrder((p) => (p === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder(field === "createdAt" || field === "updatedAt" ? "desc" : "asc");
    }

    setPage(1);
  };

  const analyticsRows = React.useMemo(() => allRows, [allRows]);

  const graphRows = React.useMemo(
    () => getRowsByPlatform(analyticsRows, graphPlatformFilter),
    [analyticsRows, graphPlatformFilter]
  );

  const platformMixYearOptions = React.useMemo(
    () => buildYearOptions(analyticsRows),
    [analyticsRows]
  );

  const platformMixMonthOptions = React.useMemo(() => MONTH_OPTIONS, []);

  React.useEffect(() => {
    if (!platformMixYearOptions.length) {
      if (platformMixYear) setPlatformMixYear("");
      if (platformMixMonth) setPlatformMixMonth("");
      return;
    }

    const hasCurrentYear = platformMixYearOptions.some(
      (option) => option.value === platformMixYear
    );

    if (!platformMixYear || !hasCurrentYear) {
      setPlatformMixYear(platformMixYearOptions[0].value);
    }
  }, [platformMixYearOptions, platformMixYear, platformMixMonth]);

  React.useEffect(() => {
    if (!platformMixYear) {
      if (platformMixMonth) setPlatformMixMonth("");
      return;
    }

    if (!platformMixMonth) {
      setPlatformMixMonth(
        getLatestAvailableMonthValue(analyticsRows, platformMixYear) ||
          MONTH_OPTIONS[0].value
      );
    }
  }, [analyticsRows, platformMixYear, platformMixMonth]);

  const filteredRows = React.useMemo(() => {
    const rows = allRows.filter((inf) => {
      const createdDate = safeDate(inf.createdAt);
      const searchable = `${getSearchableText(inf)} ${
        getCreatedByInfo(inf).label
      } ${getCreatedByInfo(inf).subLabel} ${
        getInfluencerCurrentStatus(inf).label
      }`.toLowerCase();

      const pp = getPrimaryPlatform(inf);
      const ms = !debouncedTableSearch || searchable.includes(debouncedTableSearch);
      const mp = tablePlatformFilter === "all" || pp === tablePlatformFilter;
      const mo =
        tableOnboardingFilter === "all"
          ? true
          : tableOnboardingFilter === "completed"
            ? isFullyOnboarded(inf)
            : !isFullyOnboarded(inf);
      const md = matchesSignupRange(createdDate, tableSignupRange);

      return ms && mp && mo && md;
    });

    rows.sort((a, b) => {
      const av = getSortValue(a, sortBy);
      const bv = getSortValue(b, sortBy);

      const result =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv), undefined, {
              numeric: true,
              sensitivity: "base",
            });

      return sortOrder === "asc" ? result : -result;
    });

    return rows;
  }, [
    allRows,
    debouncedTableSearch,
    tableOnboardingFilter,
    tablePlatformFilter,
    tableSignupRange,
    sortBy,
    sortOrder,
  ]);

  const totalFiltered = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / limit));

  React.useEffect(() => {
    setPage(1);
  }, [
    debouncedTableSearch,
    tablePlatformFilter,
    tableSignupRange,
    tableOnboardingFilter,
    limit,
  ]);

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const rows = React.useMemo(() => {
    const start = (page - 1) * limit;
    return filteredRows.slice(start, start + limit);
  }, [filteredRows, page, limit]);

  const showingFrom = rows.length ? (page - 1) * limit + 1 : 0;
  const showingTo = Math.min(page * limit, totalFiltered);

  const currentMonthSignups = React.useMemo(
    () => analyticsRows.filter((i) => isCurrentMonth(safeDate(i.createdAt))).length,
    [analyticsRows]
  );

  const previousMonthSignups = React.useMemo(
    () => analyticsRows.filter((i) => isPreviousMonth(safeDate(i.createdAt))).length,
    [analyticsRows]
  );

  const completedCount = React.useMemo(
    () => analyticsRows.filter((i) => isFullyOnboarded(i)).length,
    [analyticsRows]
  );

  const totalSocialProfiles = React.useMemo(
    () => analyticsRows.reduce((s, i) => s + getSocialProfileCount(i), 0),
    [analyticsRows]
  );

  const growthRate = calculateGrowthRate(currentMonthSignups, previousMonthSignups);
  const completionRate = analyticsRows.length
    ? (completedCount / analyticsRows.length) * 100
    : 0;
  const avgProfilesPerInfluencer = analyticsRows.length
    ? totalSocialProfiles / analyticsRows.length
    : 0;

  const signupTrend = React.useMemo(
    () => buildMonthlyTrendDetailed(graphRows, 6),
    [graphRows]
  );

  const selectedPlatformMixRows = React.useMemo(() => {
    if (!platformMixMonth || !platformMixYear) return [];

    const month = Number(platformMixMonth);
    const year = Number(platformMixYear);

    return analyticsRows.filter((row) => {
      const createdAt = safeDate(row.createdAt);
      if (!createdAt) return false;

      return createdAt.getFullYear() === year && createdAt.getMonth() + 1 === month;
    });
  }, [analyticsRows, platformMixMonth, platformMixYear]);

  const platformMixStats = React.useMemo(() => {
    return (Object.keys(PLATFORM_META) as PlatformKey[])
      .map((platform) => {
        const pRows = selectedPlatformMixRows.filter(
          (row) => getPrimaryPlatform(row) === platform
        );

        const count = pRows.length;
        const completed = pRows.filter((row) => isFullyOnboarded(row)).length;
        const totalProfiles = pRows.reduce(
          (sum, row) => sum + getSocialProfileCount(row),
          0
        );

        return {
          platform,
          count,
          percent: selectedPlatformMixRows.length
            ? (count / selectedPlatformMixRows.length) * 100
            : 0,
          completionRate: count ? (completed / count) * 100 : 0,
          avgProfiles: count ? totalProfiles / count : 0,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [selectedPlatformMixRows]);

  const selectedPlatformMixCompletedCount = React.useMemo(
    () => selectedPlatformMixRows.filter((row) => isFullyOnboarded(row)).length,
    [selectedPlatformMixRows]
  );

  const selectedPlatformMixProfiles = React.useMemo(
    () =>
      selectedPlatformMixRows.reduce(
        (sum, row) => sum + getSocialProfileCount(row),
        0
      ),
    [selectedPlatformMixRows]
  );

  const selectedPlatformMixAvgProfiles = selectedPlatformMixRows.length
    ? selectedPlatformMixProfiles / selectedPlatformMixRows.length
    : 0;

  const selectedPlatformMixLabel = formatMonthYearLabel(
    platformMixMonth,
    platformMixYear
  );

  const resetFilters = React.useCallback(() => {
    setTableSearch("");
    setTablePlatformFilter("all");
    setTableSignupRange("all");
    setTableOnboardingFilter("all");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);

    showSuccessToast("Filters reset", "Influencer table filters have been cleared.");
  }, []);

  return (
    <>
      <ToastStyles />

      <TooltipProvider>
        <div className="min-h-screen p-4 md:p-6">
          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5">
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="mt-2 text-[36px] font-black tracking-tight text-slate-900">
                  Admin Influencer Management
                </h1>
                <p className="mt-0.5 text-sm text-slate-400">
                  Signups, platform mix, onboarding progress, and creator records.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(Object.keys(PLATFORM_META) as PlatformKey[]).map((p) => (
                  <PlatformIconBadge key={p} platform={p} size="sm" />
                ))}

                <div className="mx-2 h-5 w-px bg-slate-200" />

                {canCreateInfluencer ? (
                  <Button
                    size="sm"
                    onClick={openCreateDialog}
                    className="h-9 rounded-lg bg-slate-900 text-sm font-medium text-white hover:bg-slate-800"
                    title="Create influencer"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Create Influencer
                  </Button>
                ) : null}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchAllData(false, true)}
                  disabled={refreshing}
                  className="h-9 rounded-lg border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <HiOutlineRefresh
                    className={cn("mr-1.5 h-3.5 w-3.5", refreshing && "animate-spin")}
                  />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-3">
              <MetricCard
                title="Total Influencers"
                tooltip="Overall influencer records."
                value={formatCompactNumber(analyticsRows.length)}
                icon={Users}
                accentColor="#0f172a"
                hint={`${formatSignedPercent(growthRate)} this month`}
                trend={growthRate > 0 ? "up" : growthRate < 0 ? "down" : "neutral"}
              />

              <MetricCard
                title="Pending Signup"
                tooltip="Admin-created influencers who still need to complete signup."
                value={formatCompactNumber(
                  analyticsRows.filter(
                    (item) =>
                      item.isAdminCreated === true && item.signupCompleted === false
                  ).length
                )}
                icon={Clock3}
                accentColor="#f59e0b"
                hint="Admin-created"
              />

              <MetricCard
                title="Active"
                tooltip="Influencers whose signup is completed."
                value={formatCompactNumber(
                  analyticsRows.filter(
                    (item) =>
                      !(item.isAdminCreated === true && item.signupCompleted === false)
                  ).length
                )}
                icon={BadgeCheck}
                accentColor="#10b981"
                hint={`${completionRate.toFixed(0)}% onboarding complete`}
              />
            </div>

            <div className="grid gap-5">
              <SectionShell
                title={<span className="text-xl font-semibold">Platform Mix</span>}
                description="Month-wise platform analytics with separate month and year dropdowns"
                right={
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <FilterField
                      label="Month"
                      value={platformMixMonth}
                      onChange={setPlatformMixMonth}
                      options={platformMixMonthOptions}
                    />
                    <FilterField
                      label="Year"
                      value={platformMixYear}
                      onChange={setPlatformMixYear}
                      options={
                        platformMixYearOptions.length
                          ? platformMixYearOptions
                          : [{ label: "No years", value: "" }]
                      }
                    />
                  </div>
                }
              >
                <PlatformMixMonthlyAnalytics
                  monthLabel={selectedPlatformMixLabel}
                  data={platformMixStats}
                  total={selectedPlatformMixRows.length}
                  completedCount={selectedPlatformMixCompletedCount}
                  avgProfiles={selectedPlatformMixAvgProfiles}
                />
              </SectionShell>
            </div>

            <SectionShell
              title={<span className="text-lg font-semibold">Filters</span>}
              description="Affects the influencer table below only"
            >
              <div className="flex flex-col gap-1.5 xl:flex-row xl:items-end xl:justify-between">
                <div className="grid flex-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
                  <div className="xl:col-span-2">
                    <label className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Search
                      </span>

                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <Input
                          placeholder="Search by name, email, creator, status, platform..."
                          value={tableSearch}
                          onChange={(e) => setTableSearch(e.target.value)}
                          className="h-8 rounded-lg border-slate-200 bg-white pl-9 text-sm shadow-none focus-visible:ring-0"
                        />
                      </div>
                    </label>
                  </div>

                  <FilterField
                    label="Platform"
                    value={tablePlatformFilter}
                    onChange={(v) => setTablePlatformFilter(v as PlatformFilter)}
                    options={[
                      { label: "All Platforms", value: "all" },
                      { label: "Instagram", value: "instagram" },
                      { label: "YouTube", value: "youtube" },
                      { label: "TikTok", value: "tiktok" },
                    ]}
                  />

                  <FilterField
                    label="Signup Window"
                    value={tableSignupRange}
                    onChange={(v) => setTableSignupRange(v as SignupRange)}
                    options={[
                      { label: "All Time", value: "all" },
                      { label: "This Month", value: "thisMonth" },
                      { label: "Last 30 Days", value: "last30" },
                      { label: "Last 90 Days", value: "last90" },
                    ]}
                  />
                </div>

                <div className="flex items-end gap-2">
                  <FilterField
                    label="Onboarding"
                    value={tableOnboardingFilter}
                    onChange={(v) => setTableOnboardingFilter(v as OnboardingFilter)}
                    options={[
                      { label: "All Status", value: "all" },
                      { label: "Completed", value: "completed" },
                      { label: "In Progress", value: "inProgress" },
                    ]}
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0 rounded-lg !border-slate-200 px-3 !text-slate-500 hover:!bg-[#EDEDED] hover:!text-slate-500 hover:!border-slate-200 focus-visible:!ring-0"
                    onClick={resetFilters}
                  >
                    Reset
                  </Button>
                </div>
              </div>

              {partialData ? (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-700">
                  Large dataset — analytics based on the first{" "}
                  {MAX_FETCH_PAGES * FETCH_LIMIT} records.
                </div>
              ) : null}
            </SectionShell>

            <Card className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    Influencer Directory
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Searchable creator records with admin actions
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      {HEADERS.map(({ key, label, sortable, align = "left" }) => (
                        <TableHead
                          key={String(key)}
                          onClick={() =>
                            ALLOWED_SORT.has(key as SortField)
                              ? toggleSort(key as SortField, sortable)
                              : undefined
                          }
                          className={cn(
                            "py-3.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400",
                            sortable && ALLOWED_SORT.has(key as SortField)
                              ? "cursor-pointer select-none hover:text-slate-600"
                              : "",
                            align === "center"
                              ? "text-center"
                              : align === "right"
                                ? "text-right"
                                : "text-left"
                          )}
                        >
                          <div
                            className={cn(
                              "flex items-center gap-1",
                              align === "center"
                                ? "justify-center"
                                : align === "right"
                                  ? "justify-end"
                                  : "justify-start"
                            )}
                          >
                            {label}
                            {sortBy === key && sortable ? (
                              sortOrder === "asc" ? (
                                <HiChevronUp className="h-3.5 w-3.5 text-slate-600" />
                              ) : (
                                <HiChevronDown className="h-3.5 w-3.5 text-slate-600" />
                              )
                            ) : null}
                          </div>
                        </TableHead>
                      ))}

                      <TableHead className="py-3.5 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {loading ? (
                      Array.from({ length: Math.min(limit, 8) }).map((_, idx) => (
                        <SkeletonRow key={idx} />
                      ))
                    ) : rows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={HEADERS.length + 1}
                          className="py-16 text-center"
                        >
                          <div className="mx-auto flex max-w-xs flex-col items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                              <Users className="h-5 w-5 text-slate-400" />
                            </div>
                            <p className="text-sm font-semibold text-slate-700">
                              No influencers found
                            </p>
                            <p className="text-xs text-slate-400">
                              Try adjusting your filters above.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((inf) => {
                        const socialProfileCount = getSocialProfileCount(inf);
                        const completedPages = getCompletedPages(inf);
                        const profilePicture = inf.socialProfiles?.find(
                          (p) => p.picture
                        )?.picture;
                        const createdDate = safeDate(inf.createdAt);

                        return (
                          <TableRow
                            key={inf._id}
                            className={cn(
                              "border-slate-100 transition-colors hover:bg-slate-50/80",
                              isFullyOnboarded(inf) &&
                                "bg-emerald-50/20 hover:bg-emerald-50/40"
                            )}
                          >
                            <TableCell className="py-3.5">
                              <div className="flex min-w-[240px] items-center gap-3">
                                {profilePicture ? (
                                  <img
                                    src={profilePicture}
                                    alt={inf.name || "Influencer"}
                                    className="h-9 w-9 rounded-lg border border-slate-200 bg-slate-100 object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                      const next = e.currentTarget
                                        .nextElementSibling as HTMLElement | null;
                                      if (next) next.style.display = "flex";
                                    }}
                                  />
                                ) : null}

                                <div
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-600"
                                  style={{ display: profilePicture ? "none" : "flex" }}
                                >
                                  {getInitials(inf.name)}
                                </div>

                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold text-slate-900">
                                    {inf.name || "—"}
                                  </div>
                                  <div className="mt-0.5 truncate text-xs text-slate-400">
                                    {getPrimaryUsername(inf) ||
                                      inf.proxyEmail ||
                                      "Creator profile"}
                                  </div>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="py-3.5">
                              <div className="min-w-[220px]">
                                <div className="truncate text-sm text-slate-700">
                                  {inf.email || "—"}
                                </div>
                                <div className="mt-0.5 truncate text-xs text-slate-400" />
                              </div>
                            </TableCell>

                            <TableCell className="py-3.5 text-center">
                              <div className="flex flex-col items-center gap-1.5">
                                <PlatformIcons influencer={inf} />
                                <span className="text-xs text-slate-400">
                                  {socialProfileCount} profile
                                  {socialProfileCount === 1 ? "" : "s"}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="py-3.5 text-center">
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="text-sm font-medium text-slate-700">
                                  {formatDate(inf.createdAt)}
                                </span>
                                <span
                                  className={cn(
                                    "text-xs",
                                    createdDate && isCurrentMonth(createdDate)
                                      ? "font-medium text-emerald-500"
                                      : "text-slate-400"
                                  )}
                                >
                                  {createdDate && isCurrentMonth(createdDate)
                                    ? "This month"
                                    : "Earlier"}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="py-3.5 text-center">
                              {(() => {
                                const createdBy = getCreatedByInfo(inf);

                                return (
                                  <div className="flex flex-col items-center gap-1">
                                    <span
                                      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${createdBy.className}`}
                                    >
                                      {createdBy.badge}
                                    </span>
                                    <span className="max-w-[150px] truncate text-xs font-semibold text-slate-600">
                                      {createdBy.label}
                                    </span>
                                    <span className="text-[10px] font-medium text-slate-400">
                                      {createdBy.subLabel}
                                    </span>
                                  </div>
                                );
                              })()}
                            </TableCell>

                            <TableCell className="py-3.5 text-center">
                              {(() => {
                                const currentStatus = getInfluencerCurrentStatus(inf);

                                return (
                                  <div className="flex flex-col items-center gap-1">
                                    <span
                                      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${currentStatus.className}`}
                                    >
                                      {currentStatus.label}
                                    </span>
                                    <span className="text-[10px] font-medium text-slate-400">
                                      {currentStatus.subLabel}
                                    </span>
                                  </div>
                                );
                              })()}
                            </TableCell>

                            <TableCell className="py-3.5 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <OnboardingBadge influencer={inf} />
                                <span className="text-xs text-slate-400">
                                  {completedPages}/3 steps
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="py-3.5 text-center">
                              <div className="flex items-center justify-center gap-0.5">
                                <Link
                                  href={`/admin/influencers/view?influencerId=${inf._id}`}
                                >
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-25 rounded-lg text-black hover:bg-slate-100 hover:text-slate-700"
                                  >
                                    View Details
                                  </Button>
                                </Link>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {!loading && rows.length > 0 ? (
                <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-3.5 lg:flex-row lg:items-center lg:justify-between">
                  <span className="text-xs text-slate-400">
                    Showing{" "}
                    <span className="font-semibold text-slate-700">
                      {showingFrom}
                    </span>
                    /
                    <span className="font-semibold text-slate-700">
                      {showingTo}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-700">
                      {totalFiltered}
                    </span>
                  </span>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Rows</span>
                      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                        {ROW_OPTIONS.map((n) => (
                          <Button
                            key={n}
                            size="sm"
                            variant={limit === n ? "default" : "ghost"}
                            className={cn(
                              "h-7 rounded-md px-2.5 text-xs font-semibold",
                              limit === n
                                ? "bg-slate-900 text-white hover:bg-slate-800"
                                : "text-slate-500 hover:bg-white"
                            )}
                            onClick={() => {
                              setLimit(n);
                              setPage(1);
                            }}
                          >
                            {n}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="h-8 w-8 rounded-lg border-slate-200"
                      >
                        <HiChevronLeft className="h-4 w-4" />
                      </Button>

                      <span className="min-w-[90px] text-center text-xs font-semibold text-slate-600">
                        Page {page} / {totalPages}
                      </span>

                      <Button
                        variant="outline"
                        size="icon"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="h-8 w-8 rounded-lg border-slate-200"
                      >
                        <HiChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </Card>
          </div>

          {createOpen ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
              <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-950">
                      Create Influencer
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={closeCreateDialog}
                    disabled={creatingInfluencer}
                    className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Influencer Name
                    </label>
                    <Input
                      value={createName}
                      onChange={(event) => setCreateName(event.target.value)}
                      placeholder="Enter influencer name"
                      className="mt-2 h-11 rounded-2xl border-slate-200 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Email
                    </label>
                    <Input
                      value={createEmail}
                      onChange={(event) => setCreateEmail(event.target.value)}
                      placeholder="creator@example.com"
                      className="mt-2 h-11 rounded-2xl border-slate-200 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Platform
                    </label>
                    <select
                      value={createPlatform}
                      onChange={(event) =>
                        setCreatePlatform(
                          event.target.value as CreateInfluencerPlatform
                        )
                      }
                      className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-400"
                    >
                      <option value="youtube">YouTube</option>
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Username
                    </label>
                    <Input
                      value={createUsername}
                      onChange={(event) => setCreateUsername(event.target.value)}
                      placeholder="username without @"
                      className="mt-2 h-11 rounded-2xl border-slate-200 bg-slate-50"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-2xl"
                      onClick={closeCreateDialog}
                      disabled={creatingInfluencer}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="button"
                      className="rounded-2xl"
                      onClick={handleCreateInfluencer}
                      disabled={creatingInfluencer}
                    >
                      {creatingInfluencer ? "Creating..." : "Create Influencer"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </TooltipProvider>
    </>
  );
};

export default AdminInfluencersPage;