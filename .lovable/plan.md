

# תיקון בדיקת זמינות מדלן - העתקת הטריקים של יד2

## מה נמצא
בסריקה של יד2 (`scraping-jina.ts`) יש שני headers שעוזרים לעבור הגנת בוטים:
1. `X-Proxy-Country: IL` - גורם ל-Jina לנתב דרך פרוקסי ישראלי
2. `X-Wait-For-Selector` ספציפי - סלקטור CSS שמכוון לתוכן אמיתי

שני אלה עובדים על ה-Free Tier (בלי API key) ויד2 עובד מצוין איתם.

בבדיקת הזמינות של מדלן, שניהם חסרים - מדלן מקבל רק `X-Wait-For-Selector: body` ובלי proxy.

## מה ישתנה

### קובץ: `supabase/functions/check-property-availability-jina/index.ts`

בפונקציה `checkWithJina`, להוסיף למדלן:

```text
לפני (שורות 47-57):
  headers = {
    'Accept': 'text/markdown',
    'X-Wait-For-Selector': 'body',
    'X-Timeout': isMadlan ? '45' : '30',
    'X-Locale': 'he-IL',
  };
  if (!isMadlan) headers['X-No-Cache'] = 'true';

אחרי:
  headers = {
    'Accept': 'text/markdown',
    'X-Wait-For-Selector': isMadlan ? '[class*="listing"]' : 'body',
    'X-Timeout': isMadlan ? '45' : '30',
    'X-Locale': 'he-IL',
  };
  if (!isMadlan) headers['X-No-Cache'] = 'true';
  if (isMadlan) headers['X-Proxy-Country'] = 'IL';
```

### שינויים ספציפיים:
1. **`X-Proxy-Country: IL`** למדלן - אותו header שעובד ליד2 בסריקה
2. **`X-Wait-For-Selector`** ספציפי למדלן - `[class*="listing"]` במקום `body` גנרי, כדי לוודא שהתוכן האמיתי נטען ולא רק ה-skeleton

### SQL: איפוס נכסי מדלן שנתקעו
```sql
UPDATE scouted_properties
SET availability_checked_at = NULL, 
    availability_check_reason = NULL, 
    availability_check_count = 0
WHERE source = 'madlan' 
  AND is_active = true
  AND availability_check_reason IN (
    'madlan_skeleton', 'madlan_homepage_redirect', 
    'madlan_captcha_blocked', 'per_property_timeout',
    'jina_failed_after_retries'
  );
```

### Deploy
- `check-property-availability-jina`

### למה זה אמור לעבוד
- אותו בדיוק מנגנון שעובד ליד2 בסריקה (Free Tier, בלי API key)
- הפרוקסי הישראלי גורם לבקשה להיראות כמו גלישה רגילה מישראל
- הסלקטור הספציפי מוודא שה-JavaScript של מדלן סיים לרנדר לפני שמחזירים תוכן

