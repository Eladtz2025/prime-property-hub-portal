
# תיקון בעיית ה-Timeout בבדיקת זמינות

## הבעיה שנמצאה
הזיהוי של נכסים לא פעילים **עובד מצוין** - ראינו בלוגים נכסים שזוהו. אבל הם **לא נשמרים ב-DB** כי:

1. `trigger-availability-check` שולח batch ל-`check-property-availability` ומחכה לתשובה
2. אם עוברות 50 שניות - ה-trigger עושה abort וממשיך הלאה
3. אבל ה-`check-property-availability` עדיין רץ ברקע!
4. הבעיה: ה-UPDATE קורה רק בסוף הבדיקה (אחרי כל 50 הנכסים), ולפעמים לא מספיק זמן

## הפתרון המומלץ
**לעדכן כל נכס מיד כשמזוהה כ-inactive** במקום לאסוף הכל ולעדכן בסוף.

### שינוי ב-`check-property-availability/index.ts`

במקום:
```typescript
if (result.isInactive) {
  inactiveIds.push(property.id);
  inactiveCount++;
  console.log(`❌ Property ${property.id} - INACTIVE`);
}
// ... ובסוף ...
if (inactiveIds.length > 0) {
  await supabase.update(...).in('id', inactiveIds);
}
```

נשנה ל:
```typescript
if (result.isInactive) {
  // עדכון מיידי - לא מחכה לסוף
  const { error } = await supabase
    .from('scouted_properties')
    .update({ is_active: false, status: 'inactive' })
    .eq('id', property.id);
  
  if (!error) {
    inactiveCount++;
    console.log(`❌ Property ${property.id} - INACTIVE (saved)`);
  }
}
```

## יתרונות
- כל נכס שמזוהה נשמר מיד - לא משנה אם יש timeout
- גם אם ה-batch נקטע באמצע, מה שנבדק כבר נשמר
- יותר אמין ועמיד

## חסרונות קלים
- יותר קריאות לDB (אחת לכל נכס inactive במקום אחת בסוף)
- אבל בממוצע יש מעט inactive לכל batch, אז זה זניח

## קבצים לעדכון
| קובץ | שינוי |
|------|-------|
| `supabase/functions/check-property-availability/index.ts` | עדכון מיידי של כל נכס inactive |
