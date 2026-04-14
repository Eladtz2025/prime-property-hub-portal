

## קטגוריות לקבוצות פייסבוק — בחירה לפי קטגוריה בתבנית פרסום

### מה ישתנה

**1. FacebookGroupsManager — שדה קטגוריה עם בחירה מוגדרת מראש**
- במקום שדה טקסט חופשי לקטגוריה, נוסיף Select עם אופציות קבועות: `השכרה`, `מכירה`, `שותפים`, `כללי` (+ אפשרות "אחר" להקלדה חופשית)
- אין שינוי DB — השדה `category` כבר קיים בטבלה

**2. AutoPublishManager — בחירה לפי קטגוריה במקום קבוצות בודדות**
- במקום רשימת checkboxes של כל הקבוצות, נציג chips/checkboxes של הקטגוריות הקיימות (לפי מה שמוגדר בקבוצות)
- בחירת קטגוריה = בחירת כל הקבוצות שמשויכות אליה
- ה-`selectedGroupIds` ימומש מתוך הקטגוריות שנבחרו — כל הקבוצות באותה קטגוריה ייכללו אוטומטית

### קבצים לשינוי
- `src/components/social/FacebookGroupsManager.tsx` — Select במקום Input לשדה קטגוריה
- `src/components/social/AutoPublishManager.tsx` — לוגיקת בחירה לפי קטגוריה (שורות 615-637)

### פרטים טכניים
- נחלץ את הקטגוריות הייחודיות מ-`facebookGroups` בזמן ריצה: `[...new Set(groups.map(g => g.category).filter(Boolean))]`
- בבחירת קטגוריה, נחשב את ה-group IDs המתאימים ונעדכן את `selectedGroupIds`
- נשמור state של `selectedCategories` ונגזור ממנו את ה-group IDs

