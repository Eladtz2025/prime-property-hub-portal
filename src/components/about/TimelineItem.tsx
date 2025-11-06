import { useEffect, useState, useRef, ReactNode } from "react";

interface TimelineItemProps {
  year: string;
  title: string;
  description?: string;
  icon: ReactNode;
  side: "left" | "right";
}

export const TimelineItem = ({ year, title, description, icon, side }: TimelineItemProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`relative mb-12 md:mb-16 transition-all duration-700 ${
        isVisible ? "opacity-100 translate-x-0" : `opacity-0 ${side === "left" ? "-translate-x-10" : "translate-x-10"}`
      }`}
    >
      {/* Mobile Layout - vertical with line on left */}
      <div className="md:hidden flex gap-4">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 border-4 border-primary flex items-center justify-center text-primary">
            {icon}
          </div>
          <div className="w-1 flex-1 bg-primary/20 mt-4" />
        </div>
        <div className="flex-1 pb-8">
          <div className="text-xl font-bold text-primary mb-2">{year}</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>

      {/* Desktop Layout - alternating sides */}
      <div className={`hidden md:flex items-center gap-8 ${side === "right" ? "flex-row-reverse" : ""}`}>
        <div className={`flex-1 ${side === "left" ? "text-right" : "text-left"}`}>
          <div className="text-2xl font-bold text-primary mb-2">{year}</div>
          <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        
        <div className="relative z-10">
          <div className="w-16 h-16 rounded-full bg-primary/10 border-4 border-primary flex items-center justify-center text-primary">
            {icon}
          </div>
        </div>
        
        <div className="flex-1" />
      </div>
    </div>
  );
};
