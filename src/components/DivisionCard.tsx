import { Link } from 'react-router-dom';
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
    <Link to={link}>
      <div className="group relative aspect-[4/5] overflow-hidden cursor-pointer animate-fade-in" dir="rtl">
        <img
          src={image}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />

        <div className="reliz-card-overlay" />

        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-10 text-white text-right">
          <div className="mb-5 flex justify-end">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center">
              <Icon className="h-5 w-5 md:h-6 md:w-6 text-white/80" />
            </div>
          </div>

          <h3 className="font-playfair text-3xl md:text-4xl font-normal tracking-wide mb-5 md:mb-7">{title}</h3>

          <ul className="space-y-3 mb-0">
            {features.map((feature, index) => (
              <li key={index} className="text-xs md:text-sm">
                <span className="font-montserrat text-white/70 leading-relaxed tracking-wide">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Link>
  );
};

export default DivisionCard;