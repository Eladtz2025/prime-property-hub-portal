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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Loader2, Copy, Send, Award, User, Phone, CreditCard, Globe, 
  Home, Calendar, AlertTriangle, FileText, Shield, CheckCircle2,
  Building, Droplets, Hammer, Zap, Scale, Volume2, MoreHorizontal,
  Camera, Video, Users, Newspaper, MapPin, Share2
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { exclusiveListingTranslations, ExclusiveListingLanguage } from '@/lib/exclusive-listing-translations';

type PageMode = 'new' | 'remote-sign' | 'generated-link';

interface DefectsQuestionnaire {
  moisture: boolean;
  buildingViolations: boolean;
  infrastructure: boolean;
  dangerousBuilding: boolean;
  legalClaims: boolean;
  nuisance: boolean;
  other: boolean;
  none: boolean;
}

interface MarketingActivities {
  signage: boolean;
  internet: boolean;
  socialMedia: boolean;
  press: boolean;
  brokerNetwork: boolean;
  photography: boolean;
  virtualTour: boolean;
}

const ExclusiveListingPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const ownerSignatureRef = useRef<SignatureCanvas>(null);
  const brokerSignatureRef = useRef<SignatureCanvas>(null);
  const { user, profile } = useAuth();
  
  const [mode, setMode] = useState<PageMode>('new');
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [hasOwnerSignature, setHasOwnerSignature] = useState(false);
  const [hasBrokerSignature, setHasBrokerSignature] = useState(false);
  const [language, setLanguage] = useState<ExclusiveListingLanguage>('he');
  
  const t = exclusiveListingTranslations[language];
  
  // Broker details from token (for remote-sign mode)
  const [brokerDetails, setBrokerDetails] = useState<{
    full_name?: string;
    broker_license_number?: string;
    phone?: string;
    id_number?: string;
  } | null>(null);
  const [brokerSignatureData, setBrokerSignatureData] = useState<string>('');
  
  // Form state
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Owner details
  const [ownerName, setOwnerName] = useState('');
  const [ownerIdNumber, setOwnerIdNumber] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  
  // Property details
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyGushHelka, setPropertyGushHelka] = useState('');
  const [propertySizeSqm, setPropertySizeSqm] = useState('');
  const [propertyRooms, setPropertyRooms] = useState('');
  const [propertyFloor, setPropertyFloor] = useState('');
  const [propertyParking, setPropertyParking] = useState(false);
  const [propertyStorage, setPropertyStorage] = useState(false);
  const [propertyBalcony, setPropertyBalcony] = useState(false);
  const [propertyElevator, setPropertyElevator] = useState(false);
  
  // Transaction type
  const [transactionType, setTransactionType] = useState<'sale' | 'rent' | ''>('');
  const [askingPrice, setAskingPrice] = useState('');
  
  // Exclusivity period
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [exclusivityMonths, setExclusivityMonths] = useState<string>('');
  const [endDate, setEndDate] = useState('');
  
  // Defects
  const [defects, setDefects] = useState<DefectsQuestionnaire>({
    moisture: false,
    buildingViolations: false,
    infrastructure: false,
    dangerousBuilding: false,
    legalClaims: false,
    nuisance: false,
    other: false,
    none: false,
  });
  const [defectsDetails, setDefectsDetails] = useState('');
  
  // Marketing
  const [marketing, setMarketing] = useState<MarketingActivities>({
    signage: false,
    internet: false,
    socialMedia: false,
    press: false,
    brokerNetwork: false,
    photography: false,
    virtualTour: false,
  });
  const [marketingOther, setMarketingOther] = useState('');
  
  // Commission
  const [commissionPercentage, setCommissionPercentage] = useState('');
  const [commissionIncludesVat, setCommissionIncludesVat] = useState(false);
  
  // Confirmations
  const [confirmUnderstanding, setConfirmUnderstanding] = useState(false);
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [confirmDefects, setConfirmDefects] = useState(false);

  const isBrokerDetailsComplete = profile?.full_name && profile?.broker_license_number && profile?.id_number;

  // Calculate end date when start date or months change
  useEffect(() => {
    if (startDate && exclusivityMonths) {
      const start = new Date(startDate);
      start.setMonth(start.getMonth() + parseInt(exclusivityMonths));
      setEndDate(start.toISOString().split('T')[0]);
    } else {
      setEndDate('');
    }
  }, [startDate, exclusivityMonths]);

  useEffect(() => {
    if (token) {
      setMode('remote-sign');
      loadRemoteFormData(token);
    } else {
      setMode('new');
    }
  }, [token]);

  const loadRemoteFormData = async (tokenValue: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exclusive_listing_forms')
        .select('*')
        .eq('token', tokenValue)
        .eq('status', 'pending')
        .single();

      if (error || !data) {
        toast.error(t.errorInvalidLink);
        navigate('/');
        return;
      }

      // Set language
      if (data.language) {
        setLanguage(data.language as ExclusiveListingLanguage);
      }

      // Set broker details
      setBrokerDetails({
        full_name: data.agent_name || '',
        broker_license_number: data.agent_license || '',
        phone: data.agent_phone || '',
        id_number: data.agent_id_number || '',
      });
      setBrokerSignatureData(data.agent_signature || '');

      // Set property details
      setPropertyAddress(data.property_address || '');
      setPropertyGushHelka(data.property_gush_helka || '');
      setPropertySizeSqm(data.property_size_sqm || '');
      setPropertyRooms(data.property_rooms || '');
      setPropertyFloor(data.property_floor || '');
      setPropertyParking(data.property_parking || false);
      setPropertyStorage(data.property_storage || false);
      setPropertyBalcony(data.property_balcony || false);
      setPropertyElevator(data.property_elevator || false);

      // Set transaction
      setTransactionType((data.transaction_type as 'sale' | 'rent') || '');
      setAskingPrice(data.asking_price || '');

      // Set period
      setStartDate(data.start_date || new Date().toISOString().split('T')[0]);
      setExclusivityMonths(data.exclusivity_months?.toString() || '');

      // Set marketing
      const marketingData = data.marketing_activities as unknown as MarketingActivities | null;
      setMarketing({
        signage: marketingData?.signage ?? false,
        internet: marketingData?.internet ?? false,
        socialMedia: marketingData?.socialMedia ?? false,
        press: marketingData?.press ?? false,
        brokerNetwork: marketingData?.brokerNetwork ?? false,
        photography: marketingData?.photography ?? false,
        virtualTour: marketingData?.virtualTour ?? false,
      });
      setMarketingOther(data.marketing_other || '');

      // Set commission
      setCommissionPercentage(data.commission_percentage || '');
      setCommissionIncludesVat(data.commission_includes_vat || false);

    } catch (err) {
      console.error('Error loading form data:', err);
      toast.error(t.errorLoadingForm);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleDefectChange = (key: keyof DefectsQuestionnaire, value: boolean) => {
    if (key === 'none' && value) {
      setDefects({
        moisture: false,
        buildingViolations: false,
        infrastructure: false,
        dangerousBuilding: false,
        legalClaims: false,
        nuisance: false,
        other: false,
        none: true,
      });
    } else {
      setDefects(prev => ({ ...prev, [key]: value, none: false }));
    }
  };

  const handleMarketingChange = (key: keyof MarketingActivities, value: boolean) => {
    setMarketing(prev => ({ ...prev, [key]: value }));
  };

  const clearOwnerSignature = () => {
    ownerSignatureRef.current?.clear();
    setHasOwnerSignature(false);
  };

  const clearBrokerSignature = () => {
    brokerSignatureRef.current?.clear();
    setHasBrokerSignature(false);
  };

  const validateBrokerForm = () => {
    if (!formDate) {
      toast.error(t.errorFillDate);
      return false;
    }
    if (mode === 'new' && !isBrokerDetailsComplete) {
      toast.error(t.errorCompleteBrokerDetails);
      return false;
    }
    if (!transactionType) {
      toast.error(t.errorSelectTransactionType);
      return false;
    }
    if (!propertyAddress) {
      toast.error(t.errorFillPropertyAddress);
      return false;
    }
    if (!exclusivityMonths) {
      toast.error(t.errorSelectExclusivityPeriod);
      return false;
    }
    const hasMarketing = Object.values(marketing).some(v => v);
    if (!hasMarketing) {
      toast.error(t.errorSelectMarketingActivities);
      return false;
    }
    if (mode === 'new' && (!brokerSignatureRef.current || brokerSignatureRef.current.isEmpty())) {
      toast.error(t.errorAgentSignature);
      return false;
    }
    return true;
  };

  const validateOwnerForm = () => {
    if (!ownerName || !ownerIdNumber || !ownerAddress || !ownerPhone) {
      toast.error(t.errorOwnerDetails);
      return false;
    }
    if (!confirmUnderstanding || !confirmAccuracy || !confirmDefects) {
      toast.error(t.errorOwnerConfirmation);
      return false;
    }
    if (!ownerSignatureRef.current || ownerSignatureRef.current.isEmpty()) {
      toast.error(t.errorOwnerSignature);
      return false;
    }
    return true;
  };

  const handleCreateLink = async () => {
    if (!validateBrokerForm()) return;

    setLoading(true);
    try {
      const brokerSignature = brokerSignatureRef.current?.toDataURL() || '';

      const { data, error } = await supabase
        .from('exclusive_listing_forms')
        .insert([{
          created_by: user?.id,
          language,
          agent_name: profile?.full_name,
          agent_license: profile?.broker_license_number,
          agent_phone: profile?.phone,
          agent_id_number: profile?.id_number,
          agent_signature: brokerSignature,
          property_address: propertyAddress,
          property_gush_helka: propertyGushHelka,
          property_size_sqm: propertySizeSqm,
          property_rooms: propertyRooms,
          property_floor: propertyFloor,
          property_parking: propertyParking,
          property_storage: propertyStorage,
          property_balcony: propertyBalcony,
          property_elevator: propertyElevator,
          transaction_type: transactionType,
          asking_price: askingPrice,
          start_date: startDate,
          end_date: endDate,
          exclusivity_months: parseInt(exclusivityMonths),
          marketing_activities: marketing as unknown as Record<string, boolean>,
          marketing_other: marketingOther,
          commission_percentage: commissionPercentage,
          commission_includes_vat: commissionIncludesVat,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/exclusive-listing/${data.token}`;
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
    if (!validateOwnerForm()) return;

    setLoading(true);
    try {
      const ownerSignature = ownerSignatureRef.current?.toDataURL() || '';

      const { error } = await supabase
        .from('exclusive_listing_forms')
        .update({
          owner_name: ownerName,
          owner_id_number: ownerIdNumber,
          owner_address: ownerAddress,
          owner_phone: ownerPhone,
          owner_email: ownerEmail,
          owner_signature: ownerSignature,
          owner_signed_at: new Date().toISOString(),
          defects_questionnaire: defects as unknown as Record<string, boolean>,
          defects_details: defectsDetails,
          confirm_understanding: confirmUnderstanding,
          confirm_accuracy: confirmAccuracy,
          confirm_defects: confirmDefects,
          status: 'signed',
          updated_at: new Date().toISOString()
        })
        .eq('token', token);

      if (error) throw error;

      // Send notification to agent
      if (token) {
        try {
          const { data: formRecord } = await supabase
            .from('exclusive_listing_forms')
            .select('created_by')
            .eq('token', token)
            .single();
          
          if (formRecord?.created_by) {
            await supabase.functions.invoke('notify-form-signed', {
              body: {
                formType: 'exclusivity',
                clientName: ownerName,
                clientPhone: ownerPhone,
                agentId: formRecord.created_by,
                propertyAddress
              }
            });
          }
        } catch (notifyError) {
          console.error('Error sending notification:', notifyError);
        }
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
                {t.sendLinkToOwner}
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

  const isRemoteSign = mode === 'remote-sign';
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
                <CardDescription>{t.fillDetails}</CardDescription>
              </div>
              {mode === 'new' && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <RadioGroup
                    value={language}
                    onValueChange={(value) => setLanguage(value as ExclusiveListingLanguage)}
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

          <CardContent className="space-y-8">
            {/* Warning if broker details incomplete */}
            {mode === 'new' && !isBrokerDetailsComplete && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">{t.brokerDetailsIncomplete}</p>
                  <p className="text-sm text-yellow-700 mt-1">{t.brokerDetailsWarning}</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('/admin-dashboard/settings')}>
                    {t.goToSettings}
                  </Button>
                </div>
              </div>
            )}

            {/* Broker Details */}
            <div className="bg-muted/50 p-4 rounded-lg border">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Award className="h-4 w-4" />
                {t.brokerDetails}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t.name}:</span>
                  <span className="font-medium">{currentBrokerDetails?.full_name || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t.license}:</span>
                  <span className="font-medium">{currentBrokerDetails?.broker_license_number || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t.phone}:</span>
                  <span className="font-medium" dir="ltr">{currentBrokerDetails?.phone || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t.idNumber}:</span>
                  <span className="font-medium">{currentBrokerDetails?.id_number || '—'}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Property Details */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Home className="h-4 w-4" />
                {t.propertyDetails}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>{t.propertyAddress} *</Label>
                  <Input
                    value={propertyAddress}
                    onChange={(e) => setPropertyAddress(e.target.value)}
                    disabled={isRemoteSign}
                    placeholder={language === 'he' ? 'רחוב, מספר, עיר' : 'Street, Number, City'}
                  />
                </div>
                <div>
                  <Label>{t.propertyGushHelka} <span className="text-xs text-muted-foreground">({t.propertyGushHelkaHint})</span></Label>
                  <Input
                    value={propertyGushHelka}
                    onChange={(e) => setPropertyGushHelka(e.target.value)}
                    disabled={isRemoteSign}
                  />
                </div>
                <div>
                  <Label>{t.propertySizeSqm}</Label>
                  <Input
                    type="number"
                    value={propertySizeSqm}
                    onChange={(e) => setPropertySizeSqm(e.target.value)}
                    disabled={isRemoteSign}
                  />
                </div>
                <div>
                  <Label>{t.propertyRooms}</Label>
                  <Input
                    value={propertyRooms}
                    onChange={(e) => setPropertyRooms(e.target.value)}
                    disabled={isRemoteSign}
                  />
                </div>
                <div>
                  <Label>{t.propertyFloor}</Label>
                  <Input
                    value={propertyFloor}
                    onChange={(e) => setPropertyFloor(e.target.value)}
                    disabled={isRemoteSign}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                {[
                  { key: 'propertyParking', value: propertyParking, setter: setPropertyParking, label: t.propertyParking },
                  { key: 'propertyStorage', value: propertyStorage, setter: setPropertyStorage, label: t.propertyStorage },
                  { key: 'propertyBalcony', value: propertyBalcony, setter: setPropertyBalcony, label: t.propertyBalcony },
                  { key: 'propertyElevator', value: propertyElevator, setter: setPropertyElevator, label: t.propertyElevator },
                ].map(item => (
                  <div key={item.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={item.key}
                      checked={item.value}
                      onCheckedChange={(v) => item.setter(v as boolean)}
                      disabled={isRemoteSign}
                    />
                    <Label htmlFor={item.key} className="cursor-pointer">{item.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Transaction Type */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t.transactionType}
              </h3>
              <RadioGroup
                value={transactionType}
                onValueChange={(v) => setTransactionType(v as 'sale' | 'rent')}
                className="flex gap-6"
                disabled={isRemoteSign}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sale" id="sale" />
                  <Label htmlFor="sale" className="cursor-pointer">{t.sale}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rent" id="rent" />
                  <Label htmlFor="rent" className="cursor-pointer">{t.rent}</Label>
                </div>
              </RadioGroup>
              {transactionType && (
                <div className="mt-4 max-w-xs">
                  <Label>{transactionType === 'sale' ? t.askingPriceSale : t.askingPriceRent}</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={askingPrice}
                      onChange={(e) => setAskingPrice(e.target.value)}
                      disabled={isRemoteSign}
                      className={language === 'he' ? 'pl-8' : 'pr-8'}
                    />
                    <span className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground ${language === 'he' ? 'left-3' : 'right-3'}`}>
                      {t.currency}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Exclusivity Period */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t.exclusivityPeriod}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">{t.periodLegalNote}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>{t.startDate}</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={isRemoteSign}
                  />
                </div>
                <div>
                  <Label>{t.periodLength}</Label>
                  <Select value={exclusivityMonths} onValueChange={setExclusivityMonths} disabled={isRemoteSign}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'he' ? 'בחר תקופה' : 'Select period'} />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map(m => (
                        <SelectItem key={m} value={m.toString()}>
                          {m} {m === 1 ? t.month : t.months}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t.endDate}</Label>
                  <Input type="date" value={endDate} disabled className="bg-muted" />
                </div>
              </div>
              {!exclusivityMonths && (
                <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {t.periodWarning}
                </p>
              )}
            </div>

            <Separator />

            {/* Marketing Activities - Only for broker in new mode */}
            {mode === 'new' && (
              <>
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    {t.marketingActivities}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">{t.marketingActivitiesDesc}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { key: 'signage', icon: MapPin, label: t.marketingSignage, desc: t.marketingSignageDesc },
                      { key: 'internet', icon: Globe, label: t.marketingInternet, desc: t.marketingInternetDesc },
                      { key: 'socialMedia', icon: Share2, label: t.marketingSocialMedia, desc: t.marketingSocialMediaDesc },
                      { key: 'press', icon: Newspaper, label: t.marketingPress, desc: t.marketingPressDesc },
                      { key: 'brokerNetwork', icon: Users, label: t.marketingBrokerNetwork, desc: t.marketingBrokerNetworkDesc },
                      { key: 'photography', icon: Camera, label: t.marketingPhotography, desc: t.marketingPhotographyDesc },
                      { key: 'virtualTour', icon: Video, label: t.marketingVirtualTour, desc: t.marketingVirtualTourDesc },
                    ].map(item => (
                      <div key={item.key} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                        <Checkbox
                          id={`marketing-${item.key}`}
                          checked={marketing[item.key as keyof MarketingActivities]}
                          onCheckedChange={(v) => handleMarketingChange(item.key as keyof MarketingActivities, v as boolean)}
                        />
                        <div className="flex-1">
                          <Label htmlFor={`marketing-${item.key}`} className="cursor-pointer flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Label>{t.marketingOther}</Label>
                    <Textarea
                      value={marketingOther}
                      onChange={(e) => setMarketingOther(e.target.value)}
                      placeholder={t.marketingOtherPlaceholder}
                      rows={2}
                    />
                  </div>
                  <p className="text-sm text-amber-600 mt-2">{t.marketingLegalNote}</p>
                </div>

                <Separator />

                {/* Commission */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    {t.commission}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {transactionType === 'rent' ? t.commissionRentalNote : t.commissionSaleNote}
                  </p>
                  <div className="flex items-end gap-4">
                    <div className="flex-1 max-w-xs">
                      <Label>{t.commissionPercentage}</Label>
                      <div className="relative">
                        <Input
                          value={commissionPercentage}
                          onChange={(e) => setCommissionPercentage(e.target.value)}
                          placeholder={transactionType === 'rent' ? '100' : '2'}
                        />
                        <span className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground ${language === 'he' ? 'left-3' : 'right-3'}`}>
                          %
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 pb-2">
                      <Checkbox
                        id="vat"
                        checked={commissionIncludesVat}
                        onCheckedChange={(v) => setCommissionIncludesVat(v as boolean)}
                      />
                      <Label htmlFor="vat" className="cursor-pointer">
                        {commissionIncludesVat ? t.commissionIncludesVat : t.commissionExcludesVat}
                      </Label>
                    </div>
                  </div>
                </div>

                <Separator />
              </>
            )}

            {/* Defects Disclosure - For owner in remote-sign mode */}
            {isRemoteSign && (
              <>
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {t.defectsDisclosure}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">{t.defectsDisclosureDesc}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { key: 'moisture', icon: Droplets, label: t.defectMoisture, desc: t.defectMoistureDesc },
                      { key: 'buildingViolations', icon: Hammer, label: t.defectBuildingViolations, desc: t.defectBuildingViolationsDesc },
                      { key: 'infrastructure', icon: Zap, label: t.defectInfrastructure, desc: t.defectInfrastructureDesc },
                      { key: 'dangerousBuilding', icon: Building, label: t.defectDangerousBuilding, desc: t.defectDangerousBuildingDesc },
                      { key: 'legalClaims', icon: Scale, label: t.defectLegalClaims, desc: t.defectLegalClaimsDesc },
                      { key: 'nuisance', icon: Volume2, label: t.defectNuisance, desc: t.defectNuisanceDesc },
                      { key: 'other', icon: MoreHorizontal, label: t.defectOther, desc: t.defectOtherDesc },
                    ].map(item => (
                      <div key={item.key} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                        <Checkbox
                          id={`defect-${item.key}`}
                          checked={defects[item.key as keyof DefectsQuestionnaire]}
                          onCheckedChange={(v) => handleDefectChange(item.key as keyof DefectsQuestionnaire, v as boolean)}
                        />
                        <div className="flex-1">
                          <Label htmlFor={`defect-${item.key}`} className="cursor-pointer flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                    <div className="md:col-span-2 flex items-start space-x-3 p-3 border-2 border-green-200 bg-green-50 rounded-lg">
                      <Checkbox
                        id="defect-none"
                        checked={defects.none}
                        onCheckedChange={(v) => handleDefectChange('none', v as boolean)}
                      />
                      <div className="flex-1">
                        <Label htmlFor="defect-none" className="cursor-pointer flex items-center gap-2 text-green-800">
                          <CheckCircle2 className="h-4 w-4" />
                          {t.defectNone}
                        </Label>
                        <p className="text-xs text-green-700 mt-1">{t.defectNoneDesc}</p>
                      </div>
                    </div>
                  </div>
                  {(defects.moisture || defects.buildingViolations || defects.infrastructure || 
                    defects.dangerousBuilding || defects.legalClaims || defects.nuisance || defects.other) && (
                    <div className="mt-4">
                      <Label>{t.defectDetails}</Label>
                      <Textarea
                        value={defectsDetails}
                        onChange={(e) => setDefectsDetails(e.target.value)}
                        placeholder={t.defectDetailsPlaceholder}
                        rows={3}
                      />
                    </div>
                  )}
                </div>

                <Separator />

                {/* Owner Details */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t.ownerDetails}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>{t.ownerName} *</Label>
                      <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
                    </div>
                    <div>
                      <Label>{t.ownerIdNumber} *</Label>
                      <Input value={ownerIdNumber} onChange={(e) => setOwnerIdNumber(e.target.value)} />
                    </div>
                    <div className="md:col-span-2">
                      <Label>{t.ownerAddress} *</Label>
                      <Input value={ownerAddress} onChange={(e) => setOwnerAddress(e.target.value)} />
                    </div>
                    <div>
                      <Label>{t.ownerPhone} *</Label>
                      <Input value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} dir="ltr" />
                    </div>
                    <div>
                      <Label>{t.ownerEmail} <span className="text-xs text-muted-foreground">({t.ownerEmailOptional})</span></Label>
                      <Input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} dir="ltr" />
                    </div>
                  </div>
                </div>

                <Separator />
              </>
            )}

            {/* Legal Terms */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Scale className="h-4 w-4" />
                {t.legalTerms}
              </h3>
              <div className="space-y-4">
                {[
                  { title: t.term1Title, text: t.term1Text },
                  { title: t.term2Title, text: t.term2Text },
                  { title: t.term3Title, text: t.term3Text },
                  { title: t.term4Title, text: t.term4Text },
                  { title: t.term5Title, text: t.term5Text },
                  { title: t.term6Title, text: t.term6Text },
                ].map((term, i) => (
                  <div key={i} className="bg-muted/30 p-3 rounded-lg">
                    <h4 className="font-medium text-sm">{i + 1}. {term.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{term.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirmations - For owner */}
            {isRemoteSign && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    {t.confirmations}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id="confirm-understanding"
                        checked={confirmUnderstanding}
                        onCheckedChange={(v) => setConfirmUnderstanding(v as boolean)}
                      />
                      <div>
                        <Label htmlFor="confirm-understanding" className="cursor-pointer font-medium">
                          {t.confirmUnderstanding}
                        </Label>
                        <p className="text-sm text-muted-foreground">{t.confirmUnderstandingText}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id="confirm-accuracy"
                        checked={confirmAccuracy}
                        onCheckedChange={(v) => setConfirmAccuracy(v as boolean)}
                      />
                      <div>
                        <Label htmlFor="confirm-accuracy" className="cursor-pointer font-medium">
                          {t.confirmAccuracy}
                        </Label>
                        <p className="text-sm text-muted-foreground">{t.confirmAccuracyText}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id="confirm-defects"
                        checked={confirmDefects}
                        onCheckedChange={(v) => setConfirmDefects(v as boolean)}
                      />
                      <div>
                        <Label htmlFor="confirm-defects" className="cursor-pointer font-medium">
                          {t.confirmDefects}
                        </Label>
                        <p className="text-sm text-muted-foreground">{t.confirmDefectsText}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Signatures */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t.signatures}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Broker Signature */}
                <div>
                  <Label className="mb-2 block">{t.brokerSignature}</Label>
                  {isRemoteSign && brokerSignatureData ? (
                    <div className="border rounded-lg p-2 bg-muted/50">
                      <img src={brokerSignatureData} alt="Broker signature" className="h-24 mx-auto" />
                    </div>
                  ) : mode === 'new' ? (
                    <div className="border rounded-lg overflow-hidden">
                      <SignatureCanvas
                        ref={brokerSignatureRef}
                        canvasProps={{
                          className: 'w-full h-32 bg-white',
                        }}
                        onEnd={() => setHasBrokerSignature(!brokerSignatureRef.current?.isEmpty())}
                      />
                      <div className="flex justify-end p-2 bg-muted/50">
                        <Button variant="ghost" size="sm" onClick={clearBrokerSignature}>
                          {t.clearSignature}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  <p className="text-xs text-muted-foreground mt-1">{t.date}: {formDate}</p>
                </div>

                {/* Owner Signature */}
                <div>
                  <Label className="mb-2 block">{t.ownerSignature}</Label>
                  {isRemoteSign ? (
                    <div className="border rounded-lg overflow-hidden">
                      <SignatureCanvas
                        ref={ownerSignatureRef}
                        canvasProps={{
                          className: 'w-full h-32 bg-white',
                        }}
                        onEnd={() => setHasOwnerSignature(!ownerSignatureRef.current?.isEmpty())}
                      />
                      <div className="flex justify-end p-2 bg-muted/50">
                        <Button variant="ghost" size="sm" onClick={clearOwnerSignature}>
                          {t.clearSignature}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-8 bg-muted/30 flex items-center justify-center text-muted-foreground text-sm">
                      {language === 'he' ? 'יחתם ע"י בעל הנכס' : 'To be signed by owner'}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{t.date}: {new Date().toISOString().split('T')[0]}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {mode === 'new' ? (
                <Button onClick={handleCreateLink} disabled={loading} className="flex-1">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className={`h-4 w-4 ${language === 'he' ? 'ml-2' : 'mr-2'}`} />}
                  {t.createLink}
                </Button>
              ) : (
                <Button onClick={handleSaveForm} disabled={loading} className="flex-1">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className={`h-4 w-4 ${language === 'he' ? 'ml-2' : 'mr-2'}`} />}
                  {t.saveForm}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExclusiveListingPage;
