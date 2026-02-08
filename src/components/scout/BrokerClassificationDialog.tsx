import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  UserCheck,
  Play,
  Square,
  Loader2,
  AlertTriangle,
  Eye,
  Wrench,
  Clock,
} from 'lucide-react';
import { useReclassifyBroker, BrokerSource, BrokerMode } from '@/hooks/useReclassifyBroker';

interface BrokerClassificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SOURCE_LABELS: Record<string, string> = {
  all: 'הכל (סדרתי)',
  homeless: 'הומלס',
  madlan: 'מדלן',
  yad2: 'יד2',
};

const formatTime = (isoString: string | null) => {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
};

export const BrokerClassificationDialog: React.FC<BrokerClassificationDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const {
    isRunning,
    isStarting,
    isStopping,
    progress,
    percentComplete,
    results,
    allResults,
    runningSource,
    brokerSource,
    setBrokerSource,
    brokerMode,
    setBrokerMode,
    brokerMaxItems,
    setBrokerMaxItems,
    start,
    stop,
  } = useReclassifyBroker();

  const isAudit = brokerMode === 'audit';
  const hasResults = results || Object.keys(allResults).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            תיקון סיווג תיווך/פרטי
          </DialogTitle>
          <DialogDescription>
            אימות ותיקון סיווג נכסים כפרטי/תיווך על בסיס תכונות המודעה המקורית
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Controls - disabled when running */}
          <div className="grid grid-cols-3 gap-3">
            {/* Source */}
            <div className="space-y-1.5">
              <Label className="text-xs">מקור</Label>
              <Select
                value={brokerSource}
                onValueChange={(v) => setBrokerSource(v as BrokerSource)}
                disabled={isRunning}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">הכל (סדרתי)</SelectItem>
                  <SelectItem value="homeless">הומלס</SelectItem>
                  <SelectItem value="madlan">מדלן</SelectItem>
                  <SelectItem value="yad2">יד2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mode */}
            <div className="space-y-1.5">
              <Label className="text-xs">מצב</Label>
              <Select
                value={brokerMode}
                onValueChange={(v) => setBrokerMode(v as BrokerMode)}
                disabled={isRunning}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="audit">
                    <span className="flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      AUDIT
                    </span>
                  </SelectItem>
                  <SelectItem value="fix">
                    <span className="flex items-center gap-1.5">
                      <Wrench className="h-3.5 w-3.5" />
                      FIX
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Max Items */}
            <div className="space-y-1.5">
              <Label className="text-xs">מקסימום פריטים</Label>
              <Input
                type="number"
                min={5}
                max={10000}
                value={brokerMaxItems}
                onChange={(e) => setBrokerMaxItems(parseInt(e.target.value) || 5)}
                disabled={isRunning}
                className="h-9"
              />
            </div>
          </div>

          {/* Mode badge */}
          <div className="flex items-center gap-2">
            <Badge variant={isAudit ? 'secondary' : 'destructive'} className="text-xs">
              {isAudit ? '🔍 AUDIT – ללא שינוי ב-DB' : '⚡ FIX – מעדכן ב-DB'}
            </Badge>
            {brokerSource === 'all' && (
              <Badge variant="outline" className="text-xs">
                homeless → madlan → yad2
              </Badge>
            )}
          </div>

          {/* Warning for FIX mode */}
          {!isAudit && !isRunning && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  מצב FIX ישנה את ערכי is_private ב-DB. מומלץ להריץ קודם AUDIT.
                </p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {!isRunning ? (
              <Button
                onClick={start}
                disabled={isStarting}
                className="flex-1"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    מתחיל...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 ml-2" />
                    הפעל {isAudit ? 'AUDIT' : 'FIX'}
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={stop}
                disabled={isStopping}
                variant="destructive"
                className="flex-1"
              >
                {isStopping ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    עוצר...
                  </>
                ) : (
                  <>
                    <Square className="h-4 w-4 ml-2" />
                    עצור
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Progress section */}
          {isRunning && progress && (
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg border">
              {/* Running source indicator */}
              {runningSource && (
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="font-medium">מעבד: {SOURCE_LABELS[runningSource] || runningSource}</span>
                  {brokerSource === 'all' && (
                    <Badge variant="outline" className="text-[10px]">סדרתי</Badge>
                  )}
                </div>
              )}

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{progress.processed_items || 0} / {progress.total_items || '?'}</span>
                  <span>{percentComplete}%</span>
                </div>
                <Progress value={percentComplete} className="h-2" />
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-1.5 bg-background rounded">
                  <div className="font-medium text-green-600">{progress.successful_items || 0}</div>
                  <div className="text-muted-foreground">הצלחה</div>
                </div>
                <div className="text-center p-1.5 bg-background rounded">
                  <div className="font-medium text-red-600">{progress.failed_items || 0}</div>
                  <div className="text-muted-foreground">נכשל</div>
                </div>
                <div className="text-center p-1.5 bg-background rounded">
                  <div className="font-medium flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(progress.started_at)}
                  </div>
                  <div className="text-muted-foreground">התחלה</div>
                </div>
              </div>
            </div>
          )}

          {/* Results section */}
          {!isRunning && hasResults && (
            <>
              <Separator />
              <ResultsSummary results={results} allResults={allResults} isAudit={isAudit} />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Results display component
const ResultsSummary: React.FC<{
  results: Record<string, any> | null;
  allResults: Record<string, Record<string, any>>;
  isAudit: boolean;
}> = ({ results, allResults, isAudit }) => {
  const hasMultiple = Object.keys(allResults).length > 1;
  const displayResults = hasMultiple ? allResults : results ? { result: results } : {};

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm flex items-center gap-2">
        📊 תוצאות {isAudit ? 'AUDIT' : 'FIX'}
      </h4>

      {Object.entries(displayResults).map(([source, data]) => (
        <div key={source} className="space-y-2">
          {hasMultiple && (
            <Badge variant="outline" className="text-xs">
              {SOURCE_LABELS[source] || source}
            </Badge>
          )}

          {/* Confusion Matrix */}
          {data?.confusion_matrix && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <h5 className="text-xs font-medium text-muted-foreground">מטריצת דיוק</h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between p-1.5 bg-green-50 dark:bg-green-950/30 rounded">
                  <span>✅ תיווך נכון</span>
                  <span className="font-medium">{data.confusion_matrix.correct_broker || 0}</span>
                </div>
                <div className="flex justify-between p-1.5 bg-green-50 dark:bg-green-950/30 rounded">
                  <span>✅ פרטי נכון</span>
                  <span className="font-medium">{data.confusion_matrix.correct_private || 0}</span>
                </div>
                <div className="flex justify-between p-1.5 bg-red-50 dark:bg-red-950/30 rounded">
                  <span>❌ סווג תיווך בטעות</span>
                  <span className="font-medium">{data.confusion_matrix.misclassified_as_broker || 0}</span>
                </div>
                <div className="flex justify-between p-1.5 bg-red-50 dark:bg-red-950/30 rounded">
                  <span>❌ סווג פרטי בטעות</span>
                  <span className="font-medium">{data.confusion_matrix.misclassified_as_private || 0}</span>
                </div>
              </div>
              <div className="flex justify-between p-1.5 bg-muted/50 rounded text-xs">
                <span>⚠️ לא ניתן לאמת</span>
                <span className="font-medium">{data.confusion_matrix.unverifiable || 0}</span>
              </div>
            </div>
          )}

          {/* Transitions */}
          {data?.transitions && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <h5 className="text-xs font-medium text-muted-foreground">
                {isAudit ? 'שינויים שיבוצעו (אם יעבור ל-FIX)' : 'שינויים שבוצעו'}
              </h5>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {Object.entries(data.transitions)
                  .filter(([, count]) => (count as number) > 0)
                  .map(([key, count]) => (
                    <div key={key} className="flex justify-between p-1.5 bg-background rounded">
                      <span className="text-muted-foreground">{formatTransitionKey(key)}</span>
                      <span className="font-medium">{count as number}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

function formatTransitionKey(key: string): string {
  const map: Record<string, string> = {
    false_to_true: 'תיווך → פרטי',
    true_to_false: 'פרטי → תיווך',
    null_to_false: 'לא ידוע → תיווך',
    null_to_true: 'לא ידוע → פרטי',
    false_to_null: 'תיווך → לא ידוע',
    unchanged: 'ללא שינוי',
  };
  return map[key] || key;
}
