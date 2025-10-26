import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Eye, Save, Share2, Loader2, Copy } from 'lucide-react';
import BlockSelector from '@/components/price-offer/builder/BlockSelector';
import BlockList from '@/components/price-offer/builder/BlockList';

interface PriceOfferData {
  id?: string;
  property_title: string;
  property_details: string;
  suggested_price_min: number | null;
  suggested_price_max: number | null;
  price_per_sqm_min: number | null;
  price_per_sqm_max: number | null;
  expected_income_min: number | null;
  expected_income_max: number | null;
  language: 'he' | 'en';
  is_active: boolean;
}

interface Block {
  id: string;
  block_type: string;
  block_order: number;
  block_data: any;
}

const PriceOfferBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [offerData, setOfferData] = useState<PriceOfferData>({
    property_title: '',
    property_details: '',
    suggested_price_min: null,
    suggested_price_max: null,
    price_per_sqm_min: null,
    price_per_sqm_max: null,
    expected_income_min: null,
    expected_income_max: null,
    language: 'he',
    is_active: false,
  });
  
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [offerId, setOfferId] = useState<string | null>(id || null);

  useEffect(() => {
    if (id) {
      loadOffer();
    }
  }, [id]);

  const loadOffer = async () => {
    setLoading(true);
    try {
      const { data: offer, error: offerError } = await supabase
        .from('price_offers')
        .select('*')
        .eq('id', id)
        .single();

      if (offerError) throw offerError;

      setOfferData({
        property_title: offer.property_title,
        property_details: offer.property_details,
        suggested_price_min: offer.suggested_price_min,
        suggested_price_max: offer.suggested_price_max,
        price_per_sqm_min: offer.price_per_sqm_min,
        price_per_sqm_max: offer.price_per_sqm_max,
        expected_income_min: offer.expected_income_min,
        expected_income_max: offer.expected_income_max,
        language: offer.language as 'he' | 'en',
        is_active: offer.is_active,
      });
      setOfferId(offer.id);

      const { data: blocksData, error: blocksError } = await supabase
        .from('price_offer_blocks')
        .select('*')
        .eq('offer_id', id)
        .order('block_order', { ascending: true });

      if (blocksError) throw blocksError;
      setBlocks(blocksData || []);
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveOffer = async (activate = false) => {
    setSaving(true);
    try {
      const dataToSave = { ...offerData, is_active: activate };
      
      if (offerId) {
        const { error } = await supabase
          .from('price_offers')
          .update(dataToSave)
          .eq('id', offerId);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('price_offers')
          .insert([{ ...dataToSave, created_by: (await supabase.auth.getUser()).data.user?.id }])
          .select()
          .single();
        
        if (error) throw error;
        setOfferId(data.id);
        navigate(`/admin-dashboard/price-offers/edit/${data.id}`, { replace: true });
      }

      toast({
        title: activate ? 'הצעה פורסמה!' : 'הצעה נשמרה',
        description: activate ? 'ההצעה פעילה ונגישה ללקוחות' : 'טיוטה נשמרה בהצלחה',
      });
    } catch (error: any) {
      toast({
        title: 'שגיאה בשמירה',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!offerId) {
      toast({
        title: 'שמור קודם',
        description: 'יש לשמור את ההצעה לפני התצוגה המקדימה',
        variant: 'destructive',
      });
      return;
    }
    
    const { data } = await supabase
      .from('price_offers')
      .select('token')
      .eq('id', offerId)
      .single();
    
    if (data?.token) {
      window.open(`/price-offer/${data.token}`, '_blank');
    }
  };

  const handleShare = async () => {
    if (!offerId) {
      toast({
        title: 'שמור קודם',
        description: 'יש לשמור ולפרסם את ההצעה לפני השיתוף',
        variant: 'destructive',
      });
      return;
    }

    const { data } = await supabase
      .from('price_offers')
      .select('token, property_title')
      .eq('id', offerId)
      .single();

    if (data?.token) {
      const url = `${window.location.origin}/price-offer/${data.token}`;
      const message = `שלום! הנה הצעת המחיר עבור ${data.property_title}:\n${url}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleCopyLink = async () => {
    if (!offerId) {
      toast({
        title: 'שמור קודם',
        description: 'יש לשמור את ההצעה לפני העתקת הלינק',
        variant: 'destructive',
      });
      return;
    }

    const { data } = await supabase
      .from('price_offers')
      .select('token')
      .eq('id', offerId)
      .single();

    if (data?.token) {
      const url = `${window.location.origin}/price-offer/${data.token}`;
      navigator.clipboard.writeText(url);
      toast({
        title: 'הלינק הועתק!',
        description: 'הלינק הועתק ללוח',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {id ? 'עריכת הצעת מחיר' : 'הצעת מחיר חדשה'}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 ml-2" />
            תצוגה מקדימה
          </Button>
          <Button variant="outline" onClick={handleCopyLink}>
            <Copy className="h-4 w-4 ml-2" />
            העתק לינק
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 ml-2" />
            שתף ב-WhatsApp
          </Button>
          <Button variant="secondary" onClick={() => saveOffer(false)} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
            <Save className="h-4 w-4 ml-2" />
            שמור טיוטה
          </Button>
          <Button onClick={() => saveOffer(true)} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
            פרסם
          </Button>
        </div>
      </div>

      {/* פרטים בסיסיים */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>פרטים בסיסיים</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">כותרת נכס</Label>
            <Input
              id="title"
              value={offerData.property_title}
              onChange={(e) => setOfferData({ ...offerData, property_title: e.target.value })}
              placeholder="פנקס 67, תל אביב יפו"
            />
          </div>

          <div>
            <Label htmlFor="details">פרטים טכניים</Label>
            <Textarea
              id="details"
              value={offerData.property_details}
              onChange={(e) => setOfferData({ ...offerData, property_details: e.target.value })}
              placeholder="קומה 2 | כיכר 2 | מגרש 902..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price-min">מחיר מוצע (מינימום)</Label>
              <Input
                id="price-min"
                type="number"
                value={offerData.suggested_price_min || ''}
                onChange={(e) => setOfferData({ ...offerData, suggested_price_min: e.target.value ? Number(e.target.value) : null })}
                placeholder="5,100,000"
              />
            </div>
            <div>
              <Label htmlFor="price-max">מחיר מוצע (מקסימום)</Label>
              <Input
                id="price-max"
                type="number"
                value={offerData.suggested_price_max || ''}
                onChange={(e) => setOfferData({ ...offerData, suggested_price_max: e.target.value ? Number(e.target.value) : null })}
                placeholder="5,350,000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="income-min">הכנסה צפויה (מינימום)</Label>
              <Input
                id="income-min"
                type="number"
                value={offerData.expected_income_min || ''}
                onChange={(e) => setOfferData({ ...offerData, expected_income_min: e.target.value ? Number(e.target.value) : null })}
                placeholder="25,000"
              />
            </div>
            <div>
              <Label htmlFor="income-max">הכנסה צפויה (מקסימום)</Label>
              <Input
                id="income-max"
                type="number"
                value={offerData.expected_income_max || ''}
                onChange={(e) => setOfferData({ ...offerData, expected_income_max: e.target.value ? Number(e.target.value) : null })}
                placeholder="28,000"
              />
            </div>
          </div>

          <div>
            <Label>שפה</Label>
            <RadioGroup
              value={offerData.language}
              onValueChange={(value) => setOfferData({ ...offerData, language: value as 'he' | 'en' })}
              className="flex gap-4 mt-2"
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="he" id="lang-he" />
                <Label htmlFor="lang-he" className="cursor-pointer">עברית</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="en" id="lang-en" />
                <Label htmlFor="lang-en" className="cursor-pointer">English</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* בונה הבלוקים */}
      <Card>
        <CardHeader>
          <CardTitle>בניית ההצעה</CardTitle>
        </CardHeader>
        <CardContent>
          <BlockSelector offerId={offerId} onBlockAdded={loadOffer} />
          
          {offerId && (
            <div className="mt-6">
              <BlockList
                offerId={offerId}
                blocks={blocks}
                onBlocksChange={setBlocks}
                onUpdate={loadOffer}
              />
            </div>
          )}
          
          {!offerId && (
            <p className="text-muted-foreground text-center py-8">
              שמור את ההצעה כדי להתחיל להוסיף בלוקים
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PriceOfferBuilder;