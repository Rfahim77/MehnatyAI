import { Card } from "@/components/ui/card";
import { type ChatRequest } from "@shared/schema";
import { FileText, MessageCircle, TrendingUp, Briefcase, UserCheck, FileEdit, Target, PlusCircle } from "lucide-react";

interface OptionCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  path: ChatRequest["path"];
  message: string;
}

const options: OptionCard[] = [
  {
    icon: <FileText className="w-10 h-10" />,
    title: "مراجعة السيرة الذاتية",
    description: "احصل على تقييم شامل لسيرتك الذاتية مع اقتراحات للتحسين",
    path: "resume_review",
    message: "أريد مراجعة سيرتي الذاتية وتحسينها",
  },
  {
    icon: <MessageCircle className="w-10 h-10" />,
    title: "نقاش مهني",
    description: "تحدث عن وضعك المهني الحالي وخططك المستقبلية",
    path: "career_chat",
    message: "أريد التحدث عن مسيرتي المهنية",
  },
  {
    icon: <TrendingUp className="w-10 h-10" />,
    title: "تخطيط المستقبل",
    description: "خطط لمسارك الوظيفي خلال 3-6 أشهر القادمة",
    path: "future_plan",
    message: "ساعدني في التخطيط لمستقبلي المهني",
  },
  {
    icon: <Briefcase className="w-10 h-10" />,
    title: "تفصيل لوظيفة",
    description: "خصص سيرتك الذاتية لوظيفة معينة",
    path: "tailor_to_job",
    message: "أريد تخصيص سيرتي لوظيفة محددة",
  },
  {
    icon: <UserCheck className="w-10 h-10" />,
    title: "تدريب مقابلة",
    description: "تحضّر للمقابلات بأسئلة وملاحظات مخصصة",
    path: "interview",
    message: "أريد التحضير لمقابلة عمل",
  },
  {
    icon: <FileEdit className="w-10 h-10" />,
    title: "كتابة Cover Letter",
    description: "اكتب خطاب تعريف مخصص لوظيفة محددة",
    path: "cover_letter",
    message: "ساعدني في كتابة خطاب تعريف",
  },
  {
    icon: <Target className="w-10 h-10" />,
    title: "فجوات المهارات",
    description: "اكتشف الفجوات في مهاراتك وكيفية سدها",
    path: "skills_gap",
    message: "أريد معرفة الفجوات في مهاراتي",
  },
  {
    icon: <PlusCircle className="w-10 h-10" />,
    title: "إنشاء سيرة من الصفر",
    description: "ابدأ ببناء سيرتك الذاتية من البداية",
    path: "build_from_zero",
    message: "أريد إنشاء سيرة ذاتية جديدة",
  },
];

interface OptionCardsProps {
  onOptionClick: (path: ChatRequest["path"], message: string) => void;
}

export function OptionCards({ onOptionClick }: OptionCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {options.map((option) => (
        <Card
          key={option.path}
          data-testid={`option-card-${option.path}`}
          className="p-6 cursor-pointer hover-elevate active-elevate-2 transition-all border border-card-border"
          onClick={() => onOptionClick(option.path, option.message)}
        >
          <div className="flex flex-col items-center text-center space-y-4 h-32">
            <div className="text-primary" data-testid={`icon-${option.path}`}>
              {option.icon}
            </div>
            <div className="space-y-2 flex-1 flex flex-col justify-center">
              <h3 className="text-lg font-semibold text-foreground" data-testid={`title-${option.path}`}>
                {option.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`description-${option.path}`}>
                {option.description}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
