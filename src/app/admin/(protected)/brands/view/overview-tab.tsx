"use client";

import React, { useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const rightRows = rows.slice(5, 11);

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

export function BrandOverviewTab({
  brand,
  onAddTeam,
  onManageTeam,
}: {
  brand: BrandDetail;
  onTabChange: (tab: BrandTab) => void;
  onRefresh: () => void;
  onCreateCampaign: () => void;
  onAddTeam?: () => void;
  onManageTeam?: () => void;
}) {
  const [expandedOnboardingRowId, setExpandedOnboardingRowId] =
    useState<string | null>("Page 1");

  const currentPlanName = formatPlanDisplayName(
    brand.subscription?.planName || brand.planName
  );

  const teamRowsRaw = getOverviewTeam(brand);

  const onboardingSections = useMemo<OnboardingSection[]>(
    () => [
      {
        page: "Page 1",
        skipped: Boolean(brand.ispage1Skip),
        items: (brand.page1 || []).map((item) => ({
          question: item.question || "",
          answers: item.answers || [],
        })),
      },
      {
        page: "Page 2",
        skipped: Boolean(brand.ispage2Skip),
        items: (brand.page2 || []).map((item) => ({
          question: item.question || "",
          answers: item.answers || [],
        })),
      },
      {
        page: "Page 3",
        skipped: Boolean(brand.ispage3Skip),
        items: (brand.page3 || []).map((item) => ({
          question: item.question || "",
          answers: item.answers || [],
        })),
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
        id: "accountStatus",
        field: "Account Status",
        value: brand.subscriptionExpired
          ? "Expired"
          : formatPlanDisplayName(brand.subscription?.status || "Active"),
      },
      {
        id: "assignmentStatus",
        field: "Assignment Status",
        value:
          brand.assignmentStatus ||
          (brand.subscriptionExpired ? "Expired" : "Active"),
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
      {
        id: "subscriptionExpires",
        field: "Subscription Expires",
        value: formatDate(brand.subscription?.expiresAt || brand.expiresAt),
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
        setExpandedOnboardingRowId((prev) => (prev === rowId ? null : rowId));
      },
      canExpand: (row) => row.page !== "Profile Picture",
      expandedRowClassName: "bg-black/[0.02]",
      expandedCellClassName: "px-6 py-5",
      renderExpandedRow: (row) => {
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
          // action={
          //   <div className="flex flex-wrap gap-2">
          //     <Button
          //       className="rounded-full bg-[#1a1a1a] text-white shadow-sm hover:bg-black"
          //       onClick={onAddTeam}
          //     >
          //       <Plus className="mr-2 h-4 w-4" />
          //       Add Team
          //     </Button>

          //     <Button
          //       variant="outline"
          //       className="rounded-full border-black/10 bg-white text-[#1a1a1a] shadow-sm hover:bg-[#1a1a1a] hover:text-white"
          //       onClick={onManageTeam}
          //     >
          //       <Pencil className="mr-2 h-4 w-4" />
          //       Manage
          //     </Button>
          //   </div>
          // }
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