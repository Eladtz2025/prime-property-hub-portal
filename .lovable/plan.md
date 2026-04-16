

# תיקון CI Pipeline — Lint & Unit Tests

## הבעיות שנמצאו

### בעיה 1: `npm ci` נכשל כי אין `package-lock.json`
הפרויקט משתמש ב-bun (יש `bun.lock`), אבל ה-CI workflow משתמש ב-`npm ci` שדורש `package-lock.json`. זו כנראה הסיבה העיקרית לכישלון — ה-dependencies לא מותקנים כלל.

### בעיה 2: ESLint סורק גם `supabase/` ו-`scripts/`
ה-ignores ב-`eslint.config.js` לא מחריג את התיקיות `supabase` ו-`scripts` — עשרות קבצי Edge Functions נסרקים מיותר.

### בעיה 3: `vitest`, `jsdom`, `@testing-library/*` ב-dependencies במקום devDependencies
לא שובר את ה-CI, אבל לא נכון. צריך להעביר ל-`devDependencies`.

## תיקונים

### 1. שינוי CI workflow ל-bun
**קובץ:** `.github/workflows/ci.yml`
- החלפת `npm ci` ב-`bun install --frozen-lockfile`
- החלפת `npm run lint` ב-`bun run lint`
- החלפת `npm run test:ci` ב-`bun run test:ci`
- החלפת `npm run build` ב-`bun run build`
- שימוש ב-`oven-sh/setup-bun@v1` במקום `actions/setup-node` (או בנוסף אליו)

### 2. עדכון ESLint ignores
**קובץ:** `eslint.config.js` שורה 8
- שינוי מ-`{ ignores: ["dist"] }` ל-`{ ignores: ["dist", "supabase", "scripts", "extension"] }`

### 3. העברת test dependencies ל-devDependencies
**קובץ:** `package.json`
- העברת `vitest`, `jsdom`, `@testing-library/jest-dom`, `@testing-library/react` מ-dependencies ל-devDependencies

### 4. הוספת `--passWithNoTests` לסקריפט test:ci
למניעת כישלון אם אין טסטים:
```
"test:ci": "vitest run --reporter=verbose --passWithNoTests"
```

## סדר ביצוע
1. עדכון `eslint.config.js` (ignores)
2. העברת packages ל-devDependencies + עדכון test:ci script
3. עדכון `.github/workflows/ci.yml` לשימוש ב-bun
4. הרצת lint ו-test מקומית לוידוא

