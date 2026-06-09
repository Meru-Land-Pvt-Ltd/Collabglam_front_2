"use client";

import React, { useState } from "react";
import InfluencerSidebar from "./sidebar";
import InfluencerTopbar from "./influencerTopbar";
import {
  InfluencerTopbarProvider,
  useInfluencerTopbar,
} from "./influencerTopbarProvider";

function ShellInner({ children }: { children: React.ReactNode }) {
  const { actions } = useInfluencerTopbar();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-dvh w-full overflow-hidden bg-white">
      <InfluencerSidebar
        drawerOpen={drawerOpen}
        setDrawerOpen={(open) => setDrawerOpen(open)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <InfluencerTopbar
          actionsOverride={actions}
          onMenuToggle={() => setDrawerOpen((value) => !value)}
        />

        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function InfluencerShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <InfluencerTopbarProvider>
      <ShellInner>{children}</ShellInner>
    </InfluencerTopbarProvider>
  );
}