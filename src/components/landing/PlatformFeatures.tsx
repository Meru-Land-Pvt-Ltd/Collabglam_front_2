const features = [
  {
    number: '01',
    label: 'Feature 01',
    title: 'Browse & Discover Influencers',
    quote: 'Find your perfect creator match in minutes — not days.',
    description:
      "CollabGlam's smart discovery engine lets you search thousands of verified creators across Instagram, YouTube, and TikTok. Filter by niche, follower count, engagement rate, location, and platform. AI-powered recommendations are tailored to your campaign goals, audience, and budget.",
    chips: ['Smart Filters', 'AI Recommendations', 'Multi-Platform'],
    layout: 'lg:col-span-7',
  },
  {
    number: '02',
    label: 'Feature 02',
    title: 'Campaign Management Dashboard',
    quote: "Bird's-eye view of every active, paused & draft campaign.",
    description:
      'Launch, manage, and track all campaigns from one powerful dashboard. See platform, applied count, influencer count, budget, and campaign status right from the card.',
    chips: ['Live Dashboard', 'Schedule & Publish', 'Managed Badge'],
    layout: 'lg:col-span-5',
  },
  {
    number: '03',
    label: 'Feature 03',
    title: 'AI-Powered Campaign Creation',
    quote: 'Describe your product — AI builds the brief for you.',
    description:
      'Creating a campaign takes minutes. Input product details, pick your niche category, upload references, and one click generates your campaign description, goals, and creator brief using AI.',
    chips: ['AI Brief Generator', 'Live Preview', 'Category Tags'],
    layout: 'lg:col-span-5',
  },
  {
    number: '04',
    label: 'Feature 04',
    title: 'Campaign Influencer Management',
    quote: 'Accept, shortlist, or manage every creator in seconds.',
    description:
      'The All Influencer view shows every creator who applied or was invited — with full status tracking and action controls. Accept, reject, shortlist, send contracts, and manage milestones directly within the platform.',
    chips: ['Status Tracking', 'Quick Actions', 'Contracts'],
    layout: 'lg:col-span-7',
  },
  {
    number: '05',
    label: 'Feature 05',
    title: 'Centralised Creator Inbox',
    quote: 'All creator conversations in one inbox. No scattered DMs.',
    description:
      'The CollabGlam Inbox unifies every brand-creator communication. Filter by read status, collaboration stage, and date. Search creators, compose pitches, respond, star threads, and save drafts.',
    chips: ['Unified Inbox', 'Filterable', 'Starred & Drafts'],
    layout: 'lg:col-span-4',
  },
  {
    number: '06',
    label: 'Feature 06',
    title: 'Influencer Deep Profile & Analytics',
    quote: 'Know everything about a creator before you invest.',
    description:
      'Click into any creator for an AI Match Score, Audience Credibility Score, recent posts, estimated reach, CPE, milestones, deliverables, payment checkpoints, and contract dates.',
    chips: ['AI Match Score', 'Credibility Score', 'Milestones'],
    layout: 'lg:col-span-4',
  },
  {
    number: '07',
    label: 'Feature 07',
    title: 'AI Content Performance Reports',
    quote: 'See exactly how each piece of content performed — AI-analyzed.',
    description:
      "Once an influencer publishes, CollabGlam generates a full report: views, likes, comments, shares, watch time, engagement rate, CTR, ROI, ROAS, CPE, audience demographics, top country, and an AI narrative summary.",
    chips: ['Full ROI Metrics', 'AI Narrative', 'Demographics', 'vs. Avg Comparison'],
    layout: 'lg:col-span-4',
  },
];

export default function PlatformFeatures() {
  return (
    <section
      id="features"
      className="relative overflow-hidden border-y border-[#e7e1d6] bg-[#fafaf7] px-4 py-20 text-[#101018] sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <div className="inline-flex items-center rounded-full border border-[#f97316]/20 bg-[#fff4ec] px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#c2410c]">
              Platform Features
            </div>

            <h2 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] text-[#101018] sm:text-5xl lg:text-[64px]">
              7 Powerful Tools.{' '}
              <span className="text-[#f97316]">One Platform.</span>
            </h2>
          </div>

          <div className="lg:pb-2">
            <p className="max-w-2xl text-base leading-8 text-[#6b7280] sm:text-lg">
              From discovery to deep analytics — CollabGlam covers every stage of
              the influencer marketing funnel with a clean, connected workflow.
            </p>

            <div className="mt-6 grid grid-cols-3 overflow-hidden rounded-2xl border border-[#e7e1d6] bg-white">
              {['Discover', 'Manage', 'Report'].map((item, index) => (
                <div
                  key={item}
                  className={`px-4 py-4 text-center ${
                    index !== 2 ? 'border-r border-[#e7e1d6]' : ''
                  }`}
                >
                  <p className="text-xl font-extrabold text-[#101018]">
                    0{index + 1}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b7280]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-5 lg:grid-cols-12">
          {features.map((feature) => (
            <article
              key={feature.number}
              className={`${feature.layout} group relative overflow-hidden rounded-[28px] border border-[#e7e1d6] bg-white p-6 shadow-[0_12px_36px_rgba(17,24,39,0.045)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#f97316]/30 hover:shadow-[0_18px_50px_rgba(17,24,39,0.07)] sm:p-7`}
            >
              <div className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#f97316]">
                      {feature.label}
                    </p>

                    <h3 className="mt-3 text-2xl font-extrabold leading-tight tracking-[-0.035em] text-[#101018] sm:text-3xl">
                      {feature.title}
                    </h3>
                  </div>

                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#f97316]/20 bg-[#fff4ec] text-base font-extrabold text-[#f97316]">
                    {feature.number}
                  </span>
                </div>

                <p className="mt-5 text-base font-semibold italic leading-7 text-[#c2410c]">
                  “{feature.quote}”
                </p>

                <p className="mt-4 text-sm leading-7 text-[#6b7280]">
                  {feature.description}
                </p>

                <div className="mt-7 flex flex-wrap gap-2">
                  {feature.chips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-[#e7e1d6] bg-[#fafaf7] px-3 py-1.5 text-xs font-bold text-[#6b7280] transition duration-300 group-hover:border-[#f97316]/25 group-hover:bg-[#fff4ec] group-hover:text-[#c2410c]"
                    >
                      {chip}
                    </span>
                  ))}
                </div>

                <div className="mt-7 flex items-center gap-3 border-t border-[#eee8dd] pt-5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f97316]" />
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#101018]/40">
                    Built for faster campaign execution
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}