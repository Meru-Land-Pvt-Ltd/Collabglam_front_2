"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  LazyMotion,
  MotionConfig,
  domAnimation,
  m,
  useReducedMotion,
} from "framer-motion";
import type { Transition, Variants } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import HelpDialog, { type SupportMenuKey } from "@/components/common/HelpDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  CardsThree,
  DotsThree,
  EnvelopeSimpleIcon,
  ImageIcon,
  Lightning,
  PaperPlaneTilt,
  Question,
  SignOut,
  SuitcaseIcon,
  UserIcon,
  WalletIcon,
  X,
} from "@phosphor-icons/react";
import { Megaphone } from "lucide-react";

/* -------------------------------- utils -------------------------------- */

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
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

function useViewportWidth(fallback = 375) {
  const [w, setW] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerWidth : fallback
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setW(window.innerWidth);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return w;
}

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#1a1a1a]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

const ACTIVE_NAV = "bg-[#1a1a1a] text-white";
const HOVER_NAV = "hover:bg-[#1a1a1a]/10 hover:text-[#1a1a1a]";
const REST_NAV = "text-[#1a1a1a]";

const UPGRADE_REST =
  "radial-gradient(140% 140% at 0% 20%, rgba(255, 140, 1, 0.80) 5%, rgba(255, 191, 0, 0.30) 31%, rgba(255, 255, 255, 0.50) 100%)";

const UPGRADE_HOVER =
  "radial-gradient(140% 140% at 0% 20%, rgba(255, 140, 1, 0.80) 8%, rgba(255, 191, 0, 0.40) 51%, rgba(255, 255, 255, 0.50) 100%)";

const UPGRADE_COLLAPSED =
  "radial-gradient(140% 140% at 0% 20%, rgba(255, 140, 1, 0.80) 5%, rgba(255, 191, 0, 0.40) 31%, rgba(255, 255, 255, 0.50) 80%)";

const upgradeSpring: Transition = {
  type: "spring",
  mass: 1,
  stiffness: 100,
  damping: 15,
};

const upgradeShellStyle: React.CSSProperties = {
  borderRadius: "var(--Spacing-8, 8px)",
  border: "1.5px solid var(--Neutrals-75, #F5F5F5)",
};

const SUPPORT_NAV_PATHS = [
  "/influencer/support-centre",
  "/influencer/disputes",
  "/influencer/report-issue",
  "/privacy-policy",
];

function isSupportPath(pathname?: string | null) {
  const p = pathname || "";
  return SUPPORT_NAV_PATHS.some(
    (path) => p === path || p.startsWith(`${path}/`)
  );
}

function titleCasePlan(value: string | null) {
  if (!value) return "Free";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/* -------------------------------- types -------------------------------- */

type Item = {
  key: string;
  label: string;
  icon: React.ElementType;
  section: "main" | "footer";
  href: string;
  right?: React.ReactNode;
};

type PayoutSummary = {
  influencerId: string;
  totalPaid: number;
  totalUpcoming: number;
  totalInitiated: number;
};

type InfluencerProfile = {
  name?: string;
  email?: string;
  profileImage?: string;
  planId?: string | null;
  planName?: string | null;
  expiresAt?: string | null;
};

export type InfluencerSidebarProps = {
  drawerOpen?: boolean;
  setDrawerOpen?: (open: boolean) => void;
  campaignBadge?: React.ReactNode;
  appliedBadge?: React.ReactNode;
  messagesBadge?: React.ReactNode;
  influencerId?: string;
  token?: string;
  onLogout?: () => void;
};

/* ------------------------------ api helper ------------------------------ */

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000"
).replace(/\/+$/, "");

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function pickString(
  source: Record<string, unknown> | null | undefined,
  keys: string[]
) {
  if (!source) return "";

  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return "";
}

function getCookieValue(name: string) {
  if (typeof document === "undefined") return "";

  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${escaped}=([^;]*)`)
  );

  return match ? decodeURIComponent(match[1]) : "";
}

function getLocalValue(keys: string[]) {
  if (typeof window === "undefined") return "";

  for (const key of keys) {
    try {
      const value =
        window.localStorage.getItem(key) ||
        window.sessionStorage.getItem(key);

      if (value && value.trim()) return value.trim();
    } catch {
      // ignore storage access errors
    }
  }

  return "";
}

function decodeJwtPayload(tokenValue?: string) {
  if (!tokenValue || typeof window === "undefined") return null;

  try {
    const payload = tokenValue.split(".")[1];
    if (!payload) return null;

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "="
    );

    return JSON.parse(window.atob(paddedPayload)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function resolveInfluencerAuth(
  influencerIdProp?: string,
  tokenProp?: string
) {
  const tokenValue =
    tokenProp?.trim() ||
    getLocalValue([
      "influencer_token",
      "influencerToken",
      "token",
      "accessToken",
    ]) ||
    getCookieValue("influencer_token") ||
    getCookieValue("token") ||
    getCookieValue("brand_token");

  const decodedToken = decodeJwtPayload(tokenValue);

  const influencerIdValue =
    influencerIdProp?.trim() ||
    getLocalValue([
      "influencerId",
      "currentInfluencerId",
      "influencer_id",
      "userId",
      "_id",
    ]) ||
    getCookieValue("influencerId") ||
    getCookieValue("influencer_id") ||
    pickString(decodedToken, [
      "influencerId",
      "influencer_id",
      "_id",
      "id",
      "userId",
      "sub",
    ]);

  return {
    influencerId: influencerIdValue,
    token: tokenValue,
  };
}

function normalizeProfileImageSrc(value: string) {
  const src = String(value || "").trim();

  if (!src) return "";
  if (/^(https?:|data:|blob:)/i.test(src)) return src;
  if (src.startsWith("//")) return `https:${src}`;

  return `${API_BASE_URL}/${src.replace(/^\/+/, "")}`;
}

function pickProfileImage(source: unknown): string {
  const record = asRecord(source);
  if (!record) return "";

  const directImage = pickString(record, [
    "profileImage",
    "profilePic",
    "profilePicture",
    "profilePictureUrl",
    "profile_image",
    "profile_image_url",
    "profile_pic",
    "profile_pic_url",
    "avatar",
    "avatarUrl",
    "image",
    "imageUrl",
    "photo",
    "photoUrl",
    "picture",
    "pictureUrl",
    "thumbnail",
    "thumbnailUrl",
    "url",
  ]);

  if (directImage) return directImage;

  for (const nestedKey of ["profile", "user", "owner", "account"]) {
    const nestedImage = pickProfileImage(record[nestedKey]);
    if (nestedImage) return nestedImage;
  }

  return "";
}

function normalizeInfluencerLite(raw: unknown): InfluencerProfile {
  const root = asRecord(raw) ?? {};
  const data =
    asRecord(root.data) ||
    asRecord(root.influencer) ||
    asRecord(root.user) ||
    root;

  const primaryProfile = asRecord(data.primaryProfile);

  const socialProfiles = Array.isArray(data.socialProfiles)
    ? data.socialProfiles
    : [];

  const image =
    pickProfileImage(data) ||
    pickProfileImage(primaryProfile) ||
    socialProfiles.map(pickProfileImage).find(Boolean) ||
    "";

  const name =
    pickString(data, ["name", "fullName", "displayName", "username"]) ||
    pickString(primaryProfile, [
      "name",
      "fullName",
      "displayName",
      "username",
      "handle",
    ]) ||
    "Profile";

  const email = pickString(data, ["email", "proxyEmail", "contactEmail"]);

  const subscription = asRecord(data.subscription) || asRecord(data.subscriptionDetails);

  const planName =
    pickString(data, ["planName", "brandPlanName", "influencerPlanName", "plan"]) ||
    pickString(subscription, ["planName", "brandPlanName", "influencerPlanName", "plan"]);

  const planId =
    pickString(data, ["planId", "brandPlanId", "influencerPlanId"]) ||
    pickString(subscription, ["planId", "brandPlanId", "influencerPlanId"]);

  const expiresAt =
    pickString(data, ["expiresAt", "subscriptionExpiresAt"]) ||
    pickString(subscription, ["expiresAt", "subscriptionExpiresAt"]);

  return {
    name,
    email,
    profileImage: normalizeProfileImageSrc(image),
    planId: planId || null,
    planName: planName || null,
    expiresAt: expiresAt || null,
  };
}

async function apiGetInfluencerLite(
  influencerId?: string,
  token?: string
): Promise<InfluencerProfile> {
  const trimmedInfluencerId = influencerId?.trim() || "";
  const query = trimmedInfluencerId
    ? `?influencerId=${encodeURIComponent(trimmedInfluencerId)}`
    : "";

  const res = await fetch(`${API_BASE_URL}/influencer/lite${query}`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    let message = "Failed to fetch influencer lite profile";

    try {
      const errorData = await res.json();
      message = String(errorData?.message || message);
    } catch {
      // ignore invalid json
    }

    throw new Error(message);
  }

  return normalizeInfluencerLite(await res.json());
}

/* ------------------------------ small components ------------------------------ */

function PanelCaretGlyph({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M16.5 0H1.5C1.10218 0 0.720644 0.158035 0.43934 0.43934C0.158035 0.720644 0 1.10218 0 1.5V16.5C0 16.8978 0.158035 17.2794 0.43934 17.5607C0.720644 17.842 1.10218 18 1.5 18H16.5C16.8978 18 17.2794 17.842 17.5607 17.5607C17.842 17.2794 18 16.8978 18 16.5V1.5C18 1.10218 17.842 0.720644 17.5607 0.43934C17.2794 0.158035 16.8978 0 16.5 0ZM1.5 1.5H13.5V16.5H1.5V1.5ZM16.5 16.5H15V1.5H16.5V16.5Z"
        fill="currentColor"
      />
      {dir === "right" ? (
        <path
          d="M7.25 5.5L10.75 9L7.25 12.5"
          transform="translate(-1.1 0)"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M10.75 5.5L7.25 9L10.75 12.5"
          transform="translate(-1.1 0)"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function SidebarTooltip({
  content,
  children,
  side = "right",
}: {
  content: string;
  children: React.ReactElement;
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{content}</TooltipContent>
    </Tooltip>
  );
}

type RailIconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  children: React.ReactNode;
  label: string;
  hasIndicator?: boolean;
  tight?: boolean;
};

const RailIconButtonBase = React.forwardRef<HTMLButtonElement, RailIconButtonProps>(
  function RailIconButton(
    {
      active,
      children,
      label,
      hasIndicator,
      tight,
      className,
      type,
      ...props
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        aria-label={label}
        className={cn(
          "grid place-items-center rounded-lg transition cursor-pointer",
          tight ? "h-11 w-11" : "h-12 w-12",
          FOCUS_RING,
          REST_NAV,
          active ? ACTIVE_NAV : HOVER_NAV,
          className
        )}
        {...props}
      >
        <span className="relative grid place-items-center text-current">
          {children}
          {hasIndicator ? (
            <span
              className={cn(
                "absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full",
                active ? "bg-white" : "bg-[#1a1a1a]"
              )}
            />
          ) : null}
        </span>
      </button>
    );
  }
);

RailIconButtonBase.displayName = "RailIconButton";
const RailIconButton = React.memo(RailIconButtonBase);

const RowButton = React.memo(function RowButton({
  active,
  icon: Icon,
  label,
  right,
  onClick,
  hideLabel,
  tight,
}: {
  active?: boolean;
  icon: React.ElementType;
  label: string;
  right?: React.ReactNode;
  onClick?: () => void;
  hideLabel?: boolean;
  tight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex w-full items-center gap-2 rounded-lg transition cursor-pointer justify-start",
        tight ? "h-9 px-2.5 py-2" : "h-10 px-3 py-2",
        FOCUS_RING,
        REST_NAV,
        active ? ACTIVE_NAV : HOVER_NAV
      )}
      style={{ fontFamily: "var(--Font-Family-Inter, Inter)" }}
    >
      <Icon size={20} weight="regular" className="text-current" />

      <span
        className={cn(
          tight ? "text-[13px]" : "text-[14px]",
          "leading-5 whitespace-nowrap text-current",
          hideLabel
            ? "opacity-0 w-0 overflow-hidden pointer-events-none"
            : "opacity-100"
        )}
        style={{ transition: "opacity 180ms ease, width 180ms ease" }}
      >
        {label}
      </span>

      {right ? (
        <span
          className={cn(
            "ml-auto inline-flex items-center whitespace-nowrap text-current",
            hideLabel
              ? "opacity-0 w-0 overflow-hidden pointer-events-none"
              : "opacity-100"
          )}
          style={{ transition: "opacity 180ms ease, width 180ms ease" }}
        >
          {right}
        </span>
      ) : null}
    </button>
  );
});

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-neutral-100 px-1.5 text-[11px] text-[#1a1a1a]">
      {children}
    </span>
  );
}

function WalletSummary({
  summary,
  hideLabel,
}: {
  summary: PayoutSummary | null;
  hideLabel?: boolean;
}) {
  if (!summary || hideLabel) return null;

  const balance =
    Number(summary.totalPaid || 0) +
    Number(summary.totalUpcoming || 0) +
    Number(summary.totalInitiated || 0);

  return (
    <div className="mt-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3">
      <div className="mb-3">
        <p className="text-[12px] text-neutral-500">Balance</p>
        <p className="text-[20px] font-semibold text-[#1a1a1a]">₹{balance}</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-neutral-600">Paid</span>
          <span className="font-medium text-[#1a1a1a]">₹{summary.totalPaid}</span>
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-neutral-600">Upcoming</span>
          <span className="font-medium text-[#1a1a1a]">
            ₹{summary.totalUpcoming}
          </span>
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-neutral-600">Initiated</span>
          <span className="font-medium text-[#1a1a1a]">
            ₹{summary.totalInitiated}
          </span>
        </div>
      </div>
    </div>
  );
}

function ProfileMenu({
  open,
  onClose,
  onProfile,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  onProfile: () => void;
  onLogout: () => void;
}) {
  if (!open) return null;

  return (
    <div className="absolute bottom-[68px] right-0 z-[120] w-[200px] rounded-[18px] border border-neutral-200 bg-white p-3 shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
      <button
        type="button"
        onClick={() => {
          onProfile();
          onClose();
        }}
        className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-[#222] transition hover:bg-neutral-50"
      >
        <UserIcon size={20} weight="regular" />
        <span className="text-[14px] font-medium">Profile</span>
      </button>

      <div className="my-2.5 h-px w-full bg-neutral-200" />

      <button
        type="button"
        onClick={() => {
          onLogout();
          onClose();
        }}
        className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-[#F04E3E] transition hover:bg-red-50"
      >
        <SignOut size={20} weight="regular" />
        <span className="text-[14px] font-medium">Logout</span>
      </button>
    </div>
  );
}

/* -------------------------------- sidebar -------------------------------- */

export default function Sidebar({
  drawerOpen: drawerOpenProp,
  setDrawerOpen: setDrawerOpenProp,
  campaignBadge,
  appliedBadge,
  messagesBadge,
  influencerId,
  token,
  onLogout,
}: InfluencerSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isXl = useMediaQuery("(min-width: 1280px)");
  const isShort = useMediaQuery("(max-height: 800px)");
  const vw = useViewportWidth();

  const payoutSummary = null as PayoutSummary | null;
  const [profileData, setProfileData] = useState<InfluencerProfile | null>(null);
  const [authContext, setAuthContext] = useState(() =>
    resolveInfluencerAuth(influencerId, token)
  );
  const [profileImageError, setProfileImageError] = useState(false);

  const [active, setActive] = useState<string>("");
  const [collapsed, setCollapsed] = useState(false);
  const [widthCollapsed, setWidthCollapsed] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [drawerOpenInternal, setDrawerOpenInternal] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [helpDialogPosition, setHelpDialogPosition] = useState({
    top: 0,
    left: 0,
  });

  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const helpAnchorRef = useRef<HTMLDivElement | null>(null);
  const helpDialogRef = useRef<HTMLDivElement | null>(null);

  const drawerOpen = drawerOpenProp ?? drawerOpenInternal;

  const profileName = profileData?.name?.trim() || "Profile";
  const profileEmail = profileData?.email?.trim() || "";
  const profileImage = profileData?.profileImage?.trim() || "";
  const showProfileImage = Boolean(profileImage) && !profileImageError;

  const normalizedPlanName = useMemo(
    () => (profileData?.planName ? profileData.planName.trim().toLowerCase() : null),
    [profileData?.planName]
  );

  const isPaidPlan = useMemo(() => {
    if (!normalizedPlanName) return false;
    return !["free", "basic", "trial"].includes(normalizedPlanName);
  }, [normalizedPlanName]);

  const planLabel = useMemo(
    () => titleCasePlan(normalizedPlanName),
    [normalizedPlanName]
  );

  const upgradeCardTitle = isPaidPlan ? "Manage Plan" : "Upgrade to PRO";
  const upgradeCardDesc = isPaidPlan
    ? `You are currently on the ${planLabel} plan`
    : "Upgrade anytime. No long-term commitment";

  const setDrawerOpen = useCallback(
    (open: boolean) => {
      if (setDrawerOpenProp) setDrawerOpenProp(open);
      else setDrawerOpenInternal(open);
    },
    [setDrawerOpenProp]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuOpen]);

  useEffect(() => {
    setAuthContext(resolveInfluencerAuth(influencerId, token));
  }, [influencerId, token]);

  useEffect(() => {
    setProfileImageError(false);
  }, [profileImage]);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const res = await apiGetInfluencerLite(
          authContext.influencerId,
          authContext.token
        );

        if (!cancelled) setProfileData(res);
      } catch (error) {
        console.error("Failed to load influencer lite profile:", error);
        if (!cancelled) setProfileData(null);
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [authContext.influencerId, authContext.token]);

  useEffect(() => {
    if (!helpDialogOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHelpDialogOpen(false);
    };

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;

      const dialogEl = helpDialogRef.current;
      const anchorEl = helpAnchorRef.current;

      if (dialogEl?.contains(target)) return;
      if (anchorEl?.contains(target)) return;

      setHelpDialogOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [helpDialogOpen]);

  const items = useMemo<Item[]>(
    () => [
      {
        key: "dashboard",
        label: "Dashboard",
        icon: CardsThree,
        section: "main",
        href: "/influencer/dashboards",
      },
      {
        key: "discover-campaigns",
        label: "Discover Campaigns",
        icon: Megaphone,
        section: "main",
        href: "/influencer/discover-campaigns",
        right:
          campaignBadge != null ? <Badge>{campaignBadge}</Badge> : undefined,
      },
      {
        key: "invitations",
        label: "Direct Invitations",
        icon: EnvelopeSimpleIcon,
        section: "main",
        href: "/influencer/invitations",
        right:
          campaignBadge != null ? <Badge>{campaignBadge}</Badge> : undefined,
      },
      {
        key: "my-campaigns",
        label: "My Campaigns",
        icon: SuitcaseIcon,
        section: "main",
        href: "/influencer/my-campaigns",
        right:
          appliedBadge != null ? <Badge>{appliedBadge}</Badge> : undefined,
      },
      {
        key: "messages",
        label: "Inbox",
        icon: PaperPlaneTilt,
        section: "main",
        href: "/influencer/inbox",
        right:
          messagesBadge != null ? <Badge>{messagesBadge}</Badge> : undefined,
      },
      {
        key: "wallet-payments",
        label: "Wallet & Payments",
        icon: WalletIcon,
        section: "main",
        href: "/influencer/wallets-payments",
      },
      {
        key: "media-kit",
        label: "Media Kit",
        icon: ImageIcon,
        section: "main",
        href: "/influencer/media-kit",
      },
      {
        key: "support",
        label: "Help",
        icon: Question,
        section: "footer",
        href: "/influencer/support-centre",
      },
    ],
    [campaignBadge, appliedBadge, messagesBadge]
  );

  const helpMenuItems = useMemo<Array<{ key: SupportMenuKey; label: string }>>(
    () => [
      { key: "dispute", label: "Dispute" },
      // { key: "report_issue", label: "Report an Issue" },
      // { key: "help_center", label: "Help Center" },
      { key: "privacy_policy", label: "Privacy Policy" },
    ],
    []
  );

  const mainItems = useMemo(
    () => items.filter((i) => i.section === "main"),
    [items]
  );

  const footerItems = useMemo(
    () => items.filter((i) => i.section === "footer"),
    [items]
  );

  useEffect(() => {
    const p = pathname || "";

    if (isSupportPath(p)) {
      setActive("support");
      return;
    }

    const matched = items.find(
      (item) => item.href === p || p.startsWith(item.href + "/")
    );
    setActive(matched?.key ?? "dashboard");
  }, [pathname, items]);

  useEffect(() => {
    if (isDesktop) {
      setDrawerOpen(false);
      setCollapsed(false);
      setIsClosing(false);
      setWidthCollapsed(false);
      setProfileMenuOpen(false);
      setHelpDialogOpen(false);
    } else {
      setCollapsed(false);
      setIsClosing(false);
      setWidthCollapsed(false);
    }
  }, [isDesktop, setDrawerOpen]);

  const compactUI = isDesktop ? collapsed || isClosing : false;
  const tight = isShort;
  const visualActiveKey = helpDialogOpen ? "support" : active;

  const motionTransitions = useMemo(() => {
    const content: Transition = reduceMotion
      ? { duration: 0 }
      : { duration: 0.2, ease: [0.4, 0, 0.2, 1] };

    const aside: Transition = reduceMotion
      ? { duration: 0 }
      : { type: "spring", stiffness: 320, damping: 32, mass: 0.9 };

    const drawer: Transition = reduceMotion
      ? { duration: 0 }
      : { type: "spring", stiffness: 420, damping: 38, mass: 0.85 };

    return { content, aside, drawer };
  }, [reduceMotion]);

  const fadeScale: Variants = useMemo(
    () => ({
      initial: { opacity: 0, scale: 0.96 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.96 },
    }),
    []
  );

  const handleSetActive = useCallback(
    (key: string) => {
      const item = items.find((x) => x.key === key);
      if (!item) return;
      setActive(key);
      router.push(item.href);
      if (!isDesktop) setDrawerOpen(false);
    },
    [items, router, isDesktop, setDrawerOpen]
  );

  const handlePlanClick = useCallback(() => {
    router.push("/influencer/subscriptions");
    if (!isDesktop) setDrawerOpen(false);
  }, [router, isDesktop, setDrawerOpen]);

  const openHelpDialog = useCallback(() => {
    setActive("support");
    const rect = helpAnchorRef.current?.getBoundingClientRect();

    if (rect) {
      const DIALOG_HEIGHT = 340;
      const GAP = 12;
      const VIEWPORT_PADDING = 16;

      let top = rect.top;

      if (top + DIALOG_HEIGHT > window.innerHeight - VIEWPORT_PADDING) {
        top = window.innerHeight - VIEWPORT_PADDING - DIALOG_HEIGHT;
      }

      top = Math.max(VIEWPORT_PADDING, top);

      setHelpDialogPosition({
        top,
        left: rect.right + GAP,
      });
    }

    setHelpDialogOpen((prev) => !prev);
  }, []);

  const handleHelpMenuSelect = useCallback(
    (key: SupportMenuKey) => {
      setActive("support");
      setHelpDialogOpen(false);

      switch (key) {
        case "dispute":
          router.push("/influencer/disputes");
          break;
        case "report_issue":
          router.push("/influencer/report-issue");
          break;
        case "help_center":
          router.push("/influencer/support-centre");
          break;
       case "privacy_policy":
        if (typeof window !== "undefined") {
          window.open("/privacy-policy", "_blank", "noopener,noreferrer");
        }
        break;
        default:
          break;
      }

      if (!isDesktop) setDrawerOpen(false);
    },
    [router, isDesktop, setDrawerOpen]
  );

  const beginOpenDesktop = useCallback(() => {
    setCollapsed(false);
    setIsClosing(false);
    setWidthCollapsed(false);
  }, []);

  const beginCloseDesktop = useCallback(() => {
    setIsClosing(true);
    setWidthCollapsed(true);
    setProfileMenuOpen(false);
    setHelpDialogOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();

      document.cookie = "influencerId=; Max-Age=0; path=/";
      document.cookie = "influencer_token=; Max-Age=0; path=/";
      document.cookie = "token=; Max-Age=0; path=/";
    } catch (error) {
      console.error("Logout cleanup failed:", error);
    }

    setProfileMenuOpen(false);
    setHelpDialogOpen(false);

    if (!isDesktop) {
      setDrawerOpen(false);
    }

    onLogout?.();
    router.replace("/influencer/login");
  }, [onLogout, router, isDesktop, setDrawerOpen]);

  const collapsedW = isXl ? 92 : 84;
  const expandedW = isXl ? 320 : 280;

  const mobileW = useMemo(() => {
    const max = 320;
    const min = 260;
    return Math.max(min, Math.min(max, Math.floor(vw - 24)));
  }, [vw]);

  const renderItem = useCallback(
    (i: Item) => {
      const Icon = i.icon;
      const isActiveItem = visualActiveKey === i.key;
      const isWalletItem = i.key === "wallet-payments";

      if (isDesktop && collapsed) {
        if (i.key === "support") {
          return (
            <div key={i.key} ref={helpAnchorRef}>
              <SidebarTooltip content={i.label}>
                <RailIconButton
                  label={i.label}
                  tight={tight}
                  active={isActiveItem}
                  hasIndicator={Boolean(i.right)}
                  onClick={openHelpDialog}
                >
                  <Icon size={20} weight="regular" className="text-current" />
                </RailIconButton>
              </SidebarTooltip>
            </div>
          );
        }

        return (
          <SidebarTooltip key={i.key} content={i.label}>
            <RailIconButton
              label={i.label}
              tight={tight}
              active={isActiveItem}
              hasIndicator={Boolean(i.right)}
              onClick={() => handleSetActive(i.key)}
            >
              <Icon size={20} weight="regular" className="text-current" />
            </RailIconButton>
          </SidebarTooltip>
        );
      }

      if (i.key === "support") {
        return (
          <div key={i.key} ref={helpAnchorRef}>
            <RowButton
              icon={i.icon}
              label={i.label}
              right={i.right}
              active={isActiveItem}
              hideLabel={isDesktop ? isClosing : false}
              tight={tight}
              onClick={openHelpDialog}
            />
          </div>
        );
      }

      if (isWalletItem) {
        return (
          <div key={i.key} className="w-full">
            <RowButton
              icon={i.icon}
              label={i.label}
              right={i.right}
              active={isActiveItem}
              hideLabel={isDesktop ? isClosing : false}
              tight={tight}
              onClick={() => handleSetActive(i.key)}
            />
            <WalletSummary
              summary={payoutSummary}
              hideLabel={isDesktop ? isClosing : false}
            />
          </div>
        );
      }

      return (
        <RowButton
          key={i.key}
          icon={i.icon}
          label={i.label}
          right={i.right}
          active={isActiveItem}
          hideLabel={isDesktop ? isClosing : false}
          tight={tight}
          onClick={() => handleSetActive(i.key)}
        />
      );
    },
    [
      active,
      visualActiveKey,
      collapsed,
      handleSetActive,
      helpDialogOpen,
      isClosing,
      isDesktop,
      openHelpDialog,
      payoutSummary,
      tight,
    ]
  );

  const BottomProfileSection = (
    <div className="relative mt-auto pt-4" ref={profileMenuRef}>
      {isDesktop && compactUI ? (
        <div className="flex flex-col items-center gap-4">
          <SidebarTooltip
            content={isPaidPlan ? `Manage ${planLabel} plan` : "Upgrade to PRO"}
          >
            <m.button
              type="button"
              aria-label={isPaidPlan ? `Manage ${planLabel} plan` : "Upgrade to PRO"}
              onClick={handlePlanClick}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              transition={upgradeSpring}
              className={cn(
                "relative grid place-items-center overflow-hidden",
                tight ? "h-12 w-12" : "h-14 w-14",
                FOCUS_RING
              )}
              style={{
                borderRadius: "var(--Spacing-8, 8px)",
                background: UPGRADE_COLLAPSED,
                willChange: "transform",
              }}
            >
              <Lightning size={24} className="text-[#1a1a1a]" />
              {isPaidPlan && (
                <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#1a1a1a]" />
              )}
            </m.button>
          </SidebarTooltip>

          <div className="h-px w-full bg-neutral-200" />

          <SidebarTooltip content="Profile">
            <button
              type="button"
              onClick={() => router.push("/influencer/profile")}
              className={cn(
                "grid h-12 w-12 place-items-center overflow-hidden rounded-full border border-neutral-200 bg-white transition hover:bg-neutral-50",
                FOCUS_RING
              )}
              aria-label="Profile"
            >
              {showProfileImage ? (
                <img
                  src={profileImage}
                  alt={profileName}
                  className="h-12 w-12 rounded-full object-cover"
                  onError={() => setProfileImageError(true)}
                />
              ) : (
                <UserIcon size={22} weight="regular" />
              )}
            </button>
          </SidebarTooltip>
        </div>
      ) : (
        <>
          <m.div
            initial="rest"
            animate="rest"
            whileHover="hover"
            transition={upgradeSpring}
            className={cn(
              "relative flex w-full cursor-pointer flex-col items-start gap-2.5 overflow-hidden p-2",
              FOCUS_RING
            )}
            style={upgradeShellStyle}
            tabIndex={0}
            role="button"
            onClick={handlePlanClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handlePlanClick();
              }
            }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: UPGRADE_REST,
                borderRadius: "inherit",
              }}
            />

            <m.div
              className="pointer-events-none absolute inset-0"
              style={{
                background: UPGRADE_HOVER,
                borderRadius: "inherit",
              }}
              variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
              transition={upgradeSpring}
            />

            <div className="relative z-10 flex w-full flex-col items-start gap-2.5">
              <div className="flex w-full items-start justify-between gap-3">
                <div className="relative h-6 w-6">
                  <m.span
                    className="absolute inset-0 grid place-items-center"
                    variants={{ rest: { opacity: 1 }, hover: { opacity: 0 } }}
                    transition={upgradeSpring}
                  >
                    <Lightning
                      size={24}
                      weight="regular"
                      className="text-[#1a1a1a]"
                    />
                  </m.span>

                  <m.span
                    className="absolute inset-0 grid place-items-center"
                    variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
                    transition={upgradeSpring}
                  >
                    <Lightning
                      size={24}
                      weight="fill"
                      className="text-[#1a1a1a]"
                    />
                  </m.span>
                </div>

                <span className="inline-flex items-center rounded-full border border-white/70 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-[#1a1a1a]">
                  {planLabel}
                </span>
              </div>

              <div className="text-[18px] font-semibold leading-[24px] text-[#1a1a1a]">
                {upgradeCardTitle}
              </div>

              <div className="font-[Inter] text-[14px] font-normal leading-[18px] text-[#1a1a1a]">
                {upgradeCardDesc}
              </div>
            </div>
          </m.div>

          <div className="my-5 h-px w-full bg-neutral-200" />

          <div className="flex items-center gap-3 rounded-2xl px-2 py-2">
            <button
              type="button"
              onClick={() => router.push("/influencer/profile")}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-neutral-100">
                {showProfileImage ? (
                  <img
                    src={profileImage}
                    alt={profileName}
                    className="h-full w-full object-cover"
                    onError={() => setProfileImageError(true)}
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center">
                    <UserIcon size={22} weight="regular" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-[18px] font-semibold text-[#1a1a1a]">
                  {profileName}
                </div>
                <div className="truncate text-[14px] text-neutral-400">
                  {profileEmail}
                </div>
              </div>
            </button>

            <AnimatePresence initial={false}>
              {!compactUI && (
                <m.button
                  key="profile-menu-trigger"
                  type="button"
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  className={cn(
                    "grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-neutral-100 transition hover:bg-neutral-200",
                    FOCUS_RING
                  )}
                  aria-label="Open profile menu"
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={fadeScale}
                  transition={motionTransitions.content}
                >
                  <DotsThree size={22} weight="bold" />
                </m.button>
              )}
            </AnimatePresence>
          </div>

          <ProfileMenu
            open={profileMenuOpen}
            onClose={() => setProfileMenuOpen(false)}
            onProfile={() => router.push("/influencer/profile")}
            onLogout={handleLogout}
          />
        </>
      )}
    </div>
  );

  const SidebarBody = (
    <div className="flex h-full flex-col">
      <div className={cn("flex flex-col", tight ? "gap-3" : "gap-4")}>
        <div
          className={cn(
            "flex w-full items-center",
            isDesktop && (collapsed || isClosing) ? "flex-col gap-3" : "gap-3"
          )}
        >
          {isDesktop && collapsed ? (
            <SidebarTooltip content="Open sidebar">
              <button
                type="button"
                onClick={() => {
                  if (isDesktop) {
                    if (collapsed || isClosing) beginOpenDesktop();
                    else router.push("/influencer/dashboards");
                  } else {
                    setDrawerOpen(true);
                  }
                }}
                className={cn(
                  "grid place-items-center flex-shrink-0",
                  FOCUS_RING,
                  "cursor-pointer"
                )}
                aria-label="Open sidebar"
              >
                <img
                  src="/logo.png"
                  alt="CollabGlam"
                  className="h-[40px] w-[40px] rounded-full object-cover"
                />
              </button>
            </SidebarTooltip>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (isDesktop) {
                  if (collapsed || isClosing) beginOpenDesktop();
                  else router.push("/influencer/dashboards");
                } else {
                  setDrawerOpen(true);
                }
              }}
              className={cn(
                "grid place-items-center flex-shrink-0",
                FOCUS_RING,
                isDesktop && collapsed ? "cursor-pointer" : "cursor-default"
              )}
              aria-label={isDesktop && collapsed ? "Open sidebar" : "CollabGlam"}
            >
              <img
                src="/logo.png"
                alt="CollabGlam"
                className="h-[40px] w-[40px] rounded-full object-cover"
              />
            </button>
          )}

          <AnimatePresence initial={false}>
            {!compactUI && (
              <m.div
                key="brand"
                variants={fadeScale}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={motionTransitions.content}
                className="min-w-0 flex-1"
              >
                <div
                  className={cn(
                    "truncate font-semibold text-[#1a1a1a]",
                    tight ? "text-[18px]" : "text-[20px]"
                  )}
                >
                  CollabGlam
                </div>
                <div className="truncate text-[12px] text-neutral-500">
                  Creator
                </div>
              </m.div>
            )}
          </AnimatePresence>

          {isDesktop ? (
            <SidebarTooltip
              content={collapsed || isClosing ? "Open sidebar" : "Close sidebar"}
              side={collapsed || isClosing ? "right" : "bottom"}
            >
              <button
                type="button"
                onClick={() => {
                  if (collapsed || isClosing) beginOpenDesktop();
                  else beginCloseDesktop();
                }}
                aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
                className={cn(
                  "grid h-10 w-10 flex-shrink-0 place-items-center transition rounded-lg",
                  "text-[#343330] hover:bg-[#EDEDED] hover:text-[#1a1a1a]",
                  FOCUS_RING,
                  collapsed || isClosing ? "" : "ml-auto"
                )}
              >
                {collapsed ? (
                  <PanelCaretGlyph dir="right" />
                ) : (
                  <PanelCaretGlyph dir="left" />
                )}
              </button>
            </SidebarTooltip>
          ) : (
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className={cn(
                "ml-auto grid h-10 w-10 place-items-center rounded-lg transition",
                "text-[#343330] hover:bg-[#EDEDED] hover:text-[#1a1a1a]",
                FOCUS_RING
              )}
            >
              <X size={22} />
            </button>
          )}
        </div>
      </div>

      <div className={cn("mt-6 flex min-h-0 flex-1 flex-col", tight ? "mt-4" : "")}>
        <div
          className={cn(
            "min-h-0 flex-1 pr-1",
            isDesktop && collapsed
              ? "flex flex-col items-center overflow-y-auto"
              : "overflow-y-auto"
          )}
        >
          <div className={cn("flex flex-col", isDesktop && collapsed ? "gap-3" : "gap-2 w-full")}>
            {mainItems.map((i) => renderItem(i))}
          </div>

          <div
            className={cn(
              "my-5 h-px w-full bg-neutral-200",
              isDesktop && collapsed ? "opacity-70" : "",
              tight ? "my-4" : ""
            )}
          />

          <div className={cn("flex flex-col", isDesktop && collapsed ? "gap-3" : "gap-2 w-full")}>
            {footerItems.map((i) => renderItem(i))}
          </div>
        </div>

        {BottomProfileSection}
      </div>
    </div>
  );

  const DesktopAside = (
    <m.aside
      data-cg-sidebar
      id="cg-sidebar"
      className="inline-flex h-dvh flex-col border border-neutral-200 bg-white select-none"
      style={{
        padding: tight ? "12px 16px 16px 16px" : "16px 20px 20px 20px",
        fontFamily: "var(--Font-Family-Inter, Inter)",
        willChange: "width",
      }}
      initial={false}
      animate={{ width: widthCollapsed ? collapsedW : expandedW }}
      transition={motionTransitions.aside}
      onAnimationComplete={() => {
        if (widthCollapsed && isClosing) {
          setCollapsed(true);
          setIsClosing(false);
        }
      }}
    >
      {SidebarBody}
    </m.aside>
  );

  const MobileDrawer = (
    <AnimatePresence>
      {drawerOpen ? (
        <>
          <m.button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-[99] bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={motionTransitions.content}
            onClick={() => setDrawerOpen(false)}
          />

          <m.aside
            data-cg-sidebar
            id="cg-sidebar"
            className="fixed left-0 top-0 bottom-0 z-[100] border-r border-neutral-200 bg-white select-none"
            style={{
              width: mobileW,
              padding: tight ? "12px 16px 16px 16px" : "16px 20px 20px 20px",
              fontFamily: "var(--Font-Family-Inter, Inter)",
              willChange: "transform",
            }}
            initial={{ x: -mobileW - 24 }}
            animate={{ x: 0 }}
            exit={{ x: -mobileW - 24 }}
            transition={motionTransitions.drawer}
          >
            {SidebarBody}
          </m.aside>
        </>
      ) : null}
    </AnimatePresence>
  );

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion={reduceMotion ? "always" : "never"}>
        <TooltipProvider delayDuration={120}>
          <>
            {isDesktop ? DesktopAside : MobileDrawer}

            <HelpDialog
              open={helpDialogOpen}
              dialogRef={helpDialogRef}
              position={helpDialogPosition}
              items={helpMenuItems}
              onSelect={handleHelpMenuSelect}
              focusRingClassName={FOCUS_RING}
            />
          </>
        </TooltipProvider>
      </MotionConfig>
    </LazyMotion>
  );
}