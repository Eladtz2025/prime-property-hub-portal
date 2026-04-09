import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { validateField, requiredPhoneSchema, requiredNameSchema, FormErrors, FormTouched } from '@/utils/formValidation';
import { logger } from '@/utils/logger';

interface Property {
  id: string;
  title: string | null;
  address: string;
}

interface AddBrokerModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  editBroker?: {
    id: string;
    name: string;
    phone: string;
    office_name: string | null;
    interested_properties: string[];
    interested_properties_text: string | null;
    notes: string | null;
  } | null;
}

type FormFields = 'name' | 'phone';

export function AddBrokerModal({ open, onClose, onSave, editBroker }: AddBrokerModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [propertiesText, setPropertiesText] = useState("");
  const [notes, setNotes] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors<FormFields>>({});
  const [touched, setTouched] = useState<FormTouched<FormFields>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const initialDataRef = useRef<string>('');

  const validateFormField = (field: FormFields, value: string) => {
    let error: string | null = null;
    switch (field) {
      case 'name':
        error = validateField(requiredNameSchema, value);
        break;
      case 'phone':
        error = validateField(requiredPhoneSchema, value);
        break;
    }
    setErrors(prev => ({ ...prev, [field]: error || undefined }));
    return !error;
  };

  const handleFieldBlur = (field: FormFields, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateFormField(field, value);
  };

  useEffect(() => {
    if (open) {
      fetchProperties();
      if (editBroker) {
        setName(editBroker.name);
        setPhone(editBroker.phone);
        setOfficeName(editBroker.office_name || "");
        setSelectedProperties(editBroker.interested_properties || []);
        setPropertiesText(editBroker.interested_properties_text || "");
        setNotes(editBroker.notes || "");
        initialDataRef.current = JSON.stringify({
          name: editBroker.name,
          phone: editBroker.phone,
          officeName: editBroker.office_name || "",
          selectedProperties: editBroker.interested_properties || [],
          propertiesText: editBroker.interested_properties_text || "",
          notes: editBroker.notes || ""
        });
      } else {
        resetForm();
        initialDataRef.current = JSON.stringify({ name: "", phone: "", officeName: "", selectedProperties: [], propertiesText: "", notes: "" });
      }
      setHasChanges(false);
    }
  }, [open, editBroker]);

  // Track changes
  useEffect(() => {
    if (!open) return;
    const currentData = JSON.stringify({ name, phone, officeName, selectedProperties, propertiesText, notes });
    setHasChanges(currentData !== initialDataRef.current);
  }, [name, phone, officeName, selectedProperties, propertiesText, notes, open]);

  const handleClose = () => {
    if (hasChanges) {
      setShowUnsavedDialog(true);
    } else {
      onClose();
    }
  };

  const fetchProperties = async () => {
    const { data } = await supabase
      .from('properties')
      .select('id, title, address')
      .order('address');
    
    if (data) {
      setProperties(data);
    }
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setOfficeName("");
    setSelectedProperties([]);
    setPropertiesText("");
    setNotes("");
  };

  const handlePropertyToggle = (propertyId: string) => {
    setSelectedProperties(prev => 
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all required fields
    const nameValid = validateFormField('name', name);
    const phoneValid = validateFormField('phone', phone);
    setTouched({ name: true, phone: true });

    if (!nameValid || !phoneValid) {
      toast.error("נא לתקן את השדות המסומנים");
      return;
    }

    setLoading(true);
    try {
      const brokerData = {
        name: name.trim(),
        phone: phone.trim(),
        office_name: officeName.trim() || null,
        interested_properties: selectedProperties,
        interested_properties_text: propertiesText.trim() || null,
        notes: notes.trim() || null,
      };

      if (editBroker) {
        const { error } = await supabase
          .from('brokers')
          .update({ ...brokerData, updated_at: new Date().toISOString() })
          .eq('id', editBroker.id);
        
        if (error) throw error;
        toast.success("המתווך עודכן בהצלחה");
      } else {
        const { error } = await supabase
          .from('brokers')
          .insert(brokerData);
        
        if (error) throw error;
        toast.success("המתווך נוסף בהצלחה");
      }

      onSave();
      onClose();
      resetForm();
    } catch (error) {
      logger.error('Error saving broker:', error);
      toast.error("שגיאה בשמירת המתווך");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>{editBroker ? "עריכת מתווך" : "הוספת מתווך חדש"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">שם *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (touched.name) validateFormField('name', e.target.value);
              }}
              onBlur={() => handleFieldBlur('name', name)}
              placeholder="שם המתווך"
              className={touched.name && errors.name ? 'border-destructive' : ''}
              required
            />
            {touched.name && errors.name && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">טלפון *</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (touched.phone) validateFormField('phone', e.target.value);
              }}
              onBlur={() => handleFieldBlur('phone', phone)}
              placeholder="050-1234567"
              className={touched.phone && errors.phone ? 'border-destructive' : ''}
              required
            />
            {touched.phone && errors.phone && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.phone}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="officeName">שם משרד</Label>
            <Input
              id="officeName"
              value={officeName}
              onChange={(e) => setOfficeName(e.target.value)}
              placeholder="שם המשרד"
            />
          </div>

          <div className="space-y-2">
            <Label>דירות מעניינות מהמערכת</Label>
            <ScrollArea className="h-32 border rounded-md p-2">
              {properties.length === 0 ? (
                <p className="text-sm text-muted-foreground">אין דירות במערכת</p>
              ) : (
                <div className="space-y-2">
                  {properties.map((property) => (
                    <div key={property.id} className="flex items-center gap-2">
                      <Checkbox
                        id={property.id}
                        checked={selectedProperties.includes(property.id)}
                        onCheckedChange={() => handlePropertyToggle(property.id)}
                      />
                      <label htmlFor={property.id} className="text-sm cursor-pointer flex-1">
                        {property.title || property.address}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <Label htmlFor="propertiesText">דירות נוספות (טקסט חופשי)</Label>
            <Textarea
              id="propertiesText"
              value={propertiesText}
              onChange={(e) => setPropertiesText(e.target.value)}
              placeholder="דירות שלא במערכת..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">הערות</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="הערות נוספות..."
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "שומר..." : editBroker ? "עדכן" : "הוסף"}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose}>
              ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>יש שינויים שלא נשמרו</AlertDialogTitle>
          <AlertDialogDescription>
            השינויים שביצעת לא נשמרו. האם אתה בטוח שברצונך לצאת?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse gap-2">
          <AlertDialogCancel onClick={() => setShowUnsavedDialog(false)}>
            המשך לערוך
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => {
              setShowUnsavedDialog(false);
              setHasChanges(false);
              onClose();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            צא בלי לשמור
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
