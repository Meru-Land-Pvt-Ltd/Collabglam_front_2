"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  apiGetfetchCampaignbyId,
  getApiErrorMessage,
} from "@/app/influencer/services/influencerApi";
import { ArrowUpRight } from "lucide-react";
import {
  CalendarDots,
  CalendarX,
  CaretLeft,
  CaretRight,
  ChalkboardTeacher,
  CheckCircle,
  DownloadSimple,
  FilePdf,
  MoneyWavy,
  PaperPlaneTilt,
  Wallet,
  EnvelopeOpen,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/buttonComp";
import Image from "next/image";

function asArray<T = any>(v: any): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function normalizeMongoId(id: any): string {
  if (id == null) return "";
  if (typeof id === "string" || typeof id === "number") return String(id);

  if (typeof id === "object") {
    if (typeof (id as any).toHexString === "function") {
      return (id as any).toHexString();
    }

    if (typeof (id as any).$oid === "string") return (id as any).$oid;
    if (typeof (id as any).oid === "string") return (id as any).oid;

    if (
      typeof (id as any).id === "string" ||
      typeof (id as any).id === "number"
    ) {
      return String((id as any).id);
    }

    if ((id as any)._id != null) return normalizeMongoId((id as any)._id);

    if (typeof (id as any).toString === "function") {
      const s = (id as any).toString();
      if (s && s !== "[object Object]") return s;
    }
  }

  return "";
}

function isMongoIdString(value: string) {
  return /^[a-f0-9]{24}$/i.test(String(value || "").trim());
}

function removeMongoIdValues(values: string[]) {
  return values.filter((value) => value && !isMongoIdString(value));
}

function pad2(n: number) {
  const x = Math.max(0, Math.floor(Number.isFinite(n) ? n : 0));
  return String(x).padStart(2, "0");
}

function plural(n: number, unit: string) {
  return `${n} ${unit}${n === 1 ? "" : "s"}`;
}

function firstNonEmpty(...values: any[]) {
  for (const value of values) {
    if (Array.isArray(value) && value.length) return value;
    if (value == null) continue;

    const text = String(value).trim();
    if (text) return value;
  }

  return "";
}

function toNumber(value: any) {
  if (typeof value === "number") return value;

  const n = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

function formatNumber(value: any, fallback = "—") {
  if (value == null || value === "") return fallback;

  const n = toNumber(value);

  if (Number.isFinite(n)) return n.toLocaleString("en-IN");

  const text = String(value).trim();
  return text || fallback;
}

function getValidDate(value: any) {
  if (!value) return null;

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;

  return date;
}

function firstValidDate(...values: any[]) {
  for (const value of values) {
    const date = getValidDate(value);
    if (date) return date;
  }

  return null;
}

function formatDate(value: any) {
  const date = getValidDate(value);
  if (!date) return "—";

  return date.toLocaleDateString("en-IN", { dateStyle: "medium" });
}

function formatTimelineDateTime(value: any) {
  const date = getValidDate(value);
  if (!date) return "Pending";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimelineShortDate(value: any) {
  const date = getValidDate(value);
  if (!date) return "";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function toTagValues(input: any): string[] {
  const values = asArray(input)
    .flatMap((item: any) => {
      if (item == null) return [];

      if (typeof item === "string" || typeof item === "number") {
        return String(item)
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
      }

      if (typeof item === "object") {
        const value =
          item?.label ??
          item?.name ??
          item?.title ??
          item?.value ??
          item?.tag ??
          item?.format ??
          item?.range ??
          item?.categoryName ??
          item?.subcategoryName ??
          item?.subCategoryName ??
          item?.goal ??
          item?.goalName ??
          item?.type ??
          item?.campaignType;

        return typeof value === "string" && value.trim()
          ? [value.trim()]
          : [];
      }

      return [];
    })
    .filter(Boolean);

  return Array.from(new Set(values));
}

function getYoutubeId(url: string) {
  try {
    const u = new URL(url);

    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace("/", "") || "";
    }

    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;

      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts.indexOf("shorts");

      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    }
  } catch { }

  return "";
}

function getVideoThumb(url: string) {
  const id = getYoutubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
}

function getInitials(name?: string) {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return "CG";

  const first = words[0]?.[0] || "";
  const second = words[1]?.[0] || "";

  return `${first}${second}`.toUpperCase();
}

const statuses = [
  { label: "Active", dot: "bg-[#28A745]", ring: "bg-[#BCE4C5]" },
  { label: "Paused", dot: "bg-[#DC3545]", ring: "bg-[#F5C6CB]" },
  { label: "Draft", dot: "bg-[#9E9E9E]", ring: "bg-[#E0E0E0]" },
  { label: "Completed", dot: "bg-[#F07B3F]", ring: "bg-[#FAD6C0]" },
];

function StatusDot({ dot, ring }: { dot: string; ring: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full p-[0.125rem] ${ring}`}
    >
      <span className={`h-[0.5rem] w-[0.5rem] rounded-full ${dot}`} />
    </span>
  );
}

function CampaignStatusBadge({ status }: { status: string }) {
  const current =
    statuses.find(
      (s) => s.label.toLowerCase() === String(status).toLowerCase()
    ) ?? null;

  return (
    <div className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E6E6E6] bg-white px-2">
      {current ? <StatusDot dot={current.dot} ring={current.ring} /> : null}

      <span className="capitalize text-sm font-medium text-[#1A1A1A]">
        {status || "draft"}
      </span>
    </div>
  );
}

function SidebarShell({
  children,
  footer,
  embedded = false,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  embedded?: boolean;
}) {
  if (embedded) {
    return (
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[1rem] border border-[#E6E6E6] bg-white">
        <div
          className="min-h-0 flex-1 overflow-y-auto px-[1.25rem] pb-[7rem] pt-[1.25rem]"
          style={{ fontFamily: "var(--Font-Family-Inter, Inter)" }}
        >
          <div className="flex w-full flex-col items-start gap-[1.75rem]">
            {children}
          </div>
        </div>

        {footer ? (
          <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-[#E6E6E6] bg-white px-[1.25rem] py-[0.75rem]">
            {footer}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full justify-end bg-black/20">
      <aside
        className="relative flex h-screen w-full max-w-[45.75rem] flex-col overflow-hidden rounded-t-[1rem] border-x border-t border-[#E6E6E6] bg-white"
        style={{ fontFamily: "var(--Font-Family-Inter, Inter)" }}
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-[1.25rem] pb-[7rem] pt-[1.25rem]">
          <div className="flex w-full flex-col items-start gap-[1.75rem]">
            {children}
          </div>
        </div>

        {footer ? (
          <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-[#E6E6E6] bg-white px-[1.25rem] py-[0.75rem]">
            {footer}
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function TagCard({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="flex min-h-[6.25rem] flex-1 flex-col items-start gap-[1.3125rem] self-stretch rounded-[0.75rem] border border-[#E6E6E6] bg-white p-3">
      <div className="self-stretch text-[0.75rem] font-semibold leading-[1.25rem] text-[#1A1A1A]">
        {title}
      </div>

      <div className="flex flex-wrap items-start gap-2 self-stretch">
        {values.length ? (
          values.map((value, idx) => (
            <span
              key={`${title}-${value}-${idx}`}
              className="flex h-7 items-center justify-center rounded-[1.25rem] bg-[#F9F9F9] px-3"
            >
              <span className="text-[0.75rem] font-medium leading-[1.25rem] text-[#1A1A1A]">
                {value}
              </span>
            </span>
          ))
        ) : (
          <span className="text-[0.875rem] leading-[1.25rem] text-[#969696]">
            —
          </span>
        )}
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex w-full flex-col items-start gap-1">
      <h2 className="text-[1.25rem] font-semibold leading-[1.75rem] text-[#1A1A1A]">
        {title}
      </h2>

      {subtitle ? (
        <p className="text-[0.875rem] font-medium leading-[1.25rem] text-[#B8B8B8]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function InfoMetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-[10rem] flex-1 flex-col items-start rounded-[0.75rem] border border-[#E6E6E6] bg-white p-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-[0.5rem] bg-[#F2F2F2] p-3">
        {icon}
      </div>

      <div className="mt-auto flex flex-col items-start gap-2 self-stretch">
        <div className="text-[0.875rem] font-medium leading-[1.25rem] text-[#B8B8B8]">
          {label}
        </div>

        <div className="break-words text-[1rem] font-medium leading-[1.5rem] text-[#1A1A1A]">
          {value}
        </div>
      </div>
    </div>
  );
}

function RequirementItem({
  label,
  value,
  values,
  helper,
}: {
  label: string;
  value?: string;
  values?: string[];
  helper?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-3 px-2 py-1">
      <div className="text-[1rem] font-medium leading-[1.5rem] text-[#B8B8B8]">
        {label}
      </div>

      {values?.length ? (
        <div className="flex flex-wrap items-center gap-3">
          {values.map((item, index) => (
            <span
              key={`${label}-${item}-${index}`}
              className="text-[1rem] font-semibold leading-[1.5rem] text-[#1A1A1A]"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <div className="text-[1rem] font-semibold leading-[1.5rem] text-[#1A1A1A]">
          {value || "—"}

          {helper ? (
            <span className="ml-2 text-[0.875rem] font-normal leading-[1.25rem] text-[#B8B8B8]">
              {helper}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}

function CreatorRequirementCard({
  numberOfInfluencers,
  influencerTier,
  contentLanguages,
  contentFormats,
  minFollowers,
  maxFollowers,
}: {
  numberOfInfluencers: string;
  influencerTier: string;
  contentLanguages: string;
  contentFormats: string[];
  minFollowers: string;
  maxFollowers: string;
}) {
  return (
    <div className="flex w-full flex-col items-start gap-[1.5rem] self-stretch">
      <SectionTitle title="Creator Requirement" />

      <div className="flex w-full flex-col items-center justify-center gap-[1.25rem] rounded-[0.75rem] border border-[#E6E6E6] bg-white p-4">
        <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-3">
          <RequirementItem
            label="Number of influencers"
            value={numberOfInfluencers}
          />
          <RequirementItem label="Influencer Tier" value={influencerTier} />
          <RequirementItem
            label="Content Language"
            value={contentLanguages}
          />
        </div>

        <div className="h-px w-full bg-[#E6E6E6]" />

        <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-3">
          <RequirementItem label="Content Format" values={contentFormats} />
          <RequirementItem
            label="Min Followers"
            value={minFollowers}
            helper="(min)"
          />
          <RequirementItem
            label="Max Followers"
            value={maxFollowers}
            helper="(max)"
          />
        </div>
      </div>
    </div>
  );
}

function ApplicationTimeline({
  items,
}: {
  items: { title: string; subtitle: string; done: boolean }[];
}) {
  return (
    <section className="flex w-full flex-col items-start gap-[1rem] self-stretch border-b border-[#E6E6E6] pb-[1.25rem]">
      <h2 className="text-[1.25rem] font-semibold leading-[1.75rem] text-[#1A1A1A]">
        Application Timeline
      </h2>

      <div className="flex w-full flex-col items-start">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <div
              key={`${item.title}-${index}`}
              className="flex w-full items-start gap-3"
            >
              <div className="flex flex-col items-center">
                <div
                  className={[
                    "flex h-6 w-6 items-center justify-center rounded-full",
                    item.done
                      ? "bg-[#28A745] text-white"
                      : "border border-[#B8B8B8] bg-white text-[#B8B8B8]",
                  ].join(" ")}
                >
                  <CheckCircle weight="fill" className="h-6 w-6" />
                </div>

                {!isLast ? <div className="h-12 w-px bg-[#E6E6E6]" /> : null}
              </div>

              <div className="flex min-w-0 flex-1 flex-col pb-6">
                <div
                  className={[
                    "text-center font-[var(--Font-family-Body,Inter)]",
                    "text-[var(--Font-size-Small,1rem)] font-semibold",
                    "leading-[var(--Line-height-Small,1.5rem)]",
                    "text-[var(--Light-Text-Primary,#1A1A1A)]",
                  ].join(" ")}
                  style={{
                    fontFeatureSettings: "'liga' off, 'clig' off",
                  }}
                >
                  {item.title}
                </div>

                <div className="text-[0.75rem] font-normal leading-[1rem] text-[#B8B8B8]">
                  {item.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StartConversationCard({
  onMailToBrand,
}: {
  onMailToBrand: () => void;
}) {
  return (
    <section
      className={[
        "flex h-[5.5rem] flex-shrink-0 items-center justify-center",
        "gap-[1rem] self-stretch rounded-[0.75rem] p-[1rem]",
        "overflow-hidden",
      ].join(" ")}
      style={{
        background:
          "linear-gradient(109deg,#D96FD2 0%,#F4584F 34%,#FFC726 58%,#FFF4CA 78%,#FFFFFF 100%)",
      }}
    >
      <div className="flex h-[3rem] w-[3rem] flex-shrink-0 items-center justify-center rounded-[0.5rem] border border-[#E6E6E6] bg-white p-[0.75rem]">
        <ChalkboardTeacher weight="bold" className="h-6 w-6 text-[#1A1A1A]" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-start">
        <div className="text-[1.25rem] font-semibold leading-[1.75rem] tracking-[0] text-white">
          Start the conversation 👋
        </div>

        <div className="line-clamp-2 max-w-[34rem] text-[0.875rem] font-normal leading-[1.25rem] text-white">
          Introduce yourself, ask campaign-related questions, or share why you
          would be a great fit for this collaboration.
        </div>
      </div>

      <Button
        type="button"
        variant="raised"
        size="sm"
        onClick={onMailToBrand}
        className="my-0 h-[2.75rem] flex-shrink-0 rounded-[0.75rem] border border-[#E6E6E6] bg-white px-[1rem] shadow-none"
        leftIcon={
          <PaperPlaneTilt weight="bold" className="h-5 w-5 text-[#1A1A1A]" />
        }
      >
        <span className="text-[1rem] font-medium leading-[1.5rem] text-[#1A1A1A]">
          Mail to Brand
        </span>
      </Button>
    </section>
  );
}

function CampaignHeader({
  logoUrl,
  title,
  productUrl,
  ratingText,
  statusText,
  onConnectBrand,
}: {
  logoUrl: string;
  title: string;
  productUrl: string;
  ratingText: string;
  statusText: string;
  onConnectBrand: () => void;
}) {
  const headerInitials = getInitials(title);

  return (
    <section className="flex w-full flex-col items-start gap-5 self-stretch border-[#E6E6E6] pb-5">
      <div className="flex w-full items-center gap-4">
        <div className="flex h-[6.25rem] w-[6.25rem] flex-shrink-0 items-center justify-center overflow-hidden rounded-[4rem] border border-white/30 bg-[#F9F9F9] text-[1.5rem] font-semibold text-[#1A1A1A]">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={title || "Brand logo"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            headerInitials
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-start">
          <div
            className="line-clamp-2 w-full text-[1.5rem] font-bold leading-8 tracking-normal text-[#1A1A1A]"
            title={title}
          >
            {title}
          </div>

          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
            {ratingText ? (
              <span className="text-[0.75rem] font-normal leading-4 text-[#1A1A1A]">
                ⭐ {ratingText}
              </span>
            ) : null}

            {productUrl ? (
              <a
                href={productUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-w-0 items-center gap-1 text-[0.75rem] font-normal leading-4 text-[#B8B8B8]"
                title={productUrl}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="max-w-[16rem] truncate">{productUrl}</span>
                <ArrowUpRight className="h-4 w-4 flex-shrink-0" />
              </a>
            ) : (
              <span className="text-[0.75rem] font-normal leading-4 text-[#B8B8B8]">
                —
              </span>
            )}
          </div>
        </div>

        <div className="hidden flex-shrink-0 flex-col items-end gap-2 sm:flex">
          <Button
            type="button"
            variant="raised"
            size="sm"
            onClick={onConnectBrand}
            className="my-0 h-10 rounded-[0.75rem] border border-[#E6E6E6] bg-white px-3 shadow-none"
            leftIcon={
              <EnvelopeOpen
                weight="bold"
                className="h-4 w-4 text-[#1A1A1A]"
              />
            }
          >
            <span className="text-[0.875rem] font-medium leading-[1.25rem] text-[#1A1A1A]">
              Connect With Brand
            </span>
          </Button>
        </div>
      </div>

      <div className="flex w-full items-center justify-between gap-2 sm:hidden">
        <Button
          type="button"
          variant="raised"
          size="sm"
          onClick={onConnectBrand}
          className="my-0 h-10 rounded-[0.75rem] border border-[#E6E6E6] bg-white px-3 shadow-none"
          leftIcon={
            <ChalkboardTeacher
              weight="bold"
              className="h-4 w-4 text-[#1A1A1A]"
            />
          }
        >
          <span className="text-[0.875rem] font-medium leading-[1.25rem] text-[#1A1A1A]">
            Connect With Brand
          </span>
        </Button>

        {statusText ? <CampaignStatusBadge status={statusText} /> : null}
      </div>
    </section>
  );
}

function OverviewCompanyTabs({
  activeTab,
  setActiveTab,
}: {
  activeTab: "overview" | "company";
  setActiveTab: React.Dispatch<React.SetStateAction<"overview" | "company">>;
}) {
  const tabs: Array<{ key: "overview" | "company"; label: string }> = [
    { key: "overview", label: "Overview" },
    { key: "company", label: "About Company" },
  ];

  return (
    <div className="flex w-full items-center gap-[2rem] border-b border-[#E6E6E6]">
      {tabs.map((tab) => {
        const active = activeTab === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={[
              "relative flex h-[3rem] items-center justify-center",
              "text-center font-[var(--Font-family-Body,Inter)]",
              "text-[var(--Font-size-Small,1rem)] font-semibold",
              "leading-[var(--Line-height-Small,1.5rem)]",
              active
                ? "text-[var(--Light-Text-Primary,#1A1A1A)]"
                : "text-[#B8B8B8]",
            ].join(" ")}
            style={{
              fontFeatureSettings: "'liga' off, 'clig' off",
            }}
          >
            {tab.label}

            {active ? (
              <span className="absolute bottom-[-1px] left-0 right-0 h-[0.125rem] rounded-full bg-[#FFCC00]" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function CompanyDescriptionPanel({
  brandName,
  brandLogoUrl,
}: {
  brandName: string;
  brandLogoUrl?: string;
}) {
  const initials = getInitials(brandName);

  return (
    <section className="flex w-full flex-col items-start gap-[1rem] self-stretch">
      <SectionTitle title="Company Description" />

      <div className="flex w-full items-center gap-[1rem] rounded-[0.75rem] border border-[#E6E6E6] bg-white p-[1rem]">
        <div className="flex h-[4rem] w-[4rem] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F9F9F9] text-[1rem] font-semibold text-[#1A1A1A]">
          {brandLogoUrl ? (
            <img
              src={brandLogoUrl}
              alt={brandName || "Brand logo"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            initials
          )}
        </div>

        <div className="flex min-w-0 flex-col items-start gap-[0.25rem]">
          <div className="text-[0.875rem] font-medium leading-[1.25rem] text-[#B8B8B8]">
            Brand Name
          </div>

          <div className="truncate text-[1rem] font-semibold leading-[1.5rem] text-[#1A1A1A]">
            {brandName || "—"}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function SidebarCampaign({
  campaignId: campaignIdProp,
  invitationId,
  invitationStatus,
  invitationBrandLogo,
  invitationAppliedAt,
  onInvitationAccepted,
  embedded = false,
}: {
  campaignId?: string;
  invitationId?: string;
  invitationStatus?: string;
  invitationBrandLogo?: string;
  invitationAppliedAt?: string;
  onInvitationAccepted?: (invitationId?: string) => void;
  embedded?: boolean;
}) {
  const router = useRouter();

  const params = useParams();
  const searchParams = useSearchParams();

  const idFromQuery = searchParams.get("id");

  const campaignId = useMemo(
    () =>
      normalizeMongoId(
        campaignIdProp ?? idFromQuery ?? (params as any)?.campaignId
      ),
    [campaignIdProp, idFromQuery, params]
  );

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [doc, setDoc] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "company">(
    "overview"
  );

  const [localInvitationStatus, setLocalInvitationStatus] = useState(
    invitationStatus || ""
  );
  const [localAcceptedAt, setLocalAcceptedAt] = useState("");

  const [influencerId, setInfluencerId] = useState("");
  const [token, setToken] = useState("");

  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    setLocalInvitationStatus(invitationStatus || "");
  }, [invitationStatus]);

  useEffect(() => {
    const id =
      localStorage.getItem("influencerId") ||
      localStorage.getItem("influencerID") ||
      localStorage.getItem("influencer_id") ||
      "";

    const savedToken =
      localStorage.getItem("token") || localStorage.getItem("accessToken") || "";

    setInfluencerId(id);
    setToken(savedToken);

    if (!id) {
      setErr("influencerId not found in localStorage. Please login again.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!influencerId || !campaignId) return;

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setErr("");

      try {
        const res: any = await apiGetfetchCampaignbyId(
          influencerId,
          campaignId,
          token || undefined
        );

        const payload =
          res?.data?.doc ??
          res?.data?.data?.doc ??
          res?.data?.campaign ??
          res?.data?.data ??
          res?.doc ??
          res ??
          null;

        if (!cancelled) {
          setDoc(payload);
          setActiveTab("overview");
        }
      } catch (e) {
        if (!cancelled) {
          setErr(getApiErrorMessage(e, "Failed to load campaign"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [influencerId, campaignId, token]);

  if (loading) {
    return (
      <SidebarShell embedded={embedded}>
        <div className="w-full rounded-2xl border border-[#E6E6E6] bg-white p-6 shadow-sm">
          <div className="h-6 w-64 animate-pulse rounded bg-gray-200" />
          <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-gray-200" />
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
            <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
          </div>
        </div>
      </SidebarShell>
    );
  }

  if (err) {
    return (
      <SidebarShell embedded={embedded}>
        <div className="w-full rounded-2xl border border-[#E6E6E6] bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold text-[#1A1A1A]">
            Couldn’t load campaign
          </div>

          <p className="mt-2 text-sm text-red-600">{err}</p>

          <div className="mt-4 flex gap-2">
            <Button
              variant="raised"
              size="sm"
              className="my-0 rounded-xl border border-[#E6E6E6] bg-white px-4 py-2 text-sm shadow-none"
              onClick={() => router.refresh()}
            >
              Retry
            </Button>

            <Button
              variant="raised"
              size="sm"
              className="my-0 rounded-xl border border-[#E6E6E6] bg-white px-4 py-2 text-sm shadow-none"
              onClick={() => router.back()}
            >
              Go back
            </Button>
          </div>
        </div>
      </SidebarShell>
    );
  }

  if (!doc) {
    return (
      <SidebarShell embedded={embedded}>
        <div className="w-full rounded-2xl border border-[#E6E6E6] bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold text-[#1A1A1A]">
            No campaign found
          </div>
        </div>
      </SidebarShell>
    );
  }

  const details = (doc as any)?.details ?? {};
  const countries = asArray(details?.targetCountries);
  const ages = asArray(details?.targetAgeRanges);
  const platforms = asArray<string>((doc as any)?.platformSelection);

  const descriptionText = String(
    (doc as any)?.description ??
    (doc as any)?.campaignDescription ??
    details?.description ??
    details?.campaignDescription ??
    ""
  ).trim();

  const additionalNotesText = String(
    (doc as any)?.additionalNotes ??
    (doc as any)?.notes ??
    (doc as any)?.additionalInformation ??
    details?.additionalNotes ??
    details?.notes ??
    details?.additionalInformation ??
    ""
  ).trim();

  const hashtags = (() => {
    const detailObjs = asArray((details as any)?.preferredHashtags ?? []);

    const byId = new Map<string, string>();

    detailObjs.forEach((h: any) => {
      const key = normalizeMongoId(h?.id ?? h?._id);
      const tag = typeof h?.tag === "string" ? h.tag.trim() : "";
      if (key && tag) byId.set(key, tag);
    });

    const raw =
      (doc as any)?.preferredHashtags ??
      (details as any)?.preferredHashtags ??
      (doc as any)?.hashtags ??
      (details as any)?.hashtags ??
      [];

    return asArray(raw)
      .map((h: any) => {
        if (typeof h === "string") {
          const s = h.trim();
          if (byId.has(s)) return byId.get(s)!;
          if (/^[a-f0-9]{24}$/i.test(s)) return "";
          return s;
        }

        if (h && typeof h.tag === "string") return h.tag.trim();
        return "";
      })
      .filter(Boolean);
  })();

  const productImages = asArray<any>((doc as any)?.productImages);

  const videoReferenceUrl = String(
    (doc as any)?.videoReference ??
    (doc as any)?.videoReferenceUrl ??
    (doc as any)?.referenceVideoUrl ??
    (doc as any)?.videoUrl ??
    details?.videoReference ??
    details?.videoReferenceUrl ??
    details?.referenceVideoUrl ??
    details?.videoUrl ??
    ""
  ).trim();

  const videoThumbUrl = videoReferenceUrl ? getVideoThumb(videoReferenceUrl) : "";

  const pdfRaw =
    (doc as any)?.pdf ??
    (doc as any)?.pdfAttachment ??
    (doc as any)?.attachment ??
    (doc as any)?.attachments ??
    details?.pdf ??
    details?.pdfAttachment ??
    details?.attachment ??
    details?.attachments ??
    null;

  const pdfItem = Array.isArray(pdfRaw) ? pdfRaw[0] : pdfRaw;

  const pdfUrl =
    typeof pdfItem === "string"
      ? pdfItem
      : pdfItem?.url || pdfItem?.src || pdfItem?.path || "";

  const pdfName =
    typeof pdfItem === "object" && pdfItem?.name
      ? String(pdfItem.name)
      : pdfUrl
        ? "Attachment.pdf"
        : "";

  const pdfSizeBytes =
    typeof pdfItem === "object" && pdfItem?.size != null
      ? Number(pdfItem.size)
      : NaN;

  const pdfSizeText =
    Number.isFinite(pdfSizeBytes) && pdfSizeBytes > 0
      ? `${(pdfSizeBytes / (1024 * 1024)).toFixed(1)} MB`
      : "";

  const targetCountryText = countries.length
    ? countries
      .map((c: any) =>
        `${String(c?.flag ?? "")} ${String(
          c?.countryName ?? c?.countryCode ?? ""
        ).trim()}`.trim()
      )
      .filter(Boolean)
      .join(", ")
    : "—";

  const productUrlRaw =
    details?.productUrl ??
    details?.productLink ??
    (doc as any)?.productUrl ??
    (doc as any)?.productLink ??
    "";

  const productUrl = typeof productUrlRaw === "string" ? productUrlRaw : "";

  const logoUrlRaw =
    invitationBrandLogo ||
    (doc as any)?.brand?.brandprofilepic ||
    (doc as any)?.brand?.brandProfilePic ||
    (doc as any)?.brand?.profileImage ||
    (doc as any)?.brand?.profilePic ||
    (doc as any)?.brand?.logoUrl ||
    (doc as any)?.brand?.logo ||
    (doc as any)?.brandprofilepic ||
    (doc as any)?.brandProfilePic ||
    (doc as any)?.brand_profile_pic ||
    (doc as any)?.brandLogoUrl ||
    (doc as any)?.brandLogo ||
    details?.brand?.brandprofilepic ||
    details?.brand?.brandProfilePic ||
    details?.brand?.profileImage ||
    details?.brandprofilepic ||
    details?.brandProfilePic ||
    details?.brandLogoUrl ||
    details?.brandLogo ||
    "";

  const logoUrl = typeof logoUrlRaw === "string" ? logoUrlRaw : "";

  const campaignTitle = String((doc as any)?.campaignTitle ?? "Campaign");

  const brandName = String(
    firstNonEmpty(
      (doc as any)?.brandName,
      (doc as any)?.brand?.name,
      (doc as any)?.createdBy?.name,
      details?.brandName,
      details?.brand?.name
    ) || "—"
  );

  const statusText = String((doc as any)?.status ?? "").trim();

  const ratingValue = firstNonEmpty(
    (doc as any)?.rating,
    (doc as any)?.brandRating,
    details?.rating,
    details?.brandRating
  );

  const ratingText = ratingValue ? String(ratingValue) : "";

  const totalInfluencers =
    Number((doc as any)?.numberOfInfluencers ?? details?.numberOfInfluencers ?? 0) ||
    0;

  const selectedList =
    (doc as any)?.selectedInfluencers ??
    (doc as any)?.selectedInfluencerIds ??
    (doc as any)?.selectedCreators ??
    (doc as any)?.selectedInfluencer ??
    details?.selectedInfluencers ??
    details?.selectedInfluencerIds ??
    [];

  const selectedCount = asArray(selectedList).length;
  const creatorCount = totalInfluencers || selectedCount;

  const startAt = (doc as any)?.startAt ?? details?.startAt ?? null;
  const endAt = (doc as any)?.endAt ?? details?.endAt ?? null;

  let campaignDurationText = "—";

  try {
    if (startAt && endAt) {
      const a = new Date(startAt).getTime();
      const b = new Date(endAt).getTime();

      if (Number.isFinite(a) && Number.isFinite(b) && b > a) {
        const days = Math.ceil((b - a) / 86400000);
        const months = Math.max(1, Math.round(days / 30));
        campaignDurationText = plural(months, "month");
      }
    } else if ((doc as any)?.timeline) {
      campaignDurationText = String((doc as any)?.timeline);
    }
  } catch { }

  const currency =
    String(
      (doc as any)?.currency ??
      details?.currency ??
      (doc as any)?.budgetCurrency ??
      "USD"
    ) || "USD";

  const budgetRaw =
    (doc as any)?.campaignBudget ??
    details?.campaignBudget ??
    (doc as any)?.totalBudget ??
    null;

  const budgetNum =
    typeof budgetRaw === "number"
      ? budgetRaw
      : Number(String(budgetRaw ?? "").replace(/[^0-9.]/g, ""));

  const budgetText =
    Number.isFinite(budgetNum) && budgetNum > 0
      ? `${currency} ${budgetNum.toLocaleString("en-US")}`
      : "—";

  const startDateText = formatDate(startAt);
  const endDateText = formatDate(endAt);
  const paymentTypeText = String(
    (doc as any)?.paymentType ?? details?.paymentType ?? "—"
  );

  const isAcceptedInvitation =
    String(localInvitationStatus || "").trim().toLowerCase() === "accepted" ||
    String(invitationStatus || "").trim().toLowerCase() === "accepted" ||
    Number((doc as any)?.isAccepted ?? 0) === 1 ||
    String((doc as any)?.invitationStatus || "")
      .trim()
      .toLowerCase() === "accepted" ||
    String((doc as any)?.applicationStatus || "")
      .trim()
      .toLowerCase() === "accepted";

  const hasAppliedValue = isAcceptedInvitation
    ? 1
    : Number((doc as any)?.hasApplied ?? 0);

  const showApplyButton = hasAppliedValue === 0 && !isAcceptedInvitation;

  const appliedAt = firstValidDate(
    localAcceptedAt,
    invitationAppliedAt,
    (doc as any)?.acceptedAt,
    (doc as any)?.appliedAt,
    (doc as any)?.applicationAppliedAt,
    (doc as any)?.application?.appliedAt,
    (doc as any)?.appliedDate,
    isAcceptedInvitation ? (doc as any)?.updatedAt : null,
    hasAppliedValue === 1 ? (doc as any)?.createdAt : null
  );

  const brandViewedAt = firstValidDate(
    (doc as any)?.brandViewedAt,
    (doc as any)?.viewedByBrandAt,
    (doc as any)?.application?.brandViewedAt,
    (doc as any)?.application?.viewedByBrandAt
  );

  const paymentCompletedAt = firstValidDate(
    (doc as any)?.paymentCompletedAt,
    (doc as any)?.payment?.completedAt,
    (doc as any)?.application?.paymentCompletedAt,
    (doc as any)?.completedAt
  );

  const paymentStatus = String(
    (doc as any)?.paymentStatus ??
    (doc as any)?.payment?.status ??
    (doc as any)?.application?.paymentStatus ??
    ""
  ).toLowerCase();

  const isBrandViewed =
    Boolean(brandViewedAt) ||
    Boolean((doc as any)?.isViewedByBrand) ||
    Boolean((doc as any)?.viewedByBrand);

  const isPaymentCompleted =
    Boolean(paymentCompletedAt) || paymentStatus.includes("complete");

  const applicationTimelineItems = [
    {
      title: appliedAt
        ? `Applied on ${formatTimelineShortDate(appliedAt)}`
        : hasAppliedValue === 1
          ? "Applied"
          : "Not applied yet",
      subtitle: appliedAt
        ? formatTimelineDateTime(appliedAt)
        : hasAppliedValue === 1
          ? "Application submitted"
          : "Pending",
      done: hasAppliedValue === 1 || Boolean(appliedAt),
    },
    {
      title: isBrandViewed ? "Viewed by Brand" : "Waiting for Brand View",
      subtitle: brandViewedAt
        ? formatTimelineDateTime(brandViewedAt)
        : isBrandViewed
          ? "Viewed by brand"
          : "Pending",
      done: isBrandViewed,
    },
    {
      title: isPaymentCompleted ? "Payment Completed" : "Payment Pending",
      subtitle: paymentCompletedAt
        ? formatTimelineDateTime(paymentCompletedAt)
        : isPaymentCompleted
          ? "Payment completed"
          : "Pending",
      done: isPaymentCompleted,
    },
  ];

  const categoryTags = (() => {
    const fromDetails = details?.category?.name
      ? [String(details.category.name).trim()]
      : [];

    const fromCategories = asArray((doc as any)?.categories)
      .map((item: any) => String(item?.categoryName ?? "").trim())
      .filter(Boolean);

    const fromRaw = toTagValues(
      (doc as any)?.campaignCategory ??
      (doc as any)?.category ??
      (doc as any)?.categories ??
      []
    );

    return Array.from(new Set([...fromDetails, ...fromCategories, ...fromRaw]));
  })();

  const subcategoryTags = (() => {
    const fromDetails = asArray(details?.subcategories)
      .map((item: any) => String(item?.name ?? "").trim())
      .filter(Boolean);

    const fromCategories = asArray((doc as any)?.categories)
      .map((item: any) => String(item?.subcategoryName ?? "").trim())
      .filter(Boolean);

    const fromRaw = toTagValues(
      (doc as any)?.campaignSubcategory ??
      (doc as any)?.subcategory ??
      (doc as any)?.subCategory ??
      (doc as any)?.subcategories ??
      (doc as any)?.subCategories ??
      []
    );

    return Array.from(new Set([...fromDetails, ...fromCategories, ...fromRaw]));
  })();

  const campaignTypeTags = (() => {
    return Array.from(
      new Set(
        toTagValues(
          (doc as any)?.campaignType ??
          (doc as any)?.campaignTypes ??
          details?.campaignType ??
          details?.campaignTypes ??
          []
        )
      )
    );
  })();

  const campaignGoalTags = (() => {
    const detailGoals = asArray(details?.campaignGoals ?? []);

    const goalById = new Map<string, string>();

    detailGoals.forEach((goal: any) => {
      const id = normalizeMongoId(goal?.id ?? goal?._id);
      const label = String(goal?.goal ?? goal?.name ?? goal?.label ?? "").trim();

      if (id && label) goalById.set(id, label);
    });

    const rawGoals =
      (doc as any)?.campaignGoals ??
      (doc as any)?.campaignGoal ??
      details?.campaignGoals ??
      details?.campaignGoal ??
      [];

    const resolved = asArray(rawGoals)
      .map((goal: any) => {
        if (typeof goal === "string") {
          const s = goal.trim();
          return goalById.get(s) ?? s;
        }

        if (goal && typeof goal === "object") {
          const id = normalizeMongoId(goal?.id ?? goal?._id);

          return (
            String(goal?.goal ?? goal?.name ?? goal?.label ?? "").trim() ||
            goalById.get(id) ||
            ""
          );
        }

        return "";
      })
      .filter(Boolean);

    return removeMongoIdValues(Array.from(new Set(resolved)));
  })();

  const lorem10 = "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do.";

  const backendImageUrls = (productImages ?? [])
    .map(
      (img: any) =>
        img?.dataUrl || img?.imageUrl || img?.url || img?.src || img?.path || ""
    )
    .filter(Boolean);

  const carouselImages = backendImageUrls.length ? backendImageUrls : [];

  const influencerTier = (() => {
    const detailTiers = asArray(details?.influencerTiers)
      .map((tier: any) =>
        [tier?.category, tier?.value].filter(Boolean).join(" ").trim()
      )
      .filter(Boolean);

    return String(
      firstNonEmpty(
        (doc as any)?.influencerTier,
        (doc as any)?.creatorRequirement?.influencerTier,
        details?.influencerTier,
        details?.creatorRequirement?.influencerTier,
        detailTiers.join(" , ")
      ) || "—"
    );
  })();

  const contentLanguages = toTagValues(
    firstNonEmpty(
      (doc as any)?.contentLanguage,
      (doc as any)?.contentLanguages,
      details?.contentLanguage,
      details?.contentLanguages,
      details?.languages
    )
  );

  const contentFormats = (() => {
    const fromDetails = removeMongoIdValues(
      toTagValues(
        firstNonEmpty(
          details?.contentFormat,
          details?.contentFormats,
          details?.creatorRequirement?.contentFormats
        )
      )
    );

    if (fromDetails.length) return fromDetails;

    return removeMongoIdValues(
      toTagValues(
        firstNonEmpty((doc as any)?.contentFormat, (doc as any)?.contentFormats)
      )
    );
  })();

  const minFollowers = formatNumber(
    firstNonEmpty(
      (doc as any)?.minFollowers,
      (doc as any)?.minimumFollowers,
      details?.minFollowers,
      details?.minimumFollowers,
      details?.creatorRequirement?.minFollowers
    )
  );

  const maxFollowers = formatNumber(
    firstNonEmpty(
      (doc as any)?.maxFollowers,
      (doc as any)?.maximumFollowers,
      details?.maxFollowers,
      details?.maximumFollowers,
      details?.creatorRequirement?.maxFollowers
    )
  );

  const brandEmail = String(
    firstNonEmpty(
      (doc as any)?.brandEmail,
      (doc as any)?.brand?.email,
      details?.brandEmail,
      details?.brand?.email
    ) || ""
  ).trim();

  const scrollToSlide = (idx: number) => {
    const el = carouselRef.current;
    if (!el || !carouselImages.length) return;

    const clamped = Math.max(0, Math.min(idx, carouselImages.length - 1));
    const child = el.children.item(clamped) as HTMLElement | null;

    if (child) {
      child.scrollIntoView({
        behavior: "smooth",
        inline: "start",
        block: "nearest",
      });
    }

    setActiveSlide(clamped);
  };

  const onPrevSlide = () => scrollToSlide(activeSlide - 1);
  const onNextSlide = () => scrollToSlide(activeSlide + 1);

  const onCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el) return;

    const kids = Array.from(el.children) as HTMLElement[];
    if (!kids.length) return;

    const left = el.scrollLeft;
    let bestIdx = 0;
    let bestDist = Number.POSITIVE_INFINITY;

    kids.forEach((k, i) => {
      const d = Math.abs(k.offsetLeft - left);

      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });

    setActiveSlide(bestIdx);
  };

  const onDownloadPdf = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  };

  const onMailToBrand = () => {
    if (!brandEmail) return;

    window.location.href = `mailto:${brandEmail}?subject=${encodeURIComponent(
      campaignTitle
    )}`;
  };
  const handleApplyNow = () => {
    const now = new Date().toISOString();

    setLocalInvitationStatus("accepted");
    setLocalAcceptedAt(now);
    onInvitationAccepted?.(invitationId);
  };

  const footer = (
    <div className="flex h-[3rem] w-full items-center gap-[1rem]">
      <button
        type="button"
        className="flex h-[2.5rem] items-center justify-center gap-[0.25rem] rounded-[0.75rem] px-[0.5rem] text-[0.875rem] font-medium leading-[1.25rem] text-[#1A1A1A]"
      >
        ♡ Save
      </button>

      <button
        type="button"
        className="ml-auto flex h-[2.5rem] w-[7rem] items-center justify-center rounded-[0.75rem] px-[0.5rem] text-[0.875rem] font-semibold leading-[1.25rem] text-[#1A1A1A]"
        onClick={() => {
          if (!embedded) router.back();
        }}
      >
        Discard
      </button>

      <button
        type="button"
        disabled={isAcceptedInvitation || !showApplyButton}
        onClick={handleApplyNow}
        className={[
          "flex h-[2.5rem] w-[7rem] items-center justify-center",
          "rounded-[0.75rem] px-[0.5rem]",
          isAcceptedInvitation
            ? "bg-[var(--Light-Background-Disabled,#F5F5F5)] text-[var(--Light-Text-Tertiary,#B8B8B8)]"
            : "bg-[#1A1A1A] text-white",
          "text-[0.875rem] font-semibold leading-[1.25rem]",
          "disabled:cursor-not-allowed disabled:opacity-60",
        ].join(" ")}
      >
        {isAcceptedInvitation ? "Accepted" : "Apply Now"}
      </button>
    </div>
  );

  return (
    <SidebarShell embedded={embedded} footer={footer}>
      <CampaignHeader
        logoUrl={logoUrl}
        title={campaignTitle}
        productUrl={productUrl}
        ratingText={ratingText}
        statusText={statusText}
        onConnectBrand={onMailToBrand}
      />

      <OverviewCompanyTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === "company" ? (
        <CompanyDescriptionPanel brandName={brandName} brandLogoUrl={logoUrl} />
      ) : (
        <>
          <ApplicationTimeline items={applicationTimelineItems} />

          <StartConversationCard onMailToBrand={onMailToBrand} />

          <section className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <TagCard title="Category" values={categoryTags} />
            <TagCard title="Subcategory" values={subcategoryTags} />
            <TagCard title="Campaign type" values={campaignTypeTags} />
            <TagCard title="Campaign Goals" values={campaignGoalTags} />
          </section>

          <section className="flex w-full flex-col items-start gap-6 rounded-[1.25rem] bg-white">
            <SectionTitle title="Description" />

            <div className="flex h-[14.8125rem] w-full flex-col items-start overflow-auto rounded-[0.75rem] border border-[#E6E6E6] bg-white p-3">
              <div className="whitespace-pre-wrap text-[0.875rem] font-medium leading-[1.25rem] text-[#1A1A1A]">
                {descriptionText || "—"}
              </div>
            </div>
          </section>

          <section className="flex w-full flex-col items-start gap-6 rounded-[1.25rem] bg-white">
            <SectionTitle title="Image / Reference" />

            <div className="relative w-full">
              {carouselImages.length ? (
                <>
                  <div
                    ref={carouselRef}
                    onScroll={onCarouselScroll}
                    className="flex w-full items-center gap-5 overflow-x-auto scroll-smooth py-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {carouselImages.map((src, idx) => (
                      <div
                        key={`${src}-${idx}`}
                        className="h-[11.5rem] w-[13.8125rem] flex-none rounded-[1.1875rem] bg-cover bg-center"
                        style={{ backgroundImage: `url(${src})` }}
                      />
                    ))}
                  </div>

                  <Button
                    variant="raised"
                    size="sm"
                    onClick={onPrevSlide}
                    disabled={activeSlide <= 0}
                    className="my-0 absolute left-4 top-[5.625rem] h-[2.75rem] w-[2.75rem] rounded-[2.5rem] border border-transparent bg-[#F2F2F2] px-0 shadow-none"
                    leftIcon={<CaretLeft weight="bold" className="h-5 w-5" />}
                  />

                  <Button
                    variant="raised"
                    size="sm"
                    onClick={onNextSlide}
                    disabled={activeSlide >= carouselImages.length - 1}
                    className="my-0 absolute right-4 top-[5.625rem] h-[2.75rem] w-[2.75rem] rounded-[2.5rem] border border-transparent bg-[#F2F2F2] px-0 shadow-none"
                    leftIcon={
                      <CaretRight weight="bold" className="h-5 w-5" />
                    }
                  />

                  <div className="mt-2 flex w-full items-center justify-center gap-2">
                    {carouselImages.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => scrollToSlide(i)}
                        aria-label={`Go to slide ${i + 1}`}
                        className="h-2 w-2 rounded-[0.5rem]"
                        style={{
                          backgroundColor:
                            i === activeSlide ? "#000000" : "#E8E8E8",
                        }}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex h-[11.5rem] w-full items-center justify-center rounded-[0.75rem] border border-[#E6E6E6] bg-white text-[0.875rem] text-[#969696]">
                  —
                </div>
              )}
            </div>
          </section>

          <CreatorRequirementCard
            numberOfInfluencers={creatorCount ? pad2(creatorCount) : "—"}
            influencerTier={influencerTier}
            contentLanguages={
              contentLanguages.length ? contentLanguages.join(" , ") : "—"
            }
            contentFormats={contentFormats.length ? contentFormats : ["—"]}
            minFollowers={minFollowers}
            maxFollowers={maxFollowers}
          />

          <section className="flex w-full flex-col items-start gap-6 rounded-[1.25rem] bg-white">
            <SectionTitle title="Audience Performance" subtitle={lorem10} />

            <div className="flex w-full flex-col gap-6 sm:flex-row">
              <div className="flex w-full flex-col gap-3 sm:w-1/2">
                <div className="flex h-[4.5rem] flex-col items-start justify-between rounded-[0.75rem] border border-[#E6E6E6] bg-white p-3">
                  <div className="text-[0.875rem] font-medium leading-[1.25rem] text-[#B8B8B8]">
                    Target Platform
                  </div>

                  <div className="flex items-center gap-2">
                    {platforms.length ? (
                      platforms.map((p, idx) => {
                        const key = `${p}-${idx}`;
                        const lower = String(p).toLowerCase();

                        if (lower === "instagram") {
                          return (
                            <Image
                              key={key}
                              src="/skill-icons_instagram.svg"
                              alt="Instagram"
                              width={20}
                              height={20}
                              className="h-5 w-5"
                            />
                          );
                        }

                        if (lower === "youtube") {
                          return (
                            <Image
                              key={key}
                              src="/logos_youtube-icon.svg"
                              alt="YouTube"
                              width={20}
                              height={20}
                              className="h-5 w-5"
                            />
                          );
                        }

                        if (lower === "tiktok") {
                          return (
                            <Image
                              key={key}
                              src="/ic_baseline-tiktok.svg"
                              alt="TikTok"
                              width={20}
                              height={20}
                              className="h-5 w-5"
                            />
                          );
                        }

                        return (
                          <span
                            key={key}
                            className="flex h-7 items-center justify-center rounded-[1.25rem] bg-[#F9F9F9] px-3"
                          >
                            <span className="text-[0.875rem] font-semibold leading-[1.25rem] text-[#1A1A1A]">
                              {String(p)}
                            </span>
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-[0.875rem] text-[#969696]">—</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-start gap-3 rounded-[0.75rem] border border-[#E6E6E6] bg-white p-3">
                  <div className="text-[0.875rem] font-medium leading-[1.25rem] text-[#B8B8B8]">
                    Target Country
                  </div>

                  <div className="mt-2 text-[0.875rem] font-semibold leading-[1.25rem] text-[#1A1A1A]">
                    {targetCountryText}
                  </div>
                </div>

                <div className="flex flex-col items-start gap-3 rounded-[0.75rem] border border-[#E6E6E6] bg-white p-3">
                  <div className="text-[0.875rem] font-medium leading-[1.25rem] text-[#B8B8B8]">
                    Target age group
                  </div>

                  <div className="flex flex-wrap gap-2 self-stretch">
                    {ages.length ? (
                      [...ages]
                        .sort((a: any, b: any) => {
                          const getStartAge = (value: string) => {
                            const match = String(value || "").match(/\d+/);
                            return match ? Number(match[0]) : Infinity;
                          };

                          return getStartAge(a?.range) - getStartAge(b?.range);
                        })
                        .map((a: any, idx: number) => (
                          <span
                            key={`${String(
                              a?.id ?? a?._id ?? a?.range ?? idx
                            )}-${idx}`}
                            className="flex h-7 items-center justify-center rounded-[1.25rem] bg-[#F9F9F9] px-3"
                          >
                            <span className="text-[0.875rem] font-semibold leading-[1.25rem] text-[#1A1A1A]">
                              {String(a?.range ?? "—")}
                            </span>
                          </span>
                        ))
                    ) : (
                      <span className="text-[0.875rem] text-[#969696]">—</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex h-auto w-full flex-col items-start gap-[1.3125rem] rounded-[0.75rem] border border-[#E6E6E6] bg-white p-3 sm:w-1/2">
                <div className="self-stretch text-[0.75rem] font-semibold leading-[1.25rem] text-[#1A1A1A]">
                  Video Reference
                </div>

                {videoReferenceUrl ? (
                  <div className="flex min-w-0 flex-col gap-2">
                    <a
                      href={videoReferenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-[0.875rem] font-medium leading-[1.25rem] text-[#B8B8B8]"
                    >
                      {videoReferenceUrl}
                    </a>

                    <a
                      href={videoReferenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="h-[10.125rem] w-[12.875rem] rounded-[0.25rem] bg-cover bg-center"
                      style={{
                        backgroundImage: videoThumbUrl
                          ? `url(${videoThumbUrl})`
                          : undefined,
                        backgroundColor: videoThumbUrl ? undefined : "#eee",
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-[0.875rem] font-normal leading-[1.25rem] text-[#969696]">
                    —
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="flex w-full flex-col items-start gap-6 rounded-[1.25rem] bg-white">
            <SectionTitle title="Timeline & Payments" />

            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <InfoMetricCard
                icon={
                  <CalendarDots
                    weight="bold"
                    className="h-6 w-6 text-[#1A1A1A]"
                  />
                }
                label="Start date"
                value={startDateText}
              />
              <InfoMetricCard
                icon={
                  <CalendarX
                    weight="bold"
                    className="h-6 w-6 text-[#1A1A1A]"
                  />
                }
                label="End date"
                value={endDateText}
              />
              <InfoMetricCard
                icon={
                  <CalendarDots
                    weight="bold"
                    className="h-6 w-6 text-[#1A1A1A]"
                  />
                }
                label="Timeline"
                value={campaignDurationText}
              />
              <InfoMetricCard
                icon={
                  <Wallet weight="bold" className="h-6 w-6 text-[#1A1A1A]" />
                }
                label="Payment type"
                value={paymentTypeText}
              />
              <InfoMetricCard
                icon={
                  <MoneyWavy
                    weight="bold"
                    className="h-6 w-6 text-[#1A1A1A]"
                  />
                }
                label="Budget"
                value={budgetText}
              />
            </div>
          </section>

          <section className="mb-[1.75rem] flex w-full flex-col items-start gap-6 rounded-[1.25rem] bg-white">
            <SectionTitle title="Additional Information" subtitle={lorem10} />

            <div className="w-full">
              <div className="flex h-[14.8125rem] flex-col items-start overflow-hidden rounded-[0.75rem] border border-[#E6E6E6] bg-white">
                <div className="flex w-full items-center self-stretch rounded-t-[0.6875rem] border-b border-[#E6E6E6] px-3 py-2">
                  <div className="text-[1rem] font-medium leading-[1.5rem] text-[#969696]">
                    Additional Notes
                  </div>
                </div>

                <div className="flex w-full flex-1 items-start justify-between self-stretch overflow-auto p-3">
                  <div className="whitespace-pre-wrap text-[0.875rem] font-medium leading-[1.25rem] text-[#1A1A1A]">
                    {additionalNotesText || "—"}
                  </div>
                </div>
              </div>

              {pdfUrl ? (
                <div className="mt-5 flex w-full items-center justify-between rounded-[0.75rem] border border-[#E6E6E6] bg-white px-3 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <FilePdf
                      weight="bold"
                      className="h-8 w-8 flex-shrink-0 text-[#1A1A1A]"
                    />

                    <div className="flex min-w-0 flex-col">
                      <div className="truncate text-[1rem] font-medium leading-[1.5rem] text-[#1A1A1A]">
                        {pdfName}
                      </div>

                      {pdfSizeText ? (
                        <div className="text-[0.875rem] font-normal leading-[1.25rem] text-[#969696]">
                          {pdfSizeText}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <Button
                    variant="raised"
                    size="sm"
                    onClick={onDownloadPdf}
                    className="my-0 h-[2.0625rem] w-[7rem] rounded-[0.75rem] border border-transparent bg-white px-2 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.08),0_4px_8px_-2px_rgba(0,0,0,0.04)]"
                    leftIcon={
                      <DownloadSimple
                        weight="bold"
                        className="h-[0.875rem] w-[0.875rem]"
                      />
                    }
                  >
                    <span className="text-center text-[0.75rem] font-semibold leading-[1.25rem] text-[#1A1A1A]">
                      Download
                    </span>
                  </Button>
                </div>
              ) : null}

              <div className="mt-5 flex min-h-[7rem] flex-col items-start gap-[1.3125rem] rounded-[0.75rem] border border-[#E6E6E6] bg-white p-3">
                <div className="text-[0.75rem] font-semibold leading-[1.25rem] text-[#1A1A1A]">
                  Hashtags
                </div>

                <div className="flex flex-wrap gap-2 self-stretch">
                  {hashtags.length ? (
                    hashtags.map((tag: string, idx: number) => (
                      <span
                        key={`${tag}-${idx}`}
                        className="flex h-7 items-center justify-center rounded-[1.25rem] bg-[#F9F9F9] px-3"
                      >
                        <span className="text-[0.75rem] font-medium leading-[1.25rem] text-[#1A1A1A]">
                          {tag}
                        </span>
                      </span>
                    ))
                  ) : (
                    <span className="text-[0.875rem] leading-[1.25rem] text-[#969696]">
                      —
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </SidebarShell>
  );
}