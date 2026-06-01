"use client";

import * as React from "react";
import {
  CaretDownIcon,
  FunnelSimpleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import { MoreFiltersDropdown } from "../browse-influencer/MoreFiltersDropdown";

type CampaignOption = {
  id: string;
  label: string;
  folderId?: string;
  queryCampaignId?: string;
  type?: string;
  isFullyManaged?: boolean;
  goodFitCount?: number;
};

type CategoryOption = {
  id: string;
  label: string;
};

type DateFilterValue =
  | "all"
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_30_days"
  | "this_month"
  | "last_month";

type MoreFiltersState = {
  search?: {
    mode?: string;
  };
  influencer?: {
    tier?: string;
    isVerified?: boolean;
    ageMin?: number;
    ageMax?: number;
    gender?: string;
  };
  platform?: Record<
    string,
    {
      followersMin?: number;
      followersMax?: number;
    }
  >;
  audience?: {
    country?: string;
  };
};

type CreatorHubFiltersProps = {
  selectedCampaignId: string;
  setSelectedCampaignId: React.Dispatch<React.SetStateAction<string>>;

  selectedCategoryId: string;
  setSelectedCategoryId: React.Dispatch<React.SetStateAction<string>>;

  selectedDateFilter: DateFilterValue;
  setSelectedDateFilter: React.Dispatch<React.SetStateAction<DateFilterValue>>;

  categoryOptions: CategoryOption[];
  categoryLoading: boolean;

  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  setDebouncedSearch: React.Dispatch<React.SetStateAction<string>>;

  moreFilters: MoreFiltersState;
  updateMoreFilter: (path: string, value: any) => void;
  resetMoreFilters: () => void;

  loading: boolean;

  campaignOptions: CampaignOption[];
  getCampaignOptionLabel: (value: string) => string;

  onCreateFolderClick: () => void;
};

const DATE_FILTER_OPTIONS: Array<{ id: DateFilterValue; label: string }> = [
  { id: "all", label: "All dates" },
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "last_7_days", label: "Last 7 days" },
  { id: "last_30_days", label: "Last 30 days" },
  { id: "this_month", label: "This month" },
  { id: "last_month", label: "Last month" },
];

function hasActiveMoreFilters(filters: MoreFiltersState) {
  const influencer = filters.influencer || {};

  if (
    influencer.tier ||
    typeof influencer.isVerified === "boolean" ||
    typeof influencer.ageMin === "number" ||
    typeof influencer.ageMax === "number" ||
    influencer.gender
  ) {
    return true;
  }

  const audience = filters.audience || {};

  if (audience.country) return true;

  const platform = filters.platform || {};

  return Object.values(platform).some(
    (item) =>
      typeof item?.followersMin === "number" ||
      typeof item?.followersMax === "number"
  );
}

function FilterCombobox({
  label,
  value,
  items,
  getItemLabel,
  onChange,
  placeholder = "Select",
  emptyText = "No options found.",
  minWidth = 120,
  searchable = true,
}: {
  label: string;
  value: string;
  items: string[];
  getItemLabel: (value: string) => string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  minWidth?: number;
  searchable?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const filteredItems = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return items;

    return items.filter((item) =>
      getItemLabel(item).toLowerCase().includes(q)
    );
  }, [getItemLabel, items, query]);

  const selectedLabel = getItemLabel(value) || placeholder;

  return (
    <label className="inline-flex h-9 items-center gap-2 text-xs text-[#111111]">
      <span className="shrink-0">{label}</span>

      <Combobox
        items={filteredItems}
        value={value}
        open={open}
        onOpenChange={setOpen}
        onValueChange={(nextValue) => {
          onChange(String(nextValue || ""));
          setOpen(false);
        }}
      >
        <ComboboxTrigger
          hideIcon
          className="inline-flex h-8 items-center justify-between gap-2 rounded-md bg-[#EFEFEF] px-3 text-xs font-medium text-[#111111]"
          style={{ minWidth }}
        >
          <span className="max-w-[150px] truncate">{selectedLabel}</span>
          <CaretDownIcon size={10} weight="bold" />
        </ComboboxTrigger>

        <ComboboxContent
          className="w-[220px] px-2 py-2"
          showSearch={searchable}
          searchPlaceholder="Search..."
          searchInputProps={
            searchable
              ? {
                  value: query,
                  onChange: (event) =>
                    setQuery((event.target as HTMLInputElement).value),
                }
              : undefined
          }
        >
          <ComboboxEmpty>{emptyText}</ComboboxEmpty>

          <ComboboxList className="max-h-[230px] px-0">
            {(item) => (
              <ComboboxItem
                key={item}
                value={item}
                showIndicator={false}
                className={value === item ? "bg-[#d9d9d9]" : ""}
              >
                <span className="truncate">{getItemLabel(String(item))}</span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </label>
  );
}

export function CreatorHubFilters({
  selectedCampaignId,
  setSelectedCampaignId,
  selectedCategoryId,
  setSelectedCategoryId,
  selectedDateFilter,
  setSelectedDateFilter,
  categoryOptions,
  categoryLoading,
  search,
  setSearch,
  setDebouncedSearch,
  moreFilters,
  updateMoreFilter,
  resetMoreFilters,
  loading,
  campaignOptions,
  getCampaignOptionLabel,
  onCreateFolderClick,
}: CreatorHubFiltersProps) {
  const [folderComboboxOpen, setFolderComboboxOpen] = React.useState(false);
  const [folderMenuSearch, setFolderMenuSearch] = React.useState("");
  const [filterDropdownOpen, setFilterDropdownOpen] = React.useState(false);

  const filterAnchorRef = React.useRef<HTMLDivElement | null>(null);

  const filteredCampaignOptions = React.useMemo(() => {
    const q = folderMenuSearch.trim().toLowerCase();

    if (!q) return campaignOptions;

    return campaignOptions.filter((campaign) =>
      campaign.label.toLowerCase().includes(q)
    );
  }, [campaignOptions, folderMenuSearch]);

  const selectedCampaignLabel = React.useMemo(() => {
    if (selectedCampaignId === "all") return "All";

    return (
      campaignOptions.find((campaign) => campaign.id === selectedCampaignId)
        ?.label || "All"
    );
  }, [campaignOptions, selectedCampaignId]);

  const folderComboboxItems = React.useMemo(
    () => ["all", ...filteredCampaignOptions.map((campaign) => campaign.id)],
    [filteredCampaignOptions]
  );

  const categoryComboboxItems = React.useMemo(
    () => ["all", ...categoryOptions.map((category) => category.id)],
    [categoryOptions]
  );

  const getCategoryLabel = React.useCallback(
    (value: string) => {
      if (value === "all") {
        return categoryLoading ? "Loading..." : "All categories";
      }

      return (
        categoryOptions.find((category) => category.id === value)?.label ||
        "All categories"
      );
    },
    [categoryLoading, categoryOptions]
  );

  const getDateFilterLabel = React.useCallback((value: string) => {
    return (
      DATE_FILTER_OPTIONS.find((item) => item.id === value)?.label ||
      "All dates"
    );
  }, []);

  const hasAnyFilterSelected = React.useMemo(() => {
    return (
      selectedCampaignId !== "all" ||
      selectedCategoryId !== "all" ||
      selectedDateFilter !== "all" ||
      Boolean(search.trim()) ||
      hasActiveMoreFilters(moreFilters)
    );
  }, [
    selectedCampaignId,
    selectedCategoryId,
    selectedDateFilter,
    search,
    moreFilters,
  ]);

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-5">
        <label className="inline-flex h-9 items-center gap-2 text-xs text-[#111111]">
          <span>Folder</span>

          <Combobox
            items={folderComboboxItems}
            value={selectedCampaignId}
            onValueChange={(value) => {
              setSelectedCampaignId(String(value || "all"));
              setFolderComboboxOpen(false);
            }}
            open={folderComboboxOpen}
            onOpenChange={setFolderComboboxOpen}
          >
            <ComboboxTrigger
              hideIcon
              className="inline-flex h-8 min-w-[120px] items-center justify-between gap-3 rounded-md bg-[#EFEFEF] px-3 text-xs font-medium text-[#111111]"
            >
              <span className="max-w-[140px] truncate">
                {selectedCampaignLabel}
              </span>
              <CaretDownIcon size={10} weight="bold" />
            </ComboboxTrigger>

            <ComboboxContent
              className="w-[220px] px-2 py-2"
              showSearch
              searchPlaceholder="Search folder..."
              searchInputProps={{
                value: folderMenuSearch,
                onChange: (event) =>
                  setFolderMenuSearch((event.target as HTMLInputElement).value),
              }}
            >
              <ComboboxEmpty>No folders found.</ComboboxEmpty>

              <ComboboxList className="max-h-[230px] px-0">
                {(item) => (
                  <ComboboxItem
                    key={item}
                    value={item}
                    showIndicator={false}
                    className={selectedCampaignId === item ? "bg-[#d9d9d9]" : ""}
                  >
                    <span className="truncate">
                      {getCampaignOptionLabel(String(item))}
                    </span>
                  </ComboboxItem>
                )}
              </ComboboxList>

              <ComboboxSeparator />

              <button
                type="button"
                onClick={() => {
                  setFolderComboboxOpen(false);
                  onCreateFolderClick();
                }}
                className="flex h-8 w-full items-center rounded-lg bg-[#EFEFEF] px-2 text-left text-sm font-medium text-[#111111] hover:bg-[#E4E4E4]"
              >
                + Add folder
              </button>
            </ComboboxContent>
          </Combobox>
        </label>

        <FilterCombobox
          label="Category"
          value={selectedCategoryId}
          items={categoryComboboxItems}
          getItemLabel={getCategoryLabel}
          onChange={(value) => setSelectedCategoryId(value || "all")}
          placeholder="All categories"
          emptyText="No categories found."
          minWidth={150}
        />

        <FilterCombobox
          label="Date"
          value={selectedDateFilter}
          items={DATE_FILTER_OPTIONS.map((item) => item.id)}
          getItemLabel={getDateFilterLabel}
          onChange={(value) =>
            setSelectedDateFilter((value || "all") as DateFilterValue)
          }
          placeholder="All dates"
          emptyText="No date filters found."
          minWidth={135}
          searchable={false}
        />

        {hasAnyFilterSelected ? (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setDebouncedSearch("");
              setSelectedCampaignId("all");
              setSelectedCategoryId("all");
              setSelectedDateFilter("all");
              setFolderMenuSearch("");
              resetMoreFilters();
            }}
            className="inline-flex h-8 items-center gap-1 rounded-md bg-[#EDEDED] px-3 text-xs font-medium text-[#333333] hover:bg-[#E3E3E3]"
          >
            Clear
            <XIcon size={12} weight="bold" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search"
            className="h-9 w-[230px] rounded-md border border-[#DCDCDC] bg-white px-3 pr-9 text-sm outline-none placeholder:text-[#777777] focus:border-black"
          />

          <MagnifyingGlassIcon
            size={16}
            weight="regular"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C5C5C]"
          />
        </div>

        <div ref={filterAnchorRef} className="relative">
          <button
            type="button"
            onClick={() => setFilterDropdownOpen((prev) => !prev)}
            className="inline-flex h-9 min-w-[110px] items-center justify-between rounded-md border border-[#DCDCDC] bg-white px-3 text-sm text-[#111111] hover:bg-[#F7F7F7]"
          >
            <span className="inline-flex items-center gap-2">
              <FunnelSimpleIcon size={16} weight="regular" />
              Filters
            </span>
            <CaretDownIcon size={12} weight="bold" />
          </button>

          <MoreFiltersDropdown
            open={filterDropdownOpen}
            onClose={() => setFilterDropdownOpen(false)}
            anchorRef={filterAnchorRef}
            filters={moreFilters as any}
            updateFilter={updateMoreFilter}
            onReset={resetMoreFilters}
            onApply={() => setFilterDropdownOpen(false)}
            loading={loading}
          />
        </div>

        <button
          type="button"
          onClick={onCreateFolderClick}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-[#171717] px-4 text-[12px] font-medium text-white shadow-sm hover:bg-black"
        >
          <PlusIcon size={16} weight="bold" />
          Create folder
        </button>
      </div>
    </div>
  );
}