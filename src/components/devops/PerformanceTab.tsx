import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gauge, Smartphone, Monitor, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PerformanceMetric {
  value: number;
  score: string;
}

interface PerformanceResult {
  url: string;
  strategy: string;
  score: number;
  metrics: {
    firstContentfulPaint: PerformanceMetric;
    largestContentfulPaint: PerformanceMetric;
    totalBlockingTime: PerformanceMetric;
    cumulativeLayoutShift: PerformanceMetric;
    speedIndex: PerformanceMetric;
  };
  opportunities: { title: string; description: string }[];
  diagnostics: { title: string; description: string }[];
}

interface PageToCheck {
  name: string;
  path: string;
}

const PAGES_TO_CHECK: PageToCheck[] = [
  { name: 'דף הבית', path: '/he' },
  { name: 'השכרות', path: '/he/rentals' },
  { name: 'מכירות', path: '/he/sales' },
  { name: 'Home (EN)', path: '/en' },
];

export const PerformanceTab: React.FC = () => {
  const [desktopResults, setDesktopResults] = useState<PerformanceResult[]>([]);
  const [mobileResults, setMobileResults] = useState<PerformanceResult[]>([]);
  const [checking, setChecking] = useState(false);
  const [activeTab, setActiveTab] = useState('desktop');

  const getBaseUrl = () => {
    return window.location.origin;
  };

  const checkSinglePage = async (page: PageToCheck, strategy: 'desktop' | 'mobile'): Promise<PerformanceResult | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-performance', {
        body: { url: `${getBaseUrl()}${page.path}`, strategy }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error checking ${page.path}:`, error);
      return null;
    }
  };

  const checkAllPages = async () => {
    setChecking(true);
    setDesktopResults([]);
    setMobileResults([]);
    
    for (const page of PAGES_TO_CHECK) {
      toast.info(`בודק: ${page.name}...`);
      
      const [desktopResult, mobileResult] = await Promise.all([
        checkSinglePage(page, 'desktop'),
        checkSinglePage(page, 'mobile')
      ]);
      
      if (desktopResult) setDesktopResults(prev => [...prev, desktopResult]);
      if (mobileResult) setMobileResults(prev => [...prev, mobileResult]);
    }
    
    setChecking(false);
    toast.success('בדיקת ביצועים הושלמה');
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-500/20 border-green-500/30';
    if (score >= 50) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const getMetricIcon = (score: string) => {
    switch (score) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'needs-improvement':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'poor':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return null;
    }
  };

  const formatMetricValue = (key: string, value: number) => {
    if (key === 'cumulativeLayoutShift') return value.toFixed(3);
    if (value > 1000) return `${(value / 1000).toFixed(1)}s`;
    return `${Math.round(value)}ms`;
  };

  const results = activeTab === 'desktop' ? desktopResults : mobileResults;
  const averageScore = results.length > 0 
    ? Math.round(results.reduce((acc, r) => acc + r.score, 0) / results.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">בדיקת ביצועים</h2>
          <p className="text-muted-foreground">בדיקת מהירות וביצועים באמצעות PageSpeed Insights</p>
        </div>
        <Button onClick={checkAllPages} disabled={checking}>
          <Gauge className={`h-4 w-4 ml-2 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'בודק...' : 'הרץ בדיקת ביצועים'}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="desktop" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Desktop
          </TabsTrigger>
          <TabsTrigger value="mobile" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Mobile
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-4">
          {/* Average Score */}
          {results.length > 0 && (
            <Card className={`${getScoreBg(averageScore)} border`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">ציון ממוצע ({activeTab})</p>
                    <p className={`text-4xl font-bold ${getScoreColor(averageScore)}`}>{averageScore}/100</p>
                  </div>
                  <Gauge className={`h-12 w-12 ${getScoreColor(averageScore)}`} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((result, index) => (
              <Card key={index} className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{PAGES_TO_CHECK[index]?.name}</CardTitle>
                    <Badge className={getScoreBg(result.score)}>
                      <span className={getScoreColor(result.score)}>{result.score}/100</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Core Web Vitals */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Core Web Vitals</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {result.metrics && Object.entries(result.metrics).map(([key, metric]) => (
                        <div key={key} className="flex items-center justify-between p-2 bg-background/50 rounded">
                          <span className="text-muted-foreground">
                            {key === 'firstContentfulPaint' && 'FCP'}
                            {key === 'largestContentfulPaint' && 'LCP'}
                            {key === 'totalBlockingTime' && 'TBT'}
                            {key === 'cumulativeLayoutShift' && 'CLS'}
                            {key === 'speedIndex' && 'SI'}
                          </span>
                          <div className="flex items-center gap-2">
                            {getMetricIcon(metric.score)}
                            <span>{formatMetricValue(key, metric.value)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Opportunities */}
                  {result.opportunities?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-yellow-400 mb-1">הזדמנויות לשיפור</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {result.opportunities.slice(0, 3).map((opp, i) => (
                          <li key={i} className="truncate">• {opp.title}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Empty State */}
      {results.length === 0 && !checking && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="py-12 text-center">
            <Gauge className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">לא בוצעה בדיקת ביצועים עדיין</h3>
            <p className="text-muted-foreground mb-4">לחץ על הכפתור למעלה כדי לבדוק את ביצועי האתר</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
