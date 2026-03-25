

## שדרוג הכרטיסים — שיפור קריאות ומינימליזם

### שינויים

**`src/components/DivisionCard.tsx` + `src/components/en/DivisionCard.tsx`:**

1. **הסרת שורת ה-description** (שורות 37-39) — מיותרת, הכרטיס כבר כולל features
2. **הגברת בהירות features** — `text-white/50` → `text-white/70` לקריאות טובה יותר
3. **הגדלת הכותרת** — `text-2xl md:text-3xl` → `text-3xl md:text-4xl` כדי שתבלוט יותר

**`src/index.css`:**

4. **חיזוק הגרדיאנט קלות** — `from-black/70` → `from-black/75` כדי שהטקסט ייקרא טוב על כל תמונה

**3 קבצים, ~5 שורות שינוי.**

