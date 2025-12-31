import { Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LuxuryContactProps {
  title?: string;
  subtitle?: string;
  whatsappNumber?: string;
  propertyTitle?: string;
}

const LuxuryContact = ({ title, subtitle, whatsappNumber, propertyTitle }: LuxuryContactProps) => {
  const handleWhatsApp = () => {
    if (!whatsappNumber) return;
    const message = encodeURIComponent(`שלום, אני מתעניין/ת ב${propertyTitle || 'נכס זה'}`);
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="w-full py-20 text-center">
      <h2 className="mb-4 font-serif text-3xl font-light text-gray-900 md:text-4xl lg:text-5xl">
        {title || "מעוניינים לשמוע עוד?"}
      </h2>
      {subtitle && (
        <p className="mx-auto mb-12 max-w-xl text-lg font-light text-gray-500">
          {subtitle}
        </p>
      )}

      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
        {whatsappNumber && (
          <Button
            onClick={handleWhatsApp}
            size="lg"
            className="gap-2 bg-[#25D366] px-8 py-6 text-lg font-light hover:bg-[#128C7E]"
          >
            <MessageCircle className="h-5 w-5" />
            שלחו הודעה בוואטסאפ
          </Button>
        )}
      </div>
    </div>
  );
};

export default LuxuryContact;
