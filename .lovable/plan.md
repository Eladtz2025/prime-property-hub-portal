

## תוכנית שיפור מערכת חילוץ פיצ'רים + הסרת ממ"ד מהתאמות

### סיכום מצב נוכחי

| אתר | סה"כ | חניה | ממ"ד | מרפסת | מעלית |
|------|-------|------|------|--------|--------|
| **yad2** | 2,597 | 73% | 22% | 29% | 61% |
| **madlan** | 1,129 | 30% | 13% | 28% | 63% |
| **homeless** | 334 | 27% | 18% | 28% | 51% |

**בעיות עיקריות:**
1. **מדל"ן — הסריקה הראשונה מחזירה `features: {}`** — הפארסר `parser-madlan-html.ts` לא מחלץ שום פיצ'ר
2. **Backfill חסום** — 826 נכסים בסטטוס `pending` (מדל"ן+יד2+homeless) עם features ריקים
3. **ממ"ד** — אחוז זיהוי נמוך (13-22%) כי המילה לא תמיד מוזכרת בטקסט → צריך להסיר מהתאמות

---

### נקודה 1: הסרת ממ"ד מלוגיקת ההתאמות

**קובץ:** `supabase/functions/_shared/matching.ts`

מחיקת הבלוק בשורות 509-517 (בדיקת `mamad_required` + `mamad_flexible`). גם הסרת:
- בונוס priority של +8 נקודות על ממ"ד (שורה 691-694)
- penalty של -5 על mamad null (שורה 736-738)

**תוצאה:** ממ"ד לא ישפיע על ציון ההתאמה ולא ידחה נכסים.

---

### נקודה 2: חילוץ פיצ'רים מהסריקה הראשונה — מדל"ן

**קובץ:** `supabase/functions/_experimental/parser-madlan-html.ts`

**מצב נוכחי:** שורה 357 — `features: {}` (ריק תמיד)

**שינוי:** הוספת חילוץ מתוך ה-HTML של כרטיס הרשימה באמצעות `extractFeatures(cardText)` מ-`parser-utils.ts`. הטקסט של הכרטיס (`cardText`) כבר קיים בפונקציה — צריך רק להעביר אותו ל-`extractFeatures`.

```
features: extractFeatures(cardText)
```

זה יחלץ חניה, מרפסת, מעלית, מחסן, חצר, גג מהטקסט של הרשימה כבר בסריקה ראשונה.

---

### נקודה 3: שיפור Negative Inference בסריקה ראשונה

**קובץ:** `supabase/functions/_experimental/parser-utils.ts`

**מצב נוכחי:** הסקה שלילית מופעלת רק אם 2+ פיצ'רים זוהו. ברשימות קצרות (כמו מדל"ן) לעיתים מזוהה רק פיצ'ר אחד → אין הסקה שלילית → שאר הפיצ'רים נשארים null.

**שינוי:** הורדת הסף מ-2 ל-1 — אם זוהה לפחות פיצ'ר אחד, שאר הפיצ'רים הקריטיים מסומנים כ-false. הסרת `mamad` מרשימת הפיצ'רים הקריטיים (כי הורדנו אותו מההתאמות).

```typescript
const criticalFeatures = ['parking', 'balcony', 'elevator', 'storage', 'yard', 'roof'];
// threshold: 1 instead of 2
if (recognizedCount >= 1) { ... }
```

---

### נקודה 4: בדיקות חיות אחרי ה-deploy

1. **סריקת מדל"ן** — הרצת scout ובדיקה שנכסים חדשים מקבלים features מלאים (לא `{}`)
2. **בדיקת backfill** — בדיקה שנכסים שעוברים backfill מקבלים features מלאים
3. **בדיקת matching** — הרצת matching ובדיקה שלשירי (ולקוחות אחרים) אין דירות עם פרטים חסרים שסותרים את הדרישות שלהם

---

### סדר ביצוע
1. הסרת ממ"ד מ-`matching.ts` → deploy
2. הוספת `extractFeatures` ל-`parser-madlan-html.ts` → deploy scouts
3. שיפור סף negative inference ב-`parser-utils.ts` → deploy scouts
4. בדיקות חיות — סריקה + backfill + matching

### קבצים שמשתנים
1. `supabase/functions/_shared/matching.ts` — הסרת ממ"ד
2. `supabase/functions/_experimental/parser-madlan-html.ts` — חילוץ פיצ'רים
3. `supabase/functions/_experimental/parser-utils.ts` — שיפור negative inference

### מה לא משתנה
- UI
- טבלאות DB
- Backfill logic
- בדיקות זמינות

