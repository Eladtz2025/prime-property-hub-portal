
## התאמת תצוגת הפוסט למראה האמיתי בפייסבוק

### הבעיות שרואים בצילום מסך

| # | בעיה | הסבר |
|---|-------|------|
| 1 | **כותרת Link Card שונה** | בתצוגה המקדימה אנחנו מייצרים כותרת משלנו ("דירה למכירה: צפון ישן, תל אביב"). אבל פייסבוק **מתעלם** ממה שאנחנו שולחים — הוא קורא את `og:title` מהאתר עצמו (`property.title`). לכן ה-preview חייב להציג את `property.title` |
| 2 | **כפילות "למכירה: למכירה"** | ה-`property.title` בDB מכיל "למכירה: למכירה \| צפון ישן \| דופלקס פנטהאוז". זו בעיה בנתונים, אבל גם ה-OG description מציג כתובת — צריך לתקן |
| 3 | **OG description מכיל כתובת** | בדף הנכס: `ogDescription = property.description \|\| "${property.rooms} חדרים ב${property.address}, ${property.city}"` — מציג כתובת רחוב |
| 4 | **סגנון Preview לא תואם** | פייסבוק האמיתי: תמונה full-width בלי רווחים, פס אפור צמוד מתחת. ה-preview שלנו מציג `border-t border-b` ו-`aspectRatio` שנראים שונה |

### שינויים

| # | קובץ | מה |
|---|-------|----|
| 1 | `AutoPublishManager.tsx` | ב-`buildLinkCard` — שנה `linkTitle` להשתמש ב-`prop.title` (מה שפייסבוק באמת יציג). שנה `linkDescription` להשתמש בחדרים/מ"ר/מחיר בלי כתובת |
| 2 | `PropertyDetailPage.tsx` | תקן `ogDescription` — החלף `property.address` ב-`property.neighborhood \|\| property.city` |
| 3 | `FacebookPostPreview.tsx` | עדכונים קוסמטיים להתאמת המראה לפייסבוק אמיתי: הסר `border-t` מעל התמונה, הקטן padding, התאם גודל כותרת |

### פירוט

**`buildLinkCard` — שימוש ב-property.title:**
```typescript
// לפני — כותרת מיוצרת שונה ממה שפייסבוק מציג
linkTitle = neighborhood && neighborhood !== city
  ? `דירה ${typeLabel}: ${neighborhood}, ${city}`
  : `דירה ${typeLabel} ב${city}`;

// אחרי — מה שפייסבוק באמת יציג (מ-og:title)
linkTitle = prop.title || `דירה ${typeLabel} ב${city}`;
```

**OG description — ללא כתובת:**
```typescript
// לפני
const ogDescription = property.description || `${property.rooms} חדרים ב${property.address}, ${property.city}`;

// אחרי
const locationLabel = property.neighborhood || property.city;
const ogDescription = property.description || `${property.rooms} חדרים ב${locationLabel}, ${property.city}`;
```

**Preview — התאמה ויזואלית:**
- הסרת `border-t` מעל תמונת ה-Link Card כדי שהתמונה תהיה צמודה לטקסט
- התמונה ב-full width בלי `aspectRatio` מגביל (כמו בפייסבוק אמיתי)
- הקטנת כותרת Link Card ל-`15px` (פייסבוק אמיתי משתמש בגודל קטן יותר)

**3 קבצים: `AutoPublishManager.tsx`, `PropertyDetailPage.tsx`, `FacebookPostPreview.tsx`**
