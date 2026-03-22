import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Send, MessageCircle, Pencil, CheckCircle, Clock, XCircle, ChevronDown, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWhatsAppSender } from '@/hooks/useWhatsAppSender';
import { formatIsraeliPhone } from '@/utils/phoneFormatter';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { Input } from '@/components/ui/input';

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
}

interface WhatsAppSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone: string;
  name: string;
  context?: string;
  templateCategory?: string;
}

export const WhatsAppSendDialog = ({ open, onOpenChange, phone, name, context, templateCategory = 'general' }: WhatsAppSendDialogProps) => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [message, setMessage] = useState('');
  const [templatePopoverOpen, setTemplatePopoverOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [editTemplateName, setEditTemplateName] = useState('');
  const [editTemplateContent, setEditTemplateContent] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<WhatsAppMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const { toast } = useToast();
  const { sendWhatsAppMessage, isSending } = useWhatsAppSender();

  useEffect(() => {
    if (open) {
      loadTemplates();
      setMessage('');
      setSelectedTemplate('');
      setChatOpen(false);
    }
  }, [open]);

  const loadTemplates = async () => {
    const { data } = await supabase.from('message_templates').select('*').eq('category', templateCategory).order('name');
    setTemplates(data || []);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      let content = template.content
        .replace(/\{שם\}/g, name)
        .replace(/\{\{ownerName\}\}/g, name)
        .replace(/\{\{address\}\}/g, context || '');
      setMessage(content);
    }
    setSelectedTemplate(templateId);
    setTemplatePopoverOpen(false);
  };

  const startEditTemplate = (template: MessageTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
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
    if (selectedTemplate === editingTemplate.id) setMessage(editTemplateContent);
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast({ title: 'נא לכתוב הודעה', variant: 'destructive' });
      return;
    }
    const result = await sendWhatsAppMessage({ phone, message });
    if (result.success) {
      onOpenChange(false);
    }
  };

  const openChatHistory = async () => {
    setChatOpen(true);
    setChatLoading(true);
    try {
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-base">{name}</span>
                <span className="text-xs text-muted-foreground font-normal">{formatIsraeliPhone(phone)}</span>
              </div>
              <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs" onClick={openChatHistory}>
                <MessageCircle className="h-3.5 w-3.5" />
                היסטוריה
              </Button>
            </DialogTitle>
          </DialogHeader>

          {context && (
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
              {context}
            </div>
          )}

          {/* Template selector */}
          <Popover open={templatePopoverOpen} onOpenChange={setTemplatePopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between h-8 text-xs">
                {selectedTemplate ? templates.find(t => t.id === selectedTemplate)?.name : 'בחר תבנית (אופציונלי)'}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" align="start">
              {templates.map(template => (
                <div
                  key={template.id}
                  className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm"
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <span className="truncate">{template.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 shrink-0"
                    onClick={(e) => startEditTemplate(template, e)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {templates.length === 0 && (
                <p className="text-xs text-muted-foreground p-2 text-center">אין תבניות</p>
              )}
            </PopoverContent>
          </Popover>

          {/* Message editor */}
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`היי ${name}, ...`}
            className="min-h-[120px] text-sm"
            dir="rtl"
          />

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={isSending || !message.trim()}
            className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
          >
            <Send className="h-4 w-4" />
            {isSending ? 'שולח...' : 'שלח הודעה'}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Template edit dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(v) => !v && setEditingTemplate(null)}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>עריכת תבנית</DialogTitle>
          </DialogHeader>
          <Input
            value={editTemplateName}
            onChange={(e) => setEditTemplateName(e.target.value)}
            placeholder="שם התבנית"
            className="text-sm"
          />
          <Textarea
            value={editTemplateContent}
            onChange={(e) => setEditTemplateContent(e.target.value)}
            className="min-h-[100px] text-sm"
            dir="rtl"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setEditingTemplate(null)}>ביטול</Button>
            <Button size="sm" onClick={saveTemplate}>שמור</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat history dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-md max-h-[70vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle>שיחה עם {name}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto space-y-2 max-h-[50vh]">
            {chatLoading ? (
              <p className="text-center text-sm text-muted-foreground py-4">טוען...</p>
            ) : chatMessages.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">אין הודעות</p>
            ) : (
              chatMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === 'outbound' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.direction === 'outbound' ? 'bg-green-100 text-green-900' : 'bg-muted'
                  }`}>
                    <p className="whitespace-pre-wrap text-xs">{msg.message}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: he })}
                      </span>
                      {msg.direction === 'outbound' && getStatusIcon(msg.status)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
