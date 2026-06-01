'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'How does CollabGlam find the right creators for my brand?',
    answer:
      'CollabGlam analyses your product category, campaign goals, audience, market, and budget, then recommends creators using audience-fit signals, performance history, engagement quality, and credibility checks.',
  },
  {
    question: 'What platforms do CollabGlam creators work on?',
    answer:
      'CollabGlam supports creator campaigns across YouTube, Instagram, TikTok, and multi-platform campaigns depending on your product, budget, and target market.',
  },
  {
    question: 'How long does a typical campaign take from start to published content?',
    answer:
      'Creator matches are usually delivered within 48–72 hours. After shortlist approval, timelines depend on outreach, creator availability, product shipping, briefing, approvals, and publishing schedule.',
  },
  {
    question: 'What is the Managed Campaign Plan and how is it different?',
    answer:
      'The Managed Campaign Plan is a done-for-you service where CollabGlam handles creator curation, outreach, negotiation, briefing, content approvals, go-live coordination, and reporting while you stay in control of final approvals.',
  },
  {
    question: 'What performance metrics does CollabGlam track after content is published?',
    answer:
      'Reports can include views, likes, comments, shares, watch time, engagement rate, CTR, ROI, ROAS, cost-per-engagement, demographics, top country, and an AI-generated campaign summary.',
  },
  {
    question: 'Are there any hidden fees or commissions on creator deals?',
    answer:
      'No. CollabGlam is built around transparent pricing. Creator rates, campaign costs, and deliverables are made clear before you approve a campaign.',
  },
  {
    question: 'Does CollabGlam work with Amazon sellers?',
    answer:
      'Yes. CollabGlam works with Amazon sellers and product brands that want creator reviews, unboxings, product demos, and conversion-focused influencer campaigns.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section
      id="faq"
      className="relative overflow-hidden bg-[#fafaf7] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center rounded-full border border-[#f97316]/20 bg-[#fff4ec] px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#c2410c]">
            FAQ
          </div>

          <h2 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] text-[#101018] sm:text-5xl lg:text-[60px]">
            Frequently Asked{' '}
            <span className="text-[#f97316]">Questions</span>
          </h2>
        </div>

        <div className="mx-auto mt-14 max-w-4xl space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={faq.question}
                className={`overflow-hidden rounded-[24px] border bg-white transition duration-300 ${
                  isOpen
                    ? 'border-[#f97316]/30 shadow-[0_16px_44px_rgba(249,115,22,0.08)]'
                    : 'border-[#e7e1d6]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between gap-5 px-6 py-5 text-left sm:px-7"
                >
                  <span className="text-base font-extrabold leading-7 text-[#101018] sm:text-lg">
                    {faq.question}
                  </span>

                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition duration-300 ${
                      isOpen
                        ? 'rotate-180 border-[#f97316]/25 bg-[#fff4ec] text-[#f97316]'
                        : 'border-[#e7e1d6] text-[#6b7280]'
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 sm:px-7">
                    <p className="border-t border-[#eee8dd] pt-5 text-base leading-8 text-[#6b7280]">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}