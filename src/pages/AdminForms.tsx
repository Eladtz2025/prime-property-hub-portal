import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, FileSignature, FileText, Scale } from 'lucide-react';
import { BrokerageFormsMobileList } from '@/components/BrokerageFormsMobileList';
import AdminPriceOffersContent from '@/components/AdminPriceOffersContent';
import LegalFormsList from '@/components/forms/LegalFormsList';

const AdminForms = () => {
  const [activeTab, setActiveTab] = useState('brokerage');

  const handleNewBrokerageForm = () => {
    window.open('/brokerage-form/new', '_blank');
  };

  return (
    <div className="min-h-screen" dir="rtl">
      <div className="p-4 text-right">
        <div className="flex flex-row-reverse items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">טפסים</h1>
          {activeTab === 'brokerage' && (
            <Button
              onClick={handleNewBrokerageForm}
              size="sm"
              className="gap-1.5 flex-row-reverse"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">טופס תיווך</span>
              <span className="sm:hidden">חדש</span>
            </Button>
          )}
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="price-offers" className="gap-2 text-xs sm:text-sm flex-row-reverse">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">הצעות מחיר</span>
              <span className="sm:hidden">הצעות</span>
            </TabsTrigger>
            <TabsTrigger value="legal" className="gap-2 text-xs sm:text-sm flex-row-reverse">
              <Scale className="h-4 w-4" />
              <span className="hidden sm:inline">טפסים משפטיים</span>
              <span className="sm:hidden">משפטי</span>
            </TabsTrigger>
            <TabsTrigger value="brokerage" className="gap-2 text-xs sm:text-sm flex-row-reverse">
              <FileSignature className="h-4 w-4" />
              <span className="hidden sm:inline">טפסי תיווך</span>
              <span className="sm:hidden">תיווך</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="brokerage" className="mt-0">
            <BrokerageFormsMobileList />
          </TabsContent>

          <TabsContent value="legal" className="mt-0">
            <LegalFormsList />
          </TabsContent>

          <TabsContent value="price-offers" className="mt-0">
            <AdminPriceOffersContent />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminForms;
