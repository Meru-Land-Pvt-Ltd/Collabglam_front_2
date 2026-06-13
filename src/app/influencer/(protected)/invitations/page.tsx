"use client";

import { Suspense } from "react";
import ViewCampaignInvitation from "./campaign-invitations";

export default function CampaignInvitation() {
  return (
    <div className="h-dvh overflow-hidden bg-white">
      <Suspense fallback={<div className="bg-white p-6">Loading…</div>}>
        <ViewCampaignInvitation />
      </Suspense>
    </div>
  );
}