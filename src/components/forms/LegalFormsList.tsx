import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Plus, ExternalLink, Loader2, Calendar, User, Building, Users } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { generateMemorandumPDF } from '@/lib/memorandum-pdf-generator';
import { generateExclusivityPDF } from '@/lib/exclusivity-pdf-generator';
import { generateBrokerSharingPDF } from '@/lib/broker-sharing-pdf-generator';
import { BUSINESS_INFO } from '@/constants/business';
import { toast } from 'sonner';

interface LegalForm {
  id: string;
  form_type: string;
  language: string;
  status: string;
  created_at: string;
  signed_at: string | null;
  client_name: string | null;
  property_address: string | null;
  form_data: unknown;
}

const formTypeLabels: Record<string, string> = {
  memorandum: 'זיכרון דברים',
  exclusivity: 'הסכם בלעדיות',
  broker_sharing: 'שיתוף מתווכים',
  standard_lease: 'חוזה סטנדרטי',
  short_term: 'חוזה קצר מועד',
  lease_addendum: 'נספח שכירות',
};

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'טיוטה', variant: 'secondary' },
  pending: { label: 'ממתין לחתימה', variant: 'outline' },
  signed: { label: 'נחתם', variant: 'default' },
};

export const LegalFormsList = () => {
  const [forms, setForms] = useState<LegalForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchForms();
  }, [filterType]);

  const fetchForms = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('legal_forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterType !== 'all') {
        query = query.eq('form_type', filterType);
      }

      const { data, error } = await query;
      if (error) throw error;
      setForms(data || []);
    } catch (error) {
      console.error('Error fetching legal forms:', error);
      toast.error('שגיאה בטעינת הטפסים');
    } finally {
      setLoading(false);
    }
  };

  const handleNewForm = (formType: string) => {
    const routes: Record<string, string> = {
      memorandum: '/memorandum-form/new',
      exclusivity: '/exclusivity-form/new',
      broker_sharing: '/broker-sharing-form/new',
    };
    window.open(routes[formType] || '/memorandum-form/new', '_blank');
  };

  const handleDownloadPDF = async (form: LegalForm) => {
    setDownloadingId(form.id);
    try {
      const rawData = (form.form_data || {}) as Record<string, unknown>;
      
      if (form.form_type === 'memorandum') {
        const formData = {
          client_name: String(rawData.client_name || form.client_name || ''),
          client_id_number: String(rawData.client_id_number || ''),
          client_phone: String(rawData.client_phone || ''),
          property_address: String(rawData.property_address || form.property_address || ''),
          property_city: String(rawData.property_city || ''),
          rental_price: String(rawData.rental_price || ''),
          form_date: String(rawData.form_date || form.created_at || ''),
          client_signature: String(rawData.client_signature || ''),
          agent_signature: String(rawData.agent_signature || ''),
          language: (form.language || 'he') as 'he' | 'en',
        };
        await generateMemorandumPDF(formData);
        toast.success('ה-PDF הורד בהצלחה');
      } else if (form.form_type === 'exclusivity') {
        const formData = {
          seller_name: String(form.client_name || ''),
          seller_id_number: String(rawData.seller_id_number || ''),
          seller_address: String(rawData.seller_address || ''),
          seller_phone: String(rawData.seller_phone || ''),
          seller_email: String(rawData.seller_email || ''),
          property_address: String(form.property_address || ''),
          property_city: String(rawData.property_city || ''),
          property_floor: String(rawData.property_floor || ''),
          property_rooms: String(rawData.property_rooms || ''),
          property_size: String(rawData.property_size || ''),
          property_gush_helka: String(rawData.property_gush_helka || ''),
          exclusivity_period: String(rawData.exclusivity_period || ''),
          start_date: String(rawData.start_date || ''),
          end_date: String(rawData.end_date || ''),
          asking_price: String(rawData.asking_price || ''),
          commission_percentage: String(rawData.commission_percentage || ''),
          commission_includes_vat: Boolean(rawData.commission_includes_vat),
          form_date: String(rawData.form_date || form.created_at || ''),
          seller_signature: String(rawData.seller_signature || ''),
          agent_signature: String(rawData.agent_signature || ''),
          language: (form.language || 'he') as 'he' | 'en',
        };
        await generateExclusivityPDF(formData);
        toast.success('ה-PDF הורד בהצלחה');
      } else if (form.form_type === 'broker_sharing') {
        const formData = {
          primary_broker_name: form.language === 'he' ? BUSINESS_INFO.brokerName : BUSINESS_INFO.brokerNameEn,
          primary_broker_license: BUSINESS_INFO.license,
          primary_broker_phone: BUSINESS_INFO.phone,
          primary_broker_company: BUSINESS_INFO.name,
          secondary_broker_name: String(form.client_name || rawData.secondary_broker_name || ''),
          secondary_broker_license: String(rawData.secondary_broker_license || ''),
          secondary_broker_phone: String(rawData.secondary_broker_phone || ''),
          secondary_broker_email: String(rawData.secondary_broker_email || ''),
          secondary_broker_company: String(rawData.secondary_broker_company || ''),
          property_address: String(form.property_address || ''),
          property_city: String(rawData.property_city || ''),
          transaction_type: (rawData.transaction_type as 'sale' | 'rental') || 'sale',
          primary_broker_share: String(rawData.primary_broker_share || '50'),
          secondary_broker_share: String(rawData.secondary_broker_share || '50'),
          form_date: String(rawData.form_date || form.created_at || ''),
          primary_broker_signature: String(rawData.primary_broker_signature || ''),
          secondary_broker_signature: String(rawData.secondary_broker_signature || ''),
          language: (form.language || 'he') as 'he' | 'en',
        };
        const pdf = await generateBrokerSharingPDF(formData);
        const fileName = `broker-sharing-${form.client_name?.replace(/\s+/g, '-') || 'form'}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        pdf.save(fileName);
        toast.success('ה-PDF הורד בהצלחה');
      } else {
        toast.error('סוג טופס לא נתמך עדיין');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('שגיאה ביצירת ה-PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filters and new form button */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="סנן לפי סוג" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הטפסים</SelectItem>
            <SelectItem value="memorandum">זיכרון דברים</SelectItem>
            <SelectItem value="exclusivity">הסכם בלעדיות</SelectItem>
            <SelectItem value="broker_sharing">שיתוף מתווכים</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={handleNewForm}>
          <SelectTrigger className="w-full sm:w-48">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>טופס חדש</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="memorandum">זיכרון דברים</SelectItem>
            <SelectItem value="exclusivity">הסכם בלעדיות</SelectItem>
            <SelectItem value="broker_sharing">שיתוף מתווכים</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Forms list */}
      {forms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">אין טפסים משפטיים</h3>
            <p className="text-muted-foreground mb-4">צור טופס חדש כדי להתחיל</p>
            <Button onClick={() => handleNewForm('memorandum')} className="gap-2">
              <Plus className="h-4 w-4" />
              צור זיכרון דברים
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {forms.map((form) => (
            <Card key={form.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3 justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={statusLabels[form.status]?.variant || 'secondary'}>
                        {statusLabels[form.status]?.label || form.status}
                      </Badge>
                      <Badge variant="outline">
                        {formTypeLabels[form.form_type] || form.form_type}
                      </Badge>
                      {form.language === 'en' && (
                        <Badge variant="outline">EN</Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {form.client_name && (
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5" />
                          <span>{form.client_name}</span>
                        </div>
                      )}
                      {form.property_address && (
                        <div className="flex items-center gap-2">
                          <Building className="h-3.5 w-3.5" />
                          <span>{form.property_address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {format(new Date(form.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 sm:flex-col">
                    {form.status === 'signed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPDF(form)}
                        disabled={downloadingId === form.id}
                        className="gap-1.5"
                      >
                        {downloadingId === form.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        PDF
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/memorandum-form/${form.id}`, '_blank')}
                      className="gap-1.5"
                    >
                      <ExternalLink className="h-4 w-4" />
                      פתח
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LegalFormsList;
