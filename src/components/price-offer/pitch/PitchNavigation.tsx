import { X, MessageCircle } from "lucide-react";
import cityMarketLogo from "@/assets/city-market-icon.png";

interface PitchNavigationProps {
  currentSlide: number;
  totalSlides: number;
  onClose: () => void;
  propertyTitle: string;
}

const PitchNavigation = ({ onClose, propertyTitle }: PitchNavigationProps) => {
  const whatsappNumber = "972547669985";
  const whatsappMessage = encodeURIComponent(`שלום, אני מעוניין/ת לשמוע עוד על ${propertyTitle}`);
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 md:px-6 md:py-4 bg-gradient-to-b from-black/60 to-transparent">
      {/* Right Side - Logo */}
      <a 
        href="/"
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <img 
          src={cityMarketLogo} 
          alt="City Market Properties" 
          className="h-8 w-8 md:h-10 md:w-10"
        />
        <span className="text-sm md:text-base font-bold tracking-wide text-white/90 hidden sm:inline">
          City Market
        </span>
      </a>

      {/* Left Side - Minimal Actions */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center h-9 w-9 md:h-10 md:w-10 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
          title="WhatsApp"
        >
          <MessageCircle className="h-5 w-5" />
        </a>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="flex items-center justify-center h-9 w-9 md:h-10 md:w-10 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
          title="סגור"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default PitchNavigation;
