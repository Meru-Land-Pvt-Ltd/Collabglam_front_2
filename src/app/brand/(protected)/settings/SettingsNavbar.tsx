"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type SettingsTab = {
  label: string;
  href: string;
};

const tabs: SettingsTab[] = [
  { label: "Overview", href: "/brand/settings/overview" },
  { label: "Profile", href: "/brand/settings/profile" },
  { label: "Workspace", href: "/brand/settings/workspace" },
  { label: "Users", href: "/brand/settings/users" },
  { label: "Billing & Plans", href: "/brand/settings/billing-plans" },
  { label: "Notifications", href: "/brand/settings/notifications" },
  { label: "Privacy & Security", href: "/brand/settings/privacy-security" },
];

const SettingsNavbar = () => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 flex w-full items-center justify-between self-stretch border-b border-[#E6E6E6] bg-white px-5">
      <nav className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex h-[3.4375rem] min-w-[6.375rem] shrink-0 items-center justify-center gap-2 whitespace-nowrap border-b-2 px-4 text-center font-inter text-base leading-6 tracking-[0] transition-colors ${
                isActive
                  ? "border-[#FFBF00] font-semibold text-[#1A1A1A]"
                  : "border-transparent font-medium text-[#B8B8B8] hover:text-[#1A1A1A]"
              }`}
            >
              <span className="truncate">{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto hidden shrink-0 items-center justify-end sm:flex" />
    </header>
  );
};

export default SettingsNavbar;