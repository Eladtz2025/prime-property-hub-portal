import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Coins, Building2, MapPin, MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Customer } from "@/hooks/useCustomerData";

interface Property {
  id: string;
  title: string | null;
  address: string;
  city: string;
  neighborhood: string | null;
  monthly_rent: number | null;
  rooms: number | null;
  property_size: number | null;
  property_type: string | null;
}

interface CustomerPropertyMatchesProps {
  customer: Customer;
  maxResults?: number;
  onSendToCustomer?: (property: Property) => void;
}

export const CustomerPropertyMatches = ({ 
  customer, 
  maxResults = 5,
  onSendToCustomer 
}: CustomerPropertyMatchesProps) => {
  const [matchingProperties, setMatchingProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const findMatches = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('properties')
          .select('id, title, address, city, neighborhood, monthly_rent, rooms, property_size, property_type')
          .eq('available', true);

        // Filter by property type
        if (customer.property_type && customer.property_type !== 'both') {
          query = query.eq('property_type', customer.property_type);
        }

        // Filter by budget
        if (customer.budget_max) {
          query = query.lte('monthly_rent', customer.budget_max);
        }
        if (customer.budget_min) {
          query = query.gte('monthly_rent', customer.budget_min);
        }

        // Filter by rooms
        if (customer.rooms_min) {
          query = query.gte('rooms', customer.rooms_min);
        }
        if (customer.rooms_max) {
          query = query.lte('rooms', customer.rooms_max);
        }

        // Filter by city
        if (customer.preferred_cities && customer.preferred_cities.length > 0) {
          query = query.in('city', customer.preferred_cities);
        }

        // Filter by neighborhood
        if (customer.preferred_neighborhoods && customer.preferred_neighborhoods.length > 0) {
          query = query.in('neighborhood', customer.preferred_neighborhoods);
        }

        const { data, error } = await query.limit(maxResults);

        if (error) throw error;
        setMatchingProperties(data || []);
      } catch (error) {
        console.error('Error finding matching properties:', error);
        setMatchingProperties([]);
      } finally {
        setLoading(false);
      }
    };

    findMatches();
  }, [customer, maxResults]);

  const handleSendWhatsApp = (property: Property) => {
    if (!customer.phone) return;
    
    const message = encodeURIComponent(
      `שלום ${customer.name}!\n\n` +
      `מצאתי נכס שיכול להתאים לך:\n` +
      `📍 ${property.address}, ${property.city}\n` +
      (property.rooms ? `🛏️ ${property.rooms} חדרים\n` : '') +
      (property.property_size ? `📐 ${property.property_size} מ"ר\n` : '') +
      (property.monthly_rent ? `💰 ₪${property.monthly_rent.toLocaleString()} לחודש\n` : '') +
      `\nמעוניין לתאם צפייה?`
    );
    window.open(`https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="mr-2 text-sm text-muted-foreground">מחפש נכסים מתאימים...</span>
      </div>
    );
  }

  if (matchingProperties.length === 0) {
    return (
      <div className="text-center p-4 text-muted-foreground text-sm">
        לא נמצאו נכסים מתאימים לקריטריונים של הלקוח
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <Home className="h-4 w-4" />
          נכסים מתאימים ({matchingProperties.length})
        </h4>
      </div>
      
      <div className="space-y-2">
        {matchingProperties.map((property) => (
          <Card key={property.id} className="p-3">
            <div className="flex flex-row-reverse justify-between items-start gap-3">
              <div className="flex-1 text-right space-y-1">
                <h5 className="font-medium text-sm">
                  {property.title || property.address}
                </h5>
                <div className="flex flex-row-reverse flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {property.city}
                    {property.neighborhood && `, ${property.neighborhood}`}
                  </span>
                  {property.rooms && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {property.rooms} חדרים
                    </span>
                  )}
                  {property.monthly_rent && (
                    <span className="flex items-center gap-1">
                      <Coins className="h-3 w-3" />
                      ₪{property.monthly_rent.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              
              {customer.phone && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs shrink-0"
                  onClick={() => handleSendWhatsApp(property)}
                >
                  <MessageSquare className="h-3 w-3 ml-1 text-green-600" />
                  שלח
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
