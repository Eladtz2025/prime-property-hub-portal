

## תוכנית תיקון — שיפור חילוץ פיצ'רים ותיקון נתונים קיימים

### ממצאי הבדיקה

| ממצא | חומרה | השפעה |
|------|--------|--------|
| **1,091 נכסים עם features={}** למרות backfill_status=completed | קריטית | נכסים אלו נדחים מכל התאמה שדורשת פיצ'ר כחובה |
| **isolatePropertyDescription חותך את "מפרט מלא"** — סקשן עם פרטי חניה/מעלית/ממ"ד של מדל"ן | קריטית | ~50% מנכסי מדל"ן לא מזוהים |
| **Regex ממ"ד לא תופס Unicode gershayim** — מדל"ן משתמש ב-`״` (U+05F4) ולא `"` | בינונית | 89% mamad_null |
| **parser-utils.ts ממ"ד** — אותה בעיה ברגקס | בינונית | סריקה ראשונה מפספסת |

### מה מתוקן

#### 1. תיקון `isolatePropertyDescription` למדל"ן
**קובץ:** `backfill-property-data-jina/index.ts` (שורות 1217-1226)

**לפני:** אם "יתרונות" + "תיאור" > 50 תווים → מחזיר רק אותם, מדלג על "מפרט מלא"
**אחרי:** תמיד מוסיף את סקשן "מפרט מלא" לטקסט המחולץ:

```typescript
if (source === 'madlan') {
  let text = '';
  const advantagesMatch = markdown.match(/יתרונות הנכס([\s\S]*?)(?:##|תיאור הנכס|מפרט מלא|מידע נוסף|$)/i);
  if (advantagesMatch) text += advantagesMatch[1] + '\n';
  const descriptionMatch = markdown.match(/תיאור הנכס([\s\S]*?)(?:##|מפרט מלא|מידע נוסף|צור קשר|$)/i);
  if (descriptionMatch) text += descriptionMatch[1] + '\n';
  // NEW: always include "מפרט מלא" section
  const specMatch = markdown.match(/מפרט מלא([\s\S]*?)(?:##|מידע נוסף|צור קשר|$)/i);
  if (specMatch) text += specMatch[1] + '\n';
  if (text.length > 50) return text;
  return markdown; // fallback: return full text
}
```

#### 2. תיקון Regex ממ"ד — תמיכה ב-Unicode gershayim
**קבצים:** `backfill-property-data-jina/index.ts` + `parser-utils.ts`

הוספת `״` (U+05F4) לכל regex של ממ"ד:
- `ממ"?ד` → `ממ["״]?ד`
- `\bממ"ד\b` → `ממ["״]ד`

#### 3. הרצה מחדש של backfill על 1,091 נכסים עם features={}
**ללא שינוי קוד** — איפוס `backfill_status` ל-`pending` עבור נכסים עם `features = '{}'` כדי שיעברו שוב את ה-backfill עם הלוגיקה המתוקנת. זה יקרה בחלון ה-backfill הבא (00:00-02:30).

#### 4. הרצת matching מחדש אחרי ה-backfill
לאחר שה-backfill מסיים — הרצת `run-matching` כדי לעדכן את ההתאמות לפי הנתונים החדשים.

### סדר ביצוע
1. תיקון `isolatePropertyDescription` + regex ממ"ד → deploy backfill
2. תיקון regex ממ"ד ב-parser-utils → deploy scouts
3. איפוס backfill_status ל-1,091 נכסים
4. בדיקות חיות — סריקה מכל אתר + בדיקת backfill על נכס ספציפי
5. הרצת matching מחדש

### מה לא משתנה
- לוגיקת matching (כבר תוקנה)
- UI
- טבלאות DB
- לוגיקת סריקה ראשונה (scouts)
- בדיקות זמינות

### סיכון
**אפסי** — שינוי ב-regex ובחילוץ טקסט בלבד. הפיצ'רים רק מתווספים (לא נמחקים). נכסים שכבר יש להם `parking=true` לא יידרסו.

