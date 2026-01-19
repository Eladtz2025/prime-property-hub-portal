import { PitchDeckSlide, SLIDE_TYPE_LABELS } from '@/types/pitch-deck';
import { Button } from '@/components/ui/button';
import { 
  GripVertical, 
  Eye, 
  EyeOff, 
  Edit2,
  Image,
  Type,
  Building2,
  Star,
  MapPin,
  DollarSign,
  Megaphone,
  Clock,
  Users,
  Info,
  Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SlideListProps {
  slides: PitchDeckSlide[];
  language: 'he' | 'en';
  selectedSlideId?: string;
  onSelectSlide: (slide: PitchDeckSlide) => void;
  onToggleVisibility: (slideId: string, isVisible: boolean) => void;
  onReorderSlides: (slides: { id: string; slide_order: number }[]) => void;
}

const SLIDE_ICONS: Record<string, React.ElementType> = {
  title: Type,
  property: Building2,
  features: Star,
  neighborhood: MapPin,
  pricing: DollarSign,
  marketing: Megaphone,
  timeline: Clock,
  marketing2: Users,
  marketing_ii: Users,
  about: Info,
  contact: Phone,
  step1_pricing: DollarSign,
};

interface SortableSlideItemProps {
  slide: PitchDeckSlide;
  index: number;
  language: 'he' | 'en';
  selectedSlideId?: string;
  onSelectSlide: (slide: PitchDeckSlide) => void;
  onToggleVisibility: (slideId: string, isVisible: boolean) => void;
}

const SortableSlideItem = ({
  slide,
  index,
  language,
  selectedSlideId,
  onSelectSlide,
  onToggleVisibility,
}: SortableSlideItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const Icon = SLIDE_ICONS[slide.slide_type] || Image;
  const label = SLIDE_TYPE_LABELS[slide.slide_type]?.[language] || slide.slide_type;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelectSlide(slide)}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg border transition-colors cursor-pointer bg-card",
        selectedSlideId === slide.id 
          ? "border-primary bg-primary/5" 
          : "border-border hover:border-primary/30 hover:bg-accent/50",
        !slide.is_visible && "opacity-50",
        isDragging && "shadow-lg ring-2 ring-primary"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
        {index + 1}
      </span>
      
      <Icon className="h-4 w-4 text-muted-foreground" />
      
      <span className="flex-1 text-sm truncate">{label}</span>
      
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onToggleVisibility(slide.id, !slide.is_visible)}
          title={slide.is_visible ? 'הסתר סלייד' : 'הצג סלייד'}
        >
          {slide.is_visible ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <EyeOff className="h-3.5 w-3.5" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onSelectSlide(slide)}
          title="ערוך סלייד"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

const SlideList = ({ 
  slides, 
  language, 
  selectedSlideId, 
  onSelectSlide, 
  onToggleVisibility,
  onReorderSlides,
}: SlideListProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortedSlides = [...slides].sort((a, b) => a.slide_order - b.slide_order);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = sortedSlides.findIndex((s) => s.id === active.id);
    const newIndex = sortedSlides.findIndex((s) => s.id === over.id);

    const reordered = arrayMove(sortedSlides, oldIndex, newIndex);
    
    const updates = reordered.map((slide, idx) => ({
      id: slide.id,
      slide_order: idx,
    }));

    onReorderSlides(updates);
  };

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm mb-3">סליידים ({slides.length})</h3>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedSlides.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1">
            {sortedSlides.map((slide, index) => (
              <SortableSlideItem
                key={slide.id}
                slide={slide}
                index={index}
                language={language}
                selectedSlideId={selectedSlideId}
                onSelectSlide={onSelectSlide}
                onToggleVisibility={onToggleVisibility}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default SlideList;
