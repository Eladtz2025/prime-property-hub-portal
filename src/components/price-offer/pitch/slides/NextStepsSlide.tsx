import { FileSignature, Camera, Globe, Users, Handshake, MessageCircle } from "lucide-react";
import { BUSINESS_INFO } from "@/constants/business";

interface Step {
  icon: string;
  title: string;
  description: string;
  timing: string;
}

interface NextStepsSlideProps {
  title?: string;
  subtitle?: string;
  steps?: Step[];
  whatsappNumber?: string;
  propertyTitle?: string;
}

const iconMap: { [key: string]: any } = {
  signature: FileSignature,
  camera: Camera,
  globe: Globe,
  users: Users,
  handshake: Handshake,
};

const NextStepsSlide = ({
  title = "הצעדים הבאים",
  subtitle = "מה קורה אחרי שנחתום על בלעדיות?",
  steps = [
    { icon: "signature", title: "חתימה על הסכם בלעדיות", description: "הסכם פשוט וברור", timing: "יום 1" },
    { icon: "camera", title: "צילום מקצועי", description: "צלם אדריכלות + עריכה", timing: "שבוע 1" },
    { icon: "globe", title: "עלייה לאוויר", description: "פרסום בכל הפלטפורמות", timing: "שבוע 1-2" },
    { icon: "users", title: "ביקורים וסיורים", description: "תיאום וליווי אישי", timing: "שבוע 2-4" },
    { icon: "handshake", title: "סגירת עסקה", description: "מו״מ וחתימה על חוזה", timing: "שבוע 3-6" },
  ],
  whatsappNumber = "972542284477",
  propertyTitle = "הנכס שלי",
}: NextStepsSlideProps) => {
  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(`שלום ${BUSINESS_INFO.brokerName}, אשמח לשמוע עוד על שירותי הבלעדיות`);
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-8 py-24">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-4xl font-bold text-white md:text-5xl">{title}</h2>
          <p className="text-lg text-white/60">{subtitle}</p>
        </div>

        {/* Timeline */}
        <div className="relative mb-12">
          {/* Vertical line */}
          <div className="absolute right-6 top-0 h-full w-0.5 bg-gradient-to-b from-emerald-500 via-emerald-500/50 to-transparent" />

          <div className="space-y-6">
            {steps.map((step, index) => {
              const IconComponent = iconMap[step.icon] || FileSignature;
              const isLast = index === steps.length - 1;

              return (
                <div key={index} className="relative flex items-start gap-6 pr-2">
                  {/* Timeline dot */}
                  <div className={`relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
                    isLast 
                      ? "bg-gradient-to-br from-emerald-500 to-teal-500" 
                      : "border-2 border-emerald-500 bg-[#0a0a0a]"
                  }`}>
                    <IconComponent className={`h-5 w-5 ${isLast ? "text-white" : "text-emerald-400"}`} />
                  </div>

                  {/* Content */}
                  <div className={`flex-1 rounded-xl border p-5 transition-all ${
                    isLast 
                      ? "border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 to-teal-500/10" 
                      : "border-white/10 bg-white/5"
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className={`mb-1 font-semibold ${isLast ? "text-emerald-400" : "text-white"}`}>
                          {step.title}
                        </h3>
                        <p className="text-sm text-white/60">{step.description}</p>
                      </div>
                      <span className="flex-shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                        {step.timing}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={handleWhatsAppClick}
            className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-10 py-5 text-lg font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/40"
          >
            <MessageCircle className="h-6 w-6" />
            נתחיל היום?
          </button>
          <p className="mt-4 text-sm text-white/40">
            ללא התחייבות - שיחת ייעוץ ראשונית בחינם
          </p>
        </div>
      </div>
    </div>
  );
};

export default NextStepsSlide;
