

# עדכון הומלס + יצירת יד2 + תצוגה לפי עמודות

## חלק 1: תיקון קונפיגורציות Homeless

### קונפיגורציות שצריכות עדכון:

| שם | בעיה | תיקון |
|----|------|-------|
| Homeless מזרח - השכרה | 5 דפים, 2s | 8 דפים, 15s |
| Homeless מזרח - מכירה | 5 דפים, 2s | 8 דפים, 15s |
| Homeless מרכז - השכרה | 16:00 בתזמון | להסיר 16:00 |
| Homeless מרכז - מכירה | 16:00 בתזמון | להסיר 16:00 |
| Homeless צפון - השכרה | 5 דפים, 2s | 8 דפים, 15s |
| Homeless צפון - מכירה | 16:00 בתזמון | להסיר 16:00 |
| Homeless צפון ירקון - השכרה | 16:00 בתזמון | להסיר 16:00 |
| Homeless צפון ירקון - מכירה | 5 דפים, 2s | 8 דפים, 15s |
| הומלס השכרה - צפון ישן וחדש | ישן, שכונות לא תקינות | למחוק |

**גם חסרות 2 קונפיגורציות:**
- Homeless דרום - השכרה
- Homeless דרום - מכירה
- Homeless יפו - השכרה  
- Homeless יפו - מכירה

---

## חלק 2: יצירת 20 קונפיגורציות Yad2

10 שכונות × 2 סוגים (השכרה/מכירה) = **20 קונפיגורציות**

**תזמון:** מתחיל ב-08:00 עם הפרש 5 דקות

| # | שכונה | סוג | שעה |
|---|-------|-----|-----|
| 1 | הצפון הישן | השכרה | 08:00 |
| 2 | הצפון הישן | מכירה | 08:05 |
| 3 | הצפון החדש | השכרה | 08:10 |
| 4 | הצפון החדש | מכירה | 08:15 |
| 5 | כיכר המדינה | השכרה | 08:20 |
| 6 | כיכר המדינה | מכירה | 08:25 |
| 7 | לב העיר | השכרה | 08:30 |
| 8 | לב העיר | מכירה | 08:35 |
| 9 | בבלי | השכרה | 08:40 |
| 10 | בבלי | מכירה | 08:45 |
| 11 | נווה צדק | השכרה | 08:50 |
| 12 | נווה צדק | מכירה | 08:55 |
| 13 | כרם התימנים | השכרה | 09:00 |
| 14 | כרם התימנים | מכירה | 09:05 |
| 15 | רמת אביב | השכרה | 09:10 |
| 16 | רמת אביב | מכירה | 09:15 |
| 17 | שדרות רוטשילד | השכרה | 09:20 |
| 18 | שדרות רוטשילד | מכירה | 09:25 |
| 19 | נמל תל אביב | השכרה | 09:30 |
| 20 | נמל תל אביב | מכירה | 09:35 |

**פרמטרים:** pages=8, delay=15s, waitFor=5000

---

## חלק 3: תצוגה חדשה - 3 עמודות לפי מקור

במקום גריד 2 עמודות כללי, נציג **3 עמודות** - אחת לכל מקור:

```
┌─────────────────┬─────────────────┬─────────────────┐
│     מדלן        │      יד2        │     הומלס       │
│   (כחול)        │    (כתום)       │    (סגול)       │
├─────────────────┼─────────────────┼─────────────────┤
│ קונפיג 1        │ קונפיג 1        │ קונפיג 1        │
│ קונפיג 2        │ קונפיג 2        │ קונפיג 2        │
│ קונפיג 3        │ קונפיג 3        │ קונפיג 3        │
│ ...             │ ...             │ ...             │
└─────────────────┴─────────────────┴─────────────────┘
```

**כל עמודה:**
- כותרת עם צבע המקור + מספר קונפיגורציות
- רשימה אנכית של כרטיסים קומפקטיים
- במובייל: עמודה אחת עם מסננים

---

## שינויים טכניים

### קובץ 1: עדכוני DB להומלס

```sql
-- עדכון כל ההומלס ל-8 דפים, 15s דיליי, והסרת 16:00
UPDATE scout_configs 
SET max_pages = 8, 
    page_delay_seconds = 15,
    schedule_times = ARRAY[schedule_times[1]]  -- Keep only first time
WHERE source = 'homeless' 
  AND name != 'הומלס השכרה - צפון ישן וחדש';

-- מחיקת הקונפיגורציה הישנה
DELETE FROM scout_configs WHERE id = '94ceebc9-44d5-4d47-82c5-d00cb0c17d85';

-- הוספת החסרות
INSERT INTO scout_configs (...) VALUES 
  ('Homeless דרום - השכרה', ...),
  ('Homeless דרום - מכירה', ...),
  ('Homeless יפו - השכרה', ...),
  ('Homeless יפו - מכירה', ...);
```

### קובץ 2: הוספת 20 קונפיגורציות Yad2

```sql
INSERT INTO scout_configs (name, source, cities, neighborhoods, property_type, is_active, max_pages, page_delay_seconds, wait_for_ms, schedule_times)
VALUES 
  ('Yad2 צפון ישן - השכרה', 'yad2', '{"תל אביב יפו"}', '{"yad2_צפון_ישן"}', 'rent', true, 8, 15, 5000, '{"08:00"}'),
  -- ... 19 more
;
```

### קובץ 3: `UnifiedScoutSettings.tsx` - תצוגת עמודות

```typescript
// Group configs by source
const configsBySource = useMemo(() => {
  if (!configs) return { madlan: [], yad2: [], homeless: [] };
  return {
    madlan: configs.filter(c => c.source === 'madlan'),
    yad2: configs.filter(c => c.source === 'yad2'),
    homeless: configs.filter(c => c.source === 'homeless'),
  };
}, [configs]);

// Render 3 columns
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {/* Madlan Column */}
  <div className="space-y-2">
    <div className="flex items-center gap-2 p-2 bg-blue-500/10 rounded-lg border-l-4 border-l-blue-500">
      <span className="font-semibold">מדלן</span>
      <Badge variant="outline">{configsBySource.madlan.length}</Badge>
    </div>
    {configsBySource.madlan.map(config => <ConfigCard key={config.id} config={config} />)}
  </div>
  
  {/* Yad2 Column */}
  <div className="space-y-2">
    <div className="flex items-center gap-2 p-2 bg-orange-500/10 rounded-lg border-l-4 border-l-orange-500">
      <span className="font-semibold">יד2</span>
      <Badge variant="outline">{configsBySource.yad2.length}</Badge>
    </div>
    {configsBySource.yad2.map(config => <ConfigCard key={config.id} config={config} />)}
  </div>
  
  {/* Homeless Column */}
  <div className="space-y-2">
    <div className="flex items-center gap-2 p-2 bg-purple-500/10 rounded-lg border-l-4 border-l-purple-500">
      <span className="font-semibold">הומלס</span>
      <Badge variant="outline">{configsBySource.homeless.length}</Badge>
    </div>
    {configsBySource.homeless.map(config => <ConfigCard key={config.id} config={config} />)}
  </div>
</div>
```

---

## תוצאה צפויה

### תצוגה חדשה:
- 3 עמודות ברורות לפי מקור
- כותרת צבעונית לכל עמודה עם מספר הקונפיגורציות
- קל לראות ולהשוות בין המקורות

### Homeless (12 קונפיגורציות):
- כולם עם 8 דפים, 15s דיליי
- תזמון רק לשעות ה-19:XX שביקשת

### Yad2 (20 קונפיגורציות חדשות):
- 10 שכונות × השכרה + מכירה
- תזמון 08:00-09:35 עם הפרש 5 דקות

---

## סיכום קבצים

| קובץ/טבלה | שינוי |
|-----------|-------|
| `scout_configs` (DB) | עדכון 8 הומלס, מחיקת 1 ישן, הוספת 4 חסרים + 20 יד2 |
| `UnifiedScoutSettings.tsx` | תצוגת 3 עמודות לפי מקור |

