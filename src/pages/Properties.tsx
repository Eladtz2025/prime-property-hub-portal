import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Search, 
  Phone, 
  Mail, 
  Eye, 
  Edit, 
  User, 
  Calendar,
  ArrowUpDown,
  Map
} from 'lucide-react';
import { Property } from '../types/property';
import { processPropertiesData } from '../utils/dataProcessor';
import { PropertyDetailModal } from '../components/PropertyDetailModal';
import { PropertyEditModal } from '../components/PropertyEditModal';
import { MobilePropertyCard } from '../components/MobilePropertyCard';
import { PropertyMap } from '../components/PropertyMap';
import { PullToRefresh } from '../components/PullToRefresh';
import { useMobileOptimization } from '../hooks/useMobileOptimization';

export const Properties: React.FC = () => {
  const { isMobile } = useMobileOptimization();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'address' | 'ownerName' | 'status' | 'leaseEndDate'>('address');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await processPropertiesData();
      setProperties(data);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtered and sorted properties
  const filteredAndSortedProperties = useMemo(() => {
    let filtered = properties.filter(property => {
      const matchesSearch = 
        property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (property.tenantName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Sort properties
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'leaseEndDate':
          if (!a.leaseEndDate && !b.leaseEndDate) return 0;
          if (!a.leaseEndDate) return 1;
          if (!b.leaseEndDate) return -1;
          return new Date(a.leaseEndDate).getTime() - new Date(b.leaseEndDate).getTime();
        case 'ownerName':
          return a.ownerName.localeCompare(b.ownerName, 'he');
        case 'status':
          return a.status.localeCompare(b.status);
        default: // address
          return a.address.localeCompare(b.address, 'he');
      }
    });

    return filtered;
  }, [properties, searchTerm, statusFilter, sortBy]);

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

  const handleSort = (field: 'address' | 'ownerName' | 'status' | 'leaseEndDate') => {
    setSortBy(field);
  };

  const handleViewDetails = (id: string) => {
    const property = properties.find(p => p.id === id);
    if (property) {
      setSelectedProperty(property);
    }
  };

  const handlePropertyUpdate = (updatedProperty: Property) => {
    setProperties(prev => 
      prev.map(p => p.id === updatedProperty.id ? updatedProperty : p)
    );
    setEditingProperty(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">טוען נתונים...</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-foreground">רשימת נכסים</h2>
          <div className="text-sm text-muted-foreground">
            {filteredAndSortedProperties.length} מתוך {properties.length} נכסים
          </div>
        </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>חיפוש וסינון</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-col md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש לפי כתובת, בעל נכס או שוכר..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background"
            >
              <option value="all">כל הסטטוסים</option>
              <option value="occupied">תפוס</option>
              <option value="vacant">פנוי</option>
              <option value="maintenance">תחזוקה</option>
            </select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setSortBy('address');
              }}
            >
              נקה סינונים
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">רשימה</TabsTrigger>
            <TabsTrigger value="cards">כרטיסים</TabsTrigger>
            <TabsTrigger value="map">מפה</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <PullToRefresh onRefresh={loadData}>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="text-right cursor-pointer hover:bg-muted/50" 
                        onClick={() => handleSort('address')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          כתובת
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="text-right cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('ownerName')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          בעל הנכס
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="text-right">דייר</TableHead>
                      <TableHead 
                        className="text-right cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          סטטוס
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="text-right cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('leaseEndDate')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          סיום חוזה
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="text-right">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedProperties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell className="font-medium text-right">{property.address}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div>
                              <div className="font-medium">{property.ownerName}</div>
                              {property.ownerPhone && (
                                <div className="text-sm text-muted-foreground">{property.ownerPhone}</div>
                              )}
                            </div>
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {property.tenantName ? (
                            <div className="flex items-center justify-end gap-2">
                              <div>
                                <div className="font-medium">{property.tenantName}</div>
                                {property.tenantPhone && (
                                  <div className="text-sm text-muted-foreground">{property.tenantPhone}</div>
                                )}
                              </div>
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className={getStatusColor(property.status)}>
                            {getStatusText(property.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {property.leaseEndDate ? (
                            <div className="flex items-center justify-end gap-2">
                              <span>{new Date(property.leaseEndDate).toLocaleDateString('he-IL')}</span>
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(property.id)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>צפה בפרטי הנכס</TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingProperty(property)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>עריכת פרטי הנכס</TooltipContent>
                            </Tooltip>
                            
                            {property.ownerPhone && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(`tel:${property.ownerPhone}`, '_self')}
                                  >
                                    <Phone className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>התקשר לבעל הנכס</TooltipContent>
                              </Tooltip>
                            )}
                            
                            {property.ownerEmail && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(`mailto:${property.ownerEmail}`, '_self')}
                                  >
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>שלח אימייל לבעל הנכס</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </PullToRefresh>
          </TabsContent>

          <TabsContent value="cards" className="space-y-4">
            <PullToRefresh onRefresh={loadData}>
              <div className="space-y-4">
                {filteredAndSortedProperties.map((property) => (
                  <MobilePropertyCard
                    key={property.id}
                    property={property}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            </PullToRefresh>
          </TabsContent>

          <TabsContent value="map" className="space-y-4">
            <PropertyMap 
              properties={filteredAndSortedProperties}
              onPropertySelect={(property) => handleViewDetails(property.id)}
            />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Property Detail Modal */}
      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          isOpen={true}
          onClose={() => setSelectedProperty(null)}
          onEdit={(property) => {
            setEditingProperty(property);
            setSelectedProperty(null);
          }}
        />
      )}

      {/* Property Edit Modal */}
      {editingProperty && (
        <PropertyEditModal
          property={editingProperty}
          isOpen={true}
          onClose={() => setEditingProperty(null)}
          onSave={handlePropertyUpdate}
        />
      )}
      </div>
    </TooltipProvider>
  );
};