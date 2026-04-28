"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { post } from "@/lib/api";
import {
  HiChatAlt2,
  HiPlus,
  HiRefresh,
  HiSearch,
  HiUserGroup,
} from "react-icons/hi";
import CreateGroupModal from "./createGroupModal";

type Participant = {
  adminId: string;
  name: string;
  email?: string;
  role?: string;
};

type LastMessage = {
  senderId: string;
  text: string;
  timestamp: string;
};

type GroupSummary = {
  groupId: string;
  groupName: string;
  description?: string;
  participants: Participant[];
  lastMessage: LastMessage | null;
  unseenCount: number;
};

const NAME_MAX = 34;
const MSG_MAX = 76;

const ellipsize = (s: string | undefined | null, max: number) => {
  const str = (s ?? "").replace(/\s+/g, " ").trim();
  return str.length > max
    ? str.slice(0, Math.max(0, max - 1)).trimEnd() + "…"
    : str;
};

function readAdminFromStorage() {
  if (typeof window === "undefined") {
    return { adminId: null, adminRole: null };
  }

  const adminId = localStorage.getItem("adminId");
  let adminRole = localStorage.getItem("adminRole");

  if (!adminRole) {
    try {
      const rawAdmin = localStorage.getItem("admin");
      if (rawAdmin) {
        const parsed = JSON.parse(rawAdmin);
        adminRole = parsed?.role || null;
      }
    } catch {}
  }

  if (!adminRole) {
    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        adminRole = parsed?.role || null;
      }
    } catch {}
  }

  return { adminId, adminRole };
}

function formatTime(timestamp?: string) {
  if (!timestamp) return "--:--";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "--:--";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(name: string) {
  const clean = name.trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (clean.charAt(0) || "G").toUpperCase();
}

function GroupSkeleton() {
  return (
    <div className="space-y-3 p-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex gap-3">
            <div className="h-12 w-12 animate-pulse rounded-2xl bg-slate-100" />
            <div className="flex-1 space-y-3">
              <div className="h-3 w-2/3 animate-pulse rounded-full bg-slate-100" />
              <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
              <div className="h-3 w-1/2 animate-pulse rounded-full bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MessagesList() {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");

  const pathname = usePathname();

  useEffect(() => {
    const { adminId, adminRole } = readAdminFromStorage();
    setAdminId(adminId);
    setAdminRole(adminRole);
  }, []);

  const loadGroups = useCallback(
    async (id?: string | null) => {
      const finalAdminId = id || adminId;
      if (!finalAdminId) return;

      try {
        setLoading(true);
        setError(null);

        const data = await post<{ groups: GroupSummary[] }>(
          "/group-chat/groups",
          {
            adminId: finalAdminId,
          }
        );

        setGroups(Array.isArray(data?.groups) ? data.groups : []);
      } catch (err) {
        console.error("Error loading group chats:", err);
        setError("Failed to load group chats.");
      } finally {
        setLoading(false);
      }
    },
    [adminId]
  );

  useEffect(() => {
    if (!adminId) {
      setLoading(false);
      setError("No adminId in localStorage");
      return;
    }

    loadGroups(adminId);
  }, [adminId, loadGroups]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups || [];

    return (groups || []).filter((group) => {
      const members = (group.participants || [])
        .map((p) => `${p.name || ""} ${p.email || ""} ${p.role || ""}`)
        .join(" ");

      return `${group.groupName || ""} ${group.description || ""} ${members}`
        .toLowerCase()
        .includes(q);
    });
  }, [groups, query]);

  const totalUnread = useMemo(
    () => groups.reduce((sum, group) => sum + (group.unseenCount || 0), 0),
    [groups]
  );

  const normalizedRole = String(adminRole || "").toLowerCase();
  const canCreateGroup =
    normalizedRole === "revenue_head" || normalizedRole === "super_admin";

  return (
    <>
      <div className="flex h-full min-h-0 flex-col bg-white">
        <div className="shrink-0 border-b border-slate-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_52%,#eef2ff_100%)] px-5 pb-5 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Live workspace
              </div>
              <h2 className="mt-3 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-950">
                <HiChatAlt2 className="h-6 w-6" /> Messages
              </h2>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                type="button"
                className="h-10 w-10 rounded-2xl border-slate-200 bg-white shadow-sm"
                onClick={() => loadGroups(adminId)}
                title="Refresh groups"
              >
                <HiRefresh className="h-4 w-4" />
              </Button>

              {canCreateGroup && adminId ? (
                <Button
                  size="sm"
                  type="button"
                  className="h-10 rounded-2xl bg-slate-950 px-4 text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800"
                  onClick={() => setCreateOpen(true)}
                >
                  <HiPlus className="mr-1.5 h-4 w-4" />
                  New
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
              <div className="text-2xl font-bold text-slate-950">{groups.length}</div>
              <div className="text-xs font-medium text-slate-500">Groups</div>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
              <div className="text-2xl font-bold text-slate-950">{totalUnread}</div>
              <div className="text-xs font-medium text-slate-500">Unread</div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-950/5">
            <HiSearch className="h-5 w-5 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search groups or members"
              className="h-8 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {loading ? (
          <GroupSkeleton />
        ) : error ? (
          <div className="p-4">
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {filteredGroups.map((group) => {
              const isActive = pathname?.endsWith(group.groupId);
              const groupName = group.groupName || "Untitled Group";
              const nameLabel = ellipsize(groupName, NAME_MAX);
              const participantCount = Array.isArray(group.participants)
                ? group.participants.length
                : 0;

              const preview =
                group.lastMessage?.text?.trim() ||
                group.description?.trim() ||
                `${participantCount} member${participantCount === 1 ? "" : "s"}`;

              const textLabel = ellipsize(preview, MSG_MAX);
              const lastTime = formatTime(group.lastMessage?.timestamp);
              const unread = group.unseenCount || 0;

              return (
                <Link
                  key={group.groupId}
                  href={`/admin/team-discussions/${group.groupId}`}
                  className={`group relative block overflow-hidden rounded-3xl border p-3.5 transition-all duration-200 ${
                    isActive
                      ? "border-slate-950 bg-slate-950 text-white shadow-xl shadow-slate-900/20"
                      : "border-slate-200/80 bg-white text-slate-950 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/80"
                  }`}
                >
                  {isActive ? (
                    <span className="absolute inset-y-5 left-0 w-1 rounded-r-full bg-white" />
                  ) : null}

                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 shrink-0 rounded-2xl border border-white/40 shadow-sm">
                      <AvatarFallback
                        className={`rounded-2xl text-sm font-bold ${
                          isActive
                            ? "bg-white text-slate-950"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {initials(groupName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p
                          className="truncate text-sm font-bold tracking-tight"
                          title={groupName}
                        >
                          {nameLabel}
                        </p>
                        <span
                          className={`shrink-0 text-[11px] font-medium ${
                            isActive ? "text-white/60" : "text-slate-400"
                          }`}
                        >
                          {lastTime}
                        </span>
                      </div>

                      <p
                        className={`mt-1.5 truncate text-sm leading-5 ${
                          isActive ? "text-white/70" : "text-slate-500"
                        }`}
                        title={preview}
                      >
                        {textLabel}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <div className="flex -space-x-2">
                            {(group.participants || []).slice(0, 3).map((p) => (
                              <span
                                key={p.adminId}
                                title={p.name}
                                className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-bold ${
                                  isActive
                                    ? "border-slate-950 bg-white text-slate-950"
                                    : "border-white bg-slate-100 text-slate-600"
                                }`}
                              >
                                {initials(p.name || "A")}
                              </span>
                            ))}
                          </div>

                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                              isActive
                                ? "bg-white/10 text-white/70"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <HiUserGroup className="h-3.5 w-3.5" />
                            {participantCount}
                          </span>
                        </div>

                        {unread > 0 ? (
                          <span
                            className={`flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px] font-bold ${
                              isActive
                                ? "bg-white text-slate-950"
                                : "bg-slate-950 text-white"
                            }`}
                            title={`${unread} unread`}
                          >
                            {unread > 99 ? "99+" : unread}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}

            {!filteredGroups.length ? (
              <div className="flex h-full min-h-[280px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center">
                <div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                    <HiChatAlt2 className="h-6 w-6" />
                  </div>
                  <div className="mt-3 text-sm font-semibold text-slate-950">
                    No group chats found
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {query ? "Try a different search keyword." : "Create a group to begin."}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {canCreateGroup && adminId ? (
        <CreateGroupModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          adminId={adminId}
          onCreated={() => {
            loadGroups(adminId);
          }}
        />
      ) : null}
    </>
  );
}
