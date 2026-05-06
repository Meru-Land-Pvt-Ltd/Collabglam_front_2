"use client";

import PublicPolicyPage from "@/components/common/PublicPolicyPage";

export default function CookiePolicyPage() {
  return (
    <PublicPolicyPage
      heading="Shipping & Delivery Policy"
      policyKey="shipping_delivery_policy"
      errorMessage="Failed to load Shipping & Delivery Policy."
      loadingMessage="Loading Shipping & Delivery Policy..."
    />
  );
}
