
# ✅ תיקון: לוגיקת בדיקת זמינות — טקסט ספציפי בלבד (v4.0)

## מה תוקן

הלוגיקה הישנה (HEAD redirects, HTTP 404, property indicators) סימנה ~2,011 נכסים כלא אקטיביים בטעות.

## הלוגיקה החדשה

Firecrawl בלבד → חיפוש טקסט ספציפי בלבד:
- **יד2:** "חיפשנו בכל מקום אבל אין לנו עמוד כזה" / "העמוד שחיפשת הוסר"
- **מדל"ן:** "המודעה הוסרה"
- **הומלס:** "נראה שעסקה זו כבר נסגרה"

אין HEAD check, אין redirect check, אין property indicators.

## בוצע
- [x] עדכון `_shared/availability-indicators.ts` — רק 4 טקסטים ספציפיים
- [x] שכתוב `check-property-availability/index.ts` — Firecrawl-only, v4.0
- [x] איפוס ~2,011 נכסים שסומנו בטעות (head_redirect_away, http_404, etc.)
- [x] בדיקה על 5 נכסים אקטיביים — כולם content_ok ✅
- [x] אימות 2 נכסים שסומנו listing_removed_indicator — באמת הוסרו ✅
