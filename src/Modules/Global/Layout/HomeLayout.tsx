import { AllowedModulesProvider } from '@/Modules/Auth/provider/PermisoProvider'
import { AppSidebar } from '../components/Sidebar/Sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '../components/Sidebar/ui/sidebar'
import { ProtectedRoute } from './ProtectedRoutes'
import { useState } from 'react'
import type { NotificacionSolicitud } from '@/Modules/Solicitudes/Hooks/HookNotificaciones'
import ModalSolicitud from '@/Modules/Solicitudes/components/ModalSolicitud'
import { BuzonNotificaciones } from '@/Modules/Solicitudes/components/BuzonNotificaciones'
import { useUserPermissions } from '@/Modules/Auth/Hooks/PermissionHook'
import Breadcrumbs from '../components/Breadcrumbs'

export const HomeLayout = ({ children }: { children: (allowedModules: any) => React.ReactNode }) => {
  const [showModalSolicitud, setShowModalSolicitud] = useState(false);
  const [selectedNotificacion, setSelectedNotificacion] = useState<NotificacionSolicitud | null>(null);
  const { canView, isLoading } = useUserPermissions();

  const handleVerSolicitud = (notificacion: NotificacionSolicitud) => {
    setSelectedNotificacion(notificacion);
    setShowModalSolicitud(true);
  };

  return (
    <ProtectedRoute>
      {(allowedModules) => (
        <AllowedModulesProvider allowedModules={allowedModules}>
          <div className="h-screen overflow-hidden">
            <SidebarProvider>
              <AppSidebar allowedModules={allowedModules} />
              <SidebarInset className="flex flex-col h-full">
                <header className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between min-h-[93px]">
                  <SidebarTrigger className="md:hidden w-16 h-16 inline-flex items-center justify-center" />
                  <div className=" flex-1">
                    <Breadcrumbs />
                  </div>
                  {!isLoading && canView('solicitudes') && (
                    <div className="ml-auto">
                      <BuzonNotificaciones onVerSolicitud={handleVerSolicitud} />
                    </div>
                  )}
                </header>

                <main className="flex-1 overflow-y-auto">
                  <div className="p-4">
                    {children(allowedModules)}
                  </div>
                </main>
              </SidebarInset>
            </SidebarProvider>
          </div>
          {showModalSolicitud && selectedNotificacion && (
            <ModalSolicitud
              isOpen={showModalSolicitud}
              onClose={() => {
                setShowModalSolicitud(false);
                setSelectedNotificacion(null);
              }}
              solicitud={{
                tipo: selectedNotificacion.tipo === 'fisica' ? 'solicitud-fisica' : 'solicitud-juridica',
                datos: selectedNotificacion.solicitudOriginal
              }}
            />
          )}
        </AllowedModulesProvider>
      )}
    </ProtectedRoute>
  )
}