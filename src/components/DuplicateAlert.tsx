import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Eye, Users, Merge } from 'lucide-react';
import { Property } from '../types/property';

interface DuplicateGroup {
  key: string;
  properties: Property[];
  duplicateType: 'phone';
}

interface DuplicateAlertProps {
  duplicateGroups: DuplicateGroup[];
  onViewGroup: (group: DuplicateGroup) => void;
  onMergeGroup: (group: DuplicateGroup) => void;
  onDismiss: () => void;
}

export const DuplicateAlert: React.FC<DuplicateAlertProps> = ({
  duplicateGroups,
  onViewGroup,
  onMergeGroup,
  onDismiss
}) => {
  const totalDuplicates = duplicateGroups.reduce((sum, group) => sum + group.properties.length, 0);
  
  const getDuplicateTypeText = (type: 'phone') => {
    return 'מספר טלפון זהה';
  };

  const getDuplicateTypeColor = (type: 'phone') => {
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  if (duplicateGroups.length === 0) return null;

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800">
        נמצאו כפילויות בנכסים!
      </AlertTitle>
      <AlertDescription className="space-y-4">
        <p className="text-orange-700">
          נמצאו {duplicateGroups.length} קבוצות כפילויות עם סך {totalDuplicates} נכסים כפולים.
        </p>
        
        <div className="space-y-3">
          {duplicateGroups.map((group, index) => (
            <div key={group.key} className="bg-white p-3 rounded-md border border-orange-200">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getDuplicateTypeColor(group.duplicateType)}>
                      {getDuplicateTypeText(group.duplicateType)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {group.properties.length} נכסים
                    </span>
                  </div>
                  
                  <div className="text-sm">
                    <div className="font-medium">{group.properties[0].address}</div>
                    <div className="text-muted-foreground">
                      בעלים: {group.properties.map(p => p.ownerName).join(', ')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewGroup(group)}
                  >
                    <Eye className="h-4 w-4 ml-1" />
                    צפה
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onMergeGroup(group)}
                    className="text-orange-700 border-orange-300 hover:bg-orange-50"
                  >
                    <Merge className="h-4 w-4 ml-1" />
                    מזג
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onDismiss}>
            סגור התראה
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};