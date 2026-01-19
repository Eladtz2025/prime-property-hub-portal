import React, { useState, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Trash2, ChevronDown, ChevronUp, Calendar, ListTodo } from 'lucide-react';
import { usePriorityTasks, PriorityTask } from '@/hooks/usePriorityTasks';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const getPriorityColor = (priority: number): string => {
  switch (priority) {
    case 1: return 'bg-red-500 text-white';
    case 2: return 'bg-orange-500 text-white';
    case 3: return 'bg-yellow-500 text-black';
    case 4: return 'bg-blue-500 text-white';
    default: return 'bg-muted text-muted-foreground';
  }
};

const formatDueDate = (dateStr: string | null): string => {
  if (!dateStr) return '';
  const date = parseISO(dateStr);
  if (isToday(date)) return 'היום';
  if (isTomorrow(date)) return 'מחר';
  return format(date, 'd MMM', { locale: he });
};

const TaskItem = memo(({ 
  task, 
  onToggle, 
  onDelete 
}: { 
  task: PriorityTask; 
  onToggle: () => void; 
  onDelete: () => void;
}) => {
  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && !task.is_completed;
  
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border transition-all",
      task.is_completed ? "bg-muted/50 opacity-60" : "bg-background hover:bg-muted/30",
      isOverdue && !task.is_completed && "border-red-500/50"
    )}>
      <span className={cn(
        "flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold shrink-0",
        getPriorityColor(task.priority)
      )}>
        {task.priority}
      </span>
      
      <Checkbox 
        checked={task.is_completed}
        onCheckedChange={onToggle}
        className="shrink-0"
      />
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          task.is_completed && "line-through text-muted-foreground"
        )}>
          {task.title}
        </p>
        {task.due_date && (
          <p className={cn(
            "text-xs flex items-center gap-1 mt-0.5",
            isOverdue ? "text-red-500" : "text-muted-foreground"
          )}>
            <Calendar className="w-3 h-3" />
            {formatDueDate(task.due_date)}
          </p>
        )}
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
});

TaskItem.displayName = 'TaskItem';

export const PriorityTasksCard = memo(() => {
  const { tasks, isLoading, addTask, toggleComplete, deleteTask } = usePriorityTasks();
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('1');
  const [showCompleted, setShowCompleted] = useState(false);

  const activeTasks = tasks.filter(t => !t.is_completed);
  const completedTasks = tasks.filter(t => t.is_completed);

  const handleAddTask = async () => {
    if (!newTitle.trim()) return;
    await addTask(newTitle.trim(), parseInt(newPriority));
    setNewTitle('');
    setNewPriority('1');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListTodo className="h-5 w-5" />
            משימות בעדיפות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ListTodo className="h-5 w-5" />
          משימות בעדיפות
          {activeTasks.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({activeTasks.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add task form */}
        <div className="flex gap-2">
          <Select value={newPriority} onValueChange={setNewPriority}>
            <SelectTrigger className="w-20 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="5">5</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="הוסף משימה חדשה..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleAddTask} size="icon" className="shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Active tasks */}
        <div className="space-y-2">
          {activeTasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 text-sm">
              אין משימות פעילות
            </p>
          ) : (
            activeTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={() => toggleComplete(task.id)}
                onDelete={() => deleteTask(task.id)}
              />
            ))
          )}
        </div>

        {/* Completed tasks */}
        {completedTasks.length > 0 && (
          <Collapsible open={showCompleted} onOpenChange={setShowCompleted}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between text-muted-foreground">
                <span>הושלמו ({completedTasks.length})</span>
                {showCompleted ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {completedTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={() => toggleComplete(task.id)}
                  onDelete={() => deleteTask(task.id)}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
});

PriorityTasksCard.displayName = 'PriorityTasksCard';
