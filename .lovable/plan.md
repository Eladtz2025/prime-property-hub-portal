
# הוספת גלריית "דירה מרוהטת" לעמוד הנכס

## סקירה כללית
הוספת אפשרות להעלות תמונות של הדירה מרוהטת באדמין, ובאתר הציבורי יופיע כפתור "תראה לי איך הדירה תהיה מרוהטת" שמחליף את הגלריה לתמונות המרוהטות - רק כשיש תמונות כאלה.

## שינוי 1: הוספת עמודה לטבלת property_images
הוספת עמודה `is_furnished` (boolean, default false) לטבלת `property_images` בדאטאבייס. זה מאפשר לסמן תמונות ספציפיות כ"תמונות ריהוט".

## שינוי 2: עדכון האדמין - סימון תמונות כמרוהטות
בממשק העריכה של תמונות (`PropertyEditModal.tsx` ו-`PropertyEditRow.tsx`), הוספת checkbox/toggle ליד כל תמונה שמאפשר לסמן אותה כ"תמונה מרוהטת". בגלריה (`PropertyGallery.tsx`) גם כן יתווסף סימון כזה.

## שינוי 3: עדכון הטיפוסים
- הוספת `isFurnished` ל-`PropertyImage` ב-`types/property.ts`
- עדכון ה-Supabase types (יתעדכן אוטומטית עם המיגרציה)

## שינוי 4: עדכון ה-hooks שטוענים תמונות
- `usePublicProperty.ts` - טעינת שדה `is_furnished`
- `usePublicProperties.ts` - אותו דבר
- העברת המידע לקומפוננטות

## שינוי 5: עדכון ImageCarousel - הכפתור והמעבר בין גלריות
ב-`ImageCarousel.tsx`:
- קבלת prop חדש `furnishedImages` (אופציונלי)
- כשיש תמונות מרוהטות, הצגת כפתור "תראה לי איך הדירה תהיה מרוהטת" מתחת לגלריה
- לחיצה על הכפתור מחליפה את הגלריה לתמונות המרוהטות
- כפתור חזרה "חזרה לתמונות המקוריות"

## שינוי 6: עדכון עמודי הנכס (עברית + אנגלית)
- `PropertyDetailPage.tsx` (עברית) - הפרדת התמונות לרגילות ומרוהטות, העברתן ל-ImageCarousel
- `en/PropertyDetail.tsx` (אנגלית) - אותו דבר עם טקסט באנגלית ("Show me the apartment furnished")

---

## פירוט טכני

### מיגרציית SQL:
```sql
ALTER TABLE property_images ADD COLUMN is_furnished boolean DEFAULT false;
```

### `src/types/property.ts` - PropertyImage:
הוספת `isFurnished?: boolean`

### `src/hooks/usePublicProperty.ts`:
הוספת `is_furnished` לשאילתא וטרנספורמציה

### `src/components/ImageCarousel.tsx`:
- Props חדש: `furnishedImages?: PropertyImage[]`
- State: `showFurnished` (boolean)
- כפתור toggle בין שתי הגלריות
- עיצוב הכפתור: אייקון ספה + טקסט, מוצג רק כש-`furnishedImages.length > 0`

### `src/pages/PropertyDetailPage.tsx` + `src/pages/en/PropertyDetail.tsx`:
- הפרדת `propertyImages` ל-`regularImages` ו-`furnishedImages` לפי `is_furnished`
- העברת שניהם ל-`ImageCarousel`

### `src/components/PropertyEditModal.tsx` + `PropertyEditRow.tsx`:
- טעינת ושמירת `is_furnished` 
- הוספת toggle ליד כל תמונה בעורך

### `src/components/PropertyGallery.tsx`:
- הוספת badge/toggle לסימון תמונה כמרוהטת

### קבצים לעריכה:
- מיגרציית SQL (עמודה חדשה)
- `src/types/property.ts`
- `src/hooks/usePublicProperty.ts`
- `src/components/ImageCarousel.tsx`
- `src/pages/PropertyDetailPage.tsx`
- `src/pages/en/PropertyDetail.tsx`
- `src/components/PropertyEditModal.tsx`
- `src/components/PropertyEditRow.tsx`
- `src/components/PropertyGallery.tsx`
