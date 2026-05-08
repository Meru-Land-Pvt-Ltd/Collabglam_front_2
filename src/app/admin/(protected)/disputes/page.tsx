"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { post } from "@/lib/api";
import { toast, ToastStyles } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ImageOff,
} from "lucide-react";
import { GavelIcon } from "@phosphor-icons/react";

type Comment = {
  commentId: string;
  authorRole: "Admin" | "Brand" | "Influencer";
  authorId: string;
  text: string;
  createdAt: string;
};

type DisputeStatus =
  | "open"
  | "in_review"
  | "awaiting_user"
  | "resolved"
  | "rejected"
  | "revoked";

type Attachment = {
  url: string;
  originalName?: string | null;
  mimeType?: string | null;
  size?: number | null;
};

type Dispute = {
  disputeId: string;
  subject: string;
  description?: string;
  status: DisputeStatus;
  campaignId: string;
  campaignName?: string | null;
  createdBy?: { id?: string; role?: "Brand" | "Influencer" };
  assignedTo?: { adminId?: string | null; name?: string | null } | null;
  comments?: Comment[];
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
};

type ListResp = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  disputes: Dispute[];
};

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

const statusOptions = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_review", label: "In Review" },
  { value: "awaiting_user", label: "Awaiting User" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
  { value: "revoked", label: "Revoked" },
];

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  in_review: "In Review",
  awaiting_user: "Awaiting User",
  resolved: "Resolved",
  rejected: "Rejected",
  revoked: "Revoked",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-50 text-blue-700 border border-blue-200",
  in_review: "bg-purple-50 text-purple-700 border border-purple-200",
  awaiting_user: "bg-amber-50 text-amber-700 border border-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  rejected: "bg-red-50 text-red-600 border border-red-200",
  revoked: "bg-gray-100 text-gray-700 border border-gray-200",
};

const pageSize = 10;

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

function showSuccessToast(title: string, message?: string) {
  toast({
    icon: "success",
    title,
    text: message,
    timer: 2500,
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

function useDebouncedValue<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

function HeaderCarets() {
  const cls = "h-3 w-3 text-[#343330]";

  return (
    <span className="ml-1 flex flex-col items-center leading-none">
      <ChevronUp className={cls} strokeWidth={3} />
      <ChevronDown className={cls} strokeWidth={3} />
    </span>
  );
}

function DisputeImage({ src }: { src?: string | null }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-[#E6E6E6] bg-gray-100">
        <ImageOff className="size-4 text-gray-300" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="Dispute"
      onError={() => setFailed(true)}
      className="h-10 w-10 flex-shrink-0 rounded-lg border border-[#E6E6E6] object-cover"
    />
  );
}

const getDisputeImageUrl = (row: Dispute) =>
  row.attachments?.find((file) => file?.mimeType?.startsWith("image/"))?.url ??
  null;

const formatDateTime = (value?: string) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStoredAdminId = () => {
  if (typeof window === "undefined") return "";

  return String(
    localStorage.getItem("adminId") ||
      localStorage.getItem("admin_id") ||
      localStorage.getItem("userId") ||
      localStorage.getItem("user_id") ||
      ""
  ).trim();
};

export default function AdminDisputesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Dispute[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [status, setStatus] = useState<string>("all");
  const [appliedBy, setAppliedBy] = useState<"all" | "Brand" | "Influencer">(
    "all"
  );

  const [searchInput, setSearchInput] = useState<string>("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        page,
        limit: pageSize,
      };

      const adminId = getStoredAdminId();

      if (adminId) {
        body.adminId = adminId;
      }

      if (status && status !== "all") body.status = status;
      if (debouncedSearch.trim()) body.search = debouncedSearch.trim();
      if (appliedBy && appliedBy !== "all") body.appliedBy = appliedBy;

      const data = await post<ListResp>("/dispute/admin/list", body);

      setRows(data.disputes || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (e) {
      const message = getErrorMessage(e, "Failed to load disputes.");
      setError(message);
      setRows([]);
      setTotalPages(1);
      setTotal(0);

      showErrorToast("Disputes loading failed", e, "Failed to load disputes.");
    } finally {
      setLoading(false);
    }
  }, [page, status, appliedBy, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setSelected(new Set());
  }, [rows]);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxButtons = 5;
    let start = Math.max(1, page - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);

    for (let i = start; i <= end; i++) pages.push(i);

    return pages;
  }, [page, totalPages]);

  const allSelected =
    rows.length > 0 && rows.every((row) => selected.has(row.disputeId));

  const toggleAll = useCallback(() => {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.disputeId)));
  }, [allSelected, rows]);

  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleSearch = useCallback(() => {
    setPage(1);

    if (!searchInput.trim()) {
      showWarningToast("Search is empty", "Enter a subject or description to search.");
      return;
    }
  }, [searchInput]);

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const col = {
    checkbox: "w-[2.75rem] shrink-0",
    title: "min-w-0 flex-[2.1_1_0%]",
    image: "w-[7rem] flex-[0_0_7rem] shrink-0",
    campaign: "min-w-0 flex-[1.2_1_0%]",
    appliedBy: "min-w-[7.5rem] flex-[0_0_7.5rem] shrink-0",
    status: "min-w-[7.5rem] flex-[0_0_7.5rem] shrink-0",
    updated: "min-w-[8.5rem] flex-[0_0_8.5rem] shrink-0",
    action: "min-w-[7rem] flex-[0_0_7rem] shrink-0",
  };

  const headerCell =
    "flex min-w-0 w-full items-center justify-between gap-2 text-sm font-semibold text-[#1A1A1A]";

  return (
    <>
      <ToastStyles />

      <div className="mx-auto max-w-[100rem] min-w-0 overflow-hidden p-6">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">All Disputes</h1>
        </div>

        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="w-full lg:w-48">
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="!h-[2.75rem] !rounded-[0.75rem] !border-[#E5E5E5] !bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>

              <SelectContent className="!rounded-[0.9rem] !border-[#E5E5E5] !bg-white">
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex h-[2.75rem] items-center gap-4 rounded-[0.75rem] border border-[#E5E5E5] bg-white px-4">
            <span className="text-sm font-medium text-[#4B4B4B]">Applied By</span>

            {(() => {
              const brandChecked = appliedBy === "Brand" || appliedBy === "all";
              const influencerChecked =
                appliedBy === "Influencer" || appliedBy === "all";

              const nextFrom = (
                brand: boolean,
                influencer: boolean
              ): typeof appliedBy =>
                (brand && influencer) || (!brand && !influencer)
                  ? "all"
                  : brand
                    ? "Brand"
                    : "Influencer";

              return (
                <>
                  <label className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                    <Checkbox
                      checked={brandChecked}
                      onCheckedChange={(val) => {
                        const brand = Boolean(val);
                        const influencer = influencerChecked;
                        setAppliedBy(nextFrom(brand, influencer));
                        setPage(1);
                      }}
                    />
                    Brand
                  </label>

                  <label className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                    <Checkbox
                      checked={influencerChecked}
                      onCheckedChange={(val) => {
                        const brand = brandChecked;
                        const influencer = Boolean(val);
                        setAppliedBy(nextFrom(brand, influencer));
                        setPage(1);
                      }}
                    />
                    Influencer
                  </label>
                </>
              );
            })()}
          </div>

          <div className="flex flex-1 gap-2">
            <Input
              placeholder="Search subject/description"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setPage(1);
              }}
              className="!h-[2.75rem] !rounded-[0.75rem] !border-[#E5E5E5] !bg-white"
            />

            <Button
              className="!h-[2.75rem] !rounded-[0.75rem] !bg-[#1A1A1A] !px-5 text-white hover:!bg-[#2A2A2A]"
              onClick={handleSearch}
            >
              Search
            </Button>
          </div>
        </div>

        <div className="w-full overflow-x-auto overflow-y-visible">
          <div className="mt-[1.5rem] min-w-[72rem] w-full pb-[2rem]">
            <div className="flex h-12 items-center rounded-lg bg-[#E6E6E6] px-3">
              <div className={col.checkbox}>
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              </div>

              <div className={`${col.title} pl-2 pr-3`}>
                <div className={headerCell}>
                  <span className="min-w-0 truncate">Dispute Title &amp; ID</span>
                  <HeaderCarets />
                </div>
              </div>

              <div className={`${col.image} flex items-center justify-center pr-5`}>
                <div className={headerCell}>
                  <span>Image</span>
                  <HeaderCarets />
                </div>
              </div>

              <div className={`${col.campaign} pl-6 pr-2`}>
                <div className={headerCell}>
                  <span className="min-w-0 truncate">Campaign Name</span>
                  <HeaderCarets />
                </div>
              </div>

              <div className={`${col.appliedBy} px-1.5`}>
                <div className={headerCell}>
                  <span>Applied By</span>
                  <HeaderCarets />
                </div>
              </div>

              <div className={`${col.status} px-1.5`}>
                <div className={headerCell}>
                  <span>Status</span>
                  <HeaderCarets />
                </div>
              </div>

              <div className={`${col.updated} px-1.5`}>
                <div className={headerCell}>
                  <span>Updated</span>
                  <HeaderCarets />
                </div>
              </div>

              <div className={`${col.action} pl-1.5 pr-0`}>
                <span className="text-sm font-semibold text-[#1A1A1A]">
                  Action
                </span>
              </div>
            </div>

            <div className="mt-[2rem] flex flex-col gap-[0.75rem]">
              {loading &&
                Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex h-[5rem] items-center rounded-lg border border-[#D6D6D6] bg-white px-3 animate-pulse"
                  >
                    <div className={col.checkbox}>
                      <div className="h-4 w-4 rounded bg-gray-200" />
                    </div>

                    <div className={`${col.title} space-y-2 pl-2 pr-1`}>
                      <div className="h-3.5 w-3/4 rounded bg-gray-200" />
                      <div className="h-3 w-1/2 rounded bg-gray-100" />
                    </div>

                    <div className={`${col.image} flex items-center justify-center pr-5`}>
                      <div className="h-10 w-10 rounded-lg bg-gray-200" />
                    </div>

                    <div className={`${col.campaign} pl-6 pr-2`}>
                      <div className="h-3.5 w-2/3 rounded bg-gray-200" />
                    </div>

                    <div className={`${col.appliedBy} px-1.5`}>
                      <div className="h-6 w-20 rounded-full bg-gray-200" />
                    </div>

                    <div className={`${col.status} px-1.5`}>
                      <div className="h-6 w-20 rounded-full bg-gray-200" />
                    </div>

                    <div className={`${col.updated} px-1.5`}>
                      <div className="h-3.5 w-24 rounded bg-gray-200" />
                    </div>

                    <div className={`${col.action} pl-1.5 pr-0`}>
                      <div className="h-8 w-16 rounded-xl bg-gray-200" />
                    </div>
                  </div>
                ))}

              {!loading && error && (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-red-500">
                  <AlertCircle className="size-8" />
                  <p className="text-sm font-medium">{error}</p>

                  <button
                    onClick={load}
                    className="text-xs text-[#1A1A1A] underline hover:opacity-70"
                  >
                    Try again
                  </button>
                </div>
              )}

              {!loading && !error && rows.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-[#888]">
                  <GavelIcon size={36} />
                  <p className="text-sm font-medium">No disputes found</p>
                  <p className="text-xs text-[#BBB]">
                    Try adjusting your filters or search term
                  </p>
                </div>
              )}

              {!loading &&
                !error &&
                rows.map((row) => (
                  <div
                    key={row.disputeId}
                    className="flex h-[5rem] items-center rounded-lg border border-[#D6D6D6] bg-white px-3 transition-colors hover:bg-[#FAFAFA]"
                  >
                    <div className={col.checkbox}>
                      <Checkbox
                        checked={selected.has(row.disputeId)}
                        onCheckedChange={() => toggleOne(row.disputeId)}
                      />
                    </div>

                    <div className={`${col.title} min-w-0 overflow-hidden pl-2 pr-1`}>
                      <div
                        title={row.subject}
                        className="max-w-full truncate font-medium text-[#1A1A1A]"
                      >
                        {row.subject}
                      </div>
                      <div
                        title={`#${row.disputeId}`}
                        className="mt-0.5 max-w-full truncate text-xs text-gray-400"
                      >
                        #{row.disputeId}
                      </div>
                    </div>

                    <div className={`${col.image} flex items-center justify-center pl-1 pr-8`}>
                      <DisputeImage src={getDisputeImageUrl(row)} />
                    </div>

                    <div className={`${col.campaign} min-w-0 overflow-hidden pl-6 pr-1.5`}>
                      {row.campaignName ? (
                        <div
                          title={row.campaignName}
                          className="max-w-full truncate text-sm text-gray-700"
                        >
                          {row.campaignName}
                        </div>
                      ) : row.campaignId ? (
                        <div
                          title={row.campaignId}
                          className="max-w-full truncate font-mono text-xs text-gray-500"
                        >
                          {row.campaignId}
                        </div>
                      ) : (
                        <span className="text-xs italic text-gray-400">
                          No campaign
                        </span>
                      )}
                    </div>

                    <div className={`${col.appliedBy} px-1.5`}>
                      {row.createdBy?.role ? (
                        <span className="rounded-full bg-[#F3F3F3] px-2.5 py-1 text-xs font-medium text-[#1A1A1A]">
                          {row.createdBy.role}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>

                    <div className={`${col.status} px-1.5`}>
                      <span
                        className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                          STATUS_COLORS[row.status] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {STATUS_LABEL[row.status] || row.status}
                      </span>
                    </div>

                    <div className={`${col.updated} whitespace-nowrap px-1.5 text-sm text-gray-500`}>
                      {formatDateTime(row.updatedAt)}
                    </div>

                    <div className={`${col.action} flex items-center pl-1.5 pr-0`}>
                      <Button
                        className="!h-[2.0625rem] !w-[5.75rem] !rounded-[0.5rem] !bg-[#1A1A1A] !px-[0.5rem] text-xs font-medium text-white hover:!bg-[#2A2A2A]"
                        onClick={() =>
                          router.push(`/admin/disputes/${row.disputeId}`)
                        }
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
            </div>

            {!loading && !error && totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing{" "}
                  <span className="font-medium text-[#1A1A1A]">
                    {from}–{to}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-[#1A1A1A]">{total}</span>
                </p>

                <div className="flex items-center gap-1">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E2E2] text-[#1A1A1A] transition-colors hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="size-4" />
                  </button>

                  {pageNumbers.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      onClick={() => setPage(pageNumber)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors ${
                        pageNumber === page
                          ? "bg-[#1A1A1A] font-semibold text-white"
                          : "border border-[#E2E2E2] text-[#1A1A1A] hover:bg-[#F5F5F5]"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}

                  <button
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((prev) =>
                        prev >= totalPages ? totalPages : prev + 1
                      )
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E2E2] text-[#1A1A1A] transition-colors hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}