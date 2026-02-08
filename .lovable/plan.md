
# תיקון באג: UI תקוע בזמן מעבר בין מקורות (Sequential Mode)

## הבעיה

כשמריצים "הכל (סדרתי)" (homeless, madlan, yad2), ה-UI נתקע על הנתונים של המקור הראשון שהסתיים. בפועל התהליך עובד ברקע, אבל ה-UI לא מתעדכן כי הוא ממשיך לשאול על ה-task הישן.

## שורש הבעיה

ב-`useReclassifyBroker.ts`, כשמקור מסיים ומתחיל הבא:

1. `startSingleSource(nextSource)` נקרא אחרי 2 שניות
2. הוא מקבל task_id חדש מה-Edge Function
3. הוא קורא ל-`setCurrentTaskId(newId)` -- אבל זה עדכון state אסינכרוני
4. הוא קורא ל-`refetchProgress()` -- אבל ה-query key עדיין מכיל את ה-ID הישן
5. התוצאה: ה-polling ממשיך לשאול על ה-task שכבר הושלם

## הפתרון

### קובץ: `src/hooks/useReclassifyBroker.ts`

**שינוי 1: להסיר את `refetchProgress()` מ-`startSingleSource`**

במקום לקרוא `refetchProgress()` שמשתמש ב-query key הישן, פשוט לסמוך על React -- כשה-state `currentTaskId` מתעדכן, ה-query key משתנה אוטומטית ומפעיל query חדש.

**שינוי 2: להוסיף `enabled` שתלוי ב-`isRunning`**

ה-query כבר מוגדר עם `refetchInterval: isRunning ? 4000 : false`, אבל צריך לוודא שה-query מתחיל לרוץ מיד כשה-task ID משתנה.

**שינוי 3: לנקות את ה-progress הישן בזמן מעבר**

להוסיף `queryClient.removeQueries` לפני התחלת מקור חדש, כדי שה-UI לא יציג את הנתונים הישנים.

## פירוט טכני

ב-`startSingleSource` (שורה 130):

```text
לפני:
  if (data?.task_id) {
    setCurrentTaskId(data.task_id);
    setIsRunning(true);
    refetchProgress();
  }

אחרי:
  if (data?.task_id) {
    // Clear old progress query before setting new ID
    queryClient.removeQueries({ queryKey: ['reclassify-progress'] });
    setCurrentTaskId(data.task_id);
    setIsRunning(true);
    // No refetchProgress() - React will auto-refetch when currentTaskId changes
  }
```

ב-useEffect של completion (שורה 104-108), להוסיף ניקוי:

```text
if (progress.status === 'completed' && queue.length > 0 && !stoppedManuallyRef.current) {
  const nextSource = queue.shift()!;
  // Clear stale progress data before starting next source
  queryClient.removeQueries({ queryKey: ['reclassify-progress'] });
  setTimeout(() => startSingleSource(nextSource), 2000);
  return;
}
```

גם ב-`start` (שורה 170), לנקות queries ישנים בתחילת ריצה חדשה:

```text
const start = useCallback(async () => {
  setResults(null);
  setAllResults({});
  queryClient.removeQueries({ queryKey: ['reclassify-progress'] });
  ...
```

## סיכום

שינוי בקובץ אחד בלבד: `src/hooks/useReclassifyBroker.ts`

1. הסרת `refetchProgress()` מ-`startSingleSource` -- מונע polling עם query key ישן
2. הוספת `queryClient.removeQueries` בנקודות המעבר -- מנקה נתונים ישנים
3. React ידאג לבד לבצע query חדש כשה-`currentTaskId` משתנה
