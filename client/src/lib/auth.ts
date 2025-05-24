import { apiRequest } from "./queryClient";
import type { LoginData, RegisterData, User } from "@shared/schema";

export interface AuthResponse {
  token: string;
  user: User;
}

export class AuthService {
  private static instance: AuthService;
  private token: string | null = null;

  private constructor() {
    this.token = localStorage.getItem('authToken');
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginData): Promise<AuthResponse> {
    const response = await apiRequest('POST', '/api/auth/login', credentials);
    const data = await response.json();
    
    this.setToken(data.token);
    return data;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await apiRequest('POST', '/api/auth/register', userData);
    const data = await response.json();
    
    this.setToken(data.token);
    return data;
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getAuthHeader(): Record<string, string> {
    if (!this.token) return {};
    return {
      'Authorization': `Bearer ${this.token}`
    };
  }
}

export const authService = AuthService.getInstance();
