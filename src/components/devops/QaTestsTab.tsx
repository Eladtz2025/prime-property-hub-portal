import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, CheckCircle, XCircle, Clock, FileDown, Filter, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface QaTest {
  id: string;
  category: string;
  name: string;
  description: string | null;
  expected_result: string | null;
  status: string;
  last_tested_at: string | null;
  tested_by: string | null;
  notes: string | null;
  priority: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  navigation: 'ניווט',
  home: 'דף הבית',
  properties: 'נכסים',
  forms: 'טפסים',
  responsive: 'תגובתיות',
  accessibility: 'נגישות',
  auth: 'אותנטיקציה',
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'ממתין', icon: Clock, color: 'bg-gray-500/20 text-gray-400' },
  { value: 'passed', label: 'עבר', icon: CheckCircle, color: 'bg-green-500/20 text-green-400' },
  { value: 'failed', label: 'נכשל', icon: XCircle, color: 'bg-red-500/20 text-red-400' },
  { value: 'skipped', label: 'דולג', icon: Clock, color: 'bg-yellow-500/20 text-yellow-400' },
];

export const QaTestsTab: React.FC = () => {
  const [tests, setTests] = useState<QaTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('qa_tests')
        .select('*')
        .order('category')
        .order('priority', { ascending: false });

      if (error) throw error;
      setTests(data || []);
    } catch (error) {
      toast.error('שגיאה בטעינת הבדיקות');
    } finally {
      setLoading(false);
    }
  };

  const updateTestStatus = async (testId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('qa_tests')
        .update({ 
          status, 
          last_tested_at: new Date().toISOString() 
        })
        .eq('id', testId);

      if (error) throw error;
      
      setTests(prev => prev.map(t => 
        t.id === testId 
          ? { ...t, status, last_tested_at: new Date().toISOString() } 
          : t
      ));
      toast.success('הסטטוס עודכן');
    } catch (error) {
      toast.error('שגיאה בעדכון');
    }
  };

  const updateTestNotes = async (testId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('qa_tests')
        .update({ notes })
        .eq('id', testId);

      if (error) throw error;
      
      setTests(prev => prev.map(t => 
        t.id === testId ? { ...t, notes } : t
      ));
    } catch (error) {
      toast.error('שגיאה בשמירת הערות');
    }
  };

  const exportToJson = () => {
    const exportData = tests.map(t => ({
      category: CATEGORY_LABELS[t.category] || t.category,
      name: t.name,
      description: t.description,
      expectedResult: t.expected_result,
      status: t.status,
      lastTested: t.last_tested_at,
      notes: t.notes,
      priority: t.priority,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qa-tests-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('הדוח יוצא בהצלחה');
  };

  const resetAllTests = async () => {
    if (!confirm('האם אתה בטוח שברצונך לאפס את כל הבדיקות?')) return;
    
    try {
      const { error } = await supabase
        .from('qa_tests')
        .update({ status: 'pending', last_tested_at: null, notes: null })
        .neq('id', '');

      if (error) throw error;
      fetchTests();
      toast.success('כל הבדיקות אופסו');
    } catch (error) {
      toast.error('שגיאה באיפוס');
    }
  };

  const filteredTests = tests.filter(t => {
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  const categories = [...new Set(tests.map(t => t.category))];
  
  const stats = {
    total: tests.length,
    passed: tests.filter(t => t.status === 'passed').length,
    failed: tests.filter(t => t.status === 'failed').length,
    pending: tests.filter(t => t.status === 'pending').length,
  };

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find(o => o.value === status);
    if (!option) return <Badge variant="outline">{status}</Badge>;
    const Icon = option.icon;
    return (
      <Badge className={option.color}>
        <Icon className="h-3 w-3 mr-1" />
        {option.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">גבוהה</Badge>;
      case 'medium':
        return <Badge variant="outline">בינונית</Badge>;
      case 'low':
        return <Badge variant="secondary">נמוכה</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">סה"כ בדיקות</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-green-400">{stats.passed}</p>
            <p className="text-sm text-muted-foreground">עברו</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-red-400">{stats.failed}</p>
            <p className="text-sm text-muted-foreground">נכשלו</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-500/10 border-gray-500/30">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-gray-400">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">ממתינים</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="קטגוריה" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הקטגוריות</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="סטטוס" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            {STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button variant="outline" onClick={resetAllTests}>
          <RefreshCw className="h-4 w-4 mr-2" />
          אפס הכל
        </Button>
        <Button onClick={exportToJson}>
          <FileDown className="h-4 w-4 mr-2" />
          ייצא דוח
        </Button>
      </div>

      {/* Tests Table */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">קטגוריה</TableHead>
                <TableHead>בדיקה</TableHead>
                <TableHead className="w-24">עדיפות</TableHead>
                <TableHead className="w-32">סטטוס</TableHead>
                <TableHead className="w-32">נבדק לאחרונה</TableHead>
                <TableHead className="w-40">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTests.map((test) => (
                <React.Fragment key={test.id}>
                  <TableRow 
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() => setExpandedTest(expandedTest === test.id ? null : test.id)}
                  >
                    <TableCell>
                      <Badge variant="outline">{CATEGORY_LABELS[test.category] || test.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{test.name}</p>
                        {test.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-md">{test.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(test.priority)}</TableCell>
                    <TableCell>{getStatusBadge(test.status)}</TableCell>
                    <TableCell>
                      {test.last_tested_at 
                        ? format(new Date(test.last_tested_at), 'dd/MM HH:mm', { locale: he })
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <Button 
                          size="sm" 
                          variant={test.status === 'passed' ? 'default' : 'outline'}
                          className="h-8 w-8 p-0"
                          onClick={() => updateTestStatus(test.id, 'passed')}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant={test.status === 'failed' ? 'destructive' : 'outline'}
                          className="h-8 w-8 p-0"
                          onClick={() => updateTestStatus(test.id, 'failed')}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => updateTestStatus(test.id, 'pending')}
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedTest === test.id && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-accent/30">
                        <div className="p-4 space-y-3">
                          {test.expected_result && (
                            <div>
                              <p className="text-sm font-medium mb-1">תוצאה צפויה:</p>
                              <p className="text-sm text-muted-foreground">{test.expected_result}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium mb-1">הערות:</p>
                            <Textarea
                              value={test.notes || ''}
                              onChange={(e) => {
                                const newNotes = e.target.value;
                                setTests(prev => prev.map(t => 
                                  t.id === test.id ? { ...t, notes: newNotes } : t
                                ));
                              }}
                              onBlur={(e) => updateTestNotes(test.id, e.target.value)}
                              placeholder="הוסף הערות על הבדיקה..."
                              className="h-20"
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
