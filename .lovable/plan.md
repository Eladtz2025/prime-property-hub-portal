

## שינויים בכרטיסיות נכסים וניקוי DB

### 1. כרטיסיית "סה״כ אקטיביים" — עדכון הספירה

**קובץ: `src/pages/AdminPropertyScout.tsx`** (שורות 22)

כרגע השאילתה סופרת רק `is_active = true`. צריך להוסיף את אותם פילטרים שהטבלה משתמשת:
- הסתרת כפילויות: `.or('duplicate_group_id.is.null,is_primary_listing.eq.true')`
- רק תל אביב: `.ilike('city', '%תל אביב%')`
- סינון URL שבורים: `.not('source_url', 'ilike', '%/yad1/%')` וכו'

כך המספר בכרטיסייה יתאים למספר בסוגריים בטבלה.

### 2. מחיקת נכסים מה-DB

הרצת שתי פקודות DELETE דרך ה-insert tool:

**א. מחיקת נכסים ללא URL:**
```sql
DELETE FROM scouted_properties 
WHERE source_url IS NULL OR source_url = '';
```

**ב. מחיקת נכסים מחוץ לתל אביב:**
```sql
DELETE FROM scouted_properties 
WHERE city IS NOT NULL 
  AND city NOT ILIKE '%תל אביב%' 
  AND city NOT ILIKE '%tel aviv%';
```

### תוצאה
- הכרטיסייה תציג את אותו מספר כמו הטבלה
- נכסים ללא URL ומחוץ לת"א יימחקו לצמיתות מה-DB

