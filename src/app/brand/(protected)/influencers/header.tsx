"use client";

import { useState } from "react";
import {
    CaretRight,
    DotsThree,
    Eye,
    IdentificationCard,
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

const menuItems = [
    { label: "Copy Link", icon: LinkIcon, key: "copylink" },
    { label: "View Influencer list", icon: Eye, key: "viewinfluencerlist" },
    { label: "Invite Influencer", icon: IdentificationCard, key: "inviteinfluencer" },
    { label: "Link IEM Folder", icon: Newspaper, key: "linkiemfolder" },
    { label: "Move to workspace", icon: null, key: "moveToWorkspace", hasArrow: true },
] as const;

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
        copylink: () => navigator.clipboard.writeText(window.location.href),
        viewinfluencerlist: () => console.log("View influencer list"),
        inviteinfluencer: () => console.log("Invite influencer"),
        linkiemfolder: () => console.log("Link IEM folder"),
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

                    <button className="h-9 rounded-lg border border-[#E6E6E6] bg-white px-4 text-xs font-medium text-[#1A1A1A] hover:bg-[#F7F7F7]">
                        Connect With Influencer
                    </button>

                    <button className="h-9 rounded-lg border border-[#E6E6E6] bg-white px-4 text-xs font-medium text-[#1A1A1A] hover:bg-[#F7F7F7]">
                        View media kit
                    </button>

                    <Combobox>
                        <ComboboxTrigger hideIcon>
                            <Button
                                variant="raised"
                                size="sm"
                                aria-label="More actions"
                                className="my-0 h-9 w-9 rounded-lg border border-[#E6E6E6] bg-white px-0 shadow-none"
                            >
                                <DotsThree size={18} weight="bold" />
                            </Button>
                        </ComboboxTrigger>

                        <ComboboxContent
                            align="end"
                            className="w-[13.6875rem] rounded-xl bg-white px-3 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.13)]"
                        >
                            <div className="flex flex-col gap-2">
                                {menuItems.map(({ label, icon: Icon, key }) => {
                                    const isCaretRight =
                                        key === "moveToWorkspace" ||
                                        key === "linkiemfolder" ||
                                        key === "inviteinfluencer";
                                    const isWorkspace = key === "moveToWorkspace";

                                    return (
                                        <div key={key} className="relative">
                                            <button
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
                                                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-normal text-[#1A1A1A] hover:bg-[#F5F5F5]"
                                            >
                                                {Icon ? <Icon size={16} /> : <span className="h-4 w-4" />}
                                                <span className="flex-1 text-left">{label}</span>
                                                {isCaretRight ? <CaretRight size={16} /> : null}
                                            </button>

                                            {isWorkspace && workspaceSubmenuOpen ? (
                                                <div className="absolute top-0 -left-56 z-50 flex w-[13rem] flex-col gap-1 rounded-xl bg-white p-2 shadow-[0_8px_32px_rgba(0,0,0,0.13)]">
                                                    <p className="ml-2 mb-1 text-[0.7rem] font-medium uppercase tracking-wide text-[#999]">
                                                        Workspace name
                                                    </p>

                                                    {workspaces.map((ws) => (
                                                        <button
                                                            key={ws.id}
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

                                <div className="my-2 border-t border-[#F0F0F0]" />

                                <button className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-[#E53935] hover:bg-[#F5F5F5]">
                                    <Trash size={16} />
                                    Delete
                                </button>
                            </div>
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