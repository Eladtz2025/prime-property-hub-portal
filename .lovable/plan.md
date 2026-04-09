

## תיקונים בסיכון אפסי — שלושה שינויים בטוחים

### 1. הורדת Sentry Sample Rates (#4)
**קובץ:** `src/lib/sentry.ts`

שינוי 2 מספרים בלבד:
- `tracesSampleRate: 1.0` → `0.1` (10% במקום 100%)
- `replaysOnErrorSampleRate: 1.0` → `0.5` (50% במקום 100%)

חוסך עלויות Sentry ומפחית עומס ביצועים. `replaysSessionSampleRate: 0.1` נשאר כמו שהוא.

### 2. החלפת console.log ל-logger (#11)
**179 שימושים ב-12 קבצים** (לא כולל Edge Functions שרצים ב-Deno):

| קובץ | console.log |
|-------|-------------|
| `src/utils/pwa.ts` | 4 |
| `src/utils/notifyNewLead.ts` | 1 |
| `src/lib/sentry.ts` | 2 |
| `src/pages/PitchDeckBuilder.tsx` | 3 |
| `src/pages/ImportFromStorage.tsx` | 2 |
| `src/hooks/useTranslation.ts` | 1 |
| `src/lib/owner-portal.ts` | 4 |
| `src/components/PropertyDetailModal.tsx` | 1+ |
| ועוד... | |

ה-`logger` כבר קיים ב-`src/utils/logger.ts` ועובד רק ב-DEV. פשוט מחליפים `console.log` → `logger.info` ו-`console.error` → `logger.error`.

**לא נוגעים ב:**
- `scripts/processExcelToJSON.ts` (סקריפט build, לא runtime)
- `supabase/functions/*` (Deno, לא משתמש ב-logger)

### 3. שיפור React Query Cache (#20)
**קובץ:** `src/components/DataProvider.tsx`

שינוי ברירת המחדל:
- `staleTime: 2 * 60 * 1000` → `5 * 60 * 1000` (5 דקות)
- `gcTime: 5 * 60 * 1000` → `10 * 60 * 1000` (10 דקות)

מפחית שאילתות מיותרות לנתונים שלא משתנים מהר. כל hook ספציפי יכול לדרוס עם staleTime משלו.

---

### סיכום
- **3 שינויים**, כולם config/logging בלבד
- **0 שינויי לוגיקה** — שום דבר לא יכול להישבר
- Edge Functions לא נוגעים

