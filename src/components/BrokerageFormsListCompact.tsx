import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface BrokerageFormsListCompactProps {
  limit?: number;
}

export const BrokerageFormsListCompact: React.FC<BrokerageFormsListCompactProps> = ({ limit = 5 }) => {
  const { data: forms, isLoading } = useQuery({
    queryKey: ['brokerage-forms', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brokerage_forms')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: limit }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!forms || forms.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">אין טפסים עדיין</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {forms.map((form) => (
        <div
          key={form.id}
          className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="font-medium text-sm truncate">{form.client_name}</p>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {format(new Date(form.created_at), 'dd/MM HH:mm', { locale: he })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {form.fee_type_rental && (
                <Badge variant="secondary" className="text-xs">
                  השכרה
                </Badge>
              )}
              {form.fee_type_sale && (
                <Badge variant="secondary" className="text-xs">
                  מכירה
                </Badge>
              )}
              {(form.properties as any[])?.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {(form.properties as any[]).length} נכסים
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
