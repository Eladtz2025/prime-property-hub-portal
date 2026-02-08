

# תיקון כפתור "צפה" במובייל -- התנהגות זהה לדסקטופ

## הבעיה

כפתור "צפה" במובייל (MobileMatchesSheet) לא מתנהג כמו בדסקטופ (PropertyMatchCard):

| סוג נכס | דסקטופ (נכון) | מובייל (שגוי) |
|---|---|---|
| **נסרק (Scout)** | פותח את ה-source_url -- האתר המקורי (Yad2, Homeless וכו') | פותח דף פנימי באפליקציה |
| **שלנו (Own)** | פותח `/admin-dashboard?property=ID` | פותח `/properties/ID` (לא קיים -- "דף בבנייה") |

## מה צריך לתקן

### 1. הוספת `source_url` לממשק CustomerMatch במובייל

ב-`MobileMatchesSheet.tsx`, ה-interface של `CustomerMatch` חסר את השדה `source_url`. הנתון כבר קיים בהוק (`useCustomerMatches.ts` מחזיר `source_url`), אבל ה-interface במובייל לא כולל אותו.

**קובץ: `src/components/MobileMatchesSheet.tsx`**

הוספת `source_url` ל-interface:

```text
interface CustomerMatch {
  id: string;
  title: string | null;
  city: string | null;
  price: number | null;
  rooms: number | null;
  size: number | null;
  matchScore: number;
  source_url: string;   // <-- חדש
}
```

### 2. תיקון פונקציית handleViewProperty

שינוי הפונקציה כך שתתנהג בדיוק כמו בדסקטופ:

- **נכסים נסרקים**: פתיחת `source_url` (האתר המקורי)
- **נכסים שלנו**: פתיחת `/admin-dashboard?property=ID`

הפונקציה תקבל גם `sourceUrl` כפרמטר:

```text
לפני:
  handleViewProperty(propertyId, isOwn: boolean)

אחרי:
  handleViewProperty(propertyId, isOwn: boolean, sourceUrl?: string)
```

לוגיקה חדשה:

```text
if (isOwn) {
  window.open(`/admin-dashboard?property=${propertyId}`, '_blank');
} else if (sourceUrl) {
  window.open(sourceUrl, '_blank');
}
```

### 3. עדכון הקריאות לפונקציה

- **נכסים שלנו** (בטאב "נכסים שלנו"): `handleViewProperty(property.id, true)` -- ללא שינוי בקריאה, אבל הנתיב בפנים ישתנה ל-`/admin-dashboard?property=ID`
- **נכסים נסרקים** (בטאב "נסרקים"): `handleViewProperty(match.id, false, match.source_url)` -- הוספת `match.source_url`

## סיכום

שינוי בקובץ אחד בלבד: `src/components/MobileMatchesSheet.tsx`

1. הוספת `source_url: string` ל-interface של `CustomerMatch`
2. שינוי `handleViewProperty` לפתוח source_url לנסרקים ו-`/admin-dashboard?property=ID` לשלנו
3. העברת `match.source_url` בקריאה מהטאב של נכסים נסרקים

