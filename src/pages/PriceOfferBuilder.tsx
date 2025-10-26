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
import { Eye, Save, Share2, Loader2, Copy, FileText } from 'lucide-react';
import BlockSelector from '@/components/price-offer/builder/BlockSelector';
import BlockList from '@/components/price-offer/builder/BlockList';
import SaveTemplateModal from '@/components/price-offer/templates/SaveTemplateModal';

interface PriceOfferData {
  id?: string;
  property_title: string;
  property_details: string;
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
    language: 'he',
    is_active: false,
  });
  
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [offerId, setOfferId] = useState<string | null>(id || null);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

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
      
      let currentOfferId = offerId;
      
      if (currentOfferId) {
        const { error } = await supabase
          .from('price_offers')
          .update(dataToSave)
          .eq('id', currentOfferId);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('price_offers')
          .insert([{ ...dataToSave, created_by: (await supabase.auth.getUser()).data.user?.id }])
          .select()
          .single();
        
        if (error) throw error;
        currentOfferId = data.id;
        setOfferId(data.id);
        navigate(`/admin-dashboard/price-offers/edit/${data.id}`, { replace: true });
      }

      // שמירת בלוקים
      if (currentOfferId) {
        // מחיקת בלוקים ישנים
        const { error: deleteError } = await supabase
          .from('price_offer_blocks')
          .delete()
          .eq('offer_id', currentOfferId);
        
        if (deleteError) throw deleteError;

        // הוספת בלוקים מעודכנים
        if (blocks.length > 0) {
          const blocksToInsert = blocks.map((block, index) => ({
            offer_id: currentOfferId,
            block_type: block.block_type,
            block_order: index,
            block_data: block.block_data,
          }));

          const { error: insertError } = await supabase
            .from('price_offer_blocks')
            .insert(blocksToInsert);
          
          if (insertError) throw insertError;
        }
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

  const handleSaveAsTemplate = async (name: string, description: string, isPublic: boolean) => {
    if (!offerId) {
      toast({
        title: 'שמור קודם',
        description: 'יש לשמור את ההצעה לפני שמירה כתבנית',
        variant: 'destructive',
      });
      return;
    }

    setSavingTemplate(true);
    try {
      const { data: userData } = await supabase.auth.getUser();

      const templateData = {
        offerData,
        blocks,
      };

      const { error } = await supabase
        .from('price_offer_templates')
        .insert([{
          name,
          description,
          template_data: templateData as any,
          created_by: userData.user?.id,
          is_public: isPublic,
        }]);

      if (error) throw error;

      toast({
        title: 'תבנית נשמרה!',
        description: 'התבנית נשמרה בהצלחה וזמינה לשימוש',
      });

      setShowSaveTemplate(false);
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSavingTemplate(false);
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
          <Button variant="outline" onClick={() => setShowSaveTemplate(true)} disabled={!offerId}>
            <FileText className="h-4 w-4 ml-2" />
            שמור כתבנית
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

      <SaveTemplateModal
        open={showSaveTemplate}
        onClose={() => setShowSaveTemplate(false)}
        onSave={handleSaveAsTemplate}
        saving={savingTemplate}
      />
    </div>
  );
};

export default PriceOfferBuilder;