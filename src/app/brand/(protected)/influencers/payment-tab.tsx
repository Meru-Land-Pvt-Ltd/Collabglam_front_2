"use client";

import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon as IconifyIcon } from "@iconify/react";
import {
    ArrowDownRight,
    ArrowUpLeft,
    ArrowUpRight,
    CalendarDots,
    Coins,
    DownloadSimple,
    MoneyWavy,
    PlusCircle,
    Wallet,
} from "@phosphor-icons/react";
import { apiGetContractDetails } from "../../services/brandApi";
import { InfluencerViewModel } from "./utils";

type PaymentTabProps = {
    view: InfluencerViewModel;
    contractLoading: boolean;
    onViewContract: () => void;
    onDownloadContract: () => void;
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
        (item: { released: any; amount: any; milestoneBudget: any; }) => !item?.released && (item?.amount || item?.milestoneBudget)
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
        .filter((item: { released: any; }) => item?.released)
        .sort((a: { releasedAt: any; updatedAt: any; }, b: { releasedAt: any; updatedAt: any; }) => {
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

function getPaymentHistoryRows(contract: any) {
    const currency = getCurrency(contract);

    const milestones = Array.isArray(contract?.milestones)
        ? contract.milestones
        : [];

    if (milestones.length > 0) {
        return milestones.map((item: { milestoneHistoryId: any; _id: any; milestoneTitle: any; payoutStatus: any; status: any; milestoneId: any; amount: any; milestoneBudget: any; released: any; }, index: number) => ({
            id: item?.milestoneHistoryId || item?._id || String(index),
            title: item?.milestoneTitle || `Milestone ${index + 1}`,
            subtitle: item?.payoutStatus || item?.status || "Milestone",
            transactionId: item?.milestoneHistoryId || item?.milestoneId || "-",
            amount: formatMoney(item?.amount || item?.milestoneBudget || 0, currency),
            amountClassName: item?.released ? "text-[#16A34A]" : "text-[#1A1A1A]",
            icon: item?.released ? ArrowDownRight : ArrowUpLeft,
            iconClassName: item?.released ? "text-[#16A34A]" : "text-[#1A1A1A]",
        }));
    }

    const audit = Array.isArray(contract?.audit) ? contract.audit : [];
    const milestoneAudits = audit.filter((item: { type: string; }) => item?.type === "MILESTONES_CREATED");

    if (milestoneAudits.length > 0) {
        return milestoneAudits.map((item: { details: { milestoneHistoryId: any; milestoneBudget: any; }; at: string | Date | null | undefined; }, index: any) => ({
            id: item?.details?.milestoneHistoryId || String(index),
            title: "Milestone Created",
            subtitle: formatDateTime(item?.at),
            transactionId: item?.details?.milestoneHistoryId || "-",
            amount: formatMoney(item?.details?.milestoneBudget || 0, currency),
            amountClassName: "text-[#1A1A1A]",
            icon: ArrowUpLeft,
            iconClassName: "text-[#1A1A1A]",
        }));
    }

    return [];
}

export default function PaymentTab({
    view,
    contractLoading,
    onViewContract,
    onDownloadContract,
}: PaymentTabProps) {
    const searchParams = useSearchParams();

    const urlContractId = searchParams.get("contractId") || "";

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

    const contract = useMemo(
        () => getContractDoc(contractDetailsData),
        [contractDetailsData]
    );

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

    const currency = getCurrency(contract);
    const totalCampaignFee = getTotalCampaignFee(contract);
    const influencerBudget = getInfluencerBudget(contract);

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
                value: getUpcomingPayout(contract),
            },
            {
                icon: ArrowUpRight,
                label: "Last payout",
                value: getLastPayout(contract),
            },
        ],
        [contract]
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
                label: "Brand Email",
                value:
                    contract?.other?.brandProfile?.email ||
                    contract?.content?.brand?.noticeEmail ||
                    "-",
            },
            {
                label: "Influencer Email",
                value:
                    contract?.other?.influencerProfile?.email ||
                    contract?.content?.influencer?.email ||
                    "-",
            },
            {
                label: "Signed by Influencer",
                value: formatDateTime(contract?.signatures?.influencer?.at),
            },
            {
                label: "Signed by Brand",
                value: formatDateTime(contract?.signatures?.brand?.at),
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
                label: "Usage Rights",
                value: getUsageRights(contract),
            },
            {
                label: "Content Ownership",
                value: getContentOwnership(contract),
            },
            {
                label: "Payment Type",
                value: formatPaymentType(
                    contract?.content?.campaign?.paymentType || contract?.paymentType
                ),
            },
            {
                label: "Payment Terms",
                value: getPaymentTerms(contract),
            },
            {
                label: "Total Campaign Fee",
                value: formatMoney(totalCampaignFee, currency),
            },
            {
                label: "Influencer Budget",
                value: formatMoney(influencerBudget, currency),
            },
            {
                label: "Exclusivity Period",
                value: getExclusivityPeriod(contract),
            },
            {
                label: "Deliverables",
                value: getDeliverablesSummary(contract),
            },
            {
                label: "Revision Rounds",
                value: String(
                    contract?.content?.scheduleA?.review?.includedRevisionRounds ?? "-"
                ),
            },
            {
                label: "Governing Law",
                value: contract?.content?.scheduleA?.dispute?.governingLaw || "-",
            },
            {
                label: "Last Sent",
                value: formatDateTime(contract?.lastSentAt),
            },
            {
                label: "Last Viewed",
                value: formatDateTime(
                    contract?.lastViewedAt?.brand ||
                        contract?.lastViewedAt?.influencer
                ),
            },
            {
                label: "Milestones Created",
                value: formatDateTime(contract?.milestonesCreatedAt),
            },
            {
                label: "Email Log",
                value: getEmailLogSummary(contract),
            },
            {
                label: "Last Email",
                value: getLastEmailSent(contract),
            },
            {
                label: "Created At",
                value: formatDateTime(contract?.createdAt),
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

    const isContractActionLoading = contractLoading || contractDetailsLoading;

    const contractFileName = hasContract
        ? view?.contractFileName || `Contract-${resolvedContractId}.pdf`
        : "BrandxInfluencer_contract.pdf";

    const contractSize = hasContract ? view?.contractSize || "10.5 MB" : "10.5 MB";

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
                            value={formatMoney(totalCampaignFee, currency)}
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
            <div className="flex w-full flex-col gap-6 rounded-[0.75rem] border border-[#E6E6E6] bg-white p-4">
                <h2 className="text-base font-semibold text-[#1A1A1A]">Payment</h2>

                <div className="flex min-h-[10.5rem] flex-col justify-between self-stretch">
                    <div className="flex items-start justify-between self-stretch">
                        <div className="flex h-12 w-12 items-center justify-center gap-2.5 rounded-[0.5rem] border border-[#E6E6E6] p-3">
                            <MoneyWavy size={24} />
                        </div>

                        <div className="flex items-center gap-2 rounded-[0.75rem] bg-[#F9F9F9] p-2">
                            <button
                                type="button"
                                className="rounded-[0.5rem] bg-white px-3 py-2 text-xs font-medium text-[#1A1A1A]"
                            >
                                Total Payout
                            </button>

                            <button
                                type="button"
                                className="rounded-[0.5rem] px-3 py-2 text-xs font-medium text-[#1A1A1A]"
                            >
                                Pending amount
                            </button>
                        </div>
                    </div>

                    <div className="flex items-end justify-between self-stretch">
                        <div className="flex flex-col items-start gap-2">
                            <p className="text-sm font-medium leading-5 tracking-[0] text-[#B8B8B8]">
                                Remaining Budget
                            </p>
                            <p className="text-base font-medium leading-6 tracking-[0] text-[#1A1A1A]">
                                {getRemainingBudget(contract)}
                            </p>
                        </div>

                        <button
                            type="button"
                            className="flex h-8 items-center justify-center gap-1 rounded-[0.75rem] border border-[#E6E6E6] px-2 text-sm font-medium text-[#1A1A1A]"
                        >
                            <PlusCircle size={16} />
                            Add funds
                        </button>
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
                        <ContractDetailRow
                            label="Contract ID"
                            value={resolvedContractId}
                        />

                        <div className="flex w-full items-center gap-4">
                            <p className="w-[8.5rem] shrink-0 text-sm font-medium leading-5 text-[#969696]">
                                Status
                            </p>

                            <span className="flex items-center gap-1 rounded-[1.5rem] bg-[#F9F9F9] px-2 py-1 text-xs font-medium text-[#969696]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#7DB1FF]" />
                                {resolvedContractStatus}
                            </span>
                        </div>

                        {contractRows.map((item) => (
                            <ContractDetailRow
                                key={item.label}
                                label={item.label}
                                value={item.value}
                            />
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
                                onClick={onDownloadContract}
                                disabled={isContractActionLoading}
                                className="flex h-8 items-center justify-center gap-1 rounded-[0.5rem] px-2 text-xs font-medium text-[#1A1A1A] hover:bg-[#F9F9F9] disabled:opacity-50"
                            >
                                <DownloadSimple size={14} />
                                download
                            </button>

                            <button
                                type="button"
                                onClick={onViewContract}
                                disabled={isContractActionLoading}
                                className="flex h-8 items-center justify-center rounded-[0.5rem] border border-[#E6E6E6] bg-white px-3 text-xs font-medium text-[#1A1A1A] hover:bg-[#F9F9F9] disabled:opacity-50"
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                onClick={onViewContract}
                                disabled={isContractActionLoading}
                                className="flex h-8 items-center justify-center rounded-[0.5rem] bg-[#1A1A1A] px-3 text-xs font-medium text-white hover:bg-black disabled:opacity-50"
                            >
                                Re-send
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment History */}
            <div className="flex w-full flex-col gap-4 bg-white">
                <h2 className="self-stretch text-xl font-semibold leading-7 tracking-[0] text-[#1A1A1A]">
                    Payment History
                </h2>

                <div className="flex flex-col gap-4 self-stretch">
                    {paymentHistory.length === 0 ? (
                        <div className="rounded-[0.75rem] border border-[#E6E6E6] bg-white p-4 text-sm font-medium text-[#969696]">
                            No payment history available.
                        </div>
                    ) : (
                        paymentHistory.map((payment: { icon: any; id: Key | null | undefined; iconClassName: any; title: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; subtitle: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; transactionId: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; amountClassName: any; amount: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }) => {
                            const PaymentIcon = payment.icon;

                            return (
                                <div
                                    key={payment.id}
                                    className="flex w-full items-center justify-between rounded-[0.75rem] border border-[#E6E6E6] bg-white p-4"
                                >
                                    <div className="flex min-w-[15rem] items-center gap-3">
                                        <PaymentIcon
                                            size={22}
                                            className={payment.iconClassName}
                                        />

                                        <div className="flex flex-col">
                                            <p className="text-base font-medium leading-6 text-[#1A1A1A]">
                                                {payment.title}
                                            </p>
                                            <p className="text-sm font-medium leading-5 text-[#969696]">
                                                {payment.subtitle}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-sm font-medium leading-5 text-[#1A1A1A]">
                                        {payment.transactionId}
                                    </p>

                                    <span
                                        className={`rounded-[1.5rem] bg-[#F9F9F9] px-3 py-1 text-sm font-medium leading-5 ${payment.amountClassName}`}
                                    >
                                        {payment.amount}
                                    </span>

                                    <button
                                        type="button"
                                        className="text-sm font-medium leading-5 text-[#1A1A1A] hover:opacity-80"
                                    >
                                        View Transaction
                                    </button>

                                    <button
                                        type="button"
                                        className="flex h-9 items-center justify-center rounded-[0.5rem] bg-[#1A1A1A] px-4 text-sm font-medium text-white hover:bg-black"
                                    >
                                        Download Receipt
                                    </button>
                                </div>
                            );
                        })
                    )}
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