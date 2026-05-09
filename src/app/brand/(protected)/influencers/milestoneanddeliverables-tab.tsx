"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CaretDown, CaretUp } from "@phosphor-icons/react";
import { toast, ToastStyles } from "@/components/ui/toast";
import { InfluencerViewModel } from "./utils";
import {
    apiGetDeliverablesByMilestoneHistoryId,
    apiGetMilestonesByCampaign,
    apiReleaseMilestone,
    apiUpdateDeliverableApprovalStatus,
} from "../../services/brandApi";

const NA = "N/A";

const DELIVERABLE_GRID_COLUMNS =
    "3.5rem minmax(7rem,1fr) minmax(6.5rem,1fr) minmax(6rem,0.8fr) 5rem minmax(8rem,1fr) 4rem minmax(18rem,18rem)";

const textOrNA = (value: any) => {
    if (value === undefined || value === null) return NA;
    if (typeof value === "string" && value.trim() === "") return NA;
    if (value === "-") return NA;
    return value;
};

const getErrorMessage = (err: any, fallback = "Something went wrong.") => {
    const responseData = err?.response?.data;

    if (typeof responseData?.message === "string") return responseData.message;
    if (typeof responseData?.error === "string") return responseData.error;
    if (typeof responseData?.errors?.[0]?.message === "string") {
        return responseData.errors[0].message;
    }

    if (typeof err?.data?.message === "string") return err.data.message;
    if (typeof err?.message === "string") return err.message;

    return fallback;
};

const getLocalBrandId = () => {
    if (typeof window === "undefined") return "";

    return (
        localStorage.getItem("brandId") ||
        localStorage.getItem("brand_id") ||
        localStorage.getItem("userId") ||
        ""
    );
};

const getPlatformIconSrc = (platform: string) => {
    const normalized = String(platform || "").toLowerCase();

    if (normalized.includes("youtube")) return "/logos_youtube-icon.svg";
    if (normalized.includes("instagram")) return "/skill-icons_instagram.svg";
    if (normalized.includes("tiktok") || normalized.includes("tik tok")) {
        return "/ic_baseline-tiktok.svg";
    }

    return "";
};

const formatDate = (value: any) => {
    if (!value) return NA;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return textOrNA(value);

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
    }).format(date);
};

const formatMoneyOrQty = (item: any) => {
    const currency = item?.currency || "";
    const amount = item?.amount;

    if (amount !== undefined && amount !== null && amount !== "") {
        const num = Number(amount);

        if (Number.isFinite(num)) {
            return currency ? `${currency} ${num}` : String(num);
        }

        return String(amount);
    }

    return (
        item?.qty ||
        item?.quantity ||
        item?.deliverableQty ||
        item?.count ||
        NA
    );
};

const humanizeStatus = (value: any) => {
    const text = textOrNA(value);

    if (text === NA) return NA;

    return String(text)
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

const isLockedDeliverableStatus = (status: any) => {
    const normalized = String(status || "").toLowerCase();

    return normalized.includes("approved") || normalized.includes("revision");
};

const isReleasedMilestone = (milestone: any) => {
    const status = String(
        milestone?.status ||
            milestone?.payoutStatus ||
            milestone?.raw?.payoutStatus ||
            milestone?.raw?.status ||
            ""
    ).toLowerCase();

    return (
        milestone?.released === true ||
        milestone?.raw?.released === true ||
        status.includes("released") ||
        status.includes("paid") ||
        status.includes("approved")
    );
};

const getStatusStyles = (status: string) => {
    const normalized = String(status || "").toLowerCase();

    if (
        normalized.includes("approved") ||
        normalized.includes("paid") ||
        normalized.includes("released") ||
        normalized.includes("completed")
    ) {
        return {
            bg: "#EAF6EC",
            dot: "#28A745",
            text: "#28A745",
        };
    }

    if (
        normalized.includes("revision") ||
        normalized.includes("change") ||
        normalized.includes("rework")
    ) {
        return {
            bg: "#FFF8E6",
            dot: "#FFBF00",
            text: "#A97800",
        };
    }

    if (normalized.includes("pending")) {
        return {
            bg: "#FFF8E6",
            dot: "#FFBF00",
            text: "#A97800",
        };
    }

    if (
        normalized.includes("initiated") ||
        normalized.includes("progress") ||
        normalized.includes("in progress")
    ) {
        return {
            bg: "#EAF6EC",
            dot: "#28A745",
            text: "#969696",
        };
    }

    if (normalized.includes("failed") || normalized.includes("rejected")) {
        return {
            bg: "#FDECEC",
            dot: "#EF5350",
            text: "#EF5350",
        };
    }

    return {
        bg: "#F5F5F5",
        dot: "#969696",
        text: "#969696",
    };
};

const getDefaultPlatformFromView = (view: InfluencerViewModel) => {
    return (
        (view as any)?.providerKey ||
        (view as any)?.header?.providerKey ||
        (view as any)?.raw?.page1Primary?.platform ||
        (view as any)?.raw?.page1Data?.provider ||
        ""
    );
};

const getResolvedMilestoneId = (item: any) => {
    return String(
        item?.milestoneId ||
            item?.raw?.milestoneId ||
            item?._id ||
            item?.id ||
            item?.milestoneHistoryId ||
            ""
    );
};

const getResolvedMilestoneHistoryId = (item: any) => {
    return String(
        item?.milestoneHistoryId ||
            item?.raw?.milestoneHistoryId ||
            item?._id ||
            item?.raw?._id ||
            ""
    );
};

const getDeliverableId = (item: any) => {
    return String(
        item?.deliverableId ||
            item?._id ||
            item?.id ||
            item?.raw?.deliverableId ||
            item?.raw?._id ||
            item?.raw?.id ||
            ""
    );
};

const getFirstUrl = (item: any) => {
    if (Array.isArray(item?.url) && item.url.length > 0) {
        return item.url[0]?.url || item.url[0]?.link || "";
    }

    if (typeof item?.url === "string") return item.url;

    return item?.link || "";
};

const normalizeMilestoneRow = (
    item: any,
    index: number,
    defaultPlatform = ""
) => {
    const platform =
        item?.platform ||
        item?.platformName ||
        item?.socialPlatform ||
        item?.deliverablePlatform ||
        item?.contentPlatform ||
        defaultPlatform ||
        "";

    const description =
        item?.milestoneDescription ||
        item?.description ||
        item?.format ||
        item?.contentFormat ||
        item?.deliverableFormat ||
        item?.content ||
        "";

    const status =
        item?.payoutStatus ||
        item?.status ||
        item?.milestoneStatus ||
        item?.state ||
        "";

    const deadline =
        item?.deadline ||
        item?.dueDate ||
        item?.liveDate ||
        item?.draftDue ||
        item?.paidAt ||
        item?.releasedAt ||
        item?.createdAt ||
        "";

    return {
        id: String(
            item?._id ||
                item?.id ||
                item?.milestoneHistoryId ||
                `${item?.milestoneId || "milestone"}-${index}`
        ),
        milestoneId: String(item?.milestoneId || item?._id || item?.id || ""),
        milestoneHistoryId: String(
            item?.milestoneHistoryId || item?._id || item?.id || ""
        ),
        name: textOrNA(
            item?.milestoneTitle ||
                item?.name ||
                item?.milestoneName ||
                item?.title ||
                item?.deliverable
        ),
        format: textOrNA(description),
        platform: textOrNA(platform),
        status: textOrNA(status),
        qty: textOrNA(formatMoneyOrQty(item)),
        deadline: formatDate(deadline),
        raw: item,
    };
};

const normalizeDeliverableRow = (
    item: any,
    index: number,
    defaultPlatform = ""
) => {
    const platform =
        item?.platform ||
        item?.platformName ||
        item?.socialPlatform ||
        item?.deliverablePlatform ||
        item?.contentPlatform ||
        defaultPlatform ||
        "";

    const status =
        item?.status ||
        item?.deliverableStatus ||
        item?.approvalStatus ||
        item?.state ||
        "In Progress";

    const resolution =
        item?.resolution ||
        item?.dimensions ||
        item?.dimension ||
        item?.size ||
        item?.assetSize ||
        item?.ratio ||
        item?.aspectRatio ||
        "";

    const description =
        item?.description ||
        item?.deliverableDescription ||
        item?.caption ||
        item?.comments ||
        item?.format ||
        item?.contentFormat ||
        item?.deliverableFormat ||
        item?.type ||
        item?.mediaType ||
        "";

    return {
        id: getDeliverableId(item) || String(index),
        deliverableId: getDeliverableId(item),
        serial: index + 1,
        name: textOrNA(
            item?.title ||
                item?.deliverableTitle ||
                item?.deliverableName ||
                item?.name ||
                item?.contentTitle ||
                "Deliverable"
        ),
        format: textOrNA(description),
        resolution: textOrNA(resolution),
        platform: textOrNA(platform),
        status: textOrNA(status),
        qty: textOrNA(
            item?.qty ||
                item?.quantity ||
                item?.deliverableQty ||
                item?.count ||
                1
        ),
        url: getFirstUrl(item),
        raw: item,
    };
};

const isDeliverableLikeArray = (value: any[]) => {
    if (!Array.isArray(value)) return false;
    if (value.length === 0) return true;

    return value.some((item) => {
        if (!item || typeof item !== "object") return false;

        return Boolean(
            item.deliverableId ||
                item.title ||
                item.description ||
                item.status ||
                item.milestoneHistoryId ||
                item.campaignId ||
                item.influencerId
        );
    });
};

const extractDeliverablesFromResponse = (res: any): any[] => {
    const candidates = [
        res?.data,
        res?.data?.data,
        res?.response?.data,
        res?.response?.data?.data,
        res?.deliverables,
        res?.data?.deliverables,
        res?.data?.data?.deliverables,
        res?.items,
        res?.data?.items,
        res?.data?.data?.items,
        res?.result,
        res?.result?.data,
        res?.payload,
        res?.payload?.data,
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate) && isDeliverableLikeArray(candidate)) {
            return candidate;
        }
    }

    const searchNested = (value: any, depth = 0): any[] => {
        if (!value || depth > 4) return [];

        if (Array.isArray(value)) {
            return isDeliverableLikeArray(value) ? value : [];
        }

        if (typeof value !== "object") return [];

        const priorityKeys = [
            "data",
            "deliverables",
            "items",
            "rows",
            "result",
            "payload",
            "response",
        ];

        for (const key of priorityKeys) {
            const found = searchNested(value?.[key], depth + 1);
            if (found.length > 0) return found;
        }

        for (const key of Object.keys(value)) {
            if (key === "url") continue;

            const found = searchNested(value[key], depth + 1);
            if (found.length > 0) return found;
        }

        return [];
    };

    return searchNested(res);
};

const extractUpdatedDeliverable = (
    res: any,
    fallback: any,
    status: string,
    comments = ""
) => {
    const updated =
        res?.data?.deliverable ||
        res?.data?.data ||
        res?.data ||
        res?.deliverable ||
        res ||
        {};

    return {
        ...fallback,
        ...updated,
        status: updated?.status || status,
        comments: updated?.comments ?? comments,
    };
};

function PlatformBadgeIcon({ platform }: { platform: string }) {
    const safePlatform = textOrNA(platform);
    const iconSrc = getPlatformIconSrc(platform);

    return (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center gap-2.5 rounded-[2.5rem] border border-[#E6E6E6] bg-white p-2">
            {iconSrc ? (
                <img
                    src={iconSrc}
                    alt={`${safePlatform} icon`}
                    className="h-4 w-4 object-contain"
                    draggable={false}
                />
            ) : (
                <span className="font-['Inter'] text-[0.625rem] font-semibold text-[#1A1A1A]">
                    {safePlatform !== NA
                        ? String(safePlatform).slice(0, 1).toUpperCase()
                        : "?"}
                </span>
            )}
        </span>
    );
}

function StatusPill({ status }: { status: string }) {
    const safeStatus = humanizeStatus(status);
    const styles = getStatusStyles(status);

    return (
        <span
            className="inline-flex items-center gap-1 rounded-2xl px-2 py-1 font-['Inter'] text-sm font-normal leading-5"
            style={{
                backgroundColor: styles.bg,
                color: styles.text,
            }}
        >
            <span className="flex items-center gap-2.5 rounded-2xl p-0.5">
                <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: styles.dot }}
                />
            </span>
            {safeStatus}
        </span>
    );
}

function HeaderCell({ children }: { children: ReactNode }) {
    return (
        <div className="flex h-14 items-center justify-between px-4 py-2.5">
            <span className="line-clamp-1 flex-1 overflow-hidden text-ellipsis font-['Inter'] text-sm font-semibold leading-5 tracking-[0] text-[#1A1A1A]">
                {children}
            </span>
        </div>
    );
}

function RowCell({
    children,
    align = "left",
}: {
    children: ReactNode;
    align?: "left" | "center";
}) {
    return (
        <div
            className={[
                "flex h-[5.5rem] items-center gap-2 px-4 py-2.5",
                align === "center" ? "justify-center" : "justify-start",
            ].join(" ")}
        >
            {children}
        </div>
    );
}

function DeliverableActionButtons({
    item,
    isUpdating,
    onReleasePayment,
    onAddRevision,
}: {
    item: any;
    isUpdating: boolean;
    onReleasePayment: (item: any) => void;
    onAddRevision: (item: any) => void;
}) {
    const locked = isLockedDeliverableStatus(item?.status);

    const buttonClass =
        "flex h-[2.375rem] w-[8.25rem] shrink-0 items-center justify-center gap-1 rounded-lg border border-[#E6E6E6] bg-white px-3 text-center font-['Inter'] text-xs font-medium leading-4 text-[#3A3A3A] transition hover:bg-[#F9F9F9] disabled:cursor-not-allowed disabled:bg-[#F9F9F9] disabled:text-[#969696] disabled:opacity-60";

    return (
        <div className="flex h-[5.5rem] min-w-0 items-center justify-center gap-2 px-1 py-2.5">
            <button
                type="button"
                disabled={isUpdating || locked}
                onClick={() => onReleasePayment(item)}
                className={buttonClass}
            >
                <span className="whitespace-nowrap">Release Payment</span>
            </button>

            <button
                type="button"
                disabled={isUpdating || locked}
                onClick={() => onAddRevision(item)}
                className={buttonClass}
            >
                <span className="whitespace-nowrap">Add Revision</span>
            </button>
        </div>
    );
}

function DeliverablesPanel({
    deliverables,
    loading,
    error,
    defaultPlatform,
    updatingDeliverableIds,
    onReleasePayment,
    onAddRevision,
}: {
    deliverables: any[];
    loading: boolean;
    error: string;
    defaultPlatform: string;
    updatingDeliverableIds: Record<string, boolean>;
    onReleasePayment: (item: any) => void;
    onAddRevision: (item: any) => void;
}) {
    const rows = deliverables.map((item, index) =>
        normalizeDeliverableRow(item, index, defaultPlatform)
    );

    return (
        <div className="border-t border-[#E6E6E6] px-4 pb-4 pt-5">
            <h3 className="font-['Inter'] text-xl font-semibold leading-7 text-[#1A1A1A]">
                Deliverables
            </h3>

            <div className="mt-1 overflow-x-auto rounded-xl border border-[#E6E6E6] bg-white">
                {loading ? (
                    <div className="flex min-h-[5.5rem] items-center justify-center font-['Inter'] text-sm text-[#969696]">
                        Loading deliverables...
                    </div>
                ) : error ? (
                    <div className="flex min-h-[5.5rem] items-center justify-center font-['Inter'] text-sm text-[#E53935]">
                        {error}
                    </div>
                ) : rows.length > 0 ? (
                    rows.map((item, index) => (
                        <div key={item.id}>
                            <div
                                className="grid min-w-[64rem] w-full items-center"
                                style={{
                                    gridTemplateColumns: DELIVERABLE_GRID_COLUMNS,
                                }}
                            >
                                <div className="flex h-[5.5rem] items-center justify-center px-4 py-2.5 font-['Inter'] text-base font-medium text-[#1A1A1A]">
                                    {item.serial}.
                                </div>

                                <div className="flex h-[5.5rem] items-center px-4 py-2.5">
                                    {item.url ? (
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="line-clamp-2 font-['Inter'] text-base font-medium leading-6 text-[#1A1A1A] hover:underline"
                                            title={item.name}
                                        >
                                            {item.name}
                                        </a>
                                    ) : (
                                        <p className="line-clamp-2 font-['Inter'] text-base font-medium leading-6 text-[#1A1A1A]">
                                            {item.name}
                                        </p>
                                    )}
                                </div>

                                <div className="flex h-[5.5rem] items-center px-4 py-2.5">
                                    <p className="line-clamp-2 font-['Inter'] text-base font-medium leading-6 text-[#1A1A1A]">
                                        {item.format}
                                    </p>
                                </div>

                                <div className="flex h-[5.5rem] items-center justify-center px-4 py-2.5 font-['Inter'] text-base font-medium text-[#1A1A1A]">
                                    {item.resolution}
                                </div>

                                <div className="flex h-[5.5rem] items-center justify-center px-4 py-2.5">
                                    <PlatformBadgeIcon platform={item.platform} />
                                </div>

                                <div className="flex h-[5.5rem] items-center justify-center px-4 py-2.5">
                                    <StatusPill status={item.status} />
                                </div>

                                <div className="flex h-[5.5rem] items-center justify-center px-4 py-2.5 font-['Inter'] text-base font-medium text-[#1A1A1A]">
                                    {item.qty}
                                </div>

                                <DeliverableActionButtons
                                    item={item.raw}
                                    isUpdating={Boolean(
                                        updatingDeliverableIds[item.deliverableId]
                                    )}
                                    onReleasePayment={onReleasePayment}
                                    onAddRevision={onAddRevision}
                                />
                            </div>

                            {index < rows.length - 1 ? (
                                <div className="mx-auto h-px w-[56.625rem] max-w-[calc(100%-2rem)] bg-[#E6E6E6]" />
                            ) : null}
                        </div>
                    ))
                ) : (
                    <div className="flex min-h-[5.5rem] items-center justify-center font-['Inter'] text-sm text-[#969696]">
                        No deliverables found for this milestone.
                    </div>
                )}
            </div>
        </div>
    );
}

type MilestoneAndDeliverablesTabProps = {
    view: InfluencerViewModel;
};

export default function MilestoneAndDeliverablesTab({
    view,
}: MilestoneAndDeliverablesTabProps) {
    const searchParams = useSearchParams();

    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [apiMilestones, setApiMilestones] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [deliverablesByRow, setDeliverablesByRow] = useState<
        Record<string, any[]>
    >({});
    const [deliverablesLoadingByRow, setDeliverablesLoadingByRow] = useState<
        Record<string, boolean>
    >({});
    const [deliverablesErrorByRow, setDeliverablesErrorByRow] = useState<
        Record<string, string>
    >({});
    const [updatingDeliverableIds, setUpdatingDeliverableIds] = useState<
        Record<string, boolean>
    >({});
    const [releasingMilestoneIds, setReleasingMilestoneIds] = useState<
        Record<string, boolean>
    >({});

    const resolvedCampaignId =
        searchParams.get("campaignId") ||
        (view as any)?.raw?.contract?.campaignId ||
        (view as any)?.contract?.campaignId ||
        (view as any)?.raw?.contract?.content?.campaign?._id ||
        (view as any)?.contract?.content?.campaign?._id ||
        "";

    const resolvedInfluencerId =
        searchParams.get("influencerId") ||
        (view as any)?.raw?.influencer?.influencerId ||
        (view as any)?.raw?.influencer?._id ||
        (view as any)?.influencer?.influencerId ||
        (view as any)?.influencer?._id ||
        "";

    const resolvedBrandId =
        searchParams.get("brandId") ||
        (view as any)?.raw?.contract?.brandId ||
        (view as any)?.contract?.brandId ||
        (view as any)?.raw?.contract?.content?.brand?._id ||
        (view as any)?.contract?.content?.brand?._id ||
        getLocalBrandId();

    const defaultPlatform = getDefaultPlatformFromView(view);

    useEffect(() => {
        if (!resolvedCampaignId) {
            setApiMilestones([]);
            setError("Missing campaign id.");
            return;
        }

        let isMounted = true;

        const fetchMilestones = async () => {
            try {
                setLoading(true);
                setError("");

                const res = await apiGetMilestonesByCampaign({
                    campaignId: resolvedCampaignId,
                    brandId: resolvedBrandId || "",
                });

                if (!isMounted) return;

                const nextMilestones =
                    Array.isArray((res as any)?.milestones)
                        ? (res as any).milestones
                        : Array.isArray((res as any)?.data?.milestones)
                            ? (res as any).data.milestones
                            : Array.isArray((res as any)?.data?.data?.milestones)
                                ? (res as any).data.data.milestones
                                : [];

                const filteredMilestones = resolvedInfluencerId
                    ? nextMilestones.filter(
                          (item: any) =>
                              String(item?.influencerId || "") ===
                              String(resolvedInfluencerId)
                      )
                    : nextMilestones;

                setApiMilestones(filteredMilestones);
            } catch (err) {
                const message = getErrorMessage(
                    err,
                    "Failed to load milestones."
                );

                console.error("Failed to fetch campaign milestones", err);

                if (!isMounted) return;

                setError(message);
                setApiMilestones([]);

                toast({
                    icon: "error",
                    title: "Milestones not loaded",
                    text: message,
                });
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchMilestones();

        return () => {
            isMounted = false;
        };
    }, [resolvedCampaignId, resolvedBrandId, resolvedInfluencerId]);

    const fallbackMilestones =
        Array.isArray((view as any)?.milestones) &&
        (view as any).milestones.length > 0
            ? (view as any).milestones
            : Array.isArray((view as any)?.milestonesTab?.milestones)
                ? (view as any).milestonesTab.milestones
                : [];

    const milestones = useMemo(() => {
        const source =
            apiMilestones.length > 0 ? apiMilestones : fallbackMilestones;

        return source.map((item: any, index: number) =>
            item?.raw ? item : normalizeMilestoneRow(item, index, defaultPlatform)
        );
    }, [apiMilestones, fallbackMilestones, defaultPlatform]);

    const fetchDeliverablesForMilestone = async (
        milestone: any,
        rowId: string
    ) => {
        const milestoneId = getResolvedMilestoneId(milestone);
        const milestoneHistoryId = getResolvedMilestoneHistoryId(milestone);

        if (!milestoneHistoryId) {
            const message = "Missing milestone history id.";

            setDeliverablesErrorByRow((prev) => ({
                ...prev,
                [rowId]: message,
            }));

            toast({
                icon: "warning",
                title: "Cannot load deliverables",
                text: message,
            });

            return;
        }

        try {
            setDeliverablesLoadingByRow((prev) => ({
                ...prev,
                [rowId]: true,
            }));

            setDeliverablesErrorByRow((prev) => ({
                ...prev,
                [rowId]: "",
            }));

            const res = await apiGetDeliverablesByMilestoneHistoryId({
                milestoneId,
                milestoneHistoryId,
                influencerId: resolvedInfluencerId || "",
                campaignId: resolvedCampaignId || "",
                page: 1,
                limit: 20,
            });

            const nextDeliverables = extractDeliverablesFromResponse(res);

            setDeliverablesByRow((prev) => ({
                ...prev,
                [rowId]: nextDeliverables,
            }));
        } catch (err) {
            const message = getErrorMessage(
                err,
                "Failed to load deliverables."
            );

            console.error("Failed to fetch deliverables by milestone history id", err);

            setDeliverablesErrorByRow((prev) => ({
                ...prev,
                [rowId]: message,
            }));

            setDeliverablesByRow((prev) => ({
                ...prev,
                [rowId]: [],
            }));

            toast({
                icon: "error",
                title: "Deliverables not loaded",
                text: message,
            });
        } finally {
            setDeliverablesLoadingByRow((prev) => ({
                ...prev,
                [rowId]: false,
            }));
        }
    };

    const updateDeliverableStatusInCache = (
        deliverable: any,
        status: "approved" | "revision",
        comments = ""
    ) => {
        const deliverableId = getDeliverableId(deliverable);

        setDeliverablesByRow((prev) => {
            const next = { ...prev };

            Object.keys(next).forEach((rowId) => {
                next[rowId] = next[rowId].map((item) => {
                    const itemId = getDeliverableId(item);

                    if (itemId !== deliverableId) return item;

                    return {
                        ...item,
                        status,
                        comments,
                        updatedAt: new Date().toISOString(),
                    };
                });
            });

            return next;
        });
    };

    const handleUpdateDeliverableStatus = async (
        deliverable: any,
        status: "approved" | "revision"
    ) => {
        const deliverableId = getDeliverableId(deliverable);

        if (!deliverableId) {
            toast({
                icon: "warning",
                title: "Action unavailable",
                text: "Missing deliverable id.",
            });
            return;
        }

        if (isLockedDeliverableStatus(deliverable?.status)) {
            toast({
                icon: "info",
                title: "Action locked",
                text: "This deliverable has already been approved or moved to revision.",
            });
            return;
        }

        const promptValue =
            status === "revision"
                ? window.prompt("Add revision comment", deliverable?.comments || "")
                : deliverable?.comments || "";

        if (status === "revision" && promptValue === null) return;

        const comments =
            status === "revision" ? promptValue || "" : promptValue || "";

        try {
            setUpdatingDeliverableIds((prev) => ({
                ...prev,
                [deliverableId]: true,
            }));

            const res = await apiUpdateDeliverableApprovalStatus({
                deliverableId,
                status,
                comments,
                approvedRole: "Brand",
                approvalId: deliverable?.approvalId || "",
            });

            const updatedDeliverable = extractUpdatedDeliverable(
                res,
                deliverable,
                status,
                comments
            );

            setDeliverablesByRow((prev) => {
                const next = { ...prev };

                Object.keys(next).forEach((rowId) => {
                    next[rowId] = next[rowId].map((item) => {
                        const itemId = getDeliverableId(item);

                        if (itemId !== deliverableId) return item;

                        return {
                            ...item,
                            ...updatedDeliverable,
                            status,
                            comments,
                        };
                    });
                });

                return next;
            });

            toast({
                icon: "success",
                title:
                    status === "approved"
                        ? "Deliverable approved"
                        : "Revision requested",
                text:
                    status === "approved"
                        ? "The deliverable status has been updated successfully."
                        : "The deliverable has been moved to revision.",
            });
        } catch (err) {
            const message = getErrorMessage(
                err,
                "Failed to update deliverable status."
            );

            console.error("Failed to update deliverable approval status", err);
            updateDeliverableStatusInCache(deliverable, status, comments);

            toast({
                icon: "error",
                title: "Status update failed",
                text: message,
            });
        } finally {
            setUpdatingDeliverableIds((prev) => ({
                ...prev,
                [deliverableId]: false,
            }));
        }
    };

    const handleReleaseMilestone = async (milestone: any) => {
        const milestoneId = getResolvedMilestoneId(milestone);
        const milestoneHistoryId = getResolvedMilestoneHistoryId(milestone);

        if (!milestoneId || !milestoneHistoryId) {
            toast({
                icon: "warning",
                title: "Cannot approve milestone",
                text: "Missing milestone id or milestone history id.",
            });
            return;
        }

        if (isReleasedMilestone(milestone)) {
            toast({
                icon: "info",
                title: "Milestone already approved",
                text: "This milestone has already been released.",
            });
            return;
        }

        const loadingKey = milestoneHistoryId;

        try {
            setReleasingMilestoneIds((prev) => ({
                ...prev,
                [loadingKey]: true,
            }));

            const res = await apiReleaseMilestone({
                milestoneId,
                milestoneHistoryId,
            });

            const updatedMilestone =
                (res as any)?.milestone ||
                (res as any)?.data?.milestone ||
                (res as any)?.data ||
                res ||
                {};

            setApiMilestones((prev) =>
                prev.map((item) => {
                    const itemHistoryId = String(
                        item?.milestoneHistoryId || item?._id || ""
                    );

                    const itemMilestoneId = String(item?.milestoneId || "");

                    const isSameMilestone =
                        itemHistoryId === milestoneHistoryId ||
                        itemMilestoneId === milestoneId;

                    if (!isSameMilestone) return item;

                    return {
                        ...item,
                        ...updatedMilestone,
                        released: true,
                        releasedAt:
                            updatedMilestone?.releasedAt ||
                            item?.releasedAt ||
                            new Date().toISOString(),
                        payoutStatus:
                            updatedMilestone?.payoutStatus ||
                            updatedMilestone?.status ||
                            "released",
                    };
                })
            );

            toast({
                icon: "success",
                title: "Milestone approved",
                text: "The milestone has been released successfully.",
            });
        } catch (err) {
            const message = getErrorMessage(
                err,
                "Failed to approve milestone."
            );

            console.error("Failed to release milestone", err);

            toast({
                icon: "error",
                title: "Milestone approval failed",
                text: message,
            });
        } finally {
            setReleasingMilestoneIds((prev) => ({
                ...prev,
                [loadingKey]: false,
            }));
        }
    };

    const handleToggleMilestone = async (milestone: any, rowId: string) => {
        const isCurrentlyExpanded = expandedRowId === rowId;

        if (isCurrentlyExpanded) {
            setExpandedRowId(null);
            return;
        }

        setExpandedRowId(rowId);
        await fetchDeliverablesForMilestone(milestone, rowId);
    };

    return (
        <section className="flex w-full flex-col px-4 py-5">
            <ToastStyles />

            <div className="flex w-full items-start justify-between gap-6">
                <div className="min-w-0 flex-1">
                    <h2 className="self-stretch font-['Inter'] text-xl font-semibold leading-7 tracking-[0] text-[#1A1A1A]">
                        Milestone &amp; Deliverables
                    </h2>

                    <p className="mt-2 font-['Inter'] text-sm font-normal leading-5 tracking-[0] text-[#B8B8B8]">
                        Handpicked influencers matched to your campaign objectives and target audience.
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <button
                        type="button"
                        className="flex h-8 items-center justify-center gap-1 rounded-lg border border-[#E6E6E6] bg-white px-3 font-['Inter'] text-sm font-medium leading-5 text-[#1A1A1A] transition hover:bg-[#F9F9F9]"
                    >
                        Add Milestone
                    </button>

                    <div className="relative">
                        <select
                            className="h-8 appearance-none rounded-lg border border-[#E6E6E6] bg-white pl-3 pr-8 font-['Inter'] text-sm font-medium leading-5 text-[#1A1A1A] outline-none transition hover:bg-[#F9F9F9]"
                            defaultValue="last-7-days"
                        >
                            <option value="last-7-days">Last 7 days</option>
                            <option value="last-30-days">Last 30 days</option>
                            <option value="last-90-days">Last 90 days</option>
                        </select>

                        <CaretDown
                            size={14}
                            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#1A1A1A]"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-10 w-full overflow-x-auto">
                <div className="min-w-[65rem]">
                    <div
                        className="grid w-full items-center self-stretch rounded-xl bg-[#F9F9F9]"
                        style={{
                            gridTemplateColumns:
                                "139px minmax(228px,1fr) 139px 139px 111px 130px 139px",
                        }}
                    >
                        <HeaderCell>Deliverable</HeaderCell>
                        <HeaderCell>Content format</HeaderCell>
                        <HeaderCell>Platform</HeaderCell>
                        <HeaderCell>Status</HeaderCell>
                        <HeaderCell>Quantity</HeaderCell>
                        <HeaderCell>Deadline</HeaderCell>
                        <HeaderCell>Action</HeaderCell>
                    </div>

                    <div className="mt-7 flex flex-col gap-7">
                        {loading ? (
                            <div className="flex min-h-[5.5rem] w-full items-center justify-center rounded-xl border border-[#E6E6E6] bg-white font-['Inter'] text-sm text-[#969696]">
                                Loading milestones...
                            </div>
                        ) : error && milestones.length === 0 ? (
                            <div className="flex min-h-[5.5rem] w-full items-center justify-center rounded-xl border border-[#E6E6E6] bg-white font-['Inter'] text-sm text-[#E53935]">
                                {error}
                            </div>
                        ) : milestones.length > 0 ? (
                            milestones.map((item: any, index: number) => {
                                const rowId = String(
                                    item?.id || item?._id || index
                                );
                                const isExpanded = expandedRowId === rowId;
                                const milestoneHistoryId =
                                    getResolvedMilestoneHistoryId(item);

                                return (
                                    <div
                                        key={rowId}
                                        className="overflow-hidden rounded-xl border border-[#E6E6E6] bg-white"
                                    >
                                        <div
                                            className="grid w-full items-center bg-white"
                                            style={{
                                                gridTemplateColumns:
                                                    "139px minmax(228px,1fr) 139px 139px 111px 130px 139px",
                                            }}
                                        >
                                            <RowCell>
                                                <p className="line-clamp-2 font-['Inter'] text-base font-medium leading-6 text-[#1A1A1A]">
                                                    {textOrNA(item?.name)}
                                                </p>
                                            </RowCell>

                                            <RowCell>
                                                <p className="line-clamp-2 max-w-[14.25rem] font-['Inter'] text-sm font-normal leading-5 text-[#1A1A1A]">
                                                    {textOrNA(item?.format)}
                                                </p>
                                            </RowCell>

                                            <RowCell align="center">
                                                <PlatformBadgeIcon
                                                    platform={textOrNA(
                                                        item?.platform
                                                    )}
                                                />
                                            </RowCell>

                                            <RowCell align="center">
                                                <StatusPill
                                                    status={textOrNA(
                                                        item?.status
                                                    )}
                                                />
                                            </RowCell>

                                            <RowCell align="center">
                                                <p className="font-['Inter'] text-base font-medium leading-6 text-[#1A1A1A]">
                                                    {textOrNA(item?.qty)}
                                                </p>
                                            </RowCell>

                                            <RowCell align="center">
                                                <p className="font-['Inter'] text-base font-medium leading-6 text-[#1A1A1A]">
                                                    {textOrNA(item?.deadline)}
                                                </p>
                                            </RowCell>

                                            <RowCell align="center">
                                                <div className="flex h-[5.5rem] items-center justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            Boolean(
                                                                releasingMilestoneIds[
                                                                    milestoneHistoryId
                                                                ]
                                                            ) ||
                                                            isReleasedMilestone(
                                                                item
                                                            )
                                                        }
                                                        onClick={() =>
                                                            handleReleaseMilestone(
                                                                item
                                                            )
                                                        }
                                                        className="flex h-10 min-w-[4.625rem] items-center justify-center rounded-lg bg-[#1A1A1A] px-5 font-['Inter'] text-sm font-medium leading-5 text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-[#F5F5F5] disabled:text-[#969696]"
                                                    >
                                                        {releasingMilestoneIds[
                                                            milestoneHistoryId
                                                        ]
                                                            ? "Approving..."
                                                            : isReleasedMilestone(
                                                                  item
                                                              )
                                                                ? "Approved"
                                                                : "Approve"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        aria-label={
                                                            isExpanded
                                                                ? "Collapse milestone"
                                                                : "Expand milestone"
                                                        }
                                                        onClick={() =>
                                                            handleToggleMilestone(
                                                                item,
                                                                rowId
                                                            )
                                                        }
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#1A1A1A] transition hover:bg-[#F5F5F5]"
                                                    >
                                                        {isExpanded ? (
                                                            <CaretUp
                                                                size={16}
                                                                weight="bold"
                                                            />
                                                        ) : (
                                                            <CaretDown
                                                                size={16}
                                                                weight="bold"
                                                            />
                                                        )}
                                                    </button>
                                                </div>
                                            </RowCell>
                                        </div>

                                        {isExpanded ? (
                                            <DeliverablesPanel
                                                deliverables={
                                                    deliverablesByRow[rowId] ||
                                                    []
                                                }
                                                loading={Boolean(
                                                    deliverablesLoadingByRow[
                                                        rowId
                                                    ]
                                                )}
                                                error={
                                                    deliverablesErrorByRow[
                                                        rowId
                                                    ] || ""
                                                }
                                                defaultPlatform={
                                                    defaultPlatform
                                                }
                                                updatingDeliverableIds={
                                                    updatingDeliverableIds
                                                }
                                                onReleasePayment={(
                                                    deliverable
                                                ) =>
                                                    handleUpdateDeliverableStatus(
                                                        deliverable,
                                                        "approved"
                                                    )
                                                }
                                                onAddRevision={(deliverable) =>
                                                    handleUpdateDeliverableStatus(
                                                        deliverable,
                                                        "revision"
                                                    )
                                                }
                                            />
                                        ) : null}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex min-h-[5.5rem] w-full items-center justify-center rounded-xl border border-[#E6E6E6] bg-white font-['Inter'] text-sm text-[#969696]">
                                No deliverables found.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}