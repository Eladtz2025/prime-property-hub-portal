import React from 'react';

interface DynamicSlideWrapperProps {
  backgroundImage?: string | null;
  overlayOpacity?: number;
  children: React.ReactNode;
}

const DynamicSlideWrapper = ({ 
  backgroundImage, 
  overlayOpacity = 0.85,
  children 
}: DynamicSlideWrapperProps) => {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Background Image */}
      {backgroundImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}
      
      {/* Warm Orange Overlay */}
      <div 
        className="absolute inset-0"
        style={{ 
          backgroundColor: `rgba(180, 120, 80, ${overlayOpacity})`,
          mixBlendMode: 'multiply'
        }}
      />
      
      {/* Dark gradient for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
      
      {/* Content */}
      <div className="relative h-full w-full z-10">
        {children}
      </div>
    </div>
  );
};

export default DynamicSlideWrapper;
