import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Megaphone, Lightbulb } from 'lucide-react';
import { PropertyWhatsAppTab } from '@/components/PropertyWhatsAppTab';
import { PropertyWhatsAppHistory } from '@/components/PropertyWhatsAppHistory';
import { WhatsAppAutomations } from '@/components/WhatsAppAutomations';
import { usePropertyData } from '@/hooks/usePropertyData';
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';

const MarketingHub: React.FC = () => {
  const { isMobile } = useMobileOptimization();
  const { properties } = usePropertyData();
  const { filteredProperties } = useAdvancedSearch(properties);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Megaphone className="h-6 w-6 text-primary" />
        <h2 className={`font-bold text-foreground ${isMobile ? 'text-xl' : 'text-3xl'}`}>שיווק</h2>
      </div>

      <Tabs defaultValue="whatsapp" className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="whatsapp" className="flex items-center gap-2 text-xs md:text-sm">
            <MessageSquare className="h-4 w-4" />
            {isMobile ? "ווטסאפ" : "ווטסאפ"}
          </TabsTrigger>
          <TabsTrigger value="advertising" className="flex items-center gap-2 text-xs md:text-sm">
            <Megaphone className="h-4 w-4" />
            {isMobile ? "פרסום" : "פרסום"}
          </TabsTrigger>
          <TabsTrigger value="other" className="flex items-center gap-2 text-xs md:text-sm">
            <Lightbulb className="h-4 w-4" />
            {isMobile ? "עוד" : "עוד"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp" className="space-y-4 mt-4">
          <Tabs defaultValue="send" className="w-full" dir="rtl">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="send" className="text-xs md:text-sm">
                {isMobile ? "הודעות" : "שליחת הודעות"}
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs md:text-sm">
                {isMobile ? "היסטוריה" : "היסטורית שיחות"}
              </TabsTrigger>
              <TabsTrigger value="automations" className="text-xs md:text-sm">
                {isMobile ? "אוטומציות" : "אוטומציות ווטסאפ"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="send">
              <PropertyWhatsAppTab 
                properties={filteredProperties}
                searchTerm=""
              />
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <PropertyWhatsAppHistory 
                properties={filteredProperties}
                onPropertySelect={() => {}}
              />
            </TabsContent>

            <TabsContent value="automations" className="space-y-4">
              <WhatsAppAutomations />
            </TabsContent>
          </Tabs>
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
