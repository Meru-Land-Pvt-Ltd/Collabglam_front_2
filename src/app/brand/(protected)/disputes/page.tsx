"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { post } from "@/lib/api";
import { DisputeTable } from "@/components/common/disputes/disputesTable";
import DisputeFilters from "@/components/common/disputes/disputeFilter";

export type DisputeStatus =
  | "open"
  | "in_review"
  | "awaiting_user"
  | "evidence_submitted"
  | "in_negotiation"
  | "resolution_proposed"
  | "resolved"
  | "rejected"
  | "revoked";

export type Role = "Admin" | "Brand" | "Influencer";

export type DisputeParty = {
  role: "Brand" | "Influencer";
  id: string;
  name?: string | null;
  handle?: string | null;
  provider?: string | null;
};

export type Attachment = {
  url: string;
  originalName?: string | null;
  mimeType?: string | null;
  size?: number | null;
};

export type Comment = {
  commentId: string;
  authorRole: Role;
  authorId: string;
  text: string;
  createdAt: string;
  attachments?: Attachment[];
};

export type AssignedAdmin = {
  adminId?: string | null;
  name?: string | null;
};

export type Dispute = {
  disputeId: string;
  subject: string;
  description: string;
  status: DisputeStatus;
  priority?: string;
  campaignId?: string | null;
  campaignName?: string | null;
  brandId: string;
  influencerId: string;
  issueType?: string[];
  assignedTo?: AssignedAdmin | null;
  comments: Comment[];
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
  raisedByRole?: string | null;
  raisedById?: string | null;
  raisedBy?: DisputeParty | null;
  raisedAgainst?: DisputeParty | null;
  viewerIsRaiser?: boolean;
};

type ListResp = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  disputes: Dispute[];
};

type ApiErrorShape = {
  response?: {
    data?: {
      message?: unknown;
    };
  };
  message?: unknown;
};

const PAGE_SIZE = 10;

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== "object" || error === null) {
    return fallback;
  }

  const candidate = error as ApiErrorShape;

  if (typeof candidate.response?.data?.message === "string") {
    return candidate.response.data.message;
  }

  if (typeof candidate.message === "string") {
    return candidate.message;
  }

  return fallback;
}

const BrandDisputesPage: React.FC = () => {
  const [brandId, setBrandId] = useState<string | null>(null);
  const [brandLoaded, setBrandLoaded] = useState(false);

  const [status, setStatus] = useState<string>("0");
  const [direction, setDirection] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [rows, setRows] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setBrandId(window.localStorage.getItem("brandId"));
    setBrandLoaded(true);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [status, direction]);

  const fetchDisputes = useCallback(async (): Promise<void> => {
    if (!brandLoaded) return;

    if (!brandId) {
      setError("Brand ID not found. Please log in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        brandId,
        page,
        limit: PAGE_SIZE,
      };

      const statusNum = Number.parseInt(status, 10);
      if (!Number.isNaN(statusNum) && statusNum > 0) {
        body.status = statusNum;
      }

      if (direction === "raised_by_you") {
        body.appliedBy = "brand";
      } else if (direction === "against_you") {
        body.appliedBy = "influencer";
      }

      if (debouncedSearch) {
        body.search = debouncedSearch;
      }

      const data = await post<ListResp>("/dispute/brand/list", body);

      setRows(data.disputes || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (fetchError: unknown) {
      setError(getErrorMessage(fetchError, "Failed to load disputes."));
    } finally {
      setLoading(false);
    }
  }, [brandLoaded, brandId, page, status, direction, debouncedSearch]);

  useEffect(() => {
    if (!brandLoaded) return;
    void fetchDisputes();
  }, [brandLoaded, fetchDisputes]);

  const handleDisputeCreated = useCallback(() => {
    if (page !== 1) {
      setPage(1);
      return;
    }

    void fetchDisputes();
  }, [page, fetchDisputes]);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxButtons = 5;

    let start = Math.max(1, page - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);

    start = Math.max(1, end - maxButtons + 1);

    for (let current = start; current <= end; current += 1) {
      pages.push(current);
    }

    return pages;
  }, [page, totalPages]);

  return (
    <div className="mx-auto w-full min-w-0 overflow-hidden">
      <Suspense fallback={<div>Loading filters...</div>}>
        <DisputeFilters
          mode="brand"
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          direction={direction}
          onDirectionChange={setDirection}
          onDisputeCreated={handleDisputeCreated}
        />
      </Suspense>

      <DisputeTable
        rows={rows}
        loading={loading}
        error={error}
        onRetry={() => {
          void fetchDisputes();
        }}
        brandId={brandId}
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        pageNumbers={pageNumbers}
        onPageChange={setPage}
      />
    </div>
  );
};

export default BrandDisputesPage;