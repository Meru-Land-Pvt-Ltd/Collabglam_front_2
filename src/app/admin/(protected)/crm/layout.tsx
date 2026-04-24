"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import InstantlySidebar from "./instantlySidebar";

const mobileNavItems = [
  { label: "Dashboard", href: "/admin/crm" },
  { label: "Accounts", href: "/admin/crm/accounts" },
  { label: "Campaigns", href: "/admin/crm/campaigns" },
  { label: "Replies", href: "/admin/crm/replies" },
  { label: "Review Queue", href: "/admin/crm/review-queue" },
  { label: "My Accounts", href: "/admin/crm/my-accounts" },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function InstantlyCRMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full min-h-0 w-full bg-gray-50/50 font-sans text-gray-900 overflow-hidden">
      
      {/* Desktop Sidebar */}
      <div className="hidden xl:block h-full shrink-0 overflow-hidden">
        <InstantlySidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col h-full min-h-0 overflow-hidden bg-gray-50/30">
        {/* Mobile Navigation (Hidden on Desktop) */}
        <div className="shrink-0 border-b border-gray-200 bg-gray-50/80 px-4 py-3 xl:hidden z-0">
          <div className="overflow-x-auto hide-scrollbar">
            <div className="flex min-w-max gap-2">
              {mobileNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/admin/instantly-crm" && pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cx(
                      "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors shadow-sm border",
                      isActive
                        ? "bg-gray-100 text-[#1a1a1a] border-[#1a1a1a]"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scrollable Page Content */}
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="mx-auto max-w-[1800px] px-4 py-6 md:px-6 lg:px-8">
            {children}
          </div>
        </main>
        
      </div>
    </div>
  );
}