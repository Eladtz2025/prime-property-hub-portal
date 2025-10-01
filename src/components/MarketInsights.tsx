import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  Home, 
  DollarSign, 
  Percent,
  Newspaper,
  LineChart,
  Calculator
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const MarketInsights: React.FC = () => {
  // Mock data - in a real app, this would come from an API
  const marketData = {
    housingPriceIndex: {
      value: '+2.3%',
      trend: 'up',
      description: 'עליית מחירים ב-3 החודשים האחרונים'
    },
    rentalMarket: {
      avgRent: '₪5,200',
      occupancy: '94%',
      trend: 'up',
      description: 'שוק השכירות בעיר'
    },
    interestRate: {
      value: '4.25%',
      change: '-0.25%',
      trend: 'down',
      description: 'ריבית בנק ישראל'
    },
    rentalYield: {
      value: '4.8%',
      trend: 'stable',
      description: 'תשואת השכרה ממוצעת'
    },
    cpi: {
      value: '3.2%',
      trend: 'up',
      description: 'מדד המחירים לצרכן - שנתי'
    }
  };

  return (
    <div dir="rtl" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Housing Price Index */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              מדד מחירי הדיור
            </CardTitle>
            <CardDescription>מגמת מחירים אזורית</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold">{marketData.housingPriceIndex.value}</span>
              <Badge variant={marketData.housingPriceIndex.trend === 'up' ? 'default' : 'secondary'}>
                {marketData.housingPriceIndex.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {marketData.housingPriceIndex.description}
            </p>
          </CardContent>
        </Card>

        {/* Rental Market */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              שוק השכירות
            </CardTitle>
            <CardDescription>נתוני שכירות באזור</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">שכירות ממוצעת</span>
                <span className="text-xl font-bold">{marketData.rentalMarket.avgRent}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">אחוז תפוסה</span>
                <span className="text-xl font-bold text-green-600">{marketData.rentalMarket.occupancy}</span>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                {marketData.rentalMarket.description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Interest Rate */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Percent className="h-5 w-5 text-primary" />
              ריבית ומשכנתאות
            </CardTitle>
            <CardDescription>ריבית בנק ישראל</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold">{marketData.interestRate.value}</span>
              <Badge variant={marketData.interestRate.trend === 'down' ? 'default' : 'secondary'}>
                <TrendingDown className="h-4 w-4" />
                {marketData.interestRate.change}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {marketData.interestRate.description}
            </p>
          </CardContent>
        </Card>

        {/* Rental Yield */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <LineChart className="h-5 w-5 text-primary" />
              תשואת השכרה
            </CardTitle>
            <CardDescription>ROI ממוצע באזור</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold">{marketData.rentalYield.value}</span>
              <Badge variant="outline">יציב</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {marketData.rentalYield.description}
            </p>
          </CardContent>
        </Card>

        {/* CPI */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              מדד המחירים לצרכן
            </CardTitle>
            <CardDescription>להצמדת שכירות</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold">{marketData.cpi.value}</span>
              <Badge variant="default">
                <TrendingUp className="h-4 w-4" />
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {marketData.cpi.description}
            </p>
          </CardContent>
        </Card>

        {/* News & Updates */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-primary" />
              חדשות נדל"ן
            </CardTitle>
            <CardDescription>עדכונים ושינויים</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm">
                <Badge variant="secondary" className="mb-1">חדש</Badge>
                <p className="text-muted-foreground text-xs">
                  שינוי במס רכישה לדירה ראשונה
                </p>
              </div>
              <div className="text-sm">
                <Badge variant="outline" className="mb-1">עדכון</Badge>
                <p className="text-muted-foreground text-xs">
                  תקנות חדשות לשוק ההשכרה
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info Section */}
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle>השוואה לנכסים שלך</CardTitle>
          <CardDescription>
            הנתונים שלך לעומת השוק הכללי
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            הנכסים שלך מניבים תשואה ממוצעת של <span className="font-bold text-primary">5.2%</span>,
            גבוה ב-<span className="font-bold text-green-600">8%</span> מהממוצע בשוק.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
