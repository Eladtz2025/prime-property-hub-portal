

## סינון נכסים — רק נכסים אקטואליים בשדה הבחירה

### הבעיה
השאילתה בשורה 97-102 ב-`AutoPublishManager.tsx` מסננת רק לפי `available = true`, אבל לא לפי `show_on_website = true`. כך נכסים שלא מוצגים באתר (לא אקטואליים) עדיין מופיעים ברשימת הבחירה.

### התיקון

**`AutoPublishManager.tsx` שורה 100:**
- הוספת `.eq('show_on_website', true)` לשאילתה שטוענת נכסים לבחירה
- כך רק נכסים שגם `available = true` וגם `show_on_website = true` יופיעו

**שורה אחת, קובץ אחד.**

