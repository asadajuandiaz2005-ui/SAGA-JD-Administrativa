
import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSolicitudesFisicas } from './HookSolicitudesFisicas';
import { useSolicitudesJuridicas } from './HookSolicitudesJuridicas';
import type { SolicitudFisica } from '../Models/ModelosFisicas';
import type { SolicitudJuridica } from '../Models/ModelosJuridicos';




export const useRefreshNotificaciones = () => {
    const queryClient = useQueryClient();
    
    const refreshNotificaciones = async () => {
        try {
            // Invalidar todas las queries relacionadas con solicitudes
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['solicitudes-fisicas'] }),
                queryClient.invalidateQueries({ queryKey: ['solicitudes-juridicas'] }),
                queryClient.invalidateQueries({ queryKey: ['solicitud-afiliacion-fisica'] }),
                queryClient.invalidateQueries({ queryKey: ['solicitud-afiliacion-juridica'] }),
                queryClient.invalidateQueries({ queryKey: ['solicitud-asociado-fisica'] }),
                queryClient.invalidateQueries({ queryKey: ['solicitud-asociado-juridica'] }),
                queryClient.invalidateQueries({ queryKey: ['solicitud-cambio-medidor-fisica'] }),
                queryClient.invalidateQueries({ queryKey: ['solicitud-cambio-medidor-juridica'] }),
                queryClient.invalidateQueries({ queryKey: ['solicitud-desconexion-fisica'] }),
                queryClient.invalidateQueries({ queryKey: ['solicitud-desconexion-juridica'] })
            ]);
            
        } catch (error) {
            console.error(' Error al refrescar notificaciones:', error);
        }
    };
    
    return { refreshNotificaciones };
};

export interface NotificacionSolicitud {
  id: string;
  tipo: 'fisica' | 'juridica';
  tipoSolicitud: 'Afiliacion' | 'Desconexion' | 'Cambio de Medidor' | 'Asociado' | 'Agregar Medidor';
  nombre: string;
  cedula: string;
  fechaCreacion: string;
  mensaje: string;
  solicitudOriginal: SolicitudFisica | SolicitudJuridica;
}

export const useNotificacionesSolicitudes = () => {
  const { data: solicitudesFisicas = [], isLoading: loadingFisicas } = useSolicitudesFisicas();
  const { data: solicitudesJuridicas = [], isLoading: loadingJuridicas } = useSolicitudesJuridicas();

  const notificaciones = useMemo((): NotificacionSolicitud[] => {
    const notificacionesArray: NotificacionSolicitud[] = [];

    // Procesar solicitudes físicas pendientes
    solicitudesFisicas
      .filter(solicitud => solicitud.Estado?.Nombre_Estado === 'Pendiente')
      .forEach((solicitud, index) => {
        const nombreCompleto = `${solicitud.Nombre || ''} ${solicitud.Apellido1 || ''} ${solicitud.Apellido2 || ''}`.trim();
        
        notificacionesArray.push({
          id: `fisica-${index + 1}`,
          tipo: 'fisica',
          tipoSolicitud: solicitud.Tipo_Solicitud,
          nombre: nombreCompleto,
          cedula: solicitud.Tipo_Identificacion,
          fechaCreacion: solicitud.Fecha_Creacion,
          mensaje: `Nueva solicitud de ${solicitud.Tipo_Solicitud.toLowerCase()} de ${nombreCompleto}`,
          solicitudOriginal: solicitud
        });
      });

    // Procesar solicitudes jurídicas pendientes
    solicitudesJuridicas
      .filter(solicitud => solicitud.Estado?.Nombre_Estado === 'Pendiente')
      .forEach((solicitud, index) => {
        const razonSocial = solicitud.Razon_Social || 'Sin razón social';
        
        notificacionesArray.push({
          id: `juridica-${index + 1}`,
          tipo: 'juridica',
          tipoSolicitud: solicitud.Tipo_Solicitud,
          nombre: razonSocial,
          cedula: solicitud.Cedula_Juridica,
          fechaCreacion: solicitud.Fecha_Creacion,
          mensaje: `Nueva solicitud de ${solicitud.Tipo_Solicitud.toLowerCase()} de ${razonSocial}`,
          solicitudOriginal: solicitud
        });
      });

    // Ordenar por fecha de creación 
    return notificacionesArray.sort((a, b) => {
      const fechaA = new Date(a.fechaCreacion).getTime();
      const fechaB = new Date(b.fechaCreacion).getTime();
      return fechaB - fechaA;
    });
  }, [solicitudesFisicas, solicitudesJuridicas]);

  const totalPendientes = notificaciones.length;
  const isLoading = loadingFisicas || loadingJuridicas;

  // Hook para refresh manual
  const { refreshNotificaciones } = useRefreshNotificaciones();
  
  return {
    notificaciones,
    totalPendientes,
    isLoading,
    refreshNotificaciones, // Función para refrescar manualmente
    // Helpers por tipo
    solicitudesFisicasPendientes: notificaciones.filter(n => n.tipo === 'fisica'),
    solicitudesJuridicasPendientes: notificaciones.filter(n => n.tipo === 'juridica'),
    // Helpers por tipo de solicitud
    solicitudesAfiliacion: notificaciones.filter(n => n.tipoSolicitud === 'Afiliacion'),
    solicitudesDesconexion: notificaciones.filter(n => n.tipoSolicitud === 'Desconexion'),
    solicitudesCambioMedidor: notificaciones.filter(n => n.tipoSolicitud === 'Cambio de Medidor'),
    solicitudesAsociado: notificaciones.filter(n => n.tipoSolicitud === 'Asociado'),
  };
};