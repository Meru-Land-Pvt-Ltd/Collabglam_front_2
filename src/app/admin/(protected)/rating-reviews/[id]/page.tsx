"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
    BarChart3,
    Building2,
    CheckCircle2,
    ChevronLeft,
    Eye,
    Filter,
    Globe2,
    MessageSquareText,
    RefreshCw,
    Search,
    Star,
    UserRound,
    X,
    XCircle,
} from "lucide-react";
import { get } from "@/lib/api";
import AdminTable, { type AdminTableColumn } from "../../../components/table";

type ReviewType = "brand_to_influencer" | "influencer_to_brand" | "brand_to_platform" | "influencer_to_platform";
type ReviewStatus = "pending" | "submitted" | "skipped" | "expired" | "revoked";
type ReviewRole = "brand" | "influencer" | "platform" | "admin";
type RatingTab = "brand" | "influencer" | "campaign" | "platform";

type MiniEntity = {
    _id?: string;
    key?: string;
    name?: string;
    title?: string;
    campaignTitle?: string;
    brandName?: string;
    companyName?: string;
    influencerName?: string;
    fullName?: string;
    username?: string;
    handle?: string;
    email?: string;
    image?: string;
    avatar?: string;
    profilePic?: string;
    profileImage?: string;
    profilePicture?: string;
    logo?: string;
    brandLogo?: string;
    picture?: string;
};

type ReviewMetrics = {
    workQuality?: number;
    communication?: number;
    timeliness?: number;
    professionalism?: number;
    valueForMoney?: number;
    platformExperience?: number;
    supportExperience?: number;
    wouldRecommend?: number;
};

type ReviewAnswer = {
    questionKey?: string;
    questionLabel?: string;
    answerType?: string;
    value?: unknown;
    displayValue?: unknown;
    score?: number | null;
};

type ReviewSnapshot = {
    role?: ReviewRole;
    entityId?: string;
    name?: string;
    email?: string;
    handle?: string;
    image?: string;
};

type AdminReview = {
    _id: string;
    reviewRequestId?: string;
    reviewType: ReviewType;
    reviewerRole?: ReviewRole;
    revieweeRole?: ReviewRole;
    status: ReviewStatus;
    submittedVia?: string;
    sourceEntityType?: string;
    sourceEntityId?: string;
    rating?: number | null;
    noteStarRating?: number | null;
    reviewTitle?: string;
    reviewText?: string;
    privateFeedback?: string;
    tags?: string[];
    metrics?: ReviewMetrics;
    ratings?: ReviewMetrics;
    responses?: ReviewAnswer[];
    responseMap?: Record<string, ReviewAnswer>;
    firstSubmittedAt?: string;
    submittedAt?: string;
    reviewUpdatedAt?: string;
    reviewUpdateCount?: number;
    skippedAt?: string;
    skippedVia?: string;
    skipReason?: string;
    tokenExpiresAt?: string;
    publicUrl?: string;
    createdAt?: string;
    updatedAt?: string;
    campaign?: MiniEntity | null;
    brand?: MiniEntity | null;
    influencer?: MiniEntity | null;
    platform?: MiniEntity | null;
    reviewer?: ReviewSnapshot | null;
    reviewee?: ReviewSnapshot | null;
    campaignId?: MiniEntity | string | null;
    brandId?: MiniEntity | string | null;
    influencerId?: MiniEntity | string | null;
};

type AdminListResponse = {
    success?: boolean;
    data?: AdminReview[];
    total?: number;
    page?: number;
    limit?: number;
    message?: string;
};

type ToastState = { message: string; type: "success" | "error" };
type SubmittedAnswer = { question: string; answer: string; score?: number | null };

const REVIEW_TYPE_LABEL: Record<ReviewType, string> = {
    brand_to_influencer: "Brand to Influencer",
    influencer_to_brand: "Influencer to Brand",
    brand_to_platform: "Brand to Platform",
    influencer_to_platform: "Influencer to Platform",
};

const METRIC_LABELS: Array<[keyof ReviewMetrics, string]> = [
    ["workQuality", "Work Quality"],
    ["communication", "Communication"],
    ["timeliness", "Timeliness"],
    ["professionalism", "Professionalism"],
    ["valueForMoney", "Value for Money"],
    ["platformExperience", "Platform Experience"],
    ["supportExperience", "Support Experience"],
    ["wouldRecommend", "Would Recommend"],
];

function safeNumber(value: unknown, fallback = 0): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function round1(value: unknown): string {
    return safeNumber(value).toFixed(1);
}

function normalizeText(value = ""): string {
    return String(value).split("_").join(" ");
}

function formatDate(value?: string | null): string {
    if (!value) return "-";
    const d = new Date(value);
    return Number.isNaN(d.getTime())
        ? "-"
        : d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function stringifyAnswer(value: unknown): string {
    if (value === undefined || value === null || value === "") return "-";
    if (Array.isArray(value)) return value.map((v: unknown): string => stringifyAnswer(v)).join(", ");
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
}

function getEntityName(value?: MiniEntity | ReviewSnapshot | string | null, fallback = "-"): string {
    if (!value) return fallback;
    if (typeof value === "string") return value;
    return (
        value.name ||
        ("campaignTitle" in value ? value.campaignTitle : "") ||
        ("title" in value ? value.title : "") ||
        ("brandName" in value ? value.brandName : "") ||
        ("companyName" in value ? value.companyName : "") ||
        ("influencerName" in value ? value.influencerName : "") ||
        ("fullName" in value ? value.fullName : "") ||
        ("username" in value ? value.username : "") ||
        value.email ||
        ("key" in value ? value.key : "") ||
        fallback
    );
}

function getEntityImage(value?: MiniEntity | ReviewSnapshot | null): string {
    if (!value) return "";
    return (
        value.image ||
        ("avatar" in value ? value.avatar : "") ||
        ("profilePic" in value ? value.profilePic : "") ||
        ("profileImage" in value ? value.profileImage : "") ||
        ("profilePicture" in value ? value.profilePicture : "") ||
        ("logo" in value ? value.logo : "") ||
        ("brandLogo" in value ? value.brandLogo : "") ||
        ("picture" in value ? value.picture : "") ||
        ""
    );
}

function getInitials(name = "?"): string {
    const cleaned = String(name || "?")
        .split("@")
        .join(" ")
        .split(".")
        .join(" ")
        .split("_")
        .join(" ")
        .split("-")
        .join(" ");

    return (
        cleaned
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p.charAt(0).toUpperCase())
            .join("") || "?"
    );
}

function buildQuery(params: Record<string, string | number | undefined | null>): string {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== "") {
            q.set(key, String(value).trim());
        }
    });
    return q.toString();
}

function getReviewTypeLabel(type?: ReviewType | string): string {
    return REVIEW_TYPE_LABEL[type as ReviewType] || "Review";
}

function tabToRevieweeRole(tab: RatingTab): ReviewRole | "" {
    if (tab === "brand") return "brand";
    if (tab === "influencer") return "influencer";
    if (tab === "platform") return "platform";
    return "";
}

function getReviewer(review: AdminReview): MiniEntity | ReviewSnapshot | null {
    if (review.reviewer) return review.reviewer;
    if (review.reviewerRole === "brand") return review.brand || null;
    if (review.reviewerRole === "influencer") return review.influencer || null;
    return null;
}

function getReviewee(review: AdminReview): MiniEntity | ReviewSnapshot | null {
    if (review.reviewee) return review.reviewee;
    if (review.revieweeRole === "brand") return review.brand || null;
    if (review.revieweeRole === "influencer") return review.influencer || null;
    return review.platform || { name: "CollabGlam" };
}

function getCampaignName(review: AdminReview): string {
    const campaign = review.campaign || (typeof review.campaignId === "object" ? review.campaignId : null);
    return getEntityName(campaign, "No campaign");
}

function getSubmittedAnswers(review: AdminReview): SubmittedAnswer[] {
    const answers: SubmittedAnswer[] = [];
    const seen = new Set<string>();

    const pushAnswer = (question: string, answer: unknown, score?: number | null) => {
        const label = question || "Question";
        const value = stringifyAnswer(answer);
        const key = `${label}:${value}`;
        if (value === "-" || seen.has(key)) return;
        seen.add(key);
        answers.push({ question: label, answer: value, score });
    };

    if (Array.isArray(review.responses)) {
        review.responses.forEach((item) => pushAnswer(item.questionLabel || item.questionKey || "Question", item.displayValue ?? item.value, item.score));
    }

    if (review.responseMap && typeof review.responseMap === "object") {
        Object.entries(review.responseMap).forEach(([key, item]) =>
            pushAnswer(item.questionLabel || item.questionKey || normalizeText(key), item.displayValue ?? item.value, item.score)
        );
    }

    if (!answers.length) {
        pushAnswer("Overall rating", review.rating || review.noteStarRating);
        pushAnswer("Review text", review.reviewText);
        pushAnswer("Private feedback", review.privateFeedback);
        pushAnswer("Tags submitted", review.tags?.length ? review.tags.map(normalizeText).join(", ") : "");
        const metrics = review.metrics || review.ratings || {};
        METRIC_LABELS.forEach(([key, label]) => {
            if (safeNumber(metrics[key]) > 0) pushAnswer(label, `${safeNumber(metrics[key]).toFixed(1)} / 5`);
        });
    }

    return answers;
}

function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: "gray" | "green" | "blue" | "orange" | "red" | "purple" | "yellow" }) {
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                borderRadius: 999,
                padding: "5px 9px",
                fontSize: 11,
                fontWeight: 850,
                whiteSpace: "nowrap",
                background:
                    tone === "green"
                        ? "#ecfdf5"
                        : tone === "blue"
                            ? "#eff6ff"
                            : tone === "orange"
                                ? "#fff7ed"
                                : tone === "red"
                                    ? "#fff1f2"
                                    : tone === "purple"
                                        ? "#f5f3ff"
                                        : tone === "yellow"
                                            ? "#fffbeb"
                                            : "#f1f5f9",
                color:
                    tone === "green"
                        ? "#047857"
                        : tone === "blue"
                            ? "#1d4ed8"
                            : tone === "orange"
                                ? "#c2410c"
                                : tone === "red"
                                    ? "#be123c"
                                    : tone === "purple"
                                        ? "#6d28d9"
                                        : tone === "yellow"
                                            ? "#92400e"
                                            : "#475569",
                border:
                    tone === "green"
                        ? "1px solid #bbf7d0"
                        : tone === "blue"
                            ? "1px solid #bfdbfe"
                            : tone === "orange"
                                ? "1px solid #fed7aa"
                                : tone === "red"
                                    ? "1px solid #fecdd3"
                                    : tone === "purple"
                                        ? "1px solid #ddd6fe"
                                        : tone === "yellow"
                                            ? "1px solid #fde68a"
                                            : "1px solid #e2e8f0",
            }}
        >
            {children}
        </span>
    );
}

function StatusBadge({ status }: { status?: ReviewStatus | string }) {
    if (status === "submitted") return <Badge tone="green"><CheckCircle2 size={12} /> Submitted</Badge>;
    if (status === "pending") return <Badge tone="blue">Pending</Badge>;
    if (status === "skipped") return <Badge tone="orange"><X size={12} /> Skipped</Badge>;
    if (status === "expired") return <Badge tone="yellow"><XCircle size={12} /> Expired</Badge>;
    if (status === "revoked") return <Badge tone="red"><XCircle size={12} /> Revoked</Badge>;
    return <Badge>{status || "-"}</Badge>;
}

function TypeBadge({ type }: { type?: ReviewType | string }) {
    const tone = type?.includes("platform") ? "purple" : type === "brand_to_influencer" ? "blue" : "orange";
    return <Badge tone={tone}>{getReviewTypeLabel(type)}</Badge>;
}

function Avatar({ entity, icon: Icon }: { entity?: MiniEntity | ReviewSnapshot | null; icon?: typeof Building2 }) {
    const name = getEntityName(entity, "User");
    const image = getEntityImage(entity);

    return (
        <div
            style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "#eef2ff",
                color: "#3730a3",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: 13,
                overflow: "hidden",
                flexShrink: 0,
            }}
        >
            {image ? (
                <img src={image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : Icon ? (
                <Icon size={18} />
            ) : (
                getInitials(name)
            )}
        </div>
    );
}

function Stars({ rating = 0 }: { rating?: number | null }) {
    const value = Math.max(0, Math.min(5, Math.round(safeNumber(rating))));
    return (
        <span style={{ display: "inline-flex", gap: 1, alignItems: "center" }}>
            {Array.from({ length: 5 }).map((_, index) => (
                <Star
                    key={index}
                    size={13}
                    style={{ color: index < value ? "#f59e0b" : "#cbd5e1", fill: index < value ? "#f59e0b" : "none" }}
                />
            ))}
        </span>
    );
}

function RatingPill({ rating }: { rating?: number | null }) {
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                border: "1px solid #fde68a",
                background: "#fffbeb",
                color: "#92400e",
                borderRadius: 999,
                padding: "6px 9px",
                fontSize: 12,
                fontWeight: 950,
                whiteSpace: "nowrap",
            }}
        >
            <Stars rating={rating} />
            {round1(rating)}
        </span>
    );
}

function Toast({ toast }: { toast: ToastState }) {
    return (
        <div
            style={{
                position: "fixed",
                right: 20,
                bottom: 20,
                zIndex: 120,
                borderRadius: 12,
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                fontWeight: 850,
                boxShadow: "0 18px 45px rgba(15, 23, 42, 0.18)",
                background: toast.type === "success" ? "#111827" : "#fff1f2",
                color: toast.type === "success" ? "#fff" : "#be123c",
                border: toast.type === "success" ? "1px solid #111827" : "1px solid #fecdd3",
            }}
        >
            {toast.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {toast.message}
        </div>
    );
}

function EmptyState({ title = "No reviews found", copy = "Ratings and reviews will appear here." }: { title?: string; copy?: string }) {
    return (
        <div style={{ padding: 36, textAlign: "center", color: "#64748b" }}>
            <MessageSquareText size={28} color="#94a3b8" />
            <h3 style={{ margin: "10px 0 4px", fontSize: 16, fontWeight: 900, color: "#111827" }}>{title}</h3>
            <p style={{ margin: 0, lineHeight: 1.6 }}>{copy}</p>
        </div>
    );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                border: "1px solid #d9dee8",
                background: "#f8fafc",
                borderRadius: 999,
                minHeight: 30,
                padding: "0 10px",
                fontSize: 12,
                fontWeight: 750,
                color: "#475569",
            }}
        >
            {label}
            <button
                type="button"
                style={{ border: 0, background: "transparent", padding: 0, display: "inline-flex", cursor: "pointer", color: "#64748b" }}
                onClick={onClear}
            >
                <X size={13} />
            </button>
        </span>
    );
}

function EntitySmall({ entity, role }: { entity?: MiniEntity | ReviewSnapshot | null; role?: string }) {
    const icon = role === "brand" ? Building2 : role === "influencer" ? UserRound : Globe2;
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <Avatar entity={entity} icon={icon} />
            <div style={{ minWidth: 0 }}>
                <div
                    style={{
                        margin: 0,
                        fontSize: 14,
                        color: "#111827",
                        fontWeight: 900,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                >
                    {getEntityName(entity, "-")}
                </div>
                <div style={{ margin: "3px 0 0", fontSize: 12, color: "#64748b", lineHeight: 1.4, textTransform: "capitalize" }}>{role || "-"}</div>
            </div>
        </div>
    );
}

function AnswerPreview({ review }: { review: AdminReview }) {
    const answers = getSubmittedAnswers(review);
    const firstAnswer = answers[0];
    return (
        <div style={{ maxWidth: 420 }}>
            <strong style={{ fontSize: 14, fontWeight: 900, color: "#111827" }}>
                {answers.length} submitted answer{answers.length === 1 ? "" : "s"}
            </strong>
            {firstAnswer ? (
                <p
                    style={{
                        margin: "4px 0 0",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        fontSize: 12,
                        fontWeight: 500,
                        lineHeight: 1.6,
                        color: "#64748b",
                    }}
                >
                    {firstAnswer.question}: {firstAnswer.answer}
                </p>
            ) : null}
        </div>
    );
}

function ReviewInfoModal({ review, onClose }: { review: AdminReview | null; onClose: () => void }) {
    if (!review) return null;

    const reviewer = getReviewer(review);
    const reviewee = getReviewee(review);
    const answers = getSubmittedAnswers(review);
    const tags = Array.isArray(review.tags) ? review.tags : [];

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 100,
                background: "rgba(15, 23, 42, 0.35)",
                display: "flex",
                justifyContent: "flex-end",
            }}
            onClick={onClose}
        >
            <aside
                style={{
                    width: "min(660px, 100%)",
                    height: "100%",
                    background: "#fff",
                    boxShadow: "-18px 0 50px rgba(15, 23, 42, 0.18)",
                    display: "flex",
                    flexDirection: "column",
                }}
                onClick={(event) => event.stopPropagation()}
            >
                <div
                    style={{
                        padding: 18,
                        borderBottom: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 12,
                        background: "#f8fafc",
                    }}
                >
                    <div>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 950, color: "#111827" }}>{review.reviewTitle || getReviewTypeLabel(review.reviewType)}</h2>
                        <p style={{ margin: "5px 0 0", fontSize: 13, color: "#64748b", lineHeight: 1.55 }}>Full submitted rating details, answers, campaign info, and tags.</p>
                    </div>
                    <button
                        type="button"
                        style={{
                            width: 40,
                            height: 40,
                            border: "1px solid #d9dee8",
                            borderRadius: 12,
                            background: "#fff",
                            color: "#111827",
                            padding: 0,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            fontSize: 13,
                            fontWeight: 850,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                        }}
                        onClick={onClose}
                    >
                        <X size={16} />
                    </button>
                </div>

                <div style={{ padding: 18, overflowY: "auto", display: "grid", gap: 14 }}>
                    <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, background: "#fff", padding: 14 }}>
                        <div style={{ display: "grid", gap: 12 }}>
                            <EntitySmall entity={reviewer} role={review.reviewerRole} />
                            <div style={{ color: "#94a3b8", fontWeight: 950, paddingLeft: 14 }}>to</div>
                            <EntitySmall entity={reviewee} role={review.revieweeRole} />
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                            <RatingPill rating={review.rating || review.noteStarRating} />
                            <StatusBadge status={review.status} />
                            <TypeBadge type={review.reviewType} />
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                        <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, background: "#fff", padding: 14 }}>
                            <p style={{ margin: "0 0 8px", color: "#111827", fontSize: 13, fontWeight: 900, lineHeight: 1.45 }}>Campaign</p>
                            <p style={{ margin: 0, color: "#475569", fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{getCampaignName(review)}</p>
                        </div>
                        <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, background: "#fff", padding: 14 }}>
                            <p style={{ margin: "0 0 8px", color: "#111827", fontSize: 13, fontWeight: 900, lineHeight: 1.45 }}>Submitted Via</p>
                            <p style={{ margin: 0, color: "#475569", fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{normalizeText(review.submittedVia || "-")}</p>
                        </div>
                    </div>

                    <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, background: "#fff", padding: 14 }}>
                        <p style={{ margin: "0 0 8px", color: "#111827", fontSize: 13, fontWeight: 900, lineHeight: 1.45 }}>Submitted Date</p>
                        <p style={{ margin: 0, color: "#475569", fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{formatDate(review.submittedAt || review.firstSubmittedAt)}</p>
                    </div>

                    <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, background: "#fff", padding: 14 }}>
                        <h3 style={{ fontSize: 17, fontWeight: 950, margin: "0 0 10px" }}>Submitted Questions & Answers</h3>
                        <div style={{ display: "grid", gap: 10 }}>
                            {answers.length ? (
                                answers.map((item, index) => (
                                    <div key={`${item.question}-${index}`} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "#f8fafc" }}>
                                        <p style={{ margin: "0 0 8px", color: "#111827", fontSize: 13, fontWeight: 900, lineHeight: 1.45 }}>
                                            {index + 1}. {item.question}
                                        </p>
                                        <p style={{ margin: 0, color: "#475569", fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{item.answer}</p>
                                        {item.score ? (
                                            <div style={{ marginTop: 8 }}>
                                                <Badge tone="yellow">Score: {item.score}/5</Badge>
                                            </div>
                                        ) : null}
                                    </div>
                                ))
                            ) : (
                                <EmptyState title="No submitted answers" copy="This review does not include question-answer data." />
                            )}
                        </div>
                    </div>

                    {tags.length ? (
                        <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, background: "#fff", padding: 14 }}>
                            <p style={{ margin: "0 0 8px", color: "#111827", fontSize: 13, fontWeight: 900, lineHeight: 1.45 }}>Submitted Tags</p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                                {tags.map((tag) => (
                                    <span
                                        key={tag}
                                        style={{
                                            display: "inline-flex",
                                            border: "1px solid #dbe3ee",
                                            background: "#f8fafc",
                                            color: "#475569",
                                            borderRadius: 999,
                                            padding: "4px 8px",
                                            fontSize: 11,
                                            fontWeight: 750,
                                            textTransform: "capitalize",
                                        }}
                                    >
                                        {normalizeText(tag)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            </aside>
        </div>
    );
}

export default function RatingReviewSubmittedPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const searchParams = useSearchParams();
    const id = decodeURIComponent(String(params.id || ""));
    const tab = (searchParams.get("tab") || "brand") as RatingTab;
    const name = searchParams.get("name") || "Submitted ratings";
    const reviewerRoleFromUrl = searchParams.get("reviewerRole") || "";

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<ReviewStatus | "all">("submitted");
    const [ratingFilter, setRatingFilter] = useState("");
    const [reviewTypeFilter, setReviewTypeFilter] = useState<ReviewType | "">("");
    const [reviews, setReviews] = useState<AdminReview[]>([]);
    const [rawTotal, setRawTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);
    const [toast, setToast] = useState<ToastState | null>(null);

    const showToast = useCallback((message: string, type: "success" | "error" = "error") => setToast({ message, type }), []);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3600);
        return () => clearTimeout(timer);
    }, [toast]);

    const loadReviews = useCallback(async () => {
        try {
            setLoading(true);
            const revieweeRole = tabToRevieweeRole(tab);
            const query = buildQuery({
                page,
                limit,
                search,
                status: statusFilter === "all" ? "" : statusFilter,
                rating: ratingFilter,
                revieweeRole: tab === "campaign" ? "" : revieweeRole,
                reviewType: reviewTypeFilter,
                campaignId: tab === "campaign" && id ? id : "",
                brandId: tab === "brand" && id ? id : "",
                influencerId: tab === "influencer" && id ? id : "",
                reviewerRole: tab === "platform" && reviewerRoleFromUrl ? reviewerRoleFromUrl : "",
            });
            const payload = await get<AdminListResponse>(`/campaign-reviews/admin?${query}`);
            if (payload?.success === false) throw new Error(payload?.message || "Failed to load reviews.");

            let data = Array.isArray(payload?.data) ? payload.data : [];
            if (tab === "campaign") data = data.filter((item) => ["brand_to_influencer", "influencer_to_brand"].includes(item.reviewType));
            if (tab === "platform" && id !== "all-platform" && id && !reviewerRoleFromUrl) data = data.filter((item) => item.reviewerRole === id);
            if (ratingFilter) data = data.filter((item) => Math.round(safeNumber(item.rating || item.noteStarRating)) === Number(ratingFilter));

            setReviews(data);
            setRawTotal(ratingFilter ? data.length : payload?.total || data.length || 0);
        } catch (err: any) {
            showToast(err?.response?.data?.message || err?.message || "Failed to load reviews.");
            setReviews([]);
            setRawTotal(0);
        } finally {
            setLoading(false);
        }
    }, [tab, id, reviewerRoleFromUrl, page, limit, search, statusFilter, ratingFilter, reviewTypeFilter, showToast]);

    useEffect(() => {
        void loadReviews();
    }, [loadReviews]);

    function clearFilters() {
        setSearch("");
        setStatusFilter("submitted");
        setRatingFilter("");
        setReviewTypeFilter("");
        setPage(1);
    }

    const totalPages = Math.max(1, Math.ceil(safeNumber(rawTotal || reviews.length) / limit));
    const activeFilterCount = [search.trim(), statusFilter !== "submitted" ? statusFilter : "", ratingFilter, reviewTypeFilter].filter(Boolean).length;
    const averageRating = reviews.length ? reviews.reduce((sum, item) => sum + safeNumber(item.rating || item.noteStarRating), 0) / reviews.length : 0;
    const submittedCount = reviews.filter((item) => item.status === "submitted").length;

    const tableColumns = useMemo<AdminTableColumn<AdminReview>[]>(
        () => [
            {
                id: "reviewer",
                header: "Submitted By",
                render: (row) => <EntitySmall entity={getReviewer(row)} role={row.reviewerRole} />,
            },
            {
                id: "reviewee",
                header: "Submitted For",
                render: (row) => <EntitySmall entity={getReviewee(row)} role={row.revieweeRole} />,
            },
            {
                id: "type",
                header: "Type",
                render: (row) => <TypeBadge type={row.reviewType} />,
            },
            {
                id: "campaign",
                header: "Campaign",
                render: (row) => <span style={{ fontWeight: 700, color: "#475569" }}>{getCampaignName(row)}</span>,
            },
            {
                id: "rating",
                header: "Rating",
                align: "center",
                render: (row) => <RatingPill rating={row.rating || row.noteStarRating} />,
            },
            {
                id: "answers",
                header: "Questions",
                render: (row) => <AnswerPreview review={row} />,
            },
            {
                id: "submitted",
                header: "Submitted",
                render: (row) => <span style={{ fontWeight: 700, color: "#64748b" }}>{formatDate(row.submittedAt || row.firstSubmittedAt)}</span>,
            },
            {
                id: "status",
                header: "Status",
                render: (row) => <StatusBadge status={row.status} />,
            },
        ],
        []
    );

    const statCards = [
        { label: "Total Rows", value: rawTotal || reviews.length, icon: <MessageSquareText size={18} /> },
        { label: "Average Rating", value: round1(averageRating), icon: <Star size={18} /> },
        { label: "Submitted", value: submittedCount, icon: <CheckCircle2 size={18} /> },
        { label: "Current View", value: normalizeText(tab), icon: <BarChart3 size={18} /> },
    ];

    return (
        <main
            style={{
                minHeight: "100vh",
                background: "#f6f7fb",
                padding: 24,
                color: "#111827",
                fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
            }}
        >
            <div style={{ width: "100%", maxWidth: "100%", margin: 0 }}>
                <section
                    style={{
                        border: "1px solid #e2e8f0",
                        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 58%, #eef2ff 100%)",
                        borderRadius: 22,
                        padding: 20,
                        marginBottom: 14,
                        boxShadow: "0 18px 55px rgba(15, 23, 42, 0.06)",
                    }}
                >
                    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                        <div>
                            <button
                                type="button"
                                style={{
                                    height: 40,
                                    border: "1px solid #d9dee8",
                                    borderRadius: 12,
                                    background: "#fff",
                                    color: "#111827",
                                    padding: "0 14px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 8,
                                    fontSize: 13,
                                    fontWeight: 850,
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                    marginBottom: 14,
                                }}
                                onClick={() => router.push("/admin/rating-reviews")}
                            >
                                <ChevronLeft size={14} /> Back to Overview
                            </button>
                            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 950, letterSpacing: -0.65 }}>{name}</h1>
                            <p style={{ margin: "7px 0 0", color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>Use filters and the admin table to review who submitted ratings and what they submitted.</p>
                        </div>
                        <button
                            type="button"
                            style={{
                                height: 40,
                                border: "1px solid #d9dee8",
                                borderRadius: 12,
                                background: "#fff",
                                color: "#111827",
                                padding: "0 14px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                                fontSize: 13,
                                fontWeight: 850,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                opacity: loading ? 0.65 : 1,
                            }}
                            disabled={loading}
                            onClick={() => void loadReviews()}
                        >
                            <RefreshCw size={15} /> Refresh
                        </button>
                    </header>
                </section>

                <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(170px, 1fr))", gap: 12, marginBottom: 14 }}>
                    {statCards.map((card) => (
                        <div
                            key={card.label}
                            style={{
                                background: "#fff",
                                border: "1px solid #e2e8f0",
                                borderRadius: 18,
                                padding: 16,
                                boxShadow: "0 10px 28px rgba(15, 23, 42, 0.04)",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                                <p style={{ fontSize: 12, color: "#64748b", fontWeight: 850, margin: 0 }}>{card.label}</p>
                                <span style={{ color: "#64748b" }}>{card.icon}</span>
                            </div>
                            <p style={{ fontSize: 27, fontWeight: 950, margin: "10px 0 0", letterSpacing: -0.4 }}>{card.value}</p>
                        </div>
                    ))}
                </section>

                <section
                    style={{
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 18,
                        overflow: "hidden",
                        boxShadow: "0 10px 28px rgba(15, 23, 42, 0.04)",
                        marginBottom: 14,
                    }}
                >
                    <div
                        style={{
                            padding: 16,
                            borderBottom: "1px solid #e2e8f0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            flexWrap: "wrap",
                        }}
                    >
                        <div>
                            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 950 }}>Submitted rating filters</h2>
                            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 12 }}>Search by user, campaign, type, status, or star rating.</p>
                        </div>
                        <Badge tone={activeFilterCount ? "blue" : "gray"}>{activeFilterCount} active filters</Badge>
                    </div>

                    <div style={{ padding: 16 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 1fr) 150px 140px 180px auto", gap: 10, alignItems: "center" }}>
                            <div style={{ position: "relative" }}>
                                <Search size={15} style={{ position: "absolute", top: "50%", left: 12, transform: "translateY(-50%)", color: "#94a3b8" }} />
                                <input
                                    style={{
                                        width: "100%",
                                        height: 40,
                                        border: "1px solid #d9dee8",
                                        borderRadius: 12,
                                        background: "#fff",
                                        outline: "none",
                                        padding: "0 12px 0 38px",
                                        fontSize: 13,
                                        color: "#111827",
                                        fontWeight: 650,
                                    }}
                                    value={search}
                                    placeholder="Search submitted ratings..."
                                    onChange={(event) => {
                                        setSearch(event.target.value);
                                        setPage(1);
                                    }}
                                />
                            </div>

                            <select
                                style={{
                                    width: "100%",
                                    height: 40,
                                    border: "1px solid #d9dee8",
                                    borderRadius: 12,
                                    background: "#fff",
                                    outline: "none",
                                    padding: "0 10px",
                                    fontSize: 13,
                                    color: "#111827",
                                    fontWeight: 650,
                                }}
                                value={statusFilter}
                                onChange={(event) => {
                                    setStatusFilter(event.target.value as ReviewStatus | "all");
                                    setPage(1);
                                }}
                            >
                                <option value="submitted">Submitted</option>
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="skipped">Skipped</option>
                                <option value="expired">Expired</option>
                                <option value="revoked">Revoked</option>
                            </select>

                            <select
                                style={{
                                    width: "100%",
                                    height: 40,
                                    border: "1px solid #d9dee8",
                                    borderRadius: 12,
                                    background: "#fff",
                                    outline: "none",
                                    padding: "0 10px",
                                    fontSize: 13,
                                    color: "#111827",
                                    fontWeight: 650,
                                }}
                                value={ratingFilter}
                                onChange={(event) => {
                                    setRatingFilter(event.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="">All Ratings</option>
                                <option value="5">5 Stars</option>
                                <option value="4">4 Stars</option>
                                <option value="3">3 Stars</option>
                                <option value="2">2 Stars</option>
                                <option value="1">1 Star</option>
                            </select>

                            <select
                                style={{
                                    width: "100%",
                                    height: 40,
                                    border: "1px solid #d9dee8",
                                    borderRadius: 12,
                                    background: "#fff",
                                    outline: "none",
                                    padding: "0 10px",
                                    fontSize: 13,
                                    color: "#111827",
                                    fontWeight: 650,
                                }}
                                value={reviewTypeFilter}
                                onChange={(event) => {
                                    setReviewTypeFilter(event.target.value as ReviewType | "");
                                    setPage(1);
                                }}
                            >
                                <option value="">All Types</option>
                                <option value="brand_to_influencer">Brand to Influencer</option>
                                <option value="influencer_to_brand">Influencer to Brand</option>
                                <option value="brand_to_platform">Brand to Platform</option>
                                <option value="influencer_to_platform">Influencer to Platform</option>
                            </select>

                            <button
                                type="button"
                                style={{
                                    height: 40,
                                    border: "1px solid #111827",
                                    borderRadius: 12,
                                    background: "#111827",
                                    color: "#fff",
                                    padding: "0 14px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 7,
                                    fontSize: 13,
                                    fontWeight: 850,
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                }}
                                onClick={clearFilters}
                            >
                                <Filter size={14} /> Reset
                            </button>
                        </div>

                        {activeFilterCount ? (
                            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                                {search.trim() ? <FilterChip label={`Search: ${search.trim()}`} onClear={() => setSearch("")} /> : null}
                                {statusFilter !== "submitted" ? <FilterChip label={`Status: ${statusFilter}`} onClear={() => setStatusFilter("submitted")} /> : null}
                                {ratingFilter ? <FilterChip label={`${ratingFilter} stars`} onClear={() => setRatingFilter("")} /> : null}
                                {reviewTypeFilter ? <FilterChip label={getReviewTypeLabel(reviewTypeFilter)} onClear={() => setReviewTypeFilter("")} /> : null}
                            </div>
                        ) : null}
                    </div>
                </section>

                <section
                    style={{
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 18,
                        overflow: "hidden",
                        boxShadow: "0 10px 28px rgba(15, 23, 42, 0.04)",
                    }}
                >
                    <div
                        style={{
                            padding: 16,
                            borderBottom: "1px solid #e2e8f0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            flexWrap: "wrap",
                        }}
                    >
                        <div>
                            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 950 }}>Ratings Table</h3>
                            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 12 }}>Clean admin table with pagination and a details drawer.</p>
                        </div>
                        <Badge tone="green">Admin Table</Badge>
                    </div>

                    <AdminTable<AdminReview>
                        data={reviews}
                        columns={tableColumns}
                        rowKey={(row) => row._id}
                        loading={loading}
                        loadingRows={8}
                        emptyTitle="No submitted ratings found"
                        emptyDescription="No reviews match this selection and filters."
                        onRowClick={(row) => setSelectedReview(row)}
                        actions={{
                            header: "Action",
                            render: (row) => (
                                <button
                                    type="button"
                                    style={{
                                        height: 40,
                                        border: "1px solid #d9dee8",
                                        borderRadius: 12,
                                        background: "#fff",
                                        color: "#111827",
                                        padding: "0 14px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 8,
                                        fontSize: 13,
                                        fontWeight: 850,
                                        cursor: "pointer",
                                        whiteSpace: "nowrap",
                                    }}
                                    onClick={() => setSelectedReview(row)}
                                >
                                    <Eye size={14} /> View Info
                                </button>
                            ),
                        }}
                        pagination={{
                            page,
                            totalPages,
                            totalItems: rawTotal || reviews.length,
                            limit,
                            onPageChange: setPage,
                            onLimitChange: (value) => {
                                setLimit(value);
                                setPage(1);
                            },
                            rowOptions: [10, 20, 50, 100],
                            loading,
                        }}
                    />
                </section>
            </div>

            <ReviewInfoModal review={selectedReview} onClose={() => setSelectedReview(null)} />
            {toast ? <Toast toast={toast} /> : null}
        </main>
    );
}
