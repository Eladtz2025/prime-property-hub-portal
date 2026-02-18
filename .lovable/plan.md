
# תיקון בדיקת זמינות מדלן - התאמה ל-Jina Free Tier

## הבעיה
Jina Free Tier מגביל ל-20 בקשות לדקה. ההגדרות הנוכחיות שולחות בקשות מהר מדי:
- `delay_between_batches_ms`: 1500ms (1.5 שניות בלבד בין באצ'ים)
- `firecrawl_max_retries`: 1 (אין ניסיון חוזר בכלל על 429)
- `concurrency_limit`: 2 (2 בקשות במקביל)
- Self-chain עם 3 שניות בלבד

תוצאה: Batch 2 כבר מקבל 429 (rate limited), ומסומן כ-`rate_limited` בלי ניסיון חוזר.

## הפתרון

### 1. עדכון הגדרות DB
שינוי ההגדרות ב-`scout_settings`:

```text
delay_between_batches_ms: 1500 -> 8000  (8 שניות בין באצ'ים)
firecrawl_max_retries: 1 -> 3           (3 ניסיונות חוזרים על 429)
firecrawl_retry_delay_ms: 2000 -> 5000  (5 שניות המתנה לפני ניסיון חוזר)
```

### 2. שינוי קוד: השהייה ארוכה יותר בין self-chains
ב-`trigger-availability-check-jina/index.ts`:
- שינוי ה-sleep לפני self-chain מ-3000ms ל-10000ms (10 שניות)

### 3. שינוי קוד: השהייה בין בקשות בתוך באצ'
ב-`check-property-availability-jina/index.ts`:
- הוספת delay של 3 שניות בין בקשות בודדות בתוך כל chunk (כרגע שולח 2 במקביל ללא delay)

### 4. איפוס נכסים שנתקעו עם rate_limited
SQL migration לאיפוס נכסים שסומנו כ-rate_limited בריצה הנוכחית.

### פירוט טכני

**check-property-availability-jina -- processPropertiesInParallel:**
במקום לשלוח את כל ה-chunk במקביל, לשלוח אותן אחת אחרי השנייה עם delay:
```typescript
// במקום Promise.allSettled במקביל:
for (const prop of chunk) {
  const result = await checkSingleProperty(prop, settings, perPropertyTimeout);
  results.push(result);
  // Wait between requests to respect rate limit
  await new Promise(r => setTimeout(r, 3000));
}
```

**trigger-availability-check-jina -- self-chain delay:**
```typescript
// לפני: await sleep(3000);
await sleep(10000);
```

**SQL Migration:**
```sql
UPDATE scout_settings SET setting_value = '8000' 
WHERE category = 'availability' AND setting_key = 'delay_between_batches_ms';

UPDATE scout_settings SET setting_value = '3' 
WHERE category = 'availability' AND setting_key = 'firecrawl_max_retries';

UPDATE scout_settings SET setting_value = '5000' 
WHERE category = 'availability' AND setting_key = 'firecrawl_retry_delay_ms';

UPDATE scouted_properties 
SET availability_checked_at = NULL, availability_check_reason = NULL, availability_check_count = 0
WHERE availability_check_reason = 'rate_limited' AND is_active = true;
```

### קבצים שישתנו
- `supabase/functions/check-property-availability-jina/index.ts`
- `supabase/functions/trigger-availability-check-jina/index.ts`
- SQL migration להגדרות ולאיפוס נכסים

### Deploy
- `check-property-availability-jina`
- `trigger-availability-check-jina`

### תוצאה צפויה
- כל 3 שניות בקשה אחת = ~20 בקשות לדקה (בדיוק בגבול)
- ניסיונות חוזרים על 429 במקום כישלון מיידי
- השהייה ארוכה יותר בין self-chains למניעת הצטברות
