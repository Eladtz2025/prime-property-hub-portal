

## תיקון: המרה אוטומטית של User Token ל-Page Access Token

### הבעיה

אתה מכניס **User Access Token** מ-Graph API Explorer. הטוקן הזה מסוג `USER` ופג תוקף תוך שעות בודדות. הקוד מזהה אותו כ-Short-Lived וחוסם. 

מה שצריך זה **Page Access Token** — שלא פג תוקף. אבל במקום לדרוש ממך ליצור אותו ידנית, **המערכת תמיר אוטומטית** את ה-User Token ל-Page Token.

### פתרון

**קובץ: `SocialAccountSetup.tsx`**

אחרי אימות שהטוקן עובד (שורה 43), לפני בדיקת debug_token:

1. בדוק אם הטוקן הוא מסוג `USER` (דרך debug_token)
2. אם כן — קרא ל-Facebook API להמיר אותו ל-Page Token:
   ```
   GET /{pageId}?fields=access_token&access_token={userToken}
   ```
   זה מחזיר Page Access Token שלא פג תוקף
3. השתמש ב-Page Token מכאן והלאה (לשמירה ול-debug)
4. אם הטוקן כבר מסוג `PAGE` — המשך כרגיל בלי המרה

### סדר פעולות חדש

```text
1. בדוק שהטוקן עובד (GET /{pageId}?fields=name,id)
2. Debug token → בדוק type
3. אם type=USER → המר ל-Page Token
4. Debug את ה-Page Token החדש → קבל expiry אמיתי
5. שמור את ה-Page Token (לא את ה-User Token)
```

### מה זה נותן

- אתה ממשיך להכניס את הטוקן מ-Graph API Explorer כרגיל
- המערכת ממירה אותו אוטומטית ל-Page Token שלא פג
- אין יותר שגיאת "Short-Lived"

**קובץ אחד: `SocialAccountSetup.tsx`**

