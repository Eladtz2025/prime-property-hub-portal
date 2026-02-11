import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, FileText, RefreshCw } from 'lucide-react';

// Note: This component shows a placeholder since edge function logs
// are not directly accessible from the client. In production, you'd
// use Supabase Management API or a dedicated logging edge function.
export const AvailabilityLogs: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                לוגים
              </CardTitle>
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-center py-6 text-muted-foreground text-sm space-y-2">
              <p>לוגי Edge Function זמינים בדשבורד Supabase</p>
              <p className="text-xs">
                Edge Functions → trigger-availability-check / check-property-availability → Logs
              </p>
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1"
                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
              >
                <RefreshCw className="h-3 w-3" />
                פתח דשבורד Supabase
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
