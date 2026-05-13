import { useMemo, useState } from 'react';
import { createColumnHelper, getCoreRowModel, getFilteredRowModel, getSortedRowModel, getPaginationRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { User, Building, Plus } from 'lucide-react';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdKeyboardDoubleArrowLeft, MdKeyboardDoubleArrowRight, MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md';
import { LuSearch, LuFilter } from 'react-icons/lu';
import FilterModal, { type FilterOptions } from './FilterAfiliadoModal';
import { useNavigate } from '@tanstack/react-router';
import { useAlerts } from '@/Modules/Global/context/AlertContext';
import { useAfiliadosFisicos } from '../Hook/HookAfiliadoFisico';
import { useAfiliadosJuridicos } from '../Hook/HookAfiliadoJuridico';
import { formatCedulaJuridica } from '../Helper/formatUtils';
import DetailAbonados from './DetailAfiliadoModal';
import CreateModal from './CreateAfiliadoModal';
import EditModal from './EditAfiliadoModal';
import AsignarMedidorAfiliadoModal from './AsignarMedidorAfiliadoModal';
import { useUserPermissions } from '@/Modules/Auth/Hooks/PermissionHook';
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogHeader,
    AlertDialogFooter
} from "@/Modules/Global/components/Sidebar/ui/alert-dialog";
import type { AfiliadoFisico } from '../Models/TablaAfiliados/ModeloAfiliadoFisico';
import type { AfiliadoJuridico } from '../Models/TablaAfiliados/ModeloAfiliadoJuridico';

// Tipo unificado para la tabla
type AfiliadoUnificado = {
    Id: number;
    Nombre_Completo: string;
    Cedula_Documento?: string;
    Identificacion: string;
    Estado: {
        Id_Estado: number;
        Nombre_Estado: string;
    };
    Tipo_Persona: 'Físico' | 'Jurídico';
    Tipo_Afiliado: 'Abonado' | 'Asociado';
    Tipo_Identificacion?: string;
    datos_originales: AfiliadoFisico | AfiliadoJuridico;
};

export default function AbonadosTable() {
    const { afiliadosFisicos, isLoading: loadingFisicos, isError: errorFisicos, refetch: refetchFisicos, updateEstadoAfiliadoFisico: updateEstadoMutationFisico } = useAfiliadosFisicos();
    const { afiliadosJuridicos, isLoading: loadingJuridicos, isError: errorJuridicos, refetch: refetchJuridicos, updateEstadoAfiliadoJuridico: updateEstadoMutationJuridico } = useAfiliadosJuridicos();
    const navigate = useNavigate();
    const { showError } = useAlerts();
    const { canCreate, canEdit } = useUserPermissions();

    const hasCreatePermission = canCreate('abonados');
    const hasEditPermission = canEdit('abonados');

    const [globalFilter, setGlobalFilter] = useState('');
    const [activeFilters, setActiveFilters] = useState<FilterOptions>({
        estado: '',
        tipoPersona: '',
        tipoAfiliado: '',
        busquedaAvanzada: ''
    });
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false); // ✅ Agregar estado para EditModal
    const [showAsignarMedidorModal, setShowAsignarMedidorModal] = useState(false);
    const [afiliadoParaAsignarMedidor, setAfiliadoParaAsignarMedidor] = useState<AfiliadoUnificado | null>(null);
    const [tipoAfiliadoAsignar, setTipoAfiliadoAsignar] = useState<'afiliado-fisico' | 'afiliado-juridico'>('afiliado-fisico');
    const [selectedPersona, setSelectedPersona] = useState<{
        tipo: 'afiliado-fisico' | 'afiliado-juridico';
        datos: AfiliadoFisico | AfiliadoJuridico;
    } | null>(null);

    const pageSizeOptions = [5, 10, 20, 50];
    const [pagination, setPagination] = useState({
        pageSize: 5,
        pageIndex: 0,
    });

    const isLoading = loadingFisicos || loadingJuridicos;
    const isError = errorFisicos || errorJuridicos;

    // Unificar datos y agregar Tipo_Identificacion
    const datosUnificados = useMemo((): AfiliadoUnificado[] => {
        const afiliadosFisicosUnificados: AfiliadoUnificado[] = afiliadosFisicos.map((afiliado: AfiliadoFisico) => ({
            Id: afiliado.Id_Afiliado,
            Nombre_Completo: `${afiliado.Nombre || ''} ${afiliado.Apellido1 || ''} ${afiliado.Apellido2 || ''}`.trim() || 'Sin nombre',
            Identificacion: afiliado.Identificacion || 'Sin cédula',
            Estado: {
                Id_Estado: afiliado.Estado?.Id_Estado_Afiliado || 0,
                Nombre_Estado: afiliado.Estado?.Nombre_Estado || 'Sin estado'
            },
            Tipo_Persona: 'Físico' as const,
            Tipo_Afiliado: afiliado.Tipo_Afiliado?.Nombre_Tipo_Afiliado as 'Abonado' | 'Asociado' || 'Asociado',
            Tipo_Identificacion: (afiliado as any).Tipo_Identificacion || 'Sin dato',
            datos_originales: afiliado
        }));

        const afiliadosJuridicosUnificados: AfiliadoUnificado[] = afiliadosJuridicos.map((afiliado: AfiliadoJuridico) => ({
            Id: afiliado.Id_Afiliado,
            Nombre_Completo: afiliado.Razon_Social || 'Sin razón social',
            Cedula_Documento: formatCedulaJuridica(afiliado.Cedula_Juridica || '') || 'Sin cédula jurídica',
            Identificacion: formatCedulaJuridica(afiliado.Cedula_Juridica || '') || 'Sin cédula jurídica',
            Estado: {
                Id_Estado: afiliado.Estado?.Id_Estado_Afiliado || 0,
                Nombre_Estado: afiliado.Estado?.Nombre_Estado || 'Sin estado'
            },
            Tipo_Persona: 'Jurídico' as const,
            Tipo_Afiliado: afiliado.Tipo_Afiliado?.Nombre_Tipo_Afiliado as 'Abonado' | 'Asociado' || 'Asociado',
            Tipo_Identificacion: 'Cédula Jurídica',
            datos_originales: afiliado
        }));

        return [
            ...afiliadosFisicosUnificados,
            ...afiliadosJuridicosUnificados
        ].sort((a, b) => a.Id - b.Id);
    }, [afiliadosFisicos, afiliadosJuridicos]);

    // Conteo de filtros activos para el badge
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (activeFilters.estado) count++;
        if (activeFilters.tipoPersona) count++;
        if (activeFilters.tipoAfiliado) count++;
        if (activeFilters.busquedaAvanzada) count++;
        if (globalFilter) count++;
        return count;
    }, [activeFilters, globalFilter]);

    // Filtrar por estado, tipo persona y tipo afiliado
    const filteredData = useMemo(() => {
        let data = datosUnificados;

        if (activeFilters.estado) {
            data = data.filter(a => a.Estado.Nombre_Estado.toLowerCase() === activeFilters.estado.toLowerCase());
        }
        if (activeFilters.tipoPersona) {
            data = data.filter(a => a.Tipo_Persona === activeFilters.tipoPersona);
        }
        if (activeFilters.tipoAfiliado) {
            data = data.filter(a => a.Tipo_Afiliado === activeFilters.tipoAfiliado);
        }

        const q = (activeFilters.busquedaAvanzada || globalFilter || '').toLowerCase();
        if (q) {
            data = data.filter(a =>
                [a.Nombre_Completo, a.Cedula_Documento, a.Identificacion, a.Estado.Nombre_Estado, a.Tipo_Persona, a.Tipo_Afiliado, a.Tipo_Identificacion]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()
                    .includes(q)
            );
        }

        return data;
    }, [datosUnificados, activeFilters, globalFilter]);

    const handleViewDetail = (persona: AfiliadoUnificado) => {
        const tipo = persona.Tipo_Persona === 'Físico' ? 'afiliado-fisico' : 'afiliado-juridico';
        setSelectedPersona({
            tipo,
            datos: persona.datos_originales
        });
        setShowDetailModal(true);
    };

    const handleEdit = (persona: AfiliadoUnificado) => { // ✅ Agregar función para editar
        const tipo = persona.Tipo_Persona === 'Físico' ? 'afiliado-fisico' : 'afiliado-juridico';
        setSelectedPersona({
            tipo,
            datos: persona.datos_originales
        });
        setShowEditModal(true);
    };

    const handleToggleEstado = async (persona: AfiliadoUnificado) => {
        const nuevoEstadoId = persona.Estado.Id_Estado === 1 ? 2 : 1; // 1: Activo, 2: Inactivo
        const id = persona.Id.toString();

        try {
            if (persona.Tipo_Persona === 'Físico') {
                await updateEstadoMutationFisico.mutateAsync({ id, nuevoEstadoId });
            } else {
                await updateEstadoMutationJuridico.mutateAsync({ id, nuevoEstadoId });
            }
            console.log('Estado actualizado exitosamente');
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            showError(
                'Error al actualizar estado',
                'No se pudo actualizar el estado del afiliado. Por favor, intente nuevamente.'
            );
        }
    };

    const handleOpenAsignarMedidor = (persona: AfiliadoUnificado) => {
        setAfiliadoParaAsignarMedidor(persona);
        setTipoAfiliadoAsignar(persona.Tipo_Persona === 'Físico' ? 'afiliado-fisico' : 'afiliado-juridico');
        setShowAsignarMedidorModal(true);
    };

    const handleAsignacionMedidorExitosa = async () => {
        await Promise.all([refetchFisicos(), refetchJuridicos()]);
    };

    const columnHelper = createColumnHelper<AfiliadoUnificado>();
    const columns: ColumnDef<AfiliadoUnificado, any>[] = [
        columnHelper.accessor('Nombre_Completo', {
            header: 'Nombre / Razón Social',
            cell: (info) => {
                const fila = info.row.original;
                let nombreFinal = '';
                if (fila.Tipo_Persona === 'Físico') {
                    const datosOriginales = fila.datos_originales as AfiliadoFisico;
                    if (!datosOriginales.Nombre && !datosOriginales.Apellido1) {
                        nombreFinal = 'Datos no disponibles';
                    } else {
                        nombreFinal = `${datosOriginales.Nombre || ''} ${datosOriginales.Apellido1 || ''} ${datosOriginales.Apellido2?.includes('No Proporcionado') ? '' : datosOriginales.Apellido2 || ''}`.trim();
                        nombreFinal = nombreFinal || 'Sin nombre';
                    }
                } else {
                    const datosOriginales = fila.datos_originales as AfiliadoJuridico;
                    nombreFinal = datosOriginales.Razon_Social || 'Sin razón social';
                }

                return (
                    <div className="font-medium text-left max-w-[80px] sm:max-w-[150px] md:max-w-xs truncate" title={nombreFinal}>
                        {nombreFinal}
                    </div>
                );
            },
            size: 200,
        }),
        columnHelper.accessor('Identificacion', {
            header: 'Cédula / Documento',
            cell: (info) => {
                const fila = info.row.original;
                const tipoIdentificacion = fila.Tipo_Identificacion || 'Sin dato';
                const identificacion = info.getValue() || 'Sin dato';

                return (
                    <div className='flex flex-col items-start justify-start max-w-[70px] sm:max-w-[150px] truncate' title={`${identificacion} - ${tipoIdentificacion}`}>
                        <div className="font-medium text-gray-900 truncate w-full">{identificacion}</div>
                        <div className="text-[7px] sm:text-xs text-gray-500 mt-1 truncate w-full">{tipoIdentificacion}</div>
                    </div>
                );
            },
            size: 180,
        }),
        columnHelper.accessor('Estado', {
            header: 'Estado',
            cell: (info) => {
                const estado = info.getValue();
                const estadoNombre = estado?.Nombre_Estado || 'Sin estado';
                const estadoNormalizado = estadoNombre.trim().toLowerCase();
                const estadoVisual =
                    estadoNormalizado === 'en espera' ||
                    estadoNormalizado === 'pendiente' ||
                    estadoNormalizado.includes('espera') 
                       ? 'En espera'
                        : estadoNombre;

                const base = 'px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[7px] sm:text-xs font-semibold whitespace-nowrap';

                if (estadoNormalizado === 'activo') {
                    return <span className={`${base} bg-emerald-100 text-emerald-700 border border-emerald-300`}>Activo</span>;
                } else if (estadoNormalizado === 'inactivo') {
                    return <span className={`${base} bg-red-100 text-red-700 border border-red-300`}>Inactivo</span>;
                }

                return (
                    <div className='flex items-center justify-start'>
                        <span className={`${base} bg-slate-100 text-slate-700 border border-slate-300`}>{estadoVisual}</span>
                    </div>);
            },
            size: 120,
        }),
        columnHelper.accessor('Tipo_Persona', {
            header: 'Tipo Persona',
            cell: (info) => {
                const tipo = info.getValue();
                return (
                    <div className='flex items-center justify-start'>
                        <span className={`inline-flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[7px] sm:text-xs font-medium ${tipo === 'Físico'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-blue-100 text-blue-700'
                            }`}>
                            {tipo === 'Físico' ? <User className="w-2 h-2 sm:w-3.5 sm:h-3.5" /> : <Building className="w-2 h-2 sm:w-3.5 sm:h-3.5" />} <span className="hidden sm:inline">{tipo}</span><span className="sm:hidden">{tipo}</span>
                        </span>
                    </div>
                );
            },
            size: 120,
        }),
        columnHelper.accessor('Tipo_Afiliado', {
            header: 'Tipo Afiliado',
            cell: (info) => {
                const tipo = info.getValue();
                return (
                    <div className='flex items-center justify-start'>
                        <span className={`inline-flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[7px] sm:text-xs font-medium ${tipo === 'Abonado'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-orange-100 text-orange-700'
                            }`}>
                            <span className="hidden sm:inline">{tipo}</span><span className="sm:hidden">{tipo}</span>
                        </span>
                    </div>
                );
            },
            size: 120,
        }),
        columnHelper.display({
            id: 'acciones',
            header: 'Acciones',
            cell: ({ row }) => {
                const persona = row.original;
                const estadoNormalizado = (persona.Estado.Nombre_Estado || '').trim().toLowerCase();
                const esActivo = estadoNormalizado === 'activo';
                const esEnEspera =
                    estadoNormalizado === 'en espera' ||
                    estadoNormalizado === 'pendiente' ||
                    estadoNormalizado.includes('espera');

                return (
                    <div className="flex justify-center gap-1 sm:gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetail(persona);
                            }}
                            className="px-1 sm:px-4 py-0.5 sm:py-1.5 bg-gray-600 text-white text-[7px] sm:text-xs rounded hover:bg-gray-700 transition-colors whitespace-nowrap"
                            title="Ver detalles"
                        >
                            Ver
                        </button>
                        {hasEditPermission && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(persona); //  Cambiar para abrir EditModal
                                }}
                                className="px-1 sm:px-4 py-0.5 sm:py-1.5 bg-blue-600 text-white text-[7px] sm:text-xs rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                                title="Editar"
                            >
                                Editar
                            </button>
                        )}
                        {hasEditPermission && esEnEspera ? (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenAsignarMedidor(persona);
                                }}
                                className="px-1 sm:px-4 py-0.5 sm:py-1.5 bg-green-600 text-white text-[7px] sm:text-xs rounded hover:bg-green-700 transition-colors whitespace-nowrap"
                                title="Asignar medidor"
                            >
                                Asig.
                            </button>
                        ) : hasEditPermission && esActivo ? (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <button
                                        className="px-1 sm:px-4 py-0.5 sm:py-1.5 bg-red-600 text-white text-[7px] sm:text-xs rounded hover:bg-red-700 transition-colors whitespace-nowrap"
                                        disabled={updateEstadoMutationFisico.isPending || updateEstadoMutationJuridico.isPending}
                                        title="Desactivar"
                                    >
                                        Desact.
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            <span>¿Desactivar afiliado?</span>
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            <span>¿Estás seguro de que deseas desactivar al afiliado "{persona.Nombre_Completo}"?</span>
                                            <br />
                                            <span>Esta acción puede revertirse posteriormente.</span>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogAction
                                            onClick={() => handleToggleEstado(persona)}
                                            disabled={updateEstadoMutationFisico.isPending || updateEstadoMutationJuridico.isPending}
                                        >
                                            <span>Desactivar</span>
                                        </AlertDialogAction>
                                        <AlertDialogCancel>
                                            <span>Cancelar</span>
                                        </AlertDialogCancel>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        ) : hasEditPermission ? (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <button
                                        className="px-1 sm:px-4 py-0.5 sm:py-1.5 bg-green-600 text-white text-[7px] sm:text-xs rounded hover:bg-green-700 transition-colors whitespace-nowrap"
                                        disabled={updateEstadoMutationFisico.isPending || updateEstadoMutationJuridico.isPending}
                                        title="Activar"
                                    >
                                        Activar
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            <span>¿Activar afiliado?</span>
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            <span>¿Estás seguro de que deseas activar al afiliado "{persona.Nombre_Completo}"?</span>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogAction
                                            onClick={() => handleToggleEstado(persona)}
                                            disabled={updateEstadoMutationFisico.isPending || updateEstadoMutationJuridico.isPending}
                                        >
                                            <span>Activar</span>
                                        </AlertDialogAction>
                                        <AlertDialogCancel>
                                            <span>Cancelar</span>
                                        </AlertDialogCancel>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        ) : null}
                    </div>
                );
            },
            size: 150,
        }),
    ];

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
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Cargando afiliados...</span>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center text-red-600 p-4">
                Error al cargar los afiliados. Por favor, intenta nuevamente.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Encabezado con filtro de estado, búsqueda y botón */}
            <div className="bg-white rounded-lg p-3">
                <div className="flex items-start gap-4 flex-col justify-start">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de afiliados</h2>
                    <p className="text-[10px] sm:text-sm text-gray-600 pb-2 sm:pb-4">Gestiona los afiliados de la ASADA</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center justify-end mt-2 sm:mt-0">
                    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4 w-full sm:w-auto">
                        <button
                            onClick={() => setIsFilterOpen(true)}
                            className={`px-2 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-sm border rounded-md sm:rounded-lg flex items-center justify-center gap-1 sm:gap-2 transition-colors ${
                                activeFiltersCount > 0
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <LuFilter className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Filtros</span>
                            {activeFiltersCount > 0 && (
                                <span className="bg-blue-500 text-white text-[9px] sm:text-xs rounded-full w-4 sm:w-5 h-4 sm:h-5 flex items-center justify-center">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>
                        <div className="relative flex-1 max-w-md w-full min-w-[120px]">
                            <LuSearch className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                            <input
                                type="text"
                                placeholder="Buscar afiliados..."
                                value={globalFilter ?? ''}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="w-full pl-6 sm:pl-10 pr-2 sm:pr-4 py-1.5 sm:py-2 text-[10px] sm:text-sm border border-gray-300 rounded-md sm:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        {hasCreatePermission && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-sm rounded-md sm:rounded-lg flex items-center justify-center gap-1 sm:gap-2 transition-colors whitespace-nowrap"
                            >
                                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Nuevo Afiliado</span>
                                <span className="sm:hidden">Nuevo</span>
                            </button>
                        )}
                        <button
                            onClick={() => navigate({ to: '/Afiliados/Lecturas' })}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-sm rounded-md sm:rounded-lg flex items-center justify-center gap-1 sm:gap-2 transition-colors"
                        >
                            Lecturas
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal de filtros */}
            <FilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                currentFilters={activeFilters}
                onApplyFilters={(f) => setActiveFilters(f)}
            />

            {/* Tabla con scroll vertical y horizontal */}
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
                                                    const mobileHeaderText = headerText === 'Nombre / Razón Social' ? 'Nombre/Razón' : headerText === 'Cédula / Documento' ? 'Cédula' : headerText === 'Tipo Persona' ? 'T. Pesona' : headerText === 'Tipo Afiliado' ? 'T. Afiliado' : headerText;

                                                    if (header.isPlaceholder) {
                                                        return null;
                                                    }
                                                    if (header.column.getCanSort()) {
                                                        return (
                                                            <button
                                                                type="button"
                                                                className={`cursor-pointer select-none flex items-center gap-2 bg-transparent border-none p-0 ${isActionsColumn ? 'justify-center' : 'justify-start'}`}
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
                                        {globalFilter ? 'No se encontraron afiliados que coincidan con la búsqueda' : 'No hay afiliados registrados'}
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

                {/* Paginación completa */}
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

            {/* Modal de detalle */}
            {showDetailModal && selectedPersona && (
                <DetailAbonados
                    persona={selectedPersona}
                    isOpen={showDetailModal}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedPersona(null);
                    }}
                />
            )}

            {/* Modal de crear nueva solicitud */}
            <CreateModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />

            {/* Modal de editar */}
            {showEditModal && selectedPersona && (
                <EditModal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedPersona(null);
                    }}
                    persona={selectedPersona}
                />
            )}

            <AsignarMedidorAfiliadoModal
                isOpen={showAsignarMedidorModal}
                afiliadoId={afiliadoParaAsignarMedidor?.Id ?? null}
                afiliadoNombre={afiliadoParaAsignarMedidor?.Nombre_Completo ?? ''}
                afiliadoTipo={tipoAfiliadoAsignar}
                onClose={() => {
                    setShowAsignarMedidorModal(false);
                    setAfiliadoParaAsignarMedidor(null);
                }}
                onSuccess={handleAsignacionMedidorExitosa}
            />
        </div>
    );
}