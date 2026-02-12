

# ניקוי התאמות + תיקון באגים

## 1. ניקוי כל ההתאמות (SQL)
איפוס `matched_leads` לכל הנכסים והחזרת סטטוס ל-`new`:
```text
UPDATE scouted_properties SET matched_leads = '[]', status = 'new' WHERE matched_leads IS NOT NULL AND matched_leads != '[]'::jsonb;
```

## 2. הוספת בדיקת גודל (size) למנוע ההתאמות

כרגע הקוד בודק חדרים אבל מתעלם לגמרי מ-`size_min` / `size_max` של הלקוח. צריך להוסיף בדיקה אחרי בדיקת החדרים (שורה 360 ב-matching.ts):

```text
// ===== SIZE MUST BE IN RANGE =====
if (property.size && property.size > 0) {
  if (lead.size_min && property.size < lead.size_min) {
    return fail: "נדרש מינימום X מ״ר, בנכס יש Y"
  }
  if (lead.size_max && property.size > lead.size_max) {
    return fail: "נדרש מקסימום X מ״ר, בנכס יש Y"
  }
  reasons.push("X מ״ר ✓")
}
```

## 3. תיקון נתוני אופיר

עדכון `preferred_cities` של אופיר מ-`["old/newnorth", "תל אביב יפו"]` ל-`["תל אביב יפו"]` (הסרת הערך הפסול).

---

## פרטים טכניים

### קובץ: `supabase/functions/_shared/matching.ts`
- אחרי שורה 360 (סוף בדיקת חדרים): הוספת בלוק בדיקת size_min/size_max באותו פורמט בדיוק כמו בדיקת rooms

### SQL — 2 פעולות:
1. איפוס כל ההתאמות (matched_leads = [], status = 'new')
2. תיקון preferred_cities של אופיר

### קובץ: `supabase/functions/_shared/matching.ts` — deploy
אחרי השינוי צריך לעשות deploy ל-match-batch ו-trigger-matching כי הם משתמשים ב-matching.ts

