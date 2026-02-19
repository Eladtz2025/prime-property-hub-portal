import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  FileSignature, 
  FileText, 
  Link2, 
  Check, 
  Star, 
  Users, 
  DollarSign,
  Presentation,
  Wallet,
  Wrench,
  Plus,
  List
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

const AdminForms = () => {
  const [copied, setCopied] = useState(false);
  const [activeDialog, setActiveDialog] = useState<DialogId>(null);
  const [counts, setCounts] = useState<FormCounts>({
    brokerage: 0,
    memorandum: 0,
    exclusivity: 0,
    broker_sharing: 0,
    price_offers: 0,
    pitch_decks: 0,
    business_expenses: 0,
    professionals: 0,
  });

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      const { count: brokerageCount } = await supabase
        .from('brokerage_forms')
        .select('*', { count: 'exact', head: true });

      const { data: legalForms } = await supabase
        .from('legal_forms')
        .select('form_type');

      const memorandumCount = legalForms?.filter(f => f.form_type === 'memorandum').length || 0;
      const exclusivityCount = legalForms?.filter(f => f.form_type === 'exclusivity').length || 0;
      const brokerSharingCount = legalForms?.filter(f => f.form_type === 'broker_sharing').length || 0;

      const { count: priceOffersCount } = await supabase
        .from('price_offers')
        .select('*', { count: 'exact', head: true });

      const { count: pitchDecksCount } = await supabase
        .from('pitch_decks')
        .select('*', { count: 'exact', head: true });

      const { count: expensesCount } = await supabase
        .from('business_expenses_list')
        .select('*', { count: 'exact', head: true });

      const { count: professionalsCount } = await supabase
        .from('professionals_list')
        .select('*', { count: 'exact', head: true });

      setCounts({
        brokerage: brokerageCount || 0,
        memorandum: memorandumCount,
        exclusivity: exclusivityCount,
        broker_sharing: brokerSharingCount,
        price_offers: priceOffersCount || 0,
        pitch_decks: pitchDecksCount || 0,
        business_expenses: expensesCount || 0,
        professionals: professionalsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching form counts:', error);
    }
  };

  const handleCopyClientIntakeLink = () => {
    const link = `${window.location.origin}/client-intake`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('הלינק הועתק!', {
      description: 'עכשיו אפשר לשלוח ללקוח'
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const actionCubes = [
    {
      id: 'brokerage' as const,
      label: 'טופס תיווך',
      icon: FileSignature,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      newFormUrl: '/brokerage-form/new',
      dialogId: 'brokerage' as DialogId,
      count: counts.brokerage,
    },
    {
      id: 'memorandum' as const,
      label: 'זיכרון דברים',
      icon: FileText,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      newFormUrl: '/memorandum-form/new',
      dialogId: 'memorandum' as DialogId,
      count: counts.memorandum,
    },
    {
      id: 'exclusivity' as const,
      label: 'הסכם בלעדיות',
      icon: Star,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
      newFormUrl: '/exclusivity-form/new',
      dialogId: 'exclusivity' as DialogId,
      count: counts.exclusivity,
    },
    {
      id: 'broker_sharing' as const,
      label: 'שיתוף מתווכים',
      icon: Users,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50 dark:bg-teal-950/30',
      newFormUrl: '/broker-sharing-form/new',
      dialogId: 'broker_sharing' as DialogId,
      count: counts.broker_sharing,
    },
    {
      id: 'price_offer' as const,
      label: 'הצעת מחיר',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      newFormUrl: '/price-offer-editor/new',
      dialogId: 'price_offers' as DialogId,
      count: counts.price_offers,
    },
    {
      id: 'pitch_deck' as const,
      label: 'מצגת',
      icon: Presentation,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 dark:bg-pink-950/30',
      newFormUrl: '/admin-dashboard/pitch-decks/new',
      dialogId: 'pitch_decks' as DialogId,
      count: counts.pitch_decks,
    },
    {
      id: 'business_expenses' as const,
      label: 'הוצאות עסק',
      icon: Wallet,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      newFormUrl: null,
      dialogId: 'business_expenses' as DialogId,
      count: counts.business_expenses,
      directDialog: true,
    },
    {
      id: 'professionals' as const,
      label: 'אנשי מקצוע',
      icon: Wrench,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
      newFormUrl: null,
      dialogId: 'professionals' as DialogId,
      count: counts.professionals,
    },
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

  return (
    <div className="min-h-screen" dir="rtl">
      <div className="p-4 text-right">
        <div className="flex flex-row-reverse items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">טפסים</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Client Link - direct action, no popover */}
          <button
            onClick={handleCopyClientIntakeLink}
            className={`flex flex-col items-center justify-center p-4 rounded-xl 
              ${copied ? 'bg-green-50 dark:bg-green-950/30' : 'bg-purple-50 dark:bg-purple-950/30'} 
              border border-border hover:border-primary/40 
              transition-all duration-200 hover:shadow-md hover:scale-[1.02]
              min-h-[100px] gap-2`}
          >
            {copied ? <Check className="h-7 w-7 text-green-600" /> : <Link2 className="h-7 w-7 text-purple-600" />}
            <span className="text-sm font-medium text-center">לינק ללקוח</span>
          </button>

          {/* All other cubes with popover */}
          {actionCubes.map((cube) => {
            const Icon = cube.icon;

            if (cube.directDialog) {
              return (
                <button
                  key={cube.id}
                  onClick={() => setActiveDialog(cube.dialogId)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl 
                    ${cube.bgColor} border border-border hover:border-primary/40 
                    transition-all duration-200 hover:shadow-md hover:scale-[1.02]
                    min-h-[100px] gap-2 relative`}
                >
                  <Icon className={`h-7 w-7 ${cube.color}`} />
                  <span className="text-sm font-medium text-center">{cube.label}</span>
                  {cube.count > 0 && (
                    <Badge variant="secondary" className="absolute top-2 left-2 text-xs px-1.5 py-0.5 min-w-[20px]">
                      {cube.count}
                    </Badge>
                  )}
                </button>
              );
            }

            return (
              <Popover key={cube.id}>
                <PopoverTrigger asChild>
                  <button
                    className={`flex flex-col items-center justify-center p-4 rounded-xl 
                      ${cube.bgColor} border border-border hover:border-primary/40 
                      transition-all duration-200 hover:shadow-md hover:scale-[1.02]
                      min-h-[100px] gap-2 relative`}
                  >
                    <Icon className={`h-7 w-7 ${cube.color}`} />
                    <span className="text-sm font-medium text-center">{cube.label}</span>
                    {cube.count > 0 && (
                      <Badge variant="secondary" className="absolute top-2 left-2 text-xs px-1.5 py-0.5 min-w-[20px]">
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
                            window.location.href = cube.newFormUrl!;
                          } else {
                            window.open(cube.newFormUrl!, '_blank');
                          }
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-right"
                      >
                        <Plus className="h-4 w-4" />
                        <span>טופס חדש</span>
                      </button>
                    )}
                    <button
                      onClick={() => setActiveDialog(cube.dialogId)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-right"
                    >
                      <List className="h-4 w-4" />
                      <span>צפייה בנתונים</span>
                      {cube.count > 0 && (
                        <Badge variant="secondary" className="mr-auto text-xs">{cube.count}</Badge>
                      )}
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}
        </div>
      </div>

      {/* Single dialog for all data views */}
      <Dialog open={activeDialog !== null} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{activeDialog ? dialogTitles[activeDialog] : ''}</DialogTitle>
          </DialogHeader>
          {renderDialogContent()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminForms;
