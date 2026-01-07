const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AiCrawlerCheck {
  name: string;
  userAgent: string;
  allowed: boolean;
  foundInRobots: boolean;
}

interface KeywordAnalysis {
  keywords: { word: string; count: number; density: number }[];
  inTitle: string[];
  inH1: string[];
  inDescription: string[];
  inFirstParagraph: string[];
  missing: string[];
}

interface SchemaAnalysis {
  hasJsonLd: boolean;
  schemas: { type: string; valid: boolean }[];
  hasOrganization: boolean;
  hasWebSite: boolean;
  hasBreadcrumb: boolean;
  hasLocalBusiness: boolean;
  hasFAQPage: boolean;
  rawSchemas: any[];
}

// Extract keywords from text
function extractKeywords(text: string): { word: string; count: number }[] {
  const hebrewStopWords = ['את', 'של', 'על', 'עם', 'לא', 'זה', 'אני', 'הוא', 'היא', 'אם', 'או', 'כי', 'אבל', 'גם', 'רק', 'כל', 'יש', 'אין', 'מה', 'מי', 'איך', 'למה', 'כמה', 'עוד', 'אחר', 'אחת', 'אחד', 'שני', 'שתי', 'הם', 'הן', 'אנחנו', 'אתם', 'אתן'];
  const englishStopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'this', 'that', 'these', 'those', 'it', 'its'];
  
  const stopWords = [...hebrewStopWords, ...englishStopWords];
  
  const words = text
    .toLowerCase()
    .replace(/[^\w\u0590-\u05FF\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word));
  
  const wordCount: Record<string, number> = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  return Object.entries(wordCount)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

// Check AI crawlers in robots.txt
async function checkAiCrawlers(baseUrl: string): Promise<AiCrawlerCheck[]> {
  const crawlers = [
    { name: 'GPTBot (OpenAI)', userAgent: 'GPTBot' },
    { name: 'ChatGPT-User', userAgent: 'ChatGPT-User' },
    { name: 'Claude-Web (Anthropic)', userAgent: 'Claude-Web' },
    { name: 'Anthropic-AI', userAgent: 'anthropic-ai' },
    { name: 'Google-Extended', userAgent: 'Google-Extended' },
    { name: 'CCBot (Common Crawl)', userAgent: 'CCBot' },
    { name: 'Bytespider (ByteDance)', userAgent: 'Bytespider' },
  ];

  try {
    const robotsUrl = new URL('/robots.txt', baseUrl).href;
    const response = await fetch(robotsUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)' },
    });
    
    if (!response.ok) {
      return crawlers.map(c => ({ ...c, allowed: true, foundInRobots: false }));
    }
    
    const robotsTxt = await response.text().toLowerCase();
    
    return crawlers.map(crawler => {
      const userAgentLower = crawler.userAgent.toLowerCase();
      const foundInRobots = robotsTxt.includes(userAgentLower);
      
      const lines = robotsTxt.split('\n');
      let currentUserAgent = '';
      let isDisallowed = false;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('user-agent:')) {
          currentUserAgent = trimmedLine.replace('user-agent:', '').trim();
        } else if (trimmedLine.startsWith('disallow:') && 
                   (currentUserAgent === userAgentLower || currentUserAgent === '*')) {
          const path = trimmedLine.replace('disallow:', '').trim();
          if (path === '/' && currentUserAgent === userAgentLower) {
            isDisallowed = true;
            break;
          }
        }
      }
      
      return {
        ...crawler,
        allowed: !isDisallowed,
        foundInRobots,
      };
    });
  } catch (error) {
    console.error('Error checking robots.txt:', error);
    return crawlers.map(c => ({ ...c, allowed: true, foundInRobots: false }));
  }
}

// Parse and analyze Schema.org JSON-LD
function analyzeSchemas(html: string): SchemaAnalysis {
  const result: SchemaAnalysis = {
    hasJsonLd: false,
    schemas: [],
    hasOrganization: false,
    hasWebSite: false,
    hasBreadcrumb: false,
    hasLocalBusiness: false,
    hasFAQPage: false,
    rawSchemas: [],
  };

  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  
  if (!jsonLdMatches || jsonLdMatches.length === 0) {
    return result;
  }

  result.hasJsonLd = true;

  for (const match of jsonLdMatches) {
    try {
      const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '').trim();
      const parsed = JSON.parse(jsonContent);
      result.rawSchemas.push(parsed);

      const processSchema = (schema: any) => {
        const type = schema['@type'];
        if (!type) return;

        const types = Array.isArray(type) ? type : [type];
        
        for (const t of types) {
          result.schemas.push({ type: t, valid: true });
          
          if (t === 'Organization' || t === 'Corporation') {
            result.hasOrganization = true;
          }
          if (t === 'WebSite') {
            result.hasWebSite = true;
          }
          if (t === 'BreadcrumbList') {
            result.hasBreadcrumb = true;
          }
          if (t === 'LocalBusiness' || t === 'RealEstateAgent') {
            result.hasLocalBusiness = true;
          }
          if (t === 'FAQPage') {
            result.hasFAQPage = true;
          }
        }
      };

      if (Array.isArray(parsed)) {
        parsed.forEach(processSchema);
      } else if (parsed['@graph']) {
        parsed['@graph'].forEach(processSchema);
      } else {
        processSchema(parsed);
      }
    } catch (error) {
      result.schemas.push({ type: 'Invalid JSON-LD', valid: false });
    }
  }

  return result;
}

// Analyze HTML and return SEO result
function analyzeHtml(html: string, url: string, baseUrl: string, aiCrawlers: AiCrawlerCheck[], renderedScan: boolean) {
  // Extract SEO elements using regex
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const description = descMatch ? descMatch[1].trim() : '';

  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  const h1Contents = h1Matches.map(h => h.replace(/<[^>]*>/g, '').trim());

  const imgMatches = html.match(/<img[^>]*>/gi) || [];
  const imagesWithoutAlt = imgMatches.filter(img => !img.includes('alt=')).length;

  // Open Graph tags
  const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
  const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
  const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);
  const ogType = html.match(/<meta[^>]*property=["']og:type["'][^>]*content=["']([^"']*)["']/i);

  const ogTags: Record<string, string> = {};
  if (ogTitle) ogTags['og:title'] = ogTitle[1];
  if (ogDesc) ogTags['og:description'] = ogDesc[1];
  if (ogImage) ogTags['og:image'] = ogImage[1];
  if (ogType) ogTags['og:type'] = ogType[1];

  // Canonical URL
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
  const canonicalUrl = canonicalMatch ? canonicalMatch[1] : null;

  // Robots meta
  const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i);
  const robotsContent = robotsMatch ? robotsMatch[1] : null;

  // Viewport
  const hasViewport = /<meta[^>]*name=["']viewport["']/i.test(html);

  // HTML lang
  const langMatch = html.match(/<html[^>]*lang=["']([^"']*)["']/i);
  const htmlLang = langMatch ? langMatch[1] : null;

  // Heading structure
  const headingStructure: Record<string, number> = {};
  for (let i = 2; i <= 6; i++) {
    const hMatches = html.match(new RegExp(`<h${i}[^>]*>`, 'gi')) || [];
    headingStructure[`h${i}`] = hMatches.length;
  }

  // AI meta tags
  const hasNoAiMeta = /<meta[^>]*name=["']robots["'][^>]*content=["'][^"']*noai[^"']*["']/i.test(html);
  const hasNoImageAiMeta = /<meta[^>]*name=["']robots["'][^>]*content=["'][^"']*noimageai[^"']*["']/i.test(html);

  // Analyze schemas
  const schemaAnalysis = analyzeSchemas(html);

  // Hreflang tags
  const hreflangMatches = html.matchAll(/<link[^>]*rel=["']alternate["'][^>]*hreflang=["']([^"']*)["'][^>]*href=["']([^"']*)["']/gi);
  const hreflangTags: { lang: string; url: string }[] = [];
  for (const match of hreflangMatches) {
    hreflangTags.push({ lang: match[1], url: match[2] });
  }
  const hasHreflang = hreflangTags.length > 0;

  // RTL support
  const hasRtlSupport = /<html[^>]*dir=["']rtl["']/i.test(html) || /dir=["']rtl["']/i.test(html);

  // Detect language
  let detectedLanguage: 'he' | 'en' | 'unknown' = 'unknown';
  if (url.includes('/he/') || url.includes('/he') || htmlLang?.startsWith('he')) {
    detectedLanguage = 'he';
  } else if (url.includes('/en/') || url.includes('/en') || htmlLang?.startsWith('en')) {
    detectedLanguage = 'en';
  }

  // Language consistency
  const languageConsistency = (
    (detectedLanguage === 'he' && htmlLang?.startsWith('he')) ||
    (detectedLanguage === 'en' && htmlLang?.startsWith('en')) ||
    detectedLanguage === 'unknown'
  );

  // Body text and keywords
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyText = bodyMatch ? bodyMatch[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';
  const firstParagraphMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const firstParagraph = firstParagraphMatch ? firstParagraphMatch[1].replace(/<[^>]*>/g, '').trim() : '';
  
  const extractedKeywords = extractKeywords(bodyText);
  const totalWords = bodyText.split(/\s+/).length;
  
  const keywordsWithDensity = extractedKeywords.map(k => ({
    ...k,
    density: totalWords > 0 ? Number(((k.count / totalWords) * 100).toFixed(2)) : 0
  }));

  const topKeywords = keywordsWithDensity.slice(0, 10).map(k => k.word);
  
  const keywordAnalysis: KeywordAnalysis = {
    keywords: keywordsWithDensity,
    inTitle: topKeywords.filter(k => title.toLowerCase().includes(k)),
    inH1: topKeywords.filter(k => h1Contents.some(h => h.toLowerCase().includes(k))),
    inDescription: topKeywords.filter(k => description.toLowerCase().includes(k)),
    inFirstParagraph: topKeywords.filter(k => firstParagraph.toLowerCase().includes(k)),
    missing: topKeywords.filter(k => 
      !title.toLowerCase().includes(k) && 
      !h1Contents.some(h => h.toLowerCase().includes(k)) &&
      !description.toLowerCase().includes(k)
    ),
  };

  // Calculate score and generate issues
  let score = 100;
  const issues: { severity: 'critical' | 'warning' | 'info'; message: string }[] = [];
  const recommendations: string[] = [];

  // Title checks
  if (!title) {
    score -= 15;
    issues.push({ severity: 'critical', message: 'חסרה תגית כותרת (title)' });
    recommendations.push('הוסף תגית <title> עם כותרת תיאורית');
  } else if (title.length < 30) {
    score -= 5;
    issues.push({ severity: 'warning', message: `הכותרת קצרה מדי (${title.length} תווים)` });
    recommendations.push('הארך את הכותרת ל-30-60 תווים');
  } else if (title.length > 60) {
    score -= 5;
    issues.push({ severity: 'warning', message: 'הכותרת ארוכה מדי' });
    recommendations.push('קצר את הכותרת ל-60 תווים או פחות');
  }

  // Description checks
  if (!description) {
    score -= 10;
    issues.push({ severity: 'critical', message: 'חסר תיאור מטא (meta description)' });
    recommendations.push('הוסף תגית meta description עם תיאור של 150-160 תווים');
  } else if (description.length < 100) {
    score -= 5;
    issues.push({ severity: 'warning', message: `התיאור קצר מדי (${description.length} תווים)` });
    recommendations.push('הארך את התיאור ל-100-160 תווים');
  } else if (description.length > 160) {
    score -= 3;
    issues.push({ severity: 'info', message: 'התיאור ארוך מדי' });
    recommendations.push('קצר את התיאור ל-160 תווים או פחות');
  }

  // H1 checks
  if (h1Contents.length === 0) {
    score -= 10;
    issues.push({ severity: 'critical', message: 'חסרה כותרת H1' });
    recommendations.push('הוסף כותרת H1 אחת שמתארת את תוכן העמוד');
  } else if (h1Contents.length > 1) {
    score -= 5;
    issues.push({ severity: 'warning', message: `יש ${h1Contents.length} כותרות H1 (צריך רק אחת)` });
    recommendations.push('השאר רק כותרת H1 אחת בעמוד');
  }

  // Images checks
  if (imagesWithoutAlt > 0) {
    score -= Math.min(imagesWithoutAlt * 2, 10);
    issues.push({ severity: 'warning', message: `${imagesWithoutAlt} תמונות ללא תגית alt` });
    recommendations.push('הוסף תגית alt לכל התמונות עם תיאור רלוונטי');
  }

  // Open Graph checks
  if (Object.keys(ogTags).length === 0) {
    score -= 5;
    issues.push({ severity: 'warning', message: 'חסרות תגיות Open Graph' });
    recommendations.push('הוסף תגיות og:title, og:description, og:image לשיתוף ברשתות חברתיות');
  }

  // Canonical check
  if (!canonicalUrl) {
    score -= 3;
    issues.push({ severity: 'info', message: 'חסרה תגית canonical' });
    recommendations.push('הוסף תגית canonical למניעת תוכן כפול');
  }

  // Viewport check
  if (!hasViewport) {
    score -= 5;
    issues.push({ severity: 'warning', message: 'חסרה תגית viewport' });
    recommendations.push('הוסף תגית viewport לתמיכה במובייל');
  }

  // HTML lang check
  if (!htmlLang) {
    score -= 3;
    issues.push({ severity: 'info', message: 'חסרה תגית lang ב-HTML' });
    recommendations.push('הוסף lang="he" לתגית <html>');
  }

  // Schema checks
  if (!schemaAnalysis.hasJsonLd) {
    score -= 5;
    issues.push({ severity: 'warning', message: 'חסר מידע מובנה (Structured Data)' });
    recommendations.push('הוסף JSON-LD לשיפור הופעה בתוצאות חיפוש');
  }

  // Hreflang check for multilingual sites
  if (!hasHreflang && (url.includes('/he/') || url.includes('/en/'))) {
    score -= 3;
    issues.push({ severity: 'info', message: 'חסרות תגיות hreflang לתמיכה רב-שפתית' });
    recommendations.push('הוסף תגיות hreflang לקישור בין גרסאות השפה');
  }

  // RTL check for Hebrew pages
  if (detectedLanguage === 'he' && !hasRtlSupport) {
    score -= 3;
    issues.push({ severity: 'warning', message: 'חסרה תמיכה ב-RTL לדף עברית' });
    recommendations.push('הוסף dir="rtl" לתגית <html>');
  }

  score = Math.max(0, score);

  return {
    success: true,
    result: {
      url,
      title,
      titleLength: title.length,
      description,
      descriptionLength: description.length,
      h1Count: h1Contents.length,
      h1Contents,
      imagesWithoutAlt,
      totalImages: imgMatches.length,
      hasOpenGraph: Object.keys(ogTags).length > 0,
      ogTags,
      hasCanonical: !!canonicalUrl,
      canonicalUrl,
      hasRobotsMeta: !!robotsContent,
      robotsContent,
      hasViewport,
      hasHtmlLang: !!htmlLang,
      htmlLang,
      hasStructuredData: schemaAnalysis.hasJsonLd,
      headingStructure,
      score,
      issues,
      recommendations,
      aiCrawlers,
      keywordAnalysis,
      schemaAnalysis,
      hasNoAiMeta,
      hasNoImageAiMeta,
      hasHreflang,
      hreflangTags,
      hasRtlSupport,
      detectedLanguage,
      languageConsistency,
      renderedScan,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking SEO (rendered) for: ${url}`);
    const baseUrl = new URL(url).origin;

    // Check AI crawlers first (doesn't depend on HTML)
    const aiCrawlers = await checkAiCrawlers(baseUrl);

    // Try Firecrawl first for rendered HTML
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (firecrawlApiKey) {
      console.log('Using Firecrawl for rendered HTML...');
      
      try {
        const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            formats: ['html'],
            waitFor: 3000, // Wait 3 seconds for React to render
          }),
        });

        const firecrawlData = await firecrawlResponse.json();
        
        if (firecrawlResponse.ok && firecrawlData.success && firecrawlData.data?.html) {
          console.log('Firecrawl returned rendered HTML successfully');
          const html = firecrawlData.data.html;
          const result = analyzeHtml(html, url, baseUrl, aiCrawlers, true);
          
          return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          console.error('Firecrawl error:', firecrawlData.error || 'Unknown error');
        }
      } catch (firecrawlError) {
        console.error('Firecrawl request failed:', firecrawlError);
      }
    } else {
      console.log('FIRECRAWL_API_KEY not configured, using simple fetch');
    }

    // Fallback to simple fetch
    console.log('Falling back to simple fetch...');
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    const result = analyzeHtml(html, url, baseUrl, aiCrawlers, false);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking SEO:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
