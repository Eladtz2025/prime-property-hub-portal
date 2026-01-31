
# תיקון מלא - הצגת נכסים + עדכון נתונים חסרים

## סיכום הבעיות

| בעיה | מיקום | תיאור |
|------|-------|-------|
| **UI מציג address במקום title** | שורה 1591, 1734 | הממשק מציג `address` + `neighborhood` כפול |
| **כפילות שכונה בתצוגה** | שורה 1591, 1734 | נוסף `, ${neighborhood}` גם כשהכתובת כבר מכילה שכונה |
| **נכסים עם יפו בכותרת** | DB | ה-SQL הקודם לא עדכן נכסים עם `neighborhood = null` |
| **נכסים ללא address** | DB | נכסי תיווך ללא רחוב צריכים address מושלמת |

---

## פתרון חלק 1: תיקון ה-UI (ScoutedPropertiesTable.tsx)

### שינוי 1: שורות 1591-1595 (טבלת Desktop)

**לפני:**
```typescript
<p className="font-medium">
  {property.property_type === 'rent' ? 'להשכרה' : 'למכירה'} {property.address || ''}{property.neighborhood ? `, ${property.neighborhood}` : ''}
</p>
```

**אחרי:**
```typescript
<p className="font-medium">
  {property.title || `${property.property_type === 'rent' ? 'להשכרה' : 'למכירה'} ${property.neighborhood || ''}`}
</p>
```

### שינוי 2: שורות 1733-1735 (כרטיסי Mobile)

**לפני:**
```typescript
<span className="font-medium truncate flex-1 min-w-0">
  {property.property_type === 'rent' ? 'להשכרה' : 'למכירה'} {property.address || ''}{property.neighborhood ? `, ${property.neighborhood}` : ''}
</span>
```

**אחרי:**
```typescript
<span className="font-medium truncate flex-1 min-w-0">
  {property.title || `${property.property_type === 'rent' ? 'להשכרה' : 'למכירה'} ${property.neighborhood || ''}`}
</span>
```

---

## פתרון חלק 2: תיקון נתונים חסרים (SQL)

### 2.1 עדכון כותרות שעדיין מכילות "יפו" שגוי

הקוד הקודם לא תיקן נכסים כי הם היו עם `neighborhood = null`. נתקן ישירות:

```sql
-- Fix titles that still have "יפו" but have valid raw_neighborhood data
UPDATE scouted_properties SET
  title = REPLACE(title, 'ביפו', 'ב' || (raw_data->>'neighborhoodText')),
  neighborhood = raw_data->>'neighborhoodText'
WHERE source = 'homeless'
  AND is_active = true
  AND title LIKE '%ביפו%'
  AND neighborhood IS NULL
  AND raw_data->>'neighborhoodText' IS NOT NULL
  AND raw_data->>'neighborhoodText' != ''
  AND raw_data->>'neighborhoodText' NOT LIKE '%תל אביב%';
```

### 2.2 עדכון שדה neighborhood מ-raw_data לנכסים שחסר

```sql
-- Populate neighborhood from raw_data where it's null
UPDATE scouted_properties SET
  neighborhood = raw_data->>'neighborhoodText'
WHERE source = 'homeless'
  AND is_active = true
  AND neighborhood IS NULL
  AND raw_data->>'neighborhoodText' IS NOT NULL
  AND raw_data->>'neighborhoodText' != ''
  AND raw_data->>'neighborhoodText' NOT IN ('תל אביב יפו', 'תל אביב', 'יפו');
```

### 2.3 בניית address לנכסים בלי כתובת

```sql
-- Build address for properties with neighborhood but no address
UPDATE scouted_properties SET
  address = neighborhood || ', תל אביב יפו'
WHERE source = 'homeless'
  AND is_active = true
  AND address IS NULL
  AND neighborhood IS NOT NULL
  AND city = 'תל אביב יפו';
```

---

## תוצאות צפויות

### UI

| לפני | אחרי |
|------|------|
| `להשכרה טאגור, רמת אביב, תל אביב יפו, רמת אביב` | `דירה 4 חדרים בטאגור, רמת אביב` |
| `להשכרה , הגוש הגדול` | `דופלקס 6 חדרים בהגוש הגדול` |
| `להשכרה יהודה הנשיא, נוה אביבים, תל אביב יפו, נווה אביבים` | `דירה 4 חדרים ביהודה הנשיא, נווה אביבים` |

### נתונים

| לפני | אחרי |
|------|------|
| `title: "דופלקס 6 חדרים ביפו"`, `neighborhood: null` | `title: "דופלקס 6 חדרים בהגוש הגדול"`, `neighborhood: "הגוש הגדול"` |
| `address: null`, `neighborhood: "כוכב הצפון"` | `address: "כוכב הצפון, תל אביב יפו"` |

---

## קבצים לעדכון

| קובץ | שינוי |
|------|-------|
| `src/components/scout/ScoutedPropertiesTable.tsx` | שימוש ב-`title` במקום `address` + `neighborhood` |
| SQL Migration | תיקון titles שגויים + מילוי neighborhood + בניית address |
