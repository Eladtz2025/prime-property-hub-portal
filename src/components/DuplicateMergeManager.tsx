import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Property } from '../types/property';
import { Star, Check, User, Phone, Mail, Calendar, Home } from 'lucide-react';

interface DuplicateGroup {
  key: string;
  properties: Property[];
  duplicateType: 'phone';
}

interface DuplicateMergeManagerProps {
  duplicateGroup: DuplicateGroup;
  isOpen: boolean;
  onClose: () => void;
  onMergeComplete: (mergedProperty: Property) => void;
}

export const DuplicateMergeManager: React.FC<DuplicateMergeManagerProps> = ({
  duplicateGroup,
  isOpen,
  onClose,
  onMergeComplete
}) => {
  const [primaryPropertyId, setPrimaryPropertyId] = useState<string>(duplicateGroup.properties[0]?.id || '');
  const [fieldsToMerge, setFieldsToMerge] = useState<Set<string>>(new Set());

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

  const handleFieldToggle = (fieldName: string) => {
    const newFields = new Set(fieldsToMerge);
    if (newFields.has(fieldName)) {
      newFields.delete(fieldName);
    } else {
      newFields.add(fieldName);
    }
    setFieldsToMerge(newFields);
  };

  const handleMerge = () => {
    const primaryProperty = duplicateGroup.properties.find(p => p.id === primaryPropertyId);
    if (!primaryProperty) return;

    // Create merged property by combining data from duplicates
    const mergedProperty: Property = { ...primaryProperty };
    
    // Merge selected fields from other properties
    duplicateGroup.properties.forEach(property => {
      if (property.id === primaryPropertyId) return;
      
      // Merge fields that were selected and are empty in primary property
      if (fieldsToMerge.has('ownerPhone') && !mergedProperty.ownerPhone && property.ownerPhone) {
        mergedProperty.ownerPhone = property.ownerPhone;
      }
      if (fieldsToMerge.has('ownerEmail') && !mergedProperty.ownerEmail && property.ownerEmail) {
        mergedProperty.ownerEmail = property.ownerEmail;
      }
      if (fieldsToMerge.has('tenantName') && !mergedProperty.tenantName && property.tenantName) {
        mergedProperty.tenantName = property.tenantName;
      }
      if (fieldsToMerge.has('tenantPhone') && !mergedProperty.tenantPhone && property.tenantPhone) {
        mergedProperty.tenantPhone = property.tenantPhone;
      }
      if (fieldsToMerge.has('tenantEmail') && !mergedProperty.tenantEmail && property.tenantEmail) {
        mergedProperty.tenantEmail = property.tenantEmail;
      }
      if (fieldsToMerge.has('monthlyRent') && !mergedProperty.monthlyRent && property.monthlyRent) {
        mergedProperty.monthlyRent = property.monthlyRent;
      }
      if (fieldsToMerge.has('leaseStartDate') && !mergedProperty.leaseStartDate && property.leaseStartDate) {
        mergedProperty.leaseStartDate = property.leaseStartDate;
      }
      if (fieldsToMerge.has('leaseEndDate') && !mergedProperty.leaseEndDate && property.leaseEndDate) {
        mergedProperty.leaseEndDate = property.leaseEndDate;
      }
      if (fieldsToMerge.has('notes')) {
        const existingNotes = mergedProperty.notes || '';
        const newNotes = property.notes || '';
        if (newNotes && !existingNotes.includes(newNotes)) {
          mergedProperty.notes = existingNotes ? `${existingNotes}\n\n--- מוזג מנכס כפול ---\n${newNotes}` : newNotes;
        }
      }
      if (fieldsToMerge.has('propertySize') && !mergedProperty.propertySize && property.propertySize) {
        mergedProperty.propertySize = property.propertySize;
      }
      if (fieldsToMerge.has('floor') && !mergedProperty.floor && property.floor) {
        mergedProperty.floor = property.floor;
      }
      if (fieldsToMerge.has('rooms') && !mergedProperty.rooms && property.rooms) {
        mergedProperty.rooms = property.rooms;
      }
      
      // Merge images and documents
      if (fieldsToMerge.has('images') && property.images?.length) {
        mergedProperty.images = [...(mergedProperty.images || []), ...property.images];
      }
      if (fieldsToMerge.has('documents') && property.documents?.length) {
        mergedProperty.documents = [...(mergedProperty.documents || []), ...property.documents];
      }
    });

    mergedProperty.lastUpdated = new Date().toISOString();

    onMergeComplete(mergedProperty);
  };

  const getAvailableFieldsToMerge = () => {
    const primaryProperty = duplicateGroup.properties.find(p => p.id === primaryPropertyId);
    if (!primaryProperty) return [];

    const fields: Array<{key: string, label: string, hasData: boolean}> = [];
    
    duplicateGroup.properties.forEach(property => {
      if (property.id === primaryPropertyId) return;
      
      if (property.ownerPhone && !primaryProperty.ownerPhone) {
        fields.push({key: 'ownerPhone', label: `טלפון בעל נכס: ${property.ownerPhone}`, hasData: true});
      }
      if (property.ownerEmail && !primaryProperty.ownerEmail) {
        fields.push({key: 'ownerEmail', label: `אימייל בעל נכס: ${property.ownerEmail}`, hasData: true});
      }
      if (property.tenantName && !primaryProperty.tenantName) {
        fields.push({key: 'tenantName', label: `שם דייר: ${property.tenantName}`, hasData: true});
      }
      if (property.tenantPhone && !primaryProperty.tenantPhone) {
        fields.push({key: 'tenantPhone', label: `טלפון דייר: ${property.tenantPhone}`, hasData: true});
      }
      if (property.tenantEmail && !primaryProperty.tenantEmail) {
        fields.push({key: 'tenantEmail', label: `אימייל דייר: ${property.tenantEmail}`, hasData: true});
      }
      if (property.monthlyRent && !primaryProperty.monthlyRent) {
        fields.push({key: 'monthlyRent', label: `שכירות חודשית: ₪${property.monthlyRent.toLocaleString()}`, hasData: true});
      }
      if (property.leaseStartDate && !primaryProperty.leaseStartDate) {
        fields.push({key: 'leaseStartDate', label: `תחילת חוזה: ${new Date(property.leaseStartDate).toLocaleDateString('he-IL')}`, hasData: true});
      }
      if (property.leaseEndDate && !primaryProperty.leaseEndDate) {
        fields.push({key: 'leaseEndDate', label: `סיום חוזה: ${new Date(property.leaseEndDate).toLocaleDateString('he-IL')}`, hasData: true});
      }
      if (property.notes && property.notes !== primaryProperty.notes) {
        fields.push({key: 'notes', label: `הערות נוספות`, hasData: true});
      }
      if (property.propertySize && !primaryProperty.propertySize) {
        fields.push({key: 'propertySize', label: `גודל נכס: ${property.propertySize} מ"ר`, hasData: true});
      }
      if (property.floor && !primaryProperty.floor) {
        fields.push({key: 'floor', label: `קומה: ${property.floor}`, hasData: true});
      }
      if (property.rooms && !primaryProperty.rooms) {
        fields.push({key: 'rooms', label: `חדרים: ${property.rooms}`, hasData: true});
      }
      if (property.images?.length) {
        fields.push({key: 'images', label: `תמונות (${property.images.length})`, hasData: true});
      }
      if (property.documents?.length) {
        fields.push({key: 'documents', label: `מסמכים (${property.documents.length})`, hasData: true});
      }
    });

    // Remove duplicates
    const uniqueFields = fields.filter((field, index, self) => 
      index === self.findIndex(f => f.key === field.key)
    );

    return uniqueFields;
  };

  const availableFields = getAvailableFieldsToMerge();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">
            מזג נכסים כפולים
            <div className="text-sm text-muted-foreground font-normal">
              בחר נכס עיקרי ושדות למיזוג
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Select Primary Property */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right">בחר נכס עיקרי</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {duplicateGroup.properties.map((property) => (
                <div 
                  key={property.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    primaryPropertyId === property.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPrimaryPropertyId(property.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {primaryPropertyId === property.id && (
                          <Star className="h-5 w-5 text-blue-500 fill-current" />
                        )}
                        <h3 className="font-semibold">{property.address}</h3>
                        <Badge className={getStatusColor(property.status)}>
                          {getStatusText(property.status)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{property.ownerName}</span>
                          </div>
                          {property.ownerPhone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{property.ownerPhone}</span>
                            </div>
                          )}
                          {property.ownerEmail && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{property.ownerEmail}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          {property.tenantName && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>דייר: {property.tenantName}</span>
                            </div>
                          )}
                          {property.leaseEndDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{new Date(property.leaseEndDate).toLocaleDateString('he-IL')}</span>
                            </div>
                          )}
                          {property.monthlyRent && (
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4 text-muted-foreground" />
                              <span>₪{property.monthlyRent.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Select Fields to Merge */}
          {availableFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-right">בחר שדות למיזוג</CardTitle>
                <p className="text-sm text-muted-foreground text-right">
                  השדות הבאים קיימים בנכסים אחרים וחסרים בנכס העיקרי
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {availableFields.map((field) => (
                  <div key={field.key} className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id={field.key}
                      checked={fieldsToMerge.has(field.key)}
                      onCheckedChange={() => handleFieldToggle(field.key)}
                    />
                    <label 
                      htmlFor={field.key}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {field.label}
                    </label>
                  </div>
                ))}
                
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allFields = new Set(availableFields.map(f => f.key));
                      setFieldsToMerge(allFields);
                    }}
                  >
                    בחר הכל
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFieldsToMerge(new Set())}
                    className="mr-2"
                  >
                    נקה הכל
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              ביטול
            </Button>
            <Button 
              onClick={handleMerge}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Check className="h-4 w-4 ml-1" />
              מזג נכסים
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};