import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Download, Calendar, DollarSign, Building, MapPin } from 'lucide-react';
import { processPropertiesData } from '../utils/dataProcessor';

export const Reports: React.FC = () => {
  const properties = processPropertiesData();

  // Analytics calculations
  const analytics = useMemo(() => {
    const totalProperties = properties.length;
    const occupiedProperties = properties.filter(p => p.status === 'occupied').length;
    const vacantProperties = properties.filter(p => p.status === 'vacant').length;
    const maintenanceProperties = properties.filter(p => p.status === 'maintenance').length;
    
    const occupancyRate = ((occupiedProperties / totalProperties) * 100).toFixed(1);
    
    const totalMonthlyRevenue = properties
      .filter(p => p.status === 'occupied' && p.monthlyRent)
      .reduce((sum, p) => sum + (p.monthlyRent || 0), 0);
    
    const averageRent = properties
      .filter(p => p.monthlyRent)
      .reduce((sum, p, _, arr) => sum + (p.monthlyRent || 0) / arr.length, 0);

    // Properties by city
    const cityCounts = properties.reduce((acc, property) => {
      acc[property.city] = (acc[property.city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const cityData = Object.entries(cityCounts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Revenue by city
    const revenueByCity = properties
      .filter(p => p.status === 'occupied' && p.monthlyRent)
      .reduce((acc, property) => {
        acc[property.city] = (acc[property.city] || 0) + (property.monthlyRent || 0);
        return acc;
      }, {} as Record<string, number>);

    const revenueData = Object.entries(revenueByCity)
      .map(([city, revenue]) => ({ city, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    // Status distribution for pie chart
    const statusData = [
      { name: 'תפוס', value: occupiedProperties, color: '#10b981' },
      { name: 'פנוי', value: vacantProperties, color: '#f59e0b' },
      { name: 'תחזוקה', value: maintenanceProperties, color: '#ef4444' }
    ];

    // Lease expiry analysis
    const now = new Date();
    const expiringNext30Days = properties.filter(p => {
      if (!p.leaseEndDate) return false;
      const endDate = new Date(p.leaseEndDate);
      const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
      return daysUntilEnd <= 30 && daysUntilEnd > 0;
    }).length;

    const expiringNext60Days = properties.filter(p => {
      if (!p.leaseEndDate) return false;
      const endDate = new Date(p.leaseEndDate);
      const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
      return daysUntilEnd <= 60 && daysUntilEnd > 30;
    }).length;

    return {
      totalProperties,
      occupiedProperties,
      vacantProperties,
      maintenanceProperties,
      occupancyRate,
      totalMonthlyRevenue,
      averageRent,
      cityData,
      revenueData,
      statusData,
      expiringNext30Days,
      expiringNext60Days
    };
  }, [properties]);

  const exportToCSV = () => {
    const csvContent = [
      ['כתובת', 'עיר', 'סטטוס', 'בעל נכס', 'שוכר', 'שכירות חודשית', 'תאריך סיום חוזה'],
      ...properties.map(p => [
        p.address,
        p.city,
        p.status,
        p.ownerName,
        p.tenantName || '',
        p.monthlyRent?.toString() || '',
        p.leaseEndDate || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `property-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">דוחות ותובנות</h2>
        <Button onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          ייצא לקובץ CSV
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">סה״כ נכסים</p>
                <p className="text-2xl font-bold text-blue-700">{analytics.totalProperties}</p>
              </div>
              <Building className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">אחוז תפוסה</p>
                <p className="text-2xl font-bold text-green-700">{analytics.occupancyRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">הכנסה חודשית</p>
                <p className="text-2xl font-bold text-purple-700">₪{analytics.totalMonthlyRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">שכירות ממוצעת</p>
                <p className="text-2xl font-bold text-orange-700">₪{Math.round(analytics.averageRent).toLocaleString()}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Property Distribution by Status */}
        <Card>
          <CardHeader>
            <CardTitle>התפלגות נכסים לפי סטטוס</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {analytics.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Properties by City */}
        <Card>
          <CardHeader>
            <CardTitle>נכסים לפי עיר</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.cityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="city" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>הכנסות לפי עיר</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={analytics.revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="city" />
              <YAxis />
              <Tooltip formatter={(value) => `₪${Number(value).toLocaleString()}`} />
              <Bar dataKey="revenue" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Lease Expiry Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">חוזים שמסתיימים בחודש הקרוב</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700 mb-2">
              {analytics.expiringNext30Days}
            </div>
            <p className="text-red-600">נכסים שדורשים טיפול מיידי</p>
            <Button variant="outline" size="sm" className="mt-3 border-red-200 text-red-700">
              הצג רשימה מפורטת
            </Button>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-700">חוזים שמסתיימים בחודשיים הקרובים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-700 mb-2">
              {analytics.expiringNext60Days}
            </div>
            <p className="text-yellow-600">נכסים לתכנון מוקדם</p>
            <Button variant="outline" size="sm" className="mt-3 border-yellow-200 text-yellow-700">
              הצג רשימה מפורטת
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Cities */}
      <Card>
        <CardHeader>
          <CardTitle>ערים מובילות בהכנסות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.revenueData.slice(0, 5).map((city, index) => (
              <div key={city.city} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">#{index + 1}</Badge>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{city.city}</span>
                </div>
                <div className="text-left">
                  <div className="font-bold text-lg">₪{city.revenue.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">הכנסה חודשית</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};