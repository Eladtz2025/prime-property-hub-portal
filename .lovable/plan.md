

## החזרת לינק Insights לתפריטים הציבוריים

### מה קרה
הלינקים ל-Insights הוסרו מ-3 מקומות — גם מהתפריטים הציבוריים (עברית + אנגלית) וגם מהאדמין. היית צריך להסיר רק מהאדמין.

### תיקון

| קובץ | שינוי |
|-------|--------|
| `src/components/he/Header.tsx` שורה 41 | הוסף `{ label: "תובנות", path: "/he/insights" }` |
| `src/components/en/Header.tsx` שורה 41 | הוסף `{ label: "Insights", path: "/en/insights" }` |

**לינק האדמין (`EnhancedTopNavigation`) נשאר מוסר — כפי שביקשת.**

2 קבצים, שורה אחת בכל קובץ.

