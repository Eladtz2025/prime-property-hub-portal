
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  AlertTriangle, 
  Users, 
  MapPin, 
  User,
  Loader2,
  Check
} from 'lucide-react';
import { Property } from '../types/property';
import { useToast } from "@/hooks/use-toast";

interface DuplicateMergeManagerProps {
  properties: Property[];
  phoneNumber: string;
  onMerge: (primaryProperty: Property, secondaryProperty: Property) => void;
  isLoading: boolean;
}

export const DuplicateMergeManager: React.FC<DuplicateMergeManagerProps> = ({
  properties,
  phoneNumber,
  onMerge,
  isLoading
}) => {
  const { toast } = useToast();
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [selectedPrimary, setSelectedPrimary] = useState<string>('');
  const [mergeMode, setMergeMode] = useState<'single' | 'all'>('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-green-100 text-green-800 border-green-200';
      case 'vacant': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'maintenance': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'occupied': return 'תפוס';
      case 'vacant': return 'פנוי';
      case 'maintenance': return 'תחזוקה';
      default: return status;
    }
  };

  const handleMergeStart = () => {
    if (properties.length < 2) {
      toast({
        title: "שגיאה",
        description: "נדרשים לפחות 2 נכסים למיזוג",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedPrimary('');
    setShowMergeDialog(true);
  };

  const handleMergeConfirm = () => {
    if (!selectedPrimary) {
      toast({
        title: "שגיאה",
        description: "בחר נכס ראשי",
        variant: "destructive",
      });
      return;
    }

    const primaryProperty = properties.find(p => p.id === selectedPrimary);
    if (!primaryProperty) {
      toast({
        title: "שגיאה",
        description: "נכס ראשי לא נמצא",
        variant: "destructive",
      });
      return;
    }

    // For "all" mode, merge all other properties into the primary one
    if (mergeMode === 'all') {
      const secondaryProperties = properties.filter(p => p.id !== selectedPrimary);
      
      // Merge all properties one by one
      secondaryProperties.forEach(secondaryProperty => {
        onMerge(primaryProperty, secondaryProperty);
      });
    }

    setShowMergeDialog(false);
    
    toast({
      title: "הנכסים מוזגו בהצלחה",
      description: `כל הנכסים מוזגו לנכס ${primaryProperty.address}`,
    });
  };

  return (
    <>
      <Card className="border-orange-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            {phoneNumber}
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              {properties.length} נכסים
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            {properties.map((property) => (
              <div 
                key={property.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{property.address}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{property.ownerName}</span>
                      <Badge className={getStatusColor(property.status)}>
                        {getStatusText(property.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {properties.length >= 2 && (
            <div className="flex justify-center pt-2">
              <Button
                onClick={handleMergeStart}
                disabled={isLoading}
                variant="outline"
                className="border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <Users className="h-4 w-4 ml-2" />
                )}
                מזג כל הנכסים
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Merge Dialog */}
      <Dialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              מיזוג נכסים - {phoneNumber}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold text-orange-800">אזהרה - פעולה בלתי הפיכה</h3>
              </div>
              <p className="text-sm text-orange-700">
                המיזוג יאחד את כל הנתונים מכל הנכסים לנכס הראשי שתבחר וימחק את שאר הנכסים לצמיתות.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                בחר נכס ראשי (כל הנכסים האחרים יימחקו ויתמזגו אליו):
              </label>
              <Select value={selectedPrimary} onValueChange={setSelectedPrimary}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר נכס ראשי שישמר" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{property.address}</div>
                          <div className="text-sm text-muted-foreground">
                            {property.ownerName} - {getStatusText(property.status)}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPrimary && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">תוצאת המיזוג:</h4>
                <div className="text-sm text-blue-700">
                  הנכס <strong>{properties.find(p => p.id === selectedPrimary)?.address}</strong> יישמר
                  עם כל הנתונים המשולבים מכל הנכסים האחרים.
                  <br />
                  <strong>{properties.length - 1} נכסים אחרים יימחקו.</strong>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              onClick={handleMergeConfirm}
              disabled={!selectedPrimary || isLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Check className="h-4 w-4 ml-2" />
              )}
              אשר מיזוג כל הנכסים
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowMergeDialog(false)}
              disabled={isLoading}
            >
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
