

## שדרוג כרטיסי חטיבות — באמת פרימיום

### מה לא עובד עכשיו
הכרטיסים עדיין נראים "רגילים" — features list עם הרבה טקסט, אייקון בתוך עיגול, gradient כבד. צריך שינוי מהותי יותר.

### הכיוון החדש
כרטיס נקי עם **רק כותרת גדולה** — בלי features, בלי description. התמונה עושה את העבודה. מינימליזם אמיתי.

### שינויים

**`src/components/DivisionCard.tsx` (עברית) + `src/components/en/DivisionCard.tsx`:**

1. **הסרת כל ה-features list** — בלי `<ul>` בכלל
2. **הסרת האייקון** בעיגול — מיותר, רק מוסיף עומס
3. **כותרת בלבד** — `font-playfair text-4xl md:text-5xl` centered, עם קו דק זהב מתחת (divider)
4. **Aspect ratio** — שינוי ל-`aspect-[3/4]` ליחס יותר אלגנטי
5. **Hover effect** — במקום scale של תמונה, opacity shift עדין של הoverlay + כותרת שעולה קצת (`group-hover:-translate-y-1`)

**`src/index.css`:**

6. **Overlay רך יותר** — `from-black/50 via-black/10 to-transparent` (פחות כהה, יותר תמונה)
7. **Hover** — `group-hover:from-black/60` (עדין)

**`src/pages/Index.tsx` + `src/pages/en/Index.tsx`:**

8. **הסרת `description`** מה-interface ומהנתונים (או שנשאיר ב-data ופשוט לא נציג)

**התוצאה:** כרטיס עם תמונה יפה, gradient רך בתחתית, וכותרת גדולה בלבד + קו זהב דק. נקי, פרימיום, מינימליסטי.

**4 קבצים, ~30 שורות שינוי.**

