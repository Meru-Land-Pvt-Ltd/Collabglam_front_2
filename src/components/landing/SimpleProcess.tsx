import React from 'react';
import { ClipboardList, Rocket, Sparkles, UsersRound } from 'lucide-react';

const processSteps = [
  {
    id: '01',
    icon: ClipboardList,
    title: 'Submit Product & Budget',
    description:
      'Tell us your product, campaign goals, and budget. Our AI immediately begins curating your creator shortlist based on audience fit and performance data.',
  },
  {
    id: '02',
    icon: UsersRound,
    title: 'Receive Creator Matches in 15 mins',
    description:
      'Get a curated shortlist of pre-vetted creators with full profiles, audience stats, AI Match Scores, and Audience Credibility Scores. You pick who you like.',
  },
  {
    id: '03',
    icon: Rocket,
    title: 'We Manage the Rest',
    description:
      'CollabGlam handles outreach, rate negotiation, briefing, content approvals, and go-live coordination. AI performance reports are delivered throughout.',
  },
];

export default function SimpleProcess() {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-[#fafaf7] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#f97316]/20 bg-[#fff4ec] px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#c2410c]">
            <Sparkles className="h-3.5 w-3.5" />
            Simple Process
          </div>

          <h2 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] text-[#101018] sm:text-5xl lg:text-[60px]">
            Launch Your Campaign in{' '}
            <span className="text-[#f97316]">3 Steps</span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#6b7280] sm:text-lg">
            CollabGlam is built for speed. From signup to published review in
            days — not months.
          </p>
        </div>

        {/* Desktop Timeline */}
        <div className="relative mx-auto mt-16 hidden max-w-6xl lg:block">
          {/* Connecting line */}
          <div className="absolute left-[16.5%] right-[16.5%] top-[52px] h-px bg-gradient-to-r from-transparent via-[#f97316]/40 to-transparent" />

          <div className="grid grid-cols-3 gap-8">
            {processSteps.map((step) => {
              const Icon = step.icon;

              return (
                <article
                  key={step.id}
                  className="group relative flex flex-col items-center text-center"
                >
                  <div className="relative z-10 flex h-[104px] w-[104px] items-center justify-center rounded-full border border-[#f97316]/25 bg-[#fafaf7] shadow-[0_18px_50px_rgba(249,115,22,0.10)] transition duration-300 group-hover:-translate-y-1 group-hover:border-[#f97316]/50">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#fff4ec] text-[#f97316]">
                      <Icon className="h-8 w-8" />
                    </div>

                    <span className="absolute -right-1 -top-1 flex h-10 w-10 items-center justify-center rounded-full bg-[#f97316] text-sm font-black text-white shadow-[0_10px_24px_rgba(249,115,22,0.28)]">
                      {step.id}
                    </span>
                  </div>

                  <div className="mt-8 max-w-sm">
                    <h3 className="text-2xl font-extrabold leading-tight tracking-[-0.035em] text-[#101018]">
                      {step.title}
                    </h3>

                    <p className="mt-4 text-base leading-8 text-[#6b7280]">
                      {step.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Mobile / Tablet Flow */}
        <div className="mx-auto mt-14 max-w-3xl space-y-5 lg:hidden">
          {processSteps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === processSteps.length - 1;

            return (
              <article
                key={step.id}
                className="relative rounded-[26px] border border-[#e5e2da] bg-white/75 p-5 shadow-[0_12px_36px_rgba(17,24,39,0.05)]"
              >
                {!isLast && (
                  <div className="absolute left-10 top-[76px] h-[calc(100%-36px)] w-px bg-[#f97316]/20" />
                )}

                <div className="relative flex gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff4ec] text-[#f97316]">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div>
                    <div className="mb-2 inline-flex rounded-full bg-[#f97316] px-3 py-1 text-xs font-black text-white">
                      {step.id}
                    </div>

                    <h3 className="text-xl font-extrabold tracking-[-0.03em] text-[#101018]">
                      {step.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-[#6b7280]">
                      {step.description}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Bottom CTA Strip */}
        <div className="mx-auto mt-16 max-w-5xl rounded-[28px] border border-[#f97316]/20 bg-[#fff4ec] px-6 py-7 text-center sm:px-8 lg:flex lg:items-center lg:justify-between lg:text-left">
          <div>
            <h3 className="text-2xl font-extrabold tracking-[-0.035em] text-[#101018]">
              Ready to see your creator shortlist?
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#6b7280]">
              Submit your brand details and get creator matches within 15 minutes.
            </p>
          </div>

          <a
            href="#lead"
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#f97316] px-7 py-4 text-sm font-extrabold text-white shadow-[0_14px_34px_rgba(249,115,22,0.25)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#c2410c] lg:mt-0"
          >
            Get Matched Free
            <Rocket className="ml-2 h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}