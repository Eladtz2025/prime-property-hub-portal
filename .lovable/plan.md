

# תיקון באג: שעת סיום מוצגת עם גרשיים

## הבעיה

כשמעדכנים שעת סיום דרך הממשק, הערך נשמר ב-DB עם גרשיים מיותרים (למשל `"02:55"` במקום `02:55`), ואז מוצג ככה בלוח הזמנים: `00:00 - "02:55"`.

הסיבה: שורה 66 ב-`ScheduleTimeEditor.tsx` משתמשת ב-`JSON.stringify` גם על שעת הסיום (שהיא מחרוזת פשוטה), מה שעוטף אותה בגרשיים כפולים.

## תיקונים

### 1. `src/components/scout/checks/ScheduleTimeEditor.tsx` (שורה 66)

שינוי שמירת שעת הסיום -- שמירה ישירה בלי `JSON.stringify`:

```
setting_value: params.newEndTime    // במקום JSON.stringify(params.newEndTime)
```

### 2. `src/hooks/useScoutSettings.ts` -- `parseSettingValue`

הוספת הגנה שמסירה גרשיים מיותרים מערכי מחרוזת (כדי לטפל בנתונים שכבר נשמרו עם גרשיים):

```
// Strip extra quotes from string values like '"02:55"'
if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
  value = value.slice(1, -1);
}
```

### 3. תיקון הנתון הקיים ב-DB

הרצת עדכון ישיר על הרשומה הבעייתית כדי להסיר את הגרשיים מ-`backfill/schedule_end_time`.

