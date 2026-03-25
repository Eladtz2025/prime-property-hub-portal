import { Link } from 'react-router-dom';

interface DivisionCardProps {
  title: string;
  description?: string;
  image: string;
  features?: string[];
  link: string;
  icon?: 'building' | 'trending' | 'users';
}

const DivisionCard = ({ title, image, link }: DivisionCardProps) => {
  return (
    <Link to={link}>
      <div className="group relative aspect-[3/4] overflow-hidden cursor-pointer animate-fade-in" dir="ltr">
        <img
          src={image}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent transition-all duration-500 group-hover:from-black/60" />

        <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 px-6 text-white">
          <h3 className="font-playfair text-4xl md:text-5xl font-normal tracking-wide transition-transform duration-500 group-hover:-translate-y-1">
            {title}
          </h3>
          <div className="w-12 h-px bg-secondary/50 mt-4 transition-all duration-500 group-hover:w-20 group-hover:bg-secondary/80" />
        </div>
      </div>
    </Link>
  );
};

export default DivisionCard;
