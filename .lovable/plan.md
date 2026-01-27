
# תוכנית: הוספת Features ב-URL ל-Yad2 ו-Madlan

## סיכום המחקר

### Yad2 - תומך בפרמטרים!
מהמחקר מצאתי ש-Yad2 **כן** תומך בפרמטרי URL לסינון features:
- `balcony=1` - מרפסת
- `parking=1` - חניה
- `elevator=1` - מעלית
- `shelter=1` - ממ"ד

דוגמה: `https://yad2.co.il/realestate/forsale?shelter=1` מציגה "נדל"ן למכירה עם ממד"

### Madlan - לא תומך
מהמחקר נראה ש-Madlan **לא** תומך בסינון features דרך URL. פרמטר ה-`filters` שלהם תומך רק במחיר וחדרים בפורמט `_price-range_rooms-range`.

### Homeless - כבר מיושם
כבר הוספנו תמיכה ב:
- `inumber14=on` - מרפסת
- `inumber12=on` - חניה  
- `inumber7=on` - מעלית

---

## שינויים נדרשים

### 1. עדכון buildYad2Url להוסיף features

**קובץ:** `supabase/functions/_personal-scout/url-builder.ts`

הפונקציה `buildYad2Url` צריכה לקבל פרמטרים נוספים ולהוסיף אותם ל-URL:

```typescript
function buildYad2Url(
  city: string,
  propertyType: 'rent' | 'sale',
  minPrice?: number | null,
  maxPrice?: number | null,
  minRooms?: number | null,
  maxRooms?: number | null,
  page: number = 1,
  // NEW: Feature filters
  balconyRequired?: boolean | null,
  parkingRequired?: boolean | null,
  elevatorRequired?: boolean | null
): string {
  // ...existing code...
  
  // NEW: Feature filters
  if (balconyRequired) {
    params.set('balcony', '1');
  }
  if (parkingRequired) {
    params.set('parking', '1');
  }
  if (elevatorRequired) {
    params.set('elevator', '1');
  }
  
  // ...rest of code...
}
```

### 2. עדכון buildPersonalUrl להעביר features ל-Yad2

**שינוי בשורה 122-123:**

```typescript
if (source === 'yad2') {
  return buildYad2Url(
    city, property_type, 
    leakedMinPrice, leakedMaxPrice, 
    min_rooms, max_rooms, page,
    balcony_required, parking_required, elevator_required  // NEW
  );
}
```

### 3. Madlan - השארה ללא שינוי + הערה

Madlan לא תומך בסינון features ב-URL. ה-features ימשיכו להסנן אחרי הסריקה (post-parse filtering).

נוסיף הערה בקוד:
```typescript
// NOTE: Madlan does NOT support feature filtering via URL
// Features are filtered post-parse in feature-filter.ts
```

---

## תוצאה צפויה

| מקור | מחיר ב-URL | חדרים ב-URL | מרפסת ב-URL | חניה ב-URL | מעלית ב-URL |
|------|-----------|-------------|-------------|-----------|-------------|
| **Yad2** | ✅ | ✅ | ✅ (חדש!) | ✅ (חדש!) | ✅ (חדש!) |
| **Madlan** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Homeless** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## דוגמה ל-URL אחרי השינויים

**לפני:**
```
https://www.yad2.co.il/realestate/rent?city=5000&price=7200-12100&rooms=3-4
```

**אחרי (עם lead שדורש חניה + מעלית, לא גמיש):**
```
https://www.yad2.co.il/realestate/rent?city=5000&price=7200-12100&rooms=3-4&parking=1&elevator=1
```

---

## קבצים לעדכון

| קובץ | שינוי |
|------|-------|
| `url-builder.ts` | הוספת features לסיגנטורת `buildYad2Url` והטמעה |
| `personal-scout-worker/index.ts` | אין שינוי (כבר מעביר את ה-features ל-buildPersonalUrl) |

---

## הערה טכנית

ה-Worker כבר מעביר את ה-features כמו שצריך:
```typescript
balcony_required: lead.balcony_required && !lead.balcony_flexible,
parking_required: lead.parking_required && !lead.parking_flexible,
elevator_required: lead.elevator_required && !lead.elevator_flexible,
```

רק צריך לעדכן את `buildYad2Url` לקבל ולהשתמש בפרמטרים האלה.
