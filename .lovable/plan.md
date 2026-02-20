

## הוספת פילטר "כשלונות בדיקה" בטבלת הנכסים

### מה ישתנה

הוספת אופציה חדשה בפילטר הסטטוס הקיים בטבלת "דירות שנמצאו" שתאפשר לסנן נכסים שנכשלו בבדיקת זמינות (timeout, captcha וכו'), כך שתוכל לעבור עליהם ידנית.

### 1. פילטר חדש בשדה "מקור" או פילטר ייעודי
הוספת ערך חדש ב-Select הקיים - "כשלונות בדיקה" - שיסנן לפי:
- `availability_check_reason` שווה ל-`per_property_timeout` או `captcha_blocked` או `scrape_failed`

### 2. עמודת מידע נוספת
בשורת כל נכס מסונן, הצגת סיבת הכשלון (`availability_check_reason`) ותאריך הבדיקה האחרונה (`availability_checked_at`) כ-Badge קטן.

### 3. כפתור "בדוק ידנית"
לכל נכס בתצוגה הזו - לינק ישיר ל-URL המקורי כדי שתוכל לבדוק בעצמך אם המודעה עדיין קיימת.

### פרטים טכניים

**קובץ שישתנה:**
- `src/components/scout/ScoutedPropertiesTable.tsx`

**שינויים:**
1. הוספת ערך חדש ל-`statusFilter` Select: `"check_failed"` עם תווית "כשלונות בדיקה"
2. ב-`appliedFilters` - הוספת שדה `checkStatus` (string)
3. ב-`applyFilters` - כשהפילטר פעיל:
   - הסרת הסינון `is_active = true` (כדי לראות גם נכסים שנכשלו)
   - הוספת `.in('availability_check_reason', ['per_property_timeout', 'captcha_blocked', 'scrape_failed'])`
   - הוספת `.eq('is_active', true)` (נכסים פעילים בלבד)
4. הוספת עמודת "סיבה" בטבלה שמוצגת רק כשהפילטר פעיל - מציגה את `availability_check_reason` בצורה קריאה
5. הוספת השדות `availability_check_reason` ו-`availability_checked_at` ל-interface `ScoutedProperty`

**מיפוי סיבות לעברית:**
- `per_property_timeout` -> "טיימאאוט"
- `captcha_blocked` -> "CAPTCHA"
- `scrape_failed` -> "כשלון סריקה"
- אחר -> הערך המקורי

