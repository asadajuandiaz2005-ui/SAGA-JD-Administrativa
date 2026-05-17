import { useState, useMemo, useEffect } from "react";
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    createColumnHelper,
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
import { Alert } from '@/Modules/Global/components/Alert/ui/Alert';
import { useGetActas, useDeleteActa } from "../Hook/hookActas";
import type { Acta } from "../Models/ActasModels";
import FormularioCrearActas from "./FormularioCrearActas";
import ActasModal from "./ActasModal";
import ActasEdit from "./ActasEdit";
import { useUserPermissions } from '@/Modules/Auth/Hooks/PermissionHook';
export default function ActasTable() {
    const { data: actas, isLoading, refetch } = useGetActas();
    const deleteActaMutation = useDeleteActa();
    const { canCreate, canEdit, canView } = useUserPermissions();

    const hasCreatePermission = canCreate('actas');
    const hasEditPermission = canEdit('actas');
    const hasViewPermission = canView('actas');
    const hasDeletePermission = canEdit('actas'); // Eliminar requiere permiso de edicion

    const [globalFilter, setGlobalFilter] = useState('');
    const [formVisible, setFormVisible] = useState(false);
    const [editVisible, setEditVisible] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [actaSeleccionada, setActaSeleccionada] = useState<Acta | null>(null);
    const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'info';
        title: string;
        description?: string;
    } | null>(null);

    useEffect(() => {
        if (!notification) return;
        const t = setTimeout(() => setNotification(null), 3500);
        return () => clearTimeout(t);
    }, [notification]);

    const pageSizeOptions = [5, 10, 20, 50];
    const [pagination, setPagination] = useState({
        pageSize: 5,
        pageIndex: 0,
    });

    // Column helper para definir las columnas
    const columnHelper = createColumnHelper<Acta>();

    // Definir las columnas
    const columns = useMemo(() => [
        columnHelper.accessor('Titulo', {
            header: 'Título',
            cell: info => (
                <div className="font-medium text-left text-[9px] sm:text-xs md:text-sm max-w-[100px] sm:max-w-[150px] md:max-w-xs truncate" title={info.getValue()}>
                    {info.getValue().substring(0, 10)}{info.getValue().length > 10 ? '...' : ''}
                </div>
            ),
        }),
        columnHelper.accessor('Descripcion', {
            header: 'Descripción',
            cell: info => (
                <div className="text-gray-600 text-left text-[9px] sm:text-xs md:text-sm max-w-[120px] sm:max-w-[200px] md:max-w-md truncate" title={info.getValue()}>
                    {info.getValue().substring(0, 10)}{info.getValue().length > 10 ? '...' : ''}
                </div>
            ),
        }),
        columnHelper.accessor('Fecha_Creacion', {
            header: 'Fecha de Creación',
            cell: info => (
                <div className="text-gray-600 text-left text-[9px] sm:text-xs md:text-sm whitespace-nowrap">
                    {new Date(info.getValue()).toLocaleDateString("es-ES")}
                </div>
            ),
        }),
        columnHelper.accessor('Fecha_Actualizacion', {
            header: 'Última Actualización',
            cell: info => (
                <div className="text-gray-600 text-left text-[9px] sm:text-xs md:text-sm whitespace-nowrap">
                    {info.getValue()
                        ? new Date(info.getValue()).toLocaleDateString("es-ES")
                        : "Sin actualizar"}
                </div>
            ),
        }),
        columnHelper.display({
            id: 'acciones',
            header: 'Acciones',
            cell: info => (
                <div className="flex justify-center items-end gap-0.5 sm:gap-2">
                    {hasViewPermission && (
                        <button
                            className="px-1 sm:px-4 py-0.5 sm:py-1.5 bg-gray-600 text-white text-[6px] sm:text-xs rounded hover:bg-gray-700 transition-colors whitespace-nowrap"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetail(info.row.original);
                            }}
                            title="Ver detalles"
                        >
                            Ver
                        </button>
                    )}
                    {hasEditPermission && (
                        <button
                            className="px-1 sm:px-4 py-0.5 sm:py-1.5 bg-blue-600 text-white text-[6px] sm:text-xs rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(info.row.original);
                            }}
                            title="Editar"
                        >
                            Editar
                        </button>
                    )}
                    {hasDeletePermission && (
                        <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button
                                className="px-1 sm:px-4 py-0.5 sm:py-1.5 bg-red-600 text-white text-[6px] sm:text-xs rounded hover:bg-red-700 transition-colors whitespace-nowrap"
                                disabled={deleteActaMutation.isPending}
                                onClick={(e) => e.stopPropagation()}
                                title="Eliminar acta"
                            >
                                Eliminar
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    <span>¿Eliminar acta?</span>
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    <span>¿Estás seguro de que deseas eliminar la acta "{info.row.original.Titulo.length > 30 ? info.row.original.Titulo.substring(0, 30) + '...' : info.row.original.Titulo}"? Esta acción no se puede deshacer.</span>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogAction
                                    onClick={() => handleDelete(info.row.original)}
                                    disabled={deleteActaMutation.isPending}
                                >
                                    <span>Eliminar</span>
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
    ], [deleteActaMutation.isPending]);

    // Funciones para manejar las acciones
    const handleViewDetail = (acta: Acta) => {
        setActaSeleccionada(acta);
        setModalOpen(true);
    };

    const handleEdit = (acta: Acta) => {
        setActaSeleccionada(acta);
        setEditVisible(true);
    };

    const handleDelete = (acta: Acta) => {
        deleteActaMutation.mutate(acta.Id_Acta, {
            onSuccess: () => {
                refetch();
                setNotification({ type: 'success', title: 'Acta eliminada con éxito.' });
            },
            onError: (error: any) => {
                console.error("Error al eliminar el acta:", error);
                const errorMessage = error.response?.data?.message || 'Hubo un problema al eliminar el acta.';
                setNotification({ type: 'error', title: errorMessage });
            },
        });
    };

    // Crear la tabla con TanStack Table
    const table = useReactTable({
        data: actas || [],
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
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {notification && (
                <div className="fixed top-4 right-4 z-[200]">
                    <Alert
                        type={notification.type === 'success' ? 'success' : (notification.type === 'error' ? 'error' : 'info')}
                        title={notification.title}
                        description={notification.description}
                        onClose={() => setNotification(null)}
                    />
                </div>
            )}

            {/* Encabezado con búsqueda y botón */}
            <div className="bg-white rounded-lg p-3">
                <div className="flex items-start gap-4 flex-col justify-start">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de Actas</h2>
                    <p className="text-[10px] sm:text-sm text-gray-600 pb-2 sm:pb-4">Lleva un control de las actas de reuniones</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center justify-end mt-2 sm:mt-0">
                    <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                        <div className="relative flex-1 max-w-md w-full">
                            <LuSearch className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                            <input
                                type="text"
                                placeholder="Buscar actas..."
                                value={globalFilter ?? ''}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="w-full pl-6 sm:pl-10 pr-2 sm:pr-4 py-1.5 sm:py-2 text-[10px] sm:text-sm border border-gray-300 rounded-md sm:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        {hasCreatePermission && (
                            <button
                                onClick={() => setFormVisible(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-sm rounded-md sm:rounded-lg flex items-center gap-1 sm:gap-2 transition-colors whitespace-nowrap"
                            >
                                <LuPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                                Nueva Acta
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
                                <tr key={headerGroup.id} className="text-left text-[9px] sm:text-xs md:text-sm text-sky-700">
                                    {headerGroup.headers.map((header, index) => (
                                        <th key={header.id} className={`px-0.5 sm:px-2 md:px-4 py-1 md:py-3 font-medium border-b border-sky-100 ${
                                            index === 0 ? 'text-left pl-3 sm:pl-4' : 'text-center'
                                        } ${index === headerGroup.headers.length - 1 ? 'pr-3 sm:pr-4' : ''}`}>
                                            {(() => {
                                                const headerText = header.column.columnDef.header as string;
                                                const mobileHeaderText = headerText === 'Fecha de Creación' ? 'F.Creación' : headerText === 'Última Actualización' ? 'F.Actualización' : headerText;

                                                if (header.isPlaceholder) {
                                                    return null;
                                                }
                                                if (header.column.getCanSort()) {
                                                    return (
                                                        <button
                                                            type="button"
                                                            className={`cursor-pointer select-none flex items-center gap-1 bg-transparent border-none p-0 ${
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
                                                    <span className={`${index === 0 ? 'text-left' : 'text-center'} whitespace-nowrap`}>
                                                        <span className="sm:hidden">{mobileHeaderText}</span>
                                                        <span className="hidden sm:inline">{headerText}</span>
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
                                    <td colSpan={columns.length} className="px-2 sm:px-4 py-8 text-center text-slate-500 text-[10px] sm:text-xs md:text-sm">
                                        {globalFilter ? 'No se encontraron actas que coincidan con la búsqueda' : 'No hay actas registradas'}
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
                                                    index === 0 ? 'text-left pl-3 sm:pl-4' : 'text-center'
                                                } ${index === row.getVisibleCells().length - 1 ? 'pr-3 sm:pr-4' : ''}`}>
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

            {/* Modal para crear actas */}
            {formVisible && (
                <FormularioCrearActas
                    onClose={() => setFormVisible(false)}
                    refetch={refetch}
                />
            )}

            {/* Modal para editar actas */}
            {editVisible && actaSeleccionada && (
                <ActasEdit
                    acta={actaSeleccionada}
                    onClose={() => {
                        setEditVisible(false);
                        setActaSeleccionada(null);
                    }}
                    refetch={refetch}
                />
            )}

            {/* Modal para mostrar detalles del acta */}
            {modalOpen && actaSeleccionada && (
                <ActasModal
                    isOpen={modalOpen}
                    onClose={() => {
                        setModalOpen(false);
                        setActaSeleccionada(null);
                    }}
                    acta={actaSeleccionada}
                />
            )}
        </div>
    );
}