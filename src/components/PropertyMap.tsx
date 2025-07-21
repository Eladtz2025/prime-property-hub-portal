import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Home, User } from 'lucide-react';
import { Property } from '@/types/property';

interface PropertyMapProps {
  properties: Property[];
  onPropertySelect?: (property: Property) => void;
}

export const PropertyMap: React.FC<PropertyMapProps> = ({ 
  properties, 
  onPropertySelect 
}) => {
  // Mock coordinates for Tel Aviv properties - in a real app you'd use geocoding
  const propertiesWithCoords = useMemo(() => {
    return properties.map((property, index) => ({
      ...property,
      lat: 32.0853 + (Math.random() - 0.5) * 0.02, // Tel Aviv area
      lng: 34.7818 + (Math.random() - 0.5) * 0.02,
    }));
  }, [properties]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return '#10b981'; // green
      case 'vacant': return '#f59e0b'; // orange
      case 'maintenance': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'occupied': return 'תפוס';
      case 'vacant': return 'פנוי';
      case 'maintenance': return 'תחזוקה';
      default: return status;
    }
  };

  // Group properties by area for the list view
  const groupedProperties = useMemo(() => {
    const groups: { [key: string]: Property[] } = {};
    properties.forEach(property => {
      const area = property.city || 'אזור לא ידוע';
      if (!groups[area]) groups[area] = [];
      groups[area].push(property);
    });
    return groups;
  }, [properties]);

  return (
    <div className="space-y-6">
      {/* Map Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            מפת נכסים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-lg h-96 overflow-hidden">
            {/* Map background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-green-100/50"></div>
            
            {/* Street grid pattern */}
            <div className="absolute inset-0 opacity-20">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Property markers */}
            {propertiesWithCoords.slice(0, 15).map((property, index) => (
              <button
                key={property.id}
                onClick={() => onPropertySelect?.(property)}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group hover:z-10 transition-all duration-200 hover:scale-110"
                style={{
                  left: `${20 + (index % 5) * 15 + Math.random() * 10}%`,
                  top: `${20 + Math.floor(index / 5) * 25 + Math.random() * 15}%`,
                }}
              >
                {/* Marker */}
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white shadow-lg relative"
                  style={{ backgroundColor: getStatusColor(property.status) }}
                >
                  <div className="absolute inset-0 rounded-full animate-ping opacity-75" 
                       style={{ backgroundColor: getStatusColor(property.status) }}></div>
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                  <div className="text-xs font-medium">{property.address}</div>
                  <div className="text-xs text-muted-foreground">{property.ownerName}</div>
                  <Badge className="mt-1 text-xs" style={{ backgroundColor: getStatusColor(property.status) }}>
                    {getStatusText(property.status)}
                  </Badge>
                </div>
              </button>
            ))}

            {/* Legend */}
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg p-3">
              <div className="text-xs font-medium mb-2">מקרא</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getStatusColor('occupied') }}></div>
                  <span className="text-xs">תפוס</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getStatusColor('vacant') }}></div>
                  <span className="text-xs">פנוי</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getStatusColor('maintenance') }}></div>
                  <span className="text-xs">תחזוקה</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties by Area */}
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(groupedProperties).map(([area, areaProperties]) => (
          <Card key={area}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Home className="h-4 w-4" />
                {area}
                <Badge variant="secondary">{areaProperties.length} נכסים</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {areaProperties.slice(0, 5).map(property => (
                  <button
                    key={property.id}
                    onClick={() => onPropertySelect?.(property)}
                    className="w-full text-right p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{property.address}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {property.ownerName}
                        </div>
                      </div>
                      <Badge 
                        className="text-xs text-white border-0"
                        style={{ backgroundColor: getStatusColor(property.status) }}
                      >
                        {getStatusText(property.status)}
                      </Badge>
                    </div>
                  </button>
                ))}
                {areaProperties.length > 5 && (
                  <div className="text-xs text-muted-foreground text-center pt-2">
                    ועוד {areaProperties.length - 5} נכסים...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};