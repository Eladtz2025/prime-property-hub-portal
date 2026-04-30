## מערכת התאמות מאוחדת ונקייה

אתה צודק — הצעתי המקורית (לשכפל את `_shared/matching.ts` ל-frontend helper) הייתה גרועה. שתי מערכות התאמה במקביל, כפילות לוגיקה, client-side filtering איטי. הגישה הנכונה: **מערכת אחת ב-DB**.

---

## הארכיטקטורה החדשה

### מקור אמת אחד: `match_property_to_lead(property_jsonb, lead)` ב-SQL

פונקציה אחת שמקבלת נכס (בפורמט מאוחד) + ליד, ומחזירה `{score, priority, reasons[], rejected, rejection_reason}`. כל החוקים — מחיר, חדרים, גודל, פיצ'רים, שכונה, תאריך כניסה — נמצאים פה.

### Adapter views: כולם נראים אותו דבר

```text
v_unified_listings (view):
   id | source_table | title | city | neighborhood | price | rooms 
   size | property_type | features (jsonb) | is_active | first_seen_at

המקורות:
   scouted_properties → source_table='scouted'
   properties (שלנו) → source_table='own', עם המרת:
      monthly_rent → price (לפי property_type)
      property_size → size  
      {parking, has_elevator, balcony, mamad, ...} → features jsonb
```

זה פותר את ההבדל בין `properties.has_elevator` (boolean column) ל-`scouted.features.elevator` (jsonb) — view אחד מאחד אותם.

### `get_unified_customer_matches(customer_uuid, include_dismissed)` — RPC חדש

```text
לכל נכס ב-v_unified_listings (פעיל):
   קרא ל-match_property_to_lead(...)
   אם לא דחוי → החזר עם score, priority, reasons
   
מסנן: dismissed_matches מתייחס גם ל-properties.id וגם ל-scouted.id
ממיין: priority DESC, score DESC, recency DESC
```

### Frontend: hook אחד, UI אחד

`useCustomerMatches` (כבר קיים) מקבל את כל ההתאמות מ-RPC היחיד, מסומנות `source_table` כדי שה-UI יציג badge "הנכס שלנו" / "scout".

`useOwnPropertyMatches` נמחק. הקומפוננטות ש-מציגות "נכסים שלנו תואמים" משתמשות באותו hook עם `filter(m => m.source_table === 'own')`.

---

## חוקי ההתאמה החדשים (מאוחדים)

### Strict (סף לפסילה — לא יוצג כלל אם נכשל)
- **מחיר**: בתוך `[budget_min*0.95, budget_max*1.05]`. אם נכשל → דחוי.
- **חדרים**: בתוך `[rooms_min, rooms_max]` עם סבילות 0.5. אם נכשל → דחוי.
- **גודל (חדש)**: `size >= size_min*0.85 AND size <= size_max*1.15`. אם `size IS NULL` → **דחוי** (לא ניתן לאמת). אם חוצה את הגמישות → **דחוי**.
- **עיר**: חייב להיות ב-`preferred_cities`. אם נכשל → דחוי.
- **שכונה**: חייב להיות ב-`preferred_neighborhoods` (עם normalization של underscore↔space). אם נכשל → דחוי.
- **סוג נכס**: rental↔rent, purchase↔sale. אם נכשל → דחוי.
- **פיצ'ר חובה (חניה/מעלית/מרפסת/ממ"ד) עם flexible=false**:
  - `features->>'X' = 'true'` → עובר ✓
  - `features->>'X' = 'false'` → **דחוי**
  - `features->>'X' IS NULL` → **דחוי** + מסמן `availability_check_reason='needs_enrichment'` (חוזר לתור השלמה)
- **חיות מחמד / immediate entry**: לפי הזיכרון הקיים — נשמר כפי שהיה (לא מסנן strict).

### Flexible (משפיע על priority, לא דוחה)
- פיצ'ר `_flexible=true` חסר → -10 priority + reason "מעלית לא ידועה ⚠"
- גודל קצת קטן (בתוך 15%) → -5 priority + reason "גודל גבולי"
- מחיר קצת מעל budget (בתוך 5%) → -5 priority

### Score (0-100)
משוקלל מ-priority + bonuses (פרטי, חדש, התאמה מושלמת ל-rooms/budget).

---

## טיפול ב-538 הנכסים החסרים features

לפי בחירתך לפיצ'רים strict בלי features = דחוי, וגם החזרה לתור השלמה:

הוספה ל-`match_property_to_lead`: כשנכס נדחה כי `features->>'parking' IS NULL`, הוא מתויג ב-`scouted_properties.availability_check_reason = 'needs_enrichment'` ו-`availability_checked_at = NULL` כדי ש-`get_properties_needing_availability_check` יבחר אותו עם עדיפות. ה-backfill הקיים (`check-property-availability-jina`) שעובד טוב יחזיר את ה-features.

עבור הטבלה `properties` (שלנו) — אין features חסרים בפועל (יש עמודות boolean), אבל אם יש NULL זה אומר "לא הוזן". לליד strict — דחוי.

---

## גמישות גודל 15% ב-`_shared/matching.ts` (תיקון 2)

מתבצע **בנוסף** למערכת המאוחדת — כי `_shared/matching.ts` עדיין רץ ב-`match-batch` Edge Function כדי לאכלס את `scouted_properties.matched_leads` (זה ה-cache שה-RPC יקרא ממנו במקום לחשב מחדש בכל request).

עדכון אחד ב-`calculateMatch`:
```text
size_min check:
   property.size >= lead.size_min * 0.85 → עובר
   property.size <  lead.size_min * 0.85 → reject
   property.size IS NULL                  → reject (חדש)
```

---

## פירוט קבצים

| קובץ | פעולה |
|---|---|
| `supabase/migrations/...` | חדש: view `v_unified_listings`, function `match_property_to_lead`, RPC `get_unified_customer_matches` |
| `supabase/functions/_shared/matching.ts` | תיקון size strict + 15% (משקף את חוקי ה-SQL) |
| `src/hooks/useCustomerMatches.ts` | קריאה ל-RPC החדש, החזרת `source_table` |
| `src/hooks/useOwnPropertyMatches.ts` | **נמחק** — מוחלף ב-filter על useCustomerMatches |
| Components שמשתמשים ב-`useOwnPropertyMatches` | עדכון לשימוש ב-`useCustomerMatches` עם filter |

## מה לא משתנה
- `match-batch` Edge Function ו-`scouted_properties.matched_leads` cache — ממשיכים לעבוד
- חוקי neighborhood normalization
- `dismissed_matches` schema

## סיכון ובקרה
- **סיכון**: מיגרציה משנה איך התאמות מחושבות — ייתכן שיופיעו פחות התאמות זמנית (כי strict על size+features אמיתי).
- **בקרה**: אריץ before/after diff — לכל ליד eligible, כמה התאמות לפני ואחרי. אם ירידה דרסטית (>50%) ביותר מ-3 לידים, נחזור לבדוק לפני שמפעילים.

---

## אישור אחרון לפני התחלה

האם לאשר את כיוון הארכיטקטורה? (זה מקום אחד לשנות חוקים, מהיר, בלי כפילות)
