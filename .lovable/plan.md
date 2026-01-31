
# איפוס סיווג פרטי/תיווך והפעלת backfill מחדש

## מצב נוכחי - 3 בעיות

| בעיה | מקור | תיאור |
|------|------|-------|
| 1 | **מדלן** | כל 1,871 הנכסים = תיווך (בגלל UPDATE גורף שגוי) |
| 2 | **יד2** | כל 4,707 הנכסים = תיווך (בגלל regex ישן שתפס טלפונים) |
| 3 | **Backfill** | הפונקציה `detectBrokerFromMarkdown` עדיין משתמשת ב-`/\d{7}/` הישן |

**הבעיה העיקרית**: אין לי דרך לדעת מה הערך **האמיתי** כי כבר דרסנו אותו.

---

## הפתרון המוצע

### שלב 1: איפוס is_private ל-NULL

```sql
UPDATE scouted_properties
SET is_private = NULL
WHERE is_active = true;
```

**תוצאה**: כל הנכסים יחזרו ללא סיווג - הבאדג'ים יעלמו מה-UI.

### שלב 2: עדכון הלוגיקה ב-backfill

**קובץ: `supabase/functions/backfill-property-data/index.ts`**

שורות 789-813 - עדכון הפונקציה `detectBrokerFromMarkdown`:

```typescript
function detectBrokerFromMarkdown(markdown: string, source: string): boolean | null {
  if (!markdown) return null;
  
  const textLower = markdown.toLowerCase();
  
  // === Source-specific logic ===
  
  // MADLAN: Check individual property page for broker info
  if (source === 'madlan') {
    // Look for "מתיווך" (from broker) - appears on property page
    const hasMativauch = /מתיווך/.test(markdown);
    // Look for license number with context
    const hasLicenseWithContext = /(?:רישיון|ר\.?ת\.?|תיווך)\s*:?\s*\d{7,8}/.test(markdown);
    const hasAgencyName = /שם הסוכנות/.test(markdown);
    
    if (hasMativauch || hasLicenseWithContext || hasAgencyName) {
      return false; // Broker
    }
    
    // Check for explicit private indicators
    const isExplicitlyPrivate = /ללא\s*(ה)?תיווך|לא\s*למתווכים|ללא\s*מתווכים/i.test(markdown);
    if (isExplicitlyPrivate) {
      return true; // Private
    }
    
    return null; // Can't determine from markdown
  }
  
  // YAD2: Check for תיווך label
  if (source === 'yad2') {
    // Look for תיווך: with license number
    const hasTivuchWithLicense = /תיווך:?\s*\d{7}/.test(markdown);
    const hasExplicitLicense = /(?:רישיון|ר\.?ת\.?)\s*:?\s*\d{7}/.test(markdown);
    const hasExclusivity = /בבלעדיות/.test(markdown);
    
    if (hasTivuchWithLicense || hasExplicitLicense || hasExclusivity) {
      return false; // Broker
    }
    return true; // Default to private for Yad2
  }
  
  // HOMELESS: Check for agency name
  if (source === 'homeless') {
    const hasAgencyName = /שם הסוכנות/.test(markdown);
    const hasAgentName = /שם הסוכן/.test(markdown);
    
    if (hasAgencyName || hasAgentName) {
      return false; // Broker
    }
    return true; // Default to private for Homeless
  }
  
  // Fallback: check for generic broker indicators
  const BROKER_BRANDS = ['רימקס', 're/max', 'remax', 'אנגלו סכסון', 'century 21', 'קולדוול'];
  const hasBrokerBrand = BROKER_BRANDS.some(brand => textLower.includes(brand.toLowerCase()));
  
  if (hasBrokerBrand) {
    return false; // Broker
  }
  
  return null; // Can't determine
}
```

**שינוי מרכזי**:
- **אין ברירת מחדל גורפת** - אם לא מוצאים אינדיקציה ברורה, מחזירים `null`
- **לוגיקה ספציפית לכל מקור**
- **Regex מתוקן** - לא תופס טלפונים

### שלב 3: הפעלת backfill אחרי השינויים

לאחר ה-deploy, כפתור "השלמת נתונים" יעבור על **כל** הנכסים עם `is_private = NULL` ויסווג אותם מחדש לפי המידע מהדף הפרטי.

---

## סיכום השינויים

| # | פעולה | קובץ/מקום |
|---|-------|-----------|
| 1 | איפוס `is_private` ל-NULL | מיגרציה - DB |
| 2 | עדכון `detectBrokerFromMarkdown` | backfill-property-data/index.ts |
| 3 | הסרת ברירת מחדל "תיווך" ממדלן | שינוי הלוגיקה בפונקציה |

---

## מה קורה עם נכסים חדשים?

### לאחר התיקון:

| מקור | לוגיקה | ברירת מחדל |
|------|--------|-------------|
| **Yad2** | מחפש `תיווך:` + רישיון, `בבלעדיות`, מותגים | פרטי (אם אין אינדיקטורים) |
| **Madlan** | מחפש `מתיווך`, רישיון עם הקשר, `שם הסוכנות` | `null` (יתמלא ב-backfill) |
| **Homeless** | מחפש `שם הסוכנות`, `שם הסוכן` | פרטי (אם אין אינדיקטורים) |

**הערה**: נכסי מדלן חדשים יגיעו עם `is_private = null` מהסריקה, וה-backfill האוטומטי יסווג אותם נכון לפי הדף הפרטי.

---

## בדיקה לאחר התיקון

אחרי שמאשר את התוכנית, אבצע:

1. **בדיקת edge function** - `curl` לסריקה של Yad2 ובדיקת הלוגים
2. **בדיקת DB** - שאילתה לוידוא ש-`is_private` הוא `NULL` לכולם
3. **הרצת backfill** - בדיקה שהפונקציה מסווגת נכון
