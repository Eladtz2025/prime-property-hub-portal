import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface FlippablePropertyCardProps {
  title: string;
  location: string;
  price: string;
  imageUrl: string;
  type?: string;
}

export const FlippablePropertyCard = ({
  title,
  location,
  price,
  imageUrl,
  type,
}: FlippablePropertyCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Interest Submitted",
      description: "We'll contact you soon about " + title,
    });
    setFormData({ name: "", phone: "", email: "", message: "" });
    setIsFlipped(false);
  };

  return (
    <div className="group relative aspect-[4/5] perspective-1000">
      <div
        className={`relative w-full h-full transition-all duration-700 transform-style-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Front Side */}
        <div
          onClick={() => setIsFlipped(true)}
          className="absolute inset-0 backface-hidden cursor-pointer overflow-hidden"
        >
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
          <div className="reliz-card-overlay" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
            {type && (
              <div className="font-montserrat text-[10px] tracking-widest uppercase text-white/80 mb-2">
                {type}
              </div>
            )}
            <h3 className="font-playfair text-xl md:text-2xl font-semibold mb-2">{title}</h3>
            <div className="flex items-center justify-between">
              <p className="font-montserrat text-xs text-white/70">{location}</p>
              <p className="font-playfair text-base font-medium">{price}</p>
            </div>
            <div className="mt-4 h-px bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
          </div>
        </div>

        {/* Back Side */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-background via-background to-muted p-6 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <h3 className="font-playfair text-xl font-bold text-foreground mb-2">
              {title}
            </h3>
            <p className="font-montserrat text-xs text-muted-foreground mb-4">
              Request Information
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="bg-background/50"
              />
              <Input
                type="tel"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
                className="bg-background/50"
              />
              <Input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="bg-background/50"
              />
              <Textarea
                placeholder="Your message..."
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                className="bg-background/50 min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Submit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFlipped(false);
                  }}
                >
                  Back
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
