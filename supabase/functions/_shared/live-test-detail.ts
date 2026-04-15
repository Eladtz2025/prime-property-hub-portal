import { fetchHomelessDetailFeatures } from "./homeless-detail-parser.ts";

const urls = [
  "https://www.homeless.co.il/rent/viewad,738837.aspx",
  "https://www.homeless.co.il/rent/viewad,738698.aspx",
  "https://www.homeless.co.il/rent/viewad,738597.aspx",
  "https://www.homeless.co.il/sale/viewad,258727.aspx",
  "https://www.homeless.co.il/sale/viewad,258729.aspx",
];

for (const url of urls) {
  console.log(`\n========== ${url} ==========`);
  const result = await fetchHomelessDetailFeatures(url);
  if (result) {
    console.log("Features:", JSON.stringify(result.features, null, 2));
    console.log("Size:", result.size ?? "N/A");
    console.log("Floor:", result.floor ?? "N/A");
    console.log("Total Floors:", result.totalFloors ?? "N/A");
  } else {
    console.log("❌ FAILED to fetch/parse");
  }
}
