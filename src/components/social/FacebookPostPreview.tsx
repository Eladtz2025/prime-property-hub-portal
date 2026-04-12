import React, { useState } from 'react';
import { Globe, ThumbsUp, MessageCircle, Share2, MoreHorizontal, Camera, Smile, Gift, Lock, Info, Sticker, Image, Type } from 'lucide-react';

const MAX_LINES = 3;
const MAX_CHARS = 300;

const TextWithSeeMore: React.FC<{ text: string }> = ({ text }) => {
  const [expanded, setExpanded] = useState(false);

  if (!text) {
    return (
      <div className="text-[15px] text-[#b0b3b8] whitespace-pre-wrap leading-[1.3333]" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
        הטקסט שלך יופיע כאן...
      </div>
    );
  }

  const lines = text.split('\n');
  const isTooLong = lines.length > MAX_LINES || text.length > MAX_CHARS;

  if (!isTooLong || expanded) {
    return (
      <div className="text-[15px] text-[#e4e6eb] whitespace-pre-wrap leading-[1.3333]" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
        {text}
      </div>
    );
  }

  const truncated = lines.slice(0, MAX_LINES).join('\n').slice(0, MAX_CHARS);

  return (
    <div className="text-[15px] text-[#e4e6eb] whitespace-pre-wrap leading-[1.3333]" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
      {truncated}{'... '}
      <br />
      <button
        onClick={() => setExpanded(true)}
        className="text-[#b0b3b8] hover:underline font-normal"
      >
        See more
      </button>
    </div>
  );
};

interface FacebookPostPreviewProps {
  text: string;
  hashtags?: string;
  imageUrls?: string[];
  pageName?: string;
  pageAvatarUrl?: string;
  linkUrl?: string;
  linkTitle?: string;
  linkDescription?: string;
  linkImage?: string;
  publishedAt?: Date;
  isPublic?: boolean;
}

export const FacebookPostPreview: React.FC<FacebookPostPreviewProps> = ({
  text,
  hashtags,
  imageUrls = [],
  pageName = 'דירות להשכרה ומכירה בת"א סיטי מרקט נכסים',
  pageAvatarUrl,
  linkUrl,
  linkTitle,
  linkDescription,
  linkImage,
  publishedAt,
  isPublic = false,
}) => {
  const hasLinkCard = !!linkUrl && !!linkImage;
  const hasImages = !hasLinkCard && imageUrls.length > 0;
  const linkDomain = linkUrl ? 'CTMARKETPROPERTIES.COM' : '';

  const formatDate = (date?: Date) => {
    if (!date) return 'עכשיו';
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) +
      ' at ' +
      date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="max-w-[500px] mx-auto rounded-lg bg-[#242526] shadow-md border border-[#3a3b3c] overflow-hidden" dir="rtl">
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
              <span className="text-[13px] font-semibold text-[#e4e6eb] hover:underline cursor-pointer">
                {pageName}
              </span>
              <div className="text-[12px] text-[#b0b3b8] leading-tight">
                Published by CityMarketPropertiesWebsite
              </div>
              <div className="flex items-center gap-1 text-[12px] text-[#b0b3b8]">
                <span>{formatDate(publishedAt)}</span>
                <span>·</span>
                {isPublic ? (
                  <Globe className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
              </div>
            </div>
            <button className="p-1 rounded-full hover:bg-[#3a3b3c] text-[#b0b3b8]">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Body text */}
      <div className="px-4 pb-2">
        <TextWithSeeMore text={text} />
        {hashtags && (
          <div className="mt-1 text-[15px] text-[#75b7ff]" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
            {hashtags}
          </div>
        )}
      </div>

      {/* Link Card (OG Preview) */}
      {hasLinkCard && (
        <div className="border-b border-[#3a3b3c] cursor-pointer">
          <div className="relative overflow-hidden">
            <img
              src={linkImage}
              alt={linkTitle || ''}
              className="w-full object-cover aspect-[1.91/1]"
            />
            {/* Info button overlay */}
            <button className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white">
              <Info className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="bg-[#3a3b3c] px-3 py-2" dir="ltr">
            <div className="text-[12px] text-[#b0b3b8] uppercase tracking-wide text-left" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
              {linkDomain}
            </div>
            <div className="text-[15px] font-semibold text-[#e4e6eb] leading-tight mt-0.5 line-clamp-2" dir={/[\u0590-\u05FF]/.test(linkTitle?.charAt(0) || '') ? 'rtl' : 'ltr'} style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
              {linkTitle}
            </div>
          </div>
        </div>
      )}

      {/* Image grid (fallback when no link card) */}
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

      {/* See insights + Create ad row (admin view) */}
      <div className="px-4 py-2 flex items-center justify-between border-t border-[#3a3b3c]" dir="ltr">
        <button className="text-[13px] text-[#2d88ff] font-semibold hover:underline">
          See insights
        </button>
        <button className="text-[13px] text-[#e4e6eb] font-semibold bg-[#3a3b3c] hover:bg-[#4e4f50] px-3 py-1 rounded-md">
          Create ad
        </button>
      </div>

      {/* Action buttons — icons only, left-aligned */}
      <div className="px-2 py-1 flex items-center justify-start gap-1 border-t border-[#3a3b3c]">
        <button className="flex items-center justify-center px-4 py-[6px] rounded-md hover:bg-[#3a3b3c] text-[#b0b3b8] transition-colors">
          <ThumbsUp className="h-5 w-5" />
        </button>
        <button className="flex items-center justify-center px-4 py-[6px] rounded-md hover:bg-[#3a3b3c] text-[#b0b3b8] transition-colors">
          <MessageCircle className="h-5 w-5" />
        </button>
        <button className="flex items-center justify-center px-4 py-[6px] rounded-md hover:bg-[#3a3b3c] text-[#b0b3b8] transition-colors">
          <Share2 className="h-5 w-5" />
        </button>
      </div>

      {/* Comment row */}
      <div className="px-3 py-2 border-t border-[#3a3b3c] flex items-center gap-2">
        {pageAvatarUrl ? (
          <img src={pageAvatarUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1877F2] to-[#0d6efd] flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
            {pageName.substring(0, 2)}
          </div>
        )}
        <div className="flex-1 bg-[#3a3b3c] rounded-full px-3 py-1.5 flex items-center justify-between">
          <span className="text-[13px] text-[#b0b3b8]">Comment as {pageName.split(' ').slice(0, 3).join(' ')}...</span>
          <div className="flex items-center gap-1.5 text-[#b0b3b8]">
            <Smile className="h-4 w-4" />
            <Sticker className="h-4 w-4" />
            <Camera className="h-4 w-4" />
            <Image className="h-4 w-4" />
            <Type className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
