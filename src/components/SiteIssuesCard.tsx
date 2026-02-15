import React, { useState, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Bug, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  ImagePlus,
  Clock,
  Wrench,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useSiteIssues, SiteIssue } from '@/hooks/useSiteIssues';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return <Clock className="w-4 h-4 text-red-500" />;
    case 'in_progress': return <Wrench className="w-4 h-4 text-yellow-500" />;
    case 'resolved': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    default: return <Clock className="w-4 h-4" />;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return 'ממתין';
    case 'in_progress': return 'בטיפול';
    case 'resolved': return 'נפתר';
    default: return status;
  }
};

const IssueItem = memo(({ 
  issue, 
  onUpdateStatus, 
  onDelete 
}: { 
  issue: SiteIssue; 
  onUpdateStatus: (status: 'pending' | 'in_progress' | 'resolved') => void; 
  onDelete: () => void;
}) => {
  return (
    <div className={cn(
      "p-3 rounded-lg border transition-all",
      issue.status === 'resolved' ? "bg-muted/50 opacity-60" : "bg-background hover:bg-muted/30"
    )}>
      <div className="flex items-start gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 h-6 w-6">
              {getStatusIcon(issue.status)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onUpdateStatus('pending')}>
              <Clock className="w-4 h-4 text-red-500 ml-2" />
              ממתין
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus('in_progress')}>
              <Wrench className="w-4 h-4 text-yellow-500 ml-2" />
              בטיפול
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus('resolved')}>
              <CheckCircle2 className="w-4 h-4 text-green-500 ml-2" />
              נפתר
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-medium",
            issue.status === 'resolved' && "line-through text-muted-foreground"
          )}>
            {issue.title}
          </p>
          {issue.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {issue.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            דיווח: {issue.reported_by || 'לא ידוע'}
          </p>
        </div>

        {issue.image_url && (
          <Dialog>
            <DialogTrigger asChild>
              <button className="shrink-0">
                <img 
                  src={issue.image_url} 
                  alt={issue.title}
                  className="w-10 h-10 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <img 
                src={issue.image_url} 
                alt={issue.title}
                className="w-full h-auto"
              />
            </DialogContent>
          </Dialog>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
});

IssueItem.displayName = 'IssueItem';

export const SiteIssuesCard = memo(() => {
  const { issues, isLoading, addIssue, updateStatus, deleteIssue, uploadImage } = useSiteIssues();
  const [newTitle, setNewTitle] = useState('');
  const [showResolved, setShowResolved] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  const activeIssues = issues.filter(i => i.status !== 'resolved');
  const resolvedIssues = issues.filter(i => i.status === 'resolved');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const url = await uploadImage(file);
    if (url) {
      setPendingImage(url);
    }
    setIsUploading(false);
  };

  const handleAddIssue = async () => {
    if (!newTitle.trim()) return;
    await addIssue(newTitle.trim(), undefined, pendingImage || undefined);
    setNewTitle('');
    setPendingImage(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddIssue();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bug className="h-5 w-5" />
            באגים ובעיות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
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
          <Bug className="h-5 w-5" />
          באגים ובעיות
          {activeIssues.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({activeIssues.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add issue form */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="תאר את הבעיה..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1"
            />
            <label className="cursor-pointer">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload}
                disabled={isUploading}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                className="shrink-0"
                disabled={isUploading}
                asChild
              >
                <span>
                  <ImagePlus className={cn("h-4 w-4", isUploading && "animate-pulse")} />
                </span>
              </Button>
            </label>
            <Button onClick={handleAddIssue} size="icon" className="shrink-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {pendingImage && (
            <div className="relative">
              <img 
                src={pendingImage} 
                alt="תמונה מצורפת" 
                className="h-16 w-auto rounded"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-5 w-5"
                onClick={() => setPendingImage(null)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Active issues */}
        <div className="space-y-2">
          {activeIssues.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 text-sm">
              אין בעיות פתוחות 🎉
            </p>
          ) : (
            activeIssues.map(issue => (
              <IssueItem
                key={issue.id}
                issue={issue}
                onUpdateStatus={(status) => updateStatus(issue.id, status)}
                onDelete={() => deleteIssue(issue.id)}
              />
            ))
          )}
        </div>

        {/* Resolved issues */}
        {resolvedIssues.length > 0 && (
          <Collapsible open={showResolved} onOpenChange={setShowResolved}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between text-muted-foreground">
                <span>נפתרו ({resolvedIssues.length})</span>
                {showResolved ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {resolvedIssues.map(issue => (
                <IssueItem
                  key={issue.id}
                  issue={issue}
                  onUpdateStatus={(status) => updateStatus(issue.id, status)}
                  onDelete={() => deleteIssue(issue.id)}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
});

SiteIssuesCard.displayName = 'SiteIssuesCard';
