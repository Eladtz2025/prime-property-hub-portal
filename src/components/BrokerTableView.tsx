import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Phone, Building2 } from "lucide-react";
import { type BrokerWithPropertyNames } from "@/hooks/useBrokerData";

interface BrokerTableViewProps {
  brokers: BrokerWithPropertyNames[];
  onEdit: (broker: BrokerWithPropertyNames) => void;
  onDelete: (id: string) => void;
}

export function BrokerTableView({ brokers, onEdit, onDelete }: BrokerTableViewProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">שם</TableHead>
            <TableHead className="text-right">טלפון</TableHead>
            <TableHead className="text-right">משרד</TableHead>
            <TableHead className="text-right">דירות מעניינות</TableHead>
            <TableHead className="text-right w-24">פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {brokers.map((broker) => (
            <TableRow key={broker.id}>
              <TableCell className="font-medium">{broker.name}</TableCell>
              <TableCell>
                <a href={`tel:${broker.phone}`} className="flex items-center gap-1 text-primary hover:underline">
                  <Phone className="h-3 w-3" />
                  {broker.phone}
                </a>
              </TableCell>
              <TableCell>
                {broker.office_name ? (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    {broker.office_name}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1 max-w-md">
                  {broker.property_names.map((name, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {name}
                    </Badge>
                  ))}
                  {broker.interested_properties_text && (
                    <Badge variant="outline" className="text-xs">
                      {broker.interested_properties_text}
                    </Badge>
                  )}
                  {broker.property_names.length === 0 && !broker.interested_properties_text && (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(broker)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(broker.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
