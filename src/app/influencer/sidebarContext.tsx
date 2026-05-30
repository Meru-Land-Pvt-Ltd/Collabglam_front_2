"use client";

import * as React from "react";

type SidebarContextValue = {
  open: () => void;
  close: () => void;
  toggle: () => void;

  drawerOpen: boolean;
  setDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;

  sidebarOffset: number;
  setSidebarOffset: React.Dispatch<React.SetStateAction<number>>;
};

const SidebarCtx = React.createContext<SidebarContextValue | null>(null);

export function SidebarProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: SidebarContextValue;
}) {
  return <SidebarCtx.Provider value={value}>{children}</SidebarCtx.Provider>;
}

export function useSidebar() {
  const ctx = React.useContext(SidebarCtx);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}

export function useSidebarOffset() {
  return React.useContext(SidebarCtx)?.sidebarOffset ?? 0;
}