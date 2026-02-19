import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Phone, MessageCircle, Globe, Tag, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const PROFESSION_EMOJI: Record<string, string> = {
  'שרברב': '🔧',
  'חשמלאי': '⚡',
  'צבעי': '🎨',
  'מנעולן': '🔑',
  'מיזוג אוויר': '❄️',
  'נגר': '🪚',
  'מוביל': '🚚',
  'קבלן שיפוצים': '🏗️',
  'אדריכל': '📐',
  'מעצב פנים': '🛋️',
  'עורך דין': '⚖️',
  'שמאי': '📊',
  'וילונות': '🪟',
  'ניקיון': '🧹',
  'אחר': '👷',
};

interface Professional {
  id: string;
  name: string;
  profession: string;
  phone: string | null;
  area: string | null;
  notes: string | null;
  website: string | null;
  coupon_code: string | null;
}

const ProfessionalsPublicPage = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('professionals_list')
        .select('id, name, profession, phone, area, notes, website, coupon_code')
        .order('profession', { ascending: true });
      setProfessionals((data as Professional[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const copyCoupon = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(id);
    toast.success('קוד הקופון הועתק!');
    setTimeout(() => setCopiedCoupon(null), 2000);
  };

  const callPhone = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const whatsApp = (phone: string) => {
    const clean = phone.replace(/[^0-9]/g, '');
    const formatted = clean.startsWith('0') ? `972${clean.slice(1)}` : clean;
    window.open(`https://wa.me/${formatted}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Group by profession
  const grouped = professionals.reduce((acc, pro) => {
    if (!acc[pro.profession]) acc[pro.profession] = [];
    acc[pro.profession].push(pro);
    return acc;
  }, {} as Record<string, Professional[]>);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" dir="rtl">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">🛠️ אנשי מקצוע מומלצים</h1>
        <p className="text-sm text-muted-foreground mt-1">רשימת אנשי מקצוע אמינים ומוכחים</p>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {Object.entries(grouped).map(([profession, pros]) => {
          const emoji = PROFESSION_EMOJI[profession] || '👷';
          return (
            <div key={profession}>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="text-xl">{emoji}</span>
                {profession}
              </h2>
              <div className="space-y-3">
                {pros.map(pro => (
                  <div
                    key={pro.id}
                    className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm"
                  >
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">{pro.name}</h3>
                      {pro.area && <p className="text-sm text-muted-foreground">📍 {pro.area}</p>}
                      {pro.notes && <p className="text-sm text-muted-foreground mt-1">{pro.notes}</p>}
                    </div>

                    {/* Coupon */}
                    {pro.coupon_code && (
                      <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2.5 border border-amber-200 dark:border-amber-800">
                        <Tag className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-300">קוד הנחה:</span>
                        <span className="font-mono font-bold text-amber-800 dark:text-amber-200">{pro.coupon_code}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 mr-auto"
                          onClick={() => copyCoupon(pro.coupon_code!, pro.id)}
                        >
                          {copiedCoupon === pro.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                      {pro.phone && (
                        <>
                          <Button
                            size="sm"
                            className="flex-1 min-w-[100px] gap-2"
                            onClick={() => callPhone(pro.phone!)}
                          >
                            <Phone className="h-4 w-4" />
                            התקשר
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 min-w-[100px] gap-2 text-green-600 border-green-300 hover:bg-green-50"
                            onClick={() => whatsApp(pro.phone!)}
                          >
                            <MessageCircle className="h-4 w-4" />
                            WhatsApp
                          </Button>
                        </>
                      )}
                      {pro.website && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 min-w-[100px] gap-2"
                          onClick={() => window.open(pro.website!.startsWith('http') ? pro.website! : `https://${pro.website}`, '_blank')}
                        >
                          <Globe className="h-4 w-4" />
                          לאתר
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {professionals.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">אין אנשי מקצוע להצגה כרגע</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-xs text-muted-foreground border-t border-border mt-8">
        Prime Property © {new Date().getFullYear()}
      </div>
    </div>
  );
};

export default ProfessionalsPublicPage;
