import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GitBranch, GitCommit, Play, CheckCircle, XCircle, Clock, Copy, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Json } from "@/integrations/supabase/types";

interface TestResults {
  passed: number;
  failed: number;
  skipped: number;
}

interface PipelineRun {
  id: string;
  commit_hash: string | null;
  branch: string | null;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  triggered_by: string | null;
  test_results: TestResults | null;
  error_message: string | null;
  created_at: string;
}

const GITHUB_WORKFLOW = `name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run tests
        run: npm run test -- --coverage
      
      - name: Build
        run: npm run build

  deploy-preview:
    needs: test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel Preview
        run: echo "Deploy to preview environment"

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Production
        run: echo "Deploy to production"`;

export const CiCdTab: React.FC = () => {
  const [pipelineRuns, setPipelineRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPipelineRuns();
  }, []);

  const fetchPipelineRuns = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pipeline_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData: PipelineRun[] = (data || []).map(run => ({
        ...run,
        test_results: run.test_results as unknown as TestResults | null
      }));
      
      setPipelineRuns(transformedData);
    } catch (error) {
      console.error('Error fetching pipeline runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('הועתק ללוח');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="h-3 w-3 ml-1" /> הצליח</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 ml-1" /> נכשל</Badge>;
      case 'running':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Clock className="h-3 w-3 ml-1 animate-spin" /> רץ</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 ml-1" /> ממתין</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const benefits = [
    { icon: CheckCircle, text: 'בדיקות אוטומטיות בכל push' },
    { icon: CheckCircle, text: 'מניעת קוד שבור בפרודקשן' },
    { icon: CheckCircle, text: 'סביבות preview לכל PR' },
    { icon: CheckCircle, text: 'Deploy אוטומטי ל-main' },
  ];

  return (
    <div className="space-y-6">
      {/* Benefits */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {benefits.map((benefit, index) => (
          <Card key={index} className="bg-card/50 border-border/50">
            <CardContent className="pt-6 flex items-center gap-3">
              <benefit.icon className="h-5 w-5 text-green-400" />
              <span className="text-sm">{benefit.text}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* GitHub Actions Workflow */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                GitHub Actions Workflow
              </CardTitle>
              <CardDescription>קובץ workflow להרצה אוטומטית של בדיקות ו-deploy</CardDescription>
            </div>
            <Button variant="outline" onClick={() => copyToClipboard(GITHUB_WORKFLOW)}>
              <Copy className="h-4 w-4 ml-2" />
              העתק
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-3">
            <p className="text-sm text-muted-foreground mb-2">
              צור קובץ <code className="bg-background px-1 rounded">.github/workflows/ci.yml</code> עם התוכן הבא:
            </p>
          </div>
          <pre className="bg-background/50 p-4 rounded-lg text-sm font-mono overflow-x-auto max-h-96">
            {GITHUB_WORKFLOW}
          </pre>
        </CardContent>
      </Card>

      {/* Pipeline Runs */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                הרצות אחרונות
              </CardTitle>
              <CardDescription>היסטוריית הרצות CI/CD</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 ml-2" />
                פתח ב-GitHub
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pipelineRuns.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commit</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>תוצאות בדיקות</TableHead>
                  <TableHead>זמן</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pipelineRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <GitCommit className="h-4 w-4 text-muted-foreground" />
                        <code className="text-sm">{run.commit_hash?.slice(0, 7) || '-'}</code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{run.branch || '-'}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(run.status)}</TableCell>
                    <TableCell>
                      {run.test_results ? (
                        <div className="flex gap-2 text-sm">
                          <span className="text-green-400">✓ {run.test_results.passed}</span>
                          <span className="text-red-400">✗ {run.test_results.failed}</span>
                          <span className="text-gray-400">○ {run.test_results.skipped}</span>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {run.started_at 
                        ? format(new Date(run.started_at), 'dd/MM HH:mm', { locale: he })
                        : '-'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>אין הרצות מתועדות עדיין</p>
              <p className="text-sm mt-1">הרצות יופיעו כאן לאחר חיבור GitHub Actions</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-blue-500/10 border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-blue-400">איך להפעיל?</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="bg-blue-500/20 text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-xs shrink-0">1</span>
              <span>צור את תיקיית <code className="bg-background px-1 rounded">.github/workflows</code> בשורש הפרויקט</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-blue-500/20 text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-xs shrink-0">2</span>
              <span>צור קובץ <code className="bg-background px-1 rounded">ci.yml</code> עם התוכן למעלה</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-blue-500/20 text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-xs shrink-0">3</span>
              <span>עשה commit ו-push ל-GitHub</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-blue-500/20 text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-xs shrink-0">4</span>
              <span>ה-workflow ירוץ אוטומטית בכל push</span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};
