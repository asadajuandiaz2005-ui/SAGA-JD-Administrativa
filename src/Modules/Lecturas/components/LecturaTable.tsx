import { useMemo, useState, useEffect } from "react";
import {
  useChangeEstadoSello,
  useGetLecturas,
  useGetLecturasByAfiliado,
  useGetLecturasByMedidor,
  useGetLecturasByUsuario,
  useGetLecturasEntreFechas,
  useGetSelloCalidad,
} from "../hook/HookLectura";
import DetailLecturaModal from "./DetailLecturaModal";
import UpdateLecturaModal from "./UpdateLecturaModal";
import { Plus } from "lucide-react";
import { LuFilter, LuSearch } from "react-icons/lu";
import {
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
} from "react-icons/md";
import type { Lectura } from "../model/Lectura";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogHeader,
  AlertDialogFooter
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
import InsertarLecturaModal from "./InsertarLecturaModal";
import { useUserPermissions } from '@/Modules/Auth/Hooks/PermissionHook';
import FilterLecturaModal from "./FilterLecturaModal";
import type { LecturaFilterOptions } from "../model/LecturaFilters";
import { useUsers } from "@/Modules/Usuarios/Hooks/userHook";
import { useAfiliadosFisicos } from "@/Modules/Afiliados/Hook/HookAfiliadoFisico";
import { useAfiliadosJuridicos } from "@/Modules/Afiliados/Hook/HookAfiliadoJuridico";

interface FilterSelectOption {
  id: number;
  label: string;
}

type LecturaQuerySource = "all" | "usuario" | "medidor" | "afiliado" | "fechas";

const isPositiveFilter = (value?: number) => (value ?? 0) > 0;

const getActiveQuerySource = (filters: LecturaFilterOptions): LecturaQuerySource => {
  const hasUsuarioFilter = isPositiveFilter(filters.idUsuario);
  const hasMedidorFilter = isPositiveFilter(filters.numeroMedidor);
  const hasAfiliadoFilter = isPositiveFilter(filters.idAfiliado);
  const hasFullDateRangeFilter = Boolean(filters.fechaInicio && filters.fechaFin);

  if (hasFullDateRangeFilter) {
    return "fechas";
  }

  if (hasUsuarioFilter) {
    return "usuario";
  }

  if (hasMedidorFilter) {
    return "medidor";
  }

  if (hasAfiliadoFilter) {
    return "afiliado";
  }

  return "all";
};

const applyClientFilters = (
  data: Lectura[],
  filters: LecturaFilterOptions,
  activeQuerySource: LecturaQuerySource
) => {
  let result = data;
  const hasUsuarioFilter = isPositiveFilter(filters.idUsuario);
  const hasMedidorFilter = isPositiveFilter(filters.numeroMedidor);
  const hasAfiliadoFilter = isPositiveFilter(filters.idAfiliado);
  const hasStartDateFilter = Boolean(filters.fechaInicio);
  const hasEndDateFilter = Boolean(filters.fechaFin);

  if (hasUsuarioFilter && activeQuerySource !== "usuario") {
    result = result.filter((lectura) => lectura.Usuario?.Id_Usuario === filters.idUsuario);
  }

  if (hasMedidorFilter && activeQuerySource !== "medidor") {
    result = result.filter((lectura) => lectura.Medidor?.Numero_Medidor === filters.numeroMedidor);
  }

  if (hasAfiliadoFilter && activeQuerySource !== "afiliado") {
    result = result.filter((lectura) => lectura.Afiliado?.Id_Afiliado === filters.idAfiliado);
  }

  if ((hasStartDateFilter || hasEndDateFilter) && activeQuerySource !== "fechas") {
    const start = hasStartDateFilter
      ? new Date(`${filters.fechaInicio}T00:00:00`).getTime()
      : null;
    const end = hasEndDateFilter
      ? new Date(`${filters.fechaFin}T23:59:59`).getTime()
      : null;

    result = result.filter((lectura) => {
      const lecturaDate = new Date(lectura.Fecha_Lectura).getTime();
      const matchesStart = start === null || lecturaDate >= start;
      const matchesEnd = end === null || lecturaDate <= end;
      return matchesStart && matchesEnd;
    });
  }

  return result;
};

const getActiveFiltersCount = (filters: LecturaFilterOptions) =>
  Object.values(filters).filter((value) => {
    if (typeof value === "number") {
      return value > 0;
    }
    return Boolean(value);
  }).length;

const formatDateForBackend = (date?: string) => {
  if (!date) {
    return "";
  }

  const isoDateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const isoDateMatch = isoDateRegex.exec(date);

  if (!isoDateMatch) {
    return date;
  }

  const [, year, month, day] = isoDateMatch;
  return `${day}-${month}-${year}`;
};

const sortSelectOptions = (a: FilterSelectOption, b: FilterSelectOption) =>
  a.label.localeCompare(b.label, "es", { sensitivity: "base", numeric: true });

const getAfiliadoFisicoLabel = (
  afiliado: {
    readonly Id_Afiliado: number;
    readonly Nombre: string;
    readonly Apellido1?: string;
    readonly Apellido2?: string;
    readonly Primer_Apellido?: string;
    readonly Segundo_Apellido?: string;
  }
) => {
  const primerApellido = afiliado.Apellido1 ?? afiliado.Primer_Apellido ?? "";
  const segundoApellido = afiliado.Apellido2 ?? afiliado.Segundo_Apellido ?? "";

  const nombreCompleto = [afiliado.Nombre, primerApellido, segundoApellido]
    .filter(Boolean)
    .join(" ")
    .trim();

  return nombreCompleto || `Afiliado #${afiliado.Id_Afiliado}`;
};

export default function LecturaTable() {
  const { canCreate, canEdit, canView } = useUserPermissions();

  const hasCreatePermission = canCreate('abonados');
  const hasEditPermission = canEdit('abonados');
  const hasViewPermission = canView('abonados');

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [insertModalOpen, setInsertModalOpen] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isSelloApplied, setIsSelloApplied] = useState(false);
  const [lecturaSeleccionada, setLecturaSeleccionada] = useState<Lectura | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<LecturaFilterOptions>({});
  const { data: selloCalidad } = useGetSelloCalidad();

  useEffect(() => {
    if (selloCalidad !== undefined) {
      setIsSelloApplied(Boolean(selloCalidad));
    }
  }, [selloCalidad]);

  const { data: users = [], isLoading: isLoadingUsuarios } = useUsers();
  const { afiliadosFisicos = [], isLoading: isLoadingAfiliadosFisicos } = useAfiliadosFisicos();
  const { afiliadosJuridicos = [], isLoading: isLoadingAfiliadosJuridicos } = useAfiliadosJuridicos();
  const{ mutate: changeEstadoSello } = useChangeEstadoSello();

  const pageSizeOptions = [5, 10, 20, 50];
  const [pagination, setPagination] = useState({
    pageSize: 5,
    pageIndex: 0,
  });

  const getNombreAfiliado = (lectura: Lectura): string => {
    const afiliado = lectura.Afiliado;

    if (!afiliado) {
      return "Sin asignar";
    }

    if (afiliado.Tipo_Entidad === 2) {
      return afiliado.Razon_Social?.trim() || afiliado.Cedula_Juridica || `Afiliado jurídico #${afiliado.Id_Afiliado}`;
    }

    const nombreCompleto = [afiliado.Nombre, afiliado.Primer_Apellido, afiliado.Segundo_Apellido]
      .filter(Boolean)
      .join(" ")
      .trim();

    return nombreCompleto || afiliado.Identificacion || `Afiliado #${afiliado.Id_Afiliado}`;
  };

  const activeQuerySource = getActiveQuerySource(appliedFilters);
  const fechaInicioBackend = formatDateForBackend(appliedFilters.fechaInicio);
  const fechaFinBackend = formatDateForBackend(appliedFilters.fechaFin);

  const allLecturasQuery = useGetLecturas(activeQuerySource === "all");
  const lecturasUsuarioQuery = useGetLecturasByUsuario(
    appliedFilters.idUsuario ?? 0,
    activeQuerySource === "usuario"
  );
  const lecturasMedidorQuery = useGetLecturasByMedidor(
    appliedFilters.numeroMedidor ?? 0,
    activeQuerySource === "medidor"
  );
  const lecturasAfiliadoQuery = useGetLecturasByAfiliado(
    appliedFilters.idAfiliado ?? 0,
    activeQuerySource === "afiliado"
  );
  const lecturasFechasQuery = useGetLecturasEntreFechas(
    fechaInicioBackend,
    fechaFinBackend,
    activeQuerySource === "fechas"
  );

  let activeQuery = allLecturasQuery;

  if (activeQuerySource === "fechas") {
    activeQuery = lecturasFechasQuery;
  } else if (activeQuerySource === "usuario") {
    activeQuery = lecturasUsuarioQuery;
  } else if (activeQuerySource === "medidor") {
    activeQuery = lecturasMedidorQuery;
  } else if (activeQuerySource === "afiliado") {
    activeQuery = lecturasAfiliadoQuery;
  }

  const isLoading = activeQuery.isLoading;
  const isError = activeQuery.isError;
  const baseLecturas = activeQuery.data ?? [];

  const lecturas = useMemo(
    () => applyClientFilters(baseLecturas, appliedFilters, activeQuerySource),
    [activeQuerySource, appliedFilters, baseLecturas]
  );

  const activeFiltersCount = useMemo(
    () => getActiveFiltersCount(appliedFilters),
    [appliedFilters]
  );

  const usuarioOptions = useMemo(
    () =>
      users
        .map((user) => ({
          id: user.Id_Usuario,
          label: user.Nombre_Usuario || `Usuario #${user.Id_Usuario}`,
        }))
        .sort(sortSelectOptions),
    [users]
  );

  const afiliadoOptions = useMemo(() => {
    const options: FilterSelectOption[] = [
      ...afiliadosFisicos.map((afiliado) => ({
        id: afiliado.Id_Afiliado,
        label: getAfiliadoFisicoLabel(afiliado),
      })),
      ...afiliadosJuridicos.map((afiliado) => ({
        id: afiliado.Id_Afiliado,
        label: afiliado.Razon_Social?.trim() || `Afiliado #${afiliado.Id_Afiliado}`,
      })),
    ];

    const uniqueById = new Map<number, FilterSelectOption>();
    options.forEach((option) => {
      if (!uniqueById.has(option.id)) {
        uniqueById.set(option.id, option);
      }
    });

    return Array.from(uniqueById.values()).sort(sortSelectOptions);
  }, [afiliadosFisicos, afiliadosJuridicos]);

  const isLoadingAfiliados = isLoadingAfiliadosFisicos || isLoadingAfiliadosJuridicos;


  const handleOpenDetailModal = (lectura: Lectura) => {
    setLecturaSeleccionada(lectura);
    setDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setLecturaSeleccionada(null);
  };

  const handleOpenUpdateModal = (lectura: Lectura) => {
    setLecturaSeleccionada(lectura);
    setUpdateModalOpen(true);
  };

  const handleCloseUpdateModal = () => {
    setUpdateModalOpen(false);
    setLecturaSeleccionada(null);
  };

  const handleOpenInsertModal = () => {
    setInsertModalOpen(true);
  };

  const handleCloseInsertModal = () => {
    setInsertModalOpen(false);
  };

  const handleApplyFilters = (filters: LecturaFilterOptions) => {
    setAppliedFilters(filters);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleApplySelloCalidadClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.preventDefault();
    setIsConfirmDialogOpen(true);
  };

  const handleApplySelloCalidad = () => {
    // @ts-ignore
    changeEstadoSello(undefined, {
      onSuccess: () => {
        activeQuery.refetch();
        setIsSelloApplied(!isSelloApplied);
        setIsConfirmDialogOpen(false);
      },
      onError: () => {
        setIsConfirmDialogOpen(false);
      }
    });
  }


  // Column helper
  const columnHelper = createColumnHelper<Lectura>();

  // Definir las columnas
  const columns = [
    columnHelper.accessor((row) => row.Medidor.Numero_Medidor, {
      id: "medidor",
      header: () => <><span className="hidden sm:inline">Medidor</span><span className="sm:hidden text-[9px]">Medidor</span></>,
      cell: (info) => (
        <div className="flex justify-center text-[8px] sm:text-[13px] text-gray-900 truncate max-w-[70px] sm:max-w-[150px]" title={String(info.getValue() || "N/A")}>
          {info.getValue() || "N/A"}
        </div>
      ),
    }),
    columnHelper.accessor((row) => getNombreAfiliado(row), {
      id: "afiliado",
      header: () => <><span className="hidden sm:inline">Afiliado</span><span className="sm:hidden text-[9px]">Afiliado</span></>,
      cell: (info) => {
        const valor = info.getValue();
        const textoCorto = valor.length > 18 ? valor.substring(0, 18) + "..." : valor;
        return (
          <div className="flex justify-center text-[8px] sm:text-[13px] text-gray-900" title={valor}>
            <span
              className={`truncate max-w-[70px] sm:max-w-[180px] ${
                valor === "Sin asignar" ? "text-gray-400 italic" : ""
              }`}
            >
              {textoCorto}
            </span>
          </div>
        );
      },
    }),
    columnHelper.accessor("Valor_Lectura_Anterior", {
      header: () => <><span className="hidden sm:inline">Lect. Anterior</span><span className="sm:hidden text-[9px]">L.Ant</span></>,
      cell: (info) => (
        <div className="flex justify-end   truncate max-w-[50px] sm:max-w-[100px]">
          <span className=" text-center text-[8px] sm:text-[13px] text-gray-600">{info.getValue()} m³</span>
        </div>
      ),
    }),
    columnHelper.accessor("Valor_Lectura_Actual", {
      header: () => <><span className="hidden sm:inline">Lect. Actual</span><span className="sm:hidden text-[9px]">L.Act</span></>,
      cell: (info) => (
        <div className="flex justify-end text-[8px] sm:text-[13px] text-gray-600 truncate max-w-[50px] sm:max-w-[100px]">
          <span className="text-center">{info.getValue()} m³</span>
        </div>
      ),
    }),
    columnHelper.accessor("Consumo_Calculado_M3", {
      header: () => <><span className="hidden sm:inline">Consumo</span><span className="sm:hidden text-[9px]">Consumo</span></>,
      cell: (info) => (
        <div className="flex justify-center text-[8px] sm:text-[13px] text-blue-600 font-semibold truncate max-w-[50px] sm:max-w-[100px]">
          {info.getValue()} m³
        </div>
      ),
    }),
    columnHelper.accessor("Fecha_Lectura", {
      header: () => <><span className="hidden sm:inline">Fecha</span><span className="sm:hidden text-[9px]">Fecha</span></>,
      cell: (info) => (
        <div className="flex justify-center text-[8px] sm:text-[13px] text-gray-600 truncate max-w-[60px] sm:max-w-[120px]">
          <span className="hidden sm:inline">{new Date(info.getValue()).toLocaleDateString("es-ES")}</span>
          <span className="sm:hidden">{new Date(info.getValue()).toLocaleDateString("es-ES", { day:"2-digit", month:"2-digit", year:"2-digit" })}</span>
        </div>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: () => <><span className="hidden sm:inline">Acciones</span><span className="sm:hidden text-[9px]">Acciones</span></>,
      cell: (info) => (
        <div className="flex items-center justify-center gap-1 sm:gap-2 max-w-[100px] sm:max-w-[220px]">
          {hasViewPermission && (
            <button
              onClick={() => handleOpenDetailModal(info.row.original)}
              className="px-1.5 py-1 sm:px-2 sm:py-1 bg-slate-600 text-white text-[7px] sm:text-xs rounded hover:bg-slate-700 transition-colors w-auto whitespace-nowrap"
              title="Ver detalles"
            >
              Ver
            </button>
          )}
          {hasEditPermission && (
            <button
              onClick={() => handleOpenUpdateModal(info.row.original)}
              className="px-1.5 py-1 sm:px-2 sm:py-1 bg-blue-600 text-white text-[7px] sm:text-xs rounded hover:bg-blue-700 transition-colors w-auto whitespace-nowrap"
            >
              Editar
            </button>
          )}
        </div>
      ),
    }),
  ];

  // Configurar la tabla
  const table = useReactTable({
    data: lecturas,
    columns,
    state: {
      globalFilter,
      pagination,
    },
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
      <div className="text-center text-red-600 p-4">
        Error al cargar las lecturas
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-3">
        <div className="flex items-start gap-4 flex-col justify-start">
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Lecturas</h2>
          <p className="text-sm text-gray-600 pb-4">Administra las lecturas de los medidores</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between pb-2">
          {/* Filters and Apply Sello - Left/Top */}
          <div className="flex flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2 flex-1 sm:w-auto">
              <button
                onClick={() => setShowFilterModal(true)}
                className={` sm:flex-none justify-center whitespace-nowrap px-2 py-1.5 sm:px-4 sm:py-2 border rounded-md flex items-center gap-1 sm:gap-2 transition-colors text-xs sm:text-sm ${
                  activeFiltersCount > 0
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                <LuFilter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Filtros
                {activeFiltersCount > 0 && (
                  <span className="bg-blue-500 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            <label className="flex sm:flex-none items-center justify-center sm:justify-start gap-2 cursor-pointer px-2 py-1.5 sm:px-4 sm:py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-xs sm:text-sm">
              <input
                type="checkbox"
                checked={isSelloApplied}
                onClick={handleApplySelloCalidadClick}
                readOnly
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-gray-700 font-medium whitespace-nowrap">Aplicar Sello de Calidad</span>
            </label>
          </div>

          <div className="flex w-full flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-end">
            {/* Search - Center */}
            <div className="relative w-full sm:flex-1 sm:max-w-md">
              <LuSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <input
                type="text"
                placeholder="Buscar en todas las columnas..."
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 sm:pl-10 sm:pr-4 sm:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
              />
            </div>

            {/* Create Button - Right */}
            <div className="flex flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {hasCreatePermission && (
                <button
                  onClick={handleOpenInsertModal}
                  className="flex-1 sm:flex-none justify-center bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap px-2 py-1.5 sm:px-4 sm:py-2 rounded-md flex items-center gap-1 sm:gap-2 transition-colors text-xs sm:text-sm"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Nueva Lectura
                </button>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Tabla responsive */}
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
                    {globalFilter ? 'No se encontraron lecturas que coincidan con la búsqueda' : 'No hay lecturas registradas'}
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
              {table.getPageCount()}
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



      {/* Modales */}
      {detailModalOpen && lecturaSeleccionada && (
        <DetailLecturaModal
          lectura={lecturaSeleccionada}
          onClose={handleCloseDetailModal}
        />
      )}

      {updateModalOpen && lecturaSeleccionada && (
        <UpdateLecturaModal
          lectura={lecturaSeleccionada}
          onClose={handleCloseUpdateModal}
        />
      )}

      {insertModalOpen && (
        <InsertarLecturaModal onClose={handleCloseInsertModal} />
      )}

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar acción?</AlertDialogTitle>
            <AlertDialogDescription>
              {isSelloApplied ? (
                "¿Está seguro que desea remover el Sello de Calidad? Los cambios se aplicarán de inmediato."
              ) : (
                "¿Está seguro que desea aplicar el Sello de Calidad? Los montos de las tarifas cambiarán con el sello aplicado."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            
            <AlertDialogAction
              onClick={handleApplySelloCalidad}
            >
              Confirmar
            </AlertDialogAction>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FilterLecturaModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={appliedFilters}
        usuarioOptions={usuarioOptions}
        afiliadoOptions={afiliadoOptions}
        isLoadingUsuarios={isLoadingUsuarios}
        isLoadingAfiliados={isLoadingAfiliados}
      />
    </div>
  );
}
