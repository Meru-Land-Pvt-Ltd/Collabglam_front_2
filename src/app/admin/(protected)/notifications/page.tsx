"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { get, post } from "@/lib/api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  HiOutlineBell,
  HiOutlineRefresh,
  HiOutlineCheck,
  HiOutlineTrash,
  HiOutlineSearch,
  HiOutlineExternalLink,
} from "react-icons/hi";

type ActionPath =
  | string
  | {
      admin?: string;
      brand?: string;
      influencer?: string;
    };

type AdminNotification = {
  _id: string;
  notificationId?: string;

  brandId?: string | null;
  influencerId?: string | null;
  adminId?: string | null;

  type: string;
  title: string;
  message: string;

  entityType?: string | null;
  entityId?: string | null;
  actionPath?: ActionPath | null;

  actorAdminId?: string | null;
  actorName?: string;
  actorEmail?: string;
  actorRole?: string;

  adminRecipientCount?: number;
  brandRecipientCount?: number;
  influencerRecipientCount?: number;
  _recipientRows?: string[];

  isRead?: boolean;
  read?: number;
  createdAt?: string;
  updatedAt?: string;
};

type ListResponse =
  | AdminNotification[]
  | {
      success?: boolean;
      data?: AdminNotification[];
      total?: number;
      unread?: number;
      unreadCount?: number;
      page?: number;
      limit?: number;
      pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    };

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isUnread(notification: AdminNotification) {
  if (typeof notification.isRead === "boolean") return !notification.isRead;
  if (typeof notification.read === "number") return notification.read !== 1;
  return false;
}

function formatTime(iso?: string) {
  if (!iso) return "—";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAdminActionPath(actionPath?: ActionPath | null) {
  if (!actionPath) return "";
  if (typeof actionPath === "string") return actionPath;
  return actionPath.admin || actionPath.brand || actionPath.influencer || "";
}

function uniq(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function formatTypeLabel(type = "") {
  const value = String(type || "").trim();
  if (!value) return "Notification";

  return value
    .replace(/\./g, " · ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatRoleLabel(role = "") {
  const value = String(role || "").trim().toLowerCase();

  if (value === "super_admin") return "Super Admin";
  if (value === "revenue_head") return "RH";
  if (value === "bme") return "BME";
  if (value === "ime") return "IME";
  if (value === "sdr") return "SDR";

  return value ? value.replace(/_/g, " ").toUpperCase() : "";
}

function getActorLabel(notification: AdminNotification) {
  const name = String(notification.actorName || "").trim();
  const email = String(notification.actorEmail || "").trim();
  const role = formatRoleLabel(notification.actorRole || "");

  if (name && role) return `${name} (${role})`;
  if (name) return name;
  if (email && role) return `${email} (${role})`;
  if (email) return email;
  if (role) return role;

  return "";
}

function getActorInitial(notification: AdminNotification) {
  const label = getActorLabel(notification);
  if (!label) return "A";
  return label.charAt(0).toUpperCase();
}

function getNotificationContext(notification: AdminNotification) {
  const entityType = String(notification.entityType || "").trim();
  const entityId = String(notification.entityId || "").trim();

  if (!entityType && !entityId) return "";

  if (entityType && entityId) {
    return `${entityType.replace(/_/g, " ")} · ${entityId}`;
  }

  return entityType || entityId;
}

function sortNotifications(rows: AdminNotification[]) {
  return [...rows].sort((a, b) => {
    const unreadDiff = Number(isUnread(b)) - Number(isUnread(a));
    if (unreadDiff) return unreadDiff;

    const bTime = new Date(b.createdAt || b.updatedAt || 0).getTime();
    const aTime = new Date(a.createdAt || a.updatedAt || 0).getTime();

    return bTime - aTime;
  });
}

function getNotificationListFromResponse(res: ListResponse) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

function getUnreadCountFromResponse(res: ListResponse, rows: AdminNotification[]) {
  if (!Array.isArray(res)) {
    if (typeof res?.unreadCount === "number") return res.unreadCount;
    if (typeof res?.unread === "number") return res.unread;
  }

  return rows.filter(isUnread).length;
}

export default function AdminNotificationsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const [rows, setRows] = useState<AdminNotification[]>([]);
  const [serverUnreadCount, setServerUnreadCount] = useState<number | null>(null);

  const [mode, setMode] = useState<"all" | "unread">("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  const setBusy = useCallback((id: string, value: boolean) => {
    setBusyIds((prev) => ({
      ...prev,
      [id]: value,
    }));
  }, []);

  const fetchNotifications = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) setLoading(true);
        setError(null);

        const res = await get<ListResponse>("/notifications/admin");
        const list = getNotificationListFromResponse(res);
        const sorted = sortNotifications(list);

        setRows(sorted);
        setServerUnreadCount(getUnreadCountFromResponse(res, sorted));
      } catch (error: any) {
        console.error(error);
        setError(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to load notifications."
        );
        setRows([]);
        setServerUnreadCount(null);
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void fetchNotifications(true);
  }, [fetchNotifications]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void fetchNotifications(false);
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [fetchNotifications]);

  const types = useMemo(
    () => uniq(rows.map((row) => row.type)).sort((a, b) => a.localeCompare(b)),
    [rows]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows.filter((notification) => {
      if (mode === "unread" && !isUnread(notification)) return false;
      if (typeFilter && notification.type !== typeFilter) return false;

      if (!term) return true;

      const haystack = [
        notification.title,
        notification.message,
        notification.type,
        formatTypeLabel(notification.type),
        notification.entityType || "",
        notification.entityId || "",
        notification.actorName || "",
        notification.actorEmail || "",
        notification.actorRole || "",
        formatRoleLabel(notification.actorRole || ""),
        getActorLabel(notification),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [rows, mode, search, typeFilter]);

  const unreadCount = useMemo(() => {
    if (typeof serverUnreadCount === "number") return serverUnreadCount;
    return rows.filter(isUnread).length;
  }, [rows, serverUnreadCount]);

  const markRead = useCallback(
    async (id: string) => {
      setBusy(id, true);

      try {
        await post("/notifications/admin/mark-read", { id });

        setRows((prev) =>
          sortNotifications(
            prev.map((notification) =>
              notification._id === id
                ? { ...notification, isRead: true, read: 1 }
                : notification
            )
          )
        );

        setServerUnreadCount((prev) =>
          typeof prev === "number" ? Math.max(0, prev - 1) : prev
        );
      } catch (error: any) {
        console.error(error);
        setError(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to mark notification as read."
        );
      } finally {
        setBusy(id, false);
      }
    },
    [setBusy]
  );

  const markAllRead = useCallback(async () => {
    setBusy("__ALL__", true);

    try {
      await post("/notifications/admin/mark-all-read", {});

      setRows((prev) =>
        prev.map((notification) => ({
          ...notification,
          isRead: true,
          read: 1,
        }))
      );

      setServerUnreadCount(0);
    } catch (error: any) {
      console.error(error);
      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to mark all notifications as read."
      );
    } finally {
      setBusy("__ALL__", false);
    }
  }, [setBusy]);

  const deleteOne = useCallback(
    async (id: string) => {
      setBusy(id, true);

      try {
        const target = rows.find((notification) => notification._id === id);

        await post("/notifications/admin/delete", { id });

        setRows((prev) => prev.filter((notification) => notification._id !== id));

        if (target && isUnread(target)) {
          setServerUnreadCount((prev) =>
            typeof prev === "number" ? Math.max(0, prev - 1) : prev
          );
        }
      } catch (error: any) {
        console.error(error);
        setError(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to delete notification."
        );
      } finally {
        setBusy(id, false);
      }
    },
    [rows, setBusy]
  );

  const openNotification = useCallback(
    async (notification: AdminNotification) => {
      if (isUnread(notification)) {
        await markRead(notification._id);
      }

      const path = getAdminActionPath(notification.actionPath);
      if (path) router.push(path);
    },
    [markRead, router]
  );

  const clearFilters = useCallback(() => {
    setSearch("");
    setTypeFilter("");
    setMode("all");
  }, []);

  return (
    <div className="min-h-screen space-y-6 p-6 md:p-8">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
            <HiOutlineBell className="h-6 w-6 text-orange-600" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Notifications
            </h1>

            <p className="text-sm text-gray-600">
              Admin notifications are filtered automatically by your role.
              {unreadCount > 0 ? (
                <span className="ml-2 inline-flex items-center">
                  <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                    {unreadCount} unread
                  </Badge>
                </span>
              ) : null}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => void fetchNotifications(true)}
            disabled={loading || !!busyIds.__ALL__}
          >
            <HiOutlineRefresh className="mr-2 h-4 w-4" />
            Refresh
          </Button>

          <Button
            onClick={markAllRead}
            disabled={loading || unreadCount === 0 || !!busyIds.__ALL__}
            className="bg-gradient-to-r from-[#FFA135] to-[#FF7236] text-white"
          >
            <HiOutlineCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        </div>
      </div>

      <Card className="border-gray-200 bg-white">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <Button
                variant={mode === "all" ? "default" : "outline"}
                onClick={() => setMode("all")}
                className={mode === "all" ? "bg-gray-900 text-white" : ""}
              >
                All
              </Button>

              <Button
                variant={mode === "unread" ? "default" : "outline"}
                onClick={() => setMode("unread")}
                className={mode === "unread" ? "bg-gray-900 text-white" : ""}
              >
                Unread
              </Button>
            </div>

            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, actor, type..."
                className="h-11 pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">All types</option>

                {types.map((type) => (
                  <option key={type} value={type}>
                    {formatTypeLabel(type)}
                  </option>
                ))}
              </select>

              {search || typeFilter || mode !== "all" ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200 bg-white">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Inbox ({filtered.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-lg bg-gray-100"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              <div className="font-medium">Something went wrong</div>
              <div className="mt-1 text-sm">{error}</div>

              <Button
                variant="outline"
                className="mt-4"
                onClick={() => void fetchNotifications(true)}
              >
                Try again
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-gray-600">
              No notifications found.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((notification) => {
                const unread = isUnread(notification);
                const path = getAdminActionPath(notification.actionPath);
                const actorLabel = getActorLabel(notification);
                const context = getNotificationContext(notification);
                const busy = !!busyIds[notification._id];

                return (
                  <div
                    key={notification._id}
                    className={cx(
                      "flex flex-col gap-3 rounded-lg px-2 py-4 transition-colors",
                      unread ? "bg-orange-50/60" : "bg-transparent"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 gap-3">
                        <div
                          className={cx(
                            "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                            unread
                              ? "bg-orange-600 text-white"
                              : "bg-gray-100 text-gray-700"
                          )}
                        >
                          {getActorInitial(notification)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="truncate font-semibold text-gray-900">
                              {notification.title}
                            </div>

                            {unread ? (
                              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                                Unread
                              </Badge>
                            ) : null}

                            <Badge variant="outline" className="text-gray-600">
                              {formatTypeLabel(notification.type)}
                            </Badge>
                          </div>

                          <div className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700">
                            {notification.message}
                          </div>

                          {actorLabel ? (
                            <div className="mt-2 text-sm text-gray-700">
                              <span className="font-medium text-gray-900">
                                Created by:
                              </span>{" "}
                              {actorLabel}
                            </div>
                          ) : null}

                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            <span>{formatTime(notification.createdAt)}</span>

                            {context ? (
                              <>
                                <span>•</span>
                                <span className="capitalize">{context}</span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {path ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openNotification(notification)}
                            disabled={busy}
                            title="Open"
                          >
                            <HiOutlineExternalLink className="mr-1 h-4 w-4" />
                            Open
                          </Button>
                        ) : null}

                        {unread ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markRead(notification._id)}
                            disabled={busy}
                            title="Mark as read"
                          >
                            <HiOutlineCheck className="mr-1 h-4 w-4" />
                            Read
                          </Button>
                        ) : null}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteOne(notification._id)}
                          disabled={busy}
                          title="Delete"
                          className="text-red-600 hover:text-red-700"
                        >
                          <HiOutlineTrash className="mr-1 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>

                    <Separator />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}