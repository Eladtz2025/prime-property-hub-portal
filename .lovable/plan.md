

# הפעלת סריקה אוטומטית בעת הוספת פרויקט עם URL

## מה ישתנה

ברגע שמזינים `tracking_url` לפרויקט חדש (או מעדכנים URL קיים), המערכת תפעיל סריקה אוטומטית מיד -- בלי לחכות ל-cron.

## איפה לשנות

הפרויקטים נוצרים/מתעדכנים דרך הקומפוננטות הקיימות של ניהול נכסים (AddPropertyModal / PropertyEditRow). צריך להוסיף קריאה ל-Edge Function `scout-project` מיד אחרי שמירת הנכס עם tracking_url.

## שינויים

### 1. יצירת hook חדש: `src/hooks/useAutoScanProject.ts`

Hook פשוט שמקבל `property_id` ומפעיל סריקה:

```text
- מקבל property_id
- קורא ל-supabase.functions.invoke('scout-project', { body: { property_id } })
- מציג toast הצלחה/כשלון
- לא חוסם את ה-UI (רץ ברקע)
```

### 2. עדכון טופס הוספת פרויקט

במקום שבו הנכס נשמר בהצלחה ויש לו `tracking_url`, להוסיף קריאה אוטומטית:

```text
// אחרי שמירה מוצלחת של נכס עם tracking_url:
if (trackingUrl) {
  supabase.functions.invoke('scout-project', { 
    body: { property_id: newPropertyId } 
  });
  toast("סריקה אוטומטית הופעלה...");
}
```

### 3. עדכון טופס עריכת פרויקט

אם משנים את ה-`tracking_url` (מוסיפים חדש או מעדכנים), להפעיל סריקה גם כאן.

## קבצים לשינוי

1. `src/hooks/useAutoScanProject.ts` -- hook חדש
2. הקומפוננטה שמטפלת ביצירת פרויקט מעקב (Tracked Project) -- הוספת קריאה אחרי שמירה
3. הקומפוננטה שמטפלת בעריכת נכס -- הוספת קריאה כשמשתנה tracking_url

## התנהגות

- הסריקה רצה **ברקע** -- לא חוסמת את ממשק המשתמש
- מוצגת הודעת toast: "סריקה אוטומטית הופעלה" ואחרי סיום "סריקה הושלמה - נמצאו X יחידות"
- אם הסריקה נכשלת, מוצגת הודעה אבל הנכס כבר נשמר

