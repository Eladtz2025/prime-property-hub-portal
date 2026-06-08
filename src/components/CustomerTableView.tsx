import { useState, useMemo } from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ExpandableCustomerRow } from "@/components/ExpandableCustomerRow";
import { WhatsAppBulkBar } from "@/components/WhatsAppBulkBar";
import { WhatsAppBulkSendDialog } from "@/components/WhatsAppBulkSendDialog";
import type { Customer } from "@/hooks/useCustomerData";
import type { OwnPropertyMatch } from "@/components/customers/CustomerMatchesCell";

interface Agent {
  id: string;
  full_name: string | null;
  email: string;
}

interface CustomerTableViewProps {
  customers: Customer[];
  onSave: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onUpdatePriority: (id: string, priority: string) => void;
  onAssignAgent?: (id: string, agentId: string | null) => void;
  onDeleteCustomer?: (id: string) => void;
  onHideCustomer?: (id: string) => void;
  onUnhideCustomer?: (id: string) => void;
  agents?: Agent[];
  sortBy: string;
  onSortChange: (sort: string) => void;
  isHiddenView?: boolean;
  ownPropertyMatchesMap?: Map<string, OwnPropertyMatch[]>;
}

export const CustomerTableView = ({
  customers,
  onSave,
  onUpdateStatus,
  onUpdatePriority,
  onAssignAgent,
  onDeleteCustomer,
  onHideCustomer,
  onUnhideCustomer,
  agents = [],
  sortBy,
  onSortChange,
  isHiddenView = false,
  ownPropertyMatchesMap,
}: CustomerTableViewProps) => {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const handleToggleExpand = (customerId: string) => {
    setExpandedRowId(prev => prev === customerId ? null : customerId);
  };

  const handleToggleSelect = (customerId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(customerId)) next.delete(customerId);
      else next.add(customerId);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allWithPhone = customers.filter(c => c.phone).map(c => c.id);
      setSelectedIds(new Set(allWithPhone));
    } else {
      setSelectedIds(new Set());
    }
  };

  const customersWithPhone = customers.filter(c => c.phone);
  const allSelected = customersWithPhone.length > 0 && customersWithPhone.every(c => selectedIds.has(c.id));

  const selectedRecipients = customers
    .filter(c => selectedIds.has(c.id) && c.phone)
    .map(c => ({ id: c.id, name: c.name, phone: c.phone }));

  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

  const sortedCustomers = useMemo(() => {
    const parts = sortBy.split('_');
    const dir = parts[parts.length - 1];
    const field = parts.slice(0, parts.length - 1).join('_');
    const asc = dir === 'asc';
    return [...customers].sort((a, b) => {
      if (field === 'name') {
        return asc ? a.name.localeCompare(b.name, 'he') : b.name.localeCompare(a.name, 'he');
      }
      if (field === 'last_contact') {
        const aD = a.last_contact_date || a.created_at;
        const bD = b.last_contact_date || b.created_at;
        return asc ? aD.localeCompare(bD) : bD.localeCompare(aD);
      }
      if (field === 'budget') {
        const aV = a.budget_max ?? 0;
        const bV = b.budget_max ?? 0;
        return asc ? aV - bV : bV - aV;
      }
      if (field === 'priority') {
        const aO = priorityOrder[a.priority] ?? 2;
        const bO = priorityOrder[b.priority] ?? 2;
        return asc ? aO - bO : bO - aO;
      }
      if (field === 'status') {
        return asc ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status);
      }
      if (field === 'property_type') {
        const aT = a.property_type ?? '';
        const bT = b.property_type ?? '';
        return asc ? aT.localeCompare(bT) : bT.localeCompare(aT);
      }
      return 0;
    });
  }, [customers, sortBy]);

  const handleBulkHide = () => {
    Array.from(selectedIds).forEach(id => onHideCustomer?.(id));
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    Array.from(selectedIds).forEach(id => onDeleteCustomer?.(id));
    setSelectedIds(new Set());
    setBulkDeleteDialogOpen(false);
  };

  const SortableHeader = ({ label, sortKey }: { label: string; sortKey: string }) => {
    const parts = sortBy.split('_');
    const curDir = parts[parts.length - 1];
    const curField = parts.slice(0, parts.length - 1).join('_');
    const isActive = curField === sortKey;
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 font-medium hover:bg-transparent"
        onClick={() => onSortChange(isActive && curDir === 'asc' ? `${sortKey}_desc` : `${sortKey}_asc`)}
      >
        {label}
        {isActive ? (
          curDir === 'asc' ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />
        ) : (
          <ArrowUpDown className="h-3 w-3 mr-1 opacity-40" />
        )}
      </Button>
    );
  };

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[40px] text-center">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  onClick={(e) => e.stopPropagation()}
                />
              </TableHead>
              <TableHead className="text-right w-[18%]">
                <SortableHeader label="שם לקוח" sortKey="name" />
              </TableHead>
              <TableHead className="text-right w-[9%]">
                <SortableHeader label="סטטוס" sortKey="status" />
              </TableHead>
              <TableHead className="text-right w-[10%]">
                <SortableHeader label="עסקה" sortKey="property_type" />
              </TableHead>
              <TableHead className="text-right w-[12%]">
                <SortableHeader label="תקציב" sortKey="budget" />
              </TableHead>
              <TableHead className="text-right w-[10%]">
                <SortableHeader label="עדיפות" sortKey="priority" />
              </TableHead>
              <TableHead className="text-right w-[15%]">התאמות</TableHead>
              <TableHead className="text-right w-[13%]">
                <SortableHeader label="קשר אחרון" sortKey="last_contact" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCustomers.map((customer) => (
              <ExpandableCustomerRow
                key={customer.id}
                customer={customer}
                isExpanded={expandedRowId === customer.id}
                onToggleExpand={() => handleToggleExpand(customer.id)}
                onUpdateStatus={onUpdateStatus}
                onUpdatePriority={onUpdatePriority}
                onAssignAgent={onAssignAgent}
                onDeleteCustomer={onDeleteCustomer}
                onHideCustomer={onHideCustomer}
                onUnhideCustomer={onUnhideCustomer}
                onSave={onSave}
                agents={agents}
                isSelected={selectedIds.has(customer.id)}
                onToggleSelect={() => handleToggleSelect(customer.id)}
                ownPropertyMatches={ownPropertyMatchesMap?.get(customer.id)}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <WhatsAppBulkBar
        selectedCount={selectedIds.size}
        onSendClick={() => setBulkDialogOpen(true)}
        onClearSelection={() => setSelectedIds(new Set())}
        onHideClick={handleBulkHide}
        onDeleteClick={() => setBulkDeleteDialogOpen(true)}
        label="לקוחות"
      />

      <WhatsAppBulkSendDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        recipients={selectedRecipients}
        onComplete={() => setSelectedIds(new Set())}
        templateCategory="customers"
      />

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת {selectedIds.size} לקוחות</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק לצמיתות את כל הלקוחות שנבחרו. לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleBulkDelete}
            >
              מחק הכל
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
