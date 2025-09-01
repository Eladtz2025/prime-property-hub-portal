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
  MessageSquare,
  Copy,
  Users
} from 'lucide-react';
import { Property } from '../types/property';
import { PropertyDetailModal } from '../components/PropertyDetailModal';
import { PropertyEditModal } from '../components/PropertyEditModal';
import { MobilePropertyCard } from '../components/MobilePropertyCard';
import { PropertyMap } from '../components/PropertyMap';
import { PullToRefresh } from '../components/PullToRefresh';
import { PropertyListSkeleton } from '../components/PropertyListSkeleton';
import { PropertyTableSkeleton } from '../components/PropertyTableSkeleton';
import { AdvancedSearchFilters } from '../components/AdvancedSearchFilters';
import { SearchHighlight } from '../components/SearchHighlight';
import { useMobileOptimization } from '../hooks/useMobileOptimization';
import { usePropertyData } from '../hooks/usePropertyData';
import { useAdvancedSearch } from '../hooks/useAdvancedSearch';
import { usePagination } from '../hooks/usePagination';
import { openWhatsApp, getPropertiesWithPhones } from '../utils/whatsappHelper';
import { useToast } from "@/hooks/use-toast";

const OptimizedMobilePropertyCard = memo(MobilePropertyCard);

export const Properties: React.FC = memo(() => {
  const { isMobile } = useMobileOptimization();
  const { toast } = useToast();
  const [sortBy, setSortBy] = useState<'address' | 'ownerName' | 'status' | 'leaseEndDate'>('address');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  
  const { 
    properties, 
    isLoading, 
    updateProperty, 
    isUpdatingProperty,
    refetch 
  } = usePropertyData();

  const {
    filters,
    setFilters,
    filteredProperties: searchFilteredProperties,
    savedSearches,
    saveSearch,
    loadSearch,
    deleteSearch,
    clearFilters,
    initializeFilters,
    maxPrice,
    maxOwnerCount,
    ownerPropertyCounts
  } = useAdvancedSearch(properties);

  // Initialize filters when properties load
  useEffect(() => {
    if (properties.length > 0) {
      initializeFilters();
    }
  }, [properties.length, initializeFilters]);

  const handleRefresh = async () => {
    await refetch();
  };

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
    return getPropertiesWithPhones(filteredAndSortedProperties);
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

  const handleWhatsAppSingle = (phone: string) => {
    openWhatsApp(phone);
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleExportCSV}
                    disabled={filteredAndSortedProperties.length === 0}
                    variant="outline"
                    size={isMobile ? "sm" : "default"}
                  >
                    <Copy className="h-4 w-4 ml-2" />
                    {isMobile ? 'ייצוא CSV' : 'ייצוא קובץ CSV'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>ייצא את כל הנכסים לקובץ CSV</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleCreateWhatsAppGroup}
                    disabled={propertiesWithWhatsApp.length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size={isMobile ? "sm" : "default"}
                  >
                    <Users className="h-4 w-4 ml-2" />
                    {isMobile ? 'קבוצה' : 'צור קבוצה'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>צור קישור לקבוצת WhatsApp</TooltipContent>
              </Tooltip>
            </div>

            <div className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {startIndex}-{endIndex} מתוך {totalItems} נכסים
            </div>
          </div>
        </div>

        {/* Advanced Search Filters */}
        <AdvancedSearchFilters
          filters={filters}
          onFiltersChange={setFilters}
          savedSearches={savedSearches}
          onSaveSearch={saveSearch}
          onLoadSearch={loadSearch}
          onDeleteSearch={deleteSearch}
          onClearFilters={clearFilters}
          propertyCount={filteredAndSortedProperties.length}
          maxPrice={maxPrice}
          maxOwnerCount={maxOwnerCount}
        />

        {/* Main Content */}
        <Card>
          <Tabs defaultValue={isMobile ? "cards" : "list"} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="list">רשימה</TabsTrigger>
              <TabsTrigger value="cards">כרטיסים</TabsTrigger>
              <TabsTrigger value="map">מפה</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              <PullToRefresh onRefresh={handleRefresh}>
                <Card>
                  {isMobile ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <p>עבור למצב כרטיסים לתצוגה טובה יותר במובייל</p>
                    </div>
                  ) : (
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
                        {paginatedProperties.map((property) => (
                          <TableRow key={property.id}>
                            <TableCell className="font-medium text-right">
                              <SearchHighlight 
                                text={property.address} 
                                searchTerm={filters.searchTerm}
                              />
                            </TableCell>
                            <TableCell className="text-right">
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
                                         text={property.ownerPhone} 
                                         searchTerm={filters.searchTerm}
                                       />
                                     </div>
                                  )}
                                </div>
                                <User className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {property.tenantName ? (
                                <div className="flex items-center justify-end gap-2">
                                  <div>
                                    <div className="font-medium">
                                      <SearchHighlight 
                                        text={property.tenantName} 
                                        searchTerm={filters.searchTerm}
                                      />
                                    </div>
                                    {property.tenantPhone && (
                                       <div className="text-sm text-muted-foreground">
                                         <SearchHighlight 
                                           text={property.tenantPhone} 
                                           searchTerm={filters.searchTerm}
                                         />
                                       </div>
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
                                  <>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleWhatsAppSingle(property.ownerPhone!)}
                                        >
                                          <MessageSquare className="h-4 w-4 text-green-600" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>שלח הודעת וואטסאפ</TooltipContent>
                                    </Tooltip>
                                    
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
                                  </>
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
                  )}
                </Card>
                
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

            <TabsContent value="cards" className="space-y-4">
              <PullToRefresh onRefresh={handleRefresh}>
                 <div className="space-y-4">
                  {paginatedProperties.map((property) => (
                     <OptimizedMobilePropertyCard
                       key={property.id}
                       property={property}
                       onViewDetails={handleViewDetails}
                       ownerPropertyCount={getOwnerPropertyCount(property)}
                       searchTerm={filters.searchTerm}
                     />
                  ))}
                </div>
                
                {/* Pagination for Cards */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
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
});
