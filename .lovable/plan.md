

## תוכנית תיקון — זיהוי שלילה (Negation) בכל שלבי החילוץ

### 3 באגים שזוהו

| # | מיקום | באג | דוגמה |
|---|-------|-----|--------|
| 1 | **Scout `extractFeatures`** (`parser-utils.ts:627`) | אין בדיקת שלילה — regex `/חניה/` תופס גם "חניה: אין" | `parking: true` במקום `false` |
| 2 | **`mergeFeatures`** (`parser-utils.ts:711`) | מעתיק רק `true`, מתעלם מ-`false` | Scout שגוי (`true`) לא נדרס ע"י backfill (`false`) |
| 3 | **Backfill merge** (`backfill-property-data-jina:716-731`) | `{...existing, ...features}` + negative inference מדלג אם existing כבר `true` | Scout שגוי (`true`) נשאר לנצח |

### שרשרת הכשל
```text
Scout: "חניה: אין" → regex /חניה/ → parking: true (שגוי!)
    ↓
Backfill: hasFeature() → negative detected → parking: false (נכון)
    ↓
Merge: existing.parking=true, new.parking=false
    → {...existing, ...new} = parking: false ← זה בסדר
    → אבל negative inference (שורה 728): existing[parking]=true → skip
    → אם backfill לא זיהה כלום: existing stays true
    ↓
Matching: lead requires parking → property has true → MATCH (שגוי!)
```

### תיקונים

#### 1. `parser-utils.ts` — `extractFeatures` (סריקה ראשונה)
הוספת בדיקת שלילה **לפני** בדיקת חיוב לכל פיצ'ר:

```typescript
// לפני כל regex חיובי, בדיקה אם יש שלילה
const NEGATION_PREFIX = /(?:אין|ללא|בלי|לא|ב?לעדי)\s*/;

// חניה
if (NEGATION_PREFIX.test(text.match(/(.{0,10}חניה)/)?.[1] || '') || /חניה:\s*אין/.test(text)) {
  features.parking = false;
} else if (/חניה|חנייה/.test(text)) {
  features.parking = true;
}
```

אותו דבר עבור: מרפסת, מעלית, ממ"ד, מחסן, חצר/גינה, גג, מזגן, ריהוט.

הפיצ'רים שצריכים בדיקת שלילה:
- **חניה** — `אין חניה`, `ללא חניה`, `חניה: אין`
- **מרפסת** — `אין מרפסת`, `ללא מרפסת`, `מרפסת: אין`
- **מעלית** — `אין מעלית`, `ללא מעלית`, `מעלית: אין`
- **ממ"ד** — `אין ממ"ד`, `ללא ממ"ד`, `ממ"ד: אין`
- **מחסן** — `אין מחסן`, `ללא מחסן`, `מחסן: אין`
- **חצר/גינה** — `אין חצר`, `ללא גינה`
- **גג** — `אין גג`
- **מזגן** — `אין מזגן`, `ללא מיזוג`
- **ריהוט** — `לא מרוהטת`, `ללא ריהוט`

פורמט נוסף שקריטי לזהות (מדל"ן/יד2): `פיצ'ר: אין` או `פיצ'ר: לא`

#### 2. `parser-utils.ts` — `mergeFeatures`
שינוי הלוגיקה כך ש-`false` מפורש **גם** נשמר:

```typescript
export function mergeFeatures(...featureSets: PropertyFeatures[]): PropertyFeatures {
  const merged: PropertyFeatures = {};
  for (const features of featureSets) {
    if (!features) continue;
    for (const [key, value] of Object.entries(features)) {
      if (value === true || value === false) {
        // false מפורש דורס undefined, אבל true דורס false
        if ((merged as any)[key] === undefined || value === true) {
          (merged as any)[key] = value;
        }
      }
    }
  }
  return merged;
}
```

#### 3. `backfill-property-data-jina/index.ts` — merge + negative inference
שינוי שורה 716 + 728 כך שתוצאת backfill **דורסת** ערך שגוי מהסריקה:

```typescript
// Merge: backfill overrides scout for explicit values
const mergedFeatures = { ...existingFeatures };
for (const [key, value] of Object.entries(features)) {
  if (value === true || value === false) {
    mergedFeatures[key] = value; // Backfill always wins
  }
}

// Negative inference: apply even if existing is true (scout could be wrong)
for (const key of inferFalse) {
  if (mergedFeatures[key] !== true) {
    mergedFeatures[key] = false;
  }
}
```

### סדר ביצוע
1. תיקון `extractFeatures` ב-`parser-utils.ts` — שלילה בסריקה ראשונה
2. תיקון `mergeFeatures` ב-`parser-utils.ts` — תמיכה ב-false
3. תיקון merge + negative inference ב-`backfill-property-data-jina/index.ts`
4. Deploy scouts + backfill
5. **בדיקות חיות:**
   - סריקה מכל אתר (yad2, madlan, homeless) — בדיקה שפיצ'רים שליליים מסומנים כ-`false`
   - הרצת backfill על נכס ספציפי עם "חניה: אין" — וידוא שהתוצאה `parking: false`
   - בדיקה במערכת ההתאמות שנכס בלי חניה לא מוצע ללקוח שדורש חניה

### קבצים שמשתנים
1. `supabase/functions/_experimental/parser-utils.ts` — extractFeatures + mergeFeatures
2. `supabase/functions/backfill-property-data-jina/index.ts` — merge logic + negative inference

### מה לא משתנה
- UI, טבלאות, matching.ts, edge functions אחרים
- Backfill של Homeless (כבר משתמש ב-bold detection)

### סיכון
**נמוך** — שינויים ברגקס וב-merge logic בלבד. התוצאה: פיצ'רים שליליים יזוהו נכון. נכסים שכבר מסומנים נכון לא יושפעו.

