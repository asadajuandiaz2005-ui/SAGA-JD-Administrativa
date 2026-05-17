import { useState } from "react";
import { useGetCalidadAgua, useToggleVisibilidadCalidadAgua } from "../Hook/HookCalidadAgua";
import CalidadAguaModal from "./CalidadAguaModal";
import CalidadAguaEdit from "./CalidadAguaEdit";
import FormularioCalidadAgua from "./FormularioCalidadAgua";
import { Plus, Eye, EyeOff } from "lucide-react";
import { LuSearch } from "react-icons/lu";
import {
  MdKeyboardArrowLeft, MdKeyboardArrowRight, MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp
} from "react-icons/md";
import type { ArchivoCalidadAgua } from "../Models/CalidadDeAgua";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
} from "@tanstack/react-table";

import { useAlerts } from "@/Modules/Global/context/AlertContext";
import { useUserPermissions } from '@/Modules/Auth/Hooks/PermissionHook';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/Modules/Global/components/Sidebar/ui/alert-dialog";


export default function CalidadAguaTable() {
  const { data: archivos, isLoading, isError, refetch } = useGetCalidadAgua();
  const toggleVisibilidad = useToggleVisibilidadCalidadAgua();

  const { showSuccess, showError } = useAlerts();
  const { canCreate, canEdit, canView } = useUserPermissions();

  const hasCreatePermission = canCreate('calidadAgua');
  const hasEditPermission = canEdit('calidadAgua');
  const hasViewPermission = canView('calidadAgua');

  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<ArchivoCalidadAgua | null>(null);
  const [archivoPendienteVisibilidad, setArchivoPendienteVisibilidad] = useState<ArchivoCalidadAgua | null>(null);
  const [confirmVisibilidadOpen, setConfirmVisibilidadOpen] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  const pageSizeOptions = [5, 10, 20, 50];
  const [pagination, setPagination] = useState({
    pageSize: 5,
    pageIndex: 0,
  });

  const handleOpenModal = (archivo: ArchivoCalidadAgua) => {
    setArchivoSeleccionado(archivo);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setArchivoSeleccionado(null);
  };

  const handleOpenEditModal = (archivo: ArchivoCalidadAgua) => {
    setArchivoSeleccionado(archivo);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setArchivoSeleccionado(null);
  };

  const handleRequestToggleVisible = (e: React.MouseEvent, archivo: ArchivoCalidadAgua) => {
    e.stopPropagation();
    setArchivoPendienteVisibilidad(archivo);
    setConfirmVisibilidadOpen(true);
  };

  const handleToggleVisible = () => {
    if (!archivoPendienteVisibilidad) {
      return;
    }

    toggleVisibilidad.mutate(archivoPendienteVisibilidad.Id_Calidad_Agua, {
      onSuccess: () => {
        showSuccess("Visibilidad actualizada correctamente");
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.message || "Error al cambiar la visibilidad";
        showError(errorMessage);
      },
      onSettled: () => {
        setConfirmVisibilidadOpen(false);
        setArchivoPendienteVisibilidad(null);
      },
    });
  };



  // Column helper para definir las columnas
  const columnHelper = createColumnHelper<ArchivoCalidadAgua>();

  // Definir las columnas
  const columns = [
    columnHelper.accessor('Titulo', {
      header: () => <><span className="hidden sm:inline">Título</span><span className="sm:hidden text-[8px]">Título</span></>,
      cell: info => {
        const titulo = info.getValue() || '';
        const truncatedDesktop = titulo.length > 30 ? titulo.substring(0, 30) + '...' : titulo;
        const truncatedMobile = titulo.length > 15 ? titulo.substring(0, 15) + '...' : titulo;
        return (
          <div className="font-medium text-left flex items-center gap-2 text-gray-700" title={titulo}>
            <span className="hidden sm:inline text-xs">{truncatedDesktop}</span>
            <span className="sm:hidden text-[7px] whitespace-nowrap">{truncatedMobile}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor('Fecha_Creacion', {
      header: () => <><span className="hidden sm:inline">Fecha de Creación</span><span className="sm:hidden text-[8px]">Fecha Creación</span></>,
      cell: info => (
        <div className="text-gray-600 text-left text-[7px] sm:text-xs whitespace-nowrap">
          {new Date(info.getValue()).toLocaleDateString("es-ES")}
        </div>
      ),
    }),
    columnHelper.accessor('Fecha_Actualizacion', {
      header: () => <><span className="hidden sm:inline">Última Actualización</span><span className="sm:hidden text-[8px]">Últ. Actualiz.</span></>,
      cell: info => (
        <div className="text-gray-600 text-left text-[7px] sm:text-xs whitespace-nowrap">
          {info.getValue() ? new Date(info.getValue()).toLocaleDateString("es-ES") : "Sin actualizar"}
        </div>
      ),
    }),
    columnHelper.accessor('Visible', {
      header: () => <><span className="hidden sm:inline">Estado</span><span className="sm:hidden text-[8px]">Estado</span></>,
      cell: info => (
        <div className="flex items-center justify-start">
          <button
            onClick={(e) => handleRequestToggleVisible(e, info.row.original)}
            className={`flex items-center gap-1 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-[7px] sm:text-xs font-medium transition-colors ${info.getValue()
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            disabled={toggleVisibilidad.isPending}
          >
            {info.getValue() ? (
              <>
                <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className=" sm:inline">Visible</span>

              </>
            ) : (
              <>
                <EyeOff className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className=" sm:inline">Oculto</span>

              </>
            )}
          </button>
        </div>
      ),
    }),
    columnHelper.display({
      id: 'acciones',
      header: () => <><span className="hidden sm:inline">Acciones</span><span className="sm:hidden text-[8px]">Acciones</span></>,
      cell: info => (
        <div className="flex justify-center gap-1">
          {hasViewPermission && (
            <button
              className="px-1.5 sm:px-4 py-0.5 sm:py-1.5 bg-gray-600 text-white text-[7px] sm:text-xs rounded hover:bg-gray-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenModal(info.row.original);
              }}
              title="Ver detalles"
            >
              Ver
            </button>
          )}
          {hasEditPermission && (
            <button
              className="px-1.5 sm:px-4 py-0.5 sm:py-1.5 bg-blue-600 text-white text-[7px] sm:text-xs rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEditModal(info.row.original);
              }}
              title="Editar"
            >
              Editar
            </button>
          )}
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: archivos || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: "includesString",
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

  const archivoEstaVisible = archivoPendienteVisibilidad?.Visible ?? false;
  const accionVisibilidad = archivoEstaVisible ? "ocultar" : "mostrar";
  const accionVisibilidadCapitalizada = archivoEstaVisible ? "Ocultar" : "Mostrar";

  return (
    <div className="space-y-6">
      {/* Encabezado con búsqueda y botón */}
      <div className="bg-white rounded-lg p-3">
        <div className="flex items-start gap-4 flex-col justify-start">
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Calidad de Agua</h2>
          <p className="text-sm text-gray-600 pb-4">Gestiona los documentos de los resultados de la calidad de agua</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-end">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 max-w-md">
              <LuSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Buscar archivos..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-[10px] sm:text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {hasCreatePermission && (
              <button
                onClick={() => setFormVisible(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-[10px] sm:text-xs rounded-md flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Nuevo Archivo</span>
                <span className="sm:hidden">Nuevo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mostrar errores */}
      {isError && <div className="text-red-600 mb-2">Error al cargar los archivos.</div>}

      <div className="bg-white rounded-2xl shadow-sm border border-sky-100 overflow-hidden max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
        <div className="overflow-x-auto">
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
                              aria-label="Ordenar columna"
                            >
                              <span className="flex items-center justify-left gap-1">
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
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="px-2 sm:px-4 py-8 text-center text-xs sm:text-sm text-slate-500">
                    Cargando...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-2 sm:px-4 py-8 text-center text-xs sm:text-sm text-slate-500">
                    {globalFilter ? 'No se encontraron archivos que coincidan con la búsqueda' : 'No hay archivos registrados'}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-sky-50 cursor-pointer transition-colors" onClick={() => handleOpenModal(row.original)}>
                    {row.getVisibleCells().map((cell, index) => (
                      <td key={cell.id} className={`px-2 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-sm text-slate-700 align-top ${index === 0 ? 'text-left' : 'text-center'
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

        <div className="overflow-x-auto bg-gray-50 border-t border-gray-200">
          <div className="min-w-max px-2 sm:px-4 py-1.5 sm:py-2 cursor-default">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-[10px] sm:text-xs text-gray-700 whitespace-nowrap">Filas por página:</span>
                  <select
                    value={table.getState().pagination.pageSize}
                    onChange={(e) => {
                      table.setPageSize(Number(e.target.value));
                    }}
                    className="px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  className="p-0.5 sm:p-1 rounded-md border text-gray-600 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Primera página"
                >
                  <MdKeyboardDoubleArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="p-0.5 sm:p-1 rounded-md border text-gray-600 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Página anterior"
                >
                  <MdKeyboardArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                <span className="text-[10px] sm:text-xs text-gray-700 whitespace-nowrap mx-1">
                  Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                </span>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="p-0.5 sm:p-1 rounded-md border text-gray-600 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Página siguiente"
                >
                  <MdKeyboardArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                <button
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  className="p-0.5 sm:p-1 rounded-md border text-gray-600 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Última página"
                >
                  <MdKeyboardDoubleArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog
        open={confirmVisibilidadOpen}
        onOpenChange={(open) => {
          setConfirmVisibilidadOpen(open);
          if (!open) {
            setArchivoPendienteVisibilidad(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <span>¿{accionVisibilidadCapitalizada} archivo?</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
                <span>
                ¿Estás seguro de que deseas {accionVisibilidad} el archivo "{(archivoPendienteVisibilidad?.Titulo ?? '').length > 15 ? `${(archivoPendienteVisibilidad?.Titulo ?? '').slice(0, 15)}...` : archivoPendienteVisibilidad?.Titulo}"?
                </span>
              <br />
              <span>Esta acción puede revertirse posteriormente.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={handleToggleVisible}
              disabled={toggleVisibilidad.isPending}
            >
              <span>{accionVisibilidadCapitalizada}</span>
            </AlertDialogAction>
            <AlertDialogCancel disabled={toggleVisibilidad.isPending}>
              <span>Cancelar</span>
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      {/* Modal para ver detalles */}
      {modalOpen && archivoSeleccionado && (
        <CalidadAguaModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          archivo={archivoSeleccionado}
          refetch={refetch}
        />
      )}

      {/* Modal para editar */}
      {editModalOpen && archivoSeleccionado && (
        <CalidadAguaEdit
          archivo={archivoSeleccionado}
          onClose={handleCloseEditModal}
          refetch={refetch}
        />
      )}

      {/* Formulario para crear */}
      {formVisible && (
        <FormularioCalidadAgua
          tituloInicial=""
          onClose={() => setFormVisible(false)}
          refetch={refetch}
        />
      )}
    </div>
  );
}
