import { useState } from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ExpandableCustomerRow } from "@/components/ExpandableCustomerRow";
import { WhatsAppBulkBar } from "@/components/WhatsAppBulkBar";
import { WhatsAppBulkSendDialog } from "@/components/WhatsAppBulkSendDialog";
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
  isHiddenView?: boolean;
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
            <TableHead className="text-right w-[22%]">
              <SortableHeader label="שם לקוח" sortKey="name" />
            </TableHead>
            <TableHead className="text-right w-[14%]">סוג עסקה</TableHead>
            <TableHead className="text-right w-[16%]">תקציב</TableHead>
            <TableHead className="text-right w-[14%]">עדיפות</TableHead>
            <TableHead className="text-right w-[17%]">התאמות</TableHead>
            <TableHead className="text-right w-[17%]">
              <SortableHeader label="קשר אחרון" sortKey="last_contact" />
            </TableHead>
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
