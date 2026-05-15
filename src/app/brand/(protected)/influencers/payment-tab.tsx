"use client";

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
import { InfluencerViewModel } from "./utils";

type PaymentTabProps = {
    view: InfluencerViewModel;
    contractLoading: boolean;
    onViewContract: () => void;
    onDownloadContract: () => void;
};

const milestoneCards = [
    {
        icon: Wallet,
        label: "Contract Timeline",
        value: "6 months",
    },
    {
        icon: Coins,
        label: "Payment Type",
        value: "Milestone",
    },
    {
        icon: CalendarDots,
        label: "Upcoming Payout",
        value: "23/12/25",
    },
    {
        icon: ArrowUpRight,
        label: "Last payout",
        value: "USD $ 1000",
    },
];

const contractDetails = [
    {
        label: "Contract ID",
        value: "IFL15511364",
    },
    {
        label: "Signed by Influencer",
        value: "Dec 14, 2025",
    },
    {
        label: "Signed by Brand",
        value: "Dec 12, 2025",
    },
    {
        label: "Usage Rights",
        value: "6 months",
    },
    {
        label: "Content Ownership",
        value: "Non-exclusive",
    },
    {
        label: "Payment Type",
        value: "Milestone-based",
    },
    {
        label: "Payment Terms",
        value: "30/20/50 Split",
    },
    {
        label: "Exclusivity Period",
        value: "30 days",
    },
];

const paymentHistory = [
    {
        id: "1",
        title: "Milestone Payment",
        subtitle: "TXN-1245",
        transactionId: "TXN-1245",
        amount: "-$2000",
        amountClassName: "text-[#1A1A1A]",
        icon: ArrowUpLeft,
        iconClassName: "text-[#1A1A1A]",
    },
    {
        id: "2",
        title: "Milestone Payment",
        subtitle: "TXN-1245",
        transactionId: "TXN-1245",
        amount: "-$2000",
        amountClassName: "text-[#16A34A]",
        icon: ArrowDownRight,
        iconClassName: "text-[#16A34A]",
    },
];

export default function PaymentTab({
    view,
    contractLoading,
    onViewContract,
    onDownloadContract,
}: PaymentTabProps) {
    const hasContract = Boolean(view.printableContractId);

    const contractFileName = hasContract
        ? view.contractFileName
        : "BrandxInfluencer_contract.pdf";

    const contractSize = hasContract ? view.contractSize : "10.5 MB";

    return (
        <section className="flex w-full flex-col items-start gap-4 px-4 py-5">
            {/* Milestone & Deliverables */}
            <div className="flex w-full  flex-col gap-5 bg-white">
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
                            value={view.influencerPayment || "-"}
                        />
                        <InfoItem label="Payment Model" value="Fixed" />
                        <InfoItem label="Upcoming Payouts" value="$ 1000" />
                        <InfoItem label="Contract Sign Date" value="20/12/25" />
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
                                USD $ 8,000
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
                        <ContractDetailRow label="Contract ID" value="IFL15511364" />

                        <div className="flex w-full items-center gap-4">
                            <p className="w-[8.5rem] shrink-0 text-sm font-medium leading-5 text-[#969696]">
                                Status
                            </p>

                            <span className="flex items-center gap-1 rounded-[1.5rem] bg-[#F9F9F9] px-2 py-1 text-xs font-medium text-[#969696]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#7DB1FF]" />
                                Completed
                            </span>
                        </div>

                        {contractDetails.slice(1).map((item) => (
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
                                disabled={contractLoading}
                                className="flex h-8 items-center justify-center gap-1 rounded-[0.5rem] px-2 text-xs font-medium text-[#1A1A1A] hover:bg-[#F9F9F9] disabled:opacity-50"
                            >
                                <DownloadSimple size={14} />
                                download
                            </button>

                            <button
                                type="button"
                                onClick={onViewContract}
                                disabled={contractLoading}
                                className="flex h-8 items-center justify-center rounded-[0.5rem] border border-[#E6E6E6] bg-white px-3 text-xs font-medium text-[#1A1A1A] hover:bg-[#F9F9F9] disabled:opacity-50"
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                onClick={onViewContract}
                                disabled={contractLoading}
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
                    {paymentHistory.map((payment) => {
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
                    })}
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
        <div className="flex w-full items-center gap-4">
            <p className="w-[8.5rem] shrink-0 text-sm font-medium leading-5 text-[#969696]">
                {label}
            </p>
            <p className="text-sm font-medium leading-5 text-[#1A1A1A]">
                {value}
            </p>
        </div>
    );
}