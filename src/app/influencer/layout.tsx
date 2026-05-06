import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CollabGlam — Influencer",
};

export default function InfluencerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="min-h-screen bg-background">{children}</main>;
}