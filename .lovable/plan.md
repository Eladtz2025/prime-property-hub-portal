
# תיקון מנוע ההתאמות - 2 באגים

## בעיה 1 (עיקרית): נכסים "מיידיים" נדחים עבור לידים עם תאריך ספציפי

60% מהנכסים מסומנים כ-`immediate_entry: true`. 52% מהלידים יש להם תאריך כניסה ספציפי. הלוגיקה הנוכחית דוחה את כולם -- גם אם הנכס פנוי היום והליד צריך ב-15 במרץ.

**תיקון:** במקום לדחות נכסים מיידיים עבור לידים עם תאריך, לקבל אותם (פנוי עכשיו = פנוי גם בעתיד), עם הערה "כניסה מיידית - פנוי לפני התאריך המבוקש".

## בעיה 2 (משנית): השוואת ריהוט שגויה

נכסים מאוחסנים עם `furnished: true` (boolean) אבל הקוד בודק `'fully_furnished'` (string). התוצאה: אף נכס מרוהט לא מתאים ללידים שדורשים ריהוט.

**תיקון:** לקבל גם `true` (boolean) כתחליף ל-`'fully_furnished'`.

---

## פרטים טכניים

### קובץ: `supabase/functions/_shared/matching.ts`

**תיקון 1 -- שורות 560-562:**

לפני:
```typescript
} else if (propertyIsImmediate) {
  return { lead, matchScore: 0, matchReasons: ['נדרש תאריך ספציפי - הנכס מיידי'], priority: 0 };
}
```

אחרי:
```typescript
} else if (propertyIsImmediate) {
  // Immediate = available now = also available on the lead's requested date
  reasons.push('כניסה מיידית - פנוי לפני התאריך המבוקש ✓');
}
```

אותו שינוי גם בבלוק השני (שורות 582-584) עבור לידים עם תאריך גמיש:

לפני:
```typescript
} else if (propertyIsImmediate) {
  return { lead, matchScore: 0, matchReasons: ['נדרש תאריך ספציפי - הנכס מיידי'], priority: 0 };
}
```

אחרי:
```typescript
} else if (propertyIsImmediate) {
  reasons.push('כניסה מיידית - פנוי לפני התאריך המבוקש ✓');
}
```

**תיקון 2 -- שורות 510-511:**

לפני:
```typescript
if (propertyFurnished !== 'fully_furnished') {
  return { lead, matchScore: 0, matchReasons: ['נדרשת דירה מרוהטת מלא - לא צוין בנכס'], priority: 0 };
}
```

אחרי:
```typescript
if (propertyFurnished !== 'fully_furnished' && propertyFurnished !== true) {
  return { lead, matchScore: 0, matchReasons: ['נדרשת דירה מרוהטת מלא - לא צוין בנכס'], priority: 0 };
}
```

ואותו דבר עבור partially_furnished (שורה 517):
```typescript
if (propertyFurnished !== 'fully_furnished' && propertyFurnished !== 'partially_furnished' && propertyFurnished !== true) {
```

### פריסה
- אין צורך בפריסה נפרדת -- `matching.ts` הוא shared module שנטען אוטומטית על ידי `match-batch`
