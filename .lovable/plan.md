

# תיקון סריקת יד2 עם Jina

## הבעיה

Jina מחזיר רק ~300 תווים ליד2 (במקום ~50,000). הדף של יד2 הוא React SPA -- ה-HTML הראשוני ריק, והתוכן נטען רק אחרי JavaScript hydration. ההגדרות הנוכחיות:

- `X-Wait-For-Selector: body` -- חסר ערך כי `body` קיים מיד, לפני שהתוכן נטען
- `MAX_RETRIES: 1` -- בפועל ניסיון אחד בלי retry
- עמוד 1 ללא `?page=1` (כמו הבעיה שתיקנו במדלן)

## הפתרון -- 4 שינויים

### 1. `scraping-jina.ts` -- הגדרות ספציפיות ליד2

יד2 צריך:
- `X-Wait-For-Selector` מותאם: במקום `body`, לחכות ל-`[class*="feeditem"], [class*="feed_item"], [data-testid="feed-item"]` -- סלקטורים שמופיעים רק אחרי שהליסטינגים נטענים
- `X-Timeout: 45` -- זמן ארוך יותר כדי לתת ל-JS להטען
- retries עם backoff מוגדל

```typescript
// Source-specific headers
if (source === 'yad2') {
  headers['X-Wait-For-Selector'] = '[class*="feeditem"], [class*="feed_item"], [class*="feed-list"]';
  headers['X-Timeout'] = '45';
}
```

### 2. `scout-yad2-jina/index.ts` -- הגדלת retries

```typescript
const YAD2_CONFIG = {
  MAX_RETRIES: 3,  // was 1
  PAGE_DELAY_MS: 15000,  // was 10000
  RETRY_DELAY_MS: 25000,
  MAX_BLOCK_RETRIES: 2,
};
```

### 3. `url-builders.ts` -- הוספת `?page=1` ליד2

כמו שתיקנו במדלן, גם ביד2 עמוד 1 ללא page parameter עלול להחזיר תוכן שונה.

### 4. טסט ידני -- הרצה ובדיקת לוגים

אחרי הדיפלוי, אפעיל ריצה ואבדוק בלוגים אם הסלקטור עובד. אם יד2 משתמש בשם class אחר, אעדכן את הסלקטור.

### אסטרטגיית Fallback

אם הסלקטור הספציפי לא עובד (כי יד2 שינה class names), ננסה:
1. `X-Wait-For-Selector` עם `a[href*="/item/"]` (לינקים לנכסים)
2. אם גם זה לא עובד -- `X-Timeout: 60` עם `X-Wait-For-Selector: body` (פשוט לחכות יותר זמן)

### קבצים שישתנו
- `supabase/functions/_shared/scraping-jina.ts` -- הגדרות ייחודיות ליד2
- `supabase/functions/scout-yad2-jina/index.ts` -- הגדלת retries
- `supabase/functions/_shared/url-builders.ts` -- page=1 ליד2

