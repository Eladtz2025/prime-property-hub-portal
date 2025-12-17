import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Support both single text and batch translation
    const { text, texts, targetLanguage = 'en', context = '' } = body;

    // Single text translation mode (bidirectional)
    if (text) {
      if (!text.trim()) {
        return new Response(
          JSON.stringify({ translatedText: '' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const isToEnglish = targetLanguage === 'en';
      const prompt = isToEnglish 
        ? `Translate this Hebrew ${context} to English. Return ONLY the translated text, nothing else:\n\n${text}`
        : `Translate this English ${context} to Hebrew. Return ONLY the translated text, nothing else:\n\n${text}`;

      const systemPrompt = isToEnglish
        ? "You are a professional Hebrew to English translator for Israeli real estate listings. Keep translations natural and professional."
        : "You are a professional English to Hebrew translator for Israeli real estate listings. Keep translations natural and professional.";

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        return new Response(
          JSON.stringify({ error: "Translation service error" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      const translatedText = data.choices[0]?.message?.content?.trim() || '';

      return new Response(
        JSON.stringify({ translatedText }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Batch translation mode (Hebrew to English only, for backward compatibility)
    const textsToTranslate = (texts || []).filter((t: string) => t && t.trim());
    if (textsToTranslate.length === 0) {
      return new Response(
        JSON.stringify({ translations: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `Translate the following Hebrew texts to English. Return ONLY a JSON array of strings with the translations in the same order, nothing else.

Texts to translate:
${textsToTranslate.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n')}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a professional Hebrew to English translator. Return only valid JSON arrays."
          },
          {
            role: "user",
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Translation service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const translatedText = data.choices[0]?.message?.content || "[]";
    
    // Clean up markdown code blocks if present
    let cleanedText = translatedText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    
    // Try to parse the JSON response
    let translations: string[];
    try {
      translations = JSON.parse(cleanedText.trim());
    } catch (error) {
      // If JSON parsing fails, return original texts
      console.error("Failed to parse translations:", cleanedText, error);
      translations = textsToTranslate;
    }

    return new Response(
      JSON.stringify({ translations }),
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
