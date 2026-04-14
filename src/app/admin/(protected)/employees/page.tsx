"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Clock3,
  Download,
  Mail,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react";
import {
  ROLE_PERMISSION_SECTIONS,
  canonicalizeModuleKey,
  getAdminModule,
} from "@/app/admin/components/admin-access";
import AdminTable, {
  type AdminTableColumn,
} from "@/app/admin/components/table";

type AdminStatus = "pending" | "active" | "inactive" | "suspended";
type PermissionLevel = "none" | "read" | "write";
type SortOrder = "asc" | "desc";
type AdminRole = "super_admin" | "revenue_head" | "ime" | "bme" | "sdr";

type AdminAccess = {
  key: string;
  name?: string;
  isEdit?: boolean;
  isDelete?: boolean;
  isManager?: boolean;
};

type AdminMini = {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
};

type AdminRow = {
  _id: string;
  email: string;
  name?: string;
  proxyEmail?: string;
  role: string;
  status?: AdminStatus;
  invitedAt?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  access?: AdminAccess[];
  permissions?: AdminAccess[];
  parentAdmin?: string | AdminMini | null;
  rootAdmin?: string | AdminMini | null;
  createdBy?: string | AdminMini | null;
};

type MeResponse = {
  _id: string;
  email: string;
  name?: string;
  proxyEmail?: string;
  role: string;
  status?: AdminStatus;
  permissions?: AdminAccess[];
  access?: AdminAccess[];
  parentAdmin?: string | AdminMini | null;
  rootAdmin?: string | AdminMini | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/";

const ROLE_OPTIONS: Array<{ value: AdminRole; label: string }> = [
  { value: "super_admin", label: "Super Admin" },
  { value: "revenue_head", label: "Revenue Head" },
  { value: "ime", label: "IME" },
  { value: "bme", label: "BME" },
  { value: "sdr", label: "SDR" },
];

const DEFAULT_ROLE_OPTIONS = ROLE_OPTIONS.map((item) => item.value);

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function toApiUrl(path: string) {
  const base = API_BASE.endsWith("/") ? API_BASE : `${API_BASE}/`;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${base}${cleanPath}`;
}

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

function getAuthHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function formatDT(v?: string) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function formatRelativeTime(v?: string) {
  if (!v) return "—";

  const date = new Date(v);
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days === 1) return "Yesterday";
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function getRoleLabel(role?: string) {
  const value = String(role || "").toLowerCase();
  if (value === "super_admin") return "Super Admin";
  if (value === "revenue_head") return "Revenue Head";
  if (value === "ime") return "IME";
  if (value === "bme") return "BME";
  if (value === "sdr") return "SDR";
  return role || "—";
}

function getInitials(name?: string, email?: string) {
  const base = name?.trim() || email?.split("@")[0] || "U";
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function getDisplayId(row: AdminRow) {
  return `EMP-${String(row._id || "").slice(-4).toUpperCase()}`;
}

function getStatusLabel(status?: AdminStatus) {
  const st = status || "pending";
  if (st === "active") return "Active";
  if (st === "pending") return "Pending";
  if (st === "inactive") return "Inactive";
  return "Suspended";
}

function statusTone(status?: AdminStatus) {
  const st = status || "pending";

  if (st === "active") return "bg-black text-white border-black";
  if (st === "pending") return "bg-black/[0.04] text-black/65 border-black/10";
  if (st === "inactive") return "bg-black/[0.08] text-black border-black/10";
  return "bg-black/[0.08] text-black border-black/10";
}

function canonicalizeAccessList(access: AdminAccess[] = []) {
  const map = new Map<string, AdminAccess>();

  for (const item of access) {
    const module = getAdminModule(item.key);
    const canonicalKey = module?.key || canonicalizeModuleKey(item.key);

    if (!canonicalKey) continue;

    const prev = map.get(canonicalKey);

    map.set(canonicalKey, {
      key: canonicalKey,
      name: module?.label || item.name || canonicalKey,
      isEdit: Boolean(prev?.isEdit || item.isEdit),
      isDelete: Boolean(prev?.isDelete || item.isDelete),
      isManager: Boolean(prev?.isManager || item.isManager),
    });
  }

  return Array.from(map.values());
}

function getPermissionLevel(
  access: AdminAccess[] = [],
  moduleKey: string
): PermissionLevel {
  const found = access.find(
    (item) => canonicalizeModuleKey(item.key) === canonicalizeModuleKey(moduleKey)
  );

  if (!found) return "none";
  return found.isEdit ? "write" : "read";
}

function compareText(a?: string, b?: string) {
  return String(a || "").localeCompare(String(b || ""), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function getParentName(parent?: string | AdminMini | null) {
  if (!parent) return "—";
  if (typeof parent === "string") return "Assigned";
  return parent.name || parent.email || "Assigned";
}

function getAllowedInviteRoles(currentRole?: string): AdminRole[] {
  const role = String(currentRole || "").toLowerCase();

  if (role === "super_admin") {
    return ["revenue_head", "ime", "bme", "sdr"];
  }

  if (role === "revenue_head") {
    return ["ime", "bme", "sdr"];
  }

  return [];
}

function roleCanInvite(currentRole?: string) {
  return getAllowedInviteRoles(currentRole).length > 0;
}

function needsParentRevenueHead(inviterRole?: string, targetRole?: string) {
  return (
    String(inviterRole || "").toLowerCase() === "super_admin" &&
    ["ime", "bme", "sdr"].includes(String(targetRole || "").toLowerCase())
  );
}

function PermissionSwitch({
  value,
  onChange,
  disabled,
}: {
  value: PermissionLevel;
  onChange: (next: PermissionLevel) => void;
  disabled?: boolean;
}) {
  const options: PermissionLevel[] = ["none", "read", "write"];

  return (
    <div className="inline-flex items-center rounded-full bg-black/5 p-1">
      {options.map((option) => {
        const active = value === option;

        return (
          <button
            key={option}
            type="button"
            onClick={() => !disabled && onChange(option)}
            disabled={disabled}
            className={cn(
              "min-w-[64px] rounded-full px-4 py-2 text-xs font-semibold capitalize transition",
              active
                ? "bg-black text-white shadow-sm"
                : "text-black/45 hover:text-black",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-[22px] border border-black/10 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-black/45">{title}</p>
          <div className="mt-2 text-4xl font-semibold tracking-[-0.03em] text-black">
            {value}
          </div>
          <p className="mt-2 text-sm text-black/45">{subtext}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/[0.04]">
          <Icon className="h-5 w-5 text-black/65" />
        </div>
      </div>
    </div>
  );
}

function AccessBadges({
  access = [],
  labelMap,
}: {
  access?: AdminAccess[];
  labelMap: Map<string, string>;
}) {
  const items = canonicalizeAccessList(Array.isArray(access) ? access : []);
  const visible = items.slice(0, 3);
  const remaining = Math.max(0, items.length - visible.length);

  if (!items.length) {
    return (
      <span className="inline-flex rounded-xl border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-semibold text-black/50">
        No Access
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visible.map((item) => {
        const label =
          labelMap.get(canonicalizeModuleKey(item.key)) ||
          item.name ||
          item.key;

        return (
          <span
            key={item.key}
            className="inline-flex rounded-xl border border-black/10 bg-black/[0.03] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-black/60"
          >
            {label}
          </span>
        );
      })}

      {remaining > 0 ? (
        <span className="text-xs font-semibold text-black/45">+{remaining}</span>
      ) : null}
    </div>
  );
}

export default function EmployeesPage() {
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [me, setMe] = useState<MeResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingMe, setLoadingMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rowMsg, setRowMsg] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [manageOpen, setManageOpen] = useState(false);

  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editStatus, setEditStatus] = useState<AdminStatus>("pending");
  const [editAccess, setEditAccess] = useState<AdminAccess[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editErr, setEditErr] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteProxyEmail, setInviteProxyEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminRole | "">("");
  const [inviteParentAdmin, setInviteParentAdmin] = useState("");
  const [inviteAccess, setInviteAccess] = useState<AdminAccess[]>([]);
  const [inviting, setInviting] = useState(false);
  const [inviteErr, setInviteErr] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AdminStatus>("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const currentRole = String(me?.role || "").toLowerCase();

  const myAccess = useMemo(() => {
    const raw = (me?.permissions ?? me?.access ?? []) as AdminAccess[];
    return canonicalizeAccessList(raw);
  }, [me]);

  const employeesPermission = getPermissionLevel(myAccess, "employees");

  const canViewEmployees =
    currentRole === "super_admin" ||
    currentRole === "revenue_head" ||
    employeesPermission !== "none";

  const canEditEmployees =
    currentRole === "super_admin" ||
    currentRole === "revenue_head" ||
    employeesPermission === "write";

  const canInviteEmployees = roleCanInvite(currentRole) && canViewEmployees;

  const permissionSections = useMemo(() => {
    return ROLE_PERMISSION_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((itemKey) => Boolean(getAdminModule(itemKey))),
    })).filter((section) => section.items.length > 0);
  }, []);

  const permissionLabelMap = useMemo(() => {
    const map = new Map<string, string>();

    permissionSections.forEach((section) => {
      section.items.forEach((itemKey) => {
        const module = getAdminModule(itemKey);
        if (!module) return;
        map.set(module.key, module.label);
      });
    });

    return map;
  }, [permissionSections]);

  const roleOptions = useMemo(() => {
    const fromRows = rows
      .map((row) => String(row.role || "").toLowerCase().trim())
      .filter(Boolean);

    return Array.from(new Set([...DEFAULT_ROLE_OPTIONS, ...fromRows]));
  }, [rows]);

  const inviteRoleOptions = useMemo(() => {
    const allowed = getAllowedInviteRoles(currentRole);
    return ROLE_OPTIONS.filter((item) => allowed.includes(item.value));
  }, [currentRole]);

  const editRoleOptions = useMemo(() => {
    const allowed = getAllowedInviteRoles(currentRole);
    const base = ROLE_OPTIONS.filter((item) => allowed.includes(item.value));
    const current = String(
      rows.find((row) => row._id === selectedId)?.role || ""
    ).toLowerCase() as AdminRole;

    if (!current) return base;
    if (base.some((item) => item.value === current)) return base;

    return [{ value: current, label: getRoleLabel(current) }, ...base];
  }, [currentRole, rows, selectedId]);

  const revenueHeadOptions = useMemo(() => {
    return rows.filter(
      (row) => String(row.role || "").toLowerCase() === "revenue_head"
    );
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      const rowStatus = (row.status || "pending") as AdminStatus;
      const rowRole = String(row.role || "").toLowerCase().trim();

      const matchesSearch =
        !query ||
        (row.name || "").toLowerCase().includes(query) ||
        (row.email || "").toLowerCase().includes(query) ||
        (row.proxyEmail || "").toLowerCase().includes(query) ||
        rowRole.includes(query);

      const matchesStatus =
        statusFilter === "all" ? true : rowStatus === statusFilter;

      const matchesRole = roleFilter === "all" ? true : rowRole === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [rows, search, statusFilter, roleFilter]);

  const sortedRows = useMemo(() => {
    const next = [...filteredRows];
    const dir = sortOrder === "asc" ? 1 : -1;

    next.sort((a, b) => {
      let result = 0;

      switch (sortBy) {
        case "name":
          result = compareText(a.name, b.name) || compareText(a.email, b.email);
          break;
        case "role":
          result = compareText(a.role, b.role);
          break;
        case "proxyEmail":
          result = compareText(a.proxyEmail, b.proxyEmail);
          break;
        case "parentAdmin":
          result = compareText(getParentName(a.parentAdmin), getParentName(b.parentAdmin));
          break;
        case "status":
          result = compareText(a.status, b.status);
          break;
        case "lastLoginAt":
          result =
            new Date(a.lastLoginAt || 0).getTime() -
            new Date(b.lastLoginAt || 0).getTime();
          break;
        default:
          result =
            new Date(a.createdAt || 0).getTime() -
            new Date(b.createdAt || 0).getTime();
          break;
      }

      if (result !== 0) return result * dir;
      return compareText(a.email, b.email);
    });

    return next;
  }, [filteredRows, sortBy, sortOrder]);

  const totalEmployees = filteredRows.length;
  const activeStaff = filteredRows.filter(
    (r) => (r.status || "pending") === "active"
  ).length;
  const pendingInvites = filteredRows.filter(
    (r) => (r.status || "pending") === "pending"
  ).length;
  const disabledAccounts = filteredRows.filter((r) => {
    const st = r.status || "pending";
    return st === "inactive" || st === "suspended";
  }).length;

  const utilization = totalEmployees
    ? `${((activeStaff / totalEmployees) * 100).toFixed(1)}% utilization`
    : "0% utilization";

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / limit));
  const pagedRows = useMemo(() => {
    const start = (page - 1) * limit;
    return sortedRows.slice(start, start + limit);
  }, [sortedRows, page, limit]);

  const selectedEmployee = useMemo(
    () => rows.find((r) => r._id === selectedId) || null,
    [rows, selectedId]
  );

  const tableColumns = useMemo<AdminTableColumn<AdminRow>[]>(() => {
    return [
      {
        id: "name",
        header: "Employee",
        sortable: true,
        sortField: "name",
        render: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/[0.05] text-sm font-bold text-black">
              {getInitials(row.name, row.email)}
            </div>
            <div>
              <div className="text-sm font-semibold text-black">
                {row.name || "Unnamed Employee"}
              </div>
              <div className="mt-1 text-xs text-black/45">{row.email}</div>
              <div className="mt-1 text-xs text-black/35">
                {getDisplayId(row)}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "role",
        header: "Role",
        sortable: true,
        sortField: "role",
        render: (row) => (
          <span className="inline-flex rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-sm font-semibold text-black">
            {getRoleLabel(row.role)}
          </span>
        ),
      },
      {
        id: "proxyEmail",
        header: "Proxy Email",
        sortable: true,
        sortField: "proxyEmail",
        render: (row) => (
          <div className="inline-flex rounded-xl border border-black/10 bg-black/[0.03] px-3 py-2 text-sm text-black/60">
            {row.proxyEmail || "—"}
          </div>
        ),
      },
      {
        id: "parentAdmin",
        header: "Reports To",
        sortable: true,
        sortField: "parentAdmin",
        render: (row) => (
          <span className="text-sm text-black/65">
            {getParentName(row.parentAdmin)}
          </span>
        ),
      },
      {
        id: "permissions",
        header: "Assigned Permissions",
        render: (row) => {
          const rowAccess = Array.isArray(row.access)
            ? row.access
            : Array.isArray(row.permissions)
              ? row.permissions
              : [];

          return (
            <AccessBadges
              access={rowAccess}
              labelMap={permissionLabelMap}
            />
          );
        },
      },
      {
        id: "lastLoginAt",
        header: "Last Active",
        sortable: true,
        sortField: "lastLoginAt",
        render: (row) => (
          <div className="flex items-center gap-2 text-sm text-black/55">
            <Clock3 className="h-4 w-4" />
            {formatRelativeTime(row.lastLoginAt)}
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        sortable: true,
        sortField: "status",
        render: (row) => {
          const st = (row.status || "pending") as AdminStatus;

          return (
            <span
              className={cn(
                "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                statusTone(st)
              )}
            >
              {getStatusLabel(st)}
            </span>
          );
        },
      },
    ];
  }, [permissionLabelMap]);

  function hydrateEditor(admin: AdminRow | null) {
    if (!admin) {
      setSelectedId(null);
      setEditName("");
      setEditRole("");
      setEditStatus("pending");
      setEditAccess([]);
      setEditErr(null);
      return;
    }

    const nextAccess = canonicalizeAccessList(
      Array.isArray(admin.access)
        ? admin.access
        : Array.isArray(admin.permissions)
          ? admin.permissions
          : []
    );

    setSelectedId(admin._id);
    setEditName(admin.name || "");
    setEditRole(String(admin.role || "").toLowerCase());
    setEditStatus((admin.status || "pending") as AdminStatus);
    setEditAccess(nextAccess);
    setEditErr(null);
  }

  function setModuleLevel(
    setter: React.Dispatch<React.SetStateAction<AdminAccess[]>>,
    moduleKey: string,
    level: PermissionLevel
  ) {
    setter((prev) => {
      const canonicalKey = canonicalizeModuleKey(moduleKey);
      const next = canonicalizeAccessList(prev);
      const index = next.findIndex((item) => item.key === canonicalKey);

      if (level === "none") {
        return next.filter((item) => item.key !== canonicalKey);
      }

      const module = getAdminModule(moduleKey);
      const nextValue: AdminAccess = {
        key: module?.key || canonicalKey,
        name: module?.label || moduleKey,
        isEdit: level === "write",
        isDelete: false,
        isManager: false,
      };

      if (index === -1) return canonicalizeAccessList([...next, nextValue]);

      return canonicalizeAccessList(
        next.map((item, i) => (i === index ? { ...item, ...nextValue } : item))
      );
    });
  }

  function handleSort(field: string) {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(field);
    setSortOrder("asc");
  }

  async function fetchMe() {
    setLoadingMe(true);

    try {
      const res = await fetch(toApiUrl("admins/me"), {
        method: "GET",
        credentials: "include",
        headers: getAuthHeaders(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load current admin");
      }

      setMe(data?.data || data);
    } catch (e: any) {
      setMe(null);
      setError(e?.message || "Failed to load current admin");
    } finally {
      setLoadingMe(false);
    }
  }

  async function fetchEmployees() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(toApiUrl("admins/list"), {
        method: "GET",
        credentials: "include",
        headers: getAuthHeaders(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load employees");
      }

      const nextRows = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];

      setRows(nextRows);

      if (nextRows.length && !selectedId) {
        hydrateEditor(nextRows[0]);
      }
    } catch (e: any) {
      setRows([]);
      setError(e?.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }

  async function refreshAll() {
    await Promise.all([fetchMe(), fetchEmployees()]);
  }

  async function updateStatus(adminId: string, status: AdminStatus) {
    if (!canEditEmployees) return;

    setUpdatingId(adminId);
    setRowMsg(null);

    try {
      const res = await fetch(toApiUrl("admins/update-status"), {
        method: "PUT",
        credentials: "include",
        headers: getAuthHeaders(),
        body: JSON.stringify({ adminId, status }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to update status");
      }

      setRows((prev) =>
        prev.map((item) => (item._id === adminId ? { ...item, status } : item))
      );

      if (selectedId === adminId) {
        setEditStatus(status);
      }

      setRowMsg(data?.message || "Status updated successfully");
    } catch (e: any) {
      setRowMsg(e?.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
      setTimeout(() => setRowMsg(null), 2500);
    }
  }

  async function onSaveCurrent() {
    if (!selectedId) return;

    setSavingEdit(true);
    setEditErr(null);

    try {
      const res = await fetch(toApiUrl("admins/update-status"), {
        method: "PUT",
        credentials: "include",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          adminId: selectedId,
          name: editName.trim() || undefined,
          role: editRole.trim(),
          status: editStatus,
          access: canonicalizeAccessList(editAccess),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to update employee");
      }

      setRowMsg(data?.message || "Changes saved");
      setManageOpen(false);
      await fetchEmployees();
    } catch (e: any) {
      setEditErr(e?.message || "Failed to update employee");
    } finally {
      setSavingEdit(false);
      setTimeout(() => setRowMsg(null), 2500);
    }
  }

  async function onInvite() {
    setInviteErr(null);

    const email = inviteEmail.trim().toLowerCase();
    const role = String(inviteRole || "").trim().toLowerCase() as AdminRole;
    const proxyEmail = inviteProxyEmail.trim();

    if (!email) {
      setInviteErr("Email is required");
      return;
    }

    if (!role) {
      setInviteErr("Role is required");
      return;
    }

    if (needsParentRevenueHead(currentRole, role) && !inviteParentAdmin.trim()) {
      setInviteErr("Please select a Revenue Head");
      return;
    }

    setInviting(true);

    try {
      const payload: Record<string, any> = {
        email,
        name: inviteName.trim() || undefined,
        role,
        access: canonicalizeAccessList(inviteAccess),
        proxyEmail: proxyEmail || undefined,
      };

      if (needsParentRevenueHead(currentRole, role)) {
        payload.parentAdmin = inviteParentAdmin;
      }

      const res = await fetch(toApiUrl("admins/invite"), {
        method: "POST",
        credentials: "include",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Invite failed");
      }

      setInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInviteProxyEmail("");
      setInviteRole("");
      setInviteParentAdmin("");
      setInviteAccess([]);
      setRowMsg(data?.message || "Invite sent successfully");

      await fetchEmployees();
    } catch (e: any) {
      setInviteErr(e?.message || "Invite failed");
    } finally {
      setInviting(false);
      setTimeout(() => setRowMsg(null), 2500);
    }
  }

  function exportCsv() {
    const headers = [
      "Employee Name",
      "Employee Email",
      "Proxy Email",
      "Role",
      "Status",
      "Reports To",
      "Last Login",
      "Modules",
    ];

    const lines = sortedRows.map((row) => {
      const rowAccess = canonicalizeAccessList(
        Array.isArray(row.access)
          ? row.access
          : Array.isArray(row.permissions)
            ? row.permissions
            : []
      );

      return [
        `"${row.name || ""}"`,
        `"${row.email || ""}"`,
        `"${row.proxyEmail || ""}"`,
        `"${row.role || ""}"`,
        `"${row.status || "pending"}"`,
        `"${getParentName(row.parentAdmin)}"`,
        `"${formatDT(row.lastLoginAt)}"`,
        `"${rowAccess
          .map((a) => permissionLabelMap.get(a.key) || a.name || a.key)
          .join(", ")}"`,
      ];
    });

    const csv = [headers.join(","), ...lines.map((l) => l.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "employees.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, roleFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (!filteredRows.length) {
      hydrateEditor(null);
      return;
    }

    const stillVisible = filteredRows.find((row) => row._id === selectedId);
    if (!stillVisible) {
      hydrateEditor(filteredRows[0]);
    }
  }, [filteredRows, selectedId]);

  if (!loadingMe && !canViewEmployees) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          You do not have permission to view this page.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-fu;;">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Employees"
            value={totalEmployees}
            subtext={`+${pendingInvites} pending invite${pendingInvites !== 1 ? "s" : ""}`}
            icon={Users}
          />
          <StatCard
            title="Active Staff"
            value={activeStaff}
            subtext={utilization}
            icon={UserCheck}
          />
          <StatCard
            title="Disabled Accounts"
            value={disabledAccounts}
            subtext="Inactive or suspended"
            icon={UserX}
          />
          <StatCard
            title="Pending Invites"
            value={pendingInvites}
            subtext="Awaiting response"
            icon={Mail}
          />
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-black">
              Manage Workforce
            </h1>

            {!loadingMe && me ? (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-black/70">
                <Shield className="h-3.5 w-3.5" />
                Logged in as {me.name || me.email} · {getRoleLabel(me.role)}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={refreshAll}
              disabled={loading || loadingMe}
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-black/[0.03] disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              {loading || loadingMe ? "Refreshing..." : "Refresh"}
            </button>

            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-black/[0.03]"
            >
              <Download className="h-4 w-4" />
              Bulk Export
            </button>

            {canInviteEmployees ? (
              <button
                type="button"
                onClick={() => {
                  setInviteOpen(true);
                  setInviteErr(null);
                  setInviteEmail("");
                  setInviteName("");
                  setInviteProxyEmail("");
                  setInviteRole("");
                  setInviteParentAdmin("");
                  setInviteAccess([]);
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                <Mail className="h-4 w-4" />
                Invite Employee
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
            <input
              placeholder="Search by name, email, proxy email or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 w-full rounded-2xl border border-black/10 bg-white pl-11 pr-4 text-sm outline-none focus:border-black/20"
            />
          </div>

          <select
            className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/20"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {getRoleLabel(role)}
              </option>
            ))}
          </select>

          <select
            className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/20"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | AdminStatus)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm text-black">
            {error}
          </div>
        ) : null}

        {rowMsg ? (
          <div className="mt-5 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black">
            {rowMsg}
          </div>
        ) : null}

        <div className="mt-5 overflow-hidden rounded-[26px] border border-black/10 bg-white shadow-sm">
          <AdminTable
            data={pagedRows}
            columns={tableColumns}
            rowKey={(row) => row._id}
            loading={loading}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            emptyTitle="No employees found"
            emptyDescription="Try adjusting the filters or refreshing the list."
            actions={{
              header: "Actions",
              align: "right",
              render: (row) => {
                const st = (row.status || "pending") as AdminStatus;
                const isActive = st === "active";
                const isPending = st === "pending";
                const isUpdating = updatingId === row._id;

                return (
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        hydrateEditor(row);
                        setManageOpen(true);
                      }}
                      className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-black/[0.03]"
                    >
                      Manage
                    </button>

                    {!isPending ? (
                      <button
                        type="button"
                        disabled={isUpdating || !canEditEmployees}
                        onClick={() =>
                          updateStatus(row._id, isActive ? "inactive" : "active")
                        }
                        className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-medium text-black/70 hover:bg-black/[0.03] disabled:opacity-50"
                      >
                        {isActive ? "Disable" : "Enable"}
                      </button>
                    ) : null}
                  </div>
                );
              },
            }}
            pagination={{
              page,
              totalPages,
              totalItems: sortedRows.length,
              limit,
              onPageChange: setPage,
              onLimitChange: (next) => {
                setLimit(next);
                setPage(1);
              },
              rowOptions: [10, 20, 50, 100] as const,
              showRowsSelector: true,
              showSummary: true,
            }}
          />
        </div>
      </div>

      {inviteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-black/10 bg-[#f7f7f7] shadow-2xl">
            <div className="shrink-0 flex items-center justify-between border-b border-black/10 px-6 py-5">
              <div>
                <div className="text-xl font-semibold text-black">
                  Invite Employee
                </div>
                <div className="mt-1 text-sm text-black/55">
                  Send invite and assign role, hierarchy and access from here.
                </div>
              </div>

              <button
                className="rounded-xl border border-black/10 px-3 py-2 text-sm text-black/60 hover:bg-black/5 hover:text-black"
                onClick={() => setInviteOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              {inviteErr ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {inviteErr}
                </div>
              ) : null}

              <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black/70">
                <span className="font-semibold text-black">Allowed roles:</span>{" "}
                {inviteRoleOptions.map((role) => role.label).join(", ") || "None"}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-black/45">
                    Email
                  </label>
                  <input
                    className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/30"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="name@domain.com"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-black/45">
                    Full Name
                  </label>
                  <input
                    className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/30"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-black/45">
                    Proxy Email Prefix
                  </label>
                  <input
                    className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/30"
                    value={inviteProxyEmail}
                    onChange={(e) => setInviteProxyEmail(e.target.value)}
                    placeholder="jane.doe or jane"
                  />
                  <p className="mt-2 text-xs text-black/50">
                    Final suffix will be fixed as @team.collabglam.com
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-black/45">
                    Role
                  </label>
                  <select
                    className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/30"
                    value={inviteRole}
                    onChange={(e) => {
                      setInviteRole(e.target.value as AdminRole | "");
                      setInviteParentAdmin("");
                    }}
                  >
                    <option value="">Select role</option>
                    {inviteRoleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {needsParentRevenueHead(currentRole, inviteRole) ? (
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-black/45">
                    Assign Revenue Head
                  </label>
                  <select
                    className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/30"
                    value={inviteParentAdmin}
                    onChange={(e) => setInviteParentAdmin(e.target.value)}
                  >
                    <option value="">Select Revenue Head</option>
                    {revenueHeadOptions.map((admin) => (
                      <option key={admin._id} value={admin._id}>
                        {(admin.name || admin.email) +
                          " · " +
                          getRoleLabel(admin.role)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="overflow-hidden rounded-[24px] border border-black/10 bg-white">
                {permissionSections.map((section) => {
                  const SectionIcon = section.icon;

                  return (
                    <div
                      key={section.key}
                      className="border-b border-black/10 last:border-b-0"
                    >
                      <div className="flex items-center gap-2 bg-black/[0.03] px-4 py-3">
                        <SectionIcon className="h-4 w-4 text-black" />
                        <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-black/55">
                          {section.title}
                        </span>
                      </div>

                      {section.items.map((itemKey) => {
                        const module = getAdminModule(itemKey);
                        if (!module) return null;

                        return (
                          <div
                            key={module.key}
                            className="flex flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between"
                          >
                            <div className="text-base font-medium text-black">
                              {module.label}
                            </div>

                            <PermissionSwitch
                              value={getPermissionLevel(inviteAccess, module.key)}
                              onChange={(next) =>
                                setModuleLevel(setInviteAccess, module.key, next)
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="shrink-0 flex justify-end gap-2 border-t border-black/10 bg-[#f7f7f7] px-6 py-5">
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-medium hover:bg-black/5"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onInvite}
                disabled={inviting || !inviteEmail.trim() || !inviteRole.trim()}
                className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {inviting ? "Sending..." : "Send Invite"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {manageOpen && selectedEmployee ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 bg-white px-6 py-5">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-black">
                  Manage Employee
                </h2>
                <p className="mt-1 text-sm text-black/55">
                  Edit role, status and permissions for {selectedEmployee.email}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setManageOpen(false)}
                className="rounded-xl border border-black/10 p-2 text-black/65 hover:bg-black/[0.03]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {editErr ? (
                <div className="mb-4 rounded-xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm text-black">
                  {editErr}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-black/45">
                    Full Name
                  </label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    disabled={!canEditEmployees}
                    className="h-14 w-full rounded-2xl border border-black/10 bg-white px-5 text-base text-black outline-none placeholder:text-black/30 focus:border-black/20 disabled:opacity-60"
                    placeholder="Employee name"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-black/45">
                    Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    disabled={!canEditEmployees}
                    className="h-14 w-full rounded-2xl border border-black/10 bg-white px-5 text-base text-black outline-none focus:border-black/20 disabled:opacity-60"
                  >
                    <option value="">Select role</option>
                    {editRoleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-black/45">
                    Status
                  </label>
                  <select
                    className="h-14 w-full rounded-2xl border border-black/10 bg-white px-5 text-base text-black outline-none focus:border-black/20 disabled:opacity-60"
                    value={editStatus}
                    disabled={!canEditEmployees}
                    onChange={(e) => setEditStatus(e.target.value as AdminStatus)}
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="mt-5 rounded-[22px] border border-black/10 bg-white p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-black/40">
                      Email
                    </div>
                    <div className="mt-1 text-sm font-medium text-black break-all">
                      {selectedEmployee.email}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-black/40">
                      Proxy Email
                    </div>
                    <div className="mt-1 text-sm font-medium text-black break-all">
                      {selectedEmployee.proxyEmail || "—"}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-black/40">
                      Reports To
                    </div>
                    <div className="mt-1 text-sm font-medium text-black break-words">
                      {getParentName(selectedEmployee.parentAdmin)}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-black/40">
                      Last Login
                    </div>
                    <div className="mt-1 text-sm font-medium text-black break-words">
                      {formatDT(selectedEmployee.lastLoginAt)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-[24px] border border-black/10 bg-white">
                {permissionSections.map((section) => {
                  const SectionIcon = section.icon;

                  return (
                    <div
                      key={section.key}
                      className="border-b border-black/10 last:border-b-0"
                    >
                      <div className="flex items-center gap-2 bg-black/[0.03] px-4 py-3">
                        <SectionIcon className="h-4 w-4 text-black" />
                        <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-black/55">
                          {section.title}
                        </span>
                      </div>

                      {section.items.map((itemKey) => {
                        const module = getAdminModule(itemKey);
                        if (!module) return null;

                        return (
                          <div
                            key={module.key}
                            className="flex flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between"
                          >
                            <div className="text-base font-medium text-black">
                              {module.label}
                            </div>

                            <PermissionSwitch
                              value={getPermissionLevel(editAccess, module.key)}
                              disabled={!canEditEmployees}
                              onChange={(next) =>
                                setModuleLevel(setEditAccess, module.key, next)
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-black/10 bg-white px-6 py-5">
              <button
                type="button"
                onClick={() => {
                  hydrateEditor(selectedEmployee);
                  setManageOpen(false);
                }}
                className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-black hover:bg-black/[0.03]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onSaveCurrent}
                disabled={savingEdit || !editRole.trim() || !canEditEmployees}
                className="inline-flex items-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                <BadgeCheck className="h-4 w-4" />
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}