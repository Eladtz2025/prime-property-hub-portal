

## Fix English Intake Form -- 3 Issues

### 1. Cities and Neighborhoods in Hebrew

**Problem:** The English form reuses `CitySelectorDropdown` and `NeighborhoodSelectorDropdown` which pull labels from `locations.ts` -- all in Hebrew. The dropdown display text is also Hebrew ("בחר ערים...", "בחר שכונות...").

**Solution:** Create English-specific versions of these dropdown components directly inside `ClientIntakePageEN.tsx`:
- Define `CITIES_EN` array mapping Hebrew values to English labels (e.g., `תל אביב יפו` -> `Tel Aviv`, `רמת גן` -> `Ramat Gan`, etc.)
- Define `NEIGHBORHOODS_EN` mapping Hebrew neighborhood values to English labels (e.g., `צפון_ישן` -> `Old North`, `נווה_צדק` -> `Neve Tzedek`, etc.)
- Create inline `CitySelectorEN` and `NeighborhoodSelectorEN` components that use these English labels
- The stored **values** remain Hebrew (for DB compatibility), only the **display labels** change

### 2. Remove "Flexible" Toggle from Pets

**Problem:** Pets is a binary field -- the tenant either has pets or doesn't. The "Flex" checkbox doesn't make sense here.

**Solution:**
- In `ClientIntakePageEN.tsx`: Remove the `pets_flexible` checkbox from the pets field. Keep just the "Pets" checkbox.
- In `ClientIntakePage.tsx`: Same change -- remove the flexibility toggle from the pets field.
- Remove `pets_flexible` from the schema and form state in both files (or just stop rendering it).

### 3. Page Not Adapted for English (LTR)

**Problem:** From the screenshot:
- Question mark appears on the wrong side ("?Looking for an Apartment")
- Text inputs are right-aligned (RTL inheritance)
- The overall page direction is RTL

**Solution:**
- Add `dir="ltr"` to the root `div` of the English page
- Fix the title: "Looking for an Apartment?" (question mark at end)
- Ensure all input placeholders and text flow left-to-right
- Add `text-left` classes where needed

### Technical Details

**Files to modify:**
- `src/pages/ClientIntakePageEN.tsx` -- All 3 fixes (English city/neighborhood selectors, remove pets flexible, LTR direction)
- `src/pages/ClientIntakePage.tsx` -- Remove pets flexible toggle only

**English City/Neighborhood Mapping (stored in ClientIntakePageEN.tsx):**

| Hebrew Value | English Label |
|---|---|
| תל אביב יפו | Tel Aviv |
| רמת גן | Ramat Gan |
| גבעתיים | Givatayim |
| הרצליה | Herzliya |
| רעננה | Ra'anana |
| פתח תקווה | Petah Tikva |
| ראשון לציון | Rishon LeZion |
| חולון | Holon |
| בת ים | Bat Yam |
| נתניה | Netanya |
| בני ברק | Bnei Brak |
| כפר סבא | Kfar Saba |
| הוד השרון | Hod HaSharon |
| רמת השרון | Ramat HaSharon |
| אשדוד | Ashdod |
| אשקלון | Ashkelon |

Key neighborhoods (Tel Aviv):
- צפון_ישן -> Old North
- צפון_חדש -> New North
- מרכז_העיר -> City Center
- פלורנטין -> Florentin
- נווה_צדק -> Neve Tzedek
- רוטשילד -> Rothschild
- כרם_התימנים -> Kerem HaTeimanim
- כיכר_המדינה -> Kikar HaMedina
- רמת_אביב -> Ramat Aviv
- יפו -> Jaffa
- (and all others)

