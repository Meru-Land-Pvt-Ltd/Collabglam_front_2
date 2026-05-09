"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Swal from "sweetalert2";

import { Button } from "@/components/ui/button";
import { post } from "@/lib/api";
import BrandInfluencerRateReviewModal, {
  type BrandInfluencerReviewTarget,
} from "@/components/common/BrandInfluencerRateReviewModal";
import {
  apiGetDeliverablesByMilestone,
  apiUpdateDeliverableApprovalStatus,
  getApiErrorMessage,
  type DeliverableRow,
} from "@/app/brand/services/brandApi";

type DeliverableUrl = {
  label?: string;
  url?: string;
};

type Deliverable = DeliverableRow & {
  _id?: string;
  delieverableApprovalId?: string;
  deliverableApprovalId?: string;

  title?: string;
  description?: string;
  comments?: string;
  status?: string;
  createdAt?: string;
  milestoneTitle?: string;
  influencerName?: string;
  campaignTitle?: string;

  link?: string;
  fileUrl?: string;
  url?: DeliverableUrl[];

  campaignId?: string;
  brandId?: string;
  influencerId?: string;

  campaign?: {
    _id?: string;
    campaignId?: string;
    campaignsId?: string;
    title?: string;
    name?: string;
    campaignTitle?: string;
    productOrServiceName?: string;
  };

  brand?: {
    _id?: string;
    brandId?: string;
    name?: string;
    brandName?: string;
  };

  influencer?: {
    _id?: string;
    influencerId?: string;
    name?: string;
    fullName?: string;
    influencerName?: string;
    username?: string;
    avatarUrl?: string;
    picture?: string;
  };

  modashProfile?: {
    picture?: string;
  };

  modashProfiles?: Array<{
    picture?: string;
  }>;
};

type PromptStateResponse = {
  success?: boolean;
  message?: string;
  data?: {
    shouldPrompt?: boolean;
    reason?: string;
    review?: {
      _id?: string;
      reviewRequestId?: string;
      status?: string;
      rating?: number;
      submittedAt?: string;
      firstSubmittedAt?: string;
      skippedAt?: string;
      reviewUpdateCount?: number;
    } | null;
  };
};

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return "-";

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const badgeClass = (status?: string) => {
  const value = String(status || "").toLowerCase();

  if (value === "approved" || value === "paid") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (value === "pending") {
    return "border border-amber-200 bg-amber-50 text-amber-700";
  }

  if (value === "revision") {
    return "border border-sky-200 bg-sky-50 text-sky-700";
  }

  if (value === "rejected") {
    return "border border-red-200 bg-red-50 text-red-700";
  }

  return "border border-slate-200 bg-slate-50 text-slate-700";
};

const firstValue = (...values: unknown[]) => {
  for (const value of values) {
    const text = String(value ?? "").trim();

    if (text) return text;
  }

  return "";
};

const getDeliverableId = (row: Deliverable) => {
  return firstValue(
    row._id,
    row.delieverableApprovalId,
    row.deliverableApprovalId
  );
};

const getDeliverableLinks = (row: Deliverable): DeliverableUrl[] => {
  const links = Array.isArray(row.url)
    ? row.url.filter((item) => item?.url)
    : [];

  if (links.length) return links;

  const fallback: DeliverableUrl[] = [];

  if (typeof row.link === "string" && row.link.trim()) {
    fallback.push({
      label: "Open link",
      url: row.link,
    });
  }

  if (typeof row.fileUrl === "string" && row.fileUrl.trim()) {
    fallback.push({
      label: "Open file",
      url: row.fileUrl,
    });
  }

  return fallback;
};

function buildReviewTargetForDeliverable({
  row,
  fallbackCampaignId,
  fallbackBrandId,
  fallbackInfluencerId,
}: {
  row: Deliverable;
  fallbackCampaignId: string;
  fallbackBrandId: string;
  fallbackInfluencerId: string;
}): BrandInfluencerReviewTarget | null {
  const deliverableId = getDeliverableId(row);

  const resolvedCampaignId = firstValue(
    row.campaignId,
    row.campaign?._id,
    row.campaign?.campaignId,
    row.campaign?.campaignsId,
    fallbackCampaignId
  );

  const resolvedBrandId = firstValue(
    row.brandId,
    row.brand?._id,
    row.brand?.brandId,
    fallbackBrandId
  );

  const resolvedInfluencerId = firstValue(
    row.influencerId,
    row.influencer?._id,
    row.influencer?.influencerId,
    fallbackInfluencerId
  );

  if (!resolvedCampaignId || !resolvedBrandId || !resolvedInfluencerId) {
    return null;
  }

  const influencerName = firstValue(
    row.influencerName,
    row.influencer?.name,
    row.influencer?.fullName,
    row.influencer?.influencerName,
    row.influencer?.username,
    "Influencer"
  );

  const influencerAvatarUrl = firstValue(
    row.influencer?.avatarUrl,
    row.influencer?.picture,
    row.modashProfile?.picture,
    row.modashProfiles?.[0]?.picture
  );

  const campaignTitle = firstValue(
    row.campaignTitle,
    row.campaign?.campaignTitle,
    row.campaign?.productOrServiceName,
    row.campaign?.title,
    row.campaign?.name
  );

  return {
    campaignId: resolvedCampaignId,
    brandId: resolvedBrandId,
    influencerId: resolvedInfluencerId,
    influencerName,
    influencerAvatarUrl,
    campaignTitle,
    sourceEntityType: "deliverable",
    sourceEntityId: deliverableId,
  };
}

export default function DeliverablesPage() {
  const searchParams = useSearchParams();

  const campaignId = useMemo(
    () => searchParams.get("campaignId") || "",
    [searchParams]
  );

  const brandId = useMemo(
    () => searchParams.get("brandId") || "",
    [searchParams]
  );

  const influencerId = useMemo(
    () => searchParams.get("influencerId") || "",
    [searchParams]
  );

  const milestoneId = useMemo(
    () => searchParams.get("milestoneId") || "",
    [searchParams]
  );

  const statusFilter = useMemo(
    () => searchParams.get("status") || "",
    [searchParams]
  );

  const [rows, setRows] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [rateReviewOpen, setRateReviewOpen] = useState(false);
  const [rateReviewTarget, setRateReviewTarget] =
    useState<BrandInfluencerReviewTarget | null>(null);

  const closeRateReviewModal = useCallback(() => {
    setRateReviewOpen(false);
    setRateReviewTarget(null);
  }, []);

  const fetchDeliverables = useCallback(async () => {
    if (!milestoneId) {
      setError("Missing milestoneId in URL. Example: ?milestoneId=xxxx");
      setRows([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiGetDeliverablesByMilestone({
        milestoneId,
        ...(brandId ? { brandId } : {}),
        ...(influencerId ? { influencerId } : {}),
        ...(campaignId ? { campaignId } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        page: 1,
        limit: 50,
      });

      const list = Array.isArray(response)
        ? response
        : Array.isArray((response as any)?.data)
          ? (response as any).data
          : Array.isArray((response as any)?.deliverables)
            ? (response as any).deliverables
            : Array.isArray((response as any)?.items)
              ? (response as any).items
              : [];

      setRows(list as Deliverable[]);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to fetch deliverables"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [milestoneId, brandId, influencerId, campaignId, statusFilter]);

  const openRatingModalAfterFirstApproval = useCallback(
    async (row: Deliverable) => {
      const target = buildReviewTargetForDeliverable({
        row,
        fallbackCampaignId: campaignId,
        fallbackBrandId: brandId,
        fallbackInfluencerId: influencerId,
      });

      if (!target) return;

      try {
        const response = await post<PromptStateResponse>(
          "/campaign-reviews/brand/prompt-state",
          {
            campaignId: target.campaignId,
            brandId: target.brandId,
            influencerId: target.influencerId,
            reviewType: "brand_to_influencer",
            sourceEntityType: target.sourceEntityType || "deliverable",
            sourceEntityId: target.sourceEntityId || null,
          }
        );

        if (response?.success === false) return;
        if (!response?.data?.shouldPrompt) return;

        setRateReviewTarget(target);
        setRateReviewOpen(true);
      } catch (err) {
        console.warn("Review prompt-state check failed:", err);
      }
    },
    [campaignId, brandId, influencerId]
  );

  const updateDeliverableStatus = useCallback(
    async (
      row: Deliverable,
      status: "approved" | "revision",
      comments?: string
    ) => {
      const deliverableId = getDeliverableId(row);

      if (!deliverableId) {
        await Swal.fire({
          icon: "error",
          title: "Missing deliverable id",
          text: "This row does not have a valid deliverable id.",
          showConfirmButton: false,
          timer: 1800,
          timerProgressBar: true,
        });
        return;
      }

      const oldStatus = String(row.status || "").toLowerCase();

      const isFirstTimeApproval =
        status === "approved" && oldStatus !== "approved";

      try {
        setUpdatingId(deliverableId);

        await apiUpdateDeliverableApprovalStatus({
          deliverableId,
          status,
          comments,
          approvedRole: "Brand",
        });

        await Swal.fire({
          icon: "success",
          title: status === "approved" ? "Approved" : "Revision Sent",
          text:
            status === "approved"
              ? "Deliverable approved successfully."
              : "Revision request sent successfully.",
          showConfirmButton: false,
          timer: 1200,
          timerProgressBar: true,
        });

        await fetchDeliverables();

        if (isFirstTimeApproval) {
          await openRatingModalAfterFirstApproval(row);
        }
      } catch (err) {
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: getApiErrorMessage(
            err,
            "Failed to update deliverable status"
          ),
          showConfirmButton: false,
          timer: 1800,
          timerProgressBar: true,
        });
      } finally {
        setUpdatingId(null);
      }
    },
    [fetchDeliverables, openRatingModalAfterFirstApproval]
  );

  const approveDeliverable = useCallback(
    async (row: Deliverable) => {
      await updateDeliverableStatus(row, "approved");
    },
    [updateDeliverableStatus]
  );

  const sendRevision = useCallback(
    async (row: Deliverable) => {
      const result = await Swal.fire({
        title: "Send for revision?",
        input: "textarea",
        inputLabel: "Comments",
        inputPlaceholder: "Write what needs to be changed...",
        showCancelButton: true,
        confirmButtonText: "Send Revision",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#0f172a",
      });

      if (!result.isConfirmed) return;

      const comments =
        typeof result.value === "string" ? result.value : undefined;

      await updateDeliverableStatus(row, "revision", comments);
    },
    [updateDeliverableStatus]
  );

  const skipReviewOnBackend = useCallback(async () => {
    if (!rateReviewTarget) return;

    await post("/campaign-reviews/brand/skip", {
      campaignId: rateReviewTarget.campaignId,
      brandId: rateReviewTarget.brandId,
      influencerId: rateReviewTarget.influencerId,
      reviewType: "brand_to_influencer",
      sourceEntityType: rateReviewTarget.sourceEntityType || "deliverable",
      sourceEntityId: rateReviewTarget.sourceEntityId || null,
      skipReason: "Brand skipped after first deliverable approval",
    });
  }, [rateReviewTarget]);

  useEffect(() => {
    fetchDeliverables();
  }, [fetchDeliverables]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-6">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Deliverables
              </h1>

              <p className="text-sm text-slate-500">
                Review submissions, approve completed work, or send items back
                for revision.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {statusFilter ? (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                  Filter: {statusFilter}
                </span>
              ) : null}

              <Button
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-100"
                onClick={fetchDeliverables}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-700">
              Loading deliverables...
            </div>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-red-600">{error}</p>

            <div className="mt-4">
              <Button
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={fetchDeliverables}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : null}

        {!loading && !error && rows.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">No deliverables found.</p>
          </div>
        ) : null}

        {!loading && !error && rows.length > 0 ? (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-5 py-4 text-left font-semibold">
                      Deliverable
                    </th>
                    <th className="px-5 py-4 text-left font-semibold">
                      Milestone
                    </th>
                    <th className="px-5 py-4 text-left font-semibold">
                      Influencer
                    </th>
                    <th className="px-5 py-4 text-left font-semibold">
                      Status
                    </th>
                    <th className="px-5 py-4 text-left font-semibold">
                      Links
                    </th>
                    <th className="px-5 py-4 text-left font-semibold">
                      Created
                    </th>
                    <th className="px-5 py-4 text-left font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => {
                    const rowId = getDeliverableId(row);
                    const status = String(row.status || "").toLowerCase();

                    const isApproved = status === "approved";
                    const isRevision = status === "revision";
                    const isUpdating = updatingId === rowId;
                    const isLocked = isApproved || isRevision;

                    const links = getDeliverableLinks(row);

                    return (
                      <tr
                        key={rowId}
                        className="transition-colors hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4 align-top">
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-900">
                              {row.title || "-"}
                            </div>

                            <div className="line-clamp-2 max-w-[340px] text-slate-600">
                              {row.description || "-"}
                            </div>

                            {row.comments ? (
                              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                <span className="font-semibold text-slate-700">
                                  Comment:
                                </span>{" "}
                                {row.comments}
                              </div>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-5 py-4 align-top text-slate-700">
                          <div className="line-clamp-2 max-w-[220px]">
                            {row.milestoneTitle || "-"}
                          </div>
                        </td>

                        <td className="px-5 py-4 align-top text-slate-700">
                          {row.influencerName || row.influencer?.name || "-"}
                        </td>

                        <td className="px-5 py-4 align-top">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(
                              row.status
                            )}`}
                          >
                            {row.status || "-"}
                          </span>
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div className="flex max-w-[220px] flex-col gap-2">
                            {links.length === 0 ? (
                              <span className="text-slate-400">-</span>
                            ) : (
                              links.map((link, index) => (
                                <a
                                  key={`${rowId}-link-${index}`}
                                  href={link.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="truncate text-sm font-medium text-slate-900 underline underline-offset-4 hover:text-slate-600"
                                >
                                  {link.label || `Open link ${index + 1}`}
                                </a>
                              ))
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 align-top text-slate-600">
                          {formatDateTime(row.createdAt)}
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div className="flex min-w-[190px] flex-col gap-2">
                            <Button
                              className="bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
                              disabled={isLocked || isUpdating || !rowId}
                              onClick={() => approveDeliverable(row)}
                            >
                              {isApproved
                                ? "Approved"
                                : isRevision
                                  ? "Approve Locked"
                                  : isUpdating
                                    ? "Updating..."
                                    : "Approve"}
                            </Button>

                            <Button
                              variant="outline"
                              className="border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                              disabled={isLocked || isUpdating || !rowId}
                              onClick={() => sendRevision(row)}
                            >
                              {isApproved
                                ? "Revision Locked"
                                : isRevision
                                  ? "Revision Sent"
                                  : isUpdating
                                    ? "Updating..."
                                    : "Request Revision"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>

      <BrandInfluencerRateReviewModal
        open={rateReviewOpen}
        target={rateReviewTarget}
        onClose={closeRateReviewModal}
        onSkipped={async () => {
          try {
            await skipReviewOnBackend();

            await Swal.fire({
              icon: "info",
              title: "Review skipped",
              showConfirmButton: false,
              timer: 1200,
              timerProgressBar: true,
            });
          } catch (err) {
            await Swal.fire({
              icon: "error",
              title: "Could not skip review",
              text: getApiErrorMessage(err, "Failed to skip review"),
              showConfirmButton: false,
              timer: 1800,
              timerProgressBar: true,
            });
          }
        }}
        onSubmitted={async () => {
          await Swal.fire({
            icon: "success",
            title: "Review submitted",
            showConfirmButton: false,
            timer: 1200,
            timerProgressBar: true,
          });

          await fetchDeliverables();
        }}
      />
    </div>
  );
}