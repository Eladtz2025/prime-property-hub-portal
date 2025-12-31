import { MessageCircle, Phone, Mail } from "lucide-react";

interface ContactSlideProps {
  title: string;
  subtitle?: string;
  whatsappNumber: string;
  propertyTitle: string;
}

const ContactSlide = ({ title, subtitle, whatsappNumber, propertyTitle }: ContactSlideProps) => {
  const whatsappMessage = encodeURIComponent(`שלום, אני מעוניין/ת לשמוע עוד על ${propertyTitle}`);
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center px-8 pt-24 pb-32">
      {/* Title */}
      <h2 className="font-playfair text-4xl md:text-5xl text-white mb-6 text-center">
        {title}
      </h2>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-lg md:text-xl text-white/60 font-light mb-16 text-center max-w-xl">
          {subtitle}
        </p>
      )}

      {/* WhatsApp Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full text-white text-xl font-medium shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 transition-all duration-300"
      >
        <MessageCircle className="h-7 w-7 group-hover:scale-110 transition-transform" />
        <span>שלחו לי הודעה בוואטסאפ</span>
      </a>

      {/* Alternative Contact */}
      <div className="mt-16 flex flex-col items-center gap-4">
        <span className="text-white/40 text-sm">או התקשרו אלינו</span>
        <div className="flex items-center gap-8">
          <a
            href={`tel:${whatsappNumber}`}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <Phone className="h-5 w-5" />
            <span dir="ltr">+972 54-766-9985</span>
          </a>
        </div>
      </div>

      {/* Footer Logo */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2">
        <span className="text-xl font-bold tracking-[0.3em] text-white/20 uppercase">Nadlan</span>
      </div>
    </div>
  );
};

export default ContactSlide;
