import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginScreen } from './components/LoginScreen';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthCallback } from './components/AuthCallback';

import { ErrorBoundary } from './components/ErrorBoundary';
import { DataProvider } from './components/DataProvider';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ScrollToTop } from './components/ScrollToTop';
import WhatsAppFloat from './components/WhatsAppFloat';

// Lazy load all pages for code splitting
const Index = React.lazy(() => import('./pages/Index'));
const Rentals = React.lazy(() => import('./pages/Rentals'));
const Sales = React.lazy(() => import('./pages/Sales'));
const Management = React.lazy(() => import('./pages/Management'));
const PropertyDetailPage = React.lazy(() => import('./pages/PropertyDetailPage'));
const EnglishIndex = React.lazy(() => import('./pages/en/Index'));
const EnglishRentals = React.lazy(() => import('./pages/en/Rentals'));
const EnglishSales = React.lazy(() => import('./pages/en/Sales'));
const EnglishManagement = React.lazy(() => import('./pages/en/Management'));
const EnglishNeighborhoods = React.lazy(() => import('./pages/en/Neighborhoods'));
const EnglishPropertyDetail = React.lazy(() => import('./pages/en/PropertyDetail'));
const EnglishAbout = React.lazy(() => import('./pages/en/About'));
const EnglishContact = React.lazy(() => import('./pages/en/Contact'));
const EnglishNewDevelopments = React.lazy(() => import('./pages/en/NewDevelopments'));
const RothschildNeighborhood = React.lazy(() => import('./pages/en/neighborhoods/Rothschild'));
const NeveTzedekNeighborhood = React.lazy(() => import('./pages/en/neighborhoods/NeveTzedek'));
const FlorentinNeighborhood = React.lazy(() => import('./pages/en/neighborhoods/Florentin'));
const DizengoffNeighborhood = React.lazy(() => import('./pages/en/neighborhoods/Dizengoff'));
const OldNorthNeighborhood = React.lazy(() => import('./pages/en/neighborhoods/OldNorth'));
const HebrewAbout = React.lazy(() => import('./pages/he/About'));
const HebrewContact = React.lazy(() => import('./pages/he/Contact'));
const HebrewNeighborhoods = React.lazy(() => import('./pages/he/Neighborhoods'));
const HebrewNewDevelopments = React.lazy(() => import('./pages/he/NewDevelopments'));
const HebrewRothschild = React.lazy(() => import('./pages/he/neighborhoods/Rothschild'));
const HebrewNeveTzedek = React.lazy(() => import('./pages/he/neighborhoods/NeveTzedek'));
const HebrewFlorentin = React.lazy(() => import('./pages/he/neighborhoods/Florentin'));
const HebrewDizengoff = React.lazy(() => import('./pages/he/neighborhoods/Dizengoff'));
const HebrewOldNorth = React.lazy(() => import('./pages/he/neighborhoods/OldNorth'));
const Properties = React.lazy(() => import('./pages/Properties').then(m => ({ default: m.Properties })));
const AdminControl = React.lazy(() => import('./pages/AdminControl').then(m => ({ default: m.AdminControl })));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const OwnerPortal = React.lazy(() => import('./pages/OwnerPortal').then(m => ({ default: m.OwnerPortal })));
const OwnerFinancials = React.lazy(() => import('./pages/OwnerFinancials').then(m => ({ default: m.OwnerFinancials })));
const Settings = React.lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const OwnerInvitationPage = React.lazy(() => import('./pages/OwnerInvitationPage').then(m => ({ default: m.OwnerInvitationPage })));
const AllFeatures = React.lazy(() => import('./pages/AllFeatures').then(m => ({ default: m.AllFeatures })));
const Login = React.lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const ImportData = React.lazy(() => import('./pages/ImportData'));
const ImportFromStorage = React.lazy(() => import('./pages/ImportFromStorage'));

const PriceOfferView = React.lazy(() => import('./pages/PriceOfferView'));
const PriceOfferLuxuryView = React.lazy(() => import('./pages/PriceOfferLuxuryView'));
const PriceOfferLightView = React.lazy(() => import('./pages/PriceOfferLightView'));
const BenYehudaPitchDeck = React.lazy(() => import('./components/price-offer/ben-yehuda-110/BenYehudaPitchDeck'));
const AdminPriceOffers = React.lazy(() => import('./pages/AdminPriceOffers'));
const PriceOfferBuilder = React.lazy(() => import('./pages/PriceOfferBuilder'));
const ExclusivityFormPage = React.lazy(() => import('./pages/ExclusivityFormPage'));

const BrokerageFormPage = React.lazy(() => import('./pages/BrokerageFormPage'));
const AdminAlerts = React.lazy(() => import('./pages/AdminAlerts'));
const AdminActivity = React.lazy(() => import('./pages/AdminActivity'));
const AdminLeads = React.lazy(() => import('./pages/AdminLeads'));
const AdminCustomers = React.lazy(() => import('./pages/AdminCustomers'));
const AdminDevOps = React.lazy(() => import('./pages/AdminDevOps'));
const MemorandumFormPage = React.lazy(() => import('./pages/MemorandumFormPage'));
const SaleMemorandumFormPage = React.lazy(() => import('./pages/SaleMemorandumFormPage'));
const BrokerSharingFormPage = React.lazy(() => import('./pages/BrokerSharingFormPage'));

const AdminPropertyScout = React.lazy(() => import('./pages/AdminPropertyScout'));
const MarketingHub = React.lazy(() => import('./pages/MarketingHub'));
const ClientIntakePage = React.lazy(() => import('./pages/ClientIntakePage'));
const ClientIntakePageEN = React.lazy(() => import('./pages/ClientIntakePageEN'));
const PresentationExclusivityForm = React.lazy(() => import('./pages/PresentationExclusivityForm'));
const ProfessionalsPublicPage = React.lazy(() => import('./pages/ProfessionalsPublicPage'));
const ProfessionalsPublicPageEN = React.lazy(() => import('./pages/ProfessionalsPublicPageEN'));
const PresentationPricingPage = React.lazy(() => import('./pages/PresentationPricingPage'));
const DynamicPresentationPricingPage = React.lazy(() => import('./pages/DynamicPresentationPricingPage'));
const DynamicPresentationExclusivityForm = React.lazy(() => import('./pages/DynamicPresentationExclusivityForm'));
const PitchDeckBuilder = React.lazy(() => import('./pages/PitchDeckBuilder'));
const DynamicPitchDeckView = React.lazy(() => import('./pages/DynamicPitchDeckView'));
const TestHeroPage = React.lazy(() => import('./pages/TestHeroPage'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const AppContent: React.FC = () => {
  const { isAuthenticated, loading, signOut } = useAuth();

  return (
    <BrowserRouter>
      <ScrollToTop />
      <WhatsAppFloat />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Auth callback route - needs to be outside authentication check */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/login" element={<LoginScreen />} />
          {/* Owner invitation route - accessible without authentication */}
          <Route path="/owner-invitation" element={<OwnerInvitationPage />} />
          
          {/* Brokerage Form Routes - Clean pages without layout */}
          <Route path="/brokerage-form/new" element={<BrokerageFormPage />} />
          <Route path="/brokerage-form/:token" element={<BrokerageFormPage />} />
          
          {/* Memorandum Form Routes - Clean pages without layout */}
          <Route path="/memorandum-form/new" element={<MemorandumFormPage />} />
          <Route path="/memorandum-form/:token" element={<MemorandumFormPage />} />
          
          {/* Sale Memorandum Form Routes - Clean pages without layout */}
          <Route path="/sale-memorandum-form/new" element={<SaleMemorandumFormPage />} />
          <Route path="/sale-memorandum-form/:token" element={<SaleMemorandumFormPage />} />
          
          {/* Exclusivity Form Routes - Clean pages without layout */}
          <Route path="/exclusivity-form/new" element={<ExclusivityFormPage />} />
          <Route path="/exclusivity-form/:token" element={<ExclusivityFormPage />} />
          
          {/* Broker Sharing Form Routes - Clean pages without layout */}
          <Route path="/broker-sharing-form/new" element={<BrokerSharingFormPage />} />
          <Route path="/broker-sharing-form/:token" element={<BrokerSharingFormPage />} />
          
          {/* Client Intake Form - Public form for leads */}
          <Route path="/client-intake" element={<ClientIntakePage />} />
          <Route path="/client-intake/en" element={<ClientIntakePageEN />} />
          
          {/* Professionals Public Page */}
          <Route path="/professionals/shared" element={<ProfessionalsPublicPage />} />
          <Route path="/professionals/shared/en" element={<ProfessionalsPublicPageEN />} />
          
          {/* Price Offer Public Views - Clean pages without layout */}
          <Route path="/price-offer/:token" element={<PriceOfferView />} />
          <Route path="/offer-luxury/:token" element={<PriceOfferLuxuryView />} />
          <Route path="/offer-light/:token" element={<PriceOfferLightView />} />
          <Route path="/offer/ben-yehuda-110" element={<BenYehudaPitchDeck />} />
          <Route path="/offer/ben-yehuda-110/pricing" element={<PresentationPricingPage />} />
          <Route path="/offer/ben-yehuda-110/exclusivity" element={<PresentationExclusivityForm />} />
          {/* Dynamic Pitch Deck Routes */}
          <Route path="/offer/:slug/pricing" element={<DynamicPresentationPricingPage />} />
          <Route path="/offer/:slug/exclusivity" element={<DynamicPresentationExclusivityForm />} />
          <Route path="/offer/:slug" element={<DynamicPitchDeckView />} />
          
          {/* Public pages - Redirects to /he/ */}
          <Route path="/" element={<Navigate to="/he" replace />} />
          <Route path="/rentals" element={<Navigate to="/he/rentals" replace />} />
          <Route path="/sales" element={<Navigate to="/he/sales" replace />} />
          <Route path="/management" element={<Navigate to="/he/management" replace />} />
          <Route path="/about" element={<Navigate to="/he/about" replace />} />
          <Route path="/contact" element={<Navigate to="/he/contact" replace />} />
          <Route path="/neighborhoods" element={<Navigate to="/he/neighborhoods" replace />} />
          <Route path="/neighborhoods/rothschild" element={<Navigate to="/he/neighborhoods/rothschild" replace />} />
          <Route path="/neighborhoods/neve-tzedek" element={<Navigate to="/he/neighborhoods/neve-tzedek" replace />} />
          <Route path="/neighborhoods/florentin" element={<Navigate to="/he/neighborhoods/florentin" replace />} />
          <Route path="/neighborhoods/dizengoff" element={<Navigate to="/he/neighborhoods/dizengoff" replace />} />
          <Route path="/neighborhoods/old-north" element={<Navigate to="/he/neighborhoods/old-north" replace />} />
          <Route path="/new-developments" element={<Navigate to="/he/new-developments" replace />} />
          <Route path="/property/:id" element={<RedirectWithParams to="/he/property/:id" />} />
          
          {/* Hebrew Routes with /he/ prefix */}
          <Route path="/he" element={<Index />} />
          <Route path="/he/rentals" element={<Rentals />} />
          <Route path="/he/sales" element={<Sales />} />
          <Route path="/he/management" element={<Management />} />
          <Route path="/he/about" element={<HebrewAbout />} />
          <Route path="/he/contact" element={<HebrewContact />} />
          <Route path="/he/neighborhoods" element={<HebrewNeighborhoods />} />
          <Route path="/he/neighborhoods/rothschild" element={<HebrewRothschild />} />
          <Route path="/he/neighborhoods/neve-tzedek" element={<HebrewNeveTzedek />} />
          <Route path="/he/neighborhoods/florentin" element={<HebrewFlorentin />} />
          <Route path="/he/neighborhoods/dizengoff" element={<HebrewDizengoff />} />
          <Route path="/he/neighborhoods/old-north" element={<HebrewOldNorth />} />
          <Route path="/he/new-developments" element={<HebrewNewDevelopments />} />
          <Route path="/he/property/:id" element={<PropertyDetailPage />} />
          <Route path="/he/herotest" element={<TestHeroPage />} />
          
          {/* English Public Routes */}
            <Route path="/en" element={<EnglishIndex />} />
            <Route path="/en/rentals" element={<EnglishRentals />} />
            <Route path="/en/sales" element={<EnglishSales />} />
            <Route path="/en/management" element={<EnglishManagement />} />
            <Route path="/en/neighborhoods" element={<EnglishNeighborhoods />} />
            <Route path="/en/neighborhoods/rothschild" element={<RothschildNeighborhood />} />
            <Route path="/en/neighborhoods/neve-tzedek" element={<NeveTzedekNeighborhood />} />
            <Route path="/en/neighborhoods/florentin" element={<FlorentinNeighborhood />} />
            <Route path="/en/neighborhoods/dizengoff" element={<DizengoffNeighborhood />} />
            <Route path="/en/neighborhoods/old-north" element={<OldNorthNeighborhood />} />
            <Route path="/en/property/:id" element={<EnglishPropertyDetail />} />
            <Route path="/en/about" element={<EnglishAbout />} />
            <Route path="/en/contact" element={<EnglishContact />} />
            <Route path="/en/new-developments" element={<EnglishNewDevelopments />} />
          
          {/* Old property routes - redirect to /he/property */}
          <Route path="/rentals/property/:id" element={<RedirectWithParams to="/he/property/:id" />} />
          <Route path="/sales/property/:id" element={<RedirectWithParams to="/he/property/:id" />} />
          <Route path="/management/property/:id" element={<RedirectWithParams to="/he/property/:id" />} />
          
          {loading ? (
            <Route path="*" element={<PageLoader />} />
          ) : !isAuthenticated ? (
            <Route path="*" element={<LoginScreen />} />
          ) : (
            <>
              {/* Redirect /admin to /admin-dashboard */}
              <Route path="/admin" element={<Navigate to="/admin-dashboard" replace />} />
              
              {/* Admin Dashboard - Main */}
              <Route 
                path="/admin-dashboard"
                element={
                  <Layout onLogout={signOut}>
                    <ProtectedRoute requiredRole="viewer">
                      <AdminDashboard />
                    </ProtectedRoute>
                  </Layout>
                } 
              />
              
              {/* Admin Dashboard - Sub Pages */}
              <Route 
                path="/admin-dashboard/properties" 
                element={
                  <Layout onLogout={signOut}>
                    <ProtectedRoute requiredRole="viewer">
                      <Properties />
                    </ProtectedRoute>
                  </Layout>
                } 
              />
              <Route 
                path="/admin-dashboard/customers" 
                element={
                  <Layout onLogout={signOut}>
                    <ProtectedRoute requiredRole="viewer">
                      <AdminCustomers />
                    </ProtectedRoute>
                  </Layout>
                } 
              />
              <Route 
                path="/admin-dashboard/settings" 
                element={
              <Layout onLogout={signOut}>
                    <ProtectedRoute requiredRole="viewer">
                      <Settings />
                    </ProtectedRoute>
                  </Layout>
                } 
              />
              <Route 
                path="/admin-dashboard/admin-control"
                element={
                  <Layout onLogout={signOut}>
                    <ProtectedRoute requiredRole="viewer">
                      <AdminControl />
                    </ProtectedRoute>
                  </Layout>
                } 
              />
              <Route 
                path="/admin-dashboard/import-data"
                element={
                  <Layout onLogout={signOut}>
                    <ProtectedRoute requiredRole="viewer">
                      <ImportData />
                    </ProtectedRoute>
                  </Layout>
                } 
              />
              <Route 
                path="/admin-dashboard/import-from-storage" 
                element={
                  <Layout onLogout={signOut}>
                    <ProtectedRoute requiredRole="viewer">
                      <ImportFromStorage />
                    </ProtectedRoute>
                  </Layout>
                } 
              />
              <Route 
                path="/admin-dashboard/marketing" 
                element={
                  <Layout onLogout={signOut}>
                    <ProtectedRoute requiredRole="viewer">
                      <MarketingHub />
                    </ProtectedRoute>
                  </Layout>
                } 
              />
              <Route 
                path="/admin-dashboard/all-features" 
                element={
                  <Layout onLogout={signOut}>
                    <ProtectedRoute requiredRole="viewer">
                      <AllFeatures />
                    </ProtectedRoute>
                  </Layout>
                } 
              />
              <Route 
                path="/admin-dashboard/price-offers" 
                element={
                  <Layout onLogout={signOut}>
                    <ProtectedRoute requiredRole="viewer">
                      <AdminPriceOffers />
                    </ProtectedRoute>
                  </Layout>
                } 
              />
              <Route 
                path="/admin-dashboard/price-offers/create" 
                element={
                  <Layout onLogout={signOut}>
                    <ProtectedRoute requiredRole="viewer">
                      <PriceOfferBuilder />
                    </ProtectedRoute>
                  </Layout>
                } 
              />
              <Route 
                path="/admin-dashboard/price-offers/edit/:id" 
                element={
                  <Layout onLogout={signOut}>
                    <ProtectedRoute requiredRole="viewer">
                      <PriceOfferBuilder />
                    </ProtectedRoute>
                  </Layout>
                } 
              />
              <Route 
                path="/admin-dashboard/pitch-decks" 
                element={
                  <Layout onLogout={signOut}>
                    <ProtectedRoute requiredRole="viewer">
                      <Navigate to="/admin-dashboard" replace />
                    </ProtectedRoute>
                  </Layout>
                } 
              />
              <Route 
                path="/admin-dashboard/pitch-decks/new" 
                element={
                  <Layout onLogout={signOut}>
                    <ProtectedRoute requiredRole="viewer">
                      <PitchDeckBuilder />
                    </ProtectedRoute>
                  </Layout>
                } 
              />
              <Route 
                path="/admin-dashboard/pitch-decks/:id" 
                element={
                  <Layout onLogout={signOut}>
                    <ProtectedRoute requiredRole="viewer">
                      <PitchDeckBuilder />
                    </ProtectedRoute>
                  </Layout>
                } 
              />
              
              {/* Admin Dashboard - Full Pages */}
              <Route 
                path="/admin/alerts" 
                element={
                  <Layout onLogout={signOut}>
                    <ProtectedRoute requiredRole="viewer">
                      <AdminAlerts />
                    </ProtectedRoute>
                  </Layout>
                } 
              />
              <Route 
                path="/admin/activity" 
                element={
                  <Layout onLogout={signOut}>
                    <ProtectedRoute requiredRole="viewer">
                      <AdminActivity />
                    </ProtectedRoute>
                  </Layout>
                } 
              />
              <Route 
                path="/admin-dashboard/leads" 
                element={
                  <Layout onLogout={signOut}>
                    <ProtectedRoute requiredRole="viewer">
                      <AdminLeads />
                    </ProtectedRoute>
                  </Layout>
                } 
              />
              <Route 
                path="/admin-dashboard/devops" 
                element={
                  <Layout onLogout={signOut}>
                    <ProtectedRoute requiredRole="viewer">
                      <AdminDevOps />
                    </ProtectedRoute>
                  </Layout>
                } 
              />
              <Route 
                path="/admin-dashboard/property-scout" 
                element={
                  <Layout onLogout={signOut}>
                    <ProtectedRoute requiredRole="viewer">
                      <AdminPropertyScout />
                    </ProtectedRoute>
                  </Layout>
                } 
              />
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));

              
              {/* Owner Portal - Separate from Admin */}
              <Route 
                path="/owner-portal"
                element={
                  <ProtectedRoute requireApproval={false}>
                    <OwnerPortal />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/owner-financials" 
                element={
                  <ProtectedRoute requiredRole="property_owner" requireApproval={false}>
                    <OwnerFinancials />
                  </ProtectedRoute>
                } 
              />
              
              <Route path="*" element={
                <Layout onLogout={signOut}>
                  <NotFound />
                </Layout>
              } />
            </>
          )}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

// Component to handle redirects with URL params
const RedirectWithParams = ({ to }: { to: string }) => {
  const params = useParams();
  const resolvedPath = to.replace(':id', params.id || '');
  return <Navigate to={resolvedPath} replace />;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <TooltipProvider>
            <AppContent />
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;