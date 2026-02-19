import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Phone, MessageCircle, Globe, Tag, Copy, Check, MapPin } from 'lucide-react';
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

const PROFESSION_EN: Record<string, string> = {
  'שרברב': 'Plumber',
  'חשמלאי': 'Electrician',
  'צבעי': 'Painter',
  'מנעולן': 'Locksmith',
  'מיזוג אוויר': 'HVAC',
  'נגר': 'Carpenter',
  'מוביל': 'Mover',
  'קבלן שיפוצים': 'Renovation Contractor',
  'אדריכל': 'Architect',
  'מעצב פנים': 'Interior Designer',
  'עורך דין': 'Lawyer',
  'שמאי': 'Appraiser',
  'וילונות': 'Curtains',
  'ניקיון': 'Cleaning',
  'אחר': 'Other',
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

const ProfessionalsPublicPageEN = () => {
  const navigate = useNavigate();
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
    toast.success('Coupon code copied!');
    setTimeout(() => setCopiedCoupon(null), 2000);
  };

  const callPhone = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const whatsApp = (phone: string, name: string) => {
    const clean = phone.replace(/[^0-9]/g, '');
    const formatted = clean.startsWith('0') ? `972${clean.slice(1)}` : clean;
    const message = encodeURIComponent(`Hi ${name}, we got your number from City Market Real Estate.\nHow are you?`);
    window.open(`https://wa.me/${formatted}?text=${message}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const grouped = professionals.reduce((acc, pro) => {
    if (!acc[pro.profession]) acc[pro.profession] = [];
    acc[pro.profession].push(pro);
    return acc;
  }, {} as Record<string, Professional[]>);

  return (
    <div className="min-h-screen bg-[hsl(220,20%,97%)]" dir="ltr">
      {/* Header */}
      <div className="bg-gradient-to-br from-[hsl(220,25%,18%)] to-[hsl(220,30%,28%)] text-white">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-end pt-3 pb-2">
            <button
              onClick={() => navigate('/professionals/shared')}
              className="px-3 py-1.5 text-xs rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all flex items-center gap-1.5 text-white/90 hover:text-white border border-white/20"
            >
              <span>🇮🇱</span> עברית
            </button>
          </div>
          <div className="pb-6 text-center">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Recommended Professionals</h1>
            <p className="text-sm text-white/70 mt-1.5">Trusted and verified professionals</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {Object.entries(grouped).map(([profession, pros]) => {
          const emoji = PROFESSION_EMOJI[profession] || '👷';
          const enName = PROFESSION_EN[profession] || profession;
          return (
            <div key={profession}>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-9 h-9 rounded-lg bg-[hsl(220,25%,18%)]/10 flex items-center justify-center text-lg">{emoji}</span>
                <h2 className="text-base font-bold text-[hsl(220,25%,18%)] tracking-tight">{enName}</h2>
                <span className="text-xs text-muted-foreground font-medium bg-muted rounded-full px-2.5 py-0.5">{pros.length}</span>
              </div>
              <div className="space-y-3">
                {pros.map(pro => (
                  <div
                    key={pro.id}
                    className="rounded-2xl border border-border/60 bg-card p-4 md:p-5 space-y-3 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div>
                      <h3 className="font-semibold text-foreground text-[1.05rem]" dir="rtl">{pro.name}</h3>
                      {pro.area && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground" dir="rtl">{pro.area}</span>
                        </div>
                      )}
                      {pro.notes && <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed" dir="rtl">{pro.notes}</p>}
                    </div>

                    {pro.coupon_code && (
                      <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 border border-amber-200/60 dark:border-amber-800/40">
                        <Tag className="h-4 w-4 text-amber-600 shrink-0" />
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Discount code:</span>
                        <span className="font-mono font-bold text-amber-800 dark:text-amber-200 tracking-wider">{pro.coupon_code}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 ml-auto rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/30"
                          onClick={() => copyCoupon(pro.coupon_code!, pro.id)}
                        >
                          {copiedCoupon === pro.id ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-amber-600" />}
                        </Button>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {pro.phone && (
                        <>
                          <Button
                            size="sm"
                            className="flex-1 min-w-[100px] gap-2 rounded-full bg-[hsl(220,25%,18%)] hover:bg-[hsl(220,25%,25%)] text-white shadow-sm"
                            onClick={() => callPhone(pro.phone!)}
                          >
                            <Phone className="h-4 w-4" />
                            Call
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 min-w-[100px] gap-2 rounded-full text-[hsl(142,60%,30%)] border-[hsl(142,40%,70%)] hover:bg-[hsl(142,50%,95%)] shadow-sm"
                            onClick={() => whatsApp(pro.phone!, pro.name)}
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
                          className="flex-1 min-w-[100px] gap-2 rounded-full shadow-sm"
                          onClick={() => window.open(pro.website!.startsWith('http') ? pro.website! : `https://${pro.website}`, '_blank')}
                        >
                          <Globe className="h-4 w-4" />
                          Website
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
            <p className="text-lg">No professionals to display at the moment</p>
          </div>
        )}
      </div>

      <div className="text-center py-6 text-xs text-muted-foreground border-t border-border mt-4">
        Prime Property © {new Date().getFullYear()}
      </div>
    </div>
  );
};

export default ProfessionalsPublicPageEN;
