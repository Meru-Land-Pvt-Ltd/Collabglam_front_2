'use client';

import React, { useState } from 'react';
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
    text: 'Centralised inbox — all creator comms on one platform',
  },
  {
    icon: FileText,
    text: 'AI campaign brief generator — go live in minutes',
  },
  {
    icon: Target,
    text: 'Managed Plan option — CollabGlam runs the whole campaign',
  },
  {
    icon: Lock,
    text: 'No hidden fees. No commissions. Transparent pricing always.',
  },
  {
    icon: CheckCircle2,
    text: 'Average 3.2× ROAS across campaigns on the platform',
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
      <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.12em] text-[#6b7280]">
        {label}
      </span>

      <select
        name={name}
        value={value}
        onChange={onChange}
        required
        className="h-12 w-full rounded-xl border border-[#e7e1d6] bg-[#fafaf7] px-4 text-sm font-semibold text-[#101018] outline-none transition focus:border-[#f97316]/60 focus:bg-white focus:ring-4 focus:ring-[#f97316]/10"
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

export default function LeadGeneration() {
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
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Submission failed',
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
    <section
      id="lead"
      className="relative overflow-hidden bg-[#0c0c12] px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        {/* Left */}
        <div>
          <div className="inline-flex items-center rounded-full border border-[#F97316]/25 bg-[#F97316]/10 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-orange-300">
            Get Started Free
          </div>

          <h2 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl lg:text-[60px]">
            Get Matched with Your{' '}
            <span className="text-[#F97316]">Perfect Creators</span>
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-8 text-[#A3A2B8] sm:text-lg">
            Tell us about your brand and we'll send a curated, AI-matched creator
            shortlist within 48–72 hours. No commitment, no credit card required.
          </p>

          <div className="mt-9 grid gap-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <div
                  key={benefit.text}
                  className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#F97316]/20 bg-[#F97316]/10 text-[#F97316]">
                    <Icon className="h-5 w-5" />
                  </span>

                  <p className="text-sm font-medium leading-6 text-white/62">
                    {benefit.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <div className="rounded-[32px] border border-[#e7e1d6] bg-[#fafaf7] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.32)] sm:p-8">
          <div>
            <h3 className="text-2xl font-extrabold tracking-[-0.035em] text-[#101018]">
              Get Your Creator Shortlist
            </h3>

            <p className="mt-2 text-sm font-semibold text-[#6b7280]">
              Free · No credit card · Delivered in 48–72 hours
            </p>
          </div>

          <form onSubmit={handleLeadSubmit} className="mt-8 space-y-5">
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

            <label className="block">
              <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.12em] text-[#6b7280]">
                Brand / Company Name
              </span>

              <input
                name="brandName"
                type="text"
                value={leadForm.brandName}
                onChange={handleLeadChange}
                placeholder="Your brand name"
                required
                className="h-12 w-full rounded-xl border border-[#e7e1d6] bg-white px-4 text-sm font-semibold text-[#101018] outline-none transition placeholder:text-[#a3a3a3] focus:border-[#f97316]/60 focus:ring-4 focus:ring-[#f97316]/10"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.12em] text-[#6b7280]">
                Business Email
              </span>

              <input
                name="email"
                type="email"
                value={leadForm.email}
                onChange={handleLeadChange}
                placeholder="you@yourcompany.com"
                required
                className="h-12 w-full rounded-xl border border-[#e7e1d6] bg-white px-4 text-sm font-semibold text-[#101018] outline-none transition placeholder:text-[#a3a3a3] focus:border-[#f97316]/60 focus:ring-4 focus:ring-[#f97316]/10"
              />
            </label>

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
              className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-[#f97316] px-6 text-base font-extrabold text-white transition hover:bg-[#c2410c] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Submitting...' : 'Get My Creator Matches — Free'}
              {!isSubmitting && <ArrowRight className="ml-2 h-5 w-5" />}
            </button>

            <p className="text-center text-xs font-medium leading-6 text-[#6b7280]">
              No subscription. No credit card. Free creator shortlist in 48–72 hours.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}