## תוכנית: שדרוג יד2 (Scout + Backfill) - ללא פגיעה במדל"ן/הומלס

### עיקרון מנחה
**בידוד מוחלט:** כל השינויים נוגעים רק לקבצים של יד2. לא נוגעים ב:
- `scout-madlan-direct/`, `parser-madlan-ssr.ts` (מדלן - עובד)
- `scout-homeless-jina/`, `parser-homeless.ts` (הומלס - עובד)
- `check-property-availability-jina/` (95% הצלחה - לא לגעת)

---

### שלב 1: אימות הסקאוט החדש (CF Worker + __NEXT_DATA__)
1. לפרוס את `scout-yad2-jina` המעודכן (כבר קיים בקוד)
2. להריץ ריצת test קטנה: 3 עמודים בקונפיג יד2 פעיל
3. לבדוק ב-DB את התוצאות:
   - כמה properties נשמרו (יעד: ~21/page)
   - איכות שדות: price, rooms, square_meters, neighborhood, owner_type
   - אחוז הצלחה של עמודים
4. לבדוק logs ל-CAPTCHA detection / blocks

**Gate:** רק אם ≥80% הצלחה ו-≥15 properties/page בממוצע - ממשיכים לשלב 2.

---

### שלב 2: תיקון Backfill (השלמת נתונים) ליד2
**הבעיה הידועה:** 94% מהנכסים שעברו backfill חסר להם description, 72% חסר images.

**הפתרון:**
1. לעדכן `supabase/functions/_shared/yad2-detail-parser.ts`:
   - חילוץ `description` מ-`[data-testid="property-description"]` ו-fallbacks
   - חילוץ `images` מ-pattern `img.yad2.co.il/Pic/` ב-HTML וב-`__NEXT_DATA__`
   - שמירה על שדות קיימים שכבר עובדים (price, rooms וכו')

2. להעביר את ה-fetch של דפי פרטי יד2 ב-backfill מ-Jina ל-CF Worker proxy (אותה לוגיקה כמו ב-scout):
   - אם listing pages נחסמים ב-Jina, גם detail pages ייחסמו
   - להוסיף helper משותף `fetchYad2ViaCfProxy` בקובץ נפרד `_shared/yad2-cf-fetcher.ts`

3. **לא לאפס `data_completed_at` לכלל הנכסים** - רק לנכסי יד2 שחסר description:
   ```sql
   UPDATE properties 
   SET data_completed_at = NULL 
   WHERE source = 'yad2' 
     AND (description IS NULL OR description = '');
   ```
   (~2,096 נכסים בלבד, לא נוגע במדלן/הומלס)

---

### שלב 3: אימות Backfill
1. להריץ backfill על batch קטן (20 נכסי יד2)
2. לבדוק ב-DB:
   - description קיים ולא ריק
   - images array עם ≥1 תמונה
   - שדות קיימים לא נדרסו
3. אם תקין → לאשר הרצה מלאה על כל ה-2,096

---

### מה לא נוגעים בו
- ❌ `check-property-availability-jina` (עובד 95%)
- ❌ כל קוד מדלן
- ❌ כל קוד הומלס
- ❌ matching engine
- ❌ scout-configs / cron schedules

### קבצים שייגעו
- `supabase/functions/scout-yad2-jina/index.ts` (כבר עודכן, צריך אימות)
- `supabase/functions/_shared/yad2-detail-parser.ts` (תיקון description + images)
- `supabase/functions/_shared/yad2-cf-fetcher.ts` (חדש - helper משותף)
- Backfill function שמשתמש ב-detail-parser - לעדכן להשתמש ב-CF fetcher
- Migration קטן: reset `data_completed_at` רק לנכסי יד2 חסרי description

### דיווח לאחר כל שלב
אחרי כל שלב אדווח אמת מהמספרים האמיתיים ב-DB וב-logs - לא תיאוריה.
