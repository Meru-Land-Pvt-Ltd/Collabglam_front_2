"use client";

import React, { useState } from "react";
import { Copy, Download, Loader2 } from "lucide-react";
import { copyInsightOsPublicLink } from "@/lib/insightOsShare";
import { downloadInsightOsReportPdf } from "@/lib/insightOsPdf";

type InsightOsReportActionsProps = {
  reportId?: string;
  reportSnapshot?: unknown;
  sourceContext?: "public_insight_os" | "brand_insight_os";
  pdfRootSelector?: string;
  pdfFileName?: string;
  className?: string;
};

export default function InsightOsReportActions({
  reportId,
  reportSnapshot,
  sourceContext = "public_insight_os",
  pdfRootSelector = "#insight-os-report-print-root",
  pdfFileName = "insight-os-report.pdf",
  className = "",
}: InsightOsReportActionsProps): React.ReactElement {
  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState("");

  const handleCopy = async (): Promise<void> => {
    try {
      setMessage("");
      setCopying(true);
      const url = await copyInsightOsPublicLink({ reportId, reportSnapshot, sourceContext });
      setMessage(`Copied public link: ${url}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to copy public link.");
    } finally {
      setCopying(false);
    }
  };

  const handleDownload = async (): Promise<void> => {
    try {
      setMessage("");
      setDownloading(true);
      await downloadInsightOsReportPdf({ selector: pdfRootSelector, filename: pdfFileName });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to download PDF.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void handleCopy()}
          disabled={copying}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[#E6E6E6] bg-white px-4 text-xs font-semibold text-[#1E1E1E] transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {copying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
          {copying ? "Creating link" : "Copy Link"}
        </button>

        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={downloading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#111111] px-4 text-xs font-semibold text-white transition hover:bg-[#252525] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {downloading ? "Generating PDF" : "Download PDF"}
        </button>
      </div>

      {message ? <p className="max-w-[520px] text-xs font-semibold text-[#6E737D]">{message}</p> : null}
    </div>
  );
}
