
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Property, PropertyStats, Alert } from './types/property';
import { processPropertyData, calculatePropertyStats } from './utils/dataProcessor';
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<PropertyStats>({
    totalProperties: 0,
    occupiedProperties: 0,
    vacantProperties: 0,
    pendingProperties: 0,
    upcomingRenewals: 0,
    urgentAlerts: 0
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load the JSON data
        const response = await fetch('/כל הנכסים - JSON ל-AI.json');
        const rawData = await response.json();
        
        // Process the data
        const processedProperties = processPropertyData(rawData);
        const calculatedStats = calculatePropertyStats(processedProperties);
        
        // Generate sample alerts for demonstration
        const sampleAlerts: Alert[] = [
          {
            id: 'alert-1',
            propertyId: 'property-1',
            type: 'contract-renewal',
            title: 'חידוש חוזה דחוף',
            message: 'החוזה של נחלת בנימין/בן יהודה מסתיים בעוד שבועיים',
            priority: 'urgent',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
          },
          {
            id: 'alert-2',
            propertyId: 'property-5',
            type: 'contact-needed',
            title: 'יצירת קשר נדרשת',
            message: 'בן יהודה 107 - שחר - לא היה קשר חודש',
            priority: 'high',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
          }
        ];
        
        setProperties(processedProperties);
        setStats(calculatedStats);
        setAlerts(sampleAlerts);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route 
                path="/" 
                element={
                  <Dashboard 
                    properties={properties}
                    stats={stats}
                    alerts={alerts}
                  />
                } 
              />
              <Route path="/properties" element={<div>טבלת נכסים (בפיתוח)</div>} />
              <Route path="/alerts" element={<div>התראות (בפיתוח)</div>} />
              <Route path="/owners" element={<div>בעלי נכסים (בפיתוח)</div>} />
              <Route path="/search" element={<div>חיפוש (בפיתוח)</div>} />
              <Route path="/reports" element={<div>דוחות (בפיתוח)</div>} />
              <Route path="/settings" element={<div>הגדרות (בפיתוח)</div>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
