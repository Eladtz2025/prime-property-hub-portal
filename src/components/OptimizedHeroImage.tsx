interface OptimizedHeroImageProps {
  src: string;
  alt: string;
  className?: string;
}

/**
 * Optimized hero image component with WebP support and responsive srcset.
 * Automatically generates srcset for responsive loading based on device width.
 * 
 * Usage:
 * <OptimizedHeroImage 
 *   src="/images/en/hero-last-one.png" 
 *   alt="Hero background"
 * />
 */
const OptimizedHeroImage = ({ 
  src, 
  alt, 
  className = "absolute inset-0 w-full h-full object-cover" 
}: OptimizedHeroImageProps) => {
  // Generate WebP version path
  const getWebPPath = (path: string) => {
    return path.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  };

  // Generate responsive srcset paths
  const generateSrcSet = (basePath: string) => {
    const ext = basePath.match(/\.(png|jpg|jpeg|webp)$/i)?.[0] || '.webp';
    const pathWithoutExt = basePath.replace(/\.(png|jpg|jpeg|webp)$/i, '');
    
    return `${pathWithoutExt}-640w${ext} 640w, ${pathWithoutExt}-1024w${ext} 1024w, ${pathWithoutExt}-1920w${ext} 1920w`;
  };

  const webpSrc = getWebPPath(src);
  const webpSrcSet = generateSrcSet(webpSrc);
  const fallbackSrcSet = generateSrcSet(src);

  return (
    <picture>
      {/* WebP version for modern browsers */}
      <source
        type="image/webp"
        srcSet={webpSrcSet}
        sizes="100vw"
      />
      {/* Fallback for older browsers */}
      <source
        srcSet={fallbackSrcSet}
        sizes="100vw"
      />
      {/* Base image with eager loading for LCP */}
      <img
        src={src}
        alt={alt}
        className={className}
        loading="eager"
        fetchPriority="high"
        decoding="async"
      />
    </picture>
  );
};

export default OptimizedHeroImage;
