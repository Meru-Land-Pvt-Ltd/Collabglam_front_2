'use client';

import React from 'react';
import { Check, X } from 'lucide-react';

const withoutCollabGlam = [
  'Manual influencer research taking days or weeks',
  'Scattered communications across emails & DMs',
  'No visibility into real audience quality or engagement',
  'Budget wasted on wrong creators with fake followers',
  "Zero reporting — no idea what's actually performing",
  'Full-time team needed just to manage campaigns',
];

const withCollabGlam = [
  'AI-powered creator discovery in minutes — not days',
  'All communication centralised on one platform',
  'Audience Credibility Score + AI Match Score per creator',
  'Data-driven matching = better ROAS on every campaign',
  'Real-time dashboards with AI-generated performance reports',
  'Fully managed option — you just approve the creators',
];

export default function WhyCollabGlam() {
  return (
    <section
      id="why-collabglam"
      className="relative overflow-hidden border-y border-white/[0.08] bg-[#0c0c12] px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center rounded-full border border-[#f97316]/25 bg-[#f97316]/10 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-orange-300">
            Why CollabGlam
          </div>

          <h2 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl lg:text-[56px]">
            The Old Way vs.{' '}
            <span className="text-[#f97316]">The CollabGlam Way</span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#A3A2B8] sm:text-lg">
            Every day without CollabGlam is budget lost to bad matches,
            scattered workflows, and zero performance visibility.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-6xl gap-6 lg:grid-cols-2">
          <article className="rounded-[30px] border border-red-400/15 bg-[#14141d] p-6 transition duration-300 hover:border-red-400/25 sm:p-8">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-13 w-13 items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/10 text-red-300">
                <X className="h-6 w-6" />
              </div>

              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-red-300/70">
                  Old Workflow
                </p>
                <h3 className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-white">
                  Without CollabGlam
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              {withoutCollabGlam.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.035] p-4"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-400/10 text-red-300">
                    <X className="h-3.5 w-3.5" />
                  </span>

                  <p className="text-sm font-medium leading-7 text-white/58 sm:text-base">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[30px] border border-[#f97316]/25 bg-[#f97316]/10 p-6 transition duration-300 hover:border-[#f97316]/40 sm:p-8">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-13 w-13 items-center justify-center overflow-hidden rounded-2xl border border-[#f97316]/25 bg-white">
                <img
                  src="/logo.png"
                  alt="CollabGlam logo"
                  className="h-10 w-10 object-contain"
                />
              </div>

              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-orange-300">
                  Smart Workflow
                </p>
                <h3 className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-white">
                  With CollabGlam
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              {withCollabGlam.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-[#f97316]/15 bg-[#0c0c12]/45 p-4"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f97316]/20 text-[#f97316]">
                    <Check className="h-3.5 w-3.5" />
                  </span>

                  <p className="text-sm font-medium leading-7 text-white/68 sm:text-base">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}