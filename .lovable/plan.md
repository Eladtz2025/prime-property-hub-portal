## בדיקת ריצת ההשלמה הנוכחית (30/04 09:00–09:14)

### מה רואים בנתונים האמיתיים

מצב backfill כללי בנכסים פעילים:
- pending: **1,592** (homeless 181, madlan 443, yad2 965 + failed 60)
- completed: 2,172
- failed: 60 (כמעט כולם madlan)

ב-2 השעות האחרונות:
| source | completed_2h | failed_2h | pending |
|---|---|---|---|
| yad2 | 153 | 4 | 962 |
| homeless | 30 | 0 | 180 |
| madlan | **0** | **59** | 443 |

### מה באמת קורה ב-madlan (זו הבעיה)

בלוגים של `backfill-property-data-jina`:

```
⚠️ Madlan Detail attempt 1: HTTP 403
⚠️ Madlan Detail attempt 2: HTTP 403
⚠️ Madlan GraphQL: Cannot extract ID from /listings/r9BQhU3exof
❌ Madlan Detail: All methods failed
👀 post-fail: listing still available (madlan_direct_status_403)
```

**זה לא בעיית קצב/דיליי.** זה Madlan שמחזיר 403 על *כל* בקשה לפרטי נכס מאז סביבות תחילת הריצה. כל 59 ה-failed נכשלו עם אותו סיגנל בדיוק. הדיליי הקיים (1500ms בין נכסים, 3000ms בין batches) לא משנה כשהשרת עונה 403 מיידי.

זה גם מתיישב עם זה שאתמול זה עבד יופי – מנגנון עקיפת ה-WAF של Madlan נשבר בשלב כלשהו (כנראה שינוי headers/חתימה אצל Madlan, או חסימת ה-IP של ה-edge functions).

### מה כן עובד טוב

- **Yad2**: רץ יציב (153 הצלחות, 4 כשלונות ב-2 שעות). הדיליי 2.5–4s בין בקשות + 3s בין batches מספיק.
- **Homeless**: 30 הצלחות, 0 כשלונות.
- ה-CF Worker של Yad2 פולט הרבה `upstream=403 html=334` אבל זה רק על ה-`yad2-detail-nextdata` הראשון שלפני הירידה ל-HTML — זה לא נכשל בפועל.

### למה הוספת דיליי ל-Madlan לא תעזור

מדובר ב-403 מיידי ב-attempt 1 וב-attempt 2 (אחרי ~4s). זה blocking לפי חתימה/IP, לא לפי throttling. אם נגדיל את הדיליי, פשוט נעשה פחות בקשות — אבל עדיין כל בקשה תיכשל.

### תוכנית פעולה

1. **עצירת ניסיונות backfill ל-Madlan עד שיתוקן ה-fetcher** – להחזיר את 443+59 הנכסים של Madlan ל-`pending` *לא* בתור backfill אלא לסמן `backfill_status='not_needed'` זמנית, או להשאיר `pending` אבל לדלג עליהם בשאילתת ה-batch כדי לא לשרוף ניסיונות לשווא.

   הצעה: להוסיף ב-`backfill-property-data-jina` תנאי דילוג זמני על `source='madlan'` בשאילתת הסלקציה, מבוקר ע"י feature flag (`backfill_madlan_disabled`).

2. **לתקן את Madlan fetcher** – לבדוק את `parser-madlan-ssr` / `scout-madlan-direct` (אותו endpoint שעובד היום ב-scout) ולהשתמש *באותו* נתיב בדיוק גם ב-backfill, במקום הנתיב הישן ש-403 עליו. הזיכרון מתעד שזו האסטרטגיה הנוכחית של Madlan: minimal headers, בלי UA/Referer.

3. **השארת yad2/homeless כפי שהם** – לא להגדיל דיליי. הנתונים מראים שהם עובדים טוב (97%+ הצלחה ב-2 השעות האחרונות). הגדלת דיליי תאט אותם בלי טובת תועלת.

### סיכון

- שלב 1 (דילוג Madlan) – אפס סיכון, רק חוסך CPU וזמן.
- שלב 2 (תיקון fetcher) – שינוי לוגיקה, אבל מוגבל לפונקציה אחת ולמקור אחד.

### מה אני מבקש לאשר

(א) להפעיל kill-switch ל-Madlan ב-backfill (דילוג בשאילתה) **ו**
(ב) להחליף את Madlan fetcher של ה-backfill לזה של `scout-madlan-direct` שעובד.

אם רוצה, אפשר לעשות רק (א) עכשיו ולתקן (ב) בשלב הבא.