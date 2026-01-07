const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SeoData {
  url: string;
  title: string;
  titleLength: number;
  description: string;
  descriptionLength: number;
  h1Count: number;
  h1Contents: string[];
  imagesWithoutAlt: number;
  totalImages: number;
  hasOpenGraph: boolean;
  hasCanonical: boolean;
  hasViewport: boolean;
  hasHtmlLang: boolean;
  hasStructuredData: boolean;
  issues: { severity: string; message: string }[];
  recommendations: string[];
  aiCrawlers: { name: string; allowed: boolean }[];
  keywordAnalysis: {
    keywords: { word: string; count: number; density: number }[];
    inTitle: string[];
    inH1: string[];
    inDescription: string[];
    missing: string[];
  };
  schemaAnalysis: {
    hasJsonLd: boolean;
    schemas: { type: string; valid: boolean }[];
    hasOrganization: boolean;
    hasWebSite: boolean;
    hasBreadcrumb: boolean;
  };
  score: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { seoData, pageName } = await req.json() as { seoData: SeoData; pageName: string };

    if (!seoData) {
      return new Response(
        JSON.stringify({ success: false, error: 'SEO data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Analyzing SEO with AI for: ${pageName} (${seoData.url})`);

    const prompt = `אתה מומחה SEO. נתח את הנתונים הבאים ותן המלצות מפורטות בעברית.

נתוני SEO לדף "${pageName}" (${seoData.url}):

📊 ציון נוכחי: ${seoData.score}/100

📝 תוכן:
- כותרת: "${seoData.title}" (${seoData.titleLength} תווים)
- תיאור: "${seoData.description}" (${seoData.descriptionLength} תווים)
- כותרות H1: ${seoData.h1Count} (${seoData.h1Contents.join(', ')})

🖼️ תמונות:
- סה"כ: ${seoData.totalImages}
- ללא Alt: ${seoData.imagesWithoutAlt}

✅ בדיקות:
- Open Graph: ${seoData.hasOpenGraph ? 'יש' : 'חסר'}
- Canonical: ${seoData.hasCanonical ? 'יש' : 'חסר'}
- Viewport: ${seoData.hasViewport ? 'יש' : 'חסר'}
- HTML Lang: ${seoData.hasHtmlLang ? 'יש' : 'חסר'}
- Structured Data: ${seoData.hasStructuredData ? 'יש' : 'חסר'}

🔑 מילות מפתח מובילות:
${seoData.keywordAnalysis.keywords.slice(0, 5).map(k => `- ${k.word}: ${k.count} פעמים (${k.density}%)`).join('\n')}

מילות מפתח חסרות ב-Title/H1/Description:
${seoData.keywordAnalysis.missing.slice(0, 5).join(', ') || 'אין'}

📐 Schema.org:
- JSON-LD: ${seoData.schemaAnalysis.hasJsonLd ? 'יש' : 'חסר'}
- Organization: ${seoData.schemaAnalysis.hasOrganization ? 'יש' : 'חסר'}
- WebSite: ${seoData.schemaAnalysis.hasWebSite ? 'יש' : 'חסר'}
- Breadcrumb: ${seoData.schemaAnalysis.hasBreadcrumb ? 'יש' : 'חסר'}
- סוגי Schema שנמצאו: ${seoData.schemaAnalysis.schemas.map(s => s.type).join(', ') || 'אין'}

🤖 AI Crawlers:
${seoData.aiCrawlers.map(c => `- ${c.name}: ${c.allowed ? 'מותר' : 'חסום'}`).join('\n')}

בעיות שנמצאו:
${seoData.issues.map(i => `- [${i.severity}] ${i.message}`).join('\n')}

בהתבסס על הנתונים, תן לי:
1. ציון כללי מחושב (0-100) עם הסבר קצר
2. רשימה של עד 5 בעיות קריטיות לתיקון מיידי
3. רשימה של עד 5 בעיות בינוניות (אזהרות)
4. רשימה של עד 3 המלצות לשיפור נוסף
5. פרומפט מוכן להדבקה ב-Lovable AI לתיקון כל הבעיות (כולל קוד לדוגמה)

החזר את התשובה בפורמט JSON הבא:
{
  "overallScore": number,
  "scoreExplanation": "string",
  "criticalIssues": [{"issue": "string", "fix": "string"}],
  "warnings": [{"issue": "string", "fix": "string"}],
  "recommendations": ["string"],
  "fixPrompt": "string"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'אתה מומחה SEO ישראלי. תמיד עונה בעברית. מחזיר תשובות בפורמט JSON בלבד ללא markdown.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';
    
    // Try to parse JSON from the response
    let analysis;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Return a fallback response
      analysis = {
        overallScore: seoData.score,
        scoreExplanation: 'לא הצלחנו לנתח את התוצאות עם AI',
        criticalIssues: seoData.issues.filter(i => i.severity === 'critical').map(i => ({ issue: i.message, fix: '' })),
        warnings: seoData.issues.filter(i => i.severity === 'warning').map(i => ({ issue: i.message, fix: '' })),
        recommendations: seoData.recommendations,
        fixPrompt: generateFallbackPrompt(seoData, pageName),
      };
    }

    console.log(`AI analysis completed for ${pageName}`);

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('SEO AI analysis error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateFallbackPrompt(seoData: SeoData, pageName: string): string {
  const criticalIssues = seoData.issues.filter(i => i.severity === 'critical');
  const warnings = seoData.issues.filter(i => i.severity === 'warning');
  
  let prompt = `תקן את בעיות ה-SEO בדף "${pageName}" (${seoData.url}):\n\n`;
  
  if (criticalIssues.length > 0) {
    prompt += `🔴 בעיות קריטיות:\n`;
    criticalIssues.forEach((issue, i) => {
      prompt += `${i + 1}. ${issue.message}\n`;
    });
    prompt += '\n';
  }
  
  if (warnings.length > 0) {
    prompt += `🟡 אזהרות:\n`;
    warnings.forEach((issue, i) => {
      prompt += `${i + 1}. ${issue.message}\n`;
    });
    prompt += '\n';
  }
  
  if (seoData.recommendations.length > 0) {
    prompt += `📝 פעולות נדרשות:\n`;
    seoData.recommendations.forEach(rec => {
      prompt += `- ${rec}\n`;
    });
  }
  
  return prompt;
}
