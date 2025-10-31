import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';

const WhatsAppFloat = () => {
  const location = useLocation();
  
  // Hide on property detail pages
  const isPropertyDetailPage = location.pathname.includes('/property/');
  
  if (isPropertyDetailPage) return null;

  const handleWhatsAppClick = () => {
    const phone = '972545503055';
    const message = 'שלום, אני מעוניין/ת לקבל מידע נוסף';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <Button
      onClick={handleWhatsAppClick}
      size="lg"
      className="fixed bottom-6 left-6 z-[9999] h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform bg-[#25D366] hover:bg-[#20BA5A] text-white"
      aria-label="צור קשר בוואטסאפ - WhatsApp"
    >
      <MessageCircle className="h-6 w-6" aria-hidden="true" />
    </Button>
  );
};

export default WhatsAppFloat;