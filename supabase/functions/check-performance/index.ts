const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PerformanceResult {
  url: string;
  strategy: 'desktop' | 'mobile';
  score: number;
  metrics: {
    lcp: { value: number; score: string };
    fid: { value: number; score: string };
    cls: { value: number; score: string };
    fcp: { value: number; score: string };
    ttfb: { value: number; score: string };
  };
  opportunities: Array<{ title: string; description: string; savings?: string }>;
  diagnostics: Array<{ title: string; description: string }>;
}

function getScoreLabel(score: number): string {
  if (score >= 0.9) return 'good';
  if (score >= 0.5) return 'needs-improvement';
  return 'poor';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, strategy = 'mobile' } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GOOGLE_PAGESPEED_API_KEY');
    
    if (!apiKey) {
      console.error('Missing GOOGLE_PAGESPEED_API_KEY');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing API key configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking performance for: ${url} (${strategy})`);

    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&key=${apiKey}&category=performance`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PageSpeed API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const lighthouse = data.lighthouseResult;

    // Extract metrics
    const audits = lighthouse.audits;
    
    const metrics = {
      lcp: {
        value: Math.round(audits['largest-contentful-paint']?.numericValue || 0),
        score: getScoreLabel(audits['largest-contentful-paint']?.score || 0),
      },
      fid: {
        value: Math.round(audits['max-potential-fid']?.numericValue || 0),
        score: getScoreLabel(audits['max-potential-fid']?.score || 0),
      },
      cls: {
        value: parseFloat((audits['cumulative-layout-shift']?.numericValue || 0).toFixed(3)),
        score: getScoreLabel(audits['cumulative-layout-shift']?.score || 0),
      },
      fcp: {
        value: Math.round(audits['first-contentful-paint']?.numericValue || 0),
        score: getScoreLabel(audits['first-contentful-paint']?.score || 0),
      },
      ttfb: {
        value: Math.round(audits['server-response-time']?.numericValue || 0),
        score: getScoreLabel(audits['server-response-time']?.score || 0),
      },
    };

    // Extract opportunities
    const opportunities: Array<{ title: string; description: string; savings?: string }> = [];
    const opportunityIds = [
      'render-blocking-resources',
      'unused-css-rules',
      'unused-javascript',
      'unminified-css',
      'unminified-javascript',
      'offscreen-images',
      'uses-optimized-images',
      'uses-webp-images',
      'uses-text-compression',
      'uses-responsive-images',
    ];

    for (const id of opportunityIds) {
      const audit = audits[id];
      if (audit && audit.score !== null && audit.score < 1) {
        opportunities.push({
          title: audit.title || id,
          description: audit.description || '',
          savings: audit.displayValue,
        });
      }
    }

    // Extract diagnostics
    const diagnostics: Array<{ title: string; description: string }> = [];
    const diagnosticIds = [
      'dom-size',
      'mainthread-work-breakdown',
      'bootup-time',
      'third-party-summary',
      'critical-request-chains',
    ];

    for (const id of diagnosticIds) {
      const audit = audits[id];
      if (audit && audit.details) {
        diagnostics.push({
          title: audit.title || id,
          description: audit.displayValue || audit.description || '',
        });
      }
    }

    const result: PerformanceResult = {
      url,
      strategy: strategy as 'desktop' | 'mobile',
      score: Math.round((lighthouse.categories?.performance?.score || 0) * 100),
      metrics,
      opportunities: opportunities.slice(0, 5),
      diagnostics: diagnostics.slice(0, 5),
    };

    console.log(`Performance check completed: score=${result.score}`);

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Performance check error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
