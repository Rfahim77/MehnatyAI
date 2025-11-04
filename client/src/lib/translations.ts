export type Language = "ar" | "en";

export const translations = {
  ar: {
    // App title
    appTitle: "مساعد المهنة الذكي",
    appSubtitle: "بوابتك للنجاح المهني في المملكة العربية السعودية",
    
    // Pathway options
    pathways: {
      resume_review: {
        title: "مراجعة السيرة الذاتية",
        description: "احصل على تحليل شامل لسيرتك الذاتية مع اقتراحات للتحسين"
      },
      career_chat: {
        title: "محادثة مهنية",
        description: "ناقش مسارك المهني واحصل على نصائح مخصصة"
      },
      future_plan: {
        title: "التخطيط المستقبلي",
        description: "خطة مهنية لـ 3-6 أشهر مع رؤى سوق العمل السعودي"
      },
      tailor_to_job: {
        title: "تخصيص للوظيفة",
        description: "قارن سيرتك الذاتية مع متطلبات الوظيفة واحصل على نقاط محسّنة"
      },
      interview: {
        title: "التحضير للمقابلة",
        description: "أسئلة المقابلة الشائعة واستراتيجيات الإجابة"
      },
      cover_letter: {
        title: "خطاب التقديم",
        description: "إنشاء خطاب تقديم مخصص باللغة العربية"
      },
      skills_gap: {
        title: "تحليل الفجوات",
        description: "حدد المهارات المطلوبة وكيفية اكتسابها"
      },
      build_from_zero: {
        title: "بناء من البداية",
        description: "إنشاء سيرة ذاتية كاملة من خلال المحادثة"
      }
    },
    
    // Chat interface
    chat: {
      inputPlaceholder: "اكتب رسالتك هنا...",
      sendButton: "إرسال",
      uploadFile: "رفع ملف",
      newChat: "محادثة جديدة",
      typing: "جاري الكتابة...",
      errorMessage: "عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.",
      emptyTitle: "ابدأ المحادثة",
      emptyDescription: "اكتب رسالتك أدناه أو اختر أحد المسارات من الصفحة الرئيسية"
    },
    
    // File upload
    fileUpload: {
      title: "رفع ملف",
      description: "قم بسحب وإفلات ملف أو انقر للاختيار",
      supportedFormats: "الصيغ المدعومة: PDF، DOCX، صور",
      maxSize: "الحد الأقصى للحجم: 10 ميجابايت",
      uploading: "جاري الرفع...",
      success: "تم الرفع بنجاح",
      error: "فشل الرفع"
    },
    
    // Output cards
    cards: {
      resume: "السيرة الذاتية",
      careerPlan: "خطة المسار المهني",
      jdMatch: "مطابقة الوصف الوظيفي",
      rewrittenBullets: "نقاط محسّنة",
      interviewPrep: "التحضير للمقابلة",
      coverLetter: "خطاب التقديم",
      skillsGap: "تحليل الفجوات",
      export: "تصدير",
      exportDocx: "تصدير DOCX",
      exportPdf: "تصدير PDF"
    },
    
    // Authentication
    auth: {
      login: "تسجيل الدخول",
      logout: "تسجيل الخروج",
      signup: "إنشاء حساب",
      loggingIn: "جاري تسجيل الدخول...",
      loggingOut: "جاري تسجيل الخروج..."
    },
    
    // User
    user: {
      account: "حسابي",
      profile: "الملف الشخصي"
    },
    
    // Common
    common: {
      loading: "جاري التحميل...",
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
    appTitle: "AI Career Assistant",
    appSubtitle: "Your gateway to professional success in Saudi Arabia",
    
    // Pathway options
    pathways: {
      resume_review: {
        title: "Resume Review",
        description: "Get comprehensive analysis of your CV with improvement suggestions"
      },
      career_chat: {
        title: "Career Chat",
        description: "Discuss your career path and get personalized advice"
      },
      future_plan: {
        title: "Future Planning",
        description: "3-6 month career roadmap with KSA market insights"
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
        description: "Generate a custom cover letter in Arabic"
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
      title: "Upload File",
      description: "Drag and drop a file or click to select",
      supportedFormats: "Supported formats: PDF, DOCX, images",
      maxSize: "Max size: 10 MB",
      uploading: "Uploading...",
      success: "Upload successful",
      error: "Upload failed"
    },
    
    // Output cards
    cards: {
      resume: "Resume",
      careerPlan: "Career Path Plan",
      jdMatch: "Job Description Match",
      rewrittenBullets: "Improved Bullets",
      interviewPrep: "Interview Preparation",
      coverLetter: "Cover Letter",
      skillsGap: "Skills Gap Analysis",
      export: "Export",
      exportDocx: "Export DOCX",
      exportPdf: "Export PDF"
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
