

# תיקון חילוץ פיצ'רים מיד2 — בעיית Jina + Yad2

## הבעיה האמיתית

מהלוגים רואים שכל הנכסים מחזירים **כמעט את כל הפיצ'רים כ-true**:
```text
elevator=true, mamad=true, balcony=true, storage=true, accessible=true,
furnished=true, renovated=true, bars=true, sunHeater=true, tadiran=true
```

זה בלתי אפשרי סטטיסטית. **הסיבה:** יד2 מציג את **כל הפיצ'רים האפשריים** בסקשן "מה יש בנכס" — פיצ'רים קיימים בצבע, ופיצ'רים חסרים באפור/מחוק. **Jina Reader מרנדר את כולם כטקסט רגיל** בלי הבדל.

ה-regex מוצא את שם הפיצ'ר בטקסט → מסמן `true`, גם אם הפיצ'ר באמת לא קיים בנכס.

## תוכנית התיקון

### שלב 1: הוספת debug log שמדפיס את הטקסט הגולמי של הסקשן

בקובץ `supabase/functions/backfill-property-data-jina/index.ts`, שורה 1422 — **לפני** הלוג הקיים, הוספת:

```typescript
console.log(`🔍 Yad2 raw section text: "${yad2Section.substring(0, 500)}"`);
```

### שלב 2: הרצת backfill על נכס אחד בלבד

להריץ backfill על נכס Klay (`q2ymf21t`) כדי לראות בדיוק מה Jina מחזיר.

### שלב 3: תיקון ה-parser בהתאם לפורמט האמיתי

בהתאם למה שנגלה בשלב 2, אחד מהתרחישים:

**תרחיש א': Jina מסמן פיצ'רים חסרים עם סימון (~~strikethrough~~, ❌, אפור)**
→ הוספת regex שמזהה את הסימון ומסנן פיצ'רים מסומנים כחסרים.

**תרחיש ב': Jina מציג את כל הפיצ'רים כטקסט רגיל ללא הבדל**
→ שינוי גישה: במקום regex על הסקשן, מעבר לזיהוי פיצ'רים לפי **מבנה** (למשל bullet list `*` vs plain text) או שימוש ב-Yad2 API ישיר (כמו שעושים במדל"ן) כדי לקבל JSON מדויק של הפיצ'רים.

**תרחיש ג': הסקשן לוכד יותר מדי טקסט (regex boundary שבור)**
→ תיקון ה-regex boundary כך שייעצר במקום הנכון.

### קבצים שישתנו

| קובץ | שינוי |
|---|---|
| `backfill-property-data-jina/index.ts` | debug log + תיקון parser |
| `_shared/yad2-detail-parser.ts` | אותו תיקון |

## סיכון
**נמוך** — שלב 1 הוא רק הוספת log. תיקון ה-parser ייעשה רק אחרי שנראה את הפורמט האמיתי.

