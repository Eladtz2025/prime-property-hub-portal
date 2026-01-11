interface LightPitchNavigationProps {
  currentSlide: number;
  totalSlides: number;
}

const LightPitchNavigation = ({
  currentSlide,
  totalSlides,
}: LightPitchNavigationProps) => {
  return (
    <>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-white/80">
          <span className="text-sm font-medium">
            {String(currentSlide + 1).padStart(2, '0')}/{String(totalSlides).padStart(2, '0')}
          </span>
          <div className="w-24 h-px bg-white/30" />
          <span className="text-sm font-light tracking-wider">Presentation</span>
        </div>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-6 py-4 flex items-center justify-between">
        <span className="text-white/60 text-sm font-light">2025</span>
        <div className="w-16 h-px bg-white/30" />
        <span className="text-white/60 text-sm font-light">www.ctmarketproperties.com</span>
      </div>
    </>
  );
};

export default LightPitchNavigation;
