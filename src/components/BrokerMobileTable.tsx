import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Phone, Building2 } from "lucide-react";
import { type BrokerWithPropertyNames } from "@/hooks/useBrokerData";

interface BrokerMobileTableProps {
  brokers: BrokerWithPropertyNames[];
  onEdit: (broker: BrokerWithPropertyNames) => void;
  onDelete: (id: string) => void;
}

export function BrokerMobileTable({ brokers, onEdit, onDelete }: BrokerMobileTableProps) {
  return (
    <div className="space-y-3">
      {brokers.map((broker) => (
        <Card key={broker.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg">{broker.name}</h3>
                {broker.office_name && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {broker.office_name}
                  </p>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(broker)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(broker.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <a 
              href={`tel:${broker.phone}`} 
              className="inline-flex items-center gap-2 text-primary hover:underline mb-3"
            >
              <Phone className="h-4 w-4" />
              {broker.phone}
            </a>

            {(broker.property_names.length > 0 || broker.interested_properties_text) && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-2">דירות מעניינות:</p>
                <div className="flex flex-wrap gap-1">
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
                </div>
              </div>
            )}

            {broker.notes && (
              <p className="text-sm text-muted-foreground mt-2 pt-2 border-t">
                {broker.notes}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
