"use client";

import React, { useState } from "react";
import InfluencerSidebar from "@/components/ui/influencer/sidebar";
import InfluencerTopbar from "@/components/ui/influencer/influencerTopbar";
import {
  InfluencerTopbarProvider,
  useInfluencerTopbar,
} from "@/components/ui/influencer/influencerTopbarProvider";
import { ToastStyles } from "../toast";

function Inner({ children }: { children: React.ReactNode }) {
  const { actions } = useInfluencerTopbar();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-white">
      {/* Sidebar stays in normal flex flow, so topbar starts after it */}
      <aside className="relative z-50 h-full shrink-0 overflow-visible">
        <InfluencerSidebar
          drawerOpen={drawerOpen}
          setDrawerOpen={(open) => setDrawerOpen(open)}
        />
      </aside>

      {/* Right side adjusts automatically when sidebar expands/collapses */}
      <section className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <header className="relative z-40 shrink-0">
          <InfluencerTopbar
            actionsOverride={actions}
            onMenuToggle={() => setDrawerOpen((value) => !value)}
          />
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#F7F8FA]">
          <div className="min-h-[calc(100dvh-var(--influencer-topbar-h,72px))]">
            {children}
          </div>

          <ToastStyles />
        </main>
      </section>
    </div>
  );
}

export default function InfluencerScaffold({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <InfluencerTopbarProvider>
      <Inner>{children}</Inner>
    </InfluencerTopbarProvider>
  );
}