

## תיקון גלילה לתחתית בהחלפת טאבים

### בעיה
כשמחליפים טאב ב-ChecksSubTabs (זמינות, השלמה וכו'), הדף נשאר במיקום הגלילה הנוכחי. אם הטאב הקודם היה ארוך והגללת למטה, הטאב החדש נפתח "באמצע" או בתחתית — כי מיקום ה-scroll לא מתאפס.

### פתרון
ב-`ChecksSubTabs.tsx` — כשמחליפים טאב (`onValueChange`), לגלול את החלון לראש אזור הטאבים (לא לראש הדף, כי יש מעלה מטריקות וכרטיסים שלא צריך לחזור אליהם).

### שינוי טכני (`src/components/scout/checks/ChecksSubTabs.tsx`)
- הוספת `useRef` על ה-`Tabs` wrapper
- ב-`onValueChange` callback — קריאה ל-`ref.scrollIntoView({ behavior: 'smooth', block: 'start' })` כדי לגלול לראש הטאבים
- זה פותר את הבעיה בכל הטאבים בבת אחת

