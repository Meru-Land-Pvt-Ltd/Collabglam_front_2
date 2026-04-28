"use client";

import React from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { BrandDetail } from "./types";
import { BrandAvatar, StatusPill } from "./shared";

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

export function BrandViewHeader({
  brand,
  onBack,
  onEdit,
  onCreateCampaign,
}: {
  brand: BrandDetail;
  onBack: () => void;
  onEdit: () => void;
  onCreateCampaign: () => void;
}) {
  const currentPlanName = formatPlanName(
    brand.subscription?.planName || brand.planName || "—"
  );

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
        <span className="text-slate-950">{brand.brandName}</span>
      </div>

      <Card className="overflow-hidden rounded-[30px] border border-slate-300 bg-gradient-to-br from-slate-900 via-slate-700 to-slate-400 text-white shadow-sm">
        <CardContent className="relative p-5 md:p-6">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-[24px] border border-white/25 bg-white/15 p-1 shadow-sm backdrop-blur">
                <BrandAvatar brand={brand} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                    {brand.brandName}
                  </h1>

                  {brand.subscriptionExpired ? (
                    <span className="inline-flex rounded-full border border-rose-200 bg-rose-500 px-3 py-1 text-xs font-black text-white">
                      Expired
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-500 px-3 py-1 text-xs font-black text-white">
                      Active
                    </span>
                  )}
                </div>

                <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-white/80">
                  Manage brand details, subscription, campaigns, invoices,
                  activity, and settings.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">

                  {brand.fullyManagedSubscription ? (
                    <span className="inline-flex rounded-full border border-emerald-200/70 bg-emerald-500 px-3 py-1 text-xs font-black text-white">
                      Fully Managed
                    </span>
                  ) : null}

                  <span className="inline-flex rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-black text-white backdrop-blur">
                    Wallet: ${Number(brand.walletBalance || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

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
          </div>
        </CardContent>
      </Card>
    </>
  );
}