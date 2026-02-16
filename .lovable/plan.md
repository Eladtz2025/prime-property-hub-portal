

## תיקון מערכת סיבוב מפתחות Firecrawl בבדיקת זמינות

### הבעיה

שתי בעיות קשורות:

1. **לולאה אינסופית בסיבוב מפתחות**: כש-4 המפתחות ב-DB מותשים, המערכת נופלת למפתח הסביבה (id=null). כשגם הוא נחסם, `markKeyExhausted(null)` לא עושה כלום, ו-`getActiveFirecrawlKey` מחזירה שוב את אותו מפתח - לולאה אינסופית עד ה-timeout.

2. **נכסים נבדקים שוב ושוב בלי התקדמות**: התוצאות מסומנות כ-retryable (`all_keys_exhausted`) אז הנכסים נשארים בתור, אבל `availability_checked_at` לא מתעדכן - לכן הדשבורד מראה מספר נמוך.

### הפתרון

#### קובץ 1: `supabase/functions/_shared/firecrawl-keys.ts`

הוספת מנגנון שמזהה שמפתח ה-env כבר נכשל ומונע fallback חוזר:

- הוספת פונקציה `getActiveFirecrawlKeyWithFallbackGuard` שמקבל פרמטר `skipEnvFallback` 
- או: שינוי `getActiveFirecrawlKey` כך שתזרוק שגיאה כשאין מפתחות DB פעילים **וגם** המפתח מה-env כבר נכשל (נעקוב אחרי זה עם פרמטר `envKeyFailed`)

#### קובץ 2: `supabase/functions/check-property-availability/index.ts`

שינוי לוגיקת הרוטציה (שורות 172-198):

- אם `currentKey.id` הוא `null` (מפתח env) וקיבלנו rate limit - לא לנסות rotation, אלא ישר לעצור עם `all_keys_exhausted`
- הוספת בדיקה פשוטה: `if (currentKey.id === null && needsKeyRotation)` → break מהלולאה

#### קובץ 3: `supabase/functions/trigger-availability-check/index.ts`

הוספת זיהוי של `all_keys_exhausted` בתוצאות הבאצ':

- אם כל/רוב התוצאות הן `all_keys_exhausted`, לעצור את ה-self-chain ולעדכן סטטוס הריצה ל-`stopped` עם הודעת שגיאה מתאימה

### פירוט טכני

**`check-property-availability/index.ts` - שורות 172-198:**
```typescript
if (needsKeyRotation) {
  // If the current key is the env var fallback (id=null),
  // we can't rotate further — stop immediately
  if (currentKey.id === null) {
    console.error('All Firecrawl keys exhausted (including env fallback)');
    for (const prop of properties.slice(i)) {
      results.push({ id: prop.id, isInactive: false, reason: 'all_keys_exhausted', error: true });
    }
    break;
  }
  
  // DB key rotation (existing logic)
  await markKeyExhausted(supabase, currentKey.id);
  try {
    currentKey = await getActiveFirecrawlKey(supabase);
    // ... retry chunk
  } catch {
    // No more keys
    break;
  }
}
```

**`trigger-availability-check/index.ts` - אחרי עיבוד באצ':**
```typescript
// If batch results show all_keys_exhausted, stop self-chaining
if (result.results?.every(r => r.reason === 'all_keys_exhausted')) {
  console.error('All Firecrawl keys exhausted, stopping run');
  // Update run status and break
}
```

### איפוס מפתחות מותשים

בנוסף, מפתח "Firecrawl (1)" מותש מאז 15/02 בשעה 21:34 - כבר עברו יותר מ-24 שעות, אז מנגנון ה-reset האוטומטי היה צריך לאפס אותו. ייתכן שהבעיה היא שמנגנון ה-reset רץ רק בתחילת `getActiveFirecrawlKey`, אבל כשהוא נופל ישר ל-env fallback הוא לא מגיע לאפס אותם. צריך לוודא שה-reset מתבצע תמיד.

