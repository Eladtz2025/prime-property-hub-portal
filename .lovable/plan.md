

# סריקת פרויקטים לפי URL -- Project Scout

## מה הולך לקרות

כשמזינים פרויקט חדש (או עורכים פרויקט קיים), תהיה אפשרות **אופציונלית** להוסיף URL של עמוד הפרויקט באתר חיצוני. אם הוזן URL, המערכת תסרוק אותו אוטומטית כל 2-3 ימים ותשמור את רשימת הדירות/יחידות שיש בפרויקט. כשדירה נמכרת (נעלמת מהאתר) או מחיר משתנה -- המערכת מזהה ומעדכנת.

**חשוב:** ההזנה הידנית של פרויקט נשארת כמו שהיא. ה-URL הוא רק תוספת אופציונלית למעקב.

## איך זה עובד עם אתרים שונים

הבעיה: כל אתר פרויקטים בנוי אחרת (city-people, מדלן, יד2, אתרי יזמים וכו'). פתרון: שימוש ב-**Firecrawl JSON Extraction** -- פיצ'ר שמשתמש ב-AI כדי לחלץ מידע מובנה מכל אתר, ללא צורך בפרסר ייעודי לכל אתר. נגדיר סכמה של מה אנחנו מחפשים (חדרים, שטח, קומה, מחיר, סטטוס) וה-AI של Firecrawl ידע לחלץ את זה מכל מבנה HTML.

## שינויים נדרשים

### 1. דאטאבייס

**עמודה חדשה ב-`properties`:**

| שדה | סוג | תיאור |
|-----|------|--------|
| `tracking_url` | text | URL לסריקה אוטומטית (אופציונלי) |

**טבלה חדשה: `project_units`** -- שמירת היחידות שנמצאו בכל סריקה

| שדה | סוג | תיאור |
|-----|------|--------|
| id | uuid | מזהה |
| property_id | uuid (FK) | הפרויקט |
| unit_identifier | text | מזהה ייחודי (קומה+חדרים+שטח) |
| rooms | numeric | חדרים |
| size | integer | שטח |
| floor | integer | קומה |
| price | integer | מחיר |
| unit_type | text | סוג (דירה, פנטהאוז, דופלקס) |
| status | text | available / sold / reserved |
| raw_text | text | הטקסט המקורי |
| first_seen_at | timestamptz | נראתה לראשונה |
| last_seen_at | timestamptz | נראתה לאחרונה |
| removed_at | timestamptz | הוסרה (נמכרה) |
| price_history | jsonb | היסטוריית מחירים |

**טבלה חדשה: `project_scan_logs`** -- לוג סריקות

| שדה | סוג | תיאור |
|-----|------|--------|
| id | uuid | מזהה |
| property_id | uuid (FK) | הפרויקט |
| scanned_at | timestamptz | מתי נסרק |
| units_found | integer | כמה נמצאו |
| units_added | integer | חדשות |
| units_removed | integer | הוסרו (נמכרו) |
| units_changed | integer | שינויים (מחיר) |
| status | text | completed / failed |
| error | text | שגיאה (אם יש) |

### 2. Edge Function חדש: `scout-project`

פונקציה שסורקת עמוד פרויקט אחד:
1. שולפת את כל הפרויקטים עם `tracking_url` מטבלת `properties`
2. סורקת כל URL עם Firecrawl JSON extraction (סכמה גנרית שעובדת עם כל אתר)
3. משווה את התוצאות עם מה שקיים ב-`project_units`:
   - יחידה חדשה --> status = available
   - יחידה שנעלמה --> status = sold
   - שינוי מחיר --> עדכון + הוספה ל-price_history
   - ללא שינוי --> עדכון last_seen_at
4. שומרת log ב-`project_scan_logs`
5. מעדכנת את `units_count` בטבלת properties

סכמת חילוץ ל-Firecrawl (עובדת עם כל אתר):
```text
{
  project_name: string,
  units: [{
    rooms: number,
    size_sqm: number,
    floor: number,
    price: number,
    unit_type: string,  // "דירה", "פנטהאוז", "דופלקס"
    status: string,     // "זמין", "נמכר", "reserved"
    description: string
  }]
}
```

### 3. Cron Job

סריקה אוטומטית כל 48 שעות בשעה 14:00 UTC (16:00 ישראל), שלא מתנגשת עם הסריקות הקיימות.

### 4. עדכון טופס הוספת פרויקט (AddPropertyModal)

כשסוג הנכס הוא `project`, מוסיפים שדה אופציונלי:
- **URL מעקב** -- שדה טקסט עם placeholder
- תווית: "קישור לעמוד הפרויקט באתר חיצוני (לסריקה אוטומטית)"
- אם לא הוזן URL -- הפרויקט נשאר כפרויקט ידני רגיל

### 5. עדכון טופס עריכת פרויקט (PropertyEditRow)

אותו שדה URL גם בטופס העריכה.

### 6. עדכון Hook הנתונים (useSupabasePropertyData)

מיפוי `tracking_url` (trackingUrl) בטעינה ושמירה.

### 7. קומפוננטה חדשה: תצוגת יחידות פרויקט (ProjectUnitsTable)

טבלה שמוצגת בתוך עמוד הנכס כשיש tracking_url:
- עמודות: סוג, חדרים, שטח, קומה, מחיר, סטטוס, נראה לאחרונה
- Badge צבעוני לסטטוס (ירוק=זמין, אדום=נמכר, כתום=שמור)
- סטטיסטיקה: X זמינות, Y נמכרו, Z שינויים
- כפתור "סרוק עכשיו" לסריקה ידנית

### 8. עדכון Types (property.ts)

הוספת `trackingUrl?: string` ל-interface Property.

## פירוט טכני

### DB Migration

```text
-- Add tracking_url to properties
ALTER TABLE properties ADD COLUMN tracking_url text;

-- Project units table
CREATE TABLE project_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_identifier text NOT NULL,
  rooms numeric,
  size integer,
  floor integer,
  price integer,
  unit_type text,
  status text DEFAULT 'available',
  raw_text text,
  first_seen_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  removed_at timestamptz,
  price_history jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(property_id, unit_identifier)
);

-- Project scan logs table
CREATE TABLE project_scan_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  scanned_at timestamptz DEFAULT now(),
  units_found integer DEFAULT 0,
  units_added integer DEFAULT 0,
  units_removed integer DEFAULT 0,
  units_changed integer DEFAULT 0,
  status text DEFAULT 'completed',
  error text,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE project_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_scan_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage project units"
  ON project_units FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage scan logs"
  ON project_scan_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### Cron Job (SQL Insert, not migration)

```text
SELECT cron.schedule(
  'scout-projects-every-48h',
  '0 14 */2 * *',  -- כל 48 שעות בשעה 14:00 UTC
  $$ SELECT net.http_post(...) $$
);
```

### Edge Function Architecture

```text
scout-project (Edge Function)
  |
  |--> Firecrawl JSON extraction (formats: [{type:'json', schema:...}])
  |     - Generic schema works with ANY website
  |     - No site-specific parser needed
  |
  |--> Compare with existing project_units
  |     - New unit? INSERT with status='available'
  |     - Missing unit? UPDATE status='sold', set removed_at
  |     - Price changed? UPDATE price, append to price_history
  |     - Same? UPDATE last_seen_at
  |
  |--> Save log to project_scan_logs
  |--> Update properties.units_count
```

## סיכום

- 1 migration (עמודה חדשה + 2 טבלאות + RLS)
- 1 edge function חדש (`scout-project`)
- 1 cron job חדש
- 1 קומפוננטה חדשה (ProjectUnitsTable)
- ~4 קבצים לעדכון (types, AddPropertyModal, PropertyEditRow, useSupabasePropertyData)
- ההזנה הידנית של פרויקט נשארת כמו שהיא -- ה-URL הוא רק תוספת אופציונלית
- פתרון גנרי (Firecrawl AI extraction) שעובד עם כל אתר ללא פרסר ייעודי

