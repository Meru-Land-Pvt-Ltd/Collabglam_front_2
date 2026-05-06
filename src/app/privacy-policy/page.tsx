"use client";

import PublicPolicyPage from "@/components/common/PublicPolicyPage";

export default function CookiePolicyPage() {
  return (
    <PublicPolicyPage
      heading="Privacy Policy"
      policyKey="privacy_policy"
      errorMessage="Failed to load Privacy Policy."
      loadingMessage="Loading Privacy Policy..."
    />
  );
}