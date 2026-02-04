

# ביצוע השינויים לפילטר סוג מפרסם

## מצב נוכחי
השינויים **לא בוצעו** - הקוד עדיין מכיל את הלוגיקה הישנה.

## שינויים לביצוע

### 1. תיקון לוגיקת הסינון (שורות 537-543)

```typescript
// לפני:
if (filters.ownerType === 'broker') {
  query = query.or('is_private.eq.false,is_private.is.null');
}

// אחרי:
if (filters.ownerType === 'private') {
  query = query.eq('is_private', true);
} else if (filters.ownerType === 'broker') {
  query = query.eq('is_private', false);
} else if (filters.ownerType === 'unknown') {
  query = query.is('is_private', null);
}
```

### 2. הוספת "לא ידוע" ב-Select מובייל (שורות 1320-1324)

```typescript
<SelectContent>
  <SelectItem value="all">הכל</SelectItem>
  <SelectItem value="private">פרטי</SelectItem>
  <SelectItem value="broker">תיווך</SelectItem>
  <SelectItem value="unknown">לא ידוע</SelectItem>
</SelectContent>
```

### 3. הוספת "לא ידוע" ב-Select דסקטופ (שורות 1513-1517)

```typescript
<SelectContent>
  <SelectItem value="all">הכל</SelectItem>
  <SelectItem value="private">פרטי</SelectItem>
  <SelectItem value="broker">תיווך</SelectItem>
  <SelectItem value="unknown">לא ידוע</SelectItem>
</SelectContent>
```

### 4. QA אחרי ביצוע

| פילטר | בדיקה |
|-------|-------|
| תיווך | לא מחזיר NULL |
| לא ידוע | מחזיר רק NULL |
| פרטי | מחזיר רק true |

