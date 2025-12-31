import { X, Download, MessageCircle, Globe } from "lucide-react";

interface PitchNavigationProps {
  currentSlide: number;
  totalSlides: number;
  onClose: () => void;
  propertyTitle: string;
}

const PitchNavigation = ({ currentSlide, totalSlides, onClose, propertyTitle }: PitchNavigationProps) => {
  const whatsappNumber = "972547669985";
  const whatsappMessage = encodeURIComponent(`שלום, אני מעוניין/ת לשמוע עוד על ${propertyTitle}`);
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/50 to-transparent">
      {/* Right Side - Logo & Back */}
      <div className="flex items-center gap-4">
        <a 
          href="/"
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <span className="text-xl font-bold tracking-wide">Nadlan</span>
        </a>
        <span className="text-white/30">|</span>
        <a 
          href="/"
          className="text-sm text-white/60 hover:text-white transition-colors"
        >
          חזרה לאתר
        </a>
      </div>

      {/* Center - Page indicator on mobile */}
      <div className="md:hidden text-white/60 text-sm">
        {currentSlide + 1} / {totalSlides}
      </div>

      {/* Left Side - Actions */}
      <div className="flex items-center gap-2">
        {/* PDF Export */}
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all"
          title="הורד PDF"
        >
          <Download className="h-4 w-4" />
          <span className="hidden md:inline">PDF</span>
        </button>

        {/* WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all"
          title="WhatsApp"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden md:inline">WhatsApp</span>
        </a>

        {/* Language Toggle */}
        <button
          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all"
          title="שפה"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden md:inline">עברית</span>
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="flex items-center justify-center h-10 w-10 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
          title="סגור"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default PitchNavigation;
