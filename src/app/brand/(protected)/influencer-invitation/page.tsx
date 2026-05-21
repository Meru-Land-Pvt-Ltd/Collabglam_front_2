import { Suspense } from "react";
import InfluencerInvitationClient from "./InfluencerInvitationClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 h-screen flex flex-col justify-center items-center">Loading…</div>}>
      <InfluencerInvitationClient />
    </Suspense>
  );
}
