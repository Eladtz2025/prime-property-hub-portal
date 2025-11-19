import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download, Plus } from "lucide-react";
import { useCustomerData, type Customer } from "@/hooks/useCustomerData";
import { CustomerStatsCards } from "@/components/CustomerStatsCards";
import { CustomerCard } from "@/components/CustomerCard";
import { CustomerEditModal } from "@/components/CustomerEditModal";
import { AddCustomerModal } from "@/components/AddCustomerModal";

export default function AdminCustomers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const {
    customers,
    loading,
    fetchCustomers,
    updateCustomerStatus,
    updateCustomerPriority,
  } = useCustomerData({
    status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
    priority: priorityFilter && priorityFilter !== 'all' ? priorityFilter : undefined,
    search: searchTerm || undefined,
  });

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditModalOpen(true);
  };

  const handleSaveCustomer = () => {
    fetchCustomers();
  };

  const filteredCustomers = customers;

  const hotLeads = customers.filter(c => c.priority === 'high' || c.priority === 'urgent');
  const needFollowup = customers.filter(c => {
    if (!c.next_followup_date) return false;
    return new Date(c.next_followup_date) <= new Date();
  });
  const viewedProperties = customers.filter(c => c.property_id);

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex flex-row-reverse justify-between items-center">
        <h1 className="text-3xl font-bold">ניהול לקוחות</h1>
        <div className="flex gap-2">
          <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            לקוח חדש
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            ייצא נתונים
          </Button>
        </div>
      </div>

      <CustomerStatsCards customers={customers} />

      <div className="flex flex-row-reverse gap-4 items-center bg-card p-4 rounded-lg">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="חיפוש לפי שם, אימייל או טלפון..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="כל הסטטוסים" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            <SelectItem value="new">חדש</SelectItem>
            <SelectItem value="contacted">נוצר קשר</SelectItem>
            <SelectItem value="active">פעיל</SelectItem>
            <SelectItem value="viewing_scheduled">צפייה קבועה</SelectItem>
            <SelectItem value="offer_made">הצעה בוצעה</SelectItem>
            <SelectItem value="closed_won">נסגר בהצלחה</SelectItem>
            <SelectItem value="closed_lost">נסגר ללא הצלחה</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="כל העדיפויות" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל העדיפויות</SelectItem>
            <SelectItem value="low">נמוך</SelectItem>
            <SelectItem value="medium">בינוני</SelectItem>
            <SelectItem value="high">גבוה</SelectItem>
            <SelectItem value="urgent">דחוף</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setPriorityFilter("all");
            }}
        >
          <Filter className="h-4 w-4 mr-2" />
          נקה סינון
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">כל הלקוחות ({customers.length})</TabsTrigger>
          <TabsTrigger value="hot">לידים חמים ({hotLeads.length})</TabsTrigger>
          <TabsTrigger value="followup">דורש מעקב ({needFollowup.length})</TabsTrigger>
          <TabsTrigger value="viewed">צפו בנכסים ({viewedProperties.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="text-center py-12">טוען לקוחות...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              לא נמצאו לקוחות
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map((customer) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  onEdit={handleEditCustomer}
                  onUpdateStatus={updateCustomerStatus}
                  onUpdatePriority={updateCustomerPriority}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="hot" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hotLeads.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onEdit={handleEditCustomer}
                onUpdateStatus={updateCustomerStatus}
                onUpdatePriority={updateCustomerPriority}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="followup" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {needFollowup.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onEdit={handleEditCustomer}
                onUpdateStatus={updateCustomerStatus}
                onUpdatePriority={updateCustomerPriority}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="viewed" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {viewedProperties.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onEdit={handleEditCustomer}
                onUpdateStatus={updateCustomerStatus}
                onUpdatePriority={updateCustomerPriority}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <CustomerEditModal
        customer={selectedCustomer}
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedCustomer(null);
        }}
        onSave={handleSaveCustomer}
      />

      <AddCustomerModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={handleSaveCustomer}
      />
    </div>
  );
}
