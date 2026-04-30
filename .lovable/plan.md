

## תיקון: החזרת 1,837 הנכסים לתור השלמת הנתונים האמיתי

### הבעיה
המיגרציה הקודמת איפסה `availability_checked_at` - זה שולח נכסים ל**בודק הזמינות** (`check-property-availability-jina` כשהוא רץ במצב availability), לא ל**השלמת הנתונים**. בפועל הם לא ייכנסו להשלמת נתונים כי `backfill_status = 'completed'` חוסם אותם.

### התיקון

**1. מיגרציית SQL - איפוס נכון של דגלי backfill:**

```sql
-- החזרת 1,837 הנכסים לתור השלמת הנתונים
UPDATE scouted_properties
SET 
  backfill_status = 'pending',           -- מאפשר ל-backfill לבחור אותם
  backfill_attempted_at = NULL,          -- כדי שלא יסונן כ"ניסיתי לאחרונה"
  availability_checked_at = OLD_VALUE    -- מחזירים לערך המקורי כדי לא להציף את בודק הזמינות
WHERE is_active = true
  AND availability_check_reason = 'needs_enrichment'
  AND (
    features IS NULL 
    OR features = '{}'::jsonb
    OR NOT (features ? 'parking')
    OR NOT (features ? 'elevator')
    OR NOT (features ? 'balcony')
    OR NOT (features ? 'mamad')
  );
```

הערה: לא נוכל לשחזר את `availability_checked_at` המקורי (הוא נדרס). פשוט נחזיר אותו ל-`now() - interval '1 day'` כדי שלא ייכנס לתור הבדיקה המיידי.

**2. בדיקה ב-`backfill-property-data-jina`:** לוודא שהשאילתה שלו בוחרת לפי `backfill_status IN ('pending', NULL)` ולא לפי `availability_checked_at`. אם השאילתה שונה - להתאים את המיגרציה.

**3. עדכון `match-own-properties` ו-`_shared/matching.ts`:** כשנכס נדחה כי features חסרים, לסמן `backfill_status = 'pending'` במקום `availability_check_reason = 'needs_enrichment'`. זו התנהגות הדחיפה הנכונה לתור השלמת נתונים.

**4. הפרדה ברורה בקוד:**
- `availability_check_reason` + `availability_checked_at` → בדיקת קישור חי (האם המודעה עדיין באוויר)
- `backfill_status` + `backfill_attempted_at` → השלמת שדות חסרים (price, rooms, features וכו')

### וידוא לאחר התיקון
שאילתה שתוודא:
- `SELECT COUNT(*) WHERE backfill_status = 'pending'` → צפוי כ-1,837
- בדיקה שהשלמת נתונים מתחילה לרוץ עליהם (ידנית או cron הבא)

### למה זה נכון
- features חסרים = עבודה של השלמת נתונים, שעובדת טוב
- בדיקת זמינות לא יודעת למלא features - היא רק בודקת אם ה-URL חי
- אחרי ש-backfill ימלא את ה-features, ההתאמות ל-Shiri (וכל מי שדורש parking strict) יחזרו לעבוד נכון

### סיכון
נמוך. שינוי נתונים בלבד, לא לוגיקה. אם משהו ישתבש - אפשר להחזיר ל-`completed` בשאילתה אחת.

