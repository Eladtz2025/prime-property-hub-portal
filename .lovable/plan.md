

## הוספת עורך שעות ריצה לכרטיס "בדיקת זמינות 2 (Jina)"

### הבעיה
בכרטיס ההגדרות של "בדיקת זמינות 2 (Jina)" חסר רכיב `ScheduleTimeEditor` — בניגוד לכרטיס בדיקת הזמינות המקורי ולשאר הכרטיסים.

### הפתרון
הוספת `ScheduleTimeEditor` לתוך `settingsContent` של הכרטיס, עם אותם פרמטרים כמו בכרטיס הזמינות המקורי:
- `category="availability"` (שני הכרטיסים חולקים את אותו cron job — `availability-check-continuous`)
- `showEndTime` מופעל
- תווית בעברית

### קובץ לעריכה
**`src/components/scout/ChecksDashboard.tsx`** — שורות 568-574

הוספת `ScheduleTimeEditor` אחרי ה-`LogicDescription` בתוך ה-`settingsContent` של כרטיס "בדיקת זמינות 2 (Jina)":

```tsx
settingsContent={
  <div className="space-y-6">
    <LogicDescription lines={[...]} />
    <ScheduleTimeEditor
      category="availability"
      cronJobNames={[{ jobName: 'availability-check-continuous', cronTemplate: (h, m) => `${m} ${h} * * *` }]}
      label="שעות ריצת בדיקת זמינות (Jina)"
      showEndTime
    />
  </div>
}
```

