import type { LucideIcon } from "lucide-react";

export type BrandTab =
  | "overview"
  | "subscription"
  | "campaigns"
  | "invoices"
  | "activity"
  | "settings";

export interface QAItem {
  question: string;
  answers: string[];
}

export interface SubscriptionFeature {
  key: string;
  value?: unknown;
  limit: number;
  used: number;
  note?: string | null;
  resetsEvery?: string | null;
  resetsAt?: string | null;
}

export interface InternalCredits {
  used: number;
  resetsAt?: string | null;
}

export interface Subscription {
  planId: string;
  planName: string;
  role: string;
  planRef?: string | null;
  monthlyCost: number;
  annualCost?: number;
  billingCycle: "monthly" | "annual";
  autoRenew: boolean;
  status: "active" | "archived" | string;
  durationMins: number;
  startedAt?: string | null;
  expiresAt?: string | null;
  features: SubscriptionFeature[];
  internalCredits?: InternalCredits;
}

export interface BrandDetail {
  _id: string;
  brandId?: string;
  email: string;
  brandName: string;
  name: string;
  companySize?: string;
  industry: string;
  proxyEmail?: string;
  profilePic?: string;
  page1?: QAItem[];
  page2?: QAItem[];
  page3?: QAItem[];
  ispage1Skip?: boolean;
  ispage2Skip?: boolean;
  ispage3Skip?: boolean;
  isProfilePicSkip?: boolean;
  subscription: Subscription;
  subscriptionExpired: boolean;
  failedLoginAttempts?: number;
  lockUntil?: string | null;
  createdAt: string;
  updatedAt: string;
  walletBalance?: number;
  assignedRh?: string;
  assignedBme?: string;
  assignedIme?: string;
  assignedRm?: string;
  assignedBm?: string;
  assignedIm?: string;
  fullyManagedSubscription?: boolean;
  assignmentStatus?: string;
  planName?: string;
  expiresAt?: string | null;
  status?: string;
}

export interface Campaign {
  campaignsId: string;
  productOrServiceName: string;
  goal?: string;
  timeline?: {
    startDate?: string | null;
    endDate?: string | null;
  } | null;
  applicantCount?: number;
  isActive: number;
}

export interface CampaignListResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  status: number;
  campaigns: Campaign[];
}

export interface PlanListItem {
  planId: string;
  role: "Brand" | "Influencer" | "Creator" | "Agency";
  name: string;
  displayName?: string;
  monthlyCost: number;
  annualCost?: number;
  currency?: string;
  status: "active" | "archived";
  isCustomPricing?: boolean;
  isStartingAt?: boolean;
  durationDays?: number;
  durationMins?: number;
  durationMinutes?: number;
}

export interface PlanChangeCheckResponse {
  status: string;
  canProceed: boolean;
  message: string;
  currentPlanId?: string | null;
  requestedPlanId?: string;
}

export interface BrandTabItem {
  id: BrandTab;
  label: string;
  icon: LucideIcon;
}