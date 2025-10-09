import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { isAuthenticated, profile } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Temporary placeholder - will become real estate agency landing page */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold">
            ברוכים הבאים
          </h1>
          <p className="text-xl text-muted-foreground">
            דף הבית של חברת התיווך
          </p>
          <div className="text-lg text-muted-foreground">
            <p>בקרוב: חטיבות השכרה, מכירה וניהול נכסים</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
