
# הוספת "נותרו לטיפול" על כרטיסיות הדשבורד

## מה נעשה

נוסיף לכל כרטיסיית תהליך (ProcessCard) מטריקה של "נותרו" — כמה פריטים עוד ממתינים לטיפול. זה ייתן תמונה מיידית בלי צורך לפתוח היסטוריה.

## הספירות לכל תהליך

### 1. השלמת נתונים (Backfill)
שאילתה חדשה — ספירת נכסים עם `backfill_status IS NULL` או `= 'failed'`:
```
scouted_properties WHERE is_active = true AND (backfill_status IS NULL OR backfill_status = 'failed')
```

### 2. בדיקת זמינות (Availability)
כבר קיימת ספירת `pending` (נכסים שלא נבדקו מעולם). נוסיף גם ספירת נכסים שעבר הזמן לבדיקה חוזרת (recheck) — לפי `recheck_interval_days` מהגדרות:
```
scouted_properties WHERE is_active = true AND (availability_checked_at IS NULL OR availability_checked_at < now() - interval)
```

### 3. כפילויות (Dedup)
כבר יש `unresolved` — זה המספר הרלוונטי. נשנה את שם המטריקה ל"נותרו" כדי שיהיה אחיד.

### 4. התאמות (Matching)
ספירת לידים eligible שעדיין לא הותאמו (או שהנתונים השתנו מאז). בפועל — ספירת לידים עם `matching_status = 'eligible'`.

### 5. סריקות (Scans)
סריקות עובדות לפי configs ודפים — אין מושג של "נותרו X נכסים". נוסיף במקום זאת את מספר ה-configs הפעילים.

## פרטים טכניים

### קובץ: `src/components/scout/ChecksDashboard.tsx`

**שינוי 1** — הוספת שאילתת ספירה חדשה לנותרי backfill:
```typescript
const { data: backfillRemaining } = useQuery({
  queryKey: ['backfill-remaining'],
  queryFn: async () => {
    const { count } = await supabase
      .from('scouted_properties')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .or('backfill_status.is.null,backfill_status.eq.failed');
    return count ?? 0;
  },
  refetchInterval: 15000,
});
```

**שינוי 2** — הרחבת שאילתת availability stats קיימת: הוספת ספירת "eligible for recheck" (נכסים שעבר מספיק זמן מהבדיקה האחרונה):
```typescript
const recheckCutoff = new Date();
recheckCutoff.setDate(recheckCutoff.getDate() - 7); // recheck_interval_days
const recheckRes = await supabase
  .from('scouted_properties')
  .select('id', { count: 'exact', head: true })
  .eq('is_active', true)
  .or(`availability_checked_at.is.null,availability_checked_at.lt.${recheckCutoff.toISOString()}`);
```

**שינוי 3** — הוספת ספירת לידים eligible:
```typescript
const { data: eligibleLeads } = useQuery({
  queryKey: ['eligible-leads-count'],
  queryFn: async () => {
    const { count } = await supabase
      .from('contact_leads')
      .select('id', { count: 'exact', head: true })
      .eq('matching_status', 'eligible');
    return count ?? 0;
  },
  refetchInterval: 30000,
});
```

**שינוי 4** — הוספת מטריקת "נותרו" לכל ProcessCard:

- **Backfill**: `{ label: 'נותרו', value: backfillRemaining ?? 0 }`
- **Availability**: `{ label: 'נותרו', value: stats?.pendingRecheck ?? 0 }`
- **Dedup**: כבר יש "פתוחות" — שם המטריקה מספיק
- **Matching**: `{ label: 'לידים eligible', value: eligibleLeads ?? 0 }`
- **Scans**: `{ label: 'configs פעילים', value: activeConfigs ?? 0 }` (ספירת scout_configs עם is_active=true)

### קובץ: `src/components/scout/checks/ProcessCard.tsx`

אין שינוי נדרש — ה-metrics array כבר תומך בהוספת מטריקות נוספות.
