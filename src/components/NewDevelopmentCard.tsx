import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, Maximize2, Layers, Home, Car, ArrowUpDown, Shield, Package } from "lucide-react";
import { PublicProjectUnit, PublicUnitsTable, getUnitsSummary } from "@/components/PublicUnitsTable";
import { OptimizedImage } from "@/components/OptimizedImage";

interface NewDevelopmentCardProps {
  id: string;
  name: string;
  neighborhood: string;
  city: string;
  description?: string;
  roomsRange?: string;
  sizeRange?: string;
  buildingFloors?: number;
  unitsCount?: number;
  parking?: boolean;
  elevator?: boolean;
  balcony?: boolean;
  mamad?: boolean;
  hasStorage?: boolean;
  projectStatus?: string;
  language?: "he" | "en";
  units?: PublicProjectUnit[];
  imageUrl?: string;
}

const statusLabels = {
  he: { pre_sale: "טרום מכירה", under_construction: "בבנייה", ready: "אכלוס מיידי" },
  en: { pre_sale: "Pre-Sale", under_construction: "Under Construction", ready: "Ready to Move In" },
};

const statusColors: Record<string, string> = {
  pre_sale: "bg-amber-500/90 text-white border-amber-400",
  under_construction: "bg-sky-500/90 text-white border-sky-400",
  ready: "bg-emerald-500/90 text-white border-emerald-400",
};

const featureLabels = {
  he: { parking: "חניה", elevator: "מעלית", mamad: 'ממ"ד', storage: "מחסן", balcony: "מרפסת" },
  en: { parking: "Parking", elevator: "Elevator", mamad: "Safe Room", storage: "Storage", balcony: "Balcony" },
};

const formLabels = {
  he: {
    requestInfo: "לקבלת מידע", fullName: "שם מלא", phone: "טלפון", email: "אימייל",
    message: "הודעה...", submit: "שלח", back: "חזור", rooms: "חדרים", sqm: 'מ"ר',
    floors: "קומות", units: 'יח"ד', successMsg: "ניצור איתך קשר בקרוב!",
    errorMsg: "שגיאה בשליחה, נסה שוב", available: "זמינות", of: "מתוך", from: "החל מ-",
  },
  en: {
    requestInfo: "Request Information", fullName: "Full Name", phone: "Phone", email: "Email",
    message: "Your message...", submit: "Submit", back: "Back", rooms: "Rooms", sqm: "sqm",
    floors: "Floors", units: "Units", successMsg: "We'll contact you soon!",
    errorMsg: "Failed to submit, please try again", available: "Available", of: "of", from: "From",
  },
};

export const NewDevelopmentCard = ({
  id, name, neighborhood, city, description, roomsRange, sizeRange,
  buildingFloors, unitsCount, parking, elevator, balcony, mamad, hasStorage,
  projectStatus, language = "he", units = [], imageUrl,
}: NewDevelopmentCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const labels = formLabels[language];
  const features = featureLabels[language];
  const status = statusLabels[language];
  const isRtl = language === "he";

  const unitsSummary = units.length > 0 ? getUnitsSummary(units) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from("contact_leads").insert({
        name: formData.name, email: formData.email, phone: formData.phone,
        message: formData.message || `${language === "he" ? "מתעניין/ת בפרויקט" : "Interested in project"}: ${name}`,
        source: "new_development",
      });
      if (error) throw error;
      await supabase.functions.invoke("notify-admins", {
        body: { type: "property_inquiry", title: language === "he" ? "פנייה חדשה - פרויקט" : "New Project Inquiry", message: `${formData.name} - ${name}`, action_url: "/admin-dashboard" },
      });
      toast.success(labels.successMsg);
      setFormData({ name: "", phone: "", email: "", message: "" });
      setIsFlipped(false);
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      toast.error(labels.errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const activeFeatures = [
    parking && { icon: Car, label: features.parking },
    elevator && { icon: ArrowUpDown, label: features.elevator },
    mamad && { icon: Shield, label: features.mamad },
    hasStorage && { icon: Package, label: features.storage },
    balcony && { icon: Home, label: features.balcony },
  ].filter(Boolean) as { icon: any; label: string }[];

  return (
    <div className="group relative perspective-1000" dir={isRtl ? "rtl" : "ltr"}>
      <div className={`relative w-full transition-all duration-700 transform-style-3d ${isFlipped ? "rotate-y-180" : ""}`}>
        {/* Front Side */}
        <div onClick={() => setIsFlipped(true)} className="backface-hidden cursor-pointer overflow-hidden rounded-lg">
          {/* Image */}
          {imageUrl && (
            <div className="aspect-video w-full overflow-hidden">
              <OptimizedImage
                src={imageUrl}
                alt={name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          )}
          <div className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] relative">
            <div className="absolute inset-0 bg-gradient-to-t from-[#c8a45a]/10 via-transparent to-[#c8a45a]/5" />
            <div className="relative flex flex-col p-6 text-white">
              {/* Status badge */}
              <div className="flex justify-start mb-4">
                {projectStatus && (
                  <Badge className={`${statusColors[projectStatus] || statusColors.under_construction} text-xs font-medium px-3 py-1`}>
                    {status[projectStatus as keyof typeof status] || projectStatus}
                  </Badge>
                )}
              </div>

              {/* Project info */}
              <div className="space-y-4 mb-4">
                <div>
                  <h3 className="font-playfair text-2xl md:text-3xl font-semibold tracking-wide leading-tight">{name}</h3>
                  <div className="h-[2px] w-16 bg-gradient-to-r from-[#c8a45a] to-[#e8d48b] mt-3 mb-2" />
                  <p className="font-montserrat text-sm text-white/70 tracking-wide">
                    {neighborhood}{city ? `, ${city}` : ""}
                  </p>
                </div>

                {/* Specs grid */}
                <div className="grid grid-cols-2 gap-3">
                  {roomsRange && (
                    <div className="flex items-center gap-2 text-white/80">
                      <Building2 className="h-4 w-4 text-[#c8a45a]" /><span className="font-montserrat text-sm">{roomsRange} {labels.rooms}</span>
                    </div>
                  )}
                  {sizeRange && (
                    <div className="flex items-center gap-2 text-white/80">
                      <Maximize2 className="h-4 w-4 text-[#c8a45a]" /><span className="font-montserrat text-sm">{sizeRange} {labels.sqm}</span>
                    </div>
                  )}
                  {buildingFloors && (
                    <div className="flex items-center gap-2 text-white/80">
                      <Layers className="h-4 w-4 text-[#c8a45a]" /><span className="font-montserrat text-sm">{buildingFloors} {labels.floors}</span>
                    </div>
                  )}
                  {(unitsSummary || unitsCount) && (
                    <div className="flex items-center gap-2 text-white/80">
                      <Home className="h-4 w-4 text-[#c8a45a]" />
                      <span className="font-montserrat text-sm">
                        {unitsSummary
                          ? `${unitsSummary.available} ${labels.available} ${labels.of} ${unitsSummary.total}`
                          : `${unitsCount} ${labels.units}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Price range from units */}
                {unitsSummary?.minPrice && (
                  <div className="text-[#c8a45a] font-montserrat text-sm">
                    {labels.from} ₪{unitsSummary.minPrice.toLocaleString("he-IL")}
                    {unitsSummary.maxPrice && unitsSummary.maxPrice !== unitsSummary.minPrice && (
                      <> – ₪{unitsSummary.maxPrice.toLocaleString("he-IL")}</>
                    )}
                  </div>
                )}

                {/* Feature badges */}
                {activeFeatures.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {activeFeatures.map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-1 text-xs bg-white/10 border border-white/20 text-white/80 px-2.5 py-1 rounded-full">
                        <Icon className="h-3 w-3" />{label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Units table */}
              {units.length > 0 && <PublicUnitsTable units={units} language={language} />}

              {/* Description + CTA */}
              <div className="space-y-3 mt-4">
                {description && <p className="font-montserrat text-xs text-white/60 line-clamp-2 leading-relaxed">{description}</p>}
                <div className="flex items-center gap-2 text-[#c8a45a] font-montserrat text-sm tracking-wide group-hover:gap-3 transition-all">
                  <span>{labels.requestInfo}</span><span className="text-lg">→</span>
                </div>
                <div className="h-px bg-gradient-to-r from-[#c8a45a]/40 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-right" />
              </div>
            </div>
          </div>
        </div>

        {/* Back Side - Contact form */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-background via-background to-muted p-6 flex flex-col overflow-visible rounded-lg">
          <div className="flex-1 overflow-y-auto">
            <h3 className="font-playfair text-2xl font-bold text-foreground mb-1">{name}</h3>
            <p className="font-montserrat text-sm text-muted-foreground mb-4">{labels.requestInfo}</p>
            <form onSubmit={handleSubmit} className="space-y-3 px-1" dir={isRtl ? "rtl" : "ltr"}>
              <Input placeholder={labels.fullName} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className={`bg-background/50 ${isRtl ? "text-right" : ""}`} />
              <Input type="tel" placeholder={labels.phone} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required className={`bg-background/50 ${isRtl ? "text-right" : ""}`} />
              <Input type="email" placeholder={labels.email} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className={`bg-background/50 ${isRtl ? "text-right" : ""}`} />
              <Textarea placeholder={labels.message} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className={`bg-background/50 min-h-[80px] ${isRtl ? "text-right" : ""}`} />
              <div className={`flex gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                <Button type="submit" className="flex-1" disabled={submitting}>{submitting ? "..." : labels.submit}</Button>
                <Button type="button" variant="outline" onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }} className="flex-1">{labels.back}</Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
