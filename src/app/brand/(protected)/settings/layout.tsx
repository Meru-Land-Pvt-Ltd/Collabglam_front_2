import type { ReactNode } from "react";
import SettingsNavbar from "./SettingsNavbar";

type SettingsLayoutProps = {
  children: ReactNode;
};

const SettingsLayout = ({ children }: SettingsLayoutProps) => {
  return (
    <section className="flex min-h-screen w-full flex-col bg-white text-[#1A1A1A]">
      <SettingsNavbar />

      <main className="w-full px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        {children}
      </main>
    </section>
  );
};

export default SettingsLayout;