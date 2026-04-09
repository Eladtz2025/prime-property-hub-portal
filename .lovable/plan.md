

## החלפת פרטי טלי לאלעד — בכל האתר

### סיכום
החלפת מספר הטלפון 054-228-4477 (972542284477) והשם "טלי זילברברג" / "Tali Silberberg" בכל המקומות הציבוריים באתר לאלעד צברי / 054-550-3055 (972545503055).

### חריג חשוב — `business.ts`
הקובץ `src/constants/business.ts` משמש לטפסי תיווך רשמיים (חוזי בלעדיות, הצעות מחיר) עם מספר רישיון של טלי. **יש להחליט**: האם גם שם להחליף לפרטים שלך, או להשאיר את טלי כברוקר רשמי בטפסים?

### קבצים שמשתנים (16 קבצים)

| קובץ | שינוי |
|-------|-------|
| `src/constants/business.ts` | טלפון + שם (אם מאושר) |
| `src/components/ContactSection.tsx` | 054-228-4477 → 054-550-3055 |
| `src/components/Footer.tsx` | tel + תצוגה |
| `src/components/he/Footer.tsx` | tel + תצוגה |
| `src/components/en/Header.tsx` | tel + "Tali:" → "Elad:" |
| `src/components/WhatsAppFloat.tsx` | 972542284477 → 972545503055 |
| `src/pages/he/Contact.tsx` | טלפון + meta description |
| `src/pages/PriceOfferView.tsx` | whatsapp number |
| `src/pages/en/PropertyDetail.tsx` | fallback phone |
| `src/components/pitch-deck/slides/DynamicContactSlide.tsx` | default phone + whatsapp |
| `src/components/pitch-deck/slides/DynamicAboutUsSlide.tsx` | Tali defaults |
| `src/components/price-offer/pitch/slides/NextStepsSlide.tsx` | default whatsapp |
| `src/components/price-offer/ben-yehuda-110/slides/BYContactSlide.tsx` | שם |
| `src/components/price-offer/ben-yehuda-110/slides/BYAboutUsSlide.tsx` | שם |
| `src/lib/presentation-exclusivity-translations.ts` | שם סוכן HE+EN |
| `src/lib/presentation-exclusivity-pdf-generator.ts` | שם בחתימה |
| `supabase/functions/notify-new-lead/index.ts` | טלפון להתראות |
| `src/types/pitch-deck.ts` | default team member |

### מה לא משתנה
- `phoneFormatter.ts` — רק דוגמאות בקומנטים, לא משפיע
- `assign-properties-to-agents` — הקצאה פנימית, לא ציבורי
- UI components, DB, matching logic

