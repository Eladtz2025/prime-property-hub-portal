import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";

interface TestimonialCardProps {
  image: string;
  name: string;
  rating: number;
  text: string;
}

export const TestimonialCard = ({ image, name, rating, text }: TestimonialCardProps) => {
  return (
    <Card className="p-6 sm:p-8 mx-2 sm:mx-4 h-full">
      <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <img 
          src={image} 
          alt={name}
          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover"
        />
        <div>
          <h4 className="font-semibold text-sm sm:text-base text-foreground">{name}</h4>
          <div className="flex gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-3 h-3 sm:w-4 sm:h-4 ${i < rating ? "fill-primary text-primary" : "text-muted"}`}
              />
            ))}
          </div>
        </div>
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed italic">
        "{text}"
      </p>
    </Card>
  );
};
