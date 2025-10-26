import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Copy, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
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

const AdminPriceOffers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<PriceOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  const openOffer = (token: string) => {
    window.open(`/price-offer/${token}`, '_blank');
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

  if (loading) {
    return <div className="p-8 text-center">טוען...</div>;
  }

  return (
    <div className="p-8 rtl">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">הצעות מחיר</h1>
          <Button onClick={() => navigate('/admin/price-offers/new')}>
            <Plus className="h-4 w-4 ml-2" />
            הצעה חדשה
          </Button>
        </div>

        {offers.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground mb-4">אין הצעות מחיר עדיין</p>
            <Button onClick={() => navigate('/admin/price-offers/new')}>
              צור הצעה ראשונה
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{offer.property_title}</h3>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>נוצר: {new Date(offer.created_at).toLocaleDateString('he-IL')}</span>
                      <span>צפיות: {offer.views_count}</span>
                      <span className={offer.is_active ? 'text-green-600' : 'text-red-600'}>
                        {offer.is_active ? 'פעיל' : 'לא פעיל'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openOffer(offer.token)}
                      title="תצוגה מקדימה"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyLink(offer.token)}
                      title="העתק לינק"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigate(`/admin/price-offers/edit/${offer.id}`)}
                      title="ערוך"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setDeleteId(offer.id)}
                      title="מחק"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
    </div>
  );
};

export default AdminPriceOffers;
