import { useState, useEffect } from 'react';
import { useBusinessExpenses, NewBusinessExpense } from '@/hooks/useBusinessExpenses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import BusinessExpensesMonthlySummary from './BusinessExpensesMonthlySummary';

const CATEGORIES = ['משרד', 'רכב', 'ביטוח', 'פרסום', 'טלפון', 'תוכנה', 'אחר'];
const FREQUENCIES = [
  { value: 'monthly', label: 'חודשי' },
  { value: 'yearly', label: 'שנתי' },
  { value: 'one_time', label: 'חד-פעמי' },
];

const emptyExpense: NewBusinessExpense = { category: '', description: '', amount: null, frequency: 'monthly', notes: '', assigned_to: null };

interface Agent {
  id: string;
  full_name: string | null;
}

const BusinessExpensesList = () => {
  const { expenses, loading, addExpense, updateExpense, deleteExpense } = useBusinessExpenses();
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<NewBusinessExpense>(emptyExpense);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<NewBusinessExpense>(emptyExpense);
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    const fetchAgents = async () => {
      const { data } = await supabase.from('profiles').select('id, full_name').order('full_name');
      if (data) setAgents(data);
    };
    fetchAgents();
  }, []);

  const handleAdd = async () => {
    if (!newItem.category) return;
    await addExpense(newItem);
    setNewItem(emptyExpense);
    setIsAdding(false);
  };

  const handleUpdate = async (id: string) => {
    await updateExpense(id, editItem);
    setEditingId(null);
  };

  const startEdit = (expense: any) => {
    setEditingId(expense.id);
    setEditItem({ category: expense.category, description: expense.description, amount: expense.amount, frequency: expense.frequency, notes: expense.notes, assigned_to: expense.assigned_to });
  };

  const freqLabel = (val: string) => FREQUENCIES.find(f => f.value === val)?.label || val;
  const agentName = (id: string | null) => {
    if (!id) return '-';
    return agents.find(a => a.id === id)?.full_name || '-';
  };

  const AgentSelect = ({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) => (
    <Select value={value || 'none'} onValueChange={v => onChange(v === 'none' ? null : v)}>
      <SelectTrigger className="h-8"><SelectValue placeholder="בחר סוכן" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="none">ללא</SelectItem>
        {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.full_name || 'ללא שם'}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  if (loading) return <div className="text-center py-4 text-muted-foreground">טוען...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="h-4 w-4 ml-1" /> הוסף הוצאה
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>קטגוריה</TableHead>
            <TableHead>תיאור</TableHead>
            <TableHead>סכום</TableHead>
            <TableHead>תדירות</TableHead>
            <TableHead>סוכן</TableHead>
            <TableHead>הערות</TableHead>
            <TableHead className="w-[100px]">פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isAdding && (
            <TableRow>
              <TableCell>
                <Select value={newItem.category} onValueChange={v => setNewItem({ ...newItem, category: v })}>
                  <SelectTrigger className="h-8"><SelectValue placeholder="בחר" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </TableCell>
              <TableCell><Input className="h-8" value={newItem.description || ''} onChange={e => setNewItem({ ...newItem, description: e.target.value })} /></TableCell>
              <TableCell><Input className="h-8" type="number" value={newItem.amount ?? ''} onChange={e => setNewItem({ ...newItem, amount: e.target.value ? Number(e.target.value) : null })} /></TableCell>
              <TableCell>
                <Select value={newItem.frequency} onValueChange={v => setNewItem({ ...newItem, frequency: v })}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{FREQUENCIES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                </Select>
              </TableCell>
              <TableCell><AgentSelect value={newItem.assigned_to} onChange={v => setNewItem({ ...newItem, assigned_to: v })} /></TableCell>
              <TableCell><Input className="h-8" value={newItem.notes || ''} onChange={e => setNewItem({ ...newItem, notes: e.target.value })} /></TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleAdd}><Check className="h-4 w-4 text-green-600" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setIsAdding(false); setNewItem(emptyExpense); }}><X className="h-4 w-4 text-red-600" /></Button>
                </div>
              </TableCell>
            </TableRow>
          )}
          {expenses.map(exp => (
            <TableRow key={exp.id}>
              {editingId === exp.id ? (
                <>
                  <TableCell>
                    <Select value={editItem.category} onValueChange={v => setEditItem({ ...editItem, category: v })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Input className="h-8" value={editItem.description || ''} onChange={e => setEditItem({ ...editItem, description: e.target.value })} /></TableCell>
                  <TableCell><Input className="h-8" type="number" value={editItem.amount ?? ''} onChange={e => setEditItem({ ...editItem, amount: e.target.value ? Number(e.target.value) : null })} /></TableCell>
                  <TableCell>
                    <Select value={editItem.frequency} onValueChange={v => setEditItem({ ...editItem, frequency: v })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{FREQUENCIES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><AgentSelect value={editItem.assigned_to} onChange={v => setEditItem({ ...editItem, assigned_to: v })} /></TableCell>
                  <TableCell><Input className="h-8" value={editItem.notes || ''} onChange={e => setEditItem({ ...editItem, notes: e.target.value })} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleUpdate(exp.id)}><Check className="h-4 w-4 text-green-600" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}><X className="h-4 w-4 text-red-600" /></Button>
                    </div>
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell className="font-medium">{exp.category}</TableCell>
                  <TableCell>{exp.description}</TableCell>
                  <TableCell>{exp.amount != null ? `₪${exp.amount.toLocaleString()}` : '-'}</TableCell>
                  <TableCell>{freqLabel(exp.frequency)}</TableCell>
                  <TableCell>{exp.profiles?.full_name || agentName(exp.assigned_to)}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{exp.notes}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(exp)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteExpense(exp.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
          {expenses.length === 0 && !isAdding && (
            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">אין הוצאות עדיין</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      <BusinessExpensesMonthlySummary expenses={expenses} agents={agents} />
    </div>
  );
};

export default BusinessExpensesList;
