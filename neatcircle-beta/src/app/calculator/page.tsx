import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ROICalculator from "@/components/ROICalculator";
import { siteConfig } from "@/lib/site-config";

export const metadata = {
  title: `Automation ROI Calculator | ${siteConfig.brandName}`,
  description: "Calculate how much time and money your business could save with automation. Free ROI analysis.",
  openGraph: {
    title: `Automation ROI Calculator | ${siteConfig.brandName}`,
    description: "Calculate how much time and money your business could save with automation. Free ROI analysis.",
  },
};

export default function CalculatorPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20 pt-32">
        <div className="mx-auto max-w-4xl px-4">
          <ROICalculator />
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-400">
              Calculations based on industry averages. Your actual results may vary.
              <br />
              209+ premium tools included. Zero software licensing fees.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
