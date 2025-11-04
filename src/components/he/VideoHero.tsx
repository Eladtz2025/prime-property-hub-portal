import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface VideoHeroProps {
  title: string;
  subtitle: string;
  videoUrl?: string;
  imageUrl?: string;
}

const VideoHero = ({ title, subtitle, videoUrl, imageUrl }: VideoHeroProps) => {
  const navigate = useNavigate();

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
        <img
          src={imageUrl || "/images/en/hero-last-one.png"}
          alt="רקע גיבור"
          className="absolute inset-0 w-full h-full object-cover scale-105 animate-slow-zoom"
        />
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
            onClick={() => navigate("/sales")}
            className="px-8 py-3 bg-white text-foreground font-montserrat text-sm tracking-wider uppercase transition-all duration-300 hover:bg-white/90"
          >
            קנייה
          </button>
          <button
            onClick={() => navigate("/rentals")}
            className="px-8 py-3 border-2 border-white text-white font-montserrat text-sm tracking-wider uppercase transition-all duration-300 hover:bg-white hover:text-foreground"
          >
            השכרה
          </button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/40 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-white/60 rounded-full animate-scroll" />
        </div>
      </div>
    </div>
  );
};

export default VideoHero;
