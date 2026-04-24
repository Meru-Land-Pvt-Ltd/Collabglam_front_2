"use client";

import React from "react";
import Link from "next/link";
import InstantlySidebar from "./instantlySidebar";

const mobileNavItems = [
  { label: "Dashboard", href: "/instantly-crm" },
  { label: "Accounts", href: "/instantly-crm/accounts" },
  { label: "Campaigns", href: "/instantly-crm/campaigns" },
  { label: "Replies", href: "/instantly-crm/replies" },
  { label: "Review Queue", href: "/instantly-crm/review-queue" },
  { label: "Assigned Brands", href: "/instantly-crm/assigned-brands" },
];

export default function InstantlyCRMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 bg-[#fafafa] text-black overflow-hidden">
      <div className="hidden xl:block h-full shrink-0 overflow-hidden">
        <InstantlySidebar />
      </div>

      <div className="flex min-w-0 flex-1 flex-col h-full min-h-0 overflow-hidden">
        <div className="shrink-0 border-b border-black/10 bg-white px-4 py-4 md:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1800px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-black/45">
                Instantly CRM
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-black">
                CollabGlam Outreach Workspace
              </h2>
              <p className="mt-1 text-sm text-black/55">
                Manage sender accounts, campaigns, replies, RH review, and BME
                handoff.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-black/5"
              >
                Connect Sender
              </button>
              <button
                type="button"
                className="rounded-2xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black/90"
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-b border-black/10 bg-white px-4 py-3 xl:hidden">
          <div className="overflow-x-auto">
            <div className="flex min-w-max gap-2">
              {mobileNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black/70 transition hover:bg-black/5 hover:text-black"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="mx-auto max-w-[1800px] px-4 py-6 md:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}