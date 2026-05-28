'use client';

import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { post } from '@/lib/api';
import Swal from 'sweetalert2';

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

type CreatorMatchForm = {
  productType: string;
  budget: string;
  platform: string;
  market: string;
  brandName: string;
  email: string;
  managedPlan: string;
};

const emptyForm: CreatorMatchForm = {
  productType: '',
  budget: '',
  platform: '',
  market: '',
  brandName: '',
  email: '',
  managedPlan: '',
};

function SelectField({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string;
  name: keyof CreatorMatchForm;
  value: string;
  options: string[];
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.12em] text-[#706e63]">
        {label}
      </span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required
        className="h-12 w-full rounded-xl border border-black/10 bg-[#f3f2ee] px-4 py-3 text-sm font-semibold text-[#1a1916] outline-none transition focus:border-[#f97316]/60 focus:bg-white focus:ring-4 focus:ring-[#f97316]/10"
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

export default function CreatorMatchPage() {
  const [formData, setFormData] = useState<CreatorMatchForm>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await post('/matched-creator/create', formData);

      await Swal.fire({
        icon: 'success',
        title: 'Creator match request submitted',
        text:
          response?.message ||
          "Thanks! We'll review your campaign and send your creator matches soon.",
        confirmButtonColor: '#f97316',
      });

      setFormData(emptyForm);
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text:
          error?.response?.data?.message ||
          error?.message ||
          'Something went wrong while submitting the form.',
        confirmButtonColor: '#f97316',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#0c0c12] font-lexend">
      <section className="relative px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="pointer-events-none absolute left-1/2 top-[-260px] h-[560px] w-[980px] -translate-x-1/2 rounded-full bg-[#f97316]/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-180px] left-[-160px] h-[480px] w-[480px] rounded-full bg-purple-600/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-16">
          <div>
            <div className="inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-xs font-bold tracking-wide text-emerald-300">
              <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
              Free shortlist delivered in 48–72 hours
            </div>

            <h1 className="mt-8 text-5xl font-black leading-[0.98] tracking-[-0.06em] text-white sm:text-6xl lg:text-[82px]">
              Get Matched with{' '}
              <span className="text-[#f97316]">Perfect Creators.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-white/58 sm:text-lg">
              Tell us about your product, target market, platform, and budget.
              CollabGlam will send you a curated shortlist of verified creators
              matched to your campaign goals.
            </p>

            <div className="mt-9 space-y-4">
              {[
                'AI-powered matching with audience credibility scoring',
                'Creator shortlist based on product category, budget, and market',
                'Managed Plan available if you want us to run everything',
                'No subscription. No credit card. No hidden commission.',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-white/65">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#f97316]" />
                  <span className="leading-7">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] bg-[#fafaf7] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.42)] sm:p-8 lg:p-10">
            <div className="mb-8 flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff4ec] text-[#f97316]">
                <Sparkles className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-2xl font-black tracking-[-0.03em] text-[#1a1916]">
                  Get Your Creator Shortlist
                </h2>
                <p className="mt-1 text-sm font-semibold text-[#706e63]">
                  Free · No credit card · Delivered in 48–72 hours
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Product Category"
                  name="productType"
                  value={formData.productType}
                  options={productOptions}
                  onChange={handleChange}
                />

                <SelectField
                  label="Campaign Budget"
                  name="budget"
                  value={formData.budget}
                  options={budgetOptions}
                  onChange={handleChange}
                />

                <SelectField
                  label="Target Platform"
                  name="platform"
                  value={formData.platform}
                  options={platformOptions}
                  onChange={handleChange}
                />

                <SelectField
                  label="Primary Market"
                  name="market"
                  value={formData.market}
                  options={marketOptions}
                  onChange={handleChange}
                />
              </div>

              <label className="block">
                <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.12em] text-[#706e63]">
                  Brand / Company Name
                </span>
                <input
                  name="brandName"
                  type="text"
                  value={formData.brandName}
                  onChange={handleChange}
                  placeholder="Your brand name"
                  required
                  className="h-12 w-full rounded-xl border border-black/10 bg-[#f3f2ee] px-4 py-3 text-sm font-semibold text-[#1a1916] outline-none transition placeholder:text-[#b0ada3] focus:border-[#f97316]/60 focus:bg-white focus:ring-4 focus:ring-[#f97316]/10"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.12em] text-[#706e63]">
                  Business Email
                </span>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@yourcompany.com"
                  required
                  className="h-12 w-full rounded-xl border border-black/10 bg-[#f3f2ee] px-4 py-3 text-sm font-semibold text-[#1a1916] outline-none transition placeholder:text-[#b0ada3] focus:border-[#f97316]/60 focus:bg-white focus:ring-4 focus:ring-[#f97316]/10"
                />
              </label>

              <SelectField
                label="Interested in Managed Plan?"
                name="managedPlan"
                value={formData.managedPlan}
                options={managedOptions}
                onChange={handleChange}
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-[#f97316] px-6 text-base font-black text-white shadow-[0_14px_34px_rgba(249,115,22,0.28)] transition hover:bg-[#ea580c] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Submitting...' : 'Get My Creator Matches — Free'}
                {!isSubmitting && <ArrowRight className="ml-2 h-5 w-5" />}
              </button>

              <p className="text-center text-xs font-medium leading-6 text-[#b0ada3]">
                No subscription. No software fees. You only pay when a campaign runs.
              </p>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
