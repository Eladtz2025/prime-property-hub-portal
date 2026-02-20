

# הפרדת מערכות ג'ינה לסריקות (Scout)

## מצב נוכחי

3 פונקציות סריקה משתמשות בקובץ משותף אחד (`_shared/scraping-jina.ts`):
- `scout-homeless-jina` (צריך HTML, כותרות ייחודיות)
- `scout-yad2-jina` (צריך Markdown, proxy ישראלי, selector ייחודי)
- `scout-madlan-jina` (צריך Markdown, proxy ישראלי)

**בדיקת הזמינות והשלמת הנתונים כבר עצמאיות** -- לא צריך לגעת בהן.

## מה ישתנה

כל סורק יקבל פונקציית `scrapeWithJina` פנימית בתוך ה-`index.ts` שלו, עם הכותרות הספציפיות שהוא צריך. הקובץ המשותף `_shared/scraping-jina.ts` יישאר לתאימות אבל לא ייובא יותר.

## פירוט טכני

### 1. scout-homeless-jina/index.ts
- הסרת `import { scrapeWithJina } from "../_shared/scraping-jina.ts"`
- הוספת פונקציה פנימית `scrapeHomelessWithJina(url, maxRetries)` עם:
  - `X-Return-Format: html` (צריך HTML לפרסר Cheerio)
  - `X-No-Cache: true`
  - `X-Wait-For-Selector: body`
  - `X-Timeout: 30`
  - `X-Locale: he-IL`
  - **ללא** `X-With-Generated-Alt` (גורם ל-401)

### 2. scout-yad2-jina/index.ts
- הסרת `import { scrapeWithJina } from "../_shared/scraping-jina.ts"`
- הוספת פונקציה פנימית `scrapeYad2WithJina(url, maxRetries)` עם:
  - `Accept: text/markdown`
  - `X-No-Cache: true`
  - `X-Wait-For-Selector: a[href*="/realestate/item/"]`
  - `X-Timeout: 30`
  - `X-Proxy-Country: IL`
  - `X-Locale: he-IL`
  - Timeout של 35 שניות

### 3. scout-madlan-jina/index.ts
- הסרת `import { scrapeWithJina } from "../_shared/scraping-jina.ts"`
- הוספת פונקציה פנימית `scrapeMadlanWithJina(url, maxRetries)` עם:
  - `Accept: text/markdown`
  - `X-No-Cache: true`
  - `X-Wait-For-Selector: body`
  - `X-Timeout: 30`
  - `X-Proxy-Country: IL`
  - `X-Locale: he-IL`

### 4. _shared/scraping-jina.ts
- נשאר כפי שהוא (לא מוחקים) למקרה שיש שימושים עתידיים, אבל אף סורק לא ייבא ממנו

## תוצאה

שינוי בסורק אחד לא ישפיע על אף מערכת אחרת. כל מערכת עצמאית לחלוטין.

