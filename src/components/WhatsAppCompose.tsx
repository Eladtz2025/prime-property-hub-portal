import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Send, X, Users, User, MessageCircle, Pencil, CheckCircle, Clock, XCircle } from 'lucide-react';
import { formatIsraeliPhone } from '@/utils/phoneFormatter';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWhatsAppSender } from '@/hooks/useWhatsAppSender';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

interface Recipient {
  id: string;
  name: string;
  phone: string;
  type: 'lead' | 'owner';
  extra?: string;
  property_type?: string;
  rooms_min?: number;
  rooms_max?: number;
  budget_max?: number;
  city?: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
}

interface WhatsAppMessage {
  id: string;
  phone: string;
  message: string;
  created_at: string;
  direction: string;
  status: string;
  sender_name?: string;
  contact_name?: string;
}

const propertyTypeMap: Record<string, string> = {
  buy: 'קנייה',
  rent: 'שכירות',
  sale: 'מכירה',
};

export const WhatsAppCompose: React.FC = () => {
  const [recipientSource, setRecipientSource] = useState<'leads' | 'owners'>('leads');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
  const [availableRecipients, setAvailableRecipients] = useState<Recipient[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Template editing state
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [editTemplateName, setEditTemplateName] = useState('');
  const [editTemplateContent, setEditTemplateContent] = useState('');

  // Chat history state
  const [chatPhone, setChatPhone] = useState<string | null>(null);
  const [chatName, setChatName] = useState('');
  const [chatMessages, setChatMessages] = useState<WhatsAppMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const { toast } = useToast();
  const { sendWhatsAppMessage, isSending } = useWhatsAppSender();

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    loadRecipients();
  }, [recipientSource]);

  const loadTemplates = async () => {
    const { data } = await supabase
      .from('message_templates')
      .select('*')
      .order('name');
    setTemplates(data || []);
  };

  const loadRecipients = async () => {
    setLoading(true);
    try {
      if (recipientSource === 'leads') {
        const { data } = await supabase
          .from('contact_leads')
          .select('id, name, phone, property_type, rooms_min, rooms_max, budget_max')
          .not('phone', 'is', null)
          .neq('phone', '')
          .order('name');

        setAvailableRecipients(
          (data || []).map(l => ({
            id: l.id,
            name: l.name,
            phone: l.phone,
            type: 'lead' as const,
            property_type: l.property_type || undefined,
            rooms_min: l.rooms_min || undefined,
            rooms_max: l.rooms_max || undefined,
            budget_max: l.budget_max || undefined,
          }))
        );
      } else {
        const { data } = await supabase
          .from('properties')
          .select('id, address, city, owner_name, owner_phone')
          .not('owner_phone', 'is', null)
          .neq('owner_phone', '')
          .order('owner_name');

        setAvailableRecipients(
          (data || []).map(p => ({
            id: p.id,
            name: p.owner_name || '',
            phone: p.owner_phone!,
            type: 'owner' as const,
            extra: p.address || '',
            city: p.city || '',
          }))
        );
      }
    } catch (err) {
      console.error('Error loading recipients:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipients = useMemo(() => {
    if (!searchQuery) return availableRecipients;
    const q = searchQuery.toLowerCase();
    return availableRecipients.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.phone.includes(q) ||
      (r.extra && r.extra.toLowerCase().includes(q)) ||
      (r.city && r.city.toLowerCase().includes(q))
    );
  }, [availableRecipients, searchQuery]);

  const toggleRecipient = (recipient: Recipient) => {
    setSelectedRecipients(prev =>
      prev.some(r => r.phone === recipient.phone)
        ? prev.filter(r => r.phone !== recipient.phone)
        : [...prev, recipient]
    );
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) setMessage(template.content);
    setSelectedTemplate(templateId);
  };

  const openEditTemplate = () => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) {
      toast({ title: 'בחר תבנית לעריכה', variant: 'destructive' });
      return;
    }
    setEditingTemplate(template);
    setEditTemplateName(template.name);
    setEditTemplateContent(template.content);
  };

  const saveTemplate = async () => {
    if (!editingTemplate) return;
    const { error } = await supabase
      .from('message_templates')
      .update({ name: editTemplateName, content: editTemplateContent })
      .eq('id', editingTemplate.id);

    if (error) {
      toast({ title: 'שגיאה בשמירת התבנית', variant: 'destructive' });
      return;
    }
    toast({ title: 'התבנית עודכנה בהצלחה' });
    setEditingTemplate(null);
    await loadTemplates();
    // Update message if this template is currently selected
    if (selectedTemplate === editingTemplate.id) {
      setMessage(editTemplateContent);
    }
  };

  const openChatHistory = async (phone: string, name: string) => {
    setChatPhone(phone);
    setChatName(name);
    setChatLoading(true);
    setChatMessages([]);

    try {
      // Try multiple phone formats
      const cleanPhone = phone.replace(/\D/g, '');
      const phoneVariants = [phone, cleanPhone];
      if (cleanPhone.startsWith('0')) {
        phoneVariants.push('972' + cleanPhone.slice(1));
        phoneVariants.push('+972' + cleanPhone.slice(1));
      }
      if (cleanPhone.startsWith('972')) {
        phoneVariants.push('0' + cleanPhone.slice(3));
      }

      const { data } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .in('phone', phoneVariants)
        .order('created_at', { ascending: true })
        .limit(100);

      setChatMessages(data || []);
    } catch (err) {
      console.error('Error loading chat:', err);
    } finally {
      setChatLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': case 'delivered': case 'read':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'failed':
        return <XCircle className="h-3 w-3 text-destructive" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const handleSend = async () => {
    if (selectedRecipients.length === 0 || !message.trim()) {
      toast({ title: "נא לבחור נמענים ולכתוב הודעה", variant: "destructive" });
      return;
    }

    let successCount = 0;
    for (const recipient of selectedRecipients) {
      const personalMessage = message
        .replace(/\{שם\}/g, recipient.name)
        .replace(/\{כתובת\}/g, recipient.extra || '')
        .replace(/\{\{ownerName\}\}/g, recipient.name)
        .replace(/\{\{address\}\}/g, recipient.extra || '');

      const result = await sendWhatsAppMessage({
        phone: recipient.phone,
        message: personalMessage
      });
      if (result.success) successCount++;
    }

    if (successCount > 0) {
      toast({
        title: `נשלחו ${successCount} מתוך ${selectedRecipients.length} הודעות`,
      });
      setSelectedRecipients([]);
      setMessage('');
      setSelectedTemplate('');
    }
  };

  const selectAll = () => setSelectedRecipients([...filteredRecipients]);
  const clearAll = () => setSelectedRecipients([]);

  const formatBudget = (n?: number) => {
    if (!n) return '—';
    return n >= 1_000_000
      ? `₪${(n / 1_000_000).toFixed(1)}M`
      : `₪${(n / 1_000).toFixed(0)}K`;
  };

  const formatRooms = (min?: number, max?: number) => {
    if (!min && !max) return '—';
    if (min && max) return min === max ? `${min}` : `${min}-${max}`;
    return `${min || max}`;
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="h-5 w-5 text-green-600" />
            שליחת הודעה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Source selector — only leads & owners */}
          <div className="flex gap-2">
            {[
              { value: 'leads' as const, label: 'לקוחות', icon: Users },
              { value: 'owners' as const, label: 'בעלי נכסים', icon: User },
            ].map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={recipientSource === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setRecipientSource(value); setSearchQuery(''); }}
                className="flex-1"
              >
                <Icon className="h-4 w-4 ml-1" />
                {label}
              </Button>
            ))}
          </div>

          {/* Recipients table */}
          <div className="space-y-2">
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="חפש לפי שם, טלפון או כתובת..."
              className="h-8 text-sm"
            />
            <div className="flex gap-2 items-center">
              <Button size="sm" variant="ghost" onClick={selectAll} className="text-xs h-6 px-2">בחר הכל</Button>
              <Button size="sm" variant="ghost" onClick={clearAll} className="text-xs h-6 px-2">נקה</Button>
              {selectedRecipients.length > 0 && (
                <span className="text-xs font-medium text-primary">{selectedRecipients.length} נבחרו</span>
              )}
              <span className="text-xs text-muted-foreground mr-auto">
                {filteredRecipients.length} תוצאות
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto border rounded-md">
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow className="text-[10px] sm:text-xs">
                    <TableHead className="w-6 sm:w-8 px-1 py-1 sm:px-2 sm:py-1.5"></TableHead>
                    <TableHead className="px-1 py-1 sm:px-2 sm:py-1.5 text-[10px] sm:text-xs">שם</TableHead>
                    <TableHead className="px-1 py-1 sm:px-2 sm:py-1.5 text-[10px] sm:text-xs">טלפון</TableHead>
                    {recipientSource === 'leads' && (
                      <>
                        <TableHead className="px-1 py-1 sm:px-2 sm:py-1.5 text-[10px] sm:text-xs">עסקה</TableHead>
                        <TableHead className="px-1 py-1 sm:px-2 sm:py-1.5 text-[10px] sm:text-xs">חד׳</TableHead>
                        <TableHead className="px-1 py-1 sm:px-2 sm:py-1.5 text-[10px] sm:text-xs">תקציב</TableHead>
                      </>
                    )}
                    {recipientSource === 'owners' && (
                      <>
                        <TableHead className="px-1 py-1 sm:px-2 sm:py-1.5 text-[10px] sm:text-xs">כתובת</TableHead>
                        <TableHead className="px-1 py-1 sm:px-2 sm:py-1.5 text-[10px] sm:text-xs">עיר</TableHead>
                      </>
                    )}
                    <TableHead className="w-6 sm:w-8 px-1 py-1 sm:px-2 sm:py-1.5"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecipients.map(r => {
                    const isSelected = selectedRecipients.some(s => s.phone === r.phone);
                    return (
                      <TableRow
                        key={r.id}
                        className={`cursor-pointer text-[10px] sm:text-xs ${isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                        onClick={() => toggleRecipient(r)}
                      >
                        <TableCell className="px-1 py-1 sm:px-2 sm:py-1.5">
                          <Checkbox checked={isSelected} className="pointer-events-none h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </TableCell>
                        <TableCell className="px-1 py-1 sm:px-2 sm:py-1.5 font-medium truncate">{r.name}</TableCell>
                        <TableCell className="px-1 py-1 sm:px-2 sm:py-1.5 text-muted-foreground" dir="ltr">
                          {formatIsraeliPhone(r.phone)}
                        </TableCell>
                        {recipientSource === 'leads' && (
                          <>
                            <TableCell className="px-1 py-1 sm:px-2 sm:py-1.5">{propertyTypeMap[r.property_type || ''] || '—'}</TableCell>
                            <TableCell className="px-1 py-1 sm:px-2 sm:py-1.5">{formatRooms(r.rooms_min, r.rooms_max)}</TableCell>
                            <TableCell className="px-1 py-1 sm:px-2 sm:py-1.5" dir="ltr">{formatBudget(r.budget_max)}</TableCell>
                          </>
                        )}
                        {recipientSource === 'owners' && (
                          <>
                            <TableCell className="px-1 py-1 sm:px-2 sm:py-1.5 truncate">{r.extra || '—'}</TableCell>
                            <TableCell className="px-1 py-1 sm:px-2 sm:py-1.5 truncate">{r.city || '—'}</TableCell>
                          </>
                        )}
                        <TableCell className="px-1 py-1 sm:px-2 sm:py-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 sm:h-6 sm:w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              openChatHistory(r.phone, r.name);
                            }}
                          >
                            <MessageCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredRecipients.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={recipientSource === 'leads' ? 7 : 6} className="text-center py-4 text-muted-foreground">
                        {searchQuery ? 'לא נמצאו תוצאות' : 'אין נמענים זמינים'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Selected recipients badges */}
          {selectedRecipients.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedRecipients.map(r => (
                <Badge key={r.phone} variant="secondary" className="gap-1 text-xs">
                  {r.name || formatIsraeliPhone(r.phone)}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setSelectedRecipients(prev => prev.filter(p => p.phone !== r.phone))}
                  />
                </Badge>
              ))}
            </div>
          )}

          {/* Template + Edit */}
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר תבנית (אופציונלי)" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={openEditTemplate}
              disabled={!selectedTemplate}
              className="h-9 px-2"
              title="ערוך תבנית"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>

          <Textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="כתוב הודעה... (השתמש ב-{שם} ו-{כתובת} להתאמה אישית)"
            rows={3}
          />

          <Button
            onClick={handleSend}
            disabled={isSending || selectedRecipients.length === 0 || !message.trim()}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <Send className="h-4 w-4 ml-2" />
            {isSending
              ? 'שולח...'
              : selectedRecipients.length > 1
                ? `שלח ל-${selectedRecipients.length} נמענים`
                : 'שלח הודעה'}
          </Button>
        </CardContent>
      </Card>

      {/* Edit Template Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>עריכת תבנית</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={editTemplateName}
              onChange={e => setEditTemplateName(e.target.value)}
              placeholder="שם התבנית"
            />
            <Textarea
              value={editTemplateContent}
              onChange={e => setEditTemplateContent(e.target.value)}
              placeholder="תוכן ההודעה"
              rows={5}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setEditingTemplate(null)}>ביטול</Button>
              <Button onClick={saveTemplate}>שמור</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat History Dialog */}
      <Dialog open={!!chatPhone} onOpenChange={() => setChatPhone(null)}>
        <DialogContent className="max-w-md max-h-[80vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              {chatName}
              <span className="text-sm font-normal text-muted-foreground" dir="ltr">
                {chatPhone && formatIsraeliPhone(chatPhone)}
              </span>
            </DialogTitle>
          </DialogHeader>
          {chatLoading ? (
            <div className="text-center py-6 text-muted-foreground text-sm">טוען...</div>
          ) : chatMessages.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">אין הודעות להצגה</div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-[60vh] p-2">
              {chatMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`max-w-[85%] rounded-lg p-2.5 text-sm ${
                    msg.direction === 'outbound'
                      ? 'bg-green-100 dark:bg-green-900/30 mr-auto'
                      : 'bg-muted ml-auto'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(msg.created_at).toLocaleString('he-IL')}
                    </span>
                    {msg.direction === 'outbound' && getStatusIcon(msg.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
