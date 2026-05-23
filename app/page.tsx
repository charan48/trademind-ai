import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { MarketPreview } from "@/components/landing/MarketPreview";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";
import { StockTicker } from "@/components/shared/StockTicker";
import { Navigation } from "@/components/shared/Navigation";

export default function LandingPage() {
  return (
    <main className="bg-bg-primary min-h-screen">
      <Navigation />
      <StockTicker />
      <Hero />
      <Features />
      <MarketPreview />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  );
}
