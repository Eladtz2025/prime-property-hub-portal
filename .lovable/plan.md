
# תיקון יד2 עם Jina - הוספת פרוקסי גיאוגרפי

## הבעיה

Jina מתחבר ליד2 בהצלחה (637 תווים), אבל יד2 מזהה אותו כבוט ומציג דף captcha.

ההבדל היחיד מ-Firecrawl שעובד: Firecrawl משתמש ב-`proxy: 'stealth'` (פרוקסי פרמיום), בעוד ש-Jina לא משתמש בפרוקסי בכלל.

## הפתרון - שורה אחת

הוספת `X-Proxy-Country: IL` ל-headers של Jina עבור יד2. Header זה מפעיל פרוקסי residential ישראלי של Jina, שגורם לבקשה להיראות כמו משתמש רגיל מישראל.

### שינוי טכני

קובץ: `supabase/functions/_shared/scraping-jina.ts`

```typescript
// בתוך הבלוק if (isYad2) -- שורות 51-54
// מ:
if (isYad2) {
  headers['X-Timeout'] = '30';
  headers['X-Wait-For-Selector'] = 'a[href*="/realestate/item/"]';
}

// ל:
if (isYad2) {
  headers['X-Timeout'] = '30';
  headers['X-Wait-For-Selector'] = 'a[href*="/realestate/item/"]';
  headers['X-Proxy-Country'] = 'IL';
}
```

### למה זה אמור לעבוד

- Firecrawl עובד ליד2 בזכות פרוקסי stealth (residential)
- Jina מציע את אותה יכולת דרך `X-Proxy-Country` -- פרוקסי residential ממדינה ספציפית
- יד2 אתר ישראלי, אז IP ישראלי residential יראה הכי טבעי

### קובץ שישתנה
- `supabase/functions/_shared/scraping-jina.ts` -- הוספת שורה אחת
