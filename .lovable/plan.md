
# שיפור מערכת הזמנים והריצות - Jina-First

## מצב נוכחי (בעיות)

1. **3 כרטיסיות Jina חסרות עורך זמנים**: סריקות Jina, זמינות Jina, והשלמת נתונים Jina -- אין בהגדרות שלהן אפשרות לראות/לערוך שעות ריצה
2. **Cron Jobs כבר קוראים ל-Jina**: הקרונים הקיימים (availability, backfill) כבר מפעילים פונקציות Jina, אבל עורך הזמנים נמצא רק בכרטיסיות הישנות (Firecrawl)
3. **לוח הזמנים הכללי** לא מציג את התהליכים ב-Jina בצורה ברורה

## תוכנית שיפור

### 1. הוספת ScheduleTimeEditor לכל כרטיס Jina

**קובץ: `src/components/scout/ChecksDashboard.tsx`**

- **סריקות Jina (שורה ~491)**: הוספת ScheduleTimeEditor עם category="scraping" (חולק הגדרות עם הסריקות הרגילות -- כי שתיהן משתמשות באותם scout_configs)
- **זמינות Jina (שורה ~573)**: הוספת ScheduleTimeEditor עם category="availability" ו-cronJobNames שמצביע על `availability-check-continuous` (שכבר קורא ל-Jina)
- **השלמת נתונים Jina (שורה ~727)**: הוספת ScheduleTimeEditor עם category="backfill" ו-cronJobNames שמצביע על `backfill-data-completion-job` (שכבר קורא ל-Jina)

כיוון שהקרונים כבר מפעילים את פונקציות ה-Jina, אפשר לחלוק את אותם categories ב-scout_settings.

### 2. עדכון לוח הזמנים (ScheduleSummaryCard)

**קובץ: `src/components/scout/ScheduleSummaryCard.tsx`**

- הוספת תווית "(Jina)" לתהליכים שרצים דרך Jina, כדי שיהיה ברור בלוח הזמנים מה בדיוק רץ
- עדכון ה-Legend להוסיף צבע ל-backfill ול-cleanup (חסרים כרגע)

### 3. סנכרון הצגת זמנים בכרטיסיות הישנות

מכיוון שהקרונים כבר מצביעים על Jina, נעדכן את ה-labels בכרטיסיות הישנות (Availability, Backfill) כדי לציין שהם מחוברים לאותו cron -- למניעת בלבול.

---

## פרטים טכניים

### שינויים ב-ChecksDashboard.tsx

**כרטיס סריקות Jina** -- הוספה אחרי LogicDescription (שורה ~496):
```typescript
// Scout configs already have schedule_times per config
// The ScheduleTimeEditor is on the UnifiedScoutSettings
// No separate editor needed here -- it's inside UnifiedScoutSettings
```
(כבר קיים ב-UnifiedScoutSettings שמוצג בכרטיס)

**כרטיס זמינות Jina** -- settingsContent (שורה 567-575), הוספת:
```typescript
<ScheduleTimeEditor
  category="availability"
  cronJobNames={[{ 
    jobName: 'availability-check-continuous', 
    cronTemplate: (h, m) => `${m} ${h} * * *` 
  }]}
  label="שעות ריצת בדיקת זמינות (Jina)"
  showEndTime
/>
```

**כרטיס השלמת נתונים Jina** -- settingsContent (שורה 722-728), הוספת:
```typescript
<ScheduleTimeEditor
  category="backfill"
  cronJobNames={[{ 
    jobName: 'backfill-data-completion-job', 
    cronTemplate: (h, m) => `${m} ${h} * * *` 
  }]}
  label="שעות ריצת השלמת נתונים (Jina)"
  showEndTime
/>
```

### שינויים ב-ScheduleSummaryCard.tsx

עדכון הלייבלים שיציגו "(Jina)" ליד תהליכים רלוונטיים:
- "בדיקת זמינות" --> "בדיקת זמינות (Jina)"  
- "השלמת נתונים" --> "השלמת נתונים (Jina)"

הוספת items ל-Legend עבור backfill ו-cleanup:
```typescript
<span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />השלמה
<span className="w-1.5 h-1.5 rounded-full bg-gray-400" />כפילויות
```

### סיכום הקרונים האמיתיים (למידע)

| Cron Job | UTC Schedule | IL Time | Edge Function |
|---|---|---|---|
| scout-properties-job | */5 20-21 * * * | 22:00-23:55 | trigger-scout-all-jina |
| backfill-data-completion-job | 0 22 * * * | 00:00 | backfill-property-data-jina |
| cleanup-orphan-duplicates-hourly | 0 1 * * * | 03:00 | detect-duplicates |
| availability-check-continuous | 0 3 * * * | 05:00 | trigger-availability-check-jina |
| match-leads-job | 0 5 * * * | 07:00 | trigger-matching |

כל הקרונים כבר מצביעים על פונקציות Jina -- אין צורך לשנות קרונים, רק UI.
