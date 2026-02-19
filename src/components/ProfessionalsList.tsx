import { useState } from 'react';
import { useProfessionals, NewProfessional } from '@/hooks/useProfessionals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Check, X, MessageCircle } from 'lucide-react';

const PROFESSIONS = ['שרברב', 'חשמלאי', 'צבעי', 'מנעולן', 'מיזוג אוויר', 'נגר', 'מוביל', 'קבלן שיפוצים', 'אדריכל', 'מעצב פנים', 'עורך דין', 'שמאי', 'אחר'];

const emptyPro: NewProfessional = { name: '', profession: '', phone: '', area: '', notes: '' };

const ProfessionalsList = () => {
  const { professionals, loading, addProfessional, updateProfessional, deleteProfessional } = useProfessionals();
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<NewProfessional>(emptyPro);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<NewProfessional>(emptyPro);

  const handleAdd = async () => {
    if (!newItem.name || !newItem.profession) return;
    await addProfessional(newItem);
    setNewItem(emptyPro);
    setIsAdding(false);
  };

  const handleUpdate = async (id: string) => {
    await updateProfessional(id, editItem);
    setEditingId(null);
  };

  const startEdit = (pro: any) => {
    setEditingId(pro.id);
    setEditItem({ name: pro.name, profession: pro.profession, phone: pro.phone, area: pro.area, notes: pro.notes });
  };

  const sendWhatsApp = (pro: any) => {
    const text = `שלום, הנה פרטי איש מקצוע שאני ממליץ עליו:\n\n👤 ${pro.name}\n🔧 ${pro.profession}\n📞 ${pro.phone || 'לא צוין'}${pro.area ? `\n📍 ${pro.area}` : ''}${pro.notes ? `\n📝 ${pro.notes}` : ''}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) return <div className="text-center py-4 text-muted-foreground">טוען...</div>;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="h-4 w-4 ml-1" /> הוסף איש מקצוע
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>שם</TableHead>
            <TableHead>מקצוע</TableHead>
            <TableHead>טלפון</TableHead>
            <TableHead>אזור</TableHead>
            <TableHead>הערות</TableHead>
            <TableHead className="w-[130px]">פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isAdding && (
            <TableRow>
              <TableCell><Input className="h-8" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="שם" /></TableCell>
              <TableCell>
                <Select value={newItem.profession} onValueChange={v => setNewItem({ ...newItem, profession: v })}>
                  <SelectTrigger className="h-8"><SelectValue placeholder="בחר" /></SelectTrigger>
                  <SelectContent>{PROFESSIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </TableCell>
              <TableCell><Input className="h-8" value={newItem.phone || ''} onChange={e => setNewItem({ ...newItem, phone: e.target.value })} placeholder="טלפון" /></TableCell>
              <TableCell><Input className="h-8" value={newItem.area || ''} onChange={e => setNewItem({ ...newItem, area: e.target.value })} placeholder="אזור" /></TableCell>
              <TableCell><Input className="h-8" value={newItem.notes || ''} onChange={e => setNewItem({ ...newItem, notes: e.target.value })} /></TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleAdd}><Check className="h-4 w-4 text-green-600" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setIsAdding(false); setNewItem(emptyPro); }}><X className="h-4 w-4 text-red-600" /></Button>
                </div>
              </TableCell>
            </TableRow>
          )}
          {professionals.map(pro => (
            <TableRow key={pro.id}>
              {editingId === pro.id ? (
                <>
                  <TableCell><Input className="h-8" value={editItem.name} onChange={e => setEditItem({ ...editItem, name: e.target.value })} /></TableCell>
                  <TableCell>
                    <Select value={editItem.profession} onValueChange={v => setEditItem({ ...editItem, profession: v })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{PROFESSIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Input className="h-8" value={editItem.phone || ''} onChange={e => setEditItem({ ...editItem, phone: e.target.value })} /></TableCell>
                  <TableCell><Input className="h-8" value={editItem.area || ''} onChange={e => setEditItem({ ...editItem, area: e.target.value })} /></TableCell>
                  <TableCell><Input className="h-8" value={editItem.notes || ''} onChange={e => setEditItem({ ...editItem, notes: e.target.value })} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleUpdate(pro.id)}><Check className="h-4 w-4 text-green-600" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}><X className="h-4 w-4 text-red-600" /></Button>
                    </div>
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell className="font-medium">{pro.name}</TableCell>
                  <TableCell>{pro.profession}</TableCell>
                  <TableCell dir="ltr" className="text-right">{pro.phone || '-'}</TableCell>
                  <TableCell>{pro.area || '-'}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{pro.notes}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => sendWhatsApp(pro)} title="שלח בוואטסאפ"><MessageCircle className="h-3.5 w-3.5 text-green-600" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(pro)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteProfessional(pro.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
          {professionals.length === 0 && !isAdding && (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">אין אנשי מקצוע עדיין</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProfessionalsList;
