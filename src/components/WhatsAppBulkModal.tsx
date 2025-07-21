
import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageSquare, Send, Users } from 'lucide-react';
import { Property } from '../types/property';
import { getPropertiesWithPhones, replaceMessageVariables, openWhatsApp } from '../utils/whatsappHelper';

interface WhatsAppBulkModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
}

export const WhatsAppBulkModal: React.FC<WhatsAppBulkModalProps> = ({
  isOpen,
  onClose,
  properties
}) => {
  const [message, setMessage] = useState('');
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const propertiesWithPhones = useMemo(() => {
    return getPropertiesWithPhones(properties);
  }, [properties]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProperties(propertiesWithPhones.map(p => p.id));
    } else {
      setSelectedProperties([]);
    }
  };

  const handlePropertySelect = (propertyId: string, checked: boolean) => {
    if (checked) {
      setSelectedProperties(prev => [...prev, propertyId]);
    } else {
      setSelectedProperties(prev => prev.filter(id => id !== propertyId));
    }
  };

  const selectedPropertiesData = propertiesWithPhones.filter(p => 
    selectedProperties.includes(p.id)
  );

  const handleSendMessages = () => {
    selectedPropertiesData.forEach((property, index) => {
      const personalizedMessage = replaceMessageVariables(message, property);
      
      // Add a small delay between messages to avoid overwhelming the browser
      setTimeout(() => {
        if (property.ownerPhone) {
          openWhatsApp(property.ownerPhone, personalizedMessage);
        }
      }, index * 100);
    });
    
    onClose();
  };

  const exampleProperty = propertiesWithPhones[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            שליחת הודעות וואטסאפ קבוצתיות
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Message Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">הודעה לשליחה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="כתוב כאן את ההודעה... תוכל להשתמש במשתנים: {שם}, {כתובת}, {חוזה}"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[120px] text-right"
                dir="rtl"
              />
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="cursor-pointer" onClick={() => setMessage(prev => prev + '{שם}')}>
                  {'{שם}'}
                </Badge>
                <Badge variant="outline" className="cursor-pointer" onClick={() => setMessage(prev => prev + '{כתובת}')}>
                  {'{כתובת}'}
                </Badge>
                <Badge variant="outline" className="cursor-pointer" onClick={() => setMessage(prev => prev + '{חוזה}')}>
                  {'{חוזה}'}
                </Badge>
              </div>

              {message && exampleProperty && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(!showPreview)}
                    className="mb-2"
                  >
                    {showPreview ? 'הסתר תצוגה מקדימה' : 'הצג תצוגה מקדימה'}
                  </Button>
                  
                  {showPreview && (
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground mb-2">
                          תצוגה מקדימה לנכס של {exampleProperty.ownerName}:
                        </div>
                        <div className="text-right bg-white p-3 rounded border">
                          {replaceMessageVariables(message, exampleProperty)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>בחירת בעלי נכסים ({selectedProperties.length} מתוך {propertiesWithPhones.length})</span>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedProperties.length === propertiesWithPhones.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm">בחר הכל</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {propertiesWithPhones.map((property) => (
                  <div key={property.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedProperties.includes(property.id)}
                        onCheckedChange={(checked) => handlePropertySelect(property.id, !!checked)}
                      />
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{property.ownerName}</div>
                      <div className="text-sm text-muted-foreground">{property.address}</div>
                      <div className="text-sm text-muted-foreground">{property.ownerPhone}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between gap-4">
            <Button variant="outline" onClick={onClose}>
              ביטול
            </Button>
            <Button
              onClick={handleSendMessages}
              disabled={!message.trim() || selectedProperties.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Send className="h-4 w-4 ml-2" />
              שלח לכל הנבחרים ({selectedProperties.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
