import { ReactNode } from 'react';

interface HeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  backgroundImage: string;
  children?: ReactNode;
}

const Hero = ({ title, subtitle, description, backgroundImage, children }: HeroProps) => {
  return (
    <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${backgroundImage})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-luxury/80 via-luxury/60 to-luxury/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-luxury-foreground mb-4 animate-fade-in">
          {title}
        </h1>
        {subtitle && (
          <h2 className="text-2xl md:text-3xl font-bold text-secondary mb-6 animate-fade-in">
            {subtitle}
          </h2>
        )}
        {description && (
          <p className="text-base md:text-lg font-semibold text-luxury-foreground/90 max-w-3xl mx-auto mb-8 animate-fade-in">
            {description}
          </p>
        )}
        {children}
      </div>
    </section>
  );
};

export default Hero;