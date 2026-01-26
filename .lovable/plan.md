

# Personal Scout - סריקה מותאמת אישית

## עקרון מנחה

**העתקה מדויקת של הקוד שעובד + מערכת נפרדת לחלוטין**

---

## 1. מבנה קבצים חדש

```text
supabase/functions/
├── personal-scout-trigger/     ← חדש לגמרי
│   └── index.ts
├── personal-scout-worker/      ← חדש לגמרי
│   └── index.ts
└── _personal-scout/            ← תיקייה חדשה - העתקה מדויקת
    ├── parser-yad2.ts          ← העתקה מ-_experimental (364 שורות)
    ├── parser-madlan.ts        ← העתקה מ-_experimental (406 שורות)
    ├── parser-homeless.ts      ← העתקה מ-_experimental (298 שורות)
    ├── parser-utils.ts         ← העתקה מ-_experimental (383 שורות)
    ├── scraping.ts             ← העתקה מ-_shared (חלקי - פונקציות נדרשות)
    ├── url-builder.ts          ← העתקה מ-_shared (מיפויי ערים + buildSinglePageUrl)
    └── feature-filter.ts       ← חדש - סינון לפי פיצ'רים של לקוח
```

---

## 2. קבצים שמועתקים בדיוק (ללא שינוי)

### מ-`_experimental/`:
| קובץ | שורות | תפקיד |
|------|-------|-------|
| `parser-yad2.ts` | 364 | פרסר יד2 - regex patterns, block detection |
| `parser-madlan.ts` | 406 | פרסר מדלן - Format A/B handling |
| `parser-homeless.ts` | 298 | פרסר הומלס - cheerio HTML parsing |
| `parser-utils.ts` | 383 | פונקציות עזר - extractPrice, extractRooms, etc. |

### מ-`_shared/`:
| פונקציה | מקור | תפקיד |
|---------|------|-------|
| `scrapeWithRetry()` | scraping.ts | סריקה עם retry ו-proxy logic |
| `validateScrapedContent()` | scraping.ts | זיהוי CAPTCHA וחסימות |
| `buildSinglePageUrl()` | url-builders.ts | בניית URLs עם מחיר/חדרים |
| `yad2CityMap`, `madlanCityMap`, `homelessCityMap` | url-builders.ts | מיפויי ערים |

---

## 3. ה-Proxy Logic (מועתק בדיוק)

```typescript
// scraping.ts שורה 114 - זה הקוד שפיצח
proxy: source === 'yad2' ? 'stealth' : 'auto'
```

| אתר | Proxy | Credits | סיבה |
|-----|-------|---------|------|
| יד2 | stealth | 5 | IP רזידנציאלי מונע חסימות |
| מדלן | auto | 1 | פשוט עובד יותר טוב |
| הומלס | auto | 1 | אין חסימות |

---

## 4. תמיכה בסינון URL (מה שקיים)

**יד2 - תומך במחיר וחדרים ב-URL:**
```typescript
// url-builders.ts שורות 121-122
if (config.min_price) params.set('price', `${config.min_price}-${config.max_price || ''}`);
if (config.min_rooms) params.set('rooms', `${config.min_rooms}-${config.max_rooms || ''}`);
```

**מדלן והומלס - רק עיר:**
- מחיר וחדרים יסוננו אחרי הפרסינג

---

## 5. קובץ חדש: `feature-filter.ts`

```typescript
/**
 * Filter properties by lead preferences
 * Applied AFTER parsing - not in URL
 */
export function filterByLeadPreferences(
  properties: ParsedProperty[],
  lead: {
    preferred_neighborhoods?: string[];
    budget_min?: number;
    budget_max?: number;
    rooms_min?: number;
    rooms_max?: number;
    balcony_required?: boolean;
    balcony_flexible?: boolean;
    parking_required?: boolean;
    parking_flexible?: boolean;
    elevator_required?: boolean;
    elevator_flexible?: boolean;
    // ... etc
  }
): ParsedProperty[] {
  return properties.filter(prop => {
    // 1. Budget filter (for Madlan/Homeless that don't support URL filter)
    if (lead.budget_max && prop.price && prop.price > lead.budget_max) {
      return false;
    }
    if (lead.budget_min && prop.price && prop.price < lead.budget_min) {
      return false;
    }
    
    // 2. Rooms filter (for Madlan/Homeless)
    if (lead.rooms_min && prop.rooms && prop.rooms < lead.rooms_min) {
      return false;
    }
    if (lead.rooms_max && prop.rooms && prop.rooms > lead.rooms_max) {
      return false;
    }
    
    // 3. Neighborhood filter
    if (lead.preferred_neighborhoods?.length > 0) {
      if (!prop.neighborhood) return false;
      const matchesNeighborhood = lead.preferred_neighborhoods.some(n => 
        prop.neighborhood?.includes(n) || n.includes(prop.neighborhood || '')
      );
      if (!matchesNeighborhood) return false;
    }
    
    // 4. Feature filters (from parsed data - if available)
    // Note: Current parsers don't extract features, so this is for future
    // For now, features won't be filtered - all properties pass
    
    return true;
  });
}
```

---

## 6. `personal-scout-trigger/index.ts`

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Trigger personal scout for each eligible lead
 * Completely separate from trigger-scout-pages
 */

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 1. Get all eligible leads
  const { data: leads, error } = await supabase
    .from('contact_leads')
    .select('*')
    .eq('matching_status', 'eligible')
    .eq('active_status', 'active');

  if (error || !leads?.length) {
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'No eligible leads found' 
    }));
  }

  console.log(`🎯 Personal Scout: Found ${leads.length} eligible leads`);

  // 2. Create a personal scout run record
  const { data: runRecord } = await supabase
    .from('personal_scout_runs')
    .insert({
      status: 'running',
      leads_count: leads.length,
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  const runId = runRecord?.id;

  // 3. Trigger worker for each lead with delays
  const DELAY_BETWEEN_LEADS_MS = 5000; // 5 seconds between leads

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    
    // Skip if no city preference (can't build URL)
    if (!lead.preferred_cities?.length) {
      console.log(`⚠️ Skipping lead ${lead.id}: no preferred cities`);
      continue;
    }

    // Wait before triggering (except first)
    if (i > 0) {
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_LEADS_MS));
    }

    console.log(`📄 Triggering personal scout for lead ${lead.full_name || lead.id}`);

    try {
      await fetch(`${supabaseUrl}/functions/v1/personal-scout-worker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
          lead_id: lead.id,
          run_id: runId
        })
      });
    } catch (err) {
      console.error(`Error triggering lead ${lead.id}:`, err);
    }
  }

  return new Response(JSON.stringify({
    success: true,
    run_id: runId,
    leads_triggered: leads.length
  }));
});
```

---

## 7. `personal-scout-worker/index.ts`

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { scrapeWithRetry, validateScrapedContent } from '../_personal-scout/scraping.ts';
import { buildPersonalUrl } from '../_personal-scout/url-builder.ts';
import { parseYad2Markdown } from '../_personal-scout/parser-yad2.ts';
import { parseMadlanMarkdown } from '../_personal-scout/parser-madlan.ts';
import { parseHomelessHtml } from '../_personal-scout/parser-homeless.ts';
import { filterByLeadPreferences } from '../_personal-scout/feature-filter.ts';

/**
 * Personal Scout Worker - scans for a specific lead
 * Completely separate from scout-yad2/madlan/homeless
 */

const SOURCES = ['yad2', 'madlan', 'homeless'];
const MAX_PAGES_PER_SOURCE = 3; // רק 3 עמודים - הפילטרים צריכים לצמצם תוצאות

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { lead_id, run_id } = await req.json();

  // 1. Get lead details
  const { data: lead } = await supabase
    .from('contact_leads')
    .select('*')
    .eq('id', lead_id)
    .single();

  if (!lead) {
    return new Response(JSON.stringify({ error: 'Lead not found' }), { status: 404 });
  }

  console.log(`🎯 Personal Scout Worker: Lead ${lead.full_name}`);
  console.log(`   Cities: ${lead.preferred_cities?.join(', ')}`);
  console.log(`   Budget: ${lead.budget_min}-${lead.budget_max}`);
  console.log(`   Rooms: ${lead.rooms_min}-${lead.rooms_max}`);

  const allMatches = [];
  const propertyType = lead.property_type || 'rent';

  // 2. Scan each source
  for (const source of SOURCES) {
    console.log(`📡 Scanning ${source} for lead ${lead.full_name}`);

    for (let page = 1; page <= MAX_PAGES_PER_SOURCE; page++) {
      // Build URL with lead parameters
      const url = buildPersonalUrl({
        source,
        city: lead.preferred_cities[0],
        property_type: propertyType,
        min_price: lead.budget_min,
        max_price: lead.budget_max,
        min_rooms: lead.rooms_min,
        max_rooms: lead.rooms_max,
        page
      });

      console.log(`   Page ${page}: ${url}`);

      // Scrape with EXACT same logic as production
      const scrapeData = await scrapeWithRetry(url, firecrawlApiKey, source, 2);
      if (!scrapeData) {
        console.log(`   ❌ Page ${page} blocked/failed`);
        continue;
      }

      const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
      const html = scrapeData.data?.html || scrapeData.html || '';

      // Validate with EXACT same logic
      const validation = validateScrapedContent(markdown, html, source);
      if (!validation.valid) {
        console.log(`   ❌ Validation failed: ${validation.reason}`);
        continue;
      }

      // Parse with EXACT same parsers
      let properties = [];
      if (source === 'yad2') {
        properties = parseYad2Markdown(markdown, propertyType).properties;
      } else if (source === 'madlan') {
        properties = parseMadlanMarkdown(markdown, propertyType).properties;
      } else if (source === 'homeless') {
        properties = parseHomelessHtml(html, propertyType).properties;
      }

      console.log(`   ✅ Parsed ${properties.length} properties`);

      // Filter by lead preferences (neighborhoods, features)
      const filtered = filterByLeadPreferences(properties, lead);
      console.log(`   🎯 After filtering: ${filtered.length} matches`);

      // Add to results
      for (const prop of filtered) {
        allMatches.push({
          ...prop,
          lead_id: lead.id,
          source,
          page
        });
      }

      // Small delay between pages
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // 3. Save matches to personal_scout_matches
  if (allMatches.length > 0) {
    await supabase.from('personal_scout_matches').insert(
      allMatches.map(m => ({
        run_id,
        lead_id: m.lead_id,
        source: m.source,
        source_url: m.source_url,
        address: m.address,
        city: m.city,
        neighborhood: m.neighborhood,
        price: m.price,
        rooms: m.rooms,
        floor: m.floor,
        size: m.size,
        is_private: m.is_private
      }))
    );
  }

  console.log(`✅ Personal Scout completed for ${lead.full_name}: ${allMatches.length} matches`);

  return new Response(JSON.stringify({
    success: true,
    lead_id,
    matches_found: allMatches.length
  }));
});
```

---

## 8. טבלאות DB חדשות

```sql
-- ריצות של סריקה אישית
CREATE TABLE personal_scout_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT DEFAULT 'pending',
  leads_count INTEGER DEFAULT 0,
  leads_completed INTEGER DEFAULT 0,
  total_matches INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- התאמות שנמצאו בסריקה אישית
CREATE TABLE personal_scout_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES personal_scout_runs(id),
  lead_id UUID REFERENCES contact_leads(id),
  source TEXT NOT NULL,
  source_url TEXT,
  address TEXT,
  city TEXT,
  neighborhood TEXT,
  price INTEGER,
  rooms NUMERIC,
  floor INTEGER,
  size INTEGER,
  is_private BOOLEAN DEFAULT true,
  is_reviewed BOOLEAN DEFAULT false,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- אינדקסים לביצועים
CREATE INDEX idx_personal_scout_matches_lead_id ON personal_scout_matches(lead_id);
CREATE INDEX idx_personal_scout_matches_run_id ON personal_scout_matches(run_id);
CREATE INDEX idx_personal_scout_matches_created_at ON personal_scout_matches(created_at);

-- RLS
ALTER TABLE personal_scout_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_scout_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view personal scout runs"
  ON personal_scout_runs FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can view personal scout matches"
  ON personal_scout_matches FOR SELECT
  TO authenticated USING (true);
```

---

## 9. שלבי ביצוע

### שלב 1: יצירת תיקייה ו-העתקת קבצים
1. יצירת `supabase/functions/_personal-scout/`
2. העתקה מדויקת של הפרסרים מ-`_experimental/`
3. העתקה חלקית של `scraping.ts` ו-`url-builders.ts`
4. יצירת `feature-filter.ts` חדש

### שלב 2: יצירת Edge Functions
1. יצירת `personal-scout-trigger/index.ts`
2. יצירת `personal-scout-worker/index.ts`

### שלב 3: יצירת טבלאות
1. Migration לטבלאות חדשות עם RLS

### שלב 4: עדכון config.toml
1. הוספת הפונקציות החדשות

---

## 10. מה לא נוגעים

| קבצים קיימים | סטטוס |
|-------------|-------|
| `scout-yad2/index.ts` | ללא שינוי |
| `scout-madlan/index.ts` | ללא שינוי |
| `scout-homeless/index.ts` | ללא שינוי |
| `trigger-scout-pages/index.ts` | ללא שינוי |
| `_experimental/*` | ללא שינוי |
| `_shared/*` | ללא שינוי |
| `scouted_properties` | ללא שינוי |
| `scout_runs` | ללא שינוי |

**סה"כ: אפס מגע בקוד קיים. הכל חדש, נפרד, ומבוסס על העתקה מדויקת.**

