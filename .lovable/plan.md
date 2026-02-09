

# הוספת שדות פרויקט בטופס עריכה ותיקון hook הנתונים

## מה חסר כרגע

הטופס של הוספת נכס (`AddPropertyModal`) כבר עובד עם שדות פרויקט, אבל יש 2 מקומות שעדיין חסרים:

### 1. טופס עריכת נכס (`PropertyEditRow.tsx`)
כשעורכים נכס מסוג "פרויקט", הטופס מציג שדות רגילים (חדרים, קומה, מ"ר) במקום שדות ייעודיים (טווח חדרים, טווח שטח, יח"ד, סטטוס פרויקט). צריך שכשסוג הנכס הוא `project`, השדות יתחלפו בדיוק כמו בטופס ההוספה.

### 2. Hook הנתונים (`useSupabasePropertyData.ts`)
ה-hook שטוען ושומר נכסים חסר שני דברים:
- **טעינה**: פונקציית `transformSupabaseProperty` לא ממפה את השדות החדשים (`rooms_range`, `size_range`, `units_count`, `has_storage`, `project_status`)
- **שמירה**: המוטציה `addPropertyMutation` לא שומרת את השדות החדשים לדאטאבייס

## שינויים

### קובץ 1: `src/components/PropertyEditRow.tsx`

בשורת מפרט הנכס (שורות 578-690 בערך), נוסיף תנאי:
- כשסוג הנכס הוא `project` -- מציגים:
  - **טווח חדרים** (input טקסט, למשל "3-5")
  - **טווח שטח** (input טקסט, למשל "80-140")
  - **קומות בבניין** (כבר קיים)
  - **מספר יח"ד** (input מספרי)
  - **סטטוס פרויקט** (select: טרום מכירה / בבנייה / אכלוס מיידי)
  - **מחסן** (checkbox, מתווסף לפופאפ התוספות)
- כשסוג הנכס אחר -- נשאר כמו היום (חדרים, רחצה, קומה, מ"ר)

בנוסף, נסתיר שדות לא רלוונטיים לפרויקט:
- שכ"ד, תאריכי חוזה, ארנונה, ועד בית
- שם שוכר, טלפון שוכר

### קובץ 2: `src/hooks/useSupabasePropertyData.ts`

**פונקציית `transformSupabaseProperty`** -- הוספת מיפוי:
```text
roomsRange: dbProperty.rooms_range || undefined,
sizeRange: dbProperty.size_range || undefined,
unitsCount: dbProperty.units_count || undefined,
hasStorage: dbProperty.has_storage || false,
projectStatus: dbProperty.project_status || undefined,
```

**מוטציית `addPropertyMutation`** -- הוספת שדות ל-insert:
```text
rooms_range: newProperty.roomsRange || null,
size_range: newProperty.sizeRange || null,
units_count: newProperty.unitsCount || null,
has_storage: newProperty.hasStorage || false,
project_status: newProperty.projectStatus || null,
```

## סיכום

- 2 קבצים לעדכון
- PropertyEditRow: הצגה מותנית של שדות פרויקט vs שדות רגילים
- useSupabasePropertyData: השלמת מיפוי טעינה + שמירה של 5 שדות חדשים
- אין שינויי DB -- העמודות כבר נוצרו ב-migration הקודם

