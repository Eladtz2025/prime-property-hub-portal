
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Phone, Mail, Calendar, MapPin, Eye } from 'lucide-react';
import { Property } from '../types/property';
import { processPropertiesData } from '../utils/dataProcessor';

export const Properties: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      const data = await processPropertiesData();
      setProperties(data);
      setLoading(false);
    };
    loadData();
  }, []);
  
  // Get unique cities for filter
  const cities = useMemo(() => {
    const citySet = new Set(properties.map(p => p.city).filter(Boolean));
    return Array.from(citySet).sort();
  }, [properties]);

  // Filtered properties
  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      const matchesSearch = 
        property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.tenantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
      const matchesCity = cityFilter === 'all' || property.city === cityFilter;
      
      return matchesSearch && matchesStatus && matchesCity;
    });
  }, [properties, searchTerm, statusFilter, cityFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-green-100 text-green-800 border-green-200';
      case 'vacant': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'maintenance': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    // Remove any non-digits
    const cleaned = phone.replace(/\D/g, '');
    // Format as Israeli phone number
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const handlePropertyClick = (propertyId: string) => {
    navigate(`/properties/${propertyId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">רשימת נכסים</h2>
        <div className="text-sm text-muted-foreground">
          {filteredProperties.length} מתוך {properties.length} נכסים
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            סינון וחיפוש
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש לפי כתובת, שם בעל נכס, שוכר..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                <SelectItem value="occupied">תפוס</SelectItem>
                <SelectItem value="vacant">פנוי</SelectItem>
                <SelectItem value="maintenance">תחזוקה</SelectItem>
              </SelectContent>
            </Select>

            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="עיר" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הערים</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCityFilter('all');
              }}
            >
              נקה סינונים
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <CardTitle>נכסים ({filteredProperties.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">כתובת</TableHead>
                  <TableHead className="text-right">עיר</TableHead>
                  <TableHead className="text-right">סטטוס</TableHead>
                  <TableHead className="text-right">בעל נכס</TableHead>
                  <TableHead className="text-right">שוכר</TableHead>
                  <TableHead className="text-right">שכירות</TableHead>
                  <TableHead className="text-right">תאריך סיום</TableHead>
                  <TableHead className="text-right">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties.slice(0, 50).map((property) => (
                  <TableRow 
                    key={property.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handlePropertyClick(property.id)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {property.address}
                      </div>
                    </TableCell>
                    <TableCell>{property.city}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(property.status)}>
                        {getStatusText(property.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{property.ownerName}</div>
                        {property.ownerPhone && (
                          <div className="text-sm text-muted-foreground">
                            {formatPhoneNumber(property.ownerPhone)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {property.tenantName ? (
                        <div>
                          <div className="font-medium">{property.tenantName}</div>
                          {property.tenantPhone && (
                            <div className="text-sm text-muted-foreground">
                              {formatPhoneNumber(property.tenantPhone)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">אין שוכר</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {property.monthlyRent ? (
                        <span className="font-medium">₪{property.monthlyRent.toLocaleString()}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {property.leaseEndDate ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(property.leaseEndDate).toLocaleDateString('he-IL')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">לא זמין</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePropertyClick(property.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {property.ownerPhone && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`tel:${property.ownerPhone}`, '_self');
                            }}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                        {property.ownerEmail && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`mailto:${property.ownerEmail}`, '_self');
                            }}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredProperties.length > 50 && (
            <div className="mt-4 text-center text-muted-foreground">
              מציג 50 נכסים ראשונים מתוך {filteredProperties.length}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
