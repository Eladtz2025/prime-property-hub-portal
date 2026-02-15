
# באגים בסקשן פגישות קרובות

## באג 1: הטופס לא מתאפס כשפותחים "הוסף פגישה חדשה" אחרי עריכה
**קובץ:** `AddAppointmentModal.tsx`
**הבעיה:** כשעורכים פגישה, הנתונים נטענים ל-form באמצעות useEffect. אבל כשסוגרים ופותחים מחדש ב"הוסף חדש" (בלי editingAppointment), ה-useEffect לא רץ כי הוא רק רץ כש-`editingAppointment` קיים. הטופס כן מתאפס ב-handleClose, אבל ה-`appointmentTime` שנטען מעריכה יכול להגיע בפורמט "14:00:00" (מה-DB) בעוד שה-timeSlots מצפים ל-"14:00" - מה שגורם לכך שהשעה לא תיבחר נכון בעריכה.

**תיקון:** לחתוך את appointment_time ל-5 תווים ראשונים (`slice(0, 5)`) בעת טעינה.

## באג 2: הערות ארוכות (notes) מוצגות במקום כתובת כשאין property
**קובץ:** `UpcomingAppointmentsCard.tsx`, שורה 259-268
**הבעיה:** כשאין property מקושר, הקוד מציג את ה-notes עם אייקון MapPin (מיקום), מה שמטעה. הערות ארוכות (כמו לינקים + טקסט) גולשות, למרות ה-`line-clamp-2` שנוסף. לינקים בהערות מוצגים כטקסט רגיל ולא לחיצים.

**תיקון:** לא להציג notes כ-location. להציג notes בנפרד ללא אייקון MapPin, או לחלופין להסתיר אותן מהכרטיס.

## באג 3: כפתור "ראה הכל" לא עושה כלום
**קובץ:** `UpcomingAppointmentsCard.tsx`, שורה 211
**הבעיה:** הכפתור "ראה הכל" מוצג אבל אין לו onClick handler - הוא לא עושה שום דבר.

**תיקון:** להוסיף onClick שמנווט לעמוד פגישות, או להסתיר את הכפתור אם אין עמוד כזה.

## באג 4: appointment_time בפורמט שונה גורם לבעיות
**קובץ:** `UpcomingAppointmentsCard.tsx`, שורה 166
**הבעיה:** ב-`filteredAppointments`, יצירת Date עם `new Date("2026-02-25T14:00:00")` עובד, אבל אם ה-time מגיע מה-DB בפורמט "14:00:00" (עם שניות), ה-`slice(0, 5)` בשורה 243 מטפל בתצוגה, אבל ה-Date parsing בשורה 116 (openGoogleCalendar) עשוי ליצור תאריך לא תקין בדפדפנים מסוימים.

## באג 5: הטופס לא מציג את ה-location בעריכה
**קובץ:** `AddAppointmentModal.tsx`, שורה 90
**הבעיה:** ב-useEffect של טעינת עריכה, ה-location תמיד מוגדר כ-'' (ריק). השדה location לא נשמר בכלל ב-DB (אין עמודה כזו בטבלת appointments), כך שנתון המיקום אבד.

## באג 6: שגיאת toast לא מותאמת למצב עריכה
**קובץ:** `AddAppointmentModal.tsx`, שורה 170
**הבעיה:** הודעת השגיאה תמיד אומרת "שגיאה בהוספת הפגישה" גם כשמדובר בעריכה. צריך להיות "שגיאה בעדכון הפגישה" במצב עריכה.

## באג 7: ה-notes לא נשמרות בעדכון
**קובץ:** `AddAppointmentModal.tsx`, שורה 134-143
**הבעיה:** ב-appointmentData, שדה ה-notes נשמר, אבל ב-update גם created_by ו-assigned_to לא נשלחים (מה שטוב), אבל ה-title נדרס בעריכה עם ערך שלא תואם את הכותרת המקורית אם אין property.

---

## פירוט טכני - תיקונים

### `AddAppointmentModal.tsx`:
1. שורה 92: שינוי `appointmentTime: editingAppointment.appointment_time || ''` ל-`appointmentTime: (editingAppointment.appointment_time || '').slice(0, 5)`
2. שורה 170: שינוי ל-`toast.error(isEditMode ? 'שגיאה בעדכון הפגישה' : 'שגיאה בהוספת הפגישה')`

### `UpcomingAppointmentsCard.tsx`:
1. שורות 259-268: הפרדת תצוגת notes מ-properties address - לא להציג notes עם אייקון MapPin
2. שורה 211: הוספת onClick לכפתור "ראה הכל" או הסרתו
3. שורה 116: הבטחת פורמט תקין של זמן ב-openGoogleCalendar

### קבצים לעריכה:
- `src/components/AddAppointmentModal.tsx`
- `src/components/UpcomingAppointmentsCard.tsx`
