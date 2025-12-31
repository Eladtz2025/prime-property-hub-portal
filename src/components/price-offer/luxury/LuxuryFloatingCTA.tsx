import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LuxuryFloatingCTAProps {
  whatsappNumber?: string;
  propertyTitle?: string;
}

const LuxuryFloatingCTA = ({ whatsappNumber, propertyTitle }: LuxuryFloatingCTAProps) => {
  if (!whatsappNumber) return null;

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`שלום, אני מתעניין/ת ב${propertyTitle || 'נכס זה'}`);
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 md:bottom-8 md:left-8">
      <Button
        onClick={handleWhatsApp}
        size="lg"
        className="h-14 w-14 rounded-full bg-[#25D366] p-0 shadow-lg transition-transform hover:scale-110 hover:bg-[#128C7E] md:h-16 md:w-16"
      >
        <MessageCircle className="h-6 w-6 md:h-7 md:w-7" />
      </Button>
    </div>
  );
};

export default LuxuryFloatingCTA;
