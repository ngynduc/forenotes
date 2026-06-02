import { SiteHeader } from "@/components/SiteHeader";
import { HeroSection } from "@/components/HeroSection";
import { ProductSection } from "@/components/ProductSection";
import { RelationGraphSection } from "@/components/RelationGraphSection";
import { WorkflowSection } from "@/components/WorkflowSection";
import { FeatureGrid } from "@/components/FeatureGrid";
import { ReportPreview } from "@/components/ReportPreview";
import { DeploymentSection } from "@/components/DeploymentSection";
import { CTASection } from "@/components/CTASection";
import { SiteFooter } from "@/components/SiteFooter";

export function LandingPage() {
  return (
    <div className="landing-page">
      <SiteHeader />
      <main>
        <HeroSection />
        <ProductSection />
        <RelationGraphSection />
        <WorkflowSection />
        <FeatureGrid />
        <ReportPreview />
        <DeploymentSection />
        <CTASection />
      </main>
      <SiteFooter />
    </div>
  );
}
