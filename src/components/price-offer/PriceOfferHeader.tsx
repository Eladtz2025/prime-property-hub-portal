import { Building2, DollarSign } from 'lucide-react';

interface PriceOfferHeaderProps {
  title: string;
  details: string | null;
  priceMin: number | null;
  priceMax: number | null;
  incomeMin: number | null;
  incomeMax: number | null;
  language: string;
}

const PriceOfferHeader = ({
  title,
  details,
  priceMin,
  priceMax,
  incomeMin,
  incomeMax,
  language
}: PriceOfferHeaderProps) => {
  const isRTL = language === 'he';
  
  const formatPrice = (price: number | null) => {
    if (!price) return '';
    return new Intl.NumberFormat(isRTL ? 'he-IL' : 'en-US').format(price);
  };

  const formatPriceRange = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max && min !== max) {
      return `${formatPrice(min)} - ${formatPrice(max)}`;
    }
    return formatPrice(min || max);
  };

  const priceRange = formatPriceRange(priceMin, priceMax);
  const incomeRange = formatPriceRange(incomeMin, incomeMax);

  return (
    <div className="bg-card border border-border rounded-lg p-6 sm:p-8 shadow-card">
      {/* Title */}
      <div className="flex items-start gap-3 mb-4">
        <Building2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h1>
      </div>

      {/* Details */}
      {details && (
        <p className="text-muted-foreground mb-6 leading-relaxed whitespace-pre-line">
          {details}
        </p>
      )}

      {/* Price Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {priceRange && (
          <div className="bg-primary-light rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">
                {isRTL ? 'מחיר מוצע' : 'Suggested Price'}
              </span>
            </div>
            <p className="text-xl font-bold text-foreground">{priceRange} ₪</p>
          </div>
        )}

        {incomeRange && (
          <div className="bg-secondary-light rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-secondary" />
              <span className="text-sm font-medium text-secondary">
                {isRTL ? 'הכנסה צפויה' : 'Expected Income'}
              </span>
            </div>
            <p className="text-xl font-bold text-foreground">{incomeRange} ₪</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceOfferHeader;
