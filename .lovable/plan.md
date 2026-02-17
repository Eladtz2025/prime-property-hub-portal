
# ניסוי Jina AI Reader לבדיקת זמינות

## מה זה Jina Reader?
שירות חינמי שמחזיר Markdown מכל URL - פשוט שולחים GET request ל-`https://r.jina.ai/{url}` ומקבלים תוכן נקי. בלי API key, בלי הגדרות מורכבות.

## התוכנית
ניצור Edge Function חדשה בשם `test-jina-availability` שתבדוק מספר נכסים עם Jina Reader במקום Firecrawl, ותחזיר את התוצאות להשוואה - בלי לשנות כלום בנכסים עצמם.

## איך זה יעבוד

1. הפונקציה תשלוף 5 נכסים אקטיביים מהדאטאבייס (מקורות שונים - yad2, madlan, homeless)
2. לכל נכס, תשלח GET request ל-`https://r.jina.ai/{source_url}`
3. תריץ את אותן בדיקות זיהוי (`isListingRemoved`, `isMadlanHomepage`)
4. תחזיר דוח השוואה: האם Jina מצליחה להביא תוכן, כמה זמן לקח, האם הזיהוי עובד

## מה הפונקציה לא תעשה
- לא תשנה שום נתון בדאטאבייס
- לא תסמן נכסים כלא אקטיביים
- רק תחזיר תוצאות לבדיקה

## דוגמת תוצאה צפויה

```text
{
  "results": [
    {
      "id": "abc123",
      "source": "yad2",
      "source_url": "https://yad2.co.il/...",
      "jina_status": 200,
      "content_length": 4500,
      "elapsed_ms": 3200,
      "detection_result": "content_ok",
      "content_preview": "first 300 chars..."
    },
    {
      "id": "def456",
      "source": "madlan",
      "source_url": "https://madlan.co.il/...",
      "jina_status": 200,
      "content_length": 8200,
      "elapsed_ms": 2100,
      "detection_result": "madlan_homepage_redirect",
      "content_preview": "first 300 chars..."
    }
  ]
}
```

## פרטים טכניים

### קובץ חדש: `supabase/functions/test-jina-availability/index.ts`
- GET request ל-Jina עם headers מתאימים (Accept: text/markdown, locale: he-IL)
- Timeout של 15 שניות לכל נכס
- שימוש באותן פונקציות זיהוי מ-`_shared/availability-indicators.ts`
- מחזירה preview של התוכן (300 תווים ראשונים) כדי שנוכל לבדוק את האיכות

### עדכון: `supabase/config.toml`
- הוספת הפונקציה החדשה עם `verify_jwt = false` (לצורך בדיקה)

### בלי שינויים ב:
- `check-property-availability` (נשאר כמו שהוא)
- `trigger-availability-check` (נשאר כמו שהוא)
- טבלאות בדאטאבייס

### Jina Reader Headers
Jina תומכת ב-headers מיוחדים שיכולים לשפר את התוצאות:
- `X-Return-Format: markdown` - מבטיח פורמט markdown
- `X-Locale: he-IL` - תוכן בעברית
- `X-Timeout: 15` - timeout בשניות

### Rate Limits של Jina (חינמי)
- 20 requests per minute ללא API key
- לכן נבדוק רק 5 נכסים בריצה, אחד אחרי השני (לא במקביל)

## אחרי הניסוי
אם התוצאות טובות, נוכל ליצור גרסה מלאה של `check-property-availability` שמשתמשת ב-Jina — או מערכת hybrid שמנסה קודם Jina ונופלת ל-Firecrawl.
