
# QA מלא - לוח הבקרה (Dashboard)

## סקשן 1: כותרת עליונה (Header/Greeting) - תקין
לא נמצאו באגים. הברכה, הסטטיסטיקות, ועריכת ההכנסה עובדים כמצופה.

## סקשן 2: הדירות האקטואליות (ActivePropertiesCard) - תקין
הקרוסלה, כרטיסי הנכסים, והמודל עובדים. אין בעיות.

## סקשן 3: Daily Priority + General Priority (PriorityTasksCard) - באג אחד

**באג: `onKeyPress` מיושן**
- **קובץ:** `PriorityTasksCard.tsx`, שורה 267
- **בעיה:** `onKeyPress` הוא deprecated ב-React. צריך להחליף ל-`onKeyDown`.
- **חומרה:** נמוכה (עדיין עובד, אבל יכול לגרום ל-warning ב-console)

## סקשן 4: פגישות קרובות (UpcomingAppointmentsCard) - תוקן כבר
התיקונים מהסבבים הקודמים נראים טובים. הכל תקין עכשיו.

## סקשן 5: באגים ובעיות (SiteIssuesCard) - באג אחד

**באג: `onKeyPress` מיושן**
- **קובץ:** `SiteIssuesCard.tsx`, שורה 171
- **בעיה:** אותה בעיה - `onKeyPress` צריך להיות `onKeyDown`.
- **חומרה:** נמוכה

## סקשן 6: רעיונות לפיתוח (DevelopmentIdeasCard) - באג אחד

**באג: עדיפות מתאפסת ל-`medium` במקום `normal`**
- **קובץ:** `DevelopmentIdeasCard.tsx`, שורה 34
- **בעיה:** אחרי הוספת רעיון, `setNewPriority('medium')` מאפס לערך שלא קיים ב-Select (הערכים הם `high`, `normal`, `low`). זה גורם לכך שה-Select מציג ערך ריק/לא תקין אחרי הוספת הרעיון הראשון.
- **תיקון:** שינוי ל-`setNewPriority('normal')`
- **חומרה:** בינונית

## סקשן 7: פניות מהאתר (ContactLeadsListCompact) - תקין
ה-query, התצוגה, ומצב ריק עובדים כמצופה.

## סקשן 8: דשבורד מובייל (MobileDashboard) - תקין
כל הסקשנים מוצגים, מודל הפגישות עובד, אין בעיות.

---

## סיכום תיקונים נדרשים

| # | קובץ | בעיה | חומרה |
|---|-------|------|-------|
| 1 | `DevelopmentIdeasCard.tsx` שורה 34 | `setNewPriority('medium')` צריך להיות `'normal'` | בינונית |
| 2 | `PriorityTasksCard.tsx` שורה 267 | `onKeyPress` -> `onKeyDown` | נמוכה |
| 3 | `SiteIssuesCard.tsx` שורה 171 | `onKeyPress` -> `onKeyDown` | נמוכה |

---

## פירוט טכני

### `DevelopmentIdeasCard.tsx`:
- שורה 34: שינוי `setNewPriority('medium')` ל-`setNewPriority('normal')`

### `PriorityTasksCard.tsx`:
- שורה 267: שינוי `onKeyPress={handleKeyPress}` ל-`onKeyDown={handleKeyPress}`

### `SiteIssuesCard.tsx`:
- שורה 171: שינוי `onKeyPress={handleKeyPress}` ל-`onKeyDown={handleKeyPress}`

### קבצים לעריכה:
- `src/components/DevelopmentIdeasCard.tsx`
- `src/components/PriorityTasksCard.tsx`
- `src/components/SiteIssuesCard.tsx`
