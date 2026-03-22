import React, { useState, useMemo, memo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { WhatsAppBulkBar } from '@/components/WhatsAppBulkBar';
import { WhatsAppBulkSendDialog } from '@/components/WhatsAppBulkSendDialog';
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
  Trash2,
  RefreshCw,
  Share2,
  MessageCircle,
  Facebook,
  Link as LinkIcon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Property } from '../types/property';
import { PropertyDetailModal } from '../components/PropertyDetailModal';
import { PropertyEditRow } from '../components/PropertyEditRow';
import { AddPropertyModal } from '../components/AddPropertyModal';
import { MobilePropertyCard } from '../components/MobilePropertyCard';
import { PullToRefresh } from '../components/PullToRefresh';
import { PropertyListSkeleton } from '../components/PropertyListSkeleton';
import { PropertyTableSkeleton } from '../components/PropertyTableSkeleton';

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
import { useQueryClient } from '@tanstack/react-query';

const OptimizedMobilePropertyCard = memo(MobilePropertyCard);

export const Properties: React.FC = memo(() => {
  const { isMobile } = useMobileOptimization();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { permissions, hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const canViewPhone = canViewPhoneNumbers(permissions);
  const canCreateProperties = hasPermission('properties', 'create');
  const canEditProperties = hasPermission('properties', 'update');
  const canDeleteProperties = hasPermission('properties', 'delete');
  const [sortBy, setSortBy] = useState<'address' | 'ownerName' | 'status' | 'leaseEndDate'>('address');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [expandedPropertyId, setExpandedPropertyId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  
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

  const handleRefreshProperties = async () => {
    queryClient.invalidateQueries({ queryKey: ['supabase-properties'] });
    toast({
      title: "הנתונים עודכנו",
      description: "הנכסים נטענו מחדש מהשרת",
    });
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
      let comparison = 0;
      
      switch (sortBy) {
        case 'leaseEndDate':
          if (!a.leaseEndDate && !b.leaseEndDate) comparison = 0;
          else if (!a.leaseEndDate) comparison = 1;
          else if (!b.leaseEndDate) comparison = -1;
          else comparison = new Date(a.leaseEndDate).getTime() - new Date(b.leaseEndDate).getTime();
          break;
        case 'ownerName':
          comparison = a.ownerName.localeCompare(b.ownerName, 'he');
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default: // address
          comparison = a.address.localeCompare(b.address, 'he');
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [searchFilteredProperties, sortBy, sortDirection]);

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

  // Handle edit query parameter from navigation
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && filteredAndSortedProperties.length > 0) {
      // Find the property's index in the sorted list
      const propertyIndex = filteredAndSortedProperties.findIndex(p => p.id === editId);
      
      if (propertyIndex !== -1) {
        // Calculate which page the property is on
        const itemsPerPage = isMobile ? 10 : 20;
        const targetPage = Math.floor(propertyIndex / itemsPerPage) + 1;
        
        // Navigate to the correct page
        goToPage(targetPage);
        
        // Expand the property edit row
        setExpandedPropertyId(editId);
      }
      
      // Clear the query parameter
      searchParams.delete('edit');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, filteredAndSortedProperties, isMobile, goToPage, setSearchParams]);

  // Auto-scroll to expanded property
  useEffect(() => {
    if (expandedPropertyId) {
      // Wait for the DOM to update, then scroll
      setTimeout(() => {
        const element = document.getElementById(`property-row-${expandedPropertyId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
  }, [expandedPropertyId]);

  const propertiesWithWhatsApp = useMemo(() => {
    return filteredAndSortedProperties.filter(property => property.ownerPhone && property.ownerPhone.trim() !== '');
  }, [filteredAndSortedProperties]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleToggleAll = () => {
    if (selectedIds.size === paginatedProperties.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedProperties.map(p => p.id)));
    }
  };

  const bulkRecipients = useMemo(() => {
    const seen = new Set<string>();
    return paginatedProperties
      .filter(p => selectedIds.has(p.id) && p.ownerPhone?.trim())
      .reduce<{ id: string; name: string; phone: string }[]>((acc, p) => {
        const phone = p.ownerPhone!.trim();
        if (!seen.has(phone)) {
          seen.add(phone);
          acc.push({ id: p.id, name: p.ownerName, phone });
        }
        return acc;
      }, []);
  }, [selectedIds, paginatedProperties]);

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
      case 'project': return 'פרויקט';
      default: return 'השכרה';
    }
  };

  const getPropertyTypeColor = (type: string | undefined) => {
    switch (type) {
      case 'sale': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'management': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'project': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-emerald-100 text-emerald-800 border-emerald-200'; // rental
    }
  };

  const handleSort = (field: 'address' | 'ownerName' | 'status' | 'leaseEndDate') => {
    if (sortBy === field) {
      // Toggle direction if clicking same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column - start with ascending
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const handleViewDetails = (id: string) => {
    const property = properties.find(p => p.id === id);
    if (property) {
      setSelectedProperty(property);
    }
  };

  const handlePropertyUpdate = (updatedProperty: Property) => {
    updateProperty(updatedProperty);
    setExpandedPropertyId(null);
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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className={`font-bold text-foreground ${isMobile ? 'text-xl' : 'text-3xl'}`}>רשימת נכסים</h2>
            <div className="flex items-center gap-3">
              {!isMobile && (
                <div className="text-muted-foreground text-sm">
                  {startIndex}-{endIndex} מתוך {totalItems} נכסים
                </div>
              )}
              <Button 
                onClick={handleRefreshProperties}
                variant="outline"
                size={isMobile ? "sm" : "default"}
              >
                <RefreshCw className="h-4 w-4 ml-2" />
                רענן נתונים
              </Button>
              {canCreateProperties && (
                <Button onClick={() => setShowAddModal(true)} size={isMobile ? "sm" : "default"}>
                  <Plus className="h-4 w-4 mr-2" />
                  הוסף נכס
                </Button>
              )}
            </div>
          </div>
          
          {isMobile && (
            <div className="text-muted-foreground text-xs text-right">
              {startIndex}-{endIndex} מתוך {totalItems} נכסים
            </div>
          )}
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
              <PullToRefresh onRefresh={handleRefresh}>
                {isMobile ? (
                  <div className="space-y-3 px-2">
                    {paginatedProperties.map((property) => (
                      <React.Fragment key={property.id}>
                        <div id={`property-row-${property.id}`}>
                          <OptimizedMobilePropertyCard
                          property={property}
                          onViewDetails={handleViewDetails}
                          onEdit={(p) => setExpandedPropertyId(expandedPropertyId === p.id ? null : p.id)}
                          onDelete={handleDeleteProperty}
                          ownerPropertyCount={getOwnerPropertyCount(property)}
                          searchTerm={filters.searchTerm}
                          canEdit={canEditProperties}
                        />
                          <PropertyEditRow
                            property={property}
                            isOpen={expandedPropertyId === property.id}
                            onClose={() => setExpandedPropertyId(null)}
                            onSave={handlePropertyUpdate}
                          />
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-center px-2 py-3 w-10">
                            <Checkbox
                              checked={paginatedProperties.length > 0 && selectedIds.size === paginatedProperties.length}
                              onCheckedChange={handleToggleAll}
                            />
                          </TableHead>
                          <TableHead 
                            className="text-center cursor-pointer hover:bg-muted/50 px-4 py-3" 
                            onClick={() => handleSort('address')}
                          >
                            <div className="flex items-center justify-center gap-2">
                              כתובת
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead className="text-center px-4 py-3 border-l border-border">חדרים</TableHead>
                          <TableHead className="text-center px-4 py-3 border-l border-border">מ"ר</TableHead>
                          <TableHead 
                            className="text-center cursor-pointer hover:bg-muted/50 px-4 py-3 border-l border-border"
                            onClick={() => handleSort('ownerName')}
                          >
                            <div className="flex items-center justify-center gap-2">
                              בעל הנכס
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead className="text-center px-4 py-3 border-l border-border">סוג הנכס</TableHead>
                          <TableHead className="text-center px-4 py-3 border-l border-border">סוכן מטפל</TableHead>
                          <TableHead 
                            className="text-center cursor-pointer hover:bg-muted/50 px-4 py-3 border-l border-border"
                            onClick={() => handleSort('status')}
                          >
                            <div className="flex items-center justify-center gap-2">
                              סטטוס
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead 
                            className="text-center cursor-pointer hover:bg-muted/50 px-4 py-3 border-l border-border"
                            onClick={() => handleSort('leaseEndDate')}
                          >
                            <div className="flex items-center justify-center gap-2">
                              סיום חוזה
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead className="text-center px-4 py-3 border-l border-border">פעולות</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedProperties.map((property) => (
                          <React.Fragment key={property.id}>
                            <TableRow id={`property-row-${property.id}`} className={`hover:bg-muted/50 ${selectedIds.has(property.id) ? 'bg-primary/5' : ''}`}>
                              <TableCell className="text-center px-2 py-3 w-10">
                                <Checkbox
                                  checked={selectedIds.has(property.id)}
                                  onCheckedChange={() => handleToggleSelect(property.id)}
                                />
                              </TableCell>
                              <TableCell className="font-semibold text-base text-foreground text-center px-4 py-3 border-l border-border">
                                <SearchHighlight 
                                  text={property.address} 
                                  searchTerm={filters.searchTerm}
                                />
                              </TableCell>
                              <TableCell className="text-center px-4 py-3 border-l border-border">
                                {property.rooms ? (
                                  <span className="font-medium">{property.rooms}</span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center px-4 py-3 border-l border-border">
                                {property.propertySize ? (
                                  <span className="font-medium">{property.propertySize}</span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center px-4 py-3 border-l border-border">
                                <div className="flex items-center justify-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
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
                                </div>
                              </TableCell>
                              <TableCell className="text-center px-4 py-3 border-l border-border">
                                <Badge 
                                  variant="outline" 
                                  className={`${getPropertyTypeColor(property.property_type)} text-sm`}
                                >
                                  {getPropertyTypeText(property.property_type)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center px-4 py-3 border-l border-border">
                                {property.assignedAgent ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <div className="font-medium">
                                        {property.assignedAgent.full_name}
                                      </div>
                                      {property.assignedAgent.phone && (
                                        <div className="text-sm text-muted-foreground">
                                          {formatPhoneDisplay(property.assignedAgent.phone, canViewPhone)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">לא משוייך</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center px-4 py-3 border-l border-border">
                                <Badge className={`${getStatusColor(property.status)} text-sm`}>
                                  {getStatusText(property.status)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center px-4 py-3 border-l border-border">
                                {property.leaseEndDate ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{new Date(property.leaseEndDate).toLocaleDateString('he-IL')}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center px-4 py-3 border-l border-border">
                                <div className="flex items-center justify-center gap-3">
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
                                          onClick={() => setExpandedPropertyId(expandedPropertyId === property.id ? null : property.id)}
                                          className={`h-9 w-9 ${expandedPropertyId === property.id ? 'bg-primary/10' : ''}`}
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

                                   {/* Share Dropdown */}
                                   <DropdownMenu>
                                     <Tooltip>
                                       <TooltipTrigger asChild>
                                         <DropdownMenuTrigger asChild>
                                           <Button
                                             variant="ghost"
                                             size="icon"
                                             className="h-9 w-9"
                                           >
                                             <Share2 className="h-4 w-4 text-primary" />
                                           </Button>
                                         </DropdownMenuTrigger>
                                       </TooltipTrigger>
                                       <TooltipContent>שתף נכס</TooltipContent>
                                     </Tooltip>
                                     <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => {
                                          const url = `${window.location.origin}/he/property/${property.id}`;
                                          window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank');
                                        }}>
                                          <MessageCircle className="h-4 w-4 ml-2" />
                                          שתף בווטסאפ
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => {
                                          // Use og-property edge function for Facebook - returns proper OG tags with property image
                                          const ogUrl = `https://jswumsdymlooeobrxict.supabase.co/functions/v1/og-property?id=${property.id}&lang=he`;
                                          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(ogUrl)}`, '_blank');
                                        }}>
                                          <Facebook className="h-4 w-4 ml-2" />
                                          שתף בפייסבוק
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => {
                                          const url = `${window.location.origin}/he/property/${property.id}`;
                                          navigator.clipboard.writeText(url);
                                          toast({
                                            title: "הקישור הועתק",
                                            description: "קישור לנכס הועתק ללוח",
                                          });
                                        }}>
                                          <LinkIcon className="h-4 w-4 ml-2" />
                                          העתק קישור
                                        </DropdownMenuItem>
                                     </DropdownMenuContent>
                                   </DropdownMenu>

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
                            {/* Expandable Edit Row */}
                            {expandedPropertyId === property.id && (
                              <TableRow>
                                <TableCell colSpan={7} className="p-0 border-0">
                                  <PropertyEditRow
                                    property={property}
                                    isOpen={true}
                                    onClose={() => setExpandedPropertyId(null)}
                                    onSave={handlePropertyUpdate}
                                  />
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
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
        </Card>

        {/* Property Detail Modal */}
        {selectedProperty && (
          <PropertyDetailModal
            property={selectedProperty}
            isOpen={true}
            onClose={() => setSelectedProperty(null)}
            onEdit={(property) => {
              setExpandedPropertyId(property.id);
              setSelectedProperty(null);
            }}
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
