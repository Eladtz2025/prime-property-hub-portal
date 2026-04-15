

# תוכנית מימוש: Madlan GraphQL Parser + שילוב בבקפיל

## מה ישתנה

### קובץ חדש: `supabase/functions/_shared/madlan-detail-parser.ts`
Parser שמבוסס על GraphQL API של מדל"ן (`/api2`), עושה `poiByIds` query עם ID שנשלף מה-source_url (`/listings/XXXXX`).

מחלץ:
- **amenities** (46 שדות boolean): balcony, elevator, parking, garage, secureRoom/mamad, storage, garden, accessible, furnished, airConditioner, pets, renovated
- **area** → size, **floor**, **floors** → totalFloors, **beds** → rooms, **price**
- **poc.type** → private/agent (לסיווג תיווך)

### עדכון: `supabase/functions/backfill-property-data-jina/index.ts`
**שינוי אחד:** הוספת בלוק Madlan (דומה לבלוק Homeless בשורות 445-506) **לפני** נתיב ה-Jina.

```
// EXISTING (line 444-506): Homeless → direct HTML fetch
// NEW: Madlan → GraphQL API (no Jina needed)
if (prop.source === 'madlan') {
  const detailResult = await fetchMadlanDetailFeatures(prop.source_url);
  // Merge features, update size/floor/rooms/price if missing
  // Classify broker from poc.type if is_private is null
  // Mark backfill_status = 'completed'
  continue; // Skip Jina path
}
// EXISTING (line 508+): All other sources → Jina
```

לוגיקת המיזוג: features מ-GraphQL דורסים את הקיימים (כי הם 100% מדויקים — boolean מובנים). שדות מספריים (size, floor, rooms) רק אם חסרים.

**poc.type** → אם `is_private` עדיין null: 
- `private` → `is_private = true`
- `agent` → `is_private = false`

### מה לא ישתנה
- **סורקים** (`scout-madlan-jina`, `scout-yad2-jina`, `scout-homeless-jina`) — אפס שינויים
- **parser-yad2.ts** — לא נוגעים (הנתונים ב-SERP כבר מחולצים כמו שצריך)
- **שאר לוגיקת הבקפיל** — ללא שינוי

### בדיקה חיה
אחרי יצירת הקבצים, אריץ בדיקת GraphQL על 3-5 נכסי מדל"ן מה-DB כדי לוודא שה-API מחזיר נתונים ולא חוסם.

## סיכון
**נמוך מאוד** — הנתיב החדש הוא `if (source === 'madlan') { ... continue; }` לפני נתיב ה-Jina. אם ה-GraphQL נכשל, הנכס מסומן `failed` (כמו כל כישלון אחר). שום קוד קיים לא נפגע.

## קבצים

| קובץ | פעולה |
|---|---|
| `supabase/functions/_shared/madlan-detail-parser.ts` | **חדש** |
| `supabase/functions/backfill-property-data-jina/index.ts` | הוספת import + בלוק madlan |

