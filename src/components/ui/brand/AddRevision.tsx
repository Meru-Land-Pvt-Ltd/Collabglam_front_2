"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CaretRight, X } from "@phosphor-icons/react";

import { Button } from "@/components/ui/buttonComp";
import { FloatingSelect, SelectItem } from "@/components/ui/selectComp";
import { FloatingInput } from "@/components/ui/floatingInput";
import { FloatingDateInput } from "@/components/ui/date";
import { LabeledTextarea } from "@/components/ui/textAreaComp";
import { ProductImagesUpload } from "@/components/ui/upload-card";
import { toast, ToastStyles } from "@/components/ui/toast";

import {
    apiAddRevision,
    getApiErrorMessage,
} from "@/app/brand/services/brandApi";

type RevisionType = "free" | "paid";

type AddRevisionPayload = {
    milestoneId: string;
    milestoneHistoryId: string;
    deliverableId: string;

    milestoneTitle: string;
    deliverableName: string;

    issueName: string;
    revisionType: RevisionType;
    revisionBudget: number;
    deliveryName: string;
    issueDeliverableLink: string;
    notes: string;
    files: File[];
    submissionDate: string;
};

type AddRevisionSuccessPayload = {
    requestPayload: AddRevisionPayload;
    response: any;
};

type AddRevisionProps = {
    open: boolean;
    onClose: () => void;
    milestone?: any;
    deliverable?: any;
    onSubmit?: (payload: AddRevisionSuccessPayload) => void | Promise<void>;
};

const getText = (value: any, fallback = "") => {
    if (value === undefined || value === null) return fallback;
    const text = String(value).trim();
    return text || fallback;
};

const getDeliverableId = (item: any) => {
    return getText(
        item?.deliverableId ||
        item?._id ||
        item?.id ||
        item?.raw?.deliverableId ||
        item?.raw?._id ||
        item?.raw?.id
    );
};

const getMilestoneId = (milestone: any, deliverable: any) => {
    return getText(
        milestone?.milestoneId ||
        milestone?.raw?.milestoneId ||
        deliverable?.milestoneId ||
        deliverable?.raw?.milestoneId
    );
};

const getMilestoneHistoryId = (milestone: any, deliverable: any) => {
    return getText(
        milestone?.milestoneHistoryId ||
        milestone?.raw?.milestoneHistoryId ||
        milestone?._id ||
        milestone?.raw?._id ||
        deliverable?.milestoneHistoryId ||
        deliverable?.raw?.milestoneHistoryId
    );
};

const normalizeRevisionAttachmentForPayload = (item: any) => {
    if (!item) return null;

    if (typeof File !== "undefined" && item instanceof File) {
        return {
            name: item.name,
            type: item.type,
            size: item.size,
            url: "",
            key: "",
        };
    }

    if (typeof item === "string") {
        return {
            name: "",
            url: item,
            type: "",
            size: 0,
            key: "",
        };
    }

    return {
        name: item?.name || item?.fileName || item?.label || "",
        url: item?.url || item?.link || item?.path || "",
        type: item?.type || item?.mimeType || "",
        size: Number(item?.size || 0),
        key: item?.key || "",
    };
};

export default function AddRevision({
    open,
    onClose,
    milestone,
    deliverable,
    onSubmit,
}: AddRevisionProps) {
    const [issueName, setIssueName] = useState("");
    const [revisionType, setRevisionType] = useState<RevisionType>("free");
    const [revisionBudget, setRevisionBudget] = useState("");
    const [issueDeliverableLink, setIssueDeliverableLink] = useState("");
    const [notes, setNotes] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [submissionDate, setSubmissionDate] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const milestoneTitle = useMemo(() => {
        return getText(
            milestone?.name ||
            milestone?.milestoneTitle ||
            milestone?.raw?.milestoneTitle ||
            deliverable?.milestoneTitle ||
            deliverable?.raw?.milestoneTitle,
            "Milestone"
        );
    }, [milestone, deliverable]);

    const deliverableName = useMemo(() => {
        return getText(
            deliverable?.deliverableName ||
            deliverable?.title ||
            deliverable?.name ||
            deliverable?.raw?.deliverableName ||
            deliverable?.raw?.title,
            "Deliverable"
        );
    }, [deliverable]);

    const deliveryName = `${deliverableName} (Revision)`;

    useEffect(() => {
        if (!open) return;

        setIssueName("");
        setRevisionType("free");
        setRevisionBudget("");
        setIssueDeliverableLink("");
        setNotes("");
        setFiles([]);
        setSubmissionDate("");
        setSubmitting(false);
    }, [open]);

    useEffect(() => {
        if (revisionType === "free") {
            setRevisionBudget("");
        }
    }, [revisionType]);

    useEffect(() => {
        if (!open) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !submitting) {
                onClose();
            }
        };

        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleEscape);

        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleEscape);
        };
    }, [open, submitting, onClose]);

    if (!open) return null;

    const handleSubmit = async () => {
        const milestoneId = getMilestoneId(milestone, deliverable);
        const milestoneHistoryId = getMilestoneHistoryId(milestone, deliverable);
        const deliverableId = getDeliverableId(deliverable);

        if (!milestoneId || !milestoneHistoryId || !deliverableId) {
            toast({
                icon: "warning",
                title: "Revision unavailable",
                text: "Missing milestone or deliverable details.",
            });
            return;
        }

        if (!issueName.trim()) {
            toast({
                icon: "warning",
                title: "Issue name required",
                text: "Please enter an issue name.",
            });
            return;
        }

        if (revisionType === "paid") {
            const budgetNum = Number(revisionBudget);

            if (!revisionBudget || Number.isNaN(budgetNum) || budgetNum <= 0) {
                toast({
                    icon: "warning",
                    title: "Revision budget required",
                    text: "Please enter a valid revision budget.",
                });
                return;
            }
        }

        if (!issueDeliverableLink.trim()) {
            toast({
                icon: "warning",
                title: "Issue deliverable link required",
                text: "Please enter the issue deliverable link.",
            });
            return;
        }

        if (!submissionDate) {
            toast({
                icon: "warning",
                title: "Submission date required",
                text: "Please select a submission date.",
            });
            return;
        }

        try {
            setSubmitting(true);

            const requestPayload: AddRevisionPayload = {
                milestoneId,
                milestoneHistoryId,
                deliverableId,

                milestoneTitle,
                deliverableName,

                issueName: issueName.trim(),
                revisionType,
                revisionBudget:
                    revisionType === "paid" ? Number(revisionBudget) : 0,
                deliveryName,
                issueDeliverableLink: issueDeliverableLink.trim(),
                notes: notes.trim(),
                files,
                submissionDate,
            };

            const attachments = files
                .map(normalizeRevisionAttachmentForPayload)
                .filter(Boolean);

            const response = await apiAddRevision({
                milestoneId: requestPayload.milestoneId,
                milestoneHistoryId: requestPayload.milestoneHistoryId,
                deliverableId: requestPayload.deliverableId,

                issueName: requestPayload.issueName,
                revisionType: requestPayload.revisionType,
                revisionBudget: requestPayload.revisionBudget,

                deliveryName: requestPayload.deliveryName,
                issueDeliverableLink: requestPayload.issueDeliverableLink,
                notes: requestPayload.notes,

                attachments,
                submissionDate: requestPayload.submissionDate,
                raisedByRole: "Brand",
            });

            await onSubmit?.({
                requestPayload,
                response,
            });

            toast({
                icon: "success",
                title: "Revision raised",
                text: "The revision request has been created successfully.",
            });

            onClose();
        } catch (err: any) {
            toast({
                icon: "error",
                title: "Revision not raised",
                text: getApiErrorMessage(err, "Failed to raise revision."),
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <ToastStyles />

            <div
                className="fixed inset-0 z-50 flex h-screen items-center justify-end overflow-hidden bg-[rgba(1,1,1,0.30)] px-5 py-3"
                onClick={() => {
                    if (!submitting) onClose();
                }}
            >
                <div
                    className="flex h-[calc(100vh-1.5rem)] w-[44rem] max-w-[calc(100vw-2.5rem)] animate-[slideInRight_220ms_ease-out] flex-col overflow-hidden rounded-[1rem] bg-white shadow-[0_24px_40px_-4px_rgba(0,0,0,0.16),0_0_12px_0_rgba(0,0,0,0.08)]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <style jsx global>{`
            @keyframes slideInRight {
              from {
                opacity: 0;
                transform: translateX(32px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
          `}</style>

                    <div className="flex shrink-0 items-center justify-between border-b border-[#E6E6E6] px-7 py-5">
                        <h2 className="font-['Inter'] text-xl font-semibold leading-7 text-[#1A1A1A]">
                            Raise Revision
                        </h2>

                        <button
                            type="button"
                            aria-label="Close"
                            disabled={submitting}
                            onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#1A1A1A] transition hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-7 py-5">
                        <div className="mb-5 flex min-w-0 items-center gap-2 font-['Inter'] text-sm leading-5">
                            <span className="truncate text-[#B8B8B8]">{milestoneTitle}</span>
                            <CaretRight size={14} className="shrink-0 text-[#969696]" />
                            <span className="truncate font-medium text-[#1A1A1A]">
                                {deliverableName}
                            </span>
                        </div>

                        <div className="flex flex-col gap-3">
                            <FloatingInput
                                label="Issue name"
                                required
                                value={issueName}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setIssueName(e.target.value)
                                }
                                className="min-h-[3.875rem] w-full rounded-xl border-[#D6D6D6]"
                            />

                            <div className="flex w-full items-stretch gap-3">
                                <div className="flex-1">
                                    <FloatingSelect
                                        label="Revision Type"
                                        required
                                        value={revisionType}
                                        onValueChange={(value) => setRevisionType(value as RevisionType)}
                                        searchable={false}
                                        disabled={submitting}
                                    >
                                        <SelectItem value="free">Free</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                    </FloatingSelect>
                                </div>

                                <FloatingInput
                                    label="Revision Budget"
                                    required={revisionType === "paid"}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={revisionBudget}
                                    disabled={revisionType === "free" || submitting}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setRevisionBudget(e.target.value)
                                    }
                                    className="flex-1 rounded-[0.75rem] border-[#D6D6D6] disabled:bg-[#F9F9F9] disabled:text-[#B8B8B8]"
                                />
                            </div>

                            <FloatingInput
                                label="Delivery Name"
                                value={deliveryName}
                                disabled
                                className="min-h-[3.875rem] w-full rounded-xl border-[#D6D6D6] bg-[#F9F9F9] text-[#969696]"
                            />

                            <FloatingInput
                                label="Issue Deliverable Link"
                                required
                                value={issueDeliverableLink}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setIssueDeliverableLink(e.target.value)
                                }
                                className="min-h-[3.875rem] w-full rounded-xl border-[#D6D6D6]"
                            />

                            <LabeledTextarea
                                label="Notes"
                                placeholder="Describe the revision issue..."
                                rows={7}
                                maxLength={500}
                                showCharCount
                                value={notes}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                    setNotes(e.target.value)
                                }
                                className="min-h-[10.5rem] rounded-xl border-[#D6D6D6]"
                            />

                            <ProductImagesUpload
                                files={files}
                                onFilesChange={(nextFiles) => setFiles(nextFiles)}
                                title="Upload an Image"
                                helperTypes="SVG, PNG, JPG or PDF under (max 5mb)"
                            />

                            <FloatingDateInput
                                id="revision-submission-date"
                                label="Submission Date"
                                required
                                type="date"
                                value={submissionDate}
                                onValueChange={(value) => setSubmissionDate(value)}
                            />
                        </div>
                    </div>

                    <div className="flex shrink-0 justify-end gap-2 border-t border-[#E6E6E6] px-7 py-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={submitting}
                            className="h-10 rounded-lg px-7 text-sm font-medium text-[#4D4D4D] hover:bg-[#F5F5F5]"
                        >
                            Cancel
                        </Button>

                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="h-10 rounded-lg bg-[#1A1A1A] px-7 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? "Raising..." : "Raise Revision"}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}