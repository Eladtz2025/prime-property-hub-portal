import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface FacebookGroupCategorySelectorProps {
  facebookGroups: any[] | undefined;
  selectedGroupIds: string[];
  setSelectedGroupIds: React.Dispatch<React.SetStateAction<string[]>>;
}

/**
 * Category-checkbox grid for selecting which Facebook groups a recurring post
 * targets (extracted from AutoPublishManager). Presentational: reads facebookGroups
 * + selectedGroupIds, mutates only through setSelectedGroupIds. The caller keeps the
 * `platforms.facebook && publishTarget === 'groups'` guard.
 */
export const FacebookGroupCategorySelector: React.FC<FacebookGroupCategorySelectorProps> = ({
  facebookGroups,
  selectedGroupIds,
  setSelectedGroupIds,
}) => {
  if (!facebookGroups || facebookGroups.length === 0) {
    return <p className="text-[10px] text-muted-foreground">לא נמצאו קבוצות. הוסף קבוצות בהגדרות.</p>;
  }

  const categories = [...new Set(facebookGroups.map((g: any) => g.category).filter(Boolean))] as string[];
  if (categories.length === 0) {
    return <p className="text-[10px] text-muted-foreground">לא הוגדרו קטגוריות לקבוצות. הגדר קטגוריה בניהול קבוצות.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2 bg-muted/30 rounded-md p-2">
      {categories.map((cat) => {
        const groupsInCat = facebookGroups.filter((g: any) => g.category === cat);
        const groupIds = groupsInCat.map((g: any) => g.id);
        const allSelected = groupIds.every((id: string) => selectedGroupIds.includes(id));
        return (
          <label key={cat} className="flex items-center gap-1.5 text-xs cursor-pointer">
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked) => {
                setSelectedGroupIds(prev => {
                  if (checked) {
                    return [...new Set([...prev, ...groupIds])];
                  } else {
                    return prev.filter(id => !groupIds.includes(id));
                  }
                });
              }}
            />
            <span>{cat} ({groupsInCat.length})</span>
          </label>
        );
      })}
    </div>
  );
};
