import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Blocker } from 'react-router-dom';

interface UnsavedChangesDialogProps {
  blocker: Blocker;
}

export const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({ blocker }) => {
  if (blocker.state !== 'blocked') return null;

  return (
    <AlertDialog open={true}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>יש שינויים שלא נשמרו</AlertDialogTitle>
          <AlertDialogDescription>
            השינויים שביצעת לא נשמרו. האם אתה בטוח שברצונך לצאת?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse gap-2">
          <AlertDialogCancel onClick={() => blocker.reset?.()}>
            המשך לערוך
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => blocker.proceed?.()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            צא בלי לשמור
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
