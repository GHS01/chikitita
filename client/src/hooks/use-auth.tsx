import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService, type AuthResponse } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import type { LoginData, RegisterData, User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginData) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  // Fetch user profile if authenticated
  const { data: profile, isLoading } = useQuery({
    queryKey: ['/api/user/profile'],
    enabled: authService.isAuthenticated(),
    retry: false,
  });

  useEffect(() => {
    if (profile) {
      setUser(profile);
    }
  }, [profile]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const response = await authService.login(credentials);
      return response;
    },
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries();
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const response = await authService.register(userData);
      return response;
    },
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries();
    },
  });

  const login = async (credentials: LoginData) => {
    await loginMutation.mutateAsync(credentials);
  };

  const register = async (userData: RegisterData) => {
    await registerMutation.mutateAsync(userData);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    queryClient.clear();
  };

  const value = {
    user,
    login,
    register,
    logout,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
