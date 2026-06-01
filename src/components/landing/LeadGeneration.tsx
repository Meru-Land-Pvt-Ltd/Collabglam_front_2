'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  Loader2,
  Lock,
  MessageCircle,
  Search as SearchIcon,
  Target,
  X,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { get, post } from '@/lib/api';

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

const platformOptions = ['YouTube', 'Instagram', 'TikTok'];

const managedOptions = [
  'Yes — I want CollabGlam to manage everything',
  "No — I'll use the platform myself",
  'Not sure yet, tell me more',
];

type Country = {
  _id: string;
  countryName: string;
  countryCode: string;
  flag?: string;
};

type SelectOption = {
  label: string;
  value: string;
  subLabel?: string;
  icon?: React.ReactNode;
};

type LeadFormData = {
  productType: string;
  budget: string;
  platforms: string[];
  market: string;
  brandName: string;
  email: string;
  managedPlan: string;
};

const emptyLeadForm: LeadFormData = {
  productType: '',
  budget: '',
  platforms: [],
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

function normalizeCountries(response: any): Country[] {
  const rawCountries = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.data?.data)
        ? response.data.data
        : Array.isArray(response?.countries)
          ? response.countries
          : [];

  return rawCountries
    .map((country: any) => ({
      _id: String(country?._id || country?.countryCode || country?.countryName),
      countryName: String(country?.countryName || '').trim(),
      countryCode: String(country?.countryCode || '').trim(),
      flag: country?.flag ? String(country.flag) : '',
    }))
    .filter((country: Country) => country.countryName);
}

function CustomSelect({
  label,
  placeholder = 'Select…',
  value,
  options,
  onChange,
  searchable = false,
  loading = false,
  disabled = false,
  emptyText = 'No options found',
}: {
  label: string;
  placeholder?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  searchable?: boolean;
  loading?: boolean;
  disabled?: boolean;
  emptyText?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((option) => option.value === value);

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options;

    const search = query.toLowerCase();

    return options.filter((option) => {
      return (
        option.label.toLowerCase().includes(search) ||
        option.value.toLowerCase().includes(search) ||
        option.subLabel?.toLowerCase().includes(search)
      );
    });
  }, [options, query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setQuery('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#6b7280]">
        {label}
      </span>

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        className={`flex h-12 w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-sm font-semibold outline-none transition ${
          isOpen
            ? 'border-[#f97316]/60 ring-4 ring-[#f97316]/10'
            : 'border-[#e7e1d6]'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-[#f97316]/45'}`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selectedOption ? 'text-[#101018]' : 'text-[#9ca3af]'
          }`}
        >
          {loading ? 'Loading…' : selectedOption?.label || placeholder}
        </span>

        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#f97316]" />
        ) : (
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-[#6b7280] transition ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 overflow-hidden rounded-2xl border border-[#e7e1d6] bg-white shadow-[0_18px_50px_rgba(17,24,39,0.14)]">
          {searchable && (
            <div className="border-b border-[#eee8dd] p-3">
              <div className="flex h-10 items-center gap-2 rounded-xl border border-[#e7e1d6] bg-[#fafaf7] px-3">
                <SearchIcon className="h-4 w-4 shrink-0 text-[#9ca3af]" />

                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search country..."
                  className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-[#101018] outline-none placeholder:text-[#9ca3af]"
                />
              </div>
            </div>
          )}

          <div className="max-h-[280px] overflow-y-auto p-2">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                      isSelected
                        ? 'bg-[#fff4ec] text-[#c2410c]'
                        : 'text-[#101018] hover:bg-[#fafaf7]'
                    }`}
                  >
                    {option.icon && (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center text-lg">
                        {option.icon}
                      </span>
                    )}

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-extrabold">
                        {option.label}
                      </span>

                      {option.subLabel && (
                        <span className="mt-0.5 block text-xs font-semibold text-[#6b7280]">
                          {option.subLabel}
                        </span>
                      )}
                    </span>

                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-[#f97316]" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-6 text-center text-sm font-semibold text-[#9ca3af]">
                {emptyText}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MultiSelectField({
  label,
  placeholder = 'Select platforms…',
  value,
  options,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string[];
  options: string[];
  onChange: (value: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleValue = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((item) => item !== option));
      return;
    }

    onChange([...value, option]);
  };

  return (
    <div ref={containerRef} className="relative">
      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#6b7280]">
        {label}
      </span>

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 py-2 text-left text-sm font-semibold outline-none transition ${
          isOpen
            ? 'border-[#f97316]/60 ring-4 ring-[#f97316]/10'
            : 'border-[#e7e1d6]'
        } hover:border-[#f97316]/45`}
      >
        <span className="flex min-w-0 flex-1 flex-wrap gap-2">
          {value.length > 0 ? (
            value.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 rounded-full bg-[#fff4ec] px-2.5 py-1 text-xs font-extrabold text-[#c2410c]"
              >
                {item}
              </span>
            ))
          ) : (
            <span className="text-[#9ca3af]">{placeholder}</span>
          )}
        </span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#6b7280] transition ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 overflow-hidden rounded-2xl border border-[#e7e1d6] bg-white p-2 shadow-[0_18px_50px_rgba(17,24,39,0.14)]">
          {options.map((option) => {
            const isSelected = value.includes(option);

            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleValue(option)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm font-extrabold transition ${
                  isSelected
                    ? 'bg-[#fff4ec] text-[#c2410c]'
                    : 'text-[#101018] hover:bg-[#fafaf7]'
                }`}
              >
                {option}

                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                    isSelected
                      ? 'border-[#f97316] bg-[#f97316] text-white'
                      : 'border-[#e7e1d6] text-transparent'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
              </button>
            );
          })}

          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#6b7280] transition hover:bg-[#fafaf7] hover:text-[#c2410c]"
            >
              <X className="h-3.5 w-3.5" />
              Clear selection
            </button>
          )}
        </div>
      )}
    </div>
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
  const [countries, setCountries] = useState<Country[]>([]);
  const [isCountriesLoading, setIsCountriesLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countryOptions = useMemo<SelectOption[]>(() => {
    return countries.map((country) => ({
      label: country.countryName,
      value: country.countryName,
      subLabel: country.countryCode,
      icon: country.flag ? <span>{country.flag}</span> : undefined,
    }));
  }, [countries]);

  useEffect(() => {
    let isMounted = true;

    async function loadCountries() {
      try {
        setIsCountriesLoading(true);

        const result = await get('/list/countries', {
          limit: 500,
        });

        const normalizedCountries = normalizeCountries(result);

        if (isMounted) {
          setCountries(normalizedCountries);
        }
      } catch (error) {
        if (isMounted) {
          setCountries([]);
          console.error('Countries loading failed:', error);
        }
      } finally {
        if (isMounted) {
          setIsCountriesLoading(false);
        }
      }
    }

    loadCountries();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLeadChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setLeadForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const setLeadValue = (name: keyof LeadFormData, value: string | string[]) => {
    setLeadForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateLeadForm = async () => {
    if (
      !leadForm.productType ||
      !leadForm.budget ||
      leadForm.platforms.length === 0 ||
      !leadForm.market ||
      !leadForm.brandName.trim() ||
      !leadForm.email.trim() ||
      !leadForm.managedPlan
    ) {
      await Swal.fire({
        icon: 'warning',
        title: 'Complete all fields',
        text: 'Please fill every field before submitting your creator shortlist request.',
        confirmButtonColor: '#f97316',
      });

      return false;
    }

    return true;
  };

  const handleLeadSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const isValid = await validateLeadForm();
    if (!isValid) return;

    setIsSubmitting(true);

    try {
      const payload = {
        productType: leadForm.productType,
        budget: leadForm.budget,
        market: leadForm.market,
        email: leadForm.email,
        platform: leadForm.platforms.join(', '),
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
      className="relative overflow-visible border-y border-white/[0.08] bg-[#0c0c12] px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
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
            creator shortlist within 15 minutes. No commitment, no credit card
            required.
          </p>
        </div>

        {/* Split Layout */}
        <div className="grid lg:grid-cols-[0.88fr_1.12fr]">
          {/* Left */}
          <aside className="border-b border-white/[0.08] py-10 lg:border-b-0 lg:border-r lg:py-14 lg:pr-12">
            <div className="max-w-xl">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#f97316]">
                What happens next
              </p>

              <h3 className="mt-3 text-2xl font-extrabold tracking-[-0.035em] text-white sm:text-3xl">
                Your campaign request becomes a creator-matching brief.
              </h3>

              <p className="mt-4 text-sm leading-7 text-white/55">
                We save your campaign details first, then redirect you to create
                your brand account and continue the onboarding flow.
              </p>
            </div>

            <div className="mt-10 divide-y divide-white/[0.08]">
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

          {/* Form */}
          <div className="py-10 lg:py-14 lg:pl-12">
            <div className="bg-[#fafaf7] p-6 text-[#101018] sm:p-8 lg:p-10">
              <div className="border-b border-[#e7e1d6] pb-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-2xl font-extrabold tracking-[-0.035em] text-[#101018]">
                      Get Your Creator Shortlist
                    </h3>

                    <p className="mt-2 text-sm font-semibold text-[#6b7280]">
                      Free · No credit card · Delivered in 15 minutes
                    </p>
                  </div>

                  <span className="inline-flex w-max rounded-full border border-[#f97316]/20 bg-[#fff4ec] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#c2410c]">
                    AI Matched
                  </span>
                </div>
              </div>

              <form onSubmit={handleLeadSubmit} className="mt-7 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <CustomSelect
                    label="Product Category"
                    value={leadForm.productType}
                    options={productOptions.map((option) => ({
                      label: option,
                      value: option,
                    }))}
                    onChange={(value) => setLeadValue('productType', value)}
                  />

                  <CustomSelect
                    label="Campaign Budget"
                    value={leadForm.budget}
                    options={budgetOptions.map((option) => ({
                      label: option,
                      value: option,
                    }))}
                    onChange={(value) => setLeadValue('budget', value)}
                  />

                  <MultiSelectField
                    label="Target Platform"
                    value={leadForm.platforms}
                    options={platformOptions}
                    onChange={(value) => setLeadValue('platforms', value)}
                  />

                  <CustomSelect
                    label="Country / Market"
                    value={leadForm.market}
                    options={countryOptions}
                    onChange={(value) => setLeadValue('market', value)}
                    searchable
                    loading={isCountriesLoading}
                    disabled={isCountriesLoading}
                    emptyText="No countries found"
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

                <CustomSelect
                  label="Interested in Managed Plan?"
                  value={leadForm.managedPlan}
                  options={managedOptions.map((option) => ({
                    label: option,
                    value: option,
                  }))}
                  onChange={(value) => setLeadValue('managedPlan', value)}
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
                  15 minutes.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}