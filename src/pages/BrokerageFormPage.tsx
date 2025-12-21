import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Loader2, Copy, Send, Save, Plus, X, CheckCircle2, Trash2, AlertTriangle, Award, User, Phone, CreditCard, Globe } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { brokerageFormTranslations, BrokerageFormLanguage } from '@/lib/brokerage-form-translations';

const MAX_PROPERTIES = 10;

interface PropertyRow {
  address: string;
  floor: string;
  rooms: string;
  price: string;
  gushHelka: string;
}

type PageMode = 'new' | 'remote-sign' | 'generated-link';

const BrokerageFormPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const signatureRef = useRef<SignatureCanvas>(null);
  const agentSignatureRef = useRef<SignatureCanvas>(null);
  const { user, profile, hasPermission } = useAuth();
  
  const [mode, setMode] = useState<PageMode>('new');
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [hasSignature, setHasSignature] = useState(false);
  const [hasAgentSignature, setHasAgentSignature] = useState(false);
  const [language, setLanguage] = useState<BrokerageFormLanguage>('he');
  
  // Get translations based on current language
  const t = brokerageFormTranslations[language];
  
  // Broker details from token (for remote-sign mode)
  const [brokerDetails, setBrokerDetails] = useState<{
    full_name?: string;
    broker_license_number?: string;
    phone?: string;
    id_number?: string;
  } | null>(null);
  
  // Form data
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [feeTypeRental, setFeeTypeRental] = useState(false);
  const [feeTypeSale, setFeeTypeSale] = useState(false);
  const [specialTerms, setSpecialTerms] = useState('');
  const [properties, setProperties] = useState<PropertyRow[]>([
    { address: '', floor: '', rooms: '', price: '', gushHelka: '' }
  ]);
  
  // Client data - additional fields
  const [clientAddress, setClientAddress] = useState('');
  const [clientConfirmation, setClientConfirmation] = useState(false);
  
  // Client data
  const [clientName, setClientName] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Check if broker details are complete
  const isBrokerDetailsComplete = profile?.full_name && profile?.broker_license_number && profile?.id_number;

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
        toast.error(t.errorInvalidLink);
        navigate('/');
        return;
      }

      const formData = data.form_data as any;
      setFormDate(formData.formDate || '');
      setFeeTypeRental(formData.feeTypeRental || false);
      setFeeTypeSale(formData.feeTypeSale || false);
      setSpecialTerms(formData.specialTerms || '');
      setProperties(formData.properties || [{ address: '', floor: '', rooms: '', price: '', gushHelka: '' }]);
      
      // Set language from saved form data
      if (formData.language) {
        setLanguage(formData.language);
      }
      
      // Set broker details from token
      if (formData.brokerDetails) {
        setBrokerDetails(formData.brokerDetails);
      }
    } catch (err) {
      console.error('Error loading form data:', err);
      toast.error(t.errorLoadingForm);
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
    if (properties.length >= MAX_PROPERTIES) {
      toast.error(t.errorMaxProperties.replace('{max}', String(MAX_PROPERTIES)));
      return;
    }
    setProperties([...properties, { address: '', floor: '', rooms: '', price: '', gushHelka: '' }]);
  };

  const removePropertyRow = (index: number) => {
    if (properties.length > 1) {
      setProperties(properties.filter((_, i) => i !== index));
    }
  };

  const clearSignature = () => {
    signatureRef.current?.clear();
    setHasSignature(false);
  };

  const checkSignature = () => {
    setHasSignature(!signatureRef.current?.isEmpty());
  };

  const clearAgentSignature = () => {
    agentSignatureRef.current?.clear();
    setHasAgentSignature(false);
  };

  const checkAgentSignature = () => {
    setHasAgentSignature(!agentSignatureRef.current?.isEmpty());
  };

  const validatePropertyData = () => {
    if (!formDate) {
      toast.error(t.errorFillDate);
      return false;
    }
    if (mode === 'new' && !isBrokerDetailsComplete) {
      toast.error(t.errorCompleteBrokerDetails);
      return false;
    }
    if (!feeTypeRental && !feeTypeSale) {
      toast.error(t.errorSelectServiceType);
      return false;
    }
    if (properties.every(p => !p.address)) {
      toast.error(t.errorAddProperty);
      return false;
    }
    // Validate agent signature only in 'new' mode
    if (mode === 'new' && (!agentSignatureRef.current || agentSignatureRef.current.isEmpty())) {
      toast.error(t.errorAgentSignature);
      return false;
    }
    return true;
  };

  const validateClientData = () => {
    if (!clientName || !clientId || !clientPhone || !clientAddress) {
      toast.error(t.errorClientDetails);
      return false;
    }
    if (!clientConfirmation) {
      toast.error(t.errorClientConfirmation);
      return false;
    }
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error(t.errorClientSignature);
      return false;
    }
    return true;
  };

  const handleCreateLink = async () => {
    if (!validatePropertyData()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const agentSignatureData = agentSignatureRef.current?.toDataURL();
      
      const formData = {
        formDate,
        language,
        brokerDetails: {
          full_name: profile?.full_name,
          broker_license_number: profile?.broker_license_number,
          phone: profile?.phone,
          id_number: profile?.id_number,
        },
        agentSignature: agentSignatureData,
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
      toast.success(t.linkCreated);
    } catch (err) {
      console.error('Error creating link:', err);
      toast.error(t.errorCreatingLink);
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
      
      // Get broker details based on mode
      const currentBrokerDetails = mode === 'remote-sign' ? brokerDetails : {
        full_name: profile?.full_name,
        broker_license_number: profile?.broker_license_number,
        phone: profile?.phone,
        id_number: profile?.id_number,
      };

      const { error } = await supabase
        .from('brokerage_forms')
        .insert({
          form_date: formDate,
          referred_by: currentBrokerDetails?.full_name || '',
          fee_type_rental: feeTypeRental,
          fee_type_sale: feeTypeSale,
          special_terms: specialTerms,
          properties: properties.filter(p => p.address) as any,
          client_name: clientName,
          client_id: clientId,
          client_phone: clientPhone,
          agent_name: currentBrokerDetails?.full_name || '',
          agent_id: user?.id || '',
          client_signature: signatureData,
          created_by: user?.id,
          status: 'active'
        });

      if (error) throw error;

      // Activity logging with additional compliance fields
      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        action: 'create_brokerage_form',
        resource_type: 'brokerage_form',
        details: {
          client_name: clientName,
          client_address: clientAddress,
          client_confirmation: clientConfirmation,
          broker_name: currentBrokerDetails?.full_name,
          broker_license: currentBrokerDetails?.broker_license_number,
          properties_count: properties.filter(p => p.address).length,
          fee_types: {
            rental: feeTypeRental,
            sale: feeTypeSale
          },
          language
        }
      });

      // If remote sign, update token status
      if (mode === 'remote-sign' && token) {
        await supabase
          .from('brokerage_form_tokens')
          .update({ status: 'signed', signed_at: new Date().toISOString() })
          .eq('token', token);
      }

      toast.success(t.formSaved);
      setTimeout(() => {
        window.close();
        navigate('/');
      }, 1500);
    } catch (err) {
      console.error('Error saving form:', err);
      toast.error(t.errorSavingForm);
    } finally {
      setLoading(false);
    }
  };

  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success(t.linkCopied);
  };

  const shareViaWhatsApp = () => {
    const message = `${t.whatsAppMessage}\n${generatedLink}`;
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
      <div className={`min-h-screen bg-background ${language === 'he' ? 'rtl' : 'ltr'}`}>
        <div className="max-w-2xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">{t.linkCreatedSuccess}</CardTitle>
              <CardDescription className="text-center">
                {t.sendLinkToClient}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg break-all text-sm">
                {generatedLink}
              </div>
              
              <div className="flex gap-2">
                <Button onClick={copyLinkToClipboard} className="flex-1" variant="outline">
                  <Copy className={`h-4 w-4 ${language === 'he' ? 'ml-2' : 'mr-2'}`} />
                  {t.copyLink}
                </Button>
                <Button onClick={shareViaWhatsApp} className="flex-1">
                  <Send className={`h-4 w-4 ${language === 'he' ? 'ml-2' : 'mr-2'}`} />
                  {t.sendWhatsApp}
                </Button>
              </div>

              <Button 
                onClick={() => window.close()} 
                variant="ghost" 
                className="w-full mt-4"
              >
                {t.closeWindow}
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
  
  // Get current broker details for display
  const currentBrokerDetails = isRemoteSign ? brokerDetails : {
    full_name: profile?.full_name,
    broker_license_number: profile?.broker_license_number,
    phone: profile?.phone,
    id_number: profile?.id_number,
  };

  return (
    <div className={`min-h-screen bg-background ${language === 'he' ? 'rtl' : 'ltr'}`}>
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{t.title}</CardTitle>
                <CardDescription>
                  {isRemoteSign ? t.fillDetails : t.fillFormDetails}
                </CardDescription>
              </div>
              {/* Language Selector - only in new mode */}
              {mode === 'new' && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <RadioGroup
                    value={language}
                    onValueChange={(value) => setLanguage(value as BrokerageFormLanguage)}
                    className="flex gap-2"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="he" id="lang-he" />
                      <Label htmlFor="lang-he" className="cursor-pointer text-sm">עברית</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="en" id="lang-en" />
                      <Label htmlFor="lang-en" className="cursor-pointer text-sm">English</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Warning if broker details are incomplete in new mode */}
            {mode === 'new' && !isBrokerDetailsComplete && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">{t.brokerDetailsIncomplete}</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    {t.brokerDetailsWarning}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => navigate('/settings')}
                  >
                    {t.goToSettings}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Broker Details Section */}
            <div className="bg-muted/50 p-4 rounded-lg border">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Award className="h-4 w-4" />
                {t.brokerDetails}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">{t.name}:</span>
                    <span className={`${language === 'he' ? 'mr-2' : 'ml-2'} font-medium`}>{currentBrokerDetails?.full_name || '—'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">{t.license}:</span>
                    <span className={`${language === 'he' ? 'mr-2' : 'ml-2'} font-medium`}>{currentBrokerDetails?.broker_license_number || '—'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">{t.phone}:</span>
                    <span className={`${language === 'he' ? 'mr-2' : 'ml-2'} font-medium`} dir="ltr">{currentBrokerDetails?.phone || '—'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">{t.idNumber}:</span>
                    <span className={`${language === 'he' ? 'mr-2' : 'ml-2'} font-medium`} dir="ltr">{currentBrokerDetails?.id_number || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">{t.date}</Label>
                <Input
                  id="date"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  disabled={isFieldDisabled}
                />
              </div>
            </div>

            {/* הצהרות */}
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <h3 className="font-semibold">{t.declarations}</h3>
              <p className="text-sm text-muted-foreground">
                {t.declarationText1}
              </p>
              <p className="text-sm text-muted-foreground">
                {t.declarationText2}
              </p>
            </div>

            {/* שכר טרחה */}
            <div className="space-y-3">
              <h3 className="font-semibold">{t.feeTypes}</h3>
              <div className={`flex items-center ${language === 'he' ? 'space-x-2 space-x-reverse' : 'space-x-2'}`}>
                <Checkbox
                  id="rental"
                  checked={feeTypeRental}
                  onCheckedChange={(checked) => setFeeTypeRental(checked as boolean)}
                  disabled={isFieldDisabled}
                />
                <Label htmlFor="rental" className="cursor-pointer">
                  {t.rentalFee} <strong>{t.rentalFeeAmount}</strong> {t.rentalFeeText} <em>{t.plusVat}</em> {t.inCash}
                </Label>
              </div>
              <div className={`flex items-center ${language === 'he' ? 'space-x-2 space-x-reverse' : 'space-x-2'}`}>
                <Checkbox
                  id="sale"
                  checked={feeTypeSale}
                  onCheckedChange={(checked) => setFeeTypeSale(checked as boolean)}
                  disabled={isFieldDisabled}
                />
                <Label htmlFor="sale" className="cursor-pointer">
                  {t.saleFee} <strong>{t.saleFeeAmount}</strong> {t.saleFeeText} <em>{t.plusVat}</em> {t.inCash}
                </Label>
              </div>
            </div>

            {/* רשימת נכסים */}
            <div className="space-y-3">
              <h3 className="font-semibold">{t.propertiesReferred}</h3>
              
              {/* Desktop view - table */}
              <div className="hidden md:block border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className={`p-2 ${language === 'he' ? 'text-right' : 'text-left'} text-sm`}>{t.propertyNumber}</th>
                      <th className={`p-2 ${language === 'he' ? 'text-right' : 'text-left'} text-sm`}>{t.address}</th>
                      {feeTypeSale && <th className={`p-2 ${language === 'he' ? 'text-right' : 'text-left'} text-sm`}>{t.gushHelka}</th>}
                      <th className={`p-2 ${language === 'he' ? 'text-right' : 'text-left'} text-sm`}>{t.floor}</th>
                      <th className={`p-2 ${language === 'he' ? 'text-right' : 'text-left'} text-sm`}>{t.rooms}</th>
                      <th className={`p-2 ${language === 'he' ? 'text-right' : 'text-left'} text-sm`}>{t.price}</th>
                      {!isFieldDisabled && <th className="p-2 w-10"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((property, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2 text-sm">{index + 1}</td>
                        <td className="p-2">
                          <Input
                            value={property.address}
                            onChange={(e) => handlePropertyChange(index, 'address', e.target.value)}
                            disabled={isFieldDisabled}
                            placeholder={t.address}
                            className="h-8"
                          />
                        </td>
                        {feeTypeSale && (
                          <td className="p-2">
                            <Input
                              value={property.gushHelka}
                              onChange={(e) => handlePropertyChange(index, 'gushHelka', e.target.value)}
                              disabled={isFieldDisabled}
                              placeholder={t.gushHelka}
                              className="h-8"
                            />
                          </td>
                        )}
                        <td className="p-2">
                          <Input
                            value={property.floor}
                            onChange={(e) => handlePropertyChange(index, 'floor', e.target.value)}
                            disabled={isFieldDisabled}
                            placeholder={t.floor}
                            className="h-8"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={property.rooms}
                            onChange={(e) => handlePropertyChange(index, 'rooms', e.target.value)}
                            disabled={isFieldDisabled}
                            placeholder={t.rooms}
                            className="h-8"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={property.price}
                            onChange={(e) => handlePropertyChange(index, 'price', e.target.value)}
                            disabled={isFieldDisabled}
                            placeholder={t.price}
                            className="h-8"
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

              {/* Mobile view - cards */}
              <div className="md:hidden space-y-3">
                {properties.map((property, index) => (
                  <Card key={index}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{t.property} {index + 1}</span>
                        {!isFieldDisabled && properties.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePropertyRow(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">{t.address}</Label>
                        <Input
                          value={property.address}
                          onChange={(e) => handlePropertyChange(index, 'address', e.target.value)}
                          disabled={isFieldDisabled}
                          placeholder={t.address}
                        />
                      </div>
                      {feeTypeSale && (
                        <div className="space-y-2">
                          <Label className="text-xs">{t.gushHelka}</Label>
                          <Input
                            value={property.gushHelka}
                            onChange={(e) => handlePropertyChange(index, 'gushHelka', e.target.value)}
                            disabled={isFieldDisabled}
                            placeholder={t.gushHelka}
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-2">
                          <Label className="text-xs">{t.floor}</Label>
                          <Input
                            value={property.floor}
                            onChange={(e) => handlePropertyChange(index, 'floor', e.target.value)}
                            disabled={isFieldDisabled}
                            placeholder={t.floor}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">{t.rooms}</Label>
                          <Input
                            value={property.rooms}
                            onChange={(e) => handlePropertyChange(index, 'rooms', e.target.value)}
                            disabled={isFieldDisabled}
                            placeholder={t.rooms}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">{t.price}</Label>
                          <Input
                            value={property.price}
                            onChange={(e) => handlePropertyChange(index, 'price', e.target.value)}
                            disabled={isFieldDisabled}
                            placeholder={t.price}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {!isFieldDisabled && (
                <Button onClick={addPropertyRow} variant="outline" size="sm">
                  <Plus className={`h-4 w-4 ${language === 'he' ? 'ml-2' : 'mr-2'}`} />
                  {t.addProperty}
                </Button>
              )}
            </div>

            {/* Special Terms */}
            <div>
              <Label>{t.specialTerms}</Label>
              <Textarea
                placeholder={t.specialTermsPlaceholder}
                value={specialTerms}
                onChange={(e) => setSpecialTerms(e.target.value)}
                disabled={isFieldDisabled}
              />
            </div>

            {/* תנאים משלימים */}
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <h3 className="font-semibold">{t.supplementaryTerms}</h3>
              <ol className={`text-sm text-muted-foreground space-y-2 ${language === 'he' ? 'pr-5' : 'pl-5'}`}>
                <li>{t.term1}</li>
                <li>{t.term2}</li>
                <li>{t.term3}</li>
                <li>{t.term4}</li>
                <li>{t.term5}</li>
                <li>{t.term6}</li>
                <li>{t.term7}</li>
              </ol>
            </div>

            <div className="border-t pt-6" />

            {/* Client Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t.clientDetails}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">{t.fullName}</Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder={t.clientName}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientId">{t.clientId}</Label>
                  <Input
                    id="clientId"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder={t.clientIdPlaceholder}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">{t.clientPhone}</Label>
                  <Input
                    id="clientPhone"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder={t.clientPhonePlaceholder}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientAddress">{t.clientAddress}</Label>
                  <Input
                    id="clientAddress"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    placeholder={t.clientAddressPlaceholder}
                  />
                </div>
              </div>
            </div>

            {/* Agent Signature - Only in 'new' mode */}
            {mode === 'new' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t.agentSignature}</Label>
                  <div className="flex items-center gap-2">
                    {hasAgentSignature && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle2 className={`h-3 w-3 ${language === 'he' ? 'ml-1' : 'mr-1'}`} />
                        {t.signed}
                      </Badge>
                    )}
                    <Button onClick={clearAgentSignature} variant="outline" size="sm">
                      <Trash2 className={`h-4 w-4 ${language === 'he' ? 'ml-2' : 'mr-2'}`} />
                      {t.clearSignature}
                    </Button>
                  </div>
                </div>
                <div className="border rounded-lg overflow-hidden bg-white">
                  <SignatureCanvas
                    ref={agentSignatureRef}
                    onEnd={checkAgentSignature}
                    canvasProps={{
                      className: 'w-full h-40',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Client Confirmation Checkbox */}
            <div className="bg-muted/50 p-4 rounded-lg border">
              <div className={`flex items-start ${language === 'he' ? 'space-x-3 space-x-reverse' : 'space-x-3'}`}>
                <Checkbox
                  id="clientConfirmation"
                  checked={clientConfirmation}
                  onCheckedChange={(checked) => setClientConfirmation(checked as boolean)}
                  className="mt-1"
                />
                <Label htmlFor="clientConfirmation" className="cursor-pointer text-sm leading-relaxed">
                  {t.confirmationText}
                </Label>
              </div>
            </div>

            {/* Client Signature */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t.clientSignature}</Label>
                <div className="flex items-center gap-2">
                  {hasSignature && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle2 className={`h-3 w-3 ${language === 'he' ? 'ml-1' : 'mr-1'}`} />
                      {t.signed}
                    </Badge>
                  )}
                  <Button onClick={clearSignature} variant="outline" size="sm">
                    <Trash2 className={`h-4 w-4 ${language === 'he' ? 'ml-2' : 'mr-2'}`} />
                    {t.clearSignature}
                  </Button>
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden bg-white">
                <SignatureCanvas
                  ref={signatureRef}
                  onEnd={checkSignature}
                  canvasProps={{
                    className: 'w-full h-40',
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={handleSaveForm} 
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className={`h-4 w-4 animate-spin ${language === 'he' ? 'ml-2' : 'mr-2'}`} />
                ) : (
                  <Save className={`h-4 w-4 ${language === 'he' ? 'ml-2' : 'mr-2'}`} />
                )}
                {t.saveForm}
              </Button>
              
              {!isRemoteSign && (
                <Button 
                  onClick={handleCreateLink} 
                  disabled={loading}
                  variant="outline"
                  className="flex-1"
                >
                  {loading ? (
                    <Loader2 className={`h-4 w-4 animate-spin ${language === 'he' ? 'ml-2' : 'mr-2'}`} />
                  ) : (
                    <Send className={`h-4 w-4 ${language === 'he' ? 'ml-2' : 'mr-2'}`} />
                  )}
                  {t.createLink}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BrokerageFormPage;
