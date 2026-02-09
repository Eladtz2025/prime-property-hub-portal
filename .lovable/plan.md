

# הצגת פרטי יחידות בכרטיסיית פרויקט

## מה ישתנה

הכרטיסייה תציג טבלה מפורטת של כל היחידות מ-`project_units`, כולל סטטוס זמינות בזמן אמת.

## שינויים

### 1. דף הפרויקטים (`NewDevelopments.tsx`)
- שליפת יחידות מ-`project_units` לכל פרויקט (query נוסף או join)
- העברת רשימת היחידות כ-prop ל-`NewDevelopmentCard`

### 2. כרטיסיית הפרויקט (`NewDevelopmentCard.tsx`)
- הוספת prop חדש `units` (מערך היחידות)
- **בצד הקדמי** של הכרטיס: הצגת סיכום -- כמה יחידות סה"כ, כמה זמינות, טווח מחירים
- **בצד האחורי** (במקום או מעל הטופס): טבלת יחידות מפורטת עם:
  - קומה, חדרים, גודל, סוג (דירת גן/פנטהאוז), מחיר
  - סטטוס מקודד בצבע: ירוק = זמין, אדום = נמכר, כתום = שמור
- טופס הפנייה יישאר מתחת לטבלה

### 3. עדכון ה-Edge Function (`scout-project/index.ts`)
- שינוי `units_count` כך שיציג סה"כ יחידות (לא רק זמינות)
- הוספת שדה `available_count` ל-properties (או חישוב בצד הלקוח)

## פרטים טכניים

### מבנה ה-prop החדש
```text
interface ProjectUnit {
  id: string;
  rooms: number | null;
  size: number | null;
  floor: number | null;
  price: number | null;
  unit_type: string | null;
  status: string;  // 'available' | 'sold' | 'reserved'
}
```

### שליפת הנתונים
ב-`NewDevelopments.tsx` נוסיף query שני שמביא את כל היחידות לכל הפרויקטים:
```text
const { data: allUnits } = useQuery({
  queryKey: ["project-units-he"],
  queryFn: async () => {
    const projectIds = projects.map(p => p.id);
    const { data } = await supabase
      .from("project_units")
      .select("*")
      .in("property_id", projectIds)
      .order("floor", { ascending: true });
    return data || [];
  },
  enabled: projects.length > 0,
});
```

### עיצוב טבלת היחידות בכרטיס
- שורות קומפקטיות עם טקסט קטן
- סטטוס "זמין" בירוק בולט, "נמכר" באדום מעומעם עם קו חוצה על המחיר
- מחירים בפורמט ישראלי (1,000,000 ש"ח)

### עדכון units_count ב-Edge Function
שינוי שורות 221-226 כך ש-`units_count` יכיל את סה"כ היחידות (לא רק available):
```text
await supabase
  .from('properties')
  .update({ units_count: units.length })
  .eq('id', propertyId);
```

## קבצים לשינוי
1. `src/components/NewDevelopmentCard.tsx` -- הצגת יחידות
2. `src/pages/he/NewDevelopments.tsx` -- שליפת יחידות
3. `supabase/functions/scout-project/index.ts` -- עדכון units_count
