

## מערכת פרסום אוטומטי לרשתות חברתיות — תוכנית מאוחדת ומלאה

### מיקום ב-UI
טאב **"פרסום"** (Megaphone) בתוך `MarketingHub.tsx` — מחליף את ה-placeholder "בקרוב" בדשבורד מלא. שלושת הטאבים נשארים: ווטסאפ, **פרסום**, עוד.

---

### שלב 1: טבלאות בסיס נתונים (Migration)

**`social_accounts`** — חשבונות Meta מחוברים
| עמודה | סוג | הערה |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK→profiles | מי חיבר |
| platform | text | facebook / instagram |
| page_id | text | Facebook Page ID |
| page_name | text | שם הדף |
| ig_user_id | text | Instagram Business Account ID |
| access_token | text | Page Access Token (Long-Lived) |
| token_expires_at | timestamptz | תאריך תפוגה (~60 יום) |
| is_active | boolean default true | |
| created_at | timestamptz | |

**`social_posts`** — תור פוסטים מרכזי
| עמודה | סוג | הערה |
|--------|------|-------|
| id | uuid PK | |
| property_id | uuid FK→properties nullable | קישור לנכס (אם מבוסס נכס) |
| platform | text | facebook_page / instagram / facebook_group |
| post_type | text | property_listing / general_content / story / reel |
| content_text | text | הטקסט הסופי |
| template_id | uuid FK→social_templates nullable | תבנית שנבחרה |
| image_urls | jsonb | מערך כתובות תמונות |
| video_url | text nullable | לריל/סטורי |
| status | text default 'draft' | draft / scheduled / publishing / published / failed |
| scheduled_at | timestamptz nullable | מתי לפרסם |
| published_at | timestamptz nullable | מתי פורסם בפועל |
| external_post_id | text nullable | ID שחזר מ-Meta |
| external_post_url | text nullable | קישור לפוסט שפורסם |
| error_message | text nullable | שגיאה אחרונה |
| retry_count | int default 0 | ניסיונות חוזרים |
| target_group_id | uuid FK→social_facebook_groups nullable | לפרסום בקבוצה |
| hashtags | text nullable | האשטגים |
| created_by | uuid FK→profiles | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**`social_templates`** — תבניות פוסטים
| עמודה | סוג | הערה |
|--------|------|-------|
| id | uuid PK | |
| name | text | שם התבנית |
| platform | text | facebook / instagram / both |
| post_type | text | property_listing / general_content |
| template_text | text | טקסט עם placeholders: `{address}`, `{price}`, `{rooms}`, `{size}`, `{neighborhood}`, `{city}`, `{description}`, `{floor}`, `{property_type}` |
| hashtags | text nullable | האשטגים ברירת מחדל |
| is_active | boolean default true | |
| created_by | uuid FK→profiles | |
| created_at | timestamptz | |

**`social_facebook_groups`** — רישום קבוצות פייסבוק
| עמודה | סוג | הערה |
|--------|------|-------|
| id | uuid PK | |
| group_name | text | שם הקבוצה |
| group_url | text | קישור לקבוצה |
| category | text nullable | סוג (נדל"ן ת"א, כללי, וכו') |
| is_active | boolean default true | |
| notes | text nullable | הערות |
| created_by | uuid FK→profiles | |
| created_at | timestamptz | |

**RLS**: כל 4 הטבלאות — `SELECT/INSERT/UPDATE/DELETE` מוגבל ל-authenticated users עם `has_role(auth.uid(), 'admin')` או `has_role(auth.uid(), 'super_admin')`.

---

### שלב 2: Edge Function — `social-publish`

פונקציה שמקבלת `post_id` ומבצעת פרסום דרך Facebook Graph API v21.0:

**פייסבוק דף עסקי:**
- טקסט בלבד → `POST /{page-id}/feed` עם `message`
- תמונה בודדת → `POST /{page-id}/photos` עם `url` + `message`
- מספר תמונות → `POST /{page-id}/photos` עם `published=false` לכל תמונה, ואז `POST /{page-id}/feed` עם `attached_media[]`
- וידאו → `POST /{page-id}/videos` עם `file_url`

**אינסטגרם (דרך Instagram Graph API):**
- תמונה בודדת → `POST /{ig-user-id}/media` (image_url + caption) → `POST /{ig-user-id}/media_publish` (creation_id)
- קרוסלה → יצירת container לכל תמונה → `POST /{ig-user-id}/media` עם `media_type=CAROUSEL` + `children[]` → publish
- ריל → `POST /{ig-user-id}/media` עם `media_type=REELS` + `video_url` → publish

**קבוצות פייסבוק (חצי-אוטומטי):**
- לא מפרסם דרך API (מגבלת Meta)
- מחזיר את התוכן המוכן + קישור ישיר לקבוצה
- ה-UI יציג כפתור "העתק טקסט" + "פתח קבוצה"

**טיפול בשגיאות:**
- retry עד 3 פעמים עם backoff
- עדכון `status`, `error_message`, `retry_count` בטבלה
- בדיקת תקינות token לפני פרסום — אם פג תוקף, מחזיר שגיאה ברורה

**פרסום מקבילי (cross-post):**
- אם המשתמש בחר גם פייסבוק וגם אינסטגרם, ה-Edge Function יוצרת 2 רשומות ב-`social_posts` ומפרסמת לשתי הפלטפורמות

---

### שלב 3: Edge Function — `social-scheduler` (Cron)

- רץ כל 5 דקות דרך `pg_cron` + `pg_net`
- שולף פוסטים: `status = 'scheduled' AND scheduled_at <= now()`
- מעדכן כל פוסט ל-`publishing` (מניעת כפילויות)
- קורא ל-`social-publish` עבור כל פוסט
- מעדכן ל-`published` (הצלחה) או `failed` (כשלון)
- בודק tokens שעומדים לפוג ב-7 ימים הקרובים → מסמן התרעה

---

### שלב 4: מנוע תוכן אוטומטי מנכסים

לוגיקה פנימית (בצד הלקוח + Edge Function) שהופכת נכס לפוסט:

1. **שליפת נכס** מטבלת `properties` — כתובת, מחיר (monthly_rent/current_market_value), חדרים, גודל, קומה, שכונה, תיאור
2. **שליפת תמונות** מ-`property_images` — לפי `is_main` ו-`order_index`, עדיפות ל-`show_on_website = true`
3. **מילוי תבנית** — החלפת placeholders בנתוני הנכס:
   - `{address}` → כתובת
   - `{price}` → מחיר מפורמט (₪4,500 / ₪1,200,000)
   - `{rooms}` → חדרים
   - `{size}` → גודל מ"ר
   - `{floor}` → קומה
   - `{neighborhood}` → שכונה
   - `{city}` → עיר
   - `{description}` → תיאור
   - `{property_type}` → השכרה/מכירה
4. **האשטגים אוטומטיים** — על פי עיר, סוג נכס, שכונה (#נדלן #תלאביב #דירהלהשכרה #יפו וכו')
5. **יצירת draft** — שהמשתמש יכול לערוך לפני תזמון

---

### שלב 5: UI — דשבורד פרסום בטאב "פרסום"

הטאב "פרסום" ב-`MarketingHub` יוחלף בקומפוננטת `SocialDashboard` עם תת-ניווט פנימי (Tabs או כפתורים):

#### א. הגדרת חשבון Meta (חד-פעמי)
- **מדריך צעד-אחר-צעד מובנה** עם הסברים ותמונות:
  1. יצירת Facebook App ב-developers.facebook.com
  2. הוספת הרשאות: `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`
  3. יצירת Long-Lived Page Access Token
  4. הזנת Token + Page ID + IG User ID בטופס
- **אימות אוטומטי** — לחיצה על "בדוק חיבור" שולחת request ל-Graph API ומציגה שם הדף + אינסטגרם
- **סטטוס חיבור** — Badge ירוק/אדום, שם הדף, תאריך תפוגת token, כפתור חידוש
- **התרעת תפוגה** — Banner כשה-token עומד לפוג ב-7 ימים הקרובים
- Tokens נשמרים בטבלת `social_accounts` (לא כ-Supabase secrets, כדי לאפשר עדכון מהממשק)

#### ב. יצירת פוסט חדש (הלב של המערכת)
- **בחירת מקור**: 
  - "מנכס" — dropdown עם חיפוש שמציג נכסים מהמערכת, בבחירה → מילוי אוטומטי של טקסט ותמונות
  - "פוסט חופשי" — כתיבה ידנית
- **בחירת פלטפורמה**: צ'קבוקסים — פייסבוק דף ✓ / אינסטגרם ✓ / קבוצות פייסבוק ✓
- **בחירת תבנית** (אופציונלי) — dropdown תבניות, בבחירה → מילוי אוטומטי
- **עורך טקסט** — textarea עם ספירת תווים (אינסטגרם: 2,200 מקסימום, פייסבוק: 63,206)
- **ניהול תמונות**: 
  - גרירה לשינוי סדר (drag & drop)
  - הוספה/מחיקה
  - תצוגה מקדימה מוקטנת
  - אינסטגרם: עד 10 תמונות (קרוסלה)
- **תצוגה מקדימה (Preview)**: 
  - הדמיה של איך הפוסט ייראה בפייסבוק ובאינסטגרם
  - כולל תמונות, טקסט, האשטגים
- **תזמון**: 
  - "פרסם עכשיו" — כפתור ראשי
  - "תזמן" — בחירת תאריך + שעה עם date/time picker
  - "שמור כטיוטא" — שמירה בלי פרסום
- **קבוצות פייסבוק**: אם סומנה קבוצה → מכין את התוכן + כפתור "העתק והדבק לקבוצה"

#### ג. לוח תזמונים והיסטוריה
- **טבלת פוסטים** עם עמודות: תצוגה מקדימה (תמונה ראשונה + טקסט מקוצר), פלטפורמה, סטטוס, תאריך תזמון/פרסום
- **סינון**: לפי פלטפורמה / סטטוס (draft/scheduled/published/failed)
- **פעולות לכל פוסט**:
  - טיוטא/מתוזמן → עריכה, מחיקה, ביטול תזמון
  - נכשל → שליחה מחדש, עריכה
  - פורסם → צפייה, קישור לפוסט ב-Meta
- **Badge צבעוני**: טיוטא (אפור), מתוזמן (כחול), פורסם (ירוק), נכשל (אדום), בתהליך (צהוב)

#### ד. ניהול קבוצות פייסבוק
- **טבלת קבוצות**: שם, קישור, קטגוריה, הערות, סטטוס (פעיל/לא פעיל)
- **הוספה/עריכה/מחיקה** של קבוצות
- **כפתור "הכן פוסט"** ליד כל קבוצה → פותח את יצירת הפוסט עם הקבוצה מסומנת

#### ה. ניהול תבניות פוסטים
- **רשימת תבניות** עם שם, פלטפורמה, סוג פוסט
- **יצירה/עריכה** עם:
  - שם תבנית
  - טקסט עם placeholders (כפתורי הוספת placeholder)
  - האשטגים ברירת מחדל
  - פלטפורמה (פייסבוק/אינסטגרם/שניהם)
- **תצוגה מקדימה** — מילוי התבנית עם נתוני נכס לדוגמה
- **תבניות מובנות (ברירת מחדל)** שייווצרו אוטומטית:
  - "דירה להשכרה — בסיסי"
  - "דירה למכירה — מפורט"
  - "פוסט כללי — שיווקי"

---

### סדר ביצוע (7 שלבים)

| # | מה | קבצים |
|---|-----|--------|
| 1 | Migration — 4 טבלאות + RLS + תבניות ברירת מחדל | SQL migration |
| 2 | Edge Function `social-publish` | `supabase/functions/social-publish/index.ts` |
| 3 | Edge Function `social-scheduler` | `supabase/functions/social-scheduler/index.ts` |
| 4 | UI — `SocialDashboard` + `SocialAccountSetup` (חיבור חשבון) | `src/components/social/SocialDashboard.tsx`, `SocialAccountSetup.tsx` |
| 5 | UI — `SocialPostComposer` (יצירת פוסט + מנוע תוכן אוטומטי) | `src/components/social/SocialPostComposer.tsx` |
| 6 | UI — `SocialPostsList` + `FacebookGroupsManager` + `SocialTemplatesManager` | `src/components/social/SocialPostsList.tsx`, `FacebookGroupsManager.tsx`, `SocialTemplatesManager.tsx` |
| 7 | Hook + עדכון MarketingHub + Cron job | `src/hooks/useSocialPosts.ts`, `src/pages/MarketingHub.tsx`, SQL insert for cron |

### קבצים — סיכום

| פעולה | קובץ |
|-------|------|
| Migration | טבלאות `social_accounts`, `social_posts`, `social_templates`, `social_facebook_groups` + RLS + default templates |
| חדש | `supabase/functions/social-publish/index.ts` |
| חדש | `supabase/functions/social-scheduler/index.ts` |
| חדש | `src/components/social/SocialDashboard.tsx` — קומפוננטת מעטפת עם תת-ניווט |
| חדש | `src/components/social/SocialAccountSetup.tsx` — הגדרת חשבון Meta + מדריך |
| חדש | `src/components/social/SocialPostComposer.tsx` — יצירת/עריכת פוסט + preview + מנוע תוכן אוטומטי |
| חדש | `src/components/social/SocialPostsList.tsx` — היסטוריה + מתוזמנים + סינון |
| חדש | `src/components/social/SocialTemplatesManager.tsx` — ניהול תבניות |
| חדש | `src/components/social/FacebookGroupsManager.tsx` — ניהול קבוצות |
| חדש | `src/hooks/useSocialPosts.ts` — CRUD hook לפוסטים, תבניות, קבוצות, חשבונות |
| עריכה | `src/pages/MarketingHub.tsx` — החלפת placeholder בטאב "פרסום" ב-`<SocialDashboard />` |

### מה ייחודי במערכת הזו

1. **הכל פנימי** — אין תלות ב-Buffer, Hootsuite, או שירותים בתשלום. רק Facebook Graph API ישיר
2. **מנוע תוכן אוטומטי** — בוחר נכס → מקבל פוסט מוכן עם תמונות, טקסט, והאשטגים
3. **Cross-post** — פוסט אחד מתפרסם גם בפייסבוק וגם באינסטגרם בלחיצה אחת
4. **קבוצות פייסבוק** — פתרון חצי-אוטומטי חכם שעוקף את מגבלות Meta (תוכן מוכן + פתיחת קבוצה)
5. **תזמון עצמי** — Cron כל 5 דקות, בלי שירות חיצוני
6. **Tokens בידי המשתמש** — נשמרים ב-DB, ניתנים לעדכון מהממשק, עם התרעת תפוגה

