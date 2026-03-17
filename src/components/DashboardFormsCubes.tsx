import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  FileSignature, FileText, Link2, Check, Star, Users, 
  DollarSign, Presentation, Wallet, Wrench, Plus, List
} from 'lucide-react';
import { toast } from 'sonner';
import { BrokerageFormsMobileList } from '@/components/BrokerageFormsMobileList';
import AdminPriceOffersContent from '@/components/AdminPriceOffersContent';
import LegalFormsList from '@/components/forms/LegalFormsList';
import PitchDecksList from '@/components/pitch-deck/builder/PitchDecksList';
import BusinessExpensesList from '@/components/BusinessExpensesList';
import ProfessionalsList from '@/components/ProfessionalsList';
import { supabase } from '@/integrations/supabase/client';

interface FormCounts {
  brokerage: number;
  memorandum: number;
  exclusivity: number;
  broker_sharing: number;
  price_offers: number;
  pitch_decks: number;
  business_expenses: number;
  professionals: number;
}

type DialogId = 'brokerage' | 'memorandum' | 'exclusivity' | 'broker_sharing' | 'price_offers' | 'pitch_decks' | 'business_expenses' | 'professionals' | null;

const dialogTitles: Record<string, string> = {
  brokerage: 'טפסי תיווך',
  memorandum: 'זיכרון דברים',
  exclusivity: 'הסכמי בלעדיות',
  broker_sharing: 'שיתוף מתווכים',
  price_offers: 'הצעות מחיר',
  pitch_decks: 'מצגות',
  business_expenses: 'הוצאות עסק',
  professionals: 'אנשי מקצוע',
};

export const DashboardFormsCubes = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [copiedPro, setCopiedPro] = useState(false);
  const [activeDialog, setActiveDialog] = useState<DialogId>(null);
  const [counts, setCounts] = useState<FormCounts>({
    brokerage: 0, memorandum: 0, exclusivity: 0, broker_sharing: 0,
    price_offers: 0, pitch_decks: 0, business_expenses: 0, professionals: 0,
  });

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      const { count: brokerageCount } = await supabase.from('brokerage_forms').select('*', { count: 'exact', head: true });
      const { data: legalForms } = await supabase.from('legal_forms').select('form_type');
      const memorandumCount = legalForms?.filter(f => f.form_type === 'memorandum').length || 0;
      const exclusivityCount = legalForms?.filter(f => f.form_type === 'exclusivity').length || 0;
      const brokerSharingCount = legalForms?.filter(f => f.form_type === 'broker_sharing').length || 0;
      const { count: priceOffersCount } = await supabase.from('price_offers').select('*', { count: 'exact', head: true });
      const { count: pitchDecksCount } = await supabase.from('pitch_decks').select('*', { count: 'exact', head: true });
      const { count: expensesCount } = await supabase.from('business_expenses_list').select('*', { count: 'exact', head: true });
      const { count: professionalsCount } = await supabase.from('professionals_list').select('*', { count: 'exact', head: true });
      setCounts({
        brokerage: brokerageCount || 0, memorandum: memorandumCount, exclusivity: exclusivityCount,
        broker_sharing: brokerSharingCount, price_offers: priceOffersCount || 0,
        pitch_decks: pitchDecksCount || 0, business_expenses: expensesCount || 0, professionals: professionalsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching form counts:', error);
    }
  };

  const actionCubes = [
    { id: 'brokerage', label: 'טופס תיווך', icon: FileSignature, newFormUrl: '/brokerage-form/new', dialogId: 'brokerage' as DialogId, count: counts.brokerage },
    { id: 'memorandum', label: 'זיכרון דברים', icon: FileText, newFormUrl: '/memorandum-form/new', dialogId: 'memorandum' as DialogId, count: counts.memorandum },
    { id: 'exclusivity', label: 'בלעדיות', icon: Star, newFormUrl: '/exclusivity-form/new', dialogId: 'exclusivity' as DialogId, count: counts.exclusivity },
    { id: 'broker_sharing', label: 'שיתוף מתווכים', icon: Users, newFormUrl: '/broker-sharing-form/new', dialogId: 'broker_sharing' as DialogId, count: counts.broker_sharing },
    { id: 'price_offer', label: 'הצעת מחיר', icon: DollarSign, newFormUrl: '/price-offer-editor/new', dialogId: 'price_offers' as DialogId, count: counts.price_offers },
    { id: 'pitch_deck', label: 'מצגת', icon: Presentation, newFormUrl: '/admin-dashboard/pitch-decks/new', dialogId: 'pitch_decks' as DialogId, count: counts.pitch_decks },
    { id: 'business_expenses', label: 'הוצאות עסק', icon: Wallet, newFormUrl: null, dialogId: 'business_expenses' as DialogId, count: counts.business_expenses, directDialog: true },
    { id: 'professionals', label: 'אנשי מקצוע', icon: Wrench, newFormUrl: null, dialogId: 'professionals' as DialogId, count: counts.professionals, directDialog: true },
  ];

  const renderDialogContent = () => {
    switch (activeDialog) {
      case 'brokerage': return <BrokerageFormsMobileList />;
      case 'memorandum': return <LegalFormsList formType="memorandum" hideHeader />;
      case 'exclusivity': return <LegalFormsList formType="exclusivity" hideHeader />;
      case 'broker_sharing': return <LegalFormsList formType="broker_sharing" hideHeader />;
      case 'price_offers': return <AdminPriceOffersContent />;
      case 'pitch_decks': return <PitchDecksList />;
      case 'business_expenses': return <BusinessExpensesList />;
      case 'professionals': return <ProfessionalsList />;
      default: return null;
    }
  };

  const copyLink = (url: string, label: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(`${window.location.origin}${url}`);
    setter(true);
    toast.success('הלינק הועתק!', { description: label });
    setTimeout(() => setter(false), 2000);
  };

  const cubeBase = "flex flex-col items-center justify-center p-3 rounded-xl bg-muted text-foreground border border-border shadow-sm hover:bg-accent transition-all duration-200 hover:scale-[1.03] min-h-[80px] gap-1.5 relative cursor-pointer";

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" dir="rtl">
        {/* Client Link */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={cubeBase}>
              {copied ? <Check className="h-6 w-6 text-foreground" /> : <Link2 className="h-6 w-6 text-foreground" />}
              <span className="text-xs font-medium text-foreground text-center">לינק ללקוח</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="center">
            <div className="flex flex-col gap-1.5">
              <button onClick={() => copyLink('/client-intake', 'לינק בעברית', setCopied)} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-right">
                <span className="text-lg">🇮🇱</span><span>עברית</span>
              </button>
              <button onClick={() => copyLink('/client-intake/en', 'English link', setCopied)} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-right">
                <span className="text-lg">🇺🇸</span><span>English</span>
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Professionals Link */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={cubeBase}>
              {copiedPro ? <Check className="h-6 w-6 text-foreground" /> : <Link2 className="h-6 w-6 text-foreground" />}
              <span className="text-xs font-medium text-foreground text-center">לינק אנשי מקצוע</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="center">
            <div className="flex flex-col gap-1.5">
              <button onClick={() => copyLink('/professionals/shared', 'לינק בעברית', setCopiedPro)} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-right">
                <span className="text-lg">🇮🇱</span><span>עברית</span>
              </button>
              <button onClick={() => copyLink('/professionals/shared/en', 'English link', setCopiedPro)} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-right">
                <span className="text-lg">🇺🇸</span><span>English</span>
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Action Cubes */}
        {actionCubes.map((cube) => {
          const Icon = cube.icon;

          if (cube.directDialog) {
            return (
              <button key={cube.id} onClick={() => setActiveDialog(cube.dialogId)} className={cubeBase}>
                <Icon className="h-6 w-6 text-white" />
                <span className="text-xs font-medium text-white text-center">{cube.label}</span>
                {cube.count > 0 && (
                  <Badge className="absolute top-1.5 left-1.5 text-[10px] px-1.5 py-0 min-w-[18px] bg-white/25 text-white border-white/30 hover:bg-white/30">
                    {cube.count}
                  </Badge>
                )}
              </button>
            );
          }

          return (
            <Popover key={cube.id}>
              <PopoverTrigger asChild>
                <button className={cubeBase}>
                  <Icon className="h-6 w-6 text-white" />
                  <span className="text-xs font-medium text-white text-center">{cube.label}</span>
                  {cube.count > 0 && (
                    <Badge className="absolute top-1.5 left-1.5 text-[10px] px-1.5 py-0 min-w-[18px] bg-white/25 text-white border-white/30 hover:bg-white/30">
                      {cube.count}
                    </Badge>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="center">
                <div className="flex flex-col gap-1">
                  {cube.newFormUrl && (
                    <button
                      onClick={() => {
                        if (cube.id === 'pitch_deck') {
                          navigate(cube.newFormUrl!);
                        } else {
                          window.open(cube.newFormUrl!, '_blank');
                        }
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-right"
                    >
                      <Plus className="h-4 w-4" /><span>טופס חדש</span>
                    </button>
                  )}
                  <button
                    onClick={() => setActiveDialog(cube.dialogId)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-right"
                  >
                    <List className="h-4 w-4" /><span>צפייה בנתונים</span>
                    {cube.count > 0 && <Badge variant="secondary" className="mr-auto text-xs">{cube.count}</Badge>}
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          );
        })}
      </div>

      {/* Dialog for data views */}
      <Dialog open={activeDialog !== null} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{activeDialog ? dialogTitles[activeDialog] : ''}</DialogTitle>
          </DialogHeader>
          {renderDialogContent()}
        </DialogContent>
      </Dialog>
    </>
  );
};
