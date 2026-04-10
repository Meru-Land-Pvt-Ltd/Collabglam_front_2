"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { Bell, ChevronRight, Search, Settings } from "lucide-react";

function formatSegment(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AdminTopBar() {
  const pathname = usePathname();

  const { pageTitle, breadcrumbs } = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const adminSegments = segments[0] === "admin" ? segments.slice(1) : segments;

    const crumbs = [
      { label: "Admin", href: "/admin/dashboard" },
      ...adminSegments.map((segment, index) => ({
        label: formatSegment(segment),
        href: `/admin/${adminSegments.slice(0, index + 1).join("/")}`,
      })),
    ];

    let title = "Overview";
    if (adminSegments.length > 0) {
      title = formatSegment(adminSegments[adminSegments.length - 1]);
    }

    return { pageTitle: title, breadcrumbs: crumbs };
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md">
      {/* Left section: Breadcrumbs & Title */}
      <div className="flex flex-col justify-center min-w-0">
        <nav className="mb-1 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-xs font-medium text-slate-500">
          {breadcrumbs.map((item, index) => (
            <div key={item.href} className="flex items-center gap-1.5">
              <Link
                href={item.href}
                className="transition-colors hover:text-slate-900"
              >
                {item.label}
              </Link>
              {index < breadcrumbs.length - 1 && (
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              )}
            </div>
          ))}
        </nav>
        <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900">
          {pageTitle}
        </h1>
      </div>

      {/* Middle section: Search */}
      <div className="hidden flex-1 px-8 lg:flex lg:max-w-md">
        <div className="group relative w-full flex items-center rounded-xl bg-slate-100 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-900 focus-within:ring-offset-1">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400 group-focus-within:text-slate-900" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full bg-transparent py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none"
          />
          <div className="absolute right-2 hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400 lg:block">
            ⌘K
          </div>
        </div>
      </div>

      {/* Right section: Actions */}
      <div className="flex items-center gap-3 lg:gap-4 shrink-0">
        <Link
          href="/admin/settings"
          className="hidden md:flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          aria-label="Settings"
        >
          <Settings className="h-[22px] w-[22px]" />
        </Link>
        
        <Link
          href="/admin/notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
          </span>
        </Link>

        {/* User avatar indicator (Optional visual anchor if not in sidebar) */}
        <div className="hidden md:block h-9 w-9 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100">
           <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=Admin`} alt="avatar" className="h-full w-full object-cover" />
        </div>
      </div>
    </header>
  );
}