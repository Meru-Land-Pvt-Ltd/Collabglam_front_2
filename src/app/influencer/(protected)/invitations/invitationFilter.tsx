"use client";

import { CaretDown, MagnifyingGlass, X } from "@phosphor-icons/react";
import React, { useEffect, useMemo, useState } from "react";

import {
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";

import { apiCategoryGetAll } from "@/app/influencer/services/influencerApi";

export type InvitationFilterState = {
  "Campaign Type": string;
  Category: string[];
  "Invitation Date": string;
  Budget: string;
  "Applied Status": string;
  Date: string;
  Platform: string[];
};

export type FilterState = InvitationFilterState;

export const EMPTY_INVITATION_FILTERS: InvitationFilterState = {
  "Campaign Type": "All",
  Category: ["All"],
  "Invitation Date": "All",
  Budget: "All",
  "Applied Status": "All",
  Date: "All",
  Platform: ["All"],
};

export const EMPTY_FILTERS = EMPTY_INVITATION_FILTERS;

const CAMPAIGN_TYPE_OPTIONS = [
  "All",
  "Paid",
  "Barter",
  "Affiliate",
  "Product Seeding",
  "Event",
] as const;

const INVITATION_DATE_OPTIONS = [
  "All",
  "Today",
  "Last 24 Hours",
  "Last 7 Days",
  "Last 30 Days",
] as const;

const BUDGET_OPTIONS = [
  "All",
  "Under $100",
  "$100 - $500",
  "$500 - $1000",
  "$1,000 - $5,000",
  "$5000+",
] as const;

const APPLIED_STATUS_OPTIONS = [
  "All",
  "New",
  "Viewed",
  "Accepted",
  "Shortlisted",
  "Expired",
  "Rejected",
] as const;

const DATE_OPTIONS = ["All", "Today", "Last 7 Days", "Last 30 Days"] as const;

export const INVITATION_SORT_OPTIONS = [
  "Newest Invitation",
  "Highest Budget",
  "Highest Match Score",
  "Response Deadline",
  "Highest Brand Rating",
] as const;

const PLATFORM_OPTIONS = [
  { value: "All", label: "All", icon: undefined },
  {
    value: "Instagram",
    label: "Instagram",
    icon: "/skill-icons_instagram.svg",
  },
  {
    value: "YouTube",
    label: "YouTube",
    icon: "/logos_youtube-icon.svg",
  },
  {
    value: "TikTok",
    label: "TikTok",
    icon: "/ic_baseline-tiktok.svg",
  },
] as const;

type Option = {
  value: string;
  label: string;
};

type Props = {
  filters: InvitationFilterState;
  setFilters: React.Dispatch<React.SetStateAction<InvitationFilterState>>;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  sortValue: string;
  setSortValue?: React.Dispatch<React.SetStateAction<string>>;
  hideAdvancedFilters?: boolean;
};

function normalizeMulti(next: unknown) {
  const arr = Array.isArray(next) ? next.map(String) : [];

  if (arr.includes("All")) {
    return arr.length > 1 ? arr.filter((value) => value !== "All") : ["All"];
  }

  return arr.length > 0 ? arr : ["All"];
}

function getSingleValue(next: unknown) {
  const value = String(next || "All").trim();
  return value || "All";
}

export default function InvitationFilter({
  filters,
  setFilters,
  search,
  setSearch,
  sortValue,
  setSortValue,
  hideAdvancedFilters = false,
}: Props) {
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([
    { value: "All", label: "All" },
  ]);

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  useEffect(() => {
    if (!hideAdvancedFilters) return;
    setFilters(EMPTY_INVITATION_FILTERS);
  }, [hideAdvancedFilters, setFilters]);

  useEffect(() => {
    let alive = true;

    async function loadCategories() {
      try {
        const res = await apiCategoryGetAll();
        const source = Array.isArray(res) ? res : (res as any)?.categories ?? [];

        const options = source
          .map((category: any) => {
            const label = String(
              category?.name ?? category?.categoryName ?? category?.title ?? ""
            ).trim();

            if (!label) return null;

            return {
              value: String(category?._id ?? category?.id ?? label),
              label,
            };
          })
          .filter(Boolean) as Option[];

        if (!alive) return;
        setCategoryOptions([{ value: "All", label: "All" }, ...options]);
      } catch {
        // Keep the default All option.
      }
    }

    loadCategories();

    return () => {
      alive = false;
    };
  }, []);

  const hasAnyApplied = useMemo(() => {
    const hasString = (value: string) => value !== "" && value !== "All";
    const hasMulti = (value: string[]) => value.length > 0 && !value.includes("All");

    return (
      hasString(filters["Campaign Type"]) ||
      hasString(filters["Invitation Date"]) ||
      hasString(filters.Budget) ||
      hasString(filters["Applied Status"]) ||
      hasString(filters.Date) ||
      hasMulti(filters.Category) ||
      hasMulti(filters.Platform)
    );
  }, [filters]);

  const categoryLabelById = useMemo(() => {
    return new Map(categoryOptions.map((option) => [option.value, option.label]));
  }, [categoryOptions]);

  const filteredCategoryOptions = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    const optionsWithoutAll = categoryOptions.filter((option) => option.value !== "All");

    if (!q) return optionsWithoutAll;

    return optionsWithoutAll.filter((option) =>
      option.label.toLowerCase().includes(q)
    );
  }, [categoryOptions, categorySearch]);

  const allCategoryIds = useMemo(() => {
    return categoryOptions
      .filter((option) => option.value !== "All")
      .map((option) => option.value);
  }, [categoryOptions]);

  const categoryTriggerText = useMemo(() => {
    const selected = filters.Category;

    if (selected.length === 0 || selected.includes("All")) return "All";

    const labels = selected.map((id) => categoryLabelById.get(id) ?? id);

    if (labels.length === 1) return labels[0];
    return `${labels[0]} +${labels.length - 1}`;
  }, [filters.Category, categoryLabelById]);

  const keepCategoryOpen = () => {
    setCategoryOpen(true);
    window.setTimeout(() => setCategoryOpen(true), 0);
  };

  const handleCategoryChange = (next: unknown) => {
    const nextArr = Array.isArray(next) ? next.map(String) : [];
    const prevArr = filters.Category;

    const prevHasAll = prevArr.includes("All");
    const nextHasAll = nextArr.includes("All");

    if (nextHasAll && !prevHasAll) {
      setFilters((prev) => ({
        ...prev,
        Category: ["All", ...allCategoryIds],
      }));
      keepCategoryOpen();
      return;
    }

    if (!nextHasAll && prevHasAll) {
      setFilters((prev) => ({ ...prev, Category: [] }));
      keepCategoryOpen();
      return;
    }

    const selectedIds = nextArr.filter((value) => value !== "All");
    const isFullySelected =
      allCategoryIds.length > 0 &&
      allCategoryIds.every((id) => selectedIds.includes(id));

    setFilters((prev) => ({
      ...prev,
      Category: isFullySelected ? ["All", ...selectedIds] : selectedIds,
    }));

    keepCategoryOpen();
  };

  const platformIconByValue = useMemo(() => {
    const record: Record<string, string | undefined> = {};

    PLATFORM_OPTIONS.forEach((option) => {
      record[option.value] = option.icon;
    });

    return record;
  }, []);

  const platformCircleCls = [
    "flex h-[1.75rem] w-[1.75rem] items-center justify-center rounded-[2.5rem]",
    "border border-[var(--Light-Border-Subtle,#E6E6E6)] bg-white p-2",
  ].join(" ");

  const platformTriggerNode = useMemo(() => {
    const selected = filters.Platform;

    if (selected.length === 0 || selected.includes("All")) return <span>All</span>;

    const maxIcons = 3;
    const shown = selected.slice(0, maxIcons);
    const extra = selected.length - shown.length;

    return (
      <span className="inline-flex items-center overflow-visible">
        {shown.map((platform, index) => {
          const icon = platformIconByValue[platform];

          return (
            <span
              key={platform}
              className={[platformCircleCls, index > 0 ? "-ml-2" : ""].join(" ")}
              style={{ zIndex: 10 + index }}
              title={platform}
            >
              {icon ? (
                <img src={icon} alt="" className="h-4 w-4" />
              ) : (
                <span className="text-[0.75rem]">{platform}</span>
              )}
            </span>
          );
        })}

        {extra > 0 ? (
          <span
            className={[platformCircleCls, shown.length > 0 ? "-ml-2" : ""].join(" ")}
            style={{ zIndex: 10 + shown.length }}
          >
            <span className="text-[0.75rem] font-medium">+{extra}</span>
          </span>
        ) : null}
      </span>
    );
  }, [filters.Platform, platformCircleCls, platformIconByValue]);

  const clearAll = () => {
    setFilters(EMPTY_INVITATION_FILTERS);
    setSearch("");
    setSortValue?.("Newest Invitation");
  };

  const labelTextCls = [
    "text-[var(--Light-Text-Primary,#1A1A1A)]",
    "text-center font-[var(--Font-Family-Inter,Inter)]",
    "text-[var(--Font-Size-14,0.875rem)] font-[var(--Font-Weight-regular,400)]",
    "leading-[var(--Line-Height-20,1.25rem)] tracking-[var(--Letter-Spacing-0,0)]",
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

  const triggerBgMulti = (value: string[]) =>
    value.length > 0 && !value.includes("All")
      ? "bg-[var(--Light-Background-Neutral,#F2F2F2)]"
      : "bg-transparent";

  const pillTriggerBase = [
    "inline-flex cursor-pointer items-center gap-[0.25rem] rounded-[var(--Border-Radius-S,0.5rem)]",
    "px-2 py-1 hover:bg-[var(--Light-Background-Neutral,#F2F2F2)]",
    "[&_[data-slot=combobox-trigger-icon]]:hidden",
    "text-[var(--Light-Text-Primary,#1A1A1A)] text-center",
    "font-[var(--Font-Family-Inter,Inter)] text-[var(--Font-Size-14,0.875rem)]",
    "font-[var(--Font-Weight-Medium,500)] leading-[var(--Line-Height-20,1.25rem)]",
  ];

  const renderSingleFilter = (
    label: string,
    value: string,
    options: readonly string[],
    onChange: (value: string) => void,
    contentClassName = "min-w-[14rem]"
  ) => (
    <div className={["inline-flex max-w-full items-center justify-center gap-[0.25rem] whitespace-nowrap", labelTextCls].join(" ")}>
      <span>{label}</span>

      <Combobox value={value} onValueChange={(next) => onChange(getSingleValue(next))}>
        <ComboboxTrigger className={[...pillTriggerBase, triggerBgString(value)].join(" ")}>
          <span className="max-w-[10rem] truncate">{value || "All"}</span>
          <CaretDown className="h-3 w-3" weight="bold" />
        </ComboboxTrigger>

        <ComboboxContent className={contentClassName}>
          <ComboboxList>
            {options.map((option) => (
              <ComboboxItem
                key={option}
                value={option}
                className={[itemNoTickNeutralSelectedCls, itemSelectedBgUnlessAll(option)].join(" ")}
              >
                {option}
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );

  return (
    <section className="bg-white px-[2rem] pt-[2rem]">
      <div className="flex items-start justify-between gap-x-[2.5rem] gap-y-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center content-center gap-x-[0.75rem] gap-y-[0.5rem]">
          {!hideAdvancedFilters ? (
            <>
              {renderSingleFilter(
                "Campaign Type",
                filters["Campaign Type"],
                CAMPAIGN_TYPE_OPTIONS,
                (value) =>
                  setFilters((prev) => ({ ...prev, "Campaign Type": value }))
              )}

              <div className={["inline-flex max-w-full items-center justify-center gap-[0.25rem] whitespace-nowrap", labelTextCls].join(" ")}>
                <span>Category</span>

                <Combobox
                  multiple
                  open={categoryOpen}
                  onOpenChange={(open) => {
                    setCategoryOpen(open);
                    if (!open) setCategorySearch("");
                  }}
                  value={filters.Category}
                  onValueChange={handleCategoryChange}
                >
                  <ComboboxTrigger className={[...pillTriggerBase, triggerBgMulti(filters.Category)].join(" ")}>
                    <span className="max-w-[10rem] truncate">{categoryTriggerText}</span>
                    <CaretDown className="h-3 w-3" weight="bold" />
                  </ComboboxTrigger>

                  <ComboboxContent
                    className="min-w-[16rem]"
                    showSearch
                    searchPlaceholder="Search category..."
                    searchInputProps={{
                      value: categorySearch,
                      onChange: (event) =>
                        setCategorySearch((event.target as HTMLInputElement).value),
                    }}
                  >
                    <ComboboxList>
                      <ComboboxItem
                        value="All"
                        showCheckbox
                        className={[itemNoTickNeutralSelectedCls, itemSelectedBgUnlessAll("All")].join(" ")}
                      >
                        All
                      </ComboboxItem>

                      {filteredCategoryOptions.map((option) => (
                        <ComboboxItem
                          key={option.value}
                          value={option.value}
                          showCheckbox
                          className={[itemNoTickNeutralSelectedCls, itemSelectedBgUnlessAll(option.value)].join(" ")}
                        >
                          {option.label}
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>

              {renderSingleFilter(
                "Invitation Date",
                filters["Invitation Date"],
                INVITATION_DATE_OPTIONS,
                (value) =>
                  setFilters((prev) => ({ ...prev, "Invitation Date": value }))
              )}

              {renderSingleFilter("Budget", filters.Budget, BUDGET_OPTIONS, (value) =>
                setFilters((prev) => ({ ...prev, Budget: value }))
              )}

              {renderSingleFilter(
                "Applied Status",
                filters["Applied Status"],
                APPLIED_STATUS_OPTIONS,
                (value) =>
                  setFilters((prev) => ({ ...prev, "Applied Status": value }))
              )}

              {renderSingleFilter("Date", filters.Date, DATE_OPTIONS, (value) =>
                setFilters((prev) => ({ ...prev, Date: value }))
              )}

              <div className={["inline-flex max-w-full items-center justify-center gap-[0.25rem] whitespace-nowrap", labelTextCls].join(" ")}>
                <span>Platform</span>

                <Combobox
                  multiple
                  value={filters.Platform}
                  onValueChange={(next) =>
                    setFilters((prev) => ({
                      ...prev,
                      Platform: normalizeMulti(next),
                    }))
                  }
                >
                  <ComboboxTrigger className={[...pillTriggerBase, "overflow-visible", triggerBgMulti(filters.Platform)].join(" ")}>
                    {platformTriggerNode}
                    <CaretDown className="h-3 w-3" weight="bold" />
                  </ComboboxTrigger>

                  <ComboboxContent className="min-w-[14rem]">
                    <ComboboxList>
                      {PLATFORM_OPTIONS.map((option) => (
                        <ComboboxItem
                          key={option.value}
                          value={option.value}
                          className={[itemNoTickNeutralSelectedCls, itemSelectedBgUnlessAll(option.value)].join(" ")}
                        >
                          <span className="inline-flex items-center">
                            {option.icon ? (
                              <img src={option.icon} alt="" className="h-4 w-4" />
                            ) : null}

                            <span className={option.icon ? "ml-[0.5rem]" : ""}>
                              {option.label}
                            </span>
                          </span>
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>

              <button
                type="button"
                onClick={clearAll}
                disabled={!hasAnyApplied && !search}
                className={[
                  "inline-flex cursor-pointer items-center gap-[0.25rem] rounded-[var(--Border-Radius-S,0.5rem)]",
                  "bg-transparent px-2 py-1 hover:bg-[var(--Light-Background-Neutral,#F2F2F2)]",
                  "whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50",
                  labelTextCls,
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
              "flex h-10 w-[18rem] max-w-[40vw] items-center justify-between px-2",
              "rounded-[0.75rem] border border-[var(--Light-Border-Subtle,#E6E6E6)] bg-white",
            ].join(" ")}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <MagnifyingGlass className="h-4 w-4 shrink-0" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
                className={[
                  "w-full min-w-0 bg-transparent outline-none",
                  "text-left font-[var(--Font-Family-Inter,Inter)] text-[var(--Font-Size-14,0.875rem)]",
                  "font-[var(--Font-Weight-Semi-Bold,600)] leading-[var(--Line-Height-20,1.25rem)]",
                  "text-[var(--Light-Border-Selected,#1A1A1A)] placeholder:text-[var(--Light-Border-Selected,#1A1A1A)] placeholder:opacity-60",
                ].join(" ")}
              />
            </div>
          </div>

          <div
            className={[
              "flex h-10 w-[11.5rem] items-center gap-[0.25rem] px-2",
              "rounded-[var(--Border-Radius-S,0.5rem)] border border-[var(--Light-Border-Subtle,#E6E6E6)] bg-white",
            ].join(" ")}
          >
            <span className="whitespace-nowrap text-[0.75rem] leading-4 text-[var(--Light-Text-Primary,#1A1A1A)]">
              Sort :
            </span>

            <Combobox value={sortValue} onValueChange={(next) => setSortValue?.(String(next))}>
              <ComboboxTrigger
                className={[
                  "relative group flex min-w-0 flex-1 cursor-pointer items-center justify-between overflow-visible bg-transparent",
                  "[&_[data-slot=combobox-trigger-icon]]:hidden",
                ].join(" ")}
              >
                <span
                  className="truncate text-center font-[var(--Font-Family-Inter,Inter)] text-[0.875rem] font-medium leading-[1.25rem] text-[var(--Light-Text-Primary,#1A1A1A)]"
                  title={sortValue}
                >
                  {sortValue}
                </span>

                <CaretDown className="ml-[1rem] h-3 w-3 shrink-0" weight="bold" />
              </ComboboxTrigger>

              <ComboboxContent className="min-w-[16rem]">
                <ComboboxList>
                  {INVITATION_SORT_OPTIONS.map((option) => (
                    <ComboboxItem
                      key={option}
                      value={option}
                      className={[itemNoTickNeutralSelectedCls, itemSelectedBgUnlessAll(option)].join(" ")}
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
  );
}
