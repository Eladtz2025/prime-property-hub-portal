

## העברת "לא אקטיביים" מתחת לאחוז (Delta)

### שינוי בקובץ `src/components/scout/ScoutMetricTile.tsx`

כרגע הסדר הוא: מספר → label → subtitle → delta.

צריך להזיז את ה-subtitle להיות **אחרי** ה-delta:

```
מספר
label
delta (אחוז אדום/ירוק)
subtitle (לא אקטיביים)
```

שורה 116 (subtitle) תוסר מהמיקום הנוכחי, ותועבר לאחרי בלוק ה-delta (אחרי שורה 130).

