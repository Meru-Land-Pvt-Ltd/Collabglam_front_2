"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import type { InfluencerTopbarAction } from "./influencerTopbarProvider";
import {
    BellIcon,
    CaretRightIcon,
    ListDashes,
    X,
} from "@phosphor-icons/react";

/* -------------------------------- utils -------------------------------- */

function useMediaQuery(query: string) {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const mql = window.matchMedia(query);
        const onChange = () => setMatches(mql.matches);

        onChange();

        if (mql.addEventListener) mql.addEventListener("change", onChange);
        else mql.addListener(onChange);

        return () => {
            if (mql.removeEventListener) mql.removeEventListener("change", onChange);
            else mql.removeListener(onChange);
        };
    }, [query]);

    return matches;
}

const LABELS: Record<string, string> = {
    influencer: "Creator",
    dashboards: "Dashboard",
    dashboard: "Dashboard",
    invitations: "Direct Invitations",
    "direct-invites": "Direct Invites",
    "my-campaigns": "My Campaigns",
    "discover-campaigns": "Discover Campaigns",
    inbox: "Inbox",
    "media-kit": "Media Kit",
    "wallets-payments": "Wallet & Payments",
    wallet: "Wallet",
    "invite-members": "Invite Members",
    profile: "Profile",
    subscriptions: "Subscriptions",
    "support-centre": "Help & Support",
    disputes: "Disputes",
    "report-issue": "Report Issue",
};

const MY_CAMPAIGN_TAB_LABELS: Record<string, string> = {
    applied: "Applied",
    active: "Active",
    completed: "Completed",
    rejected: "Rejected",
};

function safeDecodeURIComponent(value: string) {
    try {
        return decodeURIComponent(value.replace(/\+/g, " "));
    } catch {
        return value;
    }
}

function titleize(segment: string) {
    const clean = segment.replace(/[-_]/g, " ").trim();

    if (!clean) return clean;

    return clean
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function getCrumbs(pathname: string) {
    const segments = pathname.split("/").filter(Boolean);

    let href = "";
    const crumbs: { href: string; label: string }[] = [];

    segments.forEach((segment) => {
        href += `/${segment}`;

        if (segment === "influencer") return;

        const decoded = safeDecodeURIComponent(segment);

        crumbs.push({
            href,
            label: LABELS[segment] ?? LABELS[decoded] ?? titleize(decoded),
        });
    });

    return crumbs;
}

function getCampaignTitleFromSearch(
    searchParams: ReturnType<typeof useSearchParams>
) {
    return (
        searchParams.get("campaignTitle") ||
        searchParams.get("campaignName") ||
        searchParams.get("name") ||
        searchParams.get("title") ||
        ""
    );
}

function applyCampaignTitleToCrumbs(
    crumbs: { href: string; label: string }[],
    pathname: string,
    campaignTitle: string
) {
    const safeTitle = safeDecodeURIComponent(campaignTitle).trim();

    if (!safeTitle) return crumbs;

    const segments = pathname.split("/").filter(Boolean);

    const discoverCampaignIndex = segments.findIndex(
        (segment) => segment === "discover-campaigns"
    );

    if (discoverCampaignIndex >= 0 && segments[discoverCampaignIndex + 1]) {
        const campaignIdHref = `/${segments
            .slice(0, discoverCampaignIndex + 2)
            .join("/")}`;

        return crumbs.map((crumb) =>
            crumb.href === campaignIdHref ? { ...crumb, label: safeTitle } : crumb
        );
    }

    const campaignLikeIndex = segments.findIndex(
        (segment) => segment === "campaign" || segment === "my-campaigns"
    );

    if (campaignLikeIndex < 0 || !segments[campaignLikeIndex + 1]) {
        return crumbs;
    }

    const campaignIdHref = `/${segments
        .slice(0, campaignLikeIndex + 2)
        .join("/")}`;

    return crumbs.map((crumb) =>
        crumb.href === campaignIdHref ? { ...crumb, label: safeTitle } : crumb
    );
}

function applyMyCampaignTabToCrumbs(
    crumbs: { href: string; label: string }[],
    pathname: string,
    tab: string | null
) {
    if (pathname !== "/influencer/my-campaigns") return crumbs;
    if (!tab) return crumbs;

    const label = MY_CAMPAIGN_TAB_LABELS[tab];

    if (!label) return crumbs;

    return [
        ...crumbs,
        {
            href: `${pathname}?tab=${encodeURIComponent(tab)}`,
            label,
        },
    ];
}

function getDefaultActions(pathname: string): InfluencerTopbarAction[] {
    if (pathname.startsWith("/influencer/discover-campaigns")) {
        return [];
    }

    if (pathname.startsWith("/influencer/my-campaigns")) {
        return [];
    }

    return [];
}

/* ------------------------------ action button ------------------------------ */

function ActionButton({ action }: { action: InfluencerTopbarAction }) {
    if ("static" in action) {
        return (
            <div
                className={[
                    "inline-flex items-center gap-2",
                    "text-[13px] font-semibold text-[#1A1A1A] sm:text-[14px]",
                    action.disabled ? "opacity-50" : "",
                    action.className ?? "",
                ].join(" ")}
                aria-disabled={action.disabled}
            >
                {action.icon ? <span className="shrink-0">{action.icon}</span> : null}
                {action.label ? (
                    <span className="whitespace-nowrap">{action.label}</span>
                ) : null}
            </div>
        );
    }

    const base =
        "inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-lg px-3 text-[13px] font-semibold transition sm:h-10 sm:px-4 sm:text-[14px] disabled:cursor-not-allowed disabled:opacity-50";

    const secondary = "bg-transparent text-[#1A1A1A] hover:bg-[#F5F5F5]";
    const primary = "bg-[#1A1A1A] text-white hover:bg-black";

    const className = [
        base,
        action.variant === "primary" ? primary : secondary,
        action.className ?? "",
    ].join(" ");

    const content = (
        <>
            {action.icon ? <span className="shrink-0">{action.icon}</span> : null}
            {action.label ? (
                <span className="whitespace-nowrap">{action.label}</span>
            ) : null}
        </>
    );

    if ("href" in action) {
        return (
            <Link
                href={action.href}
                aria-disabled={action.disabled}
                className={className}
                onClick={(event) => {
                    if (action.disabled) event.preventDefault();
                }}
            >
                {content}
            </Link>
        );
    }

    return (
        <button
            type="button"
            className={className}
            onClick={action.onClick}
            disabled={action.disabled}
        >
            {content}
        </button>
    );
}

/* ---------------------------- notification panel ---------------------------- */

function NotificationPopover({ onClose }: { onClose: () => void }) {
    return (
        <div className="rounded-xl border border-[#EAEAEA] bg-white shadow-[0_24px_40px_-4px_rgba(0,0,0,0.10),0_0_12px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
                <div>
                    <div className="text-[15px] font-semibold text-[#1A1A1A]">
                        Notifications
                    </div>
                    <div className="text-[12px] text-neutral-500">
                        Your creator updates will appear here.
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close notifications"
                    className="grid h-8 w-8 place-items-center rounded-lg text-[#1A1A1A] transition hover:bg-neutral-100"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="px-4 py-8 text-center">
                <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-neutral-100">
                    <BellIcon size={18} weight="bold" className="text-[#1A1A1A]" />
                </div>

                <div className="text-[14px] font-semibold text-[#1A1A1A]">
                    No notifications yet
                </div>

                <div className="mt-1 text-[12px] text-neutral-500">
                    New invitations, campaign updates, and messages will show here.
                </div>
            </div>
        </div>
    );
}

/* -------------------------------- topbar -------------------------------- */

export default function InfluencerTopbar({
    actionsOverride,
    onMenuToggle,
}: {
    actionsOverride?: InfluencerTopbarAction[];
    onMenuToggle?: () => void;
}) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const isDesktop = useMediaQuery("(min-width: 1024px)");
    const isNarrow = useMediaQuery("(max-width: 640px)");

    const topbarRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);

    const [showNotifications, setShowNotifications] = useState(false);
    const [notificationPosition, setNotificationPosition] = useState<{
        top: number;
        left: number;
        width: number;
    } | null>(null);

    const showHamburger = !isDesktop && Boolean(onMenuToggle);

    useEffect(() => {
        const element = topbarRef.current;
        if (!element) return;

        const setVar = () => {
            const height = element.getBoundingClientRect().height;

            document.documentElement.style.setProperty(
                "--influencer-topbar-h",
                `${Math.ceil(height)}px`
            );
        };

        setVar();

        const resizeObserver = new ResizeObserver(setVar);
        resizeObserver.observe(element);

        return () => resizeObserver.disconnect();
    }, []);

    const updateNotificationPosition = useCallback(() => {
        const trigger = notificationRef.current;
        if (!trigger) return;

        const rect = trigger.getBoundingClientRect();
        const viewportPadding = 8;
        const gap = 8;
        const desiredWidth = 420;

        const width = Math.min(
            desiredWidth,
            Math.max(320, window.innerWidth - viewportPadding * 2)
        );

        const left = Math.min(
            Math.max(viewportPadding, rect.right - width),
            window.innerWidth - width - viewportPadding
        );

        const top = rect.bottom + gap;

        setNotificationPosition({
            top,
            left,
            width,
        });
    }, []);

    useEffect(() => {
        if (!showNotifications) return;

        updateNotificationPosition();

        const handleReposition = () => updateNotificationPosition();

        window.addEventListener("resize", handleReposition);
        window.addEventListener("scroll", handleReposition, true);

        return () => {
            window.removeEventListener("resize", handleReposition);
            window.removeEventListener("scroll", handleReposition, true);
        };
    }, [showNotifications, updateNotificationPosition]);

    const crumbs = useMemo(() => {
        const baseCrumbs = getCrumbs(pathname);
        const campaignTitle = getCampaignTitleFromSearch(searchParams);
        const titledCrumbs = applyCampaignTitleToCrumbs(
            baseCrumbs,
            pathname,
            campaignTitle
        );

        return applyMyCampaignTabToCrumbs(
            titledCrumbs,
            pathname,
            searchParams.get("tab")
        );
    }, [pathname, searchParams]);

    const displayCrumbs = useMemo(() => {
        if (!isNarrow) return crumbs;
        if (crumbs.length <= 2) return crumbs;

        return crumbs.slice(-2);
    }, [crumbs, isNarrow]);

    const actions = useMemo(() => {
        return actionsOverride && actionsOverride.length > 0
            ? actionsOverride
            : getDefaultActions(pathname);
    }, [actionsOverride, pathname]);

    const handleNotificationToggle = () => {
        if (showNotifications) {
            setShowNotifications(false);
            return;
        }

        updateNotificationPosition();
        setShowNotifications(true);
    };

    return (
        <>
            <div
                ref={topbarRef}
                className="relative z-40 w-full border-b border-neutral-200 bg-white"
            >
                <div className="flex min-w-0 items-center gap-3 px-4 py-4 sm:px-6">
                    {showHamburger ? (
                        <button
                            type="button"
                            onClick={onMenuToggle}
                            aria-label="Open menu"
                            title="Menu"
                            className={[
                                "grid h-10 w-10 place-items-center rounded-lg border border-neutral-200 bg-white shadow-sm",
                                "transition hover:bg-neutral-50",
                            ].join(" ")}
                        >
                            <ListDashes size={22} className="text-[#1A1A1A]" />
                        </button>
                    ) : null}

                    {showHamburger ? (
                        <div
                            className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[#1A1A1A] sm:text-[16px]"
                            style={{
                                fontFamily: "var(--Font-Family-Inter, Inter)",
                            }}
                        >
                            {crumbs[crumbs.length - 1]?.label ?? ""}
                        </div>
                    ) : (
                        <nav className="flex min-w-0 flex-1 items-center gap-2">
                            {isNarrow && crumbs.length > 2 ? (
                                <span
                                    className="font-semibold text-[#B8B8B8]"
                                    style={{
                                        fontFamily: "var(--Font-Family-Inter, Inter)",
                                        fontSize: "14px",
                                        lineHeight: "20px",
                                    }}
                                >
                                    …
                                </span>
                            ) : null}

                            {displayCrumbs.map((crumb, index) => {
                                const last = index === displayCrumbs.length - 1;

                                const commonStyle: React.CSSProperties = {
                                    fontFamily: "var(--Font-Family-Inter, Inter)",
                                    fontSize: "14px",
                                    fontStyle: "normal",
                                    fontWeight: 600,
                                    lineHeight: "20px",
                                    letterSpacing: "0",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    maxWidth: isNarrow ? 140 : 220,
                                    display: "inline-block",
                                };

                                return (
                                    <React.Fragment key={crumb.href}>
                                        <Link
                                            href={crumb.href}
                                            style={{
                                                ...commonStyle,
                                                color: last ? "#1A1A1A" : "#B8B8B8",
                                            }}
                                            className="min-w-0"
                                        >
                                            {crumb.label}
                                        </Link>

                                        {!last ? (
                                            <span
                                                className="shrink-0 text-[#B8B8B8]"
                                                style={{
                                                    fontFamily: "var(--Font-Family-Inter, Inter)",
                                                    fontSize: "14px",
                                                    fontWeight: 600,
                                                    lineHeight: "20px",
                                                }}
                                            >
                                                <CaretRightIcon />
                                            </span>
                                        ) : null}
                                    </React.Fragment>
                                );
                            })}
                        </nav>
                    )}

                    <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
                        <div className="relative shrink-0" ref={notificationRef}>
                            <button
                                type="button"
                                aria-label="Notifications"
                                title="Notifications"
                                onClick={handleNotificationToggle}
                                className="grid h-10 w-10 place-items-center rounded-lg border border-bd-subtle transition hover:bg-neutral-50"
                            >
                                <BellIcon size={16} className="text-[#1A1A1A]" weight="bold" />
                            </button>
                        </div>

                        <div
                            className={[
                                "flex shrink-0 items-center gap-2 sm:gap-6",
                                "max-w-[46vw] overflow-x-auto sm:max-w-none",
                                "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                            ].join(" ")}
                        >
                            {actions.map((action) => (
                                <ActionButton key={action.key} action={action} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {showNotifications && notificationPosition ? (
                <div
                    className="fixed inset-0 z-[100]"
                    onMouseDown={() => setShowNotifications(false)}
                >
                    <div className="absolute inset-0" />

                    <div
                        className="absolute"
                        style={{
                            top: notificationPosition.top,
                            left: notificationPosition.left,
                            width: notificationPosition.width,
                        }}
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <NotificationPopover onClose={() => setShowNotifications(false)} />
                    </div>
                </div>
            ) : null}
        </>
    );
}