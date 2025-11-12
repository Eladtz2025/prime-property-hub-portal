import React, { useState, useMemo, memo, useEffect } from 'react';
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
import { Pagination } from "@/components/ui/pagination";
import { 
  Search, 
  Phone, 
  Mail, 
  Eye, 
  Edit, 
  User, 
  Calendar,
  ArrowUpDown,
  Map,
  Copy,
  Users,
  Plus,
  Trash2
} from 'lucide-react';
import { Property } from '../types/property';
import { PropertyDetailModal } from '../components/PropertyDetailModal';
import { PropertyEditModal } from '../components/PropertyEditModal';
import { AddPropertyModal } from '../components/AddPropertyModal';
import { MobilePropertyCard } from '../components/MobilePropertyCard';
import { PropertyWhatsAppHistory } from '../components/PropertyWhatsAppHistory';
import { PullToRefresh } from '../components/PullToRefresh';
import { PropertyListSkeleton } from '../components/PropertyListSkeleton';
import { PropertyTableSkeleton } from '../components/PropertyTableSkeleton';
import { PropertyWhatsAppTab } from '../components/PropertyWhatsAppTab';
import { WhatsAppAutomations } from '../components/WhatsAppAutomations';

import { SearchHighlight } from '../components/SearchHighlight';
import { useMobileOptimization } from '../hooks/useMobileOptimization';
import { usePropertyData } from '../hooks/usePropertyData';
import { useAdvancedSearch } from '../hooks/useAdvancedSearch';
import { usePagination } from '../hooks/usePagination';

import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { canViewPhoneNumbers, formatPhoneDisplay } from '@/utils/permissions';
import { updateManagementPropertiesToElad } from '@/utils/updateManagementProperties';
import { supabase } from '@/integrations/supabase/client';

const OptimizedMobilePropertyCard = memo(MobilePropertyCard);

export const Properties: React.FC = memo(() => {
  const { isMobile } = useMobileOptimization();
  const { toast } = useToast();
  const { permissions, hasPermission } = useAuth();
  const canViewPhone = canViewPhoneNumbers(permissions);
  const canCreateProperties = hasPermission('properties', 'create');
  const canEditProperties = hasPermission('properties', 'update');
  const canDeleteProperties = hasPermission('properties', 'delete');
  const [sortBy, setSortBy] = useState<'address' | 'ownerName' | 'status' | 'leaseEndDate'>('address');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const { 
    properties, 
    isLoading,
    addProperty,
    updateProperty, 
    deleteProperty,
    isUpdatingProperty,
    refetch 
  } = usePropertyData();

  const {
    filters,
    setFilters,
    filteredProperties: searchFilteredProperties,
    clearFilters,
    ownerPropertyCounts
  } = useAdvancedSearch(properties);

  const handleRefresh = async () => {
    await refetch();
  };

  // Auto-assign management properties and update owner info on first load
  useEffect(() => {
    const setupManagementProperties = async () => {
      try {
        // Update owner info for management properties
        const updateResult = await updateManagementPropertiesToElad();
        if (updateResult.success && updateResult.updated && updateResult.updated > 0) {
          console.log(`Updated ${updateResult.updated} management properties`);
        }

        // Assign management properties to current user
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const response = await fetch(
            `https://jswumsdymlooeobrxict.supabase.co/functions/v1/assign-management-properties`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
            }
          );
          
          const result = await response.json();
          if (result.success && result.assigned > 0) {
            console.log(`Assigned ${result.assigned} management properties`);
            await refetch();
          }
        }
      } catch (error) {
        console.error('Error setting up management properties:', error);
      }
    };
    
    setupManagementProperties();
  }, []);

  const getOwnerPropertyCount = (property: Property) => {
    const ownerKey = `${property.ownerName}-${property.ownerPhone || ''}`;
    return ownerPropertyCounts[ownerKey] || 1;
  };

  const filteredAndSortedProperties = useMemo(() => {
    let filtered = [...searchFilteredProperties];

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
  }, [searchFilteredProperties, sortBy]);

  const {
    currentPage,
    totalPages,
    paginatedData: paginatedProperties,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    canGoNext,
    canGoPrevious,
    startIndex,
    endIndex,
    totalItems
  } = usePagination({ 
    data: filteredAndSortedProperties, 
    itemsPerPage: isMobile ? 10 : 20 
  });

  const propertiesWithWhatsApp = useMemo(() => {
    return filteredAndSortedProperties.filter(property => property.ownerPhone && property.ownerPhone.trim() !== '');
  }, [filteredAndSortedProperties]);

  const handleExportCSV = () => {
    const headers = [
      'כתובת',
      'שם בעל הנכס',
      'טלפון בעל הנכס',
      'אימייל בעל הנכס',
      'שם דייר',
      'טלפון דייר',
      'אימייל דייר',
      'סטטוס',
      'תאריך סיום חוזה',
      'שכר דירה',
      'הערות'
    ];
    
    const csvRows = [
      headers.join(','),
      ...filteredAndSortedProperties.map(property => [
        `"${property.address}"`,
        `"${property.ownerName}"`,
        `"${property.ownerPhone || ''}"`,
        `"${property.ownerEmail || ''}"`,
        `"${property.tenantName || ''}"`,
        `"${property.tenantPhone || ''}"`,
        `"${property.tenantEmail || ''}"`,
        `"${getStatusText(property.status)}"`,
        `"${property.leaseEndDate ? new Date(property.leaseEndDate).toLocaleDateString('he-IL') : ''}"`,
        `"${property.monthlyRent || ''}"`,
        `"${property.notes || ''}"`
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    const BOM = '\uFEFF'; // UTF-8 BOM for proper Hebrew display
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `רשימת_נכסים_${new Date().toLocaleDateString('he-IL').replace(/\./g, '-')}.csv`;
    link.click();
    
    toast({
      title: "הקובץ יוצא!",
      description: `${filteredAndSortedProperties.length} נכסים יוצאו לקובץ CSV`,
    });
  };

  const handleCreateWhatsAppGroup = () => {
    const phoneNumbers = propertiesWithWhatsApp
      .map(p => p.ownerPhone)
      .filter(phone => phone)
      .join(',');
    
    const groupUrl = `https://wa.me/qr/group?phones=${phoneNumbers}`;
    window.open(groupUrl, '_blank');
  };

  const handleExportContacts = () => {
    const csvContent = [
      'שם,טלפון,כתובת',
      ...propertiesWithWhatsApp.map(p => `${p.ownerName},${p.ownerPhone},${p.address}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'אנשי_קשר_נכסים.csv';
    link.click();
  };

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

  const getPropertyTypeText = (type: string | undefined) => {
    switch (type) {
      case 'rental': return 'השכרה';
      case 'sale': return 'מכירה';
      case 'management': return 'ניהול';
      default: return 'השכרה';
    }
  };

  const getPropertyTypeColor = (type: string | undefined) => {
    switch (type) {
      case 'sale': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'management': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-emerald-100 text-emerald-800 border-emerald-200'; // rental
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
    updateProperty(updatedProperty);
    setEditingProperty(null);
  };

  const handleDeleteProperty = (property: Property) => {
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את הנכס "${property.address}"?`)) {
      deleteProperty(property.id);
      toast({
        title: "הנכס נמחק בהצלחה",
        description: `הנכס ${property.address} נמחק מהמערכת`,
      });
    }
  };

  if (isLoading) {
    return (
      <TooltipProvider>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className={`font-bold text-foreground ${isMobile ? 'text-xl' : 'text-3xl'}`}>רשימת נכסים</h2>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className={isMobile ? 'text-lg' : 'text-xl'}>חיפוש וסינון</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 flex-col md:flex-row">
                <div className="relative flex-1">
                  <Input disabled placeholder="טוען..." />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            {isMobile ? <PropertyListSkeleton /> : <PropertyTableSkeleton />}
          </Card>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className={`font-bold text-foreground ${isMobile ? 'text-xl' : 'text-3xl'}`}>רשימת נכסים</h2>
          <div className="flex items-center gap-3">
            <div className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {startIndex}-{endIndex} מתוך {totalItems} נכסים
            </div>
            {canCreateProperties && (
              <Button onClick={() => setShowAddModal(true)} size={isMobile ? "sm" : "default"}>
                <Plus className="h-4 w-4 mr-2" />
                הוסף נכס
              </Button>
            )}
          </div>
        </div>

        {/* Simple Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="חיפוש בנכסים... (כתובת, שם בעל נכס, טלפון וכו')"
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="pr-10"
              />
            </div>
            {filters.searchTerm && (
              <div className="mt-2 text-sm text-muted-foreground">
                נמצאו {filteredAndSortedProperties.length} תוצאות
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card>
          <Tabs defaultValue={isMobile ? "list" : "list"} className="w-full" dir="rtl">
            <TabsList className="grid w-full grid-cols-4 justify-start">
              <TabsTrigger value="list" className="text-xs md:text-sm">
                {isMobile ? "רשימה" : "רשימה"}
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="text-xs md:text-sm">
                {isMobile ? "הודעות" : "שליחת הודעות"}
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs md:text-sm">
                {isMobile ? "היסטוריה" : "היסטורית שיחות"}
              </TabsTrigger>
              <TabsTrigger value="automations" className="text-xs md:text-sm">
                {isMobile ? "אוטומציות" : "אוטומציות ווטסאפ"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              <PullToRefresh onRefresh={handleRefresh}>
                {isMobile ? (
                  <div className="space-y-3 px-2">
                    {paginatedProperties.map((property) => (
                      <OptimizedMobilePropertyCard
                        key={property.id}
                        property={property}
                        onViewDetails={handleViewDetails}
                        onEdit={setEditingProperty}
                        onDelete={handleDeleteProperty}
                        ownerPropertyCount={getOwnerPropertyCount(property)}
                        searchTerm={filters.searchTerm}
                        canEdit={canEditProperties}
                      />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead 
                            className="text-right cursor-pointer hover:bg-muted/50 px-4 py-3" 
                            onClick={() => handleSort('address')}
                          >
                            <div className="flex items-center justify-end gap-2">
                              כתובת
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead 
                            className="text-right cursor-pointer hover:bg-muted/50 px-4 py-3 border-l border-border"
                            onClick={() => handleSort('ownerName')}
                          >
                            <div className="flex items-center justify-end gap-2">
                              בעל הנכס
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead className="text-right px-4 py-3 border-l border-border">סוג הנכס</TableHead>
                          <TableHead 
                            className="text-right cursor-pointer hover:bg-muted/50 px-4 py-3 border-l border-border"
                            onClick={() => handleSort('status')}
                          >
                            <div className="flex items-center justify-end gap-2">
                              סטטוס
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead 
                            className="text-right cursor-pointer hover:bg-muted/50 px-4 py-3 border-l border-border"
                            onClick={() => handleSort('leaseEndDate')}
                          >
                            <div className="flex items-center justify-end gap-2">
                              סיום חוזה
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead className="text-right px-4 py-3 border-l border-border">פעולות</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedProperties.map((property) => (
                          <TableRow key={property.id} className="hover:bg-muted/50">
                            <TableCell className="font-semibold text-base text-foreground text-right px-4 py-3 border-l border-border">
                              <SearchHighlight 
                                text={property.address} 
                                searchTerm={filters.searchTerm}
                              />
                            </TableCell>
                            <TableCell className="text-right px-4 py-3 border-l border-border">
                              <div className="flex items-center justify-end gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <div className="font-medium">
                                      <SearchHighlight 
                                        text={property.ownerName} 
                                        searchTerm={filters.searchTerm}
                                      />
                                    </div>
                                    {getOwnerPropertyCount(property) > 1 && (
                                      <Badge variant="secondary" className="text-xs">
                                        {getOwnerPropertyCount(property)} נכסים
                                      </Badge>
                                    )}
                                  </div>
                                   {property.ownerPhone && (
                                      <div className="text-sm text-muted-foreground">
                                        <SearchHighlight 
                                          text={formatPhoneDisplay(property.ownerPhone, canViewPhone)} 
                                          searchTerm={filters.searchTerm}
                                        />
                                      </div>
                                   )}
                                </div>
                                <User className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </TableCell>
                            <TableCell className="text-right px-4 py-3 border-l border-border">
                              <Badge 
                                variant="outline" 
                                className={`${getPropertyTypeColor(property.property_type)} text-sm`}
                              >
                                {getPropertyTypeText(property.property_type)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right px-4 py-3 border-l border-border">
                              <Badge className={`${getStatusColor(property.status)} text-sm`}>
                                {getStatusText(property.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right px-4 py-3 border-l border-border">
                              {property.leaseEndDate ? (
                                <div className="flex items-center justify-end gap-2">
                                  <span className="text-sm">{new Date(property.leaseEndDate).toLocaleDateString('he-IL')}</span>
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right px-4 py-3 border-l border-border">
                              <div className="flex items-center justify-end gap-3">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleViewDetails(property.id)}
                                      className="h-9 w-9"
                                    >
                                      <Eye className="h-4 w-4 text-primary" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>צפה בפרטי הנכס</TooltipContent>
                                </Tooltip>
                                
                                {canEditProperties && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditingProperty(property)}
                                        className="h-9 w-9"
                                      >
                                        <Edit className="h-4 w-4 text-primary" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>עריכת פרטי הנכס</TooltipContent>
                                  </Tooltip>
                                 )}
                                 
                                  {property.ownerPhone && canViewPhone && (
                                   <Tooltip>
                                       <TooltipTrigger asChild>
                                         <Button
                                           variant="ghost"
                                           size="icon"
                                           onClick={() => window.open(`tel:${property.ownerPhone}`, '_self')}
                                           className="h-9 w-9"
                                         >
                                           <Phone className="h-4 w-4 text-primary" />
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
                                         size="icon"
                                         onClick={() => window.open(`mailto:${property.ownerEmail}`, '_self')}
                                         className="h-9 w-9"
                                       >
                                         <Mail className="h-4 w-4 text-primary" />
                                       </Button>
                                     </TooltipTrigger>
                                     <TooltipContent>שלח אימייל לבעל הנכס</TooltipContent>
                                   </Tooltip>
                                 )}

                                 {canEditProperties && (
                                   <Tooltip>
                                     <TooltipTrigger asChild>
                                       <Button
                                         variant="ghost"
                                         size="icon"
                                         onClick={() => handleDeleteProperty(property)}
                                         className="text-destructive hover:text-destructive h-9 w-9"
                                       >
                                         <Trash2 className="h-4 w-4" />
                                       </Button>
                                     </TooltipTrigger>
                                     <TooltipContent>מחק נכס</TooltipContent>
                                   </Tooltip>
                                 )}
                               </div>
                             </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                )}
                
                {/* Pagination for Table */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousPage}
                      disabled={!canGoPrevious}
                    >
                      הקודם
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      עמוד {currentPage} מתוך {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={!canGoNext}
                    >
                      הבא
                    </Button>
                  </div>
                )}
              </PullToRefresh>
            </TabsContent>

            <TabsContent value="automations" className="space-y-4">
              <WhatsAppAutomations />
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <PropertyWhatsAppHistory 
                properties={filteredAndSortedProperties}
                onPropertySelect={(property) => handleViewDetails(property.id)}
              />
            </TabsContent>

            <TabsContent value="whatsapp">
              <PropertyWhatsAppTab 
                properties={filteredAndSortedProperties}
                searchTerm={filters.searchTerm}
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

        {/* Add Property Modal */}
        <AddPropertyModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onPropertyAdded={(newProperty) => {
            addProperty(newProperty);
            setShowAddModal(false);
          }}
        />
      </div>
    </TooltipProvider>
  );
});
