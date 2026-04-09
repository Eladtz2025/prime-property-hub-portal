import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import cityMarketLogo from "@/assets/city-market-icon.png";
import { 
  Check, 
  Loader2, 
  FileText, 
  Link2, 
  MessageCircle, 
  Download,
  CheckCircle2,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { 
  usePresentationExclusivityTranslation, 
  PresentationExclusivityLanguage 
} from "@/lib/presentation-exclusivity-translations";
import { 
  downloadPresentationExclusivityPDF,
  PresentationExclusivityFormData 
} from "@/lib/presentation-exclusivity-pdf-generator";
import { logger } from '@/utils/logger';

// Default property data for Ben Yehuda 110
const defaultPropertyData = {
  address: "Ben Yehuda 110",
  city: "Tel Aviv-Yafo",
  floor: "6",
  rooms: "3",
  size: "85",
  askingPrice: "3,200,000",
  gushHelka: "",
};

const PresentationExclusivityForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [language, setLanguage] = useState<PresentationExclusivityLanguage>('en');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  
  // Property data (pre-filled)
  const [propertyAddress, setPropertyAddress] = useState(defaultPropertyData.address);
  const [propertyCity, setPropertyCity] = useState(defaultPropertyData.city);
  const [propertyFloor, setPropertyFloor] = useState(defaultPropertyData.floor);
  const [propertyRooms, setPropertyRooms] = useState(defaultPropertyData.rooms);
  const [propertySize, setPropertySize] = useState(defaultPropertyData.size);
  const [askingPrice, setAskingPrice] = useState(defaultPropertyData.askingPrice);
  const [gushHelka, setGushHelka] = useState(defaultPropertyData.gushHelka);
  
  // Owner data
  const [ownerName, setOwnerName] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  
  // Terms
  const [exclusivityDays, setExclusivityDays] = useState(90);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [commissionPercentage, setCommissionPercentage] = useState("2");
  const [includesVat, setIncludesVat] = useState(true);
  const [confirmTerms, setConfirmTerms] = useState(false);
  
  // Signatures
  const ownerSignatureRef = useRef<SignatureCanvas>(null);
  const agentSignatureRef = useRef<SignatureCanvas>(null);
  const [ownerSignatureData, setOwnerSignatureData] = useState<string>("");
  const [agentSignatureData, setAgentSignatureData] = useState<string>("");
  
  const t = usePresentationExclusivityTranslation(language);
  const isRTL = language === 'he';
  const softShadow = '0 4px 20px rgba(0,0,0,0.7), 0 8px 40px rgba(0,0,0,0.5)';
  
  // Calculate end date
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + exclusivityDays);
  const endDateStr = endDate.toISOString().split('T')[0];
  
  // Load data if token exists
  useEffect(() => {
    if (token) {
      loadTokenData();
    }
  }, [token]);
  
  const loadTokenData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('exclusive_listing_forms')
        .select('*')
        .eq('token', token)
        .single();
      
      if (error) throw error;
      if (data) {
        setLanguage((data.language as PresentationExclusivityLanguage) || 'en');
        setPropertyAddress(data.property_address || defaultPropertyData.address);
        const formDataObj = data.form_data as Record<string, unknown> | null;
        setPropertyCity((formDataObj?.propertyCity as string) || defaultPropertyData.city);
        setPropertyFloor(data.property_floor || defaultPropertyData.floor);
        setPropertyRooms(data.property_rooms || defaultPropertyData.rooms);
        setPropertySize(data.property_size_sqm || defaultPropertyData.size);
        setAskingPrice(data.asking_price || defaultPropertyData.askingPrice);
        setGushHelka(data.property_gush_helka || "");
        setExclusivityDays(data.exclusivity_months ? data.exclusivity_months * 30 : 90);
        setStartDate(data.start_date || new Date().toISOString().split('T')[0]);
        setCommissionPercentage(data.commission_percentage || "2");
        setIncludesVat(data.commission_includes_vat ?? true);
        setAgentSignatureData(data.agent_signature || "");
      }
    } catch (error) {
      logger.error('Error loading form data:', error);
      toast.error('Failed to load form data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getFormData = (): PresentationExclusivityFormData => ({
    language,
    propertyAddress,
    propertyCity,
    propertyFloor,
    propertyRooms,
    propertySize,
    askingPrice,
    gushHelka,
    ownerName,
    ownerId,
    ownerAddress,
    ownerPhone,
    ownerEmail,
    exclusivityDays,
    startDate,
    endDate: endDateStr,
    commissionPercentage,
    includesVat,
    ownerSignature: ownerSignatureData,
    agentSignature: agentSignatureData,
    signedAt: new Date().toLocaleDateString(isRTL ? 'he-IL' : 'en-US'),
  });
  
  const validateForm = (): boolean => {
    if (!ownerName.trim()) {
      toast.error(t.errorRequired);
      return false;
    }
    if (!ownerId.trim()) {
      toast.error(t.errorRequired);
      return false;
    }
    if (!ownerPhone.trim()) {
      toast.error(t.errorRequired);
      return false;
    }
    if (!ownerAddress.trim()) {
      toast.error(t.errorRequired);
      return false;
    }
    if (!ownerSignatureData && ownerSignatureRef.current?.isEmpty()) {
      toast.error(t.errorSignature);
      return false;
    }
    if (!confirmTerms) {
      toast.error(t.errorConfirmation);
      return false;
    }
    return true;
  };
  
  const handleOwnerSignatureEnd = () => {
    if (ownerSignatureRef.current) {
      setOwnerSignatureData(ownerSignatureRef.current.toDataURL());
    }
  };
  
  const handleAgentSignatureEnd = () => {
    if (agentSignatureRef.current) {
      setAgentSignatureData(agentSignatureRef.current.toDataURL());
    }
  };
  
  const clearOwnerSignature = () => {
    ownerSignatureRef.current?.clear();
    setOwnerSignatureData("");
  };
  
  const clearAgentSignature = () => {
    agentSignatureRef.current?.clear();
    setAgentSignatureData("");
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      const formData = getFormData();
      
      const dbData = {
        language,
        property_address: propertyAddress,
        property_floor: propertyFloor,
        property_rooms: propertyRooms,
        property_size_sqm: propertySize,
        asking_price: askingPrice,
        property_gush_helka: gushHelka,
        owner_name: ownerName,
        owner_id_number: ownerId,
        owner_address: ownerAddress,
        owner_phone: ownerPhone,
        owner_email: ownerEmail,
        exclusivity_months: Math.ceil(exclusivityDays / 30),
        start_date: startDate,
        end_date: endDateStr,
        commission_percentage: commissionPercentage,
        commission_includes_vat: includesVat,
        owner_signature: ownerSignatureData,
        agent_signature: agentSignatureData,
        owner_signed_at: new Date().toISOString(),
        status: 'signed',
        form_data: { propertyCity, marketingMessages: t.marketingMessages },
        transaction_type: 'sale',
      };
      
      if (token) {
        // Update existing
        const { error } = await supabase
          .from('exclusive_listing_forms')
          .update(dbData)
          .eq('token', token);
        
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('exclusive_listing_forms')
          .insert(dbData);
        
        if (error) throw error;
      }
      
      toast.success(t.formSaved);
      setShowThankYou(true);
    } catch (error) {
      logger.error('Error saving form:', error);
      toast.error('Failed to save form');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCreateLink = async () => {
    setIsSaving(true);
    try {
      const newToken = crypto.randomUUID();
      
      const dbData = {
        token: newToken,
        language,
        property_address: propertyAddress,
        property_floor: propertyFloor,
        property_rooms: propertyRooms,
        property_size_sqm: propertySize,
        asking_price: askingPrice,
        property_gush_helka: gushHelka,
        exclusivity_months: Math.ceil(exclusivityDays / 30),
        start_date: startDate,
        end_date: endDateStr,
        commission_percentage: commissionPercentage,
        commission_includes_vat: includesVat,
        agent_signature: agentSignatureData,
        status: 'pending',
        form_data: { propertyCity, marketingMessages: t.marketingMessages },
        transaction_type: 'sale',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      
      const { error } = await supabase
        .from('exclusive_listing_forms')
        .insert(dbData);
      
      if (error) throw error;
      
      const link = `${window.location.origin}/offer/ben-yehuda-110/exclusivity?token=${newToken}`;
      setGeneratedLink(link);
      await navigator.clipboard.writeText(link);
      toast.success(t.linkCreated);
    } catch (error) {
      logger.error('Error creating link:', error);
      toast.error('Failed to create link');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDownloadPDF = async () => {
    try {
      const formData = getFormData();
      await downloadPresentationExclusivityPDF(formData);
      toast.success(t.pdfDownloaded);
    } catch (error) {
      logger.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };
  
  const handleSendWhatsApp = () => {
    const message = isRTL
      ? `שלום ${ownerName},\n\nתודה על חתימתך על הסכם הבלעדיות לנכס ב${propertyAddress}.\n\nצוות סיטי מרקט נכסים`
      : `Hello ${ownerName},\n\nThank you for signing the exclusivity agreement for the property at ${propertyAddress}.\n\nCity Market Properties Team`;
    
    const phone = ownerPhone.replace(/\D/g, '');
    const url = `https://wa.me/972${phone.startsWith('0') ? phone.slice(1) : phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    toast.success(t.whatsappOpened);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8b7765 0%, #6d5a4a 100%)' }}>
        <Loader2 className="h-8 w-8 animate-spin text-[#f5c242]" />
      </div>
    );
  }
  
  if (showThankYou) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #8b7765 0%, #6d5a4a 100%)' }}
      >
        <Card className="max-w-md w-full bg-[#8b7765]/80 backdrop-blur-sm border-[#f5c242]/30 p-8 text-center text-white">
          <CheckCircle2 className="h-16 w-16 text-[#f5c242] mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2" style={{ textShadow: softShadow }}>{t.thankYouTitle}</h2>
          <p className="mb-6 opacity-90">{t.thankYouMessage}</p>
          
          <div className="space-y-3">
            <Button 
              onClick={handleDownloadPDF}
              className="w-full bg-[#f5c242] hover:bg-[#f5c242]/90 text-[#2d3b3a]"
            >
              <Download className="h-4 w-4 mr-2" />
              {t.downloadPdf}
            </Button>
            
            <Button 
              onClick={handleSendWhatsApp}
              variant="outline"
              className="w-full border-[#f5c242] text-[#f5c242] hover:bg-[#f5c242]/10"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {t.sendWhatsApp}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen py-6 px-4 relative"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(/images/exclusivity-signing-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* Warm overlay for readability */}
      <div 
        className="fixed inset-0 z-0" 
        style={{ 
          background: 'linear-gradient(135deg, rgba(139, 119, 101, 0.85) 0%, rgba(109, 90, 74, 0.85) 100%)'
        }} 
      />

      {/* All content above background */}
      <div className="relative z-10">
        {/* Language Toggle - Fixed Top Left */}
        <div className="fixed top-4 left-4 z-50 flex gap-2">
        <Button
          size="sm"
          variant={language === 'en' ? 'default' : 'outline'}
          onClick={() => setLanguage('en')}
          className={language === 'en' ? 'bg-[#f5c242] text-[#2d3b3a]' : 'bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30'}
        >
          EN
        </Button>
        <Button
          size="sm"
          variant={language === 'he' ? 'default' : 'outline'}
          onClick={() => setLanguage('he')}
          className={language === 'he' ? 'bg-[#f5c242] text-[#2d3b3a]' : 'bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30'}
        >
          עב
        </Button>
      </div>

      {/* Back to Presentation Button - Top Right */}
      <button
        onClick={() => navigate('/offer/ben-yehuda-110')}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-all"
        style={{ textShadow: softShadow }}
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-medium">
          {language === 'he' ? 'חזרה למצגת' : 'Back to Presentation'}
        </span>
      </button>

      {/* Logo - Fixed Bottom Right */}
      <div className="fixed bottom-8 right-4 z-50">
        <img src={cityMarketLogo} alt="City Market Properties" className="h-10 md:h-14 w-auto" />
      </div>

      <div className="max-w-2xl mx-auto pt-12">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 
            className="text-2xl md:text-3xl font-bold text-white mb-1"
            style={{ textShadow: softShadow }}
          >
            {t.pageTitle}
          </h1>
          <p className="text-white/80 text-sm">{t.subtitle}</p>
        </div>
        
        {/* Marketing Messages */}
        <Card className="bg-[#8b7765]/70 backdrop-blur-sm border-[#f5c242]/30 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-[#f5c242]" />
            <span className="text-[#f5c242] font-medium text-sm">
              {isRTL ? 'למה לבחור בנו?' : 'Why Choose Us?'}
            </span>
          </div>
          <div className="space-y-2">
            {t.marketingMessages.map((msg, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-[#f5c242] mt-0.5 flex-shrink-0" />
                <span className="text-white/90 text-sm">{msg}</span>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Property Details */}
        <Card className="bg-[#8b7765]/70 backdrop-blur-sm border-[#f5c242]/30 p-4 mb-4">
          <h3 className="text-[#f5c242] font-medium mb-3 text-sm">{t.propertySection}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-white/70 text-xs">{t.address}</Label>
              <Input 
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                className="bg-white/10 border-white/20 text-white text-sm h-9"
              />
            </div>
            <div>
              <Label className="text-white/70 text-xs">{t.city}</Label>
              <Input 
                value={propertyCity}
                onChange={(e) => setPropertyCity(e.target.value)}
                className="bg-white/10 border-white/20 text-white text-sm h-9"
              />
            </div>
            <div>
              <Label className="text-white/70 text-xs">{t.floor}</Label>
              <Input 
                value={propertyFloor}
                onChange={(e) => setPropertyFloor(e.target.value)}
                className="bg-white/10 border-white/20 text-white text-sm h-9"
              />
            </div>
            <div>
              <Label className="text-white/70 text-xs">{t.rooms}</Label>
              <Input 
                value={propertyRooms}
                onChange={(e) => setPropertyRooms(e.target.value)}
                className="bg-white/10 border-white/20 text-white text-sm h-9"
              />
            </div>
            <div>
              <Label className="text-white/70 text-xs">{t.size}</Label>
              <Input 
                value={propertySize}
                onChange={(e) => setPropertySize(e.target.value)}
                className="bg-white/10 border-white/20 text-white text-sm h-9"
              />
            </div>
            <div>
              <Label className="text-white/70 text-xs">{t.askingPrice}</Label>
              <Input 
                value={askingPrice}
                onChange={(e) => setAskingPrice(e.target.value)}
                className="bg-white/10 border-white/20 text-white text-sm h-9"
              />
            </div>
          </div>
        </Card>
        
        {/* Owner Details */}
        <Card className="bg-[#8b7765]/70 backdrop-blur-sm border-[#f5c242]/30 p-4 mb-4">
          <h3 className="text-[#f5c242] font-medium mb-3 text-sm">{t.ownerSection}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-white/70 text-xs">{t.ownerName} *</Label>
              <Input 
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="bg-white/10 border-white/20 text-white text-sm h-9"
                disabled={!!token && !!ownerName}
              />
            </div>
            <div>
              <Label className="text-white/70 text-xs">{t.ownerId} *</Label>
              <Input 
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="bg-white/10 border-white/20 text-white text-sm h-9"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-white/70 text-xs">{t.ownerAddress} *</Label>
              <Input 
                value={ownerAddress}
                onChange={(e) => setOwnerAddress(e.target.value)}
                className="bg-white/10 border-white/20 text-white text-sm h-9"
              />
            </div>
            <div>
              <Label className="text-white/70 text-xs">{t.ownerPhone} *</Label>
              <Input 
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                className="bg-white/10 border-white/20 text-white text-sm h-9"
              />
            </div>
            <div>
              <Label className="text-white/70 text-xs">{t.ownerEmail}</Label>
              <Input 
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                type="email"
                className="bg-white/10 border-white/20 text-white text-sm h-9"
              />
            </div>
          </div>
        </Card>
        
        {/* Exclusivity Terms */}
        <Card className="bg-[#8b7765]/70 backdrop-blur-sm border-[#f5c242]/30 p-4 mb-4">
          <h3 className="text-[#f5c242] font-medium mb-3 text-sm">{t.exclusivitySection}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-white/70 text-xs">{t.exclusivityPeriod}</Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="number"
                  value={exclusivityDays}
                  onChange={(e) => setExclusivityDays(Number(e.target.value))}
                  className="bg-white/10 border-white/20 text-white text-sm h-9"
                />
                <span className="text-white/70 text-xs whitespace-nowrap">{t.days}</span>
              </div>
            </div>
            <div>
              <Label className="text-white/70 text-xs">{t.startDate}</Label>
              <Input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white/10 border-white/20 text-white text-sm h-9"
              />
            </div>
            <div>
              <Label className="text-white/70 text-xs">{t.endDate}</Label>
              <Input 
                type="date"
                value={endDateStr}
                readOnly
                className="bg-white/5 border-white/10 text-white/70 text-sm h-9"
              />
            </div>
            <div>
              <Label className="text-white/70 text-xs">{t.commission}</Label>
              <div className="flex items-center gap-2">
                <Input 
                  value={commissionPercentage}
                  onChange={(e) => setCommissionPercentage(e.target.value)}
                  className="bg-white/10 border-white/20 text-white text-sm h-9"
                />
                <span className="text-white/70 text-xs">%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Checkbox
              id="includesVat"
              checked={includesVat}
              onCheckedChange={(checked) => setIncludesVat(checked as boolean)}
              className="border-white/30 data-[state=checked]:bg-[#f5c242] data-[state=checked]:border-[#f5c242]"
            />
            <Label htmlFor="includesVat" className="text-white/80 text-sm cursor-pointer">
              {t.includesVat}
            </Label>
          </div>
        </Card>
        
        {/* Legal Terms */}
        <Card className="bg-[#8b7765]/70 backdrop-blur-sm border-[#f5c242]/30 p-4 mb-4">
          <h3 className="text-[#f5c242] font-medium mb-3 text-sm">{t.legalSection}</h3>
          <p className="text-white/80 text-xs leading-relaxed mb-4">{t.legalText}</p>
          <div className="flex items-start gap-2">
            <Checkbox
              id="confirmTerms"
              checked={confirmTerms}
              onCheckedChange={(checked) => setConfirmTerms(checked as boolean)}
              className="border-white/30 data-[state=checked]:bg-[#f5c242] data-[state=checked]:border-[#f5c242] mt-0.5"
            />
            <Label htmlFor="confirmTerms" className="text-white text-sm cursor-pointer">
              {t.confirmUnderstanding}
            </Label>
          </div>
        </Card>
        
        {/* Signatures */}
        <Card className="bg-[#8b7765]/70 backdrop-blur-sm border-[#f5c242]/30 p-4 mb-4">
          <h3 className="text-[#f5c242] font-medium mb-3 text-sm">{t.signatureSection}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Owner Signature */}
            <div>
              <Label className="text-white/70 text-xs mb-2 block">{t.ownerSignature} *</Label>
              <div className={`bg-white rounded-lg overflow-hidden ${ownerSignatureData ? 'border-2 border-green-500' : 'border border-white/30'}`}>
                <SignatureCanvas
                  ref={ownerSignatureRef}
                  canvasProps={{
                    className: 'w-full h-24',
                    style: { width: '100%', height: '96px' }
                  }}
                  onEnd={handleOwnerSignatureEnd}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearOwnerSignature}
                className="mt-1 text-white/60 hover:text-white text-xs"
              >
                {t.clearSignature}
              </Button>
            </div>
            
            {/* Agent Signature */}
            <div>
              <Label className="text-white/70 text-xs mb-2 block">{t.agentSignature}</Label>
              <div className={`bg-white rounded-lg overflow-hidden ${agentSignatureData ? 'border-2 border-green-500' : 'border border-white/30'}`}>
                <SignatureCanvas
                  ref={agentSignatureRef}
                  canvasProps={{
                    className: 'w-full h-24',
                    style: { width: '100%', height: '96px' }
                  }}
                  onEnd={handleAgentSignatureEnd}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAgentSignature}
                className="mt-1 text-white/60 hover:text-white text-xs"
              >
                {t.clearSignature}
              </Button>
            </div>
          </div>
        </Card>
        
        {/* Generated Link Display */}
        {generatedLink && (
          <Card className="bg-green-900/50 backdrop-blur-sm border-green-500/30 p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="h-4 w-4 text-green-400" />
              <span className="text-green-400 font-medium text-sm">{t.linkCreated}</span>
            </div>
            <div className="bg-black/20 rounded p-2 text-xs text-white/80 break-all">
              {generatedLink}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(generatedLink);
                toast.success(t.linkCopied);
              }}
              className="mt-2 border-green-500/30 text-green-400 hover:bg-green-500/10"
            >
              {t.linkCopied}
            </Button>
          </Card>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 bg-[#f5c242] hover:bg-[#f5c242]/90 text-[#2d3b3a] font-medium"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            {t.signAndSubmit}
          </Button>
          
          {!token && (
            <Button
              onClick={handleCreateLink}
              disabled={isSaving}
              variant="outline"
              className="flex-1 border-[#f5c242] text-[#f5c242] hover:bg-[#f5c242]/10"
            >
              <Link2 className="h-4 w-4 mr-2" />
              {t.createRemoteLink}
            </Button>
          )}
        </div>
        
        {/* Footer */}
        <div className="text-center mt-6 text-white/50 text-xs">
          <p>{t.companyName} · {t.agentName} · {t.agentLicense}</p>
        </div>
      </div>
      </div> {/* Close z-10 wrapper */}
    </div>
  );
};

export default PresentationExclusivityForm;
