import { useAuth } from '@/Modules/Auth/Context/AuthContext';
import { cookieUtils } from '../utils/CookieUtils';
import { Navigate, useLocation } from '@tanstack/react-router';
import { type ReactNode } from 'react';
import { modules } from '../components/DashboardGlobal/ModulosData';

interface ProtectedRouteProps {
  children: (allowedModules: any[]) => ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation()
  const currentPath = location.pathname
 
  const alwaysAllowedRoutes = ['/Home']
  const isAlwaysAllowed = alwaysAllowedRoutes.some(route => 
    normalizePath(currentPath) === normalizePath(route)
  );

  const allowedModules = modules.filter(module => {
  const hasPermission = user?.Rol?.Permisos.some(p => 
    p.Modulo.toLowerCase() === module.Permiso.toLowerCase() && (p.Ver || p.Editar)
  );
  return hasPermission;
  });

  const hasPermissionForCurrentRoute = isAlwaysAllowed || 
  allowedModules.some(mod => normalizePath(mod.path) === normalizePath(currentPath))

  const existRoute = modules.some(mod => normalizePath(mod.path) === normalizePath(currentPath)) || isAlwaysAllowed;

    if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Verificando autenticación...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated || !user) {
    cookieUtils.removeToken();
    return <Navigate to="/Login" />;
  }
  if (!existRoute) {
    cookieUtils.removeToken();
    return <Navigate to="/NotFound" />
  }
  if (!hasPermissionForCurrentRoute) {
    return <Navigate to="/Unauthorized" />
  }


  return <>{children(allowedModules)}</>;
};

  function normalizePath(path: string) {
  return path.replace(/(^\/+)|(\/+$)/g, '').toLowerCase();
}