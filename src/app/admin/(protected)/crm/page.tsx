"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminGet, getApiErrorMessage } from "@/lib/api";

type MeResponse = {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
};

function getRedirectPath(role?: string) {
  const normalizedRole = String(role || "").trim().toLowerCase();

  if (normalizedRole === "bme") {
    return "/admin/crm/replies";
  }

  if (
    normalizedRole === "sdr" ||
    normalizedRole === "super_admin" ||
    normalizedRole === "admin" ||
    normalizedRole === "revenue_head" ||
    normalizedRole === "rh" ||
    normalizedRole === "ime"
  ) {
    return "/admin/crm/campaigns";
  }

  return "/admin/crm/campaigns";
}

export default function InstantlyCRMPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const redirectByRole = async () => {
      try {
        const me = await adminGet<MeResponse>("/admins/me");
        const nextPath = getRedirectPath(me?.role);

        if (isMounted) {
          router.replace(nextPath);
        }
      } catch (err) {
        const message = await getApiErrorMessage(err, "Failed to load user role");

        if (isMounted) {
          setError(message);
        }
      }
    };

    redirectByRole();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="w-full max-w-md rounded-[24px] border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-red-700">Redirection failed</h2>
          <p className="mt-2 text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="w-full max-w-md rounded-[24px] border border-slate-200 bg-white p-6 text-center shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
        <p className="mt-4 text-sm font-medium text-slate-700">
          Redirecting to your workspace...
        </p>
      </div>
    </div>
  );
}