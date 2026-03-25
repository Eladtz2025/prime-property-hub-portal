

## שדרוג כרטיסי חטיבות — מינימליסטי נקי ופרימיום

### הכיוון
הפחתת עומס ויזואלי — פחות טקסט, יותר מרווח, gradient רך יותר, טיפוגרפיה מעודנת.

### שינויים

**`src/components/DivisionCard.tsx` (עברית):**
1. **הפחתת overlay** — gradient רך יותר: `from-black/70 via-black/20 to-transparent` (במקום 90/40)
2. **הסרת הנקודות מה-features** — רק טקסט נקי, spacing גדול יותר
3. **כותרת serif** — `font-playfair` במקום ה-class הנוכחי, גודל גדול יותר
4. **הסרת "למד עוד"** — הכרטיס כולו לחיץ, מיותר
5. **הסרת ה-hover line** — מיותר בגישה מינימליסטית
6. **אייקון קטן יותר** — border דק יותר, פחות בולט
7. **תיאור קצר יותר** — `text-white/60` במקום `text-white/80`

**`src/components/en/DivisionCard.tsx` (אנגלית):**
אותם שינויים בדיוק, בהתאמה ל-LTR.

**`src/index.css`:**
עדכון `.reliz-card-overlay` — gradient רך יותר, hover עדין יותר.

**3 קבצים, ~20 שורות שינוי.**

