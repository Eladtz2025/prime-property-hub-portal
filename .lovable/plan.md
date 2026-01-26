
# שדרוג פילטרים: בחירה מרובה + לוגיקת OR

## סיכום השינויים

| פילטר | לפני | אחרי |
|-------|------|------|
| שכונות | בחירה יחידה (Select) | בחירה מרובה (Checkboxes) |
| תוספות | AND - נכס עם כל התוספות | OR - נכס עם אחת מהתוספות |

---

## שינוי 1: שכונות - בחירה מרובה

### שינויים טכניים

**קובץ:** `src/components/scout/ScoutedPropertiesTable.tsx`

**1. שינוי סוג המשתנה (שורה ~107):**
```typescript
// לפני:
const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>('all');

// אחרי:
const [neighborhoodFilter, setNeighborhoodFilter] = useState<string[]>([]);
```

**2. שינוי appliedFilters (שורות 111-131):**
```typescript
// לפני:
neighborhood: string;

// אחרי:
neighborhoods: string[];
```

**3. פונקציית toggle חדשה:**
```typescript
const toggleNeighborhood = (neighborhood: string) => {
  setNeighborhoodFilter(prev => 
    prev.includes(neighborhood) 
      ? prev.filter(n => n !== neighborhood)
      : [...prev, neighborhood]
  );
};
```

**4. שינוי לוגיקת השאילתה (שורות 390-395):**
```typescript
// לפני: 
if (filters.neighborhood !== 'all') {
  const patterns = NEIGHBORHOOD_GROUPS[filters.neighborhood] || [filters.neighborhood];
  const orConditions = patterns.map(p => `neighborhood.ilike.%${p}%`).join(',');
  query = query.or(orConditions);
}

// אחרי:
if (filters.neighborhoods.length > 0) {
  // Collect all patterns from all selected neighborhoods
  const allPatterns: string[] = [];
  filters.neighborhoods.forEach(n => {
    const patterns = NEIGHBORHOOD_GROUPS[n] || [n];
    allPatterns.push(...patterns);
  });
  const orConditions = allPatterns.map(p => `neighborhood.ilike.%${p}%`).join(',');
  query = query.or(orConditions);
}
```

**5. שינוי ה-UI ל-Popover עם Checkboxes:**

במקום Select:
```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" className="h-8 relative justify-between">
      <span className="text-sm">
        {neighborhoodFilter.length === 0 
          ? 'שכונות' 
          : `${neighborhoodFilter.length} שכונות`}
      </span>
      {neighborhoodFilter.length > 0 && (
        <Badge className="h-4 px-1 ml-2">{neighborhoodFilter.length}</Badge>
      )}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-56 max-h-80 overflow-y-auto">
    <div className="space-y-2">
      {Object.keys(NEIGHBORHOOD_GROUPS).map(group => (
        <div key={group} className="flex items-center gap-2">
          <Checkbox
            id={`neighborhood-${group}`}
            checked={neighborhoodFilter.includes(group)}
            onCheckedChange={() => toggleNeighborhood(group)}
          />
          <label htmlFor={`neighborhood-${group}`} className="text-sm cursor-pointer">
            {group}
          </label>
        </div>
      ))}
    </div>
  </PopoverContent>
</Popover>
```

---

## שינוי 2: תוספות - לוגיקת OR

### שינויים טכניים

**קובץ:** `src/components/scout/ScoutedPropertiesTable.tsx`

**שינוי לוגיקת השאילתה (שורות 396-401):**

```typescript
// לפני (AND logic):
if (filters.features.length > 0) {
  filters.features.forEach(feature => {
    query = query.eq(`features->>${feature}`, 'true');
  });
}

// אחרי (OR logic):
if (filters.features.length > 0) {
  const orConditions = filters.features
    .map(f => `features->>${f}.eq.true`)
    .join(',');
  query = query.or(orConditions);
}
```

### הסבר ההבדל

**AND (לפני):** 
- בחרת מרפסת, גג, חצר
- מציג רק נכסים שיש בהם מרפסת **וגם** גג **וגם** חצר

**OR (אחרי):**
- בחרת מרפסת, גג, חצר  
- מציג נכסים שיש בהם מרפסת **או** גג **או** חצר

---

## שינויים נוספים

### עדכון פונקציית clearAllFilters:
```typescript
// לפני:
setNeighborhoodFilter('all');

// אחרי:
setNeighborhoodFilter([]);
```

### עדכון hasActiveFilters:
```typescript
// לפני:
neighborhoodFilter !== 'all'

// אחרי:
neighborhoodFilter.length > 0
```

### עדכון handleSearch:
```typescript
// לפני:
neighborhood: neighborhoodFilter,

// אחרי:
neighborhoods: neighborhoodFilter,
```

---

## תוצאה צפויה

1. **שכונות**: כפתור שנפתח עם רשימת checkboxes - אפשר לסמן צפון ישן + לב העיר + פלורנטין ביחד
2. **תוספות**: בחירת מרפסת + גג + חצר תציג כל נכס שיש בו לפחות אחד מהשלושה
3. **חיווי ויזואלי**: Badge עם מספר הבחירות על כל כפתור
