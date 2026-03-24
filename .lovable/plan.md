

## תיקון כרטיס סריקות — סיכום כל ריצות היום האחרון

### הבעיה
שורה 264: `limit(1).maybeSingle()` מחזיר רק ריצה אחת (homeless = 294). צריך לסכום את כל הריצות מאותו יום: 1,651 נמצאו, 71 חדשים.

### התיקון
**`src/components/scout/ChecksDashboard.tsx`** — שינוי query `scan-last-run-jina` (שורות 261-268):

1. שליפת הריצה האחרונה כדי לדעת מה התאריך האחרון
2. שליפת כל הריצות מאותו יום (בלי limit שרירותי — מסננים לפי תאריך)
3. סיכום `properties_found` ו-`new_properties` מכל הריצות של אותו יום

**לוגיקה:**
```javascript
// שלב 1: מוצא את הריצה האחרונה
const { data: lastRun } = await supabase.from('scout_runs')
  .select('started_at').eq('scanner', 'jina')
  .order('started_at', { ascending: false }).limit(1).maybeSingle();

// שלב 2: שולף את כל הריצות מאותו יום
const dayStart = startOfDay(lastRun.started_at);
const dayEnd = endOfDay(lastRun.started_at);
const { data: runs } = await supabase.from('scout_runs')
  .select('started_at, completed_at, status, properties_found, new_properties, source')
  .eq('scanner', 'jina')
  .gte('started_at', dayStart).lte('started_at', dayEnd);

// שלב 3: סיכום
totalFound = runs.reduce(sum of properties_found)
totalNew = runs.reduce(sum of new_properties)
```

**עדכון ה-ProcessCard (שורות 471-502):**
- `secondaryLine` → `${totalFound} נמצאו`
- `insight` → `${totalNew} חדשים`
- `lastRun` → זמן הריצה האחרונה

שינוי בקובץ אחד, ~20 שורות.

