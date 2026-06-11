"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import InviteMembersModal from "../inviteMember";
import {
  apiAcceptWorkspaceInvitation,
  apiCreateWorkspace,
  apiDeleteWorkspace,
  apiGetMyWorkspaces,
  apiGetWorkspaceInvitation,
  apiGetWorkspaceMembers,
  apiLeaveWorkspace,
  apiRejectWorkspaceInvitation,
  getWorkspaceBrandId,
  getWorkspaceId,
  switchWorkspaceLocalStorage,
  type WorkspaceItem,
  type WorkspaceMemberItem,
} from "@/app/brand/services/workspaceApi";

type TabKey = "workspace" | "workspace_users";

type WorkspaceMeta = {
  used: number;
  total: number;
  totalCount: number;
  limitReached: boolean;
  canAddWorkspace: boolean;
};

type InvitePreview = {
  email?: string;
  workspaceName?: string;
  workspaceLogo?: string;
  role?: string;
  accessType?: string;
  status?: string;
};

function getStoredBrandId() {
  if (typeof window === "undefined") return "";

  return (
    window.localStorage.getItem("brandId") ||
    window.localStorage.getItem("currentBrandId") ||
    ""
  );
}

function getStoredWorkspaceId() {
  if (typeof window === "undefined") return "";

  return (
    window.localStorage.getItem("workspaceId") ||
    window.localStorage.getItem("currentWorkspaceId") ||
    ""
  );
}

function getWorkspaceName(workspace: WorkspaceItem) {
  return (
    workspace.name ||
    workspace.workspaceName ||
    workspace.slug ||
    "Workspace"
  );
}

function getAccessLabel(value?: string) {
  const accessType = String(value || "").toLowerCase();

  if (accessType === "full_access") return "Full Access";
  if (accessType === "limited_access") return "Limited Access";

  return "Full Access";
}

function getInitial(value?: string) {
  const text = String(value || "").trim();

  if (!text) return "W";

  return text.charAt(0).toUpperCase();
}

function getMemberName(member: WorkspaceMemberItem, index: number) {
  return member.name || member.email?.split("@")[0] || `Member ${index + 1}`;
}

function isOwnerWorkspace(workspace: WorkspaceItem) {
  const role = String(workspace.role || "").toLowerCase();

  return role === "owner";
}

function WorkspaceLogo({ workspace }: { workspace: WorkspaceItem }) {
  const name = getWorkspaceName(workspace);
  const logo = workspace.logo || "";

  return (
    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-black text-sm font-semibold text-white">
      {logo ? (
        <img src={logo} alt={name} className="h-full w-full object-cover" />
      ) : (
        getInitial(name)
      )}
    </div>
  );
}

function WorkspaceCreatedModal({
  open,
  onClose,
  onInvite,
}: {
  open: boolean;
  onClose: () => void;
  onInvite: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 px-4">
      <div className="relative w-full max-w-[510px] rounded-[18px] bg-white px-8 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 grid h-8 w-8 place-items-center rounded-full text-2xl leading-none text-[#1a1a1a] hover:bg-neutral-100"
          aria-label="Close"
        >
          ×
        </button>

        <div className="mx-auto mb-6 grid h-32 w-32 place-items-center text-[104px]">
          🥳
        </div>

        <h2 className="text-[17px] font-semibold text-[#1a1a1a]">
          🎉 Workspace Created Successfully
        </h2>

        <p className="mx-auto mt-2 max-w-[330px] text-[15px] leading-5 text-neutral-400">
          You are all set. Invite teammates and start building campaigns
          together.
        </p>

        <div className="mt-6 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={onClose}
            className="text-[13px] font-medium text-[#1a1a1a]"
          >
            Do It later
          </button>

          <button
            type="button"
            onClick={onInvite}
            className="rounded-lg bg-[#1a1a1a] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-black"
          >
            Invite Members
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateWorkspaceModal({
  open,
  onClose,
  onCreate,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: { name: string; logo?: string }) => Promise<void>;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setName("");
    setLogo("");
    setLogoPreview("");
    setError("");
  }, [open]);

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Logo file size must be less than 5 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result || "");
      setLogo(result);
      setLogoPreview(result);
    };

    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    const cleanName = name.trim();

    if (!cleanName) {
      setError("Workspace name is required.");
      return;
    }

    setError("");

    await onCreate({
      name: cleanName,
      logo,
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 px-4">
      <div className="relative w-full max-w-[805px] rounded-[16px] bg-white px-14 py-10 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-8 top-8 grid h-8 w-8 place-items-center rounded-full text-3xl leading-none text-[#1a1a1a] hover:bg-neutral-100"
          aria-label="Close create workspace modal"
        >
          ×
        </button>

        <h2 className="text-[22px] font-semibold text-[#1a1a1a]">
          Create New Workspace
        </h2>

        <p className="mt-4 max-w-[600px] text-[15px] leading-5 text-neutral-400">
          Provide your basic business information so we can set up your
          workspace and tailor recommendations accordingly.
        </p>

        <div className="mt-6 flex items-center gap-5">
          <label className="grid h-20 w-20 cursor-pointer place-items-center overflow-hidden rounded-full bg-[#F4D1CE]">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Workspace logo"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-semibold text-[#1a1a1a]">+</span>
            )}

            <input
              type="file"
              accept="image/png,image/jpeg,image/gif"
              className="hidden"
              onChange={handleLogoChange}
            />
          </label>

          <div>
            <p className="text-[16px] font-medium text-[#1a1a1a]">
              Add a workspace logo
            </p>
            <p className="mt-2 text-[12px] text-neutral-400">
              JPG, GIF or PNG Max File Size 5 mb
            </p>
          </div>
        </div>

        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Workspace Name *"
          className="mt-6 h-[62px] w-full rounded-xl border border-neutral-300 px-4 text-[16px] outline-none placeholder:text-neutral-400 focus:border-[#1a1a1a]"
        />

        {error ? (
          <p className="mt-3 text-[13px] font-medium text-red-500">{error}</p>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-8">
          <button
            type="button"
            onClick={onClose}
            className="text-[16px] font-semibold text-[#1a1a1a]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg bg-[#1a1a1a] px-6 py-3 text-[15px] font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Workspace"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InvitationModal({
  invitePreview,
  loading,
  onAccept,
  onReject,
}: {
  invitePreview: InvitePreview;
  loading: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-[520px] rounded-2xl bg-white p-7 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <h2 className="text-[22px] font-semibold text-[#1a1a1a]">
          Workspace Invitation
        </h2>

        <p className="mt-3 text-[15px] leading-6 text-neutral-500">
          You have been invited to join{" "}
          <span className="font-semibold text-[#1a1a1a]">
            {invitePreview.workspaceName || "this workspace"}
          </span>
          .
        </p>

        <div className="mt-5 rounded-xl bg-neutral-50 p-4">
          <p className="text-[14px] text-neutral-500">
            Email:{" "}
            <span className="font-medium text-[#1a1a1a]">
              {invitePreview.email || "Invited email"}
            </span>
          </p>

          <p className="mt-2 text-[14px] text-neutral-500">
            Access:{" "}
            <span className="font-medium text-[#1a1a1a]">
              {invitePreview.accessType === "limited_access"
                ? "Limited Access"
                : "Full Access"}
            </span>
          </p>
        </div>

        <div className="mt-7 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onReject}
            disabled={loading}
            className="rounded-lg border border-neutral-300 px-5 py-3 text-[14px] font-semibold text-[#1a1a1a] hover:bg-neutral-50 disabled:opacity-60"
          >
            Reject
          </button>

          <button
            type="button"
            onClick={onAccept}
            disabled={loading}
            className="rounded-lg bg-[#1a1a1a] px-5 py-3 text-[14px] font-semibold text-white hover:bg-black disabled:opacity-60"
          >
            {loading ? "Please wait..." : "Accept"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WorkspaceSettings() {
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabKey>("workspace");
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [members, setMembers] = useState<WorkspaceMemberItem[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [currentBrandId, setCurrentBrandId] = useState("");

  const [workspaceMeta, setWorkspaceMeta] = useState<WorkspaceMeta>({
    used: 0,
    total: 1,
    totalCount: 0,
    limitReached: false,
    canAddWorkspace: true,
  });

  const [inviteToken, setInviteToken] = useState("");
  const [invitePreview, setInvitePreview] = useState<InvitePreview | null>(null);
  const [inviteActionLoading, setInviteActionLoading] = useState(false);
  const [pendingActionLoading, setPendingActionLoading] = useState("");

  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [error, setError] = useState("");

  const selectedWorkspace = useMemo(() => {
    return (
      workspaces.find(
        (workspace) => getWorkspaceId(workspace) === selectedWorkspaceId
      ) ||
      workspaces[0] ||
      null
    );
  }, [selectedWorkspaceId, workspaces]);

  const selectedWorkspaceName = selectedWorkspace
    ? getWorkspaceName(selectedWorkspace)
    : "Workspace";

  const selectedWorkspaceBrandId = selectedWorkspace
    ? getWorkspaceBrandId(selectedWorkspace)
    : currentBrandId;

  const selectedWorkspaceIsOwner = selectedWorkspace
    ? isOwnerWorkspace(selectedWorkspace)
    : false;

  const ownerWorkspaceCount = useMemo(() => {
    return workspaces.filter((workspace) => isOwnerWorkspace(workspace)).length;
  }, [workspaces]);

  const maxWorkspaceLimit = workspaceMeta.total || 1;
  const currentWorkspaceUsed =
    workspaceMeta.used || ownerWorkspaceCount || workspaces.length;
  const workspaceLimitReached = Boolean(workspaceMeta.limitReached);

  async function loadWorkspaces() {
    try {
      setLoading(true);
      setError("");

      const storedBrandId = getStoredBrandId();
      const storedWorkspaceId = getStoredWorkspaceId();

      setCurrentBrandId(storedBrandId);

      const response = await apiGetMyWorkspaces();

      const workspaceList = response.workspaces || [];
      const meta = response.meta || {
        used: workspaceList.length,
        total: 1,
        totalCount: workspaceList.length,
        limitReached: false,
        canAddWorkspace: true,
      };

      setWorkspaceMeta(meta);
      setWorkspaces(workspaceList);

      const firstWorkspaceId = workspaceList[0]
        ? getWorkspaceId(workspaceList[0])
        : "";

      const nextWorkspaceId =
        storedWorkspaceId &&
        workspaceList.some(
          (workspace) => getWorkspaceId(workspace) === storedWorkspaceId
        )
          ? storedWorkspaceId
          : firstWorkspaceId;

      setSelectedWorkspaceId(nextWorkspaceId);
    } catch (err: any) {
      setError(err?.message || "Failed to load workspaces.");
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadMembers(workspaceId: string) {
    if (!workspaceId) {
      setMembers([]);
      return;
    }

    try {
      setMembersLoading(true);

      const list = await apiGetWorkspaceMembers(workspaceId);

      setMembers(list);
    } catch {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }

  useEffect(() => {
    const tab = searchParams.get("tab");

    if (tab === "workspace_users") {
      setActiveTab("workspace_users");
    } else {
      setActiveTab("workspace");
    }
  }, [searchParams]);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (!selectedWorkspaceId) return;

    loadMembers(selectedWorkspaceId);
  }, [selectedWorkspaceId]);

  useEffect(() => {
    const token = searchParams.get("inviteToken") || "";

    setInviteToken(token);

    if (!token) return;

    async function loadInvitation() {
      try {
        setError("");

        const invitation: any = await apiGetWorkspaceInvitation(token);

        const preview =
          invitation?.data?.invitation ||
          invitation?.invitation ||
          invitation ||
          null;

        setInvitePreview(preview);
      } catch (err: any) {
        setError(err?.message || "Failed to load workspace invitation.");
      }
    }

    loadInvitation();
  }, [searchParams]);

  async function handleCreateWorkspace(payload: { name: string; logo?: string }) {
    try {
      setCreateLoading(true);
      setError("");

      const workspace = await apiCreateWorkspace(payload);

      if (!workspace) {
        throw new Error("Workspace was not returned by server.");
      }

      const workspaceId = getWorkspaceId(workspace);

      await loadWorkspaces();

      setSelectedWorkspaceId(workspaceId);
      setCreateOpen(false);
      setSuccessOpen(true);
    } catch (err: any) {
      setError(err?.message || "Failed to create workspace.");
    } finally {
      setCreateLoading(false);
    }
  }

  function handleSwitchWorkspace(workspace: WorkspaceItem) {
    if ((workspace as any).isPendingInvitation) return;

    const workspaceId = getWorkspaceId(workspace);

    if (!workspaceId) return;

    switchWorkspaceLocalStorage(workspace);
    setSelectedWorkspaceId(workspaceId);

    window.location.href = "/brand/dashboard";
  }

  async function handleLeaveWorkspace(workspace: WorkspaceItem) {
    const workspaceId = getWorkspaceId(workspace);

    if (!workspaceId) return;

    const ok = window.confirm("Are you sure you want to leave this workspace?");

    if (!ok) return;

    await apiLeaveWorkspace(workspaceId);
    await loadWorkspaces();
  }

  async function handleDeleteWorkspace(workspace: WorkspaceItem) {
    const workspaceId = getWorkspaceId(workspace);

    if (!workspaceId) return;

    const ok = window.confirm("Are you sure you want to delete this workspace?");

    if (!ok) return;

    await apiDeleteWorkspace(workspaceId);
    await loadWorkspaces();
  }

  async function handleAcceptInvitation() {
    if (!inviteToken) return;

    try {
      setInviteActionLoading(true);
      setError("");

      const response: any = await apiAcceptWorkspaceInvitation(inviteToken);

      const workspace = response?.data?.workspace || response?.workspace || null;

      if (workspace) {
        switchWorkspaceLocalStorage(workspace);
      }

      setInvitePreview(null);
      setInviteToken("");

      await loadWorkspaces();

      window.history.replaceState({}, "", "/brand/settings/workspace");
      window.location.reload();
    } catch (err: any) {
      setError(err?.message || "Failed to accept invitation.");
    } finally {
      setInviteActionLoading(false);
    }
  }

  async function handleRejectInvitation() {
    if (!inviteToken) return;

    try {
      setInviteActionLoading(true);
      setError("");

      await apiRejectWorkspaceInvitation(inviteToken);

      setInvitePreview(null);
      setInviteToken("");

      window.history.replaceState({}, "", "/brand/settings/workspace");
      await loadWorkspaces();
    } catch (err: any) {
      setError(err?.message || "Failed to reject invitation.");
    } finally {
      setInviteActionLoading(false);
    }
  }

  async function handleAcceptPendingInvite(workspace: WorkspaceItem) {
    const token =
      (workspace as any).invitationToken || (workspace as any).token || "";

    if (!token) {
      setError("Invitation token missing.");
      return;
    }

    try {
      setPendingActionLoading(token);
      setError("");

      const response: any = await apiAcceptWorkspaceInvitation(token);

      const acceptedWorkspace =
        response?.data?.workspace || response?.workspace || null;

      if (acceptedWorkspace) {
        switchWorkspaceLocalStorage(acceptedWorkspace);
      }

      await loadWorkspaces();

      window.location.reload();
    } catch (err: any) {
      setError(err?.message || "Failed to accept invitation.");
    } finally {
      setPendingActionLoading("");
    }
  }

  async function handleRejectPendingInvite(workspace: WorkspaceItem) {
    const token =
      (workspace as any).invitationToken || (workspace as any).token || "";

    if (!token) {
      setError("Invitation token missing.");
      return;
    }

    try {
      setPendingActionLoading(token);
      setError("");

      await apiRejectWorkspaceInvitation(token);
      await loadWorkspaces();
    } catch (err: any) {
      setError(err?.message || "Failed to reject invitation.");
    } finally {
      setPendingActionLoading("");
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="px-14 py-8">
        <h2 className="mb-8 text-[30px] font-semibold text-[#1a1a1a]">
          Workspace
        </h2>

        {error ? (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-600">
            {error}
          </div>
        ) : null}

        {activeTab === "workspace" ? (
          <section>
            <div className="mb-8 flex items-center justify-between">
              <h3 className="text-[22px] font-semibold text-[#1a1a1a]">
                Workspaces
              </h3>

              <div className="flex items-center gap-4">
                <span className="text-[16px] text-neutral-400">
                  {currentWorkspaceUsed} of {maxWorkspaceLimit}
                </span>

                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-[14px] font-medium text-[#1a1a1a] hover:bg-neutral-50"
                >
                  <span className="text-[20px] leading-none">+</span>
                  Add Workspace
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center text-neutral-400">
                Loading workspaces...
              </div>
            ) : workspaces.length ? (
              <div className="space-y-0">
                {workspaces.map((workspace) => {
                  const workspaceId = getWorkspaceId(workspace);
                  const isSelected = workspaceId === selectedWorkspaceId;
                  const isOwner = isOwnerWorkspace(workspace);
                  const workspaceName = getWorkspaceName(workspace);
                  const isPendingInvite = Boolean(
                    (workspace as any).isPendingInvitation
                  );
                  const invitationToken =
                    (workspace as any).invitationToken ||
                    (workspace as any).token ||
                    "";

                  return (
                    <div
                      key={workspaceId || invitationToken}
                      className={`flex items-center border-b border-neutral-200 py-6 ${
                        isSelected ? "bg-white" : ""
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSwitchWorkspace(workspace)}
                        disabled={isPendingInvite}
                        className="flex min-w-0 flex-1 items-center gap-4 text-left disabled:cursor-default"
                      >
                        <WorkspaceLogo workspace={workspace} />

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="truncate text-[17px] font-medium text-[#1a1a1a]">
                              {workspaceName}
                            </h4>

                            <span className="rounded bg-[#FFF4B8] px-1.5 py-0.5 text-[12px] font-medium text-[#1a1a1a]">
                              {isPendingInvite
                                ? "Pending Invite"
                                : isOwner
                                  ? "You"
                                  : "Other's"}
                            </span>
                          </div>

                          <p className="mt-1 truncate text-[14px] text-neutral-400">
                            {isPendingInvite
                              ? `Pending · ${getAccessLabel(
                                  workspace.accessType
                                )}`
                              : isOwner
                                ? "Owner"
                                : getAccessLabel(workspace.accessType)}
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center gap-3">
                        {isPendingInvite ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAcceptPendingInvite(workspace)}
                              disabled={pendingActionLoading === invitationToken}
                              className="rounded-lg bg-[#1a1a1a] px-5 py-2 text-[14px] font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {pendingActionLoading === invitationToken
                                ? "Please wait..."
                                : "Accept"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRejectPendingInvite(workspace)}
                              disabled={pendingActionLoading === invitationToken}
                              className="rounded-lg border border-neutral-300 px-5 py-2 text-[14px] font-medium text-[#1a1a1a] hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedWorkspaceId(workspaceId);
                                setActiveTab("workspace_users");
                              }}
                              className="rounded-lg border border-neutral-300 px-4 py-2 text-[14px] font-medium text-[#1a1a1a] hover:bg-neutral-50"
                            >
                              View members
                            </button>

                            {isOwner ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedWorkspaceId(workspaceId);
                                    setInviteOpen(true);
                                  }}
                                  className="rounded-lg border border-neutral-300 px-4 py-2 text-[14px] font-medium text-[#1a1a1a] hover:bg-neutral-50"
                                >
                                  Invite
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteWorkspace(workspace)}
                                  className="rounded-lg border border-neutral-200 px-6 py-2 text-[14px] font-medium text-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed"
                                  disabled={ownerWorkspaceCount <= 1}
                                >
                                  Delete
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleLeaveWorkspace(workspace)}
                                className="rounded-lg bg-red-50 px-4 py-2 text-[14px] font-medium text-red-500 hover:bg-red-100"
                              >
                                Leave
                              </button>
                            )}
                          </>
                        )}

                        <button
                          type="button"
                          className="grid h-8 w-8 place-items-center rounded-full text-[#1a1a1a] hover:bg-neutral-100"
                          aria-label="Workspace info"
                        >
                          ⓘ
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-neutral-200 py-20 text-center text-neutral-400">
                No workspaces found.
              </div>
            )}

            {workspaceLimitReached ? (
              <div className="mt-28 text-center">
                <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-neutral-100 text-3xl">
                  🔭
                </div>

                <h4 className="text-[18px] font-semibold text-[#1a1a1a]">
                  Workspace Limit Reached
                </h4>

                <p className="mx-auto mt-3 max-w-[520px] text-[15px] leading-6 text-neutral-400">
                  You have reached the maximum number of workspaces allowed in
                  your current plan. Upgrade your plan to create and manage
                  additional workspaces.
                </p>

                <button
                  type="button"
                  className="mt-7 rounded-lg bg-[#1a1a1a] px-5 py-3 text-[14px] font-semibold text-white"
                >
                  Upgrade for more workspace
                </button>
              </div>
            ) : null}
          </section>
        ) : (
          <section>
            <button
              type="button"
              onClick={() => setActiveTab("workspace")}
              className="mb-8 text-[15px] font-medium text-[#1a1a1a]"
            >
              ‹ Back to Workspace
            </button>

            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-[30px] font-semibold text-[#1a1a1a]">
                  Workspace Users
                </h3>

                <p className="mt-3 text-[15px] text-neutral-400">
                  Manage members and shared access for {selectedWorkspaceName}.
                </p>
              </div>

              {selectedWorkspaceIsOwner ? (
                <button
                  type="button"
                  onClick={() => setInviteOpen(true)}
                  className="rounded-lg bg-[#1a1a1a] px-5 py-3 text-[14px] font-semibold text-white hover:bg-black"
                >
                  Invite Members
                </button>
              ) : null}
            </div>

            {membersLoading ? (
              <div className="py-16 text-center text-neutral-400">
                Loading members...
              </div>
            ) : members.length ? (
              <div className="rounded-xl border border-neutral-200">
                {members.map((member, index) => {
                  const name = getMemberName(member, index);

                  return (
                    <div
                      key={member._id || member.id || member.email || index}
                      className="flex items-center border-b border-neutral-200 px-5 py-4 last:border-b-0"
                    >
                      <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-neutral-200 text-sm font-semibold text-[#1a1a1a]">
                        {member.avatar || member.profilePic ? (
                          <img
                            src={member.avatar || member.profilePic}
                            alt={name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          getInitial(name)
                        )}
                      </div>

                      <div className="ml-4 min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium text-[#1a1a1a]">
                          {name}
                        </p>

                        <p className="truncate text-[13px] text-neutral-400">
                          {member.email || "No email"}
                        </p>
                      </div>

                      <div className="text-[14px] font-medium text-[#1a1a1a]">
                        {member.role === "owner"
                          ? "Owner"
                          : getAccessLabel(member.accessType)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-neutral-200 py-20 text-center text-neutral-400">
                No members found.
              </div>
            )}
          </section>
        )}
      </main>

      <CreateWorkspaceModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreateWorkspace}
        loading={createLoading}
      />

      <WorkspaceCreatedModal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        onInvite={() => {
          setSuccessOpen(false);
          setInviteOpen(true);
        }}
      />

      <InviteMembersModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        brandId={selectedWorkspaceBrandId}
        workspaceId={selectedWorkspaceId}
        workspaceName={selectedWorkspaceName}
      />

      {invitePreview ? (
        <InvitationModal
          invitePreview={invitePreview}
          loading={inviteActionLoading}
          onAccept={handleAcceptInvitation}
          onReject={handleRejectInvitation}
        />
      ) : null}
    </div>
  );
}