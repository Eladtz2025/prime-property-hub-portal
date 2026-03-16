

## תיקון 6 ממצאי QA במערכת סריקות 2 (ללא #2)

### תיקון 1: mode שגוי ליד2 בתגובת trigger
**קובץ:** `supabase/functions/trigger-scout-pages-jina/index.ts` שורה 150

שינוי:
```typescript
mode: (source === 'madlan' || source === 'yad2') ? 'sequential' : 'parallel'
```

---

### תיקון 3: כפילות קוד — ריפקטור scrape functions
**הערה:** זהו שינוי גדול יחסית. הקובץ `_shared/scraping-jina.ts` כבר קיים עם `scrapeWithJina`. במקום ריפקטור מלא עכשיו (שעלול לשבור דברים), אדחה את זה לשלב מאוחר יותר ואתמקד בתיקונים הפשוטים והבטוחים.

---

### תיקון 4: isPastEndTime עם UTC+2 קבוע → timezone דינמי
**קובץ:** `supabase/functions/_shared/settings.ts` שורות 230-257

החלפת הלוגיקה הקבועה ב:
```typescript
export function isPastEndTime(endTimeIL: string): boolean {
  if (!endTimeIL) return false;
  const [endH, endM] = endTimeIL.split(':').map(Number);
  if (isNaN(endH) || isNaN(endM)) return false;
  
  const now = new Date();
  const israelTimeStr = now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' });
  const israelNow = new Date(israelTimeStr);
  const israelHour = israelNow.getHours();
  const israelMinute = israelNow.getMinutes();
  
  const currentMinutes = israelHour * 60 + israelMinute;
  const endMinutes = endH * 60 + endM;
  return currentMinutes >= endMinutes;
}
```

---

### תיקון 5: retry_count — ללא שינוי
הלוגיקה עובדת. שינוי כאן מסוכן ולא שווה את הסיכון.

---

### תיקון 6: Debug sample בהומלס נשמר לפני validation
**קובץ:** `supabase/functions/scout-homeless-jina/index.ts` שורות 120-131

להזיז את שמירת ה-debug sample **אחרי** ה-validation (ואחרי הפרסור), ולעדכן `properties_found` בפועל — כמו שנעשה ביד2:
```typescript
const validation = validateScrapedContent(markdown, html, 'homeless');
if (!validation.valid) { ... return; }

// Parse first, then save debug with actual count
const parseResult = await parseHomelessHtml(...);
const extractedProperties = parseResult.properties;

await supabase.from('debug_scrape_samples').upsert({
  source: 'homeless', url, html: html.substring(0, 50000),
  markdown: markdown.substring(0, 10000), properties_found: extractedProperties.length,
}, { onConflict: 'source' });
```

---

### תיקון 7: kill switch בסורקים — ללא שינוי
Edge case נדיר, לא שווה הוספת קריאת DB נוספת בכל הפעלה.

---

### סיכום — 3 שינויים בפועל

| # | קובץ | שינוי |
|---|-------|-------|
| 1 | `trigger-scout-pages-jina/index.ts` | תיקון mode ליד2 |
| 4 | `_shared/settings.ts` | timezone דינמי |
| 6 | `scout-homeless-jina/index.ts` | הזזת debug sample אחרי validation |

שלושתם שינויים קטנים ובטוחים, ללא סיכון לשבירת פונקציונליות.

