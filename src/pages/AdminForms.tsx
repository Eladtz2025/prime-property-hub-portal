import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  FileSignature, 
  FileText, 
  Link2, 
  Check, 
  Star, 
  Users, 
  DollarSign,
  ChevronDown,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { BrokerageFormsMobileList } from '@/components/BrokerageFormsMobileList';
import AdminPriceOffersContent from '@/components/AdminPriceOffersContent';
import LegalFormsList from '@/components/forms/LegalFormsList';
import { supabase } from '@/integrations/supabase/client';

interface FormCounts {
  brokerage: number;
  memorandum: number;
  exclusivity: number;
  broker_sharing: number;
  price_offers: number;
}

const AdminForms = () => {
  const [copied, setCopied] = useState(false);
  const [counts, setCounts] = useState<FormCounts>({
    brokerage: 0,
    memorandum: 0,
    exclusivity: 0,
    broker_sharing: 0,
    price_offers: 0,
  });
  const [openSections, setOpenSections] = useState({
    brokerage: true,
    memorandum: true,
    exclusivity: true,
    broker_sharing: true,
    price_offers: true,
  });

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      // Fetch brokerage forms count
      const { count: brokerageCount } = await supabase
        .from('brokerage_forms')
        .select('*', { count: 'exact', head: true });

      // Fetch legal forms counts by type
      const { data: legalForms } = await supabase
        .from('legal_forms')
        .select('form_type');

      const memorandumCount = legalForms?.filter(f => f.form_type === 'memorandum').length || 0;
      const exclusivityCount = legalForms?.filter(f => f.form_type === 'exclusivity').length || 0;
      const brokerSharingCount = legalForms?.filter(f => f.form_type === 'broker_sharing').length || 0;

      // Fetch price offers count
      const { count: priceOffersCount } = await supabase
        .from('price_offers')
        .select('*', { count: 'exact', head: true });

      setCounts({
        brokerage: brokerageCount || 0,
        memorandum: memorandumCount,
        exclusivity: exclusivityCount,
        broker_sharing: brokerSharingCount,
        price_offers: priceOffersCount || 0,
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
      id: 'brokerage',
      label: 'טופס תיווך',
      icon: FileSignature,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      onClick: () => window.open('/brokerage-form/new', '_blank'),
    },
    {
      id: 'client-link',
      label: 'לינק ללקוח',
      icon: copied ? Check : Link2,
      color: copied ? 'text-green-600' : 'text-purple-600',
      bgColor: copied ? 'bg-green-50 dark:bg-green-950/30' : 'bg-purple-50 dark:bg-purple-950/30',
      onClick: handleCopyClientIntakeLink,
    },
    {
      id: 'memorandum',
      label: 'זיכרון דברים',
      icon: FileText,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      onClick: () => window.open('/memorandum-form/new', '_blank'),
    },
    {
      id: 'exclusivity',
      label: 'הסכם בלעדיות',
      icon: Star,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
      onClick: () => window.open('/exclusivity-form/new', '_blank'),
    },
    {
      id: 'broker_sharing',
      label: 'שיתוף מתווכים',
      icon: Users,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50 dark:bg-teal-950/30',
      onClick: () => window.open('/broker-sharing-form/new', '_blank'),
    },
    {
      id: 'price_offer',
      label: 'הצעת מחיר',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      onClick: () => window.open('/price-offer-editor/new', '_blank'),
    },
  ];

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="min-h-screen" dir="rtl">
      <div className="p-4 text-right">
        {/* Header */}
        <div className="flex flex-row-reverse items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">טפסים</h1>
        </div>

        {/* Action Cubes Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {actionCubes.map((cube) => {
            const Icon = cube.icon;
            return (
              <button
                key={cube.id}
                onClick={cube.onClick}
                className={`flex flex-col items-center justify-center p-4 rounded-xl 
                  ${cube.bgColor} border border-border hover:border-primary/40 
                  transition-all duration-200 hover:shadow-md hover:scale-[1.02]
                  min-h-[100px] gap-2`}
              >
                <Icon className={`h-7 w-7 ${cube.color}`} />
                <span className="text-sm font-medium text-center">{cube.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {/* Brokerage Forms Section - Full Width */}
          <Collapsible 
            open={openSections.brokerage} 
            onOpenChange={() => toggleSection('brokerage')}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 rounded-t-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <FileSignature className="h-5 w-5 text-blue-600" />
                    <h2 className="font-semibold text-lg">טפסי תיווך</h2>
                    <Badge variant="secondary">{counts.brokerage}</Badge>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${openSections.brokerage ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <BrokerageFormsMobileList />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Row: Memorandum + Exclusivity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Memorandum Section */}
            <Collapsible 
              open={openSections.memorandum} 
              onOpenChange={() => toggleSection('memorandum')}
            >
              <Card>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 rounded-t-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-amber-600" />
                      <h2 className="font-semibold text-lg">זיכרון דברים</h2>
                      <Badge variant="secondary">{counts.memorandum}</Badge>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${openSections.memorandum ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <LegalFormsList formType="memorandum" hideHeader />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Exclusivity Section */}
            <Collapsible 
              open={openSections.exclusivity} 
              onOpenChange={() => toggleSection('exclusivity')}
            >
              <Card>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 rounded-t-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-orange-600" />
                      <h2 className="font-semibold text-lg">הסכמי בלעדיות</h2>
                      <Badge variant="secondary">{counts.exclusivity}</Badge>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${openSections.exclusivity ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <LegalFormsList formType="exclusivity" hideHeader />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>

          {/* Row: Broker Sharing + Price Offers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Broker Sharing Section */}
            <Collapsible 
              open={openSections.broker_sharing} 
              onOpenChange={() => toggleSection('broker_sharing')}
            >
              <Card>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 rounded-t-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-teal-600" />
                      <h2 className="font-semibold text-lg">שיתוף מתווכים</h2>
                      <Badge variant="secondary">{counts.broker_sharing}</Badge>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${openSections.broker_sharing ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <LegalFormsList formType="broker_sharing" hideHeader />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Price Offers Section */}
            <Collapsible 
              open={openSections.price_offers} 
              onOpenChange={() => toggleSection('price_offers')}
            >
              <Card>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 rounded-t-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-emerald-600" />
                      <h2 className="font-semibold text-lg">הצעות מחיר</h2>
                      <Badge variant="secondary">{counts.price_offers}</Badge>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${openSections.price_offers ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <AdminPriceOffersContent />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminForms;
