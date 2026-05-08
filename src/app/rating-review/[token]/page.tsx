"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  Send,
  Star,
  XCircle,
  Award,
  Clock,
  User,
  Tag,
  Lock,
  FileText,
  ChevronRight,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────── */

type ReviewType = "brand_to_influencer" | "influencer_to_brand";

type PublicReview = {
  _id: string;
  reviewRequestId?: string;
  reviewType: ReviewType;
  reviewerRole: "brand" | "influencer";
  revieweeRole: "brand" | "influencer";
  status: string;
  tokenExpiresAt?: string;

  campaign?: { _id?: string; name?: string };
  brand?: { _id?: string; name?: string; email?: string };
  influencer?: {
    _id?: string;
    name?: string;
    email?: string;
    handle?: string;
  };
};

type PublicResponse = {
  success?: boolean;
  message?: string;
  data?: PublicReview;
};

type SubmitResponse = { success?: boolean; message?: string; data?: any };

/* ─── API helpers ────────────────────────────────────────── */

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  ""
).replace(/\/+$/, "");

function apiUrl(path = "") {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || "Request failed");
  }

  return payload as T;
}

/* ─── Utils ──────────────────────────────────────────────── */

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getTokenFromParams(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] || "";
  return String(value || "");
}

function formatDate(value?: string) {
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

function getReviewTitle(review: PublicReview | null) {
  if (!review) return "Campaign Review";
  return review.reviewType === "brand_to_influencer"
    ? `Review for ${review.influencer?.name || "Influencer"}`
    : `Review for ${review.brand?.name || "Brand"}`;
}

function getReviewDescription(review: PublicReview | null) {
  if (!review) return "";
  return review.reviewType === "brand_to_influencer"
    ? `Share your experience working with ${review.influencer?.name || "this influencer"
    } for ${review.campaign?.name || "this campaign"}.`
    : `Share your experience working with ${review.brand?.name || "this brand"
    } for ${review.campaign?.name || "this campaign"}.`;
}

function getReviewerLabel(review: PublicReview | null) {
  if (!review) return "";
  return review.reviewerRole === "brand"
    ? review.brand?.name || "Brand"
    : review.influencer?.name || "Influencer";
}

function getRevieweeLabel(review: PublicReview | null) {
  if (!review) return "";
  return review.revieweeRole === "brand"
    ? review.brand?.name || "Brand"
    : review.influencer?.name || "Influencer";
}

/* ─── Rating label helper ────────────────────────────────── */

function ratingLabel(value: number) {
  return ["", "Poor", "Fair", "Good", "Great", "Excellent"][value] ?? "";
}

/* ─── RatingInput ────────────────────────────────────────── */

function RatingInput({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange: (value: number) => void;
  size?: "sm" | "md" | "lg";
}) {
  const [hovered, setHovered] = useState(0);
  const iconSize =
    size === "lg" ? "h-9 w-9" : size === "sm" ? "h-5 w-5" : "h-7 w-7";
  const active = hovered || value;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1;
        const lit = starValue <= active;

        return (
          <button
            key={starValue}
            type="button"
            onClick={() => onChange(starValue)}
            onMouseEnter={() => setHovered(starValue)}
            onMouseLeave={() => setHovered(0)}
            className="rounded-lg p-0.5 transition-transform hover:scale-110 focus:outline-none"
            aria-label={`${starValue} star`}
          >
            <Star
              className={cx(
                iconSize,
                "transition-colors duration-150",
                lit
                  ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                  : "text-stone-300"
              )}
            />
          </button>
        );
      })}

      {size === "lg" && active > 0 && (
        <span className="ml-2 text-sm font-semibold text-amber-600">
          {ratingLabel(active)}
        </span>
      )}
    </div>
  );
}

/* ─── Fonts (injected as a style tag) ────────────────────── */

const fontStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Outfit:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .review-root {
    font-family: 'Outfit', sans-serif;
  }
  .review-display {
    font-family: 'Cormorant Garamond', Georgia, serif;
  }

  .field-input {
    width: 100%;
    background: #FAFAF9;
    border: 1.5px solid #E7E5E4;
    border-radius: 14px;
    padding: 0 18px;
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #1C1917;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  }
  .field-input:focus {
    border-color: #92400E;
    box-shadow: 0 0 0 3px rgba(120, 53, 15, 0.08);
    background: #fff;
  }
  .field-input::placeholder { color: #A8A29E; font-weight: 400; }

  .field-textarea {
    width: 100%;
    background: #FAFAF9;
    border: 1.5px solid #E7E5E4;
    border-radius: 14px;
    padding: 14px 18px;
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.7;
    color: #1C1917;
    outline: none;
    resize: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  }
  .field-textarea:focus {
    border-color: #92400E;
    box-shadow: 0 0 0 3px rgba(120, 53, 15, 0.08);
    background: #fff;
  }
  .field-textarea::placeholder { color: #A8A29E; font-weight: 400; }

  .submit-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 52px;
    border-radius: 16px;
    background: linear-gradient(135deg, #292524 0%, #1C1917 100%);
    color: #fff;
    font-family: 'Outfit', sans-serif;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.02em;
    border: none;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 4px 20px rgba(0,0,0,0.18);
  }
  .submit-btn:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 8px 28px rgba(0,0,0,0.22);
  }
  .submit-btn:active:not(:disabled) { transform: translateY(0); }
  .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }

  .meta-pill {
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 18px;
    padding: 16px;
    backdrop-filter: blur(4px);
  }
  .meta-pill-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.45);
  }
  .meta-pill-value {
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cat-card {
    border-radius: 18px;
    border: 1.5px solid #F5F5F4;
    background: #FAFAF9;
    padding: 16px;
    transition: border-color 0.2s, background 0.2s;
  }
  .cat-card:has([aria-label]:focus) {
    border-color: #D6D3D1;
    background: #fff;
  }

  .section-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, #E7E5E4, transparent);
    margin: 0;
    border: none;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-up {
    animation: fadeUp 0.45s ease both;
  }
  .delay-100 { animation-delay: 0.10s; }
  .delay-200 { animation-delay: 0.20s; }
  .delay-300 { animation-delay: 0.30s; }
  .delay-400 { animation-delay: 0.40s; }
`;

/* ─── Page ───────────────────────────────────────────────── */

export default function PublicRatingReviewPage() {
  const params = useParams();
  const token = getTokenFromParams(params?.token as any);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [review, setReview] = useState<PublicReview | null>(null);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [rating, setRating] = useState(0);
  const [ratings, setRatings] = useState({
    workQuality: 0,
    communication: 0,
    timeliness: 0,
    professionalism: 0,
    wouldRecommend: 0,
  });

  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [privateFeedback, setPrivateFeedback] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const categoryLabels = useMemo(
    () => [
      {
        key: "workQuality",
        label:
          review?.reviewType === "brand_to_influencer"
            ? "Work Quality"
            : "Collaboration Quality",
      },
      { key: "communication", label: "Communication" },
      { key: "timeliness", label: "Timeliness" },
      { key: "professionalism", label: "Professionalism" },
      { key: "wouldRecommend", label: "Would Recommend" },
    ],
    [review?.reviewType]
  );

  const loadReview = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      if (!token) throw new Error("Review token is missing");

      const payload = await apiRequest<PublicResponse>(
        `/campaign-reviews/public/${encodeURIComponent(token)}`
      );
      setReview(payload.data || null);
    } catch (err: any) {
      setError(err?.message || "Failed to load review link.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void loadReview(); }, [loadReview]);

  function updateCategoryRating(key: keyof typeof ratings, value: number) {
    setRatings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    try {
      if (!rating) throw new Error("Please select an overall rating.");
      if (!reviewText.trim()) throw new Error("Please write your review.");

      setSubmitting(true);
      setError("");

      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = await apiRequest<SubmitResponse>(
        `/campaign-reviews/public/${encodeURIComponent(token)}`,
        {
          method: "POST",
          body: JSON.stringify({
            rating,
            ratings: {
              workQuality: ratings.workQuality || null,
              communication: ratings.communication || null,
              timeliness: ratings.timeliness || null,
              professionalism: ratings.professionalism || null,
              wouldRecommend: ratings.wouldRecommend || null,
            },
            reviewTitle: reviewTitle.trim(),
            reviewText: reviewText.trim(),
            privateFeedback: privateFeedback.trim(),
            tags,
          }),
        }
      );

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to submit review.");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <>
        <style>{fontStyle}</style>
        <main
          className="review-root"
          style={{
            minHeight: "100vh",
            background: "#F7F6F3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <Loader2
              className="animate-spin"
              style={{
                width: 32,
                height: 32,
                color: "#A8A29E",
                margin: "0 auto",
              }}
            />
            <p
              style={{
                marginTop: 16,
                fontSize: 14,
                fontWeight: 500,
                color: "#A8A29E",
                letterSpacing: "0.01em",
              }}
            >
              Loading your review…
            </p>
          </div>
        </main>
      </>
    );
  }

  /* ── Error (no review) ── */
  if (error && !review) {
    return (
      <>
        <style>{fontStyle}</style>
        <main
          className="review-root"
          style={{
            minHeight: "100vh",
            background: "#F7F6F3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            className="animate-fade-up"
            style={{
              width: "100%",
              maxWidth: 480,
              background: "#fff",
              borderRadius: 28,
              border: "1.5px solid #FEE2E2",
              padding: "48px 40px",
              textAlign: "center",
              boxShadow: "0 8px 40px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#FEF2F2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
              }}
            >
              <XCircle style={{ width: 28, height: 28, color: "#EF4444" }} />
            </div>

            <h1
              className="review-display"
              style={{
                marginTop: 24,
                fontSize: 28,
                fontWeight: 600,
                color: "#1C1917",
                lineHeight: 1.2,
              }}
            >
              Link unavailable
            </h1>

            <p
              style={{
                marginTop: 12,
                fontSize: 14,
                lineHeight: 1.7,
                color: "#78716C",
              }}
            >
              {error}
            </p>
          </div>
        </main>
      </>
    );
  }

  /* ── Submitted ── */
  if (submitted) {
    return (
      <>
        <style>{fontStyle}</style>
        <main
          className="review-root"
          style={{
            minHeight: "100vh",
            background: "#F7F6F3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            className="animate-fade-up"
            style={{
              width: "100%",
              maxWidth: 480,
              background: "#fff",
              borderRadius: 28,
              border: "1.5px solid #D1FAE5",
              padding: "48px 40px",
              textAlign: "center",
              boxShadow: "0 8px 40px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#ECFDF5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
              }}
            >
              <CheckCircle2
                style={{ width: 28, height: 28, color: "#10B981" }}
              />
            </div>

            <h1
              className="review-display"
              style={{
                marginTop: 24,
                fontSize: 32,
                fontWeight: 600,
                color: "#1C1917",
                lineHeight: 1.2,
              }}
            >
              Review submitted
            </h1>

            <p
              style={{
                marginTop: 12,
                fontSize: 15,
                lineHeight: 1.7,
                color: "#78716C",
              }}
            >
              Your feedback has been recorded. Thank you for taking the time to
              share your experience.
            </p>

            <div
              style={{
                marginTop: 32,
                display: "flex",
                gap: 4,
                justifyContent: "center",
              }}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  style={{
                    width: 22,
                    height: 22,
                    fill: "#FCD34D",
                    color: "#FCD34D",
                  }}
                />
              ))}
            </div>
          </div>
        </main>
      </>
    );
  }

  /* ── Main form ── */
  return (
    <>
      <style>{fontStyle}</style>

      <main
        className="review-root"
        style={{
          minHeight: "100vh",
          background: "#F7F6F3",
          padding: "40px 16px 80px",
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto" }}>

          {/* ── Card ── */}
          <div
            style={{
              background: "#fff",
              borderRadius: 32,
              border: "1.5px solid #E7E5E4",
              overflow: "hidden",
              boxShadow: "0 12px 48px rgba(0,0,0,0.07)",
            }}
          >

            {/* ── Hero header ── */}
            <div
              className="animate-fade-up"
              style={{
                background:
                  "linear-gradient(145deg, #1C1917 0%, #292524 55%, #3B1F0E 100%)",
                padding: "40px 40px 36px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Decorative orb */}
              <div
                style={{
                  position: "absolute",
                  top: -60,
                  right: -60,
                  width: 240,
                  height: 240,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />

              {/* Badge */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(251,191,36,0.12)",
                  border: "1px solid rgba(251,191,36,0.25)",
                  borderRadius: 100,
                  padding: "4px 12px",
                  marginBottom: 20,
                }}
              >
                <Award
                  style={{ width: 13, height: 13, color: "#FCD34D" }}
                />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#FCD34D",
                  }}
                >
                  Campaign Review
                </span>
              </div>

              <h1
                className="review-display"
                style={{
                  fontSize: "clamp(26px, 4vw, 36px)",
                  fontWeight: 600,
                  color: "#FAFAF9",
                  lineHeight: 1.15,
                  letterSpacing: "-0.01em",
                  marginBottom: 12,
                }}
              >
                {getReviewTitle(review)}
              </h1>

              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.55)",
                  maxWidth: 520,
                  marginBottom: 28,
                }}
              >
                {getReviewDescription(review)}
              </p>

              {/* Meta pills */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: 10,
                }}
              >
                <div className="meta-pill">
                  <span className="meta-pill-label">Campaign</span>
                  <span className="meta-pill-value">
                    {review?.campaign?.name || "—"}
                  </span>
                </div>

                <div className="meta-pill">
                  <span className="meta-pill-label">Reviewer</span>
                  <span className="meta-pill-value">
                    {getReviewerLabel(review)}
                  </span>
                </div>

                <div className="meta-pill">
                  <span className="meta-pill-label">Reviewing</span>
                  <span className="meta-pill-value">
                    {getRevieweeLabel(review)}
                  </span>
                </div>
              </div>

              {review?.tokenExpiresAt && (
                <p
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    marginTop: 16,
                    fontSize: 12,
                    color: "rgba(255,255,255,0.35)",
                    fontWeight: 500,
                  }}
                >
                  <Clock style={{ width: 12, height: 12 }} />
                  Expires&nbsp;{formatDate(review.tokenExpiresAt)}
                </p>
              )}
            </div>

            {/* ── Form body ── */}
            <div style={{ padding: "36px 40px", display: "flex", flexDirection: "column", gap: 32 }}>

              {/* Error banner */}
              {error && (
                <div
                  style={{
                    borderRadius: 14,
                    background: "#FEF2F2",
                    border: "1.5px solid #FECACA",
                    padding: "14px 18px",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#DC2626",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <XCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                  {error}
                </div>
              )}

              {/* ── Overall rating ── */}
              <div className="animate-fade-up delay-100">
                <div
                  style={{
                    background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
                    border: "1.5px solid #FDE68A",
                    borderRadius: 20,
                    padding: "24px 28px",
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "#92400E",
                      marginBottom: 6,
                    }}
                  >
                    Overall Rating <span style={{ color: "#EF4444" }}>*</span>
                  </p>

                  <p
                    className="review-display"
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      color: "#1C1917",
                      marginBottom: 16,
                    }}
                  >
                    How was your overall experience?
                  </p>

                  <RatingInput value={rating} onChange={setRating} size="lg" />
                </div>
              </div>

              {/* ── Category ratings ── */}
              <div className="animate-fade-up delay-200">
                <SectionLabel icon={<Star style={{ width: 14, height: 14 }} />}>
                  Category Ratings
                </SectionLabel>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: 12,
                    marginTop: 14,
                  }}
                >
                  {categoryLabels.map((item) => (
                    <div key={item.key} className="cat-card">
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#44403C",
                          marginBottom: 10,
                        }}
                      >
                        {item.label}
                      </p>

                      <RatingInput
                        value={ratings[item.key as keyof typeof ratings]}
                        onChange={(v) =>
                          updateCategoryRating(item.key as keyof typeof ratings, v)
                        }
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <hr className="section-divider" />

              {/* ── Review title ── */}
              <div className="animate-fade-up delay-200">
                <SectionLabel icon={<FileText style={{ width: 14, height: 14 }} />}>
                  Review Title
                </SectionLabel>

                <input
                  className="field-input"
                  style={{ height: 48, marginTop: 10 }}
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  maxLength={160}
                  placeholder="e.g. Great collaboration, highly recommend"
                />
              </div>

              {/* ── Public review ── */}
              <div className="animate-fade-up delay-200">
                <SectionLabel
                  icon={<User style={{ width: 14, height: 14 }} />}
                  required
                >
                  Public Review
                </SectionLabel>

                <p style={{ fontSize: 12, color: "#A8A29E", marginBottom: 10, marginTop: 4, fontWeight: 500 }}>
                  This will be visible to others on the platform.
                </p>

                <textarea
                  className="field-textarea"
                  rows={6}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  maxLength={3000}
                  placeholder="Describe your experience — what went well, what could be improved, and whether you'd work together again…"
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 6,
                  }}
                >
                  <span style={{ fontSize: 11, color: "#D6D3D1", fontWeight: 500 }}>
                    {reviewText.length}/3000
                  </span>
                </div>
              </div>

              <hr className="section-divider" />

              {/* ── Private feedback ── */}
              <div className="animate-fade-up delay-300">
                <SectionLabel icon={<Lock style={{ width: 14, height: 14 }} />}>
                  Private Feedback
                </SectionLabel>

                <p style={{ fontSize: 12, color: "#A8A29E", marginBottom: 10, marginTop: 4, fontWeight: 500 }}>
                  Visible only to administrators — not public.
                </p>

                <textarea
                  className="field-textarea"
                  rows={4}
                  value={privateFeedback}
                  onChange={(e) => setPrivateFeedback(e.target.value)}
                  maxLength={3000}
                  placeholder="Optional private notes for the admin team…"
                />
              </div>

              {/* ── Tags ── */}
              <div className="animate-fade-up delay-300">
                <SectionLabel icon={<Tag style={{ width: 14, height: 14 }} />}>
                  Tags
                </SectionLabel>

                <input
                  className="field-input"
                  style={{ height: 48, marginTop: 10 }}
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="on-time, professional, creative, responsive"
                />

                <p style={{ marginTop: 8, fontSize: 12, color: "#A8A29E", fontWeight: 500 }}>
                  Separate tags with commas.
                </p>

                {tagsInput.trim() && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                    {tagsInput
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                      .map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            background: "#F5F5F4",
                            border: "1.5px solid #E7E5E4",
                            borderRadius: 100,
                            padding: "3px 12px",
                            color: "#57534E",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                  </div>
                )}
              </div>

              <hr className="section-divider" />

              {/* ── Submit ── */}
              <div className="animate-fade-up delay-400">
                <button
                  className="submit-btn"
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
                  ) : (
                    <Send style={{ width: 16, height: 16 }} />
                  )}
                  {submitting ? "Submitting…" : "Submit Review"}
                  {!submitting && (
                    <ChevronRight style={{ width: 16, height: 16, marginLeft: -2 }} />
                  )}
                </button>

                <p
                  style={{
                    marginTop: 14,
                    fontSize: 12,
                    color: "#A8A29E",
                    textAlign: "center",
                    fontWeight: 400,
                  }}
                >
                  By submitting, you confirm this review reflects your genuine experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

/* ─── Section label helper component ────────────────────── */

function SectionLabel({
  icon,
  children,
  required,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {icon && (
        <span style={{ color: "#A8A29E", display: "flex" }}>{icon}</span>
      )}
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.01em",
          color: "#1C1917",
        }}
      >
        {children}
      </span>
      {required && (
        <span style={{ color: "#EF4444", fontSize: 14 }}>*</span>
      )}
    </div>
  );
}