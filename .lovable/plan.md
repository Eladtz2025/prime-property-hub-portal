
# תוכנית תיקון Personal Scout

## סיכום הבעיות שזוהו

### בעיות קריטיות
1. **Cron Job חסר** - הריצה האוטומטית ב-01:00 לא מותקנת

### בעיות בינוניות
2. **Homeless Parser** - לא מחלץ חדרים (0%) ומחיר חלש (24%)
3. **Madlan Neighborhood** - רק 34% הצלחה בזיהוי שכונות

### בעיות נמוכות
4. **נתוני ליד שגויים** - budget_min > budget_max (Rakefet: min=10000, max=1300)

---

## שלב 1: התקנת Cron Job

יש להריץ את ה-SQL הבא ב-Supabase SQL Editor:

```sql
SELECT cron.schedule(
  'personal-scout-daily',
  '0 23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jswumsdymlooeobrxict.supabase.co/functions/v1/personal-scout-trigger',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3Vtc2R5bWxvb2VvYnJ4aWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTIyNDQsImV4cCI6MjA3MjMyODI0NH0.EyxwF2qYl0u3BaVApI8wFaVYeLYJec-2vFcGeYPe9mM'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

---

## שלב 2: תיקון Homeless Parser

### בעיה בזיהוי חדרים
הקוד מחפש regex `/^(\d+(?:[.,]\d)?)$/` שדורש מספר בודד בתא. בפועל, התא כנראה מכיל טקסט נוסף.

### פתרון
שינוי ב-`parser-homeless.ts` שורות 79-86:

```typescript
// לפני:
const roomsMatch = roomsCell.match(/^(\d+(?:[.,]\d)?)$/);

// אחרי:
const roomsMatch = roomsCell.match(/(\d+(?:[.,]\d)?)/);
```

### בעיה בזיהוי מחיר
הקוד מסתמך על עמודה 8, אבל אולי המבנה שונה.

### פתרון
שיפור ה-fallback בשורות 120-121:

```typescript
if (!rooms) {
  // נסה למצוא מספר בין 1-20 בכל הטקסט
  const roomsFallback = fullRowText.match(/(\d+(?:\.\d)?)\s*(?:חדרים|חד)/);
  if (roomsFallback) {
    const num = parseFloat(roomsFallback[1]);
    if (num >= 1 && num <= 20) rooms = num;
  }
}
```

---

## שלב 3: הרחבת קודי שכונות Madlan

### המצב הנוכחי
הפרסר של Madlan מזהה רק 45/133 (34%) שכונות.

### פתרון
הוספת שכונות חסרות ל-`parser-madlan.ts` (KNOWN_NEIGHBORHOODS):

```typescript
// שכונות נוספות להוספה
{ pattern: /רמת\s*החייל/i, value: 'רמת_החייל', label: 'רמת החייל' },
{ pattern: /נווה\s*עופר/i, value: 'נווה_עופר', label: 'נווה עופר' },
{ pattern: /לב\s*תל\s*אביב/i, value: 'לב_תל_אביב', label: 'לב תל אביב' },
{ pattern: /גני\s*שרונה|שרונה/i, value: 'שרונה', label: 'שרונה' },
{ pattern: /נחלת\s*בנימין/i, value: 'נחלת_בנימין', label: 'נחלת בנימין' },
{ pattern: /קרית\s*אליעזר/i, value: 'קרית_אליעזר', label: 'קרית אליעזר' },
{ pattern: /גן\s*העיר/i, value: 'גן_העיר', label: 'גן העיר' },
```

---

## שלב 4: תיקון נתוני ליד שגויים

יש להריץ SQL לתיקון הליד עם budget הפוך:

```sql
UPDATE contact_leads 
SET budget_min = 1300, budget_max = 10000
WHERE id = '4d78feaf-3c8f-4816-bf02-6abb2fd495f5';
```

---

## שלב 5: הוספת neighborhood codes ל-Yad2

הקובץ `neighborhood-codes.ts` חסר כמה שכונות שהלידים מחפשים:

```typescript
// שכונות חסרות להוספה
'רוטשילד': '205', // או קוד אחר - צריך לבדוק
'נמל_תל_אביב': '1519',
'נמל תל אביב': '1519',
```

---

## סדר ביצוע מומלץ

| עדיפות | משימה | זמן משוער |
|--------|--------|-----------|
| 1 | התקנת Cron (SQL) | 1 דקה |
| 2 | תיקון Homeless rooms/price | 10 דקות |
| 3 | הרחבת Madlan neighborhoods | 5 דקות |
| 4 | הוספת Yad2 neighborhood codes | 5 דקות |
| 5 | תיקון נתוני ליד | 1 דקה |

---

## תוצאה צפויה אחרי התיקונים

| מקור | מחיר | חדרים | שכונה |
|------|------|-------|-------|
| Yad2 | 100% | 92% | **95%+** |
| Madlan | **70%+** | 78% | **60%+** |
| Homeless | **50%+** | **50%+** | 72% |

---

## קבצים לעדכון

| קובץ | פעולה |
|------|-------|
| `supabase/functions/_personal-scout/parser-homeless.ts` | תיקון rooms + price |
| `supabase/functions/_personal-scout/parser-madlan.ts` | הרחבת neighborhoods |
| `supabase/functions/_personal-scout/neighborhood-codes.ts` | הוספת קודים חסרים |
