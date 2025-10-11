import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface DivisionCardProps {
  title: string;
  description: string;
  image: string;
  features: string[];
  link: string;
}

const DivisionCard = ({ title, description, image, features, link }: DivisionCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 animate-fade-in h-full flex flex-col">
      <div className="aspect-video relative overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>
      <div className="p-4 sm:p-5 md:p-6 flex-1 flex flex-col">
        <h3 className="text-xl sm:text-2xl font-bold mb-2 md:mb-3">{title}</h3>
        <p className="text-sm sm:text-base text-muted-foreground mb-3 md:mb-4">{description}</p>
        <ul className="space-y-1.5 md:space-y-2 mb-4 md:mb-6 flex-1">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-xs sm:text-sm">
              <Check className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
              <span className="leading-tight">{feature}</span>
            </li>
          ))}
        </ul>
        <Button asChild className="w-full touch-target">
          <Link to={link}>קראו עוד</Link>
        </Button>
      </div>
    </Card>
  );
};

export default DivisionCard;