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

const DISPUTE_CATEGORIES = [
  { value: "content_not_as_expected", label: "Content Not as Expected" },
  { value: "delay_or_missed_deadline", label: "Delay or Missed Deadline" },
  { value: "payment_issue", label: "Payment Issue" },
  { value: "revision_issue", label: "Revision Issue" },
  { value: "agreement_issue", label: "Agreement Issue" },
  { value: "scope_change", label: "Scope Change" },
  { value: "no_response", label: "No Response" },
  { value: "other", label: "Other" },
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

function IssueTypeSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setOpen(false);
      setSearch("");
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const filtered = DISPUTE_CATEGORIES.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedLabels = DISPUTE_CATEGORIES.filter((c) =>
    value.includes(c.value)
  ).map((c) => c.label);

  return (
    <div className="relative w-full mt-2">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "relative flex h-14 w-full items-center rounded-lg border bg-white px-4 pr-12 text-left transition-all",
          open
            ? "border-[#bfc6d4] ring-2 ring-[#e9edf5]"
            : "border-[#d9d9d9] hover:border-[#c7c7c7]"
        )}
      >
        <span
          className={cn(
            "truncate text-[15px] leading-none",
            value.length > 0 ? "text-[#1a1a1a]" : "text-[#707070]"
          )}
        >
          {value.length > 0 ? (
            selectedLabels.join(", ")
          ) : (
            <>
              Issue Type <span className="text-red-500">*</span>
            </>
          )}
        </span>

        <ChevronDownIcon
          className={cn(
            "absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af] transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-lg"
        >
          <div className="flex items-center gap-2 border-b border-[#f1f1f1] px-4 py-3">
            <SearchIcon className="size-4 shrink-0 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Search issue types..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-transparent text-sm text-[#1a1a1a] outline-none placeholder:text-[#9ca3af]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-[#9ca3af] transition-colors hover:text-[#6b7280]"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>

          <div className="max-h-56 overflow-y-auto py-2">
            {filtered.length > 0 ? (
              filtered.map((cat) => {
                const checked = value.includes(cat.value);

                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => toggle(cat.value)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#f8f8f8]",
                      checked && "bg-[#fafafa]"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border transition-all",
                        checked
                          ? "border-[#1a1a1a] bg-[#1a1a1a]"
                          : "border-[#d1d5db] bg-white"
                      )}
                    >
                      {checked && (
                        <svg
                          className="h-3 w-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          />
                        </svg>
                      )}
                    </div>

                    <span className="text-sm text-[#1f2937]">{cat.label}</span>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-sm text-[#9ca3af]">
                No matching issue types found
              </div>
            )}
          </div>

          {value.length > 0 && (
            <div className="flex items-center justify-between border-t border-[#f1f1f1] bg-[#fafafa] px-4 py-2">
              <span className="text-xs text-[#6b7280]">
                {value.length} selected
              </span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-[#6b7280] transition-colors hover:text-[#374151]"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── RaiseDisputeDialog ────────────────────────────────────────────────────────

function RaiseDisputeDialog({
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
  const [brandId, setBrandId] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  const [campaignId, setCampaignId] = useState(lockedCampaignId || "");
  const [influencerId, setInfluencerId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [relatedType, setRelatedType] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isCampaignLocked = !!lockedCampaignId;

  useEffect(() => {
    if (typeof window === "undefined") return;
    setBrandId(localStorage.getItem("brandId"));
  }, []);

  useEffect(() => {
    if (!open) return;
    setCampaignId(lockedCampaignId || "");
    setInfluencerId("");
    setError(null);
  }, [open, lockedCampaignId]);

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

  const campaignOptions = campaigns.filter((c) => getCampaignId(c));
  const selectedCampaignExists = campaignOptions.some(
    (c) => getCampaignId(c) === campaignId
  );

  const reset = () => {
    setCampaignId(lockedCampaignId || "");
    setInfluencerId("");
    setSubject("");
    setDescription("");
    setRelatedType([]);
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
    if (!brandId) {
      setError("Missing brand ID — please log in again.");
      return;
    }
    if (!campaignId) {
      setError("Please select a campaign.");
      return;
    }
    if (!influencerId) {
      setError("Please select an influencer.");
      return;
    }
    if (!subject.trim()) {
      setError("Dispute title is required.");
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("brandId", brandId);
      form.append("influencerId", influencerId);
      form.append("campaignId", campaignId);
      form.append("subject", subject.trim());
      form.append("description", description.trim());
      form.append(
        "issueType",
        JSON.stringify(relatedType.length ? relatedType : ["other"])
      );
      attachments.forEach((f) => form.append("attachments", f));

      await postFormData("/dispute/brand/create", form);
      handleClose();
      onSuccess?.();
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
        className=" !flex !flex-col
      w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] md:w-full
      !max-w-[43.0625rem]
      max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] md:max-h-[min(54.25rem,calc(100dvh-3rem))]
      rounded-xl sm:rounded-2xl
      overflow-hidden
      p-0 gap-0"
        style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.18)" }}
      >
        <div className="flex shrink-0 items-center justify-between ">
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

        <hr />

        <div className="min-h-0 flex-1 overflow-y-auto">
          {error && (
            <div className="mb-2 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 text-xs text-red-600">
              <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FloatingInput
              label="Dispute Title"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />

            <FloatingSelect
              label={loadingCampaigns ? "Loading campaigns…" : "Campaign name"}
              value={campaignId}
              onValueChange={setCampaignId}
              disabled={isCampaignLocked || loadingCampaigns}
              searchable={!isCampaignLocked}
              searchPlaceholder="Search campaigns…"
              safeBottom={80}
              icon={!!campaignId}
            >
              {selectedCampaignExists ? null : campaignId ? (
                <SelectItem value={campaignId}>{campaignId}</SelectItem>
              ) : null}

              {campaignOptions.length > 0 ? (
                campaignOptions.map((c) => (
                  <SelectItem key={getCampaignId(c)} value={getCampaignId(c)}>
                    {getCampaignLabel(c)}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="__empty__" disabled>
                  No active campaigns
                </SelectItem>
              )}
            </FloatingSelect>
          </div>

          <div className=" flex flex-col gap-2">
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
              {applicants.length > 0 ? (
                applicants.map((a) => (
                  <SelectItem key={a.influencerId} value={a.influencerId}>
                    {a.name || a.influencerId}
                    {a.handle ? ` (${a.handle})` : ""}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="__empty__" disabled>
                  No influencers in this campaign
                </SelectItem>
              )}
            </FloatingSelect>

            <LabeledTextarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail…"
              maxLength={500}
              rows={4}
              className="min-h-28!"
            />

            <IssueTypeSelect value={relatedType} onChange={setRelatedType} />

            <ProductCardUpload
              showLabel={false}
              files={attachments}
              onFilesChange={(files) => setAttachments(files)}
              title="Upload Attachments"
              helperTypes="SVG, PNG, JPG or PDF (max 5 MB each)"
            />
          </div>
        </div>

        <div className="mt-auto flex shrink-0 items-center justify-end gap-3 bg-white">
          <Button
            onClick={handleClose}
            disabled={submitting}
            className="h-9 px-5 rounded-lg text-sm font-medium !text-[#1a1a1a] !bg-white transition-colors disabled:opacity-50 !shadow-none hover:!bg-[#f5f5f5] "
          >
            Discard
          </Button>

          <Button
            onClick={submit}
            disabled={submitting}
            className="flex h-9 items-center gap-2 rounded-lg bg-[#1a1a1a] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#333] disabled:opacity-50"
          >
            {submitting && <Loader2 className="size-3.5 animate-spin" />}
            {submitting ? "Creating…" : "Submit Dispute"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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