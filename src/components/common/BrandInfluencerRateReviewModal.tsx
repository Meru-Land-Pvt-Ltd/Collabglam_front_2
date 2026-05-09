"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { post } from "@/lib/api";

export type BrandInfluencerReviewTarget = {
  campaignId: string;
  brandId: string;
  influencerId: string;
  influencerName?: string;
  influencerAvatarUrl?: string;
  campaignTitle?: string;

  sourceEntityType?: "deliverable" | "campaign" | string;
  sourceEntityId?: string;
};

type ReviewAnswers = {
  working_feel_rating: number | "";
  reliability: string;
  standout_qualities: string[];
  content_vision_match: string;
  note_star_rating: number;
  note: string;
};

type Props = {
  open: boolean;
  target: BrandInfluencerReviewTarget | null;
  onClose: () => void;
  onSubmitted?: () => void | Promise<void>;
  onSkipped?: () => void | Promise<void>;
  submitEndpoint?: string;
};

const defaultAnswers: ReviewAnswers = {
  working_feel_rating: "",
  reliability: "",
  standout_qualities: [],
  content_vision_match: "",
  note_star_rating: 0,
  note: "",
};

const emojiOptions = [
  { value: 5, emoji: "😍", label: "Amazing" },
  { value: 4, emoji: "😊", label: "Smooth" },
  { value: 3, emoji: "🙂", label: "Good" },
  { value: 2, emoji: "😐", label: "Average" },
  { value: 1, emoji: "😕", label: "Difficult" },
];

const reliabilityOptions = [
  { value: "super_fast_proactive", label: "Super fast & proactive" },
  { value: "always_on_time", label: "Always on time" },
  { value: "mostly_reliable", label: "Mostly reliable" },
  { value: "needed_few_reminders", label: "Needed a few reminders" },
  { value: "often_delayed", label: "Often delayed" },
];

const qualityOptions = [
  { value: "easy_to_work_with", label: "🤝 Easy To Work With" },
  { value: "creative_thinker", label: "✨ Creative Thinker" },
  { value: "fast_responder", label: "⚡ Fast Responder" },
  { value: "strong_engagement", label: "📈 Strong Engagement" },
  { value: "professional", label: "🎯 Professional" },
  { value: "trend_aware", label: "🔥 Trend Aware" },
  { value: "would_recommend", label: "🌟 Would Recommend" },
  { value: "well_organised", label: "📋 Well Organised" },
  { value: "high_quality_content", label: "🎬 High Quality Content" },
];

const visionOptions = [
  { value: "nailed_vibe_perfectly", label: "Nailed the vibe perfectly" },
  { value: "fully_aligned", label: "Fully aligned" },
  { value: "mostly_aligned", label: "Mostly aligned" },
  { value: "needed_multiple_revisions", label: "Needed multiple revisions" },
  { value: "missed_direction", label: "Missed the direction" },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getInitials(name = "") {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "IN";

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function isEmpty(value: unknown) {
  if (value === undefined || value === null || value === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

function Avatar({ name, src }: { name: string; src?: string }) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        className="h-[5.25rem] w-[5.25rem] rounded-full border-[0.25rem] border-white object-cover shadow-lg"
      />
    );
  }

  return (
    <div className="flex h-[5.25rem] w-[5.25rem] items-center justify-center rounded-full border-[0.25rem] border-white bg-[#F5D0E5] text-xl font-semibold text-[#1A1A1A] shadow-lg">
      {getInitials(name)}
    </div>
  );
}

export default function BrandInfluencerRateReviewModal({
  open,
  target,
  onClose,
  onSubmitted,
  onSkipped,
  submitEndpoint = "/campaign-reviews/brand/submit",
}: Props) {
  const [showIntro, setShowIntro] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<ReviewAnswers>({ ...defaultAnswers });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [hoveredEmoji, setHoveredEmoji] = useState<number | null>(null);

  const influencerName = target?.influencerName || "this influencer";

  const steps = useMemo(
    () => [
      {
        key: "working_feel_rating" as const,
        title: `How did working with ${influencerName} feel?`,
        subtitle: "Share your overall collaboration experience with the creator.",
        required: true,
      },
      {
        key: "reliability" as const,
        title: "How reliable was the creator during the campaign?",
        subtitle: "Share your overall collaboration experience with the creator.",
        required: true,
      },
      {
        key: "standout_qualities" as const,
        title: "Which qualities stood out the most?",
        subtitle: "Creative alignment with your campaign",
        required: true,
      },
      {
        key: "content_vision_match" as const,
        title: "Did the content match your vision?",
        subtitle:
          "Based on this experience, how likely are you to work together on future campaigns?",
        required: true,
      },
      {
        key: "note" as const,
        title: `Leave a note for ${influencerName}.`,
        subtitle:
          "Share a quick appreciation, feedback, or memorable takeaway from this collaboration.",
        required: false,
      },
    ],
    [influencerName]
  );

  const currentStep = steps[stepIndex];
  const totalSteps = steps.length;
  const isLastStep = stepIndex === totalSteps - 1;

  useEffect(() => {
    if (!open) {
      setShowIntro(true);
      setStepIndex(0);
      setAnswers({ ...defaultAnswers });
      setSubmitting(false);
      setError("");
      setHoveredEmoji(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !target?.influencerId) return;

    setShowIntro(true);
    setStepIndex(0);
    setAnswers({ ...defaultAnswers });
    setSubmitting(false);
    setError("");
    setHoveredEmoji(null);
  }, [open, target?.influencerId]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, submitting, onClose]);

  if (!open || !target) return null;

  const activeTarget = target;

  function setAnswer<K extends keyof ReviewAnswers>(
    key: K,
    value: ReviewAnswers[K]
  ) {
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function toggleQuality(value: string) {
    setAnswers((prev) => {
      const exists = prev.standout_qualities.includes(value);

      return {
        ...prev,
        standout_qualities: exists
          ? prev.standout_qualities.filter((item) => item !== value)
          : [...prev.standout_qualities, value],
      };
    });
  }

  function validateCurrentStep() {
    if (!currentStep.required) return true;

    const value = answers[currentStep.key];

    if (isEmpty(value)) {
      setError("Please select an option to continue.");
      return false;
    }

    return true;
  }

  async function handleSkip() {
    if (submitting) return;

    await onSkipped?.();
    onClose();
  }

  async function submitReview() {
    try {
      setSubmitting(true);
      setError("");

      const payload = {
        campaignId: activeTarget.campaignId,
        brandId: activeTarget.brandId,
        influencerId: activeTarget.influencerId,

        reviewType: "brand_to_influencer",
        reviewerRole: "brand",
        revieweeRole: "influencer",

        sourceEntityType: activeTarget.sourceEntityType || "campaign",
        sourceEntityId: activeTarget.sourceEntityId || null,

        answers: {
          working_feel_rating: answers.working_feel_rating,
          reliability: answers.reliability,
          standout_qualities: answers.standout_qualities,
          content_vision_match: answers.content_vision_match,
          note: answers.note,
          note_star_rating: answers.note_star_rating,
        },
      };

      const response = await post<any>(submitEndpoint, payload);

      if (response?.success === false) {
        throw new Error(response?.message || "Failed to submit review.");
      }

      await onSubmitted?.();
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to submit review."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNext() {
    if (submitting) return;

    setError("");

    if (!validateCurrentStep()) return;

    if (!isLastStep) {
      setStepIndex((prev) => prev + 1);
      return;
    }

    await submitReview();
  }

  function handleBack() {
    if (submitting) return;

    setError("");

    if (showIntro) {
      onClose();
      return;
    }

    if (stepIndex === 0) {
      setShowIntro(true);
      return;
    }

    setStepIndex((prev) => prev - 1);
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-[1px]">
      {showIntro ? (
        <div className="relative z-[91] w-full max-w-[20rem] overflow-hidden rounded-[1.25rem] bg-white shadow-2xl">
          <div className="relative h-[8rem] overflow-hidden bg-[linear-gradient(135deg,#FFECA8_0%,#FFD05D_42%,#FF6A4D_100%)]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#1A1A1A] shadow-sm hover:bg-[#F7F7F7] disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <span className="absolute left-7 top-8 text-lg">🎬</span>
            <span className="absolute left-16 top-4 text-sm">✨</span>
            <span className="absolute right-20 top-4 text-lg">🤝</span>
            <span className="absolute right-10 top-11 text-lg">🔥</span>
            <span className="absolute bottom-8 left-10 text-3xl">💕</span>
            <span className="absolute bottom-5 right-12 text-2xl">🥰</span>

            <div className="absolute -bottom-9 left-0 right-0 h-[4.5rem] rounded-t-[50%] bg-white" />

            <div className="absolute bottom-[-2.7rem] left-1/2 z-10 -translate-x-1/2">
              <Avatar
                name={influencerName}
                src={activeTarget.influencerAvatarUrl}
              />
            </div>
          </div>

          <div className="px-6 pb-6 pt-14 text-center">
            <h2 className="text-[1.05rem] font-semibold text-[#1A1A1A]">
              How was working with {influencerName}?
            </h2>

            <p className="mx-auto mt-2 max-w-[14rem] text-[0.72rem] leading-4 text-[#969696]">
              Your feedback helps creators grow, build stronger partnerships,
              and stand out through meaningful collaborations.
            </p>

            <button
              type="button"
              onClick={() => setShowIntro(false)}
              disabled={submitting}
              className="mt-5 flex h-9 w-full items-center justify-center rounded-[0.55rem] bg-[#1A1A1A] text-[0.75rem] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Rate Now
            </button>

            <button
              type="button"
              onClick={handleSkip}
              disabled={submitting}
              className="mt-3 text-[0.7rem] font-medium text-[#A3A3A3] hover:text-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Remind me later
            </button>
          </div>
        </div>
      ) : (
        <div className="relative z-[91] flex h-[min(92vh,42rem)] w-full max-w-[38rem] flex-col rounded-[1rem] bg-white shadow-2xl">
          <div className="flex items-center justify-between px-6 pt-6">
            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              className="text-[0.85rem] font-medium text-[#B5B5B5] hover:text-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#1A1A1A] hover:bg-[#F7F7F7] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-6 pt-5">
            <h2 className="max-w-[31rem] text-[1.1rem] font-semibold leading-6 text-[#1A1A1A]">
              {currentStep.title}
            </h2>

            <p className="mt-1 max-w-[32rem] text-[0.82rem] leading-5 text-[#969696]">
              {currentStep.subtitle}
            </p>

            <div className="mt-4 h-px bg-[#E6E6E6]" />
          </div>

          {error ? (
            <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-1 items-center px-6 py-7">
            {currentStep.key === "working_feel_rating" ? (
              <div className="grid w-full grid-cols-5 items-center gap-4">
                {emojiOptions.map((option) => {
                  const active = answers.working_feel_rating === option.value;
                  const hovered = hoveredEmoji === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setAnswer("working_feel_rating", option.value)
                      }
                      onMouseEnter={() => setHoveredEmoji(option.value)}
                      onMouseLeave={() => setHoveredEmoji(null)}
                      className="relative flex h-20 items-center justify-center rounded-xl transition hover:bg-[#F7F7F7]"
                    >
                      {active || hovered ? (
                        <span className="absolute -top-11 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-xl bg-[#1A1A1A] px-3 py-2 text-xs font-medium text-white shadow-lg after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-x-[0.45rem] after:border-t-[0.45rem] after:border-x-transparent after:border-t-[#1A1A1A]">
                          {option.label}
                        </span>
                      ) : null}

                      <span
                        className={cx(
                          "text-[1.9rem] transition",
                          active ? "scale-110" : "opacity-95"
                        )}
                      >
                        {option.emoji}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {currentStep.key === "reliability" ? (
              <div className="w-full space-y-4">
                {reliabilityOptions.map((option) => {
                  const active = answers.reliability === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setAnswer("reliability", option.value)}
                      className="flex w-full items-center gap-4 text-left"
                    >
                      <span
                        className={cx(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition",
                          active
                            ? "border-[#1A1A1A] bg-[#1A1A1A]"
                            : "border-[#D6D6D6] bg-white"
                        )}
                      >
                        {active ? (
                          <span className="h-2 w-2 rounded-full bg-white" />
                        ) : null}
                      </span>

                      <span className="text-[1rem] font-medium text-[#1A1A1A]">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {currentStep.key === "standout_qualities" ? (
              <div className="flex w-full flex-wrap gap-3">
                {qualityOptions.map((option) => {
                  const active = answers.standout_qualities.includes(
                    option.value
                  );

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleQuality(option.value)}
                      className={cx(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[0.8rem] font-semibold transition",
                        active
                          ? "bg-[#1A1A1A] text-white"
                          : "bg-[#F7F7F7] text-[#1A1A1A] hover:bg-[#EFEFEF]"
                      )}
                    >
                      {active ? (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[#1A1A1A]">
                          <Check className="h-3 w-3" />
                        </span>
                      ) : null}
                      {option.label}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {currentStep.key === "content_vision_match" ? (
              <div className="w-full space-y-4">
                {visionOptions.map((option) => {
                  const active = answers.content_vision_match === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setAnswer("content_vision_match", option.value)
                      }
                      className="flex w-full items-center gap-4 text-left"
                    >
                      <span
                        className={cx(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition",
                          active
                            ? "border-[#1A1A1A] bg-[#1A1A1A]"
                            : "border-[#D6D6D6] bg-white"
                        )}
                      >
                        {active ? (
                          <span className="h-2 w-2 rounded-full bg-white" />
                        ) : null}
                      </span>

                      <span className="text-[1rem] font-medium text-[#1A1A1A]">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {currentStep.key === "note" ? (
              <div className="w-full">
                <div className="mb-4 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, index) => {
                    const value = index + 1;
                    const active = value <= answers.note_star_rating;

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setAnswer("note_star_rating", value)}
                        className="text-[1.25rem] leading-none transition hover:scale-110"
                      >
                        <span
                          className={
                            active ? "text-[#FFB000]" : "text-[#E7E7E7]"
                          }
                        >
                          ★
                        </span>
                      </button>
                    );
                  })}
                </div>

                <textarea
                  value={answers.note}
                  onChange={(event) => setAnswer("note", event.target.value)}
                  maxLength={2000}
                  placeholder="Add Notes"
                  className="h-[13.5rem] w-full resize-none rounded-xl border border-[#E6E6E6] bg-[#FAFAFA] px-4 py-4 text-sm text-[#1A1A1A] outline-none placeholder:text-[#B5B5B5] focus:border-[#1A1A1A]"
                />
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between px-6 pb-6">
            <span className="text-[0.8rem] font-bold text-[#1A1A1A]">
              {stepIndex + 1} to {totalSteps}
            </span>

            <button
              type="button"
              onClick={handleSkip}
              disabled={submitting}
              className="text-[0.8rem] font-medium text-[#B5B5B5] hover:text-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Skip
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="flex h-10 min-w-[4.75rem] items-center justify-center rounded-[0.55rem] bg-[#1A1A1A] px-5 text-[0.8rem] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : isLastStep ? (
                "Submit"
              ) : (
                "Next"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}