"use client";

import { useEffect, useMemo, useState, Fragment } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Icon as IconifyIcon } from "@iconify/react";
import {
    ArrowDownRight,
    ArrowUpLeft,
    ArrowUpRight,
    CalendarDots,
    Coins,
    Eye,
    MoneyWavy,
    PlusCircle,
    Wallet,
} from "@phosphor-icons/react";
import {
    apiGetContractDetails,
    apiViewContractPdf,
    apiGetMilestonesByCampaign,
} from "../../services/brandApi";
import { InfluencerViewModel } from "./utils";

type PaymentTabProps = {
    view: InfluencerViewModel;
    contractLoading: boolean;
    onViewContract?: () => void;
    onDownloadContract?: () => void;
};

type PaymentHistoryRow = {
    id: string;
    title: string;
    subtitle: string;
    transactionId: string;
    amount: string;
    amountClassName: string;
    icon: any;
    iconClassName: string;
};

function getContractDoc(data: any) {
    return data?.contract ?? data ?? null;
}

function formatDate(value?: string | Date | null) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    });
}

function formatDateTime(value?: string | Date | null) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getReleasedMilestoneTotal(milestones: any[]) {
    return milestones
        .filter((item) => isReleasedMilestone(item))
        .reduce((sum, item) => sum + getMilestoneAmount(item), 0);
}

function formatStatus(status?: string | null) {
    if (!status) return "-";

    return String(status)
        .replace(/_/g, " ")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPaymentType(paymentType?: string | null) {
    if (!paymentType) return "-";

    return String(paymentType)
        .replace(/_/g, " ")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatMoney(amount?: number | string | null, currency = "USD") {
    const num = Number(amount);

    if (!Number.isFinite(num)) return "-";

    return `${currency || "USD"} $ ${num.toLocaleString("en-US")}`;
}

function getCommercial(contract: any) {
    return contract?.content?.scheduleA?.commercial || {};
}

function getCurrency(contract: any) {
    return getCommercial(contract)?.currency || contract?.currency || "USD";
}

function getTotalCampaignFee(contract: any) {
    const commercial = getCommercial(contract);

    return (
        commercial?.totalCampaignFee ??
        contract?.feeAmount ??
        contract?.content?.scheduleA?.commercial?.influencerBudget ??
        0
    );
}

function getInfluencerBudget(contract: any) {
    const commercial = getCommercial(contract);

    return commercial?.influencerBudget ?? contract?.feeAmount ?? 0;
}

function getRemainingBudget(contract: any) {
    const influencerBudget = Number(getInfluencerBudget(contract) || 0);
    const totalFee = Number(getTotalCampaignFee(contract) || 0);

    if (!Number.isFinite(influencerBudget) || influencerBudget <= 0) {
        return "-";
    }

    const remaining = Math.max(influencerBudget - totalFee, 0);

    return formatMoney(remaining, getCurrency(contract));
}

function getLatestSignatureDate(contract: any) {
    const dates = [
        contract?.signatures?.brand?.at,
        contract?.signatures?.influencer?.at,
        contract?.signatures?.collabglam?.at,
    ]
        .filter(Boolean)
        .map((value) => new Date(value).getTime())
        .filter((time) => Number.isFinite(time));

    if (!dates.length) return null;

    return new Date(Math.max(...dates));
}

function getContractTimeline(contract: any) {
    const start =
        contract?.content?.campaign?.effectiveDate ||
        contract?.requestedEffectiveDate ||
        contract?.createdAt;

    const end =
        contract?.milestonesCreatedAt ||
        contract?.lockedAt ||
        contract?.updatedAt;

    if (!start && !end) return "-";

    return `${formatDate(start)} - ${formatDate(end)}`;
}

function getUpcomingPayout(contract: any) {
    const milestones = Array.isArray(contract?.milestones)
        ? contract.milestones
        : [];

    const nextMilestone = milestones.find(
        (item: any) => !item?.released && (item?.amount || item?.milestoneBudget)
    );

    if (!nextMilestone) return "-";

    return formatMoney(
        nextMilestone?.amount || nextMilestone?.milestoneBudget,
        getCurrency(contract)
    );
}

function getLastPayout(contract: any) {
    const milestones = Array.isArray(contract?.milestones)
        ? contract.milestones
        : [];

    const released = milestones
        .filter((item: any) => item?.released)
        .sort((a: any, b: any) => {
            const aTime = new Date(a?.releasedAt || a?.updatedAt || 0).getTime();
            const bTime = new Date(b?.releasedAt || b?.updatedAt || 0).getTime();
            return bTime - aTime;
        });

    if (!released.length) return "-";

    return formatMoney(
        released[0]?.amount || released[0]?.milestoneBudget,
        getCurrency(contract)
    );
}

function getUsageRights(contract: any) {
    const rows = contract?.content?.scheduleA?.usageRights?.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
        return "No usage rights added";
    }

    const selectedRows = rows.filter((row) => row?.selected);

    if (selectedRows.length === 0) {
        return "No usage rights selected";
    }

    return selectedRows
        .map((row) => {
            const right = row?.usageRight || "";
            const duration = row?.duration ? ` (${row.duration})` : "";
            return `${right}${duration}`;
        })
        .join(", ");
}

function getContentOwnership(contract: any) {
    const rows = contract?.content?.scheduleA?.usageRights?.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
        return "Influencer-owned / Non-exclusive";
    }

    const buyoutRow = rows.find((row) =>
        String(row?.usageRight || "").toLowerCase().includes("buyout")
    );

    if (buyoutRow?.selected) return "Buyout / Work-made-for-hire";

    return "Influencer-owned / Non-exclusive";
}

function getPaymentTerms(contract: any) {
    const commercial = getCommercial(contract);
    const paymentType =
        contract?.content?.campaign?.paymentType || contract?.paymentType;

    return (
        commercial?.customSplit ||
        commercial?.paymentStructure ||
        commercial?.platformMilestonePaymentStructure ||
        commercial?.advancePaymentTrigger ||
        commercial?.remainingPaymentTrigger ||
        formatPaymentType(paymentType)
    );
}

function getExclusivityPeriod(contract: any) {
    return (
        contract?.content?.scheduleA?.exclusivity?.blackoutPeriod ||
        contract?.content?.scheduleA?.exclusivity?.competitorBlackout ||
        "No exclusivity added"
    );
}

function getDeliverablesSummary(contract: any) {
    const deliverables = contract?.content?.scheduleA?.deliverables;

    if (!Array.isArray(deliverables) || deliverables.length === 0) {
        return "-";
    }

    return deliverables
        .map((item) => {
            const platform =
                item?.platform ||
                item?.platformHandle ||
                (Array.isArray(item?.Handle) ? item.Handle.join(", ") : "") ||
                "Platform";

            const format = item?.deliverableFormat || "Deliverable";
            const qty = item?.qty ?? 1;

            return `${platform} - ${format} x${qty}`;
        })
        .join(", ");
}

function getEmailLogSummary(contract: any) {
    const emailLog = contract?.emailLog;

    if (!Array.isArray(emailLog) || emailLog.length === 0) return "-";

    return `${emailLog.length} email${emailLog.length > 1 ? "s" : ""} sent`;
}

function getLastEmailSent(contract: any) {
    const emailLog = Array.isArray(contract?.emailLog) ? contract.emailLog : [];

    if (!emailLog.length) return "-";

    const sorted = [...emailLog].sort((a, b) => {
        const aTime = new Date(a?.sentAt || 0).getTime();
        const bTime = new Date(b?.sentAt || 0).getTime();
        return bTime - aTime;
    });

    return sorted[0]?.subject
        ? `${sorted[0].subject} - ${formatDateTime(sorted[0]?.sentAt)}`
        : formatDateTime(sorted[0]?.sentAt);
}

function getPaymentHistoryRows(contract: any): PaymentHistoryRow[] {
    const currency = getCurrency(contract);

    const milestones = Array.isArray(contract?.milestones)
        ? contract.milestones
        : [];

    if (milestones.length > 0) {
        return milestones.map((item: any, index: number) => ({
            id: String(item?.milestoneHistoryId || item?._id || index),
            title: item?.milestoneTitle || `Milestone ${index + 1}`,
            subtitle: item?.payoutStatus || item?.status || "Milestone",
            transactionId: String(item?.milestoneHistoryId || item?.milestoneId || "-"),
            amount: formatMoney(item?.amount || item?.milestoneBudget || 0, currency),
            amountClassName: item?.released ? "text-[#16A34A]" : "text-[#1A1A1A]",
            icon: item?.released ? ArrowDownRight : ArrowUpLeft,
            iconClassName: item?.released ? "text-[#16A34A]" : "text-[#1A1A1A]",
        }));
    }

    const audit = Array.isArray(contract?.audit) ? contract.audit : [];
    const milestoneAudits = audit.filter(
        (item: any) => item?.type === "MILESTONES_CREATED"
    );

    if (milestoneAudits.length > 0) {
        return milestoneAudits.map((item: any, index: number) => ({
            id: String(item?.details?.milestoneHistoryId || index),
            title: "Milestone Created",
            subtitle: formatDateTime(item?.at),
            transactionId: String(item?.details?.milestoneHistoryId || "-"),
            amount: formatMoney(item?.details?.milestoneBudget || 0, currency),
            amountClassName: "text-[#1A1A1A]",
            icon: ArrowUpLeft,
            iconClassName: "text-[#1A1A1A]",
        }));
    }

    return [];
}

function extractMilestonesFromResponse(res: any): any[] {
    const candidates = [
        res?.milestones,
        res?.data?.milestones,
        res?.data?.data?.milestones,
        res?.items,
        res?.data?.items,
        res?.data,
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) return candidate;
    }

    return [];
}

function sameId(a: any, b: any) {
    if (!a || !b) return false;
    return String(a) === String(b);
}

function getMilestoneAmount(item: any) {
    return Number(item?.amount || item?.milestoneBudget || item?.raw?.amount || item?.raw?.milestoneBudget || 0);
}

function getMilestoneCreatedTime(item: any) {
    return new Date(
        item?.createdAt ||
        item?.raw?.createdAt ||
        item?.updatedAt ||
        item?.raw?.updatedAt ||
        0
    ).getTime();
}

function getMilestoneReleasedTime(item: any) {
    return new Date(
        item?.releasedAt ||
        item?.raw?.releasedAt ||
        item?.paidAt ||
        item?.raw?.paidAt ||
        item?.updatedAt ||
        item?.raw?.updatedAt ||
        0
    ).getTime();
}

function isReleasedMilestone(item: any) {
    const payoutStatus = String(
        item?.payoutStatus || item?.raw?.payoutStatus || ""
    ).toLowerCase();

    return (
        Boolean(item?.released || item?.raw?.released) ||
        Boolean(item?.releasedAt || item?.raw?.releasedAt) ||
        payoutStatus === "initiated" ||
        payoutStatus === "paid"
    );
}

function getUpcomingPayoutFromMilestones(milestones: any[], currency = "USD") {
    const latestUnreleased = milestones
        .filter((item) => !isReleasedMilestone(item) && getMilestoneAmount(item) > 0)
        .sort((a, b) => getMilestoneCreatedTime(b) - getMilestoneCreatedTime(a))[0];

    if (!latestUnreleased) return "-";

    return formatMoney(getMilestoneAmount(latestUnreleased), currency);
}

function getLastPayoutFromMilestones(milestones: any[], currency = "USD") {
    const latestReleased = milestones
        .filter((item) => isReleasedMilestone(item) && getMilestoneAmount(item) > 0)
        .sort((a, b) => getMilestoneReleasedTime(b) - getMilestoneReleasedTime(a))[0];

    if (!latestReleased) return "-";

    return formatMoney(getMilestoneAmount(latestReleased), currency);
}

export default function PaymentTab({
    view,
    contractLoading,
}: PaymentTabProps) {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [paymentView, setPaymentView] = useState<"total" | "pending">("total");

    const urlContractId = searchParams.get("contractId") || "";
    const urlCampaignId = searchParams.get("campaignId") || "";
    const urlBrandId = searchParams.get("brandId") || "";
    const urlInfluencerId = searchParams.get("influencerId") || "";

    const resolvedApiContractId = useMemo(() => {
        const anyView: any = view || {};

        return String(
            urlContractId ||
            anyView?.printableContractId ||
            anyView?.contractId ||
            anyView?.contractMongoId ||
            anyView?.contract_id ||
            anyView?.contract?._id ||
            anyView?.contract?.contractId ||
            anyView?.contract?.id ||
            anyView?.raw?.contractId ||
            anyView?.raw?._id ||
            anyView?.raw?.contract?._id ||
            anyView?.raw?.contract?.contractId ||
            anyView?.applicant?.contractId ||
            anyView?.applicant?.contract?._id ||
            anyView?.applicant?.contract?.contractId ||
            ""
        ).trim();
    }, [view, urlContractId]);

    const hasContract = Boolean(resolvedApiContractId);

    const [contractDetailsLoading, setContractDetailsLoading] = useState(false);
    const [contractDetailsData, setContractDetailsData] = useState<any | null>(null);
    const [contractPdfViewing, setContractPdfViewing] = useState(false);
    const [milestoneRows, setMilestoneRows] = useState<any[]>([]);
    const [milestonesLoading, setMilestonesLoading] = useState(false);

    const contract = useMemo(
        () => getContractDoc(contractDetailsData),
        [contractDetailsData]
    );

    const resolvedCampaignId = useMemo(() => {
        const anyView: any = view || {};

        return String(
            urlCampaignId ||
            contract?.campaignId ||
            contract?.content?.campaign?.campaignId ||
            contract?.content?.campaign?._id ||
            contract?.campaign?._id ||
            anyView?.campaignId ||
            anyView?.raw?.campaignId ||
            anyView?.raw?.contract?.campaignId ||
            anyView?.contract?.campaignId ||
            ""
        ).trim();
    }, [urlCampaignId, contract, view]);

    const resolvedBrandId = useMemo(() => {
        const anyView: any = view || {};

        return String(
            urlBrandId ||
            contract?.brandId ||
            contract?.content?.brand?._id ||
            contract?.brand?._id ||
            anyView?.brandId ||
            anyView?.raw?.brandId ||
            anyView?.raw?.contract?.brandId ||
            anyView?.contract?.brandId ||
            ""
        ).trim();
    }, [urlBrandId, contract, view]);

    const resolvedInfluencerId = useMemo(() => {
        const anyView: any = view || {};

        return String(
            urlInfluencerId ||
            contract?.influencerId ||
            contract?.content?.influencer?._id ||
            contract?.influencer?._id ||
            anyView?.influencerId ||
            anyView?.raw?.influencerId ||
            anyView?.raw?.influencer?._id ||
            anyView?.raw?.contract?.influencerId ||
            anyView?.contract?.influencerId ||
            ""
        ).trim();
    }, [urlInfluencerId, contract, view]);

    useEffect(() => {
        if (!resolvedApiContractId) {
            console.warn("apiGetContractDetails not called: contractId missing");
            setContractDetailsData(null);
            return;
        }

        let isMounted = true;

        async function fetchContractDetails() {
            try {
                setContractDetailsLoading(true);

                const data = await apiGetContractDetails(resolvedApiContractId);

                if (isMounted) {
                    setContractDetailsData(data);
                }
            } catch (error) {
                console.error("Failed to fetch contract details:", error);

                if (isMounted) {
                    setContractDetailsData(null);
                }
            } finally {
                if (isMounted) {
                    setContractDetailsLoading(false);
                }
            }
        }

        fetchContractDetails();

        return () => {
            isMounted = false;
        };
    }, [resolvedApiContractId]);

    useEffect(() => {
        if (!resolvedCampaignId) {
            setMilestoneRows([]);
            return;
        }

        let isMounted = true;

        async function fetchMilestonesByCampaign() {
            try {
                setMilestonesLoading(true);

                const res = await apiGetMilestonesByCampaign({
                    campaignId: resolvedCampaignId,
                    brandId: resolvedBrandId || "",
                } as any);

                if (!isMounted) return;

                const rows = extractMilestonesFromResponse(res);

                const filteredRows = resolvedInfluencerId
                    ? rows.filter((item: any) =>
                        sameId(
                            item?.influencerId || item?.raw?.influencerId,
                            resolvedInfluencerId
                        )
                    )
                    : rows;

                setMilestoneRows(filteredRows);
            } catch (error) {
                console.error("Failed to fetch milestones by campaign:", error);

                if (isMounted) {
                    setMilestoneRows([]);
                }
            } finally {
                if (isMounted) {
                    setMilestonesLoading(false);
                }
            }
        }

        fetchMilestonesByCampaign();

        return () => {
            isMounted = false;
        };
    }, [resolvedCampaignId, resolvedBrandId, resolvedInfluencerId]);

    const currency = getCurrency(contract);
    const totalCampaignFee = getTotalCampaignFee(contract);
    const influencerBudget = getInfluencerBudget(contract);

    const paymentMilestones = useMemo(() => {
        const contractMilestones = Array.isArray(contract?.milestones)
            ? contract.milestones
            : [];

        return milestoneRows.length > 0 ? milestoneRows : contractMilestones;
    }, [milestoneRows, contract]);

    const releasedMilestoneAmount = useMemo(() => {
        return getReleasedMilestoneTotal(paymentMilestones);
    }, [paymentMilestones]);

    const pendingPayoutAmount = Math.max(
        0,
        Number(influencerBudget || 0) - Number(releasedMilestoneAmount || 0)
    );

    const totalPayoutValue = formatMoney(influencerBudget, currency);


    const pendingPayoutValue = milestonesLoading
        ? "Loading..."
        : formatMoney(pendingPayoutAmount, currency);

    const selectedPaymentLabel =
        paymentView === "total" ? "Total Payout" : "Pending amount";

    const selectedPaymentValue =
        paymentView === "total" ? totalPayoutValue : pendingPayoutValue;

    const releasedPayoutValue = milestonesLoading
        ? "Loading..."
        : formatMoney(releasedMilestoneAmount, currency);
    const upcomingPayoutValue = milestonesLoading
        ? "Loading..."
        : milestoneRows.length > 0
            ? getUpcomingPayoutFromMilestones(milestoneRows, currency)
            : getUpcomingPayout(contract);

    const lastPayoutValue = milestonesLoading
        ? "Loading..."
        : milestoneRows.length > 0
            ? getLastPayoutFromMilestones(milestoneRows, currency)
            : getLastPayout(contract);

    const milestoneCards = useMemo(
        () => [
            {
                icon: Wallet,
                label: "Contract Timeline",
                value: getContractTimeline(contract),
            },
            {
                icon: Coins,
                label: "Payment Type",
                value: formatPaymentType(
                    contract?.content?.campaign?.paymentType || contract?.paymentType
                ),
            },
            {
                icon: CalendarDots,
                label: "Upcoming Payout",
                value: upcomingPayoutValue,
            },
            {
                icon: ArrowUpRight,
                label: "Last payout",
                value: lastPayoutValue,
            },
        ],
        [contract, upcomingPayoutValue, lastPayoutValue]
    );

    const contractRows = useMemo(() => {
        return [
            {
                label: "Campaign",
                value: contract?.content?.campaign?.campaignTitleOrId || "-",
            },
            {
                label: "Brand Name",
                value: contract?.brandName || contract?.content?.brand?.legalName || "-",
            },
            {
                label: "Influencer Name",
                value:
                    contract?.influencerName ||
                    contract?.content?.influencer?.legalName ||
                    "-",
            },
            {
                label: "Effective Date",
                value: formatDate(contract?.content?.campaign?.effectiveDate),
            },
            {
                label: "Requested Effective Date",
                value: formatDateTime(contract?.requestedEffectiveDate),
            },
            {
                label: "Payment Type",
                value: formatPaymentType(
                    contract?.content?.campaign?.paymentType || contract?.paymentType
                ),
            },
            {
                label: "Influencer Budget",
                value: formatMoney(influencerBudget, currency),
            },
            {
                label: "Last Viewed",
                value: formatDateTime(
                    contract?.lastViewedAt?.brand ||
                    contract?.lastViewedAt?.influencer
                ),
            },
            {
                label: "Updated At",
                value: formatDateTime(contract?.updatedAt),
            },
        ];
    }, [contract, currency, influencerBudget, totalCampaignFee]);

    const paymentHistory = useMemo(() => {
        return getPaymentHistoryRows(contract);
    }, [contract]);

    const resolvedContractId = String(
        contract?.contractId ||
        contract?._id ||
        resolvedApiContractId ||
        "-"
    );

    const resolvedContractStatus = contractDetailsLoading
        ? "Loading..."
        : formatStatus(contract?.status);

    const isContractActionLoading =
        contractLoading || contractDetailsLoading || contractPdfViewing;

    const contractFileName = hasContract
        ? (view as any)?.contractFileName || `Contract-${resolvedContractId}.pdf`
        : "BrandxInfluencer_contract.pdf";

    const contractSize = hasContract
        ? (view as any)?.contractSize || "10.5 MB"
        : "10.5 MB";

    const handleViewContractPdf = async () => {
        const contractId = String(
            contract?.contractId ||
            (view as any)?.printableContractId ||
            (view as any)?.contractId ||
            resolvedApiContractId ||
            ""
        ).trim();

        if (!contractId) {
            console.error("contractId is required");
            return;
        }

        try {
            setContractPdfViewing(true);

            const response = await apiViewContractPdf({ contractId });

            const blob =
                response instanceof Blob
                    ? response
                    : (response as any)?.data instanceof Blob
                        ? (response as any).data
                        : new Blob([response as any], {
                            type: "application/pdf",
                        });

            const finalBlob =
                blob.type === "application/pdf"
                    ? blob
                    : new Blob([blob], { type: "application/pdf" });

            const pdfUrl = window.URL.createObjectURL(finalBlob);
            const opened = window.open(pdfUrl, "_blank", "noopener,noreferrer");

            if (!opened) {
                const link = document.createElement("a");
                link.href = pdfUrl;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                document.body.appendChild(link);
                link.click();
                link.remove();
            }

            window.setTimeout(() => {
                window.URL.revokeObjectURL(pdfUrl);
            }, 60_000);
        } catch (error) {
            console.error("Failed to view contract PDF:", error);
        } finally {
            setContractPdfViewing(false);
        }
    };

    return (
        <section className="flex w-full flex-col items-start gap-4 px-4 py-5">
            {/* Milestone & Deliverables */}
            <div className="flex w-full flex-col gap-5 bg-white">
                <div className="flex items-center justify-between self-stretch">
                    <h2 className="text-base font-semibold text-[#1A1A1A]">
                        Milestone & Deliverables
                    </h2>

                    <button
                        type="button"
                        className="flex h-8 items-center justify-center gap-2 self-stretch rounded-[0.75rem] border border-[#E6E6E6] px-2 text-sm font-medium text-[#1A1A1A]"
                    >
                        <PlusCircle size={16} />
                        Add Bonus
                    </button>
                </div>

                <div className="flex flex-col items-center justify-center gap-5 self-stretch rounded-[0.75rem] border border-[#E6E6E6] p-4">
                    <div className="flex items-center gap-5 self-stretch">
                        <InfoItem
                            label="Total Payout"
                            value={formatMoney(influencerBudget, currency)}
                        />
                        <InfoItem
                            label="Payment Model"
                            value={formatPaymentType(
                                contract?.content?.campaign?.paymentType ||
                                contract?.paymentType
                            )}
                        />
                        <InfoItem
                            label="Upcoming Payouts"
                            value={getUpcomingPayout(contract)}
                        />
                        <InfoItem
                            label="Contract Sign Date"
                            value={formatDate(getLatestSignatureDate(contract))}
                        />
                    </div>
                </div>

                <div className="flex items-stretch gap-5 self-stretch">
                    {milestoneCards.map(({ icon: CardIcon, label, value }) => (
                        <div
                            key={label}
                            className="flex h-[12.3rem] basis-[15.5rem] flex-1 flex-col items-start justify-between self-stretch rounded-[0.75rem] border border-[#E6E6E6] p-3"
                        >
                            <div className="flex h-12 w-12 items-center justify-center gap-2.5 rounded-[0.5rem] border border-[#E6E6E6] p-3">
                                <CardIcon size={24} />
                            </div>

                            <div className="flex flex-col gap-2">
                                <p className="text-sm font-medium leading-5 tracking-[0] text-[#B8B8B8]">
                                    {label}
                                </p>
                                <p className="text-base font-medium leading-6 tracking-[0] text-[#1A1A1A]">
                                    {value}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Payment */}
            <div className="flex w-full flex-col gap-3">
                <h2 className="text-base font-semibold text-[#1A1A1A]">Payment</h2>

                <div className="flex w-full flex-col gap-6 rounded-[0.75rem] border border-[#E6E6E6] bg-white p-4">
                    <div className="flex min-h-[10.5rem] flex-col justify-between self-stretch">
                        <div className="flex items-start justify-between self-stretch">
                            <div className="flex h-12 w-12 items-center justify-center gap-2.5 rounded-[0.5rem] border border-[#E6E6E6] p-3">
                                <MoneyWavy size={24} />
                            </div>

                            <div className="flex items-center gap-2 rounded-[0.75rem] bg-[#F9F9F9] p-2">
                                <button
                                    type="button"
                                    onClick={() => setPaymentView("total")}
                                    className={`rounded-[0.5rem] px-3 py-2 text-xs font-medium text-[#1A1A1A] ${paymentView === "total" ? "bg-white" : ""
                                        }`}
                                >
                                    Total Payout
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPaymentView("pending")}
                                    className={`rounded-[0.5rem] px-3 py-2 text-xs font-medium text-[#1A1A1A] ${paymentView === "pending" ? "bg-white" : ""
                                        }`}
                                >
                                    Pending amount
                                </button>
                            </div>
                        </div>

                        <div className="flex items-end justify-between self-stretch">
                            <div className="flex flex-col items-start gap-2">
                                <p className="text-sm font-medium leading-5 tracking-[0] text-[#B8B8B8]">
                                    {selectedPaymentLabel}
                                </p>

                                <p className="text-base font-medium leading-6 tracking-[0] text-[#1A1A1A]">
                                    {selectedPaymentValue}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => router.push("/brand/wallet")}
                                className="flex h-8 items-center justify-center gap-1 rounded-[0.75rem] border border-[#E6E6E6] px-2 text-sm font-medium text-[#1A1A1A]"
                            >
                                <PlusCircle size={16} />
                                Add funds
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contract */}
            <div className="flex w-full flex-col items-start gap-6 bg-white">
                <h2 className="self-stretch text-xl font-semibold leading-7 tracking-[0] text-[#1A1A1A]">
                    Contract
                </h2>

                <div className="flex w-full items-stretch">
                    <div className="flex w-[39.5625rem] flex-col items-start gap-5 rounded-l-[1rem] rounded-r-none border border-[#E6E6E6] px-3 py-4">
                        {contractRows.map((item) => (
                            <Fragment key={item.label}>
                                <ContractDetailRow
                                    label={item.label}
                                    value={item.value}
                                />

                                {item.label === "Campaign" ? (
                                    <div className="flex w-full items-center gap-4">
                                        <p className="w-[8.5rem] shrink-0 text-sm font-medium leading-5 text-[#969696]">
                                            Status
                                        </p>

                                        <span className="flex items-center gap-1 rounded-[1.5rem] bg-[#F9F9F9] px-2 py-1 text-xs font-medium text-[#969696]">
                                            <span className="h-1.5 w-1.5 rounded-full bg-[#7DB1FF]" />
                                            {resolvedContractStatus}
                                        </span>
                                    </div>
                                ) : null}
                            </Fragment>
                        ))}
                    </div>

                    <div className="flex flex-1 flex-col items-start justify-between self-stretch rounded-l-none rounded-r-[0.75rem] border-y border-r border-[#E6E6E6] bg-white px-3 py-4">
                        <div className="flex min-w-0 items-start gap-3">
                            <IconifyIcon
                                icon="material-icon-theme:pdf"
                                className="h-8 w-8 shrink-0"
                            />

                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium leading-5 text-[#1A1A1A]">
                                    {contractFileName}
                                </p>
                                <p className="text-xs font-medium leading-4 text-[#969696]">
                                    {contractSize}
                                </p>
                            </div>
                        </div>

                        <div className="flex w-full items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={handleViewContractPdf}
                                disabled={!hasContract || isContractActionLoading}
                                className="flex h-8 items-center justify-center gap-1 rounded-[0.5rem] border border-[#E6E6E6] bg-white px-3 text-xs font-medium text-[#1A1A1A] hover:bg-[#F9F9F9] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Eye size={14} />
                                {contractPdfViewing ? "Opening..." : "View"}
                            </button>

                            <button
                                type="button"
                                disabled
                                className="flex h-8 cursor-not-allowed items-center justify-center rounded-[0.5rem] border border-[#E6E6E6] bg-[#F9F9F9] px-3 text-xs font-medium text-[#969696] opacity-70"
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                disabled
                                className="flex h-8 cursor-not-allowed items-center justify-center rounded-[0.5rem] bg-[#E6E6E6] px-3 text-xs font-medium text-[#969696] opacity-70"
                            >
                                Re-send
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
        </section>
    );
}

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-1 flex-col gap-2">
            <p className="text-sm font-medium leading-5 tracking-[0] text-[#B8B8B8]">
                {label}
            </p>
            <p className="text-base font-medium leading-6 tracking-[0] text-[#1A1A1A]">
                {value}
            </p>
        </div>
    );
}

function ContractDetailRow({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="flex w-full items-start gap-4">
            <p className="w-[8.5rem] shrink-0 text-sm font-medium leading-5 text-[#969696]">
                {label}
            </p>
            <p className="break-words text-sm font-medium leading-5 text-[#1A1A1A]">
                {value}
            </p>
        </div>
    );
}