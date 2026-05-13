import { useState, useMemo } from "react";
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    createColumnHelper,
    flexRender,
} from '@tanstack/react-table';
import { LuPlus, LuSearch } from 'react-icons/lu';
import {
    MdKeyboardArrowLeft, MdKeyboardArrowRight, MdKeyboardDoubleArrowLeft,
    MdKeyboardDoubleArrowRight,
    MdKeyboardArrowDown,
    MdKeyboardArrowUp
} from "react-icons/md";
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
import {
    useGetProyectos,
    useToggleVisibilidadProyecto,
    useUpdateEstadoProyecto,
} from "../Hook/HookProyecto";

import { Eye, EyeOff } from "lucide-react";
import type { Proyecto } from "../Models/ProyectoModels";
import FormularioProyecto from "./ProyectoFormulario";
import ProyectoModal from "./ProyectoModal";
import ProyectoFormEdit from "./proyectiFormEdit";
import { useUserPermissions } from '@/Modules/Auth/Hooks/PermissionHook';


export default function ProyectoTable() {
    const { data: proyectos, isLoading, isError, refetch } = useGetProyectos();
    const { mutate: toggleVisibilidad } = useToggleVisibilidadProyecto();
    const updateEstadoMutation = useUpdateEstadoProyecto();
    const { canCreate, canEdit, canView } = useUserPermissions();

    const hasCreatePermission = canCreate('proyectos');
    const hasEditPermission = canEdit('proyectos');
    const hasViewPermission = canView('proyectos');

    const [globalFilter, setGlobalFilter] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<string>('Todos'); // Por defecto mostrar todos
    const [modalOpen, setModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [formVisible, setFormVisible] = useState(false);
    const [proyectoSeleccionado, setProyectoSeleccionado] = useState<Proyecto | null>(null);

    const pageSizeOptions = [5, 10, 20, 50];
    const [pagination, setPagination] = useState({
        pageSize: 5,
        pageIndex: 0,
    });

    // Filtrar proyectos por estado
    const proyectosFiltrados = useMemo(() => {
        if (!proyectos) return [];
        if (estadoFilter === 'Todos') return proyectos;

        return proyectos.filter(proyecto => {
            const estadoNombre = proyecto.Estado?.Nombre_Estado || '';
            return estadoNombre === estadoFilter;
        });
    }, [proyectos, estadoFilter]);

    const columnHelper = createColumnHelper<Proyecto>();

    const columns = useMemo(() => [
        columnHelper.accessor('Titulo', {
            header: () => <><span className="hidden sm:inline">Título</span><span className="sm:hidden text-[8px]">Título</span></>,
            cell: info => {
                const texto = info.getValue() || '';
                const truncatedDesktop = texto.length > 30 ? texto.substring(0, 30) + '...' : texto;
                const truncatedMobile = texto.length > 10 ? texto.substring(0, 10) + '...' : texto;
                return (
                    <div
                        className="font-medium transition-colors text-left flex items-center gap-2"
                        title={texto}
                    >
                        <span className="hidden sm:inline text-xs">{truncatedDesktop}</span>
                        <span className="sm:hidden text-[7px] whitespace-nowrap">{truncatedMobile}</span>
                    </div>
                );
            },
        }),
        columnHelper.accessor('Estado.Nombre_Estado', {
            header: () => <><span className="hidden sm:inline">Estado</span><span className="sm:hidden text-[8px]">Estado</span></>,
            cell: info => {
                const estado = info.getValue() || 'En Planeamiento';
                let colorClass = '';

                switch (estado) {
                    case 'En Planeamiento':
                        colorClass = 'bg-yellow-100 text-yellow-700 border border-yellow-300';
                        break;
                    case 'En Progreso':
                        colorClass = 'bg-blue-100 text-blue-700 border border-blue-300';
                        break;
                    case 'Terminado':
                        colorClass = 'bg-green-100 text-green-700 border border-green-300';
                        break;
                    default:
                        colorClass = 'bg-gray-200 text-gray-700 border border-gray-300';
                }

                return (
                    <div className="flex justify-start">
                        <span className={`px-1.5 sm:px-3 py-0.5 sm:py-1 text-[7px] sm:text-xs font-semibold rounded-full whitespace-nowrap ${colorClass}`}>
                            {estado}
                        </span>
                    </div>
                );
            },
        }),
        columnHelper.accessor('Fecha_Actualizacion', {
            header: () => <><span className="hidden sm:inline">Fecha de Actualización</span><span className="sm:hidden text-[8px]">F. Actualización</span></>,
            cell: info => (
                <div className="text-gray-600 text-left text-[7px] sm:text-xs">
                    {new Date(info.getValue()).toLocaleDateString("es-ES")}
                </div>
            ),
        }),
        columnHelper.accessor('Visible', {
            header: () => <><span className="hidden sm:inline">Visibilidad</span><span className="sm:hidden text-[8px]">Visibilidad</span></>,
            cell: info => {
                const visible = info.getValue();
                return hasEditPermission ? (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button className="flex justify-start">
                                <span className={`inline-flex items-center gap-1 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-[7px] sm:text-xs font-medium ${visible
                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                                    } transition-colors`}>
                                    {visible ? <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <EyeOff className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                                    <span className=" sm:inline">{visible ? 'Visible' : 'Oculto'}</span>
                                </span>
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    <span>¿Cambiar visibilidad?</span>
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    <span>¿Estás seguro de que deseas {visible ? 'ocultar' : 'mostrar'} el proyecto "{info.row.original.Titulo.length > 15 ? info.row.original.Titulo.substring(0, 15) + '...' : info.row.original.Titulo}"?</span>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogAction
                                    onClick={() => toggleVisibilidad(info.row.original.Id_Proyecto)}
                                >
                                    <span>Confirmar</span>
                                </AlertDialogAction>
                                <AlertDialogCancel>
                                    <span>Cancelar</span>
                                </AlertDialogCancel>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                ) : (
                    <span className={`inline-flex items-center gap-1 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-[7px] sm:text-xs font-medium ${visible
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                        {visible ? <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <EyeOff className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                        <span className=" sm:inline">{visible ? 'Visible' : 'Oculto'}</span>
                    </span>
                );
            },
        }),
        columnHelper.display({
            id: 'acciones',
            header: () => <><span className="hidden sm:inline">Acciones</span><span className="sm:hidden text-[8px]">Acciones</span></>,
            cell: info => (
                <div className="flex justify-center gap-1">
                    {hasViewPermission && (
                        <button
                            className="px-1.5 sm:px-4 py-0.5 sm:py-1 bg-gray-600 text-white text-[7px] sm:text-xs rounded hover:bg-gray-700 transition-colors"
                            onClick={() => handleViewDetail(info.row.original)}
                            title="Ver detalles"
                        >
                            Ver
                        </button>
                    )}
                    {hasEditPermission && (
                        <button
                            className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-600 text-white text-[7px] sm:text-xs rounded hover:bg-blue-700 transition-colors"
                            onClick={() => handleEdit(info.row.original)}
                            title="Editar"
                        >
                            Editar
                        </button>
                    )}
                    {hasEditPermission && (() => {

                        const estadoId = info.row.original.Estado?.Id_Estado_Proyecto;

                        switch (estadoId) {
                            case 1: // En Planeamiento
                                return (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <button
                                                className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-600 text-white text-[7px] sm:text-xs rounded hover:bg-green-700 transition-colors"
                                                disabled={updateEstadoMutation.isPending}
                                                title="Iniciar Proyecto"
                                            >
                                                Iniciar
                                            </button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    <span>¿Iniciar proyecto?</span>
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    <span>¿Estás seguro de que deseas cambiar el estado del proyecto "{info.row.original.Titulo.length > 30 ? info.row.original.Titulo.substring(0, 30) + '...' : info.row.original.Titulo}" a "En Progreso"?</span>
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogAction
                                                    onClick={() => handleToggleEstado(info.row.original)}
                                                    disabled={updateEstadoMutation.isPending}
                                                >
                                                    <span>Iniciar Proyecto</span>
                                                </AlertDialogAction>
                                                <AlertDialogCancel>
                                                    <span>Cancelar</span>
                                                </AlertDialogCancel>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                );
                            case 2: // En Progreso
                                return (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <button
                                                className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-600 text-white text-[7px] sm:text-xs rounded hover:bg-green-700 transition-colors"
                                                disabled={updateEstadoMutation.isPending}
                                                title="Marcar como Terminado"
                                            >
                                                Terminar
                                            </button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    <span>¿Marcar como terminado?</span>
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    <span>¿Estás seguro de que deseas marcar el proyecto "{info.row.original.Titulo.length > 30 ? info.row.original.Titulo.substring(0, 30) + '...' : info.row.original.Titulo}" como terminado?</span>
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogAction
                                                    onClick={() => handleToggleEstado(info.row.original)}
                                                    disabled={updateEstadoMutation.isPending}
                                                >
                                                    <span>Marcar como Terminado</span>
                                                </AlertDialogAction>
                                                <AlertDialogCancel>
                                                    <span>Cancelar</span>
                                                </AlertDialogCancel>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                );
                            case 3: // Terminado
                                return (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <button
                                                className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-orange-600 text-white text-[7px] sm:text-xs rounded hover:bg-orange-700 transition-colors"
                                                disabled={updateEstadoMutation.isPending}
                                                title="Reabrir Proyecto"
                                            >
                                                Reabrir
                                            </button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    <span>¿Reabrir proyecto?</span>
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    <span>¿Estás seguro de que deseas reabrir el proyecto "{info.row.original.Titulo.length > 30 ? info.row.original.Titulo.substring(0, 30) + '...' : info.row.original.Titulo}" y cambiar su estado a "En Progreso"?</span>
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogAction
                                                    onClick={() => handleToggleEstado(info.row.original)}
                                                    disabled={updateEstadoMutation.isPending}
                                                >
                                                    <span>Reabrir Proyecto</span>
                                                </AlertDialogAction>
                                                <AlertDialogCancel>
                                                    <span>Cancelar</span>
                                                </AlertDialogCancel>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                );
                            default:
                                return null;
                        }
                    })()}
                </div>
            ),
        }),
    ], [updateEstadoMutation.isPending]);

    const table = useReactTable({
        data: proyectosFiltrados,
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

    const handleViewDetail = (proyecto: Proyecto) => {
        setProyectoSeleccionado(proyecto);
        setModalOpen(true);
    };

    const handleEdit = (proyecto: Proyecto) => {
        setProyectoSeleccionado(proyecto);
        setEditModalOpen(true);
    };

    const handleToggleEstado = async (proyecto: Proyecto) => {
        try {
            const estadoActual = proyecto.Estado?.Id_Estado_Proyecto;
            let nuevoEstadoId: number;

            // Lógica de transición de estados
            switch (estadoActual) {
                case 1: // En Planeamiento -> En Progreso
                    nuevoEstadoId = 2;
                    break;
                case 2: // En Progreso -> Terminado
                    nuevoEstadoId = 3;
                    break;
                case 3: // Terminado -> En Progreso (reabrir)
                    nuevoEstadoId = 2;
                    break;
                default:
                    nuevoEstadoId = 1; // fallback
            }

            await updateEstadoMutation.mutateAsync({
                id: proyecto.Id_Proyecto,
                nuevoEstadoId,
            });
        } catch (error) {
            console.error('Error al cambiar estado del proyecto:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Cargando proyectos...</span>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center text-red-600 p-4">
                Error al cargar los proyectos. Por favor, intenta nuevamente.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Encabezado con filtro de estado, búsqueda y botón */}
            <div className="bg-white rounded-lg p-3">
                <div className="flex items-start gap-4 flex-col justify-start">
                    <h2 className="text-2xl font-bold text-gray-900">Edición de Proyectos</h2>
                    <p className="text-sm text-gray-600 pb-4">Gestiona los proyectos de la ASADA</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-4 text-[10px] sm:text-xs">
                        <label htmlFor='estado' className="font-medium text-gray-700">Estado:</label>
                        <select
                            id='estado'
                            value={estadoFilter}
                            onChange={(e) => setEstadoFilter(e.target.value)}
                            className="px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[10px] sm:text-xs"
                        >
                            <option value="Todos">Todos los proyectos</option>
                            <option value="En Planeamiento">En Planeamiento</option>
                            <option value="En Progreso">En Progreso</option>
                            <option value="Terminado">Terminado</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="relative flex-1 max-w-md">
                            <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                            <input
                                type="text"
                                placeholder="Buscar proyectos..."
                                value={globalFilter ?? ''}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[10px] sm:text-xs"
                            />
                        </div>
                        {hasCreatePermission && (
                            <button
                                onClick={() => setFormVisible(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md flex items-center gap-2 transition-colors text-[10px] sm:text-xs whitespace-nowrap"
                            >
                                <LuPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                                Nuevo Proyecto
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-sky-100 overflow-hidden max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full table-auto">
                        <thead className="bg-sky-50">
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id} className="text-left text-[10px] sm:text-xs text-sky-700">
                                    {headerGroup.headers.map((header, index) => (
                                        <th key={header.id} className={`px-2 sm:px-4 py-2 font-medium border-b border-sky-100 ${index === 0 ? 'text-left' : 'text-center'
                                            }`}>
                                            {(() => {
                                                if (header.isPlaceholder) {
                                                    return null;
                                                }
                                                if (header.column.getCanSort()) {
                                                    return (
                                                        <button
                                                            type="button"
                                                            className={`cursor-pointer select-none flex items-center gap-1 bg-transparent border-none p-0 ${index === 0 ? 'justify-start' : 'justify-center'
                                                                }`}
                                                            onClick={header.column.getToggleSortingHandler()}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter' || e.key === ' ') {
                                                                    e.preventDefault();
                                                                    header.column.getToggleSortingHandler()?.(e);
                                                                }
                                                            }}
                                                            tabIndex={0}
                                                        >
                                                            <span className="flex items-center gap-1">
                                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                                {header.column.getIsSorted() === 'asc' && <MdKeyboardArrowUp className="inline w-3 h-3" />}
                                                                {header.column.getIsSorted() === 'desc' && <MdKeyboardArrowDown className="inline w-3 h-3" />}
                                                            </span>
                                                        </button>
                                                    );
                                                }
                                                return (
                                                    <span className={index === 0 ? 'text-left' : 'text-center'}>
                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                    </span>
                                                );
                                            })()}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="bg-white divide-y divide-sky-50">
                            {table.getRowModel().rows.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-2 sm:px-4 py-8 text-center text-slate-500 text-[10px] sm:text-xs">
                                        {globalFilter ? 'No se encontraron proyectos que coincidan con la búsqueda' : 'No hay proyectos registrados'}
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map(row => (
                                    <tr key={row.id} className="hover:bg-sky-50 cursor-pointer transition-colors">
                                        {row.getVisibleCells().map((cell, index) => (
                                            <td key={cell.id} className={`px-2 sm:px-4 py-2 text-[10px] sm:text-xs text-slate-700 align-middle ${index === 0 ? 'text-left' : 'text-center'
                                                }`}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] sm:text-xs text-gray-700">Filas por página:</span>
                                <select
                                    value={table.getState().pagination.pageSize}
                                    onChange={(e) => {
                                        table.setPageSize(Number(e.target.value));
                                    }}
                                    className="px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                                className="p-0.5 sm:p-1 rounded-md border bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Primera página"
                            >
                                <MdKeyboardDoubleArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            <button
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                                className="p-0.5 sm:p-1 rounded-md border bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Página anterior"
                            >
                                <MdKeyboardArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            <span className="text-[10px] sm:text-xs text-gray-700 whitespace-nowrap">
                                {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                            </span>
                            <button
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                                className="p-0.5 sm:p-1 rounded-md border bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Página siguiente"
                            >
                                <MdKeyboardArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            <button
                                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                disabled={!table.getCanNextPage()}
                                className="p-0.5 sm:p-1 rounded-md border bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Última página"
                            >
                                <MdKeyboardDoubleArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal para ver */}
            {modalOpen && proyectoSeleccionado && (
                <ProyectoModal
                    isOpen={modalOpen}
                    onClose={() => {
                        setModalOpen(false);
                        setProyectoSeleccionado(null);
                    }}
                    proyecto={proyectoSeleccionado}
                    refetch={refetch}
                />
            )}

            {/* Modal para editar */}
            {editModalOpen && proyectoSeleccionado && (
                <ProyectoFormEdit
                    onClose={() => {
                        setEditModalOpen(false);
                        setProyectoSeleccionado(null);
                    }}
                    proyecto={proyectoSeleccionado}
                />
            )}

            {/* Formulario para crear */}
            {formVisible && (
                <FormularioProyecto
                    id={0}
                    tituloInicial=""
                    descripcionInicial=""
                    onClose={() => setFormVisible(false)}
                    refetch={refetch}
                />
            )}
        </div>
    );
}
