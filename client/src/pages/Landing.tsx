import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { useLocation } from "wouter";

export default function Landing() {
  const { t, dir, language } = useLanguage();
  const { login, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const handleContinueAsGuest = () => {
    // Navigate to Home without authentication - fully accessible
    setLocation("/home");
  };

  const handleSignIn = async () => {
    try {
      await login();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      {/* Header with language switcher */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3 flex justify-end max-w-4xl">
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main Hero Section */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Logo and Branding */}
          <div className="flex items-center gap-3 mb-6 justify-center">
            <Logo size={44} />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                <span>مهنتي</span>{" "}
                <span className="opacity-60">|</span>{" "}
                <bdi dir="ltr">Mehnaty AI</bdi>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t("landing.tagline")}
              </p>
            </div>
          </div>

          {/* Hero Content Card */}
          <div className="bg-card border border-border rounded-lg shadow-sm p-6 md:p-8 mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-3 leading-snug">
              {t("landing.hero.title")}
            </h2>
            <p className="text-base md:text-lg mb-6 leading-relaxed">
              <strong>{t("landing.hero.supportingLine")}</strong>
            </p>

            {/* Primary CTA - Continue as Guest */}
            <Button 
              onClick={handleContinueAsGuest}
              size="lg" 
              className="w-full text-base mb-3"
              data-testid="button-continue-guest"
            >
              {language === "ar" ? "ابدأ الآن كضيف" : "Continue as Guest"}
            </Button>

            {/* Secondary CTA - Sign In */}
            <Button 
              onClick={handleSignIn}
              size="lg"
              variant="outline"
              className="w-full text-base mb-4"
              disabled={authLoading}
              data-testid="button-sign-in"
            >
              {language === "ar" ? "تسجيل الدخول" : "Sign In"}
            </Button>

            {/* Benefits of Signing In */}
            <div className="mt-6 bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-semibold mb-2 text-foreground">
                {language === "ar" ? "✨ مميزات تسجيل الدخول:" : "✨ Benefits of Signing In:"}
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{language === "ar" ? "احفظ تقدّمك ومحادثاتك على جميع الأجهزة." : "Save your progress and conversations across all devices"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{language === "ar" ? "وصول متزامن عبر الجوال والويب." : "Synced access via mobile and web"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{language === "ar" ? "تصدير السيرة والملفات بصيغة DOCX/PDF أو إلى بريدك." : "Export resume and files as DOCX/PDF or to your email"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{language === "ar" ? "استئناف من حيث توقفت — في أي وقت." : "Resume from where you left off — anytime"}</span>
                </li>
              </ul>
            </div>

            {/* Free Access Chip */}
            <div className="mt-4 inline-block bg-primary/10 px-3 py-1.5 rounded-full">
              <p className="text-sm font-medium text-primary">
                {t("landing.freeAccess")}
              </p>
            </div>
          </div>

          {/* Quick Start Chips */}
          <div className="bg-card/50 border border-border/50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              {language === "ar" ? "المسارات المهنية المتوفرة:" : "Available Career Pathways:"}
            </h3>
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant="secondary"
                className="cursor-pointer hover-elevate active-elevate-2"
                onClick={handleContinueAsGuest}
                data-testid="chip-resume-review"
              >
                {t("pathways.resume_review.title")}
              </Badge>
              <Badge 
                variant="secondary"
                className="cursor-pointer hover-elevate active-elevate-2"
                onClick={handleContinueAsGuest}
                data-testid="chip-tailor-job"
              >
                {t("pathways.tailor_to_job.title")}
              </Badge>
              <Badge 
                variant="secondary"
                className="cursor-pointer hover-elevate active-elevate-2"
                onClick={handleContinueAsGuest}
                data-testid="chip-interview"
              >
                {t("pathways.interview.title")}
              </Badge>
              <Badge 
                variant="secondary"
                className="cursor-pointer hover-elevate active-elevate-2"
                onClick={handleContinueAsGuest}
                data-testid="chip-future-plan"
              >
                {t("pathways.future_plan.title")}
              </Badge>
              <Badge 
                variant="secondary"
                className="cursor-pointer hover-elevate active-elevate-2"
                onClick={handleContinueAsGuest}
                data-testid="chip-build-from-zero"
              >
                {t("pathways.build_from_zero.title")}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6">
        <div className="container mx-auto px-4 max-w-4xl">
          <p className="text-center text-sm text-muted-foreground">
            {t("landing.footer.privacy")}
          </p>
        </div>
      </footer>
    </div>
  );
}
