

# תיקון זיהוי פרטי/תיווך ב-Yad2 + Homeless + עדכון DB

## ממצאים מדויקים

### מצב נוכחי

| מקור | פרטי | תיווך | % תיווך | סטטוס |
|------|------|-------|---------|-------|
| **Yad2** | 3 | 4,707 | 99.9% | 🚨 **בעיה** |
| **Madlan** | 30 | 1,841 | 98.4% | ✅ תקין |
| **Homeless** | 1,198 | 0 | 0% | 🟡 **מוגבל** |

---

## בעיה 1: Yad2 - 99.9% תיווך לא הגיוני

### הסיבה
הרגקס `/\d{7}/` (7 ספרות רצופות) תופס **מספרי טלפון ישראליים**:
- טלפון: `050-1234567` = מכיל 7 ספרות רצופות → נחשב תיווך
- ID של מודעה: `9zk14s21` = לא 7 ספרות → לא נתפס

### הפתרון
שינוי זיהוי מספר רישיון:
- רישיון תיווך אמיתי = 7 ספרות בלבד, לא חלק ממספר גדול יותר
- צריך להוסיף word boundary או לחפש דפוס ספציפי יותר

```typescript
// לפני (שורה 254):
const hasLicenseNumber = /\d{7}/.test(block);

// אחרי - מחפש 7 ספרות בדיוק, לא כחלק ממספר גדול יותר
// מספר רישיון תיווך = 7 ספרות בדיוק (לא 10 ספרות של טלפון)
const hasLicenseNumber = /(?<!\d)\d{7}(?!\d)/.test(block);
```

**אבל זה לא מספיק** - כי טלפון נייד הוא 10 ספרות (05X-XXXXXXX) והרגקס עדיין יתפוס את 7 הספרות האחרונות.

### פתרון משופר
נבדוק רק אם יש מילת "רישיון" או "ר.ת." ליד המספר:

```typescript
// מספר רישיון תיווך - רק אם מופיע עם מילת מפתח
const hasLicenseNumber = /(?:רישיון|ר\.?ת\.?|מתווך|license)\s*:?\s*\d{7}/.test(block);
```

---

## בעיה 2: Homeless - 100% פרטי

### הסיבה
**אין מידע על תיווך/פרטי בטבלה של Homeless** - המידע הזה לא קיים ב-HTML של דף הרשימה.

### ההחלטה
זה לא באג - זו מגבלה של המקור. Homeless נחשב ברובו לפרטיים (זה המוניטין שלו).

**לא נשנה** - נשאיר את ה-default כפרטי עבור Homeless.

---

## עדכון נכסים קיימים ב-DB

### 1. תיקון Madlan (שגויים לפני ה-deploy של היום)
```sql
UPDATE scouted_properties
SET is_private = false
WHERE source = 'madlan'
  AND is_private = true
  AND is_active = true
  AND created_at < '2026-01-31 12:37:00+00';
```

### 2. לא לעדכן Yad2 עכשיו
צריך קודם לתקן את הלוגיקה ואז להחליט אם צריך עדכון.

---

## סיכום שינויים

| קובץ | שינוי |
|------|-------|
| `parser-yad2.ts` | תיקון regex לזיהוי רישיון (לא לתפוס טלפונים) |
| DB | עדכון Madlan properties שסומנו שגוי לפני התיקון |

---

## פרטים טכניים

### קובץ: parser-yad2.ts

שורות 250-266 - שינוי זיהוי תיווך:

```typescript
// לפני:
// Check for 7-digit license number (Israeli broker license)
const hasLicenseNumber = /\d{7}/.test(block);

// אחרי:
// Check for explicit "תיווך:" label with license number
// Don't use plain \d{7} as it catches phone numbers
const hasTivuchWithLicense = /תיווך:?\s*\d{7}/.test(block);
const hasExplicitLicense = /(?:רישיון|ר\.?ת\.?)\s*:?\s*\d{7}/.test(block);
const hasLicenseNumber = hasTivuchWithLicense || hasExplicitLicense;
```

### שאילתת עדכון DB

```sql
-- Fix Madlan properties incorrectly marked as private before today's fix
UPDATE scouted_properties
SET is_private = false
WHERE source = 'madlan'
  AND is_private = true
  AND is_active = true;
```

