
# שיפור הגדרות Jina לסריקת Yad2 ומדלן

## הבעיה
Yad2 נחסם (תוכן קצר ~300 תווים) ומדלן עבדה חלקית. ההגדרות הנוכחיות לא מתאימות -- חסר `X-Locale`, יש פרוקסי לא קיים, וה-timeouts לא אופטימליים.

## שינויים

### 1. `supabase/functions/_shared/scraping-jina.ts`
- הוספת `X-Locale: he-IL` (כמו שעובד בבדיקת זמינות)
- הוספת `X-With-Generated-Alt: false` (חוסך זמן עיבוד)
- שינוי `X-Timeout` מ-35 ל-30 שניות
- שינוי timeout כללי מ-50s ל-45s
- הסרת לוגיקת `JINA_PROXY_URL` (הסוד לא קיים)

### 2. `supabase/functions/scout-yad2-jina/index.ts`
- `MAX_RETRIES`: 2 -> 1 (ריטראי לא עוזר נגד חסימות)
- `PAGE_DELAY_MS`: 15000 -> 10000

### 3. `supabase/functions/scout-madlan-jina/index.ts`
- `NEXT_PAGE_DELAY`: 8000 -> 10000 (השהיה ארוכה יותר למניעת rate limiting)

## בדיקה
אחרי הפריסה, אפעיל קונפיגורציה אחת מ-Yad2 ואחת ממדלן ואוודא בלוגים שהתוכן חוזר תקין.
