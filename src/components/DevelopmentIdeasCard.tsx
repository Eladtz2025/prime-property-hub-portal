import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbulb, Plus, Trash2, Loader2 } from 'lucide-react';
import { useDevelopmentIdeas } from '@/hooks/useDevelopmentIdeas';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const getPriorityIndicator = (priority: string) => {
  switch (priority) {
    case 'high': return { color: 'bg-red-500', label: 'גבוה' };
    case 'low': return { color: 'bg-gray-400', label: 'נמוך' };
    default: return { color: 'bg-yellow-500', label: 'בינוני' };
  }
};

export const DevelopmentIdeasCard: React.FC = () => {
  const { ideas, isLoading, addIdea, toggleComplete, deleteIdea, updatePriority } = useDevelopmentIdeas();
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddIdea = async () => {
    if (!newIdeaTitle.trim()) return;
    
    setIsAdding(true);
    await addIdea(newIdeaTitle.trim(), newPriority);
    setNewIdeaTitle('');
    setNewPriority('medium');
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isAdding) {
      handleAddIdea();
    }
  };

  const pendingIdeas = ideas.filter(i => !i.is_completed);
  const completedIdeas = ideas.filter(i => i.is_completed);

  return (
    <Card className="h-full shadow-card animate-fade-in border border-border/50 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg whitespace-nowrap shrink-0">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          רעיונות לפיתוח
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new idea */}
        <div className="flex gap-2">
          <Select value={newPriority} onValueChange={setNewPriority}>
            <SelectTrigger className="w-20 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  גבוה
                </span>
              </SelectItem>
              <SelectItem value="medium">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  בינוני
                </span>
              </SelectItem>
              <SelectItem value="low">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  נמוך
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={newIdeaTitle}
            onChange={(e) => setNewIdeaTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="הוסף רעיון חדש..."
            className="flex-1"
            disabled={isAdding}
          />
          <Button 
            onClick={handleAddIdea} 
            disabled={!newIdeaTitle.trim() || isAdding}
            size="sm"
            className="shrink-0"
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 ml-1" />
                הוסף
              </>
            )}
          </Button>
        </div>

        {/* Ideas list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : ideas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">אין רעיונות עדיין</p>
            <p className="text-xs">הוסף את הרעיון הראשון שלך!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Pending ideas */}
            {pendingIdeas.map((idea) => (
              <div
                key={idea.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50 group hover:bg-muted transition-colors"
              >
                <span className={cn(
                  "w-2 h-2 rounded-full mt-2 shrink-0",
                  getPriorityIndicator(idea.priority).color
                )} />
                <Checkbox
                  checked={idea.is_completed}
                  onCheckedChange={() => toggleComplete(idea.id, idea.is_completed)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{idea.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(idea.created_at), 'dd/MM/yyyy', { locale: he })}
                  </p>
                </div>
                <Select 
                  value={idea.priority || 'medium'} 
                  onValueChange={(value) => updatePriority(idea.id, value)}
                >
                  <SelectTrigger className="w-16 h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">גבוה</SelectItem>
                    <SelectItem value="medium">בינוני</SelectItem>
                    <SelectItem value="low">נמוך</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteIdea(idea.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {/* Completed ideas */}
            {completedIdeas.length > 0 && (
              <>
                {pendingIdeas.length > 0 && (
                  <div className="border-t border-border/50 pt-2 mt-3">
                    <p className="text-xs text-muted-foreground mb-2">הושלמו ({completedIdeas.length})</p>
                  </div>
                )}
                {completedIdeas.slice(0, 3).map((idea) => (
                  <div
                    key={idea.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/30 group"
                  >
                    <span className={cn(
                      "w-2 h-2 rounded-full mt-2 shrink-0",
                      getPriorityIndicator(idea.priority).color
                    )} />
                    <Checkbox
                      checked={idea.is_completed}
                      onCheckedChange={() => toggleComplete(idea.id, idea.is_completed)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-through text-muted-foreground">{idea.title}</p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        ✓ הושלם {idea.completed_at && format(new Date(idea.completed_at), 'dd/MM/yyyy', { locale: he })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteIdea(idea.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {completedIdeas.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{completedIdeas.length - 3} נוספים שהושלמו
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};