

## 4 שינויים בהדר ובקוביות

### 1. העברת 👋 לאחרי השם — `src/components/EnhancedTopNavigation.tsx`
שורה 67: שינוי מ-`👋 שלום ${firstName}` ל-`שלום ${firstName} 👋` כך שהטקסט "שלום אלעד" מיושר עם התאריך מתחתיו, והיד בצד השני.

### 2. טאבים לא פעילים בלבן — `src/components/EnhancedTopNavigation.tsx`
שורה 135: שינוי הטאבים הלא-פעילים מ-`text-primary-foreground/70` ל-`text-primary-foreground` (לבן מלא גם כשלא עומדים עליהם).

### 3. קוביות טפסים עם backdrop-blur — `src/components/DashboardFormsCubes.tsx`
שורה 110: שינוי `cubeBase` מ-`bg-muted` ל-`bg-white/10 backdrop-blur-md border border-white/20 shadow-lg text-foreground hover:bg-white/20`. אפקט זכוכית מטושטשת כמו כפתור השפה באתר.

**הערה**: כדי שאפקט ה-blur יעבוד, צריך רקע עם צבע/תמונה מאחורי הקוביות. אם הרקע לבן חלק, ה-blur לא ייראה. אפשר להוסיף gradient רקע עדין לאזור הטפסים, או להשתמש בגרסה עם `bg-gray-100/80 backdrop-blur-sm border border-gray-200/50` שנראית טוב גם על רקע לבן.

### 4. כפתור "הוסף" באותו סגנון — זיהוי הכפתור
לפי הקוד, כפתור "הוסף נכס" נמצא ב-`AdminDashboard.tsx` (מועבר דרך `onAddProperty`). אשנה אותו לאותו סגנון glassmorphism/muted כמו הקוביות.

### קבצים לעריכה
- `src/components/EnhancedTopNavigation.tsx` — שורות 67, 135
- `src/components/DashboardFormsCubes.tsx` — שורה 110
- כפתור ההוסף (צריך לזהות בדיוק איפה הוא מופיע בדשבורד)

