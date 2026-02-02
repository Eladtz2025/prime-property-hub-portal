
## תוכנית תיקון - בעיות התאמות שגויות

### בעיות שזוהו בבדיקה מקיפה

| בעיה | היקף | דוגמה |
|------|------|-------|
| **1. התאמת שכונות רפויה מדי** | 51+ לקוחות מושפעים | "כיכר המדינה" מותאם ל-"צפון_חדש" כי alias מכיל substring |
| **2. שם ברוקר בשדה כתובת** | 63 נכסים | `LEAD שיווק נדל"ן`, `גולדין נכסים` בשדה address |
| **3. is_private שגוי** | 3 נכסים עם ברוקר בכתובת סומנו כפרטי | `אבן שהם נכסים` → is_private=true |
| **4. נכסים ללא שכונה עם התאמות** | 2 התאמות לזיו | נכסים עם neighborhood=null שהותאמו לפי רחוב |

---

### פירוט בעיה #1: לוגיקת Substring רפויה מדי

**הקוד הנוכחי (locations.ts:382-384):**
```typescript
if (normalizedProperty.includes(normalizedAlias) ||
    normalizedAlias.includes(normalizedProperty)) {
  return true;
}
```

**הבעיה:**
- ליד בחר: `צפון_חדש`
- Config של צפון_חדש כולל alias: `"הצפון החדש - כיכר המדינה"`
- נכס עם neighborhood: `"כיכר המדינה"`
- הבדיקה: `"הצפון החדש - כיכר המדינה".includes("כיכר המדינה")` = **TRUE** ← שגוי!

**תוצאה:** 51 התאמות שגויות של "כיכר המדינה" ללקוחות שביקשו רק "צפון_חדש"

---

### פתרון מוצע

#### תיקון 1: שינוי לוגיקת התאמת שכונות (locations.ts)

במקום `includes` דו-כיווני, לבדוק:
1. **התאמה מדויקת** (לאחר נורמליזציה)
2. **Prefix match** - הנכס מתחיל עם ה-alias (לא הפוך!)
3. **הסרת alias בעייתי** מ-צפון_חדש config

**קובץ:** `supabase/functions/_shared/locations.ts`

**שינוי בפונקציה `matchNeighborhood` (שורות 380-386):**

```typescript
// לפני - רופף מדי
if (normalizedProperty.includes(normalizedAlias) ||
    normalizedAlias.includes(normalizedProperty)) {
  return true;
}

// אחרי - יותר מחמיר
// התאמה מדויקת או נכס מתחיל עם ה-alias
if (normalizedProperty === normalizedAlias ||
    normalizedProperty.startsWith(normalizedAlias + ' ') ||
    normalizedProperty.startsWith(normalizedAlias + ',') ||
    normalizedAlias.startsWith(normalizedProperty + ' ') ||
    normalizedAlias.startsWith(normalizedProperty + ',') ||
    // Property is a specific sub-area of the alias
    normalizedProperty.startsWith(normalizedAlias)) {
  return true;
}
```

**וגם שינוי בבדיקת label (שורות 374-377):**
```typescript
// לפני
if (normalizedProperty.includes(normalizedLabel) || normalizedLabel.includes(normalizedProperty)) {
  return true;
}

// אחרי - יותר מחמיר
if (normalizedProperty === normalizedLabel ||
    normalizedProperty.startsWith(normalizedLabel) ||
    normalizedLabel.startsWith(normalizedProperty)) {
  return true;
}
```

---

#### תיקון 2: הסרת alias בעייתי מ-צפון_חדש (locations.ts)

ה-alias `"הצפון החדש - כיכר המדינה"` גורם לבעיות כי הוא מכיל "כיכר המדינה" שהיא שכונה נפרדת.

**קובץ:** `supabase/functions/_shared/locations.ts` (שורות 36-52)

**לפני:**
```typescript
{ 
  value: 'צפון_חדש', 
  label: 'צפון חדש', 
  aliases: [
    'הצפון החדש', 
    'הצפון החדש - צפון', 
    'הצפון החדש - דרום', 
    'הצפון החדש החלק הצפוני', 
    'הצפון החדש החלק הדרומי',
    'הצפון החדש סביבת כיכר המדינה',  // ← בעייתי
    'הצפון החדש סביבת כיכר',          // ← בעייתי
    'הצפון החדש - כיכר המדינה',       // ← בעייתי
    ...
  ] 
},
```

**אחרי:**
```typescript
{ 
  value: 'צפון_חדש', 
  label: 'צפון חדש', 
  aliases: [
    'הצפון החדש', 
    'הצפון החדש - צפון', 
    'הצפון החדש - דרום', 
    'הצפון החדש החלק הצפוני', 
    'הצפון החדש החלק הדרומי',
    // REMOVED: aliases containing "כיכר המדינה" - causes false positives
    'new north',
    'צפון החדש',
    'לואי מרשל',
    ...
  ] 
},
```

**הערה:** הaliases שהוסרו יטופלו ע"י שכונת `כיכר_המדינה` הנפרדת.

---

#### תיקון 3: ניקוי נכסים עם שם ברוקר בכתובת (Migration)

**SQL:**
```sql
-- Fix address field containing broker names
UPDATE scouted_properties
SET 
  address = NULL,
  is_private = false
WHERE is_active = true
  AND (
    address LIKE '%שיווק%' OR 
    address LIKE '%נדל"ן%' OR 
    address LIKE '%נכסים%' OR
    address LIKE '%גולדין%' OR
    address LIKE '%LEAD%'
  );
```

---

#### תיקון 4: חישוב התאמות מחדש

אחרי התיקונים, צריך להפעיל matching מחדש לכל הנכסים והלקוחות.

---

### סיכום השינויים

| קובץ | שורות | שינוי |
|------|-------|-------|
| `locations.ts` | 374-377 | החלפת `includes` ב-`startsWith` לlabel matching |
| `locations.ts` | 380-386 | החלפת `includes` ב-`startsWith` לalias matching |
| `locations.ts` | 36-52 | הסרת aliases בעייתיים מ-צפון_חדש |
| Migration SQL | - | ניקוי שדות address עם שמות ברוקרים |
| Edge function call | - | הפעלת trigger-matching מחדש |

---

### תוצאות צפויות

| מצב | לפני | אחרי |
|-----|------|------|
| התאמות שגויות של כיכר המדינה לצפון_חדש | 51 | 0 |
| נכסים עם שם ברוקר בכתובת | 63 | 0 |
| התאמות לזיו יוגב | 86 | ~76 (ללא שגויות) |

---

### חשוב

התיקון העיקרי הוא בלוגיקת ה-matching - הבדיקה הנוכחית `alias.includes(property)` רופפת מדי וגורמת להתאמות שגויות. הפתרון הוא לעבור ל-`startsWith` שמחמיר יותר.
