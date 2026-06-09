import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image, X } from 'lucide-react';

interface FreePostImageUrlInputProps {
  imageUrls: string[];
  newImageUrl: string;
  /** = platforms.instagram, only for the "(חובה באינסטגרם)" hint. */
  instagramSelected: boolean;
  onNewImageUrlChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

/**
 * Manual image-URL entry + thumbnail strip for a free (non-property) post
 * (extracted from AutoPublishManager). Presentational: imageUrls ownership stays
 * in the parent via onAdd/onRemove/onNewImageUrlChange. The caller keeps the
 * `!selectedPropertyId || selectedPropertyId === 'free'` guard.
 */
export const FreePostImageUrlInput: React.FC<FreePostImageUrlInputProps> = ({
  imageUrls,
  newImageUrl,
  instagramSelected,
  onNewImageUrlChange,
  onAdd,
  onRemove,
}) => {
  return (
    <div>
      <Label className="text-xs font-medium">
        תמונות {instagramSelected && <span className="text-muted-foreground">(חובה באינסטגרם)</span>}
      </Label>
      <div className="flex flex-row-reverse gap-2 mt-1">
        <Button size="sm" variant="outline" onClick={onAdd} disabled={!newImageUrl}>
          <Image className="h-3.5 w-3.5" />
        </Button>
        <Input
          value={newImageUrl}
          onChange={e => onNewImageUrlChange(e.target.value)}
          placeholder="הזן URL של תמונה"
          dir="rtl"
          className="text-sm flex-1 text-right"
        />
      </div>
      {imageUrls.length > 0 && (
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 mt-2">
          {imageUrls.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => onRemove(i)}
                className="absolute top-1 left-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
