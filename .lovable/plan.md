

## QA ודו"ח בדיקות — מערכת פרסום סושיאל

### 1. בעיית אבטחה: אין אישור לפני פרסום

**בעיה קריטית**: כפתור "פרסם עכשיו" שולח ישר לפייסבוק/אינסטגרם בלי שום dialog אישור. בנוסף, ה-scheduler (cron כל 5 דקות) מפרסם אוטומטית כל פוסט בסטטוס "scheduled" שהזמן שלו הגיע — גם בלי אישור.

**תיקון**:
- הוספת **Confirmation Dialog** לפני כל פרסום — "האם אתה בטוח שברצונך לפרסם עכשיו?"
- הוספת Confirmation Dialog גם למחיקת פוסטים, קבוצות ותבניות (היום מוחק ישר)
- הוספת סטטוס חדש `pending_approval` — כשלוחצים "פרסם עכשיו" הפוסט עובר ל-pending ורק אחרי אישור מפורש נשלח ל-API

### 2. באגים ובעיות שמצאתי

| בעיה | מיקום | חומרה |
|------|-------|-------|
| אין confirmation לפני פרסום | SocialPostComposer.tsx שורה 379 | קריטי |
| אין confirmation למחיקה | SocialPostsList, FacebookGroupsManager, SocialTemplatesManager | בינוני |
| Access Token נשמר ב-DB בטקסט גלוי | social_accounts.access_token | בינוני |
| כפתור "פרסם עכשיו" מסטטוס "publish" הופך ל-"scheduled" ואז נשלח | SocialPostComposer שורה 194 | באג לוגי |
| IG: אין בדיקה שיש לפחות תמונה אחת (IG חייב תמונה) | SocialPostComposer | בינוני |
| אין הודעת הצלחה עם לינק לפוסט שפורסם | SocialPostComposer | UX |

### 3. שיפור עיצוב — המערכת פונקציונלית אבל בסיסית

**שינויים מוצעים:**

**א. SocialDashboard — כרטיסי סטטוס בראש הדף:**
- הוספת 3 כרטיסי סיכום: "פוסטים שפורסמו", "מתוזמנים", "טיוטות"
- סגנון דומה לכרטיסים בלוח הבקרה הראשי

**ב. SocialPostComposer — שדרוג ויזואלי:**
- תצוגה מקדימה בצד ימין (split view) במקום מתחת
- כפתורי פלטפורמה עם אייקונים צבעוניים במקום checkboxes
- אזור תמונות עם drag & drop visual (grid יפה)

**ג. SocialPostsList — שדרוג טבלה:**
- עיצוב כרטיסים במקום טבלה (יותר ויזואלי)
- תמונה מוקטנת, badge צבעוני לסטטוס
- כפתורי פעולה ברורים יותר

**ד. כללי:**
- כותרות עם אייקונים
- spacing ו-padding אחידים
- הוספת empty states יפים עם אילוסטרציות

### סיכום שינויים

**קבצים שישתנו:**
1. `SocialPostComposer.tsx` — confirmation dialog, בדיקת IG, עיצוב
2. `SocialPostsList.tsx` — confirmation למחיקה, עיצוב כרטיסים
3. `SocialDashboard.tsx` — כרטיסי סיכום, עיצוב
4. `FacebookGroupsManager.tsx` — confirmation למחיקה
5. `SocialTemplatesManager.tsx` — confirmation למחיקה
6. `SocialAccountSetup.tsx` — שיפורי עיצוב

**~6 קבצים, שינויים עיקריים בפרונט-אנד. ה-Edge Functions לא ישתנו.**

