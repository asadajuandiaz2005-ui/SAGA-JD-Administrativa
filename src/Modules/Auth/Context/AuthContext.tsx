// src/Modules/Auth/Context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getCurrentUser } from '../Services/AuthService';
import type { Usuario } from '@/Modules/Usuarios/Models/Usuario';
import type { AuthState } from '../Types/AuthTypes';

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);


  const refreshUser = async () => {
    try {
      setIsLoading(true);
      const userData = await getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const currentPath = window.location.pathname;
    const publicRoutes = ['/Login', '/ForgotPassword', '/ResetPassword'];
    
    if (publicRoutes.includes(currentPath)) {
      setIsLoading(false);
      setIsAuthenticated(false);
      setUser(null);
      return;
    }

    refreshUser();
  }, []);

  const contextValue: AuthState = {
    user,
    isLoading,
    isAuthenticated,
    refreshUser
  };


  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

