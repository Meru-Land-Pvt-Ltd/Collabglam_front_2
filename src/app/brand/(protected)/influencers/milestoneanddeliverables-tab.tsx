"use client";

import { PencilSimpleIcon } from "@phosphor-icons/react";
import { InfluencerViewModel } from "./utils";

function PlatformBadgeIcon({ platform }: { platform: string }) {
    const label = platform === "-" ? "?" : platform.slice(0, 1).toUpperCase();

    return (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F5] text-xs font-semibold text-[#1A1A1A]">
            {label}
        </span>
    );
}

type MilestoneAndDeliverablesTabProps = {
    view: InfluencerViewModel;
};

export default function MilestoneAndDeliverablesTab({
    view,
}: MilestoneAndDeliverablesTabProps) {
    return (
        <section className="px-4 py-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold leading-none text-[#1f1f1f]">
                        Milestone & Deliverables
                    </h2>
                    <p className="mt-3 text-sm text-[#b3b3b3]">
                        Handpicked influencers matched to your campaign objectives and target audience.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button className="h-9 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-[#1f1f1f] transition hover:bg-gray-50">
                        Add Milestone
                    </button>

                    <div className="relative">
                        <select className="h-9 appearance-none rounded-lg border border-gray-200 bg-white pl-3 pr-8 text-sm text-[#1f1f1f] focus:outline-none">
                            <option>Last 7 days</option>
                            <option>Last 30 days</option>
                        </select>

                        <svg
                            className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="mt-8 rounded-lg bg-[#e9e9e9] px-6 py-4">
                <div className="grid grid-cols-[1.2fr_1.9fr_1fr_1fr_.8fr_1fr_1fr] items-center gap-6 text-sm font-semibold text-[#2b2b2b]">
                    <span>Deliverable</span>
                    <span>Content format</span>
                    <span>Platform</span>
                    <span>Status</span>
                    <span>Quantity</span>
                    <span>Deadline</span>
                    <span>Action</span>
                </div>
            </div>

            <div className="mt-5 space-y-5">
                {view.milestones.length > 0 ? (
                    view.milestones.map((item) => (
                        <div
                            key={item.id}
                            className="rounded-lg border border-[#e7e7e7] bg-white px-6 py-5"
                        >
                            <div className="grid grid-cols-[1.2fr_1.9fr_1fr_1fr_.8fr_1fr_1fr] items-center gap-6">
                                <div>
                                    <p className="text-sm font-medium leading-[1.25] text-[#1f1f1f]">
                                        {item.name}
                                    </p>
                                </div>

                                <div>
                                    <p className="max-w-[240px] line-clamp-2 text-xs font-medium leading-7 text-[#1f1f1f]">
                                        {item.format}
                                    </p>
                                </div>

                                <div className="flex items-center">
                                    <PlatformBadgeIcon platform={item.platform} />
                                </div>

                                <div>
                                    <span className="inline-flex items-center gap-2 rounded-full bg-[#f5f5f5] px-4 py-2 text-[18px] font-medium text-[#8a8a8a]">
                                        <span className="h-2.5 w-2.5 rounded-full bg-[#27c24c]" />
                                        {item.status}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-sm font-medium text-[#1f1f1f]">
                                        {item.qty}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-sm font-medium text-[#1f1f1f]">
                                        {item.deadline}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4">
                                    <button className="inline-flex items-center gap-2 rounded-lg bg-[#151515] px-4 py-3 text-[15px] font-medium text-white transition hover:bg-black">
                                        <span>Edit</span>
                                        <PencilSimpleIcon size={16} />
                                    </button>

                                    <button className="text-[#1f1f1f] transition hover:text-black">
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="rounded-lg border border-[#e7e7e7] bg-white px-6 py-5 text-sm text-gray-400">
                        No deliverables found.
                    </div>
                )}
            </div>
        </section>
    );
}