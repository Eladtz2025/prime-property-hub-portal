import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePitchDeck, useCreatePitchDeck, useUpdatePitchDeck, useUpdateSlide } from '@/hooks/usePitchDecks';
import { PitchDeckSlide } from '@/types/pitch-deck';
import { supabase } from '@/integrations/supabase/client';
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
  Loader2,
  Wand2
} from 'lucide-react';
import PropertySelector, { PropertyData } from '@/components/pitch-deck/builder/PropertySelector';
import SlideList from '@/components/pitch-deck/builder/SlideList';
import SlideEditor from '@/components/pitch-deck/builder/SlideEditor';
import { toast } from 'sonner';
import { createBenYehuda110New } from '@/utils/migrateBenYehuda110';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

const PitchDeckBuilder = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;
  
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
  const [agentNames, setAgentNames] = useState('');
  const [themeColor, setThemeColor] = useState('#f5c242');
  const [overlayOpacity, setOverlayOpacity] = useState(0.85);
  
  const [selectedSlide, setSelectedSlide] = useState<PitchDeckSlide | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const initialDataRef = useRef<string>('');

  // Use unsaved changes hook (browser beforeunload only)
  useUnsavedChanges(hasUnsavedChanges);

  // Load deck data
  useEffect(() => {
    if (deck) {
      setTitle(deck.title);
      setSlug(deck.slug);
      setLanguage(deck.language as 'he' | 'en');
      setIsActive(deck.is_active);
      setPropertyId(deck.property_id || undefined);
      setContactPhone(deck.contact_phone || '');
      setAgentNames(deck.agent_names || '');
      setThemeColor(deck.theme_color || '#f5c242');
      setOverlayOpacity(deck.overlay_opacity || 0.85);
      // Store initial data
      initialDataRef.current = JSON.stringify({
        title: deck.title, slug: deck.slug, language: deck.language,
        isActive: deck.is_active, propertyId: deck.property_id,
        contactPhone: deck.contact_phone, agentNames: deck.agent_names,
        themeColor: deck.theme_color, overlayOpacity: deck.overlay_opacity
      });
    }
  }, [deck]);

  // Track changes
  useEffect(() => {
    if (!deck && !isNew) return;
    const currentData = JSON.stringify({
      title, slug, language, isActive, propertyId, contactPhone, agentNames, themeColor, overlayOpacity
    });
    setHasUnsavedChanges(currentData !== initialDataRef.current && initialDataRef.current !== '');
  }, [title, slug, language, isActive, propertyId, contactPhone, agentNames, themeColor, overlayOpacity, deck, isNew]);

  // Hebrew to English transliteration for URL slug
  const hebrewToSlug = (text: string): string => {
    // Common Hebrew words/phrases with proper transliteration
    const commonWords: Record<string, string> = {
      'תל אביב-יפו': 'tel-aviv-yafo',
      'תל אביב יפו': 'tel-aviv-yafo',
      'תל-אביב-יפו': 'tel-aviv-yafo',
      'תל-אביב': 'tel-aviv',
      'תל אביב': 'tel-aviv',
      'ירושלים': 'jerusalem',
      'חיפה': 'haifa',
      'באר שבע': 'beer-sheva',
      'ראשון לציון': 'rishon-lezion',
      'פתח תקווה': 'petah-tikva',
      'אשדוד': 'ashdod',
      'נתניה': 'netanya',
      'הרצליה': 'herzliya',
      'רמת גן': 'ramat-gan',
      'בני ברק': 'bnei-brak',
      'גבעתיים': 'givatayim',
      'רחובות': 'rehovot',
      'כפר סבא': 'kfar-saba',
      'רעננה': 'raanana',
      'הוד השרון': 'hod-hasharon',
      'יפו': 'yafo',
      'רחוב': '',
      'שדרות': 'sderot',
      'דרך': 'derech',
    };

    // Common Hebrew name patterns with vowels
    const namePatterns: Array<[RegExp, string]> = [
      [/בן יהודה/g, 'ben-yehuda'],
      [/רוטשילד/g, 'rothschild'],
      [/הרצל/g, 'herzl'],
      [/דיזנגוף/g, 'dizengoff'],
      [/אלנבי/g, 'allenby'],
      [/יצחק אלחנן/g, 'yitzhak-elhanan'],
      [/זלטופולסקי/g, 'zlatopolsky'],
      [/ביאליק/g, 'bialik'],
      [/ויצמן/g, 'weizmann'],
      [/ז'בוטינסקי/g, 'jabotinsky'],
      [/סוקולוב/g, 'sokolov'],
      [/נורדאו/g, 'nordau'],
      [/גורדון/g, 'gordon'],
      [/פרישמן/g, 'frishman'],
      [/ארלוזורוב/g, 'arlozorov'],
      [/קפלן/g, 'kaplan'],
      [/לינקולן/g, 'lincoln'],
      [/וושינגטון/g, 'washington'],
    ];

    let result = text;

    // First, replace common words/cities
    for (const [hebrew, english] of Object.entries(commonWords)) {
      result = result.replace(new RegExp(hebrew, 'g'), english);
    }

    // Then, replace common name patterns
    for (const [pattern, replacement] of namePatterns) {
      result = result.replace(pattern, replacement);
    }

    // For remaining Hebrew characters, use smarter transliteration with vowels
    const hebrewWithVowels: Record<string, string> = {
      'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'a',
      'ו': 'o', 'ז': 'z', 'ח': 'h', 'ט': 't', 'י': 'i',
      'כ': 'k', 'ך': 'kh', 'ל': 'l', 'מ': 'm', 'ם': 'm',
      'נ': 'n', 'ן': 'n', 'ס': 's', 'ע': 'a', 'פ': 'p',
      'ף': 'f', 'צ': 'tz', 'ץ': 'tz', 'ק': 'k', 'ר': 'r',
      'ש': 'sh', 'ת': 't'
    };

    // Process remaining Hebrew characters
    result = result
      .split('')
      .map(char => hebrewWithVowels[char] || char)
      .join('')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    return result;
  };

  const handlePropertyChange = (newPropertyId: string | undefined, property?: PropertyData) => {
    setPropertyId(newPropertyId);
    
    // Auto-fill title and slug from property
    if (property) {
      const fullTitle = `${property.address}, ${property.city}`;
      setTitle(fullTitle);
      setSlug(hebrewToSlug(fullTitle));
      
      // Auto-fill agent info from assigned agent (not property owner)
      if (property.agent_name && !agentNames) {
        setAgentNames(property.agent_name);
      }
      if (property.agent_phone && !contactPhone) {
        setContactPhone(property.agent_phone);
      }
      
      // Auto-update Title slide with address only (without city)
      if (deck?.slides) {
        const titleSlide = deck.slides.find(s => s.slide_type === 'title');
        if (titleSlide) {
          const currentData = titleSlide.slide_data as Record<string, unknown>;
          updateSlideMutation.mutate({
            id: titleSlide.id,
            slide_data: {
              ...currentData,
              main_title: property.address, // e.g., "זלטופולסקי 19" - without city
            }
          });
        }
      }
    } else {
      setTitle('');
      setSlug('');
    }
  };

  const handleSave = async () => {
    console.log('handleSave called', { title, slug, isNew, propertyId });
    
    if (!title || !slug) {
      toast.error('יש למלא שם וכתובת URL');
      return;
    }
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('יש להתחבר כדי לשמור מצגת');
      return;
    }
    
    setIsSaving(true);
    
    try {
      if (isNew) {
        console.log('Creating new pitch deck...');
        const newDeck = await createMutation.mutateAsync({
          title,
          slug,
          language,
          is_active: isActive,
          property_id: propertyId,
          contact_phone: contactPhone,
          contact_whatsapp: contactPhone,
          agent_names: agentNames,
          theme_color: themeColor,
          overlay_opacity: overlayOpacity,
        });
        console.log('Created deck:', newDeck);
        toast.success('המצגת נוצרה בהצלחה');
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
          contact_whatsapp: contactPhone,
          agent_names: agentNames,
          theme_color: themeColor,
          overlay_opacity: overlayOpacity,
        });
        toast.success('המצגת נשמרה בהצלחה');
      }
      // Reset unsaved changes after successful save
      initialDataRef.current = JSON.stringify({
        title, slug, language, isActive, propertyId, contactPhone, agentNames, themeColor, overlayOpacity
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('שגיאה בשמירה: ' + (error as Error).message);
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

  const handleMigrateBenYehuda = async () => {
    setIsMigrating(true);
    try {
      const result = await createBenYehuda110New();
      if (result.success && result.deckId) {
        toast.success('המצגת נוצרה בהצלחה!');
        navigate(`/admin-dashboard/pitch-decks/${result.deckId}`);
      } else {
        toast.error(result.error || 'שגיאה ביצירת המצגת');
      }
    } catch (error) {
      toast.error('שגיאה: ' + (error as Error).message);
    } finally {
      setIsMigrating(false);
    }
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
            {isNew && (
              <Button
                variant="outline"
                onClick={handleMigrateBenYehuda}
                disabled={isMigrating}
                className="text-amber-600 border-amber-600 hover:bg-amber-50"
              >
                {isMigrating ? (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4 ml-2" />
                )}
                צור Ben Yehuda 110
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                if (isNew) {
                  toast.info('יש לשמור את המצגת לפני תצוגה מקדימה');
                } else {
                  window.open(`/offer/${slug}`, '_blank');
                }
              }}
            >
              <Eye className="h-4 w-4 ml-2" />
              תצוגה מקדימה
            </Button>
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
                    
                    {title && (
                      <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                        <p className="text-sm font-medium">{title}</p>
                        <p className="text-xs text-muted-foreground" dir="ltr">
                          /offer/{slug || 'slug'}
                        </p>
                      </div>
                    )}
                    
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
                      <Label>טלפון (לשיחות ווואטסאפ)</Label>
                      <Input
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="050-000-0000"
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
                key={selectedSlide.id}
                slide={selectedSlide}
                language={language}
                propertyId={propertyId}
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
