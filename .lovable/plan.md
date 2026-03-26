

## הרכבת הכתבה הראשונה — עמוד מגזין יוקרתי

### מה נעשה

**1. הכנסת הכתבה ל-Supabase** — migration שמכניסה את הכתבה לטבלת `insights`

**2. שדרוג מהותי של InsightDetail** (HE + EN) — מעבר מ-Markdown פשוט לעמוד מגזין יוקרתי שתומך ברכיבים מיוחדים

### עיצוב עמוד הכתבה

העמוד יהיה בסגנון מגזין יוקרתי עם:
- **Hero מלא** עם כותרת גדולה (Playfair) + תת-כותרת על רקע תמונה
- **Opening text** עם טיפוגרפיה מובלטת, גודל גדול יותר, רווחי שורות נדיבים
- **גוף טקסט** ברוחב צר (max-w-2xl) עם ריווח נדיב בין פסקאות
- **Pull Quotes** — ציטוטים מרכזיים עם עיצוב מיוחד (פונט Playfair, italic, קו דקורטיבי)
- **Highlight Box** — קופסה עם רקע שונה + כפתור "העתקה" (להודעה לשוכר)
- **רשימות** מעוצבות עם ריווח ואייקונים עדינים
- **CTA Section** — סקשן עם רקע כהה, כפתורי WhatsApp/שיחה
- **חתימה** — שם + חברה בסגנון אלגנטי

### מבנה הMarkdown

כדי לתמוך ברכיבים מיוחדים, נשתמש בסימנים ב-Markdown:
- `> ציטוט` → Pull Quote מעוצב
- `---` → separator דקורטיבי
- `:::highlight ... :::` → Highlight Box
- `:::cta ... :::` → CTA Section
- `:::signature ... :::` → חתימה

הפרסור יהיה בתוך InsightDetail — קומפוננטה `LuxuryArticleRenderer` שמפרקת את ה-Markdown לבלוקים ומרנדרת כל אחד בעיצוב המתאים.

### קבצים

| # | פעולה | קובץ |
|---|--------|-------|
| 1 | Migration — הכנסת הכתבה | `supabase/migrations/insert_first_article.sql` |
| 2 | קומפוננטה חדשה: LuxuryArticleRenderer | `src/components/insights/LuxuryArticleRenderer.tsx` |
| 3 | שדרוג InsightDetail (עברית) | `src/pages/he/InsightDetail.tsx` |
| 4 | שדרוג InsightDetail (אנגלית) | `src/pages/en/InsightDetail.tsx` |

### פרטים טכניים

- הכתבה תוכנס עם `type: 'article'`, `category: 'ניהול נכסים'`, `is_published: true`
- תמונת Hero: נשתמש ב-Unsplash URL איכותי (חלון עם אור טבעי / חלל דירה מואר)
- CTA ראשי יפנה ל-WhatsApp עם מספר `972542284477`
- CTA משני יפנה ל-WhatsApp עם הודעה שונה
- כפתור "העתקה" ב-Highlight Box ישתמש ב-`navigator.clipboard`

