import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Server, GitPullRequest, CheckCircle, ExternalLink, Copy, Layers } from "lucide-react";
import { toast } from "sonner";

export const StagingTab: React.FC = () => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('הועתק ללוח');
  };

  const benefits = [
    { title: 'בדיקות לפני פרודקשן', description: 'בדוק שינויים לפני שהם עולים לאתר החי' },
    { title: 'שיתוף עם לקוחות', description: 'שלח לינק ללקוח לבדיקה לפני העלאה' },
    { title: 'סביבה נפרדת', description: 'מאגר נתונים נפרד שלא משפיע על פרודקשן' },
    { title: 'Preview אוטומטי', description: 'כל PR מקבל סביבת preview משלו' },
  ];

  const steps = [
    {
      title: 'חבר את הפרויקט ל-Vercel',
      description: 'היכנס ל-Vercel והוסף את ה-repository שלך',
      command: 'npm i -g vercel && vercel',
    },
    {
      title: 'הגדר את ה-branch הראשי',
      description: 'ב-Vercel Settings → Git → Production Branch',
      command: null,
    },
    {
      title: 'צור branch לפיתוח',
      description: 'עבוד על branch נפרד עבור כל פיצ\'ר',
      command: 'git checkout -b feature/my-feature',
    },
    {
      title: 'פתח Pull Request',
      description: 'Vercel יצור preview אוטומטית לכל PR',
      command: null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-purple-500/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-lg bg-purple-500/20">
              <Server className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">סביבת Staging</h2>
              <p className="text-muted-foreground">
                סביבת staging היא העתק של האתר שמאפשרת לבדוק שינויים לפני שהם עולים לפרודקשן.
                עם Vercel, כל Pull Request מקבל סביבת preview אוטומטית!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benefits.map((benefit, index) => (
          <Card key={index} className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                <div>
                  <p className="font-medium">{benefit.title}</p>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Vercel Preview Deployments */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitPullRequest className="h-5 w-5" />
            Vercel Preview Deployments
          </CardTitle>
          <CardDescription>כל Pull Request מקבל URL ייחודי לבדיקה</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold">{index + 1}</span>
              </div>
              <div className="flex-1">
                <p className="font-medium">{step.title}</p>
                <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                {step.command && (
                  <div className="flex items-center gap-2">
                    <code className="bg-background px-3 py-1.5 rounded text-sm font-mono flex-1">
                      {step.command}
                    </code>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => copyToClipboard(step.command!)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Environment Variables */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            משתני סביבה
          </CardTitle>
          <CardDescription>הפרדה בין סביבות שונות</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-green-500/20 text-green-400">Production</Badge>
                </div>
                <p className="text-sm text-muted-foreground">main branch</p>
                <p className="text-xs font-mono mt-2">SUPABASE_URL=prod_url</p>
              </div>
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-yellow-500/20 text-yellow-400">Preview</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Pull Requests</p>
                <p className="text-xs font-mono mt-2">SUPABASE_URL=staging_url</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-blue-500/20 text-blue-400">Development</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Local</p>
                <p className="text-xs font-mono mt-2">SUPABASE_URL=local_url</p>
              </div>
            </div>

            <div className="p-4 bg-background/50 rounded-lg">
              <p className="text-sm">
                <strong>טיפ:</strong> ב-Vercel Settings → Environment Variables, הגדר משתנים שונים לכל סביבה.
                כך תוכל לחבר את Preview לסביבת Supabase נפרדת.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="bg-primary/10 border-primary/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">התחל עם Vercel</h3>
              <p className="text-sm text-muted-foreground">חינמי לפרויקטים אישיים עם Preview Deployments אוטומטי</p>
            </div>
            <Button asChild>
              <a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 ml-2" />
                פתח Vercel
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
