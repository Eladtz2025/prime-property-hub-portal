import { DollarSign } from 'lucide-react';

interface PriceOfferPriceCardProps {
  price: number;
  description?: string;
}

const PriceOfferPriceCard = ({ price, description }: PriceOfferPriceCardProps) => {
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('he-IL').format(value);
  };

  return (
    <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-lg p-8 shadow-card">
      <div className="flex items-center justify-center gap-3 mb-4">
        <DollarSign className="h-8 w-8 text-primary" />
        <h3 className="text-3xl font-bold text-primary">{formatPrice(price)} ₪</h3>
      </div>
      {description && (
        <p className="text-center text-muted-foreground">{description}</p>
      )}
    </div>
  );
};

export default PriceOfferPriceCard;
