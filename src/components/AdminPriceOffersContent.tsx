import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Eye, Copy, Trash2, Edit, Share2, Files, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import TemplateSelector from '@/components/price-offer/templates/TemplateSelector';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PriceOffer {
  id: string;
  property_title: string;
  token: string;
  is_active: boolean;
  views_count: number;
  created_at: string;
  language: string;
}

const AdminPriceOffersContent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<PriceOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('price_offers')
        .select('id, property_title, token, is_active, views_count, created_at, language')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast.error('שגיאה בטעינת הצעות מחיר');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/price-offer/${token}`;
    navigator.clipboard.writeText(link);
    toast.success('הלינק הועתק ללוח');
  };

  const shareWhatsApp = (token: string, title: string) => {
    const link = `${window.location.origin}/price-offer/${token}`;
    const message = `שלום! הנה הצעת המחיר עבור ${title}:\n${link}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const openOffer = (token: string) => {
    window.open(`/price-offer/${token}`, '_blank');
  };

  const duplicateOffer = async (offerId: string) => {
    try {
      const { data: originalOffer, error: offerError } = await supabase
        .from('price_offers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (offerError) throw offerError;

      const { data: newOffer, error: newOfferError } = await supabase
        .from('price_offers')
        .insert([{
          property_title: `העתק של ${originalOffer.property_title}`,
          property_details: originalOffer.property_details,
          suggested_price_min: originalOffer.suggested_price_min,
          suggested_price_max: originalOffer.suggested_price_max,
          price_per_sqm_min: originalOffer.price_per_sqm_min,
          price_per_sqm_max: originalOffer.price_per_sqm_max,
          expected_income_min: originalOffer.expected_income_min,
          expected_income_max: originalOffer.expected_income_max,
          language: originalOffer.language,
          is_active: false,
          created_by: user?.id,
        }])
        .select()
        .single();

      if (newOfferError) throw newOfferError;

      const { data: blocks, error: blocksError } = await supabase
        .from('price_offer_blocks')
        .select('*')
        .eq('offer_id', offerId)
        .order('block_order', { ascending: true });

      if (blocksError) throw blocksError;

      if (blocks && blocks.length > 0) {
        const newBlocks = blocks.map(block => ({
          offer_id: newOffer.id,
          block_type: block.block_type,
          block_order: block.block_order,
          block_data: block.block_data,
        }));

        const { error: insertBlocksError } = await supabase
          .from('price_offer_blocks')
          .insert(newBlocks);

        if (insertBlocksError) throw insertBlocksError;
      }

      toast.success('ההצעה שוכפלה בהצלחה');
      navigate(`/admin-dashboard/price-offers/edit/${newOffer.id}`);
    } catch (error) {
      console.error('Error duplicating offer:', error);
      toast.error('שגיאה בשכפול ההצעה');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('price_offers')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast.success('ההצעה נמחקה בהצלחה');
      fetchOffers();
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error('שגיאה במחיקת ההצעה');
    } finally {
      setDeleteId(null);
    }
  };

  const handleTemplateSelect = async (template: any) => {
    try {
      const { offerData, blocks } = template.template_data;

      const { data: newOffer, error: offerError } = await supabase
        .from('price_offers')
        .insert([{
          ...offerData,
          property_title: `${offerData.property_title} (מתבנית)`,
          is_active: false,
          created_by: user?.id,
        }])
        .select()
        .single();

      if (offerError) throw offerError;

      if (blocks && blocks.length > 0) {
        const newBlocks = blocks.map((block: any) => ({
          offer_id: newOffer.id,
          block_type: block.block_type,
          block_order: block.block_order,
          block_data: block.block_data,
        }));

        const { error: blocksError } = await supabase
          .from('price_offer_blocks')
          .insert(newBlocks);

        if (blocksError) throw blocksError;
      }

      toast.success('הצעה נוצרה מתבנית בהצלחה');
      navigate(`/admin-dashboard/price-offers/edit/${newOffer.id}`);
    } catch (error) {
      console.error('Error creating from template:', error);
      toast.error('שגיאה ביצירת הצעה מתבנית');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)}>
          <FileText className="h-4 w-4 ml-2" />
          צור מתבנית
        </Button>
        <Button size="sm" onClick={() => navigate('/admin-dashboard/price-offers/create')}>
          <Plus className="h-4 w-4 ml-2" />
          הצעה חדשה
        </Button>
      </div>

      {offers.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-4">אין הצעות מחיר עדיין</p>
          <Button onClick={() => navigate('/admin-dashboard/price-offers/create')}>
            צור הצעה ראשונה
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => (
            <Card
              key={offer.id}
              className="bg-card"
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold truncate">{offer.property_title}</h3>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                      <span>{new Date(offer.created_at).toLocaleDateString('he-IL')}</span>
                      <span>·</span>
                      <span>{offer.views_count} צפיות</span>
                      <span>·</span>
                      <span className={offer.is_active ? 'text-green-600' : 'text-red-600'}>
                        {offer.is_active ? 'פעיל' : 'לא פעיל'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin-dashboard/price-offers/edit/${offer.id}`)}
                    >
                      <Edit className="h-3.5 w-3.5 ml-1" />
                      ערוך
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyLink(offer.token)}
                    >
                      <Copy className="h-3.5 w-3.5 ml-1" />
                      העתק
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => shareWhatsApp(offer.token, offer.property_title)}
                      className="text-green-600"
                    >
                      <Share2 className="h-3.5 w-3.5 ml-1" />
                      שלח
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openOffer(offer.token)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => duplicateOffer(offer.id)}
                    >
                      <Files className="h-3.5 w-3.5" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setDeleteId(offer.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את ההצעה לצמיתות ולא ניתן יהיה לשחזר אותה.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TemplateSelector
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelect={handleTemplateSelect}
      />
    </div>
  );
};

export default AdminPriceOffersContent;
