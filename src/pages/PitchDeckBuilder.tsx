import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePitchDeck, useCreatePitchDeck, useUpdatePitchDeck, useUpdateSlide } from '@/hooks/usePitchDecks';
import { PitchDeckSlide } from '@/types/pitch-deck';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowRight, 
  Save, 
  Eye, 
  Settings, 
  Layers,
  ExternalLink,
  Loader2
} from 'lucide-react';
import PropertySelector, { PropertyData } from '@/components/pitch-deck/builder/PropertySelector';
import SlideList from '@/components/pitch-deck/builder/SlideList';
import SlideEditor from '@/components/pitch-deck/builder/SlideEditor';
import { toast } from 'sonner';

const PitchDeckBuilder = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  
  const { data: deck, isLoading } = usePitchDeck(isNew ? undefined : id);
  const createMutation = useCreatePitchDeck();
  const updateMutation = useUpdatePitchDeck();
  const updateSlideMutation = useUpdateSlide();
  
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [language, setLanguage] = useState<'he' | 'en'>('he');
  const [isActive, setIsActive] = useState(false);
  const [propertyId, setPropertyId] = useState<string | undefined>();
  const [contactPhone, setContactPhone] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [agentNames, setAgentNames] = useState('');
  const [themeColor, setThemeColor] = useState('#f5c242');
  const [overlayOpacity, setOverlayOpacity] = useState(0.85);
  
  const [selectedSlide, setSelectedSlide] = useState<PitchDeckSlide | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load deck data
  useEffect(() => {
    if (deck) {
      setTitle(deck.title);
      setSlug(deck.slug);
      setLanguage(deck.language as 'he' | 'en');
      setIsActive(deck.is_active);
      setPropertyId(deck.property_id || undefined);
      setContactPhone(deck.contact_phone || '');
      setContactWhatsapp(deck.contact_whatsapp || '');
      setAgentNames(deck.agent_names || '');
      setThemeColor(deck.theme_color || '#f5c242');
      setOverlayOpacity(deck.overlay_opacity || 0.85);
    }
  }, [deck]);

  const handlePropertyChange = (newPropertyId: string | undefined, property?: PropertyData) => {
    setPropertyId(newPropertyId);
    
    // Auto-fill from property
    if (property) {
      setTitle(`${property.address}, ${property.city}`);
      setSlug(property.address.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  };

  const handleSave = async () => {
    if (!title || !slug) {
      toast.error('יש למלא שם וכתובת URL');
      return;
    }
    
    setIsSaving(true);
    
    try {
      if (isNew) {
        const newDeck = await createMutation.mutateAsync({
          title,
          slug,
          language,
          is_active: isActive,
          property_id: propertyId,
          contact_phone: contactPhone,
          contact_whatsapp: contactWhatsapp,
          agent_names: agentNames,
          theme_color: themeColor,
          overlay_opacity: overlayOpacity,
        });
        navigate(`/admin-dashboard/pitch-decks/${newDeck.id}`);
      } else if (id) {
        await updateMutation.mutateAsync({
          id,
          title,
          slug,
          language,
          is_active: isActive,
          property_id: propertyId || null,
          contact_phone: contactPhone,
          contact_whatsapp: contactWhatsapp,
          agent_names: agentNames,
          theme_color: themeColor,
          overlay_opacity: overlayOpacity,
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSlideUpdate = (updates: Partial<PitchDeckSlide>) => {
    if (selectedSlide) {
      updateSlideMutation.mutate({
        id: selectedSlide.id,
        ...updates,
      });
    }
  };

  const handleToggleSlideVisibility = (slideId: string, isVisible: boolean) => {
    updateSlideMutation.mutate({ id: slideId, is_visible: isVisible });
  };

  if (isLoading && !isNew) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin-dashboard/forms')}>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">
              {isNew ? 'מצגת חדשה' : `עריכת מצגת: ${title}`}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {!isNew && (
              <Button
                variant="outline"
                onClick={() => window.open(`/offer/${slug}`, '_blank')}
              >
                <Eye className="h-4 w-4 ml-2" />
                תצוגה מקדימה
              </Button>
            )}
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 ml-2" />
              )}
              שמירה
            </Button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel - Settings & Slides */}
          <div className="lg:col-span-4 space-y-6">
            <Tabs defaultValue="settings">
              <TabsList className="w-full">
                <TabsTrigger value="settings" className="flex-1">
                  <Settings className="h-4 w-4 ml-1" />
                  הגדרות
                </TabsTrigger>
                <TabsTrigger value="slides" className="flex-1">
                  <Layers className="h-4 w-4 ml-1" />
                  סליידים
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="settings" className="mt-4 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">פרטי המצגת</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <PropertySelector
                      value={propertyId}
                      onChange={handlePropertyChange}
                    />
                    
                    <div className="space-y-2">
                      <Label>שם המצגת</Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="בן יהודה 110, תל אביב"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>כתובת URL (slug)</Label>
                      <Input
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                        placeholder="ben-yehuda-110"
                        dir="ltr"
                      />
                      <p className="text-xs text-muted-foreground">
                        הלינק יהיה: /offer/{slug || 'slug'}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label>שפה</Label>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={language === 'he' ? 'default' : 'outline'}
                          onClick={() => setLanguage('he')}
                        >
                          עברית
                        </Button>
                        <Button
                          size="sm"
                          variant={language === 'en' ? 'default' : 'outline'}
                          onClick={() => setLanguage('en')}
                        >
                          English
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label>פעיל (גלוי לציבור)</Label>
                      <Switch
                        checked={isActive}
                        onCheckedChange={setIsActive}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">פרטי יצירת קשר</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>טלפון</Label>
                      <Input
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+972-50-000-0000"
                        dir="ltr"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>וואטסאפ</Label>
                      <Input
                        value={contactWhatsapp}
                        onChange={(e) => setContactWhatsapp(e.target.value)}
                        placeholder="+972500000000"
                        dir="ltr"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>שמות הסוכנים</Label>
                      <Input
                        value={agentNames}
                        onChange={(e) => setAgentNames(e.target.value)}
                        placeholder="אלי כהן, דנה לוי"
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">עיצוב</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>צבע ראשי</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={themeColor}
                          onChange={(e) => setThemeColor(e.target.value)}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={themeColor}
                          onChange={(e) => setThemeColor(e.target.value)}
                          dir="ltr"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>שקיפות שכבת הרקע ({Math.round(overlayOpacity * 100)}%)</Label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={overlayOpacity}
                        onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="slides" className="mt-4">
                {deck?.slides && (
                  <SlideList
                    slides={deck.slides}
                    language={language}
                    selectedSlideId={selectedSlide?.id}
                    onSelectSlide={setSelectedSlide}
                    onToggleVisibility={handleToggleSlideVisibility}
                  />
                )}
                {isNew && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    שמור את המצגת כדי לערוך את הסליידים
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right Panel - Slide Editor */}
          <div className="lg:col-span-8">
            {selectedSlide ? (
              <SlideEditor
                slide={selectedSlide}
                language={language}
                onUpdate={handleSlideUpdate}
                onClose={() => setSelectedSlide(null)}
              />
            ) : (
              <Card className="h-full min-h-[400px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Layers className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>בחר סלייד לעריכה</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PitchDeckBuilder;
