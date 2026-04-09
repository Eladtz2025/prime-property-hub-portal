

## החלפת צדדים — גלריה ופרטים בדף נכס (עברית)

### מצב נוכחי (Desktop, שורות 324-331)
בלאוט RTL, הגריד מציב את האלמנט הראשון (גלריה, `col-span-2`) בצד **ימין** ואת הפרטים בצד **שמאל**.

### השינוי
החלפת הסדר: הפרטים יהיו **ראשונים** בגריד (ימין ב-RTL, `col-span-1`) והגלריה **שנייה** (שמאל ב-RTL, `col-span-2`).

### קובץ: `src/pages/PropertyDetailPage.tsx` (שורות ~324-331)

**לפני:**
```
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  <!-- Gallery (col-span-2) - RIGHT in RTL -->
  <div className="lg:col-span-2 order-1 lg:order-1">
    <ImageCarousel ... />
  </div>
  <!-- Details (col-span-1) - LEFT in RTL -->
  <div className="space-y-6 order-2 lg:order-2">
```

**אחרי:**
```
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  <!-- Details (col-span-1) - RIGHT in RTL -->
  <div className="space-y-6 order-2 lg:order-1">
    ...details...
  </div>
  <!-- Gallery (col-span-2) - LEFT in RTL -->
  <div className="lg:col-span-2 order-1 lg:order-2">
    <ImageCarousel ... />
  </div>
```

הפרטים עוברים **לפני** הגלריה ב-DOM (כך שב-RTL הם מופיעים מימין), והגלריה עוברת שמאלה. ב-Mobile הסדר נשמר עם `order` (גלריה ראשונה, פרטים אחריה).

### קובץ שמשתנה
- `src/pages/PropertyDetailPage.tsx` — החלפת סדר הבלוקים בגריד Desktop

### מה לא משתנה
- תוכן הפרטים, הגלריה, Mobile layout, Header/Footer

