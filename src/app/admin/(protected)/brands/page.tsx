"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NextPage } from "next";
import Link from "next/link";
import { Outfit } from "next/font/google";
import {
  Search,
  Mail,
  RefreshCw,
  ShieldCheck,
  XCircle,
  Plus,
  Pencil,
  Image as ImageIcon,
  UserCheck,
  SlidersHorizontal,
} from "lucide-react";

import { adminGet, adminPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast, ToastStyles } from "@/components/ui/toast";
import AdminTable, { type AdminTableColumn } from "../../components/table";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

type BrandStatus = "active" | "expired" | "archived";
type BillingCycle = "monthly" | "annual";
type AssignRole = "RH" | "BME";
type BrandAssignmentScope = "all" | "my_assigned";
type BrandSignupFilter = "all" | "fully_signedup" | "not_signedup";
type BrandPlanFilter = "all" | "fully_managed" | "standard";

type SortField =
  | "name"
  | "email"
  | "planName"
  | "createdAt"
  | "expiresAt";

interface ApiFeature {
  key: string;
  limit: number;
  used: number;
  value: string | number | boolean | string[] | null;
  note: string | null;
  resetsEvery?: string | null;
  resetsAt?: string | null;
}

interface ApiSubscription {
  planId?: string;
  planName?: string;
  role?: string;
  status?: "active" | "archived";
  monthlyCost?: number;
  annualCost?: number;
  billingCycle?: BillingCycle;
  autoRenew?: boolean;
  expiresAt?: string;
  startedAt?: string;
  features?: ApiFeature[];
  internalCredits?: { used: number; resetsAt: string | null };
}

interface ApiBrand {
  _id: string;
  brandId?: string;
  name?: string;
  brandName?: string;
  email: string;
  companySize?: string;
  industry?: string;
  createdAt: string;
  updatedAt?: string;
  profilePic?: string;
  proxyEmail?: string;
  subscription?: ApiSubscription;
  subscriptionExpired?: boolean;
  planName?: string;
  expiresAt?: string | null;

  isAdminCreated?: boolean;
  signupCompleted?: boolean;
  createdByAdmin?: string | null;
  adminCreatedRole?: string;
  adminCreatedAt?: string | null;
  signupCompletedAt?: string | null;
  createdByAdminName?: string;
  createdByAdminEmail?: string;
  createdByLabel?: string;
  createdBySource?: "admin" | "brand";
  currentStatus?: "pending_signup" | "active";
  currentStatusLabel?: string;
  currentStatusSubLabel?: string;

  assignedRm?: string;
  assignedBm?: string;
  assignedRh?: string;
  assignedBme?: string;

  RHId?: string;
  bdmId?: string;
}

interface EmployeeParentAdmin {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface Employee {
  _id: string;
  name: string;
  email: string;
  role?: string;
  status?: string;
  teamType?: string;
  parentAdmin?: string | EmployeeParentAdmin | null;
  parentAdminId?: string;
  revenueHeadName?: string;
}

interface BrandListResponse {
  success?: boolean;
  message?: string;
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  brands?: ApiBrand[];
  data?: ApiBrand[];
}

interface EmployeeListResponse {
  success: boolean;
  message?: string;
  data: Employee[];
}

interface CreateBrandResponse {
  success: boolean;
  message: string;
  brand?: ApiBrand;
}

interface BrandRow {
  _id: string;
  brandId: string;
  name: string;
  contactName: string;
  email: string;
  proxyEmail: string;
  createdAt: string;
  updatedAt: string;
  planName: string;
  billingCycle: BillingCycle;
  amountPaid: number;
  startedAt: string;
  expiresAt: string;
  autoRenew: boolean;
  status: BrandStatus;
  companySize: string;
  industry: string;
  profilePic: string;
  features: ApiFeature[];
  internalCredits: { used: number; resetsAt: string | null };

  isAdminCreated: boolean;
  signupCompleted: boolean;
  createdByAdmin: string | null;
  adminCreatedRole: string;
  adminCreatedAt: string;
  signupCompletedAt: string;
  createdByAdminName: string;
  createdByAdminEmail: string;
  createdByLabel: string;
  createdBySource: "admin" | "brand";
  currentStatus: "pending_signup" | "active";
  currentStatusLabel: string;
  currentStatusSubLabel: string;

  assignedRh: string;
  assignedBme: string;

  RHId: string;
  bdmId: string;
}

interface StoredAdmin {
  _id?: string;
  adminId?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  access?: any[];
  permissions?: any[];
}

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_ROW_OPTIONS = [10, 20, 50, 100] as const;
const BRAND_FETCH_PAGE_SIZE = 100;

const tableButtonBaseClass =
  "h-9 rounded-[10px] border px-3 text-sm font-medium shadow-sm transition focus-visible:!ring-0 focus-visible:!ring-offset-0";

const manageButtonClass =
  "border-black bg-black text-white hover:!bg-black/90 hover:!text-white";

const disabledButtonClass =
  "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 hover:!bg-slate-100 hover:!text-slate-400";

const FEATURE_LABELS: Record<string, string> = {
  influencer_search_per_month: "Influencer Search",
  influencer_profile_views_per_month: "Profile Views",
  invites_per_month: "Invites",
  active_campaigns: "Active Campaigns",
  platforms_supported: "Platforms",
  direct_email_messaging_efs: "Direct Email",
  milestones_and_payouts: "Milestones & Payouts",
  message_templates: "Templates",
  advanced_filters: "Advanced Filters",
  dispute_assistance: "Dispute Assistance",
  support: "Support",
  creator_sourcing_and_outreach: "Creator Sourcing",
  shortlist_delivered: "Shortlists",
  negotiation_and_followups: "Negotiation",
};

function readErrorValue(value: any): string {
  if (!value) return "";

  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    return value
      .map((item) => readErrorValue(item))
      .filter(Boolean)
      .join(" ");
  }

  if (typeof value === "object") {
    const directMessage =
      value.message ||
      value.error ||
      value.detail ||
      value.msg ||
      value.description;

    if (directMessage && directMessage !== value) {
      return readErrorValue(directMessage);
    }

    return Object.values(value)
      .map((item) => readErrorValue(item))
      .filter(Boolean)
      .join(" ");
  }

  return String(value);
}

function getErrorMessage(error: any, fallback = "Something went wrong. Please try again.") {
  const responseData =
    error?.response?.data ||
    error?.data ||
    error?.payload ||
    error?.body ||
    error;

  return (
    readErrorValue(responseData?.message) ||
    readErrorValue(responseData?.error) ||
    readErrorValue(responseData?.errors) ||
    readErrorValue(responseData) ||
    readErrorValue(error?.message) ||
    fallback
  );
}

function showErrorToast(title: string, message: string) {
  toast({
    icon: "error",
    title,
    text: message,
    timer: 3500,
  });
}

function useDebouncedValue<T>(value: T, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
}

function normalizeRole(value?: string) {
  return String(value || "").trim().toLowerCase();
}

function getStoredAdminId(admin: StoredAdmin) {
  return String(admin?._id || admin?.adminId || admin?.id || "").trim();
}

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(value: number) {
  if (!value) return "FREE";
  return `${value.toLocaleString()}`;
}

function formatPlanLabel(value?: string) {
  const label = String(value || "—").trim();
  return label === "—" ? label : label.replace(/_/g, " ").toUpperCase();
}

function normalizePlanName(value?: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function isFullyManagedBrand(brand: Pick<BrandRow, "planName">) {
  return normalizePlanName(brand.planName) === "fully_managed";
}

function isStandardBrand(brand: Pick<BrandRow, "planName">) {
  return !isFullyManagedBrand(brand);
}

function isNotSignedUpBrand(
  brand: Pick<BrandRow, "currentStatus" | "signupCompleted">
) {
  return brand.currentStatus === "pending_signup" || brand.signupCompleted === false;
}

function isFullySignedUpBrand(
  brand: Pick<BrandRow, "currentStatus" | "signupCompleted">
) {
  return !isNotSignedUpBrand(brand);
}

function isDateInCurrentMonth(value?: string) {
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function isSignedUpThisMonth(brand: BrandRow) {
  if (!isFullySignedUpBrand(brand)) return false;

  return isDateInCurrentMonth(brand.signupCompletedAt || brand.createdAt);
}

function formatRoleLabel(role?: string) {
  const normalized = normalizeRole(role);

  if (normalized === "super_admin") return "Super Admin";
  if (normalized === "revenue_head") return "RH";
  if (normalized === "bme") return "BME";
  if (normalized === "ime") return "IME";
  if (normalized === "sdr") return "SDR";

  return normalized ? normalized.replace(/_/g, " ").toUpperCase() : "Admin";
}

function canManageCampaigns(brand: BrandRow) {
  const normalizedPlan = normalizePlanName(brand.planName);

  return normalizedPlan === "fully_paid" || normalizedPlan === "fully_managed";
}

function getStatusFromApi(brand: ApiBrand): BrandStatus {
  if (brand.subscription?.status === "archived") return "archived";
  if (brand.subscriptionExpired) return "expired";
  return "active";
}

function getCreatedByInfo(brand: BrandRow) {
  if (brand.createdBySource === "admin" || brand.isAdminCreated) {
    return {
      label:
        brand.createdByLabel ||
        brand.createdByAdminName ||
        brand.createdByAdminEmail ||
        "Admin",
      subLabel: formatRoleLabel(brand.adminCreatedRole),
      badge: "Admin",
      className: "border-indigo-200 bg-indigo-50 text-indigo-700",
    };
  }

  return {
    label: "Brand",
    subLabel: "Self signup",
    badge: "Brand",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

function getBrandCurrentStatus(brand: BrandRow) {
  if (
    brand.currentStatus === "pending_signup" ||
    (brand.isAdminCreated && !brand.signupCompleted)
  ) {
    return {
      label: brand.currentStatusLabel || "Pending Signup",
      subLabel: brand.currentStatusSubLabel || "Admin-created placeholder",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: brand.currentStatusLabel || "Active",
    subLabel: brand.currentStatusSubLabel || "Signup completed",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

function mapBrand(brand: ApiBrand): BrandRow {
  const subscription = brand.subscription ?? {};
  const billingCycle = subscription.billingCycle ?? "monthly";

  const amountPaid =
    billingCycle === "annual"
      ? subscription.annualCost ?? 0
      : subscription.monthlyCost ?? 0;

  return {
    _id: brand._id,
    brandId: brand.brandId || brand._id,
    name: brand.brandName || brand.name || "—",
    contactName: brand.name || brand.brandName || "—",
    email: brand.email,
    proxyEmail: brand.proxyEmail || "",
    createdAt: brand.createdAt,
    updatedAt: brand.updatedAt || brand.createdAt,
    planName: subscription.planName || brand.planName || "—",
    billingCycle,
    amountPaid,
    startedAt: subscription.startedAt || brand.createdAt,
    expiresAt: subscription.expiresAt || brand.expiresAt || "",
    autoRenew: subscription.autoRenew ?? false,
    status: getStatusFromApi(brand),
    companySize: brand.companySize || "—",
    industry: brand.industry || "—",
    profilePic: brand.profilePic || "",
    features: subscription.features ?? [],
    internalCredits: subscription.internalCredits ?? {
      used: 0,
      resetsAt: null,
    },

    isAdminCreated: brand.isAdminCreated === true,
    signupCompleted: brand.signupCompleted !== false,
    createdByAdmin: brand.createdByAdmin || null,
    adminCreatedRole: brand.adminCreatedRole || "",
    adminCreatedAt: brand.adminCreatedAt || "",
    signupCompletedAt: brand.signupCompletedAt || "",
    createdByAdminName: brand.createdByAdminName || "",
    createdByAdminEmail: brand.createdByAdminEmail || "",
    createdByLabel:
      brand.createdByLabel ||
      brand.createdByAdminName ||
      brand.createdByAdminEmail ||
      (brand.isAdminCreated ? "Admin" : "Brand"),
    createdBySource:
      brand.createdBySource || (brand.isAdminCreated ? "admin" : "brand"),
    currentStatus:
      brand.currentStatus ||
      (brand.isAdminCreated === true && brand.signupCompleted === false
        ? "pending_signup"
        : "active"),
    currentStatusLabel:
      brand.currentStatusLabel ||
      (brand.isAdminCreated === true && brand.signupCompleted === false
        ? "Pending Signup"
        : "Active"),
    currentStatusSubLabel:
      brand.currentStatusSubLabel ||
      (brand.isAdminCreated === true && brand.signupCompleted === false
        ? "Admin-created placeholder"
        : "Signup completed"),

    assignedRh: brand.assignedRh || brand.assignedRm || "",
    assignedBme: brand.assignedBme || brand.assignedBm || "",

    RHId: brand.RHId || "",
    bdmId: brand.bdmId || "",
  };
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "B"
  );
}

function roleMeta(role: AssignRole) {
  switch (role) {
    case "RH":
      return {
        label: "RH",
        payloadKey: "RHId",
        emptyLabel: "Assign RH",
        changeLabel: "Change RH",
      };

    case "BME":
      return {
        label: "BME",
        payloadKey: "bdmId",
        emptyLabel: "Assign BME",
        changeLabel: "Change BME",
      };

    default:
      return {
        label: "RH",
        payloadKey: "RHId",
        emptyLabel: "Assign RH",
        changeLabel: "Change RH",
      };
  }
}

function isDataUrlImage(value?: string) {
  return !!value && /^data:image\//i.test(value);
}

function getEmployeeParentAdminId(employee: Employee) {
  if (employee.parentAdminId) {
    return String(employee.parentAdminId);
  }

  const parent = employee.parentAdmin;

  if (!parent) return "";

  if (typeof parent === "string") {
    return parent;
  }

  return String(parent._id || "");
}

function groupEmployeesByParent(employees: Employee[]) {
  return employees.reduce<Record<string, Employee[]>>((acc, employee) => {
    const key = getEmployeeParentAdminId(employee);

    if (!key) return acc;
    if (!acc[key]) acc[key] = [];

    acc[key].push(employee);
    return acc;
  }, {});
}

function buildEmployeeNameMap(employees: Employee[]) {
  return employees.reduce<Record<string, string>>((acc, employee) => {
    acc[employee._id] = employee.name;
    return acc;
  }, {});
}

function isCurrentRhBrand(brand: BrandRow, adminId: string) {
  return Boolean(adminId && brand.RHId && String(brand.RHId) === adminId);
}

const BrandAvatar = React.memo(function BrandAvatar({
  name,
  profilePic,
  size = "md",
}: {
  name: string;
  profilePic?: string;
  size?: "sm" | "md";
}) {
  const classes =
    size === "sm"
      ? "h-10 w-10 rounded-2xl text-sm"
      : "h-12 w-12 rounded-2xl text-base";

  if (isDataUrlImage(profilePic)) {
    return (
      <img
        src={profilePic}
        alt={name}
        className={`${classes} border border-slate-200 bg-slate-100 object-cover`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center ${classes} bg-slate-100 font-black text-slate-800`}
    >
      {initials(name)}
    </div>
  );
});

const FeatureUsage = React.memo(function FeatureUsage({
  feature,
}: {
  feature: ApiFeature;
}) {
  if (!feature.limit || feature.limit <= 0) return null;

  const percent = Math.min(100, Math.round((feature.used / feature.limit) * 100));

  const tone =
    percent >= 90
      ? "bg-rose-500"
      : percent >= 70
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <div className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold text-slate-600">
          {FEATURE_LABELS[feature.key] || feature.key.replace(/_/g, " ")}
        </p>

        <p className="text-[11px] font-extrabold text-slate-900">
          {feature.used}/{feature.limit}
        </p>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${tone}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
});

const BrandIdentityCell = React.memo(function BrandIdentityCell({
  brand,
  isMine,
}: {
  brand: BrandRow;
  isMine?: boolean;
}) {
  return (
    <div className="flex min-w-[260px] items-center gap-3">
      <BrandAvatar name={brand.name} profilePic={brand.profilePic} size="sm" />

      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-extrabold text-slate-900">
            {brand.name}
          </p>
          {isMine ? (
            <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-emerald-700">
              Mine
            </span>
          ) : null}
        </div>

        <div className="mt-1 flex flex-col gap-1 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1.5 truncate">
            <Mail className="h-3.5 w-3.5" />
            {brand.email}
          </span>

          {brand.proxyEmail ? (
            <span className="truncate text-[11px] text-slate-400">
              PROXY: {brand.proxyEmail}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
});

const PlanCell = React.memo(function PlanCell({ brand }: { brand: BrandRow }) {
  return (
    <div className="w-full min-w-[180px] p-3 text-left ">
      <span className="inline-flex max-w-full rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.04em] text-slate-900">
        <span className="truncate">{formatPlanLabel(brand.planName)}</span>
      </span>
    </div>
  );
});

const CurrentStatusCell = React.memo(function CurrentStatusCell({
  brand,
}: {
  brand: BrandRow;
}) {
  const status = getBrandCurrentStatus(brand);
  const isPending = isNotSignedUpBrand(brand);

  return (
    <div className="flex justify-center">
      <span
        className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.08em] ${isPending
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
      >
        {isPending ? status.label || "Pending Signup" : "Active"}
      </span>
    </div>
  );
});

const CreatedByCell = React.memo(function CreatedByCell({
  brand,
}: {
  brand: BrandRow;
}) {
  const createdBy = getCreatedByInfo(brand);

  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${createdBy.className}`}
      >
        {createdBy.badge.toUpperCase()}
      </span>
      <span className="max-w-[150px] truncate text-xs font-semibold text-slate-600">
        {createdBy.label.toUpperCase()}
      </span>
      <span className="text-[10px] font-medium text-slate-400">
        {createdBy.subLabel.toUpperCase()}
      </span>
    </div>
  );
});

const TeamCell = React.memo(function TeamCell({
  brand,
  isMine,
}: {
  brand: BrandRow;
  isMine?: boolean;
}) {
  return (
    <div className="min-w-[230px] space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {brand.assignedRh ? (
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${isMine
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-slate-50 text-slate-700"
              }`}
          >
            RH: {brand.assignedRh}
          </span>
        ) : (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
            RH UNASSIGNED
          </span>
        )}

        {brand.assignedBme ? (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700">
            BME: {brand.assignedBme}
          </span>
        ) : (
          <span className="rounded-full border border-dashed border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-400">
            BME PENDING
          </span>
        )}
      </div>

      {isMine ? (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
          <UserCheck className="h-3.5 w-3.5" />
          ASSIGNED TO YOUR RH ACCOUNT
        </p>
      ) : null}
    </div>
  );
});

const assigneeButtonBaseClass =
  "inline-flex h-9 items-center justify-center rounded-[10px] border px-3 text-sm font-medium shadow-sm transition focus-visible:!ring-0 focus-visible:!ring-offset-0";

const assigneeBlackButtonClass =
  "border-black bg-black text-white hover:!bg-black/90 hover:!text-white";

const assigneeDisabledButtonClass =
  "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 hover:!bg-slate-100 hover:!text-slate-400";

const AssigneeCell = React.memo(function AssigneeCell({
  brandId,
  currentValue,
  role,
  options,
  onSave,
  disabled = false,
  disabledLabel = "",
}: {
  brandId: string;
  currentValue: string;
  role: AssignRole;
  options: Employee[];
  onSave: (brandId: string, role: AssignRole, employeeId: string) => Promise<void>;
  disabled?: boolean;
  disabledLabel?: string;
}) {
  const meta = roleMeta(role);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
        setSelected("");
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSave = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (!selected) return;

    try {
      setSaving(true);
      await onSave(brandId, role, selected);
      setOpen(false);
      setSelected("");
    } catch (err: any) {
      showErrorToast(
        `Failed to assign ${meta.label}`,
        getErrorMessage(err, `Failed to assign ${meta.label}.`)
      );
    } finally {
      setSaving(false);
    }
  };

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        title={disabledLabel || `No ${meta.label} available`}
        className={`${assigneeButtonBaseClass} ${assigneeDisabledButtonClass}`}
      >
        {currentValue || meta.emptyLabel}
      </button>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        className={`${assigneeButtonBaseClass} ${assigneeBlackButtonClass}`}
      >
        {currentValue || meta.emptyLabel}
      </button>
    );
  }

  return (
    <div
      ref={ref}
      onClick={(event) => event.stopPropagation()}
      className="min-w-[240px] rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-xl"
    >
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {currentValue ? meta.changeLabel : `Select ${meta.label}`}
      </p>

      <select
        autoFocus
        value={selected}
        onChange={(event) => setSelected(event.target.value)}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400"
      >
        <option value="">Choose {meta.label}</option>
        {options.map((employee) => (
          <option key={employee._id} value={employee._id}>
            {employee.name}
          </option>
        ))}
      </select>


      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || !selected}
          className={`${assigneeButtonBaseClass} ${assigneeBlackButtonClass}`}
        >
          {saving ? "Saving..." : "Save"}
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={(event) => {
            event.stopPropagation();
            setOpen(false);
            setSelected("");
          }}
          className="h-9 rounded-[10px] border-slate-200 px-3 text-sm font-medium"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
});

const AssigneePanelCard = React.memo(function AssigneePanelCard({
  title,
  currentValue,
  employeeId,
  brandId,
  role,
  options,
  onSave,
  disabled,
  disabledLabel,
}: {
  title: string;
  currentValue: string;
  employeeId?: string;
  brandId: string;
  role: AssignRole;
  options: Employee[];
  onSave: (brandId: string, role: AssignRole, employeeId: string) => Promise<void>;
  disabled?: boolean;
  disabledLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
          {title}
        </p>

        {currentValue ? (
          <span
            title={employeeId ? `ID: ${employeeId}` : currentValue}
            className="inline-flex items-center rounded-full border border-yellow-300 bg-yellow-100 px-3 py-1.5 text-sm font-bold text-yellow-900 shadow-sm"
          >
            {currentValue}
          </span>
        ) : (
          <AssigneeCell
            brandId={brandId}
            currentValue={currentValue}
            role={role}
            options={options}
            onSave={onSave}
            disabled={disabled}
            disabledLabel={disabledLabel}
          />
        )}
      </div>
    </div>
  );
});


const BrandExpandedPanel = React.memo(function BrandExpandedPanel({
  brand,
  rhOptions,
  getScopedExecOptions,
  onAssignSave,
  canEditAssignments,
  isMine,
}: {
  brand: BrandRow;
  rhOptions: Employee[];
  getScopedExecOptions: (role: "BME", brand: BrandRow) => Employee[];
  onAssignSave: (brandId: string, role: AssignRole, employeeId: string) => Promise<void>;
  canEditAssignments: boolean;
  isMine?: boolean;
}) {
  const usageFeatures = brand.features.filter((item) => item.limit > 0);
  const brandBmeOptions = getScopedExecOptions("BME", brand);

  return (
    <div className="space-y-5">
      {isMine ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          This brand is assigned to your Revenue Head account. Campaigns under this brand will be visible in your Campaign page.
        </div>
      ) : null}

      <Card className="rounded-2xl border border-slate-200 bg-white shadow-none">
        <div className="p-4">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Assigned Team
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <AssigneePanelCard
              title="Assigned RH"
              currentValue={brand.assignedRh}
              employeeId={brand.RHId}
              brandId={brand._id}
              role="RH"
              options={rhOptions}
              onSave={onAssignSave}
              disabled={!canEditAssignments}
              disabledLabel="Only Super Admin or RH can update assignment"
            />

            <AssigneePanelCard
              title="Assigned BME"
              currentValue={brand.assignedBme}
              employeeId={brand.bdmId}
              brandId={brand._id}
              role="BME"
              options={brandBmeOptions}
              onSave={onAssignSave}
              disabled={
                !canEditAssignments ||
                !brand.RHId ||
                (!brand.assignedBme && brandBmeOptions.length === 0)
              }
              disabledLabel={
                !canEditAssignments
                  ? "Only Super Admin or RH can update assignment"
                  : !brand.RHId
                    ? "Assign RH first"
                    : "No BME under RH"
              }
            />
          </div>
        </div>
      </Card>
    </div>
  );
});

const BrandActionButtons = React.memo(function BrandActionButtons({
  brand,
  canEditBrands,
}: {
  brand: BrandRow;
  canEditBrands: boolean;
}) {
  const canAddCampaign = canEditBrands && canManageCampaigns(brand);

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        asChild
        type="button"
        className={`${tableButtonBaseClass} ${manageButtonClass}`}
      >
        <Link
          href={`/admin/brands/view?brandId=${brand._id}`}
          aria-label="View Brand"
          onClick={(event) => event.stopPropagation()}
        >
          VIEW
        </Link>
      </Button>

      {canAddCampaign ? (
        <Button
          asChild
          type="button"
          className={`${tableButtonBaseClass} ${manageButtonClass}`}
        >
          <Link
            href={`/admin/brands/create-campaign?brandId=${brand._id}`}
            aria-label="Add Campaign"
            onClick={(event) => event.stopPropagation()}
          >
            ADD CAMPAIGN
          </Link>
        </Button>
      ) : (
        <Button
          type="button"
          disabled
          className={`${tableButtonBaseClass} ${disabledButtonClass}`}
          onClick={(event) => event.stopPropagation()}
        >
          ADD CAMPAIGN
        </Button>
      )}
    </div>
  );
});

const AdminBrandPage: NextPage = () => {
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [signupFilter, setSignupFilter] = useState<BrandSignupFilter>("all");
  const [brandPlanFilter, setBrandPlanFilter] = useState<BrandPlanFilter>("all");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [rhOptions, setRhOptions] = useState<Employee[]>([]);
  const [bmeOptions, setBmeOptions] = useState<Employee[]>([]);

  const [canEditBrands, setCanEditBrands] = useState(false);

  const [adminRole, setAdminRole] = useState("");
  const [currentAdminId, setCurrentAdminId] = useState("");
  const [currentAdminName, setCurrentAdminName] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createBrandName, setCreateBrandName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [creatingBrand, setCreatingBrand] = useState(false);

  const requestIdRef = useRef(0);

  const isRevenueHead = adminRole === "revenue_head";
  const isSuperAdmin = adminRole === "super_admin";
  const isBme = adminRole === "bme";
  const canEditAssignments = isSuperAdmin || isRevenueHead;

  const assignmentScope: BrandAssignmentScope = isRevenueHead
    ? "my_assigned"
    : "all";

  useEffect(() => {
    try {
      const storedAdmin: StoredAdmin = JSON.parse(localStorage.getItem("admin") || "{}");
      const permissions = storedAdmin?.permissions ?? storedAdmin?.access ?? [];

      const role = normalizeRole(storedAdmin?.role);
      const adminId = getStoredAdminId(storedAdmin);

      setAdminRole(role);
      setCurrentAdminId(adminId);
      setCurrentAdminName(String(storedAdmin?.name || storedAdmin?.email || ""));

      const allowed = permissions.some((item: any) => {
        const key = String(item?.key || "")
          .toLowerCase()
          .replace(/[\s_-]+/g, "");

        return ["brand", "brands"].includes(key) && item?.isEdit === true;
      });

      setCanEditBrands(allowed);
    } catch {
      setAdminRole("");
      setCurrentAdminId("");
      setCurrentAdminName("");
      setCanEditBrands(false);
    }
  }, []);

  const canCreateBrand = useMemo(
    () => ["super_admin", "revenue_head", "bme"].includes(adminRole),
    [adminRole]
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, assignmentScope, signupFilter, brandPlanFilter]);

  const fetchBrands = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      setLoading(true);

      const basePayload = {
        limit: BRAND_FETCH_PAGE_SIZE,
        search: debouncedSearch,
        sortBy,
        sortOrder,
        assignmentScope,
      };

      const firstResponse = await adminPost<BrandListResponse>(
        "/admin/brand/getlist",
        {
          ...basePayload,
          page: 1,
        }
      );

      if (firstResponse.success === false) {
        throw new Error(firstResponse.message || "Failed to load brands.");
      }

      const firstRawBrands = firstResponse.brands || firstResponse.data || [];
      const responseTotal = firstResponse.total ?? firstRawBrands.length;
      const responseTotalPages =
        firstResponse.totalPages ??
        Math.max(1, Math.ceil(responseTotal / BRAND_FETCH_PAGE_SIZE));

      let allRawBrands = [...firstRawBrands];

      if (responseTotalPages > 1) {
        const remainingResponses = await Promise.all(
          Array.from({ length: responseTotalPages - 1 }, (_, index) =>
            adminPost<BrandListResponse>("/admin/brand/getlist", {
              ...basePayload,
              page: index + 2,
            })
          )
        );

        remainingResponses.forEach((item) => {
          if (item.success === false) {
            throw new Error(item.message || "Failed to load brands.");
          }

          allRawBrands.push(...(item.brands || item.data || []));
        });
      }

      if (requestId !== requestIdRef.current) return;

      const mapped = allRawBrands.map(mapBrand);

      setBrands(mapped);
    } catch (err: any) {
      if (requestId !== requestIdRef.current) return;
      console.error(err);
      showErrorToast("Failed to load brands", getErrorMessage(err, "Failed to load brands."));
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [debouncedSearch, sortBy, sortOrder, assignmentScope]);

  const handleCreateBrand = useCallback(async () => {
    const brandName = createBrandName.trim();
    const email = createEmail.trim().toLowerCase();
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!canCreateBrand) {
      showErrorToast(
        "Permission denied",
        "Only Super Admin, RH, or BME can create brands."
      );
      return;
    }

    if (!brandName) {
      showErrorToast("Brand name required", "Please enter a brand name.");
      return;
    }

    if (!email) {
      showErrorToast("Email required", "Please enter the brand email address.");
      return;
    }

    if (!emailRx.test(email)) {
      showErrorToast("Invalid email", "Please enter a valid brand email address.");
      return;
    }

    try {
      setCreatingBrand(true);

      const response = await adminPost<CreateBrandResponse>("/admin/brand/create", {
        brandName,
        email,
      });

      if (response.success === false) {
        throw new Error(response.message || "Failed to create brand.");
      }

      toast({
        icon: "success",
        title: "Brand created",
        text: response.message || "Brand has been created successfully.",
      });

      setCreateOpen(false);
      setCreateBrandName("");
      setCreateEmail("");
      setPage(1);
      await fetchBrands();
    } catch (err: any) {
      showErrorToast("Failed to create brand", getErrorMessage(err, "Failed to create brand."));
    } finally {
      setCreatingBrand(false);
    }
  }, [canCreateBrand, createBrandName, createEmail, fetchBrands]);

  const fetchAssignees = useCallback(async () => {
    try {
      const [rhResponse, bmeResponse] = await Promise.all([
        adminGet<EmployeeListResponse>("/admins/get-rm-list"),
        adminGet<EmployeeListResponse>("/admins/get-executive-list?role=bme"),
      ]);

      if (rhResponse.success === false) {
        throw new Error(rhResponse.message || "Failed to load RH list.");
      }

      if (bmeResponse.success === false) {
        throw new Error(bmeResponse.message || "Failed to load BME list.");
      }

      setRhOptions(rhResponse.data ?? []);
      setBmeOptions(bmeResponse.data ?? []);
    } catch (err) {
      console.error("Failed to fetch assignees", err);
      showErrorToast(
        "Failed to load assignees",
        getErrorMessage(err, "Failed to load assignees.")
      );
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  useEffect(() => {
    fetchAssignees();
  }, [fetchAssignees]);

  const rhNameMap = useMemo(() => buildEmployeeNameMap(rhOptions), [rhOptions]);
  const bmeNameMap = useMemo(() => buildEmployeeNameMap(bmeOptions), [bmeOptions]);

  const bmeOptionsByRh = useMemo(
    () => groupEmployeesByParent(bmeOptions),
    [bmeOptions]
  );

  const getScopedExecOptions = useCallback(
    (role: "BME", brand: BrandRow) => {
      const rhId = String(brand.RHId || "").trim();

      if (!rhId) return [];

      if (role === "BME") {
        return bmeOptionsByRh[rhId] ?? [];
      }

      return [];
    },
    [bmeOptionsByRh]
  );

  const handleSort = useCallback(
    (field: string) => {
      const typedField = field as SortField;

      setPage(1);

      if (typedField === sortBy) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        return;
      }

      setSortBy(typedField);
      setSortOrder("asc");
    },
    [sortBy]
  );

  const handleAssignSave = useCallback(
    async (brandId: string, role: AssignRole, employeeId: string) => {
      const meta = roleMeta(role);

      const response = await adminPost<{ success?: boolean; message?: string }>(
        "/admins/assign-brand",
        {
          brandId,
          [meta.payloadKey]: employeeId,
        }
      );

      if (response?.success === false) {
        throw new Error(response.message || `Failed to assign ${meta.label}.`);
      }

      setBrands((prev) =>
        prev.map((brand) => {
          if (brand._id !== brandId) return brand;

          if (role === "RH") {
            return {
              ...brand,
              assignedRh: rhNameMap[employeeId] || employeeId,
              RHId: employeeId,
              assignedBme: "",
              bdmId: "",
            };
          }

          return {
            ...brand,
            assignedBme: bmeNameMap[employeeId] || employeeId,
            bdmId: employeeId,
          };
        })
      );
    },
    [rhNameMap, bmeNameMap]
  );

  const handleToggleExpand = useCallback((brandId: string) => {
    setExpandedId((prev) => (prev === brandId ? null : brandId));
  }, []);

  const handleLimitChange = useCallback((limit: number) => {
    setPage(1);
    setPageSize(limit);
  }, []);

  const summaryCounts = useMemo(
    () => ({
      signedUpThisMonth: brands.filter(isSignedUpThisMonth).length,
      fullyManaged: brands.filter(isFullyManagedBrand).length,
      standard: brands.filter(isStandardBrand).length,
      active: brands.filter((item) => item.status === "active").length,
      expired: brands.filter((item) => item.status === "expired").length,
      archived: brands.filter((item) => item.status === "archived").length,
      pendingSignup: brands.filter(isNotSignedUpBrand).length,
      adminCreated: brands.filter(
        (item) => item.createdBySource === "admin" || item.isAdminCreated
      ).length,
      brandCreated: brands.filter(
        (item) => item.createdBySource === "brand" && !item.isAdminCreated
      ).length,
    }),
    [brands]
  );

  const filteredBrands = useMemo(
    () =>
      brands.filter((brand) => {
        const matchesSignup =
          signupFilter === "all" ||
          (signupFilter === "fully_signedup" && isFullySignedUpBrand(brand)) ||
          (signupFilter === "not_signedup" && isNotSignedUpBrand(brand));

        const matchesPlan =
          brandPlanFilter === "all" ||
          (brandPlanFilter === "fully_managed" && isFullyManagedBrand(brand)) ||
          (brandPlanFilter === "standard" && isStandardBrand(brand));

        return matchesSignup && matchesPlan;
      }),
    [brands, signupFilter, brandPlanFilter]
  );

  const filteredTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredBrands.length / pageSize)),
    [filteredBrands.length, pageSize]
  );

  const paginatedBrands = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBrands.slice(start, start + pageSize);
  }, [filteredBrands, page, pageSize]);

  const hasBrandFilters = signupFilter !== "all" || brandPlanFilter !== "all";

  useEffect(() => {
    if (page > filteredTotalPages) {
      setPage(filteredTotalPages);
    }
  }, [page, filteredTotalPages]);

  const assignedCounts = useMemo(
    () => ({
      rh: brands.filter((item) => Boolean(item.assignedRh)).length,
      bme: brands.filter((item) => Boolean(item.assignedBme)).length,
      myRh: brands.filter((item) => isCurrentRhBrand(item, currentAdminId)).length,
      unassignedRh: brands.filter((item) => !item.RHId).length,
    }),
    [brands, currentAdminId]
  );

  const scopeTitle = useMemo(() => {
    if (isRevenueHead || isBme) return "Assigned Brands";
    return "Brands";
  }, [isRevenueHead, isBme]);

  const scopeHint = useMemo(() => {
    if (isRevenueHead) {
      return `Showing brands assigned to ${currentAdminName || "your RH account"
        }.`;
    }

    if (isBme) {
      return "Showing brands assigned to your BME account.";
    }
  }, [isRevenueHead, isBme, currentAdminName]);

  const columns = useMemo<AdminTableColumn<BrandRow>[]>(
    () => [
      {
        id: "name",
        header: "BRAND",
        sortable: true,
        sortField: "name",
        widthClassName: "min-w-[300px]",
        render: (brand) => (
          <BrandIdentityCell
            brand={brand}
            isMine={isRevenueHead && isCurrentRhBrand(brand, currentAdminId)}
          />
        ),
      },
      {
        id: "team",
        header: "ASSIGNED TEAM",
        widthClassName: "min-w-[260px]",
        render: (brand) => (
          <TeamCell
            brand={brand}
            isMine={isRevenueHead && isCurrentRhBrand(brand, currentAdminId)}
          />
        ),
      },
      {
        id: "planName",
        header: "PLAN",
        sortable: true,
        sortField: "planName",
        align: "center",
        widthClassName: "min-w-[220px]",
        render: (brand) => <PlanCell brand={brand} />,
      },
      {
        id: "currentStatus",
        header: "CURRENT STATUS",
        align: "center",
        widthClassName: "min-w-[190px]",
        render: (brand) => <CurrentStatusCell brand={brand} />,
      },
      {
        id: "createdBy",
        header: "CREATED BY",
        align: "center",
        widthClassName: "min-w-[170px]",
        render: (brand) => <CreatedByCell brand={brand} />,
      },
      {
        id: "createdAt",
        header: "CREATED AT",
        sortable: true,
        sortField: "createdAt",
        align: "center",
        widthClassName: "min-w-[150px]",
        render: (brand) => (
          <span className="text-sm font-bold uppercase text-slate-600">
            {formatDate(brand.createdAt).toUpperCase()}
          </span>
        ),
      },
      {
        id: "expiresAt",
        header: "PLAN EXPIRE AT",
        sortable: true,
        sortField: "expiresAt",
        align: "center",
        widthClassName: "min-w-[150px]",
        render: (brand) => (
          <span className="text-sm font-bold uppercase text-slate-600">
            {formatDate(brand.expiresAt).toUpperCase()}
          </span>
        ),
      },
    ],
    [currentAdminId, isRevenueHead]
  );

  const expandable = useMemo(
    () => ({
      expandedRowId: expandedId,
      onToggle: (rowId: string) => handleToggleExpand(rowId),
      renderExpandedRow: (brand: BrandRow) => (
        <BrandExpandedPanel
          brand={brand}
          rhOptions={rhOptions}
          getScopedExecOptions={getScopedExecOptions}
          onAssignSave={handleAssignSave}
          canEditAssignments={canEditAssignments}
          isMine={isRevenueHead && isCurrentRhBrand(brand, currentAdminId)}
        />
      ),
    }),
    [
      expandedId,
      handleToggleExpand,
      rhOptions,
      getScopedExecOptions,
      handleAssignSave,
      canEditAssignments,
      currentAdminId,
      isRevenueHead,
    ]
  );

  const actions = useMemo(
    () => ({
      header: "ACTION",
      align: "right" as const,
      render: (brand: BrandRow) => (
        <BrandActionButtons brand={brand} canEditBrands={canEditBrands} />
      ),
    }),
    [canEditBrands]
  );

  return (
    <div className={`${outfit.className} min-h-screen w-full`}>
      <ToastStyles />
      <div className="flex w-full max-w-none flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-600">
                <ShieldCheck className="h-3.5 w-3.5" />
                ADMIN BRAND CONTROL
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                BRAND MANAGEMENT
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                className="rounded-2xl"
                onClick={() => setCreateOpen(true)}
                disabled={!canCreateBrand}
                title={
                  canCreateBrand
                    ? "Create brand"
                    : "Only Super Admin, RH, or BME can create brands"
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                CREATE BRAND
              </Button>

              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={fetchBrands}
                disabled={loading}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                REFRESH
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Signed Up This Month
            </p>
            <p className="mt-3 text-3xl font-black text-slate-950">
              {summaryCounts.signedUpThisMonth > 0
                ? `+${summaryCounts.signedUpThisMonth}`
                : summaryCounts.signedUpThisMonth}
            </p>
          </div>

          <div className="rounded-[22px] p-5 border border-amber-300 bg-gradient-to-br from-amber-50 via-yellow-50 to-white shadow-sm ring-1 ring-amber-200/70">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Fully Managed Brands
            </p>
            <p className="mt-3 text-3xl font-black text-slate-950">
              {summaryCounts.fullyManaged}
            </p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Standard Brands
            </p>
            <p className="mt-3 text-3xl font-black text-slate-950">
              {summaryCounts.standard}
            </p>
          </div>
        </div>

        <Card className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-black text-slate-900">FILTER BRANDS</p>
                </div>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Signed up filter and brand status filter work together with AND logic.
                </p>
              </div>

              {hasBrandFilters ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-3 py-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSignupFilter("all");
                      setBrandPlanFilter("all");
                    }}
                    className="rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-black"
                  >
                    CLEAR FILTERS
                  </button>
                </div>
              ) : null}

            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  Signed Up
                </p>
                <div className="flex flex-wrap gap-2">
                  {([
                    ["all", "All"],
                    ["fully_signedup", "Fully Signup"],
                    ["not_signedup", "Not Signed Up"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSignupFilter(value)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-black transition ${signupFilter === value
                        ? "border-black bg-black text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  Brand Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {([
                    ["all", "All"],
                    ["fully_managed", "Fully Managed"],
                    ["standard", "Standard Brand"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setBrandPlanFilter(value)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-black transition ${brandPlanFilter === value
                        ? "border-black bg-black text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4 md:p-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                    <p className="text-sm font-black text-slate-900">BRAND VIEW</p>
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {scopeHint}
                  </p>
                </div>

                <div className="relative w-full max-w-xl">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by brand, email, plan, creator, RH, or BME..."
                    className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11 text-sm font-medium shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>
            </div>
          </div>

          <AdminTable<BrandRow>
            data={paginatedBrands}
            columns={columns}
            rowKey={(row) => row._id}
            loading={loading}
            loadingRows={Math.min(pageSize, 8)}
            error={null}
            emptyTitle="No brands found"
            emptyDescription="Try adjusting the search, brand view, or refresh the data."
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            expandable={expandable}
            actions={actions}
            pagination={{
              page,
              totalPages: filteredTotalPages,
              totalItems: filteredBrands.length,
              limit: pageSize,
              onPageChange: setPage,
              onLimitChange: handleLimitChange,
              rowOptions: DEFAULT_ROW_OPTIONS,
              loading,
              showRowsSelector: true,
              showSummary: true,
            }}
            className="w-full"
            tableClassName="w-full min-w-[1320px]"
            headerRowClassName="border-slate-200 hover:bg-transparent"
            bodyClassName="[&_tr:last-child]:border-b-0"
          />
        </Card>
      </div>

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Create Brand
                </h2>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                  Add a brand with only brand name and email. BME-created brands are automatically assigned to that BME and its RH.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCreateOpen(false);
                }}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Brand Name
                </label>
                <Input
                  value={createBrandName}
                  onChange={(event) => {
                    setCreateBrandName(event.target.value);
                  }}
                  placeholder="Enter brand name"
                  className="mt-2 h-11 rounded-2xl border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Email
                </label>
                <Input
                  value={createEmail}
                  onChange={(event) => {
                    setCreateEmail(event.target.value);
                  }}
                  placeholder="brand@example.com"
                  className="mt-2 h-11 rounded-2xl border-slate-200 bg-slate-50"
                />
              </div>


              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => {
                    setCreateOpen(false);
                  }}
                  disabled={creatingBrand}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  className="rounded-2xl"
                  onClick={handleCreateBrand}
                  disabled={creatingBrand}
                >
                  {creatingBrand ? "Creating..." : "Create Brand"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminBrandPage;
