import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Target, Edit2, X, Plus } from 'lucide-react';
import { useDashboardGoals } from '@/hooks/useDashboardGoals';

interface DashboardGoalsGridProps {
  columns?: string;
}

export const DashboardGoalsGrid: React.FC<DashboardGoalsGridProps> = ({ columns = 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6' }) => {
  const { goals, loading, addGoal, updateGoal, deleteGoal } = useDashboardGoals();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newGoalValue, setNewGoalValue] = useState('');

  const handleStartEdit = (id: string, title: string) => {
    setEditingId(id);
    setEditValue(title);
  };

  const handleSaveEdit = () => {
    if (editingId && editValue.trim()) {
      updateGoal(editingId, editValue.trim());
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleAddGoal = () => {
    if (newGoalValue.trim()) {
      addGoal(newGoalValue.trim());
      setNewGoalValue('');
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <div className={`grid ${columns} gap-3`}>
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white/15 backdrop-blur-lg rounded-xl p-3 border border-white/10 animate-pulse h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${columns} gap-3`} dir="rtl">
      {goals.map(goal => (
        <div
          key={goal.id}
          className="bg-white/15 backdrop-blur-lg rounded-xl p-3 border border-white/10 group relative min-h-[72px] flex flex-col justify-center"
        >
          {editingId === goal.id ? (
            <Input
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') { setEditingId(null); setEditValue(''); }
              }}
              onBlur={handleSaveEdit}
              className="bg-white/20 border-white/30 text-white placeholder:text-white/70 text-sm h-8"
              autoFocus
            />
          ) : (
            <>
              <div className="flex items-start gap-2">
                <Target className="h-4 w-4 mt-0.5 shrink-0 opacity-70" />
                <span className="text-sm font-bold leading-tight break-words">{goal.title}</span>
              </div>
              <div className="absolute top-1.5 left-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleStartEdit(goal.id, goal.title)}
                  className="bg-white/20 hover:bg-white/30 rounded p-1 transition-colors"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="bg-white/20 hover:bg-red-500/50 rounded p-1 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </>
          )}
        </div>
      ))}

      {goals.length < 6 && (
        isAdding ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 border border-dashed border-white/30 flex flex-col justify-center">
            <Input
              value={newGoalValue}
              onChange={e => setNewGoalValue(e.target.value)}
              placeholder="מטרה חדשה..."
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddGoal();
                if (e.key === 'Escape') { setIsAdding(false); setNewGoalValue(''); }
              }}
              onBlur={() => { if (newGoalValue.trim()) handleAddGoal(); else setIsAdding(false); }}
              className="bg-white/20 border-white/30 text-white placeholder:text-white/70 text-sm h-8"
              autoFocus
            />
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-white/10 hover:bg-white/15 backdrop-blur-lg rounded-xl p-3 border border-dashed border-white/30 flex items-center justify-center gap-2 transition-colors min-h-[72px] cursor-pointer"
          >
            <Plus className="h-4 w-4 opacity-70" />
            <span className="text-sm opacity-70">הוסף מטרה</span>
          </button>
        )
      )}
    </div>
  );
};
