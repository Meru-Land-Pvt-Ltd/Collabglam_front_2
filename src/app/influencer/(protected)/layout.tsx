"use client";

import * as React from "react";
import Sidebar from "@/components/ui/influencer/sidebar";
import { SidebarProvider } from "../sidebarContext";

function safeOffset(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

export default function InfluencerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mainRef = React.useRef<HTMLElement | null>(null);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [sidebarOffset, setSidebarOffset] = React.useState(0);

  const measureOffset = React.useCallback(() => {
    if (typeof window === "undefined") return;

    if (window.innerWidth < 1024) {
      setSidebarOffset(0);
      return;
    }

    const left = mainRef.current?.getBoundingClientRect().left ?? 0;
    setSidebarOffset((prev) => {
      const next = safeOffset(left);
      return prev === next ? prev : next;
    });
  }, []);

  React.useLayoutEffect(() => {
    measureOffset();

    if (typeof window === "undefined") return;

    let raf = 0;
    let running = false;

    const runFrameMeasure = () => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(measureOffset);
    };

    const runShortTracking = () => {
      if (running) return;

      running = true;
      const startedAt = performance.now();

      const tick = () => {
        measureOffset();

        if (performance.now() - startedAt < 320) {
          raf = window.requestAnimationFrame(tick);
        } else {
          running = false;
        }
      };

      raf = window.requestAnimationFrame(tick);
    };

    const resizeObserver =
      typeof ResizeObserver !== "undefined" && mainRef.current
        ? new ResizeObserver(runFrameMeasure)
        : null;

    if (mainRef.current) {
      resizeObserver?.observe(mainRef.current);
    }

    window.addEventListener("resize", runFrameMeasure, { passive: true });
    document.addEventListener("transitionstart", runShortTracking, true);
    document.addEventListener("transitionrun", runShortTracking, true);
    document.addEventListener("transitionend", runFrameMeasure, true);

    return () => {
      window.cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", runFrameMeasure);
      document.removeEventListener("transitionstart", runShortTracking, true);
      document.removeEventListener("transitionrun", runShortTracking, true);
      document.removeEventListener("transitionend", runFrameMeasure, true);
    };
  }, [measureOffset]);

  const value = React.useMemo(
    () => ({
      drawerOpen,
      setDrawerOpen,

      open: () => setDrawerOpen(true),
      close: () => setDrawerOpen(false),
      toggle: () => setDrawerOpen((v) => !v),

      sidebarOffset,
      setSidebarOffset,
    }),
    [drawerOpen, sidebarOffset]
  );

  return (
    <SidebarProvider value={value}>
      <div className="h-dvh flex bg-white overflow-hidden">
        <Sidebar drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />

        <main
          ref={mainRef}
          className="relative flex-1 min-w-0 overflow-y-auto"
          style={
            {
              "--cg-sidebar-offset": `${sidebarOffset}px`,
            } as React.CSSProperties
          }
        >
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}