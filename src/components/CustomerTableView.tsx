import { useState } from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { ExpandableCustomerRow } from "@/components/ExpandableCustomerRow";
import type { Customer } from "@/hooks/useCustomerData";

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
}: CustomerTableViewProps) => {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const handleToggleExpand = (customerId: string) => {
    setExpandedRowId(prev => prev === customerId ? null : customerId);
  };

  const SortableHeader = ({ label, sortKey }: { label: string; sortKey: string }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-medium hover:bg-transparent"
      onClick={() => {
        if (sortBy === `${sortKey}_asc`) {
          onSortChange(`${sortKey}_desc`);
        } else {
          onSortChange(`${sortKey}_asc`);
        }
      }}
    >
      {label}
      <ArrowUpDown className="h-3 w-3 mr-1" />
    </Button>
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-right w-[20%]">
              <SortableHeader label="שם לקוח" sortKey="name" />
            </TableHead>
            <TableHead className="text-right w-[12%]">סוג עסקה</TableHead>
            <TableHead className="text-right w-[13%]">תקציב</TableHead>
            <TableHead className="text-right w-[12%]">עדיפות</TableHead>
            <TableHead className="text-right w-[15%]">התאמות</TableHead>
            <TableHead className="text-right w-[16%]">
              <SortableHeader label="קשר אחרון" sortKey="last_contact" />
            </TableHead>
            <TableHead className="text-right w-[12%]">פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
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
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
