

# תיקון שגיאת Import ב-scout-madlan-jina

## הבעיה
בעדכון האחרון, ה-import של הפרסר שונה בטעות מ-`parseMadlanMarkdown` (M גדולה - נכון) ל-`parsemadlanMarkdown` (m קטנה - שגוי). זה גורם לקריסה מיידית של הפונקציה.

בנוסף, הריצה האחרונה (`86a3dfda`) תקועה בסטטוס `running` כי הפונקציה קרסה לפני שעדכנה את הסטטוס.

## התיקונים

### 1. תיקון Import - `supabase/functions/scout-madlan-jina/index.ts`

שורה 51 - החזרת ה-M הגדולה:
```
// שגוי (מצב נוכחי):
import { parsemadlanMarkdown } from "../_experimental/parser-madlan.ts";

// נכון:
import { parseMadlanMarkdown } from "../_experimental/parser-madlan.ts";
```

שורה 148 - גם השימוש בפונקציה צריך M גדולה:
```
// שגוי:
const parseResult = parsemadlanMarkdown(markdown, ...)

// נכון:
const parseResult = parseMadlanMarkdown(markdown, ...)
```

### 2. סגירת הריצה התקועה
עדכון ריצה `86a3dfda` מ-`running` ל-`failed`.

### 3. פריסה מחדש
פריסת `scout-madlan-jina` לאחר התיקון.

