"use client";

import React, { useState } from "react";
import BrandSidebar from "@/components/ui/brand/brandSidebar";
import BrandTopbar from "@/components/ui/brand/brandTopbar";
import {
  BrandTopbarProvider,
  useBrandTopbar,
} from "@/components/ui/brand/brandTopbarProvider";
import { ToastStyles } from "../toast";

function Inner({ children }: { children: React.ReactNode }) {
  const { actions } = useBrandTopbar();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-white">
      <div className="relative z-50 h-full shrink-0 overflow-visible">
        <BrandSidebar
          drawerOpen={drawerOpen}
          setDrawerOpen={(open) => setDrawerOpen(open)}
        />
      </div>

      <div className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 overflow-hidden">
          <BrandTopbar
            actionsOverride={actions}
            onMenuToggle={() => setDrawerOpen((value) => !value)}
          />
        </div>

        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="min-h-[calc(100dvh-var(--brand-topbar-h,72px))]">
            {children}
          </div>

          <ToastStyles />
        </main>
      </div>
    </div>
  );
}

export default function BrandScaffold({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BrandTopbarProvider>
      <Inner>{children}</Inner>
    </BrandTopbarProvider>
  );
}