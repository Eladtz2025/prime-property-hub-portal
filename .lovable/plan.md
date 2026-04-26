## דוח מצב סריקות ותהליכים תקועים

### בעיה #1: Backfill תקוע 14 שעות 🔴
**`backfill_progress` id `035fbcf6...`** — סטטוס `running` מאז 22:00 אתמול (לפני 847 דקות).
- עיבד **5 מתוך 6** פריטים בלבד ואז קפא
- הפריט האחרון עודכן ב-22:00:40 אתמול — מאז שום פעילות
- 2 כשלונות `scrape_failed` ב-Yad2 (no features extracted)
- אין `error_message`, פשוט תקע

**סיבה סבירה:** Edge Function timeout באמצע פריט #6, ללא השלמה ל-`completed/failed`. אין מנגנון cleanup ל-stuck backfill (בניגוד ל-scout_runs שיש להם 15 דק' threshold).

### בעיה #2: Yad2 חסום לחלוטין 🔴
שתי הריצות האחרונות של Yad2 (20:00, 20:30):
- כל הדפים מסומנים `blocked` עם `error: all_urls_failed_or_blocked`
- כל דף לוקח ~48-64 שניות עד timeout
- ריצה אחת מצאה 100 (דף 1 בלבד שהצליח), השנייה — 0
- WAF/Radware חוסם את Jina Reader (זה תואם את הזיכרון הקיים על Yad2)

### בעיה #3: Madlan חסום לחלוטין 🔴
שתי ריצות (20:10, 20:40):
- **כל** הדפים `blocked` תוך 3-5 שניות (תגובה מהירה = חסימה אקטיבית)
- 0 נכסים נמצאו בכלל
- Madlan מחזיר חסימה מיידית ל-Jina

### בעיה #4: Homeless עובד אבל "partial" 🟡
- 2 ריצות (20:20, 20:50) → 242 + 233 = **475 נכסים נסרקו בהצלחה**
- רק 2 חדשים (השאר כפילויות — תקין)
- סטטוס `partial` כי לא כל הדפים הסתיימו 100% נקי, אבל **זה לא כישלון**

### סיכום ויזואלי
```
מקור      | סטטוס      | נכסים נסרקו | בעיה
----------|------------|-------------|------------------
Homeless  | ✅ עובד    | 475         | אין
Yad2      | 🔴 חסום    | 100 (דף 1)  | WAF blocking Jina
Madlan    | 🔴 חסום    | 0           | חסימה מיידית
Backfill  | 🔴 תקוע    | 5/6         | Edge timeout, אין cleanup
```

### מה לעשות (אם תאשר — אבצע במצב Build)

1. **שחרר את ה-backfill התקוע** — עדכון יחיד:
   ```sql
   UPDATE backfill_progress 
   SET status='partial', completed_at=NOW(), error_message='Auto-closed: stuck >14h'
   WHERE id='035fbcf6-0a16-493e-9102-98d106f2efef';
   ```

2. **הוסף cleanup אוטומטי ל-backfill תקוע** — דומה למנגנון של scout_runs (15 דק' threshold). פונקציית edge `cleanup-stuck-runs` כבר קיימת — להרחיב אותה גם ל-`backfill_progress` ול-`availability_check_runs`.

3. **Yad2 + Madlan חסומים** — זו בעיה ארוכת טווח של Jina מול WAFs. דורש שיחה נפרדת על אסטרטגיה (proxy, Direct API, Firecrawl rotation וכו'). **לא לתקן עכשיו** — רק לדווח.

### מה לא אעשה
- לא אגע בקוד הסריקה של Yad2/Madlan (זו בעיה אסטרטגית)
- לא אריץ סריקות חדשות
- רק שחרור ה-backfill ה-stuck + הרחבת cleanup
