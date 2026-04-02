

## תיקון 3 בעיות בפוסט פייסבוק

### הבעיות מהצילום

| # | בעיה | הסבר |
|---|-------|------|
| 1 | **טקסט צמוד לשמאל** | בפייסבוק הפוסט נראה עם טקסט עברי מיושר לשמאל. ב-Facebook API אין פרמטר RTL — פייסבוק מזהה כיוון לפי תו ראשון. **הבעיה:** הטקסט מתחיל באימוג'י (🏠) ופייסבוק מזהה את זה כ-LTR. **פתרון:** להוסיף תו Unicode RTL mark (`\u200F`) בתחילת הטקסט כדי לכפות יישור ימין |
| 2 | **כותרת Link Card צמודה לשמאל** | אותה בעיה — ה-`og:title` מתחיל ב-"למכירה:" שזה עברי אבל ה-`og:description` מתחיל באימוג'י. **פתרון:** להוסיף `\u200F` גם ל-OG title ו-description ב-edge function |
| 3 | **See More מהשורה השנייה** | פייסבוק קוצץ טקסט ארוך מוקדם. **הפתרון:** לקצר את הטקסט כך שכל המידע יהיה ב-3-4 שורות קצרות, או לשלוח את הטקסט בצורה קומפקטית יותר. בפועל — זה תלוי באורך הטקסט שנשלח. צריך לוודא שהתבנית default יוצרת טקסט קצר (3 שורות מקסימום) כדי שפייסבוק לא יקצץ |

### שינויים

| # | קובץ | מה |
|---|-------|----|
| 1 | `AutoPublishManager.tsx` | הוסף `\u200F` (RTL mark) בתחילת `finalContentText` לפני שליחה. שנה תבנית default להיות קומפקטית ב-3 שורות |
| 2 | `og-property/index.ts` | הוסף `\u200F` בתחילת `fullTitle` ו-`description` כדי שגם ה-Link Card יהיה RTL. **Deploy נדרש** |
| 3 | `FacebookPostPreview.tsx` | עדכן Preview להציג RTL mark כמו שפייסבוק יציג |

### פירוט

**RTL Mark בטקסט הפוסט (AutoPublishManager):**
```typescript
// לפני שליחה — כפיית RTL
const rtlMark = '\u200F';
const finalContentText = rtlMark + (isPhotosMode && propertyUrl
  ? `${contentText}\n\n🔗 ${propertyUrl}`
  : contentText);
```

**תבנית default קומפקטית (3 שורות):**
```typescript
// לפני — 6+ שורות עם שורה לכל פרט
`🏠 דירה למכירה בתל אביב\n📍 צפון ישן, תל אביב\n💰 ₪5,250,000\n🛏️ 3 חדרים\n📐 68 מ"ר\n🏢 קומה 2\n\n📞 לפרטים...`

// אחרי — 3 שורות קומפקטיות
`🏠 דירה למכירה בתל אביב-יפו\n💰 ₪5,250,000 | 🛏️ 3 חדרים | 📐 68 מ"ר | 🏢 קומה 2\n📞 לפרטים נוספים צרו קשר`
```

**OG Function — RTL:**
```typescript
const fullTitle = `\u200F${propertyTypePrefix}: ${title}`;
// description כבר בעברית אבל מתחיל באימוג'י
const escapedDescription = escapeHtml('\u200F' + description.substring(0, 200));
```

**3 קבצים + deploy של edge function.**

