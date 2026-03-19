

## תיקון באג 2 — ספירה כפולה של `properties_checked`

### הבעיה

`append_run_detail` (DB function) כבר מעדכן את `properties_checked` לאורך מערך ה-`run_details`. אבל אחר כך ב-`trigger-availability-check-jina` (שורה 335) מתבצע:

```
totalChecked = currentRunData.properties_checked + processedThisRun
```

זה מוסיף את הבאץ' **פעמיים** — פעם דרך `append_run_detail` ופעם דרך הטריגר.

אותו דבר קורה ל-`inactive_marked` (שורה 336).

### תיקון

**קובץ: `supabase/functions/trigger-availability-check-jina/index.ts`**

בשורות 335-336, במקום לחבר את `processedThisRun` ו-`inactiveThisRun` לערך הקיים, פשוט להשתמש בערך שכבר נמצא ב-DB (ש-`append_run_detail` כבר עדכן):

```
const totalChecked = currentRunData?.properties_checked || 0;
const totalInactive = currentRunData?.inactive_marked || 0;
```

בנוסף, צריך לוודא שגם `inactive_marked` מתעדכן ב-`append_run_detail`. כרגע הוא לא — רק `properties_checked` מתעדכן שם. יש שתי אפשרויות:

**אפשרות א׳ (מועדפת):** עדכון `append_run_detail` לספור גם `inactive_marked` מתוך ה-details שיש בהם `is_inactive = true`:

```sql
inactive_marked = (
  SELECT count(*) FROM jsonb_array_elements(updated_details) d 
  WHERE (d->>'is_inactive')::boolean = true
)
```

**אפשרות ב׳:** להשאיר את `inactive_marked` מחושב רק בטריגר, אבל אז צריך לשמור את ה-`+inactiveThisRun` רק עבורו.

אני ממליץ על אפשרות א׳ — כך שני המספרים מחושבים ממקור אמת אחד (`run_details`), והטריגר רק קורא אותם.

### שינויים

1. **DB migration** — עדכון `append_run_detail` לחשב `properties_checked` כ-count distinct ולספור גם `inactive_marked`
2. **`trigger-availability-check-jina/index.ts`** — שורות 335-336: הסרת החיבור הכפול, שימוש בערכי DB כמות שהם

