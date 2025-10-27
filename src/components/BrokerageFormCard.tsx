import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Receipt } from 'lucide-react';
import { BrokerageFormModal } from './BrokerageFormModal';

export const BrokerageFormCard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <Card className="border-2 hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>טפסים</CardTitle>
            </div>
            <Button onClick={() => setIsModalOpen(true)} size="sm">
              <Plus className="h-4 w-4 ml-2" />
              טופס חדש
            </Button>
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
              onClick={() => setIsModalOpen(true)}
            >
              <FileText className="h-4 w-4 ml-2" />
              הזמנת שירותי תיווך
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/admin-dashboard/price-offers')}
            >
              <Receipt className="h-4 w-4 ml-2" />
              הצעות מחיר
            </Button>
          </div>
        </CardContent>
      </Card>

      <BrokerageFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
