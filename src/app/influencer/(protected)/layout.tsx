"use client";

import * as React from "react";
import { SidebarProvider } from "../sidebarContext";

export default function InfluencerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [sidebarOffset, setSidebarOffset] = React.useState(0);

  const value = React.useMemo(
    () => ({
      drawerOpen,
      setDrawerOpen,

      open: () => setDrawerOpen(true),
      close: () => setDrawerOpen(false),
      toggle: () => setDrawerOpen((value) => !value),

      sidebarOffset,
      setSidebarOffset,
    }),
    [drawerOpen, sidebarOffset]
  );

  return <SidebarProvider value={value}>{children}</SidebarProvider>;
}