import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { MessageSquare } from 'lucide-react';

interface ContactLeadsListCompactProps {
  limit?: number;
}

export const ContactLeadsListCompact: React.FC<ContactLeadsListCompactProps> = ({ limit = 5 }) => {
  const { data: leads, isLoading } = useQuery({
    queryKey: ['contact-leads-website', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_leads')
        .select('*')
        .or('source.eq.website,source.eq.contact_form,source.is.null')
        .neq('source', 'manual')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!leads || leads.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">אין פניות עדיין</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {leads.map((lead) => (
        <div
          key={lead.id}
          className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
        >
          <span className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0 mt-0.5">
            {lead.name?.charAt(0) || '?'}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="font-medium text-sm truncate">{lead.name}</p>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {lead.created_at && format(new Date(lead.created_at), 'dd/MM HH:mm', { locale: he })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {lead.message}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
