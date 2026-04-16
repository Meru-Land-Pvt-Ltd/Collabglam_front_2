"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { get, post } from "@/lib/api";
import { resolveFileList } from "@/lib/files";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowUpRight, BarChart3, CheckCircle2, ChevronDown, ChevronUp,
  Clock3, FileText, Layers3, Pencil, Plus, RotateCcw, Search,
  TrendingUp, Users2, X, Wallet, Target, Globe, Hash, Calendar,
  Link2, Image as ImageIcon, AlignLeft, ChevronLeft,
} from "lucide-react";
import { HiOutlineRefresh } from "react-icons/hi";

/* =========================  Types  ========================= */
type TabKey = "details" | "applicants" | "deliverables" | "other";
interface ProductImage { name?: string; type?: string; size?: number; dataUrl?: string; url?: string; }
interface CampaignCategory { categoryName?: string; subcategoryName?: string; }
interface GoalDetail { goal?: string; }
interface InfluencerTierDetail { category?: string; value?: string; }
interface ContentFormatDetail { format?: string; }
interface ContentLanguageDetail { name?: string; }
interface PreferredHashtagDetail { tag?: string; }
interface TargetCountryDetail { countryName?: string; flag?: string; }
interface TargetAgeRangeDetail { range?: string; }
interface CreatedBy { name?: string; email?: string; role?: string; adminRole?: string; }
interface CampaignData {
  _id?: string; campaignId?: string; brandId?: string; brandName?: string;
  campaignTitle?: string; name?: string; description?: string; campaignType?: string;
  campaignCategory?: string; campaignSubcategory?: string; productImages?: ProductImage[];
  images?: string[]; productLink?: string; videoLink?: string; productServiceInfo?: string[];
  numberOfInfluencers?: number; minFollowers?: number; maxFollowers?: number;
  campaignBudget?: number; budget?: number; influencerBudget?: number; paymentType?: string;
  platformSelection?: string[]; additionalNotes?: string; hashtags?: string[];
  campaignTimezone?: string; scheduledAt?: string | null; startAt?: string; endAt?: string;
  publishedAt?: string; endedAt?: string | null; categories?: CampaignCategory[];
  status?: string; publishStatus?: string; approvalMode?: string; isActive?: number;
  isDraft?: number; applicantCount?: number; hasApplied?: number; byAi?: number;
  createdBy?: CreatedBy; createdAt?: string; updatedAt?: string;
  subcategoryDetails?: { name?: string; categoryName?: string }[];
  campaignGoalDetails?: GoalDetail[]; influencerTierDetails?: InfluencerTierDetail[];
  contentFormatDetails?: ContentFormatDetail[]; contentLanguageDetails?: ContentLanguageDetail[];
  preferredHashtagDetails?: PreferredHashtagDetail[]; targetCountryDetails?: TargetCountryDetail[];
  targetAgeRangeDetails?: TargetAgeRangeDetail[];
}
interface ApiResponse { message?: string; data?: CampaignData; }
type AddFundsResponse = {
  brandId: string; campaignId: string; campaignMongoId?: string; addedAmount: number;
  currency: string;
  wallet: { walletBalance: number; frozenBalance: number; usableBalance: number; };
  campaignFreeze: {
    brandId: string; campaignId: string; totalFrozenAmount: number; currentFrozenAmount: number;
    totalAllocatedAmount: number; totalReleasedAmount: number; availableToAllocate: number;
    influencerAllocations: Array<{ influencerId: string; amount: number; releasedAmount: number }>;
  };
};
type Meta = { total?: number; page?: number; limit?: number; totalPages?: number; };
type BreakdownItem = { code?: string; name?: string; weight?: number; };
interface InfluencerApplicant {
  influencerId?: string; name?: string; primaryPlatform?: string; platform?: string;
  handle?: string; category?: string; categoryIds?: string[]; audienceSize?: number;
  engagementRate?: number; influencerTierResolved?: string; createdAt?: string; appliedAt?: string;
  isShortlisted?: number; isUndicided?: number; isUndecided?: number; isRejected?: number;
  statusBrand?: string; statusInfluencer?: string; brandStatus?: string; influencerStatus?: string;
  isInvited?: number; isActive?: number; isCompleted?: number; lifecycleStatus?: string | null;
  lifecycleStatusRaw?: string | null; isFinalUpdate?: boolean; contractId?: string;
  modashProfile?: {
    provider?: string;
    picture?: string;
    fullname?: string;
    username?: string;
    audience?: { notable?: number; genders?: BreakdownItem[]; geoCountries?: BreakdownItem[]; ages?: BreakdownItem[]; languages?: BreakdownItem[]; };
  };
}
type ApplicantStatusCounts = { total?: number; applied?: number; active?: number; shortlisted?: number; undecided?: number; rejected?: number; invited?: number; completed?: number; };
type ApplyListResponse = { meta?: Meta; influencers?: InfluencerApplicant[]; applicantCount?: number; statusCounts?: ApplicantStatusCounts; appliedFilters?: { sortField?: string; sortOrder?: number }; isContracted?: number; contractId?: string; };
type UrlItem = { label?: string; url?: string; };
type ReviewStatus = "pending" | "approved" | "revision";
type DeliverableApi = { _id?: string; id?: string; delieverableApprovalId?: string; deliverableApprovalId?: string; campaignId?: string; influencerId?: string; influencerHandle?: string; username?: string; influencerName?: string; milestoneTitle?: string; influencer?: { influencerId?: string; name?: string; username?: string; fullName?: string }; title?: string; description?: string; url?: UrlItem[]; status?: string; comments?: string; reason?: string; createdAt?: string; updatedAt?: string; };
type DeliverableRow = { rowKey: string; deliverableId: string; influencerName: string; title: string; description: string; milestoneTitle: string; draftLabel: string; linkUrl: string; status: ReviewStatus; reason: string; submittedAt: string; updatedAt?: string; };

/* =========================  Utils  ========================= */
const formatDate = (iso?: string | null) => { if (!iso) return "—"; const d = new Date(iso); if (Number.isNaN(d.getTime())) return "—"; return d.toLocaleString("en-IN", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); };
const formatDateShort = (iso?: string | null) => { if (!iso) return "—"; const d = new Date(iso); if (Number.isNaN(d.getTime())) return "—"; return d.toLocaleString("en-IN", { month: "short", day: "2-digit", year: "numeric" }); };
const formatMoney = (v?: number | string | null) => { const a = Number(v ?? 0); if (!Number.isFinite(a)) return "—"; return a.toLocaleString("en-US", { maximumFractionDigits: 2 }); };
const formatCompactNumber = (v?: number | string | null) => { const a = Number(v ?? 0); if (!Number.isFinite(a)) return "—"; return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(a); };
const prettify = (v?: string | null) => { if (!v) return "—"; return v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); };
const normalizeUrl = (v?: string | null) => { const s = String(v || "").trim(); if (!s) return ""; return s.startsWith("http") ? s : `https://${s}`; };
const toPercentNumber = (v?: number | null) => { const n = Number(v ?? 0); if (!Number.isFinite(n)) return 0; return n <= 1 ? n * 100 : n; };
const formatPercent = (v?: number | null) => `${toPercentNumber(v).toFixed(2)}%`;
const toReviewStatus = (v: any): ReviewStatus => { const s = String(v || "pending").toLowerCase(); if (s === "approved") return "approved"; if (["revision", "changes", "changes_needed", "changes needed"].includes(s)) return "revision"; return "pending"; };

function normalizePlatform(p?: string | null) {
  const n = String(p || "").trim().toLowerCase();
  if (!n) return "";
  if (n.includes("insta")) return "instagram";
  if (n.includes("you")) return "youtube";
  if (n.includes("tik")) return "tiktok";
  return n;
}

function getPlatformIcon(p?: string | null) {
  const n = normalizePlatform(p);
  return n === "instagram" ? "/skill-icons_instagram.svg" : n === "youtube" ? "/logos_youtube-icon.svg" : n === "tiktok" ? "/ic_baseline-tiktok.svg" : null;
}

function getInitials(name?: string | null) {
  return String(name || "—").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "—";
}

function getApplicantAvatarUrl(inf: InfluencerApplicant) {
  return inf.modashProfile?.picture || null;
}

const ApplicantAvatar = ({ applicant, size = "h-9 w-9", ring = "ring-2 ring-white" }: { applicant: InfluencerApplicant; size?: string; ring?: string }) => {
  const src = getApplicantAvatarUrl(applicant);
  const alt = applicant.name || applicant.handle || "Applicant";

  if (src) {
    return <img src={src} alt={alt} className={`${size} rounded-full object-cover bg-stone-100 ${ring}`} />;
  }

  return (
    <div className={`${size} ${ring} rounded-full bg-stone-200 text-[11px] font-semibold text-stone-700 flex items-center justify-center`} aria-label={alt} title={alt}>
      {getInitials(applicant.name || applicant.handle)}
    </div>
  );
};

const ApplicantAvatarStack = ({ applicants }: { applicants: InfluencerApplicant[] }) => {
  const visible = applicants.filter((item) => item.name || item.handle).slice(0, 4);
  if (!visible.length) return null;

  return (
    <div className="flex -space-x-2">
      {visible.map((item, index) => (
        <ApplicantAvatar
          key={`${item.influencerId || item.handle || item.name || "applicant"}-${index}`}
          applicant={item}
          size="h-7 w-7"
          ring="ring-2 ring-white"
        />
      ))}
    </div>
  );
};

function getApplicantStatusMeta(inf: InfluencerApplicant) {
  if (inf.isCompleted === 1) return { label: "Completed", dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" };
  if (inf.isActive === 1) return { label: "Active", dot: "bg-teal-500", pill: "bg-teal-50 text-teal-700 ring-1 ring-teal-200" };
  if (inf.isShortlisted === 1) return { label: "Shortlisted", dot: "bg-sky-500", pill: "bg-sky-50 text-sky-700 ring-1 ring-sky-200" };
  if (inf.isRejected === 1) return { label: "Rejected", dot: "bg-rose-500", pill: "bg-rose-50 text-rose-700 ring-1 ring-rose-200" };
  if (inf.isInvited === 1) return { label: "Invited", dot: "bg-violet-500", pill: "bg-violet-50 text-violet-700 ring-1 ring-violet-200" };
  if (inf.isUndecided === 1 || inf.isUndicided === 1) return { label: "Undecided", dot: "bg-amber-400", pill: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" };
  return { label: "Applied", dot: "bg-stone-400", pill: "bg-stone-100 text-stone-600 ring-1 ring-stone-200" };
}

function reviewBadge(status: ReviewStatus) {
  if (status === "approved") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  if (status === "revision") return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
  return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
}

function reviewLabel(status: ReviewStatus) {
  return status === "approved" ? "Approved" : status === "revision" ? "Revision" : "Pending";
}

function mapDeliverables(items: DeliverableApi[]): DeliverableRow[] {
  const output: DeliverableRow[] = [];
  for (const item of items || []) {
    const deliverableId = String(item.delieverableApprovalId || item.deliverableApprovalId || item._id || item.id || "");
    if (!deliverableId) continue;
    const influencerName = String(item.influencerName || item.influencer?.fullName || item.influencer?.name || item.username || item.influencerHandle || "—");
    const urls = Array.isArray(item.url) ? item.url : [];
    const base = { deliverableId, influencerName, title: item.title || "Untitled", description: item.description || "", milestoneTitle: item.milestoneTitle || "—", status: toReviewStatus(item.status), reason: item.comments || item.reason || "", submittedAt: item.createdAt || new Date().toISOString(), updatedAt: item.updatedAt };
    if (!urls.length) { output.push({ ...base, rowKey: `${deliverableId}_0`, draftLabel: "Draft", linkUrl: "" }); continue; }
    urls.forEach((u, i) => output.push({ ...base, rowKey: `${deliverableId}_${i}`, draftLabel: u.label || `Draft ${i + 1}`, linkUrl: u.url || "" }));
  }
  return output;
}

function aggregateCountBreakdown(items: string[]) {
  const map = new Map<string, number>();
  items.map((i) => i.trim()).filter(Boolean).forEach((i) => map.set(i, (map.get(i) || 0) + 1));
  const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
  return Array.from(map.entries()).map(([label, count]) => ({ label, count, percent: total ? (count / total) * 100 : 0 })).sort((a, b) => b.count - a.count);
}

function aggregateWeightedBreakdown(applicants: InfluencerApplicant[], extractor: (i: InfluencerApplicant) => BreakdownItem[] | undefined, labelBuilder?: (i: BreakdownItem) => string) {
  const map = new Map<string, number>(); let totalWeight = 0;
  applicants.forEach((a) => {
    const base = Math.max(Number(a.audienceSize || 0), 1);
    (extractor(a) || []).forEach((e) => {
      const label = (labelBuilder ? labelBuilder(e) : e.name || e.code || "").trim();
      const w = Number(e.weight || 0);
      if (!label || !Number.isFinite(w) || w <= 0) return;
      const wv = base * w; map.set(label, (map.get(label) || 0) + wv); totalWeight += wv;
    });
  });
  return Array.from(map.entries()).map(([label, value]) => ({ label, percent: totalWeight ? (value / totalWeight) * 100 : 0 })).sort((a, b) => b.percent - a.percent);
}

/* =========================  Shared UI  ========================= */

/** Underline tab */
const Tab = ({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count?: number }) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      "relative flex items-center gap-1.5 px-1 pb-3 pt-2 text-sm font-medium transition-colors after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:transition-all",
      active
        ? "text-teal-700 after:bg-teal-600"
        : "text-stone-500 hover:text-stone-800 after:bg-transparent",
    ].join(" ")}
  >
    {label}
    {count !== undefined && (
      <span className={`rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums ${active ? "bg-teal-100 text-teal-700" : "bg-stone-100 text-stone-500"}`}>
        {count}
      </span>
    )}
  </button>
);

/** Collapsible section wrapper */
const Section = ({ title, icon, children, defaultOpen = true }: { title: string; icon?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-stone-300 rounded-2xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-[#EDEDED] hover:bg-[#E5E5E5] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-stone-400">{icon}</span>}
          <span className="text-[15px] font-semibold text-stone-800">{title}</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-stone-400" /> : <ChevronDown className="h-4 w-4 text-stone-400" />}
      </button>
      {open && <div className="border-t border-stone-100 px-5 py-4">{children}</div>}
    </div>
  );
};

/** Thin stat row — not a big chip */
const StatRow = ({ items }: { items: { label: string; value: React.ReactNode; accent?: string }[] }) => (
  <div className="grid grid-cols-2 gap-0 divide-x divide-stone-100 sm:grid-cols-4 border border-stone-200 rounded-2xl overflow-hidden bg-white">
    {items.map((item) => (
      <div key={item.label} className="flex flex-col gap-0.5 px-4 py-3.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">{item.label}</span>
        <div className={`text-base font-bold tabular-nums ${item.accent || "text-stone-900"}`}>{item.value}</div>
      </div>
    ))}
  </div>
);

/** Inline definition-list row */
const Def = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 py-2.5 border-b border-stone-100 last:border-0">
    <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-stone-500 shrink-0 pt-px">{label}</dt>
    <dd className="text-sm font-medium text-stone-700 text-right leading-relaxed">{value || "—"}</dd>
  </div>
);

/** Pill badge */
const Pill = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${className || "ring-stone-200 bg-stone-100 text-stone-600"}`}>
    {children}
  </span>
);

/** Mini bar list */
const BarList = ({ items, max = 5 }: { items: { label: string; percent: number; secondary?: string }[]; max?: number }) => (
  <div className="space-y-2.5">
    {items.slice(0, max).map((item) => (
      <div key={item.label}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-stone-700 font-medium truncate max-w-[160px]">{item.label}</span>
          <span className="text-[11px] text-stone-400 ml-2 shrink-0">{item.secondary ?? `${item.percent.toFixed(1)}%`}</span>
        </div>
        <div className="h-1 rounded-full bg-stone-100">
          <div className="h-1 rounded-full bg-teal-500 transition-all" style={{ width: `${Math.min(100, item.percent)}%` }} />
        </div>
      </div>
    ))}
    {!items.length && <p className="text-xs text-stone-400">No data</p>}
  </div>
);

const TagCloud = ({ items }: { items: string[] }) => {
  if (!items.length) return <p className="text-xs text-stone-400">None specified.</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <Pill key={`${item}-${i}`} className="ring-stone-200 bg-stone-50 text-stone-600">{item}</Pill>
      ))}
    </div>
  );
};

/* =========================  Main Page  ========================= */

export default function ViewCampaignPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canEditCampaigns, setCanEditCampaigns] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [isFundsModalOpen, setIsFundsModalOpen] = useState(false);

  const [fundAmount, setFundAmount] = useState("");
  const [fundNote, setFundNote] = useState("");
  const [addingFunds, setAddingFunds] = useState(false);
  const [fundingSummary, setFundingSummary] = useState<AddFundsResponse | null>(null);

  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [applicantError, setApplicantError] = useState<string | null>(null);
  const [applicantMeta, setApplicantMeta] = useState<Meta | null>(null);
  const [applicantCount, setApplicantCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState<ApplicantStatusCounts>({});
  const [isContracted, setIsContracted] = useState(0);
  const [topLevelContractId, setTopLevelContractId] = useState("");
  const [applicants, setApplicants] = useState<InfluencerApplicant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [applicantPage, setApplicantPage] = useState(1);
  const [applicantLimit, setApplicantLimit] = useState(10);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<-1 | 1>(-1);
  const [applicantStatusFilter, setApplicantStatusFilter] = useState("all");

  const [deliverablesLoading, setDeliverablesLoading] = useState(false);
  const [deliverablesError, setDeliverablesError] = useState<string | null>(null);
  const [deliverables, setDeliverables] = useState<DeliverableRow[]>([]);
  const [deliverableSearch, setDeliverableSearch] = useState("");
  const [deliverableStatusFilter, setDeliverableStatusFilter] = useState<"all" | ReviewStatus>("all");
  const [deliverableInfluencerFilter, setDeliverableInfluencerFilter] = useState("all");

  useEffect(() => {
    try {
      const storedAdmin = JSON.parse(localStorage.getItem("admin") || "{}");
      const permissions = storedAdmin?.permissions ?? storedAdmin?.access ?? [];
      setCanEditCampaigns(Array.isArray(permissions) ? permissions.some((item: any) => String(item?.key || "").toLowerCase().replace(/[\s_-]+/g, "") === "campaigns" && item?.isEdit === true) : false);
    } catch { setCanEditCampaigns(false); }
  }, []);

  useEffect(() => {
    if (!isFundsModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, [isFundsModalOpen]);

  useEffect(() => {
    const timer = window.setTimeout(() => { setDebouncedSearch(searchTerm.trim()); setApplicantPage(1); }, 350);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setApplicantPage(1);
  }, [applicantStatusFilter]);

  const loadCampaign = useCallback(async () => {
    if (!id) { setError("No campaign ID provided."); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const response = await get<ApiResponse | CampaignData>(`/admin/campaign/getById?id=${id}`);
      setCampaign((response as ApiResponse)?.data ?? (response as CampaignData));
    } catch { setError("Failed to load campaign details."); setCampaign(null); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { loadCampaign(); }, [loadCampaign]);

  const effectiveCampaignId = campaign?.campaignId || campaign?._id || id || "";
  const canManageFunds = Boolean(campaign?.brandId && effectiveCampaignId);

  const fetchApplicants = useCallback(async () => {
    if (!effectiveCampaignId) return;
    setApplicantsLoading(true); setApplicantError(null);
    try {
      const { meta: m, influencers: list, applicantCount: cnt, statusCounts: counts, isContracted: contractedFlag, contractId } =
        await post<ApplyListResponse>("apply/list", { campaignId: effectiveCampaignId, page: applicantPage, limit: applicantLimit, search: debouncedSearch, sortField, sortOrder, filterStatus: applicantStatusFilter === "all" ? "" : applicantStatusFilter });
      setApplicantMeta(m || null); setApplicants(Array.isArray(list) ? list : []); setApplicantCount(Number(cnt || 0));
      setStatusCounts(counts || {}); setIsContracted(Number(contractedFlag || 0)); setTopLevelContractId(String(contractId || ""));
    } catch (err: any) {
      setApplicantError(err?.message || "Failed to load applicants."); setApplicants([]); setApplicantMeta(null); setStatusCounts({}); setApplicantCount(0); setIsContracted(0); setTopLevelContractId("");
    } finally { setApplicantsLoading(false); }
  }, [effectiveCampaignId, applicantPage, applicantLimit, debouncedSearch, sortField, sortOrder, applicantStatusFilter]);

  const fetchDeliverables = useCallback(async () => {
    if (!effectiveCampaignId) return;
    setDeliverablesLoading(true); setDeliverablesError(null);
    try {
      const res: any = await get(`/deliverable/campaign/${effectiveCampaignId}`);
      const arr = (Array.isArray(res) && res) || (Array.isArray(res?.data) && res.data) || (Array.isArray(res?.deliverables) && res.deliverables) || (Array.isArray(res?.items) && res.items) || [];
      setDeliverables(mapDeliverables(arr));
    } catch (err: any) { setDeliverables([]); setDeliverablesError(err?.message || "Failed to load deliverables."); }
    finally { setDeliverablesLoading(false); }
  }, [effectiveCampaignId]);

  useEffect(() => { if (activeTab === "applicants") fetchApplicants(); }, [activeTab, fetchApplicants]);
  useEffect(() => { if (activeTab === "deliverables") fetchDeliverables(); }, [activeTab, fetchDeliverables]);

  const handleDownloadContract = async (contractId?: string) => {
    if (!contractId) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "";
      const res = await fetch(`${baseUrl}/contract/viewPdf`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contractId }) });
      if (!res.ok) throw new Error("Could not download contract.");
      const blob = await res.blob(); const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = objectUrl; link.download = "contract.pdf";
      document.body.appendChild(link); link.click(); link.remove(); window.URL.revokeObjectURL(objectUrl);
    } catch (err: any) { window.alert(err?.message || "Failed to download contract."); }
  };

  const handleAddFunds = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!campaign?.brandId || !effectiveCampaignId) { window.alert("Campaign details are incomplete."); return; }
    const amount = Number(fundAmount);
    if (!Number.isFinite(amount) || amount <= 0) { window.alert("Please enter a valid amount greater than 0."); return; }
    setAddingFunds(true);
    try {
      const response = await post<AddFundsResponse>("/admin/campaign/add-funds", { brandId: campaign.brandId, campaignId: effectiveCampaignId, amount, currency: "usd", note: fundNote || "Admin added campaign funds manually" });
      setFundingSummary(response); setFundAmount(""); setFundNote(""); setIsFundsModalOpen(false); await loadCampaign(); window.alert("Funds added successfully.");
    } catch (err: any) { window.alert(err?.message || "Failed to add campaign funds."); }
    finally { setAddingFunds(false); }
  };

  const imageUrls = useMemo(() => {
    const piu = (campaign?.productImages ?? []).map((img) => img.dataUrl || img.url).filter(Boolean) as string[];
    if (piu.length) return piu;
    return resolveFileList(campaign?.images ?? []);
  }, [campaign?.productImages, campaign?.images]);

  const categoryNames = useMemo(() => {
    if (campaign?.subcategoryDetails?.length) return campaign.subcategoryDetails.map((i) => [i.categoryName, i.name].filter(Boolean).join(" › ")).filter(Boolean) as string[];
    return (campaign?.categories ?? []).map((i) => [i.categoryName, i.subcategoryName].filter(Boolean).join(" › ")).filter(Boolean) as string[];
  }, [campaign?.subcategoryDetails, campaign?.categories]);

  const campaignGoals = useMemo(() => (campaign?.campaignGoalDetails ?? []).map((i) => i.goal).filter(Boolean) as string[], [campaign?.campaignGoalDetails]);
  const influencerTiers = useMemo(() => (campaign?.influencerTierDetails ?? []).map((i) => [i.category, i.value].filter(Boolean).join(" · ")).filter(Boolean) as string[], [campaign?.influencerTierDetails]);
  const contentFormats = useMemo(() => (campaign?.contentFormatDetails ?? []).map((i) => i.format).filter(Boolean) as string[], [campaign?.contentFormatDetails]);
  const contentLanguages = useMemo(() => (campaign?.contentLanguageDetails ?? []).map((i) => i.name).filter(Boolean) as string[], [campaign?.contentLanguageDetails]);
  const hashtags = useMemo(() => (campaign?.preferredHashtagDetails ?? []).map((i) => i.tag).filter(Boolean) as string[], [campaign?.preferredHashtagDetails]);
  const countries = useMemo(() => (campaign?.targetCountryDetails ?? []).map((i) => [i.flag, i.countryName].filter(Boolean).join(" ")).filter(Boolean) as string[], [campaign?.targetCountryDetails]);
  const ageRanges = useMemo(() => (campaign?.targetAgeRangeDetails ?? []).map((i) => i.range).filter(Boolean) as string[], [campaign?.targetAgeRangeDetails]);

  const deliverableInfluencers = useMemo(() => Array.from(new Set(deliverables.map((d) => d.influencerName).filter(Boolean))).sort(), [deliverables]);

  const filteredDeliverables = useMemo(() => {
    let list = [...deliverables];
    if (deliverableStatusFilter !== "all") list = list.filter((i) => i.status === deliverableStatusFilter);
    if (deliverableInfluencerFilter !== "all") list = list.filter((i) => i.influencerName === deliverableInfluencerFilter);
    const q = deliverableSearch.trim().toLowerCase();
    if (q) list = list.filter((i) => [i.title, i.description, i.influencerName, i.milestoneTitle, i.status, i.draftLabel].join(" ").toLowerCase().includes(q));
    return list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [deliverables, deliverableStatusFilter, deliverableInfluencerFilter, deliverableSearch]);

  const deliverableStats = useMemo(() => ({
    total: deliverables.length,
    approved: deliverables.filter((i) => i.status === "approved").length,
    pending: deliverables.filter((i) => i.status === "pending").length,
    revision: deliverables.filter((i) => i.status === "revision").length,
  }), [deliverables]);

  const applicantAnalytics = useMemo(() => {
    const total = applicantCount || applicantMeta?.total || statusCounts.total || applicants.length;
    const signedContracts = applicants.filter((i) => Boolean(i.contractId)).length || (isContracted === 1 ? 1 : 0);
    const totalAudience = applicants.reduce((sum, i) => sum + Number(i.audienceSize || 0), 0);
    const avgEngagement = applicants.length > 0 ? applicants.reduce((sum, i) => sum + toPercentNumber(i.engagementRate || 0), 0) / applicants.length : 0;
    const platforms = aggregateCountBreakdown(applicants.map((i) => prettify(i.primaryPlatform || i.platform || "Other")));
    const tiers = aggregateCountBreakdown(applicants.map((i) => prettify(i.influencerTierResolved || "Unknown")));
    const topCountries = aggregateWeightedBreakdown(applicants, (i) => i.modashProfile?.audience?.geoCountries, (e) => e.name || e.code || "Unknown");
    const topLanguages = aggregateWeightedBreakdown(applicants, (i) => i.modashProfile?.audience?.languages, (e) => e.name || e.code || "Unknown");
    const genderSplit = aggregateWeightedBreakdown(applicants, (i) => i.modashProfile?.audience?.genders, (e) => e.code === "MALE" ? "Male" : e.code === "FEMALE" ? "Female" : e.name || e.code || "Other");
    const ageSplit = aggregateWeightedBreakdown(applicants, (i) => i.modashProfile?.audience?.ages, (e) => e.code || e.name || "Unknown");
    return { total, signedContracts, totalAudience, avgEngagement, platforms, tiers, topCountries, topLanguages, genderSplit, ageSplit };
  }, [applicantCount, applicantMeta, statusCounts, applicants, isContracted]);

  const durationDays = useMemo(() => {
    if (!campaign?.startAt || !campaign?.endAt) return null;
    const start = new Date(campaign.startAt).getTime(); const end = new Date(campaign.endAt).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
    return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  }, [campaign?.startAt, campaign?.endAt]);

  /* ----------  Loading / Error  ---------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 p-6">
        <div className="mx-auto max-w-5xl space-y-4">
          <Skeleton className="h-5 w-32 rounded-lg" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-10 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-8 py-6 text-center max-w-sm">
          <X className="h-5 w-5 text-rose-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-rose-700">{error || "Campaign not found."}</p>
        </div>
      </div>
    );
  }

  const c = campaign;
  const primaryTitle = c.campaignTitle || c.name || "Untitled Campaign";
  const isActive = c.isActive === 1;
  const isDraft = c.isDraft === 1;
  const editHref = canEditCampaigns && c.brandId && effectiveCampaignId ? `/admin/brands/create-campaign?brandId=${c.brandId}&id=${effectiveCampaignId}` : null;

  const funnelRows = [
    { label: "Applied", value: statusCounts.applied || 0 },
    { label: "Active", value: statusCounts.active || 0 },
    { label: "Shortlisted", value: statusCounts.shortlisted || 0 },
    { label: "Invited", value: statusCounts.invited || 0 },
    { label: "Completed", value: statusCounts.completed || 0 },
    { label: "Rejected", value: statusCounts.rejected || 0 },
  ];

  const inputCls = "h-8 rounded-xl border-stone-200 bg-white text-xs text-stone-700 outline-none px-2.5 focus:ring-1 focus:ring-teal-400";
  const selectCls = "h-8 rounded-xl border border-stone-200 bg-white text-xs text-stone-700 outline-none px-2.5 focus:ring-1 focus:ring-teal-400";
  const applicantStatusOptions = [
    { value: "all", label: "All status" },
    { value: "applied", label: "Applied" },
    { value: "active", label: "Active" },
    { value: "shortlisted", label: "Shortlisted" },
    { value: "invited", label: "Invited" },
    { value: "completed", label: "Completed" },
    { value: "rejected", label: "Rejected" },
    { value: "undecided", label: "Undecided" },
  ];

  return (
    <div className="min-h-screen bg-stone-50/80 pb-16">

      {/* ── Hero Header ── */}
      <div className="sticky top-3 z-20 overflow-hidden rounded-[0.75rem] border border-[#C6D3E3] bg-[#DCE6F2] shadow-sm">
        {/* Top strip: nav */}
        <div className="mx-auto max-w-6xl px-5 pt-4 pb-0 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-950 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </button>
            <span className="text-slate-300 select-none">/</span>
            <span className="text-sm text-slate-600 truncate max-w-[220px]">{primaryTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadCampaign}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-950 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/50"
            >
              <RotateCcw className="h-3 w-3" /> Refresh
            </button>
            {canManageFunds && (
              <button
                type="button"
                onClick={() => setIsFundsModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold bg-white/80 text-slate-700 px-3 py-1.5 rounded-lg border border-white/70 hover:bg-white transition-colors shadow-sm"
              >
                <Wallet className="h-3.5 w-3.5" /> Add Funds
              </button>
            )}
            {editHref && (
              <Link href={editHref} className="inline-flex items-center gap-1.5 text-sm font-semibold bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 transition-colors shadow-sm">
                <Pencil className="h-3 w-3" /> Edit
              </Link>
            )}
          </div>
        </div>

        {/* Campaign identity */}
        <div className="mx-auto max-w-6xl px-5 pt-4 pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{c.brandName || "—"}</span>

                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${isDraft ? "bg-amber-50 text-amber-700 ring-amber-200" : isActive ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-white/80 text-slate-600 ring-slate-200"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isDraft ? "bg-amber-400" : isActive ? "bg-emerald-400" : "bg-slate-400"}`} />
                  {isDraft ? "Draft" : prettify(c.status)}
                </span>

                <span className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-white/80 text-slate-600 ring-1 ring-slate-200">
                  {prettify(c.publishStatus)}
                </span>

                <span className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-white/80 text-slate-600 ring-1 ring-slate-200">
                  {prettify(c.campaignType)}
                </span>
              </div>

              <h1 className="text-[1.35rem] font-bold text-slate-950 tracking-tight truncate max-w-3xl">
                {primaryTitle}
              </h1>

              {c.description && (
                <p className="mt-1 text-sm text-slate-600 line-clamp-1 max-w-2xl leading-relaxed">
                  {c.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 shrink-0 flex-wrap text-right">
              {[
                { label: "Budget", value: `$${formatMoney(c.campaignBudget ?? c.budget)}` },
                { label: "Influencers", value: c.numberOfInfluencers ?? 0 },
                { label: "Duration", value: durationDays ? `${durationDays}d` : "—" },
              ].map((m) => (
                <div key={m.label} className="flex flex-col items-end rounded-[0.75rem] bg-white/45 px-3 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{m.label}</span>
                  <span className="text-base font-bold text-slate-950">{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-4 overflow-x-auto rounded-[0.75rem] bg-white/35 px-3 border border-white/40">
            <Tab label="Details" active={activeTab === "details"} onClick={() => setActiveTab("details")} />
            <Tab label="Applicants" active={activeTab === "applicants"} onClick={() => setActiveTab("applicants")} count={applicantCount || c.applicantCount || undefined} />
            <Tab label="Deliverables" active={activeTab === "deliverables"} onClick={() => setActiveTab("deliverables")} count={deliverables.length || undefined} />
            <Tab label="Other" active={activeTab === "other"} onClick={() => setActiveTab("other")} />
          </div>
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="mx-auto max-w-6xl px-5 pt-5 space-y-4">

        {/* ══  DETAILS  ══ */}
        {activeTab === "details" && (
          <div className="space-y-3">

            {/* Overview + Links row */}
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">

              {/* Campaign Overview */}
              <Section title="Campaign Overview" icon={<AlignLeft className="h-3.5 w-3.5" />} defaultOpen>
                <dl>
                  <Def label="Type" value={prettify(c.campaignType)} />
                  <Def label="Payment" value={prettify(c.paymentType)} />
                  <Def label="Approval" value={prettify(c.approvalMode)} />
                  <Def label="Applicants" value={c.applicantCount ?? applicantCount ?? 0} />
                  <Def label="Timezone" value={c.campaignTimezone || "—"} />
                  <Def label="Start" value={formatDateShort(c.startAt)} />
                  <Def label="End" value={formatDateShort(c.endAt)} />
                  <Def label="Follower range" value={`${formatCompactNumber(c.minFollowers)} – ${formatCompactNumber(c.maxFollowers)}`} />
                </dl>
              </Section>

              {/* Links & Platforms */}
              <Section title="Links & Platforms" icon={<Link2 className="h-3.5 w-3.5" />} defaultOpen>
                <div className="space-y-3">
                  {c.productLink && (
                    <a href={normalizeUrl(c.productLink)} target="_blank" rel="noreferrer"
                      className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 px-3 py-2.5 text-xs font-medium text-teal-700 hover:border-teal-200 hover:bg-teal-50 transition-colors group">
                      <span>Product Link</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-stone-300 group-hover:text-teal-500 transition-colors" />
                    </a>
                  )}
                  {c.videoLink && (
                    <a href={normalizeUrl(c.videoLink)} target="_blank" rel="noreferrer"
                      className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 px-3 py-2.5 text-xs font-medium text-teal-700 hover:border-teal-200 hover:bg-teal-50 transition-colors group">
                      <span>Video Link</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-stone-300 group-hover:text-teal-500 transition-colors" />
                    </a>
                  )}
                  {!c.productLink && !c.videoLink && <p className="text-xs text-stone-400">No external links.</p>}
                  <div className="pt-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400 mb-2">Platforms</p>
                    <TagCloud items={(c.platformSelection ?? []).map(prettify)} />
                  </div>
                </div>
              </Section>

              {/* Targets */}
              <Section title="Campaign Targets" icon={<Target className="h-3.5 w-3.5" />} defaultOpen>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400 mb-2">Categories</p>
                    <TagCloud items={categoryNames} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400 mb-2">Goals</p>
                    <TagCloud items={campaignGoals} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400 mb-2">Influencer tiers</p>
                    <TagCloud items={influencerTiers} />
                  </div>
                </div>
              </Section>
            </div>

            {/* Content Plan */}
            <Section title="Content Plan" icon={<Layers3 className="h-3.5 w-3.5" />} defaultOpen={false}>
              <div className="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400 mb-2">Formats</p>
                  <TagCloud items={contentFormats} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400 mb-2">Product / Service Info</p>
                  <TagCloud items={c.productServiceInfo ?? []} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400 mb-2">Extra Hashtags</p>
                  <TagCloud items={c.hashtags ?? []} />
                </div>
              </div>
            </Section>

            {/* Campaign Creatives */}
            {imageUrls.length > 0 && (
              <Section title="Campaign Creatives" icon={<ImageIcon className="h-3.5 w-3.5" />} defaultOpen={false}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                  {imageUrls.map((url, i) => (
                    <div key={`${url}-${i}`} className="aspect-video overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
                      <img src={url} alt={`Creative ${i + 1}`} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}

        {/* ══  APPLICANTS  ══ */}
        {activeTab === "applicants" && (
          <div className="space-y-3">
            
          {/* Filters card */}
            <div className="rounded-2xl border border-stone-200 bg-white p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-sm font-semibold text-stone-800">Applicant Filters</p>
                  <p className="text-xs text-stone-400">Filters are separated from the table for a cleaner view.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-stone-400" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search applicant…"
                      className="h-8 w-44 rounded-xl border-stone-200 pl-8 text-xs"
                    />
                  </div>

                  <select
                    value={applicantStatusFilter}
                    onChange={(e) => setApplicantStatusFilter(e.target.value)}
                    className={selectCls}
                  >
                    {applicantStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>

                  <select value={sortField} onChange={(e) => setSortField(e.target.value)} className={selectCls}>
                    <option value="createdAt">Date applied</option>
                    <option value="audienceSize">Audience</option>
                    <option value="engagementRate">Engagement</option>
                    <option value="name">Name</option>
                  </select>

                  <select value={String(sortOrder)} onChange={(e) => setSortOrder(Number(e.target.value) as -1 | 1)} className={selectCls}>
                    <option value="-1">Desc</option>
                    <option value="1">Asc</option>
                  </select>

                  <select value={String(applicantLimit)} onChange={(e) => { setApplicantLimit(Number(e.target.value)); setApplicantPage(1); }} className={selectCls}>
                    <option value="5">5 / page</option>
                    <option value="10">10 / page</option>
                    <option value="20">20 / page</option>
                  </select>

                  <button
                    type="button"
                    onClick={fetchApplicants}
                    disabled={applicantsLoading}
                    className="h-8 w-8 flex items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 hover:bg-stone-100 disabled:opacity-50 transition-colors"
                  >
                    <HiOutlineRefresh className={`h-4 w-4 ${applicantsLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Applicants table */}
            <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
              <div className="flex flex-col gap-2 border-b border-stone-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-stone-800">Applied Influencers</p>
                  <p className="text-xs text-stone-400">
                    Showing {applicants.length} result{applicants.length === 1 ? "" : "s"} on this page
                    {applicantMeta?.total ? ` • ${applicantMeta.total} total` : ""}.
                  </p>
                </div>
              </div>

              {applicantError && (
                <div className="mx-5 mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">{applicantError}</div>
              )}

              <div className="overflow-x-auto">
                <Table className="min-w-[940px]">
                  <TableHeader>
                    <TableRow className="bg-stone-50/70 hover:bg-stone-50 border-stone-100">
                      {["Influencer", "Platform", "Category", "Audience", "Eng.", "Tier", "Applied", "Status", "Contract"].map((h) => (
                        <TableHead key={h} className="h-9 px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applicantsLoading ? (
                      <TableRow><TableCell colSpan={9} className="py-14 text-center text-xs text-stone-400">Loading applicants…</TableCell></TableRow>
                    ) : applicants.length === 0 ? (
                      <TableRow><TableCell colSpan={9} className="py-14 text-center text-xs text-stone-400">No applicants for this campaign yet.</TableCell></TableRow>
                    ) : applicants.map((inf, index) => {
                      const status = getApplicantStatusMeta(inf);
                      const rowContractId = inf.contractId || (applicants.length === 1 ? topLevelContractId : "");
                      const platformIcon = getPlatformIcon(inf.primaryPlatform || inf.platform);

                      return (
                        <TableRow key={`${inf.influencerId || inf.handle || "row"}-${index}`} className="hover:bg-stone-50/60 border-stone-100">
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <ApplicantAvatar applicant={inf} />
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-stone-900">{inf.name || "—"}</p>
                                <p className="truncate text-[11px] text-stone-400">{inf.handle || "—"}</p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="px-4 py-3">
                            <div className="flex items-center justify-center">
                              {platformIcon ? (
                                <img
                                  src={platformIcon}
                                  alt={prettify(inf.primaryPlatform || inf.platform)}
                                  title={prettify(inf.primaryPlatform || inf.platform)}
                                  className="h-4 w-4 object-contain"
                                />
                              ) : (
                                <span className="text-stone-300 text-xs">—</span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="px-4 py-3 text-xs text-stone-600">{inf.category || "—"}</TableCell>
                          <TableCell className="px-4 py-3 text-xs font-semibold text-stone-800 tabular-nums">{formatCompactNumber(inf.audienceSize)}</TableCell>
                          <TableCell className="px-4 py-3 text-xs text-stone-600 tabular-nums">{formatPercent(inf.engagementRate)}</TableCell>
                          <TableCell className="px-4 py-3 text-xs text-stone-600">{prettify(inf.influencerTierResolved)}</TableCell>
                          <TableCell className="px-4 py-3 text-[11px] text-stone-500">{formatDateShort(inf.appliedAt || inf.createdAt)}</TableCell>
                          <TableCell className="px-4 py-3">
                            <Pill className={status.pill}>{status.label}</Pill>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {rowContractId ? (
                              <button
                                type="button"
                                onClick={() => handleDownloadContract(rowContractId)}
                                className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 underline underline-offset-2 transition-colors"
                              >
                                Download
                              </button>
                            ) : <span className="text-stone-300 text-xs">—</span>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {(applicantMeta?.totalPages || 0) > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-stone-100">
                  <p className="text-xs text-stone-400">Page {applicantMeta?.page || applicantPage} of {applicantMeta?.totalPages || 1}</p>
                  <div className="flex gap-1.5">
                    {["Prev", "Next"].map((label) => (
                      <button type="button" key={label}
                        disabled={label === "Prev" ? applicantPage <= 1 || applicantsLoading : applicantsLoading || applicantPage >= Number(applicantMeta?.totalPages || 1)}
                        onClick={() => setApplicantPage((p) => label === "Prev" ? Math.max(1, p - 1) : Math.min(Number(applicantMeta?.totalPages || 1), p + 1))}
                        className="h-7 rounded-lg border border-stone-200 bg-white px-3 text-xs font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══  DELIVERABLES  ══ */}
        {activeTab === "deliverables" && (
          <div className="space-y-3">
            {/* <StatRow items={[
              { label: "Total", value: deliverableStats.total },
              { label: "Pending", value: deliverableStats.pending, accent: "text-amber-700" },
              { label: "Approved", value: deliverableStats.approved, accent: "text-emerald-700" },
              { label: "Revision", value: deliverableStats.revision, accent: "text-sky-700" },
            ]} /> */}

            <div className="rounded-2xl border border-stone-200 bg-white p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-sm font-semibold text-stone-800">Deliverable Filters</p>
                  <p className="text-xs text-stone-400">Filters are separated from submitted deliverables for a cleaner view.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-stone-400" />
                    <Input
                      value={deliverableSearch}
                      onChange={(e) => setDeliverableSearch(e.target.value)}
                      placeholder="Search deliverable…"
                      className="h-8 w-44 rounded-xl border-stone-200 pl-8 text-xs"
                    />
                  </div>

                  <select value={deliverableStatusFilter} onChange={(e) => setDeliverableStatusFilter(e.target.value as any)} className={selectCls}>
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="revision">Revision</option>
                  </select>

                  <select value={deliverableInfluencerFilter} onChange={(e) => setDeliverableInfluencerFilter(e.target.value)} className={selectCls}>
                    <option value="all">All Influencers</option>
                    {deliverableInfluencers.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>

                  <button
                    type="button"
                    onClick={fetchDeliverables}
                    disabled={deliverablesLoading}
                    className="h-8 w-8 flex items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 hover:bg-stone-100 disabled:opacity-50 transition-colors"
                  >
                    <HiOutlineRefresh className={`h-4 w-4 ${deliverablesLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
              <div className="flex flex-col gap-2 border-b border-stone-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-stone-800">Submitted Deliverables</p>
                  <p className="text-xs text-stone-400">Showing {filteredDeliverables.length} result{filteredDeliverables.length === 1 ? "" : "s"} based on the current filters.</p>
                </div>
              </div>

              {deliverablesError && (
                <div className="mx-5 mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">{deliverablesError}</div>
              )}

              <div className="overflow-x-auto">
                <Table className="min-w-[780px]">
                  <TableHeader>
                    <TableRow className="bg-stone-50/70 hover:bg-stone-50 border-stone-100">
                      {["Deliverable", "Milestone", "Influencer", "Draft", "Status", "Submitted", "Updated"].map((h) => (
                        <TableHead key={h} className="h-9 px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliverablesLoading ? (
                      <TableRow><TableCell colSpan={7} className="py-14 text-center text-xs text-stone-400">Loading deliverables…</TableCell></TableRow>
                    ) : filteredDeliverables.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="py-14 text-center text-xs text-stone-400">No deliverables match the current filters.</TableCell></TableRow>
                    ) : filteredDeliverables.map((row) => (
                      <TableRow key={row.rowKey} className="hover:bg-stone-50/60 border-stone-100">
                        <TableCell className="px-4 py-2.5 max-w-[220px]">
                          <p className="text-xs font-semibold text-stone-900 truncate">{row.title}</p>
                          {row.description && <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">{row.description}</p>}
                        </TableCell>
                        <TableCell className="px-4 py-2.5 text-xs text-stone-600">{row.milestoneTitle}</TableCell>
                        <TableCell className="px-4 py-2.5 text-xs text-stone-600">{row.influencerName}</TableCell>
                        <TableCell className="px-4 py-2.5">
                          {row.linkUrl ? (
                            <a href={normalizeUrl(row.linkUrl)} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 underline underline-offset-2 transition-colors">
                              {row.draftLabel} <ArrowUpRight className="h-2.5 w-2.5" />
                            </a>
                          ) : <span className="text-stone-300 text-xs">—</span>}
                        </TableCell>
                        <TableCell className="px-4 py-2.5">
                          <Pill className={reviewBadge(row.status)}>{reviewLabel(row.status)}</Pill>
                        </TableCell>
                        <TableCell className="px-4 py-2.5 text-[11px] text-stone-500">{formatDateShort(row.submittedAt)}</TableCell>
                        <TableCell className="px-4 py-2.5 text-[11px] text-stone-500">{formatDateShort(row.updatedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
        {isFundsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 px-4 py-6" onClick={() => setIsFundsModalOpen(false)}>
            <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[1rem] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white px-5 py-4">
                <div>
                  <p className="text-base font-semibold text-stone-900">Add Campaign Funds</p>
                  <p className="text-xs text-stone-400">Add funds without leaving the campaign page.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFundsModalOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 hover:bg-stone-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-5">
                <div className="xl:col-span-3">
                  <Section title="Add Campaign Funds" icon={<Plus className="h-3.5 w-3.5" />} defaultOpen>
                    <div className="grid grid-cols-1 gap-2 mb-5 sm:grid-cols-2">
                      {[
                        { label: "Campaign", value: primaryTitle },
                        { label: "Brand", value: c.brandName || "—" },
                        { label: "Campaign Budget", value: `$${formatMoney(c.campaignBudget ?? c.budget)}` },
                        { label: "Influencer Budget", value: `$${formatMoney(c.influencerBudget)}` },
                      ].map((i) => (
                        <div key={i.label} className="rounded-xl bg-stone-50 border border-stone-100 px-3 py-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">{i.label}</p>
                          <p className="mt-0.5 text-xs font-semibold text-stone-800 truncate">{i.value}</p>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleAddFunds} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">Amount (USD)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-medium">$</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={fundAmount}
                            onChange={(e) => setFundAmount(e.target.value)}
                            placeholder="0.00"
                            className="h-10 rounded-xl border-stone-200 bg-white pl-7 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">Internal Note</label>
                        <textarea
                          value={fundNote}
                          onChange={(e) => setFundNote(e.target.value)}
                          rows={4}
                          placeholder="Reason or note for this fund addition."
                          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 outline-none focus:border-teal-300 focus:ring-1 focus:ring-teal-200 resize-none placeholder:text-stone-400"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsFundsModalOpen(false)}
                          className="inline-flex items-center gap-2 h-10 rounded-xl border border-stone-200 bg-white px-4 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!canManageFunds || addingFunds}
                          className="inline-flex items-center gap-2 h-10 rounded-xl bg-teal-600 px-5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Wallet className="h-3.5 w-3.5" />
                          {addingFunds ? "Adding funds…" : "Add Funds"}
                        </button>
                      </div>
                    </form>
                  </Section>
                </div>

                <div className="xl:col-span-2 space-y-3">
                  <Section title="Funding Overview" icon={<TrendingUp className="h-3.5 w-3.5" />} defaultOpen>
                    <dl>
                      <Def label="Campaign Budget" value={`$${formatMoney(c.campaignBudget ?? c.budget)}`} />
                      <Def label="Influencer Budget" value={`$${formatMoney(c.influencerBudget)}`} />
                      <Def label="Required Influencers" value={c.numberOfInfluencers ?? 0} />
                      <Def label="Total Applicants" value={c.applicantCount ?? applicantCount ?? 0} />
                    </dl>
                  </Section>

                  {fundingSummary ? (
                    <Section title="Latest Snapshot" icon={<CheckCircle2 className="h-3.5 w-3.5" />} defaultOpen>
                      <dl>
                        <Def label="Added" value={<span className="text-emerald-700 font-bold">${formatMoney(fundingSummary.addedAmount)}</span>} />
                        <Def label="Wallet Balance" value={`$${formatMoney(fundingSummary.wallet.walletBalance)}`} />
                        <Def label="Frozen Balance" value={`$${formatMoney(fundingSummary.wallet.frozenBalance)}`} />
                        <Def label="Usable Balance" value={`$${formatMoney(fundingSummary.wallet.usableBalance)}`} />
                        <Def label="Campaign Frozen" value={`$${formatMoney(fundingSummary.campaignFreeze.currentFrozenAmount)}`} />
                        <Def label="Available to Allocate" value={`$${formatMoney(fundingSummary.campaignFreeze.availableToAllocate)}`} />
                      </dl>
                    </Section>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-5 py-8 text-center">
                      <Wallet className="h-5 w-5 text-stone-300 mx-auto mb-2" />
                      <p className="text-xs text-stone-400">Add funds to see wallet and freeze summary.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══  OTHER  ══ */}
        {activeTab === "other" && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">

            <Section title="Targeting Details" icon={<Globe className="h-3.5 w-3.5" />} defaultOpen>
              <div className="space-y-4">
                {[
                  { label: "Content Languages", items: contentLanguages },
                  { label: "Target Countries", items: countries },
                  { label: "Target Age Ranges", items: ageRanges },
                  { label: "Preferred Hashtags", items: hashtags },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400 mb-1.5">{s.label}</p>
                    <TagCloud items={s.items} />
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Admin Details" icon={<Users2 className="h-3.5 w-3.5" />} defaultOpen>
              <dl>
                <Def label="Created By" value={c.createdBy?.name || "—"} />
                <Def label="Email" value={c.createdBy?.email || "—"} />
                <Def label="Role" value={prettify(c.createdBy?.role)} />
                <Def label="Admin Role" value={prettify(c.createdBy?.adminRole)} />
                <Def label="Created" value={formatDateShort(c.createdAt)} />
                <Def label="Updated" value={formatDateShort(c.updatedAt)} />
              </dl>
              {c.additionalNotes && (
                <div className="mt-3 pt-3 border-t border-stone-100">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400 mb-1.5">Additional Notes</p>
                  <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-wrap">{c.additionalNotes}</p>
                </div>
              )}
            </Section>

            <div className="space-y-3">
              <Section title="Status & Timeline" icon={<Calendar className="h-3.5 w-3.5" />} defaultOpen>
                <dl>
                  <Def label="Status" value={isDraft ? "Draft" : prettify(c.status)} />
                  <Def label="Publish Status" value={prettify(c.publishStatus)} />
                  <Def label="Approval Mode" value={prettify(c.approvalMode)} />
                  <Def label="Scheduled At" value={formatDateShort(c.scheduledAt)} />
                  <Def label="Published At" value={formatDateShort(c.publishedAt)} />
                  <Def label="Ended At" value={formatDateShort(c.endedAt)} />
                </dl>
              </Section>

              <Section title="External Links" icon={<Link2 className="h-3.5 w-3.5" />} defaultOpen>
                {c.productLink ? (
                  <a href={normalizeUrl(c.productLink)} target="_blank" rel="noreferrer"
                    className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 px-3 py-2.5 text-xs font-medium text-teal-700 hover:border-teal-200 hover:bg-teal-50 transition-colors mb-2 group">
                    Product Link <ArrowUpRight className="h-3 w-3 text-stone-300 group-hover:text-teal-500 transition-colors" />
                  </a>
                ) : null}
                {c.videoLink ? (
                  <a href={normalizeUrl(c.videoLink)} target="_blank" rel="noreferrer"
                    className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 px-3 py-2.5 text-xs font-medium text-teal-700 hover:border-teal-200 hover:bg-teal-50 transition-colors group">
                    Video Link <ArrowUpRight className="h-3 w-3 text-stone-300 group-hover:text-teal-500 transition-colors" />
                  </a>
                ) : null}
                {!c.productLink && !c.videoLink && <p className="text-xs text-stone-400">No external links.</p>}
              </Section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}