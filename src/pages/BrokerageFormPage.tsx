import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Copy, Send, Save, Plus, X } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

interface PropertyRow {
  address: string;
  floor: string;
  rooms: string;
  price: string;
}

type PageMode = 'new' | 'remote-sign' | 'generated-link';

const BrokerageFormPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const signatureRef = useRef<SignatureCanvas>(null);
  
  const [mode, setMode] = useState<PageMode>('new');
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string>('');
  
  // Form data
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [referredBy, setReferredBy] = useState('');
  const [feeTypeRental, setFeeTypeRental] = useState(false);
  const [feeTypeSale, setFeeTypeSale] = useState(false);
  const [specialTerms, setSpecialTerms] = useState('');
  const [properties, setProperties] = useState<PropertyRow[]>([
    { address: '', floor: '', rooms: '', price: '' }
  ]);
  
  // Client data
  const [clientName, setClientName] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  useEffect(() => {
    const initPage = async () => {
      if (token) {
        // Load token data for remote signing
        setMode('remote-sign');
        await loadRemoteFormData(token);
      } else {
        setMode('new');
      }
    };
    initPage();
  }, [token]);

  const loadRemoteFormData = async (tokenValue: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('brokerage_form_tokens')
        .select('*')
        .eq('token', tokenValue)
        .eq('status', 'pending')
        .single();

      if (error || !data) {
        toast.error('קישור לא תקין או פג תוקפו');
        navigate('/');
        return;
      }

      const formData = data.form_data as any;
      setFormDate(formData.formDate || '');
      setReferredBy(formData.referredBy || '');
      setFeeTypeRental(formData.feeTypeRental || false);
      setFeeTypeSale(formData.feeTypeSale || false);
      setSpecialTerms(formData.specialTerms || '');
      setProperties(formData.properties || [{ address: '', floor: '', rooms: '', price: '' }]);
    } catch (err) {
      console.error('Error loading form data:', err);
      toast.error('שגיאה בטעינת הטופס');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyChange = (index: number, field: keyof PropertyRow, value: string) => {
    const updated = [...properties];
    updated[index][field] = value;
    setProperties(updated);
  };

  const addPropertyRow = () => {
    setProperties([...properties, { address: '', floor: '', rooms: '', price: '' }]);
  };

  const removePropertyRow = (index: number) => {
    if (properties.length > 1) {
      setProperties(properties.filter((_, i) => i !== index));
    }
  };

  const clearSignature = () => {
    signatureRef.current?.clear();
  };

  const validatePropertyData = () => {
    if (!formDate) {
      toast.error('יש למלא תאריך');
      return false;
    }
    if (!feeTypeRental && !feeTypeSale) {
      toast.error('יש לבחור לפחות סוג שירות אחד');
      return false;
    }
    if (properties.every(p => !p.address)) {
      toast.error('יש להוסיף לפחות נכס אחד');
      return false;
    }
    return true;
  };

  const validateClientData = () => {
    if (!clientName || !clientId || !clientPhone) {
      toast.error('יש למלא את כל פרטי הלקוח');
      return false;
    }
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error('יש לחתום על הטופס');
      return false;
    }
    return true;
  };

  const handleCreateLink = async () => {
    if (!validatePropertyData()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const formData = {
        formDate,
        referredBy,
        feeTypeRental,
        feeTypeSale,
        specialTerms,
        properties: properties.filter(p => p.address)
      };

      const { data, error } = await supabase
        .from('brokerage_form_tokens')
        .insert({
          form_data: formData as any,
          created_by: user?.id,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/brokerage-form/${data.token}`;
      setGeneratedLink(link);
      setMode('generated-link');
      toast.success('הקישור נוצר בהצלחה');
    } catch (err) {
      console.error('Error creating link:', err);
      toast.error('שגיאה ביצירת הקישור');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveForm = async () => {
    if (!validatePropertyData() || !validateClientData()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const signatureData = signatureRef.current?.toDataURL();

      const { error } = await supabase
        .from('brokerage_forms')
        .insert({
          form_date: formDate,
          referred_by: referredBy,
          fee_type_rental: feeTypeRental,
          fee_type_sale: feeTypeSale,
          special_terms: specialTerms,
          properties: properties.filter(p => p.address) as any,
          client_name: clientName,
          client_id: clientId,
          client_phone: clientPhone,
          agent_name: user?.email || '',
          agent_id: user?.id || '',
          client_signature: signatureData,
          created_by: user?.id,
          status: 'active'
        });

      if (error) throw error;

      // If remote sign, update token status
      if (mode === 'remote-sign' && token) {
        await supabase
          .from('brokerage_form_tokens')
          .update({ status: 'signed', signed_at: new Date().toISOString() })
          .eq('token', token);
      }

      toast.success('הטופס נשמר בהצלחה');
      setTimeout(() => {
        window.close();
        navigate('/');
      }, 1500);
    } catch (err) {
      console.error('Error saving form:', err);
      toast.error('שגיאה בשמירת הטופס');
    } finally {
      setLoading(false);
    }
  };

  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success('הקישור הועתק ללוח');
  };

  const shareViaWhatsApp = () => {
    const message = `שלום, נא למלא ולחתום על טופס הזמנת שירותי תיווך:\n${generatedLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Generated link view
  if (mode === 'generated-link' && generatedLink) {
    return (
      <div className="min-h-screen bg-background rtl">
        <div className="max-w-2xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">קישור לטופס נוצר בהצלחה</CardTitle>
              <CardDescription className="text-center">
                שלח את הקישור ללקוח למילוי וחתימה
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg break-all text-sm">
                {generatedLink}
              </div>
              
              <div className="flex gap-2">
                <Button onClick={copyLinkToClipboard} className="flex-1" variant="outline">
                  <Copy className="h-4 w-4 ml-2" />
                  העתק קישור
                </Button>
                <Button onClick={shareViaWhatsApp} className="flex-1">
                  <Send className="h-4 w-4 ml-2" />
                  שלח בוואטסאפ
                </Button>
              </div>

              <Button 
                onClick={() => window.close()} 
                variant="ghost" 
                className="w-full mt-4"
              >
                סגור חלון
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main form view (new or remote-sign)
  const isRemoteSign = mode === 'remote-sign';
  const isFieldDisabled = isRemoteSign;

  return (
    <div className="min-h-screen bg-background rtl">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">טופס הזמנת שירותי תיווך</CardTitle>
            <CardDescription>
              {isRemoteSign ? 'נא למלא את הפרטים ולחתום על הטופס' : 'מלא את פרטי הטופס'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Date and Referral */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">תאריך</Label>
                <Input
                  id="date"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  disabled={isFieldDisabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referred">מופנה על ידי</Label>
                <Input
                  id="referred"
                  value={referredBy}
                  onChange={(e) => setReferredBy(e.target.value)}
                  disabled={isFieldDisabled}
                  placeholder="שם המפנה (אופציונלי)"
                />
              </div>
            </div>

            {/* Fee Types */}
            <div className="space-y-2">
              <Label>סוג שירות</Label>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="rental"
                    checked={feeTypeRental}
                    onCheckedChange={(checked) => setFeeTypeRental(checked as boolean)}
                    disabled={isFieldDisabled}
                  />
                  <Label htmlFor="rental" className="cursor-pointer">השכרה</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sale"
                    checked={feeTypeSale}
                    onCheckedChange={(checked) => setFeeTypeSale(checked as boolean)}
                    disabled={isFieldDisabled}
                  />
                  <Label htmlFor="sale" className="cursor-pointer">מכירה</Label>
                </div>
              </div>
            </div>

            {/* Properties Table */}
            <div className="space-y-2">
              <Label>נכסים</Label>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-right text-sm font-medium">כתובת</th>
                      <th className="p-2 text-right text-sm font-medium w-20">קומה</th>
                      <th className="p-2 text-right text-sm font-medium w-20">חדרים</th>
                      <th className="p-2 text-right text-sm font-medium w-24">מחיר</th>
                      {!isFieldDisabled && <th className="p-2 w-10"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((property, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">
                          <Input
                            value={property.address}
                            onChange={(e) => handlePropertyChange(index, 'address', e.target.value)}
                            disabled={isFieldDisabled}
                            placeholder="כתובת הנכס"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={property.floor}
                            onChange={(e) => handlePropertyChange(index, 'floor', e.target.value)}
                            disabled={isFieldDisabled}
                            placeholder="קומה"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={property.rooms}
                            onChange={(e) => handlePropertyChange(index, 'rooms', e.target.value)}
                            disabled={isFieldDisabled}
                            placeholder="חדרים"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={property.price}
                            onChange={(e) => handlePropertyChange(index, 'price', e.target.value)}
                            disabled={isFieldDisabled}
                            placeholder="מחיר"
                          />
                        </td>
                        {!isFieldDisabled && (
                          <td className="p-2">
                            {properties.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removePropertyRow(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!isFieldDisabled && (
                <Button onClick={addPropertyRow} variant="outline" size="sm">
                  <Plus className="h-4 w-4 ml-2" />
                  הוסף נכס
                </Button>
              )}
            </div>

            {/* Special Terms */}
            <div className="space-y-2">
              <Label htmlFor="terms">תנאים מיוחדים</Label>
              <Textarea
                id="terms"
                value={specialTerms}
                onChange={(e) => setSpecialTerms(e.target.value)}
                disabled={isFieldDisabled}
                placeholder="הזן תנאים מיוחדים (אופציונלי)"
                rows={3}
              />
            </div>

            <div className="border-t pt-6" />

            {/* Client Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">פרטי הלקוח</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">שם מלא</Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="שם הלקוח"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientId">ת.ז</Label>
                  <Input
                    id="clientId"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="מספר ת.ז"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">טלפון</Label>
                  <Input
                    id="clientPhone"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="מספר טלפון"
                  />
                </div>
              </div>
            </div>

            {/* Signature */}
            <div className="space-y-2">
              <Label>חתימת הלקוח</Label>
              <div className="border rounded-lg overflow-hidden bg-white">
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    className: 'w-full h-40',
                  }}
                />
              </div>
              <Button onClick={clearSignature} variant="outline" size="sm">
                נקה חתימה
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleSaveForm} 
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 ml-2" />
                )}
                שמור טופס
              </Button>
              
              {!isRemoteSign && (
                <Button 
                  onClick={handleCreateLink} 
                  disabled={loading}
                  variant="outline"
                  className="flex-1"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 ml-2" />
                  )}
                  צור לינק לשליחה ללקוח
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-muted-foreground text-sm">
          <p>City Market Properties</p>
        </div>
      </div>
    </div>
  );
};

export default BrokerageFormPage;
