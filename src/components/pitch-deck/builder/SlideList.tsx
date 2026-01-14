import { PitchDeckSlide, SLIDE_TYPE_LABELS } from '@/types/pitch-deck';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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

interface SlideListProps {
  slides: PitchDeckSlide[];
  language: 'he' | 'en';
  selectedSlideId?: string;
  onSelectSlide: (slide: PitchDeckSlide) => void;
  onToggleVisibility: (slideId: string, isVisible: boolean) => void;
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
  about: Info,
  contact: Phone,
};

const SlideList = ({ 
  slides, 
  language, 
  selectedSlideId, 
  onSelectSlide, 
  onToggleVisibility 
}: SlideListProps) => {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm mb-3">סליידים ({slides.length})</h3>
      <div className="space-y-1">
        {slides
          .sort((a, b) => a.slide_order - b.slide_order)
          .map((slide, index) => {
            const Icon = SLIDE_ICONS[slide.slide_type] || Image;
            const label = SLIDE_TYPE_LABELS[slide.slide_type]?.[language] || slide.slide_type;
            
            return (
              <div
                key={slide.id}
                onClick={() => onSelectSlide(slide)}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg border transition-colors cursor-pointer",
                  selectedSlideId === slide.id 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/30 hover:bg-accent/50",
                  !slide.is_visible && "opacity-50"
                )}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                
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
          })}
      </div>
    </div>
  );
};

export default SlideList;
