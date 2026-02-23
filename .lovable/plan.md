

# תיקון סגירת ריצות — הסרת retry מ-checkAndFinalizeRun

## הבעיה

הפונקציה `checkAndFinalizeRun` ב-`run-helpers.ts` מנסה לעשות retry לעמודים שנכשלו לפני סגירת הריצה. אם ה-retry קורס (CAPTCHA, timeout), אף אחד לא חוזר לסגור את הריצה — והיא נתקעת ב-"running" לנצח.

## הפתרון

הסרת בלוק ה-retry (שורות 185-265) מ-`checkAndFinalizeRun`. כשכל העמודים הגיעו למצב סופי (completed/failed/blocked) — הריצה נסגרת מיד:
- כל העמודים הצליחו → `completed`
- חלק נכשלו/נחסמו → `partial`

בלי ניסיונות חוזרים, בלי שרשראות שיכולות להישבר.

## פרטים טכניים

### קובץ: `supabase/functions/_shared/run-helpers.ts`

**מוחקים** את שורות 185-265 (כל בלוק ה-retry) — מ:

```text
// Check for failed/blocked pages that haven't been retried yet
const failedPages = pageStats.filter(p => 
  (p.status === 'failed' || p.status === 'blocked') && (!p.retry_count || p.retry_count < 2)
);

if (failedPages.length > 0) {
  // ... ~80 שורות של לוגיקת retry ...
  return; // Don't finalize yet - retries in progress
}
```

**עד** לשורה 268 (שם מתחיל הקוד שסוגר את הריצה — `const hasErrors = ...`).

הלוגיקה שנשארת פשוטה:

```text
// כל העמודים סיימו — סוגרים את הריצה
const hasErrors = pageStats.some(p => p.status === 'failed' || p.status === 'blocked');
const finalStatus = hasErrors ? 'partial' : 'completed';
// ... update run status ...
```

### גם מוחקים את שדה `retry_count` מהממשק `PageStat`

כבר לא צריך אותו בלי מנגנון retry.

### פריסה

כל פונקציות ה-scout שמייבאות מ-`run-helpers.ts` ישתמשו אוטומטית בקוד המעודכן. צריך לפרוס מחדש:
- `scout-madlan-jina`
- `scout-yad2-jina`
- `scout-homeless-jina`
- `scout-madlan`
- `scout-yad2`
- `scout-homeless`

## למה זה הפתרון הנכון

- **פשוט** — מוחקים קוד במקום להוסיף, פחות מקומות שדברים יכולים להישבר
- **אמין** — כל ריצה תמיד נסגרת כשהעמוד האחרון מסיים
- **בטוח** — אם CAPTCHA חסם 5 מ-10 עמודים, הריצה נסגרת כ-partial עם 5 תוצאות — עדיף מריצה תקועה עם 0 תוצאות
- **אין אובדן מידע** — ה-page_stats עדיין מתעדים בדיוק אילו עמודים נכשלו ולמה

