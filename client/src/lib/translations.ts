export type Language = "ar" | "en";

export const translations = {
  ar: {
    // App title
    appTitle: "مهنتي | Mehnaty AI",
    appSubtitle: "مساعدك المهني بالذكاء الاصطناعي - مراجعة سيرتك، خطط مهنية، وتدريب على المقابلات بالعربية",
    
    // Pathway options
    pathways: {
      resume_review: {
        title: "مراجعة السيرة الذاتية",
        description: "احصل على تحليل شامل لسيرتك مع توصيات عملية للتحسين."
      },
      career_chat: {
        title: "استشارة مهنية",
        description: "ناقِش مسارك المهني واحصل على إرشاد مخصّص."
      },
      future_plan: {
        title: "التخطيط للمستقبل",
        description: "خطّة مهارات لمدة ٣–٦ أشهر مع معالم شهرية."
      },
      tailor_to_job: {
        title: "مواءمة السيرة للوظيفة",
        description: "قارِن سيرتك بالوصف الوظيفي وحدّث النقاط فورًا."
      },
      interview: {
        title: "الاستعداد للمقابلة",
        description: "أسئلة محاكاة بالعربية مع ملاحظات فورية."
      },
      cover_letter: {
        title: "خطاب التقديم",
        description: "إنشاء خطاب تقديم احترافي مخصّص."
      },
      skills_gap: {
        title: "تحليل فجوات المهارات",
        description: "حدِّد المهارات المطلوبة وكيفية اكتسابها."
      },
      build_from_zero: {
        title: "البناء من الصفر",
        description: "أنشئ سيرة كاملة عبر الحوار خطوة بخطوة."
      }
    },
    
    // Chat interface
    chat: {
      inputPlaceholder: "اكتب رسالتك هنا...",
      sendButton: "إرسال",
      uploadFile: "رفع ملف",
      newChat: "محادثة جديدة",
      typing: "جارٍ الكتابة...",
      errorMessage: "عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.",
      emptyTitle: "ابدأ المحادثة",
      emptyDescription: "اكتب رسالتك أدناه أو اختر أحد المسارات من الصفحة الرئيسية"
    },
    
    // File upload
    fileUpload: {
      title: "رفع السيرة الذاتية",
      description: "ارفع ملف سيرتك الذاتية بصيغة PDF أو DOCX أو صورة",
      dragOrClick: "اسحب الملف أو اضغط للاختيار",
      supportedFormats: "PDF، DOCX، أو صورة (PNG، JPG)",
      maxSize: "الحد الأقصى للحجم: 10 ميجابايت",
      extracting: "جارٍ استخراج النص...",
      parsing: "جارٍ تحليل السيرة الذاتية...",
      uploading: "جارٍ الرفع...",
      success: "تم التحليل بنجاح!",
      error: "فشل الرفع",
      uploadAndAnalyze: "رفع وتحليل"
    },
    
    // Output cards
    cards: {
      resume: "السيرة الذاتية",
      careerPlan: "الخطة المهنية",
      jdMatch: "مطابقة الوصف الوظيفي",
      rewrittenBullets: "النقاط المحسّنة",
      interviewPrep: "الاستعداد للمقابلة",
      coverLetter: "خطاب التقديم",
      skillsGap: "تحليل فجوات المهارات",
      export: "تصدير",
      exportDocx: "تصدير بصيغة DOCX",
      exportPdf: "تصدير بصيغة PDF"
    },
    
    // Landing page
    landing: {
      tagline: "مساعدك المهني بالعربية",
      login: "سجّل الدخول",
      signUpPrompt: "لا تملك حسابًا؟",
      signUpLink: "أنشئ حسابًا مجانًا",
      freeAccess: "الوصول مجاني حاليًا.",
      hero: {
        title: "مدرّب مهني يعتمد على الذكاء الاصطناعي",
        supportingLine: "استخدم الذكاء الاصطناعي لتعزيز مسارك: نراجع سيرتك، نخصّصها للوظيفة، ونبني خطة مهارات ٣–٦ أشهر—بالعربية",
        cta: "ابدأ الآن"
      },
      features: {
        resumeReview: "مراجعة السيرة الذاتية",
        resumeReviewDesc: "تحليل شامل مع توصيات التحسين",
        careerChat: "استشارة مهنية",
        careerChatDesc: "استشارات مهنية مخصصة",
        futurePlan: "التخطيط للمستقبل",
        futurePlanDesc: "خطة مهنية لمدة 3-6 أشهر",
        tailorJob: "مواءمة السيرة الذاتية للوظيفة",
        tailorJobDesc: "مطابقة السيرة مع متطلبات الوظيفة",
        interview: "الاستعداد للمقابلة",
        interviewDesc: "أسئلة واستراتيجيات المقابلات",
        coverLetter: "خطاب التقديم",
        coverLetterDesc: "إنشاء خطابات تقديم احترافية",
        skillsGap: "تحليل فجوات المهارات",
        skillsGapDesc: "حدد المهارات وكيفية اكتسابها",
        buildFromZero: "البناء من الصفر",
        buildFromZeroDesc: "إنشاء سيرة ذاتية كاملة"
      },
      howItWorks: {
        title: "كيف يعمل؟",
        step1: "سجّل الدخول",
        step1Desc: "أنشئ حساباً مجانياً باستخدام Google أو GitHub أو Apple",
        step2: "اختر مسارك",
        step2Desc: "حدد أحد المسارات المهنية الثمانية المتاحة",
        step3: "احصل على توجيه",
        step3Desc: "احصل على استشارات مخصصة باللغة العربية الفصحى"
      },
      cta: {
        title: "جاهز للبدء؟",
        description: "انضم مجاناً وابدأ رحلتك المهنية اليوم",
        button: "ابدأ مجاناً"
      },
      footer: {
        copyright: "نحترم خصوصيتك ولا نختلق شهادات أو خبرات",
        privacy: "جميع بياناتك محمية وآمنة"
      }
    },
    
    // Authentication
    auth: {
      login: "تسجيل الدخول",
      logout: "تسجيل الخروج",
      signup: "إنشاء حساب",
      loggingIn: "جارٍ تسجيل الدخول...",
      loggingOut: "جارٍ تسجيل الخروج..."
    },
    
    // User
    user: {
      account: "حسابي",
      profile: "الملف الشخصي"
    },
    
    // Common
    common: {
      loading: "جارٍ التحميل...",
      save: "حفظ",
      cancel: "إلغاء",
      close: "إغلاق",
      delete: "حذف",
      edit: "تعديل",
      back: "رجوع",
      next: "التالي",
      submit: "إرسال"
    }
  },
  
  en: {
    // App title
    appTitle: "مهنتي | Mihnaty AI",
    appSubtitle: "Your AI Career Copilot - Resume reviews, career plans, and interview prep in Arabic",
    
    // Pathway options
    pathways: {
      resume_review: {
        title: "Resume Review",
        description: "Get comprehensive analysis of your CV with improvement recommendations"
      },
      career_chat: {
        title: "Career Chat",
        description: "Discuss your career path and get personalized advice"
      },
      future_plan: {
        title: "Future Planning",
        description: "3-6 month career roadmap with market insights"
      },
      tailor_to_job: {
        title: "Tailor to Job",
        description: "Match your resume to job requirements and get improved bullets"
      },
      interview: {
        title: "Interview Prep",
        description: "Common interview questions and answer strategies"
      },
      cover_letter: {
        title: "Cover Letter",
        description: "Generate a professional custom cover letter"
      },
      skills_gap: {
        title: "Skills Gap Analysis",
        description: "Identify required skills and how to acquire them"
      },
      build_from_zero: {
        title: "Build from Scratch",
        description: "Create a complete resume through conversation"
      }
    },
    
    // Chat interface
    chat: {
      inputPlaceholder: "Type your message here...",
      sendButton: "Send",
      uploadFile: "Upload file",
      newChat: "New chat",
      typing: "Typing...",
      errorMessage: "Sorry, an error occurred. Please try again.",
      emptyTitle: "Start the conversation",
      emptyDescription: "Type your message below or choose a pathway from the main page"
    },
    
    // File upload
    fileUpload: {
      title: "Upload Resume",
      description: "Upload your resume in PDF, DOCX, or image format",
      dragOrClick: "Drag file or click to select",
      supportedFormats: "PDF, DOCX, or image (PNG, JPG)",
      maxSize: "Max size: 10 MB",
      extracting: "Extracting text...",
      parsing: "Analyzing resume...",
      uploading: "Uploading...",
      success: "Analysis successful!",
      error: "Upload failed",
      uploadAndAnalyze: "Upload and Analyze"
    },
    
    // Output cards
    cards: {
      resume: "Resume",
      careerPlan: "Career Plan",
      jdMatch: "Job Description Match",
      rewrittenBullets: "Improved Bullets",
      interviewPrep: "Interview Preparation",
      coverLetter: "Cover Letter",
      skillsGap: "Skills Gap Analysis",
      export: "Export",
      exportDocx: "Export DOCX",
      exportPdf: "Export PDF"
    },
    
    // Landing page
    landing: {
      tagline: "Your Arabic career copilot.",
      login: "Sign In",
      signUpPrompt: "Don't have an account?",
      signUpLink: "Create a free account",
      freeAccess: "Access is currently free.",
      hero: {
        title: "مهنتي | Mihnaty AI",
        supportingLine: "Precise reviews, actionable plans, and smart interview prep — in Arabic, powered by AI.",
        cta: "Start Now"
      },
      features: {
        resumeReview: "Resume Review",
        resumeReviewDesc: "Comprehensive analysis with improvement recommendations",
        careerChat: "Career Chat",
        careerChatDesc: "Personalized career consultations",
        futurePlan: "Future Planning",
        futurePlanDesc: "3-6 month career roadmap",
        tailorJob: "Tailor to Job",
        tailorJobDesc: "Match resume to job requirements",
        interview: "Interview Prep",
        interviewDesc: "Interview questions and strategies",
        coverLetter: "Cover Letter",
        coverLetterDesc: "Professional cover letter creation",
        skillsGap: "Skills Gap Analysis",
        skillsGapDesc: "Identify and acquire skills",
        buildFromZero: "Build from Scratch",
        buildFromZeroDesc: "Create complete resume"
      },
      howItWorks: {
        title: "How It Works",
        step1: "Sign In",
        step1Desc: "Create a free account using Google, GitHub, or Apple",
        step2: "Choose Your Path",
        step2Desc: "Select one of 8 available career pathways",
        step3: "Get Guidance",
        step3Desc: "Receive personalized advice in Modern Standard Arabic"
      },
      cta: {
        title: "Ready to Get Started?",
        description: "Join free and begin your career journey today",
        button: "Start Free"
      },
      footer: {
        copyright: "We respect your privacy and never fabricate credentials or experience",
        privacy: "All your data is protected and secure"
      }
    },
    
    // Authentication
    auth: {
      login: "Login",
      logout: "Logout",
      signup: "Sign up",
      loggingIn: "Logging in...",
      loggingOut: "Logging out..."
    },
    
    // User
    user: {
      account: "My Account",
      profile: "Profile"
    },
    
    // Common
    common: {
      loading: "Loading...",
      save: "Save",
      cancel: "Cancel",
      close: "Close",
      delete: "Delete",
      edit: "Edit",
      back: "Back",
      next: "Next",
      submit: "Submit"
    }
  }
};

export function getTranslation(language: Language, key: string): string {
  const keys = key.split(".");
  let value: any = translations[language];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
}
