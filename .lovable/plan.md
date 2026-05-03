## מפת אתר (Sitemap Page)

יצירת עמוד מפת אתר ציבורי בסגנון מינימליסטי-יוקרתי תואם למותג (Playfair Display, גוונים זהובים #D4AF37, RTL לעברית, LTR לאנגלית), עם קישור אליו דרך אייקון ה-© בתחתית העמוד.

### 1. עמודי Sitemap חדשים

**`src/pages/he/Sitemap.tsx`** — עמוד עברית עם `dir="rtl"`:
- כותרת ראשית: "מפת האתר" + תת-כותרת "SITEMAP" + אייקון מפה (Lucide `Map`)
- רקע כהה לאזור הכותרת (luxury), תוכן על רקע בהיר
- כרטיסים בגריד 3 עמודות (1 במובייל), כל כרטיס עם אייקון + כותרת + רשימת קישורים. כל פריט מציג: שם בעברית מימין, ה-path הטכני משמאל בפונט מונוספייס.

קבוצות:
- **עמודים ראשיים** — דף הבית, השכרות, מכירות, ניהול נכסים, פרויקטים חדשים, שכונות, תובנות, אודות, צור קשר
- **שכונות** — רוטשילד, נווה צדק, פלורנטין, דיזנגוף, צפון ישן
- **טפסים ושירותים** — טופס לקוח (client-intake), בעלי מקצוע (professionals/shared)
- **שפות** — מעבר ל-English (קישור ל-`/en/sitemap`)

**`src/pages/en/Sitemap.tsx`** — מקבילה באנגלית עם `dir="ltr"`, אותו מבנה, קישור ל-`/he/sitemap`.

### 2. ראוטים ב-`src/App.tsx`

הוספת:
```
<Route path="/he/sitemap" element={<HebrewSitemap />} />
<Route path="/en/sitemap" element={<EnglishSitemap />} />
<Route path="/sitemap" element={<Navigate to="/he/sitemap" replace />} />
```
(lazy-loaded כמו שאר העמודים)

### 3. עדכון Footer — הפיכת © לקישור

**`src/components/Footer.tsx`** (עברית):
שינוי שורת הקופירייט מ-`<p>` ל-`<Link to="/he/sitemap">` עטוף סביב הסימן ©, עם hover לזהב (`hover:text-secondary`). שאר הטקסט נשאר רגיל.

**`src/components/en/Footer.tsx`** (אנגלית):
אותו דבר, ה-© הופך ל-`<Link to="/en/sitemap">`.

הסימן © יקבל `cursor-pointer`, `transition-colors`, ו-`title="מפת האתר"` / `title="Sitemap"` לנגישות.

### 4. עיצוב

- Playfair Display לכותרות, Inter/Montserrat לגוף
- מסגרות זהב עדינות (`border-secondary/30`) על הכרטיסים
- רווחים נדיבים, אייקונים מ-Lucide (Home, Building2, MapPin, FileText, Languages)
- מותאם מובייל (גריד מתכווץ), שומר על RTL/LTR לפי שפה

### הערות טכניות

- אין צורך ב-DB או edge functions — תוכן סטטי.
- הקישורים נבנים ידנית מתוך הראוטים הקיימים ב-`App.tsx` (לא דינמי).
- לא נוגעים ב-`public/sitemap.xml` (זה ה-XML ל-SEO, נשאר כמו שהוא).
