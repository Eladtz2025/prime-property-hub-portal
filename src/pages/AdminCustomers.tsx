import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, RefreshCcw, Loader2, Building2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCustomerData, type Customer } from "@/hooks/useCustomerData";
import { useBrokerData, type BrokerWithPropertyNames } from "@/hooks/useBrokerData";
import { CustomerTableView } from "@/components/CustomerTableView";
import { CustomerMobileTable } from "@/components/CustomerMobileTable";
import { BrokerTableView } from "@/components/BrokerTableView";
import { BrokerMobileTable } from "@/components/BrokerMobileTable";
import { AddCustomerModal } from "@/components/AddCustomerModal";
import { AddBrokerModal } from "@/components/AddBrokerModal";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Agent {
  id: string;
  full_name: string | null;
  email: string;
}

export default function AdminCustomers() {
  const [activeTab, setActiveTab] = useState<"customers" | "brokers" | "not_relevant">("customers");
  const [searchTerm, setSearchTerm] = useState("");
  const [addCustomerModalOpen, setAddCustomerModalOpen] = useState(false);
  const [addBrokerModalOpen, setAddBrokerModalOpen] = useState(false);
  const [editBroker, setEditBroker] = useState<BrokerWithPropertyNames | null>(null);
  const [deleteBrokerId, setDeleteBrokerId] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isMatchingAll, setIsMatchingAll] = useState(false);
  const [isScanningOwn, setIsScanningOwn] = useState(false);
  const queryClient = useQueryClient();

  const {
    customers,
    loading: customersLoading,
    fetchCustomers,
    updateCustomerStatus,
    updateCustomerPriority,
    assignAgent,
    deleteCustomer,
    hideCustomer,
    unhideCustomer,
  } = useCustomerData({
    search: searchTerm || undefined,
  });

  // Hook for hidden (not relevant) customers
  const {
    customers: hiddenCustomers,
    loading: hiddenLoading,
    fetchCustomers: fetchHiddenCustomers,
    deleteCustomer: deleteHiddenCustomer,
    unhideCustomer: unhideHiddenCustomer,
  } = useCustomerData({
    search: searchTerm || undefined,
    onlyHidden: true,
  });

  const {
    brokers,
    loading: brokersLoading,
    fetchBrokers,
    deleteBroker,
  } = useBrokerData();

  useEffect(() => {
    const fetchAgents = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');
      
      if (!error && data) {
        setAgents(data);
      }
    };
    fetchAgents();
  }, []);

  const handleSaveCustomer = () => {
    fetchCustomers();
  };

  const handleSaveBroker = () => {
    fetchBrokers();
    setEditBroker(null);
  };

  const handleMatchAllLeads = async () => {
    setIsMatchingAll(true);
    try {
      // Use the unified trigger-matching orchestrator
      await supabase.functions.invoke('trigger-matching', {
        body: { send_whatsapp: false, force: true }
      });
      toast.success('ההתאמות הופעלו - ניתן לעקוב בהיסטוריית הסריקות');
      fetchCustomers();
    } catch (error) {
      console.error('Match all error:', error);
      toast.error('שגיאה בהתאמת לקוחות');
    } finally {
      setIsMatchingAll(false);
    }
  };

  const handleResetAllMatches = async () => {
    setIsMatchingAll(true);
    try {
      // First clear all matches, then trigger matching via trigger-matching
      const { data: clearResult, error: clearError } = await supabase
        .from('scouted_properties')
        .update({ matched_leads: [], status: 'new' })
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (clearError) throw clearError;
      
      const { data, error } = await supabase.functions.invoke('trigger-matching', {
        body: { force: true, send_whatsapp: false }
      });
      if (error) throw error;
      toast.success(`חישוב מחדש הופעל: ${data.total_properties || 0} נכסים ב-${data.batches_triggered || 0} batches`);
      fetchCustomers();
    } catch (error) {
      console.error('Reset matches error:', error);
      toast.error('שגיאה בחישוב מחדש');
    } finally {
      setIsMatchingAll(false);
    }
  };

  const handleScanOwnProperties = async () => {
    setIsScanningOwn(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['own-property-matches'] });
      toast.success('ההתאמות לנכסים שלנו עודכנו');
      fetchCustomers();
    } catch (error) {
      console.error('Scan own properties error:', error);
      toast.error('שגיאה בסריקת נכסים');
    } finally {
      setIsScanningOwn(false);
    }
  };

  const handleEditBroker = (broker: BrokerWithPropertyNames) => {
    setEditBroker(broker);
    setAddBrokerModalOpen(true);
  };

  const handleDeleteBroker = async () => {
    if (!deleteBrokerId) return;
    try {
      await deleteBroker(deleteBrokerId);
      toast.success("המתווך נמחק בהצלחה");
    } catch (error) {
      toast.error("שגיאה במחיקת המתווך");
    }
    setDeleteBrokerId(null);
  };

  // Filter brokers by search
  const filteredBrokers = brokers.filter(broker => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      broker.name.toLowerCase().includes(search) ||
      broker.phone.includes(search) ||
      broker.office_name?.toLowerCase().includes(search)
    );
  });

  const renderCustomers = (customerList: Customer[], isMobile: boolean = false) => {
    if (customersLoading) {
      return <div className="text-center py-12">טוען לקוחות...</div>;
    }

    if (customerList.length === 0) {
      return <div className="text-center py-12 text-muted-foreground">לא נמצאו לקוחות</div>;
    }

    if (isMobile) {
      return (
        <CustomerMobileTable
          customers={customerList}
          onSave={handleSaveCustomer}
          onUpdateStatus={updateCustomerStatus}
          onUpdatePriority={updateCustomerPriority}
          onAssignAgent={assignAgent}
          onDeleteCustomer={deleteCustomer}
          onHideCustomer={hideCustomer}
          onUnhideCustomer={unhideCustomer}
          agents={agents}
        />
      );
    }

    return (
      <CustomerTableView
        customers={customerList}
        onSave={handleSaveCustomer}
        onUpdateStatus={updateCustomerStatus}
        onUpdatePriority={updateCustomerPriority}
        onAssignAgent={assignAgent}
        onDeleteCustomer={deleteCustomer}
        onHideCustomer={hideCustomer}
        onUnhideCustomer={unhideCustomer}
        agents={agents}
        sortBy="created_at_desc"
        onSortChange={() => {}}
      />
    );
  };

  const renderBrokers = (isMobile: boolean = false) => {
    if (brokersLoading) {
      return <div className="text-center py-12">טוען מתווכים...</div>;
    }

    if (filteredBrokers.length === 0) {
      return <div className="text-center py-12 text-muted-foreground">לא נמצאו מתווכים</div>;
    }

    if (isMobile) {
      return (
        <BrokerMobileTable
          brokers={filteredBrokers}
          onEdit={handleEditBroker}
          onDelete={(id) => setDeleteBrokerId(id)}
        />
      );
    }

    return (
      <BrokerTableView
        brokers={filteredBrokers}
        onEdit={handleEditBroker}
        onDelete={(id) => setDeleteBrokerId(id)}
      />
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6 overflow-x-hidden" dir="rtl">
      <h1 className="text-2xl md:text-3xl font-bold">ניהול לקוחות ומתווכים</h1>

      {/* Search bar moved into buttons row below */}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "customers" | "brokers" | "not_relevant")} className="space-y-4">
        {/* Tabs + Buttons row */}
        <div className="flex flex-col gap-3">
          {/* Tabs row */}
          <div className="flex justify-end">
            <TabsList>
              <TabsTrigger value="not_relevant">לא רלוונטי ({hiddenCustomers.length})</TabsTrigger>
              <TabsTrigger value="brokers">מתווכים ({brokers.length})</TabsTrigger>
              <TabsTrigger value="customers">לקוחות ({customers.length})</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Buttons row - two rows on mobile */}
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            {/* Add buttons */}
            <div className="flex gap-2">
              <Button onClick={() => setAddCustomerModalOpen(true)} size="sm" className="flex-1 sm:flex-none">
                <span className="hidden sm:inline">לקוח חדש</span>
                <span className="sm:hidden">לקוח</span>
                <Plus className="h-4 w-4 sm:mr-2" />
              </Button>
              <Button onClick={() => { setEditBroker(null); setAddBrokerModalOpen(true); }} size="sm" variant="outline" className="flex-1 sm:flex-none">
                <span className="hidden sm:inline">מתווך חדש</span>
                <span className="sm:hidden">מתווך</span>
                <Plus className="h-4 w-4 sm:mr-2" />
              </Button>
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={handleResetAllMatches} 
                size="sm" 
                variant="outline"
                disabled={isMatchingAll}
                className="flex-1 sm:flex-none"
              >
                <span className="hidden sm:inline">חשב התאמות מחדש</span>
                <span className="sm:hidden">התאמות</span>
                {isMatchingAll ? (
                  <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4 sm:mr-2" />
                )}
              </Button>
              <Button 
                onClick={handleScanOwnProperties} 
                size="sm" 
                variant="outline"
                disabled={isScanningOwn}
                className="flex-1 sm:flex-none bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                <span className="hidden sm:inline">סרוק נכסים שלנו</span>
                <span className="sm:hidden">סרוק</span>
                {isScanningOwn ? (
                  <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                ) : (
                  <Building2 className="h-4 w-4 sm:mr-2" />
                )}
              </Button>
            </div>

            {/* Compact search - pushed to opposite side */}
            <div className="relative w-full sm:w-[200px] sm:mr-auto">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
              <Input
                placeholder="חיפוש..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-8 text-sm text-right"
              />
            </div>
          </div>
        </div>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          {/* Mobile view */}
          <div className="md:hidden">
            {renderCustomers(customers, true)}
          </div>
          {/* Desktop view */}
          <div className="hidden md:block">
            {renderCustomers(customers)}
          </div>
        </TabsContent>

        {/* Brokers Tab */}
        <TabsContent value="brokers" className="space-y-4">
          {/* Mobile view */}
          <div className="md:hidden">
            {renderBrokers(true)}
          </div>
          {/* Desktop view */}
          <div className="hidden md:block">
            {renderBrokers()}
          </div>
        </TabsContent>

        {/* Not Relevant Tab */}
        <TabsContent value="not_relevant" className="space-y-4">
          {hiddenLoading ? (
            <div className="text-center py-12">טוען לקוחות...</div>
          ) : hiddenCustomers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">אין לקוחות לא רלוונטיים</div>
          ) : (
            <>
              {/* Mobile view */}
              <div className="md:hidden">
                <CustomerMobileTable
                  customers={hiddenCustomers}
                  onSave={() => { fetchHiddenCustomers(); fetchCustomers(); }}
                  onUpdateStatus={() => {}}
                  onUpdatePriority={() => {}}
                  onAssignAgent={() => {}}
                  onDeleteCustomer={deleteHiddenCustomer}
                  onHideCustomer={() => {}}
                  onUnhideCustomer={(id) => { unhideHiddenCustomer(id); fetchCustomers(); }}
                  agents={agents}
                  isHiddenView
                />
              </div>
              {/* Desktop view */}
              <div className="hidden md:block">
                <CustomerTableView
                  customers={hiddenCustomers}
                  onSave={() => { fetchHiddenCustomers(); fetchCustomers(); }}
                  onUpdateStatus={() => {}}
                  onUpdatePriority={() => {}}
                  onAssignAgent={() => {}}
                  onDeleteCustomer={deleteHiddenCustomer}
                  onHideCustomer={() => {}}
                  onUnhideCustomer={(id) => { unhideHiddenCustomer(id); fetchCustomers(); }}
                  agents={agents}
                  sortBy="created_at_desc"
                  onSortChange={() => {}}
                  isHiddenView
                />
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddCustomerModal 
        open={addCustomerModalOpen} 
        onClose={() => setAddCustomerModalOpen(false)} 
        onSave={handleSaveCustomer} 
      />
      
      <AddBrokerModal
        open={addBrokerModalOpen}
        onClose={() => { setAddBrokerModalOpen(false); setEditBroker(null); }}
        onSave={handleSaveBroker}
        editBroker={editBroker}
      />

      {/* Delete Broker Confirmation */}
      <AlertDialog open={!!deleteBrokerId} onOpenChange={() => setDeleteBrokerId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>האם למחוק את המתווך?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו לא ניתנת לביטול. המתווך יימחק לצמיתות.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBroker} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
