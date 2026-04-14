

## תיקון: קטגוריות מותאמות אישית לא מופיעות בבחירה

### הבעיה
ה-Select בדיאלוג הוספת/עריכת קבוצה מציג רק את הקטגוריות הקבועות (`השכרה`, `מכירה`, `שותפים`, `כללי`). קטגוריות שנוצרו דרך "אחר" לא מופיעות ברשימה כשמוסיפים/עורכים קבוצה אחרת.

### תיקון — קובץ אחד: `FacebookGroupsManager.tsx`

בתוך ה-Select, במקום להציג רק `GROUP_CATEGORIES`, נמזג גם קטגוריות קיימות מה-DB:

```ts
const existingCustomCategories = [...new Set(
  groups?.map(g => g.category).filter(Boolean).filter(c => !GROUP_CATEGORIES.includes(c))
)] as string[];

const allCategories = [...GROUP_CATEGORIES, ...existingCustomCategories];
```

ואז ב-SelectContent נרנדר את `allCategories` במקום `GROUP_CATEGORIES` בלבד. הקטגוריות המותאמות יופיעו מתחת לקבועות, לפני אפשרות "אחר".

שינוי קטן — שורות 177-180 + הוספת חישוב הקטגוריות.

