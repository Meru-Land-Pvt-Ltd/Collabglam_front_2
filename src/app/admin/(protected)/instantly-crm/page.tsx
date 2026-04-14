"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

type MainSectionKey =
  | "workspace"
  | "outreach"
  | "inbox"
  | "performance"
  | "settings";

type SidebarKey =
  | "overview"
  | "accounts"
  | "campaigns"
  | "leadLists"
  | "replies"
  | "reviewQueue"
  | "handoffs"
  | "analytics"
  | "settings";

type StatCard = {
  title: string;
  value: string;
  hint: string;
};

type CampaignRow = {
  name: string;
  status: "Draft" | "Launched" | "Paused";
  sdr: string;
  rh: string;
  bme: string;
  prospects: number;
  replies: number;
};

type ReviewRow = {
  brand: string;
  contact: string;
  stage: string;
  owner: string;
  priority: "High" | "Medium" | "Low";
};

type MainSidebarItem = {
  key: MainSectionKey;
  label: string;
  icon: ReactNode;
  caption: string;
};

type SubSidebarItem = {
  key: SidebarKey;
  label: string;
  description: string;
};

const mainSidebarItems: MainSidebarItem[] = [
  {
    key: "workspace",
    label: "Workspace",
    caption: "Core setup",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-12h6V4h-6v4Z" />
      </svg>
    ),
  },
  {
    key: "outreach",
    label: "Outreach",
    caption: "Campaigns",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 19V8m0 0 8-4 8 4M4 8l8 4m8-4-8 4m0 0v7" />
      </svg>
    ),
  },
  {
    key: "inbox",
    label: "Inbox",
    caption: "Replies flow",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M10 9 5 4m0 0v12m0-12h12" />
        <path d="M19 20H9a4 4 0 0 1-4-4v-1" />
      </svg>
    ),
  },
  {
    key: "performance",
    label: "Performance",
    caption: "Insights",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 19h16" />
        <path d="M7 16V9m5 7V5m5 11v-6" />
      </svg>
    ),
  },
  {
    key: "settings",
    label: "Settings",
    caption: "Controls",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 1-3 0 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 1 0-3 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.87L4.2 8.07a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 1 3 0 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c0 .38.22.74.6 1a1.7 1.7 0 0 1 0 3c-.38.26-.6.62-.6 1Z" />
      </svg>
    ),
  },
];

const subSidebarMap: Record<MainSectionKey, SubSidebarItem[]> = {
  workspace: [
    {
      key: "overview",
      label: "Overview",
      description: "Workspace summary, sender health, and ownership flow.",
    },
    {
      key: "accounts",
      label: "Sender Accounts",
      description: "Connected senders, limits, warmup, and onboarding status.",
    },
  ],
  outreach: [
    {
      key: "campaigns",
      label: "Campaigns",
      description: "Launch, monitor, and track campaign operations.",
    },
    {
      key: "leadLists",
      label: "Lead Lists",
      description: "Imported lists, blocked leads, and launch-ready segments.",
    },
  ],
  inbox: [
    {
      key: "replies",
      label: "Replies",
      description: "Inbound threads, unread responses, and sync health.",
    },
    {
      key: "reviewQueue",
      label: "RH Review Queue",
      description: "Qualification stage before BME handoff.",
    },
    {
      key: "handoffs",
      label: "BME Handoffs",
      description: "Relationship ownership after RH qualification.",
    },
  ],
  performance: [
    {
      key: "analytics",
      label: "Analytics",
      description: "Reply rate, delivery signals, and SDR performance.",
    },
  ],
  settings: [
    {
      key: "settings",
      label: "Settings",
      description: "API keys, webhook setup, sync rules, and defaults.",
    },
  ],
};

const pageMeta: Record<
  SidebarKey,
  {
    eyebrow: string;
    title: string;
    description: string;
    primaryAction: string;
    secondaryAction: string;
  }
> = {
  overview: {
    eyebrow: "Workspace",
    title: "Instantly Admin Overview",
    description:
      "See your sender readiness, campaign health, reply queue, and handoff status from one admin shell.",
    primaryAction: "Create Campaign",
    secondaryAction: "Connect Sender",
  },
  accounts: {
    eyebrow: "Workspace",
    title: "Sender Account Management",
    description:
      "Manage connected email accounts, warmup status, and sending limits used across Instantly outreach.",
    primaryAction: "Add Sender",
    secondaryAction: "Open Settings",
  },
  campaigns: {
    eyebrow: "Outreach",
    title: "Campaign Operations",
    description:
      "Track live campaigns, ownership mapping, and reply performance with an Instantly-style admin workflow.",
    primaryAction: "New Campaign",
    secondaryAction: "Import Leads",
  },
  leadLists: {
    eyebrow: "Outreach",
    title: "Lead Lists",
    description:
      "Organize imported prospects, exclusions, and launch-ready segments before pushing into campaigns.",
    primaryAction: "Import CSV",
    secondaryAction: "Create List",
  },
  replies: {
    eyebrow: "Inbox",
    title: "Replies Inbox",
    description:
      "Review reply sync, unread threads, positive intent signals, and ownership movement across SDR → RH → BME.",
    primaryAction: "Open Inbox",
    secondaryAction: "Refresh Sync",
  },
  reviewQueue: {
    eyebrow: "Inbox",
    title: "RH Review Queue",
    description:
      "Revenue Head reviews incoming replies, qualifies intent, and assigns the right BME owner.",
    primaryAction: "Assign to BME",
    secondaryAction: "View Rules",
  },
  handoffs: {
    eyebrow: "Inbox",
    title: "BME Handoffs",
    description:
      "Monitor qualified conversations after assignment and track relationship ownership downstream.",
    primaryAction: "Open Handoffs",
    secondaryAction: "Export Threads",
  },
  analytics: {
    eyebrow: "Performance",
    title: "Campaign Analytics",
    description:
      "Measure reply quality, delivery health, and SDR output across all launched Instantly campaigns.",
    primaryAction: "Export Report",
    secondaryAction: "View Trends",
  },
  settings: {
    eyebrow: "Settings",
    title: "Workspace Settings",
    description:
      "Configure API access, webhooks, reply sync behavior, and ownership defaults for the admin workflow.",
    primaryAction: "Save Changes",
    secondaryAction: "Test Connection",
  },
};

const summaryStats: Record<SidebarKey, StatCard[]> = {
  overview: [
    { title: "Connected Senders", value: "1", hint: "Sophia Green active" },
    { title: "Live Campaigns", value: "3", hint: "2 launched, 1 paused" },
    { title: "Pending RH Reviews", value: "8", hint: "Replies waiting for allocation" },
    { title: "BME Active Threads", value: "14", hint: "Post-reply relationships" },
  ],
  accounts: [
    { title: "Connected Accounts", value: "1", hint: "Warmup enabled" },
    { title: "Healthy Accounts", value: "1", hint: "Warmup score 98" },
    { title: "Pending Connections", value: "1", hint: "Devansh waiting setup" },
    { title: "Daily Sending Limit", value: "200", hint: "Per sender account" },
  ],
  campaigns: [
    { title: "Draft Campaigns", value: "2", hint: "Need validation before launch" },
    { title: "Launched Campaigns", value: "2", hint: "Sending through Instantly" },
    { title: "Paused Campaigns", value: "1", hint: "Manual pause state" },
    { title: "Total Replies", value: "17", hint: "Across active campaigns" },
  ],
  leadLists: [
    { title: "Lead Lists", value: "6", hint: "Synced with Instantly" },
    { title: "Imported Leads", value: "312", hint: "Unique prospects" },
    { title: "Blocked Leads", value: "11", hint: "Excluded from outreach" },
    { title: "Launch Ready", value: "87", hint: "Valid for campaigns" },
  ],
  replies: [
    { title: "New Replies", value: "5", hint: "Awaiting sync/review" },
    { title: "Unread Threads", value: "9", hint: "Need action" },
    { title: "Positive Intent", value: "4", hint: "High-value responses" },
    { title: "Auto Synced", value: "Yes", hint: "Webhook / polling ready" },
  ],
  reviewQueue: [
    { title: "Pending Review", value: "8", hint: "Owned by Revenue Head" },
    { title: "Qualified Today", value: "3", hint: "Ready for BME handoff" },
    { title: "Unqualified", value: "2", hint: "Closed by RH" },
    { title: "Suggested BME", value: "Enabled", hint: "Pre-assigned before launch" },
  ],
  handoffs: [
    { title: "Assigned to BME", value: "6", hint: "Relationship ownership transferred" },
    { title: "Open Threads", value: "14", hint: "BME owned" },
    { title: "Waiting on Brand", value: "7", hint: "No outbound needed now" },
    { title: "Closed Deals", value: "2", hint: "Recent completions" },
  ],
  analytics: [
    { title: "Reply Rate", value: "12.6%", hint: "Across launched campaigns" },
    { title: "Warmup Score", value: "98", hint: "Sender reputation healthy" },
    { title: "Open Trend", value: "Strong", hint: "Positive delivery signals" },
    { title: "Top SDR", value: "Sophia", hint: "Best reply volume this week" },
  ],
  settings: [
    { title: "API Key", value: "Connected", hint: "Instantly auth successful" },
    { title: "Webhook Status", value: "Pending", hint: "Complete after endpoint mapping" },
    { title: "Reply Sync", value: "Ready", hint: "Polling can be enabled now" },
    { title: "Default Owner Flow", value: "SDR → RH → BME", hint: "Workflow locked" },
  ],
};

const campaigns: CampaignRow[] = [
  {
    name: "Spring Fashion Outreach",
    status: "Launched",
    sdr: "Sophia Green",
    rh: "Revenue Head A",
    bme: "BME A",
    prospects: 120,
    replies: 9,
  },
  {
    name: "Beauty Brand Pilot",
    status: "Paused",
    sdr: "Sophia Green",
    rh: "Revenue Head A",
    bme: "BME B",
    prospects: 64,
    replies: 4,
  },
  {
    name: "Creator Partnership Batch",
    status: "Draft",
    sdr: "Sophia Green",
    rh: "Revenue Head A",
    bme: "BME C",
    prospects: 88,
    replies: 0,
  },
];

const reviewQueueRows: ReviewRow[] = [
  {
    brand: "Luma Skin",
    contact: "nora@lumaskin.com",
    stage: "Replied Pending Review",
    owner: "Revenue Head A",
    priority: "High",
  },
  {
    brand: "Glow Atelier",
    contact: "partnerships@glowatelier.com",
    stage: "Interested",
    owner: "Revenue Head A",
    priority: "High",
  },
  {
    brand: "Mode Haus",
    contact: "dev@modehaus.co",
    stage: "Needs Qualification",
    owner: "Revenue Head A",
    priority: "Medium",
  },
];

function classNames(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

function getStatusClasses(status: CampaignRow["status"]) {
  if (status === "Launched") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "Paused") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

function getPriorityClasses(priority: ReviewRow["priority"]) {
  if (priority === "High") return "border-rose-200 bg-rose-50 text-rose-700";
  if (priority === "Medium") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-sky-200 bg-sky-50 text-sky-700";
}

function getSectionFromTab(tab: SidebarKey): MainSectionKey {
  if (tab === "overview" || tab === "accounts") return "workspace";
  if (tab === "campaigns" || tab === "leadLists") return "outreach";
  if (tab === "replies" || tab === "reviewQueue" || tab === "handoffs") return "inbox";
  if (tab === "analytics") return "performance";
  return "settings";
}

function PrimarySidebar({
  activeSection,
  onSectionChange,
}: {
  activeSection: MainSectionKey;
  onSectionChange: (section: MainSectionKey) => void;
}) {
  return (
    <aside className="hidden w-[88px] shrink-0 border-r border-white/10 bg-[#0d0d0f] xl:flex xl:flex-col">
      <div className="flex h-20 items-center justify-center border-b border-white/10">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-black">
          IA
        </div>
      </div>

      <div className="flex-1 px-3 py-4">
        <div className="space-y-2">
          {mainSidebarItems.map((item) => {
            const active = activeSection === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSectionChange(item.key)}
                className={classNames(
                  "group flex w-full flex-col items-center gap-2 rounded-2xl px-2 py-3 transition",
                  active ? "bg-white text-black" : "text-white/60 hover:bg-white/8 hover:text-white"
                )}
                title={item.label}
              >
                <span>{item.icon}</span>
                <span className="text-[10px] font-semibold leading-3 text-center">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-white/10 p-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            Live
          </p>
          <p className="mt-2 text-xs font-medium text-white">Admin</p>
        </div>
      </div>
    </aside>
  );
}

function SubSidebar({
  activeSection,
  activeTab,
  onTabChange,
}: {
  activeSection: MainSectionKey;
  activeTab: SidebarKey;
  onTabChange: (tab: SidebarKey) => void;
}) {
  const items = subSidebarMap[activeSection];
  const activeSectionData = mainSidebarItems.find((item) => item.key === activeSection);

  return (
    <aside className="hidden w-[320px] shrink-0 border-r border-black/10 bg-white xl:flex xl:flex-col">
      <div className="border-b border-black/10 px-6 py-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-black/40">
          {activeSectionData?.label}
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-black">
          Instantly Admin
        </h1>
        <p className="mt-2 text-sm leading-6 text-black/55">
          {activeSectionData?.caption} section with nested admin views similar to Instantly.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="rounded-[22px] border border-black/10 bg-[#fafafa] p-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-black/40">
            Workspace Status
          </p>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-emerald-50 px-4 py-3">
              <p className="text-sm font-semibold text-emerald-700">API Connected</p>
              <p className="mt-1 text-xs text-emerald-700/80">
                Instantly workspace reachable
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/40">
                Active Sender
              </p>
              <p className="mt-2 text-sm font-semibold text-black">
                sophia.green@collabglam.com
              </p>
              <p className="mt-1 text-xs text-black/55">
                Warmup score 98 · Daily limit 200
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <p className="px-2 text-xs font-medium uppercase tracking-[0.2em] text-black/40">
            Section Menu
          </p>
          <div className="mt-3 space-y-2">
            {items.map((item) => {
              const active = item.key === activeTab;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onTabChange(item.key)}
                  className={classNames(
                    "w-full rounded-[20px] border p-4 text-left transition",
                    active
                      ? "border-black bg-black text-white shadow-[0_14px_34px_rgba(0,0,0,0.15)]"
                      : "border-black/10 bg-white hover:bg-black/[0.03]"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={classNames("text-sm font-semibold", active ? "text-white" : "text-black")}>
                        {item.label}
                      </p>
                      <p
                        className={classNames(
                          "mt-2 text-xs leading-5",
                          active ? "text-white/70" : "text-black/55"
                        )}
                      >
                        {item.description}
                      </p>
                    </div>
                    <span
                      className={classNames(
                        "mt-0.5 inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[11px] font-semibold",
                        active ? "bg-white text-black" : "bg-black/5 text-black/55"
                      )}
                    >
                      {String(items.findIndex((subItem) => subItem.key === item.key) + 1).padStart(2, "0")}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
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

function MobileNav({
  activeSection,
  activeTab,
  onSectionChange,
  onTabChange,
}: {
  activeSection: MainSectionKey;
  activeTab: SidebarKey;
  onSectionChange: (section: MainSectionKey) => void;
  onTabChange: (tab: SidebarKey) => void;
}) {
  return (
    <div className="space-y-3 xl:hidden">
      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-2">
          {mainSidebarItems.map((item) => {
            const active = item.key === activeSection;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSectionChange(item.key)}
                className={classNames(
                  "rounded-2xl px-4 py-2.5 text-sm font-medium transition",
                  active ? "bg-black text-white" : "border border-black/10 bg-white text-black/70"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-2">
          {subSidebarMap[activeSection].map((item) => {
            const active = item.key === activeTab;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onTabChange(item.key)}
                className={classNames(
                  "rounded-2xl px-4 py-2.5 text-sm font-medium transition",
                  active ? "bg-black text-white" : "border border-black/10 bg-white text-black/70"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PageHeader({ activeTab }: { activeTab: SidebarKey }) {
  const meta = pageMeta[activeTab];

  return (
    <div className="border-b border-black/10 bg-white px-4 py-5 md:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-black/40">
            {meta.eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-black">
            {meta.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-black/55">
            {meta.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-black/5"
          >
            {meta.secondaryAction}
          </button>
          <button
            type="button"
            className="rounded-2xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black/90"
          >
            {meta.primaryAction}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatsGrid({ cards }: { cards: StatCard[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-[24px] border border-black/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)]"
        >
          <p className="text-sm font-medium text-black/55">{card.title}</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight text-black">
            {card.value}
          </h3>
          <p className="mt-2 text-sm text-black/50">{card.hint}</p>
        </div>
      ))}
    </div>
  );
}

function CampaignOperationsCard() {
  return (
    <section className="rounded-[24px] border border-black/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-black">Campaign Operations</h3>
          <p className="mt-1 text-sm text-black/55">
            Live overview of SDR campaigns and Instantly send status.
          </p>
        </div>
        <button
          type="button"
          className="rounded-2xl border border-black/10 px-4 py-2 text-sm font-medium text-black hover:bg-black/5"
        >
          View All
        </button>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.18em] text-black/40">
              <th className="pb-1 font-medium">Campaign</th>
              <th className="pb-1 font-medium">Status</th>
              <th className="pb-1 font-medium">Owners</th>
              <th className="pb-1 font-medium">Prospects</th>
              <th className="pb-1 font-medium">Replies</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((row) => (
              <tr key={row.name} className="rounded-2xl bg-[#fcfcfc]">
                <td className="rounded-l-2xl px-4 py-4 align-top">
                  <p className="text-sm font-semibold text-black">{row.name}</p>
                  <p className="mt-1 text-xs text-black/50">Instantly synced campaign</p>
                </td>
                <td className="px-4 py-4 align-top">
                  <span
                    className={classNames(
                      "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                      getStatusClasses(row.status)
                    )}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-4 align-top">
                  <p className="text-sm text-black">
                    <span className="font-medium">SDR:</span> {row.sdr}
                  </p>
                  <p className="mt-1 text-sm text-black/70">
                    <span className="font-medium">RH:</span> {row.rh}
                  </p>
                  <p className="mt-1 text-sm text-black/70">
                    <span className="font-medium">BME:</span> {row.bme}
                  </p>
                </td>
                <td className="px-4 py-4 align-top text-sm font-medium text-black">
                  {row.prospects}
                </td>
                <td className="rounded-r-2xl px-4 py-4 align-top text-sm font-medium text-black">
                  {row.replies}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ReviewQueueCard() {
  return (
    <section className="rounded-[24px] border border-black/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-black">RH Review Queue</h3>
          <p className="mt-1 text-sm text-black/55">
            Replied brands waiting for Revenue Head qualification and BME assignment.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {reviewQueueRows.map((item) => (
          <div
            key={item.contact}
            className="rounded-[22px] border border-black/10 bg-[#fcfcfc] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-black">{item.brand}</h4>
                <p className="mt-1 text-sm text-black/55">{item.contact}</p>
              </div>
              <span
                className={classNames(
                  "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                  getPriorityClasses(item.priority)
                )}
              >
                {item.priority}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-black/60">
              <span className="rounded-full bg-black/5 px-3 py-1">{item.stage}</span>
              <span className="rounded-full bg-black/5 px-3 py-1">{item.owner}</span>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="rounded-2xl bg-black px-3 py-2 text-xs font-medium text-white hover:bg-black/90"
              >
                Assign to BME
              </button>
              <button
                type="button"
                className="rounded-2xl border border-black/10 px-3 py-2 text-xs font-medium text-black hover:bg-black/5"
              >
                View Reply
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SenderSetupCard() {
  return (
    <section className="rounded-[24px] border border-black/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-black">Sender Account Setup</h3>
          <p className="mt-1 text-sm text-black/55">
            Instantly sender connections and warmup readiness.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-emerald-700">
                sophia.green@collabglam.com
              </p>
              <p className="mt-1 text-xs text-emerald-700/80">
                Connected · Warmup active · Daily limit 200
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
              Healthy
            </span>
          </div>
        </div>

        <div className="rounded-[20px] border border-black/10 bg-[#fcfcfc] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-black">
                devanshdubey@collabglam.com
              </p>
              <p className="mt-1 text-xs text-black/55">
                Not connected yet · Start Google / Microsoft OAuth from settings
              </p>
            </div>
            <button
              type="button"
              className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs font-medium text-black hover:bg-black/5"
            >
              Connect Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FlowStatusCard() {
  const flowItems = [
    { label: "SDR creates and launches outreach", status: "Active" },
    { label: "Instantly sends and tracks replies", status: "Connected" },
    { label: "Reply moves to RH review queue", status: "Ready" },
    { label: "RH assigns BME after qualification", status: "Ready" },
    { label: "BME becomes conversation owner", status: "Ready" },
  ];

  return (
    <section className="rounded-[24px] border border-black/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-black">Flow Status</h3>
          <p className="mt-1 text-sm text-black/55">
            Current ownership logic for Instantly-driven outreach.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {flowItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-[18px] border border-black/10 bg-[#fcfcfc] px-4 py-3"
          >
            <p className="text-sm font-medium text-black">{item.label}</p>
            <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionIntroCard({ activeTab }: { activeTab: SidebarKey }) {
  const meta = pageMeta[activeTab];

  return (
    <div className="rounded-[24px] border border-black/10 bg-gradient-to-br from-white to-[#f7f7f7] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-black/40">
            {meta.eyebrow} panel
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-black">
            {meta.title}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-black/55">
            {meta.description}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Owner flow", value: "SDR → RH → BME" },
            { label: "Workspace", value: "CollabGlam" },
            { label: "Mode", value: "Admin layout" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-black/10 bg-white px-4 py-3"
            >
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/40">
                {item.label}
              </p>
              <p className="mt-2 text-sm font-semibold text-black">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContentGrid({ activeTab }: { activeTab: SidebarKey }) {
  const isCampaignView = activeTab === "campaigns" || activeTab === "leadLists";
  const isInboxView = activeTab === "replies" || activeTab === "reviewQueue" || activeTab === "handoffs";
  const isSetupView = activeTab === "accounts" || activeTab === "settings";
  const isAnalyticsView = activeTab === "analytics";
  const isOverviewView = activeTab === "overview";

  if (isCampaignView) {
    return (
      <>
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <CampaignOperationsCard />
          <ReviewQueueCard />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <SenderSetupCard />
          <FlowStatusCard />
        </div>
      </>
    );
  }

  if (isInboxView) {
    return (
      <>
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_1fr]">
          <ReviewQueueCard />
          <FlowStatusCard />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <CampaignOperationsCard />
          <SenderSetupCard />
        </div>
      </>
    );
  }

  if (isSetupView) {
    return (
      <>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <SenderSetupCard />
          <FlowStatusCard />
        </div>

        <div className="mt-6">
          <CampaignOperationsCard />
        </div>
      </>
    );
  }

  if (isAnalyticsView) {
    return (
      <>
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <CampaignOperationsCard />
          <FlowStatusCard />
        </div>

        <div className="mt-6">
          <ReviewQueueCard />
        </div>
      </>
    );
  }

  if (isOverviewView) {
    return (
      <>
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <CampaignOperationsCard />
          <ReviewQueueCard />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <SenderSetupCard />
          <FlowStatusCard />
        </div>
      </>
    );
  }

  return null;
}

export default function InstantlyCRMPage() {
  const [activeSection, setActiveSection] = useState<MainSectionKey>("outreach");
  const [activeTab, setActiveTab] = useState<SidebarKey>("campaigns");

  const cards = useMemo(() => summaryStats[activeTab], [activeTab]);

  useEffect(() => {
    const sectionForActiveTab = getSectionFromTab(activeTab);

    if (sectionForActiveTab !== activeSection) {
      setActiveSection(sectionForActiveTab);
    }
  }, [activeTab, activeSection]);

  const handleSectionChange = (section: MainSectionKey) => {
    setActiveSection(section);
    setActiveTab(subSidebarMap[section][0].key);
  };

  return (
    <div className="min-h-screen bg-[#f6f6f7] text-black">
      <div className="flex min-h-screen">
        <PrimarySidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />

        <SubSidebar
          activeSection={activeSection}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <main className="min-w-0 flex-1">
          <PageHeader activeTab={activeTab} />

          <div className="mx-auto max-w-[1800px] px-4 py-6 md:px-6 lg:px-8">
            <MobileNav
              activeSection={activeSection}
              activeTab={activeTab}
              onSectionChange={handleSectionChange}
              onTabChange={setActiveTab}
            />

            <SectionIntroCard activeTab={activeTab} />

            <div className="mt-6">
              <StatsGrid cards={cards} />
            </div>

            <ContentGrid activeTab={activeTab} />

            <div className="mt-6 rounded-[24px] border border-dashed border-black/15 bg-white px-6 py-6 text-center text-sm leading-7 text-black/55 shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
              This layout now behaves more like an Instantly admin page: primary admin navigation on the far left,
              a contextual sub-sidebar beside it, and a modular content area for the selected section.
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}