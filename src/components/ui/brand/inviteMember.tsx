"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CaretDown, Copy, LinkSimple, X } from "@phosphor-icons/react";

type AccessType = "full_access" | "limited_access";

type InviteMembersModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandId?: string | null;
  workspaceId?: string | null;
  workspaceName?: string;
};

type WorkspaceMember = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  profilePic?: string;
  role?: string;
  accessType?: string;
  status?: string;
};

function getApiBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "";

  return raw
    .replace(/\/+$/, "")
    .replace(/\/api$/, "")
    .replace(/\/workspace$/, "");
}

function buildWorkspaceApiUrl(path: string) {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${base}/workspace${cleanPath}`;
}

function getAuthToken() {
  if (typeof window === "undefined") return "";

  return (
    window.localStorage.getItem("token") ||
    window.localStorage.getItem("accessToken") ||
    window.localStorage.getItem("brandToken") ||
    window.localStorage.getItem("authToken") ||
    ""
  );
}

function normalizeAccessLabel(value?: string) {
  const access = String(value || "").toLowerCase();

  if (access === "full_access") return "Full Access";
  if (access === "limited_access") return "Limited Access";

  return "Full Access";
}

function getInitials(value?: string) {
  const text = String(value || "").trim();

  if (!text) return "U";

  return text
    .split(/\s+/)
    .slice(0, 2)
    .map((item) => item.charAt(0).toUpperCase())
    .join("");
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export default function InviteMembersModal({
  open,
  onOpenChange,
  brandId,
  workspaceId,
  workspaceName = "Workspace",
}: InviteMembersModalProps) {
  const [email, setEmail] = useState("");
  const [accessType, setAccessType] = useState<AccessType>("full_access");
  const [inviteLink, setInviteLink] = useState("");
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const activeWorkspaceId = useMemo(() => {
    if (workspaceId) return workspaceId;

    if (typeof window === "undefined") return "";

    return (
      window.localStorage.getItem("workspaceId") ||
      window.localStorage.getItem("currentWorkspaceId") ||
      ""
    );
  }, [workspaceId]);

  const activeBrandId = useMemo(() => {
    if (brandId) return brandId;

    if (typeof window === "undefined") return "";

    return (
      window.localStorage.getItem("brandId") ||
      window.localStorage.getItem("currentBrandId") ||
      ""
    );
  }, [brandId]);

  const defaultInviteLink = useMemo(() => {
    if (typeof window === "undefined") return "";

    return `${window.location.origin}/brand/settings/workspace`;
  }, []);

  useEffect(() => {
    if (!open) return;

    setError("");
    setCopied(false);
    setInviteLink(defaultInviteLink);

    if (!activeWorkspaceId) return;

    let cancelled = false;

    async function loadMembers() {
      try {
        setMembersLoading(true);

        const token = getAuthToken();

        const response = await fetch(
          buildWorkspaceApiUrl(`/workspaces/${activeWorkspaceId}/members`),
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        const json = await response.json().catch(() => null);

        if (cancelled) return;

        const list =
          json?.data?.members ||
          json?.members ||
          json?.data ||
          [];

        setMembers(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setMembers([]);
      } finally {
        if (!cancelled) setMembersLoading(false);
      }
    }

    loadMembers();

    return () => {
      cancelled = true;
    };
  }, [open, activeWorkspaceId, defaultInviteLink]);

  async function handleInvite() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter an email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!activeWorkspaceId) {
      setError("Workspace is missing. Please refresh and try again.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const token = getAuthToken();

      const response = await fetch(
        buildWorkspaceApiUrl(`/workspaces/${activeWorkspaceId}/invitations`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            email: cleanEmail,
            role: accessType === "full_access" ? "admin" : "viewer",
            accessType,
            brandId: activeBrandId || undefined,
          }),
        }
      );

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          json?.message ||
            json?.error ||
            json?.data?.message ||
            "Failed to send workspace invitation."
        );
      }

      const link =
        json?.data?.inviteLink ||
        json?.data?.invitation?.inviteLink ||
        json?.inviteLink ||
        json?.data?.link ||
        defaultInviteLink;

      setInviteLink(link);
      setEmail("");

      const newMember: WorkspaceMember = {
        email: cleanEmail,
        name: cleanEmail.split("@")[0],
        accessType,
        role: accessType === "full_access" ? "admin" : "viewer",
        status: "pending",
      };

      setMembers((prev) => {
        const exists = prev.some(
          (item) => String(item.email || "").toLowerCase() === cleanEmail
        );

        if (exists) return prev;

        return [newMember, ...prev];
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    const link = inviteLink || defaultInviteLink;

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1200);
    } catch {
      setCopied(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[760px] rounded-[20px] bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
          <h2 className="text-[22px] font-semibold text-[#1a1a1a]">
            Invite Members
          </h2>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="grid h-9 w-9 place-items-center rounded-full text-[#1a1a1a] hover:bg-neutral-100"
            aria-label="Close invite members modal"
          >
            <X size={22} />
          </button>
        </div>

        <div className="mt-6 flex gap-4">
          <div className="flex min-h-[50px] flex-1 items-center overflow-hidden rounded-xl border border-neutral-300 bg-white">
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="enter email address to share the invite"
              className="h-full min-w-0 flex-1 px-4 text-[15px] outline-none placeholder:text-neutral-400"
            />

            <div className="h-8 w-px bg-neutral-200" />

            <div className="relative">
              <select
                value={accessType}
                onChange={(event) =>
                  setAccessType(event.target.value as AccessType)
                }
                className="h-[50px] appearance-none bg-transparent pl-4 pr-10 text-[14px] font-medium text-[#1a1a1a] outline-none"
              >
                <option value="full_access">Full Access</option>
                <option value="limited_access">Limited Access</option>
              </select>

              <CaretDown
                size={18}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#1a1a1a]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleInvite}
            disabled={loading}
            className="h-[50px] min-w-[118px] rounded-xl bg-[#1a1a1a] px-6 text-[15px] font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Inviting..." : "Invite"}
          </button>
        </div>

        {error ? (
          <p className="mt-3 text-[13px] font-medium text-red-500">{error}</p>
        ) : null}

        <div className="mt-6 rounded-2xl bg-gradient-to-r from-[#EAF6FF] via-[#F7E7FF] to-[#F6DDF4] p-5">
          <p className="mb-3 text-[14px] font-medium text-[#1a1a1a]">
            Share Invite Link
          </p>

          <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
            <input
              value={inviteLink || defaultInviteLink}
              readOnly
              className="min-w-0 flex-1 bg-transparent text-[15px] text-neutral-400 outline-none"
            />

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-[14px] font-medium text-[#1a1a1a] hover:bg-neutral-100"
            >
              {copied ? (
                <>
                  <Copy size={17} />
                  Copied
                </>
              ) : (
                <>
                  <LinkSimple size={17} />
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-[20px] font-semibold text-[#1a1a1a]">
              Account shared with
            </h3>

            <span className="text-[13px] text-neutral-400">
              {workspaceName}
            </span>
          </div>

          {membersLoading ? (
            <div className="py-6 text-center text-[14px] text-neutral-500">
              Loading members...
            </div>
          ) : members.length ? (
            <div className="space-y-4">
              {members.slice(0, 5).map((member, index) => {
                const name =
                  member.name ||
                  member.email?.split("@")[0] ||
                  `Member ${index + 1}`;

                const avatar = member.avatar || member.profilePic || "";

                return (
                  <div
                    key={member._id || member.id || member.email || index}
                    className="flex items-center gap-3"
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-neutral-200 text-[13px] font-semibold text-[#1a1a1a]">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getInitials(name)
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium text-[#1a1a1a]">
                        {name}
                      </p>

                      <p className="truncate text-[12px] text-neutral-400">
                        {member.email || "No email"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-[14px] font-medium text-[#1a1a1a]">
                      {member.role === "owner"
                        ? "Owner"
                        : normalizeAccessLabel(member.accessType)}

                      {member.status === "pending" ? (
                        <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] text-yellow-700">
                          Pending
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-200 py-8 text-center text-[14px] text-neutral-400">
              No members found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}