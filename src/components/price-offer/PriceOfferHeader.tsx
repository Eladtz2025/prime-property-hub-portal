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
      {/* Title */}
      <div className="flex items-start gap-3 mb-4">
        <Building2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h1>
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
