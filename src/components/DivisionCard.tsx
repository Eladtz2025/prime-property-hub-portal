import { Link } from 'react-router-dom';
import { Building, TrendingUp, Users2, ArrowLeft } from 'lucide-react';

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
      <div className="group relative aspect-[4/5] overflow-hidden cursor-pointer animate-fade-in">
        {/* Image */}
        <img
          src={image}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="reliz-card-overlay" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 text-white">
          {/* Icon */}
          <div className="mb-4">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Icon className="h-6 w-6 md:h-7 md:w-7 text-white" />
            </div>
          </div>

          {/* Title */}
          <h3 className="reliz-property-title mb-3 md:mb-4">{title}</h3>
          
          {/* Description */}
          <p className="font-montserrat text-sm md:text-base text-white/80 mb-4 md:mb-6 leading-relaxed">
            {description}
          </p>

          {/* Features */}
          <ul className="space-y-2 mb-6 md:mb-8">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-xs md:text-sm">
                <div className="w-1 h-1 rounded-full bg-white/60 mt-1.5 flex-shrink-0" />
                <span className="font-montserrat text-white/70 leading-tight">{feature}</span>
              </li>
            ))}
          </ul>

          {/* Action */}
          <div className="flex items-center gap-2 text-white font-montserrat text-sm tracking-wide group-hover:gap-3 transition-all">
            <span>Learn More</span>
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          </div>

          {/* Hover Line */}
          <div className="mt-4 h-px bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-right" />
        </div>
      </div>
    </Link>
  );
};

export default DivisionCard;