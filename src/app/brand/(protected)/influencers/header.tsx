"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    BookmarkSimple,
    CaretRight,
    DotsThree,
    EnvelopeOpen,
    Gavel,
    Link as LinkIcon,
    MapPinSimpleArea,
    Newspaper,
    SealCheck,
    Trash,
} from "@phosphor-icons/react";
import {
    Combobox,
    ComboboxContent,
    ComboboxTrigger,
} from "@/components/ui/combobox";
import { Button } from "@/components/ui/buttonComp";
import {
    InfluencerViewModel,
    ManageTabKey,
} from "./utils";
import Tabs from "./tabs";

type MenuItem = {
    label: string;
    icon: typeof Gavel;
    key: "raiseDispute" | "copyProfileLink" | "saveToHub" | "moveToWorkspace";
    hasArrow?: boolean;
};

const menuItems: MenuItem[] = [
    { label: "Raise Dispute", icon: Gavel, key: "raiseDispute" },
    { label: "Copy profile link", icon: LinkIcon, key: "copyProfileLink" },
    { label: "Save to HUB", icon: BookmarkSimple, key: "saveToHub", hasArrow: true },
    { label: "Move to workspace", icon: Newspaper, key: "moveToWorkspace", hasArrow: true },
];

function Dot() {
    return (
        <span
            aria-hidden="true"
            className="inline-block h-[0.125rem] w-[0.125rem] shrink-0 rounded-full bg-[#B8B8B8]"
        />
    );
}

type HeaderProps = {
    view: InfluencerViewModel;
    activeTab: ManageTabKey;
    onTabChange: (tab: ManageTabKey) => void;
};

const getProfileUrl = (view: InfluencerViewModel) => {
    const directUrl =
        (view as any)?.profileUrl ||
        (view as any)?.header?.profileUrl ||
        (view as any)?.raw?.page1Primary?.data?.profile?.url ||
        (view as any)?.raw?.providerProfile?.url ||
        (view as any)?.raw?.page1Primary?.url ||
        "";

    if (directUrl) return directUrl;

    const handle = String(view.profileHandle || "")
        .replace("@", "")
        .trim();

    if (!handle) return "";

    const platform = String(view.providerKey || view.providerLabel || "")
        .toLowerCase();

    if (platform.includes("instagram")) {
        return `https://www.instagram.com/${handle}`;
    }

    if (platform.includes("youtube")) {
        return `https://www.youtube.com/@${handle}`;
    }

    if (platform.includes("tiktok")) {
        return `https://www.tiktok.com/@${handle}`;
    }

    return "";
};

export default function Header({ view, activeTab, onTabChange }: HeaderProps) {
    const router = useRouter();

    const [expanded, setExpanded] = useState(false);
    const [workspaceSubmenuOpen, setWorkspaceSubmenuOpen] = useState(false);

    const workspaces = [
        { id: 1, name: "Workspace Alpha", logo: "A" },
        { id: 2, name: "Workspace Beta", logo: "B" },
        { id: 3, name: "Workspace Gamma", logo: "G" },
    ];

    const profileUrl = getProfileUrl(view);

    const description = view.profileBio || "-";
    const shouldClamp = description !== "-" && description.length > 210;
    const visibleDescription =
        !expanded && shouldClamp ? description.slice(0, 210) : description;

    const handlers: Record<string, (() => void) | undefined> = {
        raiseDispute: () => router.push("/brand/disputes"),
        copyProfileLink: () =>
            navigator.clipboard.writeText(profileUrl || window.location.href),
        saveToHub: () => console.log("Save to HUB"),
    };

    return (
        <section className="flex flex-col items-start gap-5 self-stretch border-b border-[#E6E6E6] bg-white px-6 pt-6">
            <div className="flex w-full items-start justify-between gap-6">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-[6.25rem] w-[6.25rem] shrink-0 overflow-hidden rounded-[3rem] border border-white/30 bg-black">
                        <img
                            src={
                                view.profileImage !== "-"
                                    ? view.profileImage
                                    : "https://i.pravatar.cc/100?img=47"
                            }
                            alt={view.profileName}
                            className="h-full w-full object-cover"
                        />

                        <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-black text-white">
                            <SealCheck size={18} weight="fill" />
                        </span>
                    </div>

                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            {profileUrl ? (
                                <a
                                    href={profileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={`Open ${view.profileName} profile`}
                                    className="max-w-[18rem] truncate font-['Inter'] text-[1.5rem] font-bold leading-[2rem] tracking-[0] text-[#1A1A1A] transition hover:underline"
                                >
                                    {view.profileName}
                                </a>
                            ) : (
                                <h1 className="max-w-[18rem] truncate font-['Inter'] text-[1.5rem] font-bold leading-[2rem] tracking-[0] text-[#1A1A1A]">
                                    {view.profileName}
                                </h1>
                            )}

                            {view.profileVerified ? (
                                <SealCheck
                                    size={28}
                                    weight="fill"
                                    className="shrink-0 text-[#1D9BF0]"
                                />
                            ) : null}
                        </div>

                        <div className="mt-1 flex max-w-[42rem] items-center gap-1 overflow-hidden whitespace-nowrap font-['Inter'] text-[0.875rem] font-normal leading-[1.25rem] tracking-[0] text-[#969696]">
                            <span className="shrink-0 whitespace-nowrap">
                                {view.profileHandle}
                            </span>

                            <Dot />

                            <span className="min-w-0 truncate">
                                {view.primaryCategory || view.categoryText}
                            </span>

                            <Dot />

                            <span className="shrink-0 whitespace-nowrap">
                                {view.accountType}
                            </span>
                        </div>

                        <div className="mt-1 flex items-center gap-1 font-['Inter'] text-[0.875rem] font-normal leading-[1.25rem] tracking-[0] text-[#969696]">
                            <span className="flex h-[0.75rem] w-[0.75rem] shrink-0 items-center justify-center">
                                <MapPinSimpleArea
                                    weight="fill"
                                    aria-hidden="true"
                                    className="block h-[0.58594rem] w-[0.65625rem] text-[#969696]"
                                />
                            </span>

                            <span className="truncate">{view.profileLocation}</span>
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-[#696969]">
                        <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
                        Active
                    </div>

                    <button className="flex h-8 items-center justify-center rounded-[0.5rem] border border-[#E6E6E6] bg-white px-4 text-xs font-medium text-[#1A1A1A] hover:bg-[#F7F7F7] cursor-pointer">
                        View media kit
                    </button>

                    <button
                        type="button"
                        aria-label="Message influencer"
                        onClick={() => router.push("/brand/inbox")}
                        className="flex h-8 w-8 items-center justify-center rounded-[0.5rem] border border-[#E6E6E6] bg-white p-2 text-[#1A1A1A] hover:bg-[#F7F7F7] cursor-pointer"
                    >
                        <EnvelopeOpen size={16} />
                    </button>

                    <Combobox>
                        <ComboboxTrigger hideIcon>
                            <button
                                type="button"
                                aria-label="More actions"
                                className="flex h-8 w-8 min-w-0 items-center justify-center rounded-[0.5rem] border border-[#E6E6E6] bg-white p-0 text-[#1A1A1A] shadow-none hover:bg-[#F7F7F7]"
                            >
                                <DotsThree
                                    weight="bold"
                                    className="h-4 w-4 shrink-0"
                                />
                            </button>
                        </ComboboxTrigger>

                        <ComboboxContent
                            align="end"
                            className="flex w-[13.6875rem] flex-col items-start gap-4 rounded-[0.75rem] bg-white px-3 py-4 shadow-[0_24px_40px_-4px_rgba(0,0,0,0.10),0_0_12px_0_rgba(0,0,0,0.08)]"
                        >
                            <div className="flex w-full flex-col items-start gap-3">
                                {menuItems.map(({ label, icon: Icon, key, hasArrow }) => {
                                    const isWorkspace = key === "moveToWorkspace";

                                    return (
                                        <div key={key} className="relative w-full">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();

                                                    if (isWorkspace) {
                                                        setWorkspaceSubmenuOpen((prev) => !prev);
                                                        return;
                                                    }

                                                    setWorkspaceSubmenuOpen(false);
                                                    handlers[key]?.();
                                                }}
                                                className="flex h-8 w-full cursor-pointer items-center gap-2 self-stretch rounded-[0.5rem] bg-white py-2 pl-2 pr-0 text-center font-['Inter'] text-sm font-normal leading-5 tracking-[0] text-[#1A1A1A] transition hover:bg-[#F9F9F9]"
                                            >
                                                <Icon size={16} className="shrink-0" />

                                                <span className="min-w-0 flex-1 text-left">
                                                    {label}
                                                </span>

                                                {hasArrow ? (
                                                    <CaretRight size={16} className="shrink-0" />
                                                ) : null}
                                            </button>

                                            {isWorkspace && workspaceSubmenuOpen ? (
                                                <div className="absolute top-0 -left-56 z-50 flex w-[13rem] flex-col gap-1 rounded-xl bg-white p-2 shadow-[0_8px_32px_rgba(0,0,0,0.13)]">
                                                    <p className="mb-1 ml-2 text-[0.7rem] font-medium uppercase tracking-wide text-[#999]">
                                                        Workspace name
                                                    </p>

                                                    {workspaces.map((ws) => (
                                                        <button
                                                            key={ws.id}
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setWorkspaceSubmenuOpen(false);
                                                            }}
                                                            className="flex w-full items-center gap-3 rounded-md border p-2 text-sm font-medium hover:bg-[#F5F5F5]"
                                                        >
                                                            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-black text-white">
                                                                {ws.logo}
                                                            </span>

                                                            {ws.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="h-px w-full bg-[#E6E6E6]" />

                            <button
                                type="button"
                                disabled
                                className="flex h-8 w-full cursor-not-allowed items-center gap-2 self-stretch rounded-[0.5rem] bg-white py-2 pl-2 pr-0 text-center font-['Inter'] text-sm font-normal leading-5 tracking-[0] text-[#F04438] opacity-60"
                            >
                                <Trash size={16} />
                                Remove
                            </button>
                        </ComboboxContent>
                    </Combobox>
                </div>
            </div>

            <div className="w-[999px] max-w-full overflow-hidden font-['Inter'] text-[0.875rem] font-normal leading-[1.25rem] tracking-[0] text-[#969696]">
                <span>{visibleDescription}</span>

                {!expanded && shouldClamp ? (
                    <>
                        <span> </span>
                        <button
                            type="button"
                            onClick={() => setExpanded(true)}
                            className="font-['Inter'] text-[0.875rem] font-semibold leading-[1.25rem] tracking-[0] text-[#1A1A1A]"
                        >
                            read more...
                        </button>
                    </>
                ) : expanded && shouldClamp ? (
                    <>
                        <span> </span>
                        <button
                            type="button"
                            onClick={() => setExpanded(false)}
                            className="font-['Inter'] text-[0.875rem] font-semibold leading-[1.25rem] tracking-[0] text-[#1A1A1A]"
                        >
                            show less
                        </button>
                    </>
                ) : null}
            </div>

            <Tabs
                activeTab={activeTab}
                onTabChange={onTabChange}
                className="mt-[2.5rem]"
            />
        </section>
    );
}