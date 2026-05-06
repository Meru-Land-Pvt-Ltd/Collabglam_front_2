"use client";

import PublicPolicyPage from "@/components/common/PublicPolicyPage";

export default function CookiePolicyPage() {
  return (
    <PublicPolicyPage
      heading="Returns, Cancellations & Refund Policy"
      policyKey="returns_refund_policy"
      errorMessage="Failed to load Returns, Cancellations & Refund Policy."
      loadingMessage="Loading Returns, Cancellations & Refund Policy..."
    />
  );
}