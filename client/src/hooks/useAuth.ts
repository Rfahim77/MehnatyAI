import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";

export function useAuth() {
  const { toast } = useToast();
  const hasShownError = useRef(false);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  useEffect(() => {
    if (error && !isLoading && !hasShownError.current) {
      hasShownError.current = true;
      toast({
        variant: "destructive",
        title: "خطأ في المصادقة",
        description: "حدث خطأ أثناء التحقق من حالة تسجيل الدخول. يرجى تحديث الصفحة.",
      });
    }
  }, [error, isLoading, toast]);

  const login = () => {
    window.location.href = "/api/login";
  };

  const logout = () => {
    window.location.href = "/api/logout";
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
