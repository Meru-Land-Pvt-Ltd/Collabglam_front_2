"use client";

import { DownloadSimple } from "@phosphor-icons/react";
import { InfluencerViewModel } from "./utils";

type PaymentTabProps = {
    view: InfluencerViewModel;
    contractLoading: boolean;
    onViewContract: () => void;
    onDownloadContract: () => void;
};

export default function PaymentTab({
    view,
    contractLoading,
    onViewContract,
    onDownloadContract,
}: PaymentTabProps) {
    const hasContract = Boolean(view.printableContractId);

    return (
        <section className="flex flex-col gap-4 px-4 py-5">
            <div className="rounded-xl border border-[#E6E6E6] bg-white p-4">
                <div className="grid grid-cols-3 gap-0">
                    <div className="px-4 py-3">
                        <p className="text-sm text-[#969696]">Influencer Payment</p>
                        <p className="mt-2 text-base font-medium text-[#1A1A1A]">
                            {view.influencerPayment}
                        </p>
                    </div>

                    <div className="px-4 py-3">
                        <p className="text-sm text-[#969696]">Milestones</p>
                        <p className="mt-2 text-base font-medium text-[#1A1A1A]">
                            {view.milestonesText}
                        </p>
                    </div>

                    <div className="px-4 py-3">
                        <p className="text-sm text-[#969696]">Total Deliverables</p>
                        <p className="mt-2 text-base font-medium text-[#1A1A1A]">
                            {String(view.totalDeliverables || 0).padStart(2, "0")}
                        </p>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-[#E6E6E6] bg-white p-4">
                <h2 className="mb-5 text-[28px] font-semibold text-[#1f1f1f]">
                    Contract
                </h2>

                <div className="flex items-center justify-between gap-4 rounded-[18px] border border-[#e8e8e8] bg-white px-5 py-4">
                    <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF3F1]">
                            <svg
                                className="h-6 w-6 text-[#E64646]"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8l-5-6zm1 7V3.5L18.5 9H15z" />
                            </svg>
                        </div>

                        <div className="min-w-0">
                            <p className="truncate text-[24px] font-medium leading-none text-[#2a2a2a]">
                                {hasContract ? view.contractFileName : "No contract found"}
                            </p>
                            <p className="mt-2 text-[22px] leading-none text-[#a3a3a3]">
                                {hasContract ? view.contractSize : "-"}
                            </p>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={onDownloadContract}
                            disabled={contractLoading || !hasContract}
                            className="inline-flex items-center gap-2 text-[20px] font-normal text-[#1f1f1f] hover:opacity-80 disabled:opacity-50"
                        >
                            <DownloadSimple size={18} />
                            download
                        </button>

                        <button
                            type="button"
                            onClick={onViewContract}
                            disabled={contractLoading || !hasContract}
                            className="h-[44px] min-w-[78px] rounded-lg border border-[#dedede] bg-[#f7f7f7] px-5 text-[18px] font-medium text-[#2a2a2a] hover:bg-[#f0f0f0] disabled:opacity-50"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            onClick={onViewContract}
                            disabled={contractLoading || !hasContract}
                            className="h-[44px] min-w-[78px] rounded-lg bg-[#151515] px-5 text-[18px] font-medium text-white hover:bg-black disabled:opacity-50"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}