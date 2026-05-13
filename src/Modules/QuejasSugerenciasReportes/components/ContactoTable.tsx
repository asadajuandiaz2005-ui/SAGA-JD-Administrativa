import ResponderModal from './ResponderModal';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table';
import { LuSearch, LuFilter, } from 'react-icons/lu';
import {
  MdKeyboardArrowUp,
  MdKeyboardArrowDown,
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight
} from 'react-icons/md';

import { useQuejas, useSugerencias, useReportes, useUpdateSugerenciaEstado, useUpdateQuejaEstado, useUpdateReporteEstado, useQuejasArchivadas, useSugerenciasArchivadas, useReportesArchivados } from '../hook/HookContacto';
import type { Queja } from '../models/Quejas';
import type { Sugerencia } from '../models/Sugerencias';
import type { Reporte } from '../models/Reportes';
import { ESTADO_IDS, type ContactoFilterOptions, type ContactoItem, type EstadoContacto } from '../types/ContactoTypes';
import FilterContactoModal from './FilterContactoModal';
import ContactoDetailModal from './ContactoDetailModal';
import { renderTipoCell, renderPersonaCell, renderMensajeCell, renderEstadoCell, renderFechaCell, renderAccionesCell } from '../helper/Render';
import { useUserPermissions } from '@/Modules/Auth/Hooks/PermissionHook';
import { useAlerts } from '@/Modules/Global/context/AlertContext';
import { AlertDialog, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogAction, AlertDialogCancel } from "@/Modules/Global/components/Sidebar/ui/alert-dialog";




const ContactoTable = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState<ContactoItem | null>(null);
  const [itemToArchive, setItemToArchive] = useState<ContactoItem | null>(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isResponderModalOpen, setIsResponderModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ContactoFilterOptions>({});

  const pageSizeOptions = [5, 10, 20, 50];
  const [pagination, setPagination] = useState({
    pageSize: 5,
    pageIndex: 0,
  });

  const estadoFiltro = appliedFilters.estado === 'Archivado' ? undefined : appliedFilters.estado;

  const { data: quejas = [], isLoading: loadingQuejas } = useQuejas(estadoFiltro);
  const { data: sugerencias = [], isLoading: loadingSugerencias } = useSugerencias(estadoFiltro);
  const { data: reportes = [], isLoading: loadingReportes } = useReportes(estadoFiltro);
  const shouldIncludeArchived = useMemo(() => {
    const estadoArchivado = appliedFilters.estado === 'Archivado';
    const todosLosEstados = !appliedFilters.estado || (appliedFilters.estado as string) === 'Todos';
    const busquedaArchivado = globalFilter.trim().toLowerCase().includes('archiv');

    return estadoArchivado || todosLosEstados || busquedaArchivado;
  }, [appliedFilters.estado, globalFilter]);
  const { data: quejasArchivadas = [], isLoading: loadingQuejasArchivadas } = useQuejasArchivadas(shouldIncludeArchived);
  const { data: sugerenciasArchivadas = [], isLoading: loadingSugerenciasArchivadas } = useSugerenciasArchivadas(shouldIncludeArchived);
  const { data: reportesArchivados = [], isLoading: loadingReportesArchivados } = useReportesArchivados(shouldIncludeArchived);
  const actualizarEstadoQuejaMutation = useUpdateQuejaEstado();
  const actualizarEstadoSugerenciaMutation = useUpdateSugerenciaEstado();
  const actualizarEstadoReporteMutation = useUpdateReporteEstado();
  const { showSuccess, showError } = useAlerts();

  const { canEdit, canView } = useUserPermissions();

  const hasEditPermission = canEdit('contacto');
  const hasViewPermission = canView('contacto');

  const isLoading = loadingQuejas || loadingSugerencias || loadingReportes || loadingQuejasArchivadas || loadingSugerenciasArchivadas || loadingReportesArchivados;

  // Unificar todos los datos en una sola estructura
  const unifiedData = useMemo((): ContactoItem[] => {
    const data: ContactoItem[] = [];

    const mapQueja = (queja: Queja): ContactoItem => {
      const nombreCompleto = [queja.Nombre, queja.Primer_Apellido, queja.Segundo_Apellido].filter(Boolean).join(' ');
      const strSearch = [
        'Queja', nombreCompleto, queja.Descripcion, queja.Correo, queja.Estado.Estado_Queja
      ].filter(Boolean).join(' ').toLowerCase();

      return {
        id: queja.Id_Queja,
        tipo: 'Queja',
        nombre: queja.Nombre,
        primerApellido: queja.Primer_Apellido,
        segundoApellido: queja.Segundo_Apellido,
        mensaje: queja.Descripcion,
        fechaCreacion: queja.Fecha_Queja,
        correo: queja.Correo,
        estado: queja.Estado.Estado_Queja,
        adjunto: queja.Adjunto || null,
        _timestamp: queja.Fecha_Queja ? new Date(queja.Fecha_Queja).getTime() : 0,
        _nombreCompleto: nombreCompleto,
        _searchString: strSearch,
      };
    };

    const mapSugerencia = (sugerencia: Sugerencia): ContactoItem => {
      const strSearch = [
        'Sugerencia', sugerencia.Mensaje, sugerencia.Correo, sugerencia.Estado.Estado_Sugerencia
      ].filter(Boolean).join(' ').toLowerCase();

      return {
        id: sugerencia.Id_Sugerencia,
        tipo: 'Sugerencia',
        mensaje: sugerencia.Mensaje,
        fechaCreacion: sugerencia.Fecha_Sugerencia,
        correo: sugerencia.Correo,
        estado: sugerencia.Estado.Estado_Sugerencia,
        adjunto: sugerencia.Adjunto || null,
        _timestamp: sugerencia.Fecha_Sugerencia ? new Date(sugerencia.Fecha_Sugerencia).getTime() : 0,
        _searchString: strSearch,
      };
    };

    const mapReporte = (reporte: Reporte): ContactoItem => {
      const nombreCompleto = [reporte.Nombre, reporte.Primer_Apellido, reporte.Segundo_Apellido].filter(Boolean).join(' ');
      const strSearch = [
        'Reporte', nombreCompleto, reporte.Descripcion, reporte.Ubicacion, reporte.Correo, reporte.Estado.Estado_Reporte
      ].filter(Boolean).join(' ').toLowerCase();

      return {
        id: reporte.Id_Reporte,
        tipo: 'Reporte',
        nombre: reporte.Nombre,
        primerApellido: reporte.Primer_Apellido,
        segundoApellido: reporte.Segundo_Apellido,
        ubicacion: reporte.Ubicacion,
        mensaje: reporte.Descripcion || '',
        fechaCreacion: reporte.Fecha_Reporte,
        correo: reporte.Correo,
        estado: reporte.Estado.Estado_Reporte,
        adjunto: reporte.Adjunto || null,
        _timestamp: reporte.Fecha_Reporte ? new Date(reporte.Fecha_Reporte).getTime() : 0,
        _nombreCompleto: nombreCompleto,
        _searchString: strSearch,
      };
    };

    quejas?.forEach((queja: Queja) => {
      if (queja.Estado.Estado_Queja !== 'Archivado') {
        data.push(mapQueja(queja));
      }
    });

    sugerencias?.forEach((sugerencia: Sugerencia) => {
      if (sugerencia.Estado.Estado_Sugerencia !== 'Archivado') {
        data.push(mapSugerencia(sugerencia));
      }
    });

    reportes?.forEach((reporte: Reporte) => {
      if (reporte.Estado.Estado_Reporte !== 'Archivado') {
        data.push(mapReporte(reporte));
      }
    });

    if (shouldIncludeArchived) {
      quejasArchivadas?.forEach((queja: Queja) => data.push(mapQueja(queja)));
      sugerenciasArchivadas?.forEach((sugerencia: Sugerencia) => data.push(mapSugerencia(sugerencia)));
      reportesArchivados?.forEach((reporte: Reporte) => data.push(mapReporte(reporte)));
    }

    return data.sort((a, b) => (b._timestamp || 0) - (a._timestamp || 0));
  }, [quejas, sugerencias, reportes, quejasArchivadas, sugerenciasArchivadas, reportesArchivados, shouldIncludeArchived]);

  const handleApplyFilters = (filters: ContactoFilterOptions) => {
    setAppliedFilters(filters);
  };

  const activeFiltersCount = Object.values(appliedFilters).filter(value => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.length > 0;
    if (typeof value === 'number') return value > 0;
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null;
  }).length;

  // Aplicar filtros avanzados y BUSCADOR GLOBAL en el frontend para evitar lag
  const filteredData = useMemo(() => {
    let filtered = [...unifiedData];
    const terminoBusqueda = globalFilter.trim().toLowerCase();

    if (terminoBusqueda) {
      filtered = filtered.filter((item) => {
        return item._searchString?.includes(terminoBusqueda);
      });
    }

    // Filtrar por tipo (desde el filtro inline)
    if (appliedFilters.tipo) {
      filtered = filtered.filter(item => item.tipo === appliedFilters.tipo);
    }

    // Filtrar por estado
    if (appliedFilters.estado) {
      filtered = filtered.filter(item => item.estado === appliedFilters.estado);
    }

    // Filtrar por fecha inicio
    if (appliedFilters.fechaInicio) {
      const fechaInicioTimeStamp = new Date(appliedFilters.fechaInicio).getTime();
      filtered = filtered.filter(item => {
        return (item._timestamp || 0) >= fechaInicioTimeStamp;
      });
    }

    // Filtrar por fecha fin
    if (appliedFilters.fechaFin) {
      // Configuramos el final del día
      const fechaFinDate = new Date(appliedFilters.fechaFin);
      fechaFinDate.setHours(23, 59, 59, 999);
      const fechaFinTimeStamp = fechaFinDate.getTime();
      filtered = filtered.filter(item => {
        return (item._timestamp || 0) <= fechaFinTimeStamp;
      });
    }

    // Filtrar por adjuntos
    if (appliedFilters.conAdjunto) {
      filtered = filtered.filter(item => item.adjunto !== null && item.adjunto !== undefined);
    }


    return filtered;
  }, [unifiedData, appliedFilters]);

  const columnHelper = createColumnHelper<ContactoItem>();

  const handleArchiveClick = useCallback((item: ContactoItem) => {
    setItemToArchive(item);
    setIsArchiveModalOpen(true);
  }, []);

  const confirmArchive = useCallback(async () => {
    if (!itemToArchive) return;
    let nextIdEstado: number;
    const isArchived = itemToArchive.estado === 'Archivado';

    if (isArchived) {
      nextIdEstado = ESTADO_IDS.CONTESTADO;
    } else {
      nextIdEstado = ESTADO_IDS.ARCHIVADO;
    }

    try {
      if (itemToArchive.tipo === 'Queja') {
        await actualizarEstadoQuejaMutation.mutateAsync({ id: itemToArchive.id, idEstado: nextIdEstado });
      } else if (itemToArchive.tipo === 'Sugerencia') {
        await actualizarEstadoSugerenciaMutation.mutateAsync({ id: itemToArchive.id, idEstado: nextIdEstado });
      } else if (itemToArchive.tipo === 'Reporte') {
        await actualizarEstadoReporteMutation.mutateAsync({ id: itemToArchive.id, idEstado: nextIdEstado });
      }

      const isReporte = itemToArchive.tipo === 'Reporte';
      const articulo = isReporte ? 'El' : 'La';
      const participio = isArchived
        ? isReporte ? 'desarchivado' : 'desarchivada'
        : isReporte ? 'archivado' : 'archivada';

      showSuccess(
        `${itemToArchive.tipo} ${participio}`,
        `${articulo} ${itemToArchive.tipo.toLowerCase()} se ha ${participio} exitosamente`
      );
    } catch (error) {
      console.error(`Error al ${isArchived ? 'desarchivar' : 'archivar'} ${itemToArchive.tipo}:`, error);
      const accion = isArchived ? 'desarchivar' : 'archivar';
      const articulo = itemToArchive.tipo === 'Reporte' ? 'el' : 'la';

      showError(
        `Error al ${accion} ${itemToArchive.tipo.toLowerCase()}`,
        `No se pudo ${accion} ${articulo} ${itemToArchive.tipo.toLowerCase()}. Intenta nuevamente.`
      );
    } finally {
      setIsArchiveModalOpen(false);
      setItemToArchive(null);
    }
  }, [itemToArchive, actualizarEstadoQuejaMutation, actualizarEstadoReporteMutation, actualizarEstadoSugerenciaMutation, showError, showSuccess]);

  const columns = useMemo(() => [
    columnHelper.display({
      id: 'tipo',
      header: () => <><span className="hidden sm:inline">Tipo</span><span className="sm:hidden text-[8px]">Tipo</span></>,
      cell: ({ row }) => <div className="flex items-center justify-start">{renderTipoCell(row.original)}</div>,
      size: 130,
    }),

    columnHelper.display({
      id: 'persona',
      header: () => <><span className="hidden sm:inline">Persona</span><span className="sm:hidden text-[8px]">Persona</span></>,
      cell: ({ row }) => <div className="flex items-center justify-start">{renderPersonaCell(row.original)}</div>,
      size: 200,
    }),

    columnHelper.accessor('mensaje', {
      id: 'mensaje',
      header: () => <><span className="hidden sm:inline">Mensaje</span><span className="sm:hidden text-[8px]">Mensaje</span></>,
      cell: ({ getValue }) => <div className="flex items-center justify-start">{renderMensajeCell(getValue())}</div>,
      size: 250,
    }),

    columnHelper.display({
      id: 'estado',
      header: () => <><span className="hidden sm:inline">Estado</span><span className="sm:hidden text-[8px]">Estado</span></>,
      cell: ({ row }) => <div className="flex items-center justify-start">{renderEstadoCell(row.original)}</div>,
      size: 180,
    }),

    columnHelper.accessor('fechaCreacion', {
      id: 'fecha',
      header: () => <><span className="hidden sm:inline">Fecha</span><span className="sm:hidden text-[8px]">Fecha</span></>,
      cell: ({ getValue }) => <div className="flex items-center justify-start">{renderFechaCell(getValue())}</div>,
      size: 120,
    }),

    columnHelper.display({
      id: 'acciones',
      header: () => <><span className="hidden sm:inline">Acciones</span><span className="sm:hidden text-[8px]">Acciones</span></>,
      cell: ({ row }) => renderAccionesCell(row.original, {
        onArchiveClick: handleArchiveClick,
        hasViewPermission,
        hasEditPermission,
      }),
      enableSorting: false,
    }),
  ], [
    handleArchiveClick, 
    hasEditPermission, 
    hasViewPermission
  ]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  const handleViewDetails = (item: ContactoItem) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  // Listen for global events dispatched by renderAccionesCell
  useEffect(() => {
    const detailListener = (e: Event) => {
      const custom = e as CustomEvent<ContactoItem>;
      if (custom?.detail) {
        handleViewDetails(custom.detail);
      }
    };
    const responderListener = (e: Event) => {
      const custom = e as CustomEvent<ContactoItem>;
      if (custom?.detail) {
        setSelectedItem(custom.detail);
        setIsResponderModalOpen(true);
      }
    };
    // NOTA: El listener 'openContactoDelete' ya no es necesario aquí, ya que el AlertDialog maneja la acción de archivar.
    window.addEventListener('openContactoDetail', detailListener as EventListener);
    window.addEventListener('openContactoResponder', responderListener as EventListener);
    return () => {
      window.removeEventListener('openContactoDetail', detailListener as EventListener);
      window.removeEventListener('openContactoResponder', responderListener as EventListener);
    };
  }, []);

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedItem(null);
  };
  const handleCloseResponderModal = () => {
    setIsResponderModalOpen(false);
    setSelectedItem(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando datos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-start gap-4 flex-col justify-start">
          <div className="flex items-start gap-4 flex-col justify-start" />
          <h2 className="text-2xl font-bold text-gray-900">Revisión de Quejas, Sugerencias y Reportes</h2>
          <p className="text-sm text-gray-600 pb-4">Gestiona y revisa las quejas, sugerencias y reportes del sistema</p>
        </div>

      </div>
      <div className="bg-white rounded-lg p-3">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <label htmlFor="estado-filter" className="block text-[10px] sm:text-xs font-medium text-gray-700 whitespace-nowrap">
              Estado:
            </label>
            <select
              id="estado-filter"
              value={appliedFilters.estado || ''}
              onChange={(e) => handleApplyFilters({
                ...appliedFilters,
                estado: e.target.value ? e.target.value as EstadoContacto : undefined
              })}
              className="w-full px-2 py-1 text-[10px] sm:text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Contestado">Contestado</option>
              <option value="Archivado">Archivado</option>
            </select>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className={`px-3 py-1.5 text-[10px] sm:text-xs border rounded-md flex items-center gap-2 transition-colors ${activeFiltersCount > 0
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:bg-gray-50'
                }`}
            >
              <LuFilter className="w-3.5 h-3.5" />
              Filtros
              {activeFiltersCount > 0 && (
                <span className="bg-blue-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <div className="relative flex-1 max-w-md">
              <LuSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Buscar por nombre, mensaje..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-[10px] sm:text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

          </div>
        </div>
      </div>
      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-sky-100 overflow-hidden max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-sky-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="text-left text-xs sm:text-sm text-sky-700">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-2 sm:px-4 py-3 font-medium border-b border-sky-100 cursor-pointer"
                      style={{ width: header.getSize() }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <span className="flex items-center gap-1">
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
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-sky-50 cursor-pointer transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-slate-700 align-top">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-2 sm:px-4 py-8 text-center text-slate-500">
                    {globalFilter
                      ? 'No se encontraron quejas, sugerencias o reportes que coincidan con la búsqueda'
                      : 'No hay registros de quejas, sugerencias o reportes'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
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


      <FilterContactoModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={appliedFilters}
      />

      {selectedItem && (
        <ContactoDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          item={selectedItem}
        />
      )}
      {selectedItem && (
        <ResponderModal
          isOpen={isResponderModalOpen}
          onClose={handleCloseResponderModal}
          item={selectedItem}
        />
      )}

      {/* Global Archive Confirmation Dialog */}
      <AlertDialog open={isArchiveModalOpen} onOpenChange={setIsArchiveModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar {itemToArchive?.estado === 'Archivado' ? 'Desarchivar' : 'Archivar'}?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas {itemToArchive?.estado === 'Archivado' ? 'desarchivar' : 'archivar'} est@ {itemToArchive?.tipo.toLowerCase()}? 
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={confirmArchive}>
              {itemToArchive?.estado === 'Archivado' ? 'Desarchivar' : 'Archivar'}
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => { setIsArchiveModalOpen(false); setItemToArchive(null); }}>
              Cancelar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContactoTable;