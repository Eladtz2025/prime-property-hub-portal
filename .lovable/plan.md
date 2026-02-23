

# פישוט בדיקת זמינות 2 - מדלן כמו כולם

## מה ישתנה

הסרת כל הלוגיקה המיוחדת למדלן ב-`check-property-availability-jina/index.ts`. מדלן יעבוד בדיוק כמו yad2 ו-homeless: בקשה אחת עם `X-No-Cache`, retries רגילים, בלי phases, בלי classification.

## שינויים בפונקציה `checkWithJina` (שורות 34-144)

- **הסרת `isMadlan`** ומשתנה זה לגמרי
- **הסרת two-phase logic** - כל המקורות יקבלו phase אחד עם `X-No-Cache: true`
- **הסרת `X-Proxy-Country`** המותנה (שורות 62-64)
- **הסרת `classifyMadlanContent` + `logMadlanScrapeResult`** (שורות 104-113)
- **הסרת `isMadlanHomepage` check** (שורות 122-125)
- **הסרת timeout מותנה** (שורה 52) - כולם יקבלו 30000
- **הסרת attempts מותנה** (שורה 49) - כולם יקבלו maxRetries
- **הסרת break/continue מותנים למדלן** (שורות 82-93, 132-138)

## שינויים ברשימת retryableReasons (שורות 286-299)

הסרת כל הסיבות הספציפיות למדלן:
- `madlan_skeleton`, `madlan_captcha_blocked`, `madlan_homepage_redirect`
- `madlan_blocked`, `madlan_captcha`, `madlan_empty`, `madlan_retryable`

## שינויים בלוגיקת last_seen_at (שורות 339-351)

הסרת הבלוק המיוחד של "Madlan sightings fallback" שבודק `last_seen_at` לנכסי מדלן.

## הסרת imports שלא בשימוש (שורות 6-7)

- הסרת `isMadlanHomepage` מ-availability-indicators
- הסרת `classifyMadlanContent`, `logMadlanScrapeResult` מ-madlan-observability

## התוצאה

הפונקציה `checkWithJina` תהיה פשוטה: בקשה אחת ל-Jina עם `X-No-Cache` + `X-Locale: he-IL`, retries רגילים, בדיקת `isListingRemoved` בלבד. אותו דבר לכל המקורות.

## פריסה

- `check-property-availability-jina`

