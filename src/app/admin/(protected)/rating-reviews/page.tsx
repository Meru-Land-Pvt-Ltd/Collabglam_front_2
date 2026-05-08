"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Copy,
  ExternalLink,
  Link2,
  Loader2,
  RefreshCw,
  Search,
  Star,
  XCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  Zap,
  BarChart3,
  Filter,
} from "lucide-react";
import { get, post } from "@/lib/api";

/* ─── Types ──────────────────────────────────────────────── */

type ReviewType = "brand_to_influencer" | "influencer_to_brand";
type ReviewStatus = "pending" | "submitted" | "expired" | "revoked";

type PopulatedMini = {
  _id?: string;
  name?: string;
  title?: string;
  campaignTitle?: string;
  brandName?: string;
  companyName?: string;
  fullName?: string;
  influencerName?: string;
  username?: string;
  email?: string;
  role?: string;
};

type ReviewOptionInfluencer = {
  _id: string;
  name: string;
  email?: string;
  username?: string;
};

type ReviewOptionCampaign = {
  _id: string;
  campaignId: string;
  title: string;
  status?: string;
  brand: { _id: string; name: string; email?: string };
  influencers: ReviewOptionInfluencer[];
};

type OptionsResponse = {
  success?: boolean;
  data?: ReviewOptionCampaign[];
  message?: string;
};

type CampaignReview = {
  _id: string;
  reviewRequestId?: string;
  campaignId?: PopulatedMini | string | null;
  brandId?: PopulatedMini | string | null;
  influencerId?: PopulatedMini | string | null;
  reviewType: ReviewType;
  reviewerRole?: string;
  revieweeRole?: string;
  status: ReviewStatus;
  rating?: number | null;
  ratings?: Record<string, number | null>;
  reviewTitle?: string;
  reviewText?: string;
  privateFeedback?: string;
  tags?: string[];
  publicUrl?: string;
  tokenExpiresAt?: string;
  submittedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  generatedByAdminId?: PopulatedMini | string | null;
  generatedByAdminName?: string;
  generatedByAdminEmail?: string;
  generatedByAdminRole?: string;
};

type ListResponse = {
  success?: boolean;
  data?: CampaignReview[];
  total?: number;
  page?: number;
  limit?: number;
  message?: string;
};

type GeneratedLink = {
  _id: string;
  reviewRequestId?: string;
  reviewType: ReviewType;
  reviewerRole?: string;
  revieweeRole?: string;
  publicUrl: string;
  expiresAt?: string;
};

type GenerateResponse = {
  success?: boolean;
  message?: string;
  data?: GeneratedLink[];
};

/* ─── Utils ──────────────────────────────────────────────── */

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getName(
  value: PopulatedMini | string | null | undefined,
  fallback = "—"
) {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  return (
    value.campaignTitle ||
    value.title ||
    value.brandName ||
    value.companyName ||
    value.influencerName ||
    value.fullName ||
    value.name ||
    value.username ||
    value.email ||
    value._id ||
    fallback
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatReviewType(value?: string) {
  if (value === "brand_to_influencer") return "Brand → Influencer";
  if (value === "influencer_to_brand") return "Influencer → Brand";
  return "Review";
}

/* ─── Injected styles ────────────────────────────────────── */

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; }

.adm-root {
  font-family: 'Plus Jakarta Sans', sans-serif;
  background: #F4F3F0;
  min-height: 100vh;
}
.adm-display { font-family: 'Syne', sans-serif; }
.adm-mono { font-family: 'JetBrains Mono', monospace; }

/* ── Scrollbar ── */
.adm-scroll::-webkit-scrollbar { width: 4px; }
.adm-scroll::-webkit-scrollbar-track { background: transparent; }
.adm-scroll::-webkit-scrollbar-thumb { background: #D6D3D1; border-radius: 4px; }

/* ── Select ── */
.adm-select {
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23A8A29E' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 36px !important;
  cursor: pointer;
}

/* ── Field base ── */
.adm-field {
  width: 100%;
  height: 44px;
  background: #fff;
  border: 1.5px solid #E7E5E4;
  border-radius: 12px;
  padding: 0 14px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13.5px;
  font-weight: 500;
  color: #1C1917;
  outline: none;
  transition: border-color 0.18s, box-shadow 0.18s;
}
.adm-field:focus {
  border-color: #4338CA;
  box-shadow: 0 0 0 3px rgba(67, 56, 202, 0.08);
}
.adm-field:disabled {
  background: #FAFAF9;
  color: #A8A29E;
  cursor: not-allowed;
}
.adm-field::placeholder { color: #C4BCB7; font-weight: 400; }

/* ── Status badge ── */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 100px;
  padding: 3px 10px;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.01em;
  white-space: nowrap;
}
.badge-pending   { background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE; }
.badge-submitted { background: #F0FDF4; color: #15803D; border: 1px solid #BBF7D0; }
.badge-expired   { background: #FFFBEB; color: #B45309; border: 1px solid #FDE68A; }
.badge-revoked   { background: #FFF1F2; color: #BE123C; border: 1px solid #FECDD3; }
.badge-type-b2i  { background: #F5F3FF; color: #5B21B6; border: 1px solid #DDD6FE; }
.badge-type-i2b  { background: #FFF7ED; color: #C2410C; border: 1px solid #FED7AA; }

/* ── Review card ── */
.review-card {
  border-radius: 18px;
  border: 1.5px solid #E7E5E4;
  background: #fff;
  padding: 18px 20px;
  transition: border-color 0.18s, box-shadow 0.18s, transform 0.15s;
}
.review-card:hover {
  border-color: #D6D3D1;
  box-shadow: 0 4px 16px rgba(0,0,0,0.05);
  transform: translateY(-1px);
}
.review-card.focused {
  border-color: #4338CA;
  background: #FAFAFE;
  box-shadow: 0 0 0 3px rgba(67, 56, 202, 0.06);
}

/* ── Action button ── */
.adm-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  border-radius: 10px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  border: 1.5px solid transparent;
  transition: all 0.15s;
  white-space: nowrap;
}
.adm-btn-ghost {
  background: #fff;
  border-color: #E7E5E4;
  color: #57534E;
}
.adm-btn-ghost:hover { background: #F5F5F4; border-color: #D6D3D1; }
.adm-btn-danger {
  background: #fff;
  border-color: #FECDD3;
  color: #BE123C;
}
.adm-btn-danger:hover { background: #FFF1F2; }
.adm-btn-primary {
  background: linear-gradient(135deg, #4338CA 0%, #3730A3 100%);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(67,56,202,0.25);
}
.adm-btn-primary:hover:not(:disabled) {
  box-shadow: 0 4px 16px rgba(67,56,202,0.35);
  transform: translateY(-1px);
}
.adm-btn-primary:active:not(:disabled) { transform: translateY(0); }
.adm-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
.adm-btn-lg {
  height: 46px;
  padding: 0 20px;
  border-radius: 12px;
  font-size: 14px;
  width: 100%;
  justify-content: center;
}

/* ── Generate panel header ── */
.gen-header {
  background: linear-gradient(145deg, #312E81 0%, #3730A3 40%, #1e1b4b 100%);
  border-radius: 20px 20px 0 0;
  padding: 24px 24px 22px;
  position: relative;
  overflow: hidden;
}
.gen-header::after {
  content: '';
  position: absolute;
  top: -40px; right: -40px;
  width: 160px; height: 160px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(165,180,252,0.15) 0%, transparent 70%);
  pointer-events: none;
}

/* ── Generated link chip ── */
.link-chip {
  background: #F0FDF4;
  border: 1.5px solid #BBF7D0;
  border-radius: 14px;
  padding: 14px 16px;
}

/* ── Label ── */
.field-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #A8A29E;
  margin-bottom: 7px;
}

/* ── Stat pill ── */
.stat-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 1.5px solid #E7E5E4;
  border-radius: 14px;
  padding: 13px 16px;
}

/* ── Toast ── */
.toast {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 9999;
  padding: 12px 18px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  animation: slideUp 0.25s ease both;
}
.toast-success { background: #111110; color: #fff; }
.toast-error   { background: #FFF1F2; color: #BE123C; border: 1.5px solid #FECDD3; }

@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.fade-in { animation: fadeIn 0.3s ease both; }
`;

/* ─── Sub-components ─────────────────────────────────────── */

function StarRow({ rating }: { rating?: number | null }) {
  const value = Math.round(Number(rating || 0));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          style={{
            width: 13,
            height: 13,
            fill: i < value ? "#FBBF24" : "none",
            color: i < value ? "#FBBF24" : "#D6D3D1",
          }}
        />
      ))}
      {value > 0 && (
        <span
          style={{
            marginLeft: 4,
            fontSize: 11,
            fontWeight: 700,
            color: "#92400E",
          }}
        >
          {value}.0
        </span>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
    pending:   { cls: "badge-pending",   icon: <Clock style={{ width: 10, height: 10 }} />,        label: "Pending" },
    submitted: { cls: "badge-submitted", icon: <CheckCircle2 style={{ width: 10, height: 10 }} />, label: "Submitted" },
    expired:   { cls: "badge-expired",   icon: <AlertCircle style={{ width: 10, height: 10 }} />,  label: "Expired" },
    revoked:   { cls: "badge-revoked",   icon: <XCircle style={{ width: 10, height: 10 }} />,      label: "Revoked" },
  };
  const config = map[status || ""] ?? { cls: "", icon: null, label: status || "—" };
  return (
    <span className={`badge ${config.cls}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

function TypeBadge({ type }: { type?: string }) {
  const cls =
    type === "brand_to_influencer" ? "badge-type-b2i" : "badge-type-i2b";
  return (
    <span className={`badge ${cls}`}>{formatReviewType(type)}</span>
  );
}

/* ─── Toast ─────────────────────────────────────────────── */

function Toast({
  message,
  type,
}: {
  message: string;
  type: "success" | "error";
}) {
  return (
    <div className={`toast toast-${type}`}>
      {type === "success" ? (
        <CheckCircle2 style={{ width: 15, height: 15 }} />
      ) : (
        <XCircle style={{ width: 15, height: 15 }} />
      )}
      {message}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────── */

export default function AdminRatingReviewsPage() {
  const searchParams = useSearchParams();
  const focusReviewId = String(searchParams.get("reviewId") || "");

  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [submitting, setSubmitting] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [rows, setRows] = useState<CampaignReview[]>([]);
  const [campaignOptions, setCampaignOptions] = useState<ReviewOptionCampaign[]>([]);
  const [generatedLinks, setGeneratedLinks] = useState<GeneratedLink[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [reviewTypeFilter, setReviewTypeFilter] = useState("");

  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [selectedInfluencerId, setSelectedInfluencerId] = useState("");
  const [reviewType, setReviewType] = useState<"both" | ReviewType>("both");
  const [expiresInDays, setExpiresInDays] = useState("30");

  /* flash message auto-clear */
  useEffect(() => {
    if (!message && !error) return;
    const t = setTimeout(() => { setMessage(""); setError(""); }, 4000);
    return () => clearTimeout(t);
  }, [message, error]);

  const selectedCampaign = useMemo(
    () => campaignOptions.find((item) => item._id === selectedCampaignId) || null,
    [campaignOptions, selectedCampaignId]
  );

  const selectedInfluencer = useMemo(
    () =>
      selectedCampaign?.influencers.find(
        (item) => item._id === selectedInfluencerId
      ) || null,
    [selectedCampaign, selectedInfluencerId]
  );

  const brandId = selectedCampaign?.brand?._id || "";

  const buildListQuery = useCallback(() => {
    const params = new URLSearchParams();
    params.set("limit", "100");
    if (statusFilter) params.set("status", statusFilter);
    if (reviewTypeFilter) params.set("reviewType", reviewTypeFilter);
    if (selectedCampaignId) params.set("campaignId", selectedCampaignId);
    if (brandId) params.set("brandId", brandId);
    if (selectedInfluencerId) params.set("influencerId", selectedInfluencerId);
    return params.toString();
  }, [statusFilter, reviewTypeFilter, selectedCampaignId, brandId, selectedInfluencerId]);

  const loadOptions = useCallback(async () => {
    try {
      setOptionsLoading(true);
      setError("");
      const payload = await get<OptionsResponse>(
        "/campaign-reviews/admin/options?limit=300"
      );
      const options = Array.isArray(payload?.data) ? payload.data : [];
      setCampaignOptions(options);
      setSelectedCampaignId((prev) => {
        if (prev && options.some((item) => item._id === prev)) return prev;
        return options[0]?._id || "";
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load campaign options.");
      setCampaignOptions([]);
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  const loadReviews = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) setLoading(true);
        setError("");
        const payload = await get<ListResponse>(
          `/campaign-reviews/admin?${buildListQuery()}`
        );
        setRows(Array.isArray(payload?.data) ? payload.data : []);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || "Failed to load reviews.");
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [buildListQuery]
  );

  useEffect(() => { void loadOptions(); }, [loadOptions]);
  useEffect(() => { void loadReviews(true); }, [loadReviews]);

  useEffect(() => {
    setSelectedInfluencerId((prev) => {
      if (prev && selectedCampaign?.influencers.some((item) => item._id === prev))
        return prev;
      return selectedCampaign?.influencers[0]?._id || "";
    });
  }, [selectedCampaign]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (!term) return true;
      const haystack = [
        row._id, row.reviewRequestId, row.reviewType, row.status,
        row.reviewTitle, row.reviewText,
        getName(row.campaignId), getName(row.brandId), getName(row.influencerId),
        row.generatedByAdminName, row.generatedByAdminEmail,
      ].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(term);
    });
  }, [rows, search]);

  /* stats */
  const stats = useMemo(() => ({
    total: rows.length,
    submitted: rows.filter((r) => r.status === "submitted").length,
    pending: rows.filter((r) => r.status === "pending").length,
    expired: rows.filter((r) => r.status === "expired").length,
  }), [rows]);

  async function copyToClipboard(value = "") {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setMessage("Link copied to clipboard");
    } catch {
      setMessage("Unable to copy — please copy manually.");
    }
  }

  async function handleGenerateLinks() {
    try {
      if (!selectedCampaignId) throw new Error("Please select a campaign");
      if (!brandId) throw new Error("Selected campaign has no brand");
      if (!selectedInfluencerId) throw new Error("Please select an influencer");

      setSubmitting("generate");
      setError("");
      setMessage("");
      setGeneratedLinks([]);

      const body: Record<string, any> = {
        campaignId: selectedCampaignId,
        brandId,
        influencerId: selectedInfluencerId,
        expiresInDays: Number(expiresInDays) || 30,
      };

      if (reviewType === "both") {
        body.reviewTypes = ["brand_to_influencer", "influencer_to_brand"];
      } else {
        body.reviewType = reviewType;
      }

      const payload = await post<GenerateResponse>(
        "/campaign-reviews/admin/generate-links",
        body
      );

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to generate links");
      }

      setGeneratedLinks(Array.isArray(payload?.data) ? payload.data : []);
      setMessage(payload?.message || "Review links generated");
      await loadReviews(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to generate links.");
    } finally {
      setSubmitting("");
    }
  }

  async function handleRevoke(reviewId: string) {
    try {
      setSubmitting(`revoke-${reviewId}`);
      setError("");
      setMessage("");

      const payload = await post<any>(
        `/campaign-reviews/admin/${reviewId}/revoke`,
        {}
      );

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to revoke link");
      }

      setMessage(payload?.message || "Review link revoked");
      await loadReviews(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to revoke.");
    } finally {
      setSubmitting("");
    }
  }

  return (
    <>
      <style>{styles}</style>

      <div className="adm-root">

        {/* ── Top bar ── */}
        <div
          style={{
            background: "#fff",
            borderBottom: "1.5px solid #E7E5E4",
            padding: "0 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 64,
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "linear-gradient(135deg, #4338CA, #3730A3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BarChart3 style={{ width: 17, height: 17, color: "#fff" }} />
            </div>

            <div>
              <h1
                className="adm-display"
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#111110",
                  letterSpacing: "-0.01em",
                  lineHeight: 1,
                }}
              >
                Ratings & Reviews
              </h1>
              <p
                style={{
                  fontSize: 11,
                  color: "#A8A29E",
                  fontWeight: 500,
                  marginTop: 2,
                }}
              >
                Admin dashboard
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { void loadOptions(); void loadReviews(true); }}
            disabled={loading || optionsLoading}
            className="adm-btn adm-btn-ghost"
            style={{ height: 36 }}
          >
            <RefreshCw
              style={{
                width: 13,
                height: 13,
                ...(loading || optionsLoading
                  ? { animation: "spin 1s linear infinite" }
                  : {}),
              }}
            />
            Refresh
          </button>
        </div>

        {/* ── Page body ── */}
        <div style={{ padding: "28px 32px 60px", maxWidth: 1400, margin: "0 auto" }}>

          {/* ── Stat bar ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 12,
              marginBottom: 24,
            }}
          >
            {[
              { label: "Total", value: stats.total, color: "#4338CA" },
              { label: "Submitted", value: stats.submitted, color: "#15803D" },
              { label: "Pending", value: stats.pending, color: "#1D4ED8" },
              { label: "Expired", value: stats.expired, color: "#B45309" },
            ].map((s) => (
              <div key={s.label} className="stat-pill fade-in">
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: s.color + "14",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: s.color,
                      fontFamily: "'Syne', sans-serif",
                    }}
                  >
                    {s.value}
                  </span>
                </div>
                <span
                  style={{ fontSize: 12, fontWeight: 600, color: "#78716C" }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* ── Two-col layout ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "380px 1fr",
              gap: 20,
              alignItems: "start",
            }}
          >
            {/* ── Generate panel ── */}
            <aside
              style={{
                borderRadius: 22,
                border: "1.5px solid #E7E5E4",
                overflow: "hidden",
                background: "#fff",
                boxShadow: "0 4px 24px rgba(0,0,0,0.05)",
                position: "sticky",
                top: 84,
              }}
            >
              <div className="gen-header">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Zap style={{ width: 15, height: 15, color: "#C7D2FE" }} />
                  </div>
                  <div>
                    <p
                      className="adm-display"
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#fff",
                        lineHeight: 1,
                      }}
                    >
                      Generate Review Link
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: "rgba(199,210,254,0.7)",
                        marginTop: 3,
                        fontWeight: 500,
                      }}
                    >
                      Pick campaign & influencer to create
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ padding: "22px 22px 24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  {/* Campaign */}
                  <div>
                    <label className="field-label">Campaign</label>
                    <select
                      className="adm-field adm-select"
                      value={selectedCampaignId}
                      onChange={(e) => setSelectedCampaignId(e.target.value)}
                      disabled={optionsLoading}
                    >
                      {optionsLoading ? (
                        <option value="">Loading…</option>
                      ) : campaignOptions.length === 0 ? (
                        <option value="">No campaigns found</option>
                      ) : (
                        <>
                          <option value="">Select campaign</option>
                          {campaignOptions.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.title} · {c.brand?.name || "Brand"}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>

                  {/* Brand info */}
                  <div
                    style={{
                      background: "#F4F3F0",
                      borderRadius: 12,
                      padding: "12px 14px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "#A8A29E",
                        marginBottom: 5,
                      }}
                    >
                      Brand
                    </p>
                    <p
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: selectedCampaign ? "#111110" : "#C4BCB7",
                      }}
                    >
                      {selectedCampaign?.brand?.name || "Select a campaign above"}
                    </p>
                    {selectedCampaign?.brand?.email && (
                      <p
                        style={{
                          fontSize: 11.5,
                          color: "#78716C",
                          marginTop: 2,
                          fontWeight: 500,
                        }}
                      >
                        {selectedCampaign.brand.email}
                      </p>
                    )}
                  </div>

                  {/* Influencer */}
                  <div>
                    <label className="field-label">Influencer</label>
                    <select
                      className="adm-field adm-select"
                      value={selectedInfluencerId}
                      onChange={(e) => setSelectedInfluencerId(e.target.value)}
                      disabled={
                        !selectedCampaign ||
                        selectedCampaign.influencers.length === 0
                      }
                    >
                      {!selectedCampaign ? (
                        <option value="">Select campaign first</option>
                      ) : selectedCampaign.influencers.length === 0 ? (
                        <option value="">No approved influencers</option>
                      ) : (
                        <>
                          <option value="">Select influencer</option>
                          {selectedCampaign.influencers.map((inf) => (
                            <option key={inf._id} value={inf._id}>
                              {inf.name}
                              {inf.email ? ` · ${inf.email}` : ""}
                            </option>
                          ))}
                        </>
                      )}
                    </select>

                    {selectedInfluencer && (
                      <div
                        style={{
                          marginTop: 8,
                          background: "#F5F3FF",
                          border: "1.5px solid #DDD6FE",
                          borderRadius: 12,
                          padding: "10px 14px",
                        }}
                      >
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#4C1D95",
                          }}
                        >
                          {selectedInfluencer.name}
                        </p>
                        {(selectedInfluencer.email ||
                          selectedInfluencer.username) && (
                          <p
                            style={{
                              fontSize: 11.5,
                              color: "#7C3AED",
                              marginTop: 2,
                              fontWeight: 500,
                            }}
                          >
                            {[
                              selectedInfluencer.email,
                              selectedInfluencer.username,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Generate For + Expiry */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label className="field-label">Generate For</label>
                      <select
                        className="adm-field adm-select"
                        value={reviewType}
                        onChange={(e) => setReviewType(e.target.value as any)}
                      >
                        <option value="both">Both Links</option>
                        <option value="brand_to_influencer">Brand reviews</option>
                        <option value="influencer_to_brand">Influencer reviews</option>
                      </select>
                    </div>

                    <div>
                      <label className="field-label">Expiry (days)</label>
                      <input
                        className="adm-field"
                        type="number"
                        min={1}
                        max={180}
                        value={expiresInDays}
                        onChange={(e) => setExpiresInDays(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="button"
                    className="adm-btn adm-btn-primary adm-btn-lg"
                    onClick={handleGenerateLinks}
                    disabled={submitting === "generate" || optionsLoading}
                    style={{ marginTop: 4 }}
                  >
                    {submitting === "generate" ? (
                      <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} />
                    ) : (
                      <Link2 style={{ width: 15, height: 15 }} />
                    )}
                    {submitting === "generate" ? "Generating…" : "Generate Link"}
                  </button>
                </div>

                {/* Generated links */}
                {generatedLinks.length > 0 && (
                  <div style={{ marginTop: 18 }}>
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "#15803D",
                        marginBottom: 10,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <CheckCircle2 style={{ width: 12, height: 12 }} />
                      Generated Links
                    </p>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {generatedLinks.map((item) => (
                        <div key={item._id} className="link-chip fade-in">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: 8,
                            }}
                          >
                            <TypeBadge type={item.reviewType} />

                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                type="button"
                                className="adm-btn adm-btn-ghost"
                                style={{ height: 28, padding: "0 10px", fontSize: 11 }}
                                onClick={() => copyToClipboard(item.publicUrl)}
                              >
                                <Copy style={{ width: 11, height: 11 }} />
                                Copy
                              </button>

                              <a
                                href={item.publicUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="adm-btn adm-btn-ghost"
                                style={{
                                  height: 28,
                                  padding: "0 10px",
                                  fontSize: 11,
                                  textDecoration: "none",
                                }}
                              >
                                <ExternalLink style={{ width: 11, height: 11 }} />
                                Open
                              </a>
                            </div>
                          </div>

                          <p
                            className="adm-mono"
                            style={{
                              fontSize: 10.5,
                              color: "#166534",
                              wordBreak: "break-all",
                              lineHeight: 1.5,
                            }}
                          >
                            {item.publicUrl}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>

            {/* ── Reviews list ── */}
            <section
              style={{
                borderRadius: 22,
                border: "1.5px solid #E7E5E4",
                background: "#fff",
                overflow: "hidden",
                boxShadow: "0 4px 24px rgba(0,0,0,0.05)",
              }}
            >
              {/* Section header */}
              <div
                style={{
                  padding: "18px 22px",
                  borderBottom: "1.5px solid #F4F3F0",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    <h2
                      className="adm-display"
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#111110",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      Review Requests
                    </h2>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#A8A29E",
                        marginTop: 2,
                        fontWeight: 500,
                      }}
                    >
                      {filteredRows.length} result
                      {filteredRows.length !== 1 ? "s" : ""}
                      {search ? ` for "${search}"` : ""}
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Filter style={{ width: 13, height: 13, color: "#A8A29E" }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#A8A29E" }}>
                      Filters
                    </span>
                  </div>
                </div>

                {/* Filters row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 160px 200px",
                    gap: 8,
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <Search
                      style={{
                        width: 13,
                        height: 13,
                        color: "#A8A29E",
                        position: "absolute",
                        left: 13,
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                      }}
                    />
                    <input
                      className="adm-field"
                      style={{ paddingLeft: 34 }}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search reviews…"
                    />
                  </div>

                  <select
                    className="adm-field adm-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="submitted">Submitted</option>
                    <option value="expired">Expired</option>
                    <option value="revoked">Revoked</option>
                  </select>

                  <select
                    className="adm-field adm-select"
                    value={reviewTypeFilter}
                    onChange={(e) => setReviewTypeFilter(e.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="brand_to_influencer">Brand → Influencer</option>
                    <option value="influencer_to_brand">Influencer → Brand</option>
                  </select>
                </div>
              </div>

              {/* List body */}
              <div
                className="adm-scroll"
                style={{
                  maxHeight: "calc(100vh - 270px)",
                  overflowY: "auto",
                  padding: 14,
                }}
              >
                {loading ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                      padding: "60px 0",
                      color: "#A8A29E",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    <Loader2
                      style={{
                        width: 16,
                        height: 16,
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    Loading reviews…
                  </div>
                ) : filteredRows.length === 0 ? (
                  <div
                    style={{
                      padding: "60px 0",
                      textAlign: "center",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#A8A29E",
                    }}
                  >
                    No reviews found
                    {search && (
                      <span style={{ color: "#C4BCB7" }}> for "{search}"</span>
                    )}
                  </div>
                ) : (
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {filteredRows.map((row) => {
                      const focused =
                        focusReviewId && row._id === focusReviewId;

                      return (
                        <article
                          key={row._id}
                          className={cx("review-card", focused && "focused")}
                        >
                          {/* Top row */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              justifyContent: "space-between",
                              gap: 12,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 5,
                                alignItems: "center",
                              }}
                            >
                              <TypeBadge type={row.reviewType} />
                              <StatusBadge status={row.status} />
                              {row.rating ? (
                                <StarRow rating={row.rating} />
                              ) : null}
                            </div>

                            {/* Action buttons */}
                            <div
                              style={{
                                display: "flex",
                                gap: 6,
                                flexShrink: 0,
                              }}
                            >
                              {row.publicUrl && row.status === "pending" && (
                                <>
                                  <button
                                    type="button"
                                    className="adm-btn adm-btn-ghost"
                                    onClick={() =>
                                      copyToClipboard(row.publicUrl || "")
                                    }
                                  >
                                    <Copy style={{ width: 12, height: 12 }} />
                                    Copy
                                  </button>

                                  <a
                                    href={row.publicUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="adm-btn adm-btn-ghost"
                                    style={{ textDecoration: "none" }}
                                  >
                                    <ExternalLink
                                      style={{ width: 12, height: 12 }}
                                    />
                                    Open
                                  </a>
                                </>
                              )}

                              {row.status === "pending" && (
                                <button
                                  type="button"
                                  className="adm-btn adm-btn-danger"
                                  onClick={() => handleRevoke(row._id)}
                                  disabled={
                                    submitting === `revoke-${row._id}`
                                  }
                                >
                                  {submitting === `revoke-${row._id}` ? (
                                    <Loader2
                                      style={{
                                        width: 12,
                                        height: 12,
                                        animation:
                                          "spin 1s linear infinite",
                                      }}
                                    />
                                  ) : (
                                    <XCircle
                                      style={{ width: 12, height: 12 }}
                                    />
                                  )}
                                  Revoke
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Campaign + participants */}
                          <div style={{ marginTop: 12 }}>
                            <p
                              className="adm-display"
                              style={{
                                fontSize: 14.5,
                                fontWeight: 700,
                                color: "#111110",
                                letterSpacing: "-0.005em",
                              }}
                            >
                              {getName(row.campaignId, "Untitled Campaign")}
                            </p>

                            <p
                              style={{
                                fontSize: 12.5,
                                color: "#78716C",
                                marginTop: 4,
                                fontWeight: 500,
                              }}
                            >
                              <span style={{ color: "#57534E", fontWeight: 600 }}>
                                Brand:
                              </span>{" "}
                              {getName(row.brandId, "—")}
                              <span
                                style={{
                                  margin: "0 8px",
                                  color: "#D6D3D1",
                                }}
                              >
                                ·
                              </span>
                              <span
                                style={{ color: "#57534E", fontWeight: 600 }}
                              >
                                Influencer:
                              </span>{" "}
                              {getName(row.influencerId, "—")}
                            </p>
                          </div>

                          {/* Review content */}
                          {(row.reviewTitle || row.reviewText) && (
                            <div
                              style={{
                                marginTop: 12,
                                background: "#F8F7F5",
                                borderRadius: 12,
                                padding: "12px 14px",
                                borderLeft: "3px solid #E7E5E4",
                              }}
                            >
                              {row.reviewTitle && (
                                <p
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: "#1C1917",
                                    marginBottom: 4,
                                  }}
                                >
                                  {row.reviewTitle}
                                </p>
                              )}
                              {row.reviewText && (
                                <p
                                  style={{
                                    fontSize: 12.5,
                                    lineHeight: 1.6,
                                    color: "#78716C",
                                    overflow: "hidden",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                  }}
                                >
                                  {row.reviewText}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Tags */}
                          {row.tags && row.tags.length > 0 && (
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 5,
                                marginTop: 10,
                              }}
                            >
                              {row.tags.map((tag) => (
                                <span
                                  key={tag}
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    background: "#F4F3F0",
                                    border: "1px solid #E7E5E4",
                                    borderRadius: 100,
                                    padding: "2px 9px",
                                    color: "#78716C",
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Meta timestamps */}
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 14,
                              marginTop: 12,
                              paddingTop: 12,
                              borderTop: "1px solid #F4F3F0",
                            }}
                          >
                            {[
                              {
                                label: "Created",
                                value: formatDate(row.createdAt),
                              },
                              {
                                label: "Expires",
                                value: formatDate(row.tokenExpiresAt),
                              },
                              ...(row.submittedAt
                                ? [
                                    {
                                      label: "Submitted",
                                      value: formatDate(row.submittedAt),
                                    },
                                  ]
                                : []),
                            ].map((m) => (
                              <div
                                key={m.label}
                                style={{
                                  display: "flex",
                                  gap: 4,
                                  alignItems: "center",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "#C4BCB7",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.07em",
                                  }}
                                >
                                  {m.label}
                                </span>
                                <span
                                  className="adm-mono"
                                  style={{
                                    fontSize: 11,
                                    color: "#78716C",
                                    fontWeight: 500,
                                  }}
                                >
                                  {m.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* ── Toast notifications ── */}
      {message && <Toast message={message} type="success" />}
      {error && <Toast message={error} type="error" />}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}