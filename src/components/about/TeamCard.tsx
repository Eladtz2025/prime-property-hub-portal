import { Card } from "@/components/ui/card";

interface TeamCardProps {
  image: string;
  name: string;
  role: string;
  experience: string;
  delay?: number;
}

export const TeamCard = ({ image, name, role, experience, delay = 0 }: TeamCardProps) => {
  return (
    <Card 
      className="overflow-hidden group cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-elegant"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative h-64 overflow-hidden">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
          <div className="text-foreground">
            <p className="text-sm font-semibold mb-1">{experience}</p>
            <p className="text-xs text-muted-foreground">{role}</p>
          </div>
        </div>
      </div>
      <div className="p-6 text-center">
        <h3 className="font-playfair text-xl font-semibold text-foreground mb-1">
          {name}
        </h3>
        <p className="font-montserrat text-sm text-muted-foreground">
          {role}
        </p>
      </div>
    </Card>
  );
};
