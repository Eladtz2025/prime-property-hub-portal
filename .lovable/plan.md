
## סינון נכסים ללא שם רחוב מתוצאות הלקוחות

### הבעיה שזוהתה
נכסים ללא כתובת אמיתית (רחוב) מופיעים בתוצאות ההתאמה של לקוחות:

| סוג כתובת | סה"כ | מותאמים ללקוחות | דוגמא |
|-----------|------|-----------------|-------|
| ללא כתובת (NULL) | 375 | 60 | - |
| כתובת = שכונה | 367 | 7 | "נווה צדק", "פלורנטין" |
| גנרי ("דירה") | 63 | 3 | "דירה" |
| **סה"כ בעייתיים** | **805** | **70** | - |

### פתרון מוצע

שלב אחד פשוט - סינון ב-matching logic. נכס יסונן אם:
1. `address` הוא NULL או ריק
2. `address` הוא "דירה" (מילה גנרית)
3. `address` זהה לשכונה (סימן שאין רחוב אמיתי)

**הערה:** לא נדרוש מספר בית - רחוב בלבד מספיק.

---

### שינוי טכני

**קובץ:** `supabase/functions/_shared/matching.ts`

**מיקום:** בתחילת פונקציית `calculateMatch` (לפני בדיקת סוג נכס) - שורה ~181

**קוד להוספה:**

```typescript
// ===== ADDRESS MUST BE A VALID STREET (not just neighborhood name) =====
const address = property.address?.trim();
const neighborhood = property.neighborhood?.trim();

// Skip properties without a real street address
if (!address || address === '') {
  return { lead, matchScore: 0, matchReasons: ['לנכס אין כתובת'], priority: 0 };
}

// Skip generic "apartment" addresses
if (address.toLowerCase() === 'דירה' || address.toLowerCase() === 'apartment') {
  return { lead, matchScore: 0, matchReasons: ['כתובת לא ספציפית'], priority: 0 };
}

// Skip if address is just the neighborhood name (no real street)
if (neighborhood && address.toLowerCase() === neighborhood.toLowerCase()) {
  return { lead, matchScore: 0, matchReasons: ['כתובת היא רק שם שכונה'], priority: 0 };
}
```

---

### איך זה עובד

1. **נכס בלי כתובת** → נדחה עם "לנכס אין כתובת"
2. **נכס עם address="דירה"** → נדחה עם "כתובת לא ספציפית"  
3. **נכס עם address="נווה צדק" ו-neighborhood="נווה צדק"** → נדחה עם "כתובת היא רק שם שכונה"
4. **נכס עם address="ויתקין 15"** → ממשיך לבדיקות הרגילות (גם אם הרחוב לא בטבלה)

---

### תוצאות צפויות

| מצב | לפני | אחרי |
|-----|------|------|
| נכסים בלי רחוב בתוצאות | 70 | 0 |
| לקוח רואה נכס בלי כתובת | כן | לא |

---

### שאלה חשובה

כרגע יש רחובות שלא בטבלת `street_neighborhoods` (כמו "ויתקין", "מנדלשטם"). האם גם אותם לסנן, או רק את הנכסים בלי כתובת בכלל?

**אופציה א:** סינון רק נכסים בלי כתובת/כתובת גנרית (הפתרון הנוכחי)
**אופציה ב:** סינון גם נכסים שהרחוב שלהם לא בטבלה (יותר מחמיר)

הפתרון המוצע הוא אופציה א' - כי רחובות כמו "ויתקין" הם רחובות אמיתיים, רק חסרים בטבלה.
