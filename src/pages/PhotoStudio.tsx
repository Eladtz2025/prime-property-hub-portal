import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Wand2, Eraser, PenTool, Sofa } from 'lucide-react';
import { ImageGenerationTab } from '@/components/photo-studio/ImageGenerationTab';
import { AutoEnhanceTab } from '@/components/photo-studio/AutoEnhanceTab';
import { ElementRemovalTab } from '@/components/photo-studio/ElementRemovalTab';
import { ManualEditorTab } from '@/components/photo-studio/ManualEditorTab';
import { VirtualStagingTab } from '@/components/photo-studio/VirtualStagingTab';
import { PhotoStudioErrorBoundary } from '@/components/photo-studio/PhotoStudioErrorBoundary';

const PhotoStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState('generate');

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6" dir="rtl">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">סטודיו תמונות נדל"ן</h1>
        <p className="text-muted-foreground">
          צור, שפר ועריך תמונות נדל"ן באמצעות AI וכלים מתקדמים
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-muted/50">
          <TabsTrigger 
            value="generate" 
            className="flex items-center gap-2 py-3 data-[state=active]:bg-background"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">יצירת תמונות</span>
            <span className="sm:hidden">יצירה</span>
          </TabsTrigger>
          <TabsTrigger 
            value="enhance" 
            className="flex items-center gap-2 py-3 data-[state=active]:bg-background"
          >
            <Wand2 className="h-4 w-4" />
            <span className="hidden sm:inline">שיפור אוטומטי</span>
            <span className="sm:hidden">שיפור</span>
          </TabsTrigger>
          <TabsTrigger 
            value="staging" 
            className="flex items-center gap-2 py-3 data-[state=active]:bg-background"
          >
            <Sofa className="h-4 w-4" />
            <span className="hidden sm:inline">עיצוב ריהוט</span>
            <span className="sm:hidden">ריהוט</span>
          </TabsTrigger>
          <TabsTrigger 
            value="remove" 
            className="flex items-center gap-2 py-3 data-[state=active]:bg-background"
          >
            <Eraser className="h-4 w-4" />
            <span className="hidden sm:inline">הסרת אלמנטים</span>
            <span className="sm:hidden">הסרה</span>
          </TabsTrigger>
          <TabsTrigger 
            value="edit" 
            className="flex items-center gap-2 py-3 data-[state=active]:bg-background"
          >
            <PenTool className="h-4 w-4" />
            <span className="hidden sm:inline">עריכה ידנית</span>
            <span className="sm:hidden">עריכה</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-6">
          <PhotoStudioErrorBoundary tabName="יצירת תמונות">
            <ImageGenerationTab />
          </PhotoStudioErrorBoundary>
        </TabsContent>

        <TabsContent value="enhance" className="mt-6">
          <PhotoStudioErrorBoundary tabName="שיפור אוטומטי">
            <AutoEnhanceTab />
          </PhotoStudioErrorBoundary>
        </TabsContent>

        <TabsContent value="staging" className="mt-6">
          <PhotoStudioErrorBoundary tabName="עיצוב ריהוט">
            <VirtualStagingTab />
          </PhotoStudioErrorBoundary>
        </TabsContent>

        <TabsContent value="remove" className="mt-6">
          <PhotoStudioErrorBoundary tabName="הסרת אלמנטים">
            <ElementRemovalTab />
          </PhotoStudioErrorBoundary>
        </TabsContent>

        <TabsContent value="edit" className="mt-6">
          <PhotoStudioErrorBoundary tabName="עריכה ידנית">
            <ManualEditorTab />
          </PhotoStudioErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PhotoStudio;
