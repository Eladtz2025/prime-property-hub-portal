
# הסרת לוגיקת Cache מ-scout-madlan-jina

## הבעיה
הפונקציה עדיין משתמשת בלוגיקת Two-phase (cache ואז fresh) עם `X-No-Cache`. המשתמש מבקש להסיר את כל עניין הקאש ולעבוד בצורה פשוטה.

## השינוי
קובץ: `supabase/functions/scout-madlan-jina/index.ts`

הסרת לוגיקת ה-phases לחלוטין ומעבר ללולאת retries פשוטה אחת, בלי שום header של `X-No-Cache`:

```text
Headers סופיים:
  Accept: text/markdown
  X-Wait-For-Selector: body
  X-Timeout: 30
  X-Locale: he-IL
```

### פירוט טכני
- שורות 22-26: הסרת מערך `phases` והלוגיקה הדו-שלבית
- שורות 28-90: החלפת שתי הלולאות המקוננות (`for phase` + `for attempt`) בלולאה אחת פשוטה של retries
- הסרת `if (phase.noCache)` שמוסיף את `X-No-Cache`
- ניקוי הודעות הלוג מ-"phase.label" למשהו פשוט כמו "attempt X/Y"
- הסרת שורה 89 (הודעת "phase exhausted")

## פריסה
deploy של scout-madlan-jina בלבד.

## מה לא נוגעים
כל שאר הקבצים נשארים כמו שהם.
