"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminSidebar from "../components/AdminSideBar";
import AdminTopBar from "../components/AdminTopBar";

function isInstantlyRoute(pathname: string) {
  const normalized = String(pathname || "").toLowerCase();
  return normalized.includes("/admin") && normalized.includes("crm");
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isLoginRoute = pathname === "/admin/login";
  const isInstantlyPage = isInstantlyRoute(pathname);

  useEffect(() => {
    if (isLoginRoute) {
      setAuthorized(true);
      setReady(true);
      return;
    }

    try {
      const adminId =
        window.localStorage.getItem("adminId") ??
        window.localStorage.getItem("admin_id");

      if (!adminId) {
        router.replace("/admin/login");
        setAuthorized(false);
      } else {
        setAuthorized(true);
      }
    } finally {
      setReady(true);
    }
  }, [isLoginRoute, router]);

  useEffect(() => {
    if (isInstantlyPage) {
      setSidebarCollapsed(true);
    } else {
      setSidebarCollapsed(false);
    }
  }, [isInstantlyPage]);

  if (!ready) return null;
  if (!authorized && !isLoginRoute) return null;

  const showSidebar = !isLoginRoute;
  const showTopbar = !isLoginRoute && !isInstantlyPage;

  const desktopSidebarOffset = showSidebar
    ? sidebarCollapsed
      ? "md:ml-24"
      : "md:ml-72"
    : "";

  return (
    <div
      className={`relative flex h-screen overflow-hidden font-sans text-slate-900 ${
        isInstantlyPage ? "bg-[#f6f6f7]" : "bg-slate-50"
      }`}
    >
      {showSidebar && (
        <div className="relative z-[70] h-screen shrink-0 overflow-visible">
          <AdminSidebar
            collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
          />
        </div>
      )}

      <div
        className={`relative z-0 flex h-screen min-h-0 flex-1 flex-col overflow-hidden transition-all duration-300 ${desktopSidebarOffset}`}
      >
        <div className={showSidebar ? "shrink-0 pt-16 md:pt-0" : "shrink-0"}>
          {showTopbar && <AdminTopBar />}
        </div>

        <main
          className={`flex-1 min-h-0 ${
            isInstantlyPage
              ? "overflow-hidden bg-[#f6f6f7]"
              : "overflow-y-auto"
          }`}
        >
          {isInstantlyPage ? (
            <div className="h-full min-h-0 w-full overflow-hidden">
              {children}
            </div>
          ) : (
            <div className="mx-auto min-h-full max-w-full border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-900/5 sm:p-8">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}