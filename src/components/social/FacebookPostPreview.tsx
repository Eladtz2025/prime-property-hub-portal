import React from 'react';
import { cn } from '@/lib/utils';
import { Globe, ThumbsUp, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';

interface FacebookPostPreviewProps {
  text: string;
  hashtags?: string;
  imageUrls?: string[];
  pageName?: string;
  pageAvatarUrl?: string;
}

export const FacebookPostPreview: React.FC<FacebookPostPreviewProps> = ({
  text,
  hashtags,
  imageUrls = [],
  pageName = 'PrimeProperty',
  pageAvatarUrl,
}) => {
  const hasImages = imageUrls.length > 0;

  return (
    <div className="rounded-lg bg-white dark:bg-[#242526] shadow-md border border-[#dddfe2] dark:border-[#3a3b3c] overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-start gap-2.5">
        {pageAvatarUrl ? (
          <img src={pageAvatarUrl} alt={pageName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1877F2] to-[#0d6efd] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {pageName.substring(0, 2)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[13px] font-semibold text-[#050505] dark:text-[#e4e6eb] hover:underline cursor-pointer">
                {pageName}
              </span>
              <div className="flex items-center gap-1 text-[12px] text-[#65676b] dark:text-[#b0b3b8]">
                <span>עכשיו</span>
                <span>·</span>
                <Globe className="h-3 w-3" />
              </div>
            </div>
            <button className="p-1 rounded-full hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] text-[#65676b] dark:text-[#b0b3b8]">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Body text */}
      <div className="px-4 pb-2">
        <div className="text-[15px] text-[#050505] dark:text-[#e4e6eb] whitespace-pre-wrap leading-[1.3333]" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
          {text || <span className="text-[#65676b]">הטקסט שלך יופיע כאן...</span>}
        </div>
        {hashtags && (
          <div className="mt-1 text-[15px] text-[#216fdb] dark:text-[#75b7ff]" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
            {hashtags}
          </div>
        )}
      </div>

      {/* Image grid */}
      {hasImages && (
        <div className="relative">
          {imageUrls.length === 1 && (
            <img src={imageUrls[0]} alt="" className="w-full max-h-[500px] object-cover" />
          )}
          {imageUrls.length === 2 && (
            <div className="grid grid-cols-2 gap-[2px]">
              {imageUrls.map((url, i) => (
                <img key={i} src={url} alt="" className="w-full h-[250px] object-cover" />
              ))}
            </div>
          )}
          {imageUrls.length === 3 && (
            <div className="grid grid-cols-2 gap-[2px]">
              <img src={imageUrls[0]} alt="" className="w-full h-[300px] object-cover row-span-2 col-span-1" />
              <img src={imageUrls[1]} alt="" className="w-full h-[149px] object-cover" />
              <img src={imageUrls[2]} alt="" className="w-full h-[149px] object-cover" />
            </div>
          )}
          {imageUrls.length >= 4 && (
            <div className="grid grid-cols-2 gap-[2px]">
              <img src={imageUrls[0]} alt="" className="w-full h-[200px] object-cover" />
              <img src={imageUrls[1]} alt="" className="w-full h-[200px] object-cover" />
              <img src={imageUrls[2]} alt="" className="w-full h-[200px] object-cover" />
              <div className="relative">
                <img src={imageUrls[3]} alt="" className="w-full h-[200px] object-cover" />
                {imageUrls.length > 4 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">+{imageUrls.length - 4}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reactions summary */}
      <div className="px-4 py-1.5 flex items-center justify-between text-[13px] text-[#65676b] dark:text-[#b0b3b8] border-b border-[#dddfe2] dark:border-[#3a3b3c]">
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1 rtl:space-x-reverse">
            <span className="w-[18px] h-[18px] rounded-full bg-[#1877F2] flex items-center justify-center text-[10px]">👍</span>
            <span className="w-[18px] h-[18px] rounded-full bg-[#f0716b] flex items-center justify-center text-[10px]">❤️</span>
          </div>
          <span className="text-[13px]">24</span>
        </div>
        <div className="flex gap-3">
          <span>3 תגובות</span>
          <span>1 שיתופים</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-2 py-1 flex items-center justify-around">
        <button className="flex items-center gap-1.5 px-4 py-[6px] rounded-md hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] text-[#65676b] dark:text-[#b0b3b8] text-[15px] font-semibold transition-colors">
          <ThumbsUp className="h-5 w-5" />
          <span>לייק</span>
        </button>
        <button className="flex items-center gap-1.5 px-4 py-[6px] rounded-md hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] text-[#65676b] dark:text-[#b0b3b8] text-[15px] font-semibold transition-colors">
          <MessageCircle className="h-5 w-5" />
          <span>תגובה</span>
        </button>
        <button className="flex items-center gap-1.5 px-4 py-[6px] rounded-md hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] text-[#65676b] dark:text-[#b0b3b8] text-[15px] font-semibold transition-colors">
          <Share2 className="h-5 w-5" />
          <span>שיתוף</span>
        </button>
      </div>
    </div>
  );
};
