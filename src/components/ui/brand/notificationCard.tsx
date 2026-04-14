"use client";

import React, { useMemo, useState } from "react";
import { CaretDown, FilePdf, GearSix, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/buttonComp";

type NotificationTab = "all" | "read" | "unread";
type NotificationSection = "Today" | "Older";
type NotificationCategory =
  | "All Notification"
  | "Campaigns"
  | "Deliveries"
  | "Milestones"
  | "Payments & Wallet"
  | "Disputes"
  | "Contracts"
  | "System & Reminders";

type NotificationAction = {
  label: string;
  tone?: "primary" | "secondary";
  size?: "default" | "compact";
  onClick?: () => void;
};

type NotificationAttachment = {
  name: string;
  size: string;
  actions?: NotificationAction[];
};

export type NotificationItem = {
  id: string;
  name: string;
  message: string;
  title: string;
  time: string;
  avatar: string;
  section: NotificationSection;
  category: NotificationCategory;
  read?: boolean;
  actions?: NotificationAction[];
  attachment?: NotificationAttachment;
};

type NotificationPanelProps = {
  isOpen?: boolean;
  notifications?: NotificationItem[];
  defaultTab?: NotificationTab;
  defaultCategory?: NotificationCategory;
  onClose?: () => void;
  onSettings?: () => void;
  onMarkAllRead?: () => void;
};

const CATEGORY_OPTIONS: NotificationCategory[] = [
  "All Notification",
  "Campaigns",
  "Deliveries",
  "Milestones",
  "Payments & Wallet",
  "Disputes",
  "Contracts",
  "System & Reminders",
];

const DEMO_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    name: "Ijustine",
    message: "submitted a reel draft",
    title: "Nike New Balance Hi...",
    time: "1 hrs",
    avatar: "https://i.pravatar.cc/64?img=32",
    section: "Today",
    category: "Campaigns",
    read: false,
    actions: [
      { label: "Decline", tone: "secondary" },
      { label: "View", tone: "primary" },
    ],
  },
  {
    id: "2",
    name: "Ijustine",
    message: "submitted a reel draft",
    title: "Nike New Balance Hi...",
    time: "14 aug",
    avatar: "https://i.pravatar.cc/64?img=32",
    section: "Today",
    category: "Contracts",
    read: true,
    attachment: {
      name: "BrandxInfluencer_contract.pdf",
      size: "10.5 MB",
      actions: [
        { label: "Edit", tone: "secondary", size: "compact" },
        { label: "Review", tone: "primary", size: "compact" },
      ],
    },
  },
  {
    id: "3",
    name: "Ijustine",
    message: "applied in the",
    title: "Nike New Balance High flye...",
    time: "14 aug",
    avatar: "https://i.pravatar.cc/64?img=32",
    section: "Older",
    category: "Campaigns",
    read: false,
    actions: [
      { label: "Decline", tone: "secondary" },
      { label: "Accept", tone: "primary" },
    ],
  },
  {
    id: "4",
    name: "Nike",
    message: "Campaign is Ending Soon",
    title: "",
    time: "14 aug",
    avatar: "https://i.pravatar.cc/64?img=12",
    section: "Older",
    category: "System & Reminders",
    read: true,
    actions: [
      { label: "Decline", tone: "secondary" },
      { label: "View", tone: "primary" },
    ],
  },
];

export default function NotificationPanel({
  isOpen = true,
  notifications = DEMO_NOTIFICATIONS,
  defaultTab = "all",
  defaultCategory = "All Notification",
  onClose,
  onSettings,
  onMarkAllRead,
}: NotificationPanelProps) {
  const [activeTab, setActiveTab] = useState<NotificationTab>(defaultTab);
  const [activeCategory, setActiveCategory] =
    useState<NotificationCategory>(defaultCategory);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const matchesTab =
        activeTab === "all"
          ? true
          : activeTab === "read"
          ? !!item.read
          : !item.read;

      const matchesCategory =
        activeCategory === "All Notification"
          ? true
          : item.category === activeCategory;

      return matchesTab && matchesCategory;
    });
  }, [notifications, activeTab, activeCategory]);

  const groupedNotifications = useMemo(() => {
    const today = filteredNotifications.filter((item) => item.section === "Today");
    const older = filteredNotifications.filter((item) => item.section === "Older");

    return [
      { label: "Today" as const, items: today },
      { label: "Older" as const, items: older },
    ].filter((group) => group.items.length > 0);
  }, [filteredNotifications]);

  if (!isOpen) return null;

  return (
    <div className="w-full overflow-hidden rounded-[0.75rem] border border-[#E6E6E6] bg-white shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
      <div className="flex max-h-[min(80vh,42rem)] flex-col">
        <div className="relative flex w-full items-start justify-between px-5 pt-5">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCategoryOpen((prev) => !prev)}
              className="flex h-8 min-w-[7.9375rem] items-center justify-center gap-1 rounded-[0.5rem] bg-white px-3 text-center text-[0.875rem] font-medium leading-5 tracking-[0] text-[#1A1A1A]"
            >
              <span className="truncate">{activeCategory}</span>
              <CaretDown size={16} weight="regular" className="text-[#1A1A1A]" />
            </button>

            {isCategoryOpen && (
              <div className="absolute left-0 top-[calc(100%+0.5rem)] z-20 flex w-[13.1875rem] flex-col gap-2 rounded-[0.75rem] border border-[#F1F3F7] bg-white p-[0.625rem_0.5rem] shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
                {CATEGORY_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setActiveCategory(option);
                      setIsCategoryOpen(false);
                    }}
                    className={`flex h-[3.125rem] w-full items-center rounded-[0.5rem] px-4 py-5 text-left text-[0.875rem] font-medium leading-5 tracking-[0] text-[#1A1A1A] ${
                      option === activeCategory
                        ? "bg-[#EDEDED]"
                        : "bg-white hover:bg-[#F7F7F7]"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSettings}
              aria-label="Open settings"
              className="flex h-7 w-7 items-center justify-center rounded-[0.5rem] bg-white text-[#1A1A1A]"
            >
              <GearSix size={18} weight="regular" className="text-[#1A1A1A]" />
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close notifications"
              className="flex h-7 w-[1.875rem] items-center justify-center rounded-[0.5rem] bg-white text-[#1A1A1A]"
            >
              <X size={18} weight="regular" className="text-[#1A1A1A]" />
            </button>
          </div>
        </div>

        <div className="flex w-full items-center justify-between border-b border-[#E6E6E6] px-5 py-[0.625rem]">
          <div className="flex items-center gap-2">
            {(["all", "read", "unread"] as NotificationTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex h-7 w-14 items-center justify-center rounded-[0.5rem] text-center text-[0.875rem] font-medium leading-5 tracking-[0] text-[#1A1A1A] ${
                  activeTab === tab ? "bg-[#EDEDED]" : "bg-transparent"
                }`}
              >
                {tab[0].toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onMarkAllRead}
            className="flex h-7 items-center justify-center rounded-[0.75rem] px-2 text-center text-[0.875rem] font-medium leading-5 tracking-[0] text-[#1A1A1A]"
          >
            Mark all as read
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-[0.9375rem]">
          <div className="flex w-full flex-col gap-[0.9375rem]">
            {groupedNotifications.map((group) => (
              <div key={group.label} className="flex w-full flex-col gap-[0.625rem]">
                <div className="px-5 text-[0.875rem] font-medium leading-5 tracking-[0] text-[#1A1A1A]">
                  {group.label}
                </div>

                <div className="flex w-full flex-col gap-3 px-5">
                  {group.items.map((item) => (
                    <NotificationItemCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationItemCard({ item }: { item: NotificationItem }) {
  return (
    <div className="flex w-full items-start gap-3 rounded-[0.75rem] bg-white py-1">
      <img
        src={item.avatar}
        alt={item.name}
        className="h-8 w-8 shrink-0 rounded-[2rem] border border-[rgba(255,255,255,0.30)] object-cover"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="shrink-0 text-[0.875rem] font-bold leading-5 tracking-[0] text-[#1A1A1A]">
              {item.name}
            </span>

            <span className="shrink-0 text-[0.875rem] font-medium leading-5 tracking-[0] text-[#1A1A1A]">
              {item.message}
            </span>

            {item.title ? (
              <span className="truncate text-[0.875rem] font-bold leading-5 tracking-[0] text-[#1A1A1A]">
                {item.title}
              </span>
            ) : null}
          </div>

          <span className="shrink-0 text-[0.875rem] font-medium leading-5 tracking-[0] text-[#1A1A1A]">
            {item.time}
          </span>
        </div>

        {item.attachment ? (
          <div className="flex items-center justify-between gap-3 rounded-[0.75rem] border border-[#E6E6E6] bg-white px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-[0.625rem]">
              <div className="flex items-center justify-center text-[#1A1A1A]">
                <FilePdf size={18} weight="fill" className="text-[#1A1A1A]" />
              </div>

              <div className="min-w-0">
                <div className="truncate text-[0.875rem] font-medium leading-[1.125rem] tracking-[0] text-[#1A1A1A]">
                  {item.attachment.name}
                </div>
                <div className="text-[0.8125rem] font-medium leading-4 tracking-[0] text-[#1A1A1A]">
                  {item.attachment.size}
                </div>
              </div>
            </div>

            {item.attachment.actions?.length ? (
              <div className="flex shrink-0 items-center gap-2">
                {item.attachment.actions.map((action) => (
                  <NotificationActionButton key={action.label} action={action} />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {item.actions?.length ? (
          <div className="flex items-center gap-2">
            {item.actions.map((action) => (
              <NotificationActionButton key={action.label} action={action} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function NotificationActionButton({ action }: { action: NotificationAction }) {
  const isPrimary = action.tone === "primary";
  const isCompact = action.size === "compact";

  return (
    <Button
      variant={isPrimary ? "solid" : "outline"}
      size="sm"
      onClick={action.onClick}
      className={[
        "my-0 rounded-[0.75rem] text-center text-[0.875rem] font-medium leading-5 tracking-[0] shadow-none",
        isCompact ? "h-8 min-w-fit px-3" : "h-[2.375rem] min-w-[5.125rem] px-6",
        isPrimary
          ? "border border-[#1A1A1A] bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]"
          : "border border-[#E6E6E6] bg-white text-[#1A1A1A] hover:bg-white",
      ].join(" ")}
    >
      {action.label}
    </Button>
  );
}