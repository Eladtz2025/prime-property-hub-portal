
# שיפור הגדרות Jina לסריקת Yad2 ומדלן

## הבעיה
בבדיקה שנעשתה, יד2 נחסמה (תוכן קצר מדי ~300 תווים) ומדלן עבדה חלקית. הבעיה המרכזית היא בהגדרות ה-Headers של Jina ב-`scraping-jina.ts`.

## מה עובד (מהניסיון עם בדיקת זמינות Jina)
פונקציית `check-property-availability-jina` עובדת עם Yad2 ומדלן **בלי פרוקסי** -- רק עם:
- `X-No-Cache: true`
- `X-Wait-For-Selector: body`
- `X-Timeout: 30`
- `X-Locale: he-IL`

## מה שבור בסריקות
ה-`scraping-jina.ts` הנוכחי:
1. מנסה לקרוא `JINA_PROXY_URL` מ-env -- אבל הסוד הזה **לא קיים** (לא מופיע ברשימת הסודות), אז הוא מתעלם מזה
2. חסר `X-Locale: he-IL` -- שעוזר ל-Jina להבין שהדף בעברית
3. ה-Timeout מוגדר ל-35 שניות -- לזמן ארוך מדי ביחד עם 50s timeout כללי, מה שמותיר מעט מרווח לפעולות אחרות בתוך חלון 60 שניות של Edge Function

## הפתרון -- שינויים ב-`scraping-jina.ts`

### שינוי 1: הוספת `X-Locale: he-IL`
כמו שעובד בבדיקת הזמינות.

### שינוי 2: הורדת retries ליד2 ל-1 (במקום 2)
כדי לחסוך זמן בתוך חלון ה-60 שניות. אם הדף נחסם, ריטראי לא יעזור -- עדיף להמשיך לדף הבא.

### שינוי 3: הורדת Timeout ל-30 שניות
מתאים לחלון ה-60 שניות של Edge Function.

### שינוי 4: הוספת `X-With-Generated-Alt: false`
מונע מ-Jina לבזבז זמן על ניתוח תמונות -- לא רלוונטי לסריקת נכסים.

### שינוי 5: הסרת הפרוקסי הלא-קיים
הסוד `JINA_PROXY_URL` לא מוגדר. במקום לשלוח header ריק, פשוט לא נשלח אותו. אם בעתיד נרצה פרוקסי, נגדיר את הסוד.

## קבצים שישתנו

### `supabase/functions/_shared/scraping-jina.ts`
- הוספת `X-Locale: he-IL`
- הוספת `X-With-Generated-Alt: false`
- שינוי `X-Timeout` מ-35 ל-30
- שינוי timeout כללי מ-50s ל-45s
- הסרת לוגיקת `JINA_PROXY_URL`

### `supabase/functions/scout-yad2-jina/index.ts`
- שינוי `MAX_RETRIES` מ-2 ל-1 (ריטראי לא עוזר נגד חסימות, רק בזבוז זמן)
- שינוי `PAGE_DELAY_MS` מ-15000 ל-10000 (מהירות סבירה בלי פרוקסי)

### `supabase/functions/scout-madlan-jina/index.ts`
- שינוי `NEXT_PAGE_DELAY` מ-8000 ל-10000 (השהיה ארוכה יותר למניעת rate limiting)

## בדיקה
אחרי הפריסה, אפעיל קונפיגורציה אחת מ-Yad2 ואחת ממדלן ואבדוק בלוגים שהתוכן חוזר תקין.
