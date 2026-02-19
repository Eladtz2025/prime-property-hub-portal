

## הגנה מפני תקיעה ברמת הנכס (Property-Level Timeout)

### הבעיה
כשקריאת Jina לנכס מסוים נתקעת (timeout של השרת, תגובה איטית מאוד), כל ה-Edge Function נתקע איתה. אין מנגנון שמדלג על נכס בעייתי וממשיך הלאה.

### הפתרון (במקום Cron watchdog)
הוספת timeout פנימי של 45 שניות לכל נכס. אם הסריקה של נכס לוקחת יותר מ-45 שניות - מדלגים עליו, מסמנים אותו כ-failed, וממשיכים לנכס הבא.

### שינויים טכניים

**עדכון `supabase/functions/backfill-property-data-jina/index.ts`**

1. הוספת `AbortController` עם timeout של 45 שניות סביב קריאת ה-fetch ל-Jina (שורה 432)
2. אם ה-fetch נכשל עם `AbortError` (timeout), הנכס מסומן כ-`failed` עם `backfill_status = 'failed'` ומדלגים הלאה
3. הוספת מונה `timeout_skipped` ל-`batchStats` כדי לעקוב כמה נכסים דולגו
4. ה-`saveRecentItem` ישמור סטטוס `timeout_skipped` כדי שזה יופיע בממשק

```text
לכל נכס בבאץ':
  |
  v
התחל AbortController (45 שניות)
  |
  v
קריאת Jina fetch
  |
  +-- הצליח תוך 45 שניות --> עיבוד רגיל
  +-- חרג מ-45 שניות --> AbortError --> סימון failed, דילוג, המשך לנכס הבא
```

### מה לא ישתנה
- כל שאר הלוגיקה (self-chain, end time, kill switch, stop) נשארת כמו שהיא
- לא נוסיף Cron job חדש
- ה-X-Timeout של Jina (35 שניות) נשאר, אבל ה-AbortController מגבה אותו למקרה שגם Jina עצמה לא עומדת ב-timeout שלה
