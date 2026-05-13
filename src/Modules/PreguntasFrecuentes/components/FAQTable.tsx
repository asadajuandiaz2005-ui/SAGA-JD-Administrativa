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
import { useFAQs, useDeleteFAQ, useToggleFAQVisible } from "../Hook/FAQHook";
import { Eye, EyeOff } from "lucide-react";
import type { FAQ } from "../Models/FAQModels";
import FAQForm from "./FAQForm";
import FAQModal from "./FAQModal";
import FAQEdit from "./FAQEdit";
import { useUserPermissions } from '@/Modules/Auth/Hooks/PermissionHook';

export default function FAQTable() {
    const { data: faqs = [], error } = useFAQs(true);
    const deleteFAQMutation = useDeleteFAQ();
    const toggleVisibleMutation = useToggleFAQVisible();
    const { canCreate, canEdit, canView } = useUserPermissions();

    const hasCreatePermission = canCreate('faq');
    const hasEditPermission = canEdit('faq');
    const hasViewPermission = canView('faq');
    const hasDeletePermission = canEdit('faq'); // Eliminar requiere permiso de edicion

    const [globalFilter, setGlobalFilter] = useState('');
    const [formVisible, setFormVisible] = useState(false);
    const [editVisible, setEditVisible] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [faqSeleccionada, setFaqSeleccionada] = useState<FAQ | null>(null);

    const pageSizeOptions = [5, 10, 20, 50];
    const [pagination, setPagination] = useState({
        pageSize: 5,
        pageIndex: 0,
    });

    // Column helper para definir las columnas
    const columnHelper = createColumnHelper<FAQ>();

    // Definir las columnas
    const columns = useMemo(() => [
        columnHelper.accessor('Pregunta', {
            header: () => <><span className="hidden sm:inline">Pregunta</span><span className="sm:hidden text-[8px]">Pregunta</span></>,
            cell: info => {
                const texto = info.getValue() || '';
                const truncatedDesktop = texto.length > 40 ? texto.substring(0, 40) + '...' : texto;
                const truncatedMobile = texto.length > 15 ? texto.substring(0, 15) + '...' : texto;
                return (
                    <div className="font-medium transition-colors text-left w-full flex items-center gap-2 text-gray-700" title={texto}>
                        <span className="hidden sm:inline text-xs">{truncatedDesktop}</span>
                        <span className="sm:hidden text-[7px] whitespace-nowrap">{truncatedMobile}</span>
                    </div>
                );
            },
        }),
        columnHelper.accessor('Respuesta', {
            header: () => <><span className="hidden sm:inline">Respuesta</span><span className="sm:hidden text-[8px]">Respuesta</span></>,
            cell: info => {
                const texto = info.getValue() || '';
                const truncatedDesktop = texto.length > 30 ? texto.substring(0, 30) + '...' : texto;
                const truncatedMobile = texto.length > 15 ? texto.substring(0, 15) + '...' : texto;
                return (
                    <div className="flex items-center justify-start text-gray-600" title={texto}>
                        <span className="hidden sm:inline text-xs">{truncatedDesktop}</span>
                        <span className="sm:hidden text-[7px] whitespace-nowrap">{truncatedMobile}</span>
                    </div>
                );
            },
        }),
        columnHelper.accessor('Visible', {
            header: () => <><span className="hidden sm:inline">Visibilidad</span><span className="sm:hidden text-[8px]">Visibilidad</span></>,
            cell: info => (
                hasEditPermission ? (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button
                                disabled={toggleVisibleMutation.isPending}
                                className={`flex items-center gap-1 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-[7px] sm:text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                    info.getValue()
                                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                                        : "bg-red-100 text-red-700 hover:bg-red-200"
                                }`}
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
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    ¿Cambiar visibilidad?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    ¿Estás seguro de que deseas {info.getValue() ? 'ocultar' : 'mostrar'} la pregunta "{info.row.original.Pregunta.length > 15 ? info.row.original.Pregunta.substring(0, 15) + '...' : info.row.original.Pregunta}"?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogAction
                                    onClick={() => handleToggleVisibility(info.row.original)}
                                    disabled={toggleVisibleMutation.isPending}
                                >
                                    {toggleVisibleMutation.isPending ? 'Actualizando...' : 'Confirmar'}
                                </AlertDialogAction>
                                <AlertDialogCancel>
                                    Cancelar
                                </AlertDialogCancel>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                ) : (
                    <span className={`flex items-center gap-1 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-[7px] sm:text-xs font-medium ${
                        info.getValue()
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                    }`}>
                        {info.getValue() ? (
                            <>
                                <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                <span className="hidden sm:inline">Visible</span>
                            </>
                        ) : (
                            <>
                                <EyeOff className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                <span className="hidden sm:inline">Oculto</span>
                            </>
                        )}
                    </span>
                )
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
                            onClick={() => handleViewDetail(info.row.original)}
                            title="Ver detalles"
                        >
                            Ver
                        </button>
                    )}
                    {hasEditPermission && (
                        <button
                            className="px-1.5 sm:px-4 py-0.5 sm:py-1.5 bg-blue-600 text-white text-[7px] sm:text-xs rounded hover:bg-blue-700 transition-colors"
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
                                    className="px-1.5 sm:px-4 py-0.5 sm:py-1.5 bg-red-600 text-white text-[7px] sm:text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={deleteFAQMutation.isPending}
                                    title="Eliminar pregunta"
                                >
                                    Eliminar
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        ¿Eliminar pregunta?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        ¿Estás seguro de que deseas eliminar la pregunta "{info.row.original.Pregunta.length > 30 ? info.row.original.Pregunta.substring(0, 30) + '...' : info.row.original.Pregunta}"? Esta acción no se puede deshacer.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogAction
                                        onClick={() => handleDelete(info.row.original)}
                                        disabled={deleteFAQMutation.isPending}
                                    >
                                        {deleteFAQMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                                    </AlertDialogAction>
                                    <AlertDialogCancel>
                                        Cancelar
                                    </AlertDialogCancel>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            ),
        }),
    ], [hasViewPermission, hasEditPermission, hasDeletePermission, deleteFAQMutation.isPending, toggleVisibleMutation.isPending]);

    // Funciones para manejar las acciones
    const handleViewDetail = (faq: FAQ) => {
        setFaqSeleccionada(faq);
        setModalOpen(true);
    };

    const handleEdit = (faq: FAQ) => {
        setFaqSeleccionada(faq);
        setEditVisible(true);
    };

    const handleDelete = async (faq: FAQ) => {
        try {
            await deleteFAQMutation.mutateAsync(faq.Id_FAQ);
        } catch (error) {
            console.error("Error al eliminar pregunta:", error);
        }
    };

    const handleToggleVisibility = async (faq: FAQ) => {
        try {
            await toggleVisibleMutation.mutateAsync(faq.Id_FAQ);
        } catch (error) {
            console.error("Error al cambiar visibilidad:", error);
        }
    };

    // Crear la tabla con TanStack Table
    const table = useReactTable({
        data: faqs || [],
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

    return (
        <div className="space-y-6">
            {/* Encabezado con búsqueda y botón */}
            <div className="bg-white rounded-lg p-3">
                <div className="flex items-start gap-4 flex-col justify-start">
                    <h2 className="text-2xl font-bold text-gray-900">Edición de Preguntas Frecuentes</h2>
                    <p className="text-sm text-gray-600 pb-4">Gestiona las preguntas frecuentes de la ASADA</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-end">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="relative flex-1 max-w-md">
                            <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                            <input
                                type="text"
                                placeholder="Buscar preguntas..."
                                value={globalFilter ?? ''}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-[10px] sm:text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        {hasCreatePermission && (
                            <button
                                onClick={() => setFormVisible(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-[10px] sm:text-xs rounded-md flex items-center gap-2 transition-colors"
                            >
                                <LuPlus className="w-3 h-3" />
                                Crear Pregunta
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Mostrar errores */}
            {error && <div className="text-red-600 mb-2">{error.message}</div>}

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
                                    <td colSpan={6} className="px-2 sm:px-4 py-8 text-center text-slate-500 text-[10px] sm:text-xs">
                                        {globalFilter ? 'No se encontraron preguntas que coincidan con la búsqueda' : 'No hay preguntas registradas'}
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

            {/* Modal para crear preguntas */}
            {formVisible && (
                <FAQForm
                    onClose={() => setFormVisible(false)}
                />
            )}

            {/* Modal para editar preguntas */}
            {editVisible && faqSeleccionada && (
                <FAQEdit
                    faq={faqSeleccionada}
                    onClose={() => {
                        setEditVisible(false);
                        setFaqSeleccionada(null);
                    }}
                />
            )}

            {/* Modal para mostrar detalles de la pregunta */}
            {modalOpen && faqSeleccionada && (
                <FAQModal
                    isOpen={modalOpen}
                    onClose={() => {
                        setModalOpen(false);
                        setFaqSeleccionada(null);
                    }}
                    faq={faqSeleccionada}
                />
            )}
        </div>
    );
}
