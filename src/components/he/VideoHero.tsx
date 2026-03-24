import { useNavigate } from "react-router-dom";
import { useSafeAreaBottom } from "@/hooks/useSafeAreaBottom";

interface VideoHeroProps {
  title: string;
  subtitle?: string;
  videoUrl?: string;
  imageUrl?: string;
}

const VideoHero = ({ title, subtitle, videoUrl, imageUrl }: VideoHeroProps) => {
  const navigate = useNavigate();
  const bottomOffset = useSafeAreaBottom(32);

  const defaultImage = "/images/en/hero-last-one.webp";
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
            srcSet="/images/en/hero-last-one-640w.webp 640w, /images/en/hero-last-one-1024w.webp 1024w, /images/en/hero-last-one.webp 1920w"
            sizes="100vw"
          />
          <img
            src={imageSrc}
            alt="רקע גיבור"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            decoding="async"
          />
        </picture>
      )}

      {/* Overlay - subtle uniform darkening */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center text-center px-4 -translate-y-[5%]">
        <div className="mb-10 animate-fade-in">
          <h1 className="reliz-hero-title text-white font-bold">
            {title}
          </h1>
          <p className="font-montserrat text-sm md:text-base text-white/90 tracking-widest">
            Properties
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in animation-delay-400" dir="rtl">
          <button
            onClick={() => navigate("/rentals")}
            className="px-14 py-5 bg-white/10 backdrop-blur-sm border border-white/80 text-white font-montserrat text-base tracking-wider uppercase transition-all duration-300 hover:bg-white hover:text-foreground"
          >
            השכרה
          </button>
          <button
            onClick={() => navigate("/sales")}
            className="px-14 py-5 bg-white/10 backdrop-blur-sm border border-white/80 text-white font-montserrat text-base tracking-wider uppercase transition-all duration-300 hover:bg-white hover:text-foreground"
          >
            קנייה
          </button>
        </div>
        <p className="font-montserrat text-xs md:text-sm tracking-[0.3em] mt-6 animate-fade-in animation-delay-400 font-bold" <p className="font-montserrat text-xs md:text-sm tracking-[0.3em] mt-6 animate-fade-in animation-delay-400 font-bold text-white">>
          Since 2008
        </p>
      </div>

      {/* Language Switcher - Bottom Right (opposite side from WhatsApp) */}
      <button
        onClick={() => navigate("/en")}
        className="absolute right-8 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md text-white font-montserrat text-sm tracking-wider uppercase transition-all duration-300 hover:bg-white/20 hover:border-white/30 z-50"
        style={{
          bottom: `${bottomOffset}px`,
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        English
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
