import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { MiniSparkline } from './MiniSparkline';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type StatusColor = 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'gray';

interface ScoutMetricTileProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  statusColor?: StatusColor;
  delta?: number | null;
  sparklineData?: number[];
  hoverContent?: React.ReactNode;
  subtitle?: string;
}

const glowMap: Record<StatusColor, string> = {
  green: 'shadow-[0_0_18px_rgba(34,197,94,0.08)]',
  amber: 'shadow-[0_0_18px_rgba(245,158,11,0.08)]',
  red: 'shadow-[0_0_18px_rgba(239,68,68,0.08)]',
  blue: 'shadow-[0_0_18px_rgba(59,130,246,0.08)]',
  purple: 'shadow-[0_0_18px_rgba(168,85,247,0.08)]',
  gray: 'shadow-[0_0_18px_rgba(107,114,128,0.06)]',
};

const glowHoverMap: Record<StatusColor, string> = {
  green: 'hover:shadow-[0_0_24px_rgba(34,197,94,0.14)]',
  amber: 'hover:shadow-[0_0_24px_rgba(245,158,11,0.14)]',
  red: 'hover:shadow-[0_0_24px_rgba(239,68,68,0.14)]',
  blue: 'hover:shadow-[0_0_24px_rgba(59,130,246,0.14)]',
  purple: 'hover:shadow-[0_0_24px_rgba(168,85,247,0.14)]',
  gray: 'hover:shadow-[0_0_24px_rgba(107,114,128,0.10)]',
};

const bottomBarMap: Record<StatusColor, string> = {
  green: 'bg-green-500/60',
  amber: 'bg-amber-500/60',
  red: 'bg-red-500/60',
  blue: 'bg-blue-500/60',
  purple: 'bg-purple-500/60',
  gray: 'bg-muted-foreground/30',
};

const sparkColorMap: Record<StatusColor, string> = {
  green: 'rgb(34,197,94)',
  amber: 'rgb(245,158,11)',
  red: 'rgb(239,68,68)',
  blue: 'rgb(59,130,246)',
  purple: 'rgb(168,85,247)',
  gray: 'rgb(107,114,128)',
};

const DeltaBadge: React.FC<{ delta: number }> = ({ delta }) => {
  const isPositive = delta > 0;
  const isNeutral = delta === 0;

  if (isNeutral) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground">
        <Minus className="h-3 w-3" />
        ללא שינוי
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
        isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      }`}
    >
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? '+' : ''}{delta.toFixed(1)}%
    </span>
  );
};

export const ScoutMetricTile: React.FC<ScoutMetricTileProps> = ({
  label,
  value,
  icon,
  statusColor = 'gray',
  delta,
  sparklineData,
  hoverContent,
}) => {
  const formattedValue = typeof value === 'number' ? value.toLocaleString('he-IL') : value;

  const card = (
    <div
      className={`
        relative overflow-hidden rounded-2xl 
        bg-card/80 backdrop-blur-sm 
        border border-border/50
        ${glowMap[statusColor]} ${glowHoverMap[statusColor]}
        transition-all duration-300 hover:scale-[1.02]
        p-4 flex flex-col justify-between min-h-[110px]
        cursor-default group
      `}
    >
      {/* Icon - top right */}
      <div className="absolute top-3 left-3 opacity-40 group-hover:opacity-60 transition-opacity">
        {icon}
      </div>

      {/* Main content */}
      <div className="flex items-end justify-between gap-2 mt-1">
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-bold text-foreground leading-tight">
            {formattedValue}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{label}</p>
        </div>
        
        {/* Sparkline */}
        {sparklineData && sparklineData.length > 0 && (
          <MiniSparkline data={sparklineData} color={sparkColorMap[statusColor]} />
        )}
      </div>

      {/* Delta */}
      {delta !== null && delta !== undefined && (
        <div className="mt-2">
          <DeltaBadge delta={delta} />
        </div>
      )}

      {/* Bottom glow bar */}
      <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${bottomBarMap[statusColor]}`} />
    </div>
  );

  if (hoverContent) {
    return (
      <HoverCard openDelay={200} closeDelay={100}>
        <HoverCardTrigger asChild>{card}</HoverCardTrigger>
        <HoverCardContent side="bottom" className="w-56 text-xs" dir="rtl">
          {hoverContent}
        </HoverCardContent>
      </HoverCard>
    );
  }

  return card;
};
