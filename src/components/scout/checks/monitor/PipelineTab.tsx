import React from 'react';
import { Search, Shield, Users, Database, ChevronLeft } from 'lucide-react';
import { PipelineStage } from './useMonitorData';

const stageIcons: Record<string, React.ElementType> = {
  scraping: Search,
  availability: Shield,
  matching: Users,
  push: Database,
};

const stageColors: Record<string, { bar: string; glow: string; text: string }> = {
  scraping: { bar: 'bg-orange-500', glow: 'shadow-orange-500/20', text: 'text-orange-400' },
  availability: { bar: 'bg-blue-500', glow: 'shadow-blue-500/20', text: 'text-blue-400' },
  matching: { bar: 'bg-green-500', glow: 'shadow-green-500/20', text: 'text-green-400' },
  push: { bar: 'bg-teal-500', glow: 'shadow-teal-500/20', text: 'text-teal-400' },
};

interface PipelineTabProps {
  stages: PipelineStage[];
}

export const PipelineTab: React.FC<PipelineTabProps> = ({ stages }) => {
  return (
    <div className="h-full flex items-center justify-center p-4" dir="rtl">
      <div className="flex items-center gap-2 w-full max-w-3xl">
        {stages.map((stage, i) => {
          const Icon = stageIcons[stage.key] || Database;
          const colors = stageColors[stage.key] || stageColors.push;
          const isActive = stage.waiting > 0;

          return (
            <React.Fragment key={stage.key}>
              {/* Stage card */}
              <div className={`flex-1 rounded-xl border border-white/[0.06] bg-gray-900/60 p-3 transition-all ${isActive ? `shadow-lg ${colors.glow}` : ''}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg bg-white/5 ${isActive ? 'animate-pulse' : ''}`}>
                    <Icon className={`h-4 w-4 ${colors.text}`} />
                  </div>
                  <span className="text-xs font-medium text-gray-300">{stage.label}</span>
                </div>

                {/* Stats */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-bold text-white">{stage.processed.toLocaleString('he-IL')}</span>
                    <span className="text-[10px] text-gray-500">עברו</span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors.bar} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(100, stage.progressPct)}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    {stage.failed > 0 && (
                      <div className="text-red-400">
                        ✗ {stage.failed}
                      </div>
                    )}
                    {stage.avgLatency !== null && (
                      <div className="text-gray-500">
                        {(stage.avgLatency / 1000).toFixed(1)}s avg
                      </div>
                    )}
                    {stage.waiting > 0 && (
                      <div className="text-yellow-400/70">
                        ⏳ {stage.waiting} בתור
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Arrow between stages */}
              {i < stages.length - 1 && (
                <div className="shrink-0 flex items-center">
                  <ChevronLeft className="h-4 w-4 text-gray-700" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
