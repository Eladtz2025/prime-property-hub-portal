import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, MessageSquare, Edit, Clock, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import type { Customer } from "@/hooks/useCustomerData";

interface Agent {
  id: string;
  full_name: string | null;
  email: string;
}

interface CustomerTableViewProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onUpdatePriority: (id: string, priority: string) => void;
  onAssignAgent?: (id: string, agentId: string | null) => void;
  agents?: Agent[];
  sortBy: string;
  onSortChange: (sort: string) => void;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-500 text-white',
  contacted: 'bg-yellow-500 text-black',
  active: 'bg-green-500 text-white',
  viewing_scheduled: 'bg-purple-500 text-white',
  offer_made: 'bg-orange-500 text-white',
  closed_won: 'bg-emerald-600 text-white',
  closed_lost: 'bg-gray-500 text-white',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-200 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  new: 'חדש',
  contacted: 'נוצר קשר',
  active: 'פעיל',
  viewing_scheduled: 'צפייה קבועה',
  offer_made: 'הצעה בוצעה',
  closed_won: 'נסגר בהצלחה',
  closed_lost: 'נסגר ללא הצלחה',
};

const priorityLabels: Record<string, string> = {
  low: 'נמוך',
  medium: 'בינוני',
  high: 'גבוה',
  urgent: 'דחוף',
};

const getTimeSinceContact = (lastContactDate: string | null, createdAt: string) => {
  const date = lastContactDate ? new Date(lastContactDate) : new Date(createdAt);
  const daysDiff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) return { text: 'היום', color: 'text-green-600', bg: 'bg-green-100' };
  if (daysDiff === 1) return { text: 'אתמול', color: 'text-green-600', bg: 'bg-green-100' };
  if (daysDiff <= 3) return { text: `${daysDiff} ימים`, color: 'text-green-600', bg: 'bg-green-100' };
  if (daysDiff <= 7) return { text: `${daysDiff} ימים`, color: 'text-yellow-600', bg: 'bg-yellow-100' };
  if (daysDiff <= 14) return { text: `${daysDiff} ימים`, color: 'text-orange-600', bg: 'bg-orange-100' };
  return { text: `${daysDiff} ימים`, color: 'text-red-600', bg: 'bg-red-100' };
};

export const CustomerTableView = ({
  customers,
  onEdit,
  onUpdateStatus,
  onUpdatePriority,
  onAssignAgent,
  agents = [],
  sortBy,
  onSortChange,
}: CustomerTableViewProps) => {
  const handleWhatsApp = (customer: Customer) => {
    if (customer.phone) {
      const message = encodeURIComponent(
        `שלום ${customer.name}, אני מ-City Market נדל"ן.\n` +
        (customer.preferred_cities?.length ? `ראיתי שאתה מחפש דירה ב${customer.preferred_cities[0]}` : 'ראיתי שאתה מחפש דירה') +
        `.\nיש לי כמה נכסים שיכולים להתאים לך, מתי נוח לדבר?`
      );
      window.open(`https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
    }
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
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
            <TableHead className="text-right">
              <SortableHeader label="שם לקוח" sortKey="name" />
            </TableHead>
            <TableHead className="text-right">טלפון</TableHead>
            <TableHead className="text-right">סטטוס</TableHead>
            <TableHead className="text-right">עדיפות</TableHead>
            <TableHead className="text-right">סוכן</TableHead>
            <TableHead className="text-right">
              <SortableHeader label="קשר אחרון" sortKey="last_contact" />
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader label="מעקב הבא" sortKey="next_followup" />
            </TableHead>
            <TableHead className="text-right">פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => {
            const timeSince = getTimeSinceContact(customer.last_contact_date, customer.created_at);
            const assignedAgent = agents.find(a => a.id === customer.assigned_agent_id);

            return (
              <TableRow key={customer.id} className="hover:bg-muted/30">
                <TableCell className="font-medium text-right">
                  <div>
                    <div>{customer.name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                      {customer.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {customer.phone || '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Select 
                    value={customer.status} 
                    onValueChange={(value) => onUpdateStatus(customer.id, value)}
                  >
                    <SelectTrigger className="h-7 text-xs w-[100px] border-0 bg-transparent p-0">
                      <Badge className={`${statusColors[customer.status]} text-xs`}>
                        {statusLabels[customer.status]}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">חדש</SelectItem>
                      <SelectItem value="contacted">נוצר קשר</SelectItem>
                      <SelectItem value="active">פעיל</SelectItem>
                      <SelectItem value="viewing_scheduled">צפייה קבועה</SelectItem>
                      <SelectItem value="offer_made">הצעה בוצעה</SelectItem>
                      <SelectItem value="closed_won">נסגר בהצלחה</SelectItem>
                      <SelectItem value="closed_lost">נסגר ללא הצלחה</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Select 
                    value={customer.priority} 
                    onValueChange={(value) => onUpdatePriority(customer.id, value)}
                  >
                    <SelectTrigger className="h-7 text-xs w-[80px] border-0 bg-transparent p-0">
                      <Badge className={`${priorityColors[customer.priority]} text-xs`}>
                        {priorityLabels[customer.priority]}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">נמוך</SelectItem>
                      <SelectItem value="medium">בינוני</SelectItem>
                      <SelectItem value="high">גבוה</SelectItem>
                      <SelectItem value="urgent">דחוף</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  {onAssignAgent && agents.length > 0 ? (
                    <Select 
                      value={customer.assigned_agent_id || "none"} 
                      onValueChange={(value) => onAssignAgent(customer.id, value === "none" ? null : value)}
                    >
                      <SelectTrigger className="h-7 text-xs w-[100px]">
                        <SelectValue placeholder="בחר" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-</SelectItem>
                        {agents.map(agent => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.full_name || agent.email.split('@')[0]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      {assignedAgent?.full_name || assignedAgent?.email.split('@')[0] || '-'}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${timeSince.bg} ${timeSince.color}`}>
                    <Clock className="h-3 w-3" />
                    {timeSince.text}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {customer.next_followup_date ? (
                    <span className="text-xs">
                      {format(new Date(customer.next_followup_date), 'dd/MM HH:mm', { locale: he })}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {customer.phone && (
                      <>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 w-7 p-0"
                          onClick={() => handleCall(customer.phone!)}
                        >
                          <Phone className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
                          onClick={() => handleWhatsApp(customer)}
                        >
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 w-7 p-0"
                      onClick={() => onEdit(customer)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
