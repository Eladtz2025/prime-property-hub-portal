

# בדיקה חיה — Detail Parser להומלס

## מצב נוכחי
- הקוד נכתב ודופלי: `homeless-detail-parser.ts` + שילוב ב-`scout-homeless-jina`
- **הסורק עדיין לא רץ** מאז הדיפלוי — אין לוגים
- צריך לוודא שהפארסר עובד נכון לפני שהסריקה הבאה רצה

## מה אעשה

### שלב 1 — בדיקת Unit על הפארסר
אכתוב test file (`supabase/functions/_shared/homeless-detail-parser_test.ts`) שמריץ את `parseHomelessDetailHtml` על HTML מדומה עם `IconOption on/off` — כדי לוודא שהלוגיקה עובדת.

### שלב 2 — בדיקה חיה על 5 נכסים
אריץ סקריפט שקורא ל-`fetchHomelessDetailFeatures` על 5 URLs אמיתיים מהומלס ומדפיס את התוצאות. אבחר נכסים מה-DB שיש להם `source_url` של הומלס.

### שלב 3 — דיווח תוצאות
לכל נכס אציג:
- לינק
- features שהתקבלו (on/off)
- size + floor
- כדי שתוכל לאמת מול האתר

## אין שינויי קוד
רק בדיקות — הקוד כבר דופלי ומוכן.

