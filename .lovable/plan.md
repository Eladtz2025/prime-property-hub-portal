

# תיקון פורמט הצגת נכסים

## הבעיה

שיניתי את הקוד להציג `property.title` שמכיל:
> "דירה 4 חדרים בבן יהודה, צפון ישן"

במקום הפורמט שהסכמנו עליו:
> "להשכרה בבן יהודה, צפון ישן"

---

## הפורמט הנכון

```
[להשכרה/למכירה] ב[רחוב], [שכונה]
```

**דוגמאות:**
| רחוב | שכונה | תוצאה |
|------|-------|-------|
| בן יהודה 124 | צפון ישן | `להשכרה בבן יהודה 124, צפון ישן` |
| רוטשילד 15 | לב העיר | `למכירה ברוטשילד 15, לב העיר` |
| (אין רחוב) | הגוש הגדול | `להשכרה בהגוש הגדול` |

---

## השינוי הנדרש

### ScoutedPropertiesTable.tsx

**שורה 1591 (Desktop) - לפני:**
```typescript
{property.title || `${property.property_type === 'rent' ? 'להשכרה' : 'למכירה'} ${property.neighborhood || ''}`}
```

**אחרי:**
```typescript
{property.property_type === 'rent' ? 'להשכרה' : 'למכירה'} {property.raw_data?.streetText ? `ב${property.raw_data.streetText}` : ''}{property.neighborhood ? `, ${property.neighborhood}` : ''}
```

**שורה 1734 (Mobile) - אותו שינוי**

---

## בעיה פוטנציאלית: גישה ל-raw_data

`raw_data` הוא עמודת JSONB. צריך לבדוק:
1. האם ה-query מביא את `raw_data`?
2. האם יש `streetText` בתוכו?

אם `streetText` לא זמין ב-query, אפשר להשתמש ב-`address` ולחלץ ממנו את הרחוב:

**אלטרנטיבה עם address:**
```typescript
// Extract street from address (first part before comma)
const street = property.address?.split(',')[0]?.trim();

{property.property_type === 'rent' ? 'להשכרה' : 'למכירה'} {street ? `ב${street}` : ''}{property.neighborhood ? `, ${property.neighborhood}` : ''}
```

---

## קבצים לעדכון

| קובץ | שינוי |
|------|-------|
| `src/components/scout/ScoutedPropertiesTable.tsx` | שורות 1591 ו-1734 - שינוי לפורמט "להשכרה ברחוב, שכונה" |

