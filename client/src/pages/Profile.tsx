import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface ProfileData {
  phone?: string;
  linkedinUrl?: string;
  currentRole?: string;
  yearsExperience?: number;
  industry?: string;
  skills?: string[];
}

export default function Profile() {
  const { user, isLoading: authLoading } = useAuth();
  const { t, dir, language } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [phone, setPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [industry, setIndustry] = useState("");
  const [skills, setSkills] = useState("");

  // Fetch user profile data
  const { data: profileData, isLoading: profileLoading } = useQuery<ProfileData>({
    queryKey: ["/api/auth/profile"],
    enabled: !!user,
  });

  // Update form fields when profile data is loaded
  useEffect(() => {
    if (profileData) {
      setPhone(profileData.phone || "");
      setLinkedinUrl(profileData.linkedinUrl || "");
      setCurrentRole(profileData.currentRole || "");
      setYearsExperience(profileData.yearsExperience?.toString() || "");
      setIndustry(profileData.industry || "");
      setSkills(profileData.skills?.join(", ") || "");
    }
  }, [profileData]);

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: ProfileData) => {
      const response = await apiRequest("POST", "/api/auth/profile", profileData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: language === "ar" ? "تم التحديث بنجاح" : "Profile Updated",
        description: language === "ar" ? "تم تحديث ملفك الشخصي بنجاح" : "Your profile has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/profile"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: language === "ar" ? "خطأ في التحديث" : "Update Failed",
        description: error instanceof Error ? error.message : language === "ar" ? "حدث خطأ أثناء تحديث ملفك الشخصي" : "Failed to update your profile",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const profileData: ProfileData = {
      phone: phone.trim() || undefined,
      linkedinUrl: linkedinUrl.trim() || undefined,
      currentRole: currentRole.trim() || undefined,
      yearsExperience: yearsExperience ? parseInt(yearsExperience, 10) : undefined,
      industry: industry.trim() || undefined,
      skills: skills ? skills.split(",").map(s => s.trim()).filter(Boolean) : undefined,
    };

    updateProfileMutation.mutate(profileData);
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-4xl">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setLocation("/home")}
              data-testid="button-back-home"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Logo size={36} />
            <div>
              <h1 className="text-lg font-bold text-foreground">
                {language === "ar" ? "الملف الشخصي" : "Profile"}
              </h1>
            </div>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                {(user as any).profileImageUrl && <AvatarImage src={(user as any).profileImageUrl} />}
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {(user as any).email?.[0]?.toUpperCase() || (user as any).firstName?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>
                  {(user as any).firstName && (user as any).lastName
                    ? `${(user as any).firstName} ${(user as any).lastName}`
                    : (user as any).email}
                </CardTitle>
                <CardDescription>{(user as any).email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">
                  {language === "ar" ? "رقم الهاتف" : "Phone Number"}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={language === "ar" ? "+966 5X XXX XXXX" : "+966 5X XXX XXXX"}
                  data-testid="input-phone"
                />
              </div>

              {/* LinkedIn URL */}
              <div className="space-y-2">
                <Label htmlFor="linkedin">
                  {language === "ar" ? "رابط LinkedIn" : "LinkedIn URL"}
                </Label>
                <Input
                  id="linkedin"
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourname"
                  data-testid="input-linkedin"
                />
              </div>

              {/* Current Role */}
              <div className="space-y-2">
                <Label htmlFor="role">
                  {language === "ar" ? "المسمى الوظيفي الحالي" : "Current Role"}
                </Label>
                <Input
                  id="role"
                  type="text"
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  placeholder={language === "ar" ? "مثال: مهندس برمجيات" : "e.g., Software Engineer"}
                  data-testid="input-role"
                />
              </div>

              {/* Years of Experience */}
              <div className="space-y-2">
                <Label htmlFor="experience">
                  {language === "ar" ? "سنوات الخبرة" : "Years of Experience"}
                </Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  max="50"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  placeholder={language === "ar" ? "مثال: 5" : "e.g., 5"}
                  data-testid="input-experience"
                />
              </div>

              {/* Industry */}
              <div className="space-y-2">
                <Label htmlFor="industry">
                  {language === "ar" ? "المجال" : "Industry"}
                </Label>
                <Input
                  id="industry"
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder={language === "ar" ? "مثال: التكنولوجيا" : "e.g., Technology"}
                  data-testid="input-industry"
                />
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <Label htmlFor="skills">
                  {language === "ar" ? "المهارات (مفصولة بفواصل)" : "Skills (comma-separated)"}
                </Label>
                <Input
                  id="skills"
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder={language === "ar" ? "مثال: Python, React, SQL" : "e.g., Python, React, SQL"}
                  data-testid="input-skills"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={updateProfileMutation.isPending}
                data-testid="button-save-profile"
              >
                {updateProfileMutation.isPending
                  ? language === "ar" ? "جاري الحفظ..." : "Saving..."
                  : language === "ar" ? "حفظ التغييرات" : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Benefits Card */}
        <Card className="mt-6 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">
              {language === "ar" ? "✨ مميزات حسابك" : "✨ Your Account Benefits"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{language === "ar" ? "جميع بياناتك محفوظة بشكل دائم" : "All your data is saved permanently"}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{language === "ar" ? "الوصول من أي جهاز" : "Access from any device"}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{language === "ar" ? "توصيات مهنية مخصصة" : "Personalized career recommendations"}</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
