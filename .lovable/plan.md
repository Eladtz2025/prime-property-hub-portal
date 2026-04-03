

## תיקון תמונת Link Card בתצוגה המקדימה

### הבעיה
התמונה ב-Link Card מוצגת עם `maxHeight: 260px` ו-`object-cover` בלי יחס גובה-רוחב קבוע. זה גורם לחיתוך לא צפוי של התמונה. בפייסבוק אמיתי, תמונת Link Card תמיד מוצגת ביחס **1.91:1** (landscape).

### שינוי

**קובץ: `FacebookPostPreview.tsx`**

שורות 119-126 — החלפת `maxHeight: '260px'` ביחס גובה-רוחב קבוע:

```tsx
// לפני
<img src={linkImage} className="w-full object-cover" style={{ maxHeight: '260px' }} />

// אחרי
<img src={linkImage} className="w-full object-cover aspect-[1.91/1]" />
```

זה מבטיח שהתמונה תמיד תוצג ביחס הנכון כמו בפייסבוק אמיתי, בלי קשר לגודל התמונה המקורית.

**קובץ אחד, שינוי של שורה אחת.**

