
## תוכנית תיקון איכות נתונים - Personal Scout

### בעיות מזוהות

1. **8 דירות בערים לא נכונות** - כפר סבא, חולון, אשדוד, עכו, גבעתיים, פתח תקווה
2. **6 רשומות עם URLs גנריים** - בלי מזהה דירה ספציפי
3. **נתונים חסרים** - Homeless: 59% בלי חדרים, 32% בלי מחיר | Madlan: 55% בלי שכונה
4. **כפילויות פרויקטים** - אותו פרויקט Madlan מופיע 3+ פעמים

---

### פתרון מוצע

#### שלב 1: תיקון פילטר העיר (feature-filter.ts)

הלוגיקה הנוכחית בודקת אם הכתובת מכילה עיר אחרת, אבל לא דוחה כשהעיר עצמה לא תואמת:

```text
לוגיקה נוכחית (שגויה):
┌─────────────────────────────────────┐
│ עיר הנכס: "כפר סבא"                 │
│ עיר מועדפת: "תל אביב"               │
│                                     │
│ בדיקה: prop.city = "כפר סבא" ≠ "תל אביב" ✗
│ אבל: כתובת לא מכילה עיר אחרת → עובר! ✗
└─────────────────────────────────────┘

לוגיקה נכונה:
┌─────────────────────────────────────┐
│ בדיקה: prop.city לא בערים מועדפות  │
│ → נדחה מיד עם 'wrong_city'          │
└─────────────────────────────────────┘
```

**קוד מתוקן:**
```typescript
if (lead.preferred_cities && lead.preferred_cities.length > 0) {
  // בדיקה ישירה: האם העיר של הנכס ברשימה המועדפת?
  const propCity = normalizeCity(prop.city || '');
  const matchesPreferredCity = lead.preferred_cities.some(
    c => normalizeCity(c) === propCity
  );
  
  if (!matchesPreferredCity) {
    return 'wrong_city';  // דחייה מיידית
  }
  
  // בדיקה נוספת: האם הכתובת מכילה עיר אחרת?
  const addressCity = extractCityFromAddress(prop.address || '');
  if (addressCity && !lead.preferred_cities.some(c => normalizeCity(c) === addressCity)) {
    return 'wrong_city';
  }
}
```

#### שלב 2: הוספת רשימת הערים החסרות

הוספת כפר סבא, אשדוד, עכו לרשימת הערים המוכרות כדי לאפשר זיהוי נכון:

```typescript
const KNOWN_CITIES = [
  // קיימות...
  { pattern: /כפר\s*סבא/i, normalized: 'כפרסבא' },
  { pattern: /אשדוד/i, normalized: 'אשדוד' },
  { pattern: /עכו/i, normalized: 'עכו' },
  { pattern: /גבעת\s*אבני/i, normalized: 'גבעתאבני' },
];
```

#### שלב 3: שיפור Homeless Markdown Fallback

דילוג על נכסים עם URLs גנריים (בלי מזהה):

```typescript
// בזמן שמירה - לדלג על URLs גנריים
if (m.source_url === 'https://www.homeless.co.il' || 
    !m.source_url.includes('/viewad,')) {
  console.log('Skipping generic URL');
  continue;
}
```

#### שלב 4: סינון פרויקטים מ-Madlan

פרויקטים (לעומת דירות בודדות) מייצרים רעש - נוסיף סינון:

```typescript
// לדלג על URLs של פרויקטים
if (m.source_url.includes('/projects/')) {
  console.log('Skipping project URL');
  continue;
}
```

#### שלב 5: ניקוי נתונים קיימים (SQL)

```sql
-- 1. מחיקת דירות בערים לא נכונות
DELETE FROM personal_scout_matches 
WHERE city NOT IN ('תל אביב יפו', 'תל אביב');

-- 2. מחיקת URLs גנריים
DELETE FROM personal_scout_matches 
WHERE source_url = 'https://www.homeless.co.il'
   OR source_url LIKE '%/projects/%';

-- 3. מחיקת רשומות ללא נתונים שימושיים
DELETE FROM personal_scout_matches 
WHERE price IS NULL AND rooms IS NULL AND address IS NULL;
```

---

### תוצאות צפויות

| מדד | לפני | אחרי |
|-----|------|------|
| סה"כ רשומות | 513 | ~450 |
| ערים שגויות | 8 | 0 |
| URLs גנריים | 6 | 0 |
| פרויקטים | ~50 | 0 |
| רשומות ריקות | ~20 | 0 |

---

### קבצים לעדכון

1. `supabase/functions/_personal-scout/feature-filter.ts` - תיקון לוגיקת פילטר עיר
2. `supabase/functions/personal-scout-worker/index.ts` - הוספת סינון URLs גנריים ופרויקטים
3. הרצת SQL לניקוי הנתונים הקיימים
