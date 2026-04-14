

## תיקון: עיגולים ללא שם בבחירת קבוצות

### הבעיה
בקומפוננטת `AutoPublishManager.tsx`, שורה 629, כתוב:
```tsx
<span>{group.name}</span>
```
אבל השדה בטבלה הוא `group_name`, לא `name`. לכן ה-span ריק ורואים רק את ה-checkbox (העיגולים).

### תיקון
**קובץ: `src/components/social/AutoPublishManager.tsx`**, שורה 629:

שינוי `group.name` ל-`group.group_name`

תיקון של שורה אחת בלבד.

