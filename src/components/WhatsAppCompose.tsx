import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Send, X, Users, User, Phone } from 'lucide-react';
import { formatIsraeliPhone } from '@/utils/phoneFormatter';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWhatsAppSender } from '@/hooks/useWhatsAppSender';

interface Recipient {
  id: string;
  name: string;
  phone: string;
  type: 'lead' | 'owner' | 'manual';
  extra?: string; // address or source info
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
}

export const WhatsAppCompose: React.FC = () => {
  const [recipientSource, setRecipientSource] = useState<'leads' | 'owners' | 'manual'>('leads');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
  const [availableRecipients, setAvailableRecipients] = useState<Recipient[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [message, setMessage] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();
  const { sendWhatsAppMessage, isSending } = useWhatsAppSender();

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (recipientSource !== 'manual') {
      loadRecipients();
    }
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
          .select('id, name, phone, source, status')
          .not('phone', 'is', null)
          .neq('phone', '')
          .order('name');
        
        setAvailableRecipients(
          (data || []).map(l => ({
            id: l.id,
            name: l.name,
            phone: l.phone,
            type: 'lead' as const,
          }))
        );
      } else if (recipientSource === 'owners') {
        const { data } = await supabase
          .from('property_owners')
          .select(`
            property_id,
            properties!inner(id, address),
            profiles!inner(id, full_name, phone)
          `)
          .not('profiles.phone', 'is', null)
          .neq('profiles.phone', '');
        
        const seen = new Set<string>();
        const recipients: Recipient[] = [];
        (data || []).forEach((item: any) => {
          const phone = item.profiles?.phone;
          if (phone && !seen.has(phone)) {
            seen.add(phone);
            recipients.push({
              id: item.profiles?.id || item.property_id,
              name: item.profiles?.full_name || '',
              phone,
              type: 'owner',
              extra: item.properties?.address || ''
            });
          }
        });
        setAvailableRecipients(recipients);
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
      (r.extra && r.extra.toLowerCase().includes(q))
    );
  }, [availableRecipients, searchQuery]);

  const toggleRecipient = (recipient: Recipient) => {
    setSelectedRecipients(prev =>
      prev.some(r => r.phone === recipient.phone)
        ? prev.filter(r => r.phone !== recipient.phone)
        : [...prev, recipient]
    );
  };

  const addManualRecipient = () => {
    const phone = manualPhone.trim();
    if (!phone) return;
    if (selectedRecipients.some(r => r.phone === phone)) {
      toast({ title: "המספר כבר נוסף", variant: "destructive" });
      return;
    }
    setSelectedRecipients(prev => [...prev, {
      id: `manual-${Date.now()}`,
      name: phone,
      phone,
      type: 'manual'
    }]);
    setManualPhone('');
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) setMessage(template.content);
    setSelectedTemplate(templateId);
  };

  const formatPhone = (phone: string) => formatIsraeliPhone(phone);

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

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Send className="h-5 w-5 text-green-600" />
          שליחת הודעה
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Source selector */}
        <div className="flex gap-2">
          {[
            { value: 'leads' as const, label: 'לקוחות', icon: Users },
            { value: 'owners' as const, label: 'בעלי נכסים', icon: User },
            { value: 'manual' as const, label: 'מספר חופשי', icon: Phone },
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

        {/* Recipients selection */}
        {recipientSource === 'manual' ? (
          <div className="flex gap-2">
            <Input
              value={manualPhone}
              onChange={e => setManualPhone(e.target.value)}
              placeholder="05xxxxxxxx"
              dir="ltr"
              className="flex-1"
              onKeyDown={e => e.key === 'Enter' && addManualRecipient()}
            />
            <Button size="sm" variant="outline" onClick={addManualRecipient}>הוסף</Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="חפש לפי שם, טלפון או כתובת..."
            />
            <div className="flex gap-2 items-center">
              <Button size="sm" variant="ghost" onClick={selectAll} className="text-xs">בחר הכל</Button>
              <Button size="sm" variant="ghost" onClick={clearAll} className="text-xs">נקה</Button>
              {selectedRecipients.length > 0 && (
                <span className="text-xs font-medium text-primary">{selectedRecipients.length} נבחרו</span>
              )}
              <span className="text-xs text-muted-foreground mr-auto">
                {filteredRecipients.length} תוצאות
              </span>
            </div>
            <div className="max-h-40 overflow-y-auto border rounded-md divide-y">
              {filteredRecipients.map(r => {
                const isSelected = selectedRecipients.some(s => s.phone === r.phone);
                return (
                  <div
                    key={r.id}
                    className={`px-3 py-2 cursor-pointer transition-colors text-sm ${
                      isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => toggleRecipient(r)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{r.name}</span>
                      <span className="text-muted-foreground text-xs" dir="ltr">
                        {formatPhone(r.phone)}
                      </span>
                    </div>
                    {r.extra && (
                      <span className="text-xs text-muted-foreground">{r.extra}</span>
                    )}
                  </div>
                );
              })}
              {filteredRecipients.length === 0 && !loading && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {searchQuery ? 'לא נמצאו תוצאות' : 'אין נמענים זמינים'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected recipients badges */}
        {selectedRecipients.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedRecipients.map(r => (
              <Badge key={r.phone} variant="secondary" className="gap-1">
                {r.name || formatPhone(r.phone)}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setSelectedRecipients(prev => prev.filter(p => p.phone !== r.phone))}
                />
              </Badge>
            ))}
          </div>
        )}

        {/* Template + Message */}
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

        <Textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="כתוב הודעה... (השתמש ב-{שם} ו-{כתובת} להתאמה אישית)"
          rows={3}
        />

        <Button
          onClick={handleSend}
          disabled={isSending || selectedRecipients.length === 0 || !message.trim()}
          className="w-full"
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
  );
};
