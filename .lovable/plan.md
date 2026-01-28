
# תוכנית תיקון: Homeless Parser - הוספת Fallback ל-Markdown

## הבעיה
הפרסר של Homeless מחפש `tr[type="ad"]` ב-HTML, אבל ה-Firecrawl עם `onlyMainContent: true` מחזיר HTML שלא מכיל את ה-elements האלה. התוצאה: **0 נכסים** מזוהים.

## הלוגים מוכיחים את הבעיה
```
Found 0 potential property rows
Parsed 0 properties
```

## הפתרון
להוסיף fallback ל-Markdown parser כמו שקיים ב-production (`parseHomelessMarkdown`).

## שינויים טכניים

### קובץ: `supabase/functions/_personal-scout/parser-homeless.ts`

**הוספת פונקציית fallback:**

```typescript
export function parseHomelessMarkdown(
  markdown: string,
  propertyType: 'rent' | 'sale'
): ParserResult {
  // Parse markdown when HTML structure is not available
  // Uses price patterns as property separators
  // Extracts: price, rooms, city, neighborhood, floor
}
```

### קובץ: `supabase/functions/personal-scout-worker/index.ts`

**עדכון הלוגיקה:**

```typescript
// לפני:
const homelessResult = await parseHomelessHtml(html, propertyType);

// אחרי:
let homelessResult = await parseHomelessHtml(html, propertyType);
// Fallback to markdown if HTML parsing found nothing
if (homelessResult.properties.length === 0 && markdown.length > 500) {
  console.log('[personal-scout] HTML parse found 0, trying markdown fallback');
  homelessResult = parseHomelessMarkdown(markdown, propertyType);
}
```

## קבצים לעדכון

| קובץ | פעולה |
|------|-------|
| `supabase/functions/_personal-scout/parser-homeless.ts` | הוספת `parseHomelessMarkdown` |
| `supabase/functions/personal-scout-worker/index.ts` | הוספת fallback logic |

## תוצאה צפויה

| מדד | לפני | אחרי |
|-----|------|------|
| Homeless properties parsed | 0 | 10-25 לדף |
| Homeless rooms extraction | 0% | 30-50% |
| Homeless price extraction | 24% | 50-70% |

## הערות
- ה-Markdown parser פחות מדויק מ-HTML parser אבל עדיף על 0 תוצאות
- השינויים ישתלבו עם התיקונים שכבר בוצעו (regex relaxed, neighborhoods expanded)
