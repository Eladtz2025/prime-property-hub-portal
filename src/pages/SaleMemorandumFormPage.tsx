import React, { useState, useEffect } from 'react';
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
import { saleMemorandumTranslations, SaleMemorandumLanguage, useSaleMemorandumTranslation } from '@/lib/sale-memorandum-translations';
import { downloadSaleMemorandumPDF, SaleMemorandumFormData } from '@/lib/sale-memorandum-pdf-generator';
import { FormSignatureBox } from '@/components/forms/FormSignatureBox';
import { FormThankYouScreen } from '@/components/forms/FormThankYouScreen';

const SaleMemorandumFormPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const isRemoteSigning = !!token;

  const [language, setLanguage] = useState<SaleMemorandumLanguage>('he');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [savedFormData, setSavedFormData] = useState<SaleMemorandumFormData | null>(null);

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
  const [salePrice, setSalePrice] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [transferDate, setTransferDate] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  // Signatures
  const [clientSignature, setClientSignature] = useState('');
  const [agentSignature, setAgentSignature] = useState('');

  const t = useSaleMemorandumTranslation(language);
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
      if (price) setSalePrice(price);
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
      setLanguage(data.language as SaleMemorandumLanguage || 'he');
      setPropertyAddress(formData.property_address || '');
      setPropertyCity(formData.property_city || '');
      setPropertyFloor(formData.property_floor || '');
      setPropertyRooms(formData.property_rooms || '');
      setPropertySize(formData.property_size || '');
      setSalePrice(formData.sale_price || '');
      setDepositAmount(formData.deposit_amount || '');
      setPaymentMethod(formData.payment_method || '');
      setPaymentTerms(formData.payment_terms || '');
      setTransferDate(formData.transfer_date || '');
      setNotes(formData.notes || '');
      setAgentSignature(formData.agent_signature || '');
    } catch (err) {
      toast.error(t.errorLoadingForm);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!clientName || !clientIdNumber || !clientPhone) {
      toast.error(t.errorBuyerDetails);
      return false;
    }
    if (!propertyAddress || !propertyCity) {
      toast.error(t.errorPropertyDetails);
      return false;
    }
    if (!salePrice) {
      toast.error(t.errorSalePrice);
      return false;
    }
    if (!clientSignature) {
      toast.error(t.errorBuyerSignature);
      return false;
    }
    if (!confirmed) {
      toast.error(t.errorConfirmation);
      return false;
    }
    return true;
  };

  const getFormData = (): SaleMemorandumFormData => ({
    client_name: clientName.trim(),
    client_id_number: clientIdNumber.trim(),
    client_phone: clientPhone.trim(),
    client_email: clientEmail.trim(),
    property_address: propertyAddress.trim(),
    property_city: propertyCity.trim(),
    property_floor: propertyFloor.trim(),
    property_rooms: propertyRooms.trim(),
    property_size: propertySize.trim(),
    sale_price: salePrice.trim(),
    deposit_amount: depositAmount.trim(),
    payment_method: paymentMethod.trim(),
    payment_terms: paymentTerms.trim(),
    transfer_date: transferDate,
    form_date: formDate,
    notes: notes.trim(),
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
        form_type: 'sale_memorandum',
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
        rental_price: formData.sale_price, // Using rental_price field for sale price
        deposit_amount: formData.deposit_amount,
        payment_method: formData.payment_method,
        form_data: { 
          notes: formData.notes,
          payment_terms: formData.payment_terms,
          transfer_date: formData.transfer_date,
        },
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
      const { data, error } = await supabase
        .from('legal_form_tokens')
        .insert({
          form_type: 'sale_memorandum',
          language,
          form_data: {
            property_address: propertyAddress,
            property_city: propertyCity,
            property_floor: propertyFloor,
            property_rooms: propertyRooms,
            property_size: propertySize,
            sale_price: salePrice,
            deposit_amount: depositAmount,
            payment_method: paymentMethod,
            payment_terms: paymentTerms,
            transfer_date: transferDate,
            notes: notes,
            agent_signature: agentSignature,
          },
        })
        .select('token')
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/sale-memorandum-form?token=${data.token}`;
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
        onDownloadPDF={() => downloadSaleMemorandumPDF(savedFormData)}
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
    <div className={`min-h-screen bg-gradient-to-b from-green-50 to-white p-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <Card>
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-between mb-2">
              <Select value={language} onValueChange={(v) => setLanguage(v as SaleMemorandumLanguage)}>
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
            <CardTitle className="text-2xl text-green-700 flex items-center justify-center gap-2">
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

        {/* Buyer Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t.buyerDetails}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t.buyerName} *</Label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder={t.buyerNamePlaceholder} />
              </div>
              <div>
                <Label>{t.buyerId} *</Label>
                <Input value={clientIdNumber} onChange={(e) => setClientIdNumber(e.target.value)} placeholder={t.buyerIdPlaceholder} dir="ltr" />
              </div>
              <div>
                <Label>{t.buyerPhone} *</Label>
                <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder={t.buyerPhonePlaceholder} dir="ltr" />
              </div>
              <div>
                <Label>{t.buyerEmail}</Label>
                <Input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder={t.buyerEmailPlaceholder} dir="ltr" />
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
                <Label>{t.salePrice} *</Label>
                <Input value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder={t.salePricePlaceholder} disabled={isRemoteSigning} />
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
                <Label>{t.transferDate}</Label>
                <Input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} disabled={isRemoteSigning} />
              </div>
            </div>
            <div>
              <Label>{t.paymentTerms}</Label>
              <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder={t.paymentTermsPlaceholder} disabled={isRemoteSigning} />
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
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.notesPlaceholder}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Signatures */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{isRTL ? 'חתימות' : 'Signatures'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Agent Signature */}
              {!isRemoteSigning && (
                <FormSignatureBox
                  label={t.agentSignature}
                  signatureData={agentSignature}
                  onSignatureChange={setAgentSignature}
                  onClear={() => setAgentSignature('')}
                  clearText={t.clearSignature}
                  signedText={t.signed}
                />
              )}
              
              {/* Buyer Signature */}
              <FormSignatureBox
                label={t.buyerSignature}
                signatureData={clientSignature}
                onSignatureChange={setClientSignature}
                onClear={() => setClientSignature('')}
                clearText={t.clearSignature}
                signedText={t.signed}
              />
            </div>
          </CardContent>
        </Card>

        {/* Confirmation */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="confirm"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked === true)}
              />
              <Label htmlFor="confirm" className="text-sm leading-relaxed cursor-pointer">
                {t.confirmationText}
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pb-8">
          <Button
            onClick={handleSaveForm}
            disabled={isSaving}
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {isRTL ? 'שומר...' : 'Saving...'}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {t.saveForm}
              </>
            )}
          </Button>

          {!isRemoteSigning && (
            <Button
              onClick={handleCreateLink}
              disabled={isSaving}
              variant="outline"
              size="lg"
              className="w-full"
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

export default SaleMemorandumFormPage;
