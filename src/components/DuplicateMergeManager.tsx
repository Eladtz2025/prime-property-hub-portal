
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
  const [selectedSecondary, setSelectedSecondary] = useState<string>('');

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
    setSelectedSecondary('');
    setShowMergeDialog(true);
  };

  const handleMergeConfirm = () => {
    if (!selectedPrimary || !selectedSecondary) {
      toast({
        title: "שגיאה",
        description: "בחר נכס ראשי ונכס למיזוג",
        variant: "destructive",
      });
      return;
    }

    if (selectedPrimary === selectedSecondary) {
      toast({
        title: "שגיאה",
        description: "לא ניתן למזג נכס עם עצמו",
        variant: "destructive",
      });
      return;
    }

    const primaryProperty = properties.find(p => p.id === selectedPrimary);
    const secondaryProperty = properties.find(p => p.id === selectedSecondary);

    if (!primaryProperty || !secondaryProperty) {
      toast({
        title: "שגיאה",
        description: "נכס לא נמצא",
        variant: "destructive",
      });
      return;
    }

    onMerge(primaryProperty, secondaryProperty);
    setShowMergeDialog(false);
  };

  const availableSecondaryProperties = properties.filter(p => p.id !== selectedPrimary);

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
          <div className="grid gap-3">
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
                מזג נכסים
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
                המיזוג יאחד את הנתונים מהנכס השני לנכס הראשי וימחק את הנכס השני לצמיתות.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">נכס ראשי (יישמר):</label>
                <Select value={selectedPrimary} onValueChange={setSelectedPrimary}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר נכס ראשי" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {property.address}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">נכס למיזוג (יימחק):</label>
                <Select 
                  value={selectedSecondary} 
                  onValueChange={setSelectedSecondary}
                  disabled={!selectedPrimary}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר נכס למיזוג" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSecondaryProperties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {property.address}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedPrimary && selectedSecondary && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">תוצאת המיזוג:</h4>
                <div className="text-sm text-blue-700">
                  הנכס <strong>{properties.find(p => p.id === selectedPrimary)?.address}</strong> יישמר
                  עם כל הנתונים המשולבים, והנכס <strong>{properties.find(p => p.id === selectedSecondary)?.address}</strong> יימחק.
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              onClick={handleMergeConfirm}
              disabled={!selectedPrimary || !selectedSecondary || isLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Check className="h-4 w-4 ml-2" />
              )}
              אשר מיזוג
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
