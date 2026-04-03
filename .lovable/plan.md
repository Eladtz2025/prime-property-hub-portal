

## סנכרון התצוגה המקדימה עם מה שפייסבוק באמת מציג

### הבעיות מהצילום

| # | בתצוגה המקדימה | בפייסבוק בפועל |
|---|----------------|----------------|
| 1 | **כותרת Link Card**: "דירה למכירה בתל אביב-יפו" | **og:title**: "למכירה: דירת 3 חדרים עם מרפסות \| חניה \| מיקום מובחר בנווה צדק" — זה `propertyTypePrefix: property.title` |
| 2 | **תיאור Link Card**: "3 חדרים \| 68 מ"ר \| ₪5,250,000" | **og:description**: "🛏️ 3 חד' \| 📐 68 מ"ר \| 🏢 קומה 2 \| 🌿 מרפסת \| 🚗 חניה \| 🛗 מעלית \| 📍 תל אביב יפו" — עם אימוג'ים וכל הפרטים |
| 3 | **"קרא עוד"** אחרי 5 שורות | פייסבוק חותך אחרי **~3 שורות** בפוסט עם Link Card |

**הסיבה**: הפונקציה `buildLinkCard` ב-`AutoPublishManager` מייצרת תוכן שונה מהפונקציה `og-property` שפייסבוק באמת גורד.

### שינויים

| # | קובץ | מה |
|---|-------|----|
| 1 | `AutoPublishManager.tsx` | לשנות `buildLinkCard` כדי שייצר **בדיוק** את אותו title ו-description כמו `og-property` |
| 2 | `FacebookPostPreview.tsx` | להוריד את `MAX_LINES` מ-5 ל-3 כדי לשקף את ההתנהגות האמיתית של פייסבוק בפוסטים עם Link Card |

### פירוט

**buildLinkCard — סנכרון עם og-property:**
```typescript
// לפני — כותרת שונה מ-og:title
linkTitle = prop.title || `דירה ${typeLabel} ב${city}`;
const parts = [];
if (prop.rooms) parts.push(`${prop.rooms} חדרים`);
if (prop.property_size) parts.push(`${prop.property_size} מ"ר`);
linkDescription = parts.join(' | ');

// אחרי — בדיוק כמו og-property
linkTitle = `${typeLabel}: ${prop.title || 'נכס'}`;
const descParts = [];
if (prop.rooms) descParts.push(`🛏️ ${prop.rooms} חד'`);
if (prop.property_size) descParts.push(`📐 ${prop.property_size} מ"ר`);
if (prop.floor != null) descParts.push(`🏢 קומה ${prop.floor}`);
if (prop.balcony) descParts.push(`🌿 מרפסת`);
if (prop.parking) descParts.push(`🚗 חניה`);
if (prop.elevator) descParts.push(`🛗 מעלית`);
if (price) descParts.push(`💰 ${price}`);
descParts.push(`📍 ${prop.neighborhood || prop.city}`);
linkDescription = descParts.join(' | ');
```

**TextWithSeeMore — threshold מותאם:**
```typescript
const MAX_LINES = 3; // Facebook חותך אחרי 3 שורות בפוסט עם Link Card
```

**2 קבצים.**

