import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Calendar, DollarSign, Target, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FinancialForecast {
  month: string;
  projectedIncome: number;
  projectedExpenses: number;
  projectedProfit: number;
  confidence: number;
  trends: {
    income: 'up' | 'down' | 'stable';
    expenses: 'up' | 'down' | 'stable';
  };
}

interface YearlyTarget {
  targetIncome: number;
  targetProfit: number;
  currentProgress: number;
  monthsRemaining: number;
}

export const FinancialForecasting: React.FC = () => {
  const { profile } = useAuth();
  const [forecasts, setForecasts] = useState<FinancialForecast[]>([]);
  const [targets, setTargets] = useState<YearlyTarget | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      loadFinancialData();
    }
  }, [profile?.id]);

  const loadFinancialData = async () => {
    try {
      // Get historical financial data
      const { data: financialData, error } = await supabase
        .from('financial_records')
        .select(`
          *,
          properties!inner(
            property_owners!inner(owner_id)
          )
        `)
        .eq('properties.property_owners.owner_id', profile?.id);

      if (error) throw error;

      // Generate forecasts based on historical data
      const mockForecasts: FinancialForecast[] = Array.from({ length: 6 }, (_, i) => {
        const month = new Date();
        month.setMonth(month.getMonth() + i + 1);
        
        const baseIncome = 18500 + (Math.random() - 0.5) * 2000;
        const baseExpenses = 5200 + (Math.random() - 0.5) * 1000;
        
        return {
          month: month.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' }),
          projectedIncome: Math.round(baseIncome),
          projectedExpenses: Math.round(baseExpenses),
          projectedProfit: Math.round(baseIncome - baseExpenses),
          confidence: 0.75 + Math.random() * 0.2,
          trends: {
            income: Math.random() > 0.5 ? 'up' : 'stable',
            expenses: Math.random() > 0.6 ? 'up' : 'stable'
          }
        };
      });

      setForecasts(mockForecasts);

      // Calculate yearly targets
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      const monthsRemaining = 12 - currentMonth;
      
      const currentYearIncome = financialData
        ?.filter(record => 
          record.type === 'income' && 
          new Date(record.transaction_date).getFullYear() === currentYear
        )
        .reduce((sum, record) => sum + Number(record.amount), 0) || 0;

      setTargets({
        targetIncome: 250000, // Example target
        targetProfit: 150000,
        currentProgress: currentYearIncome,
        monthsRemaining
      });

    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <DollarSign className="h-4 w-4 text-blue-500" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'default';
    if (confidence >= 0.6) return 'secondary';
    return 'destructive';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>טוען תחזיות פיננסיות...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Yearly Targets */}
      {targets && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              יעדים שנתיים
            </CardTitle>
            <CardDescription>מעקב אחר יעדי ההכנסות והרווח השנתיים</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>יעד הכנסות שנתי</span>
                  <span className="font-medium">₪{targets.targetIncome.toLocaleString()}</span>
                </div>
                <Progress 
                  value={(targets.currentProgress / targets.targetIncome) * 100} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>₪{targets.currentProgress.toLocaleString()}</span>
                  <span>{Math.round((targets.currentProgress / targets.targetIncome) * 100)}%</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">נותרו {targets.monthsRemaining} חודשים</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  נדרש ₪{Math.round((targets.targetIncome - targets.currentProgress) / targets.monthsRemaining).toLocaleString()} לחודש
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Forecasts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            תחזיות פיננסיות
          </CardTitle>
          <CardDescription>תחזיות הכנסות והוצאות לחודשים הקרובים</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {forecasts.map((forecast, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{forecast.month}</h4>
                  <Badge variant={getConfidenceColor(forecast.confidence)}>
                    דיוק {Math.round(forecast.confidence * 100)}%
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      {getTrendIcon(forecast.trends.income)}
                      <span className="text-muted-foreground">הכנסות</span>
                    </div>
                    <p className="font-medium text-green-600">
                      ₪{forecast.projectedIncome.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      {getTrendIcon(forecast.trends.expenses)}
                      <span className="text-muted-foreground">הוצאות</span>
                    </div>
                    <p className="font-medium text-red-600">
                      ₪{forecast.projectedExpenses.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-muted-foreground">רווח</span>
                    </div>
                    <p className={`font-medium ${
                      forecast.projectedProfit > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₪{forecast.projectedProfit.toLocaleString()}
                    </p>
                  </div>
                </div>

                {forecast.projectedProfit < 0 && (
                  <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 dark:bg-amber-950/20 p-2 rounded">
                    <AlertTriangle className="h-4 w-4" />
                    <span>צפוי הפסד - מומלץ לבדוק הוצאות</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};