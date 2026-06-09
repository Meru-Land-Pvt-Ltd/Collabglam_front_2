"use client";

import { CaretDown, X } from "@phosphor-icons/react";
import React, { useEffect, useMemo, useRef, useState } from "react";

import {
    Combobox,
    ComboboxContent,
    ComboboxItem,
    ComboboxList,
    ComboboxTrigger,
} from "@/components/ui/combobox";
import { FloatingDateInput } from "@/components/ui/date";

import { apiListCountries } from "@/app/influencer/services/influencerApi";

type FilterKey =
    | "Posted By"
    | "Location"
    | "Campaign Goal"
    | "Campaign Duration"
    | "Budget"
    | "Date";

export type DiscoverFilterState = {
    "Posted By": string;
    Location: string[];
    "Campaign Goal": string;
    "Campaign Duration": string;
    Budget: string;
    Date: string;
    DateRangeType: string;
    StartDate: string;
    EndDate: string;
};

export const EMPTY_DISCOVER_FILTERS: DiscoverFilterState = {
    "Posted By": "",
    Location: [],
    "Campaign Goal": "",
    "Campaign Duration": "",
    Budget: "",
    Date: "",
    DateRangeType: "All",
    StartDate: "",
    EndDate: "",
};

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "Posted By", label: "Posted By" },
    { key: "Location", label: "Location" },
    { key: "Campaign Goal", label: "Campaign Goal" },
    { key: "Campaign Duration", label: "Campaign Duration" },
    { key: "Budget", label: "Budget" },
    { key: "Date", label: "Date" },
];

const POSTED_BY_OPTIONS = [
    "All",
    "Past 24hrs",
    "Past 2 days",
    "Past Week",
    "Past Month",
] as const;

const CAMPAIGN_GOAL_OPTIONS = [
    "All",
    "Awareness",
    "Engagement / Boost",
    "Product Launch",
    "Sales / Conversions",
    "Community",
    "UGC Creation",
    "App Installs",
    "Traffic",
    "Events",
    "Others",
] as const;

const CAMPAIGN_DURATION_OPTIONS = [
    "All",
    "Less then 1 Week",
    "1 Week",
    "2–3 Week",
    "3–6 Weeks",
    "7–12 weeks",
    "More then 12 weeks",
] as const;

const BUDGET_OPTIONS = [
    "All",
    "Under $100",
    "$100 – $500",
    "$500 – $1K",
    "$1K – $5K",
    "$5K – $10K",
    "$10K – $25K",
    "$25K – $50K",
    "$50K+",
] as const;

const DATE_PRESET_OPTIONS = [
    "Recently Received",
    "Today",
    "This Week",
    "This Month",
] as const;

const DATE_RANGE_OPTIONS = ["All", "Posted Date", "Deadline"] as const;

const SORT_OPTIONS = [
    "Most Relevant",
    "Highest Budget",
    "Recently Published",
    "Closing Soon",
    "Highest Match Score",
] as const;

type Option = {
    value: string;
    label: string;
};

type Props = {
    filters: DiscoverFilterState;
    setFilters: React.Dispatch<React.SetStateAction<DiscoverFilterState>>;
    sortValue: string;
    setSortValue?: React.Dispatch<React.SetStateAction<string>>;
    hideAdvancedFilters?: boolean;
};

function unwrapArray(res: any) {
    if (Array.isArray(res)) return res;
    return res?.countries ?? res?.data ?? res?.result ?? res?.items ?? [];
}

function normalizeCountryOption(country: any): Option | null {
    const label = String(
        country?.name ??
        country?.countryName ??
        country?.title ??
        country?.label ??
        country?.country ??
        ""
    ).trim();

    if (!label) return null;

    return {
        value: label,
        label,
    };
}

function toStringArray(next: unknown) {
    return Array.isArray(next) ? next.map(String) : [];
}
function formatDateForLabel(value: string) {
    if (!value) return "";

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) return value;

    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = date.getFullYear();

    return `${mm}/${dd}/${yyyy}`;
}

export default function DiscoverFilter({
    filters,
    setFilters,
    sortValue,
    setSortValue,
    hideAdvancedFilters = false,
}: Props) {
    const [locationOptions, setLocationOptions] = useState<Option[]>([
        { value: "All", label: "All" },
    ]);
    const [locationSearch, setLocationSearch] = useState("");

    const [dateOpen, setDateOpen] = useState(false);
    const dateDropdownRef = useRef<HTMLDivElement | null>(null);
    const [draftDate, setDraftDate] = useState({
        Date: filters.Date || "Recently Received",
        DateRangeType: filters.DateRangeType || "All",
        StartDate: filters.StartDate || "",
        EndDate: filters.EndDate || "",
    });

    useEffect(() => {
        if (!hideAdvancedFilters) return;
        setFilters(EMPTY_DISCOVER_FILTERS);
    }, [hideAdvancedFilters, setFilters]);

    useEffect(() => {
        let alive = true;

        async function loadCountries() {
            try {
                const res = await apiListCountries({});
                const countries = unwrapArray(res)
                    .map(normalizeCountryOption)
                    .filter(Boolean) as Option[];

                if (!alive) return;

                setLocationOptions([{ value: "All", label: "All" }, ...countries]);
            } catch {
                if (!alive) return;
                setLocationOptions([{ value: "All", label: "All" }]);
            }
        }

        loadCountries();

        return () => {
            alive = false;
        };
    }, []);

    const filteredLocationOptions = useMemo(() => {
        const query = locationSearch.trim().toLowerCase();

        const optionsWithoutAll = locationOptions.filter(
            (option) => option.value !== "All"
        );

        if (!query) return optionsWithoutAll;

        return optionsWithoutAll.filter((option) =>
            option.label.toLowerCase().includes(query)
        );
    }, [locationOptions, locationSearch]);

    const locationTriggerText = useMemo(() => {
        const selected = filters.Location;

        if (selected.length === 0) return "";
        if (selected.includes("All")) return "All";

        if (selected.length === 1) return selected[0];

        return `${selected[0]} +${selected.length - 1}`;
    }, [filters.Location]);

    const allLocationValues = useMemo(() => {
        return locationOptions
            .filter((option) => option.value !== "All")
            .map((option) => option.value);
    }, [locationOptions]);

    const handleLocationChange = (next: unknown) => {
        const nextArr = toStringArray(next);
        const prevArr = filters.Location;

        const prevHasAll = prevArr.includes("All");
        const nextHasAll = nextArr.includes("All");

        if (nextHasAll && !prevHasAll) {
            setFilters((prev) => ({
                ...prev,
                Location: ["All", ...allLocationValues],
            }));
            return;
        }

        if (!nextHasAll && prevHasAll) {
            setFilters((prev) => ({
                ...prev,
                Location: [],
            }));
            return;
        }

        const selectedValues = nextArr.filter((value) => value !== "All");

        const isFullySelected =
            allLocationValues.length > 0 &&
            allLocationValues.every((value) => selectedValues.includes(value));

        setFilters((prev) => ({
            ...prev,
            Location: isFullySelected ? ["All", ...selectedValues] : selectedValues,
        }));
    };

    const hasAnyApplied = useMemo(() => {
        const isDefaultString = (value: string) => value === "" || value === "All";

        return (
            !isDefaultString(filters["Posted By"]) ||
            !(filters.Location.length === 0 || filters.Location.includes("All")) ||
            !isDefaultString(filters["Campaign Goal"]) ||
            !isDefaultString(filters["Campaign Duration"]) ||
            !isDefaultString(filters.Budget) ||
            !isDefaultString(filters.Date) ||
            filters.DateRangeType !== "All" ||
            Boolean(filters.StartDate) ||
            Boolean(filters.EndDate)
        );
    }, [filters]);

    const clearAll = () => {
        setFilters(EMPTY_DISCOVER_FILTERS);
    };

    const getCurrentDateDraft = () => ({
        Date: filters.Date || "Recently Received",
        DateRangeType: filters.DateRangeType || "All",
        StartDate: filters.StartDate || "",
        EndDate: filters.EndDate || "",
    });

    const openDateDropdown = () => {
        setDateOpen((prev) => {
            if (!prev) {
                setDraftDate(getCurrentDateDraft());
            }

            return !prev;
        });
    };

    const closeDateDropdownWithoutApply = () => {
        setDraftDate(getCurrentDateDraft());
        setDateOpen(false);
    };

    const applyDateFilter = () => {
        setFilters((prev) => ({
            ...prev,
            Date: draftDate.Date,
            DateRangeType: draftDate.DateRangeType,
            StartDate: draftDate.StartDate,
            EndDate: draftDate.EndDate,
        }));

        setDateOpen(false);
    };

    const dateTriggerText = useMemo(() => {
        if (filters.StartDate || filters.EndDate) {
            return `${formatDateForLabel(filters.StartDate) || "Start"} - ${formatDateForLabel(filters.EndDate) || "End"
                }`;
        }

        return filters.Date || "";
    }, [filters.Date, filters.StartDate, filters.EndDate]);

    const labelTextCls = [
        "text-[var(--Light-Text-Primary,#1A1A1A)]",
        "text-center",
        "font-[var(--Font-Family-Inter,Inter)]",
        "text-[var(--Font-Size-14,0.875rem)]",
        "font-[var(--Font-Weight-regular,400)]",
        "leading-[var(--Line-Height-20,1.25rem)]",
        "tracking-[var(--Letter-Spacing-0,0)]",
    ].join(" ");

    const itemNoTickNeutralSelectedCls = [
        "[&_[data-slot=combobox-item-indicator]]:hidden",
        "data-[highlighted]:bg-[var(--Light-Background-Neutral,#F2F2F2)]",
        "data-[highlighted]:text-[#1A1A1A]",
    ].join(" ");

    const itemSelectedBgUnlessAll = (optionValue: string) =>
        optionValue === "All"
            ? "data-[selected]:bg-transparent data-[selected]:text-[#1A1A1A]"
            : "data-[selected]:bg-[var(--Light-Background-Neutral,#F2F2F2)] data-[selected]:text-[#1A1A1A]";

    const triggerBgString = (value: string) =>
        value !== "" && value !== "All"
            ? "bg-[var(--Light-Background-Neutral,#F2F2F2)]"
            : "bg-transparent";

    const pillTriggerBase = [
        "inline-flex items-center",
        "gap-[0.25rem]",
        "px-2 py-1",
        "rounded-[var(--Border-Radius-S,0.5rem)]",
        "hover:bg-[var(--Light-Background-Neutral,#F2F2F2)]",
        "cursor-pointer",
        "[&_[data-slot=combobox-trigger-icon]]:hidden",
        "text-[var(--Light-Text-Primary,#1A1A1A)]",
        "text-center",
        "font-[var(--Font-Family-Inter,Inter)]",
        "text-[var(--Font-Size-14,0.875rem)]",
        "font-[var(--Font-Weight-Medium,500)]",
        "leading-[var(--Line-Height-20,1.25rem)]",
        "tracking-[var(--Letter-Spacing-0,0)]",
    ];

    const renderStringFilter = (
        key: Exclude<FilterKey, "Date" | "Location">,
        options: readonly string[] | Option[]
    ) => {
        const value = filters[key];

        return (
            <div
                key={key}
                className={[
                    "inline-flex max-w-full items-center justify-center gap-[0.25rem] whitespace-nowrap",
                    labelTextCls,
                ].join(" ")}
            >
                <span>{key}</span>

                <Combobox
                    value={value}
                    onValueChange={(next) =>
                        setFilters((prev) => ({
                            ...prev,
                            [key]: String(next),
                        }))
                    }
                >
                    <ComboboxTrigger
                        className={[...pillTriggerBase, triggerBgString(value)].join(" ")}
                    >
                        {value ? (
                            <span className="max-w-[10rem] truncate">{value}</span>
                        ) : null}

                        <CaretDown className="h-3 w-3" weight="bold" />
                    </ComboboxTrigger>

                    <ComboboxContent className="min-w-[14rem]">
                        <ComboboxList>
                            {options.map((option) => {
                                const optionValue =
                                    typeof option === "string" ? option : option.value;
                                const optionLabel =
                                    typeof option === "string" ? option : option.label;

                                return (
                                    <ComboboxItem
                                        key={optionValue}
                                        value={optionValue}
                                        className={[
                                            itemNoTickNeutralSelectedCls,
                                            itemSelectedBgUnlessAll(optionValue),
                                        ].join(" ")}
                                    >
                                        {optionLabel}
                                    </ComboboxItem>
                                );
                            })}
                        </ComboboxList>
                    </ComboboxContent>
                </Combobox>
            </div>
        );
    };

    const renderLocationFilter = () => {
        return (
            <div
                key="Location"
                className={[
                    "inline-flex max-w-full items-center justify-center gap-[0.25rem] whitespace-nowrap",
                    labelTextCls,
                ].join(" ")}
            >
                <span>Location</span>

                <Combobox
                    multiple
                    value={filters.Location}
                    onOpenChange={(open) => {
                        if (!open) setLocationSearch("");
                    }}
                    onValueChange={handleLocationChange}
                >
                    <ComboboxTrigger
                        className={[
                            ...pillTriggerBase,
                            filters.Location.length > 0 && !filters.Location.includes("All")
                                ? "bg-[var(--Light-Background-Neutral,#F2F2F2)]"
                                : "bg-transparent",
                        ].join(" ")}
                    >
                        {locationTriggerText ? (
                            <span className="max-w-[10rem] truncate">
                                {locationTriggerText}
                            </span>
                        ) : null}

                        <CaretDown className="h-3 w-3" weight="bold" />
                    </ComboboxTrigger>

                    <ComboboxContent
                        className={[
                            "min-w-[14rem]",
                            "overflow-hidden",

                            // Search wrapper UI
                            "[&_[data-slot=combobox-search]]:!flex",
                            "[&_[data-slot=combobox-search]]:!h-[3.5rem]",
                            "[&_[data-slot=combobox-search]]:!items-center",
                            "[&_[data-slot=combobox-search]]:!gap-[0.5rem]",
                            "[&_[data-slot=combobox-search]]:!self-stretch",
                            "[&_[data-slot=combobox-search]]:!px-[0.5rem]",
                            "[&_[data-slot=combobox-search]]:!py-[1.25rem]",
                            "[&_[data-slot=combobox-search]]:!rounded-[var(--Border-Radius-S,0.5rem)]",
                            "[&_[data-slot=combobox-search]]:!bg-[var(--Light-Background-Primary,#FFF)]",

                            // Remove full border/ring from search wrapper
                            "[&_[data-slot=combobox-search]]:!border-0",
                            "[&_[data-slot=combobox-search]]:!shadow-none",
                            "[&_[data-slot=combobox-search]]:!ring-0",
                            "[&_[data-slot=combobox-search]]:!outline-none",

                            // Bottom divider after search
                            "[&_[data-slot=combobox-search]]:!border-b",
                            "[&_[data-slot=combobox-search]]:!border-b-[#E6E6E6]",

                            // Hide search icon if combobox adds one
                            "[&_[data-slot=combobox-search]_svg]:hidden",

                            // Search input UI
                            "[&_[data-slot=combobox-search-input]]:!h-full",
                            "[&_[data-slot=combobox-search-input]]:!w-full",
                            "[&_[data-slot=combobox-search-input]]:!border-0",
                            "[&_[data-slot=combobox-search-input]]:!bg-transparent",
                            "[&_[data-slot=combobox-search-input]]:!px-0",
                            "[&_[data-slot=combobox-search-input]]:!py-0",
                            "[&_[data-slot=combobox-search-input]]:!shadow-none",
                            "[&_[data-slot=combobox-search-input]]:!ring-0",
                            "[&_[data-slot=combobox-search-input]]:!outline-none",
                            "[&_[data-slot=combobox-search-input]]:placeholder:!text-[#A3A3A3]",
                            "[&_[data-slot=combobox-search-input]]:placeholder:!opacity-100",
                        ].join(" ")}
                        showSearch
                        searchPlaceholder="Search..."
                        searchInputProps={{
                            value: locationSearch,
                            onChange: (event) =>
                                setLocationSearch((event.target as HTMLInputElement).value),
                            className: [
                                "!border-0",
                                "!bg-transparent",
                                "!shadow-none",
                                "!outline-none",
                                "!ring-0",
                                "focus:!border-0",
                                "focus:!outline-none",
                                "focus:!ring-0",
                                "focus-visible:!border-0",
                                "focus-visible:!outline-none",
                                "focus-visible:!ring-0",
                                "placeholder:!text-[#A3A3A3]",
                                "placeholder:!opacity-100",
                            ].join(" "),
                        }}
                    >
                        <ComboboxList>
                            <ComboboxItem
                                value="All"
                                showCheckbox
                                className={[
                                    itemNoTickNeutralSelectedCls,
                                    itemSelectedBgUnlessAll("All"),
                                ].join(" ")}
                            >
                                All
                            </ComboboxItem>

                            {filteredLocationOptions.map((option) => (
                                <ComboboxItem
                                    key={option.value}
                                    value={option.value}
                                    showCheckbox
                                    className={[
                                        itemNoTickNeutralSelectedCls,
                                        itemSelectedBgUnlessAll(option.value),
                                    ].join(" ")}
                                >
                                    {option.label}
                                </ComboboxItem>
                            ))}
                        </ComboboxList>
                    </ComboboxContent>
                </Combobox>
            </div>
        );
    };

    return (
        <>
            <section className="mt-[2rem] px-[2rem]">
                <div className="flex items-start justify-between gap-x-[2.5rem] gap-y-3">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center content-center gap-[0.75rem]">
                        {!hideAdvancedFilters ? (
                            <>
                                {FILTERS.map((filter) => {
                                    if (filter.key === "Posted By") {
                                        return renderStringFilter("Posted By", POSTED_BY_OPTIONS);
                                    }

                                    if (filter.key === "Location") {
                                        return renderLocationFilter();
                                    }

                                    if (filter.key === "Campaign Goal") {
                                        return renderStringFilter(
                                            "Campaign Goal",
                                            CAMPAIGN_GOAL_OPTIONS
                                        );
                                    }

                                    if (filter.key === "Campaign Duration") {
                                        return renderStringFilter(
                                            "Campaign Duration",
                                            CAMPAIGN_DURATION_OPTIONS
                                        );
                                    }

                                    if (filter.key === "Budget") {
                                        return renderStringFilter("Budget", BUDGET_OPTIONS);
                                    }

                                    if (filter.key === "Date") {
                                        return (
                                            <div
                                                key={filter.key}
                                                ref={dateDropdownRef}
                                                className={[
                                                    "relative inline-flex max-w-full items-center justify-center gap-[0.25rem] whitespace-nowrap",
                                                    labelTextCls,
                                                ].join(" ")}
                                            >
                                                <span>{filter.label}</span>

                                                <button
                                                    type="button"
                                                    onClick={openDateDropdown}
                                                    className={[
                                                        ...pillTriggerBase,
                                                        triggerBgString(
                                                            filters.Date ||
                                                                filters.StartDate ||
                                                                filters.EndDate ||
                                                                filters.DateRangeType !== "All"
                                                                ? "selected"
                                                                : ""
                                                        ),
                                                    ].join(" ")}
                                                >
                                                    {dateTriggerText ? (
                                                        <span className="max-w-[10rem] truncate">
                                                            {dateTriggerText}
                                                        </span>
                                                    ) : null}

                                                    <CaretDown className="h-3 w-3" weight="bold" />
                                                </button>

                                                {dateOpen ? (
                                                    <div
                                                        className={[
                                                            "absolute left-0 top-[calc(100%+0.5rem)] z-[80]",
                                                            "w-[42rem] max-w-[calc(100vw-2rem)]",
                                                            "rounded-[0.75rem]",
                                                            "bg-white",
                                                            "p-6",
                                                            "shadow-[0_24px_40px_-4px_rgba(0,0,0,0.18),0_0_12px_rgba(0,0,0,0.08)]",
                                                            "border border-[var(--Light-Border-Subtle,#E6E6E6)]",
                                                        ].join(" ")}
                                                        onPointerDown={(event) => event.stopPropagation()}
                                                    >
                                                        <div className="mb-4 flex items-center justify-between">
                                                            <h3 className="text-[1rem] font-semibold leading-6 text-[#1A1A1A]">
                                                                Select Date
                                                            </h3>

                                                            <button
                                                                type="button"
                                                                onClick={closeDateDropdownWithoutApply}
                                                                className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[#F2F2F2]"
                                                                aria-label="Close date filter"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>

                                                        <div className="mb-4 flex flex-wrap items-center gap-2">
                                                            {DATE_PRESET_OPTIONS.map((option) => {
                                                                const selected = draftDate.Date === option;

                                                                return (
                                                                    <button
                                                                        key={option}
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setDraftDate((prev) => ({
                                                                                ...prev,
                                                                                Date: option,
                                                                                StartDate: "",
                                                                                EndDate: "",
                                                                            }))
                                                                        }
                                                                        className={[
                                                                            "h-8 rounded-lg px-3 text-[0.75rem] font-semibold transition",
                                                                            selected
                                                                                ? "bg-[#1A1A1A] text-white"
                                                                                : "border border-[#E6E6E6] bg-white text-[#999] hover:bg-[#F2F2F2]",
                                                                        ].join(" ")}
                                                                    >
                                                                        {option}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                                            <Combobox
                                                                value={draftDate.DateRangeType}
                                                                onValueChange={(next) =>
                                                                    setDraftDate((prev) => ({
                                                                        ...prev,
                                                                        DateRangeType: String(next),
                                                                    }))
                                                                }
                                                            >
                                                                <ComboboxTrigger
                                                                    className={[
                                                                        "flex h-[4.125rem] w-full items-center justify-between",
                                                                        "rounded-lg border border-[#E6E6E6] bg-white px-4",
                                                                        "text-[0.875rem] text-[#1A1A1A]",
                                                                        "outline-none",
                                                                        "focus:ring-1 focus:ring-black/60",
                                                                        "[&_[data-slot=combobox-trigger-icon]]:hidden",
                                                                    ].join(" ")}
                                                                >
                                                                    <span>{draftDate.DateRangeType}</span>
                                                                    <CaretDown className="h-3 w-3" weight="bold" />
                                                                </ComboboxTrigger>

                                                                <ComboboxContent className="min-w-[12rem]">
                                                                    <ComboboxList>
                                                                        {DATE_RANGE_OPTIONS.map((option) => (
                                                                            <ComboboxItem
                                                                                key={option}
                                                                                value={option}
                                                                                className={[
                                                                                    itemNoTickNeutralSelectedCls,
                                                                                    itemSelectedBgUnlessAll(option),
                                                                                ].join(" ")}
                                                                            >
                                                                                {option}
                                                                            </ComboboxItem>
                                                                        ))}
                                                                    </ComboboxList>
                                                                </ComboboxContent>
                                                            </Combobox>

                                                            <FloatingDateInput
                                                                label="Start Date"
                                                                value={draftDate.StartDate}
                                                                onValueChange={(value) =>
                                                                    setDraftDate((prev) => ({
                                                                        ...prev,
                                                                        Date: "",
                                                                        StartDate: value,
                                                                    }))
                                                                }
                                                                outputFormat="iso"
                                                                size="small"
                                                                placeholderText="MM/DD/YYYY"
                                                                icon
                                                            />

                                                            <FloatingDateInput
                                                                label="End Date"
                                                                value={draftDate.EndDate}
                                                                onValueChange={(value) =>
                                                                    setDraftDate((prev) => ({
                                                                        ...prev,
                                                                        Date: "",
                                                                        EndDate: value,
                                                                    }))
                                                                }
                                                                outputFormat="iso"
                                                                size="small"
                                                                placeholderText="MM/DD/YYYY"
                                                                icon
                                                                min={draftDate.StartDate || undefined}
                                                            />
                                                        </div>

                                                        <div className="mt-5 flex justify-end gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={closeDateDropdownWithoutApply}
                                                                className="h-10 rounded-lg px-8 text-[0.875rem] font-semibold text-[#1A1A1A] hover:bg-[#F2F2F2]"
                                                            >
                                                                Cancel
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={applyDateFilter}
                                                                className="h-10 rounded-lg bg-[#1A1A1A] px-10 text-[0.875rem] font-semibold text-white hover:bg-black"
                                                            >
                                                                Apply
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>
                                        );
                                    }

                                    return null;
                                })}

                                <button
                                    type="button"
                                    onClick={clearAll}
                                    disabled={!hasAnyApplied}
                                    className={[
                                        "inline-flex items-center",
                                        "gap-[0.25rem]",
                                        "px-2 py-1",
                                        "rounded-[var(--Border-Radius-S,0.5rem)]",
                                        "bg-transparent",
                                        "hover:bg-[var(--Light-Background-Neutral,#F2F2F2)]",
                                        "whitespace-nowrap",
                                        labelTextCls,
                                        "disabled:opacity-50 disabled:cursor-not-allowed",
                                        "cursor-pointer",
                                    ].join(" ")}
                                >
                                    <span>Clear</span>
                                    <X className="h-3 w-3" />
                                </button>
                            </>
                        ) : null}
                    </div>

                    <div className="flex shrink-0 items-start gap-[0.5rem]">

                        <div
                            className={[
                                "flex h-10 items-center",
                                "px-2",
                                "gap-[0.25rem]",
                                "rounded-[var(--Border-Radius-S,0.5rem)]",
                                "border border-[var(--Light-Border-Subtle,#E6E6E6)]",
                                "bg-white",
                                "w-[12rem]",
                            ].join(" ")}
                        >
                            <span className="whitespace-nowrap text-[0.75rem] leading-4 text-[var(--Light-Text-Primary,#1A1A1A)]">
                                Sort :
                            </span>

                            <Combobox
                                value={sortValue}
                                onValueChange={(next) => setSortValue?.(String(next))}
                            >
                                <ComboboxTrigger
                                    className={[
                                        "relative group",
                                        "flex min-w-0 flex-1 items-center justify-between",
                                        "bg-transparent",
                                        "cursor-pointer",
                                        "overflow-visible",
                                        "[&_[data-slot=combobox-trigger-icon]]:hidden",
                                    ].join(" ")}
                                >
                                    <span
                                        className={[
                                            "truncate",
                                            "text-[var(--Light-Text-Primary,#1A1A1A)]",
                                            "text-center",
                                            "font-[var(--Font-Family-Inter,Inter)]",
                                            "text-[0.875rem]",
                                            "font-medium",
                                            "leading-[1.25rem]",
                                        ].join(" ")}
                                        title={sortValue}
                                    >
                                        {sortValue}
                                    </span>

                                    <CaretDown className="ml-2 h-3 w-3 shrink-0" weight="bold" />
                                </ComboboxTrigger>

                                <ComboboxContent className="min-w-[14rem]">
                                    <ComboboxList>
                                        {SORT_OPTIONS.map((option) => (
                                            <ComboboxItem
                                                key={option}
                                                value={option}
                                                className={[
                                                    itemNoTickNeutralSelectedCls,
                                                    itemSelectedBgUnlessAll(option),
                                                ].join(" ")}
                                            >
                                                {option}
                                            </ComboboxItem>
                                        ))}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}