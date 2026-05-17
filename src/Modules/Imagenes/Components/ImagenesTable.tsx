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
import { useAlerts } from "@/Modules/Global/context/AlertContext";
import { useDeleteImagen, useGetImagenes } from "../Hook/hookEdiImagen";
import type { Imagen } from "../Models/ModelsEdiImagen";
import ImagenForm from "./CreateImagenModal";
import ImagenModal from "./DetailImagenModal";
import ImagenFormEdit from "./EditImagenModal";
import { useUserPermissions } from '@/Modules/Auth/Hooks/PermissionHook';


export default function ImagenesTable() {
    const { data: imagenes, isLoading, isError, refetch } = useGetImagenes();
    const deleteImagenMutation = useDeleteImagen();
    const { showSuccess, showError } = useAlerts();
    const { canCreate, canEdit, canView } = useUserPermissions();

    const hasCreatePermission = canCreate('imagenes');
    const hasEditPermission = canEdit('imagenes');
    const hasViewPermission = canView('imagenes');
    const hasDeletePermission = canEdit('imagenes'); // Eliminar requiere permiso de edicion

    const [globalFilter, setGlobalFilter] = useState('');
    const [formVisible, setFormVisible] = useState(false);
    const [editVisible, setEditVisible] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [imagenSeleccionada, setImagenSeleccionada] = useState<Imagen | null>(null);

    const pageSizeOptions = [5, 10, 20, 50];
    const [pagination, setPagination] = useState({
        pageSize: 5,
        pageIndex: 0,
    });

    // Column helper para definir las columnas
    const columnHelper = createColumnHelper<Imagen>();

    // Definir las columnas
    const columns = useMemo(() => [
        columnHelper.accessor('Nombre_Imagen', {
            header: () => (
                <>
                    <span className="hidden sm:inline">Nombre</span>
                    <span className="sm:hidden">Nombre</span>
                </>
            ),
            cell: info => {
                const texto = info.getValue() || '';
                const truncatedDesktop = texto.length > 25 ? texto.substring(0, 25) + '...' : texto;
                const truncatedMobile = texto.length > 10 ? texto.substring(0, 10) + '...' : texto;
                return (
                    <div className="font-medium transition-colors text-left w-full flex items-center gap-2">
                        <span className="truncate hidden sm:inline" title={texto}>{truncatedDesktop}</span>
                        <span className="truncate sm:hidden" title={texto}>{truncatedMobile}</span>
                    </div>
                );
            },
        }),
        columnHelper.accessor('Fecha_Creacion', {
            header: () => (
                <>
                    <span className="hidden sm:inline">Fecha de Creación</span>
                    <span className="sm:hidden">F. Creación</span>
                </>
            ),
            cell: info => <div className="flex items-center justify-start whitespace-nowrap">{new Date(info.getValue()).toLocaleDateString("es-ES")}</div>,
        }),
        columnHelper.accessor('Fecha_Actualizacion', {
            header: () => (
                <>
                    <span className="hidden sm:inline">Última Actualización</span>
                    <span className="sm:hidden">F. Actualización</span>
                </>
            ),
            cell: info => (
                <div className="flex items-center justify-start whitespace-nowrap">
                    {info.getValue()
                        ? new Date(info.getValue()).toLocaleDateString("es-ES")
                        : "Sin cambios"}
                </div>
            ),
        }),
        columnHelper.display({
            id: 'acciones',
            header: 'Acciones',
            cell: info => (
                <div className="flex justify-center gap-0.5 sm:gap-1">
                    {hasViewPermission && (
                        <button
                            className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-600 text-white flex-1 text-[7px] sm:text-xs rounded hover:bg-gray-700 transition-colors"
                            onClick={() => handleViewDetail(info.row.original)}
                            title="Ver detalles"
                        >
                            Ver
                        </button>
                    )}
                    {hasEditPermission && (
                        <button
                            className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-600 text-white flex-1 text-[7px] sm:text-xs rounded hover:bg-blue-700 transition-colors"
                            onClick={() => handleEdit(info.row.original)}
                            title="Editar"
                        >
                            Editar
                        </button>
                    )}
                    {hasDeletePermission && (
                        <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button
                                className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-red-600 text-white flex-1 text-[7px] sm:text-xs rounded hover:bg-red-700 transition-colors"
                                disabled={deleteImagenMutation.isPending}
                                title="Eliminar imagen"
                            >
                                Eliminar
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    <span>¿Eliminar imagen?</span>
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    <span>¿Estás seguro de que deseas eliminar la imagen "{info.row.original.Nombre_Imagen.length > 25 ? info.row.original.Nombre_Imagen.substring(0, 25) + '...' : info.row.original.Nombre_Imagen}"? Esta acción no se puede deshacer.</span>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogAction
                                    onClick={() => handleDelete(info.row.original)}
                                    disabled={deleteImagenMutation.isPending}
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
    ], [deleteImagenMutation.isPending]);

    // Funciones para manejar las acciones
    const handleViewDetail = (imagen: Imagen) => {
        setImagenSeleccionada(imagen);
        setModalOpen(true);
    };

    const handleEdit = (imagen: Imagen) => {
        setImagenSeleccionada(imagen);
        setEditVisible(true);
    };

    const handleDelete = (imagen: Imagen) => {
        deleteImagenMutation.mutate(imagen.Id_Imagen, {
            onSuccess: () => {
                showSuccess("Imagen eliminada correctamente.");
                refetch();
            },
            onError: () => {
                showError("Error al eliminar la imagen.");
            },
        });
    };

    // Crear la tabla con TanStack Table
    const table = useReactTable({
        data: imagenes || [],
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: 'includesString',
        state: {
            globalFilter,
            pagination,
        },
        onPaginationChange: setPagination,
    });

    if (isLoading) {
        return <div>Cargando...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Encabezado con búsqueda y botón */}
            <div className="bg-white rounded-lg p-3">
                <div className="flex items-start gap-4 flex-col justify-start">
                    <h2 className="text-2xl font-bold text-gray-900">Edición de Imágenes</h2>
                    <p className="text-sm text-gray-600 pb-4">Gestión de imágenes para el apartado de la historia</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-end">
                    <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                        <div className="relative flex-1 max-w-md">
                            <LuSearch className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                            <input
                                type="text"
                                placeholder="Buscar imágenes..."
                                value={globalFilter ?? ''}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="w-full pl-7 sm:pl-10 pr-2 sm:pr-4 py-1 sm:py-2 text-[10px] sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        {hasCreatePermission && (
                            <button
                                onClick={() => setFormVisible(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-base rounded-md flex items-center gap-1 sm:gap-2 transition-colors"
                            >
                                <LuPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                                Subir
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Errores */}
            {isError && (
                <div className="text-red-600 mb-2">Error al cargar las imágenes.</div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-sky-100 overflow-hidden max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full table-auto">
                        <thead className="bg-sky-50">
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id} className="text-left text-[8px] sm:text-sm text-sky-700">
                                    {headerGroup.headers.map((header, index) => (
                                        <th key={header.id} className={`px-1 sm:px-4 py-1 sm:py-3 font-medium border-b border-sky-100 ${index === 0 ? 'text-left' : 'text-center'}`}>
                                            {(() => {
                                                if (header.isPlaceholder) {
                                                    return null;
                                                }
                                                if (header.column.getCanSort()) {
                                                    return (
                                                        <button
                                                            type="button"
                                                            className={`cursor-pointer select-none flex items-center gap-1 sm:gap-2 bg-transparent border-none p-0 ${index === 0 ? 'justify-start' : 'justify-center'}`}
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
                                    <td colSpan={4} className="px-2 sm:px-4 py-8 text-center text-slate-500">
                                        {globalFilter ? 'No se encontraron imágenes que coincidan con la búsqueda' : 'No hay imágenes registradas'}
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map(row => (
                                    <tr key={row.id} className="hover:bg-sky-50 cursor-pointer transition-colors border-b border-sky-50 last:border-0">
                                        {row.getVisibleCells().map((cell, index) => (
                                            <td key={cell.id} className={`px-1 sm:px-4 py-1 sm:py-3 text-[10px] sm:text-sm text-slate-700 align-middle ${index === 0 ? 'text-left' : 'text-center'}`}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-2 sm:px-6 py-2 sm:py-3 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 sm:gap-2">
                                <span className="text-[10px] sm:text-sm text-gray-700">Filas por página:</span>
                                <select
                                    value={table.getState().pagination.pageSize}
                                    onChange={(e) => {
                                        table.setPageSize(Number(e.target.value));
                                    }}
                                    className="px-1 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                className="p-0.5 sm:p-2 rounded-md border text-gray-600 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Primera página"
                            >
                                <MdKeyboardDoubleArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            <button
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                                className="p-0.5 sm:p-2 rounded-md border text-gray-600 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Página anterior"
                            >
                                <MdKeyboardArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            <span className="text-[10px] sm:text-sm text-gray-700">
                                Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                            </span>
                            <button
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                                className="p-0.5 sm:p-2 rounded-md border text-gray-600 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Página siguiente"
                            >
                                <MdKeyboardArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            <button
                                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                disabled={!table.getCanNextPage()}
                                className="p-0.5 sm:p-2 rounded-md border text-gray-600 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Última página"
                            >
                                <MdKeyboardDoubleArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal para crear imágenes */}
            {formVisible && (
                <ImagenForm
                    onClose={() => setFormVisible(false)}
                    refetch={refetch}
                />
            )}

            {/* Modal para editar imágenes */}
            {editVisible && imagenSeleccionada && (
                <ImagenFormEdit
                    imagen={imagenSeleccionada}
                    onClose={() => {
                        setEditVisible(false);
                        setImagenSeleccionada(null);
                    }}
                    refetch={refetch}
                />
            )}

            {/* Modal para mostrar detalles de la imagen */}
            {modalOpen && imagenSeleccionada && (
                <ImagenModal
                    isOpen={modalOpen}
                    onClose={() => {
                        setModalOpen(false);
                        setImagenSeleccionada(null);
                    }}
                    imagen={imagenSeleccionada}
                />
            )}
        </div>
    );
}
