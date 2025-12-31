import { useEffect, useRef, useState } from "react";

interface Stat {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
}

interface LuxuryStatsProps {
  stats: Stat[];
  title?: string;
}

const AnimatedNumber = ({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 2000;
          const steps = 60;
          const increment = value / steps;
          let current = 0;
          
          const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
              setDisplayValue(value);
              clearInterval(timer);
            } else {
              setDisplayValue(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, hasAnimated]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('he-IL').format(num);
  };

  return (
    <div ref={ref} className="font-serif text-4xl font-light text-gray-900 md:text-5xl lg:text-6xl">
      {prefix}{formatNumber(displayValue)}{suffix}
    </div>
  );
};

const LuxuryStats = ({ stats, title }: LuxuryStatsProps) => {
  if (!stats || stats.length === 0) return null;

  return (
    <div className="w-full">
      {title && (
        <h2 className="mb-16 text-center font-serif text-3xl font-light text-gray-900 md:text-4xl">
          {title}
        </h2>
      )}

      <div className={`grid gap-12 ${stats.length === 1 ? 'grid-cols-1' : stats.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <AnimatedNumber 
              value={stat.value} 
              prefix={stat.prefix} 
              suffix={stat.suffix} 
            />
            <p className="mt-4 text-sm font-light uppercase tracking-widest text-gray-500">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LuxuryStats;
