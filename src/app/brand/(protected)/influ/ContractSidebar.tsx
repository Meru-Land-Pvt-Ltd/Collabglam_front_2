"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import api, { post } from "@/lib/api";
import { Button } from "@/components/ui/buttonComp";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Eye,
  FileText,
  Info,
  ClipboardText,
  PenNib,
  SealCheck,
  Signature,
  DownloadSimpleIcon,
  ArrowSquareInIcon,
  CaretUp,
  CaretDown,
} from "@phosphor-icons/react";
import { FloatingInput } from "@/components/ui/floatingInput";
import {
  FloatingMultiSelect,
  FloatingSelect,
  SelectItem,
} from "@/components/ui/selectComp";
import { LabeledTextarea } from "@/components/ui/textAreaComp";
import { FloatingDateInput } from "@/components/ui/date";
import { FloatingTagInput } from "@/components/ui/tagInput";
import { Checkbox } from "@/components/animate-ui/components/radix/checkbox";
// import MinimalPdfPreview from "./MinimalPdfPreview";
import BrandSignatureModal from "./BrandSignatureModal";
import {
  apiGetPrimaryBrandSignature,
  apiListBrandSignatures,
  apiSetPrimaryBrandSignature,
} from "../../services/brandSignatureApi";
import { Switch } from "@/components/ui/switch";

type PaymentType = "fixed_payment" | "milestone_based" | "product_gifting";
type ContractMeta = {
  _id: string;
  contractId: string;
  campaignId: string;
  status?: string;
  requestedEffectiveDate?: string | null;
  requestedEffectiveDateTimezone?: string | null;
  content?: any;
  flags?: Record<string, any>;
  statusFlags?: Record<string, any>;
  resendIteration?: number;
  audit?: Array<{ type?: string; details?: { reason?: string } }>;
};

type ContractMilestone = {
  id: string;
  milestoneName: string;
  milestoneDescription: string;
  paymentAmount: string;
  triggerEvent: string;
  dueDate: string;
};

type ScheduleADeliverable = {
  id: string;
  srNo: number;
  platform: string;
  handle: string;
  deliverableFormat: string;
  deliverableName: string;
  contentSpecification: string;
  aspectRatio: string;
  qty: string;
  draftRequired: boolean;
  draftDue: string;
  liveDate: string;
  preShootScriptRequired: boolean;
  preShootScriptDue: string;
  preShootScriptReviewBusinessDays: string;
};

type UsageRightsRow = {
  id: string;
  usageRight: string;
  selected: boolean;
  duration: string;
  territoryNotes: string;
};

type ContractFormState = {
  brand: {
    legalName: string;
    contactPersonName: string;
    noticeEmail: string;
    noticePhone: string;
    billingAddress: string;
    brandPoc: string;
    brandPocDesignation: string;
  };
  influencer: {
    legalName: string;
    contactName: string;
    postingHandleUrl: string;
    contactEmail: string;
    contactPhone: string;
    whatsApp: string;
    address: string;
  };
  campaign: {
    productsServicesCovered: string;
    territoryTargetCountry: string;
    effectiveDate: string;
    campaignTitleOrId: string;
    paymentType: PaymentType;
  };
  scheduleA: {
    minimumVideoSpecs: string;
    preShootScriptRequired: "" | "yes" | "no";
    preShootScriptDue: string;
    preShootScriptReviewBusinessDays: string;
    mandatoryTagsMentionsLinksCodes: string;
    review: {
      needRevisionRounds: "" | "yes" | "no" | "__select_revision_rounds__";
      includedRevisionRounds: string;
      additionalRevisionFee: string;
      reshootObligation: string;
      reshootFee: string;
      minimumLivePeriod: string;
    };
    commercial: {
      totalCampaignFee: string;
      currency: string;
      paymentStructure: string;
      customSplit: string;
      advancePaymentTrigger: string;
      remainingPaymentTrigger: string;
      paymentProcessorFeesBorneBy: string;
      paymentProcessorFeesNotes: string;
      laneAMarketplaceFeeNote: string;
      milestones: ContractMilestone[];
      influencerBudget: string;
    };
    rawFiles: {
      rawSourceFileDelivery: string;
      deliveryDue: string;
      format: string;
      analyticsReportingDeadline: string;
      analyticsReportingItems: string;
    };
    shipping: {
      productShippingApplicable: string;
      shipToName: string;
      shipToAddress: string;
      shipToPhone: string;
      productReceiptConfirmationDeadline: string;
      productReturnable: string;
      returnWindowMethod: string;
      riskOfLossNotes: string;
    };
    usageRights: {
      rows: UsageRightsRow[];
      attributionRequirement: string;
      attributionText: string;
      editingRights: string;
      musicStockAssetResponsibility: string;
    };
    compliance: {
      creativeBriefMandatoryTalkingPoints: string;
      restrictedStatements: string;
    };
    exclusivity: {
      competitorBlackout: string;
      categoryCompetitorList: string;
      blackoutPeriod: string;
      optionalMoralsClause: string;
    };
    cancellation: {
      killFeeOrProrata: string;
      refundOfUnearnedAdvance: string;
    };
    dispute: {
      governingLaw: string;
      disputeResolutionMethod: string;
      disputeVenue: string;
      arbitrationSeat: string;
      attorneysFees: string;
    };
  };
};

type CurrencyOption = { value: string; label: string; meta?: any };
type TzOption = { value: string; label: string; meta?: any };

const USD_CURRENCY_OPTION: CurrencyOption = {
  value: "USD",
  label: "$ — US Dollar",
  meta: {
    symbol: "$",
    name: "US Dollar",
    symbol_native: "$",
    decimal_digits: 2,
    rounding: 0,
    code: "USD",
    name_plural: "US dollars",
  },
};

type ContractSidebarExtractedProps = {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  brandId?: string | null;
  influencer?: any | null;
  campaignTitle?: string;
  campaignBudget?: number | null;
  campaignTimeline?: { startDate?: string | Date; endDate?: string | Date } | null;
  onSuccess?: () => void | Promise<void>;
  initialContract?: ContractMeta | null;
  forcedPaymentType?: PaymentType;
  // optional bulk support
  mode?: "single" | "bulk";
  bulkInfluencers?: any[];
};

const DEFAULT_TIMEZONE = "America/Los_Angeles";

const CONTRACT_STATUS = {
  REJECTED: "REJECTED",
} as const;

const PAYMENT_TYPE = {
  FIXED: "fixed_payment",
  MILESTONE: "milestone_based",
  GIFTING: "product_gifting",
} as const;

const PAYMENT_STRUCTURE_DUMMY_VALUE = "__select_payment_structure__";
const REVISION_ROUNDS_DUMMY_VALUE = "__select_revision_rounds__";
const MINIMUM_LIVE_PERIOD_DUMMY_VALUE = "__select_duration__";

const CONTRACT_TYPE_LABELS: Record<PaymentType, string> = {
  fixed_payment: "Fixed Contract",
  milestone_based: "Milestone Contract",
  product_gifting: "Product Gifting Contract",
};
const YES_NO_BOOL_OPTIONS = [
  { value: REVISION_ROUNDS_DUMMY_VALUE, label: "Select" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const DELIVERABLE_FORMAT_OPTIONS = [
  { value: "Dedicated Video", label: "Dedicated Video" },
  { value: "Integrated Video", label: "Integrated Video" },
  { value: "Reel", label: "Reel" },
  { value: "Story Set", label: "Story Set" },
  { value: "Static Post", label: "Static Post" },
  { value: "UGC (Raw Files Only)", label: "UGC (Raw Files Only)" },
  { value: "Live Stream", label: "Live Stream" },
];

const DELIVERY_TYPE_OPTIONS = [
  { value: "Reel (video)", label: "Reel (video)" },
  { value: "Story (video)", label: "Story (video)" },
  { value: "Static Post", label: "Static Post" },
  { value: "Dedicated Video", label: "Dedicated Video" },
  { value: "Integrated Video", label: "Integrated Video" },
  { value: "UGC Raw File", label: "UGC Raw File" },
];

const ASPECT_RATIO_OPTIONS = [
  { value: "1080×1080", label: "1080×1080" },
  { value: "9:16", label: "9:16" },
  { value: "16:9", label: "16:9" },
  { value: "4:5", label: "4:5" },
  { value: "1:1", label: "1:1" },
];

const PLATFORM_OPTIONS = [
  { value: "Instagram", label: "Instagram" },
  { value: "YouTube", label: "YouTube" },
  { value: "TikTok", label: "TikTok" },
];

const MINIMUM_LIVE_PERIOD_OPTIONS = [
  { value: MINIMUM_LIVE_PERIOD_DUMMY_VALUE, label: "Select a duration" },
  { value: "30 days", label: "30 days" },
  { value: "60 days", label: "60 days" },
  { value: "2 months", label: "2 months" },
  { value: "3 months", label: "3 months" },
  { value: "6 months", label: "6 months" },
  { value: "12 months", label: "12 months" },
];

const YES_NO_OPTIONS = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

const PAYMENT_TYPE_OPTIONS = [
  { value: "fixed_payment", label: "Fixed Payment" },
  { value: "milestone_based", label: "Milestone Based" },
  // { value: "product_gifting", label: "Product Gifting" },
];

const PAYMENT_STRUCTURE_OPTIONS = [
  {
    value: PAYMENT_STRUCTURE_DUMMY_VALUE,
    label: "Select Payment Structure",
    description: "",
  },
  {
    value: "25 / 25 / 50",
    label: "25 / 25 / 50",
    description: "payments will be split in three parts",
  },
  {
    value: "50 / 50",
    label: "50 / 50",
    description: "payments will be split in two parts",
  },
  {
    value: "100% Advance",
    label: "100% Advance",
    description: "one time parts",
  },
  {
    value: "100% on Completion",
    label: "100% on Completion",
    description: "one time parts",
  },
];

const PROCESSOR_FEE_OPTIONS = [
  { value: "Brand", label: "Brand" },
  { value: "Influencer", label: "Influencer" },
  { value: "Split Between Both", label: "Split Between Both" },
];

const RESHOOT_OPTIONS = [
  { value: "No reshoot required", label: "No reshoot required" },
  { value: "Only if brief not followed", label: "Only if brief not followed" },
  { value: "One reshoot included", label: "One reshoot included" },
];

const RAW_FILE_OPTIONS = [
  { value: "Not included", label: "Not included" },
  { value: "Included", label: "Included" },
];

const SHIPPING_APPLICABLE_OPTIONS = [
  { value: "No", label: "No" },
  { value: "Yes", label: "Yes" },
];

const RETURNABLE_OPTIONS = [
  { value: "Gift / keep product", label: "Gift / keep product" },
  { value: "Returnable loaner", label: "Returnable loaner" },
];

const ATTRIBUTION_OPTIONS = [
  { value: "Credit Required", label: "Credit Required" },
  { value: "No Attribution Required", label: "No Attribution Required" },
];

const EDITING_RIGHTS_OPTIONS = [
  { value: "Cropping / Resizing Only", label: "Cropping / Resizing Only" },
  {
    value: "Brand May Create Cutdowns / Clips",
    label: "Brand May Create Cutdowns / Clips",
  },
  { value: "No Edits Without Approval", label: "No Edits Without Approval" },
];

const MUSIC_RESPONSIBILITY_OPTIONS = [
  { value: "Brand Responsible", label: "Brand Responsible" },
  { value: "Influencer Responsible", label: "Influencer Responsible" },
  { value: "Custom Arrangement", label: "Custom Arrangement" },
];

const MORALS_OPTIONS = [
  { value: "Not Included", label: "Not Included" },
  { value: "Included", label: "Included" },
];

const DISPUTE_OPTIONS = [
  { value: "State / Federal Courts", label: "State / Federal Courts" },
  { value: "AAA Arbitration", label: "AAA Arbitration" },
  { value: "Other", label: "Other" },
];

const ATTORNEYS_FEES_OPTIONS = [
  {
    value: "Prevailing Party Recovers Fees",
    label: "Prevailing Party Recovers Fees",
  },
  { value: "Each Party Bears Own Fees", label: "Each Party Bears Own Fees" },
  { value: "Other", label: "Other" },
];

const SIDEBAR_TOOLTIPS = {
  brandLegalName:
    "Full registered legal name of the brand signing this agreement.",
  brandContactPerson:
    "Primary brand contact responsible for campaign coordination and approvals.",
  brandNoticeEmail:
    "Official email for notices, updates, and legal communication.",
  brandNoticePhone: "Phone number for urgent campaign or contract communication.",
  brandBillingAddress:
    "Official billing address used for invoicing and records.",
  brandPoc: "",
  brandPocDesignation: "",
  campaignTitle:
    "Internal or external campaign Name used to identify this agreement.",
  campaignProductsServices: "Products or services covered by this contract.",
  campaignTerritory:
    "Territory where content will be distributed or targeted.",
  requestedEffectiveDate:
    "Date the agreement is intended to become effective.",
  timezone:
    "Timezone used for the requested effective date and scheduling references.",

  platformHandle:
    "Social platform and creator handle where the content will be posted.",
  qty: "Number of content units for this deliverable.",
  deliverableFormat: "Content format required for this deliverable.",
  draftDue: "Deadline for draft submission.",
  liveDate: "Date the deliverable must go live.",
  minimumVideoSpecs:
    "Format, duration, resolution, or aspect-ratio requirements.",
  mandatoryTags:
    "Required mentions, hashtags, affiliate links, tracking links, or promo codes.",
  preShootScriptRequired:
    "Whether brand approval is required before filming.",
  preShootScriptDue: "Deadline for script submission.",
  preShootReviewDays:
    "How many business days the brand gets to review the script.",

  includedRevisionRounds:
    "Number of revision rounds included without extra charge.",
  additionalRevisionFee: "Fee charged for each extra revision round.",
  reshootObligation: "When a reshoot is required.",
  reshootFee: "Fee applicable when a reshoot is requested.",
  minimumLivePeriod: "Minimum time the content must stay live.",

  totalCampaignFee: "Total compensation for the influencer.",
  influencerBudget: "Total budget for influencer",
  currency: "Currency in which compensation is denominated.",
  paymentStructure: "How payment is split across milestones or stages.",
  customSplit: "Custom breakdown of the payment structure.",
  advancePaymentTrigger: "Condition that triggers advance payment.",
  remainingPaymentTrigger: "Condition that triggers the remaining payment.",
  processorFeesBorneBy: "Who bears payment processing fees.",
  processorFeesNotes: "Extra notes about processor fee treatment.",
  laneAMarketplaceFeeNote:
    "Marketplace fee wording included in the agreement.",

  rawSourceFileDelivery: "Whether raw or source files must be delivered.",
  rawFilesFormat: "Expected format for delivered raw/source files.",
  rawFilesDeliveryDue: "Deadline to provide raw/source files.",
  analyticsReportingDeadline:
    "Deadline for providing analytics after publishing.",
  analyticsReportingItems:
    "Specific performance metrics or reports required.",

  productShippingApplicable:
    "Whether this campaign includes shipment of product.",
  productReturnable: "Whether products are gifted or must be returned.",
  shipToName: "Name to receive the shipment.",
  shipToPhone: "Phone number for shipping coordination.",
  shipToAddress: "Shipping destination for campaign products.",
  productReceiptConfirmationDeadline:
    "Deadline for acknowledging product receipt.",
  returnWindowMethod: "Return timeline and method.",
  riskOfLossNotes:
    "Notes about delivery risk, damage, or responsibility.",

  grantedUsageRights:
    "Ways the brand is allowed to use the creator's content.",
  usageDuration: "Duration of granted usage rights.",
  usageTerritoryNotes:
    "Territory or limitations for the selected usage right.",
  attributionRequirement:
    "Whether creator attribution is required when content is reused.",
  editingRights: "Editing rights granted to the brand.",
  attributionText: "Specific attribution wording, if required.",
  musicStockAssetResponsibility:
    "Who is responsible for music / stock asset clearance.",

  creativeBrief:
    "Mandatory talking points, claims, and content instructions.",
  restrictedStatements:
    "Statements or claims the creator must avoid.",
  competitorBlackout:
    "Competitor blackout or exclusivity terms.",
  categoryCompetitorList:
    "Competitors or categories restricted during blackout.",
  blackoutPeriod: "Time period for exclusivity / blackout.",
  optionalMoralsClause:
    "Whether a morals / reputation clause is included.",

  killFeeOrProrata:
    "Cancellation compensation or prorated payment rules.",
  refundOfUnearnedAdvance:
    "Whether unearned advance amounts must be refunded.",

  governingLaw: "Jurisdiction whose law governs this agreement.",
  disputeResolutionMethod:
    "Method used to resolve disputes.",
  disputeVenue: "Venue for court proceedings, if applicable.",
  arbitrationSeat: "Seat/location of arbitration, if applicable.",
  attorneysFees:
    "How attorneys' fees are allocated in a dispute.",
} as const;

function createRowId() {
  return Math.random().toString(36).slice(2);
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function getAtPath(obj: any, path: string, fallback: any = "") {
  const value = String(path)
    .split(".")
    .reduce((acc, key) => acc?.[key], obj);
  return value === undefined || value === null ? fallback : value;
}

function setAtPath<T extends Record<string, any>>(obj: T, path: string, value: any): T {
  const clone = deepClone(obj);
  const keys = String(path).split(".");
  let ref: any = clone;
  while (keys.length > 1) {
    const key = keys.shift()!;
    if (!ref[key] || typeof ref[key] !== "object") ref[key] = {};
    ref = ref[key];
  }
  ref[keys[0]] = value;
  return clone;
}

function mergeDeep<T>(base: T, patch: any): T {
  if (patch === undefined || patch === null) return base;
  if (Array.isArray(patch)) return patch as T;
  if (typeof patch !== "object") return patch as T;

  const output: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) };
  for (const [key, value] of Object.entries(patch)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      output[key] &&
      typeof output[key] === "object" &&
      !Array.isArray(output[key])
    ) {
      output[key] = mergeDeep(output[key], value);
    } else {
      output[key] = value;
    }
  }
  return output;
}

function normalizePaymentType(raw?: string | null): PaymentType {
  const v = String(raw || "").trim().toLowerCase();
  if (["fixed", "fixed_payment", "fixed-payment"].includes(v)) return PAYMENT_TYPE.FIXED;
  if (["milestone", "milestone_based", "milestone-based"].includes(v)) return PAYMENT_TYPE.MILESTONE;
  if (["gifting", "product_gifting", "product-gifting"].includes(v)) return PAYMENT_TYPE.GIFTING;
  return PAYMENT_TYPE.FIXED;
}

function normalizePreShootScriptRequired(raw: any): "" | "yes" | "no" {
  if (raw === true) return "yes";
  if (raw === false) return "no";

  const value = String(raw ?? "").trim().toLowerCase();
  if (["yes", "true", "1", "required"].includes(value)) return "yes";
  if (["no", "false", "0", "not required"].includes(value)) return "no";

  return "";
}

function normalizeNeedRevisionRounds(raw: any): "" | "yes" | "no" {
  if (raw === true) return "yes";
  if (raw === false) return "no";

  const value = String(raw ?? "").trim().toLowerCase();

  if (["yes", "true", "1", "required", "needed"].includes(value)) return "yes";
  if (["no", "false", "0", "not required", "not needed"].includes(value)) return "no";

  return "";
}

function createDefaultCommercialMilestone(index: number = 1): ContractMilestone {
  return {
    id: createRowId(),
    milestoneName: `Milestone ${index}`,
    milestoneDescription: "",
    paymentAmount: "",
    triggerEvent: "",
    dueDate: "",
  };
}

function defaultUsageRightsRows(): UsageRightsRow[] {
  return [
    {
      id: createRowId(),
      usageRight: "Organic repost on Brand-owned social channels",
      selected: false,
      duration: "",
      territoryNotes: "",
    },
    {
      id: createRowId(),
      usageRight: "Brand website / blog / PDP / retailer listing",
      selected: false,
      duration: "",
      territoryNotes: "",
    },
    {
      id: createRowId(),
      usageRight: "Email / CRM / deck / internal presentation use",
      selected: false,
      duration: "",
      territoryNotes: "",
    },
    {
      id: createRowId(),
      usageRight: "Paid social / boosting / ads",
      selected: false,
      duration: "",
      territoryNotes: "",
    },
    {
      id: createRowId(),
      usageRight: "Whitelisting / Spark Ads / dark posting / creator handle",
      selected: false,
      duration: "",
      territoryNotes: "",
    },
    {
      id: createRowId(),
      usageRight: "Perpetual rights / buyout / work-made-for-hire",
      selected: false,
      duration: "",
      territoryNotes: "",
    },
  ];
}

function createDefaultScheduleDeliverable(index: number = 1): ScheduleADeliverable {
  return {
    id: createRowId(),
    srNo: index,
    platform: "",
    handle: "",
    deliverableFormat: "",
    deliverableName: "",
    contentSpecification: "",
    aspectRatio: "",
    qty: "1",
    draftRequired: false,
    draftDue: "",
    liveDate: "",
    preShootScriptRequired: false,
    preShootScriptDue: "",
    preShootScriptReviewBusinessDays: "",
  };
}

function hasDeliverableInput(row?: ScheduleADeliverable | null) {
  if (!row) return false;

  return Boolean(
    String(row.deliverableName || "").trim() ||
    String(row.deliverableFormat || "").trim() ||
    String(row.contentSpecification || "").trim() ||
    String(row.aspectRatio || "").trim() ||
    String(row.platform || "").trim() ||
    String(row.handle || "").trim() ||
    Number(row.qty || "1") > 1 ||
    row.draftRequired ||
    String(row.draftDue || "").trim() ||
    String(row.liveDate || "").trim() ||
    row.preShootScriptRequired ||
    String(row.preShootScriptDue || "").trim()
  );
}

function getDeliverableMissingFields(row: ScheduleADeliverable) {
  const missing: string[] = [];
  const qtyNum = Number(row.qty || "");

  if (!String(row.deliverableFormat || row.deliverableName || "").trim()) {
    missing.push("delivery type");
  }

  if (!String(row.aspectRatio || "").trim()) {
    missing.push("aspect ratio");
  }

  if (!String(row.platform || "").trim()) {
    missing.push("platform");
  }

  if (!String(row.qty || "").trim() || Number.isNaN(qtyNum) || qtyNum < 1) {
    missing.push("quantity");
  }

  return missing;
}

function isDeliverableComplete(row: ScheduleADeliverable) {
  return getDeliverableMissingFields(row).length === 0;
}

function createBlankActiveDeliverable(index: number = 1): ScheduleADeliverable {
  return createDefaultScheduleDeliverable(index);
}

function createDefaultContractForm(): ContractFormState {
  return {
    brand: {
      legalName: "",
      contactPersonName: "",
      noticeEmail: "",
      noticePhone: "",
      billingAddress: "",
      brandPoc: "",
      brandPocDesignation: "",
    },
    influencer: {
      legalName: "",
      contactName: "",
      postingHandleUrl: "",
      contactEmail: "",
      contactPhone: "",
      whatsApp: "",
      address: "",
    },
    campaign: {
      productsServicesCovered: "",
      territoryTargetCountry: "Worldwide",
      effectiveDate: "",
      campaignTitleOrId: "",
      paymentType: PAYMENT_TYPE.FIXED,
    },
    scheduleA: {
      minimumVideoSpecs: "",
      preShootScriptRequired: "",
      preShootScriptDue: "",
      preShootScriptReviewBusinessDays: "",
      mandatoryTagsMentionsLinksCodes: "",
      review: {
        needRevisionRounds: "",
        includedRevisionRounds: "",
        additionalRevisionFee: "",
        reshootObligation: "",
        reshootFee: "",
        minimumLivePeriod: "",
      },
      commercial: {
        totalCampaignFee: "",
        currency: "USD",
        paymentStructure: "",
        customSplit: "",
        advancePaymentTrigger: "",
        remainingPaymentTrigger: "",
        paymentProcessorFeesBorneBy: "",
        paymentProcessorFeesNotes: "",
        laneAMarketplaceFeeNote: "",
        milestones: [createDefaultCommercialMilestone()],
        influencerBudget: ""
      },
      rawFiles: {
        rawSourceFileDelivery: "",
        deliveryDue: "",
        format: "",
        analyticsReportingDeadline: "",
        analyticsReportingItems: "",
      },
      shipping: {
        productShippingApplicable: "",
        shipToName: "",
        shipToAddress: "",
        shipToPhone: "",
        productReceiptConfirmationDeadline: "",
        productReturnable: "",
        returnWindowMethod: "",
        riskOfLossNotes: "",
      },
      usageRights: {
        rows: defaultUsageRightsRows(),
        attributionRequirement: "",
        attributionText: "",
        editingRights: "",
        musicStockAssetResponsibility:
          "",
      },
      compliance: {
        creativeBriefMandatoryTalkingPoints: "",
        restrictedStatements: "",
      },
      exclusivity: {
        competitorBlackout: "",
        categoryCompetitorList: "",
        blackoutPeriod: "",
        optionalMoralsClause: "",
      },
      cancellation: {
        killFeeOrProrata: "",
        refundOfUnearnedAdvance:
          "",
      },
      dispute: {
        governingLaw: "",
        disputeResolutionMethod: "",
        disputeVenue: "",
        arbitrationSeat: "",
        attorneysFees: "",
      },
    },
  };
}

function toInputDate(v?: string | Date | null) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function buildHandleUrl(platform?: string | null, handle?: string | null) {
  if (!handle) return null;
  const raw = handle.startsWith("@") ? handle.slice(1) : handle;
  switch ((platform || "").toLowerCase()) {
    case "instagram":
      return `https://instagram.com/${raw}`;
    case "tiktok":
      return `https://www.tiktok.com/@${raw}`;
    case "youtube":
    default:
      return `https://www.youtube.com/@${raw}`;
  }
}

function sanitizeHandle(h: string) {
  const t = (h || "").trim();
  if (!t) return t;
  return t.startsWith("@") ? t : `@${t}`;
}

function csvToTags(raw: string) {
  return String(raw || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function tagsToCsv(tags: string[]) {
  return tags.join(", ");
}

function isRejectedMeta(meta?: ContractMeta | null) {
  if (!meta) return false;
  const s = String(meta.status || "").toUpperCase();
  return (
    s === CONTRACT_STATUS.REJECTED ||
    (meta as any).isRejected === 1 ||
    meta.flags?.isRejected ||
    meta.statusFlags?.isRejected
  );
}

function toast(opts: {
  icon: "success" | "error" | "info";
  title: string;
  text?: string;
}) {
  return Swal.fire({
    ...opts,
    showConfirmButton: false,
    timer: 1800,
    timerProgressBar: true,
    background: "white",
    customClass: { popup: "rounded-lg border border-gray-200" },
  });
}
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function ContractCheckbox({
  checked,
  onCheckedChange,
  invalid = false,
  className,
  ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  invalid?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={(v) => onCheckedChange(v === true)}
      aria-invalid={invalid}
      aria-label={ariaLabel}
      className={cn(
        "bg-background border rounded-[4px] w-[20px] h-[20px] p-[4px] shrink-0",
        invalid
          ? "border-[color:var(--Errors-500,#E35141)]"
          : "border-[color:var(--Border-Primary,#B3B3B3)]",
        className,
      )}
    />
  );
}

function AccordionCard({
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "cg-accordion",
        open ? "cg-accordion--open" : "cg-accordion--closed"
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="cg-accordion-btn"
      >
        <div className="min-w-0 flex-1">
          <div className="cg-accordion-title">{title}</div>
          {subtitle ? <div className="cg-accordion-subtitle">{subtitle}</div> : null}
        </div>

        <span className="shrink-0 mt-[6px] text-neutral-900">
          {open ? <CaretUp size={20} /> : <CaretDown size={20} />}
        </span>
      </button>

      {open ? <div className="p-3 pt-0">{children}</div> : null}
    </div>
  );
}

export default function ContractSidebarExtracted({
  open,
  onClose,
  campaignId,
  brandId: brandIdProp = null,
  influencer = null,
  campaignTitle = "",
  campaignBudget = null,
  campaignTimeline = null,
  onSuccess,
  initialContract = null,
  forcedPaymentType,
  mode = "single",
  bulkInfluencers = [],
}: ContractSidebarExtractedProps) {
  const isBulkMode = mode === "bulk";
  const primaryInfluencer = isBulkMode ? bulkInfluencers?.[0] ?? null : influencer;
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureModalInitialTab, setSignatureModalInitialTab] =
    useState<"upload" | "manage">("upload");
  const [resolvedBrandId, setResolvedBrandId] = useState<string | null>(brandIdProp);
  const [currentContract, setCurrentContract] = useState<ContractMeta | null>(
    initialContract
  );
  const [requestedEffDate, setRequestedEffDate] = useState("");
  const [requestedEffTz, setRequestedEffTz] = useState(DEFAULT_TIMEZONE);
  const [inlineSignatureTab, setInlineSignatureTab] = useState<"default" | "draw">("default");
  const [inlineDrawnSig, setInlineDrawnSig] = useState("");
  const [inlineAgreed, setInlineAgreed] = useState(false);
  const [inlineShowError, setInlineShowError] = useState(false);
  const [contractForm, setContractForm] = useState<ContractFormState>(
    createDefaultContractForm()
  );
  const [activeBrandSignatureId, setActiveBrandSignatureId] = useState("");
  const [deliverables, setDeliverables] = useState<ScheduleADeliverable[]>([]);
  const [addedDeliverableCount, setAddedDeliverableCount] = useState(0);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [currencyOptions, setCurrencyOptions] = useState<CurrencyOption[]>([
    USD_CURRENCY_OPTION,
  ]);
  const [tzOptions, setTzOptions] = useState<TzOption[]>([]);
  const [contractLoading, setContractLoading] = useState(false);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [previewUrl, setPreviewUrl] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [signatureStatus, setSignatureStatus] = useState<
    "idle" | "checking" | "exists" | "missing"
  >("idle");
  console.log("resolvebrandId", resolvedBrandId)
  const [activeBrandSignatureSrc, setActiveBrandSignatureSrc] = useState("");

  const handleDownloadContract = useCallback(
    async (filename = "BrandxInfluencer_contract.pdf") => {
      try {
        setContractLoading(true);

        // 1. If preview already exists, download that directly
        if (previewBlob) {
          const url = URL.createObjectURL(previewBlob);

          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          link.remove();

          URL.revokeObjectURL(url);
          return;
        }

        // 2. Otherwise fetch saved/generated contract from backend
        const contractId = currentContract?.contractId;
        if (!contractId) {
          Swal.fire(
            "Info",
            "Generate a preview first or create the contract before downloading.",
            "info"
          );
          return;
        }

        const res = await api.post(
          "/contract/viewPdf",
          { contractId },
          { responseType: "blob" }
        );

        const blob = new Blob([res.data], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
      } catch (e: any) {
        Swal.fire(
          "Error",
          e?.response?.data?.message || e?.message || "Failed to download contract PDF.",
          "error"
        );
      } finally {
        setContractLoading(false);
      }
    },
    [previewBlob, currentContract?.contractId]
  );

  const resolveBrandSignature = useCallback(async (): Promise<{
    signatureData: string;
    signatureId: string;
  }> => {
    if (!resolvedBrandId) {
      setSignatureStatus("missing");
      setActiveBrandSignatureSrc("");
      setActiveBrandSignatureId("");
      return { signatureData: "", signatureId: "" };
    }

    try {
      const primarySignature = await apiGetPrimaryBrandSignature(resolvedBrandId);

      if (primarySignature?.signature) {
        setSignatureStatus("exists");
        setActiveBrandSignatureSrc(primarySignature.signature);
        setActiveBrandSignatureId(primarySignature._id || "");

        return {
          signatureData: primarySignature.signature,
          signatureId: primarySignature._id || "",
        };
      }
    } catch {
      // Primary signature not found, fallback to active signatures list.
    }

    try {
      const result = await apiListBrandSignatures(resolvedBrandId);
      const rows = Array.isArray(result.signatures) ? result.signatures : [];

      const fallbackSignature =
        rows.find((item) => item.isPrimary) || rows[0] || null;

      if (fallbackSignature?.signature) {
        setSignatureStatus("exists");
        setActiveBrandSignatureSrc(fallbackSignature.signature);
        setActiveBrandSignatureId(fallbackSignature._id || "");

        // Auto-fix old data where signature exists but isPrimary is false.
        if (!fallbackSignature.isPrimary && fallbackSignature._id) {
          apiSetPrimaryBrandSignature(resolvedBrandId, fallbackSignature._id).catch(
            () => undefined
          );
        }

        return {
          signatureData: fallbackSignature.signature,
          signatureId: fallbackSignature._id || "",
        };
      }

      setSignatureStatus("missing");
      setActiveBrandSignatureSrc("");
      setActiveBrandSignatureId("");

      return { signatureData: "", signatureId: "" };
    } catch {
      setSignatureStatus("missing");
      setActiveBrandSignatureSrc("");
      setActiveBrandSignatureId("");

      return { signatureData: "", signatureId: "" };
    }
  }, [resolvedBrandId]);

  useEffect(() => {
    if (!open || !resolvedBrandId) {
      setSignatureStatus("idle");
      setActiveBrandSignatureSrc("");
      setActiveBrandSignatureId("");
      return;
    }

    let mounted = true;

    (async () => {
      setSignatureStatus("checking");

      const result = await resolveBrandSignature();

      if (!mounted) return;

      if (result.signatureData) {
        setSignatureStatus("exists");
      } else {
        setSignatureStatus("missing");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, resolvedBrandId, resolveBrandSignature]);

  useEffect(() => {
    if (!open) return;

    setInlineSignatureTab("default");
    setInlineDrawnSig("");
    setInlineAgreed(false);
    setInlineShowError(false);
  }, [open]);


  useEffect(() => {
    if (brandIdProp) {
      setResolvedBrandId(brandIdProp);
      return;
    }

    if (typeof window !== "undefined") {
      const storedBrandId = localStorage.getItem("brandId");
      setResolvedBrandId(storedBrandId || null);
    }
  }, [brandIdProp, open]);

  const isPreShootScriptRequired =
    getAtPath(contractForm, "scheduleA.preShootScriptRequired", "") === "yes";
  const activePaymentType = useMemo(
    () => normalizePaymentType(contractForm.campaign.paymentType),
    [contractForm.campaign.paymentType]
  );

  const clearPreview = useCallback(() => {
    setPreviewBlob(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
  }, []);

  const setContractField = useCallback((path: string, value: any) => {
    setContractForm((prev) => setAtPath(prev, path, value));
  }, []);
  const preShootScriptRequiredValue = getAtPath(
    contractForm,
    "scheduleA.preShootScriptRequired",
    ""
  );
  const prefillFormFor = useCallback(
    (inf: any, meta?: ContractMeta | null) => {
      const base = createDefaultContractForm();

      if (typeof window !== "undefined") {
        base.brand.legalName = localStorage.getItem("brandName") || "";
        const storedBrandPoc =
          localStorage.getItem("brandPOC") ||
          localStorage.getItem("brandContactName") ||
          localStorage.getItem("brandName") ||
          "";
        base.brand.contactPersonName = storedBrandPoc;
        base.brand.noticeEmail = localStorage.getItem("brandEmail") || "";
        base.brand.noticePhone = localStorage.getItem("brandPhone") || "";
        base.brand.billingAddress = localStorage.getItem("brandAddress") || "";
        base.brand.brandPoc = storedBrandPoc;
        base.brand.brandPocDesignation = localStorage.getItem("brandPOCDesignation") || "";
      }

      base.influencer.legalName = inf?.name || "";
      base.influencer.contactName = inf?.name || "";
      base.influencer.postingHandleUrl =
        buildHandleUrl(inf?.primaryPlatform, inf?.handle) || "";
      base.influencer.contactEmail = inf?.email || "";
      base.influencer.contactPhone = inf?.phone || "";
      base.influencer.whatsApp = inf?.whatsapp || "";
      base.influencer.address = inf?.address || "";

      base.campaign.campaignTitleOrId = campaignTitle || "";
      base.campaign.productsServicesCovered = inf?.productOrServiceName || "";
      base.campaign.territoryTargetCountry = "Worldwide";
      base.campaign.effectiveDate = toInputDate(new Date());

      // Do not prefill Influencer fees from campaignBudget or influencer API data.
      // Keep it empty until the brand enters it manually in the form.

      if (campaignTimeline?.startDate) {
        const start = toInputDate(campaignTimeline.startDate);
        if (start) {
          base.campaign.effectiveDate = start;
          setRequestedEffDate(start);
        }
      } else {
        setRequestedEffDate(base.campaign.effectiveDate);
      }

      if (meta?.requestedEffectiveDate) {
        setRequestedEffDate(toInputDate(meta.requestedEffectiveDate));
      }
      if (meta?.requestedEffectiveDateTimezone) {
        setRequestedEffTz(meta.requestedEffectiveDateTimezone || DEFAULT_TIMEZONE);
      } else {
        setRequestedEffTz(DEFAULT_TIMEZONE);
      }

      const seededDeliverable = createBlankActiveDeliverable(1);

      const initialPaymentType = normalizePaymentType(
        forcedPaymentType || meta?.content?.campaign?.paymentType || base.campaign.paymentType
      );
      base.campaign.paymentType = initialPaymentType;

      const merged = mergeDeep(base, meta?.content || {});
      merged.brand.brandPoc = merged.brand.brandPoc || merged.brand.contactPersonName || "";
      merged.brand.contactPersonName = merged.brand.contactPersonName || merged.brand.brandPoc || "";
      merged.campaign.paymentType = initialPaymentType;
      merged.scheduleA.preShootScriptRequired = normalizePreShootScriptRequired(
        merged.scheduleA.preShootScriptRequired
      );
      const contractCommercial = meta?.content?.scheduleA?.commercial;
      const savedInfluencerFee =
        contractCommercial?.influencerBudget !== undefined &&
          contractCommercial?.influencerBudget !== null &&
          String(contractCommercial.influencerBudget).trim() !== ""
          ? String(contractCommercial.influencerBudget)
          : contractCommercial?.totalCampaignFee !== undefined &&
            contractCommercial?.totalCampaignFee !== null &&
            String(contractCommercial.totalCampaignFee).trim() !== ""
            ? String(contractCommercial.totalCampaignFee)
            : "";

      // Only prefill Influencer fees from saved getContract content.
      // Do not prefill it from campaignBudget or influencer profile fee data.
      merged.scheduleA.commercial.influencerBudget = savedInfluencerFee;
      merged.scheduleA.commercial.totalCampaignFee = savedInfluencerFee;
      merged.scheduleA.commercial.currency = "USD";

      const revisionFromMeta = meta?.content?.scheduleA?.review || {};
      const normalizedNeedRevisionRounds = normalizeNeedRevisionRounds(
        revisionFromMeta.needRevisionRounds
      );

      const derivedNeedRevisionRounds =
        Number(revisionFromMeta.includedRevisionRounds || 0) > 0 ||
        Boolean(String(revisionFromMeta.additionalRevisionFee || "").trim());

      const hasRevisionContent =
        Boolean(meta?.content?.scheduleA?.review) ||
        Boolean(String(merged.scheduleA.review.needRevisionRounds || "").trim()) ||
        Boolean(String(merged.scheduleA.review.includedRevisionRounds || "").trim()) ||
        Boolean(String(merged.scheduleA.review.additionalRevisionFee || "").trim());

      merged.scheduleA.review.needRevisionRounds =
        normalizedNeedRevisionRounds ||
        (derivedNeedRevisionRounds ? "yes" : hasRevisionContent ? "no" : "");

      if (merged.scheduleA.review.needRevisionRounds === "yes") {
        merged.scheduleA.review.includedRevisionRounds =
          String(merged.scheduleA.review.includedRevisionRounds || "1");
        merged.scheduleA.review.additionalRevisionFee =
          String(merged.scheduleA.review.additionalRevisionFee || "");
      } else {
        merged.scheduleA.review.includedRevisionRounds = "";
        merged.scheduleA.review.additionalRevisionFee = "";
      }

      const rawMilestones =
        meta?.content?.scheduleA?.commercial?.milestones ||
        merged?.scheduleA?.commercial?.milestones ||
        [];

      merged.scheduleA.commercial.milestones =
        Array.isArray(rawMilestones) && rawMilestones.length
          ? rawMilestones.map((row: any, index: number) => ({
            id: createRowId(),
            milestoneName: String(row?.milestoneName || `Milestone ${index + 1}`),
            milestoneDescription: String(row?.milestoneDescription || ""),
            paymentAmount: String(row?.paymentAmount || ""),
            triggerEvent: String(row?.triggerEvent || ""),
            dueDate: String(row?.dueDate || ""),
          }))
          : initialPaymentType === PAYMENT_TYPE.MILESTONE
            ? [createDefaultCommercialMilestone()]
            : [];

      const usageRows = meta?.content?.scheduleA?.usageRights?.rows;
      const deliverablesFromMeta = meta?.content?.scheduleA?.deliverables;

      if (Array.isArray(usageRows) && usageRows.length) {
        merged.scheduleA.usageRights.rows = usageRows.map((row: any) => ({
          id: createRowId(),
          usageRight: String(row?.usageRight || ""),
          selected: Boolean(row?.selected),
          duration: String(row?.duration || ""),
          territoryNotes: String(row?.territoryNotes || ""),
        }));
      }

      const mappedDeliverables =
        Array.isArray(deliverablesFromMeta) && deliverablesFromMeta.length
          ? deliverablesFromMeta.map((row: any, index: number) => ({
            id: createRowId(),
            srNo: Number(row?.srNo ?? index + 1),
            platform: String(row?.platform || ""),
            handle: String(row?.handle || row?.platformHandle || ""),
            deliverableFormat: String(row?.deliverableFormat || row?.deliverableName || ""),
            deliverableName: String(row?.deliverableName || row?.deliverableFormat || ""),
            contentSpecification: String(
              row?.contentSpecification ||
              (deliverablesFromMeta.length === 1 ? meta?.content?.scheduleA?.minimumVideoSpecs || "" : "")
            ),
            aspectRatio: String(row?.aspectRatio || ""),
            qty: String(row?.qty ?? "1"),
            draftRequired: Boolean(row?.draftRequired ?? false),
            draftDue: String(row?.draftDue || ""),
            liveDate: String(row?.liveDate || ""),
            preShootScriptRequired: Boolean(
              row?.preShootScriptRequired ??
              (deliverablesFromMeta.length === 1 ? meta?.content?.scheduleA?.preShootScriptRequired : false)
            ),
            preShootScriptDue: String(
              row?.preShootScriptDue ||
              (deliverablesFromMeta.length === 1 ? meta?.content?.scheduleA?.preShootScriptDue || "" : "")
            ),
            preShootScriptReviewBusinessDays: String(
              row?.preShootScriptReviewBusinessDays ||
              meta?.content?.scheduleA?.preShootScriptReviewBusinessDays ||
              ""
            ),
          }))
          : [];

      setAddedDeliverableCount(mappedDeliverables.length);
      setDeliverables(
        mappedDeliverables.length
          ? [
            ...mappedDeliverables,
            createBlankActiveDeliverable(mappedDeliverables.length + 1),
          ]
          : [seededDeliverable]
      );

      setContractForm(merged);
      setFormErrors({});
      clearPreview();
    },
    [campaignBudget, campaignTitle, campaignTimeline, clearPreview, forcedPaymentType]
  );

  useEffect(() => {
    if (!open || !resolvedBrandId || !campaignId) return;

    if (isBulkMode) {
      if (!primaryInfluencer) return;
      setCurrentContract(null);
      prefillFormFor(primaryInfluencer, null);
      setContractLoading(false);
      return;
    }

    if (!primaryInfluencer?.influencerId) return;

    let mounted = true;

    (async () => {
      if (initialContract !== undefined) {
        setCurrentContract(initialContract || null);
        prefillFormFor(primaryInfluencer, initialContract || null);
        setContractLoading(false);
        return;
      }

      setContractLoading(true);
      try {
        const res: any = await post("/contract/getContract", {
          brandId: resolvedBrandId,
          influencerId: primaryInfluencer.influencerId,
          campaignId,
        });

        const list = res?.contracts || res?.data?.contracts || [];
        const filtered = (list as ContractMeta[]).filter(
          (c) => String(c.campaignId) === String(campaignId)
        );
        const meta = filtered.length ? filtered[0] : list.length ? list[0] : null;

        if (!mounted) return;
        setCurrentContract(meta || null);
        prefillFormFor(primaryInfluencer, meta || null);
      } catch {
        if (!mounted) return;
        setCurrentContract(null);
        prefillFormFor(primaryInfluencer, null);
      } finally {
        if (mounted) setContractLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [
    open,
    resolvedBrandId,
    campaignId,
    primaryInfluencer,
    prefillFormFor,
    initialContract,
    isBulkMode,
  ]);

  useEffect(() => {
    if (!open) return;

    let mounted = true;

    setCurrencyOptions([USD_CURRENCY_OPTION]);
    setContractField("scheduleA.commercial.currency", "USD");

    (async () => {
      try {
        const tzRes: any = await api.get("/contract/timezones");
        const tzArr: any[] =
          tzRes?.data?.timezones || tzRes?.timezones || tzRes || [];

        const zones = Array.from(
          new Map(
            tzArr.map((t: any, index: number) => {
              const canonical =
                typeof t?.value === "string" && t.value.trim()
                  ? t.value.trim()
                  : Array.isArray(t?.utc) && t.utc.length
                    ? String(t.utc[0]).trim()
                    : `timezone-${index}`;

              return [
                canonical,
                {
                  value: canonical,
                  label: t?.text || canonical,
                  meta: t,
                },
              ];
            })
          ).values()
        ) as TzOption[];

        if (!mounted) return;
        setTzOptions(zones);
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, setContractField]);
  useEffect(() => {
    if (!open) return;
    clearPreview();
  }, [contractForm, deliverables, requestedEffDate, requestedEffTz, open, clearPreview]);

  const buildContentPayload = useCallback((signatureId: string = "") => {
    const content = deepClone(contractForm);
    const paymentType = activePaymentType;
    const influencerFee =
      paymentType === PAYMENT_TYPE.GIFTING
        ? 0
        : Number(
          content.scheduleA.commercial.influencerBudget ||
          content.scheduleA.commercial.totalCampaignFee ||
          "0"
        ) || 0;

    const paymentStructure =
      content.scheduleA.commercial.paymentStructure === PAYMENT_STRUCTURE_DUMMY_VALUE
        ? ""
        : content.scheduleA.commercial.paymentStructure;

    const needRevisionRounds =
      content.scheduleA.review.needRevisionRounds === REVISION_ROUNDS_DUMMY_VALUE
        ? ""
        : content.scheduleA.review.needRevisionRounds;

    const minimumLivePeriod =
      content.scheduleA.review.minimumLivePeriod === MINIMUM_LIVE_PERIOD_DUMMY_VALUE
        ? ""
        : content.scheduleA.review.minimumLivePeriod;

    content.campaign.paymentType = paymentType;

    const deliverablesForPayload = deliverables.filter(
      (row, index) => index < addedDeliverableCount || hasDeliverableInput(row)
    );

    const deliverablePayload = deliverablesForPayload.map((row, index) => ({
      srNo: index + 1,
      platform: row.platform,
      handle: row.handle,
      handles: row.handle ? [row.handle] : [],
      platformHandle: [row.platform, row.handle].filter(Boolean).join(" / "),
      deliverableFormat: row.deliverableFormat,
      deliverableName: row.deliverableName || row.deliverableFormat,
      contentSpecification: row.contentSpecification,
      aspectRatio: row.aspectRatio,
      qty: Number(row.qty || "1") || 1,
      draftRequired: row.draftRequired,
      draftDue: row.draftRequired ? row.draftDue : "",
      liveDate: row.liveDate,
      preShootScriptRequired: Boolean(row.preShootScriptRequired),
      preShootScriptDue: row.preShootScriptRequired ? row.preShootScriptDue : "",
      preShootScriptReviewBusinessDays:
        Number(row.preShootScriptReviewBusinessDays || ""),
    }));

    const firstPreShootDeliverable = deliverablePayload.find(
      (row) => row.preShootScriptRequired
    );

    const contentSpecificationText = deliverablePayload
      .map((row, index) =>
        row.contentSpecification
          ? `Deliverable ${index + 1}: ${row.contentSpecification}`
          : ""
      )
      .filter(Boolean)
      .join("\n\n");

    return {
      ...content,
      brand: {
        ...content.brand,
        contactPersonName: content.brand.contactPersonName || content.brand.brandPoc || "",
        brandPoc: content.brand.brandPoc || content.brand.contactPersonName || "",
        // Backend uses signatureBrand for the actual base64 image.
        // This content field is only a reference to the saved BrandSignature row.
        brandSignature: signatureId || activeBrandSignatureId || "",
      },
      campaign: {
        ...content.campaign,
        paymentType,
        effectiveDate: requestedEffDate || content.campaign.effectiveDate || "",
      },
      scheduleA: {
        ...content.scheduleA,
        minimumVideoSpecs: contentSpecificationText,
        preShootScriptRequired: Boolean(firstPreShootDeliverable),
        preShootScriptDue: firstPreShootDeliverable?.preShootScriptDue || "",
        preShootScriptReviewBusinessDays:
          Number(firstPreShootDeliverable?.preShootScriptReviewBusinessDays || "") || 0,
        deliverables: deliverablePayload,
        review: {
          ...content.scheduleA.review,
          needRevisionRounds,
          minimumLivePeriod,
          includedRevisionRounds:
            needRevisionRounds === "yes"
              ? Number(content.scheduleA.review.includedRevisionRounds || "1") || 1
              : 0,
          additionalRevisionFee:
            needRevisionRounds === "yes"
              ? String(content.scheduleA.review.additionalRevisionFee || "")
              : "",
        },
        commercial: {
          ...content.scheduleA.commercial,
          paymentStructure,
          totalCampaignFee: influencerFee,
          influencerBudget: influencerFee,
          currency: "USD",
          milestones:
            paymentType === PAYMENT_TYPE.MILESTONE
              ? content.scheduleA.commercial.milestones.map((row) => ({
                milestoneName: row.milestoneName,
                milestoneDescription: row.milestoneDescription,
                paymentAmount: Number(row.paymentAmount || "0") || 0,
                triggerEvent: row.triggerEvent,
                dueDate: row.dueDate,
              }))
              : [],
        },
        usageRights: {
          ...content.scheduleA.usageRights,
          rows: content.scheduleA.usageRights.rows.map((row) => ({
            usageRight: row.usageRight,
            selected: row.selected,
            duration: row.duration,
            territoryNotes: row.territoryNotes,
          })),
        },
      },
    };
  }, [
    contractForm,
    deliverables,
    addedDeliverableCount,
    requestedEffDate,
    activePaymentType,
    activeBrandSignatureId,
  ]);

  const buildBrandUpdatesPayload = useCallback((signatureId: string = "") => {
    return {
      content: buildContentPayload(signatureId),
    };
  }, [buildContentPayload]);

  const buildBulkContentPayload = useCallback((signatureId: string = "") => {
    const content = buildContentPayload(signatureId);

    return {
      ...content,
      influencer: {},
      scheduleA: {
        ...content.scheduleA,
        deliverables: content.scheduleA.deliverables.map((row: any) => ({
          ...row,
          platformHandle: "",
        })),
      },
    };
  }, [buildContentPayload]);

  const validateForPreview = useCallback(() => {
    const nextErrors: Record<string, string> = {};
    const add = (key: string, message: string) => {
      nextErrors[key] = message;
    };

    const influencerFeeRaw = String(
      contractForm.scheduleA.commercial.influencerBudget ?? ""
    );
    const influencerFeeValue = Number(influencerFeeRaw);
    const revisionRaw = String(
      contractForm.scheduleA.review.includedRevisionRounds ?? ""
    );
    const revisionValue = Number(revisionRaw);
    const needRevisionRounds =
      contractForm.scheduleA.review.needRevisionRounds === "yes";
    const revisionFeeRaw = String(
      contractForm.scheduleA.review.additionalRevisionFee ?? ""
    );
    const revisionFeeValue = Number(revisionFeeRaw);
    const reviewDaysRaw = String(
      contractForm.scheduleA.preShootScriptReviewBusinessDays ?? ""
    );
    const reviewDays = Number(reviewDaysRaw);

    if (!String(contractForm.brand.legalName ?? "").trim()) {
      add("brand.legalName", "Brand legal name is required.");
    }
    if (!String(contractForm.brand.brandPoc || contractForm.brand.contactPersonName || "").trim()) {
      add("brand.brandPoc", "Brand POC is required.");
    }
    if (!String(contractForm.campaign.productsServicesCovered ?? "").trim()) {
      add("campaign.productsServicesCovered", "Product / Services Covered is required.");
    }
    if (!String(contractForm.influencer.legalName ?? "").trim()) {
      add("influencer.legalName", "Influencer legal name is required.");
    }
    if (!String(contractForm.campaign.campaignTitleOrId ?? "").trim()) {
      add("campaign.campaignTitleOrId", "Campaign Name is required.");
    }
    if (!contractForm.scheduleA.commercial.currency) {
      add("scheduleA.commercial.currency", "Currency is required.");
    }
    if (!contractForm.campaign.paymentType) {
      add("campaign.paymentType", "Payment type is required.");
    }

    if (!String(contractForm.scheduleA.dispute.disputeResolutionMethod ?? "").trim()) {
      add(
        "scheduleA.dispute.disputeResolutionMethod",
        "Dispute resolution method is required."
      );
    }

    if (activePaymentType !== PAYMENT_TYPE.GIFTING) {
      if (
        !influencerFeeRaw.trim() ||
        Number.isNaN(influencerFeeValue) ||
        influencerFeeValue < 0
      ) {
        add(
          "scheduleA.commercial.influencerBudget",
          "Enter a valid non-negative influencer fee."
        );
      }
    }

    if (activePaymentType === PAYMENT_TYPE.MILESTONE) {
      const milestones = contractForm.scheduleA.commercial.milestones || [];
      if (!milestones.length) {
        add("scheduleA.commercial.milestones", "Add at least one milestone.");
      } else {
        const messages: string[] = [];
        milestones.forEach((row, index) => {
          const label = `Milestone #${index + 1}`;
          if (!row.milestoneName.trim()) messages.push(`${label}: name is required.`);
          if (!row.paymentAmount.trim()) messages.push(`${label}: amount is required.`);
          if (!row.triggerEvent.trim()) messages.push(`${label}: trigger event is required.`);
          if (!row.dueDate.trim()) messages.push(`${label}: due date is required.`);
        });
        if (messages.length) {
          add("scheduleA.commercial.milestones", messages.join(" "));
        }
      }
    }

    if (needRevisionRounds) {
      if (
        !String(contractForm.scheduleA.review.includedRevisionRounds ?? "").trim() ||
        Number.isNaN(revisionValue) ||
        revisionValue < 1
      ) {
        add(
          "scheduleA.review.includedRevisionRounds",
          "Revision count must be at least 1."
        );
      }

      if (
        !revisionFeeRaw.trim() ||
        Number.isNaN(revisionFeeValue) ||
        revisionFeeValue < 0
      ) {
        add(
          "scheduleA.review.additionalRevisionFee",
          "Revision fees must be 0 or greater."
        );
      }
    }

    if (Number.isNaN(reviewDays) || reviewDays < 0) {
      add(
        "scheduleA.preShootScriptReviewBusinessDays",
        "Review business days must be zero or more."
      );
    }

    if (!requestedEffDate) {
      add("requestedEffDate", "Requested effective date is required.");
    }

    const deliverablesForValidation = deliverables.filter(
      (row, index) => index < addedDeliverableCount || hasDeliverableInput(row)
    );

    if (!deliverablesForValidation.length) {
      add("scheduleA.deliverables", "Add at least one deliverable.");
    } else {
      const messages: string[] = [];

      deliverablesForValidation.forEach((row, index) => {
        const missing = getDeliverableMissingFields(row);
        if (missing.length) {
          messages.push(`Deliverable #${index + 1}: ${missing.join(", ")} required.`);
        }
      });

      if (messages.length) {
        add("scheduleA.deliverables", messages.join(" "));
      }
    }

    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      toast({ icon: "error", title: "Please fix the highlighted fields" });
      return false;
    }

    return true;
  }, [activePaymentType, addedDeliverableCount, contractForm, deliverables, requestedEffDate]);


  const handleOpenPreviewInNewTab = useCallback(() => {
    if (!previewUrl) {
      toast({
        icon: "info",
        title: "Preview required",
        text: "Generate preview first to open the PDF in a new tab.",
      });
      return;
    }

    window.open(previewUrl, "_blank", "noopener,noreferrer");
  }, [previewUrl]);

  const handleGeneratePreview = useCallback(async () => {
    if (!resolvedBrandId || !campaignId) return;
    if (!validateForPreview()) return;

    setIsPreviewLoading(true);

    try {
      let res: any;

      if (isBulkMode) {
        const sampleInfluencer = bulkInfluencers?.[0];
        if (!sampleInfluencer?.influencerId) {
          toast({
            icon: "error",
            title: "No influencer selected",
            text: "Please select at least one influencer.",
          });
          return;
        }

        res = await api.post(
          "/contract/initiate",
          {
            brandId: resolvedBrandId,
            campaignId,
            influencerId: sampleInfluencer.influencerId,
            content: buildBulkContentPayload(),
            requestedEffectiveDate: requestedEffDate,
            requestedEffectiveDateTimezone: requestedEffTz,
            preview: true,
          },
          { responseType: "blob" }
        );
      } else if (!currentContract?.contractId) {
        res = await api.post(
          "/contract/initiate",
          {
            brandId: resolvedBrandId,
            campaignId,
            influencerId: primaryInfluencer.influencerId,
            content: buildContentPayload(),
            requestedEffectiveDate: requestedEffDate,
            requestedEffectiveDateTimezone: requestedEffTz,
            preview: true,
          },
          { responseType: "blob" }
        );
      } else if (isRejectedMeta(currentContract)) {
        res = await api.post(
          "/contract/resend",
          {
            contractId: currentContract.contractId,
            content: buildContentPayload(),
            requestedEffectiveDate: requestedEffDate,
            requestedEffectiveDateTimezone: requestedEffTz,
            preview: true,
          },
          { responseType: "blob" }
        );
      } else {
        res = await api.post(
          "/contract/brand/update",
          {
            contractId: currentContract._id || "",
            brandId: resolvedBrandId,
            preview: true,
            brandUpdates: buildBrandUpdatesPayload(),
            requestedEffectiveDate: requestedEffDate,
            requestedEffectiveDateTimezone: requestedEffTz,
          },
          { responseType: "blob" }
        );
      }

      const blob =
        res?.data instanceof Blob
          ? res.data
          : new Blob([res.data], { type: "application/pdf" });

      const contentType =
        res?.headers?.["content-type"] || res?.headers?.["Content-Type"] || blob.type;

      console.log("Preview response content-type:", contentType);
      console.log("Preview blob type:", blob.type);
      console.log("Preview blob size:", blob.size);

      if (!contentType?.includes("pdf") && blob.type && !blob.type.includes("pdf")) {
        let serverMessage = "Server did not return a PDF preview.";

        try {
          const text = await blob.text();
          console.error("Non-PDF preview response:", text);
          serverMessage = text || serverMessage;
        } catch (readErr) {
          console.error("Could not read non-PDF blob:", readErr);
        }

        throw new Error(serverMessage);
      }

      setPreviewBlob(blob);

      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });

      toast({
        icon: "success",
        title: "Preview ready",
        text: isBulkMode ? "Sample preview generated for bulk contract." : undefined,
      });
    } catch (e: any) {
      console.error("Preview generation failed:", e);

      let errorText =
        e?.response?.data?.message ||
        e?.message ||
        "Could not generate preview.";

      if (e?.response?.data instanceof Blob) {
        try {
          const blobText = await e.response.data.text();
          errorText = blobText || errorText;
          console.error("Preview error blob text:", blobText);
        } catch (blobErr) {
          console.error("Could not parse error blob:", blobErr);
        }
      }

      toast({
        icon: "error",
        title: "Preview failed",
        text: errorText,
      });
    } finally {
      setIsPreviewLoading(false);
    }
  }, [
    resolvedBrandId,
    campaignId,
    validateForPreview,
    isBulkMode,
    bulkInfluencers,
    buildBulkContentPayload,
    currentContract,
    primaryInfluencer,
    buildContentPayload,
    requestedEffDate,
    requestedEffTz,
    buildBrandUpdatesPayload,
  ]);

  const handleActualSubmit = useCallback(async (signatureBrand?: string, signatureId?: string) => {
    if (!resolvedBrandId || !campaignId) return;

    const cleanSignatureBrand = String(signatureBrand || "").trim();
    if (!cleanSignatureBrand) {
      toast({
        icon: "error",
        title: "Signature required",
        text: "Please upload or select a valid brand signature before sending.",
      });
      return;
    }

    setIsSubmitLoading(true);
    try {
      const contentWithSig = buildContentPayload(signatureId || "");

      if (isBulkMode) {
        const influencerIds = (bulkInfluencers || [])
          .map((item) => item?.influencerId)
          .filter(Boolean);

        if (!influencerIds.length) {
          toast({
            icon: "error",
            title: "No influencer selected",
            text: "Please select at least one influencer.",
          });
          return;
        }

        const res: any = await post("/contract/initiate-bulk", {
          brandId: resolvedBrandId,
          campaignId,
          influencerIds,
          content: buildBulkContentPayload(signatureId || ""),
          requestedEffectiveDate: requestedEffDate,
          requestedEffectiveDateTimezone: requestedEffTz,
          signatureBrand: cleanSignatureBrand,
          signatureId: signatureId || "",
        });

        const sentCount = res?.sentCount || res?.data?.sentCount || influencerIds.length;
        const failed = res?.failed || res?.data?.failed || [];
        toast({
          icon: failed.length ? "info" : "success",
          title: `${sentCount} contract${sentCount > 1 ? "s" : ""} sent`,
          text: failed.length ? `${failed.length} failed.` : "Bulk contract send completed.",
        });
      } else if (!currentContract?.contractId) {
        await post("/contract/initiate", {
          brandId: resolvedBrandId,
          campaignId,
          influencerId: primaryInfluencer.influencerId,
          content: contentWithSig,
          requestedEffectiveDate: requestedEffDate,
          requestedEffectiveDateTimezone: requestedEffTz,
          signatureBrand: cleanSignatureBrand,
          signatureId: signatureId || "",
        });

        toast({
          icon: "success",
          title: "Sent",
          text: "Contract created and shared.",
        });
      } else if (isRejectedMeta(currentContract)) {
        await post("/contract/resend", {
          contractId: currentContract.contractId,
          content: buildContentPayload(signatureId || ""),
          requestedEffectiveDate: requestedEffDate,
          requestedEffectiveDateTimezone: requestedEffTz,
          signatureBrand: cleanSignatureBrand,
          signatureId: signatureId || "",
        });

        toast({
          icon: "success",
          title: "Resent",
          text: "Contract resent successfully.",
        });
      } else {
        await post("/contract/brand/update", {
          contractId: currentContract._id || "",
          brandId: resolvedBrandId,
          type: 0,
          brandUpdates: buildBrandUpdatesPayload(signatureId || ""),
          signatureBrand: cleanSignatureBrand,
          signatureId: signatureId || "",
        });

        toast({
          icon: "success",
          title: "Updated",
          text: "Contract updated and shared.",
        });
      }

      await onSuccess?.();
      onClose();
    } catch (e: any) {
      toast({
        icon: "error",
        title: "Action failed",
        text: e?.response?.data?.message || e?.message || "Failed to process contract.",
      });
    } finally {
      setIsSubmitLoading(false);
    }
  }, [
    resolvedBrandId,
    campaignId,
    isBulkMode,
    bulkInfluencers,
    buildBulkContentPayload,
    requestedEffDate,
    requestedEffTz,
    currentContract,
    primaryInfluencer,
    buildContentPayload,
    buildBrandUpdatesPayload,
    onSuccess,
    onClose,
  ]);

  const getLatestBrandSignature = useCallback(async (): Promise<{
    signatureData: string;
    signatureId: string;
  }> => {
    return resolveBrandSignature();
  }, [resolveBrandSignature]);

  const openBrandSignatureModal = useCallback((tab: "upload" | "manage" = "upload") => {
    setSignatureModalInitialTab(tab);
    setShowSignatureModal(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!resolvedBrandId || !campaignId) return;

    if (!previewUrl) {
      toast({ icon: "info", title: "Preview required", text: "Generate preview before proceeding." });
      return;
    }

    if (!validateForPreview()) return;

    const { signatureData, signatureId } = await getLatestBrandSignature();

    if (signatureData) {
      // Signature exists — require inline agreement
      if (!inlineAgreed) {
        setInlineShowError(true);
        // Scroll to signature section
        document.getElementById("signature-section")?.scrollIntoView({ behavior: "smooth" });
        return;
      }
      await handleActualSubmit(signatureData, signatureId);
      return;
    }

    // No signature — open upload tab
    openBrandSignatureModal("upload");
  }, [
    resolvedBrandId,
    campaignId,
    previewUrl,
    validateForPreview,
    getLatestBrandSignature,
    inlineAgreed,
    handleActualSubmit,
    openBrandSignatureModal,
  ]);
  const addedDeliverables = deliverables.slice(0, addedDeliverableCount);
  const activeDeliverables = deliverables.slice(addedDeliverableCount);
  const firstDeliverable = deliverables[0] || createDefaultScheduleDeliverable();
  const isDraftRequiredForAnyDeliverable = deliverables.some((row) => row.draftRequired);

  const submitLabel = isBulkMode
    ? "Send Bulk Contracts"
    : !currentContract?.contractId
      ? "Send Contract"
      : isRejectedMeta(currentContract)
        ? "Resend Contract"
        : "Update Contract";

  const todayStr = toInputDate(new Date());

  const usageRightOptions = useMemo(
    () =>
      contractForm.scheduleA.usageRights.rows.map((row) => ({
        value: row.usageRight,
        label: row.usageRight,
      })),
    [contractForm.scheduleA.usageRights.rows]
  );

  const selectedUsageRights = useMemo(
    () =>
      contractForm.scheduleA.usageRights.rows
        .filter((row) => row.selected)
        .map((row) => row.usageRight),
    [contractForm.scheduleA.usageRights.rows]
  );

  const setSelectedUsageRights = useCallback(
    (next: string[]) => {
      setContractField(
        "scheduleA.usageRights.rows",
        contractForm.scheduleA.usageRights.rows.map((row) => ({
          ...row,
          selected: next.includes(row.usageRight),
        }))
      );
    },
    [contractForm.scheduleA.usageRights.rows, setContractField]
  );
  const handlePaymentTypeChange = useCallback((value: string) => {
    const nextType = normalizePaymentType(value);

    setContractForm((prev) => {
      const next = deepClone(prev);
      next.campaign.paymentType = nextType;

      // if (nextType === PAYMENT_TYPE.MILESTONE) {
      //   if (!next.scheduleA.commercial.milestones.length) {
      //     next.scheduleA.commercial.milestones = [createDefaultCommercialMilestone()];
      //   }
      //   next.scheduleA.commercial.paymentStructure = "";
      // }

      // if (nextType === PAYMENT_TYPE.FIXED) {
      //   next.scheduleA.commercial.milestones = [];
      //   if (!next.scheduleA.commercial.paymentStructure) {
      //     next.scheduleA.commercial.paymentStructure = "50% advance / 50% balance";
      //   }
      // }

      // if (nextType === PAYMENT_TYPE.GIFTING) {
      //   next.scheduleA.commercial.milestones = [];
      //   next.scheduleA.commercial.paymentStructure = "";
      //   next.scheduleA.commercial.totalCampaignFee = "0";
      // }

      return next;
    });
  }, []);

  const handleAddDeliverable = useCallback(() => {
    const currentIndex = addedDeliverableCount;
    const currentRow = deliverables[currentIndex];

    if (!currentRow) {
      setDeliverables([createBlankActiveDeliverable(1)]);
      setAddedDeliverableCount(0);
      return;
    }

    const missing = getDeliverableMissingFields(currentRow);
    if (missing.length) {
      toast({
        icon: "error",
        title: "Complete deliverable details",
        text: `Please add ${missing.join(", ")} before adding this deliverable.`,
      });
      return;
    }

    const nextRow = createBlankActiveDeliverable(deliverables.length + 1);

    setDeliverables((prev) => [...prev, nextRow]);
    setAddedDeliverableCount((prev) => prev + 1);

    window.setTimeout(() => {
      document
        .getElementById(`deliverable-card-${nextRow.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 0);
  }, [addedDeliverableCount, deliverables]);
  if (!open) return null;
  if (!isBulkMode && !primaryInfluencer) return null;
  if (isBulkMode && !bulkInfluencers?.length) return null;

  return (
    <TooltipProvider delayDuration={150}>
      <ContractSidebarShell
        isOpen={open}
        onClose={onClose}
        title={submitLabel}
        subtitle={
          isBulkMode
            ? `${campaignTitle || contractForm.campaign.campaignTitleOrId || "Agreement"} • ${bulkInfluencers.length} influencers selected`
            : `${campaignTitle || contractForm.campaign.campaignTitleOrId || "Agreement"} • ${primaryInfluencer?.name || ""}`
        }
        campaignPaymentType={activePaymentType}
        onCampaignPaymentTypeChange={handlePaymentTypeChange}
        previewUrl={previewUrl}
        previewBlob={previewBlob}
        onClosePreview={clearPreview}
        onDownload={() =>
          handleDownloadContract(
            `${(campaignTitle || contractForm.campaign.campaignTitleOrId || "contract")
              .replace(/\s+/g, "_")}.pdf`
          )
        }
        isDownloading={contractLoading}
        onOpenInNewTab={handleOpenPreviewInNewTab}
        footer={
          <>
            <Button
              variant="outline"
              onClick={handleGeneratePreview}
              disabled={isPreviewLoading || isSubmitLoading || !resolvedBrandId}
            >
              {isPreviewLoading ? (
                <>
                  <span className="mr-2 animate-spin">⏳</span> Generating…
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-5 w-5" /> Preview
                </>
              )}
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={!previewUrl || isSubmitLoading || isPreviewLoading || !resolvedBrandId}
            >
              {isSubmitLoading ? (
                <>
                  <span className="mr-2 animate-spin">⏳</span> Processing…
                </>
              ) : isBulkMode ? (
                `${submitLabel}${bulkInfluencers.length ? ` (${bulkInfluencers.length})` : ""}`
              ) : (
                submitLabel
              )}
            </Button>
          </>
        }
      >
        {contractLoading ? (
          <div className="p-6 text-sm text-gray-600">Loading contract…</div>
        ) : (
          <>
            <SidebarSection title="Brand" icon={<FileText className="h-4 w-4" />}>
              <div className="space-y-5">
                <FloatingInput
                  id="brand-legal-name"
                  label="Brand Legal Name"
                  info={SIDEBAR_TOOLTIPS.brandLegalName}
                  value={getAtPath(contractForm, "brand.legalName")}
                  onValueChange={(value: string) =>
                    setContractField("brand.legalName", value)
                  }
                  state={formErrors["brand.legalName"] ? "error" : undefined}
                  errorText={formErrors["brand.legalName"] || ""}
                  required
                />

                <LabeledTextarea
                  id="brand-legal-address"
                  label="Legal Address"
                  info={SIDEBAR_TOOLTIPS.brandBillingAddress}
                  value={getAtPath(contractForm, "brand.billingAddress")}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setContractField("brand.billingAddress", e.target.value)
                  }
                  required
                />

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <FloatingInput
                    id="brand-poc"
                    label="Brand POC"
                    info={SIDEBAR_TOOLTIPS.brandPoc}
                    value={getAtPath(contractForm, "brand.brandPoc") || getAtPath(contractForm, "brand.contactPersonName")}
                    onValueChange={(value: string) =>
                      setContractForm((prev) => ({
                        ...prev,
                        brand: {
                          ...prev.brand,
                          brandPoc: value,
                          contactPersonName: value,
                        },
                      }))
                    }
                    state={formErrors["brand.brandPoc"] ? "error" : undefined}
                    errorText={formErrors["brand.brandPoc"] || ""}
                    required
                  />

                  <FloatingInput
                    id="brand-poc-designation"
                    label="Brand POC Designation"
                    info={SIDEBAR_TOOLTIPS.brandPocDesignation}
                    value={getAtPath(contractForm, "brand.brandPocDesignation")}
                    onValueChange={(value: string) =>
                      setContractField("brand.brandPocDesignation", value)
                    }
                  />
                </div>
              </div>
            </SidebarSection>

            <SidebarSection title="Campaign Overview" icon={<Info className="h-4 w-4" />}>
              <div className="space-y-5">
                <FloatingInput
                  id="campaign-name"
                  label="Campaign Name"
                  info={SIDEBAR_TOOLTIPS.campaignTitle}
                  value={getAtPath(contractForm, "campaign.campaignTitleOrId")}
                  onValueChange={(value: string) =>
                    setContractField("campaign.campaignTitleOrId", value)
                  }
                  state={formErrors["campaign.campaignTitleOrId"] ? "error" : undefined}
                  errorText={formErrors["campaign.campaignTitleOrId"] || ""}
                  required
                />

                <FloatingInput
                  id="campaign-products-services"
                  label="Product / Services Covered"
                  info={SIDEBAR_TOOLTIPS.campaignProductsServices}
                  value={getAtPath(contractForm, "campaign.productsServicesCovered")}
                  onValueChange={(value: string) =>
                    setContractField("campaign.productsServicesCovered", value)
                  }
                  state={formErrors["campaign.productsServicesCovered"] ? "error" : undefined}
                  errorText={formErrors["campaign.productsServicesCovered"] || ""}
                  required
                />

                <FloatingDateInput
                  id="requested-effective-date"
                  label="Effective Date"
                  info={SIDEBAR_TOOLTIPS.requestedEffectiveDate}
                  type="date"
                  value={requestedEffDate}
                  min={todayStr}
                  onValueChange={(value) => {
                    setRequestedEffDate(value);
                    setContractField("campaign.effectiveDate", value);
                  }}
                  state={formErrors["requestedEffDate"] ? "error" : undefined}
                  errorText={formErrors["requestedEffDate"] || ""}
                  required
                />

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <FloatingInput
                    id="campaign-target-country"
                    label="Target Country"
                    info={SIDEBAR_TOOLTIPS.campaignTerritory}
                    value={getAtPath(contractForm, "campaign.territoryTargetCountry")}
                    onValueChange={(value: string) =>
                      setContractField("campaign.territoryTargetCountry", value)
                    }
                    required
                  />

                  <FloatingSelect
                    label="Timezone"
                    info={SIDEBAR_TOOLTIPS.timezone}
                    value={requestedEffTz}
                    onValueChange={(value) => setRequestedEffTz(value)}
                    searchable
                  >
                    {tzOptions.map((option, index) => (
                      <SelectItem key={`${option.value}-${index}`} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </FloatingSelect>
                </div>
              </div>
            </SidebarSection>

            <SidebarSection
              title="Deliverables & Publication Timeline"
              icon={<ClipboardText className="h-4 w-4" />}
            >
              <div className="space-y-5">
                <FloatingInput
                  id="timeline-milestone-name"
                  label="Milestone name"
                  value={contractForm.scheduleA.commercial.milestones?.[0]?.milestoneName || ""}
                  onValueChange={(value: string) =>
                    setContractField("scheduleA.commercial.milestones", [
                      {
                        ...(contractForm.scheduleA.commercial.milestones?.[0] || createDefaultCommercialMilestone()),
                        milestoneName: value,
                      },
                    ])
                  }
                  required
                />

                <LabeledTextarea
                  id="timeline-milestone-description"
                  label="Milestone Description"
                  value={contractForm.scheduleA.commercial.milestones?.[0]?.milestoneDescription || ""}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setContractField("scheduleA.commercial.milestones", [
                      {
                        ...(contractForm.scheduleA.commercial.milestones?.[0] || createDefaultCommercialMilestone()),
                        milestoneDescription: e.target.value,
                      },
                    ])
                  }
                />

                {formErrors["scheduleA.deliverables"] ? (
                  <div className="text-xs font-medium text-red-600">
                    {formErrors["scheduleA.deliverables"]}
                  </div>
                ) : null}

                {activeDeliverables.map((row, index) => (
                  <div
                    key={row.id}
                    id={`deliverable-card-${row.id}`}
                    className="space-y-4 bg-white p-4"
                    style={{
                      borderRadius: "var(--Border-Radius-S, 0.5rem)",
                      border: "1px solid var(--Light-Border-Subtle, #E6E6E6)",
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-neutral-900">
                        Deliverable #{addedDeliverableCount + index + 1}
                      </div>

                      {activeDeliverables.length > 1 ? (
                        <button
                          type="button"
                          onClick={() =>
                            setDeliverables((prev) =>
                              prev.filter((item) => item.id !== row.id)
                            )
                          }
                          className="text-xs font-medium text-neutral-400 hover:text-red-600"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>

                    <FloatingInput
                      id={`deliverable-name-${row.id}`}
                      label="Deliverable name"
                      value={row.deliverableName}
                      onValueChange={(value: string) =>
                        setDeliverables((prev) =>
                          prev.map((item) =>
                            item.id === row.id ? { ...item, deliverableName: value } : item
                          )
                        )
                      }
                    />

                    <FloatingSelect
                      label="Deliveries"
                      value={row.deliverableFormat}
                      onValueChange={(value) =>
                        setDeliverables((prev) =>
                          prev.map((item) =>
                            item.id === row.id
                              ? {
                                ...item,
                                deliverableFormat: value,
                                deliverableName: item.deliverableName || value,
                              }
                              : item
                          )
                        )
                      }
                      searchable={false}
                      required
                    >
                      {DELIVERY_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </FloatingSelect>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_1fr_140px]">
                      <FloatingSelect
                        label="Aspect ratio"
                        value={row.aspectRatio}
                        onValueChange={(value) =>
                          setDeliverables((prev) =>
                            prev.map((item) =>
                              item.id === row.id ? { ...item, aspectRatio: value } : item
                            )
                          )
                        }
                        searchable={false}
                      >
                        {ASPECT_RATIO_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </FloatingSelect>

                      <FloatingMultiSelect
                        label="Platform"
                        value={csvToTags(row.platform)}
                        options={PLATFORM_OPTIONS}
                        onValueChange={(next) =>
                          setDeliverables((prev) =>
                            prev.map((item) =>
                              item.id === row.id
                                ? { ...item, platform: tagsToCsv(next) }
                                : item
                            )
                          )
                        }
                        includeAll={false}
                        searchable={false}
                      />

                      <div className="flex my-2 items-center justify-between rounded-m border border-neutral-300 bg-white px-3">
                        <button
                          type="button"
                          onClick={() =>
                            setDeliverables((prev) =>
                              prev.map((item) => {
                                if (item.id !== row.id) return item;
                                const nextQty = Math.max(1, Number(item.qty || "1") - 1);
                                return { ...item, qty: String(nextQty) };
                              })
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-neutral-500 hover:bg-neutral-100"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>

                        <div className="text-center">
                          <div className="text-base font-semibold text-neutral-900">
                            {row.qty || "1"}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setDeliverables((prev) =>
                              prev.map((item) =>
                                item.id === row.id
                                  ? { ...item, qty: String(Number(item.qty || "1") + 1) }
                                  : item
                              )
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-neutral-500 hover:bg-neutral-100"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <LabeledTextarea
                      id={`content-specification-${row.id}`}
                      label="Content Specification"
                      info={SIDEBAR_TOOLTIPS.minimumVideoSpecs}
                      value={row.contentSpecification}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setDeliverables((prev) =>
                          prev.map((item) =>
                            item.id === row.id
                              ? { ...item, contentSpecification: e.target.value }
                              : item
                          )
                        )
                      }
                    />

                    <div className="space-y-3 rounded-m border border-neutral-200 bg-white p-4">
                      <label className="flex items-center gap-3 text-sm font-semibold text-neutral-900">
                        <ContractCheckbox
                          checked={row.preShootScriptRequired}
                          onCheckedChange={(checked) => {
                            setDeliverables((prev) =>
                              prev.map((item) =>
                                item.id === row.id
                                  ? {
                                    ...item,
                                    preShootScriptRequired: checked,
                                    preShootScriptDue: checked ? item.preShootScriptDue : "",
                                    preShootScriptReviewBusinessDays: checked
                                      ? item.preShootScriptReviewBusinessDays || "2"
                                      : "2",
                                  }
                                  : item
                              )
                            );
                          }}
                          ariaLabel="Pre-Shoot Script Required"
                        />
                        <span className="text-[#B8B8B8]">Pre-Shoot Script Required</span>
                      </label>

                      {row.preShootScriptRequired ? (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                          <FloatingDateInput
                            id={`pre-shoot-script-due-${row.id}`}
                            label="Pre-Shoot Script Due Date"
                            info={SIDEBAR_TOOLTIPS.preShootScriptDue}
                            type="date"
                            value={row.preShootScriptDue}
                            min={todayStr}
                            onValueChange={(value) =>
                              setDeliverables((prev) =>
                                prev.map((item) =>
                                  item.id === row.id ? { ...item, preShootScriptDue: value } : item
                                )
                              )
                            }
                          />

                          <FloatingInput
                            id={`pre-shoot-review-days-${row.id}`}
                            label="Script Review Business Days"
                            info={SIDEBAR_TOOLTIPS.preShootReviewDays}
                            type="number"
                            value={row.preShootScriptReviewBusinessDays}
                            onValueChange={(value: string) =>
                              setDeliverables((prev) =>
                                prev.map((item) =>
                                  item.id === row.id
                                    ? { ...item, preShootScriptReviewBusinessDays: value }
                                    : item
                                )
                              )
                            }
                          />
                        </div>
                      ) : null}
                    </div>

                  </div>
                ))}
                <FloatingTagInput
                  label="Mandatory tags / links / codes"
                  info={SIDEBAR_TOOLTIPS.mandatoryTags}
                  value={csvToTags(
                    getAtPath(contractForm, "scheduleA.mandatoryTagsMentionsLinksCodes")
                  )}
                  options={[]}
                  onValueChange={(next) =>
                    setContractField(
                      "scheduleA.mandatoryTagsMentionsLinksCodes",
                      tagsToCsv(next)
                    )
                  }
                  dropdownDirection="up"
                />
                <div className="mt-1 text-xs text-neutral-400">
                  add links, brand guidelines etc
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={handleAddDeliverable}
                  >
                    Add Deliverable
                  </Button>
                </div>

                {addedDeliverables.length ? (
                  <div className="space-y-3">
                    {addedDeliverables.map((row, index) => (
                      <div
                        key={`summary-${row.id}`}
                        className="grid items-center gap-3 bg-white px-4 py-4 text-sm text-neutral-900 shadow-sm"
                        style={{
                          gridTemplateColumns: "40px minmax(120px, 1.2fr) minmax(90px, 1fr) minmax(110px, 1fr) 70px 32px",
                          borderRadius: "var(--Border-Radius-S, 0.5rem)",
                          border: "1px solid var(--Light-Border-Subtle, #E6E6E6)",
                        }}
                      >
                        <div className="font-semibold">{index + 1}.</div>

                        <div className="min-w-0 truncate font-semibold">
                          {row.deliverableName || row.deliverableFormat || "Deliverable"}
                        </div>

                        <div className="min-w-0 truncate font-semibold">
                          {row.aspectRatio || "-"}
                        </div>

                        <div className="flex min-w-0 flex-wrap gap-1">
                          {csvToTags(row.platform).length ? (
                            csvToTags(row.platform).map((platform) => (
                              <span
                                key={`${row.id}-${platform}`}
                                className="inline-flex h-7 items-center rounded-full border border-neutral-200 bg-white px-2 text-[11px] font-semibold text-neutral-700"
                              >
                                {platform}
                              </span>
                            ))
                          ) : (
                            <span className="text-neutral-400">-</span>
                          )}
                        </div>

                        <div className="text-center font-semibold">{row.qty || "1"}</div>

                        <button
                          type="button"
                          aria-label="Remove deliverable"
                          onClick={() => {
                            setDeliverables((prev) => prev.filter((item) => item.id !== row.id));
                            setAddedDeliverableCount((prev) => Math.max(0, prev - 1));
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-2xl font-light text-neutral-900 hover:bg-neutral-100"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                <FloatingSelect
                  label="Need Revision Rounds"
                  value={
                    contractForm.scheduleA.review.needRevisionRounds ||
                    REVISION_ROUNDS_DUMMY_VALUE
                  }
                  onValueChange={(value) => {
                    const nextValue =
                      value === REVISION_ROUNDS_DUMMY_VALUE ? "" : (value as "yes" | "no");

                    setContractForm((prev) =>
                      setAtPath(
                        setAtPath(
                          setAtPath(
                            prev,
                            "scheduleA.review.needRevisionRounds",
                            nextValue
                          ),
                          "scheduleA.review.includedRevisionRounds",
                          nextValue === "yes"
                            ? prev.scheduleA.review.includedRevisionRounds || "1"
                            : ""
                        ),
                        "scheduleA.review.additionalRevisionFee",
                        nextValue === "yes"
                          ? prev.scheduleA.review.additionalRevisionFee || ""
                          : ""
                      )
                    );

                    setFormErrors((prev) => {
                      const next = { ...prev };
                      delete next["scheduleA.review.includedRevisionRounds"];
                      delete next["scheduleA.review.additionalRevisionFee"];
                      return next;
                    });
                  }}
                  searchable={false}
                >
                  {YES_NO_BOOL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </FloatingSelect>

                {contractForm.scheduleA.review.needRevisionRounds === "yes" ? (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <FloatingInput
                      id="revision-count"
                      label="Revision Count"
                      info={SIDEBAR_TOOLTIPS.includedRevisionRounds}
                      type="number"
                      value={getAtPath(contractForm, "scheduleA.review.includedRevisionRounds")}
                      onValueChange={(value: string) =>
                        setContractField("scheduleA.review.includedRevisionRounds", value)
                      }
                      state={
                        formErrors["scheduleA.review.includedRevisionRounds"]
                          ? "error"
                          : undefined
                      }
                      errorText={formErrors["scheduleA.review.includedRevisionRounds"] || ""}
                      required
                    />

                    <FloatingInput
                      id="revision-fees"
                      label="Revision Fees"
                      info={SIDEBAR_TOOLTIPS.additionalRevisionFee}
                      type="number"
                      value={getAtPath(contractForm, "scheduleA.review.additionalRevisionFee")}
                      onValueChange={(value: string) =>
                        setContractField("scheduleA.review.additionalRevisionFee", value)
                      }
                      state={
                        formErrors["scheduleA.review.additionalRevisionFee"]
                          ? "error"
                          : undefined
                      }
                      errorText={formErrors["scheduleA.review.additionalRevisionFee"] || ""}
                      required
                    />
                  </div>
                ) : null}

                <div className="flex items-center gap-3">
                  <ContractCheckbox
                    checked={isDraftRequiredForAnyDeliverable}
                    onCheckedChange={(checked) =>
                      setDeliverables((prev) =>
                        prev.map((item) => ({
                          ...item,
                          draftRequired: checked,
                          draftDue: checked ? item.draftDue : "",
                        }))
                      )
                    }
                    ariaLabel="Draft required"
                  />
                  <label className="text-sm text-[#B8B8B8]">
                    Draft required
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <FloatingDateInput
                    id="timeline-draft-date"
                    label="Add draft date"
                    type="date"
                    value={firstDeliverable.draftDue || ""}
                    min={todayStr}
                    disabled={!isDraftRequiredForAnyDeliverable}
                    onValueChange={(value) =>
                      setDeliverables((prev) =>
                        prev.map((item) => ({ ...item, draftDue: value }))
                      )
                    }
                  />

                  <FloatingDateInput
                    id="timeline-live-date"
                    label="Live Date"
                    type="date"
                    value={firstDeliverable.liveDate || ""}
                    min={todayStr}
                    onValueChange={(value) =>
                      setDeliverables((prev) =>
                        prev.map((item) => ({ ...item, liveDate: value }))
                      )
                    }
                  />
                </div>

                <label className="flex items-start gap-3 text-sm font-semibold text-neutral-900">
                  <ContractCheckbox
                    checked={Boolean(contractForm.scheduleA.review.reshootObligation)}
                    onCheckedChange={(checked) =>
                      setContractField(
                        "scheduleA.review.reshootObligation",
                        checked
                          ? "To ensure the final content aligns perfectly with our agreed strategy, how does your team typically handle reshoots if a deliverable requires adjustments to meet the initial campaign brief?"
                          : ""
                      )
                    }
                    className="mt-[2px] shrink-0"
                    ariaLabel="Reshoot handling"
                  />

                  <span className="flex-1 leading-5 text-[#B8B8B8]">
                    To ensure the final content aligns perfectly with our agreed strategy, how
                    does your team typically handle reshoots if a deliverable requires
                    adjustments to meet the initial campaign brief?
                  </span>
                </label>

                {contractForm.scheduleA.review.reshootObligation ? (
                  <LabeledTextarea
                    id="reshoot-obligation"
                    label="Reshoot handling"
                    value={getAtPath(contractForm, "scheduleA.review.reshootObligation")}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setContractField("scheduleA.review.reshootObligation", e.target.value)
                    }
                  />
                ) : null}

                <label className="flex items-center gap-3 text-sm font-semibold text-neutral-900">
                  <ContractCheckbox
                    checked={Boolean(contractForm.scheduleA.review.minimumLivePeriod)}
                    onCheckedChange={(checked) =>
                      setContractField(
                        "scheduleA.review.minimumLivePeriod",
                        checked ? MINIMUM_LIVE_PERIOD_DUMMY_VALUE : ""
                      )
                    }
                    className="shrink-0"
                    ariaLabel="Minimum Live Period"
                  />

                  <span className="flex-1 text-[#B8B8B8]">Minimum Live Period</span>
                </label>

                <p className="ml-8 text-xs leading-5 text-neutral-500">
                  Influencer may not delete, archive, materially edit, or materially alter a
                  live Deliverable without prior written approval except where required by law
                  or platform policy before this date.
                </p>

                <FloatingSelect
                  label="Select a duration"
                  value={
                    getAtPath(contractForm, "scheduleA.review.minimumLivePeriod") ||
                    MINIMUM_LIVE_PERIOD_DUMMY_VALUE
                  }
                  onValueChange={(value) =>
                    setContractField("scheduleA.review.minimumLivePeriod", value)
                  }
                  searchable={false}
                  disabled={!contractForm.scheduleA.review.minimumLivePeriod}
                >
                  {MINIMUM_LIVE_PERIOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </FloatingSelect>
              </div>
            </SidebarSection>

            <SidebarSection title="Commercial Terms" icon={<FileText className="h-4 w-4" />}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <FloatingInput
                    id="total-campaign-fee"
                    label="Influencer fees"
                    info={SIDEBAR_TOOLTIPS.influencerBudget}
                    type="number"
                    value={getAtPath(contractForm, "scheduleA.commercial.influencerBudget")}
                    onValueChange={(value: string) =>
                      setContractField("scheduleA.commercial.influencerBudget", value)
                    }
                    state={
                      formErrors["scheduleA.commercial.influencerBudget"]
                        ? "error"
                        : undefined
                    }
                    errorText={formErrors["scheduleA.commercial.influencerBudget"] || ""}
                    required
                  />

                  <FloatingSelect
                    label="Currency"
                    info={SIDEBAR_TOOLTIPS.currency}
                    value="USD"
                    onValueChange={() => setContractField("scheduleA.commercial.currency", "USD")}
                    searchable={false}
                    disabled
                    state={
                      formErrors["scheduleA.commercial.currency"] ? "error" : undefined
                    }
                    errorText={formErrors["scheduleA.commercial.currency"] || ""}
                    required
                  >
                    <SelectItem value="USD">$ USD</SelectItem>
                  </FloatingSelect>
                </div>

                {activePaymentType === PAYMENT_TYPE.FIXED ? (
                  <>
                    <FloatingSelect
                      label="Payment Structure"
                      info={SIDEBAR_TOOLTIPS.paymentStructure}
                      value={
                        getAtPath(contractForm, "scheduleA.commercial.paymentStructure") ||
                        PAYMENT_STRUCTURE_DUMMY_VALUE
                      }
                      onValueChange={(value) =>
                        setContractField(
                          "scheduleA.commercial.paymentStructure",
                          value === PAYMENT_STRUCTURE_DUMMY_VALUE ? "" : value
                        )
                      }
                      searchable={false}
                    >
                      {PAYMENT_STRUCTURE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <span className="flex items-baseline gap-2">
                            <span className="text-[15px] font-semibold text-[#1F1F1F]">
                              {option.label}
                            </span>
                            {option.description ? (
                              <span className="text-xs font-normal text-[#B3B3B3]">
                                ({option.description})
                              </span>
                            ) : null}
                          </span>
                        </SelectItem>
                      ))}
                    </FloatingSelect>
                    {/* 
                    <FloatingInput
                      id="commercial-custom-split"
                      label="Custom"
                      info={SIDEBAR_TOOLTIPS.customSplit}
                      value={getAtPath(contractForm, "scheduleA.commercial.customSplit")}
                      onValueChange={(value: string) =>
                        setContractField("scheduleA.commercial.customSplit", value)
                      }
                    /> */}

                    <LabeledTextarea
                      id="advance-payment-trigger"
                      label="Advance Payment Trigger"
                      info={SIDEBAR_TOOLTIPS.advancePaymentTrigger}
                      value={getAtPath(contractForm, "scheduleA.commercial.advancePaymentTrigger")}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setContractField("scheduleA.commercial.advancePaymentTrigger", e.target.value)
                      }
                    />

                    <LabeledTextarea
                      id="remaining-payment-trigger"
                      label="Remaining Payment Trigger"
                      info={SIDEBAR_TOOLTIPS.remainingPaymentTrigger}
                      value={getAtPath(contractForm, "scheduleA.commercial.remainingPaymentTrigger")}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setContractField(
                          "scheduleA.commercial.remainingPaymentTrigger",
                          e.target.value
                        )
                      }
                    />
                  </>
                ) : null}

                {activePaymentType === PAYMENT_TYPE.MILESTONE ? (
                  <CommercialMilestonesEditor
                    rows={contractForm.scheduleA.commercial.milestones}
                    error={formErrors["scheduleA.commercial.milestones"]}
                    onChange={(rows) =>
                      setContractField("scheduleA.commercial.milestones", rows)
                    }
                  />
                ) : null}

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <FloatingSelect
                    label="Payment Processor Fees Borne By"
                    info={SIDEBAR_TOOLTIPS.processorFeesBorneBy}
                    value={getAtPath(
                      contractForm,
                      "scheduleA.commercial.paymentProcessorFeesBorneBy"
                    )}
                    onValueChange={(value) =>
                      setContractField(
                        "scheduleA.commercial.paymentProcessorFeesBorneBy",
                        value
                      )
                    }
                    searchable={false}
                  >
                    {PROCESSOR_FEE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </FloatingSelect>

                  <FloatingInput
                    id="processor-fees-notes"
                    label="Payment Processor Fee Notes"
                    info={SIDEBAR_TOOLTIPS.processorFeesNotes}
                    value={getAtPath(
                      contractForm,
                      "scheduleA.commercial.paymentProcessorFeesNotes"
                    )}
                    onValueChange={(value: string) =>
                      setContractField(
                        "scheduleA.commercial.paymentProcessorFeesNotes",
                        value
                      )
                    }
                  />
                </div>

                {/* <LabeledTextarea
                  id="lane-a-marketplace-fee-note"
                  label="Lane A Marketplace Fee Note"
                  info={SIDEBAR_TOOLTIPS.laneAMarketplaceFeeNote}
                  value={getAtPath(
                    contractForm,
                    "scheduleA.commercial.laneAMarketplaceFeeNote"
                  )}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setContractField(
                      "scheduleA.commercial.laneAMarketplaceFeeNote",
                      e.target.value
                    )
                  }
                  disabled
                /> */}
              </div>
            </SidebarSection>

            <SidebarSection
              title="Raw Files & Reporting"
              icon={<ClipboardText className="h-4 w-4" />}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <FloatingSelect
                  label="Raw / Source File Delivery"
                  info={SIDEBAR_TOOLTIPS.rawSourceFileDelivery}
                  value={getAtPath(contractForm, "scheduleA.rawFiles.rawSourceFileDelivery")}
                  onValueChange={(value) =>
                    setContractField("scheduleA.rawFiles.rawSourceFileDelivery", value)
                  }
                  searchable={false}
                >
                  {RAW_FILE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </FloatingSelect>

                <FloatingInput
                  id="raw-files-format"
                  label="Format"
                  info={SIDEBAR_TOOLTIPS.rawFilesFormat}
                  value={getAtPath(contractForm, "scheduleA.rawFiles.format")}
                  onValueChange={(value: string) =>
                    setContractField("scheduleA.rawFiles.format", value)
                  }
                />

                <FloatingDateInput
                  id="raw-files-delivery-due"
                  label="Delivery Due"
                  info={SIDEBAR_TOOLTIPS.rawFilesDeliveryDue}
                  type="date"
                  value={getAtPath(contractForm, "scheduleA.rawFiles.deliveryDue")}
                  min={todayStr}
                  onValueChange={(value) =>
                    setContractField("scheduleA.rawFiles.deliveryDue", value)
                  }
                />

                <FloatingDateInput
                  id="analytics-reporting-deadline"
                  label="Analytics Reporting Deadline"
                  info={SIDEBAR_TOOLTIPS.analyticsReportingDeadline}
                  type="date"
                  value={getAtPath(
                    contractForm,
                    "scheduleA.rawFiles.analyticsReportingDeadline"
                  )}
                  min={todayStr}
                  onValueChange={(value) =>
                    setContractField(
                      "scheduleA.rawFiles.analyticsReportingDeadline",
                      value
                    )
                  }
                />

                <FloatingTagInput
                  label="Analytics Reporting Items"
                  info={SIDEBAR_TOOLTIPS.analyticsReportingItems}
                  value={csvToTags(
                    getAtPath(contractForm, "scheduleA.rawFiles.analyticsReportingItems")
                  )}
                  options={[]}
                  onValueChange={(next) =>
                    setContractField(
                      "scheduleA.rawFiles.analyticsReportingItems",
                      tagsToCsv(next)
                    )
                  }
                  dropdownDirection="up"
                />
              </div>
            </SidebarSection>

            <SidebarSection title="Shipping & Returns" icon={<Info className="h-4 w-4" />}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <FloatingSelect
                  label="Product Shipping Applicable"
                  info={SIDEBAR_TOOLTIPS.productShippingApplicable}
                  value={getAtPath(
                    contractForm,
                    "scheduleA.shipping.productShippingApplicable"
                  )}
                  onValueChange={(value) =>
                    setContractField("scheduleA.shipping.productShippingApplicable", value)
                  }
                  searchable={false}
                >
                  {SHIPPING_APPLICABLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </FloatingSelect>

                <FloatingSelect
                  label="Product Returnable"
                  info={SIDEBAR_TOOLTIPS.productReturnable}
                  value={getAtPath(contractForm, "scheduleA.shipping.productReturnable")}
                  onValueChange={(value) =>
                    setContractField("scheduleA.shipping.productReturnable", value)
                  }
                  searchable={false}
                >
                  {RETURNABLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </FloatingSelect>

                <FloatingInput
                  id="ship-to-name"
                  label="Ship-To Name"
                  info={SIDEBAR_TOOLTIPS.shipToName}
                  value={getAtPath(contractForm, "scheduleA.shipping.shipToName")}
                  onValueChange={(value: string) =>
                    setContractField("scheduleA.shipping.shipToName", value)
                  }
                />

                <FloatingInput
                  id="ship-to-phone"
                  label="Ship-To Phone"
                  info={SIDEBAR_TOOLTIPS.shipToPhone}
                  value={getAtPath(contractForm, "scheduleA.shipping.shipToPhone")}
                  onValueChange={(value: string) =>
                    setContractField("scheduleA.shipping.shipToPhone", value)
                  }
                />

                <LabeledTextarea
                  id="ship-to-address"
                  label="Ship-To Address"
                  info={SIDEBAR_TOOLTIPS.shipToAddress}
                  value={getAtPath(contractForm, "scheduleA.shipping.shipToAddress")}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setContractField("scheduleA.shipping.shipToAddress", e.target.value)
                  }
                />

                <LabeledTextarea
                  id="risk-of-loss-notes"
                  label="Risk of Loss Notes"
                  info={SIDEBAR_TOOLTIPS.riskOfLossNotes}
                  value={getAtPath(contractForm, "scheduleA.shipping.riskOfLossNotes")}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setContractField("scheduleA.shipping.riskOfLossNotes", e.target.value)
                  }
                />

                <FloatingDateInput
                  id="product-receipt-confirmation-deadline"
                  label="Product Receipt Confirmation Deadline"
                  info={SIDEBAR_TOOLTIPS.productReceiptConfirmationDeadline}
                  type="date"
                  value={getAtPath(
                    contractForm,
                    "scheduleA.shipping.productReceiptConfirmationDeadline"
                  )}
                  min={todayStr}
                  onValueChange={(value) =>
                    setContractField(
                      "scheduleA.shipping.productReceiptConfirmationDeadline",
                      value
                    )
                  }
                />

                <FloatingInput
                  id="return-window-method"
                  label="Return Window / Method"
                  info={SIDEBAR_TOOLTIPS.returnWindowMethod}
                  value={getAtPath(contractForm, "scheduleA.shipping.returnWindowMethod")}
                  onValueChange={(value: string) =>
                    setContractField("scheduleA.shipping.returnWindowMethod", value)
                  }
                />
              </div>
            </SidebarSection>

            <SidebarSection
              title="Usage Rights"
              icon={<SealCheck className="h-4 w-4" />}
            >
              <div className="space-y-4">
                <FloatingMultiSelect
                  label="Granted Usage Rights"
                  info={SIDEBAR_TOOLTIPS.grantedUsageRights}
                  value={selectedUsageRights}
                  options={usageRightOptions}
                  onValueChange={(next) => setSelectedUsageRights(next)}
                  includeAll={false}
                  searchable={false}
                />

                <div className="space-y-3">
                  {contractForm.scheduleA.usageRights.rows
                    .filter((row) => row.selected)
                    .map((row) => (
                      <div
                        key={row.id}
                        className="rounded-xl border border-gray-200 bg-white p-3"
                      >
                        <div className="mb-3 text-sm font-semibold text-gray-800">
                          {row.usageRight}
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <FloatingInput
                            id={`usage-duration-${row.id}`}
                            label="Duration"
                            info={SIDEBAR_TOOLTIPS.usageDuration}
                            value={row.duration}
                            onValueChange={(value: string) =>
                              setContractField(
                                "scheduleA.usageRights.rows",
                                contractForm.scheduleA.usageRights.rows.map((item) =>
                                  item.id === row.id ? { ...item, duration: value } : item
                                )
                              )
                            }
                          />

                          <FloatingInput
                            id={`usage-territory-${row.id}`}
                            label="Territory / Notes"
                            info={SIDEBAR_TOOLTIPS.usageTerritoryNotes}
                            value={row.territoryNotes}
                            onValueChange={(value: string) =>
                              setContractField(
                                "scheduleA.usageRights.rows",
                                contractForm.scheduleA.usageRights.rows.map((item) =>
                                  item.id === row.id
                                    ? { ...item, territoryNotes: value }
                                    : item
                                )
                              )
                            }
                          />
                        </div>
                      </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <FloatingSelect
                    label="Attribution Requirement"
                    info={SIDEBAR_TOOLTIPS.attributionRequirement}
                    value={getAtPath(
                      contractForm,
                      "scheduleA.usageRights.attributionRequirement"
                    )}
                    onValueChange={(value) =>
                      setContractField("scheduleA.usageRights.attributionRequirement", value)
                    }
                    searchable={false}
                  >
                    {ATTRIBUTION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </FloatingSelect>

                  <FloatingSelect
                    label="Editing Rights"
                    info={SIDEBAR_TOOLTIPS.editingRights}
                    value={getAtPath(contractForm, "scheduleA.usageRights.editingRights")}
                    onValueChange={(value) =>
                      setContractField("scheduleA.usageRights.editingRights", value)
                    }
                    searchable={false}
                  >
                    {EDITING_RIGHTS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </FloatingSelect>
                </div>

                <FloatingInput
                  id="attribution-text"
                  label="Attribution Text"
                  info={SIDEBAR_TOOLTIPS.attributionText}
                  value={getAtPath(contractForm, "scheduleA.usageRights.attributionText")}
                  onValueChange={(value: string) =>
                    setContractField("scheduleA.usageRights.attributionText", value)
                  }
                />

                <FloatingSelect
                  label="Music / Stock Asset Responsibility"
                  info={SIDEBAR_TOOLTIPS.musicStockAssetResponsibility}
                  value={getAtPath(
                    contractForm,
                    "scheduleA.usageRights.musicStockAssetResponsibility"
                  )}
                  onValueChange={(value) =>
                    setContractField(
                      "scheduleA.usageRights.musicStockAssetResponsibility",
                      value
                    )
                  }
                  searchable={false}
                >
                  {MUSIC_RESPONSIBILITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </FloatingSelect>
              </div>
            </SidebarSection>

            <SidebarSection
              title="Compliance & Brand Safety"
              icon={<Info className="h-4 w-4" />}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <LabeledTextarea
                  id="creative-brief-mandatory-talking-points"
                  label="Creative Brief / Mandatory Talking Points"
                  info={SIDEBAR_TOOLTIPS.creativeBrief}
                  value={getAtPath(
                    contractForm,
                    "scheduleA.compliance.creativeBriefMandatoryTalkingPoints"
                  )}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setContractField(
                      "scheduleA.compliance.creativeBriefMandatoryTalkingPoints",
                      e.target.value
                    )
                  }
                />

                <LabeledTextarea
                  id="restricted-statements"
                  label="Restricted Statements"
                  info={SIDEBAR_TOOLTIPS.restrictedStatements}
                  value={getAtPath(contractForm, "scheduleA.compliance.restrictedStatements")}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setContractField("scheduleA.compliance.restrictedStatements", e.target.value)
                  }
                />
              </div>
            </SidebarSection>

            <SidebarSection
              title="Exclusivity & Morals"
              icon={<SealCheck className="h-4 w-4" />}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <FloatingInput
                  id="competitor-blackout"
                  label="Competitor Blackout"
                  info={SIDEBAR_TOOLTIPS.competitorBlackout}
                  value={getAtPath(contractForm, "scheduleA.exclusivity.competitorBlackout")}
                  onValueChange={(value: string) =>
                    setContractField("scheduleA.exclusivity.competitorBlackout", value)
                  }
                />

                <FloatingTagInput
                  label="Category / Competitor List"
                  info={SIDEBAR_TOOLTIPS.categoryCompetitorList}
                  value={csvToTags(
                    getAtPath(contractForm, "scheduleA.exclusivity.categoryCompetitorList")
                  )}
                  options={[]}
                  onValueChange={(next) =>
                    setContractField(
                      "scheduleA.exclusivity.categoryCompetitorList",
                      tagsToCsv(next)
                    )
                  }
                  dropdownDirection="up"
                />

                <FloatingInput
                  id="blackout-period"
                  label="Blackout Period"
                  info={SIDEBAR_TOOLTIPS.blackoutPeriod}
                  value={getAtPath(contractForm, "scheduleA.exclusivity.blackoutPeriod")}
                  onValueChange={(value: string) =>
                    setContractField("scheduleA.exclusivity.blackoutPeriod", value)
                  }
                />

                <FloatingSelect
                  label="Optional Morals Clause"
                  info={SIDEBAR_TOOLTIPS.optionalMoralsClause}
                  value={getAtPath(
                    contractForm,
                    "scheduleA.exclusivity.optionalMoralsClause"
                  )}
                  onValueChange={(value) =>
                    setContractField("scheduleA.exclusivity.optionalMoralsClause", value)
                  }
                  searchable={false}
                >
                  {MORALS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </FloatingSelect>
              </div>
            </SidebarSection>

            <SidebarSection
              title="Cancellation & Refunds"
              icon={<Info className="h-4 w-4" />}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <LabeledTextarea
                  id="kill-fee-or-prorata"
                  label="Kill Fee / Pro-Rata"
                  info={SIDEBAR_TOOLTIPS.killFeeOrProrata}
                  value={getAtPath(contractForm, "scheduleA.cancellation.killFeeOrProrata")}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setContractField("scheduleA.cancellation.killFeeOrProrata", e.target.value)
                  }
                />

                <LabeledTextarea
                  id="refund-of-unearned-advance"
                  label="Refund of Unearned Advance"
                  info={SIDEBAR_TOOLTIPS.refundOfUnearnedAdvance}
                  value={getAtPath(
                    contractForm,
                    "scheduleA.cancellation.refundOfUnearnedAdvance"
                  )}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setContractField(
                      "scheduleA.cancellation.refundOfUnearnedAdvance",
                      e.target.value
                    )
                  }
                />
              </div>
            </SidebarSection>

            <SidebarSection title="Dispute & Notices" icon={<FileText className="h-4 w-4" />}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <FloatingInput
                  id="governing-law"
                  label="Governing Law"
                  info={SIDEBAR_TOOLTIPS.governingLaw}
                  value={getAtPath(contractForm, "scheduleA.dispute.governingLaw")}
                  onValueChange={(value: string) =>
                    setContractField("scheduleA.dispute.governingLaw", value)
                  }
                />

                <FloatingSelect
                  label="Dispute Resolution Method"
                  info={SIDEBAR_TOOLTIPS.disputeResolutionMethod}
                  value={getAtPath(contractForm, "scheduleA.dispute.disputeResolutionMethod")}
                  onValueChange={(value) =>
                    setContractField("scheduleA.dispute.disputeResolutionMethod", value)
                  }
                  searchable={false}
                  required={true}
                  state={
                    formErrors["scheduleA.dispute.disputeResolutionMethod"] ? "error" : undefined
                  }
                  errorText={formErrors["scheduleA.dispute.disputeResolutionMethod"] || ""}
                >
                  {DISPUTE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </FloatingSelect>

                <FloatingInput
                  id="dispute-venue"
                  label="Venue"
                  info={SIDEBAR_TOOLTIPS.disputeVenue}
                  value={getAtPath(contractForm, "scheduleA.dispute.disputeVenue")}
                  onValueChange={(value: string) =>
                    setContractField("scheduleA.dispute.disputeVenue", value)
                  }
                />

                <FloatingInput
                  id="arbitration-seat"
                  label="Arbitration Seat"
                  info={SIDEBAR_TOOLTIPS.arbitrationSeat}
                  value={getAtPath(contractForm, "scheduleA.dispute.arbitrationSeat")}
                  onValueChange={(value: string) =>
                    setContractField("scheduleA.dispute.arbitrationSeat", value)
                  }
                />

                <FloatingSelect
                  label="Attorneys’ Fees"
                  info={SIDEBAR_TOOLTIPS.attorneysFees}
                  value={getAtPath(contractForm, "scheduleA.dispute.attorneysFees")}
                  onValueChange={(value) =>
                    setContractField("scheduleA.dispute.attorneysFees", value)
                  }
                  searchable={false}
                >
                  {ATTORNEYS_FEES_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </FloatingSelect>
              </div>
            </SidebarSection>
            {signatureStatus === "checking" ? (
              <div
                id="signature-section"
                className="rounded-m border border-neutral-200 bg-white p-5"
              >
                <div className="text-sm text-gray-500">Checking active signature…</div>
              </div>
            ) : signatureStatus === "exists" ? (
              <div id="signature-section">
                <SignatureAgreementBlock
                  signerName={
                    contractForm.brand.brandPoc ||
                    contractForm.brand.contactPersonName ||
                    contractForm.brand.legalName
                  }
                  signatureId={activeBrandSignatureId}
                  signatureSrc={activeBrandSignatureSrc}
                  tab={inlineSignatureTab}
                  onTabChange={setInlineSignatureTab}
                  drawnSig={inlineDrawnSig}
                  onDrawnSigChange={setInlineDrawnSig}
                  agreed={inlineAgreed}
                  onAgreeChange={(value) => {
                    setInlineAgreed(value);
                    if (value) setInlineShowError(false);
                  }}
                  showError={inlineShowError}
                  brandId={resolvedBrandId || undefined}
                  onSignatureChange={(newSrc) => setActiveBrandSignatureSrc(newSrc)}
                  onSignatureUploaded={getLatestBrandSignature}
                  onManageSignatures={() => openBrandSignatureModal("manage")}
                />
              </div>
            ) : (
              <div
                id="signature-section"
                className="space-y-4 rounded-[20px] border border-[#E6E6E6] bg-white p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-base font-semibold text-[#1A1A1A]">
                      Brand Signature
                    </div>
                    <p className="mt-1 text-sm leading-5 text-[#9C9C9C]">
                      No primary brand signature is selected. Add or select a brand
                      signature before sending this contract.
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={() => openBrandSignatureModal("upload")}
                  >
                    Add Signature
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </ContractSidebarShell>

      {resolvedBrandId ? (
        <BrandSignatureModal
          open={showSignatureModal}
          brandId={resolvedBrandId}
          initialTab={signatureModalInitialTab}
          isLoading={isSubmitLoading}
          onClose={() => setShowSignatureModal(false)}
          onSignatureUploaded={getLatestBrandSignature}
          onConfirm={async (signatureData, signatureId) => {
            setShowSignatureModal(false);
            await handleActualSubmit(signatureData, signatureId);
          }}
        />
      ) : null}
    </TooltipProvider>
  );
}

export function ContractSidebarShell({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  campaignPaymentType,
  onCampaignPaymentTypeChange,
  previewUrl,
  previewBlob,
  onClosePreview,
  onDownload,
  isDownloading,
  onOpenInNewTab,
  footer,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  subtitle: string;
  campaignPaymentType?: PaymentType;
  onCampaignPaymentTypeChange: (value: string) => void;
  previewUrl: string;
  previewBlob: Blob | null;
  onClosePreview: () => void;
  onDownload: () => void;
  isDownloading?: boolean;
  onOpenInNewTab: () => void;
  footer: React.ReactNode;
}) {

  const contractTypeLabel = campaignPaymentType
    ? CONTRACT_TYPE_LABELS[campaignPaymentType]
    : "";

  return (
    <div
      className={`absolute inset-0 z-[120] isolate ${isOpen ? "" : "pointer-events-none"
        }`}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"
          }`}
        onClick={onClose}
      />

      <div
        className={`absolute inset-0 overflow-hidden bg-white border-l border-gray-200 shadow-2xl transform transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="relative z-10 h-20 border-b border-[#e5e5e5] bg-white">
          <div className="flex h-full items-center justify-between px-6">
            <div className="min-w-0">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#9d9d9d]">
                {title}
              </div>
              {/* <div className="truncate text-lg font-bold text-[#1a1a1a]">
                {subtitle}
              </div> */}
              <div className="mt-1">
                <select
                  value={campaignPaymentType}
                  onChange={(e) => onCampaignPaymentTypeChange(e.target.value)}
                  className="border-0 bg-transparent p-0 pr-5 text-xs font-medium text-[#1a1a1a] outline-none focus:outline-none"
                  aria-label="Campaign payment type"
                >
                  {PAYMENT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {CONTRACT_TYPE_LABELS[option.value as PaymentType]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={onOpenInNewTab}
                variant="raised"
                className="!bg-white !text-black !shadow-none cursor-pointer hover:!bg-white hover:!text-black hover:!shadow-none active:!bg-white"
              >
                <ArrowSquareInIcon size={16} />
              </Button>
              <Button
                variant="solid"
                onClick={onDownload}
                disabled={isDownloading}
                className="inline-flex items-center rounded-lg border cursor-pointer border-[#e8e8e8] px-4 py-2 !bg-white !text-black !shadow-none"
              >
                <span className="mr-2 inline-flex">
                  <DownloadSimpleIcon />
                </span>
                <span>{isDownloading ? "Downloading..." : "Download"}</span>
              </Button>
              <Button
                type="button"
                className="ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e8e8e8] bg-white !text-black hover:!bg-white "
                onClick={onClose}
                aria-label="Close"
              >
                ✕
              </Button>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex h-[calc(100%-160px)] bg-white">
          <div className="h-full w-full overflow-auto px-6 py-5 space-y-5 xl:w-1/2">
            {children}
          </div>

          {previewUrl ? (
            <div className="hidden xl:flex xl:w-1/2 flex-col border-l border-gray-100 bg-white">
              <div className="flex-1 min-h-0">
                <iframe
                  src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                  title="Contract PDF preview"
                  className="h-full w-full border-0"
                />
              </div>
            </div>
          ) : (
            <div className="hidden xl:flex xl:w-1/2 items-center justify-center border-l border-gray-100 bg-white p-6 text-gray-400">
              <div className="text-center">
                <Eye className="mx-auto mb-2 h-8 w-8" />
                <div className="text-sm">Generate a preview to see the PDF here and send contract</div>
              </div>
            </div>
          )}
        </div>

        <div className="relative z-10 h-[80px] border-t border-gray-200 bg-white px-6 flex items-center justify-between">
          <div className="truncate text-lg font-bold text-[#1a1a1a]">
            {subtitle}
          </div>
          <div className="flex h-full items-center justify-end gap-3">
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}

const SECTION_COPY: Record<
  string,
  {
    title: string;
    subtitle?: string;
    defaultOpen?: boolean;
  }
> = {
  Brand: {
    title: "Brand Overview",
    subtitle:
      "Add key details about the brand, including its identity, values, and important information creators should know.",
    defaultOpen: true,
  },
  "Campaign Overview": {
    title: "Campaign Overview",
    subtitle:
      "Describe the campaign objective, creative direction, and expectations for the collaboration.",
    defaultOpen: true,
  },
  "Deliverables & Publication Timeline": {
    title: "Deliverables and Publication Timeline",
    subtitle:
      "Define the required deliverables, content formats, platforms, and submission deadlines.",
    defaultOpen: true,
  },
  "Review, Revisions & Reshoots": {
    title: "Review, Revisions and Reshoots",
    subtitle:
      "Set draft requirements, revision rounds, reshoot handling, and minimum live period.",
  },
  "Commercial Terms": {
    title: "Payment Terms",
    subtitle:
      "Specify the payment structure, milestone amounts, and payout schedule for the campaign.",
  },
  "Raw Files & Reporting": {
    title: "Raw Files, Source Files, and Reporting",
    subtitle:
      "Specify raw/source file delivery requirements and analytics reporting details.",
  },
  "Shipping & Returns": {
    title: "Product Shipping and Returns",
    subtitle:
      "Define product shipment, receipt confirmation, returnable items, and risk-of-loss notes.",
  },
  "Usage Rights": {
    title: "Usage Rights and Content Ownership",
    subtitle:
      "Define how the brand can reuse creator content, including duration, territory, attribution, and editing rights.",
  },
  "Compliance & Brand Safety": {
    title: "Compliance and Brand Safety",
    subtitle:
      "Add mandatory talking points, restricted claims, disclosures, and brand-safety instructions.",
  },
  "Exclusivity & Morals": {
    title: "Exclusivity and Morals",
    subtitle:
      "Define competitor blackout, restricted categories, exclusivity period, and optional morals clause.",
  },
  "Cancellation & Refunds": {
    title: "Cancellation and Refunds",
    subtitle:
      "Set kill fee, prorated compensation, refunds, and non-performance remedies.",
  },
  "Dispute & Notices": {
    title: "Governing Law and Dispute Resolution",
    subtitle:
      "Define governing law, dispute method, venue, arbitration seat, and attorney-fee handling.",
  },
  Signature: {
    title: "Signature",
    subtitle: "Review and confirm the saved brand signature before sending the contract.",
    defaultOpen: true,
  },
};

function SidebarSection(props: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  subtitle?: string;
  defaultOpen?: boolean;
}) {
  const mapped = SECTION_COPY[props.title];

  return (
    <AccordionCard
      title={mapped?.title || props.title}
      subtitle={props.subtitle ?? mapped?.subtitle}
      defaultOpen={props.defaultOpen ?? mapped?.defaultOpen ?? false}
    >
      {props.children}
    </AccordionCard>
  );
}

function CommercialMilestonesEditor({
  rows,
  onChange,
  error,
}: {
  rows: ContractMilestone[];
  onChange: (rows: ContractMilestone[]) => void;
  error?: string;
}) {
  const updateRow = (
    id: string,
    key: keyof Omit<ContractMilestone, "id">,
    value: string
  ) => {
    onChange(rows.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  };

  const addRow = () => {
    onChange([...rows, createDefaultCommercialMilestone(rows.length + 1)]);
  };

  const removeRow = (id: string) => {
    onChange(rows.length > 1 ? rows.filter((row) => row.id !== id) : rows);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-800">Milestones</div>
        <Button type="button" variant="outline" onClick={addRow}>
          + Add Milestone
        </Button>
      </div>

      {error ? <div className="text-xs text-red-600">{error}</div> : null}

      {rows.map((row, index) => (
        <div key={row.id} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Milestone #{index + 1}</div>
            {rows.length > 1 ? (
              <button
                type="button"
                className="text-xs text-red-600"
                onClick={() => removeRow(row.id)}
              >
                Remove
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <FloatingInput
              label="Milestone Name"
              value={row.milestoneName}
              onValueChange={(value: string) =>
                updateRow(row.id, "milestoneName", value)
              }
            />

            <FloatingInput
              label="Milestone Description"
              value={row.milestoneDescription}
              onValueChange={(value: string) =>
                updateRow(row.id, "milestoneDescription", value)
              }
            />

            <FloatingInput
              label="Payment Amount"
              type="number"
              value={row.paymentAmount}
              onValueChange={(value: string) =>
                updateRow(row.id, "paymentAmount", value)
              }
            />

            <FloatingDateInput
              label="Due Date"
              type="date"
              value={row.dueDate}
              min={toInputDate(new Date())}
              onValueChange={(value) => updateRow(row.id, "dueDate", value)}
            />

            <LabeledTextarea
              label="Trigger Event"
              value={row.triggerEvent}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                updateRow(row.id, "triggerEvent", e.target.value)
              }
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SignatureAgreementBlock({
  signatureSrc,
  agreed,
  onAgreeChange,
  showError,
  onManageSignatures,
}: {
  signerName?: string;
  signatureSrc?: string;
  signatureId?: string;
  tab: "default" | "draw";
  onTabChange: (tab: "default" | "draw") => void;
  drawnSig: string;
  onDrawnSigChange: (dataUrl: string) => void;
  agreed: boolean;
  onAgreeChange: (v: boolean) => void;
  showError: boolean;
  brandId?: string;
  onSignatureChange?: (newSrc: string) => void;
  onSignatureUploaded?: () => Promise<{ signatureData: string; signatureId: string }> | void;
  onManageSignatures?: () => void;
}) {
  const [previewSrc, setPreviewSrc] = React.useState(signatureSrc || "");
  const shouldShowError = showError && !agreed;

  React.useEffect(() => {
    setPreviewSrc(signatureSrc || "");
  }, [signatureSrc]);

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] bg-[#F8F8F8] px-4 pb-5 pt-6">
        <div className="flex min-h-[130px] w-full items-center justify-center rounded-[20px]">
          {previewSrc ? (
            <img
              src={previewSrc}
              alt="Brand signature"
              className="max-h-[105px] max-w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-neutral-400">
              <Signature className="h-10 w-10" />
              <span className="text-xs">No brand signature selected</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-[#9C9C9C]">
            <Info size={16} />
            <span>Signature is selected as primary</span>
          </div>

          <button
            type="button"
            onClick={onManageSignatures}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#1F1F1F]"
          >
            Change signature
            <CaretDown size={16} weight="bold" />
          </button>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-[20px] border bg-white",
          shouldShowError ? "border-[#FFE1DF]" : "border-[#E6E6E6]"
        )}
      >
        <div className="flex items-center gap-4 px-6 py-6">
          <Switch
            checked={agreed}
            onCheckedChange={(checked) => onAgreeChange(checked === true)}
            aria-invalid={shouldShowError}
            className="shrink-0"
          />

          <p
            className="m-0 flex-1"
            style={{
              color: "var(--Light-Text-Primary, #1A1A1A)",
              fontFamily: "var(--Font-Family-Inter, Inter)",
              fontSize: "var(--Font-Size-14, 0.875rem)",
              fontStyle: "normal",
              fontWeight: "var(--Font-Weight-Medium, 500)",
              lineHeight: "var(--Line-Height-24, 1.5rem)",
              letterSpacing: "var(--Letter-Spacing-0, 0)",
            }}
          >
            By signing, I confirm that I have read and therefore agree to all
            contractual terms, which become legally binding.
          </p>
        </div>

        {shouldShowError ? (
          <div
            className="flex items-start gap-4 bg-[#FFF0EF] px-6 py-4"
            role="alert"
          >
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F04D3F] text-sm font-bold text-white">
              !
            </span>

            <p
              style={{
                color: "var(--Light-Text-Negative, #E53935)",
                fontFamily: "var(--Font-Family-Inter, Inter)",
                fontSize: "var(--Font-Size-14, 0.875rem)",
                fontStyle: "normal",
                fontWeight: "var(--Font-Weight-Medium, 500)",
                lineHeight: "var(--Line-Height-20, 1.25rem)",
                letterSpacing: "var(--Letter-Spacing-0, 0)",
              }}
            >
              Please confirm that you agree to all terms before signing the
              contract.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
