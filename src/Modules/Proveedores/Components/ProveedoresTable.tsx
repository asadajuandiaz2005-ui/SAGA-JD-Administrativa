import { useMemo, useState } from 'react';
import { createColumnHelper, getCoreRowModel, getPaginationRowModel, useReactTable, type ColumnDef, getFilteredRowModel, getSortedRowModel, flexRender } from '@tanstack/react-table';
import { useProveedoresFisicos } from '../Hook/hookFisicoProveedor';
import { useProveedoresJuridicos } from '../Hook/hookjuridicoproveedor';
import { formatCedulaJuridica, formatPhoneNumberDisplay } from '../Schema/SchemaProveedorJuridico';
import type { ProveedorFisico } from '../Models/TablaProveedo/tablaFisicoProveedor';
import type { ProveedorJuridico } from '../Models/TablaProveedo/tablaJuridicoProveedor';
import { LuFilter, LuSearch } from 'react-icons/lu';
import { MdKeyboardArrowUp, MdKeyboardArrowDown, MdKeyboardDoubleArrowLeft, MdKeyboardArrowLeft, MdKeyboardArrowRight, MdKeyboardDoubleArrowRight } from 'react-icons/md';
import ActionButtons from './ActionButtons';
import FilterProveedorModal from './FilterProveedorModal';
import ProveedorDetailModal from './DetailFisicoProveedor';
import ProveedorJuridicoDetailModal from './DetailJuridicoProveedor';
import EditFisicoProveedoresModal from './EditFisicoProveedoresModal';
import EditJuridicoProveedorModal from './EditJuridicoProveedorModal';
import CreateModalProveedor from './CreateModalProveedor';
import { useUserPermissions } from '@/Modules/Auth/Hooks/PermissionHook';


// Tipo unificado para la tabla (similar al patrón de AbonadosTable)
type ProveedorUnificado = {
    Id_Proveedor: number;
    Nombre_Proveedor: string;
    Telefono_Proveedor: string;
    Identificacion_Unificada: string; // Campo unificado para ambos tipos
    Tipo_Identificacion_Unificada: string; // Campo unificado para ambos tipos
    Estado_Proveedor: {
        Id_Estado_Proveedor: number;
        Estado_Proveedor: string;
    };
    Tipo_Proveedor: 'Físico' | 'Jurídico';
    Razon_Social?: string; // Solo para jurídicos
    Fecha_Creacion: string;
    Fecha_Actualizacion: string;
    datos_originales: ProveedorFisico | ProveedorJuridico;
};

export default function ProveedoresTable() {
    // Hooks para obtener ambos tipos de proveedores
    const { proveedoresFisicos, } = useProveedoresFisicos();
    const { proveedoresJuridicos, } = useProveedoresJuridicos();
    const { canCreate } = useUserPermissions();

    const hasCreatePermission = canCreate('proveedores');

    const [globalFilter, setGlobalFilter] = useState('');
    // Filtros específicos solicitados: por tipo y por estado
    const [tipoFilter, setTipoFilter] = useState<'Todos' | 'Físico' | 'Jurídico'>('Todos');
    const [estadoFilter, setEstadoFilter] = useState<string>('Todos');
    // Estado para la paginación
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 5,
    });
    // Opciones de tamaño de página para la paginación
    const pageSizeOptions = [5, 10, 20, 50];
    // Estados para los modales de detalle
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showJuridicoDetailModal, setShowJuridicoDetailModal] = useState(false);
    const [selectedProveedorFisico, setSelectedProveedorFisico] = useState<ProveedorFisico | null>(null);
    const [selectedProveedorJuridico, setSelectedProveedorJuridico] = useState<ProveedorJuridico | null>(null);

    // Estado para el modal de edición
    const [showEditModal, setShowEditModal] = useState(false);
    const [proveedorEdit, setProveedorEdit] = useState<ProveedorUnificado | null>(null);

    // Estados para el modal de creación
    const [showCreateModal, setShowCreateModal] = useState(false);
    // Estado para abrir el modal de filtros avanzados
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Combinar ambos tipos de proveedores en una lista unificada (similar a AbonadosTable)
    const proveedoresUnificados = useMemo((): ProveedorUnificado[] => {
        const fisicosMapeados: ProveedorUnificado[] = proveedoresFisicos.map((proveedor: ProveedorFisico) => ({
            Id_Proveedor: proveedor.Id_Proveedor,
            Nombre_Proveedor: proveedor.Nombre_Proveedor,
            Telefono_Proveedor: proveedor.Telefono_Proveedor,
            Identificacion_Unificada: proveedor.Identificacion || 'Sin identificación',
            Tipo_Identificacion_Unificada: proveedor.Tipo_Identificacion || 'Sin tipo',
            Estado_Proveedor: proveedor.Estado_Proveedor,
            Tipo_Proveedor: 'Físico' as const,
            Fecha_Creacion: proveedor.Fecha_Creacion,
            Fecha_Actualizacion: proveedor.Fecha_Actualizacion,
            datos_originales: proveedor
        }));

        const juridicosMapeados: ProveedorUnificado[] = proveedoresJuridicos.map((proveedor: ProveedorJuridico) => ({
            Id_Proveedor: proveedor.Id_Proveedor,
            Nombre_Proveedor: proveedor.Razon_Social || proveedor.Nombre_Proveedor, // Usar Razón Social como nombre principal para la tabla
            Telefono_Proveedor: proveedor.Telefono_Proveedor,
            Identificacion_Unificada: formatCedulaJuridica(proveedor.Cedula_Juridica || ''), // Aplicar formato
            Tipo_Identificacion_Unificada: 'Cédula Jurídica',
            Estado_Proveedor: proveedor.Estado_Proveedor,
            Tipo_Proveedor: 'Jurídico' as const,
            Razon_Social: proveedor.Razon_Social,
            Fecha_Creacion: proveedor.Fecha_Creacion,
            Fecha_Actualizacion: proveedor.Fecha_Actualizacion,
            datos_originales: proveedor
        }));

        return [...fisicosMapeados, ...juridicosMapeados]
            .sort((a, b) => a.Id_Proveedor - b.Id_Proveedor);
    }, [proveedoresFisicos, proveedoresJuridicos]);

    // Lista de estados únicos para poblar el select de estados
    const estadosUnicos = useMemo(() => {
        const setEstados = new Set<string>();
        proveedoresUnificados.forEach(p => {
            const nombre = p.Estado_Proveedor?.Estado_Proveedor || 'Sin estado';
            setEstados.add(nombre);
        });
        return ['Todos', ...Array.from(setEstados)];
    }, [proveedoresUnificados]);

    const activeFiltersCount = useMemo(() => {
        let c = 0;
        if (tipoFilter && tipoFilter !== 'Todos') c++;
        if (estadoFilter && estadoFilter !== 'Todos') c++;
        if (globalFilter && globalFilter.trim() !== '') c++;
        return c;
    }, [tipoFilter, estadoFilter, globalFilter]);

    const filteredData = useMemo(() => {
        // Primero aplicar filtro global (texto)
        const q = globalFilter?.toLowerCase() || '';
        let data = proveedoresUnificados.filter((proveedor) => {
            if (!q) return true;
            const searchFields = [
                proveedor.Nombre_Proveedor,
                proveedor.Telefono_Proveedor,
                proveedor.Estado_Proveedor?.Estado_Proveedor,
                proveedor.Tipo_Proveedor,
                proveedor.Identificacion_Unificada,
                proveedor.Tipo_Identificacion_Unificada,
                proveedor.Razon_Social
            ];

            return searchFields
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .includes(q);
        });

        // Aplicar filtro por tipo si no es 'Todos'
        if (tipoFilter && tipoFilter !== 'Todos') {
            data = data.filter(p => p.Tipo_Proveedor === tipoFilter);
        }

        // Aplicar filtro por estado si no es 'Todos'
        if (estadoFilter && estadoFilter !== 'Todos') {
            data = data.filter(p => (p.Estado_Proveedor?.Estado_Proveedor || 'Sin estado') === estadoFilter);
        }

        return data;
    }, [proveedoresUnificados, globalFilter, tipoFilter, estadoFilter]);

    const columnHelper = createColumnHelper<ProveedorUnificado>();
    const columns: ColumnDef<ProveedorUnificado, any>[] = [
        columnHelper.accessor('Tipo_Proveedor', {
            header: () => <><span className="hidden sm:inline">Tipo</span><span className="sm:hidden text-[8px]">Tipo</span></>,
            cell: (info) => {
                const tipo = info.getValue();
                return (
                    <span className={`inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[7px] sm:text-xs font-medium whitespace-nowrap ${tipo === 'Físico'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-blue-100 text-blue-700'
                        }`}>
                        {tipo}
                    </span>
                );
            },
            size: 100
        }),
        columnHelper.accessor('Nombre_Proveedor', {
            header: () => <><span className="hidden sm:inline">Nombre / Razón Social</span><span className="sm:hidden text-[8px]">Nombre</span></>,
            cell: (info) => {
                const nombre = info.getValue();
                return <div className='flex items-center justify-start text-[7px] sm:text-sm font-medium'>{nombre || 'Sin nombre'}</div>;
            }
        }),

        columnHelper.accessor('Identificacion_Unificada', {
            header: () => <><span className="hidden sm:inline">Identificación</span><span className="sm:hidden text-[8px]">Identificación</span></>,
            cell: (info) => {
                const proveedor = info.row.original;

                return (
                    <div className='flex items-center justify-start'>
                        <div className="flex flex-col">
                            <span className="font-medium text-start text-[7px] sm:text-sm">{proveedor.Identificacion_Unificada}</span>
                            <span className="text-[7px] sm:text-xs text-start text-slate-500 whitespace-nowrap">
                                {proveedor.Tipo_Proveedor === 'Jurídico'
                                    ? 'Cédula Jurídica'
                                    : proveedor.Tipo_Identificacion_Unificada
                                }
                            </span>
                        </div>
                    </div>
                );
            },
            size: 160
        }),

        columnHelper.accessor('Telefono_Proveedor', {
            header: () => <><span className="hidden sm:inline">Teléfono</span><span className="sm:hidden text-[8px]">Teléfono</span></>,
            cell: (info) => {
                const telefono = info.getValue();
                if (!telefono) return <div className='text-[7px] sm:text-sm text-gray-500 italic'>Sin teléfono</div>;

                // Formatear el número para mejor visualización
                // Si hay múltiples teléfonos separados por coma o guión, intentamos mantenerlos en una sola línea
                const formattedPhone = formatPhoneNumberDisplay(telefono);
                return <div className='flex items-center justify-start whitespace-nowrap gap-1'><span className="text-[7px] sm:text-sm">{formattedPhone}</span></div>;
            },
        }),
        columnHelper.accessor('Estado_Proveedor', {
            header: () => <><span className="hidden sm:inline">Estado</span><span className="sm:hidden text-[8px]">Estado</span></>,
            cell: (info) => {
                const estado = info.getValue();
                const estadoNombre = estado?.Estado_Proveedor || 'Sin estado';
                const base = 'px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[7px] sm:text-xs font-semibold whitespace-nowrap';

                if (estadoNombre.toLowerCase() === 'activo') {
                    return (
                        <div className='flex items-center justify-start'>
                            <span className={`${base} bg-emerald-100 text-emerald-700 border border-emerald-300`}>Activo</span>
                        </div>
                    );
                } else if (estadoNombre.toLowerCase() === 'inactivo') {
                    return (
                        <div className='flex items-center justify-start'>
                            <span className={`${base} bg-red-100 text-red-700 border border-red-300`}>Inactivo</span>
                        </div>
                    );
                }

                return null;
            },

        }),
        columnHelper.display({
            id: 'actions',
            header: () => <><span className="hidden sm:inline">Acciones</span><span className="sm:hidden text-[8px]">Acción</span></>,
            cell: (info) => {
                const proveedor = info.row.original;
                const tipoProveedor = proveedor.Tipo_Proveedor;
                return (
                    <div className="flex items-center justify-center gap-1">
                        <ActionButtons
                            proveedor={proveedor.datos_originales}
                            tipoProveedor={tipoProveedor}
                        />
                    </div>
                );
            }
        })
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

    return (
        <div className="w-full ">
            <div className="gap-4 mb-4 bg-white rounded-lg p-3 w-full">
                <div className='p-2 sm:p-4 border-b border-gray-100'>
                    <div className="flex items-start gap-2 sm:gap-4 flex-col justify-start">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de Proveedores</h2>
                        <p className="text-xs sm:text-sm text-gray-600 pb-2 sm:pb-4">Gestiona los proveedores del sistema</p>
                    </div>
                </div>
                
                <div className="flex flex-col gap-3 sm:flex-row items-stretch sm:items-center justify-end pt-2">
                   <div className="flex w-full sm:w-auto overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                       <button
                            onClick={() => setIsFilterOpen(true)}
                            className={`px-3 py-1.5 sm:px-4 sm:py-2 border rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap text-xs sm:text-sm w-full sm:w-auto ${
                            activeFiltersCount > 0
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <LuFilter className="w-4 h-4" />
                            Filtros
                            {activeFiltersCount > 0 && (
                            <span className="bg-blue-500 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                                {activeFiltersCount}
                            </span>
                            )}
                        </button>
                   </div>

                    <div className="w-full flex gap-2 sm:flex-1 sm:max-w-md">
                        <div className="relative w-full">
                            <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={globalFilter ?? ''}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        {hasCreatePermission && (
                            <button
                                className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 whitespace-nowrap text-xs sm:text-sm"
                                onClick={() => setShowCreateModal(true)}
                            >
                                <span className="hidden sm:inline">+ Nuevo Proveedor</span>
                                <span className="sm:hidden">+ Nuevo</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de filtros avanzado */}
            <FilterProveedorModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                currentFilters={{ tipo: tipoFilter, estado: estadoFilter }}
                estadosOptions={estadosUnicos}
                onApply={(f) => {
                    setTipoFilter(f.tipo);
                    setEstadoFilter(f.estado);
                }}
            />

            <div className="bg-white rounded-2xl shadow-sm border border-sky-100 overflow-hidden max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100 mb-4">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
                    <table className="min-w-full table-auto">
                        <thead className="bg-sky-50">
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id} className="text-left text-xs sm:text-sm text-sky-700">
                                    {headerGroup.headers.map((header, index) => (
                                        <th key={header.id} className={`px-2 sm:px-4 py-3 font-medium border-b border-sky-100 ${index === 0 ? 'text-left' : 'text-center'
                                            }`}>
                                            {(() => {
                                                if (header.isPlaceholder) {
                                                    return null;
                                                }
                                                if (header.column.getCanSort()) {
                                                    return (
                                                        <button
                                                            type="button"
                                                            className={`cursor-pointer select-none flex items-center gap-2 bg-transparent border-none p-0 ${index === 0 ? 'justify-start' : 'justify-center'
                                                                }`}
                                                            onClick={header.column.getToggleSortingHandler()}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter' || e.key === ' ') {
                                                                    e.preventDefault();
                                                                    header.column.getToggleSortingHandler()?.(e);
                                                                }
                                                            }}
                                                            tabIndex={0}
                                                            aria-label="Ordenar"
                                                        >
                                                            <span className="flex items-center gap-1">
                                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                                {header.column.getIsSorted() === 'asc' && <MdKeyboardArrowUp className="inline" />}
                                                                {header.column.getIsSorted() === 'desc' && <MdKeyboardArrowDown className="inline" />}
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
                                    <td colSpan={columns.length} className="px-2 sm:px-4 py-8 text-center text-xs sm:text-sm text-slate-500">
                                        {globalFilter ? 'No se encontraron proveedores que coincidan con la búsqueda' : 'No hay proveedores registrados'}
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
                                                <td key={cell.id} className={`px-2 sm:px-4 py-3 text-xs sm:text-sm text-slate-700 align-top ${index === 0 ? 'text-left' : 'text-center'
                                                    }`}>
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

                <div className="bg-gray-50 px-3 sm:px-6 py-2 sm:py-3 border-t border-gray-200 flex flex-row items-center justify-between gap-2 overflow-x-auto scrollbar-none">
                    <div className="flex items-center gap-1 sm:gap-2 whitespace-nowrap">
                        <span className='text-[10px] sm:text-sm text-gray-700'>Filas por página:</span>
                        <select
                            value={table.getState().pagination.pageSize}
                            onChange={(e) => {
                                table.setPageSize(Number(e.target.value));
                            }}
                            className="border border-gray-300 rounded-md px-1 sm:px-2 py-0.5 sm:py-1 text-[8px] sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            {pageSizeOptions.map((pageSize) => (
                                <option key={pageSize} value={pageSize}>
                                    {pageSize}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-1 whitespace-nowrap">
                        <button
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                            className="p-1 sm:p-2 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Primera página"
                        >
                            <MdKeyboardDoubleArrowLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                        </button>
                        <button
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="p-1 sm:p-2 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Página anterior"
                        >
                            <MdKeyboardArrowLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                        </button>
                        <span className="px-1.5 sm:px-2 py-1 text-[10px] sm:text-sm whitespace-nowrap">
                            Pág. {table.getState().pagination.pageIndex + 1} de{' '}
                            {table.getPageCount() || 1}
                        </span>
                        <button
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="p-1 sm:p-2 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Página siguiente"
                        >
                            <MdKeyboardArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                        </button>
                        <button
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                            className="p-1 sm:p-2 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Última página"
                        >
                            <MdKeyboardDoubleArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal de detalle de proveedores físicos */}
            <ProveedorDetailModal
                proveedor={selectedProveedorFisico}
                isOpen={showDetailModal}
                onClose={() => {
                    setShowDetailModal(false);
                    setSelectedProveedorFisico(null);
                }}
            />

            {/* Modal de detalle de proveedores jurídicos */}
            <ProveedorJuridicoDetailModal
                proveedor={selectedProveedorJuridico}
                isOpen={showJuridicoDetailModal}
                onClose={() => {
                    setShowJuridicoDetailModal(false);
                    setSelectedProveedorJuridico(null);
                }}
            />

            {/* Modal de edición fuera de la tabla, controlado por el estado global */}
            {showEditModal && proveedorEdit && (
                proveedorEdit.Tipo_Proveedor === 'Físico' ? (
                    <EditFisicoProveedoresModal
                        isOpen={showEditModal}
                        onClose={() => { setShowEditModal(false); setProveedorEdit(null); }}
                        proveedor={proveedorEdit.datos_originales as ProveedorFisico}
                    />
                ) : (
                    <EditJuridicoProveedorModal
                        isOpen={showEditModal}
                        onClose={() => { setShowEditModal(false); setProveedorEdit(null); }}
                        proveedor={proveedorEdit.datos_originales as ProveedorJuridico}
                    />
                )
            )}
            {showCreateModal && (
                <CreateModalProveedor
                    onClose={() => setShowCreateModal(false)}
                />
            )}
        </div>
    );
}