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
    <Card className="p-8 mx-4 h-full">
      <div className="flex items-center gap-4 mb-6">
        <img 
          src={image} 
          alt={name}
          className="w-16 h-16 rounded-full object-cover"
        />
        <div>
          <h4 className="font-semibold text-foreground">{name}</h4>
          <div className="flex gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-4 h-4 ${i < rating ? "fill-primary text-primary" : "text-muted"}`}
              />
            ))}
          </div>
        </div>
      </div>
      <p className="text-muted-foreground leading-relaxed italic">
        "{text}"
      </p>
    </Card>
  );
};
