import React, { useState, useMemo } from 'react';
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
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight, 
  MdKeyboardArrowDown,
  MdKeyboardArrowUp} from "react-icons/md";
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
import { useUnidadesMedicion, useUnidadesMedicionActivas, useUnidadesMedicionInactivas, useUpdateEstadoUnidadMedicion } from '../../hooks/HookUnidadMedicion';
import CreateUnidadMedicionModal from './CreateUnidadMedicionModal';
import EditUnidadMedicionModal from './EditUnidadMedicionModal';
import DetailUnidadMedicionModal from './DetailUnidadMedicionModal';
import type { UnidadMedicion } from '../../models/Inventario';

interface UnidadesMedicionManagementProps {
  onBack?: () => void;
}

const UnidadesMedicionManagement: React.FC<UnidadesMedicionManagementProps> = () => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUnidad, setSelectedUnidad] = useState<UnidadMedicion | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<string>('Todas'); // Por defecto mostrar todas
  const pageSizeOptions = [5, 10, 20, 50];
  const [pagination, setPagination] = useState({
    pageSize: 5,
    pageIndex: 0,
  });

  // Usar diferentes hooks según el filtro de estado
  const { data: todasUnidades = [], isLoading: isLoadingTodas, error: errorTodas } = useUnidadesMedicion();
  const { data: unidadesActivas = [], isLoading: isLoadingActivas, error: errorActivas } = useUnidadesMedicionActivas();
  const { data: unidadesInactivas = [], isLoading: isLoadingInactivas, error: errorInactivas } = useUnidadesMedicionInactivas();
  const updateEstadoMutation = useUpdateEstadoUnidadMedicion();

  // Seleccionar los datos según el filtro
  const unidades = useMemo(() => {
    if (estadoFilter === 'Todas') {
      return todasUnidades;
    } else if (estadoFilter === 'Activo') {
      return unidadesActivas;
    } else {
      return unidadesInactivas;
    }
  }, [estadoFilter, todasUnidades, unidadesActivas, unidadesInactivas]);

  // Determinar el estado de carga y error
  let isLoading: boolean;
  if (estadoFilter === 'Todas') {
    isLoading = isLoadingTodas;
  } else if (estadoFilter === 'Activo') {
    isLoading = isLoadingActivas;
  } else {
    isLoading = isLoadingInactivas;
  }

  let error: unknown;
  if (estadoFilter === 'Todas') {
    error = errorTodas;
  } else if (estadoFilter === 'Activo') {
    error = errorActivas;
  } else {
    error = errorInactivas;
  }


  const columnHelper = createColumnHelper<UnidadMedicion>();
  
  const columns = useMemo(() => [
    columnHelper.accessor((row) => row.Nombre_Unidad_Medicion || row.Nombre_Unidad, {
      id: 'nombre',
      header: () => <><span className="hidden sm:inline">Nombre</span><span className="sm:hidden text-[9px]">Nombre</span></>,
      cell: info => (
        <button 
          className="font-medium transition-colors text-left w-full text-[10px] sm:text-[13px]"
          onClick={() => handleViewDetail(info.row.original)}
        >
          {info.getValue()}
        </button>
      ),
    }),
    columnHelper.accessor('Abreviatura', {
      id: 'abreviatura',
      header: () => <><span className="hidden sm:inline">Abreviatura</span><span className="sm:hidden text-[9px]">Abreviatura</span></>,
      cell: info => (
        <div className="flex justify-center">
          <span className="inline-flex px-2 py-1 text-[10px] sm:text-sm font-mono font-semibold rounded text-gray-800">
            {info.getValue()}
          </span>
        </div>
      ),
    }),
    columnHelper.accessor('Estado_Unidad_Medicion.Nombre_Estado_Unidad_Medicion', {
      id: 'estado',
      header: () => <><span className="hidden sm:inline">Estado</span><span className="sm:hidden text-[9px]">Estado</span></>,
      cell: info => {
        const estado = info.getValue() || 'Activo';
        const isActivo = estado === 'Activo';
        const colorClass = isActivo 
          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
          : 'bg-slate-200 text-slate-700 border border-slate-400';
        
        return (
          <div className="flex justify-center">
            <span className={`px-1.5 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-xs font-semibold rounded-full whitespace-nowrap ${colorClass}`}>
              {estado}
            </span>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: 'acciones',
      header: () => <><span className="hidden sm:inline">Acciones</span><span className="sm:hidden text-[9px]">Acciones</span></>,
      cell: info => (
     <div className="flex flex-row justify-center flex-nowrap gap-1 min-w-[50px] sm:min-w-[140px] overflow-visible">
          <button
            className="px-1.5 py-1 sm:px-2 sm:py-1 bg-gray-600 text-white text-[9px] sm:text-xs rounded hover:bg-gray-700 transition-colors w-auto whitespace-nowrap"
            onClick={() => handleViewDetail(info.row.original)}
            title="Ver detalles"
          >
            Ver
          </button>
          <button
            className="px-1.5 py-1 sm:px-2 sm:py-1 bg-blue-600 text-white text-[9px] sm:text-xs rounded hover:bg-blue-700 transition-colors w-auto whitespace-nowrap"
            onClick={() => handleEdit(info.row.original)}
            title="Editar"
          >
            Editar
          </button>
            {info.row.original.Estado_Unidad_Medicion?.Nombre_Estado_Unidad_Medicion === 'Activo' ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="px-1.5 py-1 sm:px-2 sm:py-1 bg-red-600 text-white text-[9px] sm:text-xs rounded hover:bg-red-700 transition-colors w-auto whitespace-nowrap"
                    disabled={updateEstadoMutation.isPending}
                    title="Desactivar"
                  >
                    Desactivar
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[90vw] max-w-lg mx-auto p-4 sm:p-6 rounded-xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      <span>¿Desactivar unidad de medición?</span>
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      <span>¿Estás seguro de que deseas desactivar la unidad de medición "{info.row.original.Nombre_Unidad_Medicion || info.row.original.Nombre_Unidad}"?</span>
                      <br />
                      <span>Esta acción puede revertirse posteriormente.</span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogAction
                      onClick={() => handleToggleEstado(info.row.original)}
                      disabled={updateEstadoMutation.isPending}
                    >
                      <span>Desactivar</span>
                    </AlertDialogAction>
                    <AlertDialogCancel>
                      <span>Cancelar</span>
                    </AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="px-1.5 py-1 sm:px-2 sm:py-1 bg-green-600 text-white text-[9px] sm:text-xs rounded hover:bg-green-700 transition-colors w-auto whitespace-nowrap"
                    disabled={updateEstadoMutation.isPending}
                    title="Activar"
                  >
                    Activar
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[90vw] max-w-lg mx-auto p-4 sm:p-6 rounded-xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      <span>¿Activar unidad de medición?</span>
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      <span>¿Estás seguro de que deseas activar la unidad de medición "{info.row.original.Nombre_Unidad_Medicion || info.row.original.Nombre_Unidad}"?</span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogAction
                      onClick={() => handleToggleEstado(info.row.original)}
                      disabled={updateEstadoMutation.isPending}
                    >
                      <span>Activar</span>
                    </AlertDialogAction>
                    <AlertDialogCancel>
                      <span>Cancelar</span>
                    </AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
        </div>
      ),
    }),
  ], [updateEstadoMutation.isPending]);

  const table = useReactTable({
    data: unidades,
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

  const handleEdit = (unidad: UnidadMedicion) => {
    setSelectedUnidad(unidad);
    setShowEditModal(true);
  };

  const handleViewDetail = (unidad: UnidadMedicion) => {
    setSelectedUnidad(unidad);
    setShowDetailModal(true);
  };

  const handleToggleEstado = async (unidad: UnidadMedicion) => {
    try {
      await updateEstadoMutation.mutateAsync({
        unidadId: unidad.Id_Unidad_Medicion,
        estadoUnidad: unidad.Estado_Unidad_Medicion?.Id_Estado_Unidad_Medicion === 1 ? 2 : 1,
      });
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };




  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando unidades de medición...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Error al cargar las unidades de medición. Por favor, intenta nuevamente.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-3">
          <div className="flex items-start gap-4 flex-col justify-start">
          <h2 className="text-2xl font-bold text-gray-900">Catálogo de Unidades de Medición</h2>
          <p className="text-sm text-gray-600 pb-4">Gestiona las unidades de medición del inventario</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 items-stretch sm:items-center justify-between pb-2">
          {/* Fila 1 en móvil: Filtros de Estado */}
          <div className="flex flex-row items-center justify-between gap-2 w-full sm:w-auto overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <label htmlFor='estado' className="text-xs sm:text-sm font-medium text-gray-700">Estado:</label>
              <select
                id='estado'
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                className="px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
              >
                <option value="Todas">Todas las unidades</option>
                <option value="Activo">Activas</option>
                <option value="Inactivo">Inactivas</option>
              </select>
            </div>
          </div>
          
          {/* Fila 2 en móvil: Búsqueda */}
          <div className="w-full flex gap-2 sm:flex-1 sm:max-w-md order-2 sm:order-none">
            <div className="relative w-full">
              <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Buscar unidades..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
              <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg flex items-center gap-2 transition-colors text-xs sm:text-sm whitespace-nowrap"
            >
            <LuPlus className="w-4 h-4" />
            Nueva Unidad
          </button>
          </div>

      
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-sky-100 overflow-hidden max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-sky-50">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="text-left text-xs sm:text-sm text-sky-700">
                  {headerGroup.headers.map((header, index) => {
                    const alignClass = index === 0 ? 'text-left' : 'text-center';
                    return (
                      <th
                        key={header.id}
                        className={`px-2 sm:px-4 py-3 font-medium border-b border-sky-100 ${alignClass}`}
                      >
                        {(() => {
                          if (header.isPlaceholder) {
                            return null;
                          }
                          return (
                            <div
                              className={`flex items-center gap-2 ${
                                header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                              } ${index === 0 ? 'justify-start' : 'justify-center'}`}
                              onClick={header.column.getToggleSortingHandler()}
                              onKeyDown={e => {
                                if (header.column.getCanSort() && (e.key === 'Enter' || e.key === ' ')) {
                                  e.preventDefault();
                                  header.column.getToggleSortingHandler()?.(e);
                                }
                              }}
                              tabIndex={header.column.getCanSort() ? 0 : undefined}
                              aria-label={
                                header.column.getCanSort() && typeof header.column.columnDef.header === 'string'
                                  ? `Ordenar por ${header.column.columnDef.header}`
                                  : undefined
                              }
                            >
                              <span className="flex items-center gap-1">
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                                {header.column.getIsSorted() === 'asc' && <MdKeyboardArrowUp className="inline" />}
                                {header.column.getIsSorted() === 'desc' && <MdKeyboardArrowDown className="inline" />}
                              </span>
                            </div>
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
                  <td colSpan={5} className="px-2 sm:px-4 py-8 text-center text-slate-500">
                    {globalFilter ? 'No se encontraron unidades que coincidan con la búsqueda' : 'No hay unidades de medición registradas'}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-sky-50 cursor-pointer transition-colors">
                    {row.getVisibleCells().map((cell, index) => (
                      <td key={cell.id} className={`px-2 sm:px-4 py-3 text-xs sm:text-sm text-slate-700 align-top ${
                        index === 0 ? 'text-left' : 'text-center'
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

      <CreateUnidadMedicionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {selectedUnidad && (
        <>
          <EditUnidadMedicionModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedUnidad(null);
            }}
            unidad={selectedUnidad}
          />

          <DetailUnidadMedicionModal
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedUnidad(null);
            }}
            unidad={selectedUnidad}
          />
        </>
      )}
    </div>
  );
};

export default UnidadesMedicionManagement;