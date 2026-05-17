import { useMemo, useState } from "react";
import {
  useGetFacturas,
  useMarcarFacturaPagada,
  useMarcarFacturasVencidas,
  useAnularFactura,
} from "../hook/HookFactura";
import DetailFacturaModal from "./DetailFacturaModal";
import { LuSearch, LuRefreshCw } from "react-icons/lu";
import {
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
} from "react-icons/md";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogHeader,
  AlertDialogFooter,
} from "@/Modules/Global/components/Sidebar/ui/alert-dialog";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
} from "@tanstack/react-table";
import { useUserPermissions } from "@/Modules/Auth/Hooks/PermissionHook";
import type { Factura } from "../model/Factura";
import { getEstadoFacturaBadgeClass } from "../utils/estadoFacturaBadge";

type EstadoFilter = "todos" | "Disponible" | "Pendiente" | "Pagada" | "Anulada";

const getNombreAfiliado = (factura: Factura): string => {
  const af = factura.Afiliado;
  if (!af) return "Sin asignar";
  return (
    af.Nombre_Completo?.trim() ||
    af.Razon_Social?.trim() ||
    af.Identificacion ||
    af.Cedula_Juridica ||
    `Afiliado #${af.Id_Afiliado}`
  );
};

export default function FacturaTable() {
  const { canEdit, canView } = useUserPermissions();
  const hasEditPermission = canEdit("abonados");
  const hasViewPermission = canView("abonados");

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [anularDialogOpen, setAnularDialogOpen] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [facturaAMarcar, setFacturaAMarcar] = useState<Factura | null>(null);
  const [facturaAAnular, setFacturaAAnular] = useState<Factura | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("todos");

  const { data: facturas = [], isLoading, isError, refetch } = useGetFacturas();
  const { mutate: marcarPagada, isPending: isMarkingPaid } = useMarcarFacturaPagada();
  const { mutate: marcarVencidas, isPending: isCheckingVencidas } = useMarcarFacturasVencidas();
  const { mutate: anularFacturaMut, isPending: isAnulando } = useAnularFactura();

  const [pagination, setPagination] = useState({ pageSize: 5, pageIndex: 0 });
  const pageSizeOptions = [5, 10, 20, 50];

  const facturasFiltradas = useMemo(() => {
    if (estadoFilter === "todos") return facturas;
    return facturas.filter((f) => f.Estado?.Nombre_Estado === estadoFilter);
  }, [facturas, estadoFilter]);

  const handleOpenDetail = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailModalOpen(false);
    setFacturaSeleccionada(null);
  };

  const handleSolicitarPago = (factura: Factura) => {
    setFacturaAMarcar(factura);
    setConfirmDialogOpen(true);
  };

  const handleConfirmarPago = () => {
    if (!facturaAMarcar) return;
    marcarPagada(facturaAMarcar.Id_Factura, {
      onSuccess: () => {
        setConfirmDialogOpen(false);
        setFacturaAMarcar(null);
      },
      onError: () => {
        setConfirmDialogOpen(false);
        setFacturaAMarcar(null);
      },
    });
  };

  const handleCheckVencidas = () => {
    marcarVencidas(undefined, {
      onSuccess: () => refetch(),
    });
  };

  const handleSolicitarAnulacion = (factura: Factura) => {
    setFacturaAAnular(factura);
    setMotivoAnulacion("");
    setAnularDialogOpen(true);
  };

  const handleConfirmarAnulacion = () => {
    if (!facturaAAnular) return;
    anularFacturaMut(
      { idFactura: facturaAAnular.Id_Factura, motivo: motivoAnulacion.trim() || undefined },
      {
        onSuccess: () => {
          setAnularDialogOpen(false);
          setFacturaAAnular(null);
          setMotivoAnulacion("");
        },
        onError: () => {
          setAnularDialogOpen(false);
          setFacturaAAnular(null);
          setMotivoAnulacion("");
        },
      }
    );
  };

  const columnHelper = createColumnHelper<Factura>();

  const columns = [
    columnHelper.accessor("Numero_Factura", {
      id: "numero",
      header: () => "N° Factura",
      cell: (info) => (
        <span className="text-xs sm:text-sm font-mono text-gray-900 truncate">
          {info.getValue() || "N/A"}
        </span>
      ),
    }),
    columnHelper.accessor((row) => getNombreAfiliado(row), {
      id: "afiliado",
      header: () => "Afiliado",
      cell: (info) => {
        const valor = info.getValue();
        return (
          <span className="text-xs sm:text-sm text-gray-900 truncate max-w-[180px] inline-block" title={valor}>
            {valor.length > 22 ? valor.slice(0, 22) + "…" : valor}
          </span>
        );
      },
    }),
    columnHelper.accessor((row) => row.Lectura?.Numero_Medidor, {
      id: "medidor",
      header: () => "Medidor",
      cell: (info) => (
        <span className="text-xs sm:text-sm text-gray-700">{info.getValue() ?? "—"}</span>
      ),
    }),
    columnHelper.accessor("Consumo_M3", {
      id: "consumo",
      header: () => "Consumo",
      cell: (info) => (
        <span className="text-xs sm:text-sm text-gray-700">{info.getValue()} m³</span>
      ),
    }),
    columnHelper.accessor("Total", {
      id: "total",
      header: () => "Total",
      cell: (info) => (
        <span className="text-xs sm:text-sm font-semibold text-blue-700">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor((row) => row.Estado?.Nombre_Estado ?? "—", {
      id: "estado",
      header: () => "Estado",
      cell: (info) => {
        const estado = info.getValue();
        return (
          <span className={getEstadoFacturaBadgeClass(estado)}>
            {estado}
          </span>
        );
      },
    }),
    columnHelper.accessor("Fecha_Emision", {
      id: "emision",
      header: () => "Emisión",
      cell: (info) => {
        const v = info.getValue();
        return (
          <span className="text-xs sm:text-sm text-gray-600">
            {v ? new Date(v).toLocaleDateString("es-ES") : "—"}
          </span>
        );
      },
    }),
    columnHelper.accessor("Fecha_Vencimiento", {
      id: "vencimiento",
      header: () => "Vencimiento",
      cell: (info) => {
        const v = info.getValue();
        return (
          <span className="text-xs sm:text-sm text-gray-600">
            {v ? new Date(v).toLocaleDateString("es-ES") : "—"}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: () => "Acciones",
      cell: (info) => {
        const factura = info.row.original;
        const estado = factura.Estado?.Nombre_Estado;
        const puedeMarcarPagada =
          hasEditPermission && estado !== "Pagada" && estado !== "Anulada";
        const puedeAnular =
          hasEditPermission && estado !== "Pagada" && estado !== "Anulada";

        return (
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            {hasViewPermission && (
              <button
                onClick={() => handleOpenDetail(factura)}
                className="px-2 py-1 bg-slate-600 text-white text-[10px] sm:text-xs rounded hover:bg-slate-700 transition-colors whitespace-nowrap"
                title="Ver detalles"
              >
                Ver
              </button>
            )}
            {puedeMarcarPagada && (
              <button
                onClick={() => handleSolicitarPago(factura)}
                disabled={isMarkingPaid}
                className="px-2 py-1 bg-green-600 text-white text-[10px] sm:text-xs rounded hover:bg-green-700 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                title="Marcar como pagada"
              >
                Pagar
              </button>
            )}
            {puedeAnular && (
              <button
                onClick={() => handleSolicitarAnulacion(factura)}
                disabled={isAnulando}
                className="px-2 py-1 bg-red-600 text-white text-[10px] sm:text-xs rounded hover:bg-red-700 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                title="Anular factura"
              >
                Anular
              </button>
            )}
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: facturasFiltradas,
    columns,
    state: { globalFilter, pagination },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center text-red-600 p-4">Error al cargar las facturas</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-3">
        <div className="flex items-start gap-4 flex-col justify-start">
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Facturas</h2>
          <p className="text-sm text-gray-600 pb-4">
            Administra las facturas generadas y registra pagos
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between pb-2">
          <div className="flex flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value as EstadoFilter)}
              className="px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todos">Todos los estados</option>
              <option value="Disponible">Disponible</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Pagada">Pagada</option>
              <option value="Anulada">Anulada</option>
            </select>

            {hasEditPermission && (
              <button
                onClick={handleCheckVencidas}
                disabled={isCheckingVencidas}
                className="px-2 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-1.5 transition-colors text-xs sm:text-sm disabled:opacity-50"
                title="Forzar chequeo de facturas vencidas"
              >
                <LuRefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isCheckingVencidas ? "animate-spin" : ""}`} />
                Chequear vencidas
              </button>
            )}
          </div>

          <div className="flex w-full sm:w-auto items-stretch sm:items-center justify-end">
            <div className="relative w-full sm:w-80">
              <LuSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <input
                type="text"
                placeholder="Buscar en todas las columnas..."
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 sm:pl-10 sm:pr-4 sm:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-sky-100 overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-320px)] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
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
                        {header.column.getIsSorted() === "asc" && <MdKeyboardArrowUp />}
                        {header.column.getIsSorted() === "desc" && <MdKeyboardArrowDown />}
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
                    {globalFilter || estadoFilter !== "todos"
                      ? "No se encontraron facturas con esos filtros"
                      : "No hay facturas registradas"}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-sky-50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-slate-700 align-middle text-center"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 px-3 sm:px-6 py-2 sm:py-3 border-t border-gray-200 flex flex-row items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1 sm:gap-2 whitespace-nowrap">
            <span className="text-[10px] sm:text-sm text-gray-700">Filas por página:</span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-1 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              className="p-1 sm:p-2 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              title="Primera página"
            >
              <MdKeyboardDoubleArrowLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1 sm:p-2 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              title="Página anterior"
            >
              <MdKeyboardArrowLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </button>
            <span className="px-1.5 sm:px-2 py-1 text-[10px] sm:text-sm whitespace-nowrap">
              Pág. {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1 sm:p-2 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              title="Página siguiente"
            >
              <MdKeyboardArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="p-1 sm:p-2 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              title="Última página"
            >
              <MdKeyboardDoubleArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {detailModalOpen && facturaSeleccionada && (
        <DetailFacturaModal factura={facturaSeleccionada} onClose={handleCloseDetail} />
      )}

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar pago?</AlertDialogTitle>
            <AlertDialogDescription>
              {facturaAMarcar
                ? `¿Está seguro de marcar como pagada la factura ${facturaAMarcar.Numero_Factura} (${facturaAMarcar.Total})? Esta acción registra fecha de pago y usuario actual.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleConfirmarPago} disabled={isMarkingPaid}>
              {isMarkingPaid ? "Procesando..." : "Confirmar pago"}
            </AlertDialogAction>
            <AlertDialogCancel disabled={isMarkingPaid}>Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={anularDialogOpen} onOpenChange={setAnularDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Anular factura?</AlertDialogTitle>
            <AlertDialogDescription>
              {facturaAAnular
                ? `Está por anular la factura ${facturaAAnular.Numero_Factura} (${facturaAAnular.Total}). Esta acción registra fecha, usuario y motivo. No se puede deshacer.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-2 sm:px-4">
            <label htmlFor="motivo-anulacion" className="block text-sm font-medium text-gray-700 mb-1">
              Motivo de la anulación (opcional)
            </label>
            <textarea
              id="motivo-anulacion"
              value={motivoAnulacion}
              onChange={(e) => setMotivoAnulacion(e.target.value.slice(0, 500))}
              maxLength={500}
              rows={3}
              placeholder="Ej: Cobro duplicado, error en lectura, solicitud del afiliado..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm resize-none"
              disabled={isAnulando}
            />
            <p className="mt-1 text-xs text-gray-500">{motivoAnulacion.length}/500</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={handleConfirmarAnulacion}
              disabled={isAnulando}
              className="bg-red-600 hover:bg-red-700"
            >
              {isAnulando ? "Anulando..." : "Confirmar anulación"}
            </AlertDialogAction>
            <AlertDialogCancel disabled={isAnulando}>Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
