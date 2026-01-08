import { AlertTriangle, Scale, Volume2, Bath, Shield, Building2, CheckCircle } from "lucide-react";

interface Consideration {
  icon: string;
  title: string;
  description: string;
}

interface ConsiderationsSlideProps {
  title?: string;
  subtitle?: string;
  considerations?: Consideration[];
  balanceNote?: string;
}

const iconMap: { [key: string]: any } = {
  competition: Building2,
  noise: Volume2,
  bathroom: Bath,
  mamad: Shield,
};

const ConsiderationsSlide = ({
  title = "גורמים המשפיעים על השווי",
  subtitle = "שיקולים שיש לקחת בחשבון",
  considerations = [
    {
      icon: "competition",
      title: "ריבוי נכסים למכירה בבניין",
      description: "תחרות פנימית אפשרית מול דירות אחרות באותו בניין",
    },
    {
      icon: "noise",
      title: "חשיפה לרעש",
      description: "תנועת אוטובוסים ברחוב שאליו פונה הסלון",
    },
    {
      icon: "bathroom",
      title: "חדר רחצה אחד בלבד",
      description: "יתכן שיהווה שיקול עבור משפחות או זוגות",
    },
    {
      icon: "mamad",
      title: "היעדר ממ\"ד בדירה",
      description: "קיימים מקלטים משותפים בבניין אך אין ממ\"ד פרטי",
    },
  ],
  balanceNote = "מיקום יוקרתי, מרפסות מרווחות ותכנון פנימי איכותי מאזנים על השפעת הגורמים הללו",
}: ConsiderationsSlideProps) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-start px-4 md:px-8 pt-16 pb-28 md:pt-24 md:pb-32 overflow-y-auto">
      <div className="w-full max-w-4xl pb-8 md:pb-0">
        {/* Header */}
        <div className="mb-8 md:mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-[#e85c3a]/10 border border-[#e85c3a]/20">
            <AlertTriangle className="h-4 w-4 text-[#e85c3a]" />
            <span className="text-sm text-[#e85c3a]">שקיפות מלאה</span>
          </div>
          <h2 className="mb-2 md:mb-3 text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            {title}
          </h2>
          <p className="text-base md:text-lg text-white/60">{subtitle}</p>
        </div>

        {/* Considerations Grid */}
        <div className="space-y-4 mb-8">
          {considerations.map((item, index) => {
            const IconComponent = iconMap[item.icon] || AlertTriangle;
            return (
              <div
                key={index}
                className="flex items-start gap-4 rounded-xl border border-[#e85c3a]/20 bg-[#e85c3a]/5 p-4 md:p-5 backdrop-blur-sm"
              >
                {/* Icon */}
                <div className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#e85c3a]/20">
                  <IconComponent className="h-5 w-5 md:h-6 md:w-6 text-[#e85c3a]" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-base md:text-lg font-semibold text-white mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-white/60">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Balance Note */}
        <div className="rounded-2xl border border-[#4a9a9a]/30 bg-gradient-to-br from-[#4a9a9a]/10 to-[#2d3b3a]/10 p-5 md:p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4a9a9a]/20">
              <Scale className="h-5 w-5 text-[#4a9a9a]" />
            </div>
            <h4 className="text-lg font-semibold text-white">איזון</h4>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-[#4a9a9a] flex-shrink-0 mt-0.5" />
            <p className="text-white/80 leading-relaxed">{balanceNote}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsiderationsSlide;
