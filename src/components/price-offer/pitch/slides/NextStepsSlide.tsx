import { FileSignature, Camera, Globe, Users, Handshake, MessageCircle, Sparkles } from "lucide-react";
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
  closingMessage?: string;
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
  subtitle = "מה קורה אחרי שמחליטים לעבוד יחד?",
  steps = [
    { icon: "signature", title: "חתימה על הסכם בלעדיות", description: "הסכם פשוט וברור, בלי אותיות קטנות", timing: "יום 1" },
    { icon: "camera", title: "צילום מקצועי + סרטון", description: "צלם אדריכלות מגיע אליכם הביתה", timing: "תוך 3 ימים" },
    { icon: "globe", title: "עלייה לאוויר", description: "הנכס עולה לכל הפלטפורמות במקביל", timing: "תוך שבוע" },
    { icon: "users", title: "ביקורים וסיורים", description: "אני מלווה כל ביקור ומדווחת בזמן אמת", timing: "שבוע 1-3" },
    { icon: "handshake", title: "סגירת עסקה", description: "מו״מ, חתימה על חוזה, ומסירת מפתחות", timing: "שבוע 2-6" },
  ],
  whatsappNumber = "972542284477",
  propertyTitle = "הנכס שלי",
  closingMessage = "בואו נתחיל. אשמח לענות על כל שאלה.",
}: NextStepsSlideProps) => {
  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(`שלום ${BUSINESS_INFO.brokerName}, אשמח לשמוע עוד על שירותי הבלעדיות עבור הנכס ב${propertyTitle}`);
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-start md:justify-center px-4 md:px-8 py-20 md:py-24 overflow-y-auto">
      <div className="w-full max-w-4xl pb-20 md:pb-0">
        {/* Header */}
        <div className="mb-6 md:mb-10 text-center">
          <h2 className="mb-2 md:mb-3 text-3xl md:text-4xl lg:text-5xl font-bold text-white">{title}</h2>
          <p className="text-base md:text-lg text-white/60">{subtitle}</p>
        </div>

        {/* Timeline */}
        <div className="relative mb-6 md:mb-10">
          {/* Vertical line */}
          <div className="absolute right-5 md:right-6 top-0 h-full w-0.5 bg-gradient-to-b from-emerald-500 via-emerald-500/50 to-transparent" />

          <div className="space-y-3 md:space-y-5">
            {steps.map((step, index) => {
              const IconComponent = iconMap[step.icon] || FileSignature;
              const isLast = index === steps.length - 1;

              return (
                <div key={index} className="relative flex items-start gap-4 md:gap-6 pr-1 md:pr-2">
                  {/* Timeline dot */}
                  <div className={`relative z-10 flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-full ${
                    isLast 
                      ? "bg-gradient-to-br from-emerald-500 to-teal-500" 
                      : "border-2 border-emerald-500 bg-[#0a0a0a]"
                  }`}>
                    <IconComponent className={`h-4 w-4 md:h-5 md:w-5 ${isLast ? "text-white" : "text-emerald-400"}`} />
                  </div>

                  {/* Content */}
                  <div className={`flex-1 rounded-lg md:rounded-xl border p-3 md:p-4 transition-all ${
                    isLast 
                      ? "border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 to-teal-500/10" 
                      : "border-white/10 bg-white/5"
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 md:gap-4">
                      <div className="flex-1">
                        <h3 className={`mb-0.5 md:mb-1 text-sm md:text-base font-semibold ${isLast ? "text-emerald-400" : "text-white"}`}>
                          {step.title}
                        </h3>
                        <p className="text-xs md:text-sm text-white/60">{step.description}</p>
                      </div>
                      <span className="flex-shrink-0 self-start rounded-full bg-white/10 px-2 py-0.5 md:px-3 md:py-1 text-[10px] md:text-xs text-white/70">
                        {step.timing}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Closing Message */}
        <div className="mb-6 md:mb-8 text-center">
          <div className="inline-flex items-center gap-2 text-base md:text-lg text-white/70">
            <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-amber-400" />
            <span>{closingMessage}</span>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={handleWhatsAppClick}
            className="inline-flex items-center gap-2 md:gap-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 md:px-10 md:py-5 text-base md:text-lg font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/40"
          >
            <MessageCircle className="h-5 w-5 md:h-6 md:w-6" />
            נתחיל את השיחה
          </button>
          <p className="mt-3 md:mt-4 text-xs md:text-sm text-white/40">
            שיחת ייעוץ ראשונית - ללא התחייבות, ללא עלות
          </p>
        </div>
      </div>
    </div>
  );
};

export default NextStepsSlide;
