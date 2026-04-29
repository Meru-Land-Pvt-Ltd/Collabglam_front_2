// app/brand/layout.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import BrandScaffold from "@/components/ui/brand/brandScaffold";

export default function BrandAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [hasBrandId, setHasBrandId] = useState(false);

  const NO_SCAFFOLD_ROUTES = useMemo(
    () => [
      "/brand/login",
      "/brand/signup",
      "/brand/forgot-password",
      "/brand/onboarding",
    ],
    []
  );

  const skipScaffold = NO_SCAFFOLD_ROUTES.some((route) => pathname === route);

  useEffect(() => {
    if (skipScaffold) {
      setCheckingAuth(false);
      setHasBrandId(true);
      return;
    }

    const token = window.localStorage.getItem("token");

    const brandId =
      window.localStorage.getItem("brandId") ||
      window.localStorage.getItem("currentBrandId");

    if (!token || !brandId) {
      setHasBrandId(false);
      setCheckingAuth(false);

      const returnUrl = `${window.location.pathname}${window.location.search}`;

      router.replace(`/brand/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    setHasBrandId(true);
    setCheckingAuth(false);
  }, [router, skipScaffold, pathname]);

  if (checkingAuth) {
    return (
      <div className="flex h-dvh items-center justify-center bg-white">
        <div className="text-sm text-neutral-500">Loading...</div>
      </div>
    );
  }

  if (skipScaffold) {
    return <>{children}</>;
  }

  if (!hasBrandId) {
    return null;
  }

  return (
    <div className="h-dvh overflow-hidden">
      <BrandScaffold>{children}</BrandScaffold>
    </div>
  );
}