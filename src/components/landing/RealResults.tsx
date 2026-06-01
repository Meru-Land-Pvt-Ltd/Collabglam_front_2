const caseStudies = [
  {
    initials: 'NT',
    brand: 'NexaHome Tech',
    category: 'Consumer Electronics',
    budget: '$8,000 budget',
    story:
      'NexaHome Tech launched a new smart home device with zero social presence. CollabGlam matched them with 6 mid-tier tech reviewers, coordinated a synchronized launch week, and managed end-to-end reporting from brief to post-campaign analytics.',
    metrics: [
      { value: '430K', label: 'Total views generated' },
      { value: '3.8×', label: 'Return on ad spend' },
      { value: '320+', label: 'Units sold via tracked links' },
      { value: '6 days', label: 'Brief to first video live' },
    ],
    quote:
      "CollabGlam turned a product launch that would've taken months into a 6-day execution. ROI exceeded our paid ads by a mile.",
    person: 'David L., Marketing Director',
  },
  {
    initials: 'NS',
    brand: 'NovaSkin Beauty',
    category: 'Skincare & Beauty',
    budget: '$5,000 budget',
    story:
      "NovaSkin needed authentic reviews to compete with established skincare brands. CollabGlam's AI match engine identified nano and micro-influencers with highly engaged beauty audiences — maximising authenticity over raw volume and driving conversions that outperformed all prior paid channels.",
    metrics: [
      { value: '89%', label: 'Positive sentiment rate' },
      { value: '2.1×', label: 'Conversion vs prior campaigns' },
      { value: '14', label: 'Creators activated' },
      { value: '6.2%', label: 'Avg. engagement rate' },
    ],
    quote:
      "We were skeptical of micro-influencers but CollabGlam's targeting was spot-on. Our sales doubled in the campaign month.",
    person: 'Sarah W., E-commerce Manager',
  },
  {
    initials: 'FL',
    brand: 'FitLab Equipment',
    category: 'Fitness & Sports',
    budget: '$12,000 budget',
    story:
      'FitLab wanted to reposition from budget to premium fitness equipment. CollabGlam designed a prestige campaign with high-production fitness creators. The Managed Plan handled every negotiation and approval — FitLab only approved the final creator list.',
    metrics: [
      { value: '1.2M', label: 'Total audience reached' },
      { value: '4.5×', label: 'Revenue attributed' },
      { value: '+34%', label: 'Brand search volume lift' },
      { value: '$0', label: 'Hidden fees paid' },
    ],
    quote:
      'The team handled every negotiation flawlessly. We looked premium from day one — exactly the brand shift we needed.',
    person: 'Michael T., Founder',
  },
];

export default function RealResults() {
  return (
    <section
      id="case-studies"
      className="relative overflow-hidden border-y border-white/[0.06] bg-[#0c0c12] px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <div className="inline-flex items-center rounded-full border border-[#f97316]/25 bg-[#f97316]/10 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-orange-300">
              Real Results
            </div>

            <h2 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl lg:text-[60px]">
              Brand Success Stories That{' '}
              <span className="text-[#f97316]">Prove the ROI</span>
            </h2>
          </div>

          <p className="max-w-2xl text-base leading-8 text-[#A3A2B8] sm:text-lg lg:pb-2">
            See how brands like yours turned CollabGlam campaigns into measurable
            revenue growth and audience expansion.
          </p>
        </div>

        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {caseStudies.map((study) => (
            <article
              key={study.brand}
              className="group flex h-full flex-col overflow-hidden rounded-[30px] border border-white/[0.08] bg-[#11111a] transition duration-300 hover:-translate-y-0.5 hover:border-[#f97316]/30 hover:bg-[#141421]"
            >
              <div className="border-b border-white/[0.08] p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f97316] text-base font-black text-white">
                    {study.initials}
                  </div>

                  <div>
                    <h3 className="text-xl font-extrabold tracking-[-0.035em] text-white">
                      {study.brand}
                    </h3>

                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-white/38">
                      {study.category} · {study.budget}
                    </p>
                  </div>
                </div>

                <p className="mt-6 text-sm leading-7 text-white/55">
                  {study.story}
                </p>
              </div>

              <div className="grid grid-cols-2 border-b border-white/[0.08]">
                {study.metrics.map((metric, index) => (
                  <div
                    key={metric.label}
                    className={`p-5 ${index % 2 === 0 ? 'border-r border-white/[0.08]' : ''
                      } ${index < 2 ? 'border-b border-white/[0.08]' : ''}`}
                  >
                    <p className="text-3xl font-extrabold tracking-[-0.05em] text-[#f97316]">
                      {metric.value}
                    </p>

                    <p className="mt-2 text-xs font-semibold leading-5 text-white/45">
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-1 flex-col justify-between p-6">
                <blockquote className="text-sm italic leading-7 text-white/62">
                  “{study.quote}”
                </blockquote>

                <p className="mt-5 border-t border-white/[0.08] pt-4 text-sm font-extrabold text-white">
                  — {study.person}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}