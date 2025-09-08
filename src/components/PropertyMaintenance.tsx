import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Wrench, 
  Plus, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  User,
  Building
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MaintenanceRequest {
  id: string;
  property_id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  category: string;
  cost_estimate?: number;
  actual_cost?: number;
  contractor?: string;
  scheduled_date?: string;
  completed_date?: string;
  created_at: string;
  property?: {
    address: string;
    city: string;
  };
}

const CATEGORIES = [
  'אינסטלציה',
  'חשמל',
  'מזגן',
  'צבע ותיקונים',
  'ריצוף',
  'נגרות',
  'מתקני גז',
  'אחר'
];

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const STATUS_COLORS = {
  pending: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800'
};

interface PropertyMaintenanceProps {
  properties: any[];
}

export const PropertyMaintenance: React.FC<PropertyMaintenanceProps> = ({ properties }) => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const { toast } = useToast();

  // New request form state
  const [newRequest, setNewRequest] = useState({
    property_id: '',
    title: '',
    description: '',
    priority: 'medium' as const,
    category: '',
    cost_estimate: '',
    contractor: '',
    scheduled_date: ''
  });

  const filteredRequests = requests.filter(request => {
    const statusMatch = filterStatus === 'all' || request.status === filterStatus;
    const priorityMatch = filterPriority === 'all' || request.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  const handleCreateRequest = () => {
    if (!newRequest.property_id || !newRequest.title || !newRequest.description) {
      toast({
        title: "שגיאה",
        description: "אנא מלא את כל השדות הנדרשים",
        variant: "destructive"
      });
      return;
    }

    const request: MaintenanceRequest = {
      id: crypto.randomUUID(),
      ...newRequest,
      cost_estimate: newRequest.cost_estimate ? parseFloat(newRequest.cost_estimate) : undefined,
      status: 'pending',
      created_at: new Date().toISOString(),
      property: properties.find(p => p.id === newRequest.property_id)
    };

    setRequests(prev => [request, ...prev]);
    setNewRequest({
      property_id: '',
      title: '',
      description: '',
      priority: 'medium',
      category: '',
      cost_estimate: '',
      contractor: '',
      scheduled_date: ''
    });
    setIsModalOpen(false);

    toast({
      title: "בקשת תחזוקה נוצרה",
      description: "הבקשה נוספה למערכת בהצלחה"
    });
  };

  const handleStatusChange = (requestId: string, newStatus: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { 
            ...req, 
            status: newStatus as any,
            completed_date: newStatus === 'completed' ? new Date().toISOString() : req.completed_date
          }
        : req
    ));

    toast({
      title: "סטטוס עודכן",
      description: "סטטוס הבקשה עודכן בהצלחה"
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <Wrench className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default: return null;
    }
  };

  const formatCurrency = (amount: number) => `₪${amount.toLocaleString()}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  const getStatusText = (status: string) => {
    const labels = {
      pending: 'ממתין',
      in_progress: 'בתהליך',
      completed: 'הושלם',
      cancelled: 'בוטל'
    };
    return labels[status as keyof typeof labels];
  };

  const getPriorityText = (priority: string) => {
    const labels = {
      low: 'נמוך',
      medium: 'בינוני',
      high: 'גבוה',
      urgent: 'דחוף'
    };
    return labels[priority as keyof typeof labels];
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wrench className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{requests.length}</div>
                <div className="text-sm text-muted-foreground">סה"כ בקשות</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {requests.filter(r => r.status === 'pending').length}
                </div>
                <div className="text-sm text-muted-foreground">ממתינות</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Wrench className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {requests.filter(r => r.status === 'in_progress').length}
                </div>
                <div className="text-sm text-muted-foreground">בתהליך</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {requests.filter(r => r.status === 'completed').length}
                </div>
                <div className="text-sm text-muted-foreground">הושלמו</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              ניהול תחזוקה
            </CardTitle>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-1" />
                  בקשת תחזוקה חדשה
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>בקשת תחזוקה חדשה</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="property">נכס</Label>
                      <Select value={newRequest.property_id} onValueChange={(value) => 
                        setNewRequest(prev => ({ ...prev, property_id: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר נכס" />
                        </SelectTrigger>
                        <SelectContent>
                          {properties.map(property => (
                            <SelectItem key={property.id} value={property.id}>
                              {property.address}, {property.city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="category">קטגוריה</Label>
                      <Select value={newRequest.category} onValueChange={(value) => 
                        setNewRequest(prev => ({ ...prev, category: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר קטגוריה" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="title">כותרת</Label>
                    <Input
                      id="title"
                      value={newRequest.title}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="תיאור קצר של הבעיה"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">תיאור מפורט</Label>
                    <Textarea
                      id="description"
                      value={newRequest.description}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="תיאור מפורט של הבעיה והפתרון הנדרש"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="priority">עדיפות</Label>
                      <Select value={newRequest.priority} onValueChange={(value: any) => 
                        setNewRequest(prev => ({ ...prev, priority: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">נמוך</SelectItem>
                          <SelectItem value="medium">בינוני</SelectItem>
                          <SelectItem value="high">גבוה</SelectItem>
                          <SelectItem value="urgent">דחוף</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="cost_estimate">אומדן עלות (₪)</Label>
                      <Input
                        id="cost_estimate"
                        type="number"
                        value={newRequest.cost_estimate}
                        onChange={(e) => setNewRequest(prev => ({ ...prev, cost_estimate: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="scheduled_date">תאריך מתוכנן</Label>
                      <Input
                        id="scheduled_date"
                        type="date"
                        value={newRequest.scheduled_date}
                        onChange={(e) => setNewRequest(prev => ({ ...prev, scheduled_date: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="contractor">קבלן</Label>
                    <Input
                      id="contractor"
                      value={newRequest.contractor}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, contractor: e.target.value }))}
                      placeholder="שם הקבלן"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleCreateRequest}>
                      יצירת בקשה
                    </Button>
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                      ביטול
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="סנן לפי סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                <SelectItem value="pending">ממתין</SelectItem>
                <SelectItem value="in_progress">בתהליך</SelectItem>
                <SelectItem value="completed">הושלם</SelectItem>
                <SelectItem value="cancelled">בוטל</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="סנן לפי עדיפות" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל העדיפויות</SelectItem>
                <SelectItem value="urgent">דחוף</SelectItem>
                <SelectItem value="high">גבוה</SelectItem>
                <SelectItem value="medium">בינוני</SelectItem>
                <SelectItem value="low">נמוך</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map(request => (
          <Card key={request.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    {getPriorityIcon(request.priority)}
                    <h3 className="text-lg font-semibold">{request.title}</h3>
                    <Badge className={PRIORITY_COLORS[request.priority]}>
                      {getPriorityText(request.priority)}
                    </Badge>
                    <Badge className={STATUS_COLORS[request.status]}>
                      {getStatusIcon(request.status)}
                      <span className="mr-1">{getStatusText(request.status)}</span>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      {request.property?.address}, {request.property?.city}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      נוצר: {formatDate(request.created_at)}
                    </div>
                    {request.cost_estimate && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        אומדן: {formatCurrency(request.cost_estimate)}
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">{request.description}</p>

                  {request.contractor && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4" />
                      <span className="font-medium">קבלן:</span> {request.contractor}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Select 
                    value={request.status} 
                    onValueChange={(value) => handleStatusChange(request.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">ממתין</SelectItem>
                      <SelectItem value="in_progress">בתהליך</SelectItem>
                      <SelectItem value="completed">הושלם</SelectItem>
                      <SelectItem value="cancelled">בוטל</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredRequests.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">אין בקשות תחזוקה</h3>
              <p className="text-muted-foreground">
                {requests.length === 0 
                  ? "לחץ על 'בקשת תחזוקה חדשה' כדי להתחיל"
                  : "לא נמצאו בקשות העונות לקריטריונים שנבחרו"
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};