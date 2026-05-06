"use client";

import PublicPolicyPage from "@/components/common/PublicPolicyPage";

export default function CookiePolicyPage() {
  return (
    <PublicPolicyPage
      heading="Terms of Service"
      policyKey="terms_of_service"
      errorMessage="Failed to load Terms of Service."
      loadingMessage="Loading Terms of Service..."
    />
  );
}