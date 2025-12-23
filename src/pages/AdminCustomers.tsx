import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"customers" | "brokers">("customers");
  const [searchTerm, setSearchTerm] = useState("");
  const [addCustomerModalOpen, setAddCustomerModalOpen] = useState(false);
  const [addBrokerModalOpen, setAddBrokerModalOpen] = useState(false);
  const [editBroker, setEditBroker] = useState<BrokerWithPropertyNames | null>(null);
  const [deleteBrokerId, setDeleteBrokerId] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);

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

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "customers" | "brokers")} className="space-y-4">
        {/* Tabs + Buttons row */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setAddCustomerModalOpen(true)} size="sm">
              <Plus className="h-4 w-4 ml-2" />
              לקוח חדש
            </Button>
            <Button onClick={() => { setEditBroker(null); setAddBrokerModalOpen(true); }} size="sm" variant="outline">
              <Plus className="h-4 w-4 ml-2" />
              מתווך חדש
            </Button>
          </div>
          <TabsList>
            <TabsTrigger value="customers">לקוחות ({customers.length})</TabsTrigger>
            <TabsTrigger value="brokers">מתווכים ({brokers.length})</TabsTrigger>
          </TabsList>
        </div>

        {/* Search bar */}
        <div className="bg-card p-3 md:p-4 rounded-lg">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="חיפוש..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
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
