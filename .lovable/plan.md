

## הבעיה: Edge Function נהרגת לפני שמסיימת

`trigger-availability-check-jina` מנסה לעבד 5 באצ'ים בתוך הרצה אחת. כל באצ' לוקח ~30-45 שניות, סה"כ ~3 דקות. ל-Edge Functions יש מגבלת זמן ריצה של ~150 שניות, אז הפונקציה נהרגת סביב באצ' 5 — **לפני** שהיא מגיעה לקוד שמעדכן את הסטטוס ל-completed ומשרשר ריצה חדשה.

לכן תמיד נתקעת ב-50 נכסים: 5 באצ'ים × 10 = 50, ואז מוות.

### הפתרון: באצ' אחד לכל הרצה + self-chain

במקום לעבד 5 באצ'ים בהרצה אחת, נעבד **באצ' אחד בלבד** (10 נכסים) ואז נשרשר הרצה חדשה. ככה:
- כל הרצה לוקחת ~45 שניות מקסימום — בטוח בתוך ה-timeout
- קוד ה-completion תמיד רץ
- השרשור תמיד קורה
- הריצה לא נתקעת ב-`running`

### שינויים ב-`trigger-availability-check-jina/index.ts`

1. שינוי `MAX_BATCHES_PER_RUN` מ-5 ל-**1**
2. הוספת `run_id` לפרמטרים של self-chain כדי לשמור על המשכיות (אותו run record)
3. כאשר מקבלים `continue_run` עם `run_id`, לא ליצור run חדש אלא להמשיך את הקיים
4. עדכון ה-run record בסוף כל באצ' (properties_checked, inactive_marked) אינקרמנטלית

### זרימה חדשה

```text
Invocation 1: batch 1 (10 props) → update run → self-chain
Invocation 2: batch 2 (10 props) → update run → self-chain
...
Invocation N: last batch → update run → mark completed
```

כל הרצה ~45 שניות, בתוך ה-timeout בבטחה. אם הרצה נפלת — ה-cleanup בן 5 דקות כבר יטפל.

### קבצים לשינוי
- `supabase/functions/trigger-availability-check-jina/index.ts` — ארכיטקטורה חדשה של batch-per-invocation

