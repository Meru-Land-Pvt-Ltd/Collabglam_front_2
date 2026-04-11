"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Outfit } from "next/font/google";
import {
  ChevronDown,
  LogOut,
  Menu,
  ShieldCheck,
  UserCircle,
  X,
} from "lucide-react";
import api from "@/lib/api";
import {
  ADMIN_MODULES,
  AdminPermission,
  canonicalizeModuleKey,
  hasModuleAccess,
} from "@/app/admin/components/admin-access";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

type AdminUser = {
  _id?: string;
  email?: string;
  name?: string;
  role?: string;
  status?: string;
  permissions?: AdminPermission[];
  access?: AdminPermission[];
};

type MeResponse = {
  data?: AdminUser;
  role?: string;
  permissions?: AdminPermission[];
  access?: AdminPermission[];
  email?: string;
  name?: string;
  status?: string;
};

const ROLES = {
  SUPER_ADMIN: "super_admin",
  REVENUE_HEAD: "revenue_head",
  IME: "ime",
  BME: "bme",
} as const;

const DEFAULT_ROLE_MODULES: Record<string, string[]> = {
  [ROLES.SUPER_ADMIN]: ADMIN_MODULES.map((item) => item.key),
  [ROLES.REVENUE_HEAD]: [
    "dashboard",
    "brand",
    "campaigns",
    "pipelines",
    "notifications",
    "disputes",
    "messages",
    "settings",
    "employees",
    "documents",
  ],
  [ROLES.IME]: [
    "dashboard",
    "influencer",
    "compose-mail",
    "pipelines",
    "influencer-discovery",
    "notifications",
    "messages",
    "settings",
    "documents",
  ],
  [ROLES.BME]: [
    "dashboard",
    "brand",
    "campaigns",
    "compose-mail",
    "pipelines",
    "messages",
    "notifications",
    "settings",
    "documents",
  ],
};

const ROLE_LABELS: Record<string, string> = {
  [ROLES.SUPER_ADMIN]: "Super Admin",
  [ROLES.REVENUE_HEAD]: "Revenue Head",
  [ROLES.IME]: "IME",
  [ROLES.BME]: "BME",
};

const drawerVariants = {
  hidden: { x: "-100%" },
  visible: { x: "0%" },
};

// Refined Professional Styles
const linkBase =
  "group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none";
const linkActive = "bg-slate-900 text-white shadow-md shadow-slate-900/10";
const linkInactive = "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
const subLinkBase =
  "block rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200";
const subLinkActive = "text-slate-900 bg-slate-100 font-semibold";
const subLinkInactive = "text-slate-500 hover:text-slate-900 hover:bg-slate-50";

function normalizeRole(value?: string) {
  return String(value || "").trim().toLowerCase();
}

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getPermissionKeys(permissions: AdminPermission[] = []) {
  return permissions.map((item) => canonicalizeModuleKey(item?.key)).filter(Boolean);
}

function getStoredAdmin() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("admin") || "{}");
  } catch {
    return {};
  }
}

function getStoredPermissions(admin: any): AdminPermission[] {
  return admin?.permissions ?? admin?.access ?? [];
}

function dispatchAdminProfileUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("admin-profile-updated"));
}

function BrandHeader({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "px-5 py-4" : "p-6"}>
      <Link href="/admin" className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 shadow-sm">
          <img
            src="/logo.png"
            alt="CollabGlam logo"
            className="h-10 w-10 object-contain" // Assumes white/transparent logo
          />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight text-slate-900">
            CollabGlam
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
            Workspace
          </span>
        </div>
      </Link>
    </div>
  );
}

type CollapsibleSectionProps = {
  title: string;
  icon: React.ElementType;
  isOpen: boolean;
  isActive: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

function CollapsibleSection({
  title,
  icon: Icon,
  isOpen,
  isActive,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={onToggle}
        className={`${linkBase} w-full ${isActive ? linkActive : linkInactive}`}
      >
        <div className="flex items-center gap-3">
          <Icon
            className={`h-[18px] w-[18px] ${
              isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700"
            }`}
          />
          <span>{title}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          } ${isActive ? "text-slate-300" : "text-slate-400"}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="ml-4 mt-1 space-y-1 border-l-2 border-slate-100 pl-3 overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    documents: pathname.startsWith("/admin/documents"),
  });

  const [permissionKeys, setPermissionKeys] = useState<string[]>([]);
  const [currentRole, setCurrentRole] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminStatus, setAdminStatus] = useState("");

  useEffect(() => {
    if (pathname.startsWith("/admin/documents")) {
      setOpenSections((prev) => ({ ...prev, documents: true }));
    }
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  useEffect(() => {
    let mounted = true;

    const hydrateFromStorage = () => {
      if (typeof window === "undefined") {
        if (mounted) setBootstrapped(true);
        return;
      }

      setCurrentRole(normalizeRole(localStorage.getItem("adminRole") || ""));
      setAdminName(String(localStorage.getItem("adminName") || ""));
      setAdminEmail(String(localStorage.getItem("userEmail") || ""));
      setAdminStatus(String(localStorage.getItem("adminStatus") || ""));
      const storedAdmin = getStoredAdmin();
      setPermissionKeys(getPermissionKeys(getStoredPermissions(storedAdmin)));
      
      if (mounted) setBootstrapped(true);
    };

    const syncFromApi = async () => {
      try {
        const response = await api.get("/admins/me");
        const raw: MeResponse = response?.data || {};
        const me: AdminUser = raw?.data || raw || {};

        const roleFromApi = normalizeRole(me.role || raw.role || "");
        const permissionObjects: AdminPermission[] =
          me.permissions ?? me.access ?? raw.permissions ?? raw.access ?? [];

        if (!mounted) return;

        if (roleFromApi) setCurrentRole(roleFromApi);
        setPermissionKeys(getPermissionKeys(permissionObjects));
        setAdminName(String(me.name || raw.name || ""));
        setAdminEmail(String(me.email || raw.email || ""));
        setAdminStatus(String(me.status || raw.status || ""));

        if (typeof window !== "undefined") {
          const existingAdmin = getStoredAdmin();
          localStorage.setItem("adminRole", roleFromApi || "");
          localStorage.setItem("adminName", String(me.name || raw.name || ""));
          localStorage.setItem("userEmail", String(me.email || raw.email || ""));
          localStorage.setItem("adminStatus", String(me.status || raw.status || ""));
          localStorage.setItem(
            "admin",
            JSON.stringify({
              ...existingAdmin,
              ...me,
              role: roleFromApi || existingAdmin?.role || "",
              permissions: permissionObjects,
              access: permissionObjects,
            })
          );
          dispatchAdminProfileUpdated();
        }
      } catch (error) {
        console.error("Failed to fetch admin profile:", error);
      }
    };

    hydrateFromStorage();
    syncFromApi();

    return () => { mounted = false; };
  }, []);

  const isSuperAdmin = currentRole === ROLES.SUPER_ADMIN;

  const allowedSidebarItems = useMemo(() => {
    if (isSuperAdmin) return ADMIN_MODULES;

    if (permissionKeys.length > 0) {
      return ADMIN_MODULES.filter((item) => hasModuleAccess(permissionKeys, item.key));
    }

    const fallbackKeys = DEFAULT_ROLE_MODULES[currentRole]?.map(canonicalizeModuleKey) || [];
    return ADMIN_MODULES.filter((item) => fallbackKeys.includes(canonicalizeModuleKey(item.key)));
  }, [currentRole, permissionKeys, isSuperAdmin]);

  const roleLabel = useMemo(() => ROLE_LABELS[currentRole] || currentRole || "Admin", [currentRole]);

  const handleLogout = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.clear();
        dispatchAdminProfileUpdated();
      }
    } catch {}
    router.replace("/admin/login");
  };

  const renderSectionLink = (item: { href: string; label: string }, isMobile = false) => {
    const active = isActivePath(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => { if (isMobile) setDrawerOpen(false); }}
        className={`${subLinkBase} ${active ? subLinkActive : subLinkInactive}`}
      >
        {item.label}
      </Link>
    );
  };

  const renderSidebarItem = (item: (typeof ADMIN_MODULES)[number], isMobile = false) => {
    const active = isActivePath(pathname, item.href);
    const Icon = item.icon;

    if (item.children?.length) {
      const isOpen = Boolean(openSections[item.key]);
      return (
        <CollapsibleSection
          key={item.key}
          title={item.label}
          icon={Icon}
          isOpen={isOpen}
          isActive={active}
          onToggle={() => setOpenSections((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
        >
          {item.children.map((child) => renderSectionLink(child, isMobile))}
        </CollapsibleSection>
      );
    }

    return (
      <div key={item.href} className="mb-1">
        <Link
          href={item.href}
          onClick={() => { if (isMobile) setDrawerOpen(false); }}
          className={`${linkBase} ${active ? linkActive : linkInactive}`}
        >
          <div className="flex items-center gap-3">
            <Icon
              className={`h-[18px] w-[18px] transition-colors duration-200 ${
                active ? "text-white" : "text-slate-400 group-hover:text-slate-700"
              }`}
            />
            <span>{item.label}</span>
          </div>
        </Link>
      </div>
    );
  };

  if (!bootstrapped) return null;

  return (
    <>
      {/* Mobile Header */}
      <header
        className={`${outfit.className} fixed inset-x-0 top-0 z-50 flex h-16 items-center border-b border-slate-200 bg-white px-4 md:hidden`}
      >
        <button
          onClick={() => setDrawerOpen(true)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="ml-4">
          <span className="text-lg font-bold text-slate-900">CollabGlam</span>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside
        className={`${outfit.className} hidden h-screen w-72 flex-col border-r border-slate-200 bg-white md:fixed md:inset-y-0 md:left-0 md:flex`}
      >
        <BrandHeader />

        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <UserCircle className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {adminName || "Admin User"}
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                  {roleLabel}
                </span>
                {adminStatus && (
                  <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                    {adminStatus}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Main Menu
          </div>
          <nav>
            {allowedSidebarItems.map((item) => renderSidebarItem(item))}
          </nav>

          {!isSuperAdmin && permissionKeys.length === 0 && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 shadow-sm">
              <div className="flex items-center gap-2 font-semibold mb-1">
                <ShieldCheck className="h-4 w-4" /> Fallback Mode
              </div>
              Showing default modules for <strong>{roleLabel}</strong>. Check permissions.
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-4">
          <button
            onClick={handleLogout}
            className={`${linkBase} w-full text-red-600 hover:bg-red-50 hover:text-red-700`}
          >
            <div className="flex items-center gap-3">
              <LogOut className="h-[18px] w-[18px]" />
              <span className="font-semibold">Sign Out</span>
            </div>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              className={`${outfit.className} fixed inset-y-0 left-0 z-50 flex h-screen w-[280px] flex-col bg-white shadow-2xl`}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={drawerVariants}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-4">
                <BrandHeader compact />
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-4">
                 <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    <UserCircle className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {adminName || "Admin User"}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="inline-flex items-center rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                        {roleLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-4">
                <nav>
                  {allowedSidebarItems.map((item) => renderSidebarItem(item, true))}
                </nav>
              </div>

              <div className="border-t border-slate-100 p-4">
                <button
                  onClick={() => { setDrawerOpen(false); handleLogout(); }}
                  className={`${linkBase} w-full text-red-600 hover:bg-red-50 hover:text-red-700`}
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="h-[18px] w-[18px]" />
                    <span className="font-semibold">Sign Out</span>
                  </div>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}