

## תיקון מנגנון שחרור תקיעות בבדיקת זמינות

### הבעיות שזוהו

1. **Timeout גבוה מדי (15 דקות)** — בפועל אפשר לדעת שריצה תקועה אחרי 5 דקות מקסימום. 15 דקות זה מיותר.

2. **Dead zone בין Lock ל-Cleanup** — ה-Lock Check חוסם ריצות חדשות אם יש ריצה מ-10 הדקות האחרונות, אבל ה-Cleanup משחרר רק אחרי 15 דקות. כלומר בין דקה 10 ל-15 אף אחד לא יכול להפעיל ריצה חדשה וגם הישנה לא תנוקה.

3. **Cleanup הוא fire-and-forget** — הקריאה ל-`cleanup-stuck-runs` היא async בלי await, כך שה-Lock Check רץ לפני שהניקוי הסתיים. גם אם הניקוי היה מוצא את הריצה התקועה, הוא לא מספיק לרוץ לפני הבדיקה.

### הפתרון

**קובץ: `supabase/functions/trigger-availability-check-jina/index.ts`**

1. **הורדת timeout inline מ-15 ל-5 דקות** (שורה 54) — ריצות שתקועות מעל 5 דקות יסומנו כ-failed
2. **הורדת Lock Check מ-10 ל-5 דקות** (שורה 67) — כך ה-lock וה-cleanup מסונכרנים
3. **הפיכת inline cleanup ל-await** — כך הניקוי מסתיים לפני ה-Lock Check, ולא race condition

**קובץ: `supabase/functions/cleanup-stuck-runs/index.ts`**

4. **הורדת timeout availability מ-15 ל-5 דקות** (שורה 411) — עקביות עם ה-inline cleanup

### שינויים טכניים

```text
trigger-availability-check-jina/index.ts:
  Line 54: 15 * 60 * 1000 → 5 * 60 * 1000
  Line 57: 'stuck > 15min' → 'stuck > 5min'  
  Line 67: 10 * 60 * 1000 → 5 * 60 * 1000
  Lines 43-51: fire-and-forget fetch → awaited fetch (with try/catch)

cleanup-stuck-runs/index.ts:
  Line 411: 15 * 60 * 1000 → 5 * 60 * 1000
```

Deploy both functions after changes.

