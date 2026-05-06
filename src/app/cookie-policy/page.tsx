"use client";

import PublicPolicyPage from "@/components/common/PublicPolicyPage";

export default function CookiePolicyPage() {
  return (
    <PublicPolicyPage
      heading="Cookie Policy"
      policyKey="cookie_policy"
      errorMessage="Failed to load Cookie Policy."
      loadingMessage="Loading Cookie Policy..."
    />
  );
}
