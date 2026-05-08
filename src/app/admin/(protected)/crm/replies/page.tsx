"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

type ThreadRow = {
  _id: string;
  ownerRole?: string;
  ownerId?: string;
  subject?: string;
  status?: string;
  brandEmail?: string;
  brandName?: string;
  brandDisplayName?: string;
  teamDisplayName?: string;
  instantlyThreadId?: string;
  mailboxes?: ThreadMailboxes | null;
  campaignId?: { _id?: string; name?: string } | null;
  sdrId?: { _id?: string; name?: string; email?: string } | null;
  RHId?: { _id?: string; name?: string; email?: string } | null;
  IMEId?: { _id?: string; name?: string; email?: string } | null;
  assignedBmeId?: { _id?: string; name?: string; email?: string } | null;
  assignedImeId?: { _id?: string; name?: string; email?: string } | null;
  prospectId?: {
    _id?: string;
    companyName?: string;
    primaryContact?: { name?: string; email?: string };
    stage?: string;
  } | null;
  updatedAt?: string | null;
  lastMessageAt?: string | null;
  lastInboundAt?: string | null;
  lastOutboundAt?: string | null;
  unreadForRevenueHead?: boolean;
  unreadForBme?: boolean;
  unreadForIme?: boolean;
  isUnread?: boolean;
  hasUnreadReply?: boolean;
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
  thread: ThreadRow | null;
  messages: ThreadMessage[];
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function escapeHtml(value = "") {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
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

function bodyToEditorHtml(value = "") {
  if (!value) return "";
  if (looksLikeHtml(value)) return value;
  return escapeHtml(value).replace(/\n/g, "<br>");
}

function normalizeInsertLinkUrl(value = "") {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isEditorHtmlEmpty(value = "") {
  const plain = decodeEmailEntities(
    String(value || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  ).trim();

  return !plain;
}

function htmlToPlainText(value = "") {
  return decodeEmailEntities(
    String(value || "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(div|p|li|tr|h1|h2|h3|h4|h5|h6)>/gi, "\n")
      .replace(/<[^>]*>/g, "")
  )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeComposerHtmlForSend(value = "") {
  const html = String(value || "").trim();

  if (!html) return "";

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body;

  root.querySelectorAll("script, style, iframe, object, embed").forEach((node) => {
    node.remove();
  });

  root.querySelectorAll("*").forEach((node) => {
    Array.from(node.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const attrValue = attr.value || "";

      if (name.startsWith("on")) {
        node.removeAttribute(attr.name);
      }

      if (name === "href") {
        const safeHref =
          /^https?:\/\//i.test(attrValue) ||
          /^mailto:/i.test(attrValue) ||
          /^tel:/i.test(attrValue);

        if (!safeHref) {
          node.removeAttribute(attr.name);
        }
      }
    });
  });

  root.querySelectorAll("a").forEach((link) => {
    const href = link.getAttribute("href") || "";

    if (!href) {
      link.replaceWith(doc.createTextNode(link.textContent || ""));
      return;
    }

    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
  });

  return root.innerHTML
    .replace(/<div><br><\/div>/gi, "<br>")
    .replace(/<div>/gi, "")
    .replace(/<\/div>/gi, "<br>")
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>")
    .trim();
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

function sanitizeEmailHtml(value = "") {
  return String(value || "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>[\s\S]*?<\/embed>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\s+href\s*=\s*(['"])\s*javascript:[\s\S]*?\1/gi, "")
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
      const escaped = escapeHtml(paragraph).replace(/\n/g, "<br/>");
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
    mainText,
    quotedText,
    mainHtml,
    quotedHtml: textToGmailHtml(quotedText),
    previewText: (mainText || quotedText || "No message content")
      .replace(/\s+/g, " ")
      .trim(),
  };
}

function getInitials(name?: string) {
  const value = String(name || "").trim();
  if (!value) return "?";

  const parts = value.split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

function getSenderNameFromEmail(value = "", fallback = "Unknown") {
  const input = String(value || "").trim();
  if (!input) return fallback;

  const namePart = input.includes("<")
    ? input.split("<")[0].trim()
    : input.split("@")[0];

  return (
    namePart
      .replace(/[._-]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .trim() || fallback
  );
}

function formatDateTime(value?: string | null) {
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

function formatShortDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
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

  if (value.includes("replied")) return "border-blue-200 bg-blue-50 text-blue-700";
  if (value.includes("assigned_to_bme")) return "border-violet-200 bg-violet-50 text-violet-700";
  if (value.includes("assigned_to_ime")) return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700";
  if (value.includes("unqualified")) return "border-rose-200 bg-rose-50 text-rose-700";
  if (value.includes("qualified")) return "border-emerald-200 bg-emerald-50 text-emerald-700";

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function getStatusPillClasses(status?: string) {
  const value = String(status || "").toLowerCase();

  if (value === "waiting_on_us") return "border-amber-200 bg-amber-50 text-amber-700";
  if (value === "waiting_on_brand") return "border-blue-200 bg-blue-50 text-blue-700";
  if (value === "closed") return "border-slate-200 bg-slate-100 text-slate-600";

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
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

function normalizeComparableName(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
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

function getPreferredMailboxEmail(thread?: ThreadRow | null) {
  const mailboxes = thread?.mailboxes || {};
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

function getPreferredMailboxName(thread?: ThreadRow | null) {
  const mailboxes = thread?.mailboxes || {};
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

function getBrandDisplayName(thread?: ThreadRow | null) {
  const prospectName = firstUsefulName(
    thread?.prospectId?.companyName,
    thread?.prospectId?.primaryContact?.name
  );

  if (prospectName) return prospectName;

  const mailboxNames = [
    getPreferredMailboxName(thread),
    emailToDisplayName(getPreferredMailboxEmail(thread)),
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

function getThreadTeamLabel(thread?: ThreadRow | null) {
  const mailboxName = getPreferredMailboxName(thread);
  const mailboxEmail = getPreferredMailboxEmail(thread);

  return mailboxName || emailToDisplayName(mailboxEmail) || "Mailbox";
}

function getMessageMailboxLabel(
  message: ThreadMessage,
  thread: ThreadRow | null,
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

  return serializedDisplayName || getThreadTeamLabel(thread);
}

function getThreadPreviewText(thread?: ThreadRow | null) {
  return thread?.subject || "No subject";
}

function getMessageDate(message: ThreadMessage) {
  return message.receivedAt || message.sentAt || message.createdAt || message.updatedAt || "";
}

function getThreadTimeValue(thread?: ThreadRow | null) {
  const values = [
    thread?.lastMessageAt,
    thread?.lastInboundAt,
    thread?.updatedAt,
  ];

  for (const value of values) {
    const time = new Date(value || "").getTime();
    if (Number.isFinite(time)) return time;
  }

  return 0;
}

function isThreadUnreadForActor(thread?: ThreadRow | null, actorRole = "") {
  if (!thread) return false;

  if (typeof thread.isUnread === "boolean") return thread.isUnread;

  const role = String(actorRole || "").trim().toLowerCase();

  if (role === "super_admin") {
    return Boolean(
      thread.unreadForRevenueHead ||
      thread.unreadForBme ||
      thread.unreadForIme
    );
  }

  if (role === "bme") return Boolean(thread.unreadForBme);
  if (role === "ime") return Boolean(thread.unreadForIme);
  if (role === "revenue_head" || role === "rh") {
    return Boolean(thread.unreadForRevenueHead);
  }

  return Boolean(
    thread.unreadForRevenueHead ||
    thread.unreadForBme ||
    thread.unreadForIme
  );
}

function sortThreadsForInbox(threads: ThreadRow[] = [], actorRole = "") {
  return [...threads].sort((a, b) => {
    const unreadDiff =
      Number(isThreadUnreadForActor(b, actorRole)) -
      Number(isThreadUnreadForActor(a, actorRole));

    if (unreadDiff) return unreadDiff;

    return getThreadTimeValue(b) - getThreadTimeValue(a);
  });
}

async function hydrateThreadsWithMissingCampaignDetails(threads: ThreadRow[]) {
  const hydrated = await Promise.all(
    threads.map(async (thread) => {
      const hasCampaign = Boolean(thread.campaignId?._id && thread.campaignId?.name);
      const hasDisplayNames = Boolean(thread.brandDisplayName && thread.teamDisplayName);

      if (hasCampaign && hasDisplayNames) {
        return thread;
      }

      try {
        const payload: any = await adminGet(`/outreach/threads/${thread._id}`);
        const detailThread = payload?.thread || payload?.data?.thread || null;

        return {
          ...thread,
          ...detailThread,
          campaignId: detailThread?.campaignId || thread.campaignId || null,
          sdrId: detailThread?.sdrId || thread.sdrId || null,
          RHId: detailThread?.RHId || thread.RHId || null,
          IMEId: detailThread?.IMEId || thread.IMEId || null,
          assignedBmeId: detailThread?.assignedBmeId || thread.assignedBmeId || null,
          assignedImeId: detailThread?.assignedImeId || thread.assignedImeId || null,
          brandDisplayName: detailThread?.brandDisplayName || thread.brandDisplayName || "",
          teamDisplayName: detailThread?.teamDisplayName || thread.teamDisplayName || "",
          unreadForRevenueHead:
            typeof detailThread?.unreadForRevenueHead === "boolean"
              ? detailThread.unreadForRevenueHead
              : thread.unreadForRevenueHead,
          unreadForBme:
            typeof detailThread?.unreadForBme === "boolean"
              ? detailThread.unreadForBme
              : thread.unreadForBme,
          unreadForIme:
            typeof detailThread?.unreadForIme === "boolean"
              ? detailThread.unreadForIme
              : thread.unreadForIme,
          isUnread:
            typeof detailThread?.isUnread === "boolean"
              ? detailThread.isUnread
              : thread.isUnread,
          hasUnreadReply:
            typeof detailThread?.hasUnreadReply === "boolean"
              ? detailThread.hasUnreadReply
              : thread.hasUnreadReply,
        };
      } catch {
        return thread;
      }
    })
  );

  return hydrated;
}

function GmailThreadReader({
  thread,
  messages,
  loading,
}: {
  thread: ThreadRow;
  messages: ThreadMessage[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white p-10 text-center">
        <div>
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          <p className="mt-4 text-sm font-semibold text-slate-500">
            Loading conversation...
          </p>
        </div>
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white p-10 text-center">
        <p className="text-sm font-semibold text-slate-500">
          No messages in this thread yet.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white">
      <div className="divide-y divide-slate-100">
        {messages.map((msg) => {
          const isInbound = String(msg.direction || "").toLowerCase() === "inbound";

          const brandLabel = getBrandDisplayName(thread);
          const mailboxLabel = getMessageMailboxLabel(
            msg,
            thread,
            isInbound ? "inbound_recipient" : "outbound_sender"
          );

          const senderLabel = isInbound ? brandLabel : mailboxLabel;
          const recipientName = isInbound ? mailboxLabel : brandLabel;

          const recipientLine = `to ${recipientName}`;

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
                        <p className="text-sm font-semibold text-slate-900">
                          {senderLabel}
                        </p>

                        <span className="text-xs text-slate-500">
                          {recipientLine}
                        </span>
                      </div>
                    </div>

                    <span className="shrink-0 text-xs text-slate-500">
                      {formatDateTime(getMessageDate(msg))}
                    </span>
                  </div>

                  <div
                    className="gmail-message-body mt-5 max-w-none text-[14px] leading-7 text-slate-800 [&_a]:font-medium [&_a]:text-blue-600 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-slate-200 [&_blockquote]:pl-4 [&_blockquote]:text-slate-500 [&_p]:mb-4"
                    dangerouslySetInnerHTML={{
                      __html: messageParts.mainHtml || "<p>—</p>",
                    }}
                  />

                  {messageParts.quotedHtml ? (
                    <div className="mt-5 border-l-2 border-slate-300 pl-4">
                      <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        Previous message
                      </p>

                      <div
                        className="max-w-none text-[13px] leading-6 text-slate-500 [&_a]:text-blue-600 [&_a]:underline [&_p]:mb-3"
                        dangerouslySetInnerHTML={{
                          __html: messageParts.quotedHtml,
                        }}
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

export default function RepliesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<ApiState>(null);
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadDetail, setThreadDetail] = useState<ThreadDetailResponse>({
    thread: null,
    messages: [],
  });

  const [actorRole, setActorRole] = useState("");
  const [search, setSearch] = useState("");
  const [composerSubject, setComposerSubject] = useState("");
  const [composerBody, setComposerBody] = useState("");
  const [submittingKey, setSubmittingKey] = useState("");

  const [campaignFilter, setCampaignFilter] = useState("");
  const [sdrFilter, setSdrFilter] = useState("");
  const [bmeFilter, setBmeFilter] = useState("");
  const [rhFilter, setRhFilter] = useState("");

  const [showMobileThread, setShowMobileThread] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);

  const composerEditorRef = useRef<HTMLDivElement | null>(null);
  const composerSelectionRef = useRef<Range | null>(null);
  const selectedLinkElementRef = useRef<HTMLAnchorElement | null>(null);

  const [isLinkToolsOpen, setIsLinkToolsOpen] = useState(false);
  const [linkToolsPosition, setLinkToolsPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const [isLinkEditorOpen, setIsLinkEditorOpen] = useState(false);
  const [linkEditorMode, setLinkEditorMode] = useState<"insert" | "edit">("insert");
  const [linkEditorUrl, setLinkEditorUrl] = useState("");
  const [linkEditorText, setLinkEditorText] = useState("");

  const canFilterByRh = actorRole === "super_admin";
  const canFilterBySdr = actorRole === "super_admin" || actorRole === "revenue_head";
  const canFilterByBme = actorRole === "super_admin" || actorRole === "revenue_head";
  const canOpenCrmProfile = actorRole !== "bme";
  const canSeeBrandEmail = actorRole === "super_admin";

  const campaignOptions = useMemo(() => {
    const map = new Map<string, { _id: string; name: string }>();

    threads.forEach((item) => {
      const id = String(item.campaignId?._id || "");
      if (!id) return;

      map.set(id, {
        _id: id,
        name: item.campaignId?.name || "Unnamed Campaign",
      });
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [threads]);

  const sdrFilterOptions = useMemo(() => {
    const map = new Map<string, AdminOption>();

    threads.forEach((item) => {
      const id = String(item.sdrId?._id || "");
      if (!id) return;

      map.set(id, {
        _id: id,
        name: item.sdrId?.name || "",
        email: item.sdrId?.email || "",
        role: "sdr",
      });
    });

    return Array.from(map.values()).sort((a, b) =>
      getAdminLabel(a).localeCompare(getAdminLabel(b))
    );
  }, [threads]);

  const rhFilterOptions = useMemo(() => {
    const map = new Map<string, AdminOption>();

    threads.forEach((item) => {
      const id = String(item.RHId?._id || "");
      if (!id) return;

      map.set(id, {
        _id: id,
        name: item.RHId?.name || "",
        email: item.RHId?.email || "",
        role: "revenue_head",
      });
    });

    return Array.from(map.values()).sort((a, b) =>
      getAdminLabel(a).localeCompare(getAdminLabel(b))
    );
  }, [threads]);

  const bmeFilterOptions = useMemo(() => {
    const map = new Map<string, AdminOption>();

    threads.forEach((item) => {
      const id = String(item.assignedBmeId?._id || "");
      if (!id) return;

      map.set(id, {
        _id: id,
        name: item.assignedBmeId?.name || "",
        email: item.assignedBmeId?.email || "",
        role: "bme",
      });
    });

    return Array.from(map.values()).sort((a, b) =>
      getAdminLabel(a).localeCompare(getAdminLabel(b))
    );
  }, [threads]);

  const filteredThreads = useMemo(
    () => sortThreadsForInbox(threads, actorRole),
    [threads, actorRole]
  );

  const selectedThread = useMemo(() => {
    return (
      filteredThreads.find((item) => item._id === selectedThreadId) ||
      threads.find((item) => item._id === selectedThreadId) ||
      null
    );
  }, [filteredThreads, threads, selectedThreadId]);

  const selectedThreadMeta = threadDetail.thread || selectedThread;

  function saveComposerSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    composerSelectionRef.current = selection.getRangeAt(0).cloneRange();
  }

  function restoreComposerSelection() {
    const selection = window.getSelection();
    if (!selection || !composerSelectionRef.current) return;

    selection.removeAllRanges();
    selection.addRange(composerSelectionRef.current);
  }

  function syncComposerBodyFromEditor() {
    const html = composerEditorRef.current?.innerHTML || "";
    setComposerBody(html);
  }

  function closeLinkTools() {
    setIsLinkToolsOpen(false);
    setLinkToolsPosition(null);
    selectedLinkElementRef.current = null;
  }

  function resetLinkEditor() {
    setIsLinkEditorOpen(false);
    setLinkEditorMode("insert");
    setLinkEditorUrl("");
    setLinkEditorText("");
  }

  function updateLinkToolsFromSelection() {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      closeLinkTools();
      return;
    }

    const node =
      selection.anchorNode instanceof Element
        ? selection.anchorNode
        : selection.anchorNode?.parentElement || null;

    const linkElement = node?.closest?.("a") as HTMLAnchorElement | null;

    if (!linkElement || !composerEditorRef.current?.contains(linkElement)) {
      closeLinkTools();
      return;
    }

    const rect = linkElement.getBoundingClientRect();

    selectedLinkElementRef.current = linkElement;
    setLinkEditorText(linkElement.textContent || "");
    setLinkEditorUrl(linkElement.getAttribute("href") || "");
    setLinkToolsPosition({
      top: rect.top - 58,
      left: rect.left + rect.width / 2,
    });
    setIsLinkToolsOpen(true);
  }

  function openReplyModal() {
    if (!selectedThreadMeta) return;

    setComposerSubject(selectedThreadMeta.subject || "");
    setComposerBody("");

    if (composerEditorRef.current) {
      composerEditorRef.current.innerHTML = "";
    }

    setIsReplyModalOpen(true);
    closeLinkTools();
    resetLinkEditor();
  }

  function closeReplyModal() {
    setIsReplyModalOpen(false);
    closeLinkTools();
    resetLinkEditor();
  }

  function handleComposerInsertLink() {
    const selection = window.getSelection();
    const selectedText = selection?.toString() || "";

    setLinkEditorMode("insert");
    setLinkEditorText(selectedText.trim());
    setLinkEditorUrl("");
    setIsLinkEditorOpen(true);
    setIsLinkToolsOpen(false);
  }

  function handleOpenEditLinkEditor() {
    const currentLink = selectedLinkElementRef.current;
    if (!currentLink) return;

    setLinkEditorMode("edit");
    setLinkEditorText(currentLink.textContent || "");
    setLinkEditorUrl(currentLink.getAttribute("href") || "");
    setIsLinkEditorOpen(true);
    setIsLinkToolsOpen(false);
  }

  function handleOpenLinkInNewTab() {
    const currentLink = selectedLinkElementRef.current;
    const url = currentLink?.getAttribute("href");
    if (!url) return;

    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleRemoveSelectedLink() {
    const currentLink = selectedLinkElementRef.current;
    if (!currentLink) return;

    const textNode = document.createTextNode(currentLink.textContent || "");
    currentLink.replaceWith(textNode);

    syncComposerBodyFromEditor();
    closeLinkTools();

    setMessage({
      type: "success",
      text: "Link removed",
    });
  }

  function handleSubmitLinkEditor() {
    const normalizedUrl = normalizeInsertLinkUrl(linkEditorUrl);

    if (!normalizedUrl) {
      setMessage({
        type: "error",
        text: "Web address is required",
      });
      return;
    }

    const finalText = linkEditorText.trim() || normalizedUrl;

    if (linkEditorMode === "edit" && selectedLinkElementRef.current) {
      selectedLinkElementRef.current.setAttribute("href", normalizedUrl);
      selectedLinkElementRef.current.setAttribute("target", "_blank");
      selectedLinkElementRef.current.setAttribute("rel", "noopener noreferrer");
      selectedLinkElementRef.current.textContent = finalText;

      syncComposerBodyFromEditor();
      resetLinkEditor();

      setMessage({
        type: "success",
        text: "Link updated",
      });

      return;
    }

    restoreComposerSelection();

    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      const currentHtml = composerEditorRef.current?.innerHTML || "";
      const appended = `${currentHtml}${currentHtml ? "<br>" : ""
        }<a href="${normalizedUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(
          finalText
        )}</a>`;

      if (composerEditorRef.current) {
        composerEditorRef.current.innerHTML = appended;
      }

      syncComposerBodyFromEditor();
      resetLinkEditor();

      setMessage({
        type: "success",
        text: "Link inserted",
      });

      return;
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const anchor = document.createElement("a");
    anchor.href = normalizedUrl;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.textContent = finalText;

    range.insertNode(anchor);

    const nextRange = document.createRange();
    nextRange.setStartAfter(anchor);
    nextRange.collapse(true);

    selection.removeAllRanges();
    selection.addRange(nextRange);
    composerSelectionRef.current = nextRange.cloneRange();

    syncComposerBodyFromEditor();
    resetLinkEditor();

    setMessage({
      type: "success",
      text: "Link inserted",
    });
  }

  async function loadPage(showLoader = true) {
    try {
      if (showLoader) setLoading(true);
      if (showLoader) setMessage(null);

      const query: Record<string, string> = {};

      if (campaignFilter) query.campaignId = campaignFilter;
      if (sdrFilter) query.sdrId = sdrFilter;
      if (bmeFilter) query.assignedBmeId = bmeFilter;
      if (rhFilter) query.RHId = rhFilter;
      if (search.trim()) query.search = search.trim();

      const [threadsPayload, mePayload] = await Promise.all([
        adminGet("/outreach/threads", query),
        adminGet("/admins/me"),
      ]);

      const nextRole = String(mePayload?.role || "").toLowerCase();

      const rawThreads = Array.isArray(threadsPayload?.data)
        ? threadsPayload.data
        : [];

      const hydratedThreads = await hydrateThreadsWithMissingCampaignDetails(rawThreads);
      const nextThreads = sortThreadsForInbox(hydratedThreads, nextRole);

      setThreads(nextThreads);
      setActorRole(nextRole);

      const threadIdFromQuery = String(searchParams.get("threadId") || "");
      const prospectIdFromQuery = String(searchParams.get("prospectId") || "");

      setSelectedThreadId((prev) => {
        if (
          threadIdFromQuery &&
          nextThreads.some((thread: any) => thread._id === threadIdFromQuery)
        ) {
          return threadIdFromQuery;
        }

        if (prospectIdFromQuery) {
          const match = nextThreads.find(
            (item: any) =>
              String(item?.prospectId?._id || "") === prospectIdFromQuery
          );

          if (match?._id) return match._id;
        }

        if (prev && nextThreads.some((item: any) => item._id === prev)) {
          return prev;
        }

        return "";
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to load replies",
      });
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  async function loadSelectedThread() {
    try {
      if (!selectedThreadId) {
        setThreadDetail({ thread: null, messages: [] });
        setComposerSubject("");
        setComposerBody("");

        if (composerEditorRef.current) {
          composerEditorRef.current.innerHTML = "";
        }

        return;
      }

      setThreadLoading(true);

      const payload: any = await adminGet(`/outreach/threads/${selectedThreadId}`);

      const nextThread = payload?.thread || null;
      const nextMessages = Array.isArray(payload?.messages) ? payload.messages : [];

      setThreadDetail({
        thread: nextThread,
        messages: nextMessages,
      });

      setComposerSubject(nextThread?.subject || "");
      setComposerBody("");

      if (composerEditorRef.current) {
        composerEditorRef.current.innerHTML = "";
      }

      if (isThreadUnreadForActor(nextThread, actorRole)) {
        const readPayload: any = await adminPost(
          `/outreach/threads/${selectedThreadId}/read`,
          {}
        );

        const readThread =
          readPayload?.thread ||
          readPayload?.data?.thread ||
          {
            ...nextThread,
            unreadForRevenueHead: false,
            unreadForBme: false,
            unreadForIme: false,
            isUnread: false,
            hasUnreadReply: false,
          };

        setThreadDetail({
          thread: readThread,
          messages: nextMessages,
        });

        setThreads((prev) =>
          sortThreadsForInbox(
            prev.map((item) =>
              item._id === selectedThreadId
                ? {
                  ...item,
                  ...readThread,
                  unreadForRevenueHead: false,
                  unreadForBme: false,
                  unreadForIme: false,
                  isUnread: false,
                  hasUnreadReply: false,
                }
                : item
            ),
            actorRole
          )
        );
      }
    } catch (error) {
      setThreadDetail({ thread: null, messages: [] });
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to load conversation",
      });
    } finally {
      setThreadLoading(false);
    }
  }

  useEffect(() => {
    void loadPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignFilter, sdrFilter, bmeFilter, rhFilter, search]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadPage(false);
    }, 30000);

    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignFilter, sdrFilter, bmeFilter, rhFilter, search]);

  useEffect(() => {
    void loadSelectedThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThreadId]);

  useEffect(() => {
    if (!composerEditorRef.current) return;

    const nextHtml = bodyToEditorHtml(composerBody || "");

    if (composerEditorRef.current.innerHTML !== nextHtml) {
      composerEditorRef.current.innerHTML = nextHtml;
    }
  }, [composerBody]);

  useEffect(() => {
    if (!selectedThreadId) {
      setShowMobileThread(false);
      setIsReplyModalOpen(false);
    }
  }, [selectedThreadId]);

  async function handleReply() {
    try {
      if (!selectedThreadId) throw new Error("Select a conversation first");

      const editorHtml = composerEditorRef.current?.innerHTML || composerBody || "";
      const bodyHtml = normalizeComposerHtmlForSend(editorHtml);
      const bodyText = htmlToPlainText(bodyHtml);

      if (!bodyText) {
        throw new Error("Reply body is required");
      }

      setSubmittingKey("reply");
      setMessage(null);

      const payload: any = await adminPost(
        `/outreach/threads/${selectedThreadId}/reply`,
        {
          subject: composerSubject.trim(),
          bodyText,
          bodyHtml,
        }
      );

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to send reply");
      }

      setComposerBody("");

      if (composerEditorRef.current) {
        composerEditorRef.current.innerHTML = "";
      }

      setMessage({
        type: "success",
        text: payload?.message || "Reply sent successfully",
      });

      setIsReplyModalOpen(false);
      closeLinkTools();
      resetLinkEditor();

      await loadSelectedThread();
      await loadPage(false);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to send reply",
      });
    } finally {
      setSubmittingKey("");
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col gap-4 bg-[#f8fafc] p-3 sm:p-4 xl:h-[calc(100vh-2rem)]">
      {message && (
        <div
          className={cx(
            "rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm",
            message.type === "success" &&
            "border-emerald-200 bg-emerald-50 text-emerald-700",
            message.type === "error" &&
            "border-rose-200 bg-rose-50 text-rose-700",
            message.type === "info" &&
            "border-blue-200 bg-blue-50 text-blue-700"
          )}
        >
          {message.text}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)] xl:flex-row">
        <aside
          className={cx(
            "flex w-full shrink-0 flex-col border-b border-slate-200 bg-slate-50/70 xl:w-[360px] xl:border-b-0 xl:border-r 2xl:w-[400px]",
            showMobileThread ? "hidden xl:flex" : "flex"
          )}
        >
          <div className="border-b border-slate-200 p-4 sm:p-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Replies</h2>
              <p className="mt-1 text-sm text-slate-500">Conversation inbox</p>
            </div>

            <div className="relative mt-4">
              <svg
                className="absolute left-3 top-3 h-4 w-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search brands, campaigns, people..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <select
                value={campaignFilter}
                onChange={(event) => setCampaignFilter(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              >
                <option value="">All Campaigns</option>
                {campaignOptions.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>

              {canFilterBySdr && (
                <select
                  value={sdrFilter}
                  onChange={(event) => setSdrFilter(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                >
                  <option value="">All SDRs</option>
                  {sdrFilterOptions.map((item) => (
                    <option key={item._id} value={item._id}>
                      {getAdminLabel(item)}
                    </option>
                  ))}
                </select>
              )}

              {canFilterByBme && (
                <select
                  value={bmeFilter}
                  onChange={(event) => setBmeFilter(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                >
                  <option value="">All BMEs</option>
                  {bmeFilterOptions.map((item) => (
                    <option key={item._id} value={item._id}>
                      {getAdminLabel(item)}
                    </option>
                  ))}
                </select>
              )}

              {canFilterByRh && (
                <select
                  value={rhFilter}
                  onChange={(event) => setRhFilter(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                >
                  <option value="">All RHs</option>
                  {rhFilterOptions.map((item) => (
                    <option key={item._id} value={item._id}>
                      {getAdminLabel(item)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Loading inbox...
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No conversations found.
              </div>
            ) : (
              <ul className="space-y-2">
                {filteredThreads.map((thread) => {
                  const active = thread._id === selectedThreadId;
                  const unread = isThreadUnreadForActor(thread, actorRole);
                  const brandName = getBrandDisplayName(thread);
                  const brandEmail = canSeeBrandEmail
                    ? thread.prospectId?.primaryContact?.email || thread.brandEmail || ""
                    : "";
                  const campaignName = thread.campaignId?.name || "No campaign";
                  const previewText = getThreadPreviewText(thread);

                  return (
                    <li key={thread._id}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowMobileThread(true);

                          if (thread._id === selectedThreadId) {
                            void loadSelectedThread();
                            return;
                          }

                          setSelectedThreadId(thread._id);
                        }}
                        className={cx(
                          "w-full rounded-2xl border p-4 text-left transition",
                          active && unread
                            ? "border-blue-500 bg-blue-50 shadow-sm"
                            : active
                              ? "border-slate-900 bg-white shadow-sm"
                              : unread
                                ? "border-blue-200 bg-blue-50/70 shadow-sm hover:border-blue-300 hover:bg-blue-50"
                                : "border-transparent bg-transparent hover:border-slate-200 hover:bg-white"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cx(
                              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                              unread
                                ? "bg-blue-600 text-white"
                                : "bg-slate-200 text-slate-800"
                            )}
                          >
                            {getInitials(brandName)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p
                                  className={cx(
                                    "truncate text-sm text-slate-900",
                                    unread ? "font-bold" : "font-semibold"
                                  )}
                                >
                                  {brandName}
                                </p>

                                {brandEmail ? (
                                  <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
                                    {brandEmail}
                                  </p>
                                ) : null}
                              </div>

                              <span
                                className={cx(
                                  "shrink-0 text-xs",
                                  unread ? "font-bold text-blue-700" : "text-slate-500"
                                )}
                              >
                                {formatShortDateTime(
                                  thread.lastMessageAt || thread.updatedAt || ""
                                )}
                              </span>
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                              {unread ? (
                                <span className="inline-flex shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                  New reply
                                </span>
                              ) : null}

                              <span
                                className={cx(
                                  "truncate",
                                  unread ? "font-semibold text-slate-800" : "text-slate-500"
                                )}
                              >
                                {previewText}
                              </span>

                              <>
                                <span>•</span>
                                <span className="truncate font-medium text-slate-700">
                                  {campaignName}
                                </span>
                              </>
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

        <main
          className={cx(
            "min-h-0 min-w-0 flex-1 flex-col bg-white",
            showMobileThread ? "flex" : "hidden xl:flex"
          )}
        >
          {!selectedThreadMeta ? (
            <div className="flex h-full items-center justify-center p-8 text-slate-400">
              <p>Select a conversation to view details</p>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <button
                        type="button"
                        onClick={() => setShowMobileThread(false)}
                        className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 xl:hidden"
                      >
                        Back
                      </button>

                      <div className="min-w-0">
                        <h3 className="truncate text-xl font-semibold text-slate-900 sm:text-2xl">
                          {selectedThreadMeta.subject ||
                            getBrandDisplayName(selectedThreadMeta)}
                        </h3>

                        <p className="mt-1 truncate text-sm text-slate-500">
                          {getBrandDisplayName(selectedThreadMeta)}
                          {canSeeBrandEmail &&
                            (selectedThreadMeta.prospectId?.primaryContact?.email ||
                              selectedThreadMeta.brandEmail)
                            ? ` · ${selectedThreadMeta.prospectId?.primaryContact?.email ||
                            selectedThreadMeta.brandEmail
                            }`
                            : ""}
                          {selectedThreadMeta.campaignId?.name
                            ? ` · ${selectedThreadMeta.campaignId.name}`
                            : ""}
                          {" · "}
                          {getThreadTeamLabel(selectedThreadMeta)}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span
                            className={cx(
                              "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                              getStagePillClasses(
                                selectedThreadMeta.prospectId?.stage
                              )
                            )}
                          >
                            {selectedThreadMeta.prospectId?.stage?.replace(
                              /_/g,
                              " "
                            ) || "No Stage"}
                          </span>

                          <span
                            className={cx(
                              "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                              getStatusPillClasses(selectedThreadMeta.status)
                            )}
                          >
                            {selectedThreadMeta.status?.replace(/_/g, " ") ||
                              "No Status"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="hidden items-center gap-3 sm:flex">
                      <button
                        type="button"
                        onClick={openReplyModal}
                        className="inline-flex rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
                      >
                        Reply
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 sm:hidden">
                    {canOpenCrmProfile ? (
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            selectedThreadMeta.prospectId?._id
                              ? `/admin/crm/review-queue?prospectId=${selectedThreadMeta.prospectId._id}`
                              : "/admin/crm/review-queue"
                          )
                        }
                        className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Open CRM
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={openReplyModal}
                      className="inline-flex flex-1 items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-white">
                <GmailThreadReader
                  thread={selectedThreadMeta}
                  messages={threadDetail.messages}
                  loading={threadLoading}
                />
              </div>
            </>
          )}
        </main>
      </div>

      {selectedThreadMeta ? (
        <button
          type="button"
          onClick={openReplyModal}
          className="fixed bottom-4 right-4 z-40 inline-flex h-14 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.28)] transition hover:bg-black sm:bottom-5 sm:right-5 xl:hidden"
        >
          Reply
        </button>
      ) : null}

      {isReplyModalOpen && selectedThreadMeta ? (
        <>
          <div
            className="fixed inset-0 z-[90] bg-slate-950/25"
            onClick={closeReplyModal}
          />

          <div className="fixed inset-x-2 bottom-2 z-[100] max-h-[82vh] rounded-[24px] border border-slate-200 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.25)] sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[520px]">
            <div className="flex max-h-[82vh] flex-col overflow-hidden">
              <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900">
                      Reply
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {getBrandDisplayName(selectedThreadMeta)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={handleComposerInsertLink}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      🔗 Link
                    </button>

                    <button
                      type="button"
                      onClick={closeReplyModal}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 transition hover:bg-slate-50"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                <span className="shrink-0 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Subject
                </span>

                <input
                  value={composerSubject}
                  onChange={(event) => setComposerSubject(event.target.value)}
                  placeholder="Re: Subject"
                  className="flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="relative min-h-0 flex-1 overflow-y-auto">
                {isEditorHtmlEmpty(composerBody) ? (
                  <div className="pointer-events-none absolute left-4 top-4 z-10 text-sm text-slate-400 sm:left-5">
                    Type your reply here...
                  </div>
                ) : null}

                <div
                  ref={composerEditorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={() => {
                    syncComposerBodyFromEditor();
                    saveComposerSelection();
                    updateLinkToolsFromSelection();
                  }}
                  onKeyUp={() => {
                    saveComposerSelection();
                    updateLinkToolsFromSelection();
                  }}
                  onMouseUp={() => {
                    saveComposerSelection();
                    updateLinkToolsFromSelection();
                  }}
                  onFocus={() => {
                    saveComposerSelection();
                    updateLinkToolsFromSelection();
                  }}
                  className="min-h-[220px] w-full bg-white px-4 py-4 text-sm leading-7 text-slate-800 outline-none sm:min-h-[260px] sm:px-5"
                  style={{ whiteSpace: "pre-wrap" }}
                />
              </div>

              <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-500">
                    Replying in thread for{" "}
                    <span className="font-semibold text-slate-700">
                      {getBrandDisplayName(selectedThreadMeta)}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={closeReplyModal}
                      className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:flex-none"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleReply}
                      disabled={
                        submittingKey !== "" || isEditorHtmlEmpty(composerBody)
                      }
                      className="inline-flex flex-1 items-center justify-center rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                    >
                      {submittingKey === "reply" ? "Sending..." : "Send Reply"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {isLinkToolsOpen && linkToolsPosition ? (
        <div
          className="fixed z-[120] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"
          style={{
            top: Math.max(linkToolsPosition.top, 12),
            left: linkToolsPosition.left,
          }}
        >
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleOpenLinkInNewTab}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100"
              title="Open link"
            >
              ↗
            </button>

            <button
              type="button"
              onClick={handleOpenEditLinkEditor}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100"
              title="Edit link"
            >
              ✎
            </button>

            <button
              type="button"
              onClick={handleRemoveSelectedLink}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100"
              title="Remove link"
            >
              ⨯
            </button>
          </div>
        </div>
      ) : null}

      {isLinkEditorOpen ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/35 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {linkEditorMode === "edit" ? "Edit link" : "Insert link"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Add or update link details.
                </p>
              </div>

              <button
                type="button"
                onClick={resetLinkEditor}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Link text
                </label>

                <input
                  value={linkEditorText}
                  onChange={(event) => setLinkEditorText(event.target.value)}
                  placeholder="Enter link text"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Web address
                </label>

                <input
                  value={linkEditorUrl}
                  onChange={(event) => setLinkEditorUrl(event.target.value)}
                  placeholder="https://example.com"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={resetLinkEditor}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmitLinkEditor}
                className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
              >
                {linkEditorMode === "edit" ? "Update link" : "Insert link"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}