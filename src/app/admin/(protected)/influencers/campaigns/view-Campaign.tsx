"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { post } from "@/lib/api";
import { toast, ToastStyles } from "@/components/ui/toast";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

interface Campaign {
  _id?: string;
  id?: string;
  campaignId?: string;
  name: string;
  campaignName?: string;
  brandName?: string;
  appliedDate?: string | null;
  status: "pending" | "approved" | "rejected";
  startDate?: string | null;
  endDate?: string | null;
  goal?: string;
  applicantCount?: number;
  isActive?: number;
}

interface InfluencerLite {
  influencerId: string;
  name?: string;
  email?: string;
}

interface GetCampaignsResponse {
  total: number;
  page: number;
  pages: number;
  campaigns: Campaign[];
  influencer?: InfluencerLite;
}

type CampaignFilter = "all" | "approved" | "pending" | "rejected";

type ApiErrorLike = {
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

const CAMPAIGN_ROUTE_BASE = "/admin/campaigns/view?id=";
const PAGE_LIMIT = 10;

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
  const err = error as ApiErrorLike | undefined;

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

function showValidationToast(title: string, message: string) {
  toast({
    icon: "error",
    title,
    text: message,
    timer: 4000,
  });
}

function showWarningToast(title: string, message?: string) {
  toast({
    icon: "warning",
    title,
    text: message,
    timer: 3500,
  });
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const dt = new Date(value);

  if (Number.isNaN(dt.getTime())) return "-";

  return dt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getCampaignDisplayId(campaign: Campaign, index: number) {
  return campaign._id ?? campaign.id ?? campaign.campaignId ?? `campaign-${index}`;
}

function getCampaignRouteId(campaign: Campaign) {
  return campaign.campaignId ?? campaign.id ?? campaign._id ?? "";
}

function getCampaignName(campaign: Campaign) {
  return campaign.name || campaign.campaignName || "Unnamed Campaign";
}

function getStatusClass(status?: Campaign["status"]) {
  const map: Record<Campaign["status"], string> = {
    approved: "text-green-600",
    pending: "text-yellow-600",
    rejected: "text-red-600",
  };

  return status ? map[status] || "text-gray-600" : "text-gray-600";
}

export default function InfluencerCampaignsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const influencerId = params.get("influencerId");

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filter, setFilter] = useState<CampaignFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [influencerName, setInfluencerName] = useState("");
  const [influencerEmail, setInfluencerEmail] = useState("");

  useEffect(() => {
    if (!influencerId) {
      const message = "Missing influencer ID in the URL.";

      setCampaigns([]);
      setError(message);
      setLoading(false);
      setPages(1);
      setTotal(0);
      setInfluencerName("");
      setInfluencerEmail("");

      showValidationToast(
        "Missing influencer ID",
        "Please open this page with a valid influencerId."
      );

      return;
    }

    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data = await post<GetCampaignsResponse>(
          "/admin/campaign/getByInfluencerId",
          {
            influencerId,
            page,
            limit: PAGE_LIMIT,
            search: "",
            sortBy: "createdAt",
            sortOrder: "desc",
            status: "all",
          }
        );

        if (!isMounted) return;

        setCampaigns(Array.isArray(data?.campaigns) ? data.campaigns : []);
        setPages(data?.pages || 1);
        setTotal(data?.total || 0);

        if (data?.influencer) {
          setInfluencerName(data.influencer.name ?? "");
          setInfluencerEmail(data.influencer.email ?? "");
        } else {
          setInfluencerName("");
          setInfluencerEmail("");
        }
      } catch (err) {
        if (!isMounted) return;

        const message = getErrorMessage(err, "Failed to load campaigns.");

        setCampaigns([]);
        setError(message);
        setPages(1);
        setTotal(0);
        setInfluencerName("");
        setInfluencerEmail("");

        showErrorToast(
          "Campaigns loading failed",
          err,
          "Failed to load campaigns."
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [influencerId, page]);

  useEffect(() => {
    if (page > pages) {
      setPage(Math.max(1, pages));
    }
  }, [page, pages]);

  const filtered = useMemo(() => {
    if (filter === "all") return campaigns;

    return campaigns.filter((campaign) => campaign.status === filter);
  }, [campaigns, filter]);

  const headingName =
    influencerName?.trim() || influencerEmail?.trim() || influencerId || "Influencer";

  const handleCampaignClick = (campaign: Campaign) => {
    const campaignRouteId = getCampaignRouteId(campaign);

    if (!campaignRouteId) {
      showWarningToast(
        "Campaign ID missing",
        "Unable to open this campaign because its ID is missing."
      );
      return;
    }

    router.push(`${CAMPAIGN_ROUTE_BASE}${campaignRouteId}`);
  };

  if (loading) {
    return (
      <>
        <ToastStyles />

        <div className="p-6">
          <p>Loading campaigns...</p>
        </div>
      </>
    );
  }

  if (error && !campaigns.length) {
    return (
      <>
        <ToastStyles />

        <div className="p-6">
          <p className="text-red-600">Error loading campaigns: {error}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <ToastStyles />

      <div className="p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Campaigns for {headingName}</h1>
          <p className="text-sm text-gray-500">
            {influencerEmail ? ` • ${influencerEmail}` : ""}
            {typeof total === "number" ? ` • ${total} total` : ""}
          </p>
        </div>

        <div className="mb-4 flex items-center space-x-2">
          <span>Show:</span>

          <Select
            value={filter}
            onValueChange={(value) => setFilter(value as CampaignFilter)}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>

            <SelectContent className="bg-white">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        {filtered.length === 0 ? (
          <div className="rounded-lg border p-6 text-sm text-gray-600">
            No campaigns to display.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Campaign</TableCell>
                <TableCell>Brand</TableCell>
                <TableCell>Applied Date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((campaign, index) => {
                const id = getCampaignDisplayId(campaign, index);
                const campaignName = getCampaignName(campaign);

                return (
                  <TableRow
                    key={id}
                    onClick={() => handleCampaignClick(campaign)}
                    className="cursor-pointer hover:bg-muted/60 transition-colors"
                  >
                    <TableCell className="text-xs text-gray-500">{id}</TableCell>

                    <TableCell className="font-medium underline-offset-2 hover:underline">
                      {campaignName}
                    </TableCell>

                    <TableCell>{campaign.brandName ?? "-"}</TableCell>

                    <TableCell>{formatDate(campaign.appliedDate)}</TableCell>

                    <TableCell
                      className={`font-medium ${getStatusClass(campaign.status)}`}
                    >
                      {campaign.status}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <div className="flex items-center justify-between mt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Previous
          </button>

          <span>
            Page {page} of {pages}
          </span>

          <button
            disabled={page >= pages}
            onClick={() =>
              setPage((currentPage) => Math.min(currentPage + 1, pages))
            }
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}