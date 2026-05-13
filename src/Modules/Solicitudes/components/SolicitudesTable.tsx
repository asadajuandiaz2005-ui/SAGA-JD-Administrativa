import { useState, useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    createColumnHelper,
    type ColumnDef,
    getSortedRowModel,
    getFilteredRowModel,
} from '@tanstack/react-table';
import { User, Building } from 'lucide-react';

// Importar hooks de solicitudes
import { useSolicitudesFisicas } from '../Hooks/HookSolicitudesFisicas';
import { useSolicitudesJuridicas } from '../Hooks/HookSolicitudesJuridicas';

// Importar tipos
import type { SolicitudFisica } from '../Models/ModelosFisicas';
import type { SolicitudJuridica } from '../Models/ModelosJuridicos';

// Importar modal de edición
import EditSolicitudModal from './EditSolicitudModal';
import ModalSolicitud from './ModalSolicitud';
import { MdKeyboardArrowUp, MdKeyboardArrowDown, MdKeyboardDoubleArrowLeft, MdKeyboardArrowLeft, MdKeyboardArrowRight, MdKeyboardDoubleArrowRight } from 'react-icons/md';
import { LuSearch, LuFilter } from 'react-icons/lu';
import { useUserPermissions } from '@/Modules/Auth/Hooks/PermissionHook';
import type { FilterSolicitudesOptions } from './FilterSolicitudModal';
import FilterSolicitudModal from './FilterSolicitudModal';

// Tipo unificado para la tabla de solicitudes
type SolicitudUnificada = {
    id: string; // ID interno generado
    Id: number;
    Nombre_Completo: string;
    Cedula_Documento: string;
    Tipo_Solicitud: 'Afiliacion' | 'Desconexion' | 'Cambio de Medidor' | 'Asociado' | 'Agregar Medidor';
    Estado: {
        Id_Estado: number;
        Nombre_Estado: string;
    };
    Tipo_Persona: 'Físico' | 'Jurídico';
    Fecha_Creacion: string;
    // Datos originales para acciones
    datos_originales: SolicitudFisica | SolicitudJuridica;

};

export default function SolicitudesTable() {
    // Hooks para ambos tipos de solicitudes
    const { canEdit, canView } = useUserPermissions();

    const hasEditPermission = canEdit('solicitudes');
    const hasViewPermission = canView('solicitudes');
    const { data: solicitudesFisicas, isLoading: loadingFisicas, isError: errorFisicos } = useSolicitudesFisicas();
    const { data: solicitudesJuridicas, isLoading: loadingJuridicas, isError: errorJuridicos } = useSolicitudesJuridicas();

    const [globalFilter, setGlobalFilter] = useState('');

    const [activeFilters, setActiveFilters] = useState<FilterSolicitudesOptions>({
        estado: '',
        tipoPersona: '',
        tipoSolicitud: '',
        busquedaAvanzada: '',
    });
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [solicitudesEditadas, setSolicitudesEditadas] = useState<Record<string, SolicitudFisica | SolicitudJuridica>>({});

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (activeFilters.estado) count++;
        if (activeFilters.tipoPersona) count++;
        if (activeFilters.tipoSolicitud) count++;
        if (activeFilters.busquedaAvanzada) count++;
        if (globalFilter) count++;
        return count;
    }, [activeFilters, globalFilter]);

    const isSolicitudEditable = (estadoNombre?: string) => {
        const estadoNormalizado = (estadoNombre || '').toLowerCase();

        return ![
            'aprobada',
            'aprobado',
            'aprobada en espera',
            'completada',
            'rechazada',
            'rechazado',
        ].includes(estadoNormalizado);
    };


    // Estados para el modal de edición
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedSolicitud, setSelectedSolicitud] = useState<{
        id: number | string;
        tipo: 'solicitud-fisica' | 'solicitud-juridica';
        datos: SolicitudFisica | SolicitudJuridica;
    } | null>(null);

    const buildSolicitudEditKey = (tipo: 'solicitud-fisica' | 'solicitud-juridica', id: number | string) => `${tipo}-${id}`;

    const handleSolicitudGuardada = (solicitudActualizada: {
        id: number | string;
        tipo: 'solicitud-fisica' | 'solicitud-juridica';
        datos: SolicitudFisica | SolicitudJuridica;
    }) => {

        setSolicitudesEditadas((prev) => ({
            ...prev,
            [buildSolicitudEditKey(solicitudActualizada.tipo, solicitudActualizada.id)]: solicitudActualizada.datos,
        }));

        setSelectedSolicitudForGestion((prev) => {
            if (!prev) return prev;
            if (prev.id !== solicitudActualizada.id || prev.tipo !== solicitudActualizada.tipo) return prev;
            return {
                ...prev,
                datos: solicitudActualizada.datos,
            };
        });

        setSelectedSolicitud((prev) => {
            if (!prev) return prev;
            if (prev.id !== solicitudActualizada.id || prev.tipo !== solicitudActualizada.tipo) return prev;
            return {
                ...prev,
                datos: solicitudActualizada.datos,
            };
        });
    };

    // Estados para el modal de gestión de solicitudes (aprobar/rechazar)
    const [showGestionModal, setShowGestionModal] = useState(false);
    const [selectedSolicitudForGestion, setSelectedSolicitudForGestion] = useState<{
        id: number | string;
        tipo: 'solicitud-fisica' | 'solicitud-juridica';
        datos: SolicitudFisica | SolicitudJuridica;
    } | null>(null);

    // Estados combinados
    const isLoading = loadingFisicas || loadingJuridicas;
    const isError = errorFisicos || errorJuridicos;

    // Estado para la paginación
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 5,
    });
    // Opciones de tamaño de página para la paginación
    const pageSizeOptions = [5, 10, 20, 50];
    // Función para unificar los datos de solicitudes
    const datosUnificados = useMemo((): SolicitudUnificada[] => {

        // Función para normalizar el nombre del tipo de solicitud
        const normalizarTipoSolicitud = (tipo: string): 'Afiliacion' | 'Desconexion' | 'Cambio de Medidor' | 'Asociado' | 'Agregar Medidor' => {
            const tipoLower = tipo.toLowerCase().trim();
            let resultado: string;

            if (tipoLower.includes('afiliacion')) {
                resultado = 'Afiliacion';
            } else if (tipoLower.includes('desconexion')) {
                resultado = 'Desconexion';
            } else if (tipoLower.includes('cambio') && tipoLower.includes('medidor')) {
                resultado = 'Cambio de Medidor';
            } else if (tipoLower.includes('asociado')) {
                resultado = 'Asociado';
            } else if (tipoLower.includes('agregar') && tipoLower.includes('medidor')) {
                resultado = 'Agregar Medidor';
            } else {
                resultado = tipo; // Fallback al tipo original
            }

            return resultado as any;
        };

        // Función para aplanar la estructura agrupada por tipo de solicitud
        const aplanarSolicitudes = (datos: any): any[] => {
            if (!datos) return [];

            // Si ya es un array, devolverlo directamente
            if (Array.isArray(datos)) return datos;


            // Si es un objeto agrupado por tipo (Afiliacion, Desconexion, etc.)
            const solicitudesPlanas: any[] = [];

            Object.keys(datos).forEach(tipoSolicitud => {
                const solicitudesDelTipo = datos[tipoSolicitud];

                if (Array.isArray(solicitudesDelTipo) && solicitudesDelTipo.length > 0) {
                    // Agregar el Tipo_Solicitud a cada solicitud si no lo tiene
                    solicitudesDelTipo.forEach((solicitud) => {
                        const solicitudConTipo = {
                            ...solicitud,
                            Tipo_Solicitud: solicitud.Tipo_Solicitud || tipoSolicitud
                        };

                        solicitudesPlanas.push(solicitudConTipo);
                    });
                }
            });

            return solicitudesPlanas;
        };

        // Aplanar las solicitudes físicas y jurídicas
        const solicitudesFisicasArray = aplanarSolicitudes(solicitudesFisicas);
        const solicitudesJuridicasArray = aplanarSolicitudes(solicitudesJuridicas);
        // Solicitudes Físicas
        const solicitudesFisicasUnificadas: SolicitudUnificada[] = solicitudesFisicasArray.map((solicitud: SolicitudFisica, index: number) => {

            // Buscar ID real en la solicitud (backend usa Id_Solicitud)
            const solicitudConId = solicitud as any;
            const idReal = solicitudConId.Id_Solicitud || solicitudConId.id || solicitudConId.Id || solicitudConId.ID;
            const solicitudLocal = (idReal && solicitudesEditadas[buildSolicitudEditKey('solicitud-fisica', idReal)]) as SolicitudFisica | undefined;
            const solicitudFinal = solicitudLocal
                ? {
                    ...solicitud,
                    ...solicitudLocal,
                    Estado: solicitud.Estado,
                }
                : solicitud;

            return {
                id: `fisico-${index}`, // ID interno único para la tabla
                Id: idReal || (index + 1), // Usar ID real del backend o secuencial como fallback
                Nombre_Completo: `${solicitudFinal.Nombre || ''} ${solicitudFinal.Apellido1 || ''} ${solicitudFinal.Apellido2 || ''}`.trim() || 'Sin nombre',
                Cedula_Documento: solicitudFinal.Identificacion || 'Sin identificación',
                Tipo_Solicitud: normalizarTipoSolicitud(solicitudFinal.Tipo_Solicitud || 'Afiliacion'),
                Estado: {
                    Id_Estado: solicitudFinal.Estado?.Id_Estado_Solicitud || 0,
                    Nombre_Estado: solicitudFinal.Estado?.Nombre_Estado || 'Sin estado'
                },
                Tipo_Persona: 'Físico' as const,
                Fecha_Creacion: solicitudFinal.Fecha_Creacion || '',
                datos_originales: solicitudFinal
            };
        });

        // Solicitudes Jurídicas
        const solicitudesJuridicasUnificadas: SolicitudUnificada[] = solicitudesJuridicasArray.map((solicitud: SolicitudJuridica, index: number) => {

            // Buscar ID real en la solicitud (backend usa Id_Solicitud)
            const solicitudConId = solicitud as any;
            const idReal = solicitudConId.Id_Solicitud || solicitudConId.id || solicitudConId.Id || solicitudConId.ID;
            const solicitudLocal = (idReal && solicitudesEditadas[buildSolicitudEditKey('solicitud-juridica', idReal)]) as SolicitudJuridica | undefined;
            const solicitudFinal = solicitudLocal
                ? {
                    ...solicitud,
                    ...solicitudLocal,
                    Estado: solicitud.Estado,
                }
                : solicitud;

            return {
                id: `juridico-${index}`, // ID interno único para la tabla
                Id: idReal || (solicitudesFisicasUnificadas.length + index + 1), // Usar ID real del backend o continuar secuencia
                Nombre_Completo: solicitudFinal.Razon_Social || 'Sin razón social',
                Cedula_Documento: solicitudFinal.Cedula_Juridica || 'Sin cédula jurídica',
                Tipo_Solicitud: normalizarTipoSolicitud(solicitudFinal.Tipo_Solicitud || 'Afiliacion'),
                Estado: {
                    Id_Estado: solicitudFinal.Estado?.Id_Estado_Solicitud || 0,
                    Nombre_Estado: solicitudFinal.Estado?.Nombre_Estado || 'Sin estado'
                },
                Tipo_Persona: 'Jurídico' as const,
                Fecha_Creacion: solicitudFinal.Fecha_Creacion || '',
                datos_originales: solicitudFinal
            };
        });

        const resultado = [
            ...solicitudesFisicasUnificadas,
            ...solicitudesJuridicasUnificadas
        ].sort((a, b) => b.Id - a.Id);

        return resultado;
    }, [solicitudesFisicas, solicitudesJuridicas, solicitudesEditadas]);

    const filteredData = useMemo(() => {
        let datos = datosUnificados;

        // Aplicar filtros avanzados
        if (activeFilters.estado) {
            datos = datos.filter(s => s.Estado.Nombre_Estado === activeFilters.estado);
        }
        if (activeFilters.tipoPersona) {
            datos = datos.filter(s => s.Tipo_Persona === activeFilters.tipoPersona);
        }
        if (activeFilters.tipoSolicitud) {
            datos = datos.filter(s => s.Tipo_Solicitud === activeFilters.tipoSolicitud);
        }
        if (activeFilters.busquedaAvanzada) {
            const busqueda = activeFilters.busquedaAvanzada.toLowerCase();
            datos = datos.filter(s =>
                [
                    s.Nombre_Completo,
                    s.Cedula_Documento,
                ].filter(Boolean).join(' ').toLowerCase().includes(busqueda)
            );
        }

        // Aplicar filtro global (búsqueda rápida)
        if (globalFilter) {
            const q = globalFilter.toLowerCase();
            datos = datos.filter((solicitud) =>
                [
                    solicitud.Nombre_Completo,
                    solicitud.Cedula_Documento,
                    solicitud.Tipo_Solicitud,
                    solicitud.Estado.Nombre_Estado,
                    solicitud.Tipo_Persona
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()
                    .includes(q)
            );
        }

        return datos;
    }, [datosUnificados, globalFilter, activeFilters]);

    const columnHelper = createColumnHelper<SolicitudUnificada>();
    const columns: ColumnDef<SolicitudUnificada, any>[] = [
        columnHelper.accessor('Nombre_Completo', {
            header: 'Nombre / Razón Social',
            cell: (info) => {
                const fila = info.row.original;
                let nombreCompleto = '';

                if (fila.Tipo_Persona === 'Físico') {
                    const datosOriginales = fila.datos_originales as SolicitudFisica;

                    if (!datosOriginales.Nombre && !datosOriginales.Apellido1) {
                        nombreCompleto = 'Datos no disponibles';
                    } else {
                        nombreCompleto = `${datosOriginales.Nombre || ''} ${datosOriginales.Apellido1 || ''} ${datosOriginales.Apellido2 || ''}`.trim() || 'Sin nombre';
                    }
                } else {
                    const datosOriginales = fila.datos_originales as SolicitudJuridica;
                    nombreCompleto = datosOriginales.Razon_Social || 'Sin razón social';
                }
                
                return (
                    <div className="font-medium text-left max-w-[80px] sm:max-w-[150px] md:max-w-xs truncate" title={nombreCompleto}>
                        {nombreCompleto}
                    </div>
                );
            }
        }),
        columnHelper.accessor('Cedula_Documento', {
            header: 'Número Identificación / Cédula Jurídica',
            cell: (info) => {
                const fila = info.row.original;
                let cDocumento = '';

                if (fila.Tipo_Persona === 'Físico') {
                    const datosOriginales = fila.datos_originales as SolicitudFisica;
                    cDocumento = datosOriginales.Identificacion || 'Sin número de identificación';
                } else {
                    const datosOriginales = fila.datos_originales as SolicitudJuridica;
                    cDocumento = datosOriginales.Cedula_Juridica || 'Sin cédula jurídica';
                }

                return (
                    <div className="flex flex-col items-start justify-start max-w-[70px] sm:max-w-[150px] truncate" title={cDocumento}>
                        <span className="text-gray-600">{cDocumento}</span>
                    </div>
                );
            },
            size: 160
        }),
        columnHelper.accessor('Tipo_Solicitud', {
            header: 'Tipo de Solicitud',
            cell: (info) => {
                const tipo = info.getValue();
                return (
                    <div className="flex items-center justify-start">
                        <span className={`inline-flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[7px] sm:text-xs font-medium whitespace-nowrap ${
                            tipo === 'Afiliacion' ? 'bg-emerald-100 text-emerald-700' :
                            tipo === 'Desconexion' ? 'bg-red-100 text-red-700' :
                            tipo === 'Cambio de Medidor' ? 'bg-blue-100 text-blue-700' :
                            tipo === 'Asociado' ? 'bg-orange-100 text-orange-700' :
                            'bg-slate-100 text-slate-700'
                        }`}>
                            {tipo === 'Afiliacion' ? (
                                <><span className="hidden sm:inline">Afiliación</span><span className="sm:hidden">Afil.</span></>
                             ) :
                             tipo === 'Desconexion' ? (
                                <><span className="hidden sm:inline">Desconexión</span><span className="sm:hidden">Desc.</span></>
                             ) :
                             tipo === 'Cambio de Medidor' ? (
                                <><span className="hidden sm:inline">Cambio de Medidor</span><span className="sm:hidden">C. M.</span></>
                             ) :
                             tipo === 'Asociado' ? (
                                <><span className="hidden sm:inline">Asociado</span><span className="sm:hidden">Asoc.</span></>
                             ) : <span className="truncate max-w-[50px] sm:max-w-[100px]">{tipo}</span>}
                        </span>
                    </div>
                );
            },
            size: 150,
        }),
        columnHelper.accessor('Estado', {
            header: 'Estado',
            cell: (info) => {
                const estado = info.getValue();
                const estadoNombre = estado?.Nombre_Estado || 'Sin estado';
                const base = 'px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[7px] sm:text-xs font-semibold whitespace-nowrap';

                return (
                    <div className="flex items-center justify-start">
                        {estadoNombre === 'Pendiente' ? (
                            <span className={`${base} bg-amber-100 text-amber-700 border border-amber-300`}>Pendiente</span>
                        ) : estadoNombre === 'Aprobada' || estadoNombre === 'Aprobado' ? (
                            <span className={`${base} bg-green-100 text-green-700 border border-green-300`}>Aprobado</span>
                        ) : estadoNombre === 'Rechazada' || estadoNombre === 'Rechazado' ? (
                            <span className={`${base} bg-red-100 text-red-700 border border-red-300`}>Rechazado</span>
                        ) : estadoNombre === 'En Proceso' ? (
                            <span className={`${base} bg-blue-100 text-blue-700 border border-blue-300`}>En Proc.</span>
                        ) : (
                            <span className={`${base} bg-slate-100 text-slate-700 border border-slate-300`}>{estadoNombre}</span>
                        )}
                    </div>
                );
            },
            size: 120,
        }),
        columnHelper.accessor('Tipo_Persona', {
            header: 'Tipo Persona',
            cell: (info) => {
                const tipo = info.getValue();
                return (
                    <div className="flex items-center justify-start">
                        <span className={`inline-flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[7px] sm:text-xs font-medium ${tipo === 'Físico'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                            }`}>
                            {tipo === 'Físico' ? <User className="w-2 h-2 sm:w-3.5 sm:h-3.5" /> : <Building className="w-2 h-2 sm:w-3.5 sm:h-3.5" />} <span className="hidden sm:inline">{tipo}</span><span className="sm:hidden">{tipo}</span>
                        </span>
                    </div>
                );
            },
            size: 120,
        }),
        columnHelper.accessor('Fecha_Creacion', {
            header: 'Fecha de Envío',
            cell: (info) => {
                const fecha = info.getValue();
                if (!fecha) return <div className="flex items-center justify-start"><span className="text-[7px] sm:text-xs">Sin fecha</span></div>;

                try {
                    const fechaObj = new Date(fecha);
                    return (
                        <div className="flex items-center justify-start">
                            <span className="whitespace-nowrap text-[7px] sm:text-xs">
                                {fechaObj.toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                })}
                            </span>
                        </div>
                    );
                } catch {
                    return <div className="flex items-center justify-start"><span className="text-[7px] sm:text-xs">Fecha inválida</span></div>;
                }
            },
            size: 120,
        }),
        columnHelper.display({
            id: 'acciones',
            header: 'Acciones',
            cell: ({ row }) => {
                const solicitud = row.original;

                return (
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                        {/* Ver detalles */}
                        {hasViewPermission && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const tipo = solicitud.Tipo_Persona === 'Físico' ? 'solicitud-fisica' : 'solicitud-juridica';

                                    // Abrir el modal (el cambio de estado se maneja dentro del modal)
                                    setSelectedSolicitudForGestion({
                                        id: solicitud.Id,
                                        tipo: tipo,
                                        datos: solicitud.datos_originales
                                    });
                                    setShowGestionModal(true);
                                }}
                                className="px-1 py-1 sm:px-4 sm:py-1 bg-gray-600 text-white text-[7px] sm:text-xs rounded hover:bg-gray-700 transition-colors w-full sm:w-auto"
                                title="Ver detalles"
                            >
                                Ver
                            </button>
                        )}

                        {/* Editar */}
                        {hasEditPermission && (
                            (() => {
                                const puedeEditar = isSolicitudEditable(solicitud.Estado.Nombre_Estado);

                                return (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedSolicitud({
                                                id: solicitud.Id,
                                                tipo: solicitud.Tipo_Persona === 'Físico'
                                                    ? 'solicitud-fisica'
                                                    : 'solicitud-juridica',
                                                datos: solicitud.datos_originales
                                            });
                                            setShowEditModal(true);
                                        }}
                                        disabled={!puedeEditar}
                                        className="px-1 py-1 sm:px-4 sm:py-1 bg-blue-600 text-white text-[7px] sm:text-xs rounded hover:bg-blue-700 transition-colors w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={puedeEditar ? 'Editar solicitud' : 'Esta solicitud ya fue aceptada o eliminada'}
                                    >
                                        Editar
                                    </button>
                                );
                            })()
                        )}
                    </div>
                );
            }
        }),
    ];

    // Declarar la tabla aquí, fuera de columns
    const table = useReactTable({
        data: filteredData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        state: {
            globalFilter,
            pagination,
        },
        onGlobalFilterChange: setGlobalFilter,
        onPaginationChange: setPagination,
        initialState: {
            pagination: {
                pageSize: 5,
                pageIndex: 0,
            },
        },
    });

    if (isLoading) {
        return (
            <div className="w-full flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Cargando solicitudes...</p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="w-full flex items-center justify-center py-12">
                <div className="text-center">
                    <p className="text-red-600 mb-2">Error al cargar las solicitudes</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div className="w-full">
            <div className="flex flex-col sm:flex-row gap-4 mb-4 justify-between items-start sm:items-center p-3">
                <div className="flex items-start gap-2 flex-col justify-start">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Revisión de Solicitudes</h2>
                    <p className="text-xs sm:text-sm text-gray-600">Gestiona las solicitudes de los usuarios</p>
                </div>

                <div className='flex flex-row flex-wrap sm:flex-nowrap justify-start sm:justify-end items-center gap-2 sm:gap-4 w-full sm:w-auto'>
                    {/* Botón de filtros */}
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm border rounded-md flex items-center justify-center gap-2 flex-1 sm:flex-none ${activeFiltersCount > 0
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        <LuFilter className="w-3 h-3 sm:w-4 sm:h-4" />
                        Filtros
                        {activeFiltersCount > 0 && (
                            <span className="bg-blue-500 text-white text-[10px] rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>

                    {/* Campo de búsqueda */}
                    <div className="relative flex-1 sm:flex-none min-w-[150px] w-full sm:w-auto sm:max-w-md">
                        <LuSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <input
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            placeholder="Buscar..."
                            className="w-full pl-8 pr-3 py-1.5 sm:pl-10 sm:pr-4 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-sky-100 overflow-hidden max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full table-auto">
                        <thead className="bg-sky-50">
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id} className="text-left text-[9px] sm:text-xs md:text-sm text-sky-700">
                                    {headerGroup.headers.map((header, index) => {
                                        const isActionsColumn = header.column.id === 'acciones';
                                        return (
                                            <th key={header.id} className={`px-0.5 sm:px-2 md:px-4 py-1 md:py-3 font-medium border-b border-sky-100 ${
                                                isActionsColumn ? 'text-center' : 'text-left'
                                            } ${index === 0 ? 'pl-3 sm:pl-4' : ''} ${index === headerGroup.headers.length - 1 ? 'pr-3 sm:pr-4' : ''}`}>
                                                {(() => {
                                                    const headerText = header.column.columnDef.header as string;
                                                    let mobileHeaderText = headerText;
                                                    if (headerText === 'Nombre / Razón Social') mobileHeaderText = 'Nombre/Razón';
                                                    if (headerText === 'Número Identificación / Cédula Jurídica') mobileHeaderText = 'Identific.';
                                                    if (headerText === 'Tipo de Solicitud') mobileHeaderText = 'T. Sol.';
                                                    if (headerText === 'Tipo Persona') mobileHeaderText = 'T. Persona';
                                                    if (headerText === 'Fecha de Envío') mobileHeaderText = 'Fecha';

                                                    if (header.isPlaceholder) {
                                                        return null;
                                                    }
                                                    if (header.column.getCanSort()) {
                                                        return (
                                                            <button
                                                                type="button"
                                                                className={`cursor-pointer select-none flex items-center gap-2 bg-transparent border-none p-0 justify-start`}
                                                                onClick={header.column.getToggleSortingHandler()}
                                                                onKeyDown={e => {
                                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                                        e.preventDefault();
                                                                        header.column.getToggleSortingHandler()?.(e);
                                                                    }
                                                                }}
                                                                tabIndex={0}
                                                                aria-label={`Ordenar por ${headerText}`}
                                                            >
                                                                <span className="flex items-center justify-left gap-1 whitespace-nowrap">
                                                                    <span className="sm:hidden">{mobileHeaderText}</span>
                                                                    <span className="hidden sm:inline">{headerText}</span>
                                                                    {header.column.getIsSorted() === 'asc' && <MdKeyboardArrowUp className="inline" />}
                                                                    {header.column.getIsSorted() === 'desc' && <MdKeyboardArrowDown className="inline" />}
                                                                </span>
                                                            </button>
                                                        );
                                                    }
                                                    return (
                                                        <span className={`${isActionsColumn ? 'text-center' : 'text-left'} whitespace-nowrap`}>
                                                            <span className="sm:hidden">{mobileHeaderText}</span>
                                                            <span className="hidden sm:inline">{headerText}</span>
                                                        </span>
                                                    );
                                                })()}
                                            </th>
                                        );
                                    })}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="bg-white divide-y divide-sky-50">
                            {table.getRowModel().rows.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-2 sm:px-4 py-8 text-center text-slate-500 text-[10px] sm:text-xs md:text-sm">
                                        {globalFilter ? 'No se encontraron solicitudes que coincidan con la búsqueda' : 'No hay solicitudes registradas'}
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map(row => (
                                    <tr key={row.id} className="hover:bg-sky-50 cursor-pointer transition-colors">
                                        {row.getVisibleCells().map((cell, index) => {
                                            let cellContent: React.ReactNode;

                                            if (cell.column.columnDef.cell) {
                                                if (typeof cell.column.columnDef.cell === 'function') {
                                                    cellContent = cell.column.columnDef.cell(cell.getContext());
                                                } else {
                                                    cellContent = cell.column.columnDef.cell;
                                                }
                                            } else {
                                                cellContent = cell.getValue() as React.ReactNode;
                                            }

                                            return (
                                                <td key={cell.id} className={`px-0.5 sm:px-2 md:px-4 py-1.5 md:py-3 text-[7px] sm:text-xs md:text-sm text-slate-700 align-middle ${
                                                    cell.column.id === 'acciones' ? 'text-center' : 'text-left'
                                                } ${index === 0 ? 'pl-3 sm:pl-4' : ''} ${index === row.getVisibleCells().length - 1 ? 'pr-3 sm:pr-4' : ''}`}>
                                                    {cellContent}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

               <div className="px-2 sm:px-6 py-2 sm:py-3 bg-gray-50 border-t border-gray-200">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-4">
                            <div className="flex items-center gap-1 sm:gap-2">
                                <span className="text-[10px] sm:text-sm text-gray-700">Filas por página:</span>
                                <select
                                    value={table.getState().pagination.pageSize}
                                    onChange={(e) => {
                                        table.setPageSize(Number(e.target.value));
                                    }}
                                    className="px-1.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {pageSizeOptions.map((pageSize) => (
                                        <option key={pageSize} value={pageSize}>
                                            {pageSize}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                            <button
                                onClick={() => table.setPageIndex(0)}
                                disabled={!table.getCanPreviousPage()}
                                className="p-1 sm:p-2 rounded-md border text-gray-600 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Primera página"
                            >
                                <MdKeyboardDoubleArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            <button
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                                className="p-1 sm:p-2 rounded-md border text-gray-600 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Página anterior"
                            >
                                <MdKeyboardArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            <span className="text-[10px] sm:text-sm text-gray-700 mx-1 sm:mx-2 whitespace-nowrap">
                                <span className="hidden sm:inline">Página </span>{table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                            </span>
                            <button
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                                className="p-1 sm:p-2 rounded-md border text-gray-600 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Página siguiente"
                            >
                                <MdKeyboardArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            <button
                                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                disabled={!table.getCanNextPage()}
                                className="p-1 sm:p-2 rounded-md border text-gray-600 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Última página"
                            >
                                <MdKeyboardDoubleArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* Modal de edición */}
            {showEditModal && selectedSolicitud && (
                <EditSolicitudModal
                    solicitud={selectedSolicitud}
                    isOpen={showEditModal}
                    onSave={handleSolicitudGuardada}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedSolicitud(null);
                    }}
                />
            )}

            {/* Modal de gestión de estados (aprobar/rechazar) */}
            {showGestionModal && selectedSolicitudForGestion && (
                <ModalSolicitud
                    isOpen={showGestionModal}
                    onClose={() => {
                        setShowGestionModal(false);
                        setSelectedSolicitudForGestion(null);
                    }}
                    solicitud={selectedSolicitudForGestion}
                />
            )}
            <FilterSolicitudModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                currentFilters={activeFilters}
                onApplyFilters={setActiveFilters}
            />


        </div>


    );
    
}

