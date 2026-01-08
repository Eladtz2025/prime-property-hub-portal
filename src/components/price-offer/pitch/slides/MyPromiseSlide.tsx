import { Check, Shield, Phone, Clock, Eye, HeartHandshake } from "lucide-react";

interface Promise {
  icon: string;
  title: string;
  description: string;
}

interface MyPromiseSlideProps {
  title?: string;
  subtitle?: string;
  promises?: Promise[];
  guaranteeText?: string;
}

const iconMap: { [key: string]: any } = {
  report: Clock,
  response: Phone,
  visits: Eye,
  transparency: Shield,
  exit: HeartHandshake,
};

const MyPromiseSlide = ({
  title = "ההתחייבות שלי אליכם",
  subtitle = "לא רק מילים - אלה ההבטחות שאני עומדת מאחוריהן",
  promises = [
    {
      icon: "report",
      title: "דיווח שבועי קבוע",
      description: "כל יום ראשון תקבלו סיכום מפורט: כמה צפיות, כמה פניות, ומה התגובות מהשטח. בלי לרדוף אחריי."
    },
    {
      icon: "response",
      title: "מענה תוך 3 שעות",
      description: "כל הודעה, כל שאלה - מקבלת מענה תוך 3 שעות בימי עבודה. אתם לא לבד בתהליך."
    },
    {
      icon: "visits",
      title: "ביקורים רק בתיאום",
      description: "אף אחד לא נכנס לנכס שלכם בלי תיאום מראש איתכם. הפרטיות שלכם חשובה לי."
    },
    {
      icon: "transparency",
      title: "שקיפות מלאה על הצעות",
      description: "כל הצעה שמגיעה - אתם שומעים עליה. גם אם היא נמוכה. ההחלטה תמיד שלכם."
    },
    {
      icon: "exit",
      title: "אפשרות יציאה בכל עת",
      description: "לא מרוצים מהשירות? אפשר לסיים את ההסכם. העבודה שלי היא להוכיח לכם שאתם במקום הנכון."
    },
  ],
  guaranteeText = "אני לא רק מבטיחה - אני גם מקיימת. זו הסיבה ש-93.7% מהלקוחות שלי ממליצים עליי לחברים ומשפחה.",
}: MyPromiseSlideProps) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-start px-4 md:px-8 pt-16 pb-28 md:pt-24 md:pb-32 overflow-y-auto">
      <div className="w-full max-w-4xl pb-8 md:pb-0">
        {/* Header */}
        <div className="mb-6 md:mb-10 text-center">
          <h2 className="mb-2 md:mb-3 text-3xl md:text-4xl lg:text-5xl font-bold text-white">{title}</h2>
          <p className="text-base md:text-lg text-white/60">{subtitle}</p>
        </div>

        {/* Promises Grid */}
        <div className="mb-6 md:mb-8 space-y-3 md:space-y-4">
          {promises.map((promise, index) => {
            const IconComponent = iconMap[promise.icon] || Check;
            return (
              <div
                key={index}
                className="flex items-start gap-3 md:gap-4 rounded-lg md:rounded-xl border border-white/10 bg-white/5 p-4 md:p-5 backdrop-blur-sm transition-colors hover:border-emerald-500/30 hover:bg-white/10"
              >
                {/* Check Icon */}
                <div className="flex h-8 w-8 md:h-10 md:w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500">
                  <Check className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="mb-0.5 md:mb-1 text-base md:text-lg font-semibold text-white">{promise.title}</h3>
                  <p className="text-xs md:text-sm leading-relaxed text-white/60">{promise.description}</p>
                </div>

                {/* Side Icon */}
                <IconComponent className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0 text-emerald-400/50 hidden sm:block" />
              </div>
            );
          })}
        </div>

        {/* Guarantee Box */}
        <div className="rounded-xl md:rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4 md:p-6 text-center">
          <Shield className="mx-auto mb-2 md:mb-3 h-6 w-6 md:h-8 md:w-8 text-amber-400" />
          <p className="text-sm md:text-lg leading-relaxed text-white/80">{guaranteeText}</p>
        </div>
      </div>
    </div>
  );
};

export default MyPromiseSlide;
