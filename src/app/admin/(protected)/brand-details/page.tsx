"use client";

import { useState } from "react";
import { post } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type BadgeColor = "violet" | "amber" | "teal" | "rose" | "sky";

type MaturityStage = "Growth" | "Startup" | "Mature" | "Declining";

interface BrandData {
  _id: string;
  normalized_brand_name: string;
  input_brand_name: string;
  brand_name: string | null;
  brand_alias: string | null;
  brand_description: string | null;
  brand_category: string | null;
  brand_maturity: MaturityStage | string | null;
  industry: string | null;
  sub_industry: string | null;
  company_type: string | null;
  business_model: string | null;
  company_size_category: string | null;
  employee_count: number | null;
  founded_year: number | null;
  funding_stage: string | null;
  funding_total: number | null;
  valuation: number | null;
  profitability_status: string | null;
  annual_revenue: number | null;
  last_year_revenue: number | null;
  last_year_revenue_year: number | null;
  revenue_range: string | null;
  growth_rate: number | null;
  website_traffic_monthly: number | null;
  app_downloads: number | null;
  headquarters_city: string | null;
  headquarters_state: string | null;
  headquarters_country: string | null;
  primary_contact_name: string | null;
  contact_designation: string | null;
  contact_department: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  youtube_url: string | null;
  youtube_subscribers: number | null;
  instagram_followers: number | null;
  instagram_engagement_rate: number | null;
  logo_url: string | null;
  operating_regions: string[] | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: BrandData;
}

interface FieldDef {
  key: keyof BrandData;
  label: string;
  wide?: boolean;
  isLink?: boolean;
}

interface FieldGroup {
  label: string;
  icon: string;
  color: string;
  fields: FieldDef[];
}

// ─── Config ───────────────────────────────────────────────────────────────────

const FIELD_GROUPS: FieldGroup[] = [
  {
    label: "Brand Overview",
    icon: "✦",
    color: "violet",
    fields: [
      { key: "brand_name", label: "Brand Name" },
      { key: "brand_alias", label: "Also Known As" },
      { key: "brand_description", label: "Description", wide: true },
      { key: "brand_category", label: "Category" },
      { key: "industry", label: "Industry" },
      { key: "sub_industry", label: "Sub-Industry" },
      { key: "brand_maturity", label: "Maturity Stage" },
      { key: "founded_year", label: "Founded" },
    ],
  },
  {
    label: "Company Profile",
    icon: "◎",
    color: "sky",
    fields: [
      { key: "company_type", label: "Company Type" },
      { key: "business_model", label: "Business Model" },
      { key: "company_size_category", label: "Size (Employees)" },
      { key: "employee_count", label: "Employee Count" },
      { key: "funding_stage", label: "Funding Stage" },
      { key: "funding_total", label: "Total Funding" },
      { key: "valuation", label: "Valuation" },
      { key: "profitability_status", label: "Profitability" },
    ],
  },
  {
    label: "Revenue & Growth",
    icon: "◈",
    color: "teal",
    fields: [
      { key: "annual_revenue", label: "Annual Revenue" },
      { key: "last_year_revenue", label: "Last Year Revenue" },
      { key: "revenue_range", label: "Revenue Range" },
      { key: "growth_rate", label: "Growth Rate" },
      { key: "website_traffic_monthly", label: "Monthly Web Traffic" },
      { key: "app_downloads", label: "App Downloads" },
    ],
  },
  {
    label: "Headquarters",
    icon: "⊕",
    color: "amber",
    fields: [
      { key: "headquarters_city", label: "City" },
      { key: "headquarters_state", label: "State" },
      { key: "headquarters_country", label: "Country" },
    ],
  },
  {
    label: "Contact",
    icon: "◉",
    color: "rose",
    fields: [
      { key: "primary_contact_name", label: "Contact Name" },
      { key: "contact_designation", label: "Designation" },
      { key: "contact_department", label: "Department" },
      { key: "contact_email", label: "Email" },
      { key: "contact_phone", label: "Phone" },
    ],
  },
  {
    label: "Digital Presence",
    icon: "◇",
    color: "violet",
    fields: [
      { key: "website_url", label: "Website", isLink: true },
      { key: "facebook_url", label: "Facebook", isLink: true },
      { key: "instagram_url", label: "Instagram", isLink: true },
      { key: "twitter_url", label: "Twitter / X", isLink: true },
      { key: "linkedin_url", label: "LinkedIn", isLink: true },
      { key: "youtube_url", label: "YouTube", isLink: true },
      { key: "youtube_subscribers", label: "YouTube Subscribers" },
      { key: "instagram_followers", label: "Instagram Followers" },
      { key: "instagram_engagement_rate", label: "Instagram Engagement" },
    ],
  },
];

const GROUP_COLORS: Record<
  string,
  { dot: string; title: string; divider: string }
> = {
  violet: { dot: "bg-violet-500", title: "text-violet-600", divider: "bg-violet-100" },
  sky: { dot: "bg-sky-500", title: "text-sky-600", divider: "bg-sky-100" },
  teal: { dot: "bg-teal-500", title: "text-teal-600", divider: "bg-teal-100" },
  amber: { dot: "bg-amber-500", title: "text-amber-600", divider: "bg-amber-100" },
  rose: { dot: "bg-rose-500", title: "text-rose-600", divider: "bg-rose-100" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getValue(data: BrandData, key: keyof BrandData): unknown {
  const val = data[key];
  if (val === null || val === undefined || val === "") return null;
  if (Array.isArray(val)) return val.length ? val : null;
  return val;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ text, color = "violet" }: { text: string; color?: BadgeColor }) {
  const colors: Record<BadgeColor, string> = {
    violet: "bg-violet-100 text-violet-700 ring-violet-200",
    amber: "bg-amber-100 text-amber-700 ring-amber-200",
    teal: "bg-teal-100 text-teal-700 ring-teal-200",
    rose: "bg-rose-100 text-rose-700 ring-rose-200",
    sky: "bg-sky-100 text-sky-700 ring-sky-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${colors[color]}`}
    >
      {text}
    </span>
  );
}

function FieldValue({ value, isLink }: { value: unknown; isLink?: boolean }) {
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {(value as string[]).map((v, i) => (
          <Badge key={i} text={v} color="sky" />
        ))}
      </div>
    );
  }
  if (isLink && typeof value === "string" && value.startsWith("http")) {
    const domain = (() => {
      try {
        return new URL(value).hostname.replace("www.", "");
      } catch {
        return value;
      }
    })();
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-violet-600 hover:text-violet-800 font-medium text-sm transition-colors inline-flex items-center gap-1 group"
      >
        {domain}
        <span className="opacity-50 group-hover:opacity-100 transition-opacity text-xs">
          ↗
        </span>
      </a>
    );
  }
  return (
    <span className="text-gray-800 text-sm font-medium leading-relaxed">
      {String(value)}
    </span>
  );
}

function FieldCard({
  label,
  value,
  wide,
  isLink,
}: {
  label: string;
  value: unknown;
  wide?: boolean;
  isLink?: boolean;
}) {
  return (
    <div
      className={`${
        wide ? "col-span-2" : ""
      } bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col gap-1.5 hover:border-violet-200 hover:bg-violet-50/30 transition-all duration-150`}
    >
      <span className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.14em]">
        {label}
      </span>
      <FieldValue value={value} isLink={isLink} />
    </div>
  );
}

function GroupSection({ group, data }: { group: FieldGroup; data: BrandData }) {
  const visibleFields = group.fields.filter(
    (f: FieldDef) => getValue(data, f.key) !== null
  );
  if (visibleFields.length === 0) return null;

  const c = GROUP_COLORS[group.color] ?? GROUP_COLORS.violet;

  return (
    <div className="mb-9">
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`w-2 h-2 rounded-full ${c.dot} flex-shrink-0`} />
        <span className={`text-[11px] font-black uppercase tracking-[0.18em] ${c.title}`}>
          {group.label}
        </span>
        <div className={`flex-1 h-px ${c.divider} ml-1`} />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {visibleFields.map((f: FieldDef) => (
          <FieldCard
            key={f.key}
            label={f.label}
            value={getValue(data, f.key)}
            wide={f.wide}
            isLink={f.isLink}
          />
        ))}
      </div>
    </div>
  );
}

function MaturityBadge({ stage }: { stage: string | null }) {
  if (!stage) return null;
  const map: Record<MaturityStage, { color: BadgeColor; label: string }> = {
    Growth: { color: "teal", label: "Growth Stage" },
    Startup: { color: "amber", label: "Startup" },
    Mature: { color: "sky", label: "Mature" },
    Declining: { color: "rose", label: "Declining" },
  };
  const config =
    map[stage as MaturityStage] ?? { color: "violet" as BadgeColor, label: stage };
  return <Badge text={config.label} color={config.color} />;
}

function BrandHeader({ data }: { data: BrandData }) {
  const initials = (data.brand_name ?? "?")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-violet-500 to-indigo-500 p-8 mb-6 shadow-xl shadow-violet-200/60">
      <div className="absolute -top-14 -right-14 w-60 h-60 bg-white/5 rounded-full" />
      <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-white/5 rounded-full" />
      <div className="absolute top-6 right-40 w-2 h-2 bg-white/25 rounded-full" />
      <div className="absolute bottom-8 right-24 w-3 h-3 bg-white/15 rounded-full" />

      <div className="relative flex items-start gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center text-white text-2xl font-black tracking-tight">
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1.5">
            <h2 className="text-3xl font-black text-white tracking-tight">
              {data.brand_name}
            </h2>
            <MaturityBadge stage={data.brand_maturity} />
            {data.business_model && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white ring-1 ring-white/30">
                {data.business_model}
              </span>
            )}
          </div>

          {data.industry && (
            <p className="text-violet-100/90 text-sm font-medium mb-3">
              {data.industry}
              {data.sub_industry ? (
                <span className="opacity-70"> · {data.sub_industry}</span>
              ) : null}
            </p>
          )}

          {data.brand_description && (
            <p className="text-white/70 text-sm leading-relaxed max-w-2xl">
              {data.brand_description}
            </p>
          )}

          {Array.isArray(data.operating_regions) &&
            data.operating_regions.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {data.operating_regions.slice(0, 7).map((r: string, i: number) => (
                  <span
                    key={i}
                    className="text-xs bg-white/15 text-white/90 rounded-full px-2.5 py-0.5 border border-white/20 font-medium"
                  >
                    {r}
                  </span>
                ))}
                {data.operating_regions.length > 7 && (
                  <span className="text-xs text-white/50 px-2 py-0.5">
                    +{data.operating_regions.length - 7} more
                  </span>
                )}
              </div>
            )}
        </div>

        {/* Quick stats */}
        <div className="hidden lg:flex flex-col gap-4 text-right flex-shrink-0">
          {data.employee_count != null && (
            <div>
              <div className="text-3xl font-black text-white leading-none">
                {data.employee_count.toLocaleString()}
              </div>
              <div className="text-xs text-white/50 uppercase tracking-widest mt-1">
                Employees
              </div>
            </div>
          )}
          {data.founded_year != null && (
            <div>
              <div className="text-xl font-bold text-white/80 leading-none">
                {data.founded_year}
              </div>
              <div className="text-xs text-white/50 uppercase tracking-widest mt-1">
                Founded
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BrandIntelligencePage() {
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<BrandData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState<boolean>(false);

  const handleSearch = async () => {
    const brandName = query.trim();
    if (!brandName) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setSearched(true);

    try {
      const response = (await post("/admins/brand-info", { brandName })) as ApiResponse;
      if (response?.success && response?.data) {
        setResult(response.data);
      } else {
        setError(response?.message ?? "No data returned.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Sticky nav */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center text-white text-[11px] font-black shadow-sm shadow-violet-300">
              BI
            </div>
            <span className="text-gray-900 font-bold text-sm">
              Brand Intelligence
            </span>
          </div>

          {result && (
            <div className="flex-1 flex items-center gap-2 max-w-sm ml-auto">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search another brand…"
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 active:scale-95 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
              >
                {loading ? "…" : "Go"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero — shown before first result */}
        {!result && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center relative">
            {/* Soft background bloom */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
              <div className="w-[700px] h-[320px] bg-gradient-radial from-violet-100 to-transparent rounded-full blur-3xl opacity-70" />
            </div>

            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-600 text-[11px] font-bold uppercase tracking-[0.16em] px-3.5 py-1.5 rounded-full mb-7 ring-1 ring-violet-200">
                <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
                Admin Panel
              </div>

              <h1 className="text-6xl font-black tracking-tight text-gray-900 mb-4 leading-[1.05]">
                Brand{" "}
                <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
                  Intelligence
                </span>
              </h1>
              <p className="text-gray-500 text-[15px] mb-10 max-w-[380px] leading-relaxed mx-auto">
                Search any brand to generate a full profile — company data,
                financials, social presence, and more.
              </p>

              {/* Search pill */}
              <div className="w-full max-w-lg mx-auto">
                <div className="flex gap-2 p-1.5 bg-white rounded-2xl shadow-lg shadow-gray-200/80 border border-gray-100">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      <svg
                        width="15"
                        height="15"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z"
                        />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Enter brand name, e.g. iGarden"
                      className="w-full bg-transparent pl-9 pr-4 py-3 text-gray-800 placeholder-gray-400 text-sm focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={loading || !query.trim()}
                    className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-700 hover:to-indigo-600 active:scale-95 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-violet-200 whitespace-nowrap"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"
                          />
                        </svg>
                        Fetching…
                      </span>
                    ) : (
                      "Search Brand"
                    )}
                  </button>
                </div>

                {searched && error && (
                  <div className="mt-4 flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-left">
                    <span className="text-rose-500 text-base mt-0.5">⚠</span>
                    <p className="text-rose-700 text-sm">{error}</p>
                  </div>
                )}

                {searched && loading && (
                  <p className="mt-4 text-gray-400 text-sm animate-pulse">
                    Generating brand profile — this may take a few seconds…
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div>
            {error && (
              <div className="mb-5 flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                <span className="text-rose-500 mt-0.5">⚠</span>
                <p className="text-rose-700 text-sm">{error}</p>
              </div>
            )}

            <BrandHeader data={result} />

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm shadow-gray-100 p-8">
              {FIELD_GROUPS.map((group) => (
                <GroupSection key={group.label} group={group} data={result} />
              ))}
            </div>

            {/* Meta footer */}
            <div className="mt-5 px-1 flex flex-wrap gap-4 justify-between text-xs text-gray-400">
              <span className="font-mono tracking-tight">ID: {result._id}</span>
              <div className="flex gap-5">
                {result.createdAt && (
                  <span>Generated: {new Date(result.createdAt).toLocaleString()}</span>
                )}
                {result.updatedAt && (
                  <span>Updated: {new Date(result.updatedAt).toLocaleString()}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}