"use client";

import React from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { BrandDetail } from "./types";
import { BrandAvatar } from "./shared";

type CampaignEligibleBrand = BrandDetail & {
  isAdminCreated?: boolean;
  createdByAdmin?: string | null;
  adminCreatedRole?: string | null;
  fullyManagedSubscription?: boolean;
  planName?: string | null;
  signupCompleted?: boolean;
  currentStatus?: string | null;
  currentStatusLabel?: string | null;
  subscription?: BrandDetail["subscription"] & {
    planName?: string | null;
    planKey?: string | null;
    slug?: string | null;
    type?: string | null;
  };
};

function formatPlanName(value?: string | null) {
  const raw = String(value || "").trim();

  if (!raw || raw === "—") return "—";

  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizePlanKey(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getSubscriptionBadge(planName: string, expired?: boolean) {
  const normalizedPlan = planName.toLowerCase();

  if (!planName || planName === "—") {
    return {
      label: "No Subscription",
      className: "border-white/20 bg-white/10 text-white/80",
    };
  }

  if (expired) {
    return {
      label: `${planName} Plan`,
      className: "border-rose-200 bg-rose-500 text-white",
    };
  }

  if (
    normalizedPlan.includes("enterprise") ||
    normalizedPlan.includes("premium") ||
    normalizedPlan.includes("pro")
  ) {
    return {
      label: `${planName} Plan`,
      className: "border-violet-200 bg-violet-500 text-white",
    };
  }

  if (
    normalizedPlan.includes("growth") ||
    normalizedPlan.includes("business") ||
    normalizedPlan.includes("standard")
  ) {
    return {
      label: `${planName} Plan`,
      className: "border-sky-200 bg-sky-500 text-white",
    };
  }

  if (
    normalizedPlan.includes("starter") ||
    normalizedPlan.includes("basic") ||
    normalizedPlan.includes("free") ||
    normalizedPlan.includes("trial")
  ) {
    return {
      label: `${planName} Plan`,
      className: "border-amber-200 bg-amber-400 text-slate-950",
    };
  }

  return {
    label: `${planName} Plan`,
    className: "border-white/25 bg-white/15 text-white backdrop-blur",
  };
}

export function BrandViewHeader({
  brand,
  onBack,
  onCreateCampaign,
}: {
  brand: BrandDetail;
  onBack: () => void;
  onEdit: () => void;
  onCreateCampaign: () => void;
}) {
  const campaignBrand = brand as CampaignEligibleBrand;

  const currentPlanName = formatPlanName(
    campaignBrand.subscription?.planName || campaignBrand.planName || "—"
  );

  const subscriptionBadge = getSubscriptionBadge(
    currentPlanName,
    campaignBrand.subscriptionExpired
  );

  const rawPlanValues = [
    campaignBrand.subscription?.planName,
    campaignBrand.planName,
    campaignBrand.subscription?.planKey,
    campaignBrand.subscription?.slug,
    campaignBrand.subscription?.type,
  ];

  const normalizedPlanValues = rawPlanValues.map(normalizePlanKey);

  const isFreePlan = normalizedPlanValues.some((planValue) =>
    ["free", "trial", "basic", "starter"].includes(planValue)
  );

  const isFullyManagedPlan = normalizedPlanValues.includes("fully_managed");

  const isAdminCreatedBrand =
    campaignBrand.isAdminCreated === true ||
    Boolean(campaignBrand.createdByAdmin) ||
    Boolean(campaignBrand.adminCreatedRole);

  const canCreateCampaign =
    isAdminCreatedBrand ||
    (!isFreePlan &&
      (isFullyManagedPlan || campaignBrand.fullyManagedSubscription === true));


  const isPendingSignup =
    campaignBrand.signupCompleted === false ||
    campaignBrand.currentStatus === "pending_signup";


  return (
    <>
      <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-slate-500 transition hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <span className="text-slate-300">›</span>
        <span>Brands</span>
        <span className="text-slate-300">›</span>
        <span className="text-slate-950">{campaignBrand.brandName}</span>
      </div>

      <Card className="overflow-hidden rounded-[30px] border border-slate-300 bg-gradient-to-br from-slate-900 via-slate-700 to-slate-400 text-white shadow-sm">
        <CardContent className="relative p-5 md:p-6">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-[24px] border border-white/25 bg-white/15 p-1 shadow-sm backdrop-blur">
                <BrandAvatar brand={campaignBrand} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                    {campaignBrand.brandName}
                  </h1>

                  {isPendingSignup ? (
                    <span className="inline-flex rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                      Pending Signup
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                      Active
                    </span>
                  )}
                </div>

                <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-white/80">
                  Manage brand details, subscription, campaigns, invoices,
                  activity, and settings.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${subscriptionBadge.className}`}
                    title={`Subscription: ${subscriptionBadge.label}`}
                  >
                    {subscriptionBadge.label}
                  </span>

                  <span className="inline-flex rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-black text-white backdrop-blur">
                    Wallet: $
                    {Number(campaignBrand.walletBalance || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {canCreateCampaign ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={onCreateCampaign}
                  className="h-11 rounded-2xl border border-white bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-white/90 hover:text-slate-950"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Campaign
                </Button>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </>
  );
}