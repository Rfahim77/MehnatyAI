import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const login = () => {
    window.location.href = "/api/login";
  };

  const logout = () => {
    // Redirect to logout endpoint (GET)
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
