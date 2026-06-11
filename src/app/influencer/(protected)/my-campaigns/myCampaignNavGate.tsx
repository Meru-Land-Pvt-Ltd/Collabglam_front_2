"use client";

import React, { useMemo } from "react";
import { usePathname } from "next/navigation";
import MyCampaignNavbar from "./myCampaignNavbar";

const CAMPAIGN_LIST_PAGES = new Set([
  "all",
  "active",
  "applied",
  "completed",
  "rejected",
]);

export default function MyCampaignNavbarGate() {
  const pathname = usePathname();

  const hideNavbar = useMemo(() => {
    const cleanPath = (pathname ?? "").replace(/\/+$/, "");

    const detailMatch = cleanPath.match(/^\/influencer\/my-campaigns\/([^/]+)$/);

    if (!detailMatch) return false;

    const slug = decodeURIComponent(detailMatch[1]);

    if (CAMPAIGN_LIST_PAGES.has(slug)) return false;

    return true;
  }, [pathname]);

  if (hideNavbar) return null;

  return <MyCampaignNavbar />;
}