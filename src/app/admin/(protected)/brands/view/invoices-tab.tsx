"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { RefreshCw, Search } from "lucide-react";
import AdminTable, { type AdminTableColumn } from "../../../components/table";
import { adminPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast, ToastStyles } from "@/components/ui/toast";
import { SectionCard } from "./shared";

type InvoiceStatusFilter = "all" | "paid" | "pending" | "failed" | "overdue";
type PaymentTypeFilter = "all" | "plan" | "milestone";
type DateRangeFilter = "all" | "7d" | "30d" | "90d";

type PaymentHistoryItem = {
  paymentType: "plan" | "milestone";
  orderId?: string;
  paymentId?: string;

  userId?: string;
  role?: string;
  planId?: string;
  planName?: string;

  brandId?: string;
  influencerId?: string;
  campaignId?: string;
  campaignName?: string;
  milestoneTitle?: string;

  amount?: number;
  currency?: string;
  status?: string;
  receipt?: string;

  invoiceNumber?: string;
  invoiceIssuedAt?: string | null;
  invoiceFilePath?: string;

  paidAt?: string | null;
  createdAt?: string | null;

  subtotalCents?: number;
  discountCents?: number;
  taxCents?: number;
  totalCents?: number;
};

type PaymentHistoryResponse = {
  success: boolean;
  message?: string;
  userId?: string;
  role?: string;
  counts?: {
    plans: number;
    milestones: number;
    total: number;
  };
  history?: PaymentHistoryItem[];
};

const invoiceStatusOptions: InvoiceStatusFilter[] = [
  "all",
  "paid",
  "pending",
  "failed",
  "overdue",
];

const paymentTypeOptions: PaymentTypeFilter[] = ["all", "plan", "milestone"];
const dateRangeOptions: DateRangeFilter[] = ["all", "7d", "30d", "90d"];

function normalize(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function getBackendErrorMessage(
  error: unknown,
  fallback = "Something went wrong."
): string {
  if (!error) return fallback;

  if (typeof error === "string") {
    const message = error.trim();

    if (!message) return fallback;

    try {
      const parsed = JSON.parse(message);
      return getBackendErrorMessage(parsed, fallback);
    } catch {
      return message;
    }
  }

  if (Array.isArray(error)) {
    const messages = error
      .map((item) => getBackendErrorMessage(item, ""))
      .filter(Boolean);

    return messages.join(", ") || fallback;
  }

  if (typeof error === "object") {
    const objectError = error as Record<string, unknown>;

    const directMessage =
      objectError.message ||
      objectError.error ||
      objectError.detail ||
      objectError.msg;

    if (directMessage) {
      return getBackendErrorMessage(directMessage, fallback);
    }

    if (objectError.errors) {
      return getBackendErrorMessage(objectError.errors, fallback);
    }

    const nestedMessages = Object.values(objectError)
      .map((item) => getBackendErrorMessage(item, ""))
      .filter(Boolean);

    return nestedMessages.join(", ") || fallback;
  }

  return String(error);
}

function isInvoiceStatusFilter(value: string): value is InvoiceStatusFilter {
  return invoiceStatusOptions.includes(value as InvoiceStatusFilter);
}

function isPaymentTypeFilter(value: string): value is PaymentTypeFilter {
  return paymentTypeOptions.includes(value as PaymentTypeFilter);
}

function isDateRangeFilter(value: string): value is DateRangeFilter {
  return dateRangeOptions.includes(value as DateRangeFilter);
}

function getInvoiceId(item: PaymentHistoryItem, index: number) {
  return (
    item.invoiceNumber ||
    item.paymentId ||
    item.orderId ||
    `${item.paymentType}-${index}`
  );
}

function getInvoiceTitle(item: PaymentHistoryItem) {
  if (item.paymentType === "plan") {
    return item.planName || "Subscription Plan";
  }

  return item.milestoneTitle || item.campaignName || "Campaign Milestone";
}

function getInvoiceDate(item: PaymentHistoryItem) {
  return item.invoiceIssuedAt || item.paidAt || item.createdAt || "";
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatMoneyFromCents(value?: number, currency = "USD") {
  const cents = Number(value || 0);
  const amount = cents / 100;

  if (!Number.isFinite(amount) || amount <= 0) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

function getPaymentAmount(item: PaymentHistoryItem) {
  return Number(item.totalCents ?? item.amount ?? item.subtotalCents ?? 0);
}

function isWithinDateRange(item: PaymentHistoryItem, range: DateRangeFilter) {
  if (range === "all") return true;

  const rawDate = getInvoiceDate(item);
  if (!rawDate) return false;

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const from = new Date();

  const daysMap: Record<Exclude<DateRangeFilter, "all">, number> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
  };

  from.setDate(now.getDate() - daysMap[range] + 1);
  from.setHours(0, 0, 0, 0);

  return date >= from && date <= now;
}

function StatusBadge({ status }: { status?: string }) {
  const value = normalize(status) || "pending";

  const className =
    value === "paid" || value === "success" || value === "completed"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : value === "failed"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : value === "overdue"
          ? "border-orange-200 bg-orange-50 text-orange-700"
          : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black capitalize ${className}`}
    >
      {value}
    </span>
  );
}

function TypeBadge({ type }: { type: PaymentHistoryItem["paymentType"] }) {
  const isPlan = type === "plan";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black capitalize ${isPlan
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : "border-purple-200 bg-purple-50 text-purple-700"
        }`}
    >
      {isPlan ? "Plan" : "Milestone"}
    </span>
  );
}

export function BrandInvoicesTab({ brandId }: { brandId: string }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvoiceStatusFilter>("all");
  const [paymentType, setPaymentType] = useState<PaymentTypeFilter>("all");
  const [range, setRange] = useState<DateRangeFilter>("all");

  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState("invoiceDate");
  const [sortAsc, setSortAsc] = useState(false);

  const lastBackendErrorRef = useRef("");
  const brandIdErrorShownRef = useRef(false);

  const showErrorToast = useCallback((title: string, text?: string) => {
    toast({
      icon: "error",
      title,
      text,
      timer: 4500,
    });
  }, []);

  const showBackendErrorToast = useCallback((errorValue: unknown) => {
    const backendMessage = getBackendErrorMessage(
      errorValue,
      "Failed to load payment history."
    );

    if (!backendMessage) return;
    if (lastBackendErrorRef.current === backendMessage) return;

    lastBackendErrorRef.current = backendMessage;

    toast({
      icon: "error",
      title: "Payment History Error",
      text: backendMessage,
      timer: 5000,
    });
  }, []);

  const fetchPaymentHistory = useCallback(async () => {
    if (!brandId?.trim()) {
      setHistory([]);
      setError("Brand ID is missing.");

      if (!brandIdErrorShownRef.current) {
        brandIdErrorShownRef.current = true;
        showErrorToast(
          "Brand ID Missing",
          "Unable to load payment history because this brand ID is missing."
        );
      }

      return;
    }

    brandIdErrorShownRef.current = false;

    setLoading(true);
    setError(null);

    try {
      const response = await adminPost<PaymentHistoryResponse>("/payment/history", {
        userId: brandId,
        role: "Brand",
        status,
      });

      if (response?.success === false) {
        throw new Error(response.message || "Failed to load payment history.");
      }

      if (!Array.isArray(response?.history)) {
        setHistory([]);
        return;
      }

      setHistory(response.history);
    } catch (err: unknown) {
      const backendMessage = getBackendErrorMessage(
        err,
        "Failed to load payment history."
      );

      setError(backendMessage);
      setHistory([]);
      showBackendErrorToast(err);
    } finally {
      setLoading(false);
    }
  }, [brandId, status, showBackendErrorToast, showErrorToast]);

  useEffect(() => {
    fetchPaymentHistory();
  }, [fetchPaymentHistory]);

  const filteredInvoices = useMemo(() => {
    const query = normalize(search);

    const rows = history.filter((item) => {
      const matchesType = paymentType === "all" || item.paymentType === paymentType;

      const matchesSearch =
        !query ||
        [
          item.invoiceNumber,
          item.paymentId,
          item.orderId,
          item.receipt,
          item.planName,
          item.campaignName,
          item.milestoneTitle,
          item.status,
          item.currency,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesType && matchesSearch && isWithinDateRange(item, range);
    });

    return [...rows].sort((a, b) => {
      const direction = sortAsc ? 1 : -1;

      const valueA =
        sortBy === "amount"
          ? getPaymentAmount(a)
          : sortBy === "status"
            ? normalize(a.status)
            : sortBy === "paymentType"
              ? a.paymentType
              : sortBy === "invoiceNumber"
                ? normalize(a.invoiceNumber)
                : new Date(getInvoiceDate(a) || 0).getTime();

      const valueB =
        sortBy === "amount"
          ? getPaymentAmount(b)
          : sortBy === "status"
            ? normalize(b.status)
            : sortBy === "paymentType"
              ? b.paymentType
              : sortBy === "invoiceNumber"
                ? normalize(b.invoiceNumber)
                : new Date(getInvoiceDate(b) || 0).getTime();

      if (valueA > valueB) return direction;
      if (valueA < valueB) return -direction;
      return 0;
    });
  }, [history, paymentType, range, search, sortAsc, sortBy]);

  const hasActiveFilters =
    search.trim() !== "" ||
    status !== "all" ||
    paymentType !== "all" ||
    range !== "all";

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setPaymentType("all");
    setRange("all");
  };

  const columns = useMemo<AdminTableColumn<PaymentHistoryItem>[]>(
    () => [
      {
        id: "details",
        header: "Details",
        widthClassName: "min-w-[260px]",
        render: (item) => (
          <div>
            <p className="text-sm font-bold text-black/75">
              {getInvoiceTitle(item)}
            </p>
          </div>
        ),
      },
      {
        id: "paymentType",
        header: "Type",
        sortable: true,
        sortField: "paymentType",
        align: "center",
        widthClassName: "min-w-[130px]",
        render: (item) => <TypeBadge type={item.paymentType} />,
      },
      {
        id: "invoiceDate",
        header: "Date",
        sortable: true,
        sortField: "invoiceDate",
        align: "center",
        widthClassName: "min-w-[140px]",
        render: (item) => (
          <span className="text-sm font-semibold text-black/60">
            {formatDate(getInvoiceDate(item))}
          </span>
        ),
      },
      {
        id: "amount",
        header: "Amount",
        sortable: true,
        sortField: "amount",
        align: "right",
        widthClassName: "min-w-[140px]",
        render: (item) => (
          <span className="text-sm font-black text-[#1a1a1a]">
            {formatMoneyFromCents(getPaymentAmount(item), item.currency)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        sortable: true,
        sortField: "status",
        align: "center",
        widthClassName: "min-w-[130px]",
        render: (item) => <StatusBadge status={item.status} />,
      },
    ],
    []
  );

  const handleSearchChange = (value: string) => {
    if (typeof value !== "string") {
      showErrorToast("Invalid Search", "Search value must be valid text.");
      return;
    }

    setSearch(value);
  };

  const handleStatusChange = (value: string) => {
    if (!isInvoiceStatusFilter(value)) {
      showErrorToast("Invalid Status", "Please select a valid invoice status.");
      return;
    }

    setStatus(value);
  };

  const handlePaymentTypeChange = (value: string) => {
    if (!isPaymentTypeFilter(value)) {
      showErrorToast("Invalid Payment Type", "Please select a valid payment type.");
      return;
    }

    setPaymentType(value);
  };

  const handleDateRangeChange = (value: string) => {
    if (!isDateRangeFilter(value)) {
      showErrorToast("Invalid Date Range", "Please select a valid date range.");
      return;
    }

    setRange(value);
  };

  const handleSort = (field: string) => {
    const allowedSortFields = [
      "invoiceDate",
      "amount",
      "status",
      "paymentType",
      "invoiceNumber",
    ];

    if (!allowedSortFields.includes(field)) {
      showErrorToast(
        "Invalid Sort Field",
        "This column cannot be sorted right now."
      );
      return;
    }

    if (sortBy === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortBy(field);
      setSortAsc(true);
    }
  };

  return (
    <>
      <ToastStyles />

      <SectionCard
        title="Payment History"
        description="Brand payment history, plan, and milestone."
        action={
          <div className="flex max-w-full flex-wrap items-end justify-end gap-3">
            <div className="w-[220px]">
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                Search
              </p>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  placeholder="Search payments..."
                  className="h-10 rounded-lg border-slate-200 bg-white pl-9 text-sm font-semibold text-slate-700 shadow-none hover:bg-[#EDEDED] focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="w-[150px]">
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                Status
              </p>

              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-none hover:bg-[#EDEDED] focus:ring-0">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>

                <SelectContent className="border-slate-200 bg-white">
                  <SelectItem value="all" className="focus:bg-[#EDEDED]">
                    All Status
                  </SelectItem>
                  <SelectItem value="paid" className="focus:bg-[#EDEDED]">
                    Paid
                  </SelectItem>
                  <SelectItem value="pending" className="focus:bg-[#EDEDED]">
                    Pending
                  </SelectItem>
                  <SelectItem value="failed" className="focus:bg-[#EDEDED]">
                    Failed
                  </SelectItem>
                  <SelectItem value="overdue" className="focus:bg-[#EDEDED]">
                    Overdue
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-[160px]">
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                Payment Type
              </p>

              <Select value={paymentType} onValueChange={handlePaymentTypeChange}>
                <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-none hover:bg-[#EDEDED] focus:ring-0">
                  <SelectValue placeholder="Payment Type" />
                </SelectTrigger>

                <SelectContent className="border-slate-200 bg-white">
                  <SelectItem value="all" className="focus:bg-[#EDEDED]">
                    All Types
                  </SelectItem>
                  <SelectItem value="plan" className="focus:bg-[#EDEDED]">
                    Plan
                  </SelectItem>
                  <SelectItem value="milestone" className="focus:bg-[#EDEDED]">
                    Milestone
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-[150px]">
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                Date Range
              </p>

              <Select value={range} onValueChange={handleDateRangeChange}>
                <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-none hover:bg-[#EDEDED] focus:ring-0">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>

                <SelectContent className="border-slate-200 bg-white">
                  <SelectItem value="all" className="focus:bg-[#EDEDED]">
                    All Time
                  </SelectItem>
                  <SelectItem value="7d" className="focus:bg-[#EDEDED]">
                    Last 7 Days
                  </SelectItem>
                  <SelectItem value="30d" className="focus:bg-[#EDEDED]">
                    Last 30 Days
                  </SelectItem>
                  <SelectItem value="90d" className="focus:bg-[#EDEDED]">
                    Last 90 Days
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters ? (
              <Button
                type="button"
                variant="outline"
                onClick={resetFilters}
                className="h-10 rounded-lg border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-none hover:bg-[#EDEDED]"
              >
                Reset
              </Button>
            ) : null}
          </div>
        }
      >

        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
          <AdminTable<PaymentHistoryItem>
            data={filteredInvoices}
            columns={columns}
            rowKey={(item, index) => getInvoiceId(item, index)}
            loading={loading}
            loadingRows={6}
            error={null}
            emptyTitle={error ? "Unable to load payment history" : "No payment found"}
            emptyDescription={
              error
                ? "Backend error is shown in the toast. Please try again."
                : "No payment history matched the selected filters."
            }
            sortBy={sortBy}
            sortOrder={sortAsc ? "asc" : "desc"}
            onSort={handleSort}
            tableClassName="bg-white"
          />
        </div>
      </SectionCard >
    </>
  );
}