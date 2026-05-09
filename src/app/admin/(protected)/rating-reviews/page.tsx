"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
    AlertCircle,
    BarChart3,
    CheckCircle2,
    Clock,
    Copy,
    ExternalLink,
    Filter,
    Link2,
    Loader2,
    MessageSquareText,
    RefreshCw,
    Search,
    ShieldCheck,
    Sparkles,
    Star,
    UserRound,
    UsersRound,
    X,
    XCircle,
    Zap,
} from "lucide-react";
import { get, post } from "@/lib/api";

/* ─── Types ──────────────────────────────────────────────── */

type ReviewType = "brand_to_influencer" | "influencer_to_brand";
type ReviewStatus = "pending" | "submitted" | "expired" | "revoked";
type AnswerType = "emoji_rating" | "single_select" | "multi_select" | "text";

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
    campaignsId?: string;
    customCampaignId?: string;
    title: string;
    status?: string;
    isActive?: boolean | null;
    brand: {
        _id: string;
        name: string;
        email?: string;
    };
    influencers: ReviewOptionInfluencer[];
};

type OptionsResponse = {
    success?: boolean;
    data?: ReviewOptionCampaign[];
    message?: string;
};

type ReviewAnswer = {
    questionKey: string;
    questionLabel?: string;
    answerType: AnswerType;
    value?: any;
    displayValue?: any;
    score?: number | null;
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

    questionnaireVersion?: number;
    responses?: ReviewAnswer[];
    responseMap?: Record<string, ReviewAnswer>;

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

type ToastState = {
    message: string;
    type: "success" | "error";
};

/* ─── Utils ──────────────────────────────────────────────── */

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

function getName(value: PopulatedMini | string | null | undefined, fallback = "—") {
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

function getEntityId(value: PopulatedMini | string | null | undefined) {
    if (!value) return "";
    return typeof value === "string" ? value : value._id || "";
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

function formatCompactDate(value?: string | null) {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatReviewType(value?: string) {
    if (value === "brand_to_influencer") return "Brand → Influencer";
    if (value === "influencer_to_brand") return "Influencer → Brand";
    return "Review";
}

function formatAnswerValue(value: any) {
    if (Array.isArray(value)) return value.join(", ");
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
}

function getReviewTextPreview(row: CampaignReview) {
    if (row.reviewText) return row.reviewText;

    const note =
        row.responseMap?.note?.displayValue ||
        row.responseMap?.note?.value ||
        row.responses?.find((item) => item.questionKey === "note")?.displayValue ||
        row.responses?.find((item) => item.questionKey === "note")?.value;

    return typeof note === "string" ? note : "";
}

function getSubmittedTags(row: CampaignReview) {
    if (Array.isArray(row.tags) && row.tags.length) return row.tags;

    const qualities =
        row.responseMap?.standout_qualities?.displayValue ||
        row.responseMap?.standout_qualities?.value ||
        row.responses?.find((item) => item.questionKey === "standout_qualities")?.displayValue ||
        row.responses?.find((item) => item.questionKey === "standout_qualities")?.value;

    if (Array.isArray(qualities)) return qualities.map(String);
    if (typeof qualities === "string" && qualities.trim()) return [qualities];

    return [];
}

function getDaysUntil(value?: string | null) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function clampExpiryDays(value: string) {
    const num = Number(value);
    if (!Number.isFinite(num)) return 30;
    return Math.min(180, Math.max(1, Math.round(num)));
}

function getInitials(name = "?") {
    return name
        .split(/[\s@._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("") || "?";
}

function uniqueById(items: ReviewOptionInfluencer[]) {
    const map = new Map<string, ReviewOptionInfluencer>();
    items.forEach((item) => {
        if (item?._id && !map.has(item._id)) map.set(item._id, item);
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/* ─── Injected styles ────────────────────────────────────── */

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; }

:root {
  --adm-bg: #F7F6F2;
  --adm-surface: #FFFFFF;
  --adm-surface-soft: #FBFAF7;
  --adm-border: #E7E2D9;
  --adm-border-strong: #D7D0C4;
  --adm-ink: #15130F;
  --adm-muted: #80786B;
  --adm-soft: #AFA79B;
  --adm-primary: #2F2A85;
  --adm-primary-2: #5B4BF5;
  --adm-green: #15803D;
  --adm-blue: #1D4ED8;
  --adm-amber: #B45309;
  --adm-red: #BE123C;
  --adm-orange: #C2410C;
  --adm-shadow: 0 20px 60px rgba(31, 24, 12, 0.08);
  --adm-radius: 24px;
}

.adm-root {
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  min-height: 100vh;
  color: var(--adm-ink);
  background:
    radial-gradient(circle at top left, rgba(91,75,245,0.10), transparent 34%),
    radial-gradient(circle at top right, rgba(245,158,11,0.11), transparent 34%),
    var(--adm-bg);
}

.adm-display { font-family: 'Syne', 'Plus Jakarta Sans', sans-serif; }
.adm-mono { font-family: 'JetBrains Mono', monospace; }

.adm-shell {
  width: min(1480px, calc(100% - 48px));
  margin: 0 auto;
}

.adm-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
.adm-scroll::-webkit-scrollbar-track { background: transparent; }
.adm-scroll::-webkit-scrollbar-thumb { background: #D8D1C8; border-radius: 999px; }

.adm-topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(18px);
  background: rgba(247, 246, 242, 0.82);
  border-bottom: 1px solid rgba(231, 226, 217, 0.85);
}

.adm-topbar-inner {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.adm-brandmark {
  width: 42px;
  height: 42px;
  border-radius: 16px;
  background: linear-gradient(145deg, #302E81, #5B4BF5);
  display: grid;
  place-items: center;
  box-shadow: 0 16px 30px rgba(91,75,245,0.22);
}

.adm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 36px;
  padding: 0 14px;
  border-radius: 13px;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 800;
  cursor: pointer;
  border: 1px solid transparent;
  transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s, background 0.18s, color 0.18s;
  white-space: nowrap;
  text-decoration: none;
}

.adm-btn:hover:not(:disabled) { transform: translateY(-1px); }
.adm-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

.adm-btn-primary {
  color: #fff;
  background: linear-gradient(135deg, #2F2A85, #5B4BF5);
  box-shadow: 0 14px 30px rgba(91, 75, 245, 0.22);
}

.adm-btn-primary:hover:not(:disabled) { box-shadow: 0 18px 38px rgba(91, 75, 245, 0.30); }

.adm-btn-ghost {
  color: #575044;
  background: rgba(255,255,255,0.86);
  border-color: var(--adm-border);
}

.adm-btn-ghost:hover:not(:disabled) {
  background: #fff;
  border-color: var(--adm-border-strong);
  box-shadow: 0 10px 24px rgba(31, 24, 12, 0.07);
}

.adm-btn-danger {
  color: var(--adm-red);
  background: #FFF1F2;
  border-color: #FECDD3;
}

.adm-btn-danger:hover:not(:disabled) { background: #FFE4E6; }

.adm-btn-lg {
  width: 100%;
  min-height: 50px;
  border-radius: 16px;
  font-size: 14px;
}

.adm-hero {
  margin-top: 22px;
  border-radius: 32px;
  padding: 28px;
  overflow: hidden;
  position: relative;
  background:
    linear-gradient(135deg, rgba(21,19,15,0.92), rgba(47,42,133,0.96)),
    radial-gradient(circle at 80% 10%, rgba(251,191,36,0.55), transparent 28%);
  color: #fff;
  box-shadow: var(--adm-shadow);
}

.adm-hero::before,
.adm-hero::after {
  content: '';
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
}

.adm-hero::before {
  width: 220px;
  height: 220px;
  right: -70px;
  top: -80px;
  background: radial-gradient(circle, rgba(251,191,36,0.30), transparent 68%);
}

.adm-hero::after {
  width: 180px;
  height: 180px;
  left: 38%;
  bottom: -110px;
  background: radial-gradient(circle, rgba(165,180,252,0.28), transparent 70%);
}

.adm-hero-content { position: relative; z-index: 1; }

.adm-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.10);
  color: rgba(255,255,255,0.82);
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.adm-hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr);
  gap: 24px;
  align-items: end;
}

.adm-hero h1 {
  margin: 18px 0 8px;
  font-size: clamp(32px, 4vw, 54px);
  line-height: 0.96;
  letter-spacing: -0.045em;
  max-width: 780px;
}

.adm-hero p {
  margin: 0;
  color: rgba(255,255,255,0.70);
  font-size: 14.5px;
  line-height: 1.7;
  max-width: 660px;
  font-weight: 500;
}

.adm-mini-panel {
  background: rgba(255,255,255,0.10);
  border: 1px solid rgba(255,255,255,0.16);
  border-radius: 24px;
  padding: 18px;
  backdrop-filter: blur(18px);
}

.adm-metric-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.adm-stat {
  position: relative;
  overflow: hidden;
  border-radius: 22px;
  border: 1px solid var(--adm-border);
  background: rgba(255,255,255,0.88);
  padding: 16px;
  min-height: 116px;
  box-shadow: 0 14px 34px rgba(31, 24, 12, 0.05);
}

.adm-stat::after {
  content: '';
  position: absolute;
  right: -32px;
  top: -32px;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: var(--stat-glow, rgba(91,75,245,0.10));
}

.adm-stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: var(--stat-bg, rgba(91,75,245,0.10));
  color: var(--stat-color, var(--adm-primary));
  margin-bottom: 14px;
}

.adm-stat-value {
  font-family: 'Syne', sans-serif;
  font-size: 28px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--adm-ink);
}

.adm-stat-label {
  margin-top: 6px;
  color: var(--adm-muted);
  font-size: 12px;
  font-weight: 800;
}

.adm-layout {
  display: grid;
  grid-template-columns: 408px minmax(0, 1fr);
  gap: 18px;
  align-items: start;
  margin: 18px 0 60px;
}

.adm-panel {
  border: 1px solid var(--adm-border);
  background: rgba(255,255,255,0.90);
  border-radius: var(--adm-radius);
  box-shadow: var(--adm-shadow);
  overflow: hidden;
}

.adm-panel-header {
  padding: 20px 22px;
  border-bottom: 1px solid var(--adm-border);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.adm-panel-title {
  font-family: 'Syne', sans-serif;
  font-size: 17px;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0;
}

.adm-panel-subtitle {
  font-size: 12px;
  color: var(--adm-muted);
  font-weight: 600;
  margin-top: 6px;
  line-height: 1.5;
}

.adm-generator {
  position: sticky;
  top: 92px;
}

.adm-generator-head {
  border-bottom: 0;
  background:
    radial-gradient(circle at top right, rgba(251,191,36,0.18), transparent 34%),
    linear-gradient(145deg, #2F2A85, #171441);
  color: #fff;
}

.adm-generator-head .adm-panel-subtitle { color: rgba(255,255,255,0.68); }

.adm-generator-body { padding: 22px; }

.field-stack { display: flex; flex-direction: column; gap: 16px; }

.field-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 10.5px;
  font-weight: 900;
  letter-spacing: 0.1em;
  color: var(--adm-soft);
  text-transform: uppercase;
}

.adm-field,
.adm-select {
  width: 100%;
  height: 46px;
  background: #fff;
  border: 1px solid var(--adm-border);
  border-radius: 16px;
  padding: 0 14px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  color: var(--adm-ink);
  outline: none;
  transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
}

.adm-field:focus,
.adm-select:focus {
  border-color: var(--adm-primary-2);
  box-shadow: 0 0 0 4px rgba(91,75,245,0.10);
}

.adm-field:disabled,
.adm-select:disabled {
  background: #F5F2EE;
  color: var(--adm-soft);
  cursor: not-allowed;
}

.adm-field::placeholder { color: #BDB5AA; font-weight: 600; }

.adm-select {
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='%2380786B' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 40px !important;
  cursor: pointer;
}

.adm-two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.entity-card {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 13px;
  border-radius: 18px;
  border: 1px solid var(--adm-border);
  background: var(--adm-surface-soft);
}

.avatar {
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  border-radius: 15px;
  display: grid;
  place-items: center;
  color: #fff;
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  background: linear-gradient(135deg, #15130F, #5B4BF5);
}

.entity-title {
  font-size: 13px;
  line-height: 1.3;
  font-weight: 900;
  color: var(--adm-ink);
}

.entity-subtitle {
  margin-top: 3px;
  color: var(--adm-muted);
  font-size: 11.5px;
  line-height: 1.35;
  font-weight: 600;
  word-break: break-word;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.005em;
  line-height: 1;
  white-space: nowrap;
  border: 1px solid transparent;
}

.badge-pending   { background: #EFF6FF; color: var(--adm-blue); border-color: #BFDBFE; }
.badge-submitted { background: #F0FDF4; color: var(--adm-green); border-color: #BBF7D0; }
.badge-expired   { background: #FFFBEB; color: var(--adm-amber); border-color: #FDE68A; }
.badge-revoked   { background: #FFF1F2; color: var(--adm-red); border-color: #FECDD3; }
.badge-type-b2i  { background: #F5F3FF; color: #5B21B6; border-color: #DDD6FE; }
.badge-type-i2b  { background: #FFF7ED; color: var(--adm-orange); border-color: #FED7AA; }
.badge-neutral   { background: #F5F2EE; color: #6A6258; border-color: #E7E2D9; }

.link-stack { margin-top: 18px; display: flex; flex-direction: column; gap: 10px; }

.link-card {
  border: 1px solid #BBF7D0;
  background: linear-gradient(180deg, #F0FDF4, #FFFFFF);
  border-radius: 18px;
  padding: 14px;
}

.link-url {
  margin: 10px 0 0;
  font-size: 11px;
  line-height: 1.55;
  color: #166534;
  word-break: break-all;
}

.toolbar {
  padding: 18px 22px;
  border-bottom: 1px solid var(--adm-border);
  background: linear-gradient(180deg, #fff, #FCFBF8);
}

.filter-grid {
  display: grid;
  grid-template-columns: minmax(260px, 1.1fr) minmax(150px, 0.55fr) minmax(190px, 0.7fr) minmax(220px, 0.85fr) minmax(210px, 0.8fr);
  gap: 10px;
  align-items: end;
}

.search-wrap { position: relative; }
.search-wrap svg {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--adm-soft);
  pointer-events: none;
}
.search-wrap input { padding-left: 40px; }

.active-filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.filter-chip {
  border: 1px solid var(--adm-border);
  background: #fff;
  color: var(--adm-muted);
  border-radius: 999px;
  min-height: 30px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 11.5px;
  font-weight: 800;
}

.filter-chip button {
  border: 0;
  background: transparent;
  color: var(--adm-soft);
  cursor: pointer;
  padding: 0;
  display: inline-flex;
}

.review-list {
  padding: 14px;
  max-height: calc(100vh - 272px);
  overflow: auto;
}

.review-card {
  border: 1px solid var(--adm-border);
  background: #fff;
  border-radius: 22px;
  padding: 18px;
  transition: transform 0.18s, border-color 0.18s, box-shadow 0.18s, background 0.18s;
}

.review-card + .review-card { margin-top: 10px; }

.review-card:hover {
  transform: translateY(-1px);
  border-color: var(--adm-border-strong);
  box-shadow: 0 16px 38px rgba(31, 24, 12, 0.06);
}

.review-card.focused {
  border-color: var(--adm-primary-2);
  background: linear-gradient(180deg, #F8F7FF, #fff);
  box-shadow: 0 0 0 4px rgba(91,75,245,0.10);
}

.review-topline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.review-badges,
.review-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
}

.review-actions { justify-content: flex-end; flex-shrink: 0; }

.review-title-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  margin-top: 15px;
  align-items: start;
}

.review-title {
  margin: 0;
  font-family: 'Syne', sans-serif;
  font-size: 18px;
  line-height: 1.2;
  letter-spacing: -0.025em;
  color: var(--adm-ink);
}

.review-meta {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 7px 12px;
  color: var(--adm-muted);
  font-size: 12px;
  line-height: 1.4;
  font-weight: 700;
}

.review-meta strong { color: #514A41; }

.score-pill {
  border: 1px solid #FDE68A;
  background: #FFFBEB;
  color: #92400E;
  border-radius: 16px;
  padding: 9px 11px;
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 900;
}

.star-row {
  display: flex;
  align-items: center;
  gap: 2px;
}

.answer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 9px;
  margin-top: 14px;
}

.answer-item {
  background: #FBFAF7;
  border: 1px solid var(--adm-border);
  border-radius: 16px;
  padding: 12px;
}

.answer-question {
  font-size: 10.5px;
  line-height: 1.35;
  font-weight: 900;
  color: var(--adm-soft);
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.answer-value {
  margin-top: 6px;
  font-size: 12.5px;
  line-height: 1.5;
  font-weight: 800;
  color: #28231E;
}

.review-note {
  margin-top: 14px;
  background: linear-gradient(180deg, #FBFAF7, #F6F2ED);
  border: 1px solid var(--adm-border);
  border-left: 4px solid var(--adm-primary-2);
  border-radius: 18px;
  padding: 14px;
}

.review-note-title {
  margin: 0 0 5px;
  font-size: 13px;
  font-weight: 900;
  color: var(--adm-ink);
}

.review-note-body {
  margin: 0;
  color: var(--adm-muted);
  font-size: 12.5px;
  line-height: 1.65;
  font-weight: 600;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 12px;
}

.tag-chip {
  font-size: 11px;
  font-weight: 800;
  background: #F5F2EE;
  border: 1px solid var(--adm-border);
  border-radius: 999px;
  padding: 4px 10px;
  color: #6A6258;
}

.timeline-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--adm-border);
}

.timeline-item {
  border-radius: 16px;
  background: #FBFAF7;
  padding: 10px 11px;
}

.timeline-label {
  display: block;
  font-size: 10px;
  font-weight: 900;
  color: var(--adm-soft);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}

.timeline-value {
  font-size: 11.5px;
  color: #5D554C;
  font-weight: 700;
  line-height: 1.45;
}

.empty-state,
.loading-state {
  display: grid;
  place-items: center;
  min-height: 340px;
  text-align: center;
  color: var(--adm-muted);
  padding: 34px;
}

.empty-icon,
.loading-icon {
  width: 54px;
  height: 54px;
  border-radius: 20px;
  display: grid;
  place-items: center;
  margin: 0 auto 14px;
  background: #F5F2EE;
  color: var(--adm-primary-2);
}

.empty-title,
.loading-title {
  margin: 0;
  font-family: 'Syne', sans-serif;
  font-size: 18px;
  color: var(--adm-ink);
  letter-spacing: -0.02em;
}

.empty-copy,
.loading-copy {
  margin: 7px auto 0;
  max-width: 420px;
  font-size: 13px;
  line-height: 1.6;
  font-weight: 600;
}

.toast {
  position: fixed;
  right: 26px;
  bottom: 26px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 9px;
  max-width: min(440px, calc(100vw - 32px));
  padding: 13px 16px;
  border-radius: 18px;
  font-size: 13px;
  font-weight: 800;
  box-shadow: 0 18px 60px rgba(31, 24, 12, 0.18);
  animation: slideUp 0.26s ease both;
}

.toast-success { background: #11110F; color: #fff; }
.toast-error { background: #FFF1F2; color: var(--adm-red); border: 1px solid #FECDD3; }

.spin { animation: spin 1s linear infinite; }
.fade-in { animation: fadeIn 0.28s ease both; }

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 1280px) {
  .adm-metric-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .filter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 1040px) {
  .adm-layout,
  .adm-hero-grid { grid-template-columns: 1fr; }
  .adm-generator { position: static; }
  .review-list { max-height: none; }
}

@media (max-width: 760px) {
  .adm-shell { width: min(100% - 28px, 1480px); }
  .adm-topbar-inner { height: auto; padding: 14px 0; align-items: flex-start; }
  .adm-topbar-inner,
  .review-topline,
  .review-title-row { flex-direction: column; display: flex; }
  .review-actions { justify-content: flex-start; }
  .adm-hero { padding: 22px; border-radius: 26px; }
  .adm-metric-grid,
  .filter-grid,
  .adm-two-col,
  .timeline-row { grid-template-columns: 1fr; }
  .adm-panel-header,
  .toolbar,
  .adm-generator-body { padding: 18px; }
  .review-card { padding: 15px; }
  .toast { right: 14px; bottom: 14px; }
}
`;

/* ─── Sub-components ─────────────────────────────────────── */

function StatusBadge({ status }: { status?: string }) {
    const map: Record<string, { cls: string; icon: ReactNode; label: string }> = {
        pending: {
            cls: "badge-pending",
            icon: <Clock style={{ width: 12, height: 12 }} />,
            label: "Pending",
        },
        submitted: {
            cls: "badge-submitted",
            icon: <CheckCircle2 style={{ width: 12, height: 12 }} />,
            label: "Submitted",
        },
        expired: {
            cls: "badge-expired",
            icon: <AlertCircle style={{ width: 12, height: 12 }} />,
            label: "Expired",
        },
        revoked: {
            cls: "badge-revoked",
            icon: <XCircle style={{ width: 12, height: 12 }} />,
            label: "Revoked",
        },
    };

    const config = map[status || ""] ?? {
        cls: "badge-neutral",
        icon: null,
        label: status || "—",
    };

    return (
        <span className={`badge ${config.cls}`}>
            {config.icon}
            {config.label}
        </span>
    );
}

function TypeBadge({ type }: { type?: string }) {
    const cls = type === "brand_to_influencer" ? "badge-type-b2i" : "badge-type-i2b";
    return <span className={`badge ${cls}`}>{formatReviewType(type)}</span>;
}

function StarRow({ rating }: { rating?: number | null }) {
    const value = Math.max(0, Math.min(5, Math.round(Number(rating || 0))));

    return (
        <div className="star-row" aria-label={`${value} star rating`}>
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    style={{
                        width: 13,
                        height: 13,
                        fill: i < value ? "#FBBF24" : "none",
                        color: i < value ? "#FBBF24" : "#D8D1C8",
                    }}
                />
            ))}
        </div>
    );
}

function Toast({ toast }: { toast: ToastState }) {
    return (
        <div className={`toast toast-${toast.type}`}>
            {toast.type === "success" ? (
                <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} />
            ) : (
                <XCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
            )}
            {toast.message}
        </div>
    );
}

function ReviewAnswers({ responses }: { responses?: ReviewAnswer[] }) {
    const visibleResponses = Array.isArray(responses)
        ? responses.filter((answer) => formatAnswerValue(answer.displayValue ?? answer.value) !== "—")
        : [];

    if (visibleResponses.length === 0) return null;

    return (
        <div className="answer-grid">
            {visibleResponses.map((answer) => (
                <div key={answer.questionKey} className="answer-item">
                    <div className="answer-question">{answer.questionLabel || answer.questionKey}</div>
                    <div className="answer-value">
                        {formatAnswerValue(answer.displayValue ?? answer.value)}
                        {answer.score ? ` · ${answer.score}/5` : ""}
                    </div>
                </div>
            ))}
        </div>
    );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
    return (
        <span className="filter-chip">
            {label}
            <button type="button" onClick={onClear} aria-label={`Clear ${label}`}>
                <X style={{ width: 13, height: 13 }} />
            </button>
        </span>
    );
}

function EmptyState({ hasSearch, onClear }: { hasSearch: boolean; onClear: () => void }) {
    return (
        <div className="empty-state">
            <div>
                <div className="empty-icon">
                    <Search style={{ width: 22, height: 22 }} />
                </div>
                <h3 className="empty-title">No review requests found</h3>
                <p className="empty-copy">
                    {hasSearch
                        ? "No records match your current search and filters. Clear filters or try a broader keyword."
                        : "Generated review requests will appear here with their status, rating, answers, expiry, and actions."}
                </p>
                {hasSearch ? (
                    <button type="button" className="adm-btn adm-btn-ghost" onClick={onClear} style={{ marginTop: 16 }}>
                        Clear filters
                    </button>
                ) : null}
            </div>
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
    const [toast, setToast] = useState<ToastState | null>(null);

    const [rows, setRows] = useState<CampaignReview[]>([]);
    const [campaignOptions, setCampaignOptions] = useState<ReviewOptionCampaign[]>([]);
    const [generatedLinks, setGeneratedLinks] = useState<GeneratedLink[]>([]);

    const [search, setSearch] = useState("");
    const [listStatusFilter, setListStatusFilter] = useState("");
    const [listReviewTypeFilter, setListReviewTypeFilter] = useState("");
    const [listCampaignFilter, setListCampaignFilter] = useState("");
    const [listInfluencerFilter, setListInfluencerFilter] = useState("");

    const [selectedCampaignId, setSelectedCampaignId] = useState("");
    const [selectedInfluencerId, setSelectedInfluencerId] = useState("");
    const [reviewType, setReviewType] = useState<"both" | ReviewType>("both");
    const [expiresInDays, setExpiresInDays] = useState("30");

    const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
    }, []);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 4200);
        return () => clearTimeout(timer);
    }, [toast]);

    const selectedCampaign = useMemo(
        () => campaignOptions.find((item) => item._id === selectedCampaignId) || null,
        [campaignOptions, selectedCampaignId]
    );

    const selectedInfluencer = useMemo(
        () => selectedCampaign?.influencers.find((item) => item._id === selectedInfluencerId) || null,
        [selectedCampaign, selectedInfluencerId]
    );

    const listCampaign = useMemo(
        () => campaignOptions.find((item) => item._id === listCampaignFilter) || null,
        [campaignOptions, listCampaignFilter]
    );

    const listInfluencerOptions = useMemo(() => {
        if (listCampaign) return listCampaign.influencers;
        return uniqueById(campaignOptions.flatMap((campaign) => campaign.influencers || []));
    }, [campaignOptions, listCampaign]);

    const brandId = selectedCampaign?.brand?._id || "";
    const listBrandId = listCampaign?.brand?._id || "";

    const buildListQuery = useCallback(() => {
        const params = new URLSearchParams();
        params.set("limit", "100");

        if (listStatusFilter) params.set("status", listStatusFilter);
        if (listReviewTypeFilter) params.set("reviewType", listReviewTypeFilter);
        if (listCampaignFilter) params.set("campaignId", listCampaignFilter);
        if (listBrandId) params.set("brandId", listBrandId);
        if (listInfluencerFilter) params.set("influencerId", listInfluencerFilter);

        return params.toString();
    }, [listStatusFilter, listReviewTypeFilter, listCampaignFilter, listBrandId, listInfluencerFilter]);

    const loadOptions = useCallback(async () => {
        try {
            setOptionsLoading(true);

            const payload = await get<OptionsResponse>("/campaign-reviews/admin/options?limit=300");
            const options = Array.isArray(payload?.data) ? payload.data : [];

            setCampaignOptions(options);
            setSelectedCampaignId((prev) => {
                if (prev && options.some((item) => item._id === prev)) return prev;
                return options[0]?._id || "";
            });
        } catch (err: any) {
            showToast(err?.response?.data?.message || err?.message || "Failed to load campaign options.", "error");
            setCampaignOptions([]);
        } finally {
            setOptionsLoading(false);
        }
    }, [showToast]);

    const loadReviews = useCallback(
        async (showLoader = true) => {
            try {
                if (showLoader) setLoading(true);

                const payload = await get<ListResponse>(`/campaign-reviews/admin?${buildListQuery()}`);
                setRows(Array.isArray(payload?.data) ? payload.data : []);
            } catch (err: any) {
                showToast(err?.response?.data?.message || err?.message || "Failed to load reviews.", "error");
            } finally {
                if (showLoader) setLoading(false);
            }
        },
        [buildListQuery, showToast]
    );

    useEffect(() => {
        void loadOptions();
    }, [loadOptions]);

    useEffect(() => {
        void loadReviews(true);
    }, [loadReviews]);

    useEffect(() => {
        setSelectedInfluencerId((prev) => {
            if (prev && selectedCampaign?.influencers.some((item) => item._id === prev)) return prev;
            return selectedCampaign?.influencers[0]?._id || "";
        });
    }, [selectedCampaign]);

    useEffect(() => {
        if (!listInfluencerFilter) return;
        if (listInfluencerOptions.some((item) => item._id === listInfluencerFilter)) return;
        setListInfluencerFilter("");
    }, [listInfluencerFilter, listInfluencerOptions]);

    const filteredRows = useMemo(() => {
        const term = search.trim().toLowerCase();

        return rows.filter((row) => {
            if (!term) return true;

            const responseText = Array.isArray(row.responses)
                ? row.responses
                    .map((item) => [item.questionKey, item.questionLabel, formatAnswerValue(item.displayValue ?? item.value)].join(" "))
                    .join(" ")
                : "";

            const haystack = [
                row._id,
                row.reviewRequestId,
                row.reviewType,
                row.status,
                row.reviewTitle,
                row.reviewText,
                responseText,
                getName(row.campaignId),
                getName(row.brandId),
                getName(row.influencerId),
                getEntityId(row.campaignId),
                getEntityId(row.brandId),
                getEntityId(row.influencerId),
                row.generatedByAdminName,
                row.generatedByAdminEmail,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return haystack.includes(term);
        });
    }, [rows, search]);

    const stats = useMemo(() => {
        const submittedRows = rows.filter((row) => row.status === "submitted");
        const ratings = submittedRows
            .map((row) => Number(row.rating || 0))
            .filter((value) => Number.isFinite(value) && value > 0);
        const avgRating = ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : 0;
        const expiringSoon = rows.filter((row) => {
            const days = getDaysUntil(row.tokenExpiresAt);
            return row.status === "pending" && days !== null && days >= 0 && days <= 7;
        }).length;

        return {
            total: rows.length,
            submitted: submittedRows.length,
            pending: rows.filter((row) => row.status === "pending").length,
            expired: rows.filter((row) => row.status === "expired").length,
            revoked: rows.filter((row) => row.status === "revoked").length,
            avgRating,
            expiringSoon,
        };
    }, [rows]);

    const activeFilterCount = [listStatusFilter, listReviewTypeFilter, listCampaignFilter, listInfluencerFilter, search.trim()].filter(Boolean).length;

    async function copyToClipboard(value = "") {
        if (!value) return;

        try {
            await navigator.clipboard.writeText(value);
            showToast("Link copied to clipboard");
        } catch {
            showToast("Unable to copy. Please copy manually.", "error");
        }
    }

    function clearAllFilters() {
        setSearch("");
        setListStatusFilter("");
        setListReviewTypeFilter("");
        setListCampaignFilter("");
        setListInfluencerFilter("");
    }

    async function handleGenerateLinks() {
        try {
            if (!selectedCampaignId) throw new Error("Please select a campaign.");
            if (!brandId) throw new Error("Selected campaign has no brand.");
            if (!selectedInfluencerId) throw new Error("Please select an influencer.");

            setSubmitting("generate");
            setGeneratedLinks([]);

            const body: Record<string, any> = {
                campaignId: selectedCampaignId,
                brandId,
                influencerId: selectedInfluencerId,
                expiresInDays: clampExpiryDays(expiresInDays),
            };

            if (reviewType === "both") {
                body.reviewTypes = ["brand_to_influencer", "influencer_to_brand"];
            } else {
                body.reviewType = reviewType;
            }

            const payload = await post<GenerateResponse>("/campaign-reviews/admin/generate-links", body);

            if (payload?.success === false) {
                throw new Error(payload?.message || "Failed to generate links.");
            }

            setGeneratedLinks(Array.isArray(payload?.data) ? payload.data : []);
            showToast(payload?.message || "Review links generated successfully.");
            await loadReviews(false);
        } catch (err: any) {
            showToast(err?.response?.data?.message || err?.message || "Failed to generate links.", "error");
        } finally {
            setSubmitting("");
        }
    }

    async function handleRevoke(reviewId: string) {
        try {
            setSubmitting(`revoke-${reviewId}`);

            const payload = await post<any>(`/campaign-reviews/admin/${reviewId}/revoke`, {});

            if (payload?.success === false) {
                throw new Error(payload?.message || "Failed to revoke link.");
            }

            showToast(payload?.message || "Review link revoked.");
            await loadReviews(false);
        } catch (err: any) {
            showToast(err?.response?.data?.message || err?.message || "Failed to revoke link.", "error");
        } finally {
            setSubmitting("");
        }
    }

    const statCards = [
        {
            label: "Total Requests",
            value: stats.total,
            icon: <BarChart3 style={{ width: 18, height: 18 }} />,
            color: "#5B4BF5",
            bg: "rgba(91,75,245,0.11)",
        },
        {
            label: "Submitted",
            value: stats.submitted,
            icon: <CheckCircle2 style={{ width: 18, height: 18 }} />,
            color: "#15803D",
            bg: "rgba(21,128,61,0.11)",
        },
        {
            label: "Pending",
            value: stats.pending,
            icon: <Clock style={{ width: 18, height: 18 }} />,
            color: "#1D4ED8",
            bg: "rgba(29,78,216,0.11)",
        },
        {
            label: "Expired",
            value: stats.expired,
            icon: <AlertCircle style={{ width: 18, height: 18 }} />,
            color: "#B45309",
            bg: "rgba(180,83,9,0.12)",
        },
        {
            label: "Revoked",
            value: stats.revoked,
            icon: <XCircle style={{ width: 18, height: 18 }} />,
            color: "#BE123C",
            bg: "rgba(190,18,60,0.10)",
        },
        {
            label: "Avg Rating",
            value: stats.avgRating ? stats.avgRating.toFixed(1) : "—",
            icon: <Star style={{ width: 18, height: 18 }} />,
            color: "#C2410C",
            bg: "rgba(194,65,12,0.11)",
        },
    ];

    return (
        <>
            <style>{styles}</style>

            <main className="adm-root">
                <header className="adm-topbar">
                    <div className="adm-shell adm-topbar-inner">
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div className="adm-brandmark">
                                <ShieldCheck style={{ width: 20, height: 20, color: "#fff" }} />
                            </div>
                            <div>
                                <div className="adm-display" style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em" }}>
                                    Ratings & Reviews
                                </div>
                                <div style={{ fontSize: 12, color: "var(--adm-muted)", fontWeight: 700, marginTop: 2 }}>
                                    Admin review-link control center
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            {activeFilterCount > 0 ? <span className="badge badge-neutral">{activeFilterCount} active filter{activeFilterCount > 1 ? "s" : ""}</span> : null}
                            {stats.expiringSoon > 0 ? <span className="badge badge-expired">{stats.expiringSoon} expiring soon</span> : null}
                            <button
                                type="button"
                                onClick={() => {
                                    void loadOptions();
                                    void loadReviews(true);
                                }}
                                disabled={loading || optionsLoading}
                                className="adm-btn adm-btn-ghost"
                            >
                                <RefreshCw style={{ width: 14, height: 14 }} className={loading || optionsLoading ? "spin" : ""} />
                                Refresh
                            </button>
                        </div>
                    </div>
                </header>

                <div className="adm-shell">
                    <section className="adm-hero fade-in">
                        <div className="adm-hero-content adm-hero-grid">
                            <div>
                                <span className="adm-eyebrow">
                                    <Sparkles style={{ width: 13, height: 13 }} />
                                    Campaign Reputation Desk
                                </span>
                                <h1 className="adm-display">Generate, track, and manage every review link clearly.</h1>
                                <p>
                                    Create brand-to-influencer and influencer-to-brand review links, audit pending requests, inspect submitted answers, and revoke links from one polished admin workspace.
                                </p>
                            </div>

                            <div className="adm-mini-panel">
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.09em", textTransform: "uppercase", color: "rgba(255,255,255,0.60)" }}>
                                            Current View
                                        </div>
                                        <div className="adm-display" style={{ marginTop: 6, fontSize: 30, fontWeight: 800, letterSpacing: "-0.04em" }}>
                                            {filteredRows.length}
                                        </div>
                                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.66)", fontWeight: 700 }}>
                                            visible review request{filteredRows.length !== 1 ? "s" : ""}
                                        </div>
                                    </div>
                                    <div style={{ width: 54, height: 54, borderRadius: 20, display: "grid", placeItems: "center", background: "rgba(255,255,255,0.12)" }}>
                                        <MessageSquareText style={{ width: 24, height: 24, color: "#FDE68A" }} />
                                    </div>
                                </div>

                                <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.14)", paddingTop: 12 }}>
                                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.58)", fontWeight: 800 }}>Campaigns</div>
                                        <div style={{ fontSize: 18, fontWeight: 900, marginTop: 3 }}>{campaignOptions.length}</div>
                                    </div>
                                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.14)", paddingTop: 12 }}>
                                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.58)", fontWeight: 800 }}>Pending</div>
                                        <div style={{ fontSize: 18, fontWeight: 900, marginTop: 3 }}>{stats.pending}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="adm-metric-grid">
                        {statCards.map((item) => (
                            <article
                                key={item.label}
                                className="adm-stat fade-in"
                                style={{
                                    ["--stat-color" as any]: item.color,
                                    ["--stat-bg" as any]: item.bg,
                                    ["--stat-glow" as any]: item.bg,
                                }}
                            >
                                <div className="adm-stat-icon">{item.icon}</div>
                                <div className="adm-stat-value">{item.value}</div>
                                <div className="adm-stat-label">{item.label}</div>
                            </article>
                        ))}
                    </section>

                    <div className="adm-layout">
                        <aside className="adm-panel adm-generator">
                            <div className="adm-panel-header adm-generator-head">
                                <div>
                                    <h2 className="adm-panel-title">Generate Review Link</h2>
                                    <div className="adm-panel-subtitle">Choose a campaign, influencer, review direction, and expiry window.</div>
                                </div>
                                <div style={{ width: 42, height: 42, borderRadius: 16, background: "rgba(255,255,255,0.13)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                                    <Zap style={{ width: 20, height: 20, color: "#FDE68A" }} />
                                </div>
                            </div>

                            <div className="adm-generator-body">
                                <div className="field-stack">
                                    <div>
                                        <label className="field-label">Campaign</label>
                                        <select
                                            className="adm-select"
                                            value={selectedCampaignId}
                                            onChange={(event) => setSelectedCampaignId(event.target.value)}
                                            disabled={optionsLoading}
                                        >
                                            {optionsLoading ? (
                                                <option value="">Loading campaigns…</option>
                                            ) : campaignOptions.length === 0 ? (
                                                <option value="">No campaigns found</option>
                                            ) : (
                                                <>
                                                    <option value="">Select campaign</option>
                                                    {campaignOptions.map((campaign) => (
                                                        <option key={campaign._id} value={campaign._id}>
                                                            {campaign.title} · {campaign.brand?.name || "Brand"}
                                                        </option>
                                                    ))}
                                                </>
                                            )}
                                        </select>
                                    </div>

                                    <div className="entity-card">
                                        <div className="avatar">{getInitials(selectedCampaign?.brand?.name || "Brand")}</div>
                                        <div style={{ minWidth: 0 }}>
                                            <div className="entity-title">{selectedCampaign?.brand?.name || "Select campaign to view brand"}</div>
                                            <div className="entity-subtitle">
                                                {selectedCampaign?.brand?.email || selectedCampaign?.title || "Brand details will appear here."}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="field-label">Influencer</label>
                                        <select
                                            className="adm-select"
                                            value={selectedInfluencerId}
                                            onChange={(event) => setSelectedInfluencerId(event.target.value)}
                                            disabled={!selectedCampaign || selectedCampaign.influencers.length === 0}
                                        >
                                            {!selectedCampaign ? (
                                                <option value="">Select campaign first</option>
                                            ) : selectedCampaign.influencers.length === 0 ? (
                                                <option value="">No approved influencers</option>
                                            ) : (
                                                <>
                                                    <option value="">Select influencer</option>
                                                    {selectedCampaign.influencers.map((influencer) => (
                                                        <option key={influencer._id} value={influencer._id}>
                                                            {influencer.name}{influencer.email ? ` · ${influencer.email}` : ""}
                                                        </option>
                                                    ))}
                                                </>
                                            )}
                                        </select>
                                    </div>

                                    {selectedInfluencer ? (
                                        <div className="entity-card" style={{ background: "#F5F3FF", borderColor: "#DDD6FE" }}>
                                            <div className="avatar" style={{ background: "linear-gradient(135deg, #4C1D95, #7C3AED)" }}>
                                                {getInitials(selectedInfluencer.name)}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <div className="entity-title" style={{ color: "#4C1D95" }}>{selectedInfluencer.name}</div>
                                                <div className="entity-subtitle" style={{ color: "#6D28D9" }}>
                                                    {[selectedInfluencer.email, selectedInfluencer.username].filter(Boolean).join(" · ") || "Influencer selected"}
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}

                                    <div className="adm-two-col">
                                        <div>
                                            <label className="field-label">Generate For</label>
                                            <select className="adm-select" value={reviewType} onChange={(event) => setReviewType(event.target.value as any)}>
                                                <option value="both">Both Links</option>
                                                <option value="brand_to_influencer">Brand reviews Influencer</option>
                                                <option value="influencer_to_brand">Influencer reviews Brand</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="field-label">Expiry Days</label>
                                            <input
                                                className="adm-field"
                                                type="number"
                                                min={1}
                                                max={180}
                                                value={expiresInDays}
                                                onChange={(event) => setExpiresInDays(event.target.value)}
                                                onBlur={() => setExpiresInDays(String(clampExpiryDays(expiresInDays)))}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        className="adm-btn adm-btn-primary adm-btn-lg"
                                        onClick={handleGenerateLinks}
                                        disabled={submitting === "generate" || optionsLoading}
                                    >
                                        {submitting === "generate" ? <Loader2 style={{ width: 16, height: 16 }} className="spin" /> : <Link2 style={{ width: 16, height: 16 }} />}
                                        {submitting === "generate" ? "Generating Links…" : "Generate Review Link"}
                                    </button>
                                </div>

                                {generatedLinks.length > 0 ? (
                                    <div className="link-stack">
                                        <div className="badge badge-submitted" style={{ alignSelf: "flex-start" }}>
                                            <CheckCircle2 style={{ width: 12, height: 12 }} />
                                            Generated Links
                                        </div>

                                        {generatedLinks.map((item) => (
                                            <div key={item._id} className="link-card fade-in">
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                                                    <TypeBadge type={item.reviewType} />
                                                    <div style={{ display: "flex", gap: 6 }}>
                                                        <button type="button" className="adm-btn adm-btn-ghost" onClick={() => copyToClipboard(item.publicUrl)} style={{ minHeight: 31, padding: "0 11px" }}>
                                                            <Copy style={{ width: 12, height: 12 }} />
                                                            Copy
                                                        </button>
                                                        <a href={item.publicUrl} target="_blank" rel="noreferrer" className="adm-btn adm-btn-ghost" style={{ minHeight: 31, padding: "0 11px" }}>
                                                            <ExternalLink style={{ width: 12, height: 12 }} />
                                                            Open
                                                        </a>
                                                    </div>
                                                </div>
                                                <p className="adm-mono link-url">{item.publicUrl}</p>
                                                {item.expiresAt ? <div style={{ marginTop: 8, fontSize: 11.5, color: "#166534", fontWeight: 800 }}>Expires: {formatDate(item.expiresAt)}</div> : null}
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        </aside>

                        <section className="adm-panel">
                            <div className="adm-panel-header">
                                <div>
                                    <h2 className="adm-panel-title">Review Requests</h2>
                                    <div className="adm-panel-subtitle">
                                        Showing {filteredRows.length} of {rows.length} request{rows.length !== 1 ? "s" : ""}.
                                    </div>
                                </div>
                                <div className="badge badge-neutral">
                                    <Filter style={{ width: 12, height: 12 }} />
                                    Filters
                                </div>
                            </div>

                            <div className="toolbar">
                                <div className="filter-grid">
                                    <div className="search-wrap">
                                        <Search style={{ width: 15, height: 15 }} />
                                        <input className="adm-field" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search campaign, brand, influencer, answer…" />
                                    </div>

                                    <select className="adm-select" value={listStatusFilter} onChange={(event) => setListStatusFilter(event.target.value)}>
                                        <option value="">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="submitted">Submitted</option>
                                        <option value="expired">Expired</option>
                                        <option value="revoked">Revoked</option>
                                    </select>

                                    <select className="adm-select" value={listReviewTypeFilter} onChange={(event) => setListReviewTypeFilter(event.target.value)}>
                                        <option value="">All Review Types</option>
                                        <option value="brand_to_influencer">Brand → Influencer</option>
                                        <option value="influencer_to_brand">Influencer → Brand</option>
                                    </select>

                                    <select className="adm-select" value={listCampaignFilter} onChange={(event) => setListCampaignFilter(event.target.value)} disabled={optionsLoading}>
                                        <option value="">All Campaigns</option>
                                        {campaignOptions.map((campaign) => (
                                            <option key={campaign._id} value={campaign._id}>{campaign.title}</option>
                                        ))}
                                    </select>

                                    <select className="adm-select" value={listInfluencerFilter} onChange={(event) => setListInfluencerFilter(event.target.value)} disabled={listInfluencerOptions.length === 0}>
                                        <option value="">All Influencers</option>
                                        {listInfluencerOptions.map((influencer) => (
                                            <option key={influencer._id} value={influencer._id}>{influencer.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {activeFilterCount > 0 ? (
                                    <div className="active-filter-row">
                                        {search.trim() ? <FilterChip label={`Search: ${search.trim()}`} onClear={() => setSearch("")} /> : null}
                                        {listStatusFilter ? <FilterChip label={`Status: ${listStatusFilter}`} onClear={() => setListStatusFilter("")} /> : null}
                                        {listReviewTypeFilter ? <FilterChip label={`Type: ${formatReviewType(listReviewTypeFilter)}`} onClear={() => setListReviewTypeFilter("")} /> : null}
                                        {listCampaignFilter ? <FilterChip label={`Campaign: ${listCampaign?.title || listCampaignFilter}`} onClear={() => setListCampaignFilter("")} /> : null}
                                        {listInfluencerFilter ? <FilterChip label={`Influencer: ${listInfluencerOptions.find((item) => item._id === listInfluencerFilter)?.name || listInfluencerFilter}`} onClear={() => setListInfluencerFilter("")} /> : null}
                                        <button type="button" className="adm-btn adm-btn-ghost" onClick={clearAllFilters} style={{ minHeight: 30, padding: "0 11px" }}>
                                            Clear all
                                        </button>
                                    </div>
                                ) : null}
                            </div>

                            <div className="review-list adm-scroll">
                                {loading ? (
                                    <div className="loading-state">
                                        <div>
                                            <div className="loading-icon">
                                                <Loader2 style={{ width: 24, height: 24 }} className="spin" />
                                            </div>
                                            <h3 className="loading-title">Loading reviews…</h3>
                                            <p className="loading-copy">Fetching the latest review requests, statuses, and submitted responses.</p>
                                        </div>
                                    </div>
                                ) : filteredRows.length === 0 ? (
                                    <EmptyState hasSearch={activeFilterCount > 0} onClear={clearAllFilters} />
                                ) : (
                                    filteredRows.map((row) => {
                                        const focused = Boolean(focusReviewId) && row._id === focusReviewId;
                                        const preview = getReviewTextPreview(row);
                                        const tags = getSubmittedTags(row);
                                        const expiresIn = getDaysUntil(row.tokenExpiresAt);
                                        const showPendingLink = row.publicUrl && row.status === "pending";

                                        return (
                                            <article key={row._id} className={cx("review-card fade-in", focused && "focused")}>
                                                <div className="review-topline">
                                                    <div className="review-badges">
                                                        <TypeBadge type={row.reviewType} />
                                                        <StatusBadge status={row.status} />
                                                        {row.questionnaireVersion ? (
                                                            <span className="badge badge-neutral">
                                                                <MessageSquareText style={{ width: 12, height: 12 }} />
                                                                Form v{row.questionnaireVersion}
                                                            </span>
                                                        ) : null}
                                                        {row.status === "pending" && expiresIn !== null && expiresIn >= 0 && expiresIn <= 7 ? (
                                                            <span className="badge badge-expired">Expires in {expiresIn}d</span>
                                                        ) : null}
                                                    </div>

                                                    <div className="review-actions">
                                                        {showPendingLink ? (
                                                            <>
                                                                <button type="button" className="adm-btn adm-btn-ghost" onClick={() => copyToClipboard(row.publicUrl || "")}>
                                                                    <Copy style={{ width: 13, height: 13 }} />
                                                                    Copy
                                                                </button>
                                                                <a href={row.publicUrl} target="_blank" rel="noreferrer" className="adm-btn adm-btn-ghost">
                                                                    <ExternalLink style={{ width: 13, height: 13 }} />
                                                                    Open
                                                                </a>
                                                            </>
                                                        ) : null}

                                                        {row.status === "pending" ? (
                                                            <button type="button" className="adm-btn adm-btn-danger" onClick={() => handleRevoke(row._id)} disabled={submitting === `revoke-${row._id}`}>
                                                                {submitting === `revoke-${row._id}` ? <Loader2 style={{ width: 13, height: 13 }} className="spin" /> : <XCircle style={{ width: 13, height: 13 }} />}
                                                                Revoke
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                <div className="review-title-row">
                                                    <div>
                                                        <h3 className="review-title">{getName(row.campaignId, "Untitled Campaign")}</h3>
                                                        <div className="review-meta">
                                                            <span><strong>Brand:</strong> {getName(row.brandId)}</span>
                                                            <span><strong>Influencer:</strong> {getName(row.influencerId)}</span>
                                                            {row.generatedByAdminName || row.generatedByAdminEmail ? (
                                                                <span><strong>Generated by:</strong> {row.generatedByAdminName || row.generatedByAdminEmail}</span>
                                                            ) : null}
                                                        </div>
                                                    </div>

                                                    {row.rating ? (
                                                        <div className="score-pill">
                                                            <StarRow rating={row.rating} />
                                                            <span>{Number(row.rating).toFixed(1)}</span>
                                                        </div>
                                                    ) : null}
                                                </div>

                                                <ReviewAnswers responses={row.responses} />

                                                {preview ? (
                                                    <div className="review-note">
                                                        {row.reviewTitle ? <p className="review-note-title">{row.reviewTitle}</p> : null}
                                                        <p className="review-note-body">{preview}</p>
                                                    </div>
                                                ) : null}

                                                {tags.length > 0 ? (
                                                    <div className="tag-row">
                                                        {tags.map((tag) => (
                                                            <span key={tag} className="tag-chip">{tag}</span>
                                                        ))}
                                                    </div>
                                                ) : null}

                                                <div className="timeline-row">
                                                    <div className="timeline-item">
                                                        <span className="timeline-label">Created</span>
                                                        <span className="timeline-value adm-mono">{formatDate(row.createdAt)}</span>
                                                    </div>
                                                    <div className="timeline-item">
                                                        <span className="timeline-label">Expires</span>
                                                        <span className="timeline-value adm-mono">{formatDate(row.tokenExpiresAt)}</span>
                                                    </div>
                                                    <div className="timeline-item">
                                                        <span className="timeline-label">Submitted</span>
                                                        <span className="timeline-value adm-mono">{row.submittedAt ? formatDate(row.submittedAt) : formatCompactDate(row.updatedAt)}</span>
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {toast ? <Toast toast={toast} /> : null}
        </>
    );
}
