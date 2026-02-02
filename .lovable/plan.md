
## תוכנית - תצוגת כותרות אחידה בהתאמות

### בעיה מזוהה
בדיאלוג ההתאמות מוצגת הכותרת המקורית מהמקור (`title`), לדוגמה:
- "דירה 3 חדרים להשכרה בצפון חדש"

בעוד שבטבלת הסקאוט מוצג פורמט אחיד:
- "להשכרה בויצמן, צפון חדש"

### הפתרון
לעדכן את `CustomerMatchesCell.tsx` כך שיבנה כותרת בפורמט אחיד:

```
{property_type === 'rent' ? 'להשכרה' : 'למכירה'} ב{address}, {neighborhood}
```

### שינוי טכני

**קובץ:** `src/components/customers/CustomerMatchesCell.tsx`

**שורה 304 - לפני:**
```tsx
<p className="font-medium truncate text-sm">{match.title || 'דירה ללא כותרת'}</p>
```

**אחרי:**
```tsx
<p className="font-medium truncate text-sm">
  {match.property_type === 'rent' ? 'להשכרה' : 'למכירה'}
  {match.address ? ` ב${match.address.split(',')[0]?.trim()}` : ''}
  {match.neighborhood ? `, ${match.neighborhood}` : ''}
</p>
```

### שינוי נוסף - הוספת שדות חסרים ל-Hook

כדי שהפורמט יעבוד, צריך לוודא שה-hook `useCustomerMatches` מביא גם `address` ו-`property_type`.

**קובץ:** `src/hooks/useCustomerMatches.ts`

הממשק כבר כולל `source` אבל חסרים `address` ו-`property_type`. יש לוודא שהפונקציה `get_customer_matches` מחזירה גם שדות אלה.

---

## בעיות נוספות שזוהו (לטיפול עתידי)

### 1. התאמות שגויות לפי שכונה
נמצאו 2 נכסים שהותאמו לצפון חדש אבל נמצאים בשכונות אחרות:
- אזורי חן ≠ צפון חדש
- תל ברוך צפון ≠ צפון חדש

**סיבה אפשרית:** לוגיקת ההתאמה משתמשת ב-neighborhood_groups או שמנגנון ההתאמה לא מדויק.

### 2. מודעות שהוסרו
2 מתוך 9 נכסים כבר הוסרו מיד2. הלקוח רואה לינקים שבורים.

**המלצה:** להוסיף מנגנון בדיקת זמינות (HTTP HEAD) שיסמן נכסים לא פעילים.

### 3. כפילויות במדלן
אותו נכס מופיע פעמיים עם כתובות שונות.

**זו כנראה בעיית duplicate_group_id** שלא מזהה את הכפילות הזו.
