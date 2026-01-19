import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Validate request body exists
    const contentLength = req.headers.get('content-length');
    if (!contentLength || contentLength === '0') {
      console.error('Empty request body received');
      return new Response(
        JSON.stringify({ error: 'Request body is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { type, prompt, image, mask, enhancementType, removalDescription, stagingMode, roomType, style, customDescription } = body;

    if (!type) {
      console.error('Missing required field: type');
      return new Response(
        JSON.stringify({ error: 'Missing required field: type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${type} request`);

    let messages: any[] = [];

    if (type === 'generate') {
      // Text to image generation
      messages = [
        {
          role: "user",
          content: prompt
        }
      ];
    } else if (type === 'enhance') {
      // Image enhancement
      const enhancementPrompts: Record<string, string> = {
        lighting: "Enhance this real estate photo by improving the lighting and colors. Make it brighter, more vibrant, and professionally lit. Keep everything else the same.",
        declutter: "Clean up this real estate photo by removing any clutter, mess, or distracting items. Keep the furniture and main features but remove small items, cables, and disorder.",
        staging: "Add virtual staging to this empty room. Add appropriate furniture and decor that would appeal to home buyers. Make it look cozy and inviting while keeping the original architecture.",
        general: "Enhance this real estate photo to look more professional and appealing. Improve lighting, colors, and make it look more inviting for potential buyers."
      };

      messages = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: enhancementPrompts[enhancementType] || enhancementPrompts.general
            },
            {
              type: "image_url",
              image_url: {
                url: image
              }
            }
          ]
        }
      ];
    } else if (type === 'inpaint') {
      // Element removal (inpainting)
      // Build prompt based on whether user provided description
      let inpaintPrompt = "Remove the objects marked in white on the mask from the image. Fill in the removed areas naturally with background that matches the surrounding area. Keep the rest of the image exactly the same.";
      
      if (removalDescription && removalDescription.trim()) {
        inpaintPrompt = `Remove the following from the image: ${removalDescription.trim()}. The areas to remove are marked in white on the mask. Fill in the removed areas naturally with background that matches the surrounding area. Keep the rest of the image exactly the same.`;
        console.log('Using user-provided removal description:', removalDescription);
      }
      
      messages = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: inpaintPrompt
            },
            {
              type: "image_url",
              image_url: {
                url: image
              }
            },
            {
              type: "image_url",
              image_url: {
                url: mask
              }
            }
          ]
        }
      ];
    } else if (type === 'staging') {
      // Virtual staging - add or replace furniture
      let stagingPrompt = '';
      
      if (stagingMode === 'add') {
        stagingPrompt = `Add ${style} style furniture to this empty ${roomType}. Make it look like a professionally staged home for real estate photography. The furniture should be high quality and appropriate for the room size and layout.`;
      } else {
        stagingPrompt = `Replace the existing furniture in this ${roomType} with ${style} style furniture. Keep the room layout and architecture the same, but update all furniture and decor to match the ${style} aesthetic. Make it look like a professionally staged home.`;
      }
      
      if (customDescription && customDescription.trim()) {
        stagingPrompt += ` Specifically include: ${customDescription.trim()}.`;
        console.log('Using custom furniture description:', customDescription);
      }
      
      stagingPrompt += ' Ensure the result looks realistic and naturally lit.';
      
      console.log('Staging prompt:', stagingPrompt);
      
      messages = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: stagingPrompt
            },
            {
              type: "image_url",
              image_url: {
                url: image
              }
            }
          ]
        }
      ];
    } else {
      throw new Error(`Unknown operation type: ${type}`);
    }

    console.log('Calling Lovable AI Gateway for image operation');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages,
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'נגמרו הבקשות הזמינות. אנא נסה שוב מאוחר יותר.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'נדרש לטעון קרדיטים. אנא הוסף קרדיטים ל-Lovable AI.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI Gateway response received');

    // Extract image from response
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageData) {
      console.error('No image in response:', JSON.stringify(data));
      throw new Error('No image was generated');
    }

    console.log('Image generated successfully');

    return new Response(
      JSON.stringify({ 
        imageUrl: imageData,
        message: data.choices?.[0]?.message?.content || 'Image processed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-property-image:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
