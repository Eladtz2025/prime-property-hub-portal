

## הגדרת WhatsApp לכל משתמש — Green API אישי בפרופיל

### הרעיון
כרגע כל שליחת WhatsApp עוברת דרך ה-Green API שלך (אלעד). משתמשים אחרים כמו טלי לא יכולים לשלוח הודעות כי זה לא הווטסאפ שלהם. הפתרון: כל משתמש יוכל להגדיר את ה-Green API שלו בהגדרות הפרופיל, ואם לא הגדיר — יקבל הודעה שצריך לחבר WhatsApp.

### שינויים

**1. מיגרציה — הוספת עמודות לטבלת `profiles`**
- `green_api_instance_id` (text, nullable)
- `green_api_token` (text, nullable)

**2. `src/components/UserSettings.tsx` — הוספת שדות WhatsApp**
- סקשן חדש "חיבור WhatsApp" עם שני שדות: Instance ID ו-API Token
- הסבר קצר איך להשיג את הפרטים מ-Green API
- שמירה ב-profiles יחד עם שאר הפרטים

**3. `supabase/functions/whatsapp-send/index.ts` — שליפת credentials מהפרופיל**
- לקרוא את ה-JWT מה-Authorization header כדי לזהות את המשתמש
- לשלוף את `green_api_instance_id` ו-`green_api_token` מטבלת profiles של המשתמש
- fallback: אם למשתמש אין credentials → להחזיר שגיאה ברורה ("WhatsApp לא מחובר")
- להסיר שימוש ב-env vars `GREEN_API_TOKEN` / `GREEN_API_INSTANCE_ID` עבור שליחת הודעות (להשאיר רק ל-notify functions)

**4. `src/hooks/useWhatsAppSender.ts` — טיפול בשגיאה**
- אם חוזרת שגיאה "WhatsApp לא מחובר" — להציג toast עם הפניה להגדרות

**5. `src/types/auth.ts` — עדכון UserProfile**
- הוספת `green_api_instance_id` ו-`green_api_token`

### מה לא משתנה
- `notify-new-lead` ו-`notify-form-signed` — ממשיכים עם ה-env vars הגלובליים (התראות מערכת)
- `whatsapp-status` — נשאר כמו שהוא
- כל ה-UI של שליחת WhatsApp — נשאר זהה, רק ה-backend מביא credentials מהפרופיל

### אבטחה
- ה-tokens נשמרים ב-profiles עם RLS — כל משתמש רואה ומעדכן רק את שלו
- ב-edge function: אימות JWT + שליפת credentials מהפרופיל בלבד

