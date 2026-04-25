import { lazy, Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import ErrorBoundary from "@/components/ErrorBoundary"
import CookieConsent from "@/components/CookieConsent"
import { AuthProvider } from "@/contexts/AuthContext"
import ScrollToTop from "./components/ScrollToTop"
import FeedbackWidget from "./components/FeedbackWidget"
import LoadingSpinner from "./components/LoadingSpinner"

// Lazy-loaded page components for code splitting
const SigningServicesHome = lazy(() => import("./pages/SigningServicesHome"))
const Index = lazy(() => import("./pages/Index"))
const NotFound = lazy(() => import("./pages/NotFound"))

// Signing pages
const SigningContact = lazy(() => import("./pages/signing/Contact"))
const SigningAbout = lazy(() => import("./pages/signing/About"))
const SigningServices = lazy(() => import("./pages/signing/Services"))
const SigningCoverage = lazy(() => import("./pages/signing/Coverage"))
const ForNotaries = lazy(() => import("./pages/signing/ForNotaries"))

// Service pages
const RemoteOnlineNotary = lazy(() => import("./pages/services/RemoteOnlineNotary"))
const MobileNotary = lazy(() => import("./pages/services/MobileNotary"))
const LoanSigningAgent = lazy(() => import("./pages/services/LoanSigningAgent"))
const BusinessRetainer = lazy(() => import("./pages/services/BusinessRetainer"))
const Apostille = lazy(() => import("./pages/services/Apostille"))
const I9Verification = lazy(() => import("./pages/services/I9Verification"))
const RegisteredOffice = lazy(() => import("./pages/services/RegisteredOffice"))
const CropServices = lazy(() => import("./pages/services/CropServices"))
const TransactionCoordination = lazy(() => import("./pages/services/TransactionCoordination"))
const HealthcareFacility = lazy(() => import("./pages/services/HealthcareFacility"))
const CertifiedCopies = lazy(() => import("./pages/services/CertifiedCopies"))
const WitnessService = lazy(() => import("./pages/services/WitnessService"))
const PassportPhotos = lazy(() => import("./pages/services/PassportPhotos"))
const TranslationCertification = lazy(() => import("./pages/services/TranslationCertification"))
const VehicleTitleTransfer = lazy(() => import("./pages/services/VehicleTitleTransfer"))
const VirtualMailbox = lazy(() => import("./pages/services/VirtualMailbox"))
const UCCFiling = lazy(() => import("./pages/services/UCCFiling"))
const DocumentRetrieval = lazy(() => import("./pages/services/DocumentRetrieval"))

// Application pages
const CropApplication = lazy(() => import("./pages/CropApplication"))
const CropApplicationSuccess = lazy(() => import("./pages/CropApplicationSuccess"))
const TcApplication = lazy(() => import("./pages/TcApplication"))
const TcApplicationSuccess = lazy(() => import("./pages/TcApplicationSuccess"))

// Resource pages
const HowRonWorks = lazy(() => import("./pages/resources/HowRonWorks"))

// Area pages (counties)
const ErieCounty = lazy(() => import("./pages/areas/ErieCounty"))
const CrawfordCounty = lazy(() => import("./pages/areas/CrawfordCounty"))
const WarrenCounty = lazy(() => import("./pages/areas/WarrenCounty"))
const MercerCounty = lazy(() => import("./pages/areas/MercerCounty"))
const VenangoCounty = lazy(() => import("./pages/areas/VenangoCounty"))
const StatewideOnline = lazy(() => import("./pages/areas/StatewideOnline"))

// Dynamic city page (replaces 67 individual city components)
const CityPage = lazy(() => import("./pages/areas/CityPage"))

// Other pages
const Pricing = lazy(() => import("./pages/Pricing"))
const Calculator = lazy(() => import("./pages/Calculator"))
const Subscriptions = lazy(() => import("./pages/Subscriptions"))
const TrackBooking = lazy(() => import("./pages/TrackBooking"))
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"))
const PaymentCanceled = lazy(() => import("./pages/PaymentCanceled"))
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"))
const TermsOfService = lazy(() => import("./pages/TermsOfService"))
const Accessibility = lazy(() => import("./pages/Accessibility"))
const Agreements = lazy(() => import("./pages/legal/Agreements"))

// Auth & Portal
const Auth = lazy(() => import("./pages/Auth"))
const ClientPortal = lazy(() => import("./pages/ClientPortal"))

// Admin pages
const AdminLogin = lazy(() => import("./pages/admin/Login"))
const AdminBookings = lazy(() => import("./pages/admin/Bookings"))
const AdminCallScaler = lazy(() => import("./pages/admin/CallScaler"))
const AdminVoiceAgent = lazy(() => import("./pages/admin/VoiceAgent"))
const AdminWhatsAppConfig = lazy(() => import("./pages/admin/WhatsAppConfig"))
const AdminAutomationFlows = lazy(() => import("./pages/admin/AutomationFlows"))
const AdminCropApplications = lazy(() => import("./pages/admin/CropApplications"))
const AdminTcClients = lazy(() => import("./pages/admin/TcClients"))
const AdminMailUploads = lazy(() => import("./pages/admin/MailUploads"))
const PerformanceDashboard = lazy(() => import("./pages/admin/PerformanceDashboard"))
const AdminVendorNetwork = lazy(() => import("./pages/admin/VendorNetwork"))
const AdminSigningOrders = lazy(() => import("./pages/admin/SigningOrders"))
const AdminTitleClients = lazy(() => import("./pages/admin/TitleClients"))
const SigningKPIDashboard = lazy(() => import("./pages/admin/SigningKPIDashboard"))

// Utility pages
const VendorApplication = lazy(() => import("./pages/VendorApplication"))
const Sitemap = lazy(() => import("./pages/Sitemap"))
const LogoProcessor = lazy(() => import("./pages/LogoProcessor"))
const AllBadgesProcessor = lazy(() => import("./pages/AllBadgesProcessor"))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <ScrollToTop />
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route path="/" element={<SigningServicesHome />} />
                  <Route path="/local" element={<Index />} />

                  {/* National Signing Service Pages */}
                  <Route path="/contact" element={<SigningContact />} />
                  <Route path="/about" element={<SigningAbout />} />
                  <Route path="/services" element={<SigningServices />} />
                  <Route path="/coverage" element={<SigningCoverage />} />
                  <Route path="/for-notaries" element={<ForNotaries />} />

                  {/* Service Pages */}
                  <Route path="/services/remote-online-notary" element={<RemoteOnlineNotary />} />
                  <Route path="/services/mobile-notary" element={<MobileNotary />} />
                  <Route path="/services/loan-signing-agent" element={<LoanSigningAgent />} />
                  <Route path="/services/business-retainer" element={<BusinessRetainer />} />
                  <Route path="/services/apostille" element={<Apostille />} />
                  <Route path="/services/i9-verification" element={<I9Verification />} />
                  <Route path="/services/registered-office" element={<RegisteredOffice />} />
                  <Route path="/crop" element={<CropServices />} />
                  <Route path="/crop/application" element={<CropApplication />} />
                  <Route path="/crop/application/success" element={<CropApplicationSuccess />} />
                  <Route path="/transaction-coordination" element={<TransactionCoordination />} />
                  <Route path="/transaction-coordination/application" element={<TcApplication />} />
                  <Route path="/transaction-coordination/application/success" element={<TcApplicationSuccess />} />
                  <Route path="/services/healthcare-facility" element={<HealthcareFacility />} />
                  <Route path="/services/certified-copies" element={<CertifiedCopies />} />
                  <Route path="/services/witness-service" element={<WitnessService />} />
                  <Route path="/services/passport-photos" element={<PassportPhotos />} />
                  <Route path="/services/translation-certification" element={<TranslationCertification />} />
                  <Route path="/services/vehicle-title-transfer" element={<VehicleTitleTransfer />} />
                  <Route path="/services/virtual-mailbox" element={<VirtualMailbox />} />
                  <Route path="/services/ucc-filing" element={<UCCFiling />} />
                  <Route path="/services/document-retrieval" element={<DocumentRetrieval />} />

                  {/* Resource Pages */}
                  <Route path="/resources/how-ron-works" element={<HowRonWorks />} />

                  {/* County Area Pages */}
                  <Route path="/areas/erie-county" element={<ErieCounty />} />
                  <Route path="/areas/crawford-county" element={<CrawfordCounty />} />
                  <Route path="/areas/warren-county" element={<WarrenCounty />} />
                  <Route path="/areas/mercer-county" element={<MercerCounty />} />
                  <Route path="/areas/venango-county" element={<VenangoCounty />} />
                  <Route path="/areas/statewide-online" element={<StatewideOnline />} />

                  {/* Dynamic City Pages (replaces 67 individual route/component pairs) */}
                  <Route path="/areas/:citySlug" element={<CityPage />} />

                  {/* Other Pages */}
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/calculator" element={<Calculator />} />
                  <Route path="/subscriptions" element={<Subscriptions />} />
                  <Route path="/track-booking" element={<TrackBooking />} />
                  <Route path="/payment-success" element={<PaymentSuccess />} />
                  <Route path="/payment-canceled" element={<PaymentCanceled />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  <Route path="/accessibility" element={<Accessibility />} />
                  <Route path="/legal/agreements" element={<Agreements />} />

                  {/* Auth & Portal */}
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/portal" element={<ClientPortal />} />

                  {/* Admin Pages */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin/bookings" element={<AdminBookings />} />
                  <Route path="/admin/callscaler" element={<AdminCallScaler />} />
                  <Route path="/admin/voice-agent" element={<AdminVoiceAgent />} />
                  <Route path="/admin/whatsapp" element={<AdminWhatsAppConfig />} />
                  <Route path="/admin/automation" element={<AdminAutomationFlows />} />
                  <Route path="/admin/crop-applications" element={<AdminCropApplications />} />
                  <Route path="/admin/tc" element={<AdminTcClients />} />
                  <Route path="/admin/mail-uploads" element={<AdminMailUploads />} />
                  <Route path="/admin/performance" element={<PerformanceDashboard />} />
                  <Route path="/admin/vendors" element={<AdminVendorNetwork />} />
                  <Route path="/admin/signing-orders" element={<AdminSigningOrders />} />
                  <Route path="/admin/title-clients" element={<AdminTitleClients />} />
                  <Route path="/admin/signing-kpis" element={<SigningKPIDashboard />} />

                  {/* Public Vendor Application */}
                  <Route path="/apply" element={<VendorApplication />} />

                  {/* Utility Pages */}
                  <Route path="/sitemap" element={<Sitemap />} />
                  <Route path="/logo-processor" element={<LogoProcessor />} />
                  <Route path="/process-badges" element={<AllBadgesProcessor />} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <CookieConsent />
              <FeedbackWidget />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
