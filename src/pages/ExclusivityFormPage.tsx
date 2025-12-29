import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';
import { Copy, Loader2, FileText, Globe, Shield } from 'lucide-react';
import { BUSINESS_INFO } from '@/constants/business';
import { exclusivityTranslations, ExclusivityLanguage, useExclusivityTranslation } from '@/lib/exclusivity-translations';
import { getExclusivityValidationSchema, formatExclusivityValidationErrors, sanitizeExclusivityInput, calculateEndDate } from '@/utils/exclusivityFormValidation';
import { downloadExclusivityPDF, ExclusivityFormData } from '@/lib/exclusivity-pdf-generator';
import { FormSignatureBox } from '@/components/forms/FormSignatureBox';
import { FormThankYouScreen } from '@/components/forms/FormThankYouScreen';

const ExclusivityFormPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const isRemoteSigning = !!token;

  const [language, setLanguage] = useState<ExclusivityLanguage>('he');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [savedFormData, setSavedFormData] = useState<ExclusivityFormData | null>(null);

  // Form state
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [sellerName, setSellerName] = useState('');
  const [sellerIdNumber, setSellerIdNumber] = useState('');
  const [sellerAddress, setSellerAddress] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerEmail, setSellerEmail] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyCity, setPropertyCity] = useState('');
  const [propertyFloor, setPropertyFloor] = useState('');
  const [propertyRooms, setPropertyRooms] = useState('');
  const [propertySize, setPropertySize] = useState('');
  const [propertyGushHelka, setPropertyGushHelka] = useState('');
  const [exclusivityPeriod, setExclusivityPeriod] = useState('90');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [askingPrice, setAskingPrice] = useState('');
  const [commissionPercentage, setCommissionPercentage] = useState('2');
  const [commissionIncludesVat, setCommissionIncludesVat] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Signatures
  const [sellerSignature, setSellerSignature] = useState('');
  const [agentSignature, setAgentSignature] = useState('');

  const t = useExclusivityTranslation(language);
  const isRTL = language === 'he';

  // Calculate end date automatically
  const endDate = calculateEndDate(startDate, parseInt(exclusivityPeriod) || 0);

  // Load token data if remote signing
  useEffect(() => {
    if (token) {
      loadTokenData();
    }
  }, [token]);

  const loadTokenData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('legal_form_tokens')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (error || !data) {
        toast.error(t.errorInvalidLink);
        return;
      }

      const formData = data.form_data as any;
      setLanguage(data.language as ExclusivityLanguage || 'he');
      setPropertyAddress(formData.property_address || '');
      setPropertyCity(formData.property_city || '');
      setPropertyFloor(formData.property_floor || '');
      setPropertyRooms(formData.property_rooms || '');
      setPropertySize(formData.property_size || '');
      setPropertyGushHelka(formData.property_gush_helka || '');
      setExclusivityPeriod(formData.exclusivity_period || '90');
      setStartDate(formData.start_date || format(new Date(), 'yyyy-MM-dd'));
      setAskingPrice(formData.asking_price || '');
      setCommissionPercentage(formData.commission_percentage || '2');
      setCommissionIncludesVat(formData.commission_includes_vat || false);
      setAgentSignature(formData.agent_signature || '');
    } catch (err) {
      toast.error(t.errorLoadingForm);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const schema = getExclusivityValidationSchema(language);
    const result = schema.safeParse({
      seller_name: sellerName,
      seller_id_number: sellerIdNumber,
      seller_address: sellerAddress,
      seller_phone: sellerPhone,
      seller_email: sellerEmail,
      property_address: propertyAddress,
      property_city: propertyCity,
      property_floor: propertyFloor,
      property_rooms: propertyRooms,
      property_size: propertySize,
      property_gush_helka: propertyGushHelka,
      exclusivity_period: exclusivityPeriod,
      start_date: startDate,
      asking_price: askingPrice,
      commission_percentage: commissionPercentage,
      commission_includes_vat: commissionIncludesVat,
      form_date: formDate,
    });

    if (!result.success) {
      toast.error(formatExclusivityValidationErrors(result.error));
      return false;
    }

    if (!sellerSignature) {
      toast.error(t.errorSellerSignature);
      return false;
    }

    if (!confirmed) {
      toast.error(t.errorConfirmation);
      return false;
    }

    return true;
  };

  const getFormData = (): ExclusivityFormData => ({
    seller_name: sanitizeExclusivityInput(sellerName),
    seller_id_number: sanitizeExclusivityInput(sellerIdNumber),
    seller_address: sanitizeExclusivityInput(sellerAddress),
    seller_phone: sanitizeExclusivityInput(sellerPhone),
    seller_email: sanitizeExclusivityInput(sellerEmail),
    property_address: sanitizeExclusivityInput(propertyAddress),
    property_city: sanitizeExclusivityInput(propertyCity),
    property_floor: sanitizeExclusivityInput(propertyFloor),
    property_rooms: sanitizeExclusivityInput(propertyRooms),
    property_size: sanitizeExclusivityInput(propertySize),
    property_gush_helka: sanitizeExclusivityInput(propertyGushHelka),
    exclusivity_period: exclusivityPeriod,
    start_date: startDate,
    end_date: endDate,
    asking_price: sanitizeExclusivityInput(askingPrice),
    commission_percentage: commissionPercentage,
    commission_includes_vat: commissionIncludesVat,
    form_date: formDate,
    seller_signature: sellerSignature,
    agent_signature: agentSignature,
    language,
  });

  const handleSaveForm = async () => {
    if (!validateForm()) return;
    setIsSaving(true);

    try {
      const formData = getFormData();

      const { error } = await supabase.from('legal_forms').insert({
        form_type: 'exclusivity',
        language,
        client_name: formData.seller_name,
        client_id_number: formData.seller_id_number,
        client_phone: formData.seller_phone,
        client_email: formData.seller_email,
        client_address: formData.seller_address,
        property_address: formData.property_address,
        property_city: formData.property_city,
        property_floor: formData.property_floor,
        property_rooms: formData.property_rooms,
        property_size: formData.property_size,
        form_data: {
          property_gush_helka: formData.property_gush_helka,
          exclusivity_period: formData.exclusivity_period,
          start_date: formData.start_date,
          end_date: formData.end_date,
          asking_price: formData.asking_price,
          commission_percentage: formData.commission_percentage,
          commission_includes_vat: formData.commission_includes_vat,
        },
        client_signature: formData.seller_signature,
        agent_signature: formData.agent_signature,
        status: 'signed',
        signed_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Update token if remote signing
      if (token) {
        await supabase
          .from('legal_form_tokens')
          .update({ status: 'signed', signed_at: new Date().toISOString() })
          .eq('token', token);
      }

      setSavedFormData(formData);
      setShowThankYou(true);
      toast.success(t.formSaved);
    } catch (err) {
      toast.error(t.errorSavingForm);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateLink = async () => {
    if (!agentSignature) {
      toast.error(t.errorAgentSignature);
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('legal_form_tokens')
        .insert({
          form_type: 'exclusivity',
          language,
          form_data: {
            property_address: propertyAddress,
            property_city: propertyCity,
            property_floor: propertyFloor,
            property_rooms: propertyRooms,
            property_size: propertySize,
            property_gush_helka: propertyGushHelka,
            exclusivity_period: exclusivityPeriod,
            start_date: startDate,
            asking_price: askingPrice,
            commission_percentage: commissionPercentage,
            commission_includes_vat: commissionIncludesVat,
            agent_signature: agentSignature,
          },
        })
        .select('token')
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/exclusivity-form?token=${data.token}`;
      await navigator.clipboard.writeText(link);
      toast.success(t.linkCopied);
    } catch (err) {
      toast.error(t.errorCreatingLink);
    } finally {
      setIsSaving(false);
    }
  };

  if (showThankYou && savedFormData) {
    return (
      <FormThankYouScreen
        title={t.thankYouTitle}
        message={t.thankYouMessage}
        enterEmailText={t.enterEmail}
        sendEmailText={t.sendEmailCopy}
        downloadPDFText={t.downloadPDF}
        finishText={t.closeAndFinish}
        sendingText={t.sending}
        generatingText={t.generating}
        emailSentText={t.emailSent}
        emailErrorText={t.emailError}
        invalidEmailText={t.invalidEmail}
        onDownloadPDF={() => downloadExclusivityPDF(savedFormData)}
        onFinish={() => window.close()}
        isRTL={isRTL}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b from-red-50 to-white p-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <Card>
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-between mb-2">
              <Select value={language} onValueChange={(v) => setLanguage(v as ExclusivityLanguage)}>
                <SelectTrigger className="w-32">
                  <Globe className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="he">עברית</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-40"
              />
            </div>
            <CardTitle className="text-2xl text-destructive flex items-center justify-center gap-2">
              <Shield className="h-6 w-6" />
              {t.title}
            </CardTitle>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </CardHeader>
        </Card>

        {/* Agent Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t.agentDetails}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <p><strong>{isRTL ? 'משרד' : 'Office'}:</strong> {BUSINESS_INFO.name}</p>
            <p><strong>{t.agentName}:</strong> {isRTL ? BUSINESS_INFO.brokerName : BUSINESS_INFO.brokerNameEn}</p>
            <p><strong>{t.agentLicense}:</strong> {BUSINESS_INFO.license}</p>
            <p><strong>{t.agentPhone}:</strong> {BUSINESS_INFO.phone}</p>
          </CardContent>
        </Card>

        {/* Seller Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t.sellerDetails}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t.sellerName} *</Label>
                <Input value={sellerName} onChange={(e) => setSellerName(e.target.value)} placeholder={t.sellerNamePlaceholder} />
              </div>
              <div>
                <Label>{t.sellerId} *</Label>
                <Input value={sellerIdNumber} onChange={(e) => setSellerIdNumber(e.target.value)} placeholder={t.sellerIdPlaceholder} dir="ltr" />
              </div>
              <div className="col-span-2">
                <Label>{t.sellerAddress} *</Label>
                <Input value={sellerAddress} onChange={(e) => setSellerAddress(e.target.value)} placeholder={t.sellerAddressPlaceholder} />
              </div>
              <div>
                <Label>{t.sellerPhone} *</Label>
                <Input value={sellerPhone} onChange={(e) => setSellerPhone(e.target.value)} placeholder={t.sellerPhonePlaceholder} dir="ltr" />
              </div>
              <div>
                <Label>{t.sellerEmail}</Label>
                <Input value={sellerEmail} onChange={(e) => setSellerEmail(e.target.value)} placeholder={t.sellerEmailPlaceholder} dir="ltr" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t.propertyDetails}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t.propertyAddress} *</Label>
                <Input value={propertyAddress} onChange={(e) => setPropertyAddress(e.target.value)} placeholder={t.propertyAddressPlaceholder} disabled={isRemoteSigning} />
              </div>
              <div>
                <Label>{t.propertyCity} *</Label>
                <Input value={propertyCity} onChange={(e) => setPropertyCity(e.target.value)} placeholder={t.propertyCityPlaceholder} disabled={isRemoteSigning} />
              </div>
              <div>
                <Label>{t.propertyFloor}</Label>
                <Input value={propertyFloor} onChange={(e) => setPropertyFloor(e.target.value)} placeholder={t.propertyFloorPlaceholder} disabled={isRemoteSigning} />
              </div>
              <div>
                <Label>{t.propertyRooms}</Label>
                <Input value={propertyRooms} onChange={(e) => setPropertyRooms(e.target.value)} placeholder={t.propertyRoomsPlaceholder} disabled={isRemoteSigning} />
              </div>
              <div>
                <Label>{t.propertySize}</Label>
                <Input value={propertySize} onChange={(e) => setPropertySize(e.target.value)} placeholder={t.propertySizePlaceholder} disabled={isRemoteSigning} />
              </div>
              <div>
                <Label>{t.propertyGushHelka}</Label>
                <Input value={propertyGushHelka} onChange={(e) => setPropertyGushHelka(e.target.value)} placeholder={t.propertyGushHelkaPlaceholder} disabled={isRemoteSigning} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exclusivity Terms */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t.exclusivityTerms}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t.exclusivityPeriod} *</Label>
                <Input 
                  type="number" 
                  value={exclusivityPeriod} 
                  onChange={(e) => setExclusivityPeriod(e.target.value)} 
                  placeholder={t.exclusivityPeriodPlaceholder} 
                  min="7" 
                  max="180" 
                  disabled={isRemoteSigning} 
                />
              </div>
              <div>
                <Label>{t.askingPrice} *</Label>
                <Input value={askingPrice} onChange={(e) => setAskingPrice(e.target.value)} placeholder={t.askingPricePlaceholder} disabled={isRemoteSigning} />
              </div>
              <div>
                <Label>{t.startDate} *</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={isRemoteSigning} />
              </div>
              <div>
                <Label>{t.endDate}</Label>
                <Input type="date" value={endDate} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground mt-1">{t.endDateCalculated}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commission Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t.commissionDetails}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t.commissionPercentage} *</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={commissionPercentage} 
                    onChange={(e) => setCommissionPercentage(e.target.value)} 
                    placeholder={t.commissionPercentagePlaceholder} 
                    disabled={isRemoteSigning}
                    className="w-20"
                  />
                  <span>%</span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Checkbox 
                  id="vat" 
                  checked={commissionIncludesVat} 
                  onCheckedChange={(checked) => setCommissionIncludesVat(!!checked)}
                  disabled={isRemoteSigning}
                />
                <Label htmlFor="vat" className="cursor-pointer">
                  {t.includesVat}
                </Label>
              </div>
            </div>
            <div className="p-3 bg-muted rounded-md text-sm">
              <strong>{t.breachCompensation}:</strong> {t.breachCompensationNote}
            </div>
          </CardContent>
        </Card>

        {/* Legal Terms */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t.legalTerms}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. {t.legalText1}</p>
            <p>2. {t.legalText2}</p>
            <p>3. {t.legalText3}</p>
            <p>4. {t.legalText4}</p>
            <p>5. {t.legalText5}</p>
          </CardContent>
        </Card>

        {/* Signatures */}
        <Card>
          <CardContent className="pt-6 space-y-6">
            {!isRemoteSigning && (
              <FormSignatureBox
                label={t.agentSignature}
                signatureData={agentSignature}
                onSignatureChange={setAgentSignature}
                onClear={() => setAgentSignature('')}
                clearText={t.clearSignature}
                signedText={t.signed}
                isRTL={isRTL}
              />
            )}
            <FormSignatureBox
              label={t.sellerSignature}
              signatureData={sellerSignature}
              onSignatureChange={setSellerSignature}
              onClear={() => setSellerSignature('')}
              clearText={t.clearSignature}
              signedText={t.signed}
              isRTL={isRTL}
            />
          </CardContent>
        </Card>

        {/* Confirmation */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Checkbox 
                id="confirm" 
                checked={confirmed} 
                onCheckedChange={(checked) => setConfirmed(!!checked)}
              />
              <Label htmlFor="confirm" className="text-sm cursor-pointer leading-relaxed">
                {t.confirmationText}
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleSaveForm}
            disabled={isSaving}
            className="flex-1 bg-destructive hover:bg-destructive/90"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            {t.saveForm}
          </Button>
          
          {!isRemoteSigning && (
            <Button
              variant="outline"
              onClick={handleCreateLink}
              disabled={isSaving}
              className="flex-1"
            >
              <Copy className="h-4 w-4 mr-2" />
              {t.createLink}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExclusivityFormPage;
