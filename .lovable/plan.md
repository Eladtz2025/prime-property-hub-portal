

## החלפת כרטיסיות כפילויות/התאמות בתרשימי עוגה

### מה משתנה
- **הסרת** כרטיסיות "כפילויות" ו"התאמות אחרונות" + הקוואריות שלהן (`dedupStats`, `matchStats`)
- **הוספת** 3 תרשימי עוגה (donut) קומפקטיים במקומן

### הנתונים (מתוך `scouted_properties` עם `is_active = true`)
1. **לפי מקור** — `source`: yad2, madlan, homeless
2. **פרטי/תיווך** — `is_private`: true = פרטי, false = תיווך
3. **מכירה/השכרה** — `property_type`: sale, rent

### שינויים טכניים

**קובץ חדש: `src/components/scout/ScoutPieChart.tsx`**
- קומפוננטה שמקבלת `data: {label, value, color}[]` ו-`title`
- עיגול עוגה (donut) קטן באמצעות SVG פשוט (ללא ספרייה חיצונית) — `stroke-dasharray` על `<circle>`
- אחוזים + מקרא (legend) מתחת
- גודל קומפקטי שמתאים ל-grid הקיים

**קובץ: `src/pages/AdminPropertyScout.tsx`**
1. הסרת קוואריות `dedupStats` ו-`matchStats`
2. הוספת קוואריה אחת `distribution-stats` שמביאה GROUP BY על שלושת השדות
3. החלפת 2 ה-`ScoutMetricTile` האחרונים ב-3 קומפוננטות `ScoutPieChart`
4. שינוי grid מ-`lg:grid-cols-5` ל-`lg:grid-cols-3` בשורה הראשונה (3 כרטיסיות מטריקה), ושורה שנייה עם 3 עוגות

### מבנה ויזואלי
```text
[סה״כ אקטיביים] [ממתינים לבדיקה] [נבדקו היום]
[🍩 לפי מקור]    [🍩 פרטי/תיווך]   [🍩 מכירה/השכרה]
```

