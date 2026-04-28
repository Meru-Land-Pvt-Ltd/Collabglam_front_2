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

function isDynamicIdSegment(segment: string) {
  const value = decodeURIComponent(segment || "").trim();

  if (!value) return true;

  if (/^\d+$/.test(value)) return true;

  if (/^[a-f0-9]{24}$/i.test(value)) return true;

  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  ) {
    return true;
  }

  if (/^c[a-z0-9]{20,}$/i.test(value)) return true;

  if (/^[a-z0-9_-]{14,}$/i.test(value) && /\d/.test(value)) return true;

  return false;
}

export default function AdminTopBar() {
  const pathname = usePathname();

  const { pageTitle, breadcrumbs } = useMemo(() => {
    const segments = String(pathname || "")
      .split("/")
      .filter(Boolean);

    const adminSegments =
      segments[0] === "admin" ? segments.slice(1) : segments;

    const startsWithDashboard = adminSegments[0] === "dashboard";

    const breadcrumbSegments = startsWithDashboard
      ? adminSegments.slice(1)
      : adminSegments;

    const baseParts = startsWithDashboard
      ? ["admin", "dashboard"]
      : ["admin"];

    const visibleBreadcrumbSegments = breadcrumbSegments
      .map((segment, index) => ({ segment, index }))
      .filter(({ segment }) => !isDynamicIdSegment(segment));

    const crumbs = [
      { label: "Admin", href: "/admin/dashboard" },
      ...visibleBreadcrumbSegments.map(({ segment, index }) => ({
        label: formatSegment(segment),
        href: `/${[...baseParts, ...breadcrumbSegments.slice(0, index + 1)].join(
          "/"
        )}`,
      })),
    ];

    const lastVisibleSegment =
      visibleBreadcrumbSegments[visibleBreadcrumbSegments.length - 1]?.segment;

    let title = startsWithDashboard ? "Dashboard" : "Overview";

    if (lastVisibleSegment) {
      title = formatSegment(lastVisibleSegment);
    }

    return { pageTitle: title, breadcrumbs: crumbs };
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md">
      <div className="flex min-w-0 flex-col justify-center">
        <nav className="mb-1 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-xs font-medium text-slate-500">
          {breadcrumbs.map((item, index) => (
            <div
              key={`${item.href}-${index}`}
              className="flex items-center gap-1.5"
            >
              <Link
                href={item.href}
                className="transition-colors hover:text-slate-900"
              >
                {item.label}
              </Link>

              {index < breadcrumbs.length - 1 && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              )}
            </div>
          ))}
        </nav>

        <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900">
          {pageTitle}
        </h1>
      </div>

      <div className="hidden flex-1 px-8 lg:flex lg:max-w-md">
        <div className="group relative flex w-full items-center rounded-xl bg-slate-100 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-900 focus-within:ring-offset-1">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400 group-focus-within:text-slate-900" />

          <input
            type="text"
            placeholder="Search anything..."
            className="w-full bg-transparent py-2.5 pl-10 pr-14 text-sm font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none"
          />

          <div className="absolute right-2 hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400 lg:block">
            ⌘K
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 lg:gap-4">
        <Link
          href="/admin/settings"
          className="hidden h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 md:flex"
          aria-label="Settings"
        >
          <Settings className="h-[22px] w-[22px]" />
        </Link>

        <Link
          href="/admin/notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />

          <span className="absolute right-2.5 top-2.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
        </Link>

        <div className="hidden h-9 w-9 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 md:block">
          <img
            src="https://api.dicebear.com/7.x/notionists/svg?seed=Admin"
            alt="Admin avatar"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}