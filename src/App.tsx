import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginScreen } from './components/LoginScreen';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthCallback } from './components/AuthCallback';
import Index from './pages/Index';
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
import NotFound from './pages/NotFound';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DataProvider } from './components/DataProvider';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";


const AppContent: React.FC = () => {
  const { isAuthenticated, loading, signOut } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth callback route - needs to be outside authentication check */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/login" element={<LoginScreen />} />
        {/* Owner invitation route - accessible without authentication */}
        <Route path="/owner-invitation" element={<OwnerInvitationPage />} />
        
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
            <Route 
              path="/" 
              element={<Index />} 
            />
            <Route 
              path="/properties" 
              element={
                <Layout onLogout={signOut}>
                  <ProtectedRoute>
                    <Properties />
                  </ProtectedRoute>
                </Layout>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <Layout onLogout={signOut}>
                  <Settings />
                </Layout>
              } 
            />
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
            <Route 
              path="/admin-control"
              element={
                <Layout onLogout={signOut}>
                  <ProtectedRoute requiredRole="admin">
                    <AdminControl />
                  </ProtectedRoute>
                </Layout>
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
            <Route 
              path="/import-data"
              element={
                <Layout onLogout={signOut}>
                  <ProtectedRoute requiredRole="admin">
                    <ImportData />
                  </ProtectedRoute>
                </Layout>
              } 
            />
            <Route 
              path="/import-from-storage" 
              element={
                <Layout onLogout={signOut}>
                  <ProtectedRoute requiredRole="admin">
                    <ImportFromStorage />
                  </ProtectedRoute>
                </Layout>
              } 
            />
            <Route 
              path="/owner-portal"
              element={
                <ProtectedRoute requireApproval={false}>
                  <OwnerPortal />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/whatsapp" 
              element={
                <Layout onLogout={signOut}>
                  <ProtectedRoute>
                    <WhatsAppCenter />
                  </ProtectedRoute>
                </Layout>
              } 
            />
            <Route 
              path="/all-features" 
              element={
                <Layout onLogout={signOut}>
                  <ProtectedRoute>
                    <AllFeatures />
                  </ProtectedRoute>
                </Layout>
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