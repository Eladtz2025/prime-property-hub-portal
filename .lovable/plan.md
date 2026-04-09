

## תיקון בחירת תמונה ראשית

### הבאג
בקוד השמירה (`PropertyEditRow.tsx` שורה 340 ו-`PropertyEditModal.tsx` שורה 406):

```typescript
is_main: image.isPrimary || i === 0
```

הביטוי `|| i === 0` גורם לתמונה הראשונה **תמיד** להישמר כ-primary, גם אם המשתמש בחר תמונה אחרת. אם המשתמש סימן את תמונה #3 כראשית, גם תמונה #0 נשמרת כ-`is_main: true` — ואז בטעינה מחדש, שתי תמונות מסומנות, או שתמונה #0 "מנצחת" כי היא הראשונה.

### התיקון

**2 קבצים:**

1. **`src/components/PropertyEditRow.tsx`** (שורה 340):
```typescript
// לפני:
is_main: image.isPrimary || i === 0,
// אחרי:
is_main: image.isPrimary === true,
```

2. **`src/components/PropertyEditModal.tsx`** (שורה 406):
```typescript
// לפני:
is_main: image.isPrimary || i === 0,
// אחרי:
is_main: image.isPrimary === true,
```

בנוסף — fallback ב-`setPrimaryImage` (ב-`ImageUpload.tsx`) כבר מטפל במקרה שאין אף תמונה ראשית, אז ה-`|| i === 0` מיותר לחלוטין.

### מה לא משתנה
- ImageUpload.tsx — הלוגיקה המקומית עובדת
- PropertyGallery.tsx — לא רלוונטי (אין שם בחירת primary)
- טבלאות DB

### סיכון
**אפסי** — תיקון שורה אחת בכל קובץ.

