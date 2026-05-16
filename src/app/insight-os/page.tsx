"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, Sparkles, Youtube } from "lucide-react";
import axios from "axios";

type ApiResponse = {
  success: boolean;
  message?: string;
  data?: unknown;
};

type PlainObject = Record<string, unknown>;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const REPORT_STORAGE_KEY = "youtubeInsightReport";
const REPORT_ID_STORAGE_KEY = "youtubeInsightReportId";

function isObject(value: unknown): value is PlainObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractFrontendReport(payload: unknown): PlainObject | null {
  if (!isObject(payload)) return null;
  if (isObject(payload.frontendReport)) return payload.frontendReport;
  if (isObject(payload.dashboard)) return payload.dashboard;
  if (isObject(payload.data)) return extractFrontendReport(payload.data) || payload.data;
  return payload;
}

function extractReportId(payload: unknown): string {
  if (!isObject(payload)) return "";
  const directId = payload.reportId || payload._id || payload.id;
  if (typeof directId === "string") return directId;
  if (isObject(payload.data)) return extractReportId(payload.data);
  if (isObject(payload.frontendReport)) return extractReportId(payload.frontendReport);
  if (isObject(payload.dashboard)) return extractReportId(payload.dashboard);
  return "";
}

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || localStorage.getItem("adminToken") || localStorage.getItem("accessToken") || "";
}

export default function YoutubeInsightAnalyzePage(): React.ReactElement {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleAnalyze = async (): Promise<void> => {
    try {
      setError("");
      const cleanUrl = videoUrl.trim();

      if (!cleanUrl) {
        setError("Please enter a YouTube video link.");
        return;
      }

      setLoading(true);
      const token = getToken();

      const response = await axios.post<ApiResponse>(
        `${API_BASE_URL}/youtube-insights/analyze`,
        { videoUrl: cleanUrl },
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || "Failed to analyze video.");
      }

      const backendData = response.data.data;
      const frontendReport = extractFrontendReport(backendData);
      const reportId = extractReportId(backendData);

      if (!frontendReport) {
        throw new Error("Backend response does not contain report data.");
      }

      sessionStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(frontendReport));
      if (reportId) sessionStorage.setItem(REPORT_ID_STORAGE_KEY, reportId);

      router.push(reportId ? `/insight-os/report?reportId=${reportId}` : "/insight-os/report");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong while analyzing the video.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-8 text-slate-950 md:px-6 md:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-br from-white via-white to-red-50 px-6 py-8 md:px-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="flex gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <Youtube className="h-7 w-7" />
                </div>

                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI YouTube Public Insight
                  </div>

                  <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
                    YouTube Creator Insight
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Paste only one YouTube video link. The report will use public video, channel, comments, recent uploads, estimated watch time, creator category, and AI recommendations.
                  </p>
                </div>
              </div>

              <div className="grid gap-2 text-xs text-slate-500">
                {["Public YouTube stats", "Top comments & sentiment", "Creator category and use cases", "Estimated watch time"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[1fr_320px]">
            <section className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  YouTube Video Link <span className="text-red-500">*</span>
                </label>
                <input
                  value={videoUrl}
                  onChange={(event) => setVideoUrl(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !loading) void handleAnalyze();
                  }}
                  placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950"
                />
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  No campaign name, brand name, cost, ROI, or manual inputs are required.
                </p>
              </div>

              {error ? <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div> : null}

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing Public YouTube Data...
                  </>
                ) : (
                  <>
                    Generate YouTube Insight
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </section>

            <aside className="rounded-3xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-bold text-slate-950">Report Includes</h2>
              <div className="mt-5 space-y-4 text-sm text-slate-600">
                {[
                  "Channel subscribers, views, total videos",
                  "Video views, likes, comments, duration",
                  "Estimated retention and watch time",
                  "Top comments and comment categories",
                  "Influencer category and best use cases",
                  "Creator average comparison",
                  "Estimated YouTube revenue",
                ].map((item) => (
                  <div key={item} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-xs leading-5 text-amber-800">
                Public reports cannot access actual watch time, retention, CTR, audience age/gender, traffic sources, or total channel likes. Those require creator YouTube Analytics OAuth.
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
