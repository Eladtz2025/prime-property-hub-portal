

## שינוי תצוגה מקדימה — מטקסט+תמונות לטקסט+כרטיס לינק (OG Card)

### הבעיה
הפריוויו הנוכחי מציג תמונות כאילו הן מועלות ישירות לפייסבוק. בפועל, הפוסט מכיל **טקסט + לינק לדירה באתר** (`https://citymarket.co.il/property/{id}`), ופייסבוק מייצר אוטומטית כרטיס OG (תמונה + כותרת + תיאור + URL).

### מה משתנה

**`FacebookPostPreview.tsx` — הוספת מצב "Link Card":**

במקום grid של תמונות, הפריוויו יציג:
1. **טקסט הפוסט** (כמו היום)
2. **האשטגים** (כמו היום)
3. **כרטיס לינק** (חדש) — מחקה את ה-OG preview של פייסבוק:
   - תמונה ראשית (full-width, aspect ratio ~1.91:1)
   - מתחתיה: רקע אפור בהיר עם:
     - דומיין (`CITYMARKET.CO.IL`)
     - כותרת הנכס (כמו `דירה להשכרה: הרצל 10, תל אביב`)
     - תיאור קצר (חדרים, גודל, מחיר)

Props חדשים: `linkUrl`, `linkTitle`, `linkDescription`, `linkImage` — כשיש `linkUrl`, מוצג כרטיס לינק במקום grid תמונות.

**`AutoPublishManager.tsx` — בניית נתוני הלינק:**

בפריוויו, במקום להעביר `imageUrls`, לבנות:
- `linkUrl`: `https://citymarket.co.il/property/{property_id}`
- `linkTitle`: `דירה להשכרה: {address}, {city}` (מהנתונים של הנכס)
- `linkDescription`: `{rooms} חדרים | {size} מ"ר | ₪{price}` 
- `linkImage`: התמונה הראשית של הנכס

**Edge Function `social-publish` — הוספת לינק לפוסט:**

כשמפרסמים פוסט עם `property_id`, להוסיף לטקסט את הלינק לנכס: `\n\nhttps://citymarket.co.il/property/{property_id}`

כך פייסבוק מייצר אוטומטית את כרטיס ה-OG עם התמונה והכותרת.

### קבצים

| קובץ | שינוי |
|-------|-------|
| `FacebookPostPreview.tsx` | הוספת מצב Link Card — כרטיס OG עם תמונה, כותרת, תיאור, דומיין |
| `AutoPublishManager.tsx` | בניית linkUrl/linkTitle/linkDescription/linkImage מנתוני הנכס |
| `auto-publish/index.ts` | הוספת URL הנכס לסוף טקסט הפוסט |
| `social-publish/index.ts` | (אופציונלי) הוספת `link` parameter ל-Graph API במקום רק בטקסט |

**~4 קבצים, ~60 שורות שינוי.**

