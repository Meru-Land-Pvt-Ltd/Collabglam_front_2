"use client";

import { useEffect, useMemo, useState } from "react";
import {
  apiGetBrandWallet,
  apiGetWalletTopupHistory,
} from "../../../services/brandApi";
import { toast, ToastStyles } from "@/components/ui/toast";

type FilterTab = "all" | "today" | "week" | "month" | "failed";

type BrandWallet = {
  brandId: string;
  walletBalance: number;
  frozenBalance: number;
  usableBalance: number;
  freezes?: unknown[];
};

type BrandWalletResponse = {
  success: boolean;
  data: BrandWallet;
  requestId: string;
};

type WalletTopup = {
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  paymentIntentId?: string | null;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  campaignId?: string;
  source?: string;
  note?: string;
  addedByAdminId?: string | null;
  addedByAdminEmail?: string | null;
};

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "failed", label: "Failed" },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function showToast(
  message: string,
  status: "success" | "error" | "info" = "info"
) {
  const styles = ToastStyles as unknown as Record<string, unknown>;

  const style =
    styles[status] ||
    styles[status.toUpperCase()] ||
    styles[status.charAt(0).toUpperCase() + status.slice(1)] ||
    styles.default ||
    styles.DEFAULT;

  const title =
    status === "success" ? "Success" : status === "error" ? "Error" : "Info";

  (toast as unknown as (payload: unknown) => void)({
    title,
    description: message,
    style,
  });
}

function getValueFromLocalStorage(keys: string[]) {
  if (typeof window === "undefined") return "";

  for (const key of keys) {
    const value = localStorage.getItem(key);

    if (value && value !== "undefined" && value !== "null") {
      return value;
    }
  }

  return "";
}

function getBrandIdFromLocalStorage() {
  if (typeof window === "undefined") return "";

  const directBrandId = getValueFromLocalStorage([
    "brandId",
    "brand_id",
    "brandID",
    "selectedBrandId",
  ]);

  if (directBrandId) return directBrandId;

  const possibleJsonKeys = [
    "brand",
    "brandData",
    "authBrand",
    "user",
    "userData",
  ];

  for (const key of possibleJsonKeys) {
    const rawValue = localStorage.getItem(key);

    if (!rawValue) continue;

    try {
      const parsed = JSON.parse(rawValue);

      const brandId =
        parsed?.brandId ||
        parsed?.brand_id ||
        parsed?._id ||
        parsed?.id ||
        parsed?.brand?._id ||
        parsed?.brand?.id ||
        parsed?.brand?.brandId;

      if (brandId) return String(brandId);
    } catch {
      continue;
    }
  }

  return "";
}

function isBrandWallet(value: unknown): value is BrandWallet {
  if (!value || typeof value !== "object") return false;

  const wallet = value as Partial<BrandWallet>;

  return (
    typeof wallet.brandId === "string" &&
    typeof wallet.walletBalance === "number" &&
    typeof wallet.frozenBalance === "number" &&
    typeof wallet.usableBalance === "number"
  );
}

function normalizeWalletResponse(response: unknown): BrandWallet | null {
  if (isBrandWallet(response)) return response;

  if (response && typeof response === "object") {
    const res = response as {
      data?: BrandWallet | BrandWalletResponse;
    };

    if (isBrandWallet(res.data)) return res.data;

    if (
      res.data &&
      typeof res.data === "object" &&
      "data" in res.data &&
      isBrandWallet((res.data as BrandWalletResponse).data)
    ) {
      return (res.data as BrandWalletResponse).data;
    }

    if ("data" in response && isBrandWallet((response as BrandWalletResponse).data)) {
      return (response as BrandWalletResponse).data;
    }
  }

  return null;
}

function normalizeTopupHistoryResponse(response: unknown): WalletTopup[] {
  const findTopups = (value: unknown): WalletTopup[] => {
    if (!value || typeof value !== "object") return [];

    const obj = value as {
      wallettopup?: WalletTopup[];
      walletTopup?: WalletTopup[];
      walletTopups?: WalletTopup[];
      topups?: WalletTopup[];
      transactions?: WalletTopup[];
      history?: WalletTopup[];
      data?: unknown;
    };

    if (Array.isArray(obj.wallettopup)) return obj.wallettopup;
    if (Array.isArray(obj.walletTopup)) return obj.walletTopup;
    if (Array.isArray(obj.walletTopups)) return obj.walletTopups;
    if (Array.isArray(obj.topups)) return obj.topups;
    if (Array.isArray(obj.transactions)) return obj.transactions;
    if (Array.isArray(obj.history)) return obj.history;

    return [];
  };

  if (Array.isArray(response)) return response;

  const direct = findTopups(response);
  if (direct.length) return direct;

  if (response && typeof response === "object" && "data" in response) {
    const firstData = (response as { data?: unknown }).data;

    if (Array.isArray(firstData)) return firstData;

    const fromFirstData = findTopups(firstData);
    if (fromFirstData.length) return fromFirstData;

    if (firstData && typeof firstData === "object" && "data" in firstData) {
      const secondData = (firstData as { data?: unknown }).data;

      if (Array.isArray(secondData)) return secondData;

      const fromSecondData = findTopups(secondData);
      if (fromSecondData.length) return fromSecondData;
    }
  }

  return [];
}

function formatMoney(amount = 0, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function shortId(value?: string | null) {
  if (!value) return "-";
  if (value.length <= 18) return value;

  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

function getTransactionId(transaction: WalletTopup) {
  return (
    transaction.stripePaymentIntentId ||
    transaction.paymentIntentId ||
    transaction.stripeSessionId ||
    transaction.campaignId ||
    "-"
  );
}

function isFailedTransaction(transaction: WalletTopup) {
  const status = String(transaction.status || "").toLowerCase();

  return ["failed", "cancelled", "canceled", "rejected"].includes(status);
}

function isToday(date: Date) {
  const now = new Date();

  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function isThisWeek(date: Date) {
  const now = new Date();
  const startOfWeek = new Date(now);

  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);

  endOfWeek.setDate(startOfWeek.getDate() + 7);

  return date >= startOfWeek && date < endOfWeek;
}

function isThisMonth(date: Date) {
  const now = new Date();

  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 2.5V9.5M8 9.5L5.25 6.75M8 9.5L10.75 6.75"
        stroke="#1A1A1A"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 10.5V12.5C3 13.05 3.45 13.5 4 13.5H12C12.55 13.5 13 13.05 13 12.5V10.5"
        stroke="#1A1A1A"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowDownRightIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <path
        d="M8.75 8.75L19.25 19.25M19.25 19.25H10.5M19.25 19.25V10.5"
        stroke="#1A1A1A"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function TransactionHistoryPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [transactions, setTransactions] = useState<WalletTopup[]>([]);
  const [wallet, setWallet] = useState<BrandWallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadTransactionHistory() {
    try {
      setIsLoading(true);

      const brandId = getBrandIdFromLocalStorage();

      if (!brandId) {
        showToast("Brand ID not found in localStorage.", "error");
        setTransactions([]);
        setWallet(null);
        return;
      }

      const [walletResponse, historyResponse] = await Promise.allSettled([
        apiGetBrandWallet({ brandId }),
        apiGetWalletTopupHistory({ brandId }),
      ]);

      if (walletResponse.status === "fulfilled") {
        setWallet(normalizeWalletResponse(walletResponse.value));
      } else {
        setWallet(null);
      }

      if (historyResponse.status === "fulfilled") {
        const topupHistory = normalizeTopupHistoryResponse(historyResponse.value);
        setTransactions(topupHistory);

        if (!topupHistory.length) {
          showToast("No topup history found in API response.", "info");
        }
      } else {
        setTransactions([]);
        showToast(
          historyResponse.reason instanceof Error
            ? historyResponse.reason.message
            : "Unable to load transaction history.",
          "error"
        );
      }
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : "Unable to load transaction history.",
        "error"
      );
      setTransactions([]);
      setWallet(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTransactionHistory();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (activeFilter === "all") return true;

      if (activeFilter === "failed") {
        return isFailedTransaction(transaction);
      }

      const date = new Date(transaction.createdAt);

      if (Number.isNaN(date.getTime())) return false;

      if (activeFilter === "today") return isToday(date);
      if (activeFilter === "week") return isThisWeek(date);
      if (activeFilter === "month") return isThisMonth(date);

      return true;
    });
  }, [activeFilter, transactions]);

  function handleDownloadTransactions() {
    if (!filteredTransactions.length) {
      showToast("No transactions available to download.", "error");
      return;
    }

    const headers = [
      "Transaction ID",
      "Stripe Session ID",
      "Campaign ID",
      "Amount",
      "Currency",
      "Status",
      "Source",
      "Created At",
    ];

    const rows = filteredTransactions.map((transaction) => [
      getTransactionId(transaction),
      transaction.stripeSessionId || "-",
      transaction.campaignId || "-",
      String(transaction.amount ?? 0),
      transaction.currency || "usd",
      transaction.status || "-",
      transaction.source || "-",
      formatDate(transaction.createdAt),
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "wallet-transaction-history.csv";
    link.click();

    URL.revokeObjectURL(url);

    showToast("Transaction history downloaded.", "success");
  }

  return (
    <main className="min-h-screen bg-white p-[3.5rem] font-[Inter] text-[#1A1A1A]">
      <div className="mb-[2.25rem] flex items-center justify-between gap-[1rem]">
        <h1 className="text-[1.5rem] font-semibold leading-[2rem] tracking-[-0.02rem] text-[#1A1A1A]">
          Transaction History
        </h1>

        <button
          type="button"
          onClick={handleDownloadTransactions}
          className="flex items-center justify-center gap-[0.25rem] self-stretch rounded-[0.75rem] px-[0.5rem] text-[0.875rem] font-medium leading-[1.25rem] text-[#1A1A1A]"
        >
          <DownloadIcon />
          Download Transaction
        </button>
      </div>

      <div className="mb-[2.5rem] flex flex-wrap items-center gap-[0.5rem]">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                "flex h-[2.25rem] min-w-[5.5625rem] items-center justify-center gap-0 rounded-[0.75rem] px-[1.25rem] text-[1rem] font-semibold leading-[1.5rem]",
                isActive
                  ? "bg-[#1A1A1A] text-white"
                  : "border border-[#E6E6E6] bg-white text-[#8F8F8F]"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <section className="w-full">
        {isLoading ? (
          <div className="flex w-full items-center justify-center rounded-[0.75rem] border border-[#E6E6E6] bg-white px-[1rem] py-[4rem] text-[0.875rem] font-medium leading-[1.25rem] text-[#777]">
            Loading transaction history...
          </div>
        ) : filteredTransactions.length ? (
          <div className="w-full overflow-hidden bg-white">
            {filteredTransactions.map((transaction, index) => {
              const transactionId = getTransactionId(transaction);
              const isFailed = isFailedTransaction(transaction);

              return (
                <article
                  key={`${transactionId}-${index}`}
                  className="flex w-full items-center justify-between border-b border-[#E6E6E6] bg-white px-[1rem] py-[1.25rem]"
                >
                  <div className="flex min-w-0 items-center gap-[1rem]">
                    <div className="flex h-[2rem] w-[2rem] shrink-0 items-center justify-center">
                      <ArrowDownRightIcon />
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate text-[1.25rem] font-medium leading-[1.75rem] tracking-[0] text-[#1A1A1A]">
                        Wallet Topup
                      </h2>

                      <p className="mt-[0.125rem] truncate text-[0.875rem] font-medium leading-[1.25rem] text-[#B8B8B8]">
                        {formatDate(transaction.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className={cn(
                        "text-[1.25rem] font-semibold leading-[1.75rem] tracking-[0]",
                        isFailed ? "text-[#1A1A1A]" : "text-[#159447]"
                      )}
                    >
                      +{formatMoney(transaction.amount, transaction.currency)}
                    </p>

                    <p className="mt-[0.125rem] text-[0.875rem] font-medium leading-[1.25rem] text-[#B8B8B8]">
                      Status: {transaction.status || "-"}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex w-full items-center justify-center rounded-[0.75rem] border border-[#E6E6E6] bg-white px-[1rem] py-[4rem] text-[0.875rem] font-medium leading-[1.25rem] text-[#777]">
            No transaction history found.
          </div>
        )}
      </section>
    </main>
  );
}