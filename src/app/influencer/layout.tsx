import type { Metadata } from "next";
import InfluencerAppLayoutClient from "./InfluencerAppLayoutClient";

export const metadata: Metadata = {
  title: "CollabGlam — Influencer",
};

export default function InfluencerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <InfluencerAppLayoutClient>{children}</InfluencerAppLayoutClient>;
}