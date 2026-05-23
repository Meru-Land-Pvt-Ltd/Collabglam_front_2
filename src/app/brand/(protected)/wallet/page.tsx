"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    apiBrandWalletTopup,
    apiGetBrandWallet,
} from "../../services/brandApi";
import { toast, ToastStyles } from "@/components/ui/toast";

type SummaryTab = "balance" | "freeze" | "transaction";
type FundTab = "add" | "withdraw";

type InfluencerAllocation = {
    influencerId: string;
    amount: number;
    releasedAmount: number;
};

type WalletFreeze = {
    totalFrozenAmount?: number;
    brandId: string;
    campaignId: string;
    influencerId?: string;
    freezeAmount?: number;
    availableToAllocate?: number;
    currentFrozenAmount?: number;
    influencerAllocations?: InfluencerAllocation[];
    totalAllocatedAmount?: number;
    totalReleasedAmount?: number;
};

type BrandWallet = {
    brandId: string;
    walletBalance: number;
    frozenBalance: number;
    usableBalance: number;
    freezes: WalletFreeze[];
};

type BrandWalletResponse = {
    success: boolean;
    data: BrandWallet;
    requestId: string;
};

type BrandWalletTopupResponse = {
    success?: boolean;
    data?: {
        url?: string;
        checkoutUrl?: string;
        sessionUrl?: string;
        paymentUrl?: string;
    };
    url?: string;
    checkoutUrl?: string;
    sessionUrl?: string;
    paymentUrl?: string;
    message?: string;
};

const summaryTabs: { key: SummaryTab; label: string }[] = [
    { key: "balance", label: "Balance" },
    { key: "freeze", label: "Freeze" },
    { key: "transaction", label: "Transaction" },
];

const amountOptions = [200, 500, 1000];

const savedBankAccounts = [
    {
        bank: "Bank of America",
        logo: "BANK OF AMERICA",
        ifsc: "BOA5498461",
        accountNumber: "24555464641",
        isDefault: true,
    },
    {
        bank: "Citi Bank",
        logo: "citi bank",
        ifsc: "CIT476141631",
        accountNumber: "124242782785278",
        isDefault: false,
    },
    {
        bank: "HSBC",
        logo: "HSBC",
        ifsc: "HSBC766474",
        accountNumber: "4844997454246",
        isDefault: false,
    },
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

function getCampaignIdFromLocalStorage(wallet?: BrandWallet | null) {
    if (typeof window === "undefined") return "";

    const directCampaignId = getValueFromLocalStorage([
        "campaignId",
        "campaign_id",
        "selectedCampaignId",
    ]);

    return directCampaignId || wallet?.freezes?.[0]?.campaignId || "";
}

function isBrandWallet(value: unknown): value is BrandWallet {
    if (!value || typeof value !== "object") return false;

    const wallet = value as Partial<BrandWallet>;

    return (
        typeof wallet.brandId === "string" &&
        typeof wallet.walletBalance === "number" &&
        typeof wallet.frozenBalance === "number" &&
        typeof wallet.usableBalance === "number" &&
        Array.isArray(wallet.freezes)
    );
}

function normalizeWalletResponse(response: unknown): BrandWallet | null {
    if (isBrandWallet(response)) {
        return response;
    }

    if (response && typeof response === "object" && "data" in response) {
        const walletData = (response as BrandWalletResponse).data;

        if (isBrandWallet(walletData)) {
            return walletData;
        }
    }

    return null;
}

function formatMoney(amount = 0) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(amount);
}

function shortId(value?: string) {
    if (!value) return "-";
    if (value.length <= 12) return value;
    return `${value.slice(0, 8)}...${value.slice(-5)}`;
}

function MoneyWavyIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
                d="M3.75 6.75C7.25 4.95 10.75 8.55 14.25 6.75C16.25 5.75 18.25 5.9 20.25 6.75V17.25C16.75 15.45 13.25 19.05 9.75 17.25C7.75 16.25 5.75 16.1 3.75 17.25V6.75Z"
                stroke="#1A1A1A"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
            <path
                d="M12 15.25C13.38 15.25 14.5 14.13 14.5 12.75C14.5 11.37 13.38 10.25 12 10.25C10.62 10.25 9.5 11.37 9.5 12.75C9.5 14.13 10.62 15.25 12 15.25Z"
                stroke="#1A1A1A"
                strokeWidth="1.5"
            />
        </svg>
    );
}

function PlusIcon() {
    return (
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
            <path
                d="M5.5 1.2V9.8M1.2 5.5H9.8"
                stroke="#1A1A1A"
                strokeWidth="1.4"
                strokeLinecap="round"
            />
        </svg>
    );
}

function ChevronRightIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path
                d="M7 4.5L11.5 9L7 13.5"
                stroke="#1A1A1A"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export default function WalletPaymentPage() {
    const router = useRouter();

    const [summaryTab, setSummaryTab] = useState<SummaryTab>("balance");
    const [fundTab, setFundTab] = useState<FundTab>("add");
    const [amountInput, setAmountInput] = useState("5000");
    const [wallet, setWallet] = useState<BrandWallet | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isTopupLoading, setIsTopupLoading] = useState(false);

    async function loadWallet() {
        try {
            setIsLoading(true);

            const brandId = getBrandIdFromLocalStorage();

            if (!brandId) {
                setWallet(null);
                showToast("Brand ID not found in localStorage.", "error");
                return;
            }

            const response = await apiGetBrandWallet({
                brandId,
            });

            const walletData = normalizeWalletResponse(response);

            if (!walletData) {
                setWallet(null);
                showToast("Invalid wallet response received from API.", "error");
                return;
            }

            setWallet(walletData);
        } catch (err) {
            setWallet(null);
            showToast(
                err instanceof Error ? err.message : "Unable to load wallet data.",
                "error"
            );
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadWallet();
    }, []);

    const summaryData = useMemo(() => {
        if (summaryTab === "freeze") {
            return {
                label: "Frozen Balance",
                value: wallet?.frozenBalance ?? 0,
            };
        }

        return {
            label: "Wallet Balance",
            value: wallet?.walletBalance ?? 0,
        };
    }, [summaryTab, wallet]);

    const freezeRows = wallet?.freezes ?? [];
    const payableAmount = Number(amountInput);

    function handleSummaryTabClick(tab: SummaryTab) {
        if (tab === "transaction") {
            router.push("/brand/wallet/transaction");
            return;
        }

        setSummaryTab(tab);
    }

    async function handleAddMoney() {
        try {
            if (!payableAmount || payableAmount <= 0) {
                showToast("Please enter a valid amount.", "error");
                return;
            }

            const brandId = getBrandIdFromLocalStorage();
            const campaignId = getCampaignIdFromLocalStorage(wallet);

            if (!brandId) {
                showToast("Brand ID not found in localStorage.", "error");
                return;
            }

            if (!campaignId) {
                showToast("Campaign ID is missing.", "error");
                return;
            }

            setIsTopupLoading(true);

            const origin = window.location.origin;

            const response = (await apiBrandWalletTopup({
                brandId,
                campaignId,
                amount: payableAmount,
                currency: "usd",
                successUrl: `${origin}/brand/wallet?payment=success`,
                cancelUrl: `${origin}/brand/wallet?payment=cancelled`,
            })) as unknown as BrandWalletTopupResponse;

            const stripeUrl =
                response?.data?.url ||
                response?.data?.checkoutUrl ||
                response?.data?.sessionUrl ||
                response?.data?.paymentUrl ||
                response?.url ||
                response?.checkoutUrl ||
                response?.sessionUrl ||
                response?.paymentUrl;

            if (!stripeUrl) {
                showToast(response?.message || "Stripe checkout URL not found.", "error");
                return;
            }

            showToast("Redirecting to Stripe payment.", "success");
            window.location.href = stripeUrl;
        } catch (err) {
            showToast(
                err instanceof Error ? err.message : "Unable to start Stripe payment.",
                "error"
            );
        } finally {
            setIsTopupLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-white p-[3.5rem] font-[Inter] text-[#1A1A1A]">
            <h1 className="mb-[1rem] text-[1rem] font-semibold leading-[1.5rem] text-[#1A1A1A]">
                Wallet &amp; Payment
            </h1>

            <section className="grid grid-cols-[minmax(0,1fr)_25rem] gap-[1.25rem] max-xl:grid-cols-1">
                <div className="flex min-h-[17.875rem] flex-col gap-[0.5rem] rounded-[0.75rem] border border-[#E6E6E6] bg-white p-[0.5rem]">
                    <div className="flex items-center gap-[0.5rem]">
                        <div className="flex h-[3rem] w-[3rem] items-center justify-center gap-[0.625rem] rounded-[0.5rem] border border-[#E6E6E6] bg-white p-[0.75rem]">
                            <MoneyWavyIcon />
                        </div>

                        <div className="ml-auto flex items-center gap-[0.5rem] rounded-[0.75rem] bg-[#F9F9F9] p-[0.5rem]">
                            {summaryTabs.map((tab) => {
                                const isSelected = summaryTab === tab.key;

                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => handleSummaryTabClick(tab.key)}
                                        className={cn(
                                            "flex h-[2rem] w-[6.5rem] items-center justify-center rounded-[0.5rem] text-center text-[1rem] leading-[1.5rem]",
                                            isSelected
                                                ? "bg-white font-semibold text-[#1A1A1A]"
                                                : "font-medium tracking-[0] text-[#B8B8B8]"
                                        )}
                                        style={
                                            isSelected
                                                ? { fontFeatureSettings: "'liga' off, 'clig' off" }
                                                : undefined
                                        }
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex h-[13.875rem] flex-1 flex-col items-start justify-end gap-[0.125rem] px-[0.5rem] pb-[0.5rem]">
                        <div className="flex items-end gap-[0.35rem]">
                            <p className="text-[2rem] font-semibold leading-[2.5rem] tracking-[-0.0625rem] text-[#1A1A1A]">
                                {isLoading ? "Loading..." : formatMoney(summaryData.value)}
                            </p>

                            {!isLoading && wallet ? (
                                <span className="mb-[0.4rem] text-[0.75rem] font-medium leading-[1rem] text-[#777]">
                                    USD
                                </span>
                            ) : null}
                        </div>

                        <p className="text-[0.875rem] font-medium leading-[1.25rem] text-[#B8B8B8]">
                            {summaryData.label}
                        </p>
                    </div>
                </div>

                <aside className="flex flex-col overflow-hidden rounded-[0.75rem] border border-[#E6E6E6] bg-white">
                    <div className="flex min-h-[4rem] gap-[0.5rem] border-b border-[#E6E6E6] bg-white px-[0.5rem] pt-[0.5rem]">
                        <button
                            type="button"
                            onClick={() => setFundTab("add")}
                            className={cn(
                                "flex flex-1 items-center justify-center gap-[0.5rem] self-stretch text-center text-[1rem] leading-[1.5rem]",
                                fundTab === "add"
                                    ? "border-b-2 border-[#E5B800] font-semibold text-[#1A1A1A]"
                                    : "font-medium text-[#B8B8B8]"
                            )}
                            style={
                                fundTab === "add"
                                    ? { fontFeatureSettings: "'liga' off, 'clig' off" }
                                    : undefined
                            }
                        >
                            Add funds
                        </button>

                        <button
                            type="button"
                            onClick={() => setFundTab("withdraw")}
                            className={cn(
                                "flex flex-1 items-center justify-center gap-[0.5rem] self-stretch text-center text-[1rem] leading-[1.5rem]",
                                fundTab === "withdraw"
                                    ? "border-b-2 border-[#E5B800] font-semibold text-[#1A1A1A]"
                                    : "font-medium text-[#B8B8B8]"
                            )}
                            style={
                                fundTab === "withdraw"
                                    ? { fontFeatureSettings: "'liga' off, 'clig' off" }
                                    : undefined
                            }
                        >
                            Withdraw funds
                        </button>
                    </div>

                    <div className="flex h-[13.875rem] flex-col items-center justify-center gap-[0.75rem] px-[0.75rem]">
                        <label className="w-full text-center">
                            <span className="sr-only">Enter Amount</span>

                            <div className="flex items-center justify-center gap-[0.125rem]">
                                <span className="text-[2rem] font-semibold leading-[2.5rem] tracking-[-0.0625rem] text-[#1A1A1A]">
                                    $
                                </span>

                                <input
                                    type="number"
                                    inputMode="decimal"
                                    min="1"
                                    value={amountInput}
                                    onChange={(event) => setAmountInput(event.target.value)}
                                    placeholder="0"
                                    className="w-[6.25rem] border-none bg-transparent text-left text-[2rem] font-semibold leading-[2.5rem] tracking-[-0.0625rem] text-[#1A1A1A] outline-none placeholder:text-[#B8B8B8] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />
                            </div>
                        </label>

                        <div className="flex items-center justify-center gap-[0.5rem]">
                            {amountOptions.map((amount) => (
                                <button
                                    key={amount}
                                    type="button"
                                    onClick={() => setAmountInput(String(amount))}
                                    className="rounded-full border border-[#E6E6E6] bg-[#F9F9F9] px-[0.875rem] py-[0.375rem] text-[0.875rem] font-medium leading-[1.25rem] text-[#1A1A1A]"
                                >
                                    ${amount}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        className="mx-[0.75rem] flex min-h-[3.5rem] items-center justify-between border-y border-[#E6E6E6] px-[0.75rem] text-left"
                    >
                        <span>
                            <span className="block text-[0.875rem] font-semibold leading-[1.25rem] text-[#1A1A1A]">
                                Set as Default
                            </span>
                            <span className="block text-[0.75rem] font-medium leading-[1rem] text-[#B8B8B8]">
                                Bank of America XXXX1502
                            </span>
                        </span>

                        <ChevronRightIcon />
                    </button>

                    <button
                        type="button"
                        onClick={fundTab === "add" ? handleAddMoney : undefined}
                        disabled={fundTab !== "add" || isTopupLoading}
                        className="mx-[0.75rem] mb-[0.75rem] mt-[0.75rem] flex h-[3.5rem] items-center justify-center gap-0 self-stretch rounded-[0.75rem] bg-[#1A1A1A] text-center text-[0.875rem] font-semibold leading-[1.25rem] tracking-[0] text-white shadow-[0_2px_4px_-2px_rgba(0,0,0,0.08),0_4px_8px_-2px_rgba(0,0,0,0.04)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isTopupLoading
                            ? "Redirecting to Stripe..."
                            : fundTab === "add"
                                ? "Add Money"
                                : "Withdraw Money"}
                    </button>
                </aside>
            </section>

            {/* <section className="mt-[1.75rem]">
                <div className="mb-[1.75rem] flex items-center justify-between gap-[1rem]">
                    <h2 className="text-[1.25rem] font-semibold leading-[1.75rem] tracking-[0] text-[#1A1A1A]">
                        Saved Bank Account
                    </h2>

                    <button
                        type="button"
                        className="flex items-center justify-center gap-[0.25rem] self-stretch px-[0.5rem] text-[0.875rem] font-semibold leading-[1.25rem] text-[#1A1A1A]"
                    >
                        <PlusIcon />
                        Add new bank account
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-[1rem] max-lg:grid-cols-1">
                    {savedBankAccounts.map((account) => (
                        <article
                            key={account.accountNumber}
                            className="flex flex-1 flex-col items-start gap-[2.75rem] rounded-[0.75rem] border border-[#E6E6E6] bg-white p-[1rem]"
                        >
                            <div className="flex w-full items-center justify-between gap-[1rem]">
                                <p
                                    className={cn(
                                        "text-[0.875rem] font-bold leading-[1.25rem]",
                                        account.logo === "HSBC" ? "text-[#D71920]" : "text-[#064C9B]"
                                    )}
                                >
                                    {account.logo}
                                </p>

                                {account.isDefault ? (
                                    <span className="rounded-full bg-[#1A1A1A] px-[0.875rem] py-[0.375rem] text-[0.875rem] font-medium leading-[1.25rem] text-white">
                                        Default
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        className="text-[0.75rem] font-semibold leading-[1rem] text-[#1A1A1A] underline"
                                    >
                                        Set as Default
                                    </button>
                                )}
                            </div>

                            <div className="flex w-full flex-col gap-[0.75rem]">
                                <div>
                                    <p className="text-[0.875rem] font-medium leading-[1.25rem] text-[#B8B8B8]">
                                        Bank Name
                                    </p>
                                    <p className="text-[1.25rem] font-medium leading-[1.75rem] text-[#1A1A1A]">
                                        {account.bank}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[0.875rem] font-medium leading-[1.25rem] text-[#B8B8B8]">
                                        IFSC Code
                                    </p>
                                    <p className="text-[1.25rem] font-medium leading-[1.75rem] text-[#1A1A1A]">
                                        {account.ifsc}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[0.875rem] font-medium leading-[1.25rem] text-[#B8B8B8]">
                                        Account Number
                                    </p>
                                    <p className="text-[1.25rem] font-medium leading-[1.75rem] text-[#1A1A1A]">
                                        {account.accountNumber}
                                    </p>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </section> */}

            <section className="mt-[1.75rem]">
                <div className="mb-[1rem] flex items-center justify-between">
                    <h2 className="text-[1.25rem] font-semibold leading-[1.75rem] tracking-[0] text-[#1A1A1A]">
                        Freeze Amount
                    </h2>
                </div>

                <div className="overflow-hidden rounded-[0.75rem] border border-[#E6E6E6] bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[64rem] border-collapse">
                            <thead>
                                <tr className="border-b border-[#E6E6E6] bg-[#F9F9F9]">
                                    <th className="px-[1rem] py-[1rem] text-left text-[0.875rem] font-semibold leading-[1.25rem]">
                                        Campaign ID
                                    </th>
                                    <th className="px-[1rem] py-[1rem] text-left text-[0.875rem] font-semibold leading-[1.25rem]">
                                        Influencer ID
                                    </th>
                                    <th className="px-[1rem] py-[1rem] text-left text-[0.875rem] font-semibold leading-[1.25rem]">
                                        Freeze Amount
                                    </th>
                                    <th className="px-[1rem] py-[1rem] text-left text-[0.875rem] font-semibold leading-[1.25rem]">
                                        Current Frozen
                                    </th>
                                    <th className="px-[1rem] py-[1rem] text-left text-[0.875rem] font-semibold leading-[1.25rem]">
                                        Allocated
                                    </th>
                                    <th className="px-[1rem] py-[1rem] text-left text-[0.875rem] font-semibold leading-[1.25rem]">
                                        Released
                                    </th>
                                    <th className="px-[1rem] py-[1rem] text-left text-[0.875rem] font-semibold leading-[1.25rem]">
                                        Available
                                    </th>
                                    <th className="px-[1rem] py-[1rem] text-right text-[0.875rem] font-semibold leading-[1.25rem]">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-[1rem] py-[2rem] text-center text-[0.875rem] font-medium leading-[1.25rem] text-[#777]"
                                        >
                                            Loading wallet freezes...
                                        </td>
                                    </tr>
                                ) : freezeRows.length ? (
                                    freezeRows.map((freeze, index) => {
                                        const influencerId =
                                            freeze.influencerId ||
                                            freeze.influencerAllocations?.[0]?.influencerId;

                                        const freezeAmount =
                                            freeze.freezeAmount ?? freeze.totalFrozenAmount ?? 0;

                                        return (
                                            <tr
                                                key={`${freeze.campaignId}-${index}`}
                                                className="border-b border-[#E6E6E6] last:border-b-0"
                                            >
                                                <td className="px-[1rem] py-[1rem] text-[0.875rem] font-medium leading-[1.25rem]">
                                                    {shortId(freeze.campaignId)}
                                                </td>

                                                <td className="px-[1rem] py-[1rem] text-[0.875rem] font-medium leading-[1.25rem] text-[#777]">
                                                    {shortId(influencerId)}
                                                </td>

                                                <td className="px-[1rem] py-[1rem] text-[0.875rem] font-medium leading-[1.25rem] text-[#777]">
                                                    {formatMoney(freezeAmount)}
                                                </td>

                                                <td className="px-[1rem] py-[1rem] text-[0.875rem] font-medium leading-[1.25rem] text-[#777]">
                                                    {formatMoney(freeze.currentFrozenAmount ?? 0)}
                                                </td>

                                                <td className="px-[1rem] py-[1rem] text-[0.875rem] font-medium leading-[1.25rem] text-[#777]">
                                                    {formatMoney(freeze.totalAllocatedAmount ?? 0)}
                                                </td>

                                                <td className="px-[1rem] py-[1rem] text-[0.875rem] font-medium leading-[1.25rem] text-[#777]">
                                                    {formatMoney(freeze.totalReleasedAmount ?? 0)}
                                                </td>

                                                <td className="px-[1rem] py-[1rem] text-[0.875rem] font-medium leading-[1.25rem] text-[#777]">
                                                    {formatMoney(freeze.availableToAllocate ?? 0)}
                                                </td>

                                                <td className="px-[1rem] py-[1rem] text-right">
                                                    <button
                                                        type="button"
                                                        className="rounded-[0.5rem] bg-[#1A1A1A] px-[1rem] py-[0.5rem] text-[0.875rem] font-semibold leading-[1.25rem] text-white"
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-[1rem] py-[2rem] text-center text-[0.875rem] font-medium leading-[1.25rem] text-[#777]"
                                        >
                                            No freeze amount found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </main>
    );
}