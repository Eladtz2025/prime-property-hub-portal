

## מערכת פרסום אוטומטי לרשתות חברתיות — הושלם ✅

### מה נבנה
- 4 טבלאות DB: `social_accounts`, `social_posts`, `social_templates`, `social_facebook_groups` + RLS
- Edge Function `social-publish` — פרסום לפייסבוק ואינסטגרם דרך Graph API v21.0
- Edge Function `social-scheduler` — Cron כל 5 דקות לתזמון אוטומטי
- UI מלא בטאב "פרסום" ב-MarketingHub:
  - הגדרת חשבון Meta עם מדריך מובנה
  - יצירת פוסט חדש (מנכס / חופשי) עם preview
  - היסטוריית פוסטים + סינון
  - ניהול קבוצות פייסבוק (חצי-אוטומטי)
  - ניהול תבניות עם placeholders
- 3 תבניות ברירת מחדל
- Cron job מוגדר

### קבצים
- `supabase/functions/social-publish/index.ts`
- `supabase/functions/social-scheduler/index.ts`
- `src/hooks/useSocialPosts.ts`
- `src/components/social/SocialDashboard.tsx`
- `src/components/social/SocialAccountSetup.tsx`
- `src/components/social/SocialPostComposer.tsx`
- `src/components/social/SocialPostsList.tsx`
- `src/components/social/FacebookGroupsManager.tsx`
- `src/components/social/SocialTemplatesManager.tsx`
- `src/pages/MarketingHub.tsx` (עדכון)
