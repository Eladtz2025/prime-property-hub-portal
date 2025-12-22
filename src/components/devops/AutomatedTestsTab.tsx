import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code2, TestTube, Play, FileCode, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const VITEST_CONFIG = `import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})`;

const SETUP_FILE = `import '@testing-library/jest-dom'`;

const EXAMPLE_TEST = `import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('applies variant styles', () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-destructive')
  })
})`;

export const AutomatedTestsTab: React.FC = () => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} הועתק ללוח`);
  };

  const testTypes = [
    {
      icon: Code2,
      title: 'Unit Tests',
      description: 'בדיקות פונקציות בודדות',
      tool: 'Vitest',
      examples: ['חישוב מחיר', 'ולידציית טופס', 'עיצוב מחרוזות'],
      color: 'bg-blue-500/20 text-blue-400',
    },
    {
      icon: TestTube,
      title: 'Component Tests',
      description: 'בדיקות קומפוננטות React בבידוד',
      tool: 'React Testing Library',
      examples: ['Button רינדור', 'Modal פתיחה וסגירה', 'Form submission'],
      color: 'bg-purple-500/20 text-purple-400',
    },
    {
      icon: Play,
      title: 'E2E Tests',
      description: 'בדיקות זרימות משתמש מלאות',
      tool: 'Playwright / Cypress',
      examples: ['התחברות משתמש', 'יצירת נכס חדש', 'מילוי טופס יצירת קשר'],
      color: 'bg-green-500/20 text-green-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Test Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {testTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Card key={type.title} className="bg-card/50 border-border/50">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${type.color} flex items-center justify-center mb-3`}>
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{type.title}</CardTitle>
                <CardDescription>{type.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">כלי מומלץ:</p>
                    <Badge variant="outline">{type.tool}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">דוגמאות:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {type.examples.map((ex) => (
                        <li key={ex}>• {ex}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Installation Guide */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            התקנת Vitest
          </CardTitle>
          <CardDescription>הוראות להתקנת בדיקות אוטומטיות בפרויקט</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">1. התקן את החבילות:</p>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => copyToClipboard('npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom', 'פקודת ההתקנה')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <pre className="bg-background/50 p-3 rounded-lg text-sm font-mono overflow-x-auto">
              npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
            </pre>
          </div>

          {/* Step 2 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">2. צור קובץ vitest.config.ts:</p>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => copyToClipboard(VITEST_CONFIG, 'קונפיגורציה')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <pre className="bg-background/50 p-3 rounded-lg text-sm font-mono overflow-x-auto max-h-48">
              {VITEST_CONFIG}
            </pre>
          </div>

          {/* Step 3 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">3. צור קובץ src/test/setup.ts:</p>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => copyToClipboard(SETUP_FILE, 'Setup file')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <pre className="bg-background/50 p-3 rounded-lg text-sm font-mono">
              {SETUP_FILE}
            </pre>
          </div>

          {/* Step 4 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">4. הוסף סקריפט ל-package.json:</p>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => copyToClipboard('"test": "vitest", "test:ui": "vitest --ui"', 'סקריפטים')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <pre className="bg-background/50 p-3 rounded-lg text-sm font-mono">
              "test": "vitest",{'\n'}"test:ui": "vitest --ui"
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Example Test */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            דוגמה לבדיקה
          </CardTitle>
          <CardDescription>קובץ בדיקה לדוגמה עבור קומפוננטת Button</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">src/components/ui/button.test.tsx:</p>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => copyToClipboard(EXAMPLE_TEST, 'דוגמת בדיקה')}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <pre className="bg-background/50 p-3 rounded-lg text-sm font-mono overflow-x-auto max-h-64">
            {EXAMPLE_TEST}
          </pre>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card className="bg-green-500/10 border-green-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <CheckCircle className="h-5 w-5" />
            יתרונות בדיקות אוטומטיות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-400 mt-1" />
              <span>זיהוי באגים לפני שהם מגיעים לפרודקשן</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-400 mt-1" />
              <span>ביטחון לבצע שינויים בקוד קיים</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-400 mt-1" />
              <span>תיעוד חי של ההתנהגות הצפויה</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-400 mt-1" />
              <span>חסכון בזמן בדיקות ידניות</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-400 mt-1" />
              <span>שילוב עם CI/CD לבדיקה אוטומטית בכל push</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
