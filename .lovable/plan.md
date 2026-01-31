
# בנייה מחדש של מערכת זיהוי כפילויות

## סיכום הבעיות שזוהו

### בעיות קריטיות בלוגיקה הנוכחית

| בעיה | תיאור | דוגמה |
|------|-------|-------|
| **כתובות לא ספציפיות** | נכסים עם address כללי מקובצים יחד למרות שהם דירות שונות | "וינגייט 1" = 59 דירות שונות מקובצות |
| **התעלמות מקומה** | הלוגיקה לא דורשת קומה זהה לזיהוי כפילות | קומה 10 וקומה 22 באותו בניין = כפילות (שגוי!) |
| **גמישות מחיר רחבה מדי** | 20% הפרש מאפשר קבוצות של דירות שונות | 7,000₪ ו-8,500₪ נחשבות כפילות |
| **94 קבוצות שגויות** | קבוצות עם קומות/גדלים שונים | 259 נכסים בקבוצות שגויות |
| **1,674 כתובות כלליות** | נכסים בלי מספר בית נכנסים לזיהוי כפילויות | "הירקון", "נווה אביבים", "דירה" |

### מצב נוכחי בDB

```text
נכסים פעילים:        7,755
עם duplicate_group:   1,380 (18%)
קבוצות ייחודיות:       636
כפילויות שגויות:        ~94 קבוצות (259 נכסים)
התראות לא מטופלות:    141
```

---

## הגדרה מחדש: מהי כפילות אמיתית?

**כפילות אמיתית** = אותו נכס פיזי שמפורסם במספר מקורות

### קריטריונים חובה (כולם ביחד):
1. **כתובת מדויקת** - רחוב + מספר בית (regex: `^\S+.*\d+$`)
2. **עיר זהה** - אותה עיר (מנורמלת)
3. **חדרים זהים** - אותו מספר חדרים
4. **קומה זהה** - אותה קומה (חובה!)
5. **גודל דומה** - עד 15% הפרש (לא 10% - יש טעויות קטנות)

### קריטריונים מאשרים (אופציונליים):
- **מחיר דומה** - עד 10% הפרש (לא חובה - אותה דירה יכולה להיות במחירים שונים)
- **מקורות שונים** - העדפה לכפילויות cross-platform (Yad2 ↔ Madlan)

---

## תוכנית הפעולה

### שלב 1: הסרת הקוד והנתונים הישנים

**Edge Functions למחיקה:**
- `supabase/functions/run-duplicate-detection/` - קורא ל-RPC ישן
- `supabase/functions/cleanup-duplicate-scouted/` - ניקוי ידני

**פונקציות DB למחיקה:**
- `find_duplicate_property()` - 3 גרסאות overloaded
- `detect_existing_duplicates()`

**טבלאות לניקוי:**
- `duplicate_alerts` - לרוקן לחלוטין
- `scouted_properties` - לאפס עמודות כפילויות

**הגדרות לניקוי:**
- `scout_settings` WHERE category = 'duplicates'

### שלב 2: מיגרציית DB

```sql
-- 1. Clear all duplicate data
UPDATE scouted_properties
SET 
  duplicate_group_id = NULL,
  is_primary_listing = true,
  duplicate_detected_at = NULL
WHERE duplicate_group_id IS NOT NULL;

-- 2. Clear duplicate alerts
DELETE FROM duplicate_alerts;

-- 3. Drop old functions
DROP FUNCTION IF EXISTS find_duplicate_property(text, numeric, integer, text, text, uuid);
DROP FUNCTION IF EXISTS find_duplicate_property(text, numeric, integer, text, text, numeric, uuid);
DROP FUNCTION IF EXISTS find_duplicate_property(text, numeric, integer, text, text, numeric, numeric, uuid);
DROP FUNCTION IF EXISTS detect_existing_duplicates();

-- 4. Create new strict function
CREATE OR REPLACE FUNCTION find_property_duplicate(
  p_address TEXT,
  p_city TEXT,
  p_rooms NUMERIC,
  p_floor INTEGER,
  p_size INTEGER,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  source TEXT,
  price NUMERIC,
  size NUMERIC,
  duplicate_group_id UUID
) LANGUAGE plpgsql AS $$
BEGIN
  -- Only process valid addresses (street + number)
  IF p_address IS NULL OR p_address !~ '\d+' THEN
    RETURN;
  END IF;
  
  -- Must have all required fields
  IF p_rooms IS NULL OR p_floor IS NULL OR p_city IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    sp.id,
    sp.source,
    sp.price,
    sp.size,
    sp.duplicate_group_id
  FROM scouted_properties sp
  WHERE sp.is_active = true
    AND sp.address = p_address
    AND sp.city = p_city
    AND sp.rooms = p_rooms
    AND sp.floor = p_floor  -- Exact floor match required!
    AND (p_exclude_id IS NULL OR sp.id != p_exclude_id)
    -- Size within 15% (if both have size)
    AND (
      p_size IS NULL 
      OR sp.size IS NULL 
      OR p_size = 0 
      OR sp.size = 0
      OR ABS(p_size - sp.size)::FLOAT / GREATEST(p_size::FLOAT, sp.size::FLOAT) <= 0.15
    )
  ORDER BY sp.created_at ASC
  LIMIT 1;
END;
$$;

-- 5. Create batch detection function
CREATE OR REPLACE FUNCTION detect_duplicates_batch(batch_size INTEGER DEFAULT 500)
RETURNS TABLE(
  duplicates_found INTEGER,
  groups_created INTEGER,
  properties_processed INTEGER
) LANGUAGE plpgsql AS $$
DECLARE
  v_duplicates_found INTEGER := 0;
  v_groups_created INTEGER := 0;
  v_processed INTEGER := 0;
  rec RECORD;
  match_id UUID;
  match_group UUID;
BEGIN
  -- Process properties without duplicate_group_id that have valid addresses
  FOR rec IN 
    SELECT 
      sp.id,
      sp.address,
      sp.city,
      sp.rooms,
      sp.floor,
      sp.size
    FROM scouted_properties sp
    WHERE sp.is_active = true
      AND sp.duplicate_group_id IS NULL
      AND sp.address ~ '\d+'  -- Has building number
      AND sp.rooms IS NOT NULL
      AND sp.floor IS NOT NULL
      AND sp.city IS NOT NULL
    ORDER BY sp.created_at ASC
    LIMIT batch_size
  LOOP
    v_processed := v_processed + 1;
    
    -- Find existing duplicate
    SELECT d.id, d.duplicate_group_id INTO match_id, match_group
    FROM find_property_duplicate(
      rec.address, rec.city, rec.rooms, rec.floor, rec.size::INTEGER, rec.id
    ) d
    LIMIT 1;
    
    IF match_id IS NOT NULL THEN
      v_duplicates_found := v_duplicates_found + 1;
      
      IF match_group IS NULL THEN
        -- Create new group using match_id as group id
        match_group := match_id;
        v_groups_created := v_groups_created + 1;
        
        UPDATE scouted_properties
        SET duplicate_group_id = match_group,
            duplicate_detected_at = NOW(),
            is_primary_listing = true
        WHERE id = match_id;
      END IF;
      
      -- Add current property to group
      UPDATE scouted_properties
      SET duplicate_group_id = match_group,
          duplicate_detected_at = NOW(),
          is_primary_listing = false
      WHERE id = rec.id;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_duplicates_found, v_groups_created, v_processed;
END;
$$;
```

### שלב 3: עדכון property-helpers.ts

**קובץ:** `supabase/functions/_shared/property-helpers.ts`

```typescript
export async function saveProperty(
  supabase: any, 
  property: ScrapedProperty
): Promise<{ isNew: boolean }> {
  const normalizedCity = normalizeCityName(property.city);
  
  // Duplicate detection - only if we have valid data
  let duplicateGroupId: string | null = null;
  let isPrimaryListing = true;
  
  const hasValidAddress = property.address && /\d+/.test(property.address);
  const canCheckDuplicates = hasValidAddress 
    && property.rooms !== undefined 
    && property.floor !== undefined 
    && normalizedCity;
  
  if (canCheckDuplicates) {
    const { data: duplicates } = await supabase
      .rpc('find_property_duplicate', {
        p_address: property.address,
        p_city: normalizedCity,
        p_rooms: property.rooms,
        p_floor: property.floor,
        p_size: property.size || null,
        p_exclude_id: null
      });
    
    if (duplicates && duplicates.length > 0) {
      const primaryDuplicate = duplicates[0];
      duplicateGroupId = primaryDuplicate.duplicate_group_id || primaryDuplicate.id;
      isPrimaryListing = false;
      
      // Update primary if needed
      if (!primaryDuplicate.duplicate_group_id) {
        await supabase
          .from('scouted_properties')
          .update({ 
            duplicate_group_id: duplicateGroupId,
            duplicate_detected_at: new Date().toISOString(),
            is_primary_listing: true
          })
          .eq('id', primaryDuplicate.id);
      }
    }
  }
  
  // Upsert without duplicate alerts (removed)
  const { data: upsertResult, error } = await supabase
    .from('scouted_properties')
    .upsert({
      // ... existing fields ...
      duplicate_group_id: duplicateGroupId,
      is_primary_listing: isPrimaryListing,
      duplicate_detected_at: duplicateGroupId ? new Date().toISOString() : null,
    }, {
      onConflict: 'source,source_id',
      ignoreDuplicates: true
    })
    .select('id')
    .single();

  return { isNew: !error && !!upsertResult };
}
```

### שלב 4: עדכון UI

**קובץ:** `src/components/scout/ScoutedPropertiesTable.tsx`

שינויים:
1. הסרת `duplicate_alerts` queries
2. הסרת Sheet של התראות כפילויות
3. שמירה על הצגת מספר קבוצות כפילויות בלבד
4. הוספת כפתור "סרוק כפילויות" שקורא ל-RPC החדש

```typescript
// Simplified duplicate stats - just count groups
const { data: duplicateStats } = useQuery({
  queryKey: ['duplicate-stats'],
  queryFn: async () => {
    const { data } = await supabase
      .from('scouted_properties')
      .select('duplicate_group_id')
      .not('duplicate_group_id', 'is', null)
      .eq('is_active', true);
    
    const uniqueGroups = new Set(data?.map(d => d.duplicate_group_id)).size;
    const totalInGroups = data?.length || 0;
    
    return { groups: uniqueGroups, total: totalInGroups };
  }
});

// Run detection mutation - calls new RPC
const runDuplicateDetectionMutation = useMutation({
  mutationFn: async () => {
    const { data, error } = await supabase.rpc('detect_duplicates_batch', {
      batch_size: 1000
    });
    if (error) throw error;
    return data;
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['duplicate-stats'] });
    if (data && data[0]) {
      toast.success(
        `נבדקו ${data[0].properties_processed} נכסים, נמצאו ${data[0].duplicates_found} כפילויות`
      );
    }
  }
});
```

### שלב 5: מחיקת Edge Functions

**למחיקה:**
- `supabase/functions/run-duplicate-detection/`
- `supabase/functions/cleanup-duplicate-scouted/`

---

## סיכום השינויים

| קטגוריה | פעולה | קבצים |
|---------|-------|-------|
| **DB Functions** | מחיקה + יצירה חדשה | migration SQL |
| **Data Cleanup** | איפוס כל הכפילויות | migration SQL |
| **Edge Functions** | מחיקת 2 פונקציות | run-duplicate-detection, cleanup-duplicate-scouted |
| **Shared Helpers** | עדכון לוגיקה | property-helpers.ts |
| **Frontend** | פישוט UI | ScoutedPropertiesTable.tsx |
| **useCustomerMatches** | הסרת קיבוץ כפילויות | useCustomerMatches.ts |

---

## לוגיקה חדשה vs ישנה

| קריטריון | לוגיקה ישנה | לוגיקה חדשה |
|----------|-------------|-------------|
| כתובת | כל כתובת | רחוב + מספר בלבד |
| קומה | לא נדרשת | **חובה זהה** |
| גודל | 10% הפרש | 15% הפרש |
| מחיר | 20% הפרש | לא נדרש |
| התראות | נוצרות אוטומטית | **בוטלו** |
| validation | חלקי | **מלא** (כל השדות) |

---

## תוצאה צפויה

לאחר ההטמעה:
- **0 קבוצות שגויות** - רק דירות זהות יקובצו
- **פחות כפילויות** - רק כפילויות אמיתיות cross-platform
- **UI פשוט יותר** - ללא התראות מיותרות
- **ביצועים טובים יותר** - פחות נתונים לעבד
