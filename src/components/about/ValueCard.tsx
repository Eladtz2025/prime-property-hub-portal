import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface ValueCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  delay?: number;
}

export const ValueCard = ({ icon, title, description, delay = 0 }: ValueCardProps) => {
  return (
    <Card 
      className="text-center p-8 transition-all duration-500 hover:scale-105 hover:shadow-elegant group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-16 h-16 mx-auto mb-6 text-primary transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
        {icon}
      </div>
      <h3 className="font-playfair text-2xl font-normal text-foreground mb-3">
        {title}
      </h3>
      <p className="font-montserrat text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </Card>
  );
};
