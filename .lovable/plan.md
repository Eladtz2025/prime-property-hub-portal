
## תוכנית: התאמת התצוגה המקדימה לפייסבוק אמיתי

### הבדלים שזוהו וייושמו

| # | הבדל | שינוי |
|---|---|---|
| 1 | **רקע כהה** | הפוסט יהיה תמיד ב-dark mode (#242526) — כמו שנראה בפייסבוק |
| 2 | **אווטאר הדף** | הוספת לוגו City Market האמיתי כ-`pageAvatarUrl` (כבר קיים בפרויקט) |
| 3 | **שורת משנה** | הוספת "Published by CityMarketPropertiesWebsite" מתחת לשם הדף |
| 4 | **"...See more"** | שינוי ל-"...See more" עם נקודות לפני (כמו בפייסבוק אמיתי) |
| 5 | **כפתורי פעולה** | אייקונים בלבד (👍 💬 ↗️) ללא טקסט — כמו בפייסבוק |
| 6 | **הסרת שורת Reactions** | הסרת "24 לייקים, 3 תגובות" — לא מופיע בצילום |
| 7 | **הוספת שורת Comment** | הוספת "Comment as דירות להשכרה..." עם אייקוני emoji/GIF למטה |
| 8 | **Link Card alignment** | הדומיין תמיד שמאל (LTR), הכותרת RTL — כמו בפייסבוק |

### קובץ שישתנה
**`src/components/social/FacebookPostPreview.tsx`** — עדכון כולל של הרכיב:
- Force dark theme (רקע #242526, טקסט #e4e6eb)
- הוספת subtitle "Published by CityMarketPropertiesWebsite"
- כפתורים כאייקונים בלבד
- הסרת Reactions row, הוספת Comment row
- Link card: domain תמיד LTR

**`src/components/social/AutoPublishManager.tsx`** — העברת `pageAvatarUrl` עם הלוגו האמיתי

### סיכון: **אפסי** — שינויים ויזואליים בלבד ברכיב התצוגה המקדימה.
