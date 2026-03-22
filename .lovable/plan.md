

## הסרת שליחת WhatsApp אוטומטית מההתאמות — לחלוטין

### מה יוסר

כל הלוגיקה שקשורה לשליחת WhatsApp אוטומטית ללקוחות כחלק מתהליך ההתאמות. ההתאמות עצמן ימשיכו לעבוד כרגיל — רק בשבילך. שאר מערכת ה-WhatsApp (שליחה ידנית, בתפזורת, תבניות) לא תיפגע.

### שינויים

**1. `supabase/functions/match-batch/index.ts`**
- הסרת import של `buildWhatsAppMessage`, `cleanPhoneNumber`
- הסרת env vars: `greenApiInstance`, `greenApiToken`
- הסרת param `send_whatsapp` מה-destructuring
- הסרת `totalWhatsAppSent` ושימושיו
- הסרת בלוק שליחת WhatsApp (שורות 197-232)
- הסרת עדכון WhatsApp count ב-scout_runs (שורות 272-288)
- הסרת `whatsapp_sent` מה-response

**2. `supabase/functions/trigger-matching/index.ts`**
- הסרת `sendWhatsapp` (שורה 167)
- הסרת `send_whatsapp: sendWhatsapp` מה-body שנשלח ל-batch (שורה 321)

**3. `supabase/functions/_shared/matching.ts`**
- הסרת הפונקציה `buildWhatsAppMessage` (לא בשימוש יותר)

**4. `supabase/functions/_shared/settings.ts`**
- הסרת `auto_send_whatsapp` מהממשק ומה-defaults

**5. `src/hooks/useScoutSettings.ts`**
- הסרת `auto_send_whatsapp` מהטיפוס ומה-defaults

**6. קבצי Frontend** — הסרת `send_whatsapp` מכל הקריאות (כבר לא רלוונטי):
- `src/components/scout/ScoutedPropertiesTable.tsx` — שורה 963
- `src/components/scout/ScoutedPropertiesTable.tsx` — שורה 982
- `src/pages/AdminCustomers.tsx` — שורות 109, 133
- `src/components/scout/UnifiedScoutSettings.tsx` — שורה 521
- `src/components/scout/ChecksDashboard.tsx` — שורה 365
- `src/components/ExpandableCustomerRow.tsx` — שורה 289
- `src/components/customers/CustomerMatchesCell.tsx` — שורה 118

**7. Deploy**: `match-batch`, `trigger-matching`

### מה לא נפגע
- `whatsapp-send` (שליחה ידנית) ✅
- `WhatsAppSendDialog` / `WhatsAppBulkSendDialog` ✅
- `whatsapp-webhook` (קבלת הודעות) ✅
- `notify-new-lead` (התראה על ליד חדש) ✅
- תבניות הודעות ✅

