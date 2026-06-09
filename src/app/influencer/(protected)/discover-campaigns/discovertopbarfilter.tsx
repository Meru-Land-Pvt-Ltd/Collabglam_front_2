"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  BellSimple,
  BookOpen,
  CaretDown,
  Lightning,
  MagnifyingGlass,
  X,
} from "@phosphor-icons/react";

type InfluencerTier = "Mega" | "Macro" | "Mid" | "Micro" | "Nano";
type Platform = "youtube" | "instagram" | "tiktok";
type Age = "18-24" | "25-34" | "35-44" | "45+";
type PaymentType = "Milestone" | "Fixed" | "Gifting";
type Gender = "All" | "Male" | "female";

export type DiscoverTopbarFilterState = {
  verifiedOnly: boolean;
  influencerTier: InfluencerTier | "";
  platforms: Platform[];
  age: Age | "";
  paymentType: PaymentType | "";
  gender: Gender;
};

export const EMPTY_DISCOVER_TOPBAR_FILTERS: DiscoverTopbarFilterState = {
  verifiedOnly: false,
  influencerTier: "",
  platforms: [],
  age: "",
  paymentType: "",
  gender: "All",
};

type Props = {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  collapsed?: boolean;
  value?: DiscoverTopbarFilterState;
  onApply?: (filters: DiscoverTopbarFilterState) => void;
  onClear?: () => void;
};

const INFLUENCER_TIERS: InfluencerTier[] = [
  "Mega",
  "Macro",
  "Mid",
  "Micro",
  "Nano",
];

const PLATFORMS: Array<{
  key: Platform;
  label: string;
  icon: string;
}> = [
    {
      key: "youtube",
      label: "YouTube",
      icon: "/logos_youtube-icon.svg",
    },
    {
      key: "instagram",
      label: "Instagram",
      icon: "/skill-icons_instagram.svg",
    },
    {
      key: "tiktok",
      label: "TikTok",
      icon: "/ic_baseline-tiktok.svg",
    },
  ];

const AGE_OPTIONS: Age[] = ["18-24", "25-34", "35-44", "45+"];
const PAYMENT_TYPES: PaymentType[] = ["Milestone", "Fixed", "Gifting"];
const GENDER_OPTIONS: Array<{
  key: Gender;
  label: string;
  icon?: React.ReactNode;
}> = [
    { key: "All", label: "All" },
    { key: "Male", label: "Male", icon: "♂" },
    { key: "female", label: "female", icon: "♀" },
  ];

function SegmentedButton({
  selected,
  children,
  onClick,
  className = "",
}: {
  selected?: boolean;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex h-8 min-w-[4.5rem] items-center justify-center rounded-[0.5rem] px-3",
        "text-[0.75rem] font-semibold leading-[1.25rem]",
        "transition",
        selected
          ? "bg-white text-[#1A1A1A] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
          : "bg-transparent text-[#969696] hover:bg-white/70 hover:text-[#1A1A1A]",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={[
        "relative h-6 w-11 rounded-full border transition",
        checked
          ? "border-[#1A1A1A] bg-[#1A1A1A]"
          : "border-[#E6E6E6] bg-[#F5F5F5]",
      ].join(" ")}
      aria-pressed={checked}
    >
      <span
        className={[
          "absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-sm transition",
          checked ? "left-[1.25rem]" : "left-[0.125rem]",
        ].join(" ")}
      />
    </button>
  );
}

export default function DiscoverTopbarFilter({
  search,
  setSearch,
  collapsed = false,
  value,
  onApply,
  onClear,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const appliedValue = useMemo(
    () => value ?? EMPTY_DISCOVER_TOPBAR_FILTERS,
    [value]
  );

  const [draft, setDraft] =
    useState<DiscoverTopbarFilterState>(appliedValue);

  useEffect(() => {
    if (!open) setDraft(appliedValue);
  }, [appliedValue, open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (wrapperRef.current?.contains(target)) return;

      setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const closeOnScroll = () => {
      setOpen(false);
    };

    window.addEventListener("scroll", closeOnScroll, true);
    window.addEventListener("wheel", closeOnScroll, {
      capture: true,
      passive: true,
    });
    window.addEventListener("touchmove", closeOnScroll, {
      capture: true,
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", closeOnScroll, true);
      window.removeEventListener("wheel", closeOnScroll, {
        capture: true,
      } as EventListenerOptions);
      window.removeEventListener("touchmove", closeOnScroll, {
        capture: true,
      } as EventListenerOptions);
    };
  }, [open]);

  useEffect(() => {
    if (collapsed) {
      setOpen(false);
    }
  }, [collapsed]);

  const togglePlatform = (platform: Platform) => {
    setDraft((prev) => {
      const selected = prev.platforms.includes(platform);

      return {
        ...prev,
        platforms: selected
          ? prev.platforms.filter((item) => item !== platform)
          : [...prev.platforms, platform],
      };
    });
  };

  const handleClear = () => {
    setDraft(EMPTY_DISCOVER_TOPBAR_FILTERS);
    onClear?.();
  };

  const handleApply = () => {
    onApply?.(draft);
    setOpen(false);
  };

  return (
    <section
      className={[
        "w-full overflow-visible border-b border-[var(--Light-Border-Subtle,#E6E6E6)] bg-white",
        "transition-all duration-300 ease-out",
        collapsed ? "max-h-0 opacity-0" : "max-h-[6.5rem] opacity-100",
      ].join(" ")}
    >
      <div
        style={{
          display: "flex",
          padding: collapsed ? "0 2rem" : "1rem 2rem",
          justifyContent: "flex-end",
          alignItems: "flex-start",
          gap: "2.5rem",
          alignSelf: "stretch",
          borderBottom: "1px solid var(--Light-Border-Subtle, #E6E6E6)",
          background: "var(--Light-Background-Primary, #FFF)",
        }}
        className="transition-all duration-300 ease-out"
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            flex: "1 0 0",
          }}
          className="h-[3.5rem]"
        >
          <div
            style={{
              display: "flex",
              padding: "0 1rem",
              justifyContent: "space-between",
              alignItems: "center",
              flex: "1 0 0",
              alignSelf: "stretch",
            }}
            className={[
              "min-w-0 rounded-[var(--Border-Radius-M,0.75rem)]",
              "border border-[var(--Light-Border-Subtle,#E6E6E6)]",
              "bg-[var(--Light-Background-Primary,#FFF)]",
            ].join(" ")}
          >
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search for Brand name, Campaign name, videos ..."
              className={[
                "min-w-0 flex-1 bg-transparent outline-none",
                "text-[0.875rem] font-medium leading-[1.25rem] text-[#1A1A1A]",
                "placeholder:text-[#A3A3A3] placeholder:opacity-100",
              ].join(" ")}
            />

            <MagnifyingGlass
              size={18}
              className="ml-3 shrink-0 text-[#1A1A1A]"
            />
          </div>

          <div ref={wrapperRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              style={{
                display: "flex",
                width: "12rem",
                height: "3.5rem",
                padding: "1.25rem 1rem",
                alignItems: "center",
                gap: "0.5rem",
                borderRadius: "var(--Border-Radius-M, 0.75rem)",
                border: "1px solid var(--Light-Border-Subtle, #E6E6E6)",
                background: "var(--Light-Background-Primary, #FFF)",
              }}
              className="justify-between text-[0.875rem] font-semibold leading-[1.25rem] text-[#1A1A1A] transition hover:bg-[#F5F5F5]"
              aria-expanded={open}
            >
              <span>Filter</span>
              <CaretDown
                size={16}
                weight="bold"
                className={[
                  "transition-transform duration-200",
                  open ? "rotate-180" : "",
                ].join(" ")}
              />
            </button>

            {open ? (
              <div
                style={{
                  display: "flex",
                  width: "44.1875rem",
                  padding: "2rem",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "2.5rem",
                  borderRadius: "1rem",
                  border: "1px solid var(--Neutral-Colors-300, #F1F3F7)",
                  background: "var(--Neutral-Colors-100, #FFF)",
                  boxShadow: "0 7px 20px 0 rgba(25, 33, 61, 0.04)",
                }}
                className="absolute right-0 top-[calc(100%+0.75rem)] z-[100] max-w-[calc(100vw-2rem)]"
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    alignSelf: "stretch",
                  }}
                >
                  <h3
                    style={{
                      color: "var(--Light-Text-Primary, #1A1A1A)",
                      textAlign: "center",
                      fontFamily: "var(--Font-Family-Inter, Inter)",
                      fontSize: "var(--Font-Size-14, 0.875rem)",
                      fontStyle: "normal",
                      fontWeight: "var(--Font-Weight-Semi-Bold, 600)",
                      lineHeight: "var(--Line-Height-20, 1.25rem)",
                      letterSpacing: "var(--Letter-Spacing-0, 0)",
                    }}
                  >
                    Filters
                  </h3>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-[#1A1A1A] transition hover:bg-[#F2F2F2]"
                    aria-label="Close filters"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "0.8125rem",
                    alignSelf: "stretch",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      padding: "0.75rem 0",
                      justifyContent: "space-between",
                      alignItems: "center",
                      alignSelf: "stretch",
                    }}
                  >
                    <span className="text-[0.875rem] font-semibold leading-[1.25rem] text-[#1A1A1A]">
                      Verified Campaigns Only
                    </span>

                    <ToggleSwitch
                      checked={draft.verifiedOnly}
                      onChange={(checked) =>
                        setDraft((prev) => ({
                          ...prev,
                          verifiedOnly: checked,
                        }))
                      }
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      padding: "0.75rem 0",
                      justifyContent: "space-between",
                      alignItems: "center",
                      alignSelf: "stretch",
                    }}
                  >
                    <span className="text-[0.875rem] font-semibold leading-[1.25rem] text-[#1A1A1A]">
                      Influencer Tier
                    </span>

                    <div className="flex rounded-[0.75rem] bg-[#F7F7F7] p-1">
                      {INFLUENCER_TIERS.map((tier) => (
                        <SegmentedButton
                          key={tier}
                          selected={draft.influencerTier === tier}
                          onClick={() =>
                            setDraft((prev) => ({
                              ...prev,
                              influencerTier: tier,
                            }))
                          }
                        >
                          {tier}
                        </SegmentedButton>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      padding: "0.75rem 0",
                      justifyContent: "space-between",
                      alignItems: "center",
                      alignSelf: "stretch",
                    }}
                  >
                    <span className="text-[0.875rem] font-semibold leading-[1.25rem] text-[#1A1A1A]">
                      Platform
                    </span>

                    <div className="flex items-center gap-2">
                      {PLATFORMS.map((platform) => {
                        const selected = draft.platforms.includes(platform.key);

                        return (
                          <button
                            key={platform.key}
                            type="button"
                            onClick={() => togglePlatform(platform.key)}
                            title={platform.label}
                            style={{
                              display: "flex",
                              width: "2rem",
                              height: "2rem",
                              padding: "0.5rem",
                              justifyContent: "center",
                              alignItems: "center",
                              gap: "0.625rem",
                              aspectRatio: "1 / 1",
                              borderRadius: "2.5rem",
                              border:
                                "var(--Border-Width-S, 1px) solid var(--Light-Border-Subtle, #E6E6E6)",
                              background:
                                "var(--Light-Background-Primary, #FFF)",
                            }}
                            className={[
                              "transition",
                              selected
                                ? "ring-2 ring-[#1A1A1A]"
                                : "hover:bg-[#F5F5F5]",
                            ].join(" ")}
                          >
                            <img
                              src={platform.icon}
                              alt={platform.label}
                              className="h-4 w-4 object-contain"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      padding: "0.75rem 0",
                      justifyContent: "space-between",
                      alignItems: "center",
                      alignSelf: "stretch",
                    }}
                  >
                    <span className="text-[0.875rem] font-semibold leading-[1.25rem] text-[#1A1A1A]">
                      Age
                    </span>

                    <div className="flex rounded-[0.75rem] bg-[#F7F7F7] p-1">
                      {AGE_OPTIONS.map((age) => (
                        <SegmentedButton
                          key={age}
                          selected={draft.age === age}
                          onClick={() =>
                            setDraft((prev) => ({
                              ...prev,
                              age,
                            }))
                          }
                        >
                          {age}
                        </SegmentedButton>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      padding: "0.75rem 0",
                      justifyContent: "space-between",
                      alignItems: "center",
                      alignSelf: "stretch",
                    }}
                  >
                    <span className="text-[0.875rem] font-semibold leading-[1.25rem] text-[#1A1A1A]">
                      Payment Type
                    </span>

                    <div className="flex rounded-[0.75rem] bg-[#F7F7F7] p-1">
                      {PAYMENT_TYPES.map((paymentType) => (
                        <SegmentedButton
                          key={paymentType}
                          selected={draft.paymentType === paymentType}
                          onClick={() =>
                            setDraft((prev) => ({
                              ...prev,
                              paymentType,
                            }))
                          }
                        >
                          {paymentType}
                        </SegmentedButton>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      padding: "0.75rem 0",
                      justifyContent: "space-between",
                      alignItems: "center",
                      alignSelf: "stretch",

                    }}
                  >
                    <span className="text-[0.875rem] font-semibold leading-[1.25rem] text-[#1A1A1A]">
                      Gender
                    </span>

                    <div className="flex rounded-[0.75rem] bg-[#F7F7F7] p-1">
                      {GENDER_OPTIONS.map((gender) => (
                        <SegmentedButton
                          key={gender.key}
                          selected={draft.gender === gender.key}
                          onClick={() =>
                            setDraft((prev) => ({
                              ...prev,
                              gender: gender.key,
                            }))
                          }
                        >
                          <span className="inline-flex items-center gap-1">
                            {gender.label}
                            {gender.icon ? (
                              <span className="text-[0.875rem]">
                                {gender.icon}
                              </span>
                            ) : null}
                          </span>
                        </SegmentedButton>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex w-full justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClear}
                    style={{
                      display: "flex",
                      width: "7rem",
                      height: "2.5rem",
                      justifyContent: "center",
                      alignItems: "center",
                      borderRadius: "var(--Border-Radius-M, 0.75rem)",
                    }}
                    className="text-[0.875rem] font-semibold text-[#1A1A1A] transition hover:bg-[#F2F2F2]"
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    onClick={handleApply}
                    style={{
                      display: "flex",
                      width: "7rem",
                      padding: "0 0.5rem",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "var(--Spacing-4, 0.25rem)",
                      alignSelf: "stretch",
                      borderRadius: "0.75rem",
                    }}
                    className="h-10 bg-[#1A1A1A] text-[0.875rem] font-semibold text-white transition hover:bg-black"
                  >
                    Apply
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}