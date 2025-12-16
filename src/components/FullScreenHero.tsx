interface FullScreenHeroProps {
  title: string;
  subtitle?: string;
  backgroundImage: string;
  minHeight?: string;
  children?: React.ReactNode;
}
const FullScreenHero = ({
  title,
  subtitle,
  backgroundImage,
  minHeight = "70vh",
  children
}: FullScreenHeroProps) => {
  return <section className="relative flex items-center justify-center overflow-hidden" style={{
    minHeight,
    height: minHeight
  }}>
      {/* Background Image - cover all screen */}
      <div className="absolute inset-0 w-full h-full" style={{
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 animate-fade-in font-playfair">
          {title}
        </h1>
        {subtitle}
        {children}
      </div>
    </section>;
};
export default FullScreenHero;