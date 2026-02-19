import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Phone, MessageCircle, Globe, Tag, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(38,60%,45%)]"></div>
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
      <div className="bg-[hsl(220,15%,8%)] text-white border-b border-[hsl(38,60%,45%)]/30">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-end pt-4 pb-2">
            <button
              onClick={() => navigate('/professionals/shared')}
              className="text-xs text-white/50 hover:text-white/80 transition-colors hover:underline underline-offset-4"
            >
              🇮🇱 עברית
            </button>
          </div>
          <div className="pb-8 text-center">
            <h1 className="font-[Playfair_Display] italic font-light text-3xl md:text-4xl tracking-tight">Recommended Professionals</h1>
            <p className="text-xs text-white/40 mt-2 tracking-[0.2em] uppercase">Trusted & verified professionals</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">
        {Object.entries(grouped).map(([profession, pros]) => {
          const enName = PROFESSION_EN[profession] || profession;
          return (
            <div key={profession}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-[1px] bg-[hsl(38,60%,45%)]" />
                <h2 className="text-lg font-light tracking-wide text-foreground">{enName}</h2>
                <span className="text-xs text-muted-foreground/50 font-light">{pros.length}</span>
              </div>
              <div className="space-y-3">
                {pros.map(pro => (
                  <div
                    key={pro.id}
                    className="rounded-xl border border-border/20 bg-white p-5 md:p-6 space-y-3 hover:border-border/40 transition-colors"
                  >
                    <div>
                      <h3 className="font-[Playfair_Display] text-lg text-foreground" dir="rtl">{pro.name}</h3>
                      {pro.area && (
                        <span className="text-xs text-muted-foreground/60 font-light" dir="rtl">{pro.area}</span>
                      )}
                      {pro.notes && <p className="text-sm text-muted-foreground/70 mt-1.5 leading-relaxed font-light" dir="rtl">{pro.notes}</p>}
                    </div>

                    {pro.coupon_code && (
                      <div className="flex items-center gap-2 rounded-lg p-3 border border-[hsl(38,60%,45%)]/30">
                        <Tag className="h-3.5 w-3.5 text-[hsl(38,60%,45%)] shrink-0" />
                        <span className="text-xs font-light text-[hsl(38,60%,35%)]">Discount code:</span>
                        <span className="font-mono font-medium text-sm text-[hsl(38,60%,30%)] tracking-wider">{pro.coupon_code}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 ml-auto rounded-full hover:bg-[hsl(38,60%,45%)]/10"
                          onClick={() => copyCoupon(pro.coupon_code!, pro.id)}
                        >
                          {copiedCoupon === pro.id ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-[hsl(38,60%,45%)]" />}
                        </Button>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {pro.phone && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 min-w-[100px] gap-2 rounded-full border-foreground/15 text-foreground bg-transparent hover:bg-foreground/5"
                            onClick={() => callPhone(pro.phone!)}
                          >
                            <Phone className="h-4 w-4" />
                            Call
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 min-w-[100px] gap-2 rounded-full border-foreground/15 text-foreground bg-transparent hover:bg-foreground/5"
                            onClick={() => whatsApp(pro.phone!, pro.name)}
                          >
                            <MessageCircle className="h-4 w-4" />
                            WhatsApp
                          </Button>
                        </>
                      )}
                      {pro.website && (
                        <button
                          className="flex-1 min-w-[100px] text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors flex items-center justify-center gap-1.5 py-2"
                          onClick={() => window.open(pro.website!.startsWith('http') ? pro.website! : `https://${pro.website}`, '_blank')}
                        >
                          <Globe className="h-3.5 w-3.5" />
                          Website
                        </button>
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
            <p className="text-lg font-light">No professionals to display at the moment</p>
          </div>
        )}
      </div>

      <div className="h-[1px] bg-[hsl(38,60%,45%)]/20 max-w-2xl mx-auto" />
      <div className="text-center py-6 text-xs text-muted-foreground/50 tracking-[0.3em]">
        CITY MARKET © {new Date().getFullYear()}
      </div>
    </div>
  );
};

export default ProfessionalsPublicPageEN;
