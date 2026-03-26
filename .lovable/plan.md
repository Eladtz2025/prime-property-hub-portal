

## שדרוג עיצוב עמודי Insights לרמת היוקרה של האתר

### הבעיות הנוכחיות
1. **Class שגוי** — `bg-background` במקום `hebrew-luxury` / `english-luxury` (כל שאר הדפים באתר משתמשים בו)
2. **חסר `<html lang="he" dir="rtl" />`** ב-Helmet
3. **כותרות סקשנים עם אייקוני Lucide** — נראה זול. שאר האתר משתמש בפורמט אלגנטי: subtitle קטן uppercase + כותרת Playfair גדולה
4. **Empty state בנאלי** — טקסט אפור פשוט, לא תואם את העיצוב היוקרתי
5. **סקשן בעלי מקצוע** — `rounded-2xl` לא תואם את שאר האתר, צריך full-width עם גרדיאנט מתוחכם יותר
6. **חסרים `font-playfair` / `font-montserrat`** בכרטיסים העבריים
7. **Detail pages** — אותן בעיות: `bg-background` במקום luxury class

### שינויים (4 קבצים)

**`src/pages/he/Insights.tsx` + `src/pages/en/Insights.tsx`:**
1. שנה `bg-background` → `hebrew-luxury` / `english-luxury`
2. הוסף `<html lang="he" dir="rtl" />` ב-Helmet
3. החלף כותרות סקשנים מפורמט אייקון+כותרת → פורמט About page:
   - subtitle קטן: `font-montserrat text-sm tracking-widest uppercase text-muted-foreground`
   - כותרת: `font-playfair text-3xl sm:text-4xl font-normal tracking-wide`
4. שדרג empty state — הוסף אייקון דקורטיבי וטקסט מעוצב יותר
5. שדרג סקשן בעלי מקצוע — full-width section עם רקע `bg-muted/30` ועיצוב תואם About page
6. עטוף סקשנים ב-`bg-muted/30` מתחלף לעומק ויזואלי

**`src/pages/he/InsightDetail.tsx` + `src/pages/en/InsightDetail.tsx`:**
1. שנה `bg-background` → `hebrew-luxury` / `english-luxury`
2. הוסף `<html lang>` ב-Helmet

**אפס שינויים בלוגיקה, DB או ניתוב.**

