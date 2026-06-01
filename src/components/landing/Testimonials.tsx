import React from 'react';
import { Star } from 'lucide-react';

const testimonials = [
  {
    initials: 'DL',
    name: 'David L.',
    role: 'Marketing Director · MHD Tech',
    quote:
      'CollabGlam made it incredibly easy to enter the creator economy. The 48-hour matching process saved us months of painful cold outreach. We generated over 50,000 views within the first week of launch — results we never expected at our budget level.',
  },
  {
    initials: 'SW',
    name: 'Sarah W.',
    role: 'E-commerce Manager · NovaSkin',
    quote:
      "We used to spend weeks finding and vetting creators and still got the wrong fit half the time. CollabGlam's AI Match Score changed everything. Our campaign drove 3× our sales target in two months. The audience credibility data alone was worth the subscription.",
  },
  {
    initials: 'MT',
    name: 'Michael T.',
    role: 'Founder · FitLab Equipment',
    quote:
      "The transparency is what I value most. I always knew exactly what creators were being paid, what the deliverables were, and what the projected reach would be. CollabGlam's Managed Plan was the best operational decision we made — the team executed flawlessly.",
  },
];

export default function Testimonials() {
  return (
    <section
      id="testimonials"
      className="relative overflow-hidden border-y border-white/[0.06] bg-[#0c0c12] px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <div className="inline-flex items-center rounded-full border border-[#F97316]/25 bg-[#F97316]/10 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-orange-300">
              Trusted by Growing Brands
            </div>

            <h2 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl lg:text-[60px]">
              What Brands Say About{' '}
              <span className="text-[#F97316]">CollabGlam</span>
            </h2>
          </div>

          <p className="max-w-2xl text-base leading-8 text-[#A3A2B8] sm:text-lg lg:pb-2">
            Real feedback from brands using CollabGlam to find creators, manage
            campaigns, and turn creator content into measurable growth.
          </p>
        </div>

        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {testimonials.map((item) => (
            <article
              key={item.name}
              className="group flex h-full flex-col rounded-[30px] border border-white/[0.08] bg-[#11111a] p-6 transition duration-300 hover:-translate-y-0.5 hover:border-[#F97316]/30 hover:bg-[#141421] sm:p-7"
            >
              <div className="flex gap-1 text-[#F97316]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="h-4 w-4 fill-current" />
                ))}
              </div>

              <blockquote className="mt-6 flex-1 text-base italic leading-8 text-white/62">
                “{item.quote}”
              </blockquote>

              <div className="mt-8 flex items-center gap-4 border-t border-white/[0.08] pt-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F97316] text-sm font-black text-white">
                  {item.initials}
                </div>

                <div>
                  <h3 className="font-extrabold text-white">{item.name}</h3>
                  <p className="mt-1 text-sm text-white/42">{item.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}