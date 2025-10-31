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
    <section className="relative h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${backgroundImage})`,
        }}
        role="img"
        aria-label={`${title} hero background`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-luxury/80 via-luxury/60 to-luxury/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-luxury-foreground mb-3 md:mb-4 animate-fade-in text-center leading-tight">
          {title}
        </h1>
        {subtitle && (
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-secondary mb-4 md:mb-6 animate-fade-in text-center leading-tight">
            {subtitle}
          </h2>
        )}
        {description && (
          <p className="text-sm sm:text-base md:text-lg font-semibold text-luxury-foreground/90 max-w-3xl mx-auto mb-6 md:mb-8 animate-fade-in text-center px-2">
            {description}
          </p>
        )}
        {children}
      </div>
    </section>
  );
};

export default Hero;