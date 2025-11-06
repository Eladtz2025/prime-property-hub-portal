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
    <button
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 left-6 z-[9999] h-14 w-14 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 bg-[#25D366] hover:bg-[#128C7E] border-0 cursor-pointer flex items-center justify-center p-0"
      aria-label="צור קשר בוואטסאפ - WhatsApp"
    >
      <svg 
        viewBox="0 0 32 32" 
        className="h-12 w-12"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M16 0C7.164 0 0 7.164 0 16c0 2.832.744 5.488 2.048 7.792L0 32l8.416-2.208C10.656 31.168 13.248 32 16 32c8.836 0 16-7.164 16-16S24.836 0 16 0zm0 29.344c-2.528 0-4.928-.704-6.96-1.92l-.496-.288-5.152 1.344 1.376-5.024-.32-.512C2.88 21.024 2.112 18.592 2.112 16c0-7.68 6.208-13.888 13.888-13.888S29.888 8.32 29.888 16 23.68 29.344 16 29.344z"/>
        <path d="M23.36 19.712c-.384-.192-2.272-1.12-2.624-1.248-.352-.128-.608-.192-.864.192-.256.384-1.008 1.248-1.232 1.504-.224.256-.448.288-.832.096-.384-.192-1.632-.608-3.104-1.92-1.152-.992-1.92-2.24-2.144-2.624-.224-.384-.016-.608.176-.8.16-.16.384-.448.576-.672.192-.224.256-.384.384-.64.128-.256.064-.48-.032-.672-.096-.192-.864-2.08-1.184-2.848-.32-.736-.64-.64-.864-.64-.224 0-.48-.032-.736-.032s-.672.096-.992.48c-.352.384-1.28 1.248-1.28 3.04s1.312 3.52 1.504 3.776c.192.256 2.624 4 6.368 5.616.896.384 1.584.608 2.128.768.896.288 1.712.256 2.352.16.72-.128 2.272-.928 2.592-1.824.32-.896.32-1.664.224-1.824-.096-.16-.352-.256-.736-.448z"/>
      </svg>
    </button>
  );
};

export default WhatsAppFloat;
