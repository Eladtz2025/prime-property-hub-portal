import { Button } from '@/components/ui/button';
import { FileText, Table2, Image, DollarSign, Minus, Video, Map, Receipt } from 'lucide-react';
import { useState } from 'react';
import TableBlockEditor from './TableBlockEditor';
import ImageBlockEditor from './ImageBlockEditor';
import TextBlockEditor from './TextBlockEditor';
import PriceCardEditor from './PriceCardEditor';
import VideoBlockEditor from './VideoBlockEditor';
import MapBlockEditor from './MapBlockEditor';
import PriceQuoteBlockEditor from './PriceQuoteBlockEditor';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BlockSelectorProps {
  offerId: string | null;
  onBlockAdded: () => void;
}

const BlockSelector = ({ offerId, onBlockAdded }: BlockSelectorProps) => {
  const { toast } = useToast();
  const [editingType, setEditingType] = useState<string | null>(null);

  const addBlock = async (type: string, data: any) => {
    if (!offerId) {
      toast({
        title: 'שמור קודם',
        description: 'יש לשמור את ההצעה לפני הוספת בלוקים',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: existingBlocks } = await supabase
        .from('price_offer_blocks')
        .select('block_order')
        .eq('offer_id', offerId)
        .order('block_order', { ascending: false })
        .limit(1);

      const nextOrder = existingBlocks && existingBlocks.length > 0 
        ? existingBlocks[0].block_order + 1 
        : 0;

      const { error } = await supabase
        .from('price_offer_blocks')
        .insert({
          offer_id: offerId,
          block_type: type,
          block_order: nextOrder,
          block_data: data,
        });

      if (error) throw error;

      toast({
        title: 'בלוק נוסף!',
        description: 'הבלוק נוסף בהצלחה',
      });
      
      setEditingType(null);
      onBlockAdded();
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const addDivider = () => {
    addBlock('divider', {});
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => setEditingType('text')}
          disabled={!offerId}
        >
          <FileText className="h-4 w-4 ml-2" />
          טקסט
        </Button>
        
        <Button
          variant="outline"
          onClick={() => setEditingType('table')}
          disabled={!offerId}
        >
          <Table2 className="h-4 w-4 ml-2" />
          טבלה
        </Button>
        
        <Button
          variant="outline"
          onClick={() => setEditingType('image')}
          disabled={!offerId}
        >
          <Image className="h-4 w-4 ml-2" />
          תמונה
        </Button>
        
        <Button
          variant="outline"
          onClick={() => setEditingType('price_quote')}
          disabled={!offerId}
        >
          <Receipt className="h-4 w-4 ml-2" />
          הצעת מחיר
        </Button>
        
        <Button
          variant="outline"
          onClick={() => setEditingType('price_card')}
          disabled={!offerId}
        >
          <DollarSign className="h-4 w-4 ml-2" />
          קארד מחיר
        </Button>
        
        <Button
          variant="outline"
          onClick={addDivider}
          disabled={!offerId}
        >
          <Minus className="h-4 w-4 ml-2" />
          מפריד
        </Button>
        
        <Button
          variant="outline"
          onClick={() => setEditingType('video')}
          disabled={!offerId}
        >
          <Video className="h-4 w-4 ml-2" />
          וידאו
        </Button>
        
        <Button
          variant="outline"
          onClick={() => setEditingType('map')}
          disabled={!offerId}
        >
          <Map className="h-4 w-4 ml-2" />
          מפה
        </Button>
      </div>

      {editingType === 'table' && (
        <TableBlockEditor
          open={true}
          onClose={() => setEditingType(null)}
          onSave={(data) => addBlock('table', data)}
        />
      )}

      {editingType === 'image' && (
        <ImageBlockEditor
          open={true}
          onClose={() => setEditingType(null)}
          onSave={(data) => addBlock('images', data)}
          offerId={offerId!}
        />
      )}

      {editingType === 'text' && (
        <TextBlockEditor
          open={true}
          onClose={() => setEditingType(null)}
          onSave={(data) => addBlock('text', data)}
        />
      )}

      {editingType === 'price_card' && (
        <PriceCardEditor
          open={true}
          onClose={() => setEditingType(null)}
          onSave={(data) => addBlock('price_card', data)}
        />
      )}

      {editingType === 'video' && (
        <VideoBlockEditor
          open={true}
          onClose={() => setEditingType(null)}
          onSave={(data) => addBlock('video', data)}
        />
      )}

      {editingType === 'map' && (
        <MapBlockEditor
          open={true}
          onClose={() => setEditingType(null)}
          onSave={(data) => addBlock('map', data)}
        />
      )}

      {editingType === 'price_quote' && (
        <PriceQuoteBlockEditor
          open={true}
          onClose={() => setEditingType(null)}
          onSave={(data) => addBlock('price_quote', data)}
        />
      )}
    </div>
  );
};

export default BlockSelector;