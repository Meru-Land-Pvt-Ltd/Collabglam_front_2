import { Suspense } from "react";
import YoutubeInsightReportPageClient from "@/app/insight-os/report/YoutubeInsightReportPageClient";

export default function BrandInsightReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <YoutubeInsightReportPageClient />
    </Suspense>
  );
}