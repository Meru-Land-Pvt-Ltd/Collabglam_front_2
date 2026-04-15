"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

type SidebarItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const sidebarItems: SidebarItem[] = [
  {
    label: "Dashboard",
    href: "/admin/admin/instantly-crm",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-12h6V4h-6v4Z" />
      </svg>
    ),
  },
  {
    label: "Sender Accounts",
    href: "/admin/instantly-crm/accounts",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
        <path d="m5 7 7 5 7-5" />
      </svg>
    ),
  },
  {
    label: "Campaigns",
    href: "/admin/instantly-crm/campaigns",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 19V8m0 0 8-4 8 4M4 8l8 4m8-4-8 4m0 0v7" />
      </svg>
    ),
  },
  {
    label: "Lead Lists",
    href: "/admin/instantly-crm/lead-lists",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
      </svg>
    ),
  },
  {
    label: "Replies",
    href: "/admin/instantly-crm/replies",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M10 9 5 4m0 0v12m0-12h12" />
        <path d="M19 20H9a4 4 0 0 1-4-4v-1" />
      </svg>
    ),
  },
  {
    label: "Review Queue",
    href: "/admin/instantly-crm/review-queue",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 11 12 14 22 4" />
        <path d="M21 12v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h11" />
      </svg>
    ),
  },
  {
    label: "Assigned Brands",
    href: "/admin/instantly-crm/assigned-brands",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 7h11v11" />
        <path d="M18 7 6 19" />
      </svg>
    ),
  },
  {
    label: "Analytics",
    href: "/admin/instantly-crm/analytics",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 19h16" />
        <path d="M7 16V9m5 7V5m5 11v-6" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/admin/instantly-crm/settings",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 1-3 0 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 1 0-3c.38-.26.6-.62.6-1a1.7 1.7 0 0 0-.34-1.87L4.2 8.07a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 1 3 0 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c0 .38.22.74.6 1a1.7 1.7 0 0 1 0 3c-.38.26-.6.62-.6 1Z" />
      </svg>
    ),
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/admin/instantly-crm") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function InstantlySidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[280px] shrink-0 border-r border-black/10 bg-white xl:flex xl:flex-col">
      <div className="border-b border-black/10 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-sm font-semibold text-white">
            IA
          </div>
          <div>
            <h1 className="text-base font-semibold text-black">Instantly CRM</h1>
            <p className="text-sm text-black/55">CollabGlam outreach workspace</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mb-5 rounded-[20px] border border-black/10 bg-[#fcfcfc] p-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/45">
            Connection
          </p>

          <div className="mt-3 flex items-center justify-between rounded-2xl bg-emerald-50 px-3 py-2">
            <div>
              <p className="text-sm font-semibold text-emerald-700">API Connected</p>
              <p className="text-xs text-emerald-700/80">Instantly workspace reachable</p>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </div>

          <div className="mt-4 rounded-2xl border border-black/10 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/45">
              Active Sender
            </p>
            <p className="mt-2 text-sm font-semibold text-black">
              sophia.green@collabglam.com
            </p>
            <p className="mt-1 text-xs text-black/55">
              Warmup score: 98 · Daily limit: 200
            </p>
          </div>
        </div>

        <div className="mb-3 px-2 text-[11px] font-medium uppercase tracking-[0.18em] text-black/35">
          Workspace
        </div>

        <nav className="space-y-1">
          {sidebarItems.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                  active
                    ? "bg-black text-white shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
                    : "text-black/70 hover:bg-black/5 hover:text-black"
                )}
              >
                <span className={cx(active ? "text-white" : "text-black/65")}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-black/10 p-4">
        <div className="rounded-[20px] bg-black px-4 py-4 text-white">
          <p className="text-sm font-semibold">Workflow Rule</p>
          <p className="mt-2 text-xs leading-6 text-white/75">
            SDR sends outreach, RH reviews replies, and BME owns the relationship after handoff.
          </p>
        </div>
      </div>
    </aside>
  );
}