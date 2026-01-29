import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// These are the deleted properties from the migration
// 12 empty "רחוב" properties + 22 duplicates

// The 22 deleted duplicate addresses (we'll find matching records in the Excel data)
const DELETED_DUPLICATE_ADDRESSES = [
  "דיזנגוף 173",
  "נורדאו",
  "הירקון 313",
  "בן יהודה 200",
  "בן יהודה 248",
  "ברנר 8",
  "הורקנוס 1",
  "הירקון 282",
  "זלטופולסקי 19",
  "נורדאו 47",
  "צידון 14",
  "רמב\"ם 5",
  "אוסישקין 62",
  "שדרות היוצר 5",
  "אוסישקין 96",
  "בן יהודה 139"
];

// Data extracted from the Excel that matches the deleted properties
const PROPERTIES_TO_RESTORE = [
  // Duplicates that were deleted (from the Excel file)
  { address: "דיזנגוף 173", owner_name: "שרון", owner_phone: "0526882202", rooms: null, monthly_rent: null },
  { address: "דיזנגוף 173", owner_name: "שרון", owner_phone: "0526882202", rooms: null, monthly_rent: null },
  { address: "דיזנגוף 173", owner_name: "שרון", owner_phone: "0526882202", rooms: null, monthly_rent: null },
  { address: "נורדאו", owner_name: "ויוי", owner_phone: "0522739135", rooms: null, monthly_rent: null },
  { address: "נורדאו", owner_name: "דורית", owner_phone: "0505923041", rooms: null, monthly_rent: null },
  { address: "הירקון 313", owner_name: "יצחק", owner_phone: "0523313122", rooms: null, monthly_rent: null },
  { address: "הירקון 313", owner_name: "רונן", owner_phone: "0522539310", rooms: null, monthly_rent: null },
  { address: "בן יהודה 200א", owner_name: "אילנה", owner_phone: "0507313578", rooms: 3, monthly_rent: 6500 },
  { address: "בן יהודה 248", owner_name: null, owner_phone: null, rooms: null, monthly_rent: null },
  { address: "ברנר 8", owner_name: null, owner_phone: null, rooms: null, monthly_rent: null },
  { address: "הורקנוס 1", owner_name: "ראובן", owner_phone: "0547719000", rooms: 2, monthly_rent: 6200 },
  { address: "הירקון 282", owner_name: "טלי", owner_phone: "0506302575", rooms: null, monthly_rent: null },
  { address: "זלטופולסקי 19", owner_name: null, owner_phone: null, rooms: null, monthly_rent: null },
  { address: "נורדאו 47", owner_name: "אורית", owner_phone: "0544808246", rooms: null, monthly_rent: null },
  { address: "נורדאו 47", owner_name: "ג'ינה", owner_phone: "0558960375", rooms: null, monthly_rent: null },
  { address: "צידון 14", owner_name: "רחלי", owner_phone: "0544247191", rooms: null, monthly_rent: null },
  { address: "רמב\"ם 5", owner_name: "מאיר", owner_phone: "0523634709", rooms: 1, monthly_rent: 3800 },
  { address: "רמב\"ם 5", owner_name: "משה", owner_phone: "0586677975", rooms: 1, monthly_rent: 3500 },
  { address: "רמב\"ם 5", owner_name: "משה", owner_phone: "0586677975", rooms: 3.5, monthly_rent: 6700 },
  { address: "שדרות היוצר 5", owner_name: "זאב", owner_phone: "0523579295", rooms: 2, monthly_rent: 5000 },
  { address: "שדרות היוצר 5", owner_name: "אמנון", owner_phone: "0522525060", rooms: 2, monthly_rent: 5950 },
  { address: "אוסישקין 96", owner_name: "פרדי", owner_phone: "0544614730", rooms: null, monthly_rent: null },
  { address: "בן יהודה 139", owner_name: "שלמה", owner_phone: "0522584874", rooms: 3, monthly_rent: 6150 },
  // 12 empty "רחוב" properties
  { address: "רחוב", owner_name: "שם בעל דירה", owner_phone: null, rooms: null, monthly_rent: null },
  { address: "רחוב", owner_name: "שם בעל דירה", owner_phone: null, rooms: null, monthly_rent: null },
  { address: "רחוב", owner_name: "שם בעל דירה", owner_phone: null, rooms: null, monthly_rent: null },
  { address: "רחוב", owner_name: "שם בעל דירה", owner_phone: null, rooms: null, monthly_rent: null },
  { address: "רחוב", owner_name: "שם בעל דירה", owner_phone: null, rooms: null, monthly_rent: null },
  { address: "רחוב", owner_name: "שם בעל דירה", owner_phone: null, rooms: null, monthly_rent: null },
  { address: "רחוב", owner_name: "שם בעל דירה", owner_phone: null, rooms: null, monthly_rent: null },
  { address: "רחוב", owner_name: "שם בעל דירה", owner_phone: null, rooms: null, monthly_rent: null },
  { address: "רחוב", owner_name: "שם בעל דירה", owner_phone: null, rooms: null, monthly_rent: null },
  { address: "רחוב", owner_name: "שם בעל דירה", owner_phone: null, rooms: null, monthly_rent: null },
  { address: "רחוב", owner_name: "שם בעל דירה", owner_phone: null, rooms: null, monthly_rent: null },
  { address: "רחוב", owner_name: "שם בעל דירה", owner_phone: null, rooms: null, monthly_rent: null },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`🔄 Starting restoration of ${PROPERTIES_TO_RESTORE.length} deleted properties...`);

    const stats = {
      total: PROPERTIES_TO_RESTORE.length,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Insert each property
    for (const prop of PROPERTIES_TO_RESTORE) {
      try {
        const { error } = await supabase.from("properties").insert({
          address: prop.address,
          owner_name: prop.owner_name,
          owner_phone: prop.owner_phone,
          rooms: prop.rooms,
          monthly_rent: prop.monthly_rent,
          city: "תל אביב-יפו",
          property_type: "rental",
          status: "unknown",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        if (error) {
          console.error(`❌ Error inserting ${prop.address}:`, error);
          stats.failed++;
          stats.errors.push(`${prop.address}: ${error.message}`);
        } else {
          stats.successful++;
        }
      } catch (err) {
        console.error(`❌ Exception for ${prop.address}:`, err);
        stats.failed++;
        stats.errors.push(`${prop.address}: ${err.message}`);
      }
    }

    console.log(`✅ Restoration complete:`, stats);

    return new Response(
      JSON.stringify({
        success: true,
        message: `שוחזרו ${stats.successful} נכסים בהצלחה`,
        stats
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error in restoration:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
