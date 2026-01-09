interface FullScreenHeroProps {
  title: string;
  subtitle?: string;
  backgroundImage: string;
  minHeight?: string;
  children?: React.ReactNode;
}

// Generate WebP srcset for responsive loading
const generateSrcSet = (basePath: string) => {
  const webpPath = basePath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  const pathWithoutExt = webpPath.replace(/\.webp$/i, '');
  return `${pathWithoutExt}-640w.webp 640w, ${pathWithoutExt}-1024w.webp 1024w, ${webpPath} 1920w`;
};

const FullScreenHero = ({
  title,
  subtitle,
  backgroundImage,
  minHeight = "70vh",
  children
}: FullScreenHeroProps) => {
  const webpSrc = backgroundImage.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  const srcSet = generateSrcSet(backgroundImage);

  return (
    <section 
      className="relative flex items-center justify-center overflow-hidden" 
      style={{ minHeight, height: minHeight }}
    >
      {/* Background Image - optimized with WebP and srcset for LCP */}
      <div className="absolute inset-0 w-full h-full">
        <picture>
          <source
            type="image/webp"
            srcSet={srcSet}
            sizes="100vw"
          />
          <img
            src={backgroundImage}
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 animate-fade-in font-playfair">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-6 animate-fade-in font-montserrat max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </section>
  );
};

export default FullScreenHero;