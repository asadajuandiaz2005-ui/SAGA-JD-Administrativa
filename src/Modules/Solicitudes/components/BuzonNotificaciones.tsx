// src/Modules/Solicitudes/Components/BuzonNotificaciones.tsx
import React, { useState } from 'react';
import { LuBell, LuX, LuEye, LuUnplug, LuNotebookText, LuClock, LuUser, LuBuilding } from 'react-icons/lu';
import { useNotificacionesSolicitudes, type NotificacionSolicitud } from '../Hooks/HookNotificaciones';
import { IoPersonSharp } from "react-icons/io5";
import { FaExchangeAlt } from "react-icons/fa";
import { FaHandshakeSimple } from "react-icons/fa6";

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';





interface BuzonNotificacionesProps {
  onVerSolicitud?: (notificacion: NotificacionSolicitud) => void;
}

export const BuzonNotificaciones: React.FC<BuzonNotificacionesProps> = ({ onVerSolicitud }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { notificaciones, totalPendientes, isLoading } = useNotificacionesSolicitudes();

  const getTipoIcon = (tipoSolicitud: string) => {
    switch (tipoSolicitud) {
      case 'Afiliacion': return <span><IoPersonSharp /></span>;
      case 'Desconexion': return <span><LuUnplug /></span>;
      case 'Cambio de Medidor': return <span><FaExchangeAlt /></span>;
      case 'Asociado': return <span><FaHandshakeSimple /></span>;
      default: return <span><LuNotebookText /></span>;
    }
  };

  const getTipoColor = (tipoSolicitud: string) => {
    switch (tipoSolicitud) {
      case 'Afiliacion': return 'text-emerald-600 bg-emerald-50';
      case 'Desconexion': return 'text-red-600 bg-red-50';
      case 'Cambio de Medidor': return 'text-blue-600 bg-blue-50';
      case 'Asociado': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

    const formatearFecha = (fecha: string) => {
    if (!fecha) return 'Fecha no disponible';
    try {
      return formatDistanceToNow(new Date(fecha), { 
        addSuffix: true, 
        locale: es 
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  return (
    <div className="relative">
      {/* Botón del buzón */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title={`${totalPendientes} solicitudes pendientes`}
      >
        <LuBell className="w-6 h-6" />
        
        {/* Badge con número de notificaciones */}
        {totalPendientes > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium animate-pulse">
            {totalPendientes > 99 ? '99+' : totalPendientes}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {isOpen && (
        <>
          {/* Overlay */}
          <button
            type="button"
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar panel de notificaciones"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsOpen(false);
              }
            }}
            style={{ cursor: 'pointer' }}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <LuBell className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">
                  Solicitudes Pendientes
                </h3>
                {totalPendientes > 0 && (
                  <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-full">
                    {totalPendientes}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <LuX className="w-4 h-4" />
              </button>
            </div>

            {/* Lista de notificaciones */}
            <div className="max-h-80 overflow-y-auto">
              {(() => {
                if (isLoading) {
                  return (
                    <div className="p-4 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">Cargando notificaciones...</p>
                    </div>
                  );
                }
                if (notificaciones.length === 0) {
                  return (
                    <div className="p-8 text-center">
                      <LuBell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No hay solicitudes pendientes</p>
                      <p className="text-sm text-gray-400 mt-1">Todas las solicitudes han sido revisadas</p>
                    </div>
                  );
                }
                return (
                  <div className="divide-y divide-gray-100">
                    {notificaciones.map((notificacion) => (
                      <button
                        key={notificacion.id}
                        className="w-full text-left p-4 hover:bg-gray-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={() => {
                          onVerSolicitud?.(notificacion);
                          setIsOpen(false);
                        }}
                        tabIndex={0}
                        aria-label={`Ver solicitud de ${notificacion.nombre}`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icono del tipo de persona */}
                          <div className="flex-shrink-0">
                            {notificacion.tipo === 'fisica' ? (
                              <LuUser className="w-5 h-5 text-blue-600" />
                            ) : (
                              <LuBuilding className="w-5 h-5 text-purple-600" />
                            )}
                          </div>

                          {/* Contenido */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">
                                {getTipoIcon(notificacion.tipoSolicitud)}
                              </span>
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${getTipoColor(notificacion.tipoSolicitud)}`}>
                                {notificacion.tipoSolicitud}
                              </span>
                            </div>
                            
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              {notificacion.nombre}
                            </p>
                            
                            <p className="text-xs text-gray-600 mb-2">
                              {notificacion.tipo === 'fisica' ? 'Cédula' : 'Cédula Jurídica'}: {notificacion.cedula}
                            </p>
                            
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <LuClock className="w-3 h-3" />
                              <span>{formatearFecha(notificacion.fechaCreacion)}</span>
                            </div>
                          </div>

                          {/* Botón de acción */}
                          <div className="flex-shrink-0">
                            <span
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Ver solicitud"
                            >
                              <LuEye className="w-4 h-4" />
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            {notificaciones.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    // Navegar a la página de solicitudes
                    window.location.href = '/Solicitudes';
                    setIsOpen(false);
                  }}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Ver todas las solicitudes
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};