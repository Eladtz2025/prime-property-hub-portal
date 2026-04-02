

## תיקון 3 באגים בפוסט פייסבוק

### הבעיות שרואים בצילומי מסך

**1. הפס האפור (Link Card) נעלם** — בתמונה 806 (אחרי) הפוסט עלה כ-Photo Post (4 תמונות) בלי Link Card. ב-Facebook API אי אפשר לשלב גם תמונות מרובות וגם Link Card — הם סוגים שונים. **הפתרון:** כשנבחר מצב "תמונות", נוסיף את ה-URL של הנכס כשורה אחרונה בטקסט הפוסט, כך שפייסבוק לפחות יציג קישור לחיץ.

**2. עיר מופיעה פעמיים** — כש-`neighborhood` ריק, הטקסט מציג:
```
🏠 דירה למכירה ב, תל אביב-יפו     ← "ב," בלי כלום
📍 תל אביב-יפו                      ← עיר שוב
```
**תיקון:** כש-neighborhood ריק, הצג רק `🏠 דירה למכירה בתל אביב-יפו` בלי שורת 📍 נפרדת.

**3. Hashtags לא מפוענחים** — `#{neighborhood} #{city}` מופיע כטקסט גולמי כי `applyTemplate` מחליף placeholders רק ב-`contentText` אבל לא ב-`hashtags`. וגם `handleSelectProperty` לא מחליף placeholders ב-hashtags של תבנית שנבחרה.

### שינויים

| # | קובץ | שינוי |
|---|-------|--------|
| 1 | `AutoPublishManager.tsx` — `fillPropertyPlaceholders` | הוסף פרמטר שני אופציונלי לפענוח hashtags גם (אותם replacements) |
| 2 | `AutoPublishManager.tsx` — `applyTemplate` | אחרי set hashtags, אם יש נכס נבחר — פענח placeholders גם ב-hashtags |
| 3 | `AutoPublishManager.tsx` — `handleSelectProperty` | כש-neighborhood ריק, אל תוסיף שורת 📍 נפרדת (כבר מוזכר בשורה הראשונה) |
| 4 | `AutoPublishManager.tsx` — `executeSave` | במצב photos עם נכס, הוסף URL של הנכס בסוף ה-`content_text` |

**קובץ אחד בלבד. אפס שינויים ב-edge function.**

### לוגיקה מרכזית

```typescript
// תיקון hashtags — פענוח placeholders
const fillHashtagPlaceholders = (tags: string, prop: any): string => {
  return tags
    .replace(/{neighborhood}/g, prop.neighborhood?.replace(/[-\s]/g, '_') || '')
    .replace(/{city}/g, prop.city?.replace(/[-\s]/g, '_') || '')
    .replace(/{property_type}/g, prop.property_type === 'sale' ? 'למכירה' : 'להשכרה')
    .replace(/#{2,}/g, '#')  // clean up empty ##
    .replace(/#\s/g, '')     // clean up empty #
    .trim();
};

// תיקון כפילות עיר — default text
const neighborhood = prop.neighborhood;
const locationLine = neighborhood 
  ? `📍 ${neighborhood}, ${prop.city}` 
  : '';  // לא מציגים שורה נפרדת כשאין שכונה

// photos mode — הוסף URL לטקסט
if (isPhotosMode && propertyUrl) {
  contentText += `\n\n🔗 ${propertyUrl}`;
}
```

