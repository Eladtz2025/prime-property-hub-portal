interface PriceOfferVideoBlockProps {
  title?: string;
  videoUrl: string;
  description?: string;
}

const PriceOfferVideoBlock = ({ title, videoUrl, description }: PriceOfferVideoBlockProps) => {
  const getEmbedUrl = (url: string) => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    // Direct video file
    return url;
  };

  const embedUrl = getEmbedUrl(videoUrl);
  const isDirectVideo = !embedUrl.includes('youtube') && !embedUrl.includes('vimeo');

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-card">
      {title && (
        <h3 className="text-xl font-semibold text-foreground mb-4">{title}</h3>
      )}
      
      <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted">
        {isDirectVideo ? (
          <video
            src={embedUrl}
            controls
            className="w-full h-full"
          >
            הדפדפן שלך לא תומך בוידאו.
          </video>
        ) : (
          <iframe
            src={embedUrl}
            title={title || 'וידאו'}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        )}
      </div>

      {description && (
        <p className="text-muted-foreground mt-4 leading-relaxed">{description}</p>
      )}
    </div>
  );
};

export default PriceOfferVideoBlock;
