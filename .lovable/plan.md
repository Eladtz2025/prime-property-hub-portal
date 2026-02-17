
# תיקון סריקת יד2 - שינוי X-Wait-For-Selector

## הבעיה

בקוד הנוכחי (`scraping-jina.ts` שורה 44), `X-Wait-For-Selector` מוגדר ל-`body` לכל המקורות. הבלוק הספציפי ליד2 (שורות 51-53) משנה רק את `X-Timeout` אבל **לא משנה את הסלקטור**. 

`body` קיים מיד ב-HTML הראשוני של יד2 (לפני שה-JavaScript טוען את המודעות), אז Jina מחזיר את ה-shell הריק (~304 תווים) ולא מחכה לתוכן.

## הפתרון

שינוי אחד בלבד בקובץ `supabase/functions/_shared/scraping-jina.ts`:

בתוך הבלוק `if (isYad2)` (שורות 51-53), להוסיף שורה שמשנה את `X-Wait-For-Selector` ל-`a[href*="/realestate/item/"]`.

סלקטור זה תופס את הלינקים של המודעות עצמן (כמו `yad2.co.il/realestate/item/tel-aviv-area/9risihcd`), שמופיעים **רק** אחרי שה-React SPA סיים לרנדר את הפיד. כך Jina יחכה עד שהמודעות באמת נטענות לפני שהוא מחזיר את התוכן.

בנוסף, נעלה את `X-Timeout` ל-`30` (במקום `20`) כדי לתת ליד2 מספיק זמן להטען.

### שינוי טכני

```typescript
// שורות 51-53 -- מ:
if (isYad2) {
  headers['X-Timeout'] = '20';
}

// ל:
if (isYad2) {
  headers['X-Timeout'] = '30';
  headers['X-Wait-For-Selector'] = 'a[href*="/realestate/item/"]';
}
```

### קבצים שישתנו
- `supabase/functions/_shared/scraping-jina.ts` -- הוספת סלקטור ספציפי ליד2

### למה `a[href*="/realestate/item/"]`?

מה-debug sample המוצלח (ינואר) ניתן לראות שכל מודעה מכילה לינק בפורמט:
```
https://www.yad2.co.il/realestate/item/tel-aviv-area/9risihcd
```
אלמנטים אלו קיימים רק אחרי שהפיד נטען. זה סלקטור יציב שלא תלוי בשמות class שעלולים להשתנות.
