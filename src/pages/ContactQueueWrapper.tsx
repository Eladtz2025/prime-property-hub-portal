import React from 'react';
import { ContactQueue } from './ContactQueue';
import { usePropertyData } from '../hooks/usePropertyData';

export const ContactQueueWrapper: React.FC = () => {
  const { properties, updateProperty, isLoading } = usePropertyData();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ContactQueue 
      properties={properties || []} 
      onUpdateProperty={updateProperty} 
    />
  );
};