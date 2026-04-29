"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { post } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HiCheck, HiSearch, HiUserGroup, HiX } from "react-icons/hi";

type EligibleMember = {
  adminId: string;
  name: string;
  email?: string;
  role: "ime" | "bme" | string;
};

type EligibleRevenueHead = {
  adminId: string;
  name: string;
  email?: string;
  role: "revenue_head" | string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  adminId: string;
  onCreated?: (group: any) => void;
}

function readAdminRoleFromStorage() {
  if (typeof window === "undefined") return null;

  const direct = localStorage.getItem("adminRole");
  if (direct) return direct;

  try {
    const rawAdmin = localStorage.getItem("admin");
    if (rawAdmin) {
      const parsed = JSON.parse(rawAdmin);
      if (parsed?.role) return parsed.role;
    }
  } catch {}

  try {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed?.role) return parsed.role;
    }
  } catch {}

  return null;
}

function initials(name: string) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.[0] || "A").toUpperCase();
}

function RoleBadge({ role }: { role?: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600">
      {role || "member"}
    </span>
  );
}

export default function CreateGroupModal({
  open,
  onClose,
  adminId,
  onCreated,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [revenueHeads, setRevenueHeads] = useState<EligibleRevenueHead[]>([]);
  const [selectedRevenueHeadId, setSelectedRevenueHeadId] = useState("");
  const [members, setMembers] = useState<EligibleMember[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingRevenueHeads, setLoadingRevenueHeads] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const normalizedRole = String(adminRole || "").toLowerCase();
  const isRevenueHead = normalizedRole === "revenue_head";
  const isSuperAdmin = normalizedRole === "super_admin";

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    setAdminRole(readAdminRoleFromStorage());
  }, [open]);

  useEffect(() => {
    if (!open) return;

    setError(null);
    setMembers([]);
    setSelectedIds([]);
    setRevenueHeads([]);
    setSelectedRevenueHeadId("");

    if (isRevenueHead) {
      setLoadingMembers(true);

      post<{ members: EligibleMember[] }>("/group-chat/eligible-members", {
        adminId,
      })
        .then((res) => {
          setMembers(Array.isArray(res?.members) ? res.members : []);
        })
        .catch((err) => {
          console.error("eligible-members error:", err);
          setError("Failed to load IME/BME members.");
        })
        .finally(() => setLoadingMembers(false));

      return;
    }

    if (isSuperAdmin) {
      setLoadingRevenueHeads(true);

      post<{ revenueHeads: EligibleRevenueHead[] }>(
        "/group-chat/eligible-revenue-heads",
        { adminId }
      )
        .then((res) => {
          const list = Array.isArray(res?.revenueHeads) ? res.revenueHeads : [];
          setRevenueHeads(list);

          if (list.length === 1) {
            setSelectedRevenueHeadId(list[0].adminId);
          }
        })
        .catch((err) => {
          console.error("eligible-revenue-heads error:", err);
          setError("Failed to load Revenue Heads.");
        })
        .finally(() => setLoadingRevenueHeads(false));

      return;
    }

    setError("Only super admin or revenue head can create a group.");
  }, [open, adminId, isRevenueHead, isSuperAdmin]);

  useEffect(() => {
    if (!open) return;
    if (!isSuperAdmin) return;
    if (!selectedRevenueHeadId) {
      setMembers([]);
      setSelectedIds([]);
      return;
    }

    setLoadingMembers(true);
    setError(null);
    setSelectedIds([]);

    post<{ members: EligibleMember[] }>("/group-chat/eligible-members", {
      adminId,
      revenueHeadId: selectedRevenueHeadId,
    })
      .then((res) => {
        setMembers(Array.isArray(res?.members) ? res.members : []);
      })
      .catch((err) => {
        console.error("eligible-members error:", err);
        setError("Failed to load IME/BME members.");
        setMembers([]);
      })
      .finally(() => setLoadingMembers(false));
  }, [open, isSuperAdmin, selectedRevenueHeadId, adminId]);

  useEffect(() => {
    if (!open) {
      setGroupName("");
      setDescription("");
      setRevenueHeads([]);
      setSelectedRevenueHeadId("");
      setMembers([]);
      setSelectedIds([]);
      setSearch("");
      setError(null);
      setLoadingRevenueHeads(false);
      setLoadingMembers(false);
      setSaving(false);
    }
  }, [open]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;

    return members.filter((m) => {
      return (
        m.name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.role?.toLowerCase().includes(q)
      );
    });
  }, [members, search]);

  const selectedRevenueHead = useMemo(() => {
    return revenueHeads.find((r) => r.adminId === selectedRevenueHeadId) || null;
  }, [revenueHeads, selectedRevenueHeadId]);

  const toggleMember = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError("Group name is required.");
      return;
    }

    if (isSuperAdmin && !selectedRevenueHeadId) {
      setError("Please select a Revenue Head.");
      return;
    }

    if (selectedIds.length === 0) {
      setError("Please select at least one IME/BME.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload: Record<string, any> = {
        creatorId: adminId,
        groupName: groupName.trim(),
        description: description.trim(),
        memberIds: selectedIds,
      };

      if (isSuperAdmin) {
        payload.revenueHeadId = selectedRevenueHeadId;
      }

      const res = await post("/group-chat/create", payload);

      onCreated?.(res?.group);
      onClose();
    } catch (err: any) {
      console.error("create group error:", err);
      setError(err?.response?.data?.message || "Failed to create group.");
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] border border-white/20 bg-white shadow-2xl shadow-slate-950/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden bg-slate-950 px-6 py-6 text-white">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-indigo-500/30 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                <HiUserGroup className="h-4 w-4" /> New workspace
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">
                Create Group
              </h2>
              <p className="mt-1 text-sm text-white/65">
                Set the group identity, assign leadership, and select IME/BME members.
              </p>
            </div>

            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
              type="button"
              title="Close"
            >
              <HiX className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/80 px-5 py-5 sm:px-6">
          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.25fr]">
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                    Group details
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Group Name
                    </label>
                    <Input
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Enter group name"
                      className="h-11 rounded-2xl border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Description
                    </label>
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Optional description"
                      className="h-11 rounded-2xl border-slate-200"
                    />
                  </div>
                </div>
              </div>

              {isSuperAdmin ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Select Revenue Head
                  </label>

                  <select
                    value={selectedRevenueHeadId}
                    onChange={(e) => setSelectedRevenueHeadId(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-950/5"
                    disabled={loadingRevenueHeads}
                  >
                    <option value="">
                      {loadingRevenueHeads
                        ? "Loading Revenue Heads..."
                        : "Select Revenue Head"}
                    </option>

                    {revenueHeads.map((rh) => (
                      <option key={rh.adminId} value={rh.adminId}>
                        {rh.name} {rh.email ? `(${rh.email})` : ""}
                      </option>
                    ))}
                  </select>

                  {selectedRevenueHead ? (
                    <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
                          {initials(selectedRevenueHead.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-bold text-slate-950">
                            {selectedRevenueHead.name}
                          </div>
                          <div className="truncate text-sm text-slate-500">
                            {selectedRevenueHead.email || "No email"}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                        Revenue Head • Auto included
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-sm font-bold text-slate-950">
                    Revenue Head Group
                  </div>
                  <div className="mt-1 text-sm leading-6 text-slate-500">
                    You are creating this group under your own team.
                  </div>
                </div>
              )}

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-sm font-bold text-slate-500">Selected Members</div>
                <div className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
                  {selectedIds.length}
                </div>
                <div className="mt-1 text-sm text-slate-500">IME / BME selected</div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-950">
                    Select IME / BME Members
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Search and choose members for this group.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {filteredMembers.length} visible
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 transition focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-950/5">
                <HiSearch className="h-5 w-5 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, role"
                  disabled={isSuperAdmin && !selectedRevenueHeadId}
                  className="h-8 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                />
              </div>

              <div className="mt-4 max-h-[430px] space-y-2 overflow-y-auto pr-1">
                {isSuperAdmin && !selectedRevenueHeadId ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">
                    Select a Revenue Head first.
                  </div>
                ) : loadingMembers ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">
                    Loading members...
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">
                    No IME/BME members found.
                  </div>
                ) : (
                  filteredMembers.map((member) => {
                    const checked = selectedIds.includes(member.adminId);

                    return (
                      <label
                        key={member.adminId}
                        className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                          checked
                            ? "border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-900/15"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleMember(member.adminId)}
                          className="sr-only"
                        />

                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${
                            checked
                              ? "bg-white text-slate-950"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {checked ? <HiCheck className="h-5 w-5" /> : initials(member.name)}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="truncate font-bold">{member.name}</div>
                          <div
                            className={`truncate text-sm ${
                              checked ? "text-white/65" : "text-slate-500"
                            }`}
                          >
                            {member.email || "No email"}
                          </div>
                        </div>

                        <RoleBadge role={member.role} />
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="border-t border-red-100 bg-red-50 px-6 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="rounded-2xl border-slate-200"
          >
            Cancel
          </Button>

          <Button
            onClick={handleCreate}
            disabled={
              saving ||
              !groupName.trim() ||
              (isSuperAdmin && !selectedRevenueHeadId) ||
              selectedIds.length === 0
            }
            className="rounded-2xl bg-slate-950 px-5 text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800"
          >
            {saving ? "Creating..." : "Create Group"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
