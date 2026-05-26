"use client";

import React from "react";
import {
  Activity,
  Bell,
  BookOpen,
  Building2,
  Files,
  Kanban,
  Megaphone,
  MessageCircleMore,
  Scale,
  Send,
  SlidersHorizontal,
  Telescope,
  UserCog,
  UsersRound,
  Bug,
} from "lucide-react";

export type IconType = React.ElementType;

export type AdminChildLink = {
  key: string;
  label: string;
  href: string;
};

export type AdminPermission = {
  key?: string;
  isEdit?: boolean;
  isDelete?: boolean;
  isManager?: boolean;
};

export type AdminModule = {
  key: string;
  label: string;
  href: string;
  icon: IconType;
  aliases?: string[];
  children?: AdminChildLink[];
};

export type AdminPermissionSection = {
  key: string;
  title: string;
  icon: IconType;
  items: string[];
};

export const ADMIN_MODULES: AdminModule[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: Activity,
    aliases: ["home", "admin-dashboard"],
  },
  {
    key: "brand",
    label: "Brands",
    href: "/admin/brands",
    icon: Building2,
    aliases: ["brands"],
  },
  {
    key: "influencer",
    label: "Influencers",
    href: "/admin/influencers",
    icon: UsersRound,
    aliases: ["influencers"],
  },
  {
    key: "campaigns",
    label: "Campaigns",
    href: "/admin/campaigns",
    icon: Megaphone,
  },
  {
    key: "pipelines",
    label: "Pipelines",
    href: "/admin/pitch-folders",
    icon: Kanban,
    aliases: [
      "pitch-folders",
      "pitchfolders",
      "brand-pipeline",
      "brandpipeline",
      "influencer-pipeline",
      "influencerpipeline",
    ],
  },
  {
    key: "influencer-discovery",
    label: "Influencer Discovery",
    href: "/admin/influencer-data",
    icon: Telescope,
    aliases: [
      "influencer-discovery",
      "influencerdiscovery",
      "influencer-data",
      "influencerdata",
      "youtube",
      "yt-data",
      "ytdata",
      "modash",
      "modash-data",
      "modashdata",
    ],
  },
  // {
  //   key: "email-crm",
  //   label: "Email CRM",
  //   href: "/admin/email-crm",
  //   icon: Send,
  //   aliases: [
  //     "composemail",
  //     "compose-mail",
  //     "email-crm",
  //     "emailcrm",
  //     "influencerdetails",
  //     "influencer-email",
  //   ],
  // },
  {
    key: "crm",
    label: "CRM",
    href: "/admin/crm",
    icon: Activity,
    aliases: [
      "instantly",
      "instantlycrm",
      "instantly-crm",
      "brand-outreach",
      "outreach-crm",
      "sdr-crm",
    ],
  },
  // {
  //   key: "invitations",
  //   label: "Invitations",
  //   href: "/admin/invitations",
  //   icon: Bell,
  //   aliases: [
  //     "invitation",
  //     "invite",
  //     "invites",
  //     "campaign-invitations",
  //     "campaign-invites",
  //   ],
  // },
  {
    key: "team-discussions",
    label: "Team Discussions",
    href: "/admin/team-discussions",
    icon: MessageCircleMore,
    aliases: ["team-discussion", "message", "messages"],
  },
  {
    key: "milestone-payouts",
    label: "Milestone Payouts",
    href: "/admin/milestone-payouts",
    icon: Scale,
  },
  {
    key: "missing-emails",
    label: "Missing Emails",
    href: "/admin/missing-emails",
    icon: Bell,
    aliases: ["missingemail", "missing-email", "missingemails"]
  },
  {
    key: "disputes",
    label: "Disputes",
    href: "/admin/disputes",
    icon: Scale,
    aliases: ["dispute"],
  },
  {
    key: "employees",
    label: "Employees",
    href: "/admin/employees",
    icon: UserCog,
    aliases: ["employee", "employees", "role", "roles"],
  },
  {
    key: "new-leads",
    label: "New Leads",
    href: "/admin/new-leads",
    icon: UsersRound,
  },
  {
    key: "rating-reviews",
    label: "Rating & Reviews",
    href: "/admin/rating-reviews",
    icon: Scale,
  },
  {
    key: "Brand Intelligence Tool",
    label: "Brand Intelligence Tool",
    href: "/admin/brand-details",
    icon: UserCog,
  },
    {
   key: "error-logs",
label: "Error Logs",
    href: "/admin/error-log",
    icon: Bug,
  },
  // {
  //   key: "settings",
  //   label: "Settings",
  //   href: "/admin/settings",
  //   icon: SlidersHorizontal,
  //   aliases: ["setting"],
  // },
  {
    key: "documents",
    label: "Documents",
    href: "/admin/documents",
    icon: Files,
    aliases: ["document", "docs", "policies", "legal"],
    children: [
      {
        key: "contact-us-page-email",
        label: "Contact US Page Email",
        href: "/admin/documents/contact-us",
      },
      {
        key: "faqs",
        label: "FAQs",
        href: "/admin/documents/faqs",
      },
      {
        key: "privacy-policy",
        label: "Privacy Policy",
        href: "/admin/documents/privacy-policy",
      },
      {
        key: "terms-of-service",
        label: "Terms of Service",
        href: "/admin/documents/terms-of-service",
      },
      {
        key: "cookie-policy",
        label: "Cookie Policy",
        href: "/admin/documents/cookie-policy",
      },
      {
        key: "shipping-delivery-policy",
        label: "Shipping & Delivery Policy",
        href: "/admin/documents/shipping-delivery",
      },
      {
        key: "returns-policy",
        label: "Returns Policy",
        href: "/admin/documents/return-policy",
      },
      {
        key: "acceptable-use-communication-policy",
        label: "Acceptable Use & Communication Policy",
        href: "/admin/documents/acceptable-use",
      },
      {
        key: "data-processing-addendum",
        label: "Data Processing Addendum",
        href: "/admin/documents/data-processing-addendum",
      },
      {
        key: "subprocessor-list",
        label: "Subprocessor List",
        href: "/admin/documents/subprocessor-list",
      },
    ],
  },
];

export const ROLE_PERMISSION_SECTIONS: AdminPermissionSection[] = [
  {
    key: "overview",
    title: "Overview",
    icon: Activity,
    items: ["dashboard"],
  },
  {
    key: "core",
    title: "Core Modules",
    icon: BookOpen,
    items: [
      "brand",
      "influencer",
      "campaigns",
      "instantly-crm",
      "invitations",
      "pipelines",
      "influencer-discovery",
      "team-discussions",
      "disputes",
      "settings",
      "employees",
      "documents",
    ],
  },
];

export function normalizeModuleKey(value?: string) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, "");
}

const MODULE_KEY_MAP = new Map<string, string>();

for (const module of ADMIN_MODULES) {
  MODULE_KEY_MAP.set(normalizeModuleKey(module.key), module.key);

  for (const alias of module.aliases || []) {
    MODULE_KEY_MAP.set(normalizeModuleKey(alias), module.key);
  }
}

export function canonicalizeModuleKey(value?: string) {
  const normalized = normalizeModuleKey(value);
  return MODULE_KEY_MAP.get(normalized) || String(value || "");
}

export function getAdminModule(value?: string) {
  const canonicalKey = canonicalizeModuleKey(value);
  return ADMIN_MODULES.find((item) => item.key === canonicalKey);
}

export function hasModuleAccess(
  permissionEntries: Array<string | AdminPermission> = [],
  moduleKey?: string
) {
  const wanted = canonicalizeModuleKey(moduleKey);

  return permissionEntries.some((entry) => {
    if (typeof entry === "string") {
      return canonicalizeModuleKey(entry) === wanted;
    }

    return canonicalizeModuleKey(entry?.key) === wanted;
  });
}

export function canEditModule(
  permissions: AdminPermission[] = [],
  moduleKey?: string
) {
  const wanted = canonicalizeModuleKey(moduleKey);

  return permissions.some(
    (item) =>
      canonicalizeModuleKey(item?.key) === wanted && item?.isEdit === true
  );
}

export function canDeleteModule(
  permissions: AdminPermission[] = [],
  moduleKey?: string
) {
  const wanted = canonicalizeModuleKey(moduleKey);

  return permissions.some(
    (item) =>
      canonicalizeModuleKey(item?.key) === wanted && item?.isDelete === true
  );
}

export function canManageModule(
  permissions: AdminPermission[] = [],
  moduleKey?: string
) {
  const wanted = canonicalizeModuleKey(moduleKey);

  return permissions.some(
    (item) =>
      canonicalizeModuleKey(item?.key) === wanted && item?.isManager === true
  );
}