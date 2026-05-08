"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, ToastStyles } from "@/components/ui/toast";
import type { BrandDetail, BrandTab } from "./types";
import { formatDate, getOverviewTeam } from "./utils";
import { SectionCard, StatusPill } from "./shared";
import AdminTable, {
  type AdminTableColumn,
  type AdminTableExpandable,
} from "../../../components/table";

type BrandInfoRow = {
  id: string;
  field: string;
  value: React.ReactNode;
};

type TeamRow = {
  id: string;
  role: string;
  assignedUser: string;
  status: "Assigned" | "Unassigned";
};

type OnboardingStatus = "Completed" | "Skipped" | "Pending";

type OnboardingItem = {
  question: string;
  answers: string[];
};

type OnboardingMetaRow = {
  id: string;
  page: "Page 1" | "Page 2" | "Page 3" | "Profile Picture";
  status: OnboardingStatus;
  skipped: boolean;
  skippedLabel: string;
  responsesCount: number;
  updatedAt: string;
  items: OnboardingItem[];
};

type OnboardingSection = {
  page: "Page 1" | "Page 2" | "Page 3";
  skipped: boolean;
  items: OnboardingItem[];
};

type MaybePromise<T = void> = T | Promise<T>;

type BrandOverviewTabProps = {
  brand: BrandDetail;
  onTabChange: (tab: BrandTab) => MaybePromise<void>;
  onRefresh: () => MaybePromise<void>;
  onCreateCampaign: () => MaybePromise<void>;
  onAddTeam?: () => MaybePromise<void>;
  onManageTeam?: () => MaybePromise<void>;
};

type ErrorLike = {
  message?: unknown;
  error?: unknown;
  errors?: unknown;
  detail?: unknown;
  data?: unknown;
  statusText?: unknown;
  response?: {
    data?: unknown;
    statusText?: unknown;
  };
};

function normalizeErrorValue(value: unknown): string {
  if (!value) return "";

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeErrorValue(item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;

    const directMessage =
      normalizeErrorValue(objectValue.message) ||
      normalizeErrorValue(objectValue.error) ||
      normalizeErrorValue(objectValue.detail) ||
      normalizeErrorValue(objectValue.msg);

    if (directMessage) return directMessage;

    return Object.entries(objectValue)
      .map(([key, item]) => {
        const itemMessage = normalizeErrorValue(item);
        return itemMessage ? `${key}: ${itemMessage}` : "";
      })
      .filter(Boolean)
      .join(", ");
  }

  return "";
}

function getErrorMessage(error: unknown, fallback: string) {
  const err = error as ErrorLike | undefined;

  const candidates = [
    err?.response?.data,
    err?.data,
    err?.errors,
    err?.error,
    err?.detail,
    err?.message,
    err?.response?.statusText,
    err?.statusText,
    error,
  ];

  for (const candidate of candidates) {
    const message = normalizeErrorValue(candidate);
    if (message) return message;
  }

  return fallback;
}

function showErrorToast(title: string, error: unknown, fallback: string) {
  toast({
    icon: "error",
    title,
    text: getErrorMessage(error, fallback),
    timer: 4000,
  });
}

function showFrontendError(title: string, message: string) {
  toast({
    icon: "error",
    title,
    text: message,
    timer: 4000,
  });
}

function getPageStatus(
  skipped: boolean,
  items: Array<{ question: string; answers: string[] }>
): OnboardingStatus {
  if (skipped) return "Skipped";
  if (items.length > 0) return "Completed";
  return "Pending";
}

function renderStatusPill(status: OnboardingStatus | "Assigned" | "Unassigned") {
  if (status === "Completed" || status === "Assigned") {
    return <StatusPill label={status} tone="success" />;
  }

  if (status === "Skipped") {
    return <StatusPill label="Skipped" tone="danger" />;
  }

  return <StatusPill label={status} tone="warning" />;
}

function formatPlanDisplayName(value?: string) {
  const rawValue = String(value || "").trim();

  if (!rawValue || rawValue === "—") return "—";

  const normalized = rawValue.toLowerCase().replace(/[\s-]+/g, "_");

  const planNameMap: Record<string, string> = {
    free: "Free",
    basic: "Basic",
    starter: "Starter",
    standard: "Standard",
    premium: "Premium",
    pro: "Pro",
    enterprise: "Enterprise",
    fully_paid: "Fully Paid",
    fully_managed: "Fully Managed",
    active: "Active",
    expired: "Expired",
    archived: "Archived",
    monthly: "Monthly",
    annual: "Annual",
  };

  if (planNameMap[normalized]) {
    return planNameMap[normalized];
  }

  return normalized
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function safeOnboardingItems(
  items?: Array<{ question?: string; answers?: string[] }> | null
): OnboardingItem[] {
  if (!Array.isArray(items)) return [];

  return items.map((item) => ({
    question: String(item?.question || "").trim(),
    answers: Array.isArray(item?.answers)
      ? item.answers.map((answer) => String(answer || "").trim()).filter(Boolean)
      : [],
  }));
}

function BrandProfileListRow({
  field,
  value,
}: {
  field: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(120px,0.9fr)_minmax(140px,1.1fr)] items-center gap-4 border-b border-black/6 py-3.5 last:border-b-0">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-black/45">
        {field}
      </p>

      <div className="break-words text-right text-sm font-semibold leading-6 text-[#1a1a1a]">
        {value}
      </div>
    </div>
  );
}

function BrandProfileList({ rows }: { rows: BrandInfoRow[] }) {
  const leftRows = rows.slice(0, 5);
  const rightRows = rows.slice(5, 10);

  return (
    <div className="rounded-[28px] border border-black/10 bg-white px-5 py-4 shadow-sm">
      <div className="grid gap-x-10 xl:grid-cols-2">
        <div>
          {leftRows.map((row) => (
            <BrandProfileListRow
              key={row.id}
              field={row.field}
              value={row.value}
            />
          ))}
        </div>

        <div>
          {rightRows.map((row) => (
            <BrandProfileListRow
              key={row.id}
              field={row.field}
              value={row.value}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

class BrandOverviewErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);

    this.state = {
      hasError: false,
      message: "",
    };
  }

  static getDerivedStateFromError(error: unknown) {
    return {
      hasError: true,
      message: getErrorMessage(
        error,
        "Something went wrong while loading the brand overview."
      ),
    };
  }

  componentDidCatch(error: unknown) {
    showErrorToast(
      "Brand overview error",
      error,
      "Something went wrong while loading the brand overview."
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
          <p className="text-base font-black text-rose-800">
            Brand overview could not be displayed.
          </p>

          <p className="mt-1 text-sm font-semibold text-rose-700">
            {this.state.message}
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-4 rounded-full border-rose-200 bg-white text-rose-700 hover:bg-rose-100"
            onClick={() =>
              this.setState({
                hasError: false,
                message: "",
              })
            }
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function BrandOverviewTab(props: BrandOverviewTabProps) {
  return (
    <>
      <ToastStyles />

      <BrandOverviewErrorBoundary>
        <BrandOverviewTabContent {...props} />
      </BrandOverviewErrorBoundary>
    </>
  );
}

function BrandOverviewTabContent({
  brand,
  onAddTeam,
  onManageTeam,
}: BrandOverviewTabProps) {
  const [expandedOnboardingRowId, setExpandedOnboardingRowId] =
    useState<string | null>("Page 1");

  const handleSafeAction = useCallback(
    async (
      actionTitle: string,
      callback?: () => MaybePromise<void>
    ) => {
      if (!callback) {
        showFrontendError(
          `${actionTitle} unavailable`,
          "This action is not configured for this page."
        );
        return;
      }

      try {
        await callback();
      } catch (error) {
        showErrorToast(
          `${actionTitle} failed`,
          error,
          `Failed to ${actionTitle.toLowerCase()}.`
        );
      }
    },
    []
  );

  const currentPlanName = formatPlanDisplayName(
    brand.subscription?.planName || brand.planName
  );

  const teamRowsRaw = getOverviewTeam(brand);

  const onboardingSections = useMemo<OnboardingSection[]>(
    () => [
      {
        page: "Page 1",
        skipped: Boolean(brand.ispage1Skip),
        items: safeOnboardingItems(brand.page1),
      },
      {
        page: "Page 2",
        skipped: Boolean(brand.ispage2Skip),
        items: safeOnboardingItems(brand.page2),
      },
      {
        page: "Page 3",
        skipped: Boolean(brand.ispage3Skip),
        items: safeOnboardingItems(brand.page3),
      },
    ],
    [brand]
  );

  const profilePictureStatus: OnboardingStatus = brand.isProfilePicSkip
    ? "Skipped"
    : brand.profilePic
      ? "Completed"
      : "Pending";

  const onboardingMetaRows = useMemo<OnboardingMetaRow[]>(
    () => [
      ...onboardingSections.map((section) => {
        const status = getPageStatus(section.skipped, section.items);

        return {
          id: section.page,
          page: section.page,
          status,
          skipped: section.skipped,
          skippedLabel: section.skipped ? "Yes" : "No",
          responsesCount: section.items.length,
          updatedAt: status === "Pending" ? "—" : formatDate(brand.updatedAt),
          items: section.items,
        };
      }),
      {
        id: "profile-picture",
        page: "Profile Picture",
        status: profilePictureStatus,
        skipped: Boolean(brand.isProfilePicSkip),
        skippedLabel: brand.isProfilePicSkip ? "Yes" : "No",
        responsesCount: brand.profilePic ? 1 : 0,
        updatedAt:
          brand.isProfilePicSkip || brand.profilePic
            ? formatDate(brand.updatedAt)
            : "—",
        items: [],
      },
    ],
    [brand, onboardingSections, profilePictureStatus]
  );

  const brandInfoRows = useMemo<BrandInfoRow[]>(
    () => [
      {
        id: "contactName",
        field: "Contact Name",
        value: brand.name || "—",
      },
      {
        id: "email",
        field: "Contact Email",
        value: brand.email || "—",
      },
      {
        id: "proxyEmail",
        field: "Proxy Email",
        value: brand.proxyEmail || "—",
      },
      {
        id: "industry",
        field: "Industry",
        value: brand.industry || "—",
      },
      {
        id: "companySize",
        field: "Company Size",
        value: brand.companySize || "—",
      },
      {
        id: "currentPlan",
        field: "Current Plan",
        value: currentPlanName,
      },
      {
        id: "accountStatus",
        field: "Account Status",
        value: brand.subscriptionExpired
          ? "Expired"
          : formatPlanDisplayName(brand.subscription?.status || "Active"),
      },
      {
        id: "billingCycle",
        field: "Billing Cycle",
        value: formatPlanDisplayName(brand.subscription?.billingCycle || "—"),
      },
      {
        id: "subscriptionStarted",
        field: "Subscription Started",
        value: formatDate(brand.subscription?.startedAt),
      },
    ],
    [brand, currentPlanName]
  );

  const teamRows = useMemo<TeamRow[]>(
    () =>
      teamRowsRaw.map((item) => ({
        id: item.role,
        role: item.role,
        assignedUser: item.value,
        status: item.value === "Unassigned" ? "Unassigned" : "Assigned",
      })),
    [teamRowsRaw]
  );

  const commonHeaderClass =
    "text-[11px] font-black uppercase tracking-[0.14em] text-black/45";

  const onboardingMetaColumns = useMemo<AdminTableColumn<OnboardingMetaRow>[]>(
    () => [
      {
        id: "page",
        header: "Section",
        headerClassName: commonHeaderClass,
        cellClassName: "text-sm font-extrabold text-[#1a1a1a]",
        render: (row) => row.page,
      },
      {
        id: "status",
        header: "Status",
        align: "center",
        headerClassName: commonHeaderClass,
        cellClassName: "text-center",
        render: (row) => renderStatusPill(row.status),
      },
      {
        id: "skipped",
        header: "Skipped",
        align: "center",
        headerClassName: commonHeaderClass,
        cellClassName: "text-center text-sm font-semibold text-[#1a1a1a]",
        render: (row) => row.skippedLabel,
      },
      {
        id: "responsesCount",
        header: "Responses",
        align: "center",
        headerClassName: commonHeaderClass,
        cellClassName: "text-center text-sm font-semibold text-[#1a1a1a]",
        render: (row) => row.responsesCount,
      },
      {
        id: "updatedAt",
        header: "Updated",
        align: "right",
        headerClassName: commonHeaderClass,
        cellClassName: "text-right text-sm font-semibold text-black/55",
        render: (row) => row.updatedAt,
      },
    ],
    []
  );

  const teamColumns = useMemo<AdminTableColumn<TeamRow>[]>(
    () => [
      {
        id: "role",
        header: "Role",
        headerClassName: commonHeaderClass,
        cellClassName: "text-sm font-extrabold text-[#1a1a1a]",
        render: (row) => row.role,
      },
      {
        id: "assignedUser",
        header: "Assigned User",
        headerClassName: commonHeaderClass,
        cellClassName: "text-sm font-semibold text-[#1a1a1a]",
        render: (row) =>
          row.assignedUser === "Unassigned" ? (
            <span className="italic text-black/35">— Unassigned —</span>
          ) : (
            row.assignedUser
          ),
      },
      {
        id: "status",
        header: "Status",
        align: "center",
        headerClassName: commonHeaderClass,
        cellClassName: "text-center",
        render: (row) => renderStatusPill(row.status),
      },
    ],
    []
  );

  const onboardingExpandable = useMemo<AdminTableExpandable<OnboardingMetaRow>>(
    () => ({
      expandedRowId: expandedOnboardingRowId,
      onToggle: (rowId) => {
        try {
          setExpandedOnboardingRowId((prev) => (prev === rowId ? null : rowId));
        } catch (error) {
          showErrorToast(
            "Onboarding toggle failed",
            error,
            "Failed to open or close onboarding details."
          );
        }
      },
      canExpand: (row) => row.page !== "Profile Picture",
      expandedRowClassName: "bg-black/[0.02]",
      expandedCellClassName: "px-6 py-5",
      renderExpandedRow: (row) => {
        try {
          if (row.skipped) {
            return (
              <div className="rounded-2xl border border-dashed border-black/10 bg-white px-4 py-4 text-sm font-medium text-black/55">
                This onboarding page was skipped.
              </div>
            );
          }

          if (!row.items.length) {
            return (
              <div className="rounded-2xl border border-dashed border-black/10 bg-white px-4 py-4 text-sm font-medium text-black/55">
                No questions or answers are available for this page yet.
              </div>
            );
          }

          return (
            <div className="space-y-3">
              {row.items.map((item, index) => (
                <div
                  key={`${row.id}-question-${index}`}
                  className="rounded-[20px] border border-black/8 bg-white p-4"
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-black/40">
                    Question {index + 1}
                  </p>

                  <p className="mt-2 text-sm font-semibold text-[#1a1a1a]">
                    {item.question || "No question available"}
                  </p>

                  <div className="mt-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-black/40">
                      Answers
                    </p>

                    {item.answers?.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.answers.map((answer, answerIndex) => (
                          <span
                            key={`${row.id}-answer-${index}-${answerIndex}`}
                            className="inline-flex rounded-full border border-black/10 bg-black/[0.04] px-3 py-1.5 text-xs font-semibold text-[#1a1a1a]"
                          >
                            {answer}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm font-medium text-black/55">
                        No answer recorded.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        } catch (error) {
          showErrorToast(
            "Onboarding details error",
            error,
            "Failed to display onboarding details."
          );

          return (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-semibold text-rose-700">
              Failed to display onboarding details.
            </div>
          );
        }
      },
    }),
    [expandedOnboardingRowId]
  );

  return (
    <div className="space-y-5">
      <SectionCard
        title="Brand Profile"
        description="Core account, billing, and contact details."
      >
        <BrandProfileList rows={brandInfoRows} />
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Onboarding Overview"
          description="Expandable onboarding summary with questions and answers inside the admin table."
        >
          <AdminTable<OnboardingMetaRow>
            data={onboardingMetaRows}
            columns={onboardingMetaColumns}
            rowKey={(row) => row.id}
            expandable={onboardingExpandable}
            tableClassName="min-w-full"
            headerRowClassName="border-black/6"
            bodyClassName="[&_tr:last-child]:border-b-0"
            emptyTitle="No onboarding summary found"
            emptyDescription="Onboarding summary data is not available."
            rowClassName={(_, __, isExpanded) =>
              isExpanded ? "bg-black/[0.02]" : "hover:bg-black/[0.02]"
            }
          />
        </SectionCard>

        <SectionCard
          title="Assigned Team"
          description="Team ownership and assignment status managed directly from Overview."
          action={
            onAddTeam || onManageTeam ? (
              <div className="flex flex-wrap gap-2">
                {onAddTeam ? (
                  <Button
                    type="button"
                    className="rounded-full bg-[#1a1a1a] text-white shadow-sm hover:bg-black"
                    onClick={() => void handleSafeAction("Add team", onAddTeam)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Team
                  </Button>
                ) : null}

                {onManageTeam ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-black/10 bg-white text-[#1a1a1a] shadow-sm hover:bg-[#1a1a1a] hover:text-white"
                    onClick={() =>
                      void handleSafeAction("Manage team", onManageTeam)
                    }
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Manage
                  </Button>
                ) : null}
              </div>
            ) : undefined
          }
        >
          <AdminTable<TeamRow>
            data={teamRows}
            columns={teamColumns}
            rowKey={(row) => row.id}
            tableClassName="min-w-full"
            headerRowClassName="border-black/6"
            bodyClassName="[&_tr:last-child]:border-b-0"
            emptyTitle="No team members found"
            emptyDescription="No team assignments are available yet. Use Add Team to assign owners directly from Overview."
            rowClassName={() => "hover:bg-black/[0.02]"}
          />
        </SectionCard>
      </div>
    </div>
  );
}