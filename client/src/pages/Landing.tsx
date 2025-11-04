import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Briefcase, FileText, Target, MessageSquare, GraduationCap, FileSignature, TrendingUp, Sparkles } from "lucide-react";

export default function Landing() {
  const { t, dir, language } = useLanguage();
  const { login, isLoading: authLoading } = useAuth();

  const features = [
    { icon: FileText, titleKey: "landing.features.resumeReview", descKey: "landing.features.resumeReviewDesc" },
    { icon: MessageSquare, titleKey: "landing.features.careerChat", descKey: "landing.features.careerChatDesc" },
    { icon: Target, titleKey: "landing.features.futurePlan", descKey: "landing.features.futurePlanDesc" },
    { icon: Briefcase, titleKey: "landing.features.tailorJob", descKey: "landing.features.tailorJobDesc" },
    { icon: GraduationCap, titleKey: "landing.features.interview", descKey: "landing.features.interviewDesc" },
    { icon: FileSignature, titleKey: "landing.features.coverLetter", descKey: "landing.features.coverLetterDesc" },
    { icon: TrendingUp, titleKey: "landing.features.skillsGap", descKey: "landing.features.skillsGapDesc" },
    { icon: Sparkles, titleKey: "landing.features.buildFromZero", descKey: "landing.features.buildFromZeroDesc" },
  ];

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-3">
            <img src="/assets/logo.svg" alt="Mihnaty AI" className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Mihnaty AI | مهنتي</h1>
              <p className="text-sm text-muted-foreground">{t("landing.tagline")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button onClick={handleLogin} size="lg" data-testid="button-login" disabled={authLoading}>
              {authLoading ? t("auth.loggingIn") : t("landing.login")}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t("landing.hero.title")}
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t("landing.hero.description")}
          </p>
          <Button onClick={handleLogin} size="lg" className="gap-2" data-testid="button-hero-cta">
            <Sparkles className="w-5 h-5" />
            {t("landing.hero.cta")}
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="p-6 hover-elevate">
                <Icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-2">{t(feature.titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(feature.descKey)}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-card border-y border-border py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">{t("landing.howItWorks.title")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-foreground mb-2">{t("landing.howItWorks.step1")}</h3>
              <p className="text-sm text-muted-foreground">{t("landing.howItWorks.step1Desc")}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-foreground mb-2">{t("landing.howItWorks.step2")}</h3>
              <p className="text-sm text-muted-foreground">{t("landing.howItWorks.step2Desc")}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-foreground mb-2">{t("landing.howItWorks.step3")}</h3>
              <p className="text-sm text-muted-foreground">{t("landing.howItWorks.step3Desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 max-w-4xl text-center">
        <h2 className="text-3xl font-bold text-foreground mb-4">{t("landing.cta.title")}</h2>
        <p className="text-xl text-muted-foreground mb-8">{t("landing.cta.description")}</p>
        <Button onClick={handleLogin} size="lg" className="gap-2" data-testid="button-cta">
          <Sparkles className="w-5 h-5" />
          {t("landing.cta.button")}
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-16">
        <div className="container mx-auto px-4 py-8 max-w-6xl text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Mihnaty AI — {t("landing.footer.copyright")}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {t("landing.footer.privacy")}
          </p>
        </div>
      </footer>
    </div>
  );
}
