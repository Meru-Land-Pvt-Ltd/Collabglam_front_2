"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
import { FloatingSelect, SelectItem } from "@/components/ui/selectComp";
import { get, post, postFormData } from "@/lib/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

// The active-campaign API can return either _id or campaignsId as the identifier,
// and either campaignTitle or productOrServiceName as the display label.
type Campaign = {
  _id?: string;
  campaignsId?: string;
  campaignTitle?: string;
  productOrServiceName?: string;
};

// Helper: extract a stable id and display label regardless of field shape
function getCampaignId(c: Campaign): string {
  return c.campaignsId || c._id || "";
}
function getCampaignLabel(c: Campaign): string {
  return c.productOrServiceName || c.campaignTitle || getCampaignId(c);
}

type Applicant = { influencerId: string; name?: string; handle?: string | null };

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

// ─── FloatingInput ─────────────────────────────────────────────────────────────

function FloatingInput({
  label,
  required,
  value,
  onChange,
  className,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const [focused, setFocused] = useState(false);
  const isFloating = focused || value.length > 0;

  return (
    <div className={`my-2 w-full ${className ?? ""}`}>
      <div
        className={`relative rounded-[12px] border bg-white flex items-stretch min-h-[4rem] md:min-h-[4.25rem] xl:min-h-[4.5rem] 2xl:min-h-[5rem] transition-[box-shadow,border-color] duration-300 ${
          focused ? "border-black ring-1 ring-black" : "border-bd-primary"
        }`}
      >
        <label
          className={`pointer-events-none absolute z-10 select-none left-[18px] pr-[48px] max-w-full truncate transition-all duration-300 ease-out text-[color:var(--Light-Text-Secondary,#969696)] ${
            isFloating
              ? "top-[8px] translate-y-0 text-[14px] leading-[16px] font-normal"
              : "top-1/2 -translate-y-1/2 text-[16px] leading-[24px] font-medium"
          }`}
        >
          {label}
          {required && <span className="text-[#E53935]"> *</span>}
        </label>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full bg-transparent outline-none text-[14px] leading-[20px] font-semibold text-tx-primary pl-[18px] pr-[12px] transition-[padding] duration-300 ${
            isFloating ? "pt-[26px] pb-[8px]" : "pt-[22px] pb-[22px]"
          }`}
        />
      </div>
    </div>
  );
}

// ─── FloatingTextarea ──────────────────────────────────────────────────────────

function FloatingTextarea({
  label,
  required,
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 4,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
}) {
  const [focused, setFocused] = useState(false);
  const isFloating = focused || value.length > 0;

  return (
    <div className="my-2 w-full">
      <div
        className={`relative rounded-[12px] border bg-white transition-all duration-300 ${
          focused ? "border-black ring-1 ring-black" : "border-bd-primary"
        } px-[18px] pb-[28px] ${isFloating ? "pt-[26px]" : "pt-[22px]"}`}
      >
        <label
          className={`pointer-events-none absolute z-10 select-none left-[18px] transition-all duration-300 ease-out text-[color:var(--Light-Text-Secondary,#969696)] ${
            isFloating
              ? "top-[8px] text-[14px] leading-[16px] font-normal"
              : "top-[22px] text-[16px] leading-[24px] font-medium"
          }`}
        >
          {label}
          {required && <span className="text-[#E53935]"> *</span>}
        </label>
        <textarea
          value={value}
          onChange={(e) =>
            onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)
          }
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={isFloating ? placeholder : ""}
          rows={rows}
          className="w-full bg-transparent outline-none resize-none text-[14px] leading-[20px] font-semibold text-tx-primary placeholder:text-[#bbb] placeholder:font-normal"
        />
        {maxLength != null && (
          <span className="absolute bottom-2.5 right-3 text-[11px] text-[#bbb]">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── RaiseDisputeDialog ────────────────────────────────────────────────────────

function RaiseDisputeDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void;
}) {
  const [brandId, setBrandId] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  const [campaignId, setCampaignId] = useState("");
  const [influencerId, setInfluencerId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [relatedType, setRelatedType] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setBrandId(localStorage.getItem("brandId"));
  }, []);

  useEffect(() => {
    if (!brandId || !open) return;
    setLoadingCampaigns(true);
    get<{ data: Campaign[] }>("/campaign/active", { brandId, page: 1, limit: 1000 })
      .then((d) => setCampaigns(d?.data || []))
      .catch(() => {})
      .finally(() => setLoadingCampaigns(false));
  }, [brandId, open]);

  useEffect(() => {
    setApplicants([]);
    setInfluencerId("");
    if (!campaignId) return;
    setLoadingApplicants(true);
    post<{ influencers: Applicant[] }>("/apply/list", { campaignId, page: 1, limit: 1000 })
      .then((d) => setApplicants(d?.influencers || []))
      .catch(() => {})
      .finally(() => setLoadingApplicants(false));
  }, [campaignId]);

  const reset = () => {
    setCampaignId("");
    setInfluencerId("");
    setSubject("");
    setDescription("");
    setRelatedType("");
    setAttachments([]);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const addFiles = (files: FileList | File[]) =>
    setAttachments((prev) => [...prev, ...Array.from(files)]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }, []);

  const submit = async () => {
    setError(null);
    if (!brandId) { setError("Missing brand ID — please log in again."); return; }
    if (!influencerId) { setError("Please select an influencer."); return; }
    if (!subject.trim()) { setError("Dispute title is required."); return; }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("brandId", brandId);
      form.append("influencerId", influencerId);
      if (campaignId) form.append("campaignId", campaignId);
      form.append("subject", subject.trim());
      form.append("description", description.trim());
      form.append("related", JSON.stringify({ type: relatedType || "other" }));
      attachments.forEach((f) => form.append("attachments", f));

      await postFormData("/dispute/brand/create", form);
      handleClose();
      onSuccess?.(); // ← triggers refetch in BrandDisputesPage
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to create dispute.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className="p-0 gap-0 !max-w-[43.0625rem] rounded-2xl overflow-hidden border-0"
        style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.18)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <DialogTitle className="text-[1.15rem] font-semibold text-[#1a1a1a] tracking-tight">
            Raise a Dispute
          </DialogTitle>
          <button
            onClick={handleClose}
            className="size-7 flex items-center justify-center rounded-lg text-[#888] hover:bg-[#f5f5f5] hover:text-[#1a1a1a] transition-colors"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="my-2 flex items-start gap-2 text-red-600 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title + Campaign */}
          <div className="grid grid-cols-2 gap-4">
            <FloatingInput
              label="Dispute Title"
              required
              value={subject}
              onChange={setSubject}
            />
            <FloatingSelect
              label={loadingCampaigns ? "Loading campaigns…" : "Campaign name"}
              value={campaignId}
              onValueChange={setCampaignId}
              searchable
              searchPlaceholder="Search campaigns…"
              safeBottom={80}
              icon={!!campaignId}
            >
              {campaigns.length > 0
                ? campaigns
                    .filter((c) => getCampaignId(c)) // skip any with no usable id
                    .map((c) => (
                      <SelectItem key={getCampaignId(c)} value={getCampaignId(c)}>
                        {getCampaignLabel(c)}
                      </SelectItem>
                    ))
                : <SelectItem value="__empty__" disabled>No active campaigns</SelectItem>}
            </FloatingSelect>
          </div>

          <div className="flex flex-col gap-4">
            {/* Influencer */}
            <FloatingSelect
              label={
                !campaignId
                  ? "Select a campaign first"
                  : loadingApplicants
                  ? "Loading influencers…"
                  : "Influencer name"
              }
              required
              value={influencerId}
              onValueChange={setInfluencerId}
              disabled={!campaignId || loadingApplicants}
              searchable={applicants.length > 5}
              searchPlaceholder="Search influencers…"
              safeBottom={80}
              icon={!!influencerId}
            >
              {applicants.length > 0
                ? applicants.map((a) => (
                    <SelectItem key={a.influencerId} value={a.influencerId}>
                      {a.name || a.influencerId}
                      {a.handle ? ` (${a.handle})` : ""}
                    </SelectItem>
                  ))
                : <SelectItem value="__empty__" disabled>No influencers in this campaign</SelectItem>}
            </FloatingSelect>

            {/* Description */}
            <FloatingTextarea
              label="Description"
              value={description}
              onChange={setDescription}
              placeholder="Describe the issue in detail…"
              maxLength={500}
              rows={4}
            />

            {/* Issue Type */}
            <FloatingSelect
              label="Issue Type"
              required
              value={relatedType}
              onValueChange={setRelatedType}
              searchable={false}
              safeBottom={80}
              icon={!!relatedType}
            >
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="timeline">Timeline</SelectItem>
              <SelectItem value="content">Content</SelectItem>
            </FloatingSelect>

            {/* File Upload */}
            <div className="pb-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed cursor-pointer transition-all py-7 ${
                  dragging
                    ? "border-[#1a1a1a] bg-[#f5f5f5]"
                    : "border-[#e2e2e2] bg-[#fafafa] hover:border-[#bbb] hover:bg-[#f5f5f5]"
                }`}
              >
                <div className="size-10 rounded-full bg-[#efefef] flex items-center justify-center">
                  <UploadCloudIcon className="size-5 text-[#888]" />
                </div>
                <p className="text-sm text-[#1a1a1a]">
                  <span className="underline font-medium">Click to upload</span>
                  <span className="text-[#888]"> or drag and drop</span>
                </p>
                <p className="text-xs text-[#aaa]">SVG, PNG, JPG or PDF (max 5 MB each)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".svg,.png,.jpg,.jpeg,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>

              {attachments.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {attachments.map((file, idx) => (
                    <li
                      key={`${file.name}-${idx}`}
                      className="flex items-center justify-between gap-4 rounded-lg border border-[#e8e8e8] bg-white px-3 py-1.5 text-xs text-[#555]"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <PaperclipIcon className="size-3.5 shrink-0 text-[#aaa]" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAttachments((p) => p.filter((_, i) => i !== idx));
                        }}
                        className="text-[#bbb] hover:text-red-500 transition-colors shrink-0"
                      >
                        <XIcon className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 px-6 py-4 border-t border-[#f0f0f0] bg-white">
          <button
            onClick={handleClose}
            disabled={submitting}
            className="h-9 px-5 rounded-lg text-sm font-medium text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors disabled:opacity-50"
          >
            Discard
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="h-9 px-5 rounded-lg text-sm font-semibold text-white bg-[#1a1a1a] hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 className="size-3.5 animate-spin" />}
            {submitting ? "Creating…" : "Submit Dispute"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── DisputeFilters (main export) ──────────────────────────────────────────────

export type DisputeFiltersProps = {
  /** Controlled search text */
  search: string;
  onSearchChange: (v: string) => void;
  /** Numeric string: "0"=All, "1"=Open, "2"=In Review, "3"=Awaiting, "4"=Resolved, "5"=Rejected */
  status: string;
  onStatusChange: (v: string) => void;
  /** "all" | "raised_by_you" | "against_you" */
  direction: string;
  onDirectionChange: (v: string) => void;
  /** Called after dispute is successfully created — triggers list refetch */
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
  const [dialogOpen, setDialogOpen] = useState(false);

  const hasFilters = status !== "0" || direction !== "all";

  const clearAll = () => {
    onStatusChange("0");
    onDirectionChange("all");
  };

  return (
    <>
      <div
        className="flex items-center gap-4 px-8 py-2.5 bg-white w-full mt-8 flex-wrap"
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

        {/* Search input */}
        <div className="flex items-center gap-2 h-9 px-3 rounded-[0.75rem] border border-[#e2e2e2] bg-white w-52 focus-within:border-[#1a1a1a] focus-within:ring-2 focus-within:ring-[#1a1a1a]/10 transition-all">
          <Input
            type="text"
            placeholder="Search disputes…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-transparent text-sm text-[#1a1a1a] placeholder:text-[#bbb] outline-none flex-1"
          />
          <SearchIcon className="size-4 text-[#bbb] shrink-0" />
        </div>

        {/* Raise Dispute button */}
        <Button onClick={() => setDialogOpen(true)}>
          <div className="flex items-center gap-2">
            <GavelIcon />
            <span>Raise Dispute</span>
          </div>
        </Button>
      </div>

      <RaiseDisputeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={onDisputeCreated}
      />
    </>
  );
}