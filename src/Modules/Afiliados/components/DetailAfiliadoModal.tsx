import { LuX, LuUser, LuMail, LuPhone, LuMapPin, LuCalendar, LuBuilding, LuFileText, LuMap, LuInfo, LuGauge } from 'react-icons/lu';
import { useState, useEffect, useRef } from 'react';
import { formatCedulaJuridica } from '../Helper/formatUtils';
import type { AfiliadoFisico, Medidor } from '../Models/TablaAfiliados/ModeloAfiliadoFisico';
import type { AfiliadoJuridico } from '../Models/TablaAfiliados/ModeloAfiliadoJuridico';
import {
    getAfiliadoFisicoDetail,
    getMedidoresByAfiliado,
    getMedidoresByAfiliadoJuridico,
} from '../Service/ServiceAfiliadoFisico';
import { getAfiliadoJuridicoDetail } from '../Service/ServiceAfiliadoJuridico';
import { useAfiliadosFisicos } from '../Hook/HookAfiliadoFisico';
import { useAfiliadosJuridicos } from '../Hook/HookAfiliadoJuridico';
import { useAlerts } from '@/Modules/Global/context/AlertContext';


// Tipo unificado para identificar qué estamos viendo
type PersonaParaDetalle = {
    tipo: 'afiliado-fisico' | 'afiliado-juridico';
    datos: AfiliadoFisico | AfiliadoJuridico;
};

interface DetailAbonadosProps {
    persona: PersonaParaDetalle;
    isOpen: boolean;
    onClose: () => void;
}

const DetailAbonados: React.FC<DetailAbonadosProps> = ({ persona, isOpen, onClose }) => {

    const [medidores, setMedidores] = useState<Medidor[]>([]);
    const [loadingMedidores, setLoadingMedidores] = useState(false);
    const [detallePersona, setDetallePersona] = useState<AfiliadoFisico | AfiliadoJuridico | null>(null);
    const [loadingDetalle, setLoadingDetalle] = useState(false);
    const [showCambioTipoModal, setShowCambioTipoModal] = useState(false);
    const [planosTerreno, setPlanosTerreno] = useState<File | null>(null);
    const [escriturasTerreno, setEscriturasTerreno] = useState<File | null>(null);
    const planosInputRef = useRef<HTMLInputElement | null>(null);
    const escriturasInputRef = useRef<HTMLInputElement | null>(null);
    const { showSuccess, showError, showWarning } = useAlerts();
    const { updateTipoAfiliadoFisico } = useAfiliadosFisicos();
    const { updateTipoAfiliadoJuridico } = useAfiliadosJuridicos();

    // Cada vez que se abre el modal, cargar los medidores frescos desde el endpoint
    useEffect(() => {
        if (!isOpen) return;
        const idAfiliado = (persona.datos as AfiliadoFisico | AfiliadoJuridico).Id_Afiliado;

        // Primero mostrar los medidores que ya vienen embebidos en los datos del listado
        const mediadoresEmbebidos =
            (persona.datos as AfiliadoFisico).Medidores ??
            (persona.datos as AfiliadoFisico).medidores ??
            [];
        setMedidores(mediadoresEmbebidos);

        // Luego hacer el fetch fresco para tener todos los medidores actualizados
        setLoadingMedidores(true);
        const fetchFn = persona.tipo === 'afiliado-juridico'
            ? getMedidoresByAfiliadoJuridico
            : getMedidoresByAfiliado;
        fetchFn(idAfiliado)
            .then((data) => {
                // Siempre usar el resultado fresco del endpoint
                setMedidores(data);
            })
            .catch(() => {
                // Silencioso — ya mostramos los embebidos como fallback
            })
            .finally(() => setLoadingMedidores(false));
    }, [isOpen, persona]);

    useEffect(() => {
        if (!isOpen) return;

        const idAfiliado = (persona.datos as AfiliadoFisico | AfiliadoJuridico).Id_Afiliado;
        setLoadingDetalle(true);

        const fetchDetalle = persona.tipo === 'afiliado-juridico'
            ? getAfiliadoJuridicoDetail
            : getAfiliadoFisicoDetail;

        fetchDetalle(idAfiliado)
            .then((detalle) => setDetallePersona(detalle))
            .catch(() => setDetallePersona(null))
            .finally(() => setLoadingDetalle(false));
    }, [isOpen, persona]);

    const getPersonaInfo = () => {
        const { tipo } = persona;
        const datos = (detallePersona ?? persona.datos) as AfiliadoFisico | AfiliadoJuridico;

        if (tipo === 'afiliado-fisico') {
            const afiliado = datos as AfiliadoFisico;
            return {
                id: afiliado.Id_Afiliado,
                nombre: `${afiliado.Nombre} ${afiliado.Apellido1} ${afiliado.Apellido2?.includes('No Proporcionado') ? '' : afiliado.Apellido2 || ''}`.trim(),
                documento: afiliado.Identificacion,

                telefono: afiliado.Numero_Telefono,
                correo: afiliado.Correo,
                direccion: afiliado.Direccion_Exacta,
                estado: afiliado.Estado?.Nombre_Estado || 'Sin estado',
                estadoId: afiliado.Estado?.Id_Estado_Afiliado || 0,
                tipoPersona: 'Físico',
                tipoAfiliado: afiliado.Tipo_Afiliado?.Nombre_Tipo_Afiliado || 'Asociado',
                edad: afiliado.Edad,
                fechaCreacion: afiliado.Fecha_Creacion,
                fechaActualizacion: afiliado.Fecha_Actualizacion,
                certificacion: afiliado.Certificacion_Literal,
                planos: afiliado.Planos_Terreno,
                escrituras: afiliado.Escrituras_Terreno,
                motivo: null, // Campo no disponible en el modelo actual
                medidores // Cargados desde el endpoint por el useEffect
            };
        } else { // afiliado-juridico
            const afiliado = datos as AfiliadoJuridico;
            return {
                id: afiliado.Id_Afiliado,
                nombre: afiliado.Razon_Social,
                documento: formatCedulaJuridica(afiliado.Cedula_Juridica || ''),
                tipoDocumento: 'Cédula Jurídica',
                telefono: afiliado.Numero_Telefono,
                correo: afiliado.Correo,
                direccion: afiliado.Direccion_Exacta,
                estado: afiliado.Estado?.Nombre_Estado || 'Sin estado',
                estadoId: afiliado.Estado?.Id_Estado_Afiliado || 0,
                tipoPersona: 'Jurídico',
                tipoAfiliado: afiliado.Tipo_Afiliado?.Nombre_Tipo_Afiliado || 'Asociado',
                edad: null,
                fechaCreacion: afiliado.Fecha_Creacion,
                fechaActualizacion: afiliado.Fecha_Actualizacion,
                certificacion: afiliado.Certificacion_Literal,
                planos: afiliado.Planos_Terreno,
                escrituras: afiliado.Escrituras_Terreno,
                motivo: null, // Campo no disponible en el modelo actual
                medidores // Cargados desde el endpoint por el useEffect
            };
        }
    };

    const handleConfirmarCambioATipoAsociado = async () => {
        const idAfiliado = (detallePersona ?? persona.datos).Id_Afiliado;

        if (!planosTerreno || !escriturasTerreno) {
            showWarning(
                'Documentos obligatorios',
                'Para cambiar a asociado debe adjuntar Planos_Terreno y Escrituras_Terreno.'
            );
            return;
        }

        try {
            if (persona.tipo === 'afiliado-juridico') {
                await updateTipoAfiliadoJuridico.mutateAsync({
                    id: idAfiliado,
                    nuevoTipoId: 2,
                    archivos: {
                        Planos_Terreno: planosTerreno,
                        Escrituras_Terreno: escriturasTerreno,
                    },
                });
            } else {
                await updateTipoAfiliadoFisico.mutateAsync({
                    id: idAfiliado,
                    nuevoTipoId: 2,
                    archivos: {
                        Planos_Terreno: planosTerreno,
                        Escrituras_Terreno: escriturasTerreno,
                    },
                });
            }

            const fetchDetalle = persona.tipo === 'afiliado-juridico'
                ? getAfiliadoJuridicoDetail
                : getAfiliadoFisicoDetail;
            const detalleActualizado = await fetchDetalle(idAfiliado);
            setDetallePersona(detalleActualizado);

            setShowCambioTipoModal(false);
            setPlanosTerreno(null);
            setEscriturasTerreno(null);
            showSuccess('Tipo actualizado', 'El afiliado ahora es de tipo Asociado y se guardaron los documentos.');
        } catch (error: any) {
            const mensaje = error?.response?.data?.message || 'No se pudo cambiar el tipo de afiliado.';
            showError('Error al cambiar tipo', mensaje);
        }
    };

    const quitarPlanosTerreno = () => {
        setPlanosTerreno(null);
        if (planosInputRef.current) {
            planosInputRef.current.value = '';
        }
    };

    const quitarEscriturasTerreno = () => {
        setEscriturasTerreno(null);
        if (escriturasInputRef.current) {
            escriturasInputRef.current.value = '';
        }
    };

    const formatDate = (date: string | Date | null) => {
        if (!date) return 'No disponible';
        try {
            return new Date(date).toLocaleDateString('es-CR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Fecha inválida';
        }
    };

    const getStatusColor = (estadoId: number) => {
        // Colores según el estado
        switch (estadoId) {
            case 1: // Activo
                return 'bg-green-100 text-green-800 border-green-200';
            case 2: // Inactivo
                return 'bg-red-100 text-red-800 border-red-200';
            case 3: // Pendiente
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getTipoAfiliadoColor = (tipo: string) => {
        return tipo === 'Físico'
            ? 'bg-blue-100 text-blue-800 border-blue-200'
            : 'bg-blue-100 text-blue-800 border-blue-200';
    };

    const getEstadoTecnicoMedidorColor = (estado: string) => {
        const normalizado = estado.trim().toLowerCase();

        if (normalizado.includes('averiado')) {
            return 'bg-red-100 text-red-800 border-red-200';
        }

        if (normalizado.includes('instalado')) {
            return 'bg-green-100 text-green-800 border-green-200';
        }

        if (normalizado.includes('pendiente') || normalizado.includes('espera')) {
            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }

        return 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getEstadoPagoMedidorColor = (estado: string) => {
        const normalizado = estado.trim().toLowerCase();

        if (normalizado === 'pagado') {
            return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        }

        if (normalizado === 'pendiente') {
            return 'bg-amber-100 text-amber-800 border-amber-200';
        }

        if (normalizado === 'libre') {
            return 'bg-blue-100 text-blue-800 border-blue-200';
        }

        return 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getModalTitle = () => {
        switch (persona.tipo) {
            case 'afiliado-fisico':
                return ' Detalle del Afiliado Físico';
            case 'afiliado-juridico':
                return ' Detalle del Afiliado Jurídico';
            default:
                return 'Detalle';
        }
    };

    if (!isOpen) return null;

    const personaInfo = getPersonaInfo();
    const isAsociado = personaInfo.tipoAfiliado.toLowerCase().includes('asociado');
    const isActualizandoTipo = updateTipoAfiliadoFisico.isPending || updateTipoAfiliadoJuridico.isPending;

    return (
        <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-3xl flex flex-col overflow-hidden max-h-[90vh]">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                            {getModalTitle()}
                            {loadingDetalle && (
                                <span className="ml-1 inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            )}
                        </h1>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <LuX className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6 scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
                    
                    {/* Información Personal */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <LuUser className="w-4 h-4 text-blue-600" />
                                </div>
                                <h3 className="text-base font-bold text-gray-900">Información Personal</h3>
                            </div>
                        </div>

                        <div className="p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Nombre/Razón Social */}
                                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 md:col-span-2">
                                    <div className="p-2 rounded-lg">
                                        <LuUser className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-gray-500 uppercase">
                                            {personaInfo.tipoPersona === 'Físico' ? 'Nombre Completo' : 'Razón Social'}
                                        </p>
                                        <p className="text-base font-semibold text-gray-900 mt-1">
                                            {personaInfo.nombre}
                                        </p>
                                    </div>
                                </div>

                                {/* Documento */}
                                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="p-2 rounded-lg">
                                        <LuFileText className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-gray-500 uppercase">
                                            {personaInfo.tipoPersona === 'Físico' ? 'Identificación' : 'Cédula Jurídica'}
                                        </p>
                                        <p className="text-base font-semibold text-gray-900 mt-1">
                                            {personaInfo.documento}
                                        </p>
                                    </div>
                                </div>

                                {/* Edad (solo para físicos) */}
                                {personaInfo.edad && (
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="p-2 rounded-lg">
                                            <LuCalendar className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-medium text-gray-500 uppercase">
                                                Edad
                                            </p>
                                            <p className="text-base font-medium text-gray-900 mt-1">
                                                {personaInfo.edad} años
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Tipo de Persona */}
                                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="p-2 rounded-lg">
                                        <LuBuilding className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-gray-500 uppercase">
                                            Tipo de Persona
                                        </p>
                                        <p className="text-base font-medium text-gray-900 mt-1">
                                            {personaInfo.tipoPersona}
                                        </p>
                                    </div>
                                </div>

                                {/* Tipo de Afiliado */}
                                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="p-2 rounded-lg">
                                        <LuUser className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-gray-500 uppercase">
                                            Tipo de Afiliado
                                        </p>
                                        <span
                                            className={`inline-block px-3 py-1 rounded-full text-sm font-medium border mt-1 ${getTipoAfiliadoColor(personaInfo.tipoAfiliado)}`}
                                        >
                                            {personaInfo.tipoAfiliado}
                                        </span>
                                    </div>
                                </div>

                                {/* Certificación Literal */}
                                {personaInfo.certificacion && (
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="p-2 rounded-lg">
                                            <LuFileText className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-medium text-gray-500 uppercase">
                                                Certificación Literal
                                            </p>
                                            <a
                                                href={personaInfo.certificacion}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 font-medium underline mt-1 inline-block"
                                            >
                                                Ver documento
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {/* Planos del Terreno */}
                                {personaInfo.planos && (
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="p-2 rounded-lg">
                                            <LuMap className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-medium text-gray-500 uppercase">
                                                Planos del Terreno
                                            </p>
                                            <a
                                                href={personaInfo.planos}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 font-medium underline mt-1 inline-block"
                                            >
                                                Ver documento
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {personaInfo.escrituras && (
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="p-2 rounded-lg">
                                            <LuFileText className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-medium text-gray-500 uppercase">
                                                Escrituras del Terreno
                                            </p>
                                            <a
                                                href={personaInfo.escrituras}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 font-medium underline mt-1 inline-block"
                                            >
                                                Ver documento
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Medidores Asignados */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <LuGauge className="w-4 h-4 text-blue-600" />
                                </div>
                                <h3 className="text-base font-bold text-gray-900">
                                    Medidores Asignados
                                    {loadingMedidores && (
                                        <span className="ml-2 inline-block w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin align-middle" />
                                    )}
                                </h3>
                            </div>
                        </div>

                        <div className="p-5">
                            {personaInfo.medidores && personaInfo.medidores.length > 0 ? (
                                <div className="space-y-4">
                                    {personaInfo.medidores.map((medidor) => (
                                        <div
                                            key={medidor.Id_Medidor}
                                            className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <LuGauge className="w-5 h-5 text-blue-600" />
                                                    <h4 className="text-base font-bold text-gray-900">
                                                        Medidor #{medidor.Id_Medidor}
                                                    </h4>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-100">
                                                    <div className="p-2 rounded-lg">
                                                        <LuInfo className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-medium text-gray-500 uppercase">Número de Medidor</p>
                                                        <p className="text-base font-medium text-gray-900 mt-1">{medidor.Numero_Medidor}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-100">
                                                    <div className="p-2 rounded-lg">
                                                        <LuGauge className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-medium text-gray-500 uppercase">Estado Actual del medidor</p>
                                                        {(() => {
                                                            const estadoTecnico = medidor.Estado_Medidor?.Nombre_Estado_Medidor ?? 'Sin estado';
                                                            const estadoPago = typeof medidor.Estado_Pago === 'string'
                                                                ? medidor.Estado_Pago
                                                                : medidor.Estado_Pago?.Nombre_Estado_Pago ?? 'Libre';

                                                            return (
                                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                                    <span className={`inline-block px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium border ${getEstadoTecnicoMedidorColor(estadoTecnico)}`}>
                                                                        {estadoTecnico}
                                                                    </span>
                                                                    <span className={`inline-block px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium border ${getEstadoPagoMedidorColor(estadoPago)}`}>
                                                                        {estadoPago}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>

                                            {(medidor.Certificacion_Literal || medidor.Planos_Terreno || medidor.Escrituras_Terreno) && (
                                                <div className="mt-3 pt-3 border-t border-gray-200">
                                                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">Documentos del Terreno</p>
                                                    <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                                                        {medidor.Certificacion_Literal && (
                                                            <a
                                                                href={medidor.Certificacion_Literal}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex justify-center items-center gap-1.5 px-3 py-2 sm:py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 hover:bg-blue-100 transition-colors font-medium w-full sm:w-auto"
                                                            >
                                                                <LuFileText className="w-4 h-4" />
                                                                Ver Certificación
                                                            </a>
                                                        )}
                                                        {medidor.Planos_Terreno && (
                                                            <a
                                                                href={medidor.Planos_Terreno}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex justify-center items-center gap-1.5 px-3 py-2 sm:py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 hover:bg-blue-100 transition-colors font-medium w-full sm:w-auto"
                                                            >
                                                                <LuMap className="w-4 h-4" />
                                                                Ver Planos
                                                            </a>
                                                        )}
                                                        {medidor.Escrituras_Terreno && (
                                                            <a
                                                                href={medidor.Escrituras_Terreno}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex justify-center items-center gap-1.5 px-3 py-2 sm:py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 hover:bg-blue-100 transition-colors font-medium w-full sm:w-auto"
                                                            >
                                                                <LuFileText className="w-4 h-4" />
                                                                Ver Escrituras
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                    <LuGauge className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                    <p className="text-sm text-gray-500 font-medium">Sin medidores asignados</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <LuPhone className="w-4 h-4 text-blue-600" />
                                </div>
                                <h3 className="text-base font-bold text-gray-900">Información de Contacto</h3>
                            </div>
                        </div>

                        <div className="p-5">
                            <div className="grid grid-cols-1 gap-4">
                                {/* Dirección */}
                                {personaInfo.direccion && (
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 md:col-span-2">
                                        <div className="p-2 rounded-lg">
                                            <LuMapPin className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-500 uppercase">
                                                Dirección Exacta
                                            </p>
                                            <p className="text-base font-medium text-gray-900 mt-1 break-words">
                                                {personaInfo.direccion}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Correo */}
                                {personaInfo.correo && (
                                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 md:col-span-2">
                                    <div className="p-2 rounded-lg">
                                        <LuMail className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-gray-500 uppercase">
                                            Correo Electrónico
                                        </p>
                                        <p className="text-base font-medium text-gray-900 mt-1">
                                            {personaInfo.correo}
                                        </p>
                                    </div>
                                </div>
                                )}

                                {/* Teléfono */}
                                {personaInfo.telefono && (
                                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 md:col-span-2">
                                    <div className="p-2 rounded-lg">
                                        <LuPhone className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-gray-500 uppercase">
                                            Teléfono
                                        </p>
                                        <p className="text-base font-medium text-gray-900 mt-1">
                                            {personaInfo.telefono}
                                        </p>
                                    </div>
                                </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Información del Sistema */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <LuCalendar className="w-4 h-4 text-blue-600" />
                                </div>
                                <h3 className="text-base font-bold text-gray-900">Información del Sistema</h3>
                            </div>
                        </div>

                        <div className="p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Estado */}
                                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="p-2 rounded-lg">
                                        <LuInfo className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-gray-500 uppercase">
                                            Estado
                                        </p>
                                        <span
                                            className={`inline-block px-3 py-1 rounded-full text-sm font-medium border mt-1 ${getStatusColor(personaInfo.estadoId)}`}
                                        >
                                            {personaInfo.estado}
                                        </span>
                                    </div>
                                </div>

                                {/* Espacio vacío para alineación */}
                                <div></div>

                                {/* Fecha de Creación */}
                                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="p-2 rounded-lg">
                                        <LuCalendar className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-gray-500 uppercase">
                                            Fecha de Creación
                                        </p>
                                        <p className="text-base font-medium text-gray-900 mt-1">
                                            {formatDate(personaInfo.fechaCreacion)}
                                        </p>
                                    </div>
                                </div>

                                {/* Fecha de Actualización */}
                                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="p-2 rounded-lg">
                                        <LuCalendar className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-gray-500 uppercase">
                                            Última Actualización
                                        </p>
                                        <p className="text-base font-medium text-gray-900 mt-1">
                                            {formatDate(personaInfo.fechaActualizacion)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Action Buttons */}
                <div className="sticky bottom-0 flex justify-end gap-3 p-6 border-t bg-gray-50 z-10">
                    {!isAsociado && (
                        <button
                            onClick={() => setShowCambioTipoModal(true)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Cambiar tipo a Asociado
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                        Cerrar
                    </button>
                </div>
            </div>

            {showCambioTipoModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white w-full max-w-lg rounded-lg shadow-2xl border border-gray-200">
                        <div className="p-5 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900">Cambiar tipo de afiliado</h2>
                            <p className="text-sm text-gray-600 mt-2">
                                Está cambiando el tipo del afiliado a <strong>Asociado</strong>. Para continuar debe adjuntar
                                obligatoriamente <strong>Planos_Terreno</strong> y <strong>Escrituras_Terreno</strong>.
                            </p>
                        </div>

                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Planos del Terreno *</label>
                                <input
                                    ref={planosInputRef}
                                    type="file"
                                    onChange={(e) => setPlanosTerreno(e.target.files?.[0] || null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                />
                                {planosTerreno && (
                                    <div className="mt-2 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                        <span className="text-sm text-gray-700 truncate pr-3">{planosTerreno.name}</span>
                                        <button
                                            type="button"
                                            onClick={quitarPlanosTerreno}
                                            disabled={isActualizandoTipo}
                                            className="text-gray-500 hover:text-red-600 disabled:opacity-50"
                                            aria-label="Quitar archivo de planos"
                                            title="Quitar archivo"
                                        >
                                            <LuX className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Escrituras del Terreno *</label>
                                <input
                                    ref={escriturasInputRef}
                                    type="file"
                                    onChange={(e) => setEscriturasTerreno(e.target.files?.[0] || null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                />
                                {escriturasTerreno && (
                                    <div className="mt-2 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                        <span className="text-sm text-gray-700 truncate pr-3">{escriturasTerreno.name}</span>
                                        <button
                                            type="button"
                                            onClick={quitarEscriturasTerreno}
                                            disabled={isActualizandoTipo}
                                            className="text-gray-500 hover:text-red-600 disabled:opacity-50"
                                            aria-label="Quitar archivo de escrituras"
                                            title="Quitar archivo"
                                        >
                                            <LuX className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-5 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
                           

                            <button
                                onClick={handleConfirmarCambioATipoAsociado}
                                disabled={isActualizandoTipo}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isActualizandoTipo ? 'Guardando...' : 'Confirmar cambio'}
                            </button>


                            <button
                                onClick={() => {
                                    setShowCambioTipoModal(false);
                                    quitarPlanosTerreno();
                                    quitarEscriturasTerreno();
                                }}
                                disabled={isActualizandoTipo}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                            >
                                Cancelar
                            </button>

                            
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DetailAbonados;