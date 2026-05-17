import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarSeparator, useSidebar } from "./ui/sidebar"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/Modules/Global/components/Sidebar/ui/alert-dialog"
import { Link, useLocation } from '@tanstack/react-router'
import { useLogout } from '../../../Auth/Hooks/AuthHook'
import * as Accordion from "@radix-ui/react-accordion"
import { useRef, useState } from "react"
import { HiLogout } from 'react-icons/hi'
import { FiChevronDown, FiChevronRight } from 'react-icons/fi'
import { sections, type AppSidebarProps } from "../../types/Sections"
import { Button } from "./ui/button"
import { useAlerts } from "../../context/AlertContext"
import { LuKey } from "react-icons/lu"
import { ChangePasswordModal } from "@/Modules/Auth/Components/ChangePassword"
import { useAuth } from "@/Modules/Auth/Context/AuthContext"
import { useNotificacionesSolicitudes } from '../../../Solicitudes/Hooks/HookNotificaciones'
import { useMedidoresSinArchivos } from '../../../Inventario/hooks/useMedidoresSinArchivos'

export function AppSidebar({ allowedModules }: Readonly<AppSidebarProps>) {
  const hoveredRef = useRef(false)
  const [openSections, setOpenSections] = useState<number[]>([])
  const location = useLocation()
  const logoutMutation = useLogout()
  const { setOpen: setSidebarOpen } = useSidebar()
  const { showSuccess } = useAlerts()
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const { totalPendientes } = useNotificacionesSolicitudes()
  const { totalMedidoresSinArchivos } = useMedidoresSinArchivos()

  const { user, isLoading } = useAuth()
  const currentUser = {
    id: user?.Id_Usuario,
    name: user?.Nombre_Usuario,
    email: user?.Correo_Electronico
  }

  const isActive = (path: string) => location.pathname === path

  const handleLogout = () => {
    logoutMutation.mutate()
    showSuccess('Sesión cerrada exitosamente')
  }

  const handleValueChange = (values: string[]) => {
    setOpenSections(values.map(v => Number(v)))
  }

  const sectionsWithModules = sections.filter(section => {
    const sectionModules = allowedModules.filter(mod => mod.section === section.key && !mod.hidden)
    return sectionModules.length > 0
  })

  return (
    <section
      aria-hidden="true"
      className="relative"
      onMouseEnter={() => {
        hoveredRef.current = true
        window.setTimeout(() => {
          setSidebarOpen(true)
        }, 200)
      }}
      onMouseLeave={() => {
        hoveredRef.current = false
        window.setTimeout(() => {
          setSidebarOpen(false)
        }, 200)
      }}
    >
      <Sidebar
        variant="sidebar"
        collapsible="icon"
        className="transition-all duration-300 z-40"
      >
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex flex-col items-center p-2">
            <Link to={'/Home'} className='size-15 rounded-lg flex items-center justify-center text-white font-bold'>
              <img src="/Logo_ASADA_Juan_Díaz.png" alt='logo' className='size-15 rounded-full group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8' />
            </Link>

            <h2 className="font-semibold text-2xl text-center text-sidebar-foreground mt-2 group-data-[collapsible=icon]:hidden">
              Panel Administrativo
            </h2>
          </div>
        </SidebarHeader>

        <SidebarContent className="scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100 max-h-[calc(100vh-180px)]">
          <Accordion.Root
            type="multiple"
            value={openSections.map(String)}
            onValueChange={handleValueChange}
          >
            {sectionsWithModules.map(section => {
              const isOpen = openSections.includes(section.id)
              const sectionModules = allowedModules.filter(mod => mod.section === section.key)

              return (
                <Accordion.Item
                  key={`section-${section.id}`}
                  value={String(section.id)}
                  className="border-none shadow-none bg-transparent"
                >
                  <Accordion.Header className="group-data-[collapsible=icon]:hidden">
                    <Accordion.Trigger className="text-base font-semibold px-2 py-1 w-full text-left">
                      <div className="flex items-center justify-between pl-2 w-full">
                        {section.title}
                        <span>
                          {isOpen ? <FiChevronDown size={20} /> : <FiChevronRight size={20} />}
                        </span>
                      </div>
                    </Accordion.Trigger>
                  </Accordion.Header>

                  <Accordion.Content className="accordion-content p-0">
                    <ul>
                      {sectionModules.flatMap(mod => mod.hidden ? [] : [mod]).map((mod) => (
                        <li key={`${mod.name}-${mod.path}`}>
                          <Link
                            to={mod.path}
                            className={`flex items-center px-4 py-2 rounded-lg transition-colors
                              ${isActive(mod.path)
                                ? 'bg-blue-100 text-blue-600'
                                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}
                            `}
                          >
                            <span className="size-6 flex items-center justify-center">{mod.icon}</span>
                            <span className="ml-2 group-data-[collapsible=icon]:hidden">{mod.name}</span>

                            {(mod.name === 'Revisión de Solicitudes' || mod.path === '/Solicitudes') && totalPendientes > 0 && (
                              <span className="ml-auto bg-red-500 text-white text-xs rounded-full size-5 flex items-center justify-center font-medium group-data-[collapsible=icon]:hidden">
                                {totalPendientes > 9 ? '9+' : totalPendientes}
                              </span>
                            )}
                            {mod.path === '/Afiliados' && totalMedidoresSinArchivos > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium group-data-[collapsible=icon]:hidden">
                              {totalMedidoresSinArchivos > 9 ? '9+' : totalMedidoresSinArchivos}
                            </span>
                          )}
                        </Link>
                        </li>
                      ))}
                    </ul>
                  </Accordion.Content>
                </Accordion.Item>
              )
            })}
          </Accordion.Root>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border">
          <div className="flex gap-x-3 m-2 ">
            {isLoading ? (
              <div className="size-8 bg-gray-300 rounded-full animate-pulse" />
            ) : (
              <>
                <div className="size-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                  {(currentUser.name ? currentUser.name.toLocaleUpperCase().split(' ').map(n => n[0]).join('') : '')}
                </div>
                <div className="group-data-[collapsible=icon]:hidden">
                  <p className="text-sm font-medium text-sidebar-foreground">{currentUser.name}</p>
                  <p className="text-xs text-sidebar-foreground/70">{currentUser.email}</p>
                </div>
              </>
            )}
          </div>

          <SidebarSeparator />
          <ul className="gap-y-1 p-2 flex flex-col group-data-[collapsible=icon]:items-center">
            <li>
              <Button
                variant="outline"
                onClick={() => setShowChangePasswordModal(true)}
                className="flex items-center w-full px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <LuKey className="size-4" />
                <span className="ml-2 group-data-[collapsible=icon]:hidden">
                  Cambiar Contraseña
                </span>
              </Button>
            </li>
            <li>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="celeste"
                    className="flex items-center w-full px-4 py-2 rounded-lg"
                  >
                    <HiLogout className="size-4" />
                    <span className="ml-2 group-data-[collapsible=icon]:hidden">
                      {logoutMutation.isPending ? 'Cerrando...' : 'Cerrar Sesión'}
                    </span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      <span>¿Cerrar sesión?</span>
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      <span>¿Estás seguro de que deseas cerrar sesión?</span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogAction
                      onClick={handleLogout}
                      disabled={logoutMutation.isPending}
                    >
                      <span>Cerrar sesión</span>
                    </AlertDialogAction>
                    <AlertDialogCancel><span>Cancelar</span></AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </li>
          </ul>
        </SidebarFooter>
      </Sidebar>

      <ChangePasswordModal
        open={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        userId={currentUser.id!}
      />
    </section>
  )
}