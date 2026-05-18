import { useState, useMemo, useEffect } from 'react';
import DescargarPdfModal, { type OpcionColumna, type GrupoFiltro } from '@/Modules/Global/components/DescargarPdfModal/DescargarPdfModal';
import { useDownloadModulePdf } from '@/Modules/Global/hooks/useDownloadModulePdf';
import { LuFileDown } from 'react-icons/lu';
import { LuPlus, LuSearch } from 'react-icons/lu';
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender
} from '@tanstack/react-table';
import {
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp
} from "react-icons/md";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/Modules/Global/components/Sidebar/ui/alert-dialog';
import { useMedidores, useMedidoresPorEstado, useUpdateEstadoMedidor, useUpdateEstadoPagoMedidor } from '../../hooks/useMedidores';
import type { Medidor, EstadoPagoMedidorNombre } from '../../models/Medidor';
import CreateMedidorModal from './CreateMedidorModal';
import DetailMedidorModal from './DetailMedidorModal';
import AsignarAfiliadoMedidorModal from './AsignarAfiliadoMedidorModal';
import SubirArchivosMedidorModal from './SubirArchivosMedidorModal';
import { subirArchivosMedidorInventario } from '../../service/MedidorServices';

interface CatalogoMedidoresProps {
  onBack?: () => void;
}

const CatalogoMedidores: React.FC<CatalogoMedidoresProps> = () => {

  const [globalFilter, setGlobalFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAsignarModalOpen, setIsAsignarModalOpen] = useState(false);
  const [isSubirArchivosModalOpen, setIsSubirArchivosModalOpen] = useState(false);
  const [showEstadoPagoDialog, setShowEstadoPagoDialog] = useState(false);
  const [medidorEstadoPagoSeleccionado, setMedidorEstadoPagoSeleccionado] = useState<Medidor | null>(null);
  const [selectedMedidor, setSelectedMedidor] = useState<Medidor | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<string>('Todos');
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const { mutate: downloadPdf, isPending: isDownloadingPdf } = useDownloadModulePdf();
  const [estadoPagoFilter, setEstadoPagoFilter] = useState<string>('Todos');
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


  // Llama todos los hooks en el nivel superior del componente
  const medidoresTodos = useMedidores();
  const medidoresNoInstalados = useMedidoresPorEstado('no-instalados');
  const medidoresInstalados = useMedidoresPorEstado('instalados');
  const medidoresAveriados = useMedidoresPorEstado('averiados');
  const medidoresPendientes = useMedidoresPorEstado('pendientes');
  const updateEstadoMutation = useUpdateEstadoMedidor();
  const updateEstadoPagoMutation = useUpdateEstadoPagoMedidor();

  // Selecciona los datos y estados según el filtro
  let medidores: Medidor[] = [];
  let isLoading = false;
  let error: unknown = null;
  let refetch = () => { };

  if (estadoFilter === 'No instalado') {
    medidores = medidoresNoInstalados.data ?? [];
    isLoading = medidoresNoInstalados.isLoading;
    error = medidoresNoInstalados.error;
    refetch = medidoresNoInstalados.refetch;
  } else if (estadoFilter === 'Instalado') {
    medidores = medidoresInstalados.data ?? [];
    isLoading = medidoresInstalados.isLoading;
    error = medidoresInstalados.error;
    refetch = medidoresInstalados.refetch;
  } else if (estadoFilter === 'Averiado') {
    medidores = medidoresAveriados.data ?? [];
    isLoading = medidoresAveriados.isLoading;
    error = medidoresAveriados.error;
    refetch = medidoresAveriados.refetch;
  } else if (estadoFilter === 'Pendiente') {
    medidores = medidoresPendientes.data ?? [];
    isLoading = medidoresPendientes.isLoading;
    error = medidoresPendientes.error;
    refetch = medidoresPendientes.refetch;
  } else {
    medidores = medidoresTodos.data ?? [];
    isLoading = medidoresTodos.isLoading;
    error = medidoresTodos.error;
    refetch = medidoresTodos.refetch;
  }


  const pageSizeOptions = [5, 10, 20, 50];
  const [pagination, setPagination] = useState({
    pageSize: 5,
    pageIndex: 0,
  });

  const handleViewDetail = (medidor: Medidor) => {
    setSelectedMedidor(medidor);
    setIsDetailModalOpen(true);
  };

  const handleCambiarEstado = async (medidor: Medidor) => {
    setSelectedMedidor(medidor);
    try {
      await updateEstadoMutation.mutateAsync({
        idMedidor: medidor.Id_Medidor,
        idEstado: 2,
      });
      refetch();
    } catch (error) {
      console.error('Error al cambiar estado del medidor:', error);
    }
  };


  const handleToggleEstado = async (medidor: Medidor, nuevoEstadoId: number) => {

    try {
      await updateEstadoMutation.mutateAsync({
        idMedidor: medidor.Id_Medidor,
        idEstado: nuevoEstadoId,
      });
      refetch();
    } catch (error) {
      console.error('Error al cambiar estado del medidor:', error);
    }
  };

  const getEstadoPagoNombre = (medidor: Medidor): EstadoPagoMedidorNombre => {
    if (!medidor.Afiliado) return 'Libre';

    const estadoPagoRaw = medidor.Estado_Pago;
    const nombre = typeof estadoPagoRaw === 'string'
      ? estadoPagoRaw
      : estadoPagoRaw?.Nombre_Estado_Pago;

    if (nombre === 'Pagado' || nombre === 'Pendiente' || nombre === 'Libre') {
      return nombre;
    }

    return 'Pendiente';
  };

  const medidoresFiltrados = useMemo(() => {
    if (estadoPagoFilter === 'Todos') return medidores;
    return medidores.filter(m => getEstadoPagoNombre(m) === estadoPagoFilter);
  }, [medidores, estadoPagoFilter]);

  const medidoresConBusqueda = useMemo(() => {
    if (!globalFilter) return medidoresFiltrados;

    const searchLower = globalFilter.toLowerCase();
    return medidoresFiltrados.filter(m => {
      const numero = m.Numero_Medidor?.toString().toLowerCase() || '';
      const estado = m.Estado_Medidor?.Nombre_Estado_Medidor?.toLowerCase() || '';
      const estadoPago = getEstadoPagoNombre(m).toLowerCase();

      // Obtener nombre del afiliado usando la misma lógica que en la columna
      let afiliadoNombre = '';
      if (m.Afiliado) {
        if (m.Afiliado.Tipo_Entidad === 1) {
          afiliadoNombre = `${m.Afiliado.Nombre || ''} ${m.Afiliado.Primer_Apellido || ''} ${m.Afiliado.Segundo_Apellido || ''}`.trim();
          if (!afiliadoNombre) afiliadoNombre = m.Afiliado.Nombre_Completo || '';
        } else if (m.Afiliado.Tipo_Entidad === 2) {
          afiliadoNombre = m.Afiliado.Razon_Social || m.Afiliado.Nombre_Completo || '';
        } else {
          afiliadoNombre = m.Afiliado.Nombre_Completo || m.Afiliado.Razon_Social || '';
        }
      }
      afiliadoNombre = afiliadoNombre.toLowerCase();

      return (
        numero.includes(searchLower) ||
        afiliadoNombre.includes(searchLower) ||
        estado.includes(searchLower) ||
        estadoPago.includes(searchLower)
      );
    });
  }, [medidoresFiltrados, globalFilter]);

  const openEstadoPagoDialog = (medidor: Medidor) => {
    if (!medidor.Afiliado) return;
    const actual = getEstadoPagoNombre(medidor);
    if (actual !== 'Pendiente') return;
    setMedidorEstadoPagoSeleccionado(medidor);
    setShowEstadoPagoDialog(true);
  };

  const handleActualizarEstadoPago = async () => {
    if (!medidorEstadoPagoSeleccionado) return;

    try {
      await updateEstadoPagoMutation.mutateAsync({
        idMedidor: medidorEstadoPagoSeleccionado.Id_Medidor,
        estadoPago: 'Pagado',
      });
      setShowEstadoPagoDialog(false);
      setMedidorEstadoPagoSeleccionado(null);
      refetch();
    } catch (error) {
      console.error('Error al actualizar estado de pago:', error);
    }
  };

  const columnHelper = createColumnHelper<Medidor>();

  const columns = useMemo(
    () => [
      columnHelper.accessor('Numero_Medidor', {
        id: 'numero',
        header: () => <><span className="hidden sm:inline">Número del Medidor</span><span className="sm:hidden text-[9px]"># Medidor</span></>,
        cell: info => (
          <button
            className="font-medium transition-colors text-left w-full text-[10px] sm:text-[13px]"
            onClick={() => handleViewDetail(info.row.original)}
          >
            {info.getValue()}
          </button>
        ),
      }),
      columnHelper.accessor('Afiliado', {
        id: 'afiliado',
        header: 'Afiliado',
        cell: info => {
          const afiliado = info.row.original.Afiliado;

          if (!afiliado) {
            return (
              <div className="text-gray-600 text-left text-[10px] sm:text-[13px] truncate max-w-[80px] sm:max-w-xs">
                Sin asignar
              </div>
            );
          }

          // Determinar el nombre según el tipo de entidad
          let nombre: string;
          if (afiliado.Tipo_Entidad === 1) {
            // Persona Física - construir nombre completo
            nombre = `${afiliado.Nombre || ''} ${afiliado.Primer_Apellido || ''} ${afiliado.Segundo_Apellido || ''}`.trim();
            // Fallback a campo legacy si no hay datos nuevos
            if (!nombre) nombre = afiliado.Nombre_Completo || 'Sin nombre';
          } else if (afiliado.Tipo_Entidad === 2) {
            // Persona Jurídica - usar razón social
            nombre = afiliado.Razon_Social || afiliado.Nombre_Completo || 'Sin nombre';
          } else {
            // Fallback para datos legacy
            nombre = afiliado.Nombre_Completo || afiliado.Razon_Social || 'Sin nombre';
          }

          return (
            <div className="flex justify-start">
              <span className='text-gray-600 text-left max-w-[80px] sm:max-w-xs truncate text-[10px] sm:text-[13px]' title={nombre}>{nombre}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor('Estado_Medidor.Nombre_Estado_Medidor', {
        id: 'estado_medidor',
        header: 'Estado',
        cell: info => {
          const estado = info.getValue();
          let colorClass = '';

          if (estado === 'No instalado') {
            colorClass = 'bg-orange-100 text-orange-700 border border-orange-300';
          } else if (estado === 'Instalado') {
            colorClass = 'bg-emerald-100 text-emerald-700 border border-emerald-300';
          } else if (estado === 'Averiado') {
            colorClass = 'bg-red-100 text-red-700 border border-red-300';
          }
          else if (estado === 'Desconectado') {
            colorClass = 'bg-red-100 text-red-700 border border-red-300';  //se sigue viendo gris xddd
          }

          return (
            <div className="flex justify-start">
              <span className={`px-1.5 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-xs font-semibold rounded-full whitespace-nowrap ${colorClass}`}>
                {estado}
              </span>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'estado_pago',
        header: () => <><span className="hidden sm:inline">Estado Pago</span><span className="sm:hidden text-[9px]">Pago</span></>,
        cell: info => {
          const estadoPago = getEstadoPagoNombre(info.row.original);
          
          let colorClass = '';
          if (estadoPago === 'Libre') {
            colorClass = 'bg-slate-100 text-slate-700 border border-slate-300';
          } else if (estadoPago === 'Pagado') {
            colorClass = 'bg-blue-100 text-blue-700 border border-blue-300';
          } else {
            colorClass = 'bg-yellow-100 text-yellow-700 border border-yellow-300';
          }

          return (
            <div className="flex justify-center">
              <span className={`px-1.5 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-xs font-semibold rounded-full whitespace-nowrap ${colorClass}`}>
                {estadoPago}
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
            {(() => {
              const estadoId = info.row.original.Estado_Medidor?.Id_Estado_Medidor;
              const tieneAfiliado = Boolean(info.row.original.Afiliado);
              const estadoPagoActual = getEstadoPagoNombre(info.row.original);
              const puedeMarcarPagado = tieneAfiliado && estadoPagoActual === 'Pendiente';

              if (estadoId === 1) {
                return (
                  <>
                    <button
                      className="px-1.5 py-1 sm:px-2 sm:py-1 bg-blue-600 text-white text-[9px] sm:text-xs rounded hover:bg-blue-700 transition-colors w-auto whitespace-nowrap"
                      onClick={() => handleCambiarEstado(info.row.original)}
                      title="Cambiar estado"
                    >
                      <span className="hidden sm:inline">Cambiar Estado</span>
                      <span className="sm:hidden">Estado</span>
                    </button>
                    <button
                      className="px-1.5 py-1 sm:px-2 sm:py-1 bg-green-600 text-white text-[9px] sm:text-xs rounded hover:bg-green-700 transition-colors w-auto whitespace-nowrap"
                      onClick={() => {
                        setSelectedMedidor(info.row.original);
                        setIsAsignarModalOpen(true);
                      }}
                      title="Asignar a afiliado"
                    >
                      Asignar
                    </button>
                    {puedeMarcarPagado && (
                      <button
                        className="px-1.5 py-1 sm:px-2 sm:py-1 bg-blue-600 text-white text-[9px] sm:text-xs rounded hover:bg-blue-700 transition-colors w-auto whitespace-nowrap"
                        onClick={() => openEstadoPagoDialog(info.row.original)}
                        title="Marcar como pagado"
                      >
                        <span className="hidden sm:inline">Marcar Pagado</span>
                        <span className="sm:hidden">Pagar</span>
                      </button>
                    )}
                  </>
                );
              }

              if (estadoId === 2) {
                const sinArchivos =
                  !info.row.original.Certificacion_Literal && !info.row.original.Planos_Terreno;
                return (
                  <>
                    {sinArchivos && (
                      <button
                        className="px-1.5 py-1 sm:px-2 sm:py-1 bg-amber-500 text-white text-[9px] sm:text-xs rounded hover:bg-amber-600 transition-colors w-auto whitespace-nowrap"
                        onClick={() => {
                          setSelectedMedidor(info.row.original);
                          setIsSubirArchivosModalOpen(true);
                        }}
                        title="Subir archivos del terreno"
                      >
                        <span className="hidden sm:inline">Subir Archivos</span>
                        <span className="sm:hidden">Archivos</span>
                      </button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="px-1.5 py-1 sm:px-2 sm:py-1 bg-red-600 text-white text-[9px] sm:text-xs rounded hover:bg-red-700 transition-colors w-auto whitespace-nowrap"
                          disabled={updateEstadoMutation.isPending}
                          title="Marcar como averiado"
                        >
                          <span className="hidden sm:inline">Averiado</span>
                          <span className="sm:hidden">Averiado</span>
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="w-[90vw] max-w-lg mx-auto p-4 sm:p-6 rounded-xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            <span>¿Marcar medidor como averiado?</span>
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            <span>¿Estás seguro de que deseas marcar el medidor #{info.row.original.Numero_Medidor} como averiado?</span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogAction
                            onClick={() => handleToggleEstado(info.row.original, 3)}
                            disabled={updateEstadoMutation.isPending}
                          >
                            <span>Marcar Averiado</span>
                          </AlertDialogAction>
                          <AlertDialogCancel>
                            <span>Cancelar</span>
                          </AlertDialogCancel>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    {puedeMarcarPagado && (
                      <button
                        className="px-1.5 py-1 sm:px-2 sm:py-1 bg-blue-600 text-white text-[9px] sm:text-xs rounded hover:bg-blue-700 transition-colors w-auto whitespace-nowrap"
                        onClick={() => openEstadoPagoDialog(info.row.original)}
                        title="Marcar como pagado"
                      >
                        <span className="hidden sm:inline">Marcar Pagado</span>
                        <span className="sm:hidden">Pagar</span>
                      </button>
                    )}
                  </>
                );
              }

              if (estadoId === 3) {
                return (
                  <>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="px-1.5 py-1 sm:px-2 sm:py-1 bg-green-600 text-white text-[9px] sm:text-xs rounded hover:bg-green-700 transition-colors w-auto whitespace-nowrap"
                          disabled={updateEstadoMutation.isPending}
                          title="Marcar como reparado"
                        >
                          <span className="hidden sm:inline">Reparar</span>
                          <span className="sm:hidden">Reparar</span>
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="w-[90vw] max-w-lg mx-auto p-4 sm:p-6 rounded-xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            <span>¿Marcar medidor como reparado?</span>
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            <span>¿Estás seguro de que deseas marcar el medidor #{info.row.original.Numero_Medidor} como reparado? Volverá a estado "Instalado".</span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogAction
                            onClick={() => handleToggleEstado(info.row.original, 2)}
                            disabled={updateEstadoMutation.isPending}
                          >
                            <span>Marcar Reparado</span>
                          </AlertDialogAction>
                          <AlertDialogCancel>
                            <span>Cancelar</span>
                          </AlertDialogCancel>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    {puedeMarcarPagado && (
                      <button
                        className="px-1.5 py-1 sm:px-2 sm:py-1 bg-blue-600 text-white text-[9px] sm:text-xs rounded hover:bg-blue-700 transition-colors w-auto whitespace-nowrap"
                        onClick={() => openEstadoPagoDialog(info.row.original)}
                        title="Marcar como pagado"
                      >
                        <span className="hidden sm:inline">Marcar Pagado</span>
                        <span className="sm:hidden">Pagar</span>
                      </button>
                    )}
                  </>
                );
              }

              return null;
            })()}
          </div>
        ),
      }),
    ],
    [updateEstadoMutation.isPending, updateEstadoPagoMutation.isPending]
  );

  const table = useReactTable({
    data: medidoresConBusqueda,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination,
    },
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
        <div className="animate-spin rounded-full size-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando medidores...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Error al cargar los medidores. Por favor, intenta nuevamente.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-3">
        <div className="flex items-start gap-4 flex-col justify-start">
          <h2 className="text-2xl font-semibold text-gray-900">Catálogo de Medidores</h2>
          <p className="text-sm text-gray-600 pb-4">Gestiona los medidores del inventario</p>
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
                <option value="Todos">Todos los medidores</option>
                <option value="No instalado">No instalado</option>
                <option value="Instalado">Instalado</option>
                <option value="Averiado">Averiado</option>
              </select>
            </div>
            <button
              onClick={() => setIsDownloadOpen(true)}
              disabled={isDownloadingPdf}
              className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors text-xs sm:text-sm whitespace-nowrap disabled:opacity-50"
              title="Descargar PDF"
            >
              <LuFileDown className="size-4" />
              {isDownloadingPdf ? 'Generando…' : 'Descargar PDF'}
            </button>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <label htmlFor='estadoPago' className="text-xs sm:text-sm font-medium text-gray-700">Pago:</label>
              <select
                id='estadoPago'
                value={estadoPagoFilter}
                onChange={(e) => setEstadoPagoFilter(e.target.value)}
                className="px-2 py-1.5 sm:px-3 sm:py-2 border bor                                                             der-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
              >
                <option value="Todos">Todos</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Pagado">Pagado</option>
                <option value="Libre">Libre</option>
              </select>
            </div>
          </div>
          
          {/* Fila 2 en móvil: Búsqueda */}
          <div className="w-full flex gap-2 sm:flex-1 sm:max-w-md ">
            <div className="relative w-full">
              <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4 sm:size-5" />
              <input
                type="text"
                placeholder="Buscar medidores..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg flex items-center gap-2 transition-colors text-xs sm:text-sm whitespace-nowrap"
            >
              <LuPlus className="size-4" />
              Nuevo Medidor
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
                              aria-label={`Ordenar por ${typeof header.column.columnDef.header === 'string' ? header.column.columnDef.header : header.id}`}
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
                          <span className={index === 0 ? 'text-left flex items-center' : 'text-center flex justify-center items-center'}>
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
                  <td colSpan={columns.length} className="px-2 sm:px-4 py-8 text-center text-slate-500">
                    {globalFilter ? 'No se encontraron medidores que coincidan con la búsqueda' : 'No hay medidores registrados'}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-sky-50 cursor-pointer transition-colors">
                    {row.getVisibleCells().map((cell, index) => (
                      <td key={cell.id} className={`px-2 sm:px-4 py-3 text-xs sm:text-sm text-slate-700 align-middle ${index === 0 ? 'text-left' : 'text-center'
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
              <MdKeyboardDoubleArrowLeft className="size-3.5 sm:size-5" />
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1 sm:p-2 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Página anterior"
            >
              <MdKeyboardArrowLeft className="size-3.5 sm:size-5" />
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
              <MdKeyboardArrowRight className="size-3.5 sm:size-5" />
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="p-1 sm:p-2 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Última página"
            >
              <MdKeyboardDoubleArrowRight className="size-3.5 sm:size-5" />
            </button>
          </div>
        </div>
      </div>

      <CreateMedidorModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {selectedMedidor && (
        <DetailMedidorModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedMedidor(null);
          }}
          medidor={selectedMedidor}
        />
      )}

      {selectedMedidor && (
        <AsignarAfiliadoMedidorModal
          isOpen={isAsignarModalOpen}
          onClose={() => {
            setIsAsignarModalOpen(false);
            setSelectedMedidor(null);
          }}
          medidor={selectedMedidor}
          onSuccess={() => {
            refetch();
            setNotification({
              type: 'success',
              title: 'Medidor asignado',
              description: `El medidor #${selectedMedidor.Numero_Medidor} fue asignado correctamente.`,
            });
          }}
        />
      )}

      {selectedMedidor && (
        <SubirArchivosMedidorModal
          isOpen={isSubirArchivosModalOpen}
          numeroMedidor={selectedMedidor.Numero_Medidor}
          onClose={() => {
            setIsSubirArchivosModalOpen(false);
            setSelectedMedidor(null);
          }}
          onSubir={(cert, planos) =>
            subirArchivosMedidorInventario(selectedMedidor.Id_Medidor, cert, planos)
          }
          onSuccess={() => {
            refetch();
            setNotification({
              type: 'success',
              title: 'Archivos subidos',
              description: `Los archivos del medidor #${selectedMedidor.Numero_Medidor} fueron guardados correctamente.`,
            });
          }}
        />
      )}

      <AlertDialog open={showEstadoPagoDialog} onOpenChange={setShowEstadoPagoDialog}>
        <AlertDialogContent className="w-[90vw] max-w-lg mx-auto p-4 sm:p-6 rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cambio de estado de pago</AlertDialogTitle>
            <AlertDialogDescription>
              Desea cambiar el estado de Pendiente a Pagado para el medidor #{medidorEstadoPagoSeleccionado?.Numero_Medidor}?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogAction
              onClick={handleActualizarEstadoPago}
              disabled={updateEstadoPagoMutation.isPending}
            >
              {updateEstadoPagoMutation.isPending ? 'Actualizando…' : 'Si, cambiar'}
            </AlertDialogAction>
            <AlertDialogCancel disabled={updateEstadoPagoMutation.isPending}>Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DescargarPdfModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        titulo="Descargar Medidores"
        descripcion="Filtra por estado y columnas. Genera reporte PDF descargable."
        grupos={[
          {
            key: 'estados',
            titulo: 'Estados a incluir',
            ayuda: 'Si no seleccionas ningún estado, se incluirán todos por defecto.',
            opciones: (() => {
              const map = new Map<number, string>();
              (medidoresTodos.data ?? []).forEach((m: any) => {
                const id = m.Estado_Medidor?.Id_Estado_Medidor;
                const label = m.Estado_Medidor?.Nombre_Estado_Medidor;
                if (typeof id === 'number' && label) map.set(id, label);
              });
              return Array.from(map.entries())
                .map(([id, label]) => ({ id, label }))
                .sort((a, b) => a.label.localeCompare(b.label, 'es'));
            })(),
          } as GrupoFiltro,
        ]}
        columnas={[
          { key: 'numero',   label: 'N° Medidor',    obligatoria: true },
          { key: 'estado',   label: 'Estado' },
          { key: 'afiliado', label: 'Afiliado' },
          { key: 'pago',     label: 'Estado Pago' },
          { key: 'creacion', label: 'Fecha creación' },
        ] as OpcionColumna[]}
        rangoFecha={{ ayuda: 'Filtra por fecha de creación del medidor.' }}
        isLoading={isDownloadingPdf}
        onConfirm={(f) => {
          const estadosSel = (f.grupos.estados ?? []).filter((v): v is number => typeof v === 'number');
          downloadPdf({
            url: '/Inventario/medidores/pdf',
            filename: `Medidores_${new Date().toISOString().slice(0, 10)}`,
            payload: {
              estados: estadosSel.length ? estadosSel : undefined,
              columnas: f.columnas.length ? f.columnas : undefined,
              fechaInicio: f.fechaInicio,
              fechaFin: f.fechaFin,
            },
          }, { onSuccess: () => setIsDownloadOpen(false) });
        }}
      />
    </div>
  );
};

export default CatalogoMedidores;