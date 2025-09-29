import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginScreen } from './components/LoginScreen';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthCallback } from './components/AuthCallback';
import Index from './pages/Index';
import { Properties } from './pages/Properties';
import { Alerts } from './pages/Alerts';
import { Messages } from './pages/Messages';
import { Reports } from './pages/Reports';
import { ContactQueueWrapper } from './pages/ContactQueueWrapper';
import { UserManagement } from './pages/UserManagement';
import { PropertyInvitations } from './pages/PropertyInvitations';
import { AdminControl } from './pages/AdminControl';
import { OwnerPortal } from './pages/OwnerPortal';
import { OwnerFinancials } from './pages/OwnerFinancials';
import { DataMigration } from './pages/DataMigration';
import { OwnerInvitationPage } from './pages/OwnerInvitationPage';
import { AllFeatures } from './pages/AllFeatures';
import { WhatsAppCenter } from './pages/WhatsAppCenter';
import { Login } from './pages/Login';
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
              element={
                <Layout onLogout={signOut}>
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                </Layout>
              } 
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
              path="/contact-queue" 
              element={
                <Layout onLogout={signOut}>
                  <ProtectedRoute>
                    <ContactQueueWrapper />
                  </ProtectedRoute>
                </Layout>
              } 
            />
            <Route 
              path="/alerts" 
              element={
                <Layout onLogout={signOut}>
                  <ProtectedRoute>
                    <Alerts />
                  </ProtectedRoute>
                </Layout>
              } 
            />
            <Route 
              path="/messages" 
              element={
                <Layout onLogout={signOut}>
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                </Layout>
              } 
            />
            <Route 
              path="/reports" 
              element={
                <Layout onLogout={signOut}>
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                </Layout>
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
              path="/users" 
              element={
                <Layout onLogout={signOut}>
                  <ProtectedRoute requiredRole="admin">
                    <UserManagement />
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
              path="/data-migration" 
              element={
                <Layout onLogout={signOut}>
                  <ProtectedRoute requiredRole="admin">
                    <DataMigration />
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
              path="/property-invitations" 
              element={
                <Layout onLogout={signOut}>
                  <ProtectedRoute requiredRole="admin">
                    <PropertyInvitations />
                  </ProtectedRoute>
                </Layout>
              } 
            />
            <Route 
              path="/owner-portal" 
              element={
                <ProtectedRoute requiredRole="property_owner" requireApproval={false}>
                  <OwnerPortal />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/owner-invitation" 
              element={<OwnerInvitationPage />} 
            />
            <Route 
              path="/login" 
              element={<Login />} 
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