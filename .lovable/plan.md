

## עדכון Hero — הסרת subtitle, שינוי שנה, ואנגלית נקייה

### שינויים

**1. עברית — `src/components/he/VideoHero.tsx`:**
- הסרת שורת ה-subtitle (שורה 53-55) — "מומחיות מקומית. שירות אישי. תהליך ברור."
- שינוי "Since 2016" ל-"Since 2008" (שורה 81)

**2. אנגלית — `src/components/en/VideoHero.tsx`:**
- הסרת שורת ה-subtitle (שורה 61-63) — "Local expertise. Personal service. Clear process."
- שינוי "Since 2016" ל-"Since 2008" (שורה 81)

**3. דפי Index — הסרת prop `subtitle`:**
- `src/pages/Index.tsx` שורה 131: הסרת `subtitle="מומחיות מקומית..."` מ-VideoHero
- `src/pages/en/Index.tsx` שורה 121: הסרת `subtitle="Local expertise..."` מ-VideoHero
- `src/pages/TestHeroPage.tsx`: הסרת subtitle

**4. Interface — הפיכת subtitle לאופציונלי:**
- בשני ה-VideoHero: `subtitle?: string` (כבר אופציונלי או שינוי קל)

**5 קבצים, שינויים קטנים בכל אחד.**

