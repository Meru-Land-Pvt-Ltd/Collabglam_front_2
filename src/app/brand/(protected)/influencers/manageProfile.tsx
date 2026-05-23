

"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import api from "@/lib/api";
import { X } from "@phosphor-icons/react";
import { apiGetInfluencerById } from "../../services/brandApi";

import Header from "./header";
import OverviewTab from "./overview";
import MilestoneAndDeliverablesTab from "./milestoneanddeliverables-tab";
import PaymentTab from "./payment-tab";

import {
    buildInfluencerViewModel,
    ManageTabKey,
} from "./utils";

type ManageProfileProps = {
    influencerId?: string;
};

export default function ManageProfile({ influencerId }: ManageProfileProps) {
    const searchParams = useSearchParams();

    const resolvedInfluencerId =
        influencerId ||
        searchParams.get("influencerId") ||
        searchParams.get("id") ||
        "";

    const [activeTab, setActiveTab] = useState<ManageTabKey>("overview");
    const [manageInfo, setManageInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [pdfUrl, setPdfUrl] = useState("");
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [viewingContractId, setViewingContractId] = useState<string | null>(null);
    const [contractLoading, setContractLoading] = useState(false);

    useEffect(() => {
        if (!resolvedInfluencerId) {
            setLoading(false);
            setError("Influencer id missing.");
            return;
        }

        const fetchInfluencerInfo = async () => {
            try {
                setLoading(true);
                setError("");

                const res = await apiGetInfluencerById(resolvedInfluencerId);
                setManageInfo(res);
            } catch (err) {
                console.error("Failed to fetch influencer info", err);
                setError("Failed to load influencer info");
            } finally {
                setLoading(false);
            }
        };

        fetchInfluencerInfo();
    }, [resolvedInfluencerId]);

    const view = useMemo(() => buildInfluencerViewModel(manageInfo), [manageInfo]);

    useEffect(() => {
        return () => {
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        };
    }, [pdfUrl]);

    const handleViewContract = async () => {
        if (!view.printableContractId) return;

        try {
            setContractLoading(true);

            const res = await api.post(
                "/contract/viewPdf",
                { contractId: view.printableContractId },
                { responseType: "blob" }
            );

            if (pdfUrl) URL.revokeObjectURL(pdfUrl);

            const url = URL.createObjectURL(res.data);
            setPdfUrl(url);
            setViewingContractId(view.printableContractId);
            setShowPdfModal(true);
        } catch (e: any) {
            Swal.fire("Error", e?.message || "Failed to load contract PDF.", "error");
        } finally {
            setContractLoading(false);
        }
    };

    const handleDownloadContract = async () => {
        if (!view.printableContractId) return;

        try {
            setContractLoading(true);

            const res = await api.post(
                "/contract/viewPdf",
                { contractId: view.printableContractId },
                { responseType: "blob" }
            );

            const blob = new Blob([res.data], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = view.contractFileName;
            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(url);
        } catch (e: any) {
            Swal.fire("Error", e?.message || "Failed to download contract PDF.", "error");
        } finally {
            setContractLoading(false);
        }
    };

    const closePdfModal = () => {
        setShowPdfModal(false);
        setViewingContractId(null);

        if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
            setPdfUrl("");
        }
    };

    const renderActiveTab = () => {
        if (activeTab === "overview") {
            return <OverviewTab view={view} />;
        }

        if (activeTab === "milestones") {
            return <MilestoneAndDeliverablesTab view={view} />;
        }

        if (activeTab === "payment") {
            return (
                <PaymentTab
                    view={view}
                    contractLoading={contractLoading}
                    onViewContract={handleViewContract}
                    onDownloadContract={handleDownloadContract}
                />
            );
        }
    };

    if (loading) {
        return (
            <div className="p-6 text-sm text-gray-500">
                Loading influencer details...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-sm text-red-500">
                {error}
            </div>
        );
    }

    return (
        <div
            className="min-h-screen bg-white font-sans"
            style={{ fontFamily: "'Inter', 'DM Sans', 'Nunito', sans-serif" }}
        >
            <Header
                view={view}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            {renderActiveTab()}

            {showPdfModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
                    <div className="h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-5">
                            <div>
                                <p className="text-lg font-semibold text-gray-900">
                                    {view.contractFileName}
                                </p>
                                <p className="mt-0.5 text-xs text-gray-400">
                                    {viewingContractId || "-"}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleDownloadContract}
                                    disabled={contractLoading || !view.printableContractId}
                                    className="h-10 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Download
                                </button>

                                <button
                                    type="button"
                                    onClick={closePdfModal}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="h-[calc(90vh-64px)] bg-[#f5f5f5]">
                            {pdfUrl ? (
                                <iframe
                                    src={pdfUrl}
                                    title="Contract PDF"
                                    className="h-full w-full"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
                                    Loading PDF...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}