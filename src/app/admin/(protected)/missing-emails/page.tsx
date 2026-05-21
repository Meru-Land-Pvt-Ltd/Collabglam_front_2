"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Plus,
  MailWarning,
  MailCheck,
  ClipboardList,
  Eye,
} from "lucide-react";
import Swal from "sweetalert2";
import { post, post2 } from "@/lib/api";

export type MissingItem = {
  missingId: string;
  handle: string;
  platform: "youtube" | "instagram" | "tiktok" | string;
  createdAt: string;
  isAvailable?: number;
};

export type MissingListResponse = {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  data: MissingItem[];
};

export type MissingListRequest = {
  page?: number;
  limit?: number;
  search?: string;
  platform?: string;
  handle?: string;
};

export type MissingEmailItem = {
  missingEmailId: string;
  email: string;
  handle: string;
  platform: string;
  createdAt: string;
  updatedAt: string;
  createdByAdminId?: string | null;
  youtube?: any;
};

export type MissingEmailListResponse = {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  data: MissingEmailItem[];
};

export type MissingEmailListRequest = {
  page?: number;
  limit?: number;
  search?: string;
  email?: string;
  handle?: string;
  createdByAdminId?: string;
};

export type InvitationItem = {
  _id: string;

  handle: string;
  platform: "youtube" | "instagram" | "tiktok" | string;
  modashUserId?: string | null;

  status: "invited" | "available" | string;
  aiScore?: number | null;
  rawAiScore?: number | null;
  recommendationReason?: string;

  brandId: string | null;
  brandName?: string;
  brandEmail?: string;
  brandIndustry?: string;
  brandCompanySize?: string;
  brand?: {
    _id: string;
    brandName: string;
    email: string;
    name?: string;
    industry?: string;
    companySize?: string;
    proxyEmail?: string;
    subscription?: any;
    subscriptionExpired?: boolean;
    isAdminCreated?: boolean;
    signupCompleted?: boolean;
    createdAt?: string | null;
    updatedAt?: string | null;
  } | null;

  campaignId?: string | null;
  campaignName?: string;
  campaign?: {
    _id: string;
    brandId?: string | null;
    brandName?: string;
    campaignTitle: string;
    description?: string;
    campaignType?: string;
    campaignCategory?: string;
    campaignSubcategory?: string;
    campaignBudget?: number | null;
    budget?: number | null;
    influencerBudget?: number | null;
    paymentType?: string;
    platformSelection?: string[];
    numberOfInfluencers?: number | null;
    influencerTier?: string;
    minFollowers?: number | null;
    maxFollowers?: number | null;
    creatorContentLanguage?: string;
    audienceContentLanguage?: string;
    targetCountry?: string;
    additionalNotes?: string;
    hashtags?: string[];
    timeline?: any;
    startAt?: string | null;
    endAt?: string | null;
    scheduledAt?: string | null;
    publishedAt?: string | null;
    endedAt?: string | null;
    status?: string;
    publishStatus?: string;
    approvalMode?: string;
    isFullyManaged?: boolean;
    managementType?: string;
    isActive?: number | null;
    applicantCount?: number | null;
    hasApplied?: number | null;
    isDraft?: number | null;
    byAi?: number | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  } | null;

  missingEmailId?: string | null;
  email?: string | null;
  missingEmail?: {
    _id: string;
    email?: string | null;
    handle?: string;
    platform?: string;
    status?: string;
    youtube?: any;
    createdByAdminId?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  } | null;

  creatorTitle?: string;

  createdAt?: string;
  updatedAt?: string;
};

export type InvitationListResponse = {
  status: string;
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  data: InvitationItem[];
};

export type InvitationListRequest = {
  page?: number;
  limit?: number;
  brandId?: string;
  campaignId?: string;
  handle?: string;
  platform?: string;
  status?: "all" | "invited" | "available";
  search?: string;
};

type AdminAddYouTubeEmailResponse = {
  message: string;
  data?: {
    missingEmailId: string;
    email: string;
    handle: string;
    platform: string;
    youtube?: any;
    createdAt?: string;
    updatedAt?: string;
  };
};

type SetAvailableResponse = {
  status: string;
  message: string;
  data?: any;
};

type UpdateMissingEmailResponse = {
  status: string;
  message: string;
  data?: any;
};

type UpdateInvitationStatusResponse = {
  status: string;
  message: string;
  warning?: string | null;
  data?: any;
};

type ViewMode = "invitations" | "missing" | "available";
type ModalSource = "invitation" | "missing" | "available" | "manual";

async function listInvitations(
  body: InvitationListRequest
): Promise<InvitationListResponse> {
  return await post<InvitationListResponse>("/newinvitations/list", body);
}

async function listMissing(body: MissingListRequest): Promise<MissingListResponse> {
  return await post2<MissingListResponse>("/missing/list", body);
}

async function listMissingEmails(
  body: MissingEmailListRequest
): Promise<MissingEmailListResponse> {
  return await post<MissingEmailListResponse>("/admin/listMissingEmail", body);
}

async function addMissingYouTubeDetails(body: {
  email: string;
  handle: string;
  createdByAdminId?: string;
}): Promise<AdminAddYouTubeEmailResponse> {
  return await post<AdminAddYouTubeEmailResponse>("/admin/addYouTubeEmail", body);
}

async function markMissingAvailable(
  missingId: string
): Promise<SetAvailableResponse> {
  return await post2<SetAvailableResponse>("/missing/available", { missingId });
}

async function updateMissingEmail(body: {
  missingEmailId: string;
  email: string;
}): Promise<UpdateMissingEmailResponse> {
  return await post<UpdateMissingEmailResponse>("/admin/updateMissingEmail", body);
}

async function updateInvitationStatus(body: {
  invitationId: string;
  status: "invited" | "available";
  missingEmailId?: string;
  email?: string;
  handle?: string;
  platform?: string;
}): Promise<UpdateInvitationStatusResponse> {
  return await post<UpdateInvitationStatusResponse>("/newinvitations/update", body);
}

const prettyDate = (iso?: string | null) => {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
};

const formatMoney = (value?: number | null) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `$${n.toLocaleString()}`;
};

const formatNumber = (value?: number | null) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString();
};

const formatList = (value?: string[] | null) => {
  if (!Array.isArray(value) || value.length === 0) return "—";
  return value.join(", ");
};

const useDebouncedValue = (value: string, delay = 400) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
};

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isMongoObjectId = (value?: string | null) => {
  return /^[a-f\d]{24}$/i.test(String(value || "").trim());
};

const normalizeHandleForApi = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
};

const getPlatformColor = (platform: string) => {
  switch (platform.toLowerCase()) {
    case "youtube":
    case "yt":
      return "bg-red-100 text-red-700 border-red-200";
    case "instagram":
    case "ig":
      return "bg-pink-100 text-pink-700 border-pink-200";
    case "tiktok":
    case "tt":
      return "bg-gray-900 text-white border-gray-900";
    default:
      return "bg-blue-100 text-blue-700 border-blue-200";
  }
};

const getPlatformIcon = (platform: string) => {
  switch (platform.toLowerCase()) {
    case "youtube":
    case "yt":
      return <div className="w-3.5 h-3.5 bg-red-600 rounded-sm" />;
    case "instagram":
    case "ig":
      return (
        <div className="w-3.5 h-3.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg" />
      );
    case "tiktok":
    case "tt":
      return <div className="w-3.5 h-3.5 bg-black rounded-full" />;
    default:
      return <div className="w-3.5 h-3.5 bg-blue-500 rounded" />;
  }
};

export default function MissingListPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("invitations");

  const [items, setItems] = useState<
    (InvitationItem | MissingItem | MissingEmailItem)[]
  >([]);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("");
  const [handle, setHandle] = useState("");
  const [brandId, setBrandId] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [invitationStatus, setInvitationStatus] = useState<
    "all" | "invited" | "available"
  >("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 500);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState<ModalSource>("manual");
  const [modalHandle, setModalHandle] = useState("");
  const [modalEmail, setModalEmail] = useState("");
  const [modalTitleText, setModalTitleText] = useState("");
  const [saving, setSaving] = useState(false);

  const [modalMissingId, setModalMissingId] = useState<string | null>(null);
  const [modalMissingEmailId, setModalMissingEmailId] = useState<string | null>(
    null
  );
  const [modalRawMissingEmailId, setModalRawMissingEmailId] = useState<
    string | null
  >(null);
  const [modalInvitationId, setModalInvitationId] = useState<string | null>(null);
  const [modalPlatform, setModalPlatform] = useState<string | null>(null);
  const [emailConfirmed, setEmailConfirmed] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] =
    useState<InvitationItem | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (viewMode === "invitations") {
        const body: InvitationListRequest = {
          page,
          limit,
          status: invitationStatus,
          search: debouncedSearch.trim() || undefined,
          platform: platform.trim() || undefined,
          handle: handle.trim() ? normalizeHandleForApi(handle.trim()) : undefined,
          brandId: brandId.trim() || undefined,
          campaignId: campaignId.trim() || undefined,
        };

        const res = await listInvitations(body);

        setItems(res.data || []);
        setTotal(res.total || 0);
        setHasNext(Boolean(res.hasNext));
        return;
      }

      if (viewMode === "missing") {
        const body: MissingListRequest = {
          page,
          limit,
          search: debouncedSearch.trim() || undefined,
          platform: platform.trim() || undefined,
          handle: handle.trim() || undefined,
        };

        const res = await listMissing(body);

        setItems(res.data || []);
        setTotal(res.total || 0);
        setHasNext(Boolean(res.hasNext));
        return;
      }

      const body: MissingEmailListRequest = {
        page,
        limit,
        search: debouncedSearch.trim() || undefined,
        handle: handle.trim() || undefined,
      };

      const res = await listMissingEmails(body);

      setItems(res.data || []);
      setTotal(res.total || 0);
      setHasNext(Boolean(res.hasNext));
    } catch (e: any) {
      setItems([]);
      setTotal(0);
      setHasNext(false);
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    debouncedSearch,
    platform,
    handle,
    brandId,
    campaignId,
    invitationStatus,
    viewMode,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    platform,
    handle,
    brandId,
    campaignId,
    invitationStatus,
    viewMode,
  ]);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(total / Math.max(1, limit))),
    [total, limit]
  );

  const hasActiveFilters = Boolean(
    search ||
      platform ||
      handle ||
      brandId ||
      campaignId ||
      invitationStatus !== "all"
  );

  const clearFilters = () => {
    setSearch("");
    setPlatform("");
    setHandle("");
    setBrandId("");
    setCampaignId("");
    setInvitationStatus("all");
  };

  const openModalForInvitationRow = (row: InvitationItem) => {
    const rawMissingId = row.missingEmail?._id || row.missingEmailId || null;

    const mongoMissingId = isMongoObjectId(row.missingEmail?._id)
      ? row.missingEmail?._id || null
      : isMongoObjectId(row.missingEmailId)
        ? row.missingEmailId || null
        : null;

    setModalSource("invitation");
    setModalHandle(row.handle || "");
    setModalEmail(row.missingEmail?.email || row.email || "");
    setModalTitleText(row.creatorTitle || row.handle || "");
    setModalMissingId(null);
    setModalMissingEmailId(mongoMissingId);
    setModalRawMissingEmailId(rawMissingId);
    setModalInvitationId(row._id);
    setModalPlatform(row.platform || "youtube");
    setEmailConfirmed(false);
    setModalOpen(true);
  };

  const openModalForMissingRow = (row: MissingItem) => {
    setModalSource("missing");
    setModalHandle(row.handle || "");
    setModalEmail("");
    setModalTitleText(row.handle || "");
    setModalMissingId(row.missingId);
    setModalMissingEmailId(null);
    setModalRawMissingEmailId(null);
    setModalInvitationId(null);
    setModalPlatform(row.platform || "youtube");
    setEmailConfirmed(false);
    setModalOpen(true);
  };

  const openModalForAvailableRow = (row: MissingEmailItem) => {
    const mongoMissingId = isMongoObjectId(row.missingEmailId)
      ? row.missingEmailId
      : null;

    setModalSource("available");
    setModalHandle(row.handle || "");
    setModalEmail(row.email || "");
    setModalTitleText(row.handle || "");
    setModalMissingId(null);
    setModalMissingEmailId(mongoMissingId);
    setModalRawMissingEmailId(row.missingEmailId || null);
    setModalInvitationId(null);
    setModalPlatform(row.platform || "youtube");
    setEmailConfirmed(false);
    setModalOpen(true);
  };

  const openModalManual = () => {
    setModalSource("manual");
    setModalHandle("");
    setModalEmail("");
    setModalTitleText("");
    setModalMissingId(null);
    setModalMissingEmailId(null);
    setModalRawMissingEmailId(null);
    setModalInvitationId(null);
    setModalPlatform(null);
    setEmailConfirmed(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setModalSource("manual");
    setModalHandle("");
    setModalEmail("");
    setModalTitleText("");
    setModalMissingId(null);
    setModalMissingEmailId(null);
    setModalRawMissingEmailId(null);
    setModalInvitationId(null);
    setModalPlatform(null);
    setEmailConfirmed(false);
  };

  const openDetails = (row: InvitationItem) => {
    setSelectedInvitation(row);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedInvitation(null);
  };

  const handleSaveDetails = async () => {
    const email = modalEmail.trim();
    let handleVal = modalHandle.trim();

    if (!modalMissingEmailId && !handleVal) {
      await Swal.fire("Missing handle", "Please enter a handle.", "warning");
      return;
    }

    if (!email) {
      await Swal.fire("Missing email", "Please enter an email address.", "warning");
      return;
    }

    if (!isValidEmail(email)) {
      await Swal.fire("Invalid email", "Please enter a valid email address.", "warning");
      return;
    }

    if (!emailConfirmed) {
      await Swal.fire(
        "Confirm email",
        "Please confirm that this email is correct for the influencer.",
        "warning"
      );
      return;
    }

    if (handleVal && !handleVal.startsWith("@")) {
      handleVal = `@${handleVal}`;
    }

    setSaving(true);

    try {
      if (modalMissingEmailId) {
        const res = await updateMissingEmail({
          missingEmailId: modalMissingEmailId,
          email,
        });

        if (modalInvitationId) {
          await updateInvitationStatus({
            invitationId: modalInvitationId,
            status: "available",
            missingEmailId: modalMissingEmailId,
            email,
            handle: handleVal,
            platform: modalPlatform || undefined,
          });
        }

        await Swal.fire(
          "Updated",
          res?.message || "Email updated successfully.",
          "success"
        );
      } else {
        const res = await addMissingYouTubeDetails({
          email,
          handle: handleVal,
        });

        const returnedMissingId = res?.data?.missingEmailId;
        const mongoReturnedMissingId = isMongoObjectId(returnedMissingId)
          ? returnedMissingId
          : undefined;

        if (modalMissingId) {
          try {
            await markMissingAvailable(modalMissingId);
          } catch (e) {
            console.error("Failed to mark missing as available", e);
          }
        }

        if (modalInvitationId) {
          await updateInvitationStatus({
            invitationId: modalInvitationId,
            status: "available",
            missingEmailId:
              mongoReturnedMissingId || modalRawMissingEmailId || undefined,
            email,
            handle: handleVal,
            platform: modalPlatform || res?.data?.platform || undefined,
          });
        }

        await Swal.fire(
          "Saved",
          res?.message || "Details saved successfully.",
          "success"
        );
      }

      closeModal();
      fetchData();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save details. Please try again.";

      await Swal.fire("Error", msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const modalTitle =
    modalSource === "invitation"
      ? "Add / update invitation email"
      : modalSource === "available"
        ? "Update email for handle"
        : modalSource === "missing"
          ? "Add details for missing handle"
          : "Add new handle & email";

  const primaryButtonLabel =
    modalMissingEmailId || modalSource === "available"
      ? "Update email"
      : "Save details";

  const currentCountLabel =
    viewMode === "invitations"
      ? "invitations"
      : viewMode === "missing"
        ? "missing handles"
        : "available emails";

  const tableColSpan = viewMode === "invitations" ? 10 : 4;

  return (
    <div className="min-h-screen">
      <div className="max-w-[1800px] mx-auto">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Invitations & Missing Emails
              </h1>
              <p className="text-gray-600">
                Admin panel to check all invitations, brand details, campaign details,
                missing emails, and available creator emails.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border">
                {viewMode === "invitations" ? (
                  <ClipboardList className="w-4 h-4 text-blue-600" />
                ) : viewMode === "missing" ? (
                  <MailWarning className="w-4 h-4 text-orange-600" />
                ) : (
                  <MailCheck className="w-4 h-4 text-emerald-600" />
                )}

                <span className="font-medium text-gray-900">
                  {total.toLocaleString()}
                </span>
                <span className="text-gray-500">{currentCountLabel}</span>
              </div>

              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
                className="px-4 py-2 rounded-full bg-white border shadow-sm text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="invitations">All invitations</option>
                <option value="available">Available email & handle</option>
              </select>

              <button
                onClick={openModalManual}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium shadow-sm hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add handle/email</span>
              </button>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              placeholder={
                viewMode === "invitations"
                  ? "Search by handle, brand name, campaign name, email, category, country..."
                  : viewMode === "missing"
                    ? "Search by handle, platform or note..."
                    : "Search by handle, email or admin..."
              }
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4" />
              Advanced Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>

          {filtersOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform
                </label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-400"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  disabled={viewMode === "available"}
                >
                  <option value="">All platforms</option>
                  <option value="youtube">YouTube</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Handle
                </label>
                <input
                  placeholder="@handle or handle"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                />
              </div>

              {viewMode === "invitations" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Invitation Status
                    </label>
                    <select
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={invitationStatus}
                      onChange={(e) =>
                        setInvitationStatus(
                          e.target.value as "all" | "invited" | "available"
                        )
                      }
                    >
                      <option value="all">All</option>
                      <option value="invited">Invited</option>
                      <option value="available">Available</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand ID
                    </label>
                    <input
                      placeholder="Brand _id"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={brandId}
                      onChange={(e) => setBrandId(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campaign ID
                    </label>
                    <input
                      placeholder="Campaign _id"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={campaignId}
                      onChange={(e) => setCampaignId(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                {viewMode === "invitations" ? (
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <Th>Creator</Th>
                    <Th>Brand</Th>
                    <Th>Campaign</Th>
                    <Th>Budget</Th>
                    <Th>Platform</Th>
                    <Th>Status</Th>
                    <Th>Email</Th>
                    <Th>Dates / IDs</Th>
                    <Th>Actions</Th>
                  </tr>
                ) : viewMode === "missing" ? (
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <Th>Handle</Th>
                    <Th>Platform</Th>
                    <Th>Created</Th>
                    <Th>Actions</Th>
                  </tr>
                ) : (
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <Th>Handle</Th>
                    <Th>Email</Th>
                    <Th>Created</Th>
                    <Th>Actions</Th>
                  </tr>
                )}
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading && (
                  <tr>
                    <td colSpan={tableColSpan} className="p-12 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        <span className="text-gray-600">Loading data...</span>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={tableColSpan} className="p-12 text-center">
                      <div className="text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p className="font-medium">No results found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading &&
                  viewMode === "invitations" &&
                  (items as InvitationItem[]).map((item, index) => (
                    <tr
                      key={item._id || `${item.handle}-${index}`}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <Td>
                        <div className="font-medium text-gray-900">
                          {item.creatorTitle || item.handle || "—"}
                        </div>

                        <div className="text-xs text-gray-500 mt-1">
                          Handle:{" "}
                          <span className="font-medium">{item.handle || "—"}</span>
                        </div>

                        {item.modashUserId && (
                          <div className="text-xs text-gray-400 mt-1 break-all">
                            Modash: {item.modashUserId}
                          </div>
                        )}
                      </Td>

                      <Td>
                        <div className="font-medium text-gray-900">
                          {item.brandName || item.brand?.brandName || "—"}
                        </div>
                      </Td>

                      <Td>
                        <div className="font-medium text-gray-900">
                          {item.campaignName || item.campaign?.campaignTitle || "—"}
                        </div>

                        <div className="text-xs text-gray-500 mt-1">
                          Type: {item.campaign?.campaignType || "—"}
                        </div>

                        <div className="text-xs text-gray-500 mt-1">
                          Category:{" "}
                          {item.campaign?.campaignCategory ||
                            item.campaign?.campaignSubcategory ||
                            "—"}
                        </div>
                      </Td>

                      <Td>
                        <div className="text-sm text-gray-800">
                          Campaign: {formatMoney(item.campaign?.campaignBudget)}
                        </div>
                      </Td>

                      <Td>
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(item.platform || "")}
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getPlatformColor(
                              item.platform || ""
                            )}`}
                          >
                            {item.platform || "—"}
                          </span>
                        </div>

                      </Td>

                      <Td>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                            item.status === "available"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-orange-50 text-orange-700 border-orange-200"
                          }`}
                        >
                          {item.status || "—"}
                        </span>
                      </Td>

                      <Td mono>
                        <div
                          className={
                            item.missingEmail?.email || item.email
                              ? "text-gray-800"
                              : "text-orange-600"
                          }
                        >
                          {item.missingEmail?.email || item.email || "Missing email"}
                        </div>
                      </Td>

                      <Td>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 opacity-50" />
                          <span className="text-sm">{prettyDate(item.createdAt)}</span>
                        </div>
                      </Td>

                      <Td>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => openModalForInvitationRow(item)}
                            className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                          >
                            Add / update email
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}

                {!loading &&
                  viewMode === "missing" &&
                  (items as MissingItem[]).map((item, index) => (
                    <tr
                      key={item.missingId || `${item.handle}-${item.platform}-${index}`}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <Td>
                        <div className="font-medium text-gray-900">
                          {item.handle}
                        </div>
                      </Td>

                      <Td>
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(item.platform)}
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getPlatformColor(
                              item.platform
                            )}`}
                          >
                            {item.platform}
                          </span>
                        </div>
                      </Td>

                      <Td>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 opacity-50" />
                          <span className="text-sm">{prettyDate(item.createdAt)}</span>
                        </div>
                      </Td>

                      <Td>
                        <button
                          onClick={() => openModalForMissingRow(item)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          Add details
                        </button>
                      </Td>
                    </tr>
                  ))}

                {!loading &&
                  viewMode === "available" &&
                  (items as MissingEmailItem[]).map((item, index) => (
                    <tr
                      key={item.missingEmailId || `${item.handle}-${index}`}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <Td>
                        <div className="font-medium text-gray-900">
                          {item.handle}
                        </div>
                      </Td>

                      <Td mono>
                        <span className="text-gray-800">{item.email}</span>
                      </Td>

                      <Td>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 opacity-50" />
                          <span className="text-sm">{prettyDate(item.createdAt)}</span>
                        </div>
                      </Td>

                      <Td>
                        <button
                          onClick={() => openModalForAvailableRow(item)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                        >
                          Update email
                        </button>
                      </Td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Show</span>
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                  >
                    {[25, 50, 100, 150, 200].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <span>per page</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Page <span className="font-medium">{page}</span> of{" "}
                  <span className="font-medium">{pageCount}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <button
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasNext || loading}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{modalTitle}</h2>

              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
                disabled={saving}
              >
                ✕
              </button>
            </div>

            {modalSource === "invitation" && (
              <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
                <p className="text-xs font-medium text-blue-700 mb-1">
                  Invitation selected
                </p>
                <p className="text-sm text-blue-900">
                  {modalTitleText || modalHandle || "Creator"}
                </p>
                {(modalMissingEmailId || modalRawMissingEmailId) && (
                  <p className="mt-1 text-xs text-blue-700 break-all">
                    MissingEmail ID: {modalMissingEmailId || modalRawMissingEmailId}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Handle
                </label>

                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm read-only:bg-gray-50 read-only:text-gray-500"
                  placeholder="@creatorhandle"
                  value={modalHandle}
                  onChange={(e) => setModalHandle(e.target.value)}
                  readOnly={modalSource !== "manual"}
                />

                {modalSource !== "manual" && (
                  <p className="mt-1 text-xs text-gray-500">
                    Handle is prefilled from the selected row.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>

                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="creator@example.com"
                  value={modalEmail}
                  onChange={(e) => setModalEmail(e.target.value)}
                />

                <div className="mt-3 flex items-start gap-2">
                  <input
                    id="email-confirm-checkbox"
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={emailConfirmed}
                    onChange={(e) => setEmailConfirmed(e.target.checked)}
                  />

                  <label
                    htmlFor="email-confirm-checkbox"
                    className="text-xs text-gray-700"
                  >
                    This email is correct for the influencer.
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100"
                disabled={saving}
              >
                Cancel
              </button>

              <button
                onClick={handleSaveDetails}
                disabled={saving || !emailConfirmed}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}

                <span>
                  {saving
                    ? modalMissingEmailId
                      ? "Updating..."
                      : "Saving..."
                    : primaryButtonLabel}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
      {children}
    </th>
  );
}

function Td({
  children,
  mono = false,
}: {
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <td
      className={`px-6 py-4 align-top whitespace-nowrap ${
        mono ? "font-mono text-sm" : ""
      }`}
    >
      {children}
    </td>
  );
}

function DetailCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  const finalValue =
    value === null || value === undefined || value === "" ? "—" : value;

  return (
    <div className="grid grid-cols-3 gap-3 text-sm">
      <div className="text-gray-500">{label}</div>
      <div className="col-span-2 text-gray-900 break-words whitespace-normal">
        {finalValue}
      </div>
    </div>
  );
}