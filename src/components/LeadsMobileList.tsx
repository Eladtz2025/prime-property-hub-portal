import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeadCard } from './LeadCard';
import { LeadDetailSheet } from './LeadDetailSheet';
import { Skeleton } from '@/components/ui/skeleton';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  created_at: string;
}

export const LeadsMobileList: React.FC = () => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: leads, isLoading } = useQuery({
    queryKey: ['contact-leads-mobile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_leads')
        .select('id, name, email, phone, message, created_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Lead[];
    }
  });

  const handleCardClick = (lead: Lead) => {
    setSelectedLead(lead);
    setSheetOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!leads || leads.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        אין פניות עדיין
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {leads.map((lead) => (
          <LeadCard 
            key={lead.id} 
            lead={lead} 
            onClick={() => handleCardClick(lead)} 
          />
        ))}
      </div>

      <LeadDetailSheet 
        lead={selectedLead}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
};
