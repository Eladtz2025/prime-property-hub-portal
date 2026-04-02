

## תיקון שני באגים: כתובת בפוסט + אפשרות פרסום Private בפייסבוק

### בעיה 1 — כתובת הרחוב עדיין מופיעה
הצילום מפייסבוק מראה "בן יהודה 110" בפוסט. מקור הבעיה: בפונקציה `buildPreviewText` (שורה 395), ה-default template הוא `'{address}'` ו-`{address}` עדיין מוחלף ב-`prop.address`. בנוסף ה-hashtags מציגים `#{neighborhood} #{city}` כטקסט לא מפוענח.

**תיקון:**
- `buildPreviewText`: שנה default template ל-`'{neighborhood}, {city}'` במקום `'{address}'`
- `fillPropertyPlaceholders`: שנה `{address}` ל-fallback לשכונה (`prop.neighborhood || prop.city`) במקום `prop.address`
- בדיקת ה-hashtags — ודא שהם מפוענחים נכון לפני שליחה

### בעיה 2 — אפשרות Private בפייסבוק
Facebook Graph API תומך בפרמטר `privacy` לפוסטים בדף:
```json
{ "privacy": { "value": "SELF" } }
```
`SELF` = רק אתה רואה (דרפט לבדיקה), `EVERYONE` = ציבורי.

**שינויים:**

| # | קובץ | שינוי |
|---|-------|--------|
| 1 | `src/components/social/AutoPublishManager.tsx` | הוסף toggle "פרסום פרטי (לבדיקה)" → שולח `is_private: true` לפוסט. תקן `buildPreviewText` default, תקן `fillPropertyPlaceholders` להשתמש בשכונה במקום כתובת |
| 2 | `supabase/functions/social-publish/index.ts` | קבל `is_private` מה-post, העבר `privacy: { value: "SELF" }` לכל קריאות Facebook API כש-`is_private=true` |

**שימוש:** מסמנים "פרסום פרטי" → הפוסט עולה לפייסבוק אבל רק אתה רואה אותו → בודקים שהכל נראה טוב → מוחקים ומפרסמים שוב כ-Public.

**2 קבצים + deploy של edge function.**

