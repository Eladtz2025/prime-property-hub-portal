

# עדכון content-script.js עם הקוד של המתכנת

## סיכום
הקוד של המתכנת טוב מאוד — 5 אסטרטגיות חיפוש ל-composer ו-3 לכפתור פרסום. אני אחליף את `extension/content-script.js` בקוד שלו, עם כמה שיפורים קטנים:

## שינויים שאבצע

### 1. החלפת `extension/content-script.js`
הקוד המלא שהמתכנת כתב — כמעט כמו שהוא, עם תיקונים:
- **הוספת `selectAll` + `delete` לפני הקלדה** — הקוד המקורי עושה `selectAll` בלי `delete` אחריו, מה שישאיר את הטקסט הקודם
- **תיקון `clipboardPaste`** — `document.execCommand('paste')` לא עובד בלי אירוע paste אמיתי; אשפר את ה-fallback
- **הוספת logging לכל שלב** כדי שיהיה קל לדבג ב-service worker console

### 2. תיקון `extension/popup.html` — CSP fix
הכפתורים משתמשים ב-`onclick` inline שנחסם ע"י Chrome CSP. אעביר ל-`addEventListener` ב-`popup.js` כדי ש"הפעל עכשיו" באמת יעבוד.

### 3. אריזה מחדש ל-ZIP
עדכון `public/ct-market-publisher.zip` עם הקבצים המעודכנים.

## מה לא משתנה
- `background.js` — עובד מצוין
- `manifest.json` — ללא שינוי
- Edge Function — ללא שינוי

