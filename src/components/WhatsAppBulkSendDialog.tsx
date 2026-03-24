import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Send, Pencil, ChevronDown, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWhatsAppSender } from '@/hooks/useWhatsAppSender';
import { formatIsraeliPhone } from '@/utils/phoneFormatter';
import { ConfirmDialog } from '@/components/social/ConfirmDialog';

interface Recipient {
  id: string;
  name: string;
  phone: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
}

interface WhatsAppBulkSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipients: Recipient[];
  onComplete?: () => void;
  templateCategory?: string;
}

type SendStatus = 'pending' | 'sending' | 'sent' | 'failed';

export const WhatsAppBulkSendDialog = ({ open, onOpenChange, recipients, onComplete, templateCategory = 'general' }: WhatsAppBulkSendDialogProps) => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [message, setMessage] = useState('');
  const [templatePopoverOpen, setTemplatePopoverOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [editTemplateName, setEditTemplateName] = useState('');
  const [editTemplateContent, setEditTemplateContent] = useState('');
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [sendStatuses, setSendStatuses] = useState<Record<string, SendStatus>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { toast } = useToast();
  const { sendWhatsAppMessage } = useWhatsAppSender();

  useEffect(() => {
    if (open) {
      loadTemplates();
      setMessage('');
      setSelectedTemplate('');
      setIsBulkSending(false);
      setSendStatuses({});
      setCurrentIndex(0);
    }
  }, [open]);

  const loadTemplates = async () => {
    const { data } = await supabase.from('message_templates').select('*').eq('category', templateCategory).order('name');
    setTemplates(data || []);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setMessage(template.content);
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

  const personalizeMessage = (baseMessage: string, recipient: Recipient) => {
    return baseMessage
      .replace(/\{שם\}/g, recipient.name)
      .replace(/\{\{ownerName\}\}/g, recipient.name)
      .replace(/\{name\}/g, recipient.name);
  };

  const handleBulkSend = async () => {
    if (!message.trim()) {
      toast({ title: 'נא לכתוב הודעה', variant: 'destructive' });
      return;
    }

    setIsBulkSending(true);
    const initialStatuses: Record<string, SendStatus> = {};
    recipients.forEach(r => { initialStatuses[r.id] = 'pending'; });
    setSendStatuses(initialStatuses);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      setCurrentIndex(i);
      setSendStatuses(prev => ({ ...prev, [recipient.id]: 'sending' }));

      try {
        const personalizedMsg = personalizeMessage(message, recipient);
        const result = await sendWhatsAppMessage({
          phone: recipient.phone,
          message: personalizedMsg,
        });

        setSendStatuses(prev => ({
          ...prev,
          [recipient.id]: result.success ? 'sent' : 'failed',
        }));

        if (result.success) successCount++;
        else failCount++;
      } catch {
        setSendStatuses(prev => ({ ...prev, [recipient.id]: 'failed' }));
        failCount++;
      }

      // Small delay between sends
      if (i < recipients.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    toast({
      title: 'השליחה הושלמה',
      description: `נשלחו ${successCount} הודעות${failCount > 0 ? `, ${failCount} נכשלו` : ''}`,
    });

    setIsBulkSending(false);
    onComplete?.();
  };

  const sentCount = Object.values(sendStatuses).filter(s => s === 'sent').length;
  const failedCount = Object.values(sendStatuses).filter(s => s === 'failed').length;
  const progress = recipients.length > 0 ? ((sentCount + failedCount) / recipients.length) * 100 : 0;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!isBulkSending) onOpenChange(v); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>שליחת WhatsApp ל-{recipients.length} נמענים</DialogTitle>
          </DialogHeader>

          {/* Recipients preview */}
          <div className="border rounded-md p-2 max-h-[120px] overflow-y-auto">
            <div className="flex flex-wrap gap-1.5">
              {recipients.map(r => (
                <span key={r.id} className="inline-flex items-center gap-1 text-xs bg-muted rounded-full px-2 py-0.5">
                  {r.name}
                  {isBulkSending && (
                    sendStatuses[r.id] === 'sent' ? <CheckCircle className="h-3 w-3 text-green-600" /> :
                    sendStatuses[r.id] === 'failed' ? <XCircle className="h-3 w-3 text-destructive" /> :
                    sendStatuses[r.id] === 'sending' ? <Loader2 className="h-3 w-3 animate-spin text-primary" /> :
                    null
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Progress bar during sending */}
          {isBulkSending && (
            <div className="space-y-1">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {sentCount + failedCount} / {recipients.length} — {sentCount} הצליחו, {failedCount} נכשלו
              </p>
            </div>
          )}

          {/* Template selector */}
          {!isBulkSending && (
            <>
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

              <div className="text-[10px] text-muted-foreground">
                משתנים זמינים: {'{שם}'} — יוחלף בשם הנמען לכל הודעה
              </div>

              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="כתוב את ההודעה כאן..."
                className="min-h-[120px] text-sm"
                dir="rtl"
              />

              <Button
                onClick={() => {
                  if (!message.trim()) {
                    toast({ title: 'נא לכתוב הודעה', variant: 'destructive' });
                    return;
                  }
                  setConfirmOpen(true);
                }}
                disabled={!message.trim()}
                className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                <Send className="h-4 w-4" />
                שלח ל-{recipients.length} נמענים
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm bulk send dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="שליחת הודעות WhatsApp"
        description={`האם לשלוח הודעה ל-${recipients.length} נמענים?`}
        confirmLabel="שלח"
        cancelLabel="ביטול"
        onConfirm={() => {
          setConfirmOpen(false);
          handleBulkSend();
        }}
      />

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
    </>
  );
};
