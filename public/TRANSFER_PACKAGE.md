# 📦 חבילת העברה - City Market Properties

## 📋 תוכן עניינים
1. [רשימת תמונות](#רשימת-תמונות)
2. [קבצי Styling](#קבצי-styling)
3. [קבצי Components](#קבצי-components)
4. [קבצי Pages](#קבצי-pages)
5. [קבצי Hooks](#קבצי-hooks)

---

## 🖼️ רשימת תמונות

כל התמונות הבאות נמצאות ב:
- `public/images/` (לנכסים)
- `src/assets/` (לוגו ותמונות עיקריות)

### תמונות עיקריות (src/assets/)
```
src/assets/
├── city-market-logo.png          # לוגו החברה (שקוף)
├── city-market-logo-transparent.png
├── hero-building.jpg              # תמונת רקע ראשית
├── rental-interior.jpg            # תמונה להשכרות
├── sales-villa.jpg                # תמונה למכירות
└── management-lobby.jpg           # תמונה לניהול נכסים
```

### תמונות נכסים (public/images/)
```
public/images/
├── hero-building.jpg
├── management-lobby.jpg
├── rental-interior.jpg
├── sales-villa.jpg
└── properties/
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

---

## 🎨 קבצי Styling

### src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

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

### tailwind.config.ts
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

## 📄 קבצי Pages

כל הקבצים הבאים נמצאים בתיקיית `src/pages/`

ראה את הקבצים הבאים שכבר קיימים בפרויקט:
- `src/pages/Index.tsx` - עמוד הבית
- `src/pages/Rentals.tsx` - דף השכרות
- `src/pages/Sales.tsx` - דף מכירות
- `src/pages/Management.tsx` - דף ניהול נכסים
- `src/pages/PropertyDetail.tsx` - דף פרטי נכס
- `src/pages/Auth.tsx` - דף התחברות/הרשמה
- `src/pages/NotFound.tsx` - דף 404

---

## 🧩 קבצי Components

כל הקבצים הבאים נמצאים בתיקיית `src/components/`

### Components עיקריים:
1. **Header.tsx** - כותרת האתר עם ניווט
2. **Footer.tsx** - פוטר האתר
3. **Hero.tsx** - קומפוננט hero עבור עמוד הבית
4. **CompactHero.tsx** - hero מקוצר לדפים פנימיים
5. **PropertyCard.tsx** - כרטיס נכס
6. **DivisionCard.tsx** - כרטיס חטיבה
7. **ContactSection.tsx** - סקציית יצירת קשר
8. **ContactForm.tsx** - טופס יצירת קשר
9. **GoogleReviews.tsx** - ביקורות Google
10. **WhatsAppFloat.tsx** - כפתור WhatsApp צף
11. **Breadcrumbs.tsx** - ניווט breadcrumbs
12. **EmptyState.tsx** - מצב ריק
13. **LoadingSkeleton.tsx** - skeleton לטעינה
14. **ErrorBoundary.tsx** - טיפול בשגיאות
15. **ScrollToTop.tsx** - גלילה לראש הדף

### רכיבי UI (src/components/ui/):
- button.tsx
- card.tsx
- badge.tsx
- input.tsx
- textarea.tsx
- label.tsx
- separator.tsx
- skeleton.tsx
- toast.tsx
- select.tsx
- dialog.tsx
- alert.tsx
- avatar.tsx
- aspect-ratio.tsx
- checkbox.tsx
- collapsible.tsx
- progress.tsx

---

## 🎣 קבצי Hooks

כל הקבצים הבאים נמצאים בתיקיית `src/hooks/`

1. **useProperty.ts** - טעינת נכס בודד
2. **useFilters.ts** - סינון נכסים
3. **use-toast.ts** - toast notifications

---

## 📝 הוראות העברה

### שלב 1: העתק תמונות
1. העתק את תיקיית `public/images/` כולה
2. העתק את התמונות מ-`src/assets/`:
   - city-market-logo.png
   - hero-building.jpg
   - rental-interior.jpg
   - sales-villa.jpg
   - management-lobby.jpg

### שלב 2: העתק קבצי Styling
1. החלף את `src/index.css`
2. החלף את `tailwind.config.ts`

### שלב 3: העתק Components
1. העתק את כל הקומפוננטים מ-`src/components/`
2. ודא שכל רכיבי ה-UI מ-`src/components/ui/` קיימים

### שלב 4: העתק Pages
1. העתק את כל הדפים מ-`src/pages/`:
   - Index.tsx
   - Rentals.tsx
   - Sales.tsx
   - Management.tsx
   - PropertyDetail.tsx
   - Auth.tsx (רק אם צריך)
   - NotFound.tsx

### שלב 5: העתק Hooks
1. העתק את `src/hooks/useProperty.ts`
2. העתק את `src/hooks/useFilters.ts`

### שלב 6: עדכן App.tsx
עדכן את הניתוב ב-`src/App.tsx` בהתאם למסמך ההוראות הראשי.

---

## ⚙️ פרטי קשר לעדכון

עדכן את פרטי הקשר במקומות הבאים:

1. **Header.tsx** - סושיאל מדיה:
   - Instagram: `https://www.instagram.com/citymarket/`
   - Facebook: `https://www.facebook.com/Ctmarket`

2. **Hero.tsx** - פרטי קשר:
   - טלפון: `054-550-3055`
   - מייל: `eladtz@gmail.com`

3. **ContactSection.tsx** - פרטי קשר:
   - טלפון: `050-722-2221`
   - מייל: `info@citymarket.co.il`
   - WhatsApp: `972507222221`

4. **WhatsAppFloat.tsx** - WhatsApp:
   - מספר: `972545503055`

5. **Footer.tsx** - פרטי רגל:
   - Instagram: `https://www.instagram.com/citymarket/`
   - Facebook: `https://www.facebook.com/Ctmarket`

---

## ✅ רשימת בדיקה

לפני העברה:
- [ ] כל התמונות הועתקו
- [ ] index.css עודכן
- [ ] tailwind.config.ts עודכן
- [ ] כל הקומפוננטים הועתקו
- [ ] כל הדפים הועתקו
- [ ] ה-hooks הועתקו
- [ ] App.tsx עודכן עם הניתוב הנכון
- [ ] פרטי הקשר עודכנו
- [ ] הבדיקה בדפדפן עברה בהצלחה

---

## 📞 תמיכה

אם יש שאלות או בעיות, עיין במסמך ההוראות המקורי: `BUILDING_INSTRUCTIONS.md`
