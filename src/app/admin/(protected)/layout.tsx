"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminSidebar from "../components/AdminSideBar";
import AdminTopBar from "../components/AdminTopBar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  const isLoginRoute = pathname === "/admin/login";

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

  if (!ready) return null;
  if (!authorized && !isLoginRoute) return null;

  const showSidebar = !isLoginRoute;
  const showTopbar = !isLoginRoute;

  return (
    <div className="flex h-screen overflow-hidden font-sans text-slate-900">
      {showSidebar && <AdminSidebar />}

      <div
        className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${
          showSidebar ? "md:ml-72" : ""
        }`}
      >
        <div className={showSidebar ? "pt-16 md:pt-0" : ""}>
          {showTopbar && <AdminTopBar />}
        </div>

        <main className="flex-1 overflow-y-auto ">
          <div className=" min-h-[calc(100vh-8rem)]  shadow-sm ring-1 ring-slate-900/5 p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}