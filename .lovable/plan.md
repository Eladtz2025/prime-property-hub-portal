

## תיקון תמונה שבורה בכתבה

### הבעיה
ה-`image_url` של הכתבה בטבלת `insights` מצביע על URL של Unsplash שמחזיר 404:
`https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&q=80`

### פתרון

שתי אפשרויות:

**אפשרות א — תמונה מקומית (מומלץ, אמין 100%):**
עדכון ה-`image_url` בטבלה ל-`/images/rental-interior.jpg` או `/images/management-lobby.jpg` — תמונות שכבר קיימות בפרויקט ומתאימות לנושא תחזוקת נכס.

**אפשרות ב — Unsplash תקין:**
החלפה ב-URL עובד מ-Unsplash (אאמת לפני שאכניס).

### שינוי

| # | מה | פרטים |
|---|-----|--------|
| 1 | עדכון DB | `UPDATE insights SET image_url = '/images/rental-interior.jpg' WHERE id = 'db1ec8e7-...'` (דרך migration) |

**קובץ migration חדש אחד בלבד.**

