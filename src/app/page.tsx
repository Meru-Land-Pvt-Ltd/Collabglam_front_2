import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import BrandLogoWall from '@/components/landing/BrandLogoWall';
import WhyCollabGlam from '@/components/landing/WhyCollabGlam';
import PlatformFeatures from '@/components/landing/PlatformFeatures';
import ManagedCampaignPlan from '@/components/landing/ManagedCampaignPlan';
import SimpleProcess from '@/components/landing/SimpleProcess';
import RealResults from '@/components/landing/RealResults';
import AboutCollabGlam from '@/components/landing/AboutCollabGlam';
import Testimonials from '@/components/landing/Testimonials';
import FAQSection from '@/components/landing/FAQSection';
import LeadGeneration from '@/components/landing/LeadGeneration';
import Footer from '@/components/landing/Footer';

export default function Page() {
  return (
    <main className="min-h-screen bg-[#0c0c12]">
      <Header />

      {/* Above the fold */}
      <Hero />

      {/* Trust / social proof */}
      <BrandLogoWall />

      {/* Problem → solution */}
      <WhyCollabGlam />

      {/* Product value */}
      <PlatformFeatures />

      {/* Premium service offer */}
      <ManagedCampaignPlan />

      {/* How it works */}
      <SimpleProcess />

      {/* Proof / ROI */}
      <RealResults />

      {/* Brand story */}
      <AboutCollabGlam />

      {/* Voice of customers */}
      <Testimonials />

      {/* Objection handling */}
      <FAQSection />

      {/* Final conversion */}
      <LeadGeneration />

      <Footer />
    </main>
  );
}