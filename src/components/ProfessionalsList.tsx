import { useState } from 'react';
import { useProfessionals, NewProfessional } from '@/hooks/useProfessionals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Phone, MessageCircle, Copy, Globe, Tag, Check } from 'lucide-react';
import { toast } from 'sonner';

const PROFESSIONS = ['שרברב', 'חשמלאי', 'צבעי', 'מנעולן', 'מיזוג אוויר', 'נגר', 'מוביל', 'קבלן שיפוצים', 'אדריכל', 'מעצב פנים', 'עורך דין', 'שמאי', 'וילונות', 'ניקיון', 'אחר'];

const PROFESSION_EMOJI: Record<string, string> = {
  'שרברב': '🔧',
  'חשמלאי': '⚡',
  'צבעי': '🎨',
  'מנעולן': '🔑',
  'מיזוג אוויר': '❄️',
  'נגר': '🪚',
  'מוביל': '🚚',
  'קבלן שיפוצים': '🏗️',
  'אדריכל': '📐',
  'מעצב פנים': '🛋️',
  'עורך דין': '⚖️',
  'שמאי': '📊',
  'וילונות': '🪟',
  'ניקיון': '🧹',
  'אחר': '👷',
};

const emptyPro: NewProfessional = { name: '', profession: '', phone: '', area: '', notes: '', website: '', coupon_code: '' };

const ProfessionalsList = () => {
  const { professionals, loading, addProfessional, updateProfessional, deleteProfessional } = useProfessionals();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<NewProfessional>(emptyPro);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  const handleSave = async () => {
    if (!formData.name || !formData.profession) return;
    if (editingId) {
      await updateProfessional(editingId, formData);
    } else {
      await addProfessional(formData);
    }
    setFormData(emptyPro);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (pro: any) => {
    setEditingId(pro.id);
    setFormData({
      name: pro.name,
      profession: pro.profession,
      phone: pro.phone || '',
      area: pro.area || '',
      notes: pro.notes || '',
      website: pro.website || '',
      coupon_code: pro.coupon_code || '',
    });
    setShowForm(true);
  };

  const copyPhone = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(id);
    toast.success('הטלפון הועתק!');
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const copyCoupon = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(id);
    toast.success('קוד הקופון הועתק!');
    setTimeout(() => setCopiedCoupon(null), 2000);
  };

  const sendWhatsApp = (pro: any) => {
    if (!pro.phone) return;
    const phone = pro.phone.replace(/[^0-9]/g, '');
    const formattedPhone = phone.startsWith('0') ? `972${phone.slice(1)}` : phone;
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">טוען...</div>;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setFormData(emptyPro); setEditingId(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 ml-1" /> הוסף איש מקצוע
        </Button>
      </div>

      {professionals.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">אין אנשי מקצוע עדיין</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {professionals.map(pro => {
            const emoji = PROFESSION_EMOJI[pro.profession] || '👷';
            return (
              <div
                key={pro.id}
                className="rounded-xl border border-border bg-card p-4 space-y-3 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{emoji}</span>
                    <div>
                      <h3 className="font-semibold text-foreground">{pro.name}</h3>
                      <p className="text-sm text-muted-foreground">{pro.profession}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(pro)} title="ערוך">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteProfessional(pro.id)} title="מחק">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* Info */}
                {pro.area && (
                  <p className="text-xs text-muted-foreground">📍 {pro.area}</p>
                )}
                {pro.notes && (
                  <p className="text-xs text-muted-foreground">📝 {pro.notes}</p>
                )}

                {/* Coupon */}
                {pro.coupon_code && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                      <Tag className="h-3 w-3" />
                      <span className="font-mono font-semibold text-xs">{pro.coupon_code}</span>
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => copyCoupon(pro.coupon_code!, pro.id)}
                      title="העתק קוד קופון"
                    >
                      {copiedCoupon === pro.id ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {pro.phone && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1.5"
                        onClick={() => window.open(`tel:${pro.phone}`, '_self')}
                      >
                        <Phone className="h-3.5 w-3.5" />
                        חייג
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1.5"
                        onClick={() => copyPhone(pro.phone!, pro.id)}
                      >
                        {copiedPhone === pro.id ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedPhone === pro.id ? 'הועתק!' : 'העתק טלפון'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1.5 text-green-600 border-green-200 hover:bg-green-50"
                        onClick={() => sendWhatsApp(pro)}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </Button>
                    </>
                  )}
                  {pro.website && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1.5"
                      onClick={() => window.open(pro.website!.startsWith('http') ? pro.website! : `https://${pro.website}`, '_blank')}
                    >
                      <Globe className="h-3.5 w-3.5" />
                      אתר
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingId(null); } }}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'עריכת איש מקצוע' : 'הוספת איש מקצוע'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">שם *</label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="שם מלא" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">מקצוע *</label>
              <Select value={formData.profession} onValueChange={v => setFormData({ ...formData, profession: v })}>
                <SelectTrigger><SelectValue placeholder="בחר מקצוע" /></SelectTrigger>
                <SelectContent>{PROFESSIONS.map(p => <SelectItem key={p} value={p}>{PROFESSION_EMOJI[p] || '👷'} {p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">טלפון</label>
              <Input dir="ltr" className="text-right" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="050-0000000" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">אזור</label>
              <Input value={formData.area || ''} onChange={e => setFormData({ ...formData, area: e.target.value })} placeholder="תל אביב, מרכז..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">אתר</label>
              <Input dir="ltr" className="text-right" value={formData.website || ''} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="www.example.com" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">קוד קופון / הנחה</label>
              <Input value={formData.coupon_code || ''} onChange={e => setFormData({ ...formData, coupon_code: e.target.value })} placeholder="לדוגמה: PRIME10" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">הערות</label>
              <Input value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="הערות נוספות..." />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="flex-1">{editingId ? 'עדכן' : 'הוסף'}</Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>ביטול</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfessionalsList;
