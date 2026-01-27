

# תיקון באג בפרסר Homeless + ריצה מחדש

## הבעיה שמצאתי

בקובץ `_experimental/parser-homeless.ts` שורות 150-159:

```typescript
raw_data: {
  propertyTypeText,
  cityText,
  neighborhoodText,
  streetText,
  roomsText,      // ❌ לא מוגדר!
  floorText,      // ❌ לא מוגדר!
  priceText,      // ❌ לא מוגדר!
  entryDateText   // ❌ לא מוגדר!
}
```

המשתנים `propertyTypeText`, `cityText`, `neighborhoodText`, `streetText` מוגדרים בשורות 66-69, אבל ארבעת המשתנים האחרים מעולם לא הוגדרו - מה שגרם לקריסה של הפרסר.

## התיקון

הסרת המשתנים הלא מוגדרים מ-`raw_data`:

```typescript
raw_data: {
  propertyTypeText,
  cityText,
  neighborhoodText,
  streetText
}
```

## שלבי ביצוע

1. **תיקון הבאג** - הסרת המשתנים הלא מוגדרים מ-raw_data
2. **Deploy** - העלאת הפונקציה scout-homeless
3. **ריצה ידנית** - הרצת סקאן Homeless בלבד לוודא שעובד
4. **בדיקת תוצאות** - וידוא שנמצאו נכסים ושהסטטוס completed

## לגבי "נעילת הקוד"

בגלל שזו מערכת מבוססת קוד, אין דרך טכנית "לנעול" קבצים. אבל יש כמה אפשרויות:

1. **תיעוד ברור** - אוסיף הערה בראש הקובץ שזה קוד פרודקשן יציב
2. **הפרדה פיזית** - אפשר להעתיק את הפרסרים היציבים לתיקייה `_shared/` והפרודקשן ישתמש רק משם
3. **בדיקות אוטומטיות** - אפשר ליצור טסט פשוט שמריץ את הפרסר על HTML לדוגמה ומוודא שלא קורס

**המלצה:** אוסיף הערת אזהרה בראש הקובץ והפרדה ברורה בין _experimental (לניסויים) ל-_shared (לפרודקשן).

