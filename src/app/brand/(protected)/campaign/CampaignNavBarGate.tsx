"use client";

import React, { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import CampaignNavBar from "./CampaignNavbar";

const CAMPAIGN_LIST_PAGES = new Set([
  "all",
  "active",
  "draft",
  "scheduled",
  "scheduled-campaign",
]);

export default function CampaignNavBarGate() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hideNavbar = useMemo(() => {
    const p = (pathname ?? "").replace(/\/+$/, "");
    if (/^\/brand\/campaign\/[^/]+\/pitch-folder$/.test(p)) {
      return true;
    }

    const detailMatch = p.match(/^\/brand\/campaign\/([^/]+)$/);
    if (!detailMatch) return false;

    const slug = decodeURIComponent(detailMatch[1]);

    if (CAMPAIGN_LIST_PAGES.has(slug)) return false;

    return true;
  }, [pathname, searchParams]);

  if (hideNavbar) return null;

  return <CampaignNavBar />;
}