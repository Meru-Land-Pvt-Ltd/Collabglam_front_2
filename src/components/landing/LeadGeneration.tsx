'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  FileText,
  Lock,
  MessageCircle,
  Target,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { post } from '@/lib/api';

const benefits = [
  {
    icon: Bot,
    text: 'AI-powered creator matching with audience credibility scoring',
  },
  {
    icon: BarChart3,
    text: 'Real-time campaign dashboards and AI performance reports',
  },
  {
    icon: MessageCircle,
    text: 'Centralised inbox — all creator communication in one place',
  },
  {
    icon: FileText,
    text: 'AI campaign brief generator to launch faster',
  },
  {
    icon: Target,
    text: 'Managed Plan option if you want CollabGlam to run everything',
  },
  {
    icon: Lock,
    text: 'No hidden fees, no confusing commissions, full pricing clarity',
  },
  {
    icon: CheckCircle2,
    text: 'Campaign workflow built around better creator fit and stronger ROI',
  },
];

const productOptions = [
  'Consumer Electronics',
  'Beauty & Skincare',
  'Fitness & Sports',
  'Fashion & Apparel',
  'Food & Beverage',
  'Software & SaaS',
  'Home & Lifestyle',
  'Finance & Fintech',
  'Other',
];

const budgetOptions = [
  'Under $1,000',
  '$1,000–$5,000',
  '$5,000–$15,000',
  '$15,000–$50,000',
  '$50,000+',
];

const platformOptions = ['YouTube', 'Instagram', 'TikTok', 'Multi-Platform'];

const marketOptions = [
  'United States',
  'United Kingdom',
  'India',
  'Canada',
  'Australia',
  'Global',
];

const managedOptions = [
  'Yes — I want CollabGlam to manage everything',
  "No — I'll use the platform myself",
  'Not sure yet, tell me more',
];

type LeadFormData = {
  productType: string;
  budget: string;
  platform: string;
  market: string;
  brandName: string;
  email: string;
  managedPlan: string;
};

const emptyLeadForm: LeadFormData = {
  productType: '',
  budget: '',
  platform: '',
  market: '',
  brandName: '',
  email: '',
  managedPlan: '',
};

function getErrorMessage(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as any).response?.data?.message === 'string'
  ) {
    return (error as any).response.data.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong while submitting the form.';
}

function SelectField({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string;
  name: keyof LeadFormData;
  value: string;
  options: string[];
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#6b7280]">
        {label}
      </span>

      <select
        name={name}
        value={value}
        onChange={onChange}
        required
        className="h-12 w-full rounded-xl border border-[#e7e1d6] bg-white px-4 text-sm font-semibold text-[#101018] outline-none transition focus:border-[#f97316]/60 focus:ring-4 focus:ring-[#f97316]/10"
      >
        <option value="">Select…</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextInput({
  label,
  name,
  type,
  value,
  placeholder,
  autoComplete,
  onChange,
}: {
  label: string;
  name: keyof LeadFormData;
  type: string;
  value: string;
  placeholder: string;
  autoComplete?: string;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#6b7280]">
        {label}
      </span>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        autoComplete={autoComplete}
        className="h-12 w-full rounded-xl border border-[#e7e1d6] bg-white px-4 text-sm font-semibold text-[#101018] outline-none transition placeholder:text-[#a3a3a3] focus:border-[#f97316]/60 focus:ring-4 focus:ring-[#f97316]/10"
      />
    </label>
  );
}

export default function LeadGeneration() {
  const router = useRouter();

  const [leadForm, setLeadForm] = useState<LeadFormData>(emptyLeadForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLeadChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setLeadForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLeadSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        productType: leadForm.productType,
        budget: leadForm.budget,
        market: leadForm.market,
        email: leadForm.email,
        platform: leadForm.platform,
        brandName: leadForm.brandName,
        managedPlan: leadForm.managedPlan,
      };

      const response = await post('/matched-creator/create', payload);

      await Swal.fire({
        icon: 'success',
        title: 'Creator shortlist request submitted',
        text:
          response?.message ||
          "Thanks! We'll review your campaign and send your creator matches soon.",
        confirmButtonColor: '#f97316',
      });

      setLeadForm(emptyLeadForm);
      router.push('/brand/signup');
    } catch (error: unknown) {
      await Swal.fire({
        icon: 'error',
        title: 'Submission failed',
        text: getErrorMessage(error),
        confirmButtonColor: '#f97316',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="lead"
      className="relative overflow-hidden border-y border-white/[0.08] bg-[#0c0c12] px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        {/* Top Heading */}
        <div className="grid gap-8 border-b border-white/[0.08] pb-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <div className="inline-flex items-center rounded-full border border-[#f97316]/25 bg-[#f97316]/10 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-orange-300">
              Get Started Free
            </div>

            <h2 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl lg:text-[60px]">
              Get Matched with Your{' '}
              <span className="text-[#f97316]">Perfect Creators</span>
            </h2>
          </div>

          <p className="max-w-2xl text-base leading-8 text-[#a3a2b8] sm:text-lg lg:pb-2">
            Tell us about your brand and we&apos;ll send a curated, AI-matched
            creator shortlist within 48–72 hours. No commitment, no credit card
            required.
          </p>
        </div>

        {/* Split Layout */}
        <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
          {/* Left Benefits */}
          <aside className="border-b border-white/[0.08] py-10 lg:border-b-0 lg:border-r lg:py-14 lg:pr-12">
            <div className="max-w-xl">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#f97316]">
                What happens next
              </p>

              <h3 className="mt-3 text-2xl font-extrabold tracking-[-0.035em] text-white sm:text-3xl">
                Your campaign request becomes a creator-matching brief.
              </h3>

              <p className="mt-4 text-sm leading-7 text-white/55">
                Once submitted, your information is saved first. Then you&apos;ll
                be redirected to create your brand account and continue the
                onboarding flow.
              </p>
            </div>

            <div className="mt-10 grid gap-0 divide-y divide-white/[0.08]">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;

                return (
                  <div key={benefit.text} className="flex gap-5 py-5">
                    <div className="flex w-14 shrink-0 justify-center">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#f97316]/20 bg-[#f97316]/10 text-[#f97316]">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-white/30">
                        0{index + 1}
                      </p>

                      <p className="mt-1 text-sm font-medium leading-7 text-white/66">
                        {benefit.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Right Form */}
          <div className="py-10 lg:py-14 lg:pl-12">
            <div className="bg-[#fafaf7] p-6 text-[#101018] sm:p-8 lg:p-10">
              <div className="flex flex-col gap-4 border-b border-[#e7e1d6] pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-2xl font-extrabold tracking-[-0.035em] text-[#101018]">
                    Get Your Creator Shortlist
                  </h3>

                  <p className="mt-2 text-sm font-semibold text-[#6b7280]">
                    Free · No credit card · Delivered in 48–72 hours
                  </p>
                </div>
              </div>

              <form onSubmit={handleLeadSubmit} className="mt-7 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    label="Product Category"
                    name="productType"
                    value={leadForm.productType}
                    options={productOptions}
                    onChange={handleLeadChange}
                  />

                  <SelectField
                    label="Campaign Budget"
                    name="budget"
                    value={leadForm.budget}
                    options={budgetOptions}
                    onChange={handleLeadChange}
                  />

                  <SelectField
                    label="Target Platform"
                    name="platform"
                    value={leadForm.platform}
                    options={platformOptions}
                    onChange={handleLeadChange}
                  />

                  <SelectField
                    label="Primary Market"
                    name="market"
                    value={leadForm.market}
                    options={marketOptions}
                    onChange={handleLeadChange}
                  />
                </div>

                <TextInput
                  label="Brand / Company Name"
                  name="brandName"
                  type="text"
                  value={leadForm.brandName}
                  onChange={handleLeadChange}
                  placeholder="Your brand name"
                  autoComplete="organization"
                />

                <TextInput
                  label="Business Email"
                  name="email"
                  type="email"
                  value={leadForm.email}
                  onChange={handleLeadChange}
                  placeholder="you@yourcompany.com"
                  autoComplete="email"
                />

                <SelectField
                  label="Interested in Managed Plan?"
                  name="managedPlan"
                  value={leadForm.managedPlan}
                  options={managedOptions}
                  onChange={handleLeadChange}
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-[#f97316] px-6 text-base font-extrabold text-white transition hover:bg-[#c2410c] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting
                    ? 'Submitting...'
                    : 'Get My Creator Matches — Free'}

                  {!isSubmitting && <ArrowRight className="ml-2 h-5 w-5" />}
                </button>

                <p className="text-center text-xs font-medium leading-6 text-[#6b7280]">
                  No subscription. No credit card. Free creator shortlist in
                  48–72 hours.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}