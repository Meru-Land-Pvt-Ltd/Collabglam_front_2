"use client";

import React, { useEffect, useMemo, useState } from "react";
import { post } from "@/lib/api";
import { DisputeTable } from "./disputesTable";
import DisputeFilters from "./disputeFilter";

export type DisputeStatus =
  | "open"
  | "in_review"
  | "awaiting_user"
  | "resolved"
  | "rejected";

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

export type Dispute = {
  disputeId: string;
  subject: string;
  description?: string;
  status: DisputeStatus;
  campaignId?: string | null;
  campaignName?: string | null;
  brandId: string;
  influencerId: string;
  assignedTo?: { adminId?: string | null; name?: string | null } | null;
  createdAt: string;
  updatedAt: string;
  attachments?: Attachment[];
  createdBy?: { id: string; role: Role };
  raisedByRole?: Role | null;
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

const PAGE_SIZE = 10;

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
    setBrandId(localStorage.getItem("brandId"));
    setBrandLoaded(true);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [status, direction]);

  const fetchDisputes = async () => {
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

      const statusNum = parseInt(status, 10);
      if (!isNaN(statusNum)) body.status = statusNum;

      if (direction === "raised_by_you") body.appliedBy = "brand";
      else if (direction === "against_you") body.appliedBy = "influencer";

      if (debouncedSearch) body.search = debouncedSearch;

      const data = await post<ListResp>("/dispute/brand/list", body);

      setRows(data.disputes || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (e: any) {
      setError(e?.message || "Failed to load disputes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!brandLoaded) return;
    fetchDisputes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandLoaded, brandId, page, status, debouncedSearch, direction]);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxButtons = 5;
    let start = Math.max(1, page - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [page, totalPages]);

  return (
    <div className="w-full mx-auto">
      <DisputeFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        direction={direction}
        onDirectionChange={setDirection}
        onDisputeCreated={fetchDisputes}
      />

      <DisputeTable
        rows={rows}
        loading={loading}
        error={error}
        onRetry={fetchDisputes}
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