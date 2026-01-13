import { Phone, MessageCircle, Mail } from 'lucide-react';
import DynamicSlideWrapper from './DynamicSlideWrapper';
import cityMarketLogo from "@/assets/city-market-icon.png";

interface DynamicContactSlideProps {
  data: Record<string, unknown>;
  backgroundImage?: string | null;
  overlayOpacity?: number;
  themeColor?: string;
  language?: 'he' | 'en';
  contactPhone?: string | null;
  contactWhatsapp?: string | null;
  agentNames?: string | null;
}

const DynamicContactSlide = ({ 
  data, 
  backgroundImage, 
  overlayOpacity,
  language = 'en',
  contactPhone,
  contactWhatsapp,
}: DynamicContactSlideProps) => {
  const title = (data?.title as string) || (language === 'he' ? 'צור קשר' : "Let's Connect");
  const phone = (data?.phone as string) || contactPhone || '';
  const whatsapp = (data?.whatsapp as string) || contactWhatsapp || '';
  const email = (data?.email as string) || '';
  const callToAction = (data?.callToAction as string) || (language === 'he' ? 'תזמנו סיור היום' : 'Schedule a Viewing Today');

  const formatWhatsAppNumber = (num: string) => {
    return num.replace(/[^0-9]/g, '');
  };

  return (
    <DynamicSlideWrapper backgroundImage={backgroundImage} overlayOpacity={overlayOpacity}>
      <div className="h-full w-full flex flex-col justify-center items-center p-8 md:p-16" dir={language === 'he' ? 'rtl' : 'ltr'}>
        {/* Title */}
        <h2 
          className="text-3xl md:text-5xl font-bold text-white mb-4 text-center"
          style={{ textShadow: '0 4px 30px rgba(0,0,0,0.7)' }}
        >
          {title}
        </h2>
        
        {/* CTA */}
        <p 
          className="text-xl text-white/90 mb-12 text-center"
          style={{ textShadow: '0 2px 15px rgba(0,0,0,0.5)' }}
        >
          {callToAction}
        </p>
        
        {/* Contact Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          {phone && (
            <a 
              href={`tel:${phone}`}
              className="flex items-center gap-3 bg-[#f5c242] hover:bg-[#e5b232] text-[#2d3b3a] font-semibold px-8 py-4 rounded-xl transition-all"
            >
              <Phone className="h-6 w-6" />
              <span>{language === 'he' ? 'התקשר עכשיו' : 'Call Now'}</span>
            </a>
          )}
          
          {whatsapp && (
            <a 
              href={`https://wa.me/${formatWhatsAppNumber(whatsapp)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-4 rounded-xl transition-all"
            >
              <MessageCircle className="h-6 w-6" />
              <span>WhatsApp</span>
            </a>
          )}
          
          {email && (
            <a 
              href={`mailto:${email}`}
              className="flex items-center gap-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-xl transition-all"
            >
              <Mail className="h-6 w-6" />
              <span>Email</span>
            </a>
          )}
        </div>
        
        {/* Logo */}
        <img 
          src={cityMarketLogo} 
          alt="City Market Properties" 
          className="h-16 md:h-20 w-auto"
        />
      </div>
    </DynamicSlideWrapper>
  );
};

export default DynamicContactSlide;
