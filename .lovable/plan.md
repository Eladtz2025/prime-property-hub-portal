
# תיקון פשוט: fetchTimeout קצר מדי

## הבעיה

שורה אחת גורמת לכל הכשלונות:

```
fetchTimeout = 25000  (25 שניות - ה-AbortController שלנו)
X-Timeout = 30        (30 שניות - הזמן שאנחנו מבקשים מ-Jina)
```

אנחנו סוגרים את החיבור אחרי 25 שניות, אבל Jina צריך 30 שניות לרנדר את הדף. כל הלוגים מראים `timeout` אחרי 25 שניות בדיוק.

## התיקון

שינוי מספר אחד בשורה 35 של `scraping-jina.ts`:

```typescript
// מ:
const fetchTimeout = isYad2 ? 25000 : 45000;

// ל:
const fetchTimeout = isYad2 ? 35000 : 45000;
```

35 שניות נותן ל-Jina את ה-30 שניות שהוא צריך + 5 שניות מרווח.

### קובץ שישתנה
- `supabase/functions/_shared/scraping-jina.ts` - שורה 35 בלבד
