import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Settings2 } from 'lucide-react';
import { HashtagGroupsEditor } from './HashtagGroupsEditor';

export interface HashtagGroup {
  id: string;
  label: string;
  emoji: string;
  tags: string[];
  isDefault?: boolean;
}

export const DEFAULT_HASHTAG_GROUPS: HashtagGroup[] = [
  { id: 'rent-he', label: 'השכרה ת"א', emoji: '🏠', tags: ['#נדלן', '#דירהלהשכרה', '#להשכרה', '#שכירות', '#תלאביב'], isDefault: true },
  { id: 'sale-he', label: 'מכירה ת"א', emoji: '💰', tags: ['#נדלן', '#דירהלמכירה', '#למכירה', '#תלאביב', '#רכישתדירה'], isDefault: true },
  { id: 'invest-he', label: 'השקעות', emoji: '📈', tags: ['#נדלן', '#תלאביב', '#השקעותנדלן', '#תשואה', '#משקיעים'], isDefault: true },
  { id: 'luxury-he', label: 'יוקרה', emoji: '✨', tags: ['#נדלן', '#תלאביב', '#יוקרה', '#פנטהאוז', '#עיצובפנים'], isDefault: true },
  { id: 'tips-he', label: 'טיפים', emoji: '💡', tags: ['#נדלן', '#תלאביב', '#טיפינדלן', '#מדריךרכישה', '#שוקהדיור'], isDefault: true },
  { id: 'rent-en', label: 'Rent TLV', emoji: '🏠', tags: ['#realestate', '#telaviv', '#forrent', '#rental', '#apartment'], isDefault: true },
  { id: 'sale-en', label: 'Sale TLV', emoji: '💰', tags: ['#realestate', '#telaviv', '#forsale', '#property', '#homeforsale'], isDefault: true },
  { id: 'invest-en', label: 'Investment', emoji: '📈', tags: ['#realestate', '#telaviv', '#realestateinvesting', '#ROI', '#investment'], isDefault: true },
  { id: 'luxury-en', label: 'Luxury', emoji: '✨', tags: ['#realestate', '#telaviv', '#luxury', '#penthouse', '#interiordesign'], isDefault: true },
  { id: 'tips-en', label: 'Tips', emoji: '💡', tags: ['#realestate', '#telaviv', '#realestatetips', '#homebuying', '#propertymarket'], isDefault: true },
];

const STORAGE_KEY = 'hashtag-groups-custom';

export const loadGroups = (): HashtagGroup[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_HASHTAG_GROUPS;
};

export const saveGroups = (groups: HashtagGroup[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
};

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export const HashtagGroupSelector: React.FC<Props> = ({ value, onChange }) => {
  const [groups, setGroups] = useState<HashtagGroup[]>(loadGroups);
  const [manualTag, setManualTag] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);

  const currentTags = value ? value.split(/\s+/).filter(Boolean) : [];

  const toggleGroup = (group: HashtagGroup) => {
    const allPresent = group.tags.every(t => currentTags.includes(t));
    let newTags: string[];
    if (allPresent) {
      newTags = currentTags.filter(t => !group.tags.includes(t));
    } else {
      const toAdd = group.tags.filter(t => !currentTags.includes(t));
      newTags = [...currentTags, ...toAdd];
    }
    onChange(newTags.join(' '));
  };

  const removeTag = (tag: string) => {
    onChange(currentTags.filter(t => t !== tag).join(' '));
  };

  const addManual = () => {
    const tag = manualTag.trim().startsWith('#') ? manualTag.trim() : `#${manualTag.trim()}`;
    if (tag.length > 1 && !currentTags.includes(tag)) {
      onChange([...currentTags, tag].join(' '));
    }
    setManualTag('');
  };

  const isGroupActive = (group: HashtagGroup) => group.tags.every(t => currentTags.includes(t));

  const handleGroupsSaved = (updated: HashtagGroup[]) => {
    setGroups(updated);
    saveGroups(updated);
  };

  return (
    <div className="space-y-2">
      {/* Group chips + manual add inline */}
      <div className="flex flex-wrap gap-1 items-center">
        {groups.map(g => (
          <Button
            key={g.id}
            type="button"
            size="sm"
            variant={isGroupActive(g) ? 'default' : 'outline'}
            className="text-[11px] h-6 px-2 gap-1"
            onClick={() => toggleGroup(g)}
          >
            <span>{g.emoji}</span>
            {g.label}
          </Button>
        ))}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-[11px] h-6 px-1.5 text-muted-foreground"
          onClick={() => setEditorOpen(true)}
        >
          <Settings2 className="h-3 w-3" />
        </Button>
        <div className="flex gap-0.5 items-center">
          <Input
            value={manualTag}
            onChange={e => setManualTag(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addManual())}
            placeholder="+ האשטג"
            className="text-xs h-6 w-24"
            dir="ltr"
          />
          <Button type="button" size="sm" variant="outline" className="h-6 px-1.5" onClick={addManual} disabled={!manualTag.trim()}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Selected tags */}
      {currentTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {currentTags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-[10px] h-5 gap-0.5 pl-1">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <HashtagGroupsEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        groups={groups}
        onSave={handleGroupsSaved}
      />
    </div>
  );
};
