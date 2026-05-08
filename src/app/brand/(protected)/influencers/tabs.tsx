"use client";

import { MANAGE_TABS } from "./utils";
import type { ManageTabKey } from "./type";

type TabsProps = {
    activeTab: ManageTabKey;
    onTabChange: (tab: ManageTabKey) => void;
    className?: string;
};

export default function Tabs({
    activeTab,
    onTabChange,
    className = "",
}: TabsProps) {
    return (
        <nav className={`flex items-center gap-3 ${className}`}>
            {MANAGE_TABS.map((tab) => {
                const isActive = activeTab === tab.key;

                return (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => onTabChange(tab.key)}
                        className={[
                            "flex h-[3.4375rem] items-center justify-center gap-2 px-3 py-2",
                            "font-['Inter'] text-[0.875rem] leading-5 tracking-[0]",
                            "transition-colors",
                            isActive
                                ? "border-b-2 border-[#F6C343] font-semibold text-[#1A1A1A]"
                                : "border-b-2 border-transparent font-medium text-[#B8B8B8] hover:text-[#1A1A1A]",
                        ].join(" ")}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </nav>
    );
}