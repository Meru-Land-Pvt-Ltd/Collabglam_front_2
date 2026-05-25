"use client";

import React, { useEffect, useMemo, useState } from "react";
import { BellOff, CheckCircle2, Loader2, Star, X } from "lucide-react";
import { post } from "@/lib/api";

type PlatformReviewRole = "brand" | "influencer";

type PlatformReviewPromptProps = {
  role: PlatformReviewRole;
  brandId?: string | null;
  influencerId?: string | null;
  className?: string;
};

type PlatformReviewToast = {
  type: "submitted" | "remind_later";
  title: string;
  message: string;
};

const REVIEW_BASE = "/campaign-reviews";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isMongoObjectId(value?: string | null) {
  return /^[a-f\d]{24}$/i.test(String(value || "").trim());
}

function unwrap<T = any>(res: any): T {
  return (res?.data ?? res) as T;
}

function getLocalStorageBrandId() {
  if (typeof window === "undefined") return "";

  const directBrandId = localStorage.getItem("brandId");
  if (isMongoObjectId(directBrandId)) return String(directBrandId).trim();

  const jsonKeys = [
    "brand",
    "brandData",
    "brandUser",
    "user",
    "userData",
    "authUser",
    "currentUser",
  ];

  for (const key of jsonKeys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);

      const possibleIds = [
        parsed?._id,
        parsed?.id,
        parsed?.brandId,
        parsed?.brand_id,
        parsed?.brand?._id,
        parsed?.brand?.id,
        parsed?.brand?.brandId,
        parsed?.data?._id,
        parsed?.data?.id,
        parsed?.data?.brandId,
        parsed?.data?.brand?._id,
        parsed?.data?.brand?.brandId,
        parsed?.user?._id,
        parsed?.user?.brandId,
      ];

      const validId = possibleIds.find((item) => isMongoObjectId(item));
      if (validId) return String(validId).trim();
    } catch {
      // Ignore invalid JSON localStorage values
    }
  }

  return "";
}

function getLocalStorageInfluencerId() {
  if (typeof window === "undefined") return "";

  const directInfluencerId = localStorage.getItem("influencerId");
  if (isMongoObjectId(directInfluencerId)) return String(directInfluencerId).trim();

  const jsonKeys = [
    "influencer",
    "influencerData",
    "influencerUser",
    "user",
    "userData",
    "authUser",
    "currentUser",
  ];

  for (const key of jsonKeys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);

      const possibleIds = [
        parsed?._id,
        parsed?.id,
        parsed?.influencerId,
        parsed?.influencer_id,
        parsed?.influencer?._id,
        parsed?.influencer?.id,
        parsed?.influencer?.influencerId,
        parsed?.data?._id,
        parsed?.data?.id,
        parsed?.data?.influencerId,
        parsed?.data?.influencer?._id,
        parsed?.data?.influencer?.influencerId,
        parsed?.user?._id,
        parsed?.user?.influencerId,
      ];

      const validId = possibleIds.find((item) => isMongoObjectId(item));
      if (validId) return String(validId).trim();
    } catch {
      // Ignore invalid JSON localStorage values
    }
  }

  return "";
}

function getEndpoints(role: PlatformReviewRole) {
  if (role === "brand") {
    return {
      promptState: `${REVIEW_BASE}/brand/platform/prompt-state`,
      submit: `${REVIEW_BASE}/brand/platform/submit`,
      skip: `${REVIEW_BASE}/brand/platform/skip`,
    };
  }

  return {
    promptState: `${REVIEW_BASE}/influencer/platform/prompt-state`,
    submit: `${REVIEW_BASE}/influencer/platform/submit`,
    skip: `${REVIEW_BASE}/influencer/platform/skip`,
  };
}

export default function PlatformReviewPrompt({
  role,
  brandId,
  influencerId,
  className,
}: PlatformReviewPromptProps) {
  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [busy, setBusy] = useState<"submit" | "skip" | null>(null);
  const [error, setError] = useState("");
  const [storedBrandId, setStoredBrandId] = useState("");
  const [storedInfluencerId, setStoredInfluencerId] = useState("");
  const [toast, setToast] = useState<PlatformReviewToast | null>(null);

  const endpoints = useMemo(() => getEndpoints(role), [role]);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (role === "brand") {
      setStoredBrandId(getLocalStorageBrandId());
    }

    if (role === "influencer") {
      setStoredInfluencerId(getLocalStorageInfluencerId());
    }
  }, [role]);

  const resolvedBrandId = useMemo(() => {
    if (isMongoObjectId(brandId)) return String(brandId).trim();
    if (isMongoObjectId(storedBrandId)) return String(storedBrandId).trim();
    return "";
  }, [brandId, storedBrandId]);

  const resolvedInfluencerId = useMemo(() => {
    if (isMongoObjectId(influencerId)) return String(influencerId).trim();
    if (isMongoObjectId(storedInfluencerId)) return String(storedInfluencerId).trim();
    return "";
  }, [influencerId, storedInfluencerId]);

  const payload = useMemo(() => {
    const basePayload = {
      sourceEntityType: "platform",
      sourceEntityId: "collabglam",
    };

    if (role === "brand") {
      return resolvedBrandId ? { ...basePayload, brandId: resolvedBrandId } : null;
    }

    return resolvedInfluencerId
      ? { ...basePayload, influencerId: resolvedInfluencerId }
      : null;
  }, [role, resolvedBrandId, resolvedInfluencerId]);

  useEffect(() => {
    let cancelled = false;

    async function checkPromptState() {
      if (!payload) {
        setVisible(false);
        setChecking(false);
        return;
      }

      try {
        setChecking(true);
        setError("");

        const response = await post<any>(endpoints.promptState, payload);
        const result = unwrap<any>(response);

        const shouldPrompt = Boolean(
          result?.shouldPrompt ?? result?.data?.shouldPrompt
        );

        if (!cancelled) {
          setVisible(shouldPrompt);
        }
      } catch (err: any) {
        if (!cancelled) {
          setVisible(false);
          setError(err?.response?.data?.message || "Unable to check review prompt.");
          console.error("Platform review prompt-state failed:", err?.response?.data || err);
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    void checkPromptState();

    return () => {
      cancelled = true;
    };
  }, [payload, endpoints.promptState]);

  const showRemindLaterToast = () => {
    setToast({
      type: "remind_later",
      title: "We’ll remind you later",
      message:
        "We’d love to hear your thoughts once you’ve had a little more time exploring campaigns, collaborations, and workflows on Collabglam.",
    });
  };

  const handleSkip = async () => {
    if (!payload || busy) return;

    try {
      setBusy("skip");
      setError("");

      await post<any>(endpoints.skip, {
        ...payload,
        skipReason: "closed_platform_review_prompt",
      });

      setVisible(false);
      showRemindLaterToast();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to remind later. Please try again.");
      console.error("Platform review skip failed:", err?.response?.data || err);
    } finally {
      setBusy(null);
    }
  };

  const handleSubmit = async () => {
    if (!payload || busy) return;

    if (!rating) {
      setError("Please select a rating first.");
      return;
    }

    try {
      setBusy("submit");
      setError("");

      await post<any>(endpoints.submit, {
        ...payload,
        rating,
        noteStarRating: rating,
        reviewMode: "system_platform_rating",
      });

      setVisible(false);
      setToast({
        type: "submitted",
        title: "Thanks for rating Collabglam",
        message: "Your platform feedback has been submitted successfully.",
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to submit rating. Please try again.");
      console.error("Platform review submit failed:", err?.response?.data || err);
    } finally {
      setBusy(null);
    }
  };

  const activeRating = hoverRating || rating;
  const ToastIcon = toast?.type === "submitted" ? CheckCircle2 : BellOff;

  return (
    <>
      {toast ? (
        <div className="fixed left-4 right-4 top-4 z-[99999] md:left-6 md:right-6">
          <div className="flex items-start gap-3 rounded-[1rem] border-[0.5px] border-[#BCE4C5] bg-[#EAF6EC] px-5 py-4 shadow-[0_24px_40px_-4px_rgba(0,0,0,0.10),0_0_12px_0_rgba(0,0,0,0.08)]">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-[#1A1A1A]">
              <ToastIcon className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-inter text-[1rem] font-medium leading-6 tracking-[0] text-[#1A1A1A]">
                {toast.title}
              </p>

              <p className="mt-1 font-inter text-[0.875rem] font-normal leading-5 tracking-[0] text-[#969696]">
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setToast(null)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.75rem] text-[#1A1A1A] transition hover:bg-white/70"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {!checking && visible ? (
        <section
          className={cn(
            "w-full rounded-[1rem] bg-[#F9F9F9] px-5 py-4 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.08),0_4px_8px_-2px_rgba(0,0,0,0.04)]",
            className
          )}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F9F9F9] shadow-inner">
                <img
                  src="/logo.png"
                  alt="Collabglam"
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="min-w-0">
                <h3 className="font-inter text-[1rem] font-medium leading-6 tracking-[0] text-[#1A1A1A]">
                  Rate your experience with Collabglam so far?
                </h3>

                <p className="mt-1 font-inter text-[0.75rem] font-normal leading-4 text-[#969696]">
                  Your feedback helps us improve the platform experience for brands and creators.
                </p>

                <div className="mt-2 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onMouseEnter={() => setHoverRating(value)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => {
                        setRating(value);
                        setError("");
                      }}
                      className="rounded-[0.75rem] p-0.5 transition hover:scale-110"
                      aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
                    >
                      <Star
                        className={cn(
                          "h-5 w-5",
                          value <= activeRating
                            ? "fill-[#FFBF00] text-[#FFBF00]"
                            : "fill-[#E6E6E6] text-[#E6E6E6]"
                        )}
                      />
                    </button>
                  ))}
                </div>

                {error ? (
                  <p className="mt-2 font-inter text-[0.75rem] font-normal leading-4 text-rose-600">
                    {error}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleSkip}
                disabled={Boolean(busy)}
                className="inline-flex h-10 items-center justify-center rounded-[0.75rem] px-4 font-inter text-[0.75rem] font-normal leading-4 text-[#969696] transition hover:bg-white hover:text-[#1A1A1A] disabled:opacity-60"
              >
                {busy === "skip" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Remind me later"
                )}
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={Boolean(busy)}
                className="inline-flex h-10 min-w-[5.75rem] items-center justify-center rounded-[0.75rem] bg-[#1A1A1A] px-5 font-inter text-[0.75rem] font-medium leading-4 text-white shadow-[0_2px_4px_-2px_rgba(0,0,0,0.08),0_4px_8px_-2px_rgba(0,0,0,0.04)] transition hover:bg-black disabled:opacity-60"
              >
                {busy === "submit" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Submit"
                )}
              </button>

              <button
                type="button"
                onClick={handleSkip}
                disabled={Boolean(busy)}
                className="flex h-10 w-10 items-center justify-center rounded-[0.75rem] text-[#1A1A1A] transition hover:bg-white disabled:opacity-60"
                aria-label="Close platform review prompt"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}