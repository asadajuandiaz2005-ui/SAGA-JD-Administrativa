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
import { useGetAllCategories, useGetCategoriasActivas, useGetCategoriasInactivas, useUpdateEstadoCategoria } from '../../hooks/useCategorias';
import { getCategoriasLoadingState, getCategoriasErrorState } from '../../helper/CategoriasHelpers';
import CreateCategoriaModal from './CreateCategoriaModal';
import EditCategoriaModal from './EditCategoriaModal';
import DetailCategoriaModal from './DetailCategoriaModal';
import type { CategoriaMaterial } from '../../models/Inventario';

interface CategoriasManagementProps {
  onBack?: () => void;
}

const CategoriasManagement: React.FC<CategoriasManagementProps> = () => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaMaterial | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<string>('Todas'); // Por defecto mostrar todas
  const pageSizeOptions = [5, 10, 20, 50];
  const [pagination, setPagination] = useState({
    pageSize: 5,
    pageIndex: 0,
  });
  
  const { data: todasCategorias = [], isLoading: isLoadingTodas, error: errorTodas } = useGetAllCategories();
  const { data: categoriasActivas = [], isLoading: isLoadingActivas, error: errorActivas } = useGetCategoriasActivas();
  const { data: categoriasInactivas = [], isLoading: isLoadingInactivas, error: errorInactivas } = useGetCategoriasInactivas();
  const updateEstadoMutation = useUpdateEstadoCategoria();

  // Seleccionar los datos según el filtro
  const categorias = useMemo(() => {
    if (estadoFilter === 'Todas') {
      return todasCategorias;
    } else if (estadoFilter === 'Activa') {
      return categoriasActivas;
    } else {
      return categoriasInactivas;
    }
  }, [estadoFilter, todasCategorias, categoriasActivas, categoriasInactivas]);

  // Determinar el estado de carga y error 
  const isLoading = getCategoriasLoadingState(estadoFilter, {
    todas: isLoadingTodas,
    activas: isLoadingActivas,
    inactivas: isLoadingInactivas
  });
  
  const error = getCategoriasErrorState(estadoFilter, {
    todas: errorTodas,
    activas: errorActivas,
    inactivas: errorInactivas
  });


  const columnHelper = createColumnHelper<CategoriaMaterial>();
  
  const columns = useMemo(() => [
    columnHelper.accessor('Nombre_Categoria', {
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
    columnHelper.accessor('Descripcion_Categoria', {
      id: 'descripcion',
      header: () => <><span className="hidden sm:inline">Descripción</span><span className="sm:hidden text-[9px]">Descripción</span></>,
      cell: info => (
        <div className="flex justify-center">
          <span className="text-gray-600 text-left max-w-[80px] sm:max-w-xs truncate text-[10px] sm:text-[13px]">
            {info.getValue() || 'Sin descripción'}
          </span>
        </div>
        
      ),
    }),
    columnHelper.accessor('Estado_Categoria.Nombre_Estado_Categoria', {
      id: 'estado',
      header: () => <><span className="hidden sm:inline">Estado</span><span className="sm:hidden text-[9px]">Estado</span></>,
      cell: info => {
        const estado = info.getValue() || 'Activa';
        const isActiva = estado === 'Activa';
        const colorClass = isActiva 
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
            {info.row.original.Estado_Categoria?.Nombre_Estado_Categoria === 'Activa' ? (
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
                      <span>¿Desactivar categoría?</span>
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      <span>¿Estás seguro de que deseas desactivar la categoría "{info.row.original.Nombre_Categoria.length > 20 ? info.row.original.Nombre_Categoria.substring(0, 20) + '...' : info.row.original.Nombre_Categoria}"?</span>
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
                      <span>¿Activar categoría?</span>
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      <span>¿Estás seguro de que deseas activar la categoría "{info.row.original.Nombre_Categoria}"?</span>
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
    data: categorias,
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

  
  const handleEdit = (categoria: CategoriaMaterial) => {
    setSelectedCategoria(categoria);
    setShowEditModal(true);
  };

  const handleViewDetail = (categoria: CategoriaMaterial) => {
    setSelectedCategoria(categoria);
    setShowDetailModal(true);
  };

  const handleToggleEstado = async (categoria: CategoriaMaterial) => {
      try {
        await updateEstadoMutation.mutateAsync({
          id: categoria.Id_Categoria,
          nuevoEstado: categoria.Estado_Categoria?.Id_Estado_Categoria === 1 ? 2 : 1,
         

        });
      } catch (error) {
        console.error('Error al cambiar estado de la categoría:', error);
      }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando categorías...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Error al cargar las categorías. Por favor, intenta nuevamente.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-3">
          <div className="flex items-start gap-4 flex-col justify-start">
            <h2 className="text-2xl font-bold text-gray-900">Catálogo de Categorías</h2>
            <p className="text-sm text-gray-600 pb-4">Gestiona las categorías de los materiales</p>
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
                <option value="Todas">Todas las categorías</option>
                <option value="Activa">Activas</option>
                <option value="Inactiva">Inactivas</option>
              </select>
            </div>
          </div>
          
          {/* Fila 2 en móvil: Búsqueda */}
          <div className="w-full flex gap-2 sm:flex-1 sm:max-w-md order-2 sm:order-none">
            <div className="relative w-full">
              <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Buscar categorías..."
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
              Nueva Categoría
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
                  {headerGroup.headers.map((header, index) => (
                    <th key={header.id} className={`px-2 sm:px-4 py-3 font-medium border-b border-sky-100 ${
                      index === 0 ? 'text-left' : 'text-center'
                    }`}>
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
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-sky-50">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-2 sm:px-4 py-8 text-center text-slate-500">
                    {globalFilter ? 'No se encontraron categorías que coincidan con la búsqueda' : 'No hay categorías registradas'}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-sky-50 cursor-pointer transition-colors">
                    {row.getVisibleCells().map((cell, index) => {
                      return (
                        <td key={cell.id} className={`px-2 sm:px-4 py-3 text-xs sm:text-sm text-slate-700 align-top ${
                          index === 0 ? 'text-left' : 'text-center'
                        }`}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
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

   
      <CreateCategoriaModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {selectedCategoria && (
        <>
          <EditCategoriaModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedCategoria(null);
            }}
            categoria={selectedCategoria}
          />

          <DetailCategoriaModal
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedCategoria(null);
            }}
            categoria={selectedCategoria}
          />
        </>
      )}
    </div>
  );
};

export default CategoriasManagement;