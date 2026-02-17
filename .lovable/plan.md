

# תיקון זיהוי מדלן ב-Jina - חסימת בוט vs. הסרת מודעה

## הבעיה שמצאנו
Jina לא מבדיל בין שני מצבים:
- **מודעה שהוסרה** -- מדלן מפנה לדף הבית (לגיטימי)
- **בוט שנחסם** -- מדלן מפנה לדף הבית או מציג CAPTCHA (חסימה)

בגלל זה, דירות אקטיביות סומנו בטעות כלא פעילות.

## מה בדיוק ישתנה

### 1. קובץ: `supabase/functions/check-property-availability-jina/index.ts`

שלושה שינויים בפונקציה `checkWithJina`:

**א. זיהוי CAPTCHA (בדיקה חדשה לפני כל השאר):**
אם התוכן מכיל "סליחה על ההפרעה" -- זה חסימת בוט, לא הסרה. מסומן כ-`madlan_captcha_blocked` (retryable).

**ב. שינוי הלוגיקה של homepage redirect:**
במקום לסמן `madlan_homepage_redirect` כ-inactive, מסמנים אותו כ-retryable. הסיבה: ב-Jina אי אפשר לסמוך שהפניה לדף הבית מעידה על הסרה -- היא יכולה להיות גם חסימת בוט.

**ג. הוספת `madlan_captcha_blocked` לרשימת ה-retryable reasons:**
כדי שדירות שנחסמו יחזרו לתור הבדיקה ולא ייזרקו.

### 2. לא משנים את `availability-indicators.ts`
הקובץ המשותף נשאר כמו שהוא -- ב-Firecrawl ההתנהגות תקינה. השינוי רק בקוד של Jina.

## סדר הבדיקות החדש למדלן ב-Jina

```text
1. תוכן קצר מ-100 תווים? --> keeping active (retryable)
2. מדלן + תוכן קצר מ-1000 תווים? --> madlan_skeleton (retryable)  
3. מכיל "סליחה על ההפרעה"? --> madlan_captcha_blocked (retryable) [חדש]
4. מכיל "המודעה הוסרה"? --> listing_removed_indicator (inactive) [נשאר]
5. דף הבית של מדלן? --> madlan_homepage_redirect (retryable, לא inactive) [שינוי]
6. אף אחד מהנ"ל? --> content_ok (active)
```

## התוצאה

- **יד2 והומלס** -- אין שינוי, עובד מצוין
- **מדלן** -- רק "המודעה הוסרה" (טקסט מפורש) יסמן דירה כלא פעילה. חסימות בוט והפניות לדף הבית יחזרו לתור הבדיקה

## פרטים טכניים

### שינויי קוד ב-`checkWithJina`:

```text
// אחרי בדיקת skeleton, לפני isListingRemoved:
if (source === 'madlan' && markdown.includes('סליחה על ההפרעה')) {
  return { isInactive: false, reason: 'madlan_captcha_blocked' };
}

// שינוי ה-homepage redirect מ-inactive ל-retryable:
if (source === 'madlan' && isMadlanHomepage(markdown)) {
  return { isInactive: false, reason: 'madlan_homepage_redirect' };
  // היה: isInactive: true
}
```

### שינוי ברשימת retryableReasons:

```text
const retryableReasons = new Set([
  ...existing reasons,
  'madlan_captcha_blocked',    // חדש
  'madlan_homepage_redirect',  // הועבר לכאן מ-"inactive"
]);
```

