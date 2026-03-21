

## שיפור תצוגת הפיד במוניטור — אחידות, קריאות, וניצול שטח

### בעיות שזיהיתי מהצילומים

1. **זמינות (image-709)**: שורה 2 מציגה "תוכן תקין — מחיר/חדרים נמצאו בדף | אקטיבי" — טקסט טכני בלבד, בלי badges של מחיר/חדרים/שכונה/פרטי. שאר הטאבים מציגים badges — חוסר אחידות.
2. **השלמה (image-711)**: שורה 2 מציגה טקסט גולמי כמו `backfill_status | rooms, price, size, floor, city, neighborhood` — לא קריא, אין badges כלל.
3. **כותרת (primary)**: בחלק מהטאבים הכתובת לא כוללת שכונה (למשל "בבלי 1" במקום "בבלי 1, בבלי"), בעוד שבטאב סריקה כן יש ("שדרות חטשילד 30"). צריך אחידות: **רחוב + מספר, שכונה** תמיד.
4. **הפונט קטן מדי** — `text-[13px]` לכותרת ו-`text-[11px]` לפרטים, עם ריווח `pr-[72px]` שמרחיק הכל ומשאיר אמצע ריק.
5. **שורה 2 צמודה מדי לשמאל** — ה-badges נדחסים לקצה בגלל ה-padding הגדול, והחלק המרכזי ריק.

### פתרון

**`LiveFeedTab.tsx`** — עיצוב מחודש:
- **כותרת (primary)**: הגדלה מ-`text-[13px]` ל-`text-sm` (14px). תמיד כוללת שכונה: `formatCleanAddress(address, neighborhood)`.
- **שורה 2**: הקטנת `pr-[72px]` ל-`pr-[60px]`, הזזת ה-badges למרכז השורה עם `justify-center` או `gap-2` רחב יותר. הגדלת badges מ-`text-[10px]` ל-`text-[11px]`.
- **סדר badges אחיד בכל הטאבים**: פרטי/תיווך → שכונה → מחיר → חדרים → קומה. כשיש details טקסטואלי — הוא מופיע אחרי ה-badges בצבע בהיר.

**`useMonitorData.ts`** — תיקון הנתונים:
- **זמינות**: הוספת `neighborhood` ל-`extra` (כבר קיים) + וידוא ש-`formatCleanAddress` מקבל גם neighborhood ב-primary.
- **השלמה (backfill)**: ניקוי ה-details — במקום `backfill_status | rooms, price...` להציג badges מהנתונים (כבר ב-DB) ולהציג רק "נמצאו: חדרים, מחיר | עודכנו: שכונה" כ-details טקסטואלי נקי. הוספת `extra` (price, rooms, floor, neighborhood, is_private) ל-feedItems של backfill — כרגע חסר לגמרי.
- **סריקה + כפילויות + התאמות**: וידוא ש-`primary` תמיד משתמש ב-`formatCleanAddress(address, neighborhood)` עם שכונה.

### שינויים טכניים

**קובץ 1: `useMonitorData.ts`**
- שורה 532: שינוי `formatCleanAddress(prop.address, undefined)` ל-`formatCleanAddress(prop.address, prop.neighborhood)` (scan)
- שורה 579: כנ"ל (dedup)
- שורה 668: כנ"ל (matching)
- שורות 617-626 (backfill items): הוספת `extra` עם price/rooms/floor/neighborhood/is_private מהנתוני ה-item (צריך להרחיב את הנתונים מה-backfill recent items)
- בשאילתת backfill recent items — הוספת שדות price, rooms, floor, is_private (כרגע לא נשלפים)

**קובץ 2: `LiveFeedTab.tsx`**
- שורה 155/159: הגדלת `text-[13px]` ל-`text-sm`
- שורה 164: שינוי `pr-[72px]` ל-`pr-[60px]` והוספת `gap-2`
- שורות 66-76 (PropertyBadges): הגדלת `text-[10px]` ל-`text-[11px]`
- וידוא ש-details טקסטואלי מופיע אחרי ה-badges ולא לפניהם

