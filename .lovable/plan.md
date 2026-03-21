

## שיפור קריאות המוניטור + תיקון באגים

### שאלה 1: קריאות הפיד

**בעיות שזיהיתי:**
- מחיר וחדרים מופיעים **פעמיים** — גם ב-chips בצד שמאל (`extra.price`, `extra.rooms`) וגם בטקסט details ("₪4950K | 4 חד׳")
- חסר badge **פרטי/תיווך** — מידע שכבר קיים ב-DB אבל לא נשלף
- שורת details מכילה URL מקוצר שלא מוסיף ערך (בזמינות) — רעש
- ה-neighborhood מופיע גם ב-primary (כתובת) וגם ב-details — כפילות
- אין badge קומה שנראה טוב

**פתרון (`LiveFeedTab.tsx` + `useMonitorData.ts`):**

**useMonitorData.ts** — הוספת `is_private` לשדות הנשלפים:
- בשאילתות `scanProperties`, `dedupProperties`, `matchingProperties` — הוספת `is_private` ל-select
- הוספת `is_private` ל-`FeedItem.extra`
- בפיד availability — כבר לא שולחים מחיר/חדרים ב-details string, רק ב-extra
- בפיד scan/dedup/matching — הסרת מחיר/חדרים/שכונה מ-details, השארת רק מידע ייחודי

**LiveFeedTab.tsx** — שיפור תצוגת שורה ראשונה בדסקטופ:
- הסרת chips של `extra.price` ו-`extra.rooms` מצד שמאל
- במקום זה, **שורה 2 מחודשת** מציגה: `[פרטי/תיווך] | [שכונה] | [₪מחיר] | [חדרים]ח׳ | [קומה]`
- כל אלמנט ב-badge קטן ונקי עם צבע מתאים
- הסרת URL מקוצר מ-details של availability

### שאלה 2: סריקות אתמול 3/4

**הבעיה**: homeless חוזר עם `status: 'partial'` (לא `completed`) כי הדף האחרון לא נסרק. הלוגיקה בודקת `runs.some(r => r.status === 'completed')` — אז partial נחשב ככישלון.

**פתרון (`useMonitorData.ts`, שורות 1033):**
```
const anyCompleted = runs.some(r => r.status === 'completed' || r.status === 'partial');
```
סריקה partial היא עדיין סריקה שבוצעה — רוב הדפים הצליחו.

### שאלה 3: התאמות 531

**זה בעצם נכון** — ריצת ההתאמות של היום (05:00) מצאה 531 התאמות מתוך 3,960 נכסים. זה מספר ההתאמות הכולל, לא מספר הנכסים שהותאמו. הטקסט "התאמות אחרונות" נכון.

אבל **ה-tab badge** מציג 531 כי הוא סופר את כל ה-feedItems מסוג matching, שכוללים כל הנכסים עם matched_leads מ-24 שעות. זה מספר *נכסים* עם התאמות, לא *מספר ההתאמות*.

**פתרון**: ב-tab badge — אם הטאב matching, להשאיר את המספר כמו שהוא (זה כמות הנכסים עם התאמות, מידע שימושי). אין באג כאן, אלא אי-בהירות. אוסיף tooltip ל-matching card בפיד שמבהיר: "531 התאמות = סך כל הזוגות נכס-לקוח".

### סיכום שינויים
1. **`useMonitorData.ts`**: הוספת `is_private` לשאילתות + ל-FeedItem.extra, ניקוי details מכפילויות, תיקון partial
2. **`LiveFeedTab.tsx`**: עיצוב מחדש של שורה 2 עם badges נקיים (פרטי/תיווך, שכונה, מחיר, חדרים, קומה), הסרת chips כפולים משורה 1

