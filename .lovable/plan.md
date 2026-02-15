
# הוספת כפתור "עצור" לבדיקת זמינות (ולהתאמות)

## הבעיה

כפתור העצירה לא מופיע בכרטיס "בדיקת זמינות" (וגם "התאמות") כי ה-`onStop` לא מועבר ל-ProcessCard. רק ל-Backfill יש כפתור עצירה.

## הפתרון

### קובץ: `src/components/scout/ChecksDashboard.tsx`

**שינוי 1 — הוספת mutation לעצירת בדיקת זמינות:**

```typescript
const stopAvailability = useMutation({
  mutationFn: async () => {
    // Update the running availability_check_runs record to 'stopped'
    const { error } = await supabase
      .from('availability_check_runs')
      .update({ status: 'stopped', completed_at: new Date().toISOString() })
      .eq('status', 'running');
    if (error) throw error;
  },
  onSuccess: () => {
    toast.success('בדיקת זמינות נעצרה');
    queryClient.invalidateQueries({ queryKey: ['availability-runs'] });
  },
  onError: (err) => toast.error(`שגיאה בעצירה: ${err.message}`),
});
```

**שינוי 2 — העברת `onStop` ו-`isStopPending` לכרטיס הזמינות (שורה ~327):**

```text
onRun={() => triggerAvailability.mutate()}
onStop={() => stopAvailability.mutate()}
isRunPending={triggerAvailability.isPending}
isStopPending={stopAvailability.isPending}
```

**שינוי 3 — הוספת mutation לעצירת התאמות (אם רלוונטי):**

אותו רעיון עבור `scout_runs` של matching — עדכון status ל-stopped.

## איך זה עובד

כפתור העצירה מעדכן את הרשומה ב-DB ל-`status = 'stopped'`. כשהריצה מסיימת את ה-batch הנוכחי ומנסה לעשות self-chain, היא בודקת את הסטטוס ורואה שהוא כבר לא `running` -- ולכן לא ממשיכה.

## סיכום

- קובץ אחד לעריכה: `ChecksDashboard.tsx`
- הוספת 2 mutations (עצירת זמינות + עצירת התאמות)
- העברת props `onStop`/`isStopPending` לשני ה-ProcessCards
