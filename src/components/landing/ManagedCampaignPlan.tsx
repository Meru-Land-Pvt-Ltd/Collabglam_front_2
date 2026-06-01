import React from 'react';
import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  Clock3,
  Eye,
  Sparkles,
  TrendingUp,
  UsersRound,
  Zap,
} from 'lucide-react';

const managedSteps = [
  {
    id: '01',
    title:
      'We curate a tailored list of best-fit influencers based on your brand, audience, and campaign goals.',
  },
  {
    id: '02',
    title:
      'You review the list and shortlist your preferred creators — the only decision you need to make.',
  },
  {
    id: '03',
    title:
      'CollabGlam handles all outreach, negotiations, briefing, content approvals, and go-live coordination.',
  },
  {
    id: '04',
    title:
      'You receive AI-generated performance reports and real-time dashboard access throughout the campaign.',
  },
];

const managedBenefits = [
  {
    icon: Zap,
    title: 'Zero Operational Overhead',
    description:
      "No in-house influencer management team required. CollabGlam's experts are your team.",
  },
  {
    icon: Brain,
    title: 'Expert AI-Backed Strategy',
    description:
      "Campaign strategy backed by CollabGlam's platform data, historical performance, and AI intelligence.",
  },
  {
    icon: Clock3,
    title: 'Faster Turnaround',
    description:
      'Dedicated CollabGlam account team manages all timelines — campaigns go live faster.',
  },
  {
    icon: BarChart3,
    title: 'Full Transparency',
    description:
      "Real-time dashboards and scheduled performance updates — you always know what's happening.",
  },
  {
    icon: TrendingUp,
    title: 'Scale Without Scaling Your Team',
    description:
      'Ideal for brands scaling influencer marketing without growing internal headcount.',
  },
];

export default function ManagedCampaignPlan() {
  return (
    <section
      id="managed"
      className="relative overflow-hidden border-y border-white/[0.06] bg-[#0c0c12] px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F97316]/25 bg-[#F97316]/10 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-orange-300">
              <Sparkles className="h-3.5 w-3.5" />
              Managed Campaign Plan
            </div>

            <h2 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl lg:text-[62px]">
              Let CollabGlam Run Your Entire Campaign.{' '}
              <span className="text-[#F97316]">You Just Approve.</span>
            </h2>
          </div>

          <p className="max-w-2xl text-base leading-8 text-[#A3A2B8] sm:text-lg lg:pb-2">
            For brands that want results without the operational overhead. Our
            team handles everything — from creator curation to campaign execution
            — while you stay in control of the final shortlist. Zero in-house
            influencer management team required.
          </p>
        </div>

        {/* Main Layout */}
        <div className="mt-16 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          {/* Left: Steps */}
          <div className="rounded-[32px] border border-white/[0.08] bg-[#11111a] p-6 sm:p-7 lg:p-8">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#F97316]">
                  Done-for-you workflow
                </p>
                <h3 className="mt-2 text-2xl font-extrabold tracking-[-0.035em] text-white">
                  How managed campaigns work
                </h3>
              </div>

              <div className="hidden h-12 w-12 items-center justify-center rounded-2xl border border-[#F97316]/25 bg-[#F97316]/10 text-[#F97316] sm:flex">
                <UsersRound className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-4">
              {managedSteps.map((step, index) => {
                const isLast = index === managedSteps.length - 1;

                return (
                  <div key={step.id} className="relative flex gap-4">
                    {!isLast && (
                      <div className="absolute left-[21px] top-12 h-[calc(100%-16px)] w-px bg-white/[0.08]" />
                    )}

                    <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#F97316]/25 bg-[#F97316]/10 text-xs font-extrabold text-[#F97316]">
                      {step.id}
                    </div>

                    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
                      <p className="text-sm font-medium leading-7 text-white/62 sm:text-base">
                        {step.title}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Benefits */}
          <div className="grid gap-4 sm:grid-cols-2">
            {managedBenefits.map((benefit, index) => {
              const Icon = benefit.icon;
              const isWide = index === managedBenefits.length - 1;

              return (
                <article
                  key={benefit.title}
                  className={`group rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-6 transition duration-300 hover:-translate-y-0.5 hover:border-[#F97316]/30 hover:bg-white/[0.05] ${
                    isWide ? 'sm:col-span-2' : ''
                  }`}
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-orange-300 transition duration-300 group-hover:border-[#F97316]/25 group-hover:bg-[#F97316]/10">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="text-xl font-extrabold tracking-[-0.03em] text-white">
                    {benefit.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-white/55">
                    {benefit.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>

        {/* CTA Strip */}
        <div className="mt-8 rounded-[30px] border border-[#F97316]/25 bg-[#F97316]/10 p-6 sm:p-8 lg:flex lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#F97316]">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em]">
                Hands-off execution
              </p>
            </div>

            <h3 className="mt-3 text-2xl font-extrabold tracking-[-0.035em] text-white">
              Want CollabGlam to manage your next creator campaign?
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
              Share your campaign goals and we’ll help you understand the best
              managed plan for your product, market, and creator budget.
            </p>
          </div>

          <a
            href="#lead"
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#F97316] px-7 py-4 text-sm font-extrabold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#c2410c] lg:mt-0"
          >
            Contact Us About Managed Plan
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}