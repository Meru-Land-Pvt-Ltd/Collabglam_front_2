import React from 'react';
import { Eye, Handshake, Lightbulb, ShieldCheck, Trophy } from 'lucide-react';

const values = [
  {
    icon: Lightbulb,
    title: 'Creativity',
    description:
      'Bold campaign ideas and AI-assisted briefs that make creators genuinely excited to feature your product — not just fulfil an obligation. Better briefs = better content = better ROI.',
  },
  {
    icon: Handshake,
    title: 'Collaboration',
    description:
      'We work hand-in-hand with both brands and creators, aligning incentives so that both sides benefit. Shared success is the only model that drives sustainable long-term results.',
  },
  {
    icon: Trophy,
    title: 'Excellence',
    description:
      'Top-tier creator vetting, AI-driven matching, and obsessive attention to campaign quality. We set the standard for transparent, data-backed influencer marketing partnerships.',
  },
  {
    icon: ShieldCheck,
    title: 'Transparency',
    description:
      "No hidden fees. No opaque commissions. Every metric, creator rate, and campaign result is visible to you in real time — because you deserve to know what you're paying for.",
  },
];

export default function AboutCollabGlam() {
  return (
    <section
      id="about"
      className="relative overflow-hidden bg-[#fafaf7] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          {/* Left */}
          <div>
            <div className="inline-flex items-center rounded-full border border-[#f97316]/20 bg-[#fff4ec] px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#c2410c]">
              About CollabGlam
            </div>

            <h2 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] text-[#101018] sm:text-5xl lg:text-[60px]">
              The Influencer Marketing Platform{' '}
              <span className="text-[#f97316]">Built for Brands</span>
            </h2>

            <div className="mt-7 space-y-5 text-base leading-8 text-[#6b7280] sm:text-lg">
              <p>
                CollabGlam is a purpose-built influencer marketing platform that
                gives brands everything they need to find the right creators, run
                campaigns seamlessly, and measure real impact — all in one place.
              </p>

              <p>
                No juggling spreadsheets. No guesswork. No wasted budget. We built
                CollabGlam because brands deserve a platform that works as hard as
                they do — one that surfaces the right creators instantly, handles
                the operational complexity, and gives full visibility into what
                the investment is actually achieving.
              </p>
            </div>

            <div className="mt-9 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[26px] border border-[#e7e1d6] bg-white p-6 shadow-[0_12px_34px_rgba(17,24,39,0.045)]">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#f97316]">
                  Our Mission
                </p>
                <p className="mt-3 text-sm leading-7 text-[#6b7280]">
                  To connect brands and creators seamlessly — helping both find
                  the perfect match for reviews, unboxings, and promotions that
                  grow real audiences and real revenue.
                </p>
              </div>

              <div className="rounded-[26px] border border-[#e7e1d6] bg-white p-6 shadow-[0_12px_34px_rgba(17,24,39,0.045)]">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#f97316]">
                  Our Vision
                </p>
                <p className="mt-3 text-sm leading-7 text-[#6b7280]">
                  A platform where every brand finds its perfect influencer, and
                  every influencer has the tools to turn passion into purpose and
                  sustainable income.
                </p>
              </div>
            </div>
          </div>

          {/* Right Values */}
          <div className="grid gap-4">
            {values.map((value) => {
              const Icon = value.icon;

              return (
                <article
                  key={value.title}
                  className="group rounded-[28px] border border-[#e7e1d6] bg-white p-6 shadow-[0_12px_34px_rgba(17,24,39,0.045)] transition duration-300 hover:-translate-y-0.5 hover:border-[#f97316]/30 hover:shadow-[0_18px_44px_rgba(17,24,39,0.07)]"
                >
                  <div className="flex gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#f97316]/20 bg-[#fff4ec] text-[#f97316]">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="text-xl font-extrabold tracking-[-0.03em] text-[#101018]">
                        {value.title}
                      </h3>

                      <p className="mt-2 text-sm leading-7 text-[#6b7280]">
                        {value.description}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}