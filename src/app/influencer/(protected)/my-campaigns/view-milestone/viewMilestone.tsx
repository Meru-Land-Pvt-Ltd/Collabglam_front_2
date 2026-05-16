"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ArrowLeft,
    CalendarDays,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    Clock3,
    FolderOpen,
    Loader2,
    MessageSquareMore,
    PlusCircle,
    Wallet,
    X,
} from "lucide-react";

import { Button } from "@/components/ui/buttonComp";
import { toast } from "@/components/ui/toast";
import {
    apiAcceptMilestoneByInfluencer,
    apiGetMilestonesByInfluencer,
    apiSubmitDeliverable,
    getApiErrorMessage,
} from "@/app/influencer/services/influencerApi";

type PayoutStatus = "pending" | "initiated" | "paid";
type ModalMode = "deliverable" | "revision";

type DeliverableLinkRow = {
    label: string;
    url: string;
};

type MilestoneDeliverableRow = {
    _id?: string;
    deliverableId?: string;
    deliverableName?: string;
    title?: string;
    deliveries?: string[];
    aspectRatio?: string;
    platforms?: string[];
    quantity?: number;
    submittedAt?: string | null;
    status?: "pending" | "submitted" | "approved" | "revision" | string;
    comments?: string;
    approvedRole?: string;
    approvalId?: string;
    approvedAt?: string | null;
    revisionRequestedAt?: string | null;
    deliverableLinks?: DeliverableLinkRow[];
    revisions?: any[];
    createdAt?: string | null;
    updatedAt?: string | null;
    [key: string]: any;
};

type CampaignMilestoneRow = {
    milestoneHistoryId: string;
    milestoneId: string;
    campaignId: string;
    brandId: string;
    influencerId: string;
    influencerName?: string;
    name?: string;
    influencer?: {
        name?: string;
    };
    contractId?: string;
    milestoneTitle: string;
    milestoneDescription?: string;
    milestoneBudget?: number;
    amount: number;
    payoutStatus: PayoutStatus;
    status?: string;
    released?: boolean;
    createdAt?: string | null;
    updatedAt?: string | null;
    releasedAt?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    graceDays?: number;
    submissionLink?: string;
    needDraftFirst?: boolean;
    draftDate?: string | null;
    isAccepted?: number;
    deliverables?: MilestoneDeliverableRow[];
    [key: string]: any;
};

type SubmitLinksFormState = {
    links: DeliverableLinkRow[];
};

const NA = "—";

function formatMoney(amount: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    }).format(Number(amount || 0));
}

function formatDate(value?: string | null) {
    if (!value) return NA;

    const d = new Date(value);

    if (Number.isNaN(d.getTime())) return NA;

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    }).format(d);
}

function formatDateTime(value?: string | null) {
    if (!value) return NA;

    const d = new Date(value);

    if (Number.isNaN(d.getTime())) return NA;

    return d.toLocaleString();
}

function humanizeText(value: any) {
    if (value === undefined || value === null || value === "") return NA;

    return String(value)
        .replace(/_/g, " ")
        .replace(/-/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDeliveries(value: any) {
    const list = Array.isArray(value) ? value : value ? [value] : [];

    if (list.length === 0) return NA;

    return list.map(humanizeText).join(", ");
}

function normalizePayoutStatus(row: any): PayoutStatus {
    const payoutStatus = String(row?.payoutStatus || "").toLowerCase();
    const status = String(row?.status || "").toLowerCase();

    if (
        payoutStatus === "paid" ||
        status.includes("paid") ||
        status.includes("released") ||
        row?.released ||
        row?.releasedAt
    ) {
        return "paid";
    }

    if (
        payoutStatus === "initiated" ||
        status.includes("initiated") ||
        status.includes("processing")
    ) {
        return "initiated";
    }

    return "pending";
}

function isReleased(row: CampaignMilestoneRow) {
    const status = String(row.status || "").toLowerCase();

    return (
        Boolean(row.released) ||
        Boolean(row.releasedAt) ||
        row.payoutStatus === "paid" ||
        status.includes("released") ||
        status.includes("paid")
    );
}

function isMilestoneAccepted(milestone?: CampaignMilestoneRow | null) {
    return Number(milestone?.isAccepted || 0) === 1;
}

function normalizeDeliverableStatus(status: any) {
    return String(status || "pending").trim().toLowerCase();
}

function isApprovedStatus(value?: string | number | null) {
    return normalizeDeliverableStatus(value) === "approved";
}

function isRevisionStatus(value?: string | number | null) {
    return normalizeDeliverableStatus(value) === "revision";
}

function getDeliverableId(deliverable: MilestoneDeliverableRow) {
    return String(deliverable?.deliverableId || deliverable?._id || "");
}

function getRequiredLinkCount(deliverable?: MilestoneDeliverableRow | null) {
    const quantity = Number(deliverable?.quantity || 1);

    if (!Number.isFinite(quantity) || quantity <= 0) return 1;

    return Math.max(1, Math.floor(quantity));
}

function getSubmittedLinks(deliverable?: MilestoneDeliverableRow | null) {
    return Array.isArray(deliverable?.deliverableLinks)
        ? deliverable.deliverableLinks.filter((item) =>
              String(item?.url || "").trim()
          )
        : [];
}

function getSubmittedLinksCount(deliverable?: MilestoneDeliverableRow | null) {
    return getSubmittedLinks(deliverable).length;
}

function getPaidRevisionRows(deliverable?: MilestoneDeliverableRow | null) {
    const revisions = Array.isArray(deliverable?.revisions)
        ? deliverable.revisions
        : [];

    return revisions.filter(
        (revision: any) =>
            String(revision?.revisionType || "").toLowerCase() === "paid" &&
            Number(revision?.revisionBudget || 0) > 0
    );
}

function getTotalPaidRevisionBudget(
    deliverable?: MilestoneDeliverableRow | null
) {
    return getPaidRevisionRows(deliverable).reduce(
        (sum: number, revision: any) =>
            sum + Number(revision?.revisionBudget || 0),
        0
    );
}

function isMilestoneTimelineOver(milestone?: CampaignMilestoneRow | null) {
    if (!milestone?.endDate) return false;

    const end = new Date(milestone.endDate);

    if (Number.isNaN(end.getTime())) return false;

    end.setHours(23, 59, 59, 999);

    return Date.now() > end.getTime();
}

function buildInitialLinks(deliverable: MilestoneDeliverableRow) {
    const requiredCount = getRequiredLinkCount(deliverable);
    const existingLinks = getSubmittedLinks(deliverable).slice(0, requiredCount);

    const links: DeliverableLinkRow[] = existingLinks.map((item, index) => ({
        label: item.label || `Deliverable Link ${index + 1}`,
        url: item.url || "",
    }));

    while (links.length < requiredCount) {
        links.push({
            label: `Deliverable Link ${links.length + 1}`,
            url: "",
        });
    }

    return links;
}

function getPlatformIconSrc(platform: string) {
    const normalized = String(platform || "").toLowerCase();

    if (normalized.includes("youtube")) return "/logos_youtube-icon.svg";
    if (normalized.includes("instagram")) return "/skill-icons_instagram.svg";
    if (normalized.includes("tiktok") || normalized.includes("tik tok")) {
        return "/ic_baseline-tiktok.svg";
    }

    return "";
}

function statusBadge(status: any, released?: boolean) {
    const normalized = normalizeDeliverableStatus(status);

    if (released || normalized === "paid" || normalized === "released") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Released
            </span>
        );
    }

    if (normalized === "approved") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Approved
            </span>
        );
    }

    if (normalized === "submitted") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                <Clock3 className="h-3.5 w-3.5" />
                Submitted
            </span>
        );
    }

    if (normalized === "revision") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                <MessageSquareMore className="h-3.5 w-3.5" />
                Revision Requested
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            <Clock3 className="h-3.5 w-3.5" />
            Pending
        </span>
    );
}

function PlatformBadgeIcon({ platform }: { platform: string }) {
    const icon = getPlatformIconSrc(platform);

    return (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#E6E6E6] bg-white p-1.5">
            {icon ? (
                <img
                    src={icon}
                    alt={`${platform} icon`}
                    className="h-4 w-4 object-contain"
                    draggable={false}
                />
            ) : (
                <span className="text-[10px] font-semibold text-[#1A1A1A]">
                    {platform ? platform.slice(0, 1).toUpperCase() : "?"}
                </span>
            )}
        </span>
    );
}

function PlatformBadgeIcons({ platforms }: { platforms?: string[] }) {
    const list = Array.isArray(platforms) ? platforms.filter(Boolean) : [];

    if (list.length === 0) {
        return <span className="text-sm text-[#969696]">{NA}</span>;
    }

    return (
        <div className="flex items-center -space-x-1">
            {list.map((platform) => (
                <PlatformBadgeIcon key={platform} platform={platform} />
            ))}
        </div>
    );
}

function normalizeMilestone(row: any): CampaignMilestoneRow {
    return {
        milestoneHistoryId: String(row?.milestoneHistoryId || row?._id || ""),
        milestoneId: String(row?.milestoneId || ""),
        campaignId: String(row?.campaignId || ""),
        brandId: String(row?.brandId || ""),
        influencerId: String(row?.influencerId || ""),
        influencerName:
            row?.influencerName ||
            row?.influencer?.name ||
            row?.name ||
            "",
        contractId: row?.contractId || "",
        milestoneTitle:
            row?.milestoneTitle ||
            row?.title ||
            row?.name ||
            "Untitled Milestone",
        milestoneDescription:
            row?.milestoneDescription ||
            row?.description ||
            "",
        milestoneBudget: Number(row?.milestoneBudget || row?.amount || 0),
        amount: Number(row?.amount || row?.milestoneBudget || 0),
        payoutStatus: normalizePayoutStatus(row),
        status: row?.status || row?.payoutStatus || "pending",
        released: Boolean(row?.released),
        createdAt: row?.createdAt || null,
        updatedAt: row?.updatedAt || null,
        releasedAt: row?.releasedAt || null,
        startDate: row?.startDate || null,
        endDate: row?.endDate || null,
        graceDays: Number(row?.graceDays || 0),
        submissionLink: row?.submissionLink || "",
        needDraftFirst: Boolean(row?.needDraftFirst),
        draftDate: row?.draftDate || null,
        isAccepted: Number(row?.isAccepted || 0),
        deliverables: Array.isArray(row?.deliverables)
            ? row.deliverables.map((item: any) => ({
                  ...item,
                  deliverableId: String(item?.deliverableId || item?._id || ""),
                  status: item?.status || "pending",
                  deliverableLinks: Array.isArray(item?.deliverableLinks)
                      ? item.deliverableLinks
                      : [],
                  revisions: Array.isArray(item?.revisions)
                      ? item.revisions
                      : [],
              }))
            : [],
        ...row,
    };
}

function MilestoneDetail({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="flex min-w-0 flex-col gap-1 rounded-xl bg-[#F9FAFB] px-4 py-3">
            <span className="text-xs font-medium uppercase tracking-wide text-[#8A8A8A]">
                {label}
            </span>

            <div className="min-w-0 text-sm font-semibold text-[#1A1A1A]">
                {value}
            </div>
        </div>
    );
}

function DeliverableLinksView({ links }: { links?: DeliverableLinkRow[] }) {
    const list = Array.isArray(links) ? links.filter((item) => item?.url) : [];

    if (list.length === 0) {
        return <span className="text-sm text-[#969696]">{NA}</span>;
    }

    return (
        <div className="flex flex-col gap-1">
            {list.map((item, index) => (
                <a
                    key={`${item.url}-${index}`}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-[#1A1A1A] underline"
                >
                    {item.label || `Deliverable Link ${index + 1}`}
                </a>
            ))}
        </div>
    );
}

function DeliverableCard({
    milestone,
    deliverable,
    onOpenSubmit,
}: {
    milestone: CampaignMilestoneRow;
    deliverable: MilestoneDeliverableRow;
    onOpenSubmit: (
        milestone: CampaignMilestoneRow,
        deliverable: MilestoneDeliverableRow,
        mode: ModalMode
    ) => void;
}) {
    const status = normalizeDeliverableStatus(deliverable.status);
    const requiredLinks = getRequiredLinkCount(deliverable);
    const submittedLinks = getSubmittedLinksCount(deliverable);
    const timelineOver = isMilestoneTimelineOver(milestone);
    const milestoneAccepted = isMilestoneAccepted(milestone);

    const paidRevisionRows = getPaidRevisionRows(deliverable);
    const totalPaidRevisionBudget = getTotalPaidRevisionBudget(deliverable);
    const shouldShowRevisionBudget = totalPaidRevisionBudget > 0;

    const buttonMode: ModalMode =
        status === "revision" ? "revision" : "deliverable";

    const buttonLabel =
        status === "revision" ? "Add Revision" : "Add Deliverable";

    const linksCompleted = submittedLinks >= requiredLinks;

    const isLocked =
        !milestoneAccepted ||
        isReleased(milestone) ||
        isApprovedStatus(status) ||
        timelineOver ||
        (status !== "revision" && linksCompleted);

    const lockText = !milestoneAccepted
        ? "Accept milestone first"
        : timelineOver
          ? "Timeline ended"
          : isReleased(milestone)
            ? "Released"
            : isApprovedStatus(status)
              ? "Approved"
              : status !== "revision" && linksCompleted
                ? "All links submitted"
                : "";

    return (
        <div className="rounded-2xl border border-[#E6E6E6] bg-white p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-semibold text-[#1A1A1A]">
                            {deliverable.deliverableName ||
                                deliverable.title ||
                                "Deliverable"}
                        </h4>

                        {statusBadge(status)}
                    </div>

                    <div
                        className={[
                            "mt-4 grid grid-cols-1 gap-3 md:grid-cols-2",
                            shouldShowRevisionBudget
                                ? "xl:grid-cols-5"
                                : "xl:grid-cols-4",
                        ].join(" ")}
                    >
                        <MilestoneDetail
                            label="Content Format"
                            value={formatDeliveries(deliverable.deliveries)}
                        />

                        <MilestoneDetail
                            label="Aspect Ratio"
                            value={deliverable.aspectRatio || NA}
                        />

                        <MilestoneDetail
                            label="Platform"
                            value={
                                <PlatformBadgeIcons
                                    platforms={deliverable.platforms}
                                />
                            }
                        />

                        <MilestoneDetail
                            label="Quantity"
                            value={String(requiredLinks).padStart(2, "0")}
                        />

                        {shouldShowRevisionBudget ? (
                            <MilestoneDetail
                                label={
                                    paidRevisionRows.length > 1
                                        ? "Paid Revision Budget"
                                        : "Revision Budget"
                                }
                                value={
                                    <span>
                                        {formatMoney(totalPaidRevisionBudget)}
                                        {paidRevisionRows.length > 1 ? (
                                            <span className="ml-1 text-xs font-medium text-[#969696]">
                                                ({paidRevisionRows.length} paid
                                                revisions)
                                            </span>
                                        ) : null}
                                    </span>
                                }
                            />
                        ) : null}
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <MilestoneDetail
                            label="Submitted Links"
                            value={`${submittedLinks}/${requiredLinks}`}
                        />

                        <MilestoneDetail
                            label="Submitted At"
                            value={formatDateTime(deliverable.submittedAt)}
                        />
                    </div>

                    <div className="mt-4">
                        <MilestoneDetail
                            label="Submitted Link Details"
                            value={
                                <DeliverableLinksView
                                    links={deliverable.deliverableLinks}
                                />
                            }
                        />
                    </div>

                    {deliverable.comments ? (
                        <p className="mt-3 rounded-xl bg-[#F9F9F9] px-4 py-3 text-sm text-[#5F5F5F]">
                            {deliverable.comments}
                        </p>
                    ) : null}
                </div>

                <div className="flex shrink-0 flex-col gap-2">
                    <Button
                        type="button"
                        disabled={isLocked}
                        onClick={() =>
                            onOpenSubmit(milestone, deliverable, buttonMode)
                        }
                        className="h-10 rounded-lg px-4 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {buttonLabel}
                    </Button>

                    {isLocked ? (
                        <span className="text-center text-xs text-[#969696]">
                            {lockText}
                        </span>
                    ) : submittedLinks > 0 && status !== "revision" ? (
                        <span className="text-center text-xs text-[#969696]">
                            {requiredLinks - submittedLinks} link
                            {requiredLinks - submittedLinks === 1 ? "" : "s"}{" "}
                            remaining
                        </span>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function SubmitLinksModal({
    open,
    mode,
    milestone,
    deliverable,
    form,
    submitting,
    error,
    onClose,
    onChangeLink,
    onAddLink,
    onRemoveLink,
    onSubmit,
}: {
    open: boolean;
    mode: ModalMode;
    milestone: CampaignMilestoneRow | null;
    deliverable: MilestoneDeliverableRow | null;
    form: SubmitLinksFormState;
    submitting: boolean;
    error: string;
    onClose: () => void;
    onChangeLink: (
        index: number,
        field: keyof DeliverableLinkRow,
        value: string
    ) => void;
    onAddLink: () => void;
    onRemoveLink: (index: number) => void;
    onSubmit: () => void;
}) {
    if (!open || !milestone || !deliverable) return null;

    const requiredLinks = getRequiredLinkCount(deliverable);
    const title = mode === "revision" ? "Add Revision" : "Add Deliverable";
    const subtitle =
        mode === "revision"
            ? `Submit exactly ${requiredLinks} revised deliverable link${
                  requiredLinks === 1 ? "" : "s"
              }.`
            : `Submit exactly ${requiredLinks} deliverable link${
                  requiredLinks === 1 ? "" : "s"
              }.`;

    const canAddMoreRows = form.links.length < requiredLinks;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
                    <div className="min-w-0">
                        <h2 className="text-[18px] font-semibold text-[#1F2937]">
                            {title}
                        </h2>

                        <p className="mt-1 text-sm text-[#6B7280]">
                            {subtitle}
                        </p>

                        <p className="mt-2 truncate text-xs text-[#969696]">
                            {milestone.milestoneTitle} &gt;{" "}
                            {deliverable.deliverableName ||
                                deliverable.title ||
                                "Deliverable"}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="rounded-md p-1 text-[#374151] hover:bg-gray-100 disabled:opacity-60"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-5 px-6 py-5">
                    <div className="rounded-2xl border border-gray-200 bg-[#F9FAFB]">
                        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                            <h3 className="text-sm font-semibold text-[#4B5563]">
                                Submit Links
                            </h3>

                            <span className="text-xs font-medium text-[#6B7280]">
                                {
                                    form.links.filter((item) =>
                                        item.url.trim()
                                    ).length
                                }
                                /{requiredLinks}
                            </span>
                        </div>

                        <div className="space-y-4 p-4">
                            {form.links.map((item, index) => (
                                <div
                                    key={index}
                                    className="rounded-2xl border border-gray-200 bg-white p-4"
                                >
                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="text-[15px] font-semibold text-[#1F2937]">
                                            Link {index + 1}
                                        </div>

                                        {form.links.length > 1 ? (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onRemoveLink(index)
                                                }
                                                className="text-xs font-medium text-red-600 hover:underline"
                                            >
                                                Remove
                                            </button>
                                        ) : null}
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-[#4B5563]">
                                                Label
                                            </label>

                                            <input
                                                type="text"
                                                value={item.label}
                                                onChange={(e) =>
                                                    onChangeLink(
                                                        index,
                                                        "label",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder={`Deliverable Link ${
                                                    index + 1
                                                }`}
                                                className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-gray-400"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-[#4B5563]">
                                                URL
                                            </label>

                                            <input
                                                type="url"
                                                value={item.url}
                                                onChange={(e) =>
                                                    onChangeLink(
                                                        index,
                                                        "url",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="https://drive.google.com/..."
                                                className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-gray-400"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {canAddMoreRows ? (
                                <button
                                    type="button"
                                    onClick={onAddLink}
                                    className="inline-flex h-11 items-center rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-[#1F2937] transition hover:bg-gray-50"
                                >
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add another link
                                </button>
                            ) : null}
                        </div>
                    </div>

                    {error ? (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    ) : null}
                </div>

                <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-[#6B7280]">
                        Required links: {requiredLinks}
                    </p>

                    <div className="flex items-center justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={submitting}
                            className="h-11 rounded-xl border border-gray-300 px-5"
                        >
                            Cancel
                        </Button>

                        <Button
                            type="button"
                            onClick={onSubmit}
                            disabled={submitting}
                            className="inline-flex h-11 items-center rounded-xl bg-[#F4D77A] px-6 text-sm font-medium text-[#374151] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : mode === "revision" ? (
                                "Submit Revision"
                            ) : (
                                "Submit Deliverable"
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function InfluencerMilestonesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const campaignId =
        searchParams.get("campaignId") ||
        searchParams.get("campaign_id") ||
        searchParams.get("id") ||
        "";

    const campaignTitle = searchParams.get("campaignTitle") || "My Milestones";

    const [milestones, setMilestones] = useState<CampaignMilestoneRow[]>([]);
    const [loading, setLoading] = useState(true);

    const [influencerId, setInfluencerId] = useState("");
    const [token, setToken] = useState("");

    const [expandedMilestoneIds, setExpandedMilestoneIds] = useState<
        Record<string, boolean>
    >({});

    const [acceptingMilestoneIds, setAcceptingMilestoneIds] = useState<
        Record<string, boolean>
    >({});

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>("deliverable");
    const [activeMilestone, setActiveMilestone] =
        useState<CampaignMilestoneRow | null>(null);
    const [activeDeliverable, setActiveDeliverable] =
        useState<MilestoneDeliverableRow | null>(null);

    const [submitting, setSubmitting] = useState(false);
    const [modalError, setModalError] = useState("");

    const [form, setForm] = useState<SubmitLinksFormState>({
        links: [{ label: "", url: "" }],
    });

    const loadMilestones = useCallback(
        async (currentInfluencerId?: string, currentToken?: string) => {
            const finalInfluencerId =
                currentInfluencerId ||
                influencerId ||
                (typeof window !== "undefined"
                    ? localStorage.getItem("influencerId") ||
                      localStorage.getItem("userId") ||
                      ""
                    : "");

            const finalToken =
                currentToken ||
                token ||
                (typeof window !== "undefined"
                    ? localStorage.getItem("influencerToken") ||
                      localStorage.getItem("token") ||
                      ""
                    : "");

            if (!finalInfluencerId) {
                setLoading(false);

                toast({
                    icon: "error",
                    title: "Influencer ID not found",
                    text: "Please log in again and try once more.",
                });

                return;
            }

            try {
                setLoading(true);

                const milestoneRes = await apiGetMilestonesByInfluencer(
                    finalInfluencerId,
                    finalToken
                );

                const milestoneRows = Array.isArray(milestoneRes?.milestones)
                    ? milestoneRes.milestones.map(normalizeMilestone)
                    : [];

                const filteredMilestones = campaignId
                    ? milestoneRows.filter(
                          (item) =>
                              String(item.campaignId) === String(campaignId)
                      )
                    : milestoneRows;

                setMilestones(filteredMilestones);
            } catch (err: any) {
                toast({
                    icon: "error",
                    title: "Failed to load milestones",
                    text: getApiErrorMessage(
                        err,
                        "Something went wrong while loading milestones."
                    ),
                });

                setMilestones([]);
            } finally {
                setLoading(false);
            }
        },
        [campaignId, influencerId, token]
    );

    useEffect(() => {
        if (typeof window === "undefined") return;

        const savedInfluencerId =
            localStorage.getItem("influencerId") ||
            localStorage.getItem("userId") ||
            searchParams.get("influencerId") ||
            "";

        const savedToken =
            localStorage.getItem("influencerToken") ||
            localStorage.getItem("token") ||
            "";

        setInfluencerId(savedInfluencerId);
        setToken(savedToken);

        loadMilestones(savedInfluencerId, savedToken);
    }, [loadMilestones, searchParams]);

    const sortedMilestones = useMemo(() => {
        return [...milestones].sort(
            (a, b) =>
                new Date(b.createdAt || "").getTime() -
                new Date(a.createdAt || "").getTime()
        );
    }, [milestones]);

    const handleToggleMilestone = (milestoneHistoryId: string) => {
        setExpandedMilestoneIds((prev) => ({
            ...prev,
            [milestoneHistoryId]: !prev[milestoneHistoryId],
        }));
    };

    const handleAllDeliverables = () => {
        const base = "/influencer/all-deliverables";

        router.push(
            campaignId
                ? `${base}?campaignId=${encodeURIComponent(campaignId)}`
                : base
        );
    };

    const handleAcceptMilestone = async (milestone: CampaignMilestoneRow) => {
        const milestoneId = String(milestone?.milestoneId || "");
        const milestoneHistoryId = String(milestone?.milestoneHistoryId || "");
        const resolvedInfluencerId = String(
            milestone?.influencerId || influencerId || ""
        );

        if (!milestoneId || !milestoneHistoryId || !resolvedInfluencerId) {
            toast({
                icon: "warning",
                title: "Milestone unavailable",
                text: "Missing milestone or influencer details.",
            });
            return;
        }

        if (Number(milestone?.isAccepted || 0) === 1) {
            return;
        }

        try {
            setAcceptingMilestoneIds((prev) => ({
                ...prev,
                [milestoneHistoryId]: true,
            }));

            await apiAcceptMilestoneByInfluencer(
                {
                    milestoneId,
                    milestoneHistoryId,
                    influencerId: resolvedInfluencerId,
                },
                token
            );

            setMilestones((prev) =>
                prev.map((item) =>
                    String(item.milestoneHistoryId) ===
                    String(milestoneHistoryId)
                        ? {
                              ...item,
                              isAccepted: 1,
                          }
                        : item
                )
            );

            toast({
                icon: "success",
                title: "Milestone accepted",
                text: "You have accepted this milestone successfully.",
            });
        } catch (err: any) {
            toast({
                icon: "error",
                title: "Accept failed",
                text: getApiErrorMessage(
                    err,
                    "Failed to accept milestone. Please try again."
                ),
            });
        } finally {
            setAcceptingMilestoneIds((prev) => ({
                ...prev,
                [milestoneHistoryId]: false,
            }));
        }
    };

    const openSubmitModal = (
        milestone: CampaignMilestoneRow,
        deliverable: MilestoneDeliverableRow,
        mode: ModalMode
    ) => {
        const status = normalizeDeliverableStatus(deliverable.status);
        const requiredLinks = getRequiredLinkCount(deliverable);
        const submittedLinks = getSubmittedLinksCount(deliverable);
        const timelineOver = isMilestoneTimelineOver(milestone);

        if (!isMilestoneAccepted(milestone)) {
            toast({
                icon: "warning",
                title: "Accept milestone first",
                text: "Please accept this milestone before submitting a deliverable.",
            });
            return;
        }

        if (timelineOver) {
            toast({
                icon: "warning",
                title: "Timeline ended",
                text: "You cannot submit deliverable links after the milestone end date.",
            });
            return;
        }

        if (isReleased(milestone)) {
            toast({
                icon: "info",
                title: "Milestone released",
                text: "This milestone has already been released.",
            });
            return;
        }

        if (status === "approved") {
            toast({
                icon: "info",
                title: "Action locked",
                text: "This deliverable has already been approved.",
            });
            return;
        }

        if (status !== "revision" && submittedLinks >= requiredLinks) {
            toast({
                icon: "info",
                title: "All links submitted",
                text: `You already submitted ${requiredLinks} deliverable link${
                    requiredLinks === 1 ? "" : "s"
                }.`,
            });
            return;
        }

        setActiveMilestone(milestone);
        setActiveDeliverable(deliverable);
        setModalMode(mode);
        setModalError("");
        setForm({
            links: buildInitialLinks(deliverable),
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        if (submitting) return;

        setIsModalOpen(false);
        setActiveMilestone(null);
        setActiveDeliverable(null);
        setModalError("");
        setForm({
            links: [{ label: "", url: "" }],
        });
    };

    const updateLink = (
        index: number,
        field: keyof DeliverableLinkRow,
        value: string
    ) => {
        setModalError("");

        setForm((prev) => ({
            ...prev,
            links: prev.links.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            ),
        }));
    };

    const addLinkRow = () => {
        if (!activeDeliverable) return;

        const requiredLinks = getRequiredLinkCount(activeDeliverable);

        setModalError("");

        setForm((prev) => {
            if (prev.links.length >= requiredLinks) {
                return prev;
            }

            return {
                ...prev,
                links: [
                    ...prev.links,
                    {
                        label: `Deliverable Link ${prev.links.length + 1}`,
                        url: "",
                    },
                ],
            };
        });
    };

    const removeLinkRow = (index: number) => {
        setModalError("");

        setForm((prev) => ({
            ...prev,
            links: prev.links.filter((_, i) => i !== index),
        }));
    };

    const handleSubmitDeliverable = async () => {
        if (!activeMilestone || !activeDeliverable) return;

        if (!isMilestoneAccepted(activeMilestone)) {
            setModalError(
                "Please accept this milestone before submitting a deliverable."
            );
            return;
        }

        const deliverableId = getDeliverableId(activeDeliverable);
        const requiredLinks = getRequiredLinkCount(activeDeliverable);

        if (!deliverableId) {
            setModalError("Deliverable ID is missing.");
            return;
        }

        if (isMilestoneTimelineOver(activeMilestone)) {
            setModalError(
                "Milestone timeline is over. You cannot submit links now."
            );
            return;
        }

        const cleanedLinks = form.links
            .map((item, index) => ({
                label: item.label.trim() || `Deliverable Link ${index + 1}`,
                url: item.url.trim(),
            }))
            .filter((item) => item.url);

        if (cleanedLinks.length !== requiredLinks) {
            setModalError(
                `Please submit exactly ${requiredLinks} deliverable link${
                    requiredLinks === 1 ? "" : "s"
                }.`
            );
            return;
        }

        const hasIncompleteRow =
            form.links.length !== requiredLinks ||
            form.links.some((item) => !item.url.trim());

        if (hasIncompleteRow) {
            setModalError("URL is required for every deliverable link row.");
            return;
        }

        if (!activeMilestone.influencerId && !influencerId) {
            setModalError("Influencer ID is missing.");
            return;
        }

        if (!activeMilestone.milestoneId) {
            setModalError("Milestone ID is missing.");
            return;
        }

        if (!activeMilestone.milestoneHistoryId) {
            setModalError("Milestone history ID is missing.");
            return;
        }

        try {
            setSubmitting(true);
            setModalError("");

            await apiSubmitDeliverable(
                {
                    influencerId: activeMilestone.influencerId || influencerId,
                    milestoneId: activeMilestone.milestoneId,
                    milestoneHistoryId: activeMilestone.milestoneHistoryId,
                    deliverableId,
                    deliverableLinks: cleanedLinks,
                },
                token
            );

            const currentInfluencerId =
                activeMilestone.influencerId || influencerId;

            closeModal();
            await loadMilestones(currentInfluencerId, token);

            toast({
                icon: "success",
                title:
                    modalMode === "revision"
                        ? "Revision submitted"
                        : "Deliverable submitted",
                text:
                    modalMode === "revision"
                        ? "Your revised deliverable links have been submitted successfully."
                        : "Your deliverable links have been submitted successfully.",
            });
        } catch (err: any) {
            setModalError(
                getApiErrorMessage(
                    err,
                    "Failed to submit deliverable. Please try again."
                )
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="mx-auto min-h-screen max-w-7xl space-y-6 p-4 md:p-8">
                <div className="sticky top-0 z-20 rounded-xl border border-gray-200 bg-white/90 p-4 backdrop-blur">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                            <div className="text-xs font-medium uppercase tracking-wide text-[#7A7A7A]">
                                My Milestones
                            </div>

                            <h1 className="truncate text-2xl font-bold text-[#1A1A1A] md:text-3xl">
                                {campaignTitle}
                            </h1>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={handleAllDeliverables}
                            >
                                <FolderOpen className="mr-2 h-4 w-4" />
                                All Deliverables
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => router.back()}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
                        <div className="flex items-center justify-center gap-2 text-sm text-[#6F6F6F]">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading milestones...
                        </div>
                    </div>
                ) : sortedMilestones.length === 0 ? (
                    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F5F5]">
                            <Wallet className="h-6 w-6 text-[#6F6F6F]" />
                        </div>

                        <div className="mt-4 text-lg font-semibold text-[#1A1A1A]">
                            No milestones found
                        </div>

                        <div className="mt-1 text-sm text-[#6F6F6F]">
                            No milestones are available right now.
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sortedMilestones.map((row) => {
                            const released = isReleased(row);
                            const timelineOver = isMilestoneTimelineOver(row);
                            const isExpanded = Boolean(
                                expandedMilestoneIds[row.milestoneHistoryId]
                            );

                            const deliverables = Array.isArray(row.deliverables)
                                ? row.deliverables
                                : [];

                            return (
                                <div
                                    key={row.milestoneHistoryId}
                                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                                >
                                    <div className="px-5 py-4">
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-base font-semibold text-[#1A1A1A]">
                                                        {row.milestoneTitle}
                                                    </h3>

                                                    {statusBadge(
                                                        row.payoutStatus,
                                                        released
                                                    )}

                                                    {timelineOver &&
                                                    !released ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                                                            Timeline Ended
                                                        </span>
                                                    ) : null}
                                                </div>

                                                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                                                    <MilestoneDetail
                                                        label="Milestone Budget"
                                                        value={formatMoney(
                                                            row.amount
                                                        )}
                                                    />

                                                    <MilestoneDetail
                                                        label="Start Date"
                                                        value={formatDate(
                                                            row.startDate
                                                        )}
                                                    />

                                                    <MilestoneDetail
                                                        label="End Date"
                                                        value={formatDate(
                                                            row.endDate
                                                        )}
                                                    />

                                                    <MilestoneDetail
                                                        label="Deliverables"
                                                        value={
                                                            deliverables.length
                                                        }
                                                    />
                                                </div>

                                                {row.milestoneDescription ? (
                                                    <p className="mt-4 text-sm leading-6 text-[#6A6A6A]">
                                                        {
                                                            row.milestoneDescription
                                                        }
                                                    </p>
                                                ) : null}

                                                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[#5F5F5F]">
                                                    <span className="inline-flex items-center gap-1">
                                                        <CalendarDays className="h-4 w-4" />
                                                        Created:{" "}
                                                        {formatDate(
                                                            row.createdAt
                                                        )}
                                                    </span>

                                                    <span className="inline-flex items-center gap-1">
                                                        <CalendarDays className="h-4 w-4" />
                                                        Released:{" "}
                                                        {formatDate(
                                                            row.releasedAt
                                                        )}
                                                    </span>

                                                    {row.graceDays ? (
                                                        <span>
                                                            Grace days:{" "}
                                                            {row.graceDays}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 items-center gap-2">
                                                <Button
                                                    type="button"
                                                    disabled={
                                                        Number(
                                                            row.isAccepted || 0
                                                        ) === 1 ||
                                                        Boolean(
                                                            acceptingMilestoneIds[
                                                                row
                                                                    .milestoneHistoryId
                                                            ]
                                                        )
                                                    }
                                                    onClick={() =>
                                                        handleAcceptMilestone(
                                                            row
                                                        )
                                                    }
                                                    className={[
                                                        "h-10 rounded-lg px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-70",
                                                        Number(
                                                            row.isAccepted || 0
                                                        ) === 1
                                                            ? "bg-[#EAF6EC] text-[#28A745] hover:bg-[#EAF6EC]"
                                                            : "bg-[#1A1A1A] text-white hover:bg-black",
                                                    ].join(" ")}
                                                >
                                                    {acceptingMilestoneIds[
                                                        row.milestoneHistoryId
                                                    ]
                                                        ? "Accepting..."
                                                        : Number(
                                                                row.isAccepted ||
                                                                    0
                                                            ) === 1
                                                          ? "Accepted"
                                                          : "Accept Milestone"}
                                                </Button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleToggleMilestone(
                                                            row.milestoneHistoryId
                                                        )
                                                    }
                                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-[#1A1A1A] transition hover:bg-gray-50"
                                                    aria-label={
                                                        isExpanded
                                                            ? "Collapse milestone"
                                                            : "Expand milestone"
                                                    }
                                                >
                                                    {isExpanded ? (
                                                        <ChevronUp className="h-5 w-5" />
                                                    ) : (
                                                        <ChevronDown className="h-5 w-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {isExpanded ? (
                                        <div className="border-t border-gray-200 bg-[#FAFAFA] px-5 py-5">
                                            {deliverables.length > 0 ? (
                                                <div className="space-y-4">
                                                    {deliverables.map(
                                                        (deliverable) => (
                                                            <DeliverableCard
                                                                key={getDeliverableId(
                                                                    deliverable
                                                                )}
                                                                milestone={row}
                                                                deliverable={
                                                                    deliverable
                                                                }
                                                                onOpenSubmit={
                                                                    openSubmitModal
                                                                }
                                                            />
                                                        )
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
                                                    <div className="text-sm font-semibold text-[#1A1A1A]">
                                                        No deliverables found
                                                    </div>

                                                    <div className="mt-1 text-sm text-[#969696]">
                                                        Brand has not added
                                                        deliverables under this
                                                        milestone.
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <SubmitLinksModal
                open={isModalOpen}
                mode={modalMode}
                milestone={activeMilestone}
                deliverable={activeDeliverable}
                form={form}
                submitting={submitting}
                error={modalError}
                onClose={closeModal}
                onChangeLink={updateLink}
                onAddLink={addLinkRow}
                onRemoveLink={removeLinkRow}
                onSubmit={handleSubmitDeliverable}
            />
        </>
    );
}