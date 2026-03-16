

## הבעיה

ב-`trigger-scout-all-jina` הקריאה ל-`trigger-scout-pages-jina` היא fire-and-forget — אין בדיקת תשובה, אין retry. אם הפונקציה מחזירה 503 (כמו שקרה הלילה בגלל redeploy), הסריקה פשוט לא מתחילה ואף אחד לא יודע.

## הפתרון — retry עם לוג

בקובץ `trigger-scout-all-jina/index.ts`, שורות 80-84, נחליף את ה-fire-and-forget ב:

1. **`await fetch()`** במקום fire-and-forget — ככה נקבל את ה-response
2. **בדיקת status code** — אם 503 או 500, ננסה שוב
3. **עד 2 retries** עם delay של 3 שניות בין ניסיונות
4. **לוג ברור** אם כל הניסיונות נכשלו

```text
לפני:
  fetch(url).catch(err => console.error(...))
  triggered.push(config.name)

אחרי:
  let success = false
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, ...)
    if (res.ok) { success = true; break }
    console.warn(`⚠️ Attempt ${attempt} failed: ${res.status}`)
    await sleep(3000)
  }
  if (success) triggered.push(...)
  else errors.push(...)
```

### קבצים שישתנו
- `supabase/functions/trigger-scout-all-jina/index.ts` — שורות 80-84 בלבד (כ-15 שורות חדשות)

### מה לא ישתנה
- `trigger-scout-pages-jina` — ללא שינוי
- שום לוגיקה אחרת

### סיכון
אפסי — רק מוסיף retry ולוג. במקרה הגרוע זה פשוט מנסה 3 פעמים במקום פעם אחת.

