

# תוסף כרום לפרסום אוטומטי בקבוצות פייסבוק

## סקירה
הארכיטקטורה שהמתכנת הציע טובה ומקיפה. אני יכול לבנות את כל 3 החלקים. הנה התוכנית:

## חלק 1: Supabase — טבלה + Edge Function + שינוי auto-publish

### 1א. מיגרציה — טבלת `social_group_publish_queue`
- יצירת הטבלה כפי שתואר, עם RLS policies (מנהלים בלבד)
- אינדקסים על `status + scheduled_at` לשליפה מהירה

### 1ב. Edge Function — `group-publish-queue`
- `GET ?action=next` — מחזיר פוסט pending שהגיע זמנו, מעדכן ל-publishing
- `POST ?action=complete` — מעדכן ל-published
- `POST ?action=fail` — מעדכן ל-failed, מעלה attempt_count
- `GET ?action=stats` — סטטיסטיקות להצגה ב-popup
- אימות באמצעות anon key (התוסף ישלח אותו)

### 1ג. שינוי `auto-publish/index.ts`
- כש-`publish_target.type === 'groups'` — במקום ליצור social_posts ולקרוא ל-social-publish, ייצור רשומות ב-`social_group_publish_queue` עם `scheduled_at` מפוזר (רווח אקראי 2-5 דקות)
- יישום כללי אנטי-ספאם בצד השרת: מגבלת 8-10 קבוצות ליום, חלון 09:00-21:00, ווריאציה בטקסט

## חלק 2: תוסף כרום

### מבנה קבצים ב-`extension/`
- `manifest.json` — MV3, permissions: tabs, storage, alarms, activeTab
- `background.js` — polling כל 2 דקות, ניהול טאבים, דיווח חזרה ל-Supabase
- `content-script.js` — מציאת composer, הקלדה אנושית, העלאת תמונות, לחיצה על Post
- `popup.html` + `popup.js` — סטטוס, כפתורי השהה/הפעל, לוג

### אנטי-ספאם בתוסף
- delay אקראי 60-120 שניה בין פוסטים
- הקלדה תו-תו (30-80ms)
- warmup mode בשבוע ראשון

### אריזה
- ZIP ל-`public/ct-market-publisher.zip` עם כפתור הורדה מה-admin

## חלק 3: UI בפאנל ניהול
- הוספת טאב "תור קבוצות" ב-AutoPublishManager שמציג את הפוסטים בתור + סטטוסים
- כפתורי "Copy & Open" לפרסום ידני כ-fallback (אם התוסף לא פעיל)

## סדר ביצוע
1. מיגרציה לטבלה
2. Edge Function `group-publish-queue`
3. שינוי `auto-publish/index.ts`
4. בניית תוסף כרום (manifest, background, content-script, popup)
5. אריזה ב-ZIP + כפתור הורדה
6. UI ניהול תור קבוצות + Copy & Open fallback

## הערות חשובות
- ה-content-script תלוי ב-DOM של פייסבוק — שביר מטבעו. ה-selectors יצטרכו עדכון תקופתי
- התוסף דורש שהמשתמש מחובר לפייסבוק בדפדפן
- ה-anon key יוטמע בתוסף — הוא public key אז זה תקין, אבל ה-RLS חייב להיות הדוק

