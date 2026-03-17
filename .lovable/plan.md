

## שינוי כפתור "הפעל" לכפתור מלא בצבע Header + מרכוז

### קובץ: `ProcessCard.tsx`

**שינויים בפוטר (שורות 121-155):**

1. **כפתור "הפעל"** — מטקסט קטן לכפתור מלא בצבע primary:
   - `bg-primary text-primary-foreground rounded-md px-4 py-1 text-[11px] font-medium`
   - ממורכז בפוטר עם `justify-center` ו-`flex-1`

2. **כפתור "השהה"** — אותו סגנון אבל `bg-muted text-muted-foreground` (רך יותר)

3. **אייקוני history/settings** — נשארים בצד, absolute או בקצה

4. **מבנה הפוטר**: הכפתור במרכז, אייקונים בצד שמאל

