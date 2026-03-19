

## פירוט נכסים בודדים בטאבים כפילויות והתאמות

### מצב נוכחי
- **כפילויות**: מציג שורת סיכום אחת ("X נבדקו | Y כפילויות")
- **התאמות**: מציג שורת סיכום אחת ("X נכסים עובדו | Y התאמות נמצאו")

### מה ישתנה

**קובץ: `useMonitorData.ts`**

#### 1. כפילויות — הצגת נכסים שזוהו ככפולים
- **שאילתה חדשה**: שליפת נכסים מ-`scouted_properties` שה-`duplicate_detected_at` שלהם נופל בחלון הזמן של ריצת הכפילויות האחרונה (בין `started_at` ל-`completed_at` של ה-`backfill_progress` עם `task_name = 'dedup-scan'`)
- שדות: `address`, `neighborhood`, `price`, `rooms`, `source`, `source_url`, `duplicate_group_id`
- מוגבל ל-250 תוצאות
- **בניית feed items**: כל נכס כפול = שורה בפיד
  - Primary: כתובת הנכס
  - Details: מחיר + חדרים + שכונה + "קבוצה: X" (מספר הקבוצה מקוצר)
  - eventKind: `found`
  - Source badge: YAD2/MDLN/HMLS
  - URL: קישור למודעה
- שורת הסיכום הקיימת נשארת כ-header

#### 2. התאמות — הצגת נכסים שנמצאו להם התאמות
- **שאילתה חדשה**: שליפת נכסים מ-`scouted_properties` שה-`matched_leads` שלהם לא ריק ועודכנו בחלון הזמן של ריצת ההתאמות האחרונה (בין `started_at` ל-`completed_at` של `scout_runs` עם `source = 'matching'`)
- סינון: `updated_at` בחלון הריצה + `matched_leads` לא ריק + `jsonb_array_length > 0`
- שדות: `address`, `neighborhood`, `price`, `rooms`, `source`, `source_url`, `matched_leads`
- מוגבל ל-250 תוצאות
- **בניית feed items**: כל נכס עם התאמות = שורה בפיד
  - Primary: כתובת הנכס
  - Details: מחיר + חדרים + "X התאמות" (מספר הלידים ב-matched_leads)
  - eventKind: `matched`
  - Source badge: YAD2/MDLN/HMLS
  - URL: קישור למודעה
- שורת הסיכום הקיימת נשארת כ-header

#### 3. תלות ב-feedItems useMemo
- הוספת שתי השאילתות החדשות לרשימת התלויות של ה-`useMemo` שבונה את `feedItems`

### תוצאה
בטאב כפילויות יופיעו כל הנכסים שזוהו ככפולים בריצה האחרונה, ובטאב התאמות כל הנכסים שנמצאו להם לידים תואמים — עם כתובת, מחיר, חדרים, וקישור למודעה.

