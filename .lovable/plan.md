
# עדכון ההירו לסגנון SUNLESS אלגנטי

## הבעיות הנוכחיות (למה זה לא דומה)
1. **כותרת "CITY MARKET" כבדה מדי** - משתמשת ב-`font-bold` במקום `font-normal`/`font-light`, וה-letter-spacing קצר מדי
2. **צללי טקסט אגרסיביים מדי** - ב-SUNLESS אין כמעט צל, הכל עדין
3. **"REAL ESTATE BOUTIQUE" לא מספיק מרווח** - צריך tracking רחב יותר כמו "DESIGN YOUR LIGHT"
4. **הכפתורים שונים** - בסאנלס הכפתור השמאלי (השכרה) הוא חם/כהה חצי-שקוף, והימני (קנייה) לבן נקי
5. **"Since 2016"** צריך להיות יותר עדין - קטן יותר ודק יותר

## שינויים בקובץ `src/components/he/NewHeroTest.tsx`

### כותרת ראשית "CITY MARKET"
- שינוי מ-`font-bold` ל-`font-normal`
- הגדלת letter-spacing: הוספת `tracking-[0.3em]` או `tracking-[0.25em]`
- הקטנת/הסרת text-shadow - מ-`0 2px 12px rgba(0,0,0,0.35)` ל-`0 1px 4px rgba(0,0,0,0.15)` או הסרה מוחלטת

### טקסט עליון "REAL ESTATE BOUTIQUE"
- הגדלת tracking מ-`tracking-[0.45em]` ל-`tracking-[0.55em]`
- הקטנת text-shadow

### תת-כותרת בעברית
- הקטנת text-shadow לעדין יותר

### "Since 2016"
- הקטנת ה-opacity והצל

### כפתורים
- כפתור שמאלי (השכרה): שינוי מרקע לבן ל-`bg-black/20 backdrop-blur-md border border-white/30 text-white` - חם וחצי-שקוף כמו בסאנלס
- כפתור ימני (קנייה): `bg-white text-black` נקי בלי border כמעט - כמו "Shop Online" בסאנלס

### צללי טקסט כלליים
- הורדה דרסטית של כל ה-text-shadows לרמה מינימלית או הסרה מוחלטת

## סיכום
השינוי המרכזי הוא להפוך את הכל ל**דק, אוורירי ואלגנטי** - פחות bold, יותר letter-spacing, פחות צללים, כפתורים עדינים יותר.
