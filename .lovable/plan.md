
# דשבורד ניהול בדיקות זמינות (Availability Check Dashboard)

## מה ייבנה
טאב חדש בעמוד Property Scout (`/admin-dashboard/property-scout`) שמציג ניהול מלא של מערכת בדיקות הזמינות:

1. **היסטוריית ריצות** - טבלה של כל הריצות מ-`availability_check_runs` עם סטטוס, כמות נבדקים, כמות שסומנו כלא אקטיביים, שגיאות, ומשך
2. **סטטיסטיקות נוכחיות** - כמה נכסים ממתינים, כמה נבדקו היום, כמה עם timeout, מכסה יומית
3. **בחירת נכסים לבדיקה ידנית** - אפשרות לסמן נכסים ספציפיים ולהפעיל בדיקה עליהם
4. **הגדרות** - תצוגת ההגדרות הנוכחיות (batch_size, daily_limit, recheck_interval_days וכו')
5. **תוצאות אחרונות** - פירוט נכסים שנבדקו לאחרונה עם התוצאה שלהם (content_ok, listing_removed, timeout וכו')

## מבנה UI

### טאב "בדיקות זמינות" בעמוד Property Scout (טאב רביעי)

**חלק עליון - כרטיסי סטטיסטיקה:**
- ממתינים לבדיקה (availability_checked_at IS NULL)
- נבדקו היום
- סה"כ timeout
- מכסה יומית (נותר/סה"כ)
- ריצה אחרונה (מתי, סטטוס)

**חלק אמצעי - היסטוריית ריצות:**
- טבלה עם: תאריך, סטטוס, נבדקו, סומנו לא-אקטיביים, שגיאה, משך
- Badge צבעוני לסטטוס (completed=ירוק, running=כחול, failed=אדום)
- בחירת טווח תאריכים

**חלק תחתון - תוצאות אחרונות + בדיקה ידנית:**
- טבלת נכסים שנבדקו לאחרונה עם: כתובת, מקור, תוצאה, תאריך בדיקה
- אפשרות סינון לפי תוצאה (content_ok, listing_removed, timeout)
- Checkbox לבחירת נכסים + כפתור "בדוק עכשיו" להפעלת בדיקה ידנית
- כפתור "בדוק את כל ה-timeout" - לאיפוס ובדיקה מחדש של כל נכסי ה-timeout

## פירוט טכני

### קבצים חדשים
1. `src/components/scout/AvailabilityCheckDashboard.tsx` - הקומפוננטה הראשית עם:
   - שאילתות react-query לנתונים מ-`availability_check_runs` ו-`scouted_properties`
   - כרטיסי סטטיסטיקה (ממתינים, נבדקו היום, timeouts, מכסה)
   - טבלת ריצות עם סינון לפי תאריך
   - טבלת תוצאות עם סינון לפי סוג תוצאה
   - בחירת נכסים + הפעלת `check-property-availability` ידנית
   - תצוגת הגדרות נוכחיות מ-`scout_settings`

### קבצים לעדכון
2. `src/pages/AdminPropertyScout.tsx` - הוספת טאב רביעי "בדיקות זמינות" עם אייקון Shield/RefreshCw

### שאילתות מרכזיות
- ריצות: `SELECT * FROM availability_check_runs ORDER BY started_at DESC LIMIT 50`
- ממתינים: `SELECT count(*) FROM scouted_properties WHERE is_active=true AND availability_checked_at IS NULL`
- נבדקו היום: `SELECT count(*) FROM scouted_properties WHERE availability_checked_at >= today`
- תוצאות אחרונות: `SELECT id, address, city, source, source_url, availability_check_reason, availability_checked_at FROM scouted_properties WHERE availability_checked_at IS NOT NULL ORDER BY availability_checked_at DESC LIMIT 50`
- הגדרות: `SELECT * FROM scout_settings WHERE category = 'availability'`

### בדיקה ידנית
- שימוש בפונקציה הקיימת `check-property-availability` עם `property_ids`
- הצגת תוצאות בזמן אמת עם toast notifications
- רענון אוטומטי של הנתונים אחרי בדיקה

### דפוסי עיצוב
- שימוש באותם דפוסים כמו `ScoutRunHistory` (Collapsible, Badge, Table)
- RTL כמו שאר האפליקציה
- refetchInterval לעדכון אוטומטי בזמן ריצה
