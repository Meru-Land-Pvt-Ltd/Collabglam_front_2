"use client";

import { PaperPlaneTilt } from "@phosphor-icons/react";
import { InfluencerViewModel } from "./utils";

type CommunicationProps = {
    view: InfluencerViewModel;
};

export default function Communication({ view }: CommunicationProps) {
    return (
        <section className="flex flex-col gap-4 px-4 py-5">
            <div className="rounded-xl border border-[#E6E6E6] bg-white p-5">
                <h2 className="text-xl font-semibold text-[#1A1A1A]">
                    Communication
                </h2>
                <p className="mt-2 text-sm text-[#969696]">
                    Messages and communication history with {view.profileName}.
                </p>

                <div className="mt-5 rounded-xl border border-dashed border-[#E6E6E6] p-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F5F5]">
                        <PaperPlaneTilt size={22} className="text-[#1A1A1A]" />
                    </div>

                    <p className="mt-3 text-sm font-medium text-[#1A1A1A]">
                        No conversation selected
                    </p>
                    <p className="mt-1 text-sm text-[#969696]">
                        Connect inbox/thread API here when ready.
                    </p>
                </div>
            </div>
        </section>
    );
}