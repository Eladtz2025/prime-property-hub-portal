import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Copy, Send, Loader2, FileText, Globe } from 'lucide-react';
import { BUSINESS_INFO } from '@/constants/business';
import { memorandumTranslations, MemorandumLanguage, useMemorandumTranslation } from '@/lib/memorandum-translations';
import { getValidationSchema, formatValidationErrors, sanitizeInput } from '@/utils/memorandumFormValidation';
import { downloadMemorandumPDF, MemorandumFormData } from '@/lib/memorandum-pdf-generator';
import { FormSignatureBox } from '@/components/forms/FormSignatureBox';
import { FormThankYouScreen } from '@/components/forms/FormThankYouScreen';
import { useWhatsAppSender } from '@/hooks/useWhatsAppSender';

const MemorandumFormPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const isRemoteSigning = !!token;

  const [language, setLanguage] = useState<MemorandumLanguage>('he');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [savedFormData, setSavedFormData] = useState<MemorandumFormData | null>(null);
  
  const { sendWhatsAppMessage, isSending: isSendingWhatsApp } = useWhatsAppSender();

  // Form state
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [clientName, setClientName] = useState('');
  const [clientIdNumber, setClientIdNumber] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyCity, setPropertyCity] = useState('');
  const [propertyFloor, setPropertyFloor] = useState('');
  const [propertyRooms, setPropertyRooms] = useState('');
  const [propertySize, setPropertySize] = useState('');
  const [rentalPrice, setRentalPrice] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [guarantees, setGuarantees] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  // Signatures
  const [clientSignature, setClientSignature] = useState('');
  const [agentSignature, setAgentSignature] = useState('');

  const t = useMemorandumTranslation(language);
  const isRTL = language === 'he';

  // Load token data if remote signing
  useEffect(() => {
    if (token) {
      loadTokenData();
    }
  }, [token]);

  // Pre-fill from URL params (when coming from property quick card)
  useEffect(() => {
    if (!token) {
      const address = searchParams.get('address');
      const city = searchParams.get('city');
      const rooms = searchParams.get('rooms');
      const floor = searchParams.get('floor');
      const price = searchParams.get('price');
      
      if (address) setPropertyAddress(address);
      if (city) setPropertyCity(city);
      if (rooms) setPropertyRooms(rooms);
      if (floor) setPropertyFloor(floor);
      if (price) setRentalPrice(price);
    }
  }, []);

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
      setLanguage(data.language as MemorandumLanguage || 'he');
      setPropertyAddress(formData.property_address || '');
      setPropertyCity(formData.property_city || '');
      setPropertyFloor(formData.property_floor || '');
      setPropertyRooms(formData.property_rooms || '');
      setPropertySize(formData.property_size || '');
      setRentalPrice(formData.rental_price || '');
      setDepositAmount(formData.deposit_amount || '');
      setPaymentMethod(formData.payment_method || '');
      setGuarantees(formData.guarantees || '');
      setEntryDate(formData.entry_date || '');
      setNotes(formData.notes || '');
      setAgentSignature(formData.agent_signature || '');
    } catch (err) {
      toast.error(t.errorLoadingForm);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const schema = getValidationSchema(language);
    const result = schema.safeParse({
      client_name: clientName,
      client_id_number: clientIdNumber,
      client_phone: clientPhone,
      client_email: clientEmail,
      property_address: propertyAddress,
      property_city: propertyCity,
      property_floor: propertyFloor,
      property_rooms: propertyRooms,
      property_size: propertySize,
      rental_price: rentalPrice,
      deposit_amount: depositAmount,
      payment_method: paymentMethod,
      guarantees: guarantees,
      entry_date: entryDate,
      form_date: formDate,
      notes: notes,
    });

    if (!result.success) {
      toast.error(formatValidationErrors(result.error));
      return false;
    }

    if (!clientSignature) {
      toast.error(t.errorTenantSignature);
      return false;
    }

    if (!confirmed) {
      toast.error(t.errorConfirmation);
      return false;
    }

    return true;
  };

  const getFormData = (): MemorandumFormData => ({
    client_name: sanitizeInput(clientName),
    client_id_number: sanitizeInput(clientIdNumber),
    client_phone: sanitizeInput(clientPhone),
    client_email: sanitizeInput(clientEmail),
    property_address: sanitizeInput(propertyAddress),
    property_city: sanitizeInput(propertyCity),
    property_floor: sanitizeInput(propertyFloor),
    property_rooms: sanitizeInput(propertyRooms),
    property_size: sanitizeInput(propertySize),
    rental_price: sanitizeInput(rentalPrice),
    deposit_amount: sanitizeInput(depositAmount),
    payment_method: sanitizeInput(paymentMethod),
    guarantees: sanitizeInput(guarantees),
    entry_date: entryDate,
    form_date: formDate,
    notes: sanitizeInput(notes),
    client_signature: clientSignature,
    agent_signature: agentSignature,
    language,
  });

  const handleSaveForm = async () => {
    if (!validateForm()) return;
    setIsSaving(true);

    try {
      const formData = getFormData();

      const { error } = await supabase.from('legal_forms').insert({
        form_type: 'memorandum',
        language,
        client_name: formData.client_name,
        client_id_number: formData.client_id_number,
        client_phone: formData.client_phone,
        client_email: formData.client_email,
        property_address: formData.property_address,
        property_city: formData.property_city,
        property_floor: formData.property_floor,
        property_rooms: formData.property_rooms,
        property_size: formData.property_size,
        rental_price: formData.rental_price,
        deposit_amount: formData.deposit_amount,
        payment_method: formData.payment_method,
        guarantees: formData.guarantees,
        entry_date: formData.entry_date || null,
        form_data: { notes: formData.notes },
        client_signature: formData.client_signature,
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
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('legal_form_tokens')
        .insert({
          form_type: 'memorandum',
          language,
          created_by: user?.id,
          form_data: {
            property_address: propertyAddress,
            property_city: propertyCity,
            property_floor: propertyFloor,
            property_rooms: propertyRooms,
            property_size: propertySize,
            rental_price: rentalPrice,
            deposit_amount: depositAmount,
            payment_method: paymentMethod,
            guarantees: guarantees,
            entry_date: entryDate,
            notes: notes,
            agent_signature: agentSignature,
          },
        })
        .select('token')
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/memorandum-form/${data.token}`;
      await navigator.clipboard.writeText(link);
      toast.success(t.linkCopied);
    } catch (err) {
      toast.error(t.errorCreatingLink);
    } finally {
      setIsSaving(false);
    }
  };

  if (showThankYou && savedFormData) {
    const handleSendWhatsApp = async () => {
      if (!savedFormData.client_phone) {
        throw new Error('No phone number');
      }
      const message = t.whatsAppMessageTemplate
        .replace('{name}', savedFormData.client_name)
        .replace('{address}', `${savedFormData.property_address}, ${savedFormData.property_city}`);
      
      await sendWhatsAppMessage({
        phone: savedFormData.client_phone,
        message,
      });
    };

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
        onDownloadPDF={() => downloadMemorandumPDF(savedFormData)}
        onFinish={() => window.close()}
        isRTL={isRTL}
        onSendWhatsApp={handleSendWhatsApp}
        sendWhatsAppText={t.sendViaWhatsApp}
        whatsAppSentText={t.whatsAppSent}
        whatsAppErrorText={t.whatsAppError}
        sendingWhatsAppText={t.sendingWhatsApp}
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
    <div className={`min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <Card>
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-between mb-2">
              <Select value={language} onValueChange={(v) => setLanguage(v as MemorandumLanguage)}>
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
            <CardTitle className="text-2xl text-primary flex items-center justify-center gap-2">
              <FileText className="h-6 w-6" />
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

        {/* Tenant Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t.tenantDetails}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t.tenantName} *</Label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder={t.tenantNamePlaceholder} />
              </div>
              <div>
                <Label>{t.tenantId} *</Label>
                <Input value={clientIdNumber} onChange={(e) => setClientIdNumber(e.target.value)} placeholder={t.tenantIdPlaceholder} dir="ltr" />
              </div>
              <div>
                <Label>{t.tenantPhone} *</Label>
                <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder={t.tenantPhonePlaceholder} dir="ltr" />
              </div>
              <div>
                <Label>{t.tenantEmail}</Label>
                <Input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder={t.tenantEmailPlaceholder} dir="ltr" />
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
            </div>
          </CardContent>
        </Card>

        {/* Financial Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t.financialDetails}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t.rentalPrice} *</Label>
                <Input value={rentalPrice} onChange={(e) => setRentalPrice(e.target.value)} placeholder={t.rentalPricePlaceholder} disabled={isRemoteSigning} />
              </div>
              <div>
                <Label>{t.brokerageFee}</Label>
                <Input value={t.brokerageFeeValue} disabled className="bg-muted text-muted-foreground cursor-not-allowed" />
              </div>
              <div>
                <Label>{t.depositAmount}</Label>
                <Input value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder={t.depositAmountPlaceholder} disabled={isRemoteSigning} />
              </div>
              <div>
                <Label>{t.paymentMethod}</Label>
                <Input value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} placeholder={t.paymentMethodPlaceholder} disabled={isRemoteSigning} />
              </div>
              <div>
                <Label>{t.entryDate}</Label>
                <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} disabled={isRemoteSigning} />
              </div>
            </div>
            <div>
              <Label>{t.guarantees}</Label>
              <Input value={guarantees} onChange={(e) => setGuarantees(e.target.value)} placeholder={t.guaranteesPlaceholder} disabled={isRemoteSigning} />
            </div>
          </CardContent>
        </Card>

        {/* Declaration */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t.declaration}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{t.declarationText1}</p>
            <p>{t.declarationText2}</p>
            <p>{t.declarationText3}</p>
            <p>{t.declarationText4}</p>
            <p className="font-medium text-foreground">{t.declarationText5}</p>
            <div className="border-t pt-2 mt-2">
              <p className="italic">{t.commissionNote}</p>
              <p className="italic">{t.depositCheck}</p>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t.additionalNotes}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.notesPlaceholder} disabled={isRemoteSigning} />
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
              label={t.tenantSignature}
              signatureData={clientSignature}
              onSignatureChange={setClientSignature}
              onClear={() => setClientSignature('')}
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
              <Checkbox id="confirm" checked={confirmed} onCheckedChange={(c) => setConfirmed(!!c)} />
              <Label htmlFor="confirm" className="text-sm cursor-pointer">{t.confirmationText}</Label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button onClick={handleSaveForm} disabled={isSaving} size="lg" className="w-full">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {t.saveForm}
          </Button>
          {!isRemoteSigning && (
            <div className="flex gap-2">
              <Button onClick={handleCreateLink} disabled={isSaving} variant="outline" className="flex-1 gap-2">
                <Copy className="h-4 w-4" /> {t.createLink}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemorandumFormPage;
