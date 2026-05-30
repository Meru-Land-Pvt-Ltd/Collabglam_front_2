// src/pages/index.tsx
"use client";

import Features from "@/components/common/Features";
import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import Hero from "@/components/common/Hero";
import Credibility from "@/components/common/CredibilitySection";
import CreatorsMatchSection from "@/components/common/CreatorMatchSection";
import FAQ from "@/components/common/faq";
import HowItWorks from "@/components/common/HowItWorks";
import Pricing from "@/components/common/Pricing";
import SocialProof from "@/components/common/SocialProof";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <HowItWorks />
      <Features />
      <Credibility />
      <CreatorsMatchSection />
      <SocialProof />
      {/* <SuccessStories /> */}
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  );
}

// 'use client';

// import React, { useState } from 'react';
// import {
//   ArrowRight,
//   BadgeCheck,
//   BarChart3,
//   Bell,
//   Bot,
//   Brain,
//   CalendarCheck,
//   Check,
//   CheckCircle2,
//   ChevronDown,
//   CircleDollarSign,
//   ClipboardList,
//   Clock3,
//   Eye,
//   FileText,
//   Gauge,
//   Globe2,
//   LayoutDashboard,
//   LineChart,
//   Mail,
//   MessageCircle,
//   MousePointer2,
//   Play,
//   Radar,
//   Rocket,
//   Search,
//   Send,
//   ShieldCheck,
//   Sparkles,
//   Star,
//   TrendingUp,
//   UsersRound,
//   WandSparkles,
//   X,
//   Zap,
//   type LucideIcon,
// } from 'lucide-react';
// import Swal from 'sweetalert2';
// import { post } from '@/lib/api';
// import Header from '@/components/common/Header';
// import FooterWithNewsletter from '@/components/common/FooterWithNewsletter';

// const partnerBrands = [
//   { name: 'CHITA LIVING', logo: '/landing/chita.png' },
//   { name: 'Hisense', logo: '/landing/Hisense.png' },
//   { name: 'Dreame Tech', logo: '/landing/dreme%20tech.png' },
//   { name: 'Anker', logo: '/landing/anker.png' },
//   { name: 'Jackery', logo: '/landing/jackery.png' },
//   { name: 'Qlife', logo: '/landing/qlife.png' },
//   { name: 'HBADA', logo: '/landing/hbada.png' },
//   { name: 'Vtoman', logo: '/landing/vtoman.png' },
//   { name: 'INMO', logo: '/landing/inmo.png' },
//   { name: 'Anycubic', logo: '/landing/anycubic.png' },
//   { name: 'Chikley', logo: '' },
//   { name: 'DeerVally', logo: '/landing/deervalley.png' },
//   { name: 'Pongbot', logo: '/landing/pongbot.png' },
//   { name: 'ECOVACS', logo: '' },
//   { name: 'Sihoo', logo: '' },
// ];

// const heroStats = [
//   { value: '48–72h', label: 'Creator shortlist delivery' },
//   { value: '500+', label: 'Verified creators' },
//   { value: '3.2×', label: 'Average campaign ROAS' },
//   { value: '$0', label: 'To request your first shortlist' },
// ];

// const trustPills = [
//   { icon: Clock3, label: 'Matches in 48–72 hours' },
//   { icon: ShieldCheck, label: 'Verified creator network' },
//   { icon: CircleDollarSign, label: 'No credit card required' },
// ];

// const comparison = {
//   oldWay: [
//     'Manual creator research across YouTube, Instagram, and TikTok',
//     'Cold emails, scattered DMs, and slow creator replies',
//     'No audience credibility checks before spending budget',
//     'Campaign status hidden inside spreadsheets and inboxes',
//     'Unclear ROI after the video goes live',
//   ],
//   newWay: [
//     'AI-powered shortlist based on product, audience, and budget',
//     'Centralized creator inbox with campaign context',
//     'AI Match Score + Audience Credibility Score before approval',
//     'Live campaign dashboard from invite to go-live',
//     'Performance reports with ROAS, CTR, CPE, and AI insights',
//   ],
// };

// const features: {
//   icon: LucideIcon;
//   title: string;
//   label: string;
//   description: string;
//   chips: string[];
//   visual: 'creator' | 'dashboard' | 'brief' | 'pipeline' | 'inbox' | 'profile' | 'report';
// }[] = [
//   {
//     icon: Search,
//     title: 'Browse & Discover Influencers',
//     label: 'Creator Discovery',
//     description:
//       'Find creators by niche, platform, market, engagement, audience quality, and budget fit — without spending days researching manually.',
//     chips: ['Smart filters', 'Audience fit', 'Verified creators'],
//     visual: 'creator',
//   },
//   {
//     icon: LayoutDashboard,
//     title: 'Campaign Management Dashboard',
//     label: 'Campaign OS',
//     description:
//       'Manage active, paused, draft, and managed campaigns in one clean dashboard with budget, status, creators, and deadlines.',
//     chips: ['Campaign cards', 'Budget view', 'Live status'],
//     visual: 'dashboard',
//   },
//   {
//     icon: WandSparkles,
//     title: 'AI-Powered Campaign Creation',
//     label: 'AI Brief Builder',
//     description:
//       'Add your product, goal, and references. CollabGlam turns it into a creator-ready brief with deliverables and campaign direction.',
//     chips: ['AI brief', 'Goal builder', 'Live preview'],
//     visual: 'brief',
//   },
//   {
//     icon: UsersRound,
//     title: 'Campaign Influencer Management',
//     label: 'Creator Pipeline',
//     description:
//       'Move creators through applied, shortlisted, accepted, contracted, live, and completed stages with simple campaign controls.',
//     chips: ['Shortlist', 'Contracts', 'Approvals'],
//     visual: 'pipeline',
//   },
//   {
//     icon: MessageCircle,
//     title: 'Centralised Creator Inbox',
//     label: 'Unified Messaging',
//     description:
//       'Keep creator communication, negotiations, drafts, approvals, and follow-ups in one place instead of scattered email threads.',
//     chips: ['Inbox', 'Templates', 'Follow-ups'],
//     visual: 'inbox',
//   },
//   {
//     icon: ShieldCheck,
//     title: 'Influencer Deep Profile & Analytics',
//     label: 'Creator Intelligence',
//     description:
//       'Review match score, credibility score, estimated reach, cost-per-engagement, recent posts, deliverables, and payment milestones.',
//     chips: ['AI score', 'Credibility', 'Rates'],
//     visual: 'profile',
//   },
//   {
//     icon: BarChart3,
//     title: 'AI Content Performance Reports',
//     label: 'Performance Intelligence',
//     description:
//       'Track views, engagement, CTR, ROAS, conversions, demographics, and AI-written insights after campaign content goes live.',
//     chips: ['ROAS', 'CPE', 'AI summary'],
//     visual: 'report',
//   },
// ];

// const processSteps = [
//   {
//     id: '01',
//     icon: ClipboardList,
//     title: 'Submit Product & Budget',
//     description:
//       'Share your product type, target platform, market, campaign budget, and goal. The request takes less than two minutes.',
//   },
//   {
//     id: '02',
//     icon: Brain,
//     title: 'Get AI-Matched Creators',
//     description:
//       'Receive a curated creator shortlist in 48–72 hours with audience fit, credibility, rates, and campaign recommendations.',
//   },
//   {
//     id: '03',
//     icon: Rocket,
//     title: 'Launch With Confidence',
//     description:
//       'Run the campaign inside CollabGlam or choose Managed Campaign Plan and let our team handle the entire workflow.',
//   },
// ];

// const managedSteps = [
//   'Creator curation based on your audience, product category, and campaign budget.',
//   'Creator outreach, rate negotiation, follow-ups, and final shortlist preparation.',
//   'Campaign brief writing, deliverables alignment, content approval, and timeline control.',
//   'Go-live coordination, reporting, performance analysis, and optimization recommendations.',
// ];

// const managedBenefits = [
//   {
//     icon: Zap,
//     title: 'Zero Operational Drag',
//     description:
//       'Skip hiring, training, and managing an influencer marketing team. CollabGlam becomes your campaign engine.',
//   },
//   {
//     icon: Clock3,
//     title: 'Faster Turnaround',
//     description:
//       'Dedicated execution means fewer delays, faster creator replies, and cleaner launch timelines.',
//   },
//   {
//     icon: Eye,
//     title: 'Full Transparency',
//     description:
//       'You see creator rates, shortlist logic, campaign status, deliverables, and performance updates clearly.',
//   },
//   {
//     icon: TrendingUp,
//     title: 'Scale Without Hiring',
//     description:
//       'Launch more campaigns without expanding internal headcount or drowning your team in follow-ups.',
//   },
// ];

// const caseStudies = [
//   {
//     initials: 'MT',
//     brand: 'MHD Tech',
//     category: 'Consumer Electronics',
//     budget: '$8,000 campaign',
//     story:
//       'MHD Tech needed a fast product launch with credible tech reviewers. CollabGlam curated creators, coordinated launch timing, and tracked campaign impact.',
//     metrics: [
//       ['430K', 'Views generated'],
//       ['3.8×', 'ROAS'],
//       ['320+', 'Tracked sales'],
//     ],
//     quote:
//       "CollabGlam turned a product launch that would've taken months into a clean, measurable campaign.",
//     person: 'David L. · Marketing Director',
//     gradient: 'from-blue-500 to-indigo-700',
//   },
//   {
//     initials: 'NS',
//     brand: 'NovaSkin Beauty',
//     category: 'Beauty & Skincare',
//     budget: '$5,000 campaign',
//     story:
//       'NovaSkin wanted authentic creator proof before scaling paid ads. CollabGlam found micro-creators with highly engaged skincare audiences.',
//     metrics: [
//       ['89%', 'Positive sentiment'],
//       ['2.1×', 'Conversion lift'],
//       ['14', 'Creators activated'],
//     ],
//     quote:
//       "The creator fit was sharp. The audience quality data helped us spend with confidence.",
//     person: 'Sarah W. · E-commerce Manager',
//     gradient: 'from-pink-500 to-fuchsia-700',
//   },
//   {
//     initials: 'FL',
//     brand: 'FitLab Equipment',
//     category: 'Fitness & Sports',
//     budget: '$12,000 campaign',
//     story:
//       'FitLab wanted premium creator positioning without managing every creator conversation. The Managed Plan handled the entire flow.',
//     metrics: [
//       ['1.2M', 'Audience reached'],
//       ['4.5×', 'Revenue attributed'],
//       ['+34%', 'Brand search lift'],
//     ],
//     quote:
//       'We approved the shortlist. CollabGlam handled everything else beautifully.',
//     person: 'Michael T. · Founder',
//     gradient: 'from-emerald-500 to-green-800',
//   },
// ];

// const roadmap = [
//   {
//     icon: FileText,
//     title: 'Creator-Level Performance Reports',
//     description:
//       'Individual reach, engagement, cost efficiency, sentiment, and reactivation recommendations for every creator.',
//   },
//   {
//     icon: LineChart,
//     title: 'Campaign Completion Dashboard',
//     description:
//       'A complete end-of-campaign analytics layer with revenue, ROI, top content, audience data, and AI narrative summary.',
//   },
//   {
//     icon: Radar,
//     title: 'Rate-Aware Creator Suggestions',
//     description:
//       'AI recommendations with estimated collaboration rates so you can plan campaigns with better budget clarity.',
//   },
// ];

// const values = [
//   {
//     title: 'Creativity',
//     icon: Sparkles,
//     description:
//       'Campaigns should feel native, sharp, and creator-led — not like forced ads wearing influencer clothing.',
//   },
//   {
//     title: 'Collaboration',
//     icon: UsersRound,
//     description:
//       'Great campaigns happen when brands, creators, and operators are aligned around one clear outcome.',
//   },
//   {
//     title: 'Excellence',
//     icon: BadgeCheck,
//     description:
//       'Every shortlist, brief, negotiation, and report should feel polished enough for a serious brand team.',
//   },
//   {
//     title: 'Transparency',
//     icon: Eye,
//     description:
//       'Creator rates, campaign status, and performance data should be visible before, during, and after launch.',
//   },
// ];

// const testimonials = [
//   {
//     quote:
//       'The biggest win was speed. We stopped guessing and got creators who actually fit our product and audience.',
//     name: 'David L.',
//     role: 'Marketing Director · MHD Tech',
//     initials: 'DL',
//   },
//   {
//     quote:
//       'The AI Match Score and audience credibility data made creator selection feel much safer and more strategic.',
//     name: 'Sarah W.',
//     role: 'E-commerce Manager · NovaSkin',
//     initials: 'SW',
//   },
//   {
//     quote:
//       'The Managed Plan felt like adding an influencer team overnight. We approved decisions, they handled the chaos.',
//     name: 'Michael T.',
//     role: 'Founder · FitLab Equipment',
//     initials: 'MT',
//   },
// ];

// const pricingCards = [
//   {
//     name: 'Free Creator Shortlist',
//     price: '$0',
//     note: 'Best for testing creator fit',
//     description:
//       'Request a curated creator shortlist before committing to a full campaign.',
//     points: [
//       'Creator matches in 48–72 hours',
//       'Budget-fit recommendations',
//       'Basic audience fit review',
//       'No credit card required',
//     ],
//     cta: 'Get Matched Free',
//     highlighted: false,
//   },
//   {
//     name: 'Platform Growth',
//     price: 'Custom',
//     note: 'Recommended for active teams',
//     description:
//       'Use CollabGlam as your AI-powered influencer campaign workspace.',
//     points: [
//       'Creator discovery and filters',
//       'Campaign dashboard',
//       'Centralised creator inbox',
//       'AI reporting and analytics',
//     ],
//     cta: 'Talk to Sales',
//     highlighted: true,
//   },
//   {
//     name: 'Managed Campaign Plan',
//     price: 'Custom',
//     note: 'Best for hands-off execution',
//     description:
//       'Let CollabGlam manage creator outreach, negotiation, approvals, and reporting.',
//     points: [
//       'Dedicated campaign strategist',
//       'Creator outreach and negotiation',
//       'Briefing and content approvals',
//       'Timeline and reporting management',
//     ],
//     cta: 'Book Managed Call',
//     highlighted: false,
//   },
// ];

// const faqs = [
//   {
//     question: 'How does CollabGlam find the right creators?',
//     answer:
//       'CollabGlam uses your product category, target market, platform, campaign budget, and goals to curate creators. Each creator can be reviewed through audience fit, AI Match Score, and credibility signals.',
//   },
//   {
//     question: 'How fast do I receive creator matches?',
//     answer:
//       'Most creator shortlist requests are reviewed and delivered within 48–72 hours depending on product category, market, and campaign complexity.',
//   },
//   {
//     question: 'Can CollabGlam manage the whole campaign?',
//     answer:
//       'Yes. With the Managed Campaign Plan, CollabGlam handles creator curation, outreach, negotiation, briefing, approvals, go-live coordination, and reporting.',
//   },
//   {
//     question: 'Which platforms are supported?',
//     answer:
//       'CollabGlam supports creator campaigns across YouTube, Instagram, TikTok, and multi-platform creator activations.',
//   },
//   {
//     question: 'Do I need a credit card to request matches?',
//     answer:
//       'No. You can request your first creator shortlist for free without a credit card.',
//   },
//   {
//     question: 'What metrics can CollabGlam track?',
//     answer:
//       'Reports can include views, likes, comments, shares, engagement rate, CTR, CPE, ROAS, conversion estimates, demographics, top markets, and AI-written campaign insights.',
//   },
//   {
//     question: 'Does CollabGlam work with Amazon sellers?',
//     answer:
//       'Yes. CollabGlam can support Amazon sellers with creator reviews, trackable links, product launch campaigns, and performance visibility.',
//   },
// ];

// const productOptions = [
//   'Consumer Electronics',
//   'Beauty & Skincare',
//   'Fitness & Sports',
//   'Fashion & Apparel',
//   'Food & Beverage',
//   'Software & SaaS',
//   'Home & Lifestyle',
//   'Finance & Fintech',
//   'Other',
// ];

// const budgetOptions = [
//   'Under $1,000',
//   '$1,000–$5,000',
//   '$5,000–$15,000',
//   '$15,000–$50,000',
//   '$50,000+',
// ];

// const platformOptions = ['YouTube', 'Instagram', 'TikTok', 'Multi-Platform'];

// const marketOptions = [
//   'United States',
//   'United Kingdom',
//   'India',
//   'Canada',
//   'Australia',
//   'Global',
// ];

// const managedOptions = [
//   'Yes — I want CollabGlam to manage everything',
//   "No — I'll use the platform myself",
//   'Not sure yet, tell me more',
// ];

// type LeadFormData = {
//   productType: string;
//   budget: string;
//   platform: string;
//   market: string;
//   brandName: string;
//   email: string;
//   managedPlan: string;
// };

// const emptyLeadForm: LeadFormData = {
//   productType: '',
//   budget: '',
//   platform: '',
//   market: '',
//   brandName: '',
//   email: '',
//   managedPlan: '',
// };

// function SectionHeader({
//   eyebrow,
//   title,
//   accent,
//   description,
//   dark = false,
//   align = 'center',
// }: {
//   eyebrow: string;
//   title: string;
//   accent?: string;
//   description?: string;
//   dark?: boolean;
//   align?: 'left' | 'center';
// }) {
//   return (
//     <div
//       className={`${
//         align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl text-left'
//       }`}
//     >
//       <div
//         className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] ${
//           dark
//             ? 'border-white/10 bg-white/[0.04] text-orange-200'
//             : 'border-orange-500/15 bg-orange-50 text-orange-700'
//         }`}
//       >
//         <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
//         {eyebrow}
//       </div>

//       <h2
//         className={`mt-5 text-4xl font-black leading-[1.02] tracking-[-0.055em] sm:text-5xl lg:text-[62px] ${
//           dark ? 'text-white' : 'text-[#11110f]'
//         }`}
//       >
//         {title}
//         {accent && <span className="text-orange-500"> {accent}</span>}
//       </h2>

//       {description && (
//         <p
//           className={`mt-5 text-base leading-8 sm:text-lg ${
//             dark ? 'text-white/55' : 'text-[#706e63]'
//           } ${align === 'center' ? 'mx-auto max-w-2xl' : 'max-w-2xl'}`}
//         >
//           {description}
//         </p>
//       )}
//     </div>
//   );
// }

// function SelectField({
//   label,
//   name,
//   value,
//   options,
//   onChange,
// }: {
//   label: string;
//   name: keyof LeadFormData;
//   value: string;
//   options: string[];
//   onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
// }) {
//   return (
//     <label className="block">
//       <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.13em] text-[#6f6a5f]">
//         {label}
//       </span>
//       <select
//         name={name}
//         value={value}
//         onChange={onChange}
//         required
//         className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm font-bold text-[#14120f] outline-none transition focus:border-orange-500/60 focus:ring-4 focus:ring-orange-500/10"
//       >
//         <option value="">Select…</option>
//         {options.map((option) => (
//           <option key={option} value={option}>
//             {option}
//           </option>
//         ))}
//       </select>
//     </label>
//   );
// }

// function PrimaryButton({
//   href,
//   children,
//   dark = false,
// }: {
//   href: string;
//   children: React.ReactNode;
//   dark?: boolean;
// }) {
//   return (
//     <a
//       href={href}
//       className={`group inline-flex items-center justify-center rounded-2xl px-6 py-4 text-sm font-black transition-all duration-300 sm:px-7 ${
//         dark
//           ? 'bg-white text-[#11110f] shadow-[0_18px_50px_rgba(255,255,255,0.12)] hover:-translate-y-0.5 hover:bg-orange-50'
//           : 'bg-orange-500 text-white shadow-[0_18px_50px_rgba(249,115,22,0.30)] hover:-translate-y-0.5 hover:bg-orange-600'
//       }`}
//     >
//       {children}
//       <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
//     </a>
//   );
// }

// function SecondaryButton({
//   href,
//   children,
//   dark = false,
// }: {
//   href: string;
//   children: React.ReactNode;
//   dark?: boolean;
// }) {
//   return (
//     <a
//       href={href}
//       className={`inline-flex items-center justify-center rounded-2xl border px-6 py-4 text-sm font-black transition-all duration-300 hover:-translate-y-0.5 sm:px-7 ${
//         dark
//           ? 'border-white/15 bg-white/[0.03] text-white/80 hover:border-white/30 hover:bg-white/[0.07] hover:text-white'
//           : 'border-black/10 bg-white text-[#14120f] hover:border-orange-500/25 hover:bg-orange-50 hover:text-orange-700'
//       }`}
//     >
//       {children}
//     </a>
//   );
// }

// function HeroDashboardMockup() {
//   const creatorCards = [
//     {
//       name: 'Mia Chen',
//       niche: 'Tech Reviews',
//       match: '96%',
//       credibility: 'A+',
//       reach: '420K',
//       gradient: 'from-fuchsia-500 to-purple-700',
//     },
//     {
//       name: 'Alex Rivera',
//       niche: 'Smart Home',
//       match: '92%',
//       credibility: 'A',
//       reach: '310K',
//       gradient: 'from-blue-500 to-cyan-600',
//     },
//     {
//       name: 'Nora Lee',
//       niche: 'Lifestyle',
//       match: '89%',
//       credibility: 'A',
//       reach: '220K',
//       gradient: 'from-orange-500 to-pink-600',
//     },
//   ];

//   return (
//     <div className="relative mx-auto mt-14 w-full max-w-6xl lg:mt-0">
//       <div className="absolute -left-6 top-16 hidden rounded-3xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur-2xl lg:block">
//         <div className="flex items-center gap-3">
//           <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
//             <BadgeCheck className="h-5 w-5" />
//           </span>
//           <div>
//             <p className="text-xs font-bold text-white/45">Audience Credibility</p>
//             <p className="text-xl font-black text-white">A+ Verified</p>
//           </div>
//         </div>
//       </div>

//       <div className="absolute -right-4 bottom-20 hidden rounded-3xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur-2xl lg:block">
//         <div className="flex items-center gap-3">
//           <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-300">
//             <TrendingUp className="h-5 w-5" />
//           </span>
//           <div>
//             <p className="text-xs font-bold text-white/45">Projected ROAS</p>
//             <p className="text-xl font-black text-white">3.8×</p>
//           </div>
//         </div>
//       </div>

//       <div className="overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.06] shadow-[0_34px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
//         <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-5 py-4">
//           <div className="flex items-center gap-2">
//             <span className="h-3 w-3 rounded-full bg-red-400" />
//             <span className="h-3 w-3 rounded-full bg-yellow-400" />
//             <span className="h-3 w-3 rounded-full bg-emerald-400" />
//           </div>
//           <div className="hidden rounded-full border border-white/10 bg-black/20 px-4 py-1 text-xs font-bold text-white/50 sm:block">
//             app.collabglam.com/campaigns/creator-match
//           </div>
//           <Bell className="h-4 w-4 text-white/45" />
//         </div>

//         <div className="grid gap-0 lg:grid-cols-[240px_minmax(0,1fr)]">
//           <aside className="hidden border-r border-white/10 bg-black/15 p-5 lg:block">
//             <div className="mb-6 flex items-center gap-3">
//               <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-sm font-black text-white">
//                 CG
//               </span>
//               <div>
//                 <p className="text-sm font-black text-white">CollabGlam</p>
//                 <p className="text-xs text-white/40">AI Campaign OS</p>
//               </div>
//             </div>

//             {[
//               ['Dashboard', LayoutDashboard, true],
//               ['Creator Search', Search, false],
//               ['Inbox', MessageCircle, false],
//               ['Reports', BarChart3, false],
//             ].map(([label, Icon, active]) => {
//               const NavIcon = Icon as LucideIcon;

//               return (
//                 <div
//                   key={label as string}
//                   className={`mb-2 flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold ${
//                     active
//                       ? 'bg-orange-500 text-white'
//                       : 'text-white/45 hover:bg-white/[0.05]'
//                   }`}
//                 >
//                   <NavIcon className="h-4 w-4" />
//                   {label as string}
//                 </div>
//               );
//             })}
//           </aside>

//           <div className="p-4 sm:p-6">
//             <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
//               <div>
//                 <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
//                   Creator shortlist
//                 </p>
//                 <h3 className="mt-1 text-2xl font-black text-white">
//                   Smart Home Launch
//                 </h3>
//               </div>

//               <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300">
//                 3 creators ready
//               </div>
//             </div>

//             <div className="grid gap-4 md:grid-cols-3">
//               {creatorCards.map((creator) => (
//                 <div
//                   key={creator.name}
//                   className="rounded-3xl border border-white/10 bg-white/[0.05] p-4 transition hover:-translate-y-1 hover:border-orange-300/30"
//                 >
//                   <div className="flex items-center gap-3">
//                     <div
//                       className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${creator.gradient} text-sm font-black text-white`}
//                     >
//                       {creator.name
//                         .split(' ')
//                         .map((part) => part[0])
//                         .join('')}
//                     </div>
//                     <div>
//                       <p className="font-black text-white">{creator.name}</p>
//                       <p className="text-xs text-white/45">{creator.niche}</p>
//                     </div>
//                   </div>

//                   <div className="mt-4 grid grid-cols-3 gap-2">
//                     <div className="rounded-2xl bg-black/20 p-3 text-center">
//                       <p className="text-xs text-white/35">Match</p>
//                       <p className="text-sm font-black text-orange-300">
//                         {creator.match}
//                       </p>
//                     </div>
//                     <div className="rounded-2xl bg-black/20 p-3 text-center">
//                       <p className="text-xs text-white/35">Score</p>
//                       <p className="text-sm font-black text-emerald-300">
//                         {creator.credibility}
//                       </p>
//                     </div>
//                     <div className="rounded-2xl bg-black/20 p-3 text-center">
//                       <p className="text-xs text-white/35">Reach</p>
//                       <p className="text-sm font-black text-white">
//                         {creator.reach}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             <div className="mt-5 grid gap-4 md:grid-cols-[1fr_0.75fr]">
//               <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
//                 <div className="flex items-center justify-between">
//                   <p className="text-sm font-black text-white">Campaign Forecast</p>
//                   <p className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-black text-orange-300">
//                     AI prediction
//                   </p>
//                 </div>

//                 <div className="mt-5 flex h-28 items-end gap-2">
//                   {[34, 52, 45, 68, 61, 82, 74, 92, 86, 96].map((height, index) => (
//                     <span
//                       key={index}
//                       className="flex-1 rounded-t-xl bg-gradient-to-t from-orange-600 to-orange-300 opacity-80"
//                       style={{ height: `${height}%` }}
//                     />
//                   ))}
//                 </div>
//               </div>

//               <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
//                 <p className="text-sm font-black text-white">AI Summary</p>
//                 <p className="mt-3 text-sm leading-6 text-white/50">
//                   Best-fit creators lean toward tech review audiences with strong
//                   purchase intent and smart-home search behavior.
//                 </p>
//                 <button className="mt-4 inline-flex items-center rounded-full bg-white px-4 py-2 text-xs font-black text-[#11110f]">
//                   Generate brief <Sparkles className="ml-2 h-3.5 w-3.5" />
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function FeatureVisual({ type }: { type: (typeof features)[number]['visual'] }) {
//   if (type === 'creator') {
//     return (
//       <div className="mt-6 rounded-3xl border border-black/10 bg-white p-4">
//         <div className="flex items-center gap-3">
//           <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600 text-sm font-black text-white">
//             MC
//           </div>
//           <div className="flex-1">
//             <p className="font-black text-[#15110e]">Mia Chen</p>
//             <p className="text-xs font-bold text-[#7b7468]">Tech Reviews · 420K reach</p>
//           </div>
//           <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
//             96% Match
//           </span>
//         </div>
//       </div>
//     );
//   }

//   if (type === 'dashboard') {
//     return (
//       <div className="mt-6 grid grid-cols-3 gap-3">
//         {[
//           ['Live', '12'],
//           ['Budget', '$8K'],
//           ['Creators', '06'],
//         ].map(([label, value]) => (
//           <div key={label} className="rounded-2xl border border-black/10 bg-white p-4">
//             <p className="text-xs font-bold text-[#7b7468]">{label}</p>
//             <p className="mt-1 text-2xl font-black text-[#15110e]">{value}</p>
//           </div>
//         ))}
//       </div>
//     );
//   }

//   if (type === 'brief') {
//     return (
//       <div className="mt-6 rounded-3xl border border-black/10 bg-white p-4">
//         <div className="mb-3 flex items-center gap-2 text-xs font-black text-orange-600">
//           <Bot className="h-4 w-4" />
//           AI brief generated
//         </div>
//         <div className="space-y-2">
//           <span className="block h-2 rounded-full bg-[#ece7df]" />
//           <span className="block h-2 w-4/5 rounded-full bg-[#ece7df]" />
//           <span className="block h-2 w-2/3 rounded-full bg-[#ece7df]" />
//         </div>
//       </div>
//     );
//   }

//   if (type === 'pipeline') {
//     return (
//       <div className="mt-6 flex items-center justify-between gap-2">
//         {['Applied', 'Shortlist', 'Live'].map((stage, index) => (
//           <div key={stage} className="flex-1 rounded-2xl border border-black/10 bg-white p-3 text-center">
//             <p className="text-[11px] font-black uppercase tracking-wide text-[#7b7468]">
//               {stage}
//             </p>
//             <p className="mt-1 text-xl font-black text-orange-500">{index + 3}</p>
//           </div>
//         ))}
//       </div>
//     );
//   }

//   if (type === 'inbox') {
//     return (
//       <div className="mt-6 space-y-2">
//         {[
//           ['Mia Chen', 'Rate confirmed for Tuesday'],
//           ['Alex Rivera', 'Draft video ready for review'],
//         ].map(([name, message]) => (
//           <div key={name} className="rounded-2xl border border-black/10 bg-white p-3">
//             <p className="text-sm font-black text-[#15110e]">{name}</p>
//             <p className="text-xs font-semibold text-[#7b7468]">{message}</p>
//           </div>
//         ))}
//       </div>
//     );
//   }

//   if (type === 'profile') {
//     return (
//       <div className="mt-6 rounded-3xl border border-black/10 bg-white p-4">
//         <div className="flex items-center justify-between">
//           <p className="text-sm font-black text-[#15110e]">Creator Intelligence</p>
//           <ShieldCheck className="h-5 w-5 text-emerald-600" />
//         </div>
//         <div className="mt-4 space-y-3">
//           {[
//             ['AI Match', '94%'],
//             ['Credibility', 'A+'],
//             ['CPE', '$0.08'],
//           ].map(([label, value]) => (
//             <div key={label} className="flex items-center justify-between">
//               <span className="text-xs font-bold text-[#7b7468]">{label}</span>
//               <span className="text-sm font-black text-[#15110e]">{value}</span>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="mt-6 rounded-3xl border border-black/10 bg-white p-4">
//       <div className="flex h-24 items-end gap-2">
//         {[28, 50, 42, 70, 60, 86].map((height, index) => (
//           <span
//             key={index}
//             className="flex-1 rounded-t-xl bg-gradient-to-t from-orange-600 to-orange-300"
//             style={{ height: `${height}%` }}
//           />
//         ))}
//       </div>
//       <p className="mt-3 text-xs font-black uppercase tracking-wide text-[#7b7468]">
//         AI performance report
//       </p>
//     </div>
//   );
// }

// export default function CollabGlamHomePage() {
//   const [openFaq, setOpenFaq] = useState(0);
//   const [leadForm, setLeadForm] = useState<LeadFormData>(emptyLeadForm);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleLeadChange = (
//     event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
//   ) => {
//     const { name, value } = event.target;
//     setLeadForm((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleLeadSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     setIsSubmitting(true);

//     try {
//       const payload = {
//         productType: leadForm.productType,
//         budget: leadForm.budget,
//         market: leadForm.market,
//         email: leadForm.email,
//         platform: leadForm.platform,
//         brandName: leadForm.brandName,
//         managedPlan: leadForm.managedPlan,
//       };

//       const response = await post('/matched-creator/create', payload);

//       await Swal.fire({
//         icon: 'success',
//         title: 'Creator shortlist request submitted',
//         text:
//           response?.message ||
//           "Thanks! We'll review your campaign and send your creator matches soon.",
//         confirmButtonColor: '#f97316',
//       });

//       setLeadForm(emptyLeadForm);
//     } catch (error: any) {
//       await Swal.fire({
//         icon: 'error',
//         title: 'Submission failed',
//         text:
//           error?.response?.data?.message ||
//           error?.message ||
//           'Something went wrong while submitting the form.',
//         confirmButtonColor: '#f97316',
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <main className="min-h-screen overflow-hidden bg-[#0b0b10] font-lexend text-[#14120f]">
//       <style jsx global>{`
//         html {
//           scroll-behavior: smooth;
//         }

//         #home,
//         #brand-partners,
//         #compare,
//         #features,
//         #how-it-works,
//         #managed,
//         #case-studies,
//         #roadmap,
//         #about,
//         #testimonials,
//         #pricing,
//         #faq,
//         #lead {
//           scroll-margin-top: 96px;
//         }

//         @keyframes collabglam-fade-up {
//           from {
//             opacity: 0;
//             transform: translateY(24px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }

//         @keyframes collabglam-marquee {
//           from {
//             transform: translateX(0);
//           }
//           to {
//             transform: translateX(-50%);
//           }
//         }

//         @keyframes collabglam-float {
//           0%,
//           100% {
//             transform: translateY(0);
//           }
//           50% {
//             transform: translateY(-12px);
//           }
//         }

//         .cg-fade > * {
//           animation: collabglam-fade-up 0.7s ease both;
//         }

//         .cg-fade > *:nth-child(1) {
//           animation-delay: 0.05s;
//         }

//         .cg-fade > *:nth-child(2) {
//           animation-delay: 0.15s;
//         }

//         .cg-fade > *:nth-child(3) {
//           animation-delay: 0.25s;
//         }

//         .cg-fade > *:nth-child(4) {
//           animation-delay: 0.35s;
//         }

//         .cg-float {
//           animation: collabglam-float 6s ease-in-out infinite;
//         }

//         .cg-marquee {
//           animation: collabglam-marquee 34s linear infinite;
//         }

//         @media (prefers-reduced-motion: reduce) {
//           .cg-fade > *,
//           .cg-float,
//           .cg-marquee {
//             animation: none !important;
//           }
//         }
//       `}</style>

//       <Header />

//       <section
//         id="home"
//         className="relative overflow-hidden bg-[#0b0b10] px-4 pb-14 pt-28 text-white sm:px-6 sm:pt-32 lg:px-8 lg:pb-20 lg:pt-40"
//       >
//         <div className="pointer-events-none absolute left-1/2 top-[-280px] h-[680px] w-[1200px] -translate-x-1/2 rounded-full bg-orange-500/15 blur-3xl" />
//         <div className="pointer-events-none absolute right-[-220px] top-[220px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/10 blur-3xl" />
//         <div className="pointer-events-none absolute bottom-[-240px] left-[-220px] h-[560px] w-[560px] rounded-full bg-blue-500/10 blur-3xl" />

//         <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.92fr_1.08fr]">
//           <div className="cg-fade text-center lg:text-left">
//             <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black tracking-wide text-emerald-300">
//               <span className="h-2 w-2 rounded-full bg-emerald-300" />
//               AI creator matching is live
//             </div>

//             <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.96] tracking-[-0.07em] text-white sm:text-6xl lg:text-[86px]">
//               Where brands meet creators that actually convert.
//             </h1>

//             <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-white/58 sm:text-lg lg:mx-0">
//               CollabGlam helps brands discover verified creators, launch campaigns,
//               manage conversations, and track ROI with AI-powered influencer
//               marketing workflows.
//             </p>

//             <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
//               <PrimaryButton href="#lead">Get My Creator Matches — Free</PrimaryButton>
//               <SecondaryButton href="#how-it-works" dark>
//                 <Play className="mr-2 h-4 w-4" />
//                 See How It Works
//               </SecondaryButton>
//             </div>

//             <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
//               {trustPills.map((pill) => {
//                 const Icon = pill.icon;

//                 return (
//                   <div
//                     key={pill.label}
//                     className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/60"
//                   >
//                     <Icon className="h-4 w-4 text-orange-300" />
//                     {pill.label}
//                   </div>
//                 );
//               })}
//             </div>
//           </div>

//           <div className="cg-float">
//             <HeroDashboardMockup />
//           </div>
//         </div>

//         <div className="relative z-10 mx-auto mt-16 w-full max-w-5xl overflow-hidden">
//           <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-24 bg-gradient-to-r from-[#0b0b10] to-transparent" />
//           <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-24 bg-gradient-to-l from-[#0b0b10] to-transparent" />

//           <div className="grid border-y border-white/10 bg-white/[0.035] backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4">
//             {heroStats.map((item) => (
//               <div key={item.label} className="px-6 py-8 text-center">
//                 <div className="text-3xl font-black tracking-[-0.05em] text-white lg:text-4xl">
//                   {item.value}
//                 </div>
//                 <div className="mt-2 text-sm font-semibold text-white/42">
//                   {item.label}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       <section id="brand-partners" className="bg-[#fbfaf7] px-4 py-14 sm:px-6 lg:px-8">
//         <div className="mx-auto max-w-7xl">
//           <p className="text-center text-xs font-black uppercase tracking-[0.22em] text-[#9b9285]">
//             Built for growing product brands and modern campaign teams
//           </p>

//           <div className="relative mt-9 overflow-hidden">
//             <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#fbfaf7] to-transparent" />
//             <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#fbfaf7] to-transparent" />

//             <div className="cg-marquee flex w-max items-center gap-12">
//               {[...partnerBrands, ...partnerBrands].map((brand, index) => (
//                 <div
//                   key={`${brand.name}-${index}`}
//                   className="flex min-w-[150px] items-center justify-center"
//                   title={brand.name}
//                 >
//                   {brand.logo ? (
//                     <img
//                       src={brand.logo}
//                       alt={`${brand.name} logo`}
//                       className="max-h-10 max-w-[140px] object-contain opacity-60 grayscale mix-blend-multiply transition duration-300 hover:opacity-100 hover:grayscale-0"
//                       loading="lazy"
//                       onError={(event) => {
//                         event.currentTarget.style.display = 'none';
//                         const fallback = event.currentTarget.parentElement?.querySelector(
//                           '.brand-name-fallback'
//                         );
//                         fallback?.classList.remove('hidden');
//                       }}
//                     />
//                   ) : null}

//                   <span
//                     className={`brand-name-fallback text-base font-black uppercase tracking-[0.14em] text-[#15110e]/60 ${
//                       brand.logo ? 'hidden' : ''
//                     }`}
//                   >
//                     {brand.name}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </section>

//       <section id="compare" className="bg-[#fbfaf7] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
//         <div className="mx-auto max-w-7xl">
//           <SectionHeader
//             eyebrow="Why brands switch"
//             title="Old influencer marketing is messy."
//             accent="CollabGlam is controlled."
//             description="Replace scattered research, uncertain creator quality, and unclear ROI with one AI-assisted campaign workflow."
//           />

//           <div className="mt-14 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
//             <div className="rounded-[32px] border border-red-500/10 bg-[#fff7f7] p-6 sm:p-8">
//               <div className="mb-7 flex items-center gap-4">
//                 <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-red-500/10 text-red-600">
//                   <X className="h-6 w-6" />
//                 </div>
//                 <div>
//                   <p className="text-xs font-black uppercase tracking-[0.18em] text-red-500/70">
//                     The old way
//                   </p>
//                   <h3 className="text-2xl font-black tracking-[-0.04em] text-[#15110e]">
//                     Slow, scattered, risky
//                   </h3>
//                 </div>
//               </div>

//               <div className="space-y-3">
//                 {comparison.oldWay.map((item) => (
//                   <div key={item} className="flex gap-3 rounded-2xl bg-white/70 p-4">
//                     <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-600">
//                       <X className="h-3.5 w-3.5" />
//                     </span>
//                     <span className="text-sm font-semibold leading-6 text-[#6f6a5f]">
//                       {item}
//                     </span>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             <div className="relative overflow-hidden rounded-[32px] border border-orange-500/20 bg-[#11110f] p-6 text-white shadow-[0_26px_90px_rgba(0,0,0,0.18)] sm:p-8">
//               <div className="pointer-events-none absolute right-[-120px] top-[-120px] h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
//               <div className="relative">
//                 <div className="mb-7 flex items-center gap-4">
//                   <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-orange-500 text-white">
//                     <Sparkles className="h-6 w-6" />
//                   </div>
//                   <div>
//                     <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
//                       The CollabGlam way
//                     </p>
//                     <h3 className="text-2xl font-black tracking-[-0.04em] text-white">
//                       AI-powered, visible, scalable
//                     </h3>
//                   </div>
//                 </div>

//                 <div className="grid gap-3 sm:grid-cols-2">
//                   {comparison.newWay.map((item) => (
//                     <div
//                       key={item}
//                       className="rounded-2xl border border-white/10 bg-white/[0.05] p-4"
//                     >
//                       <span className="mb-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
//                         <Check className="h-4 w-4" />
//                       </span>
//                       <p className="text-sm font-semibold leading-6 text-white/62">
//                         {item}
//                       </p>
//                     </div>
//                   ))}
//                 </div>

//                 <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.05] p-4">
//                   <div className="grid gap-3 sm:grid-cols-3">
//                     {[
//                       ['AI Match Score', '96%'],
//                       ['Audience Quality', 'A+'],
//                       ['Campaign Forecast', '3.8×'],
//                     ].map(([label, value]) => (
//                       <div key={label} className="rounded-2xl bg-black/20 p-4 text-center">
//                         <p className="text-xs font-bold text-white/38">{label}</p>
//                         <p className="mt-1 text-2xl font-black text-orange-300">
//                           {value}
//                         </p>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       <section id="features" className="relative bg-[#0b0b10] px-4 py-18 text-white sm:px-6 lg:px-8 lg:py-24">
//         <div className="pointer-events-none absolute left-[-200px] top-1/3 h-[500px] w-[500px] rounded-full bg-orange-500/10 blur-3xl" />
//         <div className="mx-auto max-w-7xl">
//           <SectionHeader
//             eyebrow="Product suite"
//             title="Everything your influencer team needs."
//             accent="Without the chaos."
//             description="A complete AI campaign workspace from creator discovery to performance reporting."
//             dark
//           />

//           <div className="mt-14 grid gap-5 lg:grid-cols-6">
//             {features.map((feature, index) => {
//               const Icon = feature.icon;
//               const spanClass =
//                 index === 0 || index === 6
//                   ? 'lg:col-span-3'
//                   : index === 1 || index === 2
//                     ? 'lg:col-span-3'
//                     : 'lg:col-span-2';

//               return (
//                 <article
//                   key={feature.title}
//                   className={`group relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.045] p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-300/30 hover:bg-white/[0.065] ${spanClass}`}
//                 >
//                   <div className="pointer-events-none absolute right-[-60px] top-[-60px] h-40 w-40 rounded-full bg-orange-500/10 blur-2xl transition group-hover:bg-orange-500/20" />
//                   <div className="relative">
//                     <div className="flex items-center justify-between gap-4">
//                       <span className="rounded-full border border-orange-300/20 bg-orange-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-orange-200">
//                         {feature.label}
//                       </span>
//                       <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-orange-200">
//                         <Icon className="h-5 w-5" />
//                       </span>
//                     </div>

//                     <h3 className="mt-5 text-2xl font-black tracking-[-0.04em] text-white">
//                       {feature.title}
//                     </h3>

//                     <p className="mt-3 text-sm leading-7 text-white/52">
//                       {feature.description}
//                     </p>

//                     <div className="mt-5 flex flex-wrap gap-2">
//                       {feature.chips.map((chip) => (
//                         <span
//                           key={chip}
//                           className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-bold text-white/55"
//                         >
//                           {chip}
//                         </span>
//                       ))}
//                     </div>

//                     <FeatureVisual type={feature.visual} />
//                   </div>
//                 </article>
//               );
//             })}
//           </div>
//         </div>
//       </section>

//       <section id="how-it-works" className="bg-[#fbfaf7] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
//         <div className="mx-auto max-w-7xl">
//           <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
//             <SectionHeader
//               eyebrow="How it works"
//               title="From product brief to creator launch."
//               accent="Fast."
//               description="CollabGlam keeps the flow simple enough for founders and powerful enough for growth teams."
//               align="left"
//             />

//             <div className="relative">
//               <div className="absolute left-8 top-10 hidden h-[calc(100%-80px)] w-px bg-gradient-to-b from-orange-500 via-orange-500/20 to-transparent md:block" />

//               <div className="space-y-5">
//                 {processSteps.map((step) => {
//                   const Icon = step.icon;

//                   return (
//                     <article
//                       key={step.id}
//                       className="relative rounded-[30px] border border-black/10 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.045)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(0,0,0,0.07)]"
//                     >
//                       <div className="flex flex-col gap-5 md:flex-row md:items-start">
//                         <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-[#11110f] text-white">
//                           <Icon className="h-6 w-6" />
//                         </div>
//                         <div>
//                           <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
//                             Step {step.id}
//                           </p>
//                           <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#11110f]">
//                             {step.title}
//                           </h3>
//                           <p className="mt-3 text-base leading-8 text-[#706e63]">
//                             {step.description}
//                           </p>
//                         </div>
//                       </div>
//                     </article>
//                   );
//                 })}
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       <section id="managed" className="relative overflow-hidden bg-[#11110f] px-4 py-18 text-white sm:px-6 lg:px-8 lg:py-24">
//         <div className="pointer-events-none absolute right-[-240px] top-[-220px] h-[650px] w-[650px] rounded-full bg-orange-500/20 blur-3xl" />
//         <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
//           <div>
//             <SectionHeader
//               eyebrow="Managed Campaign Plan"
//               title="Want the results without the operational mess?"
//               accent="We run it."
//               description="For brands that want influencer marketing done properly without hiring a team."
//               dark
//               align="left"
//             />

//             <div className="mt-8 space-y-3">
//               {managedSteps.map((step, index) => (
//                 <div
//                   key={step}
//                   className="flex gap-4 rounded-3xl border border-white/10 bg-white/[0.045] p-4"
//                 >
//                   <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-sm font-black text-white">
//                     {index + 1}
//                   </span>
//                   <p className="text-sm font-semibold leading-7 text-white/58">
//                     {step}
//                   </p>
//                 </div>
//               ))}
//             </div>

//             <div className="mt-8">
//               <PrimaryButton href="#lead">Talk About Managed Plan</PrimaryButton>
//             </div>
//           </div>

//           <div className="grid gap-4 sm:grid-cols-2">
//             {managedBenefits.map((benefit) => {
//               const Icon = benefit.icon;

//               return (
//                 <div
//                   key={benefit.title}
//                   className="rounded-[30px] border border-white/10 bg-white/[0.055] p-6 backdrop-blur-sm"
//                 >
//                   <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-200">
//                     <Icon className="h-5 w-5" />
//                   </span>
//                   <h3 className="text-xl font-black tracking-[-0.04em] text-white">
//                     {benefit.title}
//                   </h3>
//                   <p className="mt-3 text-sm leading-7 text-white/52">
//                     {benefit.description}
//                   </p>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </section>

//       <section id="case-studies" className="bg-[#fbfaf7] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
//         <div className="mx-auto max-w-7xl">
//           <SectionHeader
//             eyebrow="Proof points"
//             title="Creator campaigns with numbers."
//             accent="Not vibes."
//             description="Modern creator marketing should be measurable, repeatable, and clear enough for growth teams."
//           />

//           <div className="mt-14 grid gap-6 lg:grid-cols-3">
//             {caseStudies.map((study) => (
//               <article
//                 key={study.brand}
//                 className="overflow-hidden rounded-[34px] border border-black/10 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.055)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
//               >
//                 <div className={`bg-gradient-to-br ${study.gradient} p-6 text-white`}>
//                   <div className="flex items-center justify-between gap-4">
//                     <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/18 text-lg font-black backdrop-blur-md">
//                       {study.initials}
//                     </div>
//                     <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-black backdrop-blur-md">
//                       {study.budget}
//                     </span>
//                   </div>
//                   <h3 className="mt-6 text-2xl font-black tracking-[-0.04em]">
//                     {study.brand}
//                   </h3>
//                   <p className="mt-1 text-sm font-semibold text-white/72">
//                     {study.category}
//                   </p>
//                 </div>

//                 <div className="p-6">
//                   <p className="text-sm leading-7 text-[#706e63]">{study.story}</p>

//                   <div className="mt-6 grid grid-cols-3 gap-2">
//                     {study.metrics.map(([value, label]) => (
//                       <div key={label} className="rounded-2xl bg-[#f4f1ea] p-3 text-center">
//                         <p className="text-xl font-black tracking-[-0.04em] text-orange-500">
//                           {value}
//                         </p>
//                         <p className="mt-1 text-[10px] font-bold leading-4 text-[#7b7468]">
//                           {label}
//                         </p>
//                       </div>
//                     ))}
//                   </div>

//                   <blockquote className="mt-6 rounded-3xl border border-orange-500/15 bg-orange-50 p-4 text-sm italic leading-7 text-[#6f6a5f]">
//                     “{study.quote}”
//                     <span className="mt-3 block font-black not-italic text-[#15110e]">
//                       {study.person}
//                     </span>
//                   </blockquote>
//                 </div>
//               </article>
//             ))}
//           </div>
//         </div>
//       </section>

//       <section id="roadmap" className="bg-[#0b0b10] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-24">
//         <div className="mx-auto max-w-7xl">
//           <SectionHeader
//             eyebrow="Product roadmap"
//             title="Next up inside CollabGlam."
//             accent="Smarter reporting."
//             description="We are building deeper performance intelligence so brands can scale creators like a real acquisition channel."
//             dark
//           />

//           <div className="mt-14 grid gap-5 lg:grid-cols-3">
//             {roadmap.map((item, index) => {
//               const Icon = item.icon;

//               return (
//                 <article
//                   key={item.title}
//                   className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.045] p-7"
//                 >
//                   <div className="absolute right-[-40px] top-[-40px] h-32 w-32 rounded-full bg-fuchsia-500/10 blur-2xl" />
//                   <div className="relative">
//                     <div className="flex items-center justify-between">
//                       <span className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-200">
//                         Coming {String(index + 1).padStart(2, '0')}
//                       </span>
//                       <Icon className="h-5 w-5 text-fuchsia-200" />
//                     </div>
//                     <h3 className="mt-5 text-xl font-black tracking-[-0.04em] text-white">
//                       {item.title}
//                     </h3>
//                     <p className="mt-3 text-sm leading-7 text-white/52">
//                       {item.description}
//                     </p>
//                     <span className="mt-6 inline-flex rounded-full border border-fuchsia-300/20 bg-fuchsia-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-fuchsia-200">
//                       In development
//                     </span>
//                   </div>
//                 </article>
//               );
//             })}
//           </div>
//         </div>
//       </section>

//       <section id="about" className="bg-[#fbfaf7] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
//         <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
//           <div>
//             <SectionHeader
//               eyebrow="About CollabGlam"
//               title="Built for brands that treat creators like a growth channel."
//               accent=""
//               description="CollabGlam exists to make influencer marketing easier to plan, safer to execute, and clearer to measure."
//               align="left"
//             />

//             <div className="mt-8 grid gap-4 sm:grid-cols-2">
//               <div className="rounded-[28px] border border-orange-500/15 bg-orange-50 p-6">
//                 <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">
//                   Mission
//                 </p>
//                 <p className="mt-3 text-sm leading-7 text-[#706e63]">
//                   Help brands find creator partnerships that generate trust,
//                   attention, and measurable growth.
//                 </p>
//               </div>
//               <div className="rounded-[28px] border border-orange-500/15 bg-orange-50 p-6">
//                 <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">
//                   Vision
//                 </p>
//                 <p className="mt-3 text-sm leading-7 text-[#706e63]">
//                   Make creator marketing as structured, transparent, and scalable
//                   as paid media.
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div className="grid gap-4 sm:grid-cols-2">
//             {values.map((value) => {
//               const Icon = value.icon;

//               return (
//                 <div
//                   key={value.title}
//                   className="rounded-[30px] border border-black/10 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.045)]"
//                 >
//                   <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#11110f] text-orange-300">
//                     <Icon className="h-5 w-5" />
//                   </span>
//                   <h3 className="text-xl font-black tracking-[-0.04em] text-[#11110f]">
//                     {value.title}
//                   </h3>
//                   <p className="mt-3 text-sm leading-7 text-[#706e63]">
//                     {value.description}
//                   </p>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </section>

//       <section id="testimonials" className="bg-[#11110f] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-24">
//         <div className="mx-auto max-w-7xl">
//           <SectionHeader
//             eyebrow="Brand love"
//             title="Teams use CollabGlam to move faster."
//             accent=""
//             description="Less manual outreach. Better creator fit. Clearer campaign performance."
//             dark
//           />

//           <div className="mt-14 grid gap-5 lg:grid-cols-3">
//             {testimonials.map((item) => (
//               <article
//                 key={item.name}
//                 className="rounded-[30px] border border-white/10 bg-white/[0.045] p-7 transition hover:-translate-y-0.5 hover:border-orange-300/25"
//               >
//                 <div className="mb-6 flex gap-1 text-[#f0b429]">
//                   {Array.from({ length: 5 }).map((_, index) => (
//                     <Star key={index} className="h-5 w-5 fill-current" />
//                   ))}
//                 </div>

//                 <p className="text-base italic leading-8 text-white/62">
//                   “{item.quote}”
//                 </p>

//                 <div className="mt-8 flex items-center gap-4">
//                   <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-fuchsia-600 text-sm font-black text-white">
//                     {item.initials}
//                   </div>
//                   <div>
//                     <h3 className="font-black text-white">{item.name}</h3>
//                     <p className="text-sm text-white/42">{item.role}</p>
//                   </div>
//                 </div>
//               </article>
//             ))}
//           </div>
//         </div>
//       </section>

//       <section id="pricing" className="bg-[#fbfaf7] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
//         <div className="mx-auto max-w-7xl">
//           <SectionHeader
//             eyebrow="Pricing"
//             title="Start free."
//             accent="Scale when ready."
//             description="Choose the entry point that fits your current creator marketing maturity."
//           />

//           <div className="mt-14 grid gap-6 lg:grid-cols-3">
//             {pricingCards.map((plan) => (
//               <article
//                 key={plan.name}
//                 className={`relative rounded-[34px] border p-7 transition hover:-translate-y-0.5 sm:p-8 ${
//                   plan.highlighted
//                     ? 'border-orange-500/30 bg-[#11110f] text-white shadow-[0_28px_90px_rgba(0,0,0,0.22)]'
//                     : 'border-black/10 bg-white text-[#11110f] shadow-[0_10px_30px_rgba(0,0,0,0.045)]'
//                 }`}
//               >
//                 {plan.highlighted && (
//                   <span className="absolute right-6 top-6 rounded-full bg-orange-500 px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
//                     Recommended
//                   </span>
//                 )}

//                 <h3 className="max-w-[220px] text-2xl font-black tracking-[-0.04em]">
//                   {plan.name}
//                 </h3>
//                 <p
//                   className={`mt-3 text-sm leading-7 ${
//                     plan.highlighted ? 'text-white/55' : 'text-[#706e63]'
//                   }`}
//                 >
//                   {plan.description}
//                 </p>

//                 <div className="mt-8">
//                   <div className="text-5xl font-black tracking-[-0.06em]">
//                     {plan.price}
//                   </div>
//                   <p
//                     className={`mt-2 text-sm font-bold ${
//                       plan.highlighted ? 'text-white/45' : 'text-[#706e63]'
//                     }`}
//                   >
//                     {plan.note}
//                   </p>
//                 </div>

//                 <div className="mt-8 space-y-4">
//                   {plan.points.map((point) => (
//                     <div
//                       key={point}
//                       className={`flex items-start gap-3 ${
//                         plan.highlighted ? 'text-white/62' : 'text-[#706e63]'
//                       }`}
//                     >
//                       <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
//                       <span className="text-sm font-semibold leading-6">{point}</span>
//                     </div>
//                   ))}
//                 </div>

//                 <a
//                   href="#lead"
//                   className={`mt-8 inline-flex w-full items-center justify-center rounded-2xl px-6 py-4 text-sm font-black transition ${
//                     plan.highlighted
//                       ? 'bg-orange-500 text-white hover:bg-orange-600'
//                       : 'border border-black/10 bg-white text-[#11110f] hover:border-orange-500/30 hover:bg-orange-50 hover:text-orange-700'
//                   }`}
//                 >
//                   {plan.cta}
//                   <ArrowRight className="ml-2 h-4 w-4" />
//                 </a>
//               </article>
//             ))}
//           </div>
//         </div>
//       </section>

//       <section id="faq" className="bg-[#f3f0e8] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
//         <div className="mx-auto max-w-7xl">
//           <SectionHeader eyebrow="FAQ" title="Questions brands ask before starting." />

//           <div className="mx-auto mt-12 max-w-4xl space-y-3">
//             {faqs.map((faq, index) => {
//               const isOpen = openFaq === index;

//               return (
//                 <div
//                   key={faq.question}
//                   className={`overflow-hidden rounded-3xl border bg-white transition ${
//                     isOpen
//                       ? 'border-orange-500/25 shadow-[0_14px_40px_rgba(249,115,22,0.08)]'
//                       : 'border-black/10 shadow-[0_8px_24px_rgba(0,0,0,0.035)]'
//                   }`}
//                 >
//                   <button
//                     type="button"
//                     onClick={() => setOpenFaq(isOpen ? -1 : index)}
//                     className="flex w-full items-center justify-between gap-5 px-6 py-5 text-left"
//                     aria-expanded={isOpen}
//                   >
//                     <span
//                       className={`text-base font-black sm:text-lg ${
//                         isOpen ? 'text-orange-700' : 'text-[#11110f]'
//                       }`}
//                     >
//                       {faq.question}
//                     </span>
//                     <span
//                       className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition ${
//                         isOpen
//                           ? 'rotate-180 border-orange-500/25 bg-orange-50 text-orange-600'
//                           : 'border-black/10 text-[#9b9285]'
//                       }`}
//                     >
//                       <ChevronDown className="h-5 w-5" />
//                     </span>
//                   </button>

//                   <div
//                     className={`grid transition-all duration-300 ${
//                       isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
//                     }`}
//                   >
//                     <div className="overflow-hidden">
//                       <p className="border-t border-black/10 px-6 py-5 text-base leading-8 text-[#706e63]">
//                         {faq.answer}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </section>

//       <section id="lead" className="relative overflow-hidden bg-[#0b0b10] px-4 py-18 text-white sm:px-6 lg:px-8 lg:py-24">
//         <div className="pointer-events-none absolute left-[-220px] top-[-180px] h-[600px] w-[600px] rounded-full bg-orange-500/15 blur-3xl" />
//         <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
//           <div>
//             <SectionHeader
//               eyebrow="Get started free"
//               title="Get your creator shortlist."
//               accent="No credit card."
//               description="Tell us about your brand and campaign. We’ll help you find creators who actually fit your product, audience, and budget."
//               dark
//               align="left"
//             />

//             <div className="mt-8 grid gap-3 sm:grid-cols-2">
//               {[
//                 ['AI creator matching', Brain],
//                 ['Audience credibility scoring', ShieldCheck],
//                 ['Creator inbox workflow', Mail],
//                 ['AI reports and ROAS view', BarChart3],
//                 ['Managed plan available', Sparkles],
//                 ['Transparent campaign costs', Eye],
//               ].map(([label, Icon]) => {
//                 const ItemIcon = Icon as LucideIcon;

//                 return (
//                   <div
//                     key={label as string}
//                     className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4"
//                   >
//                     <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/15 text-orange-200">
//                       <ItemIcon className="h-4 w-4" />
//                     </span>
//                     <span className="text-sm font-bold text-white/62">
//                       {label as string}
//                     </span>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>

//           <div className="rounded-[34px] border border-white/10 bg-white p-6 text-[#11110f] shadow-[0_34px_120px_rgba(0,0,0,0.45)] sm:p-8">
//             <div className="flex items-start justify-between gap-5">
//               <div>
//                 <h3 className="text-3xl font-black tracking-[-0.05em]">
//                   Request creator matches
//                 </h3>
//                 <p className="mt-2 text-sm font-semibold text-[#706e63]">
//                   Free shortlist · Delivered in 48–72 hours
//                 </p>
//               </div>
//               <span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 sm:inline-flex">
//                 Free
//               </span>
//             </div>

//             <form onSubmit={handleLeadSubmit} className="mt-8 space-y-5">
//               <div className="grid gap-4 sm:grid-cols-2">
//                 <SelectField
//                   label="Product Category"
//                   name="productType"
//                   value={leadForm.productType}
//                   options={productOptions}
//                   onChange={handleLeadChange}
//                 />
//                 <SelectField
//                   label="Campaign Budget"
//                   name="budget"
//                   value={leadForm.budget}
//                   options={budgetOptions}
//                   onChange={handleLeadChange}
//                 />
//                 <SelectField
//                   label="Target Platform"
//                   name="platform"
//                   value={leadForm.platform}
//                   options={platformOptions}
//                   onChange={handleLeadChange}
//                 />
//                 <SelectField
//                   label="Primary Market"
//                   name="market"
//                   value={leadForm.market}
//                   options={marketOptions}
//                   onChange={handleLeadChange}
//                 />
//               </div>

//               <label className="block">
//                 <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.13em] text-[#6f6a5f]">
//                   Brand / Company Name
//                 </span>
//                 <input
//                   name="brandName"
//                   type="text"
//                   value={leadForm.brandName}
//                   onChange={handleLeadChange}
//                   placeholder="Your brand name"
//                   required
//                   className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm font-bold text-[#14120f] outline-none transition placeholder:text-[#b0ada3] focus:border-orange-500/60 focus:ring-4 focus:ring-orange-500/10"
//                 />
//               </label>

//               <label className="block">
//                 <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.13em] text-[#6f6a5f]">
//                   Business Email
//                 </span>
//                 <input
//                   name="email"
//                   type="email"
//                   value={leadForm.email}
//                   onChange={handleLeadChange}
//                   placeholder="you@yourcompany.com"
//                   required
//                   className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm font-bold text-[#14120f] outline-none transition placeholder:text-[#b0ada3] focus:border-orange-500/60 focus:ring-4 focus:ring-orange-500/10"
//                 />
//               </label>

//               <SelectField
//                 label="Interested in Managed Plan?"
//                 name="managedPlan"
//                 value={leadForm.managedPlan}
//                 options={managedOptions}
//                 onChange={handleLeadChange}
//               />

//               <button
//                 type="submit"
//                 disabled={isSubmitting}
//                 className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-orange-500 px-6 text-base font-black text-white shadow-[0_16px_40px_rgba(249,115,22,0.30)] transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
//               >
//                 {isSubmitting ? 'Submitting...' : 'Get My Creator Matches — Free'}
//                 {!isSubmitting && <ArrowRight className="ml-2 h-5 w-5" />}
//               </button>

//               <p className="text-center text-xs font-semibold leading-6 text-[#8b8377]">
//                 No subscription. No credit card. Free creator shortlist in 48–72 hours.
//               </p>
//             </form>
//           </div>
//         </div>
//       </section>

//       <section className="relative overflow-hidden bg-gradient-to-br from-[#c2410c] via-orange-500 to-[#fb923c] px-4 py-[72px] text-white sm:px-6 lg:px-8 lg:py-20">
//         <div className="pointer-events-none absolute left-1/2 top-[-220px] h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-white/20 blur-3xl" />
//         <div className="relative mx-auto max-w-4xl text-center">
//           <Zap className="mx-auto h-10 w-10" />
//           <h2 className="mt-6 text-5xl font-black leading-[0.98] tracking-[-0.065em] sm:text-6xl lg:text-7xl">
//             Stop guessing.
//             <br />
//             Start launching with creator data.
//           </h2>
//           <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/82">
//             Join brands using CollabGlam to turn creator partnerships into a
//             measurable acquisition channel.
//           </p>
//           <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
//             <PrimaryButton href="#lead" dark>
//               Get Started Free
//             </PrimaryButton>
//             <a
//               href="mailto:care@collabglam.com"
//               className="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-7 py-4 text-sm font-black text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/15"
//             >
//               Book a Demo
//               <Send className="ml-2 h-4 w-4" />
//             </a>
//           </div>
//           <p className="mt-8 text-sm font-semibold text-white/62">
//             collabglam.com · care@collabglam.com · +1 (904) 219-4648 · Florida, USA
//           </p>
//         </div>
//       </section>

//       <FooterWithNewsletter />
//     </main>
//   );
// }