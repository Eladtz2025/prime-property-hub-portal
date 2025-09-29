import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Send, Users, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useRelevantPhoneNumbers } from '@/hooks/useRelevantPhoneNumbers';
import { useMessageTemplates } from '@/hooks/useMessageTemplates';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BulkMessageSenderProps {
  onSendComplete?: () => void;
}

export const BulkMessageSender: React.FC<BulkMessageSenderProps> = ({ onSendComplete }) => {
  const { allRelevantContacts, isLoading: contactsLoading } = useRelevantPhoneNumbers();
  const { templates, isLoading: templatesLoading } = useMessageTemplates();
  
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'tenant' | 'owner'>('all');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });

  // Filter contacts
  const filteredContacts = useMemo(() => {
    console.log('[BulkSender Debug] All contacts:', allRelevantContacts.length);
    console.log('[BulkSender Debug] Contact names:', allRelevantContacts.map(c => c.name));
    
    return allRelevantContacts.filter(contact => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery.trim() ||
        (contact.name || '').toLowerCase().includes(query) ||
        (contact.propertyAddress || '').toLowerCase().includes(query) ||
        (contact.phone || '').includes(searchQuery) ||
        (contact.normalizedPhone || '').includes(searchQuery);
      
      const matchesType = 
        filterType === 'all' || 
        contact.type === filterType;
      
      if (searchQuery.trim() && query.includes('שי') && matchesSearch) {
        console.log('[BulkSender Debug] Match found for שי:', contact.name, contact.phone);
      }
      
      return matchesSearch && matchesType;
    });
  }, [allRelevantContacts, searchQuery, filterType]);

  const handleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map(c => c.normalizedPhone)));
    }
  };

  const toggleContact = (phone: string) => {
    const newSet = new Set(selectedContacts);
    if (newSet.has(phone)) {
      newSet.delete(phone);
    } else {
      newSet.add(phone);
    }
    setSelectedContacts(newSet);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setMessage(template.content);
    }
  };

  const handleSendBulk = async () => {
    if (selectedContacts.size === 0) {
      toast({
        title: 'לא נבחרו אנשי קשר',
        description: 'אנא בחר לפחות איש קשר אחד',
        variant: 'destructive',
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: 'הודעה ריקה',
        description: 'אנא הזן את תוכן הההודעה',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    setSendProgress({ current: 0, total: selectedContacts.size });

    try {
      // Prepare recipients data
      const recipients = filteredContacts
        .filter(c => selectedContacts.has(c.normalizedPhone))
        .map(c => ({
          phone: c.normalizedPhone,
          name: c.name,
          propertyAddress: c.propertyAddress || '',
        }));

      // Call bulk send function
      const { data, error } = await supabase.functions.invoke('whatsapp-bulk-send', {
        body: {
          recipients,
          message,
          template_id: selectedTemplate || null,
        },
      });

      if (error) throw error;

      toast({
        title: 'שליחה הושלמה!',
        description: `נשלחו ${data.successful} הודעות בהצלחה, ${data.failed} נכשלו`,
      });

      // Reset form
      setSelectedContacts(new Set());
      setMessage('');
      setSelectedTemplate('');
      
      if (onSendComplete) {
        onSendComplete();
      }
    } catch (error) {
      console.error('Error sending bulk messages:', error);
      toast({
        title: 'שגיאה בשליחה',
        description: error.message || 'אירעה שגיאה בשליחת ההודעות',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
      setSendProgress({ current: 0, total: 0 });
    }
  };

  const selectedContactsList = filteredContacts.filter(c => 
    selectedContacts.has(c.normalizedPhone)
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            שליחה קבוצתית
          </CardTitle>
          <CardDescription>
            בחר אנשי קשר ושלח הודעה לכולם בבת אחת
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="select">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="select">בחירת אנשי קשר</TabsTrigger>
              <TabsTrigger value="compose">כתיבת הודעה</TabsTrigger>
            </TabsList>

            <TabsContent value="select" className="space-y-4">
              {/* Filters */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="חיפוש לפי שם, כתובת או טלפון..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">הכל</SelectItem>
                    <SelectItem value="owner">בעלי נכסים</SelectItem>
                    <SelectItem value="tenant">דיירים</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Select All */}
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Checkbox
                  checked={selectedContacts.size === filteredContacts.length && filteredContacts.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm">
                  בחר הכל ({filteredContacts.length} אנשי קשר)
                </span>
                {selectedContacts.size > 0 && (
                  <span className="text-sm text-muted-foreground mr-auto">
                    נבחרו: {selectedContacts.size}
                  </span>
                )}
              </div>

              {/* Contact List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {contactsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    טוען אנשי קשר...
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    לא נמצאו אנשי קשר
                  </div>
                ) : (
                  filteredContacts.map((contact) => (
                    <div
                      key={contact.normalizedPhone}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                      onClick={() => toggleContact(contact.normalizedPhone)}
                    >
                      <Checkbox
                        checked={selectedContacts.has(contact.normalizedPhone)}
                        onCheckedChange={() => toggleContact(contact.normalizedPhone)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{contact.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {contact.propertyAddress && `${contact.propertyAddress} • `}
                          {contact.phone}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        contact.type === 'owner' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {contact.type === 'owner' ? 'בעל נכס' : 'דייר'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="compose" className="space-y-4">
              {/* Template Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  בחר תבנית (אופציונלי)
                </label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר תבנית או כתוב הודעה חופשית" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Message Text */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  תוכן ההודעה
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="הקלד את ההודעה כאן... ניתן להשתמש במשתנים: {שם}, {כתובת}"
                  rows={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  המשתנים {'{שם}'} ו-{'{כתובת}'} יוחלפו אוטומטית לכל איש קשר
                </p>
              </div>

              {/* Preview */}
              {selectedContactsList.length > 0 && message && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <h4 className="font-medium text-sm">תצוגה מקדימה:</h4>
                  <div className="text-sm p-3 bg-background rounded border">
                    {message
                      .replace(/{שם}/g, selectedContactsList[0].name)
                      .replace(/{כתובת}/g, selectedContactsList[0].propertyAddress || '')}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    דוגמה ל-{selectedContactsList[0].name}
                  </p>
                </div>
              )}

              {/* Summary & Send */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">נמענים:</span>
                  <span className="font-medium">{selectedContacts.size}</span>
                </div>
                <Button
                  onClick={handleSendBulk}
                  disabled={isSending || selectedContacts.size === 0 || !message.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      שולח {sendProgress.current}/{sendProgress.total}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 ml-2" />
                      שלח ל-{selectedContacts.size} אנשי קשר
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
