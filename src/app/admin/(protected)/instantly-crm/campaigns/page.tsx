"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminGet, adminPost } from "@/lib/api";
import AdminTable, { AdminTableColumn } from "../../../components/table";

type CampaignFlowType = "standard_brand" | "ime_influencer";

type AdminMe = {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
};

type AdminOption = {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
};

type CampaignScheduleWindow = {
  name?: string;
  from?: string;
  to?: string;
};

type CampaignSequenceStep = {
  stepOrder?: number;
  delay?: number;
  delayUnit?: string;
};

type CampaignRow = {
  _id: string;
  name: string;
  flowType: CampaignFlowType;
  status: "draft" | "ready" | "launched" | "paused" | "completed";
  sdrId:
    | string
    | {
        _id: string;
        name?: string;
        email?: string;
      }
    | null;
  RHId:
    | string
    | {
        _id: string;
        name?: string;
        email?: string;
      }
    | null;
  IMEId:
    | string
    | {
        _id: string;
        name?: string;
        email?: string;
      }
    | null;
  instantly?: {
    senderAccountEmail?: string;
    accountEmails?: string[];
    campaignId?: string;
    leadListId?: string;
  };
  teamMailboxes?: {
    RHEmail?: string;
    IMEEmail?: string;
  };
  configuration?: {
    schedule?: {
      timezone?: string;
      startDate?: string;
      endDate?: string;
      windows?: CampaignScheduleWindow[];
    };
    sequences?: CampaignSequenceStep[];
    lastSyncedAt?: string;
  };
  stats?: {
    totalProspects?: number;
    totalReplies?: number;
    totalQualified?: number;
    totalAssigned?: number;
  };
  createdAt?: string;
  launchedAt?: string;
};

type ApiState = {
  type: "success" | "error" | "info";
  text: string;
} | null;

type CreateForm = {
  name: string;
  flowType: CampaignFlowType;
  sdrId: string;
  imeId: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function getAdminLabel(admin: any) {
  if (!admin) return "-";
  if (typeof admin === "string") return admin;
  if (admin.name && admin.email) return `${admin.name} (${admin.email})`;
  return admin.name || admin.email || admin._id || "-";
}

function getStatusPillClasses(status?: string) {
  if (status === "ready") return "border-sky-200 bg-sky-50 text-sky-700";
  if (status === "launched") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "paused") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "completed") return "border-violet-200 bg-violet-50 text-violet-700";
  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

function getFlowPillClasses(flowType?: CampaignFlowType) {
  if (flowType === "ime_influencer") {
    return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700";
  }
  return "border-blue-200 bg-blue-50 text-blue-700";
}

function getFlowLabel(flowType?: CampaignFlowType) {
  return flowType === "ime_influencer" ? "IME Influencer" : "Standard Brand";
}

function parseCampaignRows(payload: any): CampaignRow[] {
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows.map((item: any) => ({
    _id: String(item?._id || ""),
    name: item?.name || "",
    flowType: item?.flowType === "ime_influencer" ? "ime_influencer" : "standard_brand",
    status: item?.status || "draft",
    sdrId: item?.sdrId || null,
    RHId: item?.RHId || null,
    IMEId: item?.IMEId || null,
    instantly: item?.instantly || {},
    teamMailboxes: item?.teamMailboxes || {},
    configuration: item?.configuration || {},
    stats: item?.stats || {},
    createdAt: item?.createdAt || "",
    launchedAt: item?.launchedAt || "",
  }));
}

function parseAdminRows(payload: any): AdminOption[] {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];

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

function getScheduleSummary(row: CampaignRow) {
  const schedule = row.configuration?.schedule;
  const windowItem = schedule?.windows?.[0];
  if (!schedule || !windowItem) return "Not configured";
  return `${windowItem.from || "-"} - ${windowItem.to || "-"} · ${schedule.timezone || "-"}`;
}

function getSequenceSummary(row: CampaignRow) {
  const steps = row.configuration?.sequences || [];
  if (!steps.length) return "0 steps";
  return steps
    .map((step) => `S${step.stepOrder || 0}: ${step.delay || 0} ${step.delayUnit || "days"}`)
    .join(" · ");
}

function getOwnerBlock(row: CampaignRow) {
  if (row.flowType === "ime_influencer") {
    return {
      titleA: "IME",
      valueA: getAdminLabel(row.IMEId),
      titleB: "Mailbox",
      valueB: row.teamMailboxes?.IMEEmail || row.instantly?.senderAccountEmail || "-",
    };
  }

  return {
    titleA: "SDR",
    valueA: getAdminLabel(row.sdrId),
    titleB: "RH",
    valueB: getAdminLabel(row.RHId),
  };
}

function getContactsLabel(row: CampaignRow) {
  return row.flowType === "ime_influencer" ? "Influencers" : "Brands";
}

export default function InstantlyCampaignsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<ApiState>(null);
  const [me, setMe] = useState<AdminMe | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [sdrOptions, setSdrOptions] = useState<AdminOption[]>([]);
  const [imeOptions, setImeOptions] = useState<AdminOption[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({
    name: "",
    flowType: "standard_brand",
    sdrId: "",
    imeId: "",
  });

  const canCreate = useMemo(() => {
    return me?.role === "sdr" || me?.role === "ime" || me?.role === "super_admin";
  }, [me]);

  const fixedFlowType = useMemo<CampaignFlowType>(() => {
    if (me?.role === "ime") return "ime_influencer";
    return "standard_brand";
  }, [me]);

  async function loadPage(showLoader = true) {
    try {
      if (showLoader) setLoading(true);
      setMessage(null);

      const mePayload: any = await adminGet("/admins/me");
      const meData: AdminMe = {
        _id: String(mePayload?._id || ""),
        name: mePayload?.name || "",
        email: mePayload?.email || "",
        role: mePayload?.role || "",
      };
      setMe(meData);

      const requests: Promise<any>[] = [adminGet("/outreach/campaigns")];

      if (meData.role === "super_admin") {
        requests.push(adminGet("/admins/get-executive-list", { role: "sdr" }));
        requests.push(adminGet("/admins/get-executive-list", { role: "ime" }));
      }

      const results = await Promise.all(requests);
      const campaignPayload = results[0];
      const sdrPayload = results[1];
      const imePayload = results[2];

      setCampaigns(parseCampaignRows(campaignPayload));

      if (meData.role === "super_admin") {
        setSdrOptions(parseAdminRows(sdrPayload));
        setImeOptions(parseAdminRows(imePayload));
      } else {
        setSdrOptions([]);
        setImeOptions([]);
      }

      setCreateForm((prev) => ({
        ...prev,
        flowType:
          meData.role === "ime"
            ? "ime_influencer"
            : meData.role === "sdr"
              ? "standard_brand"
              : prev.flowType,
        sdrId: meData.role === "sdr" ? meData._id : prev.sdrId,
        imeId: meData.role === "ime" ? meData._id : prev.imeId,
      }));
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to load campaigns",
      });
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  useEffect(() => {
    loadPage(true);
  }, []);

  async function handleCreateCampaign() {
    try {
      if (!createForm.name.trim()) {
        throw new Error("Campaign name is required");
      }

      const flowType =
        me?.role === "super_admin"
          ? createForm.flowType
          : me?.role === "ime"
            ? "ime_influencer"
            : "standard_brand";

      if (me?.role === "super_admin" && flowType === "standard_brand" && !createForm.sdrId) {
        throw new Error("Select an SDR owner");
      }

      if (me?.role === "super_admin" && flowType === "ime_influencer" && !createForm.imeId) {
        throw new Error("Select an IME owner");
      }

      setCreateLoading(true);
      setMessage(null);

      const payload: Record<string, any> = {
        name: createForm.name.trim(),
        flowType,
      };

      if (flowType === "standard_brand") {
        if (me?.role === "super_admin") {
          payload.sdrId = createForm.sdrId;
        }
      } else {
        if (me?.role === "super_admin") {
          payload.imeId = createForm.imeId;
        }
      }

      const response: any = await adminPost("/outreach/campaigns", payload);

      if (response?.success === false) {
        throw new Error(response?.message || "Failed to create campaign");
      }

      const campaignId = response?.data?._id;
      if (!campaignId) {
        throw new Error("Campaign created but id is missing");
      }

      setCreateOpen(false);
      setCreateForm({
        name: "",
        flowType: me?.role === "ime" ? "ime_influencer" : "standard_brand",
        sdrId: me?.role === "sdr" ? me._id || "" : "",
        imeId: me?.role === "ime" ? me._id || "" : "",
      });

      router.push(`/admin/instantly-crm/campaigns/${campaignId}`);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to create campaign",
      });
    } finally {
      setCreateLoading(false);
    }
  }

  const columns: AdminTableColumn<CampaignRow>[] = [
    {
      id: "name",
      header: "Campaign",
      sortable: true,
      render: (row) => (
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">{row.name}</p>
            <span
              className={cx(
                "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                getFlowPillClasses(row.flowType)
              )}
            >
              {getFlowLabel(row.flowType)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">ID: {row._id}</p>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      render: (row) => (
        <span
          className={cx(
            "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
            getStatusPillClasses(row.status)
          )}
        >
          {row.status}
        </span>
      ),
    },
    {
      id: "schedule",
      header: "Schedule",
      render: (row) => (
        <div className="min-w-[220px] text-sm text-slate-700">
          <p>{getScheduleSummary(row)}</p>
          <p className="mt-1 text-xs text-slate-500">
            {row.configuration?.schedule?.startDate || "-"} to {row.configuration?.schedule?.endDate || "-"}
          </p>
        </div>
      ),
    },
    {
      id: "sequence",
      header: "Sequence",
      render: (row) => (
        <div className="min-w-[220px] text-sm text-slate-700">
          <p>{getSequenceSummary(row)}</p>
          <p className="mt-1 text-xs text-slate-500">
            {row.configuration?.sequences?.length || 0} steps
          </p>
        </div>
      ),
    },
    {
      id: "contacts",
      header: "Contacts",
      align: "center",
      render: (row) => (
        <div>
          <span className="text-sm font-semibold text-slate-900">
            {row.stats?.totalProspects || 0}
          </span>
          <p className="mt-1 text-[11px] text-slate-500">{getContactsLabel(row)}</p>
        </div>
      ),
    },
    {
      id: "sender",
      header: "Primary Sender",
      render: (row) => (
        <div className="text-sm text-slate-700">
          <p>{row.instantly?.senderAccountEmail || row.instantly?.accountEmails?.[0] || "-"}</p>
          <p className="mt-1 text-xs text-slate-500">
            Synced: {formatDate(row.configuration?.lastSyncedAt)}
          </p>
        </div>
      ),
    },
    {
      id: "owners",
      header: "Owners",
      render: (row) => {
        const ownerBlock = getOwnerBlock(row);

        return (
          <div className="min-w-[220px] text-sm text-slate-700">
            <p>
              {ownerBlock.titleA}: {ownerBlock.valueA}
            </p>
            <p className="mt-1">
              {ownerBlock.titleB}: {ownerBlock.valueB}
            </p>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={cx(
            "rounded-2xl border px-4 py-3 text-sm",
            message.type === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
            message.type === "error" && "border-rose-200 bg-rose-50 text-rose-700",
            message.type === "info" && "border-sky-200 bg-sky-50 text-sky-700"
          )}
        >
          {message.text}
        </div>
      )}

      <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Campaigns
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Outreach Campaigns
            </h2>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-black/90"
            >
              Create Campaign
            </button>
          )}
        </div>
      </section>

      <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
        <AdminTable
          data={campaigns}
          columns={columns}
          rowKey={(row) => row._id}
          loading={loading}
          emptyTitle="No campaigns found"
          emptyDescription="Create a campaign to get started."
          onRowClick={(row) => router.push(`/admin/instantly-crm/campaigns/${row._id}`)}
          actions={{
            header: "Actions",
            render: (row) => (
              <button
                type="button"
                onClick={() => router.push(`/admin/instantly-crm/campaigns/${row._id}`)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Open
              </button>
            ),
          }}
        />
      </section>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Quick Create
                </p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">
                  Create Campaign
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  The detail page will let you edit schedule, sequence, contacts, sync, and launch.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {me?.role === "super_admin" ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">
                    Campaign Flow
                  </label>
                  <select
                    value={createForm.flowType}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        flowType: e.target.value as CampaignFlowType,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  >
                    <option value="standard_brand">Standard Brand (SDR → RH → BME)</option>
                    <option value="ime_influencer">IME Influencer (IME direct)</option>
                  </select>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Campaign Flow
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {getFlowLabel(me?.role === "ime" ? "ime_influencer" : fixedFlowType)}
                  </p>
                </div>
              )}

              {me?.role === "super_admin" && createForm.flowType === "standard_brand" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">
                    SDR Owner
                  </label>
                  <select
                    value={createForm.sdrId}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, sdrId: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  >
                    <option value="">Select SDR</option>
                    {sdrOptions.map((admin) => (
                      <option key={admin._id} value={admin._id}>
                        {getAdminLabel(admin)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {me?.role === "super_admin" && createForm.flowType === "ime_influencer" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-800">
                    IME Owner
                  </label>
                  <select
                    value={createForm.imeId}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, imeId: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  >
                    <option value="">Select IME</option>
                    {imeOptions.map((admin) => (
                      <option key={admin._id} value={admin._id}>
                        {getAdminLabel(admin)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">
                  Campaign Name
                </label>
                <input
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder={
                    createForm.flowType === "ime_influencer"
                      ? "Creator outreach campaign"
                      : "Spring brand outreach campaign"
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCampaign}
                disabled={createLoading}
                className="rounded-2xl bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {createLoading ? "Creating..." : "Create Campaign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}