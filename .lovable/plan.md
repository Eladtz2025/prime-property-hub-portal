

## המרת הניווט להמבורגר — בדסקטופ ובמובייל

### הבעיה
כרגע בדסקטופ (lg+) מוצגים לינקים בשני צדדי הלוגו. המשתמש רוצה שבמקום הלינקים יהיו אייקוני טלפון + מייל + המבורגר (כמו בתמונות), ולחיצה על ההמבורגר תפתח תפריט full-screen כהה עם הפריטים במרכז.

### העיצוב (מהתמונות)

**Header סגור:**
```text
[Logo center]                    [📞] [✉️] [☰]
```

**Header פתוח — full-screen overlay:**
```text
[Logo]                           [📞] [✉️] [✕]

                    Home          ← active = gold
                    Curated Listings
                    Services
                    About
                    Insights
                    Contact

          citymarketlv@gmail.com  Tali: +972...  Elad: +972...
```
רקע כהה (`bg-[#0a1628]`), פריטים centered, פונט גדול, active בצבע זהב.

### שינויים

**`src/components/en/Header.tsx`:**
1. הסרת ה-nav הימני והשמאלי של דסקטופ (`hidden lg:flex`) — כל הלינקים עוברים להמבורגר
2. בצד ימין של ה-header: אייקון Phone (`tel:+972545503055`), אייקון Mail (`mailto:citymarketlv@gmail.com`), אייקון Menu/X
3. תפריט פתוח: `fixed inset-0` full-screen overlay כהה עם כל הפריטים במרכז בפונט גדול
4. בתחתית: שורת קשר (email + טלפונים)
5. הצבע משתנה לפי scroll (לבן על וידאו, כהה על רקע לבן) — כמו היום

**`src/components/he/Header.tsx`:**
אותו שינוי בדיוק — אייקוני טלפון/מייל/המבורגר, full-screen overlay כהה עם פריטים RTL.

**2 קבצים, ~80 שורות שינוי בכל אחד.**

