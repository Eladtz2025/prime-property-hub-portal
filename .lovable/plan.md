## תיקון חילוץ טלפונים מ-Homeless + הבהרה לגבי הכפתור לעצור

### בעיה 1: לא מחלץ — סיבה מאומתת
ה-HTML של homeless.co.il כבר לא מכיל את הטלפון. הוא מוצג רק אחרי לחיצה על "הצגת מספר טלפון", שמפעילה קריאת AJAX:
```
POST https://www.homeless.co.il/TrackEngagement.ashx
Body: action=phonereveal&boardType=sale&adId=257070
Response: {"d":"050-4063715"}
```
בדקתי ידנית — הקריאה מחזירה את הטלפון בהצלחה ללא חסימות.

### בעיה 2: כפתור עצור
הכפתור הקיים זה ה-**Toggle "מופעל/כבוי"** בכרטיס (למעלה משמאל). כשמכבים אותו, ה-Worker מחזיר `feature_flag_disabled` בריצה הבאה ולא מבצע כלום. זה ה"עצור" — אין צורך בכפתור נפרד.

ה-Worker כבר מעבד נכס אחד בלבד בכל ריצה (השהייה 15-45ש), לכן אין "ריצה ארוכה" שצריך להפסיק באמצע.

### תיקון
בקובץ `supabase/functions/extract-phone/index.ts`, להחליף את הלוגיקה של Homeless:
1. לחלץ `boardType` ו-`adId` מה-URL (regex על תבנית `/{boardType}/viewad,{adId}.aspx`).
2. לקרוא ישירות ל-`POST /TrackEngagement.ashx` עם הכותרות הנדרשות (`X-Requested-With: XMLHttpRequest`, `Referer`).
3. לפרסר את `data.d` (יכול להיות גם "050-X,03-Y" — לקחת את הראשון התקין).
4. אם `d` ריק או "0" — סטטוס `not_found`.

### תוצאה צפויה
תוך דקות בודדות יתחילו להיווצר רשומות `phones_found: 1` ב-`phone_extraction_runs`, והמונה "טלפונים נמצאו" יעלה.