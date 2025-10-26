import { Building2 } from 'lucide-react';

interface PriceOfferHeaderProps {
  title: string;
  details: string | null;
  language: string;
}

const PriceOfferHeader = ({
  title,
  details,
  language
}: PriceOfferHeaderProps) => {
  const isRTL = language === 'he';

  return (
    <div className="bg-card border border-border rounded-lg p-6 sm:p-8 shadow-card">
      {/* Title and Logo in same row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3 flex-1">
          <Building2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h1>
        </div>
        
        {/* Logo */}
        <a 
          href="https://www.ctmarketproperties.com/en" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex-shrink-0"
        >
          <img 
            src="/city-market-logo.png" 
            alt="City Market Properties" 
            className="h-12 sm:h-16 w-auto hover:opacity-80 transition-opacity cursor-pointer"
          />
        </a>
      </div>

      {/* Details */}
      {details && (
        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
          {details}
        </p>
      )}
    </div>
  );
};

export default PriceOfferHeader;
