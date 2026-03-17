

## הוספת נקודות בפגינציה

שינוי קטן — הגדלת `delta` כדי להציג יותר נקודות:

**קובץ:** `src/components/scout/ScoutedPropertiesTable.tsx`, שורה 1849

שינוי מ:
```
const delta = window.innerWidth < 640 ? 2 : 4;
```
ל:
```
const delta = window.innerWidth < 640 ? 4 : 8;
```

זה יציג ~9 נקודות במובייל ו-~17 בדסקטופ (במקום ~5 ו-~9 כיום).

