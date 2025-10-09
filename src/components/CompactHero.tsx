interface CompactHeroProps {
  title: string;
  subtitle?: string;
  backgroundImage: string;
}

const CompactHero = ({ title, subtitle, backgroundImage }: CompactHeroProps) => {
  return (
    <section className="relative h-[300px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${backgroundImage})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-luxury/70 via-luxury/50 to-luxury/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-luxury-foreground mb-3 animate-fade-in">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl text-secondary animate-fade-in">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
};

export default CompactHero;