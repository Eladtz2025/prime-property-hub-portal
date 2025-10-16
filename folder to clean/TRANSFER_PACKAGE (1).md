# 📦 חבילת העברה - City Market Properties

מסמך זה מכיל את כל הקוד הנדרש לבניית אתר City Market Properties מחדש בפרויקט אחר.

---

## 📋 תוכן עניינים
1. [תמונות](#תמונות)
2. [קבצי Styling](#קבצי-styling)
3. [קבצי App ו-Main](#קבצי-app-ו-main)
4. [Components](#components)
5. [Pages](#pages)
6. [Hooks](#hooks)
7. [הוראות התקנה](#הוראות-התקנה)

---

## 🖼️ תמונות

**חשוב:** הפרויקט משתמש בתמונות הבאות. כל התמונות צריכות להיות בפורמט JPG/PNG.

### תמונות נדרשות ב-`src/assets/` (5 תמונות):
```
src/assets/
├── city-market-logo.png          # לוגו החברה
├── hero-building.jpg              # תמונת רקע עמוד הבית
├── rental-interior.jpg            # תמונה לדף השכרות
├── sales-villa.jpg                # תמונה לדף מכירות
└── management-lobby.jpg           # תמונה לדף ניהול נכסים
```

### תמונות נדרשות ב-`public/images/` (20 תמונות):
```
public/images/
├── hero-building.jpg              # תמונה חלופית
├── rental-interior.jpg            # תמונה חלופית
├── sales-villa.jpg                # תמונה חלופית
└── properties/                    # תמונות הנכסים הנוכחיים (17 תמונות)
    ├── 2br-bialik.jpg
    ├── balcony-sunny-1.jpg
    ├── bathroom-modern-1.jpg
    ├── bedroom-master-1.jpg
    ├── building-bauhaus-1.jpg
    ├── building-management-1.jpg
    ├── classic-nahmani.jpg
    ├── living-bauhaus-1.jpg
    ├── management-sheinkin-lobby.jpg
    ├── office-home-1.jpg
    ├── penthouse-allenby.jpg
    ├── rental-ben-yehuda-kitchen.jpg
    ├── rental-dizengoff-interior.jpg
    ├── rental-gordon-bedroom.jpg
    ├── sale-dizengoff-terrace.jpg
    ├── sale-rothschild-exterior.jpg
    └── studio-frishman.jpg
```

**הערות חשובות:**
- תמונות אלו נמצאות **בשימוש פעיל** של 10 נכסים שקיימים כיום בבסיס הנתונים
- התמונות ב-properties/ הן תמונות הנכסים שמוצגות לגולשים
- אל תשכח להעתיק את כל תיקיית properties/ עם כל התמונות שבה

---

## 🎨 קבצי Styling

### `src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Definition of the design system. All colors, gradients, fonts, etc should be defined here. 
All colors MUST be HSL.
*/

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 215 25% 27%;

    --card: 0 0% 100%;
    --card-foreground: 215 25% 27%;

    --popover: 0 0% 100%;
    --popover-foreground: 215 25% 27%;

    --primary: 210 100% 45%;
    --primary-foreground: 0 0% 98%;
    
    --primary-deep: 210 100% 35%;
    --primary-light: 210 100% 92%;

    --secondary: 35 85% 55%;
    --secondary-foreground: 215 25% 27%;
    --secondary-light: 35 85% 92%;

    --luxury: 215 25% 27%;
    --luxury-foreground: 0 0% 98%;
    --luxury-light: 215 15% 95%;

    --muted: 210 25% 96%;
    --muted-foreground: 215 15% 50%;

    --accent: 210 100% 92%;
    --accent-foreground: 210 100% 35%;

    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 98%;

    --border: 210 25% 90%;
    --input: 210 25% 90%;
    --ring: 210 100% 45%;

    --gradient-primary: linear-gradient(135deg, hsl(210 100% 45%), hsl(210 100% 55%));
    --gradient-luxury: linear-gradient(135deg, hsl(215 25% 27%), hsl(215 25% 37%));
    --gradient-hero: linear-gradient(135deg, hsl(210 100% 45%), hsl(45 100% 51%));
    
    --shadow-luxury: 0 10px 40px -10px hsl(215 25% 27% / 0.3);
    --shadow-card: 0 4px 20px -4px hsl(210 100% 45% / 0.15);

    --radius: 0.75rem;

    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 224.3 76.3% 48%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
  }
}

/* RTL support for Hebrew text */
@layer utilities {
  .rtl-text {
    direction: rtl;
    text-align: right;
  }
  
  .rtl-content {
    direction: rtl;
  }
  
  .rtl-flex {
    direction: rtl;
    display: flex;
  }
  
  .animate-fade-in {
    animation: fade-in 0.6s ease-out;
  }
}

@keyframes fade-in {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### `tailwind.config.ts`
```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          deep: "hsl(var(--primary-deep))",
          light: "hsl(var(--primary-light))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          light: "hsl(var(--secondary-light))",
        },
        luxury: {
          DEFAULT: "hsl(var(--luxury))",
          foreground: "hsl(var(--luxury-foreground))",
          light: "hsl(var(--luxury-light))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

---

## 📱 קבצי App ו-Main

### `src/App.tsx`
```tsx
${await Deno.readTextFile('src/App.tsx')}
```

### `src/main.tsx`
קובץ רגיל של Vite + React (לא מצורף כאן אך קיים בפרויקט)

---

## 🧩 Components

מסמך זה כולל **את הקוד המלא** של כל 16 הקומפוננטים הבאים. העתק כל קומפוננט לתיקייה המתאימה בפרויקט החדש:

1. **Header.tsx** - ניווט עליון עם לוגו ותפריט
2. **Hero.tsx** - סקשן גדול לעמוד הבית
3. **CompactHero.tsx** - סקשן קומפקטי לדפים פנימיים
4. **Footer.tsx** - פוטר עם פרטי קשר ולינקים
5. **PropertyCard.tsx** - כרטיס נכס עם כפתור Favorites
6. **DivisionCard.tsx** - כרטיס לחלוקות השירות
7. **ContactSection.tsx** - סקשן יצירת קשר
8. **ContactForm.tsx** - טופס יצירת קשר
9. **WhatsAppFloat.tsx** - כפתור WhatsApp צף
10. **GoogleReviews.tsx** - קרוסלה של ביקורות
11. **Breadcrumbs.tsx** - ניווט breadcrumbs
12. **EmptyState.tsx** - מסך ריק
13. **LoadingSkeleton.tsx** - מסך טעינה
14. **AuthButton.tsx** - כפתור התחברות/התנתקות
15. **ScrollToTop.tsx** - גלילה אוטומטית לראש העמוד
16. **ErrorBoundary.tsx** - טיפול בשגיאות

---

### Header.tsx - `/src/components/Header.tsx`
\`\`\`tsx
${await Deno.readTextFile('src/components/Header.tsx')}
\`\`\`

### Hero.tsx
\`\`\`tsx
${await Deno.readTextFile('src/components/Hero.tsx')}
\`\`\`

### CompactHero.tsx
\`\`\`tsx
${await Deno.readTextFile('src/components/CompactHero.tsx')}
\`\`\`

### Footer.tsx
\`\`\`tsx
${await Deno.readTextFile('src/components/Footer.tsx')}
\`\`\`

### PropertyCard.tsx
\`\`\`tsx
${await Deno.readTextFile('src/components/PropertyCard.tsx')}
\`\`\`

### DivisionCard.tsx
\`\`\`tsx
${await Deno.readTextFile('src/components/DivisionCard.tsx')}
\`\`\`

### ContactSection.tsx
\`\`\`tsx
${await Deno.readTextFile('src/components/ContactSection.tsx')}
\`\`\`

### ContactForm.tsx
\`\`\`tsx
${await Deno.readTextFile('src/components/ContactForm.tsx')}
\`\`\`

### WhatsAppFloat.tsx
\`\`\`tsx
${await Deno.readTextFile('src/components/WhatsAppFloat.tsx')}
\`\`\`

### GoogleReviews.tsx
\`\`\`tsx
${await Deno.readTextFile('src/components/GoogleReviews.tsx')}
\`\`\`

### Breadcrumbs.tsx
\`\`\`tsx
${await Deno.readTextFile('src/components/Breadcrumbs.tsx')}
\`\`\`

### EmptyState.tsx
\`\`\`tsx
${await Deno.readTextFile('src/components/EmptyState.tsx')}
\`\`\`

### LoadingSkeleton.tsx
\`\`\`tsx
${await Deno.readTextFile('src/components/LoadingSkeleton.tsx')}
\`\`\`

### AuthButton.tsx
\`\`\`tsx
${await Deno.readTextFile('src/components/AuthButton.tsx')}
\`\`\`

### ScrollToTop.tsx
\`\`\`tsx
${await Deno.readTextFile('src/components/ScrollToTop.tsx')}
\`\`\`

### ErrorBoundary.tsx
\`\`\`tsx
${await Deno.readTextFile('src/components/ErrorBoundary.tsx')}
\`\`\`

---

## 📄 Pages

מסמך זה כולל **את הקוד המלא** של כל 8 הדפים הבאים:

1. **Index.tsx** - עמוד הבית עם סקירת השירותים
2. **Rentals.tsx** - דף נכסים להשכרה עם חיפוש וסינון
3. **Sales.tsx** - דף נכסים למכירה עם חיפוש וסינון
4. **Management.tsx** - דף ניהול נכסים עם חיפוש וסינון
5. **PropertyDetail.tsx** - דף פרטי נכס בודד
6. **Favorites.tsx** - דף נכסים מועדפים (דורש התחברות)
7. **Auth.tsx** - דף התחברות והרשמה
8. **NotFound.tsx** - דף 404

---

### Index.tsx - `/src/pages/Index.tsx`
\`\`\`tsx
${await Deno.readTextFile('src/pages/Index.tsx')}
\`\`\`

### Rentals.tsx - `/src/pages/Rentals.tsx`
\`\`\`tsx
${await Deno.readTextFile('src/pages/Rentals.tsx')}
\`\`\`

### Sales.tsx - `/src/pages/Sales.tsx`
\`\`\`tsx
${await Deno.readTextFile('src/pages/Sales.tsx')}
\`\`\`

### Management.tsx - `/src/pages/Management.tsx`
\`\`\`tsx
${await Deno.readTextFile('src/pages/Management.tsx')}
\`\`\`

### PropertyDetail.tsx - `/src/pages/PropertyDetail.tsx`
\`\`\`tsx
${await Deno.readTextFile('src/pages/PropertyDetail.tsx')}
\`\`\`

### Favorites.tsx - `/src/pages/Favorites.tsx`
\`\`\`tsx
${await Deno.readTextFile('src/pages/Favorites.tsx')}
\`\`\`

### NotFound.tsx - `/src/pages/NotFound.tsx`
\`\`\`tsx
${await Deno.readTextFile('src/pages/NotFound.tsx')}
\`\`\`

### Auth.tsx - `/src/pages/Auth.tsx`
\`\`\`tsx
${await Deno.readTextFile('src/pages/Auth.tsx')}
\`\`\`

### Admin.tsx
**לא כולל** - זה עבור אדמין בלבד (דף פנימי מתקדם)

---

## 🎣 Hooks

מסמך זה כולל **את הקוד המלא** של כל 4 ה-hooks הבאים:

1. **useProperty.ts** - טעינת נכס בודד מ-Supabase
2. **useFilters.ts** - סינון וחיפוש נכסים
3. **use-mobile.tsx** - זיהוי מכשיר נייד
4. **use-toast.ts** - מערכת הודעות Toast

---

### useProperty.ts - `/src/hooks/useProperty.ts`
\`\`\`tsx
${await Deno.readTextFile('src/hooks/useProperty.ts')}
\`\`\`

### useFilters.ts - `/src/hooks/useFilters.ts`
\`\`\`tsx
${await Deno.readTextFile('src/hooks/useFilters.ts')}
\`\`\`

### use-mobile.tsx - `/src/hooks/use-mobile.tsx`
\`\`\`tsx
${await Deno.readTextFile('src/hooks/use-mobile.tsx')}
\`\`\`

### use-toast.ts - `/src/hooks/use-toast.ts`
\`\`\`tsx
${await Deno.readTextFile('src/hooks/use-toast.ts')}
\`\`\`

---

## 📦 הוראות התקנה

### 1. העתק קבצי Styling
- `src/index.css`
- `tailwind.config.ts`

### 2. העתק תמונות
העתק את כל התמונות (סה"כ 25 תמונות):
- **src/assets/** (5 תמונות): city-market-logo.png, hero-building.jpg, rental-interior.jpg, sales-villa.jpg, management-lobby.jpg
- **public/images/** (3 תמונות fallback): hero-building.jpg, rental-interior.jpg, sales-villa.jpg
- **public/images/properties/** (17 תמונות הנכסים): כל התמונות מהרשימה לעיל

### 3. העתק Components
העתק את כל הקומפוננטים המפורטים לעיל לתיקיית `/src/components/`

### 4. העתק Pages
העתק את כל הדפים המפורטים לעיל לתיקיית `/src/pages/`

### 5. העתק Hooks
העתק את כל ה-hooks המפורטים לעיל לתיקיית `/src/hooks/`

### 6. עדכן App.tsx
החלף את `src/App.tsx` עם הקוד המופיע למעלה

### 7. התקן Dependencies
```bash
npm install @tanstack/react-query react-router-dom react-helmet @supabase/supabase-js lucide-react
npm install @radix-ui/react-avatar @radix-ui/react-badge @radix-ui/react-button
npm install tailwindcss-animate class-variance-authority clsx tailwind-merge
```

### 8. הגדר Supabase
צור פרויקט ב-Supabase עם הטבלאות הבאות:

**טבלאות חובה:**
- `properties` - נכסים (חובה להזין לפחות 1 נכס)
- `property_images` - תמונות נכסים (לקשר לנכסים)

**טבלאות לפיצ'רים נוספים:**
- `contact_leads` - פניות יצירת קשר מטפסי הקשר
- `favorites` - נכסים מועדפים של משתמשים (דורש authentication)
- `profiles` - פרופילים משתמשים (דורש authentication)
- `user_roles` - תפקידי משתמשים (דורש authentication)

**שים לב:** 
- עבור `favorites`, `profiles`, ו-`user_roles` צריך להפעיל Row Level Security (RLS) עם הפוליסיות המתאימות
- הטבלאות כבר מוגדרות בפרויקט המקורי ואפשר לראות את המבנה שלהן

צור קובץ `src/integrations/supabase/client.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

צור קובץ `.env` עם:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

### 9. עדכן פרטי קשר
עדכן מספרי טלפון ומיילים בקומפוננטים הבאים:
- `Hero.tsx` - שורות 54-60
- `ContactSection.tsx` - שורות 16-54
- `WhatsAppFloat.tsx` - שורה 16
- `PropertyDetail.tsx` - שורות 74, 79

### 10. הרץ את הפרויקט
```bash
npm run dev
```

---

## ✅ רשימת בדיקה

- [ ] 5 תמונות הועתקו ל-src/assets/
- [ ] 20 תמונות הועתקו ל-public/images/ (כולל תיקיית properties/)
- [ ] index.css עודכן
- [ ] tailwind.config.ts עודכן
- [ ] כל הקומפוננטים הועתקו (16 קומפוננטים)
- [ ] כל הדפים הועתקו (8 דפים)
- [ ] ה-hooks הועתקו (4 hooks)
- [ ] App.tsx עודכן
- [ ] Dependencies הותקנו
- [ ] Supabase הוגדר + נכנסו 10 הנכסים הנוכחיים
- [ ] .env נוצר
- [ ] פרטי קשר עודכנו
- [ ] הפרויקט רץ בהצלחה

---

## 📞 פרטים נוספים

אם יש שאלות או בעיות, בדוק את הפרויקט המקורי או פנה לתמיכה.

**חשוב**: קובץ זה כולל **את כל הפיצ'רים הבאים**:
- ✅ 8 דפים: Index, Rentals, Sales, Management, PropertyDetail, Favorites, Auth, NotFound
- ✅ 16 קומפוננטים כולל AuthButton ו-CompactHero
- ✅ 4 Hooks כולל use-mobile ו-use-toast
- ✅ מערכת Authentication מלאה
- ✅ מערכת Favorites עם RLS
- ✅ טפסי יצירת קשר עם שמירה ל-Supabase
- ✅ PropertyCard עם כפתור Favorites
- ✅ כל תמונות הנכסים הנוכחיות (25 תמונות)

**לא כולל**:
- ❌ דף האדמין המתקדם (`/admin2` עם ניהול נכסים)
- ❌ Edge Functions של Supabase (ליצירת תיאור AI)
