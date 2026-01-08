interface Stat {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  format: "price" | "number" | "percent";
}

interface StatsSlideProps {
  title: string;
  stats: Stat[];
}

const formatValue = (stat: Stat): string => {
  if (stat.format === "price") {
    return `${stat.prefix || ""}${(stat.value / 1000000).toFixed(1)}M`;
  }
  if (stat.format === "percent") {
    return `${stat.value}${stat.suffix || ""}`;
  }
  return `${stat.prefix || ""}${stat.value.toLocaleString()}`;
};

const StatsSlide = ({ title, stats }: StatsSlideProps) => {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-start px-4 md:px-8 pt-16 md:pt-20 pb-28 md:pb-32 overflow-y-auto">
      {/* Title */}
      <h2 className="font-playfair text-4xl md:text-5xl text-white mb-16 text-center">
        {title}
      </h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:gap-8 max-w-4xl w-full">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="flex flex-col items-center justify-center p-4 md:p-8 lg:p-12 border border-white/10 rounded-2xl backdrop-blur-sm bg-gradient-to-br from-white/5 to-white/0"
          >
            <span className="text-2xl md:text-4xl lg:text-6xl font-bold text-white mb-2 md:mb-4 tabular-nums" dir="ltr">
              {formatValue(stat)}
            </span>
            <span className="text-sm md:text-base text-white/60 font-light text-center">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsSlide;
