

# שיפורים עיצוביים לסקשני המשימות והפגישות

## 4 שינויים מבוקשים

### 1. הצגת תאריך יצירה/עדכון בכל כרטיסייה
בכל TaskItem (משימות יומיות וכלליות) ובכל פגישה, יתווסף טקסט קטן שמציג מתי הפריט נוצר.
- במשימות: שימוש ב-`created_at` שכבר קיים בנתונים
- בפגישות: שימוש ב-`created_at` מטבלת appointments (אם קיים) או תאריך הפגישה עצמו

### 2. שינוי כותרת Weekly Priority ל-General Priority
שינוי פשוט בקובץ `Dashboard.tsx` שורה 205 - שינוי ה-title prop מ-"Weekly Priority" ל-"General Priority".

### 3. תיקון overflow בכרטיסיית פגישות קרובות
הבעיה: תוכן ארוך (כמו הטקסט הארוך בצילום) גולש מהכרטיסייה וגורם לסקרולר. הפתרון: הוספת `overflow-hidden` ו-`max-h` עם סקרולר פנימי לכרטיסייה, וכן `truncate` או `line-clamp` לטקסטים ארוכים בתוך הפגישה.

### 4. אופציית עריכה למשימות ופגישות
- **משימות**: הוספת כפתור עריכה (אייקון עיפרון) ליד כפתור המחיקה ב-TaskItem. לחיצה תפתח מצב inline editing שמאפשר לשנות את הטקסט, או דיאלוג עריכה קטן.
- **פגישות**: הוספת כפתור עריכה ליד כפתור המחיקה בכל פגישה. לחיצה תפתח את ה-AddAppointmentModal במצב עריכה (עם הנתונים הקיימים טעונים מראש).

## פירוט טכני

### קבצים לעריכה:

**`src/components/Dashboard.tsx`**
- שורה 205: שינוי `title="Weekly Priority"` ל-`title="General Priority"`

**`src/components/PriorityTasksCard.tsx`**
- הוספת תצוגת `created_at` מתחת לטקסט המשימה (טקסט קטן אפור)
- הוספת כפתור עריכה (Pencil icon) ליד כפתור המחיקה
- הוספת state לעריכה inline: שינוי כותרת המשימה ותיאור
- הוספת `onEdit` callback ל-TaskItem

**`src/components/UpcomingAppointmentsCard.tsx`**
- הוספת `overflow-y-auto max-h-[400px]` לקונטיינר הפגישות
- הוספת `line-clamp-2` לטקסטים ארוכים (title, notes)
- הוספת כפתור עריכה ליד כפתור מחיקה
- הוספת state ל-editingAppointment

**`src/components/AddAppointmentModal.tsx`**
- הוספת prop אופציונלי `appointment` למצב עריכה
- כשמקבל appointment קיים, טוען את הנתונים לטופס ומשתמש ב-`update` במקום `insert`
- שינוי כותרת הדיאלוג ל-"עריכת פגישה" במצב עריכה

**`src/components/MobileDashboard.tsx`**
- שינוי מקביל ל-"General Priority"

