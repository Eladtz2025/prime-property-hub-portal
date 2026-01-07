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

interface PageSeoData {
  pageName: string;
  seoData: SeoData;
}

interface TopicPrompt {
  title: string;
  icon: string;
  issueCount: number;
  affectedPages: string[];
  prompt: string;
}

interface ConsolidatedPrompts {
  basicSeo: TopicPrompt;
  schema: TopicPrompt;
  aiCrawlers: TopicPrompt;
  keywords: TopicPrompt;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Support both single page and all pages analysis
    const allPagesData: PageSeoData[] = body.allPagesData || 
      (body.seoData ? [{ pageName: body.pageName, seoData: body.seoData }] : []);

    if (allPagesData.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'SEO data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Analyzing SEO with AI for ${allPagesData.length} pages`);

    // Generate consolidated prompts by topic
    const consolidatedPrompts = generateConsolidatedPrompts(allPagesData);
    
    // Calculate overall statistics
    const totalIssues = {
      critical: allPagesData.reduce((acc, p) => 
        acc + p.seoData.issues.filter(i => i.severity === 'critical').length, 0),
      warning: allPagesData.reduce((acc, p) => 
        acc + p.seoData.issues.filter(i => i.severity === 'warning').length, 0),
      info: allPagesData.reduce((acc, p) => 
        acc + p.seoData.issues.filter(i => i.severity === 'info').length, 0),
    };

    const averageScore = Math.round(
      allPagesData.reduce((acc, p) => acc + p.seoData.score, 0) / allPagesData.length
    );

    // Use AI to enhance the analysis
    const prompt = buildAiPrompt(allPagesData, consolidatedPrompts, totalIssues, averageScore);

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
    
    let aiEnhancement;
    try {
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      aiEnhancement = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      aiEnhancement = {
        overallScore: averageScore,
        scoreExplanation: 'לא הצלחנו לנתח את התוצאות עם AI',
        priorityOrder: ['basicSeo', 'schema', 'keywords', 'aiCrawlers'],
      };
    }

    console.log(`AI analysis completed for ${allPagesData.length} pages`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis: {
          overallScore: aiEnhancement.overallScore || averageScore,
          scoreExplanation: aiEnhancement.scoreExplanation || '',
          totalIssues,
          pagesAnalyzed: allPagesData.length,
          consolidatedPrompts,
          priorityOrder: aiEnhancement.priorityOrder || ['basicSeo', 'schema', 'keywords', 'aiCrawlers'],
        }
      }),
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

function generateConsolidatedPrompts(allPagesData: PageSeoData[]): ConsolidatedPrompts {
  // Basic SEO issues
  const basicSeoIssues: { page: string; url: string; issues: string[]; severity: 'critical' | 'warning' }[] = [];
  // Schema issues
  const schemaIssues: { page: string; url: string; issues: string[] }[] = [];
  // AI Crawlers issues
  const aiCrawlersIssues: { page: string; url: string; issues: string[] }[] = [];
  // Keywords issues
  const keywordsIssues: { page: string; url: string; issues: string[] }[] = [];

  for (const { pageName, seoData } of allPagesData) {
    const pageIssues: string[] = [];
    const pageSchemaIssues: string[] = [];
    const pageAiIssues: string[] = [];
    const pageKeywordIssues: string[] = [];

    // Basic SEO checks
    if (!seoData.title || seoData.titleLength < 30) {
      pageIssues.push(`Title קצר מדי (${seoData.titleLength} תווים) - הארך ל-50-60 תווים`);
    }
    if (seoData.titleLength > 60) {
      pageIssues.push(`Title ארוך מדי (${seoData.titleLength} תווים) - קצר ל-60 תווים`);
    }
    if (!seoData.description || seoData.descriptionLength < 120) {
      pageIssues.push(`Description קצר מדי (${seoData.descriptionLength} תווים) - הארך ל-150-160 תווים`);
    }
    if (seoData.h1Count === 0) {
      pageIssues.push(`חסר H1 - הוסף כותרת ראשית אחת`);
    }
    if (seoData.h1Count > 1) {
      pageIssues.push(`יש ${seoData.h1Count} כותרות H1 - צריך רק אחת`);
    }
    if (!seoData.hasCanonical) {
      pageIssues.push(`חסר Canonical URL - הוסף <link rel="canonical">`);
    }
    if (!seoData.hasOpenGraph) {
      pageIssues.push(`חסרים Open Graph tags - הוסף og:title, og:description, og:image`);
    }
    if (!seoData.hasViewport) {
      pageIssues.push(`חסר viewport meta tag`);
    }
    if (!seoData.hasHtmlLang) {
      pageIssues.push(`חסר lang attribute ב-HTML tag`);
    }
    if (seoData.imagesWithoutAlt > 0) {
      pageIssues.push(`${seoData.imagesWithoutAlt} תמונות ללא alt text`);
    }

    if (pageIssues.length > 0) {
      const hasCritical = seoData.issues.some(i => i.severity === 'critical');
      basicSeoIssues.push({ 
        page: pageName, 
        url: seoData.url, 
        issues: pageIssues,
        severity: hasCritical ? 'critical' : 'warning'
      });
    }

    // Schema checks
    if (seoData.schemaAnalysis) {
      if (!seoData.schemaAnalysis.hasJsonLd) {
        pageSchemaIssues.push(`חסר JSON-LD - הוסף structured data`);
      }
      if (!seoData.schemaAnalysis.hasOrganization) {
        pageSchemaIssues.push(`חסר Organization schema`);
      }
      if (!seoData.schemaAnalysis.hasWebSite) {
        pageSchemaIssues.push(`חסר WebSite schema`);
      }
      if (!seoData.schemaAnalysis.hasBreadcrumb) {
        pageSchemaIssues.push(`חסר BreadcrumbList schema`);
      }
    } else {
      pageSchemaIssues.push(`אין structured data כלל - הוסף JSON-LD`);
    }

    if (pageSchemaIssues.length > 0) {
      schemaIssues.push({ page: pageName, url: seoData.url, issues: pageSchemaIssues });
    }

    // AI Crawlers checks
    if (seoData.aiCrawlers) {
      const blockedCrawlers = seoData.aiCrawlers.filter(c => !c.allowed).map(c => c.name);
      if (blockedCrawlers.length > 0) {
        pageAiIssues.push(`Crawlers חסומים: ${blockedCrawlers.join(', ')}`);
      }
    }

    if (pageAiIssues.length > 0) {
      aiCrawlersIssues.push({ page: pageName, url: seoData.url, issues: pageAiIssues });
    }

    // Keywords checks
    if (seoData.keywordAnalysis) {
      if (seoData.keywordAnalysis.missing.length > 0) {
        pageKeywordIssues.push(`מילות מפתח חסרות ב-Title/H1/Description: ${seoData.keywordAnalysis.missing.slice(0, 5).join(', ')}`);
      }
      if (seoData.keywordAnalysis.inTitle.length === 0) {
        pageKeywordIssues.push(`אין מילות מפתח ב-Title`);
      }
      if (seoData.keywordAnalysis.inH1.length === 0) {
        pageKeywordIssues.push(`אין מילות מפתח ב-H1`);
      }
    }

    if (pageKeywordIssues.length > 0) {
      keywordsIssues.push({ page: pageName, url: seoData.url, issues: pageKeywordIssues });
    }
  }

  return {
    basicSeo: {
      title: 'תשתית SEO בסיסית',
      icon: '🔧',
      issueCount: basicSeoIssues.reduce((acc, p) => acc + p.issues.length, 0),
      affectedPages: basicSeoIssues.map(p => p.page),
      prompt: generateTopicPrompt('תשתית SEO בסיסית', basicSeoIssues),
    },
    schema: {
      title: 'Schema ומבנה',
      icon: '📦',
      issueCount: schemaIssues.reduce((acc, p) => acc + p.issues.length, 0),
      affectedPages: schemaIssues.map(p => p.page),
      prompt: generateSchemaPrompt(schemaIssues),
    },
    aiCrawlers: {
      title: 'AI Crawlers',
      icon: '🤖',
      issueCount: aiCrawlersIssues.reduce((acc, p) => acc + p.issues.length, 0),
      affectedPages: aiCrawlersIssues.map(p => p.page),
      prompt: generateAiCrawlersPrompt(aiCrawlersIssues),
    },
    keywords: {
      title: 'מילות מפתח',
      icon: '🔑',
      issueCount: keywordsIssues.reduce((acc, p) => acc + p.issues.length, 0),
      affectedPages: keywordsIssues.map(p => p.page),
      prompt: generateKeywordsPrompt(keywordsIssues),
    },
  };
}

function generateTopicPrompt(
  topic: string, 
  issues: { page: string; url: string; issues: string[]; severity?: string }[]
): string {
  if (issues.length === 0) return `✅ אין בעיות ב${topic}`;

  const criticalPages = issues.filter(p => p.severity === 'critical');
  const warningPages = issues.filter(p => p.severity !== 'critical');

  let prompt = `תקן את בעיות ה-${topic} באתר:\n\n`;

  if (criticalPages.length > 0) {
    prompt += `🔴 קריטי:\n\n`;
    for (const page of criticalPages) {
      prompt += `📄 ${page.page} (${page.url}):\n`;
      for (const issue of page.issues) {
        prompt += `   - ${issue}\n`;
      }
      prompt += '\n';
    }
  }

  if (warningPages.length > 0) {
    prompt += `🟡 אזהרות:\n\n`;
    for (const page of warningPages) {
      prompt += `📄 ${page.page} (${page.url}):\n`;
      for (const issue of page.issues) {
        prompt += `   - ${issue}\n`;
      }
      prompt += '\n';
    }
  }

  prompt += `\n💡 הנחיות כלליות:\n`;
  prompt += `- Title צריך להיות 50-60 תווים\n`;
  prompt += `- Description צריך להיות 150-160 תווים\n`;
  prompt += `- כל דף צריך H1 אחד בלבד\n`;
  prompt += `- הוסף canonical URL לכל דף\n`;

  return prompt;
}

function generateSchemaPrompt(issues: { page: string; url: string; issues: string[] }[]): string {
  if (issues.length === 0) return `✅ אין בעיות ב-Schema`;

  let prompt = `הוסף Schema.org (JSON-LD) לאתר:\n\n`;

  for (const page of issues) {
    prompt += `📄 ${page.page} (${page.url}):\n`;
    for (const issue of page.issues) {
      prompt += `   - ${issue}\n`;
    }
    prompt += '\n';
  }

  prompt += `\n💡 קוד לדוגמה (הוסף לדף הבית):\n`;
  prompt += `\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "שם החברה",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png",
  "sameAs": [
    "https://facebook.com/...",
    "https://instagram.com/..."
  ]
}
\`\`\`\n\n`;

  prompt += `הוסף גם WebSite schema עם SearchAction ו-BreadcrumbList לניווט.`;

  return prompt;
}

function generateAiCrawlersPrompt(issues: { page: string; url: string; issues: string[] }[]): string {
  if (issues.length === 0) return `✅ כל ה-AI Crawlers מורשים`;

  let prompt = `עדכן את הגדרות ה-AI Crawlers:\n\n`;

  const allBlockedCrawlers = new Set<string>();
  for (const page of issues) {
    for (const issue of page.issues) {
      const match = issue.match(/Crawlers חסומים: (.+)/);
      if (match) {
        match[1].split(', ').forEach(c => allBlockedCrawlers.add(c));
      }
    }
  }

  prompt += `🤖 Crawlers חסומים כרגע: ${Array.from(allBlockedCrawlers).join(', ')}\n\n`;

  prompt += `📝 פעולה נדרשת:\n`;
  prompt += `עדכן את קובץ robots.txt כדי לאפשר גישה ל-AI Crawlers:\n\n`;
  prompt += `\`\`\`
User-agent: GPTBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: Anthropic-AI
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: CCBot
Allow: /
\`\`\`\n\n`;

  prompt += `💡 שים לב: אם אתה רוצה לחסום crawlers ספציפיים, שנה Allow ל-Disallow`;

  return prompt;
}

function generateKeywordsPrompt(issues: { page: string; url: string; issues: string[] }[]): string {
  if (issues.length === 0) return `✅ מילות המפתח מוטמעות כראוי`;

  let prompt = `שפר את מילות המפתח באתר:\n\n`;

  for (const page of issues) {
    prompt += `📄 ${page.page} (${page.url}):\n`;
    for (const issue of page.issues) {
      prompt += `   - ${issue}\n`;
    }
    prompt += '\n';
  }

  prompt += `\n💡 הנחיות:\n`;
  prompt += `- וודא שמילות המפתח העיקריות מופיעות ב-Title, H1, ו-Description\n`;
  prompt += `- השתמש במילות מפתח בפסקה הראשונה של הדף\n`;
  prompt += `- צפיפות מומלצת: 1-2% מהתוכן\n`;
  prompt += `- השתמש בווריאציות טבעיות של מילות המפתח\n`;

  return prompt;
}

function buildAiPrompt(
  allPagesData: PageSeoData[], 
  consolidatedPrompts: ConsolidatedPrompts,
  totalIssues: { critical: number; warning: number; info: number },
  averageScore: number
): string {
  return `נתח את תוצאות ה-SEO עבור ${allPagesData.length} דפים.

📊 סיכום:
- ציון ממוצע: ${averageScore}/100
- בעיות קריטיות: ${totalIssues.critical}
- אזהרות: ${totalIssues.warning}
- מידע: ${totalIssues.info}

📋 נושאים לטיפול:
1. תשתית SEO בסיסית: ${consolidatedPrompts.basicSeo.issueCount} בעיות ב-${consolidatedPrompts.basicSeo.affectedPages.length} דפים
2. Schema ומבנה: ${consolidatedPrompts.schema.issueCount} בעיות ב-${consolidatedPrompts.schema.affectedPages.length} דפים
3. AI Crawlers: ${consolidatedPrompts.aiCrawlers.issueCount} בעיות ב-${consolidatedPrompts.aiCrawlers.affectedPages.length} דפים
4. מילות מפתח: ${consolidatedPrompts.keywords.issueCount} בעיות ב-${consolidatedPrompts.keywords.affectedPages.length} דפים

החזר JSON עם:
{
  "overallScore": number (0-100),
  "scoreExplanation": "הסבר קצר בעברית על המצב הכללי",
  "priorityOrder": ["basicSeo", "schema", "keywords", "aiCrawlers"] // סדר עדיפות מומלץ לטיפול
}`;
}
