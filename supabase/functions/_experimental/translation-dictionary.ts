/**
 * Static Hebrew-English translation dictionary for real estate
 * 
 * EXPERIMENTAL - Completely isolated from production code
 * This dictionary provides translations without AI calls
 */

// ============================================
// Cities (from locations.ts)
// ============================================

export const CITIES_HE_EN: Record<string, string> = {
  // Main cities
  'תל אביב יפו': 'Tel Aviv-Jaffa',
  'תל אביב': 'Tel Aviv',
  'תל-אביב': 'Tel Aviv',
  'ת"א': 'Tel Aviv',
  'רמת גן': 'Ramat Gan',
  'רמת-גן': 'Ramat Gan',
  'גבעתיים': 'Givatayim',
  'גבעת יים': 'Givatayim',
  'הרצליה': 'Herzliya',
  'רעננה': 'Ra\'anana',
  'פתח תקווה': 'Petah Tikva',
  'פתח-תקווה': 'Petah Tikva',
  'פ"ת': 'Petah Tikva',
  'ראשון לציון': 'Rishon LeZion',
  'ראשון-לציון': 'Rishon LeZion',
  'ראשל"צ': 'Rishon LeZion',
  'חולון': 'Holon',
  'בת ים': 'Bat Yam',
  'בת-ים': 'Bat Yam',
  'נתניה': 'Netanya',
  'בני ברק': 'Bnei Brak',
  'בני-ברק': 'Bnei Brak',
  'כפר סבא': 'Kfar Saba',
  'כפר-סבא': 'Kfar Saba',
  'הוד השרון': 'Hod HaSharon',
  'הוד-השרון': 'Hod HaSharon',
  'רמת השרון': 'Ramat HaSharon',
  'רמת-השרון': 'Ramat HaSharon',
  'אשדוד': 'Ashdod',
  'אשקלון': 'Ashkelon',
};

// ============================================
// Tel Aviv Neighborhoods (from locations.ts)
// ============================================

export const TEL_AVIV_NEIGHBORHOODS_HE_EN: Record<string, string> = {
  // צפון ישן
  'צפון ישן': 'Old North',
  'הצפון הישן': 'Old North',
  'הצפון הישן - צפון': 'Old North',
  'הצפון הישן - דרום': 'Old North',
  'הצפון הישן החלק הצפוני': 'Old North',
  'הצפון הישן החלק המרכזי': 'Old North',
  
  // צפון חדש
  'צפון חדש': 'New North',
  'הצפון החדש': 'New North',
  'הצפון החדש - צפון': 'New North',
  'הצפון החדש - דרום': 'New North',
  'הצפון החדש החלק הצפוני': 'New North',
  'הצפון החדש החלק הדרומי': 'New North',
  'לואי מרשל': 'Louis Marshall',
  
  // מרכז העיר
  'מרכז העיר': 'City Center',
  'לב העיר': 'City Center',
  'לב תל אביב': 'Tel Aviv Center',
  'לב העיר צפון': 'City Center North',
  'לב העיר דרום': 'City Center South',
  
  // פלורנטין
  'פלורנטין': 'Florentin',
  'דרום פלורנטין': 'South Florentin',
  'נחלת בנימין': 'Nahalat Binyamin',
  
  // נווה צדק
  'נווה צדק': 'Neve Tzedek',
  'נוה צדק': 'Neve Tzedek',
  
  // רוטשילד
  'רוטשילד': 'Rothschild',
  'דרום רוטשילד': 'South Rothschild',
  'מונטיפיורי': 'Montefiore',
  'שרונה': 'Sarona',
  'גני שרונה': 'Sarona Gardens',
  'קרית הממשלה': 'Government Complex',
  
  // כרם התימנים
  'כרם התימנים': 'Kerem HaTeimanim',
  'הירקון': 'HaYarkon',
  
  // כיכר המדינה
  'כיכר המדינה': 'Kikar HaMedina',
  'אזור ככר המדינה': 'Kikar HaMedina Area',
  
  // רמת אביב
  'רמת אביב': 'Ramat Aviv',
  'רמת אביב החדשה': 'Ramat Aviv HaHadasha',
  'רמת אביב ג': 'Ramat Aviv Gimel',
  'נופי ים': 'Nofei Yam',
  'הגוש הגדול': 'HaGush HaGadol',
  
  // יפו
  'יפו': 'Jaffa',
  'יפו ג': 'Jaffa C',
  'יפו ד': 'Jaffa D',
  'יפו העתיקה': 'Old Jaffa',
  'עג\'מי': 'Ajami',
  'מרכז יפו': 'Central Jaffa',
  'צפון יפו': 'North Jaffa',
  
  // צהלה
  'צהלה': 'Tzahala',
  'גני צהלה': 'Ganei Tzahala',
  'צהלון': 'Tzahalon',
  'רמות צהלה': 'Ramot Tzahala',
  'כוכב הצפון': 'Kochav HaTzafon',
  
  // בבלי
  'בבלי': 'Bavli',
  'שיכון בבלי': 'Shikun Bavli',
  'הבשן': 'HaBashan',
  
  // נמל תל אביב
  'נמל תל אביב': 'Tel Aviv Port',
  'יורדי הסירה': 'Yordei HaSira',
  'ירמיהו': 'Yirmiyahu',
  'התערוכה': 'HaTa\'arucha',
  
  // תל ברוך
  'תל ברוך': 'Tel Baruch',
  'תל ברוך צפון': 'Tel Baruch North',
  'תל ברוך דרום': 'Tel Baruch South',
  
  // דרום תל אביב
  'דרום תל אביב': 'South Tel Aviv',
  'שפירא': 'Shapira',
  'נווה שאנן': 'Neve Sha\'anan',
  'התקווה': 'HaTikva',
  'שכונת התקווה': 'HaTikva Neighborhood',
  'כפר שלם': 'Kfar Shalem',
  'יד אליהו': 'Yad Eliyahu',
  
  // אחרות
  'אזורי חן': 'Azorei Chen',
  'גימל החדשה': 'Gimel HaHadasha',
  'נווה אביבים': 'Neve Avivim',
  'נוה אביבים': 'Neve Avivim',
  'הדר יוסף': 'Hadar Yosef',
  'נווה שרת': 'Neve Sharet',
  'נוה שרת': 'Neve Sharet',
};

// ============================================
// Other Neighborhoods
// ============================================

export const OTHER_NEIGHBORHOODS_HE_EN: Record<string, string> = {
  // רמת גן
  'מרכז רמת גן': 'Ramat Gan Center',
  'אזור הבורסה': 'Diamond Exchange Area',
  'הבורסה': 'Diamond Exchange',
  'יהודה המכבי': 'Yehuda HaMaccabi',
  'רמת חן': 'Ramat Chen',
  'תל בנימין': 'Tel Binyamin',
  'נחלת גנים': 'Nahalat Ganim',
  
  // גבעתיים
  'מרכז גבעתיים': 'Givatayim Center',
  'בורוכוב': 'Borochov',
  
  // הרצליה
  'הרצליה פיתוח': 'Herzliya Pituach',
  'מרכז הרצליה': 'Herzliya Center',
};

// ============================================
// Additional Neighborhoods (from real data)
// ============================================

export const ADDITIONAL_NEIGHBORHOODS_HE_EN: Record<string, string> = {
  // תל אביב - שכונות נוספות
  'המשתלה': 'HaMishtala',
  'אפקה': 'Afeka',
  'ביצרון': 'Bitzaron',
  'ביצרון ורמת ישראל': 'Bitzaron and Ramat Israel',
  'רמת ישראל': 'Ramat Israel',
  'גבעת הרמב"ם': 'Givat HaRambam',
  'גבעת רמב"ם': 'Givat HaRambam',
  'גבעת הרצל': 'Givat Herzl',
  'הארגזים': 'HaArgazim',
  'הבימה': 'HaBima',
  'המושבה האמריקאית-גרמנית': 'American-German Colony',
  'המושבה האמריקאית': 'American Colony',
  'המושבה הגרמנית': 'German Colony',
  'איזור שדה דב': 'Sde Dov Area',
  'שדה דב': 'Sde Dov',
  'צמרות': 'Tzamerot',
  'צמרות איילון': 'Tzamerot Ayalon',
  'פארק צמרת': 'Park Tzameret',
  'שיכון דן': 'Shikun Dan',
  'נווה דן': 'Neve Dan',
  'נוה דן': 'Neve Dan',
  'נווה צה"ל': 'Neve Tzahal',
  'נוה צה"ל': 'Neve Tzahal',
  'נווה גולן': 'Neve Golan',
  'נוה גולן': 'Neve Golan',
  'נווה ברבור': 'Neve Barbur',
  'כפר שלם מערב': 'Kfar Shalem West',
  'גבעת התמרים': 'Givat HaTmarim',
  'חצרות יפו': 'Hatzrot Yafo',
  'נמל יפו': 'Jaffa Port',
  'לנדאו': 'Landau',
  'מבואות יפו': "Mevo'ot Yafo",
  'מונסון': 'Monson',
  'רמת הטייסים': 'Ramat HaTaysim',
  'קריית שלום': 'Kiryat Shalom',
  'קריית שאול': 'Kiryat Shaul',
  'נחלת יצחק': 'Nahalat Yitzhak',
  'גני צהלה': 'Ganei Tzahala',
  'עזרא': 'Ezra',
  'עזרא והבונים': 'Ezra VeHaBonim',
  'גבעת עליה': 'Givat Aliya',
  'גבעת עלייה': 'Givat Aliya',
  
  // יפו - וריאציות נוספות
  "יפו ג' - נווה גולן": 'Jaffa C - Neve Golan',
  "יפו ד'": 'Jaffa D',
  'יפו ד׳': 'Jaffa D',
  "יפו ד' - גבעת התמרים": 'Jaffa D - Givat HaTmarim',
  'יפו העתיקה - נמל יפו': 'Old Jaffa - Port',
  
  // אזורים כלליים
  'מרכז': 'Center',
  'צפון': 'North',
  'דרום': 'South',
  'מזרח': 'East',
  'מערב': 'West',
};

// ============================================
// Property Types
// ============================================

export const PROPERTY_TYPES_HE_EN: Record<string, string> = {
  'דירה': 'Apartment',
  'דירת': 'Apartment',
  'פנטהאוז': 'Penthouse',
  'פנטהאוס': 'Penthouse',
  'דירת גן': 'Garden Apartment',
  'דירת גג': 'Rooftop Apartment',
  'סטודיו': 'Studio',
  'קוטג\'': 'Cottage',
  'קוטג': 'Cottage',
  'בית פרטי': 'Private House',
  'בית': 'House',
  'דופלקס': 'Duplex',
  'טריפלקס': 'Triplex',
  'יחידת דיור': 'Housing Unit',
  'מיני פנטהאוז': 'Mini Penthouse',
  'לופט': 'Loft',
  'וילה': 'Villa',
};

// ============================================
// Property Features
// ============================================

export const PROPERTY_FEATURES_HE_EN: Record<string, string> = {
  // Rooms
  'חדר': 'room',
  'חדרים': 'rooms',
  'חדר שינה': 'bedroom',
  'חדרי שינה': 'bedrooms',
  'סלון': 'living room',
  'מטבח': 'kitchen',
  'אמבטיה': 'bathroom',
  'שירותים': 'restroom',
  'מקלחת': 'shower',
  
  // Outdoor
  'מרפסת': 'balcony',
  'מרפסת שמש': 'sun balcony',
  'גינה': 'garden',
  'חצר': 'yard',
  'גג': 'roof',
  'גג פרטי': 'private roof',
  
  // Safety & Infrastructure
  'ממ"ד': 'safe room',
  'ממד': 'safe room',
  'מחסן': 'storage',
  'מחסן פרטי': 'private storage',
  'חניה': 'parking',
  'חנייה': 'parking',
  'חניה פרטית': 'private parking',
  'חניון': 'parking garage',
  'מעלית': 'elevator',
  
  // Climate
  'מיזוג': 'air conditioning',
  'מיזוג אוויר': 'air conditioning',
  'מזגן': 'AC unit',
  'מזגנים': 'AC units',
  'חימום': 'heating',
  'רדיאטור': 'radiator',
  
  // Furnishing
  'מרוהטת': 'furnished',
  'מרוהט': 'furnished',
  'ריהוט מלא': 'fully furnished',
  'ריהוט חלקי': 'partially furnished',
  'ללא ריהוט': 'unfurnished',
  
  // Building
  'קומה': 'floor',
  'קומת קרקע': 'ground floor',
  'קומה ראשונה': 'first floor',
  'מ"ר': 'sqm',
  'מטר': 'meter',
  'בניין': 'building',
  'בניין חדש': 'new building',
  'משותף': 'shared',
  
  // Views
  'נוף': 'view',
  'נוף לים': 'sea view',
  'נוף לעיר': 'city view',
  'נוף פתוח': 'open view',
  
  // Additional common terms
  'עיר': 'city',
  'תחבורה': 'transportation',
  'תחבורה ציבורית': 'public transportation',
  'ציבורי': 'public',
  'ציבורית': 'public',
  'קרוב': 'close',
  'קרובה': 'close',
  'רחוק': 'far',
  'רחוקה': 'far',
  'ישיר': 'direct',
  'ישירה': 'direct',
  'אוויר': 'air',
  'שמש': 'sun',
  'ים': 'sea',
  'פארק': 'park',
  'גן': 'garden',
  'רחוב': 'street',
  'שדרה': 'boulevard',
  'שדרות': 'boulevard',
  'כביש': 'road',
  'מעבר': 'passage',
};

// ============================================
// Transaction Terms
// ============================================

export const TRANSACTION_TERMS_HE_EN: Record<string, string> = {
  'להשכרה': 'for rent',
  'לשכירות': 'for rent',
  'שכירות': 'rent',
  'למכירה': 'for sale',
  'מכירה': 'sale',
  'כניסה מיידית': 'immediate entry',
  'כניסה גמישה': 'flexible entry',
  'פנוי': 'available',
  'פנויה': 'available',
  'מיידי': 'immediate',
  'מושכר': 'rented',
  'מושכרת': 'rented',
  
  // Condition
  'משופץ': 'renovated',
  'משופצת': 'renovated',
  'שיפוץ מלא': 'fully renovated',
  'חדש': 'new',
  'חדשה': 'new',
  'חדש מקבלן': 'new from developer',
  'יד שנייה': 'second hand',
  'יד ראשונה': 'first hand',
  'לפני מסירה': 'before handover',
  
  // Price
  'שכר דירה': 'rent',
  'מחיר': 'price',
  'ש"ח': 'NIS',
  'שקל': 'shekel',
  'שקלים': 'shekels',
  'לחודש': 'per month',
  'כולל': 'including',
  'לא כולל': 'not including',
  'ארנונה': 'property tax',
  'ועד בית': 'building committee fee',
};

// ============================================
// Common Phrases
// ============================================

export const COMMON_PHRASES_HE_EN: Record<string, string> = {
  'דירה יפה': 'beautiful apartment',
  'דירה מרווחת': 'spacious apartment',
  'דירה מוארת': 'bright apartment',
  'דירה שקטה': 'quiet apartment',
  'רחוב שקט': 'quiet street',
  'אזור מבוקש': 'sought-after area',
  'מיקום מעולה': 'excellent location',
  'קרוב לים': 'close to the beach',
  'קרוב לפארק': 'close to the park',
  'קרוב לתחבורה': 'close to transportation',
  'נוף פתוח': 'open view',
  'ללא תיווך': 'no broker',
  'בלעדי': 'exclusive',
  'דמי תיווך': 'broker fee',
  'ללא מתווך': 'no broker',
  'פרטי': 'private',
  'בעלים': 'owner',
};

// ============================================
// Marketing Terms
// ============================================

export const MARKETING_TERMS_HE_EN: Record<string, string> = {
  // Promotional phrases
  'נכס חדש': 'new property',
  'חבל לפספס': "don't miss out",
  'בהזדמנות': 'great opportunity',
  'הזדמנות': 'opportunity',
  'ייחודי': 'unique',
  'ייחודית': 'unique',
  'בבלעדיות': 'exclusively',
  'ירידת מחיר': 'price drop',
  'מחיר מציאה': 'bargain price',
  'חדש!': 'new!',
  'חם!': 'hot!',
  'מומלץ': 'recommended',
  'מומלצת': 'recommended',
  
  // Property qualities
  'נוף פתוח לעיר': 'open city view',
  'נוף לים': 'sea view',
  'נוף לפארק': 'park view',
  'נכס עורפי': 'rear-facing property',
  'כיווני אוויר': 'air directions',
  '3 כיווני אוויר': '3 air directions',
  '2 כיווני אוויר': '2 air directions',
  '4 כיווני אוויר': '4 air directions',
  'מטבח גדול': 'large kitchen',
  'יחידת הורים': 'master suite',
  'מאסטר': 'master bedroom',
  'סוויטת הורים': 'master suite',
  
  // Renovation terms
  'שיפוץ': 'renovation',
  'משופצת אדריכלית': 'architecturally renovated',
  'שמור': 'well-maintained',
  'שמורה': 'well-maintained',
  'במצב מעולה': 'in excellent condition',
  'מצב מעולה': 'excellent condition',
  'כמו חדש': 'like new',
  'כחדש': 'like new',
  
  // Floor terms
  'קומה גבוהה': 'high floor',
  'קומה נמוכה': 'low floor',
  
  // Location phrases
  'קרוב לתחבורה ציבורית': 'close to public transportation',
  'ליד': 'next to',
  'סמוך ל': 'adjacent to',
  'במרחק הליכה': 'walking distance',
  'מול הים': 'facing the sea',
  'על הים': 'on the beach',
  
  // Common adjectives (masculine/feminine forms)
  'גדול': 'large',
  'גדולה': 'large',
  'קטן': 'small',
  'קטנה': 'small',
  'יפה': 'beautiful',
  'יפהפה': 'beautiful',
  'מהמם': 'stunning',
  'מהממת': 'stunning',
  'נהדר': 'wonderful',
  'נהדרת': 'wonderful',
  'מדהים': 'amazing',
  'מדהימה': 'amazing',
  'מושלם': 'perfect',
  'מושלמת': 'perfect',
  'מרווח': 'spacious',
  'מרווחת': 'spacious',
  'מואר': 'bright',
  'מוארת': 'bright',
  'שקט': 'quiet',
  'שקטה': 'quiet',
  'חדש': 'new',
  'חדשה': 'new',
  'ישן': 'old',
  'ישנה': 'old',
  'טוב': 'good',
  'טובה': 'good',
  'מעולה': 'excellent',
  'מעולה': 'excellent',
  'נוח': 'comfortable',
  'נוחה': 'comfortable',
  'פרטי': 'private',
  'פרטית': 'private',
  'מרכזי': 'central',
  'מרכזית': 'central',
};

// ============================================
// Connectors and Prepositions
// ============================================

export const CONNECTORS_HE_EN: Record<string, string> = {
  // Prepositions
  'ב': 'in',
  'ב-': 'in',
  'ו': 'and',
  'ו-': 'and',
  'עם': 'with',
  'ל': 'to',
  'ל-': 'to',
  'של': 'of',
  'על': 'on',
  'מ': 'from',
  'מ-': 'from',
  'אל': 'to',
  'בין': 'between',
  'ליד': 'near',
  'מול': 'facing',
  'תחת': 'under',
  'עד': 'until',
  'ללא': 'without',
  'בלי': 'without',
  'כולל': 'including',
  'לא כולל': 'not including',
  'או': 'or',
  'גם': 'also',
  'רק': 'only',
  'כל': 'all',
  'אחרי': 'after',
  'לפני': 'before',
  
  // Currency symbols
  '₪': 'NIS',
  'שח': 'NIS',
  "ש''ח": 'NIS',
  
  // Numbers as words
  'אחד': 'one',
  'אחת': 'one',
  'שתיים': 'two',
  'שניים': 'two',
  'שלוש': 'three',
  'ארבע': 'four',
  'חמש': 'five',
};

// ============================================
// Combined Dictionary
// ============================================

export const FULL_DICTIONARY_HE_EN: Record<string, string> = {
  ...CITIES_HE_EN,
  ...TEL_AVIV_NEIGHBORHOODS_HE_EN,
  ...OTHER_NEIGHBORHOODS_HE_EN,
  ...ADDITIONAL_NEIGHBORHOODS_HE_EN,
  ...PROPERTY_TYPES_HE_EN,
  ...PROPERTY_FEATURES_HE_EN,
  ...TRANSACTION_TERMS_HE_EN,
  ...COMMON_PHRASES_HE_EN,
  ...MARKETING_TERMS_HE_EN,
  ...CONNECTORS_HE_EN,
};

// ============================================
// Reverse Dictionary (EN -> HE)
// ============================================

export const FULL_DICTIONARY_EN_HE: Record<string, string> = Object.fromEntries(
  Object.entries(FULL_DICTIONARY_HE_EN).map(([he, en]) => [en.toLowerCase(), he])
);

// ============================================
// Statistics
// ============================================

export const DICTIONARY_STATS = {
  cities: Object.keys(CITIES_HE_EN).length,
  tel_aviv_neighborhoods: Object.keys(TEL_AVIV_NEIGHBORHOODS_HE_EN).length,
  other_neighborhoods: Object.keys(OTHER_NEIGHBORHOODS_HE_EN).length,
  additional_neighborhoods: Object.keys(ADDITIONAL_NEIGHBORHOODS_HE_EN).length,
  property_types: Object.keys(PROPERTY_TYPES_HE_EN).length,
  property_features: Object.keys(PROPERTY_FEATURES_HE_EN).length,
  transaction_terms: Object.keys(TRANSACTION_TERMS_HE_EN).length,
  common_phrases: Object.keys(COMMON_PHRASES_HE_EN).length,
  marketing_terms: Object.keys(MARKETING_TERMS_HE_EN).length,
  connectors: Object.keys(CONNECTORS_HE_EN).length,
  total: Object.keys(FULL_DICTIONARY_HE_EN).length,
};
