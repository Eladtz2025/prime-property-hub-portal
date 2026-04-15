import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parseHomelessDetailHtml } from "./homeless-detail-parser.ts";

Deno.test("parses features with on/off classes correctly", () => {
  const html = `
    <html><body>
      <div class="IconOption on">מרפסת: 1</div>
      <div class="IconOption off">מעלית</div>
      <div class="IconOption on">חניה משותפת</div>
      <div class="IconOption off">ממד</div>
      <div class="IconOption off">מחסן</div>
      <div class="IconOption off">משופצת</div>
      <div class="IconOption on">חיות מחמד</div>
      <div class="IconOption on">ריהוט</div>
      <div class="IconOption on">מזגן</div>
      <div class="IconOption off">נגישות</div>
      <div>שטח: 55 מ"ר</div>
      <div>קומה: 3 מתוך 5</div>
    </body></html>
  `;
  const result = parseHomelessDetailHtml(html);
  assertEquals(result.features.balcony, true);
  assertEquals(result.features.elevator, false);
  assertEquals(result.features.parking, true);
  assertEquals(result.features.mamad, false);
  assertEquals(result.features.storage, false);
  assertEquals(result.features.renovated, false);
  assertEquals(result.features.pets, true);
  assertEquals(result.features.furnished, true);
  assertEquals(result.features.aircon, true);
  assertEquals(result.features.accessible, false);
  assertEquals(result.size, 55);
  assertEquals(result.floor, 3);
  assertEquals(result.totalFloors, 5);
});

Deno.test("parking negative patterns: חניה ציבורית = false", () => {
  const html = `<html><body>
    <div class="IconOption on">חניה ציבורית</div>
  </body></html>`;
  const result = parseHomelessDetailHtml(html);
  assertEquals(result.features.parking, false);
});

Deno.test("parking negative patterns: חניה: אין = false even with on class", () => {
  const html = `<html><body>
    <div class="IconOption on">חניה: אין</div>
  </body></html>`;
  const result = parseHomelessDetailHtml(html);
  assertEquals(result.features.parking, false);
});

Deno.test("parking negative patterns: חניה ברחוב = false", () => {
  const html = `<html><body>
    <div class="IconOption on">חניה ברחוב</div>
  </body></html>`;
  const result = parseHomelessDetailHtml(html);
  assertEquals(result.features.parking, false);
});

Deno.test("parking off class = false regardless of text", () => {
  const html = `<html><body>
    <div class="IconOption off">חניה</div>
  </body></html>`;
  const result = parseHomelessDetailHtml(html);
  assertEquals(result.features.parking, false);
});

Deno.test("ignores divs without on/off class", () => {
  const html = `<html><body>
    <div class="IconOption">מרפסת</div>
    <div class="IconOption on">מעלית</div>
  </body></html>`;
  const result = parseHomelessDetailHtml(html);
  assertEquals(result.features.balcony, undefined);
  assertEquals(result.features.elevator, true);
});

Deno.test("empty HTML returns empty features", () => {
  const html = `<html><body><div>no features</div></body></html>`;
  const result = parseHomelessDetailHtml(html);
  assertEquals(Object.keys(result.features).length, 0);
  assertEquals(result.size, undefined);
  assertEquals(result.floor, undefined);
});
