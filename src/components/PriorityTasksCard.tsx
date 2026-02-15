import React, { useState, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Plus, Trash2, ChevronDown, ChevronUp, Calendar, ListTodo, Pencil, Check, X } from 'lucide-react';
import { usePriorityTasks, PriorityTask, TaskType } from '@/hooks/usePriorityTasks';
import { format, isToday, isTomorrow, isPast, parseISO, formatDistanceToNow } from 'date-fns';
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
  onDelete,
  onPriorityChange,
  onEdit
}: { 
  task: PriorityTask; 
  onToggle: () => void; 
  onDelete: () => void;
  onPriorityChange: (newPriority: number) => void;
  onEdit: (title: string) => void;
}) => {
  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && !task.is_completed;
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  
  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      onEdit(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(task.title);
    setIsEditing(false);
  };
  
  return (
    <div className={cn(
      "p-3 rounded-lg border transition-all space-y-2",
      task.is_completed ? "bg-muted/50 opacity-60" : "bg-background hover:bg-muted/30",
      isOverdue && !task.is_completed && "border-red-500/50"
    )}>
      {/* Row 1: priority number + edit + delete */}
      <div className="flex items-center justify-between">
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(
              "flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-primary/50 transition-all",
              getPriorityColor(task.priority)
            )}>
              {task.priority}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-16 p-1" align="start">
            <div className="flex flex-col gap-1">
              {[1, 2, 3, 4, 5].map((p) => (
                <button
                  key={p}
                  onClick={() => onPriorityChange(p)}
                  className={cn(
                    "w-full py-1 px-2 text-sm rounded text-center transition-colors",
                    task.priority === p 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-primary"
            onClick={() => { setEditTitle(task.title); setIsEditing(true); }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Row 2: checkbox + text */}
      <div className="flex items-start gap-2">
        <Checkbox 
          checked={task.is_completed}
          onCheckedChange={onToggle}
          className="mt-0.5"
        />
        <div className="flex-1">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                className="h-7 text-sm"
                autoFocus
              />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSaveEdit}>
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancelEdit}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <p className={cn(
              "text-sm font-medium",
              task.is_completed && "line-through text-muted-foreground"
            )}>
              {task.title}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            {task.due_date && (
              <p className={cn(
                "text-xs flex items-center gap-1",
                isOverdue ? "text-red-500" : "text-muted-foreground"
              )}>
                <Calendar className="w-3 h-3" />
                {formatDueDate(task.due_date)}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(parseISO(task.created_at), { locale: he, addSuffix: true })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

TaskItem.displayName = 'TaskItem';

interface PriorityTasksCardProps {
  taskType?: TaskType;
  title?: string;
}

export const PriorityTasksCard = memo(({ 
  taskType = 'weekly',
  title = 'Weekly Priority'
}: PriorityTasksCardProps) => {
  const { tasks, isLoading, addTask, toggleComplete, deleteTask, updateTask } = usePriorityTasks(taskType);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('1');
  const [newDueDate, setNewDueDate] = useState<Date | undefined>(taskType === 'daily' ? new Date() : undefined);
  const [showCompleted, setShowCompleted] = useState(false);

  const activeTasks = tasks.filter(t => !t.is_completed);
  const completedTasks = tasks.filter(t => t.is_completed);

  const handleAddTask = async () => {
    if (!newTitle.trim()) return;
    const dueDate = taskType === 'daily' && newDueDate ? format(newDueDate, 'yyyy-MM-dd') : undefined;
    await addTask(newTitle.trim(), parseInt(newPriority), dueDate);
    setNewTitle('');
    setNewPriority('1');
    if (taskType === 'daily') {
      setNewDueDate(new Date());
    }
  };

  const handlePriorityChange = async (taskId: string, newPriority: number) => {
    await updateTask(taskId, { priority: newPriority });
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
            {title}
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
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg whitespace-nowrap shrink-0">
          <ListTodo className="h-5 w-5" />
          {title}
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
            <SelectTrigger className="w-16 shrink-0">
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
          {taskType === 'daily' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Calendar className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={newDueDate}
                  onSelect={setNewDueDate}
                  className="pointer-events-auto"
                  locale={he}
                />
              </PopoverContent>
            </Popover>
          )}
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
                onPriorityChange={(newPriority) => handlePriorityChange(task.id, newPriority)}
                onEdit={(title) => updateTask(task.id, { title })}
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
                  onPriorityChange={(newPriority) => handlePriorityChange(task.id, newPriority)}
                  onEdit={(title) => updateTask(task.id, { title })}
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
