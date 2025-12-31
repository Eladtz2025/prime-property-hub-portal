import { useEffect, useRef, useState, ReactNode } from "react";

interface LuxurySectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

const LuxurySection = ({ children, className = "", id }: LuxurySectionProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id={id}
      className={`min-h-screen px-6 py-20 md:py-32 ${className} transition-all duration-1000 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      <div className="mx-auto max-w-6xl">
        {children}
      </div>
    </section>
  );
};

export default LuxurySection;
