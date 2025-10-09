import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, TrendingUp, Users2 } from 'lucide-react';

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
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 animate-fade-in">
      <div className="aspect-video relative overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute bottom-4 right-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg">
          <Icon className="h-6 w-6 text-primary-foreground" />
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-2xl font-bold mb-3">{title}</h3>
        <p className="text-muted-foreground mb-4">{description}</p>
        <ul className="space-y-2 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button asChild className="w-full">
          <Link to={link}>למידע נוסף</Link>
        </Button>
      </div>
    </Card>
  );
};

export default DivisionCard;