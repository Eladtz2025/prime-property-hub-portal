

## תיקון: same-source address dedup עם מחיר

### מה משתנה
ב-`property-helpers.ts`, אחרי ש-`findSameSourceDuplicate` לא מוצאת התאמה לפי source_id/URL, מוסיפים בדיקה שלישית — חיפוש לפי **אותו מקור + כתובת + עיר + חדרים + קומה + מחיר + סוג נכס**:

```typescript
// 3) Same source + same address details + same price = same listing with different ID
if (!existingSameSource && hasValidAddress && normalizedCity
    && property.rooms !== undefined && property.floor !== undefined && property.price) {
  const { data: existingByAddress } = await supabase
    .from('scouted_properties')
    .select('id, source_url')
    .eq('source', property.source)
    .eq('city', normalizedCity)
    .eq('address', property.address)
    .eq('rooms', property.rooms)
    .eq('floor', property.floor)
    .eq('price', property.price)
    .eq('property_type', property.property_type)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (existingByAddress) {
    existingSameSource = existingByAddress;
    console.log(`🔄 Same-source address+price match: ${property.source_url} → existing ${existingByAddress.id}`);
  }
}
```

כשנמצאת התאמה — הנכס הקיים מתעדכן (כולל source_id ו-URL חדשים) **במקום ליצור רשומה חדשה**.

### מיגרציית ניקוי
SQL שימזג את הכפילויות הקיימות של ארלוזרוב 182 — ישאיר את הרשומה הראשונה ויבטל את 4 האחרות (is_active=false).

### קבצים
1. `supabase/functions/_shared/property-helpers.ts` — הוספת בדיקה שלישית
2. מיגרציית SQL — ניקוי ארלוזרוב 182

### קריטריוני התאמה מלאים
| שדה | דרישה |
|---|---|
| source | אותו מקור |
| city | זהה (מנורמל) |
| address | זהה (רחוב + מספר) |
| rooms | זהה |
| floor | זהה |
| price | **זהה** (חדש) |
| property_type | זהה |
| is_active | true |

