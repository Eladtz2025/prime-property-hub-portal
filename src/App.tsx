
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from './components/DataProvider';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { LoginScreen } from './components/LoginScreen';
import Index from './pages/Index';
import { Properties } from './pages/Properties';
import { PropertyDetail } from './components/PropertyDetail';
import { Alerts } from './pages/Alerts';
import { Messages } from './pages/Messages';
import { Reports } from './pages/Reports';
import { ContactQueueWrapper } from './pages/ContactQueueWrapper';
import NotFound from "./pages/NotFound";



const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing authentication on app load
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (credentials: { email: string; password: string }) => {
    // Simple demo authentication - accept any credentials
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <DataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </TooltipProvider>
      </DataProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <DataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <LoginScreen onLogin={handleLogin} />
        </TooltipProvider>
      </DataProvider>
    );
  }

  return (
    <ErrorBoundary>
      <DataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Layout onLogout={handleLogout}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/properties" element={<Properties />} />
                <Route path="/properties/:id" element={<PropertyDetail />} />
                <Route path="/contact-queue" element={<ContactQueueWrapper />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </TooltipProvider>
      </DataProvider>
    </ErrorBoundary>
  );
};

export default App;
