import React, { useState } from 'react';
import { ChevronDown, Users2, FileText } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FacebookGroupsManager } from './FacebookGroupsManager';
import { SocialTemplatesManager } from './SocialTemplatesManager';

export const SocialToolsPanel: React.FC = () => {
  const [groupsOpen, setGroupsOpen] = useState(true);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  return (
    <div className="space-y-2">
      <Collapsible open={groupsOpen} onOpenChange={setGroupsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm font-medium">
          <span className="flex items-center gap-2">
            <Users2 className="h-3.5 w-3.5" />
            קבוצות פייסבוק
          </span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${groupsOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <FacebookGroupsManager />
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={templatesOpen} onOpenChange={setTemplatesOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm font-medium">
          <span className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" />
            תבניות פוסטים
          </span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${templatesOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <SocialTemplatesManager />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
