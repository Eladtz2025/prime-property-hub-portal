import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginScreen } from './components/LoginScreen';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthCallback } from './components/AuthCallback';
import Index from './pages/Index';
import Rentals from './pages/Rentals';
import Sales from './pages/Sales';
import Management from './pages/Management';
import PropertyDetailPage from './pages/PropertyDetailPage';
import EnglishIndex from './pages/en/Index';
import EnglishRentals from './pages/en/Rentals';
import EnglishSales from './pages/en/Sales';
import EnglishManagement from './pages/en/Management';
import EnglishNeighborhoods from './pages/en/Neighborhoods';
import EnglishPropertyDetail from './pages/en/PropertyDetail';
import EnglishAbout from './pages/en/About';
import EnglishContact from './pages/en/Contact';
import EnglishNewDevelopments from './pages/en/NewDevelopments';
import RothschildNeighborhood from './pages/en/neighborhoods/Rothschild';
import NeveTzedekNeighborhood from './pages/en/neighborhoods/NeveTzedek';
import FlorentinNeighborhood from './pages/en/neighborhoods/Florentin';
import DizengoffNeighborhood from './pages/en/neighborhoods/Dizengoff';
import OldNorthNeighborhood from './pages/en/neighborhoods/OldNorth';
import HebrewAbout from './pages/he/About';
import HebrewContact from './pages/he/Contact';
import HebrewNeighborhoods from './pages/he/Neighborhoods';
import HebrewNewDevelopments from './pages/he/NewDevelopments';
import HebrewRothschild from './pages/he/neighborhoods/Rothschild';
import HebrewNeveTzedek from './pages/he/neighborhoods/NeveTzedek';
import HebrewFlorentin from './pages/he/neighborhoods/Florentin';
import HebrewDizengoff from './pages/he/neighborhoods/Dizengoff';
import HebrewOldNorth from './pages/he/neighborhoods/OldNorth';
import { Properties } from './pages/Properties';
import { AdminControl } from './pages/AdminControl';
import AdminDashboard from './pages/AdminDashboard';
import { OwnerPortal } from './pages/OwnerPortal';
import { OwnerFinancials } from './pages/OwnerFinancials';
import { Settings } from './pages/Settings';
import { OwnerInvitationPage } from './pages/OwnerInvitationPage';
import { AllFeatures } from './pages/AllFeatures';
import { Login } from './pages/Login';
import ImportData from './pages/ImportData';
import ImportFromStorage from './pages/ImportFromStorage';
import WhatsAppCenter from './pages/WhatsAppCenter';
import PriceOfferView from './pages/PriceOfferView';
import AdminPriceOffers from './pages/AdminPriceOffers';
import PriceOfferBuilder from './pages/PriceOfferBuilder';
import BrokerageFormPage from './pages/BrokerageFormPage';

import NotFound from './pages/NotFound';

import { ErrorBoundary } from './components/ErrorBoundary';
import { DataProvider } from './components/DataProvider';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import Header from './components/Header';
import Footer from './components/Footer';
import { ScrollToTop } from './components/ScrollToTop';


const AppContent: React.FC = () => {
  const { isAuthenticated, loading, signOut } = useAuth();

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Auth callback route - needs to be outside authentication check */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/login" element={<LoginScreen />} />
        {/* Owner invitation route - accessible without authentication */}
        <Route path="/owner-invitation" element={<OwnerInvitationPage />} />
        
        {/* Brokerage Form Routes - Clean pages without layout */}
        <Route path="/brokerage-form/new" element={<BrokerageFormPage />} />
        <Route path="/brokerage-form/:token" element={<BrokerageFormPage />} />
        
        {/* Public pages - accessible to everyone */}
        <Route path="/" element={<Index />} />
        <Route path="/rentals" element={<Rentals />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/management" element={<Management />} />
        <Route path="/about" element={<HebrewAbout />} />
        <Route path="/contact" element={<HebrewContact />} />
        <Route path="/neighborhoods" element={<HebrewNeighborhoods />} />
        <Route path="/neighborhoods/rothschild" element={<HebrewRothschild />} />
        <Route path="/neighborhoods/neve-tzedek" element={<HebrewNeveTzedek />} />
        <Route path="/neighborhoods/florentin" element={<HebrewFlorentin />} />
        <Route path="/neighborhoods/dizengoff" element={<HebrewDizengoff />} />
        <Route path="/neighborhoods/old-north" element={<HebrewOldNorth />} />
        <Route path="/new-developments" element={<HebrewNewDevelopments />} />
        <Route path="/price-offer/:token" element={<PriceOfferView />} />
        
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
        
        <Route path="/property/:id" element={<PropertyDetailPage />} />
        <Route path="/rentals/property/:id" element={<PropertyDetailPage />} />
        <Route path="/sales/property/:id" element={<PropertyDetailPage />} />
        <Route path="/management/property/:id" element={<PropertyDetailPage />} />
        
        {loading ? (
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          } />
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
                  <ProtectedRoute requiredRole="admin">
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
                  <ProtectedRoute requiredRole="admin">
                    <Properties />
                  </ProtectedRoute>
                </Layout>
              } 
            />
            <Route 
              path="/admin-dashboard/settings" 
              element={
                <Layout onLogout={signOut}>
                  <Settings />
                </Layout>
              } 
            />
            <Route 
              path="/admin-dashboard/admin-control"
              element={
                <Layout onLogout={signOut}>
                  <ProtectedRoute requiredRole="admin">
                    <AdminControl />
                  </ProtectedRoute>
                </Layout>
              } 
            />
            <Route 
              path="/admin-dashboard/import-data"
              element={
                <Layout onLogout={signOut}>
                  <ProtectedRoute requiredRole="admin">
                    <ImportData />
                  </ProtectedRoute>
                </Layout>
              } 
            />
            <Route 
              path="/admin-dashboard/import-from-storage" 
              element={
                <Layout onLogout={signOut}>
                  <ProtectedRoute requiredRole="admin">
                    <ImportFromStorage />
                  </ProtectedRoute>
                </Layout>
              } 
            />
            <Route 
              path="/admin-dashboard/whatsapp" 
              element={
                <Layout onLogout={signOut}>
                  <ProtectedRoute requiredRole="admin">
                    <WhatsAppCenter />
                  </ProtectedRoute>
                </Layout>
              } 
            />
            <Route 
              path="/admin-dashboard/all-features" 
              element={
                <Layout onLogout={signOut}>
                  <ProtectedRoute requiredRole="admin">
                    <AllFeatures />
                  </ProtectedRoute>
                </Layout>
              } 
            />
            <Route 
              path="/admin-dashboard/price-offers" 
              element={
                <Layout onLogout={signOut}>
                  <ProtectedRoute requiredRole="admin">
                    <AdminPriceOffers />
                  </ProtectedRoute>
                </Layout>
              } 
            />
            <Route 
              path="/admin-dashboard/price-offers/create" 
              element={
                <Layout onLogout={signOut}>
                  <ProtectedRoute requiredRole="admin">
                    <PriceOfferBuilder />
                  </ProtectedRoute>
                </Layout>
              } 
            />
            <Route 
              path="/admin-dashboard/price-offers/edit/:id" 
              element={
                <Layout onLogout={signOut}>
                  <ProtectedRoute requiredRole="admin">
                    <PriceOfferBuilder />
                  </ProtectedRoute>
                </Layout>
              } 
            />
            
            
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
    </BrowserRouter>
  );
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