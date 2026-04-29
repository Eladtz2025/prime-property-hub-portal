## הבעיה (אישור סופי לפי הצילומים שלך)

- בדיאלוג "השלמת נתונים" של מונטיפיורי 22 רואים בבירור שהפרסר מזהה נכון: **אין חניה** (`parking` לא מופיע ברשימת התגים).
- אבל ב-record שנשמר ב-DB (טבלת `scouted_properties`) השדה `features.parking` נשאר `true`.
- הסיבה: בקוד ה-merge ב-`backfill-property-data-jina/index.ts`, השדה `parking` נכתב רק אם הערך הקיים הוא `null`/`undefined`. כשהערך הקיים הוא כבר `true` (משלב ה-scout המקורי), ה-`false` שמגיע מהפרסר נדחה בשקט.

## הפתרון — שינוי אחד מבודד בלבד

### שינוי יחיד: `supabase/functions/backfill-property-data-jina/index.ts`

בלולאת ה-merge של `features` (שם בודקים אם `mergedFeatures[key]` הוא null/undefined), להוסיף חריג נקודתי **רק לשדה `parking`**:

```ts
for (const [key, value] of Object.entries(detailResult.features)) {
  if (key === 'parking') {
    // parking is authoritative from the parser — allow explicit boolean overwrite
    if (typeof value === 'boolean') {
      mergedFeatures[key] = value;
    }
  } else if (mergedFeatures[key] === undefined || mergedFeatures[key] === null) {
    mergedFeatures[key] = value;
  }
}
```

**מה זה משנה:**
- `parking` בלבד — יכול להיכתב מחדש כש-parser מחזיר `true` או `false` מפורש.
- כל שאר השדות (price, size, rooms, floor, mamad, elevator, balcony וכו') — נשארים מוגנים בדיוק כמו היום (נכתבים רק אם null).

**מה זה לא נוגע בו:**
- שום שינוי ב-DB / RLS / migrations / cron / matching.
- שום שינוי ב-parser-ים (`yad2-detail-nextdata.ts`, Cheerio, Madlan).
- שום שינוי בלוגיקת ה-scout.

### לוג קצר לאימות

מוסיפים `console.log` אחד לפני ה-update:
```
[backfill] property=<id> parking before=<old> after=<new>
```
כדי שנוכל לראות בלוגים שהדריסה אכן קורית.

## שלב 2 — הרצה מחדש של ~200 הנכסים מהחלון הפגום

לאחר אישור שהתיקון עובד, נריץ query שמאפס `backfill_status` ל-`pending` עבור הנכסים מ-Yad2 שעברו backfill בחלון הזמן הבעייתי (מאז התיקון הקודם שלי) ויש להם `features.parking = true` ללא `parkingSpots` — קבוצה שכוללת עם ביטחון גבוה את הנכסים שזיהינו לא נכון.

זה ייעשה כ-**SQL migration נפרדת לאישור** אחרי שנראה שהתיקון בקוד עובד על נכסים חדשים. לא נוגע באף נכס שמחוץ לחלון הזה.

## חזרה למצב קודם (אם משהו משתבש)

מחיקת 4 שורות הקוד שנוספו (החריג של `parking` + ה-log). זהו.

## מה אני **לא** עושה

- לא מתקן 30+ הנכסים המקוריים מהריצה השגויה הראשונה — זה מטופל יחד עם ה-200 בשלב 2.
- לא נוגע ב-`yad2-detail-nextdata.ts` (התוכנית הקודמת בקובץ `.lovable/plan.md` מבוטלת).
- לא משנה את החלטת ה-merge עבור אף שדה אחר.
