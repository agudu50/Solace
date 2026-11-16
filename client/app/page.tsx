import React from 'react';
import HeroSection from '../components/landing/HeroSection';
import StatsSection from '../components/landing/StatsSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import InteractiveScanner from '../components/landing/InteractiveScanner';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import ArchitectureSection from '../components/landing/ArchitectureSection';
import AuditStudioSection from '../components/landing/AuditStudioSection';
import ReportsSection from '../components/landing/ReportsSection';
import FaqSection from '../components/landing/FaqSection';
import CtaSection from '../components/landing/CtaSection';

export default function LandingPage() {
  return (
    <div className="relative w-full min-h-screen bg-[#f7f7f6] dark:bg-[#0e0e0e] text-slate-800 dark:text-slate-100 overflow-x-hidden">
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <InteractiveScanner />
      <ArchitectureSection />
      <AuditStudioSection />
      <ReportsSection />
      <FaqSection />
      <CtaSection />
    </div>
  );
}
