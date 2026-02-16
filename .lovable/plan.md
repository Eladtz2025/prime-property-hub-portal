
# הירו חדש לבדיקה - בסגנון SUNLESS

## מה ייווצר
קומפוננטת הירו חדשה בשם `NewHeroTest` בסגנון התמונה שנשלחה - מראה מינימליסטי ואלגנטי עם:

- תמונת רקע full-screen עם overlay כהה עדין
- טקסט עליון קטן עם tracking רחב (כמו "DESIGN YOUR LIGHT") - אצלנו: "REAL ESTATE BOUTIQUE"
- שם החברה גדול ובולט: **CITY MARKET**
- תת-כותרת בעברית באמצע
- "Since 2016" בזהב עדין
- שני כפתורי CTA: אחד מלא (רקע לבן) ואחד outline (גבול לבן בלבד) - בדיוק כמו בתמונה
- Scroll indicator בתחתית

## נקודות חשובות
- הקומפוננטה תישמר כקובץ נפרד ולא תחליף את ה-Hero הקיים
- תירשם בנתיב בדיקה (למשל `/he/test-hero`) כדי לא להשפיע על הפרודקשן
- תשתמש באותה תמונת רקע קיימת

## פירוט טכני

### קובץ חדש: `src/components/he/NewHeroTest.tsx`
- קומפוננטה full-screen (`h-screen`)
- רקע: אותה תמונת hero קיימת עם `bg-black/40` overlay
- טיפוגרפיה:
  - טקסט עליון: `tracking-[0.4em] uppercase text-sm text-white/80`
  - כותרת ראשית: `font-serif text-6xl md:text-8xl font-bold text-white`
  - תת-כותרת: `text-white/90 text-base md:text-lg` בעברית
  - Since 2016: בצבע זהוב (`text-amber-400/80`) עם tracking רחב
- כפתור ראשון (השכרה): רקע לבן מלא, טקסט כהה - כמו "Shop Online" בתמונה
- כפתור שני (קנייה): border לבן בלבד, טקסט לבן - כמו "תיאום ייעוץ בבית" בתמונה
- Language switcher ו-scroll indicator כמו ב-VideoHero הקיים

### קובץ חדש: `src/pages/TestHero.tsx`
- דף פשוט שמציג את `NewHeroTest` בלבד
- ללא header/footer - רק ההירו לצפייה

### עדכון: `src/App.tsx`
- הוספת route: `/he/test-hero` שמצביע ל-`TestHero`
