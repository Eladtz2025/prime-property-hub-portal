import React from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { List, ChevronDown } from 'lucide-react';
import { useQueuePublishHistory } from '@/hooks/useAutoPublish';
import { cn } from '@/lib/utils';

interface RotationListProps {
  queueId: string;
  filteredProperties: any[];
  currentIndex: number;
}

export const RotationList: React.FC<RotationListProps> = ({ queueId, filteredProperties, currentIndex }) => {
  const { data: logs } = useQueuePublishHistory(queueId);
  const [open, setOpen] = React.useState(false);

  if (!filteredProperties.length) return null;

  const totalProps = filteredProperties.length;
  const safeIndex = currentIndex % totalProps;
  const cycle = Math.floor(currentIndex / totalProps) + 1;

  // Build a map: property_id -> latest published_at
  const publishMap = new Map<string, string>();
  if (logs) {
    for (const log of logs) {
      if (log.property_id && log.status === 'success' && !publishMap.has(log.property_id)) {
        publishMap.set(log.property_id, log.published_at);
      }
    }
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5 gap-1 text-muted-foreground w-full justify-start">
          <List className="h-2.5 w-2.5" />
          📋 סדר פרסום (סבב {cycle})
          <ChevronDown className={cn("h-2.5 w-2.5 transition-transform", open && "rotate-180")} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 space-y-0.5 max-h-[200px] overflow-y-auto">
          {filteredProperties.map((prop, idx) => {
            const isNext = idx === safeIndex;
            const isPast = idx < safeIndex;
            const publishDate = publishMap.get(prop.id);
            const address = prop.address || prop.neighborhood || prop.city || 'ללא כתובת';
            const price = prop.monthly_rent ? `₪${Number(prop.monthly_rent).toLocaleString()}` : '';

            return (
              <div
                key={prop.id}
                className={cn(
                  "flex items-center justify-between rounded px-2 py-1 text-[10px]",
                  isNext && "bg-primary/10 font-semibold border border-primary/20",
                  isPast && publishDate && "text-muted-foreground",
                  !isNext && !isPast && "text-muted-foreground"
                )}
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="shrink-0">
                    {isPast && publishDate ? '✅' : isNext ? '⏭️' : '🔜'}
                  </span>
                  <span className="truncate">
                    {address}{price ? ` — ${price}` : ''}
                  </span>
                </span>
                <span className="text-[9px] shrink-0 mr-2">
                  {isPast && publishDate
                    ? new Date(publishDate).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' })
                    : isNext
                      ? 'הבא בתור'
                      : ''}
                </span>
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
