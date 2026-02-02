"use client";

import { HeroSection } from "./hero-section";
import { FeaturesSection } from "./features-section";
import { HowItWorksSection } from "./how-it-works-section";
import { TestimonialsSection } from "./testimonials-section";
import { CtaSection } from "./cta-section";
import { PricingTable } from "@/widgets/pricing-table";

export function LandingContent() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingTable />
      <TestimonialsSection />
      <CtaSection />
    </>
  );
}
