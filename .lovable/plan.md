
## תוכנית - שיפור חילוץ פיצ'רים (Features)

### מצב קיים

| מקור | סה"כ פעיל | עם פיצ'רים | ריק | שיעור מילוי |
|------|-----------|------------|-----|-------------|
| Yad2 | 4,153 | 2,205 | 1,948 | 53.1% |
| Madlan | 1,803 | 879 | 924 | 48.8% |
| Homeless | 561 | 494 | 67 | 88.1% |
| **סה"כ** | **6,517** | **3,578** | **2,939** | **54.9%** |

**הבעיה:** 45% מהנכסים חסרי פיצ'רים (מרפסת, מעלית, חניה, ממ"ד, חצר).

---

### סיבות הבעיה

1. **סריקת דפי חיפוש בלבד:** הסקאוט סורק דפי תוצאות חיפוש שמכילים רק מידע בסיסי (מחיר, חדרים, שטח). הפיצ'רים נמצאים בדף הנכס הספציפי.

2. **Backfill חלקי:** הפונקציה `backfill-property-data` אמורה לסרוק דפי נכס ולחלץ פיצ'רים, אבל:
   - מופעלת רק כשיש נתונים חסרים (rooms/price/size null)
   - נכסים שיש להם כל הנתונים הבסיסיים לא נכללים

3. **לוגיקת חילוץ:** קיימת לוגיקת חילוץ טובה ב-backfill אבל היא לא מופעלת על כל הנכסים.

---

### פתרון מוצע

#### שלב 1: עדכון Query של Backfill

**קובץ:** `supabase/functions/backfill-property-data/index.ts`

**שינוי:** הוספת תנאי `features.is.null` או `features.eq.{}` ל-Query כדי לכלול גם נכסים עם מידע בסיסי מלא אך ללא פיצ'רים.

```text
┌──────────────────────────────────────────────────────────┐
│                    לפני (נוכחי)                          │
├──────────────────────────────────────────────────────────┤
│ .or('rooms.is.null,price.is.null,size.is.null,          │
│      features.is.null,is_private.is.null')              │
├──────────────────────────────────────────────────────────┤
│                    אחרי (מוצע)                           │
├──────────────────────────────────────────────────────────┤
│ .or('rooms.is.null,price.is.null,size.is.null,          │
│      features.is.null,features.eq.{},is_private.is.null')│
└──────────────────────────────────────────────────────────┘
```

#### שלב 2: שיפור לוגיקת Features

**בעיה:** ה-backfill מעדכן features רק אם יש features חדשים:
```typescript
if (hasNewFeatures || !prop.features) {
  updates.features = { ...existingFeatures, ...features };
}
```

**שינוי:** עדכון התנאי כדי לכלול גם features ריקים:
```typescript
const existingIsEmpty = !prop.features || Object.keys(prop.features).length === 0;
if (hasNewFeatures || existingIsEmpty) {
  updates.features = { ...existingFeatures, ...features };
}
```

#### שלב 3: הרחבת Regex ל-Features

**קובץ:** `supabase/functions/backfill-property-data/index.ts` - פונקציית `extractFeatures`

נרחיב את הדפוסים לזיהוי features:

| פיצ'ר | דפוסים נוספים |
|-------|---------------|
| מרפסת | `מרפסת שמש`, `מרפסת גדולה`, `2 מרפסות` |
| מעלית | `בניין עם מעלית`, `מעלית שבת` |
| חניה | `חניון`, `2 חניות`, `חניה בטאבו` |
| ממ"ד | `חדר ביטחון`, `ממד צמוד` |
| חצר | `גינה פרטית`, `דשא`, `פטיו` |

---

### סיכום שינויים

| קובץ | שינוי |
|------|-------|
| `supabase/functions/backfill-property-data/index.ts` | שינוי Query להוספת `features.eq.{}` |
| `supabase/functions/backfill-property-data/index.ts` | עדכון תנאי עדכון features |
| `supabase/functions/backfill-property-data/index.ts` | הרחבת regex ב-extractFeatures |

---

### הפעלת Backfill מחודש

לאחר הפריסה, נריץ backfill מלא כדי לעדכן את כל הנכסים עם features ריקים:

```
POST /backfill-property-data
{ "action": "start", "dry_run": false }
```

**הערכה:**
- ~2,939 נכסים צריכים עדכון
- קצב: ~20 לדקה (עם delays)
- זמן: ~2.5 שעות

---

### צפי לאחר השינוי

| מדד | לפני | אחרי (צפי) |
|-----|------|-----------|
| נכסים עם features | 54.9% | 85%+ |
| חילוץ מרפסת | ~264 | ~1,500+ |
| חילוץ מעלית | ~58 | ~800+ |
| חילוץ חניה | ~415 | ~1,200+ |
