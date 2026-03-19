import React from 'react';

interface PieSlice {
  label: string;
  value: number;
  color: string;
}

interface ScoutPieChartProps {
  title: string;
  data: PieSlice[];
}

export const ScoutPieChart: React.FC<ScoutPieChartProps> = ({ title, data }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <div className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-4 flex flex-col items-center justify-center min-h-[160px]">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-2">אין נתונים</p>
      </div>
    );
  }

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const slices = data
    .filter(d => d.value > 0)
    .map(d => {
      const pct = d.value / total;
      const dash = pct * circumference;
      const slice = { ...d, pct, dash, offset };
      offset += dash;
      return slice;
    });

  return (
    <div className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-4 flex flex-col items-center min-h-[160px] transition-all duration-300 hover:shadow-md">
      <p className="text-[11px] font-medium text-muted-foreground mb-2">{title}</p>
      
      <svg width="88" height="88" viewBox="0 0 88 88" className="shrink-0">
        {slices.map((s, i) => (
          <circle
            key={i}
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth="12"
            strokeDasharray={`${s.dash} ${circumference - s.dash}`}
            strokeDashoffset={-s.offset}
            className="transition-all duration-500"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '44px 44px' }}
          />
        ))}
        <text x="44" y="44" textAnchor="middle" dominantBaseline="central" className="fill-foreground text-[13px] font-bold">
          {total.toLocaleString('he-IL')}
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-[10px] text-muted-foreground">
              {s.label} {(s.pct * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
