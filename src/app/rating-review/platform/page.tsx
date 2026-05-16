"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, Loader2 } from "lucide-react";

type AudienceRole = "brand" | "influencer";
type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;

type QuestionnaireOption = {
    value: string | number;
    label: string;
    emoji?: string;
    score?: number;
};

type QuestionnaireQuestion = {
    key: string;
    label: string;
    type: string;
    placeholder?: string;
    options?: QuestionnaireOption[];
};

type Questionnaire = {
    reviewType: string;
    title: string;
    description: string;
    questions: QuestionnaireQuestion[];
};

type PlatformFeedbackConfig = {
    title?: string;
    description?: string;
    profileRoles?: string[];
    questionnaires?: Partial<Record<AudienceRole, Questionnaire>>;
};

const NOTO_EMOJI_GIF_BASE = "https://fonts.gstatic.com/s/e/notoemoji/latest";

const FALLBACK_PROFILE_ROLES = [
    "Founder / Owner",
    "Marketing Manager",
    "Creative Director",
    "Brand Manager",
    "Creator",
    "Influencer",
    "Talent Manager",
    "Other",
];

const FALLBACK_EMOJI_OPTIONS: QuestionnaireOption[] = [
    { value: 5, emoji: "😍", label: "Excellent", score: 5 },
    { value: 4, emoji: "😊", label: "Great", score: 4 },
    { value: 3, emoji: "🙂", label: "Good", score: 3 },
    { value: 2, emoji: "😐", label: "Okay", score: 2 },
    { value: 1, emoji: "😕", label: "Difficult", score: 1 },
];

const FEATURE_ICON_BY_VALUE: Record<string, string> = {
    campaign_management: "🚀",
    influencer_collaboration: "🤝",
    brand_collaboration: "🤝",
    payment_workflow: "💸",
    deliverable_tracking: "📦",
    influencer_tracking: "📊",
    profile_growth: "📈",
    creator_discovery: "🎯",
    platform_simplicity: "🧠",
    approval_workflow: "⚡",
    overall_experience: "🔥",
};

const FALLBACK_BRAND_FEATURES: QuestionnaireOption[] = [
    { value: "campaign_management", label: "Campaign Management" },
    { value: "influencer_collaboration", label: "Influencer Collaboration" },
    { value: "payment_workflow", label: "Payment Workflow" },
    { value: "deliverable_tracking", label: "Deliverable Tracking" },
    { value: "influencer_tracking", label: "Influencer Tracking" },
    { value: "creator_discovery", label: "Creator Discovery" },
    { value: "platform_simplicity", label: "Platform Simplicity" },
    { value: "approval_workflow", label: "Approval Workflow" },
    { value: "overall_experience", label: "Overall Experience" },
];

const FALLBACK_CREATOR_FEATURES: QuestionnaireOption[] = [
    { value: "campaign_management", label: "Campaign Management" },
    { value: "brand_collaboration", label: "Brand Collaboration" },
    { value: "payment_workflow", label: "Payment Workflow" },
    { value: "deliverable_tracking", label: "Deliverable Tracking" },
    { value: "profile_growth", label: "Profile Growth" },
    { value: "creator_discovery", label: "Creator Discovery" },
    { value: "platform_simplicity", label: "Platform Simplicity" },
    { value: "approval_workflow", label: "Approval Workflow" },
    { value: "overall_experience", label: "Overall Experience" },
];

function getApiBaseUrl() {
    return (
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        ""
    ).replace(/\/+$/, "");
}

function apiPath(path: string) {
    const baseUrl = getApiBaseUrl();
    return baseUrl ? `${baseUrl}${path}` : path;
}

function normalizeError(error: unknown) {
    if (error instanceof Error) return error.message;
    return "Something went wrong. Please try again.";
}

function getQuestion(questionnaire: Questionnaire | undefined, key: string) {
    return questionnaire?.questions?.find((question) => question.key === key);
}

function getOptionValue(option: QuestionnaireOption) {
    return String(option.value);
}

function getNotoEmojiCodepoint(emoji: string) {
    return Array.from(emoji)
        .map((character) => character.codePointAt(0)?.toString(16))
        .filter((value): value is string => Boolean(value))
        .join("_");
}

function getNotoEmojiGifUrl(emoji: string) {
    return `${NOTO_EMOJI_GIF_BASE}/${getNotoEmojiCodepoint(emoji)}/512.gif`;
}

function cleanFeatureLabel(option: QuestionnaireOption) {
    const raw = String(option.label || "");
    const icon = FEATURE_ICON_BY_VALUE[getOptionValue(option)];
    if (icon && raw.startsWith(icon)) return raw.slice(icon.length).trim();
    return raw.replace(/^[^\w\s]+\s*/u, "").trim() || raw;
}

function getFeatureIcon(option: QuestionnaireOption) {
    return FEATURE_ICON_BY_VALUE[getOptionValue(option)] || String(option.emoji || "").trim();
}

function NotoEmoji({
    emoji,
    label,
    size = "2rem",
}: {
    emoji: string;
    label?: string;
    size?: string;
}) {
    return (
        <span
            aria-label={label || emoji}
            role="img"
            style={{
                width: size,
                height: size,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                lineHeight: 1,
            }}
        >
            <img
                src={getNotoEmojiGifUrl(emoji)}
                alt={label || emoji}
                draggable={false}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    objectFit: "contain",
                }}
                onError={(event) => {
                    event.currentTarget.replaceWith(document.createTextNode(emoji));
                }}
            />
        </span>
    );
}

export default function PlatformRatingReviewPage() {
    const router = useRouter();
    const [config, setConfig] = useState<PlatformFeedbackConfig | null>(null);
    const [step, setStep] = useState<Step>(0);
    const [audienceRole, setAudienceRole] = useState<AudienceRole | "">("");
    const [name, setName] = useState("");
    const [organizationName, setOrganizationName] = useState("");
    const [profileRole, setProfileRole] = useState("Creative Director");
    const [rating, setRating] = useState<number | null>(null);
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const [note, setNote] = useState("");
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;

        async function loadConfig() {
            try {
                setLoadingConfig(true);
                const response = await fetch(apiPath("/campaign-reviews/platform-feedback/questionnaire"), {
                    method: "GET",
                    credentials: "include",
                });
                const payload = await response.json().catch(() => null);
                if (!response.ok || payload?.success === false) {
                    throw new Error(payload?.message || "Failed to load feedback form.");
                }
                if (mounted) setConfig(payload?.data || null);
            } catch {
                if (mounted) setConfig(null);
            } finally {
                if (mounted) setLoadingConfig(false);
            }
        }

        void loadConfig();

        return () => {
            mounted = false;
        };
    }, []);

    const questionnaire = useMemo(() => {
        if (!audienceRole) return undefined;
        return config?.questionnaires?.[audienceRole];
    }, [audienceRole, config]);

    const emojiOptions = useMemo(() => {
        return getQuestion(questionnaire, "working_feel_rating")?.options || FALLBACK_EMOJI_OPTIONS;
    }, [questionnaire]);

    const featureOptions = useMemo(() => {
        return (
            getQuestion(questionnaire, "standout_qualities")?.options ||
            (audienceRole === "influencer" ? FALLBACK_CREATOR_FEATURES : FALLBACK_BRAND_FEATURES)
        );
    }, [audienceRole, questionnaire]);

    const profileRoles = config?.profileRoles?.length ? config.profileRoles : FALLBACK_PROFILE_ROLES;

    const progress =
        step === 0 ? 0.1 : step === 1 ? 0.22 : step === 2 ? 0.38 : step === 3 ? 0.58 : step === 4 ? 0.78 : 1;

    const organizationLabel = audienceRole === "influencer" ? "What’s your creator / page name?" : "What’s your brand name?";
    const organizationPlaceholder = audienceRole === "influencer" ? "Creator / page name" : "Brand name";
    const thankYouName = name.trim() || organizationName.trim() || "there";

    function goNext() {
        setError("");

        if (step === 1 && !audienceRole) {
            setError("Please select whether you are a brand or creator.");
            return;
        }

        if (step === 2) {
            if (!name.trim()) {
                setError("Please enter your name.");
                return;
            }
            if (!organizationName.trim()) {
                setError(audienceRole === "influencer" ? "Please enter your creator / page name." : "Please enter your brand name.");
                return;
            }
        }

        if (step === 3 && !rating) {
            setError("Please select a rating to continue.");
            return;
        }

        if (step === 4 && !selectedFeatures.length) {
            setError("Please select at least one valuable part.");
            return;
        }

        setStep((current) => Math.min(6, current + 1) as Step);
    }

    function goBack() {
        setError("");
        setStep((current) => Math.max(0, current - 1) as Step);
    }

    function toggleFeature(value: string) {
        setSelectedFeatures((current) =>
            current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
        );
    }

    async function submitFeedback() {
        try {
            setError("");

            if (!audienceRole) {
                setStep(1);
                setError("Please select whether you are a brand or creator.");
                return;
            }

            if (!rating) {
                setStep(3);
                setError("Please select a rating before submitting.");
                return;
            }

            if (!selectedFeatures.length) {
                setStep(4);
                setError("Please select at least one valuable part before submitting.");
                return;
            }

            setSubmitting(true);

            const response = await fetch(apiPath("/campaign-reviews/platform-feedback/submit"), {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    audienceRole,
                    name,
                    organizationName,
                    profileRole,
                    rating,
                    noteStarRating: rating,
                    reviewText: note,
                    privateFeedback: note,
                    tags: selectedFeatures,
                    answers: {
                        working_feel_rating: rating,
                        standout_qualities: selectedFeatures,
                        note,
                        note_star_rating: rating,
                    },
                }),
            });

            const payload = await response.json().catch(() => null);

            if (!response.ok || payload?.success === false) {
                throw new Error(payload?.message || "Failed to submit feedback.");
            }

            setStep(6);
        } catch (submitError) {
            setError(normalizeError(submitError));
        } finally {
            setSubmitting(false);
        }
    }

    function skipForNow() {
        if (step <= 1) {
            router.push("/");
            return;
        }

        setError("");
        setStep((current) => Math.min(6, current + 1) as Step);
    }

    function pageTitle(children: string) {
        return (
            <h1
                style={{
                    margin: 0,
                    color: "var(--Text-Primary, #1A1A1A)",
                    fontFamily: "var(--Font-Family-Inter, Inter)",
                    fontSize: "var(--Font-Size-32, 2rem)",
                    fontStyle: "normal",
                    fontWeight: 600,
                    lineHeight: "var(--Line-Height-40, 2.5rem)",
                    letterSpacing: "var(--Letter-Spacing--1, -0.0625rem)",
                }}
            >
                {children}
            </h1>
        );
    }

    function helperText(children: string) {
        return (
            <p
                style={{
                    margin: "0.75rem 0 0",
                    color: "var(--Light-Text-Tertiary, #B8B8B8)",
                    fontFamily: "var(--Font-Family-Inter, Inter)",
                    fontSize: "var(--Font-Size-16, 1rem)",
                    fontStyle: "normal",
                    fontWeight: "var(--Font-Weight-Medium, 500)",
                    lineHeight: "var(--Line-Height-24, 1.5rem)",
                    letterSpacing: "var(--Letter-Spacing-0, 0)",
                }}
            >
                {children}
            </p>
        );
    }

    function backHeading(label: string) {
        return (
            <button
                type="button"
                onClick={goBack}
                style={{
                    border: 0,
                    background: "transparent",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: 0,
                    margin: 0,
                    color: "var(--Text-Primary, #1A1A1A)",
                    fontFamily: "var(--Font-Family-Inter, Inter)",
                    fontSize: "var(--Font-Size-16, 1rem)",
                    fontStyle: "normal",
                    fontWeight: 500,
                    lineHeight: "var(--Line-Height-24, 1.5rem)",
                    letterSpacing: "var(--Letter-Spacing-0, 0)",
                    cursor: "pointer",
                }}
            >
                <ChevronLeft size={24} strokeWidth={1.8} />
                {label}
            </button>
        );
    }

    function primaryButton({
        label,
        onClick,
        disabled = false,
    }: {
        label: string;
        onClick: () => void;
        disabled?: boolean;
    }) {
        return (
            <button
                type="button"
                onClick={onClick}
                disabled={disabled}
                style={{
                    width: "100%",
                    height: "4.5rem",
                    border: 0,
                    borderRadius: "1rem",
                    background: "#1A1A1A",
                    color: "#ffffff",
                    fontSize: "1rem",
                    fontWeight: 600,
                    lineHeight: "1.5rem",
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.72 : 1,
                    transition: "opacity 160ms ease, transform 160ms ease",
                    flexShrink: 0,
                }}
            >
                {label}
            </button>
        );
    }

    function skipButton(disabled = false) {
        return (
            <button
                type="button"
                onClick={skipForNow}
                disabled={disabled}
                style={{
                    width: "100%",
                    border: 0,
                    background: "transparent",
                    color: "var(--Light-Text-Tertiary, #B8B8B8)",
                    fontSize: "1rem",
                    fontWeight: 600,
                    lineHeight: "1.5rem",
                    marginTop: "1.5rem",
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.72 : 1,
                }}
            >
                Skip for now
            </button>
        );
    }

    function errorMessage() {
        if (!error) return null;

        return (
            <p
                style={{
                    margin: "1rem 0 0",
                    color: "#E11D1D",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    lineHeight: "1.25rem",
                }}
            >
                {error}
            </p>
        );
    }

    return (
        <main
            style={{
                minHeight: "100dvh",
                width: "100%",
                background: "#ffffff",
                color: "var(--Text-Primary, #1A1A1A)",
                fontFamily: "var(--Font-Family-Inter, Inter)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "1rem",
                boxSizing: "border-box",
                overflow: "auto",
            }}
        >
            <section
                style={{
                    display: "flex",
                    width: "min(32.5rem, calc(100vw - 2rem))",
                    height: "min(47.8125rem, calc(100dvh - 2rem))",
                    minHeight: "34rem",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "2.5rem",
                    boxSizing: "border-box",
                    overflow: "hidden",
                }}
            >
                {step < 6 ? (
                    <div
                        style={{
                            width: "100%",
                            height: "0.1875rem",
                            background: "#EEEEEE",
                            borderRadius: 999,
                            overflow: "hidden",
                            flexShrink: 0,
                        }}
                    >
                        <div
                            style={{
                                width: `${progress * 100}%`,
                                height: "100%",
                                background: "#18A64A",
                                borderRadius: 999,
                                transition: "width 220ms ease",
                            }}
                        />
                    </div>
                ) : null}

                {loadingConfig && step === 0 ? (
                    <div
                        style={{
                            flex: 1,
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.625rem",
                            color: "var(--Light-Text-Tertiary, #B8B8B8)",
                            fontWeight: 600,
                            fontSize: "1rem",
                        }}
                    >
                        <Loader2 size={18} />
                        Loading feedback form...
                    </div>
                ) : null}

                {!loadingConfig && step === 0 ? (
                    <div
                        style={{
                            flex: 1,
                            width: "100%",
                            minHeight: 0,
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                        }}
                    >
                        <div style={{ flexShrink: 0 }}>
                            <p
                                style={{
                                    margin: 0,
                                    color: "var(--Text-Primary, #1A1A1A)",
                                    fontFamily: "var(--Font-Family-Inter, Inter)",
                                    fontSize: "var(--Font-Size-16, 1rem)",
                                    fontWeight: 500,
                                    lineHeight: "var(--Line-Height-24, 1.5rem)",
                                    letterSpacing: "var(--Letter-Spacing-0, 0)",
                                }}
                            >
                                You’re Almost there...
                            </p>
                            <div style={{ marginTop: "1.5rem" }}>{pageTitle("Time to rate us")}</div>
                            {helperText("We’ll use these details to securely connect your feedback with your collaboration experience on CollabGlam.")}
                        </div>

                        <div
                            style={{
                                flex: 1,
                                width: "100%",
                                minHeight: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "1.5rem 0",
                                boxSizing: "border-box",
                            }}
                        >
                            <NotoEmoji emoji="🏆" label="Trophy" size="11rem" />
                        </div>

                        {primaryButton({ label: "Let’s go", onClick: () => setStep(1) })}
                    </div>
                ) : null}

                {step === 1 ? (
                    <div
                        style={{
                            flex: 1,
                            width: "100%",
                            minHeight: 0,
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                        }}
                    >
                        <div style={{ flexShrink: 0 }}>
                            {backHeading("Back")}
                            <p
                                style={{
                                    margin: "1.5rem 0 1.125rem",
                                    color: "var(--Text-Primary, #1A1A1A)",
                                    fontFamily: "var(--Font-Family-Inter, Inter)",
                                    fontSize: "var(--Font-Size-16, 1rem)",
                                    fontWeight: 500,
                                    lineHeight: "var(--Line-Height-24, 1.5rem)",
                                }}
                            >
                                You’re Almost there...
                            </p>
                            {pageTitle("Tell us about yourself")}
                            {helperText("We’ll use these details to securely connect your feedback with your collaboration experience on CollabGlam.")}
                        </div>

                        <div style={{ display: "grid", gap: "0.875rem", width: "100%", marginTop: "2rem" }}>
                            {[
                                { value: "brand" as AudienceRole, label: "I’m a Brand", icon: "🎯" },
                                { value: "influencer" as AudienceRole, label: "I’m a Creator", icon: "✨" },
                            ].map((item) => {
                                const selected = audienceRole === item.value;

                                return (
                                    <button
                                        key={item.value}
                                        type="button"
                                        onClick={() => setAudienceRole(item.value)}
                                        style={{
                                            width: "100%",
                                            minHeight: "3.5rem",
                                            border: selected ? "1px solid #1A1A1A" : "1px solid #E8E8E8",
                                            borderRadius: "0.875rem",
                                            background: selected ? "#1A1A1A" : "#ffffff",
                                            color: selected ? "#ffffff" : "var(--Text-Primary, #1A1A1A)",
                                            padding: "0 1rem",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.75rem",
                                            cursor: "pointer",
                                            fontSize: "0.875rem",
                                            fontWeight: 600,
                                            lineHeight: "1.25rem",
                                            boxSizing: "border-box",
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: "1.125rem",
                                                height: "1.125rem",
                                                borderRadius: 999,
                                                border: selected ? 0 : "1px solid #DEDEDE",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                background: selected ? "#ffffff" : "transparent",
                                                color: "#1A1A1A",
                                                fontSize: "0.75rem",
                                                flexShrink: 0,
                                            }}
                                        >
                                            {selected ? "✓" : ""}
                                        </span>
                                        <NotoEmoji emoji={item.icon} label={item.label} size="1.25rem" />
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {errorMessage()}

                        <div style={{ marginTop: "auto", width: "100%", paddingTop: "2rem", flexShrink: 0 }}>
                            {primaryButton({ label: "Let’s go", onClick: goNext })}
                        </div>
                    </div>
                ) : null}

                {step === 2 ? (
                    <div
                        style={{
                            flex: 1,
                            width: "100%",
                            minHeight: 0,
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                        }}
                    >
                        <div style={{ flexShrink: 0 }}>
                            {backHeading("1 of 4 task")}
                            <div style={{ marginTop: "1.5rem" }}>{pageTitle("Lets Get started")}</div>
                            {helperText("We’ll use these details to securely connect your feedback with your collaboration experience on CollabGlam.")}
                        </div>

                        <div style={{ display: "grid", gap: "1.25rem", width: "100%", marginTop: "2.5rem", flexShrink: 0 }}>
                            <label
                                style={{
                                    display: "block",
                                    border: "1px solid #D9D9D9",
                                    borderRadius: "0.875rem",
                                    minHeight: "4.25rem",
                                    padding: "0.625rem 0.75rem 0.5rem",
                                    boxSizing: "border-box",
                                }}
                            >
                                <span style={{ display: "block", color: "#9A9A9A", fontSize: "1rem", fontWeight: 500, lineHeight: "1.5rem" }}>
                                    Tell us your name?
                                </span>
                                <input
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    placeholder="Your name"
                                    style={{
                                        width: "100%",
                                        border: 0,
                                        outline: "none",
                                        padding: 0,
                                        margin: 0,
                                        fontSize: "1rem",
                                        fontWeight: 500,
                                        lineHeight: "1.5rem",
                                        color: "var(--Text-Primary, #1A1A1A)",
                                        background: "transparent",
                                    }}
                                />
                            </label>

                            <label
                                style={{
                                    display: "block",
                                    border: "1px solid #D9D9D9",
                                    borderRadius: "0.875rem",
                                    minHeight: "4.25rem",
                                    padding: "0.625rem 0.75rem 0.5rem",
                                    boxSizing: "border-box",
                                }}
                            >
                                <span style={{ display: "block", color: "#9A9A9A", fontSize: "1rem", fontWeight: 500, lineHeight: "1.5rem" }}>
                                    {organizationLabel}
                                </span>
                                <input
                                    value={organizationName}
                                    onChange={(event) => setOrganizationName(event.target.value)}
                                    placeholder={organizationPlaceholder}
                                    style={{
                                        width: "100%",
                                        border: 0,
                                        outline: "none",
                                        padding: 0,
                                        margin: 0,
                                        fontSize: "1rem",
                                        fontWeight: 500,
                                        lineHeight: "1.5rem",
                                        color: "var(--Text-Primary, #1A1A1A)",
                                        background: "transparent",
                                    }}
                                />
                            </label>

                            <label
                                style={{
                                    display: "block",
                                    position: "relative",
                                    border: "1px solid #D9D9D9",
                                    borderRadius: "0.875rem",
                                    minHeight: "4.25rem",
                                    padding: "0.625rem 0.75rem 0.5rem",
                                    boxSizing: "border-box",
                                }}
                            >
                                <span style={{ display: "block", color: "#9A9A9A", fontSize: "1rem", fontWeight: 500, lineHeight: "1.5rem" }}>
                                    What’s your role in the organization?
                                </span>
                                <select
                                    value={profileRole}
                                    onChange={(event) => setProfileRole(event.target.value)}
                                    style={{
                                        width: "100%",
                                        border: 0,
                                        outline: "none",
                                        appearance: "none",
                                        padding: 0,
                                        margin: 0,
                                        fontSize: "1rem",
                                        fontWeight: 500,
                                        lineHeight: "1.5rem",
                                        color: "var(--Text-Primary, #1A1A1A)",
                                        background: "transparent",
                                    }}
                                >
                                    {profileRoles.map((role) => (
                                        <option key={role} value={role}>
                                            {role}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={18} color="#9A9A9A" style={{ position: "absolute", right: "0.875rem", bottom: "1rem", pointerEvents: "none" }} />
                            </label>
                        </div>

                        {errorMessage()}

                        <div style={{ marginTop: "auto", width: "100%", paddingTop: "2rem", flexShrink: 0 }}>
                            {primaryButton({ label: "Next", onClick: goNext })}
                            {skipButton()}
                        </div>
                    </div>
                ) : null}

                {step === 3 ? (
                    <div
                        style={{
                            flex: 1,
                            width: "100%",
                            minHeight: 0,
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                        }}
                    >
                        <div style={{ flexShrink: 0 }}>
                            {backHeading("2 of 4 task")}
                            <div style={{ marginTop: "1.5rem" }}>{pageTitle("How has your overall experience with Collabglam been?")}</div>
                            {helperText("Think about your experience managing campaigns, creator collaborations, communication, approvals, and workflows across the platform.")}
                        </div>

                        <div
                            style={{
                                flex: 1,
                                minHeight: 0,
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "0.75rem",
                                padding: "2rem 0",
                                boxSizing: "border-box",
                            }}
                        >
                            {emojiOptions.map((option) => {
                                const value = Number(option.value);
                                const selected = rating === value;
                                const emoji = String(option.emoji || "");

                                return (
                                    <button
                                        key={getOptionValue(option)}
                                        type="button"
                                        onClick={() => setRating(value)}
                                        aria-label={option.label}
                                        style={{
                                            width: "4.25rem",
                                            height: "4.25rem",
                                            border: selected ? "2px solid #1A1A1A" : "2px solid transparent",
                                            borderRadius: 999,
                                            background: selected ? "#FFF6D6" : "transparent",
                                            cursor: "pointer",
                                            transform: selected ? "scale(1.08)" : "scale(1)",
                                            transition: "all 160ms ease",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            padding: "0.375rem",
                                        }}
                                    >
                                        {emoji ? <NotoEmoji emoji={emoji} label={option.label} size="3.25rem" /> : option.label}
                                    </button>
                                );
                            })}
                        </div>

                        {error ? (
                            <p style={{ margin: "0 0 1rem", color: "#E11D1D", fontSize: "0.875rem", fontWeight: 600 }}>{error}</p>
                        ) : null}

                        <div style={{ width: "100%", flexShrink: 0 }}>
                            {primaryButton({ label: "Next", onClick: goNext })}
                            {skipButton()}
                        </div>
                    </div>
                ) : null}

                {step === 4 ? (
                    <div
                        style={{
                            flex: 1,
                            width: "100%",
                            minHeight: 0,
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                        }}
                    >
                        <div style={{ flexShrink: 0 }}>
                            {backHeading("3 of 4 task")}
                            <div style={{ marginTop: "1.5rem" }}>{pageTitle("What parts of Collabglam have been most valuable to you?")}</div>
                            {helperText("Select the features, workflows, or experiences that genuinely stood out while using the platform.")}
                        </div>

                        <div
                            style={{
                                width: "100%",
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "0.75rem",
                                marginTop: "2.25rem",
                                overflowY: "auto",
                                paddingRight: "0.125rem",
                                boxSizing: "border-box",
                            }}
                        >
                            {featureOptions.map((option) => {
                                const value = getOptionValue(option);
                                const selected = selectedFeatures.includes(value);
                                const icon = getFeatureIcon(option);
                                const label = cleanFeatureLabel(option);

                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => toggleFeature(value)}
                                        style={{
                                            border: 0,
                                            borderRadius: 999,
                                            background: selected ? "#1A1A1A" : "#F7F7F7",
                                            color: selected ? "#ffffff" : "var(--Text-Primary, #1A1A1A)",
                                            padding: "0.5625rem 0.8125rem",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "0.4375rem",
                                            fontSize: "1rem",
                                            fontWeight: 600,
                                            lineHeight: "1.5rem",
                                            cursor: "pointer",
                                            boxShadow: selected ? "0 0.5rem 1.125rem rgba(0,0,0,0.12)" : "none",
                                        }}
                                    >
                                        {selected ? (
                                            <span
                                                style={{
                                                    width: "0.9375rem",
                                                    height: "0.9375rem",
                                                    borderRadius: 999,
                                                    background: "#ffffff",
                                                    color: "#1A1A1A",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "0.625rem",
                                                    fontWeight: 700,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                ✓
                                            </span>
                                        ) : null}
                                        {icon ? <NotoEmoji emoji={icon} label={label} size="1.25rem" /> : null}
                                        {label}
                                    </button>
                                );
                            })}
                        </div>

                        {errorMessage()}

                        <div style={{ marginTop: "auto", width: "100%", paddingTop: "2rem", flexShrink: 0 }}>
                            {primaryButton({ label: "Next", onClick: goNext })}
                            {skipButton()}
                        </div>
                    </div>
                ) : null}

                {step === 5 ? (
                    <div
                        style={{
                            flex: 1,
                            width: "100%",
                            minHeight: 0,
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                        }}
                    >
                        <div style={{ flexShrink: 0 }}>
                            {backHeading("4 of 4 task")}
                            <div style={{ marginTop: "1.5rem" }}>{pageTitle("Anything you'd love to share with the Collabglam team?")}</div>
                            {helperText("Share feedback, suggestions, appreciation, or ideas that could help us improve your creator collaboration experience even further.")}
                        </div>

                        <textarea
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                            placeholder="Add Notes"
                            style={{
                                width: "100%",
                                minHeight: "11rem",
                                resize: "vertical",
                                border: "1px solid #E1E1E1",
                                borderRadius: "0.875rem",
                                outline: "none",
                                background: "#FAFAFA",
                                padding: "1rem",
                                fontSize: "0.9375rem",
                                color: "var(--Text-Primary, #1A1A1A)",
                                fontWeight: 500,
                                lineHeight: "1.5rem",
                                marginTop: "2.5rem",
                                boxSizing: "border-box",
                            }}
                        />

                        {errorMessage()}

                        <div style={{ marginTop: "auto", width: "100%", paddingTop: "2rem", flexShrink: 0 }}>
                            {primaryButton({ label: submitting ? "Submitting..." : "Submit Feedback", onClick: () => void submitFeedback(), disabled: submitting })}
                            {skipButton(submitting)}
                        </div>
                    </div>
                ) : null}

                {step === 6 ? (
                    <div
                        style={{
                            flex: 1,
                            width: "100%",
                            minHeight: 0,
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                        }}
                    >
                        {pageTitle(`Thanks ${thankYouName} for helping improve Collabglam ✨`)}
                        {helperText("We’ll use these details to securely connect your feedback with your collaboration experience on CollabGlam.")}

                        <div
                            style={{
                                flex: 1,
                                minHeight: 0,
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "2.5rem 0",
                                boxSizing: "border-box",
                            }}
                        >
                            <NotoEmoji emoji="🎉" label="Party popper" size="13rem" />
                        </div>

                        <button
                            type="button"
                            onClick={() => router.push(audienceRole === "brand" ? "/brand/dashboard" : "/influencer/dashboard")}
                            style={{
                                width: "100%",
                                height: "4rem",
                                border: 0,
                                borderRadius: "0.875rem",
                                background: "#1A1A1A",
                                color: "#ffffff",
                                fontSize: "1rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                flexShrink: 0,
                            }}
                        >
                            Go to dashboard
                        </button>
                    </div>
                ) : null}
            </section>
        </main>
    );
}
