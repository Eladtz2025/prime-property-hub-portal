import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, TrendingUp, Users2, Check, Share2 } from 'lucide-react';

interface DivisionCardProps {
  title: string;
  description: string;
  image: string;
  features: string[];
  link: string;
  icon?: 'building' | 'trending' | 'users';
}

const DivisionCard = ({ title, description, image, features, link, icon = 'building' }: DivisionCardProps) => {
  const Icon = icon === 'building' ? Building : icon === 'trending' ? TrendingUp : Users2;
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 animate-fade-in h-full flex flex-col">
      <div className="aspect-video relative overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 md:top-4 md:left-4">
          <Button size="icon" className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary hover:bg-primary/90 shadow-lg">
            <Share2 className="h-3 w-3 md:h-4 md:w-4 text-white" />
          </Button>
        </div>
        <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 w-10 h-10 md:w-12 md:h-12 bg-primary rounded-full flex items-center justify-center shadow-lg">
          <Icon className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
        </div>
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