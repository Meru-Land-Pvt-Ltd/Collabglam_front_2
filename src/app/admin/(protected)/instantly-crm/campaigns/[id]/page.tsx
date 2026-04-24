"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import Select from "react-select";
import { adminGet, adminPatch, adminPost, adminPostFormData } from "@/lib/api";
import AdminTable, { AdminTableColumn } from "../../../../components/table";

type CampaignFlowType = "standard_brand" | "ime_influencer";

type CampaignScheduleWindow = {
  name: string;
  from: string;
  to: string;
  days: Record<string, boolean>;
};

type CampaignSequenceVariant = {
  subject: string;
  body: string;
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

type CampaignDetail = {
  _id: string;
  name: string;
  flowType: CampaignFlowType;
  status: "draft" | "ready" | "launched" | "paused" | "completed";
  sdrId: any;
  RHId: any;
  IMEId: any;
  instantly?: {
    senderAccountEmail?: string;
    accountEmails?: string[];
    campaignId?: string;
    leadListId?: string;
  };
  teamMailboxes?: {
    RHEmail?: string;
    IMEEmail?: string;
  };
  configuration: CampaignConfiguration;
  stats?: {
    totalProspects?: number;
    totalReplies?: number;
    totalQualified?: number;
    totalAssigned?: number;
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

type TabKey = "overview" | "sequence" | "contacts" | "schedule" | "settings";

const weekdayLabels = [
  { key: "1", label: "Mon", full: "Monday" },
  { key: "2", label: "Tue", full: "Tuesday" },
  { key: "3", label: "Wed", full: "Wednesday" },
  { key: "4", label: "Thu", full: "Thursday" },
  { key: "5", label: "Fri", full: "Friday" },
  { key: "6", label: "Sat", full: "Saturday" },
  { key: "0", label: "Sun", full: "Sunday" },
];

const pageTabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: "overview", label: "Overview", icon: "📊" },
  { key: "contacts", label: "Contacts", icon: "👥" },
  { key: "sequence", label: "Sequences", icon: "🔁" },
  { key: "schedule", label: "Schedule", icon: "🗓️" },
  { key: "settings", label: "Options", icon: "⚙️" },
];

const inputClassName =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDate(value?: string) {
  if (!value) return "No end date";
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
  return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
}

function getFlowPillClasses(flowType?: CampaignFlowType) {
  if (flowType === "ime_influencer") return "bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-200";
  return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
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

function createNewScheduleWindow(index: number): CampaignScheduleWindow {
  return {
    name: `Schedule ${index + 1}`,
    from: "09:00",
    to: "18:00",
    days: createDefaultDays(),
  };
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
        delay: 1,
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
                  }))
                : [{ subject: "", body: "" }],
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
    createdAt: row.createdAt || "",
    launchedAt: row.launchedAt || "",
  };
}

function parseContacts(payload: any): ContactRow[] {
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows.map((row: any) => ({
    _id: String(row?._id || ""),
    companyName: row?.companyName || "",
    primaryContact: row?.primaryContact || {},
    stage: row?.stage || "",
    launchedAt: row?.launchedAt || "",
  }));
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  tone = "blue",
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  tone?: "blue" | "green" | "violet" | "amber" | "fuchsia";
}) {
  const tones = {
    blue: { bg: "bg-blue-50", icon: "text-blue-600" },
    green: { bg: "bg-emerald-50", icon: "text-emerald-600" },
    violet: { bg: "bg-violet-50", icon: "text-violet-600" },
    amber: { bg: "bg-amber-50", icon: "text-amber-600" },
    fuchsia: { bg: "bg-fuchsia-50", icon: "text-fuchsia-600" },
  }[tone];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 transition hover:shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className={cx("inline-flex h-10 w-10 items-center justify-center rounded-lg text-lg", tones.bg, tones.icon)}>
          {icon}
        </span>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="mt-1 text-sm text-slate-500">{label}</p>
        {sub ? <p className="mt-1 text-xs text-slate-400">{sub}</p> : null}
      </div>
    </div>
  );
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-xl border border-slate-200 bg-white p-5", className)}>{children}</div>;
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
        {description ? <p className="mt-0.5 text-sm text-slate-500">{description}</p> : null}
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
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 transition hover:bg-slate-50">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
      </div>
      <div className={cx("relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors", checked ? "bg-blue-500" : "bg-slate-200")}>
        <span className={cx("inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform", checked ? "translate-x-4" : "translate-x-1")} />
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      </div>
    </label>
  );
}

function getWindowDaySummary(days?: Record<string, boolean>) {
  const activeDays = weekdayLabels.filter((day) => days?.[day.key]).map((day) => day.label);
  return activeDays.length ? activeDays.join(", ") : "No days selected";
}

function getFlowCopy(flowType: CampaignFlowType) {
  if (flowType === "ime_influencer") {
    return {
      entityLabel: "Influencer",
      entityPluralLabel: "Influencers",
      contactLabel: "Creator Contact",
      contactsTabDescription: "Import influencers and creator contact details for direct IME outreach.",
      campaignDescription: "Direct outreach flow owned by IME with no RH review handoff.",
      ownerPrimaryLabel: "IME",
      ownerSecondaryLabel: "IME Mailbox",
      ownerSecondaryValueKey: "IMEEmail" as const,
      sequenceDescription: "Configure the outreach sequence for IME-owned influencer conversations.",
      replyMetricLabel: "Replies",
      pipelineMetricLabel: "In Conversation",
      pipelineTone: "fuchsia" as const,
    };
  }

  return {
    entityLabel: "Brand",
    entityPluralLabel: "Brands",
    contactLabel: "Brand Contact",
    contactsTabDescription: "Import brand contacts for SDR outreach and RH/BME handoff.",
    campaignDescription: "Standard SDR → RH → BME qualification and handoff flow.",
    ownerPrimaryLabel: "Revenue Head",
    ownerSecondaryLabel: "RH Mailbox",
    ownerSecondaryValueKey: "RHEmail" as const,
    sequenceDescription: "Configure the outreach sequence for SDR campaigns and RH/BME handoff.",
    replyMetricLabel: "Replies",
    pipelineMetricLabel: "Assigned to BME",
    pipelineTone: "violet" as const,
  };
}

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = String(params?.id || "");

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<ApiState>(null);
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [configuration, setConfiguration] = useState<CampaignConfiguration>(getDefaultConfiguration());
  const [selectedScheduleIndex, setSelectedScheduleIndex] = useState(0);
  const [scheduleTimezoneOptions, setScheduleTimezoneOptions] = useState<TimezoneOption[]>([
    { value: "Asia/Kolkata", label: "Asia/Kolkata" },
  ]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [manualForm, setManualForm] = useState<ManualForm>({
    entityName: "",
    contactName: "",
    contactEmail: "",
  });
  const [sheetUrl, setSheetUrl] = useState("");
  const [submittingKey, setSubmittingKey] = useState("");

  const flowType: CampaignFlowType = campaign?.flowType || "standard_brand";
  const flowCopy = getFlowCopy(flowType);

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
          const label = item?.label || item?.displayName || `${value}${item?.offsetLabel ? ` (${item.offsetLabel})` : ""}`;
          return {
            value,
            label,
            offsetLabel: item?.offsetLabel,
            nowLocal: item?.nowLocal || null,
          };
        })
        .filter(Boolean) as TimezoneOption[];

      const uniqueOptions = Array.from(new Map(mappedOptions.map((item) => [item.value, item])).values());
      const hasFallback = uniqueOptions.some((item) => item.value === fallbackTimezone);

      setScheduleTimezoneOptions(
        hasFallback
          ? uniqueOptions
          : [
              ...uniqueOptions,
              {
                value: fallbackTimezone,
                label: fallbackTimezone,
              },
            ]
      );
    } catch {
      setScheduleTimezoneOptions([
        {
          value: fallbackTimezone,
          label: fallbackTimezone,
        },
      ]);
    }
  }

  async function loadPage(showLoader = true) {
    try {
      if (showLoader) setLoading(true);
      setMessage(null);

      const [campaignPayload, contactsPayload] = await Promise.all([
        adminGet(`/outreach/campaigns/${campaignId}`),
        adminGet(`/outreach/campaigns/${campaignId}/contacts`),
      ]);

      const nextCampaign = parseCampaign(campaignPayload);
      setCampaign(nextCampaign);
      setContacts(parseContacts(contactsPayload));

      if (nextCampaign) {
        setConfiguration(nextCampaign.configuration);
        setSelectedScheduleIndex(0);
        await loadTimezoneOptions(nextCampaign.configuration.schedule.timezone);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to load campaign",
      });
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  useEffect(() => {
    if (campaignId) {
      void loadPage(true);
    }
  }, [campaignId]);

  useEffect(() => {
    const total = configuration.schedule.windows.length;
    if (selectedScheduleIndex > total - 1) {
      setSelectedScheduleIndex(Math.max(0, total - 1));
    }
  }, [configuration.schedule.windows.length, selectedScheduleIndex]);

  function updateStep(stepIndex: number, patch: Partial<CampaignSequenceStep>) {
    setConfiguration((prev) => ({
      ...prev,
      sequences: prev.sequences.map((step, index) =>
        index === stepIndex ? { ...step, ...patch } : step
      ),
    }));
  }

  function updateVariant(stepIndex: number, patch: Partial<CampaignSequenceVariant>) {
    setConfiguration((prev) => ({
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

  function addSequenceStep() {
    setConfiguration((prev) => ({
      ...prev,
      sequences: [
        ...prev.sequences,
        {
          stepOrder: prev.sequences.length + 1,
          type: "email",
          delay: 2,
          delayUnit: "days",
          preDelay: 0,
          preDelayUnit: "days",
          variants: [{ subject: "", body: "" }],
        },
      ],
    }));
  }

  function removeSequenceStep(stepIndex: number) {
    setConfiguration((prev) => ({
      ...prev,
      sequences: prev.sequences
        .filter((_, index) => index !== stepIndex)
        .map((step, index) => ({ ...step, stepOrder: index + 1 })),
    }));
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

  function toggleScheduleDay(index: number, dayKey: string) {
    setConfiguration((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        windows: prev.schedule.windows.map((windowItem, itemIndex) =>
          itemIndex === index
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

  function toggleActiveScheduleDay(dayKey: string) {
    toggleScheduleDay(selectedScheduleIndex, dayKey);
  }

  function addScheduleWindow() {
    const nextIndex = configuration.schedule.windows.length;
    const baseWindow = configuration.schedule.windows[0] || createNewScheduleWindow(0);

    setConfiguration((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        windows: [
          ...prev.schedule.windows,
          {
            name: `Schedule ${prev.schedule.windows.length + 1}`,
            from: baseWindow.from || "09:00",
            to: baseWindow.to || "18:00",
            days: { ...(baseWindow.days || createDefaultDays()) },
          },
        ],
      },
    }));

    setSelectedScheduleIndex(nextIndex);
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

  async function handleSaveConfiguration(syncNow = false) {
    try {
      setSubmittingKey(syncNow ? "save-sync" : "save-config");
      setMessage(null);

      const payload: any = await adminPatch(`/outreach/campaigns/${campaignId}/configuration`, {
        configuration,
        syncNow,
      });

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to save campaign configuration");
      }

      setMessage({
        type: "success",
        text:
          payload?.message ||
          (syncNow
            ? "Campaign configuration saved and synced successfully"
            : "Campaign configuration saved successfully"),
      });

      await loadPage(false);
    } catch (error: any) {
      setMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to save campaign configuration",
      });
    } finally {
      setSubmittingKey("");
    }
  }

  async function handleDirectSync() {
    try {
      setSubmittingKey("sync");
      setMessage(null);

      const payload: any = await adminPost(`/outreach/campaigns/${campaignId}/sync`);
      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to sync campaign");
      }

      setMessage({
        type: "success",
        text: payload?.message || "Campaign synced successfully",
      });

      await loadPage(false);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || error?.message || "Failed to sync campaign",
      });
    } finally {
      setSubmittingKey("");
    }
  }

  async function handleCsvUpload() {
    try {
      if (!csvFile) {
        throw new Error("Please select a CSV file");
      }

      setSubmittingKey("csv");
      setMessage(null);

      const formData = new FormData();
      formData.append("file", csvFile);

      const payload: any = await adminPostFormData(`/outreach/campaigns/${campaignId}/contacts/csv`, formData);

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to upload CSV");
      }

      setMessage({
        type: "success",
        text: payload?.message || "CSV uploaded successfully",
      });

      setCsvFile(null);
      await loadPage(false);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || error?.message || "Failed to upload CSV",
      });
    } finally {
      setSubmittingKey("");
    }
  }

  async function handleManualAdd() {
    try {
      if (!manualForm.entityName.trim()) {
        throw new Error(`${flowCopy.entityLabel} name is required`);
      }

      if (!manualForm.contactEmail.trim()) {
        throw new Error("Contact email is required");
      }

      setSubmittingKey("manual");
      setMessage(null);

      const payload: any = await adminPost(`/outreach/campaigns/${campaignId}/contacts/manual`, {
        companyName: manualForm.entityName.trim(),
        contactName: manualForm.contactName.trim(),
        contactEmail: manualForm.contactEmail.trim(),
      });

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to add manual contact");
      }

      setManualForm({
        entityName: "",
        contactName: "",
        contactEmail: "",
      });

      setMessage({
        type: "success",
        text: payload?.message || "Manual contact added successfully",
      });

      await loadPage(false);
    } catch (error: any) {
      setMessage({
        type: "error",
        text:
          error?.response?.data?.message || error?.message || "Failed to add manual contact",
      });
    } finally {
      setSubmittingKey("");
    }
  }

  async function handleGoogleSheetImport() {
    try {
      if (!sheetUrl.trim()) {
        throw new Error("Google Sheets URL is required");
      }

      setSubmittingKey("sheet");
      setMessage(null);

      const payload: any = await adminPost(`/outreach/campaigns/${campaignId}/contacts/google-sheet`, {
        sheetUrl: sheetUrl.trim(),
      });

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to import Google Sheet");
      }

      setSheetUrl("");
      setMessage({
        type: "success",
        text: payload?.message || "Google Sheet imported successfully",
      });

      await loadPage(false);
    } catch (error: any) {
      setMessage({
        type: "error",
        text:
          error?.response?.data?.message || error?.message || "Failed to import Google Sheet",
      });
    } finally {
      setSubmittingKey("");
    }
  }

  async function handleLaunch() {
    try {
      setSubmittingKey("launch");
      setMessage(null);

      const payload: any = await adminPost(`/outreach/campaigns/${campaignId}/launch`);

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to launch campaign");
      }

      setMessage({
        type: "success",
        text: payload?.message || "Campaign launched successfully",
      });

      await loadPage(false);
    } catch (error: any) {
      setMessage({
        type: "error",
        text:
          error?.response?.data?.message || error?.message || "Failed to launch campaign",
      });
    } finally {
      setSubmittingKey("");
    }
  }

  async function handlePause() {
    try {
      setSubmittingKey("pause");
      setMessage(null);

      const payload: any = await adminPost(`/outreach/campaigns/${campaignId}/pause`);

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to pause campaign");
      }

      setMessage({
        type: "success",
        text: payload?.message || "Campaign paused successfully",
      });

      await loadPage(false);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || error?.message || "Failed to pause campaign",
      });
    } finally {
      setSubmittingKey("");
    }
  }

  const contactColumns: AdminTableColumn<ContactRow>[] = useMemo(
    () => [
      {
        id: "companyName",
        header: flowCopy.entityLabel,
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              {(row.companyName || "C").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{row.companyName || "—"}</p>
              <p className="mt-1 text-xs text-slate-400">{row._id}</p>
            </div>
          </div>
        ),
      },
      {
        id: "contactName",
        header: flowCopy.contactLabel,
        render: (row) => (
          <div>
            <p className="text-sm font-medium text-slate-800">{row.primaryContact?.name || "—"}</p>
            <p className="mt-1 text-xs text-slate-500">{row.primaryContact?.email || "—"}</p>
          </div>
        ),
      },
      {
        id: "stage",
        header: "Stage",
        sortable: true,
        render: (row) => (
          <span className={cx("inline-flex rounded-md px-2.5 py-1 text-xs font-semibold", getStagePillClasses(row.stage))}>
            {row.stage || "—"}
          </span>
        ),
      },
      {
        id: "launchedAt",
        header: "Launched",
        render: (row) => <span className="text-sm text-slate-600">{formatDate(row.launchedAt)}</span>,
      },
    ],
    [flowCopy.contactLabel, flowCopy.entityLabel]
  );

  const scheduleWindows = configuration.schedule.windows.length
    ? configuration.schedule.windows
    : getDefaultConfiguration(flowType).schedule.windows;
  const activeScheduleWindow =
    scheduleWindows[Math.min(selectedScheduleIndex, scheduleWindows.length - 1)] || scheduleWindows[0];

  const totalProspects = campaign?.stats?.totalProspects || contacts.length || 0;
  const totalReplies = campaign?.stats?.totalReplies || 0;
  const totalQualified = campaign?.stats?.totalQualified || 0;
  const totalAssigned = campaign?.stats?.totalAssigned || 0;
  const replyRate = totalProspects > 0 ? ((totalReplies / totalProspects) * 100).toFixed(1) : "0.0";

  const stageCounts = useMemo(() => {
    return contacts.reduce(
      (acc, row) => {
        const key = (row.stage || "new").toLowerCase();

        if (key.includes("assigned_to_ime")) acc.assignedToIme += 1;
        else if (key.includes("assigned_to_bme")) acc.assignedToBme += 1;
        else if (key.includes("qualified")) acc.qualified += 1;
        else if (key.includes("reply")) acc.replied += 1;
        else if (key.includes("unqualified")) acc.unqualified += 1;
        else acc.new += 1;

        return acc;
      },
      {
        new: 0,
        replied: 0,
        qualified: 0,
        assignedToBme: 0,
        assignedToIme: 0,
        unqualified: 0,
      }
    );
  }, [contacts]);

  const selectedTimezoneOption =
    scheduleTimezoneOptions.find((option) => option.value === configuration.schedule.timezone) || null;

  const senderLabel =
    campaign?.instantly?.senderAccountEmail ||
    campaign?.instantly?.accountEmails?.[0] ||
    "—";

  const pipelineValue =
    flowType === "ime_influencer" ? stageCounts.assignedToIme : totalAssigned;

  return (
    <div className="min-h-screen bg-[#f8f9fb] font-sans">
      {message && (
        <div
          className={cx(
            "fixed right-4 top-4 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg",
            message.type === "success" && "bg-emerald-600 text-white",
            message.type === "error" && "bg-red-600 text-white",
            message.type === "info" && "bg-blue-600 text-white"
          )}
        >
          {message.text}
        </div>
      )}

      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-4 px-6 py-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-slate-400">Campaigns</span>
              <span className="text-slate-300">/</span>
              <span className="truncate font-semibold text-slate-800">{campaign?.name || "Campaign"}</span>
              <span className={cx("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize", getStatusPillClasses(campaign?.status))}>
                {campaign?.status || "draft"}
              </span>
              <span className={cx("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", getFlowPillClasses(flowType))}>
                {getFlowLabel(flowType)}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Sender: {senderLabel}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleSaveConfiguration(false)}
              disabled={submittingKey !== ""}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {submittingKey === "save-config" ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={handleDirectSync}
              disabled={submittingKey !== ""}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {submittingKey === "sync" ? "Syncing…" : "Sync Now"}
            </button>
            {campaign?.status === "launched" ? (
              <button
                type="button"
                onClick={handlePause}
                disabled={submittingKey !== ""}
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
              >
                {submittingKey === "pause" ? "Pausing…" : "⏸ Pause campaign"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLaunch}
                disabled={submittingKey !== ""}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {submittingKey === "launch"
                  ? "Launching…"
                  : campaign?.status === "paused"
                    ? "▶ Resume"
                    : "▶ Launch"}
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto px-6">
          {pageTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cx(
                "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-all",
                activeTab === tab.key
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-700"
              )}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1700px] px-6 py-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <MetricCard
                icon="📤"
                label={`Total ${flowCopy.entityPluralLabel}`}
                value={totalProspects.toLocaleString()}
                sub="Campaign contact volume"
                tone="blue"
              />
              <MetricCard
                icon="💬"
                label={flowCopy.replyMetricLabel}
                value={totalReplies}
                sub={`${replyRate}% reply rate`}
                tone="green"
              />
              {flowType === "ime_influencer" ? (
                <MetricCard
                  icon="🧵"
                  label={flowCopy.pipelineMetricLabel}
                  value={pipelineValue}
                  sub="Owned directly by IME"
                  tone={flowCopy.pipelineTone}
                />
              ) : (
                <MetricCard
                  icon="✅"
                  label="Qualified"
                  value={totalQualified}
                  sub="Approved in standard flow"
                  tone="violet"
                />
              )}
              <MetricCard
                icon="📌"
                label={flowType === "ime_influencer" ? "Active Flow Owner" : "Assigned to BME"}
                value={flowType === "ime_influencer" ? getAdminLabel(campaign?.IMEId) : totalAssigned}
                sub={flowType === "ime_influencer" ? "Direct IME ownership" : "Routed after RH review"}
                tone={flowType === "ime_influencer" ? "fuchsia" : "amber"}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Card>
                <SectionHeader title="Campaign Details" description={flowCopy.campaignDescription} />
                <div className="grid gap-3 sm:grid-cols-2">
                  {flowType === "ime_influencer" ? (
                    <>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">IME</p>
                        <p className="mt-1 break-all text-sm font-medium text-slate-800">{getAdminLabel(campaign?.IMEId)}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">IME Mailbox</p>
                        <p className="mt-1 break-all text-sm font-medium text-slate-800">{campaign?.teamMailboxes?.IMEEmail || "—"}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">SDR</p>
                        <p className="mt-1 break-all text-sm font-medium text-slate-800">{getAdminLabel(campaign?.sdrId)}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Revenue Head</p>
                        <p className="mt-1 break-all text-sm font-medium text-slate-800">{getAdminLabel(campaign?.RHId)}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">RH Mailbox</p>
                        <p className="mt-1 break-all text-sm font-medium text-slate-800">{campaign?.teamMailboxes?.RHEmail || "—"}</p>
                      </div>
                    </>
                  )}

                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Primary Sender</p>
                    <p className="mt-1 break-all text-sm font-medium text-slate-800">{senderLabel}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Created</p>
                    <p className="mt-1 break-all text-sm font-medium text-slate-800">{formatDate(campaign?.createdAt)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Launched</p>
                    <p className="mt-1 break-all text-sm font-medium text-slate-800">{formatDate(campaign?.launchedAt)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Instantly Campaign ID</p>
                    <p className="mt-1 break-all text-sm font-medium text-slate-800">{campaign?.instantly?.campaignId || "—"}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Last Synced</p>
                    <p className="mt-1 break-all text-sm font-medium text-slate-800">{formatDateTime(configuration.lastSyncedAt)}</p>
                  </div>
                </div>
              </Card>

              <Card>
                <SectionHeader title="Flow Snapshot" description="Based on loaded campaign contacts" />
                <div className="space-y-3">
                  {[
                    { label: "New", value: stageCounts.new, color: "bg-slate-400" },
                    { label: "Replied", value: stageCounts.replied, color: "bg-blue-500" },
                    flowType === "ime_influencer"
                      ? { label: "Assigned to IME", value: stageCounts.assignedToIme, color: "bg-fuchsia-500" }
                      : { label: "Qualified", value: stageCounts.qualified, color: "bg-emerald-500" },
                    flowType === "ime_influencer"
                      ? { label: "Unqualified", value: stageCounts.unqualified, color: "bg-rose-500" }
                      : { label: "Assigned to BME", value: stageCounts.assignedToBme || totalAssigned, color: "bg-violet-500" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="font-semibold text-slate-900">{item.value}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={cx("h-full rounded-full", item.color)}
                          style={{ width: `${contacts.length ? (item.value / contacts.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "contacts" && (
          <div className="space-y-6">
            <div className="grid gap-5 xl:grid-cols-3">
              <Card>
                <SectionHeader title="Upload CSV" description={`Bulk import ${flowCopy.entityPluralLabel.toLowerCase()} from a structured file`} />
                <div className="space-y-3">
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 transition hover:border-blue-300 hover:bg-blue-50">
                    <span className="text-2xl">📁</span>
                    <span className="text-sm font-medium text-slate-600">{csvFile ? csvFile.name : "Click to choose a CSV"}</span>
                    <span className="text-xs text-slate-400">Supports .csv files</span>
                    <input type="file" accept=".csv" className="sr-only" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
                  </label>
                  <button
                    type="button"
                    onClick={handleCsvUpload}
                    disabled={submittingKey !== "" || !csvFile}
                    className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40"
                  >
                    {submittingKey === "csv" ? "Uploading…" : "Upload CSV"}
                  </button>
                </div>
              </Card>

              <Card>
                <SectionHeader title="Manual Entry" description={flowCopy.contactsTabDescription} />
                <div className="space-y-3">
                  <input
                    value={manualForm.entityName}
                    onChange={(e) => setManualForm((prev) => ({ ...prev, entityName: e.target.value }))}
                    placeholder={`${flowCopy.entityLabel} name`}
                    className={inputClassName}
                  />
                  <input
                    value={manualForm.contactName}
                    onChange={(e) => setManualForm((prev) => ({ ...prev, contactName: e.target.value }))}
                    placeholder={`${flowCopy.contactLabel} name`}
                    className={inputClassName}
                  />
                  <input
                    value={manualForm.contactEmail}
                    onChange={(e) => setManualForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
                    placeholder={`${flowCopy.contactLabel} email`}
                    className={inputClassName}
                  />
                  <button
                    type="button"
                    onClick={handleManualAdd}
                    disabled={submittingKey !== ""}
                    className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submittingKey === "manual" ? "Adding…" : `Add ${flowCopy.entityLabel}`}
                  </button>
                </div>
              </Card>

              <Card>
                <SectionHeader title="Google Sheets" description={`Paste a sheet URL to import ${flowCopy.entityPluralLabel.toLowerCase()}`} />
                <div className="space-y-3">
                  <textarea
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    rows={5}
                    className={cx(inputClassName, "resize-y")}
                  />
                  <button
                    type="button"
                    onClick={handleGoogleSheetImport}
                    disabled={submittingKey !== ""}
                    className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submittingKey === "sheet" ? "Importing…" : "Import Sheet"}
                  </button>
                </div>
              </Card>
            </div>

            <Card>
              <SectionHeader title={`${flowCopy.entityPluralLabel} in Campaign`} description={`${contacts.length} contacts loaded`} />
              <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
                <MetricCard icon="👥" label={`Loaded ${flowCopy.entityPluralLabel}`} value={contacts.length} tone="blue" />
                <MetricCard icon="💬" label="Replied" value={stageCounts.replied} tone="green" />
                {flowType === "ime_influencer" ? (
                  <MetricCard icon="🧵" label="Assigned to IME" value={stageCounts.assignedToIme} tone="fuchsia" />
                ) : (
                  <MetricCard icon="✅" label="Qualified" value={stageCounts.qualified} tone="violet" />
                )}
                <MetricCard
                  icon="📌"
                  label={flowType === "ime_influencer" ? "Unqualified" : "Assigned to BME"}
                  value={flowType === "ime_influencer" ? stageCounts.unqualified : stageCounts.assignedToBme || totalAssigned}
                  tone={flowType === "ime_influencer" ? "amber" : "amber"}
                />
              </div>

              <AdminTable
                data={contacts}
                columns={contactColumns}
                rowKey={(row) => row._id}
                loading={loading}
                emptyTitle={loading ? "Loading contacts..." : "No contacts added"}
                emptyDescription={`Use CSV upload, manual entry, or Google Sheets import for ${flowCopy.entityPluralLabel.toLowerCase()}.`}
              />
            </Card>
          </div>
        )}

        {activeTab === "sequence" && (
          <div className="space-y-6">
            <Card>
              <SectionHeader
                title="Email Sequence"
                description={flowCopy.sequenceDescription}
                action={
                  <button
                    type="button"
                    onClick={addSequenceStep}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
                  >
                    + Add Step
                  </button>
                }
              />

              <div className="space-y-4">
                {configuration.sequences.map((step, index) => {
                  const firstVariant = step.variants[0] || { subject: "", body: "" };
                  return (
                    <div key={index} className="overflow-hidden rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                            {step.stepOrder}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Step {step.stepOrder} — Email</p>
                            <p className="text-xs text-slate-500">
                              Delay: <span className="font-medium text-slate-700">{step.delay} {step.delayUnit}</span>
                              {step.preDelay > 0 ? (
                                <>
                                  {" "}· Pre-delay: <span className="font-medium text-slate-700">{step.preDelay} {step.preDelayUnit}</span>
                                </>
                              ) : null}
                            </p>
                          </div>
                        </div>

                        {configuration.sequences.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeSequenceStep(index)}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-500 transition hover:bg-red-100"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>

                      <div className="grid gap-5 p-5 xl:grid-cols-[300px_1fr]">
                        <div>
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Timing</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="mb-1.5 block text-xs font-medium text-slate-600">Delay</label>
                              <input
                                type="number"
                                value={step.delay}
                                onChange={(e) => updateStep(index, { delay: Number(e.target.value || 0) })}
                                className={inputClassName}
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-xs font-medium text-slate-600">Unit</label>
                              <select
                                value={step.delayUnit}
                                onChange={(e) => updateStep(index, { delayUnit: e.target.value as CampaignSequenceStep["delayUnit"] })}
                                className={inputClassName}
                              >
                                <option value="minutes">Minutes</option>
                                <option value="hours">Hours</option>
                                <option value="days">Days</option>
                              </select>
                            </div>
                            <div>
                              <label className="mb-1.5 block text-xs font-medium text-slate-600">Pre-Delay</label>
                              <input
                                type="number"
                                value={step.preDelay}
                                onChange={(e) => updateStep(index, { preDelay: Number(e.target.value || 0) })}
                                className={inputClassName}
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-xs font-medium text-slate-600">Unit</label>
                              <select
                                value={step.preDelayUnit}
                                onChange={(e) => updateStep(index, { preDelayUnit: e.target.value as CampaignSequenceStep["preDelayUnit"] })}
                                className={inputClassName}
                              >
                                <option value="minutes">Minutes</option>
                                <option value="hours">Hours</option>
                                <option value="days">Days</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Message</p>
                          <div className="space-y-3">
                            <div>
                              <label className="mb-1.5 block text-xs font-medium text-slate-600">Subject</label>
                              <input
                                value={firstVariant.subject}
                                onChange={(e) => updateVariant(index, { subject: e.target.value })}
                                placeholder="Subject line…"
                                className={inputClassName}
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-xs font-medium text-slate-600">Body</label>
                              <textarea
                                value={firstVariant.body}
                                onChange={(e) => updateVariant(index, { body: e.target.value })}
                                rows={7}
                                placeholder="Email body…"
                                className={cx(inputClassName, "resize-y")}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
              <div className="space-y-4">
                <Card className="p-4">
                  <div className="space-y-4">
                    <div className="rounded-lg border-b border-slate-100 pb-4">
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

                    <div>
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
                      {!configuration.schedule.endDate ? (
                        <p className="mt-2 text-xs text-blue-600">No end date</p>
                      ) : null}
                    </div>
                  </div>
                </Card>

                <div className="space-y-3">
                  {scheduleWindows.map((windowItem, index) => (
                    <button
                      key={`${windowItem.name}-${index}`}
                      type="button"
                      onClick={() => setSelectedScheduleIndex(index)}
                      className={cx(
                        "w-full rounded-xl border px-4 py-4 text-left transition",
                        selectedScheduleIndex === index
                          ? "border-blue-500 bg-white shadow-sm ring-1 ring-blue-500"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{windowItem.name || `Schedule ${index + 1}`}</p>
                          <p className="mt-1 text-xs text-slate-500">{windowItem.from} - {windowItem.to}</p>
                          <p className="mt-2 text-xs text-slate-400">{getWindowDaySummary(windowItem.days)}</p>
                        </div>
                        <span className={cx("mt-1 h-2.5 w-2.5 rounded-full", selectedScheduleIndex === index ? "bg-blue-600" : "bg-slate-200")} />
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addScheduleWindow}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-50"
                >
                  Add schedule
                </button>
              </div>

              <div className="space-y-5">
                <Card>
                  <SectionHeader
                    title="Schedule Name"
                    description="Set a title for the selected schedule window"
                    action={
                      scheduleWindows.length > 1 ? (
                        <button
                          type="button"
                          onClick={removeActiveScheduleWindow}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                        >
                          Remove schedule
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
                </Card>

                <Card>
                  <SectionHeader title="Timing" description="Choose the active send window and timezone" />
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
                        value={selectedTimezoneOption}
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
                        formatOptionLabel={(option) => (
                          <div className="py-0.5">
                            <div className="font-medium text-slate-800">{option.label}</div>
                            {(option.offsetLabel || option.nowLocal) && (
                              <div className="mt-0.5 text-xs text-slate-500">
                                {option.offsetLabel ? `UTC ${option.offsetLabel}` : ""}
                                {option.offsetLabel && option.nowLocal ? " • " : ""}
                                {option.nowLocal ? option.nowLocal : ""}
                              </div>
                            )}
                          </div>
                        )}
                        styles={{
                          control: (base, state) => ({
                            ...base,
                            minHeight: 44,
                            borderRadius: 8,
                            borderColor: state.isFocused ? "#60a5fa" : "#e2e8f0",
                            boxShadow: state.isFocused ? "0 0 0 2px #dbeafe" : "none",
                            "&:hover": {
                              borderColor: state.isFocused ? "#60a5fa" : "#cbd5e1",
                            },
                          }),
                          valueContainer: (base) => ({
                            ...base,
                            padding: "0 10px",
                          }),
                          input: (base) => ({
                            ...base,
                            color: "#0f172a",
                          }),
                          placeholder: (base) => ({
                            ...base,
                            color: "#94a3b8",
                          }),
                          singleValue: (base) => ({
                            ...base,
                            color: "#0f172a",
                          }),
                          menu: (base) => ({
                            ...base,
                            zIndex: 50,
                            borderRadius: 12,
                            overflow: "hidden",
                          }),
                          menuList: (base) => ({
                            ...base,
                            maxHeight: 320,
                          }),
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isFocused ? "#eff6ff" : "#ffffff",
                            color: "#0f172a",
                            cursor: "pointer",
                          }),
                          indicatorSeparator: () => ({
                            display: "none",
                          }),
                        }}
                      />
                    </div>
                  </div>
                </Card>

                <Card>
                  <SectionHeader title="Days" description="Choose the weekdays that are active for this schedule" />
                  <div className="flex flex-wrap gap-x-8 gap-y-4">
                    {weekdayLabels.map((day) => {
                      const checked = Boolean(activeScheduleWindow?.days?.[day.key]);
                      return (
                        <label key={day.key} className="flex min-w-[130px] items-center gap-3 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleActiveScheduleDay(day.key)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          {day.full}
                        </label>
                      );
                    })}
                  </div>
                </Card>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSaveConfiguration(false)}
                    disabled={submittingKey !== ""}
                    className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submittingKey === "save-config" ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveConfiguration(true)}
                    disabled={submittingKey !== ""}
                    className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    {submittingKey === "save-sync" ? "Saving…" : "Save & Sync"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1fr]">
              <Card>
                <SectionHeader title="Sending Limits" description="Control throughput and rate safeguards" />
                <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                  {[
                    ["dailyLimit", "Daily Limit"],
                    ["dailyMaxLeads", "Daily Max Leads"],
                    ["emailGap", "Email Gap (min)"],
                    ["randomWaitMax", "Random Wait Max (min)"],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <label className="mb-1.5 block text-xs font-medium text-slate-600">{label}</label>
                      <input
                        type="number"
                        value={(configuration.sendingOptions as any)[key]}
                        onChange={(e) => updateSendingOption(key as keyof SendingOptions, Number(e.target.value || 0))}
                        className={inputClassName}
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card>
              <SectionHeader title="Behavior & Tracking" description="Fine-tune delivery guardrails and tracking options" />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Toggle
                  label="Stop on Reply"
                  description="Prevent follow-ups after a contact replies"
                  checked={configuration.sendingOptions.stopOnReply}
                  onChange={(value) => updateSendingOption("stopOnReply", value)}
                />
                <Toggle
                  label="Stop on Auto Reply"
                  description="Pause for vacation or OOO messages"
                  checked={configuration.sendingOptions.stopOnAutoReply}
                  onChange={(value) => updateSendingOption("stopOnAutoReply", value)}
                />
                <Toggle
                  label="Link Tracking"
                  description="Track link clicks inside emails"
                  checked={configuration.sendingOptions.linkTracking}
                  onChange={(value) => updateSendingOption("linkTracking", value)}
                />
                <Toggle
                  label="Open Tracking"
                  description="Track email open events"
                  checked={configuration.sendingOptions.openTracking}
                  onChange={(value) => updateSendingOption("openTracking", value)}
                />
                <Toggle
                  label="Text Only"
                  description="Send plain-text emails without HTML"
                  checked={configuration.sendingOptions.textOnly}
                  onChange={(value) => updateSendingOption("textOnly", value)}
                />
                <Toggle
                  label="First Email Text Only"
                  description="Only the first step is sent as plain text"
                  checked={configuration.sendingOptions.firstEmailTextOnly}
                  onChange={(value) => updateSendingOption("firstEmailTextOnly", value)}
                />
                <Toggle
                  label="Evergreen Campaign"
                  description="Continuously accept new contacts"
                  checked={configuration.sendingOptions.isEvergreen}
                  onChange={(value) => updateSendingOption("isEvergreen", value)}
                />
                <Toggle
                  label="Prioritize New Leads"
                  description="Prefer newly imported contacts"
                  checked={configuration.sendingOptions.prioritizeNewLeads}
                  onChange={(value) => updateSendingOption("prioritizeNewLeads", value)}
                />
                <Toggle
                  label="Match Lead ESP"
                  description="Try matching sender to the lead's provider"
                  checked={configuration.sendingOptions.matchLeadEsp}
                  onChange={(value) => updateSendingOption("matchLeadEsp", value)}
                />
                <Toggle
                  label="Stop for Company"
                  description="Skip company after any colleague responds"
                  checked={configuration.sendingOptions.stopForCompany}
                  onChange={(value) => updateSendingOption("stopForCompany", value)}
                />
                <Toggle
                  label="Unsubscribe Header"
                  description="Insert list-unsubscribe metadata"
                  checked={configuration.sendingOptions.insertUnsubscribeHeader}
                  onChange={(value) => updateSendingOption("insertUnsubscribeHeader", value)}
                />
                <Toggle
                  label="Allow Risky Contacts"
                  description="Send to addresses flagged as higher risk"
                  checked={configuration.sendingOptions.allowRiskyContacts}
                  onChange={(value) => updateSendingOption("allowRiskyContacts", value)}
                />
                <Toggle
                  label="Disable Bounce Protect"
                  description="Turn off automatic bounce protection"
                  checked={configuration.sendingOptions.disableBounceProtect}
                  onChange={(value) => updateSendingOption("disableBounceProtect", value)}
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => handleSaveConfiguration(true)}
                  disabled={submittingKey !== ""}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-100 disabled:opacity-50"
                >
                  {submittingKey === "save-sync" ? "Saving…" : "Save & Sync"}
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveConfiguration(false)}
                  disabled={submittingKey !== ""}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {submittingKey === "save-config" ? "Saving…" : "Save Options"}
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}