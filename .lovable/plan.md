# תוכנית מוצעת: מדל"ן בלי צד שלישי ובלי API חיצוני

## מסקנה
החסימה כרגע היא לא בעיית parser אלא בעיית מקור תעבורה: דפי חיפוש של מדל"ן נחסמים מ-IP של Supabase עם 403/520 גם כשה-headerים נכונים. לכן לא כדאי להמשיך לנסות עוד וריאציות של headers, retries או delays בתוך Edge Function בלבד.

הדרך הסבירה היחידה במסגרת המגבלות שלך היא להעביר את שלב "גילוי המודעות" החוצה מ-Supabase, אבל עדיין בלי צד שלישי: דרך דפדפן של משתמש/משרד או דרך סקריפט מקומי שאנחנו בונים בעצמנו.

## מה נבנה
### שלב 1 — Browser-assisted collector (מומלץ)
נבנה כלי פנימי שמריץ את גילוי המודעות מתוך הדפדפן שלך על דפי החיפוש של מדל"ן, ואז שולח למערכת רק את מזהי המודעות/קישורי ה-detail.

הזרימה תהיה:
```text
Madlan search page in your browser
-> script/bookmarklet/admin helper extracts listing IDs/URLs
-> send IDs to Supabase
-> existing Madlan detail parser enriches each listing
-> saveProperty + dedup + matching כרגיל
```

## למה זו הגישה הכי נכונה
- בלי Jina, Firecrawl, proxy או API חיצוני
- לא תלוי ב-IP של Supabase בשלב החיפוש
- ממחזר את מה שכבר עובד טוב אצלכם: `madlan-detail-parser.ts`
- שינוי ממוקד עם סיכון נמוך יחסית, בלי לשבור את כל pipeline הסקאוט

## מה בדיוק יפותח
1. מנגנון איסוף מדפדפן
   - Bookmarklet או helper page פנימי לאדמין
   - רץ על דף חיפוש של מדל"ן בדפדפן האמיתי
   - אוסף `listingId`, `sourceUrl`, וכמה שדות בסיסיים אם זמינים

2. קליטה מאובטחת ל-Supabase
   - Edge Function פנימית חדשה לקליטת seed results
   - ולידציה של payload
   - שמירה זמנית/ישירה ל-run קיים בלי לשנות לוגיקה עסקית קיימת

3. חיבור ל-pipeline הקיים
   - לכל ID שנקלט נריץ enrichment דרך `madlan-detail-parser.ts`
   - המשך דרך `saveProperty()` כדי לשמור dedup, matching וסטטיסטיקות קיימות

4. תמיכה ב-Scout Run
   - יצירת run ייעודי ל-"madlan-browser"
   - ספירה של pages/items discovered/enriched/saved/blocked
   - תצוגת שגיאות ברורה בדשבורד

5. מצב fallback ידני
   - אם סקריפט הדפדפן לא מצליח לחלץ DOM מלא, נוסיף אפשרות להדביק HTML/JSON של `__NEXT_DATA__` או רשימת URLs ידנית

## שלב 2 — אוטומציה מלאה בלי צד שלישי
אם תרצה אוטומציה אמיתית, נבנה סקריפט מקומי שרץ על מחשב משרד/בית שלך במקום על Supabase:
- Node/Bun script מקומי
- פותח את מדל"ן מה-IP המקומי שלך
- מחלץ IDs
- שולח אותם ל-Edge Function הפנימית
- אפשר לתזמן עם cron / Task Scheduler

זה עדיין "ללא צד שלישי", אבל לא רץ מתוך תשתית Supabase ולכן יש סיכוי טוב יותר לעבור את חסימת ה-IP.

## מה לא כדאי לעשות
- עוד ניסיונות עם `User-Agent` שונים
- עוד וריאציות של `X-Nextjs-Data`
- יותר retries / backoff / jitter בתוך Supabase
- headless browser בענן מאותה תשתית

כל אלה כנראה יישארו חסומים כי הבעיה היא reputation/IP, לא parser.

## סדר ביצוע מומלץ
1. לבנות collector בדפדפן
2. לחבר אותו ל-enrichment הקיים
3. לבדוק על 1-2 עמודי חיפוש בתל אביב
4. אם עובד, להרחיב ל-run מלא
5. רק אם צריך אוטומציה מלאה — לבנות local agent

## פרטים טכניים
- קבצים צפויים להשתנות: פונקציית טריגר הסקאוט, Edge Function חדשה לקליטת IDs, ואולי רכיב admin קטן תחת Property Scout
- לא נדרש שינוי DB אם נוכל להזרים ל-run הקיים; אם יתברר שצריך staging table, אכין מיגרציה נפרדת לאישור
- נשמור על כללי היציבות: לא ניגע ב-`properties` cleanup, לא נשנה dedup business logic, ולא נוסיף תלות חיצונית

## המלצה
אני ממליץ להתחיל ב-Stage 1: Browser-assisted collector. זו הדרך הכי ריאלית לגרום למדל"ן לעבוד שוב בלי צד שלישי ובלי להיתקע שוב בחסימת Supabase IP.
