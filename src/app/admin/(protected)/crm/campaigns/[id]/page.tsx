"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import Select from "react-select";
import {
  Activity,
  AlertCircle,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Copy,
  Eye,
  LayoutTemplate,
  Mail,
  MousePointerClick,
  Pause,
  Play,
  Plus,
  Reply,
  Search,
  Settings,
  Sparkles,
  Target,
  Trash2,
  Upload,
  Users,
  Variable,
  Wrench,
  X,
  Link2,
  ExternalLink,
  Pencil,
  Unlink,
  ArrowLeft,
} from "lucide-react";
import {
  adminDelete,
  adminGet,
  adminPatch,
  adminPost,
  adminPostFormData,
  getApiErrorMessage,
} from "@/lib/api";
import AdminTable, { AdminTableColumn } from "../../../../components/table";
import { CsvImportPanel } from "./components/CsvImportPanel";
import { buildCsvTemplateVariables } from "./utils/csvVariables";

type CampaignFlowType = "standard_brand" | "ime_influencer";
type CampaignStatus = "draft" | "ready" | "launched" | "paused" | "completed" | "error";
type TabKey = "analytics" | "leads" | "sequences" | "schedule" | "options" | "subsequences";
type AnalyticsSubTab = "step_analytics" | "activity";
type RangeKey = "last_7_days" | "last_4_weeks" | "last_3_months";
type MetricKey =
  | "sequence_started"
  | "open_rate"
  | "click_rate"
  | "reply_rate"
  | "positive_reply_rate"
  | "opportunities"
  | "conversions";

type CampaignScheduleWindow = {
  name: string;
  from: string;
  to: string;
  days: Record<string, boolean>;
};

type CampaignSequenceVariant = {
  subject: string;
  body: string;
  preheaderText?: string;
  signatureHtml?: string;
};

type CampaignSequenceStep = {
  stepOrder: number;
  type: "email";
  delay: number;
  delayUnit: "minutes" | "hours" | "days";
  preDelay: number;
  preDelayUnit: "minutes" | "hours" | "days";
  variants: CampaignSequenceVariant[];
};

type SendingOptions = {
  dailyLimit: number;
  dailyMaxLeads: number;
  emailGap: number;
  randomWaitMax: number;
  stopOnReply: boolean;
  stopOnAutoReply: boolean;
  linkTracking: boolean;
  openTracking: boolean;
  textOnly: boolean;
  firstEmailTextOnly: boolean;
  isEvergreen: boolean;
  prioritizeNewLeads: boolean;
  matchLeadEsp: boolean;
  stopForCompany: boolean;
  insertUnsubscribeHeader: boolean;
  allowRiskyContacts: boolean;
  disableBounceProtect: boolean;
  ccList: string[];
  bccList: string[];
};

type CampaignConfiguration = {
  schedule: {
    timezone: string;
    startDate: string;
    endDate: string;
    windows: CampaignScheduleWindow[];
  };
  sequences: CampaignSequenceStep[];
  sendingOptions: SendingOptions;
  lastSyncedAt?: string;
};

type CsvColumnType =
  | "ignore"
  | "first_name"
  | "last_name"
  | "full_name"
  | "email"
  | "company_name"
  | "job_title"
  | "website"
  | "phone"
  | "linkedin_url"
  | "custom";

type CsvPreviewColumn = {
  header: string;
  variableKey: string;
  inferredType: CsvColumnType;
  selectedType: CsvColumnType;
  samples: string[];
};

type CsvPreviewRow = Record<string, string>;

type CampaignDetail = {
  _id: string;
  name: string;
  flowType: CampaignFlowType;
  status: CampaignStatus;
  sdrId: any;
  RHId: any;
  IMEId: any;
  instantly?: {
    senderAccountEmail?: string;
    accountEmails?: string[];
    availableAccountEmails?: string[];
    campaignId?: string;
    leadListId?: string;
    shareLink?: string;
  };
  teamMailboxes?: {
    RHEmail?: string;
    IMEEmail?: string;
  };
  configuration: CampaignConfiguration;
  stats?: {
    totalProspects?: number;
    totalSent?: number;
    totalOpened?: number;
    totalClicked?: number;
    totalReplies?: number;
    totalOpportunities?: number;
    totalQualified?: number;
    totalAssigned?: number;
    progressPercent?: number;
  };
  sync?: {
    providerStatus?: "idle" | "syncing" | "synced" | "error";
    lastErrorCode?: string;
    lastErrorMessage?: string;
    lastSyncedAt?: string;
    lastAnalyticsSyncedAt?: string;
  };
  templateVariables?: string[];
  csvSchema?: {
    fileName?: string;
    totalRows?: number;
    columns?: CsvPreviewColumn[];
    updatedAt?: string;
  };
  createdAt?: string;
  launchedAt?: string;
};

type ContactRow = {
  _id: string;
  companyName: string;
  primaryContact?: {
    name?: string;
    email?: string;
  };
  stage?: string;
  launchedAt?: string;
  instantly?: {
    leadId?: string;
    threadId?: string;
  };
  customFields?: Record<string, any>;
  templateVariables?: Record<string, string>;
  csvMeta?: {
    headers?: string[];
    mappedAt?: string;
    sourceFileName?: string;
  };
};

type AnalyticsOverview = {
  totalProspects: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalReplies: number;
  totalOpportunities: number;
  totalQualified: number;
  totalAssigned: number;
  progressPercent: number;
  sequenceStartedAt?: string;
  openRate?: number | null;
  clickRate?: number | null;
};

type StepAnalyticsRow = {
  stepOrder: number;
  label: string;
  type: string;
  subject?: string;
  sent: number;
  opened: number | null;
  replied: number;
  clicked: number;
  opportunities: number;
};

type DailyAnalyticsRow = {
  date: string;
  sent: number;
  contacted: number;
  opened: number;
  uniqueOpened: number;
  replies: number;
  uniqueReplies: number;
  automaticReplies: number;
  clicks: number;
  uniqueClicks: number;
  opportunities: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
};

type ApiState = {
  type: "success" | "error" | "info";
  text: string;
} | null;

type ManualForm = {
  entityName: string;
  contactName: string;
  contactEmail: string;
};

type TimezoneOption = {
  value: string;
  label: string;
  offsetLabel?: string;
  nowLocal?: string | null;
};

type MetricDefinition = {
  key: MetricKey;
  label: string;
  value: string | number;
  subValue?: string | number;
  icon: ReactNode;
};

type LeadImportMode = "csv" | "manual" | "sheet" | null;

type SequenceTemplate = {
  id: string;
  category: string;
  title: string;
  subject: string;
  body: string;
};

type SequenceTemplateGroup = {
  category: string;
  title: string;
  templates: SequenceTemplate[];
};

type CampaignSubsequenceStep = {
  stepOrder: number;
  type: "email";
  delay: number;
  delayUnit: "minutes" | "hours" | "days";
  variants: CampaignSequenceVariant[];
};

type CampaignSubsequence = {
  _id: string;
  name: string;
  status: "draft" | "launched" | "paused" | "completed";
  trigger: {
    statuses: string[];
    activities: string[];
    phrases: string[];
  };
  scheduleMode: "inherit" | "custom";
  dailyLimitMode: "inherit" | "custom" | "none";
  dailyLimit: number;
  ignoreAccountDailyLimits: boolean;
  sequences: CampaignSubsequenceStep[];
  createdAt?: string;
  updatedAt?: string;
};

type SequencePreviewData = {
  stepOrder: number;
  variantIndex: number;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  preheaderText?: string;
  signatureHtml?: string;
  previewVars?: Record<string, string>;
  lead?: {
    _id: string;
    leadName: string;
    contactName: string;
    email: string;
  } | null;
};

const weekdayLabels = [
  { key: "1", label: "Mon", full: "Monday" },
  { key: "2", label: "Tue", full: "Tuesday" },
  { key: "3", label: "Wed", full: "Wednesday" },
  { key: "4", label: "Thu", full: "Thursday" },
  { key: "5", label: "Fri", full: "Friday" },
  { key: "6", label: "Sat", full: "Saturday" },
  { key: "0", label: "Sun", full: "Sunday" },
];

const pageTabs: Array<{ key: TabKey; label: string }> = [
  { key: "analytics", label: "Analytics" },
  { key: "leads", label: "Leads" },
  { key: "sequences", label: "Sequences" },
  { key: "schedule", label: "Schedule" },
  { key: "options", label: "Options" },
  { key: "subsequences", label: "Subsequences" },
];

const rangeOptions: Array<{ value: RangeKey; label: string }> = [
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_4_weeks", label: "Last 4 weeks" },
  { value: "last_3_months", label: "Last 3 months" },
];

const subsequenceActivityOptions = [
  { label: "Opened", value: "opened" },
  { label: "Clicked", value: "clicked" },
  { label: "Replied", value: "replied" },
  { label: "Bounced", value: "bounced" },
  { label: "Interested", value: "interested" },
  { label: "Not Interested", value: "not_interested" },
];

const stageOptions = [
  { value: "new", label: "New" },
  { value: "queued", label: "Queued" },
  { value: "in_sequence", label: "In Sequence" },
  { value: "replied_pending_review", label: "Replied Pending Review" },
  { value: "assigned_to_bme", label: "Assigned to BME" },
  { value: "assigned_to_ime", label: "Assigned to IME" },
  { value: "unqualified", label: "Unqualified" },
  { value: "blocked", label: "Blocked" },
  { value: "closed", label: "Closed" },
];

const defaultVisibleMetrics: Record<MetricKey, boolean> = {
  sequence_started: true,
  open_rate: true,
  click_rate: true,
  reply_rate: true,
  positive_reply_rate: true,
  opportunities: true,
  conversions: true,
};

const sequenceTemplateGroups: SequenceTemplateGroup[] = [
  {
    category: "custom_templates",
    title: "Custom Templates",
    templates: [],
  },
  {
    category: "lead_generation",
    title: "Lead Generation",
    templates: [
      {
        id: "lead_generation_quick_question",
        category: "lead_generation",
        title: "Quick question",
        subject: "{{firstName}} - quick question",
        body: `Hey {{firstName}},

Your LinkedIn was impressive and I wanted to reach out directly :)

So we’re helping {{companyName}} from {{location}} to fill their cal with 5-12 calls with their ideal customer daily. If you let me have a call with you about how we can do the same for you, I will send you a burger with UberEats :D

Are you free any time this week for a quick chat?

Cheers,
NAME

Reply “No thanks” if you wish to no longer receive messages from me.`,
      },
      {
        id: "lead_generation_soft_intro",
        category: "lead_generation",
        title: "Soft intro",
        subject: "A quick idea for {{companyName}}",
        body: `Hi {{firstName}},

I came across {{companyName}} and wanted to share a quick idea.

We help brands improve outreach performance with better targeting, messaging, and follow-up systems.

Would you be open to a short conversation this week?

Best,
NAME`,
      },
    ],
  },
  {
    category: "leadgen_agency",
    title: "LeadGen Agency",
    templates: [
      {
        id: "leadgen_agency_offer",
        category: "leadgen_agency",
        title: "Agency offer",
        subject: "Can we help {{companyName}} book more calls?",
        body: `Hi {{firstName}},

Wanted to reach out because we help agencies generate more qualified meetings without increasing ad spend.

I think there may be a fit for {{companyName}} here.

Open to a quick discussion this week?

Best,
NAME`,
      },
    ],
  },
  {
    category: "video_production",
    title: "Video Production",
    templates: [
      {
        id: "video_production_pitch",
        category: "video_production",
        title: "Video collaboration pitch",
        subject: "Video content idea for {{companyName}}",
        body: `Hi {{firstName}},

We noticed {{companyName}} and had a few creative ideas around short-form video content that could help improve visibility and conversions.

Would you be open to seeing a few concepts?

Best,
NAME`,
      },
    ],
  },
  {
    category: "marketing_advertising",
    title: "Marketing & Advertising",
    templates: [
      {
        id: "marketing_advertising_growth",
        category: "marketing_advertising",
        title: "Growth idea",
        subject: "Marketing growth idea for {{companyName}}",
        body: `Hello {{firstName}},

I wanted to share a quick growth angle we think could work well for {{companyName}}.

We help brands tighten their messaging, improve outreach, and build more predictable acquisition systems.

Would it be worth a 10-minute chat?

Regards,
NAME`,
      },
    ],
  },
  {
    category: "coaching",
    title: "Coaching",
    templates: [
      {
        id: "coaching_outreach",
        category: "coaching",
        title: "Coaching intro",
        subject: "A quick thought for your coaching offer",
        body: `Hi {{firstName}},

I took a look at your offer and thought there may be a simple way to improve reply rates and lead quality.

Happy to share what we noticed if useful.

Best,
NAME`,
      },
    ],
  },
  {
    category: "appointment_setting",
    title: "Appointment Setting Agency",
    templates: [
      {
        id: "appointment_setting_intro",
        category: "appointment_setting",
        title: "Appointment setting pitch",
        subject: "Help booking more qualified meetings",
        body: `Hi {{firstName}},

We help businesses increase qualified meetings through smarter outbound systems and cleaner follow-up flows.

Would you be interested in seeing how this could work for {{companyName}}?

Best,
NAME`,
      },
    ],
  },
  {
    category: "influencer_marketing",
    title: "Influencer Marketing",
    templates: [
      {
        id: "influencer_marketing_collab",
        category: "influencer_marketing",
        title: "Collab intro",
        subject: "Potential collaboration with {{companyName}}",
        body: `Hi {{firstName}},

We’re exploring creator/brand partnerships and thought there may be a fit with {{companyName}}.

Would you be open to discussing a possible collaboration?

Best,
NAME`,
      },
    ],
  },
  {
    category: "growth_agency",
    title: "Growth Agency",
    templates: [
      {
        id: "growth_agency_audit",
        category: "growth_agency",
        title: "Quick audit offer",
        subject: "Quick audit idea for {{companyName}}",
        body: `Hi {{firstName}},

We reviewed part of your current outbound/growth setup and noticed a few improvements that could help.

Happy to send over a quick breakdown if you’d like.

Best,
NAME`,
      },
    ],
  },
  {
    category: "follow_ups",
    title: "Follow-Ups",
    templates: [
      {
        id: "follow_up_gentle",
        category: "follow_ups",
        title: "Gentle follow-up",
        subject: "",
        body: `Hey {{firstName}},

Just wanted to follow up on my previous note in case it got buried.

Would love to know if this is relevant for {{companyName}}.

Best,
NAME`,
      },
    ],
  },
  {
    category: "tiktok_agency",
    title: "TikTok Agency",
    templates: [
      {
        id: "tiktok_agency_pitch",
        category: "tiktok_agency",
        title: "TikTok growth pitch",
        subject: "TikTok idea for {{companyName}}",
        body: `Hi {{firstName}},

We had a couple of TikTok content ideas that could help {{companyName}} increase reach and engagement.

Would you be open to a quick discussion?

Best,
NAME`,
      },
    ],
  },
];

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function toSafeNumber(...values: any[]) {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function toSafeNullableNumber(...values: any[]) {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function clampPercentNumber(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function computeRatePercent(numerator: number, denominator: number) {
  const bottom = Number(denominator || 0);
  if (!bottom || bottom <= 0) return 0;

  return Number(clampPercentNumber((Number(numerator || 0) / bottom) * 100).toFixed(2));
}

function getArrayPayload(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function normalizeEmailValue(value?: string) {
  return String(value || "").trim().toLowerCase();
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAdminLabel(admin: any) {
  if (!admin) return "—";
  if (typeof admin === "string") return admin;
  if (admin.name && admin.email) return `${admin.name} · ${admin.email}`;
  return admin.name || admin.email || admin._id || "—";
}

function getStatusPillClasses(status?: string) {
  if (status === "ready") return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
  if (status === "launched") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  if (status === "paused") return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  if (status === "completed") return "bg-violet-50 text-violet-700 ring-1 ring-violet-200";
  if (status === "error") return "bg-orange-500 text-white";
  return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
}

function getFlowClasses(flowType?: CampaignFlowType) {
  return flowType === "ime_influencer"
    ? "bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-200"
    : "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
}

function getFlowLabel(flowType?: CampaignFlowType) {
  return flowType === "ime_influencer" ? "IME Influencer" : "Standard Brand";
}

function getStagePillClasses(stage?: string) {
  const value = (stage || "").toLowerCase();
  if (value.includes("assigned_to_ime")) return "bg-fuchsia-50 text-fuchsia-700";
  if (value.includes("assigned_to_bme")) return "bg-violet-50 text-violet-700";
  if (value.includes("qualified")) return "bg-emerald-50 text-emerald-700";
  if (value.includes("reply")) return "bg-blue-50 text-blue-700";
  if (value.includes("unqualified")) return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-600";
}

function createDefaultDays() {
  return { "0": false, "1": true, "2": true, "3": true, "4": true, "5": true, "6": false };
}

function createDefaultSubject(flowType: CampaignFlowType) {
  return flowType === "ime_influencer"
    ? "Collaboration opportunity with {{companyName}}"
    : "Brand collaboration opportunity with {{companyName}}";
}

function createDefaultBody(flowType: CampaignFlowType) {
  if (flowType === "ime_influencer") {
    return [
      "Hi {{firstName}},",
      "",
      "We would love to explore a collaboration opportunity with you.",
      "",
      "Would you be open to a quick conversation?",
      "",
      "Best,",
      "CollabGlam",
    ].join("\n");
  }

  return [
    "Hi {{firstName}},",
    "",
    "We’d love to explore a collaboration opportunity with {{companyName}}.",
    "",
    "Would you be open to a quick conversation?",
    "",
    "Best,",
    "CollabGlam",
  ].join("\n");
}

function getDefaultConfiguration(flowType: CampaignFlowType = "standard_brand"): CampaignConfiguration {
  const today = new Date().toISOString().slice(0, 10);

  return {
    schedule: {
      timezone: "Asia/Kolkata",
      startDate: today,
      endDate: "",
      windows: [
        {
          name: "Default Weekday Schedule",
          from: "10:00",
          to: "18:00",
          days: createDefaultDays(),
        },
      ],
    },
    sequences: [
      {
        stepOrder: 1,
        type: "email",
        delay: 0,
        delayUnit: "days",
        preDelay: 0,
        preDelayUnit: "days",
        variants: [
          {
            subject: createDefaultSubject(flowType),
            body: createDefaultBody(flowType),
          },
        ],
      },
    ],
    sendingOptions: {
      dailyLimit: 100,
      dailyMaxLeads: 100,
      emailGap: 10,
      randomWaitMax: 10,
      stopOnReply: true,
      stopOnAutoReply: false,
      linkTracking: true,
      openTracking: true,
      textOnly: false,
      firstEmailTextOnly: false,
      isEvergreen: false,
      prioritizeNewLeads: false,
      matchLeadEsp: false,
      stopForCompany: true,
      insertUnsubscribeHeader: false,
      allowRiskyContacts: false,
      disableBounceProtect: false,
      ccList: [],
      bccList: [],
    },
  };
}

function normalizeConfiguration(input: any, flowType: CampaignFlowType): CampaignConfiguration {
  const fallback = getDefaultConfiguration(flowType);

  return {
    schedule: {
      timezone: input?.schedule?.timezone || fallback.schedule.timezone,
      startDate: input?.schedule?.startDate || fallback.schedule.startDate,
      endDate: input?.schedule?.endDate || fallback.schedule.endDate,
      windows:
        Array.isArray(input?.schedule?.windows) && input.schedule.windows.length
          ? input.schedule.windows.map((item: any, index: number) => ({
            name: item?.name || `Schedule ${index + 1}`,
            from: item?.from || "10:00",
            to: item?.to || "18:00",
            days: {
              "0": Boolean(item?.days?.[0] ?? item?.days?.["0"]),
              "1": Boolean(item?.days?.[1] ?? item?.days?.["1"]),
              "2": Boolean(item?.days?.[2] ?? item?.days?.["2"]),
              "3": Boolean(item?.days?.[3] ?? item?.days?.["3"]),
              "4": Boolean(item?.days?.[4] ?? item?.days?.["4"]),
              "5": Boolean(item?.days?.[5] ?? item?.days?.["5"]),
              "6": Boolean(item?.days?.[6] ?? item?.days?.["6"]),
            },
          }))
          : fallback.schedule.windows,
    },
    sequences:
      Array.isArray(input?.sequences) && input.sequences.length
        ? input.sequences.map((step: any, index: number) => ({
          stepOrder: Number(step?.stepOrder || index + 1),
          type: "email",
          delay: Number(step?.delay || 0),
          delayUnit: step?.delayUnit || "days",
          preDelay: Number(step?.preDelay || 0),
          preDelayUnit: step?.preDelayUnit || "days",
          variants:
            Array.isArray(step?.variants) && step.variants.length
              ? step.variants.map((variant: any) => ({
                subject: variant?.subject || "",
                body: variant?.body || "",
                preheaderText: variant?.preheaderText || variant?.preheader_text || "",
                signatureHtml: variant?.signatureHtml || variant?.signature_html || "",
              }))
              : [{ subject: "", body: "", preheaderText: "", signatureHtml: "" }],
        }))
        : fallback.sequences,
    sendingOptions: {
      ...fallback.sendingOptions,
      ...(input?.sendingOptions || {}),
    },
    lastSyncedAt: input?.lastSyncedAt,
  };
}

function parseCampaign(payload: any): CampaignDetail | null {
  const row = payload?.data || null;
  if (!row?._id) return null;

  const flowType: CampaignFlowType =
    row?.flowType === "ime_influencer" ? "ime_influencer" : "standard_brand";

  return {
    _id: String(row._id),
    name: row.name || "",
    flowType,
    status: row.status || "draft",
    sdrId: row.sdrId || null,
    RHId: row.RHId || null,
    IMEId: row.IMEId || null,
    instantly: row.instantly || {},
    teamMailboxes: row.teamMailboxes || {},
    configuration: normalizeConfiguration(row.configuration || {}, flowType),
    stats: row.stats || {},
    sync: row.sync || {},
    templateVariables: Array.isArray(row.templateVariables) ? row.templateVariables : [],
    csvSchema: row.csvSchema || {},
    createdAt: row.createdAt || "",
    launchedAt: row.launchedAt || "",
  };
}

function parseContacts(payload: any): ContactRow[] {
  return getArrayPayload(payload).map((row: any) => ({
    _id: String(row?._id || ""),
    companyName: row?.companyName || "",
    primaryContact: row?.primaryContact || {},
    stage: row?.stage || "",
    launchedAt: row?.launchedAt || "",
    instantly: row?.instantly || {},
    customFields: row?.customFields || {},
    templateVariables: row?.templateVariables || {},
    csvMeta: row?.csvMeta || {},
  }));
}

function parseOverview(payload: any, campaign: CampaignDetail | null, contacts: ContactRow[]): AnalyticsOverview {
  const root = payload?.data || payload || {};

  const totalProspects = toSafeNumber(
    root?.totalProspects,
    root?.total_prospects,
    root?.total_leads,
    campaign?.stats?.totalProspects,
    contacts.length
  );

  const totalSent = toSafeNumber(root?.totalSent, root?.total_sent, root?.emails_sent_count, campaign?.stats?.totalSent);
  const totalOpened = toSafeNumber(
    root?.totalOpened,
    root?.total_opened,
    root?.open_count_unique,
    root?.open_count_unique_by_step,
    root?.unique_opened,
    root?.opened,
    root?.open_count,
    campaign?.stats?.totalOpened
  );
  const totalClicked = toSafeNumber(
    root?.totalClicked,
    root?.total_clicked,
    root?.link_click_count_unique,
    root?.link_click_count_unique_by_step,
    root?.unique_clicks,
    root?.clicked,
    root?.link_click_count,
    campaign?.stats?.totalClicked
  );
  const totalReplies = toSafeNumber(root?.totalReplies, root?.total_replies, root?.total_replied, root?.reply_count_unique, root?.reply_count, campaign?.stats?.totalReplies);
  const totalOpportunities = toSafeNumber(root?.totalOpportunities, root?.total_opportunities, campaign?.stats?.totalOpportunities);
  const totalQualified = toSafeNumber(root?.totalQualified, root?.total_conversions, campaign?.stats?.totalQualified);
  const totalAssigned = toSafeNumber(root?.totalAssigned, campaign?.stats?.totalAssigned);

  const progressPercent =
    totalProspects > 0 ? Math.min(100, Math.round((totalSent / totalProspects) * 100)) : 0;

  return {
    totalProspects,
    totalSent,
    totalOpened,
    totalClicked,
    totalReplies,
    totalOpportunities,
    totalQualified,
    totalAssigned,
    progressPercent,
    sequenceStartedAt: root?.sequenceStartedAt || root?.sequence_started_at || campaign?.launchedAt,
    openRate: clampPercentNumber(
      toSafeNullableNumber(root?.openRate, root?.open_rate) ?? computeRatePercent(totalOpened, totalSent)
    ),
    clickRate: clampPercentNumber(
      toSafeNullableNumber(root?.clickRate, root?.click_rate) ?? computeRatePercent(totalClicked, totalSent)
    ),
  };
}

function parseStepAnalytics(payload: any, campaign: CampaignDetail | null): StepAnalyticsRow[] {
  const rows = getArrayPayload(payload);

  if (rows.length) {
    return rows.map((row: any, index: number) => ({
      stepOrder: toSafeNumber(row?.stepOrder, row?.step_order, row?.step, index + 1),
      label: row?.label || row?.name || row?.step_name || `Step ${index + 1}`,
      type: row?.type || "email",
      subject: row?.subject || row?.email_subject || "",
      sent: toSafeNumber(row?.sent, row?.total_sent),
      opened: toSafeNullableNumber(row?.unique_opened, row?.opened, row?.total_opened),
      replied: toSafeNumber(row?.unique_replies, row?.replies, row?.replied, row?.total_replied),
      clicked: toSafeNumber(row?.unique_clicks, row?.clicks, row?.clicked, row?.total_clicked),
      opportunities: toSafeNumber(row?.unique_opportunities, row?.opportunities, row?.total_opportunities),
    }));
  }

  return (campaign?.configuration?.sequences || []).map((step, index) => ({
    stepOrder: step.stepOrder || index + 1,
    label: `Step ${step.stepOrder || index + 1}`,
    type: step.type || "email",
    subject: step.variants?.[0]?.subject || "",
    sent: index === 0 ? toSafeNumber(campaign?.stats?.totalSent) : 0,
    opened: index === 0 ? toSafeNumber(campaign?.stats?.totalOpened) : 0,
    replied: index === 0 ? toSafeNumber(campaign?.stats?.totalReplies) : 0,
    clicked: index === 0 ? toSafeNumber(campaign?.stats?.totalClicked) : 0,
    opportunities: index === 0 ? toSafeNumber(campaign?.stats?.totalOpportunities) : 0,
  }));
}


function parseDailyAnalytics(payload: any): DailyAnalyticsRow[] {
  const rows = getArrayPayload(payload?.data || payload);

  return rows
    .map((row: any) => {
      const sent = toSafeNumber(row?.sent, row?.totalSent, row?.emails_sent_count);
      const opened = toSafeNumber(row?.opened, row?.totalOpened, row?.open_count);
      const uniqueOpened = toSafeNumber(row?.uniqueOpened, row?.unique_opened, row?.open_count_unique, opened);
      const clicks = toSafeNumber(row?.clicks, row?.totalClicked, row?.link_click_count);
      const uniqueClicks = toSafeNumber(row?.uniqueClicks, row?.unique_clicks, row?.link_click_count_unique, clicks);
      const replies = toSafeNumber(row?.replies, row?.totalReplies, row?.reply_count);
      const uniqueReplies = toSafeNumber(row?.uniqueReplies, row?.unique_replies, row?.reply_count_unique, replies);

      return {
        date: String(row?.date || row?.label || row?.day || ""),
        sent,
        contacted: toSafeNumber(row?.contacted, row?.contacted_count),
        opened,
        uniqueOpened,
        replies,
        uniqueReplies,
        automaticReplies: toSafeNumber(row?.replies_automatic, row?.unique_replies_automatic, row?.reply_count_automatic),
        clicks,
        uniqueClicks,
        opportunities: toSafeNumber(row?.opportunities, row?.unique_opportunities, row?.total_opportunities),
        openRate: computeRatePercent(uniqueOpened, sent),
        clickRate: computeRatePercent(uniqueClicks, sent),
        replyRate: computeRatePercent(uniqueReplies, sent),
      };
    })
    .filter((row: DailyAnalyticsRow) => row.date)
    .sort((a: DailyAnalyticsRow, b: DailyAnalyticsRow) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
}

function getWindowDaySummary(days?: Record<string, boolean>) {
  const activeDays = weekdayLabels.filter((day) => days?.[day.key]).map((day) => day.label);
  return activeDays.length ? activeDays.join(", ") : "No days selected";
}

function ShellCard({
  children,
  className,
  soft = false,
}: {
  children: ReactNode;
  className?: string;
  soft?: boolean;
}) {
  return (
    <div
      className={cx(
        "rounded-3xl border bg-white",
        soft ? "border-slate-100 shadow-sm" : "border-slate-200 shadow-[0_8px_30px_rgba(15,23,42,0.04)]",
        className
      )}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
      </div>
      <div
        className={cx(
          "relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-blue-500" : "bg-slate-200"
        )}
      >
        <span
          className={cx(
            "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-4" : "translate-x-1"
          )}
        />
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
      </div>
    </label>
  );
}

function KpiCard({
  label,
  value,
  subValue,
  icon,
}: {
  label: string;
  value: string | number;
  subValue?: string | number;
  icon: ReactNode;
}) {
  return (
    <div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_6px_24px_rgba(15,23,42,0.03)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 transition group-hover:bg-blue-50 group-hover:text-blue-600">
          {icon}
        </div>
      </div>

      <div className="mt-6 flex items-end gap-3">
        <p className="text-4xl font-bold tracking-tight text-slate-900">{value}</p>
        {subValue !== undefined ? (
          <p className="pb-1 text-2xl font-semibold text-slate-400">| {subValue}</p>
        ) : null}
      </div>
    </div>
  );
}

function getDefaultSubsequence(): CampaignSubsequence {
  return {
    _id: "",
    name: "New subsequence",
    status: "draft",
    trigger: {
      statuses: [],
      activities: [],
      phrases: [],
    },
    scheduleMode: "inherit",
    dailyLimitMode: "inherit",
    dailyLimit: 0,
    ignoreAccountDailyLimits: false,
    sequences: [
      {
        stepOrder: 1,
        type: "email",
        delay: 1,
        delayUnit: "days",
        variants: [{ subject: "", body: "" }],
      },
    ],
  };
}

function normalizeSubsequence(input: any): CampaignSubsequence {
  const fallback = getDefaultSubsequence();

  return {
    _id: String(input?._id || ""),
    name: String(input?.name || fallback.name),
    status: ["draft", "launched", "paused", "completed"].includes(input?.status)
      ? input.status
      : "draft",
    trigger: {
      statuses: Array.isArray(input?.trigger?.statuses) ? input.trigger.statuses : [],
      activities: Array.isArray(input?.trigger?.activities) ? input.trigger.activities : [],
      phrases: Array.isArray(input?.trigger?.phrases) ? input.trigger.phrases : [],
    },
    scheduleMode: input?.scheduleMode === "custom" ? "custom" : "inherit",
    dailyLimitMode:
      input?.dailyLimitMode === "custom" || input?.dailyLimitMode === "none"
        ? input.dailyLimitMode
        : "inherit",
    dailyLimit: Number(input?.dailyLimit || 0),
    ignoreAccountDailyLimits: Boolean(input?.ignoreAccountDailyLimits),
    sequences:
      Array.isArray(input?.sequences) && input.sequences.length
        ? input.sequences.map((step: any, index: number) => ({
          stepOrder: Number(step?.stepOrder || index + 1),
          type: "email",
          delay: Number(step?.delay || (index === 0 ? 1 : 1)),
          delayUnit:
            step?.delayUnit === "minutes" ||
              step?.delayUnit === "hours" ||
              step?.delayUnit === "days"
              ? step.delayUnit
              : "days",
          variants:
            Array.isArray(step?.variants) && step.variants.length
              ? step.variants.map((variant: any) => ({
                subject: variant?.subject || "",
                body: variant?.body || "",
                preheaderText: variant?.preheaderText || variant?.preheader_text || "",
                signatureHtml: variant?.signatureHtml || variant?.signature_html || "",
              }))
              : [{ subject: "", body: "", preheaderText: "", signatureHtml: "" }],
        }))
        : fallback.sequences,
    createdAt: input?.createdAt || "",
    updatedAt: input?.updatedAt || "",
  };
}

function parseSubsequencesPayload(payload: any): CampaignSubsequence[] {
  const rows =
    payload?.data?.data ||
    payload?.data ||
    payload ||
    [];

  return getArrayPayload(rows).map(normalizeSubsequence);
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function looksLikeHtml(value = "") {
  return /<\/?[a-z][\s\S]*>/i.test(String(value || ""));
}

function bodyToEditorHtml(value = "") {
  if (!value) return "";
  if (looksLikeHtml(value)) return value;

  return escapeHtml(value).replace(/\n/g, "<br>");
}

function decodeHtmlEntities(value = "") {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function plainTextFromHtml(value = "") {
  return decodeHtmlEntities(
    String(value || "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(div|p|li|tr|h1|h2|h3|h4|h5|h6)>/gi, "\n")
      .replace(/<[^>]*>/g, "")
  )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type TooltipProps = {
  label: string;
  children: ReactNode;
};

function Tooltip({ label, children }: TooltipProps) {
  return (
    <div className="group relative inline-flex">
      {children}
      <div className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-[120] -translate-x-1/2 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-white opacity-0 shadow-lg transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100 whitespace-nowrap">
        {label}
      </div>
    </div>
  );
}

type IconButtonProps = {
  label: string;
  onClick?: () => void;
  active?: boolean;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
};

function IconButton({
  label,
  onClick,
  active = false,
  children,
  className = "",
  disabled = false,
}: IconButtonProps) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cx(
          "inline-flex h-9 w-9 items-center justify-center rounded-xl border text-slate-600 transition",
          active
            ? "border-blue-200 bg-blue-50 text-blue-600"
            : "border-transparent bg-transparent hover:bg-slate-100 hover:text-slate-900",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        {children}
      </button>
    </Tooltip>
  );
}

type ToolbarButtonProps = {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  active?: boolean;
};

function ToolbarButton({
  label,
  icon,
  onClick,
  active = false,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "inline-flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-medium transition",
        active ? "text-blue-600" : "text-slate-600 hover:text-slate-900"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function useClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  onOutside: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    function handle(event: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(event.target as Node)) {
        onOutside();
      }
    }

    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [enabled, onOutside, ref]);
}

type SidebarRoleResponse = {
  success?: boolean;
  data?: {
    role?: string;
  };
};

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = String(params?.id || "");
  const [viewerRole, setViewerRole] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("analytics");
  const [analyticsSubTab, setAnalyticsSubTab] = useState<AnalyticsSubTab>("step_analytics");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<ApiState>(null);

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [overview, setOverview] = useState<AnalyticsOverview>({
    totalProspects: 0,
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalReplies: 0,
    totalOpportunities: 0,
    totalQualified: 0,
    totalAssigned: 0,
    progressPercent: 0,
  });
  const [stepAnalytics, setStepAnalytics] = useState<StepAnalyticsRow[]>([]);
  const [dailyAnalytics, setDailyAnalytics] = useState<DailyAnalyticsRow[]>([]);
  const [configuration, setConfiguration] = useState<CampaignConfiguration>(getDefaultConfiguration());

  const [selectedScheduleIndex, setSelectedScheduleIndex] = useState(0);
  const [selectedSequenceStepIndex, setSelectedSequenceStepIndex] = useState(0);
  const [selectedSequenceVariantIndex, setSelectedSequenceVariantIndex] = useState(0);

  const [scheduleTimezoneOptions, setScheduleTimezoneOptions] = useState<TimezoneOption[]>([
    { value: "Asia/Kolkata", label: "Asia/Kolkata" },
  ]);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreviewColumns, setCsvPreviewColumns] = useState<CsvPreviewColumn[]>([]);
  const [csvPreviewFileName, setCsvPreviewFileName] = useState("");
  const [csvPreviewTotalRows, setCsvPreviewTotalRows] = useState(0);
  const [csvPreviewRows, setCsvPreviewRows] = useState<CsvPreviewRow[]>([]);

  const [manualForm, setManualForm] = useState<ManualForm>({
    entityName: "",
    contactName: "",
    contactEmail: "",
  });
  const [sheetUrl, setSheetUrl] = useState("");
  const [leadSearch, setLeadSearch] = useState("");

  const [templateVariables, setTemplateVariables] = useState<string[]>([]);
  const [submittingKey, setSubmittingKey] = useState("");
  const [timeRange, setTimeRange] = useState<RangeKey>("last_4_weeks");

  const [removeLeadOpen, setRemoveLeadOpen] = useState(false);
  const [removeLead, setRemoveLead] = useState<ContactRow | null>(null);

  const [metricMenuOpen, setMetricMenuOpen] = useState(false);
  const [metricSearch, setMetricSearch] = useState("");
  const [includeAutoReplies, setIncludeAutoReplies] = useState(true);
  const [visibleMetrics, setVisibleMetrics] =
    useState<Record<MetricKey, boolean>>(defaultVisibleMetrics);

  const [subsequences, setSubsequences] = useState<CampaignSubsequence[]>([]);
  const [isSubsequenceModalOpen, setIsSubsequenceModalOpen] = useState(false);
  const [editingSubsequenceId, setEditingSubsequenceId] = useState<string | null>(null);
  const [subsequenceForm, setSubsequenceForm] = useState<CampaignSubsequence>(getDefaultSubsequence());

  const [selectedSenderEmail, setSelectedSenderEmail] = useState("");
  const [selectedAccountEmails, setSelectedAccountEmails] = useState<string[]>([]);
  const [showCcBcc, setShowCcBcc] = useState(false);

  const [customTemplates, setCustomTemplates] = useState<SequenceTemplate[]>([]);
  const mergedTemplateGroups = useMemo<SequenceTemplateGroup[]>(() => {
    return sequenceTemplateGroups.map((group) =>
      group.category === "custom_templates"
        ? { ...group, templates: customTemplates }
        : group
    );
  }, [customTemplates]);

  const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
  const [isSaveAsTemplateModalOpen, setIsSaveAsTemplateModalOpen] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState("");

  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const [expandedTemplateGroups, setExpandedTemplateGroups] = useState<Record<string, boolean>>({
    custom_templates: true,
    lead_generation: true,
    leadgen_agency: false,
    video_production: false,
    marketing_advertising: false,
    coaching: false,
    appointment_setting: false,
    influencer_marketing: false,
    growth_agency: false,
    follow_ups: false,
    tiktok_agency: false,
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("lead_generation_quick_question");

  const [isSequencePreviewOpen, setIsSequencePreviewOpen] = useState(false);
  const [sequencePreview, setSequencePreview] = useState<SequencePreviewData | null>(null);
  const [previewLeadId, setPreviewLeadId] = useState("");

  const sequenceEditorRef = useRef<HTMLDivElement | null>(null);
  const subjectInputRef = useRef<HTMLInputElement | null>(null);
  const savedSelectionRangeRef = useRef<Range | null>(null);
  const selectedLinkElementRef = useRef<HTMLAnchorElement | null>(null);

  const [isLinkToolsOpen, setIsLinkToolsOpen] = useState(false);
  const [linkToolsPosition, setLinkToolsPosition] = useState<{ top: number; left: number } | null>(null);

  const [isLinkEditorOpen, setIsLinkEditorOpen] = useState(false);
  const [linkEditorMode, setLinkEditorMode] = useState<"insert" | "edit">("insert");
  const [linkEditorUrl, setLinkEditorUrl] = useState("");
  const [linkEditorText, setLinkEditorText] = useState("");

  const [isLeadImportModalOpen, setIsLeadImportModalOpen] = useState(false);
  const [leadImportMode, setLeadImportMode] = useState<LeadImportMode>(null);

  const saveMenuRef = useRef<HTMLDivElement | null>(null);
  const variablesMenuRef = useRef<HTMLDivElement | null>(null);
  const metricMenuRef = useRef<HTMLDivElement | null>(null);
  const linkToolsRef = useRef<HTMLDivElement | null>(null);

  const [sequenceInsertTarget, setSequenceInsertTarget] = useState<{
    stepIndex: number;
    field: "subject" | "body";
  } | null>(null);

  const flowType: CampaignFlowType = campaign?.flowType || "standard_brand";
  const selectedSequenceStep =
    configuration.sequences[selectedSequenceStepIndex] || configuration.sequences[0];

  const selectedSequenceVariant =
    selectedSequenceStep?.variants?.[selectedSequenceVariantIndex] || {
      subject: "",
      body: "",
    };

  const [isVariablesMenuOpen, setIsVariablesMenuOpen] = useState(false);

  function closeLinkTools() {
    setIsLinkToolsOpen(false);
    setLinkToolsPosition(null);
    selectedLinkElementRef.current = null;
  }

  useClickOutside(saveMenuRef, () => setIsSaveMenuOpen(false), isSaveMenuOpen);
  useClickOutside(
    variablesMenuRef,
    () => setIsVariablesMenuOpen(false),
    isVariablesMenuOpen
  );
  useClickOutside(metricMenuRef, () => setMetricMenuOpen(false), metricMenuOpen);
  useClickOutside(linkToolsRef, () => closeLinkTools(), isLinkToolsOpen);


  async function showApiError(error: unknown, fallback: string) {
    setMessage({
      type: "error",
      text: await getApiErrorMessage(error, fallback),
    });
  }

  function openLeadImportModal() {
    setLeadImportMode(null);
    setIsLeadImportModalOpen(true);
  }

  function closeLeadImportModal() {
    setIsLeadImportModalOpen(false);
    setLeadImportMode(null);
    resetCsvImportState();
  }

  function openLeadImportMode(mode: Exclude<LeadImportMode, null>) {
    setLeadImportMode(mode);
  }

  useEffect(() => {
    const available = Array.from(
      new Set(
        (
          campaign?.instantly?.availableAccountEmails?.length
            ? campaign.instantly.availableAccountEmails
            : campaign?.instantly?.accountEmails || []
        )
          .map((item) => normalizeEmailValue(item))
          .filter(Boolean)
      )
    );

    const configured = Array.from(
      new Set(
        (campaign?.instantly?.accountEmails || [])
          .map((item) => normalizeEmailValue(item))
          .filter(Boolean)
      )
    );

    const savedPrimary = normalizeEmailValue(campaign?.instantly?.senderAccountEmail);

    let nextSelectedAccounts: string[] = [];

    if (configured.length) {
      nextSelectedAccounts = configured.filter((email) => available.includes(email));
    } else if (savedPrimary && available.includes(savedPrimary)) {
      nextSelectedAccounts = [savedPrimary];
    } else if (available.length) {
      nextSelectedAccounts = [available[0]];
    }

    const nextSelectedSender =
      savedPrimary && nextSelectedAccounts.includes(savedPrimary)
        ? savedPrimary
        : nextSelectedAccounts[0] || "";

    setSelectedAccountEmails(nextSelectedAccounts);
    setSelectedSenderEmail(nextSelectedSender);
  }, [
    campaign?.instantly?.senderAccountEmail,
    campaign?.instantly?.accountEmails,
    campaign?.instantly?.availableAccountEmails,
  ]);

  function resetCsvImportState() {
    setCsvFile(null);
    setCsvPreviewColumns([]);
    setCsvPreviewRows([]);
    setCsvPreviewFileName("");
    setCsvPreviewTotalRows(0);
  }

  async function loadTimezoneOptions(preferredTimezone?: string) {
    const fallbackTimezone = preferredTimezone || configuration.schedule.timezone || "UTC";

    try {
      const payload: any = await adminGet(`/timezone/all`);
      const apiTimezones = Array.isArray(payload?.data?.timezones)
        ? payload.data.timezones
        : Array.isArray(payload?.timezones)
          ? payload.timezones
          : [];

      const mappedOptions: TimezoneOption[] = apiTimezones
        .map((item: any) => {
          const value = item?.timezone || item?.value || item?.name || "";
          if (!value) return null;
          return {
            value,
            label:
              item?.label ||
              item?.displayName ||
              `${value}${item?.offsetLabel ? ` (${item.offsetLabel})` : ""}`,
            offsetLabel: item?.offsetLabel,
            nowLocal: item?.nowLocal || null,
          };
        })
        .filter(Boolean) as TimezoneOption[];

      const uniqueOptions = Array.from(
        new Map(mappedOptions.map((item) => [item.value, item])).values()
      );

      const hasFallback = uniqueOptions.some((item) => item.value === fallbackTimezone);

      setScheduleTimezoneOptions(
        hasFallback
          ? uniqueOptions
          : [...uniqueOptions, { value: fallbackTimezone, label: fallbackTimezone }]
      );
    } catch {
      setScheduleTimezoneOptions([{ value: fallbackTimezone, label: fallbackTimezone }]);
    }
  }

  async function loadPage(showLoader = true) {
    try {
      if (showLoader) setLoading(true);

      const cacheBust = Date.now();

      const [
        campaignPayload,
        configurationPayload,
        contactsPayload,
        overviewPayload,
        stepsPayload,
        dailyPayload,
        templateVarsPayload,
        templatesPayload,
        sidebarPayload,
      ] = await Promise.all([
        adminGet(`/outreach/campaigns/${campaignId}`, { _ts: cacheBust }),
        adminGet(`/outreach/campaigns/${campaignId}/configuration`, { _ts: cacheBust }).catch(() => null),
        adminGet(`/outreach/campaigns/${campaignId}/contacts`, { _ts: cacheBust }),
        adminGet(`/outreach/campaigns/${campaignId}/analytics/overview`, { range: timeRange, _ts: cacheBust }).catch(() => null),
        adminGet(`/outreach/campaigns/${campaignId}/analytics/steps`, { range: timeRange, _ts: cacheBust }).catch(() => null),
        adminGet(`/outreach/campaigns/${campaignId}/analytics/daily`, { range: timeRange, _ts: cacheBust }).catch(() => null),
        adminGet(`/outreach/campaigns/${campaignId}/template-variables`, { _ts: cacheBust }).catch(() => null),
        adminGet(`/outreach/campaigns/${campaignId}/templates`, { _ts: cacheBust }).catch(() => null),
        adminGet<SidebarRoleResponse>(`/outreach/sidebar`, { _ts: cacheBust }).catch(() => null),
      ]);

      const nextCampaign = parseCampaign(campaignPayload);

      if (nextCampaign && configurationPayload?.data) {
        const configData = configurationPayload.data;

        nextCampaign.configuration = normalizeConfiguration(
          configData.configuration || nextCampaign.configuration,
          nextCampaign.flowType
        );

        nextCampaign.instantly = {
          ...(nextCampaign.instantly || {}),
          ...(configData.instantly || {}),
        };

        if (configData.status) {
          nextCampaign.status = configData.status;
        }

        if (configData.flowType === "ime_influencer" || configData.flowType === "standard_brand") {
          nextCampaign.flowType = configData.flowType;
        }
      }
      const nextContacts = parseContacts(contactsPayload);

      setCampaign(nextCampaign);
      setContacts(nextContacts);

      const nextViewerRole = String(sidebarPayload?.data?.role || "")
        .trim()
        .toLowerCase();

      setViewerRole(nextViewerRole);

      if (nextCampaign) {
        setConfiguration(nextCampaign.configuration);
        setSelectedScheduleIndex(0);
        await loadTimezoneOptions(nextCampaign.configuration.schedule.timezone);
      }

      setOverview(parseOverview(overviewPayload, nextCampaign, nextContacts));
      setStepAnalytics(parseStepAnalytics(stepsPayload, nextCampaign));
      setDailyAnalytics(parseDailyAnalytics(dailyPayload));

      const varsFromApi = Array.isArray(templateVarsPayload?.data?.templateVariables)
        ? templateVarsPayload.data.templateVariables
        : [];

      const varsFromCampaign = Array.isArray(nextCampaign?.templateVariables)
        ? nextCampaign.templateVariables
        : [];

      setTemplateVariables(varsFromApi.length ? varsFromApi : varsFromCampaign);

      const templatesRoot =
        templatesPayload?.data?.data ||
        templatesPayload?.data ||
        templatesPayload ||
        {};

      const customTemplateRows = Array.isArray(templatesRoot?.customTemplates)
        ? templatesRoot.customTemplates
        : [];

      const nextCustomTemplates: SequenceTemplate[] = customTemplateRows.map((item: any) => ({
        id: String(item?._id || item?.id || ""),
        category: String(item?.category || "custom_templates"),
        title: String(item?.name || item?.title || "Untitled Template"),
        subject: String(item?.subject || ""),
        body: String(item?.body || ""),
      }));

      setCustomTemplates(nextCustomTemplates);

      if (!selectedTemplateId && nextCustomTemplates.length) {
        setSelectedTemplateId(nextCustomTemplates[0].id);
      }

      let nextSubsequences: CampaignSubsequence[] = [];

      if (nextCampaign?.status === "launched") {
        const subsequencesPayload: any = await adminGet(
          `/outreach/campaigns/${campaignId}/subsequences`
        ).catch(() => null);

        nextSubsequences = parseSubsequencesPayload(subsequencesPayload);
      }

      setSubsequences(nextSubsequences);

      if (Array.isArray(nextCampaign?.csvSchema?.columns) && nextCampaign.csvSchema.columns.length) {
        setCsvPreviewColumns(nextCampaign.csvSchema.columns);
        setCsvPreviewFileName(nextCampaign.csvSchema.fileName || "");
        setCsvPreviewTotalRows(nextCampaign.csvSchema.totalRows || 0);
      }
    } catch (error) {
      await showApiError(error, "Failed to load campaign");
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  useEffect(() => {
    if (campaignId) void loadPage(true);
  }, [campaignId, timeRange]);

  const normalizedViewerRole = String(viewerRole || "").trim().toLowerCase();
  const isSdrViewer = normalizedViewerRole === "sdr";
  const isRhViewer = normalizedViewerRole === "revenue_head" || normalizedViewerRole === "rh";
  const isImeViewer = normalizedViewerRole === "ime";
  const isSuperAdminViewer = normalizedViewerRole === "super_admin";

  const canViewReplyAnalytics = !isSdrViewer;

  // keep this FALSE for RH unless backend getManagedCampaign is also updated
  const canManageCampaign =
    isSuperAdminViewer ||
    isSdrViewer ||
    isImeViewer;

  useEffect(() => {
    if (isSdrViewer && analyticsSubTab === "activity") {
      setAnalyticsSubTab("step_analytics");
    }
  }, [isSdrViewer, analyticsSubTab]);

  useEffect(() => {
    const timer = setTimeout(() => setMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [message]);

  function updateCsvPreviewColumn(header: string, patch: Partial<CsvPreviewColumn>) {
    setCsvPreviewColumns((prev) =>
      prev.map((col) => (col.header === header ? { ...col, ...patch } : col))
    );
  }

  function updateStep(stepIndex: number, patch: Partial<CampaignSequenceStep>) {
    setConfiguration((prev) => ({
      ...prev,
      sequences: prev.sequences.map((step, index) =>
        index === stepIndex ? { ...step, ...patch } : step
      ),
    }));
  }

  function openCreateSubsequence() {
    setEditingSubsequenceId(null);
    setSubsequenceForm(getDefaultSubsequence());
    setIsSubsequenceModalOpen(true);
  }

  function openEditSubsequence(row: CampaignSubsequence) {
    setEditingSubsequenceId(row._id);
    setSubsequenceForm(normalizeSubsequence(row));
    setIsSubsequenceModalOpen(true);
  }

  function updateSubsequenceStep(stepIndex: number, patch: Partial<CampaignSubsequenceStep>) {
    setSubsequenceForm((prev) => ({
      ...prev,
      sequences: prev.sequences.map((step, index) =>
        index === stepIndex ? { ...step, ...patch } : step
      ),
    }));
  }

  function updateSubsequenceVariant(stepIndex: number, patch: Partial<CampaignSequenceVariant>) {
    setSubsequenceForm((prev) => ({
      ...prev,
      sequences: prev.sequences.map((step, index) =>
        index === stepIndex
          ? {
            ...step,
            variants: step.variants.map((variant, variantIndex) =>
              variantIndex === 0 ? { ...variant, ...patch } : variant
            ),
          }
          : step
      ),
    }));
  }

  function addSubsequenceStep() {
    setSubsequenceForm((prev) => ({
      ...prev,
      sequences: [
        ...prev.sequences,
        {
          stepOrder: prev.sequences.length + 1,
          type: "email",
          delay: 1,
          delayUnit: "days",
          variants: [{ subject: "", body: "" }],
        },
      ],
    }));
  }

  function removeSubsequenceStep(stepIndex: number) {
    setSubsequenceForm((prev) => {
      if (prev.sequences.length <= 1) return prev;

      return {
        ...prev,
        sequences: prev.sequences
          .filter((_, index) => index !== stepIndex)
          .map((step, index) => ({
            ...step,
            stepOrder: index + 1,
          })),
      };
    });
  }

  async function handleSaveSubsequence() {
    try {
      if (!subsequenceForm.name.trim()) {
        throw new Error("Subsequence name is required");
      }

      setSubmittingKey("save-subsequence");

      const payload = {
        name: subsequenceForm.name.trim(),
        trigger: {
          statuses: subsequenceForm.trigger.statuses,
          activities: subsequenceForm.trigger.activities,
          phrases: subsequenceForm.trigger.phrases,
        },
        scheduleMode: subsequenceForm.scheduleMode,
        dailyLimitMode: subsequenceForm.dailyLimitMode,
        dailyLimit: subsequenceForm.dailyLimit,
        ignoreAccountDailyLimits: subsequenceForm.ignoreAccountDailyLimits,
        sequences: subsequenceForm.sequences,
      };

      const response: any = editingSubsequenceId
        ? await adminPatch(
          `/outreach/campaigns/${campaignId}/subsequences/${editingSubsequenceId}`,
          payload
        )
        : await adminPost(`/outreach/campaigns/${campaignId}/subsequences`, payload);

      if (response?.success === false) {
        throw new Error(response?.message || "Failed to save subsequence");
      }

      setIsSubsequenceModalOpen(false);
      setEditingSubsequenceId(null);
      setSubsequenceForm(getDefaultSubsequence());

      setMessage({
        type: "success",
        text: response?.message || "Subsequence saved successfully",
      });

      await loadPage(false);
    } catch (error) {
      await showApiError(error, "Failed to save subsequence");
    } finally {
      setSubmittingKey("");
    }
  }

  async function handleDeleteSubsequence(subsequenceId: string) {
    try {
      setSubmittingKey(`delete-subsequence-${subsequenceId}`);

      const response: any = await adminDelete(
        `/outreach/campaigns/${campaignId}/subsequences/${subsequenceId}`
      );

      if (response?.success === false) {
        throw new Error(response?.message || "Failed to delete subsequence");
      }

      setMessage({
        type: "success",
        text: response?.message || "Subsequence deleted successfully",
      });

      await loadPage(false);
    } catch (error) {
      await showApiError(error, "Failed to delete subsequence");
    } finally {
      setSubmittingKey("");
    }
  }

  async function handleDuplicateSubsequence(subsequenceId: string) {
    try {
      setSubmittingKey(`duplicate-subsequence-${subsequenceId}`);

      const response: any = await adminPost(
        `/outreach/campaigns/${campaignId}/subsequences/${subsequenceId}/duplicate`
      );

      if (response?.success === false) {
        throw new Error(response?.message || "Failed to duplicate subsequence");
      }

      setMessage({
        type: "success",
        text: response?.message || "Subsequence duplicated successfully",
      });

      await loadPage(false);
    } catch (error) {
      await showApiError(error, "Failed to duplicate subsequence");
    } finally {
      setSubmittingKey("");
    }
  }

  async function handleToggleSubsequenceStatus(row: CampaignSubsequence) {
    try {
      const action = row.status === "launched" ? "pause" : "launch";
      setSubmittingKey(`${action}-subsequence-${row._id}`);

      const response: any = await adminPost(
        `/outreach/campaigns/${campaignId}/subsequences/${row._id}/${action}`
      );

      if (response?.success === false) {
        throw new Error(response?.message || `Failed to ${action} subsequence`);
      }

      setMessage({
        type: "success",
        text: response?.message || `Subsequence ${action}ed successfully`,
      });

      await loadPage(false);
    } catch (error) {
      await showApiError(error, "Failed to update subsequence");
    } finally {
      setSubmittingKey("");
    }
  }

  function updateSendingOption(key: keyof SendingOptions, value: any) {
    setConfiguration((prev) => ({
      ...prev,
      sendingOptions: {
        ...prev.sendingOptions,
        [key]: value,
      },
    }));
  }

  function toggleSelectedAccountEmail(email: string) {
    const normalizedEmail = normalizeEmailValue(email);

    setSelectedAccountEmails((prev) => {
      const normalizedPrev = Array.from(
        new Set(prev.map((item) => normalizeEmailValue(item)).filter(Boolean))
      );

      const exists = normalizedPrev.includes(normalizedEmail);

      const next = exists
        ? normalizedPrev.filter((item) => item !== normalizedEmail)
        : [...normalizedPrev, normalizedEmail];

      const normalizedSelectedSender = normalizeEmailValue(selectedSenderEmail);

      if (!next.includes(normalizedSelectedSender)) {
        setSelectedSenderEmail(next[0] || "");
      }

      return next;
    });
  }

  function updateScheduleWindow(index: number, patch: Partial<CampaignScheduleWindow>) {
    setConfiguration((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        windows: prev.schedule.windows.map((windowItem, itemIndex) =>
          itemIndex === index ? { ...windowItem, ...patch } : windowItem
        ),
      },
    }));
  }

  function updateActiveScheduleWindow(patch: Partial<CampaignScheduleWindow>) {
    updateScheduleWindow(selectedScheduleIndex, patch);
  }

  function toggleActiveScheduleDay(dayKey: string) {
    setConfiguration((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        windows: prev.schedule.windows.map((windowItem, itemIndex) =>
          itemIndex === selectedScheduleIndex
            ? {
              ...windowItem,
              days: {
                ...windowItem.days,
                [dayKey]: !windowItem.days?.[dayKey],
              },
            }
            : windowItem
        ),
      },
    }));
  }

  function addScheduleWindow() {
    setConfiguration((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        windows: [
          ...prev.schedule.windows,
          {
            name: `Schedule ${prev.schedule.windows.length + 1}`,
            from: "09:00",
            to: "18:00",
            days: createDefaultDays(),
          },
        ],
      },
    }));
    setSelectedScheduleIndex(configuration.schedule.windows.length);
  }

  function removeActiveScheduleWindow() {
    if (configuration.schedule.windows.length <= 1) return;

    setConfiguration((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        windows: prev.schedule.windows.filter((_, index) => index !== selectedScheduleIndex),
      },
    }));

    setSelectedScheduleIndex((prev) => Math.max(0, prev - 1));
  }

  const previewLeadOptions = useMemo(() => {
    return contacts.map((row) => ({
      value: row._id,
      label: `${getResolvedLeadName(row)} • ${getResolvedContactName(row)} • ${getResolvedContactMeta(row)}`,
    }));
  }, [contacts]);

  useEffect(() => {
    if (!previewLeadId && contacts.length > 0) {
      setPreviewLeadId(contacts[0]._id);
    }
  }, [contacts, previewLeadId]);

  function normalizeEditorHtmlForEmail(value = "") {
    const html = String(value || "").trim();

    if (!html) return "";

    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
    const root = doc.body;

    root.querySelectorAll("script, style, iframe, object, embed").forEach((node) => {
      node.remove();
    });

    root.querySelectorAll("*").forEach((node) => {
      Array.from(node.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const attrValue = attr.value || "";

        if (name.startsWith("on")) {
          node.removeAttribute(attr.name);
        }

        if (name === "href") {
          const safeHref =
            /^https?:\/\//i.test(attrValue) ||
            /^mailto:/i.test(attrValue) ||
            /^tel:/i.test(attrValue);

          if (!safeHref) {
            node.removeAttribute(attr.name);
          }
        }

        if (name === "style" || name === "class") {
          node.removeAttribute(attr.name);
        }
      });
    });

    root.querySelectorAll("a").forEach((link) => {
      const href = link.getAttribute("href") || "";

      if (!href) {
        link.replaceWith(doc.createTextNode(link.textContent || ""));
        return;
      }

      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    });

    const normalized = root.innerHTML
      .replace(/<div><br><\/div>/gi, "<br>")
      .replace(/<div>/gi, "")
      .replace(/<\/div>/gi, "<br>")
      .replace(/<p><br><\/p>/gi, "<br>")
      .replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>")
      .trim();

    return plainTextFromHtml(normalized) ? normalized : "";
  }

  function buildLatestConfigurationForSave(): CampaignConfiguration {
    const domBody = sequenceEditorRef.current?.innerHTML || "";
    const latestBodyHtml = normalizeEditorHtmlForEmail(domBody);

    const latestBody =
      latestBodyHtml ||
      selectedSequenceVariant?.body ||
      "";

    const latestSubject =
      subjectInputRef.current?.value ??
      selectedSequenceVariant?.subject ??
      "";

    const nextConfiguration: CampaignConfiguration = {
      ...configuration,
      sequences: configuration.sequences.map((step, stepIndex) => {
        return {
          ...step,
          variants: step.variants.map((variant, variantIndex) => {
            const isActiveVariant =
              stepIndex === selectedSequenceStepIndex &&
              variantIndex === selectedSequenceVariantIndex;

            const nextVariant = isActiveVariant
              ? {
                ...variant,
                subject: latestSubject,
                body: latestBody,
              }
              : variant;

            return {
              ...nextVariant,
              subject: String(nextVariant.subject || "").trim(),
              body: normalizeEditorHtmlForEmail(nextVariant.body || ""),
            };
          }),
        };
      }),
    };

    nextConfiguration.sequences.forEach((step, stepIndex) => {
      const variants = Array.isArray(step.variants) ? step.variants : [];

      if (!variants.length) {
        throw new Error(`Step ${stepIndex + 1} must have at least one variant.`);
      }

      variants.forEach((variant, variantIndex) => {
        const bodyText = plainTextFromHtml(variant.body || "");

        if (!bodyText) {
          throw new Error(
            `Step ${stepIndex + 1}, Variant ${variantIndex + 1}: email body is empty. Please write the email body before saving or launching.`
          );
        }
      });
    });

    return nextConfiguration;
  }

  async function handleSaveConfiguration(syncNow = true) {
    try {
      setSubmittingKey(syncNow ? "save-sync" : "save-config");

      const nextConfiguration = buildLatestConfigurationForSave();

      setConfiguration(nextConfiguration);

      const payload: any = await adminPatch(`/outreach/campaigns/${campaignId}/configuration`, {
        configuration: nextConfiguration,
        syncNow,
        senderAccountEmail: selectedSenderEmail,
        accountEmails: selectedAccountEmails,
      });

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to save campaign configuration");
      }

      setMessage({
        type: "success",
        text: payload?.message || "Campaign configuration saved successfully",
      });

      await loadPage(false);
    } catch (error) {
      await showApiError(error, "Failed to save campaign configuration");
    } finally {
      setSubmittingKey("");
    }
  }

  async function handleDirectSync() {
    try {
      setSubmittingKey("sync");

      const latestConfiguration = buildLatestConfigurationForSave();

      setConfiguration(latestConfiguration);

      const payload: any = await adminPatch(`/outreach/campaigns/${campaignId}/configuration`, {
        configuration: latestConfiguration,
        syncNow: true,
        senderAccountEmail: selectedSenderEmail,
        accountEmails: selectedAccountEmails,
      });

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to sync campaign");
      }

      setMessage({
        type: "success",
        text: payload?.message || "Campaign synced successfully",
      });

      await loadPage(false);
    } catch (error) {
      await showApiError(error, "Failed to sync campaign");
    } finally {
      setSubmittingKey("");
    }
  }

  async function handlePreviewCsv(file: File) {
    try {
      setSubmittingKey("csv-preview");

      const formData = new FormData();
      formData.append("file", file);

      const payload: any = await adminPostFormData(
        `/outreach/campaigns/${campaignId}/contacts/csv/preview`,
        formData
      );

      const preview = payload?.data;

      setCsvFile(file);
      setCsvPreviewColumns(Array.isArray(preview?.columns) ? preview.columns : []);
      setCsvPreviewRows(Array.isArray(preview?.previewRows) ? preview.previewRows : []);
      setCsvPreviewFileName(preview?.fileName || file.name);
      setCsvPreviewTotalRows(preview?.totalRows || 0);
      setTemplateVariables(
        Array.isArray(preview?.templateVariables) ? preview.templateVariables : []
      );

      setMessage({
        type: "success",
        text: "CSV processed successfully",
      });
    } catch (error) {
      await showApiError(error, "Failed to preview CSV");
    } finally {
      setSubmittingKey("");
    }
  }

  async function handleConfirmCsvImport() {
    try {
      if (!csvFile) {
        throw new Error("Please select a CSV file");
      }

      setSubmittingKey("csv-import");

      const formData = new FormData();
      formData.append("file", csvFile);
      formData.append("columns", JSON.stringify(csvPreviewColumns));

      const payload: any = await adminPostFormData(
        `/outreach/campaigns/${campaignId}/contacts/csv`,
        formData
      );

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to upload CSV");
      }

      setTemplateVariables(
        Array.isArray(payload?.data?.templateVariables)
          ? payload.data.templateVariables
          : templateVariables
      );

      setMessage({
        type: "success",
        text: payload?.message || "CSV uploaded successfully",
      });

      resetCsvImportState();
      setLeadImportMode(null);
      setIsLeadImportModalOpen(false);

      await loadPage(false);
    } catch (error) {
      await showApiError(error, "Failed to upload CSV");
    } finally {
      setSubmittingKey("");
    }
  }

  async function handleManualAdd() {
    try {
      if (!manualForm.entityName.trim()) throw new Error("Brand/Influencer name is required");
      if (!manualForm.contactEmail.trim()) throw new Error("Contact email is required");

      setSubmittingKey("manual");

      const payload: any = await adminPost(`/outreach/campaigns/${campaignId}/contacts/manual`, {
        companyName: manualForm.entityName.trim(),
        contactName: manualForm.contactName.trim(),
        contactEmail: manualForm.contactEmail.trim(),
      });

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to add manual lead");
      }

      setManualForm({
        entityName: "",
        contactName: "",
        contactEmail: "",
      });

      setMessage({
        type: "success",
        text: payload?.message || "Lead added successfully",
      });

      await loadPage(false);
    } catch (error) {
      await showApiError(error, "Failed to add manual lead");
    } finally {
      setSubmittingKey("");
    }
  }

  async function handleGoogleSheetImport() {
    try {
      if (!sheetUrl.trim()) throw new Error("Google Sheets URL is required");

      setSubmittingKey("sheet");

      const payload: any = await adminPost(
        `/outreach/campaigns/${campaignId}/contacts/google-sheet`,
        { sheetUrl: sheetUrl.trim() }
      );

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to import Google Sheet");
      }

      setSheetUrl("");
      setMessage({
        type: "success",
        text: payload?.message || "Google Sheet imported successfully",
      });

      await loadPage(false);
    } catch (error) {
      await showApiError(error, "Failed to import Google Sheet");
    } finally {
      setSubmittingKey("");
    }
  }

  async function handleLaunch() {
    try {
      setSubmittingKey("launch");

      // Always read latest editor DOM, not only when activeTab === "sequences"
      const latestConfiguration = buildLatestConfigurationForSave();

      setConfiguration(latestConfiguration);

      const savePayload: any = await adminPatch(
        `/outreach/campaigns/${campaignId}/configuration`,
        {
          configuration: latestConfiguration,
          syncNow: false,
          senderAccountEmail: selectedSenderEmail,
          accountEmails: selectedAccountEmails,
        }
      );

      if (savePayload?.success === false) {
        throw new Error(savePayload?.message || "Failed to save campaign configuration");
      }

      const route = campaign?.status === "paused" ? "activate" : "launch";

      const payload: any = await adminPost(`/outreach/campaigns/${campaignId}/${route}`, {
        senderAccountEmail: selectedSenderEmail,
        accountEmails: selectedAccountEmails,
      });

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to launch campaign");
      }

      setMessage({
        type: "success",
        text: payload?.message || "Campaign launched successfully",
      });

      await loadPage(false);
    } catch (error) {
      await showApiError(error, "Failed to update campaign");
    } finally {
      setSubmittingKey("");
    }
  }

  async function handlePause() {
    try {
      setSubmittingKey("pause");

      const payload: any = await adminPost(`/outreach/campaigns/${campaignId}/pause`);

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to pause campaign");
      }

      setMessage({
        type: "success",
        text: payload?.message || "Campaign paused successfully",
      });

      await loadPage(false);
    } catch (error) {
      await showApiError(error, "Failed to pause campaign");
    } finally {
      setSubmittingKey("");
    }
  }

  // async function handleShare() {
  //   try {
  //     setSubmittingKey("share");

  //     const payload: any = await adminPost(`/outreach/campaigns/${campaignId}/share`);
  //     const shareLink =
  //       payload?.data?.shareLink ||
  //       campaign?.instantly?.shareLink ||
  //       "";

  //     if (!shareLink || !/^https?:\/\//i.test(String(shareLink))) {
  //       setMessage({
  //         type: "info",
  //         text: payload?.message || "Campaign shared, but no share link was returned",
  //       });
  //       return;
  //     }

  //     await navigator.clipboard.writeText(String(shareLink));

  //     setMessage({
  //       type: "success",
  //       text: "Share link copied to clipboard",
  //     });
  //   } catch (error) {
  //     await showApiError(error, "Failed to share campaign");
  //   } finally {
  //     setSubmittingKey("");
  //   }
  // }

  async function handleLeadStageChange(prospectId: string, stage: string) {
    try {
      setSubmittingKey(`stage-${prospectId}`);

      const payload: any = await adminPatch(
        `/outreach/campaigns/${campaignId}/contacts/${prospectId}/stage`,
        { stage }
      );

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to update lead stage");
      }

      setContacts((prev) =>
        prev.map((item) => (item._id === prospectId ? { ...item, stage } : item))
      );

      setMessage({
        type: "success",
        text: payload?.message || "Lead stage updated successfully",
      });
    } catch (error) {
      await showApiError(error, "Failed to update lead stage");
    } finally {
      setSubmittingKey("");
    }
  }

  async function handleOpenSequencePreview(nextProspectId?: string) {
    try {
      setSubmittingKey("sequence-preview");

      const latestConfiguration = buildLatestConfigurationForSave();

      const currentStep =
        latestConfiguration.sequences[selectedSequenceStepIndex] ||
        latestConfiguration.sequences[0];

      const currentVariant =
        currentStep?.variants?.[selectedSequenceVariantIndex] ||
        currentStep?.variants?.[0] || {
          subject: "",
          body: "",
          preheaderText: "",
          signatureHtml: "",
        };

      const chosenProspectId =
        nextProspectId || previewLeadId || contacts[0]?._id || "";

      const payload: any = await adminPost(
        `/outreach/campaigns/${campaignId}/sequence-preview`,
        {
          stepOrder: Number(currentStep?.stepOrder || 1),
          variantIndex: selectedSequenceVariantIndex,
          prospectId: chosenProspectId,
          variantOverride: {
            subject: currentVariant.subject || "",
            body: currentVariant.body || "",
            preheaderText: currentVariant.preheaderText || "",
            signatureHtml: currentVariant.signatureHtml || "",
          },
        }
      );

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to generate preview");
      }

      setSequencePreview(payload?.data || null);
      setPreviewLeadId(payload?.data?.lead?._id || chosenProspectId);
      setIsSequencePreviewOpen(true);
    } catch (error) {
      await showApiError(error, "Failed to generate preview");
    } finally {
      setSubmittingKey("");
    }
  }

  async function handleSaveAsTemplate() {
    try {
      const subject = selectedSequenceVariant?.subject || "";
      const body = selectedSequenceVariant?.body || "";

      if (!templateNameInput.trim()) {
        throw new Error("Template name is required");
      }

      if (!subject.trim() && !body.trim()) {
        throw new Error("Write subject or email body before saving template");
      }

      setSubmittingKey("save-template");

      const payload: any = await adminPost(`/outreach/campaigns/${campaignId}/templates`, {
        name: templateNameInput.trim(),
        category: "custom_templates",
        subject,
        body,
      });

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to save template");
      }

      const created =
        payload?.data?.data ||
        payload?.data ||
        null;

      if (created?._id || created?.id) {
        const nextTemplate: SequenceTemplate = {
          id: String(created?._id || created?.id),
          category: String(created?.category || "custom_templates"),
          title: String(created?.name || created?.title || templateNameInput.trim()),
          subject: String(created?.subject || subject),
          body: String(created?.body || body),
        };

        setCustomTemplates((prev) => [nextTemplate, ...prev]);
        setSelectedTemplateId(nextTemplate.id);
      } else {
        await loadPage(false);
      }

      setIsSaveAsTemplateModalOpen(false);
      setIsSaveMenuOpen(false);
      setTemplateNameInput("");

      setMessage({
        type: "success",
        text: payload?.message || "Template saved successfully",
      });
    } catch (error) {
      await showApiError(error, "Failed to save template");
    } finally {
      setSubmittingKey("");
    }
  }

  function openRemoveLead(row: ContactRow) {
    setRemoveLead(row);
    setRemoveLeadOpen(true);
  }

  async function handleRemoveLead() {
    if (!removeLead) return;

    try {
      setSubmittingKey(`remove-${removeLead._id}`);

      const payload: any = await adminDelete(
        `/outreach/campaigns/${campaignId}/contacts/${removeLead._id}`
      );

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to remove lead");
      }

      setRemoveLeadOpen(false);
      setRemoveLead(null);

      setMessage({
        type: "success",
        text: payload?.message || "Lead removed successfully",
      });

      await loadPage(false);
    } catch (error) {
      await showApiError(error, "Failed to remove lead");
    } finally {
      setSubmittingKey("");
    }
  }

  function getContactFieldValue(
    row: ContactRow,
    keys: string[],
    fallback = ""
  ): string {
    for (const key of keys) {
      const customValue = row.customFields?.[key];
      if (customValue !== undefined && customValue !== null && String(customValue).trim()) {
        return String(customValue).trim();
      }

      const templateValue = row.templateVariables?.[key];
      if (templateValue !== undefined && templateValue !== null && String(templateValue).trim()) {
        return String(templateValue).trim();
      }
    }

    return fallback;
  }

  function getTemplateValue(row: ContactRow, keys: string[]) {
    for (const key of keys) {
      const value = row.templateVariables?.[key] ?? row.customFields?.[key];
      if (String(value || "").trim()) return String(value).trim();
    }

    return "";
  }

  function getEmailLocalPart(email = "") {
    return String(email || "")
      .split("@")[0]
      ?.replace(/[._-]+/g, " ")
      .trim();
  }

  function getResolvedLeadName(row: ContactRow) {
    return (
      String(row.companyName || "").trim() ||
      getTemplateValue(row, [
        "companyName",
        "company_name",
        "brandName",
        "brand",
        "company",
        "influencerName",
        "creatorName",
        "fullName",
        "firstName",
        "name",
      ]) ||
      getContactFieldValue(row, [
        "Company Name",
        "Company",
        "Brand",
        "Brand Name",
        "Influencer Name",
        "Creator Name",
        "Full Name",
        "Name",
        "First Name",
      ]) ||
      String(row.primaryContact?.name || "").trim() ||
      getEmailLocalPart(row.primaryContact?.email) ||
      "Lead Unknown"
    );
  }

  function getResolvedContactName(row: ContactRow) {
    return (
      String(row.primaryContact?.name || "").trim() ||
      getTemplateValue(row, [
        "fullName",
        "firstName",
        "name",
        "contactName",
        "contact_name",
      ]) ||
      getContactFieldValue(row, [
        "Contact Name",
        "Full Name",
        "Name",
        "First Name",
        "POC",
      ]) ||
      getEmailLocalPart(row.primaryContact?.email) ||
      "Contact Unknown"
    );
  }

  function getResolvedContactMeta(row: ContactRow) {
    return (
      String(row.primaryContact?.email || "").trim() ||
      getTemplateValue(row, [
        "email",
        "contactEmail",
        "contact_email",
        "linkedinUrl",
        "linkedin_url",
        "website",
        "phone",
        "username",
        "handle",
      ]) ||
      getContactFieldValue(row, [
        "Email",
        "Contact Email",
        "LinkedIn URL",
        "Website",
        "Phone",
        "Instagram Handle",
        "TikTok Handle",
        "YouTube Handle",
        "Username",
        "Handle",
      ]) ||
      "—"
    );
  }

  const filteredContacts = useMemo(() => {
    const query = leadSearch.trim().toLowerCase();
    if (!query) return contacts;

    return contacts.filter((row) => {
      const dynamicValues = [
        ...Object.values(row.customFields || {}),
        ...Object.values(row.templateVariables || {}),
      ]
        .map((value) => String(value || ""))
        .join(" ");

      const haystack = [
        row.companyName,
        row.primaryContact?.name,
        row.primaryContact?.email,
        row.stage,
        getResolvedLeadName(row),
        getResolvedContactName(row),
        getResolvedContactMeta(row),
        dynamicValues,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [contacts, leadSearch]);

  const baseContactColumns: AdminTableColumn<ContactRow>[] = [
    {
      id: "contactName",
      header: "Contact",
      render: (row) => {
        const resolvedName = getResolvedContactName(row);
        const resolvedMeta = getResolvedContactMeta(row);

        return (
          <div>
            <p className="text-sm font-medium text-slate-800">{resolvedName}</p>
            <p className="mt-1 text-xs text-slate-500">{resolvedMeta}</p>
          </div>
        );
      },
    },
  ];

  const dynamicContactColumns: AdminTableColumn<ContactRow>[] = (campaign?.csvSchema?.columns || [])
    .filter((column) => column.selectedType !== "ignore")
    .filter((column) => {
      return ![
        "company_name",
        "first_name",
        "last_name",
        "full_name",
        "email",
      ].includes(column.selectedType);
    })
    .map((column) => ({
      id: `dynamic-${column.header}`,
      header: column.header,
      render: (row: ContactRow) => {
        const value =
          row.customFields?.[column.header] ??
          row.templateVariables?.[column.variableKey] ??
          "—";

        return (
          <span className="text-sm text-slate-700">
            {String(value || "—")}
          </span>
        );
      },
    }));

  const tailContactColumns: AdminTableColumn<ContactRow>[] = [
    {
      id: "launchedAt",
      header: "Launched",
      render: (row) => (
        <span className="text-sm text-slate-600">{formatDate(row.launchedAt)}</span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      render: (row) => (
        <button
          type="button"
          onClick={() => openRemoveLead(row)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  const contactColumns: AdminTableColumn<ContactRow>[] = [
    ...baseContactColumns,
    ...dynamicContactColumns,
    ...tailContactColumns,
  ];

  const activeScheduleWindow =
    configuration.schedule.windows[Math.min(selectedScheduleIndex, configuration.schedule.windows.length - 1)] ||
    configuration.schedule.windows[0];

  const totalLeads = overview.totalProspects || campaign?.stats?.totalProspects || contacts.length || 0;
  const totalSent = overview.totalSent || campaign?.stats?.totalSent || 0;
  const totalOpened = overview.totalOpened || campaign?.stats?.totalOpened || 0;
  const totalClicked = overview.totalClicked || campaign?.stats?.totalClicked || 0;
  const totalReplies = overview.totalReplies || campaign?.stats?.totalReplies || 0;
  const totalOpportunities = overview.totalOpportunities || campaign?.stats?.totalOpportunities || 0;
  const totalQualified = overview.totalQualified || campaign?.stats?.totalQualified || 0;
  const totalAssigned = overview.totalAssigned || campaign?.stats?.totalAssigned || 0;
  const progressPercent = overview.progressPercent || campaign?.stats?.progressPercent || 0;

  function formatPercent(value: number) {
    const safeValue = clampPercentNumber(Number(value || 0));
    return `${Number(safeValue.toFixed(safeValue >= 10 ? 1 : 2))}%`;
  }

  function formatRate(numerator: number, denominator: number) {
    if (!denominator || denominator <= 0) return "0%";
    return formatPercent(computeRatePercent(numerator, denominator));
  }

  const visibleReplies = includeAutoReplies
    ? totalReplies
    : Math.max(0, totalReplies - dailyAnalytics.reduce((sum, item) => sum + item.automaticReplies, 0));

  const dailyTotals = dailyAnalytics.reduce(
    (acc, item) => {
      acc.sent += item.sent;
      acc.opened += item.uniqueOpened || item.opened;
      acc.clicked += item.uniqueClicks || item.clicks;
      acc.replies += includeAutoReplies ? item.replies : item.uniqueReplies;
      acc.autoReplies += item.automaticReplies;
      acc.opportunities += item.opportunities;
      return acc;
    },
    { sent: 0, opened: 0, clicked: 0, replies: 0, autoReplies: 0, opportunities: 0 }
  );

  const clickRate =
    overview.clickRate !== null && overview.clickRate !== undefined
      ? formatPercent(overview.clickRate)
      : formatRate(totalClicked || dailyTotals.clicked, totalSent || dailyTotals.sent);

  const openRateText =
    configuration.sendingOptions.openTracking === false
      ? "Disabled"
      : overview.openRate !== null && overview.openRate !== undefined
        ? formatPercent(overview.openRate)
        : totalSent > 0
          ? formatRate(totalOpened || dailyTotals.opened, totalSent || dailyTotals.sent)
          : "Enabled";

  const replyRate = formatRate(visibleReplies || dailyTotals.replies, totalSent || dailyTotals.sent);

  const positiveReplyRate = formatRate(totalQualified, visibleReplies || totalReplies);

  const topActionIsPause = campaign?.status === "launched";
  const topActionLabel =
    campaign?.status === "paused"
      ? "Resume campaign"
      : campaign?.status === "launched"
        ? "Pause campaign"
        : "Launch campaign";

  const metricDefinitions: MetricDefinition[] = isSdrViewer
    ? [
      {
        key: "sequence_started",
        label: "Sequence started",
        value: overview.sequenceStartedAt ? formatDate(overview.sequenceStartedAt) : "-",
        icon: <CalendarDays className="h-4 w-4" />,
      },
      {
        key: "open_rate",
        label: "Open rate",
        value: openRateText,
        icon: <Mail className="h-4 w-4" />,
      },
      {
        key: "click_rate",
        label: "Click rate",
        value: clickRate,
        subValue: `${totalClicked || dailyTotals.clicked} clicks`,
        icon: <MousePointerClick className="h-4 w-4" />,
      },
    ]
    : [
      {
        key: "sequence_started",
        label: "Sequence started",
        value: overview.sequenceStartedAt ? formatDate(overview.sequenceStartedAt) : "-",
        icon: <CalendarDays className="h-4 w-4" />,
      },
      {
        key: "open_rate",
        label: "Open rate",
        value: openRateText,
        icon: <Mail className="h-4 w-4" />,
      },
      {
        key: "click_rate",
        label: "Click rate",
        value: clickRate,
        subValue: `${totalClicked || dailyTotals.clicked} clicks`,
        icon: <MousePointerClick className="h-4 w-4" />,
      },
      {
        key: "reply_rate",
        label: "Reply rate",
        value: replyRate,
        subValue: `${visibleReplies || dailyTotals.replies} replies`,
        icon: <Reply className="h-4 w-4" />,
      },
      {
        key: "positive_reply_rate",
        label: "Positive Reply Rate",
        value: positiveReplyRate,
        subValue: `${totalQualified} positive`,
        icon: <Sparkles className="h-4 w-4" />,
      },
      {
        key: "opportunities",
        label: "Opportunities",
        value: totalOpportunities,
        subValue: "$0",
        icon: <Target className="h-4 w-4" />,
      },
      {
        key: "conversions",
        label: "Conversions",
        value: totalQualified,
        subValue: "$0",
        icon: <CheckCircle2 className="h-4 w-4" />,
      },
    ];

  const visibleMetricCards = metricDefinitions.filter((metric) => visibleMetrics[metric.key]);
  const filteredMetricList = metricDefinitions.filter((metric) =>
    metric.label.toLowerCase().includes(metricSearch.trim().toLowerCase())
  );

  const performanceCards = isSdrViewer
    ? [
      { label: "Leads", value: totalLeads, icon: <Users className="h-4 w-4" /> },
      { label: "Sent", value: totalSent, icon: <Mail className="h-4 w-4" /> },
      { label: "Opened", value: totalOpened, icon: <Sparkles className="h-4 w-4" /> },
      { label: "Clicked", value: totalClicked, icon: <MousePointerClick className="h-4 w-4" /> },
    ]
    : [
      { label: "Leads", value: totalLeads, icon: <Users className="h-4 w-4" /> },
      { label: "Sent", value: totalSent, icon: <Mail className="h-4 w-4" /> },
      { label: "Opened", value: totalOpened, icon: <Sparkles className="h-4 w-4" /> },
      { label: "Replies", value: totalReplies, icon: <Reply className="h-4 w-4" /> },
      { label: "Qualified", value: totalQualified, icon: <Target className="h-4 w-4" /> },
    ];

  const stageStats = useMemo(() => {
    return contacts.reduce(
      (acc, item) => {
        const stage = (item.stage || "new").toLowerCase();
        if (stage.includes("reply")) acc.replied += 1;
        if (stage.includes("assigned_to_bme")) acc.assignedToBme += 1;
        if (stage.includes("assigned_to_ime")) acc.assignedToIme += 1;
        if (stage.includes("qualified")) acc.qualified += 1;
        return acc;
      },
      {
        replied: 0,
        assignedToBme: 0,
        assignedToIme: 0,
        qualified: 0,
      }
    );
  }, [contacts]);

  function updateVariantAt(
    stepIndex: number,
    variantIndex: number,
    patch: Partial<CampaignSequenceVariant>
  ) {
    setConfiguration((prev) => ({
      ...prev,
      sequences: prev.sequences.map((step, index) =>
        index === stepIndex
          ? {
            ...step,
            variants: step.variants.map((variant, innerIndex) =>
              innerIndex === variantIndex ? { ...variant, ...patch } : variant
            ),
          }
          : step
      ),
    }));
  }

  function updateSelectedVariant(patch: Partial<CampaignSequenceVariant>) {
    updateVariantAt(selectedSequenceStepIndex, selectedSequenceVariantIndex, patch);
  }

  function handleAddSequenceStepInstantlyStyle() {
    let nextStepIndex = 0;

    setConfiguration((prev): CampaignConfiguration => {
      nextStepIndex = prev.sequences.length;

      const nextStep: CampaignSequenceStep = {
        stepOrder: prev.sequences.length + 1,
        type: "email",
        delay: 1,
        delayUnit: "days",
        preDelay: 0,
        preDelayUnit: "days",
        variants: [{ subject: "", body: "" }],
      };

      return {
        ...prev,
        sequences: [...prev.sequences, nextStep],
      };
    });

    setSelectedSequenceStepIndex(nextStepIndex);
    setSelectedSequenceVariantIndex(0);
  }

  function handleRemoveSequenceStepInstantlyStyle(index: number) {
    if (configuration.sequences.length <= 1) return;

    setConfiguration((prev) => ({
      ...prev,
      sequences: prev.sequences
        .filter((_, stepIndex) => stepIndex !== index)
        .map((step, stepIndex) => ({
          ...step,
          stepOrder: stepIndex + 1,
        })),
    }));

    setSelectedSequenceStepIndex((current) => {
      if (current > index) return current - 1;
      if (current === index) return Math.max(0, index - 1);
      return current;
    });

    setSelectedSequenceVariantIndex(0);
  }

  function getVariantLabel(index: number) {
    return String.fromCharCode(65 + index);
  }

  function handleSelectSequenceStep(index: number) {
    setSelectedSequenceStepIndex(index);
    setSelectedSequenceVariantIndex(0);
  }

  function handleSelectVariant(stepIndex: number, variantIndex: number) {
    setSelectedSequenceStepIndex(stepIndex);
    setSelectedSequenceVariantIndex(variantIndex);
  }

  function handleAddVariant(stepIndex: number) {
    let nextVariantIndex = 0;

    setConfiguration((prev) => {
      const nextSequences = prev.sequences.map((step, index) => {
        if (index !== stepIndex) return step;

        nextVariantIndex = step.variants.length;

        return {
          ...step,
          variants: [
            ...step.variants,
            {
              subject: "",
              body: "",
            },
          ],
        };
      });

      return {
        ...prev,
        sequences: nextSequences,
      };
    });

    setSelectedSequenceStepIndex(stepIndex);
    setSelectedSequenceVariantIndex(nextVariantIndex);
  }

  function handleRemoveVariant(stepIndex: number, variantIndex: number) {
    setConfiguration((prev) => ({
      ...prev,
      sequences: prev.sequences.map((step, index) => {
        if (index !== stepIndex) return step;
        if (step.variants.length <= 1) return step;

        return {
          ...step,
          variants: step.variants.filter((_, innerIndex) => innerIndex !== variantIndex),
        };
      }),
    }));

    if (stepIndex === selectedSequenceStepIndex) {
      setSelectedSequenceVariantIndex((current) => {
        if (current > variantIndex) return current - 1;
        if (current === variantIndex) return Math.max(0, variantIndex - 1);
        return current;
      });
    }
  }

  function getStepDelayOwnerIndex(index: number) {
    const nextStepExists = index < configuration.sequences.length - 1;
    return nextStepExists ? index + 1 : null;
  }

  const nextSelectedStep =
    selectedSequenceStepIndex < configuration.sequences.length - 1
      ? configuration.sequences[selectedSequenceStepIndex + 1]
      : null;

  type SequenceVariableOption = {
    label: string;
    value: string;
  };

  function formatSequenceVariableLabel(variable: string) {
    const cleaned = variable.replace(/[{}]/g, "").trim();

    const spaced = cleaned
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return spaced
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  const csvOnlyTemplateVariables = useMemo(() => {
    const csvColumns = csvPreviewColumns.length
      ? csvPreviewColumns
      : campaign?.csvSchema?.columns || [];

    return buildCsvTemplateVariables(csvColumns);
  }, [csvPreviewColumns, campaign?.csvSchema?.columns]);

  const sequenceVariableOptions = useMemo<SequenceVariableOption[]>(() => {
    return csvOnlyTemplateVariables.map((variable) => ({
      label: formatSequenceVariableLabel(variable),
      value: variable,
    }));
  }, [csvOnlyTemplateVariables]);

  const sequencePreviewMappedVars = useMemo(() => {
    const allowedKeys = csvOnlyTemplateVariables
      .map((variable) => variable.replace(/[{}]/g, '').trim())
      .filter(Boolean);

    const source = sequencePreview?.previewVars || {};

    return allowedKeys.reduce<Record<string, string>>((acc, key) => {
      const exactValue = source[key];

      if (exactValue !== undefined && exactValue !== null) {
        acc[key] = String(exactValue);
        return acc;
      }

      const matchedKey = Object.keys(source).find(
        (candidate) => candidate.toLowerCase() === key.toLowerCase()
      );

      acc[key] = matchedKey ? String(source[matchedKey] ?? '') : '';
      return acc;
    }, {});
  }, [csvOnlyTemplateVariables, sequencePreview?.previewVars]);

  function handleInsertSequenceVariable(variable: string) {
    const target = sequenceInsertTarget || {
      stepIndex: selectedSequenceStepIndex,
      field: "body" as const,
    };

    if (target.field === "subject") {
      const input = subjectInputRef.current;
      const currentValue = selectedSequenceVariant.subject || "";

      if (!input) {
        updateSelectedVariant({
          subject: `${currentValue}${variable}`,
        });
      } else {
        const start = input.selectionStart ?? currentValue.length;
        const end = input.selectionEnd ?? start;

        const nextValue =
          currentValue.slice(0, start) +
          variable +
          currentValue.slice(end);

        updateSelectedVariant({ subject: nextValue });

        requestAnimationFrame(() => {
          input.focus();
          const nextCursor = start + variable.length;
          input.setSelectionRange(nextCursor, nextCursor);
        });
      }

      setIsVariablesMenuOpen(false);
      setMessage({
        type: "success",
        text: `${variable} inserted`,
      });
      return;
    }

    const editor = sequenceEditorRef.current;

    if (!editor) {
      updateSelectedVariant({
        body: `${selectedSequenceVariant.body || ""}${variable}`,
      });

      setIsVariablesMenuOpen(false);
      setMessage({
        type: "success",
        text: `${variable} inserted`,
      });
      return;
    }

    editor.focus();
    restoreEditorSelection();

    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      editor.innerHTML = `${editor.innerHTML || ""}${variable}`;
      syncEditorBodyToState();
      saveEditorSelection();

      setIsVariablesMenuOpen(false);
      setMessage({
        type: "success",
        text: `${variable} inserted`,
      });
      return;
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const textNode = document.createTextNode(variable);
    range.insertNode(textNode);

    const nextRange = document.createRange();
    nextRange.setStartAfter(textNode);
    nextRange.collapse(true);

    selection.removeAllRanges();
    selection.addRange(nextRange);
    savedSelectionRangeRef.current = nextRange.cloneRange();

    syncEditorBodyToState();
    setIsVariablesMenuOpen(false);

    setMessage({
      type: "success",
      text: `${variable} inserted`,
    });
  }

  const filteredTemplateGroups = useMemo(() => {
    const query = templateSearch.trim().toLowerCase();

    return mergedTemplateGroups.map((group) => {
      if (!query) return group;

      return {
        ...group,
        templates: group.templates.filter((template) => {
          const haystack = [
            template.title,
            template.subject,
            template.body,
            group.title,
          ]
            .join(" ")
            .toLowerCase();

          return haystack.includes(query);
        }),
      };
    });
  }, [templateSearch, mergedTemplateGroups]);

  function syncEditorBodyToState() {
    const html = sequenceEditorRef.current?.innerHTML || "";
    updateSelectedVariant({ body: html });
  }

  function saveEditorSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    savedSelectionRangeRef.current = selection.getRangeAt(0).cloneRange();
  }

  function restoreEditorSelection() {
    const selection = window.getSelection();
    if (!selection || !savedSelectionRangeRef.current) return;

    selection.removeAllRanges();
    selection.addRange(savedSelectionRangeRef.current);
  }

  function resetLinkEditor() {
    setIsLinkEditorOpen(false);
    setLinkEditorMode("insert");
    setLinkEditorUrl("");
    setLinkEditorText("");
  }

  function updateLinkToolsFromSelection() {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      closeLinkTools();
      return;
    }

    const node =
      selection.anchorNode instanceof Element
        ? selection.anchorNode
        : selection.anchorNode?.parentElement || null;

    const linkElement = node?.closest?.("a") as HTMLAnchorElement | null;

    if (!linkElement || !sequenceEditorRef.current?.contains(linkElement)) {
      closeLinkTools();
      return;
    }

    const rect = linkElement.getBoundingClientRect();

    selectedLinkElementRef.current = linkElement;
    setLinkEditorText(linkElement.textContent || "");
    setLinkEditorUrl(linkElement.getAttribute("href") || "");
    setLinkToolsPosition({
      top: rect.top - 58,
      left: rect.left + rect.width / 2,
    });
    setIsLinkToolsOpen(true);
  }

  function handleEditorInput() {
    syncEditorBodyToState();
    saveEditorSelection();
    updateLinkToolsFromSelection();
  }

  function handleEditorSelectionChange() {
    saveEditorSelection();
    updateLinkToolsFromSelection();
  }

  function hydrateSequenceEditorFromState() {
    const editor = sequenceEditorRef.current;
    if (!editor) return;

    const nextHtml = bodyToEditorHtml(selectedSequenceVariant.body || "");

    if (document.activeElement === editor) return;

    if (editor.innerHTML !== nextHtml) {
      editor.innerHTML = nextHtml;
    }

    savedSelectionRangeRef.current = null;
  }

  function handleOpenInsertLinkEditor() {
    const selection = window.getSelection();
    const selectedText = selection?.toString() || "";

    setLinkEditorMode("insert");
    setLinkEditorText(selectedText.trim());
    setLinkEditorUrl("");
    setIsLinkEditorOpen(true);
    setIsLinkToolsOpen(false);
  }

  function handleOpenEditLinkEditor() {
    const currentLink = selectedLinkElementRef.current;

    if (!currentLink) {
      setMessage({
        type: "info",
        text: "No selected link found",
      });
      return;
    }

    setLinkEditorMode("edit");
    setLinkEditorText(currentLink.textContent || "");
    setLinkEditorUrl(currentLink.getAttribute("href") || "");
    setIsLinkEditorOpen(true);
    setIsLinkToolsOpen(false);
  }

  function handleOpenLinkInNewTab() {
    const currentLink = selectedLinkElementRef.current;
    const url = currentLink?.getAttribute("href");

    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleRemoveSelectedLink() {
    const currentLink = selectedLinkElementRef.current;
    if (!currentLink) return;

    const textNode = document.createTextNode(currentLink.textContent || "");
    currentLink.replaceWith(textNode);

    syncEditorBodyToState();
    closeLinkTools();

    setMessage({
      type: "success",
      text: "Link removed",
    });
  }

  function handleSubmitLinkEditor() {
    const normalizedUrl = normalizeInsertLinkUrl(linkEditorUrl);

    if (!normalizedUrl) {
      setMessage({
        type: "error",
        text: "Web address is required",
      });
      return;
    }

    const finalText = linkEditorText.trim() || normalizedUrl;

    if (linkEditorMode === "edit" && selectedLinkElementRef.current) {
      selectedLinkElementRef.current.setAttribute("href", normalizedUrl);
      selectedLinkElementRef.current.setAttribute("target", "_blank");
      selectedLinkElementRef.current.setAttribute("rel", "noopener noreferrer");
      selectedLinkElementRef.current.textContent = finalText;

      syncEditorBodyToState();
      resetLinkEditor();

      setMessage({
        type: "success",
        text: "Link updated",
      });
      return;
    }

    restoreEditorSelection();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      const currentHtml = sequenceEditorRef.current?.innerHTML || "";
      const appended = `${currentHtml}${currentHtml ? "<br>" : ""}<a href="${normalizedUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(
        finalText
      )}</a>`;

      if (sequenceEditorRef.current) {
        sequenceEditorRef.current.innerHTML = appended;
      }

      syncEditorBodyToState();
      resetLinkEditor();

      setMessage({
        type: "success",
        text: "Link inserted",
      });
      return;
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const anchor = document.createElement("a");
    anchor.href = normalizedUrl;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.textContent = finalText;

    range.insertNode(anchor);

    const nextRange = document.createRange();
    nextRange.setStartAfter(anchor);
    nextRange.collapse(true);

    selection.removeAllRanges();
    selection.addRange(nextRange);
    savedSelectionRangeRef.current = nextRange.cloneRange();

    syncEditorBodyToState();
    resetLinkEditor();

    setMessage({
      type: "success",
      text: "Link inserted",
    });
  }

  useLayoutEffect(() => {
    if (activeTab !== "sequences") return;

    hydrateSequenceEditorFromState();

    const frame = window.requestAnimationFrame(() => {
      hydrateSequenceEditorFromState();
    });

    const timer = window.setTimeout(() => {
      hydrateSequenceEditorFromState();
    }, 80);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [
    activeTab,
    loading,
    campaign?._id,
    selectedSequenceStepIndex,
    selectedSequenceVariantIndex,
    selectedSequenceVariant.subject,
    selectedSequenceVariant.body,
    configuration.sequences.length,
  ]);

  const flatFilteredTemplates = useMemo(() => {
    return filteredTemplateGroups.flatMap((group) => group.templates);
  }, [filteredTemplateGroups]);

  const selectedTemplate =
    flatFilteredTemplates.find((template) => template.id === selectedTemplateId) ||
    mergedTemplateGroups.flatMap((group) => group.templates).find((template) => template.id === selectedTemplateId) ||
    null;

  useEffect(() => {
    if (!selectedTemplate && flatFilteredTemplates.length) {
      setSelectedTemplateId(flatFilteredTemplates[0].id);
    }
  }, [selectedTemplate, flatFilteredTemplates]);

  function toggleTemplateGroup(category: string) {
    setExpandedTemplateGroups((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }

  function handleUseTemplate() {
    if (!selectedTemplate) return;

    setConfiguration((prev) => ({
      ...prev,
      sequences: prev.sequences.map((step, index) => {
        if (index !== selectedSequenceStepIndex) return step;

        return {
          ...step,
          variants: step.variants.map((variant, variantIndex) => {
            if (variantIndex !== selectedSequenceVariantIndex) return variant;

            return {
              ...variant,
              subject: selectedTemplate.subject || variant.subject || "",
              body: selectedTemplate.body || variant.body || "",
            };
          }),
        };
      }),
    }));

    setIsTemplatesModalOpen(false);
    setMessage({
      type: "success",
      text: `Template "${selectedTemplate.title}" applied`,
    });
  }

  async function handleCopyTemplate() {
    if (!selectedTemplate) return;

    const copyText = `Subject: ${selectedTemplate.subject}\n\n${selectedTemplate.body}`;
    await navigator.clipboard.writeText(copyText);

    setMessage({
      type: "success",
      text: `Template "${selectedTemplate.title}" copied`,
    });
  }

  function normalizeInsertLinkUrl(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return "";

    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      {message && (
        <div
          className={cx(
            "fixed right-5 top-5 z-50 rounded-2xl px-4 py-3 text-sm font-medium shadow-lg",
            message.type === "success" && "bg-emerald-600 text-white",
            message.type === "error" && "bg-red-600 text-white",
            message.type === "info" && "bg-slate-900 text-white"
          )}
        >
          {message.text}
        </div>
      )}

      <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="px-6 pb-4 pt-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={cx(
                    "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                    getStatusPillClasses(campaign?.status)
                  )}
                >
                  {campaign?.status ? campaign.status.toUpperCase() : "DRAFT"}
                </span>

                <span
                  className={cx(
                    "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                    getFlowClasses(flowType)
                  )}
                >
                  {getFlowLabel(flowType)}
                </span>

                {campaign?.sync?.lastErrorMessage ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Sync issue
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <Check className="h-3.5 w-3.5" />
                    Healthy
                  </span>
                )}
              </div>

              <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900">
                {campaign?.name || "Campaign"}
              </h1>

              <div className="mt-2 flex flex-wrap items-end gap-4 text-sm text-slate-500">
                <span>Last analytics sync: {formatDateTime(campaign?.sync?.lastAnalyticsSyncedAt)}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Tooltip label={topActionIsPause ? "Pause sending for this campaign" : "Launch or resume this campaign"}>
                <button
                  type="button"
                  onClick={topActionIsPause ? handlePause : handleLaunch}
                  disabled={submittingKey !== "" || !canManageCampaign || !selectedAccountEmails.length}
                  className={cx(
                    "inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
                    topActionIsPause
                      ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                      : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                  )}
                >
                  {topActionIsPause ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4 text-emerald-500" />
                  )}
                  {submittingKey === "launch" || submittingKey === "pause"
                    ? "Please wait..."
                    : topActionLabel}
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8 overflow-x-auto px-6">
          {pageTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                if (activeTab === "sequences") {
                  syncEditorBodyToState();
                }

                setActiveTab(tab.key);

                if (tab.key === "sequences") {
                  window.setTimeout(() => {
                    hydrateSequenceEditorFromState();
                  }, 0);
                }
              }}
              className={cx(
                "whitespace-nowrap border-b-2 pb-4 pt-1 text-[15px] font-medium transition",
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1800px] px-6 py-8">
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <ShellCard className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                    <span className="text-sm text-slate-500">Status:</span>
                    <span
                      className={cx(
                        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                        getStatusPillClasses(campaign?.status)
                      )}
                    >
                      {campaign?.status ? campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1) : "Draft"}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-slate-900">{progressPercent}%</span>
                      <div className="h-1.5 w-[90px] overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Tooltip label="Check campaign sync and health">
                    <button
                      type="button"
                      onClick={() =>
                        setMessage({
                          type: campaign?.sync?.lastErrorMessage ? "error" : "info",
                          text:
                            campaign?.sync?.lastErrorMessage ||
                            "Campaign looks healthy.",
                        })
                      }
                      className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <Wrench className="h-4 w-4" />
                      Diagnose
                    </button>
                  </Tooltip>

                  {/* <Tooltip label="Copy campaign share link">
                    <button
                      type="button"
                      onClick={handleShare}
                      disabled={submittingKey === "share" || !canManageCampaign}
                      className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Share2 className="h-4 w-4" />
                      {submittingKey === "share" ? "Sharing..." : "Share"}
                    </button>
                  </Tooltip> */}

                  <div className="relative">
                    <select
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value as RangeKey)}
                      className="h-11 appearance-none rounded-2xl border border-slate-200 bg-white pl-4 pr-10 text-sm font-medium text-slate-700 outline-none"
                    >
                      {rangeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>

                  <div ref={metricMenuRef} className="relative">
                    <Tooltip label="Choose visible analytics cards">
                      <button
                        type="button"
                        onClick={() => setMetricMenuOpen((prev) => !prev)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    </Tooltip>

                    {metricMenuOpen && (
                      <div className="absolute right-0 top-[52px] z-20 w-[320px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                        <div className="border-b border-slate-100 p-3">
                          <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              value={metricSearch}
                              onChange={(e) => setMetricSearch(e.target.value)}
                              placeholder="Search..."
                              className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-400"
                            />
                          </div>
                        </div>

                        <div className="max-h-[360px] overflow-auto py-1">
                          {!isSdrViewer && (
                            <label className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50">
                              <div className="flex items-center gap-2">
                                <span>Include auto replies</span>
                                <CircleAlert className="h-3.5 w-3.5 text-slate-300" />
                              </div>
                              <button
                                type="button"
                                onClick={() => setIncludeAutoReplies((prev) => !prev)}
                                className={cx(
                                  "flex h-6 w-6 items-center justify-center rounded-full text-white",
                                  includeAutoReplies ? "bg-emerald-500" : "bg-slate-300"
                                )}
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            </label>
                          )}

                          {filteredMetricList.map((metric) => (
                            <label
                              key={metric.key}
                              className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <span>{metric.label}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setVisibleMetrics((prev) => ({
                                    ...prev,
                                    [metric.key]: !prev[metric.key],
                                  }))
                                }
                                className={cx(
                                  "flex h-6 w-6 items-center justify-center rounded-full text-white",
                                  visibleMetrics[metric.key] ? "bg-emerald-500" : "bg-slate-300"
                                )}
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ShellCard>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
              {visibleMetricCards.map((metric) => (
                <KpiCard
                  key={metric.key}
                  label={metric.label}
                  value={metric.value}
                  subValue={metric.subValue}
                  icon={metric.icon}
                />
              ))}
            </div>

            <ShellCard className="overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Performance snapshot</h3>
                    <p className="text-sm text-slate-500">
                      Quick campaign health summary for the selected time range
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-0 xl:grid-cols-5">
                {performanceCards.map((item, index) => (
                  <div
                    key={item.label}
                    className={cx(
                      "flex items-center gap-4 px-6 py-6",
                      index !== performanceCards.length - 1 && "border-b border-slate-100 xl:border-b-0 xl:border-r"
                    )}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-600">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">{item.label}</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ShellCard>

            <ShellCard className="overflow-hidden">
              <div className="border-b border-slate-100 px-6 pt-5">
                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={() => setAnalyticsSubTab("step_analytics")}
                    className={cx(
                      "border-b-2 pb-4 text-base font-semibold",
                      analyticsSubTab === "step_analytics"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500"
                    )}
                  >
                    Step Analytics
                  </button>

                  {!isSdrViewer && (
                    <button
                      type="button"
                      onClick={() => setAnalyticsSubTab("activity")}
                      className={cx(
                        "border-b-2 pb-4 text-base font-semibold",
                        analyticsSubTab === "activity"
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-slate-500"
                      )}
                    >
                      Activity
                    </button>
                  )}
                </div>
              </div>

              {analyticsSubTab === "step_analytics" || isSdrViewer ? (
                stepAnalytics.length ? (
                  <div className="px-6 py-6">
                    {canViewReplyAnalytics ? (
                      <>
                        <div className="grid grid-cols-[1.8fr_repeat(7,minmax(0,1fr))] gap-4 border-b border-slate-100 pb-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                          <div>Step</div>
                          <div>Sent</div>
                          <div>Opened</div>
                          <div>Open Rate</div>
                          <div>Replied</div>
                          <div>Clicked</div>
                          <div>Click Rate</div>
                          <div>Opportunities</div>
                        </div>

                        {stepAnalytics.map((step) => (
                          <div
                            key={`${step.stepOrder}-${step.label}`}
                            className="grid grid-cols-[1.8fr_repeat(7,minmax(0,1fr))] gap-4 border-b border-slate-100 py-5 text-sm text-slate-700 last:border-b-0"
                          >
                            <div>
                              <p className="font-medium text-slate-900">{step.label}</p>
                              <p className="mt-1 text-xs text-slate-400">{step.subject || step.type}</p>
                            </div>
                            <div>{step.sent}</div>
                            <div>{step.opened ?? "-"}</div>
                            <div>{formatRate(Number(step.opened || 0), Number(step.sent || 0))}</div>
                            <div>{step.replied}</div>
                            <div>{step.clicked}</div>
                            <div>{formatRate(Number(step.clicked || 0), Number(step.sent || 0))}</div>
                            <div>{step.opportunities}</div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-[1.8fr_repeat(4,minmax(0,1fr))] gap-4 border-b border-slate-100 pb-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                          <div>Step</div>
                          <div>Sent</div>
                          <div>Opened</div>
                          <div>Clicked</div>
                          <div>Click Rate</div>
                        </div>

                        {stepAnalytics.map((step) => (
                          <div
                            key={`${step.stepOrder}-${step.label}`}
                            className="grid grid-cols-[1.8fr_repeat(4,minmax(0,1fr))] gap-4 border-b border-slate-100 py-5 text-sm text-slate-700 last:border-b-0"
                          >
                            <div>
                              <p className="font-medium text-slate-900">{step.label}</p>
                              <p className="mt-1 text-xs text-slate-400">{step.subject || step.type}</p>
                            </div>
                            <div>{step.sent}</div>
                            <div>{step.opened ?? "-"}</div>
                            <div>{step.clicked}</div>
                            <div>{formatRate(Number(step.clicked || 0), Number(step.sent || 0))}</div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="px-6 py-16">
                    <p className="text-center text-2xl font-semibold text-slate-300">
                      No data to show for specified time
                    </p>
                  </div>
                )
              ) : dailyAnalytics.length ? (
                <div className="px-6 py-6">
                  <div className="mb-5 grid gap-4 md:grid-cols-4">
                    {[
                      { label: "Daily Sent", value: dailyTotals.sent },
                      { label: "Daily Opens", value: dailyTotals.opened },
                      { label: "Daily Clicks", value: dailyTotals.clicked },
                      { label: "Daily Click Rate", value: formatRate(dailyTotals.clicked, dailyTotals.sent) },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="overflow-x-auto">
                    <div className="min-w-[920px]">
                      <div className="grid grid-cols-[1.2fr_repeat(8,minmax(0,1fr))] gap-4 border-b border-slate-100 pb-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        <div>Date</div>
                        <div>Sent</div>
                        <div>Opened</div>
                        <div>Open Rate</div>
                        <div>Clicked</div>
                        <div>Click Rate</div>
                        <div>Replies</div>
                        <div>Reply Rate</div>
                        <div>Opp.</div>
                      </div>

                      {dailyAnalytics.map((row) => (
                        <div
                          key={row.date}
                          className="grid grid-cols-[1.2fr_repeat(8,minmax(0,1fr))] gap-4 border-b border-slate-100 py-5 text-sm text-slate-700 last:border-b-0"
                        >
                          <div className="font-medium text-slate-900">{formatDate(row.date)}</div>
                          <div>{row.sent}</div>
                          <div>{row.uniqueOpened || row.opened}</div>
                          <div>{formatRate(row.uniqueOpened || row.opened, row.sent)}</div>
                          <div>{row.uniqueClicks || row.clicks}</div>
                          <div>{formatRate(row.uniqueClicks || row.clicks, row.sent)}</div>
                          <div>{includeAutoReplies ? row.replies : row.uniqueReplies}</div>
                          <div>{formatRate(includeAutoReplies ? row.replies : row.uniqueReplies, row.sent)}</div>
                          <div>{row.opportunities}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-6 py-16">
                  <p className="text-center text-2xl font-semibold text-slate-300">No activity to show</p>
                </div>
              )}
            </ShellCard>
          </div>
        )}

        {activeTab === "leads" && (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <div className="border-b border-slate-100 bg-white px-6 py-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <Users className="h-6 w-6" />
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                        Leads
                      </h2>
                      <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                        Manage campaign prospects, review stages, and add leads using CSV,
                        manual entry, or Google Sheets.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative w-full sm:w-[340px]">
                      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={leadSearch}
                        onChange={(e) => setLeadSearch(e.target.value)}
                        placeholder="Search by lead, contact, email, or stage..."
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={openLeadImportModal}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Leads
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 border-b border-slate-100 bg-slate-50/50 px-6 py-5 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: "Total Leads",
                    value: totalLeads,
                    helper: `${filteredContacts.length} visible`,
                    icon: <Users className="h-4 w-4" />,
                    className: "bg-blue-50 text-blue-600",
                  },
                  {
                    label: isSdrViewer ? "New Leads" : "Replies",
                    value: isSdrViewer
                      ? contacts.filter((item) => (item.stage || "").toLowerCase() === "new").length
                      : stageStats.replied,
                    helper: isSdrViewer ? "Ready to queue" : "Pending review",
                    icon: isSdrViewer ? <Plus className="h-4 w-4" /> : <Reply className="h-4 w-4" />,
                    className: "bg-emerald-50 text-emerald-600",
                  },
                  {
                    label: isSdrViewer ? "Queued" : "Assigned to BME",
                    value: isSdrViewer
                      ? contacts.filter((item) => (item.stage || "").toLowerCase() === "queued").length
                      : stageStats.assignedToBme,
                    helper: isSdrViewer ? "Waiting for sequence" : "Brand execution",
                    icon: isSdrViewer ? <CalendarDays className="h-4 w-4" /> : <Target className="h-4 w-4" />,
                    className: "bg-amber-50 text-amber-600",
                  },
                  {
                    label: isSdrViewer ? "In Sequence" : "Assigned to IME",
                    value: isSdrViewer
                      ? contacts.filter((item) => (item.stage || "").toLowerCase() === "in_sequence").length
                      : stageStats.assignedToIme,
                    helper: isSdrViewer ? "Currently active" : "Influencer execution",
                    icon: isSdrViewer ? <Mail className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />,
                    className: "bg-violet-50 text-violet-600",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.03)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                          {item.label}
                        </p>
                        <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                          {item.value}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{item.helper}</p>
                      </div>

                      <div
                        className={cx(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                          item.className
                        )}
                      >
                        {item.icon}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 py-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">
                      Campaign Lead List
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Showing {filteredContacts.length} of {contacts.length} total leads.
                    </p>
                  </div>

                  {leadSearch.trim() ? (
                    <button
                      type="button"
                      onClick={() => setLeadSearch("")}
                      className="inline-flex w-fit items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                    >
                      Clear search
                    </button>
                  ) : null}
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                  <AdminTable
                    data={filteredContacts}
                    columns={contactColumns}
                    rowKey={(row) => row._id}
                    loading={loading}
                    emptyTitle={loading ? "Loading leads..." : "No leads added"}
                    emptyDescription="Click Add Leads to upload CSV, enter emails manually, or import from Google Sheets."
                  />
                </div>
              </div>
            </div>

            {isLeadImportModalOpen && (
              <div className="fixed inset-0 z-[100] bg-white">
                <div className="flex h-full min-h-screen flex-col bg-[#f8fafc]">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 shadow-sm">

                    <div className="text-center item center flex-1">
                      <p className="text-sm font-bold text-slate-950">
                        {leadImportMode === "csv" && "Upload CSV"}
                        {leadImportMode === "manual" && "Enter Emails Manually"}
                        {leadImportMode === "sheet" && "Import from Google Sheets"}
                        {!leadImportMode && "Add Leads"}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {contacts.length} leads currently in this campaign
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={closeLeadImportModal}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {!leadImportMode && (
                    <div className="flex flex-1 items-start justify-center overflow-auto px-5 py-12 md:py-16">
                      <div className="w-full max-w-[720px]">
                        <div className="mb-8 text-center">
                          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
                            <Users className="h-7 w-7" />
                          </div>

                          <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                            Add leads to this campaign
                          </h2>
                          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
                            Choose how you want to add leads. Upload a mapped CSV,
                            add one lead manually, or import from Google Sheets.
                          </p>
                        </div>

                        <div className="mb-7 flex justify-center">
                          <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                            <CircleAlert className="h-4 w-4" />
                            {contacts.length} leads uploaded
                          </div>
                        </div>

                        <div className="space-y-4">
                          <button
                            type="button"
                            onClick={() => openLeadImportMode("csv")}
                            className="group flex w-full items-center gap-5 rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_45px_rgba(15,23,42,0.10)]"
                          >
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                              <Upload className="h-7 w-7" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                                Upload
                              </p>
                              <h3 className="mt-1 text-2xl font-bold text-slate-950">
                                CSV
                              </h3>
                              <p className="mt-1 text-sm text-slate-500">
                                Upload a CSV, preview columns, map variables, then import.
                              </p>
                            </div>

                            <ChevronDown className="-rotate-90 h-5 w-5 text-slate-300 transition group-hover:text-blue-500" />
                          </button>

                          <button
                            type="button"
                            onClick={() => openLeadImportMode("manual")}
                            className="group flex w-full items-center gap-5 rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_45px_rgba(15,23,42,0.10)]"
                          >
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                              <Mail className="h-7 w-7" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                                Enter
                              </p>
                              <h3 className="mt-1 text-2xl font-bold text-slate-950">
                                Emails Manually
                              </h3>
                              <p className="mt-1 text-sm text-slate-500">
                                Add a single lead with brand, contact name, and email.
                              </p>
                            </div>

                            <ChevronDown className="-rotate-90 h-5 w-5 text-slate-300 transition group-hover:text-blue-500" />
                          </button>

                          <button
                            type="button"
                            onClick={() => openLeadImportMode("sheet")}
                            className="group flex w-full items-center gap-5 rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_45px_rgba(15,23,42,0.10)]"
                          >
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                              <CheckCircle2 className="h-7 w-7" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                                Use
                              </p>
                              <h3 className="mt-1 text-2xl font-bold text-slate-950">
                                Google Sheets
                              </h3>
                              <p className="mt-1 text-sm text-slate-500">
                                Paste a public Google Sheet URL and import leads directly.
                              </p>
                            </div>

                            <ChevronDown className="-rotate-90 h-5 w-5 text-slate-300 transition group-hover:text-blue-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {leadImportMode === "csv" && (
                    <CsvImportPanel
                      csvFile={csvFile}
                      csvPreviewColumns={csvPreviewColumns}
                      csvPreviewFileName={csvPreviewFileName}
                      csvPreviewRows={csvPreviewRows}
                      csvPreviewTotalRows={csvPreviewTotalRows}
                      submittingKey={submittingKey}
                      onPreviewCsv={handlePreviewCsv}
                      onUpdateColumn={updateCsvPreviewColumn}
                      onConfirmImport={handleConfirmCsvImport}
                    />
                  )}
                  {leadImportMode === "manual" && (
                    <div className="flex flex-1 items-start justify-center overflow-auto px-5 py-12">
                      <div className="w-full max-w-2xl">
                        <div className="mb-6 text-center">
                          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
                            <Mail className="h-7 w-7" />
                          </div>

                          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                            Enter Emails Manually
                          </h2>
                          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                            Add a single lead by entering the brand or influencer name,
                            contact name, and contact email.
                          </p>
                        </div>

                        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                          <div className="space-y-4">
                            <div>
                              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                Brand / Influencer Name
                              </label>
                              <input
                                value={manualForm.entityName}
                                onChange={(e) =>
                                  setManualForm((prev) => ({ ...prev, entityName: e.target.value }))
                                }
                                placeholder="Enter brand or influencer name"
                                className={inputClassName}
                              />
                            </div>

                            <div>
                              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                Contact Name
                              </label>
                              <input
                                value={manualForm.contactName}
                                onChange={(e) =>
                                  setManualForm((prev) => ({ ...prev, contactName: e.target.value }))
                                }
                                placeholder="Enter contact name"
                                className={inputClassName}
                              />
                            </div>

                            <div>
                              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                Contact Email
                              </label>
                              <input
                                value={manualForm.contactEmail}
                                onChange={(e) =>
                                  setManualForm((prev) => ({ ...prev, contactEmail: e.target.value }))
                                }
                                placeholder="name@example.com"
                                className={inputClassName}
                              />
                            </div>

                            <button
                              type="button"
                              onClick={handleManualAdd}
                              disabled={submittingKey !== ""}
                              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Plus className="h-4 w-4" />
                              {submittingKey === "manual" ? "Adding..." : "Add Lead"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {leadImportMode === "sheet" && (
                    <div className="flex flex-1 items-start justify-center overflow-auto px-5 py-12">
                      <div className="w-full max-w-3xl">
                        <div className="mb-6 text-center">
                          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-amber-50 text-amber-600">
                            <CheckCircle2 className="h-7 w-7" />
                          </div>

                          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                            Import from Google Sheets
                          </h2>
                          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                            Paste a public Google Sheet URL. Make sure the sheet is accessible
                            and contains the required lead columns.
                          </p>
                        </div>

                        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                          <div className="space-y-4">
                            <div>
                              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                Google Sheet URL
                              </label>
                              <textarea
                                value={sheetUrl}
                                onChange={(e) => setSheetUrl(e.target.value)}
                                placeholder="https://docs.google.com/spreadsheets/d/..."
                                rows={6}
                                className={cx(inputClassName, "resize-y")}
                              />
                            </div>

                            <button
                              type="button"
                              onClick={handleGoogleSheetImport}
                              disabled={submittingKey !== ""}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              {submittingKey === "sheet" ? "Importing..." : "Import Sheet"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "sequences" && (
          <div className="grid gap-0 overflow-visible rounded-[24px] border border-slate-200 bg-white shadow-sm xl:grid-cols-[288px_minmax(0,1fr)]">
            <div className="border-r border-slate-200 bg-[#fbfbfd]">
              <div className="p-5">
                <div className="space-y-4">
                  {configuration.sequences.map((step, index) => {
                    const isSelected = selectedSequenceStepIndex === index;
                    const nextStepIndex = getStepDelayOwnerIndex(index);
                    const nextStep =
                      nextStepIndex !== null ? configuration.sequences[nextStepIndex] : null;

                    return (
                      <div
                        key={`${step.stepOrder}-${index}`}
                        className={cx(
                          "overflow-hidden rounded-2xl border bg-white transition",
                          isSelected
                            ? "border-blue-500 ring-1 ring-blue-500"
                            : "border-slate-200"
                        )}
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-5">
                          <button
                            type="button"
                            onClick={() => handleSelectSequenceStep(index)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <p className="text-[15px] font-semibold text-slate-900">
                              Step {index + 1}
                            </p>
                          </button>

                          {configuration.sequences.length > 1 ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleRemoveSequenceStepInstantlyStyle(index);
                              }}
                              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-rose-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : (
                            <span className="h-6 w-6" />
                          )}
                        </div>

                        <div className="px-4 py-4">
                          <div className="space-y-2.5">
                            {step.variants.map((variant, variantIndex) => {
                              const isVariantSelected =
                                selectedSequenceStepIndex === index &&
                                selectedSequenceVariantIndex === variantIndex;

                              return (
                                <div
                                  key={`${index}-${variantIndex}`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleSelectVariant(index, variantIndex);
                                  }}
                                  className={cx(
                                    "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition",
                                    isVariantSelected
                                      ? "border-blue-200 bg-blue-50"
                                      : "border-slate-200 bg-white hover:border-slate-300"
                                  )}
                                >
                                  <div
                                    className={cx(
                                      "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
                                      isVariantSelected
                                        ? "bg-blue-600 text-white"
                                        : "bg-slate-200 text-slate-600"
                                    )}
                                  >
                                    {getVariantLabel(variantIndex)}
                                  </div>

                                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
                                    {variant.subject?.trim()
                                      ? variant.subject
                                      : index === 0
                                        ? "<Empty subject>"
                                        : "<Previous email's subject>"}
                                  </p>

                                  {step.variants.length > 1 ? (
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleRemoveVariant(index, variantIndex);
                                      }}
                                      className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-rose-500"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleAddVariant(index);
                            }}
                            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-blue-600"
                          >
                            <Plus className="h-4 w-4 text-blue-600" />
                            Add variant
                          </button>
                        </div>

                        {nextStep ? (
                          <div className="border-t border-slate-100 px-4 py-5">
                            <p className="mb-3 text-sm font-medium text-slate-700">
                              Send next message in
                            </p>

                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={0}
                                value={nextStep.delay}
                                onChange={(e) =>
                                  updateStep(nextStepIndex!, {
                                    delay: Number(e.target.value || 0),
                                  })
                                }
                                className="h-8 w-[52px] rounded-lg border border-slate-200 px-2 text-sm text-slate-700 outline-none"
                              />

                              <select
                                value={nextStep.delayUnit}
                                onChange={(e) =>
                                  updateStep(nextStepIndex!, {
                                    delayUnit: e.target.value as CampaignSequenceStep["delayUnit"],
                                  })
                                }
                                className="h-8 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 outline-none"
                              >
                                <option value="minutes">Minutes</option>
                                <option value="hours">Hours</option>
                                <option value="days">Days</option>
                              </select>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={handleAddSequenceStepInstantlyStyle}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <Plus className="h-4 w-4 text-blue-600" />
                    Add step
                  </button>
                </div>
              </div>
            </div>

            <div className="flex min-h-[760px] flex-col bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="text-[15px] font-semibold text-slate-900">Subject</p>
                    <div className="text-xs text-slate-400">
                      {nextSelectedStep
                        ? `Next step sends in ${nextSelectedStep.delay} ${nextSelectedStep.delayUnit}`
                        : ""}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenSequencePreview()}
                    disabled={!contacts.length || submittingKey === "sequence-preview"}
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Eye className="h-4 w-4" />
                    {submittingKey === "sequence-preview" ? "Loading..." : "Preview"}
                  </button>
                </div>
              </div>

              <div className="border-b border-slate-200 px-6 py-4">
                <input
                  ref={subjectInputRef}
                  value={selectedSequenceVariant.subject || ""}
                  onFocus={() =>
                    setSequenceInsertTarget({
                      stepIndex: selectedSequenceStepIndex,
                      field: "subject",
                    })
                  }
                  onClick={() =>
                    setSequenceInsertTarget({
                      stepIndex: selectedSequenceStepIndex,
                      field: "subject",
                    })
                  }
                  onKeyUp={() =>
                    setSequenceInsertTarget({
                      stepIndex: selectedSequenceStepIndex,
                      field: "subject",
                    })
                  }
                  onChange={(e) => updateSelectedVariant({ subject: e.target.value })}
                  placeholder="Start typing here..."
                  className="w-full border-0 bg-transparent px-0 py-0 text-[15px] text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0"
                />
              </div>

              <div className="relative flex-1 px-6 py-5">
                {!selectedSequenceVariant.body?.trim() && (
                  <div className="pointer-events-none absolute left-6 top-5 z-0 text-[15px] leading-7 text-slate-400">
                    Start typing here...
                  </div>
                )}

                <div
                  ref={sequenceEditorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onFocus={() =>
                    setSequenceInsertTarget({
                      stepIndex: selectedSequenceStepIndex,
                      field: "body",
                    })
                  }
                  onInput={handleEditorInput}
                  onClick={handleEditorSelectionChange}
                  onKeyUp={handleEditorSelectionChange}
                  onMouseUp={handleEditorSelectionChange}
                  className="relative z-[1] min-h-[520px] w-full px-0 py-0 text-[15px] leading-7 text-slate-800 outline-none transition focus:border-slate-200 focus:bg-slate-50/30 focus:ring-0 [&_a]:font-medium [&_a]:text-blue-600 [&_a]:underline"
                  style={{ whiteSpace: "pre-wrap" }}
                />

                {isLinkToolsOpen && linkToolsPosition && (
                  <div
                    ref={linkToolsRef}
                    className="fixed z-[75] -translate-x-1/2"
                    style={{
                      top: `${linkToolsPosition.top}px`,
                      left: `${linkToolsPosition.left}px`,
                    }}
                  >
                    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-[0_16px_40px_rgba(15,23,42,0.14)]">
                      <div className="flex items-center gap-1.5">
                        <IconButton label="Open link" onClick={handleOpenLinkInNewTab}>
                          <ExternalLink className="h-4 w-4" />
                        </IconButton>

                        <IconButton label="Insert link" onClick={handleOpenInsertLinkEditor} active>
                          <Link2 className="h-4 w-4" />
                        </IconButton>

                        <IconButton label="Edit link" onClick={handleOpenEditLinkEditor}>
                          <Pencil className="h-4 w-4" />
                        </IconButton>

                        <IconButton label="Remove link" onClick={handleRemoveSelectedLink}>
                          <Unlink className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative border-t border-slate-200 px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div ref={saveMenuRef} className="relative inline-flex items-stretch">
                      <div className="inline-flex h-11 overflow-hidden rounded-xl border border-blue-600 shadow-sm">
                        <button
                          type="button"
                          onClick={() => handleSaveConfiguration(true)}
                          disabled={submittingKey !== ""}
                          className="inline-flex items-center gap-2 bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {submittingKey === "save-config" ? "Saving..." : "Save"}
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsSaveMenuOpen((prev) => !prev)}
                          disabled={submittingKey !== ""}
                          className="inline-flex w-11 items-center justify-center border-l border-blue-500 bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-haspopup="menu"
                          aria-expanded={isSaveMenuOpen}
                        >
                          <ChevronDown
                            className={cx(
                              "h-4 w-4 transition-transform duration-200",
                              isSaveMenuOpen ? "rotate-180" : ""
                            )}
                          />
                        </button>
                      </div>

                      {isSaveMenuOpen && (
                        <div className="absolute bottom-[calc(100%+10px)] left-0 z-[80] min-w-[240px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_20px_50px_rgba(15,23,42,0.16)]">
                          <button
                            type="button"
                            onClick={() => {
                              setIsSaveMenuOpen(false);
                              setIsSaveAsTemplateModalOpen(true);
                            }}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            <LayoutTemplate className="h-4 w-4 text-slate-600" />
                            <span>Save as a template</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="h-6 w-px bg-slate-200" />

                    <ToolbarButton
                      label="Templates"
                      icon={<LayoutTemplate className="h-4 w-4" />}
                      onClick={() => setIsTemplatesModalOpen(true)}
                      active={isTemplatesModalOpen}
                    />

                    <div ref={variablesMenuRef} className="relative">
                      <ToolbarButton
                        label="Variables"
                        icon={<Variable className="h-4 w-4" />}
                        onClick={() => setIsVariablesMenuOpen((prev) => !prev)}
                        active={isVariablesMenuOpen}
                      />

                      {isVariablesMenuOpen && (
                        <div className="absolute bottom-[calc(100%+12px)] left-0 z-30 w-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.16)]">
                          <div className="max-h-[320px] overflow-y-auto py-2">
                            {sequenceVariableOptions.length ? (
                              sequenceVariableOptions.map((item) => (
                                <button
                                  key={item.value}
                                  type="button"
                                  onClick={() => handleInsertSequenceVariable(item.value)}
                                  className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-slate-50"
                                >
                                  <span className="text-[15px] font-semibold text-slate-800">
                                    {item.label}
                                  </span>
                                  <span className="ml-4 text-sm text-slate-400">
                                    {item.value}
                                  </span>
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-6 text-sm text-slate-500">
                                No CSV variables available. Upload or import a CSV first.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <ToolbarButton
                      label="Link"
                      icon={<Link2 className="h-4 w-4" />}
                      onClick={handleOpenInsertLinkEditor}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-4">
              <ShellCard className="p-4">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Start</p>
                    <input
                      type="date"
                      value={configuration.schedule.startDate || ""}
                      onChange={(e) =>
                        setConfiguration((prev) => ({
                          ...prev,
                          schedule: { ...prev.schedule, startDate: e.target.value },
                        }))
                      }
                      className={cx(inputClassName, "mt-2")}
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">End</p>
                    <input
                      type="date"
                      value={configuration.schedule.endDate || ""}
                      onChange={(e) =>
                        setConfiguration((prev) => ({
                          ...prev,
                          schedule: { ...prev.schedule, endDate: e.target.value },
                        }))
                      }
                      className={cx(inputClassName, "mt-2")}
                    />
                  </div>
                </div>
              </ShellCard>

              <div className="space-y-3">
                {configuration.schedule.windows.map((windowItem, index) => (
                  <button
                    key={`${windowItem.name}-${index}`}
                    type="button"
                    onClick={() => setSelectedScheduleIndex(index)}
                    className={cx(
                      "w-full rounded-3xl border px-4 py-4 text-left transition",
                      selectedScheduleIndex === index
                        ? "border-blue-500 bg-white shadow-sm ring-1 ring-blue-500"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {windowItem.name || `Schedule ${index + 1}`}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {windowItem.from} - {windowItem.to}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                          {getWindowDaySummary(windowItem.days)}
                        </p>
                      </div>
                      {selectedScheduleIndex === index ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                          <Check className="h-4 w-4" />
                        </div>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={addScheduleWindow}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-50"
              >
                Add schedule
              </button>
            </div>

            <div className="space-y-5">
              <ShellCard className="p-6">
                <SectionHeader
                  title="Schedule Name"
                  description="Set a title for the selected schedule window"
                  action={
                    configuration.schedule.windows.length > 1 ? (
                      <button
                        type="button"
                        onClick={removeActiveScheduleWindow}
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                      >
                        Remove
                      </button>
                    ) : null
                  }
                />
                <input
                  value={activeScheduleWindow?.name || ""}
                  onChange={(e) => updateActiveScheduleWindow({ name: e.target.value })}
                  className={inputClassName}
                  placeholder="New schedule"
                />
              </ShellCard>

              <ShellCard className="p-6">
                <SectionHeader
                  title="Timing"
                  description="Choose the active send window and timezone"
                  action={
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-500">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {configuration.schedule.timezone}
                    </div>
                  }
                />
                <div className="grid gap-4 xl:grid-cols-[220px_220px_minmax(0,1fr)]">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-500">From</label>
                    <input
                      type="time"
                      value={activeScheduleWindow?.from || "09:00"}
                      onChange={(e) => updateActiveScheduleWindow({ from: e.target.value })}
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-500">To</label>
                    <input
                      type="time"
                      value={activeScheduleWindow?.to || "18:00"}
                      onChange={(e) => updateActiveScheduleWindow({ to: e.target.value })}
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-500">Timezone</label>
                    <Select<TimezoneOption, false>
                      options={scheduleTimezoneOptions}
                      value={
                        scheduleTimezoneOptions.find((option) => option.value === configuration.schedule.timezone) ||
                        null
                      }
                      onChange={(selectedOption) =>
                        setConfiguration((prev) => ({
                          ...prev,
                          schedule: {
                            ...prev.schedule,
                            timezone: selectedOption?.value || "",
                          },
                        }))
                      }
                      isSearchable
                      placeholder="Search timezone..."
                      className="text-sm"
                      classNamePrefix="react-select"
                    />
                  </div>
                </div>
              </ShellCard>

              <ShellCard className="p-6">
                <SectionHeader
                  title="Days"
                  description="Choose the weekdays that are active for this schedule"
                />
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {weekdayLabels.map((day) => {
                    const checked = Boolean(activeScheduleWindow?.days?.[day.key]);
                    return (
                      <label
                        key={day.key}
                        className={cx(
                          "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm",
                          checked
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-700"
                        )}
                      >
                        <span>{day.full}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleActiveScheduleDay(day.key)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                      </label>
                    );
                  })}
                </div>
              </ShellCard>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSaveConfiguration(true)}
                  disabled={submittingKey !== ""}
                  className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "options" && (
          <div className="space-y-6">
            <ShellCard className="p-6">
              <SectionHeader
                title="Accounts to use"
                description="Select one or more accounts to send emails from"
              />

              {(
                campaign?.instantly?.availableAccountEmails?.length
                  ? campaign.instantly.availableAccountEmails
                  : campaign?.instantly?.accountEmails || []
              ).length ? (
                <div className="space-y-4">
                  <div className="grid gap-3">
                    {(
                      campaign?.instantly?.availableAccountEmails?.length
                        ? campaign.instantly.availableAccountEmails
                        : campaign?.instantly?.accountEmails || []
                    ).map((email) => {
                      const normalizedEmail = normalizeEmailValue(email);
                      const isPrimary =
                        normalizeEmailValue(campaign?.instantly?.senderAccountEmail) === normalizedEmail;

                      const isChecked = selectedAccountEmails
                        .map((item) => normalizeEmailValue(item))
                        .includes(normalizedEmail);

                      const isCurrentSender =
                        normalizeEmailValue(selectedSenderEmail) === normalizedEmail;

                      return (
                        <label
                          key={email}
                          className={cx(
                            "flex cursor-pointer items-start justify-between gap-4 rounded-2xl border p-4 transition",
                            isChecked
                              ? "border-blue-200 bg-blue-50"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900">{email}</p>

                              {isPrimary ? (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                  Primary
                                </span>
                              ) : null}

                              {isCurrentSender ? (
                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                                  Default sender
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                              {flowType === "ime_influencer"
                                ? "Assigned IME sending account"
                                : "Assigned SDR sending account"}
                            </p>
                          </div>

                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectedAccountEmail(email)}
                            className="mt-1 h-4 w-4 rounded border-slate-300"
                          />
                        </label>
                      );
                    })}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Default sender
                      </label>
                      <select
                        value={selectedSenderEmail}
                        onChange={(e) => {
                          const nextEmail = normalizeEmailValue(e.target.value);
                          setSelectedSenderEmail(nextEmail);
                          setSelectedAccountEmails((prev) =>
                            prev.includes(nextEmail) ? prev : [nextEmail, ...prev]
                          );
                        }}
                        className={inputClassName}
                      >
                        {selectedAccountEmails.map((email) => (
                          <option key={email} value={email}>
                            {email}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Owner
                      </label>
                      <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900">
                        {getAdminLabel(flowType === "ime_influencer" ? campaign?.IMEId : campaign?.sdrId)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-slate-700">No sending accounts found</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Assign mailboxes first from My Accounts / Mailboxes.
                  </p>
                </div>
              )}
            </ShellCard>

            <ShellCard className="p-6">
              <SectionHeader
                title="Sending pattern"
                description="Specify how you want your emails to go"
              />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ["dailyLimit", "Daily Limit"],
                  ["dailyMaxLeads", "Max New Leads / Day"],
                  ["emailGap", "Minimum Time Gap (min)"],
                  ["randomWaitMax", "Random Additional Time (min)"],
                ].map(([key, label]) => (
                  <div key={key} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                      {label}
                    </label>
                    <input
                      type="number"
                      value={(configuration.sendingOptions as any)[key]}
                      onChange={(e) =>
                        updateSendingOption(
                          key as keyof SendingOptions,
                          Number(e.target.value || 0)
                        )
                      }
                      className={inputClassName}
                    />
                  </div>
                ))}
              </div>
            </ShellCard>

            <ShellCard className="p-6">
              <SectionHeader
                title="Behavior, tracking & deliverability"
                description="Campaign safety, provider matching, unsubscribe header, CC/BCC"
              />

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Toggle label="Stop sending emails on reply" description="Stop sending emails to a lead if a response has been received" checked={configuration.sendingOptions.stopOnReply} onChange={(value) => updateSendingOption("stopOnReply", value)} />
                <Toggle label="Stop sending emails on auto-reply" description="Pause after out-of-office or automatic responses" checked={configuration.sendingOptions.stopOnAutoReply} onChange={(value) => updateSendingOption("stopOnAutoReply", value)} />
                <Toggle label="Open Tracking" description="Track email opens" checked={configuration.sendingOptions.openTracking} onChange={(value) => updateSendingOption("openTracking", value)} />
                <Toggle label="Link Tracking" description="Track clicks inside emails" checked={configuration.sendingOptions.linkTracking} onChange={(value) => updateSendingOption("linkTracking", value)} />
                <Toggle label="Delivery Optimization" description="Text-only emails disable open tracking" checked={configuration.sendingOptions.textOnly} onChange={(value) => updateSendingOption("textOnly", value)} />
                <Toggle label="First Email Text Only" description="Send only the first email as text-only" checked={configuration.sendingOptions.firstEmailTextOnly} onChange={(value) => updateSendingOption("firstEmailTextOnly", value)} />
                <Toggle label="Prioritize New Leads" description="Prioritize fresh leads before follow-ups" checked={configuration.sendingOptions.prioritizeNewLeads} onChange={(value) => updateSendingOption("prioritizeNewLeads", value)} />
                <Toggle label="Provider Matching" description="Match the lead ESP with your mailbox provider" checked={configuration.sendingOptions.matchLeadEsp} onChange={(value) => updateSendingOption("matchLeadEsp", value)} />
                <Toggle label="Stop Campaign for Company on Reply" description="Stop the campaign for all leads in the same company after one reply" checked={configuration.sendingOptions.stopForCompany} onChange={(value) => updateSendingOption("stopForCompany", value)} />
                <Toggle label="Insert Unsubscribe Link Header" description="Adds one-click unsubscribe header where supported" checked={configuration.sendingOptions.insertUnsubscribeHeader} onChange={(value) => updateSendingOption("insertUnsubscribeHeader", value)} />
                <Toggle label="Allow Risky Emails" description="Allow risky contacts when verification is enabled" checked={configuration.sendingOptions.allowRiskyContacts} onChange={(value) => updateSendingOption("allowRiskyContacts", value)} />
                <Toggle label="Disable Bounce Protect" description="Disable bounce protection for this campaign" checked={configuration.sendingOptions.disableBounceProtect} onChange={(value) => updateSendingOption("disableBounceProtect", value)} />
                <Toggle label="Evergreen Campaign" description="Continuously accept new contacts" checked={configuration.sendingOptions.isEvergreen} onChange={(value) => updateSendingOption("isEvergreen", value)} />
              </div>

              <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">CC and BCC</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Add CC and BCC recipients to all emails
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCcBcc((prev) => !prev)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    {showCcBcc ? "Hide CC & BCC" : "Show CC & BCC"}
                  </button>
                </div>

                {showCcBcc ? (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        CC List
                      </label>
                      <input
                        value={(configuration.sendingOptions.ccList || []).join(", ")}
                        onChange={(e) =>
                          updateSendingOption(
                            "ccList",
                            e.target.value.split(",").map((item) => item.trim()).filter(Boolean)
                          )
                        }
                        placeholder="cc1@example.com, cc2@example.com"
                        className={inputClassName}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        BCC List
                      </label>
                      <input
                        value={(configuration.sendingOptions.bccList || []).join(", ")}
                        onChange={(e) =>
                          updateSendingOption(
                            "bccList",
                            e.target.value.split(",").map((item) => item.trim()).filter(Boolean)
                          )
                        }
                        placeholder="bcc1@example.com, bcc2@example.com"
                        className={inputClassName}
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              {/* <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Advanced Deliverability</p>
                <p className="mt-1 text-xs text-slate-500">
                  Domain limiter, custom routing, and workspace-wide deliverability boosters can stay
                  provider-driven for now.
                </p>
              </div> */}

              <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => handleSaveConfiguration(true)}
                  disabled={submittingKey !== "" || !selectedAccountEmails.length}
                  className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-100 disabled:opacity-50"
                >
                  {submittingKey === "save-sync" ? "Saving..." : "Save"}
                </button>
              </div>
            </ShellCard>
          </div>
        )}

        {activeTab === "subsequences" && (
          campaign?.status !== "launched" ? (
            <ShellCard className="p-10">
              <div className="flex flex-col items-center justify-center text-center">
                <Activity className="h-10 w-10 text-slate-300" />
                <h3 className="mt-4 text-xl font-semibold text-slate-800">
                  Launch the campaign first
                </h3>
                <p className="mt-2 max-w-2xl text-sm text-slate-500">
                  Subsequences become available after the main campaign is launched.
                </p>
              </div>
            </ShellCard>
          ) : (
            <div className="space-y-6">
              <ShellCard className="p-6">
                <SectionHeader
                  title="Subsequences"
                  description="Create triggered follow-up flows for exact phrases, statuses, or activities."
                  action={
                    <button
                      type="button"
                      onClick={openCreateSubsequence}
                      className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add subsequence
                    </button>
                  }
                />

                {subsequences.length ? (
                  <div className="grid gap-4">
                    {subsequences.map((row) => (
                      <div
                        key={row._id}
                        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.03)]"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-lg font-semibold text-slate-900">{row.name}</p>
                              <span
                                className={cx(
                                  "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                                  getStatusPillClasses(row.status)
                                )}
                              >
                                {row.status.toUpperCase()}
                              </span>
                            </div>

                            <div className="mt-3 grid gap-3 sm:grid-cols-3">
                              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  Status triggers
                                </p>
                                <p className="mt-2 text-sm text-slate-700">
                                  {row.trigger.statuses.length ? row.trigger.statuses.join(", ") : "—"}
                                </p>
                              </div>

                              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  Activity triggers
                                </p>
                                <p className="mt-2 text-sm text-slate-700">
                                  {row.trigger.activities.length ? row.trigger.activities.join(", ") : "—"}
                                </p>
                              </div>

                              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  Exact phrases
                                </p>
                                <p className="mt-2 text-sm text-slate-700">
                                  {row.trigger.phrases.length ? row.trigger.phrases.join(" · ") : "—"}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                              <span>
                                Daily limit mode: <strong>{row.dailyLimitMode}</strong>
                              </span>
                              <span>
                                Ignore account limits:{" "}
                                <strong>{row.ignoreAccountDailyLimits ? "Yes" : "No"}</strong>
                              </span>
                              <span>
                                Steps: <strong>{row.sequences.length}</strong>
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditSubsequence(row)}
                              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDuplicateSubsequence(row._id)}
                              disabled={submittingKey === `duplicate-subsequence-${row._id}`}
                              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                              Duplicate
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleSubsequenceStatus(row)}
                              disabled={
                                submittingKey === `launch-subsequence-${row._id}` ||
                                submittingKey === `pause-subsequence-${row._id}`
                              }
                              className={cx(
                                "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50",
                                row.status === "launched"
                                  ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                  : "bg-blue-600 text-white hover:bg-blue-700"
                              )}
                            >
                              {row.status === "launched" ? (
                                <>
                                  <Pause className="h-4 w-4" />
                                  Pause
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4" />
                                  Launch
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteSubsequence(row._id)}
                              disabled={submittingKey === `delete-subsequence-${row._id}`}
                              className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
                    <Activity className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-4 text-lg font-semibold text-slate-800">
                      No subsequences yet
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Create a subsequence for phrase-based or activity-based follow-up automation.
                    </p>
                    <button
                      type="button"
                      onClick={openCreateSubsequence}
                      className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                      Create first subsequence
                    </button>
                  </div>
                )}
              </ShellCard>
            </div>
          )
        )}
      </div>

      {removeLeadOpen && removeLead && (
        <div className="fixed inset-0 z-[61] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Lead Action
                </p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">Remove Lead</h3>
                <p className="mt-1 text-sm text-slate-500">
                  This removes the lead from this campaign only.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setRemoveLeadOpen(false);
                  setRemoveLead(null);
                }}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4">
              <p className="text-sm font-medium text-slate-900">Lead</p>
              <p className="mt-1 text-sm text-rose-700">{getResolvedLeadName(removeLead)}</p>
              <p className="mt-1 text-xs text-rose-600">{getResolvedContactMeta(removeLead)}</p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setRemoveLeadOpen(false);
                  setRemoveLead(null);
                }}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRemoveLead}
                disabled={submittingKey === `remove-${removeLead._id}`}
                className="rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {submittingKey === `remove-${removeLead._id}` ? "Removing..." : "Remove Lead"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isTemplatesModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="flex h-[90vh] w-full max-w-[1220px] overflow-hidden rounded-[18px] bg-white shadow-2xl">
            <div className="flex w-[280px] flex-col border-r border-slate-200 bg-[#fbfbfd]">
              <div className="border-b border-slate-200 px-5 py-5">
                <div className="flex items-center gap-2">
                  <LayoutTemplate className="h-5 w-5 text-slate-900" />
                  <h3 className="text-[18px] font-semibold text-slate-900">Templates</h3>
                </div>
              </div>

              <div className="border-b border-slate-200 px-4 py-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    placeholder="Search"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-2">
                {filteredTemplateGroups.map((group) => {
                  const isExpanded = expandedTemplateGroups[group.category];
                  const hasTemplates = group.templates.length > 0;

                  return (
                    <div key={group.category} className="border-b border-slate-100 py-1">
                      <button
                        type="button"
                        onClick={() => toggleTemplateGroup(group.category)}
                        className="flex w-full items-center justify-between px-2 py-3 text-left"
                      >
                        <span className="text-[15px] font-semibold text-slate-500">
                          {group.title}
                        </span>
                        <ChevronDown
                          className={cx(
                            "h-4 w-4 text-slate-400 transition",
                            isExpanded ? "rotate-180" : ""
                          )}
                        />
                      </button>

                      {isExpanded && (
                        <div className="pb-2">
                          {hasTemplates ? (
                            group.templates.map((template) => {
                              const isActive = selectedTemplateId === template.id;

                              return (
                                <button
                                  key={template.id}
                                  type="button"
                                  onClick={() => setSelectedTemplateId(template.id)}
                                  className={cx(
                                    "block w-full rounded-xl px-3 py-2 text-left text-sm transition",
                                    isActive
                                      ? "bg-slate-100 text-slate-900"
                                      : "text-slate-600 hover:bg-slate-50"
                                  )}
                                >
                                  {template.title}
                                </button>
                              );
                            })
                          ) : (
                            <div className="px-3 py-2 text-sm text-slate-400">
                              No templates found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <p className="text-[16px] font-semibold text-slate-700">
                    Subject:{selectedTemplate?.subject || "—"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsTemplatesModalOpen(false)}
                  className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="rounded-2xl bg-slate-50 px-6 py-6">
                  <pre className="whitespace-pre-wrap font-sans text-[15px] leading-8 text-slate-800">
                    {selectedTemplate?.body || "Select a template to preview it here."}
                  </pre>
                </div>
              </div>

              <div className="border-t border-slate-200 px-6 py-4">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleCopyTemplate}
                    disabled={!selectedTemplate}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-blue-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </button>

                  <button
                    type="button"
                    onClick={handleUseTemplate}
                    disabled={!selectedTemplate}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Use template
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {isSaveAsTemplateModalOpen && (
        <div className="fixed inset-0 z-[69] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Template
                </p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">Save as a Template</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Enter a template name to save this subject and email body.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsSaveAsTemplateModalOpen(false);
                  setTemplateNameInput("");
                }}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Template name
                </label>
                <input
                  value={templateNameInput}
                  onChange={(e) => setTemplateNameInput(e.target.value)}
                  placeholder="Enter template name"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Preview
                </p>
                <p className="mt-2 truncate text-sm font-medium text-slate-800">
                  Subject: {selectedSequenceVariant?.subject || "—"}
                </p>
                <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm text-slate-600">
                  {selectedSequenceVariant?.body || "—"}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsSaveAsTemplateModalOpen(false);
                  setTemplateNameInput("");
                }}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveAsTemplate}
                disabled={submittingKey === "save-template"}
                className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {submittingKey === "save-template" ? "Saving..." : "Save Template"}
              </button>
            </div>
          </div>
        </div>
      )}
      {isSubsequenceModalOpen && (
        <div className="fixed inset-0 z-[68] bg-slate-950/45 p-4 backdrop-blur-[2px]">
          <div className="mx-auto flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Subsequences
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-bold text-slate-900">
                    {editingSubsequenceId ? "Edit subsequence" : "Create subsequence"}
                  </h3>
                  <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {subsequenceForm.status?.toUpperCase() || "DRAFT"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Create a triggered follow-up flow based on lead status, activity, or exact phrases.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsSubsequenceModalOpen(false);
                  setEditingSubsequenceId(null);
                  setSubsequenceForm(getDefaultSubsequence());
                }}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-6">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5">
                      <h4 className="text-base font-semibold text-slate-900">Trigger rules</h4>
                      <p className="mt-1 text-sm text-slate-500">
                        Decide when leads should enter this subsequence.
                      </p>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Subsequence name
                        </label>
                        <input
                          value={subsequenceForm.name}
                          onChange={(e) =>
                            setSubsequenceForm((prev) => ({ ...prev, name: e.target.value }))
                          }
                          placeholder="New subsequence"
                          className={inputClassName}
                        />
                      </div>

                      <div>
                        <label className="mb-3 block text-sm font-medium text-slate-700">
                          Lead status triggers
                        </label>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {stageOptions.map((option) => {
                            const checked = subsequenceForm.trigger.statuses.includes(option.value);

                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() =>
                                  setSubsequenceForm((prev) => ({
                                    ...prev,
                                    trigger: {
                                      ...prev.trigger,
                                      statuses: checked
                                        ? prev.trigger.statuses.filter((item) => item !== option.value)
                                        : [...prev.trigger.statuses, option.value],
                                    },
                                  }))
                                }
                                className={cx(
                                  "flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition",
                                  checked
                                    ? "border-blue-200 bg-blue-50 text-blue-700"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                )}
                              >
                                <span className="font-medium">{option.label}</span>
                                <span
                                  className={cx(
                                    "h-4 w-4 rounded-full border",
                                    checked
                                      ? "border-blue-600 bg-blue-600"
                                      : "border-slate-300 bg-white"
                                  )}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="mb-3 block text-sm font-medium text-slate-700">
                          Activity triggers
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {subsequenceActivityOptions.map((option) => {
                            const checked = subsequenceForm.trigger.activities.includes(option.value);

                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() =>
                                  setSubsequenceForm((prev) => ({
                                    ...prev,
                                    trigger: {
                                      ...prev.trigger,
                                      activities: checked
                                        ? prev.trigger.activities.filter((item) => item !== option.value)
                                        : [...prev.trigger.activities, option.value],
                                    },
                                  }))
                                }
                                className={cx(
                                  "rounded-full border px-4 py-2 text-sm font-medium transition",
                                  checked
                                    ? "border-blue-200 bg-blue-50 text-blue-700"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                )}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Exact phrases
                        </label>
                        <textarea
                          value={subsequenceForm.trigger.phrases.join("\n")}
                          onChange={(e) =>
                            setSubsequenceForm((prev) => ({
                              ...prev,
                              trigger: {
                                ...prev.trigger,
                                phrases: e.target.value
                                  .split("\n")
                                  .map((item) => item.trim())
                                  .filter(Boolean),
                              },
                            }))
                          }
                          rows={5}
                          placeholder={`One phrase per line\ninterested\nsend pricing\nbook a call`}
                          className={cx(inputClassName, "resize-y")}
                        />
                        <p className="mt-2 text-xs text-slate-400">
                          Leads can enter the subsequence when their reply contains one of these exact phrases.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5">
                      <h4 className="text-base font-semibold text-slate-900">Subsequence steps</h4>
                      <p className="mt-1 text-sm text-slate-500">
                        Configure the emails and timing for this triggered flow.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {subsequenceForm.sequences.map((step, index) => (
                        <div
                          key={`${step.stepOrder}-${index}`}
                          className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-3">
                                <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white">
                                  {index + 1}
                                </span>
                                <div>
                                  <p className="text-base font-semibold text-slate-900">
                                    Step {index + 1}
                                  </p>
                                  <p className="mt-1 text-sm text-slate-500">
                                    {index === 0
                                      ? "Delay before the first subsequence message"
                                      : "Delay after the previous subsequence step"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {subsequenceForm.sequences.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => removeSubsequenceStep(index)}
                                className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                              >
                                Remove
                              </button>
                            ) : null}
                          </div>

                          <div className="mt-5 grid gap-4 lg:grid-cols-[120px_170px_minmax(0,1fr)]">
                            <div>
                              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Delay
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={step.delay}
                                onChange={(e) =>
                                  updateSubsequenceStep(index, {
                                    delay: Number(e.target.value || 0),
                                  })
                                }
                                className={inputClassName}
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Unit
                              </label>
                              <select
                                value={step.delayUnit}
                                onChange={(e) =>
                                  updateSubsequenceStep(index, {
                                    delayUnit: e.target.value as "minutes" | "hours" | "days",
                                  })
                                }
                                className={inputClassName}
                              >
                                <option value="minutes">Minutes</option>
                                <option value="hours">Hours</option>
                                <option value="days">Days</option>
                              </select>
                            </div>

                            <div>
                              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Subject
                              </label>
                              <input
                                value={step.variants?.[0]?.subject || ""}
                                onChange={(e) =>
                                  updateSubsequenceVariant(index, { subject: e.target.value })
                                }
                                placeholder="Write subject line"
                                className={inputClassName}
                              />
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Email body
                            </label>
                            <textarea
                              value={step.variants?.[0]?.body || ""}
                              onChange={(e) =>
                                updateSubsequenceVariant(index, { body: e.target.value })
                              }
                              placeholder="Write follow-up message"
                              rows={6}
                              className={cx(inputClassName, "resize-y")}
                            />
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={addSubsequenceStep}
                        className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-50"
                      >
                        <Plus className="h-4 w-4" />
                        Add step
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5">
                      <h4 className="text-base font-semibold text-slate-900">Delivery settings</h4>
                      <p className="mt-1 text-sm text-slate-500">
                        Control how this subsequence follows campaign limits and schedules.
                      </p>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label className="mb-3 block text-sm font-medium text-slate-700">
                          Schedule mode
                        </label>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {[
                            { label: "Inherit from campaign", value: "inherit" },
                            { label: "Custom schedule", value: "custom" },
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() =>
                                setSubsequenceForm((prev) => ({
                                  ...prev,
                                  scheduleMode: option.value as "inherit" | "custom",
                                }))
                              }
                              className={cx(
                                "rounded-2xl border px-4 py-3 text-left text-sm font-medium transition",
                                subsequenceForm.scheduleMode === option.value
                                  ? "border-blue-200 bg-blue-50 text-blue-700"
                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="mb-3 block text-sm font-medium text-slate-700">
                          Daily limit mode
                        </label>
                        <div className="grid gap-2">
                          {[
                            { label: "Inherit from campaign", value: "inherit" },
                            { label: "Custom daily limit", value: "custom" },
                            { label: "No daily limit", value: "none" },
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() =>
                                setSubsequenceForm((prev) => ({
                                  ...prev,
                                  dailyLimitMode: option.value as "inherit" | "custom" | "none",
                                }))
                              }
                              className={cx(
                                "rounded-2xl border px-4 py-3 text-left text-sm font-medium transition",
                                subsequenceForm.dailyLimitMode === option.value
                                  ? "border-blue-200 bg-blue-50 text-blue-700"
                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Daily limit
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={subsequenceForm.dailyLimit}
                          onChange={(e) =>
                            setSubsequenceForm((prev) => ({
                              ...prev,
                              dailyLimit: Number(e.target.value || 0),
                            }))
                          }
                          className={inputClassName}
                        />
                      </div>

                      <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        <span className="font-medium">Ignore account daily limits</span>
                        <input
                          type="checkbox"
                          checked={subsequenceForm.ignoreAccountDailyLimits}
                          onChange={(e) =>
                            setSubsequenceForm((prev) => ({
                              ...prev,
                              ignoreAccountDailyLimits: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <h4 className="text-base font-semibold text-slate-900">Summary</h4>
                    <div className="mt-4 grid gap-3">
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Selected statuses
                        </p>
                        <p className="mt-2 text-sm text-slate-700">
                          {subsequenceForm.trigger.statuses.length
                            ? subsequenceForm.trigger.statuses.join(", ")
                            : "None selected"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Selected activities
                        </p>
                        <p className="mt-2 text-sm text-slate-700">
                          {subsequenceForm.trigger.activities.length
                            ? subsequenceForm.trigger.activities.join(", ")
                            : "None selected"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Total steps
                        </p>
                        <p className="mt-2 text-sm text-slate-700">
                          {subsequenceForm.sequences.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setIsSubsequenceModalOpen(false);
                  setEditingSubsequenceId(null);
                  setSubsequenceForm(getDefaultSubsequence());
                }}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveSubsequence}
                disabled={submittingKey === "save-subsequence"}
                className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {submittingKey === "save-subsequence" ? "Saving..." : "Save subsequence"}
              </button>
            </div>
          </div>
        </div>
      )}
      {isLinkEditorOpen && (
        <div className="fixed inset-0 z-[76] flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-[340px] overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
              <button
                type="button"
                onClick={resetLinkEditor}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-6 px-5 py-6">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
                  URL
                </label>
                <input
                  value={linkEditorUrl}
                  onChange={(e) => setLinkEditorUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full rounded-none border border-blue-500 px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-0"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
                  Text
                </label>
                <input
                  value={linkEditorText}
                  onChange={(e) => setLinkEditorText(e.target.value)}
                  placeholder="Link"
                  className="w-full rounded-none border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-0"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSubmitLinkEditor}
                  className="text-[15px] font-semibold text-blue-600 transition hover:text-blue-700"
                >
                  {linkEditorMode === "edit" ? "Update" : "Insert"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isSequencePreviewOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="flex h-[92vh] w-full max-w-7xl overflow-hidden rounded-[32px] border border-white/20 bg-white shadow-[0_40px_120px_rgba(15,23,42,0.35)]">
            <aside className="hidden w-[390px] shrink-0 flex-col border-r border-slate-200 bg-slate-50/80 lg:flex">
              <div className="border-b border-slate-200 bg-white px-6 py-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                      <Eye className="h-3.5 w-3.5" />
                      Preview Mode
                    </div>

                    <h3 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">
                      Email Preview
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSequencePreviewOpen(false)}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto px-6 py-6">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    Select Lead
                  </label>

                  <div className="relative">
                    <select
                      value={previewLeadId}
                      onChange={(e) => {
                        const nextId = e.target.value;
                        setPreviewLeadId(nextId);
                        handleOpenSequencePreview(nextId);
                      }}
                      className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    >
                      {previewLeadOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div className="mt-6 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <Users className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                        Selected Lead
                      </p>

                      <p className="mt-2 truncate text-base font-bold text-slate-950">
                        {sequencePreview?.lead?.leadName || "Lead Unknown"}
                      </p>

                      <p className="mt-1 truncate text-sm text-slate-600">
                        {sequencePreview?.lead?.contactName || "Contact Unknown"}
                      </p>

                      <p className="mt-1 truncate text-sm text-slate-500">
                        {sequencePreview?.lead?.email || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                        Sequence Details
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        Step {sequencePreview?.stepOrder || selectedSequenceStep?.stepOrder || 1}
                        {" · "}
                        Variant {String.fromCharCode(65 + (sequencePreview?.variantIndex || 0))}
                      </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        From
                      </p>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-700">
                        {selectedSenderEmail || campaign?.instantly?.senderAccountEmail || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        To
                      </p>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-700">
                        {sequencePreview?.lead?.email || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Variable className="h-4 w-4 text-slate-400" />
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      Variable Snapshot
                    </p>
                  </div>

                  <div className="mt-4 max-h-[220px] space-y-2 overflow-auto pr-1">
                    {Object.entries(sequencePreviewMappedVars).slice(0, 18).length ? (
                      Object.entries(sequencePreviewMappedVars)
                        .slice(0, 18)
                        .map(([key, value]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2"
                          >
                            <span className="truncate text-xs font-semibold text-slate-500">
                              {key}
                            </span>
                            <span className="max-w-[170px] truncate text-xs font-bold text-slate-900">
                              {String(value || "—")}
                            </span>
                          </div>
                        ))
                    ) : (
                      <p className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-500">
                        No variables found for this lead.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </aside>

            <main className="flex min-w-0 flex-1 flex-col bg-[#f8fafc]">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 lg:hidden">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                    Preview Mode
                  </p>
                  <h3 className="text-lg font-bold text-slate-950">Email Preview</h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSequencePreviewOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="border-b border-slate-200 bg-white px-6 py-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                        <Sparkles className="h-3.5 w-3.5" />
                        Rendered with lead data
                      </span>

                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        Step {sequencePreview?.stepOrder || selectedSequenceStep?.stepOrder || 1}
                      </span>
                    </div>

                    <h2 className="mt-3 truncate text-2xl font-bold tracking-tight text-slate-950">
                      {sequencePreview?.subject || "No subject"}
                    </h2>

                    {sequencePreview?.preheaderText ? (
                      <p className="mt-2 text-sm text-slate-500">
                        Preheader: {sequencePreview.preheaderText}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 lg:hidden">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      Select Lead
                    </span>

                    <div className="relative">
                      <select
                        value={previewLeadId}
                        onChange={(e) => {
                          const nextId = e.target.value;
                          setPreviewLeadId(nextId);
                          handleOpenSequencePreview(nextId);
                        }}
                        className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                      >
                        {previewLeadOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-10">
                <div className="mx-auto max-w-4xl">
                  <div className="mb-4 rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="grid gap-3 text-sm lg:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                          From
                        </p>
                        <p className="mt-1 truncate font-semibold text-slate-800">
                          {selectedSenderEmail || campaign?.instantly?.senderAccountEmail || "—"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                          To
                        </p>
                        <p className="mt-1 truncate font-semibold text-slate-800">
                          {sequencePreview?.lead?.email || "—"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                          Lead
                        </p>
                        <p className="mt-1 truncate font-semibold text-slate-800">
                          {sequencePreview?.lead?.leadName || "Lead Unknown"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                    <div className="border-b border-slate-100 bg-white px-6 py-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                          <Mail className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                            Email Subject
                          </p>
                          <p className="mt-1 text-lg font-bold leading-7 text-slate-950">
                            {sequencePreview?.subject || "No subject"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white px-6 py-8 sm:px-9">
                      <div
                        className="prose prose-slate max-w-none text-[15px] leading-8 text-slate-700 prose-a:text-blue-600 prose-a:underline prose-p:my-3 prose-strong:text-slate-950 [&_a]:font-semibold [&_a]:text-blue-600 [&_a]:underline [&_br]:leading-8"
                        dangerouslySetInnerHTML={{
                          __html:
                            sequencePreview?.bodyHtml ||
                            "<p>No preview available.</p>",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
