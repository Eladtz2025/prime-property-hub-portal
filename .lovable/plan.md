
# תיקון ארכיטקטורת בדיקת לינקים שבורים - Sequential Processing

## הבעיה הנוכחית

הפונקציה `trigger-availability-check` משתמשת ב-**fire-and-forget**:
- שולחת batch ל-`check-property-availability` בלי לחכות לתשובה
- מיד אחרי זה עושה self-trigger עם כל הנכסים הנותרים
- התוצאה: 118 batches נשלחים כמעט במקביל → Firecrawl קורס מ-timeouts

## הפתרון: Sequential Processing

שינוי הזרימה כך שכל batch יסתיים לפני שמתחיל הבא:

```text
┌─────────────────────────────────────────────────────────────┐
│                    trigger-availability-check                │
├─────────────────────────────────────────────────────────────┤
│  1. קבל רשימת property_ids (או טען מ-DB)                    │
│  2. חלק ל-batches של 50                                      │
│  3. שלח batch ראשון ל-check-property-availability            │
│  4. await! - חכה לתשובה                                      │
│  5. אם יש עוד batches → self-trigger עם הנותרים             │
│  6. החזר תשובה                                               │
└─────────────────────────────────────────────────────────────┘
```

## שינויים נדרשים

### קובץ: `supabase/functions/trigger-availability-check/index.ts`

**שינוי 1: שורות 104-134** - במקום fire-and-forget, לעשות await לבדיקת הנכסים

לפני (fire-and-forget):
```typescript
fetch(`${supabaseUrl}/functions/v1/check-property-availability`, {
  ...
}).then(response => { ... });  // לא ממתינים!
```

אחרי (sequential):
```typescript
const response = await fetch(`${supabaseUrl}/functions/v1/check-property-availability`, {
  ...
});
const result = await response.json();
console.log(`✅ Batch completed: ${result.checked} checked, ${result.marked_inactive} inactive`);
```

**שינוי 2: שורות 136-160** - self-trigger נשאר fire-and-forget (כדי לא לחסום)

ה-self-trigger לעצמו יישאר fire-and-forget כי:
- זו הדרך היחידה להמשיך את התהליך בלי timeout
- כל ריצה תטפל ב-batch אחד בלבד
- הריצה הבאה תתחיל רק אחרי שהנוכחית סיימה

**שינוי 3: הוספת timeout protection**

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 50000); // 50s timeout

try {
  const response = await fetch(url, { signal: controller.signal, ... });
  // ...
} finally {
  clearTimeout(timeoutId);
}
```

## זרימה חדשה

```text
ריצה 1:  [batch 1 - 50 נכסים] → await → self-trigger(5827 נותרים)
ריצה 2:  [batch 2 - 50 נכסים] → await → self-trigger(5777 נותרים)
ריצה 3:  [batch 3 - 50 נכסים] → await → self-trigger(5727 נותרים)
...
ריצה 118: [batch 118 - 27 נכסים] → await → סיום!
```

## יתרונות

| היבט | לפני | אחרי |
|------|------|------|
| עומס על Firecrawl | 118 batches במקביל | batch אחד בכל פעם |
| Timeouts | רבים | אפס (כל batch מסתיים ב-50s) |
| שליטה | אין | מלאה - לוגים ברורים לכל batch |
| אמינות | נמוכה | גבוהה |

## זמן ריצה משוער

- 50 נכסים × ~2 שניות לנכס = ~100 שניות לbatch
- 118 batches = ~3.3 שעות לסריקה מלאה
- אבל: התהליך יסתיים בהצלחה במקום לקרוס

## קבצים לעריכה

| קובץ | שינוי |
|------|-------|
| `supabase/functions/trigger-availability-check/index.ts` | שינוי מ-fire-and-forget ל-await |

