

# הוספת כפתור ליצירת קונפיגורציות

## סקירה
אתה רוצה לחזור ליכולת ליצור קונפיגורציות סריקה חדשות בעצמך. הבדיקה מראה שכל התשתית קיימת ועובדת - רק הכפתור "הוסף" הוסר בבקשה קודמת.

## מה נמצא

| רכיב | סטטוס |
|------|-------|
| פונקציית יצירה (`createConfigMutation`) | קיים ועובד |
| טופס יצירה (Dialog עם כל השדות) | קיים ועובד |
| כפתור "הוסף" | **חסר** (הוסר בעבר) |

## השינוי הנדרש

**קובץ:** `src/components/scout/UnifiedScoutSettings.tsx`

### לפני (שורות 748-751):
```text
{/* Add button */}
<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
  {/* Add button removed per user request */}
  <DialogContent ...
```

### אחרי:
```text
{/* Add button */}
<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
  <DialogTrigger asChild>
    <Button 
      variant="outline" 
      size="sm" 
      className="gap-2"
      onClick={() => { resetForm(); }}
    >
      <Plus className="h-4 w-4" />
      הוסף קונפיגורציה
    </Button>
  </DialogTrigger>
  <DialogContent ...
```

## מה זה יאפשר

לחיצה על הכפתור תפתח את הטופס ליצירת קונפיגורציה חדשה עם כל האפשרויות:
- שם הקונפיגורציה
- מקור (Yad2 / Madlan / Homeless)
- סוג נכס (להשכרה / למכירה)
- בחירת עיר
- בחירת שכונות (multi-select)
- טווח מחירים
- טווח חדרים
- פרמטרים טכניים (דפים, delay, schedule)

## בדיקה אחרי היישום

1. לחיצה על "הוסף קונפיגורציה" - וידוא שהטופס נפתח ריק
2. מילוי הטופס ויצירת קונפיגורציה חדשה
3. וידוא שהקונפיגורציה מופיעה ברשימה

