import React, { useState, useEffect } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table';
import {
  LuSearch,
  LuTrendingUp,
  LuTrendingDown,
  LuCalendar,
  LuUser,
  LuPlus,
  LuFilter
} from 'react-icons/lu';
import {
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
  MdKeyboardArrowUp,
  MdKeyboardArrowDown
} from "react-icons/md";
import {
  useGetAllMovimientos,
  useGetMovimientosEntradas,
  useGetMovimientosSalidas,
  useGetMovimientosEntreFechas
} from '../../hooks/useMovimientos';
import { getMovimientosLoadingState, getMovimientosErrorState } from '../../helper/MovimientosHelpers';
import DetailMovimientoModal from './DetailMovimientoModal';
import CreateMovimientoModal from './CreateMovimientoModal';
import FilterMovimientosModal from './FilterMovimientosModal';
import type { MovimientoMaterial } from '../../models/Inventario';
import type { MovimientoFilterOptions } from '../../types/MovimientosTypes';
import type { TipoMovimiento } from '../../models/MovimientoMaterial';

interface CatalogoMovimientosProps {
  onBack?: () => void;
}

const CatalogoMovimientos: React.FC<CatalogoMovimientosProps> = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedMovimiento, setSelectedMovimiento] = useState<MovimientoMaterial | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<MovimientoFilterOptions>({});

  const pageSizeOptions = [5, 10, 20, 50];
  const [pagination, setPagination] = useState({
    pageSize: 5,
    pageIndex: 0,
  });

  // Hooks para obtener movimientos según el tipo
  const { data: todosMovimientos = [], isLoading: isLoadingTodos, error: errorTodos, refetch: refetchTodos } = useGetAllMovimientos();
  const { data: movimientosEntradas = [], isLoading: isLoadingEntradas, error: errorEntradas, refetch: refetchEntradas } = useGetMovimientosEntradas();
  const { data: movimientosSalidas = [], isLoading: isLoadingSalidas, error: errorSalidas, refetch: refetchSalidas } = useGetMovimientosSalidas();

  // Hook para filtro por fechas - solo se habilita cuando hay fechas aplicadas
  const hasFechas = !!appliedFilters.fechaInicio && !!appliedFilters.fechaFin;
  const { data: movimientosPorFechas = [], isLoading: isLoadingFechas, error: errorFechas, refetch: refetchFechas } = useGetMovimientosEntreFechas(
    appliedFilters.fechaInicio || '',
    appliedFilters.fechaFin || '',
    hasFechas
  );

  // Seleccionar los datos según los filtros aplicados 
  const movimientos = React.useMemo(() => {
    // Prioridad 1: Filtro por fechas
    if (hasFechas) {
      return movimientosPorFechas;
    }

    // Prioridad 2: Filtro por tipo de movimiento
    if (appliedFilters.soloIngresos) {
      return movimientosEntradas;
    }
    if (appliedFilters.soloEgresos) {
      return movimientosSalidas;
    }

    // Default: todos los movimientos
    return todosMovimientos;
  }, [
    hasFechas,
    movimientosPorFechas,
    appliedFilters.soloIngresos,
    appliedFilters.soloEgresos,
    todosMovimientos,
    movimientosEntradas,
    movimientosSalidas
  ]);

  const isLoading = getMovimientosLoadingState(
    appliedFilters,
    hasFechas,
    {
      todos: isLoadingTodos,
      entradas: isLoadingEntradas,
      salidas: isLoadingSalidas,
      fechas: isLoadingFechas
    }
  );

  const error = getMovimientosErrorState(
    appliedFilters,
    hasFechas,
    {
      todos: errorTodos,
      entradas: errorEntradas,
      salidas: errorSalidas,
      fechas: errorFechas
    }
  );

  const refetch = () => {
    refetchTodos();
    refetchEntradas();
    refetchSalidas();
    if (hasFechas) refetchFechas();
  };

  // Refetch data cuando se actualice
  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener('refreshInventario', handler);
    return () => window.removeEventListener('refreshInventario', handler);
  }, [refetch]);


  const handleApplyFilters = (filters: MovimientoFilterOptions) => {
    setAppliedFilters(filters);
  };


  const activeFiltersCount = Object.values(appliedFilters).filter(value => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.length > 0;
    if (typeof value === 'number') return value > 0;
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null;
  }).length;


  const filteredMovimientos = React.useMemo(() => {
    let filtered = [...movimientos];


    // Filtro por tipo de movimiento específico 
    if (appliedFilters.tipoMovimiento && !appliedFilters.soloIngresos && !appliedFilters.soloEgresos && !hasFechas) {
      filtered = filtered.filter(mov =>
        mov.Tipo_Movimiento === appliedFilters.tipoMovimiento
      );
    }

    // Filtros secundarios que NO existen en el backend (material nombre, usuario nombre, cantidad)
    if (appliedFilters.materialNombre) {
      filtered = filtered.filter(mov =>
        mov.Material?.Nombre_Material?.toLowerCase().includes(appliedFilters.materialNombre!.toLowerCase())
      );
    }

    if (appliedFilters.usuario) {
      filtered = filtered.filter(mov =>
        mov.Usuario?.Nombre_Usuario?.toLowerCase().includes(appliedFilters.usuario!.toLowerCase())
      );
    }

    if (appliedFilters.cantidadMinima) {
      filtered = filtered.filter(mov =>
        mov.Cantidad >= appliedFilters.cantidadMinima!
      );
    }

    if (appliedFilters.cantidadMaxima) {
      filtered = filtered.filter(mov =>
        mov.Cantidad <= appliedFilters.cantidadMaxima!
      );
    }

    return filtered;
  }, [movimientos, appliedFilters]);

  const columnHelper = createColumnHelper<MovimientoMaterial>();

  const columns = [
    columnHelper.display({
      id: 'tipo',
      header: () => <><span className="hidden sm:inline">Tipo</span><span className="sm:hidden text-[9px]">Tipo</span></>,
      cell: ({ row }) => {
        const movimiento = row.original;
        const isIngreso = movimiento.Tipo_Movimiento?.includes('Entrada');

        return (
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            {isIngreso ? (
              <LuTrendingUp className="text-green-600 sm:w-4 sm:h-4 w-3 h-3" />
            ) : (
              <LuTrendingDown className="text-red-600 sm:w-4 sm:h-4 w-3 h-3" />
            )}
            <span className={`text-[9px] sm:text-sm font-medium whitespace-nowrap ${isIngreso ? 'text-green-700' : 'text-red-700'}`}>
              {movimiento.Tipo_Movimiento || 'N/A'}
            </span>
          </div>
        );
      },
      size: 120,
    }),

    columnHelper.accessor('Material.Nombre_Material', {
      id: 'material',
      header: () => <><span className="hidden sm:inline">Material</span><span className="sm:hidden text-[9px]">Material</span></>,
      cell: ({ getValue }) => {
        const nombre = getValue() || 'N/A';
        return (
          <div className="flex items-center justify-center">
        <span className="text-[10px] sm:text-sm font-medium" title={nombre.length > 12 ? nombre : undefined}>
            {nombre.length > 12 ? `${nombre.slice(0, 12)}...` : nombre}
          </span>
          </div>
          
        );
      },
      size: 200,
    }),

    columnHelper.accessor('Cantidad', {
      id: 'cantidad',
      header: () => <><span className="hidden sm:inline">Cantidad</span><span className="sm:hidden text-[9px]">Cant.</span></>,
      cell: ({ getValue, row }) => {
        const cantidad = getValue();
        const unidad = row.original.Material?.Unidad_Medicion;
        const nombreUnidad = unidad?.Nombre_Unidad_Medicion || '';

        return (
          <div className="flex items-center justify-center">
            <span className="text-[10px] sm:text-sm whitespace-nowrap">
              {cantidad?.toLocaleString()} {nombreUnidad}
            </span>
          </div>
        );
      },
      size: 120,
    }),

    columnHelper.accessor('Usuario.Nombre_Usuario', {
      id: 'usuario',
      header: () => <><span className="hidden sm:inline">Usuario</span><span className="sm:hidden text-[9px]">Usuario</span></>,
      cell: ({ getValue }) => (
        <div className="flex items-center justify-center gap-1 sm:gap-2">
          <LuUser className="text-gray-400 sm:w-4 sm:h-4 w-3 h-3 hidden sm:inline" />
          <span className="text-[10px] sm:text-sm whitespace-nowrap">{getValue() || 'N/A'}</span>
        </div>
      ),
      size: 150,
    }),

    columnHelper.accessor('Fecha_Movimiento', {
      id: 'fecha',
      header: () => <><span className="hidden sm:inline">Fecha</span><span className="sm:hidden text-[9px]">Fecha</span></>,
      cell: ({ getValue }) => {
        const fecha = getValue();
        if (!fecha) return 'N/A';

        const fechaObj = new Date(fecha);
        return (
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <LuCalendar className="text-gray-400 sm:w-4 sm:h-4 w-3 h-3 hidden sm:inline" />
            <span className="text-[10px] sm:text-sm whitespace-nowrap">
              {fechaObj.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              })}
            </span>
          </div>
        );
      },
      size: 120,
    }),

    columnHelper.display({
      id: 'stock_anterior',
      header: () => <><span className="hidden sm:inline">Stock Anterior</span><span className="sm:hidden text-[9px]">Ant.</span></>,
      cell: ({ row }) => {
        const movimiento = row.original;
        const unidad = movimiento.Material?.Unidad_Medicion;
        const nombreUnidad = unidad?.Nombre_Unidad_Medicion || '';

        return (
          <div className="flex items-center justify-center">
            <span className="text-[10px] sm:text-sm text-gray-600 whitespace-nowrap">
              {movimiento.Cantidad_Anterior?.toLocaleString() || '0'} {nombreUnidad}
            </span>
          </div>
        );
      },
      size: 120,
    }),

    columnHelper.display({
      id: 'stock_nuevo',
      header: () => <><span className="hidden sm:inline">Stock Actual</span><span className="sm:hidden text-[9px]">Act.</span></>,
      cell: ({ row }) => {
        const movimiento = row.original;
        const unidad = movimiento.Material?.Unidad_Medicion;
        const nombreUnidad = unidad?.Nombre_Unidad_Medicion || '';

        return (
          <div className="flex items-center justify-center">
            <span className="text-[10px] sm:text-sm font-medium whitespace-nowrap">
              {movimiento.Cantidad_Nueva?.toLocaleString() || '0'} {nombreUnidad}
            </span>
          </div>
        );
      },
      size: 120,
    }),

    columnHelper.display({
      id: 'acciones',
      header: () => <><span className="hidden sm:inline">Acciones</span><span className="sm:hidden text-[9px]">Acciones</span></>,
      cell: ({ row }) => (
        <div className="flex flex-row justify-center flex-nowrap gap-1 min-w-[50px] sm:min-w-[140px] overflow-visible">
          <button
            className="px-1.5 py-1 sm:px-4 sm:py-1 bg-gray-600 text-white text-[9px] sm:text-xs rounded hover:bg-gray-700 transition-colors w-auto whitespace-nowrap"
            onClick={() => handleViewDetails(row.original)}
            title="Ver detalles"
          >
            Ver
          </button>
        </div>
      ),
      size: 80,
      enableSorting: false,
    }),
  ];

  const table = useReactTable({
    data: filteredMovimientos,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  const handleViewDetails = (movimiento: MovimientoMaterial) => {
    setSelectedMovimiento(movimiento);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedMovimiento(null);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    refetch(); // Refrescar los datos después de crear
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando movimientos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error al cargar movimientos</div>
          <div className="text-gray-600">Por favor, intenta recargar la página</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-3">
        <div className="flex items-start gap-4 flex-col justify-start">
          <h2 className="text-2xl font-bold text-gray-900">Historial de Movimientos</h2>
          <p className="text-sm text-gray-600 pb-4">Registra los movimientos de entrada y salida de materiales</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 items-stretch sm:items-center justify-between pb-2">
          {/* Fila 1 en móvil: Filtros de Estado */}
          <div className="flex flex-row items-center justify-between gap-2 w-full sm:w-auto overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <label htmlFor="tipo-movimiento-filter-select" className="text-xs sm:text-sm font-medium text-gray-700">Tipo:</label>
              <select
                id="tipo-movimiento-filter-select"
                value={appliedFilters.tipoMovimiento || "todos"}
                onChange={(e) => handleApplyFilters({ ...appliedFilters, tipoMovimiento: e.target.value === "todos" ? undefined : e.target.value as TipoMovimiento })}
                className="px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
              >
                <option value="todos">Todos los tipos</option>
                <option value="Entrada">Entrada</option>
                <option value="Salida">Salida</option>
              </select>
            </div>
             <button
              onClick={() => setIsFilterModalOpen(true)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 border rounded-lg flex items-center gap-2 transition-colors text-xs sm:text-sm whitespace-nowrap ${
                activeFiltersCount > 0
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:bg-gray-50 text-gray-700'
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
          
          {/* Fila 2 en móvil: Búsqueda y Botón */}
          <div className="w-full flex gap-2 sm:flex-1 sm:max-w-md order-2 sm:order-none">
            <div className="relative w-full">
              <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Buscar movimientos..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
           
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg flex items-center gap-2 transition-colors text-xs sm:text-sm whitespace-nowrap"
            >
              <LuPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Nuevo Movimiento</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-sky-100 overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
          <table className="min-w-full table-auto">
            <thead className="bg-sky-50 sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="text-left text-xs sm:text-sm text-sky-700">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-2 sm:px-4 py-3 font-medium border-b border-sky-100 cursor-pointer"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <span className="flex items-center justify-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' && <MdKeyboardArrowUp className="inline" />}
                        {header.column.getIsSorted() === 'desc' && <MdKeyboardArrowDown className="inline" />}
                      </span>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-sky-50">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-2 sm:px-4 py-8 text-center text-slate-500">
                    {globalFilter ? 'No se encontraron movimientos que coincidan con la búsqueda' : 'No hay movimientos registrados'}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-sky-50 cursor-pointer transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-slate-700 align-top">
                        {typeof cell.column.columnDef.cell === 'function'
                          ? cell.column.columnDef.cell(cell.getContext())
                          : cell.getValue() as React.ReactNode}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>


         <div className="px-2 sm:px-4 md:px-6 py-2 md:py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-row items-center justify-between w-full gap-2">

            <div className="flex items-center gap-2 sm:gap-4 w-auto justify-start">
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-[10px] sm:text-xs md:text-sm text-gray-700 sm:inline">Filas por página:</span>
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={(e) => {
                    table.setPageSize(Number(e.target.value));
                  }}
                  className="px-1 sm:px-2 md:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {pageSizeOptions.map((pageSize) => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-1 w-auto">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="p-0.5 sm:p-2 rounded border text-gray-600 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Primera página"
              >
                <MdKeyboardDoubleArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-0.5 sm:p-2 rounded border text-gray-600 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Página anterior"
              >
                <MdKeyboardArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
              <span className="text-[9px] sm:text-xs md:text-sm text-gray-700 px-0.5 sm:px-2 whitespace-nowrap">
                {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
              </span>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-0.5 sm:p-2 rounded border text-gray-600 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Página siguiente"
              >
                <MdKeyboardArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="p-0.5 sm:p-2 rounded border text-gray-600 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Última página"
              >
                <MdKeyboardDoubleArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>


      {selectedMovimiento && (
        <DetailMovimientoModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          movimiento={selectedMovimiento}
        />
      )}

      <CreateMovimientoModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
      />

      <FilterMovimientosModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={appliedFilters}
      />
    </div>
  );
};

export default CatalogoMovimientos;