
"use client";

import { Suspense } from "react";
import ModashDashboard from "./ModashDashboard";

export default function BrowseInfluencerPage() {
  return (
    <Suspense fallback={null}>
      <ModashDashboard />
    </Suspense>
  );
}