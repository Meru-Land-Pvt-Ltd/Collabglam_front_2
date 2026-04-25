"use client";

import { useEffect, useState, type ReactNode } from "react";
import api, { post } from "@/lib/api";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react";

// ─── API Endpoints ────────────────────────────────────────────────────────────

const BRAND_INFO_ENDPOINT = "/admins/brand-info";
const BRAND_LIST_ENDPOINT = "/admins/brand-list";

// ─── Types ────────────────────────────────────────────────────────────────────

type BadgeVariant = "purple" | "amber" | "teal" | "rose" | "blue" | "green" | "gray";
type BrandValue = string | number | string[] | null;
type FieldFormat = "text" | "multiline" | "number" | "year" | "currency" | "percent" | "datetime" | "mono";

const CORE_KEYS = [
  "_id", "brand_id", "normalized_brand_name", "input_brand_name", "brand_name",
  "brand_alias", "brand_description", "brand_category", "brand_maturity",
  "industry", "sub_industry", "company_type", "business_model",
  "company_size_category", "employee_count", "founded_year", "funding_stage",
  "funding_total", "valuation", "profitability_status", "annual_revenue",
  "last_year_revenue", "last_year_revenue_year", "revenue_range", "growth_rate",
  "website_traffic_monthly", "app_downloads", "headquarters_city",
  "headquarters_state", "headquarters_country", "public_address",
  "primary_contact_name", "contact_designation", "contact_department",
  "contact_email", "general_email", "support_email", "sales_email",
  "contact_phone", "public_phone", "website_url", "about_page_url",
  "contact_page_url", "domain", "facebook_url", "instagram_url", "twitter_url",
  "linkedin_url", "linkedin_contact_url", "youtube_url", "youtube_subscribers",
  "instagram_followers", "instagram_engagement_rate", "logo_url",
  "operating_regions", "website_pages_scraped", "provider_used",
  "createdAt", "updatedAt", "last_scraped_at",
] as const;

type BrandFieldKey = (typeof CORE_KEYS)[number];

interface RawBrandData {
  _id?: string;
  input_brand_name?: string;
  provider_used?: unknown;
  [key: string]: unknown;
}

type BrandData = Record<BrandFieldKey, BrandValue> & { extras: Record<string, unknown> };

interface ApiResponse {
  success: boolean;
  message?: string;
  provider_used?: string;
  data?: RawBrandData;
}

interface BrandListResponse {
  success: boolean;
  message?: string;
  data?: RawBrandData[];
  pagination?: {
    totalBrands: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface FieldDef {
  key: BrandFieldKey;
  label: string;
  format?: FieldFormat;
  wide?: boolean;
}

interface FieldGroup {
  label: string;
  icon: ReactNode;
  variant: BadgeVariant;
  fields: FieldDef[];
}

// ─── Normalization ────────────────────────────────────────────────────────────

const NA_PATTERNS = [
  "could not be clearly", "not clearly identified", "not publicly disclosed",
  "not been publicly", "could not be confirmed", "could not clearly",
  "cannot be clearly", "was not identified", "not identified", "not disclosed",
  "not available", "not clearly list", "not clearly present",
  "not clearly disclosed", "insufficient", "not stated", "not publicly stated",
  "no reliable", "no sufficiently reliable", "no credible",
  "no publicly verified", "no public", "could not be",
];

function isUnavailable(t: string) {
  return NA_PATTERNS.some((p) => t.toLowerCase().includes(p));
}

function isPresent(v: BrandValue) {
  return v !== null && v !== undefined && !(typeof v === "string" && !v.trim()) && !(Array.isArray(v) && !v.length);
}

function isUrl(v: string) {
  return /^https?:\/\//i.test(v);
}

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(v);
}

function extractUrl(t: string) {
  const m = t.match(/https?:\/\/[^\s,)"'\]]+/i);
  return m ? m[0].replace(/[.,)"'\]]+$/, "") : null;
}

function extractUrls(t: string) {
  return [...new Set((t.match(/https?:\/\/[^\s,)"'\]]+/gi) ?? []).map((u) => u.replace(/[.,)"'\]]+$/, "")))];
}

function extractEmail(t: string) {
  const m = t.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/i);
  return m ? m[0] : null;
}

function extractDomain(t: string) {
  const m = t.match(/(?:https?:\/\/)?(?:www\.)?([a-z0-9.-]+\.[a-z]{2,})/i);
  return m ? m[1].toLowerCase() : null;
}

function extractPhone(t: string) {
  const m = t.match(/[\+]?\d[\d\s().-]{7,}\d/g);
  return m ? m[0].trim() : null;
}

function extractYear(t: string) {
  const m = t.match(/\b(19|20)\d{2}\b/);
  return m ? parseInt(m[0], 10) : null;
}

function extractNumber(t: string) {
  const m = t.replace(/,/g, "").match(/\b\d+(\.\d+)?\b/);
  return m ? Number(m[0]) : null;
}

function extractPercent(t: string) {
  const m = t.match(/\d+(\.\d+)?%/);
  return m ? Number(m[0].replace("%", "")) : null;
}

function extractRegions(t: string) {
  const regions = [
    "United States", "Canada", "United Kingdom", "Europe", "Japan",
    "South Korea", "Australia", "Hong Kong", "India", "Germany",
    "France", "Singapore", "UAE",
  ].filter((x) => t.includes(x));
  return regions.length ? regions : null;
}

function shortText(t: string, max = 160) {
  if (isUnavailable(t)) return null;
  if (t.length <= max) return t;
  const s = t.split(/\.\s/)[0]?.trim();
  return s && s.length <= max ? `${s}.` : t;
}

function normalizeField(key: BrandFieldKey, raw: unknown): BrandValue {
  if (raw === null || raw === undefined) return null;

  if (Array.isArray(raw)) {
    if (key === "website_pages_scraped" || key === "operating_regions") {
      return raw.map(String).filter(Boolean);
    }
    return raw.length ? raw.map(String) : null;
  }

  if (typeof raw === "number") return raw;

  const value = String(raw).trim();
  if (!value) return null;

  switch (key) {
    case "_id":
    case "brand_id":
    case "normalized_brand_name":
    case "input_brand_name":
    case "provider_used":
      return value;

    case "brand_name": {
      const patterns = [
        /brand\s+is\s+([A-Z][a-zA-Z0-9\s-]+?)(?:\.|,|$)/,
        /official brand name.*?is\s+([A-Z][a-zA-Z0-9\s-]+?)(?:\.|,|$)/i,
        /name(?:\s+is)?\s+([A-Z][a-zA-Z0-9\s-]+?)(?:\.|,|$)/,
      ];
      for (const p of patterns) {
        const m = value.match(p);
        if (m?.[1]) return m[1].replace(/^the brand is\s+/i, "").trim();
      }
      return shortText(value, 80);
    }

    case "brand_alias": {
      const m = value.match(/[""]([^""]+)[""]/i);
      return m?.[1] ?? shortText(value, 80);
    }

    case "brand_description":
      return isUnavailable(value) ? null : value;

    case "brand_maturity": {
      const l = value.toLowerCase();
      if (l.includes("very young") || l.includes("early-stage") || l.includes("emerging") || l.includes("startup")) return "Startup";
      if (l.includes("growth")) return "Growth";
      if (l.includes("mature")) return "Mature";
      if (l.includes("declining")) return "Declining";
      return null;
    }

    case "brand_category":
      return value.replace(/^the brand can be categorized as\s*/i, "").replace(/\.$/, "").trim();

    case "industry": {
      const m = value.match(/operates in the (.+?)(?:,|\.|with)/i);
      return m?.[1]?.trim() ?? shortText(value, 120);
    }

    case "sub_industry":
      return value.replace(/^its sub-industry is\s*/i, "").replace(/\.$/, "").trim();

    case "company_type": {
      const l = value.toLowerCase();
      if (l.includes("private")) return "Private Company";
      if (l.includes("public")) return "Public Company";
      return shortText(value, 120);
    }

    case "business_model":
      if (value.toLowerCase().includes("direct-to-consumer") || value.toLowerCase().includes("d2c")) return "D2C + Retail";
      return shortText(value, 140);

    case "company_size_category": {
      const l = value.toLowerCase();
      if (l.includes("small business") || l.includes("small team")) return "Small Business";
      if (l.includes("early-stage")) return "Early Stage";
      if (l.includes("startup")) return "Startup";
      if (l.includes("mid")) return "Mid-Size";
      if (l.includes("enterprise") || l.includes("large")) return "Enterprise";
      return shortText(value, 90);
    }

    case "employee_count":
    case "app_downloads":
    case "website_traffic_monthly":
    case "youtube_subscribers":
    case "instagram_followers":
      return isUnavailable(value) ? null : extractNumber(value);

    case "founded_year":
    case "last_year_revenue_year":
      return isUnavailable(value) ? null : extractYear(value);

    case "funding_total":
    case "valuation":
    case "annual_revenue":
    case "last_year_revenue":
      return isUnavailable(value) ? null : extractNumber(value);

    case "growth_rate":
    case "instagram_engagement_rate":
      return isUnavailable(value) ? null : extractPercent(value);

    case "funding_stage": {
      const l = value.toLowerCase();
      if (l.includes("bootstrap") || l.includes("privately held") || l.includes("self-fund")) return "Bootstrapped / Private";
      if (l.includes("seed")) return "Seed";
      if (l.includes("series a")) return "Series A";
      if (l.includes("series b")) return "Series B";
      if (l.includes("public") || l.includes("ipo")) return "Public";
      return shortText(value, 80);
    }

    case "profitability_status": {
      const l = value.toLowerCase();
      if (l.includes("profitable") && !l.includes("not profitable") && !l.includes("unprofitable")) return "Profitable";
      if (l.includes("unprofitable") || l.includes("not profitable")) return "Not Profitable";
      if (l.includes("break-even")) return "Break-Even";
      return isUnavailable(value) ? null : shortText(value, 80);
    }

    case "revenue_range":
      return shortText(value, 120);

    case "headquarters_city": {
      const m = value.match(/(?:places? it in|located in|city of)\s+([A-Z][a-zA-Z\s]+?)(?:,\s*New Territories|,|\.|$)/i);
      return m?.[1]?.trim() ?? shortText(value, 80);
    }

    case "headquarters_state":
      if (value.toLowerCase().includes("new territories")) return "New Territories";
      return shortText(value, 80);

    case "headquarters_country":
      if (value.toLowerCase().includes("hong kong")) return "Hong Kong";
      return shortText(value, 80);

    case "public_address": {
      if (isUnavailable(value)) return null;
      const m = value.match(/(?:address .*? is )(.+?)(?:\.|$)/i);
      return m?.[1]?.trim() ?? value.trim();
    }

    case "primary_contact_name": {
      const m = value.match(/names?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
      return m?.[1] ?? null;
    }

    case "contact_designation": {
      const l = value.toLowerCase();
      if (l.includes("founder")) return "Founder";
      if (l.includes("ceo")) return "CEO";
      if (l.includes("cto")) return "CTO";
      return shortText(value, 80);
    }

    case "contact_department": {
      const l = value.toLowerCase();
      if (l.includes("after-sales") || l.includes("support")) return "Customer Support";
      if (l.includes("marketing")) return "Marketing";
      return shortText(value, 80);
    }

    case "contact_email":
    case "general_email":
    case "support_email":
    case "sales_email":
      return extractEmail(value);

    case "contact_phone":
    case "public_phone":
      return extractPhone(value);

    case "website_url":
    case "about_page_url":
    case "contact_page_url":
    case "facebook_url":
    case "instagram_url":
    case "twitter_url":
    case "linkedin_url":
    case "linkedin_contact_url":
    case "youtube_url":
    case "logo_url":
      return extractUrl(value);

    case "domain":
      return extractDomain(value) ?? shortText(value, 80);

    case "operating_regions":
      return extractRegions(value);

    case "website_pages_scraped": {
      const urls = extractUrls(value);
      return urls.length ? urls : null;
    }

    case "createdAt":
    case "updatedAt":
    case "last_scraped_at":
      return value;

    default:
      return shortText(value, 180);
  }
}

function cleanBrandData(raw: RawBrandData, providerUsed?: string): BrandData {
  const base: Record<string, unknown> = {
    ...raw,
    provider_used: providerUsed ?? raw.provider_used ?? null,
  };

  const result = {} as Record<BrandFieldKey, BrandValue>;

  for (const key of CORE_KEYS) {
    result[key] = normalizeField(key, base[key]);
  }

  if (!result.brand_name && result.input_brand_name) {
    const f = String(result.input_brand_name);
    result.brand_name = f.charAt(0).toUpperCase() + f.slice(1);
  }

  const extras: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(base)) {
    if (!CORE_KEYS.includes(k as BrandFieldKey)) {
      extras[k] = v;
    }
  }

  return { ...result, extras };
}

// ─── Field Groups ─────────────────────────────────────────────────────────────

const FIELD_GROUPS: FieldGroup[] = [
  {
    label: "Brand Overview",
    variant: "purple",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3L3 8l9 5 9-5-9-5Z" />
        <path d="M3 12l9 5 9-5" />
        <path d="M3 16l9 5 9-5" />
      </svg>
    ),
    fields: [
      { key: "brand_name", label: "Brand Name" },
      { key: "brand_alias", label: "Alias" },
      { key: "brand_category", label: "Category" },
      { key: "industry", label: "Industry" },
      { key: "sub_industry", label: "Sub-Industry" },
      { key: "brand_maturity", label: "Maturity" },
      { key: "founded_year", label: "Founded", format: "year" },
    ],
  },
  {
    label: "Company Profile",
    variant: "blue",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
    fields: [
      { key: "company_type", label: "Company Type" },
      { key: "business_model", label: "Business Model" },
      { key: "company_size_category", label: "Size" },
      { key: "employee_count", label: "Employees", format: "number" },
      { key: "provider_used", label: "Data Provider" },
    ],
  },
  {
    label: "Revenue & Funding",
    variant: "teal",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M14 7h7v7" />
      </svg>
    ),
    fields: [
      { key: "annual_revenue", label: "Annual Revenue", format: "currency" },
      { key: "last_year_revenue", label: "Last Year Revenue", format: "currency" },
      { key: "last_year_revenue_year", label: "Revenue Year", format: "year" },
      { key: "revenue_range", label: "Revenue Range" },
      { key: "growth_rate", label: "Growth Rate", format: "percent" },
      { key: "funding_stage", label: "Funding Stage" },
      { key: "funding_total", label: "Total Funding", format: "currency" },
      { key: "valuation", label: "Valuation", format: "currency" },
      { key: "profitability_status", label: "Profitability" },
    ],
  },
  {
    label: "HQ & Contact",
    variant: "rose",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    fields: [
      { key: "headquarters_city", label: "City" },
      { key: "headquarters_state", label: "State / Region" },
      { key: "headquarters_country", label: "Country" },
      { key: "public_address", label: "Address", format: "multiline", wide: true },
      { key: "primary_contact_name", label: "Contact" },
      { key: "contact_designation", label: "Title" },
      { key: "contact_department", label: "Department" },
      { key: "contact_email", label: "Email" },
      { key: "general_email", label: "General Email" },
      { key: "support_email", label: "Support Email" },
      { key: "sales_email", label: "Partnership Email" },
      { key: "contact_phone", label: "Phone" },
      { key: "public_phone", label: "Public Phone" },
    ],
  },
  {
    label: "Digital Presence",
    variant: "amber",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10Z" />
      </svg>
    ),
    fields: [
      { key: "domain", label: "Domain" },
      { key: "website_url", label: "Website" },
      { key: "about_page_url", label: "About Page" },
      { key: "contact_page_url", label: "Contact Page" },
      { key: "instagram_url", label: "Instagram" },
      { key: "twitter_url", label: "X / Twitter" },
      { key: "linkedin_url", label: "LinkedIn" },
      { key: "facebook_url", label: "Facebook" },
      { key: "youtube_url", label: "YouTube" },
      { key: "youtube_subscribers", label: "YT Subscribers", format: "number" },
      { key: "instagram_followers", label: "IG Followers", format: "number" },
      { key: "instagram_engagement_rate", label: "IG Engagement", format: "percent" },
      { key: "website_traffic_monthly", label: "Monthly Traffic", format: "number" },
      { key: "app_downloads", label: "App Downloads", format: "number" },
      { key: "operating_regions", label: "Regions" },
      { key: "website_pages_scraped", label: "Pages Scraped" },
    ],
  },
];

// ─── Variant Styles ───────────────────────────────────────────────────────────

const VS: Record<BadgeVariant, { pill: string; dot: string; label: string }> = {
  purple: { pill: "bg-violet-50 text-violet-600 ring-1 ring-violet-100", dot: "bg-violet-400", label: "text-violet-500" },
  blue: { pill: "bg-sky-50 text-sky-600 ring-1 ring-sky-100", dot: "bg-sky-400", label: "text-sky-500" },
  teal: { pill: "bg-teal-50 text-teal-600 ring-1 ring-teal-100", dot: "bg-teal-400", label: "text-teal-500" },
  rose: { pill: "bg-rose-50 text-rose-600 ring-1 ring-rose-100", dot: "bg-rose-400", label: "text-rose-500" },
  amber: { pill: "bg-amber-50 text-amber-600 ring-1 ring-amber-100", dot: "bg-amber-400", label: "text-amber-500" },
  green: { pill: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100", dot: "bg-emerald-400", label: "text-emerald-500" },
  gray: { pill: "bg-slate-50 text-slate-500 ring-1 ring-slate-100", dot: "bg-slate-300", label: "text-slate-400" },
};

const MATURITY_VARIANT: Record<string, BadgeVariant> = {
  Startup: "amber",
  Growth: "teal",
  Mature: "blue",
  Declining: "rose",
};

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtValue(v: string | number, fmt?: FieldFormat): string {
  if (fmt === "year") return String(v);
  if (fmt === "currency") {
    const n = Number(v);
    if (isNaN(n)) return String(v);
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
    return `$${n.toLocaleString()}`;
  }
  if (fmt === "number") return Number(v).toLocaleString();
  if (fmt === "percent") return `${v}%`;
  if (fmt === "datetime") {
    const d = new Date(String(v));
    return isNaN(d.getTime()) ? String(v) : d.toLocaleString();
  }
  return String(v);
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function Tag({ text, variant = "gray" }: { text: string; variant?: BadgeVariant }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${VS[variant].pill}`}>
      {text}
    </span>
  );
}

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-slate-600"
      title="Copy"
      type="button"
    >
      {copied
        ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
        : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
      }
    </button>
  );
}

function FieldValue({ value, format }: { value: BrandValue | unknown; format?: FieldFormat }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-300 text-sm">—</span>;
  }

  if (Array.isArray(value)) {
    if (!value.length) return <span className="text-slate-300 text-sm">—</span>;
    return (
      <div className="flex flex-wrap justify-end gap-1.5">
        {value.map((item, i) => {
          const t = String(item);
          if (isUrl(t)) {
            return (
              <a
                key={i}
                href={t}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600 transition-colors"
              >
                {new URL(t).hostname.replace("www.", "")}
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7" /><path d="M8 7h9v9" /></svg>
              </a>
            );
          }
          return <Tag key={i} text={t} variant="blue" />;
        })}
      </div>
    );
  }

  if (typeof value === "number") {
    return <span className="text-sm font-semibold text-slate-800">{fmtValue(value, format)}</span>;
  }

  const text = String(value);

  if (isEmail(text)) {
    return (
      <a href={`mailto:${text}`} className="text-sm text-violet-600 hover:text-violet-800 transition-colors break-all">
        {text}
      </a>
    );
  }

  if (isUrl(text)) {
    let label = text;
    try {
      label = new URL(text).hostname.replace("www.", "");
    } catch { }

    return (
      <a
        href={text}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-800 transition-colors"
      >
        {label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7" /><path d="M8 7h9v9" /></svg>
      </a>
    );
  }

  return (
    <span
      className={
        format === "multiline"
          ? "text-sm text-slate-600 leading-6 whitespace-pre-line"
          : "text-sm text-slate-800"
      }
    >
      {format === "multiline" ? text : fmtValue(text, format)}
    </span>
  );
}

function FieldRow({ label, value, format }: { label: string; value: BrandValue | unknown; format?: FieldFormat }) {
  const hasValue = value !== null && value !== undefined && value !== "";

  return (
    <div className="group grid grid-cols-1 gap-1.5 border-b border-slate-50 py-3 last:border-0 md:grid-cols-[140px_1fr] md:items-start hover:bg-slate-50/70 -mx-5 px-5 transition-colors">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 shrink-0 pt-0.5">
        {label}
      </span>
      <div className="flex items-start justify-end min-w-0 gap-1">
        <div className="min-w-0 text-right">
          <FieldValue value={value} format={format} />
        </div>
        {hasValue && typeof value === "string" && !isUrl(value) && !isEmail(value) && (
          <CopyBtn value={String(value)} />
        )}
      </div>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ group, data }: { group: FieldGroup; data: BrandData }) {
  const fields = group.fields.filter((f) => isPresent(data[f.key]));
  if (!fields.length) return null;

  return (
    <div className="rounded-lg border border-slate-100 bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100">
        <span className={VS[group.variant].label}>{group.icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          {group.label}
        </span>
        <span className="ml-auto text-[10px] text-slate-300 tabular-nums">{fields.length}</span>
      </div>
      <div className="px-5">
        {fields.map((f) => (
          <FieldRow key={f.key} label={f.label} value={data[f.key]} format={f.format} />
        ))}
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function BrandHero({ data }: { data: BrandData }) {
  const name = String(data.brand_name ?? data.input_brand_name ?? "Unknown");
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const quickLinks = [
    { label: "Website", v: data.website_url },
    { label: "About", v: data.about_page_url },
    { label: "Contact", v: data.contact_page_url },
    { label: "Support", v: data.support_email },
  ].filter((x) => isPresent(x.v));

  return (
    <div className="rounded-lg bg-slate-900 p-6 text-white">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-sm font-bold shrink-0">
              {initials}
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/35 mb-0.5">Brand Profile</div>
              <h1 className="text-xl font-bold tracking-tight leading-none">{name}</h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {data.brand_maturity && (
              <Tag text={String(data.brand_maturity)} variant={MATURITY_VARIANT[String(data.brand_maturity)] ?? "gray"} />
            )}
            {data.business_model && (
              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold bg-white/10 text-white/70 ring-1 ring-white/10">
                {String(data.business_model)}
              </span>
            )}
            {data.company_type && (
              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold bg-white/10 text-white/70 ring-1 ring-white/10">
                {String(data.company_type)}
              </span>
            )}
            {data.headquarters_country && (
              <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold bg-white/10 text-white/70 ring-1 ring-white/10">
                {String(data.headquarters_country)}
              </span>
            )}
          </div>

          {(data.industry || data.sub_industry) && (
            <p className="text-xs text-white/45 mb-3">
              {data.industry}{data.sub_industry ? ` · ${data.sub_industry}` : ""}
            </p>
          )}

          {data.brand_description && (
            <div className="group/desc mt-3">
              <div
                tabIndex={0}
                className="relative rounded-xl border border-white/8 bg-white/[0.04] px-4 py-3 focus:outline-none"
              >
                <p className="text-sm text-white/55 leading-relaxed line-clamp-3 group-hover/desc:line-clamp-none group-focus-within/desc:line-clamp-none transition-all">
                  {String(data.brand_description)}
                </p>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 rounded-b-xl bg-gradient-to-t from-slate-900/80 to-transparent group-hover/desc:opacity-0 group-focus-within/desc:opacity-0 transition-opacity" />
              </div>
            </div>
          )}

          {quickLinks.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {quickLinks.map((l) => {
                const val = String(l.v);
                const href = isEmail(val) ? `mailto:${val}` : val;
                return (
                  <a
                    key={l.label}
                    href={href}
                    target={isUrl(val) ? "_blank" : undefined}
                    rel={isUrl(val) ? "noreferrer" : undefined}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-medium text-white/65 transition-colors"
                  >
                    {l.label}
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7" /><path d="M8 7h9v9" /></svg>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 lg:w-40 shrink-0">
          {[
            { label: "Founded", val: data.founded_year ? String(data.founded_year) : null },
            { label: "Employees", val: data.employee_count ? Number(data.employee_count).toLocaleString() : null },
            { label: "HQ", val: [data.headquarters_city, data.headquarters_country].filter(Boolean).join(", ") || null },
            { label: "Contact", val: data.primary_contact_name ? String(data.primary_contact_name) : null },
          ].map(({ label, val }) =>
            val ? (
              <div key={label} className="rounded-lg border border-white/8 bg-white/5 px-3 py-2">
                <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/30 mb-0.5">{label}</div>
                <div className="text-sm font-medium text-white/75 leading-tight">{val}</div>
              </div>
            ) : null,
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Search Input ─────────────────────────────────────────────────────────────

function SearchInput({
  query, setQuery, onSearch, loading, compact = false,
}: {
  query: string;
  setQuery: (v: string) => void;
  onSearch: () => void;
  loading: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1 focus-within:border-slate-300 transition-all ${compact ? "" : "max-w-xl w-full"}`}>
      <span className="pl-3 text-slate-400 shrink-0">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      </span>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSearch()}
        placeholder={compact ? "Search another brand…" : "Enter brand name, e.g. Skyrover"}
        className="flex-1 bg-transparent py-2 pr-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
      />
      <button
        onClick={onSearch}
        disabled={loading || !query.trim()}
        type="button"
        className="rounded-lg bg-slate-900 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-40 active:scale-95 transition-all whitespace-nowrap"
      >
        {loading
          ? <span className="flex items-center gap-1.5">
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Searching…
          </span>
          : "Search"
        }
      </button>
    </div>
  );
}

// ─── Brand Listing Card ───────────────────────────────────────────────────────

function BrandListCard({
  brand,
  onOpen,
}: {
  brand: RawBrandData;
  onOpen: (brandName: string) => void;
}) {
  const normalized = cleanBrandData(brand);
  const name = String(normalized.brand_name ?? normalized.input_brand_name ?? "Unknown Brand");
  const subtitle = [normalized.industry, normalized.headquarters_country].filter(Boolean).join(" · ");
  const openValue = String(brand.input_brand_name ?? normalized.input_brand_name ?? name);

  return (
    <button
      type="button"
      onClick={() => onOpen(openValue)}
      className="group w-full border-b border-slate-200 bg-white px-4 py-4 text-left transition-colors hover:bg-slate-50 last:border-b-0"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
            {name
              .split(" ")
              .map((word) => word[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-900">{name}</h3>
            <p className="truncate text-xs text-slate-500">
              {subtitle || "No industry or HQ info"}
            </p>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {normalized.brand_category && (
                <Tag text={String(normalized.brand_category)} variant="purple" />
              )}
              {normalized.brand_maturity && (
                <Tag
                  text={String(normalized.brand_maturity)}
                  variant={MATURITY_VARIANT[String(normalized.brand_maturity)] ?? "gray"}
                />
              )}
              {normalized.domain && (
                <Tag text={String(normalized.domain)} variant="blue" />
              )}
            </div>
          </div>
        </div>

        <span className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M5 12h14" />
            <path d="M13 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BrandIntelligencePage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BrandData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const [brandList, setBrandList] = useState<RawBrandData[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [listPage, setListPage] = useState(1);
  const [listPagination, setListPagination] = useState({
    totalBrands: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 8,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const leftColumnGroups = FIELD_GROUPS.filter((g) =>
    ["Brand Overview", "Revenue & Funding", "Digital Presence"].includes(g.label),
  );

  const rightColumnGroups = FIELD_GROUPS.filter((g) =>
    ["Company Profile", "HQ & Contact"].includes(g.label),
  );

  const fetchBrandProfile = async (brandName: string) => {
    if (!brandName.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const response = (await post(BRAND_INFO_ENDPOINT, { brandName })) as ApiResponse;

      if (response?.success && response?.data) {
        const merged: RawBrandData = {
          ...response.data,
          provider_used: response.provider_used ?? response.data.provider_used,
        };

        setQuery(brandName);
        setResult(cleanBrandData(merged, response.provider_used));
      } else {
        setResult(null);
        setError(response?.message ?? "No data found for this brand.");
      }
    } catch (err: unknown) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBrandList = async (pageNumber: number) => {
    setListLoading(true);
    setListError(null);

    try {
      const res = await api.get(
        `${BRAND_LIST_ENDPOINT}?page=${pageNumber}&limit=8&sortBy=createdAt&order=desc`
      );

      const response = res.data as BrandListResponse;

      if (response?.success) {
        setBrandList(Array.isArray(response.data) ? response.data : []);
        setListPagination(
          response.pagination ?? {
            totalBrands: 0,
            totalPages: 1,
            currentPage: pageNumber,
            limit: 8,
            hasNextPage: false,
            hasPrevPage: pageNumber > 1,
          }
        );
        setListError(null);
      } else {
        setBrandList([]);
        setListError(response?.message ?? "Unable to fetch brand list.");
      }
    } catch (err: unknown) {
      setBrandList([]);
      setListError(err instanceof Error ? err.message : "Unable to fetch brand list.");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchBrandList(listPage);
  }, [listPage]);

  const handleSearch = async () => {
    const brandName = query.trim();
    if (!brandName) return;
    await fetchBrandProfile(brandName);
  };
  const handleRefresh = async () => {
    const brandName =
      query.trim() || String(result?.input_brand_name ?? result?.brand_name ?? "");

    if (!brandName.trim()) return;

    await fetchBrandProfile(brandName);
  };
  const renderBrandListing = () => (
    <div className="mt-10 w-full">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Saved Brands</h2>
          <p className="text-sm text-slate-500">
            Browse existing brands and open any profile instantly.
          </p>
        </div>
        <div className="text-xs font-medium text-slate-400">
          {listPagination.totalBrands} total
        </div>
      </div>

      {listError && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {listError}
        </div>
      )}

      {listLoading ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="h-[72px] animate-pulse border-b border-slate-200 bg-slate-50 last:border-b-0"
            />
          ))}
        </div>
      ) : brandList.length > 0 ? (
        <>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            {brandList.map((brand) => (
              <BrandListCard
                key={String(brand._id ?? brand.brand_id ?? brand.brand_name ?? Math.random())}
                brand={brand}
                onOpen={fetchBrandProfile}
              />
            ))}
          </div>

          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setListPage((prev) => Math.max(prev - 1, 1))}
              disabled={!listPagination.hasPrevPage || listLoading}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <span className="text-sm text-slate-500">
              Page {listPagination.currentPage} of {listPagination.totalPages || 1}
            </span>

            <button
              type="button"
              onClick={() => setListPage((prev) => prev + 1)}
              disabled={!listPagination.hasNextPage || listLoading}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
          No brands found in the listing yet.
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen text-slate-900">
      <header className="static top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="px-5 md:px-8 h-13 flex items-center gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white text-[10px] font-bold">
              BI
            </div>
            <span className="font-semibold text-sm text-slate-800 hidden sm:block">Brand Intelligence</span>
          </div>

          {result && (
            <div className="ml-auto w-full max-w-sm flex items-center gap-4">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading || (!query.trim() && !result?.input_brand_name)}
                className="rounded-lg flex items-center gap-2 border border-slate-200 bg-white px-3.5 py-3.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowsClockwiseIcon/>
                {loading ? "Refreshing..." : "Refresh"}
              </button>
              <SearchInput query={query} setQuery={setQuery} onSearch={handleSearch} loading={loading} compact />
            </div>
          )}
        </div>
      </header>

      <main>
        {!result && (
          <div className="min-h-[68vh] flex flex-col items-center justify-center px-4 py-10">
            <div className="w-full max-w-lg text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-lg font-bold mx-auto mb-5">
                BI
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Brand Intelligence</h1>
              <p className="text-slate-400 text-sm mb-7">
                Search any brand to generate a full profile — company data, financials, and social presence.
              </p>

              <SearchInput query={query} setQuery={setQuery} onSearch={handleSearch} loading={loading} />

              {searched && error && (
                <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-left">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400 shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span className="text-red-600 text-sm">{error}</span>
                </div>
              )}

              {searched && loading && (
                <p className="mt-4 text-slate-400 text-sm animate-pulse">Generating brand profile…</p>
              )}
            </div>

            {/* {renderBrandListing()} */}
          </div>
        )}

        {result && (
          <div className="mt-4">
            <BrandHero data={result} />

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mt-4">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400 shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="text-red-600 text-sm">{error}</span>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-2 mt-4">
              <div className="flex flex-col gap-4">
                {leftColumnGroups.map((group) => (
                  <SectionCard key={group.label} group={group} data={result} />
                ))}
              </div>
              <div className="flex flex-col gap-4">
                {rightColumnGroups.map((group) => (
                  <SectionCard key={group.label} group={group} data={result} />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}