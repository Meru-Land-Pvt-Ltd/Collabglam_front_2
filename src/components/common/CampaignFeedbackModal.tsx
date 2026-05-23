"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react"

import api, { post } from "@/lib/api"
import { Button } from "@/components/ui/buttonComp"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

type ReviewType = "brand_to_influencer"
type AnswerType = "emoji_rating" | "single_select" | "multi_select" | "text"
type HeroVariant = "creator" | "brand"
type Answers = Record<string, unknown>

type QuestionnaireOption = {
  value: string | number
  emoji?: string
  label: string
  score?: number
}

type QuestionnaireQuestion = {
  key: string
  label: string
  type: AnswerType
  required: boolean
  description?: string
  placeholder?: string
  maxLength?: number
  options?: QuestionnaireOption[]
  noteStarRating?: {
    enabled: boolean
    key: string
    label: string
    required: boolean
    min: number
    max: number
    options?: QuestionnaireOption[]
  }
}

type Questionnaire = {
  version: number
  reviewType: ReviewType
  title: string
  description: string
  questions: QuestionnaireQuestion[]
}

type CampaignFeedbackModalProps = {
  open: boolean
  campaignId: string
  brandId: string
  influencerId: string
  influencerName?: string
  campaignName?: string
  influencerAvatarSrc?: string
  onClose: () => void
  onSubmitted?: () => void
}

type SubmitResponse = {
  success: boolean
  message?: string
  data?: unknown
}

const API_PREFIX = "/campaign-reviews"
const NOTO_EMOJI_GIF_BASE = "https://fonts.gstatic.com/s/e/notoemoji/latest"

const FALLBACK_EMOJI_OPTIONS: QuestionnaireOption[] = [
  { value: 5, emoji: "😍", label: "Amazing", score: 5 },
  { value: 4, emoji: "😊", label: "Smooth", score: 4 },
  { value: 3, emoji: "🙂", label: "Good", score: 3 },
  { value: 2, emoji: "😐", label: "Average", score: 2 },
  { value: 1, emoji: "😕", label: "Difficult", score: 1 },
]

const EMOJI_CODEPOINTS: Record<string, string> = {
  "😍": "1f60d",
  "😊": "1f60a",
  "🙂": "1f642",
  "😐": "1f610",
  "😕": "1f615",
  "👏": "1f44f",
}

const CREATOR_HERO_GRADIENT =
  "linear-gradient(109deg, #FAFAFA 30.17%, rgba(255, 191, 0, 0.83) 50%, #F6BB2A 57.65%, #F3584E 74.04%, #E078D1 84.62%), #F9F9F9"

const BRAND_HERO_GRADIENT =
  "var(--Gradient-Brand-Primary-Radial, radial-gradient(100% 100% at 50% 0%, #FF8C01 0%, #FFBF00 37.94%, #FFFFFF 90.87%))"

const CREATOR_FLOATERS = [
  { icon: "▶️", className: "left-[52px] top-[34px] rotate-[-8deg] text-[18px]" },
  { icon: "✨", className: "left-[92px] top-[76px] text-[10px]" },
  { icon: "🌟", className: "left-[120px] top-[28px] text-[16px]" },
  { icon: "✨", className: "left-[158px] top-[34px] text-[9px]" },
  { icon: "✌️", className: "left-[128px] top-[106px] rotate-[-14deg] text-[38px]" },
  { icon: "💚", className: "left-[218px] top-[18px] text-[34px]" },
  { icon: "🎬", className: "left-[268px] top-[26px] rotate-[-16deg] text-[15px]" },
  { icon: "🔥", className: "left-[302px] top-[50px] text-[18px]" },
  { icon: "🌟", className: "right-[46px] top-[56px] text-[22px]" },
  { icon: "🤝", className: "left-[202px] top-[96px] text-[15px]" },
  { icon: "😻", className: "right-[98px] top-[116px] rotate-[14deg] text-[42px]" },
]

const BRAND_STARS = [
  "left-[18px] top-[15px] text-[24px]",
  "left-[54px] top-[92px] text-[17px]",
  "left-[123px] top-[105px] text-[30px]",
  "left-[232px] top-[43px] text-[22px]",
  "left-[342px] top-[94px] text-[18px]",
  "right-[31px] top-[138px] text-[28px]",
  "right-[39px] top-[5px] text-[18px]",
]

function unwrap<T = any>(res: any): T {
  return (res?.data ?? res) as T
}

function getApiErrorMessage(err: any, fallback = "Something went wrong.") {
  const responseData = err?.response?.data

  if (typeof responseData?.message === "string") return responseData.message
  if (typeof responseData?.error === "string") return responseData.error
  if (typeof err?.message === "string") return err.message

  return fallback
}

function getNotoEmojiGifUrl(emoji?: string) {
  const codepoint = emoji ? EMOJI_CODEPOINTS[emoji] : ""
  return codepoint ? `${NOTO_EMOJI_GIF_BASE}/${codepoint}/512.gif` : ""
}

function renderText(value = "", variables: Record<string, string>) {
  return String(value || "")
    .replace(/{{brandName}}/g, variables.brandName || "the brand")
    .replace(/{{influencerName}}/g, variables.influencerName || "the creator")
    .replace(/{{campaignName}}/g, variables.campaignName || "the campaign")
}

function extractQuestionnaire(payload: any) {
  const data = payload?.data ?? payload

  if (data?.brand_to_influencer?.questions?.length) {
    return data.brand_to_influencer as Questionnaire
  }

  if (data?.questionnaires?.brand_to_influencer?.questions?.length) {
    return data.questionnaires.brand_to_influencer as Questionnaire
  }

  return null
}

function hydrateQuestionnaire(questionnaire: Questionnaire, variables: Record<string, string>): Questionnaire {
  return {
    ...questionnaire,
    title: renderText(questionnaire.title, variables),
    description: renderText(questionnaire.description, variables),
    questions: questionnaire.questions.map((question) => ({
      ...question,
      label: renderText(question.label, variables),
      description: renderText(question.description || "", variables),
      placeholder: renderText(question.placeholder || "", variables),
    })),
  }
}

function buildInitialAnswers(questionnaire?: Questionnaire | null): Answers {
  const answers: Answers = {}

  for (const question of questionnaire?.questions || []) {
    answers[question.key] = question.type === "multi_select" ? [] : ""

    if (question.noteStarRating?.enabled) {
      answers[question.noteStarRating.key] = 0
    }
  }

  return answers
}

export default function CampaignFeedbackModal({
  open,
  campaignId,
  brandId,
  influencerId,
  influencerName = "the creator",
  campaignName = "Campaign",
  influencerAvatarSrc = "",
  onClose,
  onSubmitted,
}: CampaignFeedbackModalProps) {
  const [loading, setLoading] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState("")
  const [questionnaire, setQuestionnaire] = React.useState<Questionnaire | null>(null)
  const [started, setStarted] = React.useState(false)
  const [step, setStep] = React.useState(0)
  const [answers, setAnswers] = React.useState<Answers>({})
  const [submitted, setSubmitted] = React.useState(false)

  const variables = React.useMemo(
    () => ({
      brandName: "the brand",
      influencerName,
      campaignName,
    }),
    [influencerName, campaignName]
  )

  React.useEffect(() => {
    if (!open) {
      setLoading(false)
      setSubmitting(false)
      setError("")
      setQuestionnaire(null)
      setStarted(false)
      setStep(0)
      setAnswers({})
      setSubmitted(false)
      return
    }

    let isMounted = true

    async function loadModal() {
      if (!campaignId || !brandId || !influencerId) {
        setError("Campaign, brand, or influencer id is missing.")
        setLoading(false)
        return
      }

      setLoading(true)
      setError("")
      setSubmitted(false)
      setStarted(false)
      setStep(0)

      try {
        const stateRes = await post<any>(`${API_PREFIX}/brand/prompt-state`, {
          campaignId,
          brandId,
          influencerId,
        })

        const statePayload = unwrap<any>(stateRes)
        const shouldPrompt = Boolean(
          statePayload?.shouldPrompt ?? statePayload?.data?.shouldPrompt
        )

        if (!shouldPrompt) {
          if (isMounted) onClose()
          return
        }

        const questionnaireRes = await api.get(`${API_PREFIX}/questionnaires`)
        const questionnairePayload = unwrap<any>(questionnaireRes)
        const brandQuestionnaire = extractQuestionnaire(questionnairePayload)

        if (!brandQuestionnaire?.questions?.length) {
          throw new Error("Brand feedback questionnaire not found.")
        }

        const preparedQuestionnaire = hydrateQuestionnaire(brandQuestionnaire, variables)

        if (!isMounted) return

        setQuestionnaire(preparedQuestionnaire)
        setAnswers(buildInitialAnswers(preparedQuestionnaire))
      } catch (err) {
        if (!isMounted) return
        setError(getApiErrorMessage(err, "Failed to load feedback form."))
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void loadModal()

    return () => {
      isMounted = false
    }
  }, [open, campaignId, brandId, influencerId, onClose, variables])

  React.useEffect(() => {
    if (!submitted) return

    const timer = window.setTimeout(() => {
      onSubmitted?.()
      onClose()
    }, 1500)

    return () => window.clearTimeout(timer)
  }, [submitted, onClose, onSubmitted])

  const questions = React.useMemo(() => questionnaire?.questions || [], [questionnaire])
  const currentQuestion = questions[step]
  const isLastQuestion = step === questions.length - 1
  const submittedRating = getSubmittedRating(answers)
  const heroVariant: HeroVariant = "creator"

  const canGoNext = currentQuestion
    ? currentQuestion.key === "note"
      ? Number(answers.note_star_rating || 0) >= 1
      : currentQuestion.required
        ? isQuestionAnswered(currentQuestion, answers[currentQuestion.key])
        : true
    : false

  const updateAnswer = React.useCallback((key: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    setError("")
  }, [])

  const submitReview = React.useCallback(async () => {
    if (!questionnaire) return

    const missingQuestion = questions.find(
      (question) => question.required && !isQuestionAnswered(question, answers[question.key])
    )

    if (missingQuestion) {
      setStep(Math.max(0, questions.findIndex((question) => question.key === missingQuestion.key)))
      setError(`${missingQuestion.label} is required.`)
      return
    }

    if (Number(answers.note_star_rating || 0) < 1) {
      const noteIndex = questions.findIndex((question) => question.key === "note")
      if (noteIndex >= 0) setStep(noteIndex)
      setError("Please select a star rating before continuing.")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      await post<SubmitResponse>(`${API_PREFIX}/brand/submit`, {
        campaignId,
        brandId,
        influencerId,
        answers: buildSubmitAnswers(answers, questions),
      })

      setSubmitted(true)
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to submit review."))
    } finally {
      setSubmitting(false)
    }
  }, [answers, brandId, campaignId, influencerId, questionnaire, questions])

  const handleNext = React.useCallback(async () => {
    if (!currentQuestion) return

    if (currentQuestion.key === "note" && Number(answers.note_star_rating || 0) < 1) {
      setError("Please select a star rating before continuing.")
      return
    }

    if (currentQuestion.required && !isQuestionAnswered(currentQuestion, answers[currentQuestion.key])) {
      setError("Please answer this question before continuing.")
      return
    }

    setError("")

    if (!isLastQuestion) {
      setStep((prev) => prev + 1)
      return
    }

    await submitReview()
  }, [answers, currentQuestion, isLastQuestion, submitReview])

  const handleSkip = React.useCallback(async () => {
    if (currentQuestion?.key === "note" && Number(answers.note_star_rating || 0) < 1) {
      setError("Please select a star rating before continuing.")
      return
    }

    setError("")

    if (!isLastQuestion) {
      setStep((prev) => prev + 1)
      return
    }

    await submitReview()
  }, [answers.note_star_rating, currentQuestion?.key, isLastQuestion, submitReview])

  const handleBack = React.useCallback(() => {
    setError("")
    if (step === 0) setStarted(false)
    else setStep((prev) => Math.max(0, prev - 1))
  }, [step])

  if (!open) return null

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[99999] bg-black/40">
        <SubmitSuccessScreen
          rating={submittedRating}
          targetName={influencerName}
          avatarSrc={influencerAvatarSrc}
          avatarVariant={heroVariant}
        />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 px-0 sm:px-5">
      <section className="relative min-h-screen w-full overflow-hidden bg-white shadow-none sm:min-h-[560px] sm:max-w-[444px] sm:rounded-[24px] sm:shadow-[0_22px_70px_rgba(0,0,0,0.10)]">
        {loading ? (
          <CenteredStateContent
            icon="loading"
            title="Loading review"
            description="Please wait while we open this review."
          />
        ) : error && !questionnaire ? (
          <CenteredStateContent
            icon="error"
            title="Review unavailable"
            description={error}
            actionLabel="Close"
            onAction={onClose}
          />
        ) : !questionnaire || questions.length === 0 ? (
          <CenteredStateContent
            icon="error"
            title="Review not found"
            description="We could not find a valid questionnaire for this feedback."
            actionLabel="Close"
            onAction={onClose}
          />
        ) : (
          <AnimatePresence mode="wait">
            {!started ? (
              <IntroScreen
                key="intro"
                targetName={influencerName}
                campaignName={campaignName || "Campaign"}
                avatarSrc={influencerAvatarSrc}
                heroVariant={heroVariant}
                onClose={onClose}
                onStart={() => setStarted(true)}
              />
            ) : (
              <QuestionScreen
                key={currentQuestion?.key || step}
                question={currentQuestion}
                value={answers[currentQuestion.key]}
                answers={answers}
                step={step}
                total={questions.length}
                error={error}
                submitting={submitting}
                canGoNext={canGoNext}
                onChange={(value) => updateAnswer(currentQuestion.key, value)}
                onMetaChange={updateAnswer}
                onBack={handleBack}
                onClose={onClose}
                onNext={handleNext}
                onSkip={handleSkip}
              />
            )}
          </AnimatePresence>
        )}
      </section>
    </div>
  )
}

function IntroScreen({
  targetName,
  campaignName,
  avatarSrc,
  heroVariant,
  onClose,
  onStart,
}: {
  targetName: string
  campaignName: string
  avatarSrc?: string
  heroVariant: HeroVariant
  onClose: () => void
  onStart: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="relative flex min-h-screen flex-col bg-white sm:min-h-[560px]"
    >
      <div className="relative h-[188px] overflow-visible">
        <HeroBanner variant={heroVariant} />

        <button
          type="button"
          aria-label="Close rating modal"
          onClick={onClose}
          className="absolute right-[18px] top-[18px] z-40 flex size-9 items-center justify-center rounded-full bg-white text-[#1C1C1C] shadow-sm transition hover:scale-105"
        >
          <X className="size-5" strokeWidth={2.5} />
        </button>

        <AvatarCircle
          name={targetName}
          src={avatarSrc}
          variant={heroVariant}
          className="absolute bottom-[-36px] left-1/2 z-40 -translate-x-1/2"
        />
      </div>

      <div className="relative z-20 flex flex-1 flex-col px-5 pb-5 pt-[62px] text-center">
        <h1 className="mx-auto max-w-[365px] text-[18px] font-bold leading-[1.25] tracking-[-0.01em] text-[#222222]">
          How was working with {targetName}?
        </h1>

        <p className="mx-auto mt-3 max-w-[322px] text-[14px] leading-[1.35] text-[#A0A0A0]">
          Share your campaign experience for {campaignName}. Your feedback helps creators grow, build stronger partnerships, and stand out through meaningful collaborations.
        </p>

        <div className="mt-auto space-y-3 pt-10">
          <Button
            className="h-[48px] w-full rounded-[12px] bg-[#1C1C1C] text-[14px] font-semibold text-white hover:bg-[#111111]"
            onClick={onStart}
          >
            Rate Now
          </Button>

          <button type="button" className="h-10 text-[13px] font-medium text-[#9A9A9A]" onClick={onClose}>
            Remind me later
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function HeroBanner({ variant }: { variant: HeroVariant }) {
  if (variant === "brand") return <BrandHeroBanner />

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#F9F9F9]" style={{ background: CREATOR_HERO_GRADIENT }}>
      <CreatorHeroBeams />
      <CreatorHeroFloaters />
      <CreatorHeroClouds />
    </div>
  )
}

function BrandHeroBanner() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-white" style={{ background: BRAND_HERO_GRADIENT }}>
      <BrandHeroBeams />
      <BrandHeroStars />
      <div className="pointer-events-none absolute inset-x-0 bottom-[-1px] z-[3] h-[78px] bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,#FFFFFF_72%)]" />
    </div>
  )
}

function CreatorHeroBeams() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden="true">
      <svg
        className="absolute left-[4.1rem] top-[-0.65rem]"
        style={{ width: "3.09375rem", height: "11.4375rem", transform: "rotate(-2.992deg)" }}
        viewBox="0 0 50 89"
        fill="none"
        preserveAspectRatio="none"
      >
        <path d="M1.43813 -94.66L21.9102 -95.7299L49.4364 86.0813L0.00385993 88.6647L1.43813 -94.66Z" fill="url(#modal_hero_beam_left)" />
        <defs>
          <linearGradient id="modal_hero_beam_left" x1="15.1694" y1="-95.3776" x2="24.7201" y2="87.373" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFE28A" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <svg
        className="absolute left-[11.7rem] top-[-0.65rem]"
        style={{ width: "4.0715rem", height: "11.4375rem", transform: "rotate(-12.304deg)" }}
        viewBox="0 0 89 97"
        fill="none"
        preserveAspectRatio="none"
      >
        <path d="M0.00328702 -85.202L26.3624 -90.951L88.5029 82.798L24.8553 96.6797L0.00328702 -85.202Z" fill="url(#modal_hero_beam_middle)" />
        <defs>
          <linearGradient id="modal_hero_beam_middle" x1="17.6832" y1="-89.058" x2="56.6791" y2="89.7389" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFEBB0" />
            <stop offset="0.865385" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <svg
        className="absolute right-[4.25rem] top-[-0.65rem]"
        style={{ width: "3.48131rem", height: "11.4375rem", transform: "rotate(13.204deg)" }}
        viewBox="0 0 77 76"
        fill="none"
        preserveAspectRatio="none"
      >
        <path d="M53.8477 -112.173L76.306 -106.903L54.2247 75.8852L-0.00381671 63.162L53.8477 -112.173Z" fill="url(#modal_hero_beam_right)" />
        <defs>
          <linearGradient id="modal_hero_beam_right" x1="68.9112" y1="-108.638" x2="27.1105" y2="69.5236" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFEBB0" />
            <stop offset="0.889423" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

function CreatorHeroFloaters() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[2]">
      {CREATOR_FLOATERS.map((item, index) => (
        <span key={`${item.icon}-${index}`} className={cn("absolute drop-shadow-sm", item.className)}>
          {item.icon}
        </span>
      ))}
    </div>
  )
}

function CreatorHeroClouds() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-[72px]">
      <div className="absolute bottom-0 left-[-34px] h-[36px] w-[90px] rounded-t-full bg-white" />
      <div className="absolute bottom-0 left-[32px] h-[46px] w-[92px] rounded-t-full bg-white" />
      <div className="absolute bottom-0 left-[104px] h-[28px] w-[82px] rounded-t-full bg-white" />
      <div className="absolute bottom-0 left-[154px] h-[35px] w-[86px] rounded-t-full bg-white" />
      <div className="absolute bottom-0 left-[204px] h-[31px] w-[96px] rounded-t-full bg-white" />
      <div className="absolute bottom-0 right-[48px] h-[54px] w-[116px] rounded-t-full bg-white" />
      <div className="absolute bottom-0 right-[-28px] h-[66px] w-[132px] rounded-t-full bg-white" />
      <div className="absolute bottom-0 left-0 right-0 h-[22px] bg-white" />
    </div>
  )
}

function BrandHeroBeams() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden="true">
      <div className="absolute left-[58px] top-[-28px] h-[190px] w-[54px] rotate-[-8deg] bg-[linear-gradient(180deg,rgba(255,235,176,0.72)_0%,rgba(255,255,255,0)_88%)]" />
      <div className="absolute left-[176px] top-[-34px] h-[190px] w-[64px] rotate-[-13deg] bg-[linear-gradient(180deg,rgba(255,235,176,0.58)_0%,rgba(255,255,255,0)_86%)]" />
      <div className="absolute right-[72px] top-[-30px] h-[190px] w-[58px] rotate-[13deg] bg-[linear-gradient(180deg,rgba(255,235,176,0.62)_0%,rgba(255,255,255,0)_89%)]" />
    </div>
  )
}

function BrandHeroStars() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[2]">
      {BRAND_STARS.map((className, index) => (
        <span key={index} className={cn("absolute drop-shadow-sm", className)}>
          🌟
        </span>
      ))}
    </div>
  )
}

function AvatarCircle({
  name,
  src,
  variant,
  className,
  size = "large",
}: {
  name: string
  src?: string
  variant: HeroVariant
  className?: string
  size?: "large" | "small"
}) {
  const isBrand = variant === "brand"
  const isSmall = size === "small"

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full border-white shadow-[0_12px_34px_rgba(0,0,0,0.13)]",
        isBrand ? "bg-black" : "bg-[#FFD2DD]",
        isSmall ? "size-5 border" : "size-[108px] border-[6px]",
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className={cn("h-full w-full object-cover", isBrand && !isSmall && "object-contain p-3")}
        />
      ) : (
        <span
          className={cn(
            "font-bold uppercase",
            isBrand ? "text-white" : "text-[#1C1C1C]",
            isSmall ? "text-[8px]" : "text-[34px]"
          )}
        >
          {getInitials(name)}
        </span>
      )}
    </div>
  )
}

function QuestionScreen({
  question,
  value,
  answers,
  step,
  total,
  error,
  submitting,
  canGoNext,
  onChange,
  onMetaChange,
  onBack,
  onClose,
  onNext,
  onSkip,
}: {
  question: QuestionnaireQuestion
  value: unknown
  answers: Answers
  step: number
  total: number
  error: string
  submitting: boolean
  canGoNext: boolean
  onChange: (value: unknown) => void
  onMetaChange: (key: string, value: unknown) => void
  onBack: () => void
  onClose: () => void
  onNext: () => void
  onSkip: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.18 }}
      className="flex min-h-screen flex-col bg-white px-[18px] py-[18px] sm:min-h-[560px]"
    >
      <div className="flex items-center justify-between">
        <button type="button" className="text-[13px] font-medium text-[#B9B9B9]" onClick={onBack}>
          Back
        </button>

        <button
          type="button"
          aria-label="Close rating modal"
          onClick={onClose}
          className="flex size-9 items-center justify-center rounded-full bg-[#FAFAFA] text-black transition hover:bg-[#F3F3F3]"
        >
          <X className="size-5" strokeWidth={2.4} />
        </button>
      </div>

      <div className="mt-3 border-b border-[#E8E8E8] pb-4">
        <h2 className="max-w-[380px] text-[18px] font-bold leading-[1.22] tracking-[-0.015em] text-[#1F1F1F]">
          {question.label}
        </h2>
        <p className="mt-2 text-[13px] leading-[1.25] text-[#8D8D8D]">{getQuestionHint(question)}</p>
      </div>

      <div className="flex flex-1 flex-col">
        <QuestionInput
          question={question}
          value={value}
          answers={answers}
          onChange={onChange}
          onMetaChange={onMetaChange}
        />

        {error ? (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-[13px] font-medium text-red-600">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between pb-1 pt-4">
        <span className="text-[13px] font-bold text-[#1F1F1F]">
          {step + 1} to {total}
        </span>

        <div className="flex items-center gap-8">
          <button type="button" className="text-[13px] font-semibold text-[#A5A5A5]" onClick={onSkip} disabled={submitting}>
            Skip
          </button>
          <Button
            disabled={!canGoNext || submitting}
            className="h-10 min-w-[104px] rounded-[10px] bg-[#1C1C1C] px-8 text-[13px] font-bold text-white hover:bg-[#111111] disabled:opacity-40"
            onClick={onNext}
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Saving
              </span>
            ) : (
              "Next"
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

function QuestionInput({
  question,
  value,
  answers,
  onChange,
  onMetaChange,
}: {
  question: QuestionnaireQuestion
  value: unknown
  answers: Answers
  onChange: (value: unknown) => void
  onMetaChange: (key: string, value: unknown) => void
}) {
  if (question.type === "emoji_rating") {
    return <EmojiRating options={question.options?.length ? question.options : FALLBACK_EMOJI_OPTIONS} value={value} onChange={onChange} />
  }

  if (question.type === "single_select") {
    return <SingleSelectQuestion options={question.options || []} value={value} onChange={onChange} />
  }

  if (question.type === "multi_select") {
    return <MultiSelectQuestion options={question.options || []} value={value} onChange={onChange} />
  }

  if (question.key === "note") {
    return (
      <NoteQuestion
        question={question}
        value={value}
        starRating={Number(answers.note_star_rating || 0)}
        onChange={onChange}
        onStarChange={(rating) => onMetaChange("note_star_rating", rating)}
      />
    )
  }

  return <TextQuestion question={question} value={value} onChange={onChange} />
}

function EmojiRating({
  options,
  value,
  onChange,
}: {
  options: QuestionnaireOption[]
  value: unknown
  onChange: (value: unknown) => void
}) {
  return (
    <div className="flex flex-1 items-center justify-between gap-3 px-4 pb-14 pt-20">
      {options.map((option) => {
        const optionValue = String(option.value)
        const isSelected = String(value || "") === optionValue
        const gifUrl = getNotoEmojiGifUrl(option.emoji)

        return (
          <div key={optionValue} className="group relative flex flex-col items-center">
            <div
              className={cn(
                "pointer-events-none absolute -top-[54px] left-1/2 z-20 -translate-x-1/2 rounded-[10px] bg-[#1C1C1C] px-4 py-2 text-[14px] font-semibold text-white opacity-0 shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition-all duration-200",
                "after:absolute after:left-1/2 after:top-full after:size-0 after:-translate-x-1/2 after:border-x-[9px] after:border-t-[9px] after:border-x-transparent after:border-t-[#1C1C1C]",
                "group-hover:-top-[58px] group-hover:opacity-100",
                isSelected && "-top-[58px] opacity-100"
              )}
            >
              {option.label}
            </div>

            <button
              type="button"
              aria-label={option.label || `Rating ${optionValue}`}
              aria-pressed={isSelected}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex size-[58px] items-center justify-center rounded-2xl border bg-white transition-all duration-200",
                "hover:-translate-y-0.5 hover:border-[#1C1C1C] hover:bg-[#F8F8F8] hover:shadow-[0_8px_22px_rgba(0,0,0,0.08)]",
                isSelected
                  ? "scale-110 border-[#1C1C1C] bg-[#F3F3F3] shadow-[0_10px_24px_rgba(0,0,0,0.10)]"
                  : "border-transparent"
              )}
            >
              {gifUrl ? (
                <img
                  src={gifUrl}
                  alt={option.emoji || option.label || `Rating ${optionValue}`}
                  className="size-11 object-contain"
                  loading="eager"
                />
              ) : (
                <span className="text-[34px]">{option.emoji || option.value}</span>
              )}
            </button>
          </div>
        )
      })}
    </div>
  )
}

function SingleSelectQuestion({
  options,
  value,
  onChange,
}: {
  options: QuestionnaireOption[]
  value: unknown
  onChange: (value: unknown) => void
}) {
  return (
    <div className="flex-1 px-0 pt-9">
      <RadioGroup value={String(value || "")} onValueChange={onChange} className="gap-5">
        {options.map((option) => (
          <label
            key={String(option.value)}
            className="flex cursor-pointer items-center gap-[18px] text-[20px] font-semibold leading-tight text-[#1F1F1F]"
          >
            <RadioGroupItem value={String(option.value)} />
            <span>{option.label}</span>
          </label>
        ))}
      </RadioGroup>
    </div>
  )
}

function MultiSelectQuestion({
  options,
  value,
  onChange,
}: {
  options: QuestionnaireOption[]
  value: unknown
  onChange: (value: unknown) => void
}) {
  const selected = Array.isArray(value) ? value.map(String) : []

  return (
    <div className="flex-1 px-0 pt-7">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
        {options.map((option) => {
          const optionValue = String(option.value)
          const checked = selected.includes(optionValue)

          return (
            <button
              key={optionValue}
              type="button"
              aria-pressed={checked}
              onClick={() => {
                onChange(checked ? selected.filter((item) => item !== optionValue) : [...selected, optionValue])
              }}
              className={cn(
                "inline-flex h-[28px] max-w-full items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold leading-none transition-all duration-200",
                checked
                  ? "bg-[#1C1C1C] text-white shadow-[0_6px_16px_rgba(0,0,0,0.14)]"
                  : "bg-[#F8F8F8] text-[#1F1F1F] hover:bg-[#EFEFEF]"
              )}
            >
              {checked ? (
                <span className="flex size-[14px] items-center justify-center rounded-full bg-white text-[#1C1C1C]">
                  <CheckCircle2 className="size-[10px]" strokeWidth={3} />
                </span>
              ) : null}
              <span className="truncate">{option.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function NoteQuestion({
  question,
  value,
  starRating,
  onChange,
  onStarChange,
}: {
  question: QuestionnaireQuestion
  value: unknown
  starRating: number
  onChange: (value: unknown) => void
  onStarChange: (rating: number) => void
}) {
  const text = String(value || "")
  const maxLength = question.maxLength || 3000

  return (
    <div className="flex-1 pt-7">
      <StarRating value={starRating} onChange={onStarChange} className="mb-4" />
      <textarea
        value={text}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={question.placeholder || "Add Notes"}
        className="min-h-[166px] w-full resize-none rounded-[var(--Border-Radius-M,0.75rem)] border border-[var(--Light-Border-Subtle,#E6E6E6)] bg-[var(--Light-Background-Subtle,#F9F9F9)] px-4 py-3 text-[13px] font-medium leading-relaxed text-[#1F1F1F] outline-none transition placeholder:text-[#B8B8B8] focus:border-[#1C1C1C] focus:bg-white focus:ring-4 focus:ring-black/5"
      />
    </div>
  )
}

function TextQuestion({
  question,
  value,
  onChange,
}: {
  question: QuestionnaireQuestion
  value: unknown
  onChange: (value: unknown) => void
}) {
  const text = String(value || "")
  const maxLength = question.maxLength || 3000

  return (
    <div className="flex-1 pt-7">
      <textarea
        value={text}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={question.placeholder || "Write your feedback here..."}
        className="min-h-[174px] w-full resize-none rounded-[var(--Border-Radius-M,0.75rem)] border border-[var(--Light-Border-Subtle,#E6E6E6)] bg-[var(--Light-Background-Subtle,#F9F9F9)] px-4 py-3 text-[15px] font-medium leading-relaxed text-[#1F1F1F] outline-none transition placeholder:text-[#B0B0B0] focus:border-[#1C1C1C] focus:bg-white focus:ring-4 focus:ring-black/5"
      />
      <div className="mt-2 text-right text-[12px] font-medium text-[#A0A0A0]">
        {text.length}/{maxLength}
      </div>
    </div>
  )
}

function StarRating({
  value,
  onChange,
  className,
  readOnly = false,
}: {
  value: number
  onChange?: (value: number) => void
  className?: string
  readOnly?: boolean
}) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value

        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            aria-label={`${star} star`}
            onClick={() => onChange?.(star)}
            className={cn(
              "text-[22px] leading-none transition-transform",
              readOnly ? "cursor-default" : "hover:scale-110",
              active ? "text-[#FFB800]" : "text-[#F1F1F1]"
            )}
          >
            ★
          </button>
        )
      })}
    </div>
  )
}

function SubmitSuccessScreen({
  rating,
  targetName,
  avatarSrc,
  avatarVariant,
}: {
  rating: number
  targetName: string
  avatarSrc?: string
  avatarVariant: HeroVariant
}) {
  const clapGifUrl = getNotoEmojiGifUrl("👏")
  const starText = rating === 1 ? "star" : "stars"

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-0 sm:bg-[#F4F4F4] sm:px-5">
      <section className="flex min-h-screen w-full max-w-[444px] flex-col items-center justify-center bg-white px-8 text-center sm:min-h-[560px] sm:rounded-[24px] sm:shadow-[0_22px_70px_rgba(0,0,0,0.10)]">
        {clapGifUrl ? (
          <img src={clapGifUrl} alt="Clapping hands" className="size-[142px] object-contain" loading="eager" />
        ) : (
          <div className="text-[110px] leading-none">👏</div>
        )}

        <StarRating value={rating} readOnly className="mt-8 justify-center" />

        <h1 className="mt-5 flex flex-wrap items-center justify-center gap-1.5 text-[18px] font-bold leading-snug text-[#1F1F1F]">
          <span>
            You have rated {rating} {starText} to
          </span>
          <AvatarCircle name={targetName} src={avatarSrc} variant={avatarVariant} size="small" />
          <span>{targetName}</span>
        </h1>

        <p className="mx-auto mt-3 max-w-[285px] text-[13px] leading-[1.35] text-[#B0B0B0]">
          Your feedback helps creators grow, build stronger partnerships, and stand out through meaningful collaborations.
        </p>
      </section>
    </main>
  )
}

function CenteredStateContent({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: "loading" | "success" | "error"
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-5 sm:min-h-[560px]">
      <section className="w-full max-w-[444px] px-6 py-10 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#F7F7F7] text-[#1C1C1C]">
          {icon === "loading" ? (
            <Loader2 className="size-7 animate-spin" />
          ) : icon === "success" ? (
            <CheckCircle2 className="size-7" />
          ) : (
            <AlertCircle className="size-7" />
          )}
        </div>
        <h1 className="mt-5 text-[22px] font-bold tracking-[-0.02em] text-[#1F1F1F]">{title}</h1>
        <p className="mx-auto mt-2 max-w-[330px] text-[14px] leading-relaxed text-[#8D8D8D]">{description}</p>
        {actionLabel && onAction ? (
          <Button
            className="mt-7 h-[42px] w-full rounded-[10px] bg-[#1C1C1C] text-[14px] font-semibold text-white hover:bg-[#111111]"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        ) : null}
      </section>
    </div>
  )
}

function getQuestionHint(question: QuestionnaireQuestion) {
  if (question.description) return question.description
  if (question.key === "standout_qualities") return "Creative alignment with your campaign"
  if (question.key === "content_vision_match") return "Tell us how closely the final output matched the brief."
  if (question.key === "note") return "Share a quick appreciation, feedback, or memorable takeaway from this collaboration."
  return "Share your overall collaboration experience with the creator."
}

function getSubmittedRating(answers: Answers) {
  const rating = Number(answers.note_star_rating || answers.working_feel_rating || 5)
  if (!Number.isFinite(rating)) return 5
  return Math.min(Math.max(Math.round(rating), 1), 5)
}

function buildSubmitAnswers(answers: Answers, questions: QuestionnaireQuestion[]) {
  const cleaned = cleanAnswers(answers, questions)
  const noteStarRating = Number(answers.note_star_rating || 0)

  if (Number.isFinite(noteStarRating) && noteStarRating >= 1 && noteStarRating <= 5) {
    cleaned.note_star_rating = Math.round(noteStarRating)
  }

  return cleaned
}

function cleanAnswers(answers: Answers, questions: QuestionnaireQuestion[]) {
  return questions.reduce<Answers>((acc, question) => {
    const value = answers[question.key]

    if (!isQuestionAnswered(question, value)) return acc

    if (question.type === "emoji_rating") {
      acc[question.key] = Number(value)
      return acc
    }

    if (question.type === "multi_select") {
      acc[question.key] = Array.isArray(value) ? value : []
      return acc
    }

    acc[question.key] = value
    return acc
  }, {})
}

function isQuestionAnswered(question: QuestionnaireQuestion, value: unknown) {
  if (value === undefined || value === null || value === "") return false
  if (question.type === "emoji_rating" && Number(value) === 0) return false
  if (question.type === "multi_select") return Array.isArray(value) && value.length > 0
  if (question.type === "text") return String(value || "").trim().length > 0
  return true
}

function getInitials(name = "") {
  const parts = String(name || "")
    .trim()
    .split(" ")
    .filter(Boolean)

  if (!parts.length) return "CG"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}
