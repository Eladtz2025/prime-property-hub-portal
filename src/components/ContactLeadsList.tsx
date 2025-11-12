import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export const ContactLeadsList = () => {
  const { data: leads, isLoading } = useQuery({
    queryKey: ['contact-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>פניות מהאתר</CardTitle>
        <CardDescription>
          {leads?.length || 0} פניות סה"כ
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!leads || leads.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">אין פניות עדיין</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">תאריך</TableHead>
                  <TableHead className="text-right">שם</TableHead>
                  <TableHead className="text-right">אימייל</TableHead>
                  <TableHead className="text-right">טלפון</TableHead>
                  <TableHead className="text-right">הודעה</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium text-right">
                      {lead.created_at && format(new Date(lead.created_at), 'dd/MM/yy HH:mm', { locale: he })}
                    </TableCell>
                    <TableCell className="text-right">{lead.name}</TableCell>
                    <TableCell className="text-sm text-right">{lead.email}</TableCell>
                    <TableCell className="text-sm text-right">{lead.phone || '-'}</TableCell>
                    <TableCell className="max-w-md truncate text-sm text-right">
                      {lead.message}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
