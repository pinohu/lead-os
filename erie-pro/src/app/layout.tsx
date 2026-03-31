import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cityConfig } from "@/lib/city-config";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: `${cityConfig.name}, ${cityConfig.stateCode} — Local Business Directory | ${cityConfig.domain}`, template: `%s | ${cityConfig.domain}` },
  description: `Find the best local service providers in ${cityConfig.name}, ${cityConfig.state}. Verified businesses, instant quotes, and exclusive leads for ${cityConfig.serviceArea.slice(0, 5).join(", ")}, and surrounding areas.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased bg-white text-gray-900`}>
        {/* Navigation */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
          <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-gray-900">{cityConfig.domain}</span>
            </a>
            <div className="hidden md:flex items-center gap-6 text-sm">
              <a href="/#services" className="text-gray-500 hover:text-gray-900 transition-colors">Services</a>
              <a href="/#how-it-works" className="text-gray-500 hover:text-gray-900 transition-colors">How It Works</a>
              <a href="/#pricing" className="text-gray-500 hover:text-gray-900 transition-colors">For Businesses</a>
              <a href="/contact" className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors">Get Listed</a>
            </div>
          </nav>
        </header>

        {children}

        {/* Footer */}
        <footer className="border-t border-gray-100 py-12 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="font-bold text-lg mb-2">{cityConfig.domain}</div>
                <p className="text-sm text-gray-500">{cityConfig.tagline}</p>
                <p className="text-sm text-gray-400 mt-2">{cityConfig.name}, {cityConfig.state}</p>
              </div>
              <div>
                <div className="font-semibold text-sm mb-3">Popular Services</div>
                <div className="space-y-2">
                  {["plumbing", "hvac", "electrical", "roofing", "dental", "legal"].map(s => (
                    <a key={s} href={`/${s}`} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors capitalize">{s.replace("-", " ")}</a>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-semibold text-sm mb-3">Service Areas</div>
                <div className="space-y-2">
                  {cityConfig.serviceArea.slice(0, 6).map(area => (
                    <span key={area} className="block text-sm text-gray-500">{area}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-semibold text-sm mb-3">For Businesses</div>
                <div className="space-y-2">
                  <a href="/#pricing" className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Pricing</a>
                  <a href="/#how-it-works" className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">How It Works</a>
                  <a href="/contact" className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Get Listed</a>
                </div>
              </div>
            </div>
            <div className="mt-10 pt-8 border-t border-gray-100 text-center text-xs text-gray-400">
              &copy; {new Date().getFullYear()} {cityConfig.domain}. All rights reserved. Powered by Lead OS.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
