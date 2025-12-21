import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Customer } from "@/hooks/useCustomerData";

interface CustomerMobileTableProps {
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-500',
  contacted: 'bg-yellow-500',
  active: 'bg-green-500',
  viewing_scheduled: 'bg-purple-500',
  offer_made: 'bg-orange-500',
  closed_won: 'bg-emerald-600',
  closed_lost: 'bg-gray-400',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-400',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

const statusLabels: Record<string, string> = {
  new: 'חדש',
  contacted: 'קשר',
  active: 'פעיל',
  viewing_scheduled: 'צפייה',
  offer_made: 'הצעה',
  closed_won: '✓',
  closed_lost: '✗',
};

const priorityLabels: Record<string, string> = {
  low: 'נמוך',
  medium: 'בינוני',
  high: 'גבוה',
  urgent: 'דחוף',
};

const getTimeAgo = (lastContactDate: string | null, createdAt: string) => {
  const date = lastContactDate ? new Date(lastContactDate) : new Date(createdAt);
  const daysDiff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) return { text: 'היום', color: 'text-green-600' };
  if (daysDiff === 1) return { text: 'אתמול', color: 'text-green-600' };
  if (daysDiff <= 3) return { text: `${daysDiff}י`, color: 'text-green-600' };
  if (daysDiff <= 7) return { text: `${daysDiff}י`, color: 'text-yellow-600' };
  if (daysDiff <= 14) return { text: `${daysDiff}י`, color: 'text-orange-600' };
  return { text: `${daysDiff}י`, color: 'text-red-600' };
};

export const CustomerMobileTable = ({ customers, onSelectCustomer }: CustomerMobileTableProps) => {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-right font-semibold py-2 px-2 text-xs">שם</TableHead>
            <TableHead className="text-center font-semibold py-2 px-1 text-xs w-14">סטטוס</TableHead>
            <TableHead className="text-center font-semibold py-2 px-1 text-xs w-14">עדיפות</TableHead>
            <TableHead className="text-center font-semibold py-2 px-1 text-xs w-12">זמן</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => {
            const timeAgo = getTimeAgo(customer.last_contact_date, customer.created_at);
            
            return (
              <TableRow
                key={customer.id}
                className="cursor-pointer active:bg-muted/80 transition-colors"
                onClick={() => onSelectCustomer(customer)}
              >
                <TableCell className="py-2.5 px-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-sm truncate max-w-[140px]">
                      {customer.name}
                    </span>
                    {customer.phone && (
                      <span className="text-[10px] text-muted-foreground truncate">
                        {customer.phone}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-2.5 px-1 text-center">
                  <span 
                    className={`inline-flex items-center justify-center w-full px-1.5 py-0.5 rounded text-[10px] font-medium text-white ${statusColors[customer.status]}`}
                  >
                    {statusLabels[customer.status]}
                  </span>
                </TableCell>
                <TableCell className="py-2.5 px-1 text-center">
                  <span 
                    className={`inline-flex items-center justify-center w-full px-1.5 py-0.5 rounded text-[10px] font-medium text-white ${priorityColors[customer.priority]}`}
                  >
                    {priorityLabels[customer.priority]}
                  </span>
                </TableCell>
                <TableCell className={`py-2.5 px-1 text-center text-xs font-medium ${timeAgo.color}`}>
                  {timeAgo.text}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
