

# תיקון זיהוי תיווך במדלן - שינוי גישה מהיסוד

## הבעיה המרכזית

ה-parser של מדלן **לא מזהה נכון** אם מודעה היא פרטית או תיווך עבור **בלוקים קומפקטיים (Format B)**.

### הסיבה הטכנית

במדלן יש **שני פורמטים** בדף הרשימה:

| פורמט | מאפיינים | זיהוי תיווך |
|-------|-----------|-------------|
| **Format A** | בלוק מפורד + תמונת משרד נפרדת | יש `תיווך` בסוף הבלוק |
| **Format B** | בלוק קומפקטי עם `\\` | **אין** אינדיקציה בכלל! |

**המידע על תיווך קיים רק בדף הפרטי של המודעה** - לא בדף הרשימה שה-parser סורק.

### דוגמאות מהנתונים

| נכס | פורמט ברשימה | `is_private` | האמת (מדף פרטי) |
|-----|--------------|--------------|-----------------|
| בן יהודה 214 | Format B | `true` (טעות!) | **תיווך** - `מתיווך` + רישיון |
| פנקס 55 | Format B | `true` (טעות!) | **תיווך** - `מתיווך` |
| בודנהימר | Format B | `true` (טעות!) | **תיווך** - `מתיווך` |
| דיזנגוף 271 | Format B | `true` (טעות!) | **תיווך** - רישיון 30533218 |

---

## הפתרון המוצע - הפיכת ברירת המחדל

**עיקרון: במדלן, רוב המודעות הן תיווך. נהפוך את הלוגיקה:**

- ברירת מחדל = **תיווך** (`is_private: false`)
- סימון כפרטי רק אם יש **הוכחה מפורשת** לפרטי

### אינדיקטורים לזיהוי פרטי (הפוכה מהלוגיקה הנוכחית)

1. **טקסט מפורש**: `"ללא תיווך"`, `"לא למתווכים"`, `"ללא מתווכים"`
2. **העדר תג**: מודעה ב-Format A ש**אין** בה את המילה `תיווך` בסוף

### זיהוי תיווך (לחיזוק ודאות)

1. **תג `תיווך`** בסוף בלוק Format A
2. **תמונת משרד** (קישור ל-`agentsOffice`)
3. **מספר רישיון** (7-8 ספרות)
4. **מילה `מתיווך`** (לתיקון עתידי אם נכנס לדפים פרטיים)

---

## שינויים טכניים

### קובץ: `supabase/functions/_experimental/parser-madlan.ts`

#### 1. הפיכת ברירת המחדל

```typescript
// לפני (שורות 455-457):
const isBroker = hasTivuchLabel || hasLicenseNumber || hasExclusivity || hasBrokerBrand;
...
is_private: !isBroker

// אחרי:
// Check for PRIVATE indicators (must be explicit)
const isExplicitlyPrivate = 
  /ללא\s*(ה)?תיווך|לא\s*למתווכים|ללא\s*מתווכים/i.test(block);

// Check if this is Format A (fragmented block with separate lines)
// Format A has the "תיווך" label explicitly when it's a broker
const isFormatA = !block.includes('\\\\');

// For Format A: if no "תיווך" label AND no broker indicators = private
// For Format B (compact): default to broker (we can't tell from listing page)
let isPrivate = false;

if (isExplicitlyPrivate) {
  // Explicit "no broker" text = definitely private
  isPrivate = true;
} else if (isFormatA && !hasTivuchLabel && !hasLicenseNumber && 
           !hasExclusivity && !hasBrokerBrand) {
  // Format A without broker indicators = private
  isPrivate = true;
}
// Format B (compact blocks) = default to broker (is_private: false)
```

#### 2. עדכון מספר רישיון ל-7-8 ספרות

```typescript
// לפני:
const hasLicenseNumber = /\d{7}/.test(block);

// אחרי:
const hasLicenseNumber = /\d{7,8}/.test(block);
```

#### 3. הוספת זיהוי תמונת משרד

```typescript
// הוספה:
const hasAgentOfficeLink = block.includes('agentsOffice') || 
                            block.includes('/agents/');
```

---

## סיכום שינויים

| מה | לפני | אחרי |
|----|------|------|
| **ברירת מחדל Format B** | פרטי | **תיווך** |
| **ברירת מחדל Format A** | פרטי | פרטי (אם אין אינדיקטורים) |
| **מספר רישיון** | 7 ספרות | 7-8 ספרות |
| **זיהוי פרטי** | העדר אינדיקטורים | טקסט מפורש בלבד |

### השפעה צפויה

- **Format B (קומפקטי)**: כל המודעות יסומנו כתיווך
- **Format A (מפורד)**: רק מודעות עם `תיווך` בסוף או תמונת משרד יסומנו כתיווך
- **דיוק צפוי**: ~95% (כי רוב מודעות מדלן הן אכן תיווך)

### פעולות נוספות לאחר התיקון

1. **עדכון נכסים קיימים**: הרצת שאילתת UPDATE לתיקון הנכסים השגויים שכבר ב-DB
2. **Deploy**: פריסה מחדש של `scout-madlan`

