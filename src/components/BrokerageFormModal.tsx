import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import SignatureCanvas from 'react-signature-canvas';
import { Trash2, Save } from 'lucide-react';
import { brokerageFormSchema, propertyRowSchema, formatValidationErrors, sanitizeInput } from '@/utils/formValidation';
import { z } from 'zod';

interface BrokerageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PropertyRow {
  address: string;
  floor: string;
  rooms: string;
  price: string;
}

export const BrokerageFormModal: React.FC<BrokerageFormModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const signatureRef = useRef<SignatureCanvas>(null);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    referredBy: '',
    feeTypeRental: false,
    feeTypeSale: false,
    specialTerms: '',
    clientName: '',
    clientId: '',
    clientPhone: '',
    agentName: 'אלעד צברי',
    agentId: '036804805',
  });

  const [properties, setProperties] = useState<PropertyRow[]>([
    { address: '', floor: '', rooms: '', price: '' },
    { address: '', floor: '', rooms: '', price: '' },
    { address: '', floor: '', rooms: '', price: '' },
  ]);

  const handlePropertyChange = (index: number, field: keyof PropertyRow, value: string) => {
    const newProperties = [...properties];
    newProperties[index][field] = value;
    setProperties(newProperties);
  };

  const addPropertyRow = () => {
    setProperties([...properties, { address: '', floor: '', rooms: '', price: '' }]);
  };

  const clearSignature = () => {
    signatureRef.current?.clear();
  };

  const handleSubmit = async () => {
    // Validate signature first
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast({
        title: 'שגיאה',
        description: 'נא לחתום על הטופס',
        variant: 'destructive',
      });
      return;
    }

    // Validate form data
    try {
      const validatedData = brokerageFormSchema.parse(formData);
      
      // Validate properties
      const validatedProperties = properties
        .filter(p => p.address)
        .map(p => {
          try {
            return propertyRowSchema.parse(p);
          } catch (error) {
            if (error instanceof z.ZodError) {
              throw new Error(`שגיאה בפרטי נכס: ${formatValidationErrors(error)}`);
            }
            throw error;
          }
        });

      const signatureData = signatureRef.current.toDataURL();

      // Sanitize inputs before storing
      const { error } = await supabase.from('brokerage_forms').insert([{
        form_date: validatedData.date,
        referred_by: sanitizeInput(validatedData.referredBy || ''),
        fee_type_rental: validatedData.feeTypeRental,
        fee_type_sale: validatedData.feeTypeSale,
        special_terms: sanitizeInput(validatedData.specialTerms || ''),
        properties: validatedProperties as any,
        client_name: sanitizeInput(validatedData.clientName),
        client_id: validatedData.clientId,
        client_phone: validatedData.clientPhone,
        agent_name: sanitizeInput(validatedData.agentName),
        agent_id: validatedData.agentId,
        client_signature: signatureData,
      }]);

      if (error) throw error;

      toast({
        title: 'הטופס נשמר בהצלחה',
        description: 'הזמנת שירותי התיווך נשמרה במערכת',
      });

      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'שגיאת תקינות',
          description: formatValidationErrors(error),
          variant: 'destructive',
        });
      } else {
        console.error('Error saving form:', error);
        toast({
          title: 'שגיאה',
          description: error instanceof Error ? error.message : 'שמירת הטופס נכשלה',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">הזמנת שירותי תיווך</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* תאריך */}
          <div>
            <Label>תאריך</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          {/* מופנה ע"י */}
          <div>
            <Label>מופנה ע"י "סיטי מרקט"</Label>
            <Input
              placeholder="שם הלקוח/פונה"
              value={formData.referredBy}
              onChange={(e) => setFormData({ ...formData, referredBy: e.target.value })}
            />
          </div>

          {/* הצהרות */}
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <h3 className="font-semibold">הצהרות</h3>
            <p className="text-sm text-muted-foreground">
              אני/אנחנו הח"מ מאשר/ים שהופנינו אל רכוש ו/או צד זה ע"י "סיטי מרקט" וכי הנכסים המפורטים להלן לא היו ידועים לנו קודם לכן ממקור אחר. אנו מתחייבים שלא למסור לזולת ולא להשתמש בכל מידע הקשור בפנייה זו ללא תיאום מראש עם "סיטי מרקט".
            </p>
            <p className="text-sm text-muted-foreground">
              הנני מאשר/ים כי הופניתי לראשונה על ידכם אל הנכסים/הצדדים המפורטים בטופס זה.
            </p>
          </div>

          {/* שכר טרחה */}
          <div className="space-y-3">
            <h3 className="font-semibold">שכר טרחה</h3>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                checked={formData.feeTypeRental}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, feeTypeRental: checked as boolean })
                }
              />
              <Label className="cursor-pointer">
                השכרת דירה/משרד — <strong>100%</strong> מדמי השכירות החודשיים <em>בתוספת מע"מ</em> במזומן.
              </Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                checked={formData.feeTypeSale}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, feeTypeSale: checked as boolean })
                }
              />
              <Label className="cursor-pointer">
                קניה או מכירה — <strong>2%</strong> מהערך הכולל של העסקה <em>בתוספת מע"מ</em> במזומן.
              </Label>
            </div>
            <div>
              <Label>תנאים מיוחדים ו/או נוספים</Label>
              <Textarea
                placeholder="הקלידו תנאים מיוחדים, יוצאי דופן, חריגים וכד'."
                value={formData.specialTerms}
                onChange={(e) => setFormData({ ...formData, specialTerms: e.target.value })}
              />
            </div>
          </div>

          {/* רשימת נכסים */}
          <div className="space-y-3">
            <h3 className="font-semibold">נכסים שהופניתי אליהם</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-right text-sm">מס'</th>
                    <th className="p-2 text-right text-sm">כתובת</th>
                    <th className="p-2 text-right text-sm">קומה</th>
                    <th className="p-2 text-right text-sm">חדרים</th>
                    <th className="p-2 text-right text-sm">מחיר</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((prop, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2 text-sm">{index + 1}</td>
                      <td className="p-2">
                        <Input
                          value={prop.address}
                          onChange={(e) => handlePropertyChange(index, 'address', e.target.value)}
                          placeholder="כתובת"
                          className="h-8"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={prop.floor}
                          onChange={(e) => handlePropertyChange(index, 'floor', e.target.value)}
                          placeholder="קומה"
                          className="h-8"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={prop.rooms}
                          onChange={(e) => handlePropertyChange(index, 'rooms', e.target.value)}
                          placeholder="חדרים"
                          className="h-8"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={prop.price}
                          onChange={(e) => handlePropertyChange(index, 'price', e.target.value)}
                          placeholder="מחיר"
                          className="h-8"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button variant="outline" size="sm" onClick={addPropertyRow}>
              הוסף נכס
            </Button>
          </div>

          {/* תנאים משלימים */}
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <h3 className="font-semibold">תנאים משלימים</h3>
            <ol className="text-sm text-muted-foreground space-y-2 pr-5">
              <li>התחייבות זו תהיה תקפה גם במקרה של סיוע של צד שלישי לסיום העסקה.</li>
              <li>התשלום יבוצע <strong>מיד</strong> עם עשיית ההסכם (זכרון דברים) ו/או חוזה ו/או עם קבלת החזקה בנכס – המוקדם מביניהם.</li>
              <li>אי תשלום בתוך 5 ימים ממועד האירוע המזכה יחייב <strong>כפל דמי תיווך</strong> לתשלום בתוך 10 ימים ממועד האירוע.</li>
              <li>"סיטי מרקט" לא תהיה אחראית לשינויים בעמדת המוכרים/משכירים, או למקרה שבו נמכר/הושכר הנכס לאחר.</li>
              <li>העברת מידע לאדם אחר תחייב בתשלום מלוא שכר הטרחה כאילו אני/אנחנו ביצענו את העסקה בעצמנו.</li>
              <li>אם קונים/שוכרים פנו תחילה למתווך אחר אך העסקה נסגרה באמצעותנו — דמי התיווך יחולו כרגיל לפי התנאים לעיל.</li>
              <li>אני/אנחנו מתחייבים לעדכן את משרדכם בתוך 5 ימים אם אשכור/אשכיר/אקנה/אמכור – דרככם או שלא דרככם.</li>
            </ol>
          </div>

          {/* פרטי לקוח */}
          <div className="space-y-3">
            <h3 className="font-semibold">פרטי הלקוח</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>שם מלא</Label>
                <Input
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="שם מלא"
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <Label>ת.ז. / דרכון</Label>
                <Input
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  placeholder="מספר זהות (9 ספרות)"
                  maxLength={9}
                  pattern="\d{9}"
                  required
                />
              </div>
            </div>
            <div>
              <Label>טלפון</Label>
              <Input
                type="tel"
                value={formData.clientPhone}
                onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                placeholder="טלפון (050-1234567)"
                maxLength={15}
                required
              />
            </div>
          </div>

          {/* חתימה */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>חתימת הלקוח</Label>
              <Button variant="outline" size="sm" onClick={clearSignature}>
                <Trash2 className="h-4 w-4 ml-2" />
                נקה חתימה
              </Button>
            </div>
            <div className="border rounded-lg bg-white">
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  className: 'w-full h-40 rounded-lg',
                }}
              />
            </div>
          </div>

          {/* כפתורי פעולה */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              ביטול
            </Button>
            <Button onClick={handleSubmit}>
              <Save className="h-4 w-4 ml-2" />
              שמור טופס
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
