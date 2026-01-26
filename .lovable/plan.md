
# תיקון הפרסרים - Homeless + Madlan

## סיכום הבעיות שמצאתי

### 1. Homeless - חסרים price/rooms/size
מהנתונים:
```
homeless: price=null, rooms=null, size=null (ברוב הנכסים)
```

**הסיבה:** הפרסר קורא את העמודות הלא נכונות מטבלת ה-HTML:
```typescript
// שורות 54-57 - העמודות לא מתאימות
const priceText = cleanText($(tds[8]).text());  // אולי זה לא עמודה 8
```

### 2. Madlan - חסרות שכונות
מהנתונים:
```
madlan: neighborhood=null (ברוב הנכסים)
```

**הסיבה:** הפרסר מחפש שכונה רק בשורה שמתחילה עם "דירה," אבל הפורמט במדלן הוא:
```
דירה, דיזנגוף 85, הצפון הישן החלק הדרום מזרחי
```
והפרסר לא מוצא את זה נכון.

### 3. Madlan - פרויקטים נכנסים
פרויקטים חדשים (מקבלן) נכנסים לתוצאות:
```
source_url: madlan.co.il/projects/...
```

---

## שינויים נדרשים

### קובץ 1: `parser-homeless.ts` - תיקון מיפוי עמודות

הבעיה: ה-HTML של Homeless משתנה בין סוגי מודעות. צריך לזהות נכון את העמודות.

```typescript
// שורות 50-57 - תיקון מיפוי עמודות
// הבדיקה האמיתית: Homeless יש 2 פורמטים שונים של טבלאות:
// 1. טבלת דירות רגילה: 10 עמודות
// 2. טבלת תיווך: פורמט אחר

// פתרון: לחלץ נתונים לפי תוכן ולא לפי מיקום
function extractFromRow($row: any, $: any): { price: number | null; rooms: number | null; ... } {
  const allText = $row.text();
  
  // מחיר - חפש ₪ או מספר גדול
  const price = extractPrice(allText);
  
  // חדרים - חפש X חדרים
  const rooms = extractRooms(allText);
  
  // גודל - חפש X מ"ר
  const size = extractSize(allText);
  
  return { price, rooms, size };
}
```

### קובץ 2: `parser-madlan.ts` - שיפור חילוץ שכונות

**בעיה 1:** הפרסר מחפש שכונה רק אם השורה מתחילה ב-"דירה" אבל לפעמים הפורמט שונה.

**פתרון:** לחפש שכונה בכל הטקסט של הבלוק:

```typescript
// שורות 199-223 - שיפור חילוץ שכונות
// במקום לחפש רק בשורה ספציפית, לחפש בכל הבלוק
function extractNeighborhoodFromBlock(block: string): { label: string; value: string } | null {
  // רשימת שכונות ידועות
  const neighborhoods = [
    { pattern: /צפון\s*(?:ה)?ישן|הצפון\s*הישן/i, value: 'צפון_ישן', label: 'צפון ישן' },
    { pattern: /צפון\s*(?:ה)?חדש|הצפון\s*החדש/i, value: 'צפון_חדש', label: 'צפון חדש' },
    { pattern: /נמל\s*תל\s*אביב|יורדי\s*הסירה/i, value: 'נמל_תל_אביב', label: 'נמל תל אביב' },
    // ... שאר השכונות
  ];
  
  for (const { pattern, value, label } of neighborhoods) {
    if (pattern.test(block)) {
      return { value, label };
    }
  }
  
  return null;
}
```

**בעיה 2:** פרויקטים נכנסים לתוצאות.

**פתרון:** לסנן פרויקטים החוצה (או לסמן אותם):

```typescript
// שורה 236-238 - סינון פרויקטים
const isProject = block.includes('/projects/') || block.includes('פרויקט');
if (isProject) {
  return null;  // לא להכניס פרויקטים לתוצאות
}
```

---

## סיכום השינויים

| קובץ | שינוי | השפעה |
|------|-------|-------|
| `parser-homeless.ts` | חילוץ נתונים מהטקסט הכללי | price/rooms/size יעבדו |
| `parser-madlan.ts` | חיפוש שכונות בכל הבלוק | שכונות יחולצו נכון |
| `parser-madlan.ts` | סינון פרויקטים | רק דירות יד שנייה |

---

## שלבי ביצוע

1. **תיקון Homeless** - שינוי לוגיקת חילוץ מעמודות לטקסט
2. **תיקון Madlan שכונות** - חיפוש שכונות בכל הבלוק
3. **סינון פרויקטים** - הוצאת פרויקטים מהתוצאות
4. **Deploy + בדיקה** - ריצה חוזרת על רוני לוודא שהתיקונים עובדים
