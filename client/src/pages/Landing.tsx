import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Landing() {
  const { t, dir } = useLanguage();
  const { login, isLoading: authLoading } = useAuth();

  const handleLogin = async () => {
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
        <div className="container mx-auto px-4 py-3 flex justify-end max-w-2xl">
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main Auth Section - Centered */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          {/* Logo and Branding */}
          <div className="mb-8">
            <img src="/assets/logo.svg" alt="Mihnaty AI" className="w-20 h-20 mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Mihnaty AI | مهنتي
            </h1>
            <p className="text-lg text-muted-foreground">
              {t("landing.tagline")}
            </p>
          </div>

          {/* Auth Message */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              {t("landing.auth.title")}
            </h2>
            <p className="text-muted-foreground">
              {t("landing.auth.description")}
            </p>
          </div>

          {/* Sign In Button */}
          <Button 
            onClick={handleLogin} 
            size="lg" 
            className="w-full text-lg py-6 mb-4"
            data-testid="button-login"
            disabled={authLoading}
          >
            {authLoading ? t("auth.loggingIn") : t("landing.auth.signIn")}
          </Button>

          {/* Sign Up Text */}
          <p className="text-sm text-muted-foreground">
            {t("landing.auth.signUpPrompt")}{" "}
            <button 
              onClick={handleLogin}
              className="text-primary hover:underline font-medium"
              disabled={authLoading}
              data-testid="button-signup"
            >
              {t("landing.auth.signUpLink")}
            </button>
          </p>

          {/* Free Access Note */}
          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {t("landing.auth.freeAccess")}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6">
        <div className="container mx-auto px-4 max-w-2xl">
          <p className="text-center text-xs text-muted-foreground">
            {t("landing.footer.privacy")}
          </p>
        </div>
      </footer>
    </div>
  );
}
