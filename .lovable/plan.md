

# יצירת 12 קונפיגורציות Homeless + צבעי מקור לקונפיגורציות

## מה נעשה

### חלק 1: יצירת קונפיגורציות Homeless

נייצר 12 קונפיגורציות חדשות ל-Homeless:
- 6 אזורים × 2 סוגי נכס (השכרה/מכירה) = **12 קונפיגורציות**
- תזמון מדורג כל 5 דקות החל מ-19:00

| # | שכונה | סוג | שעה |
|---|-------|-----|-----|
| 1 | תל-אביב מרכז | השכרה | 19:00 |
| 2 | תל-אביב מרכז | מכירה | 19:05 |
| 3 | תל-אביב דרום | השכרה | 19:10 |
| 4 | תל-אביב דרום | מכירה | 19:15 |
| 5 | תל-אביב צפון | השכרה | 19:20 |
| 6 | תל-אביב צפון | מכירה | 19:25 |
| 7 | תל-אביב מזרח | השכרה | 19:30 |
| 8 | תל-אביב מזרח | מכירה | 19:35 |
| 9 | ת"א צפונית לירקון | השכרה | 19:40 |
| 10 | ת"א צפונית לירקון | מכירה | 19:45 |
| 11 | יפו | השכרה | 19:50 |
| 12 | יפו | מכירה | 19:55 |

**הערה**: יש כרגע 3 קונפיגורציות ישנות של Homeless שישתמשו בשכונות הישנות. אפשר למחוק אותן או להשאיר לתאימות לאחור.

---

### חלק 2: צבעי מקור לכרטיסי קונפיגורציה

נוסיף קונטור צבעוני לכל כרטיס לפי המקור:

| מקור | צבע |
|------|-----|
| **מדלן** | כחול (border-blue-500) |
| **יד2** | כתום (border-orange-500) |
| **הומלס** | סגול (border-purple-500) |

---

## שינויים טכניים

### קובץ 1: הכנסת 12 קונפיגורציות לבסיס הנתונים

נשתמש ב-SQL INSERT להוספת הקונפיגורציות:

```sql
INSERT INTO scout_configs (name, source, cities, neighborhoods, property_type, is_active, max_pages, page_delay_seconds, schedule_times)
VALUES 
  ('Homeless מרכז - השכרה', 'homeless', '{"תל אביב יפו"}', '{"homeless_תא_מרכז"}', 'rent', true, 5, 2, '{"19:00"}'),
  ('Homeless מרכז - מכירה', 'homeless', '{"תל אביב יפו"}', '{"homeless_תא_מרכז"}', 'sale', true, 5, 2, '{"19:05"}'),
  -- ... (עוד 10 שורות)
;
```

### קובץ 2: `src/components/scout/UnifiedScoutSettings.tsx`

הוספת פונקציה לקבלת צבע לפי מקור ועדכון ה-Card:

```typescript
// Helper to get source border color
const getSourceBorderColor = (source: string): string => {
  switch (source) {
    case 'madlan': return 'border-l-4 border-l-blue-500';
    case 'yad2': return 'border-l-4 border-l-orange-500';
    case 'homeless': return 'border-l-4 border-l-purple-500';
    default: return '';
  }
};

// In the Card component (line ~1031):
<Card 
  key={config.id} 
  className={`${!config.is_active ? 'opacity-60' : ''} ${getSourceBorderColor(config.source)}`}
  dir="rtl"
>
```

---

## תוצאה צפויה

### כרטיסי קונפיגורציה עם צבעים:
- כל כרטיס יהיה עם פס צבעוני בצד שמאל לפי המקור
- מדלן = כחול, יד2 = כתום, הומלס = סגול

### 12 קונפיגורציות Homeless חדשות:
- כל אזור בהומלס יקבל 2 קונפיגורציות (השכרה + מכירה)
- סריקות יתחילו ב-19:00 עם הפרש של 5 דקות

---

## סיכום קבצים לעדכון

| קובץ | שינוי |
|------|-------|
| `scout_configs` (DB) | הוספת 12 קונפיגורציות Homeless |
| `UnifiedScoutSettings.tsx` | הוספת צבעי קונטור לפי מקור |

