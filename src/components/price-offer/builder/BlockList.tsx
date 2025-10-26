import { useState } from 'react';
import BlockItem from './BlockItem';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Block {
  id: string;
  block_type: string;
  block_order: number;
  block_data: any;
}

interface BlockListProps {
  offerId: string;
  blocks: Block[];
  onBlocksChange: (blocks: Block[]) => void;
  onUpdate: () => void;
}

const BlockList = ({ offerId, blocks, onBlocksChange, onUpdate }: BlockListProps) => {
  const { toast } = useToast();

  const moveBlock = async (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;

    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    
    const updates = newBlocks.map((block, idx) => ({
      id: block.id,
      block_order: idx,
    }));

    try {
      for (const update of updates) {
        await supabase
          .from('price_offer_blocks')
          .update({ block_order: update.block_order })
          .eq('id', update.id);
      }
      
      onUpdate();
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteBlock = async (blockId: string) => {
    try {
      const { error } = await supabase
        .from('price_offer_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      toast({
        title: 'בלוק נמחק',
        description: 'הבלוק נמחק בהצלחה',
      });
      
      onUpdate();
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (blocks.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        אין בלוקים עדיין. הוסף בלוק ראשון בעזרת הכפתורים למעלה.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold mb-4">בלוקים ({blocks.length})</h3>
      {blocks.map((block, index) => (
        <BlockItem
          key={block.id}
          block={block}
          index={index}
          total={blocks.length}
          onMoveUp={() => moveBlock(index, 'up')}
          onMoveDown={() => moveBlock(index, 'down')}
          onDelete={() => deleteBlock(block.id)}
          onEdit={onUpdate}
          offerId={offerId}
        />
      ))}
    </div>
  );
};

export default BlockList;