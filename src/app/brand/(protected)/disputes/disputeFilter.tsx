"use client";
import ReactDOM from "react-dom";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronDownIcon,
  XIcon,
  SearchIcon,
  UploadCloudIcon,
  PaperclipIcon,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { GavelIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonComp";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { get, post, postFormData } from "@/lib/api";
import { FloatingTextarea } from "@/app/influencer/(protected)/my-campaigns/page";
import { FloatingInput } from "@/components/ui/floatingInput";
import { FloatingSelect, FloatingMultiSelect, SelectItem, Select } from "@/components/ui/selectComp";
import { ProductImagesUpload } from "@/components/ui/upload-card";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { LabeledTextarea } from "@/components/ui/textAreaComp";
import { ProductCardUpload } from "@/components/ui/productCard-Image";
import { DisputeFormDialog } from "./disputeDialog";

// ─── Types ─────────────────────────────────────────────────────────────────────

// The active-campaign API can return either _id or campaignsId as the identifier,
// and either campaignTitle or productOrServiceName as the display label.
export type Campaign = {
  _id?: string;
  campaignsId?: string;
  campaignTitle?: string;
  productOrServiceName?: string;
};

// Helper: extract a stable id and display label regardless of field shape
export function getCampaignId(c: Campaign): string {
  return c.campaignsId || c._id || "";
}
export function getCampaignLabel(c: Campaign): string {
  return c.productOrServiceName || c.campaignTitle || getCampaignId(c);
}

export type Applicant = { influencerId: string; name?: string; handle?: string | null };

// ─── Filter option sets ────────────────────────────────────────────────────────

// Numeric mapping matches backend STATUS_ORDER: 1=open, 2=in_review, 3=awaiting_user, 4=resolved, 5=rejected
const STATUS_OPTIONS = [
  { value: "0", label: "All" },
  { value: "1", label: "Open" },
  { value: "2", label: "In Review" },
  { value: "3", label: "Awaiting You" },
  { value: "4", label: "Resolved" },
  { value: "5", label: "Rejected" },
];

const DIRECTION_OPTIONS = [
  { value: "all", label: "All disputes" },
  { value: "raised_by_you", label: "Raised by you" },
  { value: "against_you", label: "Raised against you" },
];



// ─── ComboboxFilter ────────────────────────────────────────────────────────────

function ComboboxFilter({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div
      ref={ref}
      className="relative inline-flex items-center gap-1 text-sm text-[#1a1a1a]"
    >
      <span className="font-normal text-[#1a1a1a]">{label}</span>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-0.5 font-normal hover:opacity-70 transition-opacity"
      >
        <span>{selected?.label ?? "All"}</span>
        <ChevronDownIcon
          className="size-3.5 text-[#1a1a1a]"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
          }}
        />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1.5 z-50 min-w-[180px] rounded-xl bg-white border border-[#e8e8e8] py-1 overflow-hidden"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.10)" }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full px-4 py-2 text-sm text-left transition-colors ${
                value === opt.value
                  ? "text-[#1a1a1a] font-medium bg-transparent"
                  : "text-[#1a1a1a] font-normal hover:bg-[#f5f5f5]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}



// ─── RaiseDisputeDialog ────────────────────────────────────────────────────────

export function RaiseDisputeDialog({
  open,
  onOpenChange,
  onSuccess,
  lockedCampaignId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void;
  lockedCampaignId?: string;
}) {
  return (
    <DisputeFormDialog
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      lockedCampaignId={lockedCampaignId}
      title="Raise a Dispute"
      submitLabel="Submit Dispute"
      onSubmit={async ({ brandId, values }) => {
        const form = new FormData();
        form.append("brandId", brandId);
        form.append("influencerId", values.influencerId);
        form.append("campaignId", values.campaignId);
        form.append("subject", values.subject);
        form.append("description", values.description);
        form.append("issueType", JSON.stringify(values.issueType));
        values.attachments.forEach((file) => form.append("attachments", file));

        await postFormData("/dispute/brand/create", form);
      }}
    />
  );
}

// ─── DisputeFilters (main export) ──────────────────────────────────────────────

export type DisputeFiltersProps = {
  search: string;
  onSearchChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  direction: string;
  onDirectionChange: (v: string) => void;
  onDisputeCreated?: () => void;
};

export default function DisputeFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  direction,
  onDirectionChange,
  onDisputeCreated,
}: DisputeFiltersProps) {
  const searchParams = useSearchParams();
  const campaignIdFromQuery = (searchParams.get("id") || "").trim();

  const [dialogOpen, setDialogOpen] = useState(false);
  const lastAutoOpenedCampaignRef = useRef<string | null>(null);

  useEffect(() => {
    if (!campaignIdFromQuery) return;

    if (lastAutoOpenedCampaignRef.current === campaignIdFromQuery) return;

    setDialogOpen(true);
    lastAutoOpenedCampaignRef.current = campaignIdFromQuery;
  }, [campaignIdFromQuery]);

  const hasFilters = status !== "0" || direction !== "all";

  const clearAll = () => {
    onStatusChange("0");
    onDirectionChange("all");
  };

  return (
    <>
      <div
        className="flex items-center gap-4 px-8 py-2.5 bg-white w-full mt-[2rem] flex-wrap"
        style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');`}</style>

        <ComboboxFilter
          label="Status"
          options={STATUS_OPTIONS}
          value={status}
          onChange={onStatusChange}
        />
        <ComboboxFilter
          label="Raised By"
          options={DIRECTION_OPTIONS}
          value={direction}
          onChange={onDirectionChange}
        />

        {hasFilters && (
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-[#e2e2e2] text-sm text-[#1a1a1a] bg-white hover:bg-[#f5f5f5] transition-colors"
          >
            Clear <XIcon className="size-3.5" />
          </button>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-2 w-[14.5625rem] h-[2.5rem] rounded-lg border border-neutral-200 bg-white focus-within:border-[#1a1a1a] focus-within:ring-2 focus-within:ring-[#1a1a1a]/10 transition-all">
          <Input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="border-none shadow-none ring-0 focus-visible:ring-0 focus-visible:border-none bg-transparent text-sm text-[#1a1a1a] placeholder:text-[#bbb] outline-none flex-1 h-full p-0"
          />
          <SearchIcon className="size-4 text-[#bbb] shrink-0 mr-4" />
        </div>

        <Button
          onClick={() => setDialogOpen(true)}
          className="!w-[9.5rem] !h-[2.5rem] !px-0 !rounded-[0.75rem] flex items-center justify-center"
        >
          <div className="flex items-center gap-2 whitespace-nowrap">
            <GavelIcon size={16} />
            <span>Raise Dispute</span>
          </div>
        </Button>
      </div>

      <RaiseDisputeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={onDisputeCreated}
        lockedCampaignId={campaignIdFromQuery || undefined}
      />
    </>
  );
}