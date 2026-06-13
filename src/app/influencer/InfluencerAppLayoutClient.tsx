"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import InfluencerScaffold from "@/components/ui/influencer/influencerScaffold";
import { Loader } from '@/components/ui/loader';

export default function InfluencerAppLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [hasInfluencerId, setHasInfluencerId] = useState(false);

  const PUBLIC_NO_SCAFFOLD_ROUTES = useMemo(
    () => [
      "/influencer/login",
      "/influencer/signup",
      "/influencer/forgot-password",
      "/influencer/onboarding",
    ],
    []
  );

  const AUTH_NO_SCAFFOLD_ROUTES = useMemo(
    () => [
      "/influencer/invitation",
      "/influencer/brand-invitation",
    ],
    []
  );

  const isPublicNoScaffoldRoute = PUBLIC_NO_SCAFFOLD_ROUTES.some(
    (route) => pathname === route
  );

  const isAuthNoScaffoldRoute = AUTH_NO_SCAFFOLD_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const skipScaffold = isPublicNoScaffoldRoute || isAuthNoScaffoldRoute;

  useEffect(() => {
    if (isPublicNoScaffoldRoute) {
      setCheckingAuth(false);
      setHasInfluencerId(true);
      return;
    }

    const token =
      window.localStorage.getItem("influencer_token") ||
      window.localStorage.getItem("influencerToken") ||
      window.localStorage.getItem("token") ||
      window.localStorage.getItem("accessToken");

    const influencerId =
      window.localStorage.getItem("influencerId") ||
      window.localStorage.getItem("currentInfluencerId") ||
      window.localStorage.getItem("influencer_id") ||
      window.localStorage.getItem("userId") ||
      window.localStorage.getItem("_id");

    if (!token || !influencerId) {
      setHasInfluencerId(false);
      setCheckingAuth(false);

      const returnUrl = `${window.location.pathname}${window.location.search}`;

      router.replace(
        `/influencer/login?returnUrl=${encodeURIComponent(returnUrl)}`
      );

      return;
    }

    setHasInfluencerId(true);
    setCheckingAuth(false);
  }, [router, pathname, isPublicNoScaffoldRoute]);

  if (checkingAuth) {
    return (
      <div className="flex h-dvh items-center justify-center bg-white">
        <Loader logoSrc={"/logo.png"} />
      </div>
    );
  }

  if (!hasInfluencerId) {
    return null;
  }

  if (skipScaffold) {
    return <>{children}</>;
  }

  return (
    <div className="h-dvh overflow-hidden">
      <InfluencerScaffold>{children}</InfluencerScaffold>
    </div>
  );
}