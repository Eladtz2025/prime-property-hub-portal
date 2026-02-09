
# תיקון: הפרויקט לא נשמר -- בעיית CHECK constraint בדאטאבייס

## הבעיה

נמצאה שגיאה בלוגים של הדאטאבייס:
```
new row for relation "properties" violates check constraint "properties_property_type_check"
```

ה-CHECK constraint על עמודת `property_type` בטבלת `properties` מאפשר רק 3 ערכים:
- `rental`
- `sale`
- `management`

**חסר `project`!** לכן כל ניסיון לשמור פרויקט (רגיל או מעקב) נכשל בשקט.

## הפתרון

### שלב 1: Migration לעדכון ה-constraint

עדכון ה-CHECK constraint כך שיכלול גם `project`:

```text
ALTER TABLE properties DROP CONSTRAINT properties_property_type_check;
ALTER TABLE properties ADD CONSTRAINT properties_property_type_check 
  CHECK (property_type = ANY (ARRAY['rental', 'sale', 'management', 'project']));
```

### שלב 2: בדיקה

לאחר העדכון:
1. נוסיף פרויקט מעקב מחדש עם URL
2. נוודא שנשמר בדאטאבייס
3. נפעיל סריקה ידנית לבדוק שהכל עובד

## סיכום

- תיקון של שורה אחת בדאטאבייס (עדכון constraint)
- לא נדרשים שינויי קוד
- אחרי התיקון נוכל לבדוק את כל הזרימה מקצה לקצה
