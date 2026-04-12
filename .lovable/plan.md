

## תוכנית: תצוגה מקדימה עם נתוני דוגמה כברירת מחדל

### הבעיה
כשלא נבחרה דירה, התצוגה המקדימה של פייסבוק מציגה טקסט ריק/עם placeholders וללא תמונה — נראה "שבור" וקטן.

### הפתרון
בבלוק ה-preview (שורות 862-941 ב-`AutoPublishManager.tsx`), כשאין נכס נבחר ב-`one_time` mode — נשתמש בנכס הראשון מרשימת `properties` כנתוני דוגמה. כך התצוגה תראה מלאה ומציאותית מהרגע הראשון, וכשהמשתמש בוחר נכס — הנתונים מתעדכנים לנכס שנבחר.

### שינויים

**קובץ: `src/components/social/AutoPublishManager.tsx`**

אחרי הבלוק של `mode === 'one_time'` (שורה 913-928), נוסיף fallback:

```
// Fallback: if one_time mode and no property selected, use first property as demo
if (mode === 'one_time' && (!selectedPropertyId || selectedPropertyId === 'free') && properties.length) {
  const demoProp = properties[0];
  previewText = fillPropertyPlaceholders(contentText || defaultTemplate, demoProp);
  if (postStyle === 'link') {
    buildLinkCard(demoProp);
  } else {
    previewImages = demoProp.property_images?.slice(0, 4).map(img => img.image_url) || [];
  }
}
```

כך:
- ברגע שהעמוד נטען, התצוגה מציגה דירה אמיתית מהמאגר
- ברגע שהמשתמש בוחר דירה, היא מתעדכנת לנכס שנבחר
- אם אין נכסים בכלל, נשאר ה-placeholder הנוכחי

### סיכון: **אפסי** — רק הוספת fallback לתצוגה, ללא שינוי בלוגיקת הפרסום.

