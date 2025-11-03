import { Card } from "@/components/ui/card";
import { type ChatRequest } from "@shared/schema";
import { FileText, MessageCircle, TrendingUp, Briefcase, UserCheck, FileEdit, Target, PlusCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface OptionCard {
  icon: React.ReactNode;
  path: ChatRequest["path"];
}

const optionConfig: OptionCard[] = [
  { icon: <FileText className="w-10 h-10" />, path: "resume_review" },
  { icon: <MessageCircle className="w-10 h-10" />, path: "career_chat" },
  { icon: <TrendingUp className="w-10 h-10" />, path: "future_plan" },
  { icon: <Briefcase className="w-10 h-10" />, path: "tailor_to_job" },
  { icon: <UserCheck className="w-10 h-10" />, path: "interview" },
  { icon: <FileEdit className="w-10 h-10" />, path: "cover_letter" },
  { icon: <Target className="w-10 h-10" />, path: "skills_gap" },
  { icon: <PlusCircle className="w-10 h-10" />, path: "build_from_zero" },
];

interface OptionCardsProps {
  onOptionClick: (path: ChatRequest["path"], message: string) => void;
}

export function OptionCards({ onOptionClick }: OptionCardsProps) {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {optionConfig.map((option) => {
        const title = t(`pathways.${option.path}.title`);
        const description = t(`pathways.${option.path}.description`);
        
        return (
          <Card
            key={option.path}
            data-testid={`option-card-${option.path}`}
            className="p-6 cursor-pointer hover-elevate active-elevate-2 transition-all border border-card-border"
            onClick={() => onOptionClick(option.path, title)}
          >
            <div className="flex flex-col items-center text-center space-y-4 h-32">
              <div className="text-primary" data-testid={`icon-${option.path}`}>
                {option.icon}
              </div>
              <div className="space-y-2 flex-1 flex flex-col justify-center">
                <h3 className="text-lg font-semibold text-foreground" data-testid={`title-${option.path}`}>
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`description-${option.path}`}>
                  {description}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
