

## שינוי צבע "Since 2008" + אנימציית תפריט עדינה

### שינוי 1 — צבע "Since 2008" בעברית

**`src/components/he/VideoHero.tsx` שורה 77:**
- שינוי `color: 'hsl(38, 60%, 45%)'` ל-`color: '#ffffff'`

### שינוי 2 — אנימציית פתיחה עדינה לתפריט (שתי השפות)

כרגע התפריט מופיע/נעלם בצורה חדה (`{menuOpen && ...}`). נוסיף transition עדין:
- במקום render מותנה, ה-overlay תמיד מרונדר אבל עם `opacity-0 pointer-events-none` כשסגור ו-`opacity-100` כשפתוח
- הוספת `transition-opacity duration-500 ease-in-out`
- פריטי הניווט יקבלו `translate-y` קטן שמתאפס בפתיחה (slide-up עדין)

**`src/components/en/Header.tsx`** + **`src/components/he/Header.tsx`:**
- שינוי ה-overlay מ-conditional render ל-always-render עם classes דינמיים
- הוספת transition classes

**3 קבצים, ~10 שורות שינוי.**

