import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Gauge, 
  Monitor, 
  Smartphone,
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Zap,
  Clock,
  Layout,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PerformanceMetric {
  value: number;
  score: string;
}

interface PerformanceResult {
  url: string;
  strategy: 'desktop' | 'mobile';
  score: number;
  metrics: {
    lcp: PerformanceMetric;
    fid: PerformanceMetric;
    cls: PerformanceMetric;
    fcp: PerformanceMetric;
    ttfb: PerformanceMetric;
  };
  opportunities: Array<{ title: string; description: string; savings?: string }>;
  diagnostics: Array<{ title: string; description: string }>;
}

interface PageToCheck {
  name: string;
  path: string;
}

const PAGES_TO_CHECK: PageToCheck[] = [
  { name: 'דף הבית', path: '/' },
  { name: 'דף הבית (אנגלית)', path: '/en' },
  { name: 'השכרות', path: '/en/rentals' },
  { name: 'מכירות', path: '/en/sales' },
];

export default function AdminPerformance() {
  const [desktopResults, setDesktopResults] = useState<Record<string, PerformanceResult>>({});
  const [mobileResults, setMobileResults] = useState<Record<string, PerformanceResult>>({});
  const [isChecking, setIsChecking] = useState(false);
  const [checkingPage, setCheckingPage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'desktop' | 'mobile'>('mobile');

  const getBaseUrl = () => {
    return window.location.origin;
  };

  const checkSinglePage = async (page: PageToCheck, strategy: 'desktop' | 'mobile') => {
    const url = `${getBaseUrl()}${page.path}`;
    try {
      const { data, error } = await supabase.functions.invoke('check-performance', {
        body: { url, strategy },
      });

      if (error) throw error;
      if (data.success && data.result) {
        return data.result;
      }
      throw new Error(data.error || 'Unknown error');
    } catch (error) {
      console.error(`Error checking ${page.name} (${strategy}):`, error);
      return null;
    }
  };

  const checkAllPages = async () => {
    setIsChecking(true);
    setDesktopResults({});
    setMobileResults({});

    for (const page of PAGES_TO_CHECK) {
      setCheckingPage(page.name);
      
      // Check both desktop and mobile
      const [desktopResult, mobileResult] = await Promise.all([
        checkSinglePage(page, 'desktop'),
        checkSinglePage(page, 'mobile'),
      ]);

      if (desktopResult) {
        setDesktopResults((prev) => ({ ...prev, [page.path]: desktopResult }));
      }
      if (mobileResult) {
        setMobileResults((prev) => ({ ...prev, [page.path]: mobileResult }));
      }
    }

    setCheckingPage(null);
    setIsChecking(false);
    toast.success('בדיקת ביצועים הושלמה');
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getMetricIcon = (score: string) => {
    switch (score) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'needs-improvement':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const formatMetricValue = (key: string, value: number) => {
    if (key === 'cls') return value.toFixed(3);
    if (value > 1000) return `${(value / 1000).toFixed(2)}s`;
    return `${value}ms`;
  };

  const results = activeTab === 'desktop' ? desktopResults : mobileResults;
  
  const averageScore = Object.values(results).length > 0
    ? Math.round(Object.values(results).reduce((acc, r) => acc + r.score, 0) / Object.values(results).length)
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">בדיקת ביצועים</h1>
          <p className="text-muted-foreground">ניתוח מהירות ו-Core Web Vitals</p>
        </div>
        <Button onClick={checkAllPages} disabled={isChecking} size="lg">
          {isChecking ? (
            <>
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              בודק {checkingPage}...
            </>
          ) : (
            <>
              <Gauge className="h-4 w-4 ml-2" />
              בדוק את כל העמודים
            </>
          )}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'desktop' | 'mobile')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="mobile" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            מובייל
          </TabsTrigger>
          <TabsTrigger value="desktop" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            דסקטופ
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6 mt-6">
          {/* Average Score */}
          {Object.keys(results).length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-6">
                  <div className="relative">
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center border-8 ${getScoreBg(averageScore)} border-opacity-20`}>
                      <span className={`text-4xl font-bold ${getScoreColor(averageScore)}`}>{averageScore}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">ציון ממוצע ({activeTab === 'desktop' ? 'דסקטופ' : 'מובייל'})</h3>
                    <p className="text-muted-foreground">
                      {averageScore >= 90 ? 'מצוין! ביצועים מעולים' : 
                       averageScore >= 50 ? 'טוב, יש מקום לשיפור' : 
                       'דורש שיפור משמעותי'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {PAGES_TO_CHECK.map((page) => {
              const result = results[page.path];
              const isCurrentlyChecking = checkingPage === page.name;

              return (
                <Card key={page.path} className={isCurrentlyChecking ? 'border-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{page.name}</CardTitle>
                        <CardDescription className="font-mono text-xs">{page.path}</CardDescription>
                      </div>
                      {result && (
                        <div className={`text-3xl font-bold ${getScoreColor(result.score)}`}>
                          {result.score}
                        </div>
                      )}
                      {isCurrentlyChecking && (
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      )}
                    </div>
                  </CardHeader>
                  {result && (
                    <CardContent className="space-y-4">
                      {/* Core Web Vitals */}
                      <div>
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Core Web Vitals
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                              {getMetricIcon(result.metrics.lcp.score)}
                              <span className="text-sm font-medium">LCP</span>
                            </div>
                            <span className="text-sm font-mono">
                              {formatMetricValue('lcp', result.metrics.lcp.value)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                              {getMetricIcon(result.metrics.fid.score)}
                              <span className="text-sm font-medium">FID</span>
                            </div>
                            <span className="text-sm font-mono">
                              {formatMetricValue('fid', result.metrics.fid.value)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                              {getMetricIcon(result.metrics.cls.score)}
                              <span className="text-sm font-medium">CLS</span>
                            </div>
                            <span className="text-sm font-mono">
                              {formatMetricValue('cls', result.metrics.cls.value)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                              {getMetricIcon(result.metrics.fcp.score)}
                              <span className="text-sm font-medium">FCP</span>
                            </div>
                            <span className="text-sm font-mono">
                              {formatMetricValue('fcp', result.metrics.fcp.value)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 col-span-2">
                            <div className="flex items-center gap-2">
                              {getMetricIcon(result.metrics.ttfb.score)}
                              <span className="text-sm font-medium">TTFB</span>
                            </div>
                            <span className="text-sm font-mono">
                              {formatMetricValue('ttfb', result.metrics.ttfb.value)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Opportunities */}
                      {result.opportunities.length > 0 && (
                        <div className="border-t pt-3">
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-yellow-500" />
                            הזדמנויות לשיפור
                          </h4>
                          <ul className="text-sm space-y-2">
                            {result.opportunities.slice(0, 3).map((opp, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-yellow-500 mt-1">•</span>
                                <div>
                                  <span className="font-medium">{opp.title}</span>
                                  {opp.savings && (
                                    <Badge variant="outline" className="mr-2 text-xs">
                                      {opp.savings}
                                    </Badge>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Diagnostics */}
                      {result.diagnostics.length > 0 && (
                        <div className="border-t pt-3">
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Layout className="h-4 w-4 text-blue-500" />
                            אבחונים
                          </h4>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            {result.diagnostics.slice(0, 3).map((diag, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-blue-500">•</span>
                                <span>{diag.title}: {diag.description}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {Object.keys(results).length === 0 && !isChecking && (
            <Card>
              <CardContent className="py-12 text-center">
                <Gauge className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">לא נבדקו עמודים עדיין</h3>
                <p className="text-muted-foreground">לחץ על "בדוק את כל העמודים" כדי להתחיל</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
