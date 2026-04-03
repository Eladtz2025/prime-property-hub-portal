
## תיקון אמיתי לשגיאת הפרסום שעדיין מופיעה

### אבחון
מהקוד והלוגים ברור שה-toast שאתה רואה עכשיו (`Edge Function returned a non-2xx status code`) הוא רק הסימפטום האחרון, לא הבעיה המקורית.

השרשרת כרגע היא:
1. ניסיון הפרסום הראשון נכשל מול Facebook עם:
   `Error validating access token: Session has expired...`
2. `social-publish` מסמנת את החשבון כ-`is_active = false`
3. בגלל retry גלובלי ב-`src/components/DataProvider.tsx`, אותה מוטציה רצה שוב עוד פעמיים
4. מהניסיון השני כבר אין חשבון פעיל, ולכן ה-Edge Function מחזירה 400
5. בפרונט מתקבלת השגיאה הגנרית במקום סיבת הכשל האמיתית

כלומר: זה לא נראה כמו “לימיט פוסטים יומי”. הלוגים מצביעים ספציפית על token/session expired.

### שורש הבעיה בקוד הנוכחי
ב-`src/components/social/SocialAccountSetup.tsx` יש היום המרה:
- USER token -> PAGE token

אבל חסר שלב קריטי:
- **Short-lived USER token -> Long-lived USER token** דרך `/oauth/access_token` עם `fb_exchange_token`

בלי זה, אפשר לקבל Page Token שעובד רגעית אבל עדיין קשור לחיי ה-User Token ולכן יפוג מהר.

בנוסף:
- האימות נעשה כרגע מהדפדפן ישירות מול Graph API
- `debug_token` נקרא עם אותו token במקום App Access Token, ולכן המידע על expiry עלול להיות מטעה
- `token_expires_at` נשמר כרגע לפי `data_access_expires_at`, ולכן אפשר לראות UI של “51 ימים” למרות שבפועל הפרסום נכשל

### מה אבנה
| # | קובץ | שינוי |
|---|------|-------|
| 1 | `supabase/functions/verify-meta-connection/index.ts` | Edge Function חדשה לאימות/המרת Meta token בצד שרת |
| 2 | `src/components/social/SocialAccountSetup.tsx` | להעביר את כל תהליך האימות/ההמרה מהקליינט ל-Edge Function |
| 3 | `src/hooks/useSocialPosts.ts` | לבטל retries ל-`usePublishPost` כדי שלא יהיו 3 ניסיונות פרסום אוטומטיים |
| 4 | `supabase/functions/social-publish/index.ts` | להחזיר שגיאות עסקיות כ-`success: false` עם הודעה ברורה, ולא 400 גנרי |
| 5 | `src/components/social/SocialAccountSetup.tsx` / `SocialDashboard.tsx` | לתקן את תצוגת הסטטוס כך שלא תציג expiry מטעה |

### תהליך חדש ונכון של חיבור Meta
```text
1. המשתמש מדביק token
2. Edge Function בודקת מה סוג הטוקן
3. אם זה USER token קצר:
   מחליפים ל-Long-Lived USER token עם App ID + App Secret
4. מפיקים ממנו Page Access Token
5. עושים debug עם App Access Token אמיתי
6. שומרים DB עם ערכי תוקף אמינים + is_active=true
```

### פירוט טכני
#### 1) Edge Function חדשה לאימות Meta
אוסיף פונקציה חדשה שתבצע:
- אימות `pageId`
- זיהוי סוג token
- החלפה ל-Long-Lived User Token אם צריך
- הפקת Page Access Token
- `debug_token` עם App Access Token תקין
- החזרת payload מסודר לפרונט:
  - `page_name`
  - `page_access_token`
  - `ig_user_id` אם רלוונטי
  - `expires_at` אמיתי אם יש
  - `is_permanent` / `expiry_unknown` אם אין פקיעה ידועה

דרישת קדם טכנית:
- `META_APP_ID`
- `META_APP_SECRET`
כסודות ב-Supabase

#### 2) תיקון `SocialAccountSetup.tsx`
במקום fetch ישיר ל-Facebook מהדפדפן:
- הקריאה תהיה רק ל-Edge Function
- הפרונט לא יכיל לוגיקת exchange/debug
- יישמר תמיד ה-Page Token הסופי בלבד
- `is_active` יישמר כ-`true` בכל חידוש תקין

#### 3) תיקון ה-toast הגנרי
ב-`supabase/functions/social-publish/index.ts`:
- שגיאות צפויות כמו:
  - token expired
  - no active account
  - missing IG user id
  
  יוחזרו כ-JSON עם:
```ts
{ success: false, error: "...", error_code: "token_expired" }
```
ולא כ-HTTP 400

כך `usePublishPost()` יוכל להציג את ההודעה האמיתית במקום `Edge Function returned a non-2xx status code`.

#### 4) ביטול retries בפרסום
ב-`src/hooks/useSocialPosts.ts` אגדיר ל-`usePublishPost`:
- `retry: false`

זה חשוב כי פרסום הוא פעולה עם side effects:
- לא נכון לנסות אותה 3 פעמים אוטומטית
- זה גם מסתיר את השגיאה הראשונה
- ובמקרים אחרים עלול אפילו ליצור ניסיונות פרסום כפולים

#### 5) תיקון סטטוס “51 ימים”
אעדכן את תצוגת החיבור כך שלא תציג מספר ימים על בסיס שדה לא אמין.
במקום זה:
- אם יש expiry אמיתי: נציג ימים
- אם אין expiry אמין/ידוע: נציג משהו כמו “מחובר” או “ללא פקיעה ידועה”
- אם האימות האחרון נכשל: נציג סטטוס לא פעיל בצורה ברורה

### מה זה יפתור בפועל
- לא תראה יותר “מחובר + 51 ימים” כשבפועל הטוקן מת
- הדבקת token חדש באמת תפיק token יציב יותר
- אם יש כשל, תראה את הסיבה האמיתית ולא שגיאת Edge Function גנרית
- לא יהיו retries אוטומטיים שמבלבלים את המצב

### תוצאה צפויה אחרי היישום
1. אתה מדביק token פעם אחת
2. המערכת ממירה ושומרת אותו נכון
3. הסטטוס משקף את המציאות
4. פרסום נכשל רק אם באמת יש בעיה
5. ואם יש בעיה — ההודעה תהיה ברורה ומדויקת

### הערת היקף
זה כבר לא “עוד UPDATE ל-`is_active`”, אלא תיקון מלא של מחזור החיים של טוקני Meta:
- אימות נכון
- המרה נכונה
- שמירה נכונה
- שגיאות נכונות
- UI נכון
