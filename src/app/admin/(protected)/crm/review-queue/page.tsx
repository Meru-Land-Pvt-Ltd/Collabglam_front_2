"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { adminGet, adminPost } from "@/lib/api";

type ApiState = { type: "success" | "error" | "info"; text: string } | null;

type AdminOption = {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
};

type ReviewRow = {
  _id: string;
  campaignId?: { _id?: string; name?: string } | null;
  prospectId: {
    _id: string;
    companyName?: string;
    primaryContact?: { name?: string; email?: string };
    reply?: { snippet?: string; subject?: string };
    stage?: string;
  } | null;
  sdrId?: { _id?: string; name?: string; email?: string } | null;
  RHId?: { _id?: string; name?: string; email?: string } | null;
  assignedBmeId?: { _id?: string; name?: string; email?: string } | null;
  latestReplySnippet?: string;
  latestReplySubject?: string;
  reviewStatus?: string;
  disposition?: string;
  reviewerNotes?: string;
  createdAt?: string;
};

type ThreadRow = {
  _id: string;
  prospectId?: { _id?: string } | null;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatShortDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getAdminLabel(admin: any) {
  if (!admin) return "—";
  if (typeof admin === "string") return admin;
  if (admin.name && admin.email) return `${admin.name} (${admin.email})`;
  return admin.name || admin.email || admin._id || "—";
}

function getStagePillClasses(stage?: string) {
  const value = String(stage || "").toLowerCase();
  if (value.includes("replied")) return "bg-blue-50 text-blue-700 border-blue-200";
  if (value.includes("assigned_to_bme")) return "bg-violet-50 text-violet-700 border-violet-200";
  if (value.includes("assigned_to_ime")) return "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200";
  if (value.includes("unqualified")) return "bg-red-50 text-red-700 border-red-200";
  if (value.includes("qualified")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
}

function parseAdminRows(payload: any): AdminOption[] {
  const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
  return rows
    .filter(Boolean)
    .map((item: any) => ({
      _id: String(item?._id || ""),
      name: item?.name || "",
      email: item?.email || "",
      role: item?.role || "",
    }))
    .filter((item: AdminOption) => item._id);
}

function parsePendingReplies(payload: any): ReviewRow[] {
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows.map((item: any) => ({
    _id: String(item?._id || ""),
    campaignId: item?.campaignId
      ? { _id: String(item.campaignId?._id || ""), name: item.campaignId?.name || "" }
      : null,
    prospectId: item?.prospectId
      ? {
          _id: String(item.prospectId?._id || ""),
          companyName: item.prospectId?.companyName || "",
          primaryContact: item.prospectId?.primaryContact || {},
          reply: item.prospectId?.reply || {},
          stage: item.prospectId?.stage || "",
        }
      : null,
    sdrId: item?.sdrId || null,
    RHId: item?.RHId || null,
    assignedBmeId: item?.assignedBmeId || null,
    latestReplySnippet: item?.latestReplySnippet || "",
    latestReplySubject: item?.latestReplySubject || "",
    reviewStatus: item?.reviewStatus || "",
    disposition: item?.disposition || "",
    reviewerNotes: item?.reviewerNotes || "",
    createdAt: item?.createdAt || "",
  }));
}

function parseThreads(payload: any): ThreadRow[] {
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows.map((item: any) => ({
    _id: String(item?._id || ""),
    prospectId: item?.prospectId ? { _id: String(item.prospectId?._id || "") } : null,
  }));
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col justify-center rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export default function ReviewQueuePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<ApiState>(null);
  const [pendingReplies, setPendingReplies] = useState<ReviewRow[]>([]);
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [bmeOptions, setBmeOptions] = useState<AdminOption[]>([]);
  const [actorRole, setActorRole] = useState("");
  const [selectedReviewId, setSelectedReviewId] = useState("");
  const [selectedBmeId, setSelectedBmeId] = useState("");
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [submittingKey, setSubmittingKey] = useState("");
  const [search, setSearch] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("");
  const [sdrFilter, setSdrFilter] = useState("");
  const [bmeFilter, setBmeFilter] = useState("");
  const [rhFilter, setRhFilter] = useState("");

  const canFilterByRh = actorRole === "super_admin";
  const canFilterBySdr = actorRole === "super_admin" || actorRole === "revenue_head";
  const canFilterByBme = actorRole === "super_admin" || actorRole === "revenue_head";

  const campaignOptions = useMemo(() => {
    const map = new Map<string, { _id: string; name: string }>();
    pendingReplies.forEach((item) => {
      const id = String(item.campaignId?._id || "");
      if (!id) return;
      map.set(id, { _id: id, name: item.campaignId?.name || "Unnamed Campaign" });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [pendingReplies]);

  const sdrFilterOptions = useMemo(() => {
    const map = new Map<string, AdminOption>();
    pendingReplies.forEach((item) => {
      const id = String(item.sdrId?._id || "");
      if (!id) return;
      map.set(id, { _id: id, name: item.sdrId?.name || "", email: item.sdrId?.email || "", role: "sdr" });
    });
    return Array.from(map.values()).sort((a, b) => getAdminLabel(a).localeCompare(getAdminLabel(b)));
  }, [pendingReplies]);

  const rhFilterOptions = useMemo(() => {
    const map = new Map<string, AdminOption>();
    pendingReplies.forEach((item) => {
      const id = String(item.RHId?._id || "");
      if (!id) return;
      map.set(id, { _id: id, name: item.RHId?.name || "", email: item.RHId?.email || "", role: "revenue_head" });
    });
    return Array.from(map.values()).sort((a, b) => getAdminLabel(a).localeCompare(getAdminLabel(b)));
  }, [pendingReplies]);

  const bmeFilterOptions = useMemo(() => {
    const map = new Map<string, AdminOption>();
    pendingReplies.forEach((item) => {
      const id = String(item.assignedBmeId?._id || "");
      if (!id) return;
      map.set(id, { _id: id, name: item.assignedBmeId?.name || "", email: item.assignedBmeId?.email || "", role: "bme" });
    });
    return Array.from(map.values()).sort((a, b) => getAdminLabel(a).localeCompare(getAdminLabel(b)));
  }, [pendingReplies]);

  const filteredReplies = useMemo(() => {
    const query = search.trim().toLowerCase();
    return pendingReplies.filter((item) => {
      const haystack = [
        item.campaignId?.name,
        item.prospectId?.companyName,
        item.prospectId?.primaryContact?.name,
        item.prospectId?.primaryContact?.email,
        item.latestReplySubject,
        item.latestReplySnippet,
        item.prospectId?.stage,
        item.sdrId?.name,
        item.sdrId?.email,
        item.RHId?.name,
        item.RHId?.email,
        item.assignedBmeId?.name,
        item.assignedBmeId?.email,
      ].filter(Boolean).join(" ").toLowerCase();

      const matchesSearch = !query || haystack.includes(query);
      const matchesCampaign = !campaignFilter || String(item.campaignId?._id || "") === campaignFilter;
      const matchesSdr = !sdrFilter || String(item.sdrId?._id || "") === sdrFilter;
      const matchesBme = !bmeFilter || String(item.assignedBmeId?._id || "") === bmeFilter;
      const matchesRh = !rhFilter || String(item.RHId?._id || "") === rhFilter;

      return matchesSearch && matchesCampaign && matchesSdr && matchesBme && matchesRh;
    });
  }, [pendingReplies, search, campaignFilter, sdrFilter, bmeFilter, rhFilter]);

  const selectedReview = useMemo(
    () => filteredReplies.find((item) => item._id === selectedReviewId) || pendingReplies.find((item) => item._id === selectedReviewId) || null,
    [filteredReplies, pendingReplies, selectedReviewId]
  );

  const selectedThreadId = useMemo(() => {
    const prospectId = String(selectedReview?.prospectId?._id || "");
    if (!prospectId) return "";
    const match = threads.find((item) => String(item?.prospectId?._id || "") === prospectId);
    return match?._id || "";
  }, [selectedReview, threads]);

  const repliedCount = useMemo(() => pendingReplies.filter((item) => String(item?.prospectId?.stage || "").toLowerCase().includes("reply")).length, [pendingReplies]);

  async function loadBmeOptions(review: ReviewRow | null, currentActorRole: string, explicitRhId = "") {
    try {
      const params: Record<string, string> = { role: "bme" };
      const scopedRhId = explicitRhId || (currentActorRole !== "super_admin" ? String(review?.RHId?._id || "") : "");
      if (scopedRhId) params.RHId = scopedRhId;
      const payload: any = await adminGet("/admins/get-executive-list", params);
      setBmeOptions(parseAdminRows(payload));
    } catch {
      setBmeOptions([]);
    }
  }

  async function loadPage(showLoader = true) {
    try {
      if (showLoader) setLoading(true);
      setMessage(null);
      const [repliesPayload, threadsPayload, mePayload] = await Promise.all([
        adminGet("/outreach/replies/pending"),
        adminGet("/outreach/threads"),
        adminGet("/admins/me"),
      ]);
      const nextReplies = parsePendingReplies(repliesPayload);
      const nextRole = String(mePayload?.role || "").toLowerCase();
      setPendingReplies(nextReplies);
      setThreads(parseThreads(threadsPayload));
      setActorRole(nextRole);

      const prospectIdFromQuery = String(searchParams.get("prospectId") || "");
      let nextSelectedId = "";
      if (prospectIdFromQuery) {
        const match = nextReplies.find((item) => String(item?.prospectId?._id || "") === prospectIdFromQuery);
        if (match?._id) nextSelectedId = match._id;
      }
      if (!nextSelectedId && selectedReviewId && nextReplies.some((item) => item._id === selectedReviewId)) nextSelectedId = selectedReviewId;
      if (!nextSelectedId) nextSelectedId = nextReplies[0]?._id || "";
      setSelectedReviewId(nextSelectedId);
      const selected = nextReplies.find((item) => item._id === nextSelectedId) || null;
      await loadBmeOptions(selected, nextRole, nextRole === "super_admin" ? rhFilter : "");
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to load review queue" });
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  useEffect(() => { loadPage(true); }, []);
  useEffect(() => {
    if (selectedReview) {
      setReviewerNotes(selectedReview.reviewerNotes || "");
      setSelectedBmeId(selectedReview.assignedBmeId?._id || "");
    } else {
      setReviewerNotes("");
      setSelectedBmeId("");
    }
  }, [selectedReview]);

  useEffect(() => {
    if (!selectedReview || !actorRole) return;
    loadBmeOptions(selectedReview, actorRole, actorRole === "super_admin" ? rhFilter : "");
  }, [selectedReviewId, actorRole, rhFilter]);

  async function handleAssignToBme() {
    try {
      if (!selectedReview?._id) throw new Error("Select a review first");
      if (!selectedBmeId) throw new Error("Select a BME");
      setSubmittingKey("assign");
      setMessage(null);
      const payload: any = await adminPost(`/outreach/replies/${selectedReview._id}/assign-bme`, {
        assignedBmeId: selectedBmeId,
        reviewerNotes: reviewerNotes.trim(),
      });
      if (payload?.success === false) throw new Error(payload?.message || "Failed to assign BME");
      setMessage({ type: "success", text: payload?.message || "Reply assigned to BME successfully" });
      setSelectedBmeId("");
      setReviewerNotes("");
      await loadPage(false);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to assign BME" });
    } finally {
      setSubmittingKey("");
    }
  }

  async function handleReject() {
    try {
      if (!selectedReview?._id) throw new Error("Select a review first");
      setSubmittingKey("reject");
      setMessage(null);
      const payload: any = await adminPost(`/outreach/replies/${selectedReview._id}/reject`, {
        disposition: "not_relevant",
        reviewerNotes: reviewerNotes.trim(),
      });
      if (payload?.success === false) throw new Error(payload?.message || "Failed to reject reply");
      setMessage({ type: "success", text: payload?.message || "Reply marked unqualified" });
      setReviewerNotes("");
      await loadPage(false);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to reject reply" });
    } finally {
      setSubmittingKey("");
    }
  }

  if (actorRole && actorRole !== "revenue_head" && actorRole !== "super_admin") {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">Review Queue is only available for Revenue Head and Super Admin.</div>;
  }

  const canAssign = Boolean(selectedReview && selectedBmeId && submittingKey === "");
  const canReject = Boolean(selectedReview && submittingKey === "");

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col space-y-4 font-sans">
      {message && (
        <div className={cx("rounded-md border px-4 py-3 text-sm font-medium", message.type === "success" && "border-green-200 bg-green-50 text-green-800", message.type === "error" && "border-red-200 bg-red-50 text-red-800", message.type === "info" && "border-blue-200 bg-blue-50 text-blue-800")}>{message.text}</div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Pending Reviews" value={pendingReplies.length} />
        <MetricCard label="Replied Leads" value={repliedCount} />
        <MetricCard label="BME Options" value={bmeOptions.length} />
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <aside className="flex w-full flex-col border-r border-gray-200 bg-gray-50/30 xl:w-[420px]">
          <div className="border-b border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900">Review Queue</h2>
            <div className="mt-3 relative">
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search brand, contact, subject..." className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]" />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <select value={campaignFilter} onChange={(e) => setCampaignFilter(e.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]">
                <option value="">All Campaigns</option>
                {campaignOptions.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
              </select>
              {canFilterBySdr && <select value={sdrFilter} onChange={(e) => setSdrFilter(e.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"><option value="">All SDRs</option>{sdrFilterOptions.map((item) => <option key={item._id} value={item._id}>{getAdminLabel(item)}</option>)}</select>}
              {canFilterByBme && <select value={bmeFilter} onChange={(e) => setBmeFilter(e.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"><option value="">All BMEs</option>{bmeFilterOptions.map((item) => <option key={item._id} value={item._id}>{getAdminLabel(item)}</option>)}</select>}
              {canFilterByRh && <select value={rhFilter} onChange={(e) => setRhFilter(e.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"><option value="">All RHs</option>{rhFilterOptions.map((item) => <option key={item._id} value={item._id}>{getAdminLabel(item)}</option>)}</select>}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? <div className="p-8 text-center text-sm text-gray-500">Loading queue...</div> : filteredReplies.length === 0 ? <div className="p-8 text-center text-sm text-gray-500">Queue is empty.</div> : <ul className="divide-y divide-gray-100">{filteredReplies.map((item) => {
              const active = item._id === selectedReviewId;
              const companyName = item.prospectId?.companyName || "Unknown Company";
              const contactName = item.prospectId?.primaryContact?.name || "Unknown Contact";
              return <li key={item._id}><button onClick={() => setSelectedReviewId(item._id)} className={cx("w-full text-left p-4 transition-colors hover:bg-gray-100/50", active ? "relative bg-gray-100" : "bg-white")}>{active && <div className="absolute bottom-0 left-0 top-0 w-1 bg-[#1a1a1a]" />}<div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-[#1a1a1a]">{getInitials(companyName)}</div><div className="min-w-0 flex-1"><div className="mb-0.5 flex items-start justify-between"><p className="truncate text-sm font-semibold text-gray-900">{companyName}</p><span className="ml-2 shrink-0 text-xs text-gray-500">{formatShortDate(item.createdAt)}</span></div><p className="truncate text-xs text-gray-600">{contactName}</p><p className="mt-1 truncate text-xs font-medium text-gray-500">Campaign: {item.campaignId?.name || "—"}</p><p className="mt-1.5 truncate text-sm font-medium text-gray-800">{item.latestReplySubject || item.prospectId?.reply?.subject || "(No subject)"}</p><p className="truncate text-xs text-gray-500">{item.latestReplySnippet || item.prospectId?.reply?.snippet || "—"}</p></div></div></button></li>;
            })}</ul>}
          </div>
        </aside>
        <main className="flex min-w-0 flex-1 flex-col bg-white">
          {!selectedReview ? <div className="flex h-full items-center justify-center p-8 text-sm text-gray-400"><p>Select an item from the queue to review</p></div> : <>
            <div className="flex shrink-0 items-start justify-between border-b border-gray-200 bg-white px-6 py-4">
              <div className="min-w-0">
                <h3 className="text-xl font-semibold text-gray-900">{selectedReview.prospectId?.companyName || "Unknown Company"}</h3>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500"><span>{selectedReview.prospectId?.primaryContact?.name || "—"}</span><span>&bull;</span><a href={`mailto:${selectedReview.prospectId?.primaryContact?.email}`} className="font-medium text-[#1a1a1a] hover:underline">{selectedReview.prospectId?.primaryContact?.email || "—"}</a></div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2"><span className={cx("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium", getStagePillClasses(selectedReview.prospectId?.stage))}>{selectedReview.prospectId?.stage?.replace(/_/g, " ") || "No Stage"}</span><button onClick={() => router.push(selectedThreadId ? `/admin/crm/replies?threadId=${selectedThreadId}` : `/admin/crm/replies?prospectId=${selectedReview.prospectId?._id || ""}`)} className="flex items-center gap-1 text-xs font-medium text-gray-500 underline underline-offset-2 hover:text-[#1a1a1a]">Open Full Thread<svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></button></div>
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto bg-gray-50/50 p-6">
              <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Campaign</p><p className="mt-1 text-sm font-medium text-gray-900">{selectedReview.campaignId?.name || "—"}</p></div>
                <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">SDR</p><p className="mt-1 text-sm font-medium text-gray-900">{getAdminLabel(selectedReview.sdrId)}</p></div>
                <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Revenue Head</p><p className="mt-1 text-sm font-medium text-gray-900">{getAdminLabel(selectedReview.RHId)}</p></div>
                <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Assigned BME</p><p className="mt-1 text-sm font-medium text-gray-900">{getAdminLabel(selectedReview.assignedBmeId)}</p></div>
              </div>
              <div className="mx-auto max-w-4xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"><div className="border-b border-gray-100 bg-gray-50 px-5 py-3"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-gray-900">Latest Lead Reply</p><span className="text-xs text-gray-500">{formatDateTime(selectedReview.createdAt)}</span></div><p className="mt-2 text-sm text-gray-900"><span className="mr-2 font-medium text-gray-500">Subject:</span>{selectedReview.latestReplySubject || selectedReview.prospectId?.reply?.subject || "(No subject)"}</p></div><div className="whitespace-pre-wrap px-5 py-4 text-sm leading-relaxed text-gray-800">{selectedReview.latestReplySnippet || selectedReview.prospectId?.reply?.snippet || "—"}</div></div>
            </div>
            <div className="shrink-0 border-t border-gray-200 bg-white p-6"><div className="mx-auto max-w-4xl"><h4 className="mb-4 text-sm font-semibold text-gray-900">Decision & Assignment</h4><div className="flex flex-col gap-4 sm:flex-row"><div className="w-full sm:w-1/3"><label className="mb-1.5 block text-xs font-medium text-gray-700">Assign to BME</label><select value={selectedBmeId} onChange={(e) => setSelectedBmeId(e.target.value)} disabled={bmeOptions.length === 0} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a] disabled:bg-gray-50 disabled:text-gray-500"><option value="">{bmeOptions.length === 0 ? "No BME available" : "Select BME..."}</option>{bmeOptions.map((admin) => <option key={admin._id} value={admin._id}>{getAdminLabel(admin)}</option>)}</select></div><div className="w-full flex-1"><label className="mb-1.5 block text-xs font-medium text-gray-700">Reviewer Notes (Internal)</label><textarea value={reviewerNotes} onChange={(e) => setReviewerNotes(e.target.value)} rows={2} placeholder="Add context for the handoff..." className="w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]" /></div></div><div className="mt-5 flex items-center justify-end gap-3 border-t border-gray-100 pt-4"><button type="button" onClick={handleReject} disabled={!canReject} className="inline-flex items-center justify-center rounded-md border border-[#1a1a1a] bg-white px-4 py-2 text-sm font-medium text-[#1a1a1a] shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">{submittingKey === "reject" ? "Rejecting..." : "Mark Unqualified"}</button><button type="button" onClick={handleAssignToBme} disabled={!canAssign} className="inline-flex items-center justify-center rounded-md bg-[#1a1a1a] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-black focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">{submittingKey === "assign" ? "Assigning..." : "Assign to BME"}</button></div></div></div>
          </>}
        </main>
      </div>
    </div>
  );
}
