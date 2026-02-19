

## שדרוג עיצוב יוקרתי ומינימליסטי - דפי אנשי מקצוע

### מה ישתנה

בהתאם לשפת המותג של CITY MARKET (Playfair Display, זהב #D4AF37, מינימליזם), שני הדפים יעברו שדרוג מלא:

### 1. Header יוקרתי
- רקע כהה עמוק עם קו זהב דקורטיבי דק בתחתית ה-Header
- כותרת בפונט `font-[Playfair_Display]` - italic, font-light
- תת-כותרת עם `tracking-[0.2em]` uppercase (באנגלית) / letter-spacing רחב (בעברית)
- כפתור שפה מינימלי - ללא רקע, רק טקסט עם hover underline

### 2. קטגוריות מקצוע - ללא אמוג'ים
- הסרת מפת `PROFESSION_EMOJI` לגמרי
- קו זהב דקורטיבי קצר (`w-8 h-[1px] bg-[#D4AF37]`) לפני שם הקטגוריה
- שם הקטגוריה ב-`font-light tracking-wide`
- ספירה בפונט דק ועדין

### 3. כרטיסי אנשי מקצוע מינימליסטיים
- רקע לבן נקי, border דק מאוד (`border-border/20`)
- `rounded-xl` במקום `rounded-2xl`
- שם איש המקצוע בפונט `font-[Playfair_Display]` גדול יותר
- אזור - ללא אייקון MapPin, רק טקסט אפור עדין עם separator דק
- הערות - בצבע אפור רך, font-light
- קופון - עיצוב עדין: border דק בלבד, ללא רקע צהוב, אקסנט זהב עדין

### 4. כפתורים מינימליסטיים
- כפתור "התקשר/Call" - border דק כהה, ללא fill, טקסט כהה, hover עדין
- כפתור "WhatsApp" (של איש מקצוע) - אותו סגנון כמו התקשר, border דק
- כפתור "אתר/Website" - רק טקסט עם underline, ללא border

### 5. Footer מותאם
- "CITY MARKET" במקום "Prime Property"
- קו זהב דק (`h-[1px] bg-[#D4AF37]/30`) מעל ה-footer
- טקסט ב-`tracking-widest`

### פרטים טכניים

**קבצים שישתנו:**
- `src/pages/ProfessionalsPublicPage.tsx`
- `src/pages/ProfessionalsPublicPageEN.tsx`

**שינויים עיקריים בשני הקבצים:**
- הסרת `PROFESSION_EMOJI` map
- הסרת import של `MapPin` מ-lucide (לא נשתמש באייקון מיקום)
- Header: `bg-[hsl(220,15%,8%)]` כהה יותר, כותרת `font-[Playfair_Display] italic font-light text-3xl`
- קטגוריות: `div` עם קו זהב + `h2 font-light tracking-wide text-lg`
- כרטיסים: `bg-white border border-border/20 rounded-xl p-5 md:p-6`
- שם: `font-[Playfair_Display] text-lg`
- אזור: `text-xs text-muted-foreground/60 font-light` ללא אייקון
- קופון: `border border-[#D4AF37]/30 rounded-lg p-3` עם טקסט זהוב עדין
- כפתור התקשר: `border border-foreground/15 text-foreground bg-transparent hover:bg-foreground/5 rounded-full`
- כפתור WhatsApp: אותו סגנון מינימלי כמו התקשר
- כפתור אתר: `bg-transparent border-0 underline underline-offset-4 text-muted-foreground`
- Footer: `CITY MARKET` עם `tracking-[0.3em] text-xs text-muted-foreground/50`

