import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Megaphone, Lightbulb } from 'lucide-react';
import { WhatsAppCompose } from '@/components/WhatsAppCompose';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';

const MarketingHub: React.FC = () => {
  const { isMobile } = useMobileOptimization();

  return (
    <div className="space-y-4">

      <Tabs defaultValue="whatsapp" className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="whatsapp" className="flex items-center gap-2 text-xs md:text-sm">
            <MessageSquare className="h-4 w-4" />
            ווטסאפ
          </TabsTrigger>
          <TabsTrigger value="advertising" className="flex items-center gap-2 text-xs md:text-sm">
            <Megaphone className="h-4 w-4" />
            פרסום
          </TabsTrigger>
          <TabsTrigger value="other" className="flex items-center gap-2 text-xs md:text-sm">
            <Lightbulb className="h-4 w-4" />
            עוד
          </TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp" className="space-y-4 mt-4">
          <WhatsAppCompose />
          <WhatsAppRecentChats />
        </TabsContent>

        <TabsContent value="advertising" className="mt-4">
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <p className="text-muted-foreground text-lg">בקרוב — כלי פרסום</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="other" className="mt-4">
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <p className="text-muted-foreground text-lg">בקרוב</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketingHub;
