
# תיקון באגים בפרסר Homeless

## סיכום הבעיות שזוהו

### בעיה 1: שכונת "יפו" שגויה (CRITICAL)
**הבעיה:** דירות ברחובות מרכזיים כמו דיזנגוף, ארלוזורוב, אבן גבירול מסומנות בטעות כ"יפו"

**הסיבה:** כשאין שכונה בעמודת `neighborhoodText`, הפרסר מחפש ב-`fullRowText` ומוצא "יפו" בתוך המילה "תל אביב **יפו**"

**פתרון:** הסרת ה-fallback ל-`extractNeighborhood(fullRowText)`

### בעיה 2: Regex יפו רחב מדי
**הבעיה:** הביטוי `יפו\s*(?:ד'?|ג'?|ב'?|א'?)` תופס גם "יפו" בודד

**פתרון:** שינוי ל-`יפו\s+[אבגד]'?` - חייב רווח ואות אחריו

### בעיה 3: שכונות לא מזוהות
**שכונות חסרות:** ביצרון, ליבנה, כוכב הצפון, נווה חן, גני שרונה, גבול פלורנטין

**פתרון:** הוספת patterns חדשים והרחבת קיימים

---

## פרטים טכניים

### קובץ 1: parser-homeless.ts (שורות 240-247)

**לפני:**
```typescript
let neighborhood = extractNeighborhood(neighborhoodText, city);
if (!neighborhood) {
  neighborhood = extractNeighborhood(streetText, city);
}
if (!neighborhood) {
  neighborhood = extractNeighborhood(fullRowText, city); // הבעיה!
}
```

**אחרי:**
```typescript
let neighborhood = extractNeighborhood(neighborhoodText, city);
if (!neighborhood && streetText) {
  neighborhood = extractNeighborhood(streetText, city);
}
// REMOVED: extractNeighborhood(fullRowText) - causes false "יפו" matches
```

### קובץ 2: parser-utils.ts

| שורה | שינוי |
|------|-------|
| 227 | הוספת `^מרכז$` ו-`מרכז תל אביב` לזיהוי מרכז העיר |
| 228 | הוספת `גבול פלורנטין` |
| 230 | הוספת `גני שרונה` לרוטשילד |
| 232 | הוספת `ככר המדינה` ו-`אזור כיכר המדינה` |
| 238 | תיקון Regex יפו - חייב רווח+אות |
| 248 | הוספת `נאות אפקה` |
| 262+ | הוספת 5 שכונות חדשות: ביצרון, ליבנה, כוכב הצפון, נווה חן, הצמפון הישן |

---

## תוצאה צפויה

1. דירות בדיזנגוף/ארלוזורוב לא יסומנו יותר כ"יפו"
2. שכונות יוצגו עם שמות נכונים
3. 5 שכונות נוספות יזוהו נכון
