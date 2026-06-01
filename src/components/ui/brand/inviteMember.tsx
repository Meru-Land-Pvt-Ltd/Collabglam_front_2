// components/common/InviteMembersModal.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import type { Transition, Variants } from "framer-motion";
import {
    ArrowRight,
    CaretDown,
    CaretRight,
    Crown,
    Eye,
    EyeSlash,
    LinkSimple,
    PaperPlaneTilt,
    Prohibit,
    UserCircle,
    WarningCircle,
    X,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type ApiAccessType = "owner" | "full" | "limited" | "custom";
type AccessLabel = "Owner" | "Full Access" | "Limited Access" | "Custom Access";

type SharedAccount = {
    id: string;
    brandId?: string | null;
    name: string;
    email: string;
    access: AccessLabel;
    avatar?: string;
    role?: "owner" | "member" | string;
    rawAccessType?: ApiAccessType | string;
};

type ApiMember = {
    id: string;
    brandId?: string | null;
    name?: string;
    email: string;
    profilePic?: string;
    role?: "owner" | "member" | string;
    accessType?: ApiAccessType | string;
    permissions?: Array<{ key: string; level: string }>;
    status?: string;
};

type InviteMembersModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    brandId?: string | null;
    inviteLink?: string;
    sharedAccounts?: SharedAccount[];
    onInvite?: (payload: {
        email: string;
        access: AccessLabel;
        accessType: ApiAccessType;
    }) => void;
    onCopyLink?: (link: string) => void;
    onChangeAccess?: (payload: {
        accountId: string;
        access: AccessLabel;
        accessType: ApiAccessType;
    }) => void;
    onRemoveAccess?: (accountId: string) => void;
    onTransferOwnership?: (payload: {
        email: string;
        requiresRelogin?: boolean;
        members: SharedAccount[];
    }) => void;
};

type AccessMenuState =
    | {
        key: "invite";
        value: AccessLabel;
        savedAccount: false;
        top: number;
        left: number;
    }
    | {
        key: `account-${string}`;
        accountId: string;
        value: AccessLabel;
        savedAccount: true;
        top: number;
        left: number;
    }
    | null;

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "";

const ACCESS_MENU_WIDTH = 320;
const ACCESS_MENU_INVITE_HEIGHT = 252;
const ACCESS_MENU_SAVED_HEIGHT = 318;
const ACCESS_MENU_GAP = 10;
const VIEWPORT_PADDING = 16;

const focusRing =
    "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#1a1a1a]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

const modalTransition: Transition = {
    duration: 0.2,
    ease: [0.4, 0, 0.2, 1],
};

const fadeScale: Variants = {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
};

const defaultSharedAccounts: SharedAccount[] = [
    {
        id: "1",
        name: "Aditya",
        email: "adityakumar@collabglam.com",
        access: "Owner",
        role: "owner",
        rawAccessType: "owner",
    },
    {
        id: "2",
        name: "Ashi Kapoor",
        email: "ashik@collabglam.com",
        access: "Limited Access",
        role: "member",
        rawAccessType: "limited",
    },
    {
        id: "3",
        name: "Devansh",
        email: "Devansh@collabglam.com",
        access: "Full Access",
        role: "member",
        rawAccessType: "full",
    },
];

const accessMenuItems: Array<{
    value: Exclude<AccessLabel, "Custom Access">;
    title: string;
    description: string;
    icon: React.ElementType;
}> = [
        {
            value: "Full Access",
            title: "Full Access",
            description:
                "Can access assigned campaigns and perform specific actions based on their role.",
            icon: Eye,
        },
        {
            value: "Limited Access",
            title: "Limited Access",
            description: "Can view campaigns and workspace with restricted permissions.",
            icon: EyeSlash,
        },
        {
            value: "Owner",
            title: "Owner",
            description:
                "Transfers workspace ownership and changes the brand owner email.",
            icon: Crown,
        },
    ];

const SHARE_INVITE_DOTS = [
    { top: "12%", left: "6%", size: 8, opacity: 0.32 },
    { top: "8%", left: "19%", size: 5, opacity: 0.28 },
    { top: "18%", left: "31%", size: 7, opacity: 0.26 },
    { top: "10%", left: "62%", size: 18, opacity: 0.24 },
    { top: "17%", left: "84%", size: 8, opacity: 0.28 },
    { top: "42%", left: "11%", size: 8, opacity: 0.26 },
    { top: "47%", left: "34%", size: 7, opacity: 0.28 },
    { top: "38%", left: "64%", size: 8, opacity: 0.24 },
    { top: "41%", left: "78%", size: 7, opacity: 0.25 },
    { top: "70%", left: "2%", size: 9, opacity: 0.28 },
    { top: "83%", left: "22%", size: 7, opacity: 0.25 },
    { top: "86%", left: "36%", size: 8, opacity: 0.24 },
    { top: "88%", left: "90%", size: 8, opacity: 0.25 },
];

const titleTextStyle: React.CSSProperties = {
    fontFamily: "var(--Font-Family-Inter, Inter)",
    fontSize: "var(--Font-Size-20, 20px)",
    fontStyle: "normal",
    fontWeight: "var(--Font-Weight-Semi-Bold, 600)",
    lineHeight: "var(--Line-Height-28, 28px)",
    letterSpacing: "var(--Letter-Spacing-0, 0)",
};

const smallMediumTextStyle: React.CSSProperties = {
    fontFamily: "var(--Font-Family-Inter, Inter)",
    fontSize: "var(--Font-Size-14, 14px)",
    fontStyle: "normal",
    fontWeight: "var(--Font-Weight-Medium, 500)",
    lineHeight: "var(--Line-Height-20, 20px)",
    letterSpacing: "var(--Letter-Spacing-0, 0)",
};

const dropdownMainTextStyle: React.CSSProperties = {
    fontFamily: "var(--Font-Family-Inter, Inter)",
    fontSize: "var(--Font-Size-14, 14px)",
    fontStyle: "normal",
    fontWeight: "var(--Font-Weight-regular, 400)",
    lineHeight: "var(--Line-Height-20, 20px)",
    letterSpacing: "var(--Letter-Spacing-0, 0)",
};

const dropdownSubTextStyle: React.CSSProperties = {
    fontFamily: "Inter",
    fontSize: "10px",
    fontStyle: "normal",
    fontWeight: 400,
    lineHeight: "normal",
};

const inputTextStyle: React.CSSProperties = {
    fontFamily: "var(--Font-Family-Inter, Inter)",
    fontSize: "var(--Font-Size-16, 16px)",
    fontStyle: "normal",
    fontWeight: "var(--Font-Weight-Medium, 500)",
    lineHeight: "var(--Line-Height-24, 24px)",
    letterSpacing: "var(--Letter-Spacing-0, 0)",
};

function getAuthToken() {
    if (typeof window === "undefined") return "";

    return (
        window.localStorage.getItem("token") ||
        window.localStorage.getItem("accessToken") ||
        ""
    );
}

function getStoredBrandId() {
    if (typeof window === "undefined") return "";

    return (
        window.localStorage.getItem("brandId") ||
        window.localStorage.getItem("currentBrandId") ||
        ""
    );
}

function setStoredBrandEmail(email: string) {
    if (typeof window === "undefined") return;

    try {
        window.localStorage.setItem("brandEmail", email);
        window.localStorage.setItem("email", email);
        window.localStorage.setItem("currentBrandEmail", email);
    } catch { }
}

function buildApiUrl(path: string) {
    const base = API_BASE_URL.replace(/\/$/, "");
    return `${base}${path}`;
}

async function brandMembersRequest<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getAuthToken();

    const response = await fetch(buildApiUrl(path), {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Something went wrong.");
    }

    return data as T;
}

function apiAccessToLabel(accessType?: string, role?: string): AccessLabel {
    if (role === "owner" || accessType === "owner") return "Owner";
    if (accessType === "full") return "Full Access";
    if (accessType === "custom") return "Custom Access";
    return "Limited Access";
}

function labelToApiAccess(label: AccessLabel): ApiAccessType {
    if (label === "Owner") return "owner";
    if (label === "Full Access") return "full";
    if (label === "Custom Access") return "custom";
    return "limited";
}

function formatApiMember(member: ApiMember): SharedAccount {
    return {
        id: String(member.id),
        brandId: member.brandId ?? null,
        name: member.name || "Shared Member",
        email: member.email,
        avatar: member.profilePic || "",
        role: member.role || "member",
        rawAccessType: member.accessType || "limited",
        access: apiAccessToLabel(member.accessType, member.role),
    };
}

function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function getAccessMenuPosition(
    button: HTMLButtonElement,
    savedAccount: boolean
) {
    const rect = button.getBoundingClientRect();
    const menuHeight = savedAccount
        ? ACCESS_MENU_SAVED_HEIGHT
        : ACCESS_MENU_INVITE_HEIGHT;

    const maxLeft = window.innerWidth - ACCESS_MENU_WIDTH - VIEWPORT_PADDING;

    const left = clamp(
        rect.right - ACCESS_MENU_WIDTH,
        VIEWPORT_PADDING,
        Math.max(VIEWPORT_PADDING, maxLeft)
    );

    const belowTop = rect.bottom + ACCESS_MENU_GAP;
    const aboveTop = rect.top - menuHeight - ACCESS_MENU_GAP;

    const canOpenBelow =
        belowTop + menuHeight <= window.innerHeight - VIEWPORT_PADDING;

    const rawTop = canOpenBelow ? belowTop : aboveTop;

    const maxTop = window.innerHeight - menuHeight - VIEWPORT_PADDING;

    const top = clamp(
        rawTop,
        VIEWPORT_PADDING,
        Math.max(VIEWPORT_PADDING, maxTop)
    );

    return { top, left };
}

function ShareInviteDecorShape() {
    const gradientId = React.useId();

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="41"
            height="24"
            viewBox="0 0 41 24"
            fill="none"
            className="absolute right-[66px] top-[-8px] h-[96px] w-[164px] opacity-[0.16]"
            style={{
                transform: "rotate(-90deg)",
                transformOrigin: "center",
                mixBlendMode: "color-dodge",
            }}
            aria-hidden="true"
        >
            <g style={{ mixBlendMode: "color-dodge" }}>
                <rect
                    width="5.43425"
                    height="52.1688"
                    transform="translate(36.8906 -16.875) rotate(45)"
                    fill="#000"
                    style={{
                        fill: "#000",
                        mixBlendMode: "color-dodge",
                    }}
                />

                <ellipse
                    cx="20.3675"
                    cy="3.49074"
                    rx="2.71712"
                    ry="26.0844"
                    transform="rotate(45 20.3675 3.49074)"
                    fill={`url(#${gradientId})`}
                    style={{ mixBlendMode: "color-dodge" }}
                />
            </g>

            <defs>
                <radialGradient
                    id={gradientId}
                    cx="0"
                    cy="0"
                    r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(20.3675 3.49074) rotate(90) scale(26.0844 2.71712)"
                >
                    <stop offset="0.0364583" stopColor="#FFF1E4" />
                    <stop offset="1" stopColor="#1A1A1A" />
                </radialGradient>
            </defs>
        </svg>
    );
}

function Avatar({ account }: { account: SharedAccount }) {
    return (
        <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#F1F1F1]">
            {account.avatar ? (
                <img
                    src={account.avatar}
                    alt={account.name}
                    className="h-full w-full object-cover"
                />
            ) : (
                <UserCircle size={28} weight="fill" className="text-[#B8B8B8]" />
            )}
        </div>
    );
}

function AccessFloatingMenu({
    menu,
    loading,
    onSelect,
    onRemoveAccess,
}: {
    menu: Exclude<AccessMenuState, null>;
    loading?: boolean;
    onSelect: (access: Exclude<AccessLabel, "Custom Access">) => void;
    onRemoveAccess?: () => void;
}) {
    return (
        <m.div
            key="access-menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={modalTransition}
            className="fixed z-[180] w-[320px] rounded-[18px] bg-white p-3 shadow-[0_22px_54px_rgba(0,0,0,0.16)]"
            style={{
                top: menu.top,
                left: menu.left,
                fontFamily: "var(--Font-Family-Inter, Inter)",
            }}
            onPointerDown={(e) => e.stopPropagation()}
        >
            <div className="flex flex-col gap-1">
                {accessMenuItems.map((item) => {
                    const Icon = item.icon;
                    const active = item.value === menu.value;

                    return (
                        <button
                            key={item.value}
                            type="button"
                            disabled={loading}
                            onClick={() => onSelect(item.value)}
                            className={cn(
                                "group flex w-full items-start gap-3 rounded-[12px] px-3 py-2 text-left transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60",
                                active
                                    ? "bg-[#1A1A1A] text-white"
                                    : "text-[#1A1A1A] hover:bg-[#F5F5F5]"
                            )}
                        >
                            <Icon
                                size={16}
                                weight={item.value === "Owner" ? "fill" : "regular"}
                                className={cn(
                                    "mt-0.5 h-4 w-4 shrink-0 transition-colors",
                                    active
                                        ? "text-white"
                                        : "text-[#343330] group-hover:text-[#1A1A1A]"
                                )}
                            />

                            <div className="min-w-0 flex-1">
                                <div
                                    className={active ? "text-white" : "text-[#1A1A1A]"}
                                    style={dropdownMainTextStyle}
                                >
                                    {item.title}
                                </div>

                                <div
                                    className={cn(
                                        "mt-0.5 transition-colors",
                                        active
                                            ? "text-white/70"
                                            : "text-[#B8B8B8] group-hover:text-[#9A9A9A]"
                                    )}
                                    style={dropdownSubTextStyle}
                                >
                                    {item.description}
                                </div>
                            </div>

                            <CaretRight
                                size={16}
                                weight="regular"
                                className={cn(
                                    "mt-0.5 h-4 w-4 shrink-0 transition-colors",
                                    active
                                        ? "text-white"
                                        : "text-[#343330] group-hover:text-[#1A1A1A]"
                                )}
                            />
                        </button>
                    );
                })}
            </div>

            {menu.savedAccount && (
                <>
                    <div className="my-3 h-px w-full bg-[#E8E8E8]" />

                    <button
                        type="button"
                        disabled={loading}
                        onClick={onRemoveAccess}
                        className="group flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-left text-[#EF4444] transition-colors duration-150 hover:bg-[#FFF1F1] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Prohibit
                            size={16}
                            weight="regular"
                            className="h-4 w-4 shrink-0 text-[#EF4444]"
                        />

                        <span style={dropdownMainTextStyle}>Remove Access</span>
                    </button>
                </>
            )}
        </m.div>
    );
}

function TransferOwnershipConfirmModal({
    open,
    email,
    loading,
    onCancel,
    onConfirm,
}: {
    open: boolean;
    email: string;
    loading?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <AnimatePresence>
            {open && (
                <m.div
                    key="transfer-ownership-backdrop"
                    className="fixed inset-0 z-[240] flex items-center justify-center bg-black/60 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={modalTransition}
                    onPointerDown={() => {
                        if (!loading) onCancel();
                    }}
                >
                    <m.div
                        key="transfer-ownership-modal"
                        role="dialog"
                        aria-modal="true"
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.96 }}
                        transition={modalTransition}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="w-full max-w-[460px] rounded-[24px] bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)]"
                        style={{ fontFamily: "var(--Font-Family-Inter, Inter)" }}
                    >
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="grid h-11 w-11 place-items-center rounded-full bg-[#FFF7E8] text-[#D97706]">
                                    <Crown size={22} weight="fill" />
                                </div>

                                <div>
                                    <div className="text-[20px] font-semibold leading-7 text-[#1A1A1A]">
                                        Transfer Ownership
                                    </div>

                                    <div className="mt-0.5 text-[13px] font-medium text-[#B8B8B8]">
                                        This changes the brand owner email.
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={loading}
                                onClick={onCancel}
                                className={cn(
                                    "grid h-9 w-9 place-items-center rounded-lg text-[#1A1A1A] transition hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-50",
                                    focusRing
                                )}
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <div className="rounded-[16px] border border-[#FFE3B8] bg-[#FFF9F0] p-4">
                            <div className="flex gap-3">
                                <WarningCircle
                                    size={20}
                                    weight="fill"
                                    className="mt-0.5 shrink-0 text-[#D97706]"
                                />

                                <div>
                                    <div className="text-[14px] font-medium leading-5 text-[#1A1A1A]">
                                        Ownership will be transferred to:
                                    </div>

                                    <div className="mt-1 break-all text-[16px] font-semibold leading-6 text-[#1A1A1A]">
                                        {email}
                                    </div>

                                    <div className="mt-3 text-[12px] font-medium leading-5 text-[#6B7280]">
                                        The brand email will be updated to this email. The previous
                                        owner will become a Full Access member.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                disabled={loading}
                                onClick={onCancel}
                                className={cn(
                                    "h-11 rounded-[12px] border border-[#E8E8E8] px-5 text-[14px] font-medium text-[#1A1A1A] transition hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-50",
                                    focusRing
                                )}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={loading}
                                onClick={onConfirm}
                                className={cn(
                                    "inline-flex h-11 items-center gap-2 rounded-[12px] bg-[#1A1A1A] px-5 text-[14px] font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60",
                                    focusRing
                                )}
                            >
                                <span>{loading ? "Transferring..." : "Transfer Ownership"}</span>
                                <ArrowRight size={17} />
                            </button>
                        </div>
                    </m.div>
                </m.div>
            )}
        </AnimatePresence>
    );
}

export default function InviteMembersModal({
    open,
    onOpenChange,
    brandId,
    inviteLink = "https://collabglam.com/brand/login",
    sharedAccounts,
    onInvite,
    onCopyLink,
    onChangeAccess,
    onRemoveAccess,
    onTransferOwnership,
}: InviteMembersModalProps) {
    const [resolvedBrandId, setResolvedBrandId] = useState("");
    const [email, setEmail] = useState("");
    const [inviteAccess, setInviteAccess] =
        useState<AccessLabel>("Full Access");
    const [accessMenu, setAccessMenu] = useState<AccessMenuState>(null);
    const [apiMembers, setApiMembers] = useState<SharedAccount[] | null>(null);
    const [removedAccountIds, setRemovedAccountIds] = useState<string[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [membersError, setMembersError] = useState("");
    const [membersSuccess, setMembersSuccess] = useState("");
    const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);
    const [pendingOwnerEmail, setPendingOwnerEmail] = useState("");

    const effectiveBrandId = brandId || resolvedBrandId;
    const canInvite = useMemo(() => email.trim().length > 0, [email]);

    const sourceAccounts = apiMembers || sharedAccounts || defaultSharedAccounts;

    const visibleSharedAccounts = useMemo(() => {
        return sourceAccounts.filter(
            (account) => !removedAccountIds.includes(account.id)
        );
    }, [sourceAccounts, removedAccountIds]);

    const shouldScrollAccounts = visibleSharedAccounts.length > 3;

    const closeAccessMenu = () => {
        setAccessMenu(null);
    };

    const closeModal = () => {
        closeAccessMenu();
        setTransferConfirmOpen(false);
        setPendingOwnerEmail("");
        onOpenChange(false);
    };

    const loadMembers = useCallback(async () => {
        if (!effectiveBrandId) return;

        setMembersLoading(true);
        setMembersError("");

        try {
            const data = await brandMembersRequest<{
                success: boolean;
                brandId: string;
                members: ApiMember[];
            }>(`/brand-members/${effectiveBrandId}/members`);

            setApiMembers((data.members || []).map(formatApiMember));
            setRemovedAccountIds([]);
        } catch (error) {
            setMembersError(
                error instanceof Error ? error.message : "Failed to load members."
            );
        } finally {
            setMembersLoading(false);
        }
    }, [effectiveBrandId]);

    useEffect(() => {
        if (!open) return;

        setResolvedBrandId(brandId || getStoredBrandId());
        setMembersError("");
        setMembersSuccess("");
        setTransferConfirmOpen(false);
        setPendingOwnerEmail("");
    }, [open, brandId]);

    useEffect(() => {
        if (!open || !effectiveBrandId) return;

        loadMembers();
    }, [open, effectiveBrandId, loadMembers]);

    const openInviteAccessMenu = (button: HTMLButtonElement) => {
        if (accessMenu?.key === "invite") {
            closeAccessMenu();
            return;
        }

        const position = getAccessMenuPosition(button, false);

        setAccessMenu({
            key: "invite",
            value: inviteAccess,
            savedAccount: false,
            ...position,
        });
    };

    const openSavedAccessMenu = (
        button: HTMLButtonElement,
        accountId: string,
        value: AccessLabel
    ) => {
        const key = `account-${accountId}` as const;

        if (accessMenu?.key === key) {
            closeAccessMenu();
            return;
        }

        const position = getAccessMenuPosition(button, true);

        setAccessMenu({
            key,
            accountId,
            value,
            savedAccount: true,
            ...position,
        });
    };

    const openTransferOwnershipConfirm = (emailValue: string) => {
        const cleanEmail = emailValue.trim().toLowerCase();

        if (!cleanEmail) {
            setMembersError("Email is required to transfer ownership.");
            return;
        }

        if (!isValidEmail(cleanEmail)) {
            setMembersError("Please enter a valid email address.");
            return;
        }

        setMembersError("");
        setMembersSuccess("");
        setPendingOwnerEmail(cleanEmail);
        setTransferConfirmOpen(true);
        closeAccessMenu();
    };

    const handleInvite = async () => {
        if (!canInvite || actionLoading) return;

        if (!effectiveBrandId) {
            setMembersError("Brand ID not found.");
            return;
        }

        const cleanEmail = email.trim().toLowerCase();

        if (!isValidEmail(cleanEmail)) {
            setMembersError("Please enter a valid email address.");
            return;
        }

        if (inviteAccess === "Owner") {
            openTransferOwnershipConfirm(cleanEmail);
            return;
        }

        const accessType = labelToApiAccess(inviteAccess);

        setActionLoading(true);
        setMembersError("");
        setMembersSuccess("");

        try {
            const data = await brandMembersRequest<{
                success: boolean;
                message: string;
                loginLink?: string;
                member: ApiMember;
            }>(`/brand-members/${effectiveBrandId}/members/invite`, {
                method: "POST",
                body: JSON.stringify({
                    email: cleanEmail,
                    accessType,
                }),
            });

            const nextMember = formatApiMember(data.member);

            setApiMembers((prev) => {
                const existing = prev || sourceAccounts;
                const withoutDuplicate = existing.filter(
                    (item) => item.email.toLowerCase() !== cleanEmail
                );

                return [...withoutDuplicate, nextMember];
            });

            onInvite?.({
                email: cleanEmail,
                access: inviteAccess,
                accessType,
            });

            setEmail("");
            setInviteAccess("Full Access");
            setMembersSuccess(data.message || "Invite created successfully.");
            closeAccessMenu();
        } catch (error) {
            setMembersError(
                error instanceof Error ? error.message : "Failed to invite member."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setMembersSuccess("Invite link copied.");
            setMembersError("");
        } catch {
            setMembersError("Failed to copy invite link.");
        }

        onCopyLink?.(inviteLink);
    };

    const handleAccessSelect = async (
        access: Exclude<AccessLabel, "Custom Access">
    ) => {
        if (!accessMenu || actionLoading) return;

        if (accessMenu.key === "invite") {
            setInviteAccess(access);
            closeAccessMenu();
            return;
        }

        if (!effectiveBrandId || !accessMenu.savedAccount) return;

        const selectedAccount = visibleSharedAccounts.find(
            (item) => item.id === accessMenu.accountId
        );

        if (access === "Owner") {
            if (!selectedAccount?.email) {
                setMembersError("Member email not found.");
                return;
            }

            openTransferOwnershipConfirm(selectedAccount.email);
            return;
        }

        const accessType = labelToApiAccess(access);

        setActionLoading(true);
        setMembersError("");
        setMembersSuccess("");

        try {
            const data = await brandMembersRequest<{
                success: boolean;
                message: string;
                member: ApiMember;
            }>(
                `/brand-members/${effectiveBrandId}/members/${accessMenu.accountId}/access`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        accessType,
                    }),
                }
            );

            const updatedMember = formatApiMember(data.member);

            setApiMembers((prev) =>
                (prev || sourceAccounts).map((item) =>
                    item.id === accessMenu.accountId ? updatedMember : item
                )
            );

            onChangeAccess?.({
                accountId: accessMenu.accountId,
                access,
                accessType,
            });

            setMembersSuccess(data.message || "Member access updated successfully.");
            closeAccessMenu();
        } catch (error) {
            setMembersError(
                error instanceof Error ? error.message : "Failed to update access."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveAccess = async () => {
        if (!accessMenu || !accessMenu.savedAccount || actionLoading) return;

        if (!effectiveBrandId) {
            setMembersError("Brand ID not found.");
            return;
        }

        const accountId = accessMenu.accountId;

        setActionLoading(true);
        setMembersError("");
        setMembersSuccess("");

        try {
            const data = await brandMembersRequest<{
                success: boolean;
                message: string;
            }>(`/brand-members/${effectiveBrandId}/members/${accountId}`, {
                method: "DELETE",
            });

            setRemovedAccountIds((prev) =>
                prev.includes(accountId) ? prev : [...prev, accountId]
            );

            setApiMembers((prev) =>
                prev ? prev.filter((item) => item.id !== accountId) : prev
            );

            onRemoveAccess?.(accountId);
            setMembersSuccess(data.message || "Member access removed successfully.");
            closeAccessMenu();
        } catch (error) {
            setMembersError(
                error instanceof Error ? error.message : "Failed to remove access."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleConfirmTransferOwnership = async () => {
        if (!pendingOwnerEmail || actionLoading) return;

        if (!effectiveBrandId) {
            setMembersError("Brand ID not found.");
            return;
        }

        setActionLoading(true);
        setMembersError("");
        setMembersSuccess("");

        try {
            const data = await brandMembersRequest<{
                success: boolean;
                message: string;
                requiresRelogin?: boolean;
                owner?: ApiMember;
                previousOwnerMember?: ApiMember;
                members?: ApiMember[];
            }>(`/brand-members/${effectiveBrandId}/members/transfer-ownership`, {
                method: "POST",
                body: JSON.stringify({
                    email: pendingOwnerEmail,
                }),
            });

            const formattedMembers = (data.members || []).map(formatApiMember);

            if (formattedMembers.length) {
                setApiMembers(formattedMembers);
            } else {
                await loadMembers();
            }

            setStoredBrandEmail(pendingOwnerEmail);

            onTransferOwnership?.({
                email: pendingOwnerEmail,
                requiresRelogin: data.requiresRelogin,
                members: formattedMembers,
            });

            setEmail("");
            setInviteAccess("Full Access");
            setPendingOwnerEmail("");
            setTransferConfirmOpen(false);
            setMembersSuccess(
                data.requiresRelogin
                    ? "Ownership transferred. Please login again with the new owner email."
                    : data.message || "Ownership transferred successfully."
            );
            closeAccessMenu();
        } catch (error) {
            setMembersError(
                error instanceof Error
                    ? error.message
                    : "Failed to transfer ownership."
            );
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <m.div
                    key="invite-members-backdrop"
                    className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={modalTransition}
                    onPointerDown={closeModal}
                >
                    <m.div
                        key="invite-members-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="invite-members-title"
                        variants={fadeScale}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={modalTransition}
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            closeAccessMenu();
                        }}
                        className="w-full max-w-[906px] overflow-visible rounded-[24px] bg-white px-8 py-7 shadow-[0_24px_70px_rgba(0,0,0,0.28)]"
                        style={{ fontFamily: "var(--Font-Family-Inter, Inter)" }}
                    >
                        <div className="flex items-center justify-between border-b border-[#E8E8E8] pb-4">
                            <h2
                                id="invite-members-title"
                                className="text-[#1A1A1A]"
                                style={titleTextStyle}
                            >
                                Invite Members
                            </h2>

                            <button
                                type="button"
                                aria-label="Close invite members modal"
                                onClick={closeModal}
                                className={cn(
                                    "grid h-9 w-9 place-items-center rounded-lg text-[#1A1A1A] transition hover:bg-[#F5F5F5]",
                                    focusRing
                                )}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="mt-7 flex gap-5">
                            <div className="flex h-[58px] min-w-0 flex-1 items-center rounded-[14px] border border-[#D9D9D9] bg-white px-4">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setMembersError("");
                                        setMembersSuccess("");
                                    }}
                                    placeholder="enter email address to share the invite"
                                    className="min-w-0 flex-1 bg-transparent text-[#1A1A1A] outline-none placeholder:text-[#B8B8B8]"
                                    style={inputTextStyle}
                                />

                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => openInviteAccessMenu(e.currentTarget)}
                                    className={cn(
                                        "inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-transparent pl-4 pr-1 text-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-60",
                                        focusRing
                                    )}
                                    style={smallMediumTextStyle}
                                >
                                    <span>{inviteAccess}</span>
                                    <CaretDown size={18} />
                                </button>
                            </div>

                            <button
                                type="button"
                                disabled={!canInvite || actionLoading}
                                onClick={handleInvite}
                                className={cn(
                                    "inline-flex h-[58px] w-[146px] shrink-0 items-center justify-center gap-2 rounded-[14px] bg-[#1A1A1A] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50",
                                    focusRing
                                )}
                            >
                                {inviteAccess === "Owner" ? (
                                    <Crown size={20} weight="fill" />
                                ) : (
                                    <PaperPlaneTilt size={20} weight="fill" />
                                )}

                                <span className="text-[18px] font-semibold leading-6">
                                    {actionLoading
                                        ? inviteAccess === "Owner"
                                            ? "Checking..."
                                            : "Sending..."
                                        : inviteAccess === "Owner"
                                            ? "Transfer"
                                            : "Invite"}
                                </span>
                            </button>
                        </div>

                        {membersError && (
                            <div className="mt-4 rounded-xl bg-[#FFF1F1] px-4 py-3 text-[13px] font-medium text-[#EF4444]">
                                {membersError}
                            </div>
                        )}

                        {membersSuccess && (
                            <div className="mt-4 rounded-xl bg-[#F0FFF4] px-4 py-3 text-[13px] font-medium text-[#12805C]">
                                {membersSuccess}
                            </div>
                        )}

                        <div className="relative mt-7 overflow-hidden rounded-[18px] border border-[#E9E0EE] bg-[linear-gradient(90deg,#EAF5FB_0%,#EBDDEC_52%,#E8D9EA_100%)] p-6">
                            <div
                                className="pointer-events-none absolute inset-0"
                                aria-hidden="true"
                            >
                                <div className="absolute inset-x-0 top-0 h-[58%] bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0)_100%)]" />

                                <ShareInviteDecorShape />

                                {SHARE_INVITE_DOTS.map((dot, index) => (
                                    <span
                                        key={index}
                                        className="absolute rounded-full bg-white"
                                        style={{
                                            top: dot.top,
                                            left: dot.left,
                                            width: dot.size,
                                            height: dot.size,
                                            opacity: dot.opacity,
                                            boxShadow: "0 0 8px rgba(255,255,255,0.18)",
                                        }}
                                    />
                                ))}
                            </div>

                            <div className="relative z-10">
                                <div
                                    className="mb-4 text-[#1A1A1A]"
                                    style={smallMediumTextStyle}
                                >
                                    Share Invite Link
                                </div>

                                <div className="flex h-[56px] items-center justify-center self-stretch rounded-[12px] bg-[rgba(255,255,255,0.20)] p-[2px]">
                                    <div className="flex h-[52px] w-full items-center justify-center rounded-[12px] bg-[rgba(255,255,255,0.20)] p-[2px]">
                                        <div className="flex h-[48px] w-full items-center justify-center rounded-[10px] bg-[rgba(255,255,255,0.40)] p-[2px]">
                                            <div className="flex flex-1 items-center justify-between self-stretch rounded-[8px] bg-[var(--Fill-Inverse-strong,#FFF)] p-[10px]">
                                                <span
                                                    className="min-w-0 truncate pr-4 text-[#B8B8B8]"
                                                    style={inputTextStyle}
                                                >
                                                    {inviteLink}
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={handleCopyLink}
                                                    className={cn(
                                                        "inline-flex shrink-0 items-center gap-2 rounded-lg px-2 py-1 text-[#1A1A1A] transition hover:bg-[#F5F5F5]",
                                                        focusRing
                                                    )}
                                                    style={smallMediumTextStyle}
                                                >
                                                    <LinkSimple size={18} />
                                                    <span>Copy Link</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <div className="mb-5 flex items-center justify-between">
                                <h3 className="text-[#1A1A1A]" style={titleTextStyle}>
                                    Accounts Share With
                                </h3>

                                <button
                                    type="button"
                                    aria-label="View shared accounts"
                                    className={cn(
                                        "grid h-9 w-9 place-items-center rounded-lg text-[#1A1A1A] transition hover:bg-[#F5F5F5]",
                                        focusRing
                                    )}
                                >
                                    <CaretDown size={22} className="-rotate-90" />
                                </button>
                            </div>

                            <div
                                className={cn(
                                    shouldScrollAccounts
                                        ? "max-h-[260px] overflow-y-auto pr-2"
                                        : "overflow-visible pr-0"
                                )}
                            >
                                <div className="flex flex-col gap-5">
                                    {membersLoading ? (
                                        <div className="rounded-xl border border-dashed border-[#E8E8E8] px-4 py-6 text-center text-[14px] font-medium text-[#B8B8B8]">
                                            Loading members...
                                        </div>
                                    ) : (
                                        visibleSharedAccounts.map((account) => {
                                            const isOwner =
                                                account.role === "owner" ||
                                                account.rawAccessType === "owner" ||
                                                account.access === "Owner";

                                            return (
                                                <div
                                                    key={account.id}
                                                    className="flex items-center justify-between gap-5"
                                                >
                                                    <div className="flex min-w-0 items-center gap-4">
                                                        <Avatar account={account} />

                                                        <div className="min-w-0">
                                                            <div className="truncate text-[20px] font-medium leading-7 text-[#1A1A1A]">
                                                                {account.name}
                                                            </div>

                                                            <div className="truncate text-[14px] font-medium leading-5 text-[#B8B8B8]">
                                                                {account.email}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {isOwner ? (
                                                        <div
                                                            className="inline-flex shrink-0 items-center gap-2 rounded-lg px-2 py-1 text-[#1A1A1A]"
                                                            style={smallMediumTextStyle}
                                                        >
                                                            <span>Owner</span>
                                                            <Crown size={16} weight="fill" />
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            disabled={actionLoading}
                                                            onPointerDown={(e) => e.stopPropagation()}
                                                            onClick={(e) =>
                                                                openSavedAccessMenu(
                                                                    e.currentTarget,
                                                                    account.id,
                                                                    account.access
                                                                )
                                                            }
                                                            className={cn(
                                                                "inline-flex shrink-0 items-center gap-2 rounded-lg px-2 py-1 text-[#1A1A1A] transition hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-60",
                                                                focusRing
                                                            )}
                                                            style={smallMediumTextStyle}
                                                        >
                                                            <span>{account.access}</span>
                                                            <CaretDown size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}

                                    {!membersLoading && visibleSharedAccounts.length === 0 && (
                                        <div className="rounded-xl border border-dashed border-[#E8E8E8] px-4 py-6 text-center text-[14px] font-medium text-[#B8B8B8]">
                                            No shared accounts available.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <AnimatePresence>
                            {accessMenu && (
                                <AccessFloatingMenu
                                    menu={accessMenu}
                                    loading={actionLoading}
                                    onSelect={handleAccessSelect}
                                    onRemoveAccess={handleRemoveAccess}
                                />
                            )}
                        </AnimatePresence>

                        <TransferOwnershipConfirmModal
                            open={transferConfirmOpen}
                            email={pendingOwnerEmail}
                            loading={actionLoading}
                            onCancel={() => {
                                if (actionLoading) return;
                                setTransferConfirmOpen(false);
                                setPendingOwnerEmail("");
                            }}
                            onConfirm={handleConfirmTransferOwnership}
                        />
                    </m.div>
                </m.div>
            )}
        </AnimatePresence>
    );
}