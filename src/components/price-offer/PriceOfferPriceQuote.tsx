import { Card } from '@/components/ui/card';

interface PriceOfferPriceQuoteProps {
  data: {
    salePublicationMin?: string;
    salePublicationMax?: string;
    saleExpectedMin?: string;
    saleExpectedMax?: string;
    rentalPublicationMin?: string;
    rentalPublicationMax?: string;
    rentalExpectedMin?: string;
    rentalExpectedMax?: string;
  };
}

const PriceOfferPriceQuote = ({ data }: PriceOfferPriceQuoteProps) => {
  const formatRange = (min?: string, max?: string, suffix: string = '') => {
    if (!min && !max) return null;
    if (!min) return `${max}${suffix}`;
    if (!max) return `${min}${suffix}`;
    return `${min}–${max}${suffix}`;
  };

  const hasSale = data.salePublicationMin || data.salePublicationMax || data.saleExpectedMin || data.saleExpectedMax;
  const hasRental = data.rentalPublicationMin || data.rentalPublicationMax || data.rentalExpectedMin || data.rentalExpectedMax;

  if (!hasSale && !hasRental) {
    return null;
  }

  const salePublication = formatRange(data.salePublicationMin, data.salePublicationMax, ' מ׳');
  const saleExpected = formatRange(data.saleExpectedMin, data.saleExpectedMax, ' מ׳');
  const rentalPublication = formatRange(data.rentalPublicationMin, data.rentalPublicationMax);
  const rentalExpected = formatRange(data.rentalExpectedMin, data.rentalExpectedMax);

  return (
    <Card className="p-6 bg-muted/30" dir="rtl">
      <h3 className="text-xl font-bold mb-4">הצעת מחיר:</h3>
      <div className="space-y-2">
        {hasSale && (
          <div className="flex items-start gap-2">
            <span className="text-lg">•</span>
            <div>
              <span className="font-semibold">מכירה:</span>
              {salePublication && (
                <span> פרסום ₪{salePublication}</span>
              )}
              {salePublication && saleExpected && <span> | </span>}
              {saleExpected && (
                <span>צפי סגירה ₪{saleExpected}</span>
              )}
            </div>
          </div>
        )}
        
        {hasRental && (
          <div className="flex items-start gap-2">
            <span className="text-lg">•</span>
            <div>
              <span className="font-semibold">השכרה:</span>
              {rentalPublication && (
                <span> פרסום ₪{rentalPublication}</span>
              )}
              {rentalPublication && rentalExpected && <span> | </span>}
              {rentalExpected && (
                <span>צפי סגירה ₪{rentalExpected} לחודש</span>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PriceOfferPriceQuote;