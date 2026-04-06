"use client";

import React, { useState } from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { DotsThreeIcon, GavelIcon } from "@phosphor-icons/react";
import { Checkbox } from "@/components/animate-ui/components/radix/checkbox";
import { Button } from "@/components/ui/buttonComp";
import type { Dispute } from "./page";

// ─── Status display helpers ────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
    open: "Open",
    in_review: "In Review",
    awaiting_user: "Awaiting User",
    resolved: "Resolved",
    rejected: "Rejected",
};

const STATUS_COLORS: Record<string, string> = {
    open: "bg-blue-50 text-blue-700 border border-blue-200",
    in_review: "bg-purple-50 text-purple-700 border border-purple-200",
    awaiting_user: "bg-amber-50 text-amber-700 border border-amber-200",
    resolved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    rejected: "bg-red-50 text-red-600 border border-red-200",
};

// ─── Header carets ─────────────────────────────────────────────────────────────

function HeaderCarets() {
    const cls = "h-3 w-3 text-[#343330]";
    return (
        <span className="flex flex-col items-center leading-none ml-1">
            <ChevronUp className={cls} strokeWidth={3} />
            <ChevronDown className={cls} strokeWidth={3} />
        </span>
    );
}

// ─── Props ─────────────────────────────────────────────────────────────────────

export type DisputeTableProps = {
    rows: Dispute[];
    loading: boolean;
    error: string | null;
    onRetry: () => void;
    // Pagination
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
    pageNumbers: number[];
    onPageChange: (p: number) => void;
};

// ─── DisputeTable ──────────────────────────────────────────────────────────────
const formatHandle = (handle?: string | null) => {
    if (!handle) return null;
    return handle.startsWith("@") ? handle : `@${handle}`;
};
export function DisputeTable({
    rows,
    loading,
    error,
    onRetry,
    page,
    totalPages,
    total,
    pageSize,
    pageNumbers,
    onPageChange,
}: DisputeTableProps) {
    // Local selection state (UI-only, doesn't affect fetching)
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const allSelected =
        rows.length > 0 && rows.every((r) => selected.has(r.disputeId));

    const toggleAll = () =>
        setSelected(
            allSelected ? new Set() : new Set(rows.map((r) => r.disputeId))
        );

    const toggleOne = (id: string) =>
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    // Column layout
    const col = {
        checkbox: "w-[3rem]",
        title: "min-w-[14rem] flex-[2_1_0%]",
        campaign: "min-w-[12rem] flex-[1.8_1_0%]",
        status: "min-w-[9rem] flex-[1_1_0%]",
        raisedAgainst: "min-w-[10rem] flex-[1.4_1_0%]",
        date: "min-w-[8rem] flex-[1_1_0%]",
        action: "min-w-[9rem] flex-[1_1_0%]",
    };

    const headerCell =
        "flex items-center justify-between w-full text-sm font-semibold text-[#1A1A1A]";

    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);

    return (
        <div className="w-full overflow-x-auto">
            <div className="min-w-full w-max mt-[3.5rem] px-[2rem] pb-[2.5rem]">

                {/* ── Header row ──────────────────────────────────────────────────── */}
                <div className="flex items-center h-12 bg-gray-100 rounded-lg px-4">
                    <div className={col.checkbox}>
                        <Checkbox
                            checked={allSelected}
                            onCheckedChange={toggleAll}
                        />
                    </div>
                    <div className={`${col.title} px-2`}>
                        <div className={headerCell}>
                            <span>Dispute Title & ID</span>
                            <HeaderCarets />
                        </div>
                    </div>
                    <div className={`${col.campaign} px-2`}>
                        <div className={headerCell}>
                            <span>Campaign</span>
                            <HeaderCarets />
                        </div>
                    </div>
                    <div className={`${col.status} px-2`}>
                        <div className={headerCell}>
                            <span>Status</span>
                            <HeaderCarets />
                        </div>
                    </div>
                    <div className={`${col.raisedAgainst} px-2`}>
                        <div className={headerCell}>
                            <span>Raised Against</span>
                            <HeaderCarets />
                        </div>
                    </div>
                    <div className={`${col.date} px-2`}>
                        <div className={headerCell}>
                            <span>Date</span>
                            <HeaderCarets />
                        </div>
                    </div>
                    <div className={`${col.action} px-2`}>
                        <span className="text-sm font-semibold">Action</span>
                    </div>
                </div>

                {/* ── Body ────────────────────────────────────────────────────────── */}
                <div className="flex flex-col mt-3 gap-[0.75rem]">

                    {/* Loading skeletons */}
                    {loading &&
                        Array.from({ length: 5 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex items-center h-[5rem] border border-[#D6D6D6] rounded-lg px-4 bg-white animate-pulse"
                            >
                                <div className={col.checkbox}>
                                    <div className="h-4 w-4 rounded bg-gray-200" />
                                </div>
                                <div className={`${col.title} px-2 space-y-2`}>
                                    <div className="h-3.5 w-3/4 rounded bg-gray-200" />
                                    <div className="h-3 w-1/2 rounded bg-gray-100" />
                                </div>
                                <div className={`${col.campaign} px-2`}>
                                    <div className="h-3.5 w-2/3 rounded bg-gray-200" />
                                </div>
                                <div className={`${col.status} px-2`}>
                                    <div className="h-6 w-20 rounded-full bg-gray-200" />
                                </div>
                                <div className={`${col.raisedAgainst} px-2`}>
                                    <div className="h-3.5 w-2/3 rounded bg-gray-200" />
                                </div>
                                <div className={`${col.date} px-2`}>
                                    <div className="h-3.5 w-24 rounded bg-gray-200" />
                                </div>
                                <div className={`${col.action} px-2 flex gap-2`}>
                                    <div className="h-8 w-16 rounded-xl bg-gray-200" />
                                    <div className="h-8 w-8 rounded-xl bg-gray-100" />
                                </div>
                            </div>
                        ))}

                    {/* Error state */}
                    {!loading && error && (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-red-500">
                            <AlertCircle className="size-8" />
                            <p className="text-sm font-medium">{error}</p>
                            <button
                                onClick={onRetry}
                                className="text-xs underline text-[#1a1a1a] hover:opacity-70"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && !error && rows.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#888]">
                            <GavelIcon size={36} />
                            <p className="text-sm font-medium">No disputes found</p>
                            <p className="text-xs text-[#bbb]">
                                Try adjusting your filters or search term
                            </p>
                        </div>
                    )}

                    {/* Data rows */}
                    {!loading &&
                        !error &&
                        rows.map((row) => (
                            <div
                                key={row.disputeId}
                                className="flex items-center h-[5rem] border border-[#D6D6D6] rounded-lg px-4 bg-white hover:bg-[#fafafa] transition-colors"
                            >
                                {/* Checkbox */}
                                <div className={col.checkbox}>
                                    <Checkbox
                                        checked={selected.has(row.disputeId)}
                                        onCheckedChange={() => toggleOne(row.disputeId)}
                                    />
                                </div>

                                {/* Title + Dispute ID */}
                                <div className={`${col.title} px-2`}>
                                    <div className="font-medium truncate">{row.subject}</div>
                                    <div className="text-xs text-gray-400 mt-0.5 truncate">
                                        #{row.disputeId}
                                    </div>
                                </div>

                                {/* Campaign */}
                                <div className={`${col.campaign} px-2`}>
                                    <span className="truncate text-sm text-gray-700">
                                        {row.campaignName ?? (
                                            <span className="text-gray-400 italic text-xs">No campaign</span>
                                        )}
                                    </span>
                                </div>

                                {/* Status badge */}
                                <div className={`${col.status} px-2`}>
                                    <span
                                        className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[row.status] ?? "bg-gray-100 text-gray-600"
                                            }`}
                                    >
                                        {STATUS_LABEL[row.status] ?? row.status}
                                    </span>
                                </div>

                                {/* Raised Against */}
                                <div className={`${col.raisedAgainst} px-2`}>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-[#1a1a1a]">
                                            {row.raisedAgainst?.name || "—"}
                                        </span>

                                        {row.raisedAgainst?.handle ? (
                                            <span className="text-xs text-[#888]">
                                                {formatHandle(row.raisedAgainst.handle)}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-[#888]">
                                                {row.raisedAgainst?.role || ""}
                                            </span>
                                        )}
                                    </div>
                                    {row.raisedAgainst?.role && (
                                        <div className="text-xs text-gray-400 mt-0.5">
                                            {row.raisedAgainst.role}
                                        </div>
                                    )}
                                </div>

                                {/* Date */}
                                <div className={`${col.date} px-2 text-sm text-gray-500 whitespace-nowrap`}>
                                    {new Date(row.createdAt).toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </div>

                                {/* Actions */}
                                <div className={`${col.action} px-2 flex items-center gap-2`}>
                                    <Button
                                        className="!w-[5rem] !h-[2.0625rem] !px-[0.5rem] !rounded-[0.75rem] text-xs"
                                        onClick={() => {
                                            window.location.href = `/brand/disputes/${row.disputeId}`;
                                        }}
                                    >
                                        View
                                    </Button>
                                    <Button className="!bg-white !h-[2rem] !w-[1.875rem] !px-[0.5rem] !rounded-[0.75rem] !gap-[0.25rem] !border">
                                        <DotsThreeIcon color="#1A1A1A" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                </div>

                {/* ── Pagination ───────────────────────────────────────────────────── */}
                {!loading && !error && totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 px-1">
                        <p className="text-sm text-gray-500">
                            Showing{" "}
                            <span className="font-medium text-[#1a1a1a]">{from}–{to}</span>
                            {" "}of{" "}
                            <span className="font-medium text-[#1a1a1a]">{total}</span>
                        </p>

                        <div className="flex items-center gap-1">
                            <button
                                disabled={page <= 1}
                                onClick={() => onPageChange(page - 1)}
                                className="size-8 flex items-center justify-center rounded-lg border border-[#e2e2e2] text-[#1a1a1a] hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="size-4" />
                            </button>

                            {pageNumbers.map((p) => (
                                <button
                                    key={p}
                                    onClick={() => onPageChange(p)}
                                    className={`size-8 flex items-center justify-center rounded-lg text-sm transition-colors ${p === page
                                        ? "bg-[#1a1a1a] text-white font-semibold"
                                        : "border border-[#e2e2e2] text-[#1a1a1a] hover:bg-[#f5f5f5]"
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}

                            <button
                                disabled={page >= totalPages}
                                onClick={() => onPageChange(page + 1)}
                                className="size-8 flex items-center justify-center rounded-lg border border-[#e2e2e2] text-[#1a1a1a] hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="size-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}