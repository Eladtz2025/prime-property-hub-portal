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
import { priceOfferBuilderTranslations, PriceOfferLanguage } from '@/lib/price-offer-translations';

interface PriceOfferData {
  id?: string;
  property_title: string;
  property_details: string;
  language: 'he' | 'en';
  is_active: boolean;
  slug?: string;
  display_type: 'standard' | 'luxury';
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
  const [uiLanguage, setUiLanguage] = useState<PriceOfferLanguage>('he');
  
  const [offerData, setOfferData] = useState<PriceOfferData>({
    property_title: '',
    property_details: '',
    language: 'he',
    is_active: false,
    slug: '',
    display_type: 'standard',
  });
  
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [offerId, setOfferId] = useState<string | null>(id || null);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Get translations based on UI language
  const t = priceOfferBuilderTranslations[uiLanguage];

  // Sync UI language with offer language
  useEffect(() => {
    setUiLanguage(offerData.language);
  }, [offerData.language]);

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
        slug: offer.slug || '',
        display_type: (offer.display_type as 'standard' | 'luxury') || 'standard',
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
        title: t.error,
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

          const { data: insertedBlocks, error: insertError } = await supabase
            .from('price_offer_blocks')
            .insert(blocksToInsert)
            .select();
          
          if (insertError) throw insertError;

          // שמירת תמונות לבלוקים מסוג תמונות
          if (insertedBlocks) {
            for (let i = 0; i < insertedBlocks.length; i++) {
              const block = insertedBlocks[i];
              const originalBlock = blocks[i];
              
              if (block.block_type === 'images' && originalBlock.block_data?.images?.length > 0) {
                const imageRecords = originalBlock.block_data.images.map((url: string, index: number) => ({
                  offer_id: currentOfferId,
                  block_id: block.id,
                  image_url: url,
                  image_order: index,
                }));

                await supabase
                  .from('price_offer_images')
                  .insert(imageRecords);
              }
            }
          }
        }
      }

      toast({
        title: activate ? t.offerPublished : t.offerSaved,
        description: activate ? t.offerPublishedDesc : t.draftSavedDesc,
      });
    } catch (error: any) {
      toast({
        title: t.saveError,
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
        title: t.saveFirst,
        description: t.saveBeforePreview,
        variant: 'destructive',
      });
      return;
    }
    
    const { data } = await supabase
      .from('price_offers')
      .select('token, slug, display_type')
      .eq('id', offerId)
      .single();
    
    if (data) {
      const identifier = data.slug || data.token;
      const basePath = data.display_type === 'luxury' ? '/offer-luxury' : '/price-offer';
      window.open(`${basePath}/${identifier}`, '_blank');
    }
  };

  const handleShare = async () => {
    if (!offerId) {
      toast({
        title: t.saveFirst,
        description: t.saveBeforeShare,
        variant: 'destructive',
      });
      return;
    }

    const { data } = await supabase
      .from('price_offers')
      .select('token, slug, property_title')
      .eq('id', offerId)
      .single();

    if (data) {
      const identifier = data.slug || data.token;
      const url = `${window.location.origin}/price-offer/${identifier}`;
      const message = `${t.whatsAppMessage} ${data.property_title}:\n${url}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleCopyLink = async () => {
    if (!offerId) {
      toast({
        title: t.saveFirst,
        description: t.saveBeforeCopyLink,
        variant: 'destructive',
      });
      return;
    }

    const { data } = await supabase
      .from('price_offers')
      .select('token, slug')
      .eq('id', offerId)
      .single();

    if (data) {
      const identifier = data.slug || data.token;
      const url = `${window.location.origin}/price-offer/${identifier}`;
      navigator.clipboard.writeText(url);
      toast({
        title: t.linkCopied,
        description: t.linkCopiedDesc,
      });
    }
  };

  const handleSaveAsTemplate = async (name: string, description: string, isPublic: boolean) => {
    if (!offerId) {
      toast({
        title: t.saveFirst,
        description: t.saveBeforeTemplate,
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
        title: t.templateSaved,
        description: t.templateSavedDesc,
      });

      setShowSaveTemplate(false);
    } catch (error: any) {
      toast({
        title: t.error,
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

  const isRTL = uiLanguage === 'he';

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {id ? t.editOffer : t.newOffer}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t.preview}
          </Button>
          <Button variant="outline" onClick={handleCopyLink}>
            <Copy className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t.copyLink}
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t.shareWhatsApp}
          </Button>
          <Button variant="outline" onClick={() => setShowSaveTemplate(true)} disabled={!offerId}>
            <FileText className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t.saveAsTemplate}
          </Button>
          <Button variant="secondary" onClick={() => saveOffer(false)} disabled={saving}>
            {saving && <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />}
            <Save className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t.saveDraft}
          </Button>
          <Button onClick={() => saveOffer(true)} disabled={saving}>
            {saving && <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />}
            {t.publish}
          </Button>
        </div>
      </div>

      {/* פרטים בסיסיים */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t.basicDetails}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">{t.propertyTitle}</Label>
            <Input
              id="title"
              value={offerData.property_title}
              onChange={(e) => setOfferData({ ...offerData, property_title: e.target.value })}
              placeholder={t.propertyTitlePlaceholder}
            />
          </div>

          <div>
            <Label htmlFor="slug">{t.slug}</Label>
            <Input
              id="slug"
              value={offerData.slug || ''}
              onChange={(e) => setOfferData({ ...offerData, slug: e.target.value })}
              placeholder={t.slugPlaceholder}
              dir="ltr"
            />
            <p className="text-sm text-muted-foreground mt-1">
              {t.linkWillBe} {window.location.origin}/price-offer/{offerData.slug || t.yourSlug}
            </p>
          </div>

          <div>
            <Label htmlFor="details">{t.technicalDetails}</Label>
            <Textarea
              id="details"
              value={offerData.property_details}
              onChange={(e) => setOfferData({ ...offerData, property_details: e.target.value })}
              placeholder={t.technicalDetailsPlaceholder}
              rows={3}
            />
          </div>

          <div>
            <Label>{t.language}</Label>
            <RadioGroup
              value={offerData.language}
              onValueChange={(value) => setOfferData({ ...offerData, language: value as 'he' | 'en' })}
              className="flex gap-4 mt-2"
            >
              <div className={`flex items-center ${isRTL ? 'space-x-2 space-x-reverse' : 'space-x-2'}`}>
                <RadioGroupItem value="he" id="lang-he" />
                <Label htmlFor="lang-he" className="cursor-pointer">{t.hebrew}</Label>
              </div>
              <div className={`flex items-center ${isRTL ? 'space-x-2 space-x-reverse' : 'space-x-2'}`}>
                <RadioGroupItem value="en" id="lang-en" />
                <Label htmlFor="lang-en" className="cursor-pointer">{t.english}</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label>{isRTL ? 'סוג תצוגה' : 'Display Type'}</Label>
            <RadioGroup
              value={offerData.display_type}
              onValueChange={(value) => setOfferData({ ...offerData, display_type: value as 'standard' | 'luxury' })}
              className="flex gap-4 mt-2"
            >
              <div className={`flex items-center ${isRTL ? 'space-x-2 space-x-reverse' : 'space-x-2'}`}>
                <RadioGroupItem value="standard" id="display-standard" />
                <Label htmlFor="display-standard" className="cursor-pointer">
                  {isRTL ? 'רגיל' : 'Standard'}
                </Label>
              </div>
              <div className={`flex items-center ${isRTL ? 'space-x-2 space-x-reverse' : 'space-x-2'}`}>
                <RadioGroupItem value="luxury" id="display-luxury" />
                <Label htmlFor="display-luxury" className="cursor-pointer">
                  {isRTL ? 'מצגת יוקרה' : 'Luxury Presentation'}
                </Label>
              </div>
            </RadioGroup>
            <p className="text-sm text-muted-foreground mt-1">
              {isRTL 
                ? 'מצגת יוקרה - תצוגה אינטראקטיבית עם אנימציות ועיצוב יוקרתי' 
                : 'Luxury presentation - interactive display with animations and premium design'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* בונה הבלוקים */}
      <Card>
        <CardHeader>
          <CardTitle>{t.buildOffer}</CardTitle>
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
              {t.saveOfferToAddBlocks}
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
