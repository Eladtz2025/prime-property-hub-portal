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
  Map,
  MessageSquare,
  Copy,
  Users,
  Download,
  AlertTriangle,
  FileText,
  Loader2
} from 'lucide-react';
import { Property } from '../types/property';
import { processPropertiesData } from '../utils/dataProcessor';
import { PropertyDetailModal } from '../components/PropertyDetailModal';
import { PropertyEditModal } from '../components/PropertyEditModal';
import { MobilePropertyCard } from '../components/MobilePropertyCard';
import { PropertyMap } from '../components/PropertyMap';
import { PullToRefresh } from '../components/PullToRefresh';
import { DuplicateManagementModal } from '../components/DuplicateManagementModal';
import { useMobileOptimization } from '../hooks/useMobileOptimization';
import { openWhatsApp, getPropertiesWithPhones } from '../utils/whatsappHelper';
import { 
  findDuplicatePhoneNumbers, 
  generateCSVData, 
  downloadCSV 
} from '../utils/duplicateDetection';
import { useToast } from "@/hooks/use-toast";

export const Properties: React.FC = () => {
  const { isMobile } = useMobileOptimization();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'address' | 'ownerName' | 'status' | 'leaseEndDate'>('address');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateModalKey, setDuplicateModalKey] = useState(0);
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  useEffect(() => {
    loadData();
    
    const handleStorageChange = () => {
      loadData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await processPropertiesData();
      setProperties(data);
    } catch (error) {
      console.error('Error loading properties:', error);
      toast({
        title: "שגיאה בטעינת הנתונים",
        description: "לא הצלחנו לטעון את רשימת הנכסים",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedProperties = useMemo(() => {
    let filtered = properties.filter(property => {
      const matchesSearch = 
        property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (property.tenantName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

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
        default:
          return a.address.localeCompare(b.address, 'he');
      }
    });

    return filtered;
  }, [properties, searchTerm, statusFilter, sortBy]);

  const propertiesWithWhatsApp = useMemo(() => {
    return getPropertiesWithPhones(filteredAndSortedProperties);
  }, [filteredAndSortedProperties]);

  const duplicateGroups = useMemo(() => {
    return findDuplicatePhoneNumbers(properties);
  }, [properties]);

  const handleCopyPhoneNumbers = () => {
    const phoneNumbers = propertiesWithWhatsApp
      .map(p => p.ownerPhone)
      .filter(phone => phone)
      .join('\n');
    
    navigator.clipboard.writeText(phoneNumbers);
    toast({
      title: "הועתק!",
      description: `${propertiesWithWhatsApp.length} מספרי טלפון הועתקו ללוח`,
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

  const handleExportCSV = () => {
    try {
      const csvData = generateCSVData(filteredAndSortedProperties);
      const filename = `נכסים_${new Date().toISOString().split('T')[0]}`;
      downloadCSV(csvData, filename);
      
      toast({
        title: "הקובץ יוצא בהצלחה",
        description: `${filteredAndSortedProperties.length} נכסים יוצאו לקובץ CSV`,
      });
    } catch (error) {
      toast({
        title: "שגיאה ביצוא הקובץ",
        description: "לא הצלחנו לייצא את הקובץ",
        variant: "destructive",
      });
    }
  };

  const handlePropertyUpdate = (updatedProperty: Property) => {
    setActionLoading(true);
    setProperties(prev => 
      prev.map(p => p.id === updatedProperty.id ? updatedProperty : p)
    );
    setEditingProperty(null);
    
    setDuplicateModalKey(prev => prev + 1);
    
    loadData().finally(() => setActionLoading(false));
  };

  const handlePropertyDelete = (propertyId: string) => {
    setActionLoading(true);
    setProperties(prev => prev.filter(p => p.id !== propertyId));
    
    setDuplicateModalKey(prev => prev + 1);
    
    loadData().finally(() => setActionLoading(false));
  };

  const handleViewPropertyFromDuplicate = (property: Property) => {
    setSelectedProperty(property);
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

  const handleWhatsAppSingle = (phone: string) => {
    openWhatsApp(phone);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <div className="text-lg">טוען נתונים...</div>
        </div>
      </div>
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
                    onClick={handleCopyPhoneNumbers}
                    disabled={propertiesWithWhatsApp.length === 0 || actionLoading}
                    variant="outline"
                    size={isMobile ? "sm" : "default"}
                  >
                    <Copy className="h-4 w-4 ml-2" />
                    {isMobile ? 'העתק' : 'העתק טלפונים'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>העתק את כל מספרי הטלפון</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleCreateWhatsAppGroup}
                    disabled={propertiesWithWhatsApp.length === 0 || actionLoading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size={isMobile ? "sm" : "default"}
                  >
                    <Users className="h-4 w-4 ml-2" />
                    {isMobile ? 'קבוצה' : 'צור קבוצה'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>צור קישור לקבוצת WhatsApp</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleExportCSV}
                    disabled={actionLoading}
                    variant="outline"
                    size={isMobile ? "sm" : "default"}
                  >
                    <Download className="h-4 w-4 ml-2" />
                    {isMobile ? 'יצוא' : 'יצא לCSV'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>יצא את הנתונים לקובץ CSV</TooltipContent>
              </Tooltip>

              {duplicateGroups.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setShowDuplicateModal(true)}
                      disabled={actionLoading}
                      variant="outline"
                      size={isMobile ? "sm" : "default"}
                      className="border-orange-300 text-orange-600 hover:bg-orange-50"
                    >
                      <AlertTriangle className="h-4 w-4 ml-2" />
                      כפיליות ({duplicateGroups.length})
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>נמצאו כפיליות במספרי טלפון</TooltipContent>
                </Tooltip>
              )}
            </div>

            <div className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {filteredAndSortedProperties.length} מתוך {properties.length} נכסים
            </div>
          </div>
        </div>

        {/* Loading indicator for actions */}
        {actionLoading && (
          <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
            <Loader2 className="h-5 w-5 animate-spin ml-2" />
            <span className="text-blue-700">מעדכן נתונים...</span>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className={isMobile ? 'text-lg' : 'text-xl'}>חיפוש וסינון</CardTitle>
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
                size={isMobile ? "sm" : "default"}
              >
                נקה סינונים
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card>
          <Tabs defaultValue={isMobile ? "cards" : "list"} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="list">רשימה</TabsTrigger>
              <TabsTrigger value="cards">כרטיסים</TabsTrigger>
              <TabsTrigger value="map">מפה</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              <PullToRefresh onRefresh={loadData}>
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

        {/* Duplicate Management Modal */}
        <DuplicateManagementModal
          key={duplicateModalKey}
          duplicateGroups={duplicateGroups}
          isOpen={showDuplicateModal}
          onClose={() => setShowDuplicateModal(false)}
          onUpdateProperty={handlePropertyUpdate}
          onDeleteProperty={handlePropertyDelete}
          onViewProperty={handleViewPropertyFromDuplicate}
        />
      </div>
    </TooltipProvider>
  );
};
