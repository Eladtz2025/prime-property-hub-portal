import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download, Plus, LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { useCustomerData, type Customer } from "@/hooks/useCustomerData";
import { CustomerStatsCards } from "@/components/CustomerStatsCards";
import { CustomerCard } from "@/components/CustomerCard";
import { CustomerTableView } from "@/components/CustomerTableView";
import { CustomerEditModal } from "@/components/CustomerEditModal";
import { AddCustomerModal } from "@/components/AddCustomerModal";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
interface Agent {
  id: string;
  full_name: string | null;
  email: string;
}

export default function AdminCustomers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at_desc");
  const [viewMode, setViewMode] = useState<string>("cards");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);

  const {
    customers,
    loading,
    fetchCustomers,
    updateCustomerStatus,
    updateCustomerPriority,
    assignAgent,
    scheduleFollowup,
  } = useCustomerData({
    status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
    priority: priorityFilter && priorityFilter !== 'all' ? priorityFilter : undefined,
    assigned_agent_id: agentFilter && agentFilter !== 'all' ? agentFilter : undefined,
    search: searchTerm || undefined,
  });

  // Fetch agents
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

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditModalOpen(true);
  };

  const handleSaveCustomer = () => {
    fetchCustomers();
  };

  // Sort customers
  const sortedCustomers = useMemo(() => {
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    
    return [...customers].sort((a, b) => {
      switch (sortBy) {
        case 'created_at_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'created_at_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'priority_desc':
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'priority_asc':
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'next_followup_asc':
          const aDate = a.next_followup_date ? new Date(a.next_followup_date).getTime() : Infinity;
          const bDate = b.next_followup_date ? new Date(b.next_followup_date).getTime() : Infinity;
          return aDate - bDate;
        case 'next_followup_desc':
          const aDate2 = a.next_followup_date ? new Date(a.next_followup_date).getTime() : 0;
          const bDate2 = b.next_followup_date ? new Date(b.next_followup_date).getTime() : 0;
          return bDate2 - aDate2;
        case 'last_contact_asc':
          const aContact = a.last_contact_date ? new Date(a.last_contact_date).getTime() : new Date(a.created_at).getTime();
          const bContact = b.last_contact_date ? new Date(b.last_contact_date).getTime() : new Date(b.created_at).getTime();
          return aContact - bContact; // Oldest first (needs attention)
        case 'last_contact_desc':
          const aContact2 = a.last_contact_date ? new Date(a.last_contact_date).getTime() : new Date(a.created_at).getTime();
          const bContact2 = b.last_contact_date ? new Date(b.last_contact_date).getTime() : new Date(b.created_at).getTime();
          return bContact2 - aContact2;
        case 'name_asc':
          return a.name.localeCompare(b.name, 'he');
        case 'name_desc':
          return b.name.localeCompare(a.name, 'he');
        default:
          return 0;
      }
    });
  }, [customers, sortBy]);

  const hotLeads = sortedCustomers.filter(c => c.priority === 'high' || c.priority === 'urgent');
  const needFollowup = sortedCustomers.filter(c => {
    if (!c.next_followup_date) return false;
    return new Date(c.next_followup_date) <= new Date();
  });
  const viewedProperties = sortedCustomers.filter(c => c.property_id);

  // Export to Excel
  const handleExport = () => {
    const exportData = sortedCustomers.map(c => ({
      'שם': c.name,
      'אימייל': c.email,
      'טלפון': c.phone || '',
      'סטטוס': c.status,
      'עדיפות': c.priority,
      'תקציב מינימום': c.budget_min || '',
      'תקציב מקסימום': c.budget_max || '',
      'חדרים מינימום': c.rooms_min || '',
      'חדרים מקסימום': c.rooms_max || '',
      'ערים מועדפות': c.preferred_cities?.join(', ') || '',
      'שכונות מועדפות': c.preferred_neighborhoods?.join(', ') || '',
      'תאריך יצירה': new Date(c.created_at).toLocaleDateString('he-IL'),
      'קשר אחרון': c.last_contact_date ? new Date(c.last_contact_date).toLocaleDateString('he-IL') : '',
      'מעקב הבא': c.next_followup_date ? new Date(c.next_followup_date).toLocaleDateString('he-IL') : '',
      'הערות': c.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'לקוחות');
    XLSX.writeFile(wb, `לקוחות_${new Date().toLocaleDateString('he-IL')}.xlsx`);
  };

  const renderCustomers = (customerList: Customer[]) => {
    if (loading) {
      return <div className="text-center py-12">טוען לקוחות...</div>;
    }

    if (customerList.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          לא נמצאו לקוחות
        </div>
      );
    }

    if (viewMode === 'table') {
      return (
        <CustomerTableView
          customers={customerList}
          onEdit={handleEditCustomer}
          onUpdateStatus={updateCustomerStatus}
          onUpdatePriority={updateCustomerPriority}
          onAssignAgent={assignAgent}
          agents={agents}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customerList.map((customer) => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            onEdit={handleEditCustomer}
            onUpdateStatus={updateCustomerStatus}
            onUpdatePriority={updateCustomerPriority}
            onAssignAgent={assignAgent}
            onScheduleFollowup={scheduleFollowup}
            agents={agents}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6 overflow-x-hidden" dir="rtl">
      <div className="flex flex-col md:flex-row-reverse md:justify-between md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">ניהול לקוחות</h1>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setAddModalOpen(true)} size="sm" className="md:size-default">
            <Plus className="h-4 w-4 ml-2" />
            לקוח חדש
          </Button>
          <Button variant="outline" onClick={handleExport} size="sm" className="md:size-default">
            <Download className="h-4 w-4 ml-2" />
            ייצא לאקסל
          </Button>
        </div>
      </div>

      <CustomerStatsCards customers={customers} />

      {/* Mobile: Search + Filters Button */}
      <div className="md:hidden flex flex-col gap-3 bg-card p-3 rounded-lg">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="חיפוש..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <Sheet open={filtersSheetOpen} onOpenChange={setFiltersSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="shrink-0 relative">
                <SlidersHorizontal className="h-4 w-4" />
                {(statusFilter !== 'all' || priorityFilter !== 'all' || agentFilter !== 'all') && (
                  <Badge className="absolute -top-2 -left-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                    {[statusFilter !== 'all', priorityFilter !== 'all', agentFilter !== 'all'].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[80vh]">
              <SheetHeader>
                <SheetTitle>פילטרים</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 py-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="סטטוס" />
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
                  <SelectTrigger>
                    <SelectValue placeholder="עדיפות" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל העדיפויות</SelectItem>
                    <SelectItem value="low">נמוך</SelectItem>
                    <SelectItem value="medium">בינוני</SelectItem>
                    <SelectItem value="high">גבוה</SelectItem>
                    <SelectItem value="urgent">דחוף</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={agentFilter} onValueChange={setAgentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="סוכן" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל הסוכנים</SelectItem>
                    {agents.map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.full_name || agent.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="מיון" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at_desc">חדשים קודם</SelectItem>
                    <SelectItem value="created_at_asc">ישנים קודם</SelectItem>
                    <SelectItem value="priority_desc">עדיפות גבוהה קודם</SelectItem>
                    <SelectItem value="last_contact_asc">דורש תשומת לב</SelectItem>
                    <SelectItem value="next_followup_asc">מעקב הבא קודם</SelectItem>
                    <SelectItem value="name_asc">לפי שם א-ת</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center justify-between pt-2">
                  <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v)}>
                    <ToggleGroupItem value="cards" aria-label="תצוגת כרטיסים">
                      <LayoutGrid className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="table" aria-label="תצוגת טבלה">
                      <List className="h-4 w-4" />
                    </ToggleGroupItem>
                  </ToggleGroup>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setPriorityFilter("all");
                      setAgentFilter("all");
                      setSortBy("created_at_desc");
                    }}
                  >
                    <Filter className="h-4 w-4 ml-1" />
                    נקה הכל
                  </Button>
                </div>

                <Button onClick={() => setFiltersSheetOpen(false)} className="w-full">
                  החל פילטרים
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Mobile Tabs - Scrollable */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full overflow-x-auto flex justify-start gap-1 h-auto p-1">
            <TabsTrigger value="all" className="text-xs px-2 py-1 whitespace-nowrap">הכל ({sortedCustomers.length})</TabsTrigger>
            <TabsTrigger value="hot" className="text-xs px-2 py-1 whitespace-nowrap">חמים ({hotLeads.length})</TabsTrigger>
            <TabsTrigger value="followup" className="text-xs px-2 py-1 whitespace-nowrap">מעקב ({needFollowup.length})</TabsTrigger>
            <TabsTrigger value="viewed" className="text-xs px-2 py-1 whitespace-nowrap">צפו ({viewedProperties.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {renderCustomers(sortedCustomers)}
          </TabsContent>
          <TabsContent value="hot" className="mt-4">
            {renderCustomers(hotLeads)}
          </TabsContent>
          <TabsContent value="followup" className="mt-4">
            {renderCustomers(needFollowup)}
          </TabsContent>
          <TabsContent value="viewed" className="mt-4">
            {renderCustomers(viewedProperties)}
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop: Full Filters Bar */}
      <div className="hidden md:flex flex-row-reverse flex-wrap gap-3 bg-card p-4 rounded-lg">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="חיפוש לפי שם, אימייל או טלפון..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="סטטוס" />
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
            <SelectTrigger className="w-32">
              <SelectValue placeholder="עדיפות" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל העדיפויות</SelectItem>
              <SelectItem value="low">נמוך</SelectItem>
              <SelectItem value="medium">בינוני</SelectItem>
              <SelectItem value="high">גבוה</SelectItem>
              <SelectItem value="urgent">דחוף</SelectItem>
            </SelectContent>
          </Select>

          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="סוכן" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסוכנים</SelectItem>
              {agents.map(agent => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.full_name || agent.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="מיון" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at_desc">חדשים קודם</SelectItem>
              <SelectItem value="created_at_asc">ישנים קודם</SelectItem>
              <SelectItem value="priority_desc">עדיפות גבוהה קודם</SelectItem>
              <SelectItem value="last_contact_asc">דורש תשומת לב</SelectItem>
              <SelectItem value="next_followup_asc">מעקב הבא קודם</SelectItem>
              <SelectItem value="name_asc">לפי שם א-ת</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v)}>
            <ToggleGroupItem value="cards" aria-label="תצוגת כרטיסים">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="תצוגת טבלה">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setPriorityFilter("all");
              setAgentFilter("all");
              setSortBy("created_at_desc");
            }}
          >
            <Filter className="h-4 w-4 ml-1" />
            נקה
          </Button>
        </div>
      </div>

      {/* Desktop Tabs */}
      <Tabs defaultValue="all" className="hidden md:block space-y-4">
        <TabsList>
          <TabsTrigger value="all">כל הלקוחות ({sortedCustomers.length})</TabsTrigger>
          <TabsTrigger value="hot">לידים חמים ({hotLeads.length})</TabsTrigger>
          <TabsTrigger value="followup">דורש מעקב ({needFollowup.length})</TabsTrigger>
          <TabsTrigger value="viewed">צפו בנכסים ({viewedProperties.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {renderCustomers(sortedCustomers)}
        </TabsContent>

        <TabsContent value="hot" className="space-y-4">
          {renderCustomers(hotLeads)}
        </TabsContent>

        <TabsContent value="followup" className="space-y-4">
          {renderCustomers(needFollowup)}
        </TabsContent>

        <TabsContent value="viewed" className="space-y-4">
          {renderCustomers(viewedProperties)}
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
        agents={agents}
      />

      <AddCustomerModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={handleSaveCustomer}
      />
    </div>
  );
}
