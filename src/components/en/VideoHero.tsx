import { useNavigate } from "react-router-dom";
import { useSafeAreaBottom } from "@/hooks/useSafeAreaBottom";

interface VideoHeroProps {
  title: string;
  subtitle: string;
  videoUrl?: string;
  imageUrl?: string;
}

const VideoHero = ({ title, subtitle, videoUrl, imageUrl }: VideoHeroProps) => {
  const navigate = useNavigate();
  const bottomOffset = useSafeAreaBottom(32);

  const defaultImage = "/images/en/hero-telaviv.webp";
  const imageSrc = imageUrl || defaultImage;

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Video/Image Background */}
      {videoUrl ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      ) : (
        <picture>
          <source
            type="image/webp"
            srcSet="/images/en/hero-telaviv-640w.webp 640w, /images/en/hero-telaviv-1024w.webp 1024w, /images/en/hero-telaviv.webp 1920w"
            sizes="100vw"
          />
          <img
            src={imageSrc}
            alt="Hero background"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </picture>
      )}

      {/* Overlay Gradient - Very light for bright daytime */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center text-center px-4 -translate-y-[12.5%]">
        <div className="mb-6 animate-fade-in">
          <h1 className="reliz-hero-title text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
            {title}
          </h1>
          <p className="font-montserrat text-sm md:text-base text-white/90 tracking-widest drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
            Properties
          </p>
        </div>
        <p className="reliz-subtitle text-white mb-12 max-w-2xl animate-fade-in animation-delay-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
          {subtitle}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in animation-delay-400">
          <button
            onClick={() => navigate("/en/sales")}
            className="px-8 py-3 bg-white text-foreground font-montserrat text-sm tracking-wider uppercase transition-all duration-300 hover:bg-white/90"
          >
            Buy
          </button>
          <button
            onClick={() => navigate("/en/rentals")}
            className="px-8 py-3 border-2 border-white text-white font-montserrat text-sm tracking-wider uppercase transition-all duration-300 hover:bg-white hover:text-foreground"
          >
            Rent
          </button>
        </div>
      </div>

      {/* Language Switcher - Bottom Right */}
      <button
        onClick={() => navigate("/")}
        className="absolute right-8 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white font-montserrat text-sm tracking-wider uppercase transition-all duration-300 hover:bg-white/20 hover:border-white/30 z-50"
        style={{
          bottom: `${bottomOffset}px`,
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        עברית
      </button>

      {/* Scroll Indicator */}
      <div 
        className="absolute left-1/2 transform -translate-x-1/2 animate-bounce"
        style={{
          bottom: `${bottomOffset}px`,
        }}
      >
        <div className="w-6 h-10 border-2 border-white/40 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-white/60 rounded-full animate-scroll" />
        </div>
      </div>
    </div>
  );
};

export default VideoHero;
