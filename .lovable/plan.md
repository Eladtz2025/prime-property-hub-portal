
# תוכנית: בדיקת זמינות ידנית לנכסים

## סיכום

הוספת אפשרות לבדוק זמינות (availability) של נכס ספציפי ישירות מהטבלה, ללא תלות ב-daily queue. בנוסף, הוספת סטטיסטיקה חדשה שמציגה כמה נכסים ממתינים לבדיקה ראשונה.

---

## שינויים מתוכננים

### 1. כפתור "בדוק זמינות" בכל שורה בטבלה

**קובץ:** `src/components/scout/ScoutedPropertiesTable.tsx`

**מיקום:** באזור הפעולות (Actions) ליד כפתורי Eye, ExternalLink, Download, Archive, Delete

**שינויים:**

**א) הוספת mutation חדש:**
```typescript
// Check availability mutation
const checkAvailabilityMutation = useMutation({
  mutationFn: async (propertyId: string) => {
    const { data, error } = await supabase.functions.invoke('check-property-availability', {
      body: { property_ids: [propertyId] }
    });
    if (error) throw error;
    return data;
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['scouted-properties'] });
    queryClient.invalidateQueries({ queryKey: ['scouted-properties-stats'] });
    
    if (data.marked_inactive > 0) {
      toast.error(`הנכס סומן כלא פעיל (${data.inactive_ids?.[0] ? 'הוסר מהמקור' : 'לא זמין'})`);
    } else {
      toast.success(`הנכס נבדק ונמצא פעיל (${data.checked} נבדקו)`);
    }
  },
  onError: (error) => {
    console.error('Availability check error:', error);
    toast.error('שגיאה בבדיקת זמינות');
  }
});
```

**ב) הוספת כפתור בטבלה (Desktop) - אחרי כפתור Archive:**
```typescript
<Button
  variant="ghost"
  size="icon"
  onClick={() => checkAvailabilityMutation.mutate(property.id)}
  disabled={checkAvailabilityMutation.isPending}
  title="בדוק זמינות עכשיו"
>
  {checkAvailabilityMutation.isPending ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : (
    <RefreshCw className="h-4 w-4" />
  )}
</Button>
```

**ג) הוספת כפתור גם ב-Mobile cards:**
```typescript
<Button
  variant="ghost"
  size="sm"
  className="h-7 w-7 p-0"
  onClick={() => checkAvailabilityMutation.mutate(property.id)}
  disabled={checkAvailabilityMutation.isPending}
>
  {checkAvailabilityMutation.isPending ? (
    <Loader2 className="h-3.5 w-3.5 animate-spin" />
  ) : (
    <RefreshCw className="h-3.5 w-3.5" />
  )}
</Button>
```

---

### 2. סטטיסטיקה חדשה: "ממתינים לבדיקה ראשונה"

**קובץ:** `src/components/scout/ScoutedPropertiesTable.tsx`

**ב-stats query (שורות 312-419) - הוספת ספירה:**
```typescript
// Pending first check count (availability_checked_at is null)
const { count: pendingCheckCount } = await supabase
  .from('scouted_properties')
  .select('*', { count: 'exact', head: true })
  .eq('is_active', true)
  .is('availability_checked_at', null);

// Add to return object:
return {
  // ... existing
  pendingCheck: pendingCheckCount || 0
};
```

**ב-Desktop Stats Bar (שורות 1003-1047) - הוספת תצוגה:**
```typescript
{/* Pending Check Count */}
{(stats?.pendingCheck || 0) > 0 && (
  <>
    <div className="h-5 w-px bg-border" />
    <div className="flex items-center gap-1.5 text-sm">
      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
      <span className="text-amber-600">
        ממתינים לבדיקה: <span className="font-bold">{stats?.pendingCheck}</span>
      </span>
    </div>
  </>
)}
```

---

### 3. (אופציונלי) Dialog "בדוק URL" 

**קובץ:** `src/components/scout/ScoutedPropertiesTable.tsx`

**הוספת state וקומפוננטות:**

```typescript
// State
const [checkUrlDialogOpen, setCheckUrlDialogOpen] = useState(false);
const [urlToCheck, setUrlToCheck] = useState('');

// Mutation for URL lookup + check
const checkByUrlMutation = useMutation({
  mutationFn: async (url: string) => {
    // 1. Find property by URL
    const { data: property, error: findError } = await supabase
      .from('scouted_properties')
      .select('id, title, source')
      .eq('source_url', url)
      .single();
    
    if (findError || !property) {
      throw new Error('לא נמצא נכס עם URL זה במאגר');
    }
    
    // 2. Check availability
    const { data, error } = await supabase.functions.invoke('check-property-availability', {
      body: { property_ids: [property.id] }
    });
    if (error) throw error;
    
    return { property, result: data };
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['scouted-properties'] });
    setCheckUrlDialogOpen(false);
    setUrlToCheck('');
    
    if (data.result.marked_inactive > 0) {
      toast.error(`"${data.property.title || 'נכס'}" סומן כלא פעיל`);
    } else {
      toast.success(`"${data.property.title || 'נכס'}" נמצא פעיל`);
    }
  },
  onError: (error) => {
    toast.error(error instanceof Error ? error.message : 'שגיאה בבדיקה');
  }
});
```

**Dialog UI (ליד כפתור "השלמת נתונים"):**
```typescript
<Dialog open={checkUrlDialogOpen} onOpenChange={setCheckUrlDialogOpen}>
  <DialogTrigger asChild>
    <Button variant="outline" size="sm" className="h-8 text-sm gap-1.5">
      <Search className="h-3.5 w-3.5" />
      בדוק URL
    </Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>בדיקת זמינות לפי URL</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      <Input
        placeholder="הדבק URL של נכס מיד2/מדלן/הומלס..."
        value={urlToCheck}
        onChange={(e) => setUrlToCheck(e.target.value)}
        dir="ltr"
      />
      <Button 
        onClick={() => checkByUrlMutation.mutate(urlToCheck)}
        disabled={!urlToCheck || checkByUrlMutation.isPending}
        className="w-full"
      >
        {checkByUrlMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin ml-2" />
        ) : (
          <Search className="h-4 w-4 ml-2" />
        )}
        בדוק זמינות
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

---

## סיכום שינויים

| קובץ | שינוי |
|------|-------|
| `src/components/scout/ScoutedPropertiesTable.tsx` | mutation חדש, כפתור RefreshCw בכל שורה, סטטיסטיקה pendingCheck, Dialog לבדיקת URL |

---

## התנהגות צפויה

```text
┌─────────────────────────────────────────────────────────────────┐
│ לחיצה על כפתור "בדוק זמינות" (RefreshCw)                       │
│                                                                 │
│ 1. הכפתור מתחיל להסתובב (loading)                               │
│                                                                 │
│ 2. קריאה ל-Edge Function:                                       │
│    check-property-availability { property_ids: [id] }           │
│                                                                 │
│ 3. תוצאה:                                                       │
│    ├─ פעיל → toast ירוק "הנכס נבדק ונמצא פעיל"                  │
│    │         הטבלה מתרעננת, availability_checked_at מתעדכן      │
│    │                                                           │
│    └─ לא פעיל → toast אדום "הנכס סומן כלא פעיל"                 │
│                 is_active=false, status='inactive'              │
│                 השורה מופיעה בחיוורון (opacity-60)              │
└─────────────────────────────────────────────────────────────────┘
```

---

## עדיפות יישום

1. **חובה:** כפתור "בדוק זמינות" בכל שורה (פותר את הבעיה המיידית)
2. **מומלץ:** סטטיסטיקת "ממתינים לבדיקה" (נותנת visibility לעומס)
3. **אופציונלי:** Dialog "בדוק URL" (נוחות נוספת)
