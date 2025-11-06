import { ReactNode, useEffect, useState, useRef } from "react";

interface ScrollAnimatedProps {
  children: ReactNode;
  animation?: string;
  delay?: number;
  className?: string;
}

export const ScrollAnimated = ({ 
  children, 
  animation = "fade-in", 
  delay = 0,
  className = ""
}: ScrollAnimatedProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={ref}
      className={`transition-all duration-700 ${
        isVisible ? `animate-${animation}` : 'opacity-0 translate-y-4'
      } ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};
