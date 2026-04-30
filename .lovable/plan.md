## הבעיה

כרגע `batch_size` ב-`scout_settings` נמצא כנראה על 10. בכל הפעלה של `trigger-availability-check-jina` נמשכים עד 10 נכסים, נשלחים יחד ל-`check-property-availability-jina`, ושם הם מעובדים סדרתית — אבל בפועל זה אומר רצף ארוך של בקשות:
- ~3 נכסי Madlan (Direct) עם 3s דיליי
- ~7 נכסי Jina (yad2/homeless) עם 3s דיליי
- סה"כ ~36 שניות של בקשות → קרוב מדי לטיימאאוט (55s) וגורם ל-429 ב-Jina

## מה אתה רוצה (כפי שהבנתי)

כל הפעלה תעבד **בדיוק 2 נכסים**:
- 1 Madlan
- 1 Jina (yad2 או homeless — הראשון בתור)

עם דיליי של 3s ביניהם (אופציונלי, כי זה רק 2 בקשות).
ה-self-chain ייקח את ה-2 הבאים ב-cron הבא או מיד.

## התוכנית

### 1. שינוי ב-`check-property-availability-jina/index.ts`

בתוך `processPropertiesInParallel`, לאחר הפיצול ל-`madlanProps` ו-`jinaProps`, **לקחת רק את הראשון מכל קבוצה**:

```ts
const madlanToCheck = madlanProps.slice(0, 1);
const jinaToCheck = jinaProps.slice(0, 1);
```

הנכסים שלא נבדקו פשוט לא יקבלו `availability_checked_at` חדש, ולכן ייבחרו שוב ב-batch הבא של ה-cron. (ה-RPC `get_properties_needing_availability_check` בלאו הכי ממיינת לפי גיל.)

### 2. עדכון לוגיקת ה-self-chain ב-`trigger-availability-check-jina/index.ts`

כרגע: `shouldSelfChain = hadFullBatch && remainingDailyQuota > 0 && !endTimeReached`.
ה-`hadFullBatch` בודק `propertyIds.length >= batchSize`. אם `batchSize=10` ואנחנו מביאים 10 אבל בודקים רק 2 — זה ימשיך להשתשרשר וזה בסדר.

**אבל** צריך לוודא שהמונה היומי (`dailyLimit`) מתעדכן נכון: כרגע `processedThisRun = result.checked` מחזיר 2 (לא 10), אז זה כבר עובד נכון.

### 3. הקטנת `batch_size` ב-`scout_settings`

לעדכן את הערך ל-**2** במקום 10, כדי ש:
- `fetchLimit` יביא רק 2 נכסים מהמסד (חיסכון בקריאות DB)
- `hadFullBatch` עדיין יעבוד נכון (2 ≥ 2 → self-chain)

זה יתבצע בעדכון רשומה בטבלת `scout_settings` (קטגוריה `availability`).

### 4. ללא שינוי

- לוגיקת זיהוי הסרה (`isListingRemoved`, parsers) — לא נוגעים. אם נכסים ב-yad2/homeless לא מזוהים כמוסרים זו בעיה נפרדת לטיפול בהמשך.
- מנגנון ה-watchdog, ה-locks, ה-cleanup — נשארים כמו שהם.
- תדירות ה-cron — נשארת כמו שהיא; ה-self-chain ימשיך לרוץ ברצף עד שיגמרו הנכסים או יושג הליימיט היומי.

## תוצאה צפויה

- כל invocation: 1 בקשה ל-Madlan + 1 בקשה ל-Jina = ~6-8 שניות סך הכל
- אין יותר 429 מ-Jina
- אין יותר טיימאאוטים ברמת ה-batch
- הקצב הכולל נשאר דומה (self-chain רץ ברצף)

## קבצים שיושפעו

- `supabase/functions/check-property-availability-jina/index.ts` — הוספת `.slice(0, 1)` לכל קבוצה
- `scout_settings` (DB) — עדכון `batch_size` ל-2 בקטגוריה `availability`

## שאלה לפני ביצוע

האם להשאיר את הדיליי של 3s בין 2 הבקשות (לבטיחות), או לוותר עליו (מהר יותר, פחות בטוח)? ברירת המחדל שלי: **להשאיר 3s**.