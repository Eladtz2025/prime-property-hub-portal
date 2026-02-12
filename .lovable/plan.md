

# תיקון: "תל אביב יפו" נכנס לשדה boolean

## שורש הבעיה

בקובץ `property-helpers.ts`, שורות 287-290:

```text
const canCheckDuplicates = hasValidAddress 
    && property.rooms !== undefined 
    && property.floor !== undefined 
    && normalizedCity;
```

ב-JavaScript, ביטוי `&&` מחזיר את הערך האחרון אם כולם truthy. כלומר כש-`normalizedCity = "תל אביב יפו"`, הביטוי מחזיר את המחרוזת `"תל אביב יפו"` ולא `true`.

הערך הזה מועבר לשדה `duplicate_check_possible` (שורה 428) שהוא עמודת `boolean` בדאטאבייס, ולכן Postgres זורק שגיאה:

```text
invalid input syntax for type boolean: "תל אביב יפו"
```

## התיקון

שורה אחת - להוסיף `!!` כדי להמיר את התוצאה ל-boolean:

```typescript
const canCheckDuplicates = !!(hasValidAddress 
    && property.rooms !== undefined 
    && property.floor !== undefined 
    && normalizedCity);
```

או לחלופין:

```typescript
const canCheckDuplicates = hasValidAddress 
    && property.rooms !== undefined 
    && property.floor !== undefined 
    && !!normalizedCity;
```

## קובץ לשינוי

| קובץ | שינוי |
|------|-------|
| `supabase/functions/_shared/property-helpers.ts` | הוספת `!!` ל-`canCheckDuplicates` (שורה 287) |

## אחרי התיקון

צריך לעשות deploy ל-`scout-yad2` כדי שהשינוי יהיה פעיל, ואז להריץ שוב.
