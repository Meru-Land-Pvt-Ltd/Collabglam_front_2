"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loadInsightOsPublicReport } from "@/lib/insightOsShare";

type PublicInsightReportLoaderProps = {
  children: (report: unknown) => React.ReactNode;
  fallback?: React.ReactNode;
};

export default function PublicInsightReportLoader({
  children,
  fallback = <div className="p-6 text-sm font-semibold text-[#6E737D]">Loading public report...</div>,
}: PublicInsightReportLoaderProps): React.ReactElement {
  const searchParams = useSearchParams();
  const shareToken = searchParams.get("share") || searchParams.get("token") || "";
  const [report, setReport] = useState<unknown>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const run = async (): Promise<void> => {
      if (!shareToken) return;

      try {
        setError("");
        const loaded = await loadInsightOsPublicReport(shareToken);
        if (!cancelled) setReport(loaded);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load public report.");
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [shareToken]);

  if (error) {
    return <div className="rounded-[12px] border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">{error}</div>;
  }

  if (shareToken && !report) return <>{fallback}</>;
  if (report) return <>{children(report)}</>;

  return <>{children(null)}</>;
}
