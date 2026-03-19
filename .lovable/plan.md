

## סימון נכסים שנכשלו פעמיים — בדיקה ידנית

### גישה פשוטה
שדה חדש `availability_retry_count` עוקב אחרי כשלונות חוזרים. אחרי 2 כשלונות — הנכס יפסיק להיבדק אוטומטית ויופיע **באותה רשימה קיימת** (PendingPropertiesDialog) מסומן באדום עם אייקון בדיקה ידנית.

### שינויים

**1. מיגרציה — שדה חדש**
- `ALTER TABLE scouted_properties ADD COLUMN availability_retry_count integer NOT NULL DEFAULT 0`

**2. Edge Function `check-property-availability-jina/index.ts`**
- בבלוק retryable (~שורה 424): increment `availability_retry_count` ב-1
- בבלוק הצלחה (~שורה 458): reset `availability_retry_count = 0`

**3. עדכון RPC `get_properties_needing_availability_check`**
- הוספת תנאי: `AND sp.availability_retry_count < 2` — כדי שנכסים שנכשלו פעמיים לא ייבדקו יותר

**4. עדכון `PendingPropertiesDialog.tsx`**
- גם לשלוף `availability_retry_count` ו-`availability_check_reason` בשאילתה
- בנוסף לנכסים הממתינים, לשלוף גם נכסים עם `availability_retry_count >= 2` ו-`is_active = true`
- שורות עם `retry_count >= 2`: רקע אדום בהיר + אייקון `Eye` (בדיקה ידנית) שפותח את ה-source_url בטאב חדש
- הצגת סיבת הכשלון (reason) בעמודה נוספת
- מונה בכותרת: "נכסים ממתינים (239) · בדיקה ידנית (14)"

### מה נשאר אותו דבר
- כל שאר הלוגיקה של הבדיקות לא משתנה
- אין דיאלוג חדש, אין כפתור חדש בדשבורד

