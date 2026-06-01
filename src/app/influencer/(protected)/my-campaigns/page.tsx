"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronDown, Eye } from "lucide-react";
import { HiX } from "react-icons/hi";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { ManualPreviewCard } from "@/components/ui/cardPreview";
import Swal from "sweetalert2";
import api, { post } from "@/lib/api";
import { useRouter } from "next/navigation";
import CampaignFilter, {
  DEFAULT_DATE_FILTER,
  type DateFilterValue,
} from "@/components/ui/brand/CampaignFilter";
import { Checkbox } from "@/components/animate-ui/components/radix/checkbox";
import {
  apiGetAllCampaigns,
  apiGetAppliedCampaigns,
  apiGetContractedCampaigns,
  apiGetMyCampaigns,
} from "../../services/influencerApi";
import {
  CaretDown,
  CaretUp,
  DownloadSimpleIcon,
  InfoIcon,
  Signature,
  UploadSimple,
} from "@phosphor-icons/react";
import InfluencerSidebarShell from "./InfluencerSidebarShell";
import InfluencerSignatureModal from "./InfluencerSignatureModal";
import {
  apiGetPrimaryInfluencerSignature,
  apiListInfluencerSignatures,
  apiSetPrimaryInfluencerSignature,
  type InfluencerSignatureAsset,
} from "../../services/influencerSignatureApi";
import { FloatingInput } from "@/components/ui/floatingInput";
import {
  FloatingSelect,
  SelectItem,
} from "@/components/ui/selectComp";
import { LabeledTextarea } from "@/components/ui/textAreaComp";
import useInfluencerSidebarWidth from "./useSidebarWidth";

/* ─────────────────────────── Toast / Confirm ─────────────────────────── */

const toast = (opts: {
  icon: "success" | "error" | "info";
  title: string;
  text?: string;
}) =>
  Swal.fire({
    ...opts,
    showConfirmButton: false,
    timer: 1600,
    timerProgressBar: true,
    background: "white",
    customClass: { popup: "rounded-lg border border-gray-200" },
  });


function apiMessage(e: any, fallback = "Something went wrong") {
  const status = e?.response?.status;
  const msg = e?.response?.data?.message || e?.message;

  const known = [
    "Contract is locked and cannot be edited",
    "Contract is locked for signing; edits are disabled",
    "Influencer must accept the current version first",
    "Brand must accept the current version first",
    "Both parties must accept the current version before signing",
    "Contract is not ready to sign yet",
    "Contract not found",
    "Signature file must be 5 MB or less.",
    "Cannot resend a signed/locked contract",
  ];

  if (msg && known.some((k) => String(msg).includes(k))) return msg;
  if (status === 400) return msg || "Bad request.";
  if (status === 401) return "Please sign in again.";
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return "Not found.";
  if (status === 409) return msg || "Conflict. Please refresh.";
  if (status === 422) return msg || "Validation error.";
  if (status >= 500) return "Server error. Please try again.";
  return msg || fallback;
}

/* ─────────────────────────────── Types ─────────────────────────────── */

type CampaignImage = {
  name?: string;
  type?: string;
  size?: number;
  dataUrl?: string;
  url?: string;
};

interface CampaignData {
  id: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  daysLeft: number;
  match: number;
  category: string;
  platform: string;
  location: string;
  status: string;
  campaignStatus: string;
  brandId: string;
  brandName: string;
  productOrServiceName: string;
  timeline: { startDate: string; endDate: string };
  isActive: number;
  budget: number;
  influencerBudget?: number;
  isApproved: number;
  isContracted: number;
  contractId: string;
  contractMongoId?: string;
  isAccepted: number;
  hasApplied: number;
  hasMilestone: number;
  productImages: CampaignImage[];
  campaignType?: string;
  paymentType?: string;
  laneType?: string;
  targetCountry?: string;
  targetCountryValues?: string[];
  targetCountries?: any[];
  campaignGoalValues?: string[];
  targetAgeGroupValues?: string[];
  applicationStatus?: string;
  feeAmount?: number;
  contractStatus?: string | null;
}

const CONTRACT_STATUS = {
  DRAFT: "DRAFT",
  BRAND_SENT_DRAFT: "BRAND_SENT_DRAFT",
  BRAND_EDITED: "BRAND_EDITED",
  INFLUENCER_EDITED: "INFLUENCER_EDITED",
  BRAND_ACCEPTED: "BRAND_ACCEPTED",
  INFLUENCER_ACCEPTED: "INFLUENCER_ACCEPTED",
  READY_TO_SIGN: "READY_TO_SIGN",
  CONTRACT_SIGNED: "CONTRACT_SIGNED",
  MILESTONES_CREATED: "MILESTONES_CREATED",
  REJECTED: "REJECTED",
  SUPERSEDED: "SUPERSEDED",
} as const;

type ContractStatus = (typeof CONTRACT_STATUS)[keyof typeof CONTRACT_STATUS];

type PartyConfirm = {
  confirmed?: boolean;
  byUserId?: string;
  at?: string;
};

type PartyAcceptance = {
  accepted?: boolean;
  acceptedVersion?: number;
  at?: string;
  byUserId?: string;
};

type PartySign = {
  signed?: boolean;
  byUserId?: string;
  name?: string;
  email?: string;
  at?: string;
};

type ContractInfluencerContent = {
  legalName?: string;
  contactName?: string;
  postingHandleUrl?: string;
  email?: string;
  phone?: string;
  whatsApp?: string;
  taxFormType?: string;
  taxId?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipPostalCode?: string;
  country?: string;
  ftcAcknowledgement?: string;
  shipToName?: string;
  shipToAddress?: string;
  shipToPhone?: string;
  deliveryNotes?: string;
  notes?: string;
};

type ContractMeta = {
  _id?: string;
  status?: ContractStatus | string;
  confirmations?: { brand?: PartyConfirm; influencer?: PartyConfirm };
  acceptances?: { brand?: PartyAcceptance; influencer?: PartyAcceptance };
  signatures?: {
    brand?: PartySign;
    influencer?: PartySign;
    collabglam?: PartySign;
  };
  lockedAt?: string | null;
  editsLockedAt?: string | null;
  awaitingRole?: "brand" | "influencer" | "collabglam" | null | string;
  version?: number;
  campaignId?: string;
  contractId?: string;
  supersededBy?: string | null;
  resendOf?: string | null;
  resendIteration?: number;
  content?: {
    influencer?: ContractInfluencerContent;
    campaign?: {
      campaignTitleOrId?: string;
      productsServicesCovered?: string;
      paymentType?: string;
    };
  };
};

type LocalInfluencer = {
  legalName: string;
  contactName: string;
  postingHandleUrl: string;
  contactEmail: string;
  contactPhone: string;
  whatsApp: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  ftcAcknowledgement: string;
  shipToName: string;
  shipToAddress: string;
  shipToPhone: string;
  deliveryNotes: string;
  payoutMethod: string;
  payoutAccount: string;
  taxFormType: string;
  taxId: string;
  notes: string;
};

const emptyLocal: LocalInfluencer = {
  legalName: "",
  contactName: "",
  postingHandleUrl: "",
  contactEmail: "",
  contactPhone: "",
  taxFormType: "",
  taxId: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  zip: "",
  country: "",
  whatsApp: "",
  ftcAcknowledgement:
    "Both Parties must comply with applicable endorsement, advertising, and platform requirements. Influencer may not publish false, misleading, unsafe, or unsubstantiated claims",
  shipToName: "",
  shipToAddress: "",
  shipToPhone: "",
  deliveryNotes: "",
  payoutMethod: "",
  payoutAccount: "",
  notes: "",
};

type CreatorContractTerms = {
  effectiveDate: string;
  targetCountry: string;
  timezone: string;
  includedRevisionRounds: string;
  additionalRevisionFee: string;
  reshootNoBriefFailure: boolean;
  reshootOneIncluded: boolean;
  paidReshoot: boolean;
  draftDate: string;
  reshootFee: string;
  reshootObligationRequired: "" | "yes" | "no";
  preShootScriptRequired: "" | "yes" | "no";
  preShootScriptDue: string;
  preShootScriptReviewBusinessDays: string;
  influencerFee: string;
  currency: string;
  wantAdvancePayment: boolean;
  advancePaymentAmount: string;
  advancePaymentType: string;
  laneAMarketplaceFeeNote: string;
  shipToName: string;
  shipToAddress: string;
  productReceiptConfirmationDeadline: string;
  sameAsAbove: boolean;
  productReturnable: string;
};

const emptyCreatorTerms: CreatorContractTerms = {
  effectiveDate: "",
  targetCountry: "USA",
  timezone: "UTC+05:30 India",
  includedRevisionRounds: "0",
  additionalRevisionFee: "",
  reshootNoBriefFailure: true,
  reshootOneIncluded: false,
  paidReshoot: false,
  draftDate: "",
  reshootFee: "",
  reshootObligationRequired: "yes",
  preShootScriptRequired: "yes",
  preShootScriptDue: "",
  preShootScriptReviewBusinessDays: "0",
  influencerFee: "",
  currency: "USD",
  wantAdvancePayment: false,
  advancePaymentAmount: "",
  advancePaymentType: "",
  laneAMarketplaceFeeNote:
    "Unless expressly stated otherwise, 10% of the applicable Influencer compensation funded through the Platform is deducted from the Influencer payout and retained by CollabGlam; the Brand-funded campaign amount remains fixed.",
  shipToName: "",
  shipToAddress: "",
  productReceiptConfirmationDeadline: "",
  sameAsAbove: false,
  productReturnable: "",
};

const YES_NO_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const ADVANCE_PAYMENT_TYPE_OPTIONS = [
  { value: "Upfront before content creation", label: "Upfront before content creation" },
  { value: "After draft approval", label: "After draft approval" },
  { value: "After content goes live", label: "After content goes live" },
  { value: "Custom", label: "Custom" },
];

const PRODUCT_RETURNABLE_OPTIONS = [
  { value: "Gift / keep product", label: "Gift / keep product" },
  { value: "Returnable loaner", label: "Returnable loaner" },
];

/* ───────────────────────────── Helpers ───────────────────────────── */

const tabs = [
  { value: "all", label: "All" },
  { value: "applied", label: "Applied Campaigns" },
  { value: "active", label: "Active Campaigns" },
  { value: "Contracted", label: "Contracted" },
  { value: "Rejected", label: "Rejected" },
];

const trimStr = (s?: string) => (s || "").trim();
const normStatus = (s?: string) => String(s || "").trim().toUpperCase();

const sanitizeLocal = (p: LocalInfluencer): LocalInfluencer => ({
  legalName: trimStr(p.legalName),
  contactName: trimStr(p.contactName),
  postingHandleUrl: trimStr(p.postingHandleUrl),
  contactEmail: trimStr(p.contactEmail),
  contactPhone: trimStr(p.contactPhone),
  whatsApp: trimStr(p.whatsApp),
  addressLine1: trimStr(p.addressLine1),
  addressLine2: trimStr(p.addressLine2),
  city: trimStr(p.city),
  state: trimStr(p.state),
  zip: trimStr(p.zip),
  country: trimStr(p.country),
  ftcAcknowledgement: trimStr(p.ftcAcknowledgement),
  shipToName: trimStr(p.shipToName),
  shipToAddress: trimStr(p.shipToAddress),
  shipToPhone: trimStr(p.shipToPhone),
  deliveryNotes: trimStr(p.deliveryNotes),
  payoutMethod: trimStr(p.payoutMethod),
  payoutAccount: trimStr(p.payoutAccount),
  taxFormType: trimStr(p.taxFormType),
  taxId: trimStr(p.taxId),
  notes: trimStr(p.notes),
});

const toContractInfluencerPayload = (
  p: LocalInfluencer
): ContractInfluencerContent => ({
  legalName: p.legalName,
  contactName: p.contactName,
  postingHandleUrl: p.postingHandleUrl,
  email: p.contactEmail,
  phone: p.contactPhone,
  whatsApp: p.whatsApp,
  taxFormType: p.taxFormType,
  taxId: p.taxId,
  addressLine1: p.addressLine1,
  addressLine2: p.addressLine2,
  city: p.city,
  state: p.state,
  zipPostalCode: p.zip,
  country: p.country,
  ftcAcknowledgement: p.ftcAcknowledgement,
  shipToName: p.shipToName,
  shipToAddress: p.shipToAddress,
  shipToPhone: p.shipToPhone,
  deliveryNotes: p.deliveryNotes,
  notes: p.notes,
});

function hasAcceptedCurrent(
  meta: ContractMeta | null | undefined,
  role: "brand" | "influencer"
) {
  if (!meta) return false;
  const version = Number(meta.version || 0);
  const acceptance = meta.acceptances?.[role];
  return !!(
    acceptance?.accepted && Number(acceptance.acceptedVersion || 0) === version
  );
}

function isReadyToSignMeta(meta?: ContractMeta | null) {
  const st = normStatus(meta?.status);
  return st === CONTRACT_STATUS.READY_TO_SIGN || !!meta?.editsLockedAt;
}

function isLockedMeta(meta?: ContractMeta | null) {
  const st = normStatus(meta?.status);
  return (
    !!meta?.lockedAt ||
    st === CONTRACT_STATUS.CONTRACT_SIGNED ||
    st === CONTRACT_STATUS.MILESTONES_CREATED
  );
}

function isRejectedMeta(meta?: ContractMeta | null) {
  return normStatus(meta?.status) === CONTRACT_STATUS.REJECTED;
}

function isSupersededMeta(meta?: ContractMeta | null) {
  return normStatus(meta?.status) === CONTRACT_STATUS.SUPERSEDED;
}

function signingStatusLabel(meta?: ContractMeta | null) {
  if (!meta) return null;

  const st = normStatus(meta.status);
  if (st === CONTRACT_STATUS.MILESTONES_CREATED) return "Milestone Added";
  if (st === CONTRACT_STATUS.CONTRACT_SIGNED)
    return "Awaiting Milestone Creation";

  const isSigningPhase = isReadyToSignMeta(meta);
  if (!isSigningPhase) return null;

  const brandSigned = !!meta.signatures?.brand?.signed;
  const influencerSigned = !!meta.signatures?.influencer?.signed;
  const awaiting = String(meta.awaitingRole || "").toLowerCase();

  if (brandSigned && influencerSigned) return "Signed";
  if (awaiting === "brand") return "Awaiting brand signature";
  if (awaiting === "influencer") return "Awaiting influencer signature";
  if (awaiting === "collabglam") return "Awaiting CollabGlam";
  if (!brandSigned && !influencerSigned) return "Ready to sign";
  if (brandSigned && !influencerSigned) return "Awaiting influencer signature";
  if (!brandSigned && influencerSigned) return "Awaiting brand signature";
  return null;
}

function computeDaysLeft(endAt?: string) {
  if (!endAt) return 0;
  const end = new Date(endAt);
  const now = new Date();
  return Math.max(
    0,
    Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );
}

function getFirstString(...values: any[]) {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

function getCountryNameFromObject(item: any) {
  if (!item) return "";

  if (typeof item === "string") {
    return item.trim();
  }

  return getFirstString(
    item.countryNameEn,
    item.countryName,
    item.name,
    item.countryNameLocal,
    item.countryCode,
    item.label,
    item.value
  );
}

function joinCountryNames(value: any) {
  if (!value) return "";

  if (typeof value === "string") {
    return value.trim();
  }

  if (!Array.isArray(value)) return "";

  return value
    .map((item) => getCountryNameFromObject(item))
    .filter(Boolean)
    .join(", ");
}

function mapApiCampaign(c: any): CampaignData {
  const campaignDoc = c?.campaign || c?.campaignData || c || {};
  const isDirectContractDoc = Boolean(
    c?.influencerId &&
    c?.campaignId &&
    (c?.contractId || c?._id) &&
    !c?.campaignTitle &&
    !c?.campaignName
  );

  const contractMongoId = getFirstString(
    c?.contractMongoId,
    c?.contract?._id,
    c?.contracts?._id,
    isDirectContractDoc ? c?._id : ""
  );

  const resolvedContractId = getFirstString(
    contractMongoId,
    c?.contractId,
    c?.contract?.contractId,
    c?.contracts?.contractId
  );

  const platforms: string[] = Array.isArray(campaignDoc.platformSelection)
    ? campaignDoc.platformSelection
    : Array.isArray(c.platformSelection)
      ? c.platformSelection
      : [];

  const normPlatform = (p: string) =>
    p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : "";

  const title = getFirstString(
    campaignDoc.campaignTitle,
    campaignDoc.campaignName,
    campaignDoc.name,
    campaignDoc.productOrServiceName,
    c?.content?.campaign?.campaignTitleOrId
  );

  const category = getFirstString(
    campaignDoc.campaignCategory,
    campaignDoc.categoryName,
    campaignDoc.details?.category?.name,
    Array.isArray(campaignDoc.categories) && campaignDoc.categories.length > 0
      ? campaignDoc.categories[0]?.subcategoryName ||
      campaignDoc.categories[0]?.categoryName
      : ""
  );

  const startDate = getFirstString(
    campaignDoc.startAt,
    campaignDoc.timeline?.startDate
  );

  const endDate = getFirstString(
    campaignDoc.endAt,
    campaignDoc.timeline?.endDate
  );

  const images: CampaignImage[] = Array.isArray(campaignDoc.productImages)
    ? campaignDoc.productImages
    : Array.isArray(campaignDoc.images)
      ? campaignDoc.images
      : [];

  const countryFromValues = joinCountryNames(campaignDoc.targetCountryValues);
  const countryFromTopObjects = joinCountryNames(campaignDoc.targetCountries);
  const countryFromDetails = joinCountryNames(
    campaignDoc.details?.targetCountries
  );

  const location =
    getFirstString(
      campaignDoc.targetCountry,
      countryFromValues,
      countryFromTopObjects,
      countryFromDetails
    ) || "Remote";

  const id = isDirectContractDoc
    ? getFirstString(c?.campaignId)
    : getFirstString(
      campaignDoc._id,
      campaignDoc.id,
      campaignDoc.campaignId,
      c?.campaignId
    );

  const campaignType = getFirstString(
    campaignDoc.campaignType,
    c?.content?.campaign?.paymentType
  );

  const paymentType = getFirstString(
    campaignDoc.paymentType,
    c?.content?.campaign?.paymentType
  );

  const status = getFirstString(campaignDoc.status, c?.status);
  const campaignStatus = getFirstString(
    campaignDoc.campaignStatus,
    campaignDoc.status,
    c?.status
  );

  return {
    id,
    brandId: getFirstString(campaignDoc.brandId, c?.brandId),
    brandName: getFirstString(campaignDoc.brandName, c?.brandName),
    title,
    productOrServiceName: title,
    description: campaignDoc.description || "",
    budgetMin: Number(campaignDoc.influencerBudget || 0),
    budgetMax: Number(campaignDoc.campaignBudget || campaignDoc.budget || 0),
    budget: Number(campaignDoc.budget || campaignDoc.campaignBudget || 0),
    influencerBudget: Number(campaignDoc.influencerBudget ?? 0),
    daysLeft: computeDaysLeft(endDate),
    match: Number(campaignDoc.match ?? 0),
    category,
    platform: platforms.length > 0 ? normPlatform(platforms[0]) : campaignType,
    location,
    status,
    campaignStatus,
    contractId: resolvedContractId,
    contractMongoId,
    isContracted: Number(
      campaignDoc.isContracted ?? (resolvedContractId ? 1 : 0)
    ),
    campaignGoalValues: Array.isArray(campaignDoc.campaignGoalValues)
      ? campaignDoc.campaignGoalValues.filter(Boolean)
      : Array.isArray(campaignDoc.details?.campaignGoals)
        ? campaignDoc.details.campaignGoals
          .map((x: any) => x?.goal || x?.name || x?.label || "")
          .filter(Boolean)
        : [],

    targetAgeGroupValues: Array.isArray(campaignDoc.targetAgeGroupValues)
      ? campaignDoc.targetAgeGroupValues.filter(Boolean)
      : Array.isArray(campaignDoc.details?.targetAgeRanges)
        ? campaignDoc.details.targetAgeRanges
          .map((x: any) => x?.range || x?.name || x?.label || "")
          .filter(Boolean)
        : [],

    isAccepted: Number(campaignDoc.isAccepted ?? c?.isAccepted ?? 0),
    hasApplied: Number(campaignDoc.hasApplied ?? c?.hasApplied ?? 1),
    hasMilestone: Number(campaignDoc.hasMilestone ?? c?.hasMilestone ?? 0),
    productImages: images,
    timeline: { startDate, endDate },
    isActive: Number(campaignDoc.isActive ?? 1),
    isApproved: Number(
      campaignDoc.isApproved ?? campaignDoc.hasApproved ?? c?.hasApproved ?? 1
    ),
    campaignType,
    paymentType,
    laneType: campaignDoc.laneType,
    targetCountry: location,
    targetCountryValues: Array.isArray(campaignDoc.targetCountryValues)
      ? campaignDoc.targetCountryValues
      : location !== "Remote"
        ? [location]
        : [],
    targetCountries: Array.isArray(campaignDoc.targetCountries)
      ? campaignDoc.targetCountries
      : Array.isArray(campaignDoc.details?.targetCountries)
        ? campaignDoc.details.targetCountries
        : [],
    applicationStatus: campaignDoc.applicationStatus,
    feeAmount: Number(campaignDoc.feeAmount ?? c?.feeAmount ?? 0),
    contractStatus: campaignDoc.contractStatus ?? c?.contractStatus ?? null,
  };
}

function campaignToPreview(campaign: CampaignData) {
  const targetCountries =
    Array.isArray(campaign.targetCountryValues) &&
      campaign.targetCountryValues.length > 0
      ? campaign.targetCountryValues
      : campaign.location && campaign.location !== "Remote"
        ? [campaign.location]
        : [];

  const targetAgeGroups =
    Array.isArray(campaign.targetAgeGroupValues) &&
      campaign.targetAgeGroupValues.length > 0
      ? campaign.targetAgeGroupValues
      : [];

  const goals =
    Array.isArray(campaign.campaignGoalValues) &&
      campaign.campaignGoalValues.length > 0
      ? campaign.campaignGoalValues
      : [];

  return {
    form: {
      title: campaign.title,
      description: campaign.description,
      categoryName: campaign.category,
      targetCountry: targetCountries,
      targetAgeGroups,
      goals,
      campaignBudget: campaign.budgetMax,
      productImages: campaign.productImages,
    },
    meta: {
      countryMap: targetCountries.reduce<Record<string, string>>((acc, item) => {
        acc[item] = item;
        return acc;
      }, {}),
      ageMap: targetAgeGroups.reduce<Record<string, string>>((acc, item) => {
        acc[item] = item;
        return acc;
      }, {}),
      goalsMap: goals.reduce<Record<string, string>>((acc, item) => {
        acc[item] = item;
        return acc;
      }, {}),
      campaignBudget: campaign.budgetMax,
    },
  };
}

function toContractMeta(doc: any): ContractMeta {
  return {
    _id: doc?._id,
    status: doc?.status,
    confirmations: doc?.confirmations || {},
    acceptances: doc?.acceptances || {},
    signatures: doc?.signatures || {},
    lockedAt: doc?.lockedAt,
    editsLockedAt: doc?.editsLockedAt,
    awaitingRole: doc?.awaitingRole,
    version: doc?.version,
    campaignId: doc?.campaignId,
    contractId: doc?.contractId,
    supersededBy: doc?.supersededBy,
    resendOf: doc?.resendOf || null,
    resendIteration: doc?.resendIteration,
    content: doc?.content || {},
  };
}

function pickActiveContract(arr: any[], preferredContractId?: string) {
  const list = Array.isArray(arr) ? [...arr] : [];
  if (!list.length) return null;

  list.sort((a, b) => {
    const aTime = new Date(a?.createdAt || 0).getTime();
    const bTime = new Date(b?.createdAt || 0).getTime();
    return bTime - aTime;
  });

  let chosen =
    (preferredContractId
      ? list.find(
        (x) =>
          String(x._id) === String(preferredContractId) ||
          String(x.contractId) === String(preferredContractId)
      )
      : null) ||
    list.find((x) => normStatus(x.status) !== CONTRACT_STATUS.SUPERSEDED) ||
    list[0] ||
    null;

  if (chosen?.supersededBy) {
    const child = list.find(
      (x) =>
        String(x._id) === String(chosen.supersededBy) ||
        String(x.contractId) === String(chosen.supersededBy)
    );
    if (child) chosen = child;
  }

  return chosen;
}

/* ───────────────────────── Signature Modal ───────────────────────── */

function SignatureModal({
  open,
  onClose,
  onSubmit,
  title = "Sign Contract",
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (signatureDataUrl: string) => Promise<void> | void;
  title?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showAgreeError, setShowAgreeError] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setSignatureDataUrl("");
      setFileName("");
      setAgreed(false);
      setShowAgreeError(false);
      setErrorText("");
      setIsSubmitting(false);
    }
  }, [open]);

  const handleFile = async (file?: File | null) => {
    if (!file) return;

    const allowedTypes = [
      "image/svg+xml",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setErrorText("Only SVG, PNG, JPG, JPEG, or WEBP signatures are allowed.");
      setSignatureDataUrl("");
      setFileName("");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorText("Signature must be under 5 MB.");
      setSignatureDataUrl("");
      setFileName("");
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    setSignatureDataUrl(dataUrl);
    setFileName(file.name);
    setErrorText("");
  };

  const handleSubmit = async () => {
    if (!signatureDataUrl) {
      setErrorText("Please upload a signature before continuing.");
      return;
    }

    if (!agreed) {
      setShowAgreeError(true);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(signatureDataUrl);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[560px] rounded-[24px] bg-white p-5 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-[24px] font-semibold text-[#1A1A1A]">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100 disabled:opacity-60"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".svg,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className="rounded-[16px] bg-[#F8F8F8] px-4 py-6"
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting}
            className="flex min-h-[220px] w-full flex-col items-center justify-center gap-3 disabled:opacity-60"
          >
            {signatureDataUrl ? (
              <img
                src={signatureDataUrl}
                alt="Influencer signature"
                className="max-h-[140px] max-w-full object-contain"
              />
            ) : (
              <>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EDEDED]">
                  <UploadSimple size={22} />
                </span>

                <div className="text-center">
                  <div className="text-base font-semibold text-[#1A1A1A] underline">
                    Upload signature{" "}
                    <span className="font-normal text-[#9C9C9C] no-underline">
                      or drag and drop
                    </span>
                  </div>

                  <div className="mt-1 text-sm text-[#B8B8B8]">
                    SVG, PNG, JPG under max 5 MB
                  </div>
                </div>
              </>
            )}
          </button>

          {fileName ? (
            <div className="mt-3 truncate text-center text-xs text-[#9C9C9C]">
              {fileName}
            </div>
          ) : null}
        </div>

        <p className="mt-5 text-base text-[#9C9C9C]">
          This contract will be signed using your influencer signature.
        </p>

        <div
          className={`mt-5 overflow-hidden rounded-[14px] border bg-white ${showAgreeError && !agreed ? "border-[#FFE1DF]" : "border-[#E6E6E6]"
            }`}
        >
          <div className="flex items-center gap-4 px-5 py-6">
            <Switch
              checked={agreed}
              onCheckedChange={(checked) => {
                setAgreed(checked === true);
                if (checked) setShowAgreeError(false);
              }}
              className="shrink-0"
            />

            <p className="m-0 flex-1 text-sm font-medium leading-6 text-[#1A1A1A]">
              By signing, I confirm that I have read and therefore agree to all
              contractual terms, which become legally binding.
            </p>
          </div>

          {showAgreeError && !agreed ? (
            <div className="flex items-start gap-3 bg-[#FFF0EF] px-5 py-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F04D3F] text-sm font-bold text-white">
                !
              </span>

              <p className="text-sm font-medium leading-5 text-[#E53935]">
                Please confirm that you agree to all terms before signing.
              </p>
            </div>
          ) : null}
        </div>

        {errorText ? (
          <div className="mt-5 rounded-[12px] bg-[#FFF0EF] px-4 py-3 text-sm font-medium text-[#E53935]">
            {errorText}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !signatureDataUrl}
          >
            {isSubmitting ? "Signing..." : "Sign Contract"}
          </Button>
        </div>
      </div>
    </div>
  );
}


/* ───────────────────────── Reject Modal/Button ───────────────────────── */

function RejectButton({
  contractId,
  onDone,
  autoOpen = false,
  onClose: onCloseProp,
}: {
  contractId: string;
  onDone: () => void;
  autoOpen?: boolean;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(autoOpen);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (autoOpen) setOpen(true);
  }, [autoOpen]);

  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 0);
    } else {
      setReason("");
      setIsSubmitting(false);
    }
  }, [open]);

  const handleClose = () => {
    if (isSubmitting) return;
    setOpen(false);
    onCloseProp?.();
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, isSubmitting]);

  const submit = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const influencerId =
        typeof window !== "undefined"
          ? localStorage.getItem("influencerId")
          : null;

      if (!influencerId) throw new Error("No influencer ID.");

      await post("/contract/reject", {
        contractId,
        influencerId,
        reason: reason.trim(),
      });

      toast({
        icon: "info",
        title: "Rejected",
        text: "Contract has been rejected.",
      });

      handleClose();
      onDone();
    } catch (e: any) {
      toast({
        icon: "error",
        title: "Error",
        text: apiMessage(e, "Failed to reject contract."),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {!autoOpen && (
        <button
          onClick={() => setOpen(true)}
          className="flex-1 py-2 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium border border-red-200 transition-colors"
        >
          Reject
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center">
          <div
            className={`absolute inset-0 backdrop-blur-sm bg-gray-900/30 ${isSubmitting ? "pointer-events-none" : ""
              }`}
            onClick={handleClose}
          />

          <div className="relative z-10 w-[92vw] max-w-lg rounded-xl bg-white shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Reject Contract
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  Let the brand know why you're rejecting this contract.
                </p>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-md p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
              >
                <HiX size={22} />
              </button>
            </div>

            <div className="px-4 sm:px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (optional)
              </label>
              <textarea
                ref={textareaRef}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isSubmitting}
                className="w-full min-h-[110px] max-h-[40vh] resize-y p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-60"
                placeholder="Write your reason..."
              />
            </div>

            <div className="px-4 sm:px-6 py-4 border-t bg-gray-50 rounded-b-xl">
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={submit}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
                >
                  {isSubmitting ? "Rejecting..." : "Reject"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}



function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
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
        "cg-accordion rounded-[20px] border border-[#E6E6E6] bg-white",
        open ? "cg-accordion--open" : "cg-accordion--closed"
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="cg-accordion-btn flex w-full items-start gap-4 px-5 py-5 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="cg-accordion-title text-xl font-semibold text-[#1A1A1A]">
            {title}
          </div>

          {subtitle ? (
            <div className="cg-accordion-subtitle mt-1 text-sm leading-5 text-[#8A8A8A]">
              {subtitle}
            </div>
          ) : null}
        </div>

        <span className="mt-[6px] shrink-0 text-neutral-900">
          {open ? <CaretUp size={20} /> : <CaretDown size={20} />}
        </span>
      </button>

      {open ? <div className="px-5 pb-5 pt-0">{children}</div> : null}
    </div>
  );
}


function InfluencerSignatureSection({
  signatureSrc,
  hasSignature,
  agreed,
  onAgreeChange,
  showError,
  onManageSignatures,
}: {
  signatureSrc?: string;
  hasSignature: boolean;
  agreed: boolean;
  onAgreeChange: (checked: boolean) => void;
  showError: boolean;
  onManageSignatures: () => void;
}) {
  const shouldShowError = showError && !agreed;

  return (
    <div id="influencer-signature-section" className="space-y-5">
      <div className="rounded-[24px] bg-[#F8F8F8] px-4 pb-5 pt-6">
        <button
          type="button"
          onClick={onManageSignatures}
          className="flex min-h-[130px] w-full items-center justify-center rounded-[20px]"
        >
          {hasSignature ? (
            signatureSrc ? (
              <img
                src={signatureSrc}
                alt="Influencer signature"
                className="max-h-[105px] max-w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-neutral-400">
                <Signature className="h-16 w-16 text-black" />
                <span className="text-sm text-[#9C9C9C]">
                  Signature on file
                </span>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center gap-2 text-neutral-400">
              <UploadSimple size={32} />
              <span className="text-sm">
                Click to upload influencer signature
              </span>
            </div>
          )}
        </button>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-[#9C9C9C]">
            <InfoIcon size={16} />
            <span>
              {hasSignature
                ? "Signature is selected as primary"
                : "No influencer signature selected"}
            </span>
          </div>

          <button
            type="button"
            onClick={onManageSignatures}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#1F1F1F]"
          >
            {hasSignature ? "Change signature" : "Add signature"}
            <CaretDown size={16} weight="bold" />
          </button>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-[14px] border bg-white",
          shouldShowError ? "border-[#FFE1DF]" : "border-[#E6E6E6]"
        )}
      >
        <div className="flex items-center gap-4 px-5 py-6">
          <Switch
            checked={agreed}
            onCheckedChange={(checked) => onAgreeChange(checked === true)}
            aria-invalid={shouldShowError}
            className="shrink-0"
          />

          <p className="m-0 flex-1 text-sm font-medium leading-6 text-[#1A1A1A]">
            By signing, I confirm that I have read and therefore agree to all
            contractual terms, which become legally binding.
          </p>
        </div>

        {shouldShowError ? (
          <div className="flex items-start gap-3 bg-[#FFF0EF] px-5 py-4">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F04D3F] text-sm font-bold text-white">
              !
            </span>

            <p className="text-sm font-medium leading-5 text-[#E53935]">
              Please confirm that you agree to all terms before signing.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ───────────────────────── Contract Modal ───────────────────────── */

const getInfluencerId = () => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("influencerId") || "";
};

const fileToDataUrl = (file: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const getSignaturePreviewFromPayload = (res: any) => {
  return (
    res?.signature ||
    res?.signatureData ||
    res?.signatureDataUrl ||
    res?.signatureUrl ||
    res?.url ||
    res?.signature?.signature ||
    res?.signature?.signatureData ||
    res?.signature?.signatureDataUrl ||
    res?.signature?.signatureUrl ||
    res?.signature?.url ||
    ""
  );
};


function toInputDate(value?: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const toYesNoValue = (value: any): "" | "yes" | "no" => {
  if (value === true) return "yes";
  if (value === false) return "no";
  const text = String(value ?? "").trim().toLowerCase();
  if (["yes", "true", "1", "required", "needed"].includes(text)) return "yes";
  if (["no", "false", "0", "not required", "not needed"].includes(text)) return "no";
  return "";
};

const buildAddressText = (data: LocalInfluencer) =>
  [data.addressLine1, data.addressLine2, data.city, data.state, data.zip, data.country]
    .filter(Boolean)
    .join(", ");

function getContractInfluencerFeeValue(commercial: any) {
  const influencerFee = commercial?.influencerFee;
  if (
    influencerFee !== undefined &&
    influencerFee !== null &&
    String(influencerFee).trim() !== ""
  ) {
    return String(influencerFee);
  }

  const influencerBudget = commercial?.influencerBudget;
  if (
    influencerBudget !== undefined &&
    influencerBudget !== null &&
    String(influencerBudget).trim() !== ""
  ) {
    return String(influencerBudget);
  }

  return "";
}

function createCreatorTermsFromContract(contract: any, fallback: LocalInfluencer): CreatorContractTerms {
  const content = contract?.content || {};
  const campaignContent = content?.campaign || {};
  const scheduleA = content?.scheduleA || {};
  const review = scheduleA?.review || {};
  const commercial = scheduleA?.commercial || {};
  const shipping = scheduleA?.shipping || {};
  const reshootText = String(review?.reshootObligation || "");

  return {
    ...emptyCreatorTerms,
    effectiveDate: toInputDate(campaignContent?.effectiveDate || contract?.requestedEffectiveDate || ""),
    targetCountry: String(campaignContent?.territoryTargetCountry || fallback.country || emptyCreatorTerms.targetCountry),
    timezone: String(campaignContent?.timezone || contract?.requestedEffectiveDateTimezone || emptyCreatorTerms.timezone),
    includedRevisionRounds: String(review?.includedRevisionRounds ?? emptyCreatorTerms.includedRevisionRounds),
    additionalRevisionFee: String(review?.additionalRevisionFee || ""),
    reshootNoBriefFailure:
      !reshootText || /material failure|brief/i.test(reshootText),
    reshootOneIncluded: /one reshoot included/i.test(reshootText),
    paidReshoot: /paid/i.test(reshootText),
    draftDate: String(review?.draftDate || ""),
    reshootFee: String(review?.reshootFee || ""),
    reshootObligationRequired: toYesNoValue(review?.reshootObligationRequired ?? true) || "yes",
    preShootScriptRequired: toYesNoValue(scheduleA?.preShootScriptRequired) || "yes",
    preShootScriptDue: String(scheduleA?.preShootScriptDue || ""),
    preShootScriptReviewBusinessDays: String(scheduleA?.preShootScriptReviewBusinessDays ?? "0"),
    influencerFee: getContractInfluencerFeeValue(commercial),
    currency: "USD",
    wantAdvancePayment: Boolean(commercial?.wantAdvancePayment),
    advancePaymentAmount: String(commercial?.advancePaymentAmount || ""),
    advancePaymentType: String(commercial?.advancePaymentType || ""),
    laneAMarketplaceFeeNote:
      String(commercial?.laneAMarketplaceFeeNote || emptyCreatorTerms.laneAMarketplaceFeeNote),
    shipToName: String(shipping?.shipToName || fallback.legalName || fallback.contactName || ""),
    shipToAddress: String(
      shipping?.shipToAddress || buildAddressText(fallback) || fallback.shipToAddress || ""
    ),
    productReceiptConfirmationDeadline: String(
      shipping?.productReceiptConfirmationDeadline || ""
    ),
    sameAsAbove: false,
    productReturnable: String(shipping?.productReturnable || ""),
  };
}

function buildReshootObligationText(terms: CreatorContractTerms) {
  const items: string[] = [];
  if (terms.reshootNoBriefFailure) {
    items.push("No reshoot required except for material failure to follow approved brief.");
  }
  if (terms.reshootOneIncluded) items.push("One reshoot included");
  if (terms.paidReshoot) items.push("Paid reshoot");
  return items.join("\n");
}

function buildCreatorContractUpdatePayload(
  local: LocalInfluencer,
  terms: CreatorContractTerms
) {
  const reshootObligation = buildReshootObligationText(terms);
  const influencerFeeRaw = String(terms.influencerFee ?? "").trim();
  const influencerFee = influencerFeeRaw ? Number(influencerFeeRaw) || 0 : "";

  return {
    content: {
      campaign: {
        effectiveDate: terms.effectiveDate || null,
        territoryTargetCountry: terms.targetCountry || "USA",
        timezone: terms.timezone || "UTC+05:30 India",
      },
      scheduleA: {
        preShootScriptRequired: terms.preShootScriptRequired === "yes",
        preShootScriptDue: terms.preShootScriptDue || "",
        preShootScriptReviewBusinessDays:
          Number(terms.preShootScriptReviewBusinessDays || "0") || 0,
        review: {
          includedRevisionRounds:
            Number(terms.includedRevisionRounds || "0") || 0,
          additionalRevisionFee: String(terms.additionalRevisionFee || ""),
          reshootObligation,
          reshootObligationRequired: terms.reshootObligationRequired || "yes",
          draftDate: terms.draftDate || "",
          reshootFee: String(terms.reshootFee || ""),
        },
        commercial: {
          influencerFee,
          influencerBudget: influencerFee,
          currency: "USD",

          wantAdvancePayment: Boolean(terms.wantAdvancePayment),
          advancePaymentAmount: terms.wantAdvancePayment
            ? Number(terms.advancePaymentAmount || "0") || 0
            : 0,
          advancePaymentType: terms.wantAdvancePayment
            ? terms.advancePaymentType || ""
            : "",

          paymentStructure: terms.wantAdvancePayment
            ? terms.advancePaymentType || "Advance payment requested"
            : "No advance payment",
          platformMilestonePaymentStructure: terms.wantAdvancePayment
            ? terms.advancePaymentType || "Advance payment requested"
            : "No advance payment",
          customSplit: terms.wantAdvancePayment
            ? terms.advancePaymentType || ""
            : "",

          advancePaymentTrigger: terms.wantAdvancePayment
            ? "Advance payment requested by influencer"
            : "",
          remainingPaymentTrigger: terms.wantAdvancePayment
            ? "Remaining amount payable after completion"
            : "",

          laneAMarketplaceFeeNote: terms.laneAMarketplaceFeeNote || "",
        },
        shipping: {
          productShippingApplicable: "Yes",
          shipToName: terms.shipToName || local.legalName || "",
          shipToAddress: terms.sameAsAbove
            ? buildAddressText(local)
            : terms.shipToAddress || "",
          productReceiptConfirmationDeadline:
            terms.productReceiptConfirmationDeadline || "",
          productReturnable: terms.productReturnable || "",
        },
      },
    },
  };
}


function InfluencerContractModal({
  open,
  onClose,
  contractId,
  campaign,
  readOnly = false,
  onAfterAction,
  sidebarOffset = 0,
}: {
  open: boolean;
  onClose: () => void;
  contractId: string;
  campaign: CampaignData;
  readOnly?: boolean;
  onAfterAction?: () => void;
  sidebarOffset?: number;
}) {
  const [local, setLocal] = useState<LocalInfluencer>(emptyLocal);
  const [creatorTerms, setCreatorTerms] = useState<CreatorContractTerms>(emptyCreatorTerms);
  const [creatorErrors, setCreatorErrors] = useState<Record<string, string>>({});
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const initialPreviewLoadedForRef = useRef("");
  const [isWorking, setIsWorking] = useState(false);
  const [liteLoaded, setLiteLoaded] = useState(false);
  const [effectiveContractId, setEffectiveContractId] =
    useState<string>(contractId);
  const [savedSignatureId, setSavedSignatureId] = useState("");
  const [meta, setMeta] = useState<ContractMeta | null>(null);
  const [showInfluencerSignatureModal, setShowInfluencerSignatureModal] = useState(false);
  const [signatureModalInitialTab, setSignatureModalInitialTab] =
    useState<"upload" | "manage">("upload");
  const [signatureChecked, setSignatureChecked] = useState(false);
  const [signatureAgreeError, setSignatureAgreeError] = useState(false);
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [savedSignatureUrl, setSavedSignatureUrl] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof LocalInfluencer, string>>
  >({});
  const influencerAccepted = hasAcceptedCurrent(meta, "influencer");
  const brandAccepted = hasAcceptedCurrent(meta, "brand");
  const brandSigned = !!meta?.signatures?.brand?.signed;
  const influencerSigned = !!meta?.signatures?.influencer?.signed;
  const anyoneSigned = brandSigned || influencerSigned;
  const readyToSign = isReadyToSignMeta(meta);
  const locked = isLockedMeta(meta);
  const rejected = isRejectedMeta(meta);
  const superseded = isSupersededMeta(meta);
  const campaignType: "fixed" | "milestone" | "gifting" =
    (campaign as any).campaignType ??
    (campaign as any).paymentType ??
    (campaign as any).laneType ??
    "fixed";
  const router = useRouter();
  const isGifting = campaignType === "gifting";

  const canEdit = useMemo(() => {
    if (readOnly) return false;
    if (locked || readyToSign) return false;
    if (rejected || superseded) return false;
    if (anyoneSigned) return false;
    return true;
  }, [readOnly, locked, readyToSign, rejected, superseded, anyoneSigned]);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{7,15}$/;
  const zipRegex = /^\d{4,10}$/;

  const validateOptionalInfluencerForm = useCallback(
    (
      data: LocalInfluencer,
      options: { requireRequiredFields?: boolean } = {}
    ) => {
      const v = sanitizeLocal(data);
      const errors: Partial<Record<keyof LocalInfluencer, string>> = {};
      const requireRequiredFields = Boolean(options.requireRequiredFields);

      if (requireRequiredFields) {
        if (!v.legalName) {
          errors.legalName = "Creator legal name is required.";
        }

        if (!v.postingHandleUrl) {
          errors.postingHandleUrl = "Creator posting handle URL is required.";
        }

        if (!v.contactEmail) {
          errors.contactEmail = "Creator email/contact is required.";
        }
      }

      if (v.contactEmail && !emailRegex.test(v.contactEmail)) {
        errors.contactEmail = "Enter a valid email address.";
      }

      if (v.contactPhone && !phoneRegex.test(v.contactPhone)) {
        errors.contactPhone = "Phone number must be 7 to 15 digits.";
      }

      if (v.zip && !zipRegex.test(v.zip)) {
        errors.zip = "ZIP / Postal Code must be 4 to 10 digits.";
      }

      if (v.taxFormType && !["W-9", "W-8"].includes(v.taxFormType)) {
        errors.taxFormType = "Select a valid tax form type.";
      }

      if (v.postingHandleUrl) {
        const looksLikeUrl =
          /^https?:\/\/.+/i.test(v.postingHandleUrl) ||
          /^www\..+/i.test(v.postingHandleUrl) ||
          /^@?[A-Za-z0-9._-]+$/.test(v.postingHandleUrl);

        if (!looksLikeUrl) {
          errors.postingHandleUrl = "Enter a valid profile URL or handle.";
        }
      }

      if (v.shipToPhone && !phoneRegex.test(v.shipToPhone)) {
        errors.shipToPhone = "Shipping phone must be 7 to 15 digits.";
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors,
        sanitized: v,
      };
    },
    []
  );

  const validateCreatorTerms = useCallback((data: CreatorContractTerms) => {
    const errors: Record<string, string> = {};

    if (!String(data.effectiveDate || "").trim()) {
      errors.effectiveDate = "Effective date is required.";
    }

    if (!String(data.targetCountry || "").trim()) {
      errors.targetCountry = "Target country is required.";
    }

    const revisionCount = Number(data.includedRevisionRounds || "0");
    if (Number.isNaN(revisionCount) || revisionCount < 0) {
      errors.includedRevisionRounds = "Revision rounds must be 0 or greater.";
    }

    const revisionFee = Number(data.additionalRevisionFee || "0");
    if (data.additionalRevisionFee && (Number.isNaN(revisionFee) || revisionFee < 0)) {
      errors.additionalRevisionFee = "Additional revision fees must be 0 or greater.";
    }

    const influencerFeeRaw = String(data.influencerFee ?? "").trim();
    const influencerFee = Number(influencerFeeRaw);
    if (!influencerFeeRaw) {
      errors.influencerFee = "Influencer fee is required.";
    } else if (Number.isNaN(influencerFee) || influencerFee < 0) {
      errors.influencerFee = "Influencer fee must be 0 or greater.";
    }

    if (data.wantAdvancePayment) {
      const advanceAmount = Number(data.advancePaymentAmount || "0");
      if (Number.isNaN(advanceAmount) || advanceAmount <= 0) {
        errors.advancePaymentAmount = "Advance payment amount is required.";
      }
      if (!String(data.advancePaymentType || "").trim()) {
        errors.advancePaymentType = "Advance payment type is required.";
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }, []);

  const cleanupPreview = useCallback(() => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
    setPreviewBlob(null);
  }, []);

  const refreshInfluencerSignature = useCallback(async (): Promise<{
    signatureId: string;
    signatureUrl: string;
  }> => {
    const influencerId = getInfluencerId();

    if (!influencerId) {
      setSavedSignatureId("");
      setSavedSignatureUrl("");
      return { signatureId: "", signatureUrl: "" };
    }

    try {
      const primarySignature = await apiGetPrimaryInfluencerSignature(influencerId);

      if (primarySignature?.signature) {
        setSavedSignatureId(primarySignature._id || "");
        setSavedSignatureUrl(primarySignature.signature || "");

        return {
          signatureId: primarySignature._id || "",
          signatureUrl: primarySignature.signature || "",
        };
      }
    } catch {
      // Primary signature missing. Fallback to active list below.
    }

    try {
      const result = await apiListInfluencerSignatures(influencerId);
      const rows = Array.isArray(result.signatures) ? result.signatures : [];
      const fallbackSignature = rows.find((item) => item.isPrimary) || rows[0] || null;

      if (fallbackSignature?.signature) {
        setSavedSignatureId(fallbackSignature._id || "");
        setSavedSignatureUrl(fallbackSignature.signature || "");

        if (!fallbackSignature.isPrimary && fallbackSignature._id) {
          apiSetPrimaryInfluencerSignature(influencerId, fallbackSignature._id).catch(
            () => undefined
          );
        }

        return {
          signatureId: fallbackSignature._id || "",
          signatureUrl: fallbackSignature.signature || "",
        };
      }
    } catch {
      // Ignore and clear below.
    }

    setSavedSignatureId("");
    setSavedSignatureUrl("");
    return { signatureId: "", signatureUrl: "" };
  }, []);

  const openInfluencerSignatureModal = useCallback(
    async (tab: "upload" | "manage" = "upload") => {
      const influencerId = getInfluencerId();

      if (!influencerId) {
        toast({
          icon: "error",
          title: "Missing influencer",
          text: "Influencer ID not found.",
        });
        return;
      }

      setSignatureModalInitialTab(tab);
      setShowInfluencerSignatureModal(true);

      refreshInfluencerSignature().catch(() => undefined);
    },
    [refreshInfluencerSignature]
  );

  const handleInfluencerSignatureSelected = useCallback(
    (signature: InfluencerSignatureAsset) => {
      setSavedSignatureId(signature._id || "");
      setSavedSignatureUrl(signature.signature || "");
      setSignatureAgreeError(false);
      setShowInfluencerSignatureModal(false);
    },
    []
  );

  useEffect(() => {
    if (!open) return;
    refreshInfluencerSignature().catch(() => undefined);
  }, [open, refreshInfluencerSignature]);

  const hasInfluencerSignature = Boolean(savedSignatureId || savedSignatureUrl);

  const toLocalFromLite = useCallback((lite: any): LocalInfluencer => {
    const primary = (lite?.primaryPlatform || "").toLowerCase();
    const profiles: any[] = Array.isArray(lite?.socialProfiles)
      ? lite.socialProfiles
      : [];

    const match =
      profiles.find((p) => (p?.provider || "").toLowerCase() === primary) ||
      profiles[0] ||
      {};

    const bestName =
      lite?.legalName || lite?.name || match?.fullname || match?.username || "";

    const bestHandle =
      lite?.handle ||
      lite?.profileUrl ||
      match?.profileUrl ||
      match?.username ||
      "";

    return {
      legalName: bestName,
      contactName: bestName,
      postingHandleUrl: bestHandle,
      contactEmail: lite?.email || "",
      contactPhone: lite?.phone || "",
      whatsApp: lite?.whatsapp || "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      taxFormType: "",
      taxId: "",
      ftcAcknowledgement: "",
      shipToName: "",
      shipToAddress: "",
      shipToPhone: "",
      deliveryNotes: "",
      payoutMethod: "",
      payoutAccount: "",
      notes: "",
    };
  }, []);

  const fetchInfluencerLite = useCallback(async () => {
    try {
      const influencerId =
        typeof window !== "undefined"
          ? localStorage.getItem("influencerId")
          : null;

      if (!influencerId) throw new Error("No influencer ID.");

      const res = await api.get("/influencer/lite", {
        params: { influencerId },
      });

      const liteLocal = toLocalFromLite(res.data?.influencer || {});

      setLocal((prev) =>
        sanitizeLocal({
          ...prev,
          legalName: prev.legalName || liteLocal.legalName,
          contactName: prev.contactName || liteLocal.contactName,
          postingHandleUrl: prev.postingHandleUrl || liteLocal.postingHandleUrl,
          contactEmail: prev.contactEmail || liteLocal.contactEmail,
          contactPhone: prev.contactPhone || liteLocal.contactPhone,
          whatsApp: prev.whatsApp || liteLocal.whatsApp,
          taxFormType: prev.taxFormType || liteLocal.taxFormType,
          taxId: prev.taxId || liteLocal.taxId,
        })
      );
    } catch (e: any) {
      console.warn("lite fetch failed", e?.message);
    } finally {
      setLiteLoaded(true);
    }
  }, [toLocalFromLite]);

  const fetchContractMeta = useCallback(async () => {
    try {
      const influencerId =
        typeof window !== "undefined"
          ? localStorage.getItem("influencerId")
          : null;

      if (!influencerId) throw new Error("No influencer ID.");

      const res = await post<{ success?: boolean; contracts: any[] }>(
        "/contract/getContract",
        {
          brandId: campaign.brandId,
          influencerId,
          campaignId: campaign.id,
        }
      );

      const arr = Array.isArray((res as any)?.contracts)
        ? (res as any).contracts
        : [];

      const chosen = pickActiveContract(arr, contractId);

      if (chosen) {
        const nextMeta = toContractMeta(chosen);
        setMeta(nextMeta);
        setEffectiveContractId(nextMeta._id || nextMeta.contractId || contractId);

        const contentInfluencer = chosen?.content?.influencer || {};
        setLocal((prev) => {
          const nextLocal = sanitizeLocal({
            ...prev,
            legalName: contentInfluencer.legalName ?? prev.legalName,
            contactName:
              contentInfluencer.contactName ??
              contentInfluencer.legalName ??
              prev.contactName,
            postingHandleUrl:
              contentInfluencer.postingHandleUrl ?? prev.postingHandleUrl,
            contactEmail: contentInfluencer.email ?? prev.contactEmail,
            contactPhone: contentInfluencer.phone ?? prev.contactPhone,
            whatsApp: contentInfluencer.whatsApp ?? prev.whatsApp,
            addressLine1: contentInfluencer.addressLine1 ?? prev.addressLine1,
            addressLine2: contentInfluencer.addressLine2 ?? prev.addressLine2,
            city: contentInfluencer.city ?? prev.city,
            state: contentInfluencer.state ?? prev.state,
            zip: contentInfluencer.zipPostalCode ?? prev.zip,
            country: contentInfluencer.country ?? prev.country,
            taxFormType: contentInfluencer.taxFormType ?? prev.taxFormType,
            taxId: contentInfluencer.taxId ?? prev.taxId,
            notes: contentInfluencer.notes ?? prev.notes,
            ftcAcknowledgement:
              contentInfluencer.ftcAcknowledgement ?? prev.ftcAcknowledgement,
            shipToName: contentInfluencer.shipToName ?? prev.shipToName,
            shipToAddress: contentInfluencer.shipToAddress ?? prev.shipToAddress,
            shipToPhone: contentInfluencer.shipToPhone ?? prev.shipToPhone,
            deliveryNotes: contentInfluencer.deliveryNotes ?? prev.deliveryNotes,
          });
          setCreatorTerms(createCreatorTermsFromContract(chosen, nextLocal));
          return nextLocal;
        });
      } else {
        setMeta(null);
        setEffectiveContractId(contractId);
        setCreatorTerms(emptyCreatorTerms);
      }
    } catch {
      setMeta(null);
      setEffectiveContractId(contractId);
      setCreatorTerms(emptyCreatorTerms);
    }
  }, [campaign.brandId, campaign.id, contractId]);

  const markViewed = useCallback(async (id: string) => {
    try {
      console.log("markViewed", id);
      await post("/contract/viewed", { contractId: id, role: "influencer" });
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    initialPreviewLoadedForRef.current = "";
    cleanupPreview();

    setFieldErrors({});
    setCreatorErrors({});
    setSignatureAgreeError(false);
    setSignatureChecked(false);

    setLocal(emptyLocal);
    setCreatorTerms(emptyCreatorTerms);
    setLiteLoaded(false);

    async function hydrateModal() {
      await fetchInfluencerLite();
      if (cancelled) return;

      await fetchContractMeta();
      if (cancelled) return;

      await refreshInfluencerSignature().catch(() => undefined);
    }

    hydrateModal();

    return () => {
      cancelled = true;
      cleanupPreview();
    };
  }, [
    open,
    fetchInfluencerLite,
    fetchContractMeta,
    refreshInfluencerSignature,
    cleanupPreview,
  ]);

  useEffect(() => {
    if (!open || !effectiveContractId) return;
    console.log("effectiveContractId", effectiveContractId);
    markViewed(effectiveContractId);
  }, [open, effectiveContractId, markViewed]);

  const loadSavedPreview = useCallback(
    async (silent = true, contractIdOverride?: string) => {
      const id = contractIdOverride || effectiveContractId;
      if (!id) return;

      setIsWorking(true);

      try {
        const res = await api.post(
          "/contract/viewPdf",
          { contractId: id },
          { responseType: "blob" }
        );

        cleanupPreview();

        const blob = res.data as Blob;
        const url = URL.createObjectURL(blob);

        setPreviewBlob(blob);
        setPreviewUrl(url);

        if (!silent) {
          toast({ icon: "info", title: "PDF loaded" });
        }
      } catch (e: any) {
        if (!silent) {
          toast({
            icon: "error",
            title: "Preview Error",
            text: apiMessage(e, "Failed to load PDF."),
          });
        }
      } finally {
        setIsWorking(false);
      }
    },
    [effectiveContractId, cleanupPreview]
  );

  const generatePreview = useCallback(
    async (silent = false) => {
      setIsWorking(true);

      try {
        const sanitized = sanitizeLocal(local);

        const optionalValidation = validateOptionalInfluencerForm(sanitized, {
          requireRequiredFields: true,
        });

        const creatorValidation = validateCreatorTerms(creatorTerms);

        setFieldErrors(optionalValidation.errors);
        setCreatorErrors(creatorValidation.errors);

        if (!optionalValidation.isValid || !creatorValidation.isValid) {
          toast({
            icon: "error",
            title: "Invalid form",
            text: "Please fix the highlighted fields before preview.",
          });
          return;
        }

        const payload = toContractInfluencerPayload(optionalValidation.sanitized);

        const creatorUpdates = buildCreatorContractUpdatePayload(
          optionalValidation.sanitized,
          creatorTerms
        );

        const res = await api.post(
          "/contract/influencer/confirm",
          {
            contractId: effectiveContractId,
            influencer: payload,
            creatorUpdates,
            signatureInfluencer: savedSignatureUrl || "",
            signatureInfluencerId: savedSignatureId || "",
            savedSignatureId: savedSignatureId || "",
            preview: true,
          },
          { responseType: "blob" }
        );

        cleanupPreview();

        const blob = res.data as Blob;
        const url = URL.createObjectURL(blob);

        setPreviewBlob(blob);
        setPreviewUrl(url);

        if (!silent) {
          toast({ icon: "info", title: "Preview updated" });
        }
      } catch (e: any) {
        toast({
          icon: "error",
          title: "Preview Error",
          text: apiMessage(e, "Failed to load PDF."),
        });
        throw e;
      } finally {
        setIsWorking(false);
      }
    },
    [
      effectiveContractId,
      cleanupPreview,
      local,
      creatorTerms,
      savedSignatureUrl,
      savedSignatureId,
      validateOptionalInfluencerForm,
      validateCreatorTerms,
    ]
  );

  useEffect(() => {
    if (!open || !effectiveContractId) return;

    if (initialPreviewLoadedForRef.current === effectiveContractId) return;

    initialPreviewLoadedForRef.current = effectiveContractId;

    // Initial preview should always show saved contract PDF.
    // No validation, no highlighted errors.
    loadSavedPreview(true, effectiveContractId).catch(() => undefined);
  }, [open, effectiveContractId, loadSavedPreview]);

  const handleAcceptWithSignature = async () => {
    if (!hasInfluencerSignature) {
      await openInfluencerSignatureModal();
      return;
    }

    if (!signatureChecked) {
      setSignatureAgreeError(true);

      window.setTimeout(() => {
        document
          .getElementById("influencer-signature-section")
          ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 0);

      return;
    }

    const { isValid, errors, sanitized } = validateOptionalInfluencerForm(local, {
      requireRequiredFields: true,
    });
    const creatorValidation = validateCreatorTerms(creatorTerms);
    setFieldErrors(errors);
    setCreatorErrors(creatorValidation.errors);

    if (!isValid || !creatorValidation.isValid) {
      toast({
        icon: "error",
        title: "Invalid form",
        text: "Please fix the highlighted fields before continuing.",
      });
      return;
    }

    if (isWorking) return;
    setIsWorking(true);

    try {
      const payload = toContractInfluencerPayload(sanitized);
      const creatorUpdates = buildCreatorContractUpdatePayload(sanitized, creatorTerms);

      await post("/contract/influencer/confirm", {
        contractId: effectiveContractId,
        influencer: payload,
        creatorUpdates,
        signatureInfluencer: savedSignatureUrl || savedSignatureId,
        signatureInfluencerId: savedSignatureId,
        savedSignatureId,
      });

      toast({
        icon: "success",
        title: "Accepted & Signed",
        text: "Contract accepted successfully.",
      });

      await fetchContractMeta();
      onAfterAction?.();
      await generatePreview(true);
      onClose();
    } catch (e: any) {
      toast({
        icon: "error",
        title: "Error",
        text: apiMessage(e, "Failed to accept and sign."),
      });
    } finally {
      setIsWorking(false);
    }
  };

  const acceptOrSave = async () => {
    const sanitized = sanitizeLocal(local);
    const creatorValidation = validateCreatorTerms(creatorTerms);
    const optionalValidation = validateOptionalInfluencerForm(local, {
      requireRequiredFields: true,
    });

    setCreatorErrors(creatorValidation.errors);
    setFieldErrors(optionalValidation.errors);

    if (!creatorValidation.isValid || !optionalValidation.isValid) {
      toast({
        icon: "error",
        title: "Invalid form",
        text: "Please fix the highlighted fields before continuing.",
      });
      return;
    }

    if (!hasAcceptedCurrent(meta, "influencer")) {
      if (!hasInfluencerSignature) {
        await openInfluencerSignatureModal();
        return;
      }

      await handleAcceptWithSignature();
      return;
    }

    setIsWorking(true);
    try {
      const payload = toContractInfluencerPayload(sanitized);
      const creatorUpdates = buildCreatorContractUpdatePayload(sanitized, creatorTerms);

      await post("/contract/influencer/update", {
        contractId: effectiveContractId,
        influencerUpdates: {
          content: {
            influencer: payload,
            ...creatorUpdates.content,
          },
        },
      });

      toast({
        icon: "success",
        title: "Saved",
        text: "Your changes were saved.",
      });

      await fetchContractMeta();
      onAfterAction?.();
      await generatePreview(true);
    } catch (e: any) {
      toast({
        icon: "error",
        title: "Error",
        text: apiMessage(e, "Failed to save."),
      });
    } finally {
      setIsWorking(false);
    }
  };

  if (!open) return null;

  return (
    <TooltipProvider delayDuration={150}>
      <InfluencerSidebarShell
        isOpen={open && !showInfluencerSignatureModal}
        onClose={onClose}
        sidebarOffset={sidebarOffset}
        title={influencerAccepted ? "VIEW CONTRACT" : "ACCEPT CONTRACT"}
        subtitle={`${campaign?.productOrServiceName || "Agreement"} • ${campaign?.brandName || ""}`}
        previewUrl={previewUrl}
        previewBlob={previewBlob}
        pdfOnly={influencerAccepted}
        footer={
          influencerAccepted ? (
            <Button
              variant="secondary"
              className="ml-auto shrink-0 flex items-center gap-2 !border !border-[#E6E6E6] !bg-white"
              onClick={() => {
                if (previewUrl) {
                  const a = document.createElement("a");
                  a.href = previewUrl;
                  a.download = `${campaign?.productOrServiceName || "contract"}.pdf`;
                  a.click();
                } else {
                  generatePreview();
                }
              }}
            >
              <DownloadSimpleIcon />
              <span>Download</span>
            </Button>
          ) : (
            <>
              <div className="mr-auto min-w-0 flex-1 text-xs">
                {locked ? (
                  <span className="text-emerald-600">
                    Locked — all required signatures have been captured.
                  </span>
                ) : (
                  <span className="text-amber-600">
                    Fill details to accept the contract.
                  </span>
                )}
              </div>

              <Button
                variant="secondary"
                className="shrink-0"
                onClick={() => generatePreview()}
                disabled={isWorking}
              >
                <Eye className="mr-2 h-5 w-5" />
                Preview
              </Button>

              <Button
                variant="link"
                className="shrink-0"
                onClick={async () => {
                  try {
                    setIsWorking(true);
                    const influencerId = getInfluencerId();
                    const res = await post("/emails/threads", {
                      influencerId,
                      brandId: campaign.brandId,
                      subject: campaign.title,
                    });
                    const threadId =
                      res?.data?.threadId ||
                      res?.threadId ||
                      (res as any)?._id;
                    if (!threadId) throw new Error("No thread ID returned.");
                    router.push(`/influencer/inbox/${threadId}`);
                  } catch (e: any) {
                    toast({
                      icon: "error",
                      title: "Error",
                      text: apiMessage(e, "Failed to open inbox thread."),
                    });
                  } finally {
                    setIsWorking(false);
                  }
                }}
              >
                Request Change
              </Button>

              <Button
                variant="secondary"
                className="shrink-0 flex items-center gap-2 !border !border-[#E6E6E6] !bg-white"
                onClick={() => {
                  if (previewUrl) {
                    const a = document.createElement("a");
                    a.href = previewUrl;
                    a.download = `${campaign?.productOrServiceName || "contract"}.pdf`;
                    a.click();
                  } else {
                    generatePreview();
                  }
                }}
              >
                <DownloadSimpleIcon />
                <span>Download</span>
              </Button>

              {!locked && (
                <Button
                  onClick={acceptOrSave}
                  disabled={isWorking || !liteLoaded}
                  className="shrink-0 bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Accept & Save
                </Button>
              )}
            </>
          )
        }
      >
        {!influencerAccepted && (
          <div className="space-y-5">
            <AccordionCard
              title="Creator Overview"
              subtitle="Add key details about the creator, including identity, contact information, legal address, and posting handle." defaultOpen
            >
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <FloatingInput
                  id="creatorLegalName"
                  label="Creator Legal Name *"
                  value={local.legalName}
                  onValueChange={(v) =>
                    setLocal((p) => ({ ...p, legalName: v, contactName: v }))
                  }
                />

                <FloatingInput
                  id="creatorPostingHandleUrl"
                  label="Creator Posting Handle URL *"
                  value={local.postingHandleUrl}
                  state={fieldErrors.postingHandleUrl ? "error" : undefined}
                  errorText={fieldErrors.postingHandleUrl}
                  onValueChange={(v) =>
                    setLocal((p) => ({ ...p, postingHandleUrl: v }))
                  }
                />

                <div className="lg:col-span-2">
                  <LabeledTextarea
                    id="creatorLegalAddress"
                    label="Creator Legal Address"
                    value={buildAddressText(local)}
                    onChange={(e) =>
                      setLocal((p) => ({
                        ...p,
                        addressLine1: e.target.value,
                        addressLine2: "",
                        city: "",
                        state: "",
                        zip: "",
                        country: p.country,
                      }))
                    }
                    rows={3}
                  />
                </div>

                <FloatingInput
                  id="creatorEmailContact"
                  label="Creator Email/Contact *"
                  type="email"
                  value={local.contactEmail}
                  state={fieldErrors.contactEmail ? "error" : undefined}
                  errorText={fieldErrors.contactEmail}
                  onValueChange={(v) =>
                    setLocal((p) => ({ ...p, contactEmail: v }))
                  }
                />

                <FloatingInput
                  id="creatorPhone"
                  label="Creator Phone"
                  value={local.contactPhone}
                  state={fieldErrors.contactPhone ? "error" : undefined}
                  errorText={fieldErrors.contactPhone}
                  onValueChange={(v) =>
                    setLocal((p) => ({ ...p, contactPhone: v.replace(/\D/g, "") }))
                  }
                />
              </div>
            </AccordionCard>

            <AccordionCard
              title="Campaign Overview"
              subtitle="Describe the campaign objective, creative direction, and expectations for the collaboration."
            >
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <FloatingInput
                  id="creatorEffectiveDate"
                  label="Effective Date"
                  type="date"
                  value={creatorTerms.effectiveDate}
                  state={creatorErrors.effectiveDate ? "error" : undefined}
                  errorText={creatorErrors.effectiveDate}
                  onValueChange={(v) =>
                    setCreatorTerms((p) => ({ ...p, effectiveDate: v }))
                  }
                />

                <FloatingInput
                  id="creatorTargetCountry"
                  label="Target Country *"
                  value={creatorTerms.targetCountry}
                  state={creatorErrors.targetCountry ? "error" : undefined}
                  errorText={creatorErrors.targetCountry}
                  onValueChange={(v) =>
                    setCreatorTerms((p) => ({ ...p, targetCountry: v }))
                  }
                />

                <FloatingInput
                  id="creatorTimezone"
                  label="Timezone"
                  value={creatorTerms.timezone}
                  onValueChange={(v) =>
                    setCreatorTerms((p) => ({ ...p, timezone: v }))
                  }
                />
              </div>
            </AccordionCard>

            <AccordionCard
              title="Deliverables and Publication Timeline"
              subtitle="Define revision terms, reshoots, pre-shoot script approval, and submission deadlines."
            >
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <FloatingInput
                  id="includedRevisionRounds"
                  label="Included Revision Rounds"
                  type="number"
                  value={creatorTerms.includedRevisionRounds}
                  state={creatorErrors.includedRevisionRounds ? "error" : undefined}
                  errorText={creatorErrors.includedRevisionRounds}
                  onValueChange={(v) =>
                    setCreatorTerms((p) => ({ ...p, includedRevisionRounds: v }))
                  }
                />

                <FloatingInput
                  id="additionalRevisionFee"
                  label="Additional Revision Fees"
                  type="number"
                  value={creatorTerms.additionalRevisionFee}
                  state={creatorErrors.additionalRevisionFee ? "error" : undefined}
                  errorText={creatorErrors.additionalRevisionFee}
                  onValueChange={(v) =>
                    setCreatorTerms((p) => ({ ...p, additionalRevisionFee: v }))
                  }
                />
              </div>

              <div className="mt-4 rounded-[16px] border border-[#E6E6E6] p-4">
                <div className="mb-3 text-sm font-semibold text-[#1A1A1A]">
                  Reshoot Obligation
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 text-sm font-medium text-[#8A8A8A]">
                    <Checkbox
                      checked={creatorTerms.reshootNoBriefFailure}
                      onCheckedChange={(checked) =>
                        setCreatorTerms((p) => ({
                          ...p,
                          reshootNoBriefFailure: checked === true,
                        }))
                      }
                      className="shrink-0"
                    />
                    No reshoot required except for material failure to follow approved brief.
                  </label>

                  <label className="flex items-center gap-3 text-sm font-medium text-[#8A8A8A]">
                    <Checkbox
                      checked={creatorTerms.reshootOneIncluded}
                      onCheckedChange={(checked) =>
                        setCreatorTerms((p) => ({
                          ...p,
                          reshootOneIncluded: checked === true,
                        }))
                      }
                      className="shrink-0"
                    />
                    One reshoot included
                  </label>

                  <label className="flex items-center gap-3 text-sm font-medium text-[#8A8A8A]">
                    <Checkbox
                      checked={creatorTerms.paidReshoot}
                      onCheckedChange={(checked) =>
                        setCreatorTerms((p) => ({
                          ...p,
                          paidReshoot: checked === true,
                        }))
                      }
                      className="shrink-0"
                    />
                    Paid Re-shoot
                  </label>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <FloatingInput
                    id="draftDate"
                    label="Add draft date"
                    type="date"
                    value={creatorTerms.draftDate}
                    onValueChange={(v) =>
                      setCreatorTerms((p) => ({ ...p, draftDate: v }))
                    }
                  />

                  <FloatingInput
                    id="reshootFee"
                    label="Reshoot Fees"
                    type="number"
                    value={creatorTerms.reshootFee}
                    onValueChange={(v) =>
                      setCreatorTerms((p) => ({ ...p, reshootFee: v }))
                    }
                  />

                  <FloatingSelect
                    label="Reshoot Obligation"
                    value={creatorTerms.reshootObligationRequired || "yes"}
                    onValueChange={(v) =>
                      setCreatorTerms((p) => ({
                        ...p,
                        reshootObligationRequired: v as "yes" | "no",
                      }))
                    }
                  >
                    {YES_NO_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </FloatingSelect>

                  <FloatingSelect
                    label="Pre shoot Script Required"
                    value={creatorTerms.preShootScriptRequired || "yes"}
                    onValueChange={(v) =>
                      setCreatorTerms((p) => ({
                        ...p,
                        preShootScriptRequired: v as "yes" | "no",
                        preShootScriptDue: v === "yes" ? p.preShootScriptDue : "",
                      }))
                    }
                  >
                    {YES_NO_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </FloatingSelect>

                  {creatorTerms.preShootScriptRequired === "yes" ? (
                    <>
                      <FloatingInput
                        id="preShootScriptDue"
                        label="Pre Shoot Script Due"
                        type="date"
                        value={creatorTerms.preShootScriptDue}
                        onValueChange={(v) =>
                          setCreatorTerms((p) => ({ ...p, preShootScriptDue: v }))
                        }
                      />

                      <FloatingInput
                        id="scriptReviewBusinessDays"
                        label="Script Review Business Days"
                        type="number"
                        value={creatorTerms.preShootScriptReviewBusinessDays}
                        onValueChange={(v) =>
                          setCreatorTerms((p) => ({
                            ...p,
                            preShootScriptReviewBusinessDays: v,
                          }))
                        }
                      />
                    </>
                  ) : null}
                </div>
              </div>
            </AccordionCard>

            <AccordionCard
              title="Payment Terms"
              subtitle="Specify payment structure, advance payment request, and payout schedule."
            >
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <FloatingInput
                  id="influencerFee"
                  label="Influencer Fee"
                  type="number"
                  value={creatorTerms.influencerFee}
                  state={creatorErrors.influencerFee ? "error" : undefined}
                  errorText={creatorErrors.influencerFee}
                  onValueChange={(v) =>
                    setCreatorTerms((p) => ({ ...p, influencerFee: v }))
                  }
                />

                <FloatingInput
                  id="currencyUsd"
                  label="Currency"
                  value="$ US-Dollar"
                  disabled
                  onValueChange={() => undefined}
                />
              </div>

              <label className="mt-4 flex items-center gap-3 text-sm font-medium text-[#1A1A1A]">
                <Checkbox
                  checked={creatorTerms.wantAdvancePayment}
                  onCheckedChange={(checked) => {
                    const isChecked = checked === true;

                    setCreatorTerms((p) => ({
                      ...p,
                      wantAdvancePayment: isChecked,
                      advancePaymentAmount: isChecked ? p.advancePaymentAmount : "",
                      advancePaymentType: isChecked ? p.advancePaymentType : "",
                    }));
                  }}
                  className="shrink-0"
                />
                I Want Advance Payment
              </label>

              {creatorTerms.wantAdvancePayment ? (
                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <FloatingInput
                    id="advancePaymentAmount"
                    label="Advance Payment Amount"
                    type="number"
                    value={creatorTerms.advancePaymentAmount}
                    state={creatorErrors.advancePaymentAmount ? "error" : undefined}
                    errorText={creatorErrors.advancePaymentAmount}
                    onValueChange={(v) =>
                      setCreatorTerms((p) => ({ ...p, advancePaymentAmount: v }))
                    }
                  />

                  <FloatingSelect
                    label="Advance Payment Type"
                    value={creatorTerms.advancePaymentType}
                    onValueChange={(v) =>
                      setCreatorTerms((p) => ({ ...p, advancePaymentType: v }))
                    }
                  >
                    {ADVANCE_PAYMENT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </FloatingSelect>
                </div>
              ) : null}

              <label className="mt-4 flex items-start gap-3 text-sm leading-5 text-[#8A8A8A]">
                <Checkbox className="mt-1 shrink-0" />
                <span>{creatorTerms.laneAMarketplaceFeeNote}</span>
              </label>
            </AccordionCard>

            <AccordionCard
              title="Products, Shipping, Receipt, Loaner / Return Terms"
              subtitle="Specify shipping details, product receipt deadlines, and loaner or return terms."
            >
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <FloatingInput
                  id="shipToName"
                  label="Ship to name"
                  value={creatorTerms.shipToName}
                  onValueChange={(v) =>
                    setCreatorTerms((p) => ({ ...p, shipToName: v }))
                  }
                />

                <FloatingInput
                  id="productReceiptDeadline"
                  label="Product Receipt Confirmation Deadline"
                  type="date"
                  value={creatorTerms.productReceiptConfirmationDeadline}
                  onValueChange={(v) =>
                    setCreatorTerms((p) => ({
                      ...p,
                      productReceiptConfirmationDeadline: v,
                    }))
                  }
                />

                <div className="lg:col-span-2">
                  <LabeledTextarea
                    id="shippingAddress"
                    label="Shipping Address"
                    value={
                      creatorTerms.sameAsAbove
                        ? buildAddressText(local)
                        : creatorTerms.shipToAddress
                    }
                    onChange={(e) =>
                      setCreatorTerms((p) => ({
                        ...p,
                        shipToAddress: e.target.value,
                        sameAsAbove: false,
                      }))
                    }
                    rows={3}
                  />
                </div>

                <label className="flex items-center gap-3 text-sm font-medium text-[#8A8A8A]">
                  <Checkbox
                    checked={creatorTerms.sameAsAbove}
                    onCheckedChange={(checked) => {
                      const isChecked = checked === true;

                      setCreatorTerms((p) => ({
                        ...p,
                        sameAsAbove: isChecked,
                        shipToAddress: isChecked ? buildAddressText(local) : p.shipToAddress,
                      }));
                    }}
                    className="shrink-0"
                  />
                  Same as above
                </label>

                <FloatingSelect
                  label="Loaner / Return Terms"
                  value={creatorTerms.productReturnable}
                  onValueChange={(v) =>
                    setCreatorTerms((p) => ({ ...p, productReturnable: v }))
                  }
                >
                  {PRODUCT_RETURNABLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </FloatingSelect>
              </div>
            </AccordionCard>

            <AccordionCard
              title="Signature"
              subtitle="Select your influencer signature and confirm agreement before accepting this contract."
              defaultOpen
            >
              <InfluencerSignatureSection
                signatureSrc={savedSignatureUrl}
                hasSignature={hasInfluencerSignature}
                agreed={signatureChecked}
                onAgreeChange={(checked) => {
                  setSignatureChecked(checked);
                  if (checked) setSignatureAgreeError(false);
                }}
                showError={signatureAgreeError}
                onManageSignatures={() =>
                  openInfluencerSignatureModal(hasInfluencerSignature ? "manage" : "upload")
                }
              />
            </AccordionCard>
          </div>
        )}
      </InfluencerSidebarShell>

      <InfluencerSignatureModal
        open={showInfluencerSignatureModal}
        influencerId={getInfluencerId()}
        initialTab={signatureModalInitialTab}
        selectedSignatureId={savedSignatureId}
        isLoading={false}
        onClose={() => setShowInfluencerSignatureModal(false)}
        onSignatureSelected={handleInfluencerSignatureSelected}
        onSignatureUploaded={refreshInfluencerSignature}
      />

    </TooltipProvider>
  );
}

/* ───────────────────────── Loading Skeleton ───────────────────────── */

function CampaignCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3 animate-pulse">
      <Skeleton className="h-5 w-3/4 rounded" />
      <Skeleton className="h-4 w-full rounded" />
      <Skeleton className="h-4 w-2/3 rounded" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      <Skeleton className="h-8 w-full rounded-lg mt-2" />
    </div>
  );
}


function extractCampaignList(res: any, tab?: string): any[] {
  const data = res?.data ?? res;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.campaigns)) return data.campaigns;
  if (Array.isArray(data?.contracts)) return data.contracts;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;

  if (tab === "Rejected" && Array.isArray(data?.data?.data)) {
    return data.data.data;
  }

  return [];
}

function normalizeRejectedItem(item: any) {
  const campaignDoc = item?.campaignData || item?.campaign || item || {};

  return {
    ...campaignDoc,
    _id:
      campaignDoc?._id ||
      item?.campaignId ||
      item?.campaignData?._id ||
      item?._id,
    campaignId:
      campaignDoc?._id ||
      item?.campaignId ||
      item?.campaignData?._id ||
      item?._id,
    contractId:
      item?.contractMongoId ||
      item?.contract?._id ||
      item?.contractId ||
      campaignDoc?.contractId ||
      "",
    contractMongoId:
      item?.contractMongoId ||
      item?.contract?._id ||
      "",
    feeAmount: item?.feeAmount ?? campaignDoc?.feeAmount ?? 0,
    isContracted: 0,
    isAccepted: item?.isAccepted ?? campaignDoc?.isAccepted ?? 0,
    hasApplied: item?.hasApplied ?? campaignDoc?.hasApplied ?? 1,
    hasMilestone: item?.hasMilestone ?? campaignDoc?.hasMilestone ?? 0,
    status: item?.status || campaignDoc?.status || CONTRACT_STATUS.REJECTED,
    campaignStatus:
      item?.campaignStatus ||
      item?.status ||
      campaignDoc?.campaignStatus ||
      campaignDoc?.status ||
      CONTRACT_STATUS.REJECTED,
    contractStatus: item?.contractStatus || item?.status || CONTRACT_STATUS.REJECTED,
  };
}


/* ───────────────────────── Main Page ───────────────────────── */

export default function MyCampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [campaignType, setCampaignType] = useState("all");
  const [creatorStatus, setCreatorStatus] = useState("all");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [dateFilter, setDateFilter] =
    useState<DateFilterValue>(DEFAULT_DATE_FILTER);
  const [aiCreated, setAiCreated] = useState(false);
  const [sortBy] = useState("match");

  const [metaCache, setMetaCache] = useState<
    Record<string, ContractMeta | null>
  >({});

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorReadOnly, setEditorReadOnly] = useState(false);
  const [editorContractId, setEditorContractId] = useState("");
  const [editorCampaign, setEditorCampaign] = useState<CampaignData | null>(
    null
  );

  const sidebarOffset = useInfluencerSidebarWidth();

  const [topSignOpen, setTopSignOpen] = useState(false);
  const [topSignContractId, setTopSignContractId] = useState("");
  const [influencerIdentity, setInfluencerIdentity] = useState<{
    legalName?: string;
    name?: string;
    email?: string;
  }>({});
  const [pendingRejectId, setPendingRejectId] = useState<string | null>(null);

  const router = useRouter();

  const fetchCampaigns = useCallback(
    async (tab: string = activeTab) => {
      setIsLoading(true);
      setFetchError(null);

      try {
        const id =
          typeof window !== "undefined"
            ? localStorage.getItem("influencerId") || ""
            : "";

        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("influencerToken") || undefined
            : undefined;

        let res: any;
        let rawCampaigns: any[] = [];

        if (tab === "applied") {
          res = await apiGetAppliedCampaigns(id, token);
          rawCampaigns = extractCampaignList(res, tab);
        } else if (tab === "active") {
          res = await apiGetMyCampaigns(
            { influencerId: id, page: 1, limit: 10, search: searchInput || "" },
            token
          );
          rawCampaigns = extractCampaignList(res, tab);
        } else if (tab === "Contracted") {
          res = await apiGetContractedCampaigns(id, token);
          rawCampaigns = extractCampaignList(res, tab);
        } else if (tab === "Rejected") {
          res = await api.get(`/campaign/rejected/${id}`);
          rawCampaigns = extractCampaignList(res, tab).map(normalizeRejectedItem);
        } else {
          res = await apiGetAllCampaigns(id);
          rawCampaigns = extractCampaignList(res, tab);
        }

        const mapped = rawCampaigns.map(mapApiCampaign);
        setCampaigns(mapped);
      } catch (e: any) {
        setFetchError(
          e?.response?.data?.message ||
          e?.message ||
          "Failed to load campaigns."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [activeTab, searchInput]
  );

  useEffect(() => {
    fetchCampaigns(activeTab);
  }, [activeTab, fetchCampaigns]);

  const loadMetaCache = useCallback(async (list: CampaignData[]) => {
    const influencerId =
      typeof window !== "undefined"
        ? localStorage.getItem("influencerId")
        : null;

    if (!influencerId) return;

    try {
      const candidates = list.filter(
        (c) => c.isContracted === 1 || c.contractId
      );

      const metas = await Promise.all(
        candidates.map(async (c) => {
          try {
            const res: any = await post("/contract/getContract", {
              brandId: c.brandId,
              influencerId,
              campaignId: c.id,
            });

            const arr: any[] = Array.isArray(res?.contracts)
              ? res.contracts
              : [];
            const chosen = pickActiveContract(arr, c.contractId);

            return {
              id: c.id,
              meta: chosen ? toContractMeta(chosen) : null,
            };
          } catch {
            return { id: c.id, meta: null };
          }
        })
      );

      const next: Record<string, ContractMeta | null> = {};
      metas.forEach((x) => {
        next[x.id] = x.meta;
      });
      setMetaCache(next);
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    if (campaigns.length > 0) loadMetaCache(campaigns);
  }, [campaigns, loadMetaCache]);

  useEffect(() => {
    (async () => {
      try {
        const influencerId =
          typeof window !== "undefined"
            ? localStorage.getItem("influencerId")
            : null;

        if (!influencerId) return;

        const res = await api.get("/influencer/lite", {
          params: { influencerId },
        });

        const i = res?.data?.influencer || {};
        setInfluencerIdentity({
          legalName: i?.legalName || i?.name,
          name: i?.name,
          email: i?.email,
        });
      } catch {
        // non-fatal
      }
    })();
  }, []);

  const openEditor = (
    c: CampaignData,
    viewOnly = false,
    _startMode: "view" | "edit" = "edit"
  ) => {
    setEditorCampaign(c);
    setEditorReadOnly(viewOnly);
    setEditorContractId(c.contractId);
    setEditorOpen(true);
  };

  const openSignDirect = ({
    contractId,
    influencerConfirmed,
    brandConfirmed,
    isLocked,
    isReadyToSign,
  }: {
    contractId: string;
    influencerConfirmed: boolean;
    brandConfirmed: boolean;
    isLocked: boolean;
    isReadyToSign: boolean;
  }) => {
    if (isLocked) return;

    if (!isReadyToSign) {
      toast({
        icon: "error",
        title: "Not ready to sign",
        text: "Waiting for both parties to accept.",
      });
      return;
    }

    if (!influencerConfirmed) {
      toast({
        icon: "error",
        title: "Accept first",
        text: "Please accept the contract before signing.",
      });
      return;
    }

    if (!brandConfirmed) {
      toast({
        icon: "error",
        title: "Brand acceptance pending",
        text: "Brand must accept before signing.",
      });
      return;
    }

    setTopSignContractId(contractId);
    setTopSignOpen(true);
  };

  const signDirect = async (sigDataUrl: string) => {
    try {
      await post("/contract/sign", {
        contractId: topSignContractId,
        role: "influencer",
        name: influencerIdentity.legalName || influencerIdentity.name || "",
        email: influencerIdentity.email || "",
        signatureImageDataUrl: sigDataUrl,
        signatureDataUrl: sigDataUrl,
        signatureInfluencer: sigDataUrl,
      });

      toast({
        icon: "success",
        title: "Signed",
        text: "Signature recorded.",
      });

      setTopSignOpen(false);
      setTopSignContractId("");
      loadMetaCache(campaigns);
    } catch (e: any) {
      toast({
        icon: "error",
        title: "Sign failed",
        text: apiMessage(e, "Could not sign."),
      });
    }
  };

  const refreshMeta = useCallback(() => {
    loadMetaCache(campaigns);
    fetchCampaigns(activeTab);
  }, [campaigns, loadMetaCache, fetchCampaigns, activeTab]);

  const filteredCampaigns = useMemo(() => {
    let filtered = campaigns.filter((campaign) => {
      const contractMeta = metaCache[campaign.id] ?? null;
      const contractStatus = normStatus(contractMeta?.status);

      const matchesTab = (() => {
        if (activeTab === "all") return true;
        if (activeTab === "applied") return campaign.hasApplied === 1;
        if (activeTab === "active") return true;
        if (activeTab === "Contracted") return campaign.isContracted === 1;
        if (activeTab === "Rejected")
          return (
            contractStatus === CONTRACT_STATUS.REJECTED ||
            normStatus(campaign.status) === CONTRACT_STATUS.REJECTED ||
            normStatus(campaign.campaignStatus) === CONTRACT_STATUS.REJECTED
          );
        return true;
      })();

      const matchesSearch = (campaign.title ?? "")
        .toLowerCase()
        .includes(searchInput.toLowerCase());

      const matchesCampaignType =
        campaignType === "all" || campaign.campaignStatus === campaignType;

      const matchesCreatorStatus = (() => {
        if (creatorStatus === "all") return true;
        if (creatorStatus === "applied") return campaign.hasApplied === 1;
        if (creatorStatus === "approved") return campaign.isApproved === 1;
        if (creatorStatus === "invited")
          return campaign.hasApplied === 0 && campaign.isApproved === 0;
        return true;
      })();

      const matchesCategory =
        categoryIds.length === 0 || categoryIds.includes(campaign.category);

      const matchesDate = (() => {
        if (
          !dateFilter.quickFilter &&
          dateFilter.allDatesOption === "all" &&
          !dateFilter.startDate &&
          !dateFilter.endDate
        ) {
          return true;
        }

        const start = campaign.timeline?.startDate
          ? new Date(campaign.timeline.startDate)
          : null;

        if (dateFilter.quickFilter === "launching_soon" && start) {
          const diff = (start.getTime() - Date.now()) / 86_400_000;
          return diff >= 0 && diff <= 7;
        }

        if (dateFilter.quickFilter === "today" && start) {
          return start.toDateString() === new Date().toDateString();
        }

        if (dateFilter.quickFilter === "this_week" && start) {
          const diff = (start.getTime() - Date.now()) / 86_400_000;
          return diff >= 0 && diff <= 7;
        }

        if (dateFilter.quickFilter === "this_month" && start) {
          const now = new Date();
          return (
            start.getMonth() === now.getMonth() &&
            start.getFullYear() === now.getFullYear()
          );
        }

        const rangeMap: Record<string, number> = {
          last_7: 7,
          last_15: 15,
          last_30: 30,
          last_90: 90,
          last_month: 30,
          last_quarter: 90,
          last_365: 365,
        };

        const days = rangeMap[dateFilter.allDatesOption];
        if (days && start) {
          return (Date.now() - start.getTime()) / 86_400_000 <= days;
        }

        if ((dateFilter.startDate || dateFilter.endDate) && start) {
          const from = dateFilter.startDate
            ? new Date(dateFilter.startDate)
            : null;
          const to = dateFilter.endDate ? new Date(dateFilter.endDate) : null;
          if (from && start < from) return false;
          if (to && start > to) return false;
        }

        return true;
      })();

      return (
        matchesTab &&
        matchesSearch &&
        matchesCampaignType &&
        matchesCreatorStatus &&
        matchesCategory &&
        matchesDate
      );
    });

    switch (sortBy) {
      case "budget-high":
        filtered.sort((a, b) => b.budgetMax - a.budgetMax);
        break;
      case "budget-low":
        filtered.sort((a, b) => a.budgetMin - b.budgetMin);
        break;
      case "ending":
        filtered.sort((a, b) => a.daysLeft - b.daysLeft);
        break;
      default:
        filtered.sort((a, b) => b.match - a.match);
    }

    return filtered;
  }, [
    campaigns,
    activeTab,
    searchInput,
    campaignType,
    creatorStatus,
    categoryIds,
    dateFilter,
    sortBy,
    metaCache,
  ]);

  const hasActiveFilters =
    !!searchInput ||
    campaignType !== "all" ||
    creatorStatus !== "all" ||
    categoryIds.length > 0 ||
    aiCreated;

  return (
    <TooltipProvider>
      <div className="min-h-screen">
        <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Campaigns</h1>
              <p className="text-gray-500 text-sm mt-1">
                Manage your collaborations and contract workflow.
              </p>
            </div>

            <button
              onClick={() => fetchCampaigns(activeTab)}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <svg
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>

          {fetchError && (
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span>⚠️</span>
              <span>{fetchError}</span>
              <button
                onClick={() => fetchCampaigns(activeTab)}
                className="ml-auto underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-5 !bg-gray-200 rounded-lg gap-3 p-0 h-auto border-0">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={`capitalize px-6 py-2.5 rounded-lg bg-transparent text-gray-600 font-semibold text-base transition-all flex-1 ${activeTab === tab.value
                    ? "text-black"
                    : "hover:text-gray-900"
                    }`}
                  style={
                    activeTab === tab.value
                      ? { backgroundColor: "#1A1A1A", color: "#FFFFFF" }
                      : {}
                  }
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <CampaignFilter
            campaignType={campaignType}
            setCampaignType={setCampaignType}
            creatorStatus={creatorStatus}
            setCreatorStatus={setCreatorStatus}
            categoryIds={categoryIds}
            setCategoryIds={setCategoryIds}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            aiCreated={aiCreated}
            setAiCreated={setAiCreated}
            searchInput={searchInput}
            setSearchInput={setSearchInput}
          />

          {isLoading ? (
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CampaignCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-4">
              <svg
                className="w-16 h-16 opacity-30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <div className="text-center">
                <p className="font-medium text-gray-600 text-lg">
                  No campaigns found
                </p>
                <p className="text-sm mt-1">
                  Try adjusting your filters or search query.
                </p>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSearchInput("");
                    setCampaignType("all");
                    setCreatorStatus("all");
                    setCategoryIds([]);
                    setDateFilter(DEFAULT_DATE_FILTER);
                    setAiCreated(false);
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {filteredCampaigns.map((campaign) => {
                const { form, meta: previewMeta } = campaignToPreview(campaign);
                const contractMeta = metaCache[campaign.id] ?? null;
                const effectiveContractId =
                  contractMeta?._id ||
                  contractMeta?.contractId ||
                  campaign.contractId;
                const contractProp =
                  campaign.isContracted === 1 && effectiveContractId
                    ? {
                      contractId: effectiveContractId,
                      meta: contractMeta,
                      onReviewAccept: () =>
                        openEditor(
                          { ...campaign, contractId: effectiveContractId },
                          false,
                          "edit"
                        ),
                      onView: () =>
                        openEditor(
                          { ...campaign, contractId: effectiveContractId },
                          true,
                          "view"
                        ),
                      onSign: () => {
                        openSignDirect({
                          contractId: effectiveContractId,
                          influencerConfirmed: hasAcceptedCurrent(
                            contractMeta,
                            "influencer"
                          ),
                          brandConfirmed: hasAcceptedCurrent(
                            contractMeta,
                            "brand"
                          ),
                          isLocked: isLockedMeta(contractMeta),
                          isReadyToSign: isReadyToSignMeta(contractMeta),
                        });
                      },
                      onReject: () =>
                        setPendingRejectId(effectiveContractId),
                    }
                    : undefined;

                return (
                  <ManualPreviewCard
                    key={campaign.id}
                    form={form}
                    meta={previewMeta}
                    contract={activeTab === "active" ? undefined : contractProp}
                    showViewMilestone={activeTab === "active" && !!effectiveContractId}
                    onViewMilestone={() =>
                      router.push(
                        `/influencer/my-campaigns/view-milestone?campaignId=${encodeURIComponent(
                          campaign.id
                        )}&contractId=${encodeURIComponent(
                          effectiveContractId || ""
                        )}`
                      )
                    }
                    onViewClick={() =>
                      router.push(`/influencer/my-campaigns/${campaign.id}`)
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {editorOpen && editorCampaign && (
        <InfluencerContractModal
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          contractId={editorContractId}
          campaign={editorCampaign}
          readOnly={editorReadOnly}
          onAfterAction={refreshMeta}
          sidebarOffset={sidebarOffset}
        />
      )}

      <SignatureModal
        open={topSignOpen}
        onClose={() => setTopSignOpen(false)}
        title="Sign as Influencer"
        onSubmit={signDirect}
      />

      {pendingRejectId && (
        <RejectButton
          contractId={pendingRejectId}
          onDone={() => {
            setPendingRejectId(null);
            refreshMeta();
          }}
          autoOpen
          onClose={() => setPendingRejectId(null)}
        />
      )}
    </TooltipProvider>
  );
}