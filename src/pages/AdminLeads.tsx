import React from 'react';
import { ContactLeadsList } from '@/components/ContactLeadsList';
import { LeadsMobileList } from '@/components/LeadsMobileList';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMobileDetection } from '@/hooks/useMobileDetection';

export const AdminLeads = () => {
  const { toast } = useToast();
  const { isMobile } = useMobileDetection();

  const { data: leads } = useQuery({
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

  const handleExportToExcel = () => {
    if (!leads || leads.length === 0) {
      toast({
        title: "אין נתונים לייצוא",
        description: "אין פניות זמינות לייצוא",
        variant: "destructive"
      });
      return;
    }

    // Create CSV content
    const headers = ['תאריך', 'שם', 'אימייל', 'טלפון', 'הודעה'];
    const csvContent = [
      headers.join(','),
      ...leads.map(lead => [
        new Date(lead.created_at).toLocaleDateString('he-IL'),
        lead.name,
        lead.email,
        lead.phone || '',
        `"${lead.message?.replace(/"/g, '""') || ''}"`
      ].join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `פניות_מהאתר_${new Date().toLocaleDateString('he-IL')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "הקובץ יוצא בהצלחה",
      description: `${leads.length} פניות יוצאו לאקסל`
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">פניות מהאתר</h1>
          <p className="text-muted-foreground mt-1">
            {leads?.length || 0} פניות סה"כ
          </p>
        </div>
        <Button onClick={handleExportToExcel} className="gap-2">
          <Download className="h-4 w-4" />
          ייצוא לאקסל
        </Button>
      </div>

      {isMobile ? <LeadsMobileList /> : <ContactLeadsList />}
    </div>
  );
};

export default AdminLeads;
