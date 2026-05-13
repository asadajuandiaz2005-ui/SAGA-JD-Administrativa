import { useState, useMemo } from 'react';
import { LuSearch, LuFilter } from 'react-icons/lu';
import { useAuth } from '@/Modules/Auth/Context/AuthContext';
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
    MdKeyboardArrowDown,
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
  MdKeyboardArrowUp,
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
} from 'react-icons/md';
import { useGetAllAuditorias } from '../hook/HookAuditoria';
import type { Auditoria } from '../models/Auditoria';
import type { AuditoriaFilterOptions } from '../types/AuditoriaTypes';
import DetailAuditoriaModal from './DetailAuditoriaModal';
import FilterAuditoriaModal from './FilterAuditoriaModal';

const columnHelper = createColumnHelper<Auditoria>();

const pageSizeOptions = [5, 10, 15, 25, 50];

const CatálogoAuditorias = () => {
  const { data: auditorias = [], isLoading } = useGetAllAuditorias();
  const { user: currentUser } = useAuth();

  const [globalFilter, setGlobalFilter] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedAuditoria, setSelectedAuditoria] = useState<Auditoria | null>(
    null
  );
  const [appliedFilters, setAppliedFilters] = useState<AuditoriaFilterOptions>(
    {}
  );
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });

  const handleViewDetail = (auditoria: Auditoria) => {
    setSelectedAuditoria(auditoria);
    setShowDetailModal(true);
  };

  const handleApplyFilters = (filters: AuditoriaFilterOptions) => {
    setAppliedFilters(filters);
    // Reinicia la página al aplicar nuevos filtros
    table.setPageIndex(0);
  };


  // Filtrado de datos
  const filteredData = useMemo(() => {
    let filtered = auditorias;

    // Filtro por módulo
    if (appliedFilters.modulo) {
      filtered = filtered.filter(
        (auditoria) => auditoria.Modulo === appliedFilters.modulo
      );
    }

    // Filtro por acción
    if (appliedFilters.accion) {
      filtered = filtered.filter(
        (auditoria) => auditoria.Accion === appliedFilters.accion
      );
    }

    // Filtro por usuario específico
    if (appliedFilters.por_usuario) {
      filtered = filtered.filter(
        (auditoria) => auditoria.Usuario?.Id_Usuario === appliedFilters.por_usuario
      );
    }

    // Filtro mis auditorías
    if (appliedFilters.mis_auditorias && currentUser) {
      filtered = filtered.filter(
        (auditoria) => auditoria.Usuario?.Id_Usuario === currentUser.Id_Usuario
      );
    }

    return filtered;
  }, [auditorias, appliedFilters, currentUser]);

  // Definición de columnas (mantenido igual)
  const columns = [
    columnHelper.accessor('Modulo', {
      header: 'Módulo',
      cell: (info) => (
        <span className="font-medium text-gray-900">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor('Accion', {
      header: 'Acción',
      cell: (info) => {
        const accion = info.getValue();
        const getAccionColor = (acc: string) => {
          switch (acc) {
            case 'Creación':
              return 'bg-green-100 text-green-800 border-green-200';
            case 'Actualización':
              return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Eliminación':
              return 'bg-red-100 text-red-800 border-red-200';
            default:
              return 'bg-gray-100 text-gray-800 border-gray-200';
          }
        };
        return (
          <div className="flex justify-center sm:justify-start">
            <span
              className={`inline-block px-1 py-[2px] sm:px-2 sm:py-1 text-[8px] sm:text-xs font-semibold rounded-full border whitespace-nowrap leading-none ${getAccionColor(
                accion
              )}`}
            >
              {accion}
            </span>
          </div>
        );
      },
    }),
    columnHelper.accessor('Registro_Afectado', {
      header: 'Registro',
      cell: (info) => {
        const val = info.getValue() || '';
        const mobileText = val.length > 15 ? val.substring(0, 15) + '...' : val;
        const desktopText = val.length > 40 ? val.substring(0, 40) + '...' : val;
        
        return (
          <div className="flex justify-start w-full">
            <span className="font-medium text-[9px] sm:text-xs md:text-sm block sm:hidden" title={val}>
              {mobileText}
            </span>
            <span className="font-medium text-[9px] sm:text-xs md:text-sm hidden sm:block" title={val}>
              {desktopText}
            </span>
          </div>
        );
      },
    }),
    columnHelper.accessor('Usuario', {
      header: 'Usuario',
      cell: (info) => {
        const usuario = info.getValue();
        return (
          <div className="flex justify-center sm:justify-start truncate w-full">
            <span className="font-medium text-gray-900 text-[9px] sm:text-xs md:text-sm truncate" title={usuario?.Nombre_Usuario || 'Desconocido'}>
              {usuario?.Nombre_Usuario || 'Desconocido'}
            </span>
          </div>
        );
      },
    }),
    columnHelper.accessor('Fecha_Accion', {
      header: 'Fecha y Hora',
      cell: (info) => {
        const fecha = info.getValue();
        if (!fecha) return <span className="text-gray-400">-</span>;
        const date = new Date(fecha);
        return (
          <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2 justify-center sm:justify-start text-[8px] sm:text-xs text-center sm:text-left">
            <span className="text-gray-900 font-medium whitespace-nowrap">
              {date.toLocaleDateString('es-CR')}
            </span>
            <span className="font-medium text-gray-500 whitespace-nowrap">
              {date.toLocaleTimeString('es-CR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Acciones',
      cell: (info) => (
        <div className="flex justify-center">
        <button
          onClick={() => handleViewDetail(info.row.original)}
          className="px-1.5 sm:px-4 py-0.5 sm:py-1.5 bg-gray-600 text-white text-[8px] sm:text-xs rounded hover:bg-gray-700 transition-colors whitespace-nowrap"
          title="Ver Detalle"
        >
          Ver
        </button>
        </div>
      ),
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
        <span className="ml-2 text-gray-600">Cargando auditorías...</span>
      </div>
    );
  }
  const renderAuditoriasView = () => (
    <div className="flex flex-col bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-4 sm:p-6">
        <div>
          <h1 className="text-lg sm:text-xlg md:text-2xl font-bold text-gray-900">
            Auditoría del Sistema
          </h1>
          <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 mt-1">
            Registro de todas las acciones realizadas en el sistema
          </p>
        </div>
        {/* Aquí podrías añadir un botón de exportar si fuera necesario */}
      </div>

      {/* Search & Filter Bar */}
      <div className="p-2 sm:p-4 flex flex-row items-center justify-between md:justify-end gap-2 sm:gap-4">

        <div className='flex items-center'>
          <button
              onClick={() => setShowFilterModal(true)}
              className={`px-2 py-1 sm:px-4 sm:py-2 text-[10px] sm:text-sm border rounded-md flex items-center gap-1 sm:gap-2 transition-colors ${
                 Object.values(appliedFilters).filter(Boolean).length > 0
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <LuFilter className="w-3 h-3 sm:w-4 sm:h-4" />
              Filtros
              {Object.values(appliedFilters).filter(Boolean).length > 0 && (
                <span className="bg-blue-500 text-white text-[9px] sm:text-xs rounded-full w-3.5 h-3.5 sm:w-5 sm:h-5 flex items-center justify-center">
                  {Object.values(appliedFilters).filter(Boolean).length}
                </span>
              )}
            </button>
        </div>
         <div className="relative flex-1 max-w-md w-full">
          <LuSearch className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full pl-6 sm:pl-10 pr-2 sm:pr-4 py-1 sm:py-2 border border-gray-300 rounded-lg text-[10px] sm:text-sm focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>
      </div>

<div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-sky-50">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="text-left text-[9px] sm:text-xs md:text-sm text-sky-700">
                  {headerGroup.headers.map((header, index) => (
                    <th key={header.id} className={`px-0.5 sm:px-2 md:px-4 py-1 md:py-3 font-medium border-b border-sky-100 ${
                      index === 0 ? 'text-left pl-3 sm:pl-4' : 'text-center'
                    } ${index === headerGroup.headers.length - 1 ? 'pr-3 sm:pr-4' : ''}`}>
                      {(() => {
                        if (header.isPlaceholder) {
                          return null;
                        }
                        if (header.column.getCanSort()) {
                          return (
                            <button
                              type="button"
                              className={`cursor-pointer select-none flex items-center gap-2 bg-transparent border-none p-0 ${
                                index === 0 ? 'justify-start' : 'justify-center'
                              }`}
                              onClick={header.column.getToggleSortingHandler()}
                              onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  header.column.getToggleSortingHandler()?.(e);
                                }
                              }}
                              tabIndex={0}
                              aria-label={`Ordenar por ${header.column.columnDef.header as string}`}
                            >
                              <span className="flex items-center gap-1">
                                {header.column.columnDef.header as string}
                                {header.column.getIsSorted() === 'asc' && <MdKeyboardArrowUp className="inline" />}
                                {header.column.getIsSorted() === 'desc' && <MdKeyboardArrowDown className="inline" />}
                              </span>
                            </button>
                          );
                        }
                        return (
                          <span className={index === 0 ? 'text-left' : 'text-center'}>
                            {header.column.columnDef.header as string}
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
                  <td colSpan={columns.length} className="px-2 sm:px-4 py-8 text-center text-slate-500">
                    {globalFilter ? 'No se encontraron registros que coincidan con la búsqueda' : 'No hay auditorías registradas'}
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
                        <td key={cell.id} className={`px-0.5 sm:px-2 md:px-4 py-1.5 md:py-3 text-[9px] sm:text-xs md:text-sm text-slate-700 align-middle ${
                          index === 0 ? 'text-left pl-3 sm:pl-4' : 'text-center'
                        } ${index === row.getVisibleCells().length - 1 ? 'pr-3 sm:pr-4' : ''} max-w-[60px] sm:max-w-none truncate`}>
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

      {/* Modals */}
      <DetailAuditoriaModal
        auditoria={selectedAuditoria}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedAuditoria(null);
        }}
      />

      <FilterAuditoriaModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={appliedFilters}
      />
    </div>
  );

  return renderAuditoriasView();
};

export default CatálogoAuditorias;