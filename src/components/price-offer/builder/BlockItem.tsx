import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronUp, ChevronDown, Trash2, Edit, FileText, Table2, Image, DollarSign, Minus } from 'lucide-react';
import { useState } from 'react';
import TableBlockEditor from './TableBlockEditor';
import ImageBlockEditor from './ImageBlockEditor';
import TextBlockEditor from './TextBlockEditor';
import PriceCardEditor from './PriceCardEditor';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BlockItemProps {
  block: any;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onEdit: () => void;
  offerId: string;
}

const BlockItem = ({ block, index, total, onMoveUp, onMoveDown, onDelete, onEdit, offerId }: BlockItemProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const getBlockIcon = () => {
    switch (block.block_type) {
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'table':
        return <Table2 className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'price_card':
        return <DollarSign className="h-4 w-4" />;
      case 'divider':
        return <Minus className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getBlockLabel = () => {
    switch (block.block_type) {
      case 'text':
        return block.block_data.title || 'בלוק טקסט';
      case 'table':
        return block.block_data.title || 'טבלה';
      case 'image':
        return 'גלריית תמונות';
      case 'price_card':
        return 'קארד מחיר';
      case 'divider':
        return 'מפריד';
      default:
        return 'בלוק';
    }
  };

  const updateBlock = async (data: any) => {
    try {
      const { error } = await supabase
        .from('price_offer_blocks')
        .update({ block_data: data })
        .eq('id', block.id);

      if (error) throw error;

      toast({
        title: 'בלוק עודכן',
        description: 'הבלוק עודכן בהצלחה',
      });
      
      setIsEditing(false);
      onEdit();
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">{index + 1}.</span>
            {getBlockIcon()}
            <span className="font-medium">{getBlockLabel()}</span>
          </div>
          
          <div className="flex gap-1">
            {block.block_type !== 'divider' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onMoveUp}
              disabled={index === 0}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onMoveDown}
              disabled={index === total - 1}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {isEditing && block.block_type === 'table' && (
        <TableBlockEditor
          open={true}
          onClose={() => setIsEditing(false)}
          onSave={updateBlock}
          initialData={block.block_data}
        />
      )}

      {isEditing && block.block_type === 'image' && (
        <ImageBlockEditor
          open={true}
          onClose={() => setIsEditing(false)}
          onSave={updateBlock}
          offerId={offerId}
          initialData={block.block_data}
        />
      )}

      {isEditing && block.block_type === 'text' && (
        <TextBlockEditor
          open={true}
          onClose={() => setIsEditing(false)}
          onSave={updateBlock}
          initialData={block.block_data}
        />
      )}

      {isEditing && block.block_type === 'price_card' && (
        <PriceCardEditor
          open={true}
          onClose={() => setIsEditing(false)}
          onSave={updateBlock}
          initialData={block.block_data}
        />
      )}
    </>
  );
};

export default BlockItem;