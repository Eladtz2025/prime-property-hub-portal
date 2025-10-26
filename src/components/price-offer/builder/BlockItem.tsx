import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronUp, ChevronDown, Trash2, Edit, FileText, Table2, Image, DollarSign, Minus, GripVertical, Video, Map, Receipt } from 'lucide-react';
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
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getBlockIcon = () => {
    switch (block.block_type) {
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'table':
        return <Table2 className="h-4 w-4" />;
      case 'images':
        return <Image className="h-4 w-4" />;
      case 'price_card':
        return <DollarSign className="h-4 w-4" />;
      case 'divider':
        return <Minus className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'map':
        return <Map className="h-4 w-4" />;
      case 'price_quote':
        return <Receipt className="h-4 w-4" />;
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
      case 'images':
        return 'גלריית תמונות';
      case 'price_card':
        return 'קארד מחיר';
      case 'divider':
        return 'מפריד';
      case 'video':
        return block.block_data.title || 'וידאו';
      case 'map':
        return block.block_data.address || 'מפה';
      case 'price_quote':
        return 'הצעת מחיר';
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
      <Card ref={setNodeRef} style={style} className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="cursor-grab active:cursor-grabbing touch-none h-6 w-6"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </Button>
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

      {isEditing && block.block_type === 'images' && (
        <ImageBlockEditor
          open={true}
          onClose={() => setIsEditing(false)}
          onSave={updateBlock}
          offerId={offerId}
          blockId={block.id}
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

      {isEditing && block.block_type === 'video' && (
        <VideoBlockEditor
          open={true}
          onClose={() => setIsEditing(false)}
          onSave={updateBlock}
          initialData={block.block_data}
        />
      )}

      {isEditing && block.block_type === 'map' && (
        <MapBlockEditor
          open={true}
          onClose={() => setIsEditing(false)}
          onSave={updateBlock}
          initialData={block.block_data}
        />
      )}

      {isEditing && block.block_type === 'price_quote' && (
        <PriceQuoteBlockEditor
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