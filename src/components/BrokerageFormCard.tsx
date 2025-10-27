import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Receipt } from 'lucide-react';

export const BrokerageFormCard: React.FC = () => {

  return (
    <Card className="border-2 hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle>טפסים</CardTitle>
        </div>
        <CardDescription>
          הזמנת שירותי תיווך וטפסים נוספים
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => window.open('/brokerage-form/new', '_blank')}
          >
            <FileText className="h-4 w-4 ml-2" />
            הזמנת שירותי תיווך
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => window.open('/admin-dashboard/price-offers', '_blank')}
          >
            <Receipt className="h-4 w-4 ml-2" />
            הצעות מחיר
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
