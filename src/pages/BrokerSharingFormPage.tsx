import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Globe, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { FormSignatureBox } from '@/components/forms/FormSignatureBox';
import { FormThankYouScreen } from '@/components/forms/FormThankYouScreen';
import { brokerSharingTranslations, BrokerSharingLanguage } from '@/lib/broker-sharing-translations';
import { getBrokerSharingValidationSchema, sanitizeBrokerSharingInput } from '@/utils/brokerSharingFormValidation';
import { generateBrokerSharingPDF, BrokerSharingFormData } from '@/lib/broker-sharing-pdf-generator';
import { BUSINESS_INFO } from '@/constants/business';

const BrokerSharingFormPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [language, setLanguage] = useState<BrokerSharingLanguage>('he');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [savedFormId, setSavedFormId] = useState<string | null>(null);
  
  // Form state
  const [secondaryBrokerName, setSecondaryBrokerName] = useState('');
  const [secondaryBrokerLicense, setSecondaryBrokerLicense] = useState('');
  const [secondaryBrokerPhone, setSecondaryBrokerPhone] = useState('');
  const [secondaryBrokerEmail, setSecondaryBrokerEmail] = useState('');
  const [secondaryBrokerCompany, setSecondaryBrokerCompany] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyCity, setPropertyCity] = useState('');
  const [transactionType, setTransactionType] = useState<'sale' | 'rental'>('sale');
  const [primaryBrokerShare, setPrimaryBrokerShare] = useState('50');
  const [secondaryBrokerShare, setSecondaryBrokerShare] = useState('50');
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [primaryBrokerSignature, setPrimaryBrokerSignature] = useState('');
  const [secondaryBrokerSignature, setSecondaryBrokerSignature] = useState('');
  const [confirmation, setConfirmation] = useState(false);

  const t = brokerSharingTranslations[language];
  const isRTL = language === 'he';

  // Load existing form data if token exists
  useEffect(() => {
    if (token) {
      loadTokenData();
    }
  }, [token]);

  const loadTokenData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('legal_form_tokens')
        .select('*')
        .eq('token', token)
        .eq('form_type', 'broker_sharing')
        .eq('status', 'pending')
        .single();

      if (error || !data) {
        toast.error(t.errorInvalidLink);
        return;
      }

      const formData = data.form_data as Record<string, unknown>;
      setLanguage((data.language as BrokerSharingLanguage) || 'he');
      setSecondaryBrokerName(String(formData.secondary_broker_name || ''));
      setSecondaryBrokerLicense(String(formData.secondary_broker_license || ''));
      setSecondaryBrokerPhone(String(formData.secondary_broker_phone || ''));
      setSecondaryBrokerEmail(String(formData.secondary_broker_email || ''));
      setSecondaryBrokerCompany(String(formData.secondary_broker_company || ''));
      setPropertyAddress(String(formData.property_address || ''));
      setPropertyCity(String(formData.property_city || ''));
      setTransactionType((formData.transaction_type as 'sale' | 'rental') || 'sale');
      setPrimaryBrokerShare(String(formData.primary_broker_share || '50'));
      setSecondaryBrokerShare(String(formData.secondary_broker_share || '50'));
      setFormDate(String(formData.form_date || format(new Date(), 'yyyy-MM-dd')));
      setPrimaryBrokerSignature(String(formData.primary_broker_signature || ''));
    } catch (error) {
      console.error('Error loading form data:', error);
      toast.error(t.errorLoadingForm);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const schema = getBrokerSharingValidationSchema(language);
    
    const result = schema.safeParse({
      secondary_broker_name: sanitizeBrokerSharingInput(secondaryBrokerName),
      secondary_broker_license: sanitizeBrokerSharingInput(secondaryBrokerLicense),
      secondary_broker_phone: sanitizeBrokerSharingInput(secondaryBrokerPhone),
      secondary_broker_email: sanitizeBrokerSharingInput(secondaryBrokerEmail),
      secondary_broker_company: sanitizeBrokerSharingInput(secondaryBrokerCompany),
      property_address: sanitizeBrokerSharingInput(propertyAddress),
      property_city: sanitizeBrokerSharingInput(propertyCity),
      transaction_type: transactionType,
      primary_broker_share: primaryBrokerShare,
      secondary_broker_share: secondaryBrokerShare,
      form_date: formDate,
    });

    if (!result.success) {
      const errorMessage = result.error.errors[0]?.message || t.errorFillRequired;
      toast.error(errorMessage);
      return false;
    }

    if (!primaryBrokerSignature) {
      toast.error(t.errorPrimarySignature);
      return false;
    }

    if (!secondaryBrokerSignature) {
      toast.error(t.errorSecondarySignature);
      return false;
    }

    if (!confirmation) {
      toast.error(t.errorConfirmation);
      return false;
    }

    return true;
  };

  const getFormData = (): BrokerSharingFormData => ({
    primary_broker_name: language === 'he' ? BUSINESS_INFO.brokerName : BUSINESS_INFO.brokerNameEn,
    primary_broker_license: BUSINESS_INFO.license,
    primary_broker_phone: BUSINESS_INFO.phone,
    primary_broker_company: BUSINESS_INFO.name,
    secondary_broker_name: sanitizeBrokerSharingInput(secondaryBrokerName),
    secondary_broker_license: sanitizeBrokerSharingInput(secondaryBrokerLicense),
    secondary_broker_phone: sanitizeBrokerSharingInput(secondaryBrokerPhone),
    secondary_broker_email: sanitizeBrokerSharingInput(secondaryBrokerEmail),
    secondary_broker_company: sanitizeBrokerSharingInput(secondaryBrokerCompany),
    property_address: sanitizeBrokerSharingInput(propertyAddress),
    property_city: sanitizeBrokerSharingInput(propertyCity),
    transaction_type: transactionType,
    primary_broker_share: primaryBrokerShare,
    secondary_broker_share: secondaryBrokerShare,
    form_date: formDate,
    primary_broker_signature: primaryBrokerSignature,
    secondary_broker_signature: secondaryBrokerSignature,
    language,
  });

  const handleSaveForm = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const formData = getFormData();

      const { data, error } = await supabase
        .from('legal_forms')
        .insert([{
          form_type: 'broker_sharing',
          language,
          status: 'signed',
          signed_at: new Date().toISOString(),
          client_name: secondaryBrokerName,
          property_address: propertyAddress,
          form_data: formData as unknown as Json,
        }])
        .select()
        .single();

      if (error) throw error;

      setSavedFormId(data.id);

      // Update token status if signing via link
      if (token) {
        await supabase
          .from('legal_form_tokens')
          .update({ status: 'signed', signed_at: new Date().toISOString() })
          .eq('token', token);
      }

      setFormSubmitted(true);
      toast.success(t.formSaved);
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error(t.errorSavingForm);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateLink = async () => {
    if (!secondaryBrokerName || !propertyAddress) {
      toast.error(t.errorFillRequired);
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const formData = getFormData();
      const newToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { error } = await supabase
        .from('legal_form_tokens')
        .insert([{
          token: newToken,
          form_type: 'broker_sharing',
          language,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
          created_by: user?.id,
          form_data: formData as unknown as Json,
        }]);

      if (error) throw error;

      const link = `${window.location.origin}/broker-sharing-form/${newToken}`;
      await navigator.clipboard.writeText(link);
      toast.success(t.linkCopied);
    } catch (error) {
      console.error('Error creating link:', error);
      toast.error(t.errorCreatingLink);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const formData = getFormData();
      const pdf = await generateBrokerSharingPDF(formData);
      const fileName = `broker-sharing-${secondaryBrokerName.replace(/\s+/g, '-')}-${formDate}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('שגיאה ביצירת ה-PDF');
    }
  };

  // Auto-calculate secondary share when primary changes
  useEffect(() => {
    const primary = parseFloat(primaryBrokerShare) || 0;
    if (primary >= 0 && primary <= 100) {
      setSecondaryBrokerShare(String(100 - primary));
    }
  }, [primaryBrokerShare]);

  if (formSubmitted) {
    return (
      <FormThankYouScreen
        title={t.thankYouTitle}
        message={t.thankYouMessage}
        downloadPDFText={t.downloadPDF}
        enterEmailText={t.enterEmail}
        sendEmailText={t.sendEmailCopy}
        finishText={t.closeAndFinish}
        sendingText={t.sending}
        generatingText={t.generating}
        emailSentText={t.emailSent}
        emailErrorText={t.emailError}
        invalidEmailText={t.invalidEmail}
        onDownloadPDF={handleDownloadPDF}
        onFinish={() => window.close()}
        isRTL={isRTL}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background py-6 px-4 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Language selector */}
        <div className="flex justify-end">
          <Select value={language} onValueChange={(val) => setLanguage(val as BrokerSharingLanguage)}>
            <SelectTrigger className="w-32">
              <Globe className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="he">{t.hebrew}</SelectItem>
              <SelectItem value="en">{t.english}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Header */}
        <Card className="border-primary/20">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-2">
              <Users className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-xl text-primary">{t.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{t.subtitle}</p>
          </CardHeader>
        </Card>

        {/* Primary Broker Details (Read-only) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t.primaryBrokerDetails}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">{t.brokerCompany}</Label>
              <p className="text-sm font-medium">{BUSINESS_INFO.name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t.brokerName}</Label>
              <p className="text-sm font-medium">{isRTL ? BUSINESS_INFO.brokerName : BUSINESS_INFO.brokerNameEn}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t.brokerLicense}</Label>
              <p className="text-sm font-medium">{BUSINESS_INFO.license}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t.brokerPhone}</Label>
              <p className="text-sm font-medium">{BUSINESS_INFO.phone}</p>
            </div>
          </CardContent>
        </Card>

        {/* Secondary Broker Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t.secondaryBrokerDetails}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>{t.secondaryBrokerName} *</Label>
                <Input
                  value={secondaryBrokerName}
                  onChange={(e) => setSecondaryBrokerName(e.target.value)}
                  placeholder={t.secondaryBrokerNamePlaceholder}
                />
              </div>
              <div>
                <Label>{t.secondaryBrokerLicense} *</Label>
                <Input
                  value={secondaryBrokerLicense}
                  onChange={(e) => setSecondaryBrokerLicense(e.target.value)}
                  placeholder={t.secondaryBrokerLicensePlaceholder}
                />
              </div>
              <div>
                <Label>{t.secondaryBrokerPhone} *</Label>
                <Input
                  value={secondaryBrokerPhone}
                  onChange={(e) => setSecondaryBrokerPhone(e.target.value)}
                  placeholder={t.secondaryBrokerPhonePlaceholder}
                  type="tel"
                />
              </div>
              <div>
                <Label>{t.secondaryBrokerEmail}</Label>
                <Input
                  value={secondaryBrokerEmail}
                  onChange={(e) => setSecondaryBrokerEmail(e.target.value)}
                  placeholder={t.secondaryBrokerEmailPlaceholder}
                  type="email"
                />
              </div>
              <div>
                <Label>{t.secondaryBrokerCompany}</Label>
                <Input
                  value={secondaryBrokerCompany}
                  onChange={(e) => setSecondaryBrokerCompany(e.target.value)}
                  placeholder={t.secondaryBrokerCompanyPlaceholder}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t.propertyDetails}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>{t.propertyAddress} *</Label>
                <Input
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  placeholder={t.propertyAddressPlaceholder}
                />
              </div>
              <div>
                <Label>{t.propertyCity} *</Label>
                <Input
                  value={propertyCity}
                  onChange={(e) => setPropertyCity(e.target.value)}
                  placeholder={t.propertyCityPlaceholder}
                />
              </div>
              <div>
                <Label>{t.transactionType} *</Label>
                <RadioGroup
                  value={transactionType}
                  onValueChange={(val) => setTransactionType(val as 'sale' | 'rental')}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="sale" id="sale" />
                    <Label htmlFor="sale" className="cursor-pointer">{t.sale}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="rental" id="rental" />
                    <Label htmlFor="rental" className="cursor-pointer">{t.rental}</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commission Split */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t.commissionSplit}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t.primaryBrokerShare} *</Label>
                <div className="relative">
                  <Input
                    value={primaryBrokerShare}
                    onChange={(e) => setPrimaryBrokerShare(e.target.value)}
                    placeholder={t.primaryBrokerSharePlaceholder}
                    type="number"
                    min="0"
                    max="100"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>
              <div>
                <Label>{t.secondaryBrokerShare}</Label>
                <div className="relative">
                  <Input
                    value={secondaryBrokerShare}
                    disabled
                    className="bg-muted"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t.commissionNote}</p>
          </CardContent>
        </Card>

        {/* Legal Terms */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t.legalTerms}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. {t.legalText1}</p>
            <p>2. {t.legalText2}</p>
            <p>3. {t.legalText3}</p>
            <p>4. {t.legalText4}</p>
            <p>5. {t.legalText5}</p>
            <p>6. {t.legalText6}</p>
          </CardContent>
        </Card>

        {/* Signatures */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t.primaryBrokerSignature}</CardTitle>
          </CardHeader>
          <CardContent>
            <FormSignatureBox
              label={t.primaryBrokerSignature}
              signatureData={primaryBrokerSignature}
              onSignatureChange={setPrimaryBrokerSignature}
              onClear={() => setPrimaryBrokerSignature('')}
              clearText={t.clearSignature}
              signedText={t.signed}
              isRTL={isRTL}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t.secondaryBrokerSignature}</CardTitle>
          </CardHeader>
          <CardContent>
            <FormSignatureBox
              label={t.secondaryBrokerSignature}
              signatureData={secondaryBrokerSignature}
              onSignatureChange={setSecondaryBrokerSignature}
              onClear={() => setSecondaryBrokerSignature('')}
              clearText={t.clearSignature}
              signedText={t.signed}
              isRTL={isRTL}
            />
          </CardContent>
        </Card>

        {/* Confirmation */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="confirmation"
                checked={confirmation}
                onCheckedChange={(checked) => setConfirmation(checked as boolean)}
              />
              <Label htmlFor="confirmation" className="text-sm leading-relaxed cursor-pointer">
                {t.confirmationText}
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleSaveForm}
            disabled={saving}
            size="lg"
            className="w-full"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {t.saveForm}
          </Button>
          
          <Button
            onClick={handleCreateLink}
            variant="outline"
            disabled={saving}
            size="lg"
            className="w-full"
          >
            {t.createLink}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BrokerSharingFormPage;
