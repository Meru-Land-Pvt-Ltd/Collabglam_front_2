"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ExternalLink, Heart, Loader2, Search, X } from "lucide-react";
import {
  InfluencerTable,
  type InfluencerRow,
  type PlatformType,
} from "@/components/ui/brand/Influencertable";
import api from "@/lib/api";
import { apiFetchCampaignPitchFolder } from "@/app/brand/services/brandApi";

type PitchFolderInfluencer = {
  _id?: string;
  influencerId?: string;
  creatorId?: string;
  name?: string;
  handle?: string;
  username?: string;
  email?: string;
  provider?: string;
  platform?: string;
  niche?: string | string[];
  country?: string;
  followers?: string | number;
  selectionReason?: string;
  shippingAddress?: string;
  comments?: string;
  influencerRateCard?: string | number;
  platformRateCard?: string | number;
  rateCard?: string | number;
  rate?: string | number;
  rateCardCurrency?: string;
  goodFit?: boolean;
  campaignActivation?: {
    active?: boolean;
    status?: string;
    campaignId?: string;
    campaignsId?: string;
    influencerId?: string;
    activeAt?: string;
    activatedByAdminId?: string;
  } | null;
  profileUrl?: string;
  primaryLink?: string;
  url?: string;
  links?: string[];
  picture?: string;
  avatarUrl?: string;
  profileImage?: string;
  profilePicture?: string;
  profilePic?: string;
  image?: string;
  thumbnail?: string;
  avatar?: string;
  profile?: {
    image?: string;
    avatar?: string;
    avatarUrl?: string;
    picture?: string;
    profileImage?: string;
    profilePicture?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
  mediaKitAccess?: {
    hasAdded?: boolean;
    allowed?: boolean;
    visibleSource?: string | null;
    requestStatus?: string;
    requestedAt?: string | null;
  };
  mediaKitLink?: {
    url?: string;
    generatedAt?: string | null;
    showToBrand?: boolean;
    requestStatus?: string;
    requestedAt?: string | null;
    reviewedAt?: string | null;
  };
  mediaKit?: {
    s3Key?: string;
    fileName?: string;
    mimeType?: string;
    size?: number | null;
    uploadedAt?: string | null;
    showToBrand?: boolean;
    requestStatus?: string;
    requestedAt?: string | null;
    reviewedAt?: string | null;
  };
  rateCardHistory?: any[];
  sourcePipelineId?: string | null;
  ourFeePct?: number | null;
};

type PitchFolderMeta = {
  title?: string;
  description?: string;
  brandVisibleItemCount?: number;
  showFullListToBrand?: boolean;
  shareToken?: string;
};

type PitchFolderPayload = {
  items: PitchFolderInfluencer[];
  meta: PitchFolderMeta;
  message: string;
};

type PitchSheetRow = InfluencerRow & {
  __raw?: PitchFolderInfluencer;
  __profileUrl?: string;
  __goodFit?: boolean;
};

type DetailItem = {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
};

type DrawerTabKey = "overview" | "rate" | "demographics";

function displayValue(
  value?: string | number | string[] | boolean | null
): string {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === undefined || value === null || value === "") return "";
  return String(value);
}

function displayDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toHandle(value?: string) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.startsWith("@") ? text : `@${text}`;
}

function getInitials(name?: string) {
  const parts = String(name || "Influencer")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "I";

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function parseNumber(value?: string | number) {
  if (value === undefined || value === null || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const raw = String(value).trim().toUpperCase().replace(/,/g, "");
  const num = Number(raw.replace(/[KM]/g, ""));

  if (!Number.isFinite(num)) return 0;
  if (raw.endsWith("M")) return num * 1_000_000;
  if (raw.endsWith("K")) return num * 1_000;

  return num;
}

function formatFollowers(value?: string | number) {
  const num = parseNumber(value);
  if (!num) return "";

  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num);
}

function normalizePlatform(value?: string): PlatformType | null {
  const platform = String(value || "").trim().toLowerCase();

  if (platform.includes("instagram")) return "instagram";
  if (platform.includes("youtube")) return "youtube";
  if (platform.includes("tiktok") || platform.includes("tik tok")) {
    return "tiktok";
  }

  return null;
}

function normalizeExternalUrl(url?: string) {
  const text = String(url || "").trim();
  if (!text) return "";
  if (/^https?:\/\//i.test(text)) return text;
  return `https://${text}`;
}

function normalizeImageUrl(url?: string) {
  const text = String(url || "").trim();
  if (!text) return "";

  if (/^(https?:)?\/\//i.test(text)) return text;
  if (/^(data|blob):/i.test(text)) return text;
  if (text.startsWith("/")) return text;

  return `https://${text}`;
}

function getInfluencerImageUrl(item?: PitchFolderInfluencer | null) {
  if (!item) return "";

  return (
    normalizeImageUrl(item.picture) ||
    normalizeImageUrl(item.avatarUrl) ||
    normalizeImageUrl(item.profileImage) ||
    normalizeImageUrl(item.profilePicture) ||
    normalizeImageUrl(item.profilePic) ||
    normalizeImageUrl(item.image) ||
    normalizeImageUrl(item.thumbnail) ||
    normalizeImageUrl(item.avatar) ||
    normalizeImageUrl(item.profile?.image) ||
    normalizeImageUrl(item.profile?.avatar) ||
    normalizeImageUrl(item.profile?.avatarUrl) ||
    normalizeImageUrl(item.profile?.picture) ||
    normalizeImageUrl(item.profile?.profileImage) ||
    normalizeImageUrl(item.profile?.profilePicture) ||
    ""
  );
}

function cleanHandle(handle?: string) {
  return String(handle || "")
    .trim()
    .replace(/^@+/, "");
}

function buildPlatformProfileUrl(platformValue?: string, handleValue?: string) {
  const platform = String(platformValue || "").toLowerCase();
  const handle = cleanHandle(handleValue);

  if (!handle || handle === "—") return "";

  if (platform.includes("youtube")) return `https://www.youtube.com/@${handle}`;
  if (platform.includes("instagram"))
    return `https://www.instagram.com/${handle}`;
  if (platform.includes("tiktok") || platform.includes("tik tok")) {
    return `https://www.tiktok.com/@${handle}`;
  }

  return "";
}

function getInfluencerProfileUrl(item: PitchFolderInfluencer) {
  return (
    normalizeExternalUrl(item.primaryLink) ||
    normalizeExternalUrl(item.profileUrl) ||
    normalizeExternalUrl(item.url) ||
    buildPlatformProfileUrl(
      item.provider || item.platform,
      item.handle || item.username
    )
  );
}

function normalizeRateCard(item: PitchFolderInfluencer) {
  const rate =
    item.influencerRateCard ||
    item.platformRateCard ||
    item.rateCard ||
    item.rate ||
    "";

  if (!rate) return "—";

  const currency = item.rateCardCurrency || "USD";
  return `${currency} ${rate}`;
}

function getPitchFolderItems(response: any): PitchFolderPayload {
  const payload = response?.data ?? response;

  if (payload?.success === false) {
    return {
      items: [],
      meta: {},
      message:
        payload?.error ||
        payload?.message ||
        "No pitch folder found for this campaign",
    };
  }

  const pitchFolder =
    payload?.data?.items || payload?.data?._id
      ? payload.data
      : payload?.items || payload?._id
        ? payload
        : payload?.pitchFolder || payload?.data?.pitchFolder || payload?.result || {};

  const rawItems = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.data?.items)
        ? payload.data.items
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.pitchFolder?.items)
            ? payload.pitchFolder.items
            : [];

  return {
    items: rawItems,
    meta: {
      title: pitchFolder?.title,
      description: pitchFolder?.description,
      brandVisibleItemCount: pitchFolder?.brandVisibleItemCount,
      showFullListToBrand: pitchFolder?.showFullListToBrand,
      shareToken: pitchFolder?.share?.token || pitchFolder?.shareToken || "",
    },
    message: rawItems.length ? "" : "No pitch folder found for this campaign",
  };
}

function mapPitchFolderItemToRow(
  item: PitchFolderInfluencer,
  index: number
): PitchSheetRow {
  const platform = normalizePlatform(item.provider || item.platform);
  const followers = parseNumber(item.followers);
  const niche = displayValue(item.niche);
  const profileUrl = getInfluencerProfileUrl(item);
  const avatarUrl = getInfluencerImageUrl(item);

  return {
    id:
      String(item.influencerId || item.creatorId || item._id || "").trim() ||
      `pitch-sheet-${index}`,
    profile: {
      name: String(item.name || "Influencer"),
      handle: toHandle(item.handle || item.username) || "—",
      avatarUrl,
      url: profileUrl,
    },
    category: niche || "—",
    platforms: platform
      ? [
        {
          platform,
          followers,
        },
      ]
      : [],
    followers,
    appliedDate: item.createdAt || item.updatedAt || "—",
    status: item.goodFit ? "Good Fit" : "Not Marked",
    budget: normalizeRateCard(item),
    __raw: item,
    __profileUrl: profileUrl,
    __goodFit: Boolean(item.goodFit),
  };
}

function filterDetailItems(items: DetailItem[]) {
  return items.filter((item) => {
    if (typeof item.value === "string") {
      return item.value.trim() !== "";
    }
    return item.value !== undefined && item.value !== null;
  });
}

function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "success";
}) {
  const cls =
    tone === "success"
      ? "border-[#CDEFD8] bg-[#F1FBF4] text-[#067647]"
      : "border-[#E6E6E6] bg-[#F7F7F7] text-[#4D4D4D]";

  return (
    <span
      className={`inline-flex items-center rounded-lg border px-3 py-1 text-xs font-semibold ${cls}`}
    >
      {children}
    </span>
  );
}

function GoodFitHeartButton({
  active,
  loading,
  onClick,
}: {
  active: boolean;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      aria-label={active ? "Good fit" : "Not good fit"}
      title={active ? "Good Fit" : "Not Good Fit"}
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition",
        active
          ? "border-rose-100 bg-rose-50 text-rose-500 shadow-[0_4px_14px_rgba(244,63,94,0.18)]"
          : "border-gray-200 bg-white text-gray-300 hover:border-rose-100 hover:bg-rose-50 hover:text-rose-500",
        loading ? "cursor-wait opacity-60" : "",
      ].join(" ")}
    >
      <Heart
        className="h-4 w-4"
        fill={active ? "currentColor" : "none"}
        strokeWidth={active ? 0 : 2}
      />
    </button>
  );
}

function DrawerTabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative h-12 whitespace-nowrap cursor-pointer px-4 text-[15px] font-medium transition",
        active ? "text-[#1A1A1A]" : "text-[#969696] hover:text-[#1A1A1A]",
      ].join(" ")}
    >
      {label}
      {active ? (
        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1A1A1A]" />
      ) : null}
    </button>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-[14px] font-semibold text-[#1A1A1A]">{title}</h3>
      {children}
    </section>
  );
}

function TabInfoGrid({ items }: { items: DetailItem[] }) {
  const realItems = filterDetailItems(items);

  if (!realItems.length) {
    return (
      <div className="rounded-lg border border-[#EAEAEA] bg-[#FAFAFA] p-4 text-sm text-[#7A7A7A]">
        No data available.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {realItems.map((item) => (
        <div
          key={item.label}
          className={[
            "rounded-lg border border-[#ECECEC] bg-[#FCFCFC] p-4",
            item.fullWidth ? "sm:col-span-2" : "",
          ].join(" ")}
        >
          {item.label ? (
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9B9B9B]">
              {item.label}
            </div>
          ) : null}
          <div className="whitespace-pre-wrap break-words text-[14px] font-medium leading-6 text-[#1A1A1A]">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function TabLinks({ links }: { links: string[] }) {
  if (!links.length) {
    return (
      <div className="rounded-lg border border-[#EAEAEA] bg-[#FAFAFA] p-4 text-sm text-[#7A7A7A]">
        No links available.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {links.map((link) => (
        <a
          key={link}
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 rounded-lg border border-[#ECECEC] bg-[#FCFCFC] px-4 py-3 text-[13px] font-medium text-[#1A1A1A] hover:bg-[#F7F7F7]"
        >
          <span className="min-w-0 truncate">{link}</span>
          <ExternalLink className="h-4 w-4 shrink-0 text-[#8A8A8A]" />
        </a>
      ))}
    </div>
  );
}

function ClickableHandle({
  handle,
  profileUrl,
  className = "",
}: {
  handle: string;
  profileUrl?: string;
  className?: string;
}) {
  if (!handle) return null;

  if (!profileUrl) {
    return <span className={className}>{handle}</span>;
  }

  return (
    <a
      href={profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={[
        "inline-flex max-w-full items-center gap-1 truncate underline-offset-2 hover:underline",
        className,
      ].join(" ")}
      title={profileUrl}
    >
      <span className="truncate">{handle}</span>
      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#8A8A8A]" />
    </a>
  );
}

function PitchInfluencerDrawer({
  row,
  onClose,
}: {
  row: PitchSheetRow | null;
  onClose: () => void;
}) {
  const open = Boolean(row);
  const raw = row?.__raw;
  const [activeTab, setActiveTab] = useState<DrawerTabKey>("overview");
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setActiveTab("overview");
      setAvatarFailed(false);
    }
  }, [open, row?.id]);

  if (!open || !raw || !row) return null;

  const profileUrl =
    row.__profileUrl ||
    getInfluencerProfileUrl(raw) ||
    normalizeExternalUrl(raw.primaryLink) ||
    normalizeExternalUrl(raw.profileUrl) ||
    normalizeExternalUrl(raw.url) ||
    "";

  const allLinks = Array.from(
    new Set(
      [profileUrl, ...(Array.isArray(raw.links) ? raw.links : [])].filter(
        (link): link is string => Boolean(link)
      )
    )
  );

  const initials = getInitials(raw.name || row.profile.name);
  const drawerAvatarUrl = row.profile.avatarUrl || getInfluencerImageUrl(raw);
  const shouldShowAvatar = Boolean(drawerAvatarUrl) && !avatarFailed;
  const followerText = formatFollowers(raw.followers);
  const followerFull = displayValue(raw.followers);
  const handleText = toHandle(raw.handle || raw.username);

  const profileItems: DetailItem[] = [
    { label: "Name", value: displayValue(raw.name) },
    {
      label: "Handle",
      value: (
        <ClickableHandle
          handle={handleText}
          profileUrl={profileUrl}
          className="text-[#1A1A1A]"
        />
      ),
    },
    { label: "Provider", value: displayValue(raw.provider) },
    { label: "Platform", value: displayValue(raw.platform) },
    {
      label: "Followers",
      value:
        followerFull && followerText
          ? `${followerFull} (${followerText})`
          : followerFull,
    },
    { label: "Niche", value: displayValue(raw.niche) },
    { label: "Country", value: displayValue(raw.country) },
    // { label: "Good Fit", value: displayValue(raw.goodFit) },
  ];

  const contactItems: DetailItem[] = [
    // { label: "Email", value: displayValue(raw.email) },
    { label: "Shipping Address", value: displayValue(raw.shippingAddress) },
    // { label: "Comments", value: displayValue(raw.comments) },
  ];

  const selectionReasonItems: DetailItem[] = [
    {
      label: "Selection Reason",
      value: displayValue(raw.selectionReason) || "—",
      fullWidth: true,
    },
  ];

  const campaignItems: DetailItem[] = [
    {
      label: "Campaign Active",
      value:
        raw.campaignActivation?.active === undefined
          ? ""
          : displayValue(raw.campaignActivation?.active),
    },
    { label: "Status", value: displayValue(raw.campaignActivation?.status) },
    {
      label: "Activated At",
      value: displayDate(raw.campaignActivation?.activeAt),
    },
  ];

  const mediaAccessItems: DetailItem[] = [
    {
      label: "Has Added",
      value:
        raw.mediaKitAccess?.hasAdded === undefined
          ? ""
          : displayValue(raw.mediaKitAccess?.hasAdded),
    },
    {
      label: "Allowed",
      value:
        raw.mediaKitAccess?.allowed === undefined
          ? ""
          : displayValue(raw.mediaKitAccess?.allowed),
    },
    {
      label: "Visible Source",
      value: displayValue(raw.mediaKitAccess?.visibleSource),
    },
    {
      label: "Request Status",
      value: displayValue(raw.mediaKitAccess?.requestStatus),
    },
    {
      label: "Requested At",
      value: displayDate(raw.mediaKitAccess?.requestedAt),
    },
  ];

  const mediaLinkItems: DetailItem[] = [
    { label: "URL", value: displayValue(raw.mediaKitLink?.url) },
    {
      label: "Generated At",
      value: displayDate(raw.mediaKitLink?.generatedAt),
    },
    {
      label: "Show To Brand",
      value:
        raw.mediaKitLink?.showToBrand === undefined
          ? ""
          : displayValue(raw.mediaKitLink?.showToBrand),
    },
    {
      label: "Request Status",
      value: displayValue(raw.mediaKitLink?.requestStatus),
    },
    {
      label: "Requested At",
      value: displayDate(raw.mediaKitLink?.requestedAt),
    },
    {
      label: "Reviewed At",
      value: displayDate(raw.mediaKitLink?.reviewedAt),
    },
  ];

  const mediaFileItems: DetailItem[] = [
    { label: "File Name", value: displayValue(raw.mediaKit?.fileName) },
    { label: "Mime Type", value: displayValue(raw.mediaKit?.mimeType) },
    {
      label: "Size",
      value:
        typeof raw.mediaKit?.size === "number"
          ? `${raw.mediaKit.size} bytes`
          : "",
    },
    {
      label: "Uploaded At",
      value: displayDate(raw.mediaKit?.uploadedAt),
    },
    {
      label: "Show To Brand",
      value:
        raw.mediaKit?.showToBrand === undefined
          ? ""
          : displayValue(raw.mediaKit?.showToBrand),
    },
    {
      label: "Request Status",
      value: displayValue(raw.mediaKit?.requestStatus),
    },
    {
      label: "Requested At",
      value: displayDate(raw.mediaKit?.requestedAt),
    },
    {
      label: "Reviewed At",
      value: displayDate(raw.mediaKit?.reviewedAt),
    },
  ];

  const rateItems: DetailItem[] = [
    {
      label: "Rate Card",
      value: displayValue(raw.platformRateCard),
      fullWidth: true,
    },
    { label: "Rate Card", value: displayValue(raw.rateCard) },
    { label: "Our Fee %", value: displayValue(raw.ourFeePct) },
  ];

  const tabs: { key: DrawerTabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "rate", label: "Rate Card" },
    { key: "demographics", label: "Demographics" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <DetailSection title="Profile">
              <TabInfoGrid items={profileItems} />
            </DetailSection>

            <DetailSection title="Contact & Notes">
              <TabInfoGrid items={contactItems} />
            </DetailSection>

            {/* <DetailSection title="Campaign Activation">
              <TabInfoGrid items={campaignItems} />
            </DetailSection> */}

            {/* <DetailSection title="Media Kit Access">
              <TabInfoGrid items={mediaAccessItems} />
            </DetailSection> */}

            {/* <DetailSection title="Media Kit Link">
              <TabInfoGrid items={mediaLinkItems} />
            </DetailSection>

            <DetailSection title="Media Kit File">
              <TabInfoGrid items={mediaFileItems} />
            </DetailSection> */}

            {/* <DetailSection title="Links">
              <TabLinks links={allLinks} />
            </DetailSection> */}

            {/* <DetailSection title="Timeline">
              <TabInfoGrid
                items={[
                  { label: "Created At", value: displayDate(raw.createdAt) },
                  { label: "Updated At", value: displayDate(raw.updatedAt) },
                ]}
              />
            </DetailSection> */}

            <DetailSection title="Selection Reason">
              <TabInfoGrid items={selectionReasonItems} />
            </DetailSection>
          </div>
        );

      case "rate":
        return <TabInfoGrid items={rateItems} />;

      case "demographics":
        return <div />;

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label="Close influencer details"
        className="absolute inset-0 bg-black/25"
        onClick={onClose}
      />

      <aside className="absolute right-0 top-0 h-full w-full max-w-[760px] overflow-hidden border-l border-[#E6E6E6] bg-white shadow-xl">
        <div className="flex h-full flex-col">
          <div className="border-b border-[#E6E6E6] bg-white px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                {shouldShowAvatar ? (
                  <img
                    src={drawerAvatarUrl}
                    alt={row.profile.name}
                    className="h-12 w-12 rounded-lg object-cover"
                    onError={() => setAvatarFailed(true)}
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#F2F2F2] text-sm font-semibold text-[#1A1A1A]">
                    {initials}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#969696]">
                    Influencer Details
                  </div>

                  <h2 className="truncate text-[20px] font-semibold tracking-[-0.02em] text-[#1A1A1A]">
                    {raw.name || "Influencer"}
                  </h2>

                  {handleText ? (
                    <ClickableHandle
                      handle={handleText}
                      profileUrl={profileUrl}
                      className="mt-1 text-[14px] font-medium text-[#737373]"
                    />
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge tone={raw.goodFit ? "success" : "default"}>
                      {raw.goodFit ? "Good Fit" : "Not Marked"}
                    </Badge>

                    {displayValue(raw.provider || raw.platform) ? (
                      <Badge>{displayValue(raw.provider || raw.platform)}</Badge>
                    ) : null}

                    {followerText ? <Badge>{followerText} followers</Badge> : null}

                    {displayValue(raw.country) ? (
                      <Badge>{displayValue(raw.country)}</Badge>
                    ) : null}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#E6E6E6] bg-white text-[#737373] transition hover:bg-[#F7F7F7] hover:text-[#1A1A1A]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="border-b border-[#E6E6E6] bg-white px-6">
            <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {tabs.map((tab) => (
                <DrawerTabButton
                  key={tab.key}
                  label={tab.label}
                  active={activeTab === tab.key}
                  onClick={() => setActiveTab(tab.key)}
                />
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {renderTabContent()}
          </div>

          <div className="border-t border-[#E6E6E6] bg-white px-6 py-4">
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-[#D6D6D6] bg-white px-4 text-sm font-semibold text-[#1A1A1A] transition hover:bg-[#F7F7F7]"
              >
                Close
              </button>

              {profileUrl ? (
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1A1A1A] px-4 text-sm font-semibold text-white transition hover:bg-black"
                >
                  Open Profile
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function PitchSheetPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const campaignId = useMemo(() => {
    const fromQuery =
      searchParams.get("campaignId") ||
      searchParams.get("id") ||
      "";

    const fromParams =
      (params as any)?.campaignId ||
      (params as any)?.id ||
      "";

    return String(fromQuery || fromParams || "").trim();
  }, [params, searchParams]);

  const [rows, setRows] = useState<PitchSheetRow[]>([]);
  const [meta, setMeta] = useState<PitchFolderMeta>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [emptyMessage, setEmptyMessage] = useState("");
  const [search, setSearch] = useState("");
  const [selectedRow, setSelectedRow] = useState<PitchSheetRow | null>(null);
  const [updatingGoodFitId, setUpdatingGoodFitId] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) {
      setLoading(false);
      setError("Campaign id is missing");
      return;
    }

    let mounted = true;

    const loadPitchSheet = async () => {
      try {
        setLoading(true);
        setError("");
        setEmptyMessage("");

        const response = await apiFetchCampaignPitchFolder(campaignId);
        const payload = getPitchFolderItems(response);

        if (!mounted) return;

        setRows(payload.items.map(mapPitchFolderItemToRow));
        setMeta(payload.meta);
        setEmptyMessage(payload.message || "");
      } catch (err: any) {
        if (!mounted) return;

        const backendMessage =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.response?.data?.details ||
          err?.message ||
          "No pitch folder found for this campaign";

        setRows([]);
        setMeta({});
        setError(backendMessage);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadPitchSheet();

    return () => {
      mounted = false;
    };
  }, [campaignId]);

  const filteredRows = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return rows;

    return rows.filter((row) => {
      const raw = row.__raw;

      return [
        row.profile.name,
        row.profile.handle,
        row.category,
        row.status,
        row.budget,
        raw?.email,
        raw?.country,
        raw?.selectionReason,
        raw?.shippingAddress,
        raw?.comments,
        raw?.provider,
        raw?.platform,
        raw?.primaryLink,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [rows, search]);

  const tableEmptyMessage =
    search.trim() && rows.length > 0
      ? "No matching influencers found."
      : emptyMessage || "No pitch folder found for this campaign";

  const handleToggleGoodFit = async (row: PitchSheetRow) => {
    const itemId = String(row.__raw?._id || "").trim();

    if (!itemId || !campaignId || updatingGoodFitId === itemId) return;

    const nextGoodFit = !Boolean(row.__raw?.goodFit);

    try {
      setUpdatingGoodFitId(itemId);

      await api.post(
        `/brand/campaign/${encodeURIComponent(campaignId)}/good-fit/${encodeURIComponent(
          itemId
        )}`,
        {
          goodFit: nextGoodFit,
          profile: row.__raw,
        }
      );

      setRows((prev) =>
        prev.map((item) => {
          if (item.__raw?._id !== itemId) return item;

          const nextRaw = {
            ...(item.__raw || {}),
            goodFit: nextGoodFit,
          };

          return {
            ...item,
            status: nextGoodFit ? "Good Fit" : "Not Marked",
            __goodFit: nextGoodFit,
            __raw: nextRaw,
          };
        })
      );

      setSelectedRow((prev) => {
        if (!prev || prev.__raw?._id !== itemId) return prev;

        const nextRaw = {
          ...(prev.__raw || {}),
          goodFit: nextGoodFit,
        };

        return {
          ...prev,
          status: nextGoodFit ? "Good Fit" : "Not Marked",
          __goodFit: nextGoodFit,
          __raw: nextRaw,
        };
      });
    } catch (err) {
      console.error("Failed to update good fit status", err);
    } finally {
      setUpdatingGoodFitId(null);
    }
  };

  return (
    <div className="mt-[3.5rem] px-[2rem] pb-[2.5rem]">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
            Pitch Sheet
          </p>

          <h1 className="text-2xl font-bold leading-tight tracking-[-0.02em] text-gray-900">
            {meta.title || "Pitch Sheet"}
          </h1>

          {meta.description ? (
            <p className="mt-1 max-w-[500px] text-[13px] text-gray-500">
              {meta.description}
            </p>
          ) : null}
        </div>

        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-[13px] w-[13px] -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pitch sheet..."
            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-[13px] text-gray-900 outline-none transition focus:border-gray-400 focus:ring-4 focus:ring-gray-200/70"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-[0.75rem] bg-white">
        {loading ? (
          <div className="flex h-64 items-center justify-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading pitch sheet influencers...
          </div>
        ) : error ? (
          <div className="flex h-64 items-center justify-center p-6">
            <div className="max-w-[360px] text-center">
              <p className="text-l text-gray-500">
                No pitch folder found for this campaign .
              </p>
            </div>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex h-64 items-center justify-center p-6">
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-800">
                {tableEmptyMessage}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Assigned pitch sheet influencers will appear here.
              </p>
            </div>
          </div>
        ) : (
          <InfluencerTable
            rows={filteredRows}
            variant="default"
            hideAppliedDate
            renderStatus={(row) => {
              const currentRow = row as PitchSheetRow;
              const itemId = String(currentRow.__raw?._id || "").trim();

              return (
                <div className="flex justify-center">
                  <GoodFitHeartButton
                    active={Boolean(currentRow.__raw?.goodFit)}
                    loading={updatingGoodFitId === itemId}
                    onClick={() => handleToggleGoodFit(currentRow)}
                  />
                </div>
              );
            }}
            renderDefaultActions={(row) => {
              const currentRow = row as PitchSheetRow;

              return (
                <button
                  type="button"
                  onClick={() => setSelectedRow(currentRow)}
                  className="inline-flex h-8 items-center justify-center rounded-[0.5rem] border border-[#E6E6E6] bg-white px-3 text-[12px] font-medium text-[#1A1A1A] hover:bg-[#F7F7F7]"
                >
                  View More
                </button>
              );
            }}
          />
        )}
      </div>

      {!loading && !error && filteredRows.length > 0 ? (
        <p className="mt-3.5 text-center text-[11px] text-gray-400">
          {filteredRows.length} influencer
          {filteredRows.length !== 1 ? "s" : ""} in pitch sheet
        </p>
      ) : null}

      <PitchInfluencerDrawer
        row={selectedRow}
        onClose={() => setSelectedRow(null)}
      />
    </div>
  );
}