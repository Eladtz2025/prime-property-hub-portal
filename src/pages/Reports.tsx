import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Download, Calendar, DollarSign, Building, MapPin } from 'lucide-react';
import { processPropertiesData } from '../utils/dataProcessor';
import { Property } from '../types/property';

export const Reports: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      const data = await processPropertiesData();
      setProperties(data);
      setLoading(false);
    };
    loadData();
  }, []);

  // Analytics calculations
  const analytics = useMemo(() => {
    const totalProperties = properties.length;
    const occupiedProperties = properties.filter(p => p.status === 'occupied').length;
    const vacantProperties = properties.filter(p => p.status === 'vacant').length;
    
    const occupancyRate = totalProperties > 0 ? ((occupiedProperties / totalProperties) * 100).toFixed(1) : '0';
    
    return {
      totalProperties,
      occupiedProperties,
      vacantProperties,
      occupancyRate,
    };
  }, [properties]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-foreground">דוחות ותובנות</h2>
        <div className="text-center py-8">טוען נתונים...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">דוחות ותובנות</h2>
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
        
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">נכסים תפוסים</p>
                <p className="text-2xl font-bold text-orange-700">{analytics.occupiedProperties}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">נכסים פנויים</p>
                <p className="text-2xl font-bold text-purple-700">{analytics.vacantProperties}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>סיכום נכסים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>נכסים תפוסים:</span>
                <span className="font-bold text-green-600">{analytics.occupiedProperties}</span>
              </div>
              <div className="flex justify-between">
                <span>נכסים פנויים:</span>
                <span className="font-bold text-orange-600">{analytics.vacantProperties}</span>
              </div>
              <div className="flex justify-between">
                <span>סה״כ נכסים:</span>
                <span className="font-bold">{analytics.totalProperties}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>מידע נוסף</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>אחוז תפוסה:</span>
                <span className="font-bold text-blue-600">{analytics.occupancyRate}%</span>
              </div>
              <div className="text-sm text-muted-foreground">
                המערכת מציגה את כל הנכסים שלך ומאפשרת מעקב מקצועי ברמה הגבוהה ביותר.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};