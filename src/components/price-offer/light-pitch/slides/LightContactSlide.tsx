import slideBg from "@/assets/light-pitch/slide-14-contact.jpg";
import { Phone, Mail, Globe, MessageCircle } from "lucide-react";

const LightContactSlide = () => {
  const whatsappUrl = "https://wa.me/972547669985?text=Hi, I'm interested in the property at 110 Ben Yehuda Street";

  return (
    <div 
      className="relative flex h-full w-full flex-col items-center justify-center"
      style={{
        backgroundImage: `url(${slideBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Content Box */}
      <div className="relative z-10 bg-[#8b7765]/80 backdrop-blur-sm rounded-lg p-8 md:p-12 mx-4 max-w-lg text-center">
        {/* Logo */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-3">
            <div className="flex gap-1">
              <div className="w-3 h-8 bg-[#4a9a9a] rounded-sm" />
              <div className="w-3 h-8 bg-[#f5c242] rounded-sm" />
              <div className="w-3 h-8 bg-[#e85c3a] rounded-sm" />
            </div>
            <span className="text-white text-xl font-light tracking-wider">
              City Market Properties
            </span>
          </div>
        </div>
        
        <h2 className="text-3xl md:text-4xl font-serif font-light text-white mb-6">
          Contact Us
        </h2>
        
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-center gap-3 text-white">
            <Phone className="w-5 h-5 text-[#f5c242]" />
            <span className="font-light">+972 54-766-9985</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-white">
            <Mail className="w-5 h-5 text-[#f5c242]" />
            <span className="font-light">info@ctmarketproperties.com</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-white">
            <Globe className="w-5 h-5 text-[#f5c242]" />
            <span className="font-light">www.ctmarketproperties.com</span>
          </div>
        </div>
        
        {/* WhatsApp Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20BA5C] text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          Contact via WhatsApp
        </a>
      </div>
    </div>
  );
};

export default LightContactSlide;
