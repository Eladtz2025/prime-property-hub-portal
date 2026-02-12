

# שינויים בדשבורד — כרטיסיות + מוניטור חי

## 1. כרטיסיות סטטיסטיקה — סדר חדש

**הסרת 2 כרטיסיות:**
- Timeouts
- ריצה אחרונה

**הוספת כרטיסיה חדשה:** "סה״כ נכסים" — ספירת כל הנכסים בטבלה (כולל לא אקטיביים)

**סדר חדש (6 כרטיסיות, מימין לשמאל):**
1. סה״כ נכסים (חדש)
2. סה״כ אקטיביים
3. ממתינים לבדיקה
4. נבדקו היום
5. כפילויות פתוחות
6. התאמות

## 2. מוניטור חי — שינוי פריסת שורה

**העברת פרטים לשורה אחת:** במקום שהפרטים (נמצאו: rooms, price...) יהיו בשורה נפרדת מתחת לכותרת, הם יופיעו באותה שורה — אחרי שם הנכס, במרכז/שמאל.

**שם הנכס עם שכונה:** הכתובת תוצג כ-"רחוב מספר, שכונה" (למשל "דיזנגוף 50, צפון ישן") — בדיוק כמו בטבלת הסקאוט. זה דורש שה-Edge Function תשמור גם את ה-`neighborhood` ב-`recent_items`.

---

## פרטים טכניים

### קובץ: `src/pages/AdminPropertyScout.tsx`
- הוספת query חדש לספירת כלל הנכסים: `supabase.from('scouted_properties').select('id', { count: 'exact', head: true })`
- הסרת query ה-`lastAvailRun` (שימש רק לכרטיסיית "ריצה אחרונה")
- הסרת כרטיסיית Timeouts וריצה אחרונה
- שינוי ה-grid ל-`lg:grid-cols-6`
- סדר חדש: סה"כ נכסים, אקטיביים, ממתינים, נבדקו היום, כפילויות, התאמות

### קובץ: `src/components/scout/checks/LiveMonitor.tsx`
- הוספת `neighborhood` ל-interfaces (`BackfillRecentItem`, `FeedItem`)
- שינוי ה-`primary` של backfill items: `${item.address}${item.neighborhood ? ', ' + item.neighborhood : ''}`
- מיזוג שתי השורות (primary + details) לשורה אחת: הכתובת + הפרטים (נמצאו/עודכנו) באותה שורה, עם flex-1 לכתובת ו-truncate לפרטים
- הסרת ה-div הנפרד של "Detail line" (שורות 456-472)

### קובץ: `supabase/functions/backfill-property-data/index.ts`
- הוספת `neighborhood` לכל קריאות `saveRecentItem` (כ-`prop.neighborhood`)
- הוספת `neighborhood` ל-interface של `saveRecentItem`

