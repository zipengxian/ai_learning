import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import apiClient from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  grade?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    grade?: string;
    role?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Try to restore token from memory - in production use AsyncStorage
    setState((prev) => ({ ...prev, isLoading: false }));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const result = await apiClient.login(email, password);
      const user = result.user as unknown as User;
      apiClient.setToken(result.token);
      setState({
        user,
        token: result.token,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      name: string;
      grade?: string;
      role?: string;
    }) => {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const result = await apiClient.register(data);
        const user = result.user as unknown as User;
        apiClient.setToken(result.token);
        setState({
          user,
          token: result.token,
          isLoading: false,
          isAuthenticated: true,
        });
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
        throw error;
      }
    },
    []
  );

  const logout = useCallback(() => {
    apiClient.setToken(null);
    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;