import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, FileSignature, FileText } from 'lucide-react';
import { BrokerageFormsMobileList } from '@/components/BrokerageFormsMobileList';
import AdminPriceOffersContent from '@/components/AdminPriceOffersContent';

const AdminForms = () => {
  const [activeTab, setActiveTab] = useState('brokerage');

  const handleNewBrokerageForm = () => {
    window.open('/brokerage-form/new', '_blank');
  };

  return (
    <div className="relative min-h-screen pb-32">
      <div className="p-4 rtl">
        <h1 className="text-2xl font-bold mb-4">טפסים</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="brokerage" className="gap-2">
              <FileSignature className="h-4 w-4" />
              טפסי תיווך
            </TabsTrigger>
            <TabsTrigger value="price-offers" className="gap-2">
              <FileText className="h-4 w-4" />
              הצעות מחיר
            </TabsTrigger>
          </TabsList>

          <TabsContent value="brokerage" className="mt-0">
            <BrokerageFormsMobileList />
          </TabsContent>

          <TabsContent value="price-offers" className="mt-0">
            <AdminPriceOffersContent />
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Action Button - Always visible for quick access to new brokerage form */}
      <div className="fixed bottom-24 left-4 right-4 md:bottom-8 md:left-auto md:right-8 z-40">
        <Button
          onClick={handleNewBrokerageForm}
          size="lg"
          className="w-full md:w-auto shadow-lg gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-base rounded-xl"
        >
          <Plus className="h-5 w-5" />
          טופס תיווך חדש
        </Button>
      </div>
    </div>
  );
};

export default AdminForms;
