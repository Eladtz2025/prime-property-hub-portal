

## הצגת פירוט סריקות לפי מקור בטאב סריקה

### הבעיה
כשאין `page_stats` בריצת סריקה (או כשמשתמשים ב-fallback מ-`recentScoutRuns`), הקוד עושה `return` ולא מציג כלום — למרות שיש נתוני `properties_found` ו-`new_properties` בכל ריצה.

### מה ישתנה

**קובץ: `useMonitorData.ts`** — בלוק בניית feed items של סריקות (שורות 363-397)

שינוי הלוגיקה כך שגם ריצות בלי `page_stats` יציגו feed item:

1. **אם יש `page_stats`** — ההתנהגות הנוכחית נשמרת (פירוט עמודים, שגיאות וכו')
2. **אם אין `page_stats`** — יווצר feed item מסכם מהשדות `properties_found` ו-`new_properties`:
   - Primary: `סריקת yad2 — הושלמה`
   - Details: `191 נמצאו | 22 חדשים`
   - Source badge: YAD2 / MDLN / HMLS
   - Status: ok / warning בהתאם

כך כל ריצה שהושלמה תוצג בטאב סריקה — גם Yad2, גם Madlan, גם Homeless — עם הנתונים המלאים שלה.

### תוצאה
בטאב סריקה יופיעו כל שלוש הסריקות מאתמול/היום עם פירוט כמה נמצאו וכמה חדשים בכל אחת.

