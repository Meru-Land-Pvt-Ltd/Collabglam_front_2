"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  Inbox,
  Mail,
  MessageSquareText,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  UserCheck,
  XCircle,
} from "lucide-react";
import { adminGet, adminPost } from "@/lib/api";

type ApiState = { type: "success" | "error" | "info"; text: string } | null;

type AdminOption = {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
};

type ThreadMailboxes = {
  campaignSenderEmail?: string;
  campaignSenderName?: string;
  currentReplyFromEmail?: string;
  currentReplyFromName?: string;
  RHEmail?: string;
  RHName?: string;
  bmeEmail?: string;
  bmeName?: string;
  imeEmail?: string;
  imeName?: string;
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
  mailboxes?: ThreadMailboxes | null;
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
  campaignId?: { _id?: string; name?: string } | null;
  sdrId?: { _id?: string; name?: string; email?: string } | null;
  RHId?: { _id?: string; name?: string; email?: string } | null;
  assignedBmeId?: { _id?: string; name?: string; email?: string } | null;
  mailboxes?: ThreadMailboxes | null;
};

type ThreadMessage = {
  _id: string;
  direction: "inbound" | "outbound" | string;
  from?: string;
  fromName?: string;
  to?: string[];
  toNames?: string[];
  fromDisplayName?: string;
  toDisplayNames?: string[];
  cc?: string[];
  ccNames?: string[];
  bcc?: string[];
  bccNames?: string[];
  subject?: string;
  bodyText?: string;
  bodyHtml?: string;
  sentAt?: string | null;
  receivedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type ThreadDetailResponse = {
  thread: any | null;
  messages: ThreadMessage[];
};

type FilterOption = {
  _id: string;
  name: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getInitials(name?: string) {
  const value = String(name || "").trim();
  if (!value) return "?";

  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatInboxDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function getAdminLabel(admin: any) {
  if (!admin) return "—";
  if (typeof admin === "string") return admin;
  if (admin.name && admin.email) return `${admin.name} · ${admin.email}`;
  return admin.name || admin.email || admin._id || "—";
}

function getShortAdminLabel(admin: any) {
  if (!admin) return "—";
  if (typeof admin === "string") return admin;
  return admin.name || admin.email || admin._id || "—";
}

function getStagePillClasses(stage?: string) {
  const value = String(stage || "").toLowerCase();

  if (value.includes("replied")) return "border-blue-200 bg-blue-50 text-blue-700";
  if (value.includes("assigned_to_bme")) return "border-violet-200 bg-violet-50 text-violet-700";
  if (value.includes("assigned_to_ime")) return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700";
  if (value.includes("unqualified")) return "border-rose-200 bg-rose-50 text-rose-700";
  if (value.includes("qualified")) return "border-emerald-200 bg-emerald-50 text-emerald-700";

  return "border-slate-200 bg-slate-100 text-slate-600";
}

function normalizeStageLabel(stage?: string) {
  return String(stage || "No Stage")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (item) => item.toUpperCase());
}

function getThreadStatusPillClasses(status?: string) {
  const value = String(status || "").toLowerCase();

  if (value === "waiting_on_us") return "border-amber-200 bg-amber-50 text-amber-700";
  if (value === "waiting_on_brand") return "border-blue-200 bg-blue-50 text-blue-700";
  if (value === "closed") return "border-slate-200 bg-slate-100 text-slate-600";

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
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

function parsePendingReplies(payload: any): ReviewRow[] {
  const rows = Array.isArray(payload?.data) ? payload.data : [];

  return rows.map((item: any) => ({
    _id: String(item?._id || ""),
    campaignId: item?.campaignId
      ? {
        _id: String(item.campaignId?._id || ""),
        name: item.campaignId?.name || "",
      }
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
    mailboxes: item?.mailboxes || null,
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
    campaignId: item?.campaignId
      ? {
        _id: String(item.campaignId?._id || ""),
        name: item.campaignId?.name || "",
      }
      : null,
    sdrId: item?.sdrId || null,
    RHId: item?.RHId || null,
    assignedBmeId: item?.assignedBmeId || null,
    mailboxes: item?.mailboxes || null,
  }));
}

function hydrateRepliesWithThreadFallbacks(replies: ReviewRow[], threads: ThreadRow[]) {
  const threadByProspectId = new Map<string, ThreadRow>();

  threads.forEach((thread) => {
    const prospectId = String(thread?.prospectId?._id || "");
    if (prospectId && !threadByProspectId.has(prospectId)) {
      threadByProspectId.set(prospectId, thread);
    }
  });

  return replies.map((reply) => {
    const prospectId = String(reply?.prospectId?._id || "");
    const thread = threadByProspectId.get(prospectId);

    if (!thread) return reply;

    return {
      ...reply,
      campaignId: reply.campaignId?._id ? reply.campaignId : thread.campaignId || reply.campaignId || null,
      sdrId: reply.sdrId?._id ? reply.sdrId : thread.sdrId || reply.sdrId || null,
      RHId: reply.RHId?._id ? reply.RHId : thread.RHId || reply.RHId || null,
      assignedBmeId: reply.assignedBmeId?._id
        ? reply.assignedBmeId
        : thread.assignedBmeId || reply.assignedBmeId || null,
      mailboxes: reply.mailboxes || thread.mailboxes || null,
    };
  });
}

async function hydrateRepliesWithThreadDetailsForMissingCampaigns(
  replies: ReviewRow[],
  threads: ThreadRow[]
) {
  const threadByProspectId = new Map<string, ThreadRow>();

  threads.forEach((thread) => {
    const prospectId = String(thread?.prospectId?._id || "");
    if (prospectId && !threadByProspectId.has(prospectId)) {
      threadByProspectId.set(prospectId, thread);
    }
  });

  const hydrated = await Promise.all(
    replies.map(async (reply) => {
      const hasCampaign = Boolean(reply.campaignId?._id && reply.campaignId?.name);
      const prospectId = String(reply?.prospectId?._id || "");
      const thread = threadByProspectId.get(prospectId);

      if (hasCampaign || !thread?._id) {
        return reply;
      }

      try {
        const payload: any = await adminGet(`/outreach/threads/${thread._id}`);
        const detailThread = payload?.thread || payload?.data?.thread || null;

        return {
          ...reply,
          campaignId:
            reply.campaignId?._id
              ? reply.campaignId
              : detailThread?.campaignId || thread.campaignId || reply.campaignId || null,
          sdrId:
            reply.sdrId?._id
              ? reply.sdrId
              : detailThread?.sdrId || thread.sdrId || reply.sdrId || null,
          RHId:
            reply.RHId?._id
              ? reply.RHId
              : detailThread?.RHId || thread.RHId || reply.RHId || null,
          assignedBmeId:
            reply.assignedBmeId?._id
              ? reply.assignedBmeId
              : detailThread?.assignedBmeId || thread.assignedBmeId || reply.assignedBmeId || null,
          mailboxes: reply.mailboxes || detailThread?.mailboxes || thread.mailboxes || null,
        };
      } catch {
        return reply;
      }
    })
  );

  return hydrated;
}

function parseThreadDetail(payload: any): ThreadDetailResponse {
  return {
    thread: payload?.thread || payload?.data?.thread || null,
    messages: Array.isArray(payload?.messages)
      ? payload.messages
      : Array.isArray(payload?.data?.messages)
        ? payload.data.messages
        : [],
  };
}

function escapeEmailHtml(value = "") {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sanitizeEmailHtml(value = "") {
  return String(value || "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\s+href\s*=\s*(['"])\s*javascript:[\s\S]*?\1/gi, "")
    .trim();
}

function textToThreadHtml(value = "") {
  return escapeEmailHtml(value)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

function stripHtmlForPreview(value = "") {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function getMessageHtml(message: ThreadMessage) {
  if (String(message.bodyHtml || "").trim()) {
    return sanitizeEmailHtml(message.bodyHtml || "");
  }

  return textToThreadHtml(message.bodyText || "");
}

function getMessagePreview(message: ThreadMessage) {
  return (
    stripHtmlForPreview(message.bodyHtml || "") ||
    String(message.bodyText || "").replace(/\s+/g, " ").trim() ||
    "No message content"
  );
}

function getMessageDate(message: ThreadMessage) {
  return message.sentAt || message.receivedAt || message.createdAt || message.updatedAt || "";
}

function getSenderLabel(value = "", fallback = "Unknown Sender") {
  const email = String(value || "").trim();
  if (!email) return fallback;

  const namePart = email.includes("<")
    ? email.split("<")[0].trim()
    : email.split("@")[0];

  return namePart
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function isGenericDisplayName(value?: string | null) {
  const normalized = String(value || "").trim().toLowerCase();

  return (
    !normalized ||
    normalized === "lead" ||
    normalized === "brand" ||
    normalized === "unknown brand" ||
    normalized === "unknown company" ||
    normalized === "unknown contact" ||
    normalized === "outreach team" ||
    normalized === "collabglam" ||
    normalized === "sdr" ||
    normalized === "bme" ||
    normalized === "ime" ||
    normalized === "revenue head"
  );
}

function firstUsefulName(...values: Array<string | null | undefined>) {
  const found = values.find((value) => !isGenericDisplayName(value));
  return String(found || "").trim();
}

function isEmailLike(value?: string | null) {
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(String(value || "").trim());
}

function emailToDisplayName(value?: string | null) {
  const input = String(value || "").trim();

  if (!input) return "";

  const emailMatch = input.match(/<([^>]+)>/);
  const email = emailMatch?.[1] || input;
  const localPart = email.includes("@") ? email.split("@")[0] : email;

  return localPart
    .replace(/\+.*/, "")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getMailboxObject(review: ReviewRow | null, thread: any | null): ThreadMailboxes {
  return {
    ...(review?.mailboxes || {}),
    ...(thread?.mailboxes || {}),
  };
}

function getPreferredMailboxEmail(review: ReviewRow | null, thread: any | null) {
  const mailboxes = getMailboxObject(review, thread);
  const ownerRole = String(thread?.ownerRole || "").trim().toLowerCase();

  if (ownerRole === "bme") {
    return (
      mailboxes.currentReplyFromEmail ||
      mailboxes.bmeEmail ||
      mailboxes.campaignSenderEmail ||
      ""
    );
  }

  if (ownerRole === "ime") {
    return (
      mailboxes.currentReplyFromEmail ||
      mailboxes.imeEmail ||
      mailboxes.campaignSenderEmail ||
      ""
    );
  }

  if (ownerRole === "revenue_head" || ownerRole === "rh") {
    return (
      mailboxes.currentReplyFromEmail ||
      mailboxes.RHEmail ||
      mailboxes.campaignSenderEmail ||
      ""
    );
  }

  return (
    mailboxes.currentReplyFromEmail ||
    mailboxes.campaignSenderEmail ||
    mailboxes.RHEmail ||
    mailboxes.bmeEmail ||
    mailboxes.imeEmail ||
    ""
  );
}

function getPreferredMailboxName(review: ReviewRow | null, thread: any | null) {
  const mailboxes = getMailboxObject(review, thread);
  const ownerRole = String(thread?.ownerRole || "").trim().toLowerCase();

  if (ownerRole === "bme") {
    return firstUsefulName(
      mailboxes.currentReplyFromName,
      mailboxes.bmeName,
      mailboxes.campaignSenderName
    );
  }

  if (ownerRole === "ime") {
    return firstUsefulName(
      mailboxes.currentReplyFromName,
      mailboxes.imeName,
      mailboxes.campaignSenderName
    );
  }

  if (ownerRole === "revenue_head" || ownerRole === "rh") {
    return firstUsefulName(
      mailboxes.currentReplyFromName,
      mailboxes.RHName,
      mailboxes.campaignSenderName
    );
  }

  return firstUsefulName(
    mailboxes.currentReplyFromName,
    mailboxes.campaignSenderName,
    mailboxes.RHName,
    mailboxes.bmeName,
    mailboxes.imeName
  );
}

function normalizeComparableName(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function getBrandLabel(review: ReviewRow | null, thread: any | null) {
  const prospectName = firstUsefulName(
    review?.prospectId?.companyName,
    review?.prospectId?.primaryContact?.name,
    thread?.prospectId?.companyName,
    thread?.prospectId?.primaryContact?.name
  );

  if (prospectName) return prospectName;

  const mailboxNames = [
    getPreferredMailboxName(review, thread),
    emailToDisplayName(getPreferredMailboxEmail(review, thread)),
  ]
    .map(normalizeComparableName)
    .filter(Boolean);

  const fallbackBrand = [thread?.brandName, thread?.brandDisplayName].find((value) => {
    const cleaned = firstUsefulName(value);
    if (!cleaned) return false;
    return !mailboxNames.includes(normalizeComparableName(cleaned));
  });

  return firstUsefulName(fallbackBrand) || "Lead";
}

function getTeamLabel(review: ReviewRow | null, thread: any | null) {
  const mailboxName = getPreferredMailboxName(review, thread);
  const mailboxEmail = getPreferredMailboxEmail(review, thread);

  return mailboxName || emailToDisplayName(mailboxEmail) || "Mailbox";
}

function getMessageMailboxLabel(
  message: ThreadMessage,
  review: ReviewRow | null,
  thread: any | null,
  mode: "outbound_sender" | "inbound_recipient"
) {
  const storedMessageName =
    mode === "outbound_sender"
      ? firstUsefulName(message.fromName)
      : firstUsefulName(message.toNames?.[0]);

  if (storedMessageName) {
    return storedMessageName;
  }

  const raw =
    mode === "outbound_sender"
      ? message.from
      : Array.isArray(message.to)
        ? message.to.find((item) => isEmailLike(item)) || message.to[0]
        : "";

  if (isEmailLike(raw)) {
    return emailToDisplayName(raw);
  }

  const serializedDisplayName =
    mode === "outbound_sender"
      ? firstUsefulName(message.fromDisplayName)
      : firstUsefulName(message.toDisplayNames?.[0]);

  return serializedDisplayName || getTeamLabel(review, thread);
}

function MetricCard({
  label,
  value,
  icon,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone?: "slate" | "blue" | "emerald" | "violet";
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
        </div>

        <div
          className={cx(
            "flex h-11 w-11 items-center justify-center rounded-2xl",
            tone === "slate" && "bg-slate-100 text-slate-600",
            tone === "blue" && "bg-blue-50 text-blue-600",
            tone === "emerald" && "bg-emerald-50 text-emerald-600",
            tone === "violet" && "bg-violet-50 text-violet-600"
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function EmptyReader() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[28px] bg-slate-100 text-slate-400">
          <Inbox className="h-8 w-8" />
        </div>

        <h3 className="mt-5 text-xl font-bold text-slate-950">Select a reply to review</h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Choose a lead from the review queue. The conversation will open here like a Gmail thread.
        </p>
      </div>
    </div>
  );
}

function decodeEmailEntities(value = "") {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function looksLikeHtml(value = "") {
  return /<\/?[a-z][\s\S]*>/i.test(String(value || ""));
}

function stripHtml(value = "") {
  return decodeEmailEntities(
    String(value || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function removeProviderArtifacts(value = "") {
  return String(value || "")
    .replace(/\[image:\s*line\]/gi, "")
    .replace(/\[cid:[^\]]+\]/gi, "")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitGmailQuotedText(value = "") {
  const text = removeProviderArtifacts(decodeEmailEntities(value))
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  if (!text) {
    return { mainText: "", quotedText: "" };
  }

  const inlineQuoteMatch = text.match(/\sOn\s[\s\S]{10,300}?wrote:\s*/i);

  if (
    inlineQuoteMatch &&
    typeof inlineQuoteMatch.index === "number" &&
    inlineQuoteMatch.index > 0
  ) {
    const mainText = text.slice(0, inlineQuoteMatch.index).trim();
    const quotedText = text
      .slice(inlineQuoteMatch.index)
      .replace(/(^|\n)\s*>+\s?/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return { mainText, quotedText };
  }

  const lines = text.split("\n");

  const quoteStartIndex = lines.findIndex((line) => {
    const trimmed = line.trim();

    return (
      /^On\s.+wrote:\s*$/i.test(trimmed) ||
      /^On\s.+wrote:\s*>/i.test(trimmed) ||
      /^-+\s*Original Message\s*-+$/i.test(trimmed) ||
      /^From:\s.+/i.test(trimmed) ||
      /^Sent:\s.+/i.test(trimmed) ||
      /^To:\s.+/i.test(trimmed) ||
      /^Subject:\s.+/i.test(trimmed) ||
      /^>/.test(trimmed)
    );
  });

  if (quoteStartIndex === -1) {
    return { mainText: text, quotedText: "" };
  }

  const mainText = lines.slice(0, quoteStartIndex).join("\n").trim();

  const quotedText = lines
    .slice(quoteStartIndex)
    .join("\n")
    .replace(/(^|\n)\s*>+\s?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { mainText, quotedText };
}

function autoLinkEscapedHtml(value = "") {
  return String(value || "").replace(
    /(https?:\/\/[^\s<]+)/gi,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
}

function textToGmailHtml(value = "") {
  const clean = String(value || "").trim();
  if (!clean) return "";

  return clean
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => {
      const escaped = escapeEmailHtml(paragraph).replace(/\n/g, "<br/>");
      return `<p>${autoLinkEscapedHtml(escaped)}</p>`;
    })
    .join("");
}

function getMessageRawText(message: ThreadMessage) {
  if (String(message.bodyHtml || "").trim()) {
    return stripHtml(message.bodyHtml || "");
  }

  if (looksLikeHtml(message.bodyText || "")) {
    return stripHtml(message.bodyText || "");
  }

  return String(message.bodyText || "").trim();
}

function getGmailMessageParts(message: ThreadMessage) {
  const rawText = getMessageRawText(message);
  const { mainText, quotedText } = splitGmailQuotedText(rawText);
  const hasQuotedText = Boolean(quotedText.trim());
  const rawHtml =
    String(message.bodyHtml || "").trim() ||
    (looksLikeHtml(message.bodyText || "") ? String(message.bodyText || "").trim() : "");
  const mainHtml =
    !hasQuotedText && rawHtml
      ? sanitizeEmailHtml(rawHtml)
      : textToGmailHtml(mainText);

  return {
    mainHtml,
    quotedHtml: textToGmailHtml(quotedText),
  };
}

function GmailThreadReader({
  review,
  thread,
  messages,
  fallbackMessage,
  loading,
}: {
  review: ReviewRow | null;
  thread: any | null;
  messages: ThreadMessage[];
  fallbackMessage: ThreadMessage | null;
  loading: boolean;
}) {
  const threadMessages = messages.length ? messages : fallbackMessage ? [fallbackMessage] : [];

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white p-10 text-center">
        <div>
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          <p className="mt-4 text-sm font-semibold text-slate-500">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (!threadMessages.length) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white p-10 text-center">
        <p className="text-sm font-semibold text-slate-500">No messages in this thread yet.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white">
      <div className="divide-y divide-slate-100">
        {threadMessages.map((msg) => {
          const isInbound = String(msg.direction || "").toLowerCase() === "inbound";
          const brandLabel = getBrandLabel(review, thread);
          const mailboxLabel = getMessageMailboxLabel(
            msg,
            review,
            thread,
            isInbound ? "inbound_recipient" : "outbound_sender"
          );
          const senderLabel = isInbound ? brandLabel : mailboxLabel;
          const recipientName = isInbound ? mailboxLabel : brandLabel;
          const messageParts = getGmailMessageParts(msg);

          return (
            <article key={msg._id} className="w-full px-6 py-6">
              <div className="flex items-start gap-4">
                <div
                  className={cx(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white",
                    isInbound ? "bg-blue-600" : "bg-slate-700"
                  )}
                >
                  {getInitials(senderLabel)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{senderLabel}</p>
                        <span className="text-xs text-slate-500">{`to ${recipientName}`}</span>
                      </div>
                    </div>

                    <span className="shrink-0 text-xs text-slate-500">
                      {formatDateTime(getMessageDate(msg))}
                    </span>
                  </div>

                  <div
                    className="gmail-message-body mt-5 max-w-none text-[14px] leading-7 text-slate-800 [&_a]:font-medium [&_a]:text-blue-600 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-slate-200 [&_blockquote]:pl-4 [&_blockquote]:text-slate-500 [&_p]:mb-4"
                    dangerouslySetInnerHTML={{ __html: messageParts.mainHtml || "<p>—</p>" }}
                  />

                  {messageParts.quotedHtml ? (
                    <div className="mt-5 border-l-2 border-slate-300 pl-4">
                      <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        Previous message
                      </p>
                      <div
                        className="max-w-none text-[13px] leading-6 text-slate-500 [&_a]:text-blue-600 [&_a]:underline [&_p]:mb-3"
                        dangerouslySetInnerHTML={{ __html: messageParts.quotedHtml }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
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
  const [threadDetail, setThreadDetail] = useState<ThreadDetailResponse>({ thread: null, messages: [] });
  const [threadLoading, setThreadLoading] = useState(false);

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
  const canSeeBrandEmail = actorRole === "super_admin";

  const campaignOptions = useMemo<FilterOption[]>((() => {
    const map = new Map<string, FilterOption>();

    pendingReplies.forEach((item) => {
      const id = String(item.campaignId?._id || "");
      if (!id) return;

      map.set(id, {
        _id: id,
        name: item.campaignId?.name || "Unnamed Campaign",
      });
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }) as any, [pendingReplies]);

  const sdrFilterOptions = useMemo(() => {
    const map = new Map<string, AdminOption>();

    pendingReplies.forEach((item) => {
      const id = String(item.sdrId?._id || "");
      if (!id) return;

      map.set(id, {
        _id: id,
        name: item.sdrId?.name || "",
        email: item.sdrId?.email || "",
        role: "sdr",
      });
    });

    return Array.from(map.values()).sort((a, b) => getAdminLabel(a).localeCompare(getAdminLabel(b)));
  }, [pendingReplies]);

  const rhFilterOptions = useMemo(() => {
    const map = new Map<string, AdminOption>();

    pendingReplies.forEach((item) => {
      const id = String(item.RHId?._id || "");
      if (!id) return;

      map.set(id, {
        _id: id,
        name: item.RHId?.name || "",
        email: item.RHId?.email || "",
        role: "revenue_head",
      });
    });

    return Array.from(map.values()).sort((a, b) => getAdminLabel(a).localeCompare(getAdminLabel(b)));
  }, [pendingReplies]);

  const bmeFilterOptions = useMemo(() => {
    const map = new Map<string, AdminOption>();

    pendingReplies.forEach((item) => {
      const id = String(item.assignedBmeId?._id || "");
      if (!id) return;

      map.set(id, {
        _id: id,
        name: item.assignedBmeId?.name || "",
        email: item.assignedBmeId?.email || "",
        role: "bme",
      });
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
        canSeeBrandEmail ? item.prospectId?.primaryContact?.email : "",
        item.latestReplySubject,
        item.latestReplySnippet,
        item.prospectId?.reply?.subject,
        item.prospectId?.reply?.snippet,
        item.prospectId?.stage,
        item.sdrId?.name,
        item.sdrId?.email,
        item.RHId?.name,
        item.RHId?.email,
        item.assignedBmeId?.name,
        item.assignedBmeId?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!query || haystack.includes(query)) &&
        (!campaignFilter || String(item.campaignId?._id || "") === campaignFilter) &&
        (!sdrFilter || String(item.sdrId?._id || "") === sdrFilter) &&
        (!bmeFilter || String(item.assignedBmeId?._id || "") === bmeFilter) &&
        (!rhFilter || String(item.RHId?._id || "") === rhFilter)
      );
    });
  }, [pendingReplies, search, campaignFilter, sdrFilter, bmeFilter, rhFilter, canSeeBrandEmail]);

  const selectedReview = useMemo(() => {
    return (
      filteredReplies.find((item) => item._id === selectedReviewId) ||
      pendingReplies.find((item) => item._id === selectedReviewId) ||
      null
    );
  }, [filteredReplies, pendingReplies, selectedReviewId]);

  const selectedThreadId = useMemo(() => {
    const prospectId = String(selectedReview?.prospectId?._id || "");
    if (!prospectId) return "";

    const match = threads.find((item) => String(item?.prospectId?._id || "") === prospectId);
    return match?._id || "";
  }, [selectedReview, threads]);

  const repliedCount = useMemo(() => {
    return pendingReplies.filter((item) =>
      String(item?.prospectId?.stage || "").toLowerCase().includes("reply")
    ).length;
  }, [pendingReplies]);

  const assignedCount = useMemo(() => {
    return pendingReplies.filter((item) => Boolean(item.assignedBmeId?._id)).length;
  }, [pendingReplies]);

  const unassignedCount = pendingReplies.length - assignedCount;
  const hasAnyFilter = search.trim() || campaignFilter || sdrFilter || bmeFilter || rhFilter;

  async function loadBmeOptions(review: ReviewRow | null, currentActorRole: string, explicitRhId = "") {
    try {
      const params: Record<string, string> = { role: "bme" };

      const scopedRhId =
        explicitRhId ||
        (currentActorRole !== "super_admin" ? String(review?.RHId?._id || "") : "");

      if (scopedRhId) params.RHId = scopedRhId;

      const payload: any = await adminGet("/admins/get-executive-list", params);
      setBmeOptions(parseAdminRows(payload));
    } catch {
      setBmeOptions([]);
    }
  }

  async function loadThreadDetail(threadId: string) {
    if (!threadId) {
      setThreadDetail({ thread: null, messages: [] });
      return;
    }

    try {
      setThreadLoading(true);
      const payload: any = await adminGet(`/outreach/threads/${threadId}`);
      setThreadDetail(parseThreadDetail(payload));
    } catch {
      setThreadDetail({ thread: null, messages: [] });
    } finally {
      setThreadLoading(false);
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

      const parsedThreads = parseThreads(threadsPayload);
      const repliesWithThreadFallbacks = hydrateRepliesWithThreadFallbacks(
        parsePendingReplies(repliesPayload),
        parsedThreads
      );
      const nextReplies = await hydrateRepliesWithThreadDetailsForMissingCampaigns(
        repliesWithThreadFallbacks,
        parsedThreads
      );
      const nextRole = String(mePayload?.role || "").toLowerCase();

      setPendingReplies(nextReplies);
      setThreads(parsedThreads);
      setActorRole(nextRole);

      const prospectIdFromQuery = String(searchParams.get("prospectId") || "");
      let nextSelectedId = "";

      if (prospectIdFromQuery) {
        const match = nextReplies.find(
          (item) => String(item?.prospectId?._id || "") === prospectIdFromQuery
        );

        if (match?._id) nextSelectedId = match._id;
      }

      if (
        !nextSelectedId &&
        selectedReviewId &&
        nextReplies.some((item) => item._id === selectedReviewId)
      ) {
        nextSelectedId = selectedReviewId;
      }

      if (!nextSelectedId) nextSelectedId = nextReplies[0]?._id || "";

      setSelectedReviewId(nextSelectedId);

      const selected = nextReplies.find((item) => item._id === nextSelectedId) || null;
      await loadBmeOptions(selected, nextRole, nextRole === "super_admin" ? rhFilter : "");
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to load review queue",
      });
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  useEffect(() => {
    void loadPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    void loadBmeOptions(selectedReview, actorRole, actorRole === "super_admin" ? rhFilter : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReviewId, actorRole, rhFilter]);

  useEffect(() => {
    void loadThreadDetail(selectedThreadId);
  }, [selectedThreadId]);

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

      setMessage({
        type: "success",
        text: payload?.message || "Reply assigned to BME successfully",
      });

      setSelectedBmeId("");
      setReviewerNotes("");
      await loadPage(false);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to assign BME",
      });
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

      setMessage({
        type: "success",
        text: payload?.message || "Reply marked unqualified",
      });

      setReviewerNotes("");
      await loadPage(false);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to reject reply",
      });
    } finally {
      setSubmittingKey("");
    }
  }

  function clearFilters() {
    setSearch("");
    setCampaignFilter("");
    setSdrFilter("");
    setBmeFilter("");
    setRhFilter("");
  }

  function openFullThread() {
    if (!selectedReview) return;

    const prospectId = selectedReview.prospectId?._id || "";

    router.push(
      selectedThreadId
        ? `/admin/crm/replies?threadId=${selectedThreadId}`
        : `/admin/crm/replies?prospectId=${prospectId}`
    );
  }

  if (actorRole && actorRole !== "revenue_head" && actorRole !== "super_admin") {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-700">
          Review Queue is only available for Revenue Head and Super Admin.
        </div>
      </div>
    );
  }

  const canAssign = Boolean(selectedReview && selectedBmeId && submittingKey === "");
  const canReject = Boolean(selectedReview && submittingKey === "");

  const brandLabel = getBrandLabel(selectedReview, threadDetail.thread);
  const teamLabel = getTeamLabel(selectedReview, threadDetail.thread);
  const selectedCompany = brandLabel || "Unknown Company";
  const selectedContact = selectedReview?.prospectId?.primaryContact?.name || selectedCompany || "Unknown Contact";
  const selectedSubject =
    selectedReview?.latestReplySubject ||
    selectedReview?.prospectId?.reply?.subject ||
    threadDetail.thread?.subject ||
    "(No subject)";
  const selectedSnippet =
    selectedReview?.latestReplySnippet ||
    selectedReview?.prospectId?.reply?.snippet ||
    "No reply content available.";

  const fallbackLatestMessage: ThreadMessage | null = selectedReview
    ? {
      _id: `fallback-${selectedReview._id}`,
      direction: "inbound",
      from: brandLabel,
      to: [getPreferredMailboxEmail(selectedReview, threadDetail.thread) || teamLabel],
      fromDisplayName: brandLabel,
      toDisplayNames: [teamLabel],
      subject: selectedSubject,
      bodyText: selectedSnippet,
      bodyHtml: "",
      receivedAt: selectedReview.createdAt || null,
      createdAt: selectedReview.createdAt || null,
    }
    : null;

  const selectedThreadMeta = threadDetail.thread || null;
  const statusValue = String(selectedThreadMeta?.status || "").trim();

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col gap-4 bg-[#f8fafc] p-3 sm:p-4 xl:h-[calc(100vh-2rem)]">
      {message && (
        <div
          className={cx(
            "rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm",
            message.type === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
            message.type === "error" && "border-rose-200 bg-rose-50 text-rose-700",
            message.type === "info" && "border-blue-200 bg-blue-50 text-blue-700"
          )}
        >
          <div className="flex items-start gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : message.type === "error" ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)] xl:flex-row">
        <aside
          className={cx(
            "flex w-full shrink-0 flex-col border-b border-slate-200 bg-slate-50/70 xl:w-[360px] xl:border-b-0 xl:border-r 2xl:w-[400px]",
            selectedReview ? "hidden xl:flex" : "flex"
          )}
        >
          <div className="border-b border-slate-200 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Review Queue</h2>
                <p className="mt-1 text-sm text-slate-500">Pending reply inbox</p>
              </div>

              <button
                type="button"
                onClick={() => loadPage(false)}
                disabled={loading}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                title="Refresh"
              >
                <RefreshCw className={cx("h-4 w-4", loading && "animate-spin")} />
              </button>
            </div>

            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search brands, campaigns, people..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <select value={campaignFilter} onChange={(event) => setCampaignFilter(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400">
                <option value="">All Campaigns</option>
                {campaignOptions.map((item) => (<option key={item._id} value={item._id}>{item.name}</option>))}
              </select>

              {canFilterBySdr && (
                <select value={sdrFilter} onChange={(event) => setSdrFilter(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400">
                  <option value="">All SDRs</option>
                  {sdrFilterOptions.map((item) => (<option key={item._id} value={item._id}>{getAdminLabel(item)}</option>))}
                </select>
              )}

              {canFilterByBme && (
                <select value={bmeFilter} onChange={(event) => setBmeFilter(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400">
                  <option value="">All BMEs</option>
                  {bmeFilterOptions.map((item) => (<option key={item._id} value={item._id}>{getAdminLabel(item)}</option>))}
                </select>
              )}

              {canFilterByRh && (
                <select value={rhFilter} onChange={(event) => setRhFilter(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400">
                  <option value="">All RHs</option>
                  {rhFilterOptions.map((item) => (<option key={item._id} value={item._id}>{getAdminLabel(item)}</option>))}
                </select>
              )}
            </div>

            {hasAnyFilter ? (<button type="button" onClick={clearFilters} className="mt-3 inline-flex text-xs font-bold text-blue-600 transition hover:text-blue-700">Clear all filters</button>) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">Loading review queue...</div>
            ) : filteredReplies.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No pending replies found.</div>
            ) : (
              <ul className="space-y-2">
                {filteredReplies.map((item) => {
                  const active = item._id === selectedReviewId;
                  const brandName = firstUsefulName(item.prospectId?.companyName, item.prospectId?.primaryContact?.name) || "Lead";
                  const brandEmail = canSeeBrandEmail ? item.prospectId?.primaryContact?.email || "" : "";
                  const campaignName = item.campaignId?.name || "No campaign";
                  const subject = item.latestReplySubject || item.prospectId?.reply?.subject || "(No subject)";
                  const snippet = item.latestReplySnippet || item.prospectId?.reply?.snippet || "No reply content";

                  return (
                    <li key={item._id}>
                      <button type="button" onClick={() => setSelectedReviewId(item._id)} className={cx("w-full rounded-2xl border p-4 text-left transition", active ? "border-slate-900 bg-white shadow-sm" : "border-transparent bg-transparent hover:border-slate-200 hover:bg-white")}>
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-800">{getInitials(brandName)}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">{brandName}</p>
                                {brandEmail ? <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">{brandEmail}</p> : null}
                              </div>
                              <span className="shrink-0 text-xs text-slate-500">{formatInboxDate(item.createdAt)}</span>
                            </div>
                            <p className="mt-1 truncate text-sm font-semibold text-slate-800">{subject}</p>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{snippet}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                              <span className="truncate font-medium text-slate-700">{campaignName}</span>
                              <span>•</span>
                              <span>{normalizeStageLabel(item.prospectId?.stage)}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        <main className={cx("min-h-0 min-w-0 flex-1 flex-col bg-white", selectedReview ? "flex" : "hidden xl:flex")}>
          {!selectedReview ? (
            <EmptyReader />
          ) : (
            <>
              <div className="border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <button type="button" onClick={() => setSelectedReviewId("")} className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 xl:hidden"><ArrowLeft className="h-4 w-4" /></button>
                      <div className="min-w-0">
                        <h3 className="truncate text-xl font-semibold text-slate-900 sm:text-2xl">{selectedSubject || selectedCompany}</h3>
                        <p className="mt-1 truncate text-sm text-slate-500">
                          {selectedCompany}
                          {canSeeBrandEmail && selectedReview?.prospectId?.primaryContact?.email ? ` · ${selectedReview.prospectId.primaryContact.email}` : ""}
                          {selectedReview.campaignId?.name || selectedThreadMeta?.campaignId?.name ? ` · ${selectedReview.campaignId?.name || selectedThreadMeta?.campaignId?.name}` : ""}
                          {` · ${teamLabel}`}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className={cx("inline-flex rounded-full border px-3 py-1 text-xs font-semibold", getStagePillClasses(selectedReview.prospectId?.stage))}>{normalizeStageLabel(selectedReview.prospectId?.stage)}</span>
                          {statusValue ? (<span className={cx("inline-flex rounded-full border px-3 py-1 text-xs font-semibold", getThreadStatusPillClasses(statusValue))}>{statusValue.replace(/_/g, " ")}</span>) : null}
                        </div>
                      </div>
                    </div>
                    <div className="hidden items-center gap-3 sm:flex">
                      <button type="button" onClick={openFullThread} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><ExternalLink className="h-4 w-4" />Open Thread</button>
                    </div>
                  </div>
                  <div className="flex gap-3 sm:hidden">
                    <button type="button" onClick={openFullThread} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><ExternalLink className="h-4 w-4" />Open Thread</button>
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-white">
                <GmailThreadReader review={selectedReview} thread={threadDetail.thread} messages={threadDetail.messages} fallbackMessage={fallbackLatestMessage} loading={threadLoading} />
                <div className="border-t border-slate-200 bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
                  <div className="mx-auto max-w-5xl rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Decision & Assignment</p><h3 className="mt-2 text-lg font-bold text-slate-950">Qualify this reply</h3></div>
                      <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 sm:flex"><UserCheck className="h-6 w-6" /></div>
                    </div>
                    <div className="mt-5 grid gap-4 lg:grid-cols-[320px_1fr]">
                      <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Assign to BME</span><div className="relative"><select value={selectedBmeId} onChange={(event) => setSelectedBmeId(event.target.value)} disabled={bmeOptions.length === 0} className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"><option value="">{bmeOptions.length === 0 ? "No BME available" : "Select BME..."}</option>{bmeOptions.map((admin) => (<option key={admin._id} value={admin._id}>{getAdminLabel(admin)}</option>))}</select><ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /></div></label>
                      <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Reviewer Notes</span><textarea value={reviewerNotes} onChange={(event) => setReviewerNotes(event.target.value)} rows={4} placeholder="Add context for BME..." className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /></label>
                    </div>
                    <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-end">
                      <button type="button" onClick={handleReject} disabled={!canReject} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-5 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"><XCircle className="h-4 w-4" />{submittingKey === "reject" ? "Marking..." : "Mark Unqualified"}</button>
                      <button type="button" onClick={handleAssignToBme} disabled={!canAssign} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" />{submittingKey === "assign" ? "Assigning..." : "Assign to BME"}</button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}