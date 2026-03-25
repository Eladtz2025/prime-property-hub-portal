

## עמוד Insights — כתבות, בעלי מקצוע ומדריכים (HE + EN)

### מה נבנה
עמוד ציבורי חדש בשם **"Insights"** (עברית: "תובנות") שמרכז 3 סוגי תוכן: כתבות/בלוג, קישור לבעלי מקצוע, ומדריכים מעשיים. העמוד יהיה זמין בשתי השפות (`/he/insights` ו-`/en/insights`) ויתאים לעיצוב הלוקסורי הקיים.

---

### מבנה טכני

**1. טבלת Supabase חדשה: `insights`**

| עמודה | סוג | תיאור |
|-------|------|--------|
| id | uuid PK | |
| type | text | `article` / `guide` |
| title_he | text | כותרת בעברית |
| title_en | text | כותרת באנגלית |
| summary_he | text | תקציר בעברית |
| summary_en | text | תקציר באנגלית |
| content_he | text | תוכן מלא בעברית |
| content_en | text | תוכן מלא באנגלית |
| image_url | text | תמונה ראשית |
| category | text | קטגוריה (נדל"ן, השקעות, טיפים...) |
| is_published | boolean | מפורסם או טיוטה |
| published_at | timestamptz | תאריך פרסום |
| sort_order | int | סדר תצוגה |
| created_by | uuid | FK to auth.users |
| created_at / updated_at | timestamptz | |

RLS: קריאה ציבורית (ללא אימות) עבור `is_published = true`. כתיבה רק ל-admin/manager.

**2. קבצים חדשים**

| קובץ | תיאור |
|-------|--------|
| `src/pages/he/Insights.tsx` | עמוד עברי — Hero + 3 סקשנים (כתבות, מדריכים, בעלי מקצוע) |
| `src/pages/en/Insights.tsx` | עמוד אנגלי — אותו מבנה, שפה אנגלית |
| `src/pages/he/InsightDetail.tsx` | עמוד כתבה/מדריך בודד (עברית) |
| `src/pages/en/InsightDetail.tsx` | עמוד כתבה/מדריך בודד (אנגלית) |

**3. עדכון ניתוב (`App.tsx`)**
- `/he/insights` → HebrewInsights
- `/he/insights/:id` → HebrewInsightDetail
- `/en/insights` → EnglishInsights
- `/en/insights/:id` → EnglishInsightDetail
- Redirect `/insights` → `/he/insights`

**4. עדכון ניווט**
- `src/components/he/Header.tsx` — הוסף "Insights" לתפריט (בין "שכונות" ל"קצת עלינו")
- `src/components/en/Header.tsx` — הוסף "Insights" לתפריט
- `src/components/he/Footer.tsx` — הוסף קישור לסקשן "שירותים"
- `src/components/en/Footer.tsx` — אותו דבר

**5. מבנה העמוד**

```text
┌─────────────────────────────────┐
│         Hero Section            │
│   "Insights" / "תובנות"        │
│   תיאור קצר                    │
├─────────────────────────────────┤
│  📰 כתבות אחרונות              │
│  [Card] [Card] [Card]           │
├─────────────────────────────────┤
│  📖 מדריכים                    │
│  [Card] [Card] [Card]           │
├─────────────────────────────────┤
│  👷 בעלי מקצוע מומלצים         │
│  CTA → /professionals/shared    │
├─────────────────────────────────┤
│         Footer                  │
└─────────────────────────────────┘
```

- סקשן בעלי מקצוע יהיה CTA עם עיצוב יוקרתי שמפנה לעמוד הקיים (`/professionals/shared` או `/professionals/shared/en`)
- כרטיסי כתבות/מדריכים יציגו תמונה, כותרת, תקציר וקטגוריה
- לחיצה על כרטיס תוביל לעמוד הפרטי (`/he/insights/:id`)

**6. SEO**
- Helmet עם title/description
- HreflangMeta (he ↔ en)
- BreadcrumbSchema + OrganizationSchema

---

### מה לא נוגעים בו
- עמוד בעלי מקצוע הקיים — רק מקשרים אליו
- אדמין CRUD לכתבות — שלב עתידי (בשלב הראשון נוסיף תוכן דרך Supabase ישירות)
- לוגיקה עסקית קיימת

