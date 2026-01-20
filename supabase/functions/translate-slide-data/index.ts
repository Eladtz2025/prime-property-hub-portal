import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slideId, slideData, slideType } = await req.json();
    
    if (!slideId || !slideData) {
      throw new Error("Missing slideId or slideData");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create translation prompt based on slide type
    const translationPrompt = `You are a professional Hebrew translator for a real estate pitch deck.
Translate ALL text values in the following JSON from English to Hebrew.
Keep the JSON structure exactly the same - only translate the text values.
Do not translate property names/keys.
For real estate terms, use professional Hebrew terminology.
Return ONLY the translated JSON, no explanations.

JSON to translate:
${JSON.stringify(slideData, null, 2)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { 
            role: "system", 
            content: "You are a professional translator. Return only valid JSON, no markdown, no explanations." 
          },
          { role: "user", content: translationPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const translatedContent = aiResponse.choices?.[0]?.message?.content;

    if (!translatedContent) {
      throw new Error("No translation received from AI");
    }

    // Parse the translated JSON
    let translatedData;
    try {
      // Remove any markdown code blocks if present
      let cleanContent = translatedContent.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      translatedData = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("Failed to parse translated JSON:", translatedContent);
      throw new Error("Invalid JSON in translation response");
    }

    // Save to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: updateError } = await supabase
      .from("pitch_deck_slides")
      .update({ slide_data_he: translatedData })
      .eq("id", slideId);

    if (updateError) {
      console.error("Failed to save translation:", updateError);
      throw new Error("Failed to save translation to database");
    }

    console.log(`Successfully translated slide ${slideId} (${slideType})`);

    return new Response(
      JSON.stringify({ success: true, slideId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Translation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
