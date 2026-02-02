

## תוכנית ניקוי נתונים - 3 פעולות

### סיכום מה צריך למחוק

| קטגוריה | כמות | מקורות |
|---------|------|--------|
| מחיר מתחת ל-3,000 ₪ | 104 נכסים | Homeless, Madlan, Yad2 |
| שמות מתווכים בכתובת | 26 נכסים | שמות כמו: MONROV, RS נדל"ן, זירו מתווכים, קונקורד, טל נכסים |
| ערים שאינן תל אביב | 1 נכס | בת ים |

**סה"כ למחיקה: ~130 נכסים** (עם חפיפה אפשרית)

---

### שלב 1: מחיקת נכסים מהמסד נתונים

**פעולה א' - מחיקת מחירים נמוכים:**
```sql
DELETE FROM scouted_properties 
WHERE price < 3000 AND property_type = 'rent';
```

**פעולה ב' - מחיקת כתובות עם שמות מתווכים:**
```sql
DELETE FROM scouted_properties 
WHERE address ~* '(קונקורד|concord|monrov|מונרוב|זירו|zero.*broker|הומי|homy|פאר תיווך|טל נכסים|חברה חדשה|rs נדל|anglo.*saxon|רימקס|remax|re/max|century|קולדוול)';
```

**פעולה ג' - מחיקת נכסים מחוץ לתל אביב:**
```sql
DELETE FROM scouted_properties 
WHERE city IS NOT NULL 
  AND city NOT LIKE '%תל אביב%' 
  AND city NOT LIKE '%תל-אביב%';
```

---

### שלב 2: עדכון הקוד למניעת הבעיות בעתיד

**2.1 הוספת MIN_PRICE לקונפיגורציה:**
- הוספת פרמטר `min_price: 3000` לקובץ הקונפיגורציה
- עדכון ה-parsers (Yad2, Madlan, Homeless) לסנן לפני שמירה

**2.2 בדיקת קוד ה-sanitization הקיים:**
- קובץ `broker-detection.ts` כבר מכיל חלק מהמתווכים
- צריך לוודא שהוא מופעל על שדה `address` ולא רק על שדות אחרים
- אם כבר מתוקן - רק למחוק את הקיימים

**2.3 סינון ערים:**
- כבר קיים ב-`property-helpers.ts` סינון לתל אביב בלבד
- צריך לבדוק למה בת ים עברה

---

### שלב 3: אחרי הניקוי - סריקת LIVE של Homeless

לאחר השלמת הניקוי, אבצע סריקה חיה של Homeless כדי:
1. לבדוק שה-URL החדש (עם `?inumber1=X&page=N`) עובד נכון
2. לוודא שכל קונפיגורציה מושכת את השכונות הנכונות
3. לבדוק את איכות החילוץ של כל השדות

---

### פרטים טכניים

**קבצים שייבדקו/יעודכנו:**
- `supabase/functions/_shared/property-helpers.ts` - סינון מחיר מינימלי
- `supabase/functions/_shared/broker-detection.ts` - רשימת מתווכים
- `supabase/functions/scout-yad2/parser.ts` - sanitization
- `supabase/functions/scout-madlan/parser.ts` - sanitization
- `supabase/functions/scout-homeless/parser.ts` - sanitization

**הערה חשובה:** 
לפי ה-diff האחרון, כבר תיקנת את פורמט ה-URL של Homeless מ-path style ל-query string. הסריקה החיה תאמת שהתיקון עובד נכון.

