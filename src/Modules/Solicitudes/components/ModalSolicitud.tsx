import React, { useState, useEffect } from 'react';
import { X, User, Check, XCircle } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/Modules/Global/components/Sidebar/ui/alert-dialog';
import type { SolicitudFisica } from '../Models/ModelosFisicas';
import type { SolicitudJuridica } from '../Models/ModelosJuridicos';
import ModalMedidor from './ModalMedidor';
import { useMarcarEnRevision, useAprobarYEnEspera, useCompletar, useRechazar } from '../Hooks/HookEstadosSolicitudes';
import { mapearTipoSolicitud, mapearTipoPersona } from '../Service/EstadoSolicitudes';
import type { TipoSolicitud, TipoPersona } from '../Types/EstadoSolicitudes';
import { useAlerts } from '@/Modules/Global/context/AlertContext';
import { updateEstadoMedidor } from '@/Modules/Inventario/service/MedidorServices';
import { getAfiliadoFisicoByIdentificacion } from '@/Modules/Afiliados/Service/ServiceAfiliadoFisico';
import { getAfiliadoJuridicoByIdentificacion } from '@/Modules/Afiliados/Service/ServiceAfiliadoJuridico';
import { getMedidoresDesconexionFisicas } from '../Service/SolicitudesFisicas';
import { getMedidoresDesconexionJuridicas } from '../Service/SolicitudesJuridicas';
/*import { getSolicitudFisicaById } from '../Service/SolicitudesFisicas';
import { getSolicitudJuridicaById } from '../Service/SolicitudesJuridicas';
*/
interface ModalSolicitudProps {
    isOpen: boolean;
    onClose: () => void;
    solicitud: {
        tipo: 'solicitud-fisica' | 'solicitud-juridica';
        datos: SolicitudFisica | SolicitudJuridica;
        tipoSolicitud?: 'Afiliacion' | 'Cambio de Medidor' | 'Asociado' | 'Desconexion' | 'Agregar Medidor'; // Nuevo campo para identificar el subtipo
    };
}

//Modal simple para gestionar estados de solicitudes
const ModalSolicitud: React.FC<ModalSolicitudProps> = ({ isOpen, onClose, solicitud }) => {
    // Estado para controlar el modal de asignación de medidor
    const [showModalMedidor, setShowModalMedidor] = useState(false);
    const [numeroMedidorAsignado, setNumeroMedidorAsignado] = useState<string | number | null>(null);

    // Estados para controlar los AlertDialog
    const [showAprobarDialog, setShowAprobarDialog] = useState(false);
    const [showCompletarDialog, setShowCompletarDialog] = useState(false);
    const [showRechazarDialog, setShowRechazarDialog] = useState(false);
    const [motivoRechazo, setMotivoRechazo] = useState('');
    // Estados para el flujo de medidor dañado
    const [showDialogMedidorDanado, setShowDialogMedidorDanado] = useState(false);
    const [showDialogMontoCambio, setShowDialogMontoCambio] = useState(false);
    const [showDialogMontoAgregarMedidor, setShowDialogMontoAgregarMedidor] = useState(false);
    const [montoPago, setMontoPago] = useState<number | string>('');
    const [motivoCambio, setMotivoCambio] = useState('');

    const handleMontoChange = (value: string) => {
        const soloDigitos = value.replace(/\D/g, '');

        if (soloDigitos.length > 6) return;
        if (soloDigitos.length > 0 && soloDigitos[0] === '0') return;

        setMontoPago(soloDigitos);
    };

    const marcarEnRevisionMutation = useMarcarEnRevision();
    const aprobarYEnEsperaMutation = useAprobarYEnEspera();
    const completarMutation = useCompletar();
    const rechazarMutation = useRechazar();
    const { showWarning, showError } = useAlerts();

    const datosSolicitudRaw = solicitud.datos as any;
    const tipoSolicitudTexto = String(
        solicitud.tipoSolicitud ||
        datosSolicitudRaw?.Tipo_Solicitud ||
        datosSolicitudRaw?.TipoSolicitud ||
        ''
    );
    const tipoSolicitudNormalizado = tipoSolicitudTexto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
    const requiereInfoAfiliado =
        !tipoSolicitudNormalizado.includes('afiliacion') &&
        (
            (tipoSolicitudNormalizado.includes('cambio') && tipoSolicitudNormalizado.includes('medidor')) ||
            tipoSolicitudNormalizado.includes('desconexion') ||
            tipoSolicitudNormalizado.includes('asociado') ||
            (tipoSolicitudNormalizado.includes('agregar') && tipoSolicitudNormalizado.includes('medidor'))
        );

    const tipoEntidadRaw = Number(datosSolicitudRaw?.Tipo_Entidad);
    const esEntidadJuridica = tipoEntidadRaw === 2 || (!tipoEntidadRaw && solicitud.tipo === 'solicitud-juridica');
    const identificacionConsulta = esEntidadJuridica
        ? String(datosSolicitudRaw?.Cedula_Juridica || '').trim()
        : String(datosSolicitudRaw?.Identificacion || datosSolicitudRaw?.Cedula || '').trim();

    type AfiliadoInfoCargado =
        | { tipoEntidad: 1; data: Awaited<ReturnType<typeof getAfiliadoFisicoByIdentificacion>> }
        | { tipoEntidad: 2; data: Awaited<ReturnType<typeof getAfiliadoJuridicoByIdentificacion>> };

    const [afiliadoInfo, setAfiliadoInfo] = useState<AfiliadoInfoCargado | null>(null);
    const [loadingAfiliadoInfo, setLoadingAfiliadoInfo] = useState(false);
    const [errorAfiliadoInfo, setErrorAfiliadoInfo] = useState<string | null>(null);

    const [medidorDesconexion, setMedidorDesconexion] = useState<{ Id_Medidor: number; Numero_Medidor: number | string } | null>(null);

    useEffect(() => {
        if (!isOpen || !tipoSolicitudNormalizado.includes('desconexion')) {
            setMedidorDesconexion(null);
            return;
        }

        const solicitudId = datosSolicitudRaw?.Id_Solicitud || datosSolicitudRaw?.id || datosSolicitudRaw?.Id || datosSolicitudRaw?.ID || datosSolicitudRaw?.solicitudId;
        console.log('[Desconexion] datosSolicitudRaw:', datosSolicitudRaw);
        if (!solicitudId) { console.warn('[Desconexion] No se encontró solicitudId'); return; }

        let cancelled = false;
        (async () => {
            try {
                const lista = esEntidadJuridica
                    ? await getMedidoresDesconexionJuridicas()
                    : await getMedidoresDesconexionFisicas();
                if (cancelled) return;

                console.log('[Desconexion] solicitudId:', solicitudId, '| lista:', lista);

                const encontrado = lista.find((m) => {
                    const idEnLista = m.Id_Solicitud ?? m.id_solicitud ?? m.idSolicitud ?? m.solicitudId ?? m.id ?? m.Id;
                    return String(idEnLista) === String(solicitudId);
                });

                console.log('[Desconexion] encontrado:', encontrado);

                if (encontrado) {
                    const numMedidor = encontrado.Numero_Medidor ?? encontrado.numero_medidor ?? encontrado.NumeroMedidor ?? encontrado.Medidor?.Numero_Medidor ?? encontrado.medidor?.Numero_Medidor;
                    const idMedidor = encontrado.Id_Medidor ?? encontrado.id_medidor ?? encontrado.Medidor?.Id_Medidor;
                    setMedidorDesconexion(numMedidor != null ? { Id_Medidor: idMedidor, Numero_Medidor: numMedidor } : null);
                } else {
                    setMedidorDesconexion(null);
                }
            } catch (err) {
                console.error('[Desconexion] Error al obtener medidor:', err);
                if (!cancelled) setMedidorDesconexion(null);
            }
        })();

        return () => { cancelled = true; };
    }, [isOpen, tipoSolicitudNormalizado, esEntidadJuridica, datosSolicitudRaw?.Id_Solicitud]);

    useEffect(() => {
        if (!isOpen) return;

        if (!requiereInfoAfiliado) {
            setAfiliadoInfo(null);
            setLoadingAfiliadoInfo(false);
            setErrorAfiliadoInfo(null);
            return;
        }

        if (!identificacionConsulta) {
            setAfiliadoInfo(null);
            setLoadingAfiliadoInfo(false);
            setErrorAfiliadoInfo('No se encontró la identificación para cargar los datos del afiliado.');
            return;
        }

        let cancelled = false;
        setLoadingAfiliadoInfo(true);
        setErrorAfiliadoInfo(null);

        (async () => {
            try {
                if (esEntidadJuridica) {
                    const data = await getAfiliadoJuridicoByIdentificacion(identificacionConsulta);
                    if (cancelled) return;
                    setAfiliadoInfo({ tipoEntidad: 2, data });
                } else {
                    const data = await getAfiliadoFisicoByIdentificacion(identificacionConsulta);
                    if (cancelled) return;
                    setAfiliadoInfo({ tipoEntidad: 1, data });
                }
            } catch (error) {
                if (cancelled) return;
                console.error('Error cargando info del afiliado:', error);
                setAfiliadoInfo(null);
                setErrorAfiliadoInfo('No se pudo cargar la información del afiliado.');
            } finally {
                if (cancelled) return;
                setLoadingAfiliadoInfo(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isOpen, requiereInfoAfiliado, esEntidadJuridica, identificacionConsulta]);

    // Extraer información básica de la solicitud
    const getSolicitudInfo = () => {
        if (solicitud.tipo === 'solicitud-fisica') {
            const datos = solicitud.datos as any;
            const numeroMedidorRaw = numeroMedidorAsignado ?? datos.Numero_Medidor_Actual ?? datos.Numero_Medidor ?? datos.Medidor?.Numero_Medidor ?? null;

            let solicitudId = datos.Id_Solicitud || datos.id || datos.Id || datos.ID || datos.solicitudId;

            if (!solicitudId) {
                solicitudId = datos.Identificacion || datos.Cedula || `temp-${Date.now()}`;
            }

            const tipoEntidad = datos.Tipo_Entidad;
            const tipoPersonaReal = tipoEntidad === 1 ? 'Física' : 'Jurídica';

            return {
                id: solicitudId,
                nombre: `${datos.Nombre || ''} ${datos.Apellido1 || ''} ${datos.Apellido2 || ''}`.trim() || 'Sin nombre',
                documento: datos.Identificacion || datos.Cedula || 'Sin identificación',
                tipo: tipoPersonaReal,
                tipoSolicitud: solicitud.tipoSolicitud || datos.Tipo_Solicitud || 'Sin tipo',
                estado: datos.Estado?.Nombre_Estado || 'Sin estado',
                estadoId: datos.Estado?.Id_Estado_Solicitud || 0,
                Nombre: datos.Nombre || 'No especificado',
                Apellido1: datos.Apellido1 || 'No especificado',
                Apellido2: datos.Apellido2 || 'No especificado',
                Tipo_Identificacion: datos.Tipo_Identificacion || 'No especificado',
                Identificacion: datos.Identificacion || datos.Cedula || 'Sin identificación',
                Numero_Telefono: datos.Numero_Telefono || 'No especificado',
                Correo: datos.Correo || 'No especificado',
                Direccion_Exacta: datos.Direccion_Exacta || 'No especificada',
                Edad: datos.Edad || 'No especificada',
                Motivo_Solicitud: datos.Motivo_Solicitud || 'No especificado',
                Certificacion_Literal: datos.Certificacion_Literal || 'No proporcionada',
                Planos_Terreno: datos.Planos_Terreno || 'No proporcionados',
                Escrituras_Terreno: datos.Escrituras_Terreno || 'No proporcionadas',
                Numero_Medidor_Actual: numeroMedidorRaw != null ? String(numeroMedidorRaw) : (datos.Numero_Medidor_Actual || 'No especificado'),
                Numero_Medidor: datos.Numero_Medidor ?? null,
                Id_Medidor: datos.Id_Medidor ?? null,
            };
        } else {
            const datos = solicitud.datos as any;
            const numeroMedidorRaw = numeroMedidorAsignado ?? datos.Numero_Medidor_Actual ?? datos.Numero_Medidor ?? datos.Medidor?.Numero_Medidor ?? null;

            let solicitudId = datos.Id_Solicitud || datos.id || datos.Id || datos.ID || datos.solicitudId;

            if (!solicitudId) {
                solicitudId = datos.Cedula_Juridica || `temp-${Date.now()}`;
            }

            const tipoEntidad = datos.Tipo_Entidad;
            const tipoPersonaReal = tipoEntidad === 1 ? 'Física' : 'Jurídica';

            return {
                id: solicitudId,
                nombre: datos.Razon_Social || 'Sin razón social',
                documento: datos.Cedula_Juridica || 'Sin cédula jurídica',
                tipo: tipoPersonaReal,
                tipoSolicitud: solicitud.tipoSolicitud || datos.Tipo_Solicitud || 'Sin tipo',
                estado: datos.Estado?.Nombre_Estado || 'Sin estado',
                estadoId: datos.Estado?.Id_Estado_Solicitud || 0,
                Razon_Social: datos.Razon_Social || 'Sin razón social',
                Cedula_Juridica: datos.Cedula_Juridica || 'Sin cédula jurídica',
                Numero_Telefono: datos.Numero_Telefono || 'No especificado',
                Correo: datos.Correo || datos.Email || 'No especificado',
                Direccion_Exacta: datos.Direccion_Exacta || 'No especificada',
                Representante_Legal: datos.Representante_Legal || 'No especificado',
                Cedula_Representante: datos.Cedula_Representante || 'No especificada',
                Fecha_Creacion: datos.Fecha_Creacion || datos.Created_At || 'No especificada',
                Motivo_Solicitud: datos.Motivo_Solicitud || 'No especificado',
                Certificacion_Literal: datos.Certificacion_Literal || 'No proporcionada',
                Planos_Terreno: datos.Planos_Terreno || 'No proporcionados',
                Escrituras_Terreno: datos.Escrituras_Terreno || 'No proporcionadas',
                Numero_Medidor_Actual: numeroMedidorRaw != null ? String(numeroMedidorRaw) : (datos.Numero_Medidor_Actual || 'No especificado'),
                Numero_Medidor: datos.Numero_Medidor ?? null,
                Id_Medidor: datos.Id_Medidor ?? null,
            };
        }
    };

    const info = getSolicitudInfo();
    const esAgregarMedidor = info.tipoSolicitud === 'Agregar Medidor';

    const nombreSolicitanteMostrado = (() => {
        if (!requiereInfoAfiliado) return info.nombre;
        if (loadingAfiliadoInfo) return 'Cargando…';
        if (!afiliadoInfo) return info.nombre;
        if (afiliadoInfo.tipoEntidad === 2) return afiliadoInfo.data.Razon_Social || info.nombre;

        const nombre = `${afiliadoInfo.data.Nombre || ''} ${afiliadoInfo.data.Apellido1 || ''} ${afiliadoInfo.data.Apellido2 || ''}`.trim();
        return nombre || info.nombre;
    })();

    const tipoIdentificacionMostrado = (() => {
        if (!requiereInfoAfiliado) return info.Tipo_Identificacion;
        if (loadingAfiliadoInfo) return 'Cargando…';
        if (afiliadoInfo?.tipoEntidad === 1) return afiliadoInfo.data.Tipo_Identificacion || info.Tipo_Identificacion;
        return info.Tipo_Identificacion;
    })();

    const telefonoMostrado = (() => {
        if (!requiereInfoAfiliado) return info.Numero_Telefono;
        if (loadingAfiliadoInfo) return 'Cargando…';
        return afiliadoInfo?.data?.Numero_Telefono || info.Numero_Telefono;
    })();

    const correoMostrado = (() => {
        if (!requiereInfoAfiliado) return info.Correo;
        if (loadingAfiliadoInfo) return 'Cargando…';
        return afiliadoInfo?.data?.Correo || info.Correo;
    })();

    const direccionMostrada = (() => {
        if (!requiereInfoAfiliado) return info.Direccion_Exacta;
        if (loadingAfiliadoInfo) return 'Cargando…';
        return afiliadoInfo?.data?.Direccion_Exacta || info.Direccion_Exacta;
    })();

    // Estado local para reflejar el estado de la solicitud tras marcar en revisión
    const [estadoIdLocal, setEstadoIdLocal] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            setEstadoIdLocal(info.estadoId);
        }
    }, [isOpen, info.estadoId]);

    // Handler para marcar en revisión manualmente
    const handleMarcarEnRevision = async () => {
        try {
            const tipoSolicitud: TipoSolicitud = mapearTipoSolicitud(info.tipoSolicitud);
            const tipoPersona: TipoPersona = mapearTipoPersona(info.tipo);
            await marcarEnRevisionMutation.mutateAsync(tipoSolicitud, tipoPersona, info.id);
            setEstadoIdLocal(2); // Cambia a En Revisión localmente
            onClose(); // Cierra el modal automáticamente
        } catch (error) {
            // Manejo de error opcional
        }
    };

    // Resetear el número de medidor asignado cuando el modal se abre (para traer datos frescos del backend)
    useEffect(() => {
        if (isOpen) {
            setNumeroMedidorAsignado(null);
        }
    }, [isOpen]);

    // Función para manejar aprobación por casos usando hooks unificados
    const handleCambiarEstado = async () => {
        const estadoActual = info.estadoId;

        // Si aún viene como estado 1 en el objeto local, garantizar transición 1 -> 2 antes de aprobar.
        // Esto evita que el botón no haga nada cuando el backend ya avanzó o está por avanzar a En Revisión.
        if (estadoActual === 1) {
            try {
                const tipoSolicitud: TipoSolicitud = mapearTipoSolicitud(info.tipoSolicitud);
                const tipoPersona: TipoPersona = mapearTipoPersona(info.tipo);

                await marcarEnRevisionMutation.mutateAsync(tipoSolicitud, tipoPersona, info.id);
            } catch (error) {
                console.error('Error al mover solicitud a En Revisión antes de aprobar:', error);
                return;
            }

            await handleConfirmAprobar();
            return;
        }

        // Estado 2 (En Revisión) → Flujo condicional por tipo de solicitud
        if (estadoActual === 2) {
            const esCambioMedidor = mapearTipoSolicitud(info.tipoSolicitud) === 'cambio-medidor';
            const esAgregarMedidorSolicitud = mapearTipoSolicitud(info.tipoSolicitud) === 'agregar-medidor';
            const esAfiliacionSolicitud = mapearTipoSolicitud(info.tipoSolicitud) === 'afiliacion';

            if (esAgregarMedidorSolicitud || esAfiliacionSolicitud) {
                setMontoPago('');
                setShowDialogMontoAgregarMedidor(true);
                return;
            }

            if (!esCambioMedidor) {
                setShowAprobarDialog(true);
                return;
            }

            setMontoPago('');
            setMotivoCambio('');
            setShowDialogMedidorDanado(true);
            return;
        }

        if (estadoActual === 3) {
            const tipoSolicitud = mapearTipoSolicitud(info.tipoSolicitud);
            const requiereAsignacionMedidor =
                tipoSolicitud === 'afiliacion' ||
                tipoSolicitud === 'cambio-medidor' ||
                tipoSolicitud === 'agregar-medidor';

            if (!requiereAsignacionMedidor) {
                setShowCompletarDialog(true);
                return;
            }

            setShowModalMedidor(true);
            return;
        }

        if (estadoActual === 4) {
            showWarning('Solicitud completada', 'Esta solicitud ya está completada');
        }
    };

    // Nueva función para aprobar después de asignar el medidor usando hooks unificados
    const aprobarSolicitudDespuesDeAsignar = async (estadoPago: 'Pagado' | 'Pendiente') => {
        try {
            const tipoSolicitudInterno: TipoSolicitud = mapearTipoSolicitud(solicitud.tipoSolicitud || info.tipoSolicitud);
            const tipoPersonaInterno: TipoPersona = mapearTipoPersona(info.tipo);

            if (info.tipoSolicitud === 'Cambio de Medidor' && info.Id_Medidor) {
                try {
                    await updateEstadoMedidor(info.Id_Medidor, 3);
                } catch (medidorError) {
                    console.error('Error al marcar medidor como averiado:', medidorError);

                }
            }

            await completarMutation.mutateAsync(tipoSolicitudInterno, tipoPersonaInterno, info.id, estadoPago);

            onClose(); // Cerrar modal principal después de aprobar
        } catch (error) {
            console.error(' Error al completar solicitud:', error);
        }
    };

    // Función para manejar si el medidor fue dañado
    const handleMedidorDanado = (danado: boolean) => {
        if (danado) {
            // Si fue dañado, mostrar dialog para pedir monto y motivo
            setShowDialogMedidorDanado(false);
            setShowDialogMontoCambio(true);
        } else {
            // Si no fue dañado, proceder sin pago
            setShowDialogMedidorDanado(false);
            handleConfirmAprobar(false);
        }
    };

    // Función para confirmar monto y motivo del cambio
    const handleConfirmMontoCambio = async () => {
        // Validar que ambos campos estén completos
        if (!montoPago || String(montoPago).trim() === '') {
            showError('Campo requerido', 'Por favor ingresa el monto del cambio');
            return;
        }

        const montoTexto = String(montoPago).trim();
        if (!/^[1-9][0-9]{0,5}$/.test(montoTexto)) {
            showError('Monto inválido', 'El monto debe tener entre 1 y 6 dígitos y no puede iniciar con 0');
            return;
        }

        if (!motivoCambio || motivoCambio.trim() === '') {
            showError('Campo requerido', 'Por favor ingresa el motivo del cambio');
            return;
        }

        // Validar que el monto sea un número válido
        const montoNumerico = Number.parseFloat(String(montoPago));
        if (Number.isNaN(montoNumerico) || montoNumerico <= 0) {
            showError('Monto inválido', 'Por favor ingresa un monto válido mayor a 0');
            return;
        }

        // Cerrar el dialog y proceder con la aprobación con pago
        setShowDialogMontoCambio(false);
        await handleConfirmAprobar(true, montoNumerico, motivoCambio.trim());
    };

    // Función para confirmar monto en solicitudes de agregar medidor (sin motivo)
    const handleConfirmMontoAgregarMedidor = async () => {
        if (!montoPago || String(montoPago).trim() === '') {
            showError('Campo requerido', 'Por favor ingresa el monto a pagar');
            return;
        }

        const montoTexto = String(montoPago).trim();
        if (!/^[1-9][0-9]{0,5}$/.test(montoTexto)) {
            showError('Monto inválido', 'El monto debe tener entre 1 y 6 dígitos y no puede iniciar con 0');
            return;
        }

        const montoNumerico = Number.parseFloat(String(montoPago));
        if (Number.isNaN(montoNumerico) || montoNumerico <= 0) {
            showError('Monto inválido', 'Por favor ingresa un monto válido mayor a 0');
            return;
        }

        setShowDialogMontoAgregarMedidor(false);
        await handleConfirmAprobar(true, montoNumerico);
    };

    // Función para manejar rechazo usando hooks unificados
    const handleRechazar = async () => {
        setShowRechazarDialog(true);
    };

    // Confirmar aprobación y poner en espera (para solicitudes con medidor)
    const handleConfirmAprobar = async (ocupaPago?: boolean, montoCambio?: number, motivoCobro?: string) => {
        const tipoSolicitud: TipoSolicitud = mapearTipoSolicitud(info.tipoSolicitud);
        const tipoPersona: TipoPersona = mapearTipoPersona(info.tipo);
        const requierePayloadPago = tipoSolicitud === 'afiliacion' || tipoSolicitud === 'agregar-medidor' || tipoSolicitud === 'cambio-medidor';
        const data = requierePayloadPago
            ? {
                ocupaPago: Boolean(ocupaPago),
                montoCambio: ocupaPago ? montoCambio : undefined,
                motivoCobro: ocupaPago ? motivoCobro : undefined
            }
            : undefined;
        try {
            await aprobarYEnEsperaMutation.mutateAsync(tipoSolicitud, tipoPersona, info.id, data);
            setShowAprobarDialog(false);
            setMontoPago('');
            setMotivoCambio('');
            onClose();
        } catch (error) {
            console.error('Error al marcar en aprobada y en espera:', error);
            setShowAprobarDialog(false);
        }
    };

    // Confirmar completar (para solicitudes sin medidor)
    const handleConfirmCompletar = async () => {
        const tipoSolicitud: TipoSolicitud = mapearTipoSolicitud(info.tipoSolicitud);
        const tipoPersona: TipoPersona = mapearTipoPersona(info.tipo);

        try {

            await completarMutation.mutateAsync(tipoSolicitud, tipoPersona, info.id);
            setShowCompletarDialog(false);
            onClose();
        } catch (error) {
            console.error('Error al completar solicitud:', error);
            setShowCompletarDialog(false);
        }
    };

    // Confirmar rechazo
    const handleConfirmRechazar = async () => {
        try {
            // Mapear los tipos a los valores internos
            const tipoSolicitudInterno: TipoSolicitud = mapearTipoSolicitud(solicitud.tipoSolicitud || info.tipoSolicitud);
            const tipoPersonaInterno: TipoPersona = mapearTipoPersona(info.tipo);

            // Usar el hook unificado para rechazar (Cualquier estado → 5) con el motivo
            await rechazarMutation.mutateAsync(tipoSolicitudInterno, tipoPersonaInterno, info.id, motivoRechazo.trim());

            setMotivoRechazo(''); // Limpiar motivo después de usarlo
            setShowRechazarDialog(false);
            onClose(); // Cerrar modal después del éxito
        } catch (error) {
            console.error(' Error al rechazar:', error);
            setShowRechazarDialog(false);
        }
    };


    const isLoading =
        marcarEnRevisionMutation.isPending ||
        aprobarYEnEsperaMutation.isPending ||
        completarMutation.isPending ||
        rechazarMutation.isPending;

    // Solo deshabilitar el cierre durante operaciones críticas (no durante la carga inicial)
    const canClose = !aprobarYEnEsperaMutation.isPending &&
        !completarMutation.isPending &&
        !rechazarMutation.isPending;

    if (!isOpen) return null;

    return (

        <div className="fixed inset-0 backdrop-blur bg-opacity-10 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-semibold text-gray-900">Gestionar Solicitud</h1>
                        <button
                            onClick={onClose}
                            disabled={!canClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                </div>

                {/* Contenido */}
                <div className="p-4">
                    {/* Header Card de la Solicitud */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-lg mb-6 shadow-md">
                        <div className="flex items-center gap-4">
                            <div className="size-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                                <User className="size-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-blue-100 text-sm mb-1">{info.tipoSolicitud}</p>
                            </div>
                            <div>
                                <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium shadow-sm ${info.estado === 'Pendiente' ? 'bg-white text-orange-600 border border-orange-300' :
                                    info.estado === 'Aprobada' ? 'bg-green-100 text-green-800 border border-green-300' :
                                        info.estado === 'Rechazada' ? 'bg-red-100 text-red-800 border border-red-300' :
                                            'bg-gray-100 text-gray-800 border border-gray-300'
                                    }`}>
                                    {info.estado}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">

                        {/* Información del Solicitante */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-semibold text-white">Información del Solicitante</h3>
                                </div>
                            </div>

                            <div className="p-4">
                                {requiereInfoAfiliado && (
                                    <div className="mb-4">
                                        {loadingAfiliadoInfo && (
                                            <p className="text-sm text-gray-600">Cargando información del afiliado...</p>
                                        )}
                                        {errorAfiliadoInfo && (
                                            <p className="text-sm text-red-600">{errorAfiliadoInfo}</p>
                                        )}
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Columna izquierda */}
                                    <div className="space-y-3">
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                                                Nombre Completo
                                            </label>
                                            <p className="text-sm font-medium text-gray-900">{nombreSolicitanteMostrado}</p>
                                        </div>

                                        {/* Mostrar tipo de identificación solo para personas físicas */}
                                        {info.tipo === 'Física' && info.Tipo_Identificacion && (
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                                                    Tipo de Identificación
                                                </label>
                                                <p className="text-sm text-gray-900">{tipoIdentificacionMostrado}</p>
                                            </div>
                                        )}

                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                                                {info.tipo === 'Física' ? 'Identificación' : 'Cédula Jurídica'}
                                            </label>
                                            <p className="text-sm text-gray-900">{info.documento}</p>
                                        </div>

                                        {/* Mostrar edad solo para personas físicas */}
                                        {info.tipo === 'Física' && info.Edad && info.Edad !== 'No especificada' && (
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                                                    Edad
                                                </label>
                                                <p className="text-sm text-gray-900">{info.Edad} años</p>
                                            </div>
                                        )}

                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                                                Tipo de Persona
                                            </label>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${info.tipo === 'Física'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-purple-100 text-purple-800'
                                                }`}>
                                                {info.tipo === 'Física' ? 'Persona Física' : 'Persona Jurídica'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Columna derecha */}
                                    <div className="space-y-3">
                                        {info.Numero_Telefono && (
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                                                    Teléfono
                                                </label>
                                                <p className="text-sm text-gray-900">{telefonoMostrado}</p>
                                            </div>
                                        )}

                                        {info.Correo && (
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                                                    Correo Electrónico
                                                </label>
                                                <p className="text-sm text-gray-900 break-all">{correoMostrado}</p>
                                            </div>
                                        )}

                                        {info.Direccion_Exacta && (
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                                                    Dirección
                                                </label>
                                                <p className="text-sm text-gray-900">{direccionMostrada}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detalles de la Solicitud */}
                        {(info.Numero_Medidor_Actual || info.Numero_Medidor != null || (!esAgregarMedidor && info.Motivo_Solicitud)) && (
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-white">Detalles de la Solicitud</h3>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <div className="grid grid-cols-1 gap-3">

                                        {/* Número de medidor seleccionado por el usuario (sólo Cambio de Medidor) */}
                                        {info.tipoSolicitud === 'Cambio de Medidor' && info.Numero_Medidor != null && (
                                            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                                                <label className="block text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">
                                                    Número de Medidor Seleccionado
                                                </label>
                                                <p className="text-base font-bold text-blue-900">{info.Numero_Medidor}</p>
                                            </div>
                                        )}

                                        {/* Número de medidor a desconectar */}
                                        {info.tipoSolicitud === 'Desconexion' && medidorDesconexion && (
                                            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                                                <label className="block text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">
                                                    Medidor a Desconectar
                                                </label>
                                                <p className="text-base font-bold text-blue-900">{medidorDesconexion.Numero_Medidor}</p>
                                            </div>
                                        )}



                                        {!esAgregarMedidor && info.Motivo_Solicitud && info.Motivo_Solicitud !== 'No especificado' && (
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                                                    Motivo de la Solicitud
                                                </label>
                                                <p className="text-sm text-gray-900">{info.Motivo_Solicitud}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Documentos Adjuntos */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-semibold text-white">Documentos Adjuntos</h3>
                                </div>
                            </div>

                            <div className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                                    {info.tipoSolicitud !== 'Asociado' && (

                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                                                Certifcación Literal
                                            </label>
                                            {info.Certificacion_Literal && info.Certificacion_Literal !== 'No proporcionada' ? (
                                                <a href={info.Certificacion_Literal} target="_blank" rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:text-blue-800 underline font-medium">
                                                    Ver documento
                                                </a>
                                            ) : (
                                                <p className="text-sm text-gray-500">No proporcionada</p>
                                            )}
                                        </div>

                                    )

                                    }


                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                                            Planos del Terreno
                                        </label>
                                        {info.Planos_Terreno && info.Planos_Terreno !== 'No proporcionados' ? (
                                            <a href={info.Planos_Terreno} target="_blank" rel="noopener noreferrer"
                                                className="text-sm text-blue-600 hover:text-blue-800 underline font-medium">
                                                Ver documento
                                            </a>
                                        ) : (
                                            <p className="text-sm text-gray-500">No proporcionados</p>
                                        )}
                                    </div>

                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                                            Escrituras del Terreno
                                        </label>
                                        {info.Escrituras_Terreno && info.Escrituras_Terreno !== 'No proporcionadas' ? (
                                            <a href={info.Escrituras_Terreno} target="_blank" rel="noopener noreferrer"
                                                className="text-sm text-blue-600 hover:text-blue-800 underline font-medium">
                                                Ver documento
                                            </a>
                                        ) : (
                                            <p className="text-sm text-gray-500">No proporcionadas</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                </div>


                <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 sm:gap-3 p-3 sm:p-6 border-t bg-gray-50 z-10">
                    {/* Botón de acción para marcar en revisión */}
                    {estadoIdLocal === 1 && (
                        <button
                            onClick={handleMarcarEnRevision}
                            disabled={marcarEnRevisionMutation.isPending}
                            className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium"
                        >
                            {marcarEnRevisionMutation.isPending ? (
                                <>
                                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ENVIANDO...
                                </>
                            ) : (
                                <>
                                    <Check className="size-4" />
                                    Marcar en revisión
                                </>
                            )}
                        </button>
                    )}
                    {/* Botón de acción normal para el resto del flujo */}
                    {estadoIdLocal !== 1 && (
                        <button
                            onClick={handleCambiarEstado}
                            disabled={isLoading || info.estadoId === 4 || info.estadoId === 5}
                            className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium"
                        >
                            {isLoading ? (
                                <>
                                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Poner en espera...
                                </>
                            ) : (
                                <>
                                    <Check className="size-4" />
                                    {info.estadoId === 3
                                        ? ((() => {
                                            const tipoSolicitud = mapearTipoSolicitud(info.tipoSolicitud);
                                            const requiereAsignacionMedidor =
                                                tipoSolicitud === 'afiliacion' ||
                                                tipoSolicitud === 'cambio-medidor' ||
                                                tipoSolicitud === 'agregar-medidor';
                                            return requiereAsignacionMedidor ? 'Completar y asignar medidor' : 'Completar solicitud';
                                        })())
                                        : 'Poner en espera'}
                                </>
                            )}
                        </button>
                    )}

                    <button
                        onClick={handleRechazar}
                        disabled={isLoading || info.estadoId === 4 || info.estadoId === 5}
                        className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium"
                    >

                        <>
                            <XCircle className="size-4" />
                            Rechazar solicitud
                        </>

                    </button>

                    <button
                        onClick={onClose}
                        disabled={!canClose}
                        className="px-2.5 py-1.5 sm:px-4 sm:py-2 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all disabled:opacity-50 flex items-center text-xs sm:text-sm font-medium shadow-sm hover:shadow-md"
                    >
                        Cancelar
                    </button>

                </div>
            </div>

            {/* Modals fuera del contenedor principal para evitar conflictos de portales */}
            {showModalMedidor && (
                <ModalMedidor
                    isOpen={showModalMedidor}
                    onClose={() => {
                        setShowModalMedidor(false);
                    }}
                    onMedidorAsignado={aprobarSolicitudDespuesDeAsignar}
                    tipoSolicitud={solicitud.tipoSolicitud || (info.tipoSolicitud as any)}
                    solicitudId={info.id}
                    afiliado={{
                        tipo: solicitud.tipo,
                        datos: solicitud.datos
                    }}
                />
            )}

            {/* AlertDialog para aprobar y poner en espera */}
            <AlertDialog open={showAprobarDialog} onOpenChange={setShowAprobarDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Aprobar solicitud y poner en espera?</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Desea aprobar la solicitud de <strong>{info.nombre}</strong> y ponerla en espera?
                            <br /><br />
                            Esta acción cambiará el estado a "Aprobada en Espera" y permitirá la asignación del medidor.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex justify-between">
                        <AlertDialogAction
                            onClick={() => handleConfirmAprobar(false, 0, '')}
                            disabled={aprobarYEnEsperaMutation.isPending}
                        >
                            {aprobarYEnEsperaMutation.isPending ? 'Aprobando...' : 'Aprobar'}
                        </AlertDialogAction>
                        <AlertDialogCancel disabled={aprobarYEnEsperaMutation.isPending}>
                            Cancelar
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* AlertDialog para completar directamente (sin medidor) */}
            <AlertDialog open={showCompletarDialog} onOpenChange={setShowCompletarDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Completar solicitud?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div>
                                <span>¿Desea completar la solicitud de <strong>{info.nombre}</strong>?</span>
                                {info.tipoSolicitud === 'Desconexion' && medidorDesconexion && (
                                    <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-3">
                                        <p className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">Medidor a Desconectar</p>
                                        <p className="text-base font-bold text-orange-900">{medidorDesconexion.Numero_Medidor}</p>
                                    </div>
                                )}
                                <p className="mt-3 text-sm">
                                    Esta solicitud no requiere asignación de medidor y será marcada como completada directamente.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex justify-between">
                        <AlertDialogAction
                            onClick={handleConfirmCompletar}
                            disabled={completarMutation.isPending}
                        >
                            {completarMutation.isPending ? 'Completando...' : 'Completar'}
                        </AlertDialogAction>
                        <AlertDialogCancel disabled={completarMutation.isPending}>
                            Cancelar
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* AlertDialog para rechazar */}
            <AlertDialog open={showRechazarDialog} onOpenChange={setShowRechazarDialog}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600">
                            Rechazar Solicitud
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600 mt-2">
                            Por favor, indique el motivo del rechazo de la solicitud. Este será enviado al solicitante por correo.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {/* Campo de Motivo */}
                    <div className="space-y-3 my-4">
                        <label className="block text-sm font-semibold text-gray-700">
                            Motivo del Rechazo *
                        </label>
                        <textarea
                            placeholder="Describe el motivo del rechazo (mínimo 10 caracteres)..."
                            value={motivoRechazo}
                            onChange={(e) => setMotivoRechazo(e.target.value)}
                            className="w-full min-h-24 resize-none border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>
                                {motivoRechazo.length} / 500 caracteres
                            </span>
                            {motivoRechazo.length < 10 && motivoRechazo.length > 0 && (
                                <span className="text-red-500">
                                    Mínimo 10 caracteres requeridos
                                </span>
                            )}
                        </div>
                    </div>

                    <AlertDialogFooter className="flex justify-between">
                        <AlertDialogAction
                            onClick={() => handleConfirmRechazar()}
                            disabled={motivoRechazo.trim().length < 10 || rechazarMutation.isPending}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400"
                        >
                            {rechazarMutation.isPending ? 'Rechazando...' : 'Confirmar Rechazo'}
                        </AlertDialogAction>
                        <AlertDialogCancel
                            onClick={() => {
                                setMotivoRechazo('');
                                setShowRechazarDialog(false);
                            }}
                            disabled={rechazarMutation.isPending}
                        >
                            Cancelar
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* AlertDialog para preguntar si el medidor fue dañado */}
            <AlertDialog open={showDialogMedidorDanado} onOpenChange={setShowDialogMedidorDanado}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Fue dañado el medidor?</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿El medidor de <strong>{info.nombre}</strong> fue dañado o presenta problemas que requieran su cambio?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex justify-between">
                        <AlertDialogAction
                            onClick={() => handleMedidorDanado(true)}
                            className="bg-blue-600 hover:bg-blue-700 hover:shadow-lg transition-all"
                        >
                            Sí, fue dañado
                        </AlertDialogAction>
                        <AlertDialogCancel
                            onClick={() => {
                                setShowDialogMedidorDanado(false);
                                handleMedidorDanado(false);
                            }}
                        >
                            No, está bien
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* AlertDialog para solicitar monto y motivo del cambio */}
            <AlertDialog open={showDialogMontoCambio} onOpenChange={setShowDialogMontoCambio}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Detalles del cambio de medidor</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ingresa el monto a cobrar por el cambio y el motivo del daño.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-4 my-4">
                        {/* Campo de Monto */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Monto del cambio *
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Ej: 50000"
                                value={montoPago}
                                onChange={(e) => handleMontoChange(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                maxLength={6}
                            />
                        </div>

                        {/* Campo de Motivo */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Motivo del daño *
                            </label>
                            <textarea
                                placeholder="Describe el motivo por el que el medidor fue dañado..."
                                value={motivoCambio}
                                onChange={(e) => setMotivoCambio(e.target.value)}
                                className="w-full min-h-20 resize-none border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                maxLength={100}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {motivoCambio.length} caracteres / 100
                            </p>
                        </div>
                    </div>

                    <AlertDialogFooter className="flex justify-between">
                        <AlertDialogAction
                            onClick={handleConfirmMontoCambio}
                            disabled={!montoPago || !motivoCambio.trim() || aprobarYEnEsperaMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {aprobarYEnEsperaMutation.isPending ? 'Procesando…' : 'Confirmar'}
                        </AlertDialogAction>
                        <AlertDialogCancel
                            onClick={() => {
                                setShowDialogMontoCambio(false);
                                setMontoPago('');
                                setMotivoCambio('');
                            }}
                        >
                            Cancelar
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* AlertDialog para solicitar monto en Agregar Medidor */}
            <AlertDialog open={showDialogMontoAgregarMedidor} onOpenChange={setShowDialogMontoAgregarMedidor}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {mapearTipoSolicitud(info.tipoSolicitud) === 'afiliacion'
                                ? 'Monto para Solicitud de Afiliación'
                                : 'Monto para Agregar Medidor'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Ingresa el monto exacto a pagar para enviar el correo al solicitante y poner la solicitud en espera.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-4 my-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Monto a pagar *
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Ej: 50000"
                                value={montoPago}
                                onChange={(e) => handleMontoChange(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                maxLength={6}
                            />
                        </div>
                    </div>

                    <AlertDialogFooter className="flex justify-between">
                        <AlertDialogAction
                            onClick={handleConfirmMontoAgregarMedidor}
                            disabled={!montoPago || aprobarYEnEsperaMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {aprobarYEnEsperaMutation.isPending ? 'Procesando…' : 'Confirmar'}
                        </AlertDialogAction>
                        <AlertDialogCancel
                            onClick={() => {
                                setShowDialogMontoAgregarMedidor(false);
                                setMontoPago('');
                            }}
                        >
                            Cancelar
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>

    );
};

export default ModalSolicitud;